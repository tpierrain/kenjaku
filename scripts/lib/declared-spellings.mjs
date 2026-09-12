// ─────────────────────────────────────────────────────────────────────────────
// declared-spellings.mjs — the pure core of issue #66: the facts that must
// survive a `/clear`, checked at the WRITE rather than printed at every session
// start.
//
// The field failure: a client's name — `aXiom` — spelled *Axion* in a
// transcript, *Axiom* by one colleague, *Axion/Globex* by another. The owner
// resolved it once and the vault recorded it, in a note. A new note drafted from a
// Slack DM brought the wrong spelling straight back, because nothing carried the
// resolved name into the session that needed it.
//
// 🔒 WHY NOT AMBIENT CONTEXT (ADR 0035 §2 / F1, and it is the owner's call, taken
// 2026-09-12): a SessionStart hook's context is echoed verbatim, so every injected
// line is printed before the owner has typed a word — in every screenshot, screen
// share and transcript. This feature's own worked example is a client's identity,
// which makes it the worst possible content to carry there. Nothing is added to the
// session-start block; the check moved to the moment the brain writes.
//
// 🎯 WHAT IS MATCHED IS THE KNOWN-WRONG, never a proper name inferred from free
// text: matching a closed, owner-written list is decidable, recognising proper
// names is not.
// ─────────────────────────────────────────────────────────────────────────────
import { profileSectionEntries } from "./universe-profile.mjs";

// The profile heading that carries them. NOT `## Proper names` (the issue's
// alternative): the heading shapes what gets written into it, and *proper names*
// invites a glossary — the second `CLAUDE.md` this feature exists to prevent.
// `## Always true here` invites facts, and only the ones written in the correctable
// form below are ever acted on. Everything else in the section stays prose the RAG
// can still find.
export const SPELLINGS_HEADING = "Always true here";

// `aXiom — never: Axion, Axiom` — the canonical spelling, then the wrong ones
// that have ACTUALLY been seen. Em dash, en dash or a plain hyphen, `never` or
// `not`, colon optional: the owner writes this by hand, in Obsidian.
const ENTRY = /^(.+?)\s+[—–-]\s+(?:never|not)\s*:?\s+(.+)$/i;

/**
 * The spellings a universe's profile declares, as `{ canonical, wrong[] }`, or []
 * when it declares none. Pure, and quietly empty on anything it cannot read: a
 * brain whose profile predates this feature is the normal case, not an error.
 */
export function declaredSpellings(rawProfile) {
  return profileSectionEntries(rawProfile, SPELLINGS_HEADING)
    .map((line) => line.match(ENTRY))
    .filter(Boolean)
    .map(([, canonical, wrong]) => ({
      // No `.trim()` on the canonical, and that is a property of the regex rather
      // than an oversight: `(.+?)` is lazy and the `\s+` after it is greedy, so the
      // capture can never end in whitespace however the owner spaces the line. The
      // mutation pass proved it — a run with the trim removed changed no behaviour.
      canonical,
      wrong: wrong
        .split(",")
        .map((one) => one.trim())
        .filter(Boolean),
    }));
}

/**
 * The text with every declared misspelling replaced by its canonical spelling, plus
 * what was changed (`corrections`) and what was deliberately left alone
 * (`protectedHits`). Pure — the caller decides what to do with either list.
 *
 * Both lists are reported because the one passage the guard cannot fix is otherwise
 * the one nobody hears about.
 */
export function applyDeclaredSpellings(text, entries) {
  const rules = spellingRules(entries);
  if (rules.length === 0 || typeof text !== "string") {
    return { text, corrections: [], protectedHits: [] };
  }

  const protectedRanges = protectedSpans(text);
  const isProtected = (at, end) =>
    protectedRanges.some(([from, to]) => at < to && end > from);

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${rules.map(({ from }) => escapeRegExp(from)).join("|")})(?![\\p{L}\\p{N}])`,
    "giu",
  );

  const corrections = new Map();
  const protectedHits = new Map();
  const corrected = text.replace(pattern, (match, _group, offset) => {
    // The rules are longest-first, so a compound (`Axion/Globex`) is matched whole
    // rather than half-corrected by the shorter spelling inside it.
    const rule = rules.find(({ from }) => from.toLowerCase() === match.toLowerCase());
    const hit = { from: rule.from, to: rule.to };
    if (isProtected(offset, offset + match.length)) {
      protectedHits.set(rule.from, hit);
      return match;
    }
    corrections.set(rule.from, hit);
    return rule.to;
  });

  return { text: corrected, corrections: [...corrections.values()], protectedHits: [...protectedHits.values()] };
}

// One flat, longest-first list of `wrong → canonical`, so the alternation below can
// never prefer a shorter spelling that is a prefix of a longer one.
function spellingRules(entries) {
  return (Array.isArray(entries) ? entries : [])
    .flatMap(({ canonical, wrong }) => (wrong ?? []).map((from) => ({ from, to: canonical })))
    .filter(({ from, to }) => typeof from === "string" && from.length > 0 && typeof to === "string")
    .sort((a, b) => b.from.length - a.from.length);
}

const escapeRegExp = (raw) => raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── What is never rewritten, because falsifying a record is a worse defect ────
// than the one being repaired. Each of these is a span where the bytes mean
// something other than "the note's own prose".
const PROTECTED = [
  /^---\n[\s\S]*?\n---/, //          frontmatter: machine-read (a universe slug, tags,
  //                                 a path) — correcting one changes what the ENGINE
  //                                 does, not what the note says.
  /```[\s\S]*?```/g, //              fenced code
  /`[^`\n]*`/g, //                   inline code
  /\]\([^)]*\)/g, //                 a link's target is an address, not prose
  /<[^>\s]+>/g, //                   …and so is an autolink
  /^>.*$/gm, //                      a blockquote is someone else's words
  /"[^"\n]*"/g, //                   quoted material: a wrong spelling inside
  /“[^”\n]*”/g, //                   "Marie wrote: …" is what Marie wrote, and the
  /«[^»\n]*»/g, //                   guard reports it rather than rewriting her.
];

function protectedSpans(text) {
  const spans = [];
  for (const pattern of PROTECTED) {
    for (const match of text.matchAll(pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`))) {
      spans.push([match.index, match.index + match[0].length]);
    }
  }
  return spans;
}
