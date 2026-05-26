import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MyTokenPanel } from "@/components/me/MyTokenPanel"
import { QuotaDisplay } from "@/components/me/QuotaDisplay"
import { ChangePasswordForm } from "@/components/me/ChangePasswordForm"
import { ReferralSection } from "@/components/me/ReferralSection"
import { PlanBadge } from "@/components/shared/PlanBadge"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { KeyRound, Lock, Share2, User } from "lucide-react"

const TAB_CLASS =
  "flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground shadow-none transition-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none"

export function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User identity header */}
      <Card className="bg-surface">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <User className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">{user?.username}</p>
              {user && <PlanBadge plan={user.plan} />}
            </div>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            {user?.premium_expires_at && (
              <p className="text-xs text-muted-foreground">
                Premium até{" "}
                {new Date(user.premium_expires_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="conta">
        <TabsList className="w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="conta" className={TAB_CLASS}>
            <KeyRound className="h-3.5 w-3.5" />
            Conta
          </TabsTrigger>
          {!user?.discord_login && (
            <TabsTrigger value="seguranca" className={TAB_CLASS}>
              <Lock className="h-3.5 w-3.5" />
              Segurança
            </TabsTrigger>
          )}
          <TabsTrigger value="referrals" className={TAB_CLASS}>
            <Share2 className="h-3.5 w-3.5" />
            Referrals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-6 space-y-4">
          <MyTokenPanel />
          {user?.clear_chat_quota && <QuotaDisplay quota={user.clear_chat_quota} />}
        </TabsContent>

        {!user?.discord_login && (
          <TabsContent value="seguranca" className="mt-6">
            <ChangePasswordForm />
          </TabsContent>
        )}

        <TabsContent value="referrals" className="mt-6">
          <ReferralSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
