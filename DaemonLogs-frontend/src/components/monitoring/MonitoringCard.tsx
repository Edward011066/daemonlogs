import { useState } from "react"
import { Trash2, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/shared/StatusDot"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { useDeleteMonitoring, useRevalidateMonitoring } from "@/hooks/useMonitoring"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import type { MonitoringAccount } from "@/types"

interface MonitoringCardProps {
  account: MonitoringAccount
}

export function MonitoringCard({ account }: MonitoringCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteAcc = useDeleteMonitoring()
  const revalidate = useRevalidateMonitoring()

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await deleteAcc.mutateAsync(account.id)
      toast.success("Conta removida.")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  const handleRevalidate = async () => {
    try {
      await revalidate.mutateAsync(account.id)
      toast.success("Token revalidado.")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <Card className="bg-surface">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <StatusDot active={account.is_valid} />
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {account.username}
              </p>
              <span className="text-xs text-muted-foreground">
                {account.is_valid ? "Token válido" : "Token inválido"}
              </span>
            </div>
            <p className="font-code text-[11px] text-muted-foreground">
              Adicionado em {new Date(account.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleRevalidate}
            disabled={revalidate.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${revalidate.isPending ? "animate-spin" : ""}`} />
          </Button>
          <AsyncButton
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            loading={deleteAcc.isPending}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </AsyncButton>
        </div>
      </CardContent>
    </Card>
  )
}
