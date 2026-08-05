# Task Web: Tags órfãs (aumentar busca de opções de tag)

## Contexto
Ver .claude/tasks/tags-orfas/spec.md

Abordagem confirmada no spec: aumentar/remover o limite `perPage: 100` usado hoje
na busca de opções de tag consumida pelo `FormMultiAutocompleteInput`, para que
todas as tags existentes sejam sempre carregadas como `options`. Não implementar
preservação de ids órfãos no estado do formulário, nem busca incremental por
texto, nem qualquer UI nova (loading/aviso). Nenhuma alteração no app-api.

O componente `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`
**não deve ser alterado** nesta demanda — a correção de ordem de inserção feita em
`tags-ordem-insercao` já está aplicada nele e não é afetada por este ajuste, que é
puramente sobre a busca das opções (props `options` recebidas de fora do
componente).

## Investigação de backend (restrição de `perPage`)
`app-api/src/modules/tags/dto/find-tags-query.dto.ts` define `perPage` como
`@IsOptional() @Type(() => Number) @IsInt() @Min(1)` — **sem `@Max`**, ou seja,
não há teto de paginação imposto pelo backend para `/tags`. `TagsService.findAllPaginated`
usa `DEFAULT_PER_PAGE = 20` apenas quando `perPage` não é enviado
(`app-api/src/common/variables/pagination.ts`). Logo, o frontend pode enviar um
valor alto de `perPage` livremente, sem violar validação do DTO. Não é possível
"remover" o parâmetro (ele sempre terá um valor, seja o default de 20, seja o
explicitado) — a correção deve, portanto, **substituir `100` por um valor alto o
suficiente para cobrir todo o catálogo de tags** em vez de tentar omitir o filtro.

## Levantamento dos pontos afetados
Grep por `perPage:\s*100` e por usos de `FormMultiAutocompleteInput` em
`app-web/src` confirma **24 arquivos** — os `*CreateForm` das 24 entidades com
campo de tags já mapeadas em `.claude/tasks/tags-ordem-insercao/task-web.md`.
Todos seguem exatamente o mesmo padrão:
```ts
const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
  url: '/tags',
  filters: { perPage: 100 },
});
const tagOptions = tagsData?.data ?? [];
```

Lista completa (caminhos completos a partir da raiz do repo):
1. `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
2. `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`
3. `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
4. `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
5. `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
6. `app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx`
7. `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
8. `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
9. `app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx`
10. `app-web/src/app/(authorized)/municoes/components/AmmunitionCreateForm/index.tsx`
11. `app-web/src/app/(authorized)/consumiveis/components/ConsumableCreateForm/index.tsx`
12. `app-web/src/app/(authorized)/materiais/components/MaterialCreateForm/index.tsx`
13. `app-web/src/app/(authorized)/equipamentos/components/EquipmentCreateForm/index.tsx`
14. `app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx`
15. `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx`
16. `app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx`
17. `app-web/src/app/(authorized)/personagens/components/CharacterCreateForm/index.tsx` — **atenção**: este arquivo tem 3 ocorrências de `perPage: 100` (`/tags`, `/races`, `/families`). Alterar **apenas** a busca de `/tags`; as buscas de `/races` e `/families` (usadas em campos de seleção única, não em `FormMultiAutocompleteInput`) estão fora de escopo e não devem ser tocadas.
18. `app-web/src/app/(authorized)/familias/components/FamilyCreateForm/index.tsx`
19. `app-web/src/app/(authorized)/organizacoes/components/OrganizationCreateForm/index.tsx`
20. `app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx`
21. `app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx`
22. `app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx`
23. `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`
24. `app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`

