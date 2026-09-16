# Lösung & Notizen: Aufgabe Q03 (Multi-Container Pod, Downward API & Volumes)

## Notizen & Befehle

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: collector
  name: collector
  namespace: project-tiger
spec:
  volumes:
    - name: shared-logs
      emptyDir: {}
  containers:
    - name: producer
      image: busybox:latest
      command: ["sh", "-c"]
      args:
        - while true; do
          echo $HOST_NODE $(date) >> /var/log/app/events.log;
          sleep 5;
          done;
      env:
        - name: HOST_NODE
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
    - name: consumer
      image: busybox:latest
      command: ["sh", "-c"]
      args:
        - tail -n-1 -f /var/log/app/events.log
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
```
