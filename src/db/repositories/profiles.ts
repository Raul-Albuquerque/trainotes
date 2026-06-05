import { db } from '../dexie'
import type { Profile, WeightUnit } from '../../domain/types'

function isoNow() { return new Date().toISOString() }

export const profilesRepo = {
  async get(userId: string): Promise<Profile | undefined> {
    return db.profiles.get(userId)
  },

  async upsert(userId: string, data: Partial<Pick<Profile, 'display_name' | 'height_cm' | 'default_weight_unit'>>) {
    const existing = await db.profiles.get(userId)
    if (existing) {
      await db.profiles.update(userId, { ...data, updated_at: isoNow() })
    } else {
      await db.profiles.add({
        id: userId,
        email: '',
        display_name: null,
        default_weight_unit: 'kg' as WeightUnit,
        height_cm: null,
        created_at: isoNow(),
        updated_at: isoNow(),
        ...data,
      })
    }
  },
}
