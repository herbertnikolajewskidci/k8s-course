# Learning Record 0004: Domain 3 — Storage Mastery

- **Domain Focus:** Storage (10% CKA Exam Weight)
- **Lernberg Stage:** Transitioned from Tal to Hang / Gipfel
- **Status:** Mastered
- **Branch:** `domain-03-storage` (Domain 3)
- **Issue:** #6

---

## Mastered Concepts & Skills

### 1. Static PersistentVolumes (PV) & Claims (PVC)

- Created cluster-scoped PersistentVolumes with `hostPath`, `capacity`,
  `accessModes` (`ReadWriteOnce`), and `reclaimPolicy: Retain`.
- Created namespace-scoped PersistentVolumeClaims (`requests.storage`).
- Analyzed matching rules (`capacity >= request`, identical `storageClassName`,
  matching `accessModes`) and status transitions (`Available` →
  `Bound` → `Released`).
- Mastered recycling of `Released` PVs via `spec.claimRef` clearing.

### 2. StorageClasses & Dynamic Volume Provisioning

- Defined custom StorageClasses with provisioners (e.g. `rancher.io/local-path`)
  and `reclaimPolicy: Delete/Retain`.
- Mastered `volumeBindingMode: WaitForFirstConsumer` mechanics to prevent
  topology/node-scheduling conflicts.
- Verified dynamic creation of persistent volumes triggered by consumer Pods.

### 3. Pod Volume Mounts & Data Persistence

- Implemented 2-stage Pod storage pattern (`spec.volumes.persistentVolumeClaim`
  → `spec.containers[*].volumeMounts`).
- Verified zero data loss across Pod deletion and replacement.
- Configured secure read-only mounts (`volumeMounts[*].readOnly: true`) and
  verified kernel write protection (`Read-only file system`).

### 4. Storage Troubleshooting & Protection Mechanisms

- Diagnosed PVC `Pending` status using `kubectl describe pvc` events
  (capacity & AccessMode mismatches).
- Resolved Pod `FailedMount` errors caused by incorrect volume reference names.
- Analyzed and verified the `kubernetes.io/pvc-protection` finalizer lifecycle.

---

## Exam Simulation Drill Result

- **Score:** 100% (Grade A+)
- **Troubleshooting Speed:** Immediate diagnosis of storage mismatches and
  mount failures.
