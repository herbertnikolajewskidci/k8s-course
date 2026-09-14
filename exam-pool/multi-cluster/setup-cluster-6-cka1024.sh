#!/usr/bin/env bash
# Cluster 6 (cka1024): Q6 (Fix Kubelet Crashloop Troubleshooting)
set -euo pipefail
export KUBECONFIG=/etc/kubernetes/admin.conf

echo "=== Provisioning Cluster 6 (cka1024) ==="

mkdir -p /course/6/

# Corrupt Kubelet path in 10-kubeadm.conf
DROPIN="/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf"
if [ -f "$DROPIN" ]; then
  sed -i "s|ExecStart=/usr/bin/kubelet|ExecStart=/usr/local/bin/kubelet-corrupted|" "$DROPIN"
  systemctl daemon-reload
  systemctl restart kubelet || true
fi

# Permissions
mkdir -p /course
chown -R cka-admin:cka-admin /course
chmod -R 775 /course

echo "=== Cluster 6 (cka1024) provisioned successfully (Kubelet corrupted for Q6) ==="
