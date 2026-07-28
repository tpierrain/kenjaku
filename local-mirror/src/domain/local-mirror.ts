import type {
  FreshnessReport,
  HealthCheckEntry,
  HealthReport,
  LocalMirrorConfig,
  MoveResult,
  RemoveResult,
  SetupRequest,
  SetupResult,
  SourceState,
  SourceStatus,
  SyncReport,
  SyncStatus,
} from './types.js';
import type {
  ConnectorFactory,
  IClock,
  IConfigStore,
  IStateStore,
  ISyncLock,
  IVaultWriter,
  PersistedItem,
  PersistedState,
  UniverseState,
} from './ports.js';
import { reuniverseLocalMirrorMarkdown, toLocalMirrorMarkdown } from '../lib/markdown.js';
import { contentHash } from '../lib/content-hash.js';
import { extractPageId } from '../lib/notion-url.js';
import { DEFAULT_UNIVERSE, isMultiverse, listAllUniverses } from '../lib/universe.js';
import { pagesToDelete } from './reconcile.js';

/**
 * API port (driving side) — the domain contract, transport-independent (PRD §5).
 * The MCP tools (§9) are a 1:1 translation of this port; one could drive it from a
 * CLI or HTTP without touching the domain.
 */
export interface ILocalMirror {
  setupSource(req: SetupRequest): Promise<SetupResult>;
  listSources(): Promise<SourceState[]>;
  /** `name` is a source name or the literal `"all"` (PRD §9). */
  sync(name: string): Promise<SyncReport>;
  checkFreshness(name: string): Promise<FreshnessReport>;
  status(name: string): Promise<SourceStatus>;
  removeSource(name: string, cleanup?: boolean): Promise<RemoveResult>;
  /**
   * Re-file a declared mirror into another universe (ADR 0034) — the ONE deliberate way to change
   * a frozen universe. Local: it rewrites the pages already on disk, never re-pulls them.
   */
  moveSource(name: string, universe: string): Promise<MoveResult>;
  /** Standard module health (ADR 0030): is the optional mirror operational? */
  healthCheck(): Promise<HealthReport>;
}

/** Driven dependencies of the Domain Service — all SPI, all stubbable (PRD §5). */
export interface LocalMirrorDeps {
  configStore: IConfigStore;
  stateStore: IStateStore;
  vaultWriter: IVaultWriter;
  clock: IClock;
  connectorFor: ConnectorFactory;
  /** Single-flight lock per source, across processes (auto-refresh study, S2 item 1). */
  syncLock: ISyncLock;
  /**
   * The brain's universe state (ADR 0034) — the active universe AND the registry it is validated
   * against. Read ONLY by `setupSource`: to offer the choice, and to FREEZE the chosen universe
   * into the config at declaration time — never on the hot sync path, so a background tick firing
   * while the user `/switch`es can't scatter one mirror's notes across universes.
   */
  universes: () => UniverseState;
}

/** The Domain Service — the concrete API port. Pure orchestration, no transport. */
export class LocalMirror implements ILocalMirror {
  constructor(private readonly deps: LocalMirrorDeps) {}

  async listSources(): Promise<SourceState[]> {
    const configs = await this.deps.configStore.loadAll();
    return Promise.all(configs.map((config) => this.describe(config)));
  }

  private async describe(config: LocalMirrorConfig): Promise<SourceState> {
    const persisted = await this.deps.stateStore.load(config.name);
    return toSourceState(config, persisted);
  }

