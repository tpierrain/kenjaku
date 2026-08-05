// ─────────────────────────────────────────────────────────────────────────────
// engine-update-check.mjs — WHAT IS UPSTREAM, answered before the consent prompt
// (F3). `/update-engine` used to state the version you already run and ask for a
// yes, so the owner consented to a code swap that could not answer "what for?".
// The target was knowable all along: `resolveLatestTag()` is one `git ls-remote`
// and its output already carries every intermediate tag — the call was simply
// made after the confirmation instead of before it.
//
// Read-only, fail-soft, and LAYERED (owner's call): versions → the one-line title
// of each release → the release notes' `### What you get` prose. Each layer
// degrades into the one below, never into a blank: "no update available" and "I
// could not find out" are opposite answers and must never render the same way.
// ─────────────────────────────────────────────────────────────────────────────

import { buildLsRemoteArgs, defaultGit, parseTagRefs } from "./engine-fetch.mjs";
import { compareSemverTags, parseSemverTag, pickLatestSemverTag } from "./semver-tag.mjs";

// The releases strictly newer than the one this brain runs, oldest first — i.e.
// exactly what an owner would be installing. Non-semver tags are skipped (the
// same rule `pickLatestSemverTag` applies: only stable releases advance a brain).
export function releasesAhead({ installed, tags }) {
  const from = parseSemverTag(installed);
  if (from === null) return [];
  return (tags ?? [])
    .filter((tag) => {
      const parsed = parseSemverTag(tag);
      return parsed !== null && compareSemverTags(parsed, from) > 0;
    })
    .sort((a, b) => compareSemverTags(parseSemverTag(a), parseSemverTag(b)));
}

// LAYER A — versions only, from the one `git ls-remote --tags` the real update
// already runs. Works on any git host, any fork, needs no auth, and says nothing
// it cannot know. Everything richer is layered on top of this answer, never
// instead of it.
export async function checkUpstream({
  repo,
  installedRef,
  git = realCheckDeps.git,
  fetchReleases = realCheckDeps.fetchReleases,
}) {
  const tags = readRemoteTags({ repo, git });
  const latest = pickLatestSemverTag(tags ?? []);

  // The three states this module exists to keep apart — and each "unknown" says
  // WHICH unknown it is, because "there is nothing to install" and "I could not
  // find out" are opposite answers an owner would act on differently.
  const unknown = (reason, target = null) => ({
    state: "unknown",
    installed: installedRef ?? null,
    target,
    ahead: null,
    releases: [],
    reason,
  });
  if (!repo) {
    return unknown("this brain records no source to check — engine-manifest.json has no source.repo");
  }
  if (tags === null) {
    return unknown(
      "the source did not answer — no network, or the address moved (engine-manifest.json → source.repo)",
    );
  }
  if (latest === null) {
    return unknown("the source answered, but publishes no release tag to compare against");
  }
  if (parseSemverTag(installedRef) === null) {
    // A branch/commit pin: the target is known, the DISTANCE is not. Reporting the
    // target anyway is the layering rule — degrade, never blank.
    return unknown(
      `this brain is pinned to "${installedRef}", not to a release, so how far behind it runs cannot be counted`,
      latest,
    );
  }

  const ahead = releasesAhead({ installed: installedRef, tags });
  return {
    state: ahead.length > 0 ? "available" : "up-to-date",
    installed: installedRef,
    target: ahead.length > 0 ? ahead[ahead.length - 1] : latest,
    ahead: ahead.length,
    // Layers B and C, per release and only when there IS something to install: a
    // brain that is current makes no HTTP call at all, and a release the notes do
    // not cover keeps its version rather than borrowing another one's prose.
    releases: await describeReleases({ versions: ahead, repo, fetchReleases }),
    reason: null,
  };
}

