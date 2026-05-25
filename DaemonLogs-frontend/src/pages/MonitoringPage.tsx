import { Radio } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { MonitoringCard } from "@/components/monitoring/MonitoringCard"
import { AddMonitoringDialog } from "@/components/monitoring/AddMonitoringDialog"
import { useMonitoring } from "@/hooks/useMonitoring"

export function MonitoringPage() {
  const { data: accounts, isLoading, error } = useMonitoring()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">
            Contas selfbot que coletam eventos
          </p>
        </div>
        <AddMonitoringDialog />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : accounts?.length ? (
        <div className="space-y-2">
          {accounts.map((account) => (
            <MonitoringCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Radio}
          title="Nenhuma conta de monitoramento"
          description="Adicione um token selfbot para começar a monitorar."
          action={<AddMonitoringDialog />}
        />
      )}
    </div>
  )
}
