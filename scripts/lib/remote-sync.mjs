// ─────────────────────────────────────────────────────────────────────────────
// remote-sync.mjs — ONE tick of the live sync between machines (plan #84, step 2).
//
// A brain that lives on more than one machine — a second computer, or a second
// person on the same private repo — only caught up at SessionStart and on `/sync`.
// This tick runs on the search server's clock while a window is open (ADR 0011,
// fifth trigger row) and does, in order:
//
//   1. nothing, unless the brain has a remote AND an upstream branch — wiring a
//      remote IS the declaration that this brain lives elsewhere too;
//   2. nothing, on a dirty tree (the persistence path commits first, on its own
//      quiet window: this tick never commits a half-written note), on an unmerged
//      tree or a paused rebase (a guided merge is someone else's turn), or while
//      git is busy (`.git/index.lock`);
//   3. nothing, if another window of this machine ticked a moment ago (the gate);
//   4. a PROBE before a pull: `ls-remote` asks the remote for one ref, a few hundred
//      bytes; only when the remote SHA differs from the known upstream does it
//      fetch and rebase. Equal → total silence: no trace, no sentence, nothing to
//      announce (CONVENTIONS §5quater: a "nothing new" every 90 s is alarm fatigue);
//   5. on a successful rebase: the files and authors that arrived, a header check on
//      the merged vault notes (the union driver can duplicate a frontmatter key; a
//      note the indexer would refuse undoes the whole rebase, local state intact),
//      the trace for the announcement path, a push through the existing opt-in, and
//      a banner when the notes come from someone else;
//   6. on a conflict the union rule does not cover: `rebase --abort`, the conflicting
//      files named in the trace, and the brain guides the merge at the next message.
//
// `git` is injected as `(args) → {out, ok}` (same seam as startup-sync.mjs) and
// NEVER throws in production; the gate, the trace I/O, the header check, the push
// and the banner are injected too, so the whole sequence is pinned by tests.
// ─────────────────────────────────────────────────────────────────────────────
import { isSamePerson, localAuthorName } from "./brain-author.mjs";
import { isNote } from "./remote-arrivals.mjs";
import { treeState } from "./repo-status.mjs";

/** The trace the announcement hooks read. At the brain ROOT: a watcher only sees root files (POC 0.1). */
export const TRACE_REL = "remote-arrivals.json";

/**
 * Why that file is in the owner's `.gitignore`, in their words rather than ours — they
 * read that file when their sync misbehaves. It is per-machine on purpose: the other
 * machine has its OWN arrivals to announce, and a committed trace would travel as a note
 * about notes. Spelled here once; the shipped `.gitignore` and the fleet migration
 * (reconcile-brain.mjs) are asserted to agree rather than trusted to.
 */
export const TRACE_IGNORE_COMMENT =
  "# What the live sync between machines just pulled in, kept for the next message to announce" +
  " (this machine's own business — never commit it).";

/** How often a window ticks. One effective tick per machine per interval (the gate). */
export const DEFAULT_INTERVAL_MS = 90_000;

// The states in which a rebase is someone else's business (same probe as universe-persist.mjs).
const IN_PROGRESS_HEADS = ["MERGE_HEAD", "REBASE_HEAD", "CHERRY_PICK_HEAD"];

/** "origin/main" → { remote: "origin", branch: "main" }; anything without a slash → null. */
export function upstreamParts(upstreamRef) {
  const ref = (upstreamRef ?? "").trim();
  const slash = ref.indexOf("/");
  if (slash <= 0 || slash === ref.length - 1) return null;
  return { remote: ref.slice(0, slash), branch: ref.slice(slash + 1) };
}

// `.trim()` on each line, not tidiness: git's output arrives `\r\n`-terminated wherever
// core.autocrlf is on, and a path carrying a stray `\r` matches nothing downstream.
const lines = (out) => out.split("\n").map((l) => l.trim()).filter(Boolean);
const unique = (items) => [...new Set(items)];

/**
 * The sha `refs/heads/<branch>` sits at on the remote, or `""` when the remote does not carry
 * that branch. Read from an `ls-remote --heads <remote> <branch>` payload, whose lines are
 * `<sha>\t<ref>`.
 *
 * Why a parse and not `out.split(/\s+/)[0]`: the pattern given to `ls-remote` matches the TAIL
 * of a ref on a path boundary, so a repo that also carries `archive/main` answers TWO lines for
 * `main` — and the first one can be the sibling's. Comparing this branch's freshness against
 * another branch's sha silences the sync, or makes it fetch on every tick, at the mercy of an
 * order that is not ours to choose. `engine-fetch.mjs` already matches whole refs for tags; two
 * spellings of this would be two opinions on which branch the remote answered about.
 */
export function remoteHeadSha(out, branch) {
  const wanted = `refs/heads/${branch}`;
  for (const line of lines(out ?? "")) {
    const cut = line.search(/\s/);
    if (cut > 0 && line.slice(cut).trim() === wanted) return line.slice(0, cut);
  }
  return "";
}

/**
 * The trace accumulates until the announcement path marks it announced: two ticks
 * between two messages must not lose the first one's files. A later successful tick
 * clears an earlier block (the conflict is gone: the other side, or a human, fixed it).
 */
export function mergeTrace(previous, incoming) {
  const carry = previous && previous.announcedAt == null ? previous : null;
  return {
    arrivedAt: incoming.arrivedAt ?? carry?.arrivedAt ?? null,
    files: unique([...(carry?.files ?? []), ...incoming.files]),
    authors: unique([...(carry?.authors ?? []), ...incoming.authors]),
    blocked: incoming.blocked ?? null,
    announcedAt: null,
  };
}

