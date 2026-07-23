# Task API: Raças

## Contexto
Não existe `.claude/tasks/racas/spec.md` para esta demanda — o requisito foi
informado diretamente pelo solicitante e já está completo/esclarecido, sem
necessidade de passar pelo agente `spec`. Este plano usa como referência de
padrões o módulo `app-api/src/modules/creatures/` (entidade com categoria via
`ManyToOne` para tabela auxiliar de valores fixos populados por seed, campos
de texto rico, relação `ManyToMany` com `Tag`) e o módulo
`app-api/src/modules/locations/` (módulo mais recente, mesmo padrão de
`ManyToMany` com `Tag` via `JoinTable` dedicada), reaproveitando a entidade
`Tag` já existente em `app-api/src/modules/tags/entities/tag.entity.ts`.

## Etapas

### 1. api-dev

#### Entidade

**`Race`** (tabela `races`), estendendo `BaseEntity` (herda `id` uuid,
`createdAt`, `updatedAt`). Nomes de colunas/propriedades em inglês; apenas
mensagens de erro/validação ficam em pt-BR:

- `name` (varchar) — "Nome" — obrigatório, único. Aplicar índice único
  (mesmo padrão `@Index({ unique: true })` usado em `Creature.name` e
  `Location.name`).
- `category` — relação `ManyToOne` para `RaceCategory` (coluna
  `category_id`, obrigatória, `nullable: false`). Usar `onDelete: 'RESTRICT'`,
  mesmo padrão de `Creature.category`, já que as categorias são um conjunto
  fixo populado por seed e não devem ser removidas com raças vinculadas.
- `referenceImageUrl` (varchar, nullable, coluna `reference_image_url`) —
  "Imagem Referência" — opcional; quando preenchido deve ser uma URL válida
  (`@IsUrl` no DTO, mensagem pt-BR customizada; validação não fica na
  entidade — mesmo padrão de `Creature.referenceImageUrl` /
  `Location.referenceImageUrl`).
- `physicalCharacteristics` (text, nullable, coluna
  `physical_characteristics`) — "Características físicas" — campo de texto
  rico (HTML), **opcional** — diferente de `Creature.physicalCharacteristics`
  (lá é obrigatório); aqui não há requisito de obrigatoriedade, confirmado
  pelo solicitante.
- `description` (text, nullable) — "Descrição" — campo de texto rico (HTML),
  opcional, mesmo padrão de `Location.description`.
- `tags` — relação `ManyToMany` para `Tag`
  (`modules/tags/entities/tag.entity.ts`), via `@JoinTable` dedicada
  `race_tags` (`race_id` / `tag_id`), exatamente no mesmo padrão de
  `Creature.tags` / `creature_tags` e `Location.tags` / `location_tags`.

**`RaceCategory`** (tabela `race_categories`), estendendo `BaseEntity`, no
mesmo formato de `CreatureCategory`:
- `name` (string) — obrigatório, único (`@Index({ unique: true })`). Os 6
  valores fixos ("Humanoide", "Feérico", "Celestial", "Bestial", "Infero",
  "Goblinoide") são populados via seed em migration, não cadastrados pelo
  usuário final — não expor endpoint de criação/edição/exclusão para essa
  entidade, apenas listagem (`GET /races/categories`).
- Relacionamento inverso `OneToMany` para `Race` é opcional — só declarar se
  necessário para alguma query; não é exigido pelo escopo (mesma decisão já
  tomada em `CreatureCategory`).

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `src/database/migrations/`).
- Migration 1 — `CreateRaceCategoriesTable` (timestamp sugerido
  `1784305430000`, posterior à última migration existente
  `1784305420000-CreateLocationPointsOfInterestTable.ts`): cria a tabela
  `race_categories` (`id` uuid PK default `gen_random_uuid()`, `created_at`,
  `updated_at`, `name` varchar not null, índice único em `name`) e insere no
  próprio `up()` os 6 valores fixos ("Humanoide", "Feérico", "Celestial",
  "Bestial", "Infero", "Goblinoide") via `INSERT`, mesmo formato de
  `1784305350000-CreateCreatureCategoriesTable.ts`. O `down()` remove os
  registros do seed (ou dropa a tabela direto) e desfaz o índice.
