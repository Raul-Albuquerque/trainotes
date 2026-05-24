import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../../components/ui/Button'
import { sessionsRepo } from '../../db/repositories/sessions'
import { TreinoEditor } from './TreinoEditor'

export function EditarTreinoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const session = useLiveQuery(() => id ? sessionsRepo.get(id) : undefined, [id])

  if (session === undefined) return null

  if (!session) {
    return (
      <div className="p-4 safe-top">
        <p className="text-ink-muted text-center py-8">Treino não encontrado.</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  return <TreinoEditor session={session} backPath="/" />
}
