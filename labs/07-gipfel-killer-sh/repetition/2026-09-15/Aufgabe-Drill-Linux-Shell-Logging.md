# Drill: Linux Shell-Logging, Timestamps & YAML-Wrapping

- **CKA Domäne:** Workloads & Scheduling (15%) / Linux Foundations
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #12
- **Entspricht:** Shell-Logging-Muster für CKA-Workloads (Begleit-Drill zu Q03)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir eine Schreibstube mit zwei Werkzeugen vor:

- **Die Kiste (`$VARIABLE`):** Der Name steht außen drauf. Hebst du den Deckel
  hoch (`$HOST_NODE`), nimmst du einfach den fertigen Zettel heraus. Es muss
  nichts gerechnet oder ausgeführt werden.
- **Der Bote in Klammern (`$(BEFEHL)`):** Du schickst einen Boten los
  (`$(date)`). Der rennt zur Rathaus-Uhr, schaut auf das Zifferblatt und ruft
  die aktuelle Uhrzeit an genau dieser Textstelle in den Raum.

Wenn du schreibst: `echo "$(date) $HOST_NODE"`, ruft der Bote die Zeit und du
nimmst gleichzeitig den Hostnamen aus der Kiste. Beide landen zusammen in einer
einzigen Zeile.

**Die häufigste Falle:** Schreibt man `echo "$date"`, sucht die Shell nach
einer Kiste namens `date` – die ist leer. Man muss die runden Klammern mit dem
Dollarzeichen davor nutzen (`$(date)`), um den Boten loszuschicken.

**KaWa SHELL:**

- **S**ubstitution von Befehlen (`$(date)`)
- **H**ost- und Umweltvariablen (`$HOST_NODE`)
- **E**cho als kontinuierlicher Schreiber
- **L**oop (`while true; do ... sleep 5; done`)
- **L**og-Append (`>>` hängt an, `>` überschreibt)

### Live verifizierter Doku-Navigationsanker

- **kubernetes.io Docs-Suchfeld:** `define command arguments container`
- **Zielseite:** `Tasks → Inject Data into Applications → Define a Command and`
  `Arguments for a Container`
- **In-Page Suche (`Strg+F` / `Cmd+F`):** `Run a command in a shell`
- **Fundstelle im Text:**
  Zeigt das Standard-Muster für Shell-Loops in Pods:
  `args: ["-c", "while true; do echo hello; sleep 10;done"]`
- **In-Terminal Fastpath:**
  - `kubectl explain pod.spec.containers.command`
  - `kubectl explain pod.spec.containers.args`

---

## 2. Aufgabenstellung (Linux Shell Logging Drill)

*(Hinweis: Trage deine Lösungen, Befehle und Notizen bitte in die separate Datei
`Aufgabe-Drill-Linux-Shell-Logging-solution.md` ein.)*

Führe diese Schritte direkt im Terminal auf deinem Mac oder auf einem beliebigen
Cluster-Node (z. B. `ssh cka5248`) aus.

### Aufgabe 1: Der Bote und die Kiste im Terminal

1. Setze in deiner aktuellen Shell eine Umgebungsvariable:
   `export HOST_NODE="mein-test-node"`.
2. Gib mit einem einzigen `echo`-Befehl den aktuellen Zeitstempel (via `date`)
   und die Variable `$HOST_NODE` nebeneinander in einer Zeile aus.
3. Notiere den Befehl und die Terminal-Ausgabe.

### Aufgabe 2: Dateiumleitung und Append (`>>`)

1. Leite die Ausgabe aus Aufgabe 1 in eine temporäre Datei `/tmp/test-log.txt`
   um.
2. Führe den Befehl nach 3 Sekunden Wartezeit erneut aus.
3. Prüfe mit `cat /tmp/test-log.txt`, ob zwei Zeilen mit unterschiedlichen
   Sekunden-Zeitstempeln in der Datei stehen (Nachweis des Anhängens statt
   Überschreibens).

### Aufgabe 3: Die 5-Sekunden-Endlosschleife

1. Baue eine Shell-Schleife mit `while true; do ... done`.
2. In der Schleife soll alle 5 Sekunden (`sleep 5`) eine Zeile mit
   `$(date) $HOST_NODE` an `/tmp/test-log.txt` angehängt werden.
