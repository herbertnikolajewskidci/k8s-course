---
name: cka-lab-sheet
description: Erstellt und pflegt standardisierte CKA-Lab-Arbeitsblätter nach der Birkenbihl-Methode für dieses Repository mit spoilerfreier Aufgabenstellung, Spickzettel am Ende und In-File-Review.
---

# CKA Lab Sheet Generator & Standard

Dieser Skill definiert den verbindlichen Standard für alle interaktiven
Lab-Arbeitsblätter (`labs/XX-*/Aufgabe-Y.md`) in diesem Repository.

## Pädagogische Prinzipien (Vera F. Birkenbihl & CKA Exam)

1. **Wissensnetz zuerst:** Das mentale Modell aktiviert bestehende Synapsen
   (Analogien, Paketflüsse, Protokoll-Logik), bevor Befehle getippt werden.
2. **Keine Lösungs-Spoiler vor der Aufgabe:** Die Aufgabenstellung kommt direkt
   nach dem Wissensnetz. Vorgefertigte `kubectl`-Einzeiler dürfen niemals vor
   der Aufgabe stehen, um den Denk- und Lerntransfer nicht zu untergraben.
3. **Spickzettel & Doku-Hilfen ans Ende:** Keywords für `kubernetes.io` und
   `kubectl explain`-Pfade stehen als optionale Hilfestellung *unter* den
   Aufgaben und enthalten keine fertigen Lösungen.
4. **Ball-im-Tor-Effekt (In-File-Review):** Nach der Bearbeitung durch Herbert
   wird das Feedback inklusive Fehleranalyse und CKA-Prüfungs-Takeaways direkt
   in denselben Arbeitsbogen unter `## 5. Feedback & Korrekturen` geschrieben.

---

## Standard-Struktur eines Arbeitsblatts (`Aufgabe-X.md`)

Jede `Aufgabe-X.md` muss exakt folgenden 5 Abschnitten folgen:

````markdown
# Aufgabe X: <Thema>

- **CKA Domäne:** <Domäne> (<Prozent>%)
- **Lernberg-Stufe:** Tal → Hang (oder Hang → Gipfel)
- **Issue:** #<Nummer>
- **Entspricht:** Block <X> aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

<Kurze bildhafte Erklärung / KaWa / Analogie. Keine Befehlslösungen!>

---

## 2. Aufgabenstellung (Block X)

Namespace für diesen Block: `<ns>`.

### Aufgabe X.1: <Titel>

1. <Schritt 1>
2. <Schritt 2>
3. <Schritt 3>

### Aufgabe X.2: <Titel>
...

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung X.1

```bash
# Deine Befehle / Notizen
```

### Lösung X.2

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `<keyword1>`, `<keyword2>`
- **In-Terminal Syntax:**
  - `kubectl explain <resource>.spec`
  - `kubectl explain <resource>.spec.<field>`
- **CLI-Hilfe:** `kubectl create <resource> --help`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
````

---

## Regeln für die Erstellung & Bearbeitung

1. **Markdown-Linting:** Jede neu erstellte oder bearbeitete Datei **MUSS**
   mit `npx markdownlint-cli <file.md>` geprüft und fehlerfrei formatiert sein.
2. **Pfeil-Syntax:** Verwende das Unicode-Zeichen `→` anstelle von roher
   LaTeX-Syntax (`$\rightarrow$`).
3. **Zeilenlänge:** Maximal 80 Zeichen pro Zeile im Fließtext.
