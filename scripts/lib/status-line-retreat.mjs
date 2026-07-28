// ─────────────────────────────────────────────────────────────────────────────
// status-line-retreat.mjs — the engine stops occupying the owner's status line
// (ADR 0036). `statusLine` is a SINGLE value, not a merged list: as long as the
// brain's settings.json declares ours, the owner's own line does not run, however
// silent ours becomes. So the retreat has to REMOVE the key — in a deployed brain,
// through the reconciler, which is the only write we ever make to that sacred file.
//
// PURE decisions here; the read/write is the reconciler's.
// ─────────────────────────────────────────────────────────────────────────────

// The script we deliver. Matched on the file name rather than a full path: a brain
// that moved on disk, a Windows `cmd /c …run-node.cmd` wrapper and a bare `node
// scripts/status-line.mjs` all name the same file, and all of them are ours.
const ENGINE_STATUS_LINE_SCRIPT = "scripts/status-line.mjs";

/**
 * Is this `statusLine.command` the one WE installed? The provenance guard, and it
 * is non-negotiable: anything the owner set by hand must survive an engine update
 * untouched. When unsure — absent, empty, unrecognised — the answer is NO, because
 * the cost of keeping a line that is ours is a cosmetic leftover, while the cost of
 * removing one that is theirs is deleting their configuration.
 */
export function isEngineStatusLine(command) {
  if (typeof command !== "string" || command.length === 0) return false;
  return command.split("\\").join("/").includes(ENGINE_STATUS_LINE_SCRIPT);
}

/**
 * Returns `{ settings, removed }`: the settings without OUR `statusLine`, or the
 * very same object when there is nothing of ours to remove — so a converged brain
 * is left byte-identical and no needless `auto:` commit follows. Never mutates the
 * input.
 */
export function withoutEngineStatusLine(settings) {
  if (!isEngineStatusLine(settings?.statusLine?.command)) return { settings, removed: false };
  const { statusLine, ...rest } = settings;
  return { settings: rest, removed: true };
}
