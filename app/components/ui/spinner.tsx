import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

function Spinner({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
    </div>
  )
}

export { Spinner }
