import { useMemo, useState } from "react";
import { useAgents } from "@/hooks/useAgents";
import { useAgentDashboard } from "@/hooks/useAgentDashboard";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { useVerticals } from "@/hooks/useVerticals";
import { buildEffectiveGroups, buildAgentDashboard, MODULE_ICONS, fmtNum } from "@/lib/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: verticals } = useVerticals();
  const { data: bundle, isLoading: loadingConfig } = useSrsConfig();
  const [agentId, setAgentId] = useState<number | null>(null);

  const activeAgentId = agentId ?? agents?.[0]?.agent_id ?? null;
  const { data: agentData, isLoading: loadingAgentData } = useAgentDashboard(activeAgentId);

  const dashboard = useMemo(() => {
    if (!agentData || !bundle || !verticals) return null;
    const vertical = verticals.find((v) => v.vertical_id === agentData.agent.vertical_id);
    if (!vertical) return null;
    const groups = buildEffectiveGroups(bundle.exclusiveGroups, bundle.connectionCaps);
    return buildAgentDashboard(
      agentData.agent.agent_id,
      agentData.agent.vertical_id,
      vertical.vertical_name,
      bundle.configRows,
      agentData.completions,
      agentData.history,
      groups
    );
  }, [agentData, bundle, verticals]);

  if (loadingAgents || loadingConfig) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Agent</label>
          <Select value={String(activeAgentId ?? "")} onValueChange={(v) => setAgentId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents?.map((a) => (
                <SelectItem key={a.agent_id} value={String(a.agent_id)}>
                  Agent #{a.agent_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Live scores update automatically if completions change.</p>
        </CardContent>
      </Card>

      {loadingAgentData && <div className="text-sm text-muted-foreground">Loading agent…</div>}

      {dashboard && (
        <>
          <Card className="bg-gradient-to-br from-[#10162a] to-[#262f52] text-white">
            <CardContent className="p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-white/60">{dashboard.vertical_name}</p>
              <div className="flex items-end gap-3">
                <h2 className="text-4xl font-extrabold">{fmtNum(dashboard.overall_earned)}</h2>
                <span className="pb-1 text-white/60">/ {fmtNum(dashboard.overall_max)}</span>
                <Badge className="ml-auto" variant={dashboard.overall_percent >= 80 ? "success" : "warning"}>
                  {dashboard.overall_percent}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {dashboard.regression_alerts.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-bold text-amber-900">
                  {dashboard.regression_alerts.length} field(s) dropped below their personal best
                </p>
                {dashboard.regression_alerts.slice(0, 5).map((alert) => (
                  <p key={alert.sub_category_key} className="text-sm text-amber-900/90">
                    <span className="font-semibold">{alert.sub_category_name}</span> ({alert.category_name}): {alert.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.modules.map((mod) => (
              <Card key={mod.category_key}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xl">{MODULE_ICONS[mod.category_key] ?? "•"}</span>
                    <p className="font-bold">{mod.category_name}</p>
                    {mod.regression_count > 0 && <Badge variant="warning">{mod.regression_count} regressed</Badge>}
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, mod.percent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {fmtNum(mod.earned_score)} / {fmtNum(mod.max_score)} pts
                    </span>
                    <span>
                      {mod.completed_slots}/{mod.total_slots} complete
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
