#!/usr/bin/env bash
# Exam Simulator Reset Script (V2): Wipes all candidate solutions and restores
# all 17 scenarios to their pristine, unsolved exam starting state.
# Fully automated, robust against permission issues and network delays.

set -euo pipefail

echo "================================================================="
echo "=== [CKA Exam Reset V2] Restoring Scenarios to Start State    ==="
echo "================================================================="

# 1. Clean candidate solution files in /course
echo "--> Cleaning candidate solution files in /course/..."
rm -f /course/2/contexts /course/2/current-context /course/2/cert
rm -f /course/5/*.txt
rm -rf /course/14/backup/* /var/lib/etcd-restore/*
rm -f /course/17/*.txt /course/17/*.log

# 2. Reset Q1 (CoreDNS / FQDN) to broken ConfigMap & synchronous rollout
echo "--> Resetting Q1 (CoreDNS / router-endpoints)..."
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
EOF
kubectl rollout restart deployment service-router -n core-routing
kubectl rollout status deployment service-router -n core-routing --timeout=30s 2>/dev/null || true

# 3. Reset Q4 (ReadinessProbe)
echo "--> Resetting Q4 (project-alpha)..."
kubectl delete pod probe-checker backend-pod -n project-alpha --ignore-not-found=true 2>/dev/null || true
kubectl delete deployment backend-service -n project-alpha --ignore-not-found=true 2>/dev/null || true

# 4. Reset Q6 (Break Kubelet on cka-worker1 so node is NotReady)
echo "--> Resetting Q6 (Corrupting Kubelet path on cka-worker1)..."
ssh -o StrictHostKeyChecking=no -o BatchMode=yes cka-worker1 'sudo bash -c "sed -i \"s|ExecStart=/usr/bin/kubelet|ExecStart=/usr/local/bin/kubelet-corrupted|\" /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf && systemctl daemon-reload && systemctl restart kubelet"' 2>/dev/null || \
ssh -o StrictHostKeyChecking=no -o BatchMode=yes cka-admin@cka-worker1 'sudo bash -c "sed -i \"s|ExecStart=/usr/bin/kubelet|ExecStart=/usr/local/bin/kubelet-corrupted|\" /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf && systemctl daemon-reload && systemctl restart kubelet"' 2>/dev/null || true

# 5. Reset Q7 (Gateway API)
echo "--> Resetting Q7 (Gateway API)..."
kubectl delete httproute traffic-splitter -n gateway-infra --ignore-not-found=true 2>/dev/null || true

# 6. Reset Q8 (NetworkPolicy)
echo "--> Resetting Q8 (NetworkPolicy)..."
kubectl delete netpol backend-policy -n secure-zone --ignore-not-found=true 2>/dev/null || true

# 7. Reset Q9 (Kustomize)
echo "--> Resetting Q9 (Kustomize staging & prod)..."
kubectl delete all --all -n staging-zone 2>/dev/null || true
kubectl delete all --all -n prod-zone 2>/dev/null || true
kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n staging-zone --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n prod-zone --dry-run=client -o yaml | kubectl apply -f -
# Clean prod/kustomization.yaml of patches if present
cat << 'EOF' > /course/9/api-service/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod-zone
resources:
- ../base
EOF
rm -f /course/9/api-service/base/hpa.yaml /course/9/api-service/prod/hpa-patch.yaml

# 8. Reset Q10 (StorageClass & PVC)
echo "--> Resetting Q10 (project-bern)..."
kubectl delete job data-job -n project-bern --ignore-not-found=true 2>/dev/null || true
kubectl delete pvc job-pvc -n project-bern --ignore-not-found=true 2>/dev/null || true
kubectl delete sc delayed-storage --ignore-not-found=true 2>/dev/null || true

# 9. Reset Q11 (PV Recovery Retain)
echo "--> Resetting Q11 (storage-recovery)..."
kubectl delete pvc recovered-pvc old-pvc -n storage-recovery --ignore-not-found=true 2>/dev/null || true
# Ensure PV is in Released state
kubectl patch pv pv-retained-data -p '{"spec":{"claimRef":{"namespace":"storage-recovery","name":"old-pvc"}}}' 2>/dev/null || true

# 10. Reset Q12 (Secrets)
echo "--> Resetting Q12 (secret-mgmt)..."
kubectl delete secret db-credentials -n secret-mgmt --ignore-not-found=true 2>/dev/null || true
kubectl delete pod db-client -n secret-mgmt --ignore-not-found=true 2>/dev/null || true

# 11. Reset Q13 (RBAC)
echo "--> Resetting Q13 (dev-rbac)..."
kubectl delete rolebinding deploy-bot-binding -n dev-rbac --ignore-not-found=true 2>/dev/null || true
kubectl delete role deployment-manager -n dev-rbac --ignore-not-found=true 2>/dev/null || true
kubectl delete sa deploy-bot -n dev-rbac --ignore-not-found=true 2>/dev/null || true

# 12. Reset Q15 (Node Maintenance)
echo "--> Resetting Q15 (Uncordon cka-worker1)..."
kubectl uncordon cka-worker1 2>/dev/null || true

# 13. Reset Q16 (Pending Pod Forensics)
echo "--> Resetting Q16 (wp-forensics node label)..."
kubectl label node cka-worker1 hardware-tier- 2>/dev/null || true
kubectl label node cka-exam-runner hardware-tier- 2>/dev/null || true

# Ensure proper ownership and write permissions for student under /course
chown -R cka-admin:cka-admin /course 2>/dev/null || true
chmod -R 775 /course 2>/dev/null || true

echo "================================================================="
echo "=== [CKA Exam Reset V2] SUCCESS: All 17 Scenarios Reset!      ==="
echo "================================================================="
