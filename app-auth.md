# app-auth.md — Refatoração da Autenticação

> Plano de refatoração para trocar **magic link** por **e-mail + senha**, com tela dedicada de cadastro (nome, e-mail, senha, confirmação de senha), tela de login (e-mail, senha), recuperação de senha simples e diretrizes de UX para feedback, estados visuais e microcopy.

---

## 1. Motivação e contexto

O MVP atual usa **magic link** como método único de autenticação (`signInWithOtp`). Apesar de ser o método mais seguro para projetos pessoais, tem três limitações práticas:

1. **Atrito no onboarding**: o usuário precisa sair do app, abrir o e-mail no celular, voltar ao app — fricção alta para um app que será usado em academia.
2. **Sem nome do usuário**: o magic link não tem etapa de cadastro, então não há como capturar o `display_name` na criação da conta. Hoje o profile é criado vazio pelo trigger `handle_new_user`.
3. **Necessidade de e-mail funcional na hora**: se o usuário estiver em uma academia com Wi-Fi limitado, pode não receber o link a tempo.

A refatoração mantém o **mesmo backend Supabase Auth** — apenas troca o método de autenticação, adiciona a captura de nome e endurece a UX em torno de clareza, prevenção de erro e feedback.

> **Princípio orientador**: o Trainotes é um PWA pessoal ou para um grupo pequeno de amigos. O fluxo de autenticação não precisa ser robusto demais, mas deve ser **claro, previsível e confortável de usar**. Cada melhoria deve responder a uma das quatro perguntas do usuário: *em qual tela estou?* / *o que preciso preencher?* / *o que deu errado?* / *o que aconteceu de certo?*

---

## 2. Escopo

### Dentro
- Tela de **cadastro** (`/cadastro`): nome, e-mail, senha, **confirmação de senha**
- Tela de **login** (`/login`): e-mail, senha
- Tela de **recuperação de senha** (`/recuperar-senha`): solicitação do e-mail de reset
- Tela de **definir nova senha** (`/redefinir-senha`): destino do link de reset
- Título e texto auxiliar em cada tela (clareza de contexto)
- Validação client-side com Zod (e-mail, senha mínima 8 chars, nome obrigatório, senhas coincidem)
- Mensagens de erro **por campo** + mensagem geral de falha
- Mensagens de sucesso pós-ação
- Botão de **mostrar/ocultar senha** em todos os campos de senha
- Estado de carregamento nos botões (texto + disabled)
- Estados visuais nos inputs: padrão, foco, erro, válido (opcional)
- Hint dinâmico de senha (neutro → inválido → válido conforme digita)
- Toggle entre login e cadastro (links no rodapé)
- Persistência do `display_name` no profile
- Logout continua funcionando como hoje

### Fora (deliberadamente)
- Confirmação de e-mail por link (desabilitar `email_confirm` no Supabase para fase 1 — habilitar antes da fase 3)
- MFA / TOTP — fica como flag para mais tarde
- Login social (Google, Apple) — fora do MVP
- Validação de senha contra HIBP (vazamentos) — habilitar no Supabase quando abrir para outros usuários (CLAUDE2.md §7.1)
- Indicador de força da senha (apenas comprimento mínimo no MVP)
- Validação de e-mail em tempo real enquanto digita (só no blur/submit)

---

## 3. Decisões

| Decisão | Escolha | Razão |
|---|---|---|
| Tamanho mínimo de senha | **8 caracteres** | Compromisso entre segurança e UX. CLAUDE2.md §7.1 sugere 12, mas isso é para fase pública — começamos com 8 e endurecemos antes da fase 3 |
| Validação de senha forte (caracteres especiais, etc.) | **Não** no MVP | Comprimento mínimo + HIBP (depois) cobrem o essencial |
| Confirmação de e-mail | **Desabilitada** no MVP | Reduz fricção; habilitar antes de abrir para outros usuários |
| Captura de nome | **Obrigatória** no cadastro | Aparece no relatório PDF e em telas; melhor capturar agora do que pedir depois |
| Confirmação de senha no cadastro | **Sim** | Reduz erros de digitação em mobile; custo de UX baixo, valor alto |
| Recuperação de senha | **Implementar** (Supabase `resetPasswordForEmail`) | Único e-mail que o app envia; sem isso, esquecer a senha = perder acesso. Implementação é trivial com Supabase Auth |
| Mostrar/ocultar senha | **Sim**, em todos os campos de senha | Mobile-first; digitação de senha em PWA no celular é frequentemente errada |
| Onde guardar `display_name` | `auth.users.raw_user_meta_data` no cadastro + sync para `profiles.display_name` via trigger | Padrão do Supabase. Trigger atualizado para ler `raw_user_meta_data->>'display_name'` |
| Roteamento pós-cadastro | Vai direto para `/` (autologin) | Sem confirmação de e-mail, a sessão já vem ativa do `signUp` |
| Persistência de sessão | `persistSession: true` (já configurado) | Funciona offline na próxima abertura |
| Idioma das mensagens | **Português, tom humano** | Nada de "Invalid credentials" ou "Auth error 400" vazando para o usuário |

---

## 4. Princípios de UI/UX

### 4.1 Pontos positivos do estado atual (preservar)
- Visual limpo e direto
- Boa hierarquia visual com logo em destaque
- Campos grandes e confortáveis para mobile e desktop
- CTAs primários bem visíveis
- Cores consistentes com a identidade

### 4.2 Princípios a aplicar

1. **Título em toda tela**: o usuário sempre sabe onde está. Abaixo do logo, antes do formulário.
2. **Texto auxiliar curto** abaixo do título: contexto sem floreio.
3. **Erros próximos ao campo**, não em banner distante. Mensagem geral só para falha não-atribuível a um campo (rede, servidor).
4. **Feedback de carregamento sempre**: botão muda texto + fica disabled.
5. **Estados visuais nos campos**: padrão, foco, erro, válido (opcional para cadastro).
6. **Tom humano nas mensagens**: nunca expor códigos de erro técnicos.
7. **Prevenção > correção**: confirmação de senha, hint de regras, mostrar/ocultar senha — tudo para reduzir tentativa-erro.

### 4.3 Estados visuais dos campos

Cada `Input` deve ter quatro estados:

| Estado | Disparador | Visual |
|---|---|---|
| Padrão | inicial | borda `--color-border`, fundo `--color-surface` |
| Foco | `:focus` | ring 2px `accent/40`, borda permanece |
| Erro | `error` prop preenchida | borda `--color-danger`, mensagem em vermelho abaixo |
| Válido (opcional) | validação passou em campo crítico (e-mail/senha) | borda `--color-success` discreta, sem texto |

> O estado "válido" é opcional. Usar **só** em e-mail e senha no cadastro, onde a validação preventiva tem mais valor. Não usar em nome.

### 4.4 Hint dinâmico de senha

O campo de senha do cadastro mostra hint que evolui com a digitação:

| Condição | Texto | Cor |
|---|---|---|
| Vazio ou < 8 chars, sem submit | "Mínimo de 8 caracteres" | `ink-muted` |
| < 8 chars após blur/tentativa de submit | "A senha precisa ter pelo menos 8 caracteres" | `danger` |
| ≥ 8 chars | "Senha válida" | `success` |

### 4.5 Botão "mostrar/ocultar senha"

- Ícone do Lucide: `Eye` (mostrar) / `EyeOff` (ocultar)
- Posicionado no canto direito do input, dentro do campo
- Touch target mínimo 44×44
- Toggle alterna `type="password"` ↔ `type="text"`
- Default: oculto

---

## 5. Microcopy

> Centralizar todos os textos aqui para revisão antes de implementar. Mudanças de copy posteriores devem editar este §5 antes do código.

### 5.1 Tela de cadastro (`/cadastro`)

| Elemento | Texto |
|---|---|
| Título | **Cadastre-se** |
| Subtítulo | Crie sua conta para salvar seus treinos e anotações. |
| Label nome | Nome |
| Placeholder nome | Seu nome |
| Label e-mail | E-mail |
| Placeholder e-mail | seu@email.com |
| Label senha | Senha |
| Placeholder senha | •••••••• |
| Hint senha (neutro) | Mínimo de 8 caracteres |
| Hint senha (erro) | A senha precisa ter pelo menos 8 caracteres |
| Hint senha (ok) | Senha válida |
| Label confirmar | Confirmar senha |
| Placeholder confirmar | •••••••• |
| Botão (idle) | Criar conta |
| Botão (loading) | Criando conta... |
| Link rodapé | Já tem conta? **Entrar** |

**Mensagens de erro:**
| Cenário | Texto |
|---|---|
| Nome vazio | Informe seu nome. |
| E-mail vazio | Informe seu e-mail. |
| E-mail inválido | Informe um e-mail válido. |
| Senha curta | A senha precisa ter pelo menos 8 caracteres. |
| Senhas diferentes | As senhas não coincidem. |
| E-mail já cadastrado | Este e-mail já está cadastrado. Faça login. |
| Falha genérica | Não foi possível criar a conta. Tente novamente. |

**Mensagem de sucesso:**
> Conta criada com sucesso! Entrando...

(exibida brevemente antes do redirecionamento automático para `/`)

### 5.2 Tela de login (`/login`)

| Elemento | Texto |
|---|---|
| Título | **Entrar** |
| Subtítulo | Acesse sua conta para continuar. |
| Label e-mail | E-mail |
| Placeholder e-mail | seu@email.com |
| Label senha | Senha |
| Placeholder senha | •••••••• |
| Link reset (abaixo do campo de senha, alinhado à direita) | Esqueceu sua senha? |
| Botão (idle) | Entrar |
| Botão (loading) | Entrando... |
| Link rodapé | Não tem conta? **Criar uma** |

**Mensagens de erro:**
| Cenário | Texto |
|---|---|
| E-mail vazio | Informe seu e-mail. |
| Senha vazia | Informe sua senha. |
| E-mail inválido | Informe um e-mail válido. |
| Credenciais inválidas | E-mail ou senha incorretos. |
| Falha genérica | Não foi possível entrar. Tente novamente. |

### 5.3 Tela de recuperação (`/recuperar-senha`)

| Elemento | Texto |
|---|---|
| Título | **Recuperar senha** |
| Subtítulo | Informe seu e-mail e enviaremos um link para criar uma nova senha. |
| Label e-mail | E-mail |
| Botão (idle) | Enviar link |
| Botão (loading) | Enviando... |
| Link rodapé | Voltar para **Entrar** |

**Mensagem de sucesso (após envio):**
> Link enviado! Verifique seu e-mail e toque no link para definir uma nova senha.

**Mensagens de erro:**
- E-mail inválido → "Informe um e-mail válido."
- Falha genérica → "Não foi possível enviar o link. Tente novamente."

> **Importante**: não revelar se o e-mail existe ou não na base (resposta sempre genérica para evitar enumeração de usuários).

### 5.4 Tela de nova senha (`/redefinir-senha`)

Destino do link enviado pelo Supabase. Detecta sessão de recuperação via `onAuthStateChange` (`PASSWORD_RECOVERY` event).

| Elemento | Texto |
|---|---|
| Título | **Nova senha** |
| Subtítulo | Defina uma nova senha para sua conta. |
| Label senha | Nova senha |
| Hint senha | Mínimo de 8 caracteres |
| Label confirmar | Confirmar senha |
| Botão (idle) | Salvar senha |
| Botão (loading) | Salvando... |

**Mensagem de sucesso:**
> Senha alterada! Entrando...

(redireciona para `/`)

**Mensagens de erro:**
- Senhas diferentes → "As senhas não coincidem."
- Senha curta → "A senha precisa ter pelo menos 8 caracteres."
- Link expirado/inválido → "Este link expirou. Solicite um novo." (com link para `/recuperar-senha`)

---

## 6. Mudanças por arquivo

### 6.1 `supabase/schema.sql`
Atualizar o trigger `handle_new_user` para popular `display_name` a partir de `raw_user_meta_data`:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
```

> O trigger antigo precisa ser **reaplicado** no Supabase (basta rodar o `create or replace`).

### 6.2 `src/supabase/auth.ts`
Substituir `sendMagicLink` por `signUp`, `signIn`, `requestPasswordReset` e `updatePassword`:

```ts
import { supabase } from './client'

export const auth = {
  async signUp(email: string, password: string, displayName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  },

  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async signOut() { /* mantém */ },
  async getSession() { /* mantém */ },
  onAuthStateChange(cb) { /* mantém */ },
}
```

### 6.3 `src/domain/rules.ts`
Schemas Zod com mensagens humanas:

```ts
export const signUpSchema = z.object({
  display_name: z.string().min(1, 'Informe seu nome.').max(80).trim(),
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.').max(200),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72),
  password_confirmation: z.string().min(1, 'Confirme sua senha.'),
}).refine(d => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
})

export const signInSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

export const passwordResetRequestSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
})

export const passwordResetSchema = z.object({
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72),
  password_confirmation: z.string().min(1, 'Confirme sua senha.'),
}).refine(d => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
})
```

### 6.4 `src/components/ui/Input.tsx`
Estender com:
- prop `hint?: string` (texto neutro abaixo do campo, escondido se houver `error`)
- prop `hintTone?: 'muted' | 'success' | 'danger'` (controla cor do hint para feedback dinâmico de senha)
- prop `valid?: boolean` (ativa borda `success` discreta)
- prop `rightSlot?: ReactNode` (botão dentro do input à direita — usado pelo toggle de senha)

### 6.5 `src/components/ui/PasswordInput.tsx` (novo)
Wrapper sobre `Input` que encapsula toggle mostrar/ocultar:
- Mantém `type="password" | "text"` em estado interno
- Botão à direita com `Eye` / `EyeOff` (Lucide)
- Touch target 44×44
- `autoComplete` configurável (`new-password` para cadastro/reset, `current-password` para login)
- Repassa `label`, `error`, `hint`, `hintTone`, `valid`, `placeholder`, `value`, `onChange`

### 6.6 `src/components/auth/AuthScreen.tsx` (novo, layout compartilhado)
Wrapper que padroniza as 4 telas de auth:
- Logo centralizada
- Slot para título (`<h1>`) com classe `font-display text-2xl`
- Slot para subtítulo (`text-sm text-ink-soft`)
- Slot para formulário
- Slot para link de rodapé
- Background, safe-area, centralização

### 6.7 `src/pages/Login/LoginPage.tsx`
- Título "Entrar" + subtítulo
- Campo e-mail
- Campo senha via `PasswordInput`
- Link "Esqueceu sua senha?" abaixo do campo de senha, alinhado à direita → navega para `/recuperar-senha`
- Botão com estado de loading ("Entrando...")
- Mensagem de erro geral acima do botão
- Link rodapé para `/cadastro`
- Mapeamento de erros do Supabase para microcopy

### 6.8 `src/pages/Cadastro/CadastroPage.tsx` (novo)
- Título "Cadastre-se" + subtítulo
- Campo nome
- Campo e-mail
- Campo senha via `PasswordInput` com hint dinâmico
- Campo confirmar senha via `PasswordInput`
- Botão com estado de loading ("Criando conta...")
- Mensagem de sucesso curta antes do redirecionamento
- Link rodapé para `/login`
- Errors por campo (`fieldErrors`) vindos do Zod

### 6.9 `src/pages/RecuperarSenha/RecuperarSenhaPage.tsx` (novo)
- Título "Recuperar senha" + subtítulo
- Campo e-mail
- Botão "Enviar link" / "Enviando..."
- Após sucesso: substitui o formulário por mensagem confirmando o envio
- Link rodapé "Voltar para Entrar" → `/login`

### 6.10 `src/pages/RedefinirSenha/RedefinirSenhaPage.tsx` (novo)
- Detecta evento `PASSWORD_RECOVERY` no `onAuthStateChange`
- Se chegou sem sessão de recovery válida, mostra erro "Este link expirou. Solicite um novo." com link
- Campos nova senha + confirmar senha
- Botão "Salvar senha" / "Salvando..."
- Pós-sucesso: redireciona para `/` (já autenticado)

### 6.11 `src/app/router.tsx`
Adicionar rotas públicas:

```tsx
{ path: '/login', element: <LoginPage /> },
{ path: '/cadastro', element: <CadastroPage /> },
{ path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
{ path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
```

### 6.12 `src/app/AuthGuard.tsx`
Permitir `/redefinir-senha` mesmo com sessão de recovery ativa (não redirecionar para `/`):

- Detectar `event === 'PASSWORD_RECOVERY'` e segurar redirecionamento até o usuário concluir o fluxo.

---

## 7. Configuração no painel do Supabase

Antes de subir a refatoração:

1. **Authentication → Providers → Email**: garantir que está habilitado
2. **Authentication → Email Auth**: desabilitar "Confirm email" (`Enable email confirmations` = off) para reduzir fricção no MVP
3. **Authentication → URL Configuration**: adicionar `https://<seu-domínio>/redefinir-senha` e `http://localhost:5173/redefinir-senha` à lista de **Redirect URLs**
4. **Authentication → Email Templates → Reset Password**: ajustar texto do e-mail para português (opcional, mas recomendado)
5. **Re-rodar** o trigger `handle_new_user` atualizado no SQL Editor

---

## 8. Fluxos de usuário

### Cadastro
```
1. Abre o app → AuthGuard detecta sem sessão → /login
2. Toca em "Criar uma" → /cadastro
3. Preenche nome, e-mail, senha, confirmar senha
   → Zod valida no submit (errors por campo)
4. signUp → Supabase cria usuário + dispara trigger → profile populado
5. Mensagem "Conta criada com sucesso! Entrando..."
6. Sessão ativa → AuthGuard libera → / (Hoje)
7. Sync engine inicia automaticamente
```

### Login (usuário recorrente)
```
1. Abre o app → AuthGuard detecta sem sessão → /login
2. Preenche e-mail + senha → submit
3. Zod valida campos vazios/inválidos antes de chamar Supabase
4. signInWithPassword retorna sessão → / (Hoje)
5. Sync engine puxa dados do Supabase
```

### Esqueci a senha
```
1. /login → "Esqueceu sua senha?" → /recuperar-senha
2. Preenche e-mail → "Enviar link"
3. Supabase envia e-mail com link contendo token
4. Mensagem genérica "Link enviado!" (mesmo se e-mail não existir)
5. Usuário toca no link → app abre em /redefinir-senha com sessão temporária
6. Define nova senha + confirma → "Salvar senha"
7. updatePassword → "Senha alterada! Entrando..." → / (Hoje)
```

### Logout
```
Configurações → "Sair da conta" → signOut() → AuthGuard → /login
```

---

## 9. Migração de dados existentes

Não há usuários em produção ainda (fase 1: só o desenvolvedor em 2 iPhones). Mas se houver conta criada via magic link durante testes:

- Conta continua válida (mesma `auth.users` no Supabase)
- Próximo login exige senha → usar o fluxo de **"Esqueceu sua senha?"** (agora implementado) para definir uma

> Não é mais necessário apagar contas de teste manualmente — o próprio fluxo de reset resolve.

---

## 10. Critérios de pronto

### Funcionais
- [ ] `auth.ts` exporta `signUp`, `signIn`, `requestPasswordReset`, `updatePassword`, `signOut`, `getSession`, `onAuthStateChange`
- [ ] `/cadastro` cria conta com nome + e-mail + senha + confirmação e entra logado direto
- [ ] `/login` autentica com e-mail + senha existente
- [ ] `/recuperar-senha` envia link de reset (resposta sempre genérica)
- [ ] `/redefinir-senha` aceita nova senha vinda do link
- [ ] Senha curta (<8) é bloqueada no client antes de chamar Supabase
- [ ] Senhas que não coincidem são bloqueadas no client
- [ ] E-mail duplicado mostra "Este e-mail já está cadastrado. Faça login."
- [ ] Credenciais inválidas mostram "E-mail ou senha incorretos."
- [ ] Trigger `handle_new_user` popula `display_name` (verificar no SQL Editor)
- [ ] `display_name` aparece no PDF gerado pelo Relatório
- [ ] Logout volta para `/login`
- [ ] Refresh com sessão ativa não força novo login

### UX
- [ ] Todas as 4 telas têm título + subtítulo claros
- [ ] Todos os botões têm estado de loading (texto + `disabled`)
- [ ] Erros aparecem **embaixo do campo** correspondente
- [ ] Erros gerais aparecem acima do botão primário
- [ ] Inputs têm estados visuais: padrão, foco, erro
- [ ] Campos de senha têm botão mostrar/ocultar funcional
- [ ] Hint de senha no cadastro muda dinamicamente (neutro/erro/válido)
- [ ] Link "Esqueceu sua senha?" visível no login
- [ ] Links de toggle entre login/cadastro funcionam
- [ ] Mensagens em português, sem termos técnicos vazando

### Técnico
- [ ] `npm run typecheck` passa sem erros
- [ ] Nenhum console.log ou TODO esquecido
- [ ] Redirect URLs configuradas no painel Supabase

---

## 11. Commits sugeridos

| # | Commit | Conteúdo |
|---|--------|----------|
| 1 | `feat(auth): trigger popula display_name a partir de metadata` | `supabase/schema.sql` |
| 2 | `feat(auth): troca magic link por e-mail + senha em auth.ts` | `src/supabase/auth.ts` + schemas Zod em `domain/rules.ts` (signUp, signIn, reset) |
| 3 | `feat(ui): PasswordInput com toggle mostrar/ocultar e estados estendidos no Input` | `src/components/ui/Input.tsx`, `src/components/ui/PasswordInput.tsx`, `src/components/auth/AuthScreen.tsx` |
| 4 | `feat(auth): tela de login com e-mail, senha e link de recuperação` | `LoginPage.tsx` (refatoração) |
| 5 | `feat(auth): tela de cadastro com confirmação de senha e hint dinâmico` | `CadastroPage.tsx` + rota |
| 6 | `feat(auth): fluxo de recuperação de senha (solicitar + redefinir)` | `RecuperarSenhaPage.tsx`, `RedefinirSenhaPage.tsx`, rotas, atualização do `AuthGuard` |

---

## 12. Priorização (caso o escopo precise ser quebrado)

### Alta — bloquear o release sem isto
- Trocar magic link por e-mail + senha (núcleo da refatoração)
- Títulos e subtítulos em todas as telas
- Mensagens de erro e sucesso humanas
- Estado de loading nos botões
- Confirmação de senha no cadastro
- Recuperação de senha

### Média — entregar logo após
- Mostrar/ocultar senha
- Estados visuais completos nos campos (foco/erro/válido)
- Hint dinâmico de senha

### Baixa — pós-MVP
- Indicador de força da senha
- Login social
- Regras complexas de senha
- MFA / 2FA

---

## 13. Notas de segurança (para revisitar antes da fase 3)

Conforme CLAUDE2.md §7.1, antes de abrir para outros usuários (fase 3):

- [ ] Habilitar **confirmação de e-mail** no Supabase
- [ ] Aumentar mínimo de senha para **12 caracteres**
- [ ] Habilitar **HIBP check** no Supabase Auth
- [ ] Implementar tela de **exclusão de conta** (LGPD)
- [ ] Avaliar **MFA opcional via TOTP**
- [ ] Rate limiting nos endpoints de auth (Supabase plano pago ou Edge Function)
- [ ] Auditar mensagens para não vazar enumeração de usuários (recuperação já cuida disso; login deveria ter mensagem unificada — manter "E-mail ou senha incorretos" sem distinguir o caso)
