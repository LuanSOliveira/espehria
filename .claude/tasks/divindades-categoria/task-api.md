# Task API: Categoria de Divindades

## Contexto
Ver .claude/tasks/divindades-categoria/spec.md (se existir) — no momento este
arquivo não existe. O pedido foi recebido diretamente e é claro o suficiente
para planejar sem reabrir perguntas: adicionar uma propriedade "Categoria" à
entidade `Divinity` (módulo `app-api/src/modules/divinities/`, já
implementado — ver `.claude/tasks/divindades/task-api.md`), modelada como
tabela auxiliar relacionada, exatamente no mesmo padrão já usado por
`RaceCategory` (`app-api/src/modules/races/entities/race-category.entity.ts`)
e `CreatureCategory`
(`app-api/src/modules/creatures/entities/creature-category.entity.ts`).

Padrão de referência (races/creatures), confirmado por leitura direta do
código:
- Entidade auxiliar simples estendendo `BaseEntity`, só com `name` (varchar,
  `@Index({ unique: true })`), populada via seed em migration — sem endpoints
  de criação/edição/exclusão para o usuário final.
- Na entidade principal, a categoria é uma relação `ManyToOne` **obrigatória**
  (`nullable: false`) com `onDelete: 'RESTRICT'` e coluna física
  `category_id`, tanto em `Race.category` quanto em `Creature.category`.
- Endpoint dedicado `GET /<recurso>/categories` (sem paginação, ordenado por
  `name` ASC), declarado **antes** de `GET /<recurso>/:id` no controller para
  não ser capturado pela rota dinâmica.
- `categoryId` é obrigatório em `CreateRaceDto`/`CreateCreatureDto`
  (`@IsUUID()`, sem `@IsOptional`), validado contra existência real no
  service (404 pt-BR "Categoria não encontrada.").
- Resposta (`RaceResponseDto`/`CreatureResponseDto` e as variantes
  `*ListItemResponseDto`) inclui a categoria aninhada via
  `RaceCategoryResponseDto`/`CreatureCategoryResponseDto`
  (`{ id, name }` + `static fromEntity`).
- Seed das opções fixas é feito com `INSERT` manual no `up()` da migration
  que cria a tabela auxiliar (ver
  `1784305430000-CreateRaceCategoriesTable.ts` e
  `1784305350000-CreateCreatureCategoriesTable.ts`), já que
  `migration:generate` não gera dados, só schema.

**Decisão de coerência (obrigatória vs. opcional):** para manter a
`Divinity` alinhada ao mesmo padrão de `Race`/`Creature` — as duas únicas
entidades do projeto que já têm relação de categoria via tabela auxiliar — a
categoria de divindade será **obrigatória** (`nullable: false`,
`onDelete: 'RESTRICT'`, `categoryId` obrigatório em `CreateDivinityDto`). Isso
diverge da decisão registrada anteriormente em
`.claude/tasks/divindades/task-api.md`, que dizia explicitamente que
`Divinity` não teria "relação obrigatória com nenhuma entidade de categoria
(ao contrário de `Race`/`Creature`)" — essa observação fica superada por este
plano, que implementa exatamente o pedido atual do usuário.

**Ponto a sinalizar (não é decisão de arquitetura, é lacuna de dado a
verificar antes de aplicar a migration):** como a tabela `divinities` já
existe e pode já conter registros, adicionar uma coluna `category_id`
`NOT NULL` exige uma estratégia de backfill para linhas existentes (definir
uma categoria padrão para preencher antes de aplicar a constraint
`NOT NULL`, ou confirmar que a tabela está vazia no ambiente de destino antes
de rodar a migration). O pedido do usuário não especifica qual das duas
categorias ("Divindade Maior"/"Divindade Menor") deve ser usada como valor
padrão para divindades já cadastradas — o `api-dev` deve verificar o estado
real dos dados antes de decidir a estratégia (backfill para uma categoria
específica vs. confirmar tabela vazia), e não presumir silenciosamente uma
das duas opções.

