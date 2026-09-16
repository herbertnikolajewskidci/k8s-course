# Lösung & Notizen: Aufgabe Q14 (etcd Backup & etcdutl)

## Notizen & Befehle

### 1. Zertifikatspfade aus dem Dateikopf ermitteln

```bash
sudo head -n 35 /etc/kubernetes/manifests/etcd.yaml
```

- Endpoint: `https://127.0.0.1:2379`
- Trusted CA: `/etc/kubernetes/pki/etcd/ca.crt`
- Server Cert: `/etc/kubernetes/pki/etcd/server.crt`
- Server Key: `/etc/kubernetes/pki/etcd/server.key`

### 2. Snapshot erzeugen

```bash
mkdir -p /course/14/backup/

sudo ETCDCTL_API=3 etcdctl snapshot save /course/14/backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### 3. Snapshot mit etcdutl verifizieren & dokumentieren

```bash
sudo etcdutl snapshot status /course/14/backup/etcd-snapshot.db \
  --write-out=table | sudo tee /course/14/backup/status.txt
sudo chown -R cka-admin:cka-admin /course/14/backup/
```

### 4. Ausgabe in /course/14/backup/status.txt

```text
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| f540042a |   197923 |        842 |     2.1 MB |
+----------+----------+------------+------------+
```
