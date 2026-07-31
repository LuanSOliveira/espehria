# Task Web: Campanhas

## Contexto
Não existe `.claude/tasks/campanhas/spec.md` — os requisitos abaixo foram validados
diretamente com o usuário na demanda que originou este plano (ver mensagem do
solicitante) e são a fonte da verdade.

Referências de código usadas neste plano: `app-web/src/app/(authorized)/locais/`
(CRUD completo com modal de criar/editar, `ViewModal`, seções adicionais via
`LocationSectionsField`/`LocationSectionCard`) e as listagens de `criaturas`/
`divindades` (`ImageAvatarPreview`, componente de avatar circular com fallback,
usado hoje nas colunas de imagem das tabelas).

Status: pendente

## Etapas

### 1. web-dev

Status: concluído
Componentes: app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx,
app-web/src/app/(authorized)/campanhas/components/CampaignsList/index.tsx,
app-web/src/app/(authorized)/campanhas/components/CampaignsListItem/index.tsx,
app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx,
app-web/src/app/(authorized)/campanhas/components/CampaignSectionsField/index.tsx,
app-web/src/app/(authorized)/campanhas/components/CampaignSectionCard/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsList/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsListItem/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionSectionsField/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionSectionCard/index.tsx,
app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionView/index.tsx
Arquivos: app-web/src/app/(authorized)/campanhas/page.tsx,
app-web/src/app/(authorized)/campanhas/[id]/page.tsx,
app-web/src/shared/routes.ts (rota estática `campaigns` + helper `campaignDetails(id)`,
primeiro precedente de rota dinâmica),
app-web/src/proxy.ts (bloqueio de `/campanhas` e `/campanhas/{id}` para provider
google, via `startsWith`),
app-web/src/app/(authorized)/components/Sidebar/data/index.ts (item "Campanhas" na
primeira seção, ícone FiCompass),
app-web/src/app/(authorized)/components/Sidebar/index.tsx (filtro estendido para
remover também `/campanhas` da navegação de usuários google),
app-web/src/shared/interfaces/Entities/Campaign/index.ts,
app-web/src/shared/interfaces/Entities/PlannedSession/index.ts,
app-web/src/shared/interfaces/Entities/index.ts (barrel),
app-web/src/shared/formSchemas/CampaignFormSchema/index.ts,
app-web/src/shared/formSchemas/PlannedSessionFormSchema/index.ts,
app-web/src/shared/formSchemas/index.ts (barrel),
app-web/src/store/PageStore/CampaignsStore/index.ts,
app-web/src/store/PageStore/PlannedSessionsStore/index.ts,
app-web/src/store/index.ts (barrel)
Pendências/observações: nenhuma — rotas de API confirmadas contra
app-api/src/modules/campaigns e app-api/src/modules/planned-sessions (rotas
aninhadas `campaigns/:campaignId/planned-sessions`), sem uso de `campaignId` em
filtros/payloads de sessão planejada, conforme decisão do backend.

#### Componentes

Nenhum componente genérico novo é necessário — `ImageAvatarPreview`
(`shared/components/ImageAvatarPreview`), `RichTextViewer`, `FormRichTextInput`,
`FormMultiAutocompleteInput`, `TagBadge`, `FormModal`, `ViewModal`,
`ConfirmationModal` e os demais `shared/components/*` usados por `locais` já
cobrem tudo que a demanda precisa. Todos os componentes abaixo são **específicos
de página** (`app/(authorized)/campanhas/components/` ou
`app/(authorized)/campanhas/[id]/components/`), seguindo `web-tabela-listagem`,
`web-secao-filtros` e `web-componentes`.

**Listagem de campanhas** (`app/(authorized)/campanhas/components/`):
- `CampaignsFilterSection` — form com um único campo `DefaultTextInput` de busca
  por nome + `PrimaryButton` "Filtrar", mesmo padrão de `LocationsFilterSection`.
  Props: `nameValue`, `onNameChange`, `onSubmit`.
