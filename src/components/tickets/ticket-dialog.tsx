import { useCreateTicket } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { TicketStatus } from '@/types/database'
import { TicketForm, type TicketFormValues } from './ticket-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface TicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  defaultStatus?: TicketStatus
  members?: MemberWithProfile[]
}

export function TicketDialog({
  open,
  onOpenChange,
  projectId,
  defaultStatus = 'backlog',
  members = [],
}: TicketDialogProps) {
  const createTicket = useCreateTicket()

  async function handleSubmit(values: TicketFormValues) {
    await createTicket.mutateAsync({ project_id: projectId, ...values })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>Create a new ticket for this project.</DialogDescription>
        </DialogHeader>
        <TicketForm
          defaultValues={{ status: defaultStatus }}
          members={members}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createTicket.isPending}
          submitLabel="Create ticket"
        />
      </DialogContent>
    </Dialog>
  )
}
