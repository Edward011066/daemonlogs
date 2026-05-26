import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { ServersResponse } from "@/types"

export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => apiFetch<ServersResponse>("/servers"),
    staleTime: 5 * 60_000,
  })
}