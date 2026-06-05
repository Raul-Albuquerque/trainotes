import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '../../app/store'
import { convertAllSetsUnit } from '../../db/repositories/units'
import type { WeightUnit } from '../../domain/types'

export function PreferenciasPage() {
  const { user, weightUnit, setWeightUnit } = useAppStore()
  const navigate = useNavigate()
  const [converting, setConverting] = useState(false)

  async function handleUnitChange(next: WeightUnit) {
    if (!user || next === weightUnit) return
    setConverting(true)
    try {
      await convertAllSetsUnit(user.id, weightUnit, next)
      setWeightUnit(next)
    } catch (e) {
      console.error(e)
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-60">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Preferências</h1>
      </header>

      <div className="px-4 py-5 space-y-5 flex-1">
        <div className="space-y-3">
          <div>
            <p className="text-ink font-medium text-sm">Unidade de medida de peso</p>
            <p className="text-ink-muted text-xs mt-0.5">
              Ao trocar, todos os seus registros de carga serão convertidos automaticamente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUnitChange('kg')}
              disabled={converting}
              className={[
                'rounded-card border p-4 text-left transition-colors active:opacity-80 disabled:opacity-50',
                weightUnit === 'kg'
                  ? 'bg-accent border-accent'
                  : 'bg-surface border-border',
              ].join(' ')}
            >
              <p className={['text-xl font-semibold font-display', weightUnit === 'kg' ? 'text-white' : 'text-ink'].join(' ')}>
                kg
              </p>
              <p className={['text-xs mt-1 leading-snug', weightUnit === 'kg' ? 'text-white/80' : 'text-ink-muted'].join(' ')}>
                Sistema Internacional
              </p>
              <p className={['text-xs leading-snug', weightUnit === 'kg' ? 'text-white/60' : 'text-ink-muted'].join(' ')}>
                quilogramas, metros, cm
              </p>
            </button>

            <button
              onClick={() => handleUnitChange('lb')}
              disabled={converting}
              className={[
                'rounded-card border p-4 text-left transition-colors active:opacity-80 disabled:opacity-50',
                weightUnit === 'lb'
                  ? 'bg-accent border-accent'
                  : 'bg-surface border-border',
              ].join(' ')}
            >
              <p className={['text-xl font-semibold font-display', weightUnit === 'lb' ? 'text-white' : 'text-ink'].join(' ')}>
                lb
              </p>
              <p className={['text-xs mt-1 leading-snug', weightUnit === 'lb' ? 'text-white/80' : 'text-ink-muted'].join(' ')}>
                Sistema Imperial
              </p>
              <p className={['text-xs leading-snug', weightUnit === 'lb' ? 'text-white/60' : 'text-ink-muted'].join(' ')}>
                libras, polegadas, pés
              </p>
            </button>
          </div>

          {converting && (
            <p className="text-ink-muted text-xs text-center">Convertendo registros...</p>
          )}
        </div>
      </div>
    </div>
  )
}
