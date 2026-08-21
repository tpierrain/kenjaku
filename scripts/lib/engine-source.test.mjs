import { test } from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

import {
  fingerprint,
  selectMergeFiles,
  buildProvenance,
  buildSource,
  resolveSourceRepo,
  enrichManifest,
  reseedBaseRefs,
  reseedProvenance,
  recordSourceAndProvenance,
} from "./engine-source.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-source — pure helpers the installer uses to enrich the brain's
// engine-manifest.json with `source: {repo, ref}` (where to pull a future update
// from) and `provenance` (a base sha256 per `merge` file, seeding Phase 2's 3-way).
// Pure by design: the installer does the git/FS I/O and passes the facts in.
// ═══════════════════════════════════════════════════════════════════════════

test("fingerprint — self-describing sha256 of the content", () => {
  // A known SHA-256: the digest of the empty string.
  assert.equal(
    fingerprint(""),
    "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("selectMergeFiles — an exact merge entry selects only that file", () => {
  const manifest = { regimes: { merge: ["CLAUDE.md"] } };
  const candidates = ["CLAUDE.md", "rag/src/index.ts"];
  assert.deepEqual(selectMergeFiles(manifest, candidates), ["CLAUDE.md"]);
});

// The absent case, fed on purpose: a manifest may legitimately carry no `merge`
// regime (a partial / hand-written one, or a future regime split). Selection must
// then be EMPTY, never a crash — this runs at install time, on the brain's own
// manifest, where a throw would abort the enrichment and leave a brain with no
// provenance at all (frozen forever, ADR 0026 §8). Triangulated down the whole
// optional chain: no merge key, no regimes key, no manifest at all.
test("selectMergeFiles — a manifest with no merge regime selects nothing, and never throws", () => {
  assert.deepEqual(selectMergeFiles({ regimes: { replace: ["rag/src/**"] } }, ["CLAUDE.md", "rag/src/index.ts"]), []);
  assert.deepEqual(selectMergeFiles({ manifestVersion: 1 }, ["CLAUDE.md"]), []);
  assert.deepEqual(selectMergeFiles(undefined, ["CLAUDE.md"]), []);
});

// ⚰️ A RETIRED FILE IS NOT A MERGE FILE, whatever `merge` still says (plan S6c). This
// is one line in one chokepoint, and it is where it belongs: everything that treats a
// file as engine-owned asks THIS question — the skills refresh, the base seeding, the
// provenance re-seed, the version stamps. Without it, the refresh's absent-install puts
// a just-retired directory straight back in the SAME pass (measured, not feared), and
// the base tree keeps seeding an ancestor for a file nobody ships.
// The precedence is deliberate, and it is the same one `computeApplyPlan` applies to
// `installSkills`: between "we still ship this" and "we no longer ship this", the
// second is the more explicit statement, and it is the one that took a decision.
test("selectMergeFiles — a retired entry is subtracted, however the merge regime still names it", () => {
  const manifest = {
    regimes: { merge: [".claude/skills/tdd-discipline/**", ".claude/skills/coach/**"] },
    retired: [".claude/skills/tdd-discipline/**"],
  };
  const candidates = [".claude/skills/tdd-discipline/SKILL.md", ".claude/skills/coach/SKILL.md"];
  assert.deepEqual(selectMergeFiles(manifest, candidates), [".claude/skills/coach/SKILL.md"]);
  // ...and a manifest with no tombstone at all — every manifest the product has shipped
  // so far — selects exactly what it always did.
  assert.deepEqual(selectMergeFiles({ regimes: manifest.regimes }, candidates), candidates);
});

test("selectMergeFiles — a `**` glob selects the whole subtree, nothing outside it", () => {
  const manifest = { regimes: { merge: [".claude/skills/coach/**"] } };
  const candidates = [
    ".claude/skills/coach/SKILL.md",
    ".claude/skills/coach/lib/helper.mjs",
    ".claude/skills/zzz-mine/SKILL.md", // a home-made skill → must NOT be selected
    "vault/note.md",
  ];
  assert.deepEqual(selectMergeFiles(manifest, candidates), [
    ".claude/skills/coach/SKILL.md",
    ".claude/skills/coach/lib/helper.mjs",
  ]);
});

test("buildProvenance — fingerprints each file's content, keyed by path", () => {
  const fileMap = { "CLAUDE.md": "my constitution", "scripts/auto-commit.mjs": "// engine" };
  assert.deepEqual(buildProvenance(fileMap), {
    "CLAUDE.md": fingerprint("my constitution"),
    "scripts/auto-commit.mjs": fingerprint("// engine"),
  });
});

test("buildSource — an exact tag at HEAD is the most reproducible ref", () => {
  assert.deepEqual(
    buildSource({ repo: "git@github.com:me/launcher.git", tag: "v2.0.0", branch: "main", commit: "deadbeef" }),
    { repo: "git@github.com:me/launcher.git", ref: "v2.0.0" },
  );
});

test("buildSource — no tag → fall back to the branch (still clone-able)", () => {
  assert.deepEqual(
    buildSource({ repo: "git@github.com:me/launcher.git", tag: null, branch: "main", commit: "deadbeef" }),
    { repo: "git@github.com:me/launcher.git", ref: "main" },
  );
});

test("buildSource — no tag, detached/unknown branch → fall back to the commit", () => {
  assert.deepEqual(
    buildSource({ repo: "git@github.com:me/launcher.git", tag: null, branch: null, commit: "deadbeef" }),
    { repo: "git@github.com:me/launcher.git", ref: "deadbeef" },
  );
});

test("buildSource — a launcher with no remote records repo:null (update-engine then asks)", () => {
  assert.deepEqual(
    buildSource({ repo: "", tag: "v1.0.0", branch: "main", commit: "abc" }),
    { repo: null, ref: "v1.0.0" },
  );
});

// The two mirror images of the "no remote" case above. `git remote get-url` hands back
// a trailing newline, and a launcher with no remote can yield blank-but-not-empty — both
// must read as NO remote (repo: null), because that null is exactly what makes
// update-engine ASK the user where to pull from instead of trying to clone `"  "`.
// A padded but real URL, conversely, must be recorded CLEAN: a ref with a stray newline
// is not clone-able.
test("buildSource — a blank remote is no remote at all, and a padded one is recorded trimmed", () => {
  assert.deepEqual(buildSource({ repo: "  \n ", tag: "v1.0.0", branch: "main", commit: "abc" }), {
    repo: null,
    ref: "v1.0.0",
  });
  assert.deepEqual(buildSource({ repo: " git@github.com:me/launcher.git\n", tag: "v1.0.0" }), {
    repo: "git@github.com:me/launcher.git",
    ref: "v1.0.0",
  });
});

// The absent case: git facts that carry no `repo` key at all (an installer path that
// never probed the remote). Must degrade to repo:null like the empty string, never throw
// — a throw here aborts the whole manifest enrichment.
test("buildSource — git facts with no repo key at all still record repo:null", () => {
  assert.deepEqual(buildSource({ tag: null, branch: "main", commit: "abc" }), { repo: null, ref: "main" });
});

// ─── resolveSourceRepo — a repository rename reaches deployed brains (F1) ────
// The brain records `source.repo` at INSTALL time and never revises it, so a
// rename of the launcher's repository propagates to no installed brain, ever:
// they keep cloning the old name and survive only on GitHub's redirect — an alias
// in a namespace we no longer own. The launcher therefore DECLARES its own
// canonical URL in the manifest it ships, and the brain adopts it at the next
// update: the source of truth becomes the launcher we just fetched, not the
// brain's install-day memory.
test("resolveSourceRepo — the fetched launcher's canonical URL supersedes the brain's install-day one", () => {
  assert.equal(
    resolveSourceRepo({
      recorded: "https://github.com/tpierrain/second-brain-generator.git",
      declared: "https://github.com/tpierrain/kenjaku.git",
    }),
    "https://github.com/tpierrain/kenjaku.git",
  );
});

// The older-launcher case, and the reason the launcher's word is not taken blindly:
// a manifest published before this field existed declares NOTHING. Adopting that
// would blank the one URL the brain has and leave it unable to update at all — the
// fix would be strictly worse than the defect. So an absent declaration keeps the
// recorded URL.
test("resolveSourceRepo — a launcher that declares no canonical URL leaves the recorded one alone", () => {
  assert.equal(
    resolveSourceRepo({
      recorded: "https://github.com/tpierrain/kenjaku.git",
      declared: undefined,
    }),
    "https://github.com/tpierrain/kenjaku.git",
  );
});

// The two mirror images of the absent case — the manifest is hand-edited JSON, so
// both are reachable by a slip of the hand. A blank declaration is NOT a declaration
// (it must not blank a working source, exactly like `buildSource`'s blank remote),
// and a padded real URL must be adopted CLEAN: a repo URL carrying a stray newline
// is not clone-able, so the next update would die on the redirect we just fixed.
test("resolveSourceRepo — a blank declaration declares nothing, and a padded one is adopted trimmed", () => {
  assert.equal(
    resolveSourceRepo({ recorded: "https://github.com/tpierrain/kenjaku.git", declared: "  \n " }),
    "https://github.com/tpierrain/kenjaku.git",
  );
  assert.equal(
    resolveSourceRepo({
      recorded: "https://github.com/tpierrain/second-brain-generator.git",
      declared: " https://github.com/tpierrain/kenjaku.git\n",
    }),
    "https://github.com/tpierrain/kenjaku.git",
  );
});

test("enrichManifest — sets source + provenance + baseRefs, preserves the rest, never mutates the input", () => {
  const original = {
    manifestVersion: 1,
    engineVersion: { rag: "1.1.0" },
    regimes: { merge: ["CLAUDE.md"] },
    provenance: {},
  };
  const source = { repo: "git@github.com:me/launcher.git", ref: "v1.1.0" };
  const provenance = { "CLAUDE.md": fingerprint("c") };
  const baseRefs = { "CLAUDE.md": "v1.1.0" };

  const enriched = enrichManifest(original, { source, provenance, baseRefs });

  assert.deepEqual(enriched, {
    manifestVersion: 1,
    engineVersion: { rag: "1.1.0" },
    regimes: { merge: ["CLAUDE.md"] },
    source,
    provenance,
    baseRefs,
  });
  // The input object is left untouched (still the empty provenance, still no source).
  assert.deepEqual(original.provenance, {});
  assert.equal("source" in original, false);
  assert.equal("baseRefs" in original, false);
});

// ── reseedProvenance: refresh the 3-way base after an update-engine swap (Step 5) ──
// After the engine swap, the base for Phase 2's 3-way must track ONLY the files the
// engine actually re-delivered (the merge-bucket engine scripts). Files the engine
// replaces outright (rag/src…) never carry a provenance base — same as at install.

test("reseedProvenance — refreshes the base ONLY for re-delivered merge files (replace-regime files stay out)", () => {
  const target = {
    regimes: {
      replace: ["rag/src/**"],
      merge: ["CLAUDE.md", "scripts/auto-commit.mjs"],
    },
  };
  const deliveredFileMap = {
    "scripts/auto-commit.mjs": "// auto-commit vB", // a re-delivered merge file → refresh
    "rag/src/index.ts": "// engine vB", // replace-regime → must NOT enter provenance
  };

  const reseeded = reseedProvenance({ priorProvenance: {}, manifest: target, deliveredFileMap });

  assert.deepEqual(reseeded, {
    "scripts/auto-commit.mjs": fingerprint("// auto-commit vB"),
  });
});

test("reseedProvenance — a user merge file the swap never touched KEEPS its prior base (Phase 2 still sees the edit)", () => {
  const target = { regimes: { merge: ["CLAUDE.md", "scripts/auto-commit.mjs"] } };
  const prior = {
    "CLAUDE.md": fingerprint("the engine's last-delivered constitution"),
    "scripts/auto-commit.mjs": fingerprint("// auto-commit vA"),
  };
  // Phase 1 re-delivers ONLY the engine script; CLAUDE.md is never touched.
  const deliveredFileMap = { "scripts/auto-commit.mjs": "// auto-commit vB" };

  const reseeded = reseedProvenance({ priorProvenance: prior, manifest: target, deliveredFileMap });

  assert.deepEqual(reseeded, {
    "CLAUDE.md": fingerprint("the engine's last-delivered constitution"), // preserved
    "scripts/auto-commit.mjs": fingerprint("// auto-commit vB"), // refreshed
  });
});

// ── reseedBaseRefs: WHICH engine version each base came from (S4) ────────────
// The base tree holds the last-delivered BYTES; nothing held the VERSION they came
// from, so a brain could say "you are holding this file back" and never "back from
// what". `baseRefs` is that missing half, and it means exactly one thing: the last
// engine version whose bytes this file actually received. One meaning, so no state
// machine — unlike a "first became held back" stamp, which would have to know when
// to stop moving.

test("reseedBaseRefs — stamps the ref on the re-delivered merge files, and on nothing else", () => {
  const target = {
    regimes: { replace: ["rag/src/**"], merge: ["CLAUDE.md", "scripts/auto-commit.mjs"] },
  };
  const deliveredFileMap = {
    "scripts/auto-commit.mjs": "// auto-commit vB",
    "rag/src/index.ts": "// engine vB", // replace-regime → never stamped
  };

  assert.deepEqual(reseedBaseRefs({ priorBaseRefs: {}, manifest: target, deliveredFileMap, ref: "v5.0.0" }), {
    "scripts/auto-commit.mjs": "v5.0.0",
  });
});

test("reseedBaseRefs — a file the update passed by KEEPS its older ref, which is the whole point", () => {
  // This is the sentence S4 exists to make possible: "coach last received an engine
  // version at v4.7.0, and this brain now runs v5.0.0". Move this entry forward and
  // every held-back file reads as up to date.
  const target = { regimes: { merge: ["CLAUDE.md", ".claude/skills/coach/SKILL.md"] } };
  const prior = { "CLAUDE.md": "v4.7.0", ".claude/skills/coach/SKILL.md": "v4.7.0" };

  assert.deepEqual(
    reseedBaseRefs({
      priorBaseRefs: prior,
      manifest: target,
      deliveredFileMap: { "CLAUDE.md": "the newer constitution" },
      ref: "v5.0.0",
    }),
    { "CLAUDE.md": "v5.0.0", ".claude/skills/coach/SKILL.md": "v4.7.0" },
  );
});

test("reseedBaseRefs — no usable ref stamps NOTHING, rather than recording a lie", () => {
  // An absent entry already means "unknown, say since your install". Writing `null`
  // or `""` as the version would make an unknown look like an answer, and every
  // reader downstream would have to know that it is not one.
  const target = { regimes: { merge: ["CLAUDE.md"] } };
  const delivered = { "CLAUDE.md": "content" };

  for (const ref of [null, undefined, ""]) {
    assert.deepEqual(
      reseedBaseRefs({ priorBaseRefs: { "CLAUDE.md": "v4.7.0" }, manifest: target, deliveredFileMap: delivered, ref }),
      { "CLAUDE.md": "v4.7.0" },
      `ref ${JSON.stringify(ref)} must leave the record untouched`,
    );
  }
});

test("reseedBaseRefs — an older brain with no record at all starts one, it does not crash", () => {
  const target = { regimes: { merge: ["CLAUDE.md"] } };

  assert.deepEqual(
    reseedBaseRefs({ priorBaseRefs: undefined, manifest: target, deliveredFileMap: { "CLAUDE.md": "c" }, ref: "v5.0.0" }),
    { "CLAUDE.md": "v5.0.0" },
  );
});

test("reseedBaseRefs — a manifest declaring no merge regime stamps nothing", () => {
  assert.deepEqual(
    reseedBaseRefs({ priorBaseRefs: {}, manifest: {}, deliveredFileMap: { "CLAUDE.md": "c" }, ref: "v5.0.0" }),
    {},
  );
});

// ── The thin I/O orchestrator the installer calls (real fs, git facts injected) ──

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

test("recordSourceAndProvenance — writes source + fingerprints ONLY the merge files into the brain's manifest", (t) => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-src-io-"));
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  writeFile(
    brainDir,
    "engine-manifest.json",
    JSON.stringify({
      manifestVersion: 1,
      engineVersion: { rag: "1.1.0" },
      regimes: {
        replace: ["rag/src/**"],
        merge: ["CLAUDE.md", ".claude/settings.json", ".claude/skills/coach/**", "scripts/auto-commit.mjs"],
      },
      provenance: {},
    }),
  );
  // merge files (get a provenance seed):
  writeFile(brainDir, "CLAUDE.md", "my constitution");
  writeFile(brainDir, ".claude/settings.json", '{"generated":true}');
  writeFile(brainDir, ".claude/skills/coach/SKILL.md", "coach skill");
  writeFile(brainDir, "scripts/auto-commit.mjs", "// auto-commit");
  // NON-merge files (must NEVER be fingerprinted — user property / engine replace):
  writeFile(brainDir, "vault/my-note.md", "Mollecuisse");
  writeFile(brainDir, ".claude/skills/zzz-mine/SKILL.md", "home-made");
  writeFile(brainDir, "rag/src/index.ts", "// engine");
  writeFile(brainDir, ".env", "GOOGLE_GEMINI_API_KEY=secret");

  recordSourceAndProvenance({
    brainDir,
    git: { repo: "git@github.com:me/launcher.git", tag: "v1.1.0", branch: "main", commit: "abc" },
  });

  const m = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  assert.deepEqual(m.source, { repo: "git@github.com:me/launcher.git", ref: "v1.1.0" });
  assert.deepEqual(m.provenance, {
    "CLAUDE.md": fingerprint("my constitution"),
    ".claude/settings.json": fingerprint('{"generated":true}'),
    ".claude/skills/coach/SKILL.md": fingerprint("coach skill"),
    "scripts/auto-commit.mjs": fingerprint("// auto-commit"),
  });
  // S4 — and WHICH version each of those bases came from. At install the answer is
  // exact for every merge file: they all arrived together, at the install ref. A
  // brain therefore knows "since when" from day one, rather than from its first update.
  assert.deepEqual(m.baseRefs, {
    "CLAUDE.md": "v1.1.0",
    ".claude/settings.json": "v1.1.0",
    ".claude/skills/coach/SKILL.md": "v1.1.0",
    "scripts/auto-commit.mjs": "v1.1.0",
  });
  // The rest of the manifest is preserved.
  assert.equal(m.engineVersion.rag, "1.1.0");

  // …and it is written as a well-formed text file: 2-space indent + a FINAL NEWLINE.
  // engine-manifest.json is git-committed and rewritten at every update, so a missing
  // trailing newline makes every single update diff carry a spurious
  // "\ No newline at end of file" — noise in the one file whose diff must stay readable.
  const raw = readFileSync(join(brainDir, "engine-manifest.json"), "utf8");
  assert.equal(raw, JSON.stringify(m, null, 2) + "\n");
});
