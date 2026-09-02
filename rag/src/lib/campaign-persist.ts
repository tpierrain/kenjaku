import { join } from "node:path";

/** What an indexing campaign changed — the two counters `reindex()` reports. */
export interface CampaignOutcome {
  indexed: number;
  removed: number;
}

/** Does this campaign's outcome warrant persisting the vault to git? */
export function shouldPersistCampaign(outcome: CampaignOutcome): boolean {
  return outcome.indexed > 0 || outcome.removed > 0;
}

/**
 * Does this checkout own a vault worth committing? True only for an INSTALLED
 * brain, and the discriminator is `source` — the `{repo, ref}` that
 * `recordSourceAndProvenance` stamps at install (`scripts/lib/engine-source.mjs`),
 * and that the committed launcher manifest is guaranteed NOT to pin (asserted by
 * `scripts/lib/engine-manifest-integrity.test.mjs`, which reads it as a QA-repoint
 * leak). Run the engine from the generator — a maintainer's dev session — and this
 * stays false, so the launcher's working tree is never swept into an `auto:` commit.
 *
 * NOT `provenance`: the launcher ships `"provenance": {}`, so keying on it returned
 * true on the generator and the guard failed open over a real `vault/`.
 *
 * Fails CLOSED on anything unreadable: not committing is the status quo, while
 * committing a repository we cannot identify is damage.
 */
export function persistenceApplies(manifest: unknown): boolean {
  if (typeof manifest !== "object" || manifest === null) return false;
  const source = (manifest as { source?: unknown }).source;
  return typeof source === "object" && source !== null;
}

/**
 * Runs one brain-side persistence script (`scripts/<name>`) to completion.
 * Asynchronous on purpose: a push can wait on the network (and on `auto-push.mjs`'s
 * own blocking retry), and this runs inside the MCP server — a synchronous wait
 * would freeze every search for its duration.
 */
export interface PersistDeps {
  runScript: (script: string) => void | Promise<void>;
}

/** The two brain-side scripts that persist the vault, in the only order that works. */
export const PERSIST_SCRIPTS = ["auto-commit.mjs", "auto-push.mjs"] as const;

/**
 * The brain-side script that PULLS what the other machine pushed (plan #84). Same runner,
 * same division of labour as the two above: git lives in `scripts/`, the server is only the
 * clock. Named here so the manifest guard that checks "every script an engine script spawns
 * is itself carried to upgraders" can see it.
 */
export const REMOTE_SYNC_SCRIPT = "remote-sync.mjs";

/**
 * Spawns a child process and resolves when it is done (rejecting on a non-zero
 * exit) — `promisify(execFile)` in production, a recorder in tests.
 */
export type ChildRunner = (
  command: string,
  args: readonly string[],
  options: { cwd: string; timeout: number },
) => Promise<unknown>;

/**
 * How long a persistence script may run before it is killed.
 *
 * Not a performance knob — a liveness one. `auto-push.mjs` talks to the network
 * (plus its own blocking 3 s retry), and the caller, `ReindexScheduler`, keeps
 * `running = true` for the whole await while later vault writes merely set
 * `pending`. An unbounded child that never resolves therefore stops the vault being
 * indexed for the rest of the session, with no error anywhere. Generous enough for a
 * slow push over a bad connection, finite enough that a hung one is a blip.
 */
export const PERSIST_TIMEOUT_MS = 120_000;

export interface ScriptRunnerDeps {
  /** The brain's root — the folder holding `scripts/`, `vault/` and the `.git`. */
  brainRoot: string;
  /** The node binary to run them with (`process.execPath`, never a bare "node"). */
  nodeExec: string;
  run: ChildRunner;
}

/**
 * The production {@link PersistDeps.runScript}: runs `<brainRoot>/scripts/<name>`.
 * Buffered, NOT inherited — this runs inside the MCP server, whose stdio IS the
 * protocol channel; a script's stdout must never reach it.
 */
export function buildScriptRunner({
  brainRoot,
  nodeExec,
  run,
}: ScriptRunnerDeps): (script: string) => Promise<void> {
  return async (script) => {
    await run(nodeExec, [join(brainRoot, "scripts", script)], {
      cwd: brainRoot,
      timeout: PERSIST_TIMEOUT_MS,
    });
  };
}

/**
 * What a persistence attempt did, so the watcher can trace it truthfully.
 *
 * `"ran"` is deliberately weaker than "persisted". Both scripts are separate
 * processes: their stdout is discarded (it must never reach the MCP stdio channel)
 * and both exit 0 by the hook convention, `auto-push.mjs` explicitly so. Completing
 * them therefore proves they RAN, and nothing more — a `.git/index.lock` contention
 * with the PostToolUse hook commits nothing and still exits 0. `"failed"` means the
 * child could not even be spawned or was killed on {@link PERSIST_TIMEOUT_MS}.
 */
export type PersistResult = "ran" | "skipped" | "failed";

/**
 * Persists the vault, now: commit, then push. Reuses the brain's own hook scripts
 * rather than reimplementing git — `auto-push.mjs` already gates on
 * `secondbrain.autopush`, a remote and an upstream.
 *
 * WHETHER to call this is decided by the campaign ({@link shouldPersistCampaign});
 * WHEN, by the persistence window (`PersistenceScheduler`). This function is the
 * composition root's named seam so neither decision has to be tested through it.
 */
export async function persistVaultNow(
  { runScript }: PersistDeps,
  trace: (msg: string) => void,
): Promise<PersistResult> {
  try {
    for (const script of PERSIST_SCRIPTS) await runScript(script);
    trace("💾 vault persistence: commit + push ran");
    return "ran";
  } catch {
    // Best-effort, like every other persistence path: the watcher must survive a
    // missing git, a locked index or a hook that exits non-zero. The next campaign
    // that changes something retries, and `git add .` catches up whatever was left.
    trace("💾 vault persistence: failed to run");
    return "failed";
  }
}
