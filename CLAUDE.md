# CLAUDE.md — Visão Geral do Projeto

> Documento de produto, escopo e identidade visual.
> Aspectos técnicos (stack, modelo de dados, sincronização, segurança detalhada) estão em **CLAUDE2.md**.

---

## 1. Resumo do projeto

PWA mobile-first para **registro pessoal de treinos de musculação**, focado em substituir o bloco de notas no celular. Objetivo: ser **rápido na academia**, **funcionar offline**, **sincronizar entre dois iPhones** e **gerar relatórios em PDF** por período.

A prioridade absoluta é:

> **Registro rápido + não perder dados + sincronizar entre dispositivos.**

Tudo o que não contribui diretamente para isso fica fora do MVP.

---

## 2. Princípios do produto

1. **Mobile-first de verdade**: o app é projetado para uso com uma mão, em pé, suando, entre séries. Tudo o que exigir mais de 2 toques para registrar uma série é falha de design.
2. **Offline é o padrão, não exceção**: a internet da academia é ruim. O app deve funcionar como se estivesse sempre offline — a sincronização é um detalhe de fundo.
3. **Não perder dado nunca**: melhor um dado duplicado do que um dado perdido. Last-write-wins resolve conflito; nada apaga dado silenciosamente.
4. **Simples antes de bonito**: o MVP existe para ser usado, não exibido. Refinamento visual vem depois de 2–4 semanas de uso real.
5. **Baixo custo operacional**: hospedagem estática, Supabase no plano free, nada de servidor próprio.

---

## 3. Público e fases

| Fase | Público | Foco |
|------|---------|------|
| 1 | Eu, em 2 iPhones | Validar fluxo de treino, sincronização e PDF |
| 2 | Amigos próximos | Feedback de usabilidade e onboarding |
| 3 | Aberto (eventual) | Conta robusta, privacidade, possível plano pago |

---

## 4. Conceito central

O app tem **duas entidades-chave** que precisam ser distinguidas com clareza:

### 4.1 Ficha de treino (`workout_template`)
O **modelo** do treino. Muda apenas quando a periodização muda.

```
Ficha: Peito A
- Supino reto    | 4 séries | 6–12 reps | 90s
- Supino incl.   | 3 séries | 8–12 reps | 90s
- Crucifixo      | 3 séries | 10–15 reps | 60s
```

### 4.2 Treino realizado (`workout_session`)
O **registro de uma execução** em uma data específica. Pode vir de uma ficha ou ser livre.

```
Peito A — 20/05/2026
- Supino reto: 12×25, 10×30, 6×36, 6×36
- Supino incl.: 10×20, 8×24, 8×24
```

**Regra importante**: o nome do exercício no treino realizado é **copiado** da ficha no momento da execução. Se a ficha for editada depois, o histórico antigo não muda.

---

## 5. Telas do MVP

| # | Tela | Função principal |
|---|------|------------------|
| 1 | **Hoje** | Entrada do app, botão "Iniciar treino", status de sync |
| 2 | **Fichas** | Listar, criar, editar, arquivar fichas |
| 3 | **Editor de ficha** | Adicionar/ordenar/remover exercícios |
| 4 | **Iniciar treino** | Escolher ficha ou treino livre |
| 5 | **Treino em andamento** | Tela mais crítica — registro de séries |
| 6 | **Histórico** | Lista por data, filtros, edição posterior |
| 7 | **Relatório** | Gerar PDF textual por período |
| 8 | **Configurações** | Conta, sync, backup, unidade padrão |

A tela de **treino em andamento** é o coração do app. Ela precisa:
- Salvar automaticamente a cada alteração;
- Ser recuperável se o app fechar no meio do treino;
- Mostrar reps e carga lado a lado em campos grandes com teclado numérico;
- Permitir copiar carga da série anterior em 1 toque.

---

## 6. Escopo do MVP

### Dentro
- Login (email + senha *ou* magic link — ver Decisões pendentes)
- PWA instalável no iPhone
- CRUD de fichas e exercícios
- Registro de treino (com ficha ou livre)
- Histórico com filtros por período
- PDF textual por período
- Offline com IndexedDB
- Sincronização com Supabase (last-write-wins)
- Backup manual em JSON
- Status de sincronização visível

### Fora (deliberadamente)
Gráficos, evolução de carga, biblioteca pública de exercícios, fotos, vídeos, área de personal, pagamentos, App Store, notificações, integração com Apple Health, IA, social.

---

## 7. Critérios de sucesso

O MVP está pronto quando eu conseguir, sem voltar para o bloco de notas:

1. Criar a ficha "Peito A"
2. Iniciar um treino a partir dela
3. Registrar reps e cargas com poucos toques
4. Fechar o app no meio e voltar sem perder nada
5. Usar sem internet
6. Sincronizar depois
7. Abrir no segundo iPhone e ver o treino
8. Consultar histórico
9. Gerar PDF textual do mês
10. **Usar por 2 a 4 semanas seguidas**

O critério 10 é o único que importa de verdade.

---

## 8. Identidade visual

