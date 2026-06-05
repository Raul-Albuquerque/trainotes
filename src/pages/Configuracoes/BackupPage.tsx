import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import { db } from '../../db/dexie'

export function BackupPage() {
  const navigate = useNavigate()

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

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-60">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Backup</h1>
      </header>

      <div className="px-4 py-5 space-y-4 flex-1">
        <p className="text-ink-muted text-sm">
          Exporte todos os seus dados em formato JSON. Use para guardar uma cópia local ou migrar para outro dispositivo.
        </p>

        <button
          onClick={handleExportBackup}
          className="w-full flex items-center gap-4 bg-surface rounded-card p-4 active:opacity-80"
        >
          <Download size={22} className="text-ink-soft flex-shrink-0" />
          <div className="text-left">
            <p className="text-ink font-medium text-sm">Exportar backup</p>
            <p className="text-ink-muted text-xs">Salva todos os dados em JSON</p>
          </div>
        </button>
      </div>
    </div>
  )
}
