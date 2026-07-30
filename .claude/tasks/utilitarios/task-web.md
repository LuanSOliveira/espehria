# Task Web: Utilitários

## Contexto

Não há `.claude/tasks/utilitarios/spec.md` — requisito recebido diretamente
do orquestrador (pedido reproduzido integralmente na mensagem de disparo
desta task). O backend correspondente está sendo planejado em paralelo em
`.claude/tasks/utilitarios/task-api.md`.

O pedido é explícito: "Utilitários" deve se comportar **exatamente** como as
demais entidades da seção "Itens" (Equipamentos, Materiais, Consumíveis,
Munições) — mesmos campos, mesma listagem, mesmo formulário, mesma
visualização, apenas trocando nome/contexto. O plano histórico dessas 4
entidades está em `.claude/tasks/itens/task-web.md` e foi usado aqui como
base de replicação. **Página de referência escolhida para replicação linha a
linha: `app-web/src/app/(authorized)/materiais/`** (lida integralmente:
`page.tsx`, `components/{MaterialsFilterSection, MaterialsList,
MaterialsListItem, MaterialCreateForm, MaterialView}/index.tsx`,
`shared/interfaces/Entities/Material/index.ts`,
`store/PageStore/MaterialsStore/index.ts`,
`shared/formSchemas/MaterialFormSchema/index.ts`) — estrutura, nomes de
prop, estilos (`APP_COLORS`, `APP_CONTAINER_STYLES`), tratamento de
loading/erro e textos pt-BR (trocando apenas o gênero/artigo onde aplicável:
"o utilitário", igual ao gênero masculino já usado em "o equipamento"/"o
material") devem ser replicados sem alterações estruturais.

Componentes genéricos já existentes e diretamente reaproveitáveis, sem
necessidade de criação de nada em `shared/components/`: `ImageAvatarPreview`,
`ImagePreviewDialog`, `RichTextViewer`, `TagBadge`, `FormModal`, `ViewModal`,
`ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`,
`PrimaryButton`, `FormTextInput`, `FormRichTextInput`,
`FormMultiAutocompleteInput`, `DefaultTextInput`, hooks
`useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
`useDeleteEntity` de `hooks/Queries`, hook `useIsGoogleUser` de `hooks/Auth`,
interface `ITag` (via `GET /tags` com `useGetEntityList<ITag,
ITagListFilters>`).

### Contrato de API assumido (ver `task-api.md` em paralelo, mesmo slug)

Confirmado no pedido do orquestrador — mesmo shape usado por
`equipment`/`materials`/`consumables`/`ammunition`:
- `GET /utilities` — paginado, filtro `name` (parcial). Retorna `{ data:
  IUtilityListItem[], total, page, perPage, totalPages }`, cada item com
  `id`, `referenceImage`, `name`, `tags` (`ITag[]`).
- `GET /utilities/:id` — detalhe completo: `id`, `name`, `referenceImage`,
  `description`, `price`, `privateInformation`, `tags`, `createdAt`,
  `updatedAt`.
- `POST /utilities` / `PUT /utilities/:id` — payload `{ name,
  referenceImage?, description?, price?, privateInformation?, tagIds? }`.
  `name` é obrigatório e único no backend — a unicidade **não** é validada
  no zod do frontend (nenhuma das 4 entidades de referência faz essa
  checagem client-side); erro de duplicidade é exibido via
  `error.response?.data?.message` na mutation, mesmo padrão já usado.
- `DELETE /utilities/:id` — 204.
- `GET /search?query=...` (já existente) — passa a incluir também
  resultados de Utilitários (`entityType: 'utility'`), conforme
  `task-api.md` em paralelo. Nenhuma alteração de código é necessária no
  frontend para a busca em si, apenas os registros descritos na seção
  "Busca global / @menção" abaixo.

### Nomenclatura fixada (tabela, seguindo exatamente o padrão de `Material`)

| Item | Valor |
|---|---|
| Nome em inglês (singular) | `Utility` |
| Rota (`APP_ROUTES.private`) | `utilities: '/utilitarios'` |
| Endpoint | `/utilities` |
| Pasta de página | `app/(authorized)/utilitarios/` |
| `entityType` (search/@mention) | `utility` |
| Label pt-BR (mention) | `utilitário` |
| Interfaces | `IUtility`, `IUtilityListItem`, `IUtilityListFilters` |
| `FilterSection` | `UtilitiesFilterSection` |
| `List`/`ListItem` | `UtilitiesList`/`UtilitiesListItem` |
| `CreateForm` | `UtilityCreateForm` |
| `View` | `UtilityView` |
| Store | `useSelectedUtilityStore` (`store/PageStore/UtilitiesStore`) |
| Schema | `utilityFormSchema` (`shared/formSchemas/UtilityFormSchema`), tipo `UtilityFormData`, resolver `utilityFormResolver`, defaults `utilityFormDefaultValues` |
| Título da página | "Utilitários" |
| Item no singular (toasts/labels) | "utilitário"/"o utilitário" (masculino, mesmo padrão de "o equipamento"/"o material") |

*(Nomenclatura de arquivos segue exatamente a mesma distribução
singular/plural já usada em `Material`→`Materials`: interface e schema em
pasta singular `Utility`/`UtilityFormSchema`, `FilterSection`/`List`/
`ListItem` no plural `Utilities...`, `CreateForm`/`View`/store hook no
singular `UtilityCreateForm`/`UtilityView`/`useSelectedUtilityStore`, apesar
da pasta de store ser `UtilitiesStore` — mesma distribuição de
`MaterialsStore` contendo `useSelectedMaterialStore`.)*

### Navegação (Sidebar)

Item novo na seção `'Itens'` já existente em `NAV_SECTIONS`
(`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`), que hoje
contém, nesta ordem: Equipamentos, Materiais, Consumíveis, Munições. O
pedido não especifica a posição exata dentro da seção ("junto com as
entidades de item já existentes") — **assumido posicionamento como último
item da seção** (após Munições), por ser a opção de menor risco/menor
impacto visual sobre a ordem já estabelecida; sinalizado aqui caso o
usuário/revisor prefira outra posição. Ícone: nenhum dos já usados no
arquivo (`FiActivity`, `FiBookOpen`, `FiBriefcase`, `FiCalendar`, `FiClock`,
`FiCoffee`, `FiCrosshair`, `FiFeather`, `FiGitBranch`, `FiHome`, `FiMapPin`,
`FiPackage`, `FiSun`, `FiTag`, `FiTool`, `FiUser`, `FiUsers`, `FiZap`,
`MdOutlineFace`) pode ser reaproveitado — sugerido `FiSettings`
(`react-icons/fi`, remete a "utilitário/ferramentas gerais"), a critério do
`web-dev` trocar por outro ícone do mesmo pacote caso não pareça adequado,
desde que não repita nenhum ícone já usado no arquivo.

### Busca global / `@menção` (search)

Mesmo mecanismo já documentado em `.claude/tasks/itens/task-web.md`: não
existe uma barra de busca navegável separada — o único consumidor de `GET
/search` é a extensão de `@menção` do editor rich text
(`FormRichTextInput`), via quatro peças em `shared/` que precisam ganhar uma
entrada para `utility`:
- `ENTITY_MENTION_TYPE_LABELS` (`shared/constants/EntityMentions/index.ts`)
  — adicionar `utility: 'utilitário'`.
- `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (mesmo arquivo) — adicionar `utility:
  (id) => \`/utilities/${id}\``.
- `ENTITY_MENTION_VIEWABLE_TYPES` (mesmo arquivo) — adicionar `'utility'` à
  lista, tornando a tag de menção clicável.
- `ENTITY_MENTION_VIEW_REGISTRY`
  (`shared/components/EntityMentionViewDispatcher/index.tsx`) — adicionar
  `utility: ({ entityId, onNotFound }) => <UtilityView
  utilityId={entityId} onNotFound={onNotFound} />`, importando `UtilityView`
  de `@/app/(authorized)/utilitarios/components/UtilityView` (mesmo padrão
  de acoplamento `shared -> app` já usado nas entradas existentes).

Não existem hoje "ícones" nem "rota de destino do resultado" nesse
mecanismo (o clique numa menção abre um `ViewModal`, não navega para uma
rota) — este plano replica exatamente o padrão existente, sem inventar
navegação ou ícone de busca que não existem em nenhuma entidade hoje.

### Permissão Google

Aplicado o padrão default da skill `web-permissao-google-readonly` (nenhuma
instrução do pedido pede comportamento diferente — o pedido pede
explicitamente esse comportamento no item 4): botão "Novo" oculto e ações
Editar/Excluir ocultas em `UtilitiesListItem` para `provider: 'google'` via
`useIsGoogleUser`, mantendo somente "Visualizar". A seção "Informações
Privadas" também fica oculta na visualização para usuários Google
(`!isGoogleUser &&`), replicando exatamente `MaterialView`. O formulário de
criar/editar em si não precisa de nenhuma checagem adicional de
`isGoogleUser` — o acesso ao formulário já é bloqueado a montante (ação
"Editar"/"Novo" ocultas), mesmo padrão já usado em `MaterialCreateForm`.

## Etapas

### 1. web-dev
Status: concluído
Componentes:
- app-web/src/app/(authorized)/utilitarios/components/UtilitiesFilterSection/index.tsx
- app-web/src/app/(authorized)/utilitarios/components/UtilitiesList/index.tsx
- app-web/src/app/(authorized)/utilitarios/components/UtilitiesListItem/index.tsx
- app-web/src/app/(authorized)/utilitarios/components/UtilityView/index.tsx
- app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx
Arquivos:
- app-web/src/app/(authorized)/utilitarios/page.tsx
- app-web/src/shared/interfaces/Entities/Utility/index.ts (+ registro em Entities/index.ts)
- app-web/src/shared/formSchemas/UtilityFormSchema/index.ts (+ registro em formSchemas/index.ts)
- app-web/src/store/PageStore/UtilitiesStore/index.ts (+ registro em store/index.ts)
- app-web/src/shared/routes.ts (rota `utilities: '/utilitarios'` em MENU_ROUTES e APP_ROUTES.private)
- app-web/src/app/(authorized)/components/Sidebar/data/index.ts (item "Utilitários", ícone FiSettings, último item da seção "Itens")
- app-web/src/shared/constants/EntityMentions/index.ts (entradas `utility` em ENTITY_MENTION_TYPE_LABELS, ENTITY_MENTION_DETAIL_URL_BY_TYPE, ENTITY_MENTION_VIEWABLE_TYPES)
- app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx (entrada `utility` -> UtilityView)

#### Componentes

Replicar o template abaixo a partir de `materiais/components/`, seguindo a
tabela de nomenclatura acima. Todos os componentes são específicos de
página (`app/(authorized)/utilitarios/components/`), nunca em
`shared/components/` — mesmo critério já usado em `materiais`/
`organizacoes` (skill `web-componentes`).

- Componente: `UtilitiesFilterSection` (padrão `web-secao-filtros`,
  espelhando `MaterialsFilterSection`).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` (`mt-6 flex max-w-160 flex-wrap
    items-end gap-3`) com um único `DefaultTextInput` "Nome" (`id`
    `utilities-name-filter`, busca parcial, ícone `FiSearch`) e um
    `PrimaryButton` "Filtrar" — único filtro é nome, sem nenhum outro
    campo.

- Componentes: `UtilitiesList` + `UtilitiesListItem` (padrão
  `web-tabela-listagem`, espelhando `MaterialsList`/`MaterialsListItem`).
  - `UtilitiesListProps`: `utilities: IUtilityListItem[]`; `total: number`;
    `page: number`; `isLoading: boolean`; `onPageChange: (newPage: number)
    => void`; `onView: (item: IUtilityListItem) => void`; `onEdit: (item:
    IUtilityListItem) => void`; `onDelete: (item: IUtilityListItem) =>
    void`.
  - Comportamento esperado (`List`): `Table` com colunas "Imagem", "Nome",
    "Tags", "Ações" (`colSpan` do estado vazio = 4, texto pt-BR "Nenhum
    utilitário encontrado."), `TablePagination` com
    `APP_DEFAULT_PAGE_SIZE`, mesmas cores/bordas (`APP_COLORS.gold`) de
    `MaterialsList`. Sem coluna de preço na listagem, mesmo padrão das
    demais entidades de item.
  - `UtilitiesListItemProps`: `utility: IUtilityListItem` +
    `onView`/`onEdit`/`onDelete` (mesmas assinaturas acima).
  - Comportamento esperado (`ListItem`): célula "Imagem" via
    `ImageAvatarPreview imageUrl={utility.referenceImage}
    alt={utility.name}`, "Nome", "Tags" (`utility.tags.map((tag) =>
    <TagBadge key={tag.id} name={tag.name} color={tag.color} />)`), "Ações"
    com três `IconButton`+`Tooltip` — "Visualizar" (`FiEye`, sempre
    visível), "Editar" (`FiEdit2`) e "Excluir" (`FiTrash2`) — as duas
    últimas envolvidas em `{!isGoogleUser && (...)}` via `useIsGoogleUser`,
    checagem feita dentro do próprio `ListItem` (skill
    `web-permissao-google-readonly`), mesmo padrão visual
    (`sx={{ color: APP_COLORS.textBrownDark }}`) de `MaterialsListItem`.

- Componente: `UtilityView` (passado como `children` do `ViewModal`
  genérico; espelhando `MaterialView` integralmente).
  - Props: `utilityId: string`; `onNotFound?: () => void` (usado pelo
    `EntityMentionViewDispatcher`).
  - Comportamento esperado:
    - Busca via `useGetEntityById<IUtility>({ url:
      \`/utilities/${utilityId}\` })`. Loading: `CircularProgress` +
      `DefaultText` ("Carregando dados do utilitário..."). Erro:
      `showToast`, diferenciando 404 ("Entidade não encontrada." +
      `onNotFound?.()`) de outros erros (mensagem genérica), mesmo padrão
      de `MaterialView`.
    - Linha superior (`flex flex-col gap-4 sm:flex-row`):
      - Imagem quadrada 400x400 à esquerda (`objectFit: 'cover',
        borderRadius: '6px', border: 2px solid APP_COLORS.gold`, clicável
        para `ImagePreviewDialog` quando `referenceImage` presente;
        fallback com `FiImage` centralizado) — idêntico a `MaterialView`,
        não a variante retrato de `DivinityView`.
      - Coluna à direita (`flex w-full flex-col gap-3`), nesta ordem
        exata: 1) `Title` com o nome, mesmo override sem gradiente
        (`textAlign: 'left'`, `textTransform: 'none'`, `backgroundImage:
        'none'`, cor `APP_COLORS.textBrownDark`); 2) Tags em `Chip`
        coloridos, renderizado apenas quando `tags.length > 0`; 3) Bloco
        "Preço" no padrão `APP_CONTAINER_STYLES.detailInfoField`, ícone
        `FiDollarSign`, `Label` "Preço" + `DefaultText` com
        `utility.price || 'Não informado'` (bloco sempre renderizado, com
        fallback — mesma decisão já validada em `MaterialView`/demais
        entidades de item).
    - Abaixo, dois blocos full-width empilhados
      (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader` +
      `RichTextViewer`): 1) "Descrição" (ícone `FiFileText`,
      `value={utility.description}`); 2) "Informações Privadas" (ícone
      `FiLock`, `value={utility.privateInformation}`), envolvido em
      `{!isGoogleUser && (...)}`.

- Componente: `UtilityCreateForm` (dentro de `FormModal`, seguindo
  `web-form-cadastro`, espelhando `MaterialCreateForm`).
  - Props: `onSaved: () => void`.
  - Comportamento esperado:
    - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>({
      url: '/tags', filters: { perPage: 100 } })`.
    - Em modo edição (`isEditMode = !!selectedUtility` a partir da store),
      popula o formulário (`reset`) a partir de
      `useGetEntityById<IUtility>({ url:
      \`/utilities/${selectedUtility?.id}\`, enabled: isEditMode })`:
      `name`, `referenceImage: detail.referenceImage ?? ''`, `description:
      detail.description ?? ''`, `price: detail.price ?? ''`,
      `privateInformation: detail.privateInformation ?? ''`, `tagIds:
      detail.tags?.map((tag) => tag.id) ?? []`. Mesmo tratamento de loading
      (`CircularProgress` + "Carregando dados do utilitário...") e erro
      (`showToast`) de `MaterialCreateForm`.
    - `buildPayload(data): UtilityPayload` (interface `UtilityPayload
      extends Omit<UtilityFormData, 'referenceImage' | 'description' |
      'price' | 'privateInformation'> { referenceImage?: string;
      description?: string; price?: string; privateInformation?: string }`)
      — retorna `{ ...data, referenceImage: data.referenceImage ||
      undefined, description: data.description || undefined, price:
      data.price || undefined, privateInformation:
      data.privateInformation || undefined, tagIds: data.tagIds ?? [] }`.
    - Submissão: `usePostEntity<IUtility, UtilityPayload>` (`POST
      /utilities`) em criação e `usePutEntity<IUtility, UtilityPayload>`
      (`PUT /utilities/:id`) em edição, com `invalidateQueryKeys:
      [['/utilities']]`, toasts "Utilitário cadastrado com sucesso."/
      "Utilitário atualizado com sucesso." e erro exibindo
      `error.response?.data?.message` quando disponível (aqui é onde o
      erro de nome duplicado retornado pelo backend, se houver, seria
      exibido), mesmo padrão de `MaterialCreateForm`.
    - Layout (`FormModal` `size="wide"`): grid 1 (`sm:grid-cols-2
      lg:grid-cols-4`) com "Nome" (`FormTextInput`, obrigatório), "Imagem
      Referência" (`FormTextInput`, `name="referenceImage"`), "Preço"
      (`FormTextInput`, `name="price"`) e "Tags"
      (`FormMultiAutocompleteInput<UtilityFormData, ITag>`); grid 2
      (`lg:grid-cols-2`) com "Descrição" e "Informações Privadas" (ambos
      `FormRichTextInput`). `id`s dos inputs prefixados `utility-form-*`
      (ex.: `utility-form-name`), mesmo padrão de `material-form-*`.

Estes componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Rotas/constantes (`app-web/src/shared/routes.ts`): adicionar
  `utilities: '/utilitarios'` em `MENU_ROUTES` e replicada em
  `APP_ROUTES.private`, sem colisão com nenhuma rota já existente.

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`):
  novo item `{ label: 'Utilitários', href: APP_ROUTES.private.utilities,
  icon: FiSettings }` (ou outro ícone não repetido, ver seção Contexto)
  adicionado ao array `items` da seção já existente `'Itens'`, como último
  item (após Munições — posição assumida, ver observação na seção
  Contexto). Nenhuma alteração necessária em `Sidebar/index.tsx`/
  `SidebarSectionAccordion` (já iteram `NAV_SECTIONS` genericamente).

- Interfaces (nova pasta
  `app-web/src/shared/interfaces/Entities/Utility/index.ts`, exportada em
  `Entities/index.ts`), reaproveitando `ITag`/`IEntity` já existentes,
  mesmo shape de `Material`:
  - `IUtilityListItem`: `{ id: string; referenceImage?: string | null;
    name: string; tags: ITag[] }`.
  - `IUtility` (estende `IEntity`): `{ name: string; referenceImage?:
    string | null; description?: string | null; price?: string | null;
    privateInformation?: string | null; tags: ITag[]; createdAt: string;
    updatedAt: string }`.
  - `IUtilityListFilters`: `{ name?: string; page?: number; perPage?:
    number }`.

- Store de feature (`app-web/src/store/PageStore/UtilitiesStore/index.ts`,
  exportada em `store/index.ts`): `useSelectedUtilityStore`, mesmo padrão
  de `useSelectedMaterialStore` (`selectedUtility: IUtilityListItem |
  null`, `setSelectedUtility`, `resetSelectedUtility`). Usada apenas para o
  modo criar/editar do `FormModal` — a visualização usa estado local
  `utilityPendingView` na própria `page.tsx`.

- Schema de formulário
  (`app-web/src/shared/formSchemas/UtilityFormSchema/index.ts`, exportado
  em `shared/formSchemas/index.ts`): `utilityFormSchema`, `UtilityFormData`,
  `utilityFormResolver`, `utilityFormDefaultValues` (`{ name: '',
  referenceImage: '', price: '', tagIds: [], description: '',
  privateInformation: '' }`). Sem variante de edição (schema único para
  criar/editar), mesma decisão já usada em `Material`/`Organization`/
  `Divinity`/`Race`.

- Página de listagem
  (`app-web/src/app/(authorized)/utilitarios/page.tsx`), seguindo a
  estrutura de `MaterialsPage` (`materiais/page.tsx`):
  - `PageContainer` com `Title` "Utilitários" e `PrimaryButton` "Novo"
    abrindo o `FormModal` em modo criação (`resetSelectedUtility` antes de
    abrir), oculto para `provider: 'google'` (`!isGoogleUser &&`).
  - Filtros via `UtilitiesFilterSection` (`nameInput` em estado local,
    aplicado a `filters` do `useGetEntityList` como `name` — trim, `||
    undefined` — ao submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<IUtilityListItem, IUtilityListFilters>`
    contra `GET /utilities`, com paginação (`APP_DEFAULT_PAGE_SIZE`).
  - `UtilitiesList` recebendo os dados + `onView`/`onEdit`/`onDelete`.
  - Visualização: estado local `utilityPendingView: IUtilityListItem |
    null`; `handleView` seta esse estado; `<ViewModal
    open={!!utilityPendingView} onClose={() =>
    setUtilityPendingView(null)} title="Detalhes do Utilitário"
    size="wide">{utilityPendingView && <UtilityView
    utilityId={utilityPendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selectedUtility` na store com o item da
    listagem e abre o `FormModal` (`title={selectedUtility ? 'Editar
    utilitário' : 'Novo utilitário'}`, `size="wide"`).
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja
    excluir o utilitário "{name}"?`, usando `useDeleteEntity` contra
    `DELETE /utilities/:id`, invalidando `[['/utilities']]` e exibindo
    toast de sucesso ("Utilitário excluído com sucesso.") ou erro.

- Integrações com API:
  - `GET /utilities` — listagem paginada, filtro `name`.
  - `GET /utilities/:id` — detalhe completo, usado em modo edição
    (`UtilityCreateForm`) e na visualização (`UtilityView`).
  - `POST /utilities` / `PUT /utilities/:id` / `DELETE /utilities/:id`.
  - `GET /tags` — já existente, reaproveitado para as opções de
    `FormMultiAutocompleteInput` (campo Tags), sem novo hook.
  - `GET /search` — já existente, sem alteração de código no frontend além
    dos registros em `shared/constants/EntityMentions` e
    `EntityMentionViewDispatcher` descritos na seção Contexto (o backend é
    quem passa a incluir `utility` no resultado, via `task-api`).

- Formulário/validação (schema `utilityFormSchema`, idêntico ao das demais
  entidades de item):
  - `name` → "Nome" → `FormTextInput` → obrigatório
    (`z.string().min(1, 'Informe o nome')`) — único campo obrigatório no
    frontend (a unicidade de `name` é validada só no backend, erro exibido
    via toast na mutation).
  - `referenceImage` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL via `refine` (mesmo padrão de
    `MaterialFormSchema.referenceImage` — `z.string().refine((value) =>
    value === '' || z.string().url().safeParse(value).success, 'Informe
    uma URL de imagem válida')` — não usar `z.union`).
  - `price` → "Preço" → `FormTextInput` → opcional, texto livre
    (`z.string()`, sem `refine`, sem validação numérica).
  - `description` → "Descrição" → `FormRichTextInput` → opcional
    (`z.string()`, sem `refine` de não-vazio).
  - `privateInformation` → "Informações Privadas" → `FormRichTextInput` →
    opcional (`z.string()`), sem nenhuma checagem de `isGoogleUser` dentro
    do form.
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`).

- Acesso Google: padrão default aplicado (item 4 do pedido, coincide com o
  padrão da skill `web-permissao-google-readonly`) — botão "Novo" e ações
  Editar/Excluir ocultos para `provider: 'google'` (`useIsGoogleUser`),
  mantendo apenas "Visualizar"; seção "Informações Privadas" também oculta
  na visualização para esses usuários. Nenhuma instrução do pedido pede
  comportamento diferente do padrão.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Comparação linha a linha entre todos os arquivos da etapa "1. web-dev" e seus
equivalentes em `app-web/src/app/(authorized)/materiais/` (referência
escolhida na task). Todos os pares de arquivo abaixo foram lidos
integralmente e comparados:

- `utilitarios/page.tsx` vs `materiais/page.tsx`
- `UtilitiesFilterSection` vs `MaterialsFilterSection`
- `UtilitiesList`/`UtilitiesListItem` vs `MaterialsList`/`MaterialsListItem`
- `UtilityView` vs `MaterialView`
- `UtilityCreateForm` vs `MaterialCreateForm`
- `shared/interfaces/Entities/Utility` vs `.../Material` (+ registro em `Entities/index.ts`)
- `shared/formSchemas/UtilityFormSchema` vs `.../MaterialFormSchema` (+ registro em `formSchemas/index.ts`)
- `store/PageStore/UtilitiesStore` vs `.../MaterialsStore` (+ registro em `store/index.ts`)
- `shared/routes.ts` (`utilities: '/utilitarios'` em `MENU_ROUTES` e `APP_ROUTES.private`)
- `app/(authorized)/components/Sidebar/data/index.ts` (item "Utilitários", ícone `FiSettings`, último da seção "Itens")
- `shared/constants/EntityMentions/index.ts` (`utility` em `ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `ENTITY_MENTION_VIEWABLE_TYPES`)
- `shared/components/EntityMentionViewDispatcher/index.tsx` (`utility` -> `UtilityView`)

Achados:

- **Aderência à referência `materiais`**: todos os componentes de página
  (`UtilitiesFilterSection`, `UtilitiesList`, `UtilitiesListItem`,
  `UtilityView`, `UtilityCreateForm`) são réplicas estruturais exatas dos
  equivalentes em `materiais`, trocando apenas identificadores (`utility`/
  `Utility`/`utilities`) e textos pt-BR ("utilitário"/"o utilitário",
  gênero masculino consistente com "o material"). Mesmos props, mesmo
  layout de grid do formulário (`sm:grid-cols-2 lg:grid-cols-4` +
  `lg:grid-cols-2`), mesma ordem de campos, mesmos `id`s prefixados
  (`utility-form-*`), mesma estrutura de `UtilityView` (imagem 400x400,
  bloco de preço com fallback, blocos de Descrição/Informações Privadas).
- **Permissão Google**: `useIsGoogleUser` aplicado exatamente nos mesmos
  pontos que em `materiais` — botão "Novo" oculto em `page.tsx`, ações
  Editar/Excluir ocultas em `UtilitiesListItem`, bloco "Informações
  Privadas" oculto em `UtilityView`. `UtilityCreateForm` não faz checagem
  adicional, mesmo padrão de `MaterialCreateForm`.
- **@menção/busca**: as quatro entradas para `utility` foram registradas
  corretamente em `ENTITY_MENTION_TYPE_LABELS`,
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `ENTITY_MENTION_VIEWABLE_TYPES` e
  `ENTITY_MENTION_VIEW_REGISTRY` (import de `UtilityView` a partir de
  `@/app/(authorized)/utilitarios/components/UtilityView`, mesmo padrão de
  acoplamento `shared -> app` das demais entradas).
- **Rotas e Sidebar**: `utilities: '/utilitarios'` presente em
  `MENU_ROUTES` e `APP_ROUTES.private`, sem colisão com rota existente.
  Item "Utilitários" adicionado como último item da seção "Itens" (após
  Munições, conforme assumido na seção Contexto), com ícone `FiSettings`
  não repetido em nenhum outro item do arquivo `Sidebar/data/index.ts`
  (confirmado: único uso de `FiSettings` em todo `app-web/src`).
- **Hooks genéricos e `invalidateQueryKeys`**: `page.tsx` e
  `UtilityCreateForm` usam exclusivamente `useGetEntityList`,
  `useGetEntityById`, `usePostEntity`, `usePutEntity`, `useDeleteEntity` de
  `hooks/Queries` — nenhum `useQuery`/`useMutation` bespoke. Todas as
  mutations (`create`, `update`, `delete`) têm `invalidateQueryKeys:
  [['/utilities']]`, garantindo recarregamento automático da listagem sem
  `refetch()` manual.
- **Formulário/validação**: `utilityFormSchema` idêntico a
  `materialFormSchema` em estrutura — `name` obrigatório, `referenceImage`
  opcional com `refine` de URL (sem `z.union`), `price`/`description`/
  `privateInformation` como `z.string()` livre, `tagIds` opcional. Sem
  variante de edição, conforme especificado.
- **Tratamento de loading/erro**: `UtilityView` e `UtilityCreateForm`
  replicam o mesmo tratamento de `isLoading` (`CircularProgress` +
  `DefaultText`) e `isError` (`showToast`, diferenciando 404 de outros
  erros) de `MaterialView`/`MaterialCreateForm`.
- **Ícones**: todos os ícones usados (`FiSearch`, `FiEye`, `FiEdit2`,
  `FiTrash2`, `FiDollarSign`, `FiFileText`, `FiImage`, `FiLock`,
  `FiSettings`) vêm de `react-icons/fi`; nenhum `@mui/icons-material`, SVG
  customizado ou emoji. `IconButton`s de ação têm `aria-label` em pt-BR
  ("Visualizar"/"Editar"/"Excluir").
- **Reaproveitamento**: nenhum componente novo criado em
  `shared/components/`; todos os componentes genéricos listados no
  Contexto (`ImageAvatarPreview`, `ImagePreviewDialog`, `RichTextViewer`,
  `TagBadge`, `FormModal`, `ViewModal`, `ConfirmationModal`,
  `PageContainer`, `Title`/`Label`/`DefaultText`, `PrimaryButton`,
  `FormTextInput`, `FormRichTextInput`, `FormMultiAutocompleteInput`,
  `DefaultTextInput`) são reaproveitados sem duplicação.
- **Filtros**: `UtilitiesFilterSection` é apresentacional (recebe
  `nameValue`/`onNameChange`/`onSubmit` via props, sem estado ou chamada de
  API própria), único campo "Nome", conforme padrão `web-secao-filtros`.

Nenhum problema encontrado. Aprovado. Arquivos revisados:
`app-web/src/app/(authorized)/utilitarios/page.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilitiesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilitiesList/index.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilitiesListItem/index.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilityView/index.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx`,
`app-web/src/shared/interfaces/Entities/Utility/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/formSchemas/UtilityFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/store/PageStore/UtilitiesStore/index.ts`,
`app-web/src/store/index.ts`,
`app-web/src/shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`app-web/src/shared/constants/EntityMentions/index.ts`,
`app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`.
