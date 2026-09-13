import { test } from "node:test";
import assert from "node:assert/strict";

import {
  installedRelOf,
  selectFingerprintSources,
  deliveredSources,
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

// Two lines, because the EOL fixtures below need a line ending IN the content and a
// one-liner's trailing "\n" is too easy to normalise by accident.
const EN_V1_TWO_LINES = "doctrine\nv1\n";

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
    staged: false,
  });
});

test("installedRelOf — templates/<locale>/<rel> strips the two leading segments and names the locale", () => {
  assert.deepEqual(installedRelOf("templates/fr/CLAUDE.engine.md"), {
    rel: "CLAUDE.engine.md",
    locale: "fr",
    staged: false,
  });
});

test("installedRelOf — a NESTED localized path keeps every segment of its rel", () => {
  assert.deepEqual(installedRelOf("templates/fr/.claude/skills/coach/SKILL.md"), {
    rel: ".claude/skills/coach/SKILL.md",
    locale: "fr",
    staged: false,
  });
});

test("installedRelOf — a locale OTHER than fr is reported as itself, never assumed", () => {
  assert.deepEqual(installedRelOf("templates/es/CLAUDE.engine.md"), {
    rel: "CLAUDE.engine.md",
    locale: "es",
    staged: false,
  });
});

test("installedRelOf — a path UNDER templates/ with no rel left is not a localized source", () => {
  // `templates/fr/` names a directory, not a file: there is no rel to install it
  // at. Answering `{rel: "", locale: "fr"}` would inject an empty key into the
  // table that no lookup can ever match.
  assert.deepEqual(installedRelOf("templates/fr/"), {
    rel: "templates/fr/",
    locale: "en",
    staged: false,
  });
});

test("installedRelOf — a root path that CONTAINS templates/<locale>/ is not localized", () => {
  // Demanded by the mutation run: without the `^` anchor a demo note living under
  // `vault/templates/fr/` would be filed under the rel `note.md` in locale fr —
  // a WRONG row, which is the clobber risk, not merely a missing one.
  assert.deepEqual(installedRelOf("vault/templates/fr/note.md"), {
    rel: "vault/templates/fr/note.md",
    locale: "en",
    staged: false,
  });
});

test("installedRelOf — a path merely STARTING with the word templates is a root path", () => {
  assert.deepEqual(installedRelOf("templates-notes.md"), {
    rel: "templates-notes.md",
    locale: "en",
    staged: false,
  });
});

// ── installedRelOf, the STAGED family (#115) ────────────────────────────────
//
// A staged skill ships at `engine-skills/<name>/…` and is install-if-absent'd into
// `.claude/skills/<name>/…` (ADR 0026). The table is keyed by the INSTALLED rel for
// the same reason Correction 3 gave for locales: what a brain holds is what must be
// recognisable. Ship the row under the STAGING path and the heal looks up a key no
// brain has, which is the freeze this fix exists to end.

test("installedRelOf — a staged skill's source names the path a brain INSTALLS it at", () => {
  assert.deepEqual(installedRelOf("engine-skills/lint/SKILL.md"), {
    rel: ".claude/skills/lint/SKILL.md",
    locale: "en",
    staged: true,
  });
});

test("installedRelOf — a staged skill's nested file keeps every segment below the skill name", () => {
  assert.deepEqual(installedRelOf("engine-skills/rag/references/queries.md"), {
    rel: ".claude/skills/rag/references/queries.md",
    locale: "en",
    staged: true,
  });
});

test("installedRelOf — a staged skill's FR twin installs at the SAME rel, and names its locale", () => {
  // The two mappings compose, in this order: strip the locale, then the staging
  // prefix. `installStagedSkills` resolves `templates/<locale>/engine-skills/…` and
  // writes `.claude/skills/…` either way (ADR 0040 rule 3), so the table must fold
  // the twin under that one rel or a French brain is recognised by nothing.
  assert.deepEqual(installedRelOf("templates/fr/engine-skills/lint/SKILL.md"), {
    rel: ".claude/skills/lint/SKILL.md",
    locale: "fr",
    staged: true,
  });
});

test("installedRelOf — a staging path with no file under the skill name is not a staged source", () => {
  // Same reasoning as `templates/fr/` above, and the same `(.+)`: `engine-skills/lint`
  // names a directory. Mapping it would inject `.claude/skills/lint` — a key no
  // lookup can match, and one that is not a file.
  assert.deepEqual(installedRelOf("engine-skills/lint"), {
    rel: "engine-skills/lint",
    locale: "en",
    staged: false,
  });
});

test("installedRelOf — a path merely CONTAINING engine-skills/ is not staged", () => {
  // The `^` anchor, for the same reason the locale regex carries one: a demo note
  // under `vault/engine-skills/` would otherwise be filed at an installed rel that is
  // not its own — a WRONG row, i.e. the clobber risk, not merely a missing one.
  assert.deepEqual(installedRelOf("vault/engine-skills/lint/SKILL.md"), {
    rel: "vault/engine-skills/lint/SKILL.md",
    locale: "en",
    staged: false,
  });
});

