import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { TicketPriority, RecurrenceFrequency } from '@/types/database'
import type { MemberWithProfile } from '@/hooks/use-members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TICKET_STATUSES } from '@/lib/ticket-utils'

const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low']
const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly']

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(10000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  recurrence_frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).nullable().optional(),
})

export type TicketFormValues = z.infer<typeof ticketSchema>

interface TicketFormProps {
  defaultValues?: Partial<TicketFormValues>
  members?: MemberWithProfile[]
  onSubmit: (values: TicketFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  submitDisabled?: boolean
}

export function TicketForm({
  defaultValues,
  members = [],
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  submitDisabled,
}: TicketFormProps) {
  const { t } = useTranslation()
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'backlog',
      priority: 'medium',
      assignee_id: null,
      due_date: null,
      recurrence_frequency: null,
      ...defaultValues,
    },
  })

  const label = submitLabel ?? t('common.save')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tickets.title')}</FormLabel>
              <FormControl>
                <Input placeholder={t('tickets.titlePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tickets.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('tickets.descriptionPlaceholder')}
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.status')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.priority')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`priority.${p}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.dueDate')}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recurrence_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.recurrenceFrequency')}</FormLabel>
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('tickets.noRecurrence')}</SelectItem>
                    {RECURRENCE_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {t(`tickets.recurrence_${f}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {members.length > 0 && (
          <FormField
            control={form.control}
            name="assignee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tickets.assignee')}</FormLabel>
                <Select
                  value={field.value ?? 'unassigned'}
                  onValueChange={(v) => field.onChange(v === 'unassigned' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tickets.unassigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t('tickets.unassigned')}</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name || m.profile?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || submitDisabled}>
            {isSubmitting ? t('common.saving') : label}
          </Button>
        </div>
      </form>
    </Form>
  )
}
