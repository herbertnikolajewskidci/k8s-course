#!/usr/bin/env bash
# Global Exam Setup Script: Provisions all 17 Killer.sh-parity exam scenarios
# in isolated namespaces, directories, and paths on cka-exam-runner.

set -euo pipefail

echo "================================================================="
echo "=== [CKA Exam Setup] Provisioning All 17 Real Exam Scenarios ==="
echo "================================================================="

# -------------------------------------------------------------
# Q1: DNS / FQDN (core-routing, storage-tier, monitoring)
# -------------------------------------------------------------
echo "--> Setting up Q1 (CoreDNS & FQDN)..."
kubectl create ns core-routing --dry-run=client -o yaml | kubectl apply -f -
kubectl create ns storage-tier --dry-run=client -o yaml | kubectl apply -f -
kubectl create ns monitoring --dry-run=client -o yaml | kubectl apply -f -

cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: storage-vault
  namespace: storage-tier
spec:
  clusterIP: None
  selector:
    app: storage-vault
  ports:
  - name: vault-port
    port: 8200
    targetPort: 8200
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vault
  namespace: storage-tier
spec:
  serviceName: storage-vault
  replicas: 2
  selector:
    matchLabels:
      app: storage-vault
  template:
    metadata:
      labels:
        app: storage-vault
    spec:
      containers:
      - name: vault
        image: nginx:1-alpine
        ports:
        - containerPort: 8200
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
---
apiVersion: v1
kind: Pod
metadata:
  name: monitor-agent
  namespace: monitoring
  labels:
    app: monitor-agent
spec:
  containers:
  - name: agent
    image: nginx:1-alpine
    resources:
      requests:
        cpu: 10m
        memory: 20Mi
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-endpoints
  namespace: core-routing
data:
  ENDPOINT_CORE: "kubernetes"
  ENDPOINT_STORAGE: "storage-vault"
  ENDPOINT_PRIMARY_POD: "vault-0"
  ENDPOINT_MONITOR: "10.244.1.88"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-router
  namespace: core-routing
spec:
  replicas: 2
  selector:
    matchLabels:
      app: service-router
  template:
    metadata:
      labels:
        app: service-router
    spec:
      containers:
      - name: router
        image: busybox:latest
        command:
        - sh
        - -c
        - |
          echo "Checking endpoints..."
          nslookup "$ENDPOINT_CORE" || echo "FAILED_CORE"
          nslookup "$ENDPOINT_STORAGE" || echo "FAILED_STORAGE"
          nslookup "$ENDPOINT_PRIMARY_POD" || echo "FAILED_POD"
          nslookup "$ENDPOINT_MONITOR" || echo "FAILED_MONITOR"
          sleep 3600
        envFrom:
        - configMapRef:
            name: router-endpoints
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
EOF

# -------------------------------------------------------------
# Q2: Kubeconfig Extraction & Contexts (/course/2/)
# -------------------------------------------------------------
echo "--> Setting up Q2 (Kubeconfig & Context Extraction)..."
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
    user: account-0099
  name: prod-context
- context:
    cluster: staging-cluster
    user: account-0042
  name: staging-context
- context:
    cluster: dev-cluster
    user: account-0013
  name: dev-context
current-context: staging-context
users:
- name: account-0042
  user:
    client-certificate-data: Q0tBLVJFVFlJTkctQ0xJRU5ULUNFUlQtREVDT0RFRC1PMEs=
- name: account-0099
  user:
    client-certificate-data: UFJPRC1DRVJUSUZJQ0FURS1EQVRBCg==
- name: account-0013
  user:
    client-certificate-data: REVWLUNFUlRJRklDQVRFLURBVEEK
EOF
chmod 644 /course/2/kubeconfig

# -------------------------------------------------------------
# Q3: Multi-Container Pod & Downward API (project-tiger)
# -------------------------------------------------------------
echo "--> Setting up Q3 (Multi-Container Pod & Downward API)..."
kubectl create ns project-tiger --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q4: Cross-Pod ReadinessProbe with wget (project-alpha)
# -------------------------------------------------------------
echo "--> Setting up Q4 (Readiness Probe with wget)..."
kubectl create ns project-alpha --dry-run=client -o yaml | kubectl apply -f -
cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-service
  namespace: project-alpha
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend-service
  template:
    metadata:
      labels:
        app: backend-service
    spec:
      containers:
      - name: web
        image: nginx:1-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
