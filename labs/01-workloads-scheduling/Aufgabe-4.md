# Aufgabe 4

## Aufgabe 4.1

1. k cordon cka-cluster-worker

```text
❯ k get nodes
NAME STATUS ROLES AGE VERSION
cka-cluster-control-plane Ready control-plane 15h v1.36.1
cka-cluster-worker Ready,SchedulingDisabled <none> 15h v1.36.1
cka-cluster-worker2 Ready <none> 15h v1.36.1
```

1. Drain ausführen:

```text
❯ k drain cka-cluster-worker --ignore-daemonsets
node/cka-cluster-worker already cordoned
Warning: ignoring DaemonSet-managed Pods: kube-system/kindnet-xlspr, ...
node/cka-cluster-worker drained
```

1. k uncordon cka-cluster-worker

```text
❯ k get nodes
NAME STATUS ROLES AGE VERSION
cka-cluster-control-plane Ready control-plane 15h v1.36.1
cka-cluster-worker Ready <none> 15h v1.36.1
cka-cluster-worker2 Ready <none> 15h v1.36.1
```

---

## Feedback

### Zu 4.1: ⭐ 100% Richtig & Vorbildlich gelöst

- **1. Cordon:** Status wechselt exakt auf `Ready,SchedulingDisabled`.
- **2. Drain:** `--ignore-daemonsets` ist das essenzielle Pflicht-Flag,
  weil DaemonSets (z. B. CNI, kube-proxy) immer auf dem Node bleiben müssen.
  - *Zusätzliche Prüfungs-Flags bei Drain-Fehlern:*
    - `--delete-emptydir-data`: Wenn Pods temporären Speicher (`emptyDir`)
      nutzen, blockiert `drain` standardmäßig, um Datenverlust zu verhindern.
      Dieses Flag erzwingt die Räumung.
    - `--force`: Wenn "nackte" Pods ohne ReplicaSet/Deployment laufen.
- **3. Uncordon:** Node nimmt sofort wieder neue Pods entgegen.
