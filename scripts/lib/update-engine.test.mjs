import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// ═══════════════════════════════════════════════════════════════════════════
// THE GATE — outside-in acceptance / SURVIVAL test for `update-engine` (Phase 1).
//
// One coarse-grained test that drives the whole feature from the outside: a brain
// pinned at engine vA, a launcher source at vB > vA → `updateEngine()` must swap in
// the new engine (rag/src, the .sh+.cmd launchers, the engine-owned scripts incl.
// itself), run `npm install`, reindex IFF the index schema moved, and leave the
// user's notes / `.env` / `CLAUDE.md` / `.claude/settings.json` / custom skills
// BYTE-IDENTICAL (ADR 0003 / 0012 / 0014).
//
// GREEN since Step 4: `scripts/update-engine.mjs` (the apply core) now exists, so these
// guards ENFORCE (the `{ todo }` flags were dropped). The core is loaded lazily per
// test so a regression that removes it fails THIS file fail-first, not the whole load.
//
// Network / npm / reindex / launcher-regeneration are SEAMS injected by the test
// (no real git, npm or ONNX) so the gate is deterministic and offline. The launchers
// are REGENERATED (ADR 0015 "launcher-regeneration"), not copied from the clone: they
// are pure, machine-independent `rag-launcher.mjs` builder output and aren't even
// git-tracked, so a `git clone` would not carry them. The gate therefore injects a
// `regenerateLaunchers` seam (like `runInstall`/`runReindex`) and asserts it ran once
// for the platform, with BOTH `.sh` AND `.cmd` halves present. Cross-platform
// (ADR 0015): the scenario is run under BOTH a posix and a win32 `platform`.
// ═══════════════════════════════════════════════════════════════════════════

async function loadCore() {
  // Lazy so a missing core fails THIS guard (fail-first), not the whole file load.
  return (await import("../update-engine.mjs")).updateEngine;
}

// ── formatReport: the human summary the brain-side skill prints (Step 6) ──────
// Pure (report object → string) so the wording is unit-tested; the CLI entry holds
// only the untestable I/O wiring (ADR 0009).
import { formatReport, countNewCapabilities, needsRestart, bareHookName, runUpdateCli, realUpdateDeps, armRestartFlag, defaultCountVaultNotes } from "../update-engine.mjs";
import { RESTART_FLAG_REL } from "./restart-nudge.mjs";

// F2: the default count must match what the indexer actually treats as a note —
// the document-scanner excludes `_template.md`, `.gitkeep` and the `.obsidian/`
// dir, so the recap number doesn't overstate what's searchable.
test("defaultCountVaultNotes — counts vault .md but skips scanner-excluded files", async () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-count-"));
  writeFile(brainDir, "vault/topics/a.md", "# A\n");
  writeFile(brainDir, "vault/people/b.md", "# B\n");
  writeFile(brainDir, "vault/_template.md", "# tpl\n"); // scanner-excluded
  writeFile(brainDir, "vault/.gitkeep", ""); // scanner-excluded (and not .md)
  writeFile(brainDir, "vault/.obsidian/workspace.md", "# obsidian\n"); // excluded dir
  writeFile(brainDir, "vault/notes.txt", "not markdown");

  const n = await defaultCountVaultNotes({ brainDir });

  assert.equal(n, 2);
});

test("defaultCountVaultNotes — a brain with no vault returns 0", async () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-count-empty-"));
  assert.equal(await defaultCountVaultNotes({ brainDir }), 0);
});

test("formatReport — schema moved → reports the new version, the swap, and that a reindex ran", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts", "rag/package.json", "scripts/auto-commit.mjs"],
    regenerated: true,
    reindexed: true,
  });
  assert.match(out, /v1\.1\.0/);
  assert.match(out, /1\.1\.0/); // rag version
  assert.match(out, /3/); // file count
  assert.match(out, /reindex/i);
  // The survival promise is restated to the user.
  assert.match(out, /untouched|notes|\.env/i);
});

// The update commits the versioned engine files it rewrote (otherwise they sit dirty
// and block the next SessionStart pull). The user WILL see that commit land in their
// history, so the report says it — and says it stayed local, since push is opt-in.
test("formatReport — a committed update says so, and says nothing was pushed", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: true,
    reindexed: false,
    committed: "committed",
  });
  assert.match(out, /committed/i);
  assert.match(out, /not pushed|nothing pushed|stays local/i);
});

// The twin: an update that changed nothing on disk has nothing to commit, and must
// not claim a commit that never happened.
test("formatReport — a 'clean' update claims NO commit", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: [],
    regenerated: false,
    reindexed: false,
    committed: "clean",
  });
  assert.doesNotMatch(out, /committed/i);
});

// The third outcome: the tree was left dirty ON PURPOSE, because a conflict was
// pending and staging it would have buried the markers. Saying nothing here would
// leave the owner with a repo that cannot pull and no idea why — the exact silence
// this release exists to end. So it must say it, and name the resolve.
test("formatReport — a 'conflicted' update says the engine files were NOT committed, and why", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: true,
    reindexed: false,
    committed: "conflicted",
  });
  assert.match(out, /not committed|couldn't commit|could not commit/i);
  assert.match(out, /conflict/i);
  assert.doesNotMatch(out, /were committed locally/i);
});

// And the fourth: git was asked, and said no (a machine with no `user.email` is the
// common case). The files are staged and the tree is dirty, so the next pull is
// blocked — the report must not print the reassuring "committed locally" line.
test("formatReport — a 'refused' commit is reported as a failure to commit, not as a commit", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: true,
    reindexed: false,
    committed: "refused",
  });
  assert.match(out, /git refused|could not commit|couldn't commit/i);
  assert.doesNotMatch(out, /were committed locally/i);
});

test("formatReport — schema unchanged → states no reindex was needed (never a misleading 'reindexed')", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: true,
    reindexed: false,
  });
  assert.match(out, /no reindex|unchanged/i);
  assert.doesNotMatch(out, /reindexed —/);
});

// ADR 0026 (decision B): on an upgrader the schema does NOT move, but seeding the
// engine-health note triggers an INCREMENTAL reindex of that one note. The report must
// be honest — never claim "the index format changed" (it didn't) — and say only the
// health-check note was added/indexed, the user's other notes were not re-encoded.
test("formatReport — health-note seed reindex → honest incremental message, not 'index format changed'", () => {
  const out = formatReport({
    ref: "v3.3.0",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts"],
    regenerated: true,
    reindexed: true,
    reindexReason: "health-note-seed",
  });
  assert.doesNotMatch(out, /format changed/i, "must not claim the index format changed on a seed-only reindex");
  assert.match(out, /health[- ]check note|incremental/i, "names the incremental health-check seed");
});

// Finding A (ADR 0025 fix QA): an upgrader must SEE that the update delivered the
// flagship engine skill + registered its MCP server — that is the whole point of
// v3.2.1. Silent delivery leaves the user unaware they finally have the feature.
test("formatReport — names the engine skill(s) it installed and the MCP server(s) it registered", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: ["local-mirror"],
    mcpServersAdded: ["local-mirror"],
  });
  assert.match(out, /local-mirror/);
  assert.match(out, /skill/i);
  assert.match(out, /server|mcp/i);
});

// F-B2 (ADR 0026): an upgrade that wired the v3.3.0 runtime hooks into settings.json must
// NAME them (the user finally has self-heal / health / obsidian-hint) AND fold them into the
// "restart needed" count — a newly-wired SessionStart hook is on disk but loads only at the
// next session start, exactly like a new skill/MCP.
test("formatReport — names the runtime hook(s) it wired and counts them as needing a restart", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: [],
    mcpServersAdded: [],
    hooksAdded: ["scripts/session-self-heal.mjs", "scripts/session-health.mjs", "scripts/session-obsidian-hint.mjs"],
  });
  assert.match(out, /session-self-heal/);
  assert.match(out, /hook/i, "the wired hooks must be named as such");
  assert.match(out, /\b3\b/, "3 wired hooks count as 3 capabilities needing a restart");
  assert.match(out, /action needed/i);
  assert.match(out, /restart/i);
});

