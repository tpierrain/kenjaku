// ─────────────────────────────────────────────────────────────────────────────
// vault-write-guard.mjs — refuse to WRITE a vault note the indexer would refuse
// to READ (F11/F12).
//
// The failure this ends: a note is written with frontmatter the engine's YAML
// parser rejects, it is committed like any other, and it is simply never indexed
// — invisible to every search, for as long as it exists. The counter reported it
// as "pending", i.e. as a wait, and nothing ever recovered it. Reporting it
// honestly (see rag-status.mjs) is half the fix; the other half is not letting
// the note be born broken.
//
// F16 is the design constraint: this guard runs the ENGINE'S OWN parsing path
// (gray-matter + js-yaml 4's `load`, exactly as rag/src/lib/frontmatter-parser.ts
// composes them), resolved from the engine's own node_modules. A checker that
// parses differently from the engine measures a fiction.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { join, relative, sep } from "node:path";

/**
 * The engine's parse function, resolved from the engine's own dependencies, or
 * `null` when they cannot be loaded (a clone nobody rehydrated yet). Null means
 * "we cannot judge" — and the caller must then let the write through: an
 * unverifiable note is not a broken one (unknown ≠ broken).
 */
export function engineParser({ brainDir }) {
  try {
    const require = createRequire(join(brainDir, "rag", "package.json"));
    const matter = require("gray-matter");
    const { load } = require("js-yaml");
    // The same composition as frontmatter-parser.ts: gray-matter 4.x defaults to
    // js-yaml 3's removed `safeLoad`, so the yaml engine is forced onto `load`.
    return (raw) => matter(raw, { engines: { yaml: (input) => load(input) } });
  } catch {
    return null;
  }
}

/**
 * The duplicated top-level frontmatter key, with both line numbers, or `null`.
 *
 * js-yaml says "duplicated mapping key (5:1)", which names neither the key nor the
 * way out. The engine upgrades that message when it READS such a note
 * (frontmatter-parser.ts `findDuplicateKey`), and the upgrade is worth more here,
 * where the note can still be fixed before it exists.
 *
 * The same question is now asked in three places (here, the engine, and
 * `duplicateFrontmatterKeys` in note-refresh.mjs), across two packages that cannot
 * import each other. The character class is therefore identical on purpose — a looser
 * "anything up to a colon" swallows unindented list items whose value holds a colon
 * (`- https://a.com`) and invents a key — and the agreement is pinned by a test rather
 * than by a comment.
 */
export function duplicateKeyDetail(raw) {
  const lines = raw.split("\n");
  if (lines[0].trim() !== "---") return null;
  const seenAtLine = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") break;
    const key = lines[i].match(/^([A-Za-z0-9_-]+):/)?.[1];
    if (key === undefined) continue;
    const first = seenAtLine.get(key);
    if (first !== undefined) return { key, first, second: i + 1 };
    seenAtLine.set(key, i + 1);
  }
  return null;
}

/**
 * The vault-relative path of a note this tool call would write, or `null` when the
 * call is none of our business (another tool, a file outside `vault/`, a non-note).
 * Only indexed files are guarded: everything else is the owner's to write freely.
 */
export function guardedNotePath({ toolName, filePath, brainDir }) {
  if (toolName !== "Write" && toolName !== "Edit") return null;
  if (typeof filePath !== "string" || !filePath.toLowerCase().endsWith(".md")) return null;
  const rel = relative(brainDir, filePath).split(sep).join("/");
  return rel.startsWith("vault/") ? rel : null;
}

/** Does this note's frontmatter survive the engine's parser? */
export function frontmatterVerdict({ raw, parse }) {
  try {
    parse(raw);
    return { ok: true };
  } catch (err) {
    // Only ever consulted once the parser has ALREADY refused: this upgrades a
    // message, it never adds a verdict of its own.
    const duplicate = duplicateKeyDetail(raw);
    if (duplicate) {
      return {
        ok: false,
        reason:
          `damaged front-matter key "${duplicate.key}": declared twice, on lines ` +
          `${duplicate.first} and ${duplicate.second}. A note can only carry one — ` +
          `the engine's parser refuses the file, so the note would never be indexed.`,
      };
    }
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * The note an Edit WOULD produce, or `null` when it cannot be composed (unreadable
 * file, an anchor that is not there — an edit that will fail on its own anyway).
 * An Edit hands over a fragment, not a file, and judging the fragment would let the
 * exact gesture that damaged the field's note (appending a second `updated:`) walk
 * straight past this guard.
 */
function editedNote({ toolInput, readFile }) {
  const { file_path: filePath, old_string: oldString, new_string: newString, replace_all: replaceAll } = toolInput ?? {};
  if (typeof oldString !== "string" || typeof newString !== "string") return null;
  let current;
  try {
    current = readFile(filePath);
  } catch {
    return null;
  }
  if (!current.includes(oldString)) return null;
  return replaceAll ? current.split(oldString).join(newString) : current.replace(oldString, newString);
}

/**
 * The hook's verdict on one tool call: `{ allow: true }`, or `{ allow: false, reason }`
 * naming the note, the parser's own cause, and the consequence of writing it anyway.
 *
 * FAIL-OPEN everywhere else. This guard sits in front of every write the owner's brain
 * makes, so anything it cannot judge — no parser, an unreadable file — must pass. The
 * only thing it ever refuses is bytes the engine's parser has actually rejected.
 */
export function guardDecision({ toolName, toolInput, brainDir, parse, readFile }) {
  const relPath = guardedNotePath({ toolName, filePath: toolInput?.file_path, brainDir });
  if (relPath === null || parse === null) return { allow: true };

  const raw = toolName === "Write" ? toolInput?.content : editedNote({ toolInput, readFile });
  if (typeof raw !== "string") return { allow: true };

  const verdict = frontmatterVerdict({ raw, parse });
  if (verdict.ok) return { allow: true };

  return {
    allow: false,
    reason:
      `${relPath} — the engine's own YAML parser refuses this note's frontmatter: ` +
      `${verdict.reason} Written as is, the note would be committed like any other and ` +
      `never be indexed: invisible to every search, with nothing to recover it. ` +
      `Fix the frontmatter (quote any value containing ": ") and write again.`,
  };
}
