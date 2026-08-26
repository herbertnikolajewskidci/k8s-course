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
