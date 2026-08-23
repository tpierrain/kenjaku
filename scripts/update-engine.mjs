// ─────────────────────────────────────────────────────────────────────────────
// update-engine.mjs — THE CORE (plan Step 4). Opt-in, non-destructive re-pull: it
// brings an already-installed brain up to a newer Engine pinned in the launcher,
// WITHOUT ever touching the user's notes, `.env`, constitution, settings or custom
// skills (ADR 0003/0012/0014). The deterministic engine; the conversational UX is
// a thin skill on top (Step 6, ADR 0016).
//
// It wires the Step 1→3 pure libs + four injected SEAMS (so the Gate runs offline):
//   1. fetchSource          → shallow-clone the recorded `source: {repo, ref}` (Step 2)
//   2. computeApplyPlan      → the write-allowlist from the fetched manifest (Step 3)
//   3. copy overwrite + engine-owned scripts (incl. update-engine itself → self-update)
//   4. regenerateLaunchers   → rebuild the .sh/.cmd launchers (ADR 0015; NOT copied —
//                              they are pure, untracked rag-launcher.mjs output)
//   5. runInstall            → `npm install` in the brain's rag/
//   6. runReindex            → reindex IFF the index schema moved (else the index stays)
//   7. record the new engineVersion + the pulled ref in the brain's manifest
//   8. finalizeReconcile     → re-exec the freshly-written reconciler once (ADR 0026)
//   9. commitEngineWrites    → commit what this update wrote, so it never leaves the
//                              brain's repo dirty and blocking the startup pull (ADR 0011)
// Everything outside the plan is untouchable BY CONSTRUCTION (the plan is an
// allowlist) — the Gate asserts byte-identity of the user's sacred files.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { armRestartPending } from "./lib/restart-signal.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";
import { agreeing, countOf, itIsOrTheyAre, itOrThem } from "./lib/plural.mjs";

import {
  fetchSource as defaultFetchSource,
  resolveLatestTag as defaultResolveLatestTag,
  readTargetManifest,
  defaultGit,
} from "./lib/engine-fetch.mjs";
import { checkUpstream, formatUpdateCheck, unknownUpstream } from "./lib/engine-update-check.mjs";
import { reconcileBrain } from "./lib/reconcile-brain.mjs";
import { advanceRegimes, reseedBaseRefs, reseedProvenance, resolveSourceRepo } from "./lib/engine-source.mjs";
import { parseSemverTag, compareSemverTags } from "./lib/semver-tag.mjs";
import { readEngineDivergence, syncBaseTree } from "./lib/engine-base-fs.mjs";
import { DIVERGENCE_CLOSING, DIVERGENCE_LINE } from "./lib/engine-divergence-nudge.mjs";
import {
  defaultRunInstall,
  defaultRunReindex,
  defaultCountVaultNotes,
  defaultRegenerateLaunchers,
} from "./lib/engine-seams.mjs";
import { defaultFinalizeReconcile } from "./lib/auto-finalize.mjs";
import { defaultCommitEngineWrites } from "./lib/engine-commit.mjs";

// Re-export so the engine's own tests keep importing the count seam from here.
export { defaultCountVaultNotes };

// How many capabilities this update DELIVERED that the running conversation cannot
// see yet (Layer B config-freeze): a skill, an MCP server and a hook all load only at
// the next session start. Pure, and shared by the report banner and the CLI's
// restart-flag decision so the two can never drift apart.
export function countNewCapabilities(report) {
  return (
    (report.installedSkills?.length ?? 0) +
    (report.mcpServersAdded?.length ?? 0) +
    (report.hooksAdded?.length ?? 0)
  );
}

// Did this update place anything on disk that only takes effect at the next session
// start? Then the persistent restart flag must be armed (A2 / F-B7d), so the statusLine
// keeps nudging after the report banner has scrolled away.
export function needsRestart(report) {
  return (
    report.copied?.length > 0 ||
    Boolean(report.regenerated) ||
    countNewCapabilities(report) > 0 ||
    report.skillsRefreshed?.length > 0 ||
    // A MERGED skill changed on disk exactly as a refreshed one did: the file the next
    // session loads is not the file this one loaded (plan S2a-3b).
    report.skillsMerged?.length > 0 ||
    // S2b-3: the four engine scripts used to arrive in `copied`, which armed this on
    // their behalf. They now arrive through the merge, so both of their shapes have to
    // say it themselves — an auto-commit hook that changed under the running session
    // is exactly the change a restart nudge exists for.
    report.scriptsRefreshed?.length > 0 ||
    report.scriptsMerged?.length > 0 ||
    // S5c: the purest case this nudge exists for. `CLAUDE.md` @imports the engine
    // layer at CONVERSATION start, so a doctrine that moved under a running session
    // leaves the agent reasoning from rules the file no longer contains — and unlike a
    // skill, nothing will re-read it lazily when it is next used.
    report.doctrineRefreshed?.length > 0 ||
    report.doctrineMerged?.length > 0 ||
    // S6c: the purest case of all. A skill that went AWAY was loaded at session start
    // and the running conversation still believes it has it — and unlike a refreshed
    // file, nothing will re-read it and discover it is gone. Only the REMOVED list
    // counts: a retirement the engine refused changed not one byte on disk.
    report.skillsRetired?.length > 0
  );
}

