import { test } from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseBrainLocale, readBrainLocale } from "./brain-locale.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// brain-locale — which locale a GIVEN brain was installed with, read from its own
// `scripts/lib/demo-locale.mjs` marker (a locale-owned file an update never
// overwrites). Needed by the locale-aware skill refresh (Increment 2.5, trap T2):
// the engine must deliver the FR source to a FR brain, not the root EN one.
// ═══════════════════════════════════════════════════════════════════════════

test("parseBrainLocale — reads the locale the marker declares", () => {
  assert.equal(parseBrainLocale('export const BRAIN_LOCALE = "fr";\n'), "fr");
});

test("parseBrainLocale — no readable marker → the default locale, never a crash", () => {
  // A brain with no marker (or one we could not read) must degrade to the root
  // content, which is what such a brain was installed from anyway. An update is not
  // allowed to fail over a missing marker.
  for (const content of ["// nothing here\n", "", null, undefined]) {
    assert.equal(parseBrainLocale(content), "en");
  }
});

test("readBrainLocale — reads the marker of THAT brain, not of the tree we run from", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "brain-locale-"));
  try {
    mkdirSync(join(brainDir, "scripts", "lib"), { recursive: true });
    writeFileSync(
      join(brainDir, "scripts", "lib", "demo-locale.mjs"),
      '// fr overlay\nexport const BRAIN_LOCALE = "fr";\n',
    );
    assert.equal(readBrainLocale(brainDir), "fr");
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("readBrainLocale — a brain with no marker file at all → the default locale", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "brain-locale-"));
  try {
    assert.equal(readBrainLocale(brainDir), "en");
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});