/**
 * @returns one of: "no-remote" | "no-upstream" | "deferred-dirty" | "deferred-in-progress"
 *   | "deferred-index-lock" | "gated" | "probe-failed" | "up-to-date" | "fetch-failed"
 *   | "arrived" | "blocked" | "failed"
 */
export function runTick({ git, gate, indexLockPresent, readTrace, writeTrace, checkNote, push, notify, now, identities }) {
  if (git(["remote"]).out.trim() === "") return "no-remote";
  const upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  const parts = upstream.ok ? upstreamParts(upstream.out) : null;
  if (!parts) return "no-upstream";

  const state = treeState(git(["status", "--porcelain"]).out);
  if (state === "conflicted") return "deferred-in-progress";
  if (state === "dirty") return "deferred-dirty";
  for (const head of IN_PROGRESS_HEADS) {
    if (git(["rev-parse", "-q", "--verify", head]).ok) return "deferred-in-progress";
  }
  if (indexLockPresent()) return "deferred-index-lock";

  if (!gate.acquire()) return "gated";
  try {
    return synchronise({ git, parts, readTrace, writeTrace, checkNote, push, notify, now, identities });
  } catch {
    return "failed";
  } finally {
    gate.release();
  }
}

function synchronise({ git, parts, readTrace, writeTrace, checkNote, push, notify, now, identities }) {
  const probe = git(["ls-remote", "--heads", parts.remote, parts.branch]);
  if (!probe.ok) return "probe-failed";
  const remoteSha = remoteHeadSha(probe.out, parts.branch);
  // NOT "is the remote where `@{u}` says it is": that ref is MY copy of the remote, and this
  // brain's own `fetch` advances it. A tick that fetched and whose rebase then failed left it
  // sitting at the remote's sha while HEAD stayed put — so every later tick found the two
  // equal, answered "up to date", and said nothing at all. For ever. What the early return
  // actually means is "there is nothing to pull", i.e. I ALREADY HAVE that commit. A sha this
  // repo has never seen makes the question fail, which is the same answer as "no": pull it.
  if (remoteSha === "" || git(["merge-base", "--is-ancestor", remoteSha, "HEAD"]).ok) return "up-to-date";

  if (!git(["fetch", parts.remote]).ok) return "fetch-failed";

  // Where this tick starts, captured BY VALUE, one line before the rebase. Not `ORIG_HEAD`:
  // that is a shared ref, a no-op rebase never writes it, and nothing serialises this tick
  // against the auto-commit path — so by the time the undo runs it can name an arbitrary
  // older commit, and `reset --hard` onto it destroys notes the owner just wrote. No other
  // git can move a value.
  const start = git(["rev-parse", "HEAD"]);
  const base = start.out.trim();
  // Every range below and, above all, the undo are built from this sha. A tick that cannot
  // say where it started does not start: `reset --hard ""` is not a risk worth carrying.
  if (!start.ok || base === "") return "failed";

  const rebase = git(["rebase", "@{u}"]);
  if (!rebase.ok) {
    const conflicting = lines(git(["diff", "--name-only", "--diff-filter=U"]).out);
    // The exit status, because the announcement states as a FACT that the pull was undone
    // and that the owner's side is intact. An abort that failed leaves the rebase open.
    const undone = git(["rebase", "--abort"]).ok;
    return record({ readTrace, writeTrace }, { arrivedAt: null, files: [], authors: [], blocked: { files: conflicting, reason: "conflict", undone } });
  }

  const files = lines(git(["diff", "--name-only", base, "HEAD"]).out);
  // The FILES are a tree comparison, so my own unpushed work — identical on both sides —
  // cancels out and only what changed shows. The AUTHORS cannot be read the same way:
  // a rebase replays my local commits with new SHAs, so `<base>..HEAD` lists me among
  // the arrivals. `@{u}` does not move during a rebase, so `<base>..@{u}` is exactly
  // what the other side pushed — and the announcement names people, not machines.
  const authors = unique(lines(git(["log", "--format=%an", `${base}..@{u}`]).out));

  const damaged = [];
  let reason = null;
  for (const rel of files.filter(isNote)) {
    const verdict = checkNote(rel);
    if (!verdict.ok) {
      damaged.push(rel);
      reason ??= verdict.reason;
    }
  }
  if (damaged.length > 0) {
    const undone = git(["reset", "--hard", base]).ok;
    return record({ readTrace, writeTrace }, { arrivedAt: null, files: [], authors: [], blocked: { files: damaged, reason, undone } });
  }

  const outcome = record({ readTrace, writeTrace }, { arrivedAt: now().toISOString(), files, authors, blocked: null });
  push();
  // ONE notion of "who is at this keyboard" for the whole brain (brain-author.mjs):
  // the banner here and the per-person note paths must never disagree about a name.
  // …and "myself" is whoever the OWNER said is myself: an unanswered registry compares
  // by slug alone, an answered one fuses the machines they confirmed. A raw `!==` here
  // popped a real desktop banner at an owner about their own second Mac's notes, which
  // is the same defect as splitting their day in two, one surface over.
  const me = localAuthorName(git);
  // No initial value: one that both branches overwrite is a default nothing defaults to.
  let confirmed;
  try {
    confirmed = identities();
  } catch {
    // A registry that cannot be read costs the fusion, never the tick: one banner too
    // many is a nuisance, a sync that stops is a brain out of step.
    confirmed = [];
  }
  if (authors.some((a) => !isSamePerson(a, me, confirmed))) notify({ files, authors });
  return outcome;
}

function record({ readTrace, writeTrace }, incoming) {
  writeTrace(mergeTrace(readTrace(), incoming));
  return incoming.blocked ? "blocked" : "arrived";
}
