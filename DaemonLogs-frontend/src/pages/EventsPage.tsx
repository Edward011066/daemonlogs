import { useState } from "react"
import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { EventFilters } from "@/components/events/EventFilters"
import { EventsTable } from "@/components/events/EventsTable"
import { useEvents } from "@/hooks/useEvents"
import type { EventsFilters } from "@/hooks/useEvents"
import { ChevronLeft, ChevronRight } from "lucide-react"

const LIMIT = 20

export function EventsPage() {
  const [filters, setFilters] = useState<EventsFilters>({ page: 1, limit: LIMIT })
  const { data, isLoading, error } = useEvents(filters)

  const page = filters.page ?? 1
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de atividade dos alvos monitorados
        </p>
      </div>

      <EventFilters filters={filters} onChange={(f) => setFilters({ ...f, page: 1, limit: LIMIT })} />

      {error && <ErrorAlert error={error} />}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.items.length ? (
        <>
          <EventsTable events={data.items} />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} evento{total !== 1 ? "s" : ""} no total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{page} / {totalPages}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState icon={Activity} title="Nenhum evento encontrado" description="Ajuste os filtros ou aguarde novos eventos." />
      )}
    </div>
  )
}
