# Task Web: Filtros de nome, level e tags em Treinamentos, Talentos e Características

## Contexto
Ver `.claude/tasks/filtros-nome-level-tags/spec.md` — escopo confirmado com o usuário
(filtro de nome mantido como está, filtro de level por valor exato, filtro de tags com
lógica AND via o mesmo autocomplete de múltipla seleção já usado nos formulários de
criação/edição, filtros cumulativos entre si, botão "Limpar filtros" nas três páginas,
paridade total entre Treinamentos/Talentos/Características).

Ver também `.claude/tasks/filtros-nome-level-tags/task-api.md` (planejamento paralelo do
backend) — os três endpoints de listagem (`GET /trainings`, `GET /talents`,
`GET /characteristics`) passam a aceitar `name` (inalterado), `level?: number` (valor
exato) e `tagIds?: string[]` (AND — só retorna registros que possuem todas as tags
informadas). O formato exato de serialização de `tagIds` na querystring (parâmetro
repetido) ainda está sinalizado como ponto em aberto no `task-api.md`; o `web-dev` deve
conferir no Swagger/`task-api.md` já concluído qual formato o backend espera antes de
finalizar a chamada.

Investigação prévia confirmou que as três páginas (`app-web/src/app/(authorized)/
treinamentos/`, `.../talentos/`, `.../caracteristicas/`) são hoje idênticas byte a byte
na parte de listagem/filtro (mesma estrutura de `page.tsx`, mesmo `<Entidade>
sFilterSection` só com campo de nome + botão "Filtrar", mesmas interfaces
`I<Entidade>ListFilters` com apenas `name?`, `page?`, `perPage?`). Isso confirma que a
paridade pedida é diretamente viável replicando a mesma alteração nos três lugares.

Também confirmado:
- O autocomplete de múltipla seleção usado nos formulários de criação/edição das três
  entidades é `FormMultiAutocompleteInput`
  (`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`),
  usado em `TrainingCreateForm`/`TalentCreateForm`/`CharacteristicCreateForm` com
  `options={tagOptions}` (de `useTagOptionsQuery`), `getOptionLabel={formatTagLabel}`,
  `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}` — renderiza
  chips coloridos por tag. Esse componente é acoplado a `Control`/`Controller` do
  `react-hook-form`.
- Nenhuma das três `FilterSection` atuais usa `react-hook-form` — todas usam estado
  local simples (`useState` na página + `DefaultTextInput`/`DefaultAutocompleteInput`
  controlados por props `value`/`onChange`), seguindo o padrão geral de todas as
  `*FilterSection` do projeto (ex.: `SkillsFilterSection`, `DivinitiesFilterSection`,
  `TagsFilterSection` — nenhuma usa formulário controlado por schema).
- Já existe o par `DefaultAutocompleteInput` (estado simples, seleção única) /
  `FormAutocompleteInput` (react-hook-form, seleção única), mas **não existe** ainda o
  equivalente de estado simples para seleção múltipla — só existe a versão
  `FormMultiAutocompleteInput` (react-hook-form). Não há nenhum precedente no projeto de
  filtro com seleção múltipla nem de botão "Limpar filtros" em nenhuma tela existente.

### Decisão de arquitetura (dentro do escopo desta etapa de planejamento técnico, conforme
o próprio spec delega)
Para manter consistência com o padrão já estabelecido em todas as `*FilterSection` do
projeto (estado local simples, sem `react-hook-form`) e, ao mesmo tempo, atender à
decisão do usuário de reaproveitar o **mesmo autocomplete de múltipla seleção** já usado
nos formulários (mesmo comportamento: seleção múltipla com chips coloridos por tag), o
`web-dev` deve criar um novo componente `DefaultMultiAutocompleteInput` em
`shared/components/Inputs/DefaultInputs/`, espelhando exatamente a configuração visual e
de comportamento do `Autocomplete` usado em `FormMultiAutocompleteInput` (multiple,
`renderValue` com `Chip` colorido via `getOptionColor`/`getContrastTextColor`, mesmos
estilos `APP_INPUT_STYLES`), mas controlado por `value`/`onChange` simples em vez de
`Control`/`Controller`. Isso evita introduzir `react-hook-form` nas `FilterSection`
(o que quebraria o padrão hoje 100% consistente entre nome/level como estado simples) e
ainda assim entrega o mesmo autocomplete multi-seleção (mesma UX/estilo) já usado nos
formulários de criação/edição.

## Etapas

