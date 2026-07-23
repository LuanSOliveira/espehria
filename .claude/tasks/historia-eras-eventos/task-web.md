# Task Web: História (Eras e Eventos)

## Contexto

Não há `.claude/tasks/historia-eras-eventos/spec.md` — requisito já esclarecido
diretamente pelo usuário (orquestrador), sem necessidade do agente `spec`. Este
plano foi elaborado com base direta no pedido detalhado recebido.

**Contrato de API fechado** (definido em paralelo pela task-api do mesmo slug,
`.claude/tasks/historia-eras-eventos/task-api.md` — nomes de propriedade em
inglês, batendo com o JSON do backend; se esse arquivo ainda não existir no
momento da implementação, o contrato abaixo é definitivo e não deve ser
reaberto):

- `GET /eras` — paginado, filtro `name` (parcial). Ordenado por `order` ASC
  (responsabilidade do backend). Retorna `{ data: IEraListItem[], total, page,
  perPage }`, cada item com `id`, `referenceImageUrl`, `name`, `order`, `tags`
  (`ITag[]`).
- `GET /eras/all` — todas as eras sem paginação, ordenadas por `order` ASC.
  **Atenção — retorna um shape mais enxuto que `IEraListItem`**: cada item
  tem apenas `{ id, name, order }` (sem `referenceImageUrl`, sem `tags` —
  confirmado em `app-api/src/modules/eras/dto/era-option-response.dto.ts`).
  Usar uma interface dedicada `IEraOption` (não reaproveitar `IEraListItem`
  aqui, para não assumir campos que a API não retorna nesta rota) para
  popular autocompletes (era do evento, filtro de era) e para calcular o
  total de eras usado nas opções do campo `order`.
- `GET /eras/:id` — detalhe completo: `id`, `name`, `referenceImageUrl`,
  `description`, `order`, `tags`, `createdAt`, `updatedAt`.
- `POST /eras` / `PUT /eras/:id` — payload `{ name, order, referenceImageUrl?,
  description?, tagIds? }`.
- `DELETE /eras/:id` — 204.
- `GET /events` — paginado, filtros `name` (parcial), `eraId` (exato),
  `startYear` (texto), `endYear` (texto). Ordenado por `name` ASC
  (responsabilidade do backend). Retorna `{ data: IEventListItem[], total,
  page, perPage }`, cada item com `id`, `referenceImageUrl`, `name`,
  `startYear`, `endYear`, `era` (`IEraSummary | null`), `tags` (`ITag[]`).
  **Atenção — `era` aqui é ainda mais enxuto que `IEraOption`**: o backend
  serializa via `EraSummaryResponseDto`, que só tem `{ id, name }` (sem
  `order`, sem `referenceImageUrl`, sem `tags` — confirmado em
  `app-api/src/modules/eras/dto/era-summary-response.dto.ts`). Usar uma
  terceira interface dedicada `IEraSummary` (`{ id: string; name: string }`)
  só para este campo — não reaproveitar `IEraOption` nem `IEraListItem`
  aqui.
- `GET /events/:id` — detalhe completo: `id`, `name`, `referenceImageUrl`,
  `startYear`, `endYear`, `description`, `era` (`IEraSummary | null`),
  `tags`, `createdAt`, `updatedAt`.
- `POST /events` / `PUT /events/:id` — payload `{ name, eraId?, startYear?,
  endYear?, referenceImageUrl?, description?, tagIds? }`.
- `DELETE /events/:id` — 204.

**Nomenclatura das propriedades:** todas as interfaces, filtros, os schemas
zod e o uso nos componentes usam nomes de propriedade em inglês, batendo com
o JSON acima. Apenas rótulos de UI, placeholders, toasts e mensagens de
validação permanecem em pt-BR.

**Investigação de código existente relevante:**

- Feature `racas` (`app-web/src/app/(authorized)/racas/`) é a referência
  estrutural mais próxima para ambas as páginas: `page.tsx` (filtros +
  `FormModal` + `ViewModal` + `ConfirmationModal`, com estado local
  `*PendingView` e `useSelected*Store` para o modo criar/editar),
  `RacesFilterSection` (padrão `web-secao-filtros`), `RacesList`/
  `RacesListItem` (tabela paginada com `ImageAvatarPreview`, `TagBadge`,
  ações via `IconButton`+`Tooltip`+`FiEye`/`FiEdit2`/`FiTrash2`),
  `RaceCreateForm` (schema único sem variante de edição, `useGetEntityById`
  para popular o `reset` em modo edição, `usePostEntity`/`usePutEntity` com
  `invalidateQueryKeys`), `RaceView` (layout lateral: imagem à esquerda +
  nome/tags/infos à direita, seguido de seções full-width com
  `RichTextViewer`). Eras e Eventos replicam essa mesma estrutura de
  filtro/lista/formulário; **apenas os modais de visualização** (`EraView`/
  `EventView`) usam um layout diferente, especificado pela demanda (nome
  centralizado no topo + imagem full-width, em vez do layout lateral de
  `RaceView`/`CreatureView`).
- Mecanismo de visualização: estado local `*PendingView: I*ListItem | null`
  na própria `page.tsx` (não reaproveita a store `useSelected*Store`, que é
  dedicada ao fluxo criar/editar do `FormModal`), mesmo padrão já usado em
  `criaturas`/`racas`/`locais`. Nem Era nem Evento têm navegação aninhada por
  auto-referência (diferente de Locais/Pontos de Interesse), então **não** há
  necessidade de reaproveitar `useEntityMentionViewStore`/
  `EntityMentionViewDispatcher`.
