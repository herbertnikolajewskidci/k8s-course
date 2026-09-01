# Aufgabe 4: Static Pods, Control-Plane Maintenance & CRDs

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Tal → Hang → Gipfel
- **Issue:** #7
- **Entspricht:** Block 4 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Static-Pod & Wartungs-Netz

Static Pods werden nicht über die Control-Plane (API-Server / Scheduler)
geplant, sondern direkt vom lokalen Kubelet-Daemon einer Node überwacht und
gestartet.

```text
               ┌──────────────────────────────────────────────┐
               │    Kubelet Service (/var/lib/kubelet/...)    │
               │    liest staticPodPath-Verzeichnis           │
               └──────────────────────┬───────────────────────┘
                                      │ (Dateisystem-Watch)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    /etc/kubernetes/manifests/*.yaml          │
               │    (etcd, kube-apiserver, custom-pod.yaml)   │
               └──────────────────────┬───────────────────────┘
                                      │ (Container-Runtime)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    Mirror-Pod im API-Server (read-only)      │
               │    Name: <pod-name>-<node-name>              │
               └──────────────────────────────────────────────┘
```

1. **Static Pod Erkennung & Lebenszyklus:**
   - Kubelet überwacht das in `staticPodPath` konfigurierte Verzeichnis
     (Standard: `/etc/kubernetes/manifests`).
   - Erstellen einer YAML-Datei in diesem Ordner = Kubelet startet den Pod sofort.
   - Löschen der Datei = Kubelet stoppt und entfernt den Pod.
   - Löschen via `kubectl delete pod <static-pod>` erzeugt nur eine kurzzeitige
     Neuerstellung als Mirror-Pod, solange die YAML-Datei auf der Node liegt.
2. **Kubelet-Konfiguration finden:**
   - Wie ermittelt man den `staticPodPath` einer beliebigen Node?
   - Pfad 1: `/var/lib/kubelet/config.yaml` auf der Node (`staticPodPath: ...`).
   - Pfad 2: Prozess-Argumente (`ps aux | grep kubelet` oder
     `/etc/systemd/system/kubelet.service.d/`).
3. **CRD (Custom Resource Definition) vs. CR (Custom Resource):**
   - **CRD:** Erweitert die Kubernetes-API um ein neues Schema (`kind: CustomResourceDefinition`).
   - **CR:** Eine konkrete Instanz dieses neuen Typs (wird wie normale Pods/Deployments
     via `kubectl` verwaltet).

---

## 2. Aufgabenstellung (Block 4)

> **Live-Umgebung auf deinen VMs (`cka-master` und `cka-worker1`):**
> Nutze `orb -m cka-master` und `orb -m cka-worker1`.

---

### Aufgabe 4.1: Static Pod Pfad ermitteln & Static Pod auf Worker erstellen

1. Logge dich auf `cka-worker1` ein.
2. Ermittle den konfigurierten `staticPodPath` des Kubelet-Dienstes auf `cka-worker1`.
3. Erstelle auf `cka-worker1` einen Static Pod namens `worker-monitor` mit
   folgenden Spezifikationen:
   - Image: `busybox:latest`
   - Befehl: `sleep 3600`
   - CPU-Request: `50m`
4. Wechsle auf `cka-master` und prüfe mit `kubectl get pods -A`, wie der Pod
   im Cluster heißt und auf welchem Node er läuft.
5. Versuche den Pod auf `cka-master` mit `kubectl delete pod <name>` zu löschen.
   Was passiert und wie löschst du ihn wirklich?

---

### Aufgabe 4.2: Control-Plane Troubleshooting (Defektes Static Pod Manifest)

Ein fehlerhaftes Static-Pod-Manifest kann die gesamte Control-Plane lahmlegen.

1. Simuliere einen Fehler auf `cka-master`: Ändere in
   `/etc/kubernetes/manifests/kube-scheduler.yaml` den Port oder ein falsches
   Kommando-Flag (z. B. `--invalid-flag=true`).
2. Beobachte mit `kubectl get pods -n kube-system`, was mit dem Scheduler passiert.
3. Repariere das Manifest `/etc/kubernetes/manifests/kube-scheduler.yaml` wieder
   und verifiziere, dass der Scheduler wieder gesund läuft (`1/1 Running`).

---

### Aufgabe 4.3: Custom Resource Definitions (CRDs) & Custom Resources

