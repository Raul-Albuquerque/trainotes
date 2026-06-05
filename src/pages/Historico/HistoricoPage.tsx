import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle, Trash2 } from 'lucide-react'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { formatDate } from '../../lib/utils'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import type { LocalWorkoutSession } from '../../domain/types'

const PAGE_SIZE = 20

export function HistoricoPage() {
  const navigate = useNavigate()
  const { user, activeSession, setActiveSession } = useAppStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const sessions = useLiveQuery(
    () => user ? sessionsRepo.list(user.id, 1000) : [],
    [user?.id]
  )

  async function handleDelete(id: string) {
    await sessionsRepo.softDelete(id)
    setConfirmDeleteId(null)
    if (activeSession?.id === id) setActiveSession(null)
  }

  const completed = sessions?.filter(s => s.status === 'completed') ?? []
  const visible = completed.slice(0, visibleCount)
  const hasMore = completed.length > visibleCount
  const sessionToDelete = completed.find(s => s.id === confirmDeleteId)

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="pt-2">
        <h1 className="font-display text-2xl text-ink">Histórico</h1>
        {completed.length > 0 && (
          <p className="text-ink-muted text-sm mt-0.5">{completed.length} treino{completed.length !== 1 ? 's' : ''} concluído{completed.length !== 1 ? 's' : ''}</p>
        )}
      </header>

      <div className="space-y-2">
        {visible.map(s => (
          <SessionHistoryRow
            key={s.id}
            session={s}
            onNavigate={() => navigate(`/treino/${s.id}/editar`)}
            onRequestDelete={() => setConfirmDeleteId(s.id)}
          />
        ))}

        {hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="w-full py-3 text-accent text-sm font-medium active:opacity-70"
          >
            Ver mais ({completed.length - visibleCount} restantes)
          </button>
        )}

        {completed.length === 0 && (
          <p className="text-ink-muted text-sm text-center py-8">Nenhum treino concluído ainda.</p>
        )}
      </div>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Apagar treino?"
        description={sessionToDelete ? `"${sessionToDelete.title}" será removido permanentemente.` : undefined}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

function SessionHistoryRow({
  session,
  onNavigate,
  onRequestDelete,
}: {
  session: LocalWorkoutSession
  onNavigate: () => void
  onRequestDelete: () => void
}) {
  return (
    <div
      className="bg-surface rounded-card p-3 flex items-center gap-3 active:opacity-80 cursor-pointer"
      onClick={onNavigate}
    >
      <CheckCircle size={18} className="text-success flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{session.title}</p>
        <p className="text-ink-muted text-xs">{formatDate(session.performed_at)}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRequestDelete() }}
        className="p-2 text-ink-muted active:text-danger flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