// Issue #31: an upgrade of a pre-fix WINDOWS brain heals the broken `cmd /c "…\run-node.cmd"`
// hook/statusLine commands in place. The report must NAME the healed commands so the user knows
// the 'laude' error is gone (bare names; "statusLine" passes through unchanged).
test("formatReport — names the Windows hook command(s) it repaired (issue #31)", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["scripts/lib/rag-launcher.mjs"],
    regenerated: true,
    reindexed: false,
    installedSkills: [],
    mcpServersAdded: [],
    hooksAdded: [],
    hooksRepaired: ["scripts/session-self-heal.mjs", "scripts/auto-push.mjs", "statusLine"],
  });
  assert.match(out, /repair/i, "the healed commands must be reported as a repair");
  assert.match(out, /session-self-heal/);
  assert.match(out, /auto-push/);
  assert.match(out, /statusLine/);
  assert.match(out, /#31/, "point at the issue so the 'laude' fix is traceable");
});

// F1.6 (ADR 0026, point 4): a freshly-installed skill/MCP is on disk but NOT live in
// the CURRENT conversation (Layer B config-freeze). The report must LOUDLY say so and
// tell the user to restart — instead of today's silence that reads as "already usable".
test("formatReport — when capabilities are installed, loudly says they aren't active in THIS conversation yet and to restart", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: ["local-mirror"],
    mcpServersAdded: ["local-mirror"],
  });
  assert.match(out, /not (yet )?active|aren't active/i);
  assert.match(out, /this conversation/i);
  assert.match(out, /restart/i);
  // Strong framing (Thomas): not a polite "to load them" — make the consequence of
  // NOT restarting explicit, so the user actually does it.
  assert.match(out, /action needed/i);
  assert.match(out, /can(?:no|')?t use|won't work/i);
});

// F4: the field finding — a full app restart, then RESUMING this same conversation,
// is enough to pick up a freshly-installed skill+MCP. A brand-new conversation is NOT
// required for that (that's the distinct initial-rooting rule, for a never-rooted
// session). The notice must say "restart and come back here", not muddy it by offering
// "or start a new conversation" as if one were needed just to load new capabilities.
test("formatReport — the activation notice says a restart + resuming THIS conversation is enough, not a brand-new one", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: ["local-mirror"],
    mcpServersAdded: ["local-mirror"],
  });
  // Restart, then come back to THIS conversation (resume) — the lighter sufficient action.
  assert.match(out, /reopen/i);
  assert.match(out, /come back here|this (same )?conversation/i);
  // Do NOT present a brand-new conversation as required for picking up capabilities.
  assert.doesNotMatch(out, /new conversation/i);
});

// F1.6: the "counter" the user reads = how many new capabilities they just gained
// (skills + MCP servers), plus the "run once more" residual-bootstrap fallback for
// the rare case a follow-up pass is still needed.
test("formatReport — counts the new capabilities and offers the 'run once more' fallback", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: ["local-mirror"],
    mcpServersAdded: ["local-mirror"],
  });
  assert.match(out, /\b2\b/); // 1 skill + 1 MCP server = 2 new capabilities
  assert.match(out, /once more/i);
  assert.match(out, /update-engine/);
});

// F-B7d (ship-blocker A1): a steady-state update that swapped engine CODE — but added
// no brand-new skill/MCP/hook — STILL needs a restart: the running MCP server / hooks /
// constitution this session loaded are the OLD ones until Claude is reopened. The report
// must say so LOUDLY (the disease: a "✅ done" with no restart line reads as "already
// live" → the improvement stays trapped behind a stale session). But this is the generic
// restart banner, NOT the new-capability path: no capability counter, no "run once more".
test("formatReport — steady-state code swap (no new capability) still loudly says to restart, without the counter / 'run once more'", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    installedSkills: [],
    mcpServersAdded: [],
  });
  assert.match(out, /restart/i, "swapped engine code → the running session is stale → restart");
  assert.match(out, /action needed/i);
  // Reserved-signal discipline: the capability counter + residual-bootstrap fallback are
  // for ACTUAL new capabilities only — never on a plain code swap.
  assert.doesNotMatch(out, /once more/i);
  assert.doesNotMatch(out, /new capabilit/i);
});

// F-B7d (A1) — the don't-cry-wolf boundary: a genuine no-op (nothing swapped, nothing
// regenerated, no new capability — the brain was already up to date) must NOT mention a
// restart. The restart banner is reserved for an update that actually changed on-disk code.
test("formatReport — a true no-op (nothing swapped or regenerated) does NOT cry restart", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: [],
    regenerated: false,
    reindexed: false,
    installedSkills: [],
    mcpServersAdded: [],
  });
  assert.doesNotMatch(out, /restart/i);
  assert.doesNotMatch(out, /once more/i);
});

// Step 10 (mutation hardening): the regex tests above each pin ONE line, so every
// OTHER line is free to mutate — an emptied literal, a flipped guard, a line that
// appears when it should not. These two assert the WHOLE report, byte for byte: the
// quiet no-op (the floor: only the lines that ALWAYS show) and the everything-on
// update (the ceiling: every optional line at once, in order). Between them every
// prose branch is pinned, both when it fires and when it must stay silent.
test("formatReport — a quiet no-op prints EXACTLY the four always-on lines, nothing else", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: [],
    regenerated: false,
    reindexed: false,
  });
  assert.equal(
    out,
    [
      "✅ Engine updated to v3.6.2 (rag 1.1.4).",
      "   • 0 engine file(s) swapped",
      "   • index format unchanged — no reindex needed",
      "   Your notes, .env, constitution, settings and custom skills were left untouched.",
    ].join("\n"),
  );
});

test("formatReport — an everything-on update prints every optional line, in order, byte for byte", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts", "scripts/auto-commit.mjs"],
    regenerated: true,
    reindexed: true,
    vaultNoteCount: 2,
    // Every list holds TWO entries, deliberately NOT alphabetical: on a single item a
    // dropped separator and a re-sorted list are both invisible.
    installedSkills: ["local-mirror", "coach"],
    mcpServersAdded: ["local-mirror", "vault-rag"],
    skillsRefreshed: ["switch", "coach"],
    // A customized preserve (reported, with its sidecar) next to a no-provenance one
    // (silent by design) — the discriminating pair for the `reason` filter.
    skillsPreserved: [
      { skill: "prepare-1-1", reason: "customized", newVersionPath: ".claude/skills/prepare-1-1/SKILL.md.new" },
      { skill: "import", reason: "no-provenance" },
    ],
    hooksAdded: ["scripts/session-health.mjs", "scripts/session-self-heal.mjs"],
    // "statusLine" is the decoy: it carries neither the `scripts/` prefix nor the
    // `.mjs` suffix, so it must pass through the stripping untouched.
    hooksRepaired: ["scripts/auto-push.mjs", "statusLine"],
  });
  assert.equal(
    out,
    [
      "✅ Engine updated to v3.6.2 (rag 1.1.4).",
      "   • 2 engine file(s) swapped + launchers regenerated",
      "   • reindexed — the index format changed (your notes were re-encoded, nothing lost)",
      "   • your vault holds 2 notes — searchable as the reindex finishes",
      "   • new engine skill(s) installed: local-mirror, coach",
      "   • new MCP server(s) registered: local-mirror, vault-rag",
      "   • engine skill(s) brought up to date: switch, coach",
      '   • your customized "prepare-1-1" skill was kept exactly as you wrote it — the newer engine version sits next to it as .claude/skills/prepare-1-1/SKILL.md.new',
      "   • new runtime hook(s) wired: session-health, session-self-heal",
      "   • repaired Windows hook command(s) (issue #31 — 'laude' error): auto-push, statusLine",
      "   ⚠️ ACTION NEEDED — 6 new capabilities are installed on disk but NOT active in THIS conversation.",
      "   A FULL RESTART of Claude (close it and reopen) is enough: come back to THIS same",
      "   conversation afterwards and your brain can use them. You do NOT need to start a",
      "   brand-new chat for this. Until you restart, your brain CAN'T use them.",
      "   • If still missing after a restart, run /update-engine once more.",
      "   Your notes, .env, constitution, settings and custom skills were left untouched.",
    ].join("\n"),
  );
});

