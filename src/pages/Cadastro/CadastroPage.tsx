import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { signUpSchema } from '../../domain/rules'
import { useAppStore } from '../../app/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { AuthScreen } from '../../components/auth/AuthScreen'

function mapAuthError(message: string): string {
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado. Faça login.'
  return 'Não foi possível criar a conta. Tente novamente.'
}

function passwordHint(value: string, touched: boolean): { text: string; tone: 'muted' | 'success' | 'danger' } {
  if (!touched || value.length === 0) return { text: 'Mínimo de 8 caracteres', tone: 'muted' }
  if (value.length < 8) return { text: 'A senha precisa ter pelo menos 8 caracteres.', tone: 'danger' }
  return { text: 'Senha válida', tone: 'success' }
}

export function CadastroPage() {
  const user = useAppStore(s => s.user)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  if (user) return <Navigate to="/" replace />

  const hint = passwordHint(password, passwordTouched)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const result = signUpSchema.safeParse({
      display_name: displayName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
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
      await auth.signUp(email, password, displayName.trim())
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      setError(mapAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen
      title="Cadastre-se"
      subtitle="Crie sua conta para salvar seus treinos e anotações."
      footer={
        <>Já tem conta?{' '}<Link to="/login" className="text-accent font-medium">Entrar</Link></>
      }
    >
      {success ? (
        <div className="text-center space-y-2 py-4">
          <p className="text-success font-medium">Conta criada com sucesso!</p>
          <p className="text-ink-soft text-sm">Entrando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            error={fieldErrors['display_name']}
          />
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
          <PasswordInput
            label="Senha"
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      )}
    </AuthScreen>
  )
}
