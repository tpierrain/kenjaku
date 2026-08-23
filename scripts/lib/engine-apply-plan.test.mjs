import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { computeApplyPlan, planTouches, MERGE_GOVERNED_FILES } from "./engine-apply-plan.mjs";
import { OWNER_AUTHORED } from "./engine-write-guard.mjs";

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
  const empty = { overwrite: [], regenerate: [], mergeScripts: [], mergeDoctrine: [], installSkills: [], retireSkills: [] };
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

// ─── The doctrine layer: the THIRD merge family (plan S5a) ───────────────────
// `CLAUDE.engine.md` sat in NO regime for the product's whole life, so a doctrine rule
// written there reached fresh installs only — the field finding of 2026-08-08 measured
// 12 commits of doctrine that never arrived on an up-to-date brain. Declaring it
// `merge` is NECESSARY AND NOT SUFFICIENT, which is the trap this block pins: this
// function does not carry `merge` as one bucket, it splits it by SHAPE, and the
// doctrine layer matches neither the scripts' regex nor the skills'. Without a bucket
// of its own the manifest would promise a delivery no code performs, silently — the
// very defect the release is named after.
test("computeApplyPlan — the doctrine layer declared `merge` becomes the `mergeDoctrine` bucket, and lands nowhere else", () => {
  const target = {
    regimes: {
      merge: ["CLAUDE.engine.md", "scripts/auto-commit.mjs", ".claude/skills/coach/**"],
    },
  };
  const plan = computeApplyPlan(target);
  assert.deepEqual(plan.mergeDoctrine, ["CLAUDE.engine.md"]);
  assert.deepEqual(plan.mergeScripts, ["scripts/auto-commit.mjs"], "it does not leak into the scripts' family");
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"], "nor into the skills'");
  assert.deepEqual(plan.overwrite, [], "nor into the copy path — doctrine is merged, never clobbered");
});

// 🛑 The one dot that decides sovereignty. `CLAUDE.md` is the OWNER's half of the
// two-layer constitution (sacred, ADR 0003/0012); `CLAUDE.engine.md` is the engine's.
// A predicate written `/^CLAUDE\./` or `/\.md$/` would carry the owner's own file into
// a bucket that WRITES — the single worst outcome this release exists to prevent — so
// the pattern is anchored at both ends and the sacred scrub is only the second net.
// The other three shapes are each reachable: the merge sidecar the carrier itself
// writes on an unsafe verdict, the locale source (the manifest names the DESTINATION
// rel and the locale is resolved at delivery time — a second line would be a second
// owner for one fact), and any copy sitting in the owner's vault.
test("computeApplyPlan — SAFETY: the owner's CLAUDE.md is never mistaken for the engine's doctrine layer", () => {
  const hostile = {
    regimes: {
      merge: ["CLAUDE.md", "CLAUDE.engine.md.new", "templates/fr/CLAUDE.engine.md", "vault/notes/CLAUDE.engine.md"],
    },
  };
  assert.deepEqual(computeApplyPlan(hostile).mergeDoctrine, []);
});

