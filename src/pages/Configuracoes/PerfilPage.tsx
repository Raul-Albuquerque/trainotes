import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../app/store'
import { profilesRepo } from '../../db/repositories/profiles'

export function PerfilPage() {
  const { user } = useAppStore()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    profilesRepo.get(user.id).then(p => {
      if (p) {
        setDisplayName(p.display_name ?? '')
        setHeightCm(p.height_cm != null ? String(p.height_cm) : '')
      }
    })
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    const height = parseFloat(heightCm.replace(',', '.'))
    await profilesRepo.upsert(user.id, {
      display_name: displayName.trim() || null,
      height_cm: isNaN(height) ? null : Math.round(height),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-60">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Perfil</h1>
      </header>

      <div className="px-4 py-5 space-y-4 flex-1">
        <Input
          label="Nome"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Seu nome"
        />
        <div className="space-y-1">
          <label className="text-ink-soft text-xs font-medium">E-mail</label>
          <div className="w-full h-11 px-3 bg-surface border border-border rounded-card text-ink-muted text-sm flex items-center select-none">
            {user?.email}
          </div>
          <p className="text-ink-muted text-xs">O e-mail não pode ser alterado aqui.</p>
        </div>
        <Input
          label="Altura (cm)"
          type="number"
          inputMode="decimal"
          value={heightCm}
          onChange={e => setHeightCm(e.target.value)}
          placeholder="Ex: 178"
        />
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </div>
    </div>
  )
}
