import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { sessionsRepo } from '../../db/repositories/sessions'
import { TreinoEditor } from './TreinoEditor'
import { useLiveQuery } from 'dexie-react-hooks'

export function TreinoEmAndamentoPage() {
  const navigate = useNavigate()
  const { activeSession, setActiveSession } = useAppStore()

  const session = useLiveQuery(
    () => activeSession ? sessionsRepo.get(activeSession.id) : undefined,
    [activeSession?.id]
  )

  function handleFinish() {
    setActiveSession(null)
    navigate('/')
  }

  if (!session) {
    return (
      <div className="p-4 safe-top">
        <p className="text-ink-muted text-center py-8">Nenhum treino em andamento.</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  return <TreinoEditor session={session} onFinish={handleFinish} backPath="/" />
}
