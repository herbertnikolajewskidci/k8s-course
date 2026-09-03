# Aufgabe 1: Application Failure & Pod Debugging

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #8
- **Entspricht:** Block 1 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Die 3-Stufen-Diagnosekaskade beim Pod-Ausfall

Ein Pod ist kein homogener Monolith, sondern eine geschachtelte Zwiebel:

1. **Ebene 1: Kubernetes Event Bus (`kubectl describe pod`)**
   - *Was ist passiert?* Scheduling-Probleme, Image-Pull-Fehler,
     Mount-Probleme (fehlende Secret/ConfigMap/PVC), Health-Check-Fehlschläge
     (Liveness/Readiness), OOMKilled (Exit Code 137).
   - *Prüfungs-Reflex:* Immer zuerst `kubectl describe pod` ausführen, um
     den Statusgrund (`Reason`, `Exit Code`, `Events`) zu sehen.

2. **Ebene 2: Container-Laufzeit & Logs (`kubectl logs`)**
   - *Warum stürzt der Prozess ab?* Syntaxfehler im Skript, fehlende
     Umgebungsvariable, Port-Kollision, Exception im Prozess.
   - *Wichtige Flags:*
     - `-c <container-name>` bei Multi-Container-Pods.
     - `--previous` (`-p`), wenn der Container bereits neu gestartet ist und
       der aktuelle Log leer ist.

3. **Ebene 3: Interaktive Inspektion (`kubectl exec` / `kubectl debug`)**
   - *Wie sieht der Zustand im Container aus?* Dateisystem prüfen, Umgebung
     auslesen, Netzwerkerreichbarkeit testen.
   - *Wenn kein Container läuft oder minimales Distroless-Image:*
     `kubectl debug pod/<pod-name> -it --image=curlimages/curl`
     (bzw. `nicolaka/netshoot`).

---

## 2. Aufgabenstellung (Block 1)

Namespace für diesen Block: `troubleshoot-app`.

*Hinweis für lokale ARM64/Apple Silicon Umgebung:* Verwende für Tests
ARM64-kompatible Images (`curlimages/curl:latest`, `busybox:latest`,
`nginx:alpine`).

Erstelle zu Beginn den Namespace:

```bash
kubectl create namespace troubleshoot-app
```

---

### Aufgabe 1.1: Fehlende Konfiguration & CrashLoopBackOff

Im Namespace `troubleshoot-app` soll ein Microservice namens `auth-service`
laufen. Erzeuge zunächst den defekten Pod mit folgendem Manifest:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: auth-service
  namespace: troubleshoot-app
spec:
  containers:
    - name: app
      image: busybox:latest
      command:
        - sh
        - -c
        - >-
          echo Starting Auth Service... && cat /etc/config/api-key.txt && echo
          && sleep 3600
      envFrom:
        - configMapRef:
            name: auth-missing-cm
```

1. Analysiere den Zustand und die Events des Pods `auth-service`.
2. Identifiziere die genaue Ursache für den Fehlerzustand
   (`CreateContainerConfigError` bzw. Fehlen der ConfigMap).
3. Erstelle die fehlende ConfigMap `auth-missing-cm` im Namespace
   `troubleshoot-app` mit einem beliebigen Key/Value-Paar.
4. Beobachte, wie der Pod reagiert, und stelle sicher, dass der Pod in den
   Zustand `Running` übergeht. (Tipp: Der Pod benötigt zusätzlich die Datei
   `/etc/config/api-key.txt` oder passe das Manifest an, sodass der Befehl
   erfolgreich durchläuft — erstelle dazu eine ConfigMap `auth-config` mit dem
   Key `api-key.txt` und dem Wert `secret-token-12345` und mounte sie nach
   `/etc/config/` oder korrigiere das Startkommando).

---

### Aufgabe 1.2: Multi-Container Logging & Previous Crashes

Erzeuge folgenden Multi-Container-Pod `logger-pod` im Namespace
`troubleshoot-app`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: logger-pod
  namespace: troubleshoot-app
spec:
  containers:
    - name: web-frontend
      image: nginx:alpine
    - name: log-processor
      image: busybox:latest
      command:
        - sh
        - -c
        - "echo 'Init log...'; sleep 5; echo 'Fatal error: DB down'; exit 1"
```

1. Finde heraus, welcher Container crasht und in welchem Zyklus er sich
   befindet.
2. Lies die Logs des abgestürzten Containers aus — sowohl aus dem laufenden/neu
   startenden Container als auch explizit den Log des vorherigen Crashs
   (`--previous`).
3. Korrigiere den Pod `logger-pod` so, dass `log-processor` kontinuierlich
   läuft (z. B. `while true; do echo 'Processing logs...'; sleep 10; done`)
   und beide Container stabil den Status `1/1` bzw. `2/2 Running` aufweisen.

---

### Aufgabe 1.3: Blockierender InitContainer

Erzeuge folgenden Pod `db-client` im Namespace `troubleshoot-app`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
  namespace: troubleshoot-app
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:latest
      command:
        - sh
        - -c
        - "until nc -z -w 2 database-service 5432; do echo wait; sleep 2; done"
  containers:
    - name: client
      image: busybox:latest
      command: ["sh", "-c", "echo Connected to DB && sleep 3600"]
