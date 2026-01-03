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
        'relative w-full rounded-lg border p-4',
        variant === 'default' && 'bg-background text-foreground',
        variant === 'destructive' && 'border-destructive/50 text-destructive bg-destructive/10',
        variant === 'success' && 'border-green-500/50 text-green-600 bg-green-500/10',
        variant === 'info' && 'border-blue-500/50 text-blue-600 bg-blue-500/10',
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        <Icon className="h-4 w-4 mt-0.5" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
