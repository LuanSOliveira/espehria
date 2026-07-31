# Task Web: Atributo chave em Perícias

## Contexto
Ver .claude/tasks/pericias-atributo-chave/spec.md

## Etapas

### 1. web-dev

#### Funcionalidade

**Interfaces compartilhadas (`shared/interfaces`)**
- Criar `IAttribute` (`{ id: string; name: string }`) em arquivo próprio
  `Entities/Attribute/index.ts` (exportado pelo barrel `Entities/index.ts`),
  já que — diferente das categorias de raça/criatura/divindade, que são
  conceitos exclusivos de cada entidade — o `Attribute` é explicitamente
  genérico/reaproveitável por outras entidades no futuro (conforme spec),
  então não deve ficar aninhado dentro de `Entities/Skill/index.ts`.
- Em `Entities/Skill/index.ts`:
  - `ISkill`: adicionar `keyAttribute: IAttribute`.
  - `ISkillListItem`: adicionar `keyAttribute: IAttribute` (necessário para
    exibir o atributo na linha da listagem — o back precisa retornar esse
    dado no endpoint de listagem paginada de `/skills`).
  - `ISkillListFilters`: adicionar `keyAttributeId?: string`.

**Hook dedicado de atributos (`hooks/Queries/EntityQueries`)**
- Criar `useAttributesQuery`, no mesmo padrão de `useRaceCategoriesQuery`
  (`queryKey: ['/attributes']`, `GET /attributes` via `ApiFactory` +
  `getAuthToken()`, retorno tipado como `IAttribute[]`, `staleTime` igual ao
  das demais queries de categoria). Justificativa (já registrada no spec):
  `/attributes` retorna lista simples não paginada, mesmo formato de
  `/races/categories`, portanto usa hook dedicado e não o hook genérico
  `useGetEntityList` (que assume resposta paginada).
- Exportar o novo hook em `hooks/Queries/EntityQueries/index.ts` (mesmo
  barrel de `useRaceCategoriesQuery`, `useCreatureCategoriesQuery` etc.), já
  reexportado por `hooks/Queries`.

**Schema de formulário (`shared/formSchemas/SkillFormSchema`)**
- Adicionar campo obrigatório `keyAttributeId: z.string().min(1, 'Selecione o
  atributo chave')` ao `skillFormSchema`, ao `SkillFormData` inferido e ao
  `skillFormDefaultValues` (valor inicial `''`), seguindo exatamente o
  padrão de `categoryId` em `RaceFormSchema`.

