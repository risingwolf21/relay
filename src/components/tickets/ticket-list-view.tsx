import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTickets } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { Ticket, ProjectRole } from '@/types/database'
import { Button } from '@/components/ui/button'
import { TicketRow } from './ticket-row'
import { TicketDialog } from './ticket-dialog'
import { TicketDetailSheet } from './ticket-detail-sheet'

interface TicketListViewProps {
  projectId: string
  members: MemberWithProfile[]
  userRole: ProjectRole | null
}

export function TicketListView({ projectId, members, userRole }: TicketListViewProps) {
  const { data: tickets = [], isLoading } = useTickets(projectId)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const canCreate = userRole === 'admin' || userRole === 'editor'

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading tickets…</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New ticket
          </Button>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border py-16 text-center">
          <p className="text-sm text-muted-foreground">No tickets yet</p>
          {canCreate && (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create your first ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              userRole={userRole}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      <TicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        members={members}
      />
      <TicketDetailSheet
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        members={members}
        userRole={userRole}
      />
    </div>
  )
}