## Etapas

### 1. api-dev

#### Entidade

**`DivinityCategory`** (tabela `divinity_categories`), estendendo
`BaseEntity` (herda `id` uuid, `createdAt`, `updatedAt`), no mesmo formato
exato de `RaceCategory`/`CreatureCategory`:
- `name` (varchar) — obrigatório, único (`@Index({ unique: true })`). Os 2
  valores fixos ("Divindade Maior", "Divindade Menor") são populados via
  seed em migration, não cadastrados pelo usuário final — não expor
  endpoint de criação/edição/exclusão para essa entidade, apenas listagem
  (`GET /divinities/categories`).
- Sem relacionamento inverso `OneToMany` declarado (mesma decisão já tomada
  em `RaceCategory`/`CreatureCategory` — não é exigido pelo escopo).

**Alteração em `Divinity`** (`app-api/src/modules/divinities/entities/divinity.entity.ts`):
- Novo campo `category` — relação `ManyToOne` para `DivinityCategory`
  (coluna `category_id`, **obrigatória**, `nullable: false`), com
  `onDelete: 'RESTRICT'` (mesmo padrão de `Race.category`/`Creature.category`
  — categorias são um conjunto fixo por seed e não devem ser removidas com
  divindades vinculadas). Decorators: `@ApiProperty({ type: () =>
  DivinityCategory })` + `@ManyToOne(...)` + `@JoinColumn({ name:
  'category_id' })`, na mesma ordem usada em `Race.category`.
- Demais campos (`name`, `referenceImage`, `description`, `tags`)
  permanecem inalterados.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `src/database/migrations/`). Última migration existente é
  `1784305530000-CreateLocationSectionsTable.ts`; as novas devem ter
  timestamp posterior.

- Migration 1 — `CreateDivinityCategoriesTable` (timestamp sugerido
  `1784305540000`): cria a tabela `divinity_categories` (`id` uuid PK
  default `gen_random_uuid()`, `created_at`, `updated_at`, `name` varchar
  not null, índice único `IDX_divinity_categories_name`) e insere no próprio
  `up()` os 2 valores fixos ("Divindade Maior", "Divindade Menor") via
  `INSERT`, mesmo formato de `1784305430000-CreateRaceCategoriesTable.ts` /
  `1784305350000-CreateCreatureCategoriesTable.ts`. O `down()` dropa o
  índice e a tabela (o `DELETE`/seed é descartado junto com a tabela, mesmo
  padrão das duas migrations de referência).