### 1. web-dev
Status: concluído
Componentes:
- app-web/src/shared/components/Inputs/DefaultInputs/DefaultMultiAutocompleteInput/index.tsx (novo)
- app-web/src/shared/components/Inputs/DefaultInputs/index.ts (barrel atualizado)
- app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentsFilterSection/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx
Arquivos:
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/interfaces/Entities/Talent/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/app/(authorized)/treinamentos/page.tsx
- app-web/src/app/(authorized)/talentos/page.tsx
- app-web/src/app/(authorized)/caracteristicas/page.tsx

Confirmação de serialização de `tagIds`: verificado o código-fonte de `axios` instalado
(`node_modules/axios/lib/helpers/toFormData.js`), usado internamente por
`AxiosURLSearchParams`/`buildURL` para serializar `config.params` quando nenhum
`paramsSerializer` customizado é informado. Com as opções padrão (`indexes: false`),
um array em `params` (ex. `tagIds: ['uuid1', 'uuid2']`) é serializado como
`tagIds[]=uuid1&tagIds[]=uuid2` — exatamente o formato de colchetes documentado no
`task-api.md`. Por isso, `useGetEntityList` (`params: filters` via `ApiFactory`) não
precisou de nenhum `paramsSerializer` customizado; nenhuma alteração foi necessária em
`hooks/Queries/DefaultQueries/useGetEntityList`.

#### Componentes
- Componente: `DefaultMultiAutocompleteInput`
  (novo: `app-web/src/shared/components/Inputs/DefaultInputs/DefaultMultiAutocompleteInput/index.tsx`,
  exportado em `app-web/src/shared/components/Inputs/DefaultInputs/index.ts`)
- Props (genérico `<TOption>`, espelhando `FormMultiAutocompleteInputProps` sem
  `name`/`control`):
  - `id: string`
  - `label?: string`
  - `options: TOption[]`
  - `getOptionLabel: (option: TOption) => string`
  - `getOptionValue: (option: TOption) => string`
  - `getOptionColor?: (option: TOption) => string`
  - `value: TOption[]`
  - `onChange: (value: TOption[]) => void`
  - `placeholder?: string`
  - `disabled?: boolean`
- Comportamento esperado: `Autocomplete` do MUI com `multiple`, mesmo `renderValue` com
  `Chip` por opção selecionada colorido via `getOptionColor` +
  `getContrastTextColor` (`shared/util`) quando `getOptionColor` for informado (mesmo
  bloco de estilo hoje em `FormMultiAutocompleteInput`), mesmo `renderInput` com
  `TextField`/`APP_INPUT_STYLES.textField` + `APP_INPUT_STYLES.autocompleteField` e
  fonte acessível via `useAccessibleFontSize`; `onChange` do `Autocomplete` repassa a
  lista de opções selecionadas diretamente (sem a etapa de mapear por id que existe na
  versão `Form*`, já que aqui não há `field.value` do `react-hook-form` — o
  componente já recebe/retorna `TOption[]` diretamente). Sem validação/erro de campo
  (não há `fieldState` aqui, pois não é um campo de formulário).
  Este componente será usado nas três `FilterSection` abaixo para o filtro de tags.

#### Funcionalidade

**Interfaces de filtro** (paridade idêntica nos três arquivos)
- `app-web/src/shared/interfaces/Entities/Training/index.ts` — `ITrainingListFilters`
- `app-web/src/shared/interfaces/Entities/Talent/index.ts` — `ITalentListFilters`
- `app-web/src/shared/interfaces/Entities/Characteristic/index.ts` —
  `ICharacteristicListFilters`

Adicionar, nos três, exatamente:
```ts
level?: number;
tagIds?: string[];
```
logo após `name?: string;` (mesma posição relativa nos três), mantendo `page?`/`perPage?`
inalterados.

**`<Entidade>sFilterSection`** (mesma alteração, idêntica nos três arquivos):
- `app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx`

Novas props em cada `*FilterSectionProps` (além de `nameValue`/`onNameChange`/`onSubmit`
já existentes):
```ts
levelValue: string;
onLevelChange: (value: string) => void;
tagsValue: ITag[];
onTagsChange: (value: ITag[]) => void;
tagOptions: ITag[];
onClear: () => void;
```
- Campo de level: `DefaultTextInput` (mesmo componente do filtro de nome), `type="number"`,
  `slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}` (mesmo padrão
  numérico já usado em `FormTextInput` de `level` nos formulários de criação/edição),
  `label="Level"`, `placeholder="Buscar por level"`, `value={levelValue}`,
  `onChange={(event) => onLevelChange(event.target.value)}`.
