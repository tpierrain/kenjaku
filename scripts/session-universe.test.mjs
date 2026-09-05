import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionUniverseReminder, readActiveProfileSynthesis } from "./session-universe.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// sessionUniverseReminder is the ADR-0034 SessionStart core: it reads the universe
// state (injected), and emits the chat reminder naming the active universe ONLY
// past the progressive-disclosure gate (>= 2 universes). Fail-open: never throws.

function seams(overrides = {}) {
  const calls = { emitted: [], healed: [], synthesised: [] };
  const base = {
    dir: "/brain/.vault-rag",
    readState: () => ({ registry: ["acme"], active: "acme" }),
    healPointer: (dir) => (calls.healed.push(dir), { healed: false, from: "acme", active: "acme" }),
    readSynthesis: (dir) => (calls.synthesised.push(dir), null),
    readDeclined: () => false,
    emit: (msg) => calls.emitted.push(msg),
  };
  return { args: { ...base, ...overrides }, calls };
}

test("sessionUniverseReminder — single-universe brain (empty registry) → quiet", () => {
  const { args, calls } = seams({ readState: () => ({ registry: [], active: "default" }) });
  sessionUniverseReminder(args);
  assert.deepEqual(calls.emitted, []);
});

test("sessionUniverseReminder — two universes → emits the active-universe reminder", () => {
  const { args, calls } = seams();
  sessionUniverseReminder(args);
  assert.equal(calls.emitted.length, 1);
  assert.match(calls.emitted[0], /Active universe: 'acme'/);
});

test("sessionUniverseReminder — reads FROM the given state dir", () => {
  const seen = [];
  const { args } = seams({ readState: (dir) => (seen.push(dir), { registry: [], active: "default" }) });
  sessionUniverseReminder(args);
  assert.deepEqual(seen, ["/brain/.vault-rag"]);
});

test("sessionUniverseReminder — fail-open: a throwing readState never propagates, emits nothing", () => {
  const { args, calls } = seams({
    readState: () => {
      throw new Error("state unreadable");
    },
  });
  sessionUniverseReminder(args); // must NOT throw
  assert.deepEqual(calls.emitted, []);
});

// --- self-heal of an orphan pointer (universes v2, Step 0) -------------------
// The pointer is per-machine and gitignored, the registry is committed: pulling a
// rename/delete made elsewhere leaves this machine aimed at a universe that is
// gone. The session repairs it and SAYS SO — a scope that silently changed under
// the owner is worse than the orphan it replaces.

test("sessionUniverseReminder — a repaired orphan pointer is announced, naming the universe that vanished", () => {
  const { args, calls } = seams({
    healPointer: () => ({ healed: true, from: "acme", active: "default" }),
    readState: () => ({ registry: ["blue"], active: "default" }),
  });

  sessionUniverseReminder(args);

  const notice = calls.emitted.find((m) => /acme/.test(m));
  assert.ok(notice, `expected a notice naming the vanished universe, got ${JSON.stringify(calls.emitted)}`);
  assert.match(notice, /no longer exists/i);
  assert.match(notice, /default/);
});

test("sessionUniverseReminder — the repair is announced even below the progressive-disclosure gate", () => {
  // The last universe was deleted: the registry is empty, so the routine reminder
  // stays silent (single-universe brain). The repair must NOT inherit that silence
  // — this owner was searching 'acme' a moment ago.
  const { args, calls } = seams({
    healPointer: () => ({ healed: true, from: "acme", active: "default" }),
    readState: () => ({ registry: [], active: "default" }),
  });

  sessionUniverseReminder(args);

  assert.equal(calls.emitted.length, 1);
  assert.match(calls.emitted[0], /'acme'.*no longer exists/i);
});

