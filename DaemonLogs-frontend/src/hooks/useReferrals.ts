import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Referral } from "@/types"

export function useReferrals() {
  return useQuery({
    queryKey: ["me", "referrals"],
    queryFn: () => apiFetch<Referral[]>("/me/referrals"),
  })
}
