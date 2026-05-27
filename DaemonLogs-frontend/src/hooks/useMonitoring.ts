import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { MonitoringAccount, MonitoringStats } from "@/types"

export function useMonitoring() {
  return useQuery({
    queryKey: ["monitoring"],
    queryFn: () => apiFetch<MonitoringAccount[]>("/monitoring"),
  })
}

export function useMonitoringStats() {
  return useQuery({
    queryKey: ["monitoring", "stats"],
    queryFn: () => apiFetch<MonitoringStats>("/monitoring/stats"),
  })
}

export function useAddMonitoring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<MonitoringAccount>("/monitoring", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: (account) => {
      qc.setQueryData<MonitoringAccount[]>(["monitoring"], (current) => {
        if (!current?.length) return [account]

        const withoutDuplicated = current.filter((item) => item.id !== account.id)
        return [account, ...withoutDuplicated]
      })
    },
  })
}

export function useDeleteMonitoring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/monitoring/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring"] })
    },
  })
}

export function useRevalidateMonitoring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<MonitoringAccount>(`/monitoring/${id}/validate`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring"] })
    },
  })
}
