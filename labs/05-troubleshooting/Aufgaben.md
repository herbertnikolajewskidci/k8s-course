# Domäne 5: Troubleshooting (30%)

Übersicht der Hands-On-Trainingsblöcke für Domäne 5.

- **Issue:** #8
- **Branch:** `domain-05-troubleshooting`
- **Lernberg:** Tal → Hang → Gipfel

---

## Modul-Übersicht

### Block 1: Application Failure & Pod Debugging

- **Datei:** `Aufgabe-1.md`
- **Fokus:**
  - Pod Lifecycle & Status-Codes (`CrashLoopBackOff`, `ImagePullBackOff`,
    `OOMKilled`, `CreateContainerConfigError`)
  - Multi-Container Logging (`kubectl logs -c <container>`, `--previous`)
  - Container Probes Failure (Liveness- vs. Readiness-Probe Misconfigurations)
  - InitContainer Failures & Blocking Startup
  - Ephemeral Debug Containers & `kubectl debug`

### Block 2: Control Plane Failure & Static Pod Troubleshooting

- **Datei:** `Aufgabe-2.md`
- **Fokus:**
  - Ausfall von Core-Komponenten (`kube-apiserver`, `kube-controller-manager`,
    `kube-scheduler`, `etcd`)
  - Static Pod Manifest Debugging (`/etc/kubernetes/manifests/`)
  - Control Plane Container Logs via Container Runtime (`crictl ps`,
    `crictl logs`)
  - TLS-Zertifikate & Kubeconfig-Zertifikatsabläufe prüfen (`kubeadm certs
    check-expiration`)

### Block 3: Node & Kubelet Failure

- **Datei:** `Aufgabe-3.md`
- **Fokus:**
  - Node Status `NotReady` analysieren (`kubectl describe node`)
  - Kubelet Systemd Service & Logs (`systemctl status kubelet`,
    `journalctl -u kubelet`)
  - Kubelet Konfiguration (`/var/lib/kubelet/config.yaml`,
    `/etc/systemd/system/kubelet.service.d/`)
  - Container Runtime Ausfall (`containerd`, `crictl`) und Speicher-/DiskPressure

### Block 4: Network & CoreDNS/CNI Troubleshooting

- **Datei:** `Aufgabe-4.md`
- **Fokus:**
  - CoreDNS Pods & Service (`kube-system/kube-dns`, ConfigMap `coredns`)
  - DNS-Auflösung aus Pods debuggen (`nslookup`, `dig`, `/etc/resolv.conf`)
  - Service Endpoints & Selector-Mismatch (`kubectl get ep`, TargetPort-Fehler)
  - CNI Plugin Ausfall / Fehlkonfiguration (`/etc/cni/net.d/`)
  - Kube-Proxy & IPTables/IPVS Troubleshooting
