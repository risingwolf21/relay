import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSubTickets, useCreateTicket, useUpdateTicket } from '@/hooks/use-tickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TicketSubtasksProps {
  ticketId: string
  projectId: string
  canEdit: boolean
}

export function TicketSubtasks({ ticketId, projectId, canEdit }: TicketSubtasksProps) {
  const { t } = useTranslation()
  const { data: subtasks = [] } = useSubTickets(ticketId)
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doneCount = subtasks.filter((s) => s.status === 'done').length
  const total = subtasks.length
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  async function handleCreate() {
    const title = newTitle.trim()
    if (!title) return
    await createTicket.mutateAsync({
      project_id: projectId,
      title,
      status: 'todo',
      priority: 'medium',
      parent_ticket_id: ticketId,
    })
    setNewTitle('')
  }

  function startAdding() {
    setIsAdding(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function cancelAdding() {
    setIsAdding(false)
    setNewTitle('')
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('subtasks.title')}
          {total > 0 && (
            <span className="ml-1 font-normal normal-case">
              ({doneCount}/{total})
            </span>
          )}
        </p>
        {canEdit && !isAdding && (
          <button
            onClick={startAdding}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3" />
            {t('subtasks.add')}
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {subtasks.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2">
              <button
                onClick={() =>
                  canEdit &&
                  updateTicket.mutate({
                    id: subtask.id,
                    project_id: subtask.project_id,
                    status: subtask.status === 'done' ? 'todo' : 'done',
                  })
                }
                disabled={!canEdit || updateTicket.isPending}
                className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-default ${
                  subtask.status === 'done'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/50 hover:border-primary'
                }`}
                aria-label={
                  subtask.status === 'done'
                    ? t('subtasks.markIncomplete')
                    : t('subtasks.markComplete')
                }
              >
                {subtask.status === 'done' && <Check className="size-2.5 stroke-[3]" />}
              </button>
              <Link
                to={`/projects/${projectId}/tickets/${subtask.id}`}
                className={`flex-1 truncate text-sm hover:underline ${
                  subtask.status === 'done' ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {subtask.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canEdit && isAdding && (
        <div className="mt-2 flex gap-2">
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('subtasks.titlePlaceholder')}
            className="h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
              if (e.key === 'Escape') cancelAdding()
            }}
          />
          <Button
            size="sm"
            className="h-7 shrink-0"
            onClick={handleCreate}
            disabled={!newTitle.trim() || createTicket.isPending}
          >
            {t('common.create')}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 shrink-0" onClick={cancelAdding}>
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {total === 0 && !isAdding && canEdit && (
        <button
          onClick={startAdding}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          + {t('subtasks.addFirst')}
        </button>
      )}
    </div>
  )
}
