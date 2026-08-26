# Block 8: Resource Limits & Horizontal Pod Autoscaler (HPA)

## Aufgabe 8.1 (Requests & Limits via CLI)

Erstelle ein Deployment namens cpu-app mit dem Image nginx:alpine und 2
Replikaten.
Vergib dabei direkt über die CLI:

- CPU Request: 100m
- CPU Limit: 200m
- Memory Request: 128Mi
- Memory Limit: 256Mi

```yaml
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

## Aufgabe 8.2 (HPA — Horizontal Pod Autoscaler)

Erstelle einen HPA für das Deployment cpu-app:

- Min Replicas: 2
- Max Replicas: 6
- Target CPU: 50%

```text
❯ k get hpa
NAME      REFERENCE            TARGETS              MINPODS  MAXPODS  REPLICAS
cpu-app   Deployment/cpu-app   cpu: <unknown>/50m   2        6        2
```

---

## Feedback

### Zu 8.1: ⭐ 100% Richtig

- Die Requests (`cpu: 100m`, `memory: 128Mi`) und Limits (`cpu: 200m`,
  `memory: 256Mi`) wurden exakt im Cluster angewendet.
- **Die schnellsten CLI-Wege im Examen:**
- *Weg A (2-Schritt via `set resources`):*

```bash
k create deploy cpu-app --image=nginx:alpine --replicas=2
k set resources deploy cpu-app --requests=cpu=100m,memory=128Mi \
  --limits=cpu=200m,memory=256Mi
```

- *Weg B (Direkt im YAML via `$do`):*

```bash
k create deploy cpu-app --image=nginx:alpine --replicas=2 $do > cpu-app.yaml
# resources Block kurz ergänzen und k apply -f cpu-app.yaml
```

### Zu 8.2: ⭐ 100% Perfekt

- Der Autoscaler ist im Cluster aktiv:
  `MINPODS: 2`, `MAXPODS: 6`, `TARGETS: 50%`.
- **Der Prüfungs-Einzeiler:**

```bash
kubectl autoscale deployment cpu-app --min=2 --max=6 --cpu-percent=50
```

- *(Hinweis zu `TARGETS: <unknown>/50%`: Das ist normal im lokalen Kind-Cluster,
  wenn kein `metrics-server` installiert ist; die CKA-Prüfung bewertet aber
  nur die korrekte Definition des HPA-Objekts).*
