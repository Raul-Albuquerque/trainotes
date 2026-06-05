import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, RefreshCw, AlertCircle, CheckCircle, Trash2, Plus, X, Dumbbell, Timer } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { formatDate } from '../../lib/utils'
import { syncAll } from '../../sync/engine'
import type { LocalWorkoutSession, WorkoutType } from '../../domain/types'

const RECENT_PAGE_SIZE = 4

export function HojePage() {
  const navigate = useNavigate()
  const { user, activeSession, setActiveSession, syncStatus, setSyncStatus, setLastSyncError } = useAppStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showFreeForm, setShowFreeForm] = useState(false)
  const [freeTitle, setFreeTitle] = useState('')
  const [freeType, setFreeType] = useState<WorkoutType>('strength')
  const [recentLimit, setRecentLimit] = useState(RECENT_PAGE_SIZE)

  const recentSessions = useLiveQuery(
    () => user ? sessionsRepo.list(user.id, 100) : [],
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

  async function handleDelete(id: string) {
    await sessionsRepo.softDelete(id)
    setConfirmDeleteId(null)
    if (activeSession?.id === id) setActiveSession(null)
  }

  async function startFree(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !freeTitle.trim()) return
    const session = await sessionsRepo.createFree(user.id, freeTitle.trim(), freeType)
    setActiveSession(session)
    setShowFreeForm(false)
    setFreeTitle('')
    navigate('/treino/ativo')
  }

  function handleCardClick(session: LocalWorkoutSession) {
    if (session.status === 'in_progress' && activeSession?.id === session.id) {
      navigate('/treino/ativo')
    } else {
      navigate(`/treino/${session.id}/editar`)
    }
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const todaySessions = recentSessions?.filter(s => s.performed_at.startsWith(todayISO)) ?? []
  const allOlderSessions = recentSessions?.filter(s => !s.performed_at.startsWith(todayISO)) ?? []
  const olderSessions = allOlderSessions.slice(0, recentLimit)
  const hasMore = allOlderSessions.length > recentLimit

  return (
    <div className="p-4 space-y-6 safe-top">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl text-ink">Treinos</h1>
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
        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={() => navigate('/treino/iniciar')}>
            <Play size={20} className="mr-2" />
            Iniciar treino com ficha
          </Button>

          {showFreeForm ? (
            <form onSubmit={startFree} className="bg-surface rounded-card p-4 space-y-3">
              <p className="text-ink font-medium text-sm">Treino livre</p>
              <Input
                label="Nome do treino"
                placeholder="Ex: Treino livre"
                value={freeTitle}
                onChange={e => setFreeTitle(e.target.value)}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFreeType('strength')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border text-sm font-medium transition-colors ${
                    freeType === 'strength'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg text-ink-soft border-border'
                  }`}
                >
                  <Dumbbell size={16} /> Musculação
                </button>
                <button
                  type="button"
                  onClick={() => setFreeType('cardio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border text-sm font-medium transition-colors ${
                    freeType === 'cardio'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg text-ink-soft border-border'
                  }`}
                >
                  <Timer size={16} /> Aeróbico
                </button>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Iniciar</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowFreeForm(false); setFreeTitle('') }}>
                  <X size={16} />
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowFreeForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-ink-muted text-sm active:text-accent"
            >
              <Plus size={16} /> Treino livre
            </button>
          )}
        </div>
      )}

      {todaySessions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-soft text-sm font-medium">Hoje</h2>
          {todaySessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              onCardClick={handleCardClick}
              onRequestDelete={setConfirmDeleteId}
            />
          ))}
        </section>
      )}

      {allOlderSessions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-soft text-sm font-medium">Recentes</h2>
          {olderSessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              onCardClick={handleCardClick}
              onRequestDelete={setConfirmDeleteId}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setRecentLimit(l => l + RECENT_PAGE_SIZE)}
              className="w-full py-2 text-accent text-sm font-medium active:opacity-70"
            >
              Ver mais ({allOlderSessions.length - recentLimit} restantes)
            </button>
          )}
        </section>
      )}

      {recentSessions?.length === 0 && !inProgress && (
        <p className="text-ink-muted text-sm text-center py-4">Nenhum treino registrado ainda.</p>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Apagar treino?"
        description={confirmDeleteId ? `"${recentSessions?.find(s => s.id === confirmDeleteId)?.title ?? ''}" será removido permanentemente.` : undefined}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

function SessionRow({
  session,
  onCardClick,
  onRequestDelete,
}: {
  session: LocalWorkoutSession
  onCardClick: (s: LocalWorkoutSession) => void
  onRequestDelete: (id: string) => void
}) {
  const dateLabel = session.performed_at?.slice(0, 10)
    ? new Date(session.performed_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : ''

  return (
    <div
      className="bg-surface rounded-card p-3 flex items-center gap-3 active:opacity-80 cursor-pointer"
      onClick={() => onCardClick(session)}
    >
      <CheckCircle size={18} className={`flex-shrink-0 ${session.status === 'completed' ? 'text-success' : 'text-accent'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{session.title}</p>
        <p className="text-ink-muted text-xs">
          {dateLabel} · {session.status === 'completed' ? 'Concluído' : 'Em andamento'}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRequestDelete(session.id) }}
        className="p-2 text-ink-muted active:text-danger flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
