# Task Web: Filtro por tags (tagIds) nas listagens de familias, organizacoes, personagens, biografias, campanhas e sessoes planejadas

## Contexto
Não existe `.claude/tasks/filtro-tags-social/spec.md` — o planejamento segue diretamente o pedido do usuário. Ver `.claude/tasks/filtro-tags-social/task-api.md` para o trabalho de backend correspondente (adição do parâmetro `tagIds` — array de UUIDs, semântica AND — nos 6 endpoints de listagem envolvidos). Este plano cobre **apenas** o app-web: adicionar o filtro de tags na seção de filtros de 6 listagens, reaproveitando fielmente o padrão já implementado em `treinamentos`.

### Padrão de referência obrigatório (replicar fielmente, não criar abstração nova)
- `app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`: usa `DefaultMultiAutocompleteInput<ITag>` (de `@/shared/components/Inputs`) com `options={tagOptions}`, `getOptionLabel={formatTagLabel}` (de `@/shared/util`), `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`, `value={tagsValue}`, `onChange={onTagsChange}`, `placeholder="Selecione as tags"`, `label="Tags"`, `id="<entidade>-tags-filter"`, dentro de `<div className="min-w-60 flex-1">`. Props novas na interface: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`.
- `app-web/src/app/(authorized)/treinamentos/page.tsx`: usa `useTagOptionsQuery()` (de `@/hooks/Queries`) para obter `{ tagOptions }`; mantém `const [selectedTags, setSelectedTags] = useState<ITag[]>([])`; no `handleSearch` monta `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`; no `handleClear` reseta `setSelectedTags([])` junto com os demais inputs e os filtros (`setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`).
- Já confirmado que `useGetEntityList` (`app-web/src/hooks/Queries/DefaultQueries/useGetEntityList/index.ts`) passa `filters` direto como `params` do axios (`api.get(url, { params: filters })`), sem `paramsSerializer` custom em `app-web/src/services/api/index.ts`. `treinamentos` já usa exatamente esse caminho de fetch com `tagIds: string[]` e funciona hoje — as 6 listagens abaixo usam o mesmo `useGetEntityList`, então a serialização de array não precisa de nenhum ajuste adicional; apenas confirmar, ao implementar, que nenhuma delas usa um caminho de fetch diferente.
- `useTagOptionsQuery()` (`app-web/src/hooks/Queries/EntityQueries/useTagOptionsQuery/index.ts`) já é genérico (`GET /tags`) e é reutilizado sem alteração — não precisa de nenhuma variação por entidade.

### Levantamento do estado atual (confirmado por leitura direta do código-fonte)
Todas as 6 listagens seguem hoje o mesmo padrão simples — filtro único de `name` (texto), botão `PrimaryButton` "Filtrar", **sem** botão "Limpar filtros** e **sem** filtro de tags:

| Listagem | FilterSection | Interface de filtros | `max-w-*` atual |
|---|---|---|---|
| familias | `FamiliesFilterSection` (`app-web/src/app/(authorized)/familias/components/FamiliesFilterSection/index.tsx`) | `IFamilyListFilters` (`app-web/src/shared/interfaces/Entities/Family/index.ts`, campos: `name?`, `page?`, `perPage?`) | `max-w-160` |
| organizacoes | `OrganizationsFilterSection` (`app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`) | `IOrganizationListFilters` (`app-web/src/shared/interfaces/Entities/Organization/index.ts`) | `max-w-160` |
| personagens | `CharactersFilterSection` (`app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`) | `ICharacterListFilters` (`app-web/src/shared/interfaces/Entities/Character/index.ts`) | `max-w-160` |
| biografias | `BiographiesFilterSection` (`app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`) | `IBiographyListFilters` (`app-web/src/shared/interfaces/Entities/Biography/index.ts`) | `max-w-90` |
| campanhas | `CampaignsFilterSection` (`app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx`) | `ICampaignListFilters` (`app-web/src/shared/interfaces/Entities/Campaign/index.ts`) | `max-w-160` |
| sessões planejadas (dentro de campanhas/[id]) | `PlannedSessionsFilterSection` (`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx`), consumido por `PlannedSessionsSection` (`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx`) | `IPlannedSessionListFilters` (`app-web/src/shared/interfaces/Entities/PlannedSession/index.ts`) | `max-w-160` |

**Divergência a sinalizar**: o pedido original menciona que "personagens tem filtros existentes (raça/categoria)" e pede para o `handleClear` resetá-los também. Na leitura atual do código, `CharactersFilterSection` e `ICharacterListFilters` só têm o filtro de `name` — não existe hoje filtro de raça/categoria na listagem de personagens (pode ter existido em outro momento, ou tratar-se de um enunciado antecipando uma demanda futura ainda não implementada). O implementador deve **confirmar isso no momento da implementação** (o código pode ter mudado entre o planejamento e a execução); se de fato não houver filtro de raça/categoria, o `handleClear` de personagens só precisa resetar `name` + `tagIds`. Se surgir tal filtro, ele deve ser incluído no reset.

**Caso especial — sessões planejadas**: `PlannedSessionsSection` não é uma página de topo, é um componente renderizado dentro de `app-web/src/app/(authorized)/campanhas/[id]/page.tsx`. O escopo por campanha já é resolvido via URL do endpoint (`listUrl = \`/campaigns/${campaignId}/planned-sessions\``, usado tanto no `useGetEntityList` quanto na invalidação de query), **não** via um campo dentro de `filters`. Ou seja, adicionar `tagIds` ao estado `filters`/`IPlannedSessionListFilters` desta seção compõe naturalmente com o escopo de campanha existente — não há nenhum `campaignId` dentro do objeto de filtros para conflitar. Nenhuma alteração é necessária no escopo por campanha; o filtro de tags é estritamente aditivo.

