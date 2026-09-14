#!/usr/bin/env bash
# Test- & Loesungs-Skript fuer Slot 01
# Wendet die korrekte Loesung an und validiert die DNS-Aufloesung.

set -euo pipefail

echo "=== [Slot 01 Test] Wende Loesung an und verifiziere ==="

# 1. Ermittle die tatsaechliche Pod-IP des Monitor-Pods im Cluster
MONITOR_IP=$(kubectl get pod monitor-agent -n monitoring -o jsonpath='{.status.podIP}')
echo "Ermittelte Monitor-Pod-IP: $MONITOR_IP"
MONITOR_DNS=$(echo "$MONITOR_IP" | tr '.' '-')".monitoring.pod.cluster.local"
echo "Generierter FQDN fuer Pod-IP: $MONITOR_DNS"

# 2. ConfigMap router-endpoints korrigieren
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-endpoints
  namespace: core-routing
data:
  ENDPOINT_CORE: "kubernetes.default.svc.cluster.local"
  ENDPOINT_STORAGE: "storage-vault.storage-tier.svc.cluster.local"
  ENDPOINT_PRIMARY_POD: "vault-0.storage-vault.storage-tier.svc.cluster.local"
  ENDPOINT_MONITOR: "$MONITOR_DNS"
EOF

# 3. Deployment neu starten
kubectl rollout restart deployment service-router -n core-routing
kubectl rollout status deployment service-router -n core-routing --timeout=60s

# 4. Verifikation der Logs
ROUTER_POD=$(kubectl get pods -n core-routing -l app=service-router -o jsonpath='{.items[0].metadata.name}')
echo "Pruefe Logs von Router Pod: $ROUTER_POD"
LOGS=$(kubectl logs "$ROUTER_POD" -n core-routing)

echo "$LOGS"

# Pruefe, dass kein FAILED_* in den Logs steht
if echo "$LOGS" | grep -q "FAILED"; then
  echo "TEST FAILED: Mindestens ein Endpunkt konnte nicht aufgeloest werden!"
  exit 1
fi

echo "SUCCESS: Alle 4 DNS-Endpunkte wurden erfolgreich im Cluster aufgeloest!"