- `CampaignsList` — shell da tabela (`TableContainer`/`Table`/`TableHead`/
  `TableBody`/`TablePagination`), colunas: Imagem, Nome, Tags, Ações. Props:
  `campaigns`, `total`, `page`, `isLoading`, `onPageChange`, `onView`, `onEdit`,
  `onDelete`.
- `CampaignsListItem` — uma `TableRow`; célula de imagem com
  `<ImageAvatarPreview imageUrl={campaign.referenceImageUrl} alt={campaign.name} />`;
  célula de tags com `TagBadge` por tag. Ação "Visualizar" **não abre modal** —
  chama `onView(campaign)`, que a página implementa navegando via
  `router.push(APP_ROUTES.private.campaignDetails(campaign.id))` (exceção ao
  padrão normal de View em modal usado em todas as outras entidades). Editar/
  excluir seguem `web-tabela-listagem`.
- `CampaignCreateForm` — formulário dentro de `FormModal` (`size="wide"`, pois
  tem `FormRichTextInput` e mais de 4 campos), modo criar/editar decidido por uma
  store de entidade selecionada (ver seção Funcionalidade). Campos: `name`
  (`FormTextInput`), `referenceImageUrl` (`FormTextInput`, URL),
  `tagIds` (`FormMultiAutocompleteInput` alimentado por `useGetEntityList<ITag>`
  em `/tags`, mesmo padrão de `LocationCreateForm`), `description`
  (`FormRichTextInput`), seções adicionais via `CampaignSectionsField`.
- `CampaignSectionsField` — equivalente a `LocationSectionsField`: `useFieldArray`
  sobre `sections`, cada item com `FormTextInput` de label +
  `FormRichTextInput` de descrição, botão "Remover seção" e "Adicionar Seção".
