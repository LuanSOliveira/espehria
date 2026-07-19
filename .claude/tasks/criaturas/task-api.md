# Task API: Criaturas

## Contexto
Ver .claude/tasks/criaturas/spec.md — seção "Escopo confirmado" (blocos "Backend —
modelo de dados" e "Backend — API").

## Etapas

### 1. api-dev
Status: concluído
Depende de: nada (etapa inicial)

#### Entidade

**`Creature`** (tabela `creatures`), estendendo `BaseEntity` (herda `id` uuid,
`createdAt`, `updatedAt`). Todos os nomes de colunas/propriedades em inglês
(mesma convenção do módulo `users`); apenas mensagens de erro/validação ficam
em pt-BR:

- `name` (varchar) — "Nome" — obrigatório, único. Aplicar índice único (mesmo
  padrão de `email` em `User`, `@Index({ unique: true })`).
- `category` — relação `ManyToOne` para `CreatureCategory` (coluna
  `category_id`, obrigatória, NOT NULL). Sugerido `onDelete: 'RESTRICT'`, já
  que as categorias são um conjunto fixo populado por seed e não devem ser
  removidas com criaturas vinculadas.
- `referenceImageUrl` (varchar, nullable) — "Imagem Referência" — opcional;
  quando preenchido deve ser uma URL válida (`@IsUrl` no DTO, mensagem pt-BR;
  validação não fica na entidade).
- `otherNames` (varchar, nullable) — "Outros nomes" — opcional.
- `threatLevel` (varchar, nullable) — "Nível de Ameaça" — opcional.
- `averageLifeExpectancy` (varchar, nullable) — "Expectativa de vida média" —
  opcional.

**Campos de texto rico** (armazenados como string HTML em colunas `text`,
nullable), lista canônica e definitiva (nome técnico → rótulo pt-BR):

  1. `physicalCharacteristics` → "Características Físicas" — **obrigatório**
     (não vazio); único campo de texto rico obrigatório.
  2. `habitat` → "Habitat" — opcional
  3. `behavior` → "Comportamento" — opcional
  4. `diet` → "Alimentação" — opcional
  5. `lifeCycle` → "Ciclo de Vida" — opcional
  6. `lifeStageInfant` → "Estágio de Vida - Filhote" — opcional
  7. `lifeStageYoung` → "Estágio de Vida - Jovem" — opcional
  8. `lifeStageAdult` → "Estágio de Vida - Adulto" — opcional
  9. `lifeStageElder` → "Estágio de Vida - Ancião" — opcional
  10. `abilitiesAndPowers` → "Habilidades e Poderes" — opcional
  11. `resistances` → "Resistências" — opcional
  12. `weaknesses` → "Fraquezas" — opcional
  13. `combat` → "Combate" — opcional
  14. `attackMethods` → "Métodos de Ataque" — opcional
  15. `strategy` → "Estratégia" — opcional
  16. `dangerDegree` → "Grau de Perigo" — opcional
  17. `obtainedResources` → "Recursos Obtidos" — opcional
  18. `commercialValue` → "Valor Comercial" — opcional
  19. `relationWithCivilizations` → "Relação com Civilizações" — opcional
  20. `mythologyAndFolklore` → "Mitologia e Folclore" — opcional
  21. `encounterRecord` → "Registro de Encontro" — opcional
  22. `scholarsCuriosity` → "Curiosidade dos Estudiosos" — opcional

  Todas as colunas de texto rico ficam `nullable: true` na entidade (inclusive
  `physicalCharacteristics` — a obrigatoriedade desse campo é imposta na
  validação do `CreateCreatureDto`, não como `NOT NULL` de schema).

**`CreatureCategory`** (tabela `creature_categories`), estendendo `BaseEntity`:
- `name` (string) — obrigatório, único. Os 4 valores fixos (Animal, Monstro,
  Espírito, Construto) são populados via seed em migration, não cadastrados
  pelo usuário final (não expor endpoint de criação/edição/exclusão para essa
  entidade).
- Relacionamento inverso `OneToMany` para `Creature` é opcional — só declarar se
  for necessário para alguma query; não é exigido pelo escopo.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa de
  migration em `src/database/migrations/`).