// A manifest with no `engineVersion` block is a broken manifest — but by the time the
// report is printed the update is DONE and recorded, so crashing here would print
// "the brain was NOT changed past this point" over a change that DID happen. Degrade
// honestly instead: say the version is unknown, and keep every other line.
test("formatReport — a target manifest with no engineVersion says so instead of crashing", () => {
  const out = formatReport({ ref: "v3.6.2", copied: [], regenerated: false, reindexed: false });

  assert.equal(
    out,
    [
      "✅ Engine updated to v3.6.2 (rag unknown).",
      "   • 0 engine file(s) swapped",
      "   • index format unchanged — no reindex needed",
      "   Your notes, .env, constitution, settings and custom skills were left untouched.",
    ].join("\n"),
  );
});

// The third shape, between the floor and the ceiling: an upgrader whose schema did NOT
// move (health-note seed only), holding a single note, with a preserve the report must
// stay SILENT about — and the steady-state restart banner, whose wording is a different
// literal from the new-capability one above.
test("formatReport — a steady-state upgrade prints the incremental-reindex + generic-restart wording, byte for byte", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: true,
    reindexReason: "health-note-seed",
    vaultNoteCount: 1,
    skillsPreserved: [{ skill: "coach", reason: "no-provenance" }],
  });
  assert.equal(
    out,
    [
      "✅ Engine updated to v3.6.2 (rag 1.1.4).",
      "   • 1 engine file(s) swapped",
      "   • ensured the engine health-check note is present and indexed (incremental — your other notes were not re-encoded)",
      "   • your vault holds 1 note — searchable as the reindex finishes",
      "   ⚠️ ACTION NEEDED — your engine was updated on disk, but THIS conversation is",
      "   still running the OLD version. A FULL RESTART of Claude (close it and reopen) is",
      "   enough: come back to THIS same conversation afterwards and the update takes effect.",
      "   Until you restart, your brain keeps using the old engine.",
      "   Your notes, .env, constitution, settings and custom skills were left untouched.",
    ].join("\n"),
  );
});

// The boundary of the capability counter (lesson: triangulate the singular/plural pair).
// ONE new capability must read "1 new capability IS installed … can use IT" — the
// ceiling test above pins the plural half of the very same three ternaries.
test("formatReport — exactly one new capability reads in the singular, byte for byte", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: [],
    regenerated: false,
    reindexed: false,
    installedSkills: ["local-mirror"],
  });
  assert.equal(
    out,
    [
      "✅ Engine updated to v3.6.2 (rag 1.1.4).",
      "   • 0 engine file(s) swapped",
      "   • index format unchanged — no reindex needed",
      "   • new engine skill(s) installed: local-mirror",
      "   ⚠️ ACTION NEEDED — 1 new capability is installed on disk but NOT active in THIS conversation.",
      "   A FULL RESTART of Claude (close it and reopen) is enough: come back to THIS same",
      "   conversation afterwards and your brain can use it. You do NOT need to start a",
      "   brand-new chat for this. Until you restart, your brain CAN'T use it.",
      "   • If still missing after a restart, run /update-engine once more.",
      "   Your notes, .env, constitution, settings and custom skills were left untouched.",
    ].join("\n"),
  );
});

// ── Increment 2.5, Step 5: report the SKILL refresh ──────────────────────────
// The whole point of the increment is that a shipped skill improvement finally
// reaches an existing brain. Delivering it silently leaves the user unaware their
// `switch` skill just gained the native-connectors reminder — say which skills
// were brought up to date.
test("formatReport — names the engine skill(s) it refreshed to the new version", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    skillsRefreshed: ["switch", "coach"],
  });
  assert.match(out, /switch, coach/);
  assert.match(out, /skill/i);
  // Not a NEW capability: the skill was already there, only its content moved on.
  assert.doesNotMatch(out, /new engine skill/i);
});

// The other half of the promise: a skill the owner made their own is NEVER
// overwritten, and they are TOLD — with the path of the new version dropped next to
// it, so "I'd like the new bits too" is one question away instead of invisible.
test("formatReport — says which customized skill was preserved, and where its new version sits", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    skillsPreserved: [
      { skill: "prepare-1-1", reason: "customized", newVersionPath: ".claude/skills/prepare-1-1/SKILL.md.new" },
    ],
  });
  assert.match(out, /prepare-1-1/);
  assert.match(out, /\.claude\/skills\/prepare-1-1\/SKILL\.md\.new/);
  assert.match(out, /kept|preserved|as you wrote/i);
});

// Step 1's refinement, carried into the prose: a pre-provenance brain (nothing was
// ever fingerprinted for that file) must NOT be told it customized anything — it
// didn't. There is nothing to decide and nothing to adopt, so the report stays silent
// rather than manufacturing a scary, unactionable line on every single update.
test("formatReport — a preserve with no provenance is NOT reported as a customization", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    skillsPreserved: [{ skill: "coach", reason: "no-provenance" }],
  });
  assert.doesNotMatch(out, /customized/i);
  assert.doesNotMatch(out, /coach/);
});

// A refreshed skill is on disk but THIS conversation loaded the OLD text when it
// started (Layer B config-freeze) — exactly the staleness the restart banner exists
// for. Staying silent because no engine *file* was swapped would let the user try the
// improved skill in a session that cannot see it, and conclude the update lied.
test("formatReport — a refresh-only update still says the running session is stale", () => {
  const out = formatReport({
    ref: "v3.6.2",
    engineVersion: { rag: "1.1.4" },
    copied: [],
    regenerated: false,
    reindexed: false,
    skillsRefreshed: ["switch"],
  });
  assert.match(out, /action needed/i);
  assert.match(out, /restart/i);
  // Still not a NEW capability: no counter, no "run once more" fallback.
  assert.doesNotMatch(out, /once more/i);
  assert.doesNotMatch(out, /new capabilit/i);
});

// F2: the recap must surface the number the USER cares about — how many notes their
// brain holds — not just the maintainer-facing "N engine files swapped" count.
test("formatReport — surfaces the vault note count", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    vaultNoteCount: 9,
  });
  assert.match(out, /9 notes/);
});

test("formatReport — pluralizes the vault note count (1 note, not '1 note(s)')", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    vaultNoteCount: 1,
  });
  assert.match(out, /1 note\b/);
  assert.doesNotMatch(out, /note\(s\)/);
});

