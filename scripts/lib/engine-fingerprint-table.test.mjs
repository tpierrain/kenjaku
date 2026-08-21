import { test } from "node:test";
import assert from "node:assert/strict";

import {
  installedRelOf,
  selectFingerprintSources,
  buildFingerprintTable,
} from "./engine-fingerprint-table.mjs";
import { healProvenance } from "./engine-heal.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-fingerprint-table — the PURE half of S7-2's generator (plan
// v5-unfreezes-the-existing-fleet-action.md § S7).
//
// `healProvenance` proves an installed file is untouched by RECOGNISING its bytes
// in a table of every version the engine ever published. This module builds that
// table. The git I/O (25 tags, two locales) lives in the maintainer script
// `maintainers/fingerprints/generate-fingerprints.mjs`; everything that can be
// wrong lives here, where CI runs it.
//
// 🛑 THE TWO WAYS THIS CAN LIE, and every test below exists for one of them:
//
//  1. A MISSING row leaves a brain frozen. The gate must run on the INSTALLED REL,
//     never on the source path — a French brain holds the bytes of
//     `templates/fr/CLAUDE.engine.md` AT `CLAUDE.engine.md`, and a gate that asks
//     the merge regime about the source path finds nothing and heals neither of the
//     owner's two real brains (S7-0, Correction 3).
//  2. A WRONG row CLOBBERS THE OWNER. A digest attributed to the wrong rel makes an
//     edited file read as untouched, and the next update overwrites the edit it was
//     built to preserve. That is why `since` is FIRST-WRITER-WINS over versions fed
//     in ascending order: the release being cut may only ever claim bytes nobody
//     shipped before it.
//
// Fixtures: every sha256 below was computed OUTSIDE this codebase (`shasum -a 256`),
// never through `fingerprint()`, so "the table records the right bytes" cannot be
// true by construction.
// ═══════════════════════════════════════════════════════════════════════════

const EN_V1 = "doctrine v1\n";
const EN_V2 = "doctrine v2\n";
const FR_V1 = "doctrine fr v1\n";
const SHARED = "shared bytes\n";

const SHA_EN_V1 = "sha256:6e7efd84e8eb4690ebf26d2d8bd03db7e54e741fe6fbcbc30432293fa3923e14";
const SHA_EN_V2 = "sha256:a2689497ccae3a77a9d1a7cd3a23085c408b3c27e8889c89ddd3cc21d12024ab";
const SHA_FR_V1 = "sha256:f82adeb73589cb1cf6cf5805f1c8f29826093cba4a2ff13f6ffe4447d932cd5a";
const SHA_SHARED = "sha256:ee392e7ce57b7406be2939363d0c2acfd7116af1a8085876355e605a342dfa13";

const MANIFEST = {
  regimes: {
    merge: ["CLAUDE.engine.md", ".claude/skills/coach/**"],
    replace: ["scripts/lib/**"],
  },
  retired: [".claude/skills/tdd-discipline/**"],
};

// ── installedRelOf — the mapping Correction 3 turns on ──────────────────────

test("installedRelOf — a root path IS its own installed rel, and its locale is en", () => {
  assert.deepEqual(installedRelOf("CLAUDE.engine.md"), {
    rel: "CLAUDE.engine.md",
    locale: "en",
  });
});

test("installedRelOf — templates/<locale>/<rel> strips the two leading segments and names the locale", () => {
  assert.deepEqual(installedRelOf("templates/fr/CLAUDE.engine.md"), {
    rel: "CLAUDE.engine.md",
    locale: "fr",
  });
});

test("installedRelOf — a NESTED localized path keeps every segment of its rel", () => {
  assert.deepEqual(installedRelOf("templates/fr/.claude/skills/coach/SKILL.md"), {
    rel: ".claude/skills/coach/SKILL.md",
    locale: "fr",
  });
});

test("installedRelOf — a locale OTHER than fr is reported as itself, never assumed", () => {
  assert.deepEqual(installedRelOf("templates/es/CLAUDE.engine.md"), {
    rel: "CLAUDE.engine.md",
    locale: "es",
  });
});