  /**
   * Onboard a brand-new local mirror (PRD §13). First it **tests the scope**: the connector's
   * scoped enumeration must return the zone — an enumeration error reads as "auth/connection
   * problem", and zero pages reads as "root not connected" (PRD §11.5/§12). Only once the scope
   * is proven do we **declare** the source (config file = versioned source of truth, §20.2) and
   * run the **first sync**. The token never travels through Claude's context — only its env-var
   * name (`tokenEnv`) is stored (§11).
   */
  async setupSource(req: SetupRequest): Promise<SetupResult> {
    const { active, registry } = this.deps.universes();
    // Past the disclosure gate, the universe must be named BEFORE anything is pulled: moving a
    // mirror afterwards costs a full re-embed of every note it holds (ADR 0034). The refusal to
    // pull is the CORE's, not the driver's — a flag the model could set itself would guard
    // nothing. Below the gate there is nothing to choose, so the word never comes up.
    if (!req.universe && isMultiverse(registry)) return universeChoiceNeeded(req, active, registry);
    // A universe nobody declared is a typo or the stale memory of a renamed one. Creating its
    // folder anyway would file the whole mirror into a scope no search ever reaches.
    if (req.universe && !listAllUniverses(registry).includes(req.universe)) {
      return unknownUniverse(req, active, registry);
    }

    // Freeze the retained universe into the config NOW (ADR 0034) — never re-read at sync time.
    // Past the gate `req.universe` is always set (the two guards above are what make that true);
    // below it there is nothing to choose and `active` is necessarily the default, since an empty
    // registry disqualifies every pointer. So this reads "what they chose, else where they are".
    const retained = req.universe ?? active;
    // A mirror that already exists cannot be re-filed by re-declaring it: the pull would land in
    // the new folder and leave an orphaned, permanently stale copy in the old one. Refuse BEFORE
    // reaching the connector — this costs no token and no network call.
    const existing = (await this.deps.configStore.loadAll()).find((c) => c.name === req.name);
    if (existing && universeOf(existing) !== retained) {
      return cannotChangeUniverse(req, existing, retained);
    }

    const config = configFromRequest(req, retained);
    const connector = this.deps.connectorFor(config);

    let items;
    try {
      items = await connector.listItems();
    } catch (error) {
      return {
        name: req.name,
        ok: false,
        message:
          `Could not reach the "${req.name}" zone: ${errorMessage(error)}. ` +
          `Check that "${req.tokenEnv}" holds a valid Read-content token and that the root page ` +
          `is connected to the integration in Notion (••• → Connections).`,
      };
    }

    if (items.length === 0) {
      return {
        name: req.name,
        ok: false,
        message:
          `The scoped search returned 0 pages for "${req.name}". The root page is not connected ` +
          `to the integration yet: in Notion, open the root page → ••• → Connections → add your ` +
          `integration, then run setup again. (Access cascades over the whole sub-tree.)`,
      };
    }

    await this.deps.configStore.upsert(config);
    const report = await this.sync(config.name);

    return {
      name: req.name,
      ok: report.status !== 'failed',
      message:
        `Source "${req.name}" set up: scope confirmed (${items.length} page(s) in the zone), ` +
        `first sync ${report.status} — ${report.written} written, ${report.unchanged} unchanged. ` +
        // Through the writer's own path builder, universe prefix included — a message that
        // names a folder the files are not in is how an owner concludes the mirror is broken.
        `Files live under ${vaultDirFor(config)}/; the brain will index them and answer with ` +
        `clickable citations.`,
    };
  }

  /**
   * Stateful delta sync + deletion reconciliation. Each enumerated page becomes one Markdown
   * note, (re)written only when the produced markdown's hash differs from the one recorded in
   * the per-source state sidecar (PRD §10) → a no-change sync rewrites nothing. A page that left
   * the perimeter has its `.md` deleted (Step 5). The watermark advances to the max
   * `last_edited_time` of the perimeter (PRD §7/§16), only on full success.
   *
   * The §7/§12 guardrail is non-negotiable: a doubtful perimeter — `listItems()` rejecting, or a
   * wholesale disappearance against a non-empty corpus — NEVER triggers a deletion; it freezes
   * the source as `partial` so a remote glitch can never wipe the local mirror.
   */
  async sync(name: string): Promise<SyncReport> {
    if (name === 'all') return this.syncAll();
    const configs = await this.deps.configStore.loadAll();
    const config = configs.find((c) => c.name === name);
    if (!config) {
      return { name, status: 'failed', written: 0, deleted: 0, unchanged: 0 };
    }
    // Single-flight across processes: if another live MCP window is already syncing this
    // source, skip rather than race on its state.json (last-write-wins would corrupt it).
    if (!this.deps.syncLock.acquire(config.name)) {
      return { name, status: 'skipped', written: 0, deleted: 0, unchanged: 0 };
    }
    try {
      return await this.syncLocked(config, name);
    } finally {
      this.deps.syncLock.release(config.name);
    }
  }

