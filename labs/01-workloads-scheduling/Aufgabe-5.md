# Aufgabe 5.1 (Rolling Update & History)

1. Erstelle ein Deployment namens web-service mit Image
   nginx:1.24 und 4 Replikaten.
   Lösung:
   k create deployment web-service --image=nginx:1.24 \
     --replicas=4 $do > web-service.yaml
   k create -f web-service.yaml

1. Aktualisiere das Image des Containers nginx auf nginx:1.25
   und setze eine Change-Cause-Annotation oder sorge dafür,
   dass die Rollout-History nachvollziehbar ist.

   Ändere mdie web-service.yaml den tag auf 1.25 und dann
   k rollout restart -f web-service.yaml

1. Überprüfe den Status des Rollouts mit kubectl rollout
   status ....

```text
❯ k rollout status deployment/web-service

deployment "web-service" successfully rolled out
```

1. Sieh dir die Revisions-Historie an mit kubectl rollout
   history ....

```text
❯ k rollout history deployment/web-service
deployment.apps/web-service
REVISION CHANGE-CAUSE
1 <none>
2 <none>
```

---

## Feedback zu 5.1

### Zu Schritt 1: ⭐ 100% Richtig

- YAML-Generierung mit `$do` und anschließendes Erstellen ist der schnellste Weg.

### Zu Schritt 2: ⚠️ Image-Update & Change-Cause

1. **Datei-Änderung anwenden:**
   - Nach dem Anpassen von `web-service.yaml` nutzt man
     `kubectl apply -f web-service.yaml`.
   - `k rollout restart` startet die Pods der bestehenden Konfiguration neu,
     liest aber keine lokalen YAML-Dateien ein.
   - **Prüfungs-Einzeiler (ohne YAML zu editieren):**
     `kubectl set image deployment/web-service nginx=nginx:1.25`

2. **Wie füllt man die Spalte `CHANGE-CAUSE`?**
   - Im `rollout history` stand bei dir `<none>`.
   - **Lösung via Annotation:**
     `kubectl annotate deployment/web-service`
     `kubernetes.io/change-cause="Upgrade to 1.25"`
   - *(Oder direkt in `web-service.yaml` unter `metadata.annotations`:*
     `kubernetes.io/change-cause: "Upgrade to 1.25"`*)*

### Zu Schritt 3 & 4: ⭐ 100% Richtig

- `k rollout status deployment/web-service` und
  `k rollout history deployment/web-service` sind exakt die CKA-Prüfungsbefehle.
