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
import { join } from "node:path";

import { briefShapeVerdict } from "./brief-shape.mjs";
import { vaultNotePath } from "./vault-paths.mjs";

/**
 * The engine's parse function, resolved from the engine's own dependencies, or
 * `null` when they cannot be loaded (a clone nobody rehydrated yet). Null means
 * "we cannot judge" — and the caller must then let the write through: an
 * unverifiable note is not a broken one (unknown ≠ broken).
 */
/**
 * Where the engine's own dependencies are resolved FROM. Anchoring on the engine's
 * `package.json` starts resolution inside `rag/`, so `rag/node_modules` wins; anchor it
 * one folder up and Node walks the parent chain, where a different gray-matter — or
 * none — may answer. That is the F16 fiction in miniature, and it is invisible from
 * outside the module, so it is named here and asserted.
 */
export function engineRequireAnchor(brainDir) {
  return join(brainDir, "rag", "package.json");
}

export function engineParser({ brainDir }) {
  try {
    const require = createRequire(engineRequireAnchor(brainDir));
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
 * call is none of our business. The IMPLEMENTATION moved to the shared vault-path
 * codec (`vault-paths.mjs`, v5.3 § M2) the day a second consumer appeared: the
 * universe-drift notice asks the very same question of the very same tool call, and
 * two spellings of one question are two behaviours to keep in step for ever.
 *
 * Only the NAME survives here, because this guard's tests and its own reader know
 * it by that name — and `vault-paths.test.mjs` pins the two as the same function
 * rather than as two that happen to agree.
 */
export { vaultNotePath as guardedNotePath };

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
 *
 * Exported for its tests, like every other seam here: each of its three "we cannot
 * compose this" reasons is a separate fail-open path, and reaching them through
 * `guardDecision` alone cannot tell one from another.
 */
export function editedNote({ toolInput, readFile }) {
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
  const relPath = vaultNotePath({ toolName, filePath: toolInput?.file_path, brainDir });
  if (relPath === null || parse === null) return { allow: true };

  const raw = toolName === "Write" ? toolInput?.content : editedNote({ toolInput, readFile });
  if (typeof raw !== "string") return { allow: true };

  const verdict = frontmatterVerdict({ raw, parse });
  if (!verdict.ok) {
    return {
      allow: false,
      reason:
        `${relPath} — the engine's own YAML parser refuses this note's frontmatter: ` +
        `${verdict.reason} Written as is, the note would be committed like any other and ` +
        `never be indexed: invisible to every search, with nothing to recover it. ` +
        `Fix the frontmatter (quote any value containing ": ") and write again.`,
    };
  }

  const shape = briefShapeDecision({ relPath, raw, parse });
  return shape ?? { allow: true };
}

/**
 * The SECOND question this guard asks, and only of a prep (#128): is its first screen
 * the brief? Returns a refusal, or `null` when there is nothing to say — which covers
 * every note that is not prep-shaped, i.e. almost all of them.
 *
 * It runs after the frontmatter verdict and never before: the selector IS the
 * frontmatter (`type:`), so on a note the parser refuses there is nothing to select on
 * — and an unindexable note is the graver of the two failures anyway.
 *
 * 🛑 The refusal BLOCKS, on the owner's call (Q1, 2026-09-14). Chosen over a warning,
 * which is read once and ignored, and in six months the preps are long again — which is
 * exactly the situation that produced this issue. The cost lands on the model that has
 * to rewrite, which is why every message names its rule AND the distance.
 *
 * 🧹 NO FAIL-OPEN OF ITS OWN, deliberately. Its PRECONDITION is that the parser has
 * already accepted these bytes — `frontmatterVerdict` ran two lines up — so a second
 * parse of them cannot throw, and gray-matter always hands back `{ data, content }`.
 * A `try`/`catch` and a chain of `?.` here would be a fail-open written twice: five
 * branches no test can reach, measured as five surviving mutants. The one that catches
 * the genuinely unexpected is the hook's own shell (`runGuard`), which is fail-open by
 * construction and covers every question this guard asks.
 */
export function briefShapeDecision({ relPath, raw, parse }) {
  const { data, content } = parse(raw);
  const verdict = briefShapeVerdict({ content, type: data.type });
  if (verdict.ok) return null;

  return {
    allow: false,
    reason:
      `${relPath} — the first screen of this prep is not the brief yet. ` +
      `${verdict.violations.map((v) => v.message).join(" ")} ` +
      `The note is NOT written: a first screen that does not work alone gets triaged in the room, ` +
      `with the person waiting. Rewrite it to the shape the \`brief-shape\` skill holds, and write again.`,
  };
}