test("sessionUniverseReminder — a healthy pointer adds no repair line (only the routine reminder)", () => {
  const { args, calls } = seams();

  sessionUniverseReminder(args);

  assert.deepEqual(calls.emitted, ["Active universe: 'acme' (of 2: default, acme)."]);
  assert.deepEqual(calls.healed, ["/brain/.vault-rag"]); // healed against the state dir it was given
});

// --- the profile synthesis (universes v2, Step 3) -------------------------------

test("sessionUniverseReminder returns the active universe's profile synthesis for injection", () => {
  const { args, calls } = seams({
    readSynthesis: (dir) => (calls.synthesised.push(dir), "Acme Corp (employer)."),
  });

  const res = sessionUniverseReminder(args);

  assert.equal(res.synthesis, "Acme Corp (employer).");
  assert.deepEqual(calls.synthesised, ["/brain/.vault-rag"]);
});

test("sessionUniverseReminder injects NOTHING below the gate, profile or not (F1 — reversal)", () => {
  // This REVERSES the previous contract ("return the synthesis even below the gate"),
  // deliberately, on the owner's call (2026-08-03). What rides a session start is
  // echoed verbatim by the CLI, so with a single universe there is nothing to
  // disambiguate and the profile earns no session space at all. Stated cost: on a
  // lone-universe brain the agent now learns of the profile only through the vault
  // itself (the note is indexed, `type: universe`).
  const { args } = seams({
    readState: () => ({ registry: [], active: "default" }),
    readSynthesis: () => "My world (personal).",
  });

  const res = sessionUniverseReminder(args);

  assert.equal(res.synthesis, null);
  assert.equal(res.reported, false); // the universe reminder itself stays silent
});

test("sessionUniverseReminder reports no synthesis when the universe has no profile yet", () => {
  const { args } = seams({ readSynthesis: () => null });

  assert.equal(sessionUniverseReminder(args).synthesis, null);
});

test("sessionUniverseReminder — fail-open: a throwing readSynthesis costs the session nothing", () => {
  const { args, calls } = seams({
    readSynthesis: () => {
      throw new Error("unreadable profile");
    },
  });

  const res = sessionUniverseReminder(args); // must NOT throw

  assert.equal(res.synthesis, null);
  // The routine reminder still made it out: one broken part must not mute the rest.
  assert.deepEqual(calls.emitted, ["Active universe: 'acme' (of 2: default, acme)."]);
});

test("sessionUniverseReminder offers the profile capture when there is none, once", () => {
  const { args } = seams({ readSynthesis: () => null, readDeclined: () => false });

  const res = sessionUniverseReminder(args);

  assert.match(res.offer, /context/i);
});

