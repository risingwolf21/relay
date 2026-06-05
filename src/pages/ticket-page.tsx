import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, RefreshCw, Calendar, Link2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useUpdateTicket, useDeleteTicket, useCreateTicket } from '@/hooks/use-tickets'
import { TicketSubtasks } from '@/components/tickets/ticket-subtasks'
import { useProjectMembers } from '@/hooks/use-members'
import { useAuth } from '@/contexts/auth-context'
import { TicketForm, type TicketFormValues } from '@/components/tickets/ticket-form'
import { TicketComments } from '@/components/tickets/ticket-comments'
import { TicketActivityFeed } from '@/components/tickets/ticket-activity-feed'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { priorityConfig, statusConfig, formatDate, getInitials } from '@/lib/ticket-utils'
import type { Ticket, ProjectRole, RecurrenceFrequency } from '@/types/database'

function calculateNextDueDate(currentDate: string | null, frequency: RecurrenceFrequency): string {
  const base = currentDate ? new Date(currentDate) : new Date()
  switch (frequency) {
    case 'daily': base.setDate(base.getDate() + 1); break
    case 'weekly': base.setDate(base.getDate() + 7); break
    case 'biweekly': base.setDate(base.getDate() + 14); break
    case 'monthly': base.setMonth(base.getMonth() + 1); break
  }
  return base.toISOString().split('T')[0]
}

function DueDateBadge({ dueDate, t }: { dueDate: string; t: (key: string) => string }) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = dueDate < today
  const isToday = dueDate === today
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm ${
        isOverdue
          ? 'text-destructive'
          : isToday
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-foreground'
      }`}
    >
      <Calendar className="size-3.5" />
      {new Date(dueDate + 'T12:00:00').toLocaleDateString()}
      {isOverdue && <span className="ml-1 text-xs font-medium">({t('tickets.overdue')})</span>}
      {isToday && <span className="ml-1 text-xs font-medium">({t('tickets.dueToday')})</span>}
    </span>
  )
}

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
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId!)
  const { data: members = [] } = useProjectMembers(projectId!)
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()
  const createTicket = useCreateTicket()
  const [editing, setEditing] = useState(false)

  const { data: parentTicket } = useQuery({
    queryKey: ['ticket-stub', ticket?.parent_ticket_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, project_id')
        .eq('id', ticket!.parent_ticket_id!)
        .single()
      if (error) throw error
      return data as { id: string; title: string; project_id: string }
    },
    enabled: !!ticket?.parent_ticket_id,
  })

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

  async function handleCreateNextRecurrence() {
    if (!ticket?.recurrence_frequency) return
    const nextDue = calculateNextDueDate(ticket.due_date, ticket.recurrence_frequency)
    await createTicket.mutateAsync({
      project_id: ticket.project_id,
      title: ticket.title,
      description: ticket.description ?? undefined,
      status: 'backlog',
      priority: ticket.priority,
      assignee_id: ticket.assignee_id,
      due_date: nextDue,
      recurrence_frequency: ticket.recurrence_frequency,
      parent_ticket_id: ticket.id,
    })
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
        <p className="text-muted-foreground">{t('tickets.notFound')}</p>
        <Link to={`/projects/${projectId}`} className="text-sm underline">
          {t('tickets.backToProject')}
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
        {t('tickets.backToProject')}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityConfig[ticket.priority].className}>
              <PriorityIcon className="size-3" />
              {t(`priority.${ticket.priority}`)}
            </Badge>
            <Badge className={statusConfig[ticket.status].className}>
              {t(`status.${ticket.status}`)}
            </Badge>
            {ticket.recurrence_frequency && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="size-3" />
                {t(`tickets.recurrence_${ticket.recurrence_frequency}`)}
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {canEdit && !editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {t('common.edit')}
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
                {t('common.delete')}
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-semibold">{ticket.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('tickets.created', { date: formatDate(ticket.created_at) })}
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
            due_date: ticket.due_date,
            recurrence_frequency: ticket.recurrence_frequency,
          }}
          members={members}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
          isSubmitting={updateTicket.isPending}
          submitLabel={t('tickets.saveChanges')}
        />
      ) : (
        <div className="grid gap-4 text-sm">
          {ticket.assignee && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('tickets.assignee')}
              </p>
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(ticket.assignee.full_name, ticket.assignee.email ?? '')}
                  </AvatarFallback>
                </Avatar>
                <span>{ticket.assignee.full_name || ticket.assignee.email}</span>
              </div>
            </div>
          )}
          {ticket.due_date && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('tickets.dueDate')}
              </p>
              <DueDateBadge dueDate={ticket.due_date} t={t} />
            </div>
          )}
          {parentTicket && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {ticket.recurrence_frequency
                  ? t('tickets.previousRecurrence')
                  : t('tickets.parentTicket')}
              </p>
              <Link
                to={`/projects/${parentTicket.project_id}/tickets/${parentTicket.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Link2 className="size-3.5" />
                {parentTicket.title}
              </Link>
            </div>
          )}
          {ticket.description && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('tickets.description')}
              </p>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
        </div>
      )}

      <Separator />

      <TicketSubtasks ticketId={ticket.id} projectId={projectId!} canEdit={canEdit} />

      {canEdit && !editing && ticket.recurrence_frequency && (
        <>
          <Separator />
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNextRecurrence}
              disabled={createTicket.isPending}
            >
              <RefreshCw className="size-4" />
              {t('tickets.createNextRecurrence')}
            </Button>
          </div>
        </>
      )}

      <Separator />

      {/* Comments */}
      <TicketComments ticketId={ticket.id} />

      <Separator />

      {/* Activity */}
      <div>
        <h3 className="mb-4 text-sm font-medium">{t('activity.title')}</h3>
        <TicketActivityFeed ticketId={ticket.id} />
      </div>
    </div>
  )
}
