import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EventBadge } from "./EventBadge"
import type { DiscordEvent } from "@/types"

interface EventsTableProps {
  events: DiscordEvent[]
  loading?: boolean
}

export function EventsTable({ events, loading }: EventsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Alvo</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>
              <EventBadge type={event.event_type} />
            </TableCell>
            <TableCell className="font-code text-sm text-muted-foreground">
              {event.target_username}
            </TableCell>
            <TableCell className="font-code text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleString("pt-BR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
