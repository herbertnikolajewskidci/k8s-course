#!/usr/bin/env bash
# Exam Simulator Multi-Cluster Reset Script (V3):
# Restores all 6 authentic Killer.sh clusters across the 7 VMs to pristine start state.

set -euo pipefail

echo "================================================================="
echo "=== [CKA Exam Reset V3] Restoring 6 Clusters to Starting State =="
echo "================================================================="

echo "--> Resetting Portal Drill Flags (HTTPS :8091)..."
curl -k -s -X POST https://192.168.131.223:8091/api/drill-flags/reset >/dev/null 2>&1 || \
curl -s -X POST http://192.168.131.223:8090/api/drill-flags/reset >/dev/null 2>&1 || true

echo "--> Resetting Cluster 1 (cka6016: Q1, Q10, Q15, Q17)..."
ssh -o StrictHostKeyChecking=no cka6016 "
  rm -f /course/10/*.txt /course/17/*.txt /course/17/*.log
  kubectl rollout restart deployment service-router -n core-routing 2>/dev/null || true
  kubectl uncordon cka6016 2>/dev/null || true
" &

echo "--> Resetting Cluster 2 (cka2560: Q2, Q7, Q11)..."
ssh -o StrictHostKeyChecking=no cka2560 "
  rm -f /course/2/contexts /course/2/current-context /course/2/cert
  kubectl delete httproute traffic-splitter -n gateway-infra --ignore-not-found=true 2>/dev/null || true
  kubectl delete pvc recovered-pvc -n storage-recovery --ignore-not-found=true 2>/dev/null || true
  kubectl patch pv pv-retained-data -p '{\"spec\":{\"claimRef\":{\"namespace\":\"storage-recovery\",\"name\":\"old-pvc\"}}}' 2>/dev/null || true
" &

echo "--> Resetting Cluster 3 (cka5248: Q3, Q9, Q12)..."
ssh -o StrictHostKeyChecking=no cka5248 "
  rm -f /course/9/api-service/base/hpa.yaml /course/9/api-service/prod/hpa-patch.yaml
  kubectl delete all --all -n staging-zone 2>/dev/null || true
  kubectl delete all --all -n prod-zone 2>/dev/null || true
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n staging-zone --dry-run=client -o yaml | kubectl apply -f -
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n prod-zone --dry-run=client -o yaml | kubectl apply -f -
  kubectl delete secret db-credentials -n secret-mgmt --ignore-not-found=true 2>/dev/null || true
  kubectl delete pod db-client -n secret-mgmt --ignore-not-found=true 2>/dev/null || true
" &

echo "--> Resetting Cluster 4 (cka3200: Q4, Q13, Q16)..."
ssh -o StrictHostKeyChecking=no cka3200 "
  kubectl delete pod probe-checker backend-pod -n project-alpha --ignore-not-found=true 2>/dev/null || true
  kubectl delete sa deploy-bot -n dev-rbac --ignore-not-found=true 2>/dev/null || true
  kubectl delete role deployment-manager -n dev-rbac --ignore-not-found=true 2>/dev/null || true
  kubectl delete rolebinding deploy-bot-binding -n dev-rbac --ignore-not-found=true 2>/dev/null || true
  kubectl label node cka3200 hardware-tier- 2>/dev/null || true
" &

echo "--> Resetting Cluster 5 (cka8448: Q5, Q8, Q14)..."
ssh -o StrictHostKeyChecking=no cka8448 "
  rm -f /course/5/*.txt /course/14/backup/* /var/lib/etcd-restore/*
  kubectl delete netpol backend-policy -n secure-zone --ignore-not-found=true 2>/dev/null || true
" &

echo "--> Resetting Cluster 6 (cka1024: Q6 Kubelet Crash)..."
ssh -o StrictHostKeyChecking=no cka1024 "
  DROPIN=/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf
  if [ -f \"\$DROPIN\" ]; then
    sudo sed -i 's|ExecStart=/usr/bin/kubelet|ExecStart=/usr/local/bin/kubelet-corrupted|' \"\$DROPIN\"
    sudo systemctl daemon-reload
    sudo systemctl restart kubelet || true
  fi
" &

wait

echo "================================================================="
echo "=== [CKA Exam Reset V3] SUCCESS: All 6 Clusters Ready!        ==="
echo "================================================================="
