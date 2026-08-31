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

## Local Environment & Architecture (Apple Silicon / ARM64)

Herbert trains locally on **macOS Apple Silicon (ARM64)**:

- **Legacy Image Incompatibility:** Never enforce or prescribe legacy images
  that crash on ARM64 (e.g. `busybox:1.28` causes `SIGSEGV` on macOS).
- **ARM64-Safe Debug Images:** Always use or suggest `curlimages/curl`,
  `busybox:latest`, `registry.k8s.io/busybox:1.27.2`, or `nicolaka/netshoot`.
- **Exam vs. Local Context:** Whenever an exam-standard image (like
  `busybox:1.28` from official docs) is mentioned, explicitly annotate that
  for local macOS testing an ARM64-compatible image should be used.

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
