import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────────────────────
// F8 (v5.0.0 code review) — A FRESH INSTALL MUST NOT BE BORN DIVERGED.
//
// `recordSourceProvenanceAndBase` runs at step 4, before the brain's first commit.
// The connectors step (5/10) then merges each MCP connector's permissions into
// `.claude/settings.json` — a `merge` file. So an interactive install that wires a
// single connector ended with a settings.json that no longer matched its own recorded
// sha256, and F1's session nudge fired on a brain minutes old, about a file its owner
// had not touched. Undismissibly: no refresh family ever writes a `.new` beside it.
//
// The repair is an ORDERING one, and ordering is what this file pins. What the
// re-record itself does is `rerecordEngineWrite`'s contract, proven against a real disk
// in engine-base-fs.test.mjs; installer.mjs is one top-level script with no injectable
// seam (same reason as installer-postflight.test.mjs / installer-staged-skills.test.mjs),
// so the wiring is asserted at the source level — including the one thing a call-site
// check alone would miss: that it comes AFTER the merge it is meant to describe.
// ─────────────────────────────────────────────────────────────────────────────

const installerSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "installer.mjs"),
  "utf8",
);

test("installer imports rerecordEngineWrite from the base-tree orchestrator", () => {
  assert.match(
    installerSrc,
    /import\s*\{[^}]*\brerecordEngineWrite\b[^}]*\}\s*from\s*["']\.\/scripts\/lib\/engine-base-fs\.mjs["']/,
    "installer.mjs must import rerecordEngineWrite from ./scripts/lib/engine-base-fs.mjs",
  );
});

test("installer re-records the settings file the connector step merged into", () => {
  assert.match(
    installerSrc,
    /rerecordEngineWrite\(\s*\{[^}]*brainDir:\s*TARGET[^}]*rels:\s*\[\s*["']\.claude\/settings\.json["']\s*\]/s,
    "the re-record must name the brain being installed and the file the connectors merge into",
  );
});

// 🛑 THE ASSERTION THIS FILE EXISTS FOR. Both calls being present proves nothing: the
// defect WAS a recording that ran, correctly, too early. Compared by position, so a
// future edit that hoists the re-record back above the merge turns red here.
test("the re-record comes AFTER the connector merge, which is the whole of the fix", () => {
  const merge = installerSrc.indexOf("applyConnectorFiles(");
  const record = installerSrc.indexOf("rerecordEngineWrite(");
  assert.ok(merge > 0, "the connector merge must still be in the installer");
  assert.ok(record > 0, "the re-record must be in the installer");
  assert.ok(
    record > merge,
    "provenance recorded BEFORE the connector merge is the F8 defect itself — the brain ends the install already diverged",
  );
});

// The other half of the gate: an install that wires no connector writes no permission,
// so it must leave the manifest exactly as step 4 recorded it. An unconditional
// re-record would be harmless today and a habit tomorrow — and it is precisely the
// "re-seed everything" shape that would, elsewhere, silence a real owner edit.
// 🧱 S14 (second pass) — THE TWO ASSERTIONS BELOW USED TO PIN WHITESPACE.
//
// They required `rerecordEngineWrite(` to be the FIRST line after the guard's brace, and
// forbade any line between the merge and the flag — in a file whose every other block
// carries an explanatory comment. Adding one would have turned this suite red with a
// message about a missing guard that was still there. What they are really about is
// CONTAINMENT and ORDER, so that is what they ask now, on the block rather than on the
// spacing. (The `indexOf` test above never had the problem, and is untouched.)
const blockOf = (opener, closer) => {
  const from = installerSrc.indexOf(opener);
  assert.ok(from > 0, `installer.mjs must still contain \`${opener}\``);
  const to = installerSrc.indexOf(closer, from);
  assert.ok(to > from, `installer.mjs must still close \`${opener}\` with \`${closer}\``);
  return installerSrc.slice(from, to);
};

test("the re-record is CONDITIONAL on a connector having actually been wired", () => {
  // The other half of the gate: an install that wires no connector writes no permission,
  // so it must leave the manifest exactly as step 4 recorded it. An unconditional
  // re-record would be harmless today and a habit tomorrow — and it is precisely the
  // "re-seed everything" shape that would, elsewhere, silence a real owner edit.
  const guarded = blockOf("if (connectorsTouchedSettings) {", "\n}");

  assert.ok(
    guarded.includes("rerecordEngineWrite("),
    "the re-record must sit INSIDE the block guarded by the flag the connector loop sets",
  );
});

test("the flag is set where the merge happens, not where the step is announced", () => {
  const mcpBranch = blockOf('if (conn.kind === "mcp") {', "} else {");

  assert.ok(mcpBranch.includes("applyConnectorFiles("), "the merge must still be in the mcp branch");
  assert.ok(
    mcpBranch.indexOf("connectorsTouchedSettings = true") > mcpBranch.indexOf("applyConnectorFiles("),
    "the flag must be raised by the merge, and after it — a flag set before the write can be raised over a write that threw",
  );
});

// 🚨 S7 (second pass) — A BRAND-NEW BRAIN HANDED OVER WITH A DIRTY WORKING TREE.
//
// The brain's one `git add -A` + `git commit` runs at step 4bis, BEFORE the connectors
// step; the re-record that F8 added runs after it and rewrites `engine-manifest.json`,
// which is tracked. So an interactive install that wires a single connector printed
// "local git repo ready (install commit)" and then left a modified file behind it. It
// self-heals at the first SessionStart sweep — the defect is the first impression, on a
// product whose whole promise is that it commits for you.
test("the manifest the re-record rewrote is COMMITTED, inside the same guarded block", () => {
  const guarded = blockOf("if (connectorsTouchedSettings) {", "\n}");

  assert.ok(guarded.includes('"--amend"'), "the install commit must be amended to carry the re-recorded manifest");
  assert.ok(
    guarded.indexOf('"--amend"') > guarded.indexOf("rerecordEngineWrite("),
    "committing BEFORE the re-record commits nothing — the whole point is the bytes it just wrote",
  );
  // Amended rather than added: the installer told the owner "install commit", singular,
  // and a second commit for a file they never saw would need explaining.
  assert.ok(guarded.includes("commit.ok"), "and it may only amend a commit that was actually made");
});

// 🚨 S8 (second pass) — DON'T PRETEND (the repo's own guardrail, in three words).
//
// `rerecordEngineWrite` returns the rels it ACTUALLY recorded, and returns `[]` when the
// path is absent or outside `regimes.merge` — writing nothing at all. The installer
// announced "engine provenance re-recorded" regardless, which is a claim about something
// that may not have happened, printed to someone with no way to check.
test("what the installer ANNOUNCES is what the re-record says it did", () => {
  const guarded = blockOf("if (connectorsTouchedSettings) {", "\n}");
  const assigned = /(?:const|let)\s+(\w+)\s*=\s*rerecordEngineWrite\(/.exec(guarded);

  assert.ok(assigned, "the return value must be kept — it is the only thing that knows what was recorded");
  assert.ok(
    new RegExp(`\\b${assigned[1]}\\b[\\s\\S]*\\bok\\(`).test(guarded),
    "the success line must be gated on what was recorded, not printed unconditionally",
  );
});
