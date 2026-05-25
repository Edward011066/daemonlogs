import { Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { TargetCard } from "@/components/targets/TargetCard"
import { AddTargetDialog } from "@/components/targets/AddTargetDialog"
import { useTargets } from "@/hooks/useTargets"

export function TargetsPage() {
  const { data: targets, isLoading, error } = useTargets()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Alvos</h1>
          <p className="text-sm text-muted-foreground">
            Usuários Discord sendo monitorados
          </p>
        </div>
        <AddTargetDialog />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : targets?.length ? (
        <div className="space-y-2">
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum alvo cadastrado"
          description="Adicione o Discord ID de um usuário para monitorá-lo."
          action={<AddTargetDialog />}
        />
      )}
    </div>
  )
}
