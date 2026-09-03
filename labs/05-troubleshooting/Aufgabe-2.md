# Aufgabe 2: Control Plane Failure & Static Pod Troubleshooting

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #8
- **Entspricht:** Block 2 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Bild: Der Ausfall im Chef-Büro (Control Plane)

Wenn die Control Plane brennt, ist `kubectl` oft taub oder blind:

- **`kubectl` antwortet mit `The connection to the server ... was refused`:**
  Das Kassenhäuschen (`kube-apiserver`) ist tot oder nicht erreichbar.
- **Pods bleiben im Status `Pending` (Cluster ist gesund, aber niemand plant):**
  Der Raumplaner (`kube-scheduler`) ist im Tiefschlaf.
- **ReplicaSets/Deployments skalieren nicht (Pods werden gelöscht, aber nicht
  ersetzt):** Der Werksleiter (`kube-controller-manager`) arbeitet nicht.
- **Cluster vergisst alles oder verweigert Schreibzugriffe:** Das Archiv
  (`etcd`) ist korrupt, voll oder die TLS-Schlüssel passen nicht.

### Die goldene Diagnose-Kaskade bei Control-Plane-Ausfällen

```text
               [ Reagiert kubectl überhaupt noch? ]
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
              [ JA ]                            [ NEIN ]
      kubectl get pods -n kube-system     Direkt auf die Node per SSH/Shell!
      kubectl describe / logs ...         1. crictl ps -a (Laufen die Container?)
                                          2. crictl logs <id>
                                          3. /var/log/pods/ oder journalctl -u kubelet
                                          4. Manifeste: /etc/kubernetes/manifests/
```

### Die 3 häufigsten Fehlerquellen bei Static Pods

1. **Syntaxfehler im YAML:** Ein eingerückter Tab oder Tippfehler in
   `/etc/kubernetes/manifests/*.yaml` führt dazu, dass Kubelet das File
   ignoriert.
2. **Falsche Pfade / Zertifikate:** Falscher Pfad zu `--etcd-cafile`,
   `--client-certificate` oder abgelaufene Zertifikate.
3. **Falsche Ports / Adressen:** Falsche IP in `--advertise-address` oder
   `--etcd-servers`.

---

## 2. Aufgabenstellung (Block 2)

Arbeitsumgebung: Control-Plane Node deines Clusters (`cka-cluster-control-plane`
bzw. per `docker exec -it <control-plane-node> bash` oder lokaler Zugriff).

---

### Aufgabe 2.1: Kube-Scheduler Ausfall & Pending Pods

Ein Kollege hat Änderungen an der Control Plane vorgenommen. Seitdem werden neu
erstellte Pods nicht mehr auf Nodes platziert.

1. Erstelle einen einfachen Test-Pod im Namespace `default`:
   `kubectl run test-schedule --image=nginx:alpine`
2. Prüfe den Status des Pods (`kubectl get pod test-schedule`). Warum bleibt er
   im Status `Pending`?
3. Untersuche die Control-Plane-Pods im Namespace `kube-system`. Welcher Pod
   fehlt oder ist fehlerhaft?
4. Inspiziere das Manifest `/etc/kubernetes/manifests/kube-scheduler.yaml` auf
   der Control-Plane-Node. Finde den Fehler (Tipp: Prüfe Image, Command, Ports
   oder Syntax).
5. Korrigiere das Manifest und stelle sicher, dass der Pod `test-schedule`
   automatisch auf einen Worker-Node gescheduled wird und in den Status
   `Running` wechselt.

---

### Aufgabe 2.2: Kube-Controller-Manager Failure

Nun streikt der `kube-controller-manager`.

1. Erstelle ein Deployment mit 3 Replikaten:
   `kubectl create deployment web-deploy --image=nginx:alpine --replicas=3`
2. Beobachte mit `kubectl get deployment web-deploy`. Warum werden 0/3 Pods
   bereitgestellt?
3. Inspiziere die Logs oder das Manifest des Controller-Managers unter
   `/etc/kubernetes/manifests/kube-controller-manager.yaml`.
4. Behebe die Fehlkonfiguration (z. B. falscher Kubeconfig-Pfad
   `--kubeconfig=/etc/kubernetes/controller-manager.conf` oder Zertifikatspfad),
   sodass das Deployment sofort auf `3/3 Ready` hochskaliert.

---

### Aufgabe 2.3: API-Server Totalausfall & Runtime-Debugging (`crictl`)

Der `kube-apiserver` stürzt beim Starten sofort ab. `kubectl` schlägt mit
`connection refused` fehl.

1. Simuliere / Analysiere den Ausfall: Wenn `kubectl` nicht mehr reagiert,
   welche CLI nutzt du direkt auf der Node?
2. Finde den gestoppten/crashenden API-Server-Container mit `crictl ps -a`
   (oder `crictl pods`).
3. Lies die Logs des abgestürzten Containers mit `crictl logs <container-id>`
   aus.
