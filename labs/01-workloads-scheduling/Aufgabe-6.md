# Aufgabe 6.1 (DaemonSet)

Szenario: Ein Monitoring-Agent muss auf jedem Worker-Node im
Cluster als DaemonSet namens node-monitor mit dem Image
fluentd:v1.16-debian-1 laufen.

Lösung:

```text
❯ k apply -f node-monitor.yaml
daemonset.apps/node-monitor created

❯ k get pods -A
NAMESPACE     NAME                                 READY STATUS  RESTARTS AGE
kube-system   node-monitor-phgnz                   1/1   Running 0        3s
```

`node-monitor.yaml`:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-monitor
  namespace: kube-system
  labels:
    k8s-app: node-monitor
spec:
  selector:
    matchLabels:
      name: node-monitor
  template:
    metadata:
      labels:
        name: node-monitor
    spec:
      containers:
        - name: node-monitor
          image: fluentd:v1.16-debian-1
          volumeMounts:
            - name: varlog
              mountPath: /var/log
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

---

## Feedback zu 6.1

### ⭐ Top gelöst

- Das DaemonSet-Manifest hast du sauber aus der Doku übernommen und angepasst.
- **Wissensnetz-Detail (Warum lief er nur auf 1 Node?):**
  - `cka-cluster-worker2` hat noch den Taint `app=restricted:NoSchedule` aus
    Aufgabe 3.
  - `cka-cluster-control-plane` hat den Control-Plane Taint.
  - Ein DaemonSet respektiert standardmäßig Taints, es sei denn, man definiert
    in `template.spec.tolerations` entsprechende Ausnahmen.

---

## Aufgabe 6.2 (Static Pods)

Szenario: Du sollst auf dem Control-Plane Node
cka-cluster-control-plane einen eigenständigen, vom Kubelet
direkt verwalteten Webserver (Static Pod) namens
my-static-web mit Image nginx:alpine einrichten.

### Frage: Wie schalte ich mich in Kind auf den Node?

In **Kind** ist jeder Node ein Docker-Container. Daher nutzt du lokal
`docker exec` statt `ssh`:

```bash
docker exec -it cka-cluster-control-plane bash
```

*(In der echten CKA-Prüfung nutzt du `ssh <nodename>`)*.

### Schritte auf dem Node

1. **Static-Pod-Pfad ermitteln:**

```bash
grep -i staticPodPath /var/lib/kubelet/config.yaml
# Ausgabe: staticPodPath: /etc/kubernetes/manifests
```

1. **In das Manifest-Verzeichnis wechseln:**

```bash
cd /etc/kubernetes/manifests
ls -la
# Hier siehst du die Control-Plane Pods: etcd, kube-apiserver etc.!
```

1. **Static Pod Manifest anlegen:**

```bash
cat <<EOF > /etc/kubernetes/manifests/my-static-web.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-static-web
spec:
  containers:
  - name: web
    image: nginx:alpine
EOF
```

1. **Node verlassen (`exit`) und von außen prüfen:**

```text
❯ k get pods
NAME                                      READY STATUS  RESTARTS AGE
my-static-web-cka-cluster-control-plane   1/1   Running 0        7s
```

---

## Feedback zu 6.2

### ⭐ 100% Volltreffer

- **Wissensnetz-Erkenntnis:** Das Kubelet auf dem Node überwacht
  `/etc/kubernetes/manifests` kontinuierlich. Sobald dort eine `.yaml`-Datei
  hinterlegt wird, startet das Kubelet den Pod direkt lokal und spiegelt ihn
  über den API-Server als Mirror-Pod wider (erkennbar am Node-Suffix).
- **Löschen eines Static Pods:** Ein `kubectl delete pod ...` bringt nichts
  (das Kubelet startet ihn sofort neu!). Man muss die YAML-Datei aus dem
  Ordner `/etc/kubernetes/manifests` auf dem Node entfernen.
