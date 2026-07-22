# Task Web: Locais

## Contexto

Não há `.claude/tasks/locais/spec.md` — requisito já esclarecido diretamente pelo
usuário (orquestrador), sem necessidade de rodar o agente `spec`. Este plano foi
elaborado com base direta no pedido detalhado recebido, investigando os padrões já
existentes em `app-web/src/app/(authorized)/criaturas/` (referência de CRUD completo
mais próxima: listagem + filtro + `FormModal` de criar/editar + `ViewModal` de
visualização + tags) e em `shared/components/`.

**Contrato de API fechado** (implementado em paralelo pela task-api do mesmo slug,
`.claude/tasks/locais/task-api.md` — nomes de propriedade em inglês, batendo com o
JSON do backend):
- `GET /locations` — paginado, filtros `name` (parcial) e `type` (parcial), retorna
  `{ data: ILocationListItem[], total, page, perPage }`.
- `GET /locations/:id` — retorna `ILocation` completo, incluindo `pointsOfInterest`
  e `pointsOfInterestOf` (ambos `ILocationSummary[]`, versão rasa sem aninhamento
  recursivo).
- `POST /locations` / `PUT /locations/:id` — payload `{ name, type?,
  referenceImageUrl?, description?, tagIds?, pointsOfInterestIds? }`.
  `pointsOfInterestOf` não é enviável (somente leitura, calculado pelo backend a
  partir do `pointsOfInterestIds` de outros locais).
- `DELETE /locations/:id` — 204.

**Nomenclatura das propriedades:** todas as interfaces, filtros, o schema zod e o
uso nos componentes usam nomes de propriedade em inglês batendo com o JSON acima.
Apenas rótulos de UI, placeholders, toasts e mensagens de validação permanecem em
pt-BR.

**Investigação de código existente relevante:**
- Feature `criaturas` é a referência direta de estrutura: `page.tsx` (filtros +
  `FormModal` + `ViewModal` + `ConfirmationModal`, com estado local
  `creaturePendingView`/`creaturePendingDelete` e `useSelectedCreatureStore` para
  modo criar/editar), `CreaturesFilterSection` (padrão `web-secao-filtros` — inputs
  de filtro nunca inline em `page.tsx`), `CreaturesList`/`CreaturesListItem` (tabela
  paginada com coluna de imagem via `ImageAvatarPreview`, coluna de tags via
  `TagBadge`, ações via `IconButton`+`Tooltip`), `CreatureCreateForm` (schema único
  sem variante de edição, `useGetEntityById` para popular o `reset` em modo edição,
  `usePostEntity`/`usePutEntity` com `invalidateQueryKeys`), `CreatureView` (layout
  de visualização com `RichTextViewer`, tratamento de 404 via prop `onNotFound`).
- Componentes genéricos já existentes e diretamente reaproveitáveis, sem
  necessidade de recriação: `ImageAvatarPreview`, `ImagePreviewDialog`,
  `RichTextViewer`, `FormModal`, `ViewModal`, `ConfirmationModal`, `PageContainer`,
  `Title`/`Label`/`DefaultText`, `PrimaryButton`, `FormTextInput`,
  `FormRichTextInput`, `FormAutocompleteInput`, `FormMultiAutocompleteInput`,
  `DefaultTextInput`, `TagBadge`, hooks `useGetEntityList`/`useGetEntityById`/
  `usePostEntity`/`usePutEntity`/`useDeleteEntity` de `hooks/Queries`.
