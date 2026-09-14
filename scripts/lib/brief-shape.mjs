// ─────────────────────────────────────────────────────────────────────────────
// brief-shape.mjs — the DECIDABLE half of the one-page brief (#128, ADR 0009
// rung 1: pure, no I/O, no knowledge of hooks or files).
//
// The rule it enforces is written for humans in the `brief-shape` skill, in both
// locales. This module never restates it: it is the arithmetic that skill's
// numbers reduce to, so that a prep note the engine would have to apologise for
// is never born. The guard that calls it is `vault-write-guard.mjs`, and its
// refusal BLOCKS the write (the owner's call, 2026-09-14, Q1): the over-long
// note never exists, and the cost of the refusal is paid by the model that
// rewrites it shorter, never by the person who is about to walk into a meeting.
//
// 🛑 WHICH IS WHY EVERY MESSAGE HERE SAYS WHAT FAILED **AND BY HOW MUCH**. Its
// reader is not a human scanning a lint report: it is the model that has to fix
// the note in one pass, without seeing this file. "Too long" is not actionable;
// "bullet 3 runs 244 characters, 24 over the ceiling of 220" is.
//
// The two things it deliberately does NOT judge: anything below the first `##`
// (ammunition is unbounded by design — the cap protects the first screen, it was
// never meant to shorten the evidence), and the CONTENT of a bullet. Prose is not
// decidable, and a guard that judges prose is a guard that disagrees with the rule
// it enforces.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * At most seven things said, each of them a sentence someone actually says aloud.
 *
 * Both numbers stand in for a rule that is NOT decidable as written ("5 to 7
 * sentences, one screen"): a sentence cannot be counted without judgment
 * (abbreviations, decimals, quoted speech), a bullet can. The ceiling is the other
 * half — without it, "seven bullets" is honoured by seven paragraphs. A spoken
 * sentence runs 120 to 180 characters, so 220 leaves room without letting a bullet
 * become a section.
 */
export const BULLET_CAP = 7;
export const BULLET_CHAR_CEILING = 220;

/**
 * The scope, decided by a PREFIX on frontmatter `type:` and by nothing else (the
 * owner's call, 2026-09-14, Q2). Never the folder, never the filename, never a
 * heading: a prep type invented later is covered the day it is first written, with
 * no edit to this file. A note with no `type:` is out of scope.
 */
export const BRIEF_TYPE_PREFIXES = ["prep-", "briefing-"];

/** Is this note prep-shaped, i.e. does this shape apply to it at all? */
export function isBriefShaped(type) {
  return typeof type === "string" && BRIEF_TYPE_PREFIXES.some((prefix) => type.startsWith(prefix));
}

/**
 * The first screen: everything between the note's `#` title and its first `##`
 * heading, as lines, each with its 1-based line number in `content`.
 *
 * That anchor is the whole point of needing no canonical section name — the rule
 * reads the same in English and in French, and every `##` below is ammunition by
 * construction. `content` is the note WITHOUT its frontmatter (what a frontmatter
 * parser hands back), so a `type:` line can never be mistaken for the brief.
 *
 * Fences are tracked because a `##` inside a code block is not a heading: closing
 * the first screen there would hide everything after it from the cap.
 */
export function firstScreenLines(content) {
  const lines = String(content ?? "").split("\n");
  const screen = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      screen.push({ text, line: i + 1 });
      continue;
    }
    const level = inFence ? 0 : (text.match(/^#+/)?.[0].length ?? 0);

    // The fold is a `##` heading, EXACTLY as the rule is written — not "any heading
    // deeper than the title". A `###` above it is not a section, it is a sub-heading
    // on the first screen, which the shape forbids: measured as prose, it is told so,
    // instead of silently ending the brief and hiding the page underneath it.
    if (level === 2) break;
    if (level === 1 && !screen.some((l) => l.text.trim() !== "")) {
      // The title is the anchor, not content, so the screen starts after it — and the
      // blank lines that may precede it go with it. A note that opens without a title
      // (nothing forbids one) simply has no anchor to skip: its body IS the screen,
      // which is stricter than declaring such a note unmeasurable.
      screen.length = 0;
      continue;
    }
    screen.push({ text, line: i + 1 });
  }

  return screen;
}

/**
 * The top-level bullets of a first screen: `{ text, line }`, in order.
 *
 * A bullet may WRAP over several source lines, so its continuation lines are folded
 * into one `text` before anything is measured — otherwise the ceiling is defeated by
 * pressing Enter. Markdown's lazy continuation is honoured (a wrapped line need not
 * be indented): this guard refuses writes, so it may not invent a violation out of a
 * formatting habit it merely dislikes.
 */
export function briefBullets(lines) {
  const bullets = [];
  let current = null;

  for (const { text, line } of lines) {
    if (text.trim() === "") {
      current = null; // a blank line ends the bullet, so the next prose line is prose
      continue;
    }
    // A marker at column 0 is a top-level bullet. An INDENTED one is not a second
    // bullet but a nesting the shape forbids: folding it into its parent makes it
    // count against that bullet's ceiling, which is where nesting actually hurts.
    const marker = /^([-*+]|\d+[.)])\s+(.*)$/.exec(text);
    if (marker) {
      current = { text: marker[2].trim(), line };
      bullets.push(current);
      continue;
    }
    if (current) current.text = `${current.text} ${text.trim()}`.trim();
  }

  return bullets;
}

