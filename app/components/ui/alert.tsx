import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

interface AlertProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'destructive' | 'success' | 'info'
}

const icons = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle2,
  info: AlertCircle,
}

function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-md border p-3',
        variant === 'default' && 'bg-muted/30 border-border/50 text-foreground',
        variant === 'destructive' && 'border-destructive/30 text-destructive bg-destructive/10',
        variant === 'success' && 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
        variant === 'info' && 'border-sky-500/30 text-sky-400 bg-sky-500/10',
        className
      )}
      {...props}
    >
      <div className="flex gap-2.5 items-start">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">{children}</div>
      </div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm leading-relaxed', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
