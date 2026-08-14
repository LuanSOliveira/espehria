# Task Web: Filtro por tags (tagIds) na listagem de raças, criaturas, locais, eventos, eras e divindades

## Contexto
Não existe `.claude/tasks/filtro-tags-mundo/spec.md`. Ver
`.claude/tasks/filtro-tags-mundo/task-api.md` para o contexto da alteração de backend
(adição de `tagIds?: string[]` ao DTO de query e ao `findAllPaginated` dos 6 módulos:
`races`, `creatures`, `locations`, `events`, `eras`, `divinities`). Este plano cobre
apenas o `app-web` e assume que a API vai passar a aceitar `tagIds[]=uuid1&tagIds[]=uuid2`
na querystring de cada um dos 6 endpoints de listagem (`GET /races`, `GET /creatures`,
`GET /locations`, `GET /events`, `GET /eras`, `GET /divinities`), com semântica AND.

Padrão de referência obrigatório (já implementado, reaproveitar sem criar abstração
nova): feature `treinamentos` —
`app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`
(input de tags) e `app-web/src/app/(authorized)/treinamentos/page.tsx` (estado
`selectedTags`, `handleSearch` com `tagIds`, `handleClear`, `useTagOptionsQuery`).

## Levantamento feito nesta etapa de planejamento (confirmar novamente na implementação)

Nenhuma das 6 páginas hoje tem botão "Limpar filtros"/`handleClear`. Nomes reais
confirmados por leitura direta do código (o `web-dev` deve reconferir antes de editar,
sem assumir por convenção, pois nomes de props e arquivos podem ter mudado):

| Entidade  | FilterSection (arquivo)                                                    | Filtros atuais                          | Interface de filtros      | Hook de opções auxiliares      |
|-----------|------------------------------------------------------------------------------|------------------------------------------|-----------------------------|-----------------------------------|
| races     | `racas/components/RacesFilterSection/index.tsx` (`RacesFilterSectionProps`)  | `nameValue`, `categoryValue`             | `IRaceListFilters`          | `useRaceCategoriesQuery`          |
| creatures | `criaturas/components/CreaturesFilterSection/index.tsx` (`CreaturesFilterSectionProps`) | `nameValue`, `categoryValue`     | `ICreatureListFilters`      | `useCreatureCategoriesQuery`      |
| locations | `locais/components/LocationsFilterSection/index.tsx` (`LocationsFilterSectionProps`) | `nameValue`, `typeValue`            | `ILocationListFilters`      | —                                  |
| events    | `eventos/components/EventsFilterSection/index.tsx` (`EventsFilterSectionProps`) | `nameValue`, `startYearValue`, `endYearValue`, `eraValue` | `IEventListFilters` | `useErasAllQuery`                 |
| eras      | `eras/components/ErasFilterSection/index.tsx` (`ErasFilterSectionProps`)     | `nameValue`                              | `IEraListFilters`           | —                                  |
| divinities| `divindades/components/DivinitiesFilterSection/index.tsx` (`DivinitiesFilterSectionProps`) | `nameValue`, `categoryValue`   | `IDivinityListFilters`      | `useDivinityCategoriesQuery`      |

Todas as 6 `page.tsx` usam `useGetEntityList<TItem, TFilters>({ url, filters })` do mesmo
jeito que `treinamentos` (`app-web/src/hooks/Queries/DefaultQueries/useGetEntityList`),
que serializa `filters` via `params: filters` do Axios (`ApiFactory`). Nenhuma das 6
páginas usa caminho de fetch alternativo — a mesma serialização de array que já funciona
em `treinamentos` deve funcionar sem alteração nos 6 módulos.

`ITag` (`@/shared/interfaces` → `Entities/Tag`) e `formatTagLabel` (`@/shared/util` →
`FormatTagLabel`, assinatura `(tag: ITag) => string`) e `useTagOptionsQuery` (`@/hooks/Queries`,
retorna `{ tagOptions }` buscando `/tags`) já existem e devem ser reaproveitados
literalmente como em `treinamentos`, sem criar variantes.

Ponto de atenção específico de **creatures**: `ICreatureListFilters`/`ICreatureListItem`
usam hoje um tipo local `ICreatureTag` (mesmo shape de `ITag`: `id`, `name`, `color`) em
vez de `ITag`. Para o filtro de tags, usar `ITag` (vindo de `useTagOptionsQuery`), igual
às outras 5 páginas — não introduzir uma variante `ICreatureTag[]` para o filtro nem
tentar unificar/refatorar o tipo já existente em `ICreatureListItem` (fora de escopo
desta demanda).

