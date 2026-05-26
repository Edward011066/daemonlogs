import { useState } from "react"
import { Clock3, Hash, Trash2, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { CopyButton } from "@/components/shared/CopyButton"
import { useDeleteTarget } from "@/hooks/useTargets"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import type { Target } from "@/types"

interface TargetCardProps {
  target: Target
}

function formatAddedAt(date: string) {
  const then = new Date(date).getTime()
  const diffMs = Date.now() - then
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000))

  if (diffMinutes < 60) return `adicionado há ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `adicionado há ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `adicionado há ${diffDays} d`

  return `adicionado em ${new Date(date).toLocaleDateString("pt-BR")}`
}

export function TargetCard({ target }: TargetCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTarget = useDeleteTarget()
  const title = target.username_global ?? target.username ?? target.discord_user_id

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteTarget.mutateAsync(target.id)
      toast.success("Alvo removido.")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <Card className="bg-surface">
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            {target.username_global && target.username_global !== target.username && (
              <Badge variant="outline" className="border-accent/20 bg-accent/5 text-[10px] text-accent">
                global
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="truncate">
              username: <span className="font-medium text-foreground/90">{target.username}</span>
            </span>
            <span className="truncate">
              global: <span className="font-medium text-foreground/90">{target.username_global ?? "-"}</span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{target.discord_user_id}</span>
            </div>
            <CopyButton value={target.discord_user_id} />

            <div
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
              title={new Date(target.created_at).toLocaleString("pt-BR")}
            >
              <Clock3 className="h-3 w-3" />
              <span>{formatAddedAt(target.created_at)}</span>
            </div>
          </div>
        </div>

        <AsyncButton
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${confirmDelete ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
          loading={deleteTarget.isPending}
          onClick={handleDelete}
          title={confirmDelete ? "Clique novamente para confirmar" : "Remover alvo"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </AsyncButton>
      </CardContent>
    </Card>
  )
}
