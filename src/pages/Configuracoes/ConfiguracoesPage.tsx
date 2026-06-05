import { useState } from 'react'
import { LogOut, Download, FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { auth } from '../../supabase/auth'
import { db } from '../../db/dexie'
import { sessionsRepo } from '../../db/repositories/sessions'
import { generatePDF } from '../../pdf/report'

export function ConfiguracoesPage() {
  const { user, setUser } = useAppStore()
  const [loggingOut, setLoggingOut] = useState(false)
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [period, setPeriod] = useState('month')

  async function handleSignOut() {
    setLoggingOut(true)
    await auth.signOut()
    setUser(null)
  }

  async function handleExportBackup() {
    const data = {
      exported_at: new Date().toISOString(),
      workout_templates: await db.workout_templates.toArray(),
      template_exercises: await db.template_exercises.toArray(),
      workout_sessions: await db.workout_sessions.toArray(),
      session_exercises: await db.session_exercises.toArray(),
      session_sets: await db.session_sets.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trainotes-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGeneratePDF() {
    if (!user) return
    setLoadingPDF(true)
    try {
      const sessions = await sessionsRepo.list(user.id, 200)
      const completed = sessions.filter(s => s.status === 'completed')
      await generatePDF(completed, user.email ?? 'Usuário')
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPDF(false)
    }
  }

  return (
    <div className="p-4 space-y-6 safe-top">
      <header className="pt-2">
        <h1 className="font-display text-2xl text-ink">Configurações</h1>
        <p className="text-ink-muted text-sm mt-1">{user?.email}</p>
      </header>

      <section className="space-y-2">
        <p className="text-ink-soft text-xs font-medium uppercase tracking-wide">Relatório</p>
        <div className="bg-surface rounded-card p-4 space-y-3">
          <p className="text-ink-muted text-xs">Gere um PDF com seus treinos do período selecionado.</p>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full h-11 px-3 bg-bg border border-border rounded-card text-ink focus:outline-none"
          >
            <option value="month">Este mês</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="all">Todos</option>
          </select>
          <button
            onClick={handleGeneratePDF}
            disabled={loadingPDF}
            className="w-full flex items-center gap-3 py-2 active:opacity-70 disabled:opacity-50"
          >
            <FileText size={20} className="text-ink-soft flex-shrink-0" />
            <div className="text-left">
              <p className="text-ink font-medium text-sm">{loadingPDF ? 'Gerando PDF...' : 'Gerar PDF'}</p>
              <p className="text-ink-muted text-xs">Exporta treinos do período selecionado</p>
            </div>
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-ink-soft text-xs font-medium uppercase tracking-wide">Dados</p>
        <button onClick={handleExportBackup} className="w-full bg-surface rounded-card p-4 flex items-center gap-3 active:opacity-80">
          <Download size={20} className="text-ink-soft" />
          <div className="text-left">
            <p className="text-ink font-medium text-sm">Exportar backup</p>
            <p className="text-ink-muted text-xs">Salva todos os dados em JSON</p>
          </div>
        </button>
      </section>

      <section className="pt-4 border-t border-border">
        <Button variant="danger" className="w-full" onClick={handleSignOut} disabled={loggingOut}>
          <LogOut size={18} className="mr-2" />
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </Button>
      </section>
    </div>
  )
}
