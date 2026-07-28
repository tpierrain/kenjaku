/** What an indexing campaign changed — the two counters `reindex()` reports. */
export interface CampaignOutcome {
  indexed: number;
  removed: number;
}

/** Does this campaign's outcome warrant persisting the vault to git? */
export function shouldPersistCampaign(outcome: CampaignOutcome): boolean {
  return outcome.indexed > 0 || outcome.removed > 0;
}
