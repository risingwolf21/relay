import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdateTicket, useDeleteTicket } from '@/hooks/use-tickets'
import type { MemberWithProfile } from '@/hooks/use-members'
import type { Ticket, ProjectRole } from '@/types/database'
import { TicketForm, type TicketFormValues } from './ticket-form'
import { TicketComments } from './ticket-comments'
import { TicketActivityFeed } from './ticket-activity-feed'
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
  const [editing, setEditing] = useState(false)

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
          {/* Edit form or read-only */}
          <div className="py-4">
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

          {/* Comments */}
          <div className="py-4">
            <TicketComments ticketId={ticket.id} />
          </div>

          <Separator />

          {/* Activity */}
          <div className="py-4">
            <h3 className="mb-4 text-sm font-medium">{t('activity.title')}</h3>
            <TicketActivityFeed ticketId={ticket.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
