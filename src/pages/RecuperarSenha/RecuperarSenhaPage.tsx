import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { passwordResetRequestSchema } from '../../domain/rules'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthScreen } from '../../components/auth/AuthScreen'

export function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)
    setError(null)

    const result = passwordResetRequestSchema.safeParse({ email })
    if (!result.success) {
      setFieldError(result.error.errors[0].message)
      return
    }

    setLoading(true)
    try {
      await auth.requestPasswordReset(email)
      setSent(true)
    } catch {
      setError('Não foi possível enviar o link. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <><Link to="/login" className="text-accent font-medium">Voltar para Entrar</Link></>
      }
    >
      {sent ? (
        <div className="space-y-3 py-4">
          <p className="text-ink font-medium">Link enviado!</p>
          <p className="text-ink-soft text-sm">
            Verifique seu e-mail e toque no link para definir uma nova senha.
          </p>
          <button
            className="text-accent text-sm underline"
            onClick={() => setSent(false)}
          >
            Tentar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={fieldError ?? undefined}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </Button>
        </form>
      )}
    </AuthScreen>
  )
}
