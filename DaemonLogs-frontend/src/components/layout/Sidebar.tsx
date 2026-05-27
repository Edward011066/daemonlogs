import { NavLink } from "react-router-dom"
import {
  Activity,
  BookOpen,
  ChartBar,
  CreditCard,
  Radio,
  Settings,
  Terminal,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { PlanBadge } from "@/components/shared/PlanBadge"

const NAV_ITEMS = [
  { to: "/dashboard",  label: "Dashboard",    icon: ChartBar },
  { to: "/how-it-works", label: "Como funciona?", icon: BookOpen },
  { to: "/monitoring", label: "Monitoramento", icon: Radio },
  { to: "/targets",    label: "Alvos",         icon: Users },
  { to: "/events",     label: "Eventos",       icon: Activity },
  { to: "/tools",      label: "Ferramentas",   icon: Terminal },
  { to: "/payments",   label: "Plano & Pagamentos", icon: CreditCard },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { data: user } = useCurrentUser()

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <span className="text-sm font-semibold tracking-wide text-foreground">
          DaemonLogs
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-border px-4 py-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-1 py-1.5 text-sm transition-colors",
                isActive ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{user.username}</p>
              <PlanBadge plan={user.plan} className="mt-0.5 text-[10px] py-0 h-4" />
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  )
}
