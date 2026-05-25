import { Activity, Radio, Shield, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanBadge } from "@/components/shared/PlanBadge"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useMonitoring } from "@/hooks/useMonitoring"
import { useTargets } from "@/hooks/useTargets"
import { useEvents } from "@/hooks/useEvents"

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof Radio }) {
  return (
    <Card className="bg-surface">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: monitoring } = useMonitoring()
  const { data: targets } = useTargets()
  const { data: events } = useEvents({ limit: 1 })

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Olá, {user?.username}
          </h1>
          <p className="text-sm text-muted-foreground">Visão geral do monitoramento</p>
        </div>
        {user && <PlanBadge plan={user.plan} />}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Contas monitorando"
          value={monitoring?.filter((m) => m.is_valid).length ?? 0}
          icon={Radio}
        />
        <StatCard
          title="Alvos ativos"
          value={targets?.length ?? 0}
          icon={Users}
        />
        <StatCard
          title="Total de eventos"
          value={events?.total ?? 0}
          icon={Activity}
        />
        <StatCard
          title="Plano"
          value={user?.plan === "premium" ? "Premium" : user?.plan === "admin" ? "Admin" : "Freemium"}
          icon={Shield}
        />
      </div>

      {user?.plan === "freemium" && user.clear_chat_quota && (
        <Card className="bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quota Clear-Chat (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {user.clear_chat_quota.deletions_used} / {user.clear_chat_quota.deletions_limit} mensagens
              </span>
              {user.clear_chat_quota.resets_at && (
                <span>
                  Renova em {new Date(user.clear_chat_quota.resets_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{
                  width: `${Math.min(100, (user.clear_chat_quota.deletions_used / user.clear_chat_quota.deletions_limit) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