test("installedRelOf — a path merely STARTING with the word engine-skills is a root path", () => {
  assert.deepEqual(installedRelOf("engine-skills-notes.md"), {
    rel: "engine-skills-notes.md",
    locale: "en",
    staged: false,
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

// ── selectFingerprintSources, the STAGED family (#115) ──────────────────────
//
// 🚨 THE DEFECT THIS CLOSES, and it is the whole of #115. A staged skill is in NO
// merge glob — that is what ADR 0026 buys — so `selectMergeFiles` drops it and the
// table has never held a single row for one. Its stand-in proof is the brain's OWN
// `engine-skills/` copy, which an update advances one pass before the installed skill,
// so from that update on the two disagree FOR EVER: `mergeVerdict` reads the installed
// file as an owner edit and hands out a `.new` sidecar at every release.
//
// Membership in a table of what the engine really published is the proof that cannot
// drift, and these rows are what make it available for staged skills too.

test("selectFingerprintSources — a staged skill survives, keyed by the path a brain installs it at", () => {
  // `.claude/skills/lint/**` is in NO regime of MANIFEST, deliberately: if this passed
  // because the manifest named it, it would prove nothing about the staged family.
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: ["engine-skills/lint/SKILL.md"],
    }),
    [{ sourcePath: "engine-skills/lint/SKILL.md", rel: ".claude/skills/lint/SKILL.md", locale: "en" }],
  );
});

test("selectFingerprintSources — a staged skill's FR twin survives too, under that same rel", () => {
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: ["templates/fr/engine-skills/lint/SKILL.md", "engine-skills/lint/SKILL.md"],
    }),
    [
      { sourcePath: "engine-skills/lint/SKILL.md", rel: ".claude/skills/lint/SKILL.md", locale: "en" },
      {
        sourcePath: "templates/fr/engine-skills/lint/SKILL.md",
        rel: ".claude/skills/lint/SKILL.md",
        locale: "fr",
      },
    ],
  );
});

test("selectFingerprintSources — a RETIRED staged skill is dropped, tombstones gate both families", () => {
  // The tombstone is spelled at the INSTALLED path (`.claude/skills/tdd-discipline/**`),
  // which is the only place it could be: that is where the brain holds the skill. A
  // gate applied to the staging path would let a retired skill be healed back into
  // recognition, and `selectMergeFiles` already refuses exactly that next door.
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: [
        "engine-skills/tdd-discipline/SKILL.md",
        "templates/fr/engine-skills/tdd-discipline/SKILL.md",
      ],
    }),
    [],
  );
});

test("selectFingerprintSources — a staging path that names no file under a skill is dropped", () => {
  // The other half of `installedRelOf`'s `(.+)`: unmapped, it falls back to its own
  // path, which is in no regime — so it must not reach the table by either door.
  assert.deepEqual(
    selectFingerprintSources({ manifest: MANIFEST, sourceFiles: ["engine-skills/lint"] }),
    [],
  );
});

test("selectFingerprintSources — staged and merge sources sort together, by the rel a brain holds", () => {
  // One table, one ordering. The two families are indistinguishable downstream — which
  // is the point: `healOne` asks the same question of every row.
  assert.deepEqual(
    selectFingerprintSources({
      manifest: MANIFEST,
      sourceFiles: [
        "CLAUDE.engine.md",
        "engine-skills/lint/SKILL.md",
        ".claude/skills/coach/SKILL.md",
      ],
    }).map((s) => s.rel),
    [".claude/skills/coach/SKILL.md", ".claude/skills/lint/SKILL.md", "CLAUDE.engine.md"],
  );
});

test("selectFingerprintSources — an empty tree yields no sources, and does not throw", () => {
  assert.deepEqual(selectFingerprintSources({ manifest: MANIFEST, sourceFiles: [] }), []);
});

// ── deliveredSources — the bytes the release SHIPS, not the ones on this disk ──
//
// 🪟 THE DEFECT THIS EXISTS AGAINST, and it is a MAINTAINER's, not a user's: the
// generator folds the release being cut from the WORKING TREE, and git for Windows
// checks that tree out as CRLF. Cut a release from a Windows clone and every row of
// the new version is a CRLF digest — a table that recognises the bytes NO brain
// holds, so the fleet stays frozen and the artefact looks perfectly normal.
//
// The oracle is not "which platform am I on": it is `deliversAsLf`, the same
// function the installer copies with. What the table records is what a brain
// RECEIVES — LF for anything the index holds as LF, verbatim for everything else.
//
// It is also why the S7-2 freshness guard was the last Windows red on CI: it read
// the same working tree and compared it to an LF table. Both callers now share this
// one function, so they cannot drift apart into a green guard over a wrong table.

const EOL_LF = { index: "i/lf", worktree: "w/crlf", attr: "" };

const sourcesOf = ({ files, eolByPath }) =>
  deliveredSources({
    manifest: MANIFEST,
    sourceFiles: Object.keys(files),
    eolByPath,
    read: (sourcePath) => files[sourcePath],
  });

