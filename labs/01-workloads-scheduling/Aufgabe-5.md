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

---

## Aufgabe 5.2 (Fehlerhaftes Update & Rollback)

1. Fehler provozieren: Setze das Image auf nginx:1.99.99
   (erzeugt ImagePullBackOff).

```bash
k set image deployment/web-service nginx=nginx:1.99.99
```

```text
❯ k get pods
NAME READY STATUS RESTARTS AGE
web-service-64fd5f9f97-dbzxn 0/1 ImagePullBackOff 0 19s
web-service-64fd5f9f97-l8fqx 0/1 ImagePullBackOff 0 19s
web-service-7448d7666-2rqbr 1/1 Running 0 6m55s
web-service-7448d7666-7mmv6 1/1 Running 0 6m55s
web-service-7448d7666-qjjkj 1/1 Running 0 6m55s
```

1. Beobachten: Wie sieht der Output von kubectl rollout status
   aus?

```text
❯ k rollout status deployment/web-service
Waiting for deployment "web-service" rollout to finish:
2 out of 4 new replicas have been updated...
```

1. Rollback durchführen: Welcher kubectl rollout-Befehl rollt
   sofort auf die vorherige funktionierende Revision zurück?

```text
❯ k rollout undo deployment/web-service
deployment.apps/web-service rolled back
```

1. Verifizieren: Zeige, dass wieder alle 4 Pods gesund auf
   1.25 laufen.

```text
❯ k rollout status deployment/web-service
deployment "web-service" successfully rolled out
```

```text
❯ k get pods
NAME READY STATUS RESTARTS AGE
web-service-7448d7666-2rqbr 1/1 Running 0 8m35s
web-service-7448d7666-2w68b 1/1 Running 0 23s
web-service-7448d7666-7mmv6 1/1 Running 0 8m35s
web-service-7448d7666-qjjkj 1/1 Running 0 8m35s
```

---

## Feedback zu 5.2

### ⭐ 100% Lehrbuchmäßig gelöst

- **`set image`:** Sofort umgesetzt und perfekt angewendet.
- **Rollout-Status & MaxUnavailable/MaxSurge:** Sehr gut beobachtet!
  Kubernetes killt während des Rolling Updates nicht alle alten Pods auf einmal,
  sondern wartet auf den Erfolg der neuen. Da die neuen im `ImagePullBackOff`
  waren, blieben alte Pods am Leben.
- **`rollout undo`:** Exakter CKA-Prüfungsbefehl.
  - *Profi-Tipp für gezielte Revisionen:*
    `kubectl rollout undo deployment/web-service --to-revision=1`
- **Verifikation:** Pods sind sofort wieder 4/4 `Running`.
