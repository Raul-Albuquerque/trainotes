import Dexie, { type Table } from 'dexie'
import type {
  LocalWorkoutTemplate,
  LocalTemplateExercise,
  LocalWorkoutSession,
  LocalSessionExercise,
  LocalSessionSet,
  Profile,
} from '../domain/types'

export class TrainotesDB extends Dexie {
  profiles!: Table<Profile>
  workout_templates!: Table<LocalWorkoutTemplate>
  template_exercises!: Table<LocalTemplateExercise>
  workout_sessions!: Table<LocalWorkoutSession>
  session_exercises!: Table<LocalSessionExercise>
  session_sets!: Table<LocalSessionSet>

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
  }
}

export const db = new TrainotesDB()
