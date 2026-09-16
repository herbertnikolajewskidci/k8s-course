# Aufgabe Q04: ReadinessProbe & Service Endpoint Resolution

- **CKA Domäne:** Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka3200`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/7 Punkte, Endpoints leer)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Ein Service ist wie ein Club-Türsteher:

- Er lässt Kunden (Traffic) nur zu Pods durch, die **zwei Bedingungen** erfüllen:
  1. **Dresscode (Labels):** Der Pod muss exakt die Labels tragen, die der
     Service im `selector` fordert. Fehlt auch nur ein Label, existiert der
     Pod für den Service nicht.
  2. **Nüchternheitstest (ReadinessProbe):** Selbst wenn der Pod den Dresscode
     erfüllt, wird er erst in die Gästeliste (Endpoints / EndpointSlice)
     eingetragen, wenn seine `readinessProbe` erfolgreich (`Exit 0` bzw.
     HTTP 200) meldet.
- Schlägt die Probe fehl, bleibt der Pod zwar `Running`, steht aber auf
  `0/1 Ready` und der Service leitet **keinen einzigen Request** an ihn weiter!

**KaWa PROBE:**

- **P**rüfung vor Traffic-Freigabe
- **R**eadiness schützt vor unfertigen Backends
- **O**bjekt-Endpoints werden dynamisch entkoppelt
- **B**efehlsausführung (`exec: command: [...]`) oder HTTP-Check
- **E**ndpunkt-Synchronisation in Echtzeit

---

## 2. Aufgabenstellung (Repetition Q04)

Host für diese Aufgabe: `ssh cka3200`.

Im Namespace `project-alpha` ist ein ClusterIP-Service namens `backend-service`
auf Port `80` vorkonfiguriert, besitzt momentan jedoch keine aktiven Endpoints.

### Aufgabe 1: Überwachungs-Pod mit ReadinessProbe erstellen

1. Erstelle im Namespace `project-alpha` einen Überwachungs-Pod namens
   `probe-checker` mit Image `busybox:latest`.
2. Der Container soll als Hintergrundprozess im Leerlauf laufen (z. B.
   `command: ["sleep", "3600"]`).
3. Konfiguriere eine `readinessProbe` vom Typ `exec`, die mittels `wget`
   periodisch die HTTP-Erreichbarkeit des Services prüft:
   `wget -q -O - http://backend-service:80`
4. Bestätige, dass `probe-checker` initial im Zustand `0/1 Ready` verbleibt,
   da der Backend-Service noch keine antwortenden Endpoints besitzt.

### Aufgabe 2: Backend-Pod bereitstellen & Endpoints aktivieren

1. Erstelle im Namespace `project-alpha` einen Pod namens `backend-pod` mit
   Image `nginx:1-alpine`.
2. Vergib die für `backend-service` erforderlichen Labels (siehe
   `kubectl get svc backend-service -n project-alpha -o yaml`), damit der
   Traffic an den Pod geroutet wird.
3. **Achtung (Webserver-Falle):** Überschreibe beim `backend-pod` nicht den
   Standard-Container-Befehl (kein `sleep`), damit der Nginx-Webserver startet
   und auf Port 80 antwortet.
4. Stelle sicher, dass `backend-service` einen aktiven Endpoint erhält und
   `probe-checker` automatisch in den Zustand `1/1 Ready` wechselt.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `configure liveness readiness startup probes`
- **Zielseite & Klickpfad:**
  `Tasks → Configure Pods and Containers → Configure Liveness,`
  `Readiness and Startup Probes`
- **In-Page Suche (`Strg+F`):** `readinessProbe` oder `exec`
- **In-Terminal Fastpath:**
  - `kubectl get svc backend-service -n project-alpha -o yaml`
  - `kubectl get endpoints -n project-alpha`
  - `kubectl explain pod.spec.containers.readinessProbe.exec`

---

## 4. Feedback & Korrekturen

### Ergebnis-Scorecard & Cluster-Prüfung: 7 / 7 Punkte (100% PASS)

Die Lösung wurde live auf Cluster `cka3200` im Namespace `project-alpha`
verifiziert. Ergebnis des Prüflaufs:

- **Backend-Pod:** `backend-pod` läuft mit `1/1 Running` auf Node `cka3200`.
- **Service-Endpoints:** `endpoints/backend-service` ist aktiv mit
  `10.244.0.20:80`.
- **ReadinessProbe:** `probe-checker` führt
  `wget -q -O - http://backend-service:80` periodisch alle 5s aus.
- **Probe-Status:** `probe-checker` hat nach Bereitstellung des Backends
  erfolgreich auf `1/1 Ready` umgeschaltet.
- **Evaluator-Status:** `verify-all-17.py` bewertet Q04 mit vollen 7/7 Punkten.

---

### Detailliertes Review & CKA-Prüfungs-Takeaways

#### 1. Die Nginx-Einstiegspunkt-Falle

Wird bei einem Webserver-Image wie `nginx:1-alpine` das Feld `command: [...]`
mit `sleep` überschrieben, startet der Webserver-Daemon nicht. Der Container
bleibt zwar als Prozess im Status `Running`, lauscht aber auf keinem TCP-Port.
Jeder Probe- oder Service-Zugriff schlägt mit `Connection refused` fehl.

*CKA-Regel:* Bei Backend-Images (Nginx, Apache, HTTP-Echo) das Feld `command`
nur überschreiben, wenn explizit ein alternativer Serverbefehl verlangt wird.

#### 2. Das Zusammenspiel von ReadinessProbe und Service-Endpoints

- **Selector-Match:** Sobald die Labels (`app: backend-service`)
  übereinstimmen, registriert der Endpoints-Controller den Pod grundsätzlich.
- **Readiness-Filter:** Der Pod wird erst dann als aktiver Endpunkt in
  die Serviceliste eingetragen, wenn alle ReadinessProbes `Success` (Exit 0)
  melden.
- In dieser Aufgabe diente `probe-checker` als Konsument, der erst dann auf
  `Ready` schaltete, als der Service tatsächlich funktionierte.

---

### Doku- & In-Terminal Fastpath (Unter 30 Sekunden)

- **kubernetes.io Docs-Suchfeld:** `configure liveness readiness startup probes`
- **Zielseite:** `Tasks → Configure Pods and Containers → Configure Liveness,`
  `Readiness and Startup Probes`
- **In-Page Suche (`Strg+F`):** `Define a liveness command`
- **In-Terminal Fastpath:**

  ```bash
  kubectl explain pod.spec.containers.readinessProbe.exec
  ```