## Etapas

### 1. web-dev
Status: concluído
Componentes:
- `app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/criaturas/components/CreaturesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/locais/components/LocationsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/eventos/components/EventsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx`
- `app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`

Em todos os 6, adicionadas as props `tagsValue`, `onTagsChange`, `tagOptions` e `onClear`,
o campo `DefaultMultiAutocompleteInput<ITag>` de tags (com `getOptionLabel={formatTagLabel}`,
`getOptionValue`, `getOptionColor`) e o `SecondaryButton` "Limpar filtros" ao lado do
"Filtrar", replicando `TrainingsFilterSection`. Ajustes de layout do `<form>`:
`RacesFilterSection`/`CreaturesFilterSection`/`DivinitiesFilterSection`: `max-w-160` →
`max-w-220`. `LocationsFilterSection`: `max-w-160` → `max-w-220`. `EventsFilterSection`:
mantido sem `max-w-*` fixo (já usava `flex-wrap`). `ErasFilterSection`: `max-w-90` sem
`flex-wrap` → `max-w-180` com `flex-wrap` adicionado.

Arquivos:
- `app-web/src/shared/interfaces/Entities/Race/index.ts` — `tagIds?: string[]` em
  `IRaceListFilters`.
- `app-web/src/shared/interfaces/Entities/Creature/index.ts` — `tagIds?: string[]` em
  `ICreatureListFilters` (mantido `ICreatureTag`/`ICreatureListItem` sem alteração; o
  filtro usa `ITag`, não `ICreatureTag`).
- `app-web/src/shared/interfaces/Entities/Location/index.ts` — `tagIds?: string[]` em
  `ILocationListFilters`.
- `app-web/src/shared/interfaces/Entities/Event/index.ts` — `tagIds?: string[]` em
  `IEventListFilters`.
- `app-web/src/shared/interfaces/Entities/Era/index.ts` — `tagIds?: string[]` em
  `IEraListFilters`.
- `app-web/src/shared/interfaces/Entities/Divinity/index.ts` — `tagIds?: string[]` em
  `IDivinityListFilters`.
- `app-web/src/app/(authorized)/racas/page.tsx`
- `app-web/src/app/(authorized)/criaturas/page.tsx`
- `app-web/src/app/(authorized)/locais/page.tsx`
- `app-web/src/app/(authorized)/eventos/page.tsx`
- `app-web/src/app/(authorized)/eras/page.tsx`
- `app-web/src/app/(authorized)/divindades/page.tsx`

Em cada `page.tsx`: adicionado `const [selectedTags, setSelectedTags] = useState<ITag[]>([])`,
`const { tagOptions } = useTagOptionsQuery()`, inclusão de `tagIds` em `handleSearch`, nova
função `handleClear` (resetando todos os filtros da página, incluindo tags, e chamando
`setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`) e passagem de `tagsValue`,
`onTagsChange`, `tagOptions`, `onClear` ao respectivo `*FilterSection`. Nenhum endpoint novo;
`GET /tags` via `useTagOptionsQuery` (hook já existente) e `tagIds` incluído na querystring
de cada `useGetEntityList` já existente quando há tags selecionadas.