## Etapas

### 1. web-dev
Status: concluído

Confirmado durante a implementação: nenhuma das 6 listagens tinha filtro além de `name`
(a divergência sinalizada sobre raça/categoria em personagens não se aplicava — o código
atual só tem `name`). Todas as 6 listagens ganharam `tagsValue`/`onTagsChange`/`tagOptions`
+ botão "Limpar filtros" (`handleClear`), replicando fielmente
`TrainingsFilterSection`/`treinamentos/page.tsx`. Em `PlannedSessionsSection`, o `listUrl`
baseado em `campaignId` não foi alterado — `tagIds` entrou apenas em `filters`, de forma
aditiva.

Componentes:
- `app-web/src/app/(authorized)/familias/components/FamiliesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`
- `app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx`

Arquivos:
- `app-web/src/app/(authorized)/familias/page.tsx`
- `app-web/src/app/(authorized)/organizacoes/page.tsx`
- `app-web/src/app/(authorized)/personagens/page.tsx`
- `app-web/src/app/(authorized)/biografias/page.tsx`
- `app-web/src/app/(authorized)/campanhas/page.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx`
- `app-web/src/shared/interfaces/Entities/Family/index.ts` (`IFamilyListFilters.tagIds`)
- `app-web/src/shared/interfaces/Entities/Organization/index.ts` (`IOrganizationListFilters.tagIds`)
- `app-web/src/shared/interfaces/Entities/Character/index.ts` (`ICharacterListFilters.tagIds`)
- `app-web/src/shared/interfaces/Entities/Biography/index.ts` (`IBiographyListFilters.tagIds`)
- `app-web/src/shared/interfaces/Entities/Campaign/index.ts` (`ICampaignListFilters.tagIds`)
- `app-web/src/shared/interfaces/Entities/PlannedSession/index.ts` (`IPlannedSessionListFilters.tagIds`)

Aplicar, nas 6 listagens abaixo, a mesma alteração: adicionar `tagsValue`/`onTagsChange`/`tagOptions` ao respectivo `*FilterSection`, consumir `useTagOptionsQuery()` e um estado `selectedTags` na página/seção correspondente, incluir `tagIds` no `handleSearch`, adicionar `tagIds?: string[]` na interface de filtros, e adicionar (onde ainda não existir) o botão "Limpar filtros" com `handleClear` resetando **todos** os filtros da listagem — seguindo fielmente o padrão de `TrainingsFilterSection`/`treinamentos/page.tsx` descrito no Contexto.

Antes de codar cada listagem, **confirmar no código real** (não assumir por convenção): o nome exato do componente FilterSection, o nome exato da interface de filtros, as props já existentes, e se algum filtro adicional (ex.: eventual raça/categoria em personagens) já existe e precisa entrar no `handleClear`.

Todas as 6 listagens ganham o botão "Limpar filtros" (nenhuma delas o possui hoje).

---

#### Componentes

