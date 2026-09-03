# Notizen & Lösungen: Aufgabe 4 (Network, CoreDNS & Service Troubleshooting)

- **Namespace:** `net-debug`
- **Issue:** #8

---

## Lösung 4.1: Cluster-weiter DNS-Ausfall

```bash
# Deine Befehle / Notizen

kubectl get pods --namespace=kube-system -l k8s-app=kube-dns
NAME                       READY   STATUS    RESTARTS   AGE
coredns-589f44dc88-dddzj   1/1     Running   0          8d
coredns-589f44dc88-rqn5g   1/1     Running   0          8d


kubectl logs --namespace=kube-system -l k8s-app=kube-dns
maxprocs: Leaving GOMAXPROCS=14: CPU quota undefined
.:53
[INFO] plugin/reload: Running configuration SHA512 = 1b226df79860026c6a52e67daa10d7f0d57ec5b023288ec00c5e05f93523c894564e15b91770d3a07ae1cfbe861d15b37d4a0027e69c546ab112970993a3b03b
CoreDNS-1.14.2
linux/arm64, go1.26.1, dd1df4f
[ERROR] plugin/errors: 2 web-backend-svc.net-lab.svc.clsuter.local. AAAA: read udp 10.244.0.4:54446->0.250.250.254:53: i/o timeout
[ERROR] plugin/errors: 2 web-backend-svc.net-lab.svc.clsuter.local. A: read udp 10.244.0.4:33409->0.250.250.254:53: i/o timeout
[ERROR] plugin/errors: 2 web-backend-svc.net-lab.svc.clsuter.local. A: read udp 10.244.0.4:38439->0.250.250.254:53: i/o timeout
[ERROR] plugin/errors: 2 web-backend-svc.net-lab.svc.clsuter.local. AAAA: read udp 10.244.0.4:51545->0.250.250.254:53: i/o timeout
maxprocs: Leaving GOMAXPROCS=14: CPU quota undefined
.:53
[INFO] plugin/reload: Running configuration SHA512 = 1b226df79860026c6a52e67daa10d7f0d57ec5b023288ec00c5e05f93523c894564e15b91770d3a07ae1cfbe861d15b37d4a0027e69c546ab112970993a3b03b
CoreDNS-1.14.2
linux/arm64, go1.26.1, dd1df4f


k -n kube-system describe svc kube-dns
Name:                     kube-dns
Namespace:                kube-system
Labels:                   k8s-app=kube-dns
                          kubernetes.io/cluster-service=true
                          kubernetes.io/name=CoreDNS
Annotations:              prometheus.io/port: 9153
                          prometheus.io/scrape: true
Selector:                 k8s-app=kube-dns-invalid
Type:                     ClusterIP
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.96.0.10
IPs:                      10.96.0.10
Port:                     dns  53/UDP
TargetPort:               53/UDP
Endpoints:
Port:                     dns-tcp  53/TCP
TargetPort:               53/TCP
Endpoints:
Port:                     metrics  9153/TCP
TargetPort:               9153/TCP
Endpoints:
Session Affinity:         None
Internal Traffic Policy:  Cluster
Events:                   <none>

k -n kube-system edit svc kube-dns
service/kube-dns edited

k -n kube-system describe svc kube-dns
\Name:                     kube-dns
Namespace:                kube-system
Labels:                   k8s-app=kube-dns
                          kubernetes.io/cluster-service=true
                          kubernetes.io/name=CoreDNS
Annotations:              prometheus.io/port: 9153
                          prometheus.io/scrape: true
Selector:                 k8s-app=kube-dns


k get endpointslices.discovery.k8s.io -n kube-system
NAME             ADDRESSTYPE   PORTS        ENDPOINTS               AGE
kube-dns-vlqfl   IPv4          53,53,9153   10.244.0.2,10.244.0.4   8d


k -n net-debug exec -it dns-client -- nslookup backend-service.net-debug.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53


Name:   backend-service.net-debug.svc.cluster.local
Address: 10.96.39.109
```

---

## Lösung 4.2: Service ohne funktionierende Endpunkte (Selector/Port Mismatch)

```bash
# Deine Befehle / Notizen

k -n net-debug get svc
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
app-service       ClusterIP   10.96.232.183   <none>        80/TCP    12m


k -n net-debug get deploy
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
app-deploy   2/2     2            2           12m

k -n net-debug describe deployments.apps app-deploy | grep -i label
Labels:                 <none>
  Labels:  app=web-app

k -n net-debug get pods -l app=web-app
NAME                          READY   STATUS    RESTARTS   AGE
app-deploy-69f8b8cf86-8mvb7   1/1     Running   0          15m
app-deploy-69f8b8cf86-jbc5s   1/1     Running   0          15m


k -n net-debug exec -it app-deploy-69f8b8cf86-8mvb7 -- nslookup app-service.net-debug.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53


Name:   app-service.net-debug.svc.cluster.local
Address: 10.96.232.183

k -n net-debug exec -it app-deploy-69f8b8cf86-8mvb7 -- curl app-service.net-debug.svc.cluster.local
curl: (7) Failed to connect to app-service.net-debug.svc.cluster.local:80 after 1 ms: Could not connect to server
command terminated with exit code 7


k -n net-debug describe svc app-service
Name:                     app-service
Namespace:                net-debug
Labels:                   <none>
Annotations:              <none>
Selector:                 app=webapp
Type:                     ClusterIP
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.96.232.183
IPs:                      10.96.232.183
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
Endpoints:
Session Affinity:         None
Internal Traffic Policy:  Cluster
Events:                   <none>

k -n net-debug edit svc app-service
service/app-service edited

k -n net-debug describe svc app-service
Name:                     app-service
Namespace:                net-debug
Labels:                   <none>
Annotations:              <none>
Selector:                 app=web-app
Type:                     ClusterIP
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.96.232.183
IPs:                      10.96.232.183
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
Endpoints:                10.244.2.181:80,10.244.1.100:80
Session Affinity:         None
Internal Traffic Policy:  Cluster
Events:                   <none>

k -n net-debug exec -it app-deploy-69f8b8cf86-8mvb7 -- curl -I app-service.net-debug
HTTP/1.1 200 OK
Server: nginx/1.31.4
Date: Thu, 03 Sep 2026 07:57:27 GMT
Content-Type: text/html
Content-Length: 896
Last-Modified: Tue, 11 Aug 2026 23:21:52 GMT
Connection: keep-alive
ETag: "6a7bae90-380"
Accept-Ranges: bytes



```

---

## Lösung 4.3: Node-Netzwerk / CNI Plugin Ausfall

```bash
# Deine Befehle / Notizen

k get nodes -o wide

k get nodes cka-cluster-worker2
NAME                  STATUS     ROLES    AGE   VERSION
cka-cluster-worker2   NotReady   <none>   8d    v1.36.1

root@cka-cluster-worker2:/# mv /etc/cni/net.d/10-kindnet.conflist.disabled /etc/cni/net.d/10-kindnet.conflist
root@cka-cluster-worker2:/# systemctl daemon-reload && systemctl restart kubelet

```
