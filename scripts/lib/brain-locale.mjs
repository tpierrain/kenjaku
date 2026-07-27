// ─────────────────────────────────────────────────────────────────────────────
// brain-locale.mjs — which locale a GIVEN brain was installed with.
//
// The fact is already on disk, on every brain: `scripts/lib/demo-locale.mjs` exports
// `BRAIN_LOCALE`, and the fr overlay replaces that file with `"fr"`. It is LOCALE-OWNED
// (`engine-copy-select.mjs` F2), so an update never overwrites it → it stays a truthful
// marker for the brain's lifetime. We READ it (rather than importing the engine's own
// module) because the answer must be about the BRAIN we are converging, which is not
// necessarily the tree this code runs from.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_LOCALE = "en";

// PURE: the locale declared by a `demo-locale.mjs` content.
export function parseBrainLocale(content) {
  const m = /BRAIN_LOCALE\s*=\s*"([^"]+)"/.exec(content ?? "");
  return m ? m[1] : DEFAULT_LOCALE;
}

// The locale of the brain at `brainDir`. Unreadable marker → the default locale:
// an update must never fail over it (that brain runs the root content anyway).
export function readBrainLocale(brainDir) {
  try {
    return parseBrainLocale(readFileSync(join(brainDir, "scripts", "lib", "demo-locale.mjs"), "utf8"));
  } catch {
    return DEFAULT_LOCALE;
  }
}
