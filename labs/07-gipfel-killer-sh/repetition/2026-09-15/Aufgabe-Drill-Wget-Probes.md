# Drill: HTTP-Probes mit wget in BusyBox & Containern

- **CKA Domäne:** Workloads & Scheduling (15%) / Linux Foundations
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #12
- **Entspricht:** Killer.sh Subtask Drill (HTTP Probes & wget CLI)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir vor, du schickst einen Boten los, um zu prüfen, ob ein Laden geöffnet
ist:

- **Der Standard-Reflex (`wget URL`):** Der Bote geht in den Laden, kauft die
  gesamte Ware und stellt sie dir kartonweise in den Hausflur (`index.html`
  wird auf die Festplatte geschrieben). In Containern ohne Schreibrechte
  bricht er sofort mit `Permission denied` ab – oder vermüllt bei jedem
  Probe-Lauf im 5-Sekunden-Takt das Dateisystem (`index.html.1`, `index.html.2`).
- **Der Postkarten-Modus (`-O -`):** Mit der Option `-O -` weist du den Boten
  an: *"Schreib nichts auf die Festplatte! Gib den Text direkt auf der Konsole
  aus (`stdout`)."*
- **Der Lautlos-Modus (`-q`):** `wget` malt standardmäßig Ladebalken und
  Download-Statistiken. Mit `-q` (quiet) schaltet er jegliches Geplapper ab.
- **Das Schema-Präfix (`http://`):** Ohne `http://` interpretiert BusyBox-`wget`
  den Hostnamen oft nicht zuverlässig als HTTP-Ziel. Erst das Protokoll
  `http://` stellt eindeutig klar, dass Port 80 per HTTP-GET angefragt werden
  soll.

Für Kubernetes ist der Textinhalt völlig egal – die Kubelet-Probe interessiert
sich **ausschließlich für den Linux-Exit-Code**:

- **Exit 0:** HTTP 200 OK → Probe meldet `Success` (Pod wird `Ready`).
- **Exit != 0:** Connection refused, DNS-Fehler oder 404 → Probe meldet
  `Failure` (Pod bleibt `0/1 NotReady`).

**KaWa WGET:**

- **W**eb-Request aus leichtgewichtigen Containern
- **G**eräuschlos prüfen (`-q` für Quiet)
- **E**xit-Code steuert Pod-Status (0 = Ready)
- **T**erminal-Output statt Datei-Speicherung (`-O -`)

### Live verifizierter Doku-Navigationsanker

- **kubernetes.io Docs-Suchfeld:** `configure liveness readiness startup probes`
- **Zielseite:** `Tasks → Configure Pods and Containers → Configure Liveness,`
  `Readiness and Startup Probes`
- **In-Page Suche (`Strg+F` / `Cmd+F`):** `Define a liveness command`
- **In-Terminal Fastpath:**
  - `kubectl explain pod.spec.containers.readinessProbe.exec`
  - In BusyBox direkt: `busybox wget --help`

---

## 2. Aufgabenstellung (Wget-Probes Drill)

*(Hinweis: Trage deine Lösungen, Befehle und Notizen bitte in die separate Datei
`Aufgabe-Drill-Wget-Probes-solution.md` ein.)*

Führe diese Schritte interaktiv auf Host `cka3200` aus (`ssh cka3200`).

### Aufgabe 1: Der Unterschied zwischen Download und Stream (`-O -`)

1. Starte auf `cka3200` eine interaktive Test-Shell in einem temporären Pod:

   ```bash
   kubectl run test-tools --image=busybox:latest -n project-alpha -it --rm -- sh
   ```

2. Führe im Pod den Befehl `wget http://backend-service:80` aus.
   Prüfe mit `ls -la`, welche Datei im Verzeichnis angelegt wurde.
3. Lösche die erzeugte Datei (`rm index.html`).
4. Führe nun den Befehl mit Stream-Option aus:
   `wget -O - http://backend-service:80`
5. Prüfe erneut mit `ls -la`. Warum ist `-O -` für Container-Probes
   essentiell?

### Aufgabe 2: Lautlos-Modus (`-q`) und Exit-Codes (`$?`)

1. Teste den Befehl mit Stummschaltung:
   `wget -q -O - http://backend-service:80`
2. Prüfe unmittelbar danach den Rückgabewert der Shell:
   `echo $?` (Erwartung: `0`).
3. Probiere nun einen Request auf einen **nicht existierenden Port** aus:
   `wget -q -O - http://backend-service:9999`
4. Prüfe erneut den Rückgabewert:
   `echo $?` (Erwartung: ungleich `0`).
5. Notiere, wie das Kubelet diesen Unterschied interpretiert.

### Aufgabe 3: FQDN vs. Kurzname & Schema-Präfix

