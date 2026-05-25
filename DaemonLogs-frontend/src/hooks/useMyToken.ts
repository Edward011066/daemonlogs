import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { MyToken } from "@/types"

export function useMyToken() {
  return useQuery({
    queryKey: ["my-token"],
    queryFn: () => apiFetch<MyToken>("/my-token"),
    retry: false,
  })
}

export function useAddMyToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch("/my-token/add", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-token"] })
      qc.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useDeleteMyToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch("/my-token/delete", { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-token"] })
      qc.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useRotateMyToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch("/my-token/rotate", {
        method: "PATCH",
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-token"] })
    },
  })
}