- Migration 2 — `CreateRacesTable` (timestamp sugerido `1784305440000`):
  cria a tabela `races` com:
  - `id`, `created_at`, `updated_at` (padrão `BaseEntity`);
  - `name` varchar not null + índice único;
  - `category_id` uuid not null com FK para `race_categories(id)` —
    `ON DELETE RESTRICT`;
  - `reference_image_url` varchar nullable;
  - `physical_characteristics` text nullable;
  - `description` text nullable.
  Deve ter timestamp posterior à migration de categorias, já que depende da
  tabela `race_categories` existir (FK).
- Migration 3 — `CreateRaceTagsTable` (timestamp sugerido `1784305450000`):
  cria a tabela de junção `race_tags` (`race_id` uuid not null, `tag_id` uuid
  not null, PK composta `(race_id, tag_id)`, índices em cada coluna, FK
  `race_id` → `races(id)` `ON DELETE CASCADE`, FK `tag_id` → `tags(id)`
  `ON DELETE CASCADE`), no mesmo formato de
  `1784305380000-CreateCreatureTagsTable.ts` /
  `1784305410000-CreateLocationTagsTable.ts`. Deve rodar depois da migration
  de `races` e depois de `CreateTagsTable` (`1784305370000`) já existente
  (depende de ambas as tabelas via FK).
- Gerar as três via `npm run migration:generate` a partir das entidades já
  criadas (`Race`, `RaceCategory`) e revisar o SQL resultante; o `INSERT` do
  seed precisa ser adicionado manualmente no `up()` da migration de
  categorias, pois `migration:generate` não gera dados, apenas schema.

#### Controller

- Novo módulo `RacesModule` (`src/modules/races/`), com `RacesController`,
  `RacesService`, `TypeOrmModule.forFeature([Race, RaceCategory, Tag])`
  (entidades já auto-registradas via `autoLoadEntities: true`, sem passo
  manual adicional em `app.module.ts` para elas; `RacesModule` em si precisa
  ser importado em `app.module.ts`, como os demais módulos de feature).
