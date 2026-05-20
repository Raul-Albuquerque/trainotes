import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-ink-soft">{label}</label>}
      <input
        className={cn(
          'h-11 px-3 bg-surface border border-border rounded-card text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
