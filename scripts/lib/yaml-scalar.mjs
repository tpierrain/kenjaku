// ─────────────────────────────────────────────────────────────────────────────
// yaml-scalar.mjs — a value nobody controls, written as a frontmatter value.
//
// The brain composes its own headers by hand (`key: value`, joined), which is
// right for keys and values IT chooses: `type`, `created`, a kebab universe slug.
// It is wrong the moment a value comes from OUTSIDE — and one does: `author:` is
// stamped from `git config user.name`, which a person is free to set to
// `@tpierrain`. That opens on a character YAML reserves, so the note does not
// parse: the indexer refuses it, the owner cannot find it, and on a brain shared
// by two people the partner's header check undoes their entire pull over a name.
//
// So: quote what needs quoting, and NOTHING else. Quoting everything would pass
// every test here while rewriting the header of every note in every brain — and
// the notes already written are the ones with the most to lose.
// ─────────────────────────────────────────────────────────────────────────────

// The characters YAML reads as syntax IN FIRST POSITION, and only there: quoting a
// name because it merely contains a hyphen would put quotes around most of the
// world's surnames. `Jean-Luc` is a name; `- tp` is a list.
const OPENS_ON_AN_INDICATOR = /^[-?:,[\]{}#&*!|>'"%@`]/;

// A mapping needs the space AFTER the colon, a comment the space BEFORE the hash —
// which is why `a:b` and `a#b` are ordinary text and `TP: the second` is two keys.
// A trailing colon is its own case: it opens a nested mapping with nothing in it.
const CUTS_THE_VALUE_IN_TWO = /: |\s#|:$/;

// Values YAML resolves to something that is not text. `author: null` says nobody
// wrote the note and `author: 007` hands back a number — both are lies the reader
// has no way to see, which is worse than a quoted name. `yes`/`no`/`on`/`off` are
// booleans under YAML 1.1 and strings under 1.2: quoting them stops the question
// from depending on which parser reads the note.
const IS_NOT_TEXT = /^(?:null|~|true|false|yes|no|on|off)$/i;
const IS_A_NUMBER = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$|^0[xob][0-9a-fA-F_]+$/;

const needsQuoting = (value) =>
  value === "" ||
  OPENS_ON_AN_INDICATOR.test(value) ||
  CUTS_THE_VALUE_IN_TWO.test(value) ||
  IS_NOT_TEXT.test(value) ||
  IS_A_NUMBER.test(value);

/**
 * `raw`, ready to be placed after `key: ` in frontmatter — plain when it can be,
 * single-quoted when it cannot. Single quotes and not double: inside them the only
 * thing YAML looks at is the quote itself, doubled, so there is no escape table to
 * get subtly wrong.
 *
 * Whitespace is folded to single spaces first, because a frontmatter value is ONE
 * line and `git config user.name` is not obliged to be. The alternative to folding
 * is a header that ends mid-value, taking every key below it into the body: a name
 * written slightly wrong is a fact that is slightly wrong, an unparseable note is
 * no fact at all.
 *
 * Absent or blank comes back as `''` — an explicitly empty string. Callers that
 * mean "unknown" must omit the key entirely (ADR 0041 §3: absent is unknown), which
 * is a decision about the note, not about YAML, and belongs to them.
 */
export function yamlScalar(raw) {
  const value = String(raw ?? "").replace(/\s+/g, " ").trim();
  return needsQuoting(value) ? `'${value.replaceAll("'", "''")}'` : value;
}
