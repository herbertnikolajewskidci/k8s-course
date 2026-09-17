# Lösung & Notizen: Aufgabe Q11 (PV Recovery & Re-Binding Retain Policy)

## Notizen & Befehle

### 1. PersistentVolume befreien (Released -> Available)

Exportieren und `claimRef: null` setzen:

```bash
kubectl get pv pv-retained-data -o yaml > pv-retained-data.yaml
```

In `pv-retained-data.yaml` das Feld `claimRef: null` definiert und angewendet:

```bash
kubectl apply -f pv-retained-data.yaml
```

Alternativ via Patch oder Edit:

```bash
kubectl patch pv pv-retained-data -p '{"spec":{"claimRef": null}}'
```

Ergebnis: `pv-retained-data` wechselt auf `Available`.

### 2. Neuen PVC erstellen (recovered-pvc.yaml)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: recovered-pvc
  namespace: storage-recovery
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 500Mi
  storageClassName: "manual"
```

Anwenden:

```bash
kubectl apply -f recovered-pvc.yaml
```

### 3. Verifikation

```bash
kubectl get pv pv-retained-data
kubectl get pvc recovered-pvc -n storage-recovery
```

Ausgabe:

```text
NAME               CAPACITY   ACCESS MODES   STATUS   CLAIM
pv-retained-data   500Mi      RWO            Bound    storage-recovery/recovered-pvc

NAME            STATUS   VOLUME             CAPACITY   ACCESS MODES   STORAGECLASS
recovered-pvc   Bound    pv-retained-data   500Mi      RWO            manual
```
