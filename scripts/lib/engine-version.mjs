// ─────────────────────────────────────────────────────────────────────────────
// engine-version.mjs — pure helpers that turn an engine-manifest.json into the
// short, user-facing version labels shown OFFLINE (zero network, zero coupling).
//
// The displayed version is the git TAG the brain was generated / last-updated
// from — i.e. the manifest's `source.ref`, recorded at install (Phase 1). It is
// NOT a hand-maintained number: a tag is an intentional, maintainer-controlled
// release act.
//
// TWO labels, one resolution, and the difference between them is deliberate:
//   • `formatEngineVersion` — the status-line label (ADR 0017). Says "engine",
//     which claims nothing about WHICH product, so it can fall back to the `rag`
//     package number when the brain recorded no source.
//   • `startupVersionLine` — the session-start segment (owner's request,
//     2026-08-03). Says "Kenjaku engine", so it may only ever show a real install
//     ref: `engineVersion.rag` (1.3.0) has never been a Kenjaku release number
//     (v4.5.0), and an owner reading "Kenjaku engine 1.3.0" would report a version
//     that does not exist. No ref → no segment.
//   • `upstreamSegment` — what that same line says about UPSTREAM (F3). The version
//     alone answered "which engine do I run"; it could not tell "you are current"
//     from "nobody looked", which is the same conflation the consent prompt had.
//
// Fallbacks (never invent a version):
//   • `source.ref` present (any string — semver tag OR a branch/commit) → show it
//     verbatim. The semver-vs-not distinction only matters to the (deferred)
//     "update available" check, never to this display.
//   • no usable `source.ref` (e.g. the launcher records no `source`) → last
//     resort `engineVersion.rag`, for the status-line label ONLY (see above).
//   • nothing usable / missing / invalid manifest → null (the caller emits no
//     segment — fail-silent).
// ─────────────────────────────────────────────────────────────────────────────

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

// The one reader of "which engine point was this brain installed from" — shared,
// so the two labels can never disagree about what the brain is running.
function installRef(manifest) {
  const ref = manifest?.source?.ref;
  return nonEmptyString(ref) ? ref : null;
}

// The session-start segment, or null when this brain cannot say which Kenjaku
// release it came from.
export function startupVersionLine(manifest) {
  const ref = installRef(manifest);
  return ref === null ? null : `⚙️ Kenjaku engine ${ref}`;
}

// What the session start says about UPSTREAM, riding on the version line (F3's
// sibling). The segment exists because the line used to name the engine this brain
// runs and stop there: "you are current" and "nobody looked" reached the owner as
// the same sentence. Four states, four different sentences — and the two that are
// merely a cached verdict carry the DATE they were measured, because a remembered
// answer must not be read with the authority of a live one.
export function upstreamSegment({ cached, installedRef }) {
  const checking = " · checking for updates…";
  // A verdict about a version this brain no longer runs is not a verdict about it:
  // right after an update the cache still describes the engine that was replaced,
  // and repeating it would tell the owner to install what they already have.
  if (!cached || cached.installed !== installedRef) return checking;

  const on = isoDate(cached.checkedAt);
  const dated = (text, prefix = "") => (on === null ? ` · ${text}` : ` · ${text} (${prefix}${on})`);
  if (cached.state === "available" && cached.target) {
    const noun = cached.ahead === 1 ? "release" : "releases";
    // No date here on purpose: this one is actionable, and the action is the same
    // whether it was found this morning or an hour ago.
    return ` · ${cached.target} available (${cached.ahead} ${noun} ahead) — ask me to update your engine`;
  }
  if (cached.state === "up-to-date") return dated("up to date", "checked ");
  if (cached.state === "unknown") return dated("could not check for updates");
  return checking;
}

function isoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

// The startup segment read from disk, with I/O injected so both the branch and
// its fail-silent twin stay reachable from a test. `upstreamPath` is optional: a
// caller that passes none wants the version alone (that was this function's only
// job until F3), and one that passes it gets the upstream half appended.
export function readStartupVersionLine({ manifestPath, upstreamPath, existsSync, readFileSync }) {
  if (!existsSync(manifestPath)) return null;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
  const line = startupVersionLine(manifest);
  if (line === null || upstreamPath === undefined) return line;
  return line + upstreamSegment({ cached: readJson(upstreamPath, existsSync, readFileSync), installedRef: installRef(manifest) });
}

// Fail-soft on purpose: an absent, truncated or half-written cache is "nothing
// measured yet", never a thrown session start.
function readJson(path, existsSync, readFileSync) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function formatEngineVersion(manifest) {
  if (!manifest || typeof manifest !== "object") return null;

  const ref = installRef(manifest);
  if (ref !== null) return `engine ${ref}`;

  const rag = manifest.engineVersion?.rag;
  if (nonEmptyString(rag)) return `engine ${rag}`;

  return null;
}
