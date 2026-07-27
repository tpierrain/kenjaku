import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUniverseName,
  addToRegistry,
  listAllUniverses,
  readRegistry,
  writeRegistry,
  readActiveUniverse,
  writeActiveUniverse,
  switchToUniverse,
  createAndSwitch,
  parseSwitchArgs,
  vaultRagDir,
  runSwitchCli,
  isMultiverse,
  resolveActiveUniverse,
  healActiveUniversePointer,
  readRawActiveUniverse,
  nativeConnectorsReminder,
  planUniverseDeletion,
  planUniverseRename,
  DEFAULT_UNIVERSE,
} from "./universes.mjs";

// In-memory fs fake: a Map<path, contents> behind the fs surface the module uses.
// `writes` records every write (path + data) so a test can claim "this touched
// NOTHING" — content equality alone cannot tell a no-op from a rewrite.
function fakeFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  const writes = [];
  return {
    files,
    writes,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, data) => {
      writes.push({ path: p, data });
      files.set(p, data);
    },
    mkdirSync: () => {},
  };
}

// A universe name becomes a folder (vault/<name>/), a frontmatter value and a SQL
// value, so it must normalize to a safe kebab slug BY CONSTRUCTION (ADR 0034).

test("normalizeUniverseName lowercases and kebab-cases a plain name", () => {
  assert.equal(normalizeUniverseName("Acme Corp"), "acme-corp");
});

test("normalizeUniverseName strips accents and collapses punctuation runs", () => {
  assert.equal(normalizeUniverseName("  Éditeur / Team_A!!  "), "editeur-team-a");
});

test("normalizeUniverseName returns an empty slug when nothing usable remains", () => {
  assert.equal(normalizeUniverseName("///"), "");
  assert.equal(normalizeUniverseName(null), "");
});

// --- registry (created universes; the default is implicit) -------------------

test("addToRegistry appends a new name and keeps the list sorted", () => {
  // Two elements, deliberately out of order + a decoy already present, so a sort
  // mutant and a dedupe mutant both diverge.
  assert.deepEqual(addToRegistry(["blue"], "acme"), ["acme", "blue"]);
});

test("addToRegistry is idempotent (an existing name is not duplicated)", () => {
  assert.deepEqual(addToRegistry(["acme", "blue"], "acme"), ["acme", "blue"]);
});

test("addToRegistry never stores the implicit default universe", () => {
  assert.deepEqual(addToRegistry([], DEFAULT_UNIVERSE), []);
});

test("listAllUniverses puts the default first, then the sorted registry", () => {
  assert.deepEqual(listAllUniverses(["blue", "acme"]), [
    DEFAULT_UNIVERSE,
    "acme",
    "blue",
  ]);
});

// --- registry & active-pointer I/O (under .vault-rag/) ------------------------

test("readRegistry returns an empty list when no registry file exists", () => {
  assert.deepEqual(readRegistry(fakeFs(), "/brain/.vault-rag"), []);
});

test("writeRegistry then readRegistry round-trips the created universes", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme", "blue"]);

  assert.deepEqual(readRegistry(io, "/brain/.vault-rag"), ["acme", "blue"]);
});

test("readActiveUniverse falls back to the default when no pointer exists", () => {
  assert.equal(readActiveUniverse(fakeFs(), "/brain/.vault-rag"), DEFAULT_UNIVERSE);
});

test("writeActiveUniverse then readActiveUniverse round-trips (trimmed)", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]); // the universe must exist to be pointed at
  writeActiveUniverse(io, "/brain/.vault-rag", "acme");

  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), "acme");
});

test("readActiveUniverse survives an fs that returns Buffers (node's raw readFileSync)", () => {
  // node's readFileSync WITHOUT an encoding returns a Buffer, and callers have
  // always been free to pass it (file-back-note.mjs does). A Buffer has no
  // .trim(), so the pointer read used to throw — but only on a brain that HAS a
  // pointer file, i.e. only once a second universe exists. Never in a test, always
  // in the field.
  const io = {
    existsSync: () => true,
    readFileSync: (p) =>
      Buffer.from(p.endsWith("universes.json") ? '{"universes":["acme"]}\n' : "acme\n"),
  };

  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), "acme");
});

