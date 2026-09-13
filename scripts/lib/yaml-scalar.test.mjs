// ─────────────────────────────────────────────────────────────────────────────
// yaml-scalar.test.mjs — the one place a value nobody controls becomes a
// frontmatter value. The cases below are not hypothetical: `author:` is stamped
// from `git config user.name`, and a person is free to set that to `@tpierrain`.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { yamlScalar } from "./yaml-scalar.mjs";

test("an ordinary name is written exactly as it is: no note's bytes change over a problem it does not have", () => {
  assert.equal(yamlScalar("Thomas Pierrain"), "Thomas Pierrain");
  assert.equal(yamlScalar("Zoé Martín-Lévy"), "Zoé Martín-Lévy", "accents are not an indicator");
  assert.equal(yamlScalar("O'Brien"), "O'Brien", "an apostrophe INSIDE a plain scalar is just a letter");
  assert.equal(yamlScalar("claire.dupont"), "claire.dupont");
  assert.equal(yamlScalar("dev-team 2"), "dev-team 2");
});

// Every one of these makes the WHOLE note unparseable, or turns the name into
// something that is not a name. A note the indexer refuses is a note the owner
// cannot find, and on a shared brain it undoes the other person's entire pull.
test("a value opening on a YAML indicator is quoted, character for character", () => {
  assert.equal(yamlScalar("@tpierrain"), "'@tpierrain'", "reserved: YAML refuses it outright");
  assert.equal(yamlScalar("*thomas"), "'*thomas'", "an alias to an anchor that does not exist");
  assert.equal(yamlScalar("&thomas"), "'&thomas'", "…and an anchor nobody refers to");
  assert.equal(yamlScalar("- tp"), "'- tp'", "a sequence item, not a name");
  assert.equal(yamlScalar("? tp"), "'? tp'");
  assert.equal(yamlScalar(": tp"), "': tp'");
  assert.equal(yamlScalar("# tp"), "'# tp'", "a comment: the key would have NO value at all");
  assert.equal(yamlScalar("[tp]"), "'[tp]'");
  assert.equal(yamlScalar("{tp}"), "'{tp}'");
  assert.equal(yamlScalar("!tp"), "'!tp'", "a tag");
  assert.equal(yamlScalar("|tp"), "'|tp'");
  assert.equal(yamlScalar(">tp"), "'>tp'");
  assert.equal(yamlScalar("%tp"), "'%tp'", "a directive");
  assert.equal(yamlScalar("`tp"), "'`tp'");
  assert.equal(yamlScalar(",tp"), "',tp'");
  assert.equal(yamlScalar("]tp"), "']tp'");
  assert.equal(yamlScalar("}tp"), "'}tp'");
  assert.equal(yamlScalar('"tp"'), "'\"tp\"'");
  assert.equal(yamlScalar("'tp'"), "'''tp'''", "already-quoted text is CONTENT, and its quotes are doubled");
});

// The indicator is only an indicator in first position — quoting a name because it
// merely CONTAINS a hyphen would put quotes around most of the world's surnames.
test("the same characters inside a value are letters, not indicators", () => {
  assert.equal(yamlScalar("Jean-Luc"), "Jean-Luc");
  assert.equal(yamlScalar("a*b"), "a*b");
  assert.equal(yamlScalar("a@b"), "a@b");
  assert.equal(yamlScalar("a#b"), "a#b", "a comment needs the space in front");
  assert.equal(yamlScalar("a:b"), "a:b", "…and a mapping needs the space after");
});

test("a mapping or a comment forming mid-value is quoted, because the value would be cut in two", () => {
  assert.equal(yamlScalar("Thomas: the second"), "'Thomas: the second'");
  assert.equal(yamlScalar("Thomas #2"), "'Thomas #2'");
  assert.equal(yamlScalar("Thomas:"), "'Thomas:'", "a trailing colon opens a nested mapping");
});

