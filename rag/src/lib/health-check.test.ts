import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHealthCheck, gatherVitals, runHealthCheck, type HealthVitals } from "./health-check.js";

const HEALTHY: HealthVitals = {
  embedderMode: "in-process",
  keyConfigured: true,
  embedderReady: true,
  indexRows: 42,
  canaryHits: 3,
  canaryNotePresent: true,
  outOfStepNotes: [],
};

function checkNamed(result: { checks: { name: string; status: string }[] }, name: string) {
  const entry = result.checks.find((c) => c.name === name);
  assert.ok(entry, `expected a "${name}" check`);
  return entry;
}

function vitals(over: Partial<HealthVitals> = {}): HealthVitals {
  return { ...HEALTHY, ...over };
}

// The three HEALTHY check entries, reused to build exact { status, checks } expectations.
// Reflex #2: asserting the WHOLE object (status + every detail string) — not just the
// per-check .status the older tests pinned — is what kills the ~28 detail/boundary
// mutants that a status-only assertion let survive.
const OK_CANARY = { name: "canary", status: "ok", detail: "canary found (3)" };
const OK_INDEX = { name: "index", status: "ok", detail: "42 rows" };
const OK_EMBEDDER = { name: "embedder", status: "ok", detail: "in-process ready" };
const OK_NOTES = { name: "notes", status: "ok", detail: "every note is in step with the index" };

test("healthy full-depth vitals → exact { status, checks } with every detail", () => {
  assert.deepEqual(buildHealthCheck(vitals()), {
    status: "ok",
    checks: [OK_CANARY, OK_INDEX, OK_EMBEDDER, OK_NOTES],
  });
});

test("canary search ran but found nothing (hits 0) → broken, exact detail (the > 0 boundary)", () => {
  // hits 0 vs the healthy 3 triangulates `canaryHits > 0`: at 0 the verdict flips to
  // broken, separating `> 0` from `>= 0` and the always-true conditional.
  assert.deepEqual(buildHealthCheck(vitals({ canaryHits: 0 })), {
    status: "broken",
    checks: [
      { name: "canary", status: "broken", detail: "canary not found in the vault" },
      OK_INDEX,
      OK_EMBEDDER,
      OK_NOTES,
    ],
  });
});

test("dedicated health-check note missing → canary unknown, detail names the relpath", () => {
  // Pins the HEALTH_CHECK_NOTE_RELPATH constant too (blanking it empties this detail).
  assert.deepEqual(buildHealthCheck(vitals({ canaryNotePresent: false, canaryHits: 0 })), {
    status: "unknown",
    checks: [
      {
        name: "canary",
        status: "unknown",
        detail: "health-check note missing (engine-health/health-check.md)",
      },
      OK_INDEX,
      OK_EMBEDDER,
      OK_NOTES,
    ],
  });
});

test("light probe (canaryHits null = not searched) → canary ok, 'not searched' detail", () => {
  // canaryHits null (not 0) pins `canaryHits === null` against `!== null` / true / false.
  assert.deepEqual(buildHealthCheck(vitals({ canaryHits: null })), {
    status: "ok",
    checks: [
      {
        name: "canary",
        status: "ok",
        detail: "health-check note present (light probe — not searched)",
      },
      OK_INDEX,
      OK_EMBEDDER,
      OK_NOTES,
    ],
  });
});

test("embedder could not run the canary (ready false, hits 0) → canary unknown, exact detail", () => {
  // embedderReady false with a key set makes the embedder check itself "broken", so
  // the aggregate is "broken" (a broken check outranks the unknown canary).
  assert.deepEqual(buildHealthCheck(vitals({ embedderReady: false, canaryHits: 0 })), {
    status: "broken",
    checks: [
      { name: "canary", status: "unknown", detail: "embedder could not run the canary search" },
      OK_INDEX,
      { name: "embedder", status: "broken", detail: "in-process could not run" },
      OK_NOTES,
    ],
  });
});

test("index unreadable (rows -1) → index unknown, 'could not be read' (the < 0 sentinel)", () => {
  assert.deepEqual(buildHealthCheck(vitals({ indexRows: -1 })), {
    status: "unknown",
    checks: [OK_CANARY, { name: "index", status: "unknown", detail: "index could not be read" }, OK_EMBEDDER, OK_NOTES],
  });
});

