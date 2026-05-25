import { QrCode, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/shared/CopyButton"
import { useCountdown, formatCountdown } from "@/hooks/useCountdown"
import type { PaymentInitiated } from "@/types"

interface PixQRCodeProps {
  payment: PaymentInitiated
}

export function PixQRCode({ payment }: PixQRCodeProps) {
  const remaining = useCountdown(payment.chargeExpiresAt)
  const expired = remaining === 0

  const valueBRL = (payment.valorCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <QrCode className="h-4 w-4 text-accent" />
          PIX — {valueBRL}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expired ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">Cobrança expirada</p>
            <p className="text-xs text-muted-foreground">Clique em “Assinar Premium” novamente para gerar um novo PIX.</p>
          </div>
        ) : (
          <>
            {payment.qrCodeImage && (
              <div className="flex justify-center">
                <img
                  src={payment.qrCodeImage}
                  alt="QR Code PIX"
                  className="h-48 w-48 rounded-md"
                />
              </div>
            )}

            <div className="rounded-md bg-surface-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-code break-all text-[11px] text-muted-foreground leading-relaxed">
                  {payment.brCode}
                </p>
                <CopyButton value={payment.brCode} className="shrink-0" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Expira em{" "}
                <span className={`font-mono font-semibold ${remaining < 60 ? "text-destructive" : "text-foreground"}`}>
                  {formatCountdown(remaining)}
                </span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
