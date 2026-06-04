import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjects } from '@/hooks/use-projects'
import { useCreateSavedSearch, useUpdateSavedSearch } from '@/hooks/use-saved-searches'
import { useAuth } from '@/contexts/auth-context'
import type { SavedSearch, SearchFilters, TicketStatus, TicketPriority } from '@/types/database'
import { TICKET_STATUSES } from '@/lib/ticket-utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

const DEFAULT_FILTERS: SearchFilters = {
  project_ids: [],
  statuses: [],
  priorities: [],
  assignee_me: false,
  text: '',
}

interface SavedSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing?: SavedSearch
}

export function SavedSearchDialog({ open, onOpenChange, existing }: SavedSearchDialogProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { data: projects = [] } = useProjects()
  const createSearch = useCreateSavedSearch()
  const updateSearch = useUpdateSavedSearch()

  const [name, setName] = useState(existing?.name ?? '')
  const [filters, setFilters] = useState<SearchFilters>(existing?.filters ?? DEFAULT_FILTERS)

  function toggle<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  function handleClose() {
    setName(existing?.name ?? '')
    setFilters(existing?.filters ?? DEFAULT_FILTERS)
    onOpenChange(false)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (existing) {
      await updateSearch.mutateAsync({ id: existing.id, name: name.trim(), filters })
    } else {
      await createSearch.mutateAsync({ name: name.trim(), filters })
    }
    handleClose()
  }

  const isPending = createSearch.isPending || updateSearch.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? t('search.editSaved') : t('search.newSaved')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>{t('search.name')}</Label>
            <Input
              placeholder={t('search.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>{t('search.titleContains')}</Label>
            <Input
              placeholder={t('search.searchTextPlaceholder')}
              value={filters.text}
              onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value }))}
            />
          </div>

          {projects.length > 0 && (
            <div className="grid gap-1.5">
              <Label>{t('search.projectsFilter')}</Label>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, project_ids: toggle(f.project_ids, p.id) }))
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      filters.project_ids.includes(p.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {filters.project_ids.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('search.allProjects')}</p>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>{t('search.statusFilter')}</Label>
            <div className="flex flex-wrap gap-2">
              {TICKET_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s as TicketStatus) }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    filters.statuses.includes(s)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
            {filters.statuses.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('search.allStatuses')}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>{t('search.priorityFilter')}</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      priorities: toggle(f.priorities, p as TicketPriority),
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    filters.priorities.includes(p)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {t(`priority.${p}`)}
                </button>
              ))}
            </div>
            {filters.priorities.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('search.allPriorities')}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={filters.assignee_me}
              onChange={(e) => setFilters((f) => ({ ...f, assignee_me: e.target.checked }))}
            />
            <span className="text-sm">{t('search.assignedToMe', { email: user?.email })}</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending ? t('common.saving') : existing ? t('search.updateSearch') : t('search.saveSearch')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