  /** The critical section of a single-source sync — runs while holding the source's lock. */
  private async syncLocked(config: LocalMirrorConfig, name: string): Promise<SyncReport> {
    const previous = await this.deps.stateStore.load(config.name);
    const connector = this.deps.connectorFor(config);
    const now = this.deps.clock.now().toISOString();

    // §7/§12 guardrail (the #1 risk): a failed/incomplete enumeration must NEVER read as an
    // empty perimeter, or reconciliation would wipe the whole corpus. When `listItems()` rejects
    // (401/429/network/truncated pagination), we delete nothing, keep every tracked item, freeze
    // the watermark, and report `partial` so the next run re-pulls everything.
    let items;
    try {
      items = await connector.listItems();
    } catch {
      return this.freezeAsPartial(config, previous, now);
    }

    // §7/§12 guardrail: a lost scope / disconnected root makes Notion's `search` return ZERO
    // pages WITHOUT an error. Reconciling that against a non-empty corpus would wipe the whole
    // local mirror. So a wholesale "everything vanished" is treated as suspicious, not real:
    // delete nothing, keep every tracked item, freeze the watermark, report `partial`.
    const previousCount = previous ? Object.keys(previous.items).length : 0;
    if (items.length === 0 && previousCount > 0) {
      return this.freezeAsPartial(config, previous, now);
    }

    const nextItems: Record<string, PersistedItem> = {};
    let written = 0;
    let unchanged = 0;
    const perimeterMax = maxLastEditedTime(items); // watermark = max of the perimeter (PRD §16)
    let allOk = true;

    for (const item of items) {
      const vaultPath = vaultPathFor(config, item.id);
      const tracked = previous?.items[item.id];
      try {
        const markdown = toLocalMirrorMarkdown(config.name, item, await connector.fetchContent(item), config.universe);
        const hash = contentHash(markdown);
        if (tracked && tracked.contentHash === hash) {
          nextItems[item.id] = tracked;
          unchanged += 1;
        } else {
          await this.deps.vaultWriter.write(vaultPath, markdown);
          nextItems[item.id] = {
            title: item.title,
            vaultPath,
            lastEditedTime: item.lastEditedTime,
            contentHash: hash,
            lastWrittenAt: now,
          };
          written += 1;
        }
      } catch {
        // §10/§12: when in doubt we don't write — keep the last good version of this item
        // (incremental persistence) and mark the whole sync partial so the watermark freezes.
        allOk = false;
        if (tracked) nextItems[item.id] = tracked;
      }
    }

    // Deletion reconciliation (PRD §7): a page that left the enumerated perimeter (deleted or
    // moved out of scope) has its `.md` removed and is dropped from the state map. We only get
    // here once `listItems()` resolved — a failed/incomplete enumeration never reaches this
    // point, so the non-negotiable §7/§12 guardrail (never delete on a doubtful perimeter) holds.
    let deleted = 0;
    for (const { id, ...stale } of pagesToDelete(items, previous?.items ?? {})) {
      try {
        await this.deps.vaultWriter.delete(stale.vaultPath);
        deleted += 1;
      } catch {
        // A delete that fails (I/O/permission/transient) must NOT abort the sync after the
        // page writes already landed, or the vault would diverge from the saved state. Freeze
        // the run as `partial` (watermark frozen) and KEEP the page tracked, so the next sync
        // retries its removal and state stays consistent with what is actually on disk.
        allOk = false;
        nextItems[id] = stale;
      }
    }

    // The watermark advances to the perimeter max only on a fully successful sync; a partial
    // sync freezes it at the previous value, so the next run re-pulls the missed edits (PRD §10).
    const status = allOk ? 'ok' : 'partial';
    await this.deps.stateStore.save(config.name, {
      schemaVersion: 1,
      name: config.name,
      connector: config.connector.type,
      rootPageId: rootPageIdOf(config, previous),
      watermark: allOk ? perimeterMax : (previous?.watermark ?? null),
      lastSyncAt: now,
      lastSyncStatus: status,
      items: nextItems,
    });

    return { name, status, written, deleted, unchanged };
  }

  /**
   * Fan-out: refresh EVERY declared source in one call (PRD §9, `sync("all")`). The sources are
   * isolated by construction (own connector/token, own vault subfolder, own sidecar — nothing
   * mutable is shared), so they run CONCURRENTLY: a slow source never head-of-line-blocks the
   * rest. `allSettled` makes the fan-out CONTAINED — one source throwing is reported as a failed
   * entry, it never aborts the others. The aggregate sums the counts and reports the per-source
   * breakdown; its status is `ok` only if every source is `ok`, `failed` only if every source
   * failed, else `partial`.
   */
  private async syncAll(): Promise<SyncReport> {
    const configs = await this.deps.configStore.loadAll();
    const settled = await Promise.allSettled(configs.map((c) => this.sync(c.name)));
    const sources = settled.map((outcome, i) =>
      outcome.status === 'fulfilled' ? outcome.value : failedReport(configs[i].name),
    );
    return aggregateReports(sources);
  }

