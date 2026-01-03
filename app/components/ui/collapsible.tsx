import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

function Collapsible({ title, children, defaultOpen = false, className }: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn('border rounded-md', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
        {title}
      </button>
      {isOpen && <div className="border-t p-4">{children}</div>}
    </div>
  )
}

export { Collapsible }
