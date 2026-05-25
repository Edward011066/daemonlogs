import { useState } from "react"
import { Trash2, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { CopyButton } from "@/components/shared/CopyButton"
import { useDeleteTarget } from "@/hooks/useTargets"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import type { Target } from "@/types"

interface TargetCardProps {
  target: Target
}

export function TargetCard({ target }: TargetCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTarget = useDeleteTarget()

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
      <CardContent className="flex items-center gap-4 p-4">
        {target.avatar_url ? (
          <img
            src={target.avatar_url}
            alt={target.display_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{target.display_name}</p>
          <div className="flex items-center gap-1">
            <p className="font-code text-[11px] text-muted-foreground">{target.discord_user_id}</p>
            <CopyButton value={target.discord_user_id} />
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
