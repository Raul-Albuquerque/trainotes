export type WeightUnit = 'kg' | 'lb'
export type TemplateStatus = 'active' | 'archived'
export type SessionStatus = 'in_progress' | 'completed' | 'archived'
export type WorkoutType = 'strength' | 'cardio'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  default_weight_unit: WeightUnit
  height_cm: number | null
  created_at: string
  updated_at: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  workout_type: WorkoutType
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
  workout_type: WorkoutType
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
  duration_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PhysicalAssessment {
  id: string
  user_id: string
  assessed_at: string
  notes: string | null
  // Weight & height
  weight_kg: number | null
  height_cm: number | null
  // Circumferences (cm)
  waist_cm: number | null
  abdomen_cm: number | null
  hip_cm: number | null
  chest_cm: number | null
  // Bilateral measurements (cm)
  arm_relaxed_left_cm: number | null
  arm_relaxed_right_cm: number | null
  arm_flexed_left_cm: number | null
  arm_flexed_right_cm: number | null
  thigh_left_cm: number | null
  thigh_right_cm: number | null
  calf_left_cm: number | null
  calf_right_cm: number | null
  // Calculated (stored for historical consistency)
  bmi: number | null
  whr: number | null
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
export type LocalPhysicalAssessment = PhysicalAssessment & SyncMeta