test("deliveredSources — an i/lf file checked out as CRLF is folded as LF: the Windows cut", () => {
  assert.deepEqual(
    sourcesOf({
      files: { "CLAUDE.engine.md": "doctrine\r\nv1\r\n" },
      eolByPath: { "CLAUDE.engine.md": EOL_LF },
    }),
    [
      {
        sourcePath: "CLAUDE.engine.md",
        rel: "CLAUDE.engine.md",
        locale: "en",
        content: EN_V1_TWO_LINES,
      },
    ],
  );
});

test("deliveredSources — bytes the index itself holds as CRLF are folded VERBATIM", () => {
  // `i/crlf` means the launcher really committed those bytes, so that is what a
  // brain receives. Normalising here would record a byte-state nothing installs.
  assert.deepEqual(
    sourcesOf({
      files: { "CLAUDE.engine.md": "doctrine\r\nv1\r\n" },
      eolByPath: { "CLAUDE.engine.md": { index: "i/crlf", worktree: "w/crlf", attr: "" } },
    }).map((s) => s.content),
    ["doctrine\r\nv1\r\n"],
  );
});

test("deliveredSources — an explicit eol=crlf attribute is folded VERBATIM, LF index or not", () => {
  // The `.cmd` case: `.gitattributes` wins over the index form, the installer
  // delivers CRLF, and a table folded from LF would call that file edited.
  assert.deepEqual(
    sourcesOf({
      files: { "CLAUDE.engine.md": "doctrine\r\nv1\r\n" },
      eolByPath: { "CLAUDE.engine.md": { index: "i/lf", worktree: "w/crlf", attr: "text eol=crlf" } },
    }).map((s) => s.content),
    ["doctrine\r\nv1\r\n"],
  );
});

test("deliveredSources — a path git said NOTHING about is folded verbatim, never guessed", () => {
  // `git ls-files --eol` is best effort in both callers. An empty map must mean
  // "verbatim, exactly as before" — the installer's own refusal. The net against a
  // CRLF table slipping through that way is the macOS leg of CI, whose working tree
  // is LF: the freshness guard goes red there on every row.
  assert.deepEqual(
    sourcesOf({
      files: { "CLAUDE.engine.md": "doctrine\r\nv1\r\n" },
      eolByPath: {},
    }).map((s) => s.content),
    ["doctrine\r\nv1\r\n"],
  );
});

test("deliveredSources — every locale is read at its OWN source path, and comes out sorted", () => {
  assert.deepEqual(
    sourcesOf({
      files: {
        "templates/fr/CLAUDE.engine.md": "doctrine fr\r\nv1\r\n",
        "CLAUDE.engine.md": "doctrine\r\nv1\r\n",
      },
      eolByPath: {
        "CLAUDE.engine.md": EOL_LF,
        "templates/fr/CLAUDE.engine.md": EOL_LF,
      },
    }),
    [
      {
        sourcePath: "CLAUDE.engine.md",
        rel: "CLAUDE.engine.md",
        locale: "en",
        content: EN_V1_TWO_LINES,
      },
      {
        sourcePath: "templates/fr/CLAUDE.engine.md",
        rel: "CLAUDE.engine.md",
        locale: "fr",
        content: "doctrine fr\nv1\n",
      },
    ],
  );
});

test("deliveredSources — called with NO eol map at all, it throws instead of folding verbatim", () => {
  // Demanded by the mutation run, which kept `eolByPath?.[…]` alive: no caller omits
  // the map, so the optional chain was unkillable. It is deleted rather than covered,
  // and the reason is not tidiness — the two failures are not symmetric. A crash
  // stops a release being cut; a silent verbatim fold SHIPS a CRLF table that reads
  // as normal and leaves the fleet frozen. An empty map ({}) is still the legitimate
  // best-effort case, and it is the test above.
  assert.throws(
    () =>
      deliveredSources({
        manifest: MANIFEST,
        sourceFiles: ["CLAUDE.engine.md"],
        read: () => "doctrine\r\nv1\r\n",
      }),
    TypeError,
  );
});

test("deliveredSources — a staged skill is READ at its staging path and RECORDED at its installed one", () => {
  // The asymmetry that makes the whole family work: `sourcePath` is where the release
  // keeps the bytes, `rel` is where the brain holds them. Fold it under the staging
  // path and every row is a key no brain can ever present.
  assert.deepEqual(
    sourcesOf({
      files: { "engine-skills/lint/SKILL.md": "lint\r\nv1\r\n" },
      eolByPath: { "engine-skills/lint/SKILL.md": EOL_LF },
    }),
    [
      {
        sourcePath: "engine-skills/lint/SKILL.md",
        rel: ".claude/skills/lint/SKILL.md",
        locale: "en",
        content: "lint\nv1\n",
      },
    ],
  );
});

test("deliveredSources — a file in another regime is dropped, it is not read at all", () => {
  // The selection is still `selectFingerprintSources`'. A caller that folded every
  // tracked file would put `replace`-regime bytes in a table the heal trusts.
  assert.deepEqual(
    sourcesOf({
      files: { "scripts/lib/demo-locale.mjs": "export const x = 1;\n" },
      eolByPath: { "scripts/lib/demo-locale.mjs": EOL_LF },
    }),
    [],
  );
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
