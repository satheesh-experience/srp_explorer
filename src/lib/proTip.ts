import type { UserModule } from "./scoring";

export type Opportunity = { missing: number; label: string; categoryName: string };

// Mirrors the original prototype's proTip.js: surfaces the single
// biggest-impact next action, computed from the same numbers the cards
// show -- nothing fabricated.
export function findBiggestOpportunity(modules: UserModule[]): Opportunity | null {
  let best: Opportunity | null = null;

  for (const module of modules) {
    for (const entry of module.sub_categories) {
      const missing = entry.max_score - entry.earned_score;
      if (missing <= 0) continue;
      const label = entry.type === "group" ? entry.group_label : entry.sub_category_name;
      if (!best || missing > best.missing) {
        best = { missing, label, categoryName: module.category_name };
      }
    }
  }

  return best;
}
