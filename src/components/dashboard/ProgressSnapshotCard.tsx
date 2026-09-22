export function ProgressSnapshotCard({
  modules,
}: {
  modules: { completed_slots: number; total_slots: number; is_complete: boolean }[];
}) {
  const totalCompleted = modules.reduce((s, m) => s + m.completed_slots, 0);
  const totalSlots = modules.reduce((s, m) => s + m.total_slots, 0);
  const fullyComplete = modules.filter((m) => m.is_complete).length;
  const percent = totalSlots > 0 ? (totalCompleted / totalSlots) * 100 : 0;

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-5 text-center">
      <div className="text-sm font-semibold text-muted-foreground">Your Progress Snapshot</div>
      <div className="mt-2 text-3xl font-extrabold text-[#111827]">
        {totalCompleted} <span className="text-lg font-semibold text-muted-foreground">/ {totalSlots}</span>
      </div>
      <div className="text-sm text-muted-foreground">components complete</div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {fullyComplete} of {modules.length} categories fully complete
      </div>
    </div>
  );
}