async function describeReleases({ versions, repo, fetchReleases }) {
  const bare = versions.map((version) => ({ version, title: null, whatYouGet: null }));
  if (bare.length === 0) return bare;

  const url = githubReleasesApiUrl(repo);
  if (url === null) return bare;
  const published = await fetchReleases(url);
  if (!Array.isArray(published)) return bare;

  const byTag = new Map(published.map((release) => [release?.tag_name, release]));
  return bare.map(({ version }) => {
    const release = byTag.get(version);
    return {
      version,
      title: nonEmpty(release?.name),
      whatYouGet: extractWhatYouGet(release?.body),
    };
  });
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

// The real I/O this check runs on, named rather than inlined so a test can pin it:
// git is `engine-fetch`'s own runner (the update asks git exactly this way), and the
// notes come from the public releases endpoint. Both are overridden in every unit
// test — which is precisely why the real pair needs an assertion of its own.
export const realCheckDeps = { git: defaultGit, fetchReleases: defaultFetchReleases };

// The remote's tag names, or null when the remote did not answer — the difference
// between "no releases" and "no answer" is the whole point of this module.
function readRemoteTags({ repo, git }) {
  if (!repo) return null;
  const { ok, out } = git(buildLsRemoteArgs(repo));
  return ok ? parseTagRefs(out) : null;
}

// LAYERS B and C live behind ONE public endpoint: a GitHub release carries both the
// annotated title we would otherwise read off the tag object (`name`) and the
// `### What you get` prose written for humans (`body`), so one request buys both and
// the steady state stays a single cheap git call. Anything that is not GitHub — a
// fork elsewhere, a company host, a folder — has no endpoint here and stops at
// layer A; guessing one would replace a degradation with a wrong answer.
export function githubReleasesApiUrl(repo) {
  const m = /^(?:git@github\.com:|(?:https?|ssh):\/\/(?:git@)?github\.com\/)([^/]+)\/(.+?)(?:\.git)?$/.exec(
    repo ?? "",
  );
  return m === null ? null : `https://api.github.com/repos/${m[1]}/${m[2]}/releases?per_page=100`;
}

// LAYER C — the `### What you get` section of a release note: the exact text the
// owner asked to see before consenting, already written for a non-developer (§11)
// and already reviewed. It is QUOTED, never summarised (ADR 0009): a generated
// paraphrase would put a non-deterministic step on a load-bearing consent. Null
// when the note has no such section, so the caller falls back to the title.
export function extractWhatYouGet(body) {
  const lines = (body ?? "").split("\n");
  const start = lines.findIndex((line) => /^#{1,6}\s+What you get\s*$/i.test(line.trim()));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^(#{1,6}\s|---\s*$)/.test(line.trim()));
  const section = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  return section === "" ? null : section;
}

// The one real network call outside git, and it is deliberately timid: public
// metadata only (no vault content ever leaves), a short timeout, and EVERY failure
// — offline, rate limit, private repo, a body that is not the list we expected —
// answered with null so the caller degrades to the versions instead of failing the
// check. `fetchImpl` is injected so this stays reachable from a test offline, and
// `timers` because clearing the abort timer changes nothing an owner can see, so
// only a named seam can assert it happens (this runs in a detached child that must
// finish and exit, and a live 5-second timer keeps its event loop alive).
export async function defaultFetchReleases(
  url,
  { fetchImpl = fetch, timeoutMs = 5000, timers = realTimers } = {},
) {
  const controller = new AbortController();
  const timer = timers.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/vnd.github+json", "user-agent": "kenjaku-update-check" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = await response.json();
    return Array.isArray(body) ? body : null;
  } catch {
    return null;
  } finally {
    timers.clearTimeout(timer);
  }
}

// Node's own timers, named for the same reason `realCheckDeps` is: every test
// overrides them, so the real pair needs an assertion of its own.
export const realTimers = { setTimeout, clearTimeout };

// The check as an owner reads it, in the terminal. The three states each get their
// own shape on purpose — this is the whole finding: a generic offer rendered "no
// update available" and "target simply unknown" identically, so a yes meant
// nothing. Pure, so the wording is unit-tested (the skill translates it; it does
// not rewrite it).
export function formatUpdateCheck(report) {
  const lines = [
    report.installed === null
      ? "⚙️ Your brain does not record which engine version it runs."
      : `⚙️ Your brain runs ${report.installed}.`,
  ];

  if (report.state === "up-to-date") {
    lines.push("✅ That is the latest release — there is nothing to install.");
    return lines.join("\n");
  }

  if (report.state === "unknown") {
    lines.push(`❓ I could not find out what is available: ${report.reason}.`);
    // Degrade, never blank: a distance we cannot count does not erase a target we can.
    if (report.target !== null) lines.push(`   The newest release upstream is ${report.target}.`);
    lines.push("   Updating is still possible, but I cannot tell you what it would install.");
    return lines.join("\n");
  }

  const noun = report.ahead === 1 ? "release" : "releases";
  lines.push(`📦 ${report.target} is available — ${report.ahead} ${noun} ahead.`);
  for (const { version, title, whatYouGet } of report.releases) {
    lines.push("", `── ${title ?? version}`, whatYouGet ?? "(this release published no summary)");
  }
  return lines.join("\n");
}
