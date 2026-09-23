// Scoring engine — ported field-for-field from the original SRS
// Calculation Explorer prototype's client-side calc logic, which itself
// mirrored a Python `data_loader.py` / `user_dashboard.py` pair. This is
// the single source of truth for how points are computed; both the
// Explorer view and the Agent Dashboard view call into it.

import type {
  SrsConfigRow,
  ExclusiveGroup,
  ConnectionGroupCap,
  AgentCategoryCompletion,
  AgentScoreHistory,
} from "./database.types";

export const MODULE_DISPLAY: Record<string, string> = {
  profile_completion: "Profile Completion",
  reviews_replies: "Reviews & Replies",
  connections: "Connections",
  listings: "Listings",
  web_analytics: "Web Analytics",
};
export const MODULE_ORDER = Object.keys(MODULE_DISPLAY);
export const MODULE_ICONS: Record<string, string> = {
  profile_completion: "👤",
  reviews_replies: "⭐",
  connections: "🔗",
  listings: "📍",
  web_analytics: "📊",
};

// Mirrors backend RATING_SCALE_HINTS.
export const RATING_SCALE_HINTS: Record<string, number> = { average_rating: 5 };

export function humanize(raw: string | null | undefined): string {
  if (!raw) return "Unnamed";
  return raw
    .replace(/-/g, "_")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Python's round() uses round-half-to-even (banker's rounding). JS's
// Math.round() always rounds .5 up. This matches Python so module totals
// agree exactly with any batch/ETL job computing the same numbers.
export function roundHalfEven(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "0";
  return String(round4(v));
}

// Shared by both the Calculation Explorer and the Agent Dashboard: names
// whichever path would maximize the score for a "path_priority" group
// (e.g. Review Source: Widget vs. Index), given [label, score] pairs in
// path order and the index of the path that's actually counted (decided
// by priority, not score) -- always index 0, since priority order never
// depends on any one business's actual data.
export function buildPathPriorityHint(labeledScores: [string, number][], selectedIndex: number): string {
  let bestIndex = 0;
  labeledScores.forEach((ls, i) => {
    if (ls[1] > labeledScores[bestIndex][1]) bestIndex = i;
  });
  const [selectedLabel, selectedScore] = labeledScores[selectedIndex];
  const [bestLabel, bestScore] = labeledScores[bestIndex];
  if (bestIndex === selectedIndex) {
    return `${selectedLabel} already earns the maximum available ${fmtNum(selectedScore)} points here.`;
  }
  return `${bestLabel} scores higher (${fmtNum(bestScore)} pts) than ${selectedLabel} (${fmtNum(selectedScore)} pts) here — for the maximum score, keep ${bestLabel} instead of ${selectedLabel}.`;
}

// -----------------------------------------------------------------------
// Effective groups: static exclusive_groups + per-vertical capped
// connection groups (from connection_group_caps).
// -----------------------------------------------------------------------

export type EffectiveGroup = {
  group_key: string;
  group_label: string;
  category_key: string;
  vertical_id?: number;
  type: "top_n" | "path_priority";
  cap?: number | null;
  selection_kind: "exclusive" | "capped";
  members?: string[];
  paths?: { path_key: string; path_label: string; members: string[] }[];
  explainer: string | null;
  full_marks_hint: string | null;
};

export function buildEffectiveGroups(
  exclusiveGroups: ExclusiveGroup[],
  connectionCaps: ConnectionGroupCap[]
): EffectiveGroup[] {
  const staticGroups: EffectiveGroup[] = exclusiveGroups.map((g) => ({
    group_key: g.group_key,
    group_label: g.group_label,
    category_key: g.category_key,
    type: g.group_type,
    cap: g.cap,
    selection_kind: g.selection_kind,
    members: g.members ?? undefined,
    paths: g.paths ?? undefined,
    explainer: g.explainer,
    full_marks_hint: g.full_marks_hint,
  }));

  const cappedGroups: EffectiveGroup[] = connectionCaps.map((row, index) => {
    const total = row.connections_list.length;
    return {
      group_key: `capped_connections_v${row.vertical_id}_${index}`,
      group_label: `Any ${row.srs_max_connections} of ${total} Connections Count`,
      category_key: "connections",
      vertical_id: row.vertical_id,
      type: "top_n",
      cap: row.srs_max_connections,
      selection_kind: "capped",
      members: row.connections_list,
      explainer: `Only the top ${row.srs_max_connections} of these ${total} connections count toward your score — connecting more than ${row.srs_max_connections} of them doesn't add extra points.`,
      full_marks_hint: `Connect any ${row.srs_max_connections} of these ${total} connections to earn full points here.`,
    };
  });

  return staticGroups.concat(cappedGroups);
}

