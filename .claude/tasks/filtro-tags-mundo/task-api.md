# Task API: Filtro por tags (tagIds) na listagem de races, creatures, locations, events, eras e divinities

## Contexto
Não existe `.claude/tasks/filtro-tags-mundo/spec.md`. O planejamento a seguir foi feito
diretamente com base na demanda descrita pelo agente solicitante, que já é detalhada e
funciona como especificação de fato (padrão de referência obrigatório: `trainings`).
Nenhum ponto de requisito ficou ambíguo — apenas pontos de arquitetura/implementação que
o `api-dev` deve validar caso a caso estão sinalizados abaixo em "Pontos de atenção".

Todas as 6 entidades-alvo já possuem relacionamento N:N com `Tag` via tabela de junção
própria e já expõem `tagIds` nos DTOs de criação/atualização (`CreateXDto`/`UpdateXDto`)
e no carregamento de tags via `common/utils/ordered-tags.util.ts`. O que falta, em todos
os 6 módulos, é o filtro `tagIds` no DTO de **listagem** (`find-*-query.dto.ts`) e a
lógica correspondente em `findAllPaginated` do respectivo `*.service.ts`. Nenhum módulo
precisa de `find-*-query.dto.ts` novo — todos os 6 já existem.

## Padrão de referência obrigatório
Replicar fielmente `app-api/src/modules/trainings/dto/find-trainings-query.dto.ts`
(campo `tagIds`) e `app-api/src/modules/trainings/trainings.service.ts` (método
`findAllPaginated`, linhas ~263-344), incluindo o comentário que explica por que
`getManyAndCount()` não pode ser usado quando há `groupBy`/`having` (o total precisa ser
calculado separadamente via `.clone()` apenas quando `hasTagFilter` é `true`). Consultar
também `talents` e `characteristics` como exemplos adicionais já implementados do mesmo
padrão.

## Etapas

### 1. api-dev

Status: concluído

Resumo por módulo (todos seguem literalmente o padrão de `trainings.service.ts`
`findAllPaginated`, incluindo o comentário sobre `getManyAndCount()` vs `groupBy`):
- races: `FindRacesQueryDto.tagIds` adicionado
  (`app-api/src/modules/races/dto/find-races-query.dto.ts`); `RacesService.findAllPaginated`
  (`app-api/src/modules/races/races.service.ts`) recebeu bloco `hasTagFilter` com
  `innerJoin('race_tags', 'race_tag_filter', ...)` + `groupBy('race.id')` + `having(...)`
  e total condicional via `.clone()`. `leftJoin('race.category', 'category')` pré-existente
  não conflitou (categoria não é selecionada nem ordenada).
- creatures: mesma alteração em
  `app-api/src/modules/creatures/dto/find-creatures-query.dto.ts` e
  `app-api/src/modules/creatures/creatures.service.ts` (alias `creature`,
  `creature_tags`/`creature_tag_filter`), mesmo cuidado com `leftJoin('creature.category', ...)`.
- locations: `app-api/src/modules/locations/dto/find-locations-query.dto.ts` e
  `app-api/src/modules/locations/locations.service.ts` (alias `location`,
  `location_tags`/`location_tag_filter`) — caso mais simples, sem outros joins.
- events: `app-api/src/modules/events/dto/find-events-query.dto.ts` e
  `app-api/src/modules/events/events.service.ts` (alias `event`,
  `event_tags`/`event_tag_filter`); `leftJoin('event.era', 'era')` pré-existente não
  conflitou (era não é selecionada nem ordenada).
- eras: `app-api/src/modules/eras/dto/find-eras-query.dto.ts` e
  `app-api/src/modules/eras/eras.service.ts` (alias `era`, `era_tags`/`era_tag_filter`);
  `groupBy('era.id')` cobre a dependência funcional com `orderBy('era.order', 'ASC')`
  (coluna `ordering` no banco), conforme esperado — comentário inline explicita isso.
  Uso de `DataSource`/transação em `create`/`update`/`remove` não foi tocado.
- divinities: `app-api/src/modules/divinities/dto/find-divinities-query.dto.ts` e
  `app-api/src/modules/divinities/divinities.service.ts` (alias `divinity`,
  `divinity_tags`/`divinity_tag_filter`), mesmo cuidado com
  `leftJoin('divinity.category', ...)`.

