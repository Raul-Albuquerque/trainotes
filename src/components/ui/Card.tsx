import { cn } from '../../lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn('bg-surface rounded-card p-4', onClick && 'cursor-pointer active:opacity-80 transition-opacity', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
