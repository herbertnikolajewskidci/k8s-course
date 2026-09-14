#!/usr/bin/env bash
# Cluster 4 (cka3200): Q4 (ReadinessProbe), Q13 (RBAC), Q16 (Pending Pod Forensics)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 4 (cka3200) ==="

# Q4: Cross-Pod ReadinessProbe
kubectl create ns project-alpha --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod probe-checker backend-pod -n project-alpha --ignore-not-found=true 2>/dev/null || true
kubectl delete deployment backend-service -n project-alpha --ignore-not-found=true 2>/dev/null || true

cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: project-alpha
spec:
  selector:
    app: backend-service
  ports:
  - port: 80
    targetPort: 80
EOF

# Q13: RBAC
kubectl create ns dev-rbac --dry-run=client -o yaml | kubectl apply -f -

# Q16: Pending Pod Forensics
kubectl create ns wp-forensics --dry-run=client -o yaml | kubectl apply -f -
cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-pipeline
  namespace: wp-forensics
spec:
  replicas: 2
  selector:
    matchLabels:
      app: analytics-pipeline
  template:
    metadata:
      labels:
        app: analytics-pipeline
    spec:
      nodeSelector:
        hardware-tier: accelerator
      containers:
      - name: worker
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
EOF

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 4 (cka3200) provisioned successfully ==="
