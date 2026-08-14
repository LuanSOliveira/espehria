# Task Web: Filtro por tags nas listagens de traços, magias, técnicas, perícias e condições

## Contexto
Não existe `.claude/tasks/filtro-tags-habilidades/spec.md`. Existe
`.claude/tasks/filtro-tags-habilidades/task-api.md`, que cobre a adição do parâmetro
`tagIds?: string[]` (filtro AND por tags) nos endpoints `GET /traits`, `GET /spells`,
`GET /techniques`, `GET /skills` e `GET /conditions` — usar apenas como confirmação de
que o backend passará a aceitar esse parâmetro; este plano cobre exclusivamente o
`app-web`.

Nenhuma lacuna de requisito identificada: a demanda é replicar, nas 5 páginas de
listagem abaixo, o padrão de filtro por tags já implementado e funcionando em
`treinamentos` (`TrainingsFilterSection` + `app/(authorized)/treinamentos/page.tsx`).

## Etapas

### 1. web-dev

#### Funcionalidade

**Padrão de referência (não alterar, apenas replicar)**
- `app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`
  e `app-web/src/app/(authorized)/treinamentos/page.tsx`.
- Input reutilizável: `DefaultMultiAutocompleteInput<ITag>` (`@/shared/components/Inputs`),
  já existente — **não criar nenhum componente novo em `shared/components/`**.
- Hook `useTagOptionsQuery()` (`@/hooks/Queries`) já existente para popular
  `tagOptions` — reutilizar tal como está.
- Helper `formatTagLabel` (`@/shared/util`) para `getOptionLabel`.
- `useGetEntityList`/`ApiFactory` já são usados por `treinamentos` com `tagIds`
  funcionando (a serialização de array na querystring que o backend espera,
  `tagIds[]=uuid1&tagIds[]=uuid2`, já é feita pelo `axios` por padrão via
  `params: filters` em `useGetEntityList`). As 5 páginas abaixo usam exatamente o
  mesmo hook `useGetEntityList` para buscar a listagem (confirmado lendo os 5
  `page.tsx`), então **nenhuma mudança na camada de fetch é necessária** — apenas
  confirmar isso no código antes de implementar, sem assumir.

**Observação importante — botão "Limpar filtros"**
Nenhuma das 5 páginas abaixo possui hoje o botão "Limpar filtros"/`handleClear`
(diferente de `treinamentos`, que já o possui). Como um multi-select de tags é
impraticável de limpar manualmente, **as 5 páginas ganharão o botão `SecondaryButton`
"Limpar filtros"** (import de `@/shared/components/Buttons`, já usado em
`treinamentos`) com um `handleClear` que reseta **todos** os filtros da respectiva
página (não só as tags). Páginas que ganham o botão: `tracos`, `magias`, `tecnicas`,
`pericias`, `condicoes` (todas as 5).

**Regra geral aplicada às 5 páginas** (verificar nome exato de componente/interface/
props em cada arquivo antes de editar — não assumir por convenção; os nomes abaixo
foram confirmados lendo o código atual, mas podem ter mudado):
1. Adicionar `tagIds?: string[]` à interface `I<Entidade>ListFilters` correspondente,
   em `@/shared/interfaces/Entities/<Entidade>/index.ts`.
2. Editar o `*FilterSection` da página: adicionar props `tagsValue: ITag[]`,
   `onTagsChange: (value: ITag[]) => void`, `tagOptions: ITag[]` e `onClear: () => void`
   (quando ainda não existir); renderizar `DefaultMultiAutocompleteInput<ITag>` com
   `options={tagOptions}`, `getOptionLabel={formatTagLabel}`,
   `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`,
   `value={tagsValue}`, `onChange={onTagsChange}`, `label="Tags"`,
   `placeholder="Selecione as tags"`, dentro de `<div className="min-w-60 flex-1">`;
   adicionar `SecondaryButton` "Limpar filtros" (`type="button"`, `onClick={onClear}`,
   mesmo `sx` do `PrimaryButton` de filtrar) ao lado do botão "Filtrar" existente;
   ajustar o `max-w-*` do `form` para acomodar o(s) novo(s) campo(s)/botão — ver
   sugestões por página abaixo (ajustar visualmente se necessário).