- **Mecanismo de navegação aninhada já existente e reaproveitável**:
  `useEntityMentionViewStore` (`store/EntityMentionViewStore`, estado global
  `pendingView: { entityType, entityId } | null` + ações `openEntityView`/
  `closeEntityView`) e `EntityMentionViewDispatcher`
  (`shared/components/EntityMentionViewDispatcher`, montado uma única vez em
  `app/(authorized)/layout.tsx`, mantém um registro `entityType -> componente de
  view` e renderiza um `ViewModal` global quando há `pendingView`). Foi criado
  originalmente para abrir a view de uma entidade ao clicar numa `@menção` dentro
  de rich text, mas já é implementado de forma genérica por `entityType`, não
  acoplado a rich text. Como o requisito de "Pontos de Interesse" pede exatamente
  o mesmo comportamento (clicar em "visualizar" num card relacionado abre o modal
  de visualização daquele local, inclusive quando já dentro de outro modal),
  **este plano reaproveita esse mecanismo** em vez de criar um novo estado
  "location sendo visualizada" — evitando duplicar uma solução já validada e já
  confirmada (nos plans anteriores) como capaz de empilhar um novo `ViewModal`
  sobre um `Dialog`/`ViewModal` já aberto (MUI empilha `Dialog`s por padrão).
  Detalhe de comportamento a documentar (não é uma lacuna, é uma característica já
  existente do mecanismo, replicada aqui): como `pendingView` é um único estado
  global (não uma pilha), clicar num card "visualizar" a partir de uma
  visualização que já esteja aberta *através do próprio dispatcher* apenas troca o
  conteúdo do mesmo `ViewModal` (sem empilhar um novo `Dialog`); já clicar num card
  a partir do `FormModal` de edição ou da visualização aberta via estado local da
  página (ver abaixo) abre um novo `ViewModal` empilhado por cima (`Dialog`
  diferente). Isso é suficiente para atender "reabertura aninhada" sem exigir
  nenhum novo mecanismo de estado.
- **Não existe** hoje nenhum componente de "card de entidade relacionada"
  (imagem + nome + ações de visualizar/remover) reaproveitável em
  `shared/components/` nem em `criaturas/` — precisa ser criado
  (`LocationPointOfInterestCard`).
- **Não existe** hoje nenhum padrão de "autocomplete que busca por texto digitado
  contra a API e, ao selecionar, adiciona a uma lista local em vez de vincular
  direto a um campo do formulário" — precisa ser criado
  (`LocationPointsOfInterestField`), usando `useGetEntityList` normalmente (o
  `queryKey` já inclui `filters`, então mudar o texto digitado já dispara um novo
  fetch automaticamente via TanStack Query, sem infraestrutura de debounce
  dedicada — um debounce leve é uma melhoria opcional de implementação, não
  bloqueante).
- `DefaultAutocompleteInput` (`shared/components/Inputs/DefaultInputs/`) hoje não
  expõe `inputValue`/`onInputChange` (só `value`/`onChange` do item selecionado),
  necessário para capturar o texto digitado e alimentar o filtro `name` da busca
  de pontos de interesse — precisa ganhar essas duas props opcionais (mudança
  retrocompatível: MUI `Autocomplete` já trata ambas como opcionais, e o uso
  existente em `CreaturesFilterSection` não passa nenhuma das duas).
- `EntityMentionViewDispatcher` precisa ganhar uma nova entrada no seu registro
  interno (`location -> LocationView`), da mesma forma que já registra
  `creature -> CreatureView`.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/locais/components/LocationPointOfInterestCard/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationPointsOfInterestField/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsFilterSection/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsList/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsListItem/index.tsx;
app-web/src/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx
(extensão: props opcionais inputValue/onInputChange);
app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx (extensão:
entrada `location` no ENTITY_MENTION_VIEW_REGISTRY)
Arquivos: app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/index.tsx;
app-web/src/shared/interfaces/Entities/Location/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/store/PageStore/LocationsStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/LocationFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/locais/page.tsx;
app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationView/index.tsx.
Observação: seguindo decisão do orquestrador (registrada no prompt desta execução,
não uma decisão autônoma deste agente), o `LocationView` passou a exibir `type`
(quando presente, em um bloco no padrão `detailInfoField`) e `tags` (chips, mesmo
padrão de `CreatureView`) logo abaixo do nome e acima da imagem — preenchendo a
lacuna de requisito que a seção "Contexto" havia sinalizado sem decidir sozinha.
Nenhuma outra pendência.
Dependências: nenhuma

#### Componentes (necessário — nada equivalente existe hoje para estes casos)

