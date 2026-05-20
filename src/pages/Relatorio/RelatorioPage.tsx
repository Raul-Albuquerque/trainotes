import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { generatePDF } from '../../pdf/report'

export function RelatorioPage() {
  const { user } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')

  async function handleGeneratePDF() {
    if (!user) return
    setLoading(true)
    try {
      const sessions = await sessionsRepo.list(user.id, 200)
      const completed = sessions.filter(s => s.status === 'completed')
      await generatePDF(completed, user.email ?? 'Usuário')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6 safe-top">
      <header className="pt-2">
        <h1 className="font-display text-2xl text-ink">Relatório</h1>
      </header>

      <div className="bg-surface rounded-card p-4 space-y-4">
        <p className="text-ink-soft text-sm">Gere um PDF com seus treinos do período selecionado.</p>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="w-full h-11 px-3 bg-bg border border-border rounded-card text-ink focus:outline-none"
        >
          <option value="month">Este mês</option>
          <option value="3months">Últimos 3 meses</option>
          <option value="all">Todos</option>
        </select>
        <Button className="w-full" onClick={handleGeneratePDF} disabled={loading}>
          <FileText size={18} className="mr-2" />
          {loading ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>
      </div>
    </div>
  )
}