  /**
   * The §7/§12 guardrail outcome: a doubtful perimeter (enumeration failure, or a wholesale
   * disappearance) must change nothing on disk. We persist a `partial` marker with the watermark
   * frozen and every tracked item kept, so the next run re-pulls and reconciles from solid ground.
   */
  private async freezeAsPartial(
    config: LocalMirrorConfig,
    previous: PersistedState | null,
    now: string,
  ): Promise<SyncReport> {
    await this.deps.stateStore.save(config.name, {
      schemaVersion: 1,
      name: config.name,
      connector: config.connector.type,
      rootPageId: rootPageIdOf(config, previous),
      watermark: previous?.watermark ?? null,
      lastSyncAt: now,
      lastSyncStatus: 'partial',
      items: previous?.items ?? {},
    });
    return { name: config.name, status: 'partial', written: 0, deleted: 0, unchanged: 0 };
  }

  /**
   * Light watermark-only freshness check (PRD §8/§9): enumerate the perimeter metadata (no
   * content fetched, nothing written), take the remote max `last_edited_time`, and compare it
   * to the local watermark. A source is `behind` when the remote perimeter holds an edit the
   * local watermark hasn't caught yet — including a brand-new, never-synced source.
   *
   * Notion caveat: `last_edited_time` has MINUTE granularity. A sync that lands in the same minute
   * as the latest edit may have snapshotted a page mid-edit; a further edit within that same minute
   * leaves the timestamp unchanged, so a strict `>` would miss it forever. Once that minute has
   * elapsed we report `behind` ONCE so the tick runs a corrective sync (its content hash catches the
   * missed edit, and its later `lastSyncAt` clears the provisional flag — no re-sync loop).
   */
  async checkFreshness(name: string): Promise<FreshnessReport> {
    const config = await this.configOrThrow(name);
    const persisted = await this.deps.stateStore.load(config.name);
    const items = await this.deps.connectorFor(config).listItems();
    const remoteWatermark = maxLastEditedTime(items);
    const localWatermark = persisted?.watermark ?? null;
    const newerEdit = localWatermark === null || (remoteWatermark !== null && remoteWatermark > localWatermark);
    const behind =
      remoteWatermark !== null &&
      (newerEdit || this.watermarkMayHideSameMinuteEdit(remoteWatermark, localWatermark, persisted));
    return { name, behind, localWatermark, remoteWatermark };
  }

  /**
   * True when the watermark is "provisional": the last sync landed in the SAME minute as the
   * watermark (so a same-minute edit could have slipped past Notion's minute-granular timestamp)
   * AND that minute has now elapsed (so one corrective sync is due). Bounded to a single extra
   * sync per active minute — the corrective sync's `lastSyncAt` falls in a later minute, clearing
   * this flag.
   */
  private watermarkMayHideSameMinuteEdit(
    remoteWatermark: string | null,
    localWatermark: string | null,
    persisted: PersistedState | null,
  ): boolean {
    if (localWatermark === null || persisted?.lastSyncAt == null || remoteWatermark !== localWatermark) return false;
    const watermarkMinute = epochMinute(localWatermark);
    const syncedInWatermarkMinute = epochMinute(persisted.lastSyncAt) === watermarkMinute;
    const minuteHasElapsed = epochMinute(this.deps.clock.now().toISOString()) > watermarkMinute;
    return syncedInWatermarkMinute && minuteHasElapsed;
  }

  /** A single source's state — last sync, watermark, item count, lateness (PRD §9). No pull. */
  async status(name: string): Promise<SourceStatus> {
    return this.describe(await this.configOrThrow(name));
  }

  /**
   * Standard module health (ADR 0030): is the OPTIONAL Notion mirror operational?
   * The check belongs here (the module); the caller owns the reaction. Read-only —
   * it loads config + per-source sidecar state, pulls NOTHING from Notion. Nothing
   * declared yet → `unknown` (never `broken`): an un-set-up mirror is not a failure.
   */
  async healthCheck(): Promise<HealthReport> {
    let configs: LocalMirrorConfig[];
    try {
      configs = await this.deps.configStore.loadAll();
    } catch (error) {
      return unknownReport('config', `config unreadable: ${errorMessage(error)}`);
    }
    if (configs.length === 0) {
      return unknownReport('config', 'no local mirror configured');
    }

    const checks: HealthCheckEntry[] = [
      { name: 'config', status: 'ok', detail: `${configs.length} mirror(s) declared` },
    ];

    // Store reachability: every declared source's sidecar state must be loadable. A
    // null state (never synced) is fine; only a THROW means the store is unreachable.
    try {
      await Promise.all(configs.map((c) => this.deps.stateStore.load(c.name)));
      checks.push({ name: 'store', status: 'ok', detail: 'mirror state readable' });
    } catch (error) {
      checks.push({ name: 'store', status: 'broken', detail: `mirror store unreachable: ${errorMessage(error)}` });
    }

    return { status: aggregateHealth(checks), checks };
  }

