import { useState } from "react"
import { Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { TargetCard } from "@/components/targets/TargetCard"
import { TargetDetailSheet } from "@/components/targets/TargetDetailSheet"
import { AddTargetDialog } from "@/components/targets/AddTargetDialog"
import { useTargets } from "@/hooks/useTargets"
import type { Target } from "@/types"

export function TargetsPage() {
  const { data: targets, isLoading, error } = useTargets()
  const [selected, setSelected] = useState<Target | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSelect = (target: Target) => {
    setSelected(target)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Alvos</h1>
          <p className="text-sm text-muted-foreground">
            Usuários Discord sendo monitorados{targets?.length ? ` · ${targets.length} cadastrados` : ""}
          </p>
        </div>
        <AddTargetDialog />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-3 w-16 shrink-0" />
            </div>
          ))}
        </div>
      ) : targets?.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} onClick={() => handleSelect(target)} />
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

      <TargetDetailSheet target={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
