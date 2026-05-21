import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { auth } from '../supabase/auth'
import { useAppStore } from './store'
import { startSyncLoop, stopSyncLoop } from '../sync/engine'

interface Props { children: React.ReactNode }

export function AuthGuard({ children }: Props) {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const location = useLocation()

  useEffect(() => {
    auth.getSession().then((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) startSyncLoop(session.user.id)
    })

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
        setLoading(false)
        return
      }
      setIsRecovery(false)
      setUser(session?.user ?? null)
      if (session?.user) {
        startSyncLoop(session.user.id)
      } else {
        stopSyncLoop()
      }
    })

    return () => {
      subscription.unsubscribe()
      stopSyncLoop()
    }
  }, [setUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Allow password recovery flow to complete without redirecting
  if (isRecovery && location.pathname === '/redefinir-senha') {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
