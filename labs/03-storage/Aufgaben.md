# Domäne 3: Storage — Aufgabenkatalog

- **CKA Domäne:** Storage (10% Prüfungsanteil)
- **Issue:** #6
- **Branch:** `domain-03-storage`

---

## Übersicht der Themenblöcke

1. **Block 1: Statische PV & PVC Bindung**
   - Erstellung von PersistentVolumes (PV)
   - Erstellung von PersistentVolumeClaims (PVC)
   - AccessModes (`ReadWriteOnce`, `ReadOnlyMany`, `ReadWriteMany`)
   - ReclaimPolicies (`Retain`, `Delete`)
   - Bindungs-Phasen (`Available`, `Bound`, `Released`, `Failed`)
2. **Block 2: StorageClasses & Dynamic Provisioning**
   - StorageClass Definitionen
   - `volumeBindingMode: WaitForFirstConsumer` vs. `Immediate`
   - Default StorageClass & dynamische PVC-Erstellung
3. **Block 3: Pods mit Volumes & PVCs**
   - Pods mit `persistentVolumeClaim`-Volumes
   - `volumeMounts` im Container
   - Schreib- und Leserechte (`readOnly: true/false`)
4. **Block 4: Storage Troubleshooting Drill**
   - Analyse von PVCs und Pods im Status `Pending`
   - Diagnose von Capacity-, AccessMode- und StorageClass-Mismatches
   - Bereinigung verwaister PVs (`Released` / PV Protection Finalizer)
