import type { LockState } from "./reindex-lock.js";
import { formatProgressReport, RESUME_HINT, type RunProgress } from "./progress-report.js";
import type { SchedulerState } from "./reindex-scheduler.js";
import { describeShortfall, type ShortfallInput } from "./index-shortfall.js";

/**
 * Liveness line for the live-stream watcher (real-time in-memory state of the
 * MCP server): active or not, and what it's doing right now. Pure function.
 */
export function formatWatcherLiveness(input: {
  active: boolean;
  state?: SchedulerState | null;
}): string {
  if (!input.active) return "Live-stream watcher: inactive.";
  const state = input.state;
  if (state?.running) {
    const suffix = state.pending ? " (burst pending)" : "";
    return `Live-stream watcher: active — reindex in progress${suffix}.`;
  }
  if (state?.scheduled) {
    return "Live-stream watcher: active — write detected, reindex scheduled (debounce).";
  }
  return "Live-stream watcher: active (idle).";
}

export interface StatusReportInput {
  docCount: number;
  scannedCount: number;
  quotaUsed: number;
  quotaMax: number;
  reserve: number;
  lock: LockState | null;
  /**
   * Identity of the active embedding provider (`embedder.identity.providerId`).
   * The daily quota is specific to Gemini: for any other embedder
   * (in-process, OpenAI-compatible endpoint…) we don't show a Gemini quota.
   * Absent → treated as Gemini (backward-compat).
   */
  providerId?: string;
  /** State of the last catch-up run (or the in-progress one), if any. */
  progress?: RunProgress | null;
  /**
   * The shortfall the server last asked a catch-up to close (F21). Passed so the LINE and
   * the ACTION read the same state: without it the report would keep saying "catching up
   * now" about a gap the engine has already given up on.
   */
  lastCatchUpRemaining?: number | null;
  /** Current ISO instant (required for the ETA of a `running` run). */
  now?: string;
}

/** Builds a natural-language status report of the RAG (pure function, no I/O). */
export function buildStatusReport(input: StatusReportInput): string {
  const lines = [indexLine(input), embeddingLine(input)];
  const lock = lockLine(input);
  if (lock) lines.push(lock);
  const progress = progressLine(input);
  if (progress) lines.push(progress);
  return lines.join("\n");
}

function progressLine(input: StatusReportInput): string | null {
  if (!input.progress) return null;
  return formatProgressReport(input.progress, input.now ?? input.progress.startedAt);
}

/**
 * Reusable incompleteness warning (startup, degradation): a resume message if
 * docs remain to be indexed, `null` if the index is complete (nothing to
 * surface). Single source of the "index incomplete" phrasing.
 */
export function incompleteIndexWarning(input: ShortfallInput): string | null {
  const shortfall = describeShortfall(input);
  if (!shortfall) return null;

  const head = `Index incomplete: ${input.docCount}/${input.scannedCount} files indexed`;
  if (shortfall.cause === "failures") {
    const waiting = shortfall.queued > 0 ? `, ${shortfall.queued} pending` : "";
    return (
      `${head}, ${shortfall.failures.length} failed${waiting} — ${describeFailures(shortfall.failures)}. ` +
      `This will NOT resolve on its own: repair the note (or ask me to), then reindex.`
    );
  }
  if (shortfall.cause === "arrived") {
    return `${head}, ${shortfall.remaining} pending — they arrived after the last scan; catching up now.`;
  }
  if (shortfall.cause === "running") {
    return `${head}, ${shortfall.remaining} pending — a catch-up is running right now.`;
  }
  if (shortfall.cause === "stalled") {
    return (
      `${head}, ${shortfall.remaining} pending — a catch-up just ran and closed none of them. ` +
      "This will NOT resolve on its own: run `node scripts/verify-index.mjs` to see which notes disagree."
    );
  }
  // A wall: the one case the resume promise was written for, and the only one where it holds.
  return `${head}, ${shortfall.remaining} pending — ${RESUME_HINT}.`;
}

/**
 * The failures worth naming, truncated (2 max + a count of the rest) — same bound, and the
 * same reason, as the SessionStart banner's: a wall of stack-like strings is skipped as noise.
 */
function describeFailures(errors: string[], max = 2): string {
  const shown = errors.slice(0, max).join("; ");
  const rest = errors.length - max;
  return rest > 0 ? `${shown} (+${rest} other(s))` : shown;
}

function indexLine(input: StatusReportInput): string {
  return (
    incompleteIndexWarning(input) ??
    `Index up to date: ${input.docCount}/${input.scannedCount} files indexed.`
  );
}

/**
 * Embedding line: the daily quota is specific to Gemini (free tier cap). For a
 * local/alternative embedder, showing that quota would be misleading — we emit
 * an honest line instead. Provider absent → Gemini (backward-compat).
 */
function embeddingLine(input: StatusReportInput): string {
  const providerId = input.providerId;
  // Provider absent → Gemini (backward-compat). Only Gemini has the daily quota.
  if (providerId === undefined || providerId === "gemini") return quotaLine(input);
  return localEmbeddingLine(providerId);
}

function localEmbeddingLine(providerId: string): string {
  // In-process "Gemma inside": truly local → we can promise offline.
  if (providerId === "transformers-js") {
    return "Local embeddings (in-process): unlimited, offline — no API quota.";
  }
  // OpenAI-compatible endpoint (local Ollama OR remote service): no Gemini
  // quota, but we don't promise offline (it may be a network endpoint).
  if (providerId === "openai-compatible") {
    return "Embeddings via OpenAI-compatible endpoint: no Gemini quota tracked.";
  }
  return `Embeddings via ${providerId}: no Gemini quota tracked.`;
}

function quotaLine(input: StatusReportInput): string {
  const remaining = input.quotaMax - input.quotaUsed;
  return `Quota: ${input.quotaUsed}/${input.quotaMax} used today, ${remaining} remaining (reserve ${input.reserve} for search).`;
}

function lockLine(input: StatusReportInput): string | null {
  if (!input.lock) return null;
  return `Reindex in progress (PID ${input.lock.pid}).`;
}
