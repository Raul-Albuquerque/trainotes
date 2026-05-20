import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors rounded-btn active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover': variant === 'primary',
          'bg-surface text-ink border border-border hover:bg-border': variant === 'secondary',
          'text-ink hover:bg-surface': variant === 'ghost',
          'bg-danger text-white hover:bg-danger/90': variant === 'danger',
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-5 text-base': size === 'md',
          'h-14 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
