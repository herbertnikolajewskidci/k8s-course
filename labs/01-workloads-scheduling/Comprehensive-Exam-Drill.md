# Comprehensive Exam Drill: Day 1 (Workloads & Scheduling)

Dieser Drill testet **alle 9 Themenbereiche** von Tag 1 in realistischen,
kombinierten Multi-Step-Aufgaben unter CKA-Prüfungsbedingungen.

---

## Szenario 1: Multi-Container, Config, Secret & Volume (3-teilig)

Erstelle im Namespace `drill-workloads` (zuerst anlegen):

1. **ConfigMap `app-config`:** Key `LOG_LEVEL=verbose`.
2. **Secret `db-secret`:** Key `API_KEY=K8sSecretKey2026`.
3. **Pod `complex-app`:**
   - **Init-Container `init-sys`:** Image `busybox`, führt
     `echo "Initialized" > /work/status.txt` aus.
   - **App-Container `web-app`:** Image `nginx:alpine`, bindet den Wert
     `LOG_LEVEL` aus der ConfigMap als Env-Variable `APP_LOG_LEVEL` ein.
   - **Sidecar-Container `log-agent`:** Image `busybox`, führt
     `sleep 3600` aus.
   - **Speicher:**
     - Beide Container mounten ein `emptyDir`-Volume `workdir` unter `/work`.
     - Der Container `log-agent` mountet zusätzlich das Secret `db-secret`
       unter `/etc/api-keys`.

---

## Szenario 2: Node Taints, Tolerations, NodeAffinity & Maintenance

1. Versehe den Node `cka-cluster-worker` mit dem Taint:
   `tier=special:NoSchedule`.
2. Erstelle ein Deployment `tolerant-deploy` (Image `redis:alpine`, 2 Replicas),
   das:
   - Den Taint `tier=special:NoSchedule` toleriert.
   - Über `nodeAffinity` (`requiredDuringSchedulingIgnoredDuringExecution`)
     zwingend nur auf Nodes platziert werden darf, die den Taint besitzen
     (bzw. auf `cka-cluster-worker`).
3. Setze `cka-cluster-worker2` in den Wartungsmodus (`cordon`), leere ihn
   vollständig (`drain` unter Berücksichtigung von DaemonSets und lokalem
   Speicher) und hebe die Sperre danach wieder auf (`uncordon`).

---

## Szenario 3: Rolling Update, Broken Image, Change-Cause & Target Rollback

1. Erstelle ein Deployment `payment-api` im Namespace `drill-workloads`:
   - Image: `nginx:1.24`
   - Replicas: 3
   - Requests: CPU `50m`, Memory `64Mi`
   - Limits: CPU `100m`, Memory `128Mi`
2. Aktualisiere das Image auf `nginx:1.25` mit der Change-Cause-Annotation
   `"Release 1.25"`.
3. Aktualisiere das Image auf `nginx:broken-tag-99` mit der Annotation
   `"Failed Release"`.
4. Überprüfe den hängenden Rollout-Status.
5. Führe einen gezielten Rollback **direkt auf Revision 2** durch (wo
   `Release 1.25` lief).
6. Erstelle einen HPA für `payment-api` (Min: 2, Max: 5, CPU-Target: 60%).

---

## Szenario 4: All-Node DaemonSet & Static Pod

1. Erstelle ein DaemonSet namens `cluster-agent` (Image `busybox`, Command
   `sleep 3600`):
   - **Prüfungsfalle:** Sorge dafür, dass das DaemonSet auf **allen Nodes**
     (auch auf der Control-Plane und auf getainteten Workern) läuft!
     *(Welche Toleration braucht das DaemonSet?)*
2. Erstelle auf dem Node `cka-cluster-control-plane` einen Static Pod namens
   `control-watchdog` (Image `busybox`, Command `sleep 3600`).

---

## Szenario 5: Advanced Batch CronJob

Erstelle einen CronJob namens `report-generator` im Namespace `drill-workloads`:

- **Schedule:** Alle 15 Minuten (`*/15 * * * *`)
- **Image:** `busybox`, Command: `echo "Report generated"`
- **RestartPolicy:** `OnFailure`
- **Erfolgreiche Historie:** Maximal 3 alte Jobs
  (`successfulJobsHistoryLimit: 3`)
- **Fehlgeschlagene Historie:** Maximal 1 alter Job
  (`failedJobsHistoryLimit: 1`)
- **Job-Timeout:** Maximal 30 Sekunden Laufzeit pro Job
  (`activeDeadlineSeconds: 30`)
