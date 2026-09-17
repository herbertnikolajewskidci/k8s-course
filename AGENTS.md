# AGENTS.md

## Agent Role & Learning Philosophy

This repository serves as a personalized, intensive CKA (Certified Kubernetes
Administrator) training environment for Herbert.

All tutoring and agent actions adhere to the **teach-b / Vera F. Birkenbihl
learning methodology**:

1. **Wissensnetz first**: Always activate existing knowledge (via KaWa,
   analogies, or quick recall) before introducing new concepts.
2. **Lernberg staging**: Transition smoothly from Tal (concepts & mental models)
   to Hang (hands-on standard tasks) to Gipfel (exam-paced troubleshooting &
   speed drills).
3. **Ball-im-Tor effect & In-File Reviews**: Immediate, practical feedback for
   every lab exercise. Whenever Herbert saves task answers or manifests in a
   file under `labs/`, the agent **MUST append the detailed corrections,
   explanations, and exam takeaways directly into that same file** under a
   `## Feedback & Korrekturen` section.
4. **Documentation & Keyword Strategy (Docs & In-Page Search Standard):**
   Für jedes Lab und jedes Review **MUSS** eine präzise, live-verifizierte
   Schritt-für-Schritt-Anleitung zur Doku-Navigation bereitgestellt werden:
   - **Docs-Suchfeld:** Exakter Suchstring für `kubernetes.io/docs/`.
   - **Zielseite & Klickpfad:** Konkrete Unterseite/URL im Doku-Baum.
   - **In-Page Suche (`Strg+F` / `Cmd+F`):** Die exakten 1 bis 2 Schlüsselwörter,
     die man im Browser tippen muss, um ohne Scrollen direkt an der
     Definitionszeile oder dem YAML-Snippet zu landen.
   - **In-Terminal Fastpath (`kubectl explain` / `--help`):** Die minimalen
     CLI-Befehle, um die Syntax komplett offline und ohne Browser zu ermitteln.
5. **No Copyright Infringement**: Never commit or extract verbatim copyrighted
   book text or course files into this repository. All materials must be
   original summaries, mental models, YAML manifests, lab steps, and personal
   learning records.

- **Separation of Tasks and Solutions:** Aufgabenstellungen verbleiben in
  `Aufgabe-X.md`. Notizen, Befehle und Lösungen von Herbert werden in einer
  separaten Datei `Aufgabe-X-solution.md` geführt. Der Agent darf
  `Aufgabe-X-solution.md` niemals überschreiben oder ungefragt editieren,
  sondern nur für Reviews lesen und das Feedback anschließend in `Aufgabe-X.md`
  oder als separaten Review-Abschnitt dokumentieren.
- **Up-to-Date Standards (etcdutl vs. etcdctl):** Dokumentiere und unterrichte
  immer den aktuellen offiziellen Kubernetes-Standard. Für etcd-Restores
  explizit `etcdutl snapshot restore` als primären Standard vor `etcdctl`
  (deprecated) führen.

## Session Startup Protocol (Autonomous Context Recovery)

At the beginning of **EVERY new chat session or when Herbert enters**, the
agent **MUST automatically**:

1. Check current git branch and status (`git branch --show-current`,
   `git status`).
2. Query open learning issues via GitHub CLI (`gh issue list --state open`).
3. Read the latest learning record under `learning-records/`.
4. Greet Herbert by directly stating the active issue, the current learning
   branch, and the immediate next task/lab file without asking for context.
