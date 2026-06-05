import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverPortal = PopoverPrimitive.Portal

function PopoverContent({
  className,
  align = 'center',
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & { align?: 'start' | 'center' | 'end' }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} sideOffset={6}>
        <PopoverPrimitive.Popup
          className={cn(
            'z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none',
            'data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95',
            'data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95',
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverPortal, PopoverContent }
