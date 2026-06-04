import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useCreateProject } from '@/hooks/use-projects'
import { toSlug } from '@/lib/ticket-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  description: z.string().max(500).optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

type CreateProjectValues = z.infer<typeof createProjectSchema>

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const createProject = useCreateProject()
  const { t } = useTranslation()
  const [slugTouched, setSlugTouched] = useState(false)

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '', slug: '' },
  })

  const nameValue = form.watch('name')

  useEffect(() => {
    if (!slugTouched && nameValue) {
      form.setValue('slug', toSlug(nameValue), { shouldValidate: slugTouched })
    }
  }, [nameValue, slugTouched, form])

  async function onSubmit(values: CreateProjectValues) {
    const { data } = await supabase.from('projects').select('id').eq('slug', values.slug).maybeSingle()
    if (data) {
      form.setError('slug', { message: t('projects.slugTaken') ?? 'This slug is already taken' })
      return
    }
    await createProject.mutateAsync(values)
    handleClose()
  }

  function handleClose() {
    form.reset()
    setSlugTouched(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.createTitle')}</DialogTitle>
          <DialogDescription>{t('projects.createDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('projects.namePlaceholder')} {...field} />
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
                  <FormLabel>{t('projects.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('projects.descriptionPlaceholder')} className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.slug')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-project"
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true)
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t('projects.slugHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? t('projects.creating') : t('projects.createTitle')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
