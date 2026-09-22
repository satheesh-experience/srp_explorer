import type { AgentDashboard } from "./scoring";
import type { AgentMonthlySnapshot } from "./database.types";

export type MonthlyEmailSummary = {
  agent_name: string;
  vertical_name: string;
  current_score: number;
  overall_max: number;
  previous_month_score: number | null;
  previous_month_label: string | null;
  score_delta: number | null;
  score_delta_percent: number | null;
  trend: "up" | "down" | "flat";
  regression_count: number;
};

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

// Builds on top of the already-computed AgentDashboard (never recomputes
// the score separately, so the email can't say something the dashboard
// itself doesn't already show) and adds the one extra thing it needs: a
// month-over-month comparison against agent_monthly_snapshot.
export function buildMonthlyEmailSummary(
  dashboard: AgentDashboard,
  agentName: string,
  snapshot: AgentMonthlySnapshot | null
): MonthlyEmailSummary {
  const previousScore = snapshot?.previous_month_score ?? null;
  const previousLabel = snapshot?.month_label ?? null;

  let scoreDelta: number | null = null;
  let scoreDeltaPercent: number | null = null;
  let trend: "up" | "down" | "flat" = "flat";

  if (previousScore !== null) {
    scoreDelta = round4(dashboard.overall_earned - previousScore);
    if (previousScore > 0) scoreDeltaPercent = Math.round((scoreDelta / previousScore) * 1000) / 10;
    trend = scoreDelta > 0 ? "up" : scoreDelta < 0 ? "down" : "flat";
  }

  return {
    agent_name: agentName,
    vertical_name: dashboard.vertical_name,
    current_score: dashboard.overall_earned,
    overall_max: dashboard.overall_max,
    previous_month_score: previousScore,
    previous_month_label: previousLabel,
    score_delta: scoreDelta,
    score_delta_percent: scoreDeltaPercent,
    trend,
    regression_count: dashboard.regression_alerts.length,
  };
}
