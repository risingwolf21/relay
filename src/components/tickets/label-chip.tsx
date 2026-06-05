import { X } from 'lucide-react'
import type { Label } from '@/types/database'

interface LabelChipProps {
  label: Label
  onRemove?: () => void
  size?: 'sm' | 'xs'
}

export function LabelChip({ label, onRemove, size = 'sm' }: LabelChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        size === 'xs' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
      style={{
        background: `${label.color}18`,
        borderColor: `${label.color}40`,
        color: label.color,
      }}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded-full opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  )
}
