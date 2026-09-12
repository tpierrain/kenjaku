import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────────────────────
// #100, part A — a FRESH brain must know, from its very first conversation,
// whether an update is already waiting.
//
// The defect this repairs is quiet and lasts a day. A launcher clone is often
// several releases old by the time someone uses it, so the brain it creates is
// born behind. But the update verdict is written by a DETACHED probe that the
// session start fires and does not wait for (ADR 0028), and it is throttled to
// once a day — so the first conversation of a fresh brain reads "checking for
// updates…", and the offer built on that verdict has nothing to say until the
// next day. An owner's first day with their brain is the one day they are
// certainly paying attention.
//
// The installer is the right place and costs nothing: it already talks to the
// network, already takes minutes, and already ends by telling the owner what to do
// next. `probeUpstream` never throws and returns null when it wrote nothing, so a
// machine offline at install time simply gets the verdict a day later — an install
// may never fail over a version check.
//
// installer.mjs is one big top-level script with no injectable seam, so the
// invariant is pinned at the source level, exactly as installer-health-note does.
// The probe's own behaviour is proven by lib/upstream-cache.test.mjs.
// ─────────────────────────────────────────────────────────────────────────────

const installerSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "installer.mjs"), "utf8");

test("installer imports probeUpstream from the module that owns the verdict", () => {
  assert.match(
    installerSrc,
    /import\s*\{[^}]*\bprobeUpstream\b[^}]*\}\s*from\s*["']\.\/scripts\/lib\/upstream-cache\.mjs["']/,
    "installer.mjs must import probeUpstream from ./scripts/lib/upstream-cache.mjs",
  );
});

test("installer seeds the verdict into the brain it just created, and awaits it", () => {
  assert.match(
    installerSrc,
    /await\s+probeUpstream\(\s*\{[^}]*brainDir:\s*TARGET[^}]*\}\s*\)/s,
    "the verdict must be written into TARGET — the brain — and awaited, or the process may exit first",
  );
});
