import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionUniverseReminder } from "./session-universe.mjs";
import { profileCaptureOffer } from "./lib/universe-reminder.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// sessionUniverseReminder is the ADR-0034 SessionStart core: it reads the universe
// state (injected), and emits the chat reminder naming the active universe ONLY
// past the progressive-disclosure gate (>= 2 universes). Fail-open: never throws.

function seams(overrides = {}) {
  const calls = { emitted: [], healed: [], digested: [] };
  const base = {
    dir: "/brain/.vault-rag",
    readState: () => ({ registry: ["acme"], active: "acme" }),
    healPointer: (dir) => (calls.healed.push(dir), { healed: false, from: "acme", active: "acme" }),
    readDigest: (dir) => (calls.digested.push(dir), null),
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

// --- the profile digest (universes v2, Step 3) -------------------------------

test("sessionUniverseReminder returns the active universe's profile digest for injection", () => {
  const { args, calls } = seams({
    readDigest: (dir) => (calls.digested.push(dir), "Acme Corp (employer)."),
  });

  const res = sessionUniverseReminder(args);

  assert.equal(res.digest, "Acme Corp (employer).");
  assert.deepEqual(calls.digested, ["/brain/.vault-rag"]);
});

test("sessionUniverseReminder returns the digest even below the gate (a lone universe has a profile too)", () => {
  // A single-universe brain is the COMMON case, and D2 has it capturing a profile
  // at first session. Gating the digest on a second universe would make the
  // capture pointless for almost everyone who ever fills one in.
  const { args } = seams({
    readState: () => ({ registry: [], active: "default" }),
    readDigest: () => "My world (personal).",
  });

  const res = sessionUniverseReminder(args);

  assert.equal(res.digest, "My world (personal).");
  assert.equal(res.reported, false); // the universe reminder itself stays silent
});

test("sessionUniverseReminder reports no digest when the universe has no profile yet", () => {
  const { args } = seams({ readDigest: () => null });

  assert.equal(sessionUniverseReminder(args).digest, null);
});

test("sessionUniverseReminder — fail-open: a throwing readDigest costs the session nothing", () => {
  const { args, calls } = seams({
    readDigest: () => {
      throw new Error("unreadable profile");
    },
  });

  const res = sessionUniverseReminder(args); // must NOT throw

  assert.equal(res.digest, null);
  // The routine reminder still made it out: one broken part must not mute the rest.
  assert.deepEqual(calls.emitted, ["Active universe: 'acme' (of 2: default, acme)."]);
});

test("sessionUniverseReminder offers the profile capture when there is none, once", () => {
  const { args } = seams({ readDigest: () => null, readDeclined: () => false });

  const res = sessionUniverseReminder(args);

  assert.match(res.offer, /context/i);
});

test("sessionUniverseReminder makes no offer once a profile exists", () => {
  const { args } = seams({ readDigest: () => "Acme Corp (employer)." });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

test("sessionUniverseReminder makes no offer once the owner declined", () => {
  const { args } = seams({ readDigest: () => null, readDeclined: () => true });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

test("sessionUniverseReminder tells the offer which vocabulary this brain is allowed", () => {
  // The registry is what decides, and only the hook has read it. Forget to pass it
  // and every brain gets the below-the-gate wording, including one with 4 universes.
  const alone = seams({ readState: () => ({ registry: [], active: "default" }) });
  const many = seams({ readState: () => ({ registry: ["acme", "blue"], active: "acme" }) });

  assert.match(sessionUniverseReminder(alone.args).offer, /BELOW the disclosure gate/);
  assert.match(sessionUniverseReminder(many.args).offer, /PAST the disclosure gate/);
});

test("sessionUniverseReminder makes no offer when the profile could not be READ", () => {
  // An unreadable profile is not an absent one. Treating it as absent would turn a
  // broken file into an offer to write the page the owner already has, every session.
  const { args } = seams({
    readDigest: () => {
      throw new Error("unreadable profile");
    },
  });

  assert.equal(sessionUniverseReminder(args).offer, null);
});

// --- the offer must land somewhere that exists ------------------------------

test("the capture offer points at a section the /switch skill actually has", () => {
  // The offer tells the session to follow a NAMED section of a skill. Rename that
  // heading and the directive becomes a dead end that no test would otherwise
  // notice — the offer would still be emitted, and still lead nowhere.
  const skill = readFileSync(join(REPO_ROOT, ".claude", "skills", "switch", "SKILL.md"), "utf8");
  const offer = profileCaptureOffer({ hasProfile: false, declined: false });
  const [, section] = offer.match(/follow its `([^`]+)` section/);
  const [, command] = offer.match(/run `node ([^`]+)`/);

  assert.ok(
    skill.split("\n").some((line) => line.startsWith("#") && line.includes(section)),
    `no heading named "${section}" in the switch skill`,
  );
  // And the decline command must be the real script, spelled the way it is called.
  assert.match(skill, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
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
