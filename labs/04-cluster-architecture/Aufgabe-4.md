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
```

### Lösung 4.2

```bash
# Deine Befehle / Notizen
```

### Lösung 4.3

```bash
# Deine Befehle / Notizen
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

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