/** `3` → `3 characters`, `1` → `1 character`. A message that says "1 characters" reads as a bug. */
const characters = (n) => `${n} character${n === 1 ? "" : "s"}`;

/**
 * The verdict on one note: `{ ok: true, violations: [] }`, or every violation it
 * carries — all of them, never just the first, because its reader fixes the note in
 * one pass and a second refusal for a second rule is the same wait paid twice.
 */
export function briefShapeVerdict({ content, type }) {
  if (!isBriefShaped(type)) return { ok: true, violations: [] };

  const lines = firstScreenLines(content);
  const bullets = briefBullets(lines);
  const violations = [];

  // 1. Nothing but bullets above the fold. Without this rule the cap is honoured by
  //    seven bullets sitting under a page of context — which IS the arrangement this
  //    whole issue is about, and it would pass every count.
  let openBullet = false;
  for (const { text, line } of lines) {
    if (text.trim() === "") {
      openBullet = false;
      continue;
    }
    if (/^([-*+]|\d+[.)])\s+/.test(text)) {
      openBullet = true;
      continue;
    }
    if (openBullet) continue; // a wrapped line, indented or lazy: still that bullet
    violations.push({
      rule: "not-a-bullet",
      message:
        `line ${line} above the first \`##\` is not a bullet: "${text.trim()}". The first screen ` +
        `carries bullets and nothing else — no preamble, no sub-heading, no table, no link to go ` +
        `and open. Make it one of the things you will say, or move it below the first \`##\`.`,
    });
  }

  // 2. There is a first screen at all. Not a floor on its length (Q3 dropped that, and
  //    a check that failed a short brief would be the padding pressure itself): a floor
  //    on its EXISTENCE. A prep that opens straight onto a heading is the defect.
  if (bullets.length === 0) {
    violations.push({
      rule: "no-first-screen",
      message:
        `this note opens straight onto a \`##\` heading: there is no brief. The first screen is ` +
        `everything between the title and that heading, and it carries at least one bullet — even ` +
        `when the vault is thin, and then it is the one naming what is not documented.`,
    });
  }

  // 3. The cap, and 4. the ceiling — an upper bound each, never a quota.
  if (bullets.length > BULLET_CAP) {
    const over = bullets.length - BULLET_CAP;
    violations.push({
      rule: "too-many-bullets",
      message:
        `the first screen holds ${bullets.length} bullets, ${over} over the cap of ${BULLET_CAP}. ` +
        `Say ${over} thing${over === 1 ? "" : "s"} less, or move ${over === 1 ? "it" : "them"} below ` +
        `the first \`##\` as ammunition, where nothing is counted.`,
    });
  }

  bullets.forEach(({ text }, index) => {
    if (text.length <= BULLET_CHAR_CEILING) return;
    violations.push({
      rule: "bullet-too-long",
      message:
        `bullet ${index + 1} runs ${text.length} characters, ${characters(text.length - BULLET_CHAR_CEILING)} ` +
        `over the ceiling of ${BULLET_CHAR_CEILING}: "${text.slice(0, 60)}…". One bullet is one sentence ` +
        `said aloud; the detail behind it belongs below the first \`##\`.`,
    });
  });

  return { ok: violations.length === 0, violations };
}