test("sessionUniverseReminder makes no offer once a profile exists", () => {
  const { args } = seams({ readSynthesis: () => "Acme Corp (employer)." });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

test("sessionUniverseReminder still SEES a profile below the gate, it just stops injecting it", () => {
  // Presence and payload part ways here (F1). Read the profile only when it is
  // going to be injected and a lone-universe owner who already described their
  // context gets offered to describe it again, every session, forever.
  const { args } = seams({
    readState: () => ({ registry: [], active: "default" }),
    readSynthesis: () => "My world (personal).",
  });

  const res = sessionUniverseReminder(args);

  assert.equal(res.offer, null); // it exists — so no offer
  assert.equal(res.synthesis, null); // and it is not injected below the gate
});

test("sessionUniverseReminder makes no offer once the owner declined", () => {
  const { args } = seams({ readSynthesis: () => null, readDeclined: () => true });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

test("sessionUniverseReminder tells the offer which vocabulary this brain is allowed", () => {
  // The registry is what decides, and only the hook has read it. Forget to pass it
  // and every brain gets the below-the-gate wording, including one with 4 universes.
  const alone = seams({ readState: () => ({ registry: [], active: "default" }) });
  const many = seams({ readState: () => ({ registry: ["acme", "blue"], active: "acme" }) });

  assert.match(sessionUniverseReminder(alone.args).offer, /never use the word `universe`/);
  assert.match(sessionUniverseReminder(many.args).offer, /say `universe` plainly/);
});

test("sessionUniverseReminder makes no offer when the profile could not be READ", () => {
  // An unreadable profile is not an absent one. Treating it as absent would turn a
  // broken file into an offer to write the page the owner already has, every session.
  const { args } = seams({
    readSynthesis: () => {
      throw new Error("unreadable profile");
    },
  });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

// --- which RENDERING the session start injects (F1) --------------------------
// The composition root is where the leak would come back: two renderings of the
// same note exist, one of them quotes the body, and picking the wrong one is a
// one-word edit nobody would notice in review. So the choice gets a name and a test.

test("readActiveProfileSynthesis injects the synthesis, never the body-quoting synthesis", () => {
  const raw = [
    "---",
    "type: universe",
    "displayName: Acme Corp",
    "kind: employer",
    "---",
    "",
    "# Acme Corp",
    "",
    "🔒 CONFIDENTIEL, ne jamais sortir du vault: the Bravo acquisition.",
    "",
    "## People",
    "- Zoe (CTO)",
  ].join("\n");
  const io = {
    existsSync: (p) => p === "/brain/vault/acme/universe.md",
    readFileSync: () => raw,
  };

  const out = readActiveProfileSynthesis(io, "/brain/vault", () => "acme");

  assert.equal(
    out,
    [
      "Acme Corp (employer).",
      "Full profile: vault/acme/universe.md — read it when the answer depends " +
      "on the people, tools or scope here.",
      "(for the description itself, they can ask `/switch`)",
    ].join("\n"),
  );
});

test("readActiveProfileSynthesis reports absence as null, so the capture offer can fire", () => {
  const io = { existsSync: () => false, readFileSync: () => "unreachable" };

  assert.equal(readActiveProfileSynthesis(io, "/brain/vault", () => "acme"), null);
});

test("the door the synthesis names EXISTS: /switch can show the description on request", () => {
  // The injected block stops carrying the profile and sends the owner to `/switch`
  // for it. That is only honest while `/switch` can actually show it — otherwise
  // this is F17's defect again, a promise the product prints and does not keep.
  // What the owner types is `/switch` with no argument, so the no-argument path is
  // the one that has to offer it.
  const skill = readFileSync(join(REPO_ROOT, ".claude", "skills", "switch", "SKILL.md"), "utf8");
  const menu = skill.slice(skill.indexOf("### No-argument menu"));
  const nextSection = menu.indexOf("\n### ", 1);

  assert.match(
    nextSection > 0 ? menu.slice(0, nextSection) : menu,
    /description|profile/i,
    "the /switch menu no longer offers the description the session start points at",
  );
  // And the description it shows must come from the profile note, deterministically,
  // not from whatever the agent remembers of a block it read at session start.
  assert.match(skill, /set-universe-profile\.mjs --digest/);
});

test("both constitutions teach the profile page, since a session start no longer carries it", () => {
  // The gate closed the last channel that told a single-universe brain its owner
  // had a context page — and that is the common case. So the rule moves to where
  // it costs no session bytes: the constitution, read once per conversation. It
  // must name the PATH (there is nothing else left to point at) and frame the read
  // as on-demand, or the agent learns of a page it never opens.
  for (const layer of ["CLAUDE.engine.md", "templates/fr/CLAUDE.engine.md"]) {
    const text = readFileSync(join(REPO_ROOT, layer), "utf8");
    assert.match(text, /vault\/universe\.md/, `${layer} does not name the profile page`);
    assert.match(
      text,
      /vault\/<universe>\/universe\.md|vault\/<univers>\/universe\.md/,
      `${layer} does not say where the page is when a universe is active`,
    );
  }
});

// --- the offer must land somewhere that exists ------------------------------

test("the /switch skill still owns the detail the startup offer stopped reciting", () => {
  // F5 shrank the offer to the FACT alone: it no longer names the section, the write
  // command or the decline command, because the agent loads the `switch` skill when
  // the user accepts — or declines. That deletion only holds while the destination
  // exists. Rename the heading or drop the decline command and the offer becomes an
  // invitation with nowhere to land, silently: the accept path writes a note of the
  // wrong shape, and the refusal is never recorded, so a one-shot offer starts nagging.
  const skill = readFileSync(join(REPO_ROOT, ".claude", "skills", "switch", "SKILL.md"), "utf8");
  const headings = skill.split("\n").filter((line) => line.startsWith("#"));

  assert.ok(
    headings.some((line) => line.includes("Describe a universe — its profile")),
    "the switch skill lost the section the startup offer now relies on",
  );
  assert.match(skill, /node scripts\/set-universe-profile\.mjs --decline/);
  // The skill's DESCRIPTION is what routes a decline to it, since the offer no longer
  // spells the command out. Lose the word and a refusal never reaches the recorder.
  assert.match(skill, /declines/);
});

test("settings.json.template wires session-universe as a SessionStart hook, AFTER session-self-heal", () => {
  const settings = JSON.parse(
    readFileSync(join(REPO_ROOT, ".claude", "settings.json.template"), "utf8"),
  );
  const commands = settings.hooks.SessionStart.flatMap((entry) => entry.hooks.map((h) => h.command));
  const universeIdx = commands.findIndex((c) => c.includes("session-universe.mjs"));
  const selfHealIdx = commands.findIndex((c) => c.includes("session-self-heal.mjs"));
  assert.ok(universeIdx >= 0, "session-universe.mjs must be wired on SessionStart");
  assert.ok(selfHealIdx >= 0, "session-self-heal.mjs must stay wired on SessionStart");
  assert.ok(selfHealIdx < universeIdx, "universe reminder must run after self-heal (the restart nudge keeps priority)");
});

// ── A session start never waits on the network (ADR 0028) ────────────────────
// From 2026-08-08 to 2026-09-05 this hook held itself back until the startup pull had
// landed, so it would not announce the universe this machine went to sleep in. The
// owner's call ends that: *"enlève l'attente … ça doit démarrer vite, ça doit répondre
// vite ; si on se trompe parce qu'on n'a pas d'informations fraîches, on se corrige une
// à deux minutes après, mais sans bloquer"*. So the proof INVERTS: with the pull still
// in flight, the hook must answer AT ONCE and announce what is on disk — the correction
// is owed by the next message (`universeArrivalDirective`), not by this one.
//
// A real child process is the only honest proof, and the payload matters as much as the
// marker. Handed over INSTANTLY, the hook has a session id and the old barrier really
// held — twelve seconds of ceiling. Never handed over at all, the barrier opened by
// accident (the stdin race), which is why the same claim is asserted twice: one of the
// two shapes would pass on a hook that still waits.

/** A brain mid-pull: two universes, the pointer on `acme`, a puller wired, the pull RUNNING. */
function brainMidPull(t, label) {
  // realpath: on macOS the temp dir is a symlink, and the hook only runs its main
  // block when argv[1] matches its own resolved module path.
  const brain = realpathSync(mkdtempSync(join(tmpdir(), `kenjaku-universe-${label}-`)));
  t.after(() => rmSync(brain, { recursive: true, force: true }));
  cpSync(join(REPO_ROOT, "scripts"), join(brain, "scripts"), { recursive: true });
  for (const dir of [".vault-rag", ".claude", ".cache"]) mkdirSync(join(brain, dir), { recursive: true });
  writeFileSync(
    join(brain, ".vault-rag", "universes.json"),
    JSON.stringify({ universes: ["acme", "blue-team"] }),
  );
  writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme");
  writeFileSync(
    join(brain, ".claude", "settings.json"),
    JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ command: `node "${brain}/scripts/session-status.mjs"` }] }] },
    }),
  );
  // `running` and never flipped to `done`: the pull this session start must not wait for.
  writeFileSync(
    join(brain, ".cache", "startup-sync.json"),
    JSON.stringify({ sessionId: "s-nowait", phase: "running", at: Date.now() }),
  );
  return brain;
}

