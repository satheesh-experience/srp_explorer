import { useMemo, useState } from "react";
import { useVerticals } from "@/hooks/useVerticals";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { buildEffectiveGroups, buildExplorerConfig, MODULE_ICONS, fmtNum } from "@/lib/scoring";
import type { ExplorerEntry, ExplorerGroupEntry } from "@/lib/scoring";
import { applyExplorerOverrides, computeNextOverrideSelection, type ExplorerOverrides } from "@/lib/applyExplorerOverride";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ExplorerPage() {
  const { data: verticals, isLoading: loadingVerticals } = useVerticals();
  const { data: bundle, isLoading: loadingConfig } = useSrsConfig();
  const [verticalId, setVerticalId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<ExplorerOverrides>({});

  const activeVerticalId = verticalId ?? verticals?.[0]?.vertical_id ?? null;

  const rawConfig = useMemo(() => {
    if (!bundle || !activeVerticalId || !verticals) return null;
    const vertical = verticals.find((v) => v.vertical_id === activeVerticalId);
    if (!vertical) return null;
    const groups = buildEffectiveGroups(bundle.exclusiveGroups, bundle.connectionCaps);
    return buildExplorerConfig(activeVerticalId, vertical.vertical_name, bundle.configRows, groups);
  }, [bundle, verticals, activeVerticalId]);

  const config = useMemo(() => (rawConfig ? applyExplorerOverrides(rawConfig, overrides) : null), [rawConfig, overrides]);

  const handleSelectVertical = (id: number) => {
    setVerticalId(id);
    setOverrides({});
  };

  const handleSelectPath = (groupKey: string, selectedKeys: string[]) => {
    setOverrides((cur) => ({ ...cur, [groupKey]: selectedKeys }));
  };

  if (loadingVerticals || loadingConfig) {
    return <div className="p-8 text-sm text-muted-foreground">Loading configuration…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Vertical</label>
          <Select value={String(activeVerticalId ?? "")} onValueChange={(v) => handleSelectVertical(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vertical" />
            </SelectTrigger>
            <SelectContent>
              {verticals?.map((v) => (
                <SelectItem key={v.vertical_id} value={String(v.vertical_id)}>
                  {v.vertical_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Points, per-item caps, and mutually-exclusive scoring rules for this vertical, computed live from the database.
          </p>
        </CardContent>
      </Card>

      {config && (
        <Card className="bg-gradient-to-br from-[#10162a] to-[#262f52] text-white">
          <CardContent className="p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">Vertical</p>
            <h2 className="mb-5 text-2xl font-extrabold">{config.vertical_name}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/70">Overall Score</p>
                <p className="bg-gradient-to-br from-white to-blue-200 bg-clip-text text-4xl font-extrabold text-transparent">
                  {fmtNum(config.overall_score)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-extrabold">{config.module_count}</p>
                <p className="text-xs uppercase tracking-wide text-white/70">Modules</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-extrabold">{config.component_count}</p>
                <p className="text-xs uppercase tracking-wide text-white/70">Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {config?.modules.map((mod) => (
        <Collapsible
          key={mod.category_key}
          open={expanded === mod.category_key}
          onOpenChange={(open) => setExpanded(open ? mod.category_key : null)}
        >
          <Card className={expanded === mod.category_key ? "border-primary shadow-md" : undefined}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-4 p-5 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-100 text-xl">
                  {MODULE_ICONS[mod.category_key] ?? "•"}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{mod.category_name}</p>
                  <p className="text-sm text-muted-foreground">{mod.component_count} fields</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-primary">{fmtNum(mod.module_score)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">points</p>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t border-border pt-4">
                <ModuleTable entries={mod.sub_categories} onSelectPath={handleSelectPath} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}

function FormulaChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{children}</span>;
}

const EXPLORER_GRID_COLS = "grid-cols-[1.8fr_1fr_1fr_1.6fr_1fr]";

function ModuleTable({
  entries,
  onSelectPath,
}: {
  entries: ExplorerEntry[];
  onSelectPath: (groupKey: string, selectedKeys: string[]) => void;
}) {
  return (
    <div className="flex flex-col overflow-x-auto text-sm">
      <div className={`grid min-w-[640px] ${EXPLORER_GRID_COLS} gap-3 border-b border-border pb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground`}>
        <span>Sub Category</span>
        <span>Component Limit</span>
        <span>Points</span>
        <span>Calculation</span>
        <span>Total Score</span>
      </div>
      {entries.map((entry) =>
        entry.type === "single" ? (
          <div key={entry.sub_category_key} className="min-w-[640px] border-b border-border px-3 py-3.5">
            <div className={`grid ${EXPLORER_GRID_COLS} items-start gap-3`}>
              <div>
                <span className="font-bold text-[#111827]">{entry.sub_category_name}</span>
                {entry.has_time_window && (
                  <p className="mt-1.5 max-w-[220px] rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold leading-snug text-amber-800">
                    ℹ Reviews from the last {entry.no_of_days} days are considered
                  </p>
                )}
                {entry.has_rating_scale_hint && entry.per_unit_score !== null && (
                  <p className="mt-1.5 max-w-[220px] rounded-md bg-violet-50 px-2 py-1 text-[11px] font-semibold leading-snug text-violet-700">
                    ⭐ Each star in ratings carries {fmtNum(entry.per_unit_score)} points
                  </p>
                )}
              </div>
              <span className="pt-0.5 tabular-nums text-muted-foreground">{fmtNum(entry.component_limit)}</span>
              <span className="pt-0.5 tabular-nums text-muted-foreground">{fmtNum(entry.points)}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <FormulaChip>{fmtNum(entry.component_limit)}</FormulaChip>
                <span className="font-bold text-muted-foreground">×</span>
                <FormulaChip>{fmtNum(entry.points)}</FormulaChip>
                <span className="font-bold text-muted-foreground">=</span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">{fmtNum(entry.total_score)}</span>
              </span>
              <span className="pt-0.5 text-lg font-extrabold text-blue-600">{fmtNum(entry.total_score)}</span>
            </div>
          </div>
        ) : (
          <GroupBlock key={entry.group_key} group={entry} onSelectPath={onSelectPath} />
        )
      )}
    </div>
  );
}

function GroupBlock({
  group,
  onSelectPath,
}: {
  group: ExplorerGroupEntry;
  onSelectPath: (groupKey: string, selectedKeys: string[]) => void;
}) {
  const cap = group.cap ?? 1;
  const isCapped = group.selection_kind === "capped";
  const canSelect = group.paths.length > 1;
  const selectedCount = group.paths.filter((p) => p.selected).length;

  return (
    <div className={`my-2 rounded-lg border p-3 ${isCapped ? "border-indigo-200 bg-indigo-50/40" : "border-dashed border-border bg-muted/40"}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-bold">{group.group_label}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            isCapped ? "bg-indigo-200 text-indigo-900" : "bg-amber-100 text-amber-800"
          }`}
        >
          {cap === 1 ? "Only one option counts" : `Best ${cap} of ${group.paths.length} count`}
        </span>
        <span className="ml-auto text-xs font-extrabold text-primary">{fmtNum(group.counted_score)} pts counted</span>
      </div>

      {group.note && (
        <p className="mb-2 rounded-md border-l-4 border-primary bg-blue-50 p-2.5 text-[13px] font-medium">{group.note}</p>
      )}

      <div className="space-y-1.5">
        {group.paths.map((path) => {
          const clickable = canSelect && !path.selected;
          const isMultiField = path.fields.length > 1;
          return (
            <button
              key={path.path_key}
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onSelectPath(group.group_key, computeNextOverrideSelection(group, path.path_key)) : undefined}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition ${
                path.selected
                  ? "bg-emerald-50 font-semibold text-emerald-900"
                  : isCapped
                  ? "border border-indigo-200 bg-white text-indigo-900 hover:border-indigo-400"
                  : "text-muted-foreground opacity-50 hover:opacity-80"
              } ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span>
                {path.selected ? "✓ " : isCapped ? "＋ " : ""}
                {path.path_label}
                {isCapped && !path.selected && <span className="ml-1.5 text-[10px] font-bold uppercase">Not counted — extra</span>}
              </span>
              <span className="flex items-center gap-2">
                {isMultiField && <span className="tabular-nums text-muted-foreground">{fmtNum(path.path_score)} pts</span>}
                <span className="font-bold tabular-nums">{fmtNum(path.path_score)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {cap > 1 && (
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          {selectedCount} of {group.paths.length} counted toward your score (capped at {cap}).
        </p>
      )}

      {isCapped && (
        <p className="mt-1.5 text-xs font-semibold text-indigo-700">
          ＋ This business could complete every option above — the score just doesn't credit all of them.
        </p>
      )}

      {canSelect && (
        <p className="mt-1.5 text-xs italic text-muted-foreground">
          💡 Click a faded option above to preview how the score would change{cap > 1 ? " — the weakest current pick makes room for it" : ""}.
        </p>
      )}

      {group.full_marks_hint && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-teal-200 bg-teal-50 p-2.5 text-xs font-semibold text-teal-800">
          <span>🏆</span>
          <span>{group.full_marks_hint}</span>
        </div>
      )}
    </div>
  );
}
