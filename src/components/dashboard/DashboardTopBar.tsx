import { Menu, Search, Bell } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AgentOption = { agent_id: number; label: string };

export function DashboardTopBar({
  agents,
  agentId,
  agentName,
  onChangeAgent,
}: {
  agents: AgentOption[];
  agentId: number | null;
  agentName: string;
  onChangeAgent: (id: number) => void;
}) {
  const initials =
    agentName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <button type="button" disabled aria-label="Menu" className="text-muted-foreground">
          <Menu size={20} />
        </button>
        <span className="text-lg font-bold text-[#111827]">Dashboard</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled aria-label="Search" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
          <Search size={18} />
        </button>
        <button
          type="button"
          disabled
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground"
        >
          Help
        </button>
        <button type="button" disabled aria-label="Notifications" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
          <Bell size={18} />
        </button>

        <div className="h-6 w-px bg-border" />

        {agents.length > 1 && (
          <Select value={String(agentId ?? "")} onValueChange={(v) => onChangeAgent(Number(v))}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agents.map((a) => (
                <SelectItem key={a.agent_id} value={String(a.agent_id)}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="text-xs leading-tight">
            <div className="text-muted-foreground">Viewing as</div>
            <div className="font-semibold text-[#111827]">{agentName || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
