import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { passwordResetSchema } from '../../domain/rules'
import { Button } from '../../components/ui/Button'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { AuthScreen } from '../../components/auth/AuthScreen'

function passwordHint(value: string, touched: boolean): { text: string; tone: 'muted' | 'success' | 'danger' } {
  if (!touched || value.length === 0) return { text: 'Mínimo de 8 caracteres', tone: 'muted' }
  if (value.length < 8) return { text: 'A senha precisa ter pelo menos 8 caracteres.', tone: 'danger' }
  return { text: 'Senha válida', tone: 'success' }
}

export function RedefinirSenhaPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const hint = passwordHint(password, passwordTouched)

  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Supabase may fire the event before this component mounts when following
    // the reset link — check for an existing recovery session immediately.
    auth.getSession().then((session) => {
      if (session) setReady(true)
      else setExpired(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const result = passwordResetSchema.safeParse({ password, password_confirmation: passwordConfirmation })
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
      await auth.updatePassword(password)
      navigate('/', { replace: true })
    } catch {
      setError('Não foi possível salvar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (expired) {
    return (
      <AuthScreen title="Link expirado">
        <div className="space-y-3 py-2">
          <p className="text-ink-soft text-sm">
            Este link expirou ou já foi usado. Solicite um novo para continuar.
          </p>
          <Link to="/recuperar-senha" className="block">
            <Button className="w-full" size="lg">Solicitar novo link</Button>
          </Link>
        </div>
      </AuthScreen>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthScreen
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="Nova senha"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => setPasswordTouched(true)}
          error={fieldErrors['password']}
          hint={!fieldErrors['password'] ? hint.text : undefined}
          hintTone={hint.tone}
          valid={password.length >= 8}
        />
        <PasswordInput
          label="Confirmar senha"
          autoComplete="new-password"
          placeholder="••••••••"
          value={passwordConfirmation}
          onChange={e => setPasswordConfirmation(e.target.value)}
          error={fieldErrors['password_confirmation']}
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar senha'}
        </Button>
      </form>
    </AuthScreen>
  )
}
