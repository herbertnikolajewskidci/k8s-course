#!/usr/bin/env bash
set -euo pipefail

echo "=== [Lab 05] Initialisiere Ausgangszustand fuer alle 4 Szenarien ==="

# 1. Node-Baseline vorbereiten
echo "--> 1. Nodes vorbereiten (Uncordon & Label-Baseline)..."
kubectl uncordon cka-cluster-worker2 2>/dev/null || true
kubectl label node cka-cluster-worker tier=backend --overwrite
kubectl label node cka-cluster-worker2 tier- 2>/dev/null || true

# 2. Namespaces sicherstellen
for ns in wp-scenario-1 wp-scenario-2 wp-scenario-3 wp-scenario-4; do
  kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
done

# 3. Alte Deployments entfernen und auf Loeschung warten
echo "--> Bereinige alte Deployments..."
for ns in wp-scenario-1 wp-scenario-2 wp-scenario-3 wp-scenario-4; do
  kubectl delete deploy --all -n "$ns" --wait=false 2>/dev/null || true
  kubectl delete pods --all -n "$ns" --grace-period=0 --force 2>/dev/null || true
done

# 4. Szenario 1 deployen (HostPort: 8088)
echo "--> 2. Deploye Szenario 1 (HostPort 8088)..."
kubectl apply -f - <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-hp
  namespace: wp-scenario-1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-hp
  template:
    metadata:
      labels:
        app: wordpress-hp
    spec:
      containers:
      - name: wordpress
        image: nginx:1-alpine
        ports:
        - containerPort: 80
          hostPort: 8088
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
YAML

# 5. Szenario 4 deployen (RWO PVC)
echo "--> 3. Deploye Szenario 4 (PVC ReadWriteOnce)..."
kubectl apply -f - <<YAML
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wp-pvc
  namespace: wp-scenario-4
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Mi
  storageClassName: standard
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-rwo
  namespace: wp-scenario-4
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-rwo
  template:
    metadata:
      labels:
        app: wordpress-rwo
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: worker
      topologySpreadConstraints:
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: wordpress-rwo
      containers:
      - name: wordpress
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
        volumeMounts:
        - mountPath: /var/www/html
          name: data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: wp-pvc
YAML

# 6. Szenario 3 deployen (NodeSelector tier: backend)
echo "--> 4. Deploye Szenario 3 (NodeSelector tier: backend)..."
kubectl apply -f - <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-selector
  namespace: wp-scenario-3
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-selector
  template:
    metadata:
      labels:
        app: wordpress-selector
    spec:
      nodeSelector:
        tier: backend
      containers:
      - name: wordpress
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 5500m
            memory: 20Mi
YAML

# Warten bis Pods von Szenario 1, 3 und 4 gebunden sind
sleep 4

# 7. Worker2 fuer Szenario 2 cordonen
echo "--> 5. Cordon cka-cluster-worker2 fuer Szenario 2..."
kubectl cordon cka-cluster-worker2

# 8. Szenario 2 deployen (Cordoned Node)
echo "--> 6. Deploye Szenario 2 (Cordoned Node)..."
kubectl apply -f - <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-cordon
  namespace: wp-scenario-2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-cordon
  template:
    metadata:
      labels:
        app: wordpress-cordon
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: worker
      topologySpreadConstraints:
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: wordpress-cordon
      containers:
      - name: wordpress
        image: nginx:1-alpine
        resources:
          requests:
            cpu: 10m
            memory: 20Mi
YAML

echo "--> 7. Warten auf Scheduler-Stabilisierung..."
sleep 4

echo "=== Fertig! Status aller 4 Szenarien: ==="
echo ""
echo "--- [wp-scenario-1: HostPort] ---"
kubectl get pods -n wp-scenario-1 -o wide
echo ""
echo "--- [wp-scenario-2: Cordoned Node] ---"
kubectl get pods -n wp-scenario-2 -o wide
echo ""
echo "--- [wp-scenario-3: NodeSelector] ---"
kubectl get pods -n wp-scenario-3 -o wide
echo ""
echo "--- [wp-scenario-4: PVC RWO] ---"
kubectl get pods -n wp-scenario-4 -o wide
