# QA campaigns

Hands-on, manual QA passes run on a real machine, one file per release. Each campaign is a
checkbox protocol + a **Findings** section; the fixes it triggers live as action plans under
`maintainers/plans/` (a finding points to its plan, the plan back-references the finding).

## Guardrails

- 🧪 **Throwaway brain only.** Never QA against a real vault. Keep a frozen golden master
  (`~/legacy-brain.tgz`) and restore it to the **same path** between campaigns (so the baked
  absolute paths in `.mcp.json` / `.claude/settings.json` stay valid — no rewrite needed).
- 🔒 **No confidential data in committed files.** Real source names (teamspaces, people) and real
  external content must never land in a tracked file. Write findings in the abstract. Raw feedback
  dumps that may contain such data go under `_private/` (gitignored), never committed.
- ☑️ **Checkbox convention.** Every step and sub-step is a `- [ ]` / `- [x]` so progress is
  trackable straight from the Markdown.

## Index

- [`qa-v3.2.0.md`](qa-v3.2.0.md) — post-v3.2.0 release campaign (upgrade path from a v3.1.0 brain).
- [`field-rehearsal/`](field-rehearsal/README.md) — **run before every release that changes the
  update path.** One command per brain: it drives the release with the engine that brain *already
  has*, which is the one thing the automated suites structurally cannot observe (they all call
  HEAD's code). It is what caught the v5 first-update defect.

## `_private/` (gitignored)

Local-only feedback dumps from earlier QA rounds that contain confidential source data. Kept on
disk for reference, **never committed**.
