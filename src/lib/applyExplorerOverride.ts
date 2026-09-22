import type { ExplorerConfig, ExplorerModule, ExplorerGroupEntry } from "./scoring";
import { roundHalfEven } from "./scoring";

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

// A group's cap (1 for "only one counts", N for "any N of these M count")
// means an override is a *list* of chosen path_keys, capped at that same
// size. Clicking a currently-unselected path adds it; if the group is
// already at capacity, the weakest currently-selected path (by score) is
// swapped out to make room -- never the one just clicked.
export function computeNextOverrideSelection(group: ExplorerGroupEntry, clickedKey: string): string[] {
  const cap = group.cap ?? 1;
  const currentKeys = group.paths.filter((p) => p.selected).map((p) => p.path_key);
  if (currentKeys.includes(clickedKey)) return currentKeys;

  const nextKeys = [...currentKeys, clickedKey];
  if (nextKeys.length <= cap) return nextKeys;

  const scoreOf: Record<string, number> = {};
  group.paths.forEach((p) => {
    scoreOf[p.path_key] = p.path_score;
  });
  let weakest = currentKeys[0];
  for (const k of currentKeys) if (scoreOf[k] < scoreOf[weakest]) weakest = k;
  return nextKeys.filter((k) => k !== weakest);
}

export type ExplorerOverrides = Record<string, string[]>;

// Purely a client-side "what if I chose different option(s)?" preview
// layered on top of the real, rule-based selection -- never changes what's
// "true" about the configuration, never calls the backend again, and
// resets whenever the vertical changes or the page reloads.
export function applyExplorerOverrides(config: ExplorerConfig, overrides: ExplorerOverrides): ExplorerConfig {
  if (!config || Object.keys(overrides).length === 0) return config;

  let overallScore = 0;
  const modules: ExplorerModule[] = config.modules.map((module) => {
    let moduleScoreRaw = 0;
    const subCategories = module.sub_categories.map((entry) => {
      if (entry.type !== "group") {
        moduleScoreRaw += entry.total_score;
        return entry;
      }
      const overrideKeys = overrides[entry.group_key];
      const paths = entry.paths.map((path) => ({
        ...path,
        selected: overrideKeys ? overrideKeys.includes(path.path_key) : path.selected,
      }));
      const selectedPaths = paths.filter((p) => p.selected);
      const countedScore = round4(selectedPaths.reduce((s, p) => s + p.path_score, 0));
      moduleScoreRaw += countedScore;
      return { ...entry, paths, counted_score: countedScore };
    });
    const moduleScore = roundHalfEven(moduleScoreRaw);
    overallScore += moduleScore;
    return { ...module, sub_categories: subCategories, module_score: moduleScore };
  });

  return { ...config, modules, overall_score: overallScore };
}