- Migration 2 — `AddCategoryToDivinitiesTable` (timestamp sugerido
  `1784305550000`, posterior à migration 1 por depender da tabela
  `divinity_categories` via FK): adiciona a coluna `category_id` (uuid) à
  tabela `divinities` já existente. Como a tabela pode já conter registros,
  a migration precisa:
  1. Adicionar a coluna `category_id` inicialmente sem `NOT NULL`;
  2. Fazer o backfill de linhas existentes (`UPDATE "divinities" SET
     "category_id" = (SELECT "id" FROM "divinity_categories" WHERE "name" =
     '<categoria padrão>') WHERE "category_id" IS NULL`) — a categoria
     padrão usada aqui deve ser definida pelo `api-dev` com base no estado
     real dos dados (ver observação na seção "Contexto" acima); se a tabela
     estiver vazia no ambiente de destino, este passo é um no-op seguro e
     pode ser mantido por robustez;
  3. Alterar a coluna para `NOT NULL` (`ALTER COLUMN "category_id" SET NOT
     NULL`);
  4. Adicionar a FK `ALTER TABLE "divinities" ADD CONSTRAINT
     "FK_divinities_category_id" FOREIGN KEY ("category_id") REFERENCES
     "divinity_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
     mesmo padrão de `FK_races_category_id`/`FK_creatures_category_id`.
  O `down()` remove a FK e a coluna `category_id` (não precisa reverter o
  backfill, já que a coluna inteira é removida).
- Gerar as duas via `npm run migration:generate` a partir das entidades já
  alteradas (`Divinity`, `DivinityCategory`) e revisar/ajustar manualmente o
  SQL resultante — em especial os passos 1–3 da migration 2, que
  `migration:generate` normalmente não produz sozinho (ele tende a gerar
  direto `ADD COLUMN ... NOT NULL`, o que falha se já houver linhas na
  tabela).

#### Controller

- Endpoints existentes de `DivinitiesController` continuam os mesmos
  (`POST /divinities`, `GET /divinities`, `GET /divinities/:id`,
  `PUT /divinities/:id`, `DELETE /divinities/:id`), todos ajustados para
  considerar `category`/`categoryId` conforme abaixo.
- Novo endpoint `GET /divinities/categories` — lista as `DivinityCategory`
  disponíveis (sem paginação), ordenadas por `name` ASC. Retorna
  `DivinityCategoryResponseDto[]`. Importante: declarar este método **antes**
  de `GET /divinities/:id` na classe do controller, para que a rota estática
  não seja capturada pelo parâmetro dinâmico `:id` (mesmo cuidado de
  `GET /races/categories`/`GET /creatures/categories`).
- `POST /divinities` — passa a exigir `categoryId` no corpo (404 pt-BR
  "Categoria não encontrada." se inválido), além das validações já
  existentes (nome único, `tagIds` existentes quando informados).
- `GET /divinities` — `FindDivinitiesQueryDto` ganha filtro opcional
  `categoryId` (igualdade exata), mesmo padrão de `FindRacesQueryDto`.
  `DivinityListItemResponseDto` passa a incluir `category`
  (`DivinityCategoryResponseDto`), mesmo padrão de `RaceListItemResponseDto`/
  `CreatureListItemResponseDto` (a listagem no frontend passa a poder exibir
  a categoria).
- `GET /divinities/:id` — `DivinityResponseDto` passa a incluir `category`
  (`DivinityCategoryResponseDto`) entre os campos retornados.
- `PUT /divinities/:id` — `categoryId` passa a ser aceito (via
  `UpdateDivinityDto`, `PartialType(CreateDivinityDto)`, portanto opcional
  na atualização), validado contra existência real quando informado (404
  pt-BR "Categoria não encontrada.") e só reatribuído quando informado e
  diferente do atual, mesmo padrão de `RacesService.update`.
- `DELETE /divinities/:id` — sem alteração de comportamento.

- DTOs a criar/ajustar:
  - **Novo** `DivinityCategoryResponseDto`
    (`app-api/src/modules/divinities/dto/divinity-category-response.dto.ts`):
    `id`, `name`; `static fromEntity(category)` — idêntico a
    `RaceCategoryResponseDto`/`CreatureCategoryResponseDto`.
  - `CreateDivinityDto` — adicionar `categoryId` (`@IsUUID()`, obrigatório,
    sem `@IsOptional`, mesmo padrão de `CreateRaceDto.categoryId`/
    `CreateCreatureDto.categoryId`), posicionado logo após `name` para
    seguir a mesma ordem de campos usada em `races`/`creatures`.
  - `UpdateDivinityDto` — continua `PartialType(CreateDivinityDto)` (sem
    mudança estrutural; `categoryId` já fica opcional automaticamente).
  - `FindDivinitiesQueryDto` — adicionar `categoryId?` (`@IsOptional`,
    `@IsUUID`), mesmo padrão de `FindRacesQueryDto.categoryId`.
  - `DivinityResponseDto` — adicionar `category: DivinityCategoryResponseDto`
    (`@ApiProperty({ type: () => DivinityCategoryResponseDto })`) e no
    `fromEntity`, `dto.category =
    DivinityCategoryResponseDto.fromEntity(divinity.category)`.
  - `DivinityListItemResponseDto` — adicionar `category:
    DivinityCategoryResponseDto` da mesma forma, mesmo padrão de
    `RaceListItemResponseDto.category`.
  - `PaginatedDivinitiesResponseDto` — sem alteração estrutural (continua
    envolvendo `DivinityListItemResponseDto[]`).

- Módulo (`DivinitiesModule`): `TypeOrmModule.forFeature([...])` passa a
  incluir `DivinityCategory` além de `Divinity`/`Tag`
  (`TypeOrmModule.forFeature([Divinity, DivinityCategory, Tag])`), mesmo
  padrão de `RacesModule`/`CreaturesModule`. A entidade nova já é
  auto-registrada via `autoLoadEntities: true`; nenhum passo manual adicional
  em `app.module.ts` além do já existente registro de `DivinitiesModule`.

- Service (`DivinitiesService`), pontos a replicar do padrão de
  `RacesService`:
  - Injetar também `Repository<DivinityCategory>`.
  - `findCategoryById(id)`, `findAllCategories()` (ordenado por `name` ASC).
  - `findById`/consultas de listagem passam a carregar `relations: {
    category: true, tags: true }`.
  - `create`: resolve `category` a partir de `categoryId` (404 pt-BR
    "Categoria não encontrada." se não existir), antes de persistir.
  - `findAllPaginated`: filtro adicional por `categoryId` (igualdade exata,
    `divinity.category = :categoryId`, mesmo padrão de
    `race.category = :categoryId` em `RacesService`); mantém o filtro por
    `name` (`ILIKE`) e a ordenação por `divinity.name` ASC já existentes.
  - `update`: resolve `category` apenas quando `dto.categoryId` é informado
    e diferente do atual (`dto.categoryId && dto.categoryId !==
    divinity.category.id`), 404 pt-BR se não existir — mesmo padrão de
    `RacesService.update`.

Status: concluído
Entidade: app-api/src/modules/divinities/entities/divinity-category.entity.ts (nova); app-api/src/modules/divinities/entities/divinity.entity.ts (alterada, campo `category` ManyToOne)
Migration: app-api/src/database/migrations/1784305540000-CreateDivinityCategoriesTable.ts; app-api/src/database/migrations/1784305550000-AddCategoryToDivinitiesTable.ts (backfill usa a categoria padrão "Divindade Maior", conforme decisão registrada pelo orquestrador)
Rotas: POST /divinities, GET /divinities, GET /divinities/categories, GET /divinities/:id, PUT /divinities/:id, DELETE /divinities/:id
Arquivos: app-api/src/modules/divinities/dto/divinity-category-response.dto.ts (novo); app-api/src/modules/divinities/dto/create-divinity.dto.ts; app-api/src/modules/divinities/dto/find-divinities-query.dto.ts; app-api/src/modules/divinities/dto/divinity-response.dto.ts; app-api/src/modules/divinities/dto/divinity-list-item-response.dto.ts; app-api/src/modules/divinities/divinities.service.ts; app-api/src/modules/divinities/divinities.controller.ts; app-api/src/modules/divinities/divinities.module.ts

### 2. api-dev-doc

Status: concluído

Documentação adicionada:
- Endpoint `GET /divinities/categories`: adicionado `@ApiOperation({ summary: 'Lista todas as categorias de divindades' })` + `@ApiOkResponse({ type: [DivinityCategoryResponseDto] })` (já implementado).
- Endpoint `POST /divinities`: `@ApiNotFoundResponse` atualizado para "Categoria não encontrada ou uma ou mais tags não encontradas" (alinhado com padrão de `RacesController.create`).
- Endpoint `PUT /divinities/:id`: `@ApiNotFoundResponse` atualizado para "Divindade, categoria ou uma ou mais tags não encontradas" (alinhado com padrão de `RacesController.update`).
- `CreateDivinityDto.categoryId`: `@ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID da categoria da divindade (obrigatório)' })` (já implementado).
- `FindDivinitiesQueryDto.categoryId`: `@ApiPropertyOptional({ description: 'Filtro por id da categoria (igualdade exata)', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })` (já implementado).
- `DivinityResponseDto.category` e `DivinityListItemResponseDto.category`: ambos com `@ApiProperty({ type: () => DivinityCategoryResponseDto, description: 'Categoria da divindade' })` (já implementado).
- `DivinityCategoryResponseDto.id` e `DivinityCategoryResponseDto.name`: ambos com `@ApiProperty` incluindo exemplos ("550e8400-e29b-41d4-a716-446655440000" para id, "Divindade Maior" para name) (já implementado).
- Ordem de rotas verificada: `GET /divinities/categories` declarado antes de `GET /divinities/:id` no controller, evitando captura incorreta pela rota dinâmica (confirmado).
- `DivinityListItemResponseDto`: documenta `category` tipado corretamente como `DivinityCategoryResponseDto` (confirmado).

