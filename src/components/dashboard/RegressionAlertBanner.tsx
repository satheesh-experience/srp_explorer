import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingDown } from "lucide-react";
import type { RegressionAlert } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";

export function RegressionAlertBanner({
  alerts,
  onSelectCategory,
}: {
  alerts: RegressionAlert[];
  onSelectCategory: (categoryKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (alerts.length === 0) return null;

  const total = alerts.reduce((s, a) => s + a.points_below_peak, 0);

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-start gap-3 px-5 py-4 text-left">
        <TrendingDown className="mt-0.5 flex-shrink-0 text-amber-700" size={22} />
        <div className="flex-1">
          <div className="font-bold text-amber-900">
            {alerts.length} field{alerts.length === 1 ? "" : "s"} dropped below your personal best
          </div>
          <div className="mt-0.5 text-sm text-amber-800">
            Up to <strong>{fmtNum(total)}</strong> points are within reach — these used to score higher, so getting
            back there is proven, not a stretch.
          </div>
        </div>
        {expanded ? <ChevronUp className="flex-shrink-0 text-amber-700" size={18} /> : <ChevronDown className="flex-shrink-0 text-amber-700" size={18} />}
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-2 border-t border-amber-200 px-5 py-3">
          {alerts.map((a) => (
            <button
              key={`${a.category_key}-${a.sub_category_key}`}
              type="button"
              onClick={() => onSelectCategory(a.category_key)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-left transition hover:border-amber-500"
            >
              <div className="text-xs font-bold text-[#111827]">{a.sub_category_name}</div>
              <div className="text-[11px] text-muted-foreground">{a.category_name}</div>
              <div className="text-xs font-bold text-orange-700">
                {fmtNum(a.current_score)} ← {fmtNum(a.peak_score)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