- Protegido por `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, mesmo padrão
  de `CreaturesController` / `LocationsController`.
- Endpoints:
  - `POST /races` — cria raça. Valida `name` único (409 pt-BR,
    `ConflictException`, mesmo padrão de nome duplicado em
    `CreaturesService`), `categoryId` existente (404 pt-BR, "Categoria não
    encontrada.") e `tagIds` existentes quando informados (404 pt-BR, "Uma
    ou mais tags não foram encontradas."). Retorna `RaceResponseDto`.
  - `GET /races` — lista paginada. Query DTO com `name` (opcional, busca
    parcial `ILIKE`), `categoryId` (opcional, igualdade exata), `page`,
    `perPage` (defaults `DEFAULT_PAGE`/`DEFAULT_PER_PAGE` de
    `common/variables/pagination.ts`). Ordenação padrão:
    `orderBy('race.name', 'ASC')`. Retorna `PaginatedRacesResponseDto`
    composto por `RaceListItemResponseDto` (enxuto, incluindo
    `referenceImageUrl`, `name`, `category` e `tags` — a listagem no
    frontend exibe coluna "tags").
  - `GET /races/categories` — lista as `RaceCategory` disponíveis (sem
    paginação), ordenadas por `name` ASC. Retorna `RaceCategoryResponseDto[]`.
    Importante: declarar este método **antes** de `GET /races/:id` na classe
    do controller, para que a rota estática não seja capturada pelo
    parâmetro dinâmico `:id` (mesmo cuidado de
    `GET /creatures/categories`).
  - `GET /races/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
    encontrado ("Raça não encontrada."). Retorna `RaceResponseDto` completo
    (todos os campos + categoria aninhada + tags).
  - `PUT /races/:id` — atualiza raça (mesmas validações de nome único ao
    trocar o nome, `categoryId` válido quando informado, `tagIds` válidos
    quando informados). Retorna `RaceResponseDto`.
  - `DELETE /races/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrado. A remoção de linhas em `race_tags` é resolvida pelo
    `ON DELETE CASCADE` do schema, sem necessidade de lógica adicional no
    service.
- DTOs:
  - `CreateRaceDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
    - `categoryId` (`@IsUUID`, obrigatório);
    - `referenceImageUrl` (`@IsOptional`, `@IsUrl`, mensagem de erro pt-BR
      customizada, mesmo padrão de `CreateCreatureDto.referenceImageUrl`);
    - `physicalCharacteristics` (`@IsOptional`, `@IsString` — diferente de
      `CreateCreatureDto.physicalCharacteristics`, aqui não é obrigatório);
    - `description` (`@IsOptional`, `@IsString`);
    - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`,
      mesmo padrão de `CreateCreatureDto.tagIds` / `CreateLocationDto.tagIds`).
  - `UpdateRaceDto` — `PartialType(CreateRaceDto)`, mesmo padrão de
    `UpdateCreatureDto` / `UpdateLocationDto`.
  - `FindRacesQueryDto` — `name?` (`@IsOptional @IsString`), `categoryId?`
    (`@IsOptional @IsUUID`), `page?`, `perPage?` (mesmo padrão de
    `FindCreaturesQueryDto`).
  - `RaceResponseDto` — `id`, `name`, `category` (`RaceCategoryResponseDto`),
    `referenceImageUrl`, `physicalCharacteristics`, `description`, `tags`
    (`TagResponseDto[]`), `createdAt`, `updatedAt`; com `static
    fromEntity(race): RaceResponseDto`.
  - `RaceListItemResponseDto` — enxuto: `id`, `referenceImageUrl`, `name`,
    `category` (`RaceCategoryResponseDto`), `tags` (`TagResponseDto[]`); com
    `static fromEntity(race)`.
  - `PaginatedRacesResponseDto` — `data: RaceListItemResponseDto[]`, `total`,
    `page`, `perPage`, `totalPages` (mesmo padrão de
    `PaginatedCreaturesResponseDto` / `PaginatedLocationsResponseDto`).
  - `RaceCategoryResponseDto` — `id`, `name`; com `static
    fromEntity(category)` (idêntico a `CreatureCategoryResponseDto`).
- Service (`RacesService`), pontos principais a replicar do padrão de
  `CreaturesService`:
  - `findByName(name)`, `findById(id)` (com `relations: { category: true,
    tags: true }`);
  - `findCategoryById(id)`, `findAllCategories()` (ordenado por `name` ASC);
  - `findTagsByIds(tagIds)` privado, reaproveitando `TagsModule`/`Tag`
    (idêntico ao de `CreaturesService`, 404 pt-BR se alguma tag não existir);
  - `create`: valida nome único (409), resolve `category` a partir de
    `categoryId` (404 pt-BR se não existir), resolve `tags` a partir dos ids
    informados (array vazio quando ausente), persiste;
  - `findAllPaginated`: filtra por `name` (`ILIKE` parcial) e `categoryId`
    (igualdade exata), ordena por `race.name` ASC, pagina buscando primeiro
    apenas `id`/`name` via `skip`/`take` + `getManyAndCount` e depois
    recarrega a página completa com `relations: { category: true, tags:
    true }` (mesmo padrão de `CreaturesService.findAllPaginated`, evitando
    duplicação de linhas por `ManyToMany` + paginação);
  - `update`: valida nome único ao trocar, resolve `category` quando
    `categoryId` informado e diferente do atual (404 pt-BR se não existir),
    resolve `tags` **apenas** quando `dto.tagIds !== undefined` (não
    sobrescreve a relação quando o campo é omitido, mesmo padrão de
    `CreaturesService.update`/`LocationsService.update`);
  - `remove`: `delete({ id })`, 404 pt-BR se `affected === 0`.

Status: concluído
Entidade: app-api/src/modules/races/entities/race.entity.ts
Migration: app-api/src/database/migrations/1784305430000-CreateRaceCategoriesTable.ts,
app-api/src/database/migrations/1784305440000-CreateRacesTable.ts,
app-api/src/database/migrations/1784305450000-CreateRaceTagsTable.ts
Rotas: POST /races, GET /races, GET /races/categories, GET /races/:id,
PUT /races/:id, DELETE /races/:id
Arquivos: app-api/src/modules/races/entities/race-category.entity.ts,
app-api/src/modules/races/dto/create-race.dto.ts,
app-api/src/modules/races/dto/update-race.dto.ts,
app-api/src/modules/races/dto/find-races-query.dto.ts,
app-api/src/modules/races/dto/race-response.dto.ts,
app-api/src/modules/races/dto/race-list-item-response.dto.ts,
app-api/src/modules/races/dto/race-category-response.dto.ts,
app-api/src/modules/races/dto/paginated-races-response.dto.ts,
app-api/src/modules/races/races.service.ts,
app-api/src/modules/races/races.controller.ts,
app-api/src/modules/races/races.module.ts,
app-api/src/app.module.ts (registro de RacesModule)

Observação: o controller inclui apenas as anotações Swagger estruturais
(`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` finos
ficam a cargo da etapa `api-dev-doc`, conforme escopo desta etapa.

### 2. api-dev-doc
- Depende da etapa 1 (api-dev).
- Revisar/complementar a documentação Swagger de todos os endpoints novos:
  `@ApiTags('races')` no controller, `@ApiOperation({ summary })` em pt-BR
  para cada rota (criar, listar, listar categorias, buscar por id, atualizar,
  remover).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, com mensagem pt-BR de
  exemplo), `@ApiNotFoundResponse` (404 — raça não encontrada, categoria não
  encontrada, uma ou mais tags não encontradas — cobrindo `create`, `update`
  e `findOne`/`remove` de forma precisa, sem misturar com os casos reais de
  400), `@ApiBadRequestResponse` (validação — URL inválida em
  `referenceImageUrl`, `categoryId`/`id`/`tagIds` em formato inválido).
- Conferir que todos os campos de `CreateRaceDto`/`UpdateRaceDto`/
  `RaceResponseDto`/`RaceListItemResponseDto`/`RaceCategoryResponseDto`
  possuem `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes,
  incluindo `physicalCharacteristics` e `description` (exemplos em HTML,
  mesmo padrão dos campos de texto rico de `Creature`/`Location`), e
  documentando claramente que ambos são opcionais nesta entidade.
