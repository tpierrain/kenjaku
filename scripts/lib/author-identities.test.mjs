// ─────────────────────────────────────────────────────────────────────────────
// author-identities.test.mjs — the answer to "is that someone else, or you on
// another machine?", as it is stored (plan step 8.3).
//
// TWO obligations, and they pull in opposite directions:
//   • it must TRAVEL — a fused identity is a fact about the world, true on every
//     machine, so answering once has to be answering for both. Hence `.vault-rag/`,
//     beside `universes.json`, committed;
//   • it must never wedge a brain — it is read at session start, so a missing,
//     half-written or hand-edited file costs the fusion and strictly nothing else.
//
// And it must CONVERGE: the same answer given twice, or given on the other Mac
// first, has to land on ONE entry. Two rival entries for one person would be a
// registry that disagrees with itself, which is worse than no registry.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  authorsPath,
  fuseAuthors,
  isAcknowledged,
  markDistinct,
  readAuthorsState,
  writeAuthorsState,
} from "./author-identities.mjs";

const DIR = ".vault-rag";
const PATH = `${DIR}/authors.json`;

const ME = "Thomas Pierrain";
const MY_OTHER_MAC = "tpierrain";
const HER = "Claire Dubois";

// In-memory fs fake, the same surface universes.mjs is given. `writes` records
// every write so a test can claim "this touched NOTHING" — content equality alone
// cannot tell a no-op from a rewrite.
function fakeFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  const writes = [];
  const dirs = [];
  return {
    files,
    writes,
    dirs,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, data) => {
      writes.push({ path: p, data });
      files.set(p, data);
    },
    mkdirSync: (p, opts) => dirs.push({ path: p, opts }),
  };
}

const stateWith = (identities = [], distinct = []) => ({ identities, distinct });

// ── Where it lives ────────────────────────────────────────────────────────────

test("the registry sits beside universes.json, in the state that travels", () => {
  assert.equal(authorsPath(DIR), PATH);
});

test("its path is POSIX whatever the platform joined it with", () => {
  assert.equal(authorsPath("C:\\brain\\.vault-rag"), "C:/brain/.vault-rag/authors.json");
});

// ── Reading: every degradation is "no registry", never a throw ────────────────

test("a brain that has never answered reads back an empty registry", () => {
  assert.deepEqual(readAuthorsState(fakeFs(), DIR), stateWith());
});

test("a registry that was answered reads back exactly what was written", () => {
  const io = fakeFs({
    [PATH]: JSON.stringify({ identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [HER] }),
  });

  assert.deepEqual(readAuthorsState(io, DIR), stateWith([{ name: ME, aka: [MY_OTHER_MAC] }], [HER]));
});

// 🛑 FAIL-OPEN. This file is read at session start: the cost of any damage to it is
// the fusion, and never the session. Each shape below is a different way a human, an
// interrupted write or a merge can leave it.
test("every malformed shape degrades to no registry, and none of them throws", () => {
  const shapes = [
    "",
    "   ",
    "{",
    "null",
    "[]",
    '"a string"',
    "{}",
    '{"identities":"Thomas"}',
    '{"identities":null,"distinct":null}',
    '{"distinct":{"name":"Claire"}}',
  ];

  for (const raw of shapes) {
    assert.deepEqual(readAuthorsState(fakeFs({ [PATH]: raw }), DIR), stateWith(), `on ${JSON.stringify(raw)}`);
  }
});

test("a half-good file keeps its good half: a broken distinct list costs only that list", () => {
  const io = fakeFs({ [PATH]: JSON.stringify({ identities: [{ name: ME, aka: [] }], distinct: "Claire" }) });

  assert.deepEqual(readAuthorsState(io, DIR), stateWith([{ name: ME, aka: [] }]));
});

