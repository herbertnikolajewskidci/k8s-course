# Issue Tracker: GitHub

Learning modules, lab tasks, speed drills, and troubleshooting scenarios
for this CKA preparation live as GitHub issues. Use the `gh` CLI for all
operations.

## Conventions

- **Create a learning issue**:
  `gh issue create --title "<Topic>: <Task>" --body "..." --label "..."`
- **View an issue**:
  `gh issue view <number> --comments`
- **List active learning issues**:
  `gh issue list --state open --label "status:in-progress"`
- **Transition status**:
  - Start learning:
    `gh issue edit <number> --remove-label "status:backlog" --add-label "status:in-progress"`
  - Mastered / Done:
    `gh issue edit <number> --remove-label "status:in-progress" --add-label "status:mastered"`
    and `gh issue close <number> --comment "Mastered on <date>."`
- **Comment / Record Feedback**:
  `gh issue comment <number> --body "..."`

## Pull Requests as a Triage Surface

**PRs as a request surface: no.**
