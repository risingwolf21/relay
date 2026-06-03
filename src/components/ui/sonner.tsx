import { Toaster as SonnerToaster } from 'sonner'

function Toaster({ ...props }: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      data-slot="toaster"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group flex items-center gap-2 rounded-lg border bg-background p-4 shadow-md text-foreground',
          description: 'text-muted-foreground text-sm',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-destructive/50 bg-destructive/10 text-destructive',
          success: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
          warning: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
          info: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
