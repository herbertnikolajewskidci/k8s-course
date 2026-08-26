# Szenario

1. Erstelle einen neuen Namespace namens prod-system.
1. Erstelle in prod-system ein Deployment namens backend-processor:
   - Image: nginx:1.24
   - Replicas: 3
   - Labels: tier=backend
   - Requests: CPU 50m, Memory 64Mi
   - Limits: CPU 100m, Memory 128Mi
   - NodeAffinity / NodeSelector: Soll bevorzugt oder zwingend auf einem Node mit
     disktype=ssd laufen.
1. Führe ein Rolling Update auf nginx:1.25 durch und stelle sicher, dass in
   kubectl rollout history der Grund "Upgrade to 1.25" sichtbar ist.
1. Erstelle im Namespace prod-system einen Job namens cache-warmup:
   - Image: busybox
   - Befehl: echo "Cache is warm"
   - Completions: 1
   - RestartPolicy: Never

Lösung:

- Schritt 1 & 2: siehe `bp.yaml`
- Schritt 3:

```bash
k set image -n prod-system deployment/backend-processor nginx=nginx:1.25
k annotate -n prod-system deployments/backend-processor \
  kubernetes.io/change-cause="Upgrade to 1.25"
```

- Schritt 4: siehe `cache-job.yaml`

---

## Feedback & Auswertung

### ⭐⭐⭐ 100% CKA-Prüfungsreife (Grade: A+)

- **Namespace `prod-system`:** Sauber isoliert angelegt.
- **Deployment `backend-processor`:**
  - `replicas: 3` & Labels `tier=backend` exakt gesetzt.
  - Ressourcen: `requests` (50m/64Mi) und `limits` (100m/128Mi) vollständig.
  - **NodeAffinity:** Perfekt gelöst mit
    `requiredDuringSchedulingIgnoredDuringExecution` auf `disktype In [ssd]`.
- **Rolling Update & History:**
  - Revision 2 zeigt im Cluster sauber: `CHANGE-CAUSE: Upgrade to 1.25`.
  - Alle 3 Pods laufen gesund auf `nginx:1.25`.
- **Batch-Job `cache-warmup`:**
  - Status: `Complete 1/1` in 5s.
  - `restartPolicy: Never` korrekt implementiert.
