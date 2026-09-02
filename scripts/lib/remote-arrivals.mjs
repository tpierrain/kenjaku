// ─────────────────────────────────────────────────────────────────────────────
// remote-arrivals.mjs — the trace the live sync leaves behind, and the DIRECTIVE
// the brain reads at the next message (plan #84, step 4).
//
// The tick pulls silently, in the background, and then has no voice: the search
// server cannot speak into a conversation, and the `FileChanged` event turned out
// to run code without being able to tell anyone anything (POC 0.2). So the words
// wait here, on disk, until the owner types their next message — at which point the
// `UserPromptSubmit` hook picks them up.
//
// Two rules shape everything below:
//
//   • THE DIRECTIVE ADDRESSES CLAUDE, NEVER THE HUMAN. It says what arrived and
//     what to do about it; the sentence the owner reads is Claude's own, in the
//     owner's language, in the flow of the answer. A hook that wrote the human's
//     sentence would speak English into a French conversation and say it in
//     exactly the same words every single time.
//   • NOTHING TO SAY → NOTHING EMITTED. A trace already announced, or an empty
//     one, adds not a single character to the prompt. A brain that announced
//     "nothing new" every 90 seconds would teach its owner to stop reading it.
//
// Pure, bar the trace's own read/write, which is here because two callers need it
// (the tick writes, the hook reads and stamps) and neither may import the other:
// two top-level scripts importing each other is the cross-version trap.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { agreeing, countOf } from "./plural.mjs";
import { TRACE_REL } from "./remote-sync.mjs";

/** Where the staging copy of the atomic rename lives (gitignored, and off the brain root). */
export const CACHE_DIR = ".cache";

/**
 * The budget for one directive. It rides in front of a prompt the owner is waiting on, so
 * what gets cut when it overflows is the LIST of files — never the instruction, which is
 * the only part that changes what Claude does.
 */
export const DIRECTIVE_MAX = 360;

/** How many paths are named before the rest become a count. */
const NAMED_AT_MOST = 3;

/**
 * A note is Markdown INSIDE the vault, and nothing else. A pull can carry engine files, and
 * a vault can carry an image pasted into a note — calling either one a "note" is a confident
 * falsehood about something the owner cannot re-read. Exported because the banner
 * ({@link ./os-banner.mjs}) has to draw the same line, and two copies of one predicate are
 * two chances to drift.
 */
export const isNote = (rel) => rel.startsWith("vault/") && rel.toLowerCase().endsWith(".md");

/** `vault/people/claire.md` → `people/claire.md`: the prefix means nothing to the owner. */
const readable = (rel) => (rel.startsWith("vault/") ? rel.slice("vault/".length) : rel);

/**
 * "Claire", "Claire and Paul", "Claire, Paul and Ana" — never a trailing comma, and never a
 * roll-call: past {@link NAMED_AT_MOST} the names become a count, because a directive that
 * lists fifteen people has stopped being a directive.
 */
export function joinNames(names) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= NAMED_AT_MOST) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const named = names.slice(0, NAMED_AT_MOST - 1);
  return `${named.join(", ")} and ${countOf(names.length - named.length, "other")}`;
}

/**
 * The paths, named up to `limit` and then counted. The count of what is NOT named is what
 * keeps the sentence true after the cut — and at `limit` 0 the list becomes the count alone,
 * which is the last thing to give way before the instruction would have to.
 */
function nameSome(paths, limit) {
  const named = paths.slice(0, limit).map(readable);
  const rest = paths.length - named.length;
  if (named.length === 0) return `${rest} of them`;
  return rest > 0 ? `${named.join(", ")} (+${rest} more)` : named.join(", ");
}

/**
 * The longest rendering that fits the budget: names as many paths as it can, and gives them
 * up one at a time rather than truncating the sentence. What must never be cut is the
 * instruction — a directive whose verb has been chopped off tells Claude nothing at all.
 */
function withinBudget(render, paths) {
  let text = render(nameSome(paths, NAMED_AT_MOST));
  for (let limit = NAMED_AT_MOST - 1; text.length > DIRECTIVE_MAX && limit >= 0; limit--) {
    text = render(nameSome(paths, limit));
  }
  return text;
}

