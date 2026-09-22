import type { RegressionAlert } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";

export function EmailAlertsDigest({ alerts }: { alerts: RegressionAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <span className="text-xl">✅</span>
        <div>
          <div className="font-bold text-[#111827]">Nothing below your best this month</div>
          <div className="text-sm text-muted-foreground">
            Every field is holding at or above its personal best. Keep it up!
          </div>
        </div>
      </div>
    );
  }

  const totalGap = Math.round(alerts.reduce((s, a) => s + a.points_below_peak, 0) * 10000) / 10000;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <span className="text-xl">📉</span>
        <div>
          <div className="font-bold text-[#111827]">Personal Best Alerts</div>
          <div className="text-sm text-muted-foreground">
            {alerts.length} field{alerts.length === 1 ? "" : "s"} dropped below a previous high — up to{" "}
            <strong>{fmtNum(totalGap)} points</strong> recoverable.
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {alerts.map((a) => (
          <div key={`${a.category_key}-${a.sub_category_key}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              {a.category_name}
            </span>
            <span className="flex-1 text-sm font-semibold text-[#111827]">{a.sub_category_name}</span>
            <span className="text-sm font-bold text-orange-700">
              {fmtNum(a.current_score)} ← {fmtNum(a.peak_score)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
