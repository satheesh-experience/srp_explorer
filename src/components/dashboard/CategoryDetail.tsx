import type { UserModule, UserEntry } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";

function StatusPill({ isComplete, isStarted }: { isComplete: boolean; isStarted: boolean }) {
  if (isComplete) return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">✓ Complete</span>;
  if (isStarted) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">◐ In progress</span>;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">○ Not started</span>;
}

function EntryRow({ entry }: { entry: UserEntry }) {
  if (entry.type === "group") {
    return (
      <div className="border-b border-border py-3 last:border-b-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#111827]">{entry.group_label}</span>
          <span className="text-sm font-bold text-[#111827]">
            {fmtNum(entry.earned_score)} / {fmtNum(entry.max_score)}
          </span>
        </div>
        {entry.note && <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>}
        <div className="mt-2 space-y-1.5">
          {entry.paths.map((p) => (
            <div key={p.path_key} className="flex items-center justify-between rounded-md bg-[#f4f6fb] px-3 py-1.5 text-xs">
              <span className={p.selected ? "font-semibold text-[#111827]" : "text-muted-foreground"}>
                {p.selected ? "✓ " : ""}
                {p.path_label}
              </span>
              <span className="text-muted-foreground">
                {fmtNum(p.earned_score)} / {fmtNum(p.max_score)}
              </span>
            </div>
          ))}
        </div>
        {entry.full_marks_hint && (
          <p className="mt-2 rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">🏆 {entry.full_marks_hint}</p>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#111827]">{entry.sub_category_name}</span>
        <StatusPill isComplete={entry.is_complete} isStarted={entry.is_started} />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {fmtNum(entry.effective_units)} of {fmtNum(entry.component_limit)} · {fmtNum(entry.points)} pts each
        </span>
        <span className="font-bold text-[#111827]">
          {fmtNum(entry.earned_score)} / {fmtNum(entry.max_score)}
        </span>
      </div>
      {entry.has_regression && entry.regression_message && (
        <p className="mt-2 rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
          📉 {entry.regression_message}
        </p>
      )}
    </div>
  );
}

export function CategoryDetail({ module }: { module: UserModule }) {
  return (
    <div className="mt-5 rounded-xl border border-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#111827]">{module.category_name} — Full Breakdown</h3>
        <span className="text-sm font-bold text-[#111827]">
          {fmtNum(module.earned_score)} / {fmtNum(module.max_score)}
        </span>
      </div>
      <div>
        {module.sub_categories.map((entry) => (
          <EntryRow key={entry.type === "group" ? entry.group_key : entry.sub_category_key} entry={entry} />
        ))}
      </div>
    </div>
  );
}
