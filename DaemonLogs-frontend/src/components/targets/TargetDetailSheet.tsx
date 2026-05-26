import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { CopyButton } from "@/components/shared/CopyButton"
import { Activity, Trash2, User } from "lucide-react"
import { useDeleteTarget } from "@/hooks/useTargets"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import type { Target } from "@/types"

interface TargetDetailSheetProps {
  target: Target | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function InfoRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-xs text-foreground/80">{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  )
}

export function TargetDetailSheet({ target, open, onOpenChange }: TargetDetailSheetProps) {
  const navigate = useNavigate()
  const deleteTarget = useDeleteTarget()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!target) return null

  const label = target.username_global ?? target.username ?? target.discord_user_id

  const handleViewEvents = () => {
    onOpenChange(false)
    navigate(`/events?targetId=${target.discord_user_id}`)
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await deleteTarget.mutateAsync(target.id)
      toast.success("Alvo removido.")
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setConfirmDelete(false)
        onOpenChange(v)
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border bg-surface p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm font-semibold text-foreground">
                {label}
              </SheetTitle>
              <p className="font-mono text-[11px] text-muted-foreground">
                {target.discord_user_id}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-6 py-5">
            {/* Identity */}
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Identidade
              </p>
              <InfoRow label="Username" value={target.username} />
              {target.username_global && (
                <InfoRow label="Global" value={target.username_global} />
              )}
              <InfoRow label="Discord ID" value={target.discord_user_id} copy />
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Histórico
              </p>
              <InfoRow label="Adicionado em" value={formatDate(target.created_at)} />
              {target.updated_at && target.updated_at !== target.created_at && (
                <InfoRow label="Atualizado em" value={formatDate(target.updated_at)} />
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2 text-sm"
                onClick={handleViewEvents}
              >
                <Activity className="h-4 w-4" />
                Ver eventos deste alvo
              </Button>

              <AsyncButton
                variant="outline"
                className={`w-full gap-2 text-sm ${
                  confirmDelete
                    ? "border-destructive text-destructive hover:bg-destructive/5"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                loading={deleteTarget.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? "Confirmar remoção" : "Remover alvo"}
              </AsyncButton>

              {confirmDelete && (
                <p className="text-center text-xs text-muted-foreground">
                  Clique novamente para confirmar a exclusão permanente.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