- Componente: `LocationPointOfInterestCard` (novo, específico da feature —
  `app-web/src/app/(authorized)/locais/components/LocationPointOfInterestCard/index.tsx`,
  reaproveitado tanto pelo formulário quanto pelo modal de visualização).
  - Props: `location: ILocationSummary`; `onRemove?: () => void` (opcional —
    quando presente, exibe a ação "Excluir"; quando ausente, oculta essa ação,
    usado no modo somente-leitura do `LocationView`).
  - Comportamento esperado: renderiza uma linha/cartão compacto com borda (mesmo
    padrão visual de `APP_CONTAINER_STYLES.detailInfoField`, já usado em
    `CreatureView` para os campos de informação lateral), contendo
    `ImageAvatarPreview` (`imageUrl={location.referenceImageUrl}`,
    `alt={location.name}`) + `DefaultText` com `location.name`, e duas ações à
    direita: "Visualizar" (`IconButton`+`Tooltip`+`aria-label`, ícone `FiEye`,
    sempre presente) e "Excluir" (mesmo padrão, ícone `FiTrash2`, só renderizado
    quando `onRemove` for passado). A ação "Visualizar" **não recebe callback via
    prop** — chama diretamente
    `useEntityMentionViewStore((state) => state.openEntityView)('location',
    location.id)`, reaproveitando o mecanismo global de navegação aninhada
    descrito no Contexto (mesmo padrão de acoplamento direto ao store já usado em
    `EntityMentionNodeView` para abrir a view de uma entidade mencionada). A ação
    "Excluir" apenas invoca `onRemove()` — não chama nenhum endpoint (remoção é só
    da lista local do formulário, conforme o requisito).

