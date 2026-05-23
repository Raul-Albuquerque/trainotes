import { supabase } from './client'
import { logger } from '../lib/logger'

const log = logger.for('auth')

export const auth = {
  async signUp(email: string, password: string, displayName: string): Promise<'session' | 'confirm_email'> {
    log.info('signUp: iniciando', { email, displayName })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) {
      log.error('signUp: erro do Supabase', error)
      throw error
    }
    const outcome = data.session ? 'session' : 'confirm_email'
    log.info('signUp: sucesso', { outcome, userId: data.user?.id })
    return outcome
  },

  async signIn(email: string, password: string) {
    log.info('signIn: iniciando', { email })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      log.error('signIn: erro do Supabase', error)
      throw error
    }
    log.info('signIn: sucesso', { userId: data.user?.id })
  },

  async requestPasswordReset(email: string) {
    log.info('requestPasswordReset: enviando e-mail', { email })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) {
      log.error('requestPasswordReset: erro do Supabase', error)
      throw error
    }
    log.info('requestPasswordReset: e-mail enviado')
  },

  async updatePassword(newPassword: string) {
    log.info('updatePassword: atualizando senha')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      log.error('updatePassword: erro do Supabase', error)
      throw error
    }
    log.info('updatePassword: senha atualizada')
  },

  async signOut() {
    log.info('signOut: iniciando')
    const { error } = await supabase.auth.signOut()
    if (error) {
      log.error('signOut: erro do Supabase', error)
      throw error
    }
    log.info('signOut: sessão encerrada')
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      log.error('getSession: erro', error)
      throw error
    }
    log.debug('getSession: resultado', { hasSession: !!data.session, userId: data.session?.user?.id })
    return data.session
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    log.debug('onAuthStateChange: listener registrado')
    return supabase.auth.onAuthStateChange((event, session) => {
      log.info('onAuthStateChange: evento recebido', { event, userId: session?.user?.id })
      return callback(event, session)
    })
  },
}
