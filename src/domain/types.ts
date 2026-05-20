export type WeightUnit = 'kg' | 'lb'
export type TemplateStatus = 'active' | 'archived'
export type SessionStatus = 'in_progress' | 'completed' | 'archived'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  default_weight_unit: WeightUnit
  created_at: string
  updated_at: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  status: TemplateStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TemplateExercise {
  id: string
  user_id: string
  template_id: string
  name: string
  order_index: number
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  rest_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface WorkoutSession {
  id: string
  user_id: string
  template_id: string | null
  title: string
  performed_at: string
  status: SessionStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SessionExercise {
  id: string
  user_id: string
  session_id: string
  template_exercise_id: string | null
  name: string
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SessionSet {
  id: string
  user_id: string
  session_id: string
  session_exercise_id: string
  set_index: number
  reps: number
  weight: number
  weight_unit: WeightUnit
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Sync metadata fields added locally
export interface SyncMeta {
  is_dirty: 0 | 1
  is_deleted_local: 0 | 1
  local_updated_at: number
  last_synced_at: number | null
  sync_error: string | null
}

export type LocalWorkoutTemplate = WorkoutTemplate & SyncMeta
export type LocalTemplateExercise = TemplateExercise & SyncMeta
export type LocalWorkoutSession = WorkoutSession & SyncMeta
export type LocalSessionExercise = SessionExercise & SyncMeta
export type LocalSessionSet = SessionSet & SyncMeta
