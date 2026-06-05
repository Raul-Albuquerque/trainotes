import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Trash2, ClipboardList } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useAppStore } from '../../app/store'
import { assessmentsRepo } from '../../db/repositories/assessments'
import { formatDate } from '../../lib/utils'

export function AvaliacoesPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const assessments = useLiveQuery(
    () => user ? assessmentsRepo.list(user.id) : [],
    [user?.id]
  )

  async function handleDelete(id: string) {
    await assessmentsRepo.softDelete(id)
    setConfirmDeleteId(null)
  }

  const confirmTarget = assessments?.find(a => a.id === confirmDeleteId)

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center justify-between pt-2">
        <h1 className="font-display text-2xl text-ink">Avaliações</h1>
        <Button size="sm" onClick={() => navigate('/avaliacoes/nova')}>
          <Plus size={18} className="mr-1" /> Nova
        </Button>
      </header>

      <div className="space-y-2">
        {assessments?.map(a => (
          <Card
            key={a.id}
            onClick={() => navigate(`/avaliacoes/${a.id}/editar`)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ClipboardList size={16} className="text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{formatDate(a.assessed_at)}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {[
                    a.weight_kg != null && `${a.weight_kg} kg`,
                    a.bmi != null && `IMC ${a.bmi}`,
                    a.whr != null && `RCQ ${a.whr}`,
                  ].filter(Boolean).join(' · ') || 'Sem medidas registradas'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setConfirmDeleteId(a.id) }}
                className="p-2 text-ink-muted active:text-danger"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-ink-muted" />
            </div>
          </Card>
        ))}

        {assessments?.length === 0 && (
          <p className="text-ink-muted text-sm text-center py-8">
            Nenhuma avaliação registrada ainda.
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Apagar avaliação?"
        description={confirmTarget ? `Avaliação de ${formatDate(confirmTarget.assessed_at)} será removida permanentemente.` : undefined}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