- Componente: `FamiliesFilterSection` (`app-web/src/app/(authorized)/familias/components/FamiliesFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: adicionar `DefaultMultiAutocompleteInput<ITag>` (`id="families-tags-filter"`, `label="Tags"`, `getOptionLabel={formatTagLabel}`, `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`, `placeholder="Selecione as tags"`) dentro de `<div className="min-w-60 flex-1">`, ao lado do campo de nome; adicionar `SecondaryButton` "Limpar filtros" (`type="button"`, `onClick={onClear}`) ao lado do `PrimaryButton` "Filtrar"; revisar o `max-w-160` do `<form>` (provavelmente subir para `max-w-220`, como em `treinamentos`, dado o campo extra de tags + botão extra).

- Componente: `OrganizationsFilterSection` (`app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: mesmo padrão acima (`id="organizations-tags-filter"`), ajustando `max-w-*` do `<form>`.

- Componente: `CharactersFilterSection` (`app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: mesmo padrão acima (`id="characters-tags-filter"`), ajustando `max-w-*` do `<form>`. Confirmar se existe algum outro filtro (raça/categoria) já presente no componente real no momento da implementação (ver divergência sinalizada no Contexto); se existir, ele permanece como está, só ganha o `tagsValue`/`onTagsChange`/`tagOptions` a mais.

- Componente: `BiographiesFilterSection` (`app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: mesmo padrão acima (`id="biographies-tags-filter"`). O `<form>` atual usa `max-w-90` com um único campo de nome (`flex-1`, sem `min-w-*`) — ajustar para acomodar o campo de tags + botão extra (ex.: `max-w-160`, alinhando o campo de nome a `min-w-50 flex-1` como nas demais, para manter consistência visual).

- Componente: `CampaignsFilterSection` (`app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: mesmo padrão acima (`id="campaigns-tags-filter"`), ajustando `max-w-*` do `<form>`.

- Componente: `PlannedSessionsFilterSection` (`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx`)
- Props adicionais: `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]`, `onClear: () => void`
- Comportamento esperado: mesmo padrão acima (`id="planned-sessions-tags-filter"`), ajustando `max-w-*` do `<form>`. Este componente é consumido dentro de `PlannedSessionsSection`, que por sua vez é renderizado em `campanhas/[id]/page.tsx` — nenhuma mudança de assinatura é necessária em `PlannedSessionsSection` além de repassar as novas props.

#### Funcionalidade

- Páginas/rotas alteradas:
  - `app-web/src/app/(authorized)/familias/page.tsx`
  - `app-web/src/app/(authorized)/organizacoes/page.tsx`
  - `app-web/src/app/(authorized)/personagens/page.tsx`
  - `app-web/src/app/(authorized)/biografias/page.tsx`
  - `app-web/src/app/(authorized)/campanhas/page.tsx`
  - `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx` (não é `page.tsx`, mas é a seção que monta o estado de filtros/consome o FilterSection para sessões planejadas dentro de `campanhas/[id]/page.tsx`)

- Em cada uma das 6 páginas/seções acima, replicar o padrão de `treinamentos/page.tsx`:
  - Importar `useTagOptionsQuery` de `@/hooks/Queries` e obter `const { tagOptions } = useTagOptionsQuery();`.
  - Adicionar `const [selectedTags, setSelectedTags] = useState<ITag[]>([]);` (importar `ITag` de `@/shared/interfaces`).
  - No `handleSearch`, incluir `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined` no `setFilters`.
  - Adicionar `handleClear`, resetando todos os inputs locais da listagem (incluindo `nameInput` e `selectedTags`, e qualquer outro filtro local existente — ex.: confirmar se personagens tem algo além de nome) e `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`.
  - Passar `tagsValue={selectedTags}`, `onTagsChange={setSelectedTags}`, `tagOptions={tagOptions}` e `onClear={handleClear}` para o respectivo `*FilterSection`.

- Integrações com API: nenhum endpoint novo é chamado — os mesmos endpoints de listagem já consumidos (`GET /families`, `GET /organizations`, `GET /characters`, `GET /biographies`, `GET /campaigns`, `GET /campaigns/:campaignId/planned-sessions`, todos via `useGetEntityList`) passam a receber o parâmetro de query adicional `tagIds` (implementado no backend, ver `task-api.md`). `GET /tags` (via `useTagOptionsQuery`) já é consumido em outras páginas e não precisa de nenhuma alteração — apenas passa a ser chamado também nestas 6 páginas.

- Interfaces a alterar (adicionar `tagIds?: string[]`, no mesmo ponto onde `ITrainingListFilters.tagIds` está definido):
  - `IFamilyListFilters` (`app-web/src/shared/interfaces/Entities/Family/index.ts`)
  - `IOrganizationListFilters` (`app-web/src/shared/interfaces/Entities/Organization/index.ts`)
  - `ICharacterListFilters` (`app-web/src/shared/interfaces/Entities/Character/index.ts`)
  - `IBiographyListFilters` (`app-web/src/shared/interfaces/Entities/Biography/index.ts`)
  - `ICampaignListFilters` (`app-web/src/shared/interfaces/Entities/Campaign/index.ts`)
  - `IPlannedSessionListFilters` (`app-web/src/shared/interfaces/Entities/PlannedSession/index.ts`)

- Formulário/validação: não aplicável — é um filtro de listagem (não um formulário de criação/edição com `react-hook-form`/`zod`); a seleção de tags usa `DefaultMultiAutocompleteInput` com estado local simples (`useState`), sem validação.

- Textos de UI (pt-BR): label `"Tags"`, placeholder `"Selecione as tags"` (idêntico em todas as 6), label do botão `"Limpar filtros"`.

- Acesso Google: nenhuma alteração de comportamento — cada uma das 6 listagens já esconde as ações de criar/editar/excluir para `provider: 'google'` via `!isGoogleUser` (padrão `web-permissao-google-readonly`), e essa lógica não é tocada por esta demanda. O filtro de tags (assim como o filtro de nome) fica disponível tanto para usuários Google quanto não-Google, já que se trata de uma ação de busca/visualização, não de criar/editar/excluir. Em `campanhas` e nas sessões planejadas (`GoogleAccess: 'blocked'` no backend, conforme `task-api.md`), nenhuma mudança adicional é necessária aqui — o bloqueio de acesso à página/rota para usuários Google, se já existir, não é afetado por este filtro.

### 2. web-dev-codereviewer
Status: concluído

Revisar, para as 6 listagens (familias, organizacoes, personagens, biografias, campanhas, sessões planejadas em campanhas/[id]):
- O `DefaultMultiAutocompleteInput<ITag>` foi usado com as mesmas props de `TrainingsFilterSection` (`getOptionLabel={formatTagLabel}`, `getOptionValue`, `getOptionColor`, `placeholder`, `label`, `id` único por entidade), sem reinventar um componente de autocomplete próprio.
- O botão "Limpar filtros" (`SecondaryButton`) e o `handleClear` foram adicionados em todas as 6 listagens, resetando **todos** os filtros locais de cada uma (nome, tags e qualquer outro filtro pré-existente — conferir especificamente personagens).
- `tagIds` foi adicionado a `IFamilyListFilters`, `IOrganizationListFilters`, `ICharacterListFilters`, `IBiographyListFilters`, `ICampaignListFilters` e `IPlannedSessionListFilters`.
- `useTagOptionsQuery()` foi reutilizado sem duplicação de lógica de busca de tags.
- Em `PlannedSessionsSection`, o filtro de tags compõe com o escopo por campanha (`listUrl` baseado em `campaignId`) sem alterá-lo.
- Nenhuma mudança foi feita fora do escopo (ex.: nenhuma alteração em `ApiFactory`/`useGetEntityList`/serialização de query, já que o caminho de fetch é o mesmo usado por `treinamentos`).
- `max-w-*` de cada `<form>` de filtro está coerente com o número de campos após a adição de tags + botão "Limpar filtros" (não ficou apertado nem gerou quebra de layout inesperada).
- Comportamento de acesso Google (ocultar criar/editar/excluir) não foi alterado em nenhuma das 6 listagens.
- Textos de UI em pt-BR, consistentes com o restante do projeto.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. As 6 listagens replicam fielmente o padrão de referência `TrainingsFilterSection`/`treinamentos/page.tsx`, com `tagIds` adicionado apenas de forma aditiva. Detalhamento da conferência:

- **`DefaultMultiAutocompleteInput<ITag>`**: usado de forma idêntica em todos os 6 `*FilterSection` (`FamiliesFilterSection`, `OrganizationsFilterSection`, `CharactersFilterSection`, `BiographiesFilterSection`, `CampaignsFilterSection`, `PlannedSessionsFilterSection`), com `getOptionLabel={formatTagLabel}`, `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`, `placeholder="Selecione as tags"`, `label="Tags"`, dentro de `<div className="min-w-60 flex-1">`, e `id` único por entidade (`families-tags-filter`, `organizations-tags-filter`, `characters-tags-filter`, `biographies-tags-filter`, `campaigns-tags-filter`, `planned-sessions-tags-filter`). Nenhum componente de autocomplete próprio foi criado.
- **Botão "Limpar filtros" / `handleClear`**: presente nas 6 listagens como `SecondaryButton type="button" onClick={onClear}`, e cada `handleClear` correspondente na página/seção reseta `nameInput`, `selectedTags` e chama `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`. Confirmado por leitura direta que nenhuma das 6 possui outro filtro local além de nome/tags — em particular `CharactersFilterSection`/`ICharacterListFilters` (`app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`, `app-web/src/shared/interfaces/Entities/Character/index.ts`) não têm filtro de raça/categoria hoje, confirmando a divergência já sinalizada no plano — nada ficou de fora do reset.
- **`tagIds?: string[]`**: adicionado corretamente em `IFamilyListFilters`, `IOrganizationListFilters`, `ICharacterListFilters`, `IBiographyListFilters`, `ICampaignListFilters` e `IPlannedSessionListFilters`, no mesmo formato de `ITrainingListFilters.tagIds`.
- **`useTagOptionsQuery()`**: consumido sem alteração em todas as 6 páginas/seções (`const { tagOptions } = useTagOptionsQuery();`), sem lógica de busca de tags duplicada.
- **Caso especial — sessões planejadas**: conferido com atenção conforme pedido. Em `PlannedSessionsSection` (`app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx`), `const listUrl = \`/campaigns/${campaignId}/planned-sessions\`;` permanece intocado e é usado tanto em `useGetEntityList` (`url: listUrl`) quanto na exclusão (`url: ${listUrl}/${plannedSessionPendingDelete?.id}`) e na invalidação (`invalidateQueryKeys: [[listUrl]]`). `tagIds` entra exclusivamente dentro do objeto `filters` (via `setFilters` em `handleSearch`/`handleClear`), nunca dentro da URL — não há nenhum `campaignId` misturado em `IPlannedSessionListFilters` (`app-web/src/shared/interfaces/Entities/PlannedSession/index.ts`), que segue com `name?`, `tagIds?`, `page?`, `perPage?`. O escopo por campanha continua resolvido inteiramente pela URL, de forma correta e aditiva.
- **Fora de escopo**: nenhuma alteração encontrada em `ApiFactory`, `useGetEntityList` ou qualquer serialização de query — todas as 6 listagens continuam usando o mesmo `useGetEntityList` genérico sem `paramsSerializer` custom.
- **`max-w-*` dos `<form>`**: `familias`, `organizacoes`, `personagens`, `campanhas` e `sessões planejadas` usam `max-w-220` (igual a `treinamentos`, que tem um campo a mais — level — e ainda assim usa a mesma largura, então `max-w-220` com nome+tags+2 botões está confortável). `biografias` usa `max-w-160`, exatamente o valor sugerido no plano para essa listagem (2 campos + 2 botões, sem o campo extra de level que `treinamentos` tem), com o campo de nome ajustado para `min-w-50 flex-1` (era `flex-1` sem `min-w-*` antes). Nenhuma quebra de layout aparente.
- **Acesso Google**: `!isGoogleUser` continua controlando a exibição do botão "Novo" e das ações de editar/excluir (via `ListItem`) nas 6 páginas/seções, sem nenhuma alteração relacionada a este filtro — o campo de tags fica disponível tanto para usuários Google quanto não-Google, como esperado para uma ação de busca/visualização.
- **Textos pt-BR**: label "Tags", placeholder "Selecione as tags" e label do botão "Limpar filtros" idênticos nas 6 listagens.

Arquivos revisados:
- `app-web/src/app/(authorized)/familias/components/FamiliesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/familias/page.tsx`
- `app-web/src/shared/interfaces/Entities/Family/index.ts`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/page.tsx`
- `app-web/src/shared/interfaces/Entities/Organization/index.ts`
- `app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`
- `app-web/src/app/(authorized)/personagens/page.tsx`
- `app-web/src/shared/interfaces/Entities/Character/index.ts`
- `app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/biografias/page.tsx`
- `app-web/src/shared/interfaces/Entities/Biography/index.ts`
- `app-web/src/app/(authorized)/campanhas/components/CampaignsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/campanhas/page.tsx`
- `app-web/src/shared/interfaces/Entities/Campaign/index.ts`
- `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionsSection/index.tsx`
- `app-web/src/shared/interfaces/Entities/PlannedSession/index.ts`
