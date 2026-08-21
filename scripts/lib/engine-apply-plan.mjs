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
// The merge-governed pair, defined by S3's guard and reused here rather than restated
// (see MERGE_GOVERNED_FILES below). That module imports `node:path` and this one's
// header promises no filesystem — the promise holds: `node:path` touches no disk.
import { OWNER_AUTHORED } from "./engine-write-guard.mjs";

// An engine-owned script within the `merge` regime: a top-level scripts/*.mjs. On
// every manifest the product has ever shipped that is exactly four files —
// auto-commit, auto-push, status-line, verify-rag — and `update-engine.mjs` is NOT
// among them (it is `replace`; see the header). A future top-level script declared
// `merge` therefore becomes merge-governed by construction, which is the point.
// The rest of `merge` — CLAUDE.md, .claude/settings.json, .claude/skills/** — is
// the user's: the constitution and the allowlist stay S2c's subject.
const ENGINE_SCRIPT = /^scripts\/[^/]+\.mjs$/;

// The engine's half of the two-layer constitution, within the `merge` regime (plan S5).
// The doctrine layer was in NO regime at all until this release, so a rule written there
// reached fresh installs only. It gets its own family because `merge` is split by SHAPE
// here, and this file is neither a script nor a skill: without this bucket, declaring it
// in the manifest would promise a delivery no code performs.
// ANCHORED AT BOTH ENDS, and that is the load-bearing part: one dot separates it from
// `CLAUDE.md`, which is the OWNER's half and sacred. A looser pattern would carry the
// owner's constitution into a bucket that writes. It also keeps out the merge sidecar
// (`.new`), the locale source (`templates/<locale>/…`, resolved at delivery time, never
// its own manifest entry) and any copy sitting in the vault.
// EXPORTED, unlike its two siblings above, and deliberately: the delivery module
// (`engine-doctrine-refresh.mjs`) selects with THIS one rather than a twin of it. The
// scripts' pair has to warn in a comment that "the two must agree, or a file would be
// delivered twice or not at all"; one owner removes the warning instead of restating it.
export const ENGINE_DOCTRINE = /^CLAUDE\.engine\.md$/;

// An engine-owned SKILL within the `merge` regime: a `.claude/skills/<name>/**`
// entry the manifest declares (coach, local-mirror, …). These are carved OUT of the
// blanket skills scrub into an ADDITIVE install-if-absent bucket (ADR 0025): a
// brand-new engine skill reaches upgraders, while a custom/non-declared skill stays
// untouchable (it is never in the manifest) and an already-present one is preserved.
const ENGINE_SKILL = /^\.claude\/skills\/[^/]+\//;

// ─── The owner's territory, in TWO categories and not one (plan S2c) ─────────
// One word, "sacred", used to file three different reasons, and the flattening had a
// cost: a blanket "the engine never writes there" made *"may the engine ever update
// your constitution?"* read as already answered, when it never had been. ADR 0038
// amends 0012 with the split; what follows is the same invariant, said precisely.

// 🔒 INVIOLABLE — no regime, no door, no merge, ever, whatever a manifest declares.
// `.env` holds the owner's API key; `vault/` is their notes, which is the product's
// entire promise. Neither has a legitimate engine write, so there is nothing to
// qualify. (The vault has no fixed manifest entry either — the tree is denied here as
// belt-and-braces against a buggy or hostile manifest.)
const INVIOLABLE_FILES = [".env"];
// `.claude/skills/` is inviolable HERE and carved out exactly ONE level up: a skill
// the manifest DECLARES reaches `installSkills`, the single bucket this scrub does not
// filter (ADR 0025, additive install-if-absent). So the tree means "no skill is ever
// copied over", and a skill the owner wrote themselves — never in any manifest — is
// unreachable by every bucket there is.
const INVIOLABLE_TREES = [".claude/skills/", "vault/"];

// 🚪 MERGE-GOVERNED — off the copy path for a DIFFERENT reason: not "the engine must
// never touch this", but "the engine may only reach it through a three-way merge from
// a provable base, never by copy and never on a conflict". The owner's answer of
// 2026-08-21, recorded in ADR 0038.
//
// It is the guard's `OWNER_AUTHORED`, imported rather than restated: ONE boundary read
// from two sides — S3 asks *"may the AGENT write this without asking?"*, this module
// asks *"may the ENGINE write it by copy?"*. Two lists that agree today are two lists
// that disagree the day one is edited, so a test pins them by IDENTITY.
//
// ⚠️ This is a statement about the DOOR, not an announcement that it is open. Nothing
// in this release delivers either file: `CLAUDE.md` has no ancestor machine yet (no
// provable base ⇒ no merge), and `.claude/settings.json` is written surgically by the
// reconciler's hook reconcile — the right mechanism for a JSON file whose two sides
// both append to the same arrays, and deliberately not a line diff.
export const MERGE_GOVERNED_FILES = OWNER_AUTHORED;

// What the scrub actually removes from the copy buckets: both categories, because the
// COPY path is closed to both. Only the REASON differs, and the reason is what the two
// constants above now carry instead of a single word doing three jobs.
const SACRED_FILES = [...INVIOLABLE_FILES, ...MERGE_GOVERNED_FILES];
const SACRED_TREES = INVIOLABLE_TREES;

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
// A DELETE IS A TOUCH — `retireSkills` is counted here, and it is the entry that most
// needs to be: this oracle is what every guard test in the repo asks, and it must not
// answer "the engine never writes there" about a path the engine ERASES.
export function planTouches(plan, relPath) {
  return matchesAny(
    [...plan.overwrite, ...plan.regenerate, ...plan.mergeScripts, ...plan.mergeDoctrine, ...plan.retireSkills],
    relPath,
  );
}

export function computeApplyPlan(targetManifest) {
  const regimes = targetManifest?.regimes ?? {};
  const scrub = (entries) => entries.filter((entry) => !isSacred(entry));
  return {
    overwrite: scrub([...(regimes.replace ?? [])]),
    regenerate: scrub([...(regimes.regenerate ?? [])]),
    mergeScripts: scrub((regimes.merge ?? []).filter((entry) => ENGINE_SCRIPT.test(entry))),
    // No `scrub` here, deliberately: the pattern is an exact match on a single filename
    // that is not sacred and never can be, so a scrub could not remove one entry ever.
    // A guard that cannot change a byte is noise (the repeated mutation lesson) — the
    // anchoring IS the guard, and `SACRED_FILES` keeps defending the sibling it protects.
    mergeDoctrine: (regimes.merge ?? []).filter((entry) => ENGINE_DOCTRINE.test(entry)),
    installSkills: (regimes.merge ?? []).filter((entry) => ENGINE_SKILL.test(entry)),
    // ⚰️ THE SUBTRACTIVE BUCKET, and the only list in this product whose entries end in
    // a delete. It reads `retired`, a SIBLING of `regimes` and not a regime: a regime
    // says HOW a shipped file is updated, a tombstone says the engine no longer ships
    // it at all. Declared, never inferred from an absence — a manifest that failed to
    // parse half way would otherwise read as "retire everything".
    // Unscrubbed like `installSkills`, and for the same reason: `.claude/skills/` is an
    // inviolable TREE, so a scrub would empty this every time and the tombstone would
    // be a silent no-op. So `ENGINE_SKILL` is again the ONLY defence — which here means
    // it is what stands between a hand-broken manifest and the owner's vault.
    retireSkills: (targetManifest?.retired ?? []).filter((entry) => ENGINE_SKILL.test(entry)),
  };
}