**Observação sobre a "tela de fichas" (sinalização, não contradiz o escopo):**
foi feita uma varredura extensa em `app-web/src/app/(authorized)/fichas/**`
(inclusive `SheetsFilterSection`, `fichas/[id]/page.tsx`, `EntityReferenceCard`,
`EntityReferenceSelectionModal`, `SheetBiographyCard`, `SheetRaceCard`,
`SheetBiographyAssignModal`) e **nenhum ponto ali busca opções de tag via
`FormMultiAutocompleteInput`/`useGetEntityList<ITag, ...>`** — esses componentes
apenas exibem tags já resolvidas (`TagBadge`), sem paginação própria de tags. O
único `perPage: 100` encontrado em `fichas/[id]/page.tsx` é da busca de `/races`
(campo de raça da ficha), não relacionado a tags, e permanece fora de escopo. Ou
seja, a lista de 24 arquivos acima parece ser exaustiva para "busca de opções de
tag limitada por paginação" no estado atual do código. Caso o `web-dev`, ao
implementar, encontre algum outro consumidor de tags com paginação que este
grep não tenha capturado (ex.: código adicionado após este plano), deve
aplicar a mesma correção nele e registrar a descoberta na revisão.

## Etapas

### 1. web-dev

#### Funcionalidade

**A. Constante compartilhada para o tamanho da busca de opções de tag**

Adicionar em `app-web/src/shared/constants/Variables/index.ts` (mesmo arquivo
onde já vive `APP_DEFAULT_PAGE_SIZE = 20`) uma nova constante, por exemplo:
```ts
export const TAG_OPTIONS_PER_PAGE = 1000;
```
Justificativa a documentar no código/PR: `FindTagsQueryDto` (`app-api`) não
impõe `@Max` em `perPage` (apenas `@Min(1)`), então não há restrição de backend
para um valor alto; 1000 é uma folga confortável acima de qualquer volume
realista do catálogo de tags do sistema (tela `/tags` é administrada
manualmente). Caso o `web-dev` julgue, ao investigar dados reais/staging, que o
volume de tags já se aproxima desse valor, sinalizar antes de prosseguir em vez
de simplesmente aumentar o número arbitrariamente.

**B. Hook dedicado `useTagOptionsQuery`, centralizando a busca**

Em vez de repetir `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: ... } })`
nos 24 arquivos, criar um hook dedicado em
`app-web/src/hooks/Queries/EntityQueries/useTagOptionsQuery/index.ts`, seguindo
o padrão já existente de hooks de opções em `hooks/Queries/EntityQueries`
(`useRaceCategoriesQuery`, `useErasAllQuery`, `useCreatureCategoriesQuery` etc.).
Diferença relevante: essas referências batem em endpoints dedicados que já
devolvem array puro (`/races/categories`, `/eras/all`); `/tags` continua sendo o
endpoint de listagem paginado padrão (mesmo usado pela tela `/tags`), então o
hook novo deve internamente reaproveitar o `useGetEntityList` genérico (não
criar uma chamada `axios` própria) e expor apenas o array de opções já
resolvido, por exemplo:
```ts
export const useTagOptionsQuery = () => {
  const query = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: TAG_OPTIONS_PER_PAGE },
  });

  return { ...query, tagOptions: query.data?.data ?? [] };
};
```
- Registrar o export em `app-web/src/hooks/Queries/EntityQueries/index.ts`
  (`export * from './useTagOptionsQuery';`) — já reexportado por
  `app-web/src/hooks/Queries/index.ts` via `export * from './EntityQueries'`.
- Nenhum endpoint novo no app-api: continua usando `GET /tags`, o mesmo já
  consumido hoje.

**C. Atualizar os 24 arquivos listados na seção "Levantamento dos pontos afetados"**

Em cada um dos 24 `*CreateForm`, substituir a busca local de tags:
```ts
const { data: tagsData } = useGetEntityList<ITag, ITagListFilters>({
  url: '/tags',
  filters: { perPage: 100 },
});
const tagOptions = tagsData?.data ?? [];
```
por:
```ts
const { tagOptions } = useTagOptionsQuery();
```
removendo os imports de `useGetEntityList`/`ITagListFilters` que ficarem sem uso
nesses arquivos (mantendo-os caso ainda sejam usados para outra busca no mesmo
arquivo — é o caso de `CharacterCreateForm`, que também usa `useGetEntityList`
para `/races` e `/families`, fora de escopo). O restante de cada formulário
(uso de `tagOptions` no `FormMultiAutocompleteInput` de `tagIds`, submissão,
validação) permanece inalterado.

Nenhuma mudança de schema/validação (`shared/formSchemas/`) é necessária — o
campo `tagIds: string[]` mantém o mesmo formato de payload; apenas o conjunto de
`options` carregado passa a cobrir todas as tags existentes, eliminando o
truncamento silencioso de `tagIds` descrito no spec.

