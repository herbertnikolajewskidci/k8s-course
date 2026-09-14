# Aufgabe 4: Kubelet TLS-Zertifikate & Systemd Node-Reparatur

- **CKA Domäne:** Troubleshooting (30%) & Cluster Architecture (25%)
- **Lernberg-Stufe:** Hang → Gipfel
- **Issue:** #12
- **Prüfungsreferenz:** Killer.sh Sim B (Question 3 & Question 6)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Der doppelte Ausweis des Kubelets (Client vs. Server TLS)

Ein Kubelet führt auf jedem Kubernetes-Node eine Doppelrolle aus und benötigt
daher **zwei getrennte TLS-Zertifikate** unter `/var/lib/kubelet/pki/`:

1. **Ausgehender Verkehr (Kubelet als Client):**
   Wenn das Kubelet mit dem `kube-apiserver` spricht (z. B. Node-Status melden,
   Pod-Updates abholen), agiert es als TLS-Client.
   - Datei: `/var/lib/kubelet/pki/kubelet-client-current.pem`
   - Rolle im Zertifikat (`Extended Key Usage`):
     `TLS Web Client Authentication` (in CSR-Spec: `client auth`)
   - Aussteller (`Issuer`): Die Cluster-CA (`CN = kubernetes`).

2. **Eingehender Verkehr (Kubelet als Server):**
   Wenn der `kube-apiserver` das Kubelet abfragt (z. B. bei `kubectl logs`,
   `kubectl exec`), agiert das Kubelet als HTTPS-Server auf Port 10250.
   - Datei: `/var/lib/kubelet/pki/kubelet.crt`
   - Rolle im Zertifikat (`Extended Key Usage`):
     `TLS Web Server Authentication` (in CSR-Spec: `server auth`)
   - Aussteller (`Issuer`): Meist eine lokale Node-CA
     (z. B. `CN = <nodename>-ca@...`).

### Live verifizierte Fundstellen auf `kubernetes.io/docs`

Folgende Seiten wurden live via Docs-Abruf verifiziert und liefern dir im
erlaubten Tab exakt die benötigten Strukturen:

1. **Zertifikats-Arten und Key-Usages:**
   - **Suchbegriff:** `PKI certificates and requirements`
   - **Gefundene Seite:** `setup/best-practices/certificates/`
   - **Abschnitt:** `All certificates`
   - **Tabelle wörtlich vor Ort:**
     - `server`: `digital signature, key encipherment, server auth`
     - `client`: `digital signature, key encipherment, client auth`
   - **Abschnitt:** `Kubelet's server and client certificates`
     (Erläutert die Trennung zwischen Client-Zertifikat zum API-Server und
     Server-Zertifikat auf Port 10250).

2. **Kubelet-Zertifikate, Pfade und Rotation:**
   - **Suchbegriff:** `Certificate Management with kubeadm`
   - **Gefundene Seite:** `tasks/administer-cluster/kubeadm/kubeadm-certs/`
   - **Abschnitt:** `Certificate expiry and management`
   - **Wörtliche Fundstelle:** Erläutert, dass Kubelet-Client-Zertifikate unter
     `/var/lib/kubelet/pki/kubelet-client-current.pem` rotieren und wie
     `kubeadm certs check-expiration` bzw. `kubelet.conf` damit verknüpft sind.
   - **Abschnitt:** `Enabling signed kubelet serving certificates`
     (Zeigt die Konfiguration für Kubelet-Server-Zertifikate).

3. **Node NotReady & Kubelet Logging:**
   - **Suchbegriff:** `Troubleshooting Clusters`
   - **Gefundene Seite:** `tasks/debug/debug-cluster/`
   - **Abschnitt:** `Looking at logs` → `Worker Nodes`
   - **Wörtliche Fundstelle:**
     > *"On systemd-based systems, you may need to use `journalctl` instead of
     > examining log files."*
     Verweist auf Kubelet als systemd-Dienst.

### Der Systemd-Lebenszyklus bei Node NotReady

Wenn ein Node im Cluster `NotReady` meldet, ist fast immer der Systemd-Dienst
`kubelet` ausgefallen. Die Ursachenkette verläuft hierarchisch:

```text
systemctl status kubelet
       ↓ (Fehlerzeile identifizieren)
journalctl -u kubelet -e --no-pager -n 50
       ↓ (z. B. ExecStart binary not found oder Config-Syntax)
vim /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
       ↓ (Pfad/Parameter korrigieren)
systemctl daemon-reload && systemctl restart kubelet
       ↓ (Ready-Status & Pod-Scheduling prüfen)
kubectl get nodes && kubectl run test-pod --image=nginx:1-alpine
```