  /** Finds a declared source by name, or throws a clear error for the caller to surface. */
  private async configOrThrow(name: string): Promise<LocalMirrorConfig> {
    const configs = await this.deps.configStore.loadAll();
    const config = configs.find((c) => c.name === name);
    if (!config) throw new Error(`Unknown local mirror "${name}"`);
    return config;
  }

  /**
   * De-register a source from the config — the versioned source of truth (PRD §9). With
   * `cleanup`, also delete every synced `.md` (from the state map) and the sidecar state;
   * cleanup is opt-in, so a plain de-register never touches the vault. Unknown source = no-op.
   */
  async removeSource(name: string, cleanup = false): Promise<RemoveResult> {
    const configs = await this.deps.configStore.loadAll();
    if (!configs.some((c) => c.name === name)) {
      return { name, removed: false, cleanedUp: false };
    }
    if (cleanup) {
      const persisted = await this.deps.stateStore.load(name);
      for (const item of Object.values(persisted?.items ?? {})) {
        await this.deps.vaultWriter.delete(item.vaultPath);
      }
      await this.deps.stateStore.delete(name);
    }
    await this.deps.configStore.remove(name);
    return { name, removed: true, cleanedUp: cleanup };
  }

  /**
   * Re-file a mirror into another universe (ADR 0034). The pages already on disk are rewritten
   * under the target universe — read, re-stamped, written at the new path, deleted from the old —
   * so a move needs no token and no network, and works while the source is unreachable.
   */
  async moveSource(name: string, universe: string): Promise<MoveResult> {
    const configs = await this.deps.configStore.loadAll();
    const config = configs.find((c) => c.name === name);
    if (!config) return { name, ok: false, moved: 0, message: unknownMirror(name, configs) };

    // Same rule as a declaration: a universe nobody created would swallow the whole corpus into a
    // scope no search reaches. The registry is read HERE, at the deliberate move, and never on the
    // sync path — which is exactly why the universe stays frozen in the config the rest of the time.
    const universes = listAllUniverses(this.deps.universes().registry);
    if (!universes.includes(universe)) {
      return {
        name,
        ok: false,
        moved: 0,
        message:
          `There is no universe called "${universe}", so "${name}" was not moved. The ones that ` +
          `exist are: ${universes.join(', ')}. Call move_source again with one of them (or create ` +
          `it first with /switch).`,
      };
    }

    // A move rewrites what a sync rewrites — the pages and the sidecar — and a sync starts on its
    // own, on the freshness timer, in every open brain window. Racing one would let a refresh write
    // pages at the OLD paths between phase 1 and the save that re-points the sidecar, leaving disk
    // and sidecar disagreeing with no failure anywhere. Same single-flight lock as `sync`.
    if (!this.deps.syncLock.acquire(config.name)) {
      return {
        name,
        ok: false,
        moved: 0,
        message:
          `"${name}" is being refreshed right now (another brain window, or its background ` +
          `timer), so it was not moved — a move and a refresh rewrite the same files. Try again ` +
          `in a moment.`,
      };
    }
    try {
      return await this.moveLocked(name, config, universe);
    } finally {
      this.deps.syncLock.release(config.name);
    }
  }