test("formatReport — when reindexed, hints that searchability catches up as indexing finishes", () => {
  const out = formatReport({
    ref: "v1.1.0",
    engineVersion: { rag: "1.1.0" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: true,
    vaultNoteCount: 9,
  });
  assert.match(out, /9 note/);
  assert.match(out, /indexing|searchable|catches up/i);
});

// F-B2 (ADR 0026): hooks are wired into settings.json by PATH, and read by the user by
// bare name. The stripping is anchored on purpose — only a LEADING `scripts/` and a
// TRAILING `.mjs` go — so a value that is not a script path ("statusLine") survives
// intact and nothing is chopped out of the middle of a name.
test("bareHookName — strips only a leading scripts/ and a trailing .mjs", () => {
  assert.equal(bareHookName("scripts/session-health.mjs"), "session-health");
  assert.equal(bareHookName("statusLine"), "statusLine", "not a script path — untouched");
  assert.equal(bareHookName("vendor/scripts/probe.mjs"), "vendor/scripts/probe", "scripts/ mid-path is part of the name");
  assert.equal(bareHookName("scripts/probe.mjs.bak"), "probe.mjs.bak", ".mjs mid-name is part of the name");
});

// ── Step 10: the CLI's decisions, extracted OUT of the entry-point block ──────
// They used to live inside `if (isEntrypoint(...))`, unreachable by any test — which
// is why ~40 of the file's 96 surviving mutants clustered there. Pure predicates now.
test("countNewCapabilities — sums the skills, MCP servers and hooks this update delivered", () => {
  assert.equal(
    countNewCapabilities({
      installedSkills: ["local-mirror"],
      mcpServersAdded: ["local-mirror", "vault-rag"],
      hooksAdded: ["scripts/session-health.mjs", "scripts/session-self-heal.mjs", "scripts/auto-push.mjs"],
    }),
    6,
  );
});

// The absent twin: an older reconcile (or a partial report) carries none of the three
// lists. Counting must yield 0 — never NaN, which would make the banner read
// "NaN new capabilities" and, worse, silently falsify every comparison against it.
test("countNewCapabilities — a report carrying none of the three lists counts 0", () => {
  assert.equal(countNewCapabilities({ copied: ["rag/src/index.ts"] }), 0);
});

// Increment 2.5: a refreshed skill is the trigger this branch ADDED — its new text
// loads only at the next session start, so the persistent nudge must be armed even
// though not a single engine file was swapped.
test("needsRestart — a refresh-only update still arms the nudge", () => {
  assert.equal(
    needsRestart({ copied: [], regenerated: false, skillsRefreshed: ["switch"] }),
    true,
  );
});

// The don't-cry-wolf boundary, same as the report banner's: an update that changed
// nothing on disk must leave the nudge disarmed, or the statusLine nags forever.
test("needsRestart — a genuine no-op leaves the nudge disarmed", () => {
  assert.equal(
    needsRestart({ copied: [], regenerated: false, skillsRefreshed: [], installedSkills: [], mcpServersAdded: [], hooksAdded: [] }),
    false,
  );
});

// The absent twin: a report carrying none of the keys at all (an older reconcile, a
// partial report) must answer "no restart needed" — never explode. The optional chains
// are the whole reason this holds, and nothing else exercises them.
test("needsRestart — a report carrying none of the keys answers no, without throwing", () => {
  assert.equal(needsRestart({}), false);
});

// The other three triggers, each ALONE (an OR chain where only one disjunct is ever
// exercised is indistinguishable from that disjunct): a swapped engine file, a mere
// launcher regeneration, and a brand-new capability each stale the running session.
test("needsRestart — a swapped file, a launcher regeneration or a new capability each arm it on their own", () => {
  const base = { copied: [], regenerated: false, skillsRefreshed: [], installedSkills: [], mcpServersAdded: [], hooksAdded: [] };
  assert.equal(needsRestart({ ...base, copied: ["rag/src/index.ts"] }), true, "a swapped engine file");
  assert.equal(needsRestart({ ...base, regenerated: true }), true, "regenerated launchers");
  assert.equal(needsRestart({ ...base, hooksAdded: ["scripts/session-health.mjs"] }), true, "a newly wired hook");
});

// The CLI itself, now a function taking its I/O as deps (the `clear-example-notes`
// idiom): the happy path prints the human report on stdout, arms nothing else, and
// hands the shell a 0.
test("runUpdateCli — prints the report on stdout and exits 0", async () => {
  const out = [];
  const code = await runUpdateCli({
    brainDir: "/brains/mine",
    updateEngine: async ({ brainDir }) => {
      assert.equal(brainDir, "/brains/mine", "the CLI updates the brain it was told about");
      return { ref: "v3.6.2", engineVersion: { rag: "1.1.4" }, copied: [], regenerated: false, reindexed: false };
    },
    armRestartFlag: () => assert.fail("a no-op update must not arm the restart nudge"),
    log: (s) => out.push(s),
    error: (s) => assert.fail(`nothing should reach stderr, got: ${s}`),
  });

  assert.equal(code, 0);
  assert.deepEqual(out, [
    formatReport({ ref: "v3.6.2", engineVersion: { rag: "1.1.4" }, copied: [], regenerated: false, reindexed: false }) + "\n",
  ]);
});

// FAIL LOUD: a failed update must reach stderr with the message AND the "the brain was
// NOT changed past this point" reassurance, print NOTHING on stdout (a report there
// would read as success), and hand the shell a non-zero.
test("runUpdateCli — a failed update goes to stderr, prints no report, and exits 1", async () => {
  const err = [];
  const code = await runUpdateCli({
    brainDir: "/brains/mine",
    updateEngine: async () => {
      throw new Error("git clone failed: host unreachable");
    },
    armRestartFlag: () => assert.fail("a failed update must not arm the restart nudge"),
    log: (s) => assert.fail(`nothing should reach stdout, got: ${s}`),
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, [
    "\n❌ update-engine failed — the brain was NOT changed past this point.\ngit clone failed: host unreachable\n",
  ]);
});

// A thrown non-Error (a rejected string, a bare object) must still print SOMETHING
// usable — the `?? e` fallback, whose absent twin is otherwise never exercised.
test("runUpdateCli — a thrown non-Error still reaches stderr, not an empty 'undefined'", async () => {
  const err = [];
  const code = await runUpdateCli({
    brainDir: "/brains/mine",
    updateEngine: async () => {
      throw "ENOSPC: no space left on device";
    },
    armRestartFlag: () => {},
    log: () => {},
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, [
    "\n❌ update-engine failed — the brain was NOT changed past this point.\nENOSPC: no space left on device\n",
  ]);
});

// The wiring the no-op test above can only prove NEGATIVELY: an update that did place
// something on disk arms the nudge, ONCE, in the brain it just updated (a flag armed in
// the wrong folder nudges nobody).
test("runUpdateCli — an update that changed something arms the nudge in that brain, once", async () => {
  const armed = [];
  const code = await runUpdateCli({
    brainDir: "/brains/mine",
    updateEngine: async () => ({
      ref: "v3.6.2",
      engineVersion: { rag: "1.1.4" },
      copied: [],
      regenerated: false,
      reindexed: false,
      skillsRefreshed: ["switch"],
    }),
    armRestartFlag: (dir) => armed.push(dir),
    log: () => {},
    error: (s) => assert.fail(`nothing should reach stderr, got: ${s}`),
  });

  assert.equal(code, 0);
  assert.deepEqual(armed, ["/brains/mine"]);
});

// The bottom of the barrel: a rejection with NO reason at all (a `throw null`, an
// aborted child). The banner must still say something a human can act on — printing a
// bare "null" under a ❌ is the same dead end as printing nothing.
test("runUpdateCli — a rejection with no reason still explains itself", async () => {
  const err = [];
  const code = await runUpdateCli({
    brainDir: "/brains/mine",
    updateEngine: async () => {
      throw null;
    },
    armRestartFlag: () => {},
    log: () => {},
    error: (s) => err.push(s),
  });

  assert.equal(code, 1);
  assert.deepEqual(err, [
    "\n❌ update-engine failed — the brain was NOT changed past this point.\nno reason given\n",
  ]);
});

// …and the last untested link: that the entry-point guard actually FIRES. Bug B2 was
// exactly this — a hand-rolled `file://` comparison that silently never matched, so
// running the command did nothing at all and said nothing about it. Everything above
// can be green while the script is a no-op, so run it for real, as a process.
// Safe by construction: the COMMITTED launcher manifest pins no `source`
// (engine-manifest-integrity enforces it), so the run fails on that before it can
// fetch, write or touch anything.
test("the CLI entry point actually runs the update (and fails LOUDLY, never silently)", () => {
  const script = resolve(dirname(fileURLToPath(import.meta.url)), "../update-engine.mjs");

  const r = spawnSync(process.execPath, [script], { encoding: "utf8" });

  assert.equal(r.status, 1, "a script that silently does nothing would exit 0");
  assert.match(r.stderr, /❌ update-engine failed/);
  assert.match(r.stderr, /no source repo recorded/);
  assert.equal(r.stdout, "", "a failed update must not print a success report");
});

// The wiring itself — the one thing `runUpdateCli(deps)` can never prove, since every
// test hands it doubles. If `realUpdateDeps` pointed at the wrong folder or at a
// swallowing stream, the CLI would run flawlessly against nothing and say so.
test("realUpdateDeps — points at the brain the script lives in, and at the real streams", () => {
  const brainRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  assert.equal(realUpdateDeps.brainDir, brainRoot, "brainDir = the parent of scripts/, i.e. the brain itself");
  assert.equal(realUpdateDeps.armRestartFlag, armRestartFlag);
  assert.equal(realUpdateDeps.updateEngine.name, "updateEngine");

  const outs = [];
  const errs = [];
  const [realOut, realErr] = [process.stdout.write, process.stderr.write];
  process.stdout.write = (s) => outs.push(s) && true;
  process.stderr.write = (s) => errs.push(s) && true;
  try {
    realUpdateDeps.log("the report\n");
    realUpdateDeps.error("the failure\n");
  } finally {
    [process.stdout.write, process.stderr.write] = [realOut, realErr];
  }
  assert.deepEqual(outs, ["the report\n"], "the report goes to stdout");
  assert.deepEqual(errs, ["the failure\n"], "the failure goes to stderr, never mixed into the report");
});

// The flag write itself: it lands where `session-self-heal` / the statusLine look for
// it, with a body a human can read if they ever open it — and it creates the `.cache/`
// folder, which a freshly-installed brain does not have yet.
test("armRestartFlag — drops the nudge file under the brain, creating .cache/ if needed", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-flag-"));

  armRestartFlag(brainDir);

  assert.equal(
    readFileSync(join(brainDir, RESTART_FLAG_REL), "utf8"),
    "restart needed to finish the engine update\n",
  );
});

// The common case, and the one a non-recursive mkdir would break: `.cache/` is already
// there (every brain past its first session has it) and the flag was cleared by a
// converged session. Re-arming must still drop the file, not blow up on EEXIST and get
// swallowed by the fail-soft catch — which would silently stop nudging forever.
test("armRestartFlag — re-arms in a brain whose .cache/ already exists", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-flag-again-"));
  mkdirSync(join(brainDir, dirname(RESTART_FLAG_REL)), { recursive: true });

  armRestartFlag(brainDir);

  assert.equal(
    readFileSync(join(brainDir, RESTART_FLAG_REL), "utf8"),
    "restart needed to finish the engine update\n",
  );
});

// Fail-soft: the nudge is a convenience on top of an update that ALREADY succeeded and
// is ALREADY recorded. A read-only `.cache/`, a full disk — none of it may turn a good
// update into a failure the user reads as "my brain was not updated".
test("armRestartFlag — an unwritable brain never throws (the update already succeeded)", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-flag-ro-"));
  // A FILE where the `.cache` directory should go → mkdir + write both fail.
  writeFileSync(join(brainDir, ".cache"), "not a directory\n");

  assert.doesNotThrow(() => armRestartFlag(brainDir));
});

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

