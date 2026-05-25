import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { PaymentInitiated, PaymentStatusResponse } from "@/types"

export function useInitiatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<PaymentInitiated>("/payments/initiate", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] })
    },
  })
}

export function usePaymentStatus(correlationId: string | null) {
  return useQuery({
    queryKey: ["payments", "status", correlationId],
    queryFn: () =>
      apiFetch<PaymentStatusResponse>(`/payments/status/${correlationId}`),
    enabled: !!correlationId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "ACTIVE" ? 5_000 : false
    },
  })
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<PaymentStatusResponse[]>("/payments"),
  })
}