test("readActiveUniverse ignores a pointer whose universe is gone from the registry", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["blue"]);
  writeActiveUniverse(io, "/brain/.vault-rag", "acme"); // deleted/renamed elsewhere

  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), DEFAULT_UNIVERSE);
});

// --- self-heal of an orphan pointer ------------------------------------------

test("healActiveUniversePointer repairs an orphan pointer on disk and reports what it healed", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["blue"]);
  writeActiveUniverse(io, "/brain/.vault-rag", "acme"); // deleted/renamed on another machine

  const res = healActiveUniversePointer(io, "/brain/.vault-rag");

  assert.deepEqual(res, { healed: true, from: "acme", active: DEFAULT_UNIVERSE });
  assert.equal(readRawActiveUniverse(io, "/brain/.vault-rag"), DEFAULT_UNIVERSE);
});

test("healActiveUniversePointer leaves a healthy pointer alone and writes NOTHING", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]);
  writeActiveUniverse(io, "/brain/.vault-rag", "acme");
  io.writes.length = 0; // ignore the fixture's own writes

  const res = healActiveUniversePointer(io, "/brain/.vault-rag");

  assert.deepEqual(res, { healed: false, from: "acme", active: "acme" });
  // Every session start runs this: a healthy brain must not rewrite state on disk.
  assert.deepEqual(io.writes, []);
});

test("healActiveUniversePointer creates no pointer file on a brain that never had one", () => {
  const io = fakeFs();

  const res = healActiveUniversePointer(io, "/brain/.vault-rag");

  assert.deepEqual(res, { healed: false, from: DEFAULT_UNIVERSE, active: DEFAULT_UNIVERSE });
  assert.deepEqual(io.writes, []);
});

test("cross-machine: a universe renamed elsewhere heals here instead of searching a ghost", () => {
  // Machine B, working in 'acme'. The registry is COMMITTED, the pointer is
  // per-machine and GITIGNORED — that asymmetry is the whole bug.
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);
  writeActiveUniverse(io, DIR, "acme");

  // git pull: the rename made on machine A lands in the registry alone.
  writeRegistry(io, DIR, ["acme-corp"]);

  // The read side already refuses to hand the ghost to anyone (filing a note,
  // scoping a search), before any repair happens.
  assert.equal(readActiveUniverse(io, DIR), DEFAULT_UNIVERSE);

  // Session start makes the disk agree, exactly once, and reports it.
  assert.deepEqual(healActiveUniversePointer(io, DIR), {
    healed: true,
    from: "acme",
    active: DEFAULT_UNIVERSE,
  });
  assert.deepEqual(runSwitchCli(io, DIR, ["list"]), {
    code: 0,
    message: "* default\n  acme-corp",
  });

  // The NEXT session finds nothing to heal (and says nothing).
  assert.deepEqual(healActiveUniversePointer(io, DIR), {
    healed: false,
    from: DEFAULT_UNIVERSE,
    active: DEFAULT_UNIVERSE,
  });
});

// --- switch (guarded) --------------------------------------------------------

test("switchToUniverse switches to a registered universe and persists the pointer", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]);

  const res = switchToUniverse(io, "/brain/.vault-rag", "Acme");

  assert.deepEqual(res, { ok: true, name: "acme" });
  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), "acme");
});

test("switchToUniverse always allows the default universe (no registry entry needed)", () => {
  const io = fakeFs();

  const res = switchToUniverse(io, "/brain/.vault-rag", DEFAULT_UNIVERSE);

  assert.deepEqual(res, { ok: true, name: DEFAULT_UNIVERSE });
});

