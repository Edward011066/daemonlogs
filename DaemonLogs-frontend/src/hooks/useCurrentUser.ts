import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { User } from "@/types"

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<User>("/me"),
    staleTime: 30_000,
  })
}

export function useInvalidateCurrentUser() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ["me"] })
}