#### Integrações com API
Nenhum endpoint novo nem alteração de contrato: os 24 pontos continuam
consumindo `GET /tags` (mesmo endpoint da tela `/tags`), apenas com `perPage`
maior (via `TAG_OPTIONS_PER_PAGE`, centralizado no hook `useTagOptionsQuery`
em vez de repetido literal em cada arquivo). Nenhuma alteração em app-api
(`FindTagsQueryDto`/`TagsService` permanecem como estão — sem `@Max` em
`perPage`, conforme investigado).

#### Formulário/validação
Sem alterações. Nenhum schema em `shared/formSchemas/` muda; o campo `tagIds`
de cada um dos 24 formulários mantém tipo, obrigatoriedade e formato de payload
atuais.

#### Acesso Google
Não aplicável a esta demanda — não há alteração em ações de criar/editar/excluir
nem no comportamento para `provider: 'google'`; a correção é puramente sobre o
volume de opções de tag carregado para o autocomplete, disponível igualmente
para todos os usuários com acesso a cada formulário.

Status: concluído
Componentes: nenhum
Arquivos:
- `app-web/src/shared/constants/Variables/index.ts` (nova constante `TAG_OPTIONS_PER_PAGE = 1000`)
- `app-web/src/hooks/Queries/EntityQueries/useTagOptionsQuery/index.ts` (novo hook)
- `app-web/src/hooks/Queries/EntityQueries/index.ts` (registro do export)
- Os 24 `*CreateForm` listados na seção "Levantamento dos pontos afetados", todos
  atualizados para usar `const { tagOptions } = useTagOptionsQuery();` em vez da
  busca local com `perPage: 100`:
  1. `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
  2. `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`
  3. `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
  4. `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
  5. `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
  6. `app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx`
  7. `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
  8. `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
  9. `app-web/src/app/(authorized)/utilitarios/components/UtilityCreateForm/index.tsx`
  10. `app-web/src/app/(authorized)/municoes/components/AmmunitionCreateForm/index.tsx`
  11. `app-web/src/app/(authorized)/consumiveis/components/ConsumableCreateForm/index.tsx`
  12. `app-web/src/app/(authorized)/materiais/components/MaterialCreateForm/index.tsx`
  13. `app-web/src/app/(authorized)/equipamentos/components/EquipmentCreateForm/index.tsx`
  14. `app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx`
  15. `app-web/src/app/(authorized)/campanhas/[id]/components/PlannedSessionCreateForm/index.tsx`
  16. `app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx`
  17. `app-web/src/app/(authorized)/personagens/components/CharacterCreateForm/index.tsx`
      (apenas a busca de `/tags` foi alterada; `/races` e `/families` continuam
      com `useGetEntityList`/`perPage: 100` inalterados, conforme escopo)
  18. `app-web/src/app/(authorized)/familias/components/FamilyCreateForm/index.tsx`
      (a busca de `/tags` foi alterada; `useGetEntityList` permanece importado
      pois a busca de `/characters` no mesmo arquivo continua usando-o)
  19. `app-web/src/app/(authorized)/organizacoes/components/OrganizationCreateForm/index.tsx`
  20. `app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx`
  21. `app-web/src/app/(authorized)/eventos/components/EventCreateForm/index.tsx`
  22. `app-web/src/app/(authorized)/eras/components/EraCreateForm/index.tsx`
  23. `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`
  24. `app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`

Nova varredura de confirmação (grep por `perPage:\s*100\b` após as alterações)
mostra apenas dois pontos remanescentes, ambos fora de escopo conforme
esperado: `fichas/[id]/page.tsx` (busca de `/races`) e as duas ocorrências em
`CharacterCreateForm` (`/races` e `/families`) — nenhum consumidor de opções de
tag ficou de fora. `FormMultiAutocompleteInput` e a tela `/tags`
(`app-web/src/app/(authorized)/tags/`) não foram alterados.

