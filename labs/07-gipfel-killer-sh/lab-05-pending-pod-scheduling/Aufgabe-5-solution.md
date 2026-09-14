# Lösung zu Aufgabe 5: Pending Pod Forensik – Die 4 realen WordPress-Szenarien

## Lösung Szenario 1: Der HostPort-Konflikt (`wp-scenario-1`)

```bash
# 1. Blockierter Pod & Scheduler-Event:

k -n wp-scenario-1 get pods -o wide
k -n wp-scenario-1 describe pod wordpress-hp-7c8d76f96b-9t7wb | grep -A 8 Events:

# 2. Ursachen-Erklärung (Warum HostPort?):
"""
0/3 nodes are available: 1 node(s) had untolerated taint(s), 2 node(s) didn't have free ports for the requested pod ports. no new claims to deallocate
"""

# 3. Reparatur-Befehl / Manifest-Änderung:

k -n wp-scenario-1 get deploy wordpress-hp -o yaml | grep -i hostport

k -n wp-scenario-1 edit deploy wordpress-hp

k -n wp-scenario-1 rollout restart deployment wordpress-hp

# 4. Verifikation aller 3 Pods (kubectl get pods -o wide):

k -n wp-scenario-1 get deploy wordpress-hp
k -n wp-scenario-1 get pods -o wide
```

---

## Lösung Szenario 2: Der "Unschedulable / Cordoned" Node (`wp-scenario-2`)

```bash
# 1. Scheduler-Events auslesen:
k -n wp-scenario-2 get deployments
k -n wp-scenario-2 get pods -o wide
k -n wp-scenario-2 describe pods wordpress-cordon-8fddd9989-4csj2 | grep -A 8 Events:

"""
0/3 nodes are available: 1 node(s) didn't match pod topology spread constraints, 1 node(s) had untolerated taint(s), 1 node(s) were unschedulable.
"""

# 2. Status der Nodes ermitteln:

k get nodes
"""
NAME                        STATUS                     ROLES           AGE   VERSION
cka-cluster-control-plane   Ready                      control-plane   12d   v1.36.1
cka-cluster-worker          Ready                      worker          12d   v1.36.1
cka-cluster-worker2         Ready,SchedulingDisabled   worker          12d   v1.36.1
"""



# 3. Befehl zur Behebung auf Cluster-Ebene:

k uncordon cka-cluster-worker2

# 4. Verifikation aller 3 Pods:
k -n wp-scenario-2 get pods


```

---

## Lösung Szenario 3: Die NodeSelector-Lücke (`wp-scenario-3`)

```bash
# 1. Scheduler-Events & gefordertes Label im Deployment:

k -n wp-scenario-3 describe pods wordpress-selector-65bf89898f-hhzck | grep -A 8 Events:

# no new claims to deallocate

k -n wp-scenario-3 get deploy wordpress-selector -o yaml | grep -I -A 1 nodeSelector:
# tier: backend

# 2. Vergleich mit vorhandenen Node-Labels:

k get nodes --show-labels | grep backend
cka-cluster-worker
k get nodes --show-labels | grep backend
# cka-cluster-worker          Ready    worker          12d   v1.36.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,disktype=ssd,env=production,kubernetes.io/arch=arm64,kubernetes.io/hostname=cka-cluster-worker,kubernetes.io/os=linux,node-role.kubernetes.io/worker=worker,tier=backendReady    worker          12d   v1.36.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,disktype=ssd,env=production,kubernetes.io/arch=arm64,kubernetes.io/hostname=cka-cluster-worker,kubernetes.io/os=linux,node-role.kubernetes.io/worker=worker,tier=backend

# 3. Befehl zur Behebung auf Node-Ebene:

k label nodes cka-cluster-worker2 tier=backend



# 4. Verifikation aller 3 Pods:

k -n wp-scenario-3 get pods -o wide
"""
NAME                                  READY   STATUS    RESTARTS   AGE   IP             NODE                  NOMINATED NODE   READINESS GATES
wordpress-selector-65bf89898f-48sjw   1/1     Running   0          15m   10.244.2.183   cka-cluster-worker    <none>           <none>
wordpress-selector-65bf89898f-hhzck   1/1     Running   0          15m   10.244.1.154   cka-cluster-worker2   <none>           <none>
wordpress-selector-65bf89898f-khbv5   1/1     Running   0          15m   10.244.2.182   cka-cluster-worker    <none>           <none>
"""
```

---

## Lösung Szenario 4: Der PVC ReadWriteOnce (RWO) Node-Lock (`wp-scenario-4`)

```bash
# 1. Analyse der Events & Pod-Platzierung:

k -n wp-scenario-4 describe pods wordpress-rwo-79866d6478-m2pnx | tail -n 15

# 2. Ursachen-Erklärung (Warum RWO auf Node-Ebene, nicht Pod-Ebene?):

# 1 node(s) didn't match PersistentVolume's node affinity

k -n wp-scenario-4 get pvc,pv

# NAME                           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
# persistentvolumeclaim/wp-pvc   Bound    pvc-ec49ccd1-05c2-4d1f-9546-c31d50992cda

# persistentvolume/pvc-ec49ccd1-05c2-4d1f-9546-c31d50992cda   50Mi       RWO

# 3. Ursachen-Erklärung (Warum blockiert der 3. Pod auf einem anderen Node?):

# 4. Architektur-Lösungsmöglichkeiten (3 Standardwege in Kubernetes):
```
