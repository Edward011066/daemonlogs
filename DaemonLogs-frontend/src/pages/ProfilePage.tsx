import { Skeleton } from "@/components/ui/skeleton"
import { MyTokenPanel } from "@/components/me/MyTokenPanel"
import { QuotaDisplay } from "@/components/me/QuotaDisplay"
import { ChangePasswordForm } from "@/components/me/ChangePasswordForm"
import { ReferralSection } from "@/components/me/ReferralSection"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados e configurações</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <MyTokenPanel />
          {user?.clear_chat_quota && <QuotaDisplay quota={user.clear_chat_quota} />}
        </div>
        <div className="space-y-4">
          {!user?.discord_login && <ChangePasswordForm />}
          <ReferralSection />
        </div>
      </div>
    </div>
  )
}
