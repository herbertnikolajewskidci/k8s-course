# Lösung & Notizen: Aufgabe Q04 (ReadinessProbe & Service Endpoint Resolution)

## Notizen & Befehle

### 1. Service-Inspektion auf cka3200

```bash
kubectl get svc backend-service -n project-alpha -o yaml
```

- Service-Port: `80`
- Selector: `app: backend-service`

### 2. Monitoring Pod (`probe-checker`)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-checker
  namespace: project-alpha
  labels:
    run: probe-checker
spec:
  containers:
    - name: probe-checker
      image: busybox:latest
      command: ["sleep", "3600"]
      readinessProbe:
        exec:
          command:
            - wget
            - -q
            - -O
            - "-"
            - http://backend-service:80
        periodSeconds: 5
```

### 3. Backend Pod (`backend-pod`)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend-pod
  namespace: project-alpha
  labels:
    app: backend-service
spec:
  containers:
    - name: backend-pod
      image: nginx:1-alpine
      resources: {}
```

### 4. Verifikation

```bash
kubectl get pods,svc,ep -n project-alpha
```

- `backend-pod` läuft mit `1/1 Running` auf `cka3200`.
- `endpoints/backend-service` bindet `10.244.0.20:80`.
- `probe-checker` wechselt auf `1/1 Ready`.