test("switchToUniverse refuses an unknown universe and does not touch the pointer", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]);

  const res = switchToUniverse(io, "/brain/.vault-rag", "ghost");

  assert.equal(res.ok, false);
  assert.equal(res.reason, "unknown");
  assert.deepEqual(res.available, [DEFAULT_UNIVERSE, "acme"]);
  // Pointer untouched → still the default.
  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), DEFAULT_UNIVERSE);
});

// --- create-and-switch (git switch -c style) ---------------------------------

test("createAndSwitch registers a new universe and switches to it (the FIRST one opens the gate)", () => {
  const io = fakeFs();

  const res = createAndSwitch(io, "/brain/.vault-rag", "Blue Team");

  // The very first created universe crosses the brain from 1 to 2 universes →
  // openedGate: true is the deterministic 1→2 onboarding signal.
  assert.deepEqual(res, { ok: true, name: "blue-team", created: true, openedGate: true });
  assert.deepEqual(readRegistry(io, "/brain/.vault-rag"), ["blue-team"]);
  assert.equal(readActiveUniverse(io, "/brain/.vault-rag"), "blue-team");
});

test("createAndSwitch of a SECOND universe creates but does NOT re-open the gate", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]); // gate already open

  const res = createAndSwitch(io, "/brain/.vault-rag", "Blue");

  // created:true but openedGate:false — the discriminator that keeps openedGate
  // from collapsing into an alias of `created`.
  assert.deepEqual(res, { ok: true, name: "blue", created: true, openedGate: false });
});

test("createAndSwitch on an existing universe just switches (created: false, no gate crossing)", () => {
  const io = fakeFs();
  writeRegistry(io, "/brain/.vault-rag", ["acme"]);

  const res = createAndSwitch(io, "/brain/.vault-rag", "acme");

  assert.deepEqual(res, { ok: true, name: "acme", created: false, openedGate: false });
  assert.deepEqual(readRegistry(io, "/brain/.vault-rag"), ["acme"]);
});

test("createAndSwitch refuses the reserved default name", () => {
  const io = fakeFs();

  const res = createAndSwitch(io, "/brain/.vault-rag", "Default");

  assert.equal(res.ok, false);
  assert.equal(res.reason, "reserved");
  assert.deepEqual(readRegistry(io, "/brain/.vault-rag"), []);
});

test("createAndSwitch refuses a name that normalizes to empty", () => {
  const io = fakeFs();

  const res = createAndSwitch(io, "/brain/.vault-rag", "///");

  assert.equal(res.ok, false);
  assert.equal(res.reason, "empty");
});

// --- CLI arg parsing ---------------------------------------------------------

test("parseSwitchArgs: a bare name is the switch fast path", () => {
  assert.deepEqual(parseSwitchArgs(["acme"]), { action: "switch", name: "acme" });
});

test("parseSwitchArgs: no args opens the menu", () => {
  assert.deepEqual(parseSwitchArgs([]), { action: "menu" });
});

test("parseSwitchArgs: explicit create / switch / list / current verbs", () => {
  assert.deepEqual(parseSwitchArgs(["create", "Blue", "Team"]), {
    action: "create",
    name: "Blue Team",
  });
  assert.deepEqual(parseSwitchArgs(["switch", "acme"]), {
    action: "switch",
    name: "acme",
  });
  assert.deepEqual(parseSwitchArgs(["list"]), { action: "list" });
  assert.deepEqual(parseSwitchArgs(["current"]), { action: "current" });
});

test("vaultRagDir joins the .vault-rag state dir onto the brain root", () => {
  assert.equal(vaultRagDir("/brain"), "/brain/.vault-rag");
});

// --- CLI dispatch (exit code + message) --------------------------------------

const DIR = "/brain/.vault-rag";