---
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

# -------------------------------------------------------------
# Q5: Kubelet PKI & OpenSSL Zertifikatsprüfung (/var/lib/kubelet/pki/)
# -------------------------------------------------------------
echo "--> Setting up Q5 (Kubelet PKI & OpenSSL Inspection)..."
mkdir -p /course/5/

# -------------------------------------------------------------
# Q6: Kubelet Systemd Drop-In Troubleshooting
# -------------------------------------------------------------
echo "--> Setting up Q6 (Kubelet Systemd Drop-in backup)..."
mkdir -p /course/6/

# -------------------------------------------------------------
# Q7: Gateway API & HTTPRoute (gateway-infra)
# -------------------------------------------------------------
echo "--> Setting up Q7 (Gateway API & HTTPRoute CRDs)..."
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml 2>/dev/null || true
kubectl create ns gateway-infra --dry-run=client -o yaml | kubectl apply -f -

cat << 'EOF' | kubectl apply -f -
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

# -------------------------------------------------------------
# Q8: NetworkPolicy Ingress & Egress Isolation (secure-zone)
# -------------------------------------------------------------
echo "--> Setting up Q8 (NetworkPolicy Isolation)..."
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
      - name: nginx
        image: nginx:1-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
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
  labels:
    role: attacker
spec:
  containers:
  - name: curl
    image: curlimages/curl
    command: ["sleep", "3600"]
EOF

# -------------------------------------------------------------
# Q9: Manual Scheduling with nodeName (/course/9/)
# -------------------------------------------------------------
echo "--> Setting up Q9 (Manual Scheduling)..."
kubectl create ns manual-schedule --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q10: StorageClass Dynamic Provisioning & WaitForFirstConsumer
# -------------------------------------------------------------
echo "--> Setting up Q10 (StorageClass & PVC)..."
kubectl create ns project-bern --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q11: PV/PVC Recovery with Retain Policy (storage-recovery)
# -------------------------------------------------------------
echo "--> Setting up Q11 (PV Recovery Retain)..."
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

# Lösche den alten Claim künstlich, damit das PV in "Released" verfällt
sleep 2
kubectl delete pvc old-pvc -n storage-recovery --wait=true 2>/dev/null || true

# -------------------------------------------------------------
# Q12: Secrets Management & Volume SubPath (secret-mgmt)
# -------------------------------------------------------------
echo "--> Setting up Q12 (Secret Management)..."
kubectl create ns secret-mgmt --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q13: RBAC Dreisatz (ServiceAccount, Role, RoleBinding)
# -------------------------------------------------------------
echo "--> Setting up Q13 (RBAC)..."
kubectl create ns dev-rbac --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q14: etcd Backup Snapshot (/course/14/)
# -------------------------------------------------------------
echo "--> Setting up Q14 (etcd Snapshot Target)..."
mkdir -p /course/14/backup/
mkdir -p /var/lib/etcd-restore/

# -------------------------------------------------------------
# Q15: Node Maintenance (Drain & Cordon)
# -------------------------------------------------------------
echo "--> Setting up Q15 (Node Maintenance namespace)..."
kubectl create ns maintenance-drill --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q16: Pending Pod Forensik (wp-forensics)
# -------------------------------------------------------------
echo "--> Setting up Q16 (Pending Pod Forensics)..."
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

# -------------------------------------------------------------
# Q17: PriorityClass & Pod Preemption (high-priority-zone)
# -------------------------------------------------------------
echo "--> Setting up Q17 (PriorityClass & Preemption)..."
kubectl create ns priority-zone --dry-run=client -o yaml | kubectl apply -f -

echo "================================================================="
echo "=== [CKA Exam Setup] SUCCESS: All 17 Scenarios Ready in Cluster =="
echo "================================================================="
