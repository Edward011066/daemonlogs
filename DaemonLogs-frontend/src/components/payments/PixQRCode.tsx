import { QrCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/shared/CopyButton"
import type { PaymentInitiated } from "@/types"

interface PixQRCodeProps {
  payment: PaymentInitiated
}

export function PixQRCode({ payment }: PixQRCodeProps) {
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

        <p className="text-center text-xs text-muted-foreground">
          Aguardando confirmação do pagamento...
        </p>
      </CardContent>
    </Card>
  )
}
