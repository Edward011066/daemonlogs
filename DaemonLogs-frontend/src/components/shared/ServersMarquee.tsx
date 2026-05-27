import { useEffect, useState } from "react"
import { Eye, Server } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useServers } from "@/hooks/useServers"
import type { DiscordServer } from "@/types"

function pickRandomServers(items: DiscordServer[], limit: number) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy.slice(0, Math.min(limit, copy.length))
}

interface ServersMarqueeProps {
  className?: string
  title?: string
  showTotalSummary?: boolean
}

export function ServersMarquee({
  className,
  title = "Alguns dos servidores monitorados",
  showTotalSummary = false,
}: ServersMarqueeProps) {
  const { data, isLoading } = useServers()
  const [sample, setSample] = useState<DiscordServer[]>([])

  useEffect(() => {
    if (!data?.items.length) {
      setSample([])
      return
    }

    setSample(pickRandomServers(data.items, 10))
  }, [data])

  if (!isLoading && !sample.length) return null

  const items = sample.length ? [...sample, ...sample] : []

  return (
    <section className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4 text-accent" />
          <span>{title}</span>
        </div>

        {showTotalSummary && data && !isLoading && (
          <p className="pl-6 text-xs text-muted-foreground">
            Um total de {" "}
            <span className="font-semibold text-foreground">
              {data.total.toLocaleString("pt-BR")}
            </span>{" "}
            servidores em monitoramento 24h
          </p>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/70 px-3 py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />

        {isLoading ? (
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-48 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="servers-marquee-track flex w-max gap-3">
            {items.map((server, index) => (
              <div
                key={`${server.guild_id}-${index}`}
                className="flex min-w-[220px] items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Server className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{server.server_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    visto em {new Date(server.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}