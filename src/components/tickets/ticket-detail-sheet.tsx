import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Trash2, RefreshCw, Calendar, Link2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useUpdateTicket, useDeleteTicket, useCreateTicket } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { Ticket, ProjectRole, RecurrenceFrequency } from '@/types/database'
import { TicketForm, type TicketFormValues } from './ticket-form'
import { TicketComments } from './ticket-comments'
import { TicketActivityFeed } from './ticket-activity-feed'
import { TicketSubtasks } from './ticket-subtasks'
import { LabelSelector } from './label-selector'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { priorityConfig, statusConfig, formatDate, getInitials } from '@/lib/ticket-utils'

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
  const { t } = useTranslation()
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

  if (!ticket) return null

  const canEdit = userRole === 'admin' || userRole === 'editor'
  const canDelete = userRole === 'admin'

  async function handleSubmit(values: TicketFormValues) {
    await updateTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id, ...values })
    setEditing(false)
  }

  async function handleDelete() {
    await deleteTicket.mutateAsync({ id: ticket!.id, project_id: ticket!.project_id })
    onOpenChange(false)
  }

  async function handleCreateNextRecurrence() {
    if (!ticket || !ticket.recurrence_frequency) return
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

  function handleOpenChange(next: boolean) {
    if (!next) setEditing(false)
    onOpenChange(next)
  }

  const PriorityIcon = priorityConfig[ticket.priority].icon

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-xl flex-col overflow-y-auto">
        <SheetHeader className="mb-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex items-center gap-1">
              {canEdit && !editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  {t('common.edit')}
                </Button>
              )}
              <Link
                to={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={t('nav.openFullPage')}
              >
                <ExternalLink className="size-3.5" />
                {t('nav.fullPage')}
              </Link>
            </div>
          </div>
          <SheetTitle className="text-left">{ticket.title}</SheetTitle>
          <SheetDescription className="text-left">
            {t('tickets.created', { date: formatDate(ticket.created_at) })}
          </SheetDescription>
        </SheetHeader>

        <Separator className="shrink-0" />

        <div className="flex-1 overflow-y-auto">
          <div className="py-4">
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
          </div>

          {!editing && (
            <>
              <Separator />
              <div className="py-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('tickets.labels')}
                </p>
                <LabelSelector
                  ticketId={ticket.id}
                  projectId={ticket.project_id}
                  ticketLabels={ticket.labels ?? []}
                  canEdit={canEdit}
                />
              </div>
            </>
          )}

          {!editing && (
            <>
              <Separator />
              <div className="py-4">
                <TicketSubtasks
                  ticketId={ticket.id}
                  projectId={ticket.project_id}
                  canEdit={canEdit}
                />
              </div>
            </>
          )}

          {canEdit && !editing && ticket.recurrence_frequency && (
            <>
              <Separator />
              <div className="py-4">
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

          {canDelete && !editing && (
            <>
              <Separator />
              <div className="py-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteTicket.isPending}
                >
                  <Trash2 className="size-4" />
                  {t('tickets.deleteTicket')}
                </Button>
              </div>
            </>
          )}

          <Separator />

          <div className="py-4">
            <TicketComments ticketId={ticket.id} />
          </div>

          <Separator />

          <div className="py-4">
            <h3 className="mb-4 text-sm font-medium">{t('activity.title')}</h3>
            <TicketActivityFeed ticketId={ticket.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