test("runSwitchCli create: registers, switches, exits 0, and gives the one-time 1→2 onboarding", () => {
  const io = fakeFs();

  const res = runSwitchCli(io, DIR, ["create", "Acme"]);

  assert.equal(res.code, 0);
  assert.match(res.message, /created and switched to 'acme'/);
  // The FIRST created universe opens the gate → the CLI surfaces the onboarding
  // line deterministically (the skill relays it; the LLM never counts universes).
  assert.match(res.message, /two universes/i);
  assert.match(res.message, /all universes/i);
  assert.equal(readActiveUniverse(io, DIR), "acme");
});

test("runSwitchCli create of a SECOND universe: no onboarding line (gate already open)", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  const res = runSwitchCli(io, DIR, ["create", "Blue"]);

  assert.equal(res.code, 0);
  assert.match(res.message, /created and switched to 'blue'/);
  assert.doesNotMatch(res.message, /two universes/i);
});

test("runSwitchCli switch to an unknown universe exits 1 and lists the available ones", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  const res = runSwitchCli(io, DIR, ["ghost"]);

  assert.equal(res.code, 1);
  assert.match(res.message, /unknown universe 'ghost'/);
  assert.match(res.message, /default, acme/);
  assert.equal(readActiveUniverse(io, DIR), DEFAULT_UNIVERSE);
});

test("runSwitchCli switch between two named universes appends the connectors reminder", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "acme");

  const res = runSwitchCli(io, DIR, ["blue"]);

  assert.equal(res.code, 0);
  assert.match(res.message, /switched to 'blue'/);
  assert.match(res.message, /single-account/i);
  assert.equal(readActiveUniverse(io, DIR), "blue");
});

test("runSwitchCli switch back to the default scope does NOT append the reminder", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);
  writeActiveUniverse(io, DIR, "acme");

  const res = runSwitchCli(io, DIR, ["default"]);

  assert.equal(res.code, 0);
  assert.match(res.message, /switched to 'default'/);
  assert.doesNotMatch(res.message, /single-account/i);
});

test("runSwitchCli current prints the active universe (exit 0)", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);
  writeActiveUniverse(io, DIR, "acme");

  assert.deepEqual(runSwitchCli(io, DIR, ["current"]), { code: 0, message: "acme" });
});

test("runSwitchCli list marks the active universe among all", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);
  writeActiveUniverse(io, DIR, "acme");

  const res = runSwitchCli(io, DIR, ["list"]);

  assert.equal(res.code, 0);
  assert.match(res.message, /\* acme/);
  assert.match(res.message, / {2}default/);
});

// ── resolveActiveUniverse: the pointer can outlive the universe it names ──────
// The pointer is per-machine and gitignored; the registry is committed. So a
// rename/delete on machine A leaves machine B pointing at a universe that no
// longer exists — and an unvalidated pointer silently filters every search down
// to zero hits. An orphan pointer resolves to the default scope instead.

test("resolveActiveUniverse falls back to the default when the pointer names an unknown universe", () => {
  assert.equal(resolveActiveUniverse("acme", ["blue"]), DEFAULT_UNIVERSE);
});

test("resolveActiveUniverse keeps a pointer that IS in the registry", () => {
  // Two entries, deliberately unsorted, and the match is the LAST one: an
  // implementation peeking only at registry[0] diverges here.
  assert.equal(resolveActiveUniverse("acme", ["blue", "acme"]), "acme");
});

test("resolveActiveUniverse keeps the default even though the registry never stores it", () => {
  // The default is implicit: its ABSENCE from the registry is what defines it
  // (addToRegistry refuses to store it). Validating against the raw registry
  // instead of the full list would heal the default away on every brain.
  assert.equal(resolveActiveUniverse(DEFAULT_UNIVERSE, []), DEFAULT_UNIVERSE);
});

// ── isMultiverse: the progressive-disclosure gate (ADR 0034 Step 4) ──────────
test("isMultiverse is false for a single-universe brain (empty registry: only default)", () => {
  assert.equal(isMultiverse([]), false);
});

test("isMultiverse turns true the moment a first universe is created (default + 1 = 2)", () => {
  // On the boundary: exactly two universes → the gate opens (distinguishes >= from >).
  assert.equal(isMultiverse(["acme"]), true);
});

