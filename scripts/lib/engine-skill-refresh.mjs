// ─────────────────────────────────────────────────────────────────────────────
// engine-skill-refresh.mjs — the PURE decision core of "refresh an engine-shipped
// skill if, and only if, we can PROVE nobody touched it" (plan Increment 2.5).
// The proof already exists on every deployed brain: `engine-manifest.json` records a
// sha256 `provenance` base per `merge` file (installer.mjs / engine-source.mjs), so a
// file whose hash still matches that base is byte-identical to what the engine last
// delivered → safe to overwrite. Anything else is the owner's property.
// No fs, no side effects: the caller reads the bytes and applies the verdict.
// ─────────────────────────────────────────────────────────────────────────────
import { fingerprint } from "./engine-source.mjs";

// Line endings are NOT authorship: a Windows checkout/editor can rewrite LF→CRLF
// without anyone touching a word, and the recorded base was fingerprinted on the LF
// content the engine delivered. Comparing the normalized content too keeps the whole
// Windows fleet eligible for refresh instead of being frozen as "customized".
const normalizeEol = (content) => content.split("\r\n").join("\n");

function matchesBase(installed, base) {
  return fingerprint(installed) === base || fingerprint(normalizeEol(installed)) === base;
}

// The verdict for ONE file, given what the brain has on disk (`installed`, null/undefined
// when absent), the provenance base the engine recorded when it last delivered it
// (`base`), and the content the update would deliver (`candidate`):
//   • absent-install — nothing on disk → deliver it;
//   • preserve (reason: customized | no-provenance) — the owner's copy stands;
//   • unchanged — provably untouched and already up to date → write nothing;
//   • refresh — provably untouched and outdated → overwrite.
export function refreshVerdict({ installed, base, candidate }) {
  if (installed === null || installed === undefined) return { verdict: "absent-install" };
  // No base recorded → "untouched" is UNPROVABLE (not "customized"): keep the owner's
  // copy either way, but the two deserve different prose in the update report.
  if (!base) return { verdict: "preserve", reason: "no-provenance" };
  if (!matchesBase(installed, base)) return { verdict: "preserve", reason: "customized" };
  // Untouched AND already the candidate → write nothing: a converged brain must stay
  // byte-identical, or every update would churn the auto-commit history for a no-op.
  if (normalizeEol(installed) === normalizeEol(candidate)) return { verdict: "unchanged" };
  return { verdict: "refresh" };
}
