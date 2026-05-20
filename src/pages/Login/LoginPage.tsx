import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { useAppStore } from '../../app/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const user = useAppStore(s => s.user)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.sendMagicLink(email)
      setSent(true)
    } catch (_err) {
      setError('Erro ao enviar link. Verifique o e-mail e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center p-6 safe-top">
      <img src="/logo-black.svg" alt="Trainotes" className="h-10 mb-10" />

      {sent ? (
        <div className="w-full max-w-sm text-center space-y-3">
          <p className="text-ink font-medium">Link enviado!</p>
          <p className="text-ink-soft text-sm">Verifique seu e-mail <strong>{email}</strong> e toque no link para entrar.</p>
          <button className="text-accent text-sm underline mt-4" onClick={() => setSent(false)}>Tentar outro e-mail</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Entrar com magic link'}
          </Button>
        </form>
      )}
    </div>
  )
}
