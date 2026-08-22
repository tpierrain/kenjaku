import test from "node:test";
import assert from "node:assert/strict";

import { engineDivergence } from "./engine-divergence.mjs";
import { fingerprint } from "./engine-source.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-divergence — WHICH engine files a brain is holding back, and since
// which engine version each of them last received bytes (S4-2).
//
// Pure and offline by construction: it is handed the manifest (the record) and
// the installed bytes (the disk), and answers with a list. No fs, no network,
// no release count — the two versions are named and the owner reads the
// distance, because counting releases would need a fetch for a number the
// versions already carry.
// ═══════════════════════════════════════════════════════════════════════════

const DELIVERED = "---\nname: coach\n---\nThe engine's own words.\n";
const EDITED = DELIVERED + "\nAnd the owner's.\n";

// A manifest in the shape the brain actually holds: the merge globs, the digest
// of what was last delivered, and (since S4-1) the version that delivered it.
function manifest({ provenance, baseRefs, merge = [".claude/skills/coach/SKILL.md"] } = {}) {
  return {
    manifestVersion: 1,
    regimes: {
      replace: ["rag/src/**"],
      merge,
    },
    source: { repo: "https://example.test/launcher.git", ref: "v5.0.0" },
    ...(provenance === undefined ? {} : { provenance }),
    ...(baseRefs === undefined ? {} : { baseRefs }),
  };
}

// ── The headline: an edited engine file, and the version it is behind ─────────

test("engineDivergence — an edited merge file is held back, and names the version that last reached it", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  // The WHOLE list, not just its first entry: the defect this module exists to end
  // is a file nobody mentions, so an extra entry is as wrong as a missing one.
  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: "v4.7.0" },
  ]);
});

test("engineDivergence — a file still matching what was delivered is holding nothing back", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": DELIVERED },
  });

  assert.deepEqual(result, []);
});

// ⚠️ The same normalization `verifyBase` already applies, asserted HERE too rather
// than trusted: a brain cloned on Windows can have its files rewritten LF→CRLF by
// git itself. Without this, the entire Windows fleet would be told it is holding
// back every single engine file — the loudest possible false positive.
test("engineDivergence — CRLF is not an edit: a Windows checkout of the delivered bytes is converged", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": DELIVERED.split("\n").join("\r\n") },
  });

  assert.deepEqual(result, []);
});

// ── The silence the field finding is about, given a name instead ──────────────

test("engineDivergence — a merge file with no recorded base says exactly that, and is never called an edit", () => {
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {} }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "no-provenance", since: null },
  ]);
});

test("engineDivergence — a held-back file whose version was never recorded says null, never a guess", () => {
  // A brain installed before S4: it has digests, so the edit is provable, but nothing
  // says which version delivered them. `null` is the honest answer and the caller turns
  // it into "since your install" — inventing `source.ref` here would name the version
  // the brain runs TODAY as the one the file is behind, which is the exact confusion
  // `baseRefs` was added to end.
  const result = engineDivergence({
    manifest: manifest({ provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) } }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: null },
  ]);
});

// ── What is NOT divergence, pinned so the list cannot quietly grow ────────────

test("engineDivergence — a file outside the merge regime is never held back, whatever its bytes say", () => {
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {} }),
    // A `replace` file is overwritten whole at every update: it carries no base, and
    // "held back" is meaningless for a file the engine never asks permission about.
    installedFileMap: { "rag/src/index.ts": "// the owner's own edit\n" },
  });

  assert.deepEqual(result, []);
});

// ⚠️ THE ONE FILE THIS REPORT MAY NOT NAME (F1 of the v5.0.0 code review; Thomas's
// call, 2026-08-22 — *"ne parler que des fichiers vraiment tenus par toi"*). The
// product's own doctrine tells the owner to edit their constitution, so every brain
// diverges on it within days and forever; no refresh family ever writes a `.new`
// beside it, so the line can never be dismissed either. Naming it is a false claim AND
// the consent fatigue this surface exists to prevent.
//
// Fed with an owner-edited engine skill IN THE SAME CALL, deliberately: an
// implementation that answered `[]` by going silent altogether would satisfy a
// one-file fixture and destroy the feature.
test("engineDivergence — the constitution the product TELLS the owner to edit is never called held back", () => {
  const merge = ["CLAUDE.md", ".claude/skills/coach/SKILL.md"];
  const result = engineDivergence({
    manifest: manifest({
      provenance: Object.fromEntries(merge.map((rel) => [rel, fingerprint(DELIVERED)])),
      baseRefs: { "CLAUDE.md": "v4.7.0", ".claude/skills/coach/SKILL.md": "v4.7.0" },
      merge,
    }),
    installedFileMap: { "CLAUDE.md": EDITED, ".claude/skills/coach/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: "v4.7.0" },
  ]);
});

// The other half of the same claim, and it is not a duplicate: `no-provenance` is a
// DIFFERENT branch of the loop, and it is the one the whole deployed fleet is in for
// `CLAUDE.md` (no brain installed before v5 recorded a base for a file no regime named).
// Silencing only the `customized` branch would leave the fleet-wide line exactly where
// it was.
test("engineDivergence — an unprovable constitution is silent too, not merely an unproven one", () => {
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {}, merge: ["CLAUDE.md"] }),
    installedFileMap: { "CLAUDE.md": EDITED },
  });

  assert.deepEqual(result, []);
});

