import { useState } from "react"
import { Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useGuestAwareNavigate } from "@/hooks/useGuestAwareNavigate"
import { useCheckServerMonitoring } from "@/hooks/useServers"
import { ApiError } from "@/lib/api"

interface ServerMonitoringLookupCardProps {
  className?: string
}

export function ServerMonitoringLookupCard({ className }: ServerMonitoringLookupCardProps) {
  const [serverId, setServerId] = useState("")
  const guestNavigate = useGuestAwareNavigate()
  const checkServer = useCheckServerMonitoring()

  const trimmedServerId = serverId.trim()
  const hasValidServerId = /^[0-9]{17,20}$/.test(trimmedServerId)
  const serverLookupError = checkServer.error instanceof ApiError ? checkServer.error : null

  const handleCheckServer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hasValidServerId) return

    try {
      await checkServer.mutateAsync(trimmedServerId)
    } catch {
      // Estado de erro exibido inline.
    }
  }

  return (
    <div
      data-allow-guest-interaction="true"
      className={cn("w-full max-w-3xl rounded-2xl border border-border/60 bg-surface/70 p-4 text-left shadow-sm sm:p-5", className)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <Server className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Seu servidor já apareceu na rede?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cole o Guild ID e descubra se esse servidor já foi encontrado pelas contas de monitoramento ativas.
          </p>
        </div>
      </div>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCheckServer}>
        <Input
          value={serverId}
          onChange={(e) => {
            setServerId(e.target.value)
            if (checkServer.isSuccess || checkServer.isError) checkServer.reset()
          }}
          placeholder="Cole o Guild ID do servidor"
          className="h-11 flex-1 border-border bg-surface-2 font-mono text-sm"
        />
        <Button type="submit" size="lg" disabled={!hasValidServerId || checkServer.isPending}>
          {checkServer.isPending ? "Verificando..." : "Verificar servidor"}
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Aceita apenas Snowflakes do Discord com 17 a 20 dígitos.
      </p>

      {checkServer.data?.monitored && (
        <div className="mt-4 rounded-xl border border-success/20 bg-success/10 p-3">
          <p className="text-sm font-semibold text-success">Sim, este servidor está sendo monitorado.</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="text-foreground">{checkServer.data.server.server_name}</span>
            <span className="font-mono">{checkServer.data.server.guild_id}</span>
            <span>
              visto em {new Date(checkServer.data.server.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      )}

      {checkServer.data && !checkServer.data.monitored && (
        <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          Não encontramos esse servidor no monitoramento atual.
        </div>
      )}

      {serverLookupError?.status === 404 && (
        <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          <p>Ainda não encontramos esse servidor na rede monitorada.</p>
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto px-0 text-sm text-warning underline-offset-4 hover:underline"
            onClick={() => guestNavigate("/monitoring-contribute")}
          >
            Monitorar esse server
          </Button>
        </div>
      )}

      {serverLookupError && serverLookupError.status !== 404 && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {serverLookupError.message}
        </div>
      )}
    </div>
  )
}