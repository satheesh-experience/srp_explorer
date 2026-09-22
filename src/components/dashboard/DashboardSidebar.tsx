import {
  Play,
  Home,
  Search,
  Sparkles,
  MessageCircle,
  BarChart3,
  Link2,
  User,
  GraduationCap,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

const COMMAND_CENTER: { label: string; icon: LucideIcon; badge?: string }[] = [
  { label: "Search Ranking", icon: Search },
  { label: "AI Visibility", icon: Sparkles },
  { label: "Social Posts", icon: MessageCircle, badge: "PRO" },
  { label: "Insights", icon: BarChart3 },
  { label: "Network", icon: Link2 },
];

const ACCOUNT_CENTER: { label: string; icon: LucideIcon }[] = [
  { label: "Profile", icon: User },
  { label: "Connections", icon: Link2 },
  { label: "Learning Hub", icon: GraduationCap },
  { label: "Settings", icon: Settings },
  { label: "Billing", icon: CreditCard },
];

export function DashboardSidebar() {
  return (
    <aside className="flex w-64 flex-shrink-0 flex-col gap-1 bg-[#0d1226] px-3 py-4">
      <button
        type="button"
        disabled
        className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white"
      >
        <Play size={14} fill="currentColor" /> Play Game
      </button>

      <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white">
        <Home size={16} /> Home
      </div>

      <div className="mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Command Center</div>
      {COMMAND_CENTER.map(({ label, icon: Icon, badge }) => (
        <div key={label} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60">
          <Icon size={16} />
          {label}
          {badge && (
            <span className="ml-auto rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
          )}
        </div>
      ))}

      <div className="mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Account Center</div>
      {ACCOUNT_CENTER.map(({ label, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60">
          <Icon size={16} />
          {label}
        </div>
      ))}

      <p className="mt-6 px-3 text-[11px] leading-relaxed text-white/35">
        These nav items mirror the real product's chrome for visual reference only — this dashboard implements the
        Search Rank Score experience itself.
      </p>
    </aside>
  );
}