**`SkillCreateForm` (`app/(authorized)/pericias/components/SkillCreateForm`)**
- Buscar a lista de atributos com `useAttributesQuery()`.
- Adicionar `FormAutocompleteInput<SkillFormData, IAttribute>` para
  `keyAttributeId` na mesma linha/grid do campo de tags (o grid atual
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` já contém `name` e `tagIds`;
  inserir o novo campo nessa mesma `div`, ao lado de `tagIds`), com
  `getOptionLabel`/`getOptionValue` no padrão do campo `categoryId` de
  `RaceCreateForm` (label = `attribute.name`, value = `attribute.id`,
  placeholder "Selecione o atributo chave").
- No `useEffect` de `reset` em modo de edição, incluir
  `keyAttributeId: skillDetail.keyAttribute.id`.
- `buildPayload`/`SkillPayload`: `keyAttributeId` já é incluído
  automaticamente pelo spread de `data` (não precisa de tratamento especial
  como `tagIds`/`sections`), mas confirmar que o payload enviado ao back
  contém a chave `keyAttributeId`.

**`SkillsFilterSection` (`app/(authorized)/pericias/components/SkillsFilterSection`)**
- Seguir exatamente o padrão de `RacesFilterSection`: adicionar props
  `attributeValue: IAttribute | null`, `onAttributeChange: (value:
  IAttribute | null) => void` e `attributes: IAttribute[]`.
- Adicionar um `DefaultAutocompleteInput<IAttribute>` (label "Atributo
  Chave", `getOptionLabel={(attribute) => attribute.name}`, placeholder
  "Todos os atributos") ao lado do filtro de nome já existente, dentro do
  mesmo `<form>` (os inputs de filtro continuam encapsulados neste
  componente, nunca inline em `page.tsx`).

**`SkillsListItem` (`app/(authorized)/pericias/components/SkillsListItem`)**
- Adicionar uma `TableCell` exibindo `skill.keyAttribute.name`, entre a
  coluna "Nome" e a coluna de ações, no mesmo padrão de exibição de texto
  simples já usado para `race.category.name` em `RacesListItem`.

**`SkillsList` (`app/(authorized)/pericias/components/SkillsList`)**
- Adicionar a coluna de cabeçalho "Atributo Chave" correspondente (entre
  "Nome" e "Ações") e atualizar o `colSpan` da linha de "nenhuma perícia
  encontrada" de `2` para `3`.

**`SkillView` (`app/(authorized)/pericias/components/SkillView`)**
- Exibir o atributo chave (`skill.keyAttribute.name`) na visualização
  detalhada da perícia, no mesmo padrão usado para a categoria em
  `RaceView` (bloco `detailInfoField` com ícone, `Label` "Atributo Chave" e
  `DefaultText` com o nome), posicionado próximo ao nome/tags da perícia.

**Página `app/(authorized)/pericias/page.tsx`**
- Buscar os atributos com `useAttributesQuery()` (mesmo padrão de
  `useRaceCategoriesQuery` em `racas/page.tsx`).
- Adicionar estado `attributeFilter: IAttribute | null` e repassar
  `attributeValue`/`onAttributeChange`/`attributes` para
  `SkillsFilterSection`.
- No `handleSearch`, incluir `keyAttributeId: attributeFilter?.id` no
  `setFilters`, no mesmo padrão de `categoryId` em `racas/page.tsx`.

**Integrações com API**
- `GET /attributes` (novo, via `useAttributesQuery`) — lista simples não
  paginada de atributos, para popular o select do formulário e o filtro da
  listagem.
- `GET /skills` — filtro adicional `keyAttributeId` na querystring.
- `GET /skills/:id`, `POST /skills`, `PUT /skills/:id` — payload/response
  passam a incluir `keyAttributeId` (envio) e `keyAttribute` (retorno).

**Formulário/validação**
- `keyAttributeId`: obrigatório, `z.string().min(1, 'Selecione o atributo
  chave')`, seguindo exatamente o tratamento de obrigatoriedade de
  `categoryId` em Raças (spec confirma esse padrão).

**Acesso Google:** ocultar criar/editar/excluir (padrão) — nenhuma mudança
necessária além da já existente em `SkillsListItem`/`pericias/page.tsx`
(`useIsGoogleUser`); o novo campo/filtro de atributo chave é apenas
informativo/de visualização e não afeta essa regra.

Status: concluído
Componentes: app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsListItem/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsList/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillView/index.tsx
Arquivos: app-web/src/shared/interfaces/Entities/Attribute/index.ts (novo), app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/interfaces/Entities/Skill/index.ts, app-web/src/hooks/Queries/EntityQueries/useAttributesQuery/index.ts (novo), app-web/src/hooks/Queries/EntityQueries/index.ts, app-web/src/shared/formSchemas/SkillFormSchema/index.ts, app-web/src/app/(authorized)/pericias/page.tsx

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados: app-web/src/shared/interfaces/Entities/Attribute/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/interfaces/Entities/Skill/index.ts, app-web/src/hooks/Queries/EntityQueries/useAttributesQuery/index.ts, app-web/src/hooks/Queries/EntityQueries/index.ts, app-web/src/shared/formSchemas/SkillFormSchema/index.ts, app-web/src/app/(authorized)/pericias/page.tsx, app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsListItem/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsList/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillView/index.tsx.

Observações da verificação:
- `IAttribute` foi criado em arquivo próprio (`Entities/Attribute/index.ts`) e reexportado pelo barrel `Entities/index.ts`, conforme especificado (não aninhado em `Entities/Skill`).
- `ISkill`, `ISkillListItem` e `ISkillListFilters` foram atualizados exatamente como pedido (`keyAttribute`/`keyAttributeId`).
- `useAttributesQuery` segue fielmente o padrão de `useRaceCategoriesQuery` (mesma queryKey format, `ApiFactory`+`getAuthToken()`, `staleTime` de 5 minutos, tipagem `IAttribute[]`) e está exportado no barrel `EntityQueries/index.ts` (e por consequência em `hooks/Queries`).
- `skillFormSchema`/`SkillFormData`/`skillFormDefaultValues` incluem `keyAttributeId` com a mesma mensagem/obrigatoriedade de `categoryId` em Raças.
- `SkillCreateForm` busca atributos via `useAttributesQuery`, renderiza `FormAutocompleteInput<SkillFormData, IAttribute>` ao lado de `tagIds` no mesmo grid, popula `keyAttributeId` no `reset` do modo de edição a partir de `skillDetail.keyAttribute.id`, e o payload inclui `keyAttributeId` via spread de `data` sem tratamento adicional (correto, já que é um `string` simples). Loading/erro de `skillDetail` e mutations de criar/editar têm tratamento de toast, e ambas mutations usam `invalidateQueryKeys: [['/skills']]`, mantendo a lista sincronizada automaticamente.
- `SkillsFilterSection` permanece apresentacional (props `attributeValue`/`onAttributeChange`/`attributes`, sem estado ou chamada de API própria), com `DefaultAutocompleteInput<IAttribute>` dentro do mesmo `<form>`, no padrão de `RacesFilterSection`.
- `SkillsListItem` e `SkillsList` adicionam a coluna "Atributo Chave" na posição correta (entre "Nome" e "Ações") e o `colSpan` da linha vazia foi corrigido para `3`. Ações de editar/excluir continuam ocultas para `isGoogleUser`.
- `SkillView` exibe o atributo chave no bloco `detailInfoField` com ícone, `Label` e `DefaultText`, no mesmo padrão de `RaceView`.
- `page.tsx` busca atributos com `useAttributesQuery()`, mantém estado `attributeFilter`, repassa as props corretas para `SkillsFilterSection` e inclui `keyAttributeId: attributeFilter?.id` em `handleSearch`, no mesmo padrão de `categoryId` em `racas/page.tsx`.
- Ícones usados são todos de `react-icons` (`FiSearch`, `FiEye`, `FiEdit2`, `FiTrash2`, `FiTag`, `FiFileText`), com `aria-label` em pt-BR nos `IconButton`.
- Nenhuma duplicação de componente/lógica identificada; tudo reaproveita os componentes genéricos existentes (`FormAutocompleteInput`, `DefaultAutocompleteInput`, hooks genéricos de `hooks/Queries`).
