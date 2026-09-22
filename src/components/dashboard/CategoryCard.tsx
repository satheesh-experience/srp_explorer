import { ChevronRight } from "lucide-react";
import type { UserModule } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";
import { themeFor } from "@/lib/categoryTheme";

export function CategoryCard({ module, onOpen, isActive }: { module: UserModule; onOpen: () => void; isActive: boolean }) {
  const theme = themeFor(module.category_key);
  const Icon = theme.icon;
  const percent = module.max_score > 0 ? Math.min(100, (module.earned_score / module.max_score) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex flex-col rounded-xl border-l-4 bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
        isActive ? "ring-2 ring-indigo-300" : ""
      }`}
      style={{ borderLeftColor: theme.accent }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: theme.bg }}>
          <Icon size={18} style={{ color: theme.accent }} />
        </div>
        <div className="flex items-center gap-2">
          {module.regression_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              📉 {module.regression_count}
            </span>
          )}
          {module.is_complete && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Complete</span>
          )}
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
      </div>
      <div className="font-bold text-[#111827]">{module.category_name}</div>
      <div className="text-sm text-muted-foreground">
        {fmtNum(module.earned_score)} of {fmtNum(module.max_score)} points
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: theme.accent }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {module.is_complete ? "All components complete" : `${module.completed_slots} of ${module.total_slots} components complete`}
      </div>
    </button>
  );
}