// ── S12: WHERE that exemption is written down ────────────────────────────────
//
// It was a `new Set(["CLAUDE.md"])` in this module, while every other question about
// file families — which are replaced, merged, regenerated, retired — is answered per
// release by `engine-manifest.json` and carried onto older brains by `advanceRegimes`.
// A list in code can only reach a brain by shipping a release; a list in the manifest
// reaches one at its next update, which is the whole point of the machinery.
//
// It rides INSIDE `regimes` for exactly that reason — that object is what
// `advanceRegimes` copies — and it is NOT a delivery family: `CLAUDE.md` stays under
// `merge` and is delivered exactly as before, and `regimeOf` walks a fixed list of the
// four delivery regimes, so the write guard never sees this key.
test("engineDivergence — the invited list is DECLARED by the release, not compiled into the engine", () => {
  // A brain whose release invited edits somewhere else entirely: the declaration has to
  // work in BOTH directions, or it is a default with extra steps. `CLAUDE.md` is edited
  // in the same call and must now be REPORTED, because this manifest no longer exempts it.
  const merge = ["CLAUDE.md", ".claude/skills/mine/SKILL.md"];
  const result = engineDivergence({
    manifest: {
      ...manifest({ provenance: {}, baseRefs: {}, merge }),
      regimes: { replace: ["rag/src/**"], merge, invited: [".claude/skills/mine/**"] },
    },
    installedFileMap: { "CLAUDE.md": EDITED, ".claude/skills/mine/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [{ rel: "CLAUDE.md", reason: "no-provenance", since: null }]);
});

test("engineDivergence — a manifest that declares no invited list still spares the constitution", () => {
  // NOT a defensive default: this is a state the fleet was measurably in. An update is
  // performed by the brain's OLD engine, and until the first-update fix landed on
  // 2026-08-23 the new code could sit beside a manifest whose families had never been
  // advanced. Falling back to an empty list there would put the fleet-wide line about
  // the constitution straight back, on the one run nobody could dismiss it.
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {}, merge: ["CLAUDE.md"] }),
    installedFileMap: { "CLAUDE.md": EDITED },
  });

  assert.deepEqual(result, []);
});

// 🛑 The exemption is a NAME, not a shape: `CLAUDE.engine.md` is the ENGINE's half of
// the constitution — the engine writes it, the owner is never asked to — so it stays in
// the report. One dot apart, and the opposite verdict.
test("engineDivergence — the ENGINE's half of the constitution is still reported", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { "CLAUDE.engine.md": fingerprint(DELIVERED) },
      baseRefs: { "CLAUDE.engine.md": "v4.7.0" },
      merge: ["CLAUDE.engine.md"],
    }),
    installedFileMap: { "CLAUDE.engine.md": EDITED },
  });

  assert.deepEqual(result, [{ rel: "CLAUDE.engine.md", reason: "customized", since: "v4.7.0" }]);
});

test("engineDivergence — a recorded file the owner DELETED is not reported as held back", () => {
  // It is absent from the disk map, so it is absent from the answer. Deliberate: the
  // install-if-absent path re-delivers a deleted engine file at the next update, so it
  // is not being held back — it is on its way back. A different fact deserves a
  // different sentence, and this module owns exactly one.
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: {},
  });

  assert.deepEqual(result, []);
});

test("engineDivergence — a brain that records nothing at all reports nothing, rather than throwing", () => {
  assert.deepEqual(engineDivergence({ manifest: {}, installedFileMap: {} }), []);
  assert.deepEqual(engineDivergence({ manifest: manifest(), installedFileMap: {} }), []);
});

// ⚠️ A manifest that could not be read is a REAL input, not a defensive flourish: the
// write guard already established the idiom (a failed manifest read yields `null` and
// the pass keeps going), and S4's session surface will run in exactly that world. Fed
// with files on disk, so a version of this that reached for `manifest.provenance`
// would throw here rather than pass vacuously.
test("engineDivergence — a manifest the brain could not read at all reports nothing, rather than throwing", () => {
  const onDisk = { ".claude/skills/coach/SKILL.md": EDITED, "CLAUDE.md": EDITED };
  assert.deepEqual(engineDivergence({ manifest: null, installedFileMap: onDisk }), []);
  assert.deepEqual(engineDivergence({ manifest: undefined, installedFileMap: onDisk }), []);
});

// ── Order is part of the contract, because a human reads this ─────────────────

