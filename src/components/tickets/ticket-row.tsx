import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Ticket, ProjectRole } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { priorityConfig, statusConfig, timeAgo, getInitials } from '@/lib/ticket-utils'
import { LabelChip } from './label-chip'
import { useDeleteTicket } from '@/hooks/use-tickets'

interface TicketRowProps {
  ticket: Ticket
  userRole: ProjectRole | null
  onClick: () => void
}

export function TicketRow({ ticket, userRole, onClick }: TicketRowProps) {
  const deleteTicket = useDeleteTicket()
  const { t } = useTranslation()
  const PriorityIcon = priorityConfig[ticket.priority].icon
  const canDelete = userRole === 'admin'

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition-colors last:border-0 hover:bg-muted/40"
      onClick={onClick}
    >
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${priorityConfig[ticket.priority].className}`}
          >
            <PriorityIcon className="size-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{t(`priority.${ticket.priority}`)} priority</TooltipContent>
      </Tooltip>

      {ticket.number != null && (
        <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground/60 sm:block">
          #{ticket.number}
        </span>
      )}

      <p className="flex-1 truncate text-sm font-medium">{ticket.title}</p>

      {ticket.labels && ticket.labels.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {ticket.labels.slice(0, 2).map((tl) => (
            <LabelChip key={tl.label_id} label={tl.label} size="xs" />
          ))}
          {ticket.labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{ticket.labels.length - 2}</span>
          )}
        </div>
      )}

      <Badge className={`shrink-0 text-xs ${statusConfig[ticket.status].className}`}>
        {t(`status.${ticket.status}`)}
      </Badge>

      {ticket.assignee ? (
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={ticket.assignee.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {getInitials(ticket.assignee.full_name, ticket.assignee.email)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{ticket.assignee.full_name || ticket.assignee.email}</TooltipContent>
        </Tooltip>
      ) : (
        <div className="size-6 shrink-0" />
      )}

      <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground sm:block">
        {timeAgo(ticket.updated_at)}
      </span>

      {canDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="shrink-0 opacity-0 group-hover:opacity-100 inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteTicket.mutate({ id: ticket.id, project_id: ticket.project_id })
              }}
            >
              <Trash2 className="size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