test("isMultiverse stays true past the boundary (three universes)", () => {
  assert.equal(isMultiverse(["acme", "blue"]), true);
});

// ── nativeConnectorsReminder: single-account connectors don't follow a switch ──
test("nativeConnectorsReminder warns when switching between two named universes", () => {
  const msg = nativeConnectorsReminder({ from: "acme", to: "blue" });
  assert.match(msg, /single-account/i);
  // Names the target so the user knows which universe's accounts to line up.
  assert.match(msg, /'blue'/);
});

test("nativeConnectorsReminder stays silent when switching back to the default scope", () => {
  // Default is the cross-cutting scope, tied to no specific employer/client account:
  // the trivial toggle needs no warning.
  assert.equal(nativeConnectorsReminder({ from: "acme", to: DEFAULT_UNIVERSE }), "");
});

test("nativeConnectorsReminder stays silent on a no-op switch (same universe)", () => {
  // Re-selecting the current universe changes no account context.
  assert.equal(nativeConnectorsReminder({ from: "acme", to: "acme" }), "");
});

test("nativeConnectorsReminder warns when leaving the default scope for a named universe", () => {
  // default → named IS an account-context change (entering a specific sphere), so
  // this is NOT the excluded trivial toggle: it warns and names the target.
  const msg = nativeConnectorsReminder({ from: DEFAULT_UNIVERSE, to: "acme" });
  assert.match(msg, /single-account/i);
  assert.match(msg, /'acme'/);
});

// ── planUniverseDeletion: the pure core of `delete-universe.mjs` ──────────────
// Deletion is the one irreversible universe operation, so EVERY refusal is decided
// here, in a pure function that the CLI cannot talk out of (ADR 0009). It never
// touches the fs: it reads the state and returns what the caller must do.

test("planUniverseDeletion refuses a universe that was never created", () => {
  const io = fakeFs({
    ".vault-rag/universes.json": JSON.stringify({ universes: ["acme"] }),
  });
  assert.deepEqual(planUniverseDeletion(io, ".vault-rag", "ghost"), {
    ok: false,
    reason: "unknown",
    name: "ghost",
    available: ["acme"],
  });
});

test("planUniverseDeletion accepts a created universe and prunes it from the registry", () => {
  const io = fakeFs({
    ".vault-rag/universes.json": JSON.stringify({ universes: ["acme", "blue"] }),
  });
  // Two entries, deleting the SECOND one: a one-entry registry could not tell
  // "pruned the named one" from "emptied the registry".
  assert.deepEqual(planUniverseDeletion(io, ".vault-rag", "blue"), {
    ok: true,
    name: "blue",
    registry: ["acme"],
    // Nobody is standing in 'blue' here (no pointer at all) — the twin of the
    // active-universe case below, so "reset it" cannot pass as a constant.
    resetPointer: false,
  });
});

test("planUniverseDeletion refuses the default scope as RESERVED, not as unknown", () => {
  const io = fakeFs({
    ".vault-rag/universes.json": JSON.stringify({ universes: ["acme"] }),
  });
  // The default is never IN the registry, so "unknown" would come out on its own —
  // and would tell the owner their cross-cutting scope does not exist. It is not
  // missing, it is undeletable: the vault root is where every unscoped note lives.
  assert.deepEqual(planUniverseDeletion(io, ".vault-rag", DEFAULT_UNIVERSE), {
    ok: false,
    reason: "reserved",
    name: DEFAULT_UNIVERSE,
  });
});

test("planUniverseDeletion refuses an empty slug rather than reporting an unknown ''", () => {
  const io = fakeFs({
    ".vault-rag/universes.json": JSON.stringify({ universes: ["acme"] }),
  });
  assert.deepEqual(planUniverseDeletion(io, ".vault-rag", "///"), {
    ok: false,
    reason: "empty",
    name: "",
  });
});

