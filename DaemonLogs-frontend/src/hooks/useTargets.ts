import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Target } from "@/types"

export function useTargets() {
  return useQuery({
    queryKey: ["targets"],
    queryFn: () => apiFetch<Target[]>("/targets"),
  })
}

export function useAddTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (discord_user_id: string) =>
      apiFetch<Target>("/targets", {
        method: "POST",
        body: JSON.stringify({ discord_user_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["targets"] })
    },
  })
}

export function useDeleteTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/targets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["targets"] })
    },
  })
}
