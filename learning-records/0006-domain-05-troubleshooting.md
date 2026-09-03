# Learning Record 0006: Domain 5 — Troubleshooting Mastery

- **Domain Focus:** Troubleshooting (30% CKA Exam Weight)
- **Lernberg Stage:** Transitioned from Tal to Hang / Gipfel (Exam Style)
- **Status:** Mastered
- **Branch:** `domain-05-troubleshooting`
- **Issue:** #8

---

## Mastered Concepts & Skills

### 1. Application Failure & Pod Debugging

- Diagnosed Pod lifecycle errors: `CreateContainerConfigError` (missing
  ConfigMaps/Secrets), `CrashLoopBackOff` (application crash vs. missing
  foreground loop), and `OOMKilled` (Exit 137).
- Mastered multi-container logging via `kubectl logs -c <container> --previous`.
- Resolved blocking InitContainers (`Init:0/1`) by creating supporting backends
  and services.
- Corrected misconfigured LivenessProbes (HTTP 404/403 path errors causing
  continuous restarts).

### 2. Control Plane Failure & Static Pods

- Diagnosed control plane outages without functional API-server using runtime
  CLI tools (`crictl ps -a`, `crictl logs`).
- Corrected static pod manifests in `/etc/kubernetes/manifests/` for
  `kube-scheduler`, `kube-controller-manager`, and `kube-apiserver`.
- Verified and renewed control plane PKI certificates via
  `kubeadm certs check-expiration` and `kubeadm certs renew all`.

### 3. Node & Kubelet Failure

- Investigated Worker Nodes in status `NotReady` using `kubectl describe node`
  and systemd logs (`journalctl -u kubelet -e`).
- Repaired corrupt Kubelet configuration files (`/var/lib/kubelet/config.yaml`)
  and systemd service drop-ins (`10-kubeadm.conf`).
- Executed node maintenance workflows with required drain safety flags:
  `--ignore-daemonsets`, `--delete-emptydir-data`, `--force`.

### 4. Network, CoreDNS & Service Routing

- Restored cluster-wide DNS resolution by identifying selector mismatches on
  the `kube-dns` service (`kube-system`).
- Debugged broken Service endpoints (`Endpoints: <none>`) by reconciling Service
  selectors with Pod labels.
- Resolved CNI network plugin initialization failures by restoring CNI
  configuration files under `/etc/cni/net.d/` on affected Worker Nodes.
