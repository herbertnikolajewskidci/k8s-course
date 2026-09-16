# Aufgabe Q14: etcd Backup & Snapshot Verification (etcdutl)

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka8448`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/8 Punkte, Snapshot nicht erstellt)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Der etcd-Speicher ist das **Gehirn des gesamten Clusters**:

- Geht etcd verloren, ist der Cluster tot, selbst wenn alle Nodes laufen.
- **Die 3 Säulen jeder sicheren TLS-Verbindung:**
  1. **CA (`ca.crt`):** Das beglaubigende Amt (*Certificate Authority*).  
     → Parameter: `--cacert` (in der Doku: `<trusted-ca-file>`).
  2. **Cert (`server.crt`):** Der Ausweis des Servers selbst.  
     → Parameter: `--cert` (in der Doku: `<cert-file>`).
  3. **Key (`server.key`):** Der private Haustürschlüssel des Servers.  
     → Parameter: `--key` (in der Doku: `<key-file>`).

### Die Zero-Memorization-Strategie für die Prüfung

Du musst weder die Pfade noch komplizierte `grep`-Suchmuster auswendig wissen:

1. **Die Doku liefert die fertige Schablone (Copy-Paste):**  
   Auf der offiziellen Dokumentationsseite unter *Backing up an etcd cluster*
   steht der exakte Befehl mit sprechenden Platzhaltern bereit.
2. **`etcd.yaml` zeigt alle Werte direkt im Kopf:**  
   Die Startargumente des Static Pods stehen direkt in den ersten 30 Zeilen
   von `/etc/kubernetes/manifests/etcd.yaml`. Ein einfacher Blick mit
   `head -n 35` reicht aus.
3. **Moderne Werkzeug-Trennung (`etcdctl` vs. `etcdutl`):**
   - **`etcdctl` (Online):** Spricht über TLS mit dem laufenden Server, um den
     Snapshot zu erzeugen (`snapshot save`).
   - **`etcdutl` (Offline):** Liest die fertige `.db`-Datei direkt von der
     Festplatte, um Status oder Hash zu prüfen (`snapshot status`).

**KaWa ETCDUTL:**

- **E**ndpoints (`https://127.0.0.1:2379`)
- **T**LS-Handshake mit Server-Zertifikaten
- **C**A-Zertifikat (`ca.crt`)
- **D**atenbank-Snapshot (`.db`)
- **U**nabhängige Werkzeuge (`etcdutl` für Offline-Dateien)
- **T**abellarische Statusausgabe (`--write-out=table`)
- **L**okales Manifest als Fundgrube für Pfade

### Live verifizierter Doku-Navigationsanker

- **kubernetes.io Docs-Suchfeld:** `etcd snapshot`
- **Zielseite:** `Tasks → Administer a Cluster → Operating etcd clusters for`
  `Kubernetes → Backing up an etcd cluster`
- **In-Page Suche (`Strg+F` / `Cmd+F`):** `snapshot save`
- **Die originale Doku-Schablone:**

  ```bash
  ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
    --cacert=<trusted-ca-file> --cert=<cert-file> --key=<key-file> \
    snapshot save <backup-file-location>
  ```

---

## 2. Aufgabenstellung (Repetition Q14)

Host für diese Aufgabe: `ssh cka8448`.

Sichere den Zustand des Clusters atomar in einem etcd-Snapshot und
verifiziere die Integrität der Sicherung nach der Zero-Memorization-Methode.

*(Hinweis: Trage deine Lösungen, Befehle und Notizen bitte in die separate Datei
`Aufgabe-Q14-etcd-backup-etcdutl-solution.md` ein.)*

### Aufgabe 1: Doku-Schablone aufrufen

1. Suche in der offiziellen Dokumentation nach `etcd snapshot`.
2. Springe via `Strg+F` zu `snapshot save` und kopiere die Befehlszeile mit den
   drei Platzhaltern (`<trusted-ca-file>`, `<cert-file>`, `<key-file>`).

### Aufgabe 2: Werte aus den ersten 30 Zeilen ablesen

1. Führe auf Host `cka8448` folgenden Befehl aus, um die Startparameter des
   etcd-Pods direkt im Kopf der Datei einzusehen:

   ```bash
   sudo head -n 35 /etc/kubernetes/manifests/etcd.yaml
   ```

2. Identifiziere die 4 Werte für deine Schablone:
   - Endpoint (`--listen-client-urls`, wähle `https://127.0.0.1:2379`)
   - `--trusted-ca-file`
   - `--cert-file`
   - `--key-file`