- Migration 1 — `CreateCreatureCategoriesTable`: cria a tabela
  `creature_categories` (`id` uuid PK default `gen_random_uuid()`,
  `created_at`, `updated_at`, `name` varchar not null, índice único em `name`)
  e insere no próprio `up()` os 4 valores fixos (Animal, Monstro, Espírito,
  Construto) via `INSERT`. O `down()` deve remover os registros do seed (ou
  simplesmente dropar a tabela) e desfazer os índices, seguindo o padrão de
  `1784305251976-CreateUsersTable.ts`.
- Migration 2 — `CreateCreaturesTable`: cria a tabela `creatures` com:
  - `id`, `created_at`, `updated_at` (padrão `BaseEntity`);
  - `name` varchar not null + índice único;
  - `category_id` uuid not null com FK para `creature_categories(id)` —
    `ON DELETE RESTRICT`;
  - `reference_image_url` varchar nullable;
  - `other_names` varchar nullable;
  - `threat_level` varchar nullable;
  - `average_life_expectancy` varchar nullable;
  - uma coluna `text` nullable para cada um dos 22 campos de texto rico da
    lista canônica acima (`physical_characteristics`, `habitat`, `behavior`,
    `diet`, `life_cycle`, `life_stage_infant`, `life_stage_young`,
    `life_stage_adult`, `life_stage_elder`, `abilities_and_powers`,
    `resistances`, `weaknesses`, `combat`, `attack_methods`, `strategy`,
    `danger_degree`, `obtained_resources`, `commercial_value`,
    `relation_with_civilizations`, `mythology_and_folklore`,
    `encounter_record`, `scholars_curiosity`) — todas nullable no schema,
    inclusive `physical_characteristics` (obrigatoriedade é regra de DTO, não
    de schema.
  Deve ter timestamp/nome posterior à migration de categorias, já que depende
  da tabela `creature_categories` existir (FK).
- Gerar ambas via `npm run migration:generate` a partir das entidades já
  criadas e revisar o SQL resultante; o `INSERT` do seed precisa ser adicionado
  manualmente no `up()` da migration de categorias, pois `migration:generate`
  não gera dados, apenas schema.

#### Controller

- Novo módulo `CreaturesModule` (`src/modules/creatures/`), com
  `CreaturesController`, `CreaturesService`, `TypeOrmModule.forFeature([Creature, CreatureCategory])`.
  Entidades ficam auto-registradas via `autoLoadEntities: true`, sem passo
  manual adicional em `app.module.ts`.
- Protegido por `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, mesmo padrão de
  `UsersController`.
- Endpoints:
  - `POST /creatures` — cria criatura. Valida nome único (409 pt-BR se
    duplicado, mesmo padrão de `ConflictException` usado para e-mail em
    `UsersService`) e `categoryId` existente (404/400 pt-BR se categoria
    inválida).
  - `GET /creatures` — lista paginada. Query DTO com `name` (opcional, busca
    parcial `ILIKE`), `categoryId` (opcional, igualdade exata), `page`,
    `perPage` (defaults `DEFAULT_PAGE`/`DEFAULT_PER_PAGE` de
    `common/variables/pagination.ts`). Ordenação padrão: `orderBy('creature.name', 'ASC')`.
    Retorna `PaginatedCreaturesResponseDto` composto por
    `CreatureListItemResponseDto` (enxuto).
  - `GET /creatures/categories` — lista as `CreatureCategory` disponíveis (sem
    paginação), ordenadas por `name` ASC. Retorna `CreatureCategoryResponseDto[]`.
    Importante: declarar este método **antes** de `GET /creatures/:id` na
    classe do controller, para que a rota estática não seja capturada pelo
    parâmetro dinâmico `:id`.
  - `GET /creatures/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
    encontrado. Retorna `CreatureResponseDto` completo (todos os campos +
    categoria aninhada).
  - `PUT /creatures/:id` — atualiza criatura (mesmas validações de nome único
    ao trocar o nome, e `categoryId` válido quando informado). Retorna
    `CreatureResponseDto`.
  - `DELETE /creatures/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrado (mesmo padrão de `remove` em `UsersController`).
- DTOs:
  - `CreateCreatureDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
    - `categoryId` (`@IsUUID`, obrigatório);
    - `referenceImageUrl` (`@IsOptional`, `@IsUrl`, mensagem de erro pt-BR
      customizada);
    - `otherNames`, `threatLevel`, `averageLifeExpectancy` (`@IsOptional`,
      `@IsString`);
    - `physicalCharacteristics` (`@IsString`, `@IsNotEmpty` — único campo de
      texto rico obrigatório);
    - os demais 21 campos de texto rico da lista canônica (`habitat`,
      `behavior`, `diet`, `lifeCycle`, `lifeStageInfant`, `lifeStageYoung`,
      `lifeStageAdult`, `lifeStageElder`, `abilitiesAndPowers`, `resistances`,
      `weaknesses`, `combat`, `attackMethods`, `strategy`, `dangerDegree`,
      `obtainedResources`, `commercialValue`, `relationWithCivilizations`,
      `mythologyAndFolklore`, `encounterRecord`, `scholarsCuriosity`) — todos
      `@IsOptional` + `@IsString`.
  - `UpdateCreatureDto` — `PartialType(CreateCreatureDto)`, mesmo padrão de
    `UpdateUserDto`.
  - `FindCreaturesQueryDto` — `name?` (`@IsOptional @IsString`), `categoryId?`
    (`@IsOptional @IsUUID`), `page?`, `perPage?` (mesmo padrão de
    `FindUsersQueryDto`).
  - `CreatureResponseDto` — todos os campos da entidade: `id`, `name`,
    `referenceImageUrl`, `otherNames`, `threatLevel`,
    `averageLifeExpectancy`, os 22 campos de texto rico da lista canônica,
    `category` (objeto aninhado `{ id, name }`), `createdAt`, `updatedAt`;
    com `static fromEntity(creature): CreatureResponseDto`.
  - `CreatureListItemResponseDto` — enxuto: `id`, `referenceImageUrl`, `name`,
    `category` (mesmo formato aninhado); com `static fromEntity(creature)`.
  - `PaginatedCreaturesResponseDto` — `data: CreatureListItemResponseDto[]`,
    `total`, `page`, `perPage`, `totalPages` (mesmo padrão de
    `PaginatedUsersResponseDto`).
  - `CreatureCategoryResponseDto` — `id`, `name`; com
    `static fromEntity(category)`.

Status: concluído
Entidade: app-api/src/modules/creatures/entities/creature.entity.ts (e
app-api/src/modules/creatures/entities/creature-category.entity.ts)
Migration: app-api/src/database/migrations/1784305350000-CreateCreatureCategoriesTable.ts,
app-api/src/database/migrations/1784305360000-CreateCreaturesTable.ts
Rotas: POST /creatures, GET /creatures, GET /creatures/categories,
GET /creatures/:id, PUT /creatures/:id, DELETE /creatures/:id
Arquivos: app-api/src/modules/creatures/dto/create-creature.dto.ts,
app-api/src/modules/creatures/dto/update-creature.dto.ts,
app-api/src/modules/creatures/dto/find-creatures-query.dto.ts,
app-api/src/modules/creatures/dto/creature-response.dto.ts,
app-api/src/modules/creatures/dto/creature-list-item-response.dto.ts,
app-api/src/modules/creatures/dto/paginated-creatures-response.dto.ts,
app-api/src/modules/creatures/dto/creature-category-response.dto.ts,
app-api/src/modules/creatures/creatures.service.ts,
app-api/src/modules/creatures/creatures.controller.ts,
app-api/src/modules/creatures/creatures.module.ts,
app-api/src/app.module.ts (registro de CreaturesModule)

### 2. api-dev-doc
Status: concluído
Depende da etapa 1 (api-dev)

- Revisar/complementar a documentação Swagger de todos os endpoints novos:
  `@ApiTags('creatures')` no controller, `@ApiOperation({ summary })` em
  pt-BR para cada rota (create, list, get by id, update, delete, listar
  categorias).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, com mensagem pt-BR de exemplo),
  `@ApiNotFoundResponse` (404, criatura/categoria não encontrada),
  `@ApiBadRequestResponse` (validação — URL inválida em
  `referenceImageUrl`, `categoryId` inexistente ou mal formatado).
