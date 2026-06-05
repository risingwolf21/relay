import { useState } from 'react'
import { Plus, Check, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLabels, useCreateLabel, useAddTicketLabel, useRemoveTicketLabel } from '@/hooks/use-labels'
import type { Label, TicketLabelJoin } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LabelChip } from './label-chip'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
  '#64748b', '#0ea5e9',
]

interface LabelSelectorProps {
  ticketId: string
  projectId: string
  ticketLabels: TicketLabelJoin[]
  canEdit: boolean
}

export function LabelSelector({ ticketId, projectId, ticketLabels, canEdit }: LabelSelectorProps) {
  const { t } = useTranslation()
  const { data: projectLabels = [] } = useLabels(projectId)
  const createLabel = useCreateLabel()
  const addLabel = useAddTicketLabel()
  const removeLabel = useRemoveTicketLabel()

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[5])
  const [creating, setCreating] = useState(false)

  const activeIds = new Set(ticketLabels.map((tl) => tl.label_id))

  function toggleLabel(label: Label) {
    if (!canEdit) return
    if (activeIds.has(label.id)) {
      removeLabel.mutate({ ticketId, labelId: label.id })
    } else {
      addLabel.mutate({ ticketId, labelId: label.id })
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const label = await createLabel.mutateAsync({
      projectId,
      name: newName.trim(),
      color: newColor,
    })
    addLabel.mutate({ ticketId, labelId: label.id })
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ticketLabels.map((tl) => (
        <LabelChip
          key={tl.label_id}
          label={tl.label}
          onRemove={canEdit ? () => removeLabel.mutate({ ticketId, labelId: tl.label_id }) : undefined}
        />
      ))}

      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                <Tag className="size-3" />
                {t('tickets.addLabel')}
              </button>
            }
          />
          <PopoverContent className="w-56 p-2" align="start">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{t('tickets.labels')}</div>

            {projectLabels.length === 0 && !creating && (
              <p className="px-1 py-2 text-xs text-muted-foreground">{t('labels.noLabels')}</p>
            )}

            {projectLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => toggleLabel(label)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <Check
                  className={`size-3 shrink-0 ${activeIds.has(label.id) ? 'opacity-100' : 'opacity-0'}`}
                />
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: label.color }}
                />
                <span className="flex-1 truncate text-left">{label.name}</span>
              </button>
            ))}

            {creating ? (
              <div className="mt-2 flex flex-col gap-2 border-t pt-2">
                <Input
                  autoFocus
                  placeholder={t('labels.namePlaceholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') setCreating(false)
                  }}
                  className="h-7 text-xs"
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`size-4 rounded-full border-2 transition-transform ${
                        newColor === c ? 'scale-125 border-foreground' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 flex-1 text-xs" onClick={handleCreate} disabled={!newName.trim() || createLabel.isPending}>
                    {t('labels.create')}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setCreating(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-3" />
                {t('tickets.createLabel')}
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
