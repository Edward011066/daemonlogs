import { ChevronRight, User } from "lucide-react"
import type { Target } from "@/types"

interface TargetCardProps {
  target: Target
  onClick?: () => void
}

function formatAddedAt(date: string) {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMin = Math.max(1, Math.floor(diffMs / 60_000))
  if (diffMin < 60) return `${diffMin}min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return new Date(date).toLocaleDateString("pt-BR")
}

export function TargetCard({ target, onClick }: TargetCardProps) {
  const label = target.username_global ?? target.username ?? target.discord_user_id

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b border-border bg-surface px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{target.discord_user_id}</p>
      </div>
      <span
        className="shrink-0 text-[11px] text-muted-foreground"
        title={new Date(target.created_at).toLocaleString("pt-BR")}
      >
        {formatAddedAt(target.created_at)}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
