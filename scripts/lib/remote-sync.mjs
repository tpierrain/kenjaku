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
import { treeState } from "./repo-status.mjs";

/** The trace the announcement hooks read. At the brain ROOT: a watcher only sees root files (POC 0.1). */
export const TRACE_REL = "remote-arrivals.json";

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

const lines = (out) => out.split("\n").map((l) => l.trim()).filter(Boolean);
const unique = (items) => [...new Set(items)];
const isVaultNote = (rel) => rel.startsWith("vault/") && rel.toLowerCase().endsWith(".md");

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
export function runTick({ git, gate, indexLockPresent, readTrace, writeTrace, checkNote, push, notify, now }) {
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
    return synchronise({ git, parts, readTrace, writeTrace, checkNote, push, notify, now });
  } catch {
    return "failed";
  } finally {
    gate.release();
  }
}

function synchronise({ git, parts, readTrace, writeTrace, checkNote, push, notify, now }) {
  const known = git(["rev-parse", "@{u}"]).out.trim();
  const probe = git(["ls-remote", "--heads", parts.remote, parts.branch]);
  if (!probe.ok) return "probe-failed";
  const remoteSha = probe.out.trim().split(/\s+/)[0] ?? "";
  if (remoteSha === "" || remoteSha === known) return "up-to-date";

  if (!git(["fetch", parts.remote]).ok) return "fetch-failed";

  const rebase = git(["rebase", "@{u}"]);
  if (!rebase.ok) {
    const conflicting = lines(git(["diff", "--name-only", "--diff-filter=U"]).out);
    git(["rebase", "--abort"]);
    return record({ readTrace, writeTrace }, { arrivedAt: null, files: [], authors: [], blocked: { files: conflicting, reason: "conflict" } });
  }

  const files = lines(git(["diff", "--name-only", "ORIG_HEAD", "HEAD"]).out);
  const authors = unique(lines(git(["log", "--format=%an", "ORIG_HEAD..HEAD"]).out));

  const damaged = [];
  let reason = null;
  for (const rel of files.filter(isVaultNote)) {
    const verdict = checkNote(rel);
    if (!verdict.ok) {
      damaged.push(rel);
      reason ??= verdict.reason;
    }
  }
  if (damaged.length > 0) {
    git(["reset", "--hard", "ORIG_HEAD"]);
    return record({ readTrace, writeTrace }, { arrivedAt: null, files: [], authors: [], blocked: { files: damaged, reason } });
  }

  const outcome = record({ readTrace, writeTrace }, { arrivedAt: now().toISOString(), files, authors, blocked: null });
  push();
  const me = git(["config", "--get", "user.name"]).out.trim();
  if (authors.some((a) => a !== me)) notify({ files, authors });
  return outcome;
}

function record({ readTrace, writeTrace }, incoming) {
  writeTrace(mergeTrace(readTrace(), incoming));
  return incoming.blocked ? "blocked" : "arrived";
}
