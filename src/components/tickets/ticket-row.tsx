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
import { priorityConfig, statusConfig, formatDate, getInitials } from '@/lib/ticket-utils'
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
      className="group flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/40"
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

      <p className="flex-1 truncate text-sm font-medium">{ticket.title}</p>

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

      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(ticket.created_at)}
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
