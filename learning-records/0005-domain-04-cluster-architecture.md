# Learning Record 0005: Domain 4 — Cluster Architecture & Maintenance

- **Domain Focus:** Cluster Architecture, Installation & Configuration (25%
  CKA Exam Weight)
- **Lernberg Stage:** Transitioned from Tal to Hang / Gipfel
- **Status:** Mastered
- **Branch:** `domain-04-cluster-architecture`
- **Issue:** #7

---

## Mastered Concepts & Skills

### 1. RBAC & Kubeconfig

- Configured `ServiceAccount`, `Role`, and `RoleBinding` for namespace-scoped
  access.
- Configured `ClusterRole` and `ClusterRoleBinding` for cluster-scoped resources
  (Nodes, PVs).
- Verified permissions across namespaces using `kubectl auth can-i --as`.
- Managed Kubeconfig contexts, clusters, and users using `kubectl config`.

### 2. Kubeadm Cluster Upgrade

- Upgraded control plane components (`kubeadm upgrade plan`, `kubeadm upgrade
  apply`).
- Managed package holds (`apt-mark unhold/hold`) for kubeadm, kubelet, and
  kubectl.
- Performed worker node maintenance and upgrade procedures:
  `kubectl drain`, `kubeadm upgrade node`, kubelet restart, `kubectl uncordon`.

### 3. etcd Snapshot Backup & Restore

- Created consistent etcd snapshots using `etcdctl snapshot save` with full TLS
  parameters (`--cacert`, `--cert`, `--key`, `--endpoints`).
- Verified snapshot status (`etcdctl snapshot status`).
- Executed official restore procedure using `etcdutl snapshot restore`
  (prioritizing modern standard over deprecated `etcdctl`).
- Reconfigured static pod manifest (`/etc/kubernetes/manifests/etcd.yaml`) to
  point to restored data directory.

### 4. Static Pods & Maintenance

- Created and debugged static pods via Kubelet `staticPodPath`.
- Explored CRD definitions and Custom Resource lifecycle.
