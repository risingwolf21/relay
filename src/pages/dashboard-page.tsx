import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Layers,
  LayoutList,
  User,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth-context'
import { useAllTickets } from '@/hooks/use-tickets'
import { useProjects } from '@/hooks/use-projects'
import { useDashboardActivity } from '@/hooks/use-ticket-activity'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  OPEN_STATUSES,
  PRIORITY_RANK,
  TICKET_STATUSES,
  formatDate,
  getInitials,
  priorityConfig,
  statusConfig,
  timeAgo,
} from '@/lib/ticket-utils'
import type { Ticket, TicketPriority, TicketStatus } from '@/types/database'

type DashLayout = 'overview' | 'focus'

// ── helpers ──────────────────────────────────────────────────────────────────

function useGreeting() {
  const { t } = useTranslation()
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.goodMorning')
  if (h < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
}

function isOverdue(t: Ticket): boolean {
  return !!t.due_date && new Date(t.due_date) < new Date() && OPEN_STATUSES.has(t.status)
}

function sortByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      (PRIORITY_RANK[b.priority as TicketPriority] ?? 0) -
      (PRIORITY_RANK[a.priority as TicketPriority] ?? 0),
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  to,
}: {
  label: string
  value: number
  sub?: string
  icon: React.ElementType
  accent: string
  to?: string
}) {
  const inner = (
    <div className="flex flex-col gap-0 rounded-xl border bg-card p-4 shadow-xs transition-all duration-100 hover:shadow-sm hover:-translate-y-px">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className="flex size-[26px] items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${accent} 12%, white)`, color: accent }}
        >
          <Icon size={15} />
        </span>
      </div>
      <div className="text-[26px] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-xl border bg-card shadow-xs ${className}`}>
      {title && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h3 className="text-[13.5px] font-semibold">{title}</h3>
          <span className="flex-1" />
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function StatusBar({
  dist,
  statuses = TICKET_STATUSES,
}: {
  dist: Partial<Record<TicketStatus, number>>
  statuses?: TicketStatus[]
}) {
  const total = statuses.reduce((s, k) => s + (dist[k] ?? 0), 0) || 1
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" style={{ gap: 2 }}>
      {statuses.map((s) => {
        const n = dist[s] ?? 0
        if (!n) return null
        return (
          <div
            key={s}
            title={`${statusConfig[s].label}: ${n}`}
            style={{ width: `${(n / total) * 100}%`, background: statusConfig[s].color }}
          />
        )
      })}
    </div>
  )
}

function MiniTicketRow({ ticket }: { ticket: Ticket }) {
  const overdue = isOverdue(ticket)
  const PriIcon = priorityConfig[ticket.priority].icon
  return (
    <Link
      to={`/projects/${ticket.project_id}/tickets/${ticket.id}`}
      className="flex h-10 w-full items-center gap-2.5 border-b px-4 text-sm transition-colors last:border-0 hover:bg-muted/50"
    >
      <PriIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate font-normal">{ticket.title}</span>
      {ticket.due_date && (
        <span
          className={`shrink-0 text-xs ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
        >
          {formatDate(ticket.due_date)}
        </span>
      )}
      {ticket.assignee && (
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
          <AvatarFallback className="text-[9px]">
            {getInitials(ticket.assignee.full_name, ticket.assignee.email ?? '')}
          </AvatarFallback>
        </Avatar>
      )}
    </Link>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-4 py-5 text-center text-sm text-muted-foreground">{text}</p>
}

function FooterButton({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex w-full items-center justify-center gap-1.5 border-t px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted/40"
    >
      {label}
      <ArrowRight className="size-3" />
    </Link>
  )
}

function ActivityRow({
  item,
}: {
  item: ReturnType<typeof useDashboardActivity>['data'] extends (infer T)[] | undefined ? T : never
}) {
  if (!item) return null
  const name = item.actor?.full_name || item.actor?.email || 'Someone'
  const initials = getInitials(item.actor?.full_name, item.actor?.email ?? '')

  const verb =
    item.type === 'created'
      ? 'opened'
      : item.type === 'assigned'
        ? 'assigned'
        : item.type === 'status_changed'
          ? 'updated'
          : 'updated'

  const preview = item.ticket?.title ?? ''

  return (
    <Link
      to={item.ticket ? `/projects/${item.ticket.project_id}/tickets/${item.ticket.id}` : '#'}
      className="flex gap-2.5 px-4 py-2 transition-colors hover:bg-muted/40"
    >
      <Avatar className="mt-0.5 size-6 shrink-0">
        <AvatarImage src={item.actor?.avatar_url ?? undefined} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">{name}</span> {verb}
          <span className="ml-1 text-[11px] text-muted-foreground/60">· {timeAgo(item.created_at)}</span>
        </div>
        <div className="truncate text-xs text-zinc-500">{preview}</div>
      </div>
    </Link>
  )
}

// ── Overview layout ───────────────────────────────────────────────────────────

function OverviewDashboard({
  allTickets,
  projects,
  activity,
  userId,
}: {
  allTickets: Ticket[]
  projects: ReturnType<typeof useProjects>['data']
  activity: ReturnType<typeof useDashboardActivity>['data']
  userId: string
}) {
  const { t } = useTranslation()

  const open = allTickets.filter((t) => OPEN_STATUSES.has(t.status))
  const mine = open.filter((t) => t.assignee_id === userId)
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 86_400_000)
  const dueSoon = open.filter(
    (t) => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= weekLater,
  )
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < now)
  const done = allTickets.filter((t) => t.status === 'done')
  const inProgress = allTickets.filter((t) => t.status === 'in_progress')
  const highPriMine = mine.filter(
    (t) => t.priority === 'high' || t.priority === 'urgent',
  ).length

  const myOpenSorted = sortByPriority(mine).slice(0, 6)

  const byProject = (projects ?? []).map((p) => {
    const ts = allTickets.filter((t) => t.project_id === p.id)
    const dist = TICKET_STATUSES.reduce(
      (acc, s) => ({ ...acc, [s]: ts.filter((t) => t.status === s).length }),
      {} as Record<TicketStatus, number>,
    )
    const total = ts.length
    const doneN = dist.done ?? 0
    const pct = total ? Math.round((doneN / total) * 100) : 0
    const openN = total - doneN
    return { project: p, total, dist, pct, openN }
  })

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard
          label={t('dashboard.openTickets')}
          value={open.length}
          sub={`${inProgress.length} ${t('dashboard.inProgress')}`}
          icon={Layers}
          accent="#4f46e5"
        />
        <StatCard
          label={t('dashboard.assignedToMe')}
          value={mine.length}
          sub={`${highPriMine} ${t('dashboard.highPriority')}`}
          icon={User}
          accent="#ea580c"
          to="/my-tickets"
        />
        <StatCard
          label={t('dashboard.dueThisWeek')}
          value={dueSoon.length}
          sub={`${overdue.length} ${t('tickets.overdue').toLowerCase()}`}
          icon={Calendar}
          accent="#0891b2"
        />
        <StatCard
          label={t('dashboard.completed')}
          value={done.length}
          sub={t('dashboard.allTime')}
          icon={CheckCircle2}
          accent="#16a34a"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel
            title={t('dashboard.myOpenTickets')}
            action={
              <Link to="/my-tickets" className="flex items-center gap-1 text-xs font-medium text-primary">
                {t('dashboard.viewAll')} <ArrowRight className="size-3" />
              </Link>
            }
          >
            {myOpenSorted.length ? (
              myOpenSorted.map((t) => <MiniTicketRow key={t.id} ticket={t} />)
            ) : (
              <EmptyRow text={t('dashboard.nothingAssigned')} />
            )}
          </Panel>

          <Panel title={t('dashboard.projectProgress')}>
            {byProject.length === 0 ? (
              <EmptyRow text={t('projects.noProjects')} />
            ) : (
              byProject.map(({ project, dist, pct, openN }) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ background: '#4f46e5' }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {project.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {openN} open · {pct}%
                    </span>
                  </div>
                  <StatusBar dist={dist} />
                </Link>
              ))
            )}
          </Panel>
        </div>

        <Panel title={t('dashboard.recentActivity')} className="self-start">
          {activity && activity.length > 0 ? (
            activity.slice(0, 9).map((a) => <ActivityRow key={a.id} item={a} />)
          ) : (
            <EmptyRow text={t('dashboard.noActivity')} />
          )}
        </Panel>
      </div>
    </>
  )
}

// ── Focus layout ──────────────────────────────────────────────────────────────

function FocusDashboard({
  allTickets,
  activity,
  userId,
}: {
  allTickets: Ticket[]
  activity: ReturnType<typeof useDashboardActivity>['data']
  userId: string
}) {
  const { t } = useTranslation()

  const open = allTickets.filter((t) => OPEN_STATUSES.has(t.status))
  const mine = sortByPriority(open.filter((t) => t.assignee_id === userId))
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < new Date())
  const dueList = open
    .filter((t) => t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 6)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Panel
        title={t('dashboard.assignedToYou')}
        action={
          <span className="text-xs text-muted-foreground">{mine.length}</span>
        }
      >
        {mine.length ? (
          <>
            {mine.map((ticket) => (
              <MiniTicketRow key={ticket.id} ticket={ticket} />
            ))}
            <FooterButton to="/my-tickets" label={t('dashboard.viewAllMyTickets')} />
          </>
        ) : (
          <>
            <EmptyRow text={t('dashboard.nothingAssigned')} />
            <FooterButton to="/my-tickets" label={t('dashboard.viewAllMyTickets')} />
          </>
        )}
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel
          title={t('dashboard.dueSoon')}
          action={<Calendar className="size-3.5 text-muted-foreground" />}
        >
          {dueList.length ? (
            dueList.map((ticket) => <MiniTicketRow key={ticket.id} ticket={ticket} />)
          ) : (
            <EmptyRow text={t('dashboard.noUpcomingDueDates')} />
          )}
        </Panel>

        <Panel title={t('dashboard.recentActivity')} className="self-start">
          {activity && activity.length > 0 ? (
            activity.slice(0, 5).map((a) => <ActivityRow key={a.id} item={a} />)
          ) : (
            <EmptyRow text={t('dashboard.noActivity')} />
          )}
        </Panel>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { profile, user } = useAuth()
  const { t } = useTranslation()
  const greeting = useGreeting()
  const [layout, setLayout] = useState<DashLayout>(() => {
    return (localStorage.getItem('dash-layout') as DashLayout) ?? 'overview'
  })
  const [createOpen, setCreateOpen] = useState(false)

  const { data: allTickets = [], isLoading: ticketsLoading } = useAllTickets()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: activity } = useDashboardActivity(12)

  const isLoading = ticketsLoading || projectsLoading

  function setLayoutStored(l: DashLayout) {
    setLayout(l)
    localStorage.setItem('dash-layout', l)
  }

  const open = allTickets.filter((t) => OPEN_STATUSES.has(t.status))
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < new Date())
  const mine = open.filter((t) => t.assignee_id === user?.id)

  const subtitle =
    layout === 'focus'
      ? t('dashboard.summaryFocus', { mine: mine.length, overdue: overdue.length })
      : t('dashboard.summaryOpen', { open: open.length, count: projects.length })

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em]">
            {profile?.full_name
              ? `${greeting}, ${profile.full_name.split(' ')[0]}`
              : greeting}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Layout toggle */}
          <div className="flex rounded-md border bg-muted p-0.5">
            {(['overview', 'focus'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayoutStored(l)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  layout === l
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l === 'overview' ? (
                  <Layers className="size-3" />
                ) : (
                  <Zap className="size-3" />
                )}
                {t(`dashboard.${l}`)}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            {t('projects.new')}
          </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      ) : layout === 'focus' ? (
        <FocusDashboard allTickets={allTickets} activity={activity} userId={user?.id ?? ''} />
      ) : (
        <OverviewDashboard
          allTickets={allTickets}
          projects={projects}
          activity={activity}
          userId={user?.id ?? ''}
        />
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
