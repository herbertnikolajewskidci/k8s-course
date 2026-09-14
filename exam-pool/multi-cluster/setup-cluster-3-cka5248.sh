#!/usr/bin/env bash
# Cluster 3 (cka5248 & cka5248-node1): Q3 (Downward API), Q9 (Kustomize Overlays), Q12 (Secrets SubPath)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 3 (cka5248) ==="

# Q3: Multi-Container Pod & Downward API
kubectl create ns project-tiger --dry-run=client -o yaml | kubectl apply -f -

# Q9: Kustomize Overlays & HPA
kubectl create ns staging-zone --dry-run=client -o yaml | kubectl apply -f -
kubectl create ns prod-zone --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n staging-zone --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n prod-zone --dry-run=client -o yaml | kubectl apply -f -

mkdir -p /course/9/api-service/base/
mkdir -p /course/9/api-service/staging/
mkdir -p /course/9/api-service/prod/

cat << 'EOF' > /course/9/api-service/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: web
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 50m
            memory: 50Mi
EOF

cat << 'EOF' > /course/9/api-service/base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api-service
  ports:
  - port: 80
    targetPort: 80
EOF

cat << 'EOF' > /course/9/api-service/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
EOF

cat << 'EOF' > /course/9/api-service/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: staging-zone
resources:
- ../base
EOF

cat << 'EOF' > /course/9/api-service/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod-zone
resources:
- ../base
EOF

# Q12: Secrets Management
kubectl create ns secret-mgmt --dry-run=client -o yaml | kubectl apply -f -

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 3 (cka5248) provisioned successfully ==="
