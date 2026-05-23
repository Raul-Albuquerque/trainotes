import { useAppStore } from './store'
import { Navigate, useLocation } from 'react-router-dom'
import { logger } from '../lib/logger'

const log = logger.for('AuthGuard')

interface Props { children: React.ReactNode }

export function AuthGuard({ children }: Props) {
  const user = useAppStore(s => s.user)
  const authReady = useAppStore(s => s.authReady)
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    log.info('usuário não autenticado — redirecionando para /login', { from: location.pathname })
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
