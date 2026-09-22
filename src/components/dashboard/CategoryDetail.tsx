import { useState } from "react";
import type { UserModule, UserEntry, UserGroupEntry, ScoredRow } from "@/lib/scoring";
import { fmtNum } from "@/lib/scoring";
import { groupHasDecidedOutcome } from "@/lib/groupState";
import { getFieldDefinition } from "@/lib/fieldDefinitions";

function isEntryIncomplete(entry: UserEntry): boolean {
  return entry.type === "group" ? entry.earned_score < entry.max_score : !entry.is_complete;
}

function StatusPill({ isComplete, isStarted }: { isComplete: boolean; isStarted: boolean }) {
  if (isComplete) return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">✓ Complete</span>;
  if (isStarted) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">◐ In progress</span>;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">○ Not started</span>;
}

// Mirrors pathTag()/pathStateClass() from the original prototype: once a
// group's outcome is decided (enough paths have real progress to account
// for its cap), an untouched alternative reads "Not needed" rather than
// "Not started" -- and a path that *was* completed but excluded by the
// cap keeps its own distinct "Connected — cap reached" state.
function pathTag(path: { selected: boolean; over_cap: boolean }, group: UserGroupEntry) {
  if (path.selected) return { text: "✓ Counted toward score", cls: "bg-emerald-100 text-emerald-700" };
  if (path.over_cap) return { text: "✓ Connected — cap reached", cls: "bg-amber-100 text-amber-800" };
  if (groupHasDecidedOutcome(group.cap, group.paths)) return { text: "Not needed", cls: "border border-dashed border-border text-muted-foreground" };
  return { text: "○ Not started", cls: "border border-border bg-muted text-muted-foreground" };
}

function FieldDefinitionToggle({ row, categoryKey }: { row: ScoredRow; categoryKey: string }) {
  const [expanded, setExpanded] = useState(false);
  if (row.is_complete || categoryKey !== "web_analytics") return null;
  const definition = getFieldDefinition(row.sub_category_key);
  if (!definition) return null;

  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[11px] font-bold text-muted-foreground underline underline-offset-2 hover:text-indigo-600">
        {expanded ? "▾ Hide definition" : "▸ View definition"}
      </button>
      {expanded && (
        <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line rounded-md border border-border bg-[#f4f6fb] p-3 text-xs leading-relaxed text-muted-foreground">
          {definition}
        </div>
      )}
    </div>
  );
}

function FieldRow({ row, categoryKey }: { row: ScoredRow; categoryKey: string }) {
  const missing = row.max_score - row.earned_score;
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#111827]">{row.sub_category_name}</span>
        <StatusPill isComplete={row.is_complete} isStarted={row.is_started} />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {fmtNum(row.effective_units)} of {fmtNum(row.component_limit)} · {fmtNum(row.points)} pts each
        </span>
        <span className="font-bold text-[#111827]">
          {fmtNum(row.earned_score)} / {fmtNum(row.max_score)}
        </span>
      </div>
      {row.has_time_window && (
        <p className="mt-1.5 text-xs font-semibold text-amber-700">ℹ Reviews from the last {row.no_of_days} days are considered</p>
      )}
      {row.has_rating_scale_hint && row.rating_scale && (
        <p className="mt-1.5 text-xs font-semibold text-amber-700">⭐ Each star in ratings carries {fmtNum(row.points / row.rating_scale)} points</p>
      )}
      {!row.is_complete && missing > 0 && !row.has_regression && (
        <p className="mt-1.5 text-xs font-semibold text-indigo-600">
          💡 Complete this fully to earn {fmtNum(missing)} more point{missing === 1 ? "" : "s"}.
        </p>
      )}
      {row.has_regression && row.regression_message && (
        <p className="mt-2 rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
          📉 {row.regression_message}
        </p>
      )}
      <FieldDefinitionToggle row={row} categoryKey={categoryKey} />
    </div>
  );
}

function GroupRow({ group }: { group: UserGroupEntry }) {
  const cap = group.cap ?? 1;
  const isCapped = group.selection_kind === "capped";

  return (
    <div className={`border-b border-border py-3 last:border-b-0`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-[#111827]">{group.group_label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isCapped ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {cap === 1 ? "Only one option counts" : `Best ${cap} of ${group.paths.length} count`}
        </span>
        <span className="ml-auto text-sm font-bold text-[#111827]">
          {fmtNum(group.earned_score)} / {fmtNum(group.max_score)}
        </span>
      </div>
      {group.note && <p className="mt-1 text-xs text-muted-foreground">{group.note}</p>}

      <div className="mt-2 space-y-1.5">
        {group.paths.map((p) => {
          const tag = pathTag(p, group);
          return (
            <div key={p.path_key} className={`rounded-md px-3 py-1.5 text-xs ${p.selected ? "bg-emerald-50" : isCapped ? "bg-white border border-indigo-100" : "bg-[#f4f6fb]"}`}>
              <div className="flex items-center justify-between">
                <span className={p.selected ? "font-semibold text-[#111827]" : "text-muted-foreground"}>
                  {p.selected ? "✓ " : ""}
                  {p.path_label}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tag.cls}`}>{tag.text}</span>
              </div>
              <div className="mt-1 text-right text-muted-foreground">
                {fmtNum(p.earned_score)} / {fmtNum(p.max_score)}
              </div>
            </div>
          );
        })}
      </div>

      {cap > 1 && (
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
          {group.paths.filter((p) => p.selected).length} of {group.paths.length} counted toward your score (capped at {cap}).
        </p>
      )}

      {group.full_marks_hint && (
        <p className="mt-2 rounded-md bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">🏆 {group.full_marks_hint}</p>
      )}
    </div>
  );
}

export function CategoryDetail({ module }: { module: UserModule }) {
  const [filterMode, setFilterMode] = useState<"all" | "incomplete">("all");
  const incompleteCount = module.sub_categories.filter(isEntryIncomplete).length;
  const visibleEntries = filterMode === "incomplete" ? module.sub_categories.filter(isEntryIncomplete) : module.sub_categories;

  return (
    <div className="mt-5 rounded-xl border border-border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#111827]">{module.category_name} — Full Breakdown</h3>
        <span className="text-sm font-bold text-[#111827]">
          {fmtNum(module.earned_score)} / {fmtNum(module.max_score)}
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            filterMode === "all" ? "bg-indigo-600 text-white" : "border border-border text-muted-foreground hover:border-indigo-400"
          }`}
        >
          All Fields ({module.sub_categories.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("incomplete")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            filterMode === "incomplete" ? "bg-indigo-600 text-white" : "border border-border text-muted-foreground hover:border-indigo-400"
          }`}
        >
          Not Completed ({incompleteCount})
        </button>
      </div>

      {visibleEntries.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">Nothing left incomplete here — every field is fully scored. 🎉</p>
      )}

      <div>
        {visibleEntries.map((entry) =>
          entry.type === "group" ? (
            <GroupRow key={entry.group_key} group={entry} />
          ) : (
            <FieldRow key={entry.sub_category_key} row={entry} categoryKey={module.category_key} />
          )
        )}
      </div>
    </div>
  );
}