3. Lasse die Schleife kurz laufen, brich sie mit `Strg+C` ab und prüfe den
   Dateiinhalt mit `tail -n 3 /tmp/test-log.txt`.

### Aufgabe 4: Das YAML-Muster (Lesbarkeit ohne Quote-Escaping)

1. Vergleiche zwei Schreibweisen, wie dieser Befehl in ein Kubernetes-Pod-
   Manifest eingebettet werden kann:
   - **Variante A (Einzeiler im Array):** `command` und `args` als JSON-Array.
   - **Variante B (YAML-Block-Skalar `|`):** Mehrzeiliger Shell-Code ohne
     störende Backslashes vor Anführungszeichen.
2. Formuliere für den `producer`-Container aus Q03 das saubere `command`- und
   `args`-Fragment unter Verwendung von Variante B.

---

## 3. Spickzettel & Doku-Hilfen

- **Befehlssubstitution (Bote):** `$(date)` oder `$(date -u)` (UTC-Zeit).
- **Variablen-Expansion (Kiste):** `$HOST_NODE` oder `${HOST_NODE}`.
- **Append-Operator:** `>>` (hängt an das Dateiende an).
- **Overwrite-Operator:** `>` (löscht den bisherigen Inhalt und schreibt neu).
- **YAML Block-Skalar:**
  Mit dem Pipe-Zeichen `|` nach `args:` kann man bash/sh-Code exakt so
  hineinschreiben wie im Terminal, ohne `\"` tippen zu müssen:

  ```yaml
  command: ["/bin/sh", "-c"]
  args:
    - |
      while true; do
        echo "$(date) $HOST_NODE" >> /var/log/app/events.log
        sleep 5
      done
  ```

---

## 4. Feedback & Korrekturen

### Review der Aufgaben 1 bis 4 (100% Ball-im-Tor)

Alle vier Aufgaben wurden auf Host `cka5248` fehlerfrei gelöst und im
Begleitdokument dokumentiert:

1. **Aufgabe 1 (Bote & Kiste):**
   - Befehl: `echo $HOST_NODE $(date)`
   - Ausgabe: `mein-test-node Wed Sep 16 08:45:23 UTC 2026`
   - Befund: Die Befehlssubstitution `$(date)` und die Variablenexpansion
     `$HOST_NODE` greifen sauber ineinander. Beide Ausdrücke werden vor der
     Übergabe an `echo` evaluiert und nebeneinander ausgegeben.

2. **Aufgabe 2 (Append-Operator `>>`):**
   - Befehl: `echo $HOST_NODE $(date) >> /tmp/test-log.txt`
   - Ausgabe in Datei: Zwei Zeilen im Abstand von 6 Sekunden (`08:48:27` und
     `08:48:33`).
   - Befund: Die Datei wurde nicht überschrieben, sondern fortlaufend erweitert.

3. **Aufgabe 3 (Endlosschleife `while true`):**
   - Befehl:
     `while true; do echo $HOST_NODE $(date) >> /tmp/test-log.txt; sleep 5; done`
   - Log-Nachweis: Drei Zeilen im exakten 5-Sekunden-Takt (`08:56:32`,
     `08:56:37`, `08:56:42`).
   - Befund: Die Shell-Steuerung mit Semikolons (`do ...; sleep 5; done`)
     funktioniert deterministisch.

4. **Aufgabe 4 (YAML-Syntax & Block-Skalar):**
   - Beide formulierten Varianten (Einzeiler-String und mehrzeiliger
     Block-Skalar `|`) sind syntaktisch valides YAML und werden von Kubernetes
     korrekt an `sh -c` übergeben.

---

### CKA Exam Takeaways & Transfer auf Aufgabe Q03

Für die Übernahme in den `producer`-Container aus Q03 sind nur zwei
zielspezifische Anpassungen nötig:

1. **Zielpfad:**
   Statt `/tmp/test-log.txt` schreibt der `producer` in das gemountete
   `emptyDir`-Volume unter `/var/log/app/events.log`.
2. **Kombination mit Downward API:**
   `$HOST_NODE` wird über `spec.containers[*].env` via
   `fieldRef.fieldPath: spec.nodeName` injiziert. Der Container-Code entspricht
   direkt deiner Lösung aus Aufgabe 4:

```yaml
      command: ["/bin/sh", "-c"]
      args:
        - |
          while true; do
            echo "$HOST_NODE $(date)" >> /var/log/app/events.log
            sleep 5
          done
```