test("index empty (rows 0) → index broken, 'index empty' (the 0 boundary, not < 0)", () => {
  // rows 0 vs -1 vs 42 triangulates both `< 0` and `> 0` and their <=/>= twins.
  assert.deepEqual(buildHealthCheck(vitals({ indexRows: 0 })), {
    status: "broken",
    checks: [OK_CANARY, { name: "index", status: "broken", detail: "index empty" }, OK_EMBEDDER, OK_NOTES],
  });
});

test("API mode, no key configured → embedder unknown, '<mode> key not configured'", () => {
  // A different mode ("gemini") pins the ${embedderMode} interpolation in the detail.
  assert.deepEqual(
    buildHealthCheck(vitals({ embedderMode: "gemini", keyConfigured: false, embedderReady: false })),
    {
      status: "unknown",
      checks: [
        { name: "canary", status: "unknown", detail: "embedder could not run the canary search" },
        OK_INDEX,
        { name: "embedder", status: "unknown", detail: "gemini key not configured" },
        OK_NOTES,
      ],
    },
  );
});

test("key set but embedder cannot run → embedder broken, '<mode> could not run'", () => {
  assert.deepEqual(
    buildHealthCheck(vitals({ embedderMode: "gemini", keyConfigured: true, embedderReady: false, canaryHits: 0 })),
    {
      status: "broken",
      checks: [
        { name: "canary", status: "unknown", detail: "embedder could not run the canary search" },
        OK_INDEX,
        { name: "embedder", status: "broken", detail: "gemini could not run" },
        OK_NOTES,
      ],
    },
  );
});

test("all vitals healthy → aggregate status ok, every check ok", () => {
  const result = buildHealthCheck(HEALTHY);
  assert.equal(result.status, "ok");
  assert.ok(result.checks.length >= 3);
  assert.ok(result.checks.every((c) => c.status === "ok"));
});

test("embedder ran but canary not found → canary broken, aggregate broken", () => {
  const result = buildHealthCheck({ ...HEALTHY, embedderReady: true, canaryHits: 0 });
  assert.equal(checkNamed(result, "canary").status, "broken");
  assert.equal(result.status, "broken");
});

test("embedder could not run → canary unknown (not broken), embedder broken", () => {
  const result = buildHealthCheck({ ...HEALTHY, embedderReady: false, canaryHits: 0 });
  // We cannot conclude the RAG is broken when the search itself never ran.
  assert.equal(checkNamed(result, "canary").status, "unknown");
  assert.equal(checkNamed(result, "embedder").status, "broken");
});

test("dedicated health-check note absent → canary unknown (not broken), even with embedder ready", () => {
  // A purged/missing engine-health note must NOT be read as a broken RAG: we simply
  // cannot run the canary, so the verdict is "unknown" — never a scary false alarm.
  const result = buildHealthCheck({ ...HEALTHY, canaryNotePresent: false, canaryHits: 0 });
  assert.equal(checkNamed(result, "canary").status, "unknown");
  assert.equal(result.status, "unknown");
});

test("gatherVitals: canaryNoteExists seam wired → canaryNotePresent captured", async () => {
  const present = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async () => 4,
    canaryNoteExists: () => true,
  });
  assert.equal(present.canaryNotePresent, true);

  const absent = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async () => 0,
    canaryNoteExists: () => false,
  });
  assert.equal(absent.canaryNotePresent, false);
});

test("index unreadable (rows < 0) → index unknown, not broken", () => {
  const result = buildHealthCheck({ ...HEALTHY, indexRows: -1 });
  assert.equal(checkNamed(result, "index").status, "unknown");
});

test("index empty (0 rows) → index broken", () => {
  const result = buildHealthCheck({ ...HEALTHY, indexRows: 0 });
  assert.equal(checkNamed(result, "index").status, "broken");
});

test("API mode with no key configured → embedder unknown, not broken", () => {
  const result = buildHealthCheck({
    ...HEALTHY,
    embedderMode: "gemini",
    keyConfigured: false,
    embedderReady: false,
  });
  // A missing API key is the separately-handled state, never a scary "broken".
  assert.equal(checkNamed(result, "embedder").status, "unknown");
});