// The files a user has made their own — Personal Extensions + Content. The gate's
// whole point: these must come out byte-for-byte unchanged. (vault note carries the
// "Mollecuisse" canary so a stray reindex-from-scratch wouldn't silently lose it.)
const SACRED = {
  "CLAUDE.md": "# My personalized constitution\nI tailored this. Do not touch.\n",
  ".env": "GOOGLE_GEMINI_API_KEY=super-secret-do-not-leak\nEMBED_BATCH=4\n",
  ".claude/settings.json": '{\n  "mine": true,\n  "permissions": { "allow": ["Bash(open:*)"] }\n}\n',
  ".claude/skills/zzz-mine/SKILL.md": "---\nname: zzz-mine\n---\nMy home-made skill.\n",
  "vault/my-note.md": "# Mollecuisse\nThe canary that must never be lost.\n",
};

// Engine files, keyed by manifest regime. vA = what the brain ships now; the source
// builder writes the SAME paths with vB content so the swap is observable.
function engineFiles(tag) {
  return {
    replace: {
      "rag/src/index.ts": `// engine ${tag}\nexport const VERSION = "${tag}";\n`,
      "rag/package.json": `{ "name": "rag", "engineTag": "${tag}" }\n`,
    },
    regenerate: {
      "rag/launch.sh": `#!/usr/bin/env bash\n# launcher ${tag}\n`,
      "rag/launch.cmd": `@rem launcher ${tag}\r\n`,
      "scripts/run-node.sh": `#!/usr/bin/env bash\n# run-node ${tag}\n`,
      "scripts/run-node.cmd": `@rem run-node ${tag}\r\n`,
    },
    // Engine-owned scripts live under the manifest's `merge` regime but are
    // REPLACED in Phase 1 (Option 1) — incl. update-engine.mjs itself (self-update).
    engineScripts: {
      "scripts/auto-commit.mjs": `// auto-commit ${tag}\n`,
      "scripts/auto-push.mjs": `// auto-push ${tag}\n`,
      "scripts/status-line.mjs": `// status-line ${tag}\n`,
      "scripts/verify-rag.mjs": `// verify-rag ${tag}\n`,
      "scripts/update-engine.mjs": `// update-engine ${tag} (self-updating)\n`,
    },
  };
}