5. Check exam simulation readiness: Always recognize the deterministic exam
   reset script `exam-pool/reset-exam.sh` (deployed inside the Webtop desktop as
   `/usr/local/bin/reset-exam`). When Herbert requests an exam reset ("setz
   alles zurück", "reset", "von vorne anfangen"), the agent MUST strictly and
   exclusively execute `./exam-pool/reset-exam.sh` in a single tool call.
   Exploratory manual SSH inspections or piecemeal deletions are strictly
   forbidden.

## Branching & Tagging Strategy

Each CKA domain operates on its own dedicated feature branch and gets tagged
upon completion:

- **Branch naming**:
  - `domain-01-workloads-scheduling`
  - `domain-02-services-networking`
  - `domain-03-storage`
  - `domain-04-cluster-architecture`
  - `domain-05-troubleshooting`
- **Milestone Tags**: `v-domain-01-complete`, `v-domain-02-complete`,
  `v-domain-03-complete`, etc.
- **Workflow**:
  1. Work and commit on the active domain branch.
  2. Merge into `main` upon domain completion.
  3. Create an annotated Git tag for the completed domain milestone.

## Local Environment & Architecture (Apple Silicon / ARM64 / LazyVim)

Herbert trains locally on **macOS Apple Silicon (ARM64)** and uses
**Neovim / LazyVim** as his terminal editor:

- **No LaTeX Syntax in Markdown:** Never use LaTeX formatting like
  `$\rightarrow$` or math blocks `$$...$$`. Always use plain Unicode
  characters (e.g. `→`) or standard plain text (`->`) so that LazyVim/Neovim
  and terminal viewers render it cleanly without raw syntax clutter.
- **Legacy Image Incompatibility:** Never enforce or prescribe legacy images
  that crash on ARM64 (e.g. `busybox:1.28` causes `SIGSEGV` on macOS).
- **ARM64-Safe Debug Images:** Always use or suggest `curlimages/curl`,
  `busybox:latest`, `registry.k8s.io/busybox:1.27.2`, or `nicolaka/netshoot`.
- **Exam vs. Local Context:** Whenever an exam-standard image (like
  `busybox:1.28` from official docs) is mentioned, explicitly annotate that
  for local macOS testing an ARM64-compatible image should be used.

## Lab Design & CKA Focus (No Linux-Trivial Traps)

Labs must test **Kubernetes competencies**, not obscure Linux shell quirks:

- **Pragmatic Linux Foundations:** Standard Linux commands (`cat`, `ls`, `grep`,
  `curl`, `nc`, `systemctl`, `journalctl`) are an essential part of the CKA
  exam and learning path. They should be used naturally and purposefully, but
  never turn into obscure edge-case debugging puzzles (like CRI stream line-buffering).
- **Clean Output & Flush (Newline / Line-Buffering):** When containers run
  shell commands with `cat` or continuous output before a long `sleep`, always
  ensure proper newlines (e.g. `echo` or proper line flush). Never create
  situations where correct Kubernetes manifests fail to show expected logs
  solely due to containerd/CRI line-buffering.
- **Focus on CKA Patterns:** Tasks must be intuitive and testable directly via
  standard `kubectl` and node-level CLI commands without requiring deep-dive
  OS-level debugging (like stream buffering or xxd hex inspection).
- **Event-Forensik & Fehlermeldungs-Didaktik (Verbindlicher Standard):**
  Bei allen Aufgaben, in denen Pods/Workloads im Zustand `Pending`, `CrashLoop`
  oder `Error` sind, gilt oberste Priorität:
  1. **Kein blindes Raten oder Cluster-Scannen:** Zuerst gezielt die Events
     des betroffenen Objekts extrahieren (`describe ... | tail -n 15` oder
     `kubectl get events --field-selector ...`).
  2. **Wort-für-Wort-Dekodierung:** Fehlermeldungen nicht als „Wall of Text“
     übergehen, sondern das Subjekt und die Schlüsselwörter (z. B. `Pod's`
     vs. `PersistentVolume's`, `free ports`, `unschedulable`) gemeinsam
     zeilenweise analysieren und die genaue Bedeutung transparent machen,
     bevor Lösungsschritte ausgeführt werden.

## Daily 2-Hour Exam Simulator Routine (Custom CKA Exam Lab)

Als strategischer Anker für die Retake-Vorbereitung verfügt Herbert über eine
eigene, integrierte CKA-Prüfungssimulation im Repository:

- **Feste Morgen-Routine:** Jeden Morgen startet der Tag idealerweise mit einem
  fokussierten **2-Stunden-Simulationsblock** unter Realbedingungen (PSI-Taktung,
  Zeitmanagement, 2-Minuten-Flag-Regel).
- **Ziel des täglichen Drills:** Prüfungsresistenz, CLI-Fluency und instinktive
  Nutzung der verifizierten Doku-/Explain-Suchpfade festigen, bis der Ablauf
  automatisiert sitzt.
- **Rolle des Agenten:** Bereitstellung, Reset und Auswertung der täglichen
  Exam-Szenarien ohne Reibungsverluste.
- **Student Drill-Flagging ("Nochmal üben" / 🎯):**
  Herbert kann während der Bearbeitung im Portal Aufgaben mit dem Button
  `🎯 Nochmal üben` vormerken, die er unabhängig vom Bestehen gezielt
  vertiefen oder repetieren möchte. Diese Flags werden automatisch im Portal
  und über die API (`/api/drill-flags`) persistiert.
- **Automatisierte Lösungsprüfung & Auswertungs-Protokoll (`verify-all-17.sh`):**
  Wenn Herbert meldet: *„Hey, ich bin jetzt durch, schau dir bitte die Lösungen
  an von dieser Session“* (oder sinngemäß), führt der Agent SOFORT:
  1. `./exam-pool/verify-all-17.sh` aus (prüft alle 6 Cluster in unter 5 Sekunden
     parallel und liest die aktiven Drill-Flags aus `/api/drill-flags`).
  2. Wertet die Ergebnisse aus `/tmp/exam-verification-results.json` aus
     (Gesamtscore, Bestanden >= 66%, detaillierte Punktabzüge).
  3. Führt für alle fehlgeschlagenen / unvollständigen Fragen sowie alle
     explizit mit `🎯 Nochmal üben` markierten Aufgaben eine strukturierte
     Event-Forensik & Fehlermeldungs-Didaktik durch.
  4. Generiert automatisch maßgeschneiderte Birkenbihl-Arbeitsblätter nach
     dem Skill-Standard `cka-lab-sheet` unter `labs/07-gipfel-killer-sh/repetition/`
     (Wissensnetz & KaWa -> spoilerfreie Aufgaben -> Spickzettel mit Doku-
     Navigationsankern -> In-File-Review-Vorbereitung).

## Exam Simulator Architecture & Rigorous Difficulty Standards (Mandatory)

### 1. Host- & VM-Architektur (Unraid KVM Standard)

- **Keine Bare-Metal-Verschmutzung auf Unraid:** Weder Kubernetes-Nodes noch
  Prüfungswerkzeuge werden direkt auf dem Unraid-Host-OS installiert.
- **Dedizierte KVM-VMs auf Unraid:** Die gesamte Prüfungsumgebung
  (Split-Screen-Portal, Webtop, Kubeadm-Cluster mit Master- und Worker-Nodes)
  läuft ausschließlich innerhalb dedizierter KVM-Virtual-Machines auf dem
  Unraid-Server (`192.168.131.223`).
- **Deterministic Automated Reset Protocol (`exam-pool/reset-exam.sh`):**
  Whenever Herbert requests a reset or fresh session start, the agent **MUST
  execute `./exam-pool/reset-exam.sh` as a single, standalone tool call**.
  Manual SSH exploratory queries, checking files beforehand, or running
  piecemeal kubectl commands are **strictly prohibited**.
  The script runs in ~13 seconds, parallelizes the wipe across all 6 KVM
  clusters, clears `/course/` on all VMs, resets drill flags on port 8091,
  corrupts Kubelet on `cka1024`, and performs its own automated self-audit.
- **Lokaler Mac/OrbStack-Cluster:** Dient ausschließlich als schneller, lokaler
  Prototyping- und Syntax-Prüfstand, niemals als Ersatz für die vollwertige
  x86_64 KVM-Prüfungsumgebung auf Unraid.
- **Verbindliche SSH-Host-Navigation (Niemals Kubeconfig-Kontext-Wechsel!):**
  Exakt wie im echten CKA-Examen (PSI) und in Killer.sh gilt:
  1. Aufgaben starten **NIEMALS** mit `kubectl config use-context ...`. Es gibt
     keine manuellen Kubeconfig-Kontextwechsel!
  2. Jede Aufgabe beginnt stattdessen mit einer **expliziten SSH-Anweisung**
     auf den jeweiligen Ziel-Host/Node (z. B. `ssh cluster1-controlplane`,
     `ssh cka6016`, `ssh cluster1-node01`).
  3. Der Prüfling sitzt in der Student/Jump-Host-Umgebung (Webtop) und
     schaltet sich vor Beginn der Bearbeitung per SSH auf die für die
     Aufgabe vorgesehene Maschine. Alle weiteren Schritte erfolgen dort.
- **Topology of Authentic Killer.sh Exam Clusters on Unraid (6 Clusters / 7 VMs):**
  To mirror the authentic Killer.sh multi-cluster isolation with 100% hostname
  and node parity, the environment runs on 7 dedicated KVM VMs on Unraid
  (`192.168.131.223`):
  1. **`cka6016` (Cluster 1):** Single-node CP (`192.168.130.212`) for Q1 (DNS),
     Q10 (Storage), Q15 (Drain), Q17 (crictl). SSH: `ssh cka6016`.
  2. **`cka2560` (Cluster 2):** Single-node CP (`192.168.130.213`) for Q2 (Kubeconfig),
     Q7 (Gateway API), Q11 (PV Recovery). SSH: `ssh cka2560`.
  3. **`cka5248` + `cka5248-node1` (Cluster 3 Master + Dedicated Worker):**
     Two-node cluster (`192.168.130.214` & `.215`) for Q3 (Downward API),
     Q9 (Kustomize), Q12 (Secrets). SSH: `ssh cka5248` & `ssh cka5248-node1`.
  4. **`cka3200` (Cluster 4):** Single-node CP (`192.168.130.216`) for Q4 (Probes),
     Q13 (RBAC), Q16 (Pending Pod Forensics). SSH: `ssh cka3200`.
  5. **`cka8448` (Cluster 5):** Single-node CP (`192.168.130.217`) for Q5 (PKI Certs),
     Q8 (NetPol), Q14 (etcd). SSH: `ssh cka8448`.
  6. **`cka1024` (Cluster 6):** Dedicated troubleshooting node (`192.168.130.218`)
     for Q6 (Kubelet Crashloop in `10-kubeadm.conf`). SSH: `ssh cka1024`.

### 2. Referenz-Basis für das Prüfungsniveau (Der Killer.sh-Benchmark)

Alle neu erstellten Exam-Aufgaben und Szenarien müssen sich am nachweisbaren
Schwierigkeitsgrad der Killer.sh-Simulationen messen lassen. Die authentischen
Referenzquellen liegen lokal und ungetrackt unter:

- `docs/exam-references/killer-sh-sim-a/questions-01-17-and-previews.md`
- `docs/exam-references/killer-sh-sim-b/questions-01-17.md`
- `docs/exam-references/score-analysis/killer-sh-sim-a-and-b-gap-analysis.md`

### 3. Verbindliche Qualitäts- und Schwierigkeits-Kriterien (Kein Weichspüler)

Jeder Agent in jedem Chat **MUSS** beim Entwurf von Prüfungsfragen und
Szenarien folgende Prüfkriterien nachweislich erfüllen:

1. **Strikte Multi-Layering-Pflicht (Mindestens 3–4 Teilfallen pro Aufgabe):**
   Aufgaben dürfen niemals triviale Ein-Schritt-Befehle sein. Sie müssen exakt
   wie bei Killer.sh mehrere kombinierte Fallstricke enthalten (z. B. nicht nur
   einen Service erstellen, sondern FQDN-Referenzen über Namespaces hinweg,
   Stateful Pod-Subdomains, IP-Dash-Formate und nachgelagerte Controller-
   Restarts mit Verifikation).
2. **Keine Lösungshinweise im Aufgabentext:**
   Der Fragentext beschreibt ausschließlich den Geschäftszweck, das gewünschte
   Soll-Verhalten oder beobachtbare Fehlersymptome. Es werden keine YAML-
   Snippets, API-Felder oder Teillösungen im Text vorgekaut.
3. **Reale Node- & Systemd-Ebene:**
   Troubleshooting- und Architektur-Aufgaben müssen echte Node-Eingriffe testen:
   Kubelet Drop-In Units (`/etc/systemd/system/kubelet.service.d/`), echte
   OpenSSL-Dateipfade (`/var/lib/kubelet/pki/`), Static-Pod-Manifeste
   (`/etc/kubernetes/manifests/`) und Snapshot-Restores mit `etcdutl`.
4. **Vollständige Parität zu Killer.sh Subtasks:**
   Für jede Aufgabe muss im Vorfeld dargelegt werden, welchen Teilaspekten
   aus Simulation A oder B sie strukturell entspricht.
5. **In-Cluster Validation & Task Solvability Guarantee (Inviolable):**
   No lab or exam task may ever be presented to Herbert as ready until the
   agent has executed the exact instructions in the live cluster, confirmed that
   the manifest/commands solve the task with 100% PASS in the verification engine,
   and subsequently reset the cluster back to the clean initial state. Every
   field, label, namespace, and parameter in the task description must match
   cluster reality 1:1 without logical discrepancies.
6. **Copyright-Schutz:**
   Verbindliche Einhaltung eigener Bezeichner, Namespaces, CIDRs und
   Geschichten. Die strukturelle Denk- und Falltiefe bleibt 1:1 erhalten, der
   Wortlaut ist ein originäres Werk.

## Agent Skills

### Issue tracker

CKA Learning & Lab Tracker managed via GitHub Issues (`gh`).
See `docs/agents/issue-tracker.md`.

### Triage labels

Custom CKA learning vocabulary (Status, Lernberg level, Type, CKA Domains).
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context Kubernetes Wissensnetz glossary and architectural decisions.
See `docs/agents/domain.md`.

### CKA Exam Review (`/cka-exam-review`)

Automated evaluation of the 17-question morning routine across all 6 KVM
clusters, drill-flag inspection, and zero-prompting Birkenbihl repetition lab
sheet generator.
See `.pi/skills/cka-exam-review/SKILL.md`.

### Reset Exam (`/reset-exam`)

One-shot deterministic reset of all 6 KVM clusters, student solution files
in `/course/`, drill flags on port 8091, and automated self-audit.
See `.pi/skills/reset-exam/SKILL.md`.
