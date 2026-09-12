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

// Where the installer PUTS a file, for the two families whose path changes on the way
// in. Both are segment-wise on purpose: a prefix match would swallow `engine-skillset/`
// and relocate files the installer never moves, and a wrongly relocated file resolves
// its links against a directory that does not exist — a dead link nobody can explain.
//
//   • `engine-skills/<name>/…` → `.claude/skills/<name>/…` (installStagedSkills, ADR 0026:
//     the engine may not write under the sacred skills directory, so it stages beside it).
//   • `templates/<locale>/<rest>` → `<rest>` (overlayLocale drops the locale prefix).
//
// Every other delivered file keeps the path it has here, which is why the default is
// identity rather than a lookup.
export function installedRel(repoRel) {
  const segs = repoRel.split("/");
  if (segs[0] === "engine-skills" && segs.length > 1) return [".claude", "skills", ...segs.slice(1)].join("/");
  if (segs[0] === "templates" && segs.length > 2) return segs.slice(2).join("/");
  return repoRel;
}

// A fenced block is an EXAMPLE, and examples are not links: the delivered README shows
// shell and Markdown snippets, and reading them reports dead links against paths nobody
// ever clicks. An UNTERMINATED fence hides everything after it — the author is mid-example,
// and guessing otherwise is how a checker manufactures noise.
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

function outsideCode(text) {
  const kept = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      continue;
    }
    // Inline code spans are the same argument at sentence scale.
    kept.push(line.replace(/`[^`]*`/g, ""));
  }
  return kept.join("\n");
}

// `[text](target)` and `![alt](target)`, with a bracketed label allowed one level of
// nesting (`[see [x]](y.md)`) and an optional `<…>` target or quoted title, both of
// which real Markdown in this repo uses.
const LINK = /!?\[(?:[^\][]|\[[^\][]*\])*\]\(([^()]*)\)/g;

// Anything a browser or an editor would hand to someone else: a scheme (`https:`,
// `mailto:`, `file:`), a bare anchor, an absolute path. None of them is a file this
// delivery owns, so none of them can be dead in the sense this module measures.
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function markdownLinkTargets(text) {
  const targets = [];
  for (const [, inside] of outsideCode(text).matchAll(LINK)) {
    let target = inside.trim();
    // A quoted title sits after the target, separated by whitespace.
    target = target.replace(/\s+("[^"]*"|'[^']*')\s*$/, "").trim();
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1).trim();
    const path = target.split("#")[0];
    if (!path || path.startsWith("#") || path.startsWith("/") || SCHEME.test(path)) continue;
    targets.push(path);
  }
  return targets;
}

export function resolveDeliveredLink(fileRepoRel, target) {
  if (!target) return null;
  const path = target.split("#")[0];
  if (!path || path.startsWith("/") || SCHEME.test(path)) return null;
  const dir = posix.dirname(installedRel(fileRepoRel));
  // 🛑 A target that climbs OUT of the delivery is returned as it resolves, never
  // swallowed: it is the one link that is certainly broken, and hiding it here would
  // make it the only one nothing can see.
  return posix.normalize(posix.join(dir === "." ? "" : dir, path));
}

export function deadDeliveredLinks({ files, read, isDelivered }) {
  const dead = [];
  for (const file of files) {
    let text;
    try {
      text = read(file);
    } catch (e) {
      // A file that cannot be read must not be the quiet way something leaves the
      // audit: an unreadable delivered file is a finding of its own.
      dead.push({ file, target: null, resolved: null, unreadable: e?.message ?? String(e) });
      continue;
    }
    for (const target of markdownLinkTargets(text)) {
      const resolved = resolveDeliveredLink(file, target);
      if (resolved === null) continue;
      if (!isDelivered(resolved)) dead.push({ file, target, resolved });
    }
  }
  return dead;
}