test("gatherVitals: canary search resolves → embedderReady true, hits captured", async () => {
  const vitals = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async () => 4,
    canaryNoteExists: () => true,
  });
  assert.equal(vitals.embedderReady, true);
  assert.equal(vitals.canaryHits, 4);
  assert.equal(vitals.indexRows, 12);
});

test("gatherVitals: a throwing index read → indexRows -1 (unreadable sentinel)", async () => {
  const vitals = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => {
      throw new Error("db locked");
    },
    searchCanary: async () => 1,
    canaryNoteExists: () => true,
  });
  assert.equal(vitals.indexRows, -1);
});

test("runHealthCheck: composes gather + build → healthy seams give ok", async () => {
  const result = await runHealthCheck({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 7,
    searchCanary: async () => 2,
    canaryNoteExists: () => true,
  });
  assert.equal(result.status, "ok");
});

test("buildHealthCheck light snapshot (canaryHits null = not searched) → canary ok, not a false broken", () => {
  // At light depth the search never runs, so canaryHits is null (not 0). A note present
  // on disk + sound index/embedder must NOT be read as a broken canary just because we
  // did not search — that would be the very false alarm F7-ter exists to avoid.
  const result = buildHealthCheck({
    embedderMode: "in-process",
    keyConfigured: true,
    embedderReady: true,
    indexRows: 42,
    canaryHits: null,
    canaryNotePresent: true,
  });
  assert.equal(checkNamed(result, "canary").status, "ok");
  assert.equal(result.status, "ok");
});

test("gatherVitals light: canaryHits null (unmeasured) + embedderReady from weightsReady seam", async () => {
  const ready = await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 12,
      searchCanary: async () => 4,
      canaryNoteExists: () => true,
      weightsReady: () => true,
    },
    "light",
  );
  assert.equal(ready.canaryHits, null);
  assert.equal(ready.embedderReady, true);

  const noWeights = await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 12,
      searchCanary: async () => 4,
      canaryNoteExists: () => true,
      weightsReady: () => false,
    },
    "light",
  );
  assert.equal(noWeights.embedderReady, false);
});

test("gatherVitals light depth never runs the canary search (zero ONNX, zero embed)", async () => {
  // F7-ter / ADR 0030 §6: the per-session background probe reads file/DB state only.
  // It must NEVER embed or search — that is the full-depth (verify-rag) job.
  let searched = false;
  await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 12,
      searchCanary: async () => {
        searched = true;
        return 4;
      },
      canaryNoteExists: () => true,
      weightsReady: () => true,
    },
    "light",
  );
  assert.equal(searched, false);
});

test("runHealthCheck light depth: composes gather(light)+build, never searches, healthy → ok", async () => {
  let searched = false;
  const result = await runHealthCheck(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 7,
      searchCanary: async () => {
        searched = true;
        return 2;
      },
      canaryNoteExists: () => true,
      weightsReady: () => true,
    },
    "light",
  );
  assert.equal(searched, false);
  assert.equal(result.status, "ok");
});

test("gatherVitals full depth searches with the exact CANARY_TOKEN 'Quibblethorne'", async () => {
  // Pins the CANARY_TOKEN constant: blanking it to "" makes the seam receive "".
  const seen: string[] = [];
  await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async (t) => {
      seen.push(t);
      return 1;
    },
    canaryNoteExists: () => true,
  });
  assert.deepEqual(seen, ["Quibblethorne"]);
});

test("gatherVitals light: weightsReady seam ABSENT → embedderReady false (the : false fallback)", async () => {
  // Reflex #4 (absent twin): the existing tests always PROVIDE weightsReady. Omitting
  // it exercises the `seams.weightsReady ? … : false` else — a `: false` → `: true`
  // mutant only dies when the seam is missing.
  const v = await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 12,
      searchCanary: async () => 4,
      canaryNoteExists: () => true,
    },
    "light",
  );
  assert.equal(v.embedderReady, false);
});

test("gatherVitals light: a throwing weightsReady → embedderReady false (fail-safe catch)", async () => {
  const v = await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 12,
      searchCanary: async () => 4,
      canaryNoteExists: () => true,
      weightsReady: () => {
        throw new Error("weights boom");
      },
    },
    "light",
  );
  assert.equal(v.embedderReady, false);
});

