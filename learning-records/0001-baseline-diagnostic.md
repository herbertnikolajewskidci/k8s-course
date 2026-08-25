# Learning Record 0001: Baseline Diagnostic (LFS258 Review)

- **Date**: Baseline Day 0 / Day 1
- **Domain Focus**: CKA Curriculum v1.35 (All 5 Domains)
- **Methodology**: Birkenbihl Wissensnetz Activation & Diagnostic Probe

## Diagnostic Results & Wissensnetz Analysis

### 1. Cluster Architecture (Score: 5/5)

- **Input**: Kube-Scheduler checks node capacity/constraints and assigns
  pods; Kubelet is a systemd daemon on each worker interfacing with CRI.
- **Evaluation**: Solid mental model established.

### 2. Workloads & Scheduling (Score: 4/5)

- **Input**: `kubectl create deployment web-app --image=nginx:1.25 --replica=3`
- **Correction**: Parameter is `--replicas=3` (plural).
- **Target Drill**: Imperative generators speed drills.

### 3. Services & Networking (Score: 1/5 - Priority Gap)

- **Input**: Passed.
- **Wissensnetz Anchor**: Cross-Namespace DNS FQDN format:
  `<service-name>.<namespace>.svc.cluster.local`
  Example: `auth-svc.security.svc.cluster.local` (or `auth-svc.security`).

### 4. Storage (Score: 3/5 - Refinement Needed)

- **Input**: Data is retained; PV automatically rebinds to new PVC.
- **Correction**: Data is preserved, but PV status changes to `Released`.
  Kubernetes does NOT automatically bind it to a new PVC until the old
  `claimRef` is manually cleared from the PV spec.

### 5. Troubleshooting (Score: 2/5 - High Priority for 30% Exam Weight)

- **Input**: `kubectl describe node worker` (Client-side triage).
- **Target Node-Side Commands**:
  1. `systemctl status kubelet`
  2. `journalctl -u kubelet -xe --no-pager`

## Focus Plan for Day 1

1. Fast imperative CLI muscle memory (`kubectl run`, `create`, `scale`).
2. CoreDNS Wissensnetz & Cross-namespace resolution.
3. PV Lifecycle states (`Available` -> `Bound` -> `Released`).
4. Systemd & Kubelet troubleshooting drills.
