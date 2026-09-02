// ─────────────────────────────────────────────────────────────────────────────
// os-banner.mjs — the native banner the live sync raises when someone ELSE's notes
// land (plan #84, step 5.2).
//
// Every other channel of this feature needs the person to be looking at Claude: the
// announcement waits for their next message, and the transcript waits for them to
// read it. This one does not — it reaches them behind a browser window, or in
// another app entirely. That is its whole value, and also why it is the easiest
// part of the feature to turn into noise. So:
//
//   • it fires ONLY when an incoming author is not the person at this keyboard
//     (decided by the tick, which knows the local git identity): one's own notes,
//     arriving from one's own second Mac, are not news;
//   • at most one per tick, and never for "nothing new";
//   • `REMOTE_SYNC_BANNER=0` turns it off, and so do CI and the engine's existing
//     `SBG_NO_NOTIFY`;
//   • it is best-effort in the strongest sense: a machine with no `osascript` on
//     its PATH costs a missing toast, never a failed sync.
//
// ⚠️ This is the second implementation of "raise an OS notification" in the repo —
// `rag/src/lib/notify.ts` is the first. They are NOT a copy by choice: the engine's
// scripts are plain `.mjs` and cannot import from the TypeScript package, and the
// package cannot import from `scripts/`. The escaping rules below are therefore
// deliberately identical to that file's, and each is pinned by its own test rather
// than kept in step by a comment.
//
// POC 0.3 established the one fact this rests on: `osascript … display
// notification` from a Node child with no terminal returns ok, and the banner shows.
// ─────────────────────────────────────────────────────────────────────────────
import { countOf } from "./plural.mjs";
import { joinNames } from "./remote-arrivals.mjs";

/** The name the owner already sees on this engine's other notifications. */
export const BANNER_TITLE = "Second brain";

const isNote = (rel) => rel.startsWith("vault/") && rel.toLowerCase().endsWith(".md");

// Escape for an AppleScript double-quoted literal: backslash is the escape char, so a
// stray `"` — in a note author's name, say — would otherwise close the literal and make
// osascript exit non-zero, losing the banner with no error anyone sees.
const escapeAppleScript = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Escape for a PowerShell double-quoted literal: the backtick is the escape char, `"`
// ends the literal and `$` interpolates. The backtick goes FIRST, or the backticks the
// other two insert get doubled.
const escapePowerShell = (s) => s.replace(/`/g, "``").replace(/"/g, '`"').replace(/\$/g, "`$");

/**
 * What the banner says, or `null` when nothing arrived. Notes and other files are named
 * apart here for the same reason as in the announcement: a pulled engine file is not a
 * note, and a banner has even less room to be forgiven a confident falsehood.
 */
export function bannerBody({ files, authors }) {
  if (files.length === 0) return null;
  const notes = files.filter(isNote).length;
  const others = files.length - notes;
  const what = [notes > 0 ? countOf(notes, "note") : null, others > 0 ? countOf(others, "file") : null]
    .filter(Boolean)
    .join(" and ");
  const from = authors.length > 0 ? ` from ${joinNames(authors)}` : "";
  return `${what}${from} — already in your brain.`;
}

/**
 * How the banner is spawned, whatever the platform: detached and mute. The tick must
 * neither wait on a toast nor be kept alive by one.
 */
export const BANNER_SPAWN_OPTIONS = { detached: true, stdio: "ignore" };

/**
 * The native notification request for this platform, as a VALUE (CONVENTIONS §5ter,
 * debt 2) — or `null` when there is none we trust. "Otherwise nothing" is deliberate: a
 * wrong command is a child process failing in the background at every arrival, which is
 * worse than silence.
 */
export function buildBannerCommand(platform, { title, body }) {
  if (platform === "darwin") {
    return {
      command: "osascript",
      args: ["-e", `display notification "${escapeAppleScript(body)}" with title "${escapeAppleScript(title)}"`],
      options: BANNER_SPAWN_OPTIONS,
    };
  }
  if (platform === "win32") {
    // A WinForms balloon tip: present on every desktop Windows, no extra module. If the
    // shell cannot surface it, the spawn simply fails and the notifier swallows it.
    const ps =
      `Add-Type -AssemblyName System.Windows.Forms; ` +
      `$n = New-Object System.Windows.Forms.NotifyIcon; ` +
      `$n.Icon = [System.Drawing.SystemIcons]::Information; ` +
      `$n.Visible = $true; ` +
      `$n.ShowBalloonTip(5000, "${escapePowerShell(title)}", "${escapePowerShell(body)}", ` +
      `[System.Windows.Forms.ToolTipIcon]::Info)`;
    return { command: "powershell", args: ["-NoProfile", "-Command", ps], options: BANNER_SPAWN_OPTIONS };
  }
  return null;
}

/**
 * May this machine raise a banner at all? Only an explicit `0` turns it off — an unset or
 * empty value is not a decision — and the two automated-context switches the engine
 * already honours are honoured here too: a toast nobody is there to see is spam in a log.
 */
export function shouldBanner(env) {
  if ((env.REMOTE_SYNC_BANNER ?? "").trim() === "0") return false;
  if (env.SBG_NO_NOTIFY) return false;
  if (env.CI) return false;
  return true;
}

/**
 * The `notify` port of the tick: raise the banner, detached, and let go of it. NEVER
 * throws — the tick has already done the useful work by the time this runs, and a toast
 * may not undo it.
 */
export function buildNotifier({ platform, env, spawn }) {
  return ({ files, authors }) => {
    try {
      if (!shouldBanner(env)) return;
      const body = bannerBody({ files, authors });
      if (body === null) return;
      const request = buildBannerCommand(platform, { title: BANNER_TITLE, body });
      if (request === null) return;
      spawn(request.command, request.args, request.options).unref();
    } catch {
      // Best-effort: a missing notifier costs a banner, never a sync.
    }
  };
}
