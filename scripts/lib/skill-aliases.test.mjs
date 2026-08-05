import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────────────────────
// F22 (field, 2026-08-05): the owner typed `/univers`, twice, and got `Unknown command`
// then `Args from unknown skill: shodo`, before typing `/switch` himself. `/switch` is
// named after the VERB while it owns the NOUN — it also creates, lists, renames and
// describes a universe — and someone thinking about the thing does not guess the action.
// No hook can catch it: an unknown slash command fails in the CLI, before any model turn.
// So the only mechanism is THE COMMAND EXISTING, in both the English and the French guess.
//
// A pure scan over the sources (rung 1 of the determinism ladder, ADR 0009): an alias is a
// skill DIRECTORY, so what has to hold is spelling, thinness, and a target that is there.
// ─────────────────────────────────────────────────────────────────────────────

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ALIASES = ["universe", "univers"];
const TARGET = "switch";

const aliasFile = (name) => join(REPO, "engine-skills", name, "SKILL.md");
const frontmatter = (body) => body.split(/^---$/m)[1] ?? "";

test("both spellings of the noun exist as commands — the English guess and the French one", () => {
  assert.deepEqual(
    ALIASES.filter((name) => !existsSync(aliasFile(name))),
    [],
    "an alias that does not exist as a directory is not a command: the CLI routes on the folder name",
  );
});

// The name in the frontmatter and the name of the folder are two different things, and only
// one of them is what the owner types. A mismatch is the exact defect being fixed, one layer
// deeper: the command would exist and still not be the one that was reached for.
test("each alias declares the name it is typed as", () => {
  assert.deepEqual(
    ALIASES.filter((name) => !new RegExp(`^name:\\s*${name}\\s*$`, "m").test(frontmatter(readFileSync(aliasFile(name), "utf8")))),
    [],
  );
});

// An alias that re-explains the command is a second copy of the rules, free to drift — and
// the reconciler never removes a skill, so the drifted copy would outlive any repair.
test("each alias POINTS at the one skill that holds the rules, and holds none of its own", () => {
  for (const name of ALIASES) {
    const body = readFileSync(aliasFile(name), "utf8");

    assert.match(body, new RegExp(`\`?${TARGET}\`?`), `${name} must name the skill it defers to`);
    assert.ok(
      body.length <= 900,
      `${name} grew to ${body.length} chars: an alias that explains anything is a second source of truth`,
    );
  }
});

// F19 — the frontmatter description of every skill is loaded on EVERY session, whether or not
// the skill is ever used. It is the whole price of an alias, so it is the thing to bound.
test("each alias costs only a short description in the always-loaded layer", () => {
  for (const name of ALIASES) {
    const description = /^description:\s*"([^"]*)"/m.exec(frontmatter(readFileSync(aliasFile(name), "utf8")))?.[1];

    assert.ok(description, `${name} must carry a quoted description — it is what routes the guess`);
    assert.ok(description.length <= 220, `${name}'s description is ${description.length} chars, too long for a stub`);
  }
});

// The target itself. An alias to a skill that has been renamed or removed is a command that
// exists, answers, and does nothing — worse than the unknown-command error it replaced.
test("the skill both aliases defer to is really there", () => {
  assert.ok(existsSync(join(REPO, ".claude", "skills", TARGET, "SKILL.md")));
});
