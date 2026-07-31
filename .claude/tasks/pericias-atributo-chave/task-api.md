# Task API: Atributo chave em Perícias

## Contexto
Ver .claude/tasks/pericias-atributo-chave/spec.md

## Etapas

### 1. api-dev

#### Entidade

**Nova entidade `Attribute` (módulo próprio `src/modules/attributes`)**
- Entidade: `Attribute`, tabela `attributes`, estende `BaseEntity` (`id`, `createdAt`,
  `updatedAt`).
- Campos: `name` (`string`, coluna `character varying`, `@Index({ unique: true })`,
  `@ApiProperty()`) — seguir exatamente o padrão de `RaceCategory`
  (`app-api/src/modules/races/entities/race-category.entity.ts`) e
  `CreatureCategory`, já que a entidade é genérica e não possui campos além do nome.
- Relacionamentos: nenhum na própria entidade (é o lado "um" da relação com `Skill`,
  e futuramente poderá ser referenciada por outras entidades).
- Módulo: criar `src/modules/attributes/attributes.module.ts` com
  `TypeOrmModule.forFeature([Attribute])`, `AttributesController`, `AttributesService`,
  exportando `AttributesService` (padrão análogo a `RacesModule`/`SkillsModule`).
  Registrar o novo módulo em `AppModule`.

**Alteração na entidade `Skill`** (`app-api/src/modules/skills/entities/skill.entity.ts`)
- Campo novo: `keyAttribute` — `@ManyToOne(() => Attribute, { nullable: false, onDelete:
  'RESTRICT' })` + `@JoinColumn({ name: 'key_attribute_id' })`, com `@ApiProperty({ type:
  () => Attribute })` — seguir exatamente o padrão de `Race.category`
  (`app-api/src/modules/races/entities/race.entity.ts`), incluindo `onDelete: 'RESTRICT'`.
- Relacionamentos: `Skill` N:1 `Attribute` (obrigatório).
- `SkillsModule` passa a importar também `Attribute` no `TypeOrmModule.forFeature([...])`
  (mesmo padrão de `RacesModule` importando `Tag` diretamente, sem depender do serviço
  do outro módulo) para permitir que `SkillsService` injete `Repository<Attribute>` e
  valide o `keyAttributeId` recebido (replicar exatamente o papel que
  `raceCategoriesRepository`/`findCategoryById` cumprem em `RacesService`).

**Ajustes de serviço/DTO decorrentes (mesma etapa, sem entidade nova)**
- `SkillsService.findById`/`findAllPaginated` passam a carregar a relação
  `keyAttribute: true` (`relations`) e o `create`/`update` passam a validar
  `keyAttributeId` via um `findKeyAttributeById` análogo a
  `RacesService.findCategoryById`, lançando `NotFoundException('Atributo chave não
  encontrado.')` quando o id não existir.
- `AttributesService`: apenas `findAll()` retornando todos os atributos ordenados por
  `name` ASC (`this.attributesRepository.find({ order: { name: 'ASC' } })`), mesmo
  padrão de `RacesService.findAllCategories`.

#### Migration

- Necessária: sim (três migrations, `synchronize: false`).
  1. **Criação da tabela `attributes`** — apenas estrutura (`id`, `created_at`,
     `updated_at`, `name` com índice único), sem dados — seguir a forma de
     `1784305350000-CreateCreatureCategoriesTable.ts`/
     `1784305430000-CreateRaceCategoriesTable.ts`, mas sem o `INSERT` embutido (o seed
     vai em migration separada, conforme decidido no spec).
  2. **Seed dos valores fixos** — migration de dados dedicada, inserindo (`INSERT INTO
     "attributes" ("name") VALUES ('Força'), ('Destreza'), ('Constituição'),
     ('Inteligência'), ('Sabedoria'), ('Carisma')`), com `down` fazendo o `DELETE`
     correspondente — seguir exatamente o padrão de
     `1784305390000-AddElementalCreatureCategory.ts` (migration de dados isolada,
     citada explicitamente no spec como precedente).
  3. **Coluna `key_attribute_id` em `skills`** — `ALTER TABLE "skills" ADD
     "key_attribute_id" uuid`, seguido de `ALTER COLUMN ... SET NOT NULL` e `ADD
     CONSTRAINT ... FOREIGN KEY ("key_attribute_id") REFERENCES "attributes"("id") ON
     DELETE RESTRICT`, seguindo a estrutura de
     `1784305550000-AddCategoryToDivinitiesTable.ts`.

  **Ponto em aberto (lacuna de requisito, não de arquitetura):** a migration de
  `AddCategoryToDivinitiesTable` (precedente estrutural para este caso) faz um
  `UPDATE` de backfill para um valor-padrão específico (`'Divindade Maior'`) antes de
  aplicar `SET NOT NULL`, pois a tabela `divinities` já podia conter registros. O
  spec não define qual atributo (dentre os seis) deve ser usado como valor de
  backfill para perícias já cadastradas antes desta migration (se houver). Este
  ponto precisa ser esclarecido antes ou durante a implementação — não deve ser
  assumido pelo `api-dev` por conta própria.

