import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  hintTone?: 'muted' | 'success' | 'danger'
  valid?: boolean
  rightSlot?: ReactNode
}

export function Input({ label, error, hint, hintTone = 'muted', valid, rightSlot, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-ink-soft">{label}</label>}
      <div className="relative">
        <input
          className={cn(
            'h-11 w-full px-3 bg-surface border rounded-card text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow',
            rightSlot && 'pr-11',
            error ? 'border-danger' : valid ? 'border-success' : 'border-border',
            className
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className={cn('text-xs', {
          'text-ink-muted': hintTone === 'muted',
          'text-success': hintTone === 'success',
          'text-danger': hintTone === 'danger',
        })}>{hint}</span>
      ) : null}
    </div>
  )
}
