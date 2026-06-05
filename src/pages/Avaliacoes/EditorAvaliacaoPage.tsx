import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useAppStore } from '../../app/store'
import { assessmentsRepo } from '../../db/repositories/assessments'
import type { PhysicalAssessment } from '../../domain/types'

type MeasureFields = Omit<PhysicalAssessment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'bmi' | 'whr'>

type FormState = {
  assessed_at: string
  notes: string
  weight_kg: string
  height_cm: string
  waist_cm: string
  abdomen_cm: string
  hip_cm: string
  chest_cm: string
  arm_relaxed_left_cm: string
  arm_relaxed_right_cm: string
  arm_flexed_left_cm: string
  arm_flexed_right_cm: string
  thigh_left_cm: string
  thigh_right_cm: string
  calf_left_cm: string
  calf_right_cm: string
}

function toNum(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? null : n
}

function toStr(v: number | null | undefined): string {
  return v != null ? String(v) : ''
}

function calcBmi(weight: string, height: string): string {
  const w = toNum(weight)
  const h = toNum(height)
  if (!w || !h) return ''
  const m = h / 100
  return (Math.round((w / (m * m)) * 10) / 10).toFixed(1)
}

function calcWhr(waist: string, hip: string): string {
  const w = toNum(waist)
  const h = toNum(hip)
  if (!w || !h) return ''
  return (Math.round((w / h) * 100) / 100).toFixed(2)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider pt-2">{children}</h2>
  )
}

const numInputClass = 'h-10 w-full px-3 bg-bg border border-border rounded-card text-ink text-right placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow tabular-nums'