### 3. api-dev-codereviewer
- Revisar tudo acima.
- Revisar a entidade `DivinityCategory`: mesmo formato de
  `RaceCategory`/`CreatureCategory` (`name` not null + índice único, sem
  `OneToMany` inverso, sem endpoints de escrita).
- Revisar a alteração em `Divinity`: `category` como `ManyToOne(() =>
  DivinityCategory, { nullable: false, onDelete: 'RESTRICT' })` com
  `@JoinColumn({ name: 'category_id' })`, exatamente no mesmo padrão de
  `Race.category`/`Creature.category`.
- Revisar as migrations: ordem de execução (`divinity_categories` → alteração
  de `divinities`, dependente da primeira via FK), seed dos 2 valores fixos
  exatos ("Divindade Maior", "Divindade Menor") no `up()` da migration de
  categorias, estratégia de backfill/`NOT NULL`/FK na migration que altera
  `divinities` (coluna adicionada nullable → backfill → `SET NOT NULL` → FK
  `ON DELETE RESTRICT`, nessa ordem, para não falhar em uma tabela já
  populada), `down()` revertendo tudo (FK, coluna, tabela/índice) na ordem
  inversa.
- Revisar DTOs e validações: `categoryId` obrigatório (`@IsUUID()`, sem
  `@IsOptional`) em `CreateDivinityDto`, opcional (via `PartialType`) em
  `UpdateDivinityDto`, validado contra existência real no service (404
  pt-BR) tanto em `create` quanto em `update` (só quando informado e
  diferente do atual), `categoryId` opcional em `FindDivinitiesQueryDto`
  (`@IsOptional @IsUUID`).
