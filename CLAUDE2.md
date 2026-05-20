# CLAUDE2.md — Aspectos Técnicos

> Stack, arquitetura, modelo de dados, sincronização, segurança e roadmap de implementação.
> Visão de produto e identidade visual estão em **CLAUDE.md**.

---

## 1. Stack

### Frontend
- **React 18** + **Vite** + **TypeScript** (strict mode).
- **Tailwind CSS** com tokens da paleta mapeados em `tailwind.config.ts` (ver §10).
- **React Router** para navegação.
- **Zustand** para estado global (treino em andamento, status de sync). Sem Redux.
- **TanStack Query** opcional para sincronização declarativa entre Supabase e UI — *recomendado adicionar*, simplifica bastante a camada de dados.

### PWA
- `vite-plugin-pwa` com estratégia **`autoUpdate`** e `registerType: 'autoUpdate'`.
- Service Worker via **Workbox** (vem com o plugin).
- Estratégia de cache:
  - Assets do app: `precache` + `cacheFirst`.
  - Chamadas ao Supabase: **`networkOnly`** (não cachear no SW; o estado offline é responsabilidade do IndexedDB, não do SW).
- `manifest.webmanifest` com ícones 192, 512 e maskable, `display: standalone`, `theme_color: #FE6F20`, `background_color: #FBF4E2`.

### Persistência local
- **Dexie.js** sobre **IndexedDB**.
- Schema espelha as tabelas do Supabase + campos de sync (ver §5).

### Backend
- **Supabase** (Auth + Postgres + RLS).
- Sem Edge Functions no MVP. Tudo via API REST/PostgREST do próprio Supabase.

### PDF
- **`pdf-lib`** *ou* **`jsPDF`** no frontend. Recomendação: **`pdf-lib`** — mais controle tipográfico e arquivos menores. Como o PDF é textual e o app é offline-first, gerar no navegador é o caminho certo.

### Hospedagem
- **Cloudflare Pages** (free, CDN global, deploy via Git).
- Alternativa: Vercel.

---

## 2. Arquitetura geral

```
┌─────────────────┐      ┌─────────────────┐
│   iPhone 1      │      │   iPhone 2      │
│  ┌───────────┐  │      │  ┌───────────┐  │
│  │ React UI  │  │      │  │ React UI  │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │  Dexie /  │  │      │  │  Dexie /  │  │
│  │ IndexedDB │  │      │  │ IndexedDB │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
│        │        │      │        │        │
│  ┌─────▼─────┐  │      │  ┌─────▼─────┐  │
│  │   Sync    │  │      │  │   Sync    │  │
│  │  Engine   │  │      │  │  Engine   │  │
│  └─────┬─────┘  │      │  └─────┬─────┘  │
└────────┼────────┘      └────────┼────────┘
         │                        │
         └────────┬───────────────┘
                  │  HTTPS
         ┌────────▼────────┐
         │    Supabase     │
         │  Auth + Postgres│
         │    + RLS        │
         └─────────────────┘
```

**Princípio**: UI nunca lê direto do Supabase. UI lê do Dexie. O Sync Engine é a única ponte entre Dexie e Supabase, e roda em background.

---

## 3. Estrutura de pastas sugerida

```
src/
  app/                    # bootstrap, providers, router
  pages/                  # uma pasta por tela (Hoje, Fichas, etc.)
  components/             # componentes reutilizáveis
    ui/                   # primitivos (Button, Input, Card)
    workout/              # específicos do domínio
  domain/                 # tipos e regras de negócio puras
    types.ts              # tipos compartilhados
    rules.ts              # invariantes (ex: validar série)
  db/
    dexie.ts              # schema local
    repositories/         # camada de acesso (templates, sessions, sets)
  sync/
    engine.ts             # orquestrador
    push.ts               # envia pendências
    pull.ts               # baixa remoto
    conflicts.ts          # resolução LWW
  supabase/
    client.ts             # singleton
    auth.ts
  pdf/
    report.ts             # geração do relatório
  lib/
    date.ts, format.ts, etc.
  styles/
    globals.css, tokens.css
public/
  fonts/
    BaticaSans-Regular.woff2
    BaticaSans-Regular.woff
  icons/
    icon-192.png, icon-512.png, icon-maskable-512.png
```

---

## 4. Modelo de dados (Supabase / Postgres)

Princípio: **tabelas separadas, nunca um JSON gigante**. Facilita queries, índices, RLS e migrações futuras.

### 4.1 `profiles`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id` |
| `email` | `text` | espelho de auth |
| `display_name` | `text` | opcional |
| `default_weight_unit` | `text` | `'kg'` por padrão |
| `created_at`, `updated_at` | `timestamptz` | |

### 4.2 `workout_templates`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | gerado no cliente (ver §5.2) |
| `user_id` | `uuid` FK | |
| `name` | `text` | |
| `description` | `text` | nullable |
| `status` | `text` | `'active' \| 'archived'` |
| `created_at`, `updated_at`, `deleted_at` | `timestamptz` | |

### 4.3 `template_exercises`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | redundante mas útil para RLS direta |
| `template_id` | `uuid` FK | |
| `name` | `text` | |
| `order_index` | `int` | |
| `target_sets` | `int` | |
| `target_reps_min`, `target_reps_max` | `int` | |
| `rest_seconds` | `int` | |
| `notes` | `text` | nullable |
| `created_at`, `updated_at`, `deleted_at` | `timestamptz` | |

### 4.4 `workout_sessions`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `template_id` | `uuid` FK | nullable (treino livre) |
| `title` | `text` | snapshot do nome da ficha |
| `performed_at` | `timestamptz` | |
| `status` | `text` | `'in_progress' \| 'completed' \| 'archived'` |
| `notes` | `text` | nullable |
| `created_at`, `updated_at`, `deleted_at` | `timestamptz` | |

### 4.5 `session_exercises`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `session_id` | `uuid` FK | |
| `template_exercise_id` | `uuid` FK | nullable, referência fraca (snapshot) |
| `name` | `text` | **cópia** do nome no momento da execução |
| `order_index` | `int` | |
| `notes` | `text` | nullable |
| `created_at`, `updated_at`, `deleted_at` | `timestamptz` | |

### 4.6 `session_sets`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `session_id` | `uuid` FK | denormalizado (para queries por sessão) |
| `session_exercise_id` | `uuid` FK | |
| `set_index` | `int` | 1-based |
| `reps` | `int` | |
| `weight` | `numeric(7,3)` | suporta 0.5kg, 2.5kg, etc. |
| `weight_unit` | `text` | `'kg' \| 'lb'` |
| `notes` | `text` | nullable |
| `created_at`, `updated_at`, `deleted_at` | `timestamptz` | |

### 4.7 `sync_devices` (opcional no MVP)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `device_name` | `text` | "iPhone principal" |
| `last_synced_at` | `timestamptz` | |
| `created_at`, `updated_at` | `timestamptz` | |

### 4.8 Índices recomendados

```sql
create index idx_templates_user_active   on workout_templates(user_id) where deleted_at is null;
create index idx_template_ex_template    on template_exercises(template_id, order_index);
create index idx_sessions_user_date      on workout_sessions(user_id, performed_at desc);
create index idx_session_ex_session      on session_exercises(session_id, order_index);
create index idx_session_sets_exercise   on session_sets(session_exercise_id, set_index);
-- Para sync incremental por updated_at:
create index idx_templates_user_updated  on workout_templates(user_id, updated_at);
create index idx_sessions_user_updated   on workout_sessions(user_id, updated_at);
-- (repetir para as demais tabelas sincronizáveis)
```

---

## 5. Camada local (Dexie)

### 5.1 Schema espelhado
Tabelas locais com os mesmos campos das tabelas remotas **mais** campos de sync:

| Campo local | Tipo | Função |
|---|---|---|
| `is_dirty` | `0 \| 1` | há alterações pendentes para enviar |
| `is_deleted_local` | `0 \| 1` | marcado para exclusão (push converte em `deleted_at`) |
| `local_updated_at` | `number` (epoch ms) | última edição local |
| `last_synced_at` | `number \| null` | última sincronização bem-sucedida |
| `sync_error` | `string \| null` | mensagem do último erro |

> Dexie indexa booleanos como `0/1` (não `true/false`), então mantenha o tipo numérico.

### 5.2 IDs gerados no cliente
Usar `crypto.randomUUID()` para todos os IDs **no cliente**, antes de qualquer round-trip. Isso permite:
- Criar registros offline com ID definitivo (sem `temp_id` / `real_id`).
- Reusar o mesmo registro quando o push completar.
- Idempotência: reenviar o mesmo `INSERT` com o mesmo UUID não duplica (com `upsert`).

### 5.3 Versão do schema
Versionar com `db.version(N).stores(...)` desde o dia 1. Migrações são uma das poucas coisas que dão problema feio se forem deixadas para depois.

---

## 6. Sincronização

### 6.1 Modelo
**Pull/push incremental por `updated_at`, last-write-wins, idempotente.**

- Cada cliente guarda `last_pull_at` por tabela.
- **Pull**: `select * where user_id = me and updated_at > last_pull_at order by updated_at`.
- **Push**: enviar registros locais com `is_dirty = 1` via `upsert` (chave: `id`).
- **Conflito**: se o servidor tem versão com `updated_at` mais recente que a local, ela vence. Caso contrário, a local sobrescreve.

### 6.2 Quando o sync roda
| Evento | Ação |
|---|---|
| App abre online | pull de tudo desde `last_pull_at` |
| Após qualquer write local | enfileira push (debounce 2s) |
| Volta online após offline | drena fila de push, depois pull |
| Botão "Sincronizar agora" | push + pull imediato |
| A cada 60s com app aberto | push + pull leve |

### 6.3 Ordem de push (por dependência)
1. `workout_templates`
2. `template_exercises`
3. `workout_sessions`
4. `session_exercises`
5. `session_sets`

Tabela `profiles` é independente.

### 6.4 Garantias
- **Nunca perder dado registrado**: um set escrito no Dexie nunca é apagado por falha de sync. `is_dirty` permanece até confirmação.
- **Idempotência**: usar `upsert` (`onConflict: 'id'`) em todos os pushes.
- **Soft delete**: exclusão local seta `is_deleted_local = 1`; push converte em `deleted_at = now()` no servidor.
- **Relógio**: usar timestamp do servidor (`now()` no Postgres) como verdade. Cliente envia `local_updated_at` apenas para tie-breaking; servidor reescreve `updated_at`.

### 6.5 Treino em andamento
Caso especial e crítico: a sessão `in_progress` precisa ser **idempotente entre dispositivos**. Se eu iniciar no iPhone A, sair de casa, e abrir no iPhone B, a sessão deve aparecer. Solução: push do registro `in_progress` é normal; ao finalizar, status vira `completed` no dispositivo que finalizou, e a versão mais recente vence.

---

## 7. Segurança

> Esta seção contém as **melhorias de segurança** que recomendo em cima do planejamento original.

### 7.1 Supabase Auth
- **Magic link** como método principal (recomendado em CLAUDE.md §9). Elimina UX de "esqueci a senha" e remove a maior superfície de ataque (senhas fracas/vazadas).
- Se for email/senha: exigir mínimo de 12 caracteres e habilitar **HIBP check** do Supabase (verifica vazamentos conhecidos).
- **MFA opcional via TOTP** já no MVP — está em uma checkbox no Supabase, não custa nada habilitar.

### 7.2 Row Level Security (RLS)
RLS habilitada em **todas** as tabelas, sem exceção. Política padrão:

```sql
-- Habilitar RLS
alter table workout_templates enable row level security;

-- Política única: dono pode tudo
create policy "owner full access" on workout_templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Repetir para todas as 6 tabelas com `user_id`. **Nunca confiar em filtros `where user_id = ...` no cliente** — RLS é a única defesa real.

### 7.3 Chaves
- No frontend: apenas a **anon key**.
- A **service_role key** nunca entra no repositório, nunca em `.env` versionado, nunca no cliente. Fica só no painel do Supabase.
- `.env` no `.gitignore`. `.env.example` versionado com placeholders.

### 7.4 Headers e CSP
Configurar no host (Cloudflare Pages → `_headers`):

```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

`'unsafe-inline'` em `style-src` é por causa do Tailwind em dev; pode ser endurecido depois.

### 7.5 Validação de entrada
- Toda escrita usa **Zod** para validar antes de gravar no Dexie e antes de enviar ao Supabase.
- Tipos gerados do Supabase via `supabase gen types typescript`. Schemas Zod manuais para validação de runtime.

### 7.6 Logs e PII
- Não logar conteúdo de treinos em ferramentas externas.
- Quando adicionar monitoramento (Sentry, etc., versão 1.0), configurar `beforeSend` para remover qualquer payload sensível.
- Nada de Google Analytics no MVP.

### 7.7 Backup e exportação
- Backup JSON local é apenas para emergência. Não substitui Supabase.
- O JSON exportado contém todos os dados do usuário em texto plano — avisar na UI que o arquivo deve ser tratado como sensível.
- Importação: validar com Zod antes de aplicar; deduplicação por `id` (upsert).

### 7.8 Quando abrir para outros usuários (fase 3)
Checklist mínimo antes:
- [ ] Política de privacidade e termos de uso publicados
- [ ] Endpoint de **exclusão de conta** (apaga dados em cascata + remove de Auth)
- [ ] Endpoint de **exportação de dados** (LGPD/GDPR)
- [ ] Rate limiting no Supabase (Edge Function ou plano que suporte)
- [ ] Monitoramento de erros configurado
- [ ] MFA recomendado (não apenas disponível)

---

## 8. PWA no iPhone — cuidados específicos

iPhone Safari tem peculiaridades. **Testar desde a primeira semana**, não no final:

- IndexedDB no Safari pode ser **purgado** se o site for marcado como "Sem uso recente" (7 dias sem visita). Mitigação:
  - Instruir o usuário a **instalar como PWA** (Adicionar à Tela de Início). PWAs instalados têm armazenamento mais protegido.
  - Sincronizar com Supabase como **fonte de verdade real** — Dexie é cache, não storage primário.
- `Service Worker` em iOS PWA tem ciclo de vida diferente; usar `skipWaiting` + `clientsClaim` com cuidado.
- `viewport-fit=cover` + safe-area-insets para iPhones com notch/dynamic island.
- Inputs numéricos: `inputMode="decimal"` para carga, `inputMode="numeric"` para reps. Não usar `type="number"` (UX ruim no iOS).
- Compartilhamento do PDF: usar **Web Share API** (`navigator.share`) com fallback de download.
- `apple-touch-icon` no `<head>` além do manifest.

---

## 9. Geração de PDF

- Lib: **pdf-lib**.
- Fonte embarcada: Inter Regular + Bold (subset com glyphs portugueses).
- Layout textual, 1 coluna, página A4.
- Estrutura:
  ```
  Cabeçalho: "Relatório de Treinos" + nome + período + data de geração
  Resumo: total de treinos, total de séries, dias treinados, duração média (se houver)
  Por treino:
    Data — Nome da ficha
    Por exercício:
      Nome
      1. reps × peso unit
      2. ...
  Rodapé: número de página
  ```
- Geração 100% client-side, lendo do Dexie. Funciona offline.
- Compartilhamento via `navigator.share({ files: [pdfFile] })` no iOS.

---

## 10. Tokens Tailwind

`tailwind.config.ts`:

```ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#FBF4E2',
        surface: '#F6E7C6',
        accent: {
          DEFAULT: '#FE6F20',
          hover:   '#E55F15',
          soft:    '#FFE4D3',
        },
        ink: {
          DEFAULT: '#222222',
          soft:    '#4A4A4A',
          muted:   '#8A8A8A',
        },
        border: '#E8D9B8',
        success: '#2E8B57',
        warning: '#C77700',
        danger:  '#C0392B',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Batica Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn:  '16px',
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
    },
  },
}
```

CSS global para Batica Sans:

```css
@font-face {
  font-family: 'Batica Sans';
  src: url('/fonts/BaticaSans-Regular.woff2') format('woff2'),
       url('/fonts/BaticaSans-Regular.woff')  format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

> **Recomendação**: converter o `.ttf` da Batica Sans para `woff2` (e opcional `woff` para fallback). `woff2` reduz em ~30% e é o padrão moderno suportado em iOS Safari há anos.

---

## 11. Roadmap técnico por etapas

| Etapa | Entregáveis | Critério de pronto |
|---|---|---|
| **1. Setup** | Vite + TS + Tailwind + PWA + Supabase client + Dexie + roteamento | App instala como PWA, login funciona |
| **2. Schema Supabase** | 6 tabelas + RLS + índices + tipos TS gerados | Inserir/ler via SQL editor respeitando RLS |
| **3. Dexie schema** | Mesma estrutura + campos de sync | CRUD local funciona |
| **4. CRUD fichas** | Criar/editar/arquivar ficha e exercícios | Listar fichas, reordenar exercícios |
| **5. Treino realizado** | Iniciar por ficha ou livre, registrar séries, autosave, recuperar in_progress | Posso fazer um treino completo offline |
| **6. Sync engine** | Push, pull, last-write-wins, status visível | 2 dispositivos convergem em <60s online |
| **7. Histórico** | Lista, filtros, edição, exclusão | Filtrar últimos 30 dias e editar treino antigo |
| **8. PDF** | Geração textual no frontend, share/download | PDF gerado offline no iPhone e compartilhado |
| **9. Backup** | Export/import JSON com validação | Importar não duplica registros existentes |
| **10. Hardening** | CSP, headers, validação Zod, testes manuais em iPhone | Checklist de segurança §7 completo |

---

## 12. Testes mínimos antes de considerar MVP pronto

1. Fechar o app durante uma série e reabrir → série preservada.
2. Modo avião durante treino completo → registra normalmente.
3. Voltar online → sincroniza em <60s.
4. Editar mesma ficha nos 2 iPhones offline → último a sincronizar vence, sem perda.
5. Forçar fechamento do Safari durante geração de PDF → não corrompe dados.
6. Limpar cache do site mantendo PWA instalado → dados continuam (IndexedDB persiste).
7. Reinstalar PWA → após login, dados voltam do Supabase.
8. PDF gerado em mês com 20+ treinos → não trava, abre normalmente no iPhone.

---

## 13. Pontos de atenção (lições do planejamento original)

- **Sync é a parte mais sensível**. Não tentar otimizar prematuramente; um pull/push periódico simples com last-write-wins resolve 95% dos casos. Conflito de UI fica para v2.
- **Não cachear chamadas ao Supabase no Service Worker**. Cache do SW é para shell do app; dados ficam no Dexie. Misturar os dois cria bugs muito difíceis de diagnosticar.
- **IDs no cliente desde o início**. Trocar para UUIDs do servidor depois é refactor doloroso.
- **Soft delete em tudo**. Reverter exclusão acidental no MVP é só mudar uma flag.
- **Tipos do Supabase gerados automaticamente** (`supabase gen types`). Evita drift entre schema e código.
