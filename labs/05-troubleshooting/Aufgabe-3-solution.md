# Notizen & Lösungen: Aufgabe 3 (Node & Kubelet Failure)

- **Cluster / Node:** `cka-cluster-worker` / `cka-cluster-worker2`
- **Issue:** #8

---

## Lösung 3.1: Worker Node im Status `NotReady`

```bash
# Deine Befehle / Notizen
k get nodes
NAME                        STATUS     ROLES           AGE     VERSION
# cka-cluster-control-plane   Ready      control-plane   7d19h   v1.36.1
# cka-cluster-worker          NotReady   <none>          7d19h   v1.36.1
# cka-cluster-worker2         Ready      <none>          7d19h   v1.36.1

k describe node cka-cluster-worker
'''
Events:
  Type    Reason          Age   From             Message
  ----    ------          ----  ----             -------                                                                    Normal  RegisteredNode  36m   node-controller  Node cka-cluster-worker event: Registered Node cka-cluster-worker in Controller                                                                                                                      Normal  NodeNotReady    20m   node-controller  Node cka-cluster-worker status is now: NodeNotReady
'''

k describe node cka-cluster-worker | grep -i -A 10 condition
'''
Conditions:                                                                                                                 Type             Status    LastHeartbeatTime                 LastTransitionTime                Reason              Message                                                                                                                          ----             ------    -----------------                 ------------------                ------              -------  MemoryPressure   Unknown   Wed, 02 Sep 2026 15:34:01 +0200   Wed, 02 Sep 2026 15:34:56 +0200   NodeStatusUnknown   Kubelet stopped posting node status.
  DiskPressure     Unknown   Wed, 02 Sep 2026 15:34:01 +0200   Wed, 02 Sep 2026 15:34:56 +0200   NodeStatusUnknown   Kubelet stopped posting node status.
  PIDPressure      Unknown   Wed, 02 Sep 2026 15:34:01 +0200   Wed, 02 Sep 2026 15:34:56 +0200   NodeStatusUnknown   Kubelet stopped posting node status.
  Ready            Unknown   Wed, 02 Sep 2026 15:34:01 +0200   Wed, 02 Sep 2026 15:34:56 +0200   NodeStatusUnknown   Kubelet stopped posting node status.
'''

# Kubelet stopped posting node status.

 docker exec -it cka-cluster-worker bash
'''
root@cka-cluster-worker:/# systemctl status kubelet
● kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/etc/systemd/system/kubelet.service; enabled; preset: enabled)
    Drop-In: /etc/systemd/system/kubelet.service.d
             └─10-kubeadm.conf, 11-kind.conf
     Active: activating (auto-restart) (Result: exit-code) since Wed 2026-09-02 13:58:09 UTC; 786ms ago
 Invocation: 67b9a1e19e554553a8d2222de4725835
       Docs: http://kubernetes.io/docs/
    Process: 95383 ExecStartPre=/bin/sh -euc if [ -f /sys/fs/cgroup/cgroup.controllers ]; then /kind/bin/create-kubelet-cgroup-v2.sh; fi (code=exited, status=0/SUCCESS)
    Process: 95392 ExecStartPre=/bin/sh -euc if [ ! -f /sys/fs/cgroup/cgroup.controllers ] && [ ! -d /sys/fs/cgroup/systemd/kubelet ]; then mkdir -p /sys/fs/cgroup/systemd/kubelet; fi (code=exited, status=0/SUCCESS)
    Process: 95393 ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS (code=exited, status=1/FAILURE)
   Main PID: 95393 (code=exited, status=1/FAILURE)
   Mem peak: 14.3M
        CPU: 46ms
Sep 02 14:01:08 cka-cluster-worker systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE
Sep 02 14:01:08 cka-cluster-worker systemd[1]: kubelet.service: Failed with result 'exit-code'.

'''

journalctl -u kubelet
'''
Sep 02 14:02:23 cka-cluster-worker kubelet[100288]: E0902 14:02:23.692605  100288 run.go:72] "command failed" err="failed to load kubelet config file, path: /var/lib/kubelet/config.yaml, error: failed to load Kubelet config file /var/lib/kubelet/config.yaml, error failed to decode: no kind \"KubeletConfiguration\" is registered for version \"kubelet.config.k8s.io/v1beta1_broken\" in scheme \"pkg/kubelet/apis/config/scheme/scheme.go:33\""
Sep 02 14:02:23 cka-cluster-worker systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE
Sep 02 14:02:23 cka-cluster-worker systemd[1]: kubelet.service: Failed with result 'exit-code'.
'''

vim /var/lib/kubelet/config.yaml
# _broken gelöscht

❯ k get nodes
# NAME                        STATUS   ROLES           AGE     VERSION
# cka-cluster-control-plane   Ready    control-plane   7d19h   v1.36.1
# cka-cluster-worker          Ready    <none>          7d19h   v1.36.1
# cka-cluster-worker2         Ready    <none>          7d19h   v1.36.1
```

