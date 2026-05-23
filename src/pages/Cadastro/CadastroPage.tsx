import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { auth } from '../../supabase/auth'
import { signUpSchema } from '../../domain/rules'
import { useAppStore } from '../../app/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { AuthScreen } from '../../components/auth/AuthScreen'
import { logger } from '../../lib/logger'

const log = logger.for('CadastroPage')

function mapAuthError(err: unknown): string {
  const status = (err as Record<string, unknown>)?.status
  const message = err instanceof Error ? err.message : ''
  if (status === 429 || message.includes('over_email_send_rate_limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
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
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<'session' | 'confirm_email' | false>(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  if (user) {
    log.debug('usuário já autenticado — redirecionando para home')
    return <Navigate to="/" replace />
  }

  const hint = passwordHint(password, passwordTouched)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    log.info('handleSubmit: formulário submetido', { email, displayName })

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
      log.warn('handleSubmit: validação falhou', errors)
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const outcome = await auth.signUp(email, password, displayName.trim())
      log.info('handleSubmit: cadastro concluído', { outcome })
      setSuccess(outcome)
      if (outcome === 'session') {
        // Supabase já criou a sessão; aguarda o AuthGuard propagar o user via
        // onAuthStateChange antes de navegar, mas forçamos a navegação aqui
        // para não depender do timing do store.
        setTimeout(() => navigate('/', { replace: true }), 300)
      }
    } catch (err: unknown) {
      log.error('handleSubmit: erro no cadastro', err)
      setError(mapAuthError(err))
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
      {success === 'session' ? (
        <div className="text-center space-y-2 py-4">
          <p className="text-success font-medium">Conta criada com sucesso!</p>
          <p className="text-ink-soft text-sm">Entrando...</p>
        </div>
      ) : success === 'confirm_email' ? (
        <div className="space-y-3 py-4">
          <p className="text-ink font-medium">Verifique seu e-mail</p>
          <p className="text-ink-soft text-sm">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Toque no link para ativar sua conta e fazer login.
          </p>
          <Link to="/login" className="block">
            <Button variant="secondary" className="w-full">Ir para login</Button>
          </Link>
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
