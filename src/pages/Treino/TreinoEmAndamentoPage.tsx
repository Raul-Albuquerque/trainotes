import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle, Plus, ArrowLeft, Pencil, Check, X, Trash2, Calendar } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo, sessionExercisesRepo, sessionSetsRepo } from '../../db/repositories/sessions'
import type { LocalSessionSet, LocalSessionExercise } from '../../domain/types'

export function TreinoEmAndamentoPage() {
  const navigate = useNavigate()
  const { user, activeSession, setActiveSession } = useAppStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateDraft, setDateDraft] = useState('')

  const session = useLiveQuery(
    () => activeSession ? sessionsRepo.get(activeSession.id) : undefined,
    [activeSession?.id]
  )

  const exercises = useLiveQuery(
    () => activeSession ? sessionExercisesRepo.listBySession(activeSession.id) : [],
    [activeSession?.id]
  )

  async function handleAddSet(exerciseId: string, lastSet?: LocalSessionSet) {
    if (!user || !activeSession) return
    const sets = await sessionSetsRepo.listByExercise(exerciseId)
    const nextIndex = sets.length + 1
    await sessionSetsRepo.create(
      user.id,
      activeSession.id,
      exerciseId,
      nextIndex,
      lastSet?.reps ?? 10,
      lastSet?.weight ?? 0,
      lastSet?.weight_unit ?? 'kg'
    )
  }

  async function handleFinish() {
    if (!activeSession) return
    await sessionsRepo.complete(activeSession.id)
    setActiveSession(null)
    navigate('/')
  }

  function startEditTitle() {
    setTitleDraft(session?.title ?? '')
    setEditingTitle(true)
  }

  async function saveTitle() {
    if (!activeSession || !titleDraft.trim()) return
    await sessionsRepo.update(activeSession.id, { title: titleDraft.trim() })
    setEditingTitle(false)
  }

  function startEditDate() {
    const iso = session?.performed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    setDateDraft(iso)
    setEditingDate(true)
  }

  async function saveDate() {
    if (!activeSession || !dateDraft) return
    // Keep time from existing performed_at, only replace date portion
    const existingTime = session?.performed_at?.slice(10) ?? 'T00:00:00.000Z'
    await sessionsRepo.update(activeSession.id, { performed_at: dateDraft + existingTime })
    setEditingDate(false)
  }

  if (!session) {
    return (
      <div className="p-4 safe-top">
        <p className="text-ink-muted text-center py-8">Nenhum treino em andamento.</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  const displayDate = session.performed_at?.slice(0, 10)
    ? new Date(session.performed_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="pt-2 space-y-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 flex-shrink-0">
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
              <h1 className="font-display text-xl text-ink truncate flex-1">{session.title}</h1>
              <button onClick={startEditTitle} className="p-1 text-ink-muted flex-shrink-0">
                <Pencil size={16} />
              </button>
            </div>
          )}

          <Button size="sm" onClick={handleFinish} className="flex-shrink-0">
            <CheckCircle size={16} className="mr-1" /> Finalizar
          </Button>
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
            userId={user?.id ?? ''}
            sessionId={session.id}
            onAddSet={handleAddSet}
          />
        ))}
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise,
  userId: _userId,
  sessionId: _sessionId,
  onAddSet,
}: {
  exercise: LocalSessionExercise
  userId: string
  sessionId: string
  onAddSet: (id: string, last?: LocalSessionSet) => void
}) {
  const sets = useLiveQuery(
    () => sessionSetsRepo.listByExercise(exercise.id),
    [exercise.id]
  )
  const lastSet = sets?.[sets.length - 1]

  async function handleDeleteSet(setId: string) {
    await sessionSetsRepo.softDelete(setId)
  }

  return (
    <div className="bg-surface rounded-card p-4 space-y-3">
      <h3 className="font-medium text-ink">{exercise.name}</h3>
      <div className="space-y-2">
        {sets?.map(set => (
          <SetRow key={set.id} set={set} onDelete={handleDeleteSet} />
        ))}
      </div>
      <button
        onClick={() => onAddSet(exercise.id, lastSet)}
        className="flex items-center gap-2 text-accent text-sm font-medium py-1"
      >
        <Plus size={16} /> Adicionar série
        {lastSet && <span className="text-ink-muted text-xs">({lastSet.reps}×{lastSet.weight}{lastSet.weight_unit})</span>}
      </button>
    </div>
  )
}

function SetRow({ set, onDelete }: { set: LocalSessionSet; onDelete: (id: string) => void }) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(String(set.weight))
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function scheduleAutosave(newReps: string, newWeight: string) {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      sessionSetsRepo.update(set.id, {
        reps: parseInt(newReps) || 0,
        weight: parseFloat(newWeight) || 0,
      })
    }, 500)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted text-sm w-5 text-right tabular-nums">{set.set_index}</span>
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={e => { setReps(e.target.value); scheduleAutosave(e.target.value, weight) }}
        className="w-14 h-11 text-center bg-bg border border-border rounded-card text-ink font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40"
        placeholder="reps"
      />
      <span className="text-ink-muted text-xs">×</span>
      <input
        type="text"
        inputMode="decimal"
        value={weight}
        onChange={e => { setWeight(e.target.value); scheduleAutosave(reps, e.target.value) }}
        className="w-20 h-11 text-center bg-bg border border-border rounded-card text-ink font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/40"
        placeholder="kg"
      />
      <span className="text-ink-muted text-xs flex-1">{set.weight_unit}</span>
      <button
        onClick={() => onDelete(set.id)}
        className="p-1.5 text-ink-muted active:text-danger"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
