import { test } from "node:test";
import assert from "node:assert/strict";
import { join, sep } from "node:path";

import { OWNER_AUTHORED, brainRelative, guardDecision, regimeOf } from "./engine-write-guard.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-write-guard — an agent no longer diverges a brain from its engine
// without the owner being asked (plan S3).
//
// The guard is a PreToolUse(Write|Edit) hook, so it sees ONLY what Claude
// writes: the owner's editor and the engine's own `fs` writes are invisible to
// it — which is also why it needs no self-exemption.
//
// THE VERDICT IS THREE-WAY, and the manifest's regimes alone cannot produce it:
// `CLAUDE.md` and `.claude/settings.json` are `merge`-regime files, and they are
// exactly what this guard REDIRECTS people to. Regime says how the engine
// updates a file; the guard needs to know who the file was written for.
//
// FAIL-OPEN everywhere, with one anchored exception: the `.engine-base/` deny is
// keyed on the path, never on the manifest — the one verdict protecting a
// correctness invariant must not be disarmed by an unreadable manifest.
// ═══════════════════════════════════════════════════════════════════════════

const BRAIN = join(sep, "Users", "someone", "my-brain");
const inBrain = (rel) => join(BRAIN, ...rel.split("/"));

// Deliberately NOT the product's own manifest: a fixture produced by the code
// under test proves nothing. Two entries per regime, unsorted, and one path
// claimed by two regimes at once (see the precedence test).
const MANIFEST = {
  regimes: {
    replace: ["scripts/lib/**", "rag/src/**", "scripts/update-engine.mjs"],
    merge: [
      "CLAUDE.md",
      ".claude/settings.json",
      "scripts/auto-commit.mjs",
      ".claude/skills/coach/**",
      "scripts/lib/engine-merge.mjs",
    ],
    regenerate: ["rag/launch.sh", "scripts/run-node.cmd"],
    local: [".engine-base/**"],
  },
};

const decide = (rel, manifest = MANIFEST, toolName = "Write") =>
  guardDecision({ toolName, filePath: inBrain(rel), brainDir: BRAIN, manifest });

// ⚠️ `decide`'s DEFAULT PARAMETER makes it useless for the `undefined` manifest —
// it silently substitutes the real one, so the case reads green while never being
// judged. Same family as an optional-chained field left out of a fixture. Every
// "the guard cannot read the manifest" test goes through this one instead.
const decideWith = (rel, manifest) =>
  guardDecision({ toolName: "Write", filePath: inBrain(rel), brainDir: BRAIN, manifest });

const UNREADABLE_MANIFESTS = [null, undefined, {}, { regimes: {} }];

// The client's dispatcher THROWS on any other value ("Valid types are: allow,
// deny, ask, defer" — read out of claude 2.1.220's own binary, plan S3-0), so
// the emitted set is part of the contract, not a style preference.
const CLIENT_DECISIONS = new Set(["allow", "deny", "ask"]);

// ── the brain-relative path ────────────────────────────────────────────────

test("a path inside the brain becomes its posix-relative path", () => {
  assert.equal(brainRelative({ filePath: inBrain("scripts/auto-commit.mjs"), brainDir: BRAIN }), "scripts/auto-commit.mjs");
  assert.equal(brainRelative({ filePath: inBrain("CLAUDE.md"), brainDir: BRAIN }), "CLAUDE.md");
});

test("a path OUTSIDE the brain is none of the guard's business", () => {
  const elsewhere = join(sep, "Users", "someone", "other-repo", "scripts", "auto-commit.mjs");
  assert.equal(brainRelative({ filePath: elsewhere, brainDir: BRAIN }), null);
});

test("a sibling directory sharing the brain's prefix is NOT inside it", () => {
  // `my-brain-backup` starts with `my-brain`: a prefix test on the string would
  // claim it, and the guard would rule on files it has no business ruling on.
  const sibling = join(sep, "Users", "someone", "my-brain-backup", "CLAUDE.md");
  assert.equal(brainRelative({ filePath: sibling, brainDir: BRAIN }), null);
});

test("a missing or non-string path is not a path", () => {
  assert.equal(brainRelative({ filePath: undefined, brainDir: BRAIN }), null);
  assert.equal(brainRelative({ filePath: 42, brainDir: BRAIN }), null);
});

// ── the regime lookup ──────────────────────────────────────────────────────

test("each regime answers for its own files", () => {
  assert.equal(regimeOf({ rel: "scripts/lib/glob-match.mjs", manifest: MANIFEST }), "replace");
  assert.equal(regimeOf({ rel: "scripts/auto-commit.mjs", manifest: MANIFEST }), "merge");
  assert.equal(regimeOf({ rel: ".claude/skills/coach/SKILL.md", manifest: MANIFEST }), "merge");
  assert.equal(regimeOf({ rel: "rag/launch.sh", manifest: MANIFEST }), "regenerate");
  assert.equal(regimeOf({ rel: ".engine-base/CLAUDE.md", manifest: MANIFEST }), "local");
});

test("a file the manifest never names belongs to nobody but the owner", () => {
  assert.equal(regimeOf({ rel: "vault/notes/my-note.md", manifest: MANIFEST }), null);
  assert.equal(regimeOf({ rel: "scripts/auto-commit.mjs.new", manifest: MANIFEST }), null);
});

test("no manifest, no regimes, no answer — never a guess", () => {
  assert.equal(regimeOf({ rel: "scripts/auto-commit.mjs", manifest: null }), null);
  assert.equal(regimeOf({ rel: "scripts/auto-commit.mjs", manifest: {} }), null);
  assert.equal(regimeOf({ rel: "scripts/auto-commit.mjs", manifest: { regimes: {} } }), null);
});