function relevantGroups(groups: EffectiveGroup[], categoryKey: string, verticalId: number): EffectiveGroup[] {
  return groups.filter((g) => g.category_key === categoryKey && (g.vertical_id === undefined || g.vertical_id === verticalId));
}

// -----------------------------------------------------------------------
// Explorer view: "how does the formula work" (no completions involved).
// -----------------------------------------------------------------------

export type ExplorerSubCategory = {
  sub_category_key: string;
  sub_category_name: string;
  component_limit: number;
  points: number;
  total_score: number;
  no_of_days: number;
  has_time_window: boolean;
  rating_scale: number | null;
  per_unit_score: number | null;
  has_rating_scale_hint: boolean;
};

export type ExplorerGroupEntry = {
  type: "group";
  group_key: string;
  group_label: string;
  note: string | null;
  full_marks_hint: string | null;
  cap?: number | null;
  selection_kind: "exclusive" | "capped";
  paths: { path_key: string; path_label: string; path_score: number; fields: ExplorerSubCategory[]; selected: boolean }[];
  counted_score: number;
};

export type ExplorerEntry = ExplorerGroupEntry | (ExplorerSubCategory & { type: "single" });

export type ExplorerModule = {
  category_key: string;
  category_name: string;
  component_count: number;
  module_score: number;
  sub_categories: ExplorerEntry[];
};

export type ExplorerConfig = {
  vertical_id: number;
  vertical_name: string;
  overall_score: number;
  module_count: number;
  component_count: number;
  modules: ExplorerModule[];
};

function buildExplorerPath(
  pathKey: string,
  pathLabel: string,
  memberKeys: string[],
  lookup: Record<string, ExplorerSubCategory>
) {
  const fields = memberKeys.filter((k) => lookup[k]).map((k) => lookup[k]);
  const pathScore = round4(fields.reduce((s, f) => s + f.total_score, 0));
  return { path_key: pathKey, path_label: pathLabel, path_score: pathScore, fields, selected: false };
}

function applyExplorerGroups(
  categoryKey: string,
  subCategories: ExplorerSubCategory[],
  verticalId: number,
  groups: EffectiveGroup[]
): [ExplorerEntry[], number] {
  const lookup: Record<string, ExplorerSubCategory> = {};
  for (const sc of subCategories) lookup[sc.sub_category_key] = sc;
  const relevant = relevantGroups(groups, categoryKey, verticalId);

  const groupEntries: ExplorerGroupEntry[] = [];
  const consumedKeys = new Set<string>();

  for (const group of relevant) {
    if (group.type === "top_n") {
      const cap = group.cap ?? 1;
      const memberKeys = (group.members ?? []).filter((k) => lookup[k]);
      if (memberKeys.length < 2) continue;
      const paths = memberKeys.map((k) => buildExplorerPath(k, lookup[k].sub_category_name, [k], lookup));
      const order = paths.map((_, i) => i).sort((a, b) => paths[b].path_score - paths[a].path_score);
      const selectedIdx = new Set(order.slice(0, cap));
      selectedIdx.forEach((i) => (paths[i].selected = true));
      memberKeys.forEach((k) => consumedKeys.add(k));
      const countedScore = round4([...selectedIdx].reduce((s, i) => s + paths[i].path_score, 0));
      groupEntries.push({
        type: "group",
        group_key: group.group_key,
        group_label: group.group_label,
        note: group.explainer,
        full_marks_hint: group.full_marks_hint,
        cap,
        selection_kind: group.selection_kind,
        paths,
        counted_score: countedScore,
      });
    } else if (group.type === "path_priority") {
      const built: [ReturnType<typeof buildExplorerPath>, string[]][] = [];
      for (const pathSpec of group.paths ?? []) {
        const memberKeys = pathSpec.members.filter((k) => lookup[k]);
        if (memberKeys.length === 0) continue;
        built.push([buildExplorerPath(pathSpec.path_key, pathSpec.path_label, memberKeys, lookup), memberKeys]);
      }
      if (built.length < 2) continue;
      built[0][0].selected = true;
      built.forEach(([, mk]) => mk.forEach((k) => consumedKeys.add(k)));
      const selectedPath = built[0][0];
      // Which path is *counted* is decided by priority order, not score,
      // so the "how do I get full marks" answer has to be derived from
      // the actual numbers rather than a fixed string.
      const dynamicHint = buildPathPriorityHint(built.map(([p]) => [p.path_label, p.path_score] as [string, number]), 0);
      groupEntries.push({
        type: "group",
        group_key: group.group_key,
        group_label: group.group_label,
        note: group.explainer,
        full_marks_hint: dynamicHint,
        selection_kind: group.selection_kind,
        paths: built.map(([p]) => p),
        counted_score: selectedPath.path_score,
      });
    }
  }

  const keyToGroupEntry = new Map<string, ExplorerGroupEntry>();
  for (const entry of groupEntries) {
    for (const path of entry.paths) {
      for (const field of path.fields) keyToGroupEntry.set(field.sub_category_key, entry);
    }
  }

  const entries: ExplorerEntry[] = [];
  const inserted = new Set<ExplorerGroupEntry>();
  let countedTotal = 0;

  for (const sc of subCategories) {
    if (consumedKeys.has(sc.sub_category_key)) {
      const entry = keyToGroupEntry.get(sc.sub_category_key)!;
      if (inserted.has(entry)) continue;
      inserted.add(entry);
      entries.push(entry);
      countedTotal += entry.counted_score;
    } else {
      entries.push({ ...sc, type: "single" });
      countedTotal += sc.total_score;
    }
  }

  return [entries, round4(countedTotal)];
}

