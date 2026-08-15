// ROADMAP ↔ plans consistency — pure logic, fed by the test (no I/O here).
//
// Born 2026-08-15 from two stale rows the owner had to correct in conversation:
// a hotfix row still saying LIVE and pointing at `prospective/` a week after its
// plan shipped and was archived, and a gate unchecked a month after the work it
// tracked was lived. The map is the ordering authority; when it lies, a pickup
// re-announces already-shipped work as the head of the pipe.

/**
 * Plan-file references (`prospective/x.md`, `archived/y.md`) present in the
 * markdown but absent from the actual plan-file listing. A reference to a file
 * that moved (archived) or died is exactly how the v4.8.1 row went stale.
 */
export function findMissingPlanReferences(markdown, existingFiles) {
  const refs = markdown.match(/(?:prospective|archived)\/[\w][\w.-]*\.md/g) ?? [];
  return [...new Set(refs)].filter((ref) => !existingFiles.includes(ref));
}
