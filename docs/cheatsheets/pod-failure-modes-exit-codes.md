# Pod-Troubleshooting nach Birkenbihl: Der 4-Akte-Lebenslauf

Dieses Dokument ersetzt unübersichtliche Fehlertabellen durch das **biografische
Lebensphasen-Modell** nach Vera F. Birkenbihl.

Statt dir abstrakte Fehlermeldungen einzeln einzuprägen, fragst du dein Gehirn
nur noch: **„In welchem Lebensabschnitt steckt der Pod gerade fest?“**

---

## Das 2-Sekunden-Weichensystem

Warum man manchmal trotz Crash `describe` statt `logs` braucht:

Ein Prozess kann auf **zwei Arten sterben**:

1. **Suizid von innen (App crasht selbst):** Exception, Syntaxfehler, DB fehlt
   → Die Ursache steht in den **Logs der App** (`kubectl logs -p`).
2. **Mord von außen (K8s/Kernel killt die App):** OOMKilled (137), Liveness (143)
   → Die App weiß gar nicht, was ihr geschah. Das Urteil steht beim
   **Kläger/Mörder (Kubernetes Events / Describe)**.

```text
              [ Was ist der Zustand des Containers? ]
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ NIE GESTARTET ]        [ VON AUSSEN GEKILLT ]     [ VON INNEN GECRASHT ]
(Config/Image/Pending)   (OOMKilled 137 / Liveness) (Exit 1 / Exception)
         │                           │                           │
         ▼                           ▼                           ▼
  Kubelet befragen            Kubelet befragen          Die App befragen
  kubectl describe            kubectl describe          kubectl logs -p
```

---

## Akt 1: Vor der Geburt (Er kann gar nicht erst starten)

*Das mentale Bild: Der Bauplan hat Tippfehler oder die Baustelle ist voll.*

### 1. Der Bauplatz ist voll (`Pending`)

- **Bild:** Kein freier Platz auf der Wiese.
- **Ursache:** Node-Ressourcen voll, Taints blockieren, PVC bindet nicht.
- **Reflex:** `kubectl describe pod <name>`

### 2. Der Koch ohne Zutaten (`CreateContainerConfigError`)

- **Bild:** Der Koch will anfangen, aber die Vorratskammer fehlt komplett.
- **Ursache:** ConfigMap oder Secret existiert nicht oder Key-Name vertippt.
- **Reflex:** `kubectl describe pod <name>` → Name der ConfigMap/Secret prüfen.

### 3. Das Schloss vor dem Lager (`ImagePullBackOff` / `ErrImagePull`)

- **Bild:** Der Lieferant findet die Adresse nicht oder hat keinen Schlüssel.
- **Ursache:** Tippfehler im Image-Namen/Tag oder `imagePullSecrets` fehlt.
- **Reflex:** `kubectl describe pod <name>`

> **Merk-Anker für Akt 1:** **„Kein Container = Keine Logs!“** → Immer
> `kubectl describe pod`.

---

## Akt 2: Der Kreißsaal (Die Vorbereitung stockt)

*Das mentale Bild: Der Bauarbeiter wartet ewig, bis das Fundament trocken ist.*

### Die Warteschleife (`Init:0/1` oder `Init:CrashLoopBackOff`)

- **Bild:** Der Türsteher lässt die Hauptanwendung nicht in den Club.
- **Ursache:** Der Init-Container wartet vergeblich auf DB/Service oder crasht.
- **Reflex:** `kubectl logs <pod> -c <init-container-name>`

> **Merk-Anker für Akt 2:** **„-c rettet Leben!“** → Init-Container haben
> eigene Logs.

---

## Akt 3: Im laufenden Leben (Er lebt, kollabiert aber)

*Das mentale Bild: Der Wachmann zieht den Stecker, weil niemand winkt.*

### 1. Der erstickte Herzkranz (`Running`, aber Restarts steigen stetig)

- **Bild:** Der Pod läuft, aber der Prüfer meldet: „Reagiert nicht mehr!“
- **Ursache:** **Liveness-Probe schlägt fehl** (Pfad falsch wie `/healthz` vs
  `/`, Port falsch, Timeout zu knapp). Kubelet killt und startet ihn neu.
- **Reflex:** `kubectl describe pod <name>` → Events prüfen!

### 2. Der Maulkorb (`Running`, aber `Ready: 0/1`)

- **Bild:** Der Pod atmet, darf aber noch keine Kunden bedienen.
- **Ursache:** **Readiness-Probe schlägt fehl** (App wärmt noch auf oder DB
  hängt). Service leitet keinen Traffic weiter.
- **Reflex:** `kubectl describe pod <name>` → Readiness-Events.

---

## Akt 4: Der Obduktionsbericht (Die 3 Exit-Archetypen)

*Das mentale Bild: Die Gerichtsmedizin. Wie genau ist der Container gestorben?*

```text
                 [ WIE STARB DER CONTAINER? ]
                 (kubectl describe -> Last State)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   [ EXIT 137 ]             [ EXIT 0 ]             [ EXIT 1 / 255 ]
 "Der Rausschmeißer"     "Die Frührente"          "Der Bauchklatscher"
 (OOMKilled / SIGKILL)  (Job beendet / Endloss)   (Syntax / App-Crash)
```

### 1. Exit 137: Der Rausschmeißer (OOMKilled = 128 + 9)

- **Bild:** Die Zwangsjacke. Er hat mehr gefressen, als er durfte.
- **Ursache:** Memory-Limit überschritten. Linux Kernel OOM-Killer killt ihn.
- **Reflex:** `kubectl describe pod` → `Reason: OOMKilled` → Limit im YAML
  erhöhen.

### 2. Exit 0: Die Frührente (CrashLoopBackOff trotz Erfolg)

- **Bild:** Der Läufer geht nach 10 Metern ins Ziel und schläft ein.
- **Ursache:** Der Container hatte keinen dauerhaften Vordergrundprozess
  (z. B. ein einfaches Skript, das fertig wurde). Kubernetes startet ihn neu.
- **Reflex:** `command:` / `args:` im YAML prüfen (braucht z. B. `sleep infinity`
  oder Webserver im Vordergrund).

### 3. Exit 1 / 255: Der Bauchklatscher (App-Crash)

- **Bild:** Stolpern über ein Hindernis im Skript.
- **Ursache:** Syntaxfehler, unbehandelte Exception, fehlende Datei.
- **Reflex:** `kubectl logs <pod> --previous` (Log der Leiche ansehen!).

---

## Der 6-Zeilen CKA-Speed-Drill (Reiz-Reaktions-Schema)

```text
[ SYMPTOM ]                              [ SOFORT-REFLEX ]
Pending / ConfigError / ImagePull     ──► kubectl describe pod <name>
Running, aber Restarts steigen stetig ──► kubectl describe pod <name> (Liveness)
Init-Hänger (Init:0/1)                ──► kubectl logs <pod> -c <init-name>
CrashLoopBackOff (Exit 1 / 255)       ──► kubectl logs <pod> --previous
Exit 137 im Describe (OOMKilled)      ──► Memory-Limits im YAML erhöhen
Exit 0 im CrashLoop                   ──► Command prüfen (Vordergrund-Daemon)
```
