# Notizen & Lösungen: Aufgabe 1 (Application Failure & Pod Debugging)

- **Namespace:** `troubleshoot-app`
- **Issue:** #8

---

## Lösung 1.1

```bash
# Deine Befehle / Notizen
k -n troubleshoot-app get pods
NAME           READY   STATUS                       RESTARTS   AGE
auth-service   0/1     CreateContainerConfigError   0          73s

k -n troubleshoot-app describe pod auth-service

Warning  Failed     2s (x4 over 32s)  kubelet            spec.containers{app}: Error: configmap "auth-missing-cm" not found

k create configmap auth-missing-cm -n troubleshoot-app \
  --from-literal=meaningOfEverything=42

k -n troubleshoot-app get pods
NAME           READY   STATUS   RESTARTS      AGE
auth-service   0/1     Error    2 (35s ago)   4m35s

k -n troubleshoot-app describe pod auth-service

Warning  BackOff    9s (x3 over 49s)       kubelet            spec.containers{app}: Back-off restarting failed container app in pod auth-service_troubleshoot-app(2136e4de-c8df-4c9e-9766-130c026e85c0)

k -n troubleshoot-app logs auth-service

Starting Auth Service...
>
cat: can't open '/etc/config/api-key.txt': No such file or directory

# edited auth-service.yaml: added mountPath and Volume for auth-config configMap

k -n troubleshoot-app delete pods auth-service

k create -f auth-service.yaml

k -n troubleshoot-app logs auth-service
Starting Auth Service...
secret-token-12345
```

---

## Lösung 1.2

```bash
# Analyse: Welcher Container crasht?
k -n troubleshoot-app get pod logger-pod
# READY 1/2, CrashLoopBackOff

# Logs des crashenden Containers auslesen
k -n troubleshoot-app logs logger-pod -c log-processor
# Fatal error: DB unreachable / exit 1

# Previous Log ansehen
k -n troubleshoot-app logs logger-pod -c log-processor --previous

# Korrektur des Manifests (Dauerlauf-Schleife)
# command: ["sh", "-c", "while true; do echo 'Processing logs...'; sleep 10; done"]
k -n troubleshoot-app apply -f logger-pod.yaml --force
# Ergebnis: logger-pod 2/2 Running
```

---

## Lösung 1.3

```bash
# Status Init:0/1 untersuchen
k -n troubleshoot-app get pod db-client
k -n troubleshoot-app logs db-client -c wait-for-db

# Backend Dummy-Pod und Service bereitstellen
k -n troubleshoot-app run dummy-pod --image=busybox:latest --restart=Never -- nc -lk -p 5432
k -n troubleshoot-app expose pod dummy-pod --name=database-service --port=5432

# Verifikation:
k -n troubleshoot-app get pods
# db-client wechselt auf 1/1 Running, wait-for-db Completed (Exit Code 0)
```

---

## Lösung 1.4

```bash
# Deine Befehle / Notizen
k get pods -w -n troubleshoot-app
NAME             READY   STATUS             RESTARTS        AGE
auth-service     1/1     Running            1 (25m ago)     85m
db-client        1/1     Running            0               37m
dummy-pod        1/1     Running            1 (6m51s ago)   6m53s
health-failing   0/1     CrashLoopBackOff   3 (16s ago)     65s
logger-pod       2/2     Running            0               57m
health-failing   1/1     Running            4 (24s ago)     73s


```
