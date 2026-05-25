import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export function useClearChatChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (channel_id: string) =>
      apiFetch("/clear-chat/channel", {
        method: "POST",
        body: JSON.stringify({ channel_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useClearChatServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { guild_id: string; ignored_channel_ids?: string[] }) =>
      apiFetch("/clear-chat/server", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useClearChatDms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ignored_channel_ids?: string[] } = {}) =>
      apiFetch("/clear-chat/dms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useCancelClearChat() {
  return useMutation({
    mutationFn: () =>
      apiFetch("/clear-chat/cancel", { method: "POST" }),
  })
}
