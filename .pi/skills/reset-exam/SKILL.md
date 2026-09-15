---
name: reset-exam
description: Execute a one-shot deterministic reset of all 6 KVM exam clusters, purge all student solution files under /course/, reset drill flags on port 8091, and run the self-audit.
---

# Deterministic Exam Reset

Use this skill whenever Herbert asks to reset the exam environment, start over,
or restore all 17 scenarios to their pristine unsolved state (e.g. via
`/reset-exam` or saying *"setz alles zurück"*).

## Mandatory Execution Rule (Single Tool Call)

**STRICT PROHIBITION:** Do NOT perform manual SSH exploratory queries, file
existence checks, or piecemeal `kubectl` commands.

**MANDATORY ACTION:** Execute the centralized reset script in **exactly one**
bash tool call from the repository root:

```bash
./exam-pool/reset-exam.sh
```

## What the Script Does Deterministically

1. Atomically resets student drill flags via HTTPS
   `https://192.168.131.223:8091/api/drill-flags/reset`.
2. Simultaneously wipes student solution files in `/course/` across all 6
   clusters (`cka6016`, `cka2560`, `cka5248`, `cka3200`, `cka8448`, `cka1024`).
3. Restores initial broken states (Q1 ConfigMap, Q6 Kubelet corruption on
   `cka1024`, Q11 PV Retain Released state, Q16 taints/pending pods).
4. Runs an automated built-in self-audit verifying that `/course/` is clean,
   0 drill flags remain, and Kubelet is in a failed state for Q6.

## Report Result to Herbert

Output the final execution banner directly to Herbert in German:
`=== [SUCCESS] Deterministic Reset Complete & Verified in Xs! ===`
Confirm that all 6 clusters and student files are in pristine start state.
