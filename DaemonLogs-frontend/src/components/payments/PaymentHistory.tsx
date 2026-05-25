import { CheckCircle, Clock, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePaymentHistory } from "@/hooks/usePayments"
import { Skeleton } from "@/components/ui/skeleton"
import type { PaymentStatus } from "@/types"

const STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: typeof CheckCircle; classes: string }> = {
  ACTIVE:    { label: "Aguardando",  icon: Clock,        classes: "bg-warning/10 text-warning border-warning/20" },
  COMPLETED: { label: "Pago",        icon: CheckCircle,  classes: "bg-success/10 text-success border-success/20" },
  EXPIRED:   { label: "Expirado",    icon: XCircle,      classes: "bg-muted/10 text-muted-foreground border-muted/20" },
}

export function PaymentHistory() {
  const { data: payments, isLoading } = usePaymentHistory()

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (!payments?.length) return <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pago em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => {
          const cfg = STATUS_CONFIG[p.status]
          const Icon = cfg.icon
          return (
            <TableRow key={p.correlation_id}>
              <TableCell className="font-code text-xs text-muted-foreground">
                {p.correlation_id.slice(0, 8)}…
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(cfg.classes, "gap-1")}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {p.premium_expires_at ? new Date(p.premium_expires_at).toLocaleString("pt-BR") : "—"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
