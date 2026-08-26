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

## Branching & Tagging Strategy

Each learning day operates on its own dedicated feature branch and gets tagged
upon completion:

- **Branch naming**: `day-01-workloads-scheduling`,
  `day-02-services-networking`, etc.
- **Milestone Tags**: `v-day-01-complete`, `v-day-02-complete`, etc.
- **Workflow**:
  1. Work and commit on the current day's branch.
  2. Merge via PR or rebase into `main` at the end of the day.
  3. Create an annotated Git tag for the completed milestone.

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
