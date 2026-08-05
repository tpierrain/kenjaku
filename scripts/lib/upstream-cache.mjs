// ─────────────────────────────────────────────────────────────────────────────
// upstream-cache.mjs — the session-start half of F3. The startup line named the
// engine this brain runs and stopped there, so "you are current" and "nobody
// looked" reached the owner as the same sentence.
//
// Same shape as the health re-probe (ADR 0028), and for the same reason: the
// user-facing path must stay a single file read, so the network call happens in a
// DETACHED child that writes a verdict the NEXT session start displays. It shares
// `checkUpstream` with the `--check` the skill runs — one probe, two surfaces, or
// they drift.
//
// Throttled to once a day. This is the one outbound call a brain makes on its own
// behalf; engine releases are not hourly, so a daily answer is true enough, and a
// private brain is not talking to GitHub every time a window opens.
// ─────────────────────────────────────────────────────────────────────────────

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { checkUpstream as defaultCheckUpstream } from "./engine-update-check.mjs";

// Under `.cache/`, which every brain gitignores: this is a per-machine, transient
// verdict, not vault content — committing it would put one laptop's network luck
// into the repo the other laptop pulls.
export const UPSTREAM_CACHE_REL = join(".cache", "engine-upstream.json");

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Is the verdict on disk still worth displaying, or should a fresh child go and
// look? A verdict about a version this brain no longer runs is not stale, it is
// about something else — and it is exactly what an owner sees the session after
// they updated.
export function shouldReprobe({ cached, installedRef, now, maxAgeMs = MAX_AGE_MS }) {
  if (!cached || cached.installed !== installedRef) return true;
  const at = Date.parse(cached.checkedAt ?? "");
  if (Number.isNaN(at)) return true;
  return now - at > maxAgeMs;
}

// Ask upstream and write the verdict down. Returns what it wrote, or null when it
// wrote nothing. Never throws: this runs detached, where a throw is a silent death
// and the session line would keep saying "checking for updates…" forever.
export async function probeUpstream({
  brainDir,
  now = () => Date.now(),
  checkUpstream = defaultCheckUpstream,
  readFile = (p) => readFileSync(p, "utf8"),
  writeFile = (p, body) => writeFileSync(p, body),
  makeDir = (p) => mkdirSync(p, { recursive: true }),
}) {
  try {
    const report = await runCheck({ brainDir, checkUpstream, readFile });
    // Only the verdict is cached, never the release prose: the session line quotes
    // none of it, and the skill's `--check` fetches it live at the moment it asks.
    const verdict = {
      state: report.state,
      installed: report.installed,
      target: report.target,
      ahead: report.ahead,
      reason: report.reason,
      checkedAt: new Date(now()).toISOString(),
    };
    const path = join(brainDir, UPSTREAM_CACHE_REL);
    makeDir(dirname(path));
    writeFile(path, JSON.stringify(verdict, null, 2) + "\n");
    return verdict;
  } catch {
    // A crashed probe must leave the PREVIOUS verdict standing: erasing it would
    // turn a known answer into "checking…", which reads as progress.
    return null;
  }
}

async function runCheck({ brainDir, checkUpstream, readFile }) {
  let source;
  try {
    source = JSON.parse(readFile(join(brainDir, "engine-manifest.json"))).source ?? {};
  } catch {
    // The same sentence `--check` prints for this state, deliberately: two spellings
    // of one failure are two failures to explain.
    return {
      state: "unknown",
      installed: null,
      target: null,
      ahead: null,
      reason: "this brain's engine-manifest.json could not be read",
    };
  }
  return checkUpstream({ repo: source.repo ?? null, installedRef: source.ref ?? null });
}