- Componente: `LocationPointsOfInterestField` (novo, específico da feature —
  `app-web/src/app/(authorized)/locais/components/LocationPointsOfInterestField/index.tsx`).
  - Props: `value: ILocationSummary[]`; `onChange: (value: ILocationSummary[]) =>
    void`; `excludeLocationId?: string` (id do local em edição, para não
    aparecer como opção de si mesmo); `label?: string` (default "Pontos de
    Interesse").
  - Comportamento esperado:
    - Mantém um estado local de texto digitado (`searchText`) e busca via
      `useGetEntityList<ILocationListItem, ILocationListFilters>({ url:
      '/locations', filters: { name: searchText || undefined, perPage: 10 } })`
      — o `queryKey` de `useGetEntityList` já inclui `filters`, então a busca
      é refeita automaticamente a cada mudança de `searchText` (nenhum hook de
      debounce novo é necessário; um debounce leve, ex. 300ms, é uma melhoria
      opcional a critério do `web-dev`, não bloqueante).
    - Renderiza um `DefaultAutocompleteInput<ILocationListItem>` (com a extensão
      de `inputValue`/`onInputChange` descrita acima) com `label`, `options`
      calculado a partir de `data?.data ?? []` **filtrando** fora
      `excludeLocationId` e qualquer local cujo `id` já esteja em `value`
      (evita duplicar/auto-referenciar).
    - Ao selecionar uma opção (`onChange` do `Autocomplete`): mapeia a opção
      selecionada para `ILocationSummary` (`{ id, name, referenceImageUrl }`),
      chama `onChange([...value, novoItem])`, limpa `searchText` e o valor
      selecionado do autocomplete (volta a `null`/vazio) — o item nunca fica
      "selecionado" de forma persistente no campo de busca, só na lista abaixo.
    - Abaixo do autocomplete, renderiza `value.map((location) =>
      <LocationPointOfInterestCard key={location.id} location={location}
      onRemove={() => onChange(value.filter((item) => item.id !==
      location.id))} />)` — lista de cards com ação "Excluir" habilitada (por
      isso passa `onRemove`), diferente do uso em `LocationView` (ver abaixo).
    - Componente controlado (sem estado de "lista selecionada" próprio além do
      texto de busca) — a lista de pontos de interesse propriamente dita vive no
      componente pai (`LocationCreateForm`), reaproveitando o mesmo padrão de
      "componente de campo controlado" já usado pelos demais `FormInputs`, mas
      fora do `react-hook-form` (ver justificativa na seção Formulário/validação
      abaixo, sobre por que este campo não é gerenciado via `Controller`/zod).

- Componente: `LocationsFilterSection` (novo, específico da feature —
  `app-web/src/app/(authorized)/locais/components/LocationsFilterSection/index.tsx`,
  seguindo exatamente o padrão `web-secao-filtros` já usado por
  `CreaturesFilterSection` — inputs de filtro nunca inline em `page.tsx`).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `typeValue: string`; `onTypeChange: (value: string) => void`; `onSubmit:
    (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` com dois `DefaultTextInput` (Nome — busca
    parcial, com ícone `FiSearch`; Tipo — busca parcial, texto livre, sem
    ícone) e um `PrimaryButton` "Filtrar", mesmo layout/classes (`flex
    flex-wrap items-end gap-3`) de `CreaturesFilterSection`.

Estes três componentes, mais as duas extensões abaixo, precisam existir antes de
a funcionalidade consumi-los (mesma etapa/agente, sem necessidade de handoff
separado).

**Extensões de componentes já existentes (não são componentes novos, mas
alterações necessárias antes de serem consumidas pela funcionalidade):**

- `DefaultAutocompleteInput`
  (`shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx`):
  adicionar props opcionais `inputValue?: string` e `onInputChange?: (value:
  string) => void`, repassadas ao `Autocomplete` do MUI (`inputValue`/
  `onInputChange` do próprio MUI já são opcionais — quando omitidas, o
  componente MUI volta a gerenciar o texto digitado internamente, preservando o
  comportamento atual de `CreaturesFilterSection`, que não passa nenhuma das
  duas).
- `EntityMentionViewDispatcher`
  (`shared/components/EntityMentionViewDispatcher/index.tsx`): adicionar entrada
  `location: ({ entityId, onNotFound }) => <LocationView
  locationId={entityId} onNotFound={onNotFound} />` ao
  `ENTITY_MENTION_VIEW_REGISTRY`, mesmo padrão da entrada `creature` já
  existente. **Não** alterar `ENTITY_MENTION_VIEWABLE_TYPES`
  (`shared/constants/EntityMentions`) nem qualquer coisa relacionada à extensão
  de `@menção` do `FormRichTextInput`/`GET /search` — esta feature não pede
  Locais como entidade mencionável em rich text, apenas reaproveita o
  `ViewModal`+store globais já usados por esse mecanismo para a navegação
  aninhada dos cards de Pontos de Interesse.

#### Funcionalidade

- Rotas/constantes: adicionar `locations: '/locais'` em `MENU_ROUTES` e em
  `APP_ROUTES.private` (`app-web/src/shared/routes.ts`), mesmo padrão de
  `creatures`/`users`/`tags`.

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/index.tsx`):
  adicionar um novo item "Locais" na seção `title: 'Mundo'` já existente, logo
  após "Criaturas", apontando para `APP_ROUTES.private.locations`, com ícone
  `FiMapPin` (`react-icons/fi`), mesmo padrão de `NavItem` já usado para
  Criaturas.

- Interfaces (`app-web/src/shared/interfaces/Entities/Location/index.ts`,
  exportado em `Entities/index.ts`), com propriedades em inglês batendo com o
  JSON do backend (contrato fechado na seção Contexto):
  - `ILocationSummary`: `{ id: string; name: string; referenceImageUrl?: string
    | null }`.
  - `ILocationListItem`: `{ id: string; referenceImageUrl?: string | null; name:
    string; type?: string | null; tags: ITag[] }` — reaproveita `ITag` (já
    existente em `Entities/Tag`) diretamente, conforme o contrato fechado
    fornecido (diferente da decisão tomada para `ICreatureTag`, aqui o contrato
    já veio explicitamente como `ITag[]`).
  - `ILocation`: `{ id: string; name: string; type?: string | null;
    referenceImageUrl?: string | null; description?: string | null; tags:
    ITag[]; pointsOfInterest: ILocationSummary[]; pointsOfInterestOf:
    ILocationSummary[]; createdAt: string; updatedAt: string }` — `IEntity` só
    provê `id`, então `createdAt`/`updatedAt` são declarados explicitamente
    (mesmo padrão de `IUser`).
  - `ILocationListFilters`: `{ name?: string; type?: string; page?: number;
    perPage?: number }`.

- Store de feature (`app-web/src/store/PageStore/LocationsStore/index.ts`,
  exportado em `store/index.ts`): `useSelectedLocationStore`, seguindo
  exatamente o padrão de `useSelectedCreatureStore` — `selectedLocation:
  ILocationListItem | null`, `setSelectedLocation`, `resetSelectedLocation`.
  Usado apenas para controlar o modo criar/editar do `FormModal` (não para a
  visualização — ver decisão abaixo, mesma separação de responsabilidades já
  adotada em Criaturas).

- Schema de formulário
  (`app-web/src/shared/formSchemas/LocationFormSchema/index.ts`, exportado em
  `shared/formSchemas/index.ts`): `locationFormSchema` (zod), `LocationFormData`,
  `locationFormResolver`, `locationFormDefaultValues`, cobrindo **apenas** os
  campos genuinamente controlados por `react-hook-form` — `name`, `type`,
  `referenceImageUrl`, `description`, `tagIds` (ver campos e regras na seção
  "Formulário/validação" abaixo). **`pointsOfInterestIds` não faz parte deste
  schema** — decisão de design detalhada a seguir.

- Página de listagem (`app-web/src/app/(authorized)/locais/page.tsx`), seguindo
  a estrutura de `CreaturesPage`:
  - `PageContainer` com `Title` "Locais" e `PrimaryButton` "Novo" abrindo o
    `FormModal` em modo de criação (`resetSelectedLocation` antes de abrir).
  - Filtros via `LocationsFilterSection` (`nameValue`/`typeValue` em estado
    local, aplicados a `filters` do `useGetEntityList` — `name`/`type` — ao
    submeter).
  - Listagem via `useGetEntityList<ILocationListItem,
    ILocationListFilters>` contra `GET /locations`, com paginação
    (`APP_DEFAULT_PAGE_SIZE`, mesmo padrão de `TablePagination` de
    Criaturas/Usuários). Ordenação é responsabilidade do backend.
  - Componentes de tabela `LocationsList` + `LocationsListItem`
    (`app-web/src/app/(authorized)/locais/components/`, espelhando
    `CreaturesList`/`CreaturesListItem`), com colunas: Imagem
    (`ImageAvatarPreview`, `imageUrl={location.referenceImageUrl}`), Nome
    (`location.name`), Tipo (`location.type`, com um valor padrão simples — ex.
    `"—"` — quando ausente), Tags (`location.tags.map((tag) => <TagBadge
    key={tag.id} name={tag.name} color={tag.color} />)`, mesmo padrão de
    `CreaturesListItem`) e Ações (`FiEye`/`FiEdit2`/`FiTrash2`, mesmo padrão de
    ícones/tooltips). `colSpan` do estado vazio = `5`.
  - Visualização (mesma decisão de arquitetura já registrada em
    `criaturas-view-modal`, reaproveitada aqui): **não** usar
    `useSelectedLocationStore` para controlar o `ViewModal` da listagem — usar
    estado local `locationPendingView: ILocationListItem | null` na própria
    `page.tsx`, com `handleView(location)` setando esse estado e renderizando
    `<ViewModal open={!!locationPendingView} onClose={() =>
    setLocationPendingView(null)} title="Detalhes do Local" size="wide">`
    contendo `<LocationView locationId={locationPendingView.id} />`. Esse
    `ViewModal` local é distinto do `ViewModal` global renderizado pelo
    `EntityMentionViewDispatcher` (usado apenas pela navegação aninhada dos
    cards de Pontos de Interesse) — os dois podem coexistir abertos
    simultaneamente (`Dialog`s do MUI empilham por padrão), permitindo abrir um
    local relacionado por cima da visualização principal.
  - Edição: `onEdit` seta `selectedLocation` na store com o item da listagem e
    abre o `FormModal`; o formulário busca o detalhe completo via
    `useGetEntityById<ILocation>` usando `selectedLocation.id`.
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja excluir o
    local "{name}"?`, usando `useDeleteEntity` contra `DELETE /locations/:id`,
    invalidando a query de listagem (`['/locations']`) e exibindo toast de
    sucesso/erro (mesmo padrão de Criaturas).

- Formulário
  (`app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx`,
  espelhando `CreatureCreateForm`):
  - Estado local adicional (fora do `react-hook-form`): `const [pointsOfInterest,
    setPointsOfInterest] = useState<ILocationSummary[]>([])` — fonte única de
    verdade tanto para a lista de cards renderizada quanto para o
    `pointsOfInterestIds` enviado no payload (ver justificativa abaixo).
  - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>({ url:
    '/tags', filters: { perPage: 100 } })`, mesmo padrão (e mesma ressalva já
    conhecida sobre paginação) já usado em `CreatureCreateForm` — reaproveitado
    sem alteração.
  - Em modo edição, popular o formulário (`reset`) a partir de
    `useGetEntityById<ILocation>(GET /locations/:id)` quando os dados chegarem
    (`name`, `type ?? ''`, `referenceImageUrl ?? ''`, `description ?? ''`,
    `tagIds: locationDetail.tags?.map((tag) => tag.id) ?? []`), e
    **separadamente** `setPointsOfInterest(locationDetail.pointsOfInterest ??
    [])` (não passa por `reset`, pois não é um campo do `LocationFormData`).
    Mesmo tratamento de loading (`CircularProgress` + texto "Carregando dados do
    local...") e erro (`showToast`) já usado em `CreatureCreateForm`.
  - **Decisão de design — por que `pointsOfInterestIds` fica fora do schema
    zod/`react-hook-form`**: diferente de `tagIds` (que é um campo de seleção
    múltipla "normal", vinculado via `Controller` a um `FormMultiAutocompleteInput`
    e sempre presente como array de ids no estado do formulário), "Pontos de
    Interesse" não tem nenhum input diretamente vinculado a esse valor — o
    autocomplete de busca (`LocationPointsOfInterestField`) é só um mecanismo de
    *adição* à lista, que é exibida como cards, não como chips/valor de campo.
    Modelar isso como um campo real de `react-hook-form` exigiria sincronizar
    manualmente (`setValue`) um campo "fantasma" nunca vinculado a nenhum
    `Controller`/Input visível, só para satisfazer o tipo — em vez disso, o
    payload é montado diretamente a partir do estado local
    `pointsOfInterest` no momento do submit.
  - `buildPayload(data: LocationFormData, pointsOfInterest: ILocationSummary[]):
    LocationPayload` (interface `LocationPayload extends
    Omit<LocationFormData, 'referenceImageUrl'> { referenceImageUrl?: string;
    pointsOfInterestIds: string[] }`) — retorna `{ ...data, referenceImageUrl:
    data.referenceImageUrl || undefined, tagIds: data.tagIds ?? [],
    pointsOfInterestIds: pointsOfInterest.map((location) => location.id) }`,
    mesmo padrão de tratamento de `referenceImageUrl`/`tagIds` já usado em
    `CreatureCreateForm`.
  - Submissão: `usePostEntity` (`POST /locations`) em modo criação e
    `usePutEntity` (`PUT /locations/:id`) em modo edição, com
    `invalidateQueryKeys: [['/locations']]`, toasts de sucesso/erro em pt-BR
    (erro exibindo `error.response?.data?.message` quando disponível, mesmo
    padrão de Criaturas/Usuários).
  - Layout dos campos (`FormModal` `size="wide"`): grid de campos simples (Nome,
    Tipo, Imagem Referência, Tags — mesmo grid `sm:grid-cols-2 lg:grid-cols-4`
    de `CreatureCreateForm`), seguido por `FormRichTextInput` "Descrição" em
    largura total, seguido por `LocationPointsOfInterestField` (`value=
    {pointsOfInterest}`, `onChange={setPointsOfInterest}`,
    `excludeLocationId={selectedLocation?.id}`) também em largura total.

- Modal de visualização
  (`app-web/src/app/(authorized)/locais/components/LocationView/index.tsx`,
  novo — layout próprio, **diferente** do layout lado-a-lado de `CreatureView`):
  - Props: `locationId: string`; `onNotFound?: () => void` (mesmo propósito de
    `CreatureViewProps.onNotFound`, usado pelo `EntityMentionViewDispatcher` ao
    abrir a partir de um card de Ponto de Interesse cujo local relacionado tenha
    sido excluído nesse meio tempo).
  - Busca via `useGetEntityById<ILocation>({ url: \`/locations/${locationId}\`
    })`; mesmos estados de loading (`CircularProgress` + texto "Carregando
    dados do local...") e erro (diferenciando 404 → "Entidade não encontrada." +
    `onNotFound?.()`, de outros erros → mensagem genérica), mesmo padrão de
    `CreatureView`.
  - Layout do conteúdo, uma vez carregado, na ordem exata pedida:
    1. Nome do local (`Title`), centralizado, no topo — sem o estilo "lado a
       lado" usado em `CreatureView` (aqui ocupa a linha inteira, texto
       centralizado).
    2. Abaixo do nome, a imagem de referência (`Box component="img"` ou
       fallback com `FiImage`, mesmo tratamento de clique/`ImagePreviewDialog`
       já usado em `CreatureView`) ocupando toda a largura disponível do modal
       (`width: 100%`, altura fixa razoável, ex. `320px`, `objectFit: cover`) —
       **não** lado a lado com nenhuma outra informação.
    3. Abaixo da imagem, uma seção com a descrição: `Label` "Descrição" +
       `RichTextViewer value={location.description}` — reaproveitando o mesmo
       enquadramento visual (`APP_CONTAINER_STYLES.detailSectionBox`/
       `detailSectionBoxHeader` + ícone, ex. `FiFileText`) já usado por
       `CreatureSectionBox` em `CreatureView`, para manter consistência visual
       entre as duas telas.
    4. Abaixo da descrição, duas colunas lado a lado (`grid grid-cols-1
       sm:grid-cols-2 gap-4`):
       - "Pontos de Interesse": `Label`/`Title` + lista de
         `LocationPointOfInterestCard` (sem `onRemove`, portanto sem ação de
         excluir) a partir de `location.pointsOfInterest`; texto padrão (ex.
         "Nenhum ponto de interesse cadastrado.") quando vazio.
       - "Pontos de Interesse de": mesmo formato, a partir de
         `location.pointsOfInterestOf`; mesmo texto padrão adaptado quando
         vazio.
     - Clicar em "Visualizar" em qualquer card (dentro do formulário ou dentro
       deste próprio modal) abre a visualização do local relacionado através do
       mecanismo global `useEntityMentionViewStore`/`EntityMentionViewDispatcher`
       (chamado internamente pelo próprio `LocationPointOfInterestCard`, sem
       nenhum prop extra necessário aqui) — comportamento de empilhamento
       detalhado na seção Contexto.
  - **Lacuna de requisito sinalizada (não decidida sozinha)**: o pedido detalha
    a ordem exata do conteúdo do `LocationView` (nome → imagem → descrição →
    duas colunas de pontos de interesse) mas não menciona se/onde exibir `type`
    e `tags` do local nessa tela — diferente de `CreatureView`, que exibe
    categoria e tags junto às demais informações. Este plano **não** insere uma
    seção extra para `type`/`tags` no `LocationView` por conta própria (para não
    contradizer a ordem exata fornecida); se a exibição desses dois campos na
    visualização for desejada, é necessário confirmar antes ou depois desta
    implementação onde encaixá-los.

- Integrações com API consumidas por esta feature:
  - `GET /locations` — listagem paginada (filtros `name`/`type`) e busca de
    opções em `LocationPointsOfInterestField` (mesmo endpoint, filtro `name`,
    `perPage: 10`).
  - `GET /locations/:id` — detalhe completo (`ILocation`), usado em modo edição
    (`LocationCreateForm`) e em toda visualização (`LocationView`, tanto a
    principal quanto as abertas via card/menção).
  - `POST /locations` — criação.
  - `PUT /locations/:id` — atualização.
  - `DELETE /locations/:id` — exclusão.
  - `GET /tags` — já existente, reaproveitado para popular as opções de
    `FormMultiAutocompleteInput` (campo Tags), sem novo hook.

- Formulário/validação — lista canônica de campos (propriedade → label pt-BR →
  input → obrigatoriedade):
  - `name` → "Nome" → `FormTextInput` → obrigatório, texto não vazio.
  - `type` → "Tipo" → `FormTextInput` → opcional, texto livre.
  - `referenceImageUrl` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL válida via `refine` (mesmo padrão de
    `CreatureFormSchema.referenceImageUrl` — `z.string().refine((value) =>
    value === '' || z.string().url().safeParse(value).success, 'Informe uma
    URL de imagem válida')` — **não** usar `z.union([z.literal(''), ...])`,
    devido ao bug já conhecido/documentado de a mensagem pt-BR não ser exibida
    nesse padrão).
  - `description` → "Descrição" → `FormRichTextInput` → opcional (sem `refine`
    de não-vazio — diferente de `physicalCharacteristics` em Criatura, aqui não
    há requisito de obrigatoriedade).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional, array de zero
    ou mais ids de tag existentes, opções via `GET /tags`.
  - `pointsOfInterestIds` → "Pontos de Interesse" → **fora do schema zod**,
    campo gerenciado via `LocationPointsOfInterestField` + estado local
    `pointsOfInterest: ILocationSummary[]` em `LocationCreateForm` (ver decisão
    de design detalhada acima) → opcional, array de zero ou mais ids de local
    existentes (excluindo o próprio local em edição), montado apenas no momento
    do submit (`buildPayload`) — nunca enviado individualmente.

### 2. web-dev-codereviewer

- Revisar tudo acima.

## Revisão

Revisão completa dos arquivos da etapa "1. web-dev" (componentes novos da feature
`locais`, extensões de `DefaultAutocompleteInput` e `EntityMentionViewDispatcher`,
interfaces, store, schema, página, formulário e view) contra o `CLAUDE.md` e o plano
fixado neste arquivo, incluindo especificamente:

- A decisão do orquestrador (registrada no "Status" da etapa 1) de incluir `type` e
  `tags` no `LocationView`: confirmada como implementada corretamente —
  `app-web/src/app/(authorized)/locais/components/LocationView/index.tsx:70-111`
  exibe o nome (`Title`), logo abaixo um bloco `type` no padrão
  `APP_CONTAINER_STYLES.detailInfoField` (renderizado apenas quando presente, ícone
  `FiTag`) e os `tags` (chips coloridos com `getContrastTextColor`, mesmo padrão de
  `CreatureView`), tudo antes da imagem — exatamente a ordem descrita na Observação
  da etapa 1.
- O reaproveitamento de `useEntityMentionViewStore`/`EntityMentionViewDispatcher`
  para a navegação aninhada dos cards de Ponto de Interesse: confirmado.
  `LocationPointOfInterestCard`
  (`app-web/src/app/(authorized)/locais/components/LocationPointOfInterestCard/index.tsx:20-43`)
  chama `openEntityView('location', location.id)` diretamente do store, sem prop de
  callback; `EntityMentionViewDispatcher`
  (`app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx:26-28`) ganhou
  a entrada `location -> LocationView` no `ENTITY_MENTION_VIEW_REGISTRY`, seguindo
  exatamente o padrão já usado para `creature`; o dispatcher continua montado uma
  única vez em `app/(authorized)/layout.tsx`. Nenhum novo estado de "location sendo
  visualizada" foi criado — o `ViewModal` local de `page.tsx` (estado
  `locationPendingView`) e o `ViewModal` global do dispatcher coexistem como
  `Dialog`s distintos, permitindo o empilhamento descrito no Contexto.

Também foi conferido campo a campo o contrato de API fechado (`CreateLocationDto`,
`UpdateLocationDto`, `LocationResponseDto`, `LocationListItemResponseDto`,
`LocationShallowResponseDto` em `app-api/src/modules/locations/dto/`) contra
`ILocation`/`ILocationListItem`/`ILocationSummary`/`ILocationListFilters`
(`app-web/src/shared/interfaces/Entities/Location/index.ts`) e o payload montado em
`LocationCreateForm` (`buildPayload`) — nomes de propriedade e nulabilidade batem
exatamente (`type`/`referenceImageUrl`/`description` como `string | null` na leitura,
convertidos para `string | undefined` no envio quando vazios, mesmo padrão já usado em
`CreatureCreateForm`).

Também foi verificado em detalhe o fluxo de seleção do
`LocationPointsOfInterestField` (`DefaultAutocompleteInput` controlado com
`inputValue`/`onInputChange`, `value` sempre `null`): confirmado, via leitura do
código-fonte de `useAutocomplete` em
`app-web/node_modules/@mui/material/useAutocomplete/useAutocomplete.js`, que
`selectNewValue` chama `resetInputValue` (que dispara `onInputChange` com o label da
opção selecionada) **antes** de `handleValue` (que dispara nosso `onChange`/
`handleSelect`, que por sua vez chama `setSearchText('')` por último) — ou seja, o
campo de busca é corretamente limpo após a seleção, sem o bug de "texto digitado
volta a mostrar o nome selecionado" que a ordem inversa causaria.

Não foram encontrados problemas de erro de código, tipagem, nomenclatura/estrutura de
pastas, formulários, React Query, ícones ou acessibilidade básica nos arquivos
revisados. Nenhuma duplicação de componente já existente em `shared/components/` ou
em `criaturas/` foi introduzida — `LocationPointOfInterestCard` e
`LocationPointsOfInterestField` são, de fato, componentes novos sem equivalente
prévio, conforme já identificado na etapa 1. A seção de filtros
(`LocationsFilterSection`) é apresentacional, recebe valores/setters via props, sem
estado ou chamada de API própria, e não há nenhum `<form>` de filtro inline em
`page.tsx`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
app-web/src/app/(authorized)/locais/components/LocationPointOfInterestCard/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationPointsOfInterestField/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsFilterSection/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsList/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationsListItem/index.tsx;
app-web/src/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx;
app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx;
app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/index.tsx;
app-web/src/shared/interfaces/Entities/Location/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/store/PageStore/LocationsStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/LocationFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/locais/page.tsx;
app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx;
app-web/src/app/(authorized)/locais/components/LocationView/index.tsx.