3. Editar o `page.tsx` da página: importar `useTagOptionsQuery` de `@/hooks/Queries` e
   `ITag` de `@/shared/interfaces`; adicionar
   `const { tagOptions } = useTagOptionsQuery();` e
   `const [selectedTags, setSelectedTags] = useState<ITag[]>([]);`; no `handleSearch`,
   incluir `tagIds: selectedTags.length ? selectedTags.map((tag) => tag.id) : undefined`
   junto aos demais campos do `setFilters`; criar `handleClear` que reseta todos os
   estados de input controlados da página (inclusive `selectedTags` e, quando houver,
   filtros específicos como o atributo-chave de perícias) e chama
   `setFilters({ page: 1, perPage: APP_DEFAULT_PAGE_SIZE })`; passar
   `tagsValue={selectedTags}`, `onTagsChange={setSelectedTags}`,
   `tagOptions={tagOptions}` e `onClear={handleClear}` ao `*FilterSection`.
4. Nenhum endpoint novo é consumido — apenas o mesmo `GET /<recurso>` de listagem já
   usado hoje, agora aceitando o parâmetro `tagIds` (implementado pela tarefa da API).

---

##### Traços (`tracos`)
- Arquivos: `app-web/src/app/(authorized)/tracos/page.tsx`,
  `app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx`,
  `app-web/src/shared/interfaces/Entities/Trait/index.ts` (`ITraitListFilters`).
- Estado atual do `FilterSection`: só recebe `nameValue`/`onNameChange`/`onSubmit`;
  `form` com `max-w-160`; input com `id="trait-name-filter"` (prefixo singular — usar
  `id="trait-tags-filter"` no novo input para manter a convenção já usada neste
  arquivo, mesmo que difira do plural usado nos demais).
- Página: não possui `handleClear`; adicionar conforme regra geral, resetando
  `nameInput` e `selectedTags`.
- Integração API: `GET /traits` via `useGetEntityList<ITraitListItem, ITraitListFilters>`
  (`url: '/traits'`) — sem mudança na chamada, apenas o novo `tagIds` no objeto de
  filtros.
- Sugestão de `max-w`: aumentar de `max-w-160` para algo como `max-w-190`
  (1 campo de texto + 1 multi-select + 2 botões), ajustar visualmente conforme
  necessário.

##### Magias (`magias`)
- Arquivos: `app-web/src/app/(authorized)/magias/page.tsx`,
  `app-web/src/app/(authorized)/magias/components/SpellsFilterSection/index.tsx`,
  `app-web/src/shared/interfaces/Entities/Spell/index.ts` (`ISpellListFilters`).
- Estado atual do `FilterSection`: só `nameValue`/`onNameChange`/`onSubmit`; `form` com
  `max-w-90`, sem `div` wrapper com `min-w-*` no campo de nome (só `flex-1`) — ao
  adicionar o campo de tags, envolver em `<div className="min-w-60 flex-1">` como no
  padrão de referência (e considerar envolver também o campo de nome em
  `min-w-50 flex-1` para manter consistência de quebra de linha, como em
  `tracos`/`pericias`/`treinamentos`).
- Página: não possui `handleClear`; adicionar conforme regra geral.
- Integração API: `GET /spells` via `useGetEntityList<ISpellListItem, ISpellListFilters>`
  (`url: '/spells'`).
- Sugestão de `max-w`: aumentar de `max-w-90` para algo como `max-w-190`.

##### Técnicas (`tecnicas`)
- Arquivos: `app-web/src/app/(authorized)/tecnicas/page.tsx`,
  `app-web/src/app/(authorized)/tecnicas/components/TechniquesFilterSection/index.tsx`,
  `app-web/src/shared/interfaces/Entities/Technique/index.ts` (`ITechniqueListFilters`).
