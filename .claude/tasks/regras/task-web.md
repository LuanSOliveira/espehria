# Task Web: Página "Regras"

## Contexto
Não existe `.claude/tasks/regras/spec.md` — o pedido do usuário já veio detalhado e é
usado diretamente como fonte da verdade para este plano. O backend (`/rules` e a
inclusão de "Regras" no endpoint `/search`) é implementado antes, pela pipeline de
`app-api` (ver `.claude/tasks/regras/task-api.md`); este plano cobre apenas o `app-web`.

Referência principal investigada: feature "Locais"
(`app-web/src/app/(authorized)/locais/`), que já implementa exatamente o padrão de
"Adicionar Seção" pedido para Regras.

## Decisões confirmadas pelo usuário

- **Sidebar**: criar uma nova `NavSection` com `title: 'JOGO'`, contendo apenas o item
  "Regras", posicionada imediatamente ACIMA da seção "Mundo" existente em
  `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`. A rota vem de
  `APP_ROUTES.private.rules` (definida em `shared/routes.ts`), sem hardcode do path.
  Ícone `react-icons` a escolher de forma coerente com os demais itens do menu (ex.:
  `FiBookOpen`).
- **Busca / menções `@`**: fora de escopo do `app-web` — ver seção "Não-escopo" abaixo.

## Não-escopo (explícito)

Esta demanda **não inclui nenhuma alteração no fluxo de busca/menções `@` do
`app-web`**. Os seguintes arquivos permanecem intocados por este plano:

- `shared/constants/EntityMentions/index.ts` (`ENTITY_MENTION_TYPE_LABELS`,
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `ENTITY_MENTION_VIEWABLE_TYPES`)
- `shared/components/EntityMentionViewDispatcher/index.tsx`
- `shared/components/.../MentionSuggestionList` (e demais componentes do editor de
  rich text que resolvem/exibem sugestões de menção)
- `shared/components/.../EntityMentionNodeView`
- `shared/components/Inputs/FormInputs/FormRichTextInput`

O consumo de busca/menções do `app-web` permanece exatamente como está hoje — Regras
não aparecerá como tipo mencionável/pesquisável nesses componentes como parte deste
plano. Registrar "Regras" nos resultados de busca (`GET /search`) é responsabilidade
exclusiva do backend (`search.service` da API), já prevista em
`.claude/tasks/regras/task-api.md`. Caso no futuro se queira que Regras apareça nas
menções `@`, isso é uma nova demanda a ser planejada separadamente.

## Etapas

### 1. web-dev

#### Componentes

