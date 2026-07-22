# Task Web: Tags associadas a Criaturas

## Contexto
Não há `spec.md` para esta demanda — pedido já esclarecido diretamente pelo usuário.

Regra de negócio confirmada:
- Uma criatura pode ter zero ou mais tags, sem limite.

Premissa (fora do controle deste plano): o backend (`app-api`) está sendo alterado em
paralelo, em outra task, para a criatura passar a aceitar uma lista de tags no
create/update (array de IDs) e retornar uma lista de objetos `{ id, name, color }` no
response (listagem e detalhe). Este plano assume que a API já expõe esse contrato ao
ser implementado; qualquer divergência de nome de campo deve ser conferida contra o DTO
real do backend antes de finalizar (ver observação sobre `tagIds`/`tags` abaixo).

Investigação de código existente relevante:
- Entidade `Tag` já implementada em `app-web/src/app/(authorized)/tags/` (CRUD completo
  de referência) — `ITag`/`ITagListFilters` em
  `app-web/src/shared/interfaces/Entities/Tag/index.ts` (`ITag extends IEntity { name:
  string; color: string }`), endpoint `GET /tags` já aceita `name`/`page`/`perPage` e
  retorna `IPaginatedResponse<ITag>`.
- Entidade `Creature` já implementada em `app-web/src/app/(authorized)/criaturas/`, com
  listagem (`CreaturesList`/`CreaturesListItem`), formulário de criar/editar
  (`CreatureCreateForm`), modal de detalhe (`CreatureView`) e schema
  `shared/formSchemas/CreatureFormSchema`. Interfaces em
  `app-web/src/shared/interfaces/Entities/Creature/index.ts`: `ICreatureCategory` (tipo
  enxuto local, só `{ id; name }`, sem estender `IEntity`) é o precedente direto de como
  modelar um tipo de relação enxuto específico do domínio Criatura — o mesmo padrão deve
  ser seguido para o tipo enxuto de tag exibido em criatura (`{ id; name; color }`, sem
  `createdAt`/`updatedAt`), em vez de reaproveitar `ITag` (que estende `IEntity` e exige
  campos que o response de criatura não necessariamente inclui).
- `CreatureFormSchema` segue o padrão de campo único (sem variante de edição) descrito
  na skill `web-form-schema`; o campo de categoria (`categoryId`) no formulário mapeia
  para `category` (objeto) no response — mesmo padrão de nome diferente entre
  request/response que deve ser seguido para tags: campo do formulário `tagIds` (array
  de IDs) mapeando para `tags` (array de objetos) no response. **Isso é uma suposição
  baseada no precedente `categoryId`/`category` já existente nesta mesma entidade, não
  uma confirmação do contrato real da API em paralelo** — o `web-dev` deve conferir o
  nome exato do campo de request (`tagIds` vs. `tags` vs. outro) contra o DTO
  efetivamente implementado no backend antes de finalizar esta parte, e ajustar se
  necessário.
- `shared/components/Inputs/FormInputs/FormAutocompleteInput` existe, mas é
  **single-select** apenas (mapeia `field.value` para um único id via `getOptionValue`,
  `Autocomplete` sem prop `multiple`). **Não existe nenhum autocomplete multi-seleção
  reaproveitável em `shared/components/Inputs/FormInputs` nem em `DefaultInputs`** —
  precisa ser criado um novo componente, seguindo a skill `web-componentes` (categoria
  `FormInputs`, pasta própria, `Controller` do `react-hook-form`).
- Não existe nenhum componente genérico de "badge"/indicador circular com inicial +
  cor + tooltip em `shared/components/` — precisa ser criado. Segue o mesmo padrão de
  componente de propósito único no nível raiz de `shared/components/` já usado por
  `ImageAvatarPreview` (props primitivas — `imageUrl`, `alt`, `size` — sem importar
  nenhum tipo de `shared/interfaces/Entities`, cores aplicadas via `sx` local usando
  `APP_COLORS`, sem passar por um arquivo de `constants/Styles` dedicado, já que
  `ImageAvatarPreview` também não usa um arquivo de estilos próprio).
