import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Ticket } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { priorityConfig, getInitials, OPEN_STATUSES } from '@/lib/ticket-utils'
import { LabelChip } from './label-chip'
import { cn } from '@/lib/utils'

interface TicketCardProps {
  ticket: Ticket
  onClick: () => void
  isDragOverlay?: boolean
}

export function TicketCard({ ticket, onClick, isDragOverlay = false }: TicketCardProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: isDragOverlay })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const PriorityIcon = priorityConfig[ticket.priority].icon
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = ticket.due_date && ticket.due_date < today && OPEN_STATUSES.has(ticket.status)
  const isDueToday = ticket.due_date === today

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card p-3 shadow-xs transition-shadow',
        isDragging && 'opacity-40 border-dashed',
        isDragOverlay && 'shadow-md cursor-grabbing',
        !isDragging && !isDragOverlay && 'hover:shadow-sm cursor-pointer',
      )}
      onClick={!isDragging ? onClick : undefined}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab touch-none rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5 text-muted-foreground" />
      </div>

      <div className="ml-3 flex flex-col gap-2">
        {ticket.number != null && (
          <span className="font-mono text-[10px] text-muted-foreground/50">#{ticket.number}</span>
        )}
        <p className="text-sm font-medium leading-snug">{ticket.title}</p>

        {ticket.labels && ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.slice(0, 3).map((tl) => (
              <LabelChip key={tl.label_id} label={tl.label} size="xs" />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${priorityConfig[ticket.priority].className}`}
              >
                <PriorityIcon className="size-3" />
                {t(`priority.${ticket.priority}`)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('tickets.priority_label', { priority: t(`priority.${ticket.priority}`) })}</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5">
            {ticket.due_date && (
              <span
                className={`flex items-center gap-0.5 text-[10px] ${
                  isOverdue
                    ? 'font-medium text-destructive'
                    : isDueToday
                      ? 'font-medium text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                }`}
              >
                <Calendar className="size-2.5" />
                {new Date(ticket.due_date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}

            {ticket.assignee && (
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <Avatar className="size-5">
                    <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(ticket.assignee.full_name, ticket.assignee.email)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {ticket.assignee.full_name || ticket.assignee.email}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