- Revisar o service: que `findAllPaginated` filtra corretamente por
  `categoryId` sem quebrar o filtro existente por `name`, que `findById` e
  a recarga da página completa incluem `relations: { category: true, tags:
  true }`, e que `update` não sobrescreve `category` quando `categoryId` não
  é informado no body.
- Revisar o controller: ordem das rotas (`GET /divinities/categories` antes
  de `GET /divinities/:id`), uso de `fromEntity` em
  `DivinityCategoryResponseDto`/`DivinityResponseDto`/
  `DivinityListItemResponseDto`.
- Confirmar mensagens de erro em pt-BR ("Categoria não encontrada." nos
  fluxos de criação/atualização), consistentes com as já usadas em
  `races`/`creatures`.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, `synchronize: false` com toda
  alteração de schema via migration, módulo com `TypeOrmModule.forFeature`
  incluindo a nova entidade).
- Conferir que a estratégia de backfill da migration 2 foi de fato definida
  com base no estado real dos dados (e não presumida arbitrariamente),
  conforme sinalizado na seção "Contexto" deste plano.

Status: concluído

## Revisão

Revisão completa de todos os artefatos das etapas "1. api-dev" e
"2. api-dev-doc", comparando linha a linha com o padrão de referência de
`races`/`creatures` (`RaceCategory`/`Race`, `RacesService`,
`RacesController`, DTOs de `races`).

- **Entidade `DivinityCategory`**
  (`app-api/src/modules/divinities/entities/divinity-category.entity.ts`) —
  idêntica a `RaceCategory`/`CreatureCategory`: estende `BaseEntity`, campo
  `name` com `@Column()` + `@Index({ unique: true })`, sem `OneToMany`
  inverso. OK.