// F-B2 (ADR 0026) / issue #31: hooks are wired into settings.json by PATH
// (`scripts/session-health.mjs`) but read by the user by bare name. Both anchors are
// deliberate — only a LEADING `scripts/` and a TRAILING `.mjs` go — so a value that is
// not a script path at all ("statusLine") passes through untouched.
export function bareHookName(command) {
  return command.replace(/^scripts\//, "").replace(/\.mjs$/, "");
}

// ── The two families of engine-owned file, and their three shared promises ────
// S2 gave the SKILLS these sentences; S2b-3 gives them to the engine SCRIPTS. The
// promise is one promise (what you edited is still yours, and the update landed
// anyway), so the wording is one wording — parameterised by the NOUN, because a
// skill is a subtree the owner knows by name and a script is a path they open.
// Calling a script a "skill" would send them hunting under .claude/skills for
// something that is not there.
//
// Three asides, three different pieces of news, and every other reason is silence
// by design (`no-provenance` says we can PROVE nothing, so it claims nothing).
// `merge-failed` = the tool could not answer; `merge-unsafe` = it answered, and the
// merged bytes would not have parsed (S2b-2's gate, on files the brain EXECUTES —
// so only a script can ever be told this one). Folding the last two together would
// tell an owner their file is broken when it is the tool that is, and send them
// hunting through a file that is fine.
const PRESERVED_ASIDE = {
  customized: "",
  "merge-failed": " (the merge could not run here)",
  "merge-unsafe": " (merging the two would not have produced a working file)",
};

// 🔇→🔊 S4-3: `no-provenance` used to be the fourth silence, and it was the loudest
// defect in the product. A brain with no record for a file preserved it on every
// update and said nothing, on every update, forever — an owner discovered by hand
// that a skill had been frozen since install, and the file turned out to be the
// engine's own bytes, zero lines of his.
//
// It gets a SENTENCE OF ITS OWN rather than an entry in the map above, because the
// map's sentence opens with "your customized" — the one claim this verdict cannot
// make. That false claim is what sent him diffing a file nobody had edited. What we
// know is that we do not know, and that is what is said.
//
// 🔁 S10-3 — this comment used to end: "No sidecar is named: a `no-provenance` preserve
// writes none, so pointing at a `.new` would be the report inventing a file, on the very
// verdict that exists to admit ignorance." The reasoning was right and its PREMISE died at
// S10-1, which is the same shape of correction `engine-merge-apply.mjs` carries: the
// verdict now writes a sidecar, so silence here is what invents something — a `.new`
// appearing beside a file with nothing anywhere to explain it.
//
// Admitting we cannot tell whose bytes those are and pointing at the version that awaits
// are not in tension: one is a claim about the past, which this verdict may not make, and
// the other an offer about the future, which it may. The clause is `PRESERVED_ASIDE`'s
// wording verbatim — one sentence with two homes is a divergence waiting to happen.
const unprovableLine = (name, singular, newVersionPath) =>
  `   • your "${name}" ${singular} was left exactly as it is — this brain has no record of` +
  ` the version the engine last delivered there, so we cannot tell your edits from ours;` +
  ` the newer engine version sits next to it as ${newVersionPath}`;

// ⚰️ S6c — the retirement's two sentences. Split by REASON and not merged into one,
// for exactly S4-3's reason above: "you had changed it" is a CLAIM, and on the fleet's
// default state (a brain that recorded nothing) it is a false one. A skill blocked by a
// mix of both is reported as edited, naming only the files that really were.
const retiredPreservedLine = ({ name, blockers }) => {
  const edited = blockers.filter((blocker) => blocker.reason === "customized").map((blocker) => blocker.rel);
  if (edited.length === 0) {
    return `   • the "${name}" skill is retired — the engine no longer ships it, but this brain has no record of` +
      ` what it delivered there, so your copy was left exactly as it is`;
  }
  return `   • the "${name}" skill is retired — the engine no longer ships it, and you had changed it` +
    ` (${edited.join(", ")}), so your copy was left exactly as you wrote it`;
};

// ⚠️ The entries are keyed `name`, not `skill`: the same carrier serves the engine
// scripts (S2b) and the constitution (S2c), and in those a field called `skill` would
// simply be false. What stays family-specific is the NOUN, not the data.
//
// The path is read UNCONDITIONALLY: the refreshers emit `customized` only ever WITH a
// `newVersionPath` (the sidecar is written on that same branch), so a "no path"
// fallback here would be a state the producer cannot emit — a dead branch to maintain
// and mutation-test forever, not a safety net.
//
// 🔗 S10-3 makes `no-provenance` read it too, so the same coupling now covers that verdict
// — and it is PINNED, not assumed: `engine-merge-apply.test.mjs` asserts the whole
// `preserved` entry (`{ name, reason, newVersionPath }`) for a brain with no recorded sha.
// If the producer ever stops writing that sidecar, that test goes red before this line
// can print "undefined" at an owner.
// ── The two things this report was still saying like a template (F14, F15) ───
//
// The count is KNOWN at render time: "(s)" is the hedge of a sentence that does not know
// what it is describing, and every sentence here counted. `countOf` / `agreeing` /
// `itOrThem` now live in `lib/plural.mjs`, imported above: S11 found SIX survivors of
// F14 in this one report, three lines under a line F14 had already fixed, which is what
// a rule re-typed in each file always ends up looking like.

// A list a person would write. `join(" and ")` is right at two and wrong at three, where
// it produced `"coach" and "sync" and "improve"` — and three is exactly the update that
// touched the most files, which is when the report is least skimmed. No comma at two:
// a helper that always joins with commas is wrong for the common case.
function andList(items) {
  if (items.length < 3) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function preservedAndMergedLines({ merged, preserved, singular, plural }) {
  const lines = [];
  // The headline, and the one an owner has been owed since the first frozen file:
  // they edited it, the engine moved it, and BOTH landed. Named one by one, and in
  // the singular when there is one — "your skills" for a single one is the tell of a
  // template nobody re-read.
  if (merged.length > 0) {
    const named = andList(merged.map((name) => `"${name}"`));
    lines.push(
      `   • your ${named} ${merged.length > 1 ? plural : singular} kept your edits AND received this update`,
    );
  }
  // ...and the mirror promise: what the owner edited and the engine could not merge is
  // left ALONE, with the path of the new version dropped beside it so the choice to
  // adopt the new bits stays theirs.
  for (const { name, reason, newVersionPath } of preserved) {
    if (reason === "no-provenance") {
      lines.push(unprovableLine(name, singular, newVersionPath));
      continue;
    }
    // 🛑 An `aside === undefined → continue` guard used to stand here, and S4-3 is what
    // made it indefensible. It existed for `no-provenance`, which now has its own
    // sentence above, so nothing the producer can emit reaches it any more — and worse,
    // what it WOULD do to a verdict reason added later is drop the line in silence,
    // which is the exact defect this slice was written to end. A new reason must break
    // a test, not disappear from the report.
    lines.push(
      `   • your customized "${name}" ${singular} was kept exactly as you wrote it${PRESERVED_ASIDE[reason]}` +
        ` — the newer engine version sits next to it as ${newVersionPath}`,
    );
  }
  return lines;
}

// The one case that costs a human anything, so these are the loudest lines in the
// report and — whichever family they came from — the LAST of the block. Everything
// mergeable is already merged in that sidecar: what is left is the region the two
// sides both rewrote. This sentence names no noun, so both families share it whole.
// ── S4-3: WHERE THE BRAIN STANDS, not only what this pass decided ────────────
// Every line above is an EVENT: it names a file this update looked at. A file frozen
// three releases ago and untouched by this update produces no event, which is exactly
// how a freeze stays invisible for months.
//
// So this block is a RECAP, and says so. It deliberately repeats a file named above
// instead of subtracting it: the subtraction would need a join between skill NAMES and
// file paths that nothing records, and the recap carries something the event lines
// cannot — the version each file was last delivered at. Two versions named, no release
// count computed: counting releases would need the release list (a fetch) for a number
// "v4.7.0 → v5.0.0" already conveys.
//
// `since: null` stays "no record". It is never filled in from the ref we just installed:
// the version the brain runs TODAY is not the version the file is behind.
// The clauses themselves live in `engine-divergence-nudge.mjs` since S4-4: the session
// surface says the same thing at rest, and one sentence with two homes is a divergence
// waiting to happen. What stays here is the FRAMING — this one speaks about a pass that
// just ran, which the session surface must never imply.
function divergenceLines(divergence, ref) {
  if (divergence.length === 0) return [];
  const count = divergence.length;
  return [
    `   • where your brain stands now, running ${ref}: ${countOf(count, "engine file")} this update leaves alone`,
    ...divergence.map(({ rel, reason, since }) => `     - ${rel} — ${DIVERGENCE_LINE[reason](since)}`),
    // The calm closing line is load-bearing, not decoration: a held-back file is a
    // legitimate steady state an owner may keep for years, and a list with no verdict
    // under it reads as a list of problems. It says "a file", not "your file": one of
    // these reasons is precisely that we cannot tell whose it is.
    `     ${DIVERGENCE_CLOSING}`,
  ];
}

// 🚨 S5 — "COULD NOT LOOK" IS NOT "NOTHING TO SAY" (second pass of the v5.0.0 review).
//
// F7 made the divergence read above fail-soft, and justified the silence by pointing at
// the session nudge: "a standing surface, so a line omitted once comes back on its own".
// It does not — `session-engine-divergence.mjs` catches the identical failure and returns
// `{reported:false}`. A merge file this process cannot read (a bad umask, a locked file, a
// sync client's placeholder) was therefore omitted by BOTH surfaces, and the list above
// read as complete when it was not.
//
// Its own line, never folded into the list: the two facts are different. One says the
// engine is leaving a file alone — a choice, with a calm closing under it. This one says
// we could not look, which is neither the owner's choice nor an incident, so it names the
// files and says plainly that the update itself finished.
function unreadableLines(unreadable) {
  if (unreadable.length === 0) return [];
  const many = unreadable.length > 1;
  return [
    `   • could not read ${countOf(unreadable.length, "engine file")} to tell you where ` +
      `${many ? "they stand" : "it stands"} (${unreadable.join(", ")}) — the update itself is done; ` +
      "nothing was changed there",
  ];
}

// 🚪 THE DOOR the conflict block used to lack (plan S2d, from the owner's answer of
// 2026-08-21). Until this, a clash ended at "yours is untouched, a merged copy is at
// <path>" — true, and a cul-de-sac: it hands a non-developer a file full of `<<<<<<<`
// markers and stops talking. What follows is the pointer that makes the report honest
// until the assisted walkthrough exists.
//
// Three things it deliberately does NOT do:
//   • It does not promise the guided flow. That is its own chantier, it lives OUTSIDE
//     `update-engine` (this runs in a non-interactive child where no conversation can
//     happen), and it is not built. So the offer is what the brain can do TODAY —
//     read both sides and say what each changed, in words.
//   • It does not alarm. Their version stands and their brain works; the honest
//     register is "nothing is urgent", not a call to action.
//   • It does not repeat. ONCE for the whole block, whatever the families — an offer
//     printed under every clash is the consent fatigue the follow-on chantier's
//     non-negotiables exist to prevent, and the third repeat teaches owners to scroll.
const walkthroughOffer = (count) =>
  `     Nothing is urgent, and nothing changes until you say so: ask me to walk you through` +
  ` ${count === 1 ? "it" : `these ${count}`}, and I'll show you in plain words what each side changed.`;

// 🚪 S10-3 — THE OFFER, and it is the owner's acceptance criterion for v5 in one line:
// a file you personalized becomes a QUESTION with three offers, not a blind spot. S10-1
// put the candidate on disk; this is what says it is there and that the choice is yours.
//
// Three properties it shares with `walkthroughOffer`, for the same reasons:
//   • ONCE for the whole block, whatever the families and however many files. An offer
//     printed under every file is the consent fatigue this chantier exists to end.
//   • It does not alarm. Their brain works and their file stands; the register is
//     "your call", not a call to action.
//   • It promises only what exists TODAY — a conversation with the brain, which is where
//     the three offers are actually carried out (bricks 3-5, brain-side).
//
// What it does NOT do, deliberately: subtract what the owner has already answered. That
// subtraction belongs to the SESSION nudge, which speaks unbidden at every start; this
// surface only ever prints inside an update the owner just launched, and reaching a `rel`
// from here would mean joining names to paths — the very join this module already refused
// once (see the recap block below).
const answerOffer = (count) =>
  `     Your call, and there is no hurry: ask me about ${count === 1 ? "that file" : `those ${count} files`}` +
  ` and I'll offer${count === 1 ? "" : ", for each one,"} to take the new version, keep yours, or combine the two.`;

// Only a preserve with a candidate beside it can be offered anything — and EVERY entry in
// these arrays has one: all five `preserve` outcomes (`no-provenance` since S10-1,
// `customized`, `merge-failed`, `merge-unsafe`) carry a sidecar, which is the same fact
// `preservedAndMergedLines` relies on to read the path unconditionally.
//
// ⚠️ A `.filter(({ newVersionPath }) => newVersionPath !== undefined)` stood here and was
// DELETED: mutation proved it unreachable (two survivors, 2026-08-21), and the comment
// justifying it named the wrong family. A retired skill genuinely has no newer version —
// the engine stopped shipping it — but it travels in `skillsRetirePreserved`, which is
// never passed to this function. It is excluded STRUCTURALLY, not by a filter.
function answerOfferLines(preserved) {
  return preserved.length === 0 ? [] : [answerOffer(preserved.length)];
}

function conflictLines(conflicts) {
  // No clash, no offer: a sentence printed under every clean update means nothing by
  // the third one. The empty case is the boundary that keeps the offer worth reading.
  if (conflicts.length === 0) return [];
  return [
    ...conflicts.map(
      ({ name, newVersionPath }) =>
        `   • ⚠️ "${name}": your version and this update changed the same lines.` +
        ` Yours is untouched; a merged copy marking both is at ${newVersionPath}`,
    ),
    walkthroughOffer(conflicts.length),
  ];
}

// Human summary the brain-side `update-engine` skill shows the user (Step 6, ADR
// 0016). Pure so the wording is unit-tested; the CLI entry only wires the I/O.
// S7-3 — "N engine files recognized from <range>". A RANGE, not a version: each healed
// file carries the tag its own bytes first shipped at, and those differ per file, so a
// single "from vX" would be a tidy sentence that is false about most of the list.
//
// Ordered by `compareSemverTags`, never lexically — `v3.10.0` sorts BEFORE `v3.2.0` as a
// string, and "recognized from v3.10.0 to v3.2.0" is visibly nonsense to the one person
// this line is written for. An unparseable tag is skipped rather than crashed on: the
// heal already happened and is already recorded, and a report cannot be the thing that
// fails an update that worked.
function recognizedLines(healed) {
  if (healed.length === 0) return [];
  const versions = healed
    .map((h) => ({ tag: h.since, parsed: parseSemverTag(h.since) }))
    .filter(({ parsed }) => parsed)
    .sort((a, b) => compareSemverTags(a.parsed, b.parsed))
    .map(({ tag }) => tag);
  const oldest = versions[0];
  const newest = versions[versions.length - 1];
  const range = oldest === undefined ? "an earlier version" : oldest === newest ? oldest : `${oldest} to ${newest}`;
  return [
    `   • ${countOf(healed.length, "engine file")} recognized from ${range} — this brain can now receive updates for ${itOrThem(healed.length)}`,
  ];
}

// S7-5-3 — the lines the ancestor fetch is allowed to print, and only when a fetch was
// ATTEMPTED and came back empty-handed. Three silences are deliberate: a brain that
// needed no ancestor, a brain whose fetch worked, and a self-heal (which never even
// tries, because the shell refuses to spawn git when the source IS the brain).
//
// The wording is doing real work. This owner is not being told about a defect: they are
// in the state they were already in, and the file is preserved exactly as before.
// Silence would make a temporary network problem look like a permanent verdict on their
// file — which is the failure mode this whole chantier exists to end — while the word
// "error" would make a routine offline moment look like damage.
//
// 🚨 T14 — AND THE CAUSE HAS TO BE THE TRUE ONE. There was one line here, and it named a
// network for a list that also held files whose original no published version holds. On
// those, "the next update will try again" is a promise the next update cannot keep, and
// the sentence turned the one channel that reports real network trouble into noise.
// Two causes, two lines, each with its own count — and each honest about the retry.
function ancestorLines({ unreachable, unmatched }) {
  const lines = [];
  if (unreachable.length > 0) {
    lines.push(
      `   • could not reach the update server to recover the original of ${countOf(unreachable.length, "file")} — ${itIsOrTheyAre(unreachable.length)} preserved as usual, and the next update will try again`,
    );
  }
  if (unmatched.length > 0) {
    lines.push(
      `   • could not find the original of ${countOf(unmatched.length, "file")} in any published version — ${itIsOrTheyAre(unmatched.length)} preserved as usual, and there is nothing to retry`,
    );
  }
  return lines;
}

export function formatReport(report) {
  const { ref, engineVersion, copied, regenerated, reindexed, reindexReason, vaultNoteCount, committed, installedSkills = [], skillsRefreshed = [], skillsPreserved = [], skillsMerged = [], conflicts = [], scriptsRefreshed = [], scriptsPreserved = [], scriptsMerged = [], scriptConflicts = [], doctrineRefreshed = [], doctrinePreserved = [], doctrineMerged = [], doctrineConflicts = [], skillsRetired = [], skillsRetirePreserved = [], mcpServersAdded = [], hooksAdded = [], hooksRepaired = [], statusLineRemoved = false, pointerUnignored = false, divergence = [], divergenceUnreadable = [], healed = [], ancestorsUnreachable = [], ancestorsUnmatched = [] } = report;
  // F-B2 (ADR 0026): the engine-owned SessionStart hooks wired into an upgrader's
  // settings.json, by their bare name (scripts/session-health.mjs → session-health).
  const wiredHooks = hooksAdded.map(bareHookName);
  // Issue #31: broken `cmd /c "…\run-node.cmd"` hook/statusLine commands healed in place
  // on a pre-fix Windows brain (by bare name; "statusLine" passes through unchanged).
  const healedHooks = hooksRepaired.map(bareHookName);
  // Honest reindex line: a schema move re-encodes EVERY note; the health-note pairing (ADR
  // 0026 decision B, upgraders) only makes sure the one engine-owned note is present and
  // indexed (incremental — your other notes are untouched) — never claim "the index format
  // changed" in that case.
  const reindexLine = !reindexed
    ? `   • index format unchanged — no reindex needed`
    : reindexReason === "health-note-seed"
      ? `   • ensured the engine health-check note is present and indexed (incremental — your other notes were not re-encoded)`
      : `   • reindexed — the index format changed (your notes were re-encoded, nothing lost)`;
  const lines = [
    // `?? "unknown"`: a manifest with no engineVersion block is broken, but the update
    // it describes is already done and recorded — printing "undefined" (or throwing)
    // would be the report lying about a change that DID happen.
    `✅ Engine updated to ${ref} (rag ${engineVersion?.rag ?? "unknown"}).`,
    // ⚠️ `+ scriptsRefreshed`: the four engine scripts used to arrive in `copied`, and
    // since S2b-3 a fast-forwarded one arrives through the merge instead. Counting only
    // `copied` would show a brain nobody customized four fewer swapped files than the
    // release before, while exactly as many files changed — and this count is the
    // owner's only measure of what the update did.
    `   • ${countOf(copied.length + scriptsRefreshed.length + doctrineRefreshed.length, "engine file")} swapped` + (regenerated ? " + launchers regenerated" : ""),
    reindexLine,
  ];
  // F2: the number the USER cares about — how many notes the brain holds. When a
  // reindex is running, searchability catches up as indexing finishes.
  if (typeof vaultNoteCount === "number") {
    const noun = vaultNoteCount === 1 ? "note" : "notes";
    lines.push(
      `   • your vault holds ${vaultNoteCount} ${noun}` +
        (reindexed ? " — searchable as the reindex finishes" : "")
    );
  }
  // Surface newly-delivered engine skills / MCP servers (ADR 0025) — the whole point
  // of an additive update: an upgrader must SEE they finally have the feature.
  if (installedSkills.length > 0) {
    lines.push(`   • new engine ${agreeing(installedSkills.length, "skill")} installed: ${installedSkills.join(", ")}`);
  }
  if (mcpServersAdded.length > 0) {
    lines.push(`   • new MCP ${agreeing(mcpServersAdded.length, "server")} registered: ${mcpServersAdded.join(", ")}`);
  }
  // Increment 2.5: an engine skill the owner never touched was brought up to date.
  // Distinct from "new engine skill installed" above — the skill was already
  // there, so the news is that it MOVED ON, not that it appeared.
  if (skillsRefreshed.length > 0) {
    lines.push(`   • engine ${agreeing(skillsRefreshed.length, "skill")} brought up to date: ${skillsRefreshed.join(", ")}`);
  }
  // S6c — and the mirror of that news: a skill that is GONE. It sits with the other
  // skill events and before the merged/preserved family lines, because an owner reading
  // top-down should hear what appeared, what moved on and what went, in that order.
  if (skillsRetired.length > 0) {
    const many = skillsRetired.length > 1;
    lines.push(
      `   • engine ${agreeing(skillsRetired.length, "skill")} retired: ${skillsRetired.join(", ")} — no longer shipped, and` +
        ` ${many ? "your copies held" : "your copy held"} none of your own edits, so` +
        ` ${many ? "they were" : "it was"} removed`,
    );
  }
  lines.push(...skillsRetirePreserved.map(retiredPreservedLine));
  // S7-3 — the migration's own event, and it belongs HERE: with what appeared, moved on
  // and went, and BEFORE the preserved/merged family lines, because its whole point is
  // that files which would have been listed as "preserved, we cannot tell" no longer are.
  // Absent on every brain installed from v5.0.0 on, and on every brain already healed —
  // an event that did not happen must not be announced.
  lines.push(...recognizedLines(healed));
  lines.push(...ancestorLines({ unreachable: ancestorsUnreachable, unmatched: ancestorsUnmatched }));
  // The two families' merged + preserved sentences (see the helpers above), then
  // EVERY conflict, last. A fast-forwarded script needs no line of its own: it is
  // already counted as a swapped engine file, which is what it has always been.
  lines.push(
    ...preservedAndMergedLines({
      merged: skillsMerged,
      preserved: skillsPreserved,
      singular: "skill",
      plural: "skills",
    }),
    // S5c folds the constitution's engine half into the SCRIPTS' family rather than
    // giving it a third noun: it is a path the owner opens, exactly like
    // `auto-commit.mjs`. A noun invented for one file would be machinery bought for
    // nothing, and "your CLAUDE.engine.md constitution" reads worse than "file".
    ...preservedAndMergedLines({
      merged: [...scriptsMerged, ...doctrineMerged],
      preserved: [...scriptsPreserved, ...doctrinePreserved],
      singular: "file",
      plural: "files",
    }),
    // …then the one offer for every preserved file that has a newer version waiting, both
    // families together, directly under the lines it is about and before the clashes get
    // their own door. Two offers can appear in one report; they are about different files
    // and different questions, and their openings are deliberately unalike.
    ...answerOfferLines([...skillsPreserved, ...scriptsPreserved, ...doctrinePreserved]),
    // Both families' clashes together, at the end of the block: appending each next to
    // its own family's sentences would bury a skill conflict mid-report.
    ...conflictLines([...conflicts, ...scriptConflicts, ...doctrineConflicts]),
    // …then the standing state, after every event, because it is the summary of them.
    ...divergenceLines(divergence, ref),
    // …and, only when it happened, what that summary could not look at.
    ...unreadableLines(divergenceUnreadable),
  );
  // The engine files this update rewrote are VERSIONED, so we committed them (step 9) —
  // otherwise they sit dirty forever and the next SessionStart `git pull --rebase`
  // refuses to run. The user will see that commit in their history, so we name it; and
  // we say it stayed local, because pushing is opt-in (`secondbrain.autopush`).
  if (committed === "committed") {
    lines.push(`   • the engine files that changed were committed locally (nothing pushed)`);
  }
  // The tree was left dirty deliberately: a merge/rebase was stopped on a conflict, and
  // staging it would have buried the `<<<<<<<` markers (and fake-resolved the rebase).
  // Silence here would hand back a brain that cannot pull, with nothing to explain it.
  if (committed === "conflicted") {
    lines.push(
      `   ⚠️ the engine files were NOT committed: a merge conflict is pending in your brain's`,
      `   repo, and committing would have buried the <<<<<<< markers in it. Resolve that`,
      `   conflict, then commit — your engine is updated on disk either way.`,
    );
  }
  // Asked, and refused: most often no git identity on this machine. The files are
  // staged and the tree is dirty, so the startup pull stays blocked until it lands.
  if (committed === "refused") {
    lines.push(
      `   ⚠️ git refused to commit the engine files (often: no name/email configured yet —`,
      `   git config --global user.email "you@example.com"). They are staged and waiting;`,
      `   commit them once git is happy, or your brain's startup pull stays blocked.`,
    );
  }
  if (wiredHooks.length > 0) {
    lines.push(`   • new runtime ${agreeing(wiredHooks.length, "hook")} wired: ${wiredHooks.join(", ")}`);
  }
  if (healedHooks.length > 0) {
    lines.push(`   • repaired Windows hook ${agreeing(healedHooks.length, "command")} (issue #31 — 'laude' error): ${healedHooks.join(", ")}`);
  }
  // ADR 0036: we stopped occupying the terminal's status line. Said as what the owner
  // GAINS — the next terminal session shows THEIR line again, where ours used to be —
  // because a silent change of something they look at reads as a bug, not as a gift.
  if (statusLineRemoved) {
    lines.push(
      `   • your own status line is back: the brain no longer occupies it (nothing else changed)`,
    );
  }
  // ADR 0034: said as what the owner GAINS, on the one surface where they live it —
  // two computers. The gitignore line this actually removed is our plumbing, and
  // naming it here would explain the mechanism to someone who never asked for one.
  if (pointerUnignored) {
    lines.push(
      `   • the universe you are working in now follows you: switch context on one computer,`,
      `     and your other ones land in it too, the next time they sync`,
    );
  }
  // F1.6 (ADR 0026, point 4): a freshly-installed skill/MCP is on disk but Claude
  // loads skills/MCP/hooks when a conversation STARTS (Layer B config-freeze), so it
  // is NOT yet live in THIS conversation. Say so LOUDLY (silence reads as "ready to
  // use") and point at the lighter sufficient action — a full restart, then RESUMING
  // this same conversation (field-proven, F4). Do NOT muddy it with "start a new
  // conversation": that is the distinct initial-rooting rule (a never-rooted session),
  // not what is needed just to pick up new capabilities.
  const newCapabilities = countNewCapabilities(report);
  if (newCapabilities > 0) {
    const noun = newCapabilities === 1 ? "capability" : "capabilities";
    const them = newCapabilities === 1 ? "it" : "them";
    lines.push(
      `   ⚠️ ACTION NEEDED — ${newCapabilities} new ${noun} ${newCapabilities === 1 ? "is" : "are"}` +
        ` installed on disk but NOT active in THIS conversation.`,
      `   A FULL RESTART of Claude (close it and reopen) is enough: come back to THIS same`,
      `   conversation afterwards and your brain can use ${them}. You do NOT need to start a`,
      `   brand-new chat for this. Until you restart, your brain CAN'T use ${them}.`,
      `   • If still missing after a restart, run /update-engine once more.`,
    );
    // ⚠️ `needsRestart(report)`, not a second hand-written list. This branch used to ask
    // `copied || regenerated || skillsRefreshed` — a near-copy that had already drifted
    // (a MERGED skill armed the persistent nudge and printed no banner), and that S2b-3
    // would have drifted further the moment the four scripts left `copied`. Two questions
    // with the same meaning is one of them going stale; the `if` above already claimed
    // the new-capability case, so what is left here is exactly "changed, nothing new".
  } else if (needsRestart(report)) {
    // F-B7d (ship-blocker A1): even a steady-state swap with NO brand-new capability still
    // needs a restart — the MCP server, hooks and constitution THIS conversation loaded are
    // the OLD ones until Claude is reopened. Stay silent and a "✅ done" reads as "already
    // live", trapping the improvement behind a stale session. So warn LOUDLY — but WITHOUT the
    // new-capability counter / "run once more" fallback (those are reserved for actual new
    // capabilities). The genuine no-op (nothing swapped) skips this entirely → no crying wolf.
    lines.push(
      `   ⚠️ ACTION NEEDED — your engine was updated on disk, but THIS conversation is`,
      `   still running the OLD version. A FULL RESTART of Claude (close it and reopen) is`,
      `   enough: come back to THIS same conversation afterwards and the update takes effect.`,
      `   Until you restart, your brain keeps using the old engine.`,
    );
  }
  lines.push(`   Your notes, .env, constitution, settings and custom skills were left untouched.`);
  return lines.join("\n");
}

export async function updateEngine({
  brainDir,
  platform = process.platform,
  fetchSource = defaultFetchSource,
  resolveLatestTag = defaultResolveLatestTag,
  regenerateLaunchers = defaultRegenerateLaunchers,
  runInstall = defaultRunInstall,
  runReindex = defaultRunReindex,
  countVaultNotes = defaultCountVaultNotes,
  finalizeReconcile = defaultFinalizeReconcile,
  commitEngineWrites = defaultCommitEngineWrites,
  // S7-5-3: forwarded to the reconciler, which spawns the ancestor fetch through it.
  git = defaultGit,
}) {
  const manifestPath = join(brainDir, "engine-manifest.json");
  const local = JSON.parse(readFileSync(manifestPath, "utf8"));
  const source = local.source ?? {};

  // 1. Resolve the LATEST semver release tag on the remote (ADR 0017) — that is the
  //    engine version we pull and the new `source.ref` we record, so the displayed
  //    Version actually advances. No tag / offline → fall back to the pinned ref (the
  //    committed launcher manifest has no `source`, so we never read `target.source`).
  const ref = (await resolveLatestTag({ repo: source.repo })) ?? source.ref;

  //    Fetch the launcher at that ref + read its (target) manifest.
  const sourceDir = await fetchSource({ repo: source.repo, ref });
  const target = readTargetManifest(sourceDir);

  // 2.→6. CONVERGE the brain's on-disk engine state to the target manifest (ADR 0026):
  //    compute the write-allowlist, copy the engine files (F1/F2 refinements), install
  //    -if-absent the engine-declared skills, reconcile .mcp.json against
  //    engineMcpServers, add-if-absent the engine-owned hook entries into settings.json,
  //    regenerate the launchers, run install, reindex IFF the schema moved, and count the
  //    vault notes — all behind the deterministic, idempotent
  //    `reconcileBrain`. Extracted so the SAME reconciler runs at auto-finalize (a fresh
  //    child process at the end of this function) and at SessionStart self-heal.
  const {
    copied,
    regenerated,
    reindexed,
    reindexReason,
    vaultNoteCount,
    installedSkills,
    installedFileMap,
    // S6c: the subtractive door's two lists. Same reason as the comment below — a
    // field this destructure does not name is a verdict the owner never hears, and a
    // skill that vanished with no sentence beside it is the worst shape of that.
    skillsRetired,
    skillsRetirePreserved,
    skillsRefreshed,
    skillsPreserved,
    skillsMerged,
    conflicts,
    // S2b-3: the engine scripts' own four lists. A field this destructure does not name
    // is a verdict the owner never hears — and a preserved auto-commit with no sentence
    // beside it is a `.new` file appearing next to a hook with no explanation.
    scriptsRefreshed,
    scriptsPreserved,
    scriptsMerged,
    scriptConflicts,
    // S5c: and the constitution's engine half, same argument. A brain that finally
    // receives twelve commits of frozen doctrine, and is told nothing, has been told
    // this update did nothing.
    doctrineRefreshed,
    doctrinePreserved,
    doctrineMerged,
    doctrineConflicts,
    // S7-3: what the brain PROVED about itself. A field this destructure does not name
    // is a verdict the owner never hears — and this one is the migration itself: a brain
    // frozen since install day silently becoming a brain that receives.
    healed,
    // S7-5-3: same argument as `healed` one line up — a field this destructure does not
    // name is a verdict the owner never hears, and this one is the OTHER half of the
    // fleet: the files the owner edited before v5, which stop being frozen.
    ancestorsHydrated,
    ancestorsUnreachable,
    ancestorsUnmatched,
    refreshedFileMap,
    // F1: what the reconcile rewrote IN PLACE in the brain's own settings.json. It has to
    // reach step 7's record, and the auto-finalize child cannot cover for it — by the time
    // the child runs, the hook entries are already there, so its own reconcile adds nothing
    // and rewrites nothing. Miss it here and the record is never moved at all.
    reconciledFileMap,
    mcpServersAdded,
    hooksAdded,
    hooksRepaired,
    statusLineRemoved,
    pointerUnignored,
  } = await reconcileBrain({
      brainDir,
      platform,
      sourceDir,
      target,
      local,
      regenerateLaunchers,
      runInstall,
      runReindex,
      countVaultNotes,
      git,
    });

  // 7. Record the new engine version + the ref we pulled, and RE-SEED `provenance`
  //    (Step 5): refresh the 3-way base for the merge files the engine just
  //    re-delivered, while the user's untouched merge files (CLAUDE.md/settings/skills)
  //    keep their prior base — so a future Phase 2 3-way still detects the user's edits.
  //    T1 (Increment 2.5): the skills the reconcile just REFRESHED are re-delivered
  //    content too, so they must be re-seeded here. Miss them and this manifest write
  //    (built from the `local` copy read before the reconcile) leaves their base at the
  //    OLD content → the next update calls them "user-modified" and never refreshes
  //    them again: the feature would work exactly once per brain, silently.
  //    Same for the skills the reconcile just INSTALLED (install-if-absent): they are
  //    engine-delivered content with no base yet, and a skill without a base is never
  //    refreshable again.
  //
  // 🛑 S2b-4 — what used to head this map, and why it is gone: every **copied** file's
  //    bytes were read back off the disk into it. Both consumers — `reseedProvenance`
  //    and `syncBaseTree` — run their candidates through the `merge` regime, so a
  //    `replace`-copied file reached NEITHER; the whole pass was read and discarded. It
  //    had a real job until S2b-3, when the four engine scripts were in `copied` and
  //    this is how their base advanced. They now arrive through `refreshedFileMap`, and
  //    `runReconcileCli` — the LAST writer on the update path — never read `copied` back
  //    in the first place. A line that survives an invalid encoding is what pointed at
  //    it; what it turned out to be is not an untested line but an unnecessary one.
  const deliveredFileMap = { ...installedFileMap, ...refreshedFileMap, ...reconciledFileMap };
  const updated = {
    ...local,
    engineVersion: target.engineVersion,
    indexSchemaVersion: target.indexSchemaVersion,
    //    W3 — and WHICH file families this engine governs. Until here the brain kept its
    //    INSTALL-DAY list for life, so every standing surface between two updates read
    //    globs from the release the owner happened to install at: the session nudge could
    //    not see `CLAUDE.engine.md` (a `merge` family only v4+ declares) and a retired
    //    skill went on being treated as a merge file. It widens the write guard's
    //    allowlist to whatever the new engine declares — the point, and the risk, which is
    //    why the release note says it out loud.
    ...advanceRegimes({ local, target }),
    //    F1: the repo is re-read from the launcher we just fetched, not carried over
    //    from install day. `source.repo` was written once, at install, and revised
    //    never — so a repository RENAME reached no deployed brain and they all kept
    //    cloning the old name, alive on a redirect in a namespace we no longer own.
    //    The launcher declaring its own canonical URL is what lets the fleet follow.
    source: { ...source, repo: resolveSourceRepo({ recorded: source.repo, declared: target.canonicalRepo }), ref },
    provenance: reseedProvenance({
      priorProvenance: local.provenance ?? {},
      manifest: target,
      deliveredFileMap,
    }),
    //    S4 — and WHICH version each of those bases is. The digest proves a file still
    //    matches what we shipped; it cannot name the shipment, so a brain could report a
    //    file held back and never say since when. `ref` is the one we just pulled, so a
    //    re-delivered file advances and a held-back one keeps the version it was last
    //    given — which is the sentence the owner is owed.
    baseRefs: reseedBaseRefs({
      priorBaseRefs: local.baseRefs ?? {},
      manifest: target,
      deliveredFileMap,
      ref,
    }),
  };
  writeFileSync(manifestPath, JSON.stringify(updated, null, 2) + "\n");

  //    S1 — and the base's BYTES, beside the digest that has always been recorded
  //    without them. The tree advances to what this update DELIVERED (never to what it
  //    fetched), and seeds whatever the brain can still prove about itself — which is
  //    the migration: no deployed brain holds a tree, so every update is also its first
  //    one. Driven by the SAME manifest as the re-seed above (`target`, not the brain's
  //    older copy), or a `merge` glob this release adds would reach the record and not
  //    the bytes.
  syncBaseTree({ brainDir, manifest: target, provenance: updated.provenance, deliveredFileMap });

  // 8. Auto-finalize (ADR 0026, Layer A): re-exec the FRESHLY-WRITTEN reconciler in a
  //    fresh child process, handing it the same source we fetched. A new process reads
  //    the just-written reconcile-brain.mjs from disk → escapes this process's module
  //    cache → runs the *just-installed* converge logic, collapsing the historical
  //    2-cycle into a single invocation. The child reconciles ONLY (never re-fetches,
  //    never re-finalizes) → no recursion. Done last, on top of an already-successful,
  //    already-recorded update.
  //
  //    FAIL-SOFT (#1): auto-finalize is a best-effort finisher on top of an update that
  //    is ALREADY done + recorded (step 7). A failure in the fresh child (flaky npm
  //    install, ABI hiccup) must NEVER reject this function — that would print the CLI's
  //    "the brain was NOT changed past this point" over a successful update. We belt it
  //    here even though defaultFinalizeReconcile is itself fail-soft, so EVERY injected
  //    seam is safe. SessionStart self-heal (Layer B) converges the rest on next start.
  try {
    await finalizeReconcile({ brainDir, sourceDir, platform });
  } catch {
    // swallowed on purpose — the update succeeded; self-heal will finish the job.
  }

  // 9. PERSIST what this update wrote. Everything above rewrote VERSIONED,
  //    engine-owned files (the manifest, scripts/lib/**, the launchers, plus
  //    whatever the finalize child converged) — and nothing else commits them: the
  //    brain's auto-commit is a hook fired by a session WRITE, so a user who only
  //    READS for a few days never triggers it. Left uncommitted, those files make
  //    the SessionStart `git pull --rebase` refuse to run ("you have unstaged
  //    changes") → the brain silently stops syncing at EVERY start until someone
  //    commits by hand. Committing here keeps the invariant: an update never leaves
  //    the repo dirty. It never PUSHES — that stays opt-in (`secondbrain.autopush`).
  //    Done LAST, after the finalize child's own writes, and fail-soft for the same
  //    reason as step 8: the update is already done + recorded.
  let committed = null;
  try {
    committed = commitEngineWrites({ brainDir, ref });
  } catch {
    // swallowed on purpose — a git hiccup must never fail an applied update. The
    // SessionStart banner says WHY the next pull is blocked (repo-status.mjs).
  }

  // 10. DESCRIBE what the brain is still holding back. This READS files off disk, and it
  //     is the last thing the update does — after the merge, after the manifest rewrite,
  //     after the commit. One file that has gone unreadable in the meantime (a permission
  //     change, a sync client moving it, an editor swapping it out) used to throw from
  //     here, out of `updateEngine`, into the CLI's catch — which prints "❌ update-engine
  //     failed — the brain was NOT changed past this point" over an update that finished,
  //     recorded and committed. The banner's whole value is that it is TRUE, and this was
  //     the last unguarded statement able to make it a lie (F7 of the v5.0.0 review).
  //
  //     Fail-soft for exactly the reason steps 8 and 9 are: past step 7 the update IS
  //     done. And nothing is lost by staying quiet — the divergence nudge is a STANDING
  //     surface, re-read at every session start (`session-engine-divergence.mjs`), so a
  //     line omitted once comes back on its own. Guarded HERE rather than inside
  //     `readEngineDivergence`, so the function stays honest for callers that want to
  //     know, and the invariant lives where it is stated: past this point, nothing rejects.
  //
  //     🚨 CORRECTED BY S5 (second pass): "nothing is lost by staying quiet" was FALSE.
  //     The session surface swallows the identical failure, so an unreadable merge file
  //     was reported by nothing, ever. Two changes, and the catch stays for what is left:
  //     the read is now per-FILE fail-soft (one bad file no longer costs the other
  //     twenty), and the names of the files it could not read come back as a VALUE, which
  //     the report says out loud in a line of their own.
  let divergence = [];
  const divergenceUnreadable = [];
  try {
    divergence = readEngineDivergence({ brainDir, unreadable: divergenceUnreadable });
  } catch {
    // swallowed on purpose — a report we cannot build must not unsay a finished update.
    // What reaches here now is only a whole-brain failure (no directory, no manifest),
    // never one file: those arrive named, in `divergenceUnreadable`.
  }

  return {
    committed,
    divergence,
    divergenceUnreadable,
    ref: updated.source.ref,
    engineVersion: updated.engineVersion,
    copied,
    regenerated,
    reindexed,
    reindexReason,
    vaultNoteCount,
    installedSkills,
    skillsRetired,
    skillsRetirePreserved,
    skillsRefreshed,
    skillsPreserved,
    skillsMerged,
    conflicts,
    scriptsRefreshed,
    scriptsPreserved,
    scriptsMerged,
    scriptConflicts,
    doctrineRefreshed,
    doctrinePreserved,
    doctrineMerged,
    doctrineConflicts,
    healed,
    ancestorsHydrated,
    ancestorsUnreachable,
    ancestorsUnmatched,
    mcpServersAdded,
    hooksAdded,
    hooksRepaired,
    statusLineRemoved,
    pointerUnignored,
  };
}

// A2 (F-B7d): arm the persistent restart flag so the statusLine keeps nudging until
// the user restarts — a belt for the in-session converged case (the report banner
// alone scrolls away). The next fresh, converged session clears it
// (session-self-heal). Fail-soft: the nudge is a convenience, never a blocker.
export function armRestartFlag(brainDir) {
  // One owner for the flag's path and body (restart-signal.mjs): three surfaces arm it —
  // this updater, the self-heal, and the pull detection (F20) — and a fourth spelling of
  // the same file is a signal nobody reads.
  armRestartPending({ repo: brainDir, mkdirSync, writeFileSync });
}

// The real I/O the CLI runs on: the brain the script lives in
// (<brain>/scripts/update-engine.mjs → brainDir = its parent), the real update, the
// real flag write and the real streams. Everything `runUpdateCli` decides is testable
// BECAUSE it is handed these instead of reaching for them (the `clear-example-notes`
// idiom) — the entry-point block below is now pure wiring.
export const realUpdateDeps = {
  brainDir: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  updateEngine,
  armRestartFlag,
  readInstalledSource: defaultReadInstalledSource,
  checkUpstream,
  log: (s) => process.stdout.write(s),
  error: (s) => process.stderr.write(s),
};

// What this brain records about where its engine comes from — the same two fields
// `updateEngine` reads at step 1, read here BEFORE anything is asked of the user.
export function defaultReadInstalledSource(brainDir) {
  const { source } = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  return { repo: source?.repo ?? null, ref: source?.ref ?? null };
}

// `--check`: the read-only first step of the real run. F3 — the opt-in prompt used
// to state the version the owner ALREADY runs and ask for a yes, so consent to a
// code swap could not answer "what for?". This resolves the target and what the
// jump contains, changes nothing, and hands back 0 whatever it finds: "I could not
// find out" is an ANSWER, and reporting it as a failed command would be the same
// conflation this fixes. The real update keeps its fail-loud exit 1.
async function runUpdateCheck(deps) {
  let source;
  try {
    source = deps.readInstalledSource(deps.brainDir);
  } catch {
    source = null;
  }
  const report =
    source === null
      ? // The fifth unknown, and the only one that cannot reach `checkUpstream` — with
        // no manifest there is no source to ask. Its SHAPE is still that module's, or
        // the two drift and one of them renders wrong (S2b-4).
        unknownUpstream({ reason: "this brain's engine-manifest.json could not be read" })
      : await deps.checkUpstream({ repo: source.repo, installedRef: source.ref });
  deps.log(formatUpdateCheck(report) + "\n");
  return 0;
}

// The command the brain-side `update-engine` skill runs, minus the process. Returns
// the exit code. FAIL LOUD (the project's strategy): on any error, print it to stderr
// and hand back a non-zero — never pretend it worked.
export async function runUpdateCli(deps = realUpdateDeps, argv = process.argv.slice(2)) {
  if (argv.includes("--check")) return runUpdateCheck(deps);
  try {
    const report = await deps.updateEngine({ brainDir: deps.brainDir });
    if (needsRestart(report)) deps.armRestartFlag(deps.brainDir);
    deps.log(formatReport(report) + "\n");
    return 0;
  } catch (e) {
    // `?? e` catches a thrown non-Error (a bare string); `?? "no reason given"` catches
    // a rejection with no reason at all — a ❌ banner over an empty line tells nobody
    // anything, and this is the one output a failed update leaves behind.
    deps.error(`\n❌ update-engine failed — the brain was NOT changed past this point.\n${e?.message ?? e ?? "no reason given"}\n`);
    return 1;
  }
}

// ── CLI entry ────────────────────────────────────────────────────────────────
// Guarded so importing this module in tests does NOT run it.
if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(await runUpdateCli());
}