1. Teste im Test-Pod folgende drei Varianten:
   - `wget -q -O - backend-service` (ohne Protokoll)
   - `wget -q -O - http://backend-service` (Kurzname im selben Namespace)
   - `wget -q -O - http://backend-service.project-alpha.svc.cluster.local:80`
     (voller FQDN)
2. Vergleiche das Ergebnis: Braucht BusyBox-Wget das Schema `http://` bei
   Port 80 zwingend, oder funktioniert der reine Hostname genauso?

### Aufgabe 4: YAML-Einbettung in Kubernetes-Probes

1. Vergleiche die beiden gültigen Schreibweisen für eine `exec`-Probe in einer
   Pod-Spec:
   - **Variante A (Direktes Array):**

     ```yaml
     readinessProbe:
       exec:
         command: ["wget", "-q", "-O", "-", "http://backend-service:80"]
     ```

   - **Variante B (Shell-Wrapping via `/bin/sh -c`):**

     ```yaml
     readinessProbe:
       exec:
         command:
           - /bin/sh
           - -c
           - "wget -q -O - http://backend-service:80"
     ```

2. Begründe, warum Variante A für simple Befehle ausreicht, Variante B jedoch
   nötig wird, wenn Pipes (`|`) oder logische Verknüpfungen (`&&`) vorkommen.

---

## 3. Spickzettel & Doku-Hilfen

- **Die magische CKA-Wget-Formel:**

  ```bash
  wget -q -O - http://<service>:<port>
  ```

- **Bedeutung der Flags:**
  - `-q`: Quiet (keine Fortschrittsbalken, keine Fehlermeldungen im Log).
  - `-O -`: Output Document to `stdout` (`-` = Konsole / Standardausgabe).
  - `-T 2`: Timeout nach 2 Sekunden (optional, falls Server hängt).
- **Curl-Alternative (falls `curl` im Image vorhanden ist):**

  ```bash
  curl -s -f http://<service>:<port>
  ```

  *(Hinweis: Bei `curl` ist `-f` entscheidend, da `curl` bei HTTP 500
  standardmäßig Exit 0 liefert! Erst `-f` erzwingt Exit != 0 bei Serverfehlern.)*

---

## 4. Feedback & Korrekturen

### Review der Aufgaben 1 bis 4 (100% Ball-im-Tor)

Alle praktischen Beobachtungen in `Aufgabe-Drill-Wget-Probes-solution.md`
treffen den Kern des Problems exakt:

1. **Aufgabe 1 & 2 (Stream & Exit-Codes):**
   - Befehl: `wget -q -O - http://backend-service:80`
   - Rückgabe: Nginx-HTML direkt auf Konsole gestreamt.
   - Exit-Code: `$?` = `0` (Success).
   - Port 9999: `Connection timed out`, `$?` = `1` (Failure).
   - Befund: Das Kubelet liest ausschließlich diesen Exit-Code. Nur `0` schaltet
     die Probe auf `Ready`.

2. **Aufgabe 3 (Schema `http://` vs. Realität in BusyBox):**
   - Dein Testprotokoll beweist es schwarz auf weiß: Alle drei Aufrufe
     (`backend-service`, `http://backend-service`, voller FQDN) verbinden sich
     gleichermaßen fehlerfrei mit Port 80
     (`Connecting to backend-service (10.105.248.39:80)`).
   - **Klarstellung zur Aufgabenstellung:** Die Annahme, dass `http://` in
     BusyBox zwingend erforderlich sei, wurde durch deinen Test widerlegt!
     BusyBox nimmt bei reinen Hostnamen standardmäßig HTTP auf Port 80 an.
   - Der Fehlerabbruch `index.html: File exists`, der in deinem Protokoll
     auftauchte, hatte nichts mit `http://` zu tun, sondern entstand rein
     dadurch, dass bei diesen Testbefehlen das `-O -` weggelassen wurde.

3. **Aufgabe 4 (Kernel-Exec vs. Shell-Interpretation):**
   - Deine Begründung trifft es punktgenau:
     Variante A ruft das Linux-Binary direkt über den Kernel auf.
     Variante B wird benötigt, sobald Shell-Operatoren (Pipes `|`,
     Verknüpfungen `&&`, Schleifen `while`) interpretiert werden müssen.

---

### CKA Exam Takeaway

In minimalen Images (BusyBox, Alpine) immer die Standardkombination nutzen:

```yaml
readinessProbe:
  exec:
    command:
      - wget
      - -q
      - -O
      - "-"
      - http://<service-name>:<port>
```

- `-q`: Verhindert Log-Spam.
- `-O -`: Verhindert den "File exists"-Absturz.
- Ohne Shell: Schlank, schnell, direkt.