test("installedRelOf — a path UNDER templates/ with no rel left is not a localized source", () => {
  // `templates/fr/` names a directory, not a file: there is no rel to install it
  // at. Answering `{rel: "", locale: "fr"}` would inject an empty key into the
  // table that no lookup can ever match.
  assert.deepEqual(installedRelOf("templates/fr/"), {
    rel: "templates/fr/",
    locale: "en",
  });
});

test("installedRelOf — a path merely STARTING with the word templates is a root path", () => {
  assert.deepEqual(installedRelOf("templates-notes.md"), {
    rel: "templates-notes.md",
    locale: "en",
  });
});

// ── selectFingerprintSources — the gate, run on the rel ─────────────────────

test("selectFingerprintSources — a merge file and its FR twin BOTH survive, under the same rel", () => {
  const sources = selectFingerprintSources({
    manifest: MANIFEST,
    sourceFiles: ["CLAUDE.engine.md", "templates/fr/CLAUDE.engine.md"],
  });

  assert.deepEqual(sources, [
    { sourcePath: "CLAUDE.engine.md", rel: "CLAUDE.engine.md", locale: "en" },
    { sourcePath: "templates/fr/CLAUDE.engine.md", rel: "CLAUDE.engine.md", locale: "fr" },
  ]);
});

test("selectFingerprintSources — a file in ANOTHER regime is dropped, twin included", () => {
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: ["scripts/lib/demo-locale.mjs", "templates/fr/scripts/lib/demo-locale.mjs"],
    }),
    [],
  );
});

test("selectFingerprintSources — a RETIRED file is dropped, and so is its FR twin", () => {
  // The tombstone is honoured AT GENERATION as well as at lookup: a file the
  // engine no longer ships must not be healable into existence.
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: [
        ".claude/skills/tdd-discipline/SKILL.md",
        "templates/fr/.claude/skills/tdd-discipline/SKILL.md",
      ],
    }),
    [],
  );
});

test("selectFingerprintSources — the output is sorted by rel then locale, whatever the input order", () => {
  // Unsorted in BOTH directions, or a comparator that never swaps would be
  // indistinguishable from one that sorts (the lesson S7-1's mutation run taught).
  const sources = selectFingerprintSources({
    manifest: MANIFEST,
    sourceFiles: [
      "templates/fr/CLAUDE.engine.md",
      ".claude/skills/coach/SKILL.md",
      "CLAUDE.engine.md",
      "templates/fr/.claude/skills/coach/SKILL.md",
    ],
  });

  assert.deepEqual(
    sources.map((s) => `${s.rel}#${s.locale}`),
    [
      ".claude/skills/coach/SKILL.md#en",
      ".claude/skills/coach/SKILL.md#fr",
      "CLAUDE.engine.md#en",
      "CLAUDE.engine.md#fr",
    ],
  );
});

test("selectFingerprintSources — an empty tree yields no sources, and does not throw", () => {
  assert.deepEqual(selectFingerprintSources({ manifest: MANIFEST, sourceFiles: [] }), []);
});

// ── buildFingerprintTable — the fold ────────────────────────────────────────

const versionsOf = (...versions) => buildFingerprintTable({ generatedAt: "v5.0.0", versions });

test("buildFingerprintTable — two byte-states of one rel become two keys, each with its own since", () => {
  const table = versionsOf(
    { version: "v3.6.0", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 }] },
    { version: "v4.0.0", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V2 }] },
  );

  assert.deepEqual(table, {
    generatedAt: "v5.0.0",
    files: {
      "CLAUDE.engine.md": {
        [SHA_EN_V1]: { since: "v3.6.0", locale: "en" },
        [SHA_EN_V2]: { since: "v4.0.0", locale: "en" },
      },
    },
  });
});