- Validar no `/docs` que o endpoint `GET /races/categories` aparece
  corretamente documentado e não é ofuscado pela rota `GET /races/:id`.
- Confirmar que `RaceListItemResponseDto` documenta `category` e `tags`
  tipados corretamente (`RaceCategoryResponseDto` / `TagResponseDto[]`), já
  que a listagem no frontend depende desses campos na resposta enxuta.

Status: concluído
Arquivos: app-api/src/modules/races/races.controller.ts,
app-api/src/modules/races/dto/create-race.dto.ts,
app-api/src/modules/races/dto/race-response.dto.ts,
app-api/src/modules/races/dto/race-list-item-response.dto.ts,
app-api/src/modules/races/dto/race-category-response.dto.ts

### 3. api-dev-codereviewer
- Revisar tudo acima.
- Revisar as entidades `Race` e `RaceCategory`: tipos, nullability
  (`referenceImageUrl`, `physicalCharacteristics`, `description` nullable;
  `name` not null + índice único em ambas as entidades), a relação
  `ManyToOne` `category` (`nullable: false`, `onDelete: 'RESTRICT'`, coluna
  `category_id`), e a relação `ManyToMany` com `Tag` via `@JoinTable`
  dedicada `race_tags` (`race_id`/`tag_id`).
- Revisar as migrations: ordem de execução (`race_categories` → `races` →
  `race_tags`, esta última também dependendo de `CreateTagsTable` já
  existente), seed dos 6 valores fixos exatos ("Humanoide", "Feérico",
  "Celestial", "Bestial", "Infero", "Goblinoide") no `up()` da migration de
  categorias, FK `category_id` com `ON DELETE RESTRICT`, PK composta e
  índices da tabela de junção `race_tags` com FKs `ON DELETE CASCADE` nas
  duas colunas, `down()` revertendo tudo (índices, FKs, tabelas, dados do
  seed) na ordem inversa.
