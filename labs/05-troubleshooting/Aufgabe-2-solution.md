# Notizen & Lösungen: Aufgabe 2 (Control Plane Failure & Static Pod Troubleshooting)

- **Cluster / Node:** `cka-cluster-control-plane`
- **Issue:** #8

---

## Lösung 2.1: Kube-Scheduler Ausfall & Pending Pods

```bash
# Deine Befehle / Notizen
kubectl run test-schedule --image=nginx:alpine

kubectl get pod test-schedule
# NAME            READY   STATUS    RESTARTS   AGE
# test-schedule   0/1     Pending   0          15s

'''
Normalerweise ist es ja so, dass wenn ein Pod pending ist, dann ist entweder kein Platz verfügbar oder es gibt ein Tate oder es hängt auch irgendwas mit einem Private Volume Claim zusammen. Da das aber hier ja nicht der Fall ist, muss ich zwangsläufig davon ausgehen, dass was mit dem Cube Scheduler wahrscheinlich nicht stimmt, weil der Cube Scheduler dafür zuständig ist, zu entscheiden, wo welcher pot hinkommt und deswegen muss ich überprüfen was da los ist mit dem scheduler.
'''

kubectl get pod -n kube-system | grep sched
# kube-scheduler-cka-cluster-control-plane            0/1     ImagePullBackOff   0          4m20s

kubectl describe pod -n kube-scheduler-cka-cluster-control-plane -n kube-system

'''
Events:
  Type     Reason   Age                    From     Message
  ----     ------   ----                   ----     -------
  Normal   Pulling  2m19s (x5 over 5m16s)  kubelet  spec.containers{kube-scheduler}: Pulling image "registry.k8s.io/kube-scheduler:v1.36.1-broken-image"
  Warning  Failed   2m19s (x5 over 5m16s)  kubelet  spec.containers{kube-scheduler}: Failed to pull image "registry.k8s.io/kube-scheduler:v1.36.1-broken-image": rpc error: code = NotFound desc = failed to pull and unpack image "registry.k8s.io/kube-scheduler:v1.36.1-broken-image": failed to resolve reference "registry.k8s.io/kube-scheduler:v1.36.1-broken-image": registry.k8s.io/kube-scheduler:v1.36.1-broken-image: not found
  Warning  Failed   2m19s (x5 over 5m16s)  kubelet  spec.containers{kube-scheduler}: Error: ErrImagePull
  Normal   BackOff  13s (x21 over 5m15s)   kubelet  spec.containers{kube-scheduler}: Back-off pulling image "registry.k8s.io/kube-scheduler:v1.36.1-broken-image"
  Warning  Failed   13s (x21 over 5m15s)   kubelet  spec.containers{kube-scheduler}: Error: ImagePullBackOff
'''

ls /etc/kubernetes/manifests/
# control-watch.yaml  etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml  my-static-web.yaml
sed 's/image\: registry\.k8s\.io\/kube-scheduler\:v1\.36\.1-broken-image/image\: registry\.k8s\.io\/kube-scheduler:v1.36.1/' /etc/kubernetes/manifests/kube-scheduler.yaml > /etc/kubernetes/manifests/kube-scheduler.yaml


sed 's/\- \-\-kubeconfig\=\/etc\/kubernetes\/scheduler-broken.conf//' /etc/kubernetes/manifests/kube-scheduler.yaml > /etc/kubernetes/manifests/kube-scheduler.yaml

kubectl get pods -n kube-system | grep scheduler
# kube-scheduler-cka-cluster-control-plane            1/1     Running   0          5m29s
```

---

## Lösung 2.2: Kube-Controller-Manager Failure

```bash
# Deine Befehle / Notizen
kubectl get pods -n kube-system | grep controller
# kube-controller-manager-cka-cluster-control-plane   0/1     Error     4 (48s ago)   83s


kubectl describe pod kube-scheduler-cka-cluster-control-plane  -n kube-system

sed -i 's/controller-manager-broken\.conf/controller-manager\.conf/' /etc/kubernetes/manifests/kube-controller-manager.yaml

kubectl -n kube-system get pods | grep controller
# kube-controller-manager-cka-cluster-control-plane   1/1     Running   0          9m59s

kubectl get deploy web-deploy
# NAME         READY   UP-TO-DATE   AVAILABLE   AGE
# web-deploy   3/3     3            3           23m

```

---

## Lösung 2.3: API-Server Totalausfall & Runtime-Debugging (`crictl`)

```bash
# Deine Befehle / Notizen
kubectl get pods -A
# The connection to the server cka-cluster-control-plane:6443 was refused - did you specify the right host or port?


root@cka-cluster-control-plane:/# crictl ps -a
'''
CONTAINER           IMAGE               CREATED             STATE               NAME                      ATTEMPT             POD ID              POD                                                 NAMESPACE
d69b2c1a680a5       4923943f21256       12 seconds ago      Running             kube-apiserver            8                   aaa48b29a834c       kube-apiserver-cka-cluster-control-plane            kube-system
ac76bac8fdbbd       4923943f21256       11 minutes ago      Exited              kube-apiserver            7                   aaa48b29a834c       kube-apiserver-cka-cluster-control-plane            kube-system
9861dfe614f35       76e62361b06b5       24 minutes ago      Running             kube-scheduler            1                   bb67339569b29       kube-scheduler-cka-cluster-control-plane            kube-system
80e69cd516903       39d983367f38c       24 minutes ago      Running             kube-controller-manager   1                   deea1d8512250       kube-controller-manager-cka-cluster-control-plane   kube-system
638a0f6954cba       e0e8b3cbfed68       25 minutes ago      Running             control-watchdog          37                  012c27157644f       control-watchdog-cka-cluster-control-plane          default
76472d7704d6d       e0e8b3cbfed68       25 minutes ago      Running             busybox                   37                  c2f52c351bf45       cluster-agent-mnvrj                                 default
f86a71392e386       39d983367f38c       39 minutes ago      Exited              kube-controller-manager   0                   deea1d8512250       kube-controller-manager-cka-cluster-control-plane   kube-system
a23dfd013cce0       76e62361b06b5       58 minutes ago      Exited              kube-scheduler            0                   bb67339569b29       kube-scheduler-cka-cluster-control-plane            kube-system
eeb1ba49bf564       e0e8b3cbfed68       About an hour ago   Exited              control-watchdog          36                  012c27157644f       control-watchdog-cka-cluster-control-plane          default
a8d4b20d0e52a       e0e8b3cbfed68       About an hour ago   Exited              busybox                   36                  c2f52c351bf45       cluster-agent-mnvrj                                 default
48fe90a40bd4e       c961b53097208       7 days ago          Running             web                       0                   7975f3d756590       my-static-web-cka-cluster-control-plane             default
0c0934e0900cd       fe81a497e85f1       7 days ago          Running             coredns                   0                   944f46ddf3af5       coredns-589f44dc88-rqn5g                            kube-system
69d516b719ece       fe81a497e85f1       7 days ago          Running             coredns                   0                   9f8e52032ded1       coredns-589f44dc88-dddzj                            kube-system
0d9189776be33       3501a03785a84       7 days ago          Running             local-path-provisioner    0                   51d5c1f09aa7a       local-path-provisioner-855c7b7774-2j4kw             local-path-storage
c23e8129ab8e8       f2ede2b789a61       7 days ago          Running             kindnet-cni               0                   15f82db7f64cc       kindnet-4x629                                       kube-system
d88f4493d0d54       01ad784c02283       7 days ago          Running             kube-proxy                0                   24558949822db       kube-proxy-tvn76                                    kube-system
a6a8675d87728       6da6ea097b384       7 days ago          Running             etcd                      0                   b319d40d261bf       etcd-cka-cluster-control-plane                      kube-system
root@cka-cluster-control-plane:/# crictl ps -a | grep api
d69b2c1a680a5       4923943f21256       31 seconds ago      Exited              kube-apiserver            8                   aaa48b29a834c       kube-apiserver-cka-cluster-control-plane            kube-system
'''

crictl logs d69b2c1a680a5
'''
I0902 13:10:57.335861       1 options.go:263] external host was not specified, using 192.168.147.4
I0902 13:10:57.338199       1 server.go:150] Version: v1.36.1
I0902 13:10:57.338217       1 server.go:152] "Golang settings" GOGC="" GOMAXPROCS="" GOTRACEBACK=""
W0902 13:10:57.444938       1 logging.go:55] [core] [Channel #1 SubChannel #2] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:57.445399       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:57.445451       1 logging.go:55] [core] [Channel #4 SubChannel #5] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
I0902 13:10:57.445487       1 shared_informer.go:381] "Waiting for caches to sync" controller="node_authorizer"
W0902 13:10:57.445526       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
E0902 13:10:57.445608       1 options.go:205] The manifest file is empty, ignoring.
W0902 13:10:57.446070       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:57.446131       1 logging.go:55] [core] [Channel #7 SubChannel #8] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:58.447631       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:58.447725       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:10:58.448012       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:00.301994       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:00.354635       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:00.362760       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:02.437443       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:02.703608       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:02.830220       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:06.420074       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:07.261043       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:07.500576       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:12.540459       1 logging.go:55] [core] [Channel #7 SubChannel #9] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:12.778292       1 logging.go:55] [core] [Channel #1 SubChannel #3] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
W0902 13:11:14.098280       1 logging.go:55] [core] [Channel #4 SubChannel #6] grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2389", ServerName: "127.0.0.1:2389", }. Err: connection error: desc = "transport: Error while dialing: dial tcp 127.0.0.1:2389: connect: connection refused"
E0902 13:11:17.447663       1 run.go:72] "command failed" err="error creating storage factory: context deadline exceeded"
'''

in /etc/kubernetes/manifests/kube-apiserver.yaml den port korrigiert

kubectl get nodes
# NAME                        STATUS   ROLES           AGE     VERSION
# cka-cluster-control-plane   Ready    control-plane   7d18h   v1.36.1
# cka-cluster-worker          Ready    <none>          7d18h   v1.36.1
# cka-cluster-worker2         Ready    <none>          7d18h   v1.36.1

```

