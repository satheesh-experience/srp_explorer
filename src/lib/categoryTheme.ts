import { MessageSquare, BarChart3, User, Link2, Package, type LucideIcon } from "lucide-react";

export const CATEGORY_ORDER = ["reviews_replies", "web_analytics", "profile_completion", "connections", "listings"];

type CategoryTheme = { accent: string; bg: string; icon: LucideIcon };

const CATEGORY_THEME: Record<string, CategoryTheme> = {
  reviews_replies: { accent: "#22c55e", bg: "#eafbea", icon: MessageSquare },
  web_analytics: { accent: "#2f5de0", bg: "#e8edfd", icon: BarChart3 },
  profile_completion: { accent: "#9333ea", bg: "#f3e8ff", icon: User },
  connections: { accent: "#14b8a6", bg: "#e3f8f5", icon: Link2 },
  listings: { accent: "#f97316", bg: "#fff1e6", icon: Package },
};

export function themeFor(categoryKey: string): CategoryTheme {
  return CATEGORY_THEME[categoryKey] ?? { accent: "#5b6472", bg: "#f4f6fb", icon: Package };
}

export function orderModules<T extends { category_key: string }>(modules: T[]): T[] {
  return [...modules].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category_key);
    const bi = CATEGORY_ORDER.indexOf(b.category_key);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.category_key.localeCompare(b.category_key);
  });
}