- Revisar DTOs e validações: unicidade de nome (409 pt-BR) em `create` e
  `update`, `@IsUrl` condicional em `referenceImageUrl`, `categoryId`
  validado contra existência real (404 pt-BR), `tagIds` validados contra
  existência real (404 pt-BR), `physicalCharacteristics`/`description`
  corretamente opcionais (`@IsOptional` + `@IsString`, sem exigir
  `@IsNotEmpty` — ponto que diverge deliberadamente do padrão de
  `Creature.physicalCharacteristics`), `PartialType` correto em
  `UpdateRaceDto`.
- Revisar o service: que `update` só reatribui `tags` quando
  `dto.tagIds !== undefined` (preservando a relação existente quando o
  campo é omitido), que `category` só é resolvida/revalidada quando
  `categoryId` é informado e diferente do atual, e que `findById`/listagem
  carregam as relações necessárias (`category`, `tags`) sem causar N+1
  desnecessário.
- Revisar o controller: guards (`JwtAuthGuard`/`ApiBearerAuth`), ordem das
  rotas (`GET /races/categories` antes de `GET /races/:id`), filtros (`name`
  parcial via `ILIKE`, `categoryId` exato), ordenação padrão por `name` ASC,
  paginação `{ data, total, page, perPage }` + `totalPages` calculado no
  controller, uso de `fromEntity` em todos os DTOs de resposta.
- Confirmar que `RaceListItemResponseDto` retorna `category` e `tags`
  preenchidos corretamente (requisito explícito de que a listagem exiba a
  coluna "tags" no frontend).
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome
  duplicado, raça não encontrada, categoria não encontrada, tags não
  encontradas, URL inválida), enquanto nomes de entidade/colunas/DTOs/JSON
  permanecem em inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration,
  `RacesModule` registrado em `app.module.ts`).

## Revisão

Escopo revisado: `app-api/src/modules/races/entities/race.entity.ts`,
`app-api/src/modules/races/entities/race-category.entity.ts`,
`app-api/src/database/migrations/1784305430000-CreateRaceCategoriesTable.ts`,
`app-api/src/database/migrations/1784305440000-CreateRacesTable.ts`,
`app-api/src/database/migrations/1784305450000-CreateRaceTagsTable.ts`,
`app-api/src/modules/races/dto/create-race.dto.ts`,
`app-api/src/modules/races/dto/update-race.dto.ts`,
`app-api/src/modules/races/dto/find-races-query.dto.ts`,
`app-api/src/modules/races/dto/race-response.dto.ts`,
`app-api/src/modules/races/dto/race-list-item-response.dto.ts`,
`app-api/src/modules/races/dto/race-category-response.dto.ts`,
`app-api/src/modules/races/dto/paginated-races-response.dto.ts`,
`app-api/src/modules/races/races.service.ts`,
`app-api/src/modules/races/races.controller.ts`,
`app-api/src/modules/races/races.module.ts`,
`app-api/src/app.module.ts`. Etapas "1. api-dev" e "2. api-dev-doc" estão
ambas marcadas como "Status: concluído" no plano, portanto a revisão avaliou
o trabalho como pronto para análise final.

Confirmado que estão corretos e de acordo com o `CLAUDE.md`/plano da task:

- **Entidade `Race`**: `name` not null + `@Index({ unique: true })`;
  `category` como `ManyToOne(() => RaceCategory, { nullable: false, onDelete:
  'RESTRICT' })` com `@JoinColumn({ name: 'category_id' })`, exatamente no
  mesmo padrão de `Creature.category`; `referenceImageUrl` (coluna
  `reference_image_url`), `physicalCharacteristics` (coluna
  `physical_characteristics`) e `description` todos `nullable: true`
  (`string | null`); `tags` como `ManyToMany(() => Tag)` com `@JoinTable`
  dedicada `race_tags` (`race_id`/`tag_id`), idêntico a `Creature.tags`/
  `creature_tags` e `Location.tags`/`location_tags`.
- **Entidade `RaceCategory`**: `name` not null + índice único, sem
  relacionamento inverso `OneToMany` declarado (decisão explícita do plano,
  mesma de `CreatureCategory`), sem endpoints de escrita expostos no
  controller (apenas `GET /races/categories`).
- **Migrations**: ordem cronológica correta e coerente com a última migration
  pré-existente (`1784305420000-CreateLocationPointsOfInterestTable.ts`) →
  `1784305430000-CreateRaceCategoriesTable` → `1784305440000-CreateRacesTable`
  → `1784305450000-CreateRaceTagsTable` (esta última depende também de
  `1784305370000-CreateTagsTable`, já anterior). Seed dos 6 valores fixos
  exatos ("Humanoide", "Feérico", "Celestial", "Bestial", "Infero",
  "Goblinoide") no `up()` de `CreateRaceCategoriesTable`, com índice único em
  `name` criado antes do `INSERT`. `CreateRacesTable` cria todas as colunas
  com tipos/nullability idênticos à entidade e FK `category_id` →
  `race_categories(id)` com `ON DELETE RESTRICT`. `CreateRaceTagsTable` cria
  PK composta `(race_id, tag_id)`, índices em ambas as colunas e FKs `ON
  DELETE CASCADE` em `race_id` → `races(id)` e `tag_id` → `tags(id)`. Os três
  `down()` revertem constraints/índices/tabelas na ordem inversa do `up()`.
  Formatação e convenção de nomes de constraint (`PK_races_id`,
  `FK_races_category_id`, `IDX_race_tags_race_id` etc.) idênticas ao padrão
  já usado em `CreateCreatureCategoriesTable`/`CreateCreaturesTable`/
  `CreateCreatureTagsTable`.
- **DTOs e validação**: `CreateRaceDto` com `@IsString`/`@IsNotEmpty` em
  `name`, `@IsUUID` obrigatório em `categoryId`, `@IsUrl` condicional com
  mensagem pt-BR customizada em `referenceImageUrl`,
  `physicalCharacteristics`/`description` como `@IsOptional`/`@IsString` sem
  `@IsNotEmpty` (divergência deliberada do padrão de `Creature`, conforme
  plano), `tagIds` como `@IsOptional`/`@IsArray`/`@IsUUID('4', { each: true
  })`. `UpdateRaceDto` é `PartialType(CreateRaceDto)`. `FindRacesQueryDto`
  com `name`/`categoryId` opcionais e `page`/`perPage` no mesmo padrão de
  `FindCreaturesQueryDto`. `RaceResponseDto`/`RaceListItemResponseDto`/
  `RaceCategoryResponseDto` usam `static fromEntity(...)`, não vazam nenhum
  campo sensível (a entidade não possui campos `select: false`) e
  `RaceListItemResponseDto` retorna `category`/`tags` preenchidos, atendendo
  ao requisito da coluna "tags" na listagem do frontend.
