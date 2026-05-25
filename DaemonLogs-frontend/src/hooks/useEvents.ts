import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { EventsResponse, EventType } from "@/types"

export interface EventsFilters {
  targetId?: string
  tipo?: EventType
  page?: number
  limit?: number
  from?: string
  to?: string
}

export function useEvents(filters: EventsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.targetId) params.set("targetId", filters.targetId)
  if (filters.tipo) params.set("tipo", filters.tipo)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)

  const qs = params.toString()

  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => apiFetch<EventsResponse>(`/events${qs ? `?${qs}` : ""}`),
  })
}
