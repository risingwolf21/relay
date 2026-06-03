import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Ticket } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { priorityConfig, getInitials } from '@/lib/ticket-utils'
import { cn } from '@/lib/utils'

interface TicketCardProps {
  ticket: Ticket
  onClick: () => void
  isDragOverlay?: boolean
}

export function TicketCard({ ticket, onClick, isDragOverlay = false }: TicketCardProps) {
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
        <p className="text-sm font-medium leading-snug">{ticket.title}</p>
        <div className="flex items-center justify-between gap-2">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${priorityConfig[ticket.priority].className}`}
              >
                <PriorityIcon className="size-3" />
                {priorityConfig[ticket.priority].label}
              </span>
            </TooltipTrigger>
            <TooltipContent>Priority: {priorityConfig[ticket.priority].label}</TooltipContent>
          </Tooltip>

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
  )
}
