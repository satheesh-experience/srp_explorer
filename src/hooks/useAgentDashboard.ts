import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { AgentCategoryCompletion, AgentScoreHistory, AgentMonthlySnapshot, Agent } from "@/lib/database.types";

// Fetches everything for one agent's dashboard, and subscribes to
// Supabase Realtime so the dashboard updates live if completions change
// (e.g. a pipeline job writes new data while the page is open).
export function useAgentDashboard(agentId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent_dashboard", agentId],
    enabled: agentId !== null,
    queryFn: async () => {
      const [agentRes, completionsRes, historyRes, snapshotRes] = await Promise.all([
        supabase.from("agents").select("*").eq("agent_id", agentId!).single(),
        supabase.from("agent_category_completions").select("*").eq("agent_id", agentId!),
        supabase.from("agent_score_history").select("*").eq("agent_id", agentId!),
        supabase.from("agent_monthly_snapshot").select("*").eq("agent_id", agentId!).maybeSingle(),
      ]);
      if (agentRes.error) throw agentRes.error;
      if (completionsRes.error) throw completionsRes.error;
      if (historyRes.error) throw historyRes.error;
      return {
        agent: agentRes.data as Agent,
        completions: (completionsRes.data ?? []) as AgentCategoryCompletion[],
        history: (historyRes.data ?? []) as AgentScoreHistory[],
        snapshot: (snapshotRes.data ?? null) as AgentMonthlySnapshot | null,
      };
    },
  });

  useEffect(() => {
    if (agentId === null) return;
    const channel = supabase
      .channel(`agent-${agentId}-completions`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_category_completions", filter: `agent_id=eq.${agentId}` },
        () => queryClient.invalidateQueries({ queryKey: ["agent_dashboard", agentId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);

  return query;
}
