// Once enough paths have real, started progress to fully account for a
// group's cap (cap=1 for an "exclusive" or path_priority group, cap=N for
// a capped multi-select group), nothing left untouched can change the
// outcome -- so it's faded rather than shown as an actionable "not
// started" item. Used by the User Dashboard's group rendering.
export function groupHasDecidedOutcome(cap: number | null | undefined, paths: { started: boolean }[]): boolean {
  const effectiveCap = cap ?? 1;
  const startedCount = paths.filter((p) => p.started).length;
  return startedCount >= effectiveCap;
}