// The never-touch oracle is what the guard tests and the apply step actually ask, so a
// family the plan carries but the oracle ignores is a file written behind the guard's
// back. It counts `mergeScripts` already; it must count this one for the same reason.
test("planTouches — the oracle counts the doctrine family, and still refuses its sovereign twin", () => {
  const plan = computeApplyPlan({ regimes: { merge: ["CLAUDE.engine.md", "CLAUDE.md"] } });
  assert.equal(planTouches(plan, "CLAUDE.engine.md"), true, "declared `merge`, so the engine does write here now");
  assert.equal(planTouches(plan, "CLAUDE.md"), false, "and the owner's half stays untouchable, declared or not");
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

// ─── The scrub splits in two, and the words are the deliverable (plan S2c) ───
// One word, "sacred", was filing three different reasons: `.env` and `vault/` must
// never be written by anything, ever; `CLAUDE.md` and `.claude/settings.json` are the
// owner's to AUTHOR but the engine may reach them through a provable merge; an
// undeclared skill is untouchable because nobody claimed it. Reformulating the scrub
// is not cosmetics — ADR 0003/0012's whole invariant is built on that word, and a
// blanket "never" is what made "may the engine ever update your constitution?" read
// as already answered.
test("SAFETY CORE — the scrub's merge-governed half IS the guard's OWNER_AUTHORED, by identity", () => {
  // Same REFERENCE, not merely the same contents: two lists that happen to agree today
  // are two lists that disagree the day one of them is edited, and this pair is the one
  // boundary read from both sides — S3 asks "may the AGENT write this without asking?",
  // this module asks "may the ENGINE write it by copy?".
  assert.equal(MERGE_GOVERNED_FILES, OWNER_AUTHORED);
});

// The split has to BITE, or it is a rename with a paragraph. `.env` is the file where
// a wrong answer leaks the owner's API key: no regime, no merge, no door, ever.
test("SAFETY CORE — `.env` is inviolable: no bucket, no door, not even the merge", () => {
  assert.equal(MERGE_GOVERNED_FILES.includes(".env"), false, "it is not on the merge-governed side");
  const hostile = { regimes: { replace: [".env"], regenerate: [".env"], merge: [".env"] }, retired: [".env"] };
  const plan = computeApplyPlan(hostile);
  assert.deepEqual(plan, {
    overwrite: [], regenerate: [], mergeScripts: [], mergeDoctrine: [], installSkills: [], retireSkills: [],
  });
  assert.equal(planTouches(plan, ".env"), false);
});

// ⚠️ "Merge-governed" is a STATEMENT ABOUT THE DOOR, not an announcement that it is
// open. In this release neither file is delivered by anything: `CLAUDE.md` has no
// ancestor machine yet (no provable base ⇒ no merge), and `.claude/settings.json` is
// written surgically by the reconciler's hook reconcile, which is the right mechanism
// for a JSON file whose two sides both append to the same arrays — not a line diff.
// So the scrub's BEHAVIOUR is byte-for-byte what it was; what changed is that the code
// now says why. This test is what stops the rename being read as a green light.
test("SAFETY CORE — merge-governed does NOT mean delivered: neither file is written by any bucket yet", () => {
  const plan = computeApplyPlan({
    regimes: {
      replace: ["CLAUDE.md"],
      regenerate: [".claude/settings.json"],
      merge: ["CLAUDE.md", ".claude/settings.json"],
    },
  });
  assert.deepEqual(plan.overwrite, [], "a manifest declaring the constitution `replace` still writes nothing");
  assert.deepEqual(plan.regenerate, []);
  assert.equal(planTouches(plan, "CLAUDE.md"), false);
  assert.equal(planTouches(plan, ".claude/settings.json"), false);
});

// ─── The subtractive bucket: `retired` (plan S6b, ADR 0039) ─────────────────
// Every other bucket answers "how is this file UPDATED?". This one answers a question
// the engine had never asked: "does the engine still ship it at all?". It reads a
// `retired` list that is a SIBLING of `regimes`, deliberately — a removal is declared,
// never derived from an absence, or a truncated manifest would read as "retire
// everything" on a machine holding the owner's work.
test("computeApplyPlan — the manifest's `retired` tombstones become the `retireSkills` bucket", () => {
  const target = {
    regimes: { merge: [".claude/skills/test-first-discipline/**", "scripts/auto-commit.mjs"] },
    retired: [".claude/skills/tdd-discipline/**"],
  };
  const plan = computeApplyPlan(target);
  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"]);
  // ...and the successor is on the other side of the fence, in the same manifest.
  assert.deepEqual(plan.installSkills, [".claude/skills/test-first-discipline/**"], "a tombstone is not an install");
});

// A delete is a touch. The never-touch oracle is what every guard test in this repo
// asks, and it must not answer "the engine never writes there" about a path the engine
// ERASES — that is the one write where a wrong answer costs the owner their work.
test("computeApplyPlan — `planTouches` counts a retirement: a delete is a write", () => {
  const plan = computeApplyPlan({ retired: [".claude/skills/tdd-discipline/**"] });
  assert.equal(planTouches(plan, ".claude/skills/tdd-discipline/SKILL.md"), true, "the file the engine erases");
  assert.equal(planTouches(plan, ".claude/skills/coach/SKILL.md"), false, "and only under the tombstone it declared");
});

// `retireSkills` is UNSCRUBBED, exactly like `installSkills` and for the same reason:
// `.claude/skills/` is an inviolable TREE, so a scrub would empty this bucket every
// time and the tombstone would be a no-op nobody noticed. The pattern's own anchor is
// therefore its only defence — which is the whole of the next test.
test("computeApplyPlan — a tombstone survives the sacred scrub of the skills tree", () => {
  const plan = computeApplyPlan({ retired: [".claude/skills/tdd-discipline/**"] });
  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"]);
});

// 🛑 A TOMBSTONE BEATS A REGIME, and this is not theory: the reconcile's own
// install-if-absent runs a few lines after the retirement, sees a directory that is
// suddenly missing, and puts it straight back — in the SAME pass. Found by the order
// test, not by reasoning. The design says the two manifest edits are one change; this
// makes that a belt rather than the only thing holding the trousers up, because a delete
// is the more explicit statement of the two and must win when a manifest says both.
test("computeApplyPlan — a retired skill is NOT installed, whatever the merge regime still says", () => {
  const halfEdited = {
    regimes: { merge: [".claude/skills/tdd-discipline/**", ".claude/skills/coach/**"] },
    retired: [".claude/skills/tdd-discipline/**"],
  };
  const plan = computeApplyPlan(halfEdited);
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"], "the tombstone wins over its own merge entry");
  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"]);
});

// 🛑 THE HOSTILE MANIFEST, and here it is not a paranoia exercise: this is the only
// list in the product whose entries end in `rm -rf`. Anything that is not a declared
// engine SKILL DIRECTORY is refused by shape, because the shape is all that stands
// between a hand-broken manifest and the owner's vault.
test("computeApplyPlan — SAFETY CORE: `retired` retires SKILL DIRECTORIES and nothing else", () => {
  const hostile = {
    retired: [
      "vault/**",                                 // the product's entire promise
      ".env",                                     // the owner's API key
      "CLAUDE.md",                                // the owner's constitution
      ".claude/skills",                           // the tree itself, bare
      ".claude/skills/**",                        // ...and by glob: "retire every skill"
      "vault/.claude/skills/smuggled/**",         // a skills path under another root
      "scripts/auto-commit.mjs",                  // an engine script is retired by hand, not here
      ".claude/skills/tdd-discipline/**",         // the one legitimate entry
    ],
  };
  const plan = computeApplyPlan(hostile);
  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"]);
  assert.equal(planTouches(plan, "vault/note.md"), false);
  assert.equal(planTouches(plan, ".env"), false);
  assert.equal(planTouches(plan, ".claude/skills/coach/SKILL.md"), false);
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

// ─── The two-layer constitution: one half sacred forever, one half unfrozen ──
// 🔓 A test that said NEVER now says HOW, and the record of why it once said never is
// the half worth keeping — so the comment is REWRITTEN, not deleted.
//
// WHAT IT USED TO SAY (Gate 1, and it was right at the time). The constitution ships
// two-layer: a thin, sacred `CLAUDE.md` @imports a generic `CLAUDE.engine.md`. That
// was STRUCTURE-ONLY, and propagating the engine layer to deployed brains was deferred
// — it had to be made locale-aware first, or a FR brain would be re-anglicized by its
// own upgrade. So the shipped plan had to touch NEITHER file, and this test guarded
// against someone wiring `CLAUDE.engine.md` into `replace` before that existed.
// _(It said the work was deferred to "Gate 3" twice. Every other carrier says Gate 4;
// the ROADMAP's Gate 3 is `Migration generate`. A reader chasing the deferral has been
// sent to the wrong gate since Gate 1. Corrected here.)_
//
// WHY THE LOCK IS LIFTED (plan S5, verified in the code rather than recalled). The
// locale condition has been met since v4.1.0 and nobody came back: `engine-merge-apply`
// reads the brain's locale and resolves `templates/<locale>/<rel>` for every file it
// delivers, which is how the FR skills already reach FR brains. And what the lock
// feared is not what shipped: the regime is `merge`, NOT `replace`. On a file nobody
// touched a three-way merge from a provable base is byte-identical to a copy; on an
// edited one it preserves and reports. Nothing is clobbered on either path.
//
// WHAT STAYS LOCKED, and it is the half that must never move: `CLAUDE.md` is the
// OWNER's. One dot separates the two names, so this test keeps both assertions in one
// place — the day someone widens a predicate, the owner's constitution and the
// engine's go different ways HERE, in the same three lines.
test("LAYERING — the shipped plan delivers CLAUDE.engine.md and still never touches CLAUDE.md", () => {
  const plan = computeApplyPlan(shippedManifest());
  assert.equal(planTouches(plan, "CLAUDE.md"), false, "CLAUDE.md is sacred — never clobber a deployed brain's constitution");
  assert.equal(
    planTouches(plan, "CLAUDE.engine.md"),
    true,
    "the engine layer is `merge`-declared since S5 — a doctrine rule that reaches fresh installs only is the defect this release is named after",
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

// ─── T12 (third review pass): `..` walked straight through the ONLY defence ──
// The hostile-manifest test above says `retired` retires skill directories "and nothing
// else", and it was true of every entry it thought to try. `ENGINE_SKILL` matches
// `.claude/skills/<segment>/`, and `[^/]+` accepts `..` — so an entry that STARTS inside
// the skills tree and then climbs back out passed the one check standing between a
// hand-broken manifest and the owner's vault.
//
// What it cost, measured rather than assumed: no deletion (a provenance key cannot match
// a vault note, so the verdict is never `remove`), but the retirement LISTS the escaped
// tree and reads every file in it into memory, then names it in an owner-facing line. And
// `planTouches` — the never-touch oracle every guard test in this repo asks — answered
// "the engine never writes there" about a plan that had just named the vault.
const ESCAPES = [
  ".claude/skills/../../vault/**",     // out of the tree from the skill-name segment
  ".claude/skills/coach/../../../vault/**", // ...and from below a legitimate skill
  ".claude/skills/./../vault/**",      // `.` is no more a skill name than `..` is
  ".claude/skills/../.env",            // the owner's API key, one segment away
];

test("computeApplyPlan — SAFETY CORE: a tombstone that CLIMBS OUT of the skills tree is no tombstone (T12)", () => {
  const plan = computeApplyPlan({ retired: [...ESCAPES, ".claude/skills/tdd-discipline/**"] });

  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"], "only the entry that stays inside");
});

test("computeApplyPlan — the escape is refused on WINDOWS separators too (T12)", () => {
  // `path.win32.join` treats `\` as a separator, so a check that splits on `/` alone
  // rejects nothing at all on the one platform where the traversal would actually
  // resolve. A manifest entry is POSIX-spelled by contract (ADR 0015); a backslash in
  // one is malformed whatever it is trying to do.
  const plan = computeApplyPlan({
    retired: [".claude/skills/..\\..\\vault/**", ".claude/skills/tdd-discipline/**"],
  });

  assert.deepEqual(plan.retireSkills, [".claude/skills/tdd-discipline/**"]);
});

test("computeApplyPlan — an escaping entry reaches NO bucket, not merely the subtractive one (T12)", () => {
  // The finding named `retireSkills` because it is the bucket that ends in a delete. But
  // the oracle's promise is about the whole plan, and an entry the engine cannot spell
  // has no business in a copy bucket either.
  const plan = computeApplyPlan({
    regimes: {
      replace: ["scripts/../vault/**", "rag/src/**"],
      regenerate: ["scripts/../../elsewhere/launch.sh", "rag/launch.sh"],
      merge: [".claude/skills/../../vault/**", ".claude/skills/coach/**", "scripts/../auto-commit.mjs"],
    },
  });

  assert.deepEqual(plan.overwrite, ["rag/src/**"]);
  assert.deepEqual(plan.regenerate, ["rag/launch.sh"]);
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"]);
  assert.deepEqual(plan.mergeScripts, []);
});

test("planTouches — the oracle no longer says 'never' about a tree the plan just named (T12)", () => {
  // The assertion the finding is really about: every guard test in this repo asks this
  // question, and it must not answer "the engine never writes there" about a path the
  // plan escaped to. It is true now because the entry never entered a bucket — the
  // oracle was never the right place to fix it.
  const plan = computeApplyPlan({ retired: [".claude/skills/../../vault/**"] });

  assert.deepEqual(plan.retireSkills, []);
  assert.equal(planTouches(plan, "vault/notes/a.md"), false, "and it is false because nothing named it");
});

test("computeApplyPlan — a skill whose name merely CONTAINS dots is still a skill (T12)", () => {
  // The refusal is about path SEGMENTS, not about the character. A guard that rejected
  // any entry containing ".." would take `.claude/skills/my..skill/**` with it, and a
  // guard that is wrong about legitimate input is one people widen instead of read.
  const plan = computeApplyPlan({
    retired: [".claude/skills/my..skill/**", ".claude/skills/...dots/**"],
  });

  assert.deepEqual(plan.retireSkills, [".claude/skills/my..skill/**", ".claude/skills/...dots/**"]);
});

test("computeApplyPlan — a lone `.` segment is refused too, and it is not about escaping (T12)", () => {
  // Two mutants survived the first pass by deleting the `.` half, because every escape
  // fixture above also carried a `..`. A lone `.` climbs nowhere — `join` normalises it
  // away — so the harm is a different one: it is a SECOND SPELLING of a path this module
  // compares as a string. `retiredDirs` subtracts stems, and `.claude/skills/./coach`
  // does not equal `.claude/skills/coach`, so the tombstone would be honoured by the
  // retirement and ignored by the install-if-absent that runs a few lines later: the skill
  // deleted and put straight back, in one pass, which is the very order defect the
  // tombstone precedence exists to prevent.
  const plan = computeApplyPlan({
    retired: [".claude/skills/./coach/**"],
    regimes: { merge: [".claude/skills/coach/**"] },
  });

  assert.deepEqual(plan.retireSkills, [], "a mis-spelled tombstone is refused, never half-honoured");
  assert.deepEqual(plan.installSkills, [".claude/skills/coach/**"], "and the skill it mis-named is untouched");
});