- Campo de tags: `DefaultMultiAutocompleteInput<ITag>` (novo componente acima),
  `label="Tags"`, `options={tagOptions}`, `getOptionLabel={formatTagLabel}`
  (`@/shared/util`), `getOptionValue={(tag) => tag.id}`,
  `getOptionColor={(tag) => tag.color}`, `value={tagsValue}`,
  `onChange={onTagsChange}`, `placeholder="Selecione as tags"` — mesmas funções de
  formatação/cor já usadas em `TrainingCreateForm`/`TalentCreateForm`/
  `CharacteristicCreateForm` para manter a tag exibida de forma idêntica entre
  formulário e filtro.
- Botão "Limpar filtros": `SecondaryButton` (`@/shared/components/Buttons`), `type="button"`,
  `onClick={onClear}`, texto "Limpar filtros", posicionado ao lado do `PrimaryButton`
  "Filtrar" já existente.
- Ajustar o `className`/layout do `<form>` para acomodar os campos adicionais em uma
  linha com quebra (`flex flex-wrap items-end gap-3`, `max-w` mais largo), no mesmo
  padrão já usado em `SkillsFilterSection`/`DivinitiesFilterSection` (que já têm mais de
  um campo), em vez do `max-w-90` atual (dimensionado só para o campo único de nome).

**`<Entidade>Page` (`page.tsx`)** — mesma alteração, idêntica nos três arquivos:
- `app-web/src/app/(authorized)/treinamentos/page.tsx`
- `app-web/src/app/(authorized)/talentos/page.tsx`
- `app-web/src/app/(authorized)/caracteristicas/page.tsx`

Alterações em cada `page.tsx`:
- Novo estado local: `levelInput: string` (`useState('')`) e `selectedTags: ITag[]`
  (`useState<ITag[]>([])`), ao lado do `nameInput` já existente.
- Buscar opções de tags com o hook já existente `useTagOptionsQuery()`
  (`@/hooks/Queries`) — mesmo hook já usado nos `*CreateForm` — e repassar
  `tagOptions` para o `<Entidade>sFilterSection`.
- `handleSearch`: manter a atribuição de `name` já existente e adicionar, no mesmo
  `setFilters`:
  ```ts
  level: levelInput.trim() ? Number(levelInput.trim()) : undefined,
  tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined,
  ```
  Se `Number(levelInput.trim())` resultar em `NaN` (entrada inválida escapando do
  `type="number"` do input, ex. colar texto), tratar como filtro não aplicado
  (`undefined`) em vez de enviar `NaN` à API. `page` volta para `1`, como já ocorre
  hoje. Os três filtros (`name`, `level`, `tagIds`) continuam cumulativos por estarem
  todos no mesmo objeto `filters` consumido por `useGetEntityList` — nenhuma mudança de
  lógica de combinação é necessária além de incluir os novos campos.
- Novo `handleClear`: reseta `nameInput`, `levelInput` para `''` e `selectedTags` para
  `[]`, e reseta `filters` para `{ page: 1, perPage: APP_DEFAULT_PAGE_SIZE }` (sem
  `name`/`level`/`tagIds`), disparando nova busca sem nenhum filtro — mesmo padrão de
  reset já usado no `useState` inicial de `filters`.
- Repassar as novas props ao `<Entidade>sFilterSection`: `levelValue={levelInput}`,
  `onLevelChange={setLevelInput}`, `tagsValue={selectedTags}`,
  `onTagsChange={setSelectedTags}`, `tagOptions={tagOptions}`, `onClear={handleClear}`.
- Nenhuma alteração nas listas (`TrainingsList`/`TalentsList`/`CharacteristicsList`) nem
  nos itens de lista — a demanda é só de filtro, não de exibição adicional de coluna.

#### Integrações com API
- `GET /trainings` (`app-web/src/app/(authorized)/treinamentos/page.tsx`)
- `GET /talents` (`app-web/src/app/(authorized)/talentos/page.tsx`)
- `GET /characteristics` (`app-web/src/app/(authorized)/caracteristicas/page.tsx`)

Todos já consumidos via `useGetEntityList` (sem endpoint novo); a mudança é apenas nos
`filters` enviados como query params (`name` inalterado, `level` e `tagIds` novos,
conforme `task-api.md`). Antes de finalizar, o `web-dev` deve confirmar no `task-api.md`
já implementado (ou no Swagger em `/docs`) qual o formato exato de serialização de
`tagIds` esperado pelo backend (parâmetro repetido `tagIds=uuid1&tagIds=uuid2` vs.
outro formato) e, se a serialização padrão do axios (`params: filters` em
`useGetEntityList`) não corresponder, ajustar a chamada (ex. `paramsSerializer`) — isso
foi deixado como ponto em aberto no lado da API e precisa de verificação cruzada aqui.
- Também reaproveitado (sem alteração): `useTagOptionsQuery` (`GET /tags`, já usado nos
  formulários de criação/edição) para popular as opções do filtro de tags.

