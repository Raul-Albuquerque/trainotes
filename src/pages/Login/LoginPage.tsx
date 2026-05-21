import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { signInSchema } from '../../domain/rules'
import { useAppStore } from '../../app/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { AuthScreen } from '../../components/auth/AuthScreen'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  return 'Não foi possível entrar. Tente novamente.'
}

export function LoginPage() {
  const user = useAppStore(s => s.user)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.errors) {
        const field = issue.path[0] as string
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      await auth.signIn(email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      setError(mapAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen
      title="Entrar"
      subtitle="Acesse sua conta para continuar."
      footer={
        <>Não tem conta?{' '}<Link to="/cadastro" className="text-accent font-medium">Criar uma</Link></>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={fieldErrors['email']}
        />
        <div className="space-y-1">
          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={fieldErrors['password']}
          />
          <div className="flex justify-end">
            <Link to="/recuperar-senha" className="text-xs text-ink-muted hover:text-accent">
              Esqueceu sua senha?
            </Link>
          </div>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthScreen>
  )
}
