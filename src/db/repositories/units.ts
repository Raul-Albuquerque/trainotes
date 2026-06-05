import { db } from '../dexie'
import type { WeightUnit } from '../../domain/types'
import { convertWeight } from '../../lib/units'

function isoNow() { return new Date().toISOString() }

/**
 * Converts all session_sets for a user from one unit to another.
 * Updates weight value and weight_unit in place, rounded to integer.
 */
export async function convertAllSetsUnit(userId: string, from: WeightUnit, to: WeightUnit): Promise<void> {
  if (from === to) return

  await db.transaction('rw', db.session_sets, async () => {
    const sets = await db.session_sets
      .where('user_id').equals(userId)
      .filter(s => s.is_deleted_local === 0 && s.deleted_at === null)
      .toArray()

    for (const s of sets) {
      await db.session_sets.update(s.id, {
        weight: convertWeight(s.weight, from, to),
        weight_unit: to,
        updated_at: isoNow(),
        is_dirty: 1,
        local_updated_at: Date.now(),
      })
    }
  })
}
