import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, RefreshCw, Calendar, Link2, Pencil } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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

function useProjectName(projectId: string) {
  return useQuery({
    queryKey: ['project-name', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()
      if (error) throw error
      return data.name as string
    },
    enabled: !!projectId,
  })
}

interface PropertyRowProps {
  label: string
  children: React.ReactNode
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

interface PropertiesPanelProps {
  ticket: Ticket
  parentTicket: { id: string; title: string; project_id: string } | null | undefined
  t: (key: string, opts?: Record<string, unknown>) => string
}

function PropertiesPanel({ ticket, parentTicket, t }: PropertiesPanelProps) {
  const PriorityIcon = priorityConfig[ticket.priority].icon

  return (
    <div className="flex flex-col gap-4">
      <PropertyRow label={t('tickets.status')}>
        <Badge className={statusConfig[ticket.status].className}>
          {t(`status.${ticket.status}`)}
        </Badge>
      </PropertyRow>

      <PropertyRow label={t('tickets.priority')}>
        <Badge className={priorityConfig[ticket.priority].className}>
          <PriorityIcon className="size-3" />
          {t(`priority.${ticket.priority}`)}
        </Badge>
      </PropertyRow>

      <PropertyRow label={t('tickets.assignee')}>
        {ticket.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {getInitials(ticket.assignee.full_name, ticket.assignee.email ?? '')}
              </AvatarFallback>
            </Avatar>
            <span>{ticket.assignee.full_name || ticket.assignee.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{t('tickets.unassigned')}</span>
        )}
      </PropertyRow>

      <PropertyRow label={t('tickets.dueDate')}>
        {ticket.due_date ? (
          <DueDateDisplay dueDate={ticket.due_date} t={t} />
        ) : (
          <span className="text-muted-foreground">{t('tickets.noDueDate')}</span>
        )}
      </PropertyRow>

      {ticket.recurrence_frequency && (
        <PropertyRow label={t('tickets.recurrence')}>
          <div className="flex items-center gap-1.5 text-sm">
            <RefreshCw className="size-3.5 text-muted-foreground" />
            {t(`tickets.recurrence_${ticket.recurrence_frequency}`)}
          </div>
        </PropertyRow>
      )}

      {parentTicket && (
        <PropertyRow
          label={
            ticket.recurrence_frequency
              ? t('tickets.previousRecurrence')
              : t('tickets.parentTicket')
          }
        >
          <Link
            to={`/projects/${parentTicket.project_id}/tickets/${parentTicket.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Link2 className="size-3.5" />
            {parentTicket.title}
          </Link>
        </PropertyRow>
      )}

      <Separator />

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>{t('tickets.created', { date: formatDate(ticket.created_at) })}</span>
      </div>
    </div>
  )
}

function DueDateDisplay({ dueDate, t }: { dueDate: string; t: (key: string) => string }) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = dueDate < today
  const isToday = dueDate === today
  return (
    <span
      className={`inline-flex items-center gap-1 ${
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

export function TicketPage() {
  const { projectId, ticketId } = useParams<{ projectId: string; ticketId: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId!)
  const { data: members = [] } = useProjectMembers(projectId!)
  const { data: projectName } = useProjectName(projectId!)
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
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-[52px] shrink-0 items-center border-b px-4 md:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-1 gap-4 p-6">
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-7 w-72 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Breadcrumb header */}
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b px-4 md:px-6">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{projectName ?? t('tickets.backToProject')}</span>
          <span className="sm:hidden">{t('common.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          {canEdit && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">{t('common.edit')}</span>
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTicket.isPending}
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">{t('common.delete')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left / main scrollable column */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
            {/* Title block */}
            <h1 className="font-heading text-xl font-semibold leading-snug md:text-2xl">
              {ticket.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('tickets.created', { date: formatDate(ticket.created_at) })}
            </p>

            {/* Mobile properties strip */}
            {!editing && (
              <div className="mt-4 rounded-xl border bg-muted/30 p-4 md:hidden">
                <PropertiesPanel ticket={ticket} parentTicket={parentTicket} t={t} />
              </div>
            )}

            <div className="mt-6 flex flex-col gap-6">
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
                <>
                  {ticket.description && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t('tickets.description')}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                    </div>
                  )}

                  {canEdit && ticket.recurrence_frequency && (
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
                  )}
                </>
              )}

              <Separator />
              <TicketSubtasks ticketId={ticket.id} projectId={projectId!} canEdit={canEdit} />

              <Separator />
              <TicketComments ticketId={ticket.id} />

              <Separator />
              <div>
                <h3 className="mb-4 text-sm font-medium">{t('activity.title')}</h3>
                <TicketActivityFeed ticketId={ticket.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Right rail — desktop only */}
        <div className="hidden w-[260px] shrink-0 overflow-y-auto border-l p-5 md:block">
          <PropertiesPanel ticket={ticket} parentTicket={parentTicket} t={t} />
        </div>
      </div>
    </div>
  )
}
