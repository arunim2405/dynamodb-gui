import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}

function DropdownMenu({ trigger, children, className, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement<DropdownMenuItemProps>(child)) {
              return React.cloneElement(child, {
                onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                  child.props.onClick?.(e)
                  setIsOpen(false)
                },
              })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps extends React.ComponentProps<'button'> {
  destructive?: boolean
}

function DropdownMenuItem({ className, destructive, ...props }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        destructive && 'text-destructive hover:text-destructive',
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
}

export { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator }
