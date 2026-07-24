# Task Web: Campo Categoria no cadastro de Divindades

## Contexto
Não há `spec.md` para esta demanda; o pedido do usuário é a base factual do
planejamento. O backend desta mesma demanda (`.claude/tasks/divindades-categoria/task-api.md`)
irá expor `GET /divinities/categories` (mesmo formato de `GET /races/categories` e
`GET /creatures/categories`, retornando um array `{ id, name }[]` sem paginação) e
passará a incluir `category` nos DTOs de Divinity (detalhe, item de listagem) e aceitar
`categoryId` no create/update. Esta task web só deve ser executada após o backend
concluído. A implementação segue exatamente o padrão já usado em `racas`
(`app-web/src/app/(authorized)/racas/`) e `criaturas`
(`app-web/src/app/(authorized)/criaturas/`) para `RaceCategory`/`CreatureCategory`.

## Etapas

### 1. web-dev

#### Funcionalidade

Nenhum componente novo de `shared/components/` é necessário: `FormAutocompleteInput`
e `DefaultAutocompleteInput` (usados em `RaceCreateForm` e `RacesFilterSection`) já
existem e cobrem o caso de uso. A `DivinitiesFilterSection`
(`app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`)
já existe como componente próprio da página (padrão `web-secao-filtros`) e deve ser
apenas estendida com o filtro de categoria, replicando `RacesFilterSection`
(`app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx`).

**Interface (`shared/interfaces/Entities/Divinity/index.ts`)**
- Adicionar `IDivinityCategory { id: string; name: string }`, seguindo `IRaceCategory`
  em `shared/interfaces/Entities/Race/index.ts`.
- Adicionar `category: IDivinityCategory` em `IDivinityListItem` e em `IDivinity`.
- Adicionar `categoryId?: string` em `IDivinityListFilters`.

**Hook de query (`hooks/Queries/EntityQueries/useDivinityCategoriesQuery/index.ts`)**
- Criar hook `useDivinityCategoriesQuery`, espelhando
  `hooks/Queries/EntityQueries/useRaceCategoriesQuery/index.ts`: `useQuery` com
  `queryKey: ['/divinities/categories']`, `queryFn` usando `ApiFactory(getAuthToken())`
  para `GET /divinities/categories`, `staleTime: 5 * 60 * 1000`.
- Exportar o novo hook em `hooks/Queries/EntityQueries/index.ts`.

**Schema de formulário (`shared/formSchemas/DivinityFormSchema/index.ts`)**
- Adicionar `categoryId: z.string().min(1, 'Selecione a categoria')` ao
  `divinityFormSchema`, seguindo `raceFormSchema`.
- Adicionar `categoryId: ''` a `divinityFormDefaultValues`.

**Formulário — `DivinityCreateForm`**
(`app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`)
- Buscar as opções com `useDivinityCategoriesQuery()`.
- Adicionar `FormAutocompleteInput<DivinityFormData, IDivinityCategory>` para
  `categoryId` (label "Categoria", `getOptionLabel={(category) => category.name}`,
  `getOptionValue={(category) => category.id}`, placeholder "Selecione a categoria"),
  posicionado no mesmo grid dos demais campos, seguindo exatamente `RaceCreateForm`.
- No `reset()` do modo de edição, incluir `categoryId: divinityDetail.category.id`.
- Nenhuma mudança adicional é necessária em `buildPayload`/mutations: `categoryId` já
  fará parte de `DivinityFormData` e será enviado no payload de create/update.

**Página de listagem — `divindades/page.tsx`**
(`app-web/src/app/(authorized)/divindades/page.tsx`)
- Buscar as categorias com `useDivinityCategoriesQuery()`.
- Adicionar estado `categoryFilter: IDivinityCategory | null`.
- Passar `categoryValue`/`onCategoryChange`/`categories` para `DivinitiesFilterSection`.
- Em `handleSearch`, incluir `categoryId: categoryFilter?.id` nos filtros enviados a
  `useGetEntityList<IDivinityListItem, IDivinityListFilters>` (integração com
  `GET /divinities`, que passará a aceitar `categoryId` como query param).

**`DivinitiesFilterSection`**
(`app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`)
- Adicionar props `categoryValue: IDivinityCategory | null`,
  `onCategoryChange: (value: IDivinityCategory | null) => void`,
  `categories: IDivinityCategory[]`.
- Adicionar `DefaultAutocompleteInput<IDivinityCategory>` (label "Categoria",
  placeholder "Todas as categorias"), seguindo exatamente `RacesFilterSection`.

**Listagem — `DivinitiesList` e `DivinitiesListItem`**
(`app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx` e
`.../DivinitiesListItem/index.tsx`)
- Adicionar coluna "Categoria" no `TableHead` de `DivinitiesList` (entre "Nome" e
  "Tags", como em `RacesList`) e ajustar o `colSpan` da linha de "nenhum resultado"
  de 4 para 5.
- Em `DivinitiesListItem`, adicionar `<TableCell>` exibindo `divinity.category.name`,
  seguindo `RacesListItem`.

**Visualização — `DivinityView`**
(`app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx`)
- Adicionar o bloco de "Categoria" (ícone `FiTag`, `Label` + `DefaultText` com
  `divinity.category.name`, dentro de `APP_CONTAINER_STYLES.detailInfoField`), no
  mesmo local/estilo em que `RaceView` exibe `race.category.name`.