test("gatherVitals: a throwing canaryNoteExists → canaryNotePresent false (fail-safe catch)", async () => {
  const v = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async () => 1,
    canaryNoteExists: () => {
      throw new Error("fs boom");
    },
  });
  assert.equal(v.canaryNotePresent, false);
});

test("gatherVitals: a throwing canary search → embedderReady false, 0 hits", async () => {
  const vitals = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 12,
    searchCanary: async () => {
      throw new Error("embedder boom");
    },
    canaryNoteExists: () => true,
  });
  assert.equal(vitals.embedderReady, false);
  assert.equal(vitals.canaryHits, 0);
});

test("notes the engine cannot bring in step → broken, naming one and counting the rest", () => {
  // The F15 shape: the index is full, the embedder is fine, every counter is green —
  // and a note goes on answering from content it no longer has. Named, not counted.
  assert.deepEqual(
    checkNamed(
      buildHealthCheck(
        vitals({
          outOfStepNotes: [
            { path: "topics/crise.md", reason: "damaged front-matter — it keeps ANSWERING from old content" },
            { path: "topics/empty.md", reason: "indexed but holding no chunk" },
          ],
        })
      ),
      "notes"
    ),
    {
      name: "notes",
      status: "broken",
      detail:
        "2 notes the engine cannot bring in step — e.g. topics/crise.md: damaged front-matter — " +
        "it keeps ANSWERING from old content",
    }
  );
});

// The boundary the two-note test above cannot reach, and mutation testing is what
// pointed at it: with `length === 1` never exercised, both ternaries could be dropped
// and the suite stayed green. The banner would then read "1 notes … — e.g. <the only
// one there is>" to an owner who is already being told something is damaged.
test("exactly ONE note out of step → singular, and no 'e.g.' in front of the only one", () => {
  assert.deepEqual(
    checkNamed(
      buildHealthCheck(
        vitals({
          outOfStepNotes: [
            { path: "topics/crise.md", reason: "damaged front-matter — it keeps ANSWERING from old content" },
          ],
        })
      ),
      "notes"
    ),
    {
      name: "notes",
      status: "broken",
      detail:
        "1 note the engine cannot bring in step — topics/crise.md: damaged front-matter — " +
        "it keeps ANSWERING from old content",
    }
  );
});

test("every note in step → the notes check is ok and says so", () => {
  assert.deepEqual(checkNamed(buildHealthCheck(vitals({ outOfStepNotes: [] })), "notes"), {
    name: "notes",
    status: "ok",
    detail: "every note is in step with the index",
  });
});

test("crosscheck not measured (null) → no notes check at all, and the verdict stays ok", () => {
  // NOT "unknown": `vault-rag` is a MANDATORY module, and gateBlockers blocks the
  // install post-flight / verify-rag on a mandatory unknown. A crosscheck we could not
  // run is a diagnostic we lack, never a reason to fail an install — so the check is
  // simply absent, and the three vitals keep deciding the verdict.
  const result = buildHealthCheck(vitals({ outOfStepNotes: null }));

  assert.deepEqual(result.checks.map((c) => c.name), ["canary", "index", "embedder"]);
  assert.equal(result.status, "ok");
});

test("gatherVitals: the crosscheck seam's findings ride along, at light depth too", async () => {
  const found = [{ path: "topics/crise.md", reason: "damaged front-matter" }];

  const v = await gatherVitals(
    {
      embedderMode: "in-process",
      keyConfigured: true,
      readIndexRows: () => 7,
      searchCanary: async () => 2,
      canaryNoteExists: () => true,
      weightsReady: () => true,
      crosscheck: async () => found,
    },
    "light",
  );

  assert.deepEqual(v.outOfStepNotes, found);
});

test("gatherVitals: a throwing crosscheck leaves the comparison unmade, never a false alarm", async () => {
  const v = await gatherVitals({
    embedderMode: "in-process",
    keyConfigured: true,
    readIndexRows: () => 7,
    searchCanary: async () => 2,
    canaryNoteExists: () => true,
    crosscheck: async () => {
      throw new Error("database is locked");
    },
  });

  assert.equal(v.outOfStepNotes, null);
  assert.equal(buildHealthCheck(v).status, "ok");
});
