#!/usr/bin/env bash
# Setup-Skript fuer Slot 01 (DNS & FQDN)
# Bereitet die Ziel-Namespaces, Services, Headless Services und das beschaedigte Deployment vor.

set -euo pipefail

echo "=== [Slot 01 Setup] Initialisiere DNS-Szenario im Cluster ==="

# 1. Namespaces anlegen
kubectl create namespace core-routing --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace storage-tier --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# 2. Headless Service und Stateful Pods in storage-tier
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
EOF

# 3. Monitor Pod in monitoring mit bekannter IP
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
    resources:
      requests:
        cpu: 10m
        memory: 20Mi
EOF

# 4. Fehlerhafte ConfigMap in core-routing anlegen
cat << 'EOF' | kubectl apply -f -
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
EOF

# 5. Service Router Deployment in core-routing
cat << 'EOF' | kubectl apply -f -
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
          echo "Starting service router with configured endpoints..."
          echo "Checking ENDPOINT_CORE=$ENDPOINT_CORE"
          echo "Checking ENDPOINT_STORAGE=$ENDPOINT_STORAGE"
          echo "Checking ENDPOINT_PRIMARY_POD=$ENDPOINT_PRIMARY_POD"
          echo "Checking ENDPOINT_MONITOR=$ENDPOINT_MONITOR"
          
          # DNS-Check: Wenn es nur Kurznamen sind, scheitern vollqualifizierte nslookup
          nslookup "$ENDPOINT_CORE" || echo "FAILED_CORE"
          nslookup "$ENDPOINT_STORAGE" || echo "FAILED_STORAGE"
          nslookup "$ENDPOINT_PRIMARY_POD" || echo "FAILED_POD"
          nslookup "$ENDPOINT_MONITOR" || echo "FAILED_MONITOR"
          
          # Halte Container am Leben fuer Inspektion
          sleep 3600
        envFrom:
        - configMapRef:
            name: router-endpoints
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
EOF

echo "=== [Slot 01 Setup] Fertig! Deployment und Endpoints sind bereit. ==="
