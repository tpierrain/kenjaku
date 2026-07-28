import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { CACHE_DIR } from "./config.js";
import type { RunProgress, WallReason } from "./progress-report.js";

/** Persistence of a catch-up run's state. Injectable for tests. */
export interface ProgressStorage {
  load(): RunProgress | null;
  save(state: RunProgress): void;
}

export interface ReindexReporterOptions {
  storage?: ProgressStorage;
  now?: () => Date;
}

export interface StartInput {
  totalChunks: number;
  scanned: number;
  skipped: number;
  removed: number;
  /**
   * Errors the caller ALREADY collected before this phase — phase-1 read failures
   * (F10). `start()` runs after the scan, so resetting to `[]` here erased them
   * before anyone could see them: `last-run.json`, `last-run.md` and `vault_stats`
   * all under-reported, and the brain answered "0 erreur" over an index missing a note.
   */
  errors?: string[];
}

export interface FinishInput {
  indexed: number;
  errors: string[];
  hitCap: boolean;
  wallReason?: WallReason;
}

/**
 * Tracks the progress of a catch-up run and persists it incrementally
 * (state readable by `vault_stats` and `last-run.md`).
 */
export class ReindexReporter {
  private readonly storage: ProgressStorage;
  private readonly now: () => Date;

  constructor(opts: ReindexReporterOptions = {}) {
    this.storage = opts.storage ?? new FileProgressStorage();
    this.now = opts.now ?? (() => new Date());
  }

  start(input: StartInput): void {
    this.storage.save({
      status: "running",
      startedAt: this.now().toISOString(),
      totalChunks: input.totalChunks,
      doneChunks: 0,
      scanned: input.scanned,
      indexed: 0,
      skipped: input.skipped,
      removed: input.removed,
      errors: [...(input.errors ?? [])],
      hitCap: false,
      wallReason: null,
    });
  }

  tick(chunksDone: number): void {
    this.update((current) => ({
      ...current,
      doneChunks: current.doneChunks + chunksDone,
    }));
  }

  recordError(message: string): void {
    this.update((current) => ({ ...current, errors: [...current.errors, message] }));
  }

  fail(message: string): void {
    this.update((current) => ({
      ...current,
      status: "error",
      finishedAt: this.now().toISOString(),
      errors: [...current.errors, message],
    }));
  }

  finish(input: FinishInput): void {
    this.update((current) => ({
      ...current,
      status: input.hitCap ? "incomplete" : "done",
      finishedAt: this.now().toISOString(),
      indexed: input.indexed,
      errors: [...current.errors, ...input.errors],
      hitCap: input.hitCap,
      wallReason: input.wallReason ?? null,
    }));
  }

  /** Loads the current state, applies the mutator, persists. No-op if no run is in progress. */
  private update(mutator: (current: RunProgress) => RunProgress): void {
    const current = this.storage.load();
    if (!current) return;
    this.storage.save(mutator(current));
  }
}

/** Default persistence: a small JSON file in CACHE_DIR (gitignored, per-machine). */
export class FileProgressStorage implements ProgressStorage {
  private readonly path: string;

  constructor(path: string = resolve(CACHE_DIR, "last-run.json")) {
    this.path = path;
  }

  load(): RunProgress | null {
    if (!existsSync(this.path)) return null;
    try {
      const parsed = JSON.parse(readFileSync(this.path, "utf-8")) as RunProgress;
      if (typeof parsed.status === "string" && typeof parsed.startedAt === "string") {
        return parsed;
      }
      return null;
    } catch {
      return null; // corrupt file → treated as absent
    }
  }

  save(state: RunProgress): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(state), "utf-8");
  }
}
