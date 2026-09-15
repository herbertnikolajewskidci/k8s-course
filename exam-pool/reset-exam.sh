#!/usr/bin/env bash
# Exam Simulator Multi-Cluster Reset Script (V4):
# Restores all 6 authentic Killer.sh clusters across the 7 VMs to pristine start state,
# wipes all student solution files under /course/, resets broken configurations,
# corrupts Kubelet on cka1024, and clears student drill flags.

set -euo pipefail

echo "================================================================="
echo "=== [CKA Exam Reset V4] Restoring 6 Clusters to Starting State =="
echo "================================================================="

echo "--> Resetting Portal Drill Flags (HTTPS :8091)..."
curl -k -s -X POST https://192.168.131.223:8091/api/drill-flags/reset >/dev/null 2>&1 || \
curl -s -X POST http://192.168.131.223:8090/api/drill-flags/reset >/dev/null 2>&1 || true

echo "--> Resetting Cluster 1 (cka6016: Q1, Q10, Q15, Q17)..."
ssh -o StrictHostKeyChecking=no cka6016 "
  # Q1 Reset ConfigMap to broken state and restart
  kubectl apply -f - << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-endpoints
  namespace: core-routing
data:
  ENDPOINT_CORE: \"kubernetes\"
  ENDPOINT_STORAGE: \"storage-vault.storage-tier\"
  ENDPOINT_PRIMARY_POD: \"vault-0.storage-tier\"
  ENDPOINT_MONITOR: \"monitor-agent.monitoring\"
EOF
  kubectl rollout restart deployment service-router -n core-routing 2>/dev/null || true

  # Q10 Cleanup
  kubectl delete job data-job -n project-bern --ignore-not-found=true 2>/dev/null || true
  kubectl delete pvc job-pvc -n project-bern --ignore-not-found=true 2>/dev/null || true
  kubectl delete sc delayed-storage --ignore-not-found=true 2>/dev/null || true
  find /course/10/ -type f ! -name 'data-job.yaml' -delete 2>/dev/null || true
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
        command: [\"sh\", \"-c\", \"echo 'Batch job processed data' > /mnt/job-data/output.log && sleep 5\"]
EOF

  # Q15 Node Uncordon
  kubectl uncordon cka6016 2>/dev/null || true

  # Q17 Cleanup
  rm -f /course/17/*.txt /course/17/*.log /course/17/*.sh 2>/dev/null || true
" &

echo "--> Resetting Cluster 2 (cka2560: Q2, Q7, Q11)..."
ssh -o StrictHostKeyChecking=no cka2560 "
  # Q2 Wipe student outputs
  rm -f /course/2/contexts /course/2/current-context /course/2/cert /course/2/*.txt 2>/dev/null || true

  # Q7 Delete HTTPRoute
  kubectl delete httproute traffic-splitter -n gateway-infra --ignore-not-found=true 2>/dev/null || true

  # Q11 Delete PVC and restore PV to Released with claimRef
  kubectl delete pvc recovered-pvc -n storage-recovery --ignore-not-found=true 2>/dev/null || true
  kubectl patch pv pv-retained-data -p '{\"spec\":{\"claimRef\":{\"namespace\":\"storage-recovery\",\"name\":\"old-pvc\"}}}' 2>/dev/null || true
" &

echo "--> Resetting Cluster 3 (cka5248: Q3, Q9, Q12)..."
ssh -o StrictHostKeyChecking=no cka5248 "
  # Q3 Delete Pod collector
  kubectl delete pod collector -n project-tiger --ignore-not-found=true 2>/dev/null || true

  # Q9 Revert Kustomize directory and namespaces
  rm -f /course/9/api-service/base/hpa.yaml /course/9/api-service/prod/hpa-patch.yaml /course/9/*.yaml 2>/dev/null || true
  cat << 'EOF' > /course/9/api-service/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
EOF
  cat << 'EOF' > /course/9/api-service/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod-zone
resources:
- ../base
EOF
  kubectl delete all --all -n staging-zone 2>/dev/null || true
  kubectl delete all --all -n prod-zone 2>/dev/null || true
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n staging-zone --dry-run=client -o yaml | kubectl apply -f -
  kubectl create configmap legacy-scaling-config --from-literal=legacy_threshold=75% -n prod-zone --dry-run=client -o yaml | kubectl apply -f -

  # Q12 Delete Secret and Pod
  kubectl delete secret db-credentials -n secret-mgmt --ignore-not-found=true 2>/dev/null || true
  kubectl delete pod db-client -n secret-mgmt --ignore-not-found=true 2>/dev/null || true
" &

echo "--> Resetting Cluster 4 (cka3200: Q4, Q13, Q16)..."
ssh -o StrictHostKeyChecking=no cka3200 "
  # Q4 Delete test Pods
  kubectl delete pod probe-checker backend-pod -n project-alpha --ignore-not-found=true 2>/dev/null || true

  # Q13 Delete RBAC triad
  kubectl delete sa deploy-bot -n dev-rbac --ignore-not-found=true 2>/dev/null || true
  kubectl delete role deployment-manager -n dev-rbac --ignore-not-found=true 2>/dev/null || true
  kubectl delete rolebinding deploy-bot-binding -n dev-rbac --ignore-not-found=true 2>/dev/null || true

  # Q16 Remove node label so replicas become Pending again
  kubectl label node cka3200 hardware-tier- 2>/dev/null || true
  kubectl rollout restart deployment analytics-pipeline -n wp-forensics 2>/dev/null || true
" &

echo "--> Resetting Cluster 5 (cka8448: Q5, Q8, Q14)..."
ssh -o StrictHostKeyChecking=no cka8448 "
  # Q5 Wipe cert audit txt
  rm -f /course/5/*.txt /course/5/*.log 2>/dev/null || true

  # Q8 Delete NetworkPolicy
  kubectl delete netpol backend-policy -n secure-zone --ignore-not-found=true 2>/dev/null || true

  # Q14 Wipe etcd backup snapshot & test restore
  rm -rf /course/14/backup/* /var/lib/etcd-restore/* 2>/dev/null || true
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
echo "=== [CKA Exam Reset V4] SUCCESS: All 6 Clusters Ready!        ==="
echo "================================================================="
