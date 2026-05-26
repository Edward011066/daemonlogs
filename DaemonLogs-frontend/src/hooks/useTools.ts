import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { DiscordUserInfo, ToolsStatus } from "@/types"

export function useToolsStatus() {
  return useQuery({
    queryKey: ["tools", "status"],
    queryFn: () => apiFetch<ToolsStatus>("/tools/status"),
    refetchInterval: (query) => (query.state.data?.active ? 3_000 : false),
  })
}

export function useCancelTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch("/tools/cancel-current-process", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tools", "status"] })
    },
  })
}

export function useCloseDm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ignored_channel_ids?: string[] } = {}) =>
      apiFetch("/tools/close-dm", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tools", "status"] })
    },
  })
}

export function useLeaveServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ignored_guild_ids?: string[] } = {}) =>
      apiFetch("/tools/leave-server", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tools", "status"] })
    },
  })
}

export function useDeleteRelationships() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ignored_user_ids?: string[] } = {}) =>
      apiFetch("/tools/delete-relationships", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tools", "status"] })
    },
  })
}

export function useValidateDiscordToken() {
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<DiscordUserInfo>("/utils/validate-discord-token", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  })
}
