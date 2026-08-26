# Block 9: Jobs & CronJobs (Letzter regulärer Block für Tag 1)

In der CKA-Prüfung kommen Jobs und CronJobs häufig vor (z. B. mit completions,
parallelism, backoffLimit oder Cron-Syntax).

## Aufgabe 9.1 (Einmaliger Batch Job mit Parallelausführung)

Erstelle einen Job namens batch-job mit Image busybox, der den Befehl sleep 5
ausführt.
Der Job soll:

- Insgesamt 3 erfolgreiche Durchläufe haben (completions: 3)
- Maximal 2 Pods parallel ausführen (parallelism: 2)

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  parallelism: 2
  completions: 3
  template:
    spec:
      containers:
        - command:
            - sleep
            - "5"
          image: busybox
          name: batch-job
      restartPolicy: Never
```

## Aufgabe 9.2 (CronJob mit Schedule & History Limit)

Erstelle einen CronJob namens hourly-cleanup mit Image busybox, der den Befehl
echo "Cleanup done" ausführt.
Der CronJob soll:

- Jede Stunde zur Minute 0 laufen (0 \* \* \* \*)
- Maximal 2 erfolgreiche alte Jobs in der Historie behalten
  (successfulJobsHistoryLimit: 2)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hourly-cleanup
spec:
  successfulJobsHistoryLimit: 2
  schedule: 0 * * * *
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - command:
                - echo
                - Cleanup done
              image: busybox
              name: hourly-cleanup
          restartPolicy: OnFailure
```

---

## Feedback

### Zu 9.1 & 9.2: ⭐ 100% Perfekt und fehlerfrei gelöst

- **Job `batch-job`:** Lief sauber durch (`Complete 3/3`) mit maximal 2 Pods
  parallel.
- **CronJob `hourly-cleanup`:** `schedule: 0 * * * *` und
  `successfulJobsHistoryLimit: 2` wurden exakt an den richtigen Stellen in der
  Hierarchie platziert.
- **Wissensnetz-Merker für die Prüfung:**
  - Bei normalen Jobs ist `restartPolicy: Never` oder `OnFailure` Pflicht
    (`Always` ist bei Jobs verboten!).
  - Man kann einen CronJob manuell zum Testen sofort anstoßen mit:
    `kubectl create job --from=cronjob/hourly-cleanup test-run`