test("a path claimed by TWO regimes resolves to the one that costs the owner more", () => {
  // `scripts/lib/engine-merge.mjs` is in `merge` AND under `replace`'s
  // `scripts/lib/**`. A coin flip here would make the warning depend on key
  // order, so the order is fixed: local, replace, regenerate, merge — the
  // owner is told the WORST that can happen to their edit, not the mildest.
  assert.equal(regimeOf({ rel: "scripts/lib/engine-merge.mjs", manifest: MANIFEST }), "replace");
});

// ── the verdict: allow ─────────────────────────────────────────────────────

test("another tool is not this guard's business", () => {
  for (const toolName of ["Read", "Bash", "Glob", "NotebookEdit"]) {
    assert.deepEqual(decide("scripts/lib/glob-match.mjs", MANIFEST, toolName), { decision: "allow" });
  }
});

test("Edit is judged exactly like Write", () => {
  assert.equal(decide("scripts/lib/glob-match.mjs", MANIFEST, "Edit").decision, "ask");
});

test("the owner's own files pass in silence", () => {
  assert.deepEqual(decide("vault/notes/my-note.md"), { decision: "allow" });
  assert.deepEqual(decide(".claude/skills/my-own-skill/SKILL.md"), { decision: "allow" });
});

test("THE ONE THE REGIMES GET WRONG: the two owner-authored engine files pass in silence", () => {
  // Both are in the `merge` regime. Asking before writing them would be the
  // guard fighting the product: they are what it redirects people TO.
  assert.deepEqual(decide("CLAUDE.md"), { decision: "allow" });
  assert.deepEqual(decide(".claude/settings.json"), { decision: "allow" });
  assert.deepEqual([...OWNER_AUTHORED].sort(), [".claude/settings.json", "CLAUDE.md"]);
});

test("a path with no file_path at all is allowed, not crashed on", () => {
  assert.deepEqual(guardDecision({ toolName: "Write", filePath: undefined, brainDir: BRAIN, manifest: MANIFEST }), {
    decision: "allow",
  });
});

// ── the verdict: ask, with the price named per regime ──────────────────────

test("a merge-governed engine file: your edit is kept, and merged forever", () => {
  const verdict = decide("scripts/auto-commit.mjs");
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /scripts\/auto-commit\.mjs/);
  assert.match(verdict.reason, /kept/);
  assert.match(verdict.reason, /merge/);
  assert.doesNotMatch(verdict.reason, /overwrit/);
});

test("a replaced engine file: the next update overwrites it, without a word", () => {
  const verdict = decide("scripts/lib/glob-match.mjs");
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /scripts\/lib\/glob-match\.mjs/);
  assert.match(verdict.reason, /overwrite/);
  assert.doesNotMatch(verdict.reason, /kept/);
});

test("a regenerated engine file says regenerated, not overwritten by hand", () => {
  const verdict = decide("rag/launch.sh");
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /rag\/launch\.sh/);
  assert.match(verdict.reason, /regenerated/);
});

test("EVERY ask names the layer built for the owner's intent", () => {
  // The redirect is the slice's whole reason to exist: a guard that only says
  // "no" teaches nothing and gets clicked through.
  for (const rel of ["scripts/auto-commit.mjs", "scripts/lib/glob-match.mjs", "rag/launch.sh"]) {
    assert.match(decide(rel).reason, /CLAUDE\.md/, `${rel} must redirect somewhere`);
  }
});

// ── the verdict: deny, and it is anchored on the path ──────────────────────

test("the recorded base is refused: editing it forges the provenance", () => {
  const verdict = decide(".engine-base/scripts/auto-commit.mjs");
  assert.equal(verdict.decision, "deny");
  assert.match(verdict.reason, /\.engine-base\/scripts\/auto-commit\.mjs/);
  assert.match(verdict.reason, /silently/);
});

test("the base-tree deny survives a manifest the guard could not read", () => {
  // FAIL-OPEN has exactly one exception, and this is it: the verdict that
  // protects a correctness invariant must not be disarmed by the very file
  // whose integrity it protects.
  for (const manifest of UNREADABLE_MANIFESTS) {
    assert.equal(decideWith(".engine-base/CLAUDE.md", manifest).decision, "deny");
  }
});

test("a file merely NAMED like the base tree is not the base tree", () => {
  assert.deepEqual(decide("vault/notes/.engine-base/tricky.md"), { decision: "allow" });
  assert.deepEqual(decide(".engine-baseline/CLAUDE.md"), { decision: "allow" });
});

// ── fail-open, and the shape of what is emitted ────────────────────────────

test("no manifest means no engine file — the guard cannot judge, so it allows", () => {
  for (const manifest of UNREADABLE_MANIFESTS) {
    assert.deepEqual(decideWith("scripts/lib/glob-match.mjs", manifest), { decision: "allow" });
    assert.deepEqual(decideWith("scripts/auto-commit.mjs", manifest), { decision: "allow" });
  }
});

test("every verdict is a value the client accepts, and every non-allow carries a reason", () => {
  const rels = [
    "vault/notes/my-note.md",
    "CLAUDE.md",
    "scripts/auto-commit.mjs",
    "scripts/lib/glob-match.mjs",
    "rag/launch.sh",
    ".engine-base/CLAUDE.md",
  ];
  for (const rel of rels) {
    const verdict = decide(rel);
    assert.ok(CLIENT_DECISIONS.has(verdict.decision), `${rel} emitted ${verdict.decision}`);
    if (verdict.decision === "allow") assert.equal(verdict.reason, undefined, `${rel} needs no reason`);
    else assert.equal(typeof verdict.reason, "string", `${rel} must say why`);
  }
});
