import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ChevronRight, Dumbbell } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../app/store'
import { templatesRepo, templateExercisesRepo } from '../../db/repositories/templates'
import { sessionsRepo } from '../../db/repositories/sessions'

export function IniciarTreinoPage() {
  const navigate = useNavigate()
  const { user, setActiveSession } = useAppStore()
  const [freeTitle, setFreeTitle] = useState('')
  const [showFree, setShowFree] = useState(false)

  const templates = useLiveQuery(
    () => user ? templatesRepo.list(user.id) : [],
    [user?.id]
  )

  async function startFromTemplate(templateId: string) {
    if (!user) return
    const template = await templatesRepo.get(templateId)
    if (!template) return
    const exercises = await templateExercisesRepo.listByTemplate(templateId)
    const session = await sessionsRepo.createFromTemplate(user.id, template, exercises)
    setActiveSession(session)
    navigate('/treino/ativo')
  }

  async function startFree(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !freeTitle.trim()) return
    const session = await sessionsRepo.createFree(user.id, freeTitle.trim())
    setActiveSession(session)
    navigate('/treino/ativo')
  }

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/')} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Iniciar treino</h1>
      </header>

      <div className="space-y-2">
        <p className="text-ink-soft text-sm font-medium">Suas fichas</p>
        {templates?.filter(t => t.status === 'active').map(t => (
          <Card key={t.id} onClick={() => startFromTemplate(t.id)} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell size={18} className="text-accent" />
              <span className="font-medium text-ink">{t.name}</span>
            </div>
            <ChevronRight size={18} className="text-ink-muted" />
          </Card>
        ))}
      </div>

      <div className="pt-2 border-t border-border">
        {showFree ? (
          <form onSubmit={startFree} className="space-y-3">
            <Input label="Nome do treino" placeholder="Ex: Treino livre" value={freeTitle} onChange={e => setFreeTitle(e.target.value)} autoFocus required />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Iniciar</Button>
              <Button type="button" variant="secondary" onClick={() => setShowFree(false)}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowFree(true)} className="w-full text-ink-muted text-sm text-center py-2">
            + Treino livre
          </button>
        )}
      </div>
    </div>
  )
}
