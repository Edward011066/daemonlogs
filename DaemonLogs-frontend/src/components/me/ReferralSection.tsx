import { Share2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/shared/CopyButton"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useReferrals } from "@/hooks/useReferrals"

export function ReferralSection() {
  const { data: user } = useCurrentUser()
  const { data: referrals, isLoading } = useReferrals()

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          Referências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.referral_code && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Seu código de convite</p>
            <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
              <span className="font-code flex-1 text-sm font-medium text-foreground">
                {user.referral_code}
              </span>
              <CopyButton value={user.referral_code} />
            </div>
            <p className="text-xs text-muted-foreground">
              {user.referral_count} usuário{user.referral_count !== 1 ? "s" : ""} cadastrado
              {user.referral_count !== 1 ? "s" : ""} com seu código
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Usuários referenciados
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : referrals?.length ? (
            <ul className="space-y-1">
              {referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                >
                  <span>{r.username}</span>
                  <span>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum usuário referenciado ainda.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