test("planUniverseDeletion says the pointer must fall back when the ACTIVE universe goes", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "blue");

  assert.deepEqual(planUniverseDeletion(io, DIR, "blue"), {
    ok: true,
    name: "blue",
    registry: ["acme"],
    resetPointer: true,
  });
});

test("planUniverseDeletion leaves the pointer alone when it stands in ANOTHER universe", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "acme");

  // A pointer that EXISTS and names a live universe: distinct from the
  // no-pointer-at-all case, and the one that tells "it is the active one" apart
  // from "it is any named one".
  assert.deepEqual(planUniverseDeletion(io, DIR, "blue"), {
    ok: true,
    name: "blue",
    registry: ["acme"],
    resetPointer: false,
  });
});

// ── planUniverseRename: the pure core of `rename-universe.mjs` ────────────────
// A full rename (D4): the folder moves, every note under it is re-stamped, the
// registry entry changes name. Same discipline as deletion — the function decides
// and computes, it never touches anything.

test("planUniverseRename refuses a source universe that does not exist", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  assert.deepEqual(planUniverseRename(io, DIR, "ghost", "whatever"), {
    ok: false,
    reason: "unknown",
    name: "ghost",
    available: ["acme"],
  });
});

test("planUniverseRename computes the renamed registry, re-sorted", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);

  // 'acme' → 'zeta' has to move to the END: renaming in place would leave
  // ["zeta", "blue"], which reads sorted only if you never look.
  assert.deepEqual(planUniverseRename(io, DIR, "Acme", "Zeta"), {
    ok: true,
    from: "acme",
    to: "zeta",
    registry: ["blue", "zeta"],
    // Nobody is standing in 'acme' here (no pointer at all): the twin of the
    // follow-the-pointer case below.
    movePointer: false,
  });
});

test("planUniverseRename refuses a target name that is already taken", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);

  // Merging two universes is a different operation with a different meaning
  // (whose notes win, whose profile survives) — not something a rename should
  // perform silently by moving one folder onto another.
  assert.deepEqual(planUniverseRename(io, DIR, "acme", "Blue"), {
    ok: false,
    reason: "exists",
    name: "blue",
  });
});

test("planUniverseRename refuses to rename the default scope", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  // The default scope has no folder of its own (it IS the vault root) and no
  // registry entry: there is nothing to rename, and "unknown" would suggest it
  // had gone missing.
  assert.deepEqual(planUniverseRename(io, DIR, DEFAULT_UNIVERSE, "personal"), {
    ok: false,
    reason: "reserved",
    name: DEFAULT_UNIVERSE,
  });
});

test("planUniverseRename refuses to rename a universe INTO the default scope", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  // The twin of the case above, and the dangerous one: 'default' is never stored
  // in the registry, so without this guard the entry would simply vanish while a
  // folder full of notes stayed on disk under its old name.
  assert.deepEqual(planUniverseRename(io, DIR, "acme", "Default"), {
    ok: false,
    reason: "reserved",
    name: DEFAULT_UNIVERSE,
  });
});

test("planUniverseRename refuses an empty target rather than renaming to nothing", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  assert.deepEqual(planUniverseRename(io, DIR, "acme", "///"), {
    ok: false,
    reason: "empty",
    name: "",
  });
});

test("planUniverseRename carries the pointer along when you rename the universe you are in", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "acme");

  assert.deepEqual(planUniverseRename(io, DIR, "acme", "acme-corp"), {
    ok: true,
    from: "acme",
    to: "acme-corp",
    registry: ["acme-corp", "blue"],
    // Renaming what you are standing in should leave you standing in it, under
    // its new name — not silently drop you back to the cross-cutting scope.
    movePointer: true,
  });
});

test("planUniverseRename refuses an empty SOURCE (the gate it now shares with deletion)", () => {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme"]);

  assert.deepEqual(planUniverseRename(io, DIR, "", "acme-corp"), {
    ok: false,
    reason: "empty",
    name: "",
  });
});
