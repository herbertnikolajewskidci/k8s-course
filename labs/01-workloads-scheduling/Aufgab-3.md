# Aufgabe 3

## Aufgabe 3.1

1. Vergib dem Node cka-cluster-worker das Label disktype=ssd.

Lösung:

k edit node cka-cluster-worker

füge folgen zeile unter labels hinuz:
disktype: ssd

speichern und schließen.

1. Erstelle einen Pod namens db-backend (Image redis:alpine),
   der über nodeSelector zwingend auf einem Node mit dem Label
   disktype=ssd platziert wird.

k run db-backend --image redis:alpine --nodeSelector disktype=ssd

## Aufgabe 3.2

Da bin ich leider raus

---

## Feedback

### Zu 3.1: Node Labels & NodeSelector

1. **Node labeln:**
   - `k edit node ...` funktioniert, kostet in der Prüfung aber zu viel Zeit.
   - **Prüfungs-Einzeiler:**
     `kubectl label node cka-cluster-worker disktype=ssd`
   - *(Tipp: Label wieder entfernen geht mit Minus am Ende:*
     `kubectl label node cka-cluster-worker disktype-`*)*

2. **Pod mit `nodeSelector`:**
   - `kubectl run` besitzt **kein** Flag `--nodeSelector`.
   - **Vorgehen:** YAML generieren und `nodeSelector` einfügen:

```bash
kubectl run db-backend --image=redis:alpine $do > db-backend.yaml
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-backend
spec:
  nodeSelector:
    disktype: ssd
  containers:
    - name: db-backend
      image: redis:alpine
```

---

### Zu 3.2: Taints & Tolerations (Birkenbihl-Mentales-Modell)

- **Taint am Node ("Das Warnschild / der Geruch"):** Hält Pods fern.
- **Toleration am Pod ("Die Genehmigung / Nasenklammer"):** Erlaubt es dem Pod,
  trotzdem auf diesem Node zu landen.

#### 1. Node mit Taint belegen

```bash
kubectl taint node cka-cluster-worker2 app=restricted:NoSchedule
```

*(Effekt-Arten: `NoSchedule`, `PreferNoSchedule`, `NoExecute`)*
*(Taint entfernen: Taint-Befehl mit `-` am Ende:*
`kubectl taint node cka-cluster-worker2 app=restricted:NoSchedule-`*)*

#### 2. Pod mit Toleration ausstatten

```bash
kubectl run secure-app --image=nginx:alpine $do > secure-app.yaml
```

Füge `tolerations` unter `spec` ein:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  tolerations:
    - key: "app"
      operator: "Equal"
      value: "restricted"
      effect: "NoSchedule"
  containers:
    - name: secure-app
      image: nginx:alpine
```