#### Componentes — alterar os 6 `*FilterSection` existentes (não criar abstração nova)
Para cada um dos 6 componentes de filtro listados na tabela acima, adicionar:
- Novas props: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`,
  `tagOptions: ITag[]` (mesmos nomes de `TrainingsFilterSectionProps`).
- Novo campo dentro do `<form>`, replicando exatamente o bloco de
  `TrainingsFilterSection`: `<div className="min-w-60 flex-1">` envolvendo um
  `DefaultMultiAutocompleteInput<ITag>` com `id="<entidade>-tags-filter"` (ex.:
  `races-tags-filter`, `creatures-tags-filter`, `locations-tags-filter`,
  `events-tags-filter`, `eras-tags-filter`, `divinities-tags-filter`),
  `label="Tags"`, `options={tagOptions}`, `getOptionLabel={formatTagLabel}`,
  `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`,
  `value={tagsValue}`, `onChange={onTagsChange}`,
  `placeholder="Selecione as tags"`.
- Adicionar (em todos os 6, pois nenhum tem hoje) prop `onClear: () => void` e um
  `SecondaryButton` "Limpar filtros" ao lado do `PrimaryButton` "Filtrar" existente,
  igual ao de `TrainingsFilterSection` (`type="button"`, `onClick={onClear}`,
  `sx={{ width: 'auto', padding: '12px 24px' }}`).
- Ajustar o `max-w-*` do `<form>` para acomodar o campo novo (mais um input + mais um
  botão), conferindo visualmente/pela contagem de campos de cada página:
  - `RacesFilterSection`: hoje `max-w-160` com 2 campos (nome, categoria) + 1 botão →
    aumentar (ex.: `max-w-220`, no padrão do `max-w-220` de `TrainingsFilterSection`
    que tem 2 campos + tags + 2 botões).
  - `CreaturesFilterSection`: mesma situação de `Races` (nome, categoria) → mesmo ajuste.
  - `LocationsFilterSection`: hoje `max-w-160` com 2 campos (nome, tipo) + 1 botão →
    aumentar de forma equivalente.
  - `EventsFilterSection`: hoje sem `max-w-*` fixo (só `flex flex-wrap`), com 4 campos
    (nome, ano início, ano fim, era) + 1 botão → ao adicionar tags + botão "Limpar",
    avaliar se cabe manter sem `max-w-*` (o `flex-wrap` já acomoda) ou aplicar um
    `max-w-*` maior; decidir olhando o resultado visual, mas não deixar o form mais
    estreito que hoje.
  - `ErasFilterSection`: hoje `max-w-90` com 1 campo (nome) + 1 botão, sem
    `flex-wrap` → adicionar `flex-wrap` (para acomodar tags + botão extra) e aumentar
    o `max-w-*` de forma proporcional (ex.: algo entre `max-w-160` e `max-w-190`).
  - `DivinitiesFilterSection`: mesma situação de `Races`/`Creatures` (nome, categoria)
    → mesmo ajuste.
- Confirmar antes de editar, em cada arquivo, o nome real da prop/interface (a tabela
  acima é o levantamento desta etapa de planejamento, mas o código é a fonte da
  verdade no momento da implementação).

#### Funcionalidade — alterar as 6 `page.tsx` e as 6 interfaces `I<Entidade>ListFilters`
Para cada uma das 6 páginas (`racas/page.tsx`, `criaturas/page.tsx`, `locais/page.tsx`,
`eventos/page.tsx`, `eras/page.tsx`, `divindades/page.tsx`):

- **Interface de filtros**: adicionar `tagIds?: string[]` em `IRaceListFilters`,
  `ICreatureListFilters`, `ILocationListFilters`, `IEventListFilters`,
  `IEraListFilters`, `IDivinityListFilters` (arquivos em
  `app-web/src/shared/interfaces/Entities/<Entidade>/index.ts`), no mesmo formato de
  `ITrainingListFilters.tagIds`.
- **Estado da página**: adicionar `const [selectedTags, setSelectedTags] = useState<ITag[]>([])`
  e obter `const { tagOptions } = useTagOptionsQuery();` (import de `@/hooks/Queries`),
  igual a `treinamentos/page.tsx`.
- **`handleSearch`**: incluir no objeto passado a `setFilters` o campo
  `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`.
- **`handleClear` (novo em todas as 6 páginas)**: criar a função resetando TODOS os
  filtros da respectiva página (não só tags) e chamando
  `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`, replicando o padrão de
  `treinamentos/page.tsx`. Especificamente, por página:
  - `racas`: resetar `setNameInput('')`, `setCategoryFilter(null)`, `setSelectedTags([])`.
  - `criaturas`: resetar `setNameInput('')`, `setCategoryFilter(null)`, `setSelectedTags([])`.
  - `locais`: resetar `setNameInput('')`, `setTypeInput('')`, `setSelectedTags([])`.
  - `eventos`: resetar `setNameInput('')`, `setStartYearInput('')`, `setEndYearInput('')`,
    `setEraFilter(null)`, `setSelectedTags([])`.
  - `eras`: resetar `setNameInput('')`, `setSelectedTags([])`.
  - `divindades`: resetar `setNameInput('')`, `setCategoryFilter(null)`, `setSelectedTags([])`.
- **Passagem de props ao `*FilterSection`**: adicionar `tagsValue={selectedTags}`,
  `onTagsChange={setSelectedTags}`, `tagOptions={tagOptions}` e `onClear={handleClear}`
  na chamada de cada componente de filtro dentro do `page.tsx`.
- **Integração com API**: nenhum endpoint novo — continuam sendo `GET /races`,
  `GET /creatures`, `GET /locations`, `GET /events`, `GET /eras`, `GET /divinities`
  (mesma URL já usada em cada `useGetEntityList`), agora incluindo `tagIds` como
  querystring quando houver tags selecionadas. Também consumir `GET /tags` via
  `useTagOptionsQuery` (hook já existente, sem alteração) nas 6 páginas.
- **Formulário/validação**: não aplicável — o campo de tags é um filtro de listagem
  (multi-select opcional), não um formulário de criação/edição. Não há regra de
  validação além de aceitar zero ou mais tags.
- **Import de `ITag`**: garantir o import de `ITag` (e de `formatTagLabel` dentro do
  respectivo `*FilterSection`) em cada página/componente que passar a usá-lo.

#### Acesso Google
Padrão mantido — sem alteração. As 6 páginas já ocultam o botão "Novo" e as ações de
editar/excluir na listagem para `provider: 'google'` via `useIsGoogleUser()` (skill
`web-permissao-google-readonly`). O filtro por tags é uma funcionalidade de leitura
(listagem) e não interage com criar/editar/excluir, então nenhuma alteração de acesso é
necessária nas 6 páginas.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Os nomes reais de props/arquivos usados na implementação batem com o que foi
    levantado neste plano (ou foram corretamente ajustados caso o código real
    divergisse).
  - `handleClear` de cada uma das 6 páginas reseta corretamente TODOS os filtros
    daquela página (não só tags), incluindo os campos específicos (`categoryId` em
    `racas`/`criaturas`/`divindades`, `type` em `locais`, `startYear`/`endYear`/`eraId`
    em `eventos`).
  - O botão "Limpar filtros" foi adicionado nas 6 páginas (nenhuma delas o tinha antes).
  - `tagIds` foi de fato incluído em `IRaceListFilters`, `ICreatureListFilters`,
    `ILocationListFilters`, `IEventListFilters`, `IEraListFilters`,
    `IDivinityListFilters`.
  - `DefaultMultiAutocompleteInput<ITag>` foi usado com `getOptionValue`,
    `getOptionColor`, `getOptionLabel={formatTagLabel}` — mesmo padrão de
    `TrainingsFilterSection`, sem reimplementar lógica de autocomplete/labels.
  - Em `creatures`, o filtro usa `ITag` (não `ICreatureTag`) e isso não quebra a
    tipagem de `ICreatureListItem`/`ICreatureListFilters` existentes.
  - `max-w-*`/`flex-wrap` de cada `form` continuam coerentes visualmente com o número
    de campos (especialmente `ErasFilterSection`, que precisa ganhar `flex-wrap`).
  - Textos de UI em pt-BR ("Tags", "Selecione as tags", "Limpar filtros").
  - Nenhuma página passou a usar um caminho de fetch diferente de
    `useGetEntityList`/`ApiFactory` para o filtro de tags funcionar.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Conferência ponto a ponto do checklist da etapa 2, comparando as 6 páginas/6
`*FilterSection`/6 interfaces contra o padrão de referência `treinamentos`
(`TrainingsFilterSection` + `treinamentos/page.tsx`):

- **Nomes reais de props/arquivos**: batem exatamente com o levantamento da etapa de
  planejamento (`RacesFilterSectionProps`, `CreaturesFilterSectionProps`,
  `LocationsFilterSectionProps`, `EventsFilterSectionProps`, `ErasFilterSectionProps`,
  `DivinitiesFilterSectionProps`, com os campos `nameValue`/`categoryValue`/`typeValue`/
  `startYearValue`/`endYearValue`/`eraValue` conforme a tabela do plano). Nenhuma
  divergência de nome encontrada.
- **`handleClear` reseta todos os filtros da página** (não só tags), verificado em cada
  `page.tsx`:
  - `racas/page.tsx:98-103` — `setNameInput('')`, `setCategoryFilter(null)`,
    `setSelectedTags([])`, `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`. OK.
  - `criaturas/page.tsx:94-99` — mesmo padrão (`nameInput`, `categoryFilter`,
    `selectedTags`). OK.
  - `locais/page.tsx:89-94` — `setNameInput('')`, `setTypeInput('')`,
    `setSelectedTags([])`. OK.
  - `eventos/page.tsx:101-108` — `setNameInput('')`, `setStartYearInput('')`,
    `setEndYearInput('')`, `setEraFilter(null)`, `setSelectedTags([])`. OK (os 4 filtros
    próprios da página + tags, nenhum esquecido).
  - `eras/page.tsx:84-88` — `setNameInput('')`, `setSelectedTags([])`. OK (única página
    com apenas 1 filtro + tags, coerente com o plano).
  - `divindades/page.tsx:98-103` — `setNameInput('')`, `setCategoryFilter(null)`,
    `setSelectedTags([])`. OK.
- **Botão "Limpar filtros"**: presente nos 6 `*FilterSection` como `SecondaryButton`
  `type="button"` com `onClick={onClear}` e `sx={{ width: 'auto', padding: '12px 24px'
  }}`, idêntico a `TrainingsFilterSection`. Confirmado nenhuma das 6 tinha esse botão
  antes (conforme levantamento da etapa 1).
- **`tagIds?: string[]`**: presente em `IRaceListFilters`
  (`shared/interfaces/Entities/Race/index.ts:42`), `ICreatureListFilters`
  (`Creature/index.ts:58`), `ILocationListFilters` (`Location/index.ts:42`),
  `IEventListFilters` (`Event/index.ts:33`), `IEraListFilters` (`Era/index.ts:36`),
  `IDivinityListFilters` (`Divinity/index.ts:52`).
- **`DefaultMultiAutocompleteInput<ITag>`**: usado nos 6 componentes com
  `options={tagOptions}`, `getOptionLabel={formatTagLabel}`,
  `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`,
  `value={tagsValue}`, `onChange={onTagsChange}`, `placeholder="Selecione as tags"` —
  réplica exata de `TrainingsFilterSection`, sem lógica de autocomplete reimplementada.
- **`creatures` usa `ITag`, não `ICreatureTag`, para o filtro**: confirmado em
  `CreaturesFilterSection/index.tsx` (import de `ITag` de `@/shared/interfaces`, prop
  `tagsValue: ITag[]`) e em `criaturas/page.tsx` (`selectedTags` tipado como
  `ITag[]`, vindo de `useTagOptionsQuery`). `ICreatureTag`/`ICreatureListItem`
  (`Creature/index.ts:8-19,52`) permanecem inalterados e `ICreatureTag` não é usado em
  nenhum outro arquivo do projeto além dessa própria definição — nenhuma quebra de
  tipagem existente.
- **`max-w-*`/`flex-wrap` coerentes com o número de campos**: `RacesFilterSection`,
  `CreaturesFilterSection`, `DivinitiesFilterSection` e `LocationsFilterSection` foram
  para `max-w-220` (2 campos + tags + 2 botões, igual a `TrainingsFilterSection`).
  `EventsFilterSection` manteve sem `max-w-*` fixo, apenas `flex flex-wrap` (4 campos +
  tags + 2 botões — coerente, não ficou mais estreito que antes). `ErasFilterSection`
  passou de `max-w-90` sem `flex-wrap` para `max-w-180` com `flex-wrap` adicionado (1
  campo + tags + 2 botões) — resolve o ponto de atenção do plano.
- **Textos em pt-BR**: "Tags", "Selecione as tags" e "Limpar filtros" presentes e
  idênticos nos 6 componentes.
- **Caminho de fetch**: as 6 páginas continuam usando exclusivamente
  `useGetEntityList<TItem, TFilters>({ url, filters })` (mesmo padrão de
  `ApiFactory`/`params: filters` via Axios); nenhuma introduziu `useQuery`/`fetch`
  bespoke para o filtro de tags funcionar.

Arquivos revisados: `app-web/src/app/(authorized)/racas/page.tsx`,
`app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/criaturas/page.tsx`,
`app-web/src/app/(authorized)/criaturas/components/CreaturesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/locais/page.tsx`,
`app-web/src/app/(authorized)/locais/components/LocationsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/eventos/page.tsx`,
`app-web/src/app/(authorized)/eventos/components/EventsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/eras/page.tsx`,
`app-web/src/app/(authorized)/eras/components/ErasFilterSection/index.tsx`,
`app-web/src/app/(authorized)/divindades/page.tsx`,
`app-web/src/app/(authorized)/divindades/components/DivinitiesFilterSection/index.tsx`,
`app-web/src/shared/interfaces/Entities/Race/index.ts`,
`app-web/src/shared/interfaces/Entities/Creature/index.ts`,
`app-web/src/shared/interfaces/Entities/Location/index.ts`,
`app-web/src/shared/interfaces/Entities/Event/index.ts`,
`app-web/src/shared/interfaces/Entities/Era/index.ts`,
`app-web/src/shared/interfaces/Entities/Divinity/index.ts`.
