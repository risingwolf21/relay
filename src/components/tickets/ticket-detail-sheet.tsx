import { useUpdateTicket, useDeleteTicket } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { Ticket, ProjectRole } from '@/types/database'
import { TicketForm, type TicketFormValues } from './ticket-form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { priorityConfig, statusConfig, formatDate } from '@/lib/ticket-utils'
import { Trash2 } from 'lucide-react'

interface TicketDetailSheetProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  members?: MemberWithProfile[]
  userRole: ProjectRole | null
}

export function TicketDetailSheet({
  ticket,
  open,
  onOpenChange,
  members = [],
  userRole,
}: TicketDetailSheetProps) {
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()

  if (!ticket) return null

  const canEdit = userRole === 'admin' || userRole === 'editor'
  const canDelete = userRole === 'admin'

  async function handleSubmit(values: TicketFormValues) {
    await updateTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id, ...values })
    onOpenChange(false)
  }

  async function handleDelete() {
    await deleteTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id })
    onOpenChange(false)
  }

  const PriorityIcon = priorityConfig[ticket.priority].icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={priorityConfig[ticket.priority].className}>
              <PriorityIcon className="size-3" />
              {priorityConfig[ticket.priority].label}
            </Badge>
            <Badge className={statusConfig[ticket.status].className}>
              {statusConfig[ticket.status].label}
            </Badge>
          </div>
          <SheetTitle className="text-left">{ticket.title}</SheetTitle>
          <SheetDescription className="text-left">
            Created {formatDate(ticket.created_at)}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {canEdit ? (
          <TicketForm
            defaultValues={{
              title: ticket.title,
              description: ticket.description ?? '',
              status: ticket.status,
              priority: ticket.priority,
              assignee_id: ticket.assignee_id,
            }}
            members={members}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateTicket.isPending}
            submitLabel="Save changes"
          />
        ) : (
          <div className="grid gap-4 text-sm">
            {ticket.description && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}
          </div>
        )}

        {canDelete && (
          <>
            <Separator className="my-4" />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTicket.isPending}
            >
              <Trash2 className="size-4" />
              Delete ticket
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
