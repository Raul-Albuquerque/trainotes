import { db } from '../dexie'
import type { LocalWorkoutSession, LocalSessionExercise, LocalSessionSet, WorkoutTemplate, TemplateExercise, WorkoutType } from '../../domain/types'

function now() { return Date.now() }
function isoNow() { return new Date().toISOString() }

export const sessionsRepo = {
  async list(userId: string, limit = 50) {
    return db.workout_sessions
      .where('user_id').equals(userId)
      .filter(s => s.deleted_at === null && s.is_deleted_local === 0)
      .reverse()
      .sortBy('performed_at')
      .then(r => r.slice(0, limit))
  },

  async get(id: string) {
    return db.workout_sessions.get(id)
  },

  async getInProgress(userId: string) {
    return db.workout_sessions
      .where('user_id').equals(userId)
      .filter(s => s.status === 'in_progress' && s.is_deleted_local === 0)
      .first()
  },

  async createFromTemplate(userId: string, template: WorkoutTemplate, exercises: TemplateExercise[]): Promise<LocalWorkoutSession> {
    const sessionId = crypto.randomUUID()
    const session: LocalWorkoutSession = {
      id: sessionId,
      user_id: userId,
      template_id: template.id,
      title: template.name,
      performed_at: isoNow(),
      status: 'in_progress',
      workout_type: template.workout_type ?? 'strength',
      notes: null,
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.workout_sessions.add(session)

    for (const exercise of exercises) {
      const sessionExercise: LocalSessionExercise = {
        id: crypto.randomUUID(),
        user_id: userId,
        session_id: sessionId,
        template_exercise_id: exercise.id,
        name: exercise.name,
        order_index: exercise.order_index,
        notes: null,
        created_at: isoNow(),
        updated_at: isoNow(),
        deleted_at: null,
        is_dirty: 1,
        is_deleted_local: 0,
        local_updated_at: now(),
        last_synced_at: null,
        sync_error: null,
      }
      await db.session_exercises.add(sessionExercise)
    }

    return session
  },

  async createFree(userId: string, title: string, workoutType: WorkoutType = 'strength'): Promise<LocalWorkoutSession> {
    const session: LocalWorkoutSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      template_id: null,
      title,
      performed_at: isoNow(),
      status: 'in_progress',
      workout_type: workoutType,
      notes: null,
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.workout_sessions.add(session)
    return session
  },

  async complete(id: string) {
    await db.workout_sessions.update(id, {
      status: 'completed',
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async update(id: string, data: Partial<Pick<LocalWorkoutSession, 'title' | 'notes' | 'status' | 'performed_at' | 'workout_type'>>) {
    await db.workout_sessions.update(id, {
      ...data,
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.workout_sessions.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}

export const sessionExercisesRepo = {
  async listBySession(sessionId: string) {
    return db.session_exercises
      .where('session_id').equals(sessionId)
      .filter(e => e.deleted_at === null && e.is_deleted_local === 0)
      .sortBy('order_index')
  },

  async create(userId: string, sessionId: string, name: string, orderIndex: number): Promise<LocalSessionExercise> {
    const record: LocalSessionExercise = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId,
      template_exercise_id: null,
      name,
      order_index: orderIndex,
      notes: null,
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.session_exercises.add(record)
    return record
  },

  async update(id: string, data: Partial<Pick<LocalSessionExercise, 'name' | 'notes'>>) {
    await db.session_exercises.update(id, {
      ...data,
      is_dirty: 1,
      updated_at: isoNow(),
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.session_exercises.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}

export const sessionSetsRepo = {
  async listByExercise(sessionExerciseId: string) {
    return db.session_sets
      .where('session_exercise_id').equals(sessionExerciseId)
      .filter(s => s.deleted_at === null && s.is_deleted_local === 0)
      .sortBy('set_index')
  },

  async listBySession(sessionId: string) {
    return db.session_sets
      .where('session_id').equals(sessionId)
      .filter(s => s.deleted_at === null && s.is_deleted_local === 0)
      .toArray()
  },

  async create(userId: string, sessionId: string, sessionExerciseId: string, setIndex: number, reps: number, weight: number, weightUnit: 'kg' | 'lb', durationSeconds: number | null = null): Promise<LocalSessionSet> {
    const record: LocalSessionSet = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId,
      session_exercise_id: sessionExerciseId,
      set_index: setIndex,
      reps,
      weight,
      weight_unit: weightUnit,
      duration_seconds: durationSeconds,
      notes: null,
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.session_sets.add(record)
    return record
  },

  async update(id: string, data: Partial<Pick<LocalSessionSet, 'reps' | 'weight' | 'weight_unit' | 'duration_seconds' | 'notes'>>) {
    await db.session_sets.update(id, {
      ...data,
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.session_sets.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}