- `hooks/Queries` expõe os genéricos já usados no projeto (`useGetEntityList`,
  `usePostEntity`, `usePutEntity`, `useDeleteEntity`, `useGetEntityById`); a listagem de
  tags para popular o autocomplete deve ser buscada com `useGetEntityList<ITag,
  ITagListFilters>({ url: '/tags', filters: { perPage: <valor alto> } })` diretamente no
  `CreatureCreateForm`, sem criar um hook dedicado em `EntityQueries` — mesmo padrão que
  o usuário pediu explicitamente e compatível com a skill `web-integracao-api` (só se
  cria hook novo em `EntityQueries` quando a operação foge dos 4 verbos genéricos, o que
  não é o caso aqui).
  - Observação/lacuna não coberta pelo pedido: como `GET /tags` é paginado
    (`page`/`perPage`) e o pedido não define um limite de tags no sistema (apenas que
    uma criatura pode ter "zero ou mais tags, sem limite"), buscar com um `perPage` fixo
    alto (ex.: 100) resolve o caso comum, mas não garante que **todas** as tags
    cadastradas apareçam como opção caso o total ultrapasse esse valor. Não há requisito
    de busca incremental (autocomplete com `onInputChange` filtrando no servidor) nem de
    paginação dentro do próprio autocomplete — sinalizado aqui como lacuna de requisito,
    não assumido silenciosamente; se o volume real de tags puder ultrapassar a página
    buscada, isso precisa ser esclarecido/priorizado antes ou depois desta
    implementação.
- `CreaturesList`/`CreaturesListItem` seguem o padrão de tabela da skill
  `web-tabela-listagem` (colunas fixas + `TablePagination`); adicionar a coluna "Tags"
  exige ajustar o `colSpan` do estado vazio (`4` → `5`) em `CreaturesList`.
- `CreatureView` (modal de detalhe, `app/(authorized)/criaturas/components/CreatureView/`)
  hoje não exibe tags e **não está no escopo pedido** para esta demanda (o pedido cobre
  apenas formulário de cadastro/edição e coluna da listagem). Sinalizado aqui como
  possível lacuna para decisão futura — este plano não altera `CreatureView`.

## Etapas

### 1. web-dev

#### Componentes

- Componente: `FormMultiAutocompleteInput` (novo, em
  `shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`, exportado
  em `shared/components/Inputs/FormInputs/index.ts` e reexportado por
  `shared/components/Inputs/index.ts`), seguindo o mesmo padrão estrutural de
  `FormAutocompleteInput` (`Controller` do `react-hook-form`, `Label` acima do campo,
  `fieldState.error` como `helperText`, `APP_INPUT_STYLES`/`APP_INPUT_BASE_FONT_SIZE`,
  `useAccessibleFontSize`).
  - Props: `id: string`, `name: FieldPath<TFieldValues>`, `control:
    Control<TFieldValues>`, `label?: string`, `options: TOption[]`, `getOptionLabel:
    (option: TOption) => string`, `getOptionValue: (option: TOption) => string`,
    `placeholder?: string` — mesma assinatura genérica de `FormAutocompleteInput`, com a
    diferença de que `field.value` é `string[]` (array de ids) em vez de `string`.
  - Comportamento esperado: MUI `Autocomplete` com prop `multiple`, `value` calculado
    como `options.filter((option) => (field.value ?? []).includes(getOptionValue(option)))`,
    `onChange` chamando `field.onChange(newValue.map(getOptionValue))`; renderização
    padrão de chips selecionados do próprio MUI `Autocomplete` (`renderTags` default,
    sem necessidade de customização visual — isso é diferente do badge circular pedido
    para a listagem, que é um componente à parte); exibe erro de validação
    (`fieldState.error`) no mesmo padrão visual dos demais `FormInputs`. Componente
    genérico, sem qualquer acoplamento a Tag/Criatura — reutilizável em qualquer campo
    de seleção múltipla futuro.

- Componente: `TagBadge` (novo, em `shared/components/TagBadge/index.tsx`, seguindo o
  mesmo padrão de componente de propósito único no nível raiz de `shared/components/`
  já usado por `ImageAvatarPreview` — pasta própria, export nomeado do componente e de
  `TagBadgeProps`).
  - Props: `name: string`, `color: string`, `size?: number` (default pequeno, ex. 24px,
    coerente com o uso em célula de tabela) — **props primitivas apenas, sem importar
    `ITag` nem qualquer tipo de `shared/interfaces/Entities`**, para manter o componente
    genérico conforme a skill `web-componentes`.
  - Comportamento esperado: renderiza um indicador circular pequeno (MUI `Avatar` ou
    `Box` com `borderRadius: '50%'`) com `backgroundColor: color`, exibindo apenas a
    primeira letra de `name` maiúscula (`name.charAt(0).toUpperCase()`) centralizada,
    cor de texto clara para contraste sobre o fundo colorido, e borda sutil (mesmo
    padrão visual de contorno usado no indicador de cor de `TagsListItem`, via
    `APP_COLORS.goldDark`). Envolvido por um MUI `Tooltip` com `title={name}`, exibindo
    o nome completo da tag ao passar o cursor. Reutilizável por qualquer feature que
    precise exibir tags associadas a uma entidade (não específico de Criaturas).

