import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, RefreshCw, Calendar, Link2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useUpdateTicket, useDeleteTicket, useCreateTicket } from '@/hooks/use-tickets'
import { TicketSubtasks } from '@/components/tickets/ticket-subtasks'
import { LabelSelector } from '@/components/tickets/label-selector'
import { useProjectMembers, type MemberWithProfile } from '@/hooks/use-members'
import { useAuth } from '@/contexts/auth-context'
import { TicketComments } from '@/components/tickets/ticket-comments'
import { TicketActivityFeed } from '@/components/tickets/ticket-activity-feed'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  priorityConfig,
  statusConfig,
  formatDate,
  getInitials,
  TICKET_STATUSES,
} from '@/lib/ticket-utils'
import type {
  Ticket,
  ProjectRole,
  RecurrenceFrequency,
  TicketStatus,
  TicketPriority,
} from '@/types/database'
import { cn } from '@/lib/utils'

const RECURRENCE_OPTIONS: RecurrenceFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly']

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
        .select('*, assignee:profiles!tickets_assignee_id_fkey(*), labels:ticket_labels(label_id, label:labels(*))')
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

function DueDatePicker({
  value,
  onChange,
  t,
}: {
  value: string | null
  onChange: (date: string | null) => void
  t: (key: string) => string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="-mx-1.5 -my-0.5 inline-flex cursor-pointer items-center rounded px-1.5 py-0.5 transition-colors hover:bg-accent" />
        }
      >
        {value ? (
          <DueDateDisplay dueDate={value} t={t} />
        ) : (
          <span className="text-muted-foreground">{t('tickets.noDueDate')}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex flex-col gap-2">
          <input
            type="date"
            defaultValue={value ?? ''}
            onChange={(e) => {
              onChange(e.target.value || null)
              setOpen(false)
            }}
            className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          {value && (
            <button
              className="flex items-center gap-1 text-left text-xs text-muted-foreground transition-colors hover:text-destructive"
              onClick={() => { onChange(null); setOpen(false) }}
            >
              <X className="size-3" />
              {t('tickets.clearDate')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type TicketPropertyUpdate = {
  status?: TicketStatus
  priority?: TicketPriority
  assignee_id?: string | null
  due_date?: string | null
  recurrence_frequency?: RecurrenceFrequency | null
}

interface PropertiesPanelProps {
  ticket: Ticket
  parentTicket: { id: string; title: string; project_id: string } | null | undefined
  t: (key: string, opts?: Record<string, unknown>) => string
  canEdit: boolean
  projectId: string
  members: MemberWithProfile[]
  onUpdate: (updates: TicketPropertyUpdate) => void
  onCreateNextRecurrence: () => void
  isCreatingRecurrence: boolean
}

function PropertiesPanel({
  ticket,
  parentTicket,
  t,
  canEdit,
  projectId,
  members,
  onUpdate,
  onCreateNextRecurrence,
  isCreatingRecurrence,
}: PropertiesPanelProps) {
  const PriorityIcon = priorityConfig[ticket.priority].icon

  const editTriggerClass =
    '-mx-1.5 -my-0.5 inline-flex cursor-pointer items-center rounded px-1.5 py-0.5 transition-colors hover:bg-accent'

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <PropertyRow label={t('tickets.status')}>
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={editTriggerClass}>
              <Badge className={statusConfig[ticket.status].className}>
                {t(`status.${ticket.status}`)}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {TICKET_STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => onUpdate({ status: s })}>
                  <Badge className={statusConfig[s].className}>{t(`status.${s}`)}</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge className={statusConfig[ticket.status].className}>
            {t(`status.${ticket.status}`)}
          </Badge>
        )}
      </PropertyRow>

      {/* Priority */}
      <PropertyRow label={t('tickets.priority')}>
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={editTriggerClass}>
              <Badge className={priorityConfig[ticket.priority].className}>
                <PriorityIcon className="size-3" />
                {t(`priority.${ticket.priority}`)}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['urgent', 'high', 'medium', 'low'] as TicketPriority[]).map((p) => {
                const Icon = priorityConfig[p].icon
                return (
                  <DropdownMenuItem key={p} onClick={() => onUpdate({ priority: p })}>
                    <Badge className={priorityConfig[p].className}>
                      <Icon className="size-3" />
                      {t(`priority.${p}`)}
                    </Badge>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge className={priorityConfig[ticket.priority].className}>
            <PriorityIcon className="size-3" />
            {t(`priority.${ticket.priority}`)}
          </Badge>
        )}
      </PropertyRow>

      {/* Assignee */}
      <PropertyRow label={t('tickets.assignee')}>
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={editTriggerClass}>
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
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {members.map((m) => (
                <DropdownMenuItem
                  key={m.user_id}
                  onClick={() => onUpdate({ assignee_id: m.user_id })}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={m.profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(m.profile.full_name, m.profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{m.profile.full_name || m.profile.email}</span>
                </DropdownMenuItem>
              ))}
              {ticket.assignee_id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUpdate({ assignee_id: null })}>
                    <X className="size-4" />
                    {t('tickets.unassigned')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : ticket.assignee ? (
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

      {/* Due date */}
      <PropertyRow label={t('tickets.dueDate')}>
        {canEdit ? (
          <DueDatePicker
            value={ticket.due_date}
            onChange={(date) => onUpdate({ due_date: date })}
            t={t}
          />
        ) : ticket.due_date ? (
          <DueDateDisplay dueDate={ticket.due_date} t={t} />
        ) : (
          <span className="text-muted-foreground">{t('tickets.noDueDate')}</span>
        )}
      </PropertyRow>

      {/* Recurrence */}
      <PropertyRow label={t('tickets.recurrence')}>
        {canEdit ? (
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className={editTriggerClass}>
                {ticket.recurrence_frequency ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <RefreshCw className="size-3.5 text-muted-foreground" />
                    {t(`tickets.recurrence_${ticket.recurrence_frequency}`)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{t('tickets.noRecurrence')}</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {RECURRENCE_OPTIONS.map((freq) => (
                  <DropdownMenuItem key={freq} onClick={() => onUpdate({ recurrence_frequency: freq })}>
                    <RefreshCw className="size-3.5" />
                    {t(`tickets.recurrence_${freq}`)}
                  </DropdownMenuItem>
                ))}
                {ticket.recurrence_frequency && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onUpdate({ recurrence_frequency: null })}>
                      <X className="size-4" />
                      {t('tickets.noRecurrence')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {ticket.recurrence_frequency && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onCreateNextRecurrence}
                disabled={isCreatingRecurrence}
              >
                <RefreshCw className="size-3" />
                {t('tickets.createNextRecurrence')}
              </Button>
            )}
          </div>
        ) : ticket.recurrence_frequency ? (
          <div className="flex items-center gap-1.5 text-sm">
            <RefreshCw className="size-3.5 text-muted-foreground" />
            {t(`tickets.recurrence_${ticket.recurrence_frequency}`)}
          </div>
        ) : (
          <span className="text-muted-foreground">{t('tickets.noRecurrence')}</span>
        )}
      </PropertyRow>

      {/* Parent ticket (read-only) */}
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

      {/* Labels */}
      <PropertyRow label={t('tickets.labels')}>
        <LabelSelector
          ticketId={ticket.id}
          projectId={projectId}
          ticketLabels={ticket.labels ?? []}
          canEdit={canEdit}
        />
      </PropertyRow>

      <Separator />

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>{t('tickets.created', { date: formatDate(ticket.created_at) })}</span>
      </div>
    </div>
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

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  // Inline description editing
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ticket && !editingTitle) setTitleValue(ticket.title)
  }, [ticket?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ticket && !editingDesc) setDescValue(ticket.description ?? '')
  }, [ticket?.description]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingTitle) titleRef.current?.select()
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc) descRef.current?.focus()
  }, [editingDesc])

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

  function handleUpdate(updates: TicketPropertyUpdate) {
    if (!ticket) return
    updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, ...updates })
  }

  function saveTitleEdit() {
    if (!ticket) return
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== ticket.title) {
      updateTicket.mutate({ id: ticket.id, project_id: ticket.project_id, title: trimmed })
    } else {
      setTitleValue(ticket.title)
    }
    setEditingTitle(false)
  }

  function saveDescEdit() {
    if (!ticket) return
    const trimmed = descValue.trim()
    const current = ticket.description ?? ''
    if (trimmed !== current) {
      updateTicket.mutate({
        id: ticket.id,
        project_id: ticket.project_id,
        description: trimmed || undefined,
      })
    }
    setEditingDesc(false)
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

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left / main scrollable column */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
            {/* Title block */}
            {ticket.number != null && (
              <p className="mb-1 font-mono text-xs text-muted-foreground/60">#{ticket.number}</p>
            )}

            {editingTitle && canEdit ? (
              <input
                ref={titleRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); saveTitleEdit() }
                  if (e.key === 'Escape') { setTitleValue(ticket.title); setEditingTitle(false) }
                }}
                className="w-full bg-transparent font-heading text-xl font-semibold leading-snug outline-none ring-1 ring-ring rounded-md px-1 md:text-2xl"
              />
            ) : (
              <h1
                className={cn(
                  'font-heading text-xl font-semibold leading-snug md:text-2xl',
                  canEdit && 'cursor-text rounded-md px-1 -mx-1 hover:bg-muted/50 transition-colors',
                )}
                onClick={() => canEdit && setEditingTitle(true)}
              >
                {ticket.title}
              </h1>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              {t('tickets.created', { date: formatDate(ticket.created_at) })}
            </p>

            {/* Mobile properties strip */}
            <div className="mt-4 rounded-xl border bg-muted/30 p-4 md:hidden">
              <PropertiesPanel
                ticket={ticket}
                parentTicket={parentTicket}
                t={t}
                canEdit={canEdit}
                projectId={projectId!}
                members={members}
                onUpdate={handleUpdate}
                onCreateNextRecurrence={handleCreateNextRecurrence}
                isCreatingRecurrence={createTicket.isPending}
              />
            </div>

            <div className="mt-6 flex flex-col gap-6">
              {/* Description — inline editable */}
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('tickets.description')}
                </p>
                {editingDesc && canEdit ? (
                  <textarea
                    ref={descRef}
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    onBlur={saveDescEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setDescValue(ticket.description ?? '')
                        setEditingDesc(false)
                      }
                    }}
                    rows={5}
                    placeholder={t('tickets.addDescription')}
                    className="w-full resize-none bg-transparent text-sm outline-none ring-1 ring-ring rounded-md px-2 py-1.5 placeholder:text-muted-foreground/50"
                  />
                ) : (
                  <div
                    className={cn(
                      'min-h-[2rem] rounded-md px-1 -mx-1',
                      canEdit && 'cursor-text hover:bg-muted/50 transition-colors',
                    )}
                    onClick={() => canEdit && setEditingDesc(true)}
                  >
                    {ticket.description ? (
                      <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50">
                        {canEdit ? t('tickets.addDescription') : '—'}
                      </p>
                    )}
                  </div>
                )}
              </div>

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
          <PropertiesPanel
            ticket={ticket}
            parentTicket={parentTicket}
            t={t}
            canEdit={canEdit}
            projectId={projectId!}
            members={members}
            onUpdate={handleUpdate}
            onCreateNextRecurrence={handleCreateNextRecurrence}
            isCreatingRecurrence={createTicket.isPending}
          />
        </div>
      </div>
    </div>
  )
}