### Aufgabe 3: Snapshot mit etcdctl erstellen

1. Erstelle das Zielverzeichnis: `mkdir -p /course/14/backup/`.
2. Setze die ermittelten Pfade in deine Doku-Schablone ein und führe den
   Snapshot-Befehl aus (Ziel: `/course/14/backup/etcd-snapshot.db`).
3. **Wichtig (Root-Schlüssel):** Da `/etc/kubernetes/pki/etcd/server.key` nur
   von `root` gelesen werden darf (`0600`), führe den Befehl mit `sudo` aus.

### Aufgabe 4: Snapshot mit etcdutl prüfen & dokumentieren

1. Überprüfe die Integrität der Sicherungsdatei mit dem modernen CLI `etcdutl`:

   ```bash
   sudo etcdutl snapshot status /course/14/backup/etcd-snapshot.db \
     --write-out=table | sudo tee /course/14/backup/status.txt
   ```

2. Prüfe die Datei `/course/14/backup/status.txt`: Sie muss die Tabelle mit
   `HASH`, `REVISION`, `TOTAL KEYS` und `TOTAL SIZE` enthalten.
3. Stelle sicher, dass die Berechtigungen für deine User-Session passen:
   `sudo chown -R cka-admin:cka-admin /course/14/backup/`.

---

## 3. Spickzettel & Doku-Hilfen

- **Doku-Suchbegriff:** `etcd snapshot`
- **In-Terminal Fastpath (Kopf der etcd.yaml ohne Grep):**

  ```bash
  sudo head -n 35 /etc/kubernetes/manifests/etcd.yaml
  ```

- **Offline-Inspektion mit etcdutl:**

  ```bash
  etcdutl snapshot status <datei.db> --write-out=table
  ```

---

## 4. Feedback & Korrekturen

### Ergebnis-Scorecard & Cluster-Prüfung: 8 / 8 Punkte (100% PASS)

Die Lösung wurde live auf Host `cka8448` geprüft.
Ergebnis des automatisierten Prüflaufs:

- **Snapshot-Datei:** `/course/14/backup/etcd-snapshot.db` existiert und ist
  mit **2.1 MB** vollständig und intakt (> 1 MB Mindestgröße).
- **Status-Dokumentation:** `/course/14/backup/status.txt` existiert und enthält
  die vollständige formatierte Status-Tabelle von `etcdutl`.
- **Integritäts-Nachweis:** Hash `f540042a`, Revision `197923` und 842 Keys
  wurden erfolgreich extrahiert.
- **Evaluator:** `verify-all-17.py` vergibt die vollen **8 von 8 Punkten**.

---

### Detailliertes Review & CKA-Prüfungs-Takeaways

#### 1. Zero-Memorization-Methode in der Praxis

Du hast bewiesen, wie schnell und stressfrei diese Aufgabe gelöst werden kann:

1. Doku aufgeschlagen (`etcd snapshot` → `snapshot save`) und Schablone geholt.
2. `sudo head -n 35 /etc/kubernetes/manifests/etcd.yaml` aufgerufen und die
   Pfade direkt vom Bildschirm abgelesen.
3. Befehl mit `sudo` abgesetzt.
4. Fertig – ganz ohne das Auswendiglernen von Grep-Suchbegriffen.

#### 2. Berechtigungen der Snapshot-Datei (`0600` vs. `0644`)

Wenn `sudo etcdctl snapshot save` als Root ausgeführt wird, erzeugt das Tool
die Datenbankdatei standardmäßig mit Berechtigung `-rw-------` (`0600`, nur
für Root lesbar).

*Prüfungs-Tipp:* Führe nach der Erstellung immer:

```bash
sudo chown -R cka-admin:cka-admin /course/14/backup/
```

aus. Damit stellst du sicher, dass automatisierte Bewertungs-Skripte der
Prüfungsplattform (die oft als regulärer Benutzer `cka-admin` oder `candidate`
laufen) die Datei problemlos öffnen und verifizieren können.

---

### Doku- & In-Terminal Fastpath (Unter 15 Sekunden)

- **kubernetes.io Docs-Suchfeld:** `etcd snapshot`
- **Zielseite:** `Operating etcd clusters for Kubernetes`
- **In-Page Suche (`Strg+F`):** `snapshot save`
- **In-Terminal Fastpath:**

  ```bash
  sudo head -n 35 /etc/kubernetes/manifests/etcd.yaml
  ```