Os dois componentes acima precisam existir antes de a funcionalidade abaixo consumi-los
(mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Interfaces (`app-web/src/shared/interfaces/Entities/Creature/index.ts`):
  - Novo tipo enxuto `ICreatureTag: { id: string; name: string; color: string }`
    (mesmo padrão de `ICreatureCategory`, sem estender `IEntity`).
  - `ICreatureListItem` passa a incluir `tags: ICreatureTag[]`.
  - `ICreature` passa a incluir `tags: ICreatureTag[]`.
  - Nenhuma alteração necessária em `ICreatureListFilters` (não há filtro por tag
    pedido no escopo).

- Schema de formulário (`app-web/src/shared/formSchemas/CreatureFormSchema/index.ts`):
  - Novo campo `tagIds: z.array(z.string()).optional()` no `creatureFormSchema` (array
    de IDs de tag, opcional — zero ou mais, sem limite máximo, coerente com a regra de
    negócio confirmada).
  - `creatureFormDefaultValues.tagIds = []`.
  - Ajustar `CreaturePayload`/`buildPayload` em `CreatureCreateForm` apenas se
    necessário para garantir que `tagIds` seja enviado como `[]` (não `undefined`)
    quando nenhuma tag for selecionada — mesmo padrão de tratamento já usado para
    `referenceImageUrl` nesse arquivo.

- Formulário (`app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`):
  - Buscar as opções de tag via `useGetEntityList<ITag, ITagListFilters>({ url:
    '/tags', filters: { perPage: 100 } })` (ver observação sobre limite de página na
    seção de Contexto), extraindo `data?.data ?? []` como `options`.
  - Novo campo `FormMultiAutocompleteInput<CreatureFormData, ITag>` com `name="tagIds"`,
    `label="Tags"`, `options` = lista de tags buscada acima, `getOptionLabel={(tag) =>
    tag.name}`, `getOptionValue={(tag) => tag.id}`, `placeholder="Selecione as tags"` —
    posicionado no mesmo grid de campos simples do formulário (junto a Nome/Categoria),
    já que não é um campo de texto rico.
  - Em modo edição, o `reset` a partir de `creatureDetail` (`useGetEntityById<ICreature>`)
    passa a incluir `tagIds: creatureDetail.tags?.map((tag) => tag.id) ?? []`.

- Listagem (`app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx`
  e `CreaturesListItem/index.tsx`):
  - Nova coluna "Tags" no cabeçalho de `CreaturesList` (entre "Categoria" e "Ações"),
    com `colSpan` do estado vazio ajustado de `4` para `5`.
  - Em `CreaturesListItem`, nova `TableCell` "Tags" renderizando as tags da criatura
    lado a lado: um contêiner `flex` (`display: flex; gap: 4px; flexWrap: wrap`) mapeando
    `creature.tags` e renderizando um `TagBadge` por tag (`name={tag.name}
    color={tag.color}`, `key={tag.id}`); quando `creature.tags` estiver vazio, a célula
    não exibe nenhum badge (sem necessidade de texto de fallback, mesmo tratamento
    implícito já usado para campos opcionais não exibidos na listagem).

- Integrações com API consumidas/alteradas por esta feature:
  - `GET /tags` — já existente, reaproveitado para popular as opções do autocomplete de
    tags no formulário de criatura (via `useGetEntityList`, sem novo hook).
  - `GET /creatures` — já existente (`useGetEntityList` em `criaturas/page.tsx`), sem
    mudança de chamada; passa a retornar também `tags: ICreatureTag[]` por item (mudança
    de contrato do backend, refletida apenas na tipagem `ICreatureListItem`).
  - `GET /creatures/:id` — já existente (`useGetEntityById` em `CreatureCreateForm`),
    sem mudança de chamada; passa a retornar também `tags: ICreatureTag[]` (mudança de
    contrato do backend, refletida na tipagem `ICreature` e no `reset` do formulário).
  - `POST /creatures` e `PUT /creatures/:id` — já existentes (`usePostEntity`/
    `usePutEntity` em `CreatureCreateForm`), payload passa a incluir `tagIds: string[]`
    (ver observação sobre nome do campo na seção de Contexto — confirmar contra o DTO
    real do backend).

- Formulário/validação — novo campo do `creatureFormSchema`:
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional, array de zero ou mais
    IDs de tag existentes (sem limite máximo), sem regra de unicidade adicional
    client-side (a seleção múltipla do `Autocomplete` já impede duplicar a mesma tag).

Status: concluído
Componentes: app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx (novo), app-web/src/shared/components/TagBadge/index.tsx (novo)
Arquivos: app-web/src/shared/components/Inputs/FormInputs/index.ts (reexport), app-web/src/shared/interfaces/Entities/Creature/index.ts (ICreatureTag, tags em ICreatureListItem/ICreature), app-web/src/shared/formSchemas/CreatureFormSchema/index.ts (campo tagIds), app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx (busca de tags via useGetEntityList, campo FormMultiAutocompleteInput, reset com tagIds, buildPayload com tagIds), app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx (coluna Tags, colSpan 4→5), app-web/src/app/(authorized)/criaturas/components/CreaturesListItem/index.tsx (célula Tags com TagBadge). Nome de campo de request confirmado como `tagIds` e de response como `tags` conforme confirmação do backend informada pelo orquestrador — sem pendência de nomenclatura.

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

- **app-web/src/shared/components/TagBadge/index.tsx:22** — Cor de texto hardcoded (`'#fff'`) diretamente no `sx` do componente, em vez de vir de `APP_COLORS`. A skill `web-cores` é explícita: "Dentro de `sx` de componente MUI... use `APP_COLORS.<nome>` — nunca um hex literal solto no meio do componente". O restante do componente já segue a regra corretamente (`APP_COLORS.goldDark` na borda); o `backgroundColor: color` é aceitável por ser um valor dinâmico vindo da tag, mas a cor de texto é um valor de design fixo e deveria vir de um token. Confirmado por grep que este é o único hex literal solto em todo `src/` fora de `globals.css`.
  - Trecho: `color: '#fff',`
  - Sugestão: adicionar um token neutro claro em `APP_COLORS` (e no `globals.css`, seguindo os dois lugares exigidos pela skill `web-cores`, ex.: `textLight`/`badgeText`) e usar `APP_COLORS.<novoToken>` no lugar do hex literal.

Fora esse ponto, a etapa "1. web-dev" está de acordo com os padrões do projeto e com o `task-web.md`:
- `FormMultiAutocompleteInput` (`app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`) segue fielmente a estrutura de `FormAutocompleteInput` (mesma assinatura genérica, `Controller`, `Label`, `APP_INPUT_STYLES`/`APP_INPUT_BASE_FONT_SIZE`, `useAccessibleFontSize`), com `multiple`, `value`/`onChange` calculados conforme especificado, e está corretamente reexportado em `FormInputs/index.ts` e `Inputs/index.ts`.
- `ICreatureTag`, `ICreatureListItem.tags` e `ICreature.tags` (`app-web/src/shared/interfaces/Entities/Creature/index.ts`) seguem o precedente enxuto de `ICreatureCategory`, sem estender `IEntity`.
- `creatureFormSchema`/`creatureFormDefaultValues` (`app-web/src/shared/formSchemas/CreatureFormSchema/index.ts`) adicionam `tagIds` como `z.array(z.string()).optional()` com default `[]`, mantendo o padrão de schema único (sem variante de edição) já usado nesta entidade.
- `CreatureCreateForm` busca as tags via `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: 100 } })` sem hook dedicado (conforme pedido), usa `FormMultiAutocompleteInput` no grid de campos simples, faz `reset` com `tagIds: creatureDetail.tags?.map((tag) => tag.id) ?? []` em modo edição, e `buildPayload` garante `tagIds: data.tagIds ?? []`. As duas mutations (`usePostEntity`/`usePutEntity`) mantêm `invalidateQueryKeys: [['/creatures']]`, `onSuccess`/`onError` com toast, e o modo criar/editar continua derivado de `useSelectedCreatureStore` — nenhum `refetch()` manual ou recarregamento de página.
- `CreaturesList` adiciona a coluna "Tags" entre "Categoria" e "Ações" e ajusta `colSpan` de `4` para `5` no estado vazio. `CreaturesListItem` renderiza um `TagBadge` por tag em um contêiner flex com wrap, sem fallback textual quando a lista de tags está vazia — conforme especificado.
- Nenhum ícone fora de `react-icons/fi` foi introduzido; nenhuma duplicação de componente já existente em `shared/components/`; nenhuma seção de filtro inline foi adicionada (fora do escopo desta task).

Arquivos revisados: app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx, app-web/src/shared/components/Inputs/FormInputs/index.ts, app-web/src/shared/components/Inputs/index.ts, app-web/src/shared/components/TagBadge/index.tsx, app-web/src/shared/interfaces/Entities/Creature/index.ts, app-web/src/shared/formSchemas/CreatureFormSchema/index.ts, app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx, app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx, app-web/src/app/(authorized)/criaturas/components/CreaturesListItem/index.tsx.