  /** The critical section of a move — runs while holding the source's single-flight lock. */
  private async moveLocked(
    name: string,
    config: LocalMirrorConfig,
    universe: string,
  ): Promise<MoveResult> {
    // The cross-cutting universe is the ABSENCE of the key, on disk as in the config — the same
    // implicit-when-default rule `configFromRequest` applies at declaration time.
    const moved = withUniverse(config, universe);
    const persisted = await this.deps.stateStore.load(name);
    const items = Object.entries(persisted?.items ?? {});

    // Phase 1 — write every page at its new path, deleting NOTHING yet. Half a move is the worst
    // outcome there is (pages under two universes, a config agreeing with neither, repairable only
    // by hand), so a failure here rolls the new copies back and leaves the old corpus untouched.
    const relocated: Record<string, PersistedItem> = {};
    const newCopies: string[] = [];
    for (const [id, item] of items) {
      const vaultPath = vaultPathFor(moved, id);
      try {
        const raw = await this.deps.vaultWriter.read(item.vaultPath);
        const markdown = reuniverseLocalMirrorMarkdown(raw, moved.universe);
        await this.deps.vaultWriter.write(vaultPath, markdown);
        // Only a copy that did NOT exist before is the rollback's to remove. On a move onto
        // the universe the mirror already lives in, the "new" path IS the old one: deleting it
        // would destroy the page instead of undoing anything — and the sidecar's matching hash
        // would then report it `unchanged` forever, so no later sync would bring it back.
        if (vaultPath !== item.vaultPath) newCopies.push(vaultPath);
        // The sidecar is the reconciliation map: a tracked path left pointing at the old folder
        // would make a later cleanup delete nothing and orphan the moved corpus. The hash follows
        // too — the universe key is part of the produced markdown, so a stale hash would make the
        // very next sync rewrite every page for nothing.
        relocated[id] = { ...item, vaultPath, contentHash: contentHash(markdown) };
      } catch (error) {
        return this.rollbackMove(name, newCopies, items, error);
      }
    }

    // Every page has landed, so the move is now a FACT: RECORD it before touching a single old
    // copy. Deleting first and recording after was the one ordering that could produce the
    // half-move this design rules out — an unwritable old page threw out of `moveSource` with the
    // pages under two universes, the config naming the old one and the sidecar pointing at the old
    // paths, so the next sync called everything `unchanged` and the new copies stayed orphaned,
    // indexed and frozen for good. Recorded first, the worst case is a stale file we can name.
    if (persisted) await this.deps.stateStore.save(name, { ...persisted, items: relocated });
    await this.deps.configStore.upsert(moved);

    // Then the old copies go. A page whose path did not change (a mirror moved onto the universe
    // it already lives in) must NOT be deleted: that is the file phase 1 just wrote. A delete that
    // fails is leftover garbage, not a reason to abort — the corpus is already where it belongs.
    const leftBehind: string[] = [];
    for (const [id, item] of items) {
      if (relocated[id].vaultPath === item.vaultPath) continue;
      try {
        await this.deps.vaultWriter.delete(item.vaultPath);
      } catch {
        leftBehind.push(item.vaultPath);
      }
    }

    return {
      name,
      ok: true,
      moved: items.length,
      message:
        `Moved "${name}" to ${universeLabel(universe)}: ` +
        `${items.length} page(s) now live under ${vaultDirFor(moved)}/.` +
        leftBehindNote(leftBehind),
    };
  }

  /**
   * Undo a move that could not complete: the copies already written under the target universe are
   * removed, so the mirror is left exactly as it was — every page at its old path, the config and
   * the sidecar never touched (phase 2 had not started). A rollback delete that itself fails is
   * swallowed: the corpus is already whole, and a leftover copy must not mask the real error.
   */
  private async rollbackMove(
    name: string,
    newCopies: readonly string[],
    items: readonly (readonly [string, PersistedItem])[],
    error: unknown,
  ): Promise<MoveResult> {
    for (const vaultPath of newCopies) {
      try {
        await this.deps.vaultWriter.delete(vaultPath);
      } catch {
        // Deliberately ignored — see above.
      }
    }
    return {
      name,
      ok: false,
      moved: 0,
      message:
        `"${name}" was NOT moved: ${errorMessage(error)}. Its ${items.length} page(s) are ` +
        `untouched, where they were, and the mirror still belongs to the universe it did. ` +
        `Nothing was left half-moved — try again once the vault is writable.`,
    };
  }
}

/** The refusal when the named mirror was never declared — it names the ones that were. */
function unknownMirror(name: string, configs: readonly LocalMirrorConfig[]): string {
  const declared = configs.map((c) => c.name);
  return (
    `There is no mirror called "${name}", so nothing was moved. ` +
    (declared.length
      ? `The declared ones are: ${declared.join(', ')}.`
      : `No mirror is declared on this brain yet.`)
  );
}

/**
 * The tail a move adds when the vault refused to delete an old copy. Staying silent would leave a
 * stale twin on disk — indexed, answering questions, and frozen forever, since the sidecar no
 * longer tracks it — so the leftovers are named, one by one, and the cost is spelled out.
 */
function leftBehindNote(leftBehind: readonly string[]): string {
  if (leftBehind.length === 0) return '';
  const [copy, are] = leftBehind.length === 1 ? ['old copy', 'is'] : ['old copies', 'are'];
  return (
    ` ⚠️ ${leftBehind.length} ${copy} could not be deleted and ${are} still on disk: ` +
    `${leftBehind.join(', ')} — delete by hand, or your brain will index the same page twice.`
  );
}