// fingerprint, as engine-source records it (self-describing sha256) — used to assert
// the provenance base is preserved / refreshed correctly after the swap (Step 5).
function fp(content) {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

function manifest({ ragVersion, indexSchemaVersion, ref, provenance = {}, extraMerge = [] }) {
  return JSON.stringify(
    {
      manifestVersion: 1,
      engineVersion: { rag: ragVersion, constitutionTemplate: "1.0.0", scripts: "1.0.0" },
      indexSchemaVersion,
      regimes: {
        replace: ["rag/src/**", "rag/package.json"],
        regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
        merge: [
          "CLAUDE.md",
          ".claude/settings.json",
          ".claude/skills/zzz-mine/**",
          "scripts/auto-commit.mjs",
          "scripts/auto-push.mjs",
          "scripts/status-line.mjs",
          "scripts/verify-rag.mjs",
          "scripts/update-engine.mjs",
          ...extraMerge,
        ],
      },
      engineMcpServers: ["vault-rag"],
      source: { repo: "https://example.test/launcher.git", ref },
      provenance,
    },
    null,
    2,
  );
}

function flat(files) {
  return { ...files.replace, ...files.regenerate, ...files.engineScripts };
}

// A brain pinned at vA: engine files (vA) + the user's sacred files + manifest.
function buildBrain() {
  const dir = mkdtempSync(join(tmpdir(), "sbg-brain-"));
  for (const [rel, content] of Object.entries(flat(engineFiles("vA")))) writeFile(dir, rel, content);
  for (const [rel, content] of Object.entries(SACRED)) writeFile(dir, rel, content);
  writeFile(
    dir,
    "engine-manifest.json",
    manifest({
      ragVersion: "1.0.0",
      indexSchemaVersion: 1,
      ref: "v1.0.0",
      // The base the engine last delivered: a user merge file (CLAUDE.md) + a vA
      // engine script. Step 5 must PRESERVE the former (never re-delivered) and
      // REFRESH the latter (re-delivered as vB).
      provenance: {
        "CLAUDE.md": fp(SACRED["CLAUDE.md"]),
        "scripts/auto-commit.mjs": fp(engineFiles("vA").engineScripts["scripts/auto-commit.mjs"]),
      },
    }),
  );
  return dir;
}

// A freshly-cloned launcher source at vB: engine files (vB) + its manifest. (It does
// NOT carry the brain's sacred files — those belong to the brain alone.)
function buildSource({ indexSchemaVersion }) {
  const dir = mkdtempSync(join(tmpdir(), "sbg-source-"));
  for (const [rel, content] of Object.entries(flat(engineFiles("vB")))) writeFile(dir, rel, content);
  writeFile(dir, "engine-manifest.json", manifest({ ragVersion: "1.1.0", indexSchemaVersion, ref: "v1.1.0" }));
  return dir;
}

// Snapshot the sacred files' bytes so we can prove byte-identity after the upgrade.
function snapshotSacred(brainDir) {
  const snap = {};
  for (const rel of Object.keys(SACRED)) snap[rel] = sha256(join(brainDir, rel));
  return snap;
}

function assertSacredUntouched(brainDir, before) {
  for (const rel of Object.keys(SACRED)) {
    assert.equal(
      sha256(join(brainDir, rel)),
      before[rel],
      `SACRED file changed — ${rel} must be byte-identical after an engine upgrade`,
    );
  }
}

// Run the core with the network/npm/reindex SEAMS stubbed. fetchSource hands back the
// prepared source dir (stands in for `git clone --depth 1 --branch <ref>`); the calls
// object records the side effects we assert on.
async function runUpdate({ brainDir, sourceDir, platform, resolveLatestTag, countVaultNotes }) {
  const updateEngine = await loadCore();
  const calls = { install: [], reindex: [], regenerate: [], finalize: [], commit: [], order: [] };
  const report = await updateEngine({
    brainDir,
    platform,
    countVaultNotes: countVaultNotes ?? (async () => 0),
    // Persistence seam: an update rewrites VERSIONED engine files, and nothing
    // else commits them (the brain's auto-commit only fires on a session write).
    // Left uncommitted they block the next SessionStart `git pull --rebase`.
    // Returns a value no real implementation would produce, so the wiring is
    // proven by the report rather than by a plausible-looking default.
    commitEngineWrites: ({ brainDir: bd, ref: r }) => {
      calls.commit.push({ brainDir: bd, ref: r });
      calls.order.push("commit");
      return "committed-by-fake";
    },
    // Auto-finalize (ADR 0026, Layer A): the real seam re-execs the reconciler in a
    // fresh child process. Stubbed here so no test spawns a real node process; we just
    // record that update-engine asked for the finalize pass with the right inputs.
    finalizeReconcile: async ({ brainDir: bd, sourceDir: sd, platform: p }) => {
      calls.finalize.push({ brainDir: bd, sourceDir: sd, platform: p });
      calls.order.push("finalize");
    },
    // The launcher's latest release tag on the remote (ADR 0017). Default = the
    // target's version; overridable to exercise the offline/no-tag fallback. The
    // committed launcher manifest has NO `source`, so this — not target.source —
    // is the single thing that advances the brain's recorded ref.
    resolveLatestTag: async (arg) => {
      calls.resolveTag = arg;
      return resolveLatestTag ? resolveLatestTag(arg) : "v1.1.0";
    },
    fetchSource: async ({ repo, ref }) => {
      calls.fetch = { repo, ref };
      return sourceDir;
    },
    regenerateLaunchers: async ({ brainDir: bd, platform: p }) => {
      // The real seam calls the rag-launcher.mjs builders (pure, machine-independent).
      // ADR 0015: BOTH halves are (re)written regardless of the host platform.
      calls.regenerate.push(p);
      for (const rel of ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"]) {
        writeFile(bd, rel, `# regenerated ${rel} (${p})\n`);
      }
    },
    runInstall: async ({ ragDir }) => {
      calls.install.push(ragDir);
    },
    runReindex: async ({ brainDir: bd }) => {
      calls.reindex.push(bd);
    },
  });
  return { report, calls };
}

for (const platform of ["posix", "win32"]) {
  test(`gate [${platform}] — engine swapped to vB, schema moved → reindex, user files untouched`, async (t) => {
    const brainDir = buildBrain();
    const sourceDir = buildSource({ indexSchemaVersion: 2 }); // schema 1 → 2
    t.after(() => {
      rmSync(brainDir, { recursive: true, force: true });
      rmSync(sourceDir, { recursive: true, force: true });
    });
    const before = snapshotSacred(brainDir);

    const { calls } = await runUpdate({ brainDir, sourceDir, platform });

    // 0. The engine was fetched at the RESOLVED latest tag (not the brain's pinned
    //    ref) — this is what makes the displayed Version actually advance (ADR 0017).
    assert.equal(calls.fetch.ref, "v1.1.0", "must fetch the resolved latest tag, not the old pinned ref");
    //    …and the tag was looked up on the repo the BRAIN recorded. Ask without it and
    //    the lookup answers null, the update silently re-pulls the pinned ref forever,
    //    and the brain never advances a single version.
    assert.deepEqual(
      calls.resolveTag,
      { repo: "https://example.test/launcher.git" },
      "the latest tag must be resolved on the brain's recorded source repo",
    );

    // 1. Every COPIED engine file now carries the vB bytes — the `replace` bucket and
    //    the engine-owned scripts (incl. update-engine.mjs self-update). The launchers
    //    are not copied: they are regenerated (asserted just below).
    const expected = { ...engineFiles("vB").replace, ...engineFiles("vB").engineScripts };
    for (const [rel, content] of Object.entries(expected)) {
      assert.equal(
        readFileSync(join(brainDir, rel), "utf8"),
        content,
        `engine file not upgraded to vB — ${rel}`,
      );
    }
    // 1.bis The launchers were REGENERATED (ADR 0015), not copied: the seam ran once
    //       for this platform, and BOTH `.sh` and `.cmd` halves are present.
    assert.deepEqual(calls.regenerate, [platform], "launchers must be regenerated once, for this platform");
    assert.ok(existsSync(join(brainDir, "rag/launch.sh")), "the .sh launcher must exist");
    assert.ok(existsSync(join(brainDir, "rag/launch.cmd")), "the .cmd launcher must exist");
    assert.ok(existsSync(join(brainDir, "scripts/run-node.sh")), "the .sh node-runner must exist");
    assert.ok(existsSync(join(brainDir, "scripts/run-node.cmd")), "the .cmd node-runner must exist");

    // 2. npm install ran in the brain's rag/.
    assert.deepEqual(calls.install, [join(brainDir, "rag")], "npm install must run once in <brain>/rag");

    // 3. Index schema moved (1 → 2) → reindex ran in the brain.
    assert.deepEqual(calls.reindex, [brainDir], "schema moved → reindex must run once in the brain");

    // 4. THE SURVIVAL GUARANTEE: not one sacred byte changed.
    assertSacredUntouched(brainDir, before);

    // 5. The brain's manifest now records the new version + the ref it pulled.
    const manifestText = readFileSync(join(brainDir, "engine-manifest.json"), "utf8");
    // The brain is a git repo whose hook commits this file: a manifest written without
    // its trailing newline shows up as a "\ No newline at end of file" diff on every
    // single update, forever.
    assert.equal(manifestText.endsWith("}\n"), true, "the manifest must be written with a trailing newline");
    const m = JSON.parse(manifestText);
    assert.equal(m.engineVersion.rag, "1.1.0", "manifest engineVersion.rag must be bumped to the target");
    assert.equal(m.indexSchemaVersion, 2, "manifest indexSchemaVersion must follow the target");
    assert.equal(m.source.ref, "v1.1.0", "manifest source.ref must ADVANCE to the resolved latest tag");

    // 6. PROVENANCE RE-SEED (Step 5): the base for the re-delivered engine script is
    //    refreshed to vB, while the user merge file's base (never touched) is preserved
    //    — so Phase 2's 3-way still detects any edit the user made to CLAUDE.md.
    assert.equal(
      m.provenance["scripts/auto-commit.mjs"],
      fp(engineFiles("vB").engineScripts["scripts/auto-commit.mjs"]),
      "re-delivered engine script's provenance base must be refreshed to vB",
    );
    assert.equal(
      m.provenance["CLAUDE.md"],
      fp(SACRED["CLAUDE.md"]),
      "an untouched user merge file's provenance base must be preserved",
    );
  });
}

// ── Auto-finalize (ADR 0026, Layer A): after a successful update, update-engine
//    re-execs the freshly-written reconciler in a fresh child process — given the SAME
//    sourceDir it fetched — so the just-installed converge logic runs in ONE invocation
//    (kills the 2-cycle). Here we assert the wiring: the seam is invoked once, last,
//    with the brain + the fetched source.
test("gate — auto-finalizes once after the update, handing the child the fetched source (ADR 0026)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource({ indexSchemaVersion: 1 });
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  const { calls } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  assert.deepEqual(
    calls.finalize,
    [{ brainDir, sourceDir, platform: "posix" }],
    "update-engine must auto-finalize exactly once, handing the child the brain dir + the fetched source",
  );
});

// ── An update rewrites VERSIONED engine files (manifest, scripts/lib/**, launchers).
//    Nothing else commits them: the brain's auto-commit is a hook fired by a session
//    WRITE, so a user who only reads for days never triggers it — and meanwhile the
//    SessionStart `git pull --rebase` refuses to run on a dirty tree, so the brain
//    silently stops syncing on every start. The update therefore owns the commit,
//    and owns it LAST: auto-finalize (step 8) writes too, so committing before it
//    would leave exactly the files it just wrote behind.
test("gate — an update COMMITS what it wrote, AFTER the auto-finalize wrote its share", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource({ indexSchemaVersion: 1 });
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  const { calls } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  assert.deepEqual(
    calls.commit,
    [{ brainDir, ref: "v1.1.0" }],
    "the update must commit its own writes exactly once, naming the version it moved to",
  );
  assert.deepEqual(
    calls.order,
    ["finalize", "commit"],
    "commit LAST — auto-finalize writes files, so an earlier commit leaves them dirty",
  );
});

// ── #1 (code-review): a best-effort auto-finalize child failure must NEVER turn an
//    already-recorded, already-successful update into a reported FAILURE. The update is
//    done + recorded at step 7; step 8 (auto-finalize) is a finisher on top. A flaky
//    npm install / ABI hiccup in the fresh child must fail SOFT — updateEngine still
//    RESOLVES with the recorded report (the CLI never prints "the brain was NOT changed").
test("gate — a failing auto-finalize child does NOT reject the update (fail-soft, ADR 0026)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource({ indexSchemaVersion: 1 });
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  const updateEngine = await loadCore();
  const report = await updateEngine({
    brainDir,
    platform: "posix",
    countVaultNotes: async () => 7,
    resolveLatestTag: async () => "v1.1.0",
    fetchSource: async () => sourceDir,
    regenerateLaunchers: async () => {},
    runInstall: async () => {},
    runReindex: async () => {},
    // The finalize child blows up (flaky npm install in the fresh process, ABI skew…).
    finalizeReconcile: async () => {
      throw new Error("npm install failed in the auto-finalize child");
    },
  });

  // The update still succeeded: it resolved with the recorded report, and the manifest
  // already advanced — a finisher failure must never read as "the brain was NOT changed".
  assert.equal(report.engineVersion.rag, "1.1.0");
  const m = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(m.engineVersion.rag, "1.1.0", "the update is recorded even if auto-finalize fails");
});

