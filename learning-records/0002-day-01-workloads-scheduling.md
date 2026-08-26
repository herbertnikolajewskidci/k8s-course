# Learning Record 0002: Day 1 Workloads & Scheduling Mastery

- **Date**: Day 1
- **Domain Focus**: Workloads & Scheduling (15% CKA Exam Weight)
- **Lernberg Stage**: Transitioned from Tal to Hang / Gipfel
- **Status**: Mastered

## Mastered Concepts & Skills

### 1. Speed-Generators & CLI-Velocity

- Mastered `k run`, `k create deploy`, and `$do` (`--dry-run=client -o yaml`).
- Learned the `--` delimiter for container `--command` execution.

### 2. Multi-Container & Init-Containers

- Mastered 2-stage volume pattern (`spec.volumes` + `volumeMounts`).
- Implemented Pods with shared `emptyDir` storage across Init and App containers.

### 3. Scheduling & Node Allocation

- Applied Node Labels (`k label node <node> key=value`).
- Implemented `nodeSelector` and complex `nodeAffinity` rules
  (`requiredDuringSchedulingIgnoredDuringExecution`).
- Mastered Taints & Tolerations (`NoSchedule`, `PreferNoSchedule`, `NoExecute`).
- Node Maintenance: `cordon`, `drain` (`--ignore-daemonsets`,
  `--delete-emptydir-data`), and `uncordon`.

### 4. Rollouts, History & Rollbacks

- Executed zero-downtime rolling updates via `k set image`.
- Documented rollout revisions via `kubernetes.io/change-cause` annotations.
- Handled stuck rollouts (`ImagePullBackOff`) and executed instant rollbacks
  with `k rollout undo`.

### 5. Control Plane & Special Workloads

- Deployed DaemonSets across cluster nodes.
- Discovered and deployed Static Pods via Kubelet filesystem
  (`/etc/kubernetes/manifests`).
- Configured ConfigMaps, Secrets, and mounted them as Envs and Volumes.
- Configured CPU/Memory Resource Requests/Limits and HPA (`k autoscale`).
- Configured Batch Jobs (`completions`, `parallelism`) and CronJobs (`schedule`,
  `successfulJobsHistoryLimit`).

## Exam Simulation Drill Result

- **Score**: 100% (Grade A+)
- **Speed**: Completed all multi-step constraints within allotted time.
