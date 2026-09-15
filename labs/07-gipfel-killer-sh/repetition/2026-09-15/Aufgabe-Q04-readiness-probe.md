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

Im Namespace `probe-system` soll ein Service namens `backend-service`
Traffic an einen Backend-Pod weiterleiten. Momentan zeigt der Service
jedoch `Endpoints: <none>`.

### Aufgabe 1: Pod-Labels & Service-Selector abgleichen

1. Untersuche den Service `backend-service` und den Pod `backend-pod` in
   `probe-system`.
2. Korrigiere die Labels des Pods bzw. den Selector des Services, sodass
   die Selektoren übereinstimmen.

### Aufgabe 2: ReadinessProbe mit wget konfigurieren

1. Erstelle einen Überwachungs-Pod `probe-checker` (Image: `busybox:latest`),
   der alle 5 Sekunden prüft, ob `backend-service.probe-system.svc.cluster.local:80`
   erreichbar ist.
2. Konfiguriere eine `readinessProbe` vom Typ `exec`, die mittels:
   `wget -q -O - http://backend-service:80`
   die Verfügbarkeit des Backends testet.
3. Stelle sicher, dass der Service aktive Endpoints besitzt und
   `probe-checker` den Zustand `1/1 Ready` erreicht.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `configure liveness readiness startup probes`
- **Zielseite & Klickpfad:**
  `Tasks -> Configure Pods and Containers -> Configure Liveness,`
  `Readiness and Startup Probes`
- **In-Page Suche (Strg+F):** `readinessProbe` oder `exec`
- **In-Terminal Fastpath:**
  - `kubectl get endpoints -n probe-system`
  - `kubectl explain pod.spec.containers.readinessProbe.exec`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
