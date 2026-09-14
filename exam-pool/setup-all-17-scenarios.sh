#!/usr/bin/env bash
# Global Exam Setup Script (V2): Provisions all 17 authentic Killer.sh-parity
# exam scenarios on cka-exam-runner and cka-worker1.
# Zero spoilers, real multi-layering, and accurate CKA standards.

set -euo pipefail

echo "================================================================="
echo "=== [CKA Exam Setup V2] Provisioning 17 Authentic Scenarios  ==="
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
EOF

if ! kubectl get pod monitor-agent -n monitoring >/dev/null 2>&1; then
  cat << 'EOF' | kubectl apply -f -
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
    ports:
    - containerPort: 80
EOF
fi

# Only create broken ConfigMap and deployment if not already working
if ! kubectl get configmap router-endpoints -n core-routing >/dev/null 2>&1; then
  cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-endpoints
  namespace: core-routing
data:
  ENDPOINT_CORE: "kubernetes"
  ENDPOINT_STORAGE: "storage-vault.storage-tier"
  ENDPOINT_PRIMARY_POD: "vault-0.storage-tier"
  ENDPOINT_MONITOR: "monitor-agent.monitoring"
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
        image: curlimages/curl
        command:
        - /bin/sh
        - -c
        - |
          while true; do
            echo "--- Resolving Endpoints ---"
            nslookup ${ENDPOINT_CORE} || echo "FAIL: ENDPOINT_CORE"
            nslookup ${ENDPOINT_STORAGE} || echo "FAIL: ENDPOINT_STORAGE"
            nslookup ${ENDPOINT_PRIMARY_POD} || echo "FAIL: ENDPOINT_PRIMARY_POD"
            nslookup ${ENDPOINT_MONITOR} || echo "FAIL: ENDPOINT_MONITOR"
            sleep 10
          done
        envFrom:
        - configMapRef:
            name: router-endpoints
EOF
fi

# -------------------------------------------------------------
# Q2: Kubeconfig Extraction (/course/2/)
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
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJrakNDQVRxZ0F3SUJBZ0lVUkc3bE1rd251a3h5d21tK25qK0JqV1d0ZzBVd0RRWUpLb1pJaHZjTkFRRUwKQlFBd0V6RVJNQThHQTFVRUNnd0lTSEZpWld4bGNpMVpibVJwYm1jd0hoY05Nall3T1RFME1ERXlNRFkyV2hjTgpNall3T1RFNE1ERXlNRFkyV2pBNk1RNHdEQVlEVlFRS0RBVlNiM0psTFhkdmNtdHdiMkZ5ZEVBeEZEQVNCZ05WCkJBTU1DMkZqWTI5MWJuUXRNREF3TkRJd2dnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUIKQVFDUG4vL3gvZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
- name: account-0012
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
EOF

# -------------------------------------------------------------
# Q3: Multi-Container Pod & Downward API (project-tiger)
# -------------------------------------------------------------
echo "--> Setting up Q3 (Multi-Container Pod & Downward API)..."
kubectl create ns project-tiger --dry-run=client -o yaml | kubectl apply -f -

# -------------------------------------------------------------
# Q4: Cross-Pod HTTP ReadinessProbe with wget (project-alpha)
# Service exists without endpoints; candidate deploys probe & backend pod
# -------------------------------------------------------------
echo "--> Setting up Q4 (Cross-Pod ReadinessProbe)..."
kubectl create ns project-alpha --dry-run=client -o yaml | kubectl apply -f -
# Clean up any leftover backend pod from previous runs
kubectl delete pod backend-pod -n project-alpha --ignore-not-found=true 2>/dev/null || true
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

# -------------------------------------------------------------
# Q5: Kubelet PKI & OpenSSL Certificate Inspection (/course/5/)
# -------------------------------------------------------------
echo "--> Setting up Q5 (Kubelet PKI Inspection directory)..."
mkdir -p /course/5/

# -------------------------------------------------------------
# Q6: Kubelet Systemd Drop-in backup
# -------------------------------------------------------------
echo "--> Setting up Q6 (Kubelet Systemd Drop-in)..."
mkdir -p /course/6/

# -------------------------------------------------------------
# Q7: Gateway API & HTTPRoute (gateway-infra)
# -------------------------------------------------------------
echo "--> Setting up Q7 (Gateway API & HTTPRoute)..."
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

# -------------------------------------------------------------
# Q8: NetworkPolicy Ingress Isolation (secure-zone)
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

# -------------------------------------------------------------
# Q9: Kustomize Overlays & HPA (/course/9/api-service)
# -------------------------------------------------------------
echo "--> Setting up Q9 (Kustomize Structure & Legacy ConfigMap)..."
kubectl create ns staging-zone --dry-run=client -o yaml | kubectl apply -f -
kubectl create ns prod-zone --dry-run=client -o yaml | kubectl apply -f -

# Pre-create legacy configmaps to be deleted by candidate
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

# -------------------------------------------------------------
# Q10: StorageClass Dynamic Provisioning & WaitForFirstConsumer
# -------------------------------------------------------------
echo "--> Setting up Q10 (StorageClass, Local Path & Job Manifest)..."
# Ensure local-path-provisioner is present
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml 2>/dev/null || true
kubectl create ns project-bern --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /course/10/

cat << 'EOF' > /course/10/data-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-job
  namespace: project-bern
spec:
  template:
    metadata:
      labels:
        app: data-job
    spec:
      restartPolicy: OnFailure
      containers:
      - name: worker
        image: busybox:latest
        command: ["sh", "-c", "echo 'Batch job processed data' > /mnt/job-data/output.log && sleep 5"]
        # Candidate mounts PVC job-pvc at /mnt/job-data
EOF

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

# Delete claim to transition PV into Released
sleep 1
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
echo "--> Setting up Q15 (Node Maintenance drill)..."
kubectl create ns maintenance-drill --dry-run=client -o yaml | kubectl apply -f -

cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker-drain-test
  namespace: maintenance-drill
spec:
  replicas: 2
  selector:
    matchLabels:
      app: drain-test
  template:
    metadata:
      labels:
        app: drain-test
    spec:
      containers:
      - name: app
        image: nginx:1-alpine
        volumeMounts:
        - name: local-storage
          mountPath: /data
      volumes:
      - name: local-storage
        emptyDir: {}
EOF

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
# Q17: crictl Low-Level Container Inspection & Logs (project-tiger)
# -------------------------------------------------------------
echo "--> Setting up Q17 (crictl Telemetry Pod & Directory)..."
mkdir -p /course/17/

cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: tiger-telemetry
  namespace: project-tiger
  labels:
    app: tiger-telemetry
spec:
  nodeName: cka-worker1
  containers:
  - name: telemetry-agent
    image: busybox:latest
    command:
    - /bin/sh
    - -c
    - |
      while true; do
        echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] TELEMETRY STATUS OK: subsystem active"
        sleep 3
      done
EOF

# Ensure /course directories are writable by candidate
mkdir -p /course
chown -R cka-admin:cka-admin /course 2>/dev/null || true
chmod -R 775 /course 2>/dev/null || true

echo "================================================================="
echo "=== [CKA Exam Setup V2] SUCCESS: All 17 Scenarios Ready!      ==="
echo "================================================================="
