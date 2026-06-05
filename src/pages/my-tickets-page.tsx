import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth-context'
import { useAllTickets } from '@/hooks/use-tickets'
import { useProjects } from '@/hooks/use-projects'
import { priorityConfig, statusConfig, OPEN_STATUSES, CLOSED_STATUSES, formatDate, getInitials } from '@/lib/ticket-utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Ticket, TicketStatus } from '@/types/database'

function TicketLine({ ticket, projectName }: { ticket: Ticket; projectName: string }) {
  const { t } = useTranslation()
  const PriorityIcon = priorityConfig[ticket.priority].icon
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = ticket.due_date && ticket.due_date < today && OPEN_STATUSES.has(ticket.status)

  return (
    <Link
      to={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
      className="group flex items-center gap-3 border-b px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-muted/40"
    >
      <PriorityIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate font-medium">{ticket.title}</span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{projectName}</span>
      <Badge className={`shrink-0 text-xs ${statusConfig[ticket.status].className}`}>
        {t(`status.${ticket.status}`)}
      </Badge>
      {ticket.due_date && (
        <span className={`hidden shrink-0 text-xs sm:block ${isOverdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
          {formatDate(ticket.due_date)}
        </span>
      )}
    </Link>
  )
}

export function MyTicketsPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { data: allTickets = [], isLoading } = useAllTickets()
  const { data: projects = [] } = useProjects()
  const [showClosed, setShowClosed] = useState(false)

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const myTickets = allTickets.filter((t) => t.assignee_id === user?.id)
  const openTickets = myTickets.filter((t) => OPEN_STATUSES.has(t.status))
  const closedTickets = myTickets.filter((t) => CLOSED_STATUSES.has(t.status))

  const byProject = new Map<string, Ticket[]>()
  for (const ticket of openTickets) {
    const arr = byProject.get(ticket.project_id) ?? []
    arr.push(ticket)
    byProject.set(ticket.project_id, arr)
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em]">
            {t('myTickets.title')}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('myTickets.subtitle')}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowClosed((v) => !v)}
        >
          {showClosed ? t('myTickets.hideClosed') : t('myTickets.showClosed')}
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : openTickets.length === 0 && !showClosed ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t('myTickets.noOpenTickets')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byProject.entries()).map(([projectId, tickets]) => {
            const project = projectMap.get(projectId)
            if (!project) return null
            return (
              <section key={projectId} className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="flex items-center gap-2 border-b px-4 py-2.5">
                  <span className="size-2 rounded-sm" style={{ background: '#4f46e5' }} />
                  <Link
                    to={`/projects/${projectId}`}
                    className="text-[13px] font-semibold transition-colors hover:text-primary"
                  >
                    {project.name}
                  </Link>
                  <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {tickets.length}
                  </span>
                </div>
                {tickets.map((ticket) => (
                  <TicketLine key={ticket.id} ticket={ticket} projectName={project.name} />
                ))}
              </section>
            )
          })}

          {showClosed && closedTickets.length > 0 && (
            <section className="overflow-hidden rounded-xl border bg-card shadow-xs opacity-70">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {t('myTickets.showClosed')} ({closedTickets.length})
                </span>
              </div>
              {closedTickets.map((ticket) => {
                const project = projectMap.get(ticket.project_id)
                return (
                  <TicketLine
                    key={ticket.id}
                    ticket={ticket}
                    projectName={project?.name ?? ''}
                  />
                )
              })}
            </section>
          )}

          {showClosed && closedTickets.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('myTickets.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
