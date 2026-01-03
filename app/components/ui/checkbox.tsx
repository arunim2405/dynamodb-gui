import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

function Checkbox({ id, checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'bg-primary text-primary-foreground',
        className
      )}
    >
      {checked && (
        <span className="flex items-center justify-center text-current">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  )
}

export { Checkbox }
