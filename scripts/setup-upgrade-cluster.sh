#!/usr/bin/env bash
set -euo pipefail

echo "=== 1. Reset / Setup Nodes ==="
SETUP_NODE_SCRIPT=$(cat << 'EOF'
# Swap deaktivieren
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Kubelet Environment um Swap-Fail-Flag erweitern
sudo mkdir -p /etc/systemd/system/kubelet.service.d/
cat <<UNIT | sudo tee /etc/systemd/system/kubelet.service.d/20-extra-args.conf
[Service]
Environment="KUBELET_EXTRA_ARGS=--fail-swap-on=false"
UNIT

sudo systemctl daemon-reload
sudo systemctl restart containerd
EOF
)

orb -m cka-master bash -c "$SETUP_NODE_SCRIPT"
orb -m cka-worker1 bash -c "$SETUP_NODE_SCRIPT"

echo "=== 2. Kubeadm Reset & Re-Init auf cka-master ==="
orb -m cka-master sudo kubeadm reset -f || true

INIT_SCRIPT=$(cat << 'EOF'
sudo kubeadm init --kubernetes-version=v1.31.0 --pod-network-cidr=10.244.0.0/16 --ignore-preflight-errors=all

mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Flannel CNI installieren
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
EOF
)
orb -m cka-master bash -c "$INIT_SCRIPT"

echo "=== 3. Worker Node Reset & Join ==="
orb -m cka-worker1 sudo kubeadm reset -f || true
JOIN_CMD=$(orb -m cka-master sudo kubeadm token create --print-join-command)
orb -m cka-worker1 sudo $JOIN_CMD --ignore-preflight-errors=all

echo "=== 4. Cluster Status ==="
sleep 5
orb -m cka-master kubectl get nodes -o wide