test("engineDivergence — the list is sorted by path, not by the order the disk was walked", () => {
  // ⚠️ `CLAUDE.engine.md`, never `CLAUDE.md`: the owner's half is exempt from this
  // report (see the test above), so using it here would pin the ORDER of a list it can
  // no longer appear in — a fixture that proves nothing while looking thorough.
  const merge = ["CLAUDE.engine.md", ".claude/settings.json", "scripts/auto-commit.mjs"];
  const result = engineDivergence({
    manifest: manifest({
      provenance: Object.fromEntries(merge.map((rel) => [rel, fingerprint(DELIVERED)])),
      baseRefs: { "CLAUDE.engine.md": "v4.7.0", "scripts/auto-commit.mjs": "v4.9.0" },
      merge,
    }),
    // ⚠️ A ROTATION, deliberately — neither sorted nor exactly REVERSED. This fixture
    // was a perfect reversal at first, and a comparator mutated to always return -1
    // (i.e. no comparison at all) reverses the array and produced the expected answer
    // by accident. A sort test whose input is the mirror of its expectation proves the
    // array was flipped, not that it was ordered.
    installedFileMap: {
      "CLAUDE.engine.md": EDITED,
      ".claude/settings.json": EDITED,
      "scripts/auto-commit.mjs": EDITED,
    },
  });

  assert.deepEqual(result, [
    { rel: ".claude/settings.json", reason: "customized", since: null },
    { rel: "CLAUDE.engine.md", reason: "customized", since: "v4.7.0" },
    { rel: "scripts/auto-commit.mjs", reason: "customized", since: "v4.9.0" },
  ]);
});

// ── S4 (second pass) — the ancestor THIS machine holds outranks the digest the
// shared manifest REMEMBERS ─────────────────────────────────────────────────────

// `.claude/settings.json` bakes an absolute path, so it is gitignored and regenerated on
// every machine — while the manifest that records its digest TRAVELS in the clone. A
// second machine therefore holds bytes of its own against a digest taken on machine A's,
// and the verdict `customized` is a claim about an owner who has touched nothing.
//
// `.engine-base/` is the bytes the ENGINE last wrote HERE. Where the brain holds them,
// they answer the question the digest was only ever a proxy for.
const OTHER_MACHINE = "{ \"root\": \"/Users/alice/brain\" }\n";
const THIS_MACHINE = "{ \"root\": \"/Users/bob/brain\" }\n";
const SETTINGS = ".claude/settings.json";

test("engineDivergence — bytes matching this machine's ancestor are not held back, whatever the shared manifest recorded", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { [SETTINGS]: fingerprint(OTHER_MACHINE) },
      baseRefs: { [SETTINGS]: "v5.0.0" },
      merge: [SETTINGS],
    }),
    installedFileMap: { [SETTINGS]: THIS_MACHINE },
    baseContentMap: { [SETTINGS]: THIS_MACHINE },
  });

  assert.deepEqual(result, []);
});

test("engineDivergence — an owner's edit is still reported, ancestor or no ancestor", () => {
  // The half that must NOT be silenced: the ancestor is what the engine wrote here, so
  // bytes that differ from it are the owner's, and that is the whole point of the report.
  assert.deepEqual(
    engineDivergence({
      manifest: manifest({
        provenance: { [SETTINGS]: fingerprint(OTHER_MACHINE) },
        baseRefs: { [SETTINGS]: "v5.0.0" },
        merge: [SETTINGS],
      }),
      installedFileMap: { [SETTINGS]: THIS_MACHINE + "// and the owner's own line\n" },
      baseContentMap: { [SETTINGS]: THIS_MACHINE },
    }),
    [{ rel: SETTINGS, reason: "customized", since: "v5.0.0" }],
  );
});

test("engineDivergence — with no ancestor on this machine, the recorded digest still decides", () => {
  // The fallback is the behaviour of every release so far, and it has to stay: a brain
  // that holds no `.engine-base/` entry for a file has nothing better to judge it by.
  // `null` is what `readBaseTree` returns for "no bytes", so it is what is fed here.
  assert.deepEqual(
    engineDivergence({
      manifest: manifest({
        provenance: { [SETTINGS]: fingerprint(OTHER_MACHINE) },
        baseRefs: { [SETTINGS]: "v5.0.0" },
        merge: [SETTINGS],
      }),
      installedFileMap: { [SETTINGS]: THIS_MACHINE },
      baseContentMap: { [SETTINGS]: null },
    }),
    [{ rel: SETTINGS, reason: "customized", since: "v5.0.0" }],
  );
  // And with no map at all — the caller that never read the tree.
  assert.equal(
    engineDivergence({
      manifest: manifest({ provenance: { [SETTINGS]: fingerprint(OTHER_MACHINE) }, merge: [SETTINGS] }),
      installedFileMap: { [SETTINGS]: THIS_MACHINE },
    }).length,
    1,
  );
});

test("engineDivergence — a Windows checkout's CRLF ancestor still matches, exactly as the digest path forgives it", () => {
  // The same forgiveness `verifyBase` grants, and for the same reason: git rewrote the
  // line endings, the owner did not. A second definition of "unchanged" here would put
  // the whole Windows fleet back in the report.
  assert.deepEqual(
    engineDivergence({
      manifest: manifest({ provenance: { [SETTINGS]: fingerprint(OTHER_MACHINE) }, merge: [SETTINGS] }),
      installedFileMap: { [SETTINGS]: THIS_MACHINE.split("\n").join("\r\n") },
      baseContentMap: { [SETTINGS]: THIS_MACHINE },
    }),
    [],
  );
});
