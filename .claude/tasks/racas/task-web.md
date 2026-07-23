# Task Web: Raças

## Contexto

Não há `.claude/tasks/racas/spec.md` — requisito já esclarecido diretamente pelo
usuário (orquestrador), sem necessidade do agente `spec`. Este plano foi elaborado
com base direta no pedido detalhado recebido, investigando a feature já
implementada `app-web/src/app/(authorized)/criaturas/` (referência de padrão mais
próxima: listagem paginada + filtro dedicado + `FormModal` de criar/editar +
`ViewModal` de visualização + tags) e o plano `.claude/tasks/criaturas-view-modal/task-web.md`
(mecanismo de visualização — estado local `*PendingView` na página + `ViewModal`
genérico + componente `*View` específico da feature).

**Contrato de API fechado** (implementado em paralelo pela task-api do mesmo slug,
`.claude/tasks/racas/task-api.md` — nomes de propriedade em inglês, batendo com o
JSON do backend):
- `GET /races` — paginado, filtros `name` (parcial) e `categoryId` (exato), retorna
  `{ data: IRaceListItem[], total, page, perPage }`, cada item com `id`,
  `referenceImageUrl`, `name`, `category` (`{ id, name }`), `tags` (`ITag[]`).
- `GET /races/categories` — lista fixa de categorias (sem paginação), retorna
  `IRaceCategory[]` (`{ id, name }`).
- `GET /races/:id` — detalhe completo: `id`, `name`, `category`,
  `referenceImageUrl`, `physicalCharacteristics`, `description`, `tags`,
  `createdAt`, `updatedAt`.
- `POST /races` / `PUT /races/:id` — payload `{ name, categoryId,
  referenceImageUrl?, physicalCharacteristics?, description?, tagIds? }`.
- `DELETE /races/:id` — 204.

**Nomenclatura das propriedades:** todas as interfaces, filtros, o schema zod e o
uso nos componentes usam nomes de propriedade em inglês, batendo com o JSON acima.
Apenas rótulos de UI, placeholders, toasts e mensagens de validação permanecem em
pt-BR.

**Investigação de código existente relevante:**
- Feature `criaturas` é a referência direta de estrutura, e é estruturalmente mais
  simples de replicar para Raças do que `criaturas` em si (Raça tem só 6 campos de
  formulário contra ~25 de Criatura): `page.tsx` (filtros + `FormModal` +
  `ViewModal` + `ConfirmationModal`, com estado local
  `creaturePendingView`/`creaturePendingDelete` e `useSelectedCreatureStore` para o
  modo criar/editar), `CreaturesFilterSection` (padrão `web-secao-filtros` — inputs
  de filtro nunca inline em `page.tsx`), `CreaturesList`/`CreaturesListItem`
  (tabela paginada com coluna de imagem via `ImageAvatarPreview`, coluna de tags
  via `TagBadge`, ações via `IconButton`+`Tooltip`, ação "Visualizar" com ícone
  `FiEye`), `CreatureCreateForm` (schema único sem variante de edição,
  `useGetEntityById` para popular o `reset` em modo edição,
  `usePostEntity`/`usePutEntity` com `invalidateQueryKeys`), `CreatureView` (layout
  de visualização com imagem + coluna de info lateral + tags no topo, seguido de
  seções full-width com `RichTextViewer`).
- Mecanismo de visualização (`.claude/tasks/criaturas-view-modal/task-web.md`):
  estado local `creaturePendingView: ICreatureListItem | null` na própria
  `page.tsx` (**não** reaproveita `useSelectedCreatureStore`, que é dedicada ao
  fluxo criar/editar do `FormModal`, para não acoplar os dois fluxos),
  `handleView(creature)` seta esse estado, e `<ViewModal open={!!creaturePendingView}
  onClose={...} title="Detalhes da Criatura" size="wide"><CreatureView
  creatureId={creaturePendingView.id} /></ViewModal>` é renderizado condicionalmente.
  Este é exatamente o mesmo mecanismo a replicar para Raças (`racePendingView`,
  `RaceView`) — Raças não tem nenhuma relação de auto-referência (diferente de
  Locais/Pontos de Interesse), então **não** há necessidade de reaproveitar o
  mecanismo global `useEntityMentionViewStore`/`EntityMentionViewDispatcher`
  usado em `locais` para navegação aninhada; o padrão local mais simples de
  `criaturas-view-modal` é suficiente e é o que este plano segue.
