# Aufgabe 2

## Aufgabe 2.1

lies data-loader.yaml

---

## Feedback

### 2.1

- `initContainers` und die Container-Befehle (`command`) sind super aufgebaut!
- **Fehler bei Volumes:** `emptyDir` und `filePath` wurden direkt unter `spec`
  definiert (`unknown field "spec.emptyDir", unknown field "spec.filePath"`).
- **Das 2-Stufen-Prinzip für Volumes in Kubernetes (Birkenbihl-Anker):**
  1. **Stufe 1 (Bereitstellung auf Pod-Ebene):** `spec.volumes` definiert das
     Volume (`name` + Typ wie `emptyDir: {}`).
  2. **Stufe 2 (Einhängen im Container):** Jeder Container (auch
     `initContainers`), der darauf zugreifen soll, braucht unter
     `volumeMounts` denselben Namen und den Zielpfad (`mountPath: /data`).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: data-loader
spec:
  volumes:
    - name: shared-storage
      emptyDir: {}
  initContainers:
    - name: setup
      image: busybox
      command: ["touch", "/data/ready.txt"]
      volumeMounts:
        - name: shared-storage
          mountPath: /data
  containers:
    - name: app
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: shared-storage
          mountPath: /data
```