#### Controller

**Novo controller `AttributesController`** (`GET /attributes`)
- Endpoints: `GET /attributes` — lista simples e não paginada de todos os atributos
  (sem filtro, sem paginação), retornando `AttributeResponseDto[]` — mesmo formato e
  papel de `GET /races/categories`
  (`app-api/src/modules/races/races.controller.ts`), mas em módulo/rota própria e
  independente (não aninhada sob `/skills`), conforme decidido no spec.
- Sem `POST`/`PUT`/`DELETE` — os valores são fixos via seed, sem CRUD de atributos.
- DTOs: `AttributeResponseDto` (`id`, `name`, `static fromEntity(entity)`) — mesmo
  formato de `RaceCategoryResponseDto`.
- Acesso Google: `read-only` (padrão) — consistente com o restante da API; como o
  controller só expõe `GET`, o nível `read-only` não restringe nenhuma operação
  disponível.

**Alterações no controller/DTOs de `Skills`** (sem novo endpoint, mesmos
`GET/POST/PUT/DELETE /skills` já existentes)
- `CreateSkillDto`/`UpdateSkillDto`: novo campo obrigatório `keyAttributeId`
  (`@IsUUID()`, sem `@IsOptional()` no `CreateSkillDto`; `UpdateSkillDto` continua
  `PartialType`, tornando-o opcional apenas na atualização parcial) — mesmo padrão de
  `categoryId` em `CreateRaceDto`/`UpdateRaceDto`.
- `FindSkillsQueryDto`: novo campo opcional `keyAttributeId` (`@IsOptional()
  @IsUUID()`), com filtro por igualdade exata (`queryBuilder.andWhere('skill.keyAttribute
  = :keyAttributeId', ...)`) — mesmo padrão de `categoryId` em `FindRacesQueryDto`/
  `RacesService.findAllPaginated`.
- `SkillResponseDto` e `SkillListItemResponseDto`: novo campo `keyAttribute:
  AttributeResponseDto` (`@ApiProperty({ type: () => AttributeResponseDto })`),
  populado via `AttributeResponseDto.fromEntity(skill.keyAttribute)` em ambos os
  `fromEntity` — exibição tanto no detalhe quanto no item de listagem, conforme
  spec.
- Mensagens de erro (pt-BR) a atualizar/criar nos `@ApiNotFoundResponse` e nas
  exceptions do `SkillsService`: "Atributo chave não encontrado." quando
  `keyAttributeId` não existir (`create`/`update`), análogo a "Categoria não
  encontrada." em Raças.
- Acesso Google: `read-only` (padrão, sem alteração) — `SkillsController` já usa
  `@GoogleAccess('read-only')`, mantém-se inalterado.

Status: concluído
Entidade: app-api/src/modules/attributes/entities/attribute.entity.ts (nova); app-api/src/modules/skills/entities/skill.entity.ts (campo `keyAttribute` adicionado)
Migration: app-api/src/database/migrations/1784306030000-CreateAttributesTable.ts; app-api/src/database/migrations/1784306040000-SeedAttributesTable.ts; app-api/src/database/migrations/1784306050000-AddKeyAttributeToSkillsTable.ts
Rotas: GET /attributes, POST /skills, GET /skills, GET /skills/:id, PUT /skills/:id, DELETE /skills/:id (rotas de skills inalteradas na assinatura, apenas DTOs/regras de negócio atualizadas)
Arquivos: app-api/src/modules/attributes/attributes.module.ts; app-api/src/modules/attributes/attributes.controller.ts; app-api/src/modules/attributes/attributes.service.ts; app-api/src/modules/attributes/dto/attribute-response.dto.ts; app-api/src/app.module.ts (registro de AttributesModule); app-api/src/modules/skills/skills.module.ts; app-api/src/modules/skills/skills.service.ts; app-api/src/modules/skills/dto/create-skill.dto.ts; app-api/src/modules/skills/dto/find-skills-query.dto.ts; app-api/src/modules/skills/dto/skill-response.dto.ts; app-api/src/modules/skills/dto/skill-list-item-response.dto.ts

