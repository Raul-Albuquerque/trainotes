import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../app/store'
import { templatesRepo } from '../../db/repositories/templates'

export function FichasPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const templates = useLiveQuery(
    () => user ? templatesRepo.list(user.id) : [],
    [user?.id]
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newName.trim()) return
    setLoading(true)
    const template = await templatesRepo.create(user.id, { name: newName.trim(), description: null })
    setNewName('')
    setShowCreate(false)
    setLoading(false)
    navigate(`/fichas/${template.id}/editar`)
  }

  return (
    <div className="p-4 space-y-4 safe-top">
      <header className="flex items-center justify-between pt-2">
        <h1 className="font-display text-2xl text-ink">Fichas</h1>
        <Button size="sm" onClick={() => setShowCreate(v => !v)}>
          <Plus size={18} className="mr-1" /> Nova
        </Button>
      </header>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 bg-surface rounded-card p-4">
          <Input label="Nome da ficha" placeholder="Ex: Peito A" value={newName} onChange={e => setNewName(e.target.value)} autoFocus required />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>Criar</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {templates?.filter(t => t.status === 'active').map(t => (
          <Card key={t.id} onClick={() => navigate(`/fichas/${t.id}/editar`)} className="flex items-center justify-between">
            <span className="font-medium text-ink">{t.name}</span>
            <ChevronRight size={18} className="text-ink-muted" />
          </Card>
        ))}
        {templates?.length === 0 && (
          <p className="text-ink-muted text-sm text-center py-8">Nenhuma ficha criada ainda.</p>
        )}
      </div>
    </div>
  )
}