- Componentes genéricos já existentes e diretamente reaproveitáveis, sem
  necessidade de criação: `ImageAvatarPreview`, `ImagePreviewDialog`,
  `RichTextViewer` (trata valor vazio/nulo internamente via `emptyLabel`),
  `TagBadge`, `FormModal`, `ViewModal`, `ConfirmationModal`, `PageContainer`,
  `Title`/`Label`/`DefaultText`, `PrimaryButton`, `FormTextInput`,
  `FormRichTextInput`, `FormAutocompleteInput`, `FormMultiAutocompleteInput`,
  `DefaultTextInput`, `DefaultAutocompleteInput`, hooks
  `useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
  `useDeleteEntity` de `hooks/Queries`. A interface `ITag`
  (`shared/interfaces/Entities/Tag`, `{ id, name, color }`) já existe e é
  reaproveitada diretamente (contrato já veio como `tags: ITag[]`, mesma
  decisão já tomada para `IRaceListItem`/`ILocationListItem`).
- **Não existe** hoje nenhum componente reaproveitável para Eras ou Eventos —
  todos os componentes de filtro, lista, visualização e formulário de ambas
  as páginas precisam ser criados, cada um específico da sua feature
  (`app/(authorized)/eras/components/` e `app/(authorized)/eventos/components/`).
- `FormAutocompleteInput<TFieldValues, TOption>` e
  `DefaultAutocompleteInput<TOption>` (`shared/components/Inputs`) já
  suportam qualquer tipo de opção (`TOption` genérico), mas
  `getOptionValue`/o valor do campo controlado são sempre `string`
  (`Controller` faz `field.onChange(getOptionValue(newValue))`, sempre
  string). Isso é relevante para o campo `order` de Era (ver seção
  "Formulário/validação" de Eras abaixo): não é necessário estender nenhum
  componente genérico, mas o schema zod precisa tratar `order` como
  `string` (compatível com o contrato do componente) e converter para
  `number` apenas no `buildPayload`, mesmo truque que seria necessário para
  qualquer autocomplete de valor numérico neste projeto.
- **Decisão de reaproveitamento entre `EraView` e `EventView` (skill
  `web-componentes`):** apesar de os dois modais de visualização
  compartilharem uma estrutura visual muito parecida (nome centralizado +
  tags + imagem full-width + quadro de descrição), a decisão é **não**
  extrair um componente genérico compartilhado entre eles. O precedente já
  estabelecido no projeto é `CreatureView` e `RaceView` — que também são
  estruturalmente quase idênticos (imagem + coluna de info + seções
  full-width) — e mesmo assim cada um implementa seu próprio layout local,
  sem nenhuma extração de componente de "view" compartilhado em
  `shared/components/`. Seguindo esse mesmo precedente, `EraView` e
  `EventView` serão implementados como componentes de página
  independentes (cada um em `app/(authorized)/<feature>/components/`), cada
  um com seu próprio helper local de seção (mesmo padrão de `RaceSectionBox`
  definido dentro do próprio `RaceView/index.tsx`, não compartilhado). Isso
  mantém cada view simples de evoluir isoladamente (ex.: `EventView` tem uma
  linha extra de Era/Datas que `EraView` não tem) sem acoplar as duas
  features a um componente genérico novo em `shared/components/`, que não é
  o padrão hoje usado para conteúdo de modais de visualização (só é usado
  para primitivas verdadeiramente genéricas — Botões, Inputs, Modais,
  Containers, Textos).
- **Regra de opções do campo `order` (corrigida — depende do modo do
  formulário):** o exemplo do requisito original ("não existe nenhuma era
  criada então deve aparecer a opção com o valor '1'; caso tenha uma
  entidade já criada então aparecem as opções '1' e '2'") descreve o modo de
  **criação**: `N = totalErasCount + 1`, onde `totalErasCount =
  useErasAllQuery().data?.length ?? 0`. Em modo **edição**, a era sendo
  editada já está contada dentro de `totalErasCount` (ela já existe em
  `GET /eras/all`), então **não** soma +1: `N = totalErasCount`. Resumindo:
  `orderOptionsCount = isEditMode ? totalErasCount : totalErasCount + 1`, e
  as opções são `Array.from({ length: orderOptionsCount }, (_, index) =>
  index + 1)`. Isso garante que o cadastro da primeira era do sistema
  (`totalErasCount === 0`, modo criação) ofereça a opção "1", e que a edição
  de uma era existente entre outras 4 (`totalErasCount === 5`) ofereça as
  opções "1" a "5", batendo com o exemplo de cascata do requisito original.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx;
app-web/src/app/(authorized)/eras/components/ErasList/index.tsx;
app-web/src/app/(authorized)/eras/components/ErasListItem/index.tsx;
app-web/src/app/(authorized)/eras/components/EraView/index.tsx;
app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsFilterSection/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsList/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsListItem/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventView/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx
Arquivos: app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/data/index.ts;
app-web/src/shared/interfaces/Entities/Era/index.ts;
app-web/src/shared/interfaces/Entities/Event/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/hooks/Queries/EntityQueries/useErasAllQuery/index.ts;
app-web/src/hooks/Queries/EntityQueries/index.ts;
app-web/src/store/PageStore/ErasStore/index.ts;
app-web/src/store/PageStore/EventsStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/EraFormSchema/index.ts;
app-web/src/shared/formSchemas/EventFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/eras/page.tsx;
app-web/src/app/(authorized)/eventos/page.tsx.
Implementado exatamente conforme especificado neste plano, espelhando `racas`
(estrutura) e reaproveitando integralmente os componentes genéricos e hooks já
existentes listados na seção Contexto. As três interfaces de era (`IEraOption`,
`IEraSummary`, `IEraListItem`) foram usadas cada uma apenas no ponto de contrato
correto (`GET /eras/all`, campo `era` embutido em Evento, `GET /eras` paginado,
respectivamente), sem reaproveitamento cruzado. A regra de `orderOptionsCount`
(`totalErasCount + 1` em criação, `totalErasCount` em edição) foi implementada em
`EraCreateForm` exatamente como corrigido na seção Contexto.
Pendência: não foi possível rodar `npm run lint`/`npm run build` nesta sessão do
agente `web-dev` (toolset restrito a Read/Grep/Glob/Edit/Write/Skill, sem acesso a
shell) — cada arquivo novo/alterado foi conferido manualmente campo a campo contra
as assinaturas reais dos componentes/hooks genéricos consumidos (`FormAutocompleteInput`,
`FormMultiAutocompleteInput`, `FormTextInput`, `FormRichTextInput`,
`DefaultAutocompleteInput`, `DefaultTextInput`, `useGetEntityList`/`useGetEntityById`/
`usePostEntity`/`usePutEntity`/`useDeleteEntity`, `ImageAvatarPreview`,
`ImagePreviewDialog`, `RichTextViewer`, `TagBadge`, `ViewModal`/`FormModal`/
`ConfirmationModal`), mas recomenda-se que a etapa seguinte
(`web-dev-codereviewer`) rode `npm run lint` e `npm run build` dentro de `app-web`
antes de aprovar.
Dependências: nenhuma

#### Componentes (necessário — nada equivalente existe hoje para Eras/Eventos)

- Componente: `ErasFilterSection` (novo —
  `app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx`,
  seguindo o padrão `web-secao-filtros`, espelhando `TagsFilterSection` — que
  também só tem filtro de nome).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` com um único `DefaultTextInput` "Nome"
    (busca parcial, ícone `FiSearch`) e um `PrimaryButton` "Filtrar", mesmo
    layout (`flex items-end gap-3`) de `TagsFilterSection`.