Observação: o backfill de `key_attribute_id` em `skills` (migration
`1784306050000-AddKeyAttributeToSkillsTable.ts`) usa o atributo "Força" como
valor padrão, conforme decisão registrada pelo orquestrador para o "Ponto em
aberto" originalmente descrito nesta seção.

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir no Swagger: tag própria `attributes` para o novo `AttributesController`
  (`@ApiTags('attributes')`, `@ApiBearerAuth()`, `@ApiOperation({ summary: 'Lista
  todos os atributos' })`, `@ApiOkResponse({ type: [AttributeResponseDto] })`);
  atualizar os `@ApiProperty`/`@ApiPropertyOptional` de `Skill`,
  `CreateSkillDto`/`UpdateSkillDto`, `FindSkillsQueryDto`, `SkillResponseDto` e
  `SkillListItemResponseDto` para refletir o novo campo `keyAttribute`/
  `keyAttributeId` (incluindo `example`/`description` em português); revisar os
  `@ApiNotFoundResponse`/`@ApiBadRequestResponse` dos endpoints de `skills`
  (`create`, `findAll`, `update`) para mencionar o atributo chave.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Etapas 1 (api-dev) e 2 (api-dev-doc) estavam marcadas como "Status: concluído" e
foram revisadas como trabalho pronto.

Arquivos revisados:
- `app-api/src/modules/attributes/entities/attribute.entity.ts`
- `app-api/src/modules/attributes/attributes.module.ts`
- `app-api/src/modules/attributes/attributes.controller.ts`
- `app-api/src/modules/attributes/attributes.service.ts`
- `app-api/src/modules/attributes/dto/attribute-response.dto.ts`
- `app-api/src/app.module.ts`
- `app-api/src/modules/skills/entities/skill.entity.ts`
- `app-api/src/modules/skills/skills.module.ts`
- `app-api/src/modules/skills/skills.service.ts`
- `app-api/src/modules/skills/skills.controller.ts`
- `app-api/src/modules/skills/dto/create-skill.dto.ts`
- `app-api/src/modules/skills/dto/update-skill.dto.ts`
- `app-api/src/modules/skills/dto/find-skills-query.dto.ts`
- `app-api/src/modules/skills/dto/skill-response.dto.ts`
- `app-api/src/modules/skills/dto/skill-list-item-response.dto.ts`
- `app-api/src/modules/skills/dto/paginated-skills-response.dto.ts`
- `app-api/src/database/migrations/1784306030000-CreateAttributesTable.ts`
- `app-api/src/database/migrations/1784306040000-SeedAttributesTable.ts`
- `app-api/src/database/migrations/1784306050000-AddKeyAttributeToSkillsTable.ts`

Pontos verificados com atenção (conforme pedido): consistência entre as três
migrations e a entidade, segurança/idempotência do backfill de `key_attribute_id`
em `skills`, e corretude dos `down()`.

- **Consistência migration ↔ entidade**: `attributes` (tabela) reflete exatamente
  `Attribute` (`id`/`created_at`/`updated_at` herdados de `BaseEntity`, `name`
  `character varying NOT NULL` com índice único), seguindo byte a byte o padrão de
  `1784305350000-CreateCreatureCategoriesTable.ts`/
  `1784305430000-CreateRaceCategoriesTable.ts`. A coluna `key_attribute_id` em
  `skills` (uuid, `NOT NULL`, FK `ON DELETE RESTRICT`) corresponde exatamente ao
  `@ManyToOne(() => Attribute, { nullable: false, onDelete: 'RESTRICT' })` +
  `@JoinColumn({ name: 'key_attribute_id' })` de `Skill.keyAttribute`.
- **Backfill (`1784306050000-AddKeyAttributeToSkillsTable.ts`)**: o `UPDATE`
  usa "Força" como valor padrão para linhas pré-existentes antes do `SET NOT
  NULL`, exatamente no mesmo formato de `1784305550000-AddCategoryToDivinitiesTable.ts`
  (precedente estrutural indicado na task), e depende apenas da migration de seed
  (`1784306040000-SeedAttributesTable.ts`) já ter rodado antes — o que é garantido
  pela ordem crescente dos timestamps (`...030000` < `...040000` < `...050000`) e
  pela execução sequencial das migrations do TypeORM. A cláusula `WHERE
  "key_attribute_id" IS NULL` é redundante (a coluna acabou de ser criada, então
  todas as linhas já estão `NULL`), mas é inofensiva e seguida como defesa extra —
  não é um problema.
