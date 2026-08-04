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
//     that does not exist. No ref → no segment. Naming that state out loud
//     ("version unknown") belongs to F3, in v4.7.0.
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

// The startup segment read from disk, with I/O injected so both the branch and
// its fail-silent twin stay reachable from a test.
export function readStartupVersionLine({ manifestPath, existsSync, readFileSync }) {
  if (!existsSync(manifestPath)) return null;
  try {
    return startupVersionLine(JSON.parse(readFileSync(manifestPath, "utf8")));
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