- **Test-Trigger:** Stoße sofort manuell einen Job aus diesem CronJob an
  (ohne auf die 15 Minuten zu warten).

---

## Feedback & Korrekturen

### Szenario 1: Review & Ball-im-Tor Analyse

Guter Einstieg! Die Grundstruktur mit Pod, Volumes und Namespace steht.
Hier sind die entscheidenden CKA-Prüfungsfallen und Details, die der
automatisierte Exam-Grader monieren würde:

#### 1. Shell-Redirection im Command (`> /work/status.txt`)

- **Dein YAML:** `command: ["echo", '"Initialized"', ">", "/work/status.txt"]`
- **Problem:** Ohne Shell interpretiert Linux/K8s `>` und den Pfad als
  reine Text-Argumente für `echo`. Die Datei `/work/status.txt` wurde daher
  **nicht** erzeugt (`/work` blieb leer).
- **CKA Best Practice:**

  ```yaml
  command: ["sh", "-c", "echo Initialized > /work/status.txt"]
  ```

#### 2. ConfigMap & Key-Tippfehler

- **Dein CM-Data:** `LOG_LEVER: verbose` (statt `LOG_LEVEL`)
- **Env-Binding im App-Container:** Fehlt noch komplett im Pod-Manifest
  (`env: - name: APP_LOG_LEVEL ...`).
- **CKA Best Practice:**

  ```yaml
  # Schnell-Erstellung:
  # kubectl create cm app-config -n drill-workloads --from-literal=LOG_LEVEL=verbose

  # Im Container 'web-app':
  env:
    - name: APP_LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: LOG_LEVEL
  ```

#### 3. Secret-Wert Tippfehler

- **Dein Secret:** `K8sSecretKey20226` (eine `2` zu viel im base64
  `SzhzU2VjcmV0S2V5MjAyMjY=`).
- **CKA Best Practice:**

  ```bash
  kubectl create secret generic db-secret -n drill-workloads \
    --from-literal=API_KEY=K8sSecretKey2026
  ```

#### 4. Pod- & Container-Namen & Sidecar-Platzierung

- **Pod-Name:** `compex-app` (Tippfehler: `l` fehlt -> `complex-app`).
- **App-Container:** Heißt bei dir `compex-app`, sollte `web-app` heißen.
- **Sidecar-Container:** Du hast `log-agent` als K8s Native Sidecar
  (`initContainers` mit `restartPolicy: Always`) definiert – das ist
  modern (ab 1.28)! Im CKA-Standardtest wird der Sidecar aber meist klassisch
  unter `spec.containers` erwartet.

#### 5. Vollständiges Referenz-Manifest für Szenario 1

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: complex-app
  namespace: drill-workloads
spec:
  volumes:
    - name: workdir
      emptyDir: {}
    - name: db-secret-vol
      secret:
        secretName: db-secret
  initContainers:
    - name: init-sys
      image: busybox
      command: ["sh", "-c", "echo Initialized > /work/status.txt"]
      volumeMounts:
        - name: workdir
          mountPath: /work
  containers:
    - name: web-app
      image: nginx:alpine
      env:
        - name: APP_LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
      volumeMounts:
        - name: workdir
          mountPath: /work
    - name: log-agent
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: workdir
          mountPath: /work
        - name: db-secret-vol
          mountPath: /etc/api-keys
          readOnly: true
