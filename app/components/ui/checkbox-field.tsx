import * as React from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from './checkbox'

interface CheckboxFieldProps {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

function CheckboxField({ id, label, checked, onCheckedChange, className }: CheckboxFieldProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  )
}

export { CheckboxField }