1. Erstelle eine einfache CustomResourceDefinition namens
   `internalbackups.cputraining.io` mit folgendem Manifest (bzw. wende es an):

   ```yaml
   apiVersion: apiextensions.k8s.io/v1
   kind: CustomResourceDefinition
   metadata:
     name: internalbackups.cputraining.io
   spec:
     group: cputraining.io
     versions:
       - name: v1
         served: true
         storage: true
         schema:
           openAPIV3Schema:
             type: object
             properties:
               spec:
                 type: object
                 properties:
                   destination:
                     type: string
                   intervalMinutes:
                     type: integer
     scope: Namespaced
     names:
       plural: internalbackups
       singular: internalbackup
       kind: InternalBackup
       shortNames:
         - ib
   ```

2. Prüfe mit `kubectl api-resources | grep cputraining`, ob der neue Ressourcentyp
   im Cluster registriert ist.
3. Erstelle im Namespace `default` eine Instanz (Custom Resource) dieser CRD:
   - Name: `daily-etcd-backup`
   - `spec.destination`: `/var/backups/daily`
   - `spec.intervalMinutes`: `60`
4. Zeige deine Custom Resource mit `kubectl get ib` und
   `kubectl describe ib daily-etcd-backup` an.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 4.1

```bash
# Deine Befehle / Notizen

herbertnikolajewski@cka-worker1:~$ ps aux | grep kubelet
# root 29066 ... /usr/bin/kubelet --config=/var/lib/kubelet/config.yaml ...
herbertnikolajewski@cka-worker1:~$ cat /var/lib/kubelet/config.yaml | grep static
staticPodPath: /etc/kubernetes/manifests

herbertnikolajewski@cka-worker1:~$ touch /etc/kubernetes/manifests/worker-monitor.yaml
herbertnikolajewski@cka-worker1:~$ cat /etc/kubernetes/manifests/worker-monitor.yaml
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    run: worker-monitor
  name: worker-monitor
spec:
  containers:
  - command:
    - sleep
    - "3600"
    image: busybox:latest
    name: worker-monitor
    resources:
      requests:
        cpu: "50m"

herbertnikolajewski@cka-master:~$ k get pods
NAME                         READY   STATUS    RESTARTS   AGE
worker-monitor-cka-worker1   1/1     Running   0          3m57s

herbertnikolajewski@cka-master:~$ k get pods -A
# NAMESPACE       NAME                                 READY   STATUS    AGE
# default         worker-monitor-cka-worker1           1/1     Running   4m9s
# kube-flannel    kube-flannel-ds-448mz                1/1     Running   4h7m
# kube-system     coredns-7c65d6cfc9-nptl6             1/1     Running   3h24m
# kube-system     kube-apiserver-cka-master            1/1     Running   3h48m
# kube-system     kube-controller-manager-cka-master   1/1     Running   3h48m
# kube-system     kube-proxy-s2sfr                     1/1     Running   3h47m
# kube-system     kube-scheduler-cka-master            1/1     Running   3h47m
# snapshot-test   imprtant-ap-7b4b6ddbfb-h7bmp         1/1     Running   111m

k delete worker-monitor-cka-worker1

k get pods
NAME                         READY   STATUS    RESTARTS   AGE
worker-monitor-cka-worker1   0/1     Pending   0          5s

herbertnikolajewski@cka-master:~$ k get pods
NAME                         READY   STATUS    RESTARTS   AGE
worker-monitor-cka-worker1   1/1     Running   0          31s
```

### Lösung 4.2

```bash
# Deine Befehle / Notizen

herbertnikolajewski@cka-master:~$ k get pods -n kube-system
# NAME                                 READY   STATUS    AGE
# coredns-7c65d6cfc9-nptl6             1/1     Running   3h27m
# kube-apiserver-cka-master            1/1     Running   3h51m
# kube-controller-manager-cka-master   1/1     Running   3h51m
# kube-proxy-s2sfr                     1/1     Running   3h50m

# Nach Fehler-Korrektur:
# kube-scheduler-cka-master            1/1     Running   19s
```

### Lösung 4.3

