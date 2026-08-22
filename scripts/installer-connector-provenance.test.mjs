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
test("the re-record is CONDITIONAL on a connector having actually been wired", () => {
  assert.match(
    installerSrc,
    /if\s*\(\s*connectorsTouchedSettings\s*\)\s*\{\s*\n\s*rerecordEngineWrite\(/,
    "the re-record must be guarded by the flag the connector loop sets",
  );
  assert.match(
    installerSrc,
    /applyConnectorFiles\(conn,[^)]*\);\s*\n\s*connectorsTouchedSettings\s*=\s*true;/,
    "the flag must be set where the merge actually happens, not where the step is announced",
  );
});
