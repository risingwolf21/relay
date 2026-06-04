import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Ticket, TicketStatus, ProjectRole } from '@/types/database'
import type { MemberWithProfile } from '@/hooks/use-members'
import { Button } from '@/components/ui/button'
import { TicketCard } from './ticket-card'
import { TicketDialog } from './ticket-dialog'
import { TicketDetailSheet } from './ticket-detail-sheet'
import { statusConfig } from '@/lib/ticket-utils'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TicketStatus
  tickets: Ticket[]
  projectId: string
  members: MemberWithProfile[]
  userRole: ProjectRole | null
}

export function KanbanColumn({ status, tickets, projectId, members, userRole }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const canCreate = userRole === 'admin' || userRole === 'editor'
  const ticketIds = tickets.map((t) => t.id)
  const config = statusConfig[status]

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', config.dotClassName)} />
          <span className="text-sm font-medium">{t(`status.${status}`)}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {tickets.length}
          </span>
        </div>
        {canCreate && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCreateOpen(true)}
            title={t('tickets.addTicketTo', { status: t(`status.${status}`) })}
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 rounded-xl p-2 min-h-[120px] transition-colors',
            isOver ? 'bg-muted/60' : 'bg-muted/20',
          )}
        >
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
          {tickets.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">{t('tickets.dropTicketsHere')}</p>
            </div>
          )}
        </div>
      </SortableContext>

      <TicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        defaultStatus={status}
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