```bash
# Deine Befehle / Notizen
herbertnikolajewski@cka-master:~$ vi daily-etcd-backup.yaml
herbertnikolajewski@cka-master:~$ k create -f daily-etcd-backup.yaml
internalbackup.cputraining.io/daily-etcd-backup created
herbertnikolajewski@cka-master:~$ k get ib
NAME                AGE
daily-etcd-backup   9s
herbertnikolajewski@cka-master:~$ k describe ib daily-etcd-backup
Name:         daily-etcd-backup
Namespace:    default
Labels:       <none>
Annotations:  <none>
API Version:  cputraining.io/v1
Kind:         InternalBackup
Metadata:
  Creation Timestamp:  2026-09-01T14:45:29Z
  Generation:          1
  Resource Version:    23319
  UID:                 2b38429d-5f47-4ece-98b6-df0567b2b538
Spec:
  Destination:       /var/backups/daily
  Interval Minutes:  60
Events:              <none>
herbertnikolajewski@cka-master:~$ cat daily-etcd-backup.yaml
apiVersion: cputraining.io/v1
kind: InternalBackup
metadata:
  name: daily-etcd-backup
spec:
  destination: /var/backups/daily
  intervalMinutes: 60
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `static pods`, `create static pods`,
  `customresourcedefinition`
- **In-Terminal Syntax:**
  - `grep -i staticpod /var/lib/kubelet/config.yaml`
  - `kubectl run --restart=Never --dry-run=client -o yaml`
    (als Template für Static Pods)
  - `kubectl get crd`
  - `kubectl api-resources`

---

## 5. Feedback & Korrekturen

### Review zu Block 4: Static Pods, Control-Plane Maintenance & CRDs

Alle drei Teilaufgaben wurden vollständig und korrekt gelöst.

---

### Detaillierte Analyse & CKA-Takeaways

#### 1. Aufgabe 4.1 (Static Pods & Mirror-Pod-Verhalten)

- **Pfad-Ermittlung:** Sauber gelöst über `ps aux | grep kubelet` (Verweis auf
  `--config=/var/lib/kubelet/config.yaml`) und Auslesen von `staticPodPath`
  (`/etc/kubernetes/manifests`).
- **Namenskonvention:** Kubelet hängt automatisch das Suffix `-<node-name>` an
  (`worker-monitor-cka-worker1`).
- **Lösch-Verhalten:**
  - `kubectl delete pod worker-monitor-cka-worker1` löscht nur das temporäre
    Mirror-Pod-Objekt im API-Server.
  - Kubelet erkennt, dass die YAML-Datei noch in `/etc/kubernetes/manifests/`
    liegt, und erzeugt den Pod sofort neu (wie in deiner Ausgabe sichtbar:
    `Pending` → `Running`).
  - **Endgültiges Löschen:** Datei `/etc/kubernetes/manifests/worker-monitor.yaml`
    auf der Node entfernen.

#### 2. Aufgabe 4.2 (Control-Plane Troubleshooting)

- **Beobachtung:** Nach dem Setzen eines ungültigen Flags verschwand der Pod
  `kube-scheduler-cka-master` komplett aus `kubectl get pods -n kube-system`
  (Kubelet konnte den Container nicht starten und meldete keinen gesunden
  Mirror-Pod mehr).
- **Reparatur:** Nach Korrektur des Manifests fuhr Kubelet den Scheduler sofort
  wieder hoch (`1/1 Running` nach 19s).

#### 3. Aufgabe 4.3 (CRD & Custom Resource)

- **Umsetzung:**
  - CRD `internalbackups.cputraining.io` angewendet.
  - Custom Resource `daily-etcd-backup` (`apiVersion: cputraining.io/v1`,
    `kind: InternalBackup`) mit `destination: /var/backups/daily` und
    `intervalMinutes: 60` im Namespace `default` instanziiert.
  - Abfrage über Kurzform `kubectl get ib` und `kubectl describe ib` liefert
    exakt die definierten Spezifikationen.

---

### Zusammenfassung Domäne 4

- **Block 1 (RBAC & Kubeconfig):** Roles, ClusterRoles, ServiceAccounts &
  Contexts sicher angewendet.
- **Block 2 (kubeadm Upgrade):** Live-Upgrade von `v1.31.0` auf `v1.31.1` auf
  echten VMs durchgeführt.
- **Block 3 (etcd Backup/Restore):** Parameter ermittelt, Snapshot gesichert,
  Disaster simuliert, Restore durchgeführt (`etcdutl`/`etcdctl`).
- **Block 4 (Static Pods & CRDs):** Kubelet-Manifeste verwaltet, Troubleshooting
  durchgeführt, CRD/CR erstellt.

Domäne 4 ist damit vollständig abgeschlossen.