- Componentes: `ErasList` + `ErasListItem` (novos —
  `app-web/src/app/(authorized)/eras/components/ErasList/index.tsx` e
  `.../ErasListItem/index.tsx`, espelhando `RacesList`/`RacesListItem`).
  - `ErasListProps`: `eras: IEraListItem[]`; `total: number`; `page: number`;
    `isLoading: boolean`; `onPageChange: (newPage: number) => void`; `onView:
    (era: IEraListItem) => void`; `onEdit: (era: IEraListItem) => void`;
    `onDelete: (era: IEraListItem) => void`.
  - Comportamento esperado (`ErasList`): `Table` com colunas "Ordem",
    "Imagem", "Nome", "Tags", "Ações" (`colSpan` do estado vazio = 5, texto
    "Nenhuma era encontrada."), `TablePagination` com
    `APP_DEFAULT_PAGE_SIZE`, mesmo padrão visual (`APP_COLORS.gold` nas
    bordas) de `RacesList`. A ordenação da lista é responsabilidade do
    backend (`GET /eras` já retorna ordenado por `order` ASC) — a coluna
    "Ordem" é apenas exibida (`era.order`), o frontend não reordena nada.
  - `ErasListItemProps`: `era: IEraListItem`; `onView`; `onEdit`; `onDelete`
    (mesmas assinaturas acima).
  - Comportamento esperado (`ErasListItem`): célula "Ordem" (`era.order`),
    "Imagem" via `ImageAvatarPreview imageUrl={era.referenceImageUrl}
    alt={era.name}`, "Nome" (`era.name`), "Tags" (`era.tags.map((tag) =>
    <TagBadge key={tag.id} name={tag.name} color={tag.color} />)`), e
    "Ações" com três `IconButton`+`Tooltip` — "Visualizar" (`FiEye`, chama
    `onView(era)`), "Editar" (`FiEdit2`, chama `onEdit(era)`), "Excluir"
    (`FiTrash2`, chama `onDelete(era)`) — mesmo padrão visual
    (`sx={{ color: APP_COLORS.textBrownDark }}`, `aria-label` pt-BR) de
    `RacesListItem`.

- Componente: `EraView` (novo —
  `app-web/src/app/(authorized)/eras/components/EraView/index.tsx`, passado
  como `children` do `ViewModal` genérico; layout ESPECÍFICO da demanda,
  diferente do padrão lateral de `RaceView`/`CreatureView` — ver decisão de
  não compartilhar layout com `EventView` na seção Contexto).
  - Props: `eraId: string`.
  - Comportamento esperado:
    - Busca os dados completos via `useGetEntityById<IEra>({ url:
      \`/eras/${eraId}\` })`.
    - Estado de carregamento: `CircularProgress` + `DefaultText`
      ("Carregando dados da era...", mesmo padrão de `RaceView`).
    - Estado de erro: `showToast` com `error.response?.data?.message ?? 'Não
      foi possível carregar os dados da era.'` (mesmo padrão de `RaceView`).
    - Layout do conteúdo, uma vez carregado (`flex flex-col gap-6`,
      diferente do esqueleto lado a lado de `RaceView`):
      - Bloco superior centralizado: `Title` com `era.name`, centralizado
        (manter o `textAlign` padrão de `Title`, que já é centralizado por
        `APP_TEXT_STYLES.title` — **não** aplicar o override
        `textAlign: 'left'` usado em `RaceView`; manter/ajustar apenas cor
        para texto simples como em `RaceView`, sem o gradiente dourado de
        título de página), seguido, logo abaixo, de uma linha centralizada
        (`flex flex-wrap justify-center gap-2`) com os `tags` (chips
        coloridos, `getContrastTextColor`, mesmo padrão de `RaceView`)
        quando houver (`era.tags.length > 0`).
      - Abaixo, a imagem de `referenceImageUrl` ocupando toda a largura do
        modal (`Box component="img"` com `width: '100%'`, altura fixa
        proporcional, ex. `height: 360`, `objectFit: 'cover'`, borda
        `APP_COLORS.gold`, `borderRadius: '6px'`), clicável para abrir
        `ImagePreviewDialog` quando presente, com fallback `FiImage`
        centralizado num bloco full-width do mesmo tamanho quando ausente
        — **não** usar o quadro pequeno lateral (300x300/400x400) de
        `RaceView`.
      - Abaixo da imagem, uma única seção full-width no padrão
        `APP_CONTAINER_STYLES.detailSectionBox` +
        `detailSectionBoxHeader` + ícone (ex. `FiFileText`) + `RichTextViewer`
        para "Descrição" (`era.description`), mesmo helper local (`EraSectionBox`,
        definido dentro do próprio arquivo, não compartilhado) do padrão já
        usado em `RaceSectionBox`.
      - `era.order` **não** deve aparecer em nenhum lugar deste modal.

