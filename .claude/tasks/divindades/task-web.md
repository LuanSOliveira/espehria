# Task Web: Divindades

## Contexto

Não há `.claude/tasks/divindades/spec.md` — requisito já esclarecido
diretamente pelo usuário (orquestrador), sem necessidade do agente `spec`.
Este plano foi elaborado com base direta no pedido detalhado recebido.

**Contrato de API** (definido em paralelo pela task-api do mesmo slug,
`.claude/tasks/divindades/task-api.md` — nomes de propriedade em inglês,
batendo com o JSON do backend; se esse arquivo ainda não existir no momento
da implementação, o contrato abaixo é definitivo e não deve ser reaberto):

- `GET /divinities` — paginado, filtro `name` (parcial). Retorna `{ data:
  IDivinityListItem[], total, page, perPage }`, cada item com `id`,
  `referenceImage`, `name`, `tags` (`ITag[]`). Não há campo `order` — sem
  ordenação configurável pelo usuário (o backend define a ordem de retorno).
- `GET /divinities/:id` — detalhe completo: `id`, `name`, `referenceImage`,
  `description`, `tags`, `createdAt`, `updatedAt`.
- `POST /divinities` / `PUT /divinities/:id` — payload `{ name,
  referenceImage?, description?, tagIds? }`.
- `DELETE /divinities/:id` — 204.

**Atenção — nome de propriedade divergente do padrão usado em outras
entidades:** o contrato confirmado pelo usuário usa `referenceImage` (sem o
sufixo `Url`), diferente de `referenceImageUrl` usado em `Race`/`Era`/
`Event`/`Creature`/`Location` (confirmado em
`app-api/src/modules/*/entities/*.entity.ts` e nos DTOs correspondentes).
Isso é tratado como intencional/definitivo para esta entidade (não uma
lacuna a ser questionada) — todas as interfaces, o schema zod, o payload de
criação/edição e o nome do campo do formulário usam exatamente
`referenceImage`, sem tentar "corrigir" para `referenceImageUrl` por
analogia com as demais features. Só os rótulos de UI ("Imagem Referência")
permanecem iguais aos das outras páginas.

**Investigação de código existente relevante:**

- Feature `racas` (`app-web/src/app/(authorized)/racas/`) é a referência
  estrutural mais próxima da listagem/formulário e também a referência mais
  próxima do *espírito* do layout de visualização pedido (imagem ao lado de
  uma coluna de nome/tags/informações), mas o layout de `RaceView` não deve
  ser copiado literalmente: `RaceView` usa imagem **quadrada** (400x400) e
  depois duas seções full-width abaixo da linha imagem+coluna
  (`physicalCharacteristics`, `description`). Divindade não tem esses campos
  extras (só `description`), então o pedido é que a própria coluna lateral
  já contenha nome → tags → quadro de descrição, sem nenhuma seção
  full-width adicional abaixo.
- Feature `eras` (`app-web/src/app/(authorized)/eras/`) é a referência mais
  próxima de campos (`name`, `referenceImage(Url)` opcional com validação de
  URL, `description` rich text opcional, `tagIds` opcional, sem categoria
  obrigatória) e de filtro (só `name`, via `ErasFilterSection` —
  `DefaultTextInput` + `PrimaryButton`, sem `max-w` largo). **O layout do
  `EraView` não deve ser usado como referência de visualização** (nome
  centralizado no topo + imagem full-width abaixo) — o pedido explícito para
  Divindade é o esquema lateral (imagem ao lado da coluna), não o esquema
  empilhado de `EraView`. Eras também não tem campo `order` a mais que
  Divindade não tenha, então não há necessidade de hook equivalente a
  `useErasAllQuery` (que existe só por causa do campo `order` de Era).
- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`):
  a seção `'Mundo'` já existe em `NAV_SECTIONS`, hoje com três itens em
  ordem alfabética — "Criaturas" (`FiFeather`), "Locais" (`FiMapPin`),
  "Raças" (`MdOutlineFace`) — antes da seção `'História'` (Eras/Eventos) e
  de `'Gerenciamento'` (Usuários/Tags). "Divindades" deve ser adicionado
  dentro da própria seção `'Mundo'` (não uma seção nova), mantendo a ordem
  alfabética já existente: **Criaturas → Divindades → Locais → Raças**.
- `app-web/src/shared/routes.ts`: rotas centralizadas em `MENU_ROUTES` +
  reexportadas em `APP_ROUTES.private`, um par chave/valor por feature (ex.
  `races: '/racas'`, `eras: '/eras'`); nenhuma rota `/divindades` existe
  ainda.
- Componentes genéricos já existentes e diretamente reaproveitáveis, sem
  necessidade de criação: `ImageAvatarPreview` (avatar circular pequeno para
  a listagem, prop `imageUrl`), `ImagePreviewDialog` (lightbox ao clicar na
  imagem grande do modal de visualização), `RichTextViewer` (trata valor
  vazio/nulo via `emptyLabel`), `TagBadge`, `FormModal`, `ViewModal`,
  `ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`,
  `PrimaryButton`, `FormTextInput`, `FormRichTextInput`,
  `FormMultiAutocompleteInput`, `DefaultTextInput`, hooks
  `useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
  `useDeleteEntity` de `hooks/Queries`. A interface `ITag`
  (`shared/interfaces/Entities/Tag`, `{ id, name, color }`) já existe e é
  reaproveitada diretamente para o campo "Tags" do formulário (mesmo padrão
  de Raças/Eras/Criaturas, via `GET /tags` com `useGetEntityList<ITag,
  ITagListFilters>`) — **não** é necessário nenhum hook novo equivalente a
  `useErasAllQuery`, já que Divindade não tem campo `order` nem é referenciada
  como opção de autocomplete em nenhuma outra feature.
- **Não existe** hoje nenhum componente reaproveitável para Divindades —
  todos os componentes de filtro, lista, visualização e formulário desta
  página precisam ser criados, específicos da feature
  (`app/(authorized)/divindades/components/`).
- **Decisão de reaproveitamento (skill `web-componentes`):** mesmo
  precedente já registrado em `historia-eras-eventos/task-web.md` para
  `EraView`/`EventView` vs. `RaceView`/`CreatureView` — apesar de o layout
  de `DivinityView` ser estruturalmente parecido com `RaceView`/
  `CreatureView` (imagem ao lado de uma coluna de informação), a decisão é
  **não** extrair nenhum componente de "view" genérico compartilhado em
  `shared/components/`. `DivinityView` é implementado como componente de
  página independente, em `app/(authorized)/divindades/components/DivinityView/`,
  com seu próprio helper local de seção (`DivinitySectionBox`, definido
  dentro do próprio arquivo, mesmo padrão de `RaceSectionBox`/
  `EraSectionBox`), sem acoplar a feature a um componente genérico novo. Isso
  mantém a página livre para evoluir seu layout específico (imagem retrato,
  em vez de quadrada ou full-width) sem alterar `RaceView`/`CreatureView`/
  `EraView`/`EventView`.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx;