4. Identifiziere den Fehler in `/etc/kubernetes/manifests/kube-apiserver.yaml`
   (z. B. falscher Port, falscher ETCD-Server-Endpunkt oder vertippter
   Flag-Name).
5. Korrigiere die Datei und verifiziere, dass `kubectl get nodes` wieder
   zuverlässig antwortet.

---

### Aufgabe 2.4: Zertifikatsabläufe prüfen (`kubeadm certs`)

Control-Plane-Komponenten kommunizieren verschlüsselt über TLS-Zertifikate.

1. Prüfe auf der Control-Plane-Node mit dem offiziellen Kubeadm-Befehl den
   Ablaufstatus aller Zertifikate (`kubeadm certs check-expiration`).
2. Finde heraus, wie du bei Bedarf alle Zertifikate manuell um ein Jahr
   erneuern würdest (`kubeadm certs renew all`).
3. Welche Aktion ist nach dem Erneuern von Control-Plane-Zertifikaten zwingend
   erforderlich, damit die statischen Pods die neuen Zertifikate einlesen?

---

## 3. Lösungen

Deine Befehle, Manifeste und Auswertungen führst du in der separaten Datei:
`labs/05-troubleshooting/Aufgabe-2-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `troubleshoot control plane`,
  `static pods`, `kubeadm certs renew`
- **In-Terminal Syntax:**
  - `crictl --help`
  - `crictl ps -a --name kube-apiserver`
  - `crictl logs <container-id>`
  - `kubeadm certs check-expiration`
- **Wichtige Pfade:**
  - Static Pod Manifeste: `/etc/kubernetes/manifests/`
  - Kubeconfig Files: `/etc/kubernetes/*.conf`
  - PKI Zertifikate: `/etc/kubernetes/pki/`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 2.1:** Gelöst (Kombination aus Image- & Kubeconfig-Korrektur)
- **Aufgabe 2.2:** Gelöst (Kubeconfig-Pfad im Controller-Manager repariert)
- **Aufgabe 2.3:** Gelöst (CRI-Level Debugging mit `crictl` & ETCD-Port Fix)
- **Aufgabe 2.4:** Gelöst mit **wichtigem CKA-Detail zu Static Pod Restarts**

---

### Detaillierte Analyse der einzelnen Aufgaben

#### Zu Aufgabe 2.1 (Kube-Scheduler Ausfall)

- **Diagnoseweg:** `kubectl describe pod` lieferte direkt den ImagePull-Fehler.
- **Korrektur:** Manifest in `/etc/kubernetes/manifests/kube-scheduler.yaml`
  angepasst. `test-schedule` wurde unmittelbar gescheduled (`1/1 Running`).
- **Exam-Takeaway:** Pods im Status `Pending` ohne Event-Meldungen auf Nodes
  weisen immer direkt auf Scheduler-Probleme hin.

#### Zu Aufgabe 2.2 (Kube-Controller-Manager Failure)

- **Diagnoseweg:** `kubectl -n kube-system get pods` zeigte den Crash des
  Controller-Managers.
- **Korrektur:** Korrektur des fehlerhaften Dateipfads mit `sed -i`
  durchgeführt. Deployment skalierte sofort auf `3/3 Ready`.
- **Exam-Takeaway:** Der Controller-Manager steuert die Reconciliation Loops
  (Deployments, ReplicaSets, Endpoints). Fehlt er, werden Objekte in etcd
  gespeichert, aber keine Pods erzeugt.

#### Zu Aufgabe 2.3 (API-Server & crictl)

- **Diagnoseweg:** `crictl ps -a` → `crictl logs <container-id>`
  zeigte den Verbindungsfehler zu Port 2389 (`dial tcp 127.0.0.1:2389:
  connection refused`).
- **Korrektur:** Port in `/etc/kubernetes/manifests/kube-apiserver.yaml` auf
  2379 korrigiert.
- **Exam-Takeaway:** Wenn `kubectl` nicht mehr antwortet (`connection
  refused`), ist `crictl ps -a` und `crictl logs` das Standardwerkzeug auf der
  Node.

#### Zu Aufgabe 2.4 (Zertifikate & Static Pod Restart)

- **Zertifikats-Renew:** `kubeadm certs renew all` erfolgreich ausgeführt.
- **Wichtiger CKA-Prüfungsfakt (Static Pods & `kubectl delete pod`):**
  - Du hast die Pods mit `kubectl delete pod` gelöscht. Das funktioniert zwar,
    wenn der API-Server erreichbar ist (Kubelet startet den Container neu).
  - **Aber:** Wenn Zertifikate abgelaufen sind, **ist der API-Server tot**!
    Dann schlägt `kubectl delete pod` fehl.
  - **Der sicherste Weg für Static Pods:**
    1. Entweder die Container direkt via CRI stoppen (`crictl stop
       <container-id>`), Kubelet startet sie sofort mit den neuen Zertifikaten.
    2. Oder kurz die Manifeste verschieben (`mv
       /etc/kubernetes/manifests/*.yaml /tmp/` und wieder zurück).
    3. Oder Kubelet neustarten (`systemctl restart kubelet`).
