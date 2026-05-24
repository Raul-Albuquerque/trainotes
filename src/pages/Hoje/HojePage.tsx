import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, RefreshCw, AlertCircle, CheckCircle, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { formatDate } from '../../lib/utils'
import { syncAll } from '../../sync/engine'
import type { LocalWorkoutSession } from '../../domain/types'

export function HojePage() {
  const navigate = useNavigate()
  const { user, syncStatus, setSyncStatus, setLastSyncError } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const recentSessions = useLiveQuery(
    () => user ? sessionsRepo.list(user.id, 20) : [],
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

  function startEdit(session: LocalWorkoutSession) {
    setEditingId(session.id)
    setTitleDraft(session.title)
  }

  async function saveEdit(id: string) {
    if (!titleDraft.trim()) return
    await sessionsRepo.update(id, { title: titleDraft.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await sessionsRepo.softDelete(id)
    setConfirmDeleteId(null)
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const todaySessions = recentSessions?.filter(s => s.performed_at.startsWith(todayISO)) ?? []
  const olderSessions = recentSessions?.filter(s => !s.performed_at.startsWith(todayISO)) ?? []

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
        <Button size="lg" className="w-full" onClick={() => navigate('/treino/iniciar')}>
          <Play size={20} className="mr-2" />
          Iniciar treino
        </Button>
      )}

      {todaySessions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-soft text-sm font-medium">Hoje</h2>
          {todaySessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              editingId={editingId}
              titleDraft={titleDraft}
              confirmDeleteId={confirmDeleteId}
              onTitleDraftChange={setTitleDraft}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onConfirmDelete={setConfirmDeleteId}
              onDelete={handleDelete}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </section>
      )}

      {olderSessions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-soft text-sm font-medium">Recentes</h2>
          {olderSessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              editingId={editingId}
              titleDraft={titleDraft}
              confirmDeleteId={confirmDeleteId}
              onTitleDraftChange={setTitleDraft}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onConfirmDelete={setConfirmDeleteId}
              onDelete={handleDelete}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </section>
      )}

      {recentSessions?.length === 0 && !inProgress && (
        <p className="text-ink-muted text-sm text-center py-4">Nenhum treino registrado ainda.</p>
      )}
    </div>
  )
}

function SessionRow({
  session,
  editingId,
  titleDraft,
  confirmDeleteId,
  onTitleDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onConfirmDelete,
  onDelete,
  onCancelDelete,
}: {
  session: LocalWorkoutSession
  editingId: string | null
  titleDraft: string
  confirmDeleteId: string | null
  onTitleDraftChange: (v: string) => void
  onStartEdit: (s: LocalWorkoutSession) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onConfirmDelete: (id: string) => void
  onDelete: (id: string) => void
  onCancelDelete: () => void
}) {
  const isEditing = editingId === session.id
  const isConfirmingDelete = confirmDeleteId === session.id
  const dateLabel = session.performed_at?.slice(0, 10)
    ? new Date(session.performed_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : ''

  if (isConfirmingDelete) {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-card p-3 flex items-center gap-3">
        <p className="flex-1 text-sm text-ink">Apagar <span className="font-medium">{session.title}</span>?</p>
        <button onClick={() => onDelete(session.id)} className="px-3 py-1 bg-danger text-white text-sm rounded-card font-medium">Apagar</button>
        <button onClick={onCancelDelete} className="p-1 text-ink-muted"><X size={16} /></button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="bg-surface rounded-card p-3 flex items-center gap-2">
        <input
          autoFocus
          value={titleDraft}
          onChange={e => onTitleDraftChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(session.id); if (e.key === 'Escape') onCancelEdit() }}
          className="flex-1 bg-bg border border-accent rounded-card px-2 py-1 text-ink text-sm focus:outline-none"
        />
        <button onClick={() => onSaveEdit(session.id)} className="p-1 text-accent"><Check size={16} /></button>
        <button onClick={onCancelEdit} className="p-1 text-ink-muted"><X size={16} /></button>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card p-3 flex items-center gap-3">
      <CheckCircle size={18} className={`flex-shrink-0 ${session.status === 'completed' ? 'text-success' : 'text-accent'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{session.title}</p>
        <p className="text-ink-muted text-xs">
          {dateLabel} · {session.status === 'completed' ? 'Concluído' : 'Em andamento'}
        </p>
      </div>
      <button onClick={() => onStartEdit(session)} className="p-2 text-ink-muted active:text-accent flex-shrink-0">
        <Pencil size={15} />
      </button>
      <button onClick={() => onConfirmDelete(session.id)} className="p-2 text-ink-muted active:text-danger flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
