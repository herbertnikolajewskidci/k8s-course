# Aufgabe 1

Aufgabe 1.1

```bash
kubectl run api-server --image nginx:alpine --port 8080 \
  --env ENVIRONMENT=production
```

Aufgabe 1.2

```bash
kubectl run busy-worker --dry-run=client --image busybox \
  --command "sleep 3600" -o yaml > busy-worker.yaml
```

Aufgabe 1.3

```bash
kubectl create deployment frontend --image httpd:alpine --replicas 3
kubectl expose deployment frontend --expose 80
```

---

## Feedback

### 1.1

- Richtig.

### 1.2

- `--command "sleep 3600"` sucht nach der Datei `"sleep 3600"` und crasht.
- Richtig:
  `kubectl run busy-worker --image=busybox $do --command -- sleep 3600 > busy-worker.yaml`

### 1.3

- Flag `--expose` gibt es bei `kubectl expose` nicht.
- Richtig:
  `kubectl expose deployment frontend --name=frontend-svc --port=80 --target-port=80`