Nenhum controller, entidade ou migration precisou de alteração — os 6 nomes de
tabela/coluna de junção foram reconferidos contra as migrations indicadas
(`CreateRaceTagsTable`, `CreateCreatureTagsTable`, `CreateLocationTagsTable`,
`CreateEventTagsTable`, `CreateEraTagsTable`, `CreateDivinityTagsTable`) antes da
implementação e batem exatamente com o planejado. Dedupe de `tagIds` via
`[...new Set(...)]` aplicado em todos os 6 services; cálculo de `total` só muda de
estratégia quando `hasTagFilter` é `true`.

#### Entidade
- Nenhuma entidade nova e nenhuma alteração de entidade é necessária nos 6 módulos.
  Todas já possuem a tabela de junção própria e o relacionamento com `Tag` funcionando
  em `create`/`update`/`findById`. O trabalho é restrito a DTO de query + service.
- Tabelas de junção e colunas FK já confirmadas nos respectivos `*-tag.entity.ts` e nas
  migrations correspondentes (`api-dev` deve reconferir contra a migration antes de
  implementar, mas os valores abaixo já foram checados nesta etapa de planejamento):
  - races: tabela `race_tags`, alias sugerido `race_tag_filter`, condição
    `race_tag_filter.race_id = race.id AND race_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305450000-CreateRaceTagsTable.ts`).
  - creatures: tabela `creature_tags`, alias sugerido `creature_tag_filter`, condição
    `creature_tag_filter.creature_id = creature.id AND creature_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305380000-CreateCreatureTagsTable.ts`).
  - locations: tabela `location_tags`, alias sugerido `location_tag_filter`, condição
    `location_tag_filter.location_id = location.id AND location_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305410000-CreateLocationTagsTable.ts`).
  - events: tabela `event_tags`, alias sugerido `event_tag_filter`, condição
    `event_tag_filter.event_id = event.id AND event_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305490000-CreateEventTagsTable.ts`).
  - eras: tabela `era_tags`, alias sugerido `era_tag_filter`, condição
    `era_tag_filter.era_id = era.id AND era_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305470000-CreateEraTagsTable.ts`).
  - divinities: tabela `divinity_tags`, alias sugerido `divinity_tag_filter`, condição
    `divinity_tag_filter.divinity_id = divinity.id AND divinity_tag_filter.tag_id IN (:...tagIds)`
    (migration `1784305520000-CreateDivinityTagsTable.ts`).
  - Todas as 6 tabelas de junção têm coluna `order` (adicionada em
    `1784306280000-AddOrderToTagJunctionTables.ts`), irrelevante para o filtro, mas
    confirma que a estrutura é homogênea entre os módulos.

#### Migration
- Necessária: não. Nenhuma alteração de schema é feita — apenas query em cima de
  tabelas/colunas já existentes.

#### Controller
- Nenhum endpoint novo é criado. O filtro é adicionado como querystring opcional no
  endpoint de listagem já existente em cada módulo (todos são `GET /<recurso>` na
  raiz do controller — não em subrotas como `/categories`, `/all` etc.):
  - `GET /races`
  - `GET /creatures`
  - `GET /locations`
  - `GET /events`
  - `GET /eras`
  - `GET /divinities`
- DTOs a alterar (adicionar campo `tagIds?: string[]`, seguindo exatamente a mesma
  definição de `FindTrainingsQueryDto.tagIds`: `@IsOptional() @IsArray() @IsUUID('4', {
  each: true })` + `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true,
  description: '...', example: [...] })` com a mesma descrição em pt-BR explicando a
  semântica AND e a notação `tagIds[]=uuid1&tagIds[]=uuid2`):
  - `FindRacesQueryDto` (`app-api/src/modules/races/dto/find-races-query.dto.ts`)
  - `FindCreaturesQueryDto` (`app-api/src/modules/creatures/dto/find-creatures-query.dto.ts`)
  - `FindLocationsQueryDto` (`app-api/src/modules/locations/dto/find-locations-query.dto.ts`)
  - `FindEventsQueryDto` (`app-api/src/modules/events/dto/find-events-query.dto.ts`)
  - `FindErasQueryDto` (`app-api/src/modules/eras/dto/find-eras-query.dto.ts`)
  - `FindDivinitiesQueryDto` (`app-api/src/modules/divinities/dto/find-divinities-query.dto.ts`)
