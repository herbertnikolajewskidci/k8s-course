---
name: cka-exam-review
description: Automatically evaluates Herbert's CKA morning exam simulation across all 6 clusters, inspects drill flags, outputs forensic scorecards, and autonomously creates targeted Birkenbihl repetition lab sheets.
---

# CKA Exam Simulation Review & Repetition Generator

Use this skill when Herbert requests a review of his morning 17-question exam
simulation (e.g. via `/cka-exam-review`, or stating *"schau dir bitte die
Lösungen an von dieser Session"*).

## Operational Workflow (Fully Autonomous)

Follow this 5-stage procedure sequentially without intermediate prompting:

```text
[1. Verify Clusters]
  ➔ [2. Parse Gaps & Drill Flags]
  ➔ [3. Output Scorecard & Forensics]
  ➔ [4. Generate Birkenbihl Labs]
  ➔ [5. Present Ready Links]
```

---

## Step 1: Execute Cluster Verification

Execute the central automated multi-cluster verification script from the
repository root:

```bash
./exam-pool/verify-all-17.sh
```

This concurrently audits all 6 KVM clusters on Unraid in under 5 seconds,
interrogates the active student drill flags from
`https://192.168.131.223:8091/api/drill-flags`, and produces the structured
result JSON at `/tmp/exam-verification-results.json`.

Read and parse `/tmp/exam-verification-results.json` using the `read` tool:

- `totalScore` vs `maxScore` (percentage)
- `passed` (threshold: >= 66.0%)
- `drillFlaggedQuestions`: Array of question IDs Herbert marked with
  `🎯 Nochmal üben`.
- `failedOrPartialQuestions`: Array of question IDs where `score < weight`.
- `agendaForPractice`: Union of both lists requiring practice sheets.

---

## Step 2: Present Forensic Scorecard to Herbert (in German)

Output a clean, technical overview directly in the chat:

1. **Summary Banner:** Total score, percentage, exam result (Bestanden / Nicht
   bestanden), and execution duration.
2. **Table Overview:**
   - Columns: `Frage`, `Thema`, `Cluster`, `Punkte`, `Status`, `Drill-Flag`.
3. **Event-Forensik & Fehlermeldungs-Didaktik:**
   For every question in `agendaForPractice`:
   - Quote and decode the exact cluster failure reason / error output.
   - Explain the underlying Kubernetes mechanism (why it failed).
   - Provide the exact Doku Fastpath on `kubernetes.io/docs/` (search term +
     target page) and CLI Fastpath (`kubectl explain ...`).

---

## Step 3: Autonomously Generate Birkenbihl Lab Sheets

For each question in `agendaForPractice`, generate a dedicated lab sheet
strictly adhering to the `cka-lab-sheet` skill standard.

### Directory Convention

Create files under a dated session directory to preserve historical progress:

```text
labs/07-gipfel-killer-sh/repetition/YYYY-MM-DD/
├── Aufgabe-Q<id>-<slug>.md
└── Aufgabe-Q<id>-<slug>-solution.md
```

Where `YYYY-MM-DD` is today's date (e.g. `2026-09-15`).

### Lab Sheet Structure (`Aufgabe-Q<id>-<slug>.md`)

Every generated file **MUST** contain these exact 5 sections:

````markdown
# Aufgabe Q<id>: <Titel>

- **CKA Domäne:** <Domäne> (<Prozent>%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh <hostname>`
- **Wiederholungs-Grund:** <"Explizit vorgemerkt" oder "Fehlversuch in Exam">

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

<Bildhafte Analogie oder KaWa zur Verankerung. Keine Befehlslösungen!>

---

## 2. Aufgabenstellung (Repetition Q<id>)

Host für diese Aufgabe: `ssh <hostname>`.

### Aufgabe 1: <Konkreter Schritt>

...

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `<suchbegriff>`
- **Zielseite & Klickpfad:** `<url-pfad>`
- **In-Page Suche (Strg+F):** `<1-2 schlüsselwörter>`
- **In-Terminal Fastpath:**
  - `kubectl explain <ressource>.spec...`
  - `kubectl <action> --help`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
````

Companion file `Aufgabe-Q<id>-<slug>-solution.md` is initialized empty:

```markdown
# Lösung & Notizen: Aufgabe Q<id> (<Titel>)

## Notizen & Befehle
```

---

## Step 4: Validate Markdown & Provide Ready Links

1. Run `npx markdownlint-cli "labs/07-gipfel-killer-sh/repetition/YYYY-MM-DD/*.md"`
   and fix any formatting warnings immediately.
2. Verify zero raw LaTeX syntax (`$\rightarrow$` etc.) is present.
3. Present the list of newly generated lab sheet paths clearly to Herbert
   so he can jump straight into training.