- Componente: `RulesFilterSection`
  (`app-web/src/app/(authorized)/regras/components/RulesFilterSection/index.tsx`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`,
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: réplica exata do padrão de
    `app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx`
    (única entidade de referência com filtro **apenas por nome**): um `DefaultTextInput`
    com ícone `FiSearch` e um `PrimaryButton` "Filtrar", dentro de um `<form>` com
    `onSubmit`. Página nunca deve ter inputs de filtro inline — sempre via este
    componente (padrão `web-secao-filtros`).

- Componente: `RuleSectionsField`
  (`app-web/src/app/(authorized)/regras/components/RuleSectionsField/index.tsx`)
  - Props: `control: Control<RuleFormData>`.
  - Comportamento esperado: réplica exata de
    `app-web/src/app/(authorized)/locais/components/LocationSectionsField/index.tsx`
    — `useFieldArray` no campo `sections`; quando há seções, grid
    `grid-cols-1 sm:grid-cols-2` (2 por linha); cada seção com `FormTextInput` "Label"
    em cima (com `IconButton`/`Tooltip` "Remover seção" ao lado, ícone `FiTrash2`,
    remoção direta sem modal de confirmação, sem reordenação) e `FormRichTextInput`
    "Descrição" abaixo; botão `SecondaryButton` "Adicionar Seção" alinhado à direita
    (`flex justify-end`) abaixo da grade, chamando `append({ label: '', description: '' })`,
    sem limite de quantidade.

- Componente: `RuleSectionCard`
  (`app-web/src/app/(authorized)/regras/components/RuleSectionCard/index.tsx`)
  - Props: `section: IRuleSection`.
  - Comportamento esperado: réplica exata de
    `app-web/src/app/(authorized)/locais/components/LocationSectionCard/index.tsx` —
    caixa `APP_CONTAINER_STYLES.detailSectionBox`, cabeçalho com ícone `FiFileText` +
    `Label` mostrando `section.label`, corpo com `RichTextViewer value={section.description}`.
    Usado dentro do `RuleView` (ver abaixo), no mesmo grid 2 colunas de
    `LocationView`, e só renderizado se `rule.sections.length > 0` (bloco
    inteiramente omitido caso contrário).

Esses três componentes precisam existir antes de a página/formulário/modal de Regras
consumi-los (mesmo agente `web-dev` implementa ambos na mesma etapa).

#### Funcionalidade

- **Rotas / navegação**
  - Adicionar `rules: '/regras'` em `MENU_ROUTES` e em `APP_ROUTES.private` em
    `app-web/src/shared/routes.ts` (não hardcodar o path em nenhum outro arquivo).
  - Em `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`, inserir uma
    nova `NavSection` (`title: 'JOGO'`) com o item `{ label: 'Regras', href:
    APP_ROUTES.private.rules, icon: <FiBookOpen ou ícone react-icons equivalente,
    coerente com o restante do menu> }`, posicionada imediatamente ACIMA da seção
    `'Mundo'` no array `NAV_SECTIONS` (decisão confirmada — ver "Decisões confirmadas
    pelo usuário").
  - Criar `app-web/src/app/(authorized)/regras/page.tsx`, réplica estrutural de
    `app-web/src/app/(authorized)/locais/page.tsx` (mesmos estados: `nameInput`,
    `isFormModalOpen`, `rulePendingDelete`, `rulePendingView`, `filters`; mesmo uso de
    `useIsGoogleUser`, `useGetEntityList`, `useDeleteEntity`, `PageContainer`,
    `FormModal`/`ViewModal`/`ConfirmationModal`, `PrimaryButton` "Novo" oculto para
    Google), porém com filtro **somente por nome** (sem campo "Tipo").

- **Interfaces** (`app-web/src/shared/interfaces/Entities/Rule/index.ts`, registrado
  em `shared/interfaces/Entities/index.ts` como `export * from './Rule'`, seguindo o
  padrão de `Location/index.ts`):
  - `IRuleSection { id: string; label: string; description?: string | null; order: number; }`
  - `IRule extends IEntity { name: string; description?: string | null; sections: IRuleSection[]; createdAt: string; updatedAt: string; }`
  - `IRuleListItem { id: string; name: string; }`
  - `IRuleListFilters { name?: string; page?: number; perPage?: number; }`
  - Observação: sem `referenceImageUrl`, `tags` ou `privateInformation` — o pedido não
    lista esses campos para Regras, diferente de Locais.

- **Schema de formulário** (`app-web/src/shared/formSchemas/RuleFormSchema/index.ts`,
  registrado em `shared/formSchemas/index.ts`), modelado em
  `shared/formSchemas/LocationFormSchema/index.ts` mas reduzido aos campos pedidos:
  ```
  name: z.string().min(1, 'Informe o nome')
  description: z.string() // opcional na prática (string vazia permitida)
  sections: z.array(z.object({
    label: z.string().min(1, 'Informe o label'),
    description: z.string().optional(),
  }))
  ```
  Exporta `RuleFormData`, `ruleFormResolver` (`zodResolver`), `ruleFormDefaultValues`
  (`{ name: '', description: '', sections: [] }`).

- **Store** (`app-web/src/store/PageStore/RulesStore/index.ts`, registrado em
  `store/index.ts`): `useSelectedRuleStore`, réplica exata de
  `store/PageStore/LocationsStore/index.ts` (`selectedRule: IRuleListItem | null`,
  `setSelectedRule`, `resetSelectedRule`).

- **Integrações com API** (via `hooks/Queries` genéricos, sem chamadas bespoke):
  - `GET /rules` — `useGetEntityList<IRuleListItem, IRuleListFilters>({ url: '/rules', filters })` na listagem paginada (mesmo padrão de `TablePagination` de `LocationsList`/`APP_DEFAULT_PAGE_SIZE`).
  - `GET /rules/:id` — `useGetEntityById<IRule>` tanto no formulário de edição (`RuleCreateForm`, para carregar dados existentes) quanto no `RuleView` (modal de detalhe).
  - `POST /rules` — `usePostEntity<IRule, RulePayload>({ url: '/rules', invalidateQueryKeys: [['/rules']] })`.
  - `PUT /rules/:id` — `usePutEntity<IRule, RulePayload>({ url: '/rules/:id', invalidateQueryKeys: [['/rules']] })`.
  - `DELETE /rules/:id` — `useDeleteEntity({ url: '/rules/:id', invalidateQueryKeys: [['/rules']] })`.
  - Payload de create/update envia `sections` mapeado para `{ label, description: description || undefined }`, mesmo tratamento de `buildPayload` em `LocationCreateForm`.
  - **Erro de nome duplicado (409)**: o campo `name` é `UNIQUE` na API, que retorna
    `409 Conflict` com mensagem em pt-BR ao tentar salvar um nome já existente. O
    `RuleCreateForm` deve tratar esse erro no `catch` do `onSubmit` (create e edit) e
    exibir a mensagem retornada pela API em toast, no mesmo padrão já usado pelas
    outras features para erros de mutação (ex.: `LocationCreateForm`/`UserCreateForm`)
    — sem lógica de validação de unicidade no client, apenas exibição do erro vindo do
    backend.

- **Componentes de listagem**
  - `RulesList` / `RulesListItem`
    (`app-web/src/app/(authorized)/regras/components/RulesList/index.tsx` e
    `RulesListItem/index.tsx`), modelados em `ErasList`/`ErasListItem`, mas **sem**
    coluna de imagem e **sem** coluna de tags (Regras não tem esses campos): apenas
    colunas "Nome" e "Ações" (visualizar/editar/excluir).

- **Formulário de cadastro/edição** (`RuleCreateForm`, réplica estrutural de
  `LocationCreateForm`, ligado a `useSelectedRuleStore` para modo edição):
  - `name`: `FormTextInput` obrigatório.
  - `description`: `FormRichTextInput` (componente já existente,
    `shared/components/Inputs/FormInputs/FormRichTextInput`, **não recriar**),
    opcional.
  - `RuleSectionsField` logo abaixo da descrição — mesmo posicionamento e
    comportamento de `LocationSectionsField` em `LocationCreateForm`.
  - `onSubmit` decide `usePostEntity`/`usePutEntity` conforme `selectedRule` (modo
    edição), com `reset()`/toasts de sucesso e erro em pt-BR (incluindo o tratamento
    do 409 de nome duplicado descrito acima), mesmo padrão de `LocationCreateForm`.

- **Modal de visualização** (`RuleView`,
  `app-web/src/app/(authorized)/regras/components/RuleView/index.tsx`), consumindo
  `GET /rules/:id`:
  - Nome (`Title`) centralizado no topo — sem banner de imagem (Regras não tem
    `referenceImageUrl`), diferente de `LocationView`/`EraView`.
  - Logo abaixo, o quadro de descrição ocupando **toda a largura da linha** (`div`
    com `APP_CONTAINER_STYLES.detailSectionBox` full-width, cabeçalho com ícone
    `FiFileText` + `Label` "Descrição", corpo com `RichTextViewer value={rule.description}`)
    — mesmo componente/estilo do bloco de descrição de `LocationView`, mas fora do
    grid de 2 colunas.
  - Abaixo, se `rule.sections.length > 0`: grid `grid-cols-1 sm:grid-cols-2` com um
    `RuleSectionCard` por seção (idêntico ao bloco de seções de `LocationView`); se
    não houver seções, o bloco inteiro é omitido (sem título vazio nem placeholder).
  - Tratamento de loading/erro/404 (`onNotFound`) igual a `LocationView`/`EraView`.
  - Página `regras/page.tsx` abre este componente dentro de `ViewModal` (`title="Detalhes da Regra"`, `size="wide"`), mesmo padrão de `locais/page.tsx`.

- **Formulário/validação (resumo)**: `name` obrigatório (min 1 caractere), único no
  backend (tratar 409 em toast pt-BR); `description` opcional (rich text, HTML);
  `sections[].label` obrigatório (min 1 caractere), `sections[].description` opcional
  (rich text); sem limite de quantidade de seções, sem reordenação, remoção direta por
  item.

- **Acesso Google**: ocultar ações de criar/editar/excluir para usuários
  `provider: 'google'` (padrão `web-permissao-google-readonly`, hook `useIsGoogleUser`),
  mantendo apenas "visualizar" — aplicado em três pontos, espelhando `locais`:
  botão "Novo" em `regras/page.tsx`, e ícones de editar/excluir em `RulesListItem`
  (mesmo padrão condicional de `LocationsListItem`).

Status: concluído
Componentes: app-web/src/app/(authorized)/regras/components/RulesFilterSection/index.tsx, app-web/src/app/(authorized)/regras/components/RuleSectionsField/index.tsx, app-web/src/app/(authorized)/regras/components/RuleSectionCard/index.tsx, app-web/src/app/(authorized)/regras/components/RulesList/index.tsx, app-web/src/app/(authorized)/regras/components/RulesListItem/index.tsx, app-web/src/app/(authorized)/regras/components/RuleCreateForm/index.tsx, app-web/src/app/(authorized)/regras/components/RuleView/index.tsx
Arquivos: app-web/src/app/(authorized)/regras/page.tsx, app-web/src/shared/interfaces/Entities/Rule/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/formSchemas/RuleFormSchema/index.ts, app-web/src/shared/formSchemas/index.ts, app-web/src/store/PageStore/RulesStore/index.ts, app-web/src/store/index.ts, app-web/src/shared/routes.ts, app-web/src/app/(authorized)/components/Sidebar/data/index.ts

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. A implementação é uma
réplica fiel e consistente do padrão de "Locais"/"Eras", com tipagem correta contra os
DTOs da API (`RuleResponseDto`, `RuleSectionResponseDto`, `RuleListItemResponseDto`,
`CreateRuleDto`/`UpdateRuleDto`, `RuleSectionInputDto`, `FindRulesQueryDto`), uso
correto dos hooks genéricos de `hooks/Queries` (`useGetEntityList`, `useGetEntityById`,
`usePostEntity`, `usePutEntity`, `useDeleteEntity`) com `invalidateQueryKeys: [['/rules']]`
em todas as mutações, formulário `react-hook-form` + `zod` seguindo a convenção de
`shared/formSchemas/` (sem Yup), reuso de `FormRichTextInput`/`RichTextViewer` e dos
componentes `RuleSectionsField`/`RuleSectionCard` (nenhuma duplicação de UI equivalente
já existente), seção de filtro extraída em `RulesFilterSection` (apresentacional, sem
estado/API própria), ícones exclusivamente de `react-icons`, ocultação de
criar/editar/excluir para usuários Google via `useIsGoogleUser` nos três pontos
esperados (`regras/page.tsx`, `RulesListItem`), layout do `RuleView` conforme
especificado (nome centralizado sem banner de imagem, descrição em largura total fora
do grid, seções em grid 2 colunas omitidas quando vazias), sidebar com a nova seção
"JOGO" contendo apenas "Regras" imediatamente acima de "Mundo" usando
`APP_ROUTES.private.rules` sem hardcode de path, e store/interfaces/schema registrados
corretamente nos respectivos `index.ts`. Confirmado também que nenhum arquivo do fluxo
de menções `@` (`FormRichTextInput`, `MentionSuggestionList`, `EntityMentionNodeView`,
`EntityMentionViewDispatcher`, `shared/constants/EntityMentions/index.ts`) foi alterado
— nenhuma ocorrência de "rule"/"Rule" encontrada nesses arquivos.

Arquivos revisados: `app-web/src/app/(authorized)/regras/page.tsx`,
`app-web/src/app/(authorized)/regras/components/RulesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RuleSectionsField/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RuleSectionCard/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RulesList/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RulesListItem/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RuleCreateForm/index.tsx`,
`app-web/src/app/(authorized)/regras/components/RuleView/index.tsx`,
`app-web/src/shared/interfaces/Entities/Rule/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/formSchemas/RuleFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/store/PageStore/RulesStore/index.ts`, `app-web/src/store/index.ts`,
`app-web/src/shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`.
