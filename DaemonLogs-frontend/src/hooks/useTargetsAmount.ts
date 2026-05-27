import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export function useTargetsAmount() {
  return useQuery({
    queryKey: ["targets-amount"],
    queryFn: () => apiFetch<{ total: number }>("/targets-amount", { bypassDemo: true }),
    staleTime: 60_000,
  })
}
