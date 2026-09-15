# Aufgabe Q03: Multi-Container Pod, Downward API & Volumes

- **CKA Domäne:** Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka5248`
- **Wiederholungs-Grund:** Explizit von Herbert als Drill vorgemerkt (0/6 Punkte)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir einen Zwei-Mann-Posten vor:

- Der **Producer** schreibt kontinuierlich Messdaten in ein gemeinsames
  Schwarzes Brett (das `emptyDir`-Volume unter `/var/log/app/events.log`).
- Der **Consumer** sitzt direkt daneben und liest fortlaufend mit (`tail -f`).
- Die **Downward API** ist wie ein Namensschild, das von der Decke (dem
  Kubernetes-Scheduler) in den Container hineingereicht wird: Der Container
  weiß von selbst nicht, auf welchem physischen Node er läuft – über
  `fieldRef.fieldPath: spec.nodeName` wird ihm diese Information als
  Umgebungsvariable `HOST_NODE` injiziert.

**KaWa DOWNWARD:**

- **D**aten von außen (Pod-Metadaten)
- **O**bjektfeld-Referenz (`fieldRef`)
- **W**eitergabe an Container-Prozess
- **N**odename als Umweltvariable (`spec.nodeName`)
- **W**artezeitlos im Pod-Startzyklus
- **A**bgleich mit Pod-Status
- **R**essourcen-Transparenz
- **D**oppel-Container im selben Netzwerk & IPC-Namespace

---

## 2. Aufgabenstellung (Repetition Q03)

Host für diese Aufgabe: `ssh cka5248`.

Im Namespace `project-tiger` soll ein Multi-Container-Telemetrie-Pod
namens `collector` erstellt werden.

### Aufgabe 1: Pod-Konstruktion mit Shared Volume

Erstelle einen Pod namens `collector` in Namespace `project-tiger`:

1. Definiere ein gemeinsames Volume vom Typ `emptyDir` namens `shared-logs`.
2. Hänge dieses Volume in **beide** Container unter `/var/log/app` ein.

### Aufgabe 2: Producer-Container mit Downward API

1. Name: `producer`, Image: `busybox:latest`.
2. Injiziere über die **Downward API** den Node-Namen des Pods als
   Umgebungsvariable `HOST_NODE` (`fieldRef: spec.nodeName`).
3. Starte eine Endlosschleife, die alle 5 Sekunden einen Eintrag mit
   Zeitstempel und `$HOST_NODE` in `/var/log/app/events.log` schreibt.

### Aufgabe 3: Consumer-Container & Verifikation

1. Name: `consumer`, Image: `busybox:latest`.
2. Führe den Befehl `tail -n+1 -f /var/log/app/events.log` aus.
3. Stelle sicher, dass der Pod mit Status `2/2 Running` läuft und
   `kubectl logs collector -n project-tiger -c consumer` die erzeugten
   Einträge live anzeigt.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `downward api environment variable`
- **Zielseite & Klickpfad:**
  `Tasks -> Inject Data into Applications -> Expose Pod Information`
  `to Containers Through Environment Variables`
- **In-Page Suche (Strg+F):** `spec.nodeName`
- **In-Terminal Fastpath:**
  - `kubectl explain pod.spec.containers.env.valueFrom.fieldRef`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
