import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVerticals } from "@/hooks/useVerticals";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { supabase } from "@/lib/supabaseClient";
import type { ExclusiveGroup, SrsConfigRow } from "@/lib/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Admin-only editor for srs_config rows and scoring priority rules.
// Writes go straight to Supabase; RLS (see supabase/migrations/0002_rls.sql)
// enforces that only accounts with profiles.role = 'admin' can actually
// persist a change here — a viewer hitting this route (blocked by
// ProtectedRoute already) would also be rejected at the database layer.
export default function AdminConfigPage() {
  const { data: verticals } = useVerticals();
  const { data: bundle, isLoading } = useSrsConfig();
  const [verticalId, setVerticalId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const activeVerticalId = verticalId ?? verticals?.[0]?.vertical_id ?? null;
  const rows = bundle?.configRows.filter((r) => r.vertical_id === activeVerticalId) ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["srs_config_bundle"] });
  }

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Admin — Scoring Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Changes to component limit, points, or priority rules here recompute every agent's score the next time their
          dashboard loads.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <PriorityRulesSection groups={bundle?.exclusiveGroups ?? []} onError={setError} onSaved={invalidate} />

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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-border p-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Field</span>
            <span>Category</span>
            <span>Limit</span>
            <span>Points</span>
          </div>
          {rows.map((row) => (
            <RowEditor key={row.id} row={row} onError={setError} onSaved={invalidate} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------
// Priority rules: for "path_priority" groups (e.g. Review Source: Widget
// vs. Index), the first entry in `paths` is the default winner whenever
// a business hasn't started either path yet. This lets an admin change
// that default without hand-editing JSON in the database.
// -----------------------------------------------------------------------

function PriorityRulesSection({
  groups,
  onError,
  onSaved,
}: {
  groups: ExclusiveGroup[];
  onError: (message: string | null) => void;
  onSaved: () => void;
}) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const priorityGroups = groups.filter((g) => g.group_type === "path_priority" && g.paths && g.paths.length > 1);

  if (priorityGroups.length === 0) return null;

  async function makeDefault(group: ExclusiveGroup, pathKey: string) {
    if (!group.paths) return;
    const reordered = [...group.paths].sort((a, b) => (a.path_key === pathKey ? -1 : b.path_key === pathKey ? 1 : 0));
    setSavingKey(group.group_key);
    onError(null);
    const { error } = await supabase.from("exclusive_groups").update({ paths: reordered }).eq("group_key", group.group_key);
    setSavingKey(null);
    if (error) {
      onError(error.message);
      return;
    }
    onSaved();
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="font-bold">Priority Rules</p>
          <p className="text-sm text-muted-foreground">
            When a business hasn't started either option, the default path below is the one scored.
          </p>
        </div>
        {priorityGroups.map((group) => {
          const paths = group.paths ?? [];
          const defaultPath = paths[0];
          return (
            <div key={group.group_key} className="rounded-md border border-border p-3">
              <p className="mb-2 text-sm font-semibold">{group.group_label}</p>
              <div className="flex flex-wrap gap-2">
                {paths.map((path) => {
                  const isDefault = path.path_key === defaultPath.path_key;
                  return (
                    <div key={path.path_key} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
                      {isDefault ? (
                        <Badge variant="success">✓ Default</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={savingKey === group.group_key}
                          onClick={() => makeDefault(group, path.path_key)}
                        >
                          Make default
                        </Button>
                      )}
                      <span className="text-sm">{path.path_label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------
// srs_config row editor
// -----------------------------------------------------------------------

function RowEditor({
  row,
  onError,
  onSaved,
}: {
  row: SrsConfigRow;
  onError: (message: string | null) => void;
  onSaved: () => void;
}) {
  const [limit, setLimit] = useState(String(row.component_limit));
  const [points, setPoints] = useState(String(row.points));
  const [saving, setSaving] = useState(false);

  async function saveLimit() {
    const value = Number(limit);
    if (value === row.component_limit) return;
    setSaving(true);
    onError(null);
    const { error } = await supabase.from("srs_config").update({ component_limit: value }).eq("id", row.id);
    setSaving(false);
    if (error) onError(error.message);
    else onSaved();
  }

  async function savePoints() {
    const value = Number(points);
    if (value === row.points) return;
    setSaving(true);
    onError(null);
    const { error } = await supabase.from("srs_config").update({ points: value }).eq("id", row.id);
    setSaving(false);
    if (error) onError(error.message);
    else onSaved();
  }

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 border-b border-border p-3 text-sm last:border-b-0">
      <span className="font-medium">{row.sub_category_name.replace(/_/g, " ")}</span>
      <span className="text-muted-foreground">{row.category_name}</span>
      <Input value={limit} onChange={(e) => setLimit(e.target.value)} onBlur={saveLimit} />
      <div className="flex items-center gap-2">
        <Input value={points} onChange={(e) => setPoints(e.target.value)} onBlur={savePoints} />
        {saving && <span className="text-xs text-muted-foreground">saving…</span>}
      </div>
    </div>
  );
}
