// ─────────────────────────────────────────────────────────────────────────────
// engine-apply-plan.mjs — THE SAFETY CORE (plan Step 3). Pure: from the fetched
// target manifest it computes a WRITE-ALLOWLIST (ADR 0003/0012, the governing
// invariant) — the only files `update-engine` may write at Phase 1 Option 1:
//   • overwrite     ← the `replace` regime (rag engine code, package files, AND
//                     `scripts/update-engine.mjs` itself → self-updating)
//   • regenerate    ← the `regenerate` regime (the .sh/.cmd launchers)
//   • mergeScripts  ← the engine-owned `merge` scripts (auto-commit, auto-push,
//                     status-line, verify-rag). ⚠️ NOT a copy bucket since S2b-3:
//                     these go through the three-way merge, so the owner's edits
//                     survive an update. `planTouches` still covers them — the
//                     engine does write them, it just no longer writes them blind.
// Everything else (CLAUDE.md, .claude/settings.json, any .claude/skills/**, the
// vault, .env) is untouchable BY CONSTRUCTION (never in those regimes) — and a
// sacred scrub re-asserts it even if a buggy/hostile manifest mis-declares one.
// No filesystem here: globs are resolved to concrete files later, at apply (Step 4).
//
// 🛑 A WARNING THAT NAMED A DANGER THAT NEVER EXISTED lived here until 2026-08-21:
// "the engine-owned merge scripts, INCLUDING update-engine.mjs itself". It matches
// the regex below, but the regex is applied to `regimes.merge` — and a sweep of ALL
// 48 revisions of `engine-manifest.json` found ZERO that declare it there. It has
// always been `replace`. The claim was true only of this file's own test fixtures,
// and it had been copied from here into a plan, a test title and a fixture note.
// ─────────────────────────────────────────────────────────────────────────────
import { matchesAny } from "./glob-match.mjs";

// An engine-owned script within the `merge` regime: a top-level scripts/*.mjs. On
// every manifest the product has ever shipped that is exactly four files —
// auto-commit, auto-push, status-line, verify-rag — and `update-engine.mjs` is NOT
// among them (it is `replace`; see the header). A future top-level script declared
// `merge` therefore becomes merge-governed by construction, which is the point.
// The rest of `merge` — CLAUDE.md, .claude/settings.json, .claude/skills/** — is
// the user's: the constitution and the allowlist stay S2c's subject.
const ENGINE_SCRIPT = /^scripts\/[^/]+\.mjs$/;

// An engine-owned SKILL within the `merge` regime: a `.claude/skills/<name>/**`
// entry the manifest declares (coach, local-mirror, …). These are carved OUT of the
// blanket skills scrub into an ADDITIVE install-if-absent bucket (ADR 0025): a
// brand-new engine skill reaches upgraders, while a custom/non-declared skill stays
// untouchable (it is never in the manifest) and an already-present one is preserved.
const ENGINE_SKILL = /^\.claude\/skills\/[^/]+\//;

// The user's sovereign territory — NEVER writable by the engine (ADR 0003/0012),
// whatever a manifest declares. Exact files + whole subtrees. The vault has no
// fixed manifest entry, but `vault/` is denied too as belt-and-suspenders.
const SACRED_FILES = ["CLAUDE.md", ".claude/settings.json", ".env"];
const SACRED_TREES = [".claude/skills/", "vault/"];

// The path stem of a (possibly glob) entry, for the sacred check: drop a trailing
// "/**" or "/*" so ".claude/skills/coach/**" is judged under ".claude/skills/".
function stem(entry) {
  return entry.replace(/\/\*\*?$/, "");
}

function isSacred(entry) {
  const s = stem(entry);
  return SACRED_FILES.includes(s) || SACRED_TREES.some((tree) => (s + "/").startsWith(tree));
}

// True iff the plan would write `relPath` — the never-touch oracle the guard tests
// and the apply step (Step 4) use to resolve globs against concrete files. Because
// the plan is an allowlist, this is false for every user file by construction.
export function planTouches(plan, relPath) {
  return matchesAny([...plan.overwrite, ...plan.regenerate, ...plan.mergeScripts], relPath);
}

export function computeApplyPlan(targetManifest) {
  const regimes = targetManifest?.regimes ?? {};
  const scrub = (entries) => entries.filter((entry) => !isSacred(entry));
  return {
    overwrite: scrub([...(regimes.replace ?? [])]),
    regenerate: scrub([...(regimes.regenerate ?? [])]),
    mergeScripts: scrub((regimes.merge ?? []).filter((entry) => ENGINE_SCRIPT.test(entry))),
    installSkills: (regimes.merge ?? []).filter((entry) => ENGINE_SKILL.test(entry)),
  };
}
