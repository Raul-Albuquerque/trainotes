import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Plus, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../app/store'
import { templatesRepo, templateExercisesRepo } from '../../db/repositories/templates'
import type { LocalTemplateExercise } from '../../domain/types'

export function EditorFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAppStore()

  // add form
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [targetSets, setTargetSets] = useState('4')
  const [repsMin, setRepsMin] = useState('8')
  const [repsMax, setRepsMax] = useState('12')
  const [targetDuration, setTargetDuration] = useState('30')

  // template name edit
  const [editingTemplateName, setEditingTemplateName] = useState(false)
  const [templateNameDraft, setTemplateNameDraft] = useState('')

  // edit form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSets, setEditSets] = useState('')
  const [editRepsMin, setEditRepsMin] = useState('')
  const [editRepsMax, setEditRepsMax] = useState('')
  const [editDuration, setEditDuration] = useState('')

  const template = useLiveQuery(() => id ? templatesRepo.get(id) : undefined, [id])
  const exercises = useLiveQuery(
    () => id ? templateExercisesRepo.listByTemplate(id) : [],
    [id]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !exercises) return
    const oldIndex = exercises.findIndex(e => e.id === active.id)
    const newIndex = exercises.findIndex(e => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(exercises, oldIndex, newIndex)
    await Promise.all(reordered.map((ex, i) => templateExercisesRepo.update(ex.id, { order_index: i })))
  }

  const isCardio = template?.workout_type === 'cardio'

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !exerciseName.trim()) return
    const order = exercises?.length ?? 0
    await templateExercisesRepo.create(user.id, id, {
      name: exerciseName.trim(),
      order_index: order,
      target_sets: isCardio ? 1 : (parseInt(targetSets) || 4),
      target_reps_min: isCardio ? (parseInt(targetDuration) || 30) : (parseInt(repsMin) || 8),
      target_reps_max: isCardio ? (parseInt(targetDuration) || 30) : (parseInt(repsMax) || 12),
      rest_seconds: 90,
      notes: null,
    })
    setExerciseName('')
    setShowAddExercise(false)
  }

  function startEdit(ex: LocalTemplateExercise) {
    setEditingId(ex.id)
    setEditName(ex.name)
    setEditSets(String(ex.target_sets))
    setEditRepsMin(String(ex.target_reps_min))
    setEditRepsMax(String(ex.target_reps_max))
    setEditDuration(String(ex.target_reps_min))
  }

  async function handleSaveEdit(exerciseId: string) {
    if (!editName.trim()) return
    await templateExercisesRepo.update(exerciseId, isCardio ? {
      name: editName.trim(),
      target_sets: 1,
      target_reps_min: parseInt(editDuration) || 30,
      target_reps_max: parseInt(editDuration) || 30,
    } : {
      name: editName.trim(),
      target_sets: parseInt(editSets) || 4,
      target_reps_min: parseInt(editRepsMin) || 8,
      target_reps_max: parseInt(editRepsMax) || 12,
    })
    setEditingId(null)
  }

  async function saveTemplateName() {
    if (!id || !templateNameDraft.trim()) return
    await templatesRepo.update(id, { name: templateNameDraft.trim() })
    setEditingTemplateName(false)
  }

  if (!template) return null

  const exerciseIds = exercises?.map(e => e.id) ?? []

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/fichas')} className="p-1 -ml-1 flex-shrink-0">
          <ArrowLeft size={22} className="text-ink" />
        </button>
        {editingTemplateName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={templateNameDraft}
              onChange={e => setTemplateNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTemplateName(); if (e.key === 'Escape') setEditingTemplateName(false) }}
              className="flex-1 bg-bg border border-accent rounded-card px-2 py-1 text-ink font-display text-xl focus:outline-none"
            />
            <button onClick={saveTemplateName} className="p-1 text-accent flex-shrink-0"><Check size={18} /></button>
            <button onClick={() => setEditingTemplateName(false)} className="p-1 text-ink-muted flex-shrink-0"><X size={18} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl text-ink truncate">{template.name}</h1>
              <p className="text-ink-muted text-xs">{isCardio ? 'Aeróbico' : 'Musculação'}</p>
            </div>
            <button
              onClick={() => { setTemplateNameDraft(template.name); setEditingTemplateName(true) }}
              className="p-1 text-ink-muted flex-shrink-0"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {exercises?.map((ex) =>
              editingId === ex.id ? (
                <div key={ex.id} className="bg-surface rounded-card p-3 space-y-2">
                  <Input label="Nome" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  {isCardio ? (
                    <Input label="Duração (seg)" type="text" inputMode="numeric" value={editDuration} onChange={e => setEditDuration(e.target.value)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <Input label="Séries" type="text" inputMode="numeric" value={editSets} onChange={e => setEditSets(e.target.value)} />
                      <Input label="Reps mín" type="text" inputMode="numeric" value={editRepsMin} onChange={e => setEditRepsMin(e.target.value)} />
                      <Input label="Reps máx" type="text" inputMode="numeric" value={editRepsMax} onChange={e => setEditRepsMax(e.target.value)} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleSaveEdit(ex.id)}>
                      <Check size={14} className="mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <SortableExerciseRow
                  key={ex.id}
                  exercise={ex}
                  isCardio={isCardio}
                  onEdit={startEdit}
                  onDelete={id => templateExercisesRepo.softDelete(id)}
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showAddExercise ? (
        <form onSubmit={handleAddExercise} className="bg-surface rounded-card p-4 space-y-3">
          <Input
            label={isCardio ? 'Nome do exercício / atividade' : 'Nome do exercício'}
            placeholder={isCardio ? 'Ex: Corrida' : 'Ex: Supino reto'}
            value={exerciseName}
            onChange={e => setExerciseName(e.target.value)}
            autoFocus
            required
          />
          {isCardio ? (
            <Input label="Duração alvo (seg)" type="text" inputMode="numeric" value={targetDuration} onChange={e => setTargetDuration(e.target.value)} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Input label="Séries" type="text" inputMode="numeric" value={targetSets} onChange={e => setTargetSets(e.target.value)} />
              <Input label="Reps mín" type="text" inputMode="numeric" value={repsMin} onChange={e => setRepsMin(e.target.value)} />
              <Input label="Reps máx" type="text" inputMode="numeric" value={repsMax} onChange={e => setRepsMax(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Adicionar</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddExercise(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setShowAddExercise(true)}>
          <Plus size={18} className="mr-2" /> Adicionar {isCardio ? 'atividade' : 'exercício'}
        </Button>
      )}
    </div>
  )
}

function SortableExerciseRow({
  exercise,
  isCardio,
  onEdit,
  onDelete,
}: {
  exercise: LocalTemplateExercise
  isCardio: boolean
  onEdit: (ex: LocalTemplateExercise) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const subtitle = isCardio
    ? `${exercise.target_reps_min}s`
    : `${exercise.target_sets} séries · ${exercise.target_reps_min}–${exercise.target_reps_max} reps`

  return (
    <div ref={setNodeRef} style={style} className="bg-surface rounded-card p-3 flex items-center gap-3">
      <button
        className="p-1 touch-none text-ink-muted cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{exercise.name}</p>
        <p className="text-ink-muted text-xs">{subtitle}</p>
      </div>
      <button onClick={() => onEdit(exercise)} className="p-2 text-ink-muted active:text-accent flex-shrink-0">
        <Pencil size={16} />
      </button>
      <button onClick={() => onDelete(exercise.id)} className="p-2 text-ink-muted active:text-danger flex-shrink-0">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