- Conferir que todos os campos de `CreateCreatureDto`/`UpdateCreatureDto`/
  `CreatureResponseDto`/`CreatureListItemResponseDto`/`CreatureCategoryResponseDto`
  possuem `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes,
  incluindo os 22 campos de texto rico da lista canônica definitiva (item
  "Entidade" da etapa 1) — a lista de campos está fechada, não há mais
  pendência a aguardar.
- Validar no `/docs` que o endpoint `GET /creatures/categories` aparece
  corretamente documentado e não é ofuscado pela rota `GET /creatures/:id`.

### 3. api-dev-codereviewer
Status: concluído
Depende das etapas 1 e 2

- Revisar entidades `Creature` e `CreatureCategory` (tipos, nullability,
  relacionamento `ManyToOne`/`onDelete`, índice único em `name` de ambas) e
  confirmar que os 22 campos de texto rico da lista canônica constam todos na
  entidade, com os nomes exatos definidos na etapa 1 (lista fechada, sem
  pendência).
- Revisar as migrations: ordem de execução (categorias antes de criaturas),
  seed dos 4 valores fixos no `up()`, FK correta, coluna `text` nullable para
  cada um dos 22 campos de texto rico, `down()` revertendo tudo (índices, FK,
  tabelas, dados do seed).
- Revisar DTOs e validações: unicidade de nome (409 pt-BR), `@IsUrl`
  condicional em `referenceImageUrl`, `categoryId` validado,
  `physicalCharacteristics` obrigatório (`@IsString` + `@IsNotEmpty`) e os
  demais 21 campos de texto rico opcionais (`@IsString` + `@IsOptional`).
- Revisar o controller: guards (`JwtAuthGuard`/`ApiBearerAuth`), ordem das
  rotas (`/creatures/categories` antes de `/creatures/:id`), paginação e
  filtros (`name` parcial, `categoryId` exato), ordenação padrão por `name`
  ASC, uso de `fromEntity` nos DTOs de resposta.
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome
  duplicado, não encontrado, URL inválida, categoria inválida), enquanto
  nomes de entidade/colunas/DTOs/JSON permanecem em inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo).

## Revisão

Escopo revisado: `app-api/src/modules/creatures/entities/creature.entity.ts`,
`app-api/src/modules/creatures/entities/creature-category.entity.ts`,
`app-api/src/database/migrations/1784305350000-CreateCreatureCategoriesTable.ts`,
`app-api/src/database/migrations/1784305360000-CreateCreaturesTable.ts`,
`app-api/src/modules/creatures/dto/create-creature.dto.ts`,
`app-api/src/modules/creatures/dto/update-creature.dto.ts`,
`app-api/src/modules/creatures/dto/find-creatures-query.dto.ts`,
`app-api/src/modules/creatures/dto/creature-response.dto.ts`,
`app-api/src/modules/creatures/dto/creature-list-item-response.dto.ts`,
`app-api/src/modules/creatures/dto/paginated-creatures-response.dto.ts`,
`app-api/src/modules/creatures/dto/creature-category-response.dto.ts`,
`app-api/src/modules/creatures/creatures.service.ts`,
`app-api/src/modules/creatures/creatures.controller.ts`,
`app-api/src/modules/creatures/creatures.module.ts`,
`app-api/src/app.module.ts`.

Confirmado que estão corretos e de acordo com o `CLAUDE.md`/plano da task:
entidade `Creature` com os 22 campos de texto rico (nomes e ordem exatamente
conforme a lista canônica), `category` `ManyToOne` `nullable: false` +
`onDelete: 'RESTRICT'`; índice único em `name` em `Creature` e
`CreatureCategory`; migrations com colunas/tipos/nullability/FK batendo 1:1
com as entidades (inclusive `ON DELETE RESTRICT` e o seed dos 4 valores fixos
no `up()` da migration de categorias, revertido no `down()`); ordem de rotas
`GET /creatures/categories` antes de `GET /creatures/:id`; filtro `name` via
`ILIKE` parcial e `categoryId` por igualdade exata; `orderBy('creature.name',
'ASC')`; paginação `{ data, total, page, perPage }` → `totalPages` calculado
no controller; uso de `fromEntity` em todos os DTOs de resposta; guards
`JwtAuthGuard`/`@ApiBearerAuth()` no controller; unicidade de nome com
`ConflictException` 409 pt-BR tanto em `create` quanto em `update`;
`physicalCharacteristics` obrigatório (`@IsString`/`@IsNotEmpty`) e os demais
21 campos de texto rico opcionais (`@IsOptional`/`@IsString`); `@IsUrl` com
mensagem pt-BR customizada em `referenceImageUrl`; `CreaturesModule`
registrado em `app.module.ts` sem passo manual de `autoLoadEntities`.

Problemas encontrados:

- **app-api/src/modules/creatures/creatures.controller.ts:44-52** (método
  `create`, `POST /creatures`) — o Swagger documenta apenas
  `@ApiBadRequestResponse` para o cenário de categoria inválida, mas
  `CreaturesService.create` lança `NotFoundException('Categoria não
  encontrada.')` (404) quando `categoryId` é um UUID bem formado que não
  existe — esse status não está documentado no endpoint, e a descrição do
  400 ("Categoria inválida ou ausente, URL de imagem inválida") mistura o
  caso real de 400 (formato de UUID inválido/ausente) com o caso real de 404
  (categoria inexistente). O mesmo ocorre em `update`
  (`creatures.controller.ts:100-112`): há `@ApiNotFoundResponse({
  description: 'Criatura não encontrada' })`, mas a mensagem não cobre o
  caso de `categoryId` inexistente, que também lança 404 a partir de
  `CreaturesService.update`.
  - Trecho: `@ApiBadRequestResponse({ description: 'Categoria inválida ou ausente, URL de imagem inválida' })` (sem `@ApiNotFoundResponse` correspondente) em `create`; em `CreaturesService`: `throw new NotFoundException('Categoria não encontrada.')`.
  - Sugestão: adicionar `@ApiNotFoundResponse({ description: 'Categoria não encontrada' })` em `create`, e ajustar a descrição do `@ApiNotFoundResponse` de `update` para "Criatura ou categoria não encontrada"; restringir a descrição do `@ApiBadRequestResponse` aos casos reais de 400 (formato de `categoryId` inválido/ausente, URL de `referenceImageUrl` inválida).

- **app-api/src/modules/creatures/dto/create-creature.dto.ts,
  find-creatures-query.dto.ts, creature-response.dto.ts,
  creature-list-item-response.dto.ts, paginated-creatures-response.dto.ts,
  creature-category-response.dto.ts, creatures.controller.ts** — diversas
  linhas excedem o `printWidth` padrão do Prettier (80, conforme
  `app-api/.prettierrc`) por concentrar múltiplos decorators/opções em uma
  única linha, diferente do padrão observado em módulos existentes (ex.
  `users/dto/find-users-query.dto.ts`, `users.controller.ts`), que quebram
  `@ApiProperty`/`@ApiOperation` em múltiplas linhas.
  - Trecho: `@ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })` (create-creature.dto.ts:16), entre vários outros exemplos semelhantes.
  - Sugestão: rodar `npm run format` (dentro de `app-api/`) para alinhar a formatação com o restante do projeto antes do merge.

- **app-api/src/database/migrations/1784305350000-CreateCreatureCategoriesTable.ts**
  e **.../1784305360000-CreateCreaturesTable.ts** — os nomes de constraints e
  índices (`PK_creature_categories_id`, `IDX_creature_categories_name`,
  `PK_creatures_id`, `IDX_creatures_name`, `FK_creatures_category_id`) são
  legíveis/manuais, enquanto a migration de referência do projeto
  (`1784305251976-CreateUsersTable.ts`) usa nomes hash gerados
  automaticamente pelo TypeORM (ex. `PK_a3ffb1c0c8416b9fc6f907b7433`). Não é
  um bug — o SQL é funcionalmente correto e o `down()` reverte tudo
  corretamente — mas diverge do padrão observado nas migrations existentes
  e sugere que o SQL não é exatamente a saída de `npm run migration:generate`
  sem edição manual dos nomes dos constraints, como orientado na etapa 1.
  - Trecho: `CONSTRAINT "PK_creature_categories_id" PRIMARY KEY ("id")` / `CREATE UNIQUE INDEX "IDX_creature_categories_name" ...` vs. `CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")` em `CreateUsersTable`.
  - Sugestão: se não for uma decisão deliberada, considerar regerar via `npm run migration:generate` e manter os nomes hash automáticos para manter consistência com as demais migrations do projeto (ou, se os nomes legíveis forem a preferência do time, aplicar o mesmo padrão retroativamente nas migrations futuras para uniformidade).
