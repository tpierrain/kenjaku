// ═══════════════════════════════════════════════════════════════════════════
// delivered-links.mjs — a link in delivered prose is judged from where the file
// will be INSTALLED, never from where it sits in this repo (#78).
//
// The field failure, and it has two halves. `README.md` is copied into every brain
// and links a dozen times into `maintainers/` — a folder no brain ever receives, so
// an owner following one of those links from inside their own brain lands nowhere.
// A probe found ~24 such candidates across 41 delivered files and **could not tell a
// real dead link from a false alarm**, because some files move on their way in:
// `engine-skills/<name>/SKILL.md` is installed at `.claude/skills/<name>/`, so
// `../sync-sources/SKILL.md` is CORRECT in a brain and broken in the launcher tree.
// A checker that resolves from the repo path therefore reports the correct links and
// has nothing left to say about the broken ones.
//
// So the whole module is about one question: **what path will this file occupy when
// the owner reads it?** Resolve from there and the two classes separate on their own.
//
// Pure: no I/O. The delivered set and the file contents are supplied by the caller,
// which is what lets the guard measure the real repo and the unit tests measure
// invented trees.
// ═══════════════════════════════════════════════════════════════════════════
import { posix } from "node:path";

export function installedRel(_repoRel) {
  return "";
}

export function markdownLinkTargets(_text) {
  return [];
}

export function resolveDeliveredLink(_fileRepoRel, _target) {
  return null;
}

export function deadDeliveredLinks(_args) {
  return [];
}