### 2. web-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - `TAG_OPTIONS_PER_PAGE` de fato substitui `100` nos 24 pontos listados (e
    apenas neles — conferir especialmente que `CharacterCreateForm` não teve as
    buscas de `/races`/`/families` alteradas por engano).
  - `useTagOptionsQuery` reaproveita `useGetEntityList` (não duplica lógica de
    fetch/axios) e expõe `tagOptions` já resolvido (`data?.data ?? []`), sem
    quebrar `isLoading`/`isError` para quem eventualmente precise deles.
  - Nenhuma alteração foi feita em
    `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`
    nem em `app-web/src/app/(authorized)/tags/` (administração de tags,
    fora de escopo).
  - Confirmar, via nova varredura, que não restou nenhum outro consumidor de
    opções de tag com `perPage` limitado fora dos 24 pontos mapeados (incluindo
    a checagem já feita sobre a tela de fichas, que não encontrou nenhum ponto
    adicional).
  - Nenhuma regressão na ordem de inserção de tags corrigida em
    `tags-ordem-insercao` (o hook novo não deve alterar a forma como `value`/
    `onChange` do `FormMultiAutocompleteInput` são calculados).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas:
- `app-web/src/shared/constants/Variables/index.ts` define `TAG_OPTIONS_PER_PAGE = 1000`
  com o comentário justificando a ausência de `@Max` em `FindTagsQueryDto`, conforme
  investigado na etapa 1.
- `app-web/src/hooks/Queries/EntityQueries/useTagOptionsQuery/index.ts` reaproveita
  o `useGetEntityList` genérico (`useGetEntityList<ITag, ITagListFilters>({ url: '/tags',
  filters: { perPage: TAG_OPTIONS_PER_PAGE } })`), sem chamada `axios` própria, e
  retorna `{ ...query, tagOptions: query.data?.data ?? [] }` — preserva `isLoading`/
  `isError`/demais campos do `useQuery` para quem precisar, além de expor `tagOptions`
  já resolvido. Registrado corretamente em
  `app-web/src/hooks/Queries/EntityQueries/index.ts` (`export * from './useTagOptionsQuery';`).
- Confirmado, arquivo a arquivo, que os 24 `*CreateForm` listados na etapa 1 usam
  `const { tagOptions } = useTagOptionsQuery();` no lugar da busca local com
  `perPage: 100`, e que `tagOptions` é passado para `FormMultiAutocompleteInput` de
  `tagIds` sem alterações no restante do formulário.
- `personagens/components/CharacterCreateForm/index.tsx` teve **apenas** a busca de
  `/tags` migrada para `useTagOptionsQuery`; as duas buscas de `/races` e `/families`
  permanecem com `useGetEntityList`/`perPage: 100` inalteradas (linhas 66-79), como
  previsto no escopo.
- `familias/components/FamilyCreateForm/index.tsx` mantém `useGetEntityList` importado
  e em uso legítimo para a busca de `/characters` (linha 101), sem import órfão.
- Grep de confirmação por `perPage:\s*100\b` em todo `app-web/src` retorna apenas
  `fichas/[id]/page.tsx` (busca de `/races`) e as duas ocorrências em
  `CharacterCreateForm` (`/races`/`/families`) — nenhum consumidor de opções de tag
  ficou de fora, e uma busca adicional por `'/tags'`/`"/tags"`/`` `/tags` `` confirma
  que os únicos consumidores desse endpoint no frontend são `useTagOptionsQuery`,
  `shared/routes.ts` e a própria tela `app-web/src/app/(authorized)/tags/` (listagem
  e `TagCreateForm`, que faz POST/PUT de tag e não busca opções).
- `app-web/src/shared/components/Inputs/FormInputs/FormMultiAutocompleteInput/index.tsx`
  não foi alterado: continua calculando `value` via `options.find` a partir de
  `field.value` e `onChange` via `newValue.map(getOptionValue)`, preservando a
  correção de ordem de inserção de `tags-ordem-insercao`.
- `app-web/src/app/(authorized)/tags/` (página, `TagsList`, `TagsListItem`,
  `TagCreateForm`, `TagsFilterSection`) não foi tocado; `tags/page.tsx` continua
  paginando com `APP_DEFAULT_PAGE_SIZE` para a própria listagem administrativa,
  sem relação com `TAG_OPTIONS_PER_PAGE`.