**Integrações com API**
- `GET /divinities/categories` — carregar opções do autocomplete (form e filtro).
- `GET /divinities` — passa a aceitar `categoryId` como filtro de busca; resposta de
  cada item passa a incluir `category`.
- `GET /divinities/:id` — resposta passa a incluir `category`.
- `POST /divinities` e `PUT /divinities/:id` — payload passa a incluir `categoryId`
  obrigatório.

**Formulário/validação**
- Novo campo `categoryId` (string, obrigatório) no `divinityFormSchema`: "Selecione a
  categoria" como mensagem de erro quando vazio, igual ao padrão de `raceFormSchema`
  e `creatureFormSchema`.

Status: concluído
Componentes: app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx, app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx, app-web/src/app/(authorized)/divindades/components/DivinitiesListItem/index.tsx, app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx, app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx
Arquivos: app-web/src/shared/interfaces/Entities/Divinity/index.ts, app-web/src/hooks/Queries/EntityQueries/useDivinityCategoriesQuery/index.ts, app-web/src/hooks/Queries/EntityQueries/index.ts, app-web/src/shared/formSchemas/DivinityFormSchema/index.ts, app-web/src/app/(authorized)/divindades/page.tsx

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. A implementação do
campo/filtro Categoria de Divindade replica fielmente o padrão de referência das
features `racas` (`RaceCategory`) e `criaturas` (`CreatureCategory`), sem
divergências relevantes além das esperadas pela diferença de domínio (ex.:
`referenceImage` em vez de `referenceImageUrl`).

Arquivos conferidos:
- `app-web/src/shared/interfaces/Entities/Divinity/index.ts` — `IDivinityCategory`
  criada igual a `IRaceCategory`; `category: IDivinityCategory` adicionado em
  `IDivinityListItem` e `IDivinity`; `categoryId?: string` adicionado em
  `IDivinityListFilters`. Exportado corretamente via barrel
  `shared/interfaces/Entities` → `shared/interfaces/index.ts`.
- `app-web/src/hooks/Queries/EntityQueries/useDivinityCategoriesQuery/index.ts` —
  espelha exatamente `useRaceCategoriesQuery` (`queryKey: ['/divinities/categories']`,
  `ApiFactory(getAuthToken())`, `GET /divinities/categories`,
  `staleTime: 5 * 60 * 1000`). Exportado em
  `app-web/src/hooks/Queries/EntityQueries/index.ts`.
- `app-web/src/shared/formSchemas/DivinityFormSchema/index.ts` —
  `categoryId: z.string().min(1, 'Selecione a categoria')` e
  `categoryId: ''` em `divinityFormDefaultValues`, idêntico a `raceFormSchema`.
- `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx` —
  usa `useDivinityCategoriesQuery()`, `FormAutocompleteInput<DivinityFormData,
  IDivinityCategory>` com `getOptionLabel`/`getOptionValue`/placeholder corretos, no
  mesmo grid dos demais campos; `reset()` do modo edição inclui
  `categoryId: divinityDetail.category.id`; mutations de create/update mantêm
  `invalidateQueryKeys: [['/divinities']]`; modo criar/editar segue derivado de
  `useSelectedDivinityStore` (padrão `web-form-cadastro`), sem props manuais.
- `app-web/src/app/(authorized)/divindades/page.tsx` — busca categorias com
  `useDivinityCategoriesQuery()`, estado `categoryFilter: IDivinityCategory | null`,
  props `categoryValue`/`onCategoryChange`/`categories` passadas para
  `DivinitiesFilterSection`, e `categoryId: categoryFilter?.id` incluído em
  `handleSearch`, tudo consistente com `racas/page.tsx`.
- `app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`
  — componente apresentacional (sem estado/chamada de API própria), props
  `categoryValue`/`onCategoryChange`/`categories` adicionadas,
  `DefaultAutocompleteInput<IDivinityCategory>` com label "Categoria" e placeholder
  "Todas as categorias", igual a `RacesFilterSection`.
- `app-web/src/app/(authorized)/divindades/components/DivinitiesList/index.tsx` e
  `.../DivinitiesListItem/index.tsx` — coluna "Categoria" adicionada no `TableHead`
  entre "Nome" e "Tags", `colSpan` da linha vazia ajustado de 4 para 5, e
  `DivinitiesListItem` exibe `divinity.category.name`, replicando `RacesList`/
  `RacesListItem`.
- `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx` —
  bloco "Categoria" com ícone `FiTag` (de `react-icons/fi`), `Label` + `DefaultText`
  exibindo `divinity.category.name`, dentro de
  `APP_CONTAINER_STYLES.detailInfoField`, no mesmo estilo/posição de `RaceView`.

Pontos adicionais verificados sem achados: uso de hooks genéricos de `hooks/Queries`
(nenhum `useQuery`/`useMutation` bespoke), tratamento de loading/erro (spinner +
`showToast` em pt-BR) preservado nos componentes tocados, ícones exclusivamente de
`react-icons`, textos em pt-BR consistentes, nenhuma duplicação de componente e uso
correto das constantes `APP_COLORS`/`APP_CONTAINER_STYLES`/`APP_DEFAULT_PAGE_SIZE` e
de `shared/routes.ts` (nenhuma rota hardcoded introduzida).
