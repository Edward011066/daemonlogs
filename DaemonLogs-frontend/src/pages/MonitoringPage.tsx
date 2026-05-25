import { Radio, Info, Users, Gift, Wifi } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { MonitoringCard } from "@/components/monitoring/MonitoringCard"
import { AddMonitoringDialog } from "@/components/monitoring/AddMonitoringDialog"
import { useMonitoring, useMonitoringStats } from "@/hooks/useMonitoring"

export function MonitoringPage() {
  const { data: accounts, isLoading, error } = useMonitoring()
  const { data: stats } = useMonitoringStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">
            Contas selfbot que coletam eventos em tempo real
          </p>
        </div>
        <AddMonitoringDialog />
      </div>

      {/* Explicação de como funciona */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Info className="h-4 w-4 text-accent shrink-0" />
          Como funciona o monitoramento?
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Wifi className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>
              Cada conta adicionada atua como um <span className="text-foreground font-medium">selfbot</span> — conectada continuamente ao Discord para capturar eventos de entrada/saída dos seus alvos em tempo real.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Users className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>
              Quanto mais contas você cadastrar, <span className="text-foreground font-medium">maior a cobertura</span> — os alvos são distribuídos entre as contas ativas para evitar detecção e aumentar a confiabilidade.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>
              Indique 5 usuários com seu link de referral e ganhe <span className="text-foreground font-medium">30 dias de Premium grátis</span> — sem precisar pagar.
            </span>
          </li>
        </ul>
      </div>

      {/* Stats da comunidade */}
      {stats !== undefined && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center justify-between gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="h-4 w-4 text-accent" />
            <span>
              Você contribui com{" "}
              <span className="font-semibold text-foreground">{stats.my_active}</span>{" "}
              conta{stats.my_active !== 1 ? "s" : ""} ativa{stats.my_active !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-muted-foreground">
            Total na rede:{" "}
            <span className="font-semibold text-foreground">{stats.total_active}</span>{" "}
            conta{stats.total_active !== 1 ? "s" : ""} ativa{stats.total_active !== 1 ? "s" : ""}
          </div>
        </div>
      )}

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