test("a distinct list that picked up a non-name keeps the names and drops the rest", () => {
  const io = fakeFs({ [PATH]: JSON.stringify({ identities: [], distinct: [HER, 42, null, { name: ME }] }) });

  assert.deepEqual(readAuthorsState(io, DIR), stateWith([], [HER]));
});

test("a file that cannot be read at all is no registry, not an exception", () => {
  const io = fakeFs();
  io.existsSync = () => true;
  io.readFileSync = () => {
    throw new Error("EACCES");
  };

  assert.deepEqual(readAuthorsState(io, DIR), stateWith());
});

// ── Writing ───────────────────────────────────────────────────────────────────

test("writing creates the state directory and round-trips through the reader", () => {
  const io = fakeFs();
  const state = stateWith([{ name: ME, aka: [MY_OTHER_MAC] }], [HER]);

  writeAuthorsState(io, DIR, state);

  assert.deepEqual(io.dirs, [{ path: DIR, opts: { recursive: true } }]);
  assert.deepEqual(io.writes.map((w) => w.path), [PATH]);
  assert.deepEqual(readAuthorsState(io, DIR), state);
});

test("it is written for a human to open: indented, one key per line, newline-terminated", () => {
  const io = fakeFs();

  writeAuthorsState(io, DIR, stateWith([{ name: ME, aka: [MY_OTHER_MAC] }], [HER]));

  const written = io.files.get(PATH);
  assert.ok(written.endsWith("\n"), "no trailing newline");
  assert.match(written, /\n {2}"identities"/);
  assert.match(written, /\n {2}"distinct"/);
});

test("only the two keys it owns are written back, whatever else the file carried", () => {
  const io = fakeFs();

  writeAuthorsState(io, DIR, { identities: [], distinct: [], somethingElse: "kept out" });

  assert.deepEqual(Object.keys(JSON.parse(io.files.get(PATH))), ["identities", "distinct"]);
});

// ── Fusing: "that is me on my other Mac" ──────────────────────────────────────

test("the first answer creates the person, under the spelling they keep", () => {
  const before = stateWith();

  const res = fuseAuthors(before, ME, MY_OTHER_MAC);

  assert.equal(res.ok, true);
  assert.equal(res.changed, true);
  assert.equal(res.canonical, ME);
  assert.deepEqual(res.state, stateWith([{ name: ME, aka: [MY_OTHER_MAC] }]));
  assert.deepEqual(before, stateWith(), "the answer is computed, never applied in place");
});

test("the same answer twice changes nothing, and says so", () => {
  const once = fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state;

  const twice = fuseAuthors(once, ME, MY_OTHER_MAC);

  assert.equal(twice.ok, true, "a repeated answer is not a refusal");
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.state, once);
});

// 🛑 CONVERGENCE. The other machine asks the same question with the names the other
// way round. Answered there, it must reach the SAME entry: two entries for one person
// is a registry that disagrees with itself.
test("answered from the other machine, it merges into the entry that already exists", () => {
  const first = fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state;

  const res = fuseAuthors(first, MY_OTHER_MAC, ME);

  assert.deepEqual(res.state, first, "no second entry, and the kept spelling stays the kept one");
  assert.equal(res.canonical, ME, "the answer names the spelling the brain already files under");
});

// A third machine, and the question is answered against whichever spelling that
// machine happens to see. It must reach the same person, and the entry must keep
// naming them the way this brain already files them.
test("a third spelling joins the person it belongs to instead of opening a new one", () => {
  const first = fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state;

  const res = fuseAuthors(first, MY_OTHER_MAC, "tp");

  assert.equal(res.ok, true);
  assert.equal(res.changed, true, "the registry really did grow — a caller that skipped the write would lose it");
  assert.deepEqual(res.state.identities, [{ name: ME, aka: [MY_OTHER_MAC, "tp"] }]);
  assert.equal(res.canonical, ME);
});

