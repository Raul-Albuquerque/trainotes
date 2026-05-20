import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo, sessionExercisesRepo, sessionSetsRepo } from '../../db/repositories/sessions'
import type { LocalSessionSet, LocalSessionExercise } from '../../domain/types'

export function TreinoEmAndamentoPage() {
  const navigate = useNavigate()
  const { user, activeSession, setActiveSession } = useAppStore()

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

  if (!session) {
    return (
      <div className="p-4 safe-top">
        <p className="text-ink-muted text-center py-8">Nenhum treino em andamento.</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/')} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink flex-1 truncate">{session.title}</h1>
        <Button size="sm" onClick={handleFinish}>
          <CheckCircle size={16} className="mr-1" /> Finalizar
        </Button>
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

  return (
    <div className="bg-surface rounded-card p-4 space-y-3">
      <h3 className="font-medium text-ink">{exercise.name}</h3>
      <div className="space-y-2">
        {sets?.map(set => (
          <SetRow key={set.id} set={set} />
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

function SetRow({ set }: { set: LocalSessionSet }) {
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
      <span className="text-ink-muted text-xs">{set.weight_unit}</span>
    </div>
  )
}
