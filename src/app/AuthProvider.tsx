import { useEffect } from 'react'
import { auth } from '../supabase/auth'
import { useAppStore } from './store'
import { startSyncLoop, stopSyncLoop } from '../sync/engine'
import { logger } from '../lib/logger'

const log = logger.for('AuthProvider')

interface Props { children: React.ReactNode }

export function AuthProvider({ children }: Props) {
  const { setUser, setAuthReady } = useAppStore()

  useEffect(() => {
    log.debug('iniciando — verificando sessão inicial')
    auth.getSession().then((session) => {
      log.info('sessão inicial resolvida', { hasSession: !!session, userId: session?.user?.id })
      setUser(session?.user ?? null)
      setAuthReady(true)
      if (session?.user) startSyncLoop(session.user.id)
    }).catch((err) => {
      log.error('erro ao obter sessão inicial', err)
      setUser(null)
      setAuthReady(true)
    })

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      log.info('evento de auth', { event, userId: session?.user?.id })
      // PASSWORD_RECOVERY não altera o user — RedefinirSenhaPage lida com isso
      if (event === 'PASSWORD_RECOVERY') return
      setUser(session?.user ?? null)
      if (session?.user) {
        startSyncLoop(session.user.id)
      } else {
        stopSyncLoop()
      }
    })

    return () => {
      log.debug('desmontando — cancelando listener')
      subscription.unsubscribe()
      stopSyncLoop()
    }
  }, [setUser, setAuthReady])

  return <>{children}</>
}
