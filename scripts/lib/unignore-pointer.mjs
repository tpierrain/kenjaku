// ─────────────────────────────────────────────────────────────────────────────
// unignore-pointer.mjs — the one-shot fleet migration behind "a universe is the
// owner's context, not the machine's" (ADR 0034).
//
// A deployed brain keeps its OWN `.gitignore`: no engine regime carries that file
// (`engine-manifest.json` has no bucket matching it), so un-ignoring the pointer in
// the launcher reaches nobody. Without this migration the feature would ship to new
// brains only, silently, and the fleet would keep a retrieval scope that does not
// follow its owner.
//
// The rule is surgical, because this file is the OWNER's: remove the ignore entry,
// and the engine's own comment when it is still the one the engine wrote (a comment
// still arguing "never commit it" next to a pointer that is now committed is worse
// than no comment). Everything else — their entries, their notes, their line
// endings — is preserved byte for byte. Pure: the caller reads and writes.
// ─────────────────────────────────────────────────────────────────────────────

// The entry as every deployed brain carries it.
const POINTER_ENTRY = ".vault-rag/active-universe";

// The comment the engine shipped above it, verbatim. Matched as a block so an owner
// who rewrote or annotated it keeps their words — only OUR prose is ours to retract.
const ENGINE_COMMENT = [
  "# Universes (ADR 0034): the active-universe pointer is per-machine session state",
  "# (never commit it). Its sibling .vault-rag/universes.json registry IS committed on",
  "# purpose (structural: which universes exist) — only the pointer is transient.",
];

// What replaces it: one line, saying the thing that is now true.
const REPLACEMENT = "# Universes (ADR 0034): nothing under .vault-rag/ is ignored — which universe you are in is the OWNER's state, and it travels.";

const bare = (line) => line.replace(/\r$/, "").trim();

/**
 * Returns the `.gitignore` with the pointer un-ignored, and whether anything moved.
 * Unchanged input → the SAME string back, so a second run is provably a no-op.
 */
export function unignoreActiveUniverse(text) {
  const lines = text.split("\n");
  const isPointer = (line) => bare(line).replace(/^\//, "") === POINTER_ENTRY;
  const at = lines.findIndex(isPointer);
  if (at < 0) return { text, changed: false };

  // The engine's comment, only when it sits immediately above and is still ours.
  const commentStart = at - ENGINE_COMMENT.length;
  const ownComment =
    commentStart >= 0 &&
    ENGINE_COMMENT.every((expected, i) => bare(lines[commentStart + i]) === expected);

  // `\r` lives at the end of the PRECEDING line's content, so dropping whole lines
  // and re-joining on "\n" leaves a CRLF file CRLF and an LF file LF.
  const eol = lines[at].endsWith("\r") ? "\r" : "";
  const retracted = ownComment
    ? [
        ...lines.slice(0, commentStart),
        REPLACEMENT + eol,
        ...lines.slice(commentStart + ENGINE_COMMENT.length),
      ]
    : lines;

  // EVERY occurrence, not just the first: one entry left behind and the pointer
  // still never travels, which is the whole defect.
  return { text: retracted.filter((line) => !isPointer(line)).join("\n"), changed: true };
}
