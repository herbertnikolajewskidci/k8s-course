# Aufgabe 3: etcd Snapshot Backup & Restore

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Tal → Hang → Gipfel
- **Issue:** #7
- **Entspricht:** Block 3 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale etcd-Netz: "Das Gehirn des Clusters sichern und verpflanzen"

`etcd` ist die einzige Single Source of Truth im Kubernetes-Cluster. Alle
Objekte (Pods, Secrets, Deployments, RBAC) liegen binär in der etcd-Datenbank.

```text
               ┌──────────────────────────────────────────────┐
               │         1. SNAPSHOT SICHERN (Backup)         │
               │  etcdctl snapshot save /pfad/snapshot.db     │
               │  (mit TLS-Certs: --cacert, --cert, --key)    │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         2. VERIFIZIEREN (Integrität)         │
               │  etcdctl snapshot status /pfad/snapshot.db   │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         3. WIEDERHERSTELLEN (Restore)        │
               │  etcdctl snapshot restore /pfad/snapshot.db  │
               │  --data-dir=/var/lib/etcd-backup-restore     │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    4. CONTROL-PLANE NEU VERDRAHTEN           │
               │  HostPath in /etc/kubernetes/manifests/      │
               │  etcd.yaml auf das neue data-dir umbiegen    │
               └──────────────────────────────────────────────┘
```

1. **Die 4 unverzichtbaren etcdctl-Parameter:**
   - `--endpoints`: In der Regel `https://127.0.0.1:2379`
   - `--cacert`: `/etc/kubernetes/pki/etcd/ca.crt` (CA-Zertifikat)
   - `--cert`: `/etc/kubernetes/pki/etcd/server.crt` (Server-Zertifikat)
   - `--key`: `/etc/kubernetes/pki/etcd/server.key` (Privater Schlüssel)
   - *Tipp:* Vor jeden Befehl `ETCDCTL_API=3` setzen (oder als Env exportieren).
2. **Die goldene Regel beim Restore:**
   - Ein Snapshot-Restore überschreibt **niemals** ein aktives etcd-Verzeichnis
     direkt im laufenden Betrieb.
   - Der Restore schreibt immer in ein **neues separates Verzeichnis**
     (z. B. `--data-dir=/var/lib/etcd-previous`).
3. **Static Pod Reconnection:**
   - Da `etcd` als Static Pod über Kubelet läuft, überwacht Kubelet die Datei
     `/etc/kubernetes/manifests/etcd.yaml`.
   - Sobald das `hostPath`-Volume in diesem Manifest auf das neue Datenverzeichnis
     angepasst wird, startet Kubelet den etcd-Container automatisch neu.

---

## 2. Aufgabenstellung (Block 3)

> **Live-Umgebung auf deiner Control-Plane (`cka-master`):**
> Logge dich auf `cka-master` ein (`orb -m cka-master` oder per SSH).
> `etcdctl` und alle nötigen TLS-Zertifikate liegen bereit.

---

### Vorbereitung: Einen Zustand erzeugen, den wir sichern wollen

Erstelle vor dem Backup ein spezifisches Deployment, das als Beweis für unseren
Snapshot dient:

```bash
kubectl create namespace snapshot-test
kubectl -n snapshot-test create deployment important-app --image=nginx --replicas=3
```

---

### Aufgabe 3.1: etcd-Parameter ermitteln & Snapshot erstellen

1. Wie findest du die genauen Pfade für `--cacert`, `--cert`, `--key` und
   `--endpoints` direkt aus dem etcd-Static-Pod-Manifest heraus?
2. Erstelle einen Snapshot des etcd-Zustands und speichere ihn unter
   `/tmp/etcd-backup.db`.
3. Verifiziere die Integrität des Snapshots mit `etcdctl snapshot status`
   (tabellarische Ansicht). Notiere Revision und Hash.

---

### Aufgabe 3.2: Disaster Simulation (Zustandsverlust)

Simuliere nun einen fatalen Datenverlust oder ein Fehlverhalten:

1. Lösche den gesamten Namespace `snapshot-test` samt Inhalten:

   ```bash
   kubectl delete namespace snapshot-test
   ```

2. Überprüfe mit `kubectl get ns snapshot-test`, dass die Daten wirklich
   unwiederbringlich aus dem aktiven Cluster gelöscht sind.

---

### Aufgabe 3.3: etcd Snapshot Restore durchführen

Stelle nun den Zustand aus dem Backup `/tmp/etcd-backup.db` wieder her.

1. Führe den Restore-Befehl mit `etcdctl snapshot restore` aus und gib als
   Ziel-Datenverzeichnis `--data-dir=/var/lib/etcd-restored` an.
2. Passe das Static-Pod-Manifest `/etc/kubernetes/manifests/etcd.yaml` so an,
   dass der etcd-Pod das neue Datenverzeichnis `/var/lib/etcd-restored` nutzt.
   (Welche zwei Stellen im Manifest müssen angepasst werden?)
3. Warte kurz, bis Kubelet den etcd-Pod und den API-Server neu gestartet hat.
4. Prüfe mit `kubectl get ns` und `kubectl -n snapshot-test get pods`, ob der
   gelöschte Namespace `snapshot-test` und das Deployment `important-app`
   vollständig wiederhergestellt sind!

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 3.1

```bash
# Deine Befehle / Notizen
```

### Lösung 3.2

```bash
# Deine Befehle / Notizen
```

### Lösung 3.3

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `operating etcd clusters for kubernetes`,
  `backing up an etcd cluster`, `restoring an etcd cluster`
- **In-Terminal Syntax:**
  - `cat /etc/kubernetes/manifests/etcd.yaml | grep -E "(cert|key|endpoints|data-dir)"`
  - `ETCDCTL_API=3 etcdctl --help`
  - `ETCDCTL_API=3 etcdctl snapshot save --help`
  - `ETCDCTL_API=3 etcdctl snapshot restore --help`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
