import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      {/* Dialog content */}
      <div className="relative z-50 w-full max-w-lg">{children}</div>
    </div>
  )
}

function DialogContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-background rounded-lg border shadow-lg p-6', 'animate-in fade-in-0 zoom-in-95', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
}

interface DialogCloseProps extends React.ComponentProps<'button'> {
  onClose: () => void
}

function DialogClose({ className, onClose, ...props }: DialogCloseProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn('absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100', className)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
