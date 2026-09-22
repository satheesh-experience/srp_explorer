import type { UserModule } from "@/lib/scoring";
import { themeFor } from "@/lib/categoryTheme";

export function ScoreOverviewBar({ modules }: { modules: UserModule[] }) {
  const total = modules.reduce((s, m) => s + m.max_score, 0) || 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {modules.map((m) => {
          const theme = themeFor(m.category_key);
          const width = (m.max_score / total) * 100;
          return <div key={m.category_key} style={{ width: `${width}%`, background: theme.accent }} />;
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {modules.map((m) => {
          const theme = themeFor(m.category_key);
          return (
            <span key={m.category_key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} />
              {m.category_name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