- **`down()` das três migrations**: cada uma reverte exatamente o que o `up()`
  fez, na ordem correta para reversão em cadeia (a migration 3 remove a FK/coluna
  antes que a migration 2, ao ser revertida em seguida, apague as linhas de seed —
  o que só funciona corretamente se as migrations forem revertidas na ordem
  inversa padrão do TypeORM, que é o comportamento esperado). Nenhuma
  inconsistência encontrada.
- **Nomenclatura de constraints/índices** (`PK_attributes_id`,
  `IDX_attributes_name`, `FK_skills_key_attribute_id`) segue o padrão dos demais
  módulos (`PK_creature_categories_id`, `IDX_creature_categories_name`,
  `FK_divinities_category_id`).
- **Módulos, serviço e DTOs**: `AttributesModule`/`AttributesController`/
  `AttributesService`/`AttributeResponseDto` replicam fielmente
  `RaceCategory`/`GET /races/categories`; `SkillsModule` importa `Attribute`
  diretamente (mesmo padrão de `Tag` em `RacesModule`), `SkillsService` injeta
  `Repository<Attribute>` e usa `findKeyAttributeById` para validar
  `keyAttributeId` em `create`/`update`, lançando `NotFoundException('Atributo
  chave não encontrado.')` (pt-BR, análogo a "Categoria não encontrada."). DTOs de
  resposta (`SkillResponseDto`, `SkillListItemResponseDto`) usam
  `AttributeResponseDto.fromEntity` e não vazam campos internos.
- **Segurança/Acesso Google**: `AttributesController` usa
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`,
  adequado por só expor `GET`; `SkillsController` mantém o mesmo nível,
  inalterado.
- **Swagger (etapa 2)**: tag `attributes` e decorators do novo endpoint
  conferem com o especificado; `@ApiProperty`/`@ApiPropertyOptional` de
  `CreateSkillDto`/`UpdateSkillDto`/`FindSkillsQueryDto`/`SkillResponseDto`/
  `SkillListItemResponseDto` cobrem `keyAttribute`/`keyAttributeId` com
  `example`/`description` em pt-BR; `@ApiNotFoundResponse` de `create`/`update`
  mencionam o atributo chave.

Achado menor (não bloqueante):
- **`app-api/src/modules/skills/skills.service.ts:111` (`findAllPaginated`)** —
  o `queryBuilder` não inclui `.leftJoin('skill.keyAttribute', 'keyAttribute')`
  antes do `andWhere('skill.keyAttribute = :keyAttributeId', ...)`, diferente do
  padrão replicado em todos os precedentes equivalentes (`RacesService`,
  `CreaturesService`, `EventsService`, `DivinitiesService`), que sempre fazem um
  `leftJoin` da relação-filtro antes de filtrar por ela, mesmo sem usar o alias
  joined em outro lugar da query.
  - Trecho: `const queryBuilder = this.skillsRepository.createQueryBuilder('skill');`
    seguido de `queryBuilder.andWhere('skill.keyAttribute = :keyAttributeId', ...)`
    sem `leftJoin` prévio.
  - Análise: como `keyAttribute` é o lado proprietário de uma relação `ManyToOne`
    (com `@JoinColumn`), o TypeORM resolve `skill.keyAttribute` diretamente para a
    coluna `key_attribute_id` da própria tabela `skills`, sem exigir um `JOIN` SQL
    real — portanto o filtro deve funcionar corretamente em tempo de execução
    mesmo sem o `leftJoin`. Não é um bug de execução, apenas uma divergência do
    padrão de código replicado nos demais módulos.
  - Sugestão: por consistência com o restante da base (e para o caso de o time
    decidir padronizar esse `leftJoin` como parte do contrato do método, mesmo
    que hoje seja tecnicamente dispensável), adicionar
    `.leftJoin('skill.keyAttribute', 'keyAttribute')` ao `createQueryBuilder`,
    replicando exatamente `RacesService.findAllPaginated`.

Nenhum outro problema de bug de código, tipagem, segurança, nomenclatura ou
inconsistência migration↔entidade foi encontrado. Aprovado, com a ressalva menor
acima.

**Correção aplicada:** o achado acima foi corrigido em
`app-api/src/modules/skills/skills.service.ts` (`findAllPaginated`) — adicionado
`.leftJoin('skill.keyAttribute', 'keyAttribute')` ao `createQueryBuilder('skill')`,
antes do `andWhere('skill.keyAttribute = :keyAttributeId', ...)`, replicando
exatamente `RacesService.findAllPaginated`. Status: corrigido.
