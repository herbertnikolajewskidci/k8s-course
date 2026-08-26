# Aufgabe 1: Imperative Speed-Generators

## Eingereichte Lösungen

### Aufgabe 1.1

```bash
kubectl run api-server --image nginx:alpine --port 8080 --env ENVIRONMENT=production
```

### Aufgabe 1.2

```bash
kubectl run busy-worker --dry-run=client --image busybox \
  --command "sleep 3600" -o yaml > busy-worker.yaml
```

### Aufgabe 1.3

```bash
kubectl create deployment frontend --image httpd:alpine --replicas 3
kubectl expose deployment frontend --expose 80
```

---

## Feedback & Korrekturen

### Zu 1.1: ⭐ 100% Richtig

- Pod startet fehlerfrei mit Port 8080 und Umgebungsvariable
  `ENVIRONMENT=production`.

### Zu 1.2: ⚠️ CKA-Falle bei `--command`

- **Problem:** `--command "sleep 3600"` erzeugt im YAML
  `command: ["sleep 3600"]`. Der Container sucht nach einer Binary namens
  `"sleep 3600"` und crasht mit `CrashLoopBackOff`
  (`exec: "sleep 3600": executable file not found in $PATH`).
- **Korrektur:** Den `--` Trenner nutzen:

```bash
kubectl run busy-worker --image=busybox $do --command -- sleep 3600 > busy-worker.yaml
```

### Zu 1.3: ⚠️ Syntax bei `kubectl expose`

- **Problem:** `--expose` existiert bei `kubectl expose` nicht.
- **Korrektur:** `--port` und optional `--name` angeben:

```bash
kubectl create deployment frontend --image=httpd:alpine --replicas=3
kubectl expose deployment frontend --name=frontend-svc --port=80 --target-port=80
```
