import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../app/store'
import { templatesRepo, templateExercisesRepo } from '../../db/repositories/templates'

export function EditorFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [targetSets, setTargetSets] = useState('4')
  const [repsMin, setRepsMin] = useState('8')
  const [repsMax, setRepsMax] = useState('12')

  const template = useLiveQuery(() => id ? templatesRepo.get(id) : undefined, [id])
  const exercises = useLiveQuery(
    () => id ? templateExercisesRepo.listByTemplate(id) : [],
    [id]
  )

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !exerciseName.trim()) return
    const order = (exercises?.length ?? 0)
    await templateExercisesRepo.create(user.id, id, {
      name: exerciseName.trim(),
      order_index: order,
      target_sets: parseInt(targetSets) || 4,
      target_reps_min: parseInt(repsMin) || 8,
      target_reps_max: parseInt(repsMax) || 12,
      rest_seconds: 90,
      notes: null,
    })
    setExerciseName('')
    setShowAddExercise(false)
  }

  async function handleDeleteExercise(exerciseId: string) {
    await templateExercisesRepo.softDelete(exerciseId)
  }

  if (!template) return null

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/fichas')} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink flex-1">{template.name}</h1>
      </header>

      <div className="space-y-2">
        {exercises?.map((ex) => (
          <div key={ex.id} className="bg-surface rounded-card p-3 flex items-center gap-3">
            <GripVertical size={18} className="text-ink-muted flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-ink text-sm">{ex.name}</p>
              <p className="text-ink-muted text-xs">{ex.target_sets} séries · {ex.target_reps_min}–{ex.target_reps_max} reps</p>
            </div>
            <button onClick={() => handleDeleteExercise(ex.id)} className="p-2 text-ink-muted active:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showAddExercise ? (
        <form onSubmit={handleAddExercise} className="bg-surface rounded-card p-4 space-y-3">
          <Input label="Nome do exercício" placeholder="Ex: Supino reto" value={exerciseName} onChange={e => setExerciseName(e.target.value)} autoFocus required />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Séries" type="text" inputMode="numeric" value={targetSets} onChange={e => setTargetSets(e.target.value)} />
            <Input label="Reps mín" type="text" inputMode="numeric" value={repsMin} onChange={e => setRepsMin(e.target.value)} />
            <Input label="Reps máx" type="text" inputMode="numeric" value={repsMax} onChange={e => setRepsMax(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Adicionar</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddExercise(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setShowAddExercise(true)}>
          <Plus size={18} className="mr-2" /> Adicionar exercício
        </Button>
      )}
    </div>
  )
}
