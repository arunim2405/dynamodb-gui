import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

function Spinner({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export { Spinner }