/** A single-check `unknown` health report — the "couldn't determine" verdict (ADR 0030). */
function unknownReport(checkName: string, detail: string): HealthReport {
  return { status: 'unknown', checks: [{ name: checkName, status: 'unknown', detail }] };
}

/** Aggregate verdict: any broken → broken; else any unknown → unknown; else ok (ADR 0030). */
export function aggregateHealth(checks: HealthCheckEntry[]): HealthReport['status'] {
  if (checks.some((c) => c.status === 'broken')) return 'broken';
  if (checks.some((c) => c.status === 'unknown')) return 'unknown';
  return 'ok';
}

/** A source that threw during the fan-out — reported failed, never aborting the batch. */
export function failedReport(name: string): SyncReport {
  return { name, status: 'failed', written: 0, deleted: 0, unchanged: 0 };
}

/** Aggregate the per-source reports into the `sync("all")` summary (sums + worst-of status). */
export function aggregateReports(sources: SyncReport[]): SyncReport {
  const sum = (pick: (r: SyncReport) => number) => sources.reduce((acc, r) => acc + pick(r), 0);
  return {
    name: 'all',
    status: aggregateStatus(sources),
    written: sum((r) => r.written),
    deleted: sum((r) => r.deleted),
    unchanged: sum((r) => r.unchanged),
    sources,
  };
}

/**
 * `ok` iff every attempted source is ok; `failed` iff every attempted source failed; otherwise
 * `partial`. A `skipped` source (another live window already holds its lock) is BENIGN — it is
 * excluded from the verdict, so a healthy concurrent fan-out never reads as `partial`, and an
 * all-skipped batch is `ok` (nothing failed; the other window is handling them).
 */
export function aggregateStatus(sources: SyncReport[]): SyncStatus {
  const attempted = sources.filter((r) => r.status !== 'skipped');
  if (attempted.length === 0) return 'ok';
  if (attempted.every((r) => r.status === 'ok')) return 'ok';
  if (attempted.every((r) => r.status === 'failed')) return 'failed';
  return 'partial';
}

/** The max `last_edited_time` over a perimeter (the watermark), or null if it is empty (PRD §16). */
export function maxLastEditedTime(items: readonly { lastEditedTime: string }[]): string | null {
  let max: string | null = null;
  for (const item of items) {
    if (max === null || item.lastEditedTime > max) max = item.lastEditedTime;
  }
  return max;
}

/** Epoch minute of an ISO timestamp — the granularity at which Notion stamps `last_edited_time`. */
export function epochMinute(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 60_000);
}

/** Maps a declared config + its persisted state into the API-facing SourceState. */
export function toSourceState(
  config: LocalMirrorConfig,
  persisted: PersistedState | null,
): SourceState {
  return {
    name: config.name,
    title: config.title,
    connector: config.connector.type,
    watermark: persisted?.watermark ?? null,
    lastSyncAt: persisted?.lastSyncAt ?? null,
    lastSyncStatus: persisted?.lastSyncStatus ?? 'never',
    itemCount: persisted ? Object.keys(persisted.items).length : 0,
  };
}

/**
 * The preflight (ADR 0034): past the disclosure gate, a setup that has not named its universe
 * declares NOTHING and pulls NOTHING — it hands back the menu, the pre-selection, where the
 * mirror would land, and why the choice is cheap now and expensive later. The machine-readable
 * `awaitingUniverse` is what the driver reads; the message is what the owner is told.
 */
export function universeChoiceNeeded(
  req: SetupRequest,
  active: string,
  registry: readonly string[],
): SetupResult {
  const universes = listAllUniverses(registry);
  const landing = vaultDirFor(configFromRequest(req, active));
  return {
    name: req.name,
    ok: false,
    awaitingUniverse: { active, universes },
    message:
      `Nothing declared and nothing pulled yet: "${req.name}" must first be attached to a ` +
      `universe. Left as it is, it would join '${active}' (the one you are working in) and its ` +
      `pages would land under ${landing}/. Available: ${universes.join(', ')} — '` +
      `${DEFAULT_UNIVERSE}' is the cross-cutting one, for a source every universe should find ` +
      `(a company-wide wiki, say). Moving a mirror afterwards costs a full re-embed of every ` +
      `page it holds, so this is the cheap moment to get it right. Call setup_source again with ` +
      `the universe named.`,
  };
}