- Estado atual do `FilterSection`: idêntico em estrutura ao de `magias` (só
  `nameValue`/`onNameChange`/`onSubmit`, `max-w-90`, campo de nome sem `div` wrapper
  com `min-w-*`). Mesma observação de envolver os campos em `div`s com `min-w-*`.
- Página: não possui `handleClear`; adicionar conforme regra geral.
- Integração API: `GET /techniques` via
  `useGetEntityList<ITechniqueListItem, ITechniqueListFilters>` (`url: '/techniques'`).
- Sugestão de `max-w`: aumentar de `max-w-90` para algo como `max-w-190`.

##### Perícias (`pericias`)
- Arquivos: `app-web/src/app/(authorized)/pericias/page.tsx`,
  `app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx`,
  `app-web/src/shared/interfaces/Entities/Skill/index.ts` (`ISkillListFilters`).
- Estado atual do `FilterSection`: já tem 2 campos — `nameValue`/`onNameChange` e
  `attributeValue`/`onAttributeChange`/`attributes` (via `DefaultAutocompleteInput<IAttribute>`,
  filtro por atributo-chave); `form` com `max-w-160`; **atenção especial**: ao
  adicionar `handleClear`, ele precisa resetar **também** `attributeFilter` (para
  `null`), além de `nameInput` e `selectedTags` — o filtro de tags deve conviver com
  o filtro de atributo-chave (ambos aplicados juntos via `AND`, cada um no seu próprio
  campo de `ISkillListFilters`: `keyAttributeId` e `tagIds`).
- Página: já usa `useAttributesQuery()` para `attributes` — manter; adicionar
  `useTagOptionsQuery()` do mesmo jeito.
- Integração API: `GET /skills` via `useGetEntityList<ISkillListItem, ISkillListFilters>`
  (`url: '/skills'`).
- Sugestão de `max-w`: aumentar de `max-w-160` para algo como `max-w-220` (nome +
  atributo-chave + tags + 2 botões, mesma ordem de grandeza de `treinamentos`).

##### Condições (`condicoes`)
- Arquivos: `app-web/src/app/(authorized)/condicoes/page.tsx`,
  `app-web/src/app/(authorized)/condicoes/components/ConditionsFilterSection/index.tsx`,
  `app-web/src/shared/interfaces/Entities/Condition/index.ts` (`IConditionListFilters`).
- Estado atual do `FilterSection`: idêntico em estrutura ao de `magias`/`tecnicas` (só
  `nameValue`/`onNameChange`/`onSubmit`, `max-w-90`, campo de nome sem `div` wrapper
  com `min-w-*`). Mesma observação de envolver os campos em `div`s com `min-w-*`.
- Página: não possui `handleClear`; adicionar conforme regra geral.
- Integração API: `GET /conditions` via
  `useGetEntityList<IConditionListItem, IConditionListFilters>` (`url: '/conditions'`).
- Sugestão de `max-w`: aumentar de `max-w-90` para algo como `max-w-190`.

---

**Formulário/validação**: não há formulário de criação/edição envolvido nesta
demanda — apenas campos de filtro de listagem (não validados por `zod`/
`react-hook-form`, seguindo o mesmo padrão não-validado do campo de nome/level já
existente em cada `*FilterSection`).

**Acesso Google**: nenhuma mudança de comportamento. Nas 5 páginas, as ações de
criar/editar/excluir já são ocultadas para `provider: 'google'` (`useIsGoogleUser` +
`{!isGoogleUser && ...}` ao redor do botão "Novo"; edição/exclusão condicionadas de
forma equivalente nos respectivos `*List`/`*ListItem`) — isso não é alterado por esta
tarefa. O filtro por tags (assim como os demais filtros de busca) é uma ação de
leitura e deve permanecer disponível também para usuários Google, sem nenhuma
restrição adicional.

