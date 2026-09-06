// ═══════════════════════════════════════════════════════════════════════════
// remote-sync-interval.ts — the one knob of the live sync between machines
// (plan #84, step 3.3): `REMOTE_SYNC_INTERVAL`, in seconds.
//
// Read at boot, so its first duty is to never crash the boot. A brain whose
// `.env` says `90s` (the spelling everyone reaches for first) must start on the
// default and sync normally, not fail to start a search server. Only a
// deliberate `0` turns the clock off — which is why "falsy" cannot be the
// fallback test, and why this parser is spelled out rather than inlined.
//
// Same contract, same shape and the same reasons as the local mirror's
// `resolveSyncIntervalSeconds` one package over.
// ═══════════════════════════════════════════════════════════════════════════

/** 90 s: the cadence decision 9.5 settled — fixed, with jitter, no back-off in v1. */
export const DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS = 90;

/**
 * Resolves `REMOTE_SYNC_INTERVAL` into a cadence in seconds: a non-negative whole number.
 * `0` disables the clock; anything unset or malformed (non-numeric, negative, fractional,
 * signed, or carrying a unit) falls back to {@link DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS}.
 */
export function resolveRemoteSyncIntervalSeconds(raw: string | undefined): number {
  const trimmed = raw?.trim();
  if (!trimmed) return DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS;
  if (!/^\d+$/.test(trimmed)) return DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS;
  return Number(trimmed);
}