#### Formulário/validação
- Não se trata de um formulário `react-hook-form`/`zod` — os filtros continuam sendo
  estado local simples na página, como já é hoje para o campo de nome. Não há mensagens
  de erro de validação nos campos de filtro (mesmo padrão das demais `FilterSection` do
  projeto, nenhuma delas valida o input do usuário antes de filtrar).
- Campo de level: input numérico (`type="number"`, `min 1`, `step 1`), sem exigir
  preenchimento; quando vazio, nenhum filtro de level é aplicado; entrada inválida é
  tratada como filtro não aplicado (ver `handleSearch` acima).
- Campo de tags: seleção múltipla via `DefaultMultiAutocompleteInput`, sem mínimo/máximo
  de seleção; quando nenhuma tag é selecionada, nenhum filtro de tags é aplicado.
- Botão "Limpar filtros" reseta os três campos (nome, level, tags) de uma vez, conforme
  decisão fechada no spec.

#### Acesso Google
- Padrão: nenhuma ocultação necessária — os filtros (nome, level, tags) e o botão
  "Limpar filtros" são ações de leitura/navegação, disponíveis para todos os usuários
  independentemente de `provider`. O padrão `web-permissao-google-readonly` (ocultar
  criar/editar/excluir para `provider: 'google'`) já está implementado nas
  `*ListItem`/`page.tsx` de cada entidade e não é afetado por esta demanda — nenhuma
  alteração é necessária nesse comportamento.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Paridade real e literal entre as três páginas/`FilterSection` (Treinamentos,
    Talentos, Características) — mesmos nomes de prop, mesma ordem de campos, mesmo
    comportamento de `handleSearch`/`handleClear`.
  - `DefaultMultiAutocompleteInput` reproduz fielmente o comportamento visual (chips
    coloridos, estilos `APP_INPUT_STYLES`) do `FormMultiAutocompleteInput` já usado nos
    formulários de criação/edição, sem introduzir `react-hook-form` na `FilterSection`.
  - Filtros continuam cumulativos (`name` + `level` + `tagIds` combinados no mesmo
    objeto `filters`), sem regressão no filtro de nome já existente.
  - Botão "Limpar filtros" reseta os três campos e a paginação (`page: 1`) nas três
    páginas.
  - Confirmação de que o formato de envio de `tagIds` para a API bate com o que o
    backend espera (`task-api.md`/Swagger), ajustando serialização do axios se
    necessário.
  - Nenhuma alteração incidental em `TrainingsList`/`TalentsList`/
    `CharacteristicsList`, `*ListItem`, `*CreateForm` ou `*View` (fora de escopo desta
    demanda).
  - Comportamento de acesso Google inalterado (filtros visíveis para todos; ações de
    escrita continuam ocultas para `provider: 'google'`, sem relação com esta demanda).

## Revisão

Arquivos revisados (etapa "1. web-dev", concluída):
- app-web/src/shared/components/Inputs/DefaultInputs/DefaultMultiAutocompleteInput/index.tsx
- app-web/src/shared/components/Inputs/DefaultInputs/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentsFilterSection/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/interfaces/Entities/Talent/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/app/(authorized)/treinamentos/page.tsx
- app-web/src/app/(authorized)/talentos/page.tsx
- app-web/src/app/(authorized)/caracteristicas/page.tsx

Pontos verificados com atenção especial (sem achados):
- **Paridade entre as três páginas/`FilterSection`**: `TrainingsFilterSection`,
  `TalentsFilterSection` e `CharacteristicsFilterSection` são idênticas byte a byte
  (fora do prefixo de `id`/nome do componente), mesma ordem de props
  (`nameValue`/`onNameChange`/`levelValue`/`onLevelChange`/`tagsValue`/`onTagsChange`/
  `tagOptions`/`onSubmit`/`onClear`), mesmo layout (`flex max-w-220 flex-wrap
  items-end gap-3`, consistente com o padrão já usado em `DivinitiesFilterSection`/
  `SkillsFilterSection` para mais de um campo). Os três `page.tsx` também são
  idênticos na parte de filtro: mesmo estado (`nameInput`/`levelInput`/`selectedTags`),
  mesmo `handleSearch`, mesmo `handleClear`, mesma chamada a `useTagOptionsQuery()` e
  mesmas props repassadas ao `<Entidade>sFilterSection`.
