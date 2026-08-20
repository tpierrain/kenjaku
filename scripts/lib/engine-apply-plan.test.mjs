import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { computeApplyPlan, planTouches } from "./engine-apply-plan.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-apply-plan — THE SAFETY CORE (plan Step 3). A pure function turning the
// fetched target manifest's regimes into a WRITE-ALLOWLIST (ADR 0003/0012): the
// engine only ever writes files it declares it owns — `replace` (overwrite,
// including `update-engine.mjs` → self-update), `regenerate` (launchers) and the
// engine-owned `merge` *scripts*, which since S2b-3 are written through a three-way
// merge rather than copied. Everything else — CLAUDE.md, settings, any
// .claude/skills/**, the vault, .env — is untouchable BY CONSTRUCTION, and a sacred
// scrub defends even against a buggy/hostile manifest. No filesystem.
// ═══════════════════════════════════════════════════════════════════════════

test("computeApplyPlan — the target's `replace` regime becomes the `overwrite` bucket", () => {
  const target = { regimes: { replace: ["rag/src/**", "rag/package.json"] } };
  assert.deepEqual(computeApplyPlan(target).overwrite, ["rag/src/**", "rag/package.json"]);
});

test("computeApplyPlan — the target's `regenerate` regime becomes the `regenerate` bucket", () => {
  const target = { regimes: { regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"] } };
  assert.deepEqual(computeApplyPlan(target).regenerate, [
    "rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd",
  ]);
});

test("computeApplyPlan — `mergeScripts` = the engine-owned merge scripts (scripts/*.mjs); user merge files excluded", () => {
  const target = {
    regimes: {
      merge: [
        "CLAUDE.md",                      // user-sovereign → excluded
        ".claude/settings.json",          // user-sovereign → excluded
        ".claude/skills/coach/**",        // a shipped skill → the additive install path
        // ⚠️ Two shapes a looser ENGINE_SCRIPT would swallow, and both are reachable:
        // helper code shipped inside a staged skill (the pattern must be anchored to
        // the START of the path), and the engine's own sidecar (`.mjs` must be the END
        // of it). Neither is sacred, so the scrub would not catch them afterwards.
        "engine-skills/local-mirror/scripts/helper.mjs",
        "scripts/auto-commit.mjs.new",
        "scripts/auto-commit.mjs",
        "scripts/auto-push.mjs",
        "scripts/status-line.mjs",
        "scripts/verify-rag.mjs",
      ],
    },
  };
  assert.deepEqual(computeApplyPlan(target).mergeScripts, [
    "scripts/auto-commit.mjs",
    "scripts/auto-push.mjs",
    "scripts/status-line.mjs",
    "scripts/verify-rag.mjs",
  ]);
});

// A manifest is fetched from a remote launcher, so every shape of it is an INPUT, not
// an assumption: an older one, a truncated one, a hand-edited one. The plan is an
// allowlist, so the safe answer to "I cannot read your regimes" is "you may write
// nothing" — never a crash (which strands the brain mid-update) and never a default
// that invents entries nobody declared.
test("computeApplyPlan — a manifest missing its regimes, or missing altogether, allows NOTHING", () => {
  const empty = { overwrite: [], regenerate: [], mergeScripts: [], installSkills: [] };
  assert.deepEqual(computeApplyPlan({ regimes: {} }), empty, "a manifest declaring no regime at all");
  assert.deepEqual(computeApplyPlan({}), empty, "a manifest with no `regimes` key");
  assert.deepEqual(computeApplyPlan(undefined), empty, "no manifest at all — an unreadable fetch");
  // ...and the never-touch oracle agrees, which is the half that actually guards a file.
  assert.equal(planTouches(computeApplyPlan(undefined), "CLAUDE.md"), false);
  assert.equal(planTouches(computeApplyPlan(undefined), "scripts/auto-commit.mjs"), false);
});

// 🛑 The self-update path is NOT a merge subject, and it never was: this file used to
// warn that `update-engine.mjs` rides in this bucket, but a sweep of all 48 revisions
// of the shipped manifest found it declared `replace` every single time. It reaches a
// brain by COPY, through `overwrite`, and must keep doing so — a brain that cannot
// replace its own updater cannot be upgraded at all.
test("computeApplyPlan — the self-updater arrives by copy, not by merge, wherever the manifest puts it", () => {
  const declaredReplace = computeApplyPlan({ regimes: { replace: ["scripts/update-engine.mjs"] } });
  assert.deepEqual(declaredReplace.overwrite, ["scripts/update-engine.mjs"], "the shipped shape: a copy bucket");
  assert.deepEqual(declaredReplace.mergeScripts, [], "and never the merge-governed one");
  // The fixture that had been mistaken for the shipped manifest for months. Kept as a
  // test rather than deleted: it pins what the OTHER branch does, so the day someone
  // declares the updater `merge` they find out here instead of on a brain.
  const declaredMerge = computeApplyPlan({ regimes: { merge: ["scripts/update-engine.mjs"] } });
  assert.deepEqual(declaredMerge.mergeScripts, ["scripts/update-engine.mjs"]);
  assert.deepEqual(declaredMerge.overwrite, []);
});

test("computeApplyPlan — manifest-declared engine skills (.claude/skills/<name>/**) become the `installSkills` bucket", () => {
  const target = {
    regimes: {
      merge: [
        "CLAUDE.md",                          // user-sovereign → not a skill
        ".claude/settings.json",              // user-sovereign → not a skill
        ".claude/skills/coach/**",     // an engine-owned skill → installSkills
        "scripts/auto-commit.mjs",            // an engine script → mergeScripts, not a skill
      ],
    },
  };
  assert.deepEqual(computeApplyPlan(target).installSkills, [".claude/skills/coach/**"]);
});

test("computeApplyPlan — SAFETY: a skill can ONLY be delivered additively; mis-declared in `replace`/`regenerate` it is scrubbed (never overwritten)", () => {
  const hostile = {
    regimes: {
      replace: ["rag/src/**", ".claude/skills/coach/**"],  // try to OVERWRITE a skill
      regenerate: [".claude/skills/coach/**"],                     // try to clobber via regenerate
      merge: [".claude/skills/coach/**"],                   // the legit additive declaration
    },
  };
  const plan = computeApplyPlan(hostile);
  assert.deepEqual(plan.overwrite, ["rag/src/**"], "a skill in `replace` is scrubbed — never overwritten");
  assert.deepEqual(plan.regenerate, [], "a skill in `regenerate` is scrubbed");
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"], "only the additive merge path carries skills");
});

// A realistic full target manifest, reused by the guard tests below.
function fullTarget() {
  return {
    regimes: {
      // `scripts/update-engine.mjs` sits HERE, exactly as the shipped manifest declares
      // it: the self-updater arrives by copy, never by merge. `planTouches` must stay
      // true for it (the SELF-CARRY guard below), and it reaches that truth through
      // `overwrite`.
      replace: [
        "rag/src/**", "rag/package.json", "rag/package-lock.json", "rag/tsconfig.json",
        "scripts/update-engine.mjs",
      ],
      regenerate: ["rag/launch.sh", "rag/launch.cmd", "scripts/run-node.sh", "scripts/run-node.cmd"],
      merge: [
        "CLAUDE.md", ".claude/settings.json",
        ".claude/skills/coach/**", ".claude/skills/sync/**",
        "scripts/auto-commit.mjs", "scripts/auto-push.mjs",
        "scripts/status-line.mjs", "scripts/verify-rag.mjs",
      ],
    },
  };
}

test("computeApplyPlan — the three buckets are disjoint (no entry written by two actions)", () => {
  const { overwrite, regenerate, mergeScripts } = computeApplyPlan(fullTarget());
  const all = [...overwrite, ...regenerate, ...mergeScripts];
  assert.equal(new Set(all).size, all.length, "an engine file must be claimed by exactly one action");
});

test("computeApplyPlan — SAFETY CORE: a manifest mis-declaring a sacred file as engine-owned is scrubbed", () => {
  // A buggy/hostile target manifest tries to smuggle user-sovereign files into the
  // engine regimes. The plan must refuse them regardless of what the manifest says.
  const hostile = {
    regimes: {
      replace: ["rag/src/**", "CLAUDE.md", ".env"],
      regenerate: [".claude/settings.json", "rag/launch.sh"],
      merge: ["scripts/auto-commit.mjs", ".claude/skills/coach/**"],
    },
  };
  const plan = computeApplyPlan(hostile);
  assert.deepEqual(plan.overwrite, ["rag/src/**"], "CLAUDE.md and .env scrubbed from overwrite");
  assert.deepEqual(plan.regenerate, ["rag/launch.sh"], ".claude/settings.json scrubbed from regenerate");
  assert.deepEqual(plan.mergeScripts, ["scripts/auto-commit.mjs"], "skills never reach mergeScripts");
});

// The two shapes the scrub above never exercised, and both are what a hostile manifest
// would actually try: name the sacred TREE itself rather than a file inside it, and
// claim the vault wholesale. A tree is judged by prefix, so both hang on one `"/"` and
// on the glob stem being stripped to nothing — details invisible to any test that only
// ever declares `.claude/skills/coach/**`.
test("computeApplyPlan — SAFETY CORE: the sacred TREES themselves are refused, named bare or by glob", () => {
  const hostile = {
    regimes: {
      // `.claude/skills` with no trailing slash and no glob: the tree, exactly, and the
      // one spelling a prefix test gets wrong if it forgets to re-append the separator.
      replace: ["rag/src/**", ".claude/skills", "vault/**"],
      regenerate: ["vault", ".claude/skills/**"],
      // 🛑 `installSkills` is the ONE bucket the scrub does not filter (a declared skill
      // is exactly what the additive install path is for), so the pattern's own anchor
      // is its only defence. A skills path buried under another root must not read as a
      // skill, or the engine install-if-absents its way into the owner's vault.
      merge: ["vault/.claude/skills/smuggled/**", ".claude/skills/coach/**"],
    },
  };
  const plan = computeApplyPlan(hostile);
  assert.deepEqual(plan.overwrite, ["rag/src/**"], "neither the skills tree nor the whole vault");
  assert.deepEqual(plan.regenerate, [], "and a launcher bucket claiming the vault regenerates nothing");
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"], "a skills path under another root is not a skill");
});

// ─── SELF-CARRY guard (plan Step 4) ─────────────────────────────────────────
// The engine must replace its OWN machinery on an upgrade, or a brain installed by
// this PR can never be cleanly upgraded: the core would land but its libs would stay
// stale → an incoherent engine. So the SHIPPED engine-manifest.json must declare
// `scripts/update-engine.mjs` AND every `scripts/lib/**` the core imports as Engine-
// owned, and the plan derived from it must `planTouches`-cover them.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
function shippedManifest() {
  return JSON.parse(readFileSync(resolve(repoRoot, "engine-manifest.json"), "utf8"));
}

test("SELF-CARRY — the plan covers update-engine + every lib the core depends on (else a brain can't be upgraded)", () => {
  const plan = computeApplyPlan(shippedManifest());
  // The core (scripts/update-engine.mjs) and the libs it imports. The engine fully
  // replaces itself, libs included — otherwise an upgrade swaps the core but leaves
  // these behind.
  for (const engineFile of [
    "scripts/update-engine.mjs",
    "scripts/lib/engine-fetch.mjs",
    "scripts/lib/engine-apply-plan.mjs",
    "scripts/lib/engine-source.mjs",
    "scripts/lib/reindex-trigger.mjs",
    "scripts/lib/glob-match.mjs",
    "scripts/lib/fs-walk.mjs",
    "scripts/lib/rag-launcher.mjs",
  ]) {
    assert.equal(
      planTouches(plan, engineFile),
      true,
      `the engine must self-carry ${engineFile} (declare it Engine-owned in engine-manifest.json) or an upgrade leaves it stale`,
    );
  }
});

// Gate 1 "green": the constitution ships two-layer (thin sacred CLAUDE.md @imports a
// generic CLAUDE.engine.md). It is STRUCTURE-ONLY — propagation of the engine layer to
// deployed brains is deferred to Gate 3 (it must first be made locale-aware, or a FR
// brain would be re-anglicized on upgrade). So the shipped plan must touch NEITHER file:
// CLAUDE.md because it is sacred, CLAUDE.engine.md because it is not yet in any regime.
// This locks the legacy-safety invariant — a deployed monolithic brain updating is not
// clobbered — and guards against someone wiring CLAUDE.engine.md into `replace` before
// the locale-aware propagation of Gate 3 exists.
test("GREEN LAYERING — the shipped plan touches NEITHER CLAUDE.md NOR CLAUDE.engine.md (structure-only, propagation deferred)", () => {
  const plan = computeApplyPlan(shippedManifest());
  assert.equal(planTouches(plan, "CLAUDE.md"), false, "CLAUDE.md is sacred — never clobber a deployed brain's constitution");
  assert.equal(
    planTouches(plan, "CLAUDE.engine.md"),
    false,
    "CLAUDE.engine.md must NOT be propagated yet — Gate 3 makes it locale-aware first (else a FR brain is re-anglicized on upgrade)",
  );
});

test("planTouches — NEVER touches the user's files; DOES touch the engine's", () => {
  const plan = computeApplyPlan(fullTarget());

  // The sacred set — not one of these may be matched by any plan glob.
  for (const userPath of [
    "vault/topics/flemmr.md",
    "vault/backlog/some deep/note.md",
    ".claude/skills/coach/SKILL.md",
    ".claude/skills/zzz-mine/SKILL.md",
    "CLAUDE.md",
    ".claude/settings.json",
    ".env",
  ]) {
    assert.equal(planTouches(plan, userPath), false, `the plan must NOT touch ${userPath}`);
  }

  // Engine files the allowlist legitimately covers (globs resolved here).
  for (const enginePath of [
    "rag/src/index.ts",
    "rag/src/lib/embedder.ts",
    "rag/package.json",
    "rag/launch.sh",
    "scripts/run-node.cmd",
    "scripts/auto-commit.mjs",
    "scripts/update-engine.mjs",
  ]) {
    assert.equal(planTouches(plan, enginePath), true, `the plan MUST cover ${enginePath}`);
  }
});

// ── S1 — the base tree is inert to the apply plan ─────────────────────────────
// `.engine-base/` is declared under a fourth regime, `local`: written by the engine
// inside the brain, never delivered from the source. The plan is an allowlist built
// from named keys, so an unknown one contributes nothing — but "it happens to be
// ignored today" is not the guarantee this needs. The day someone reads the manifest
// and files the tree under `replace` for tidiness, the ancestor is overwritten with
// the newest fetched content at every update: this release's bug, one level up, on
// the very mechanism built to end it.
test("computeApplyPlan — a `local` regime contributes to NO bucket: an update never writes the brain's own base tree", () => {
  const target = {
    regimes: {
      ...fullTarget().regimes,
      local: [".engine-base/**"],
    },
  };

  const plan = computeApplyPlan(target);

  assert.deepEqual(plan, computeApplyPlan(fullTarget()), "declaring `local` changes not one bucket");
  for (const basePath of [
    ".engine-base/CLAUDE.md",
    ".engine-base/.claude/settings.json",
    ".engine-base/.claude/skills/coach/SKILL.md",
    ".engine-base/scripts/auto-commit.mjs",
    ".engine-base/rag/src/index.ts",
  ]) {
    assert.equal(planTouches(plan, basePath), false, `the plan must NOT touch ${basePath}`);
  }
});