```

1. Untersuche den Pod-Status (`Init:0/1`).
2. Finde über die Logs des InitContainers heraus, worauf der Pod wartet.
3. Behebe die Blockade: Erstelle einen Dummy-Pod, der auf Port 5432 lauscht
   (z. B. mit `nc -lk -p 5432`), und mache ihn über einen Service namens
   `database-service` auf Port 5432 erreichbar (`kubectl expose ...`).
   Sobald die Verbindung steht, terminiert der InitContainer erfolgreich mit
   Exit-Code 0 und der Hauptcontainer `client` wechselt auf `Running`.

---

### Aufgabe 1.4: Liveness-Probe Misconfiguration

Erzeuge folgenden Pod `health-failing` im Namespace `troubleshoot-app`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: health-failing
  namespace: troubleshoot-app
spec:
  containers:
    - name: web
      image: nginx:alpine
      livenessProbe:
        httpGet:
          path: /healthz
          port: 80
        initialDelaySeconds: 3
        periodSeconds: 3
```

1. Beobachte den Pod für ca. 30–60 Sekunden mit `kubectl get pods -w`.
2. Analysiere via `kubectl describe pod health-failing`, warum der Pod
   kontinuierlich neu gestartet wird (Restarts steigen an).
3. Exportiere das YAML des Pods, korrigiere die Liveness-Probe auf den Pfad
   `/` (oder füge eine passende Datei `/usr/share/nginx/html/healthz` ein), und
   starte den Pod neu, sodass er dauerhaft `Running` ohne Neustarts bleibt.

---

## 3. Lösungen

Deine Befehle, Manifeste und Auswertungen führst du in der separaten Datei:
`labs/05-troubleshooting/Aufgabe-1-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `debug pods`, `configure liveness readiness probes`,
  `init containers`, `troubleshooting applications`
- **In-Terminal Syntax:**
  - `kubectl explain pod.spec.containers.livenessProbe`
  - `kubectl explain pod.spec.initContainers`
  - `kubectl logs --help`
  - `kubectl debug --help`
- **CLI-Hilfe:**
  - `kubectl get pods -n <ns> -o wide`
  - `kubectl logs <pod> -c <container> --previous`
  - `kubectl describe pod <pod>`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 1.1:** Gelöst (Kombination aus ConfigMap & Volume-Mount)
- **Aufgabe 1.2:** Gelöst (Multi-Container Logging & Dauerläufer-Korrektur)
- **Aufgabe 1.3:** Gelöst (InitContainer-Blockade durch Pod + Service gelöst)
- **Aufgabe 1.4:** **Wiederholung vorgemerkt** (Liveness Probe & Dateiinjektion)

---

### Detaillierte Analyse der einzelnen Aufgaben

#### Zu Aufgabe 1.1 (ConfigMap & Volume Mount)

- **Vorgehen:** Ursache `CreateContainerConfigError` per `describe` sauber
  identifiziert.
- **Bonus-Transfer:** Statt nur das Startkommando zu vereinfachen, hast du
  die Datei `/etc/config/api-key.txt` direkt als ConfigMap gemountet und per
  `kubectl exec` verifiziert.
- **Exam-Takeaway:** `CreateContainerConfigError` ist immer ein Indikator für
  fehlende oder falsch referenzierte ConfigMaps/Secrets *vor* dem Start.

#### Zu Aufgabe 1.2 (Multi-Container Logging)

- **Vorgehen:** Absturz von `log-processor` mit `-c` und `--previous`
  analysiert.
- **Korrektur:** Dauerlauf mit `while true; do ... sleep 10; done` sauber
  umgesetzt.
- **Exam-Takeaway:** Wenn ein Container im Multi-Container-Pod abstürzt,
  liefert `kubectl logs <pod>` einen Fehler (verlangt `-c`). Immer `-c
  <container-name>` nutzen.

#### Zu Aufgabe 1.3 (InitContainer)

- **Vorgehen:** Blockade in `Init:0/1` erkannt (`wait-for-db` wartete auf Port
  5432).
- **Korrektur:** Dummy-Pod mit `nc -lk -p 5432` gestartet und per Service
  `database-service` auf Port 5432 exponiert.
- **Exam-Takeaway:** Ein InitContainer blockiert den gesamten Pod-Start,
  solange er nicht mit Exit-Code 0 terminiert.

#### Zu Aufgabe 1.4 (Liveness-Probe & Injektion)

- **Analyse:** Der Nginx lieferte auf `/healthz` HTTP 404/403, wodurch Kubelet
  den Container nach 3 Fehlversuchen terminierte (`CrashLoopBackOff` /
  steigende Restarts).
- **Lernpunkt (emptyDir vs. ConfigMap):**
  - Ein `emptyDir` erzeugt beim Start immer ein leeres Verzeichnis.
  - Wenn ein Container bereits beim Start eine Datei mit festem Inhalt/Text
    benötigt, muss dieser Inhalt via **ConfigMap** (über `volumeMounts` mit
    `subPath` oder vollem Mount) hineingegeben werden.
  - **Prüfungs-Reflex:** In der CKA-Prüfung bei Liveness-Probe-Fehlern immer
    zuerst prüfen, ob der Pfad in der Probe (`path: /`) zum Webserver passt,
    anstatt zusätzliche Volumes einzubauen.

---

### Nächste Schritte

Nach deiner Pause geht es mit **Aufgabe 2 (Control Plane Failure & Static Pod
Troubleshooting)** weiter.
