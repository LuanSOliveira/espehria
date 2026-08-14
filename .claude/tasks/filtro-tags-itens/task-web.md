# Task Web: Filtro por tags (tagIds) na listagem de itens

## Contexto
Não existe `.claude/tasks/filtro-tags-itens/spec.md`. Este plano foi feito
diretamente a partir do pedido do usuário, com apoio do
`.claude/tasks/filtro-tags-itens/task-api.md` (que cobre a mudança no backend:
adição de `tagIds` aos DTOs de query e services `findAllPaginated` dos 8
módulos de item — `weapons`, `armors`, `shields`, `accessories`, `ammunition`,
`materials`, `consumables`, `utilities`). Este documento cobre **apenas** o
`app-web`.

Objetivo: adicionar o filtro por TAGS na seção de filtros das 8 páginas de
listagem de itens, replicando o padrão já implementado em
`app-web/src/app/(authorized)/treinamentos/` (`TrainingsFilterSection` +
`treinamentos/page.tsx`), sem criar nenhuma abstração nova de filtro por tags.

### Investigação já feita (referência para o implementador)
- Padrão de referência (não copiar sem adaptar nomes):
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`
    usa `DefaultMultiAutocompleteInput<ITag>` de `@/shared/components/Inputs`,
    com `options={tagOptions}`, `getOptionLabel={formatTagLabel}` (de
    `@/shared/util`), `getOptionValue={(tag) => tag.id}`,
    `getOptionColor={(tag) => tag.color}`, `value`/`onChange` controlados,
    `placeholder="Selecione as tags"`, `label="Tags"`, dentro de uma `div`
    `className="min-w-60 flex-1"`. As props novas na interface do
    `FilterSection` são `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`,
    `tagOptions: ITag[]`.
  - `app-web/src/app/(authorized)/treinamentos/page.tsx` usa
    `useTagOptionsQuery()` de `@/hooks/Queries` (`{ tagOptions } = useTagOptionsQuery()`),
    mantém `const [selectedTags, setSelectedTags] = useState<ITag[]>([])`, no
    `handleSearch` monta `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`,
    e tem um `handleClear` que reseta todos os inputs (`setNameInput('')`,
    `setLevelInput('')`, `setSelectedTags([])`) e os `filters`
    (`setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`); o botão
    `SecondaryButton` "Limpar filtros" chama esse handler.
- `useGetEntityList` (`@/hooks/Queries`) usa `ApiFactory(...).get(url, { params: filters })`
  — a serialização de arrays (`tagIds`) na querystring fica a cargo do
  serializador padrão do axios usado por `ApiFactory`, o mesmo já usado por
  `treinamentos` (que já funciona corretamente contra o backend com
  `tagIds[]=uuid1&tagIds[]=uuid2`). **Nenhuma das 8 páginas abaixo usa um
  caminho de fetch diferente de `useGetEntityList`/`ApiFactory`** — todas
  chamam `useGetEntityList<I<Entidade>ListItem, I<Entidade>ListFilters>({ url: '/<recurso>', filters })`
  exatamente como `treinamentos`, então nenhuma mudança de serialização é
  necessária. Ainda assim, o implementador deve validar manualmente (network
  tab) que a querystring gerada é `tagIds[]=...` em pelo menos uma das 8
  páginas após a implementação.
- **Todas as 8 páginas hoje seguem o MESMO padrão simples**, sem tags e sem
  botão "Limpar filtros" — só têm o campo "Nome" + botão "Filtrar":
  - `WeaponsFilterSection` (`armas/components/WeaponsFilterSection/index.tsx`),
    `armas/page.tsx`, interface `IWeaponListFilters`
    (`app-web/src/shared/interfaces/Entities/Weapon/index.ts`, linhas 55-59).
  - `ArmorsFilterSection` (`armaduras/components/ArmorsFilterSection/index.tsx`),
    `armaduras/page.tsx`, interface `IArmorListFilters`
    (`app-web/src/shared/interfaces/Entities/Armor/index.ts`, linhas 38-42).
  - `ShieldsFilterSection` (`escudos/components/ShieldsFilterSection/index.tsx`),
    `escudos/page.tsx`, interface `IShieldListFilters`
    (`app-web/src/shared/interfaces/Entities/Shield/index.ts`, linhas 26-30).
  - `AccessoriesFilterSection` (`acessorios/components/AccessoriesFilterSection/index.tsx`),
    `acessorios/page.tsx`, interface `IAccessoryListFilters`
    (`app-web/src/shared/interfaces/Entities/Accessory/index.ts`, linhas 26-30).
  - `AmmunitionFilterSection` (`municoes/components/AmmunitionFilterSection/index.tsx`),
    `municoes/page.tsx`, interface `IAmmunitionListFilters`
    (`app-web/src/shared/interfaces/Entities/Ammunition/index.ts`, linhas 26-30).
  - `MaterialsFilterSection` (`materiais/components/MaterialsFilterSection/index.tsx`),
    `materiais/page.tsx`, interface `IMaterialListFilters`
    (`app-web/src/shared/interfaces/Entities/Material/index.ts`, linhas 26-30).
  - `ConsumablesFilterSection` (`consumiveis/components/ConsumablesFilterSection/index.tsx`),
    `consumiveis/page.tsx`, interface `IConsumableListFilters`
    (`app-web/src/shared/interfaces/Entities/Consumable/index.ts`, linhas 26-30).
  - `UtilitiesFilterSection` (`utilitarios/components/UtilitiesFilterSection/index.tsx`),
    `utilitarios/page.tsx`, interface `IUtilityListFilters`
    (`app-web/src/shared/interfaces/Entities/Utility/index.ts`, linhas 26-30).
  - Todas as 8 interfaces hoje têm exatamente `{ name?: string; page?: number; perPage?: number; }`.
  - **IMPORTANTE**: mesmo assim, o implementador deve reconferir o nome real
    do componente, da interface e das props de cada página antes de editar
    (o código pode ter mudado desde este planejamento) — não assumir só pela
    convenção de nomes.
- Nenhum componente reutilizável novo precisa ser criado em
  `shared/components/`: `DefaultMultiAutocompleteInput` já existe e já é
  usado exatamente para este propósito em `treinamentos`. O único "componente
  novo" por página é a própria edição do `<Entidade>FilterSection` já
  existente (não uma criação do zero), então não se enquadra como subseção de
  Componentes do template — é edição de funcionalidade existente.

## Etapas

### 1. web-dev

Status: concluído

Implementado o filtro por tags (`tagIds`) nas 8 páginas de listagem de itens,
replicando exatamente o padrão de `treinamentos` (`DefaultMultiAutocompleteInput<ITag>`
+ `useTagOptionsQuery` + `formatTagLabel`, botão "Limpar filtros" novo em todas). Nenhum
componente/hook/abstração genérica novo foi criado — apenas edição das interfaces de
filtro, dos `<Entidade>FilterSection` e das `page.tsx` já existentes. `max-w-160`
alterado para `max-w-200` (2 inputs + 2 botões) nos 8 `FilterSection`.

Componentes:
- `app-web/src/app/(authorized)/armas/components/WeaponsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/armaduras/components/ArmorsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/escudos/components/ShieldsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/acessorios/components/AccessoriesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/municoes/components/AmmunitionFilterSection/index.tsx`
- `app-web/src/app/(authorized)/materiais/components/MaterialsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/consumiveis/components/ConsumablesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/utilitarios/components/UtilitiesFilterSection/index.tsx`

Arquivos:
- `app-web/src/shared/interfaces/Entities/Weapon/index.ts` (`tagIds?: string[]` em `IWeaponListFilters`)
- `app-web/src/shared/interfaces/Entities/Armor/index.ts` (`tagIds?: string[]` em `IArmorListFilters`)
- `app-web/src/shared/interfaces/Entities/Shield/index.ts` (`tagIds?: string[]` em `IShieldListFilters`)
- `app-web/src/shared/interfaces/Entities/Accessory/index.ts` (`tagIds?: string[]` em `IAccessoryListFilters`)
- `app-web/src/shared/interfaces/Entities/Ammunition/index.ts` (`tagIds?: string[]` em `IAmmunitionListFilters`)
- `app-web/src/shared/interfaces/Entities/Material/index.ts` (`tagIds?: string[]` em `IMaterialListFilters`)
- `app-web/src/shared/interfaces/Entities/Consumable/index.ts` (`tagIds?: string[]` em `IConsumableListFilters`)
- `app-web/src/shared/interfaces/Entities/Utility/index.ts` (`tagIds?: string[]` em `IUtilityListFilters`)
- `app-web/src/app/(authorized)/armas/page.tsx`
- `app-web/src/app/(authorized)/armaduras/page.tsx`
- `app-web/src/app/(authorized)/escudos/page.tsx`
- `app-web/src/app/(authorized)/acessorios/page.tsx`
- `app-web/src/app/(authorized)/municoes/page.tsx`
- `app-web/src/app/(authorized)/materiais/page.tsx`
- `app-web/src/app/(authorized)/consumiveis/page.tsx`
- `app-web/src/app/(authorized)/utilitarios/page.tsx`

Pendências: nenhuma. A validação manual da querystring `tagIds[]=...` via devtools
(network tab) fica a cargo da etapa "2. web-dev-codereviewer" ou de teste manual
posterior, já que este agente não tem acesso a ferramentas de execução/browser.

#### Funcionalidade

Para CADA uma das 8 páginas abaixo (`armas`, `armaduras`, `escudos`,
`acessorios`, `municoes`, `materiais`, `consumiveis`, `utilitarios`), replicar
o padrão de `treinamentos` com as seguintes mudanças:

**1. Interface de filtros (`shared/interfaces/Entities/<Entidade>/index.ts`)**
- Adicionar `tagIds?: string[];` em `I<Entidade>ListFilters` (mesma posição
  relativa usada em `ITrainingListFilters`: após os demais campos de filtro e
  antes de `page`/`perPage`).

**2. `<Entidade>FilterSection` (`components/<Entidade>FilterSection/index.tsx`)**
- Confirmar o nome real do componente/arquivo/props antes de editar.
- Adicionar as props `tagsValue: ITag[]`, `onTagsChange: (value: ITag[]) => void`,
  `tagOptions: ITag[]` à interface `<Entidade>FilterSectionProps`.
- Adicionar dentro do `<form>` um `<div className="min-w-60 flex-1">` com
  `DefaultMultiAutocompleteInput<ITag>` (`id="<entidade>-tags-filter"` — usar
  o mesmo prefixo já usado no `id` do campo "Nome" da página, ex.:
  `weapon-tags-filter` para armas, `materials-tags-filter` para materiais,
  etc., conferindo o prefixo real existente em cada arquivo), `label="Tags"`,
  `options={tagOptions}`, `getOptionLabel={formatTagLabel}` (import de
  `@/shared/util`), `getOptionValue={(tag) => tag.id}`,
  `getOptionColor={(tag) => tag.color}`, `value={tagsValue}`,
  `onChange={onTagsChange}`, `placeholder="Selecione as tags"`.
- Adicionar a prop `onClear: () => void` e o botão `SecondaryButton` "Limpar
  filtros" (import de `@/shared/components/Buttons`, já importa
  `PrimaryButton`) logo após o `PrimaryButton` "Filtrar", com o mesmo `sx`
  (`{ width: 'auto', padding: '12px 24px' }`) e `type="button"
  onClick={onClear}` — nenhuma dessas 8 páginas tem esse botão hoje, então ele
  é novo em todas.
- Ajustar o `max-w-*` da `form` (hoje `max-w-160` com 1 input + 1 botão em
  todas as 8): como o resultado passa a ter 2 inputs (Nome + Tags) + 2 botões
  (Filtrar + Limpar filtros), aumentar a largura máxima proporcionalmente
  (o padrão de `treinamentos`, com 3 inputs + 2 botões, usa `max-w-220`) —
  ajustar visualmente para um valor coerente com 2 inputs + 2 botões (não
  necessariamente `max-w-220`; conferir no navegador que os campos não
  quebram linha de forma estranha em telas comuns).

**3. `page.tsx` de cada entidade**
- Confirmar o nome real dos handlers/estados existentes antes de editar.
- Importar `useTagOptionsQuery` de `@/hooks/Queries` e `ITag` de
  `@/shared/interfaces` (ambos já usados por `treinamentos/page.tsx`).
- Adicionar `const [selectedTags, setSelectedTags] = useState<ITag[]>([]);`
  e `const { tagOptions } = useTagOptionsQuery();`.
- No handler de submit (`handleSearch`), adicionar ao objeto de filtros:
  `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`.
- Criar um novo handler `handleClear` (nenhuma das 8 páginas tem hoje) que
  reseta TODOS os filtros da página — não só as tags: `setNameInput('')`,
  `setSelectedTags([])`, e `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`.
- Passar `tagsValue={selectedTags}`, `onTagsChange={setSelectedTags}`,
  `tagOptions={tagOptions}` e `onClear={handleClear}` para o
  `<Entidade>FilterSection`.

**Páginas/rotas afetadas** (todas já existentes, nenhuma rota nova):
`/armas`, `/armaduras`, `/escudos`, `/acessorios`, `/municoes`, `/materiais`,
`/consumiveis`, `/utilitarios` (ver `APP_ROUTES.private` em `shared/routes.ts`
para os paths exatos, caso precisem ser referenciados).

**Integrações com API**: `GET /weapons`, `GET /armors`, `GET /shields`,
`GET /accessories`, `GET /ammunition`, `GET /materials`, `GET /consumables`,
`GET /utilities` (mesmos endpoints já consumidos por cada página via
`useGetEntityList`, agora recebendo `tagIds[]` na querystring quando houver
tags selecionadas) e `GET /tags` (via `useTagOptionsQuery`, já usado por
`treinamentos`, sem mudança nele).

**Formulário/validação**: não há formulário de submissão com `react-hook-form`
envolvido — o "formulário" é a seção de filtros (`<form>` com `onSubmit`
manual chamando `event.preventDefault()`), sem schema `zod`, seguindo
exatamente o padrão de `treinamentos`. Nenhum campo é obrigatório; múltiplas
tags podem ser selecionadas e são combinadas com AND no backend (regra já
implementada na API, sem impacto na UI além do rótulo/placeholder do input).

**Acesso Google**: sem mudança — o filtro de tags é uma funcionalidade de
listagem, disponível para todos os usuários (inclusive `provider: 'google'`).
As 8 páginas já ocultam as ações de criar/editar/excluir para usuários Google
(`!isGoogleUser &&` no botão "Novo", e comportamento equivalente nos itens da
lista) e este comportamento não é alterado por esta demanda — apenas
confirmar, ao editar, que a nova seção de filtros continua visível e
funcional também para usuários Google (leitura/listagem sempre permitida).

### 2. web-dev-codereviewer

Status: concluído

- Revisar tudo acima nas 8 páginas, com atenção especial a:
  - Nome real de componente/interface/props conferido individualmente em cada
    uma das 8 páginas (sem assumir por convenção/cópia entre páginas).
  - `tagIds` adicionado corretamente em cada uma das 8 interfaces
    `I<Entidade>ListFilters`.
  - `handleClear` resetando TODOS os filtros da página (nome + tags + demais
    campos, quando existirem), não só as tags, nas 8 páginas.
  - Botão "Limpar filtros" (`SecondaryButton`) presente e funcional nas 8
    páginas, com o mesmo estilo/posicionamento do padrão de `treinamentos`.
  - `id` dos novos inputs de tags consistente com o prefixo já usado pelo
    campo "Nome" de cada página.
  - Nenhuma abstração nova de filtro por tags criada — reaproveitamento de
    `DefaultMultiAutocompleteInput`, `useTagOptionsQuery` e `formatTagLabel`
    exatamente como em `treinamentos`.
  - Querystring gerada de fato como `tagIds[]=uuid1&tagIds[]=uuid2` (validar
    em pelo menos uma página via devtools).
  - Textos de UI em pt-BR ("Tags", "Selecione as tags", "Limpar filtros").
  - Nenhuma mudança indevida em comportamento de acesso Google (criar/editar/
    excluir permanecem ocultos para `provider: 'google'`; filtros continuam
    visíveis para todos).

## Revisão

Revisão feita lendo, na íntegra, as 8 interfaces `I<Entidade>ListFilters`, os 8
`<Entidade>FilterSection/index.tsx` e as 8 `page.tsx` (armas, armaduras,
escudos, acessorios, municoes, materiais, consumiveis, utilitarios), comparando
linha a linha com o padrão de referência `treinamentos`
(`TrainingsFilterSection/index.tsx` e `treinamentos/page.tsx`).

Checklist verificado nas 8 páginas:
- `tagIds?: string[]` presente em todas as 8 interfaces `I<Entidade>ListFilters`,
  na posição correta (após `name`, antes de `page`/`perPage`).
- Cada `<Entidade>FilterSectionProps` tem exatamente `tagsValue: ITag[]`,
  `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]` e `onClear: () => void`,
  idênticas em forma às de `TrainingsFilterSectionProps`.
- `DefaultMultiAutocompleteInput<ITag>` usado em todas, com
  `getOptionLabel={formatTagLabel}` (import de `@/shared/util`),
  `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`,
  `value`/`onChange` controlados, `label="Tags"`, `placeholder="Selecione as tags"`,
  dentro de `<div className="min-w-60 flex-1">` — nenhuma abstração nova criada.
- `id` do input de tags consistente com o prefixo do campo "Nome" em cada
  página: `weapon-tags-filter`/`weapon-name-filter` (armas),
  `armor-tags-filter`/`armor-name-filter` (armaduras),
  `shield-tags-filter`/`shield-name-filter` (escudos),
  `accessory-tags-filter`/`accessory-name-filter` (acessorios),
  `ammunition-tags-filter`/`ammunition-name-filter` (municoes),
  `materials-tags-filter`/`materials-name-filter` (materiais),
  `consumables-tags-filter`/`consumables-name-filter` (consumiveis),
  `utilities-tags-filter`/`utilities-name-filter` (utilitarios).
- Botão `SecondaryButton` "Limpar filtros" presente em todas, logo após o
  `PrimaryButton` "Filtrar", com `type="button" onClick={onClear}` e o mesmo
  `sx={{ width: 'auto', padding: '12px 24px' }}` de `treinamentos`.
- `max-w-160` alterado para `max-w-200` nas 8 `form` (2 inputs + 2 botões),
  consistente e proporcional ao `max-w-220` de `treinamentos` (3 inputs +
  2 botões).
- `page.tsx` das 8 páginas: importa `useTagOptionsQuery` de `@/hooks/Queries`
  e `ITag` de `@/shared/interfaces`; declara
  `const [selectedTags, setSelectedTags] = useState<ITag[]>([]);` e
  `const { tagOptions } = useTagOptionsQuery();`; `handleSearch` inclui
  `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`;
  `handleClear` novo em todas, resetando `nameInput`, `selectedTags` e
  `filters` (`setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`) —
  ou seja, reseta TODOS os filtros da página, não só as tags; `<Entidade>FilterSection`
  recebe `tagsValue`, `onTagsChange`, `tagOptions` e `onClear={handleClear}`.
- Nenhum ícone fora de `react-icons` (apenas `FiSearch`, já existente,
  reaproveitado sem alteração).
- Textos de UI em pt-BR confirmados: "Tags", "Selecione as tags",
  "Limpar filtros".
- Acesso Google: nenhuma das `page.tsx`/`FilterSection` editadas altera o
  bloco `{!isGoogleUser && (<PrimaryButton>Novo</PrimaryButton>)}` nem toca em
  `<Entidade>ListItem` (fora do escopo de arquivos editados nesta task); a
  seção de filtros continua renderizada incondicionalmente para todos os
  usuários, inclusive Google, como esperado.
- Mecanismo de fetch: nenhuma das 8 páginas usa caminho de fetch diferente de
  `useGetEntityList`/`ApiFactory` (`hooks/Queries/DefaultQueries/useGetEntityList`
  e `services/api/index.ts` não foram alterados nesta task), portanto a
  serialização de `tagIds` na querystring segue o mesmo comportamento padrão
  do axios já validado em produção por `treinamentos`. Não foi possível abrir
  o devtools/network tab para validar visualmente `tagIds[]=uuid1&tagIds[]=uuid2`
  neste agente (sem acesso a ferramentas de execução/browser, mesma limitação
  já registrada pela etapa 1) — recomenda-se essa validação manual antes do
  merge, mas não é um bloqueio de código, já que o mecanismo é idêntico e
  inalterado ao de `treinamentos`.

Aprovado. Nenhum problema de código, nomenclatura, tipagem, reaproveitamento
de componentes ou acesso Google encontrado nos arquivos revisados:
`app-web/src/shared/interfaces/Entities/{Weapon,Armor,Shield,Accessory,Ammunition,Material,Consumable,Utility}/index.ts`,
`app-web/src/app/(authorized)/armas/components/WeaponsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/armas/page.tsx`,
`app-web/src/app/(authorized)/armaduras/components/ArmorsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/armaduras/page.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/escudos/page.tsx`,
`app-web/src/app/(authorized)/acessorios/components/AccessoriesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/acessorios/page.tsx`,
`app-web/src/app/(authorized)/municoes/components/AmmunitionFilterSection/index.tsx`,
`app-web/src/app/(authorized)/municoes/page.tsx`,
`app-web/src/app/(authorized)/materiais/components/MaterialsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/materiais/page.tsx`,
`app-web/src/app/(authorized)/consumiveis/components/ConsumablesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/consumiveis/page.tsx`,
`app-web/src/app/(authorized)/utilitarios/components/UtilitiesFilterSection/index.tsx`,
`app-web/src/app/(authorized)/utilitarios/page.tsx`.