- **`Divinity.category`**
  (`app-api/src/modules/divinities/entities/divinity.entity.ts:22-28`) —
  `@ApiProperty({ type: () => DivinityCategory })` + `@ManyToOne(() =>
  DivinityCategory, { nullable: false, onDelete: 'RESTRICT' })` +
  `@JoinColumn({ name: 'category_id' })`, mesma ordem de decorators e mesmas
  opções de `Race.category`. OK.
- **Migrations**
  (`app-api/src/database/migrations/1784305540000-CreateDivinityCategoriesTable.ts`
  e
  `app-api/src/database/migrations/1784305550000-AddCategoryToDivinitiesTable.ts`)
  — timestamps posteriores à última migration existente
  (`1784305530000-CreateLocationSectionsTable.ts`) e em ordem correta entre
  si (categorias antes da alteração em `divinities`, que depende da FK).
  Migration 1 cria a tabela com o mesmo DDL/nomenclatura de
  `CreateRaceCategoriesTable` (`PK_divinity_categories_id`,
  `IDX_divinity_categories_name`) e insere no `up()` exatamente os 2 valores
  pedidos ("Divindade Maior", "Divindade Menor"); `down()` derruba índice e
  tabela, mesmo padrão de referência. Migration 2 segue a sequência exigida
  — adiciona `category_id` nullable, faz backfill condicional
  (`WHERE "category_id" IS NULL`, portanto no-op seguro em tabela vazia),
  aplica `SET NOT NULL` e só então cria a FK `FK_divinities_category_id`
  com `ON DELETE RESTRICT ON UPDATE NO ACTION` (mesmo padrão de
  `FK_races_category_id`); `down()` remove FK e coluna, na ordem inversa.
  Nenhum problema técnico encontrado nas migrations.