- Componentes genéricos já existentes e diretamente reaproveitáveis, sem
  necessidade de criação: `ImageAvatarPreview`, `ImagePreviewDialog`,
  `RichTextViewer` (já trata valor vazio/nulo internamente via `isRichTextEmpty`,
  exibindo `emptyLabel` — não é necessário nenhum tratamento manual de "vazio" no
  `RaceView`), `TagBadge`, `FormModal`, `ViewModal`, `ConfirmationModal`,
  `PageContainer`, `Title`/`Label`/`DefaultText`, `PrimaryButton`,
  `FormTextInput`, `FormRichTextInput`, `FormAutocompleteInput`,
  `FormMultiAutocompleteInput`, `DefaultTextInput`, `DefaultAutocompleteInput`,
  hooks `useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
  `useDeleteEntity` de `hooks/Queries`. A interface `ITag` (`shared/interfaces/Entities/Tag`,
  `{ id, name, color }`) já existe e é reaproveitada diretamente (o contrato de API
  já veio como `tags: ITag[]`, mesma decisão já tomada para `ILocationListItem` —
  diferente de `ICreatureTag`, que foi duplicada por decisão anterior já registrada
  noutro plano; aqui não há motivo para duplicar).
- **Não existe** hoje nenhum componente reaproveitável para: seção de filtros de
  Raças (`RacesFilterSection`), tabela de listagem de Raças (`RacesList`/
  `RacesListItem`) e tela de visualização de Raça (`RaceView`) — precisam ser
  criados, cada um específico da feature (`app/(authorized)/racas/components/`),
  espelhando exatamente os equivalentes de `criaturas`.
- Hook de categorias: `useCreatureCategoriesQuery`
  (`app-web/src/hooks/Queries/EntityQueries/useCreatureCategoriesQuery/index.ts`)
  é o padrão já usado para uma lista fixa de categorias não paginada — precisa de
  um equivalente `useRaceCategoriesQuery` contra `GET /races/categories`.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx;
app-web/src/app/(authorized)/racas/components/RacesList/index.tsx;
app-web/src/app/(authorized)/racas/components/RacesListItem/index.tsx;
app-web/src/app/(authorized)/racas/components/RaceView/index.tsx;
app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx
Arquivos: app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/index.tsx;
app-web/src/shared/interfaces/Entities/Race/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/hooks/Queries/EntityQueries/useRaceCategoriesQuery/index.ts;
app-web/src/hooks/Queries/EntityQueries/index.ts;
app-web/src/store/PageStore/RacesStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/RaceFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/racas/page.tsx.
Nenhuma pendência — implementado exatamente conforme especificado neste plano,
espelhando `criaturas` (estrutura) e reaproveitando integralmente os componentes
genéricos e hooks já existentes listados na seção Contexto, sem necessidade de
nenhuma extensão a componente genérico.
Dependências: nenhuma

#### Componentes (necessário — nada equivalente existe hoje para Raças)

- Componente: `RacesFilterSection` (novo, específico da feature —
  `app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx`,
  espelhando exatamente `CreaturesFilterSection`, seguindo o padrão
  `web-secao-filtros` — inputs de filtro nunca inline em `page.tsx`).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `categoryValue: IRaceCategory | null`; `onCategoryChange: (value:
    IRaceCategory | null) => void`; `categories: IRaceCategory[]`; `onSubmit:
    (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` com `DefaultTextInput` "Nome" (busca parcial,
    ícone `FiSearch`) e `DefaultAutocompleteInput<IRaceCategory>` "Categoria"
    (seleção exata, `options={categories}`, `getOptionLabel={(category) =>
    category.name}`, populado pelas opções de `GET /races/categories`), e um
    `PrimaryButton` "Filtrar", mesmo layout (`flex flex-wrap items-end gap-3`) de
    `CreaturesFilterSection`.

- Componentes: `RacesList` + `RacesListItem` (novos, específicos da feature —
  `app-web/src/app/(authorized)/racas/components/RacesList/index.tsx` e
  `.../RacesListItem/index.tsx`, espelhando exatamente `CreaturesList`/
  `CreaturesListItem`).
  - `RacesListProps`: `races: IRaceListItem[]`; `total: number`; `page: number`;
    `isLoading: boolean`; `onPageChange: (newPage: number) => void`; `onView:
    (race: IRaceListItem) => void`; `onEdit: (race: IRaceListItem) => void`;
    `onDelete: (race: IRaceListItem) => void`.
  - Comportamento esperado (`RacesList`): `Table` com colunas "Imagem", "Nome",
    "Categoria", "Tags", "Ações" (`colSpan` do estado vazio = 5, texto "Nenhuma
    raça encontrada."), `TablePagination` com `APP_DEFAULT_PAGE_SIZE`, mesmo
    padrão visual (`APP_COLORS.gold` nas bordas) de `CreaturesList`.
  - `RacesListItemProps`: `race: IRaceListItem`; `onView`; `onEdit`; `onDelete`
    (mesmas assinaturas acima).
  - Comportamento esperado (`RacesListItem`): célula "Imagem" via
    `ImageAvatarPreview imageUrl={race.referenceImageUrl} alt={race.name}`,
    "Nome" (`race.name`), "Categoria" (`race.category.name`), "Tags"
    (`race.tags.map((tag) => <TagBadge key={tag.id} name={tag.name}
    color={tag.color} />)`), e "Ações" com três `IconButton`+`Tooltip` — "Visualizar"
    (`FiEye`, chama `onView(race)`), "Editar" (`FiEdit2`, chama `onEdit(race)`),
    "Excluir" (`FiTrash2`, chama `onDelete(race)`) — mesmo padrão visual
    (`sx={{ color: APP_COLORS.textBrownDark }}`, `aria-label` pt-BR) de
    `CreaturesListItem`.

- Componente: `RaceView` (novo, específico da feature —
  `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`, passado
  como `children` do `ViewModal` genérico; espelha `CreatureView`, mas com bem
  menos seções, já que Raça tem poucos campos).
  - Props: `raceId: string`.
  - Comportamento esperado:
    - Busca os dados completos via `useGetEntityById<IRace>({ url:
      \`/races/${raceId}\` })`.
    - Estado de carregamento: `CircularProgress` + `DefaultText` ("Carregando
      dados da raça...", mesmo padrão de `CreatureView`).
    - Estado de erro: `showToast` com `error.response?.data?.message ?? 'Não foi
      possível carregar os dados da raça.'` (mesmo padrão de `CreatureView`; não
      é necessário tratamento de `onNotFound`/404 específico, já que — diferente
      de Locais — Raça não é aberta por nenhum mecanismo de navegação aninhada
      global nesta feature).
    - Layout do conteúdo, uma vez carregado, mesmo esqueleto visual de
      `CreatureView`:
      - Bloco superior lado a lado: à esquerda, a imagem de `referenceImageUrl`
        num quadro sem borda (ou com a mesma borda `APP_COLORS.gold` já usada em
        `CreatureView`), tamanho fixo (ex. 300x300 ou 400x400, mesmo padrão),
        clicável para abrir `ImagePreviewDialog` quando presente, com fallback
        `FiImage` quando ausente; à direita, o nome da raça (`Title`) e, logo
        abaixo, um único bloco de informação lateral no padrão
        `APP_CONTAINER_STYLES.detailInfoField` para "Categoria"
        (`race.category.name`, ícone `FiTag`), seguido dos `tags` (chips
        coloridos, `getContrastTextColor`, mesmo padrão de `CreatureView`) quando
        houver.
      - Abaixo do bloco superior, duas seções full-width (mesmo padrão de
        `CreatureSectionBox`/`APP_CONTAINER_STYLES.detailSectionBox` +
        `detailSectionBoxHeader` + ícone + `RichTextViewer`, que já lida
        internamente com valor vazio/nulo exibindo "Não informado"): "Características
        Físicas" (`physicalCharacteristics`, ícone ex. `FiUser`) e "Descrição"
        (`description`, ícone ex. `FiFileText`).

Estes três componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Rotas/constantes: adicionar `races: '/racas'` em `MENU_ROUTES` e em
  `APP_ROUTES.private` (`app-web/src/shared/routes.ts`), mesmo padrão de
  `creatures`/`locations`/`tags`.

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/index.tsx`):
  adicionar um novo item "Raças" na seção `title: 'Mundo'` já existente, logo
  após "Locais" (que vem logo após "Criaturas"), apontando para
  `APP_ROUTES.private.races`, com ícone `FiLayers` (`react-icons/fi` — nenhum dos
  ícones já usados em outros itens do menu — `FiHome`, `FiFeather`, `FiMapPin`,
  `FiUsers`, `FiTag` — se aplica ao tema "raças/classificação de seres", `FiLayers`
  transmite a ideia de categorização/classificação), mesmo padrão de `NavItem` já
  usado para Criaturas/Locais.

- Interfaces (`app-web/src/shared/interfaces/Entities/Race/index.ts`, exportado
  em `Entities/index.ts`), com propriedades em inglês batendo com o JSON do
  backend (contrato fechado na seção Contexto), reaproveitando `ITag` já
  existente (`shared/interfaces/Entities/Tag`) em vez de duplicá-la:
  - `IRaceCategory`: `{ id: string; name: string }`.
  - `IRaceListItem`: `{ id: string; referenceImageUrl?: string | null; name:
    string; category: IRaceCategory; tags: ITag[] }`.
  - `IRace` (estende `IEntity`): `{ name: string; category: IRaceCategory;
    referenceImageUrl?: string | null; physicalCharacteristics?: string | null;
    description?: string | null; tags: ITag[]; createdAt: string; updatedAt:
    string }` — `IEntity` só provê `id`, então `createdAt`/`updatedAt` são
    declarados explicitamente (mesmo padrão de `IUser`/`ILocation`).
  - `IRaceListFilters`: `{ name?: string; categoryId?: string; page?: number;
    perPage?: number }`.

- Hook de categorias (novo, em
  `app-web/src/hooks/Queries/EntityQueries/useRaceCategoriesQuery/index.ts`,
  exportado em `hooks/Queries/EntityQueries/index.ts`): `useRaceCategoriesQuery`,
  espelhando exatamente `useCreatureCategoriesQuery` — `useQuery<IRaceCategory[],
  AxiosError<IAxioDataError>>` com `queryKey: ['/races/categories']`, `queryFn`
  via `ApiFactory(getAuthToken())` contra `GET /races/categories`, `staleTime: 5 *
  60 * 1000`. Usado para popular as opções do `DefaultAutocompleteInput` (filtro)
  e do `FormAutocompleteInput` (campo Categoria do formulário).

- Store de feature (`app-web/src/store/PageStore/RacesStore/index.ts`, exportado
  em `store/index.ts`): `useSelectedRaceStore`, seguindo exatamente o padrão de
  `useSelectedCreatureStore` — `selectedRace: IRaceListItem | null`,
  `setSelectedRace`, `resetSelectedRace`. Usado apenas para controlar o modo
  criar/editar do `FormModal` (não para a visualização — ver estado local
  `racePendingView` abaixo, mesma separação de responsabilidades já adotada em
  Criaturas/Locais).

- Schema de formulário (`app-web/src/shared/formSchemas/RaceFormSchema/index.ts`,
  exportado em `shared/formSchemas/index.ts`): `raceFormSchema` (zod),
  `RaceFormData`, `raceFormResolver`, `raceFormDefaultValues`, cobrindo os campos
  e regras fixados na seção "Formulário/validação" abaixo. Diferente de
  `CreatureFormSchema.physicalCharacteristics` (obrigatório, com `refine` via
  `isRichTextEmpty`), aqui `physicalCharacteristics` **não** é obrigatório — é
  `z.string()` simples, sem `refine`, mesmo tratamento já dado a campos de rich
  text opcionais em `CreatureFormSchema` (ex. `habitat`) e em
  `LocationFormSchema.description`. Não há variante de edição (schema único para
  criar/editar), mesma decisão já tomada em Criaturas/Locais.

- Página de listagem (`app-web/src/app/(authorized)/racas/page.tsx`), seguindo a
  estrutura de `CreaturesPage`:
  - `PageContainer` com `Title` "Raças" e `PrimaryButton` "Novo" abrindo o
    `FormModal` em modo de criação (`resetSelectedRace` antes de abrir).
  - Filtros via `RacesFilterSection` (`nameValue`/`categoryValue` em estado
    local, opções de categoria via `useRaceCategoriesQuery`, aplicados a
    `filters` do `useGetEntityList` — `name` (trim, `|| undefined`) e
    `categoryId` (`categoryValue?.id`) — ao submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<IRaceListItem, IRaceListFilters>` contra `GET
    /races`, com paginação (`APP_DEFAULT_PAGE_SIZE`). Ordenação é
    responsabilidade do backend (nenhum parâmetro de ordenação enviado pelo
    frontend).
  - `RacesList` recebendo `races={data?.data ?? []}`, `total={data?.total ?? 0}`,
    `page={filters.page ?? 1}`, `isLoading`, `onPageChange`, `onView`, `onEdit`,
    `onDelete`.
  - Visualização: estado local `racePendingView: IRaceListItem | null` (mesmo
    padrão de `creaturePendingView` em `criaturas-view-modal` — **não**
    reaproveitar `useSelectedRaceStore`, que é dedicada ao fluxo criar/editar).
    `handleView(race)` seta esse estado; renderizar `<ViewModal
    open={!!racePendingView} onClose={() => setRacePendingView(null)}
    title="Detalhes da Raça" size="wide">{racePendingView && <RaceView
    raceId={racePendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selectedRace` na store com o item da listagem e abre o
    `FormModal` (`title={selectedRace ? 'Editar raça' : 'Nova raça'}`,
    `size="wide"`); o formulário busca o detalhe completo via
    `useGetEntityById<IRace>` usando `selectedRace.id`.
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja excluir a
    raça "{name}"?`, usando `useDeleteEntity` contra `DELETE /races/:id`,
    invalidando a query de listagem (`['/races']`) e exibindo toast de
    sucesso/erro (mesmo padrão de Criaturas).

- Formulário
  (`app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`,
  espelhando `CreatureCreateForm`):
  - Busca as opções de categoria via `useRaceCategoriesQuery()` e as opções de
    tag via `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: {
    perPage: 100 } })`, mesmo padrão (e mesma ressalva já conhecida sobre
    paginação) já usado em `CreatureCreateForm`.
  - Em modo edição, popular o formulário (`reset`) a partir do resultado de
    `useGetEntityById<IRace>({ url: \`/races/${selectedRace?.id}\`, enabled:
    isEditMode })` quando os dados chegarem (`name`, `categoryId:
    raceDetail.category.id`, `referenceImageUrl: raceDetail.referenceImageUrl ??
    ''`, `physicalCharacteristics: raceDetail.physicalCharacteristics ?? ''`,
    `description: raceDetail.description ?? ''`, `tagIds:
    raceDetail.tags?.map((tag) => tag.id) ?? []`). Mesmo tratamento de loading
    (`CircularProgress` + texto "Carregando dados da raça...") e erro
    (`showToast`, `error.response?.data?.message ?? 'Não foi possível carregar os
    dados da raça.'`) já usado em `CreatureCreateForm`.
  - `buildPayload(data: RaceFormData): RacePayload` (interface `RacePayload
    extends Omit<RaceFormData, 'referenceImageUrl'> { referenceImageUrl?: string
    }`) — retorna `{ ...data, referenceImageUrl: data.referenceImageUrl ||
    undefined, tagIds: data.tagIds ?? [] }`, mesmo padrão de tratamento de
    `referenceImageUrl`/`tagIds` já usado em `CreatureCreateForm`.
  - Submissão: `usePostEntity<IRace, RacePayload>` (`POST /races`) em modo
    criação e `usePutEntity<IRace, RacePayload>` (`PUT /races/:id`) em modo
    edição, com `invalidateQueryKeys: [['/races']]`, toasts de sucesso/erro em
    pt-BR ("Raça cadastrada com sucesso." / "Raça atualizada com sucesso." /
    erro exibindo `error.response?.data?.message` quando disponível — cobre o
    cenário de nome duplicado retornado como 409 pela API, se a task-api
    implementar essa regra), mesmo padrão de Criaturas.
  - Layout dos campos (`FormModal` `size="wide"`): grid `sm:grid-cols-2
    lg:grid-cols-4` com "Nome" (`FormTextInput`), "Categoria"
    (`FormAutocompleteInput<RaceFormData, IRaceCategory>`, `options={categories
    ?? []}`, `getOptionLabel={(category) => category.name}`,
    `getOptionValue={(category) => category.id}`), "Imagem Referência"
    (`FormTextInput`) e "Tags" (`FormMultiAutocompleteInput<RaceFormData, ITag>`,
    `options={tagOptions}`, `getOptionLabel={(tag) => tag.name}`,
    `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`) —
    mesmo grid de `CreatureCreateForm`. Abaixo, em largura total (grid
    `lg:grid-cols-2` ou empilhado, a critério do `web-dev`), "Características
    Físicas" e "Descrição" (ambos `FormRichTextInput`).

- Integrações com API consumidas por esta feature:
  - `GET /races` — listagem paginada, filtros `name` (parcial) e `categoryId`
    (exato).
  - `GET /races/:id` — detalhe completo (`IRace`), usado em modo edição
    (`RaceCreateForm`) e na visualização (`RaceView`).
  - `POST /races` — criação.
  - `PUT /races/:id` — atualização.
  - `DELETE /races/:id` — exclusão.
  - `GET /races/categories` — retorna `IRaceCategory[]`, usado para popular o
    filtro de Categoria e o campo Categoria do formulário.
  - `GET /tags` — já existente, reaproveitado para popular as opções de
    `FormMultiAutocompleteInput` (campo Tags), sem novo hook.

- Formulário/validação — lista canônica de campos do schema `raceFormSchema`
  (propriedade → label pt-BR → input → obrigatoriedade):
  - `name` → "Nome" → `FormTextInput` → obrigatório, texto não vazio
    (`z.string().min(1, 'Informe o nome')`).
  - `categoryId` → "Categoria" → `FormAutocompleteInput` → obrigatório,
    selecionado a partir das opções de `useRaceCategoriesQuery`
    (`z.string().min(1, 'Selecione a categoria')`).
  - `referenceImageUrl` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL válida via `refine` (mesmo padrão de
    `CreatureFormSchema.referenceImageUrl` — `z.string().refine((value) => value
    === '' || z.string().url().safeParse(value).success, 'Informe uma URL de
    imagem válida')` — **não** usar `z.union([z.literal(''), ...])`, devido ao
    bug já conhecido/documentado de a mensagem pt-BR não ser exibida nesse
    padrão).
  - `physicalCharacteristics` → "Características Físicas" → `FormRichTextInput`
    → opcional (`z.string()`, sem `refine` de não-vazio — diferente de
    `CreatureFormSchema.physicalCharacteristics`, aqui não há requisito de
    obrigatoriedade).
  - `description` → "Descrição" → `FormRichTextInput` → opcional (`z.string()`,
    mesmo tratamento de `LocationFormSchema.description`).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`), array de zero ou mais ids de tag
    existentes, opções via `GET /tags`.

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

Revisão completa dos arquivos da etapa "1. web-dev" (componentes
`RacesFilterSection`, `RacesList`/`RacesListItem`, `RaceView`,
`RaceCreateForm`; página `racas/page.tsx`; interfaces `IRace`/
`IRaceListItem`/`IRaceCategory`/`IRaceListFilters`; hook
`useRaceCategoriesQuery`; store `useSelectedRaceStore`; schema
`raceFormSchema`; rotas em `shared/routes.ts` e item de menu em `Sidebar`)
contra o `CLAUDE.md` e o plano fixado neste arquivo.

Nomenclatura de propriedades conferida campo a campo contra os DTOs reais do
backend em `app-api/src/modules/races/dto/`:
- `IRaceCategory` (`id`, `name`) bate exatamente com `RaceCategoryResponseDto`.
- `IRaceListItem` (`id`, `referenceImageUrl?`, `name`, `category`, `tags`)
  bate exatamente com `RaceListItemResponseDto`.
- `IRace` (`id` via `IEntity`, `name`, `category`, `referenceImageUrl?`,
  `physicalCharacteristics?`, `description?`, `tags`, `createdAt`,
  `updatedAt`) bate exatamente com `RaceResponseDto` (`createdAt`/`updatedAt`
  são `Date` no backend, mas serializados como string em JSON — tipagem
  `string` no frontend está correta, mesmo padrão já usado em
  `ICreature`/`ILocation`).
- `IRaceListFilters` (`name?`, `categoryId?`, `page?`, `perPage?`) bate
  exatamente com `FindRacesQueryDto`.
- O payload montado em `RaceCreateForm.buildPayload`
  (`{ name, categoryId, referenceImageUrl?, physicalCharacteristics,
  description, tagIds }`) bate exatamente com `CreateRaceDto`/`UpdateRaceDto`
  (`UpdateRaceDto` é `PartialType(CreateRaceDto)`).
- Rotas do controller confirmadas: `GET /races/categories` está registrada
  antes de `GET /races/:id` em `races.controller.ts` (ordem correta, sem
  conflito de roteamento).

Demais pontos verificados, todos em conformidade:
- `RaceView` reaproveita integralmente `ImagePreviewDialog`, `RichTextViewer`
  (sem tratamento manual de vazio, delegado ao `emptyLabel` interno) e
  `Chip`/`getContrastTextColor` para tags, sem duplicar nenhum componente
  genérico existente. Layout espelha `CreatureView` fielmente, reduzido aos
  poucos campos de Raça (um único `detailInfoField` para Categoria + duas
  `RaceSectionBox` para Características Físicas/Descrição).
- Separação `useSelectedRaceStore` (fluxo criar/editar do `FormModal`) vs.
  estado local `racePendingView` (fluxo somente-leitura do `ViewModal`) está
  corretamente implementada em `racas/page.tsx`, sem acoplamento entre os
  dois fluxos — mesmo padrão de `criaturas-view-modal`.
- Schema zod (`RaceFormSchema/index.ts`): `physicalCharacteristics` é
  `z.string()` simples, sem `refine` de não-vazio (diferente do campo
  homônimo obrigatório em `CreatureFormSchema`, conforme decisão do plano);
  `referenceImageUrl` usa `refine` (`value === '' || z.string().url()...`)
  em vez de `z.union`, garantindo que a mensagem pt-BR "Informe uma URL de
  imagem válida" seja de fato exibida (evita o bug de `union`/`invalid_union`
  já documentado e corrigido em `criaturas`). Não há variante de edição
  (schema único), consistente com o plano.
- `RaceCreateForm` segue o padrão `web-form-cadastro`: renderizado dentro de
  `FormModal`, modo criar/editar derivado de `useSelectedRaceStore`
  (`isEditMode = !!selectedRace`, nunca de uma prop manual), `usePostEntity`/
  `usePutEntity` com `invalidateQueryKeys: [['/races']]` em ambos os casos —
  a listagem recarrega sozinha após criar/editar, sem `refetch()` manual.
  Loading (`CircularProgress` + texto) e erro (`showToast` com
  `error.response?.data?.message` com fallback pt-BR) tratados tanto na
  busca do detalhe (`useGetEntityById`) quanto nas mutations.
- `useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
  `useDeleteEntity` (hooks genéricos de `hooks/Queries`) usados em toda a
  feature — nenhum `useQuery`/`useMutation` bespoke. `useRaceCategoriesQuery`
  espelha exatamente `useCreatureCategoriesQuery` (mesma `staleTime`, mesmo
  padrão de `queryKey`).
- Todos os ícones são de `react-icons/fi` (`FiSearch`, `FiEye`, `FiEdit2`,
  `FiTrash2`, `FiImage`, `FiTag`, `FiUser`, `FiFileText`, `FiLayers` no item
  de menu) — nenhum `@mui/icons-material`, SVG customizado ou emoji. Os três
  `IconButton` de ação em `RacesListItem` têm `aria-label` em pt-BR
  ("Visualizar"/"Editar"/"Excluir") e `Tooltip` correspondente, mesmo padrão
  de `CreaturesListItem`.
- `RacesFilterSection` segue o padrão `web-secao-filtros`: componente
  apresentacional específico da página, recebe valores/setters via props
  (`nameValue`/`onNameChange`/`categoryValue`/`onCategoryChange`/`categories`/
  `onSubmit`), sem estado ou chamada de API própria; nenhum `<form>` de
  filtro inline em `page.tsx`.
- Reaproveitamento: nenhum componente genérico já existente
  (`ImageAvatarPreview`, `TagBadge`, `FormModal`, `ViewModal`,
  `ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`,
  `PrimaryButton`, `FormTextInput`, `FormRichTextInput`,
  `FormAutocompleteInput`, `FormMultiAutocompleteInput`,
  `DefaultTextInput`, `DefaultAutocompleteInput`) foi duplicado; `ITag` foi
  reaproveitada diretamente em vez de criar uma interface própria para tags
  de Raça, conforme decisão registrada no plano.
- Rotas (`shared/routes.ts`) e item de menu (`Sidebar`) adicionados
  exatamente como especificado, na seção "Mundo", logo após "Locais", com
  ícone `FiLayers` não repetido em relação aos demais itens.

Nenhum problema bloqueante, de tipagem, de lógica ou de padrão foi
encontrado. Único ponto menor, não bloqueante: algumas linhas novas (ex.
`app-web/src/app/(authorized)/racas/page.tsx:14` — import de
`IRaceCategory, IRaceListFilters, IRaceListItem`; e
`app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx:26`
— import de `IRace, IRaceCategory, ITag, ITagListFilters`) ultrapassam o
`printWidth: 80` do `.prettierrc.json` e ficaram em uma única linha, onde o
equivalente em `criaturas` (`CreaturesPage`/`CreatureCreateForm`) quebra o
mesmo import em múltiplas linhas. Não é um erro funcional (não afeta
compilação/execução) e não foi tratado como bloqueante nesta revisão, mas
recomenda-se rodar `npm run format` nesses arquivos para manter
consistência de estilo com o restante da feature.

Aprovado. Arquivos revisados:
app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx;
app-web/src/app/(authorized)/racas/components/RacesList/index.tsx;
app-web/src/app/(authorized)/racas/components/RacesListItem/index.tsx;
app-web/src/app/(authorized)/racas/components/RaceView/index.tsx;
app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx;
app-web/src/app/(authorized)/racas/page.tsx;
app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/index.tsx;
app-web/src/shared/interfaces/Entities/Race/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/hooks/Queries/EntityQueries/useRaceCategoriesQuery/index.ts;
app-web/src/hooks/Queries/EntityQueries/index.ts;
app-web/src/store/PageStore/RacesStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/RaceFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts.