- Nenhum controller precisa de alteração de código além do que o `@Query()` já injeta
  automaticamente (o campo novo do DTO passa a ser aceito sem mudança de assinatura do
  método `findAll`).
- Acesso Google: read-only (padrão) — mantido sem alteração. Os 6 controllers já
  aplicam `@GoogleAccess('read-only')` a nível de classe (confirmado em
  `races.controller.ts`, `creatures.controller.ts`, `locations.controller.ts`,
  `events.controller.ts`, `eras.controller.ts`, `divinities.controller.ts`). Como a
  demanda só adiciona um filtro de leitura à listagem já existente, não há motivo para
  alterar o nível de acesso.

#### Alterações de service (`findAllPaginated`) — por módulo
Em todos os 6 services, replicar o bloco `hasTagFilter` de `trainings.service.ts`
imediatamente antes do `select/orderBy/skip/take`, e o cálculo condicional de `total`
(via `.clone()` quando `hasTagFilter`, via `getCount()`/`getManyAndCount()` quando não).
Usar sempre o alias já existente da entidade-dona na query (não criar alias novo para a
entidade principal).

- `races.service.ts` (`findAllPaginated`): alias da entidade é `race` (já tem
  `leftJoin('race.category', 'category')` e filtro por `categoryId`). Adicionar
  `innerJoin('race_tags', 'race_tag_filter', ...)` + `groupBy('race.id')` + `having(...)`
  quando `hasTagFilter`. Como o `select` final já é `['race.id', 'race.name']` e o
  `orderBy` é `race.name` (coluna da própria tabela agrupada por PK), não deve haver
  conflito, mas validar que o `leftJoin` com `category` não quebra o `groupBy`/`having`
  (categoria não é selecionada nem ordenada, então não deveria exigir estar no
  `GROUP BY`, mas revisar o SQL gerado).
- `creatures.service.ts` (`findAllPaginated`): mesma estrutura de `races` — alias
  `creature`, `leftJoin('creature.category', 'category')`, filtro por `categoryId`.
  Mesmo alerta de validação do `leftJoin` de categoria com `groupBy`/`having`.
- `locations.service.ts` (`findAllPaginated`): alias `location`, sem outros joins (só
  filtro `name` e `type`, ambos por `ILIKE` na própria tabela). Caso mais simples dos
  6 — menor risco de conflito de `groupBy`.
- `events.service.ts` (`findAllPaginated`): alias `event`, já tem
  `leftJoin('event.era', 'era')` e filtros por `eraId`, `startYear`, `endYear` (todos
  em colunas da própria tabela `event`, exceto `eraId` que filtra por FK). Validar que
  o `leftJoin` de `era` não obriga incluir colunas de `era` no `GROUP BY` (não é
  selecionada nem ordenada — `orderBy` é `event.name`).
- `eras.service.ts` (`findAllPaginated`): alias `era`, sem outros joins. Atenção
  especial: o `orderBy` atual é `era.order` (mapeado para a coluna `ordering` no banco,
  ver `Era` entity/`@Column({ name: 'ordering' })`), não `era.name`. Confirmar que o
  `GROUP BY era.id` cobre essa dependência funcional (PostgreSQL permite referenciar
  outras colunas da mesma tabela no `ORDER BY`/`SELECT` quando se agrupa pela chave
  primária, então deve funcionar, mas validar em teste manual/e2e). Também notar que
  `eras.service.ts` usa `DataSource`/transação em `create`/`update`/`remove` — isso não
  afeta `findAllPaginated`, que não roda em transação e não precisa passar a rodar.
- `divinities.service.ts` (`findAllPaginated`): alias `divinity`, mesma estrutura de
  `races`/`creatures` — `leftJoin('divinity.category', 'category')`, filtro por
  `categoryId`. Mesmo alerta de validação do `leftJoin` de categoria com
  `groupBy`/`having`.

#### Pontos de atenção transversais (válidos para os 6 módulos)
- Fazer dedupe de `query.tagIds` com `[...new Set(query.tagIds)]` antes de usar como
  parâmetro do `IN` e como `tagCount` do `having`, exatamente como em `trainings`.