**Wichtigste Regel bei Systemd-Änderungen:**
Wird eine Unit-Datei oder ein Drop-In editiert, ignoriert `systemctl restart`
die Änderungen, bis zwingend `systemctl daemon-reload` ausgeführt wurde!

---

## 2. Aufgabenstellung (Exakter Killer.sh-Standard)

Deine Lösungen trägst du in `Aufgabe-4-solution.md` ein.

### Aufgabe 4.1: Kubelet Client/Server Zertifikats-Forensik (Killer.sh Sim B Q3)

Auf dem Worker-Knoten `cka-cluster-worker` wurde das Kubelet via kubeadm TLS
Bootstrapping registriert.

Verbinde dich auf den Node:

```bash
docker exec -it cka-cluster-worker bash
```

Untersuche die Zertifikate unter `/var/lib/kubelet/pki/`:

1. **Client-Zertifikat:**
   - Analysiere `/var/lib/kubelet/pki/kubelet-client-current.pem`.
   - Ermittle den **Issuer** und den Wert für **Extended Key Usage**.
2. **Server-Zertifikat:**
   - Analysiere `/var/lib/kubelet/pki/kubelet.crt`.
   - Ermittle den **Issuer** und den Wert für **Extended Key Usage**.
3. **Formatierte Ausgabe:**
   Schreibe die extrahierten Werte in die Datei `/tmp/certificate-info.txt`
   exakt nach folgendem Format:

   ```text
   Issuer: <Wert>
   X509v3 Extended Key Usage: <Wert>
   Issuer: <Wert>
   X509v3 Extended Key Usage: <Wert>
   ```

4. **Minimaler Einzeiler:**
   Notiere den minimalen Bash-/OpenSSL-Einzeiler, mit dem du diese Felder
   zielgerichtet ohne Scrollen ausliest.

---

### Aufgabe 4.2: Node NotReady – Kubelet Systemd Reparatur (Killer.sh Sim B Q6)

Auf dem Worker-Knoten `cka-cluster-worker2` schlägt der Kubelet-Start fehl und
der Knoten wechselt im Cluster auf den Status `NotReady`.

Verbinde dich auf den fehlerhaften Node:

```bash
docker exec -it cka-cluster-worker2 bash
```

1. **Fehler-Isolation:**
   - Führe die Diagnose durch und finde die exakte Fehlerursache für das
     Scheitern des Dienstes.
   - Welcher Pfad zur Systemd-Drop-In Konfiguration wird verwendet?
2. **Reparatur:**
   - Angenommen, in der Datei `10-kubeadm.conf` wurde der Binärpfad manipuliert
     (z. B. `/usr/local/bin/kubelet` statt `/usr/bin/kubelet` oder eine falsche
     Environment-Variable).
   - Welche Schritte und Befehle führst du aus, um den Fehler zu beheben und
     den Dienst wieder in den Zustand `active (running)` zu versetzen?
3. **Funktions-Verifikation (End-to-End):**
   - Prüfe den Node-Status.
   - Starte einen Test-Pod `success` mit dem Image `nginx:1-alpine` im Namespace
     `default` und verifiziere, dass er den Status `Running` erreicht.

---

## 3. Deine Lösung (Befehle / Notizen)

Trage deine Befehle und Notizen bitte in die separate Datei
`Aufgabe-4-solution.md` ein.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

- **OpenSSL X509 Flags:**
  - `-noout`: Unterdrückt die Rohausgabe des Zertifikatblocks.
  - `-text`: Gibt alle Zertifikatsfelder in Textform aus.
  - `-in <path>`: Pfad zur Zertifikatsdatei.
- **Wichtige Grep-Filter:**
  - `grep -E "Issuer|Extended Key Usage" -A1`
- **Typische Pfade im Kubeadm-Cluster:**
  - Kubelet PKI: `/var/lib/kubelet/pki/`
  - Drop-In Konfiguration:
    `/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf`
    oder `/etc/systemd/system/kubelet.service.d/10-kubeadm.conf`
  - Kubelet Config: `/var/lib/kubelet/config.yaml`
- **Systemd-Kette:**
  - `systemctl daemon-reload`
  - `systemctl restart kubelet`
  - `systemctl status kubelet`

---

## 5. Feedback & Korrekturen

### Review zu deiner Lösung

Du hast beide Aufgaben erfolgreich gelöst:

- Die Zertifikatsabfrage für Client- und Server-Zertifikat via `openssl`
  inklusive Grep-Filter auf `issuer` und `extended` ist syntaktisch exakt.
- Die Fehler-Isolation (`status=203/EXEC`), der Drop-In Pfad, die Reparatur
  von `/usr/local/bin/kubelet` auf `/usr/bin/kubelet` und die Systemd-Kette
  wurden vollständig und sauber umgesetzt.
