import type { UserModule } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";
import { themeFor } from "@/lib/categoryTheme";

export function CategoryRing({ module, hasAlert }: { module: UserModule; hasAlert: boolean }) {
  const theme = themeFor(module.category_key);
  const Icon = theme.icon;
  const percent = module.max_score > 0 ? Math.round((module.earned_score / module.max_score) * 100) : 0;
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="w-20 text-center">
      <div className="relative mx-auto mb-1.5 h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={theme.accent}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={18} style={{ color: theme.accent }} />
        </div>
        {hasAlert && (
          <div
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white"
            style={{ background: "#f97316" }}
            aria-label="Below personal best"
          />
        )}
      </div>
      <div className="text-sm font-extrabold text-[#111827]">{percent}%</div>
      <div className="text-[10px] font-semibold text-muted-foreground">
        {fmtNum(module.earned_score)}/{fmtNum(module.max_score)}
      </div>
      <div className="text-[10.5px] leading-tight text-muted-foreground">{module.category_name}</div>
    </div>
  );
}
