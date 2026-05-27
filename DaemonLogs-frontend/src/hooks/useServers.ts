import { useMutation, useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { ServerLookupResponse, ServersResponse } from "@/types"

export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => apiFetch<ServersResponse>("/servers", { bypassDemo: true }),
    staleTime: 5 * 60_000,
  })
}

export function useCheckServerMonitoring() {
  return useMutation({
    mutationFn: (guild_id: string) =>
      apiFetch<ServerLookupResponse>("/servers", {
        bypassDemo: true,
        method: "POST",
        body: JSON.stringify({ guild_id }),
      }),
  })
}