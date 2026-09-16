# Lösung & Notizen: Aufgabe Q15 (Node Maintenance Safe Drain & Uncordon)

## Notizen & Befehle

cka-admin@cka6016:~$ k drain cka6016 --ignore-daemonsets --delete-emptydir-data
node/cka6016 cordoned
Warning: ignoring DaemonSet-managed Pods: kube-flannel/kube-flannel-ds-9gvf9, kube-system/kube-proxy-qqb7j, monitoring/monitor-agent-zhrcv
evicting pod storage-tier/vault-1
evicting pod core-routing/service-router-7fbc749c9b-mw7x7
evicting pod core-routing/service-router-7fbc749c9b-59mcd
evicting pod kube-system/coredns-7c65d6cfc9-bgdqw
evicting pod kube-system/coredns-7c65d6cfc9-d7bhv
evicting pod maintenance-drill/worker-drain-test-6bbd6f8595-k666z
evicting pod maintenance-drill/worker-drain-test-6bbd6f8595-gwnpl
evicting pod project-tiger/tiger-telemetry-77ff996b85-pfqh7
evicting pod storage-tier/vault-0
evicting pod local-path-storage/local-path-provisioner-dbff48958-dkm6s I0916 13:38:03.874635 1018778 request.go:700] Waited for 1.189368781s due to client-side throttling, not priority and fairness, request: GET:<https://192.168.130.212:6443/api/v1/namespaces/storage-tier/pods/vault-0pod/vault-0> evicted pod/local-path-provisioner-dbff48958-dkm6s evicted
pod/service-router-7fbc749c9b-mw7x7 evicted
pod/worker-drain-test-6bbd6f8595-k666z evicted
pod/coredns-7c65d6cfc9-d7bhv evicted
pod/worker-drain-test-6bbd6f8595-gwnpl evicted
pod/coredns-7c65d6cfc9-bgdqw evicted
pod/service-router-7fbc749c9b-59mcd evicted
pod/vault-1 evictedpod/tiger-telemetry-77ff996b85-pfqh7 evicted
node/cka6016 drained

cka-admin@cka6016:~$ k get nodes
NAME STATUS ROLES AGE VERSION
cka6016 Ready,SchedulingDisabled control-plane 47h v1.31.14

cka-admin@cka6016:~$ k -n maintenance-drill get pods
NAME READY STATUS RESTARTS AGE
worker-drain-test-6bbd6f8595-5tlg6 0/1 Pending 0 5m40s
worker-drain-test-6bbd6f8595-khxkm 0/1 Pending 0 5m46s
cka-admin@cka6016:~$

cka-admin@cka6016:~$ k uncordon cka6016
node/cka6016 uncordoned
cka-admin@cka6016:~$ k get nodes
NAME STATUS ROLES AGE VERSION
cka6016 Ready control-plane 47h v1.31.14

cka-admin@cka6016:~k -n maintenance-drill get pods
NAME READY STATUS RESTARTS AGE
worker-drain-test-6bbd6f8595-5tlg6 1/1 Running 0 15m
worker-drain-test-6bbd6f8595-khxkm 1/1 Running 0 15m