- **Backfill "Divindade Maior" (ponto de atenção, não bloqueante)** — a
  migration em si é segura (o `UPDATE` é condicionado a
  `category_id IS NULL`, e a tabela `divinities` foi criada sem nenhum
  `INSERT` de seed em `1784305510000-CreateDivinitiesTable.ts`, ou seja, no
  ambiente de referência deste repositório ela está vazia e o backfill é
  no-op). Porém o registro de conclusão da etapa 1 (linha "Migration:" da
  seção "1. api-dev") atribui a escolha da categoria padrão a uma "decisão
  registrada pelo orquestrador", e não a uma verificação direta do estado
  real dos dados em ambiente de destino (ex.: consulta ao banco de
  homologação/produção), como pedia explicitamente a seção "Contexto" do
  plano ("o api-dev deve verificar o estado real dos dados antes de decidir
  a estratégia... e não presumir silenciosamente uma das duas opções").
  Não há evidência documentada dessa verificação além da citação da decisão
  do orquestrador.
  - Sugestão: antes de aplicar a migration em qualquer ambiente com dados
    reais de `divinities`, confirmar explicitamente (via consulta ao banco
    daquele ambiente) se há linhas existentes e, em caso positivo, validar
    com quem decidiu o requisito se "Divindade Maior" é de fato a categoria
    correta para essas divindades pré-existentes — documentando essa
    verificação no `task-api.md`, e não apenas a decisão final.
- **DTOs** — `CreateDivinityDto.categoryId` é `@IsUUID()` obrigatório (sem
  `@IsOptional`), posicionado logo após `name`, igual a
  `CreateRaceDto.categoryId`. `UpdateDivinityDto` continua
  `PartialType(CreateDivinityDto)`. `FindDivinitiesQueryDto.categoryId` é
  `@IsOptional() @IsUUID()`. `DivinityCategoryResponseDto` tem `{ id, name }`
  + `fromEntity` idêntico a `RaceCategoryResponseDto`.
  `DivinityResponseDto`/`DivinityListItemResponseDto` incluem `category:
  DivinityCategoryResponseDto` com `fromEntity` populando via
  `DivinityCategoryResponseDto.fromEntity(divinity.category)`, sem vazar
  campos internos da categoria. OK.
- **Service** (`app-api/src/modules/divinities/divinities.service.ts`) —
  `findCategoryById`/`findAllCategories` (ordenado por `name` ASC) presentes;
  `findById` e a recarga em `update` usam `relations: { category: true, tags:
  true }`; `create` resolve `category` via `categoryId` com 404 pt-BR
  "Categoria não encontrada." antes de persistir; `findAllPaginated` filtra
  por `divinity.category = :categoryId` sem quebrar o filtro `ILIKE` por
  `name`, mesma estrutura de `RacesService.findAllPaginated`; `update` só
  reatribui `category` quando `dto.categoryId` é informado e diferente do
  atual (`dto.categoryId && dto.categoryId !== divinity.category.id`),
  preservando a categoria existente quando `categoryId` não vem no body. OK,
  espelha `RacesService` ponto a ponto.
- **Controller**
  (`app-api/src/modules/divinities/divinities.controller.ts`) — `GET
  /divinities/categories` declarado antes de `GET /divinities/:id` (linhas
  83 e 93), evitando a captura pela rota dinâmica; `POST`/`PUT` retornam 404
  pt-BR consistente ("Categoria não encontrada ou uma ou mais tags não
  encontradas" / "Divindade, categoria ou uma ou mais tags não
  encontradas"); todos os endpoints usam `fromEntity` nos DTOs de resposta.
  OK.
- **Módulo** (`app-api/src/modules/divinities/divinities.module.ts`) —
  `TypeOrmModule.forFeature([Divinity, DivinityCategory, Tag])`, mesmo
  padrão de `RacesModule`. `DivinityCategory` não precisou de registro
  manual em `app.module.ts` (`autoLoadEntities: true`). OK.
- **Mensagens de erro pt-BR** — "Categoria não encontrada.", "Divindade não
  encontrada.", "Já existe uma divindade com este nome.", "Uma ou mais tags
  não foram encontradas." — todas consistentes com as usadas em
  `races`/`creatures`.
- **Aderência ao `CLAUDE.md`** — `BaseEntity`, `autoLoadEntities`,
  convenção `fromEntity`, `synchronize: false` com toda alteração de schema
  via migration (`data-source.ts` mantém `synchronize: false`), módulo com
  `TypeOrmModule.forFeature` incluindo a nova entidade, `JwtAuthGuard` no
  controller, paginação `{ data, total, page, perPage }` →
  `PaginatedDivinitiesResponseDto` com `totalPages` — todos os pontos
  confirmados sem divergência.

Nenhum erro de código, de tipagem, de nomenclatura ou de segurança foi
encontrado. O único achado é o ponto de atenção sobre a documentação da
verificação do estado real dos dados para a estratégia de backfill,
registrado acima como não bloqueante (a migration em si é segura e
idempotente mesmo sem essa verificação prévia).

Arquivos revisados:
`app-api/src/modules/divinities/entities/divinity-category.entity.ts`,
`app-api/src/modules/divinities/entities/divinity.entity.ts`,
`app-api/src/database/migrations/1784305540000-CreateDivinityCategoriesTable.ts`,
`app-api/src/database/migrations/1784305550000-AddCategoryToDivinitiesTable.ts`,
`app-api/src/modules/divinities/dto/divinity-category-response.dto.ts`,
`app-api/src/modules/divinities/dto/create-divinity.dto.ts`,
`app-api/src/modules/divinities/dto/update-divinity.dto.ts`,
`app-api/src/modules/divinities/dto/find-divinities-query.dto.ts`,
`app-api/src/modules/divinities/dto/divinity-response.dto.ts`,
`app-api/src/modules/divinities/dto/divinity-list-item-response.dto.ts`,
`app-api/src/modules/divinities/dto/paginated-divinities-response.dto.ts`,
`app-api/src/modules/divinities/divinities.service.ts`,
`app-api/src/modules/divinities/divinities.controller.ts`,
`app-api/src/modules/divinities/divinities.module.ts`.
