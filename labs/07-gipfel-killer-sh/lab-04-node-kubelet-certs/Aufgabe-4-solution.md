# Lösung zu Aufgabe 4: Kubelet TLS-Zertifikate & Systemd Node-Reparatur

## Lösung 4.1: Kubelet Client/Server Zertifikats-Forensik (Killer.sh Sim B Q3)

```bash
# 1. OpenSSL Befehl für Client-Zertifikat (/var/lib/kubelet/pki/kubelet-client-current.pem):
openssl x509 -in /var/lib/kubelet/pki/kubelet-client-current.pem \
    -noout -text | grep -i -E "issuer|extended" -A1

# 2. OpenSSL Befehl für Server-Zertifikat (/var/lib/kubelet/pki/kubelet.crt):

openssl x509 -in /var/lib/kubelet/pki/kubelet.crt \
    -noout -text | grep -i -E "issuer|extended" -A1

# 3. Befehl(e) zum Schreiben in /tmp/certificate-info.txt:

vim /tmp/certificate-info.txt

# 4. Inhalt von /tmp/certificate-info.txt:
cat /tmp/certificate-info.txt

```

---

## Lösung 4.2: Node NotReady – Kubelet Systemd Reparatur (Killer.sh Sim B Q6)

```bash
# 1. Diagnose-Befehle (Status & Fehler im Log ohne Pager):

systemctl status kubelet
journalctl -u kubelet
ls -la /usr/local/bin/
which kubelet
# /usr/bin/kubelete

# 2. Pfad zur Systemd Drop-In Datei:

systemctl status kubelet | grep Drop-In

ls -la /etc/systemd/system/kubelet.service.d

cat /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

# 3. Reparatur-Befehle & Neustart-Sequenz (Daemon-Reload etc.):
'''
Vorm Edit:
# Note: This drop-in only works with kubeadm and kubelet v1.11+
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
EnvironmentFile=-/etc/default/kubelet
ExecStart=
ExecStart=/usr/local/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
'''

'''
Danach:

# Note: This drop-in only works with kubeadm and kubelet v1.11+                         [Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"                 EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
EnvironmentFile=-/etc/default/kubelet
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
'''

# 4. Verifikation des Node-Status:
k get nodes
# NAME                        STATUS   ROLES           AGE   VERSION                      cka-cluster-control-plane   Ready    control-plane   12d   v1.36.1                      cka-cluster-worker          Ready    <none>          12d   v1.36.1
# cka-cluster-worker2         Ready    <none>          12d   v1.36.1

# 5. Pod 'success' starten & Running-Zustand prüfen:

 k run success --image=nginx:1-alpine
pod/success created

k get pods
NAME                                         READY   STATUS      RESTARTS       AGE
cluster-agent-mnvrj                          1/1     Running     72 (39m ago)   10d
cluster-agent-tjz96                          1/1     Running     72 (39m ago)   10d
cluster-agent-wqcrj                          1/1     Running     71 (99m ago)   10d
control-watchdog-cka-cluster-control-plane   1/1     Running     72 (39m ago)   10d
cpu-app-6cc496bb5-jvhtr                      1/1     Running     1 (15h ago)    4d1h
cpu-app-6cc496bb5-lcmjs                      1/1     Running     1 (15h ago)    4d1h
hourly-cleanup-29812860-dnp66                0/1     Completed   0              58m
my-static-web-cka-cluster-control-plane      1/1     Running     1 (15h ago)    11d
success                                      1/1     Running     0              20s

```
