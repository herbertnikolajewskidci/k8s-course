# Notizen & Lösungen: Aufgabe 1 (Advanced Scheduling)

- **Namespace:** `scheduling-lab`
- **Issue:** #9

---

## Lösung 1.1: NodeAffinity (Hard Constraint)

```bash
# Deine Befehle / Notizen

k label node cka-cluster-worker tier=compute env=production
k label node cka-cluster-worker2 env=production tier=storage

k get nodes -l env=production
NAME                  STATUS   ROLES    AGE   VERSION
cka-cluster-worker    Ready    <none>   8d    v1.36.1
cka-cluster-worker2   Ready    <none>   8d    v1.36.1

k get nodes -l tier=compute
NAME                 STATUS   ROLES    AGE   VERSION
cka-cluster-worker   Ready    <none>   8d    v1.36.1

k get nodes -l tier=storage
NAME                  STATUS   ROLES    AGE   VERSION
cka-cluster-worker2   Ready    <none>   8d    v1.36.1



```

---

## Lösung 1.2: PodAffinity (Co-Location Pattern)

```bash
# Deine Befehle / Notizen
siehe Mainfests and on cluster
```

---

## Lösung 1.3: PodAntiAffinity (HA Node Spreading)

```bash
# Deine Befehle / Notizen
```
