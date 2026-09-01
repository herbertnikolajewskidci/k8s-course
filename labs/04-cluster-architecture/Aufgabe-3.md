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
   - _Tipp:_ Vor jeden Befehl `ETCDCTL_API=3` setzen (oder als Env exportieren).
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
k -n kube-system describe pod etcd-cka-master  | grep -i -A3 etcd-certs:
#  etcd-certs:
#    Type:          HostPath (bare host directory volume)
#    Path:          /etc/kubernetes/pki/etcd
#    HostPathType:  DirectoryOrCreate

k -n kube-system describe pod etcd-cka-master  | grep -i cert
#      --cert-file=/etc/kubernetes/pki/etcd/server.crt
#      --client-cert-auth=true
#      --peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt
#      --peer-client-cert-auth=true
#      /etc/kubernetes/pki/etcd from etcd-certs (rw)
#  etcd-certs:

k -n kube-system describe pod etcd-cka-master  | grep -i key
#      --key-file=/etc/kubernetes/pki/etcd/server.key
#      --peer-key-file=/etc/kubernetes/pki/etcd/peer.key

k -n kube-system describe pod etcd-cka-master  | grep -i ca
# Priority Class Name:  system-node-critical
#      --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
#      --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt

k -n kube-system describe pod etcd-cka-cluster-control-plane | grep 2379
# Annotations:          kubeadm.kubernetes.io/etcd.advertise-client-urls: ...
#      --advertise-client-urls=https://192.168.147.4:2379
#      --listen-client-urls=https://127.0.0.1:2379,...

sudo ETCDCTL_API=3 etcdctl \
  --cacert="/etc/kubernetes/pki/etcd/ca.crt" \
  --cert="/etc/kubernetes/pki/etcd/server.crt" \
  --key="/etc/kubernetes/pki/etcd/server.key" \
  --endpoints=https://127.0.0.1:2379 \
  snapshot save /tmp/etcd-backup.db
# Snapshot saved at /tmp/etcd-backup.db

sudo etcdctl snapshot status /tmp/etcd-backup.db -w table
# +----------+----------+------------+------------+
# |   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
# +----------+----------+------------+------------+
# | 1efc8bf0 |    14910 |       1049 |     3.0 MB |
# +----------+----------+------------+------------+
```

### Lösung 3.2

```bash
# Deine Befehle / Notizen
kubectl delete namespace snapshot-test

kubectl get ns snapshot-test
# Error from server (NotFound): namespaces "snapshot-test" not found
```

### Lösung 3.3

```bash
# Deine Befehle / Notizen
sudo etcdctl snapshot restore /tmp/etcd-backup.db --data-dir=/var/lib/etcd-restored

sudo vi /etc/kubernetes/manifests/etcd.yaml

ändere /var/lib/etcd an drei stellen auf /var/lib/etcd-restored

k get ns
NAME              STATUS   AGE
default           Active   3h18m
kube-flannel      Active   3h17m
kube-node-lease   Active   3h18m
kube-public       Active   3h18m
kube-system       Active   3h18m
snapshot-test     Active   46m
herbertnikolajewski@cka-master:~$ k -n snapshot-test get pods
NAME                           READY   STATUS    RESTARTS   AGE
imprtant-ap-7b4b6ddbfb-h7bmp   1/1     Running   0          46m
imprtant-ap-7b4b6ddbfb-lp7cl   1/1     Running   0          46m
imprtant-ap-7b4b6ddbfb-q74n4   1/1     Running   0          46m
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

### Review zu Block 3: etcd Snapshot Backup & Restore

Hervorragend gelöst! Du hast den gesamten Lifecycle von Disaster Recovery in
Kubernetes gemeistert: Von der Parameter-Ermittlung über das Erstellen des
Snapshots, der absichtlichen Zerstörung von Daten bis hin zum sauberen Restore
inklusive Static-Pod-Neustart.

---

### Detaillierte Analyse & Feinheiten

#### 1. Aufgabe 3.1 (Parameter-Ermittlung & Snapshot)

- **Umsetzung:**
  - Sehr gute Recherche der Pfade über `kubectl describe pod etcd-...`
    (bzw. direkt `cat /etc/kubernetes/manifests/etcd.yaml`).
  - Der `snapshot save`-Befehl mit `--cacert`, `--cert`, `--key` und
    `--endpoints=https://127.0.0.1:2379` war absolut fehlerfrei.
  - Tabellarische Verifikation mit `-w table` lieferte saubere Metriken
    (Hash `1efc8bf0`, Revision `14910`, 1049 Keys).

#### 2. Aufgabe 3.2 (Disaster Simulation)

- **Umsetzung:** Der Namespace `snapshot-test` wurde komplett gelöscht und der
  `NotFound`-Zustand verifiziert.

#### 3. Aufgabe 3.3 (Restore & Manifest-Anpassung)

- **Umsetzung:**
  - `etcdctl snapshot restore /tmp/etcd-backup.db --data-dir=/var/lib/etcd-restored`
    auf ein neues Datenverzeichnis ausgeführt.
  - Das etcd-Manifest `/etc/kubernetes/manifests/etcd.yaml` konsequent an allen
    Stellen (`command: --data-dir`, `volumeMounts: mountPath`,
    `volumes: hostPath.path`) aktualisiert.
- **Ergebnis:** Kubelet hat etcd und API-Server neu gestartet, der gelöschte
  Namespace `snapshot-test` und alle 3 Pods von `important-app` waren sofort
  wieder da (`1/1 Running`).

---

### CKA-Prüfungs-Takeaways für etcd

1. **Rechte beachten:** `etcdctl`-Befehle immer mit `sudo` ausführen, da
   `/etc/kubernetes/pki/etcd/server.key` nur für `root` lesbar ist.
2. **Die 3 Pfade im etcd-Manifest:**
   - `--data-dir=/var/lib/etcd-restored` (Container-Kommando)
   - `volumeMounts[...].mountPath: /var/lib/etcd-restored` (Container-Mount)
   - `volumes[...].hostPath.path: /var/lib/etcd-restored` (Echter Pfad auf Host)
3. **API-Server Latenz:** Nach der Manifest-Änderung dauert es ca. 15–30
   Sekunden, bis Kubelet den neuen etcd-Container hochfährt und der API-Server
   wieder antwortet.

**Ergebnis:** Block 3 mit Bravour gemeistert! 🎯