// The map that rebuilds the list must touch ONE entry. Rebuilding them all with the
// merged one is invisible on a registry of one person, and catastrophic on two.
test("merging into one person leaves everybody else exactly as they were", () => {
  const both = fuseAuthors(fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state, HER, "claire").state;

  const res = fuseAuthors(both, ME, "tp");

  assert.deepEqual(res.state.identities, [
    { name: ME, aka: [MY_OTHER_MAC, "tp"] },
    { name: HER, aka: ["claire"] },
  ]);
});

// `thomas.pierrain` and `Thomas Pierrain` are ALREADY one name here — the slug is
// what this brain compares, and a dot is punctuation. Nothing to record.
test("a spelling that already slugs to a known one adds no alias", () => {
  const first = fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state;

  const res = fuseAuthors(first, MY_OTHER_MAC, "thomas.pierrain");

  assert.equal(res.changed, false);
  assert.deepEqual(res.state, first);
});

test("two different people each get their own entry", () => {
  const mine = fuseAuthors(stateWith(), ME, MY_OTHER_MAC).state;

  const both = fuseAuthors(mine, HER, "claire").state;

  assert.deepEqual(both.identities, [
    { name: ME, aka: [MY_OTHER_MAC] },
    { name: HER, aka: ["claire"] },
  ]);
});

test("a spelling that only differs in case or spacing is already the same person", () => {
  const res = fuseAuthors(stateWith(), ME, "  thomas   pierrain ");

  assert.equal(res.ok, true);
  assert.deepEqual(res.state.identities, [{ name: ME, aka: [] }], "an alias equal to the name is not an alias");
});

// 🛑 A name with no slug cannot be spelled into a filename, so fusing INTO it would
// replace a usable name with an unusable one — worse than not fusing at all.
test("a name this brain could not file under is refused, and nothing is written", () => {
  for (const [canonical, alias] of [
    ["✨", MY_OTHER_MAC],
    [ME, "✨"],
    ["", MY_OTHER_MAC],
    [ME, "   "],
    [null, MY_OTHER_MAC],
    [ME, 42],
  ]) {
    const res = fuseAuthors(stateWith(), canonical, alias);
    assert.equal(res.ok, false, `${JSON.stringify(canonical)} + ${JSON.stringify(alias)} should be refused`);
    assert.equal(res.reason, "unusable");
    assert.deepEqual(res.state, stateWith());
    assert.equal(res.changed, false);
  }
});

test("a registry damaged by hand does not stop the next honest answer", () => {
  const res = fuseAuthors(stateWith([{ name: 42 }, "nonsense", null, { aka: ["orphan"] }]), ME, MY_OTHER_MAC);

  assert.equal(res.ok, true);
  assert.deepEqual(res.state.identities.at(-1), { name: ME, aka: [MY_OTHER_MAC] });
});

// A hand-edited `aka` that is a string, not a list. It must not be spread into the
// merged entry, or the person ends up answering to the letters of their own alias.
test("an entry whose alias list is not a list is repaired as it is merged into", () => {
  const res = fuseAuthors(stateWith([{ name: ME, aka: MY_OTHER_MAC }]), ME, "tp");

  assert.deepEqual(res.state.identities, [{ name: ME, aka: ["tp"] }]);
});

// 🛑 Found by an ALIAS, on an entry whose canonical name is nonsense. The kept name
// must fall back to the one the caller just used — keeping `42` would file that
// person under a name no filesystem accepts.
test("an entry with an unusable canonical name is renamed by the answer that finds it", () => {
  const res = fuseAuthors(stateWith([{ name: 42, aka: [MY_OTHER_MAC] }]), ME, MY_OTHER_MAC);

  assert.equal(res.canonical, ME);
  assert.deepEqual(res.state.identities, [{ name: ME, aka: [MY_OTHER_MAC, ME] }]);
});

// ── Refusing: "no, that is my colleague" ──────────────────────────────────────