/** Has this trace already been said out loud? */
export function isAnnounced(trace) {
  return Boolean(trace?.announcedAt);
}

/**
 * What ARRIVED, as an instruction. Notes and other files are counted apart on purpose: a
 * pull can carry engine files (an update run on the other machine), and calling those
 * "notes" would be a lie told confidently — which is the one thing an announcement may
 * never do.
 */
export function arrivalsDirective(trace) {
  const files = trace?.files ?? [];
  if (files.length === 0) return null;
  const notes = files.filter(isNote);
  const others = files.filter((rel) => !isNote(rel));

  // The author follows the NOTES when there are any ("2 notes from Claire and 1 other file"):
  // people write notes, and that is the half the owner cares about first.
  const from = trace.authors?.length > 0 ? ` from ${joinNames(trace.authors)}` : "";
  const what =
    notes.length > 0
      ? `${countOf(notes.length, "note")}${from}${others.length > 0 ? ` and ${countOf(others.length, "other file")}` : ""}`
      : `${countOf(others.length, "other file")}${from}`;
  // Only said when a note actually arrived: the file Claude is holding may have moved under
  // it, and an engine file it never read cannot have.
  const reRead = notes.length > 0 ? " Re-read any of those notes before editing it." : "";

  return withinBudget(
    (list) =>
      `📥 The brain synchronised on its own: ${what} arrived since the last message: ${list}. ` +
      `Say it in one sentence, in the owner's language, then answer them.${reRead}`,
    [...notes, ...others],
  );
}

/**
 * What could NOT be merged, as an instruction. Three things it must carry: the files, the
 * engine's own reason (it says what to repair), and the order of operations — the merge is
 * explained and redone BEFORE the answer, keeping both sides, asking only as a last resort.
 */
export function blockedDirective(trace) {
  const blocked = trace?.blocked;
  if (!blocked || (blocked.files ?? []).length === 0) return null;
  const because = blocked.reason && blocked.reason !== "conflict" ? ` (${blocked.reason})` : "";

  return withinBudget(
    (list) =>
      `⚠️ The background sync could not merge ${list}${because} and undid the pull. ` +
      `Before answering: explain in plain words that both copies changed the same file, load the ` +
      `\`sync\` skill, redo the merge, keep BOTH contributions by default, and ask the owner only ` +
      `if the two versions genuinely contradict each other.`,
    blocked.files,
  );
}

/**
 * The whole message for the next prompt, or `null`. What worked comes first, what needs a
 * hand second: a person reads the reassuring half and then the ask, never the other way round.
 */
export function remoteArrivalsDirective(trace) {
  if (isAnnounced(trace)) return null;
  const parts = [arrivalsDirective(trace), blockedDirective(trace)].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/** The same trace, stamped as said. Never mutated in place: the caller decides what to write. */
export function markAnnounced(trace, at) {
  return { ...trace, announcedAt: at.toISOString() };
}

/**
 * The trace's read/write, at the brain ROOT (a watcher only sees root files, POC 0.1) and
 * gitignored. Written by ATOMIC RENAME so a reader never catches half a file: the staging
 * copy is made under `.cache/`, which keeps the brain root free of a stray `.tmp` a crash
 * could leave behind — and the rename stays on one filesystem, both living inside the brain.
 */
export function buildTrace(brainDir) {
  const path = join(brainDir, TRACE_REL);
  const staging = join(brainDir, CACHE_DIR, `${TRACE_REL}.tmp`);
  return {
    read() {
      try {
        return JSON.parse(readFileSync(path, "utf8"));
      } catch {
        // Absent, or damaged: both mean "nothing to carry over". A corrupt trace must not be
        // the reason a brain stops syncing, nor the reason a prompt fails.
        return null;
      }
    },
    write(trace) {
      mkdirSync(dirname(staging), { recursive: true });
      writeFileSync(staging, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
      try {
        renameSync(staging, path);
      } catch (error) {
        rmSync(staging, { force: true });
        throw error;
      }
    },
  };
}

// `agreeing` is imported for the same reason `countOf` is — one agreement rule, one place
// (F14/S11). Re-exported so a caller that needs the noun alone does not reach past this module.
export { agreeing };