function MeasureRow({ label, value, onChange, placeholder = '—' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm text-ink flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${numInputClass} w-20`}
        />
        <span className="text-xs text-ink-muted">cm</span>
      </div>
    </div>
  )
}

function BilateralRow({ label, leftValue, rightValue, onChangeLeft, onChangeRight }: {
  label: string
  leftValue: string
  rightValue: string
  onChangeLeft: (v: string) => void
  onChangeRight: (v: string) => void
}) {
  return (
    <div className="min-w-0">
      <span className="text-sm text-ink block mb-1.5">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-ink-muted flex-shrink-0">Esq</span>
          <input
            type="number"
            inputMode="decimal"
            value={leftValue}
            onChange={e => onChangeLeft(e.target.value)}
            placeholder="—"
            className={`${numInputClass} flex-1 min-w-0`}
          />
          <span className="text-xs text-ink-muted flex-shrink-0">cm</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-ink-muted flex-shrink-0">Dir</span>
          <input
            type="number"
            inputMode="decimal"
            value={rightValue}
            onChange={e => onChangeRight(e.target.value)}
            placeholder="—"
            className={`${numInputClass} flex-1 min-w-0`}
          />
          <span className="text-xs text-ink-muted flex-shrink-0">cm</span>
        </div>
      </div>
    </div>
  )
}

const emptyForm: FormState = {
  assessed_at: todayIso(),
  notes: '',
  weight_kg: '',
  height_cm: '',
  waist_cm: '',
  abdomen_cm: '',
  hip_cm: '',
  chest_cm: '',
  arm_relaxed_left_cm: '',
  arm_relaxed_right_cm: '',
  arm_flexed_left_cm: '',
  arm_flexed_right_cm: '',
  thigh_left_cm: '',
  thigh_right_cm: '',
  calf_left_cm: '',
  calf_right_cm: '',
}

export function EditorAvaliacaoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAppStore()
  const isNew = !id

  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!isNew)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    assessmentsRepo.get(id).then(a => {
      if (!a) { navigate('/avaliacoes', { replace: true }); return }
      setForm({
        assessed_at: a.assessed_at.slice(0, 10),
        notes: a.notes ?? '',
        weight_kg: toStr(a.weight_kg),
        height_cm: toStr(a.height_cm),
        waist_cm: toStr(a.waist_cm),
        abdomen_cm: toStr(a.abdomen_cm),
        hip_cm: toStr(a.hip_cm),
        chest_cm: toStr(a.chest_cm),
        arm_relaxed_left_cm: toStr(a.arm_relaxed_left_cm),
        arm_relaxed_right_cm: toStr(a.arm_relaxed_right_cm),
        arm_flexed_left_cm: toStr(a.arm_flexed_left_cm),
        arm_flexed_right_cm: toStr(a.arm_flexed_right_cm),
        thigh_left_cm: toStr(a.thigh_left_cm),
        thigh_right_cm: toStr(a.thigh_right_cm),
        calf_left_cm: toStr(a.calf_left_cm),
        calf_right_cm: toStr(a.calf_right_cm),
      })
      setLoadingData(false)
    })
  }, [id, navigate])

  function set(field: keyof FormState) {
    return (v: string) => setForm(prev => ({ ...prev, [field]: v }))
  }

  function buildData(): MeasureFields {
    return {
      assessed_at: form.assessed_at || todayIso(),
      notes: form.notes.trim() || null,
      weight_kg: toNum(form.weight_kg),
      height_cm: toNum(form.height_cm),
      waist_cm: toNum(form.waist_cm),
      abdomen_cm: toNum(form.abdomen_cm),
      hip_cm: toNum(form.hip_cm),
      chest_cm: toNum(form.chest_cm),
      arm_relaxed_left_cm: toNum(form.arm_relaxed_left_cm),
      arm_relaxed_right_cm: toNum(form.arm_relaxed_right_cm),
      arm_flexed_left_cm: toNum(form.arm_flexed_left_cm),
      arm_flexed_right_cm: toNum(form.arm_flexed_right_cm),
      thigh_left_cm: toNum(form.thigh_left_cm),
      thigh_right_cm: toNum(form.thigh_right_cm),
      calf_left_cm: toNum(form.calf_left_cm),
      calf_right_cm: toNum(form.calf_right_cm),
    }
  }

  async function handleSave() {
    if (!user) return
    setLoading(true)
    const data = buildData()
    if (isNew) {
      await assessmentsRepo.create(user.id, data)
    } else {
      await assessmentsRepo.update(id!, data)
    }
    setLoading(false)
    navigate('/avaliacoes')
  }

  async function handleDelete() {
    if (!id) return
    await assessmentsRepo.softDelete(id)
    navigate('/avaliacoes', { replace: true })
  }

  const bmi = calcBmi(form.weight_kg, form.height_cm)
  const whr = calcWhr(form.waist_cm, form.hip_cm)

  if (loadingData) {
    return (
      <div className="p-4 safe-top">
        <p className="text-ink-muted text-sm text-center py-8">Carregando…</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 safe-top pb-24 overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <button
          onClick={() => navigate('/avaliacoes')}
          className="flex items-center gap-1 text-ink-soft active:text-ink"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Avaliações</span>
        </button>
        <h1 className="font-display text-xl text-ink">
          {isNew ? 'Nova avaliação' : 'Editar avaliação'}
        </h1>
        {!isNew && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-ink-muted active:text-danger"
          >
            <Trash2 size={18} />
          </button>
        )}
        {isNew && <div className="w-10" />}
      </header>

      {/* Date */}
      <div>
        <SectionTitle>Data</SectionTitle>
        <div className="mt-2">
          <Input
            type="date"
            value={form.assessed_at}
            onChange={e => setForm(prev => ({ ...prev, assessed_at: e.target.value }))}
          />
        </div>
      </div>

      {/* Weight & Height */}
      <div className="space-y-3">
        <SectionTitle>Peso e Altura</SectionTitle>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="decimal"
              placeholder="Ex: 82.5"
              value={form.weight_kg}
              onChange={e => setForm(prev => ({ ...prev, weight_kg: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Altura (cm)"
              type="number"
              inputMode="decimal"
              placeholder="Ex: 178"
              value={form.height_cm}
              onChange={e => setForm(prev => ({ ...prev, height_cm: e.target.value }))}
            />
          </div>
        </div>

        {/* Calculated */}
        {(bmi || whr) && (
          <div className="flex gap-3 px-1">
            {bmi && (
              <div className="flex-1 bg-surface rounded-card px-3 py-2 text-center">
                <p className="text-xs text-ink-muted">IMC</p>
                <p className="text-lg font-semibold text-ink tabular-nums">{bmi}</p>
              </div>
            )}
            {whr && (
              <div className="flex-1 bg-surface rounded-card px-3 py-2 text-center">
                <p className="text-xs text-ink-muted">RCQ</p>
                <p className="text-lg font-semibold text-ink tabular-nums">{whr}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Circumferences */}
      <div className="space-y-3">
        <SectionTitle>Circunferências</SectionTitle>
        <div className="bg-surface rounded-card p-4 space-y-4">
          <MeasureRow label="Cintura" value={form.waist_cm} onChange={set('waist_cm')} />
          <MeasureRow label="Abdômen" value={form.abdomen_cm} onChange={set('abdomen_cm')} />
          <MeasureRow label="Quadril" value={form.hip_cm} onChange={set('hip_cm')} />
          <MeasureRow label="Tórax" value={form.chest_cm} onChange={set('chest_cm')} />
        </div>
      </div>

      {/* Bilateral */}
      <div className="space-y-3">
        <SectionTitle>Medidas Bilaterais</SectionTitle>
        <div className="bg-surface rounded-card p-3 space-y-5">
          <BilateralRow
            label="Braço relaxado"
            leftValue={form.arm_relaxed_left_cm}
            rightValue={form.arm_relaxed_right_cm}
            onChangeLeft={set('arm_relaxed_left_cm')}
            onChangeRight={set('arm_relaxed_right_cm')}
          />
          <BilateralRow
            label="Braço contraído"
            leftValue={form.arm_flexed_left_cm}
            rightValue={form.arm_flexed_right_cm}
            onChangeLeft={set('arm_flexed_left_cm')}
            onChangeRight={set('arm_flexed_right_cm')}
          />
          <BilateralRow
            label="Coxa"
            leftValue={form.thigh_left_cm}
            rightValue={form.thigh_right_cm}
            onChangeLeft={set('thigh_left_cm')}
            onChangeRight={set('thigh_right_cm')}
          />
          <BilateralRow
            label="Panturrilha"
            leftValue={form.calf_left_cm}
            rightValue={form.calf_right_cm}
            onChangeLeft={set('calf_left_cm')}
            onChangeRight={set('calf_right_cm')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <SectionTitle>Observações</SectionTitle>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notas opcionais sobre esta avaliação…"
          rows={3}
          className="mt-2 w-full px-3 py-2.5 bg-surface border border-border rounded-card text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow resize-none text-sm"
        />
      </div>

      {/* Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg border-t border-border safe-bottom">
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          <Save size={16} className="mr-2" />
          {loading ? 'Salvando…' : 'Salvar avaliação'}
        </Button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Apagar avaliação?"
        description="Esta avaliação será removida permanentemente."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
