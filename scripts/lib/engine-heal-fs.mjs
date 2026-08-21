// ─────────────────────────────────────────────────────────────────────────────
// engine-heal-fs.mjs — THE I/O AROUND THE HEAL (plan S7-3 of
// v5-unfreezes-the-existing-fleet-action.md). `healProvenance` is pure and takes its
// table and the brain's installed bytes as data; this is what goes and gets them.
//
// 🛑 FAIL-SOFT, ALWAYS. A missing or corrupt table means "we recognise nothing
// today" — never a thrown error over an update that is otherwise fine. An engine that
// refuses to update because a DATA file was unreadable is worse than one that never
// shipped the table at all.
//
// 🛑 AND IT ADDS NO WALK OF ITS OWN. The installed bytes come from
// `readInstalledMergeFiles`, which walks the merge globs' ROOTS rather than the brain
// (S4-4c: reading the owner's whole vault cost 18.5 ms for 8 000 notes, paid at every
// session start). This module runs on that same SessionStart path.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { healProvenance } from "./engine-heal.mjs";
import { readInstalledMergeFiles } from "./engine-base-fs.mjs";

// The table ships on the existing `scripts/lib/**` replace glob — no new wiring, and
// the same path in a source tree and in a brain.
export const FINGERPRINTS_REL = "scripts/lib/engine-fingerprints.json";

// The SOURCE's table first: the brain's own copy is whatever its last update
// delivered, while the source's is the one being delivered NOW — a brain healing
// against its own stale table would recognise strictly less than the release it is
// updating to. The brain's copy is the fallback, and it is what a self-heal has.
//
// ⚠️ A corrupt SOURCE table does NOT fall through to the brain's. That is a broken
// release, and quietly healing from an older table would hide it behind a plausible
// result. Both readable-but-broken and absent answer the same thing to the caller —
// `null`, which `healProvenance` survives (pinned at S7-1) — but only absence tries
// the second location.
export function readFingerprintTable({ sourceDir, brainDir }) {
  for (const dir of [sourceDir, brainDir]) {
    let raw;
    try {
      raw = readFileSync(join(dir, FINGERPRINTS_REL), "utf8");
    } catch {
      continue; // absent here — try the next location.
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null; // present and broken — say so, do not shop around.
    }
  }
  return null;
}

// The heal, as the reconciler asks for it: hand it the manifest and what the brain
// records, and it answers with what the brain can PROVE about itself.
export function healFromDisk({ manifest, provenance, sourceDir, brainDir }) {
  return healProvenance({
    manifest,
    provenance,
    installedFileMap: readInstalledMergeFiles({ brainDir, manifest }),
    table: readFingerprintTable({ sourceDir, brainDir }),
  });
}
