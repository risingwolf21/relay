import { useTranslation } from 'react-i18next'
import { useTicketActivity } from '@/hooks/use-ticket-activity'
import { formatDate, getInitials } from '@/lib/ticket-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TicketActivity } from '@/types/database'

interface TicketActivityFeedProps {
  ticketId: string
}

export function TicketActivityFeed({ ticketId }: TicketActivityFeedProps) {
  const { t } = useTranslation()
  const { data: events = [], isLoading } = useTicketActivity(ticketId)

  function activityLabel(event: TicketActivity): { text: string; detail?: string } {
    const actor = event.actor?.full_name || event.actor?.email || 'Someone'
    switch (event.type) {
      case 'created':
        return { text: t('activity.created', { actor }) }
      case 'status_changed': {
        const oldLabel = event.old_value
          ? t(`status.${event.old_value}`, { defaultValue: event.old_value })
          : event.old_value
        const newLabel = event.new_value
          ? t(`status.${event.new_value}`, { defaultValue: event.new_value })
          : event.new_value
        return { text: t('activity.statusChanged', { actor }), detail: `${oldLabel} → ${newLabel}` }
      }
      case 'priority_changed': {
        const oldLabel = event.old_value
          ? t(`priority.${event.old_value}`, { defaultValue: event.old_value })
          : event.old_value
        const newLabel = event.new_value
          ? t(`priority.${event.new_value}`, { defaultValue: event.new_value })
          : event.new_value
        return { text: t('activity.priorityChanged', { actor }), detail: `${oldLabel} → ${newLabel}` }
      }
      case 'assigned':
        if (!event.new_value) return { text: t('activity.assigneeRemoved', { actor }) }
        if (!event.old_value) return { text: t('activity.assigned', { actor }) }
        return { text: t('activity.assigneeChanged', { actor }) }
      case 'title_changed':
        return { text: t('activity.renamed', { actor }) }
      default:
        return { text: t('activity.updated', { actor }) }
    }
  }

  // suppress unused import warning

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
    return <p className="text-sm text-muted-foreground">{t('activity.empty')}</p>
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
