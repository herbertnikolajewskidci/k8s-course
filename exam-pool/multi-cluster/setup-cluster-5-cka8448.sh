#!/usr/bin/env bash
# Cluster 5 (cka8448): Q5 (Kubelet PKI), Q8 (NetworkPolicy), Q14 (etcd Backup & etcdutl)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 5 (cka8448) ==="

# Q5: Kubelet PKI
mkdir -p /course/5/

# Q8: NetworkPolicy & Policy Controller
if ! kubectl get daemonset kube-network-policies -n kube-system >/dev/null 2>&1; then
  kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/kube-network-policies/main/install.yaml >/dev/null 2>&1 || true
fi
kubectl create ns secure-zone --dry-run=client -o yaml | kubectl apply -f -
kubectl create ns external-zone --dry-run=client -o yaml | kubectl apply -f -

cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-backend
  namespace: secure-zone
spec:
  replicas: 1
  selector:
    matchLabels:
      role: backend
  template:
    metadata:
      labels:
        role: backend
    spec:
      containers:
      - name: web
        image: nginx:1-alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: secure-backend
  namespace: secure-zone
spec:
  selector:
    role: backend
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: Pod
metadata:
  name: allowed-client
  namespace: secure-zone
  labels:
    role: frontend
spec:
  containers:
  - name: curl
    image: curlimages/curl
    command: ["sleep", "3600"]
---
apiVersion: v1
kind: Pod
metadata:
  name: blocked-client
  namespace: external-zone
spec:
  containers:
  - name: curl
    image: curlimages/curl
    command: ["sleep", "3600"]
EOF

# Q14: etcd Backup
mkdir -p /course/14/backup/
mkdir -p /var/lib/etcd-restore/
if [ ! -f /usr/local/bin/etcdctl ] || [ ! -f /usr/local/bin/etcdutl ]; then
  find /var/lib/containerd -name etcdctl -exec cp {} /usr/local/bin/ \; 2>/dev/null || true
  find /var/lib/containerd -name etcdutl -exec cp {} /usr/local/bin/ \; 2>/dev/null || true
  chmod +x /usr/local/bin/etcdctl /usr/local/bin/etcdutl 2>/dev/null || true
fi

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 5 (cka8448) provisioned successfully ==="
