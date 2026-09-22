import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Explorer" },
  { to: "/dashboard", label: "Agent Dashboard" },
];

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-[#10162a] px-6 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 font-extrabold">
            S
          </div>
          <span className="font-bold tracking-tight">
            SRS<span className="text-blue-400">.</span>Explorer
          </span>
          <nav className="ml-6 hidden gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white",
                    isActive && "bg-white/15 text-white"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white",
                    isActive && "bg-white/15 text-white"
                  )
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isAdmin ? "warning" : "secondary"} className="capitalize">
            {profile?.role ?? "…"}
          </Badge>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
