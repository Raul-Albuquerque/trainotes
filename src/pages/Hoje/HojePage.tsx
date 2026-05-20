import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { formatDate } from '../../lib/utils'
import { syncAll } from '../../sync/engine'

export function HojePage() {
  const navigate = useNavigate()
  const { user, syncStatus, setSyncStatus, setLastSyncError } = useAppStore()
  const todayISO = new Date().toISOString().slice(0, 10)

  const todaySessions = useLiveQuery(
    () => user ? sessionsRepo.list(user.id, 10).then(s => s.filter(x => x.performed_at.startsWith(todayISO))) : [],
    [user?.id]
  )

  const inProgress = useLiveQuery(
    () => user ? sessionsRepo.getInProgress(user.id) : undefined,
    [user?.id]
  )

  async function handleSync() {
    if (!user) return
    setSyncStatus('syncing')
    try {
      await syncAll(user.id)
      setSyncStatus('idle')
      setLastSyncError(null)
    } catch (e: unknown) {
      setSyncStatus('error')
      setLastSyncError(e instanceof Error ? e.message : 'Erro desconhecido')
    }
  }

  return (
    <div className="p-4 space-y-6 safe-top">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl text-ink">Hoje</h1>
          <p className="text-ink-muted text-sm">{formatDate(new Date().toISOString())}</p>
        </div>
        <button onClick={handleSync} className="p-2 rounded-card text-ink-muted active:text-accent" title="Sincronizar">
          {syncStatus === 'syncing' ? <RefreshCw size={20} className="animate-spin text-accent" /> :
           syncStatus === 'error' ? <AlertCircle size={20} className="text-danger" /> :
           <RefreshCw size={20} />}
        </button>
      </header>

      {inProgress ? (
        <div className="bg-accent/10 border border-accent/30 rounded-card p-4 space-y-2">
          <p className="text-accent font-medium text-sm">Treino em andamento</p>
          <p className="font-display text-lg text-ink">{inProgress.title}</p>
          <Button className="w-full mt-2" onClick={() => navigate('/treino/ativo')}>
            Continuar treino
          </Button>
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={() => navigate('/treino/iniciar')}>
          <Play size={20} className="mr-2" />
          Iniciar treino
        </Button>
      )}

      {todaySessions && todaySessions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-soft text-sm font-medium">Treinos hoje</h2>
          {todaySessions.map(s => (
            <div key={s.id} className="bg-surface rounded-card p-3 flex items-center gap-3">
              <CheckCircle size={18} className="text-success flex-shrink-0" />
              <div>
                <p className="font-medium text-ink text-sm">{s.title}</p>
                <p className="text-ink-muted text-xs">{s.status === 'completed' ? 'Concluído' : 'Em andamento'}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
