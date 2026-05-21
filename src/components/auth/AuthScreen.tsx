interface AuthScreenProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center p-6 safe-top">
      <img src="/logo-black.svg" alt="Trainotes" className="h-10 mb-8" />

      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink-soft mt-1">{subtitle}</p>}
        </div>

        {children}

        {footer && (
          <p className="mt-8 text-sm text-ink-muted text-center">{footer}</p>
        )}
      </div>
    </div>
  )
}