```

### Szenario 2: Review & Ball-im-Tor Analyse

Hier sind die 3 Kernpunkte, die bei deinem Manifest für Szenario 2 aufgetreten
sind:

#### 1. PodAffinity vs. NodeAffinity

- **Dein YAML:** `affinity.podAffinity`
- **Problem:** `podAffinity` sucht nach **anderen Pods** mit bestimmten
  Labels in derselben Topologie (z. B. Zone oder Node). Die Aufgabe verlangt
  aber **`nodeAffinity`**, welche die Labels des **Nodes** prüft.
- **CKA Struktur:**

  ```yaml
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/hostname
                operator: In
                values:
                  - cka-cluster-worker
  ```

#### 2. Tolerations-Ebene im Manifest (Einrückung)

- **Dein YAML:** `tolerations` stand (auskommentiert) unterhalb von
  `containers:`.
- **Problem:** `tolerations` gehört zur **PodSpec** (`spec.template.spec`),
  also auf die gleiche Ebene wie `containers:` und `affinity:`, **nicht** in
  einen einzelnen Container!
- **CKA Struktur:**

  ```yaml
  spec:
    template:
      spec:
        tolerations:
          - key: "tier"
            operator: "Equal"
            value: "special"
            effect: "NoSchedule"
        affinity:
          nodeAffinity:
            ...
        containers:
          - name: redis
            image: redis:alpine
  ```

#### 3. Taints vs. Node Labels

- **Wichtiges mentales Modell:** Ein Taint (`tier=special:NoSchedule`) ist
  eine **Abwehrmaßnahme** (Repellent), kein Label.
- Die `tolerations` erlauben dem Pod, den Taint zu betreten.
- Die `nodeAffinity` zwingt den Pod auf den Node (über Node-Labels, z. B.
  `kubernetes.io/hostname: cka-cluster-worker` oder ein Node-Label).

### Szenario 3: Review & Ball-im-Tor Analyse

Hervorragende Arbeit bei der Konfiguration von Requests/Limits, Change-Cause
und HPA! Hier ist die Analyse deines Rollout-Verlaufs:

#### 1. Deployment-Erstellung, Requests/Limits & HPA (Perfekt gelöst)

- **Deployment:** 3 Replicas mit den genauen Requests (`50m`, `64Mi`) und
  Limits (`100m`, `128Mi`) im Namespace `drill-workloads`.
- **HPA:** Zielgenau erstellt mit Min: 2, Max: 5 und CPU 60%.

#### 2. Rollout-History & Gezielter Rollback (`--to-revision`)

- **Was im Cluster zu sehen ist:**
  - Revision 3: `Release 1.25` (Image `nginx:1.25`)
  - Revision 4: `Failed Release` (Image `nginx:broken-tag-99`)
  - Aktuell (Revision 5): Läuft mit `nginx:1.24` (Basisversion).
- **Exam-Detail:** Die Aufgabenstellung verlangte, auf die Version mit
  `Release 1.25` zurückzugehen (in deinem Cluster Revision 3).
  - Ein einfaches `kubectl rollout undo` springt auf die letzte Revision
    vor dem Fehler (hier Revision 1 mit `1.24`).
  - Für einen gezielten Rollback auf die Version mit `Release 1.25`:

    ```bash
    kubectl rollout undo deployment payment-api -n drill-workloads --to-revision=3
    ```

### Szenario 4: Review & Ball-im-Tor Analyse

#### 1. Static Pod auf Control-Plane (Perfekt gelöst)

- **Pod:** `control-watchdog-cka-cluster-control-plane` läuft sauber im
  Namespace `default` auf dem Node `cka-cluster-control-plane`.
- **Weg:** Direkt über `/etc/kubernetes/manifests/` auf dem Control-Plane Node
  abgelegt.

#### 2. All-Node DaemonSet & Universal Wildcard Toleration

- **Was im Cluster zu sehen ist:** Das DaemonSet läuft auf 2 von 3 Nodes
  (`cka-cluster-worker` und `cka-cluster-worker2`), aber **nicht** auf
  `cka-cluster-control-plane` (`DESIRED: 2`).
- **Ursache:** Du hast explizit `key: tier, value: special` toleriert. Auf der
  Control-Plane liegt jedoch der Taint
  `node-role.kubernetes.io/control-plane:NoSchedule`.
- **CKA Exam Cheat-Code (Universal Toleration):** Wenn ein DaemonSet wirklich
  auf **ausnahmslos jedem Node** im Cluster laufen soll, nutzt man die
  leere Wildcard-Toleration:

  ```yaml
  tolerations:
    - operator: Exists
  ```

  *(Ohne `key` oder `effect` passt `operator: Exists` auf alle Taints!)*

### Szenario 5: Review & Ball-im-Tor Analyse

#### 1. CronJob-Konfiguration (100% Perfekt)

- **Schedule:** `*/15 * * * *` exakt getroffen.
- **Limits:** `successfulJobsHistoryLimit: 3` und `failedJobsHistoryLimit: 1`
  sauber deklariert.
- **RestartPolicy:** `OnFailure` korrekt gesetzt.
- **Timeout:** `activeDeadlineSeconds: 30` konfiguriert.

#### 2. Manueller Ad-hoc-Trigger (100% Perfekt)

- **Ausführung:** Manueller Job `test-trigger` erfolgreich erstellt
  (`kubectl create job --from=cronjob/report-generator test-trigger`).
- **Verifikation:** Job lief innerhalb von 4 Sekunden erfolgreich durch
  (`Status: Complete (1/1)`), Logausgabe `Report generated` bestätigt.