**Status:** concluído

Componentes:
- `app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx` — adicionado campo de tags (`DefaultMultiAutocompleteInput<ITag>`) e botão "Limpar filtros"; `max-w-160` → `max-w-190`.
- `app-web/src/app/(authorized)/magias/components/SpellsFilterSection/index.tsx` — adicionado campo de tags e botão "Limpar filtros"; campo de nome envolvido em `min-w-50 flex-1`; `max-w-90` → `max-w-190`.
- `app-web/src/app/(authorized)/tecnicas/components/TechniquesFilterSection/index.tsx` — mesmo padrão de `magias`.
- `app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx` — adicionado campo de tags (mantendo o campo de atributo-chave existente) e botão "Limpar filtros"; `max-w-160` → `max-w-220`.
- `app-web/src/app/(authorized)/condicoes/components/ConditionsFilterSection/index.tsx` — mesmo padrão de `magias`/`tecnicas`.

Arquivos:
- `app-web/src/shared/interfaces/Entities/Trait/index.ts` — `tagIds?: string[]` em `ITraitListFilters`.
- `app-web/src/shared/interfaces/Entities/Spell/index.ts` — `tagIds?: string[]` em `ISpellListFilters`.
- `app-web/src/shared/interfaces/Entities/Technique/index.ts` — `tagIds?: string[]` em `ITechniqueListFilters`.
- `app-web/src/shared/interfaces/Entities/Skill/index.ts` — `tagIds?: string[]` em `ISkillListFilters` (mantendo `keyAttributeId` já existente).
- `app-web/src/shared/interfaces/Entities/Condition/index.ts` — `tagIds?: string[]` em `IConditionListFilters`.
- `app-web/src/app/(authorized)/tracos/page.tsx` — `useTagOptionsQuery`, estado `selectedTags`, `tagIds` em `handleSearch`, novo `handleClear` (reseta `nameInput` e `selectedTags`), props passadas ao `TraitsFilterSection`.
- `app-web/src/app/(authorized)/magias/page.tsx` — idem, `handleClear` reseta `nameInput` e `selectedTags`.
- `app-web/src/app/(authorized)/tecnicas/page.tsx` — idem.
- `app-web/src/app/(authorized)/condicoes/page.tsx` — idem.
- `app-web/src/app/(authorized)/pericias/page.tsx` — `useTagOptionsQuery`, estado `selectedTags`, `tagIds` em `handleSearch`, novo `handleClear` (reseta `nameInput`, `attributeFilter` e `selectedTags`), props passadas ao `SkillsFilterSection`.

Nenhum componente novo foi criado em `shared/components/` (reuso de `DefaultMultiAutocompleteInput`, `formatTagLabel` e `useTagOptionsQuery` já existentes). Nenhuma mudança na camada de fetch (`useGetEntityList`/`ApiFactory`) — apenas o novo campo `tagIds` no objeto de filtros de cada página.

### 2. web-dev-codereviewer
- Revisar as 5 páginas (`tracos`, `magias`, `tecnicas`, `pericias`, `condicoes`):
  - Confirmar que `tagIds` foi adicionado corretamente às 5 interfaces
    `I<Entidade>ListFilters` em `@/shared/interfaces/Entities/*`.
  - Confirmar que os 5 `*FilterSection` seguem fielmente o padrão de
    `TrainingsFilterSection` (mesmas props, mesmo uso de
    `DefaultMultiAutocompleteInput<ITag>`, mesmo `formatTagLabel`, sem lógica
    duplicada/reinventada).
  - Confirmar que o botão "Limpar filtros" foi adicionado nas 5 páginas e que o
    `handleClear` de cada uma reseta **todos** os filtros daquela página específica
    (inclusive `attributeFilter` em `pericias`).
  - Confirmar que `handleSearch` em cada página envia `tagIds` como `undefined`
    quando nenhuma tag está selecionada (evitando enviar array vazio) e como array de
    ids quando há seleção.
  - Confirmar que nenhuma das 5 páginas passou a usar um caminho de fetch diferente
    de `useGetEntityList`/`ApiFactory` (mantendo a serialização de array já validada
    em `treinamentos`).
  - Confirmar textos de UI em pt-BR ("Tags", "Selecione as tags", "Limpar filtros").
  - Confirmar que nenhum componente novo foi criado em `shared/components/` (o
    input de multi-seleção de tags já existe e deve ser reutilizado).

