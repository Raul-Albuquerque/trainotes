import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { LocalWorkoutSession, WeightUnit } from '../domain/types'

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

interface AppState {
  user: User | null
  setUser: (user: User | null) => void

  // true após a verificação inicial de sessão ser concluída
  authReady: boolean
  setAuthReady: (ready: boolean) => void

  activeSession: LocalWorkoutSession | null
  setActiveSession: (session: LocalWorkoutSession | null) => void

  syncStatus: SyncStatus
  setSyncStatus: (status: SyncStatus) => void
  lastSyncError: string | null
  setLastSyncError: (err: string | null) => void

  weightUnit: WeightUnit
  setWeightUnit: (unit: WeightUnit) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      authReady: false,
      setAuthReady: (authReady) => set({ authReady }),

      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),

      syncStatus: 'idle',
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      lastSyncError: null,
      setLastSyncError: (lastSyncError) => set({ lastSyncError }),

      weightUnit: 'kg',
      setWeightUnit: (weightUnit) => set({ weightUnit }),
    }),
    {
      name: 'trainotes-prefs',
      partialize: (state) => ({ weightUnit: state.weightUnit }),
    }
  )
)
