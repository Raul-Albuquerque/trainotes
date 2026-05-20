import { supabase } from '../supabase/client'
import { db } from '../db/dexie'

const PULL_KEY = 'trainotes_last_pull_at'

function getLastPullAt(table: string): string {
  return localStorage.getItem(`${PULL_KEY}_${table}`) ?? '1970-01-01T00:00:00Z'
}

function setLastPullAt(table: string, value: string) {
  localStorage.setItem(`${PULL_KEY}_${table}`, value)
}

async function pushTable(
  localTable: typeof db.workout_templates | typeof db.template_exercises | typeof db.workout_sessions | typeof db.session_exercises | typeof db.session_sets,
  remoteTableName: string,
  userId: string
) {
  const dirty = await (localTable as any)
    .where('user_id').equals(userId)
    .filter((r: { is_dirty: 0 | 1 }) => r.is_dirty === 1)
    .toArray()

  if (dirty.length === 0) return

  const toUpsert = dirty.map(({ is_dirty: _d, is_deleted_local: _dl, local_updated_at: _lu, last_synced_at: _ls, sync_error: _se, ...rest }: any) => rest)

  const { error } = await supabase.from(remoteTableName).upsert(toUpsert, { onConflict: 'id' })
  if (error) {
    for (const record of dirty) {
      await (localTable as any).update(record.id, { sync_error: error.message })
    }
    throw error
  }

  const now = Date.now()
  for (const record of dirty) {
    await (localTable as any).update(record.id, { is_dirty: 0, last_synced_at: now, sync_error: null })
  }
}

async function pullTable(
  localTable: any,
  remoteTableName: string,
  userId: string,
) {
  const since = getLastPullAt(remoteTableName)
  const { data, error } = await supabase
    .from(remoteTableName)
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('updated_at')

  if (error) throw error
  if (!data || data.length === 0) return

  const now = Date.now()
  for (const remote of data) {
    const local = await localTable.get(remote.id)
    if (local && local.is_dirty === 1 && local.local_updated_at > new Date(remote.updated_at).getTime()) {
      continue
    }
    await localTable.put({ ...remote, is_dirty: 0, is_deleted_local: 0, local_updated_at: now, last_synced_at: now, sync_error: null })
  }

  const lastUpdatedAt = data[data.length - 1].updated_at
  setLastPullAt(remoteTableName, lastUpdatedAt)
}

export async function syncAll(userId: string) {
  const TABLES = [
    { local: db.workout_templates, remote: 'workout_templates' },
    { local: db.template_exercises, remote: 'template_exercises' },
    { local: db.workout_sessions, remote: 'workout_sessions' },
    { local: db.session_exercises, remote: 'session_exercises' },
    { local: db.session_sets, remote: 'session_sets' },
  ] as const

  for (const { local, remote } of TABLES) {
    await pushTable(local as any, remote, userId)
  }
  for (const { local, remote } of TABLES) {
    await pullTable(local, remote, userId)
  }
}

let syncTimer: ReturnType<typeof setInterval> | null = null

export function startSyncLoop(userId: string) {
  syncAll(userId).catch(console.error)
  syncTimer = setInterval(() => syncAll(userId).catch(console.error), 60_000)
}

export function stopSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}
