import Dexie, { type Table } from 'dexie'
import type {
  LocalWorkoutTemplate,
  LocalTemplateExercise,
  LocalWorkoutSession,
  LocalSessionExercise,
  LocalSessionSet,
  LocalPhysicalAssessment,
  Profile,
} from '../domain/types'

export class TrainotesDB extends Dexie {
  profiles!: Table<Profile>
  workout_templates!: Table<LocalWorkoutTemplate>
  template_exercises!: Table<LocalTemplateExercise>
  workout_sessions!: Table<LocalWorkoutSession>
  session_exercises!: Table<LocalSessionExercise>
  session_sets!: Table<LocalSessionSet>
  physical_assessments!: Table<LocalPhysicalAssessment>

  constructor() {
    super('trainotes')
    this.version(1).stores({
      profiles: 'id, email',
      workout_templates: 'id, user_id, status, updated_at, is_dirty, deleted_at',
      template_exercises: 'id, user_id, template_id, order_index, updated_at, is_dirty, deleted_at',
      workout_sessions: 'id, user_id, template_id, status, performed_at, updated_at, is_dirty, deleted_at',
      session_exercises: 'id, user_id, session_id, order_index, updated_at, is_dirty, deleted_at',
      session_sets: 'id, user_id, session_id, session_exercise_id, set_index, updated_at, is_dirty, deleted_at',
    })
    // v2: add workout_type to templates and sessions; duration_seconds to sets
    this.version(2).stores({
      profiles: 'id, email',
      workout_templates: 'id, user_id, status, updated_at, is_dirty, deleted_at',
      template_exercises: 'id, user_id, template_id, order_index, updated_at, is_dirty, deleted_at',
      workout_sessions: 'id, user_id, template_id, status, performed_at, updated_at, is_dirty, deleted_at',
      session_exercises: 'id, user_id, session_id, order_index, updated_at, is_dirty, deleted_at',
      session_sets: 'id, user_id, session_id, session_exercise_id, set_index, updated_at, is_dirty, deleted_at',
    }).upgrade(tx => {
      tx.table('workout_templates').toCollection().modify(t => { if (!t.workout_type) t.workout_type = 'strength' })
      tx.table('workout_sessions').toCollection().modify(s => { if (!s.workout_type) s.workout_type = 'strength' })
      tx.table('session_sets').toCollection().modify(s => { if (s.duration_seconds === undefined) s.duration_seconds = null })
    })
    // v3: physical assessments table
    this.version(3).stores({
      profiles: 'id, email',
      workout_templates: 'id, user_id, status, updated_at, is_dirty, deleted_at',
      template_exercises: 'id, user_id, template_id, order_index, updated_at, is_dirty, deleted_at',
      workout_sessions: 'id, user_id, template_id, status, performed_at, updated_at, is_dirty, deleted_at',
      session_exercises: 'id, user_id, session_id, order_index, updated_at, is_dirty, deleted_at',
      session_sets: 'id, user_id, session_id, session_exercise_id, set_index, updated_at, is_dirty, deleted_at',
      physical_assessments: 'id, user_id, assessed_at, updated_at, is_dirty, deleted_at',
    })
  }
}

export const db = new TrainotesDB()