app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx;
app-web/src/app/(authorized)/divindades/components/DivinitiesListItem/index.tsx;
app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx;
app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx
Arquivos: app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/data/index.ts;
app-web/src/shared/interfaces/Entities/Divinity/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/store/PageStore/DivinitiesStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/DivinityFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/divindades/page.tsx.
Implementado exatamente conforme especificado neste plano, espelhando `eras`/`racas`
(estrutura) e reaproveitando integralmente os componentes genéricos e hooks já
existentes listados na seção Contexto (`ImageAvatarPreview`, `ImagePreviewDialog`,
`RichTextViewer`, `TagBadge`, `FormModal`, `ViewModal`, `ConfirmationModal`,
`PageContainer`, `Title`/`Label`/`DefaultText`, `PrimaryButton`, `FormTextInput`,
`FormRichTextInput`, `FormMultiAutocompleteInput`, `DefaultTextInput`,
`useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
`useDeleteEntity`). O campo `referenceImage` (sem sufixo `Url`) foi usado
literalmente em todas as interfaces, no schema zod, no payload de
criação/edição (`DivinityCreateForm.buildPayload`) e no nome do campo do
formulário, exatamente como fixado na seção Contexto — não foi "corrigido"
para `referenceImageUrl` por analogia com Raças/Eras/Eventos/Criaturas/
Locais. Não foi criado nenhum componente de "view" genérico compartilhado
(`DivinityView` é independente, com seu próprio helper local
`DivinitySectionBox`, mesmo padrão de `RaceSectionBox`/`EraSectionBox`), e o
layout de `DivinityView` segue o esquema lateral (imagem retrato 300x400 ao
lado da coluna nome → tags → descrição), sem nenhuma seção full-width
adicional, diferente de `RaceView` e sem o esquema empilhado de `EraView`. O
item "Divindades" foi adicionado à seção `'Mundo'` já existente no Sidebar
(ícone `FiSun`, não usado em nenhum outro item), entre "Criaturas" e
"Locais", mantendo a ordem alfabética já existente. Nenhum hook novo
equivalente a `useErasAllQuery` foi criado, pois Divindade não tem campo
`order` nem é referenciada em autocomplete de outra feature.
Pendência: não foi possível rodar `npm run lint`/`npm run build` nesta sessão
do agente `web-dev` (toolset restrito a Read/Grep/Glob/Edit/Write/Skill, sem
acesso a shell) — cada arquivo novo foi conferido manualmente campo a campo
contra as assinaturas reais dos componentes/hooks genéricos consumidos
(`FormMultiAutocompleteInput`, `FormTextInput`, `FormRichTextInput`,
`DefaultTextInput`, `useGetEntityList`/`useGetEntityById`/`usePostEntity`/
`usePutEntity`/`useDeleteEntity`, `ImageAvatarPreview`, `ImagePreviewDialog`,
`RichTextViewer`, `TagBadge`, `ViewModal`/`FormModal`/`ConfirmationModal`),
mas recomenda-se que a etapa seguinte (`web-dev-codereviewer`) rode `npm run
lint` e `npm run build` dentro de `app-web` antes de aprovar.
Dependências: nenhuma

#### Componentes (necessário — nada equivalente existe hoje para Divindades)

- Componente: `DivinitiesFilterSection` (novo —
  `app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`,
  seguindo o padrão `web-secao-filtros`, espelhando `ErasFilterSection` —
  único filtro é nome).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` (`mt-6 flex max-w-90 items-end gap-3`) com
    um único `DefaultTextInput` "Nome" (busca parcial, ícone `FiSearch`) e um
    `PrimaryButton` "Filtrar", mesmo layout de `ErasFilterSection`.

- Componentes: `DivinitiesList` + `DivinitiesListItem` (novos —
  `app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx`
  e `.../DivinitiesListItem/index.tsx`, espelhando `RacesList`/
  `RacesListItem`, porém sem a coluna "Categoria" que Raças tem — Divindade
  não tem categoria).
  - `DivinitiesListProps`: `divinities: IDivinityListItem[]`; `total:
    number`; `page: number`; `isLoading: boolean`; `onPageChange: (newPage:
    number) => void`; `onView: (divinity: IDivinityListItem) => void`;
    `onEdit: (divinity: IDivinityListItem) => void`; `onDelete: (divinity:
    IDivinityListItem) => void`.
  - Comportamento esperado (`DivinitiesList`): `Table` com colunas "Imagem",
    "Nome", "Tags", "Ações" (`colSpan` do estado vazio = 4, texto "Nenhuma
    divindade encontrada."), `TablePagination` com `APP_DEFAULT_PAGE_SIZE`,
    mesmo padrão visual (`APP_COLORS.gold` nas bordas) de `RacesList`.
  - `DivinitiesListItemProps`: `divinity: IDivinityListItem`; `onView`;
    `onEdit`; `onDelete` (mesmas assinaturas acima).
  - Comportamento esperado (`DivinitiesListItem`): célula "Imagem" via
    `ImageAvatarPreview imageUrl={divinity.referenceImage}
    alt={divinity.name}`, "Nome" (`divinity.name`), "Tags"
    (`divinity.tags.map((tag) => <TagBadge key={tag.id} name={tag.name}
    color={tag.color} />)`), e "Ações" com três `IconButton`+`Tooltip` —
    "Visualizar" (`FiEye`, chama `onView(divinity)`), "Editar" (`FiEdit2`,
    chama `onEdit(divinity)`), "Excluir" (`FiTrash2`, chama
    `onDelete(divinity)`) — mesmo padrão visual (`sx={{ color:
    APP_COLORS.textBrownDark }}`, `aria-label` pt-BR) de `RacesListItem`.

- Componente: `DivinityView` (novo —
  `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx`,
  passado como `children` do `ViewModal` genérico; layout ESPECÍFICO da
  demanda — imagem retrato ao lado de uma coluna nome/tags/descrição, sem
  seções full-width abaixo, sem componente compartilhado com `RaceView`/
  `CreatureView`/`EraView`/`EventView` — ver decisão na seção Contexto).
  - Props: `divinityId: string`.
  - Comportamento esperado:
    - Busca os dados completos via `useGetEntityById<IDivinity>({ url:
      \`/divinities/${divinityId}\` })`.
    - Estado de carregamento: `CircularProgress` + `DefaultText`
      ("Carregando dados da divindade...", mesmo padrão de `RaceView`).
    - Estado de erro: `showToast` com `error.response?.data?.message ??
      'Não foi possível carregar os dados da divindade.'` (mesmo padrão de
      `RaceView`).
    - Layout do conteúdo, uma vez carregado — uma única linha
      (`flex flex-col gap-4 sm:flex-row`, sem nenhuma seção adicional
      abaixo):
      - Bloco da imagem, à esquerda, em formato **retrato** (proporção 3:4,
        diferente do quadrado 400x400 de `RaceView`): `Box component="img"`
        com `width: 300`, `height: 400`, `objectFit: 'cover'`,
        `borderRadius: '6px'`, borda `2px solid ${APP_COLORS.gold}`,
        `flexShrink: 0`, clicável (`button` envolvendo a imagem, mesmo padrão
        de `RaceView`) para abrir `ImagePreviewDialog` quando
        `divinity.referenceImage` estiver presente; fallback — mesmo bloco
        300x400 com `FiImage` centralizado (`fontSize: 64`,
        `backgroundColor: APP_COLORS.wood`, `color: APP_COLORS.gold`) quando
        ausente, mesmo padrão visual do fallback de `RaceView`.
      - Coluna à direita (`flex w-full flex-col gap-3`), contendo, nesta
        ordem:
        1. `Title` com `divinity.name` no topo, mesmo override de estilo já
           usado em `RaceView` (`textAlign: 'left'`, `textTransform: 'none'`,
           `backgroundImage: 'none'`, cor `APP_COLORS.textBrownDark`,
           `WebkitTextFillColor` igual, `letterSpacing: 'normal'`, `filter:
           'none'` — texto simples, sem o gradiente dourado de título de
           página).
        2. Logo abaixo do nome, uma linha (`flex flex-wrap gap-2`) com os
           `tags` (chips coloridos via `Chip` do MUI, `backgroundColor:
           tag.color`, `color: getContrastTextColor(tag.color)`, mesmo
           padrão de `RaceView`), renderizada apenas quando
           `divinity.tags.length > 0`.
        3. Abaixo das tags, o quadro de descrição — `DivinitySectionBox`
           (helper local não compartilhado, mesmo padrão de
           `RaceSectionBox`/`EraSectionBox`: header com ícone `FiFileText` +
           `Label` "Descrição" sobre `APP_CONTAINER_STYLES.detailSectionBox`
           + `detailSectionBoxHeader`, corpo com `RichTextViewer
           value={divinity.description} emptyLabel="Não informado"`) — este
           bloco deve poder crescer para preencher a altura restante da
           coluna (`className="flex-1 min-w-0 flex flex-col"`, com o corpo
           interno também `flex-1`), para acompanhar visualmente a altura da
           imagem retrato ao lado, mas isso é um detalhe fino de CSS a
           critério do `web-dev` — o essencial especificado é a ordem
           nome → tags → quadro de descrição dentro da mesma coluna lateral,
           **sem** nenhuma seção full-width adicional abaixo da linha
           imagem+coluna (diferente de `RaceView`, que tem
           `physicalCharacteristics`/`description` como seções full-width
           separadas — Divindade não tem esses campos extras).

- Componente: `DivinityCreateForm` (novo —
  `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`,
  dentro de `FormModal`, seguindo `web-form-cadastro`, espelhando
  `RaceCreateForm` sem o campo de categoria).
  - Props: `onSaved: () => void`.
  - Comportamento esperado:
    - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>({
      url: '/tags', filters: { perPage: 100 } })`, mesmo padrão de
      `RaceCreateForm`.
    - Em modo edição, popula o formulário (`reset`) a partir do resultado de
      `useGetEntityById<IDivinity>({ url:
      \`/divinities/${selectedDivinity?.id}\`, enabled: isEditMode })`:
      `name`, `referenceImage: divinityDetail.referenceImage ?? ''`,
      `description: divinityDetail.description ?? ''`, `tagIds:
      divinityDetail.tags?.map((tag) => tag.id) ?? []`. Mesmo tratamento de
      loading (`CircularProgress` + texto "Carregando dados da
      divindade...") e erro (`showToast`) já usado em `RaceCreateForm`.
    - `buildPayload(data: DivinityFormData): DivinityPayload` (interface
      `DivinityPayload extends Omit<DivinityFormData, 'referenceImage'> {
      referenceImage?: string }`) — retorna `{ ...data, referenceImage:
      data.referenceImage || undefined, tagIds: data.tagIds ?? [] }`.
    - Submissão: `usePostEntity<IDivinity, DivinityPayload>` (`POST
      /divinities`) em modo criação e `usePutEntity<IDivinity,
      DivinityPayload>` (`PUT /divinities/:id`) em modo edição, com
      `invalidateQueryKeys: [['/divinities']]`, toasts "Divindade cadastrada
      com sucesso." / "Divindade atualizada com sucesso." / erro exibindo
      `error.response?.data?.message` quando disponível, mesmo padrão de
      `RaceCreateForm`.
    - Layout dos campos (`FormModal` `size="wide"`): grid `sm:grid-cols-2
      lg:grid-cols-3` com "Nome" (`FormTextInput`), "Imagem Referência"
      (`FormTextInput`, `name="referenceImage"`) e "Tags"
      (`FormMultiAutocompleteInput<DivinityFormData, ITag>`). Abaixo, em
      largura total, "Descrição" (`FormRichTextInput`).

Estes componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Rotas/constantes (`app-web/src/shared/routes.ts`): adicionar `divinities:
  '/divindades'` em `MENU_ROUTES` e em `APP_ROUTES.private`, mesmo padrão de
  `races`/`eras`/`events` (rota nova, sem colisão com as já existentes: `/`,
  `/home`, `/usuarios`, `/criaturas`, `/tags`, `/locais`, `/racas`, `/eras`,
  `/eventos`).

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`):
  adicionar o item "Divindades" (`href: APP_ROUTES.private.divinities`,
  ícone sugerido `FiSun` de `react-icons/fi` — não usado em nenhum outro item
  hoje; a critério do `web-dev` substituir por outro ícone do mesmo pacote
  `react-icons/fi`/`react-icons/md` caso `FiSun` não pareça adequado, desde
  que não repita nenhum ícone já usado: `FiHome`, `FiFeather`, `FiMapPin`,
  `MdOutlineFace`, `FiClock`, `FiCalendar`, `FiUsers`, `FiTag`) dentro da
  seção `'Mundo'` já existente em `NAV_SECTIONS`, entre "Criaturas" e
  "Locais" (mantendo a ordem alfabética já existente na seção: Criaturas →
  Divindades → Locais → Raças). Nenhuma seção nova é criada, nenhuma
  alteração necessária em `Sidebar/index.tsx` (o componente já itera
  `NAV_SECTIONS` genericamente).

- Interfaces (novas, exportadas em
  `app-web/src/shared/interfaces/Entities/index.ts`), reaproveitando `ITag`
  já existente:
  - `app-web/src/shared/interfaces/Entities/Divinity/index.ts`:
    - `IDivinityListItem`: `{ id: string; referenceImage?: string | null;
      name: string; tags: ITag[] }` — shape de `GET /divinities` (listagem
      paginada), usado em `DivinitiesList`/`DivinitiesListItem` e como tipo
      do estado `divinityPendingView`/`useSelectedDivinityStore`.
    - `IDivinity` (estende `IEntity`): `{ name: string; referenceImage?:
      string | null; description?: string | null; tags: ITag[]; createdAt:
      string; updatedAt: string }`.
    - `IDivinityListFilters`: `{ name?: string; page?: number; perPage?:
      number }`.

- Store de feature (exportada em `store/index.ts`):
  - `app-web/src/store/PageStore/DivinitiesStore/index.ts`:
    `useSelectedDivinityStore` (`selectedDivinity: IDivinityListItem | null`,
    `setSelectedDivinity`, `resetSelectedDivinity`), mesmo padrão de
    `useSelectedRaceStore`/`useSelectedEraStore`. Serve apenas ao fluxo
    criar/editar do `FormModal` — a visualização usa estado local
    `divinityPendingView` na própria `page.tsx`, mesma separação de
    responsabilidades já usada em `racas`/`eras`/`eventos`.

- Schema de formulário (exportado em `shared/formSchemas/index.ts`):
  - `app-web/src/shared/formSchemas/DivinityFormSchema/index.ts`:
    `divinityFormSchema`, `DivinityFormData`, `divinityFormResolver`,
    `divinityFormDefaultValues` (`{ name: '', referenceImage: '',
    description: '', tagIds: [] }`). Sem variante de edição (schema único
    para criar/editar), mesma decisão já tomada em Raças/Eras/
    Criaturas/Locais.

- Página de listagem de Divindades
  (`app-web/src/app/(authorized)/divindades/page.tsx`), seguindo a estrutura
  de `RacesPage`, porém sem filtro/campo de categoria:
  - `PageContainer` com `Title` "Divindades" e `PrimaryButton` "Novo"
    abrindo o `FormModal` em modo de criação (`resetSelectedDivinity` antes
    de abrir).
  - Filtros via `DivinitiesFilterSection` (`nameValue` em estado local,
    aplicado a `filters` do `useGetEntityList` como `name` (trim, `||
    undefined`) ao submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<IDivinityListItem, IDivinityListFilters>`
    contra `GET /divinities`, com paginação (`APP_DEFAULT_PAGE_SIZE`).
  - `DivinitiesList` recebendo `divinities={data?.data ?? []}`,
    `total={data?.total ?? 0}`, `page={filters.page ?? 1}`, `isLoading`,
    `onPageChange`, `onView`, `onEdit`, `onDelete`.
  - Visualização: estado local `divinityPendingView: IDivinityListItem |
    null`. `handleView(divinity)` seta esse estado; renderizar `<ViewModal
    open={!!divinityPendingView} onClose={() => setDivinityPendingView(null)}
    title="Detalhes da Divindade" size="wide">{divinityPendingView &&
    <DivinityView divinityId={divinityPendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selectedDivinity` na store com o item da listagem
    e abre o `FormModal` (`title={selectedDivinity ? 'Editar divindade' :
    'Nova divindade'}`, `size="wide"`); o formulário busca o detalhe
    completo via `useGetEntityById<IDivinity>` usando `selectedDivinity.id`.
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja
    excluir a divindade "{name}"?`, usando `useDeleteEntity` contra `DELETE
    /divinities/:id`, invalidando `[['/divinities']]` e exibindo toast de
    sucesso/erro.

- Integrações com API consumidas por esta feature:
  - `GET /divinities` — listagem paginada de Divindades, filtro `name`.
  - `GET /divinities/:id` — detalhe completo (`IDivinity`), usado em modo
    edição (`DivinityCreateForm`) e na visualização (`DivinityView`).
  - `POST /divinities` / `PUT /divinities/:id` / `DELETE /divinities/:id`.
  - `GET /tags` — já existente, reaproveitado para popular as opções de
    `FormMultiAutocompleteInput` (campo Tags), sem novo hook.

- Formulário/validação (`divinityFormSchema`):
  - `name` → "Nome" → `FormTextInput` → obrigatório
    (`z.string().min(1, 'Informe o nome')`).
  - `referenceImage` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL válida via `refine` (mesmo padrão
    de `RaceFormSchema.referenceImageUrl`/`EraFormSchema.referenceImageUrl`
    — `z.string().refine((value) => value === '' ||
    z.string().url().safeParse(value).success, 'Informe uma URL de imagem
    válida')` — **não** usar `z.union`, mesmo bug já conhecido/documentado
    nas demais features).
  - `description` → "Descrição" → `FormRichTextInput` → opcional
    (`z.string()`, sem `refine` de não-vazio).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`).
  - Não há campo `order`/ordenação neste formulário.

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

Revisão completa dos arquivos da etapa "1. web-dev" (componentes
`DivinitiesFilterSection`, `DivinitiesList`/`DivinitiesListItem`,
`DivinityView`, `DivinityCreateForm`; página `divindades/page.tsx`;
interfaces `IDivinityListItem`/`IDivinity`/`IDivinityListFilters`; store
`useSelectedDivinityStore`; schema `divinityFormSchema`; rota `divinities:
'/divindades'` em `shared/routes.ts`; item "Divindades" no
`Sidebar/data/index.ts`) contra o `CLAUDE.md` e o plano fixado neste arquivo.

Nota sobre o ambiente desta revisão: o toolset deste agente (`web-dev-codereviewer`)
é restrito a Read/Grep/Glob/Edit (Edit só permitido em `.claude/tasks/**`), sem
acesso a shell/Bash — não foi possível rodar `npm run lint`/`npm run build`
dentro de `app-web` como sugerido no ponto 7 da tarefa. Em compensação, todos os
arquivos novos/alterados foram lidos por completo e conferidos assinatura a
assinatura contra os componentes/hooks genéricos realmente consumidos
(`FormMultiAutocompleteInput`, `FormTextInput`, `FormRichTextInput`,
`DefaultTextInput`, `useGetEntityList`/`useGetEntityById`/`usePostEntity`/
`usePutEntity`/`useDeleteEntity`, `ImageAvatarPreview`, `ImagePreviewDialog`,
`RichTextViewer`, `TagBadge`) e contra os DTOs reais do backend em
`app-api/src/modules/divinities/dto/` — nenhuma divergência de tipo, prop
inexistente ou import quebrado foi encontrada.

Nomenclatura de propriedades conferida campo a campo contra os DTOs reais do
backend:
- `IDivinityListItem` (`id`, `referenceImage?`, `name`, `tags`) bate
  exatamente com `DivinityListItemResponseDto` (`GET /divinities`).
- `IDivinity` (`id` via `IEntity`, `name`, `referenceImage?`, `description?`,
  `tags`, `createdAt`, `updatedAt`) bate exatamente com `DivinityResponseDto`
  (`GET /divinities/:id`).
- `IDivinityListFilters` (`name?`, `page?`, `perPage?`) bate exatamente com
  `FindDivinitiesQueryDto`.
- Payload de `DivinityCreateForm.buildPayload` (`{ name, referenceImage?,
  description?, tagIds? }`) bate exatamente com `CreateDivinityDto`/
  `UpdateDivinityDto`.

Pontos de risco apontados pelo orquestrador, todos verificados e em
conformidade:
1. **Campo `referenceImage` literal, sem sufixo `Url`**: confirmado via busca
   textual — nenhuma ocorrência de `referenceImageUrl` em nenhum arquivo da
   feature `divindades` (interfaces, schema, payload, prop do form). O próprio
   backend (`CreateDivinityDto`) documenta essa divergência intencional no
   `@ApiPropertyOptional`, reforçando que não é lacuna.
2. **Layout de `DivinityView`**: confirmado — imagem retrato `width: 300,
   height: 400` (proporção 3:4, diferente do quadrado 400x400 de `RaceView`),
   coluna lateral com `Title` (nome) → `Chip`s de tags (condicional a
   `tags.length > 0`) → `DivinitySectionBox` de Descrição, tudo dentro de uma
   única `div.flex flex-col gap-4 sm:flex-row`, sem nenhuma seção full-width
   adicional abaixo (diferente de `RaceView`, que tem
   `physicalCharacteristics`/`description` como seções full-width separadas
   após a linha imagem+coluna).
3. **Nenhum componente de "view" genérico compartilhado**: confirmado —
   `DivinityView` está em
   `app/(authorized)/divindades/components/DivinityView/index.tsx`, com seu
   próprio helper local `DivinitySectionBox` definido no mesmo arquivo (mesmo
   padrão de `RaceSectionBox`/`EraSectionBox`), sem importar nem ser
   importado por `RaceView`/`EraView`/`EventView`/`CreatureView`.
4. **Separação store vs. estado local de visualização**: confirmado em
   `divindades/page.tsx` — `useSelectedDivinityStore` (`selectedDivinity`) é
   usado apenas para abrir o `FormModal` em modo criar/editar (`handleEdit`,
   `handleOpenCreateModal`, `handleCloseFormModal`); a visualização usa o
   estado local `divinityPendingView` (`useState<IDivinityListItem | null>`),
   sem nenhuma mistura entre os dois fluxos.
5. **Ícones**: confirmado — todos os ícones da feature vêm de `react-icons/fi`
   (`FiSearch`, `FiEye`, `FiEdit2`, `FiTrash2`, `FiImage`, `FiFileText`,
   `FiSun` no Sidebar); a única outra importação de `react-icons` é o tipo
   `IconType` (utilitário de tipagem, não ícone), usado para tipar
   `DivinitySectionBox`. Nenhum `@mui/icons-material`, SVG customizado ou
   emoji. `IconButton`s sem texto visível (`DivinitiesListItem`, botão de
   ampliar imagem em `DivinityView`) têm `aria-label` em pt-BR ("Visualizar",
   "Editar", "Excluir", `Ampliar imagem de ${divinity.name}`).
6. **Posição do item "Divindades" no Sidebar**: confirmado em
   `Sidebar/data/index.ts` — dentro da seção `'Mundo'` já existente (nenhuma
   seção nova criada), na ordem Criaturas → **Divindades** → Locais → Raças,
   mantendo a ordem alfabética já existente na seção; ícone `FiSun` não
   repetido em nenhum outro item do arquivo.
7. **Lint/build**: não executado nesta revisão por falta de acesso a
   shell/Bash no toolset deste agente (ver nota acima); recomenda-se que o
   orquestrador rode `npm run lint`/`npm run build` dentro de `app-web` antes
   do merge, já que nenhuma etapa desta task teve acesso a esse tooling.

Reaproveitamento e demais convenções: `DivinitiesFilterSection`,
`DivinitiesList`/`DivinitiesListItem`, `DivinityCreateForm` espelham
fielmente `ErasFilterSection`/`RacesList`/`RacesListItem`/`RaceCreateForm`
(mesma estrutura de props, mesmos componentes genéricos reaproveitados —
`ImageAvatarPreview`, `ImagePreviewDialog`, `RichTextViewer`, `TagBadge`,
`FormModal`, `ViewModal`, `ConfirmationModal`, `PageContainer`,
`Title`/`Label`/`DefaultText`, `PrimaryButton`, `FormTextInput`,
`FormRichTextInput`, `FormMultiAutocompleteInput`, `DefaultTextInput`), sem
nenhum componente duplicado. `useSelectedDivinityStore` segue exatamente o
padrão de `useSelectedRaceStore`/`useSelectedEraStore`. `divinityFormSchema`
segue exatamente o padrão de `eraFormSchema`/`raceFormSchema` (mesmo
`refine` de URL, mesmo motivo documentado de não usar `z.union`). `onEdit`/
`onView`/`onDelete` no `FormModal`/`ConfirmationModal`/`ViewModal` invalidam
`[['/divinities']]` após criar/editar/excluir, garantindo que a listagem
recarregue sozinha sem `refetch()` manual. Rota `/divindades` sem colisão com
nenhuma rota existente.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx`,
`app-web/src/app/(authorized)/divindades/components/DivinitiesListItem/index.tsx`,
`app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx`,
`app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`,
`app-web/src/app/(authorized)/divindades/page.tsx`,
`app-web/src/shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`app-web/src/shared/interfaces/Entities/Divinity/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/store/PageStore/DivinitiesStore/index.ts`,
`app-web/src/store/index.ts`,
`app-web/src/shared/formSchemas/DivinityFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`.
