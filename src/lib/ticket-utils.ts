import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Circle,
  Minus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TicketPriority, TicketStatus } from '@/types/database'

export const TICKET_STATUSES: TicketStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
]

export interface PriorityConfig {
  label: string
  className: string
  icon: LucideIcon
}

export interface StatusConfig {
  label: string
  className: string
  dotClassName: string
}

export const priorityConfig: Record<TicketPriority, PriorityConfig> = {
  urgent: {
    label: 'Urgent',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
    icon: ArrowUp,
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
    icon: Minus,
  },
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground border-border',
    icon: ArrowDown,
  },
}

export const statusConfig: Record<TicketStatus, StatusConfig> = {
  backlog: {
    label: 'Backlog',
    className: 'bg-muted text-muted-foreground border-border',
    dotClassName: 'bg-muted-foreground',
  },
  todo: {
    label: 'To Do',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    dotClassName: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
    dotClassName: 'bg-violet-500',
  },
  in_review: {
    label: 'In Review',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    dotClassName: 'bg-amber-500',
  },
  done: {
    label: 'Done',
    className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
    dotClassName: 'bg-green-500',
  },
}

export function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.trim().slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(dateString),
  )
}

export const circleIcon = Circle
