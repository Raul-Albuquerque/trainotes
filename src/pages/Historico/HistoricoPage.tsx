import { useLiveQuery } from 'dexie-react-hooks'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { formatDate } from '../../lib/utils'
import { CheckCircle } from 'lucide-react'

export function HistoricoPage() {
  const { user } = useAppStore()
  const sessions = useLiveQuery(
    () => user ? sessionsRepo.list(user.id, 100) : [],
    [user?.id]
  )

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="pt-2">
        <h1 className="font-display text-2xl text-ink">Histórico</h1>
      </header>

      <div className="space-y-2">
        {sessions?.filter(s => s.status === 'completed').map(s => (
          <div key={s.id} className="bg-surface rounded-card p-3 flex items-center gap-3">
            <CheckCircle size={18} className="text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-ink text-sm">{s.title}</p>
              <p className="text-ink-muted text-xs">{formatDate(s.performed_at)}</p>
            </div>
          </div>
        ))}
        {sessions?.filter(s => s.status === 'completed').length === 0 && (
          <p className="text-ink-muted text-sm text-center py-8">Nenhum treino concluído ainda.</p>
        )}
      </div>
    </div>
  )
}