test("a confirmed second person is recorded in their own spelling, once", () => {
  const first = markDistinct(stateWith(), HER);

  assert.equal(first.ok, true);
  assert.equal(first.changed, true);
  assert.deepEqual(first.state, stateWith([], [HER]));

  const again = markDistinct(first.state, "claire dubois");
  assert.equal(again.changed, false, "the same person confirmed twice is still one line");
  assert.deepEqual(again.state, first.state);
});

// A wrong answer must be correctable: the human who fused two colleagues by mistake
// says so, and the brain stops filing their days into one note.
test("confirming a person UNDOES a fusion that had swallowed them", () => {
  const fused = fuseAuthors(stateWith(), ME, HER).state;

  const res = markDistinct(fused, HER);

  assert.equal(res.changed, true);
  assert.deepEqual(res.state, stateWith([{ name: ME, aka: [] }], [HER]));
});

test("confirming a person leaves the identity they are the canonical name of alone", () => {
  const fused = fuseAuthors(stateWith(), HER, "claire").state;

  const res = markDistinct(fused, HER);

  assert.deepEqual(res.state, stateWith([{ name: HER, aka: ["claire"] }], [HER]));
});

test("a name that cannot be filed is refused here too, and nothing is written", () => {
  for (const name of ["✨", "", "  ", null, 42]) {
    const res = markDistinct(stateWith([], [HER]), name);
    assert.equal(res.ok, false, `${JSON.stringify(name)} should be refused`);
    assert.equal(res.reason, "unusable");
    assert.equal(res.changed, false, "a refusal that claims to have changed something invites a pointless commit");
    assert.deepEqual(res.state, stateWith([], [HER]));
  }
});

test("a second person joins a list that already names somebody else", () => {
  const res = markDistinct(stateWith([], [HER]), "Amina Haddad");

  assert.equal(res.changed, true);
  assert.deepEqual(res.state.distinct, [HER, "Amina Haddad"]);
});

// 🛑 THE CORRECTION THAT MUST STILL BITE. They are already on the confirmed list AND
// still swallowed by a fusion — the shape a mis-answer then re-answered leaves behind.
// "Already confirmed" must not be read as "nothing to do": the fusion is what files
// their notes into somebody else's day.
test("a person already confirmed is still freed from a fusion that holds them", () => {
  const tangled = { identities: [{ name: ME, aka: [HER] }], distinct: [HER] };

  const res = markDistinct(tangled, HER);

  assert.equal(res.changed, true);
  assert.deepEqual(res.state, { identities: [{ name: ME, aka: [] }], distinct: [HER] });
});

test("and with nothing left to free, confirming them again is a no-op that says so", () => {
  const settled = { identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [HER] };

  const res = markDistinct(settled, HER);

  assert.equal(res.ok, true, "an answer already given is not a refusal");
  assert.equal(res.changed, false);
  assert.deepEqual(res.state, settled);
});

// ── The question this registry silences ───────────────────────────────────────

test("a confirmed person is acknowledged, whatever spelling the question found them under", () => {
  const state = markDistinct(stateWith(), HER).state;

  assert.equal(isAcknowledged(state, HER), true);
  assert.equal(isAcknowledged(state, "  CLAIRE   dubois "), true);
  assert.equal(isAcknowledged(state, ME), false);
});

test("nobody is acknowledged by a registry nobody has answered for", () => {
  assert.equal(isAcknowledged(stateWith(), HER), false);
  assert.equal(isAcknowledged(stateWith([], [HER]), "✨"), false);
});

// 🛑 A name with no slug is NOBODY, and two nobodies are not each other. Answer this
// one wrong and a stranger this brain cannot even spell reads as already-confirmed,
// which silences the question that exists to catch exactly that.
test("a nameless name matches nothing, not even another nameless one", () => {
  assert.equal(isAcknowledged(stateWith([], ["✨"]), "🌟"), false);
  assert.equal(isAcknowledged(stateWith([], ["✨"]), "✨"), false);
});
