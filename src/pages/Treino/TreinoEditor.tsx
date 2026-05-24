import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle, Plus, ArrowLeft, Pencil, Check, X, Trash2, Calendar } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { sessionsRepo, sessionExercisesRepo, sessionSetsRepo } from '../../db/repositories/sessions'
import type { LocalSessionSet, LocalSessionExercise, LocalWorkoutSession } from '../../domain/types'

interface Props {
  session: LocalWorkoutSession
  onFinish?: () => void
  backPath?: string
}

export function TreinoEditor({ session, onFinish, backPath = '/' }: Props) {
  const navigate = useNavigate()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateDraft, setDateDraft] = useState('')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')

  const liveSession = useLiveQuery(() => sessionsRepo.get(session.id), [session.id]) ?? session

  const exercises = useLiveQuery(
    () => sessionExercisesRepo.listBySession(session.id),
    [session.id]
  )

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault()
    if (!newExerciseName.trim()) return
    const currentExercises = await sessionExercisesRepo.listBySession(liveSession.id)
    const orderIndex = currentExercises.length
    await sessionExercisesRepo.create(liveSession.user_id, liveSession.id, newExerciseName.trim(), orderIndex)
    setNewExerciseName('')
    setShowAddExercise(false)
  }

  async function handleAddSet(exerciseId: string, lastSet?: LocalSessionSet) {
    const sets = await sessionSetsRepo.listByExercise(exerciseId)
    const nextIndex = sets.length + 1
    await sessionSetsRepo.create(
      liveSession.user_id,
      liveSession.id,
      exerciseId,
      nextIndex,
      lastSet?.reps ?? 10,
      lastSet?.weight ?? 0,
      lastSet?.weight_unit ?? 'kg',
      lastSet?.duration_seconds ?? null,
    )
  }

  async function handleFinish() {
    await sessionsRepo.complete(liveSession.id)
    if (onFinish) onFinish()
    else navigate(backPath)
  }

  function startEditTitle() {
    setTitleDraft(liveSession.title)
    setEditingTitle(true)
  }

  async function saveTitle() {
    if (!titleDraft.trim()) return
    await sessionsRepo.update(liveSession.id, { title: titleDraft.trim() })
    setEditingTitle(false)
  }

  function startEditDate() {
    const iso = liveSession.performed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    setDateDraft(iso)
    setEditingDate(true)
  }

  async function saveDate() {
    if (!dateDraft) return
    const existingTime = liveSession.performed_at?.slice(10) ?? 'T00:00:00.000Z'
    await sessionsRepo.update(liveSession.id, { performed_at: dateDraft + existingTime })
    setEditingDate(false)
  }

  const isCardio = liveSession.workout_type === 'cardio'

  const displayDate = liveSession.performed_at?.slice(0, 10)
    ? new Date(liveSession.performed_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="pt-2 space-y-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(backPath)} className="p-1 -ml-1 flex-shrink-0">
            <ArrowLeft size={22} className="text-ink" />
          </button>

          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                className="flex-1 bg-bg border border-accent rounded-card px-2 py-1 text-ink font-display text-xl focus:outline-none"
              />
              <button onClick={saveTitle} className="p-1 text-accent"><Check size={18} /></button>
              <button onClick={() => setEditingTitle(false)} className="p-1 text-ink-muted"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="font-display text-xl text-ink truncate flex-1">{liveSession.title}</h1>
              <button onClick={startEditTitle} className="p-1 text-ink-muted flex-shrink-0">
                <Pencil size={16} />
              </button>
            </div>
          )}

          {liveSession.status === 'in_progress' && (
            <Button size="sm" onClick={handleFinish} className="flex-shrink-0">
              <CheckCircle size={16} className="mr-1" /> Finalizar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 pl-8">
          {editingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                autoFocus
                value={dateDraft}
                onChange={e => setDateDraft(e.target.value)}
                className="bg-bg border border-accent rounded-card px-2 py-0.5 text-ink text-sm focus:outline-none"
              />
              <button onClick={saveDate} className="p-1 text-accent"><Check size={14} /></button>
              <button onClick={() => setEditingDate(false)} className="p-1 text-ink-muted"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={startEditDate}
              className="flex items-center gap-1 text-ink-muted text-sm active:text-accent"
            >
              <Calendar size={13} />
              <span>{displayDate}</span>
              <Pencil size={11} className="ml-0.5 opacity-60" />
            </button>
          )}
        </div>
      </header>

      <div className="space-y-4">
        {exercises?.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isCardio={isCardio}
            sessionUserId={liveSession.user_id}
            sessionId={liveSession.id}
            onAddSet={handleAddSet}
          />
        ))}

        {showAddExercise ? (
          <form onSubmit={handleAddExercise} className="bg-surface rounded-card p-4 space-y-3">
            <Input
              label="Nome do exercício"
              placeholder={isCardio ? 'Ex: Corrida' : 'Ex: Supino reto'}
              value={newExerciseName}
              onChange={e => setNewExerciseName(e.target.value)}
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Adicionar</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowAddExercise(false); setNewExerciseName('') }}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddExercise(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-dashed border-border text-ink-muted text-sm active:text-accent active:border-accent"
          >
            <Plus size={16} /> Adicionar exercício
          </button>
        )}
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise,
  isCardio,
  sessionUserId: _sessionUserId,
  sessionId: _sessionId,
  onAddSet,
}: {
  exercise: LocalSessionExercise
  isCardio: boolean
  sessionUserId: string
  sessionId: string
  onAddSet: (id: string, last?: LocalSessionSet) => void
}) {
  const sets = useLiveQuery(
    () => sessionSetsRepo.listByExercise(exercise.id),
    [exercise.id]
  )
  const lastSet = sets?.[sets.length - 1]

  return (
    <div className="bg-surface rounded-card p-4 space-y-3">
      <h3 className="font-medium text-ink">{exercise.name}</h3>
      <div className="space-y-2">
        {sets?.map(set => (
          <SetRow key={set.id} set={set} isCardio={isCardio} />
        ))}
      </div>
      <button
        onClick={() => onAddSet(exercise.id, lastSet)}
        className="flex items-center gap-2 text-accent text-sm font-medium py-1"
      >
        <Plus size={16} /> Adicionar {isCardio ? 'intervalo' : 'série'}
        {lastSet && !isCardio && (
          <span className="text-ink-muted text-xs">({lastSet.reps}×{lastSet.weight}{lastSet.weight_unit})</span>
        )}
        {lastSet && isCardio && lastSet.duration_seconds != null && (
          <span className="text-ink-muted text-xs">({formatDuration(lastSet.duration_seconds)})</span>
        )}
      </button>
    </div>
  )
}