/** Runs the hook the way the harness does, and times it. `payload` null → stdin is never written. */
async function runUniverseHook(t, brain, payload) {
  const startedAt = Date.now();
  const child = spawn(process.execPath, [join(brain, "scripts", "session-universe.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (payload !== null) child.stdin.end(payload);
  // Never a wait without a way out (2026-09-05: four spinners with no deadline held a
  // laptop at 100 % for nine hours). The kill turns a hook that DOES wait into a failure
  // here, instead of a suite that hangs until the runner's own timeout.
  const deadline = setTimeout(() => child.kill("SIGKILL"), 8_000);
  t.after(() => {
    clearTimeout(deadline);
    child.kill("SIGKILL");
  });
  let stdout = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  const code = await new Promise((resolve) => child.on("close", resolve));
  return { code, stdout, elapsed: Date.now() - startedAt };
}

// The old barrier's SHORTEST branch was a 3 s grace and its ceiling 12 s, so a hook that
// still waits cannot pass this — while a cold `node` start is well under it.
const PROMPTLY_MS = 2_000;

test("the universe hook does not wait for the pull it is HANDED the key to: it announces what is on disk", async (t) => {
  const brain = brainMidPull(t, "nowait");

  const { code, stdout, elapsed } = await runUniverseHook(
    t,
    brain,
    JSON.stringify({ session_id: "s-nowait", source: "startup" }),
  );

  assert.equal(code, 0, "the hook is fail-open: it always exits 0");
  assert.ok(elapsed < PROMPTLY_MS, `the session start waited ${elapsed} ms on a pull it must not wait for`);
  assert.match(stdout, /Active universe: 'acme'/, "what is on disk is what gets announced");
});

// The same claim through the other door, and the one that would catch a "repair" of the
// stdin race: fd 0 is a pipe nobody ever writes to, which a BLOCKING read waits on for a
// close that may never come (measured 2026-09-05: it took this suite from ~50 s to over
// 10 minutes, and in the field it is a hung session start).
test("…and it does not wait on its own stdin either, when the harness writes nothing", async (t) => {
  const brain = brainMidPull(t, "nostdin");

  const { code, stdout, elapsed } = await runUniverseHook(t, brain, null);

  assert.equal(code, 0);
  assert.ok(elapsed < PROMPTLY_MS, `the session start hung ${elapsed} ms on a stdin nobody wrote`);
  assert.match(stdout, /Active universe: 'acme'/);
});

// The other half of the same call, and it must ship WITH the removal above: without it
// the wait would not be delaying the information, it would be losing it. What repairs a
// stale announcement is `universeArrivalDirective` — pinned in lib/remote-arrivals.test.mjs
// and wired in prompt-restart-nudge.test.mjs, on the owner's very next message.

// ── The ordering defect (2026-08-08), and what its repair COST ───────────────
// SessionStart hooks run in PARALLEL, and the startup pull — which can land a universe
// switch made on the owner's other machine — lives in another hook. This one wins that
// race, so it announces the universe this machine went to sleep in while every search
// of the session scopes to the one that has just arrived. That is a REAL cost, and it
// is now accepted deliberately: the correction rides the next message.
//
// The test that proved the barrier held is DELETED rather than skipped — it asserted a
// behaviour we no longer want, and a skipped test is a claim nobody checks. It was also
// the flake: it failed about 1 run in 8 under load (the harness's payload losing the
// race to a `node` boot), and every mutant re-runs the whole suite, so an intermittent
// failure did not add noise to a mutation score, it added points. Its story, both
// rejected repairs and their measurements, live in
// `maintainers/plans/prospective/duo-v51-safeguards-action.md`.
