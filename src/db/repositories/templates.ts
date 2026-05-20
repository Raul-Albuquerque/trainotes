import { db } from '../dexie'
import type { LocalWorkoutTemplate, LocalTemplateExercise, WorkoutTemplate, TemplateExercise } from '../../domain/types'

function now() { return Date.now() }
function isoNow() { return new Date().toISOString() }

export const templatesRepo = {
  async list(userId: string) {
    return db.workout_templates
      .where('user_id').equals(userId)
      .filter(t => t.deleted_at === null && t.is_deleted_local === 0)
      .sortBy('updated_at')
  },

  async get(id: string) {
    return db.workout_templates.get(id)
  },

  async create(userId: string, data: Pick<WorkoutTemplate, 'name' | 'description'>): Promise<LocalWorkoutTemplate> {
    const record: LocalWorkoutTemplate = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: data.name,
      description: data.description,
      status: 'active',
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.workout_templates.add(record)
    return record
  },

  async update(id: string, data: Partial<Pick<WorkoutTemplate, 'name' | 'description' | 'status'>>) {
    await db.workout_templates.update(id, {
      ...data,
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.workout_templates.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}

export const templateExercisesRepo = {
  async listByTemplate(templateId: string) {
    return db.template_exercises
      .where('template_id').equals(templateId)
      .filter(e => e.deleted_at === null && e.is_deleted_local === 0)
      .sortBy('order_index')
  },

  async create(userId: string, templateId: string, data: Omit<TemplateExercise, 'id' | 'user_id' | 'template_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<LocalTemplateExercise> {
    const record: LocalTemplateExercise = {
      id: crypto.randomUUID(),
      user_id: userId,
      template_id: templateId,
      ...data,
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.template_exercises.add(record)
    return record
  },

  async update(id: string, data: Partial<TemplateExercise>) {
    await db.template_exercises.update(id, {
      ...data,
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.template_exercises.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}
