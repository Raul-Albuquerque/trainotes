import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, LogOut } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../app/store'
import { auth } from '../../supabase/auth'

export function SairPage() {
  const { setUser } = useAppStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSignOut() {
    setLoggingOut(true)
    await auth.signOut()
    setUser(null)
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-60">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <h1 className="font-display text-xl text-ink">Sair</h1>
      </header>

      <div className="px-4 py-5 space-y-4 flex-1">
        <p className="text-ink-muted text-sm">
          Ao sair, seus dados locais permanecem no dispositivo. Na próxima vez que entrar, tudo será sincronizado novamente.
        </p>

        <Button variant="danger" className="w-full" onClick={handleSignOut} disabled={loggingOut}>
          <LogOut size={18} className="mr-2" />
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </Button>
      </div>
    </div>
  )
}
