import { db } from '../dexie'
import type { LocalPhysicalAssessment, PhysicalAssessment } from '../../domain/types'

function now() { return Date.now() }
function isoNow() { return new Date().toISOString() }

type AssessmentData = Omit<PhysicalAssessment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'bmi' | 'whr'>

function calcBmi(weight_kg: number | null, height_cm: number | null): number | null {
  if (!weight_kg || !height_cm) return null
  const h = height_cm / 100
  return Math.round((weight_kg / (h * h)) * 10) / 10
}

function calcWhr(waist_cm: number | null, hip_cm: number | null): number | null {
  if (!waist_cm || !hip_cm) return null
  return Math.round((waist_cm / hip_cm) * 100) / 100
}

export const assessmentsRepo = {
  async list(userId: string) {
    return db.physical_assessments
      .where('user_id').equals(userId)
      .filter(a => a.deleted_at === null && a.is_deleted_local === 0)
      .reverse()
      .sortBy('assessed_at')
  },

  async get(id: string) {
    return db.physical_assessments.get(id)
  },

  async create(userId: string, data: AssessmentData): Promise<LocalPhysicalAssessment> {
    const record: LocalPhysicalAssessment = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...data,
      bmi: calcBmi(data.weight_kg, data.height_cm),
      whr: calcWhr(data.waist_cm, data.hip_cm),
      created_at: isoNow(),
      updated_at: isoNow(),
      deleted_at: null,
      is_dirty: 1,
      is_deleted_local: 0,
      local_updated_at: now(),
      last_synced_at: null,
      sync_error: null,
    }
    await db.physical_assessments.add(record)
    return record
  },

  async update(id: string, data: Partial<AssessmentData>) {
    const existing = await db.physical_assessments.get(id)
    if (!existing) return
    const merged = { ...existing, ...data }
    await db.physical_assessments.update(id, {
      ...data,
      bmi: calcBmi(merged.weight_kg, merged.height_cm),
      whr: calcWhr(merged.waist_cm, merged.hip_cm),
      updated_at: isoNow(),
      is_dirty: 1,
      local_updated_at: now(),
    })
  },

  async softDelete(id: string) {
    await db.physical_assessments.update(id, {
      deleted_at: isoNow(),
      is_dirty: 1,
      is_deleted_local: 1,
      local_updated_at: now(),
    })
  },
}