function toSubCategory(row: SrsConfigRow, includePerUnitScore: boolean): ExplorerSubCategory {
  const limit = row.component_limit;
  const points = row.points;
  const days = row.no_of_days > 0 ? Math.round(row.no_of_days) : 0;
  const subKey = row.sub_category_name;
  const ratingScale = RATING_SCALE_HINTS[subKey] ?? null;
  return {
    sub_category_key: subKey,
    sub_category_name: humanize(subKey),
    component_limit: limit,
    points,
    total_score: round4(limit * points),
    no_of_days: days,
    has_time_window: days > 0,
    rating_scale: ratingScale,
    per_unit_score: includePerUnitScore && ratingScale ? round4(points / ratingScale) : null,
    has_rating_scale_hint: ratingScale !== null,
  };
}

function groupByCategory(rows: SrsConfigRow[], includePerUnitScore: boolean): Record<string, ExplorerSubCategory[]> {
  const modules: Record<string, ExplorerSubCategory[]> = {};
  for (const row of rows) {
    const categoryKey = row.category_name.trim() || "uncategorized";
    if (!modules[categoryKey]) modules[categoryKey] = [];
    modules[categoryKey].push(toSubCategory(row, includePerUnitScore));
  }
  return modules;
}

function sortedCategoryKeys(modules: Record<string, unknown>): string[] {
  return Object.keys(modules).sort((a, b) => {
    const ai = MODULE_ORDER.indexOf(a);
    const bi = MODULE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function buildExplorerConfig(
  verticalId: number,
  verticalName: string,
  configRows: SrsConfigRow[],
  groups: EffectiveGroup[]
): ExplorerConfig | null {
  const matching = configRows.filter((r) => r.vertical_id === verticalId);
  if (matching.length === 0) return null;

  const modules = groupByCategory(matching, true);
  const categoryKeys = sortedCategoryKeys(modules);

  let overallScore = 0;
  let componentCount = 0;
  const moduleList: ExplorerModule[] = categoryKeys.map((categoryKey) => {
    const subs = modules[categoryKey];
    const [entries, rawModuleScore] = applyExplorerGroups(categoryKey, subs, verticalId, groups);
    const moduleScore = roundHalfEven(rawModuleScore);
    overallScore += moduleScore;
    componentCount += subs.length;
    return {
      category_key: categoryKey,
      category_name: MODULE_DISPLAY[categoryKey] || humanize(categoryKey),
      component_count: subs.length,
      module_score: moduleScore,
      sub_categories: entries,
    };
  });

  return {
    vertical_id: verticalId,
    vertical_name: verticalName,
    overall_score: overallScore,
    module_count: moduleList.length,
    component_count: componentCount,
    modules: moduleList,
  };
}

// -----------------------------------------------------------------------
// Agent dashboard: "how is this business actually scoring, given what
// they've completed" (effective_units = min(completed, limit)).
// -----------------------------------------------------------------------

export type ScoredRow = ExplorerSubCategory & {
  completed_units: number;
  effective_units: number;
  earned_score: number;
  max_score: number;
  is_complete: boolean;
  is_started: boolean;
  has_regression: boolean;
  peak_score: number | null;
  peak_period: string | null;
  points_below_peak: number | null;
  regression_message: string | null;
};

export type UserGroupEntry = {
  type: "group";
  group_key: string;
  group_label: string;
  note: string | null;
  full_marks_hint: string | null;
  cap?: number | null;
  selection_kind: "exclusive" | "capped";
  paths: {
    path_key: string;
    path_label: string;
    earned_score: number;
    max_score: number;
    started: boolean;
    selected: boolean;
    over_cap: boolean;
    fields: ScoredRow[];
  }[];
  earned_score: number;
  max_score: number;
};

export type UserEntry = UserGroupEntry | (ScoredRow & { type: "single" });

export type RegressionAlert = {
  category_key: string;
  category_name: string;
  sub_category_key: string;
  sub_category_name: string;
  current_score: number;
  peak_score: number;
  peak_period: string | null;
  points_below_peak: number;
  message: string;
};

export type UserModule = {
  category_key: string;
  category_name: string;
  earned_score: number;
  max_score: number;
  percent: number;
  completed_slots: number;
  total_slots: number;
  is_complete: boolean;
  regression_count: number;
  sub_categories: UserEntry[];
};

export type AgentDashboard = {
  agent_id: number;
  vertical_id: number;
  vertical_name: string;
  overall_earned: number;
  overall_max: number;
  overall_percent: number;
  regression_alerts: RegressionAlert[];
  modules: UserModule[];
};

function buildRegressionMessage(subCategoryName: string, currentScore: number, peakScore: number, peakPeriod: string | null) {
  const gap = round4(peakScore - currentScore);
  const when = peakPeriod ? ` in ${peakPeriod}` : "";
  if (currentScore <= 0) {
    return `You had ${subCategoryName} fully set up before (${fmtNum(peakScore)} pts${when}) — it looks like it's since been removed or disconnected. Re-adding it could recover ${fmtNum(gap)} points right away.`;
  }
  return `Personal best here was ${fmtNum(peakScore)} pts${when} — you're at ${fmtNum(currentScore)} now, ${fmtNum(gap)} pts below your best. A quick check could get you back on track.`;
}

function buildScoredRow(
  row: ExplorerSubCategory,
  completedForCategory: Record<string, number>,
  historyForCategory: Record<string, { peak_score: number; peak_period: string | null }>
): ScoredRow {
  const completedUnits = completedForCategory[row.sub_category_key] ?? 0;
  const limit = row.component_limit;
  const points = row.points;
  const effectiveUnits = limit ? Math.min(completedUnits, limit) : 0;
  const earnedScore = round4(effectiveUnits * points);
  const maxScore = round4(limit * points);
  const isComplete = limit > 0 && effectiveUnits >= limit;
  const isStarted = completedUnits > 0;

  const scored: ScoredRow = {
    ...row,
    completed_units: completedUnits,
    effective_units: effectiveUnits,
    earned_score: earnedScore,
    max_score: maxScore,
    is_complete: isComplete,
    is_started: isStarted,
    has_regression: false,
    peak_score: null,
    peak_period: null,
    points_below_peak: null,
    regression_message: null,
  };

  const historyEntry = historyForCategory[row.sub_category_key];
  if (historyEntry && historyEntry.peak_score > earnedScore) {
    scored.has_regression = true;
    scored.peak_score = historyEntry.peak_score;
    scored.peak_period = historyEntry.peak_period;
    scored.points_below_peak = round4(historyEntry.peak_score - earnedScore);
    scored.regression_message = buildRegressionMessage(scored.sub_category_name, earnedScore, historyEntry.peak_score, historyEntry.peak_period);
  }

  return scored;
}

function makeUserPath(pathKey: string, pathLabel: string, memberKeys: string[], lookup: Record<string, ScoredRow>) {
  const fields = memberKeys.filter((k) => lookup[k]).map((k) => lookup[k]);
  const earned = round4(fields.reduce((s, f) => s + f.earned_score, 0));
  const maxScore = round4(fields.reduce((s, f) => s + f.max_score, 0));
  const started = fields.some((f) => f.is_started);
  return { path_key: pathKey, path_label: pathLabel, earned_score: earned, max_score: maxScore, started, fields, selected: false, over_cap: false };
}

function applyUserGroups(
  categoryKey: string,
  scoredRows: ScoredRow[],
  verticalId: number,
  groups: EffectiveGroup[]
): [UserEntry[], number, number] {
  const lookup: Record<string, ScoredRow> = {};
  for (const sc of scoredRows) lookup[sc.sub_category_key] = sc;
  const relevant = relevantGroups(groups, categoryKey, verticalId);

  const groupEntries: UserGroupEntry[] = [];
  const consumedKeys = new Set<string>();

  for (const group of relevant) {
    const selectionKind = group.selection_kind;
    if (group.type === "top_n") {
      const cap = group.cap ?? 1;
      const memberKeys = (group.members ?? []).filter((k) => lookup[k]);
      if (memberKeys.length < 2) continue;
      const paths = memberKeys.map((k) => makeUserPath(k, lookup[k].sub_category_name, [k], lookup));
      const startedIdx = paths.map((p, i) => (p.started ? i : -1)).filter((i) => i !== -1);
      let order: number[];
      if (startedIdx.length > 0) {
        order = [...startedIdx].sort((a, b) => paths[b].earned_score - paths[a].earned_score);
      } else {
        order = paths.map((_, i) => i).sort((a, b) => paths[b].max_score - paths[a].max_score);
      }
      const selectedIdx = new Set(order.slice(0, cap));
      selectedIdx.forEach((i) => (paths[i].selected = true));
      if (selectionKind === "capped") {
        startedIdx.forEach((i) => {
          if (!selectedIdx.has(i)) paths[i].over_cap = true;
        });
      }
      memberKeys.forEach((k) => consumedKeys.add(k));

      const earned = round4([...selectedIdx].reduce((s, i) => s + paths[i].earned_score, 0));
      const bestPossibleIdx = paths.map((_, i) => i).sort((a, b) => paths[b].max_score - paths[a].max_score).slice(0, cap);
      const maxPossible = round4(bestPossibleIdx.reduce((s, i) => s + paths[i].max_score, 0));

      groupEntries.push({
        type: "group",
        group_key: group.group_key,
        group_label: group.group_label,
        note: group.explainer,
        full_marks_hint: group.full_marks_hint,
        cap,
        selection_kind: selectionKind,
        paths,
        earned_score: earned,
        max_score: maxPossible,
      });
    } else if (group.type === "path_priority") {
      const built: [ReturnType<typeof makeUserPath>, string[]][] = [];
      for (const pathSpec of group.paths ?? []) {
        const memberKeys = pathSpec.members.filter((k) => lookup[k]);
        if (memberKeys.length === 0) continue;
        built.push([makeUserPath(pathSpec.path_key, pathSpec.path_label, memberKeys, lookup), memberKeys]);
      }
      if (built.length < 2) continue;
      let selectedIdx = 0;
      if (!built[0][0].started) {
        const found = built.findIndex(([p]) => p.started);
        if (found !== -1) selectedIdx = found;
      }
      built[selectedIdx][0].selected = true;
      if (selectionKind === "capped") {
        built.forEach(([p], i) => {
          if (i !== selectedIdx && p.started) p.over_cap = true;
        });
      }
      built.forEach(([, mk]) => mk.forEach((k) => consumedKeys.add(k)));

      // This hint always compares against Widget (priority index 0), the
      // same way the Calculation Explorer does -- it's a structural fact
      // about the vertical's configuration ("which path is worth more"),
      // not a per-business diagnostic, so it reads identically here as it
      // does in the admin tool for the same vertical, regardless of which
      // path this particular business has actually selected.
      const dynamicHint = buildPathPriorityHint(built.map(([p]) => [p.path_label, p.max_score] as [string, number]), 0);

      groupEntries.push({
        type: "group",
        group_key: group.group_key,
        group_label: group.group_label,
        note: group.explainer,
        full_marks_hint: dynamicHint,
        selection_kind: selectionKind,
        paths: built.map(([p]) => p),
        earned_score: built[selectedIdx][0].earned_score,
        max_score: Math.max(...built.map(([p]) => p.max_score)),
      });
    }
  }

  const keyToGroupEntry = new Map<string, UserGroupEntry>();
  for (const entry of groupEntries) {
    for (const path of entry.paths) {
      for (const field of path.fields) keyToGroupEntry.set(field.sub_category_key, entry);
    }
  }

  const entries: UserEntry[] = [];
  const inserted = new Set<UserGroupEntry>();
  let earnedTotal = 0;
  let maxTotal = 0;

  for (const row of scoredRows) {
    if (consumedKeys.has(row.sub_category_key)) {
      const entry = keyToGroupEntry.get(row.sub_category_key)!;
      if (inserted.has(entry)) continue;
      inserted.add(entry);
      entries.push(entry);
      earnedTotal += entry.earned_score;
      maxTotal += entry.max_score;
    } else {
      entries.push({ ...row, type: "single" });
      earnedTotal += row.earned_score;
      maxTotal += row.max_score;
    }
  }

  return [entries, round4(earnedTotal), round4(maxTotal)];
}

export function buildAgentDashboard(
  agentId: number,
  verticalId: number,
  verticalName: string,
  configRows: SrsConfigRow[],
  completions: AgentCategoryCompletion[],
  history: AgentScoreHistory[],
  groups: EffectiveGroup[]
): AgentDashboard | null {
  const matching = configRows.filter((r) => r.vertical_id === verticalId);
  if (matching.length === 0) return null;

  const completedByCategory: Record<string, Record<string, number>> = {};
  for (const c of completions) {
    completedByCategory[c.category_name] = c.completed;
  }

  const historyByCategory: Record<string, Record<string, { peak_score: number; peak_period: string | null }>> = {};
  for (const h of history) {
    if (!historyByCategory[h.category_name]) historyByCategory[h.category_name] = {};
    historyByCategory[h.category_name][h.sub_category_name] = { peak_score: h.peak_score, peak_period: h.peak_period };
  }

  const modulesRaw = groupByCategory(matching, false);
  const categoryKeys = sortedCategoryKeys(modulesRaw);

  let overallEarned = 0;
  let overallMax = 0;
  const regressionAlerts: RegressionAlert[] = [];

  const moduleList: UserModule[] = categoryKeys.map((categoryKey) => {
    const completedForCategory = completedByCategory[categoryKey] || {};
    const historyForCategory = historyByCategory[categoryKey] || {};
    const scoredRows = modulesRaw[categoryKey].map((row) => buildScoredRow(row, completedForCategory, historyForCategory));
    const [entries, rawEarned, rawMax] = applyUserGroups(categoryKey, scoredRows, verticalId, groups);
    const moduleEarned = roundHalfEven(rawEarned);
    const moduleMax = roundHalfEven(rawMax);

    const categoryName = MODULE_DISPLAY[categoryKey] || humanize(categoryKey);
    for (const row of scoredRows) {
      if (row.has_regression && row.peak_score !== null && row.points_below_peak !== null && row.regression_message !== null) {
        regressionAlerts.push({
          category_key: categoryKey,
          category_name: categoryName,
          sub_category_key: row.sub_category_key,
          sub_category_name: row.sub_category_name,
          current_score: row.earned_score,
          peak_score: row.peak_score,
          peak_period: row.peak_period,
          points_below_peak: row.points_below_peak,
          message: row.regression_message,
        });
      }
    }

    const totalSlots = entries.length;
    const completedSlots = entries.filter(
      (e) => (e.type === "single" && e.is_complete) || (e.type === "group" && e.earned_score >= e.max_score && e.max_score > 0)
    ).length;

    overallEarned += moduleEarned;
    overallMax += moduleMax;

    const regressionCount = scoredRows.filter((r) => r.has_regression).length;

    return {
      category_key: categoryKey,
      category_name: categoryName,
      earned_score: moduleEarned,
      max_score: moduleMax,
      percent: moduleMax ? Math.round((moduleEarned / moduleMax) * 1000) / 10 : 0,
      completed_slots: completedSlots,
      total_slots: totalSlots,
      is_complete: moduleMax > 0 && moduleEarned >= moduleMax,
      regression_count: regressionCount,
      sub_categories: entries,
    };
  });

  regressionAlerts.sort((a, b) => b.points_below_peak - a.points_below_peak);

  return {
    agent_id: agentId,
    vertical_id: verticalId,
    vertical_name: verticalName,
    overall_earned: overallEarned,
    overall_max: overallMax,
    overall_percent: overallMax ? Math.round((overallEarned / overallMax) * 1000) / 10 : 0,
    regression_alerts: regressionAlerts,
    modules: moduleList,
  };
}
