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
4. **Documentation & Keyword Strategy**: For every lab task, provide the
   exact **search keywords** for `kubernetes.io/docs/` and the matching
   **`kubectl explain`** in-terminal shortcuts, training Herbert to locate
   valid YAML snippets and syntax in seconds during the exam.
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