- `CampaignSectionCard` — equivalente a `LocationSectionCard`, renderiza uma
  seção (label + `RichTextViewer`) no mesmo estilo de caixa
  (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`). É
  consumido tanto pela página de detalhe (item 3) quanto, potencialmente, por
  qualquer preview futuro — mas hoje só é usado na página de detalhe.

**Página de detalhe** (`app/(authorized)/campanhas/[id]/components/`):
- `PlannedSessionsSection` — bloco "Sessões Planejadas" (título + filtro + lista +
  modal de form + modal de view + confirmação de exclusão), escopado por
  `campaignId` recebido via prop.
- `PlannedSessionsFilterSection` — igual ao padrão de filtro por nome
  (`web-secao-filtros`).
- `PlannedSessionsList` / `PlannedSessionsListItem` — colunas: Nome, Tags, Ações
  (visualizar — abre modal aqui, seguindo o padrão normal; editar; excluir).
- `PlannedSessionCreateForm` — formulário em `FormModal` (`size="wide"`): `name`
  (`FormTextInput`), `introduction` (`FormRichTextInput`), `tagIds`
  (`FormMultiAutocompleteInput` sobre `/tags`), seções adicionais via
  `PlannedSessionSectionsField` (mesmo padrão de `CampaignSectionsField`).
- `PlannedSessionSectionsField` / `PlannedSessionSectionCard` — equivalentes aos
  de campanha, para as seções adicionais da sessão.
- `PlannedSessionView` — conteúdo do `ViewModal`: nome centralizado (`Title`),
  tags centralizadas abaixo, quadro de `introduction` (`RichTextViewer` dentro de
  `APP_CONTAINER_STYLES.detailSectionBox`) ocupando toda a largura do modal, e
  abaixo os `PlannedSessionSectionCard` das seções adicionais (mesmo layout de
  `LocationView`/`DivinityView`, mas sem banner de imagem — sessão planejada não
  tem campo de imagem).

#### Funcionalidade

**Navegação e bloqueio de acesso para usuários Google (regra não-padrão)**

A skill `web-permissao-google-readonly` cobre, por padrão, apenas ocultar as
ações de escrita (criar/editar/excluir) mantendo a visualização liberada — é o
que se aplica dentro da seção "Sessões Planejadas". Para a entidade Campanha em
si, a demanda pede bloqueio total (nem leitura), que é o mesmo tratamento hoje
aplicado só a `usuarios` (seção final da skill). Aplicar exatamente esse
tratamento duplo para `campanhas`:
- **Sidebar**: em `app/(authorized)/components/Sidebar/data/index.ts`, adicionar
  `{ label: 'Campanhas', href: APP_ROUTES.private.campaigns, icon: <ícone
  react-icons/fi a escolher> }` na primeira seção (sem `title`, a mesma que hoje
  só contém "Home"), logo abaixo do item Home. Em
  `app/(authorized)/components/Sidebar/index.tsx`, estender o filtro que hoje só
  remove `APP_ROUTES.private.users` para usuários Google, removendo também
  `APP_ROUTES.private.campaigns` (ex.: comparar contra um array
  `[APP_ROUTES.private.users, APP_ROUTES.private.campaigns]` em vez de uma
  igualdade única).
- **Bloqueio de rota via middleware**: em `src/proxy.ts`, estender a checagem que
  hoje só compara `pathname === APP_ROUTES.private.users` para também cobrir
  `/campanhas` e `/campanhas/{id}` — como é a primeira rota dinâmica bloqueada do
  projeto, usar `pathname === APP_ROUTES.private.campaigns ||
  pathname.startsWith(\`${APP_ROUTES.private.campaigns}/\`)` (mesma lógica de
  redirecionar para `APP_ROUTES.private.home` quando `decoded.provider ===
  'google'`). Isso cobre acesso direto por URL sem depender só da resposta da
  API.
- **Backend**: fora do escopo deste agente, mas a task-api correspondente deve
  usar `@GoogleAccess('blocked')` no controller de campanhas (skill
  `api-permissao-google-readonly`) — a UI não deve depender só disso, daí o
  bloqueio duplicado acima.
- A seção "Sessões Planejadas" (dentro do detalhe), por não ser acessível para
  usuário Google de forma alguma (a página inteira já está bloqueada), não
  precisa de tratamento Google próprio adicional — mas, como boas práticas e
  para o caso de a regra de bloqueio da campanha mudar no futuro, o
  `PlannedSessionsListItem` deve seguir o padrão normal de
  `web-permissao-google-readonly` (ocultar editar/excluir, manter visualizar)
  igual a `LocationsListItem`, e não assumir que `useIsGoogleUser` nunca será
  `true` ali.

**Registro de rotas em `shared/routes.ts`**

Não há precedente de rota dinâmica em `shared/routes.ts` hoje (todas as entradas
de `APP_ROUTES` são strings estáticas) — esta é a primeira. Seguir esta
convenção, mantendo `APP_ROUTES.private.campaigns` como string estática (usada
por Sidebar, listagem e middleware) e adicionando uma função auxiliar para
montar o link de detalhe a partir de um id:

```ts
const MENU_ROUTES = {
  // ...
  campaigns: '/campanhas',
};

export const APP_ROUTES = {
  private: {
    // ...
    campaigns: MENU_ROUTES.campaigns,
    campaignDetails: (id: string) => `${MENU_ROUTES.campaigns}/${id}`,
  },
  // ...
};
```

- Todo `router.push`/`Link href` para o detalhe de uma campanha usa
  `APP_ROUTES.private.campaignDetails(id)`, nunca a string literal.
- `PUBLIC_PATHS`/comparações de igualdade em `proxy.ts` continuam funcionando
  normalmente pois `campaigns` continua sendo uma string simples; o padrão da
  rota dinâmica (`/campanhas/{id}`) é tratado à parte via `startsWith` (ver
  bloqueio Google acima), não por uma entrada estática em `APP_ROUTES`.

**Páginas/rotas**

- `app/(authorized)/campanhas/page.tsx` — listagem. Segue o mesmo formato de
  `locais/page.tsx`: título "Campanhas" + botão "Novo" (oculto para Google, mas
  na prática nunca visível a Google já que a rota inteira é bloqueada — manter a
  checagem mesmo assim por consistência com o restante da página, que reusa os
  mesmos componentes/estado), `CampaignsFilterSection`, `CampaignsList`,
  `FormModal` com `CampaignCreateForm`, `ConfirmationModal` de exclusão. Estado
  de filtros/paginação/entidade selecionada e store seguem exatamente o modelo
  de `locais/page.tsx`. Ação de visualizar navega para
  `APP_ROUTES.private.campaignDetails(campaign.id)` via `useRouter().push` (não
  usa `ViewModal` aqui — exceção documentada acima).
- `app/(authorized)/campanhas/[id]/page.tsx` — detalhe. Lê `campaignId` dos
  `params` da rota (Next.js App Router, `params: Promise<{ id: string }>` em
  Next 16). Busca a campanha via `useGetEntityById<ICampaign>({ url:
  \`/campaigns/${campaignId}\` })`. Trata `isLoading` (spinner, mesmo padrão de
  `LocationView`) e `isError` (toast de erro; se `error.response?.status ===
  404` — campanha de outro usuário ou inexistente — redirecionar para
  `APP_ROUTES.private.campaigns`, já que não é um caso a se manter na página).
  Layout:
  - Cabeçalho: `ImageAvatarPreview` com `size={100}` (círculo 100x100 com
    fallback, mesmo componente usado hoje nas listagens de `criaturas`/
    `divindades`/`locais`) ao lado do nome (`Title`) e, abaixo do nome, as tags
    (`Chip` por tag, mesmo padrão de `LocationView`/`DivinityView`) se houver.
  - Abaixo do cabeçalho: quadro de `description` (`RichTextViewer` dentro de
    `APP_CONTAINER_STYLES.detailSectionBox`), e abaixo dele um grid com
    `CampaignSectionCard` por seção adicional (se existirem), mesmo padrão
    visual de `LocationSectionCard`.
  - Depois: `PlannedSessionsSection campaignId={campaignId}` (seção "Sessões
    Planejadas").

**Seção "Sessões Planejadas"**

- Listagem escopada à campanha (`campaignId`), com filtro por nome e paginação
  próprios (estado local do `PlannedSessionsSection`, não misturado com o da
  campanha).
- Ações: visualizar (abre `ViewModal` com `PlannedSessionView`, padrão normal),
  editar (abre `FormModal` com `PlannedSessionCreateForm`), excluir
  (`ConfirmationModal`).
- **Atenção — rota da API ainda não está definida**: a task-api de campanhas
  ainda não foi implementada neste momento (não existe
  `app-api/src/modules/campaigns/` nem `planned-sessions/` no repo). A URL real
  para listar/criar/atualizar/excluir sessões planejadas depende de uma decisão
  de modelagem do backend (módulo aninhado, ex. `/campaigns/:campaignId/planned-
  sessions`, versus recurso próprio filtrado por query, ex. `/planned-
  sessions?campaignId=...`). Antes de implementar a integração, o `web-dev` deve
  conferir `.claude/tasks/campanhas/task-api.md` (se existir) e/ou o controller
  gerado em `app-api/src/modules/` para confirmar a rota real, em vez de assumir
  qualquer uma das duas opções. Os hooks (`useGetEntityList`, `usePostEntity`,
  `usePutEntity`, `useDeleteEntity`) recebem `url` como parâmetro simples, então
  a mudança de convenção não afeta a estrutura dos componentes, só a string
  passada a cada hook e a `invalidateQueryKeys`.

**Integrações com API**

- Campanhas: `GET /campaigns` (listagem paginada, filtro `name`), `GET
  /campaigns/:id` (detalhe), `POST /campaigns` (criar), `PUT /campaigns/:id`
  (editar), `DELETE /campaigns/:id` (excluir). Nomes de endpoint a confirmar
  contra `task-api.md`/controller real antes de codar — usar como ponto de
  partida o padrão já usado por `locations`.
- Sessões planejadas: mesmos 5 verbos, rota exata a confirmar conforme nota
  acima.
- Tags: `GET /tags` (já existente, reaproveitado como em `LocationCreateForm`,
  `filters: { perPage: 100 }`) para alimentar o `FormMultiAutocompleteInput` de
  `tagIds` tanto no formulário de campanha quanto no de sessão planejada.
- Todas as mutations seguem `web-integracao-api`/`web-form-cadastro`:
  `invalidateQueryKeys` sempre incluindo a queryKey da listagem correspondente
  (`[['/campaigns']]` para campanha; para sessões planejadas, a queryKey real
  usada por `useGetEntityList` na seção, seja ela filtrada por
  `campaignId` em query ou por path aninhado), toast de sucesso/erro em
  ambas.

**Formulário/validação — Campanha** (`shared/formSchemas/CampaignFormSchema`,
seguindo `web-form-schema`, mesmo padrão de `LocationFormSchema`):
- `name`: obrigatório (`z.string().min(1, 'Informe o nome')`).
- `referenceImageUrl`: opcional, mas se preenchido deve ser uma URL válida
  (mesmo `refine` usado em `locationFormSchema.referenceImageUrl`, aceitando
  string vazia).
- `description`: opcional (`z.string()`, sem `.min`, mesmo padrão de
  `LocationFormSchema.description`).
- `tagIds`: opcional (`z.array(z.string()).optional()`).
- `sections`: array de `{ label: string (obrigatório), description?: string
  }`, mesmo shape de `locationFormSchema.sections`.
- Sem variante de edição (`*EditFormSchema`) — não há campo com regra diferente
  entre criar/editar, mesmo padrão de `LocationFormSchema` (que também não tem
  variante).

**Formulário/validação — Sessão Planejada**
(`shared/formSchemas/PlannedSessionFormSchema`):
- `name`: obrigatório.
- `introduction`: opcional (rich text).
- `tagIds`: opcional.
- `sections`: mesmo shape de campanha (`label` obrigatório, `description`
  opcional).
- Sem variante de edição, mesmo raciocínio acima.

**Stores** (`store/PageStore`, seguindo `web-form-cadastro`):
- `store/PageStore/CampaignsStore` — `useSelectedCampaignStore`
  (`selectedCampaign: ICampaignListItem | null` + `setSelectedCampaign` +
  `resetSelectedCampaign`), mesmo modelo de `useSelectedLocationStore`.
- `store/PageStore/PlannedSessionsStore` — `useSelectedPlannedSessionStore`,
  mesmo modelo, para o modal de criar/editar dentro da seção.

**Interfaces** (`shared/interfaces/Entities/Campaign` e
`shared/interfaces/Entities/PlannedSession`, reexportadas pelo barrel
`shared/interfaces/Entities/index.ts`):
- `ICampaignListItem { id, referenceImageUrl?, name, tags }`.
- `ICampaignSection { id, label, description?, order }`.
- `ICampaign extends IEntity { name, referenceImageUrl?, description?, tags,
  sections }`.
- `ICampaignListFilters { name?, page?, perPage? }`.
- Equivalentes `IPlannedSessionListItem`, `IPlannedSessionSection`,
  `IPlannedSession` (incluindo `introduction` em vez de `description`),
  `IPlannedSessionListFilters` — acrescentando `campaignId` aos filtros/payloads
  apenas se a API real exigir isso via query (a confirmar conforme nota da
  seção "Sessões Planejadas" acima).

**Acesso Google**: ver seção "Navegação e bloqueio de acesso para usuários
Google" acima — tratamento não-padrão para a entidade Campanha (bloqueio total
de navegação + rota, não apenas ocultar ações). Dentro da seção "Sessões
Planejadas", usar o padrão default da skill `web-permissao-google-readonly`
(ocultar editar/excluir, manter visualizar).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Revisão completa de todos os componentes/páginas/hooks/stores/interfaces/schemas
listados na etapa "1. web-dev", cruzando com os controllers e DTOs reais em
`app-api/src/modules/campaigns/` e `app-api/src/modules/planned-sessions/`
(ambos já implementados, com `@GoogleAccess('blocked')` no controller de
campanhas, confirmando a mensagem residual de "pendência" no topo da etapa 1
como não mais aplicável) e com a referência `locais/`.

**Nenhum problema bloqueante ou de severidade média/alta encontrado.** A
implementação segue fielmente o padrão de `locais` (estrutura de pastas,
hooks genéricos de `hooks/Queries`, `invalidateQueryKeys` corretos em todas as
mutations — inclusive nas rotas aninhadas de sessões planejadas
`/campaigns/:campaignId/planned-sessions`, que batem com o controller real),
usa `react-hook-form` + `zod` corretamente (sem variante `*EditFormSchema`,
conforme decisão documentada), ícones exclusivamente de `react-icons/fi` com
`aria-label` em pt-BR nos `IconButton`, e reaproveita os componentes
genéricos existentes (`ImageAvatarPreview`, `RichTextViewer`,
`FormRichTextInput`, `FormMultiAutocompleteInput`, `TagBadge`, `FormModal`,
`ViewModal`, `ConfirmationModal`) sem duplicação.

As regras não-padrão pedidas na task foram implementadas corretamente:
- Bloqueio total a usuários Google: item "Campanhas" oculto na Sidebar
  (`Sidebar/data/index.ts` + filtro estendido em `Sidebar/index.tsx` via
  `GOOGLE_BLOCKED_ROUTES`) e rota bloqueada em `src/proxy.ts` via
  `pathname === APP_ROUTES.private.campaigns || pathname.startsWith(...)`,
  batendo com `@GoogleAccess('blocked')` nos dois controllers da API.
- Dentro de "Sessões Planejadas", `PlannedSessionsListItem` segue o padrão
  default da skill (oculta editar/excluir, mantém visualizar via
  `useIsGoogleUser`), como esperado.
- Ação "Visualizar" da listagem de campanhas navega para
  `APP_ROUTES.private.campaignDetails(campaign.id)` via `router.push` em vez
  de abrir modal, exceção documentada e implementada conforme especificado.
- Interfaces (`ICampaign`, `ICampaignListItem`, `ICampaignSection`,
  `IPlannedSession`, `IPlannedSessionListItem`, `IPlannedSessionSection`) e os
  filtros (`ICampaignListFilters`, `IPlannedSessionListFilters`, sem
  `campaignId`) batem com os DTOs de resposta e query DTOs reais
  (`CampaignResponseDto`, `CampaignListItemResponseDto`,
  `PlannedSessionResponseDto`, `PlannedSessionListItemResponseDto`,
  `FindCampaignsQueryDto`, `FindPlannedSessionsQueryDto`).

Achados de baixa severidade (não bloqueantes, apenas observações):

- **`app-web/src/app/(authorized)/campanhas/[id]/page.tsx:37-54`** — Quando
  `useGetEntityById` falha com um erro diferente de 404 (ex.: erro de rede,
  500), o `useEffect` exibe o toast de erro mas não redireciona, e como
  `campaign` permanece `undefined` o componente retorna `null` logo abaixo —
  a página fica em branco, sem link/botão para voltar a `/campanhas`. Como é
  a primeira página de detalhe (rota dinâmica) do projeto, não há um
  precedente direto a seguir aqui, mas vale considerar oferecer alguma forma
  de retorno (ex.: um botão "Voltar" ou redirecionar para
  `APP_ROUTES.private.campaigns` também nesse caso) em vez de deixar a tela
  vazia.
  - Trecho: `if (isNotFound) { router.push(APP_ROUTES.private.campaigns); }`
  - Sugestão: exibir um estado de erro com opção de voltar à listagem também
    para erros não-404, em vez de retornar `null`.

- **`app-web/src/app/(authorized)/components/Sidebar/index.tsx:49-52`** — o
  array `GOOGLE_BLOCKED_ROUTES` é recriado a cada render dentro do corpo do
  componente. Não causa bug (a filtragem só compara valores), é apenas um
  detalhe de estilo/performance desprezível.
  - Trecho: `const GOOGLE_BLOCKED_ROUTES = [APP_ROUTES.private.users, APP_ROUTES.private.campaigns];`
  - Sugestão: opcionalmente mover a constante para fora do componente (módulo)
    já que não depende de props/estado.

- **`app-web/src/app/(authorized)/components/Sidebar/index.tsx:19-27,102`** —
  `getSectionForPathname`/`isActive` comparam com `pathname === item.href`
  por igualdade exata; ao navegar para `/campanhas/{id}` (a primeira rota
  dinâmica do projeto), o item "Campanhas" na Sidebar deixa de aparecer como
  ativo/destacado, diferente do que ocorreria em uma entidade sem página de
  detalhe própria. Comportamento cosmético, não bloqueante.
  - Sugestão: se desejado, destacar o item também quando
    `pathname.startsWith(`${item.href}/`)`.

Arquivos revisados (todos aprovados, ressalvas acima são apenas sugestões
opcionais de baixa severidade):
`app-web/src/app/(authorized)/campanhas/page.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/page.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignsList/index.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignsListItem/index.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignSectionsField/index.tsx`,
`app-web/src/app/(authorized)/campanhas/components/CampaignSectionCard/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsList/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsListItem/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionSectionsField/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionSectionCard/index.tsx`,
`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionView/index.tsx`,
`app-web/src/shared/routes.ts`, `app-web/src/proxy.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`app-web/src/app/(authorized)/components/Sidebar/index.tsx`,
`app-web/src/shared/interfaces/Entities/Campaign/index.ts`,
`app-web/src/shared/interfaces/Entities/PlannedSession/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/formSchemas/CampaignFormSchema/index.ts`,
`app-web/src/shared/formSchemas/PlannedSessionFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/store/PageStore/CampaignsStore/index.ts`,
`app-web/src/store/PageStore/PlannedSessionsStore/index.ts`,
`app-web/src/store/index.ts`.

**Atualização — achados de baixa severidade corrigidos:**

Os três achados de baixa severidade listados acima foram corrigidos:

1. `app-web/src/app/(authorized)/campanhas/[id]/page.tsx` — adicionado um
   estado de erro dedicado para falhas não-404 ao carregar a campanha (ícone
   `FiAlertTriangle`, mensagem e `SecondaryButton` "Voltar para Campanhas" que
   navega via `router.push(APP_ROUTES.private.campaigns)`), em vez de renderizar
   `null`. O caso 404 continua redirecionando automaticamente, sem alterações
   de comportamento.
2. `app-web/src/app/(authorized)/components/Sidebar/index.tsx` —
   `GOOGLE_BLOCKED_ROUTES` movido para constante de módulo, fora do componente.
3. `app-web/src/app/(authorized)/components/Sidebar/index.tsx` — adicionada a
   função de módulo `isRouteActive(pathname, href)`
   (`pathname === href || pathname.startsWith(\`${href}/\`)`), usada tanto em
   `getSectionForPathname` quanto no cálculo de `isActive` dos itens da seção
   sem título (onde está "Campanhas"), destacando o item também em
   `/campanhas/{id}`, sem afetar as demais rotas (nenhuma é prefixo de outra) e
   sem tornar "Home" (`/home`) ativa em outras páginas.

Status: os 3 achados de baixa severidade corrigidos.