test("buildFingerprintTable — bytes that survive several tags keep the EARLIEST as since", () => {
  const table = versionsOf(
    { version: "v3.6.0", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 }] },
    { version: "v4.0.0", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 }] },
    { version: "v4.9.1", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 }] },
  );

  assert.deepEqual(table.files["CLAUDE.engine.md"], {
    [SHA_EN_V1]: { since: "v3.6.0", locale: "en" },
  });
});

test("buildFingerprintTable — EN and FR of one rel are two entries under that ONE rel", () => {
  const table = versionsOf({
    version: "v3.6.0",
    files: [
      { rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 },
      { rel: "CLAUDE.engine.md", locale: "fr", content: FR_V1 },
    ],
  });

  assert.deepEqual(table.files["CLAUDE.engine.md"], {
    [SHA_EN_V1]: { since: "v3.6.0", locale: "en" },
    [SHA_FR_V1]: { since: "v3.6.0", locale: "fr" },
  });
});

test("buildFingerprintTable — when EN and FR hold the SAME bytes, the first one folded wins the locale", () => {
  // One digest cannot carry two locales. The entry stays a REPORT, not a fact to
  // reason on — nothing in the heal path branches on it.
  const table = versionsOf({
    version: "v3.6.0",
    files: [
      { rel: "CLAUDE.engine.md", locale: "en", content: SHARED },
      { rel: "CLAUDE.engine.md", locale: "fr", content: SHARED },
    ],
  });

  assert.deepEqual(table.files["CLAUDE.engine.md"], {
    [SHA_SHARED]: { since: "v3.6.0", locale: "en" },
  });
});

test("buildFingerprintTable — rels come out sorted, so the committed artefact diffs cleanly", () => {
  const table = versionsOf({
    version: "v3.6.0",
    files: [
      { rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 },
      { rel: ".claude/skills/coach/SKILL.md", locale: "en", content: EN_V2 },
    ],
  });

  assert.deepEqual(Object.keys(table.files), [
    ".claude/skills/coach/SKILL.md",
    "CLAUDE.engine.md",
  ]);
});

test("buildFingerprintTable — no versions at all yields an empty table, never a crash", () => {
  assert.deepEqual(buildFingerprintTable({ generatedAt: "v5.0.0", versions: [] }), {
    generatedAt: "v5.0.0",
    files: {},
  });
});

test("buildFingerprintTable — a version that shipped no merge file adds no rel", () => {
  const table = versionsOf(
    { version: "v3.0.0", files: [] },
    { version: "v3.6.0", files: [{ rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 }] },
  );

  assert.deepEqual(table.files["CLAUDE.engine.md"], {
    [SHA_EN_V1]: { since: "v3.6.0", locale: "en" },
  });
});

test("buildFingerprintTable — generatedAt is carried through verbatim, not invented", () => {
  assert.equal(buildFingerprintTable({ generatedAt: "v9.9.9", versions: [] }).generatedAt, "v9.9.9");
});

// ── The one test that judges the pair: the table HEALS ──────────────────────

test("a table built here unfreezes a French brain through healProvenance", () => {
  // The end-to-end claim of S7, in one assertion: bytes that came from
  // `templates/fr/CLAUDE.engine.md` at v3.6.0 are recognised on a brain that
  // holds them at `CLAUDE.engine.md` with NO provenance at all.
  const table = versionsOf({
    version: "v3.6.0",
    files: [
      { rel: "CLAUDE.engine.md", locale: "en", content: EN_V1 },
      { rel: "CLAUDE.engine.md", locale: "fr", content: FR_V1 },
    ],
  });

  const healed = healProvenance({
    manifest: MANIFEST,
    provenance: {},
    installedFileMap: { "CLAUDE.engine.md": FR_V1 },
    table,
  });

  assert.deepEqual(healed, {
    provenance: { "CLAUDE.engine.md": SHA_FR_V1 },
    baseRefs: { "CLAUDE.engine.md": "v3.6.0" },
    healed: [{ rel: "CLAUDE.engine.md", since: "v3.6.0", locale: "fr" }],
  });
});