// The stamp answers "WHO wrote this note", and the answer must come back a string.
// `author: null` reads as nobody, and `author: 007` as a number — both are a lie
// the reader has no way to see, which is worse than an ugly quoted name.
test("a value YAML would read as something other than text is quoted", () => {
  assert.equal(yamlScalar("null"), "'null'");
  assert.equal(yamlScalar("Null"), "'Null'", "YAML's null is case-insensitive");
  assert.equal(yamlScalar("~"), "'~'");
  assert.equal(yamlScalar("true"), "'true'");
  assert.equal(yamlScalar("False"), "'False'");
  assert.equal(yamlScalar("yes"), "'yes'", "a boolean under YAML 1.1, a string under 1.2: quote it and stop guessing");
  assert.equal(yamlScalar("off"), "'off'");
  assert.equal(yamlScalar("007"), "'007'");
  assert.equal(yamlScalar("-3"), "'-3'");
  assert.equal(yamlScalar("1.5"), "'1.5'");
  assert.equal(yamlScalar("1e3"), "'1e3'");
  assert.equal(yamlScalar("0x1f"), "'0x1f'");
  assert.equal(yamlScalar("Yes Man"), "Yes Man", "…and a name that merely STARTS like one is a name");
  assert.equal(yamlScalar("Nullo"), "Nullo");
});

// ── Where "this is a value YAML re-reads" ENDS, tested from the other side ────
// The test above proves the right things get quoted. It cannot prove the wrong
// things do not, and that is the expensive half: quoting is a rewrite of a header
// in every note already written, over a problem the value does not have.
//
// Every case below was handed over by a mutation run (2026-09-13, the file's first
// ever: 80.39 %, 10 survivors, ALL of them here). They are not variations for the
// sake of it — each one is a loosened boundary that no test could see, and the ones
// that read like real values are real values: `London` ends in a YAML boolean,
// `.NET` opens on a dot, `12 Monkeys` opens on digits.
test("a name that merely CONTAINS what YAML re-reads is left exactly as it is", () => {
  assert.equal(yamlScalar("London"), "London", "it ends in `on`, and only a whole value is a boolean");
  assert.equal(yamlScalar("Bruno"), "Bruno", "…and this one in `no`");
  assert.equal(yamlScalar("12 Monkeys"), "12 Monkeys", "digits it merely STARTS with are not a number");
  assert.equal(yamlScalar("R2"), "R2", "nor a letter in front of one");
  assert.equal(yamlScalar(".NET"), ".NET", "a dot then letters is a platform, not a fraction");
  assert.equal(yamlScalar("0xDEADBEEF cafe"), "0xDEADBEEF cafe", "hex that stops being hex is text");
});

// And the other side of the same boundary: a number all the way to its last
// character IS re-read as a number, however it is spelled. `author: 1.25` hands the
// reader a figure where a name should be — the exact lie the quoting exists against.
test("a number is quoted through every spelling of one, not just the easy ones", () => {
  assert.equal(yamlScalar("1.25"), "'1.25'", "more than one decimal");
  assert.equal(yamlScalar(".25"), "'.25'", "no leading digit at all");
  assert.equal(yamlScalar("1e10"), "'1e10'", "more than one digit of exponent");
  assert.equal(yamlScalar("1e+5"), "'1e+5'", "a SIGNED exponent — the sign is part of the number");
});

// A frontmatter value is ONE line, and git will happily hand over a `user.name`
// that is not. The alternative to collapsing is a note whose header ends mid-value:
// a mangled name is a fact that is slightly wrong, an unparseable note is no fact.
test("a value spread over several lines is folded into one, and quoted if it then needs it", () => {
  assert.equal(yamlScalar("Thomas\nPierrain"), "Thomas Pierrain");
  assert.equal(yamlScalar("Thomas\r\nPierrain"), "Thomas Pierrain");
  assert.equal(yamlScalar("Thomas\tPierrain"), "Thomas Pierrain", "a tab is not indentation here");
  assert.equal(yamlScalar("Thomas   Pierrain"), "Thomas Pierrain", "one space: a run of them is not a name");
  assert.equal(yamlScalar("  Thomas  "), "Thomas", "edge whitespace a parser would eat anyway");
  assert.equal(yamlScalar("\n@tp\n"), "'@tp'");
});

test("nothing at all is written as an explicitly empty string, never as a bare blank", () => {
  assert.equal(yamlScalar(""), "''");
  assert.equal(yamlScalar("   "), "''");
  assert.equal(yamlScalar(null), "''");
  assert.equal(yamlScalar(undefined), "''");
});