- **Service (`RacesService`)**: `create` valida nome único (409
  `ConflictException` pt-BR), resolve `category` via `findCategoryById` (404
  pt-BR "Categoria não encontrada.") e `tags` via `findTagsByIds` privado
  (404 pt-BR "Uma ou mais tags não foram encontradas.", array vazio quando
  `tagIds` ausente/vazio). `update` só reatribui `race.category` quando
  `dto.categoryId` é informado **e** diferente do atual (`dto.categoryId &&
  dto.categoryId !== race.category.id`), e só reatribui `race.tags` quando
  `dto.tagIds !== undefined`, preservando a relação quando o campo é omitido
  — exatamente como especificado. `findById` carrega `category`/`tags` em uma
  única consulta via `relations`. `findAllPaginated` filtra por `name`
  (`ILIKE` parcial) e `categoryId` (igualdade exata via
  `race.category = :categoryId`, mesmo padrão de `creature.category =
  :categoryId` em `CreaturesService`), ordena por `race.name` ASC, e evita
  duplicação de linhas por `ManyToMany` + paginação buscando primeiro
  `id`/`name` via `skip`/`take` + `getManyAndCount` e recarregando a página
  completa com `relations: { category: true, tags: true }` — sem N+1
  desnecessário. `remove` usa `delete({ id })` com 404 pt-BR quando `affected
  === 0`.
- **Controller (`RacesController`)**: `@UseGuards(JwtAuthGuard)` +
  `@ApiBearerAuth()` na classe; rotas na ordem `POST /races`, `GET /races`,
  `GET /races/categories`, `GET /races/:id`, `PUT /races/:id`, `DELETE
  /races/:id` — `GET /races/categories` corretamente declarado antes de `GET
  /races/:id`, evitando captura pela rota dinâmica. Paginação monta `{ data,
  total, page, perPage, totalPages }` com `totalPages` calculado no
  controller (`Math.ceil(total / perPage)`), e todos os DTOs de resposta são
  construídos via `fromEntity`.
- **Mensagens de erro/validação**: todas em pt-BR ("Já existe uma raça com
  este nome.", "Categoria não encontrada.", "Uma ou mais tags não foram
  encontradas.", "Raça não encontrada.", "A URL da imagem de referência é
  inválida."), enquanto nomes de entidade/colunas/DTOs/JSON permanecem em
  inglês.
- **Documentação Swagger**: `@ApiTags('races')` no controller,
  `@ApiOperation({ summary })` em pt-BR em todas as rotas,
  `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`/
  `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse`
  presentes e coerentes com o comportamento real de cada endpoint (incluindo
  a distinção entre os 404 de `create`/`update` — categoria/tags — e o de
  `findOne`/`remove` — raça). Todos os campos de `CreateRaceDto`/
  `RaceResponseDto`/`RaceListItemResponseDto`/`RaceCategoryResponseDto`
  possuem `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes,
  incluindo exemplos em HTML para `physicalCharacteristics`/`description` e
  descrição indicando que ambos são opcionais nesta entidade.
- **Módulo**: `RacesModule` com `TypeOrmModule.forFeature([Race,
  RaceCategory, Tag])`, registrado em `app.module.ts`
  (`imports: [..., RacesModule, ...]`).

Problemas encontrados: nenhum. Não foram identificados bugs de lógica,
tipagem, imports quebrados, inconsistências entre migration e entidade,
vazamento de dados sensíveis, mensagens fora do padrão pt-BR, nem desvios de
nomenclatura/estrutura em relação ao `CLAUDE.md` ou ao restante do módulo
`creatures`/`locations` usado como referência.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/races/entities/race.entity.ts`,
`app-api/src/modules/races/entities/race-category.entity.ts`,
`app-api/src/database/migrations/1784305430000-CreateRaceCategoriesTable.ts`,
`app-api/src/database/migrations/1784305440000-CreateRacesTable.ts`,
`app-api/src/database/migrations/1784305450000-CreateRaceTagsTable.ts`,
`app-api/src/modules/races/dto/create-race.dto.ts`,
`app-api/src/modules/races/dto/update-race.dto.ts`,
`app-api/src/modules/races/dto/find-races-query.dto.ts`,
`app-api/src/modules/races/dto/race-response.dto.ts`,
`app-api/src/modules/races/dto/race-list-item-response.dto.ts`,
`app-api/src/modules/races/dto/race-category-response.dto.ts`,
`app-api/src/modules/races/dto/paginated-races-response.dto.ts`,
`app-api/src/modules/races/races.service.ts`,
`app-api/src/modules/races/races.controller.ts`,
`app-api/src/modules/races/races.module.ts`,
`app-api/src/app.module.ts`.