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

import { buildLsRemoteArgs, parseTagRefs } from "./engine-fetch.mjs";
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
export async function checkUpstream({ repo, installedRef, git }) {
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
    releases: ahead.map((version) => ({ version, title: null, whatYouGet: null })),
    reason: null,
  };
}

// The remote's tag names, or null when the remote did not answer — the difference
// between "no releases" and "no answer" is the whole point of this module.
function readRemoteTags({ repo, git }) {
  if (!repo) return null;
  const { ok, out } = git(buildLsRemoteArgs(repo));
  return ok ? parseTagRefs(out) : null;
}
