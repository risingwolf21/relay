import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDashboardActivity } from '@/hooks/use-ticket-activity'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInitials, timeAgo } from '@/lib/ticket-utils'

export function InboxPage() {
  const { t } = useTranslation()
  const { data: activity = [], isLoading } = useDashboardActivity(50)

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em]">
          {t('inbox.title')}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('inbox.subtitle')}</p>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t('inbox.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          {activity.map((item, idx) => {
            const name = item.actor?.full_name || item.actor?.email || 'Someone'
            const initials = getInitials(item.actor?.full_name, item.actor?.email ?? '')
            const verb =
              item.type === 'created'
                ? 'opened'
                : item.type === 'assigned'
                  ? 'assigned'
                  : item.type === 'status_changed'
                    ? 'updated status on'
                    : item.type === 'comment'
                      ? 'commented on'
                      : 'updated'

            return (
              <Link
                key={item.id}
                to={
                  item.ticket
                    ? `/projects/${item.ticket.project_id}/tickets/${item.ticket.id}`
                    : '#'
                }
                className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${
                  idx < activity.length - 1 ? 'border-b' : ''
                }`}
              >
                <Avatar className="mt-0.5 size-7 shrink-0">
                  <AvatarImage src={item.actor?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{name}</span>{' '}
                    <span className="text-muted-foreground">{verb}</span>
                    {item.ticket && (
                      <>
                        {' '}
                        <span className="font-medium text-foreground">{item.ticket.title}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">{timeAgo(item.created_at)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
