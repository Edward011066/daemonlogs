import { Activity, ArrowRight, Radio, Shield, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PlanBadge } from "@/components/shared/PlanBadge"
import { ServerMonitoringLookupCard } from "@/components/shared/ServerMonitoringLookupCard"
import { ServersMarquee } from "@/components/shared/ServersMarquee"
import { EventBadge } from "@/components/events/EventBadge"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useMonitoring } from "@/hooks/useMonitoring"
import { useTargets } from "@/hooks/useTargets"
import { useEvents } from "@/hooks/useEvents"
import type { DiscordEvent } from "@/types"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function RecentEventsRow({ event }: { event: DiscordEvent }) {
  const target = event.conta_alvo.username ?? event.conta_alvo.discord_user_id
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
      <EventBadge type={event.tipo} showIcon className="shrink-0 text-[10px]" />
      <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">{target}</span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {timeAgo(event.created_at)}
      </span>
    </div>
  )
}

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
  const { data: events } = useEvents({ limit: 5 })

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

      <ServersMarquee />

      <ServerMonitoringLookupCard />

      {events && events.items.length > 0 && (
        <Card className="bg-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Últimos eventos
            </CardTitle>
            <Link
              to="/events"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            {events.items.map((event) => (
              <RecentEventsRow key={event.id} event={event} />
            ))}
          </CardContent>
        </Card>
      )}

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
