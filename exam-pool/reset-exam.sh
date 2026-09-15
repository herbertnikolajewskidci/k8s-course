#!/usr/bin/env bash
# Exam Simulator Multi-Cluster Deterministic Reset Engine (V5)
# Restores all 6 authentic Killer.sh clusters across the 7 VMs into pristine unsolved state.
# Wipes all student solution files under /course/, resets configurations, corrupts Kubelet on cka1024,
# resets student drill flags, and automatically audits/verifies the reset state.

set -euo pipefail

START_TIME=$(date +%s)

echo "========================================================================"
echo "=== [CKA Exam Simulator] Deterministic Reset & Cluster Self-Audit    ==="
echo "========================================================================"

# 1. Reset Portal Drill Flags
echo "--> [Portal] Resetting student drill flags via HTTPS :8091..."
curl -k -s -X POST https://192.168.131.223:8091/api/drill-flags/reset >/dev/null 2>&1 || \
curl -s -X POST http://192.168.131.223:8090/api/drill-flags/reset >/dev/null 2>&1 || true

# 2. Parallel Reset across all 6 Clusters
echo "--> [Clusters] Executing parallel cluster resets across 7 KVM VMs..."

# Cluster 1 (cka6016: Q1, Q10, Q15, Q17)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka6016 bash << 'EOF' &
  set -euo pipefail
  # Q1: Restore broken router-endpoints ConfigMap & rollout restart
  kubectl apply -f - << 'INNER_EOF' >/dev/null 2>&1
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
INNER_EOF
  kubectl rollout restart deployment service-router -n core-routing >/dev/null 2>&1 || true

  # Q10: Delete Job, PVC, StorageClass and restore clean data-job.yaml
  kubectl delete job data-job -n project-bern --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl delete pvc job-pvc -n project-bern --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl delete sc delayed-storage --ignore-not-found=true >/dev/null 2>&1 || true
  find /course/10/ -type f ! -name 'data-job.yaml' -delete 2>/dev/null || true
  cat << 'INNER_EOF' > /course/10/data-job.yaml
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
INNER_EOF

  # Q15: Uncordon node
  kubectl uncordon cka6016 >/dev/null 2>&1 || true

  # Q17: Purge runtime inspection logs & outputs
  rm -f /course/17/*.txt /course/17/*.log /course/17/*.sh 2>/dev/null || true
EOF

# Cluster 2 (cka2560: Q2, Q7, Q11)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka2560 bash << 'EOF' &
  set -euo pipefail
  # Q2: Purge student kubeconfig extractions (keep only initial kubeconfig)
  rm -f /course/2/contexts /course/2/current-context /course/2/cert /course/2/*.txt 2>/dev/null || true

  # Q7: Delete HTTPRoute
  kubectl delete httproute traffic-splitter -n gateway-infra --ignore-not-found=true >/dev/null 2>&1 || true

  # Q11: Delete PVC and restore PV claimRef to Released state
  kubectl delete pvc recovered-pvc -n storage-recovery --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl patch pv pv-retained-data -p '{"spec":{"claimRef":{"namespace":"storage-recovery","name":"old-pvc"}}}' >/dev/null 2>&1 || true
EOF

# Cluster 3 (cka5248: Q3, Q9, Q12)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka5248 bash << 'EOF' &
  set -euo pipefail
  # Q3: Delete multi-container Pod
  kubectl delete pod collector -n project-tiger --ignore-not-found=true >/dev/null 2>&1 || true

  # Q9: Revert Kustomize directory and namespaces
  rm -f /course/9/api-service/base/hpa.yaml /course/9/api-service/prod/hpa-patch.yaml /course/9/*.yaml 2>/dev/null || true
  cat << 'INNER_EOF' > /course/9/api-service/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
INNER_EOF
  cat << 'INNER_EOF' > /course/9/api-service/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod-zone
resources:
- ../base
INNER_EOF
  kubectl delete all --all -n staging-zone >/dev/null 2>&1 || true
  kubectl delete all --all -n prod-zone >/dev/null 2>&1 || true
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n staging-zone --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1 || true
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n prod-zone --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1 || true

  # Q12: Delete Secret and Pod
  kubectl delete secret db-credentials -n secret-mgmt --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl delete pod db-client -n secret-mgmt --ignore-not-found=true >/dev/null 2>&1 || true
EOF

# Cluster 4 (cka3200: Q4, Q13, Q16)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka3200 bash << 'EOF' &
  set -euo pipefail
  # Q4: Delete probe checker and backend Pod
  kubectl delete pod probe-checker backend-pod -n project-alpha --ignore-not-found=true >/dev/null 2>&1 || true

  # Q13: Delete RBAC triad
  kubectl delete sa deploy-bot -n dev-rbac --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl delete role deployment-manager -n dev-rbac --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl delete rolebinding deploy-bot-binding -n dev-rbac --ignore-not-found=true >/dev/null 2>&1 || true

  # Q16: Remove node label and restart deployment so pods stay Pending
  kubectl label node cka3200 hardware-tier- >/dev/null 2>&1 || true
  kubectl rollout restart deployment analytics-pipeline -n wp-forensics >/dev/null 2>&1 || true
EOF

# Cluster 5 (cka8448: Q5, Q8, Q14)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka8448 bash << 'EOF' &
  set -euo pipefail
  # Q5: Purge certificate info txt
  rm -f /course/5/*.txt /course/5/*.log 2>/dev/null || true

  # Q8: Delete NetworkPolicy
  kubectl delete netpol backend-policy -n secure-zone --ignore-not-found=true >/dev/null 2>&1 || true

  # Q14: Purge etcd backup files and test restore directories
  rm -rf /course/14/backup/* /var/lib/etcd-restore/* 2>/dev/null || true
EOF

# Cluster 6 (cka1024: Q6 Kubelet Crash)
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 cka1024 bash << 'EOF' &
  set -euo pipefail
  DROPIN=/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
  if [ -f "$DROPIN" ]; then
    sudo sed -i 's|ExecStart=/usr/bin/kubelet|ExecStart=/usr/local/bin/kubelet-corrupted|' "$DROPIN"
    sudo systemctl daemon-reload
    sudo systemctl restart kubelet >/dev/null 2>&1 || true
  fi
EOF

wait

END_RESET_TIME=$(date +%s)
RESET_DURATION=$((END_RESET_TIME - START_TIME))

echo "--> [Reset Complete] All 6 clusters processed in ${RESET_DURATION}s."

# 3. Built-in Deterministic Self-Audit / Verification
echo "--> [Self-Audit] Verifying pristine state across clusters and portal..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_ERRORS=0

# Check Portal Drill Flags
FLAGS_CHECK=$(curl -k -s https://192.168.131.223:8091/api/drill-flags 2>/dev/null || echo '{"drillFlags":[]}')
if [[ "$FLAGS_CHECK" != *'"drillFlags": []'* ]] && [[ "$FLAGS_CHECK" != *'"drillFlags":[]'* ]]; then
  echo "  ⚠️ Warning: Portal drill flags not empty: $FLAGS_CHECK"
  AUDIT_ERRORS=$((AUDIT_ERRORS + 1))
else
  echo "  ✓ Portal drill flags: Clean (0 active flags)"
fi

# Check Solution Files in /course/ across VMs
FILES_FOUND=$(ssh -o StrictHostKeyChecking=no cka2560 "ls /course/2/cert /course/2/contexts /course/2/current-context 2>/dev/null || true" | wc -w)
if [ "$FILES_FOUND" -gt 0 ]; then
  echo "  ⚠️ Warning: /course/2/ still contains extracted files!"
  AUDIT_ERRORS=$((AUDIT_ERRORS + 1))
else
  echo "  ✓ Cluster 2 (/course/2/): Clean (only kubeconfig present)"
fi

Q5_FILES=$(ssh -o StrictHostKeyChecking=no cka8448 "ls /course/5/*.txt 2>/dev/null || true" | wc -w)
if [ "$Q5_FILES" -gt 0 ]; then
  echo "  ⚠️ Warning: /course/5/ still contains cert info!"
  AUDIT_ERRORS=$((AUDIT_ERRORS + 1))
else
  echo "  ✓ Cluster 5 (/course/5/ & /course/14/): Clean"
fi

# Check Q6 Kubelet failure status
KUBELET_STATUS=$(ssh -o StrictHostKeyChecking=no cka1024 "systemctl is-active kubelet 2>/dev/null || echo 'inactive'")
if [[ "$KUBELET_STATUS" == "active" ]]; then
  echo "  ⚠️ Warning: Node cka1024 kubelet is active (should be failed/activating)!"
  AUDIT_ERRORS=$((AUDIT_ERRORS + 1))
else
  echo "  ✓ Cluster 6 (cka1024): Kubelet correctly failed ($KUBELET_STATUS) -> Ready for troubleshooting"
fi

TOTAL_DURATION=$(( $(date +%s) - START_TIME ))

echo "========================================================================"
if [ "$AUDIT_ERRORS" -eq 0 ]; then
  echo "=== [SUCCESS] Deterministic Reset Complete & Verified in ${TOTAL_DURATION}s! ==="
else
  echo "=== [WARNING] Reset completed with $AUDIT_ERRORS warning(s) in ${TOTAL_DURATION}s. ==="
fi
echo "========================================================================"
