import { useMemo, useState } from "react";
import { useVerticals } from "@/hooks/useVerticals";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { buildEffectiveGroups, buildExplorerConfig, MODULE_ICONS, fmtNum } from "@/lib/scoring";
import type { ExplorerEntry } from "@/lib/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ExplorerPage() {
  const { data: verticals, isLoading: loadingVerticals } = useVerticals();
  const { data: bundle, isLoading: loadingConfig } = useSrsConfig();
  const [verticalId, setVerticalId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeVerticalId = verticalId ?? verticals?.[0]?.vertical_id ?? null;

  const config = useMemo(() => {
    if (!bundle || !activeVerticalId || !verticals) return null;
    const vertical = verticals.find((v) => v.vertical_id === activeVerticalId);
    if (!vertical) return null;
    const groups = buildEffectiveGroups(bundle.exclusiveGroups, bundle.connectionCaps);
    return buildExplorerConfig(activeVerticalId, vertical.vertical_name, bundle.configRows, groups);
  }, [bundle, verticals, activeVerticalId]);

  if (loadingVerticals || loadingConfig) {
    return <div className="p-8 text-sm text-muted-foreground">Loading configuration…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Vertical</label>
          <Select value={String(activeVerticalId ?? "")} onValueChange={(v) => setVerticalId(Number(v))}>
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
                <ModuleTable entries={mod.sub_categories} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}

function ModuleTable({ entries }: { entries: ExplorerEntry[] }) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-x-auto text-sm">
      <div className="grid min-w-[560px] grid-cols-[1.6fr_1fr_1fr_1.8fr] gap-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <span>Field</span>
        <span>Limit</span>
        <span>Points</span>
        <span>Formula</span>
      </div>
      {entries.map((entry) =>
        entry.type === "single" ? (
          <div key={entry.sub_category_key} className="grid min-w-[560px] grid-cols-[1.6fr_1fr_1fr_1.8fr] items-center gap-3 py-3">
            <span className="font-medium">{entry.sub_category_name}</span>
            <span className="tabular-nums text-muted-foreground">{fmtNum(entry.component_limit)}</span>
            <span className="tabular-nums text-muted-foreground">{fmtNum(entry.points)}</span>
            <span className="flex flex-wrap items-center gap-1.5">
              <FormulaChip>{fmtNum(entry.component_limit)}</FormulaChip>
              <span className="font-bold text-muted-foreground">×</span>
              <FormulaChip>{fmtNum(entry.points)}</FormulaChip>
              <span className="font-bold text-muted-foreground">=</span>
              <span className="rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-extrabold text-teal-700">{fmtNum(entry.total_score)}</span>
            </span>
          </div>
        ) : (
          <div key={entry.group_key} className="my-2 rounded-md border border-dashed border-border bg-muted/40 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-bold">{entry.group_label}</span>
              <Badge variant={entry.selection_kind === "capped" ? "outline" : "secondary"}>
                {entry.selection_kind === "capped" ? `up to ${entry.cap ?? entry.paths.length}` : "exclusive"}
              </Badge>
              <span className="ml-auto text-xs font-extrabold text-primary">counts: {fmtNum(entry.counted_score)}</span>
            </div>
            {entry.note && (
              <p className="mb-2 rounded-md border-l-4 border-primary bg-blue-50 p-2.5 text-[13px] font-medium">{entry.note}</p>
            )}
            <div className="space-y-1.5">
              {entry.paths.map((path) => (
                <div
                  key={path.path_key}
                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                    path.selected ? "bg-emerald-50" : "opacity-50"
                  }`}
                >
                  <span>{path.path_label}</span>
                  <span className="font-bold tabular-nums">{fmtNum(path.path_score)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function FormulaChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{children}</span>;
}