---

## Lösung 2.4: Zertifikatsabläufe prüfen (`kubeadm certs`)

```bash
# Deine Befehle / Notizen

root@cka-cluster-control-plane:/# kubeadm certs renew all
'''
[renew] Reading configuration from the "kubeadm-config" ConfigMap in namespace "kube-system"...
[renew] Use 'kubeadm init phase upload-config kubeadm --config your-config-file' to re-upload it.

certificate embedded in the kubeconfig file for the admin to use and for kubeadm itself renewed
certificate for serving the Kubernetes API renewed
certificate the apiserver uses to access etcd renewed
certificate for the API server to connect to kubelet renewed
certificate embedded in the kubeconfig file for the controller manager to use renewed
certificate for liveness probes to healthcheck etcd renewed
                                                               certificate for etcd nodes to communicate with each other renewedcertificate for serving etcd renewed                                                                                      certificate for the front proxy client renewed                                                                            certificate embedded in the kubeconfig file for the scheduler manager to use renewed                                      certificate embedded in the kubeconfig file for the super-admin renewed

                                                   Done renewing certificates. You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.

'''
kubectl -n kube-system get pods
kubectl -n kube-system delete pods kube-apiserver-cka-cluster-control-plane
kubectl -n kube-system delete pods kube-controller-manager-cka-cluster-control-plane
kubectl -n kube-system delete pods kube-scheduler-cka-cluster-control-plane
kubectl -n kube-system delete pods etcd-cka-cluster-control-plane
kubectl -n kube-system get pods

```