/**
 * The refusal (ADR 0034): the requested universe exists nowhere, so nothing is declared and
 * nothing is pulled. It carries the same `awaitingUniverse` menu as the preflight — the caller's
 * next move is identical, so the shape it reads should be too.
 */
export function unknownUniverse(
  req: SetupRequest,
  active: string,
  registry: readonly string[],
): SetupResult {
  const universes = listAllUniverses(registry);
  return {
    name: req.name,
    ok: false,
    awaitingUniverse: { active, universes },
    message:
      `There is no universe called "${req.universe}", so nothing was declared or pulled. ` +
      `The ones that exist are: ${universes.join(', ')}. Call setup_source again with one of ` +
      `them (or create it first with /switch).`,
  };
}

/**
 * The refusal that protects an existing corpus: a declared mirror cannot change universe by being
 * declared again. Re-declaring would replace the config and pull every page into the new folder
 * while the old copies stayed on disk — indexed, never refreshed, and beyond the reach of deletion
 * reconciliation, which only removes pages that left the SOURCE's perimeter. So nothing is declared
 * and nothing is pulled, and the owner is told the route that actually re-files a mirror.
 */
export function cannotChangeUniverse(
  req: SetupRequest,
  declared: LocalMirrorConfig,
  target: string,
): SetupResult {
  const from = universeLabel(universeOf(declared));
  const landing = vaultDirFor(configFromRequest(req, target));
  return {
    name: req.name,
    ok: false,
    message:
      `The "${req.name}" mirror already exists, in ${from}, and a mirror cannot change universe ` +
      `by being declared again: its pages would be pulled into ${landing}/ while the old copies ` +
      `stayed behind, indexed and never refreshed again. To re-file it, move it ` +
      `(move_source "${req.name}", universe: ${target}) — that rewrites its pages where they ` +
      `belong and leaves nothing behind. To change anything else about it — a rotated token, a ` +
      `wider scope — declare it again in ${from}.`,
  };
}

/**
 * The same config, filed in `universe` — with the key DROPPED for the cross-cutting scope, since
 * its absence is what "default" means on disk and in the config (ADR 0034).
 */
function withUniverse(config: LocalMirrorConfig, universe: string): LocalMirrorConfig {
  const { universe: _previous, ...rootless } = config;
  return universe === DEFAULT_UNIVERSE ? rootless : { ...rootless, universe };
}

/** The universe a declared mirror lives in: absent means the default one (ADR 0034). */
function universeOf(config: LocalMirrorConfig): string {
  return config.universe ?? DEFAULT_UNIVERSE;
}

/** How a universe is named to the owner: the default one has no name, it has a ROLE. */
function universeLabel(universe: string): string {
  return universe === DEFAULT_UNIVERSE ? 'the cross-cutting universe' : universe;
}

/**
 * Vault-relative FOLDER of a mirror's notes — the universe prefix included, so a message that
 * tells the owner where their files live can never drift from where the writer actually puts them.
 */
export function vaultDirFor(config: LocalMirrorConfig): string {
  return `${config.universe ? `${config.universe}/` : ''}${config.target_dir}`;
}

/**
 * Vault-relative path of a mirrored note. A universe-scoped mirror lands under its universe root
 * (`<universe>/<target_dir>/<id>.md`, ADR 0034) so retrieval scope travels with the file, exactly
 * as `/import --universe` files notes; a rootless mirror keeps the historical root path unchanged.
 */
export function vaultPathFor(config: LocalMirrorConfig, id: string): string {
  return `${vaultDirFor(config)}/${id}.md`;
}

/** The source's stable Notion root page id — from prior state, else extracted from the URL. */
export function rootPageIdOf(config: LocalMirrorConfig, previous: PersistedState | null): string {
  return previous?.rootPageId ?? extractPageId(config.connector.config.root_page_url);
}

/**
 * Assembles a declared config from the onboarding request — the token's env-var name only (§11).
 * The active `universe` is stamped only when it is a real, non-default scope (ADR 0034): the
 * default universe carries NO key, so a single-universe brain declares mirrors exactly as before.
 */
export function configFromRequest(req: SetupRequest, universe: string = DEFAULT_UNIVERSE): LocalMirrorConfig {
  return {
    name: req.name,
    title: req.title,
    description: req.description,
    connector: {
      type: 'notion',
      config: { root_page_url: req.rootPageUrl, token_env: req.tokenEnv },
    },
    target_dir: `mirrors/${req.name}`,
    ...(universe && universe !== DEFAULT_UNIVERSE ? { universe } : {}),
  };
}

/** A readable message from a thrown value, never leaking a token (connectors name the env var). */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