test("gate — schema UNCHANGED → engine still swapped but NO reindex", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource({ indexSchemaVersion: 1 }); // same schema as the brain
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const before = snapshotSacred(brainDir);

  const { calls } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  assert.equal(
    readFileSync(join(brainDir, "rag/src/index.ts"), "utf8"),
    engineFiles("vB").replace["rag/src/index.ts"],
    "engine must still be swapped even when the index schema did not move",
  );
  assert.deepEqual(calls.install, [join(brainDir, "rag")], "npm install must still run");
  assert.deepEqual(calls.reindex, [], "schema unchanged → reindex must NOT run");
  assertSacredUntouched(brainDir, before);
});

// ── ANTI-REGRESSION (PR #10 QA findings): update-engine must apply the SAME two
//    refinements the installer does over the manifest globs (see engine-copy-select):
//    F1 — never leak the dev-only scripts/lib/eval-*/mcp-search.* into a brain;
//    F2 — never overwrite the brain's locale-owned scripts/lib/demo-locale.mjs.
//    The source declares `scripts/lib/**` under `replace` (as the real launcher does),
//    so a naive glob copy would drag both in.
test("gate — F1/F2: dev-only files never land, and the brain keeps its installed locale", async (t) => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-brain-loc-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-source-loc-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  // A brain installed with --lang fr: its demo-locale marker reads "fr".
  const brainLocaleFr = '// demo-locale (fr overlay)\nexport const BRAIN_LOCALE = "fr";\n';
  writeFile(brainDir, "scripts/lib/demo-locale.mjs", brainLocaleFr);
  writeFile(brainDir, "scripts/lib/engine-fetch.mjs", "// engine-fetch vA\n");
  writeFile(brainDir, "rag/src/index.ts", "// engine vA\n");
  for (const [rel, content] of Object.entries(SACRED)) writeFile(brainDir, rel, content);
  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        manifestVersion: 1,
        engineVersion: { rag: "1.0.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
        indexSchemaVersion: 1,
        regimes: { replace: ["rag/src/**", "scripts/lib/**"], regenerate: [], merge: [] },
        source: { repo: "https://example.test/launcher.git", ref: "v1.0.0" },
        provenance: {},
      },
      null,
      2,
    ),
  );

  // The fetched source: a newer engine-fetch, dev-only files, a ROOT demo-locale ("en")
  // and the fr/en locale owners under templates/.
  writeFile(sourceDir, "rag/src/index.ts", "// engine vB\n");
  writeFile(sourceDir, "scripts/lib/engine-fetch.mjs", "// engine-fetch vB\n");
  writeFile(sourceDir, "scripts/lib/eval-set.mjs", "// dev-only eval tooling\n");
  writeFile(sourceDir, "scripts/lib/mcp-search.mjs", "// dev-only mcp-search\n");
  writeFile(sourceDir, "scripts/lib/demo-locale.mjs", '// root\nexport const BRAIN_LOCALE = "en";\n');
  writeFile(sourceDir, "templates/fr/scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  writeFile(sourceDir, "templates/en/scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "en";\n');
  writeFile(
    sourceDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        manifestVersion: 1,
        engineVersion: { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
        indexSchemaVersion: 1,
        regimes: { replace: ["rag/src/**", "scripts/lib/**"], regenerate: [], merge: [] },
        source: { repo: "https://example.test/launcher.git", ref: "v1.1.0" },
        provenance: {},
      },
      null,
      2,
    ),
  );

  await runUpdate({ brainDir, sourceDir, platform: "posix" });

  // A real engine lib WAS swapped to vB…
  assert.equal(readFileSync(join(brainDir, "scripts/lib/engine-fetch.mjs"), "utf8"), "// engine-fetch vB\n");
  // …but F1: the dev-only files never landed.
  assert.equal(existsSync(join(brainDir, "scripts/lib/eval-set.mjs")), false, "F1: eval-* must not leak into the brain");
  assert.equal(existsSync(join(brainDir, "scripts/lib/mcp-search.mjs")), false, "F1: mcp-search must not leak into the brain");
  // …and F2: the brain KEEPS its installed fr locale marker (not overwritten by root "en").
  assert.equal(
    readFileSync(join(brainDir, "scripts/lib/demo-locale.mjs"), "utf8"),
    brainLocaleFr,
    "F2: update-engine must not overwrite the brain's locale-owned demo-locale.mjs (fr→en regression)",
  );
});

// ── Lot A (ADR 0025): an engine update INSTALLS a missing engine-declared MERGE skill
//    (additive, install-if-absent) — illustrated by `coach` (local-mirror relocated to
//    the staged engine-skills/ path, F-B7 2b) — while never touching a non-declared /
//    custom skill.
test("gate — installs a MISSING engine-declared skill (install-if-absent); custom skill stays untouched", async (t) => {
  const brainDir = buildBrain(); // ships zzz-mine (custom), NO coach skill
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-source-skill-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const before = snapshotSacred(brainDir);

  // The fetched launcher carries the engine files (vB) + a NEW engine skill, and its
  // manifest declares that skill path as engine-owned (under `merge`).
  for (const [rel, content] of Object.entries(flat(engineFiles("vB")))) writeFile(sourceDir, rel, content);
  const skillBody = "---\nname: coach\n---\nYour sparring partner.\n";
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", skillBody);
  writeFile(
    sourceDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        manifestVersion: 1,
        engineVersion: { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
        indexSchemaVersion: 1,
        regimes: {
          replace: ["rag/src/**", "rag/package.json"],
          regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
          merge: [
            "CLAUDE.md",
            ".claude/settings.json",
            ".claude/skills/coach/**", // the NEW engine skill, declared engine-owned
            "scripts/auto-commit.mjs",
            "scripts/auto-push.mjs",
            "scripts/status-line.mjs",
            "scripts/verify-rag.mjs",
            "scripts/update-engine.mjs",
          ],
        },
        engineMcpServers: ["vault-rag"],
        source: { repo: "https://example.test/launcher.git", ref: "v1.1.0" },
        provenance: {},
      },
      null,
      2,
    ),
  );

  assert.equal(
    existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")),
    false,
    "precondition: the brain must lack the engine skill before the update",
  );

  const { report } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  // The engine installed the missing skill from the fetched source…
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/coach/SKILL.md"), "utf8"),
    skillBody,
    "a missing engine-declared merge skill must be installed on update",
  );
  // …and the report names it (so the user SEES they got the feature, finding A).
  assert.deepEqual(
    report.installedSkills,
    ["coach"],
    "the report must name the engine skill(s) it installed",
  );
  // …and the user's custom skill + every sacred file stayed byte-identical.
  assertSacredUntouched(brainDir, before);
});

test("gate — an ALREADY-PRESENT engine skill is preserved byte-identical (never clobbered, install-if-absent)", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-source-skill2-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  // The brain already carries a USER-CUSTOMIZED coach skill.
  const customized = "---\nname: coach\n---\nMY OWN tweaks — do not overwrite.\n";
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", customized);
  const beforeHash = sha256(join(brainDir, ".claude/skills/coach/SKILL.md"));

  // The fetched launcher carries a DIFFERENT version of the same skill + declares it.
  for (const [rel, content] of Object.entries(flat(engineFiles("vB")))) writeFile(sourceDir, rel, content);
  writeFile(sourceDir, ".claude/skills/coach/SKILL.md", "---\nname: coach\n---\nEngine default.\n");
  writeFile(
    sourceDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        manifestVersion: 1,
        engineVersion: { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
        indexSchemaVersion: 1,
        regimes: {
          replace: ["rag/src/**", "rag/package.json"],
          regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
          merge: [".claude/skills/coach/**", "scripts/update-engine.mjs"],
        },
        engineMcpServers: ["vault-rag"],
        source: { repo: "https://example.test/launcher.git", ref: "v1.1.0" },
        provenance: {},
      },
      null,
      2,
    ),
  );

  await runUpdate({ brainDir, sourceDir, platform: "posix" });

  assert.equal(
    sha256(join(brainDir, ".claude/skills/coach/SKILL.md")),
    beforeHash,
    "a present (customized) engine skill must be preserved byte-identical — install-if-absent never overwrites",
  );
});

