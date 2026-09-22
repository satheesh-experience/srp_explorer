import { useCallback, useMemo, useState } from "react";
import { useAgents } from "@/hooks/useAgents";
import { useAgentDashboard } from "@/hooks/useAgentDashboard";
import { useSrsConfig } from "@/hooks/useSrsConfig";
import { useVerticals } from "@/hooks/useVerticals";
import { buildEffectiveGroups, buildAgentDashboard, fmtNum } from "@/lib/scoring";
import { generateAgentName } from "@/lib/agentName";
import { orderModules } from "@/lib/categoryTheme";
import { findBiggestOpportunity } from "@/lib/proTip";
import { PromoBanner } from "@/components/dashboard/PromoBanner";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RegressionAlertBanner } from "@/components/dashboard/RegressionAlertBanner";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { ScoreOverviewBar } from "@/components/dashboard/ScoreOverviewBar";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { CategoryDetail } from "@/components/dashboard/CategoryDetail";
import { ProgressSnapshotCard } from "@/components/dashboard/ProgressSnapshotCard";

export default function DashboardPage() {
  const { data: agents, isLoading: loadingAgents } = useAgents();
  const { data: verticals } = useVerticals();
  const { data: bundle, isLoading: loadingConfig } = useSrsConfig();
  const [agentId, setAgentId] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);

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

  const handleChangeAgent = useCallback((id: number) => {
    setAgentId(id);
    setActiveModule(null);
  }, []);

  const handleJumpToReviews = useCallback(() => setActiveModule("reviews_replies"), []);

  const orderedModules = useMemo(() => (dashboard ? orderModules(dashboard.modules) : []), [dashboard]);
  const opportunity = useMemo(() => (dashboard ? findBiggestOpportunity(orderedModules) : null), [dashboard, orderedModules]);
  const activeModuleData = orderedModules.find((m) => m.category_key === activeModule) ?? null;

  if (loadingAgents || loadingConfig) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <PromoBanner />
      <DashboardTopBar agents={agentOptions} agentId={activeAgentId} agentName={agentName} onChangeAgent={handleChangeAgent} />

      <div className="flex">
        <DashboardSidebar />

        <main className="min-w-0 flex-1 p-6">
          {loadingAgentData && <div className="text-sm text-muted-foreground">Loading agent…</div>}

          {dashboard && (
            <>
              <RegressionAlertBanner alerts={dashboard.regression_alerts} onSelectCategory={setActiveModule} />

              <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                <div>
                  <div className="rounded-xl border border-border bg-white p-6">
                    <ScoreGauge score={dashboard.overall_earned} max={dashboard.overall_max} />
                    <button
                      type="button"
                      onClick={handleJumpToReviews}
                      className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      Jump to Reviews &amp; Replies
                    </button>
                  </div>
                  <ProgressSnapshotCard modules={orderedModules} />
                </div>

                <div className="min-w-0">
                  <div className="rounded-xl border border-border bg-white p-6">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-lg font-bold text-[#111827]">Search Rank Score Overview</h2>
                      <span className="text-sm">
                        <span className="text-xl font-extrabold text-indigo-600">{fmtNum(dashboard.overall_earned)}</span>
                        <span className="text-muted-foreground"> of {fmtNum(dashboard.overall_max)} Possible</span>
                      </span>
                    </div>
                    <ScoreOverviewBar modules={orderedModules} />
                    {opportunity && (
                      <div className="mt-4 rounded-lg bg-[#f4f6fb] p-4 text-sm text-[#111827]">
                        <strong>Pro Tip:</strong> Earn up to {fmtNum(opportunity.missing)} points towards your Search
                        Rank Score by completing <strong>{opportunity.label}</strong> in {opportunity.categoryName}.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {orderedModules.map((m) => (
                      <CategoryCard
                        key={m.category_key}
                        module={m}
                        isActive={activeModule === m.category_key}
                        onOpen={() => setActiveModule((cur) => (cur === m.category_key ? null : m.category_key))}
                      />
                    ))}
                  </div>

                  {activeModuleData && <CategoryDetail key={activeModuleData.category_key} module={activeModuleData} />}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
