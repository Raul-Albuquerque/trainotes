import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Trash2, Dumbbell, Timer } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useAppStore } from '../../app/store'
import { templatesRepo } from '../../db/repositories/templates'
import type { WorkoutType } from '../../domain/types'

export function FichasPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<WorkoutType>('strength')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const templates = useLiveQuery(
    () => user ? templatesRepo.list(user.id) : [],
    [user?.id]
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newName.trim()) return
    setLoading(true)
    const template = await templatesRepo.create(user.id, { name: newName.trim(), description: null, workout_type: newType })
    setNewName('')
    setNewType('strength')
    setShowCreate(false)
    setLoading(false)
    navigate(`/fichas/${template.id}/editar`)
  }

  async function handleDelete(id: string) {
    await templatesRepo.softDelete(id)
    setConfirmDeleteId(null)
  }

  const active = templates?.filter(t => t.status === 'active') ?? []

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center justify-between pt-2">
        <h1 className="font-display text-2xl text-ink">Fichas</h1>
        <Button size="sm" onClick={() => setShowCreate(v => !v)}>
          <Plus size={18} className="mr-1" /> Nova
        </Button>
      </header>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 bg-surface rounded-card p-4">
          <Input label="Nome da ficha" placeholder="Ex: Peito A" value={newName} onChange={e => setNewName(e.target.value)} autoFocus required />
          <div>
            <p className="text-ink-muted text-xs mb-1.5">Tipo de treino</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType('strength')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border text-sm font-medium transition-colors ${
                  newType === 'strength'
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg text-ink-soft border-border'
                }`}
              >
                <Dumbbell size={16} /> Musculação
              </button>
              <button
                type="button"
                onClick={() => setNewType('cardio')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border text-sm font-medium transition-colors ${
                  newType === 'cardio'
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg text-ink-soft border-border'
                }`}
              >
                <Timer size={16} /> Aeróbico
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>Criar</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {active.map(t => (
          <Card key={t.id} onClick={() => navigate(`/fichas/${t.id}/editar`)} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {t.workout_type === 'cardio'
                ? <Timer size={16} className="text-accent flex-shrink-0" />
                : <Dumbbell size={16} className="text-accent flex-shrink-0" />}
              <span className="font-medium text-ink truncate">{t.name}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setConfirmDeleteId(t.id) }}
                className="p-2 text-ink-muted active:text-danger"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-ink-muted" />
            </div>
          </Card>
        ))}
        {active.length === 0 && (
          <p className="text-ink-muted text-sm text-center py-8">Nenhuma ficha criada ainda.</p>
        )}
      </div>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Apagar ficha?"
        description={confirmDeleteId ? `"${active.find(t => t.id === confirmDeleteId)?.name ?? ''}" e todos os seus exercícios serão removidos.` : undefined}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
