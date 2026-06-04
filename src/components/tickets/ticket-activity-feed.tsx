import { useTicketActivity } from '@/hooks/use-ticket-activity'
import { statusConfig, priorityConfig, formatDate, getInitials } from '@/lib/ticket-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TicketActivity } from '@/types/database'

function activityLabel(event: TicketActivity): { text: string; detail?: string } {
  const actor = event.actor?.full_name || event.actor?.email || 'Someone'
  switch (event.type) {
    case 'created':
      return { text: `${actor} created this ticket` }
    case 'status_changed': {
      const oldLabel = event.old_value ? statusConfig[event.old_value as keyof typeof statusConfig]?.label : event.old_value
      const newLabel = event.new_value ? statusConfig[event.new_value as keyof typeof statusConfig]?.label : event.new_value
      return { text: `${actor} changed status`, detail: `${oldLabel} → ${newLabel}` }
    }
    case 'priority_changed': {
      const oldLabel = event.old_value ? priorityConfig[event.old_value as keyof typeof priorityConfig]?.label : event.old_value
      const newLabel = event.new_value ? priorityConfig[event.new_value as keyof typeof priorityConfig]?.label : event.new_value
      return { text: `${actor} changed priority`, detail: `${oldLabel} → ${newLabel}` }
    }
    case 'assigned':
      if (!event.new_value) return { text: `${actor} removed assignee` }
      if (!event.old_value) return { text: `${actor} assigned this ticket` }
      return { text: `${actor} changed assignee` }
    case 'title_changed':
      return { text: `${actor} renamed this ticket` }
    default:
      return { text: `${actor} updated this ticket` }
  }
}

interface TicketActivityFeedProps {
  ticketId: string
}

export function TicketActivityFeed({ ticketId }: TicketActivityFeedProps) {
  const { data: events = [], isLoading } = useTicketActivity(ticketId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-5 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => {
        const { text, detail } = activityLabel(event)
        return (
          <div key={event.id} className="flex items-start gap-2">
            <Avatar className="mt-0.5 size-5 shrink-0">
              <AvatarImage src={event.actor?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {getInitials(event.actor?.full_name, event.actor?.email ?? '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-sm">{text}</span>
              {detail && (
                <span className="text-xs font-medium text-foreground/70">{detail}</span>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