**Status:** concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/interfaces/Entities/Trait/index.ts`
- `app-web/src/shared/interfaces/Entities/Spell/index.ts`
- `app-web/src/shared/interfaces/Entities/Technique/index.ts`
- `app-web/src/shared/interfaces/Entities/Skill/index.ts`
- `app-web/src/shared/interfaces/Entities/Condition/index.ts`
- `app-web/src/app/(authorized)/tracos/page.tsx`
- `app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/magias/page.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/page.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniquesFilterSection/index.tsx`
- `app-web/src/app/(authorized)/pericias/page.tsx`
- `app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/condicoes/page.tsx`
- `app-web/src/app/(authorized)/condicoes/components/ConditionsFilterSection/index.tsx`

Pontos confirmados:
- As 5 interfaces `I<Entidade>ListFilters` ganharam `tagIds?: string[]` no formato
  correto, preservando os campos já existentes (ex.: `keyAttributeId` em
  `ISkillListFilters`).
- Os 5 `*FilterSection` replicam fielmente `TrainingsFilterSection`: mesmas props
  (`tagsValue`, `onTagsChange`, `tagOptions`, `onClear`), mesmo
  `DefaultMultiAutocompleteInput<ITag>` com `getOptionLabel={formatTagLabel}`,
  `getOptionValue={(tag) => tag.id}`, `getOptionColor={(tag) => tag.color}`, mesmo
  `<div className="min-w-60 flex-1">` de envoltório e mesmo `SecondaryButton`
  "Limpar filtros" ao lado do `PrimaryButton` "Filtrar", sem lógica duplicada ou
  reinventada. `SkillsFilterSection` preserva o campo de atributo-chave existente
  (`DefaultAutocompleteInput<IAttribute>`) lado a lado com o novo campo de tags.
- O botão "Limpar filtros" foi adicionado nas 5 páginas e cada `handleClear` reseta
  todos os filtros da respectiva página: `nameInput`/`selectedTags` em `tracos`,
  `magias`, `tecnicas` e `condicoes`; em `pericias` (linhas 92-97 de
  `app-web/src/app/(authorized)/pericias/page.tsx`), `handleClear` reseta
  `nameInput`, `attributeFilter` (para `null`) **e** `selectedTags`, confirmando que
  o filtro de tags convive corretamente com o filtro de atributo-chave.
- `handleSearch` em cada página envia `tagIds: selectedTags.length ?
  selectedTags.map((tag) => tag.id) : undefined`, evitando array vazio na
  querystring quando nenhuma tag está selecionada.
- Nenhuma das 5 páginas mudou o caminho de fetch: todas continuam usando
  `useGetEntityList<...>` apenas com `url` e `filters`, sem `useQuery`/`useMutation`
  bespoke nem alteração em `ApiFactory`.
- Textos de UI em pt-BR conferidos e consistentes: "Tags", "Selecione as tags",
  "Limpar filtros", "Atributo Chave"/"Todos os atributos" (pericias).
- Nenhum componente novo foi criado em `shared/components/`: `DefaultMultiAutocompleteInput`
  (`shared/components/Inputs/DefaultInputs/DefaultMultiAutocompleteInput`),
  `formatTagLabel` (`shared/util/FormatTagLabel`) e `useTagOptionsQuery`
  (`hooks/Queries/EntityQueries/useTagOptionsQuery`) já existiam e foram apenas
  reutilizados, tal como reportado na etapa "1. web-dev".
