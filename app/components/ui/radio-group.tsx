import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}

function RadioGroup({ value, onValueChange, className, children }: RadioGroupProps) {
  return (
    <div className={cn('flex gap-2', className)} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement<RadioGroupItemProps>(child)) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: () => onValueChange(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

interface RadioGroupItemProps {
  value: string
  label: string
  checked?: boolean
  onChange?: () => void
  className?: string
}

function RadioGroupItem({ value, label, checked, onChange, className }: RadioGroupItemProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-all',
        checked
          ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
          : 'border-border/50 bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-border',
        className
      )}
    >
      <input type="radio" value={value} checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  )
}

export { RadioGroup, RadioGroupItem }