### 8.1 Paleta de cores

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| `--color-bg` | `#FBF4E2` | 251, 244, 226 | Fundo principal das telas (creme claro) |
| `--color-surface` | `#F6E7C6` | 246, 231, 198 | Cards, inputs, superfícies elevadas (creme médio) |
| `--color-accent` | `#FE6F20` | 254, 111, 32 | Botões primários, CTA, destaques (laranja) |
| `--color-ink` | `#222222` | 34, 34, 34 | Texto principal, headers, ícones (quase-preto) |

**Derivados sugeridos** (para estados e hierarquia):

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-accent-hover` | `#E55F15` | Botão primário em hover/active |
| `--color-accent-soft` | `#FFE4D3` | Badge de destaque suave, highlight |
| `--color-ink-soft` | `#4A4A4A` | Texto secundário |
| `--color-ink-muted` | `#8A8A8A` | Placeholders, metadados |
| `--color-border` | `#E8D9B8` | Bordas de input/card sobre o creme |
| `--color-success` | `#2E8B57` | Status "sincronizado" |
| `--color-warning` | `#C77700` | Status "pendente de sync" |
| `--color-danger` | `#C0392B` | Erro de sync, exclusão |

**Modo escuro** (para versão futura — não obrigatório no MVP):
- bg: `#1A1A1A`, surface: `#2A2A2A`, accent: `#FE6F20` (mantém), ink: `#FBF4E2` (inverte com bg).

### 8.2 Tipografia

| Família | Peso | Uso | Fallback |
|---------|------|-----|----------|
| **Inter** | 400, 500, 600 | Corpo, inputs, listas, números de treino | `system-ui, -apple-system, sans-serif` |
| **Batica Sans** | Regular | Títulos de tela, nome de ficha, número de série em destaque | `Inter, system-ui, sans-serif` |

- Inter via `@fontsource/inter` (auto-hospedado, sem CDN externo — melhor para PWA offline).
- Batica Sans copiada para `public/fonts/` e carregada via `@font-face` com `font-display: swap`.
- Números de carga e reps devem usar `font-variant-numeric: tabular-nums` para alinhamento.

### 8.3 Tom visual

- **Estética**: sóbrio, levemente analógico (lembra um caderno de treino), pouco "tech" e nada "fitness influencer".
- **Cantos**: arredondamento médio em cards (`12px`) e generoso em botões primários (`16px`).
- **Sombras**: discretas; o contraste entre creme claro e creme médio já cria hierarquia.
- **Ícones**: lineares e finos (Lucide Icons), nunca preenchidos por padrão.
- **Espaçamento**: generoso vertical. Touch targets mínimos de 44×44pt (guia iOS).

### 8.4 Nome do app

A definir. Sugestões para reflexão (não decisão): *Lastro*, *Repeti*, *Carga*, *Diário*, *Bloco*. Nome impacta favicon, manifest e domínio, então fica registrado como **decisão pendente**.

---

## 9. Decisões pendentes (a fechar antes de codar)

1. **Login**: email/senha ou magic link? → *Sugestão: magic link*, menos atrito e elimina UX de "esqueci minha senha" no MVP.
2. **Treino livre no MVP**? → *Sugestão: sim*, mas escondido em menu secundário. Custo de implementação é baixo se a estrutura de dados já suporta.
3. **Timer de descanso**? → *Sugestão: fora do MVP*. Adicionar só se eu sentir falta após 2 semanas.
4. **Botão "Finalizar treino"**? → *Sugestão: sim*. Marca explícita de "completed" vs "in_progress" simplifica histórico e sync.
5. **Exclusão**: hard delete ou soft delete (`deleted_at`)? → *Sugestão: soft delete sempre*. Hard delete só via configurações com confirmação dupla.
6. **PDF**: só treinos ou inclui resumo? → *Sugestão: resumo simples no topo* (total de treinos, total de séries, dias treinados).
7. **Cadastro público no MVP**? → *Sugestão: não*. Convite por link ou criação manual via Supabase até a fase 2.
8. **Autocomplete de exercícios**? → *Sugestão: lista local crescente* baseada nos próprios exercícios já cadastrados pelo usuário. Sem biblioteca externa.
9. **Observações por treino/exercício**? → *Sugestão: sim, campo opcional simples* em ambos.
10. **Grupo muscular na ficha**? → *Sugestão: fora do MVP*. Tag opcional na ficha resolve quando precisar.
11. **Nome do app e domínio**.

---

## 10. Roadmap (alto nível)

| Versão | Foco | Marco |
|--------|------|-------|
| **0.1** | Protótipo funcional | Fluxo principal end-to-end, mesmo feio |
| **0.2** | MVP pessoal | Eu uso de verdade nos 2 iPhones por 2–4 semanas |
| **0.3** | Beta com amigos | Onboarding, mensagens de erro, política de privacidade |
| **1.0** | Produto inicial | Recuperação de senha, exclusão de conta, monitoramento |

Detalhamento de etapas técnicas e entregáveis está em **CLAUDE2.md**.