- Dein Pod `success` läuft tatsächlich auf `cka-cluster-worker2`
  (`IP: 10.244.1.87, Node: cka-cluster-worker2`).

Dein berechtigter Einwand zur Pod-Platzierung ist absolut valide: Wenn im Cluster
mehrere Nodes existieren, entscheidet der Scheduler. Um sicherzustellen, dass
der Test-Pod wirklich auf dem reparierten Node landet, verifiziert man dies mit
`kubectl get pod <name> -o wide` (Spalte `NODE`).

---

### Doku- & CLI-Navigationspfade (Lösen ohne Auswendiglernen)

Hier ist die systematische Anleitung, wie du in der Prüfung ohne
Gedächtnisballast in Sekunden an die richtigen Schalter und Befehle kommst:

#### 1. OpenSSL X509 Parameter herleiten (Statt Flags auswendig lernen)

Wenn du im Terminal sitzt und nicht sicher bist, welche Flags `openssl`
braucht:

- **Eingabe:** `openssl x509 -help`
  *(oder `openssl x509 -help 2>&1 | grep -E "text|noout|issuer" -i`)*
- **Was du siehst:**
  - `-text`: Print the certificate in text form
  - `-noout`: Do not output the encoded certificate
  - `-issuer`: Prints the issuer of the certificate
  - `-dates`: Both Before and After dates of cert
- **Takeaway:** Du musst nur `openssl x509 -help` kennen. Die Tool-Hilfe
  liefert dir alle Schalter sofort.

#### 2. Kubelet Logging & Journalctl herleiten (Doku & CLI)

Wenn du Kubelet debuggen musst und dir die Flags für `journalctl` entfallen:

1. **Pfad über die offizielle Doku (`kubernetes.io/docs`):**
   - **Suche:** `logging architecture`
   - **Abschnitt:** `System component logs` → `Log locations`
   - **Dort steht schwarz auf weiß:** `journalctl -u kubelet`
2. **Flags über Linux-CLI ermitteln (Kein Pager-Blockieren):**
   - **Eingabe:** `journalctl -h | grep -E "pager|end"`
   - **Ergebnis:**
     - `-e, --pager-end`: Direkt ans Ende springen.
     - `--no-pager`: Nicht in den Pager umleiten.
3. **Der universelle Unix-Bypass (Wenn du keine Flags nachschlagen willst):**
   - Sobald du einen Befehl an eine Pipe hängst, schaltet Linux den interaktiven
     Pager automatisch ab:

     ```bash
     journalctl -u kubelet | tail -n 30
     ```

     `tail -n 30` zeigt dir immer die letzten 30 Zeilen im Terminal, ohne
     dass du jemals mit `q` aus einem Pager rausmusst.

#### 3. Kubelet Systemd Drop-Ins & ExecStart Pfade finden

Wenn ein Kubelet nach `systemctl status` den Fehler `status=203/EXEC` oder
einen falschen Pfad wirft:

1. **Drop-In Pfad direkt ausgeben lassen:**
   In der Ausgabe von `systemctl status kubelet` steht in Zeile 3:
   `Drop-In: /etc/systemd/system/kubelet.service.d` (bzw. `/usr/lib/...`).
2. **Die Datei anzeigen:**
   Mit `cat /etc/systemd/system/kubelet.service.d/*.conf` siehst du sofort
   alle aktiven Überschreibungen.
3. **Wahren Pfad des Kubelet-Binaries finden:**

   ```bash
   which kubelet
   ```

   Zeigt dir sofort den realen Pfad (z. B. `/usr/bin/kubelet`).
4. **Systemd-Kette ausführen:**
   Systemd warnt dich bei Änderungen sogar selbst im Status: *"Run 'systemctl
   daemon-reload' to reload units."*

   ```bash
   systemctl daemon-reload && systemctl restart kubelet
   ```

#### 4. Zielgerichtete Node-Verifikation (Pod-Platzierung absichern)

Um zu garantieren, dass ein Verifikations-Pod auf dem Ziel-Node getestet wird:

- **Schritt 1:** `kubectl run success --image=nginx:1-alpine`
- **Schritt 2:**

  ```bash
  kubectl get pod success -o wide
  ```

  Prüfe in der Spalte `NODE`, ob dort `cka-cluster-worker2` steht.
- **Alternative (Erzwungenes Scheduling):**

  ```bash
  kubectl run success --image=nginx:1-alpine \
    --overrides='{"spec":{"nodeName":"cka-cluster-worker2"}}'
  ```

  Damit umgehst du den Scheduler komplett und bindest den Pod direkt an den
  reparierten Knoten.
