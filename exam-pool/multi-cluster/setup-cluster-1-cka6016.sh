#!/usr/bin/env bash
# Cluster 1 (cka6016): Q1 (CoreDNS FQDN), Q10 (StorageClass), Q15 (Drain), Q17 (crictl)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 1 (cka6016) ==="

# Q1: CoreDNS & FQDN
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

# Q10: StorageClass & Job
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
EOF

# Q15: Node Maintenance
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

# Q17: crictl Pod Workload
mkdir -p /course/17/
kubectl create ns project-tiger --dry-run=client -o yaml | kubectl apply -f -
cat << 'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tiger-telemetry
  namespace: project-tiger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tiger-telemetry
  template:
    metadata:
      labels:
        app: tiger-telemetry
    spec:
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

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 1 (cka6016) provisioned successfully ==="
