import { useMemo, useState } from "react";
import { useAgents } from "@/hooks/useAgents";
import { useAgentDashboard } from "@/hooks/useAgentDashboard";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { useVerticals } from "@/hooks/useVerticals";
import { buildEffectiveGroups, buildAgentDashboard, fmtNum } from "@/lib/scoring";
import { generateAgentName } from "@/lib/agentName";
import { orderModules } from "@/lib/categoryTheme";
import { findBiggestOpportunity } from "@/lib/proTip";
import { buildMonthlyEmailSummary } from "@/lib/monthlyEmail";
import { CategoryRing } from "@/components/email/CategoryRing";
import { EmailAlertsDigest } from "@/components/email/EmailAlertsDigest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MonthlyEmailPage() {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: verticals } = useVerticals();
  const { data: bundle, isLoading: loadingConfig } = useSrsConfig();
  const [agentId, setAgentId] = useState<number | null>(null);

  const activeAgentId = agentId ?? agents?.[0]?.agent_id ?? null;
  const { data: agentData, isLoading: loadingAgentData } = useAgentDashboard(activeAgentId);

  const verticalNameById = useMemo(() => {
    const map = new Map<number, string>();
    verticals?.forEach((v) => map.set(v.vertical_id, v.vertical_name));
    return map;
  }, [verticals]);

  const agentOptions = useMemo(
    () =>
      (agents ?? []).map((a) => ({
        agent_id: a.agent_id,
        label: generateAgentName(a.agent_id, verticalNameById.get(a.vertical_id)),
      })),
    [agents, verticalNameById]
  );

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

  const agentName = activeAgentId !== null ? generateAgentName(activeAgentId, dashboard?.vertical_name) : "";
  const orderedModules = useMemo(() => (dashboard ? orderModules(dashboard.modules) : []), [dashboard]);
  const opportunity = useMemo(() => (dashboard ? findBiggestOpportunity(orderedModules) : null), [dashboard, orderedModules]);
  const summary = useMemo(
    () => (dashboard ? buildMonthlyEmailSummary(dashboard, agentName, agentData?.snapshot ?? null) : null),
    [dashboard, agentName, agentData]
  );
  const alertCategoryKeys = useMemo(
    () => new Set((dashboard?.regression_alerts ?? []).map((a) => a.category_key)),
    [dashboard]
  );

  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstLine = agentName.split(" - ")[0];

  if (loadingAgents || loadingConfig) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#111827]">Monthly Score Update — Email Preview</h1>
        <p className="mt-2 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm text-[#1e3a8a]">
          A mockup of an automated monthly email. Sending isn't wired up yet — this previews the content and layout a
          version of it could have. Pick a sample business below.
        </p>
      </div>

      {agentOptions.length > 1 && (
        <Select value={String(activeAgentId ?? "")} onValueChange={(v) => setAgentId(Number(v))}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {agentOptions.map((a) => (
              <SelectItem key={a.agent_id} value={String(a.agent_id)}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {loadingAgentData && <div className="text-sm text-muted-foreground">Loading…</div>}

      {dashboard && summary && (
        <div className="space-y-5 rounded-2xl border border-[#e0d9fa] bg-[#f3f0ff] p-7">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 p-7 text-white">
            <div className="mb-4 text-xl font-extrabold">
              e<span className="text-amber-300">X</span>perience.com
            </div>
            <p className="text-base font-bold">Hi {firstLine},</p>
            <p className="mt-1 text-sm text-white/90">
              Here's your Search Rank Score snapshot for <strong>{monthLabel}</strong>.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-extrabold text-indigo-900">{fmtNum(summary.current_score)}</span>
              <span className="text-lg font-bold text-indigo-400">/ {fmtNum(summary.overall_max)}</span>
            </div>
            {summary.previous_month_score !== null ? (
              <span
                className={`mt-2 inline-block rounded-full px-3.5 py-1 text-sm font-bold ${
                  summary.trend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : summary.trend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-muted-foreground"
                }`}
              >
                {summary.trend === "up" ? "↑" : summary.trend === "down" ? "↓" : "→"}{" "}
                {fmtNum(Math.abs(summary.score_delta ?? 0))} pts vs {summary.previous_month_label ?? "last month"}
              </span>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                This is your first tracked month — check back next month for a comparison.
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 rounded-2xl bg-white p-5">
            {orderedModules.map((m) => (
              <CategoryRing key={m.category_key} module={m} hasAlert={alertCategoryKeys.has(m.category_key)} />
            ))}
          </div>

          {opportunity && (
            <div className="flex items-start gap-3 rounded-xl border border-[#ddd6fe] bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
              <span className="text-xl">🎯</span>
              <div>
                <div className="font-bold text-[#111827]">This month's focus</div>
                <div className="text-sm text-muted-foreground">
                  Completing <strong>{opportunity.label}</strong> in {opportunity.categoryName} would earn up to{" "}
                  <strong>{fmtNum(opportunity.missing)} more points</strong> — the single biggest opportunity on your
                  account right now.
                </div>
              </div>
            </div>
          )}

          <EmailAlertsDigest alerts={dashboard.regression_alerts} />

          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-teal-500 py-3.5 text-sm font-bold text-white"
          >
            View My Full Dashboard →
          </button>

          <p className="text-center text-xs text-muted-foreground">
            You're receiving this because monthly score updates are enabled for your account. This is a design
            preview only — sending isn't implemented yet.
          </p>
        </div>
      )}
    </div>
  );
}