- **`DefaultMultiAutocompleteInput`**: reproduz fielmente `FormMultiAutocompleteInput`
  (mesmo `Autocomplete` `multiple`, mesmo `renderValue` com `Chip` colorido via
  `getOptionColor`/`getContrastTextColor`, mesmo `renderInput` com
  `APP_INPUT_STYLES.textField`/`autocompleteField` e fonte acessível via
  `useAccessibleFontSize`), adaptado corretamente para estado simples (`value`/
  `onChange: (value: TOption[]) => void`, sem `Control`/`Controller`/`fieldState`).
  Props tipadas com genérico `<TOption>`, sem `any`. Exportado corretamente no barrel
  `DefaultInputs/index.ts`, ao lado de `DefaultTextInput`/`DefaultPasswordInput`/
  `DefaultAutocompleteInput`, sem duplicar nenhum componente já existente.
- **Integração com a API**: confirmado, lendo o `task-api.md` (etapa "1. api-dev",
  concluída) e o código-fonte de `axios@1.18.1` instalado
  (`node_modules/axios/lib/helpers/toFormData.js`), que a API espera `tagIds` no
  formato `tagIds[]=uuid1&tagIds[]=uuid2` (parâmetro repetido com colchetes) e que a
  serialização padrão do axios (sem `paramsSerializer` customizado em nenhum ponto do
  `app-web`, confirmado por busca em todo `src/`) para um array em `params` gera
  exatamente esse formato (`toFormData.js`, `defaultVisitor`: com `indexes: false` por
  padrão, um array "flat" é serializado como `key[]=valor` repetido) — nenhuma
  alteração foi necessária em `useGetEntityList`/`ApiFactory`, e a decisão está correta.
  `level` é enviado como valor exato (`level: number`), sem faixa. Entrada inválida de
  level (`NaN`, incluindo o caso de campo vazio) é tratada como filtro não aplicado em
  `handleSearch` (`levelInput.trim() && !Number.isNaN(parsedLevel) ? parsedLevel :
  undefined`), consistente nos três `page.tsx`.
- **Botão "Limpar filtros"**: `handleClear` reseta `nameInput`/`levelInput` para `''`
  e `selectedTags` para `[]`, e reseta `filters` inteiro para
  `{ page: 1, perPage: APP_DEFAULT_PAGE_SIZE }` (removendo `name`/`level`/`tagIds` do
  objeto, não apenas atribuindo `undefined`), disparando nova busca sem filtro algum
  já que `filters` está na `queryKey`/`params` de `useGetEntityList`. Idêntico nos
  três `page.tsx`.
- **Nenhuma alteração incidental**: confirmado por busca das novas props
  (`levelValue`/`onLevelChange`/`tagsValue`/`onTagsChange`/`onClear`) em cada pasta de
  feature — aparecem apenas em `page.tsx` e `*FilterSection`, sem tocar
  `TrainingsList`/`TalentsList`/`CharacteristicsList`, `*ListItem`, `*CreateForm` ou
  `*View`.
- **Acesso Google**: `isGoogleUser` (`useIsGoogleUser`) continua controlando apenas o
  botão "Novo" em cada `page.tsx`; os novos campos de filtro e o botão "Limpar
  filtros" ficam visíveis para todos os usuários, sem relação com `provider`,
  conforme o padrão `web-permissao-google-readonly` já aplicado nas ações de
  escrita (inalterado por esta demanda).
- **Reaproveitamento**: `formatTagLabel`/`getContrastTextColor` (`@/shared/util`),
  `SecondaryButton`/`PrimaryButton` (`@/shared/components/Buttons`) e
  `useTagOptionsQuery` (`@/hooks/Queries`) são reaproveitados sem duplicação, com o
  mesmo comportamento já usado em `TrainingCreateForm`/`TalentCreateForm`/
  `CharacteristicCreateForm` para exibir tags.
- **Ícones**: apenas `FiSearch` de `react-icons/fi`, já usado no campo de nome antes
  desta demanda; nenhum ícone novo introduzido.
- **Tipagem**: `ITrainingListFilters`/`ITalentListFilters`/`ICharacteristicListFilters`
  recebem `level?: number` e `tagIds?: string[]` na mesma posição relativa (logo após
  `name?`) nos três arquivos, sem `any` em nenhum arquivo revisado.

Aprovado. Nenhum problema encontrado nos arquivos revisados listados acima.
