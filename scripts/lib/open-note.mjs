// ═══════════════════════════════════════════════════════════════════════════
// open-note.mjs — THE one rule for opening a single note (ADR 0038), pure.
//
// Two acts the product used to render identically: opening a note that BELONGS to
// the vault, and opening any Markdown file on the machine. A vault note goes to
// Obsidian when Obsidian holds this vault; anything else keeps the editor-agnostic
// OS opener of ADR 0027. Nothing here executes: this function is the single source
// the constitution, the `open-note` skill and SETUP.md are pinned to by doc guards,
// so the three surfaces cannot drift into three different rules again.
//
// `obsidianOk` is `obsidianHealth(vaultPath).status === "ok"` — installed AND this
// vault registered. Merely installed is not enough: `obsidian://` on a file of an
// unregistered vault lands on the vault picker (ADR 0029 §Consequences).
// ═══════════════════════════════════════════════════════════════════════════

// The OS opener, per platform, applied to a single target (a file path, or the
// `obsidian://` URI below — there is no cross-platform way to invoke a URI other
// than handing it to this same opener, which is why the gesture stays inside the
// allowlist every brain already has). `start` needs its empty title argument, or it
// swallows a quoted first argument as the window title. Unknown platform → null,
// the caller's cue to show the note inline instead of guessing a command.
function osOpener(platform, target) {
  if (platform === "darwin") return { command: "open", args: [target] };
  if (platform === "linux") return { command: "xdg-open", args: [target] };
  if (platform === "win32") return { command: "start", args: ["", target] };
  return null;
}

// Pure: the command that opens ONE note, or null when the platform is unknown.
export function buildOpenNoteCommand({ platform, absPath, insideVault, obsidianOk }) {
  if (insideVault && obsidianOk) {
    return osOpener(platform, `obsidian://open?path=${encodeURIComponent(absPath)}`);
  }
  return osOpener(platform, absPath);
}
