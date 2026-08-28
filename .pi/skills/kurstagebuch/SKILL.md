---
name: kurstagebuch
description: Generates a ready-to-copy Kurstagebuch summary for Herbert's CKA learning log, formats it for Apple Notes and the course portal (no indentation on bullets), and copies it directly to the macOS clipboard via pbcopy.
---

# Kurstagebuch Generator

Generiert den standardisierten Kurstagebuch-Eintrag für Herbert im exakten
Plain-Text-Format für **Apple Notizen** und das Kursportal und kopiert den Text
direkt in die macOS-Zwischenablage via `pbcopy`.

## Formatierungsregeln für Apple Notizen & Kursportal

1. **Reiner Plain Text:** Keine Markdown-Syntax-Elemente (`**`, `##`, `_`,
   `*kursiv*`, Backticks `` ` `` oder Markdown-Links) im Textkörper.
2. **Aufzählungszeichen:** Verwende das Unicode-Bullet-Zeichen `• ` direkt am
   Zeilenanfang (ohne Einrückung / keine führenden Leerzeichen).
3. **Zwischenablage-Export:** Kopiere den Text immer direkt per `pbcopy` in die
   macOS-Zwischenablage (`cat << 'EOF' | pbcopy ... EOF`).

## Format-Vorlage

```text
Kurs: CKA-Vorbereitung: Selbständige Vorbereitung auf Basis LFS258
Aktivität: CKA Vorbereitung: <Kurztitel der heutigen Aktivitäten & Schwerpunkte>
Anmerkung: 
<Hauptthema> (CKA Vorbereitung):
• <Kategorie 1>: <Details & gelöste Aufgaben>
• <Kategorie 2>: <Details & gelöste Aufgaben>
• <Kategorie 3>: <Details & gelöste Aufgaben>
• Praktische Lab-Übungen & Speed-Drills mit kubectl
```

## Workflow

1. Untersuche den aktuellen Git-Branch, die neu gelösten Labs unter `labs/`,
   Learning Records und Commits der aktuellen Session.
2. Formuliere prägnante, professionelle Stichpunkte ohne Markdown-Steuerzeichen
   und ohne Einrückung.
3. Führe den `pbcopy`-Befehl aus, um den fertigen Text direkt in die
   macOS-Zwischenablage zu legen.
4. Gib Herbert eine kurze Erfolgsmeldung, dass der Text im Clipboard liegt.
