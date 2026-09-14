#!/usr/bin/env bash
# Cluster 2 (cka2560): Q2 (Kubeconfig), Q7 (Gateway API), Q11 (PV Recovery Retain)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 2 (cka2560) ==="

# Q2: Kubeconfig Extraction
mkdir -p /course/2/
cat << 'EOF' > /course/2/kubeconfig
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://10.96.0.1:443
  name: production-cluster
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://10.96.0.2:443
  name: staging-cluster
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://10.96.0.3:443
  name: dev-cluster
contexts:
- context:
    cluster: production-cluster
    user: account-0042
  name: prod-context
- context:
    cluster: staging-cluster
    user: account-0012
  name: staging-context
- context:
    cluster: dev-cluster
    user: developer
  name: dev-context
current-context: prod-context
users:
- name: account-0042
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJrakNDQVRxZ0F3SUJBZ0lVUkc3bE1rd251a3h5d21tK25qK0JqV1d0ZzBVd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0V6RVJNQThHQTFVRUNnd0lTSEZpWld4bGNpMVpibVJwYm1jd0hoY05Nall3T1RFME1ERXlNRFkyV2hjTgpNall3T1RFNE1ERXlNRFkyV2jBNk1RNHdEQVlEVlFRS0RBVlNiM0psTFhkdmNtdHdiMkZ5ZEVBeEZEQVNCZ05WCkJBTU1DMkZqWTI5MWJuUXRNREF3TkRJd2dnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUIKQVFDUG4vL3gvZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
- name: account-0012
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
EOF

# Q7: Gateway API & HTTPRoute
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml 2>/dev/null || true
kubectl create ns gateway-infra --dry-run=client -o yaml | kubectl apply -f -

cat << 'EOF' | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: standard-gateway-class
spec:
  controllerName: "example.com/gateway-controller"
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: app-gateway
  namespace: gateway-infra
spec:
  gatewayClassName: standard-gateway-class
  listeners:
  - name: http
    protocol: HTTP
    port: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v1
  namespace: gateway-infra
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-v1
  template:
    metadata:
      labels:
        app: web-v1
    spec:
      containers:
      - name: nginx
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web-v1-svc
  namespace: gateway-infra
spec:
  selector:
    app: web-v1
  ports:
  - port: 8080
    targetPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v2
  namespace: gateway-infra
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-v2
  template:
    metadata:
      labels:
        app: web-v2
    spec:
      containers:
      - name: nginx
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web-v2-svc
  namespace: gateway-infra
spec:
  selector:
    app: web-v2
  ports:
  - port: 8080
    targetPort: 80
EOF

# Q11: PV Recovery Retain
kubectl create ns storage-recovery --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /mnt/data/retained-pv
echo "CRITICAL DATABASE BACKUP 2026" > /mnt/data/retained-pv/db.dump

cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-retained-data
spec:
  capacity:
    storage: 500Mi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data/retained-pv
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: old-pvc
  namespace: storage-recovery
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: manual
  resources:
    requests:
      storage: 500Mi
EOF

sleep 1
kubectl delete pvc old-pvc -n storage-recovery --wait=true 2>/dev/null || true

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 2 (cka2560) provisioned successfully ==="