- Componente: `EraCreateForm` (novo —
  `app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx`,
  dentro de `FormModal`, seguindo `web-form-cadastro`, espelhando
  `RaceCreateForm`).
  - Props: `onSaved: () => void`.
  - Comportamento esperado:
    - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>({
      url: '/tags', filters: { perPage: 100 } })`, mesmo padrão de
      `RaceCreateForm`.
    - Busca todas as eras via `useErasAllQuery()` (novo hook, ver seção
      Funcionalidade) para calcular `totalErasCount = erasAll?.length ?? 0`
      e montar as opções do campo "Ordenação": `orderOptionsCount =
      isEditMode ? totalErasCount : totalErasCount + 1` (soma +1 apenas em
      modo criação, já que a era sendo editada já está contada em
      `totalErasCount` — ver seção Contexto), `Array.from({ length:
      orderOptionsCount }, (_, index) => index + 1)`.
    - Em modo edição, popula o formulário (`reset`) a partir do resultado de
      `useGetEntityById<IEra>({ url: \`/eras/${selectedEra?.id}\`, enabled:
      isEditMode })`: `name`, `referenceImageUrl: eraDetail.referenceImageUrl
      ?? ''`, `description: eraDetail.description ?? ''`, `tagIds:
      eraDetail.tags?.map((tag) => tag.id) ?? []`, `order:
      String(eraDetail.order)`. Mesmo tratamento de loading
      (`CircularProgress` + texto "Carregando dados da era...") e erro
      (`showToast`) já usado em `RaceCreateForm`.
    - `buildPayload(data: EraFormData): EraPayload` (interface `EraPayload
      extends Omit<EraFormData, 'referenceImageUrl' | 'order'> {
      referenceImageUrl?: string; order: number }`) — retorna `{ ...data,
      referenceImageUrl: data.referenceImageUrl || undefined, tagIds:
      data.tagIds ?? [], order: Number(data.order) }`.
    - Submissão: `usePostEntity<IEra, EraPayload>` (`POST /eras`) em modo
      criação e `usePutEntity<IEra, EraPayload>` (`PUT /eras/:id`) em modo
      edição, com `invalidateQueryKeys: [['/eras'], ['/eras/all']]`
      (invalida tanto a listagem paginada quanto a lista completa usada nos
      autocompletes de Era em Eventos e no próprio cálculo de `order`),
      toasts "Era cadastrada com sucesso." / "Era atualizada com sucesso." /
      erro exibindo `error.response?.data?.message` quando disponível, mesmo
      padrão de `RaceCreateForm`.
    - Layout dos campos (`FormModal` `size="wide"`): grid `sm:grid-cols-2
      lg:grid-cols-4` com "Nome" (`FormTextInput`), "Imagem Referência"
      (`FormTextInput`), "Ordenação" (`FormAutocompleteInput<EraFormData,
      number>`, `options={orderOptions}`, `getOptionLabel={(order) =>
      String(order)}`, `getOptionValue={(order) => String(order)}`) e "Tags"
      (`FormMultiAutocompleteInput<EraFormData, ITag>`) — mesmo grid de
      `RaceCreateForm`. Abaixo, em largura total, "Descrição"
      (`FormRichTextInput`).

- Componente: `EventsFilterSection` (novo —
  `app-web/src/app/(authorized)/eventos/components/EventsFilterSection/index.tsx`,
  seguindo o padrão `web-secao-filtros`).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `startYearValue: string`; `onStartYearChange: (value: string) => void`;
    `endYearValue: string`; `onEndYearChange: (value: string) => void`;
    `eraValue: IEraOption | null`; `onEraChange: (value: IEraOption |
    null) => void`; `eras: IEraOption[]`; `onSubmit: (event:
    SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` (`flex flex-wrap items-end gap-3`, sem o
    `max-w` estreito usado em `RacesFilterSection`/`LocationsFilterSection`,
    já que são 4 campos de filtro em vez de 2) com `DefaultTextInput` "Nome"
    (ícone `FiSearch`), `DefaultTextInput` "Ano Início", `DefaultTextInput`
    "Ano Fim" e `DefaultAutocompleteInput<IEraOption>` "Era"
    (`options={eras}`, `getOptionLabel={(era) => era.name}`, seleção exata,
    populado por `GET /eras/all` via `useErasAllQuery`), e um `PrimaryButton`
    "Filtrar".

- Componentes: `EventsList` + `EventsListItem` (novos —
  `app-web/src/app/(authorized)/eventos/components/EventsList/index.tsx` e
  `.../EventsListItem/index.tsx`).
  - `EventsListProps`: `events: IEventListItem[]`; `total: number`; `page:
    number`; `isLoading: boolean`; `onPageChange`; `onView: (event:
    IEventListItem) => void`; `onEdit`; `onDelete` (mesmas assinaturas de
    `ErasList`, trocando `era` por `event`).
  - Comportamento esperado (`EventsList`): `Table` com colunas "Imagem",
    "Nome", "Era", "Ano Início", "Ano Fim", "Tags", "Ações" (`colSpan` do
    estado vazio = 7, texto "Nenhum evento encontrado."), `TablePagination`
    com `APP_DEFAULT_PAGE_SIZE`, mesmo padrão visual de `RacesList`.
  - `EventsListItemProps`: `event: IEventListItem`; `onView`; `onEdit`;
    `onDelete`.
  - Comportamento esperado (`EventsListItem`): célula "Imagem" via
    `ImageAvatarPreview`, "Nome" (`event.name`), "Era" (`event.era?.name ??
    'Não informado'`, já que `era` pode ser `null`), "Ano Início"
    (`event.startYear ?? '—'`), "Ano Fim" (`event.endYear ?? '—'`), "Tags"
    (mesmo padrão `TagBadge`), e "Ações" com os três `IconButton`+`Tooltip`
    (`FiEye`/`FiEdit2`/`FiTrash2`) de `onView`/`onEdit`/`onDelete`, mesmo
    padrão visual de `RacesListItem`.

- Componente: `EventView` (novo —
  `app-web/src/app/(authorized)/eventos/components/EventView/index.tsx`,
  layout ESPECÍFICO da demanda — ver decisão de não compartilhar layout com
  `EraView` na seção Contexto).
  - Props: `eventId: string`.
  - Comportamento esperado:
    - Busca os dados completos via `useGetEntityById<IEvent>({ url:
      \`/events/${eventId}\` })`, mesmo tratamento de loading/erro de
      `EraView` (textos "Carregando dados do evento..."/"Não foi possível
      carregar os dados do evento.").
    - Layout do conteúdo, uma vez carregado:
      - Bloco superior centralizado: `Title` com `event.name`, seguido da
        linha centralizada de `tags` (mesmo padrão de `EraView`).
      - Uma linha (`flex flex-col gap-4 sm:flex-row` ou `grid sm:grid-cols-2`)
        com dois blocos lado a lado (não empilhados): à esquerda, um
        `detailInfoField` "Era" (ícone ex. `FiClock`, valor `event.era?.name
        ?? 'Não informado'`); à direita, um segundo bloco (pode ser um único
        `detailInfoField` com "Data Início" e "Data Fim" lado a lado
        internamente, ou dois `detailInfoField` menores um ao lado do outro,
        a critério do `web-dev`) mostrando `event.startYear ?? 'Não
        informado'` e `event.endYear ?? 'Não informado'`.
      - Abaixo, a imagem de `referenceImageUrl` ocupando toda a largura do
        modal, mesmo tratamento (full-width, fallback `FiImage`,
        `ImagePreviewDialog`) especificado para `EraView`.
      - Abaixo da imagem, uma seção full-width (`EventSectionBox`, helper
        local não compartilhado, mesmo padrão de `EraSectionBox`) com
        "Descrição" (`event.description`).

- Componente: `EventCreateForm` (novo —
  `app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx`).
  - Props: `onSaved: () => void`.
  - Comportamento esperado:
    - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>`
      (mesmo padrão de `EraCreateForm`) e as opções de era via
      `useErasAllQuery()`.
    - Em modo edição, popula o formulário (`reset`) a partir de
      `useGetEntityById<IEvent>({ url: \`/events/${selectedEvent?.id}\`,
      enabled: isEditMode })`: `name`, `referenceImageUrl:
      eventDetail.referenceImageUrl ?? ''`, `startYear:
      eventDetail.startYear ?? ''`, `endYear: eventDetail.endYear ?? ''`,
      `description: eventDetail.description ?? ''`, `tagIds:
      eventDetail.tags?.map((tag) => tag.id) ?? []`, `eraId:
      eventDetail.era?.id ?? ''`. Mesmo tratamento de loading/erro de
      `RaceCreateForm`.
    - `buildPayload(data: EventFormData): EventPayload` (interface
      `EventPayload extends Omit<EventFormData, 'referenceImageUrl' |
      'startYear' | 'endYear' | 'eraId'> { referenceImageUrl?: string;
      startYear?: string; endYear?: string; eraId?: string }`) — retorna
      `{ ...data, referenceImageUrl: data.referenceImageUrl || undefined,
      startYear: data.startYear || undefined, endYear: data.endYear ||
      undefined, eraId: data.eraId || undefined, tagIds: data.tagIds ?? []
      }`.
    - Submissão: `usePostEntity<IEvent, EventPayload>` (`POST /events`) /
      `usePutEntity<IEvent, EventPayload>` (`PUT /events/:id`), com
      `invalidateQueryKeys: [['/events']]`, toasts "Evento cadastrado com
      sucesso." / "Evento atualizado com sucesso." / erro exibindo
      `error.response?.data?.message`, mesmo padrão de `RaceCreateForm`.
    - Layout dos campos (`FormModal` `size="wide"`): grid `sm:grid-cols-2
      lg:grid-cols-4` com "Nome" (`FormTextInput`), "Era"
      (`FormAutocompleteInput<EventFormData, IEraOption>`,
      `options={eras ?? []}`, `getOptionLabel={(era) => era.name}`,
      `getOptionValue={(era) => era.id}`, opcional), "Ano Início"
      (`FormTextInput`), "Ano Fim" (`FormTextInput`), "Imagem Referência"
      (`FormTextInput`) e "Tags" (`FormMultiAutocompleteInput<EventFormData,
      ITag>`) — a critério do `web-dev` distribuir os 6 campos no grid de 4
      colunas (ex. 2 linhas). Abaixo, em largura total, "Descrição"
      (`FormRichTextInput`).

Estes componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Rotas/constantes (`app-web/src/shared/routes.ts`): adicionar `eras:
  '/eras'` e `events: '/eventos'` em `MENU_ROUTES` e em
  `APP_ROUTES.private`, mesmo padrão de `races`/`locations`/`tags` (rotas
  novas, sem colisão com as já existentes: `/`, `/home`, `/usuarios`,
  `/criaturas`, `/tags`, `/locais`, `/racas`).

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`):
  adicionar uma nova seção `{ title: 'História', items: [...] }` em
  `NAV_SECTIONS`, posicionada **acima** da seção `'Gerenciamento'` já
  existente (ou seja, logo após a seção `'Mundo'`), com dois itens: "Eras"
  (`href: APP_ROUTES.private.eras`, ícone `FiClock`) e "Eventos" (`href:
  APP_ROUTES.private.events`, ícone `FiCalendar`) — ambos de
  `react-icons/fi`, nenhum repetido em relação aos ícones já usados em
  outras seções (`FiHome`, `FiFeather`, `FiMapPin`, `MdOutlineFace`,
  `FiUsers`, `FiTag`). Nenhuma alteração necessária em
  `Sidebar/index.tsx` (o componente já itera `NAV_SECTIONS` genericamente,
  incluindo o `Divider` entre seções).

- Interfaces (novas, exportadas em
  `app-web/src/shared/interfaces/Entities/index.ts`), reaproveitando `ITag`
  já existente:
  - `app-web/src/shared/interfaces/Entities/Era/index.ts`:
    - `IEraOption`: `{ id: string; name: string; order: number }` — shape
      exato de `GET /eras/all` (`EraOptionResponseDto`), usado apenas para
      autocompletes/cálculo de contagem, nunca para exibir imagem ou tags.
    - `IEraSummary`: `{ id: string; name: string }` — shape exato do campo
      `era` embutido nas respostas de Evento (`EraSummaryResponseDto`, sem
      `order`), usado apenas em `IEventListItem.era`/`IEvent.era`, nunca para
      popular autocompletes (isso é papel de `IEraOption`).
    - `IEraListItem`: `{ id: string; referenceImageUrl?: string | null; name:
      string; order: number; tags: ITag[] }` — shape de `GET /eras`
      (listagem paginada), usado em `ErasList`/`ErasListItem` e como tipo do
      estado `eraPendingView`/`useSelectedEraStore`.
    - `IEra` (estende `IEntity`): `{ name: string; referenceImageUrl?:
      string | null; description?: string | null; order: number; tags:
      ITag[]; createdAt: string; updatedAt: string }`.
    - `IEraListFilters`: `{ name?: string; page?: number; perPage?: number
      }`.
  - `app-web/src/shared/interfaces/Entities/Event/index.ts`:
    - `IEventListItem`: `{ id: string; referenceImageUrl?: string | null;
      name: string; startYear?: string | null; endYear?: string | null;
      era: IEraSummary | null; tags: ITag[] }`.
    - `IEvent` (estende `IEntity`): `{ name: string; referenceImageUrl?:
      string | null; startYear?: string | null; endYear?: string | null;
      description?: string | null; era: IEraSummary | null; tags: ITag[];
      createdAt: string; updatedAt: string }`.
    - `IEventListFilters`: `{ name?: string; eraId?: string; startYear?:
      string; endYear?: string; page?: number; perPage?: number }`.

- Hook (novo, em
  `app-web/src/hooks/Queries/EntityQueries/useErasAllQuery/index.ts`,
  exportado em `hooks/Queries/EntityQueries/index.ts`): `useErasAllQuery`,
  espelhando `useRaceCategoriesQuery` — `useQuery<IEraOption[],
  AxiosError<IAxioDataError>>` com `queryKey: ['/eras/all']`, `queryFn` via
  `ApiFactory(getAuthToken())` contra `GET /eras/all`, `staleTime: 5 * 60 *
  1000`. Retorna `IEraOption[]` (**não** `IEraListItem[]` — `GET /eras/all`
  não inclui `referenceImageUrl`/`tags`, ver seção Contrato de API).
  Reaproveitado em três pontos: filtro de Era em `EventsFilterSection`,
  campo Era em `EventCreateForm`, e cálculo de `totalErasCount` (via
  `.length`) para as opções do campo "Ordenação" em `EraCreateForm`.

- Stores de feature (exportadas em `store/index.ts`):
  - `app-web/src/store/PageStore/ErasStore/index.ts`:
    `useSelectedEraStore` (`selectedEra: IEraListItem | null`,
    `setSelectedEra`, `resetSelectedEra`), mesmo padrão de
    `useSelectedRaceStore`.
  - `app-web/src/store/PageStore/EventsStore/index.ts`:
    `useSelectedEventStore` (`selectedEvent: IEventListItem | null`,
    `setSelectedEvent`, `resetSelectedEvent`), mesmo padrão. Ambas as
    stores servem apenas ao fluxo criar/editar do `FormModal` de cada
    página — a visualização usa estado local `eraPendingView`/
    `eventPendingView`, mesma separação de responsabilidades de `racas`.

- Schemas de formulário (exportados em `shared/formSchemas/index.ts`):
  - `app-web/src/shared/formSchemas/EraFormSchema/index.ts`:
    `eraFormSchema`, `EraFormData`, `eraFormResolver`,
    `eraFormDefaultValues` ({ name: '', referenceImageUrl: '', description:
    '', tagIds: [], order: '' }).
  - `app-web/src/shared/formSchemas/EventFormSchema/index.ts`:
    `eventFormSchema`, `EventFormData`, `eventFormResolver`,
    `eventFormDefaultValues` ({ name: '', referenceImageUrl: '', startYear:
    '', endYear: '', description: '', tagIds: [], eraId: '' }). Ambos sem
    variante de edição (schema único para criar/editar), mesma decisão já
    tomada em Raças/Criaturas/Locais.

- Página de listagem de Eras (`app-web/src/app/(authorized)/eras/page.tsx`),
  seguindo a estrutura de `RacesPage`:
  - `PageContainer` com `Title` "Eras" e `PrimaryButton` "Novo" abrindo o
    `FormModal` em modo de criação (`resetSelectedEra` antes de abrir).
  - Filtros via `ErasFilterSection` (`nameValue` em estado local, aplicado a
    `filters` do `useGetEntityList` como `name` (trim, `|| undefined`) ao
    submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<IEraListItem, IEraListFilters>` contra
    `GET /eras`, com paginação (`APP_DEFAULT_PAGE_SIZE`). Ordenação é
    responsabilidade do backend (nenhum parâmetro de ordenação enviado pelo
    frontend).
  - `ErasList` recebendo `eras={data?.data ?? []}`, `total={data?.total ??
    0}`, `page={filters.page ?? 1}`, `isLoading`, `onPageChange`, `onView`,
    `onEdit`, `onDelete`.
  - Visualização: estado local `eraPendingView: IEraListItem | null`.
    `handleView(era)` seta esse estado; renderizar `<ViewModal
    open={!!eraPendingView} onClose={() => setEraPendingView(null)}
    title="Detalhes da Era" size="wide">{eraPendingView && <EraView
    eraId={eraPendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selectedEra` na store com o item da listagem e
    abre o `FormModal` (`title={selectedEra ? 'Editar era' : 'Nova era'}`,
    `size="wide"`); o formulário busca o detalhe completo via
    `useGetEntityById<IEra>` usando `selectedEra.id`.
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja
    excluir a era "{name}"?`, usando `useDeleteEntity` contra `DELETE
    /eras/:id`, invalidando `[['/eras'], ['/eras/all']]` e exibindo toast de
    sucesso/erro.

- Página de listagem de Eventos
  (`app-web/src/app/(authorized)/eventos/page.tsx`), mesma estrutura:
  - `PageContainer` com `Title` "Eventos" e `PrimaryButton` "Novo".
  - Filtros via `EventsFilterSection` (`nameValue`/`startYearValue`/
    `endYearValue`/`eraValue` em estado local, opções de era via
    `useErasAllQuery`, aplicados a `filters` do `useGetEntityList` como
    `name` (trim, `|| undefined`), `startYear` (trim, `|| undefined`),
    `endYear` (trim, `|| undefined`) e `eraId` (`eraValue?.id`) ao
    submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<IEventListItem, IEventListFilters>`
    contra `GET /events`, com paginação. Ordenação por `name` é
    responsabilidade do backend.
  - `EventsList` recebendo `events={data?.data ?? []}` e demais props
    análogas a `ErasList`.
  - Visualização: estado local `eventPendingView: IEventListItem | null`,
    `<ViewModal ... title="Detalhes do Evento" size="wide">{eventPendingView
    && <EventView eventId={eventPendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selectedEvent` na store e abre o `FormModal`
    (`title={selectedEvent ? 'Editar evento' : 'Novo evento'}`,
    `size="wide"`); formulário busca via `useGetEntityById<IEvent>` usando
    `selectedEvent.id`.
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja
    excluir o evento "{name}"?`, `useDeleteEntity` contra `DELETE
    /events/:id`, invalidando `[['/events']]`.

- Integrações com API consumidas por esta feature:
  - `GET /eras` — listagem paginada de Eras, filtro `name`.
  - `GET /eras/all` — lista completa de Eras (autocompletes + cálculo de
    `order`).
  - `GET /eras/:id` — detalhe completo (`IEra`), usado em modo edição
    (`EraCreateForm`) e na visualização (`EraView`).
  - `POST /eras` / `PUT /eras/:id` / `DELETE /eras/:id`.
  - `GET /events` — listagem paginada de Eventos, filtros `name`, `eraId`,
    `startYear`, `endYear`.
  - `GET /events/:id` — detalhe completo (`IEvent`), usado em modo edição
    (`EventCreateForm`) e na visualização (`EventView`).
  - `POST /events` / `PUT /events/:id` / `DELETE /events/:id`.
  - `GET /tags` — já existente, reaproveitado para popular as opções de
    `FormMultiAutocompleteInput` (campo Tags) em ambos os formulários, sem
    novo hook.

- Formulário/validação — Era (`eraFormSchema`):
  - `name` → "Nome" → `FormTextInput` → obrigatório
    (`z.string().min(1, 'Informe o nome')`).
  - `referenceImageUrl` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL válida via `refine` (mesmo padrão
    de `RaceFormSchema.referenceImageUrl` — `z.string().refine((value) =>
    value === '' || z.string().url().safeParse(value).success, 'Informe uma
    URL de imagem válida')` — **não** usar `z.union`, mesmo bug já
    conhecido/documentado).
  - `description` → "Descrição" → `FormRichTextInput` → opcional
    (`z.string()`, sem `refine` de não-vazio).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`).
  - `order` → "Ordenação" → `FormAutocompleteInput<EraFormData, number>` →
    obrigatório (`z.string().min(1, 'Selecione a ordenação')` — mantido como
    `string` no schema para compatibilidade com o contrato de
    `FormAutocompleteInput`, convertido para `number` apenas em
    `buildPayload` via `Number(data.order)`), opções `1..N` onde `N =
    totalErasCount + 1` em modo criação e `N = totalErasCount` em modo
    edição (ver regra corrigida na seção Contexto e em `EraCreateForm`).

- Formulário/validação — Evento (`eventFormSchema`):
  - `name` → "Nome" → `FormTextInput` → obrigatório
    (`z.string().min(1, 'Informe o nome')`).
  - `referenceImageUrl` → "Imagem Referência" → `FormTextInput` → opcional,
    mesma validação de URL via `refine` de Era/Raça.
  - `startYear` → "Ano Início" → `FormTextInput` → opcional, texto livre
    (`z.string()`, sem regra de formato — contrato de API trata como
    texto).
  - `endYear` → "Ano Fim" → `FormTextInput` → opcional, texto livre
    (`z.string()`).
  - `description` → "Descrição" → `FormRichTextInput` → opcional
    (`z.string()`).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`).
  - `eraId` → "Era" → `FormAutocompleteInput<EventFormData, IEraOption>` →
    opcional (`z.string()`, sem `.min(1, ...)`, já que o contrato de API
    define `eraId?` como opcional no payload), opções via `useErasAllQuery`.

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

Revisão completa dos arquivos da etapa "1. web-dev" (componentes
`ErasFilterSection`, `ErasList`/`ErasListItem`, `EraView`, `EraCreateForm`,
`EventsFilterSection`, `EventsList`/`EventsListItem`, `EventView`,
`EventCreateForm`; páginas `eras/page.tsx` e `eventos/page.tsx`; interfaces
`IEraOption`/`IEraSummary`/`IEraListItem`/`IEra`/`IEraListFilters`/
`IEventListItem`/`IEvent`/`IEventListFilters`; hook `useErasAllQuery`; stores
`useSelectedEraStore`/`useSelectedEventStore`; schemas `eraFormSchema`/
`eventFormSchema`; rotas em `shared/routes.ts` e seção "História" no
`Sidebar/data/index.ts`) contra o `CLAUDE.md` e o plano fixado neste arquivo.

Nomenclatura de propriedades conferida campo a campo contra os DTOs reais do
backend em `app-api/src/modules/eras/dto/` e `app-api/src/modules/events/dto/`:
- `IEraOption` (`id`, `name`, `order`) bate exatamente com
  `EraOptionResponseDto` (`GET /eras/all`).
- `IEraSummary` (`id`, `name`) bate exatamente com `EraSummaryResponseDto`
  (campo `era` embutido em `EventListItemResponseDto`/`EventResponseDto`).
- `IEraListItem` (`id`, `referenceImageUrl?`, `name`, `order`, `tags`) bate
  exatamente com `EraListItemResponseDto` (`GET /eras`).
- `IEra` (`id` via `IEntity`, `name`, `referenceImageUrl?`, `description?`,
  `order`, `tags`, `createdAt`, `updatedAt`) bate exatamente com
  `EraResponseDto`.
- `IEventListItem`/`IEvent` batem exatamente com `EventListItemResponseDto`/
  `EventResponseDto`, incluindo `era: IEraSummary | null` (o backend serializa
  via `EraSummaryResponseDto.fromEntity`, que retorna `null` quando a era não
  está vinculada).
- Payloads de `EraCreateForm.buildPayload`/`EventCreateForm.buildPayload`
  batem exatamente com `CreateEraDto`/`CreateEventDto` (e respectivos
  `Update*Dto`).
- Rota `GET /eras/all` está registrada antes de `GET /eras/:id` em
  `eras.controller.ts` (sem conflito de roteamento).

Pontos de risco apontados pelo orquestrador, todos verificados e em
conformidade:
1. **Três shapes de "era"**: confirmado que `IEraOption` é usado apenas em
   `EventsFilterSection` (prop `eras: IEraOption[]`), `EventCreateForm` (campo
   "Era", `options={eras ?? []}`) e no cálculo de `totalErasCount` em
   `EraCreateForm`; `IEraSummary` é usado apenas em
   `IEventListItem.era`/`IEvent.era` (`EventsListItem`/`EventView` acessam só
   `era?.name`, nunca `order`/`referenceImageUrl`/`tags`); `IEraListItem` é
   usado em `ErasList`/`ErasListItem`/`useSelectedEraStore`. Nenhum componente
   tenta acessar campos inexistentes no shape recebido.
2. **Regra `orderOptionsCount`**: confirmado em
   `EraCreateForm/index.tsx:51` — `orderOptionsCount = isEditMode ?
   totalErasCount : totalErasCount + 1`, exatamente como especificado. Com
   `totalErasCount === 0` em modo criação, `orderOptionsCount` é `1` e
   `Array.from({ length: 1 }, (_, index) => index + 1)` produz `[1]`,
   oferecendo a opção "1" na primeira era do sistema.
3. **`order` fora do `EraView`**: confirmado — `EraView/index.tsx` não
   referencia `era.order` em nenhum ponto do JSX.
4. **Layout dos modais de visualização**: `EraView` segue nome centralizado
   (`Title` dentro de `div.flex flex-col items-center`) + tags abaixo (`div`
   centralizado, condicional a `tags.length > 0`) + imagem full-width
   (`width: '100%'`, `height: 360`) + `EraSectionBox` de Descrição full-width
   abaixo. `EventView` segue o mesmo topo (nome + tags) seguido da linha
   `grid sm:grid-cols-2` com Era à esquerda e Data Início/Data Fim à direita
   (dois `detailInfoField` lado a lado dentro do segundo bloco), depois
   imagem full-width e `EventSectionBox` de Descrição — conforme
   especificado.
5. **Posição da seção "História" no Sidebar**: confirmado em
   `Sidebar/data/index.ts` — `NAV_SECTIONS` tem a ordem Home → Mundo →
   **História** → Gerenciamento, ou seja, acima de "Gerenciamento" e logo
   após "Mundo", sem mistura de itens entre as seções.
6. **Ícones e duplicação de componentes**: todos os ícones usados nos
   arquivos novos de Eras/Eventos são de `react-icons/fi` (`FiSearch`,
   `FiEye`, `FiEdit2`, `FiTrash2`, `FiImage`, `FiFileText`, `FiClock`,
   `FiCalendar`); a única outra importação de `react-icons` é o tipo
   `IconType` (utilitário de tipagem, não um ícone), usado em `EraView`/
   `EventView` para tipar o helper local `EraSectionBox`/`EventSectionBox`.
   Nenhum `@mui/icons-material` em todo `app/(authorized)`. Nenhum componente
   genérico existente (`ImageAvatarPreview`, `ImagePreviewDialog`,
   `RichTextViewer`, `TagBadge`, `FormModal`, `ViewModal`,
   `ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`,
   `PrimaryButton`, `FormTextInput`, `FormRichTextInput`,
   `FormAutocompleteInput`, `FormMultiAutocompleteInput`,
   `DefaultTextInput`, `DefaultAutocompleteInput`) foi duplicado; `EraView` e
   `EventView` implementam helpers locais próprios (`EraSectionBox`/
   `EventSectionBox`), sem componente de view compartilhado entre as duas
   features, conforme decisão registrada na seção Contexto.

Demais pontos verificados, todos em conformidade:
- Assinaturas dos componentes genéricos consumidos (`FormAutocompleteInput`,
  `FormMultiAutocompleteInput`, `DefaultAutocompleteInput`,
  `ImageAvatarPreview`, `ImagePreviewDialog`, `RichTextViewer`, `TagBadge`,
  `FormModal`/`ViewModal`/`ConfirmationModal`, `useGetEntityList`/
  `useGetEntityById`/`usePostEntity`/`usePutEntity`/`useDeleteEntity`)
  conferidas linha a linha contra o código real desses componentes/hooks —
  nenhuma prop inexistente ou incompatível é passada, nenhum tipo genérico
  mal aplicado.
- `EraCreateForm`/`EventCreateForm` seguem o padrão `web-form-cadastro`:
  renderizados dentro de `FormModal`, modo criar/editar derivado de
  `useSelectedEraStore`/`useSelectedEventStore` (`isEditMode = !!selectedEra`
  / `!!selectedEvent`, nunca de uma prop manual), `usePostEntity`/
  `usePutEntity` com `invalidateQueryKeys: [['/eras'], ['/eras/all']]` (Era,
  cobrindo tanto a listagem paginada quanto a lista completa usada em
  autocompletes/cálculo de ordem) e `invalidateQueryKeys: [['/events']]`
  (Evento) — a listagem recarrega sozinha após criar/editar/excluir, sem
  `refetch()` manual ou reload de página (mesmo padrão nas mutations de
  exclusão em `eras/page.tsx`/`eventos/page.tsx`).
- Loading (`CircularProgress` + texto) e erro (`showToast` com
  `error.response?.data?.message` e fallback pt-BR) tratados tanto na busca
  de detalhe (`useGetEntityById`) quanto nas mutations, em ambos os
  formulários e em ambos os `*View`.
- Schemas zod (`EraFormSchema`/`EventFormSchema`): `referenceImageUrl` usa
  `refine` (`value === '' || z.string().url()...`) em vez de `z.union`,
  mesmo padrão correto já usado em Raças; `order` (Era) é `z.string().min(1,
  ...)`, convertido para `number` só em `buildPayload`, coerente com o
  contrato de `FormAutocompleteInput` (valor sempre string); `startYear`/
  `endYear`/`eraId` (Evento) sem `.min(1, ...)`, coerentes com o payload
  opcional da API. Ambos sem variante de edição, mesma decisão já tomada em
  Raças/Criaturas/Locais.
- `useErasAllQuery` espelha exatamente `useRaceCategoriesQuery`
  (`queryKey: ['/eras/all']`, `staleTime: 5 * 60 * 1000`), reaproveitado nos
  três pontos previstos (`EventsFilterSection`, `EventCreateForm`, cálculo de
  `totalErasCount` em `EraCreateForm`) sem duplicação de lógica de fetch.
- Separação `useSelectedEraStore`/`useSelectedEventStore` (fluxo
  criar/editar do `FormModal`) vs. estado local `eraPendingView`/
  `eventPendingView` (fluxo somente-leitura do `ViewModal`) está corretamente
  implementada em ambas as páginas, sem acoplamento entre os dois fluxos.
- `ErasFilterSection`/`EventsFilterSection` seguem o padrão
  `web-secao-filtros`: componentes apresentacionais específicos da página,
  recebem valores/setters via props, sem estado ou chamada de API própria;
  nenhum `<form>` de filtro inline em `page.tsx`.
- Rotas (`shared/routes.ts`) adicionadas em `MENU_ROUTES` e
  `APP_ROUTES.private` sem colisão com as rotas já existentes.

Nenhum problema bloqueante, de tipagem, de lógica ou de padrão foi
encontrado.

Aprovado. Arquivos revisados:
app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx;
app-web/src/app/(authorized)/eras/components/ErasList/index.tsx;
app-web/src/app/(authorized)/eras/components/ErasListItem/index.tsx;
app-web/src/app/(authorized)/eras/components/EraView/index.tsx;
app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsFilterSection/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsList/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventsListItem/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventView/index.tsx;
app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx;
app-web/src/app/(authorized)/eras/page.tsx;
app-web/src/app/(authorized)/eventos/page.tsx;
app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/data/index.ts;
app-web/src/shared/interfaces/Entities/Era/index.ts;
app-web/src/shared/interfaces/Entities/Event/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/hooks/Queries/EntityQueries/useErasAllQuery/index.ts;
app-web/src/hooks/Queries/EntityQueries/index.ts;
app-web/src/store/PageStore/ErasStore/index.ts;
app-web/src/store/PageStore/EventsStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/EraFormSchema/index.ts;
app-web/src/shared/formSchemas/EventFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts.
