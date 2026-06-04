import { useState } from 'react'
import { useCreateTicket } from '@/hooks/use-tickets'
import { useProjectMembers } from '@/hooks/use-members'
import { useEditableProjects } from '@/hooks/use-projects'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { TicketStatus } from '@/types/database'
import { TicketForm, type TicketFormValues } from './ticket-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  defaultStatus?: TicketStatus
  members?: MemberWithProfile[]
}

export function TicketDialog({
  open,
  onOpenChange,
  projectId,
  defaultStatus = 'backlog',
  members,
}: TicketDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const createTicket = useCreateTicket()
  const { data: editableProjects = [] } = useEditableProjects()
  const { data: fetchedMembers = [] } = useProjectMembers(selectedProjectId)

  const activeProjectId = projectId ?? selectedProjectId
  const activeMembers = projectId ? (members ?? []) : fetchedMembers

  function handleOpenChange(next: boolean) {
    if (!next && !projectId) setSelectedProjectId('')
    onOpenChange(next)
  }

  async function handleSubmit(values: TicketFormValues) {
    if (!activeProjectId) return
    await createTicket.mutateAsync({ project_id: activeProjectId, ...values })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            {projectId
              ? 'Create a new ticket for this project.'
              : 'Select a project and fill in the ticket details.'}
          </DialogDescription>
        </DialogHeader>
        {!projectId && (
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project…" />
              </SelectTrigger>
              <SelectContent>
                {editableProjects.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No projects where you can create tickets
                  </div>
                ) : (
                  editableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        <TicketForm
          key={activeProjectId}
          defaultValues={{ status: defaultStatus }}
          members={activeMembers}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={createTicket.isPending}
          submitLabel="Create ticket"
          submitDisabled={!activeProjectId}
        />
      </DialogContent>
    </Dialog>
  )
}