---

## Lösung 3.2: Kubelet Kubeconfig & Zertifikats-Mismatch

```bash
# Deine Befehle / Notizen
root@cka-cluster-worker2:/# journalctl kubelet
Failed to add match 'kubelet': Invalid argument
root@cka-cluster-worker2:/# journalctl -u kubelete
-- No entries --
root@cka-cluster-worker2:/# systemctl status kubelet
● kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/etc/systemd/system/kubelet.service; enabled; preset: enabled)
    Drop-In: /etc/systemd/system/kubelet.service.d
             └─10-kubeadm.conf, 11-kind.conf
     Active: activating (auto-restart) (Result: exit-code) since Wed 2026-09-02 14:12:17 UTC; 177ms ago
 Invocation: 6fc4138afa65453f960f9739000f47d6
       Docs: http://kubernetes.io/docs/
    Process: 125556 ExecStartPre=/bin/sh -euc if [ -f /sys/fs/cgroup/cgroup.controllers ]; then /kind/bin/create-kubelet-cgroup-v2.sh; fi (code=exited, status=0/SUCCESS)
    Process: 125564 ExecStartPre=/bin/sh -euc if [ ! -f /sys/fs/cgroup/cgroup.controllers ] && [ ! -d /sys/fs/cgroup/systemd/kubelet ]; then mkdir -p /sys/fs/cgroup/systemd/kubelet; fi (code=exited, status=0/SUCCESS)
    Process: 125566 ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS (code=exited, status=1/FAILURE)
   Main PID: 125566 (code=exited, status=1/FAILURE)
   Mem peak: 15.8M
        CPU: 67ms

Sep 02 14:12:17 cka-cluster-worker2 systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE
Sep 02 14:12:17 cka-cluster-worker2 systemd[1]: kubelet.service: Failed with result 'exit-code'.


cat /var/lib/kubelet/kubeadm-flags.env  | grep broken || echo "Nix gefunden"
Nix gefunden

cat /etc/systemd/system/kubelet.service.d/10-kubeadm.conf | grep broken || echo "Nix gefunden"
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet-broken.conf"

sed -i 's/kubelet\-broken/kubelet/' /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

cat /etc/systemd/system/kubelet.service.d/10-kubeadm.conf | grep broken || echo "Nix gefunden"
Nix gefunden

systemctl daemon-reload && systemctl restart kubelet

k get nodes
                                                                                                             NAME                        STATUS   ROLES           AGE     VERSION
cka-cluster-control-plane   Ready    control-plane   7d19h   v1.36.1                                                      cka-cluster-worker          Ready    <none>          7d19h   v1.36.1                                                      cka-cluster-worker2         Ready    <none>          7d19h   v1.36.1

```

---

## Lösung 3.3: Node Cordoning, Drain & Eviction Troubleshooting

```bash
# Deine Befehle / Notizen

k cordon cka-cluster-worker
k drain cka-cluster-worker --ignore-daemonsets
k drain cka-cluster-worker --ignore-daemonsets --delete-emptydir-data --force

k uncordon cka-cluster-worker
```