function SetRow({ set, isCardio }: { set: LocalSessionSet; isCardio: boolean }) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(String(set.weight))
  const [duration, setDuration] = useState(set.duration_seconds != null ? String(set.duration_seconds) : '')
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function scheduleAutosave(newReps: string, newWeight: string, newDuration: string) {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      if (isCardio) {
        sessionSetsRepo.update(set.id, { duration_seconds: parseInt(newDuration) || null })
      } else {
        sessionSetsRepo.update(set.id, {
          reps: parseInt(newReps) || 0,
          weight: parseFloat(newWeight) || 0,
        })
      }
    }, 500)
  }

  async function handleDelete() {
    clearTimeout(saveTimeout.current)
    await sessionSetsRepo.softDelete(set.id)
  }

  if (isCardio) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-ink-muted text-sm w-5 text-right tabular-nums">{set.set_index}</span>
        <input
          type="text"
          inputMode="numeric"
          value={duration}
          onChange={e => { setDuration(e.target.value); scheduleAutosave(reps, weight, e.target.value) }}
          className="w-24 h-11 text-center bg-bg border border-border rounded-card text-ink font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="seg"
        />
        <span className="text-ink-muted text-xs flex-1">seg</span>
        <button onClick={handleDelete} className="p-1.5 text-ink-muted active:text-danger">
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted text-sm w-5 text-right tabular-nums">{set.set_index}</span>
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={e => { setReps(e.target.value); scheduleAutosave(e.target.value, weight, duration) }}
        className="w-14 h-11 text-center bg-bg border border-border rounded-card text-ink font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40"
        placeholder="reps"
      />
      <span className="text-ink-muted text-xs">×</span>
      <input
        type="text"
        inputMode="decimal"
        value={weight}
        onChange={e => { setWeight(e.target.value); scheduleAutosave(reps, e.target.value, duration) }}
        className="w-20 h-11 text-center bg-bg border border-border rounded-card text-ink font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40"
        placeholder="kg"
      />
      <span className="text-ink-muted text-xs flex-1">{set.weight_unit}</span>
      <button onClick={handleDelete} className="p-1.5 text-ink-muted active:text-danger">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m${s}s` : `${m}min`
}