// ── Lot B (ADR 0025): an engine update RECONCILES .mcp.json against the manifest's
//    engineMcpServers — registering a newly-shipped engine server (local-mirror) from
//    the fetched .mcp.json.template (cwd → the brain dir), while preserving every
//    existing server (vault-rag + any user-added one) and staying idempotent.
test("gate — registers a missing engine MCP server in .mcp.json (from the template), preserving existing servers", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-source-mcp-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  // The brain's .mcp.json: only vault-rag + a user-added server (must both survive).
  writeFile(
    brainDir,
    ".mcp.json",
    JSON.stringify(
      {
        mcpServers: {
          "vault-rag": { type: "stdio", command: "npx", args: ["tsx", "rag/src/index.ts"], cwd: brainDir, env: {} },
          "my-tool": { type: "stdio", command: "node", args: ["my-tool.js"], cwd: brainDir, env: {} },
        },
      },
      null,
      2,
    ),
  );

  // The fetched launcher: engine files (vB) + a .mcp.json.template declaring both
  // engine servers with the {{PROJECT_ROOT}} placeholder + a manifest listing them.
  for (const [rel, content] of Object.entries(flat(engineFiles("vB")))) writeFile(sourceDir, rel, content);
  writeFile(
    sourceDir,
    ".mcp.json.template",
    JSON.stringify(
      {
        mcpServers: {
          "vault-rag": { type: "stdio", command: "npx", args: ["tsx", "rag/src/index.ts"], cwd: "{{PROJECT_ROOT}}", env: {} },
          "local-mirror": { type: "stdio", command: "npx", args: ["tsx", "local-mirror/src/server.ts"], cwd: "{{PROJECT_ROOT}}", env: {} },
        },
      },
      null,
      2,
    ),
  );
  writeFile(
    sourceDir,
    "engine-manifest.json",
    JSON.stringify(
      {
        manifestVersion: 1,
        engineVersion: { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
        indexSchemaVersion: 1,
        regimes: {
          replace: ["rag/src/**", "rag/package.json"],
          regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
          merge: ["scripts/update-engine.mjs"],
        },
        engineMcpServers: ["vault-rag", "local-mirror"],
        source: { repo: "https://example.test/launcher.git", ref: "v1.1.0" },
        provenance: {},
      },
      null,
      2,
    ),
  );

  const { report } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  const mcp = JSON.parse(readFileSync(join(brainDir, ".mcp.json"), "utf8"));
  // The missing engine server is now registered, with its cwd pointing at THIS brain.
  assert.ok(mcp.mcpServers["local-mirror"], "the missing engine server must be registered on update");
  // The report names only the server it actually ADDED (vault-rag was already there).
  assert.deepEqual(
    report.mcpServersAdded,
    ["local-mirror"],
    "the report must name the MCP server(s) it registered (only the newly-added one)",
  );
  // {{PROJECT_ROOT}} is substituted POSIX-normalised (cf. reconcile-brain.mjs / installer
  // toPosix), so on Windows the expectation must normalise too — a no-op on POSIX.
  assert.equal(mcp.mcpServers["local-mirror"].cwd, brainDir.split("\\").join("/"), "{{PROJECT_ROOT}} must resolve to the brain dir");
  assert.deepEqual(
    mcp.mcpServers["local-mirror"].args,
    ["tsx", "local-mirror/src/server.ts"],
    "the server definition must come from the fetched template",
  );
  // Existing servers — engine AND user-added — are preserved untouched.
  assert.ok(mcp.mcpServers["vault-rag"], "the existing vault-rag server must be preserved");
  assert.ok(mcp.mcpServers["my-tool"], "the user-added server must be preserved");
});

test("gate — no tag resolvable (offline / no semver tag) → fall back to the pinned ref, update still applies", async (t) => {
  const brainDir = buildBrain(); // pinned at v1.0.0
  const sourceDir = buildSource({ indexSchemaVersion: 1 });
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  const { calls } = await runUpdate({
    brainDir,
    sourceDir,
    platform: "posix",
    resolveLatestTag: async () => null, // remote unreachable / no semver tag
  });

  // The fetch falls back to the brain's recorded ref → the update still proceeds…
  assert.equal(calls.fetch.ref, "v1.0.0", "no resolvable tag → fetch the pinned ref (never undefined)");
  // …and the recorded ref stays the pinned one (we never invent a version).
  const m = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(m.source.ref, "v1.0.0", "with no resolvable tag the ref is preserved, not blanked");
});

// F2 (2a): the core returns the vault note count (via an injectable seam, like
// runReindex) so the recap can surface it. The seam is called and its value flows
// onto the returned report.
test("gate — returns the vault note count from the injected seam", async (t) => {
  const brainDir = buildBrain();
  const sourceDir = buildSource({ indexSchemaVersion: 1 });
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  const { report } = await runUpdate({
    brainDir,
    sourceDir,
    platform: "posix",
    countVaultNotes: async () => 42,
  });

  assert.equal(report.vaultNoteCount, 42);
});

// ── Increment 2.5 / trap T1 — the parent's step 7 must not lose the reseed ────
// When the in-process reconcile refreshes a skill, step 7 rewrites the manifest from
// the `local` copy it read BEFORE reconciling. Unless the refreshed files are folded
// into the re-seed, the skill's base stays at the OLD content and the very next update
// classifies it "user-modified" — the feature would die after one use.
test("updateEngine — a refreshed skill's provenance base is re-seeded by step 7", async (t) => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-brain-refresh-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-source-refresh-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const delivered = "---\nname: switch\n---\nSwitch universes.\n";
  const improved = delivered + "\nSingle-account native-connectors reminder.\n";
  const extraMerge = [".claude/skills/switch/**"];
  for (const [rel, content] of Object.entries(flat(engineFiles("vA")))) writeFile(brainDir, rel, content);
  writeFile(brainDir, ".claude/skills/switch/SKILL.md", delivered);
  writeFile(
    brainDir,
    "engine-manifest.json",
    manifest({
      ragVersion: "1.0.0",
      indexSchemaVersion: 1,
      ref: "v1.0.0",
      extraMerge,
      provenance: { ".claude/skills/switch/SKILL.md": fp(delivered) },
    }),
  );
  for (const [rel, content] of Object.entries(flat(engineFiles("vB")))) writeFile(sourceDir, rel, content);
  writeFile(sourceDir, ".claude/skills/switch/SKILL.md", improved);
  writeFile(
    sourceDir,
    "engine-manifest.json",
    manifest({ ragVersion: "1.1.0", indexSchemaVersion: 1, ref: "v1.1.0", extraMerge }),
  );

  const { report } = await runUpdate({ brainDir, sourceDir, platform: "posix" });

  assert.deepEqual(report.skillsRefreshed, ["switch"]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/switch/SKILL.md"), "utf8"), improved);
  const m = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.equal(
    m.provenance[".claude/skills/switch/SKILL.md"],
    fp(improved),
    "step 7 must re-seed the base of what the reconcile just refreshed",
  );
});

// ADR 0036 — the status line retreats. The removal is a change the owner SEES the
// next time they open a terminal (their own line is back where ours used to be), so
// an update that stays silent about it reads as a bug in Claude Code, not as a
// deliberate gift. Phrased as what they GAIN, never as what we removed.
test("formatReport — a retired status line is announced as the owner's own line coming back", () => {
  const out = formatReport({
    ref: "v4.4.0",
    engineVersion: { rag: "1.1.5" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    statusLineRemoved: true,
  });
  assert.match(out, /status line/i);
  assert.match(out, /your own|back/i);
});

test("formatReport — a brain that had no status line of ours hears nothing about it", () => {
  const out = formatReport({
    ref: "v4.4.0",
    engineVersion: { rag: "1.1.5" },
    copied: ["rag/src/index.ts"],
    regenerated: false,
    reindexed: false,
    statusLineRemoved: false,
  });
  assert.doesNotMatch(out, /status line/i);
});
