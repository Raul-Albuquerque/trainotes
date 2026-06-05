import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { generatePDF } from '../../pdf/report'

function getDateRange(period: string, customFrom: string, customTo: string): { from: Date; to: Date } | null {
  const now = new Date()
  if (period === 'month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  }
  if (period === '3months') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  }
  if (period === 'custom' && customFrom && customTo) {
    return {
      from: new Date(customFrom + 'T00:00:00'),
      to: new Date(customTo + 'T23:59:59'),
    }
  }
  return null
}

export function RelatorioPage() {
  const { user } = useAppStore()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(false)

  const customRangeInvalid = period === 'custom' && (!customFrom || !customTo || customFrom > customTo)

  function getPeriodLabel() {
    if (period === 'month') return 'Este mês'
    if (period === '3months') return 'Últimos 3 meses'
    if (period === 'all') return 'Todos os treinos'
    if (period === 'custom' && customFrom && customTo) {
      const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
      return `${fmt(customFrom)} a ${fmt(customTo)}`
    }
    return undefined
  }

  async function handleGeneratePDF() {
    if (!user) return
    setLoading(true)
    try {
      const sessions = await sessionsRepo.list(user.id, 200)
      const range = getDateRange(period, customFrom, customTo)
      const completed = sessions.filter(s => {
        if (s.status !== 'completed') return false
        if (!range) return true
        const d = new Date(s.performed_at)
        return d >= range.from && d <= range.to
      })
      await generatePDF(completed, user.email ?? 'Usuário', getPeriodLabel())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-60">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Relatório</h1>
      </header>

      <div className="px-4 py-5 space-y-4 flex-1">
        <p className="text-ink-muted text-sm">Gere um PDF com seus treinos do período selecionado.</p>

        <div className="space-y-1">
          <label className="text-ink-soft text-xs font-medium">Período</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full h-11 px-3 bg-bg border border-border rounded-card text-ink focus:outline-none"
          >
            <option value="month">Este mês</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="all">Todos</option>
            <option value="custom">Período customizado</option>
          </select>
        </div>

        {period === 'custom' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-ink-muted text-xs">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                max={customTo || undefined}
                className="w-full h-11 px-3 bg-bg border border-border rounded-card text-ink focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-ink-muted text-xs">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                min={customFrom || undefined}
                className="w-full h-11 px-3 bg-bg border border-border rounded-card text-ink focus:outline-none"
              />
            </div>
            {customRangeInvalid && customFrom && customTo && (
              <p className="text-danger text-xs">A data inicial deve ser anterior à data final.</p>
            )}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleGeneratePDF}
          disabled={loading || customRangeInvalid}
        >
          <FileText size={20} className="mr-2" />
          {loading ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>
      </div>
    </div>
  )
}