- A troca de `getManyAndCount()`/`getCount()` por cálculo condicional do `total` só deve
  ocorrer quando `hasTagFilter` for `true` (nos módulos sem filtro de tag ativo, manter
  o comportamento atual — `getManyAndCount()` em `races`/`creatures`/`divinities`,
  `getManyAndCount()` também em `locations`/`events`/`eras` — para não introduzir
  regressão de performance nem mudança de comportamento quando `tagIds` não é
  informado).
- Replicar literalmente o comentário explicativo sobre a limitação do
  `getManyAndCount()` com `groupBy`/`having` em cada service (mesmo texto/adaptado ao
  nome da entidade), para manter a documentação inline consistente entre módulos.
- Em nenhum dos 6 módulos há, hoje, outro `groupBy`/`having` na listagem — o único
  `groupBy` introduzido é o do filtro de tags, então não há combinação com agrupamento
  pré-existente a resolver.
- Mensagens de erro e descrições do Swagger (`@ApiPropertyOptional`) devem estar em
  pt-BR, seguindo o texto de `trainings` adaptado ao nome da entidade (ex.: "Retorna
  apenas raças que possuem TODAS as tags informadas (AND)", "... apenas criaturas que
  possuem...", etc.).

### 2. api-dev-doc

Status: concluído

- Depende da etapa 1.
- Atualizar a documentação Swagger dos 6 endpoints de listagem para refletir o novo
  parâmetro de query `tagIds` (via `@ApiPropertyOptional` já descrito acima — não deve
  haver texto adicional a criar fora do DTO, já que os controllers usam `@Query()` com
  o DTO tipado e o Swagger é gerado a partir dele). Conferir se `@ApiOperation({
  summary: ... })` de cada `findAll` continua condizente (ex.: "Lista raças com
  paginação e filtro" já cobre o novo filtro genericamente; não é obrigatório alterar o
  `summary`, mas pode-se enriquecê-lo se o revisor de docs achar necessário).

Verificação concluída:
- Todos os 6 DTOs de query (races, creatures, locations, events, eras, divinities) já
  possuem `tagIds` com `@ApiPropertyOptional` completo, incluindo type, format, isArray,
  description em pt-BR com semântica AND, example e notação de querystring.
- Todos os 6 controllers possuem `@ApiOperation({ summary: ... })` genéricos adequados
  que cobrem o novo filtro ("Lista... com paginação e filtro").
- Todos os endpoints possuem `@ApiBearerAuth()` e guardam apropriadamente.
- Swagger reflete automaticamente o novo parâmetro via DTO tipado no `@Query()`.

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - Os nomes de tabela/coluna de junção usados em cada `innerJoin` batem exatamente com
    o `*-tag.entity.ts` e a migration de cada módulo (não usar convenção genérica sem
    checar).
  - O `groupBy`/`having` não quebra `orderBy`/`select` existentes em nenhum dos 6
    services, especialmente em `races`, `creatures`, `divinities` (joins com
    `category`) e `events` (join com `era`) e `eras` (order por coluna `ordering`).
  - O cálculo de `total` só muda de estratégia quando `hasTagFilter` é `true`, sem
    regressão no caminho sem filtro de tags.
  - Dedupe de `tagIds`, mensagens em pt-BR e consistência de nomenclatura de alias
    (`<entidade>_tag_filter`) entre os 6 módulos.

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:

- `app-api/src/modules/races/dto/find-races-query.dto.ts`,
  `app-api/src/modules/races/races.service.ts`,
  `app-api/src/modules/races/races.controller.ts`
- `app-api/src/modules/creatures/dto/find-creatures-query.dto.ts`,
  `app-api/src/modules/creatures/creatures.service.ts`,
  `app-api/src/modules/creatures/creatures.controller.ts`
- `app-api/src/modules/locations/dto/find-locations-query.dto.ts`,
  `app-api/src/modules/locations/locations.service.ts`,
  `app-api/src/modules/locations/locations.controller.ts`
- `app-api/src/modules/events/dto/find-events-query.dto.ts`,
  `app-api/src/modules/events/events.service.ts`,
  `app-api/src/modules/events/events.controller.ts`
- `app-api/src/modules/eras/dto/find-eras-query.dto.ts`,
  `app-api/src/modules/eras/eras.service.ts`,
  `app-api/src/modules/eras/eras.controller.ts`
- `app-api/src/modules/divinities/dto/find-divinities-query.dto.ts`,
  `app-api/src/modules/divinities/divinities.service.ts`,
  `app-api/src/modules/divinities/divinities.controller.ts`

Pontos verificados e conferidos sem divergência:

- **Alias/tabela/coluna de junção**: os 6 `innerJoin(<tabela>, '<entidade>_tag_filter',
  '<entidade>_tag_filter.<entidade>_id = <entidade>.id AND
  <entidade>_tag_filter.tag_id IN (:...tagIds)', ...)` batem exatamente com as
  migrations `CreateRaceTagsTable`, `CreateCreatureTagsTable`,
  `CreateLocationTagsTable`, `CreateEventTagsTable`, `CreateEraTagsTable`,
  `CreateDivinityTagsTable` (nome da tabela, nome das colunas FK `*_id`/`tag_id`) e com
  os respectivos `*-tag.entity.ts` (`@JoinColumn({ name: '<entidade>_id' })` /
  `@JoinColumn({ name: 'tag_id' })`). Nomenclatura de alias `<entidade>_tag_filter`
  consistente entre os 6 módulos.
- **`groupBy`/`having` vs. `orderBy`/`select` existentes**:
  - `races`, `creatures`, `divinities`: o `leftJoin('<entidade>.category', 'category')`
    pré-existente não é afetado pelo `groupBy('<entidade>.id')`/`having(...)` porque a
    categoria nunca é explicitamente selecionada (`.select([...])` final restringe a
    projeção só a `id`/`name` da entidade principal) nem usada no `orderBy` — sem
    violação de dependência funcional no Postgres.
  - `events`: mesmo raciocínio para `leftJoin('event.era', 'era')` — `era` não entra no
    `select` final (`['event.id', 'event.name']`) nem no `orderBy` (`event.name`).
  - `eras`: caso de maior atenção, verificado com cuidado. `orderBy('era.order', 'ASC')`
    (mapeado para a coluna `ordering`) é aplicado sobre uma query com
    `groupBy('era.id')` quando `hasTagFilter` é `true`. Como `era.id` é a chave
    primária da tabela `eras` e `order`/`ordering` é uma coluna simples da mesma
    tabela (não de um join), o Postgres aceita a dependência funcional e permite
    referenciar `era.order` no `ORDER BY` mesmo sem ele estar no `GROUP BY` nem no
    `SELECT` (que é só `['era.id']`) — comportamento correto e documentado com
    comentário inline explicando a dependência funcional. Sem filtro de tags (sem
    `groupBy`), o `orderBy('era.order', 'ASC')` funciona normalmente. Nenhuma quebra
    encontrada.
- **Cálculo de `total`**: em todos os 6 services, a troca de estratégia
  (`getCount()` → contagem via `.clone().select('<entidade>.id').getRawMany().length`)
  só ocorre dentro do `if (hasTagFilter)`/expressão ternária condicionada a
  `hasTagFilter`, preservando `getCount()` no caminho sem filtro de tags — sem
  regressão de performance ou comportamento.
- **Dedupe de `tagIds`**: `[...new Set(query.tagIds)]` aplicado de forma idêntica nos 6
  services, usado tanto no parâmetro `:...tagIds` do `IN` quanto no `tagCount` do
  `having(COUNT(DISTINCT ...) = :tagCount)`.
- **Mensagens/documentação em pt-BR**: `@ApiPropertyOptional` de `tagIds` presente e
  coerente nos 6 DTOs de query, com semântica AND e notação de querystring
  (`tagIds[]=uuid1&tagIds[]=uuid2`), adaptada ao nome de cada entidade (raças,
  criaturas, locais, eventos, eras, divindades). Comentário explicativo sobre a
  limitação do `getManyAndCount()` com `groupBy`/`having` replicado com o mesmo texto
  (adaptado à entidade) nos 6 services.
- **Controllers**: nenhum dos 6 controllers precisou de alteração — `@Query()` já
  injeta o DTO tipado; todos mantêm `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` a nível de classe, inalterado.
- **Consistência migration ↔ entidade** (junção): tabela, colunas FK (`ON DELETE
  CASCADE`), índices e `down()` de todas as 6 migrations de tag conferidas — sem
  divergência com os `*-tag.entity.ts` correspondentes.
