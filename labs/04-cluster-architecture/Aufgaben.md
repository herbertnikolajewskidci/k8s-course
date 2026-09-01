# Domäne 4: Cluster Architecture, Installation & Configuration (25%)

Übersicht der Hands-On-Trainingsblöcke für Domäne 4.

- **Issue:** #7
- **Branch:** `domain-04-cluster-architecture`
- **Lernberg:** Tal → Hang → Gipfel

---

## Modul-Übersicht

### Block 1: RBAC & Kubeconfig

- **Datei:** `Aufgabe-1.md`
- **Fokus:**
  - `ServiceAccount`, `Role`, `RoleBinding` (Namespace-gebunden)
  - `ClusterRole`, `ClusterRoleBinding` (Cluster-weit vs. Namespace-spezifisch)
  - API-Groups & Resource-Syntax (z. B. `apps`, `batch`, `""` für Core)
  - Berechtigungsprüfung mit `kubectl auth can-i` (inkl. `--as`)
  - Kubeconfig: Cluster, User, Contexts setzen und wechseln
    (`kubectl config set-credentials`, `set-context`, `use-context`)

### Block 2: kubeadm Cluster Upgrade

- **Datei:** `Aufgabe-2.md`
- **Fokus:**
  - Paketmanagement (`apt-mark unhold/hold`, Versionssuche)
  - Control-Plane Upgrade (`kubeadm upgrade plan`, `kubeadm upgrade apply`)
  - Kubelet & Kubectl Upgrade auf Control-Plane (`systemctl daemon-reload &&
    systemctl restart kubelet`)
  - Worker Node Upgrade (`kubectl drain`, `kubeadm upgrade node`, Kubelet-Update,
    `kubectl uncordon`)

### Block 3: etcd Snapshot Backup & Restore

- **Datei:** `Aufgabe-3.md`
- **Fokus:**
  - `etcdctl snapshot save` mit korrekten TLS-Zertifikaten
    (`--cacert`, `--cert`, `--key`, `--endpoints`)
  - Verifizieren des Snapshots (`etcdctl snapshot status`)
  - Restore auf separates Datenverzeichnis (`--data-dir`)
  - Anpassung des Static-Pod-Manifests (`/etc/kubernetes/manifests/etcd.yaml`)
    und Neustart des Pods

### Block 4: Static Pods, Control-Plane Maintenance & CRDs

- **Datei:** `Aufgabe-4.md`
- **Fokus:**
  - Static Pod Konfiguration (`staticPodPath` in Kubelet-Config)
  - Erkennen und Debuggen von Static Pods (Namensschema `-<node-name>`)
  - Custom Resource Definitions (CRDs) & Custom Resources ins Wissensnetz
    einbinden
  - Node Maintenance & Cordoning
