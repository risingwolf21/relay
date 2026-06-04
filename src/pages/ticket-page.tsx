import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUpdateTicket, useDeleteTicket } from '@/hooks/use-tickets'
import { useProjectMembers } from '@/hooks/use-members'
import { useAuth } from '@/contexts/auth-context'
import { TicketForm, type TicketFormValues } from '@/components/tickets/ticket-form'
import { TicketComments } from '@/components/tickets/ticket-comments'
import { TicketActivityFeed } from '@/components/tickets/ticket-activity-feed'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { priorityConfig, statusConfig, formatDate } from '@/lib/ticket-utils'
import type { Ticket, ProjectRole } from '@/types/database'
import { useNavigate } from 'react-router-dom'

function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async (): Promise<Ticket> => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*)')
        .eq('id', ticketId)
        .single()
      if (error) throw error
      return data as unknown as Ticket
    },
    enabled: !!ticketId,
  })
}

export function TicketPage() {
  const { projectId, ticketId } = useParams<{ projectId: string; ticketId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId!)
  const { data: members = [] } = useProjectMembers(projectId!)
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()
  const [editing, setEditing] = useState(false)

  const currentUserRole = members.find((m) => m.user_id === user?.id)?.role as ProjectRole | null
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'editor'
  const canDelete = currentUserRole === 'admin'

  async function handleSubmit(values: TicketFormValues) {
    await updateTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id, ...values })
    setEditing(false)
  }

  async function handleDelete() {
    await deleteTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id })
    navigate(`/projects/${projectId}`)
  }

  if (ticketLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-7 w-72 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12">
        <p className="text-muted-foreground">Ticket not found</p>
        <Link to={`/projects/${projectId}`} className="text-sm underline">
          Back to project
        </Link>
      </div>
    )
  }

  const PriorityIcon = priorityConfig[ticket.priority].icon

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      {/* Back */}
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        Back to project
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityConfig[ticket.priority].className}>
              <PriorityIcon className="size-3" />
              {priorityConfig[ticket.priority].label}
            </Badge>
            <Badge className={statusConfig[ticket.status].className}>
              {statusConfig[ticket.status].label}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-2">
            {canEdit && !editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteTicket.isPending}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-semibold">{ticket.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(ticket.created_at)}
            {ticket.assignee && ` · Assigned to ${ticket.assignee.full_name || ticket.assignee.email}`}
          </p>
        </div>
      </div>

      <Separator />

      {/* Edit form or read-only view */}
      {editing && canEdit ? (
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
          onCancel={() => setEditing(false)}
          isSubmitting={updateTicket.isPending}
          submitLabel="Save changes"
        />
      ) : (
        ticket.description && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </div>
        )
      )}

      <Separator />

      {/* Comments */}
      <TicketComments ticketId={ticket.id} />

      <Separator />

      {/* Activity */}
      <div>
        <h3 className="mb-4 text-sm font-medium">Activity</h3>
        <TicketActivityFeed ticketId={ticket.id} />
      </div>
    </div>
  )
}
