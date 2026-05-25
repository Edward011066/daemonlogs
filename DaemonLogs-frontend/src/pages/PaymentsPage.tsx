import { useState } from "react"
import { CreditCard, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanBadge } from "@/components/shared/PlanBadge"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { PixQRCode } from "@/components/payments/PixQRCode"
import { PaymentHistory } from "@/components/payments/PaymentHistory"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useInitiatePayment, usePaymentStatus } from "@/hooks/usePayments"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"


export function PaymentsPage() {
  const { data: user } = useCurrentUser()
  const initiate = useInitiatePayment()
  const [correlationId, setCorrelationId] = useState<string | null>(null)

  const { data: paymentStatus } = usePaymentStatus(correlationId)

  const handleInitiate = async () => {
    try {
      const result = await initiate.mutateAsync()
      if (result) {
        setCorrelationId(result.correlationId)
      }
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  const paymentDone = paymentStatus?.status === "COMPLETED"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Plano e Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Plano atual
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {user && <PlanBadge plan={user.plan} />}
            </CardDescription>
          </CardHeader>
          {user?.plan === "freemium" && (
            <CardContent className="space-y-3">
              <div className="rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-accent">
                <p className="font-medium">Atualize para Premium</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-accent/80">
                  <li>Alvos ilimitados</li>
                  <li>Sem limite de deleção de mensagens</li>
                  <li>Suporte prioritário</li>
                </ul>
              </div>

              {paymentDone ? (
                <p className="text-center text-sm text-success">
                  Pagamento confirmado! Recarregue a página para ver seu novo plano.
                </p>
              ) : initiate.data && correlationId ? (
                <PixQRCode payment={initiate.data} />
              ) : (
                <AsyncButton
                  className="w-full gap-2"
                  loading={initiate.isPending}
                  onClick={handleInitiate}
                >
                  <Sparkles className="h-4 w-4" />
                  Assinar Premium via PIX
                </AsyncButton>
              )}

              {initiate.error && <ErrorAlert error={initiate.error} />}
            </CardContent>
          )}
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Histórico de pagamentos</h2>
          <PaymentHistory />
        </div>
      </div>
    </div>
  )
}
