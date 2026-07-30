# Task API: Perícias e Condições

## Contexto
Ver .claude/tasks/pericias-condicoes/spec.md

Duas entidades novas, `Skill` (Perícias) e `Condition` (Condições), estrutural e
comportalmente idênticas entre si. Ambas replicam o módulo `rules` (nome único,
descrição rich text, seções `OneToMany` sem reordenação, paginação, filtro por nome,
`GoogleAccessGuard` em nível de controller) acrescido do relacionamento de tags no
padrão de `locations` (`ManyToMany` + `JoinTable` dedicada, DTO `tagIds?: string[]`).

Adicionalmente, `SearchService`/`SearchController`/`LinkableEntityType` precisam ser
atualizados para incluir as duas novas entidades como pesquisáveis/linkáveis — este é
o mecanismo já usado pelo autocomplete de menções (`GET /search`) consumido pelo
app-web, então nenhuma alteração adicional de "busca global" é necessária na API além
desta.

As duas entidades são implementadas como dois módulos Nest independentes e paralelos
(`skills` e `conditions`), cada um espelhando integralmente a estrutura descrita abaixo
— apenas o nome do módulo/entidade/rota muda entre eles.

## Etapas

### 1. api-dev

#### Entidade

Aplicar duplicando integralmente para os dois módulos (`skills` e `conditions`),
seguindo `app-api/src/modules/rules/entities/rule.entity.ts` +
`rule-section.entity.ts` como base estrutural, e
`app-api/src/modules/locations/entities/location.entity.ts` como base para o
relacionamento de tags.

- Entidade principal: `Skill` (tabela `skills`) / `Condition` (tabela `conditions`),
  estendendo `BaseEntity`.
  - Campos: `name` (string, `@Index({ unique: true })`, obrigatório), `description`
    (`text`, `nullable: true`, opcional).
  - Relacionamentos:
    - `tags`: `ManyToMany(() => Tag)` + `@JoinTable` com tabela de junção dedicada
      (`skill_tags` / `condition_tags`), colunas `skill_id`/`tag_id` (ou
      `condition_id`/`tag_id`), sem filtro por tipo de tag — padrão de
      `Location.tags`.
    - `sections`: `OneToMany` para a entidade de seção correspondente, com
      `cascade: true` e `orphanedRowAction: 'delete'` — padrão de `Rule.sections`.
- Entidade de seção: `SkillSection` (tabela `skill_sections`) / `ConditionSection`
  (tabela `condition_sections`), estendendo `BaseEntity`.
  - Campos: `label` (string, obrigatório), `description` (`text`, `nullable: true`,
    opcional), `order` (`int`, posição de inserção, sem reordenação).
  - Relacionamento: `ManyToOne` de volta para a entidade principal (`skill`/
    `condition`), `onDelete: 'CASCADE'`, `@JoinColumn({ name: 'skill_id' })` (ou
    `condition_id`) — padrão de `RuleSection.rule`.
- `autoLoadEntities: true` já cobre o registro automático das quatro novas entidades
  (`Skill`, `SkillSection`, `Condition`, `ConditionSection`) — nenhuma alteração
  manual em `app.module.ts` é necessária.

#### Migration

- Necessária: sim (schema com `synchronize: false`).
- Seguir o padrão de migrations separadas por tabela já usado por `locations`
  (`CreateLocationsTable` → `CreateLocationTagsTable` → depois, em migration
  posterior, `CreateLocationSectionsTable`) e por `rules`
  (`CreateRulesTable` → `CreateRuleSectionsTable`), criando para cada módulo:
  1. Tabela principal (`skills` / `conditions`): `id` (uuid, `pgcrypto`), `name`
     (unique), `description` (nullable), `created_at`, `updated_at` — mesmas colunas
     base de `rules`.
  2. Tabela de junção de tags (`skill_tags` / `condition_tags`): FKs para a tabela
     principal e para `tags`, com `onDelete: 'CASCADE'` nas duas pontas — mesmo
     padrão de `location_tags`.
  3. Tabela de seções (`skill_sections` / `condition_sections`): `id`, `label`,
     `description` (nullable), `order` (int), FK para a tabela principal
     (`skill_id`/`condition_id`) com `onDelete: 'CASCADE'`, `created_at`,
     `updated_at` — mesmo padrão de `rule_sections`.
- Gerar com `npm run migration:generate -- src/database/migrations/<Nome>` a partir
  das entidades já criadas (ou escrever manualmente seguindo o padrão acima), uma
  migration por tabela, nomeadas de forma análoga às existentes (ex.:
  `CreateSkillsTable`, `CreateSkillTagsTable`, `CreateSkillSectionsTable`,
  `CreateConditionsTable`, `CreateConditionTagsTable`,
  `CreateConditionSectionsTable`).

#### Controller

Dois módulos Nest completos (`SkillsModule` / `ConditionsModule`), cada um com
`*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, seguindo integralmente
`app-api/src/modules/rules/**` como referência de service (métodos `findByName`,
`findById` com `relations: { tags: true, sections: true }`, `buildSections`,
`findTagsByIds` — este último replicado de `LocationsService` — `create`,
`findAllPaginated`, `update` com a mesma técnica de remoção explícita das seções
antigas antes de reatribuir, e `remove`) e de controller/DTOs de `rules`.

- Endpoints (replicados identicamente para `/skills` e `/conditions`):
  - `POST /skills` — cria uma perícia.
  - `GET /skills` — lista paginada com filtro opcional por nome (`FindSkillsQueryDto`
    com `name?`, `page?`, `perPage?`, idêntico a `FindRulesQueryDto`).
  - `GET /skills/:id` — busca por id (404 pt-BR se não encontrado).
  - `PUT /skills/:id` — atualiza (409 pt-BR se novo nome já existir).
  - `DELETE /skills/:id` — remove (204, 404 pt-BR se não encontrado).
  - Equivalente exato em `/conditions`.
- DTOs (por módulo, nomeados com o prefixo da entidade):
  - `CreateSkillDto` — `name` (string, obrigatório), `description?` (string,
    HTML), `tagIds?` (`string[]`, `@IsUUID('4', { each: true })`, opcional — padrão
    de `CreateLocationDto.tagIds`), `sections?`
    (`SkillSectionInputDto[]`, `@ValidateNested`).
  - `UpdateSkillDto extends PartialType(CreateSkillDto)`.
  - `SkillSectionInputDto` — `label` (obrigatório), `description?` (opcional) —
    idêntico a `RuleSectionInputDto`/`LocationSectionInputDto`.
  - `FindSkillsQueryDto` — `name?`, `page?`, `perPage?` — idêntico a
    `FindRulesQueryDto`.
  - `SkillResponseDto` (resposta de detalhe) — `id`, `name`, `description`, `tags`
    (`TagResponseDto[]`), `sections` (`SkillSectionResponseDto[]`, ordenadas por
    `order`), `createdAt`, `updatedAt` — com `static fromEntity`, mesmo padrão de
    `LocationResponseDto`/`RuleResponseDto`.
  - `SkillSectionResponseDto` — `id`, `label`, `description`, `order`, `createdAt`,
    `updatedAt` — idêntico a `RuleSectionResponseDto`.
  - `SkillListItemResponseDto` (resposta enxuta de listagem) — `id`, `name`, `tags`
    (`TagResponseDto[]`). Diferente de `RuleListItemResponseDto` (que só tem `id` e
    `name`, pois `Rule` não tem tags), aqui segue-se o padrão de
    `LocationListItemResponseDto`, que já inclui `tags` na listagem por a entidade
    possuir esse campo — decisão de arquitetura tomada por analogia direta ao par de
    referência mais próximo com tags (Locais), não uma lacuna de requisito.
  - `PaginatedSkillsResponseDto` — `data` (`SkillListItemResponseDto[]`), `total`,
    `page`, `perPage`, `totalPages` — idêntico a `PaginatedRulesResponseDto`.
  - Equivalente exato com prefixo `Condition` para o segundo módulo.
- `SkillsModule`/`ConditionsModule`: `TypeOrmModule.forFeature([Skill, SkillSection,
  Tag])` (e equivalente para Condition), controller, service, `exports:
  [SkillsService]` (e `ConditionsService`) — padrão de `LocationsModule`.
- Acesso Google: `read-only` (padrão) — aplicar `@UseGuards(JwtAuthGuard,
  GoogleAccessGuard)` e `@GoogleAccess('read-only')` a nível de controller nos dois
  módulos, restringindo `create`/`update`/`remove` a usuários não-Google, exatamente
  como em `RulesController`. Confirmado explicitamente no spec (seção "API").

#### Integração com busca (SearchService/SearchController)

- `LinkableEntityType` (`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`):
  adicionar `SKILL = 'skill'` e `CONDITION = 'condition'`.
- `SearchModule`: adicionar `Skill` e `Condition` ao array de
  `TypeOrmModule.forFeature([...])`.
- `SearchService`: injetar `Repository<Skill>` e `Repository<Condition>` no
  construtor e adicionar as duas novas entradas correspondentes no array
  `linkableEntities` usado pelo método `search`, seguindo exatamente o padrão já
  usado para `Rule` (`{ entityType: LinkableEntityType.SKILL, repository:
  this.skillsRepository }`, idem para `CONDITION`).
- `SearchController`/`SearchResultItemResponseDto`: atualizar o texto descritivo de
  `@ApiOperation` (`search`) e do `@ApiProperty` de `entityType` em
  `SearchResultItemResponseDto` para mencionar "perícias" e "condições" na lista de
  entidades pesquisáveis, mantendo consistência com a documentação atual (que já
  enumera todos os tipos suportados por extenso).
- Nenhuma alteração adicional de rota/DTO de busca é necessária: o mesmo endpoint
  `GET /search` já cobre criação, listagem e autocomplete de menções para as novas
  entidades assim que estiverem registradas aqui.

Status: concluído
Entidade: app-api/src/modules/skills/entities/skill.entity.ts, app-api/src/modules/skills/entities/skill-section.entity.ts, app-api/src/modules/conditions/entities/condition.entity.ts, app-api/src/modules/conditions/entities/condition-section.entity.ts
Migration: app-api/src/database/migrations/1784305810000-CreateSkillsTable.ts, app-api/src/database/migrations/1784305820000-CreateSkillTagsTable.ts, app-api/src/database/migrations/1784305830000-CreateSkillSectionsTable.ts, app-api/src/database/migrations/1784305840000-CreateConditionsTable.ts, app-api/src/database/migrations/1784305850000-CreateConditionTagsTable.ts, app-api/src/database/migrations/1784305860000-CreateConditionSectionsTable.ts
Rotas: POST /skills, GET /skills, GET /skills/:id, PUT /skills/:id, DELETE /skills/:id, POST /conditions, GET /conditions, GET /conditions/:id, PUT /conditions/:id, DELETE /conditions/:id
Arquivos: app-api/src/modules/skills/dto/*.ts, app-api/src/modules/skills/skills.service.ts, app-api/src/modules/skills/skills.controller.ts, app-api/src/modules/skills/skills.module.ts, app-api/src/modules/conditions/dto/*.ts, app-api/src/modules/conditions/conditions.service.ts, app-api/src/modules/conditions/conditions.controller.ts, app-api/src/modules/conditions/conditions.module.ts, app-api/src/app.module.ts (registro de SkillsModule/ConditionsModule), app-api/src/modules/search/enums/linkable-entity-type.enum.ts (SKILL, CONDITION), app-api/src/modules/search/search.module.ts, app-api/src/modules/search/search.service.ts, app-api/src/modules/search/search.controller.ts (texto @ApiOperation), app-api/src/modules/search/dto/search-result-item-response.dto.ts (texto @ApiProperty entityType)
Pendências: nenhuma. Migrations criadas mas não executadas — rodar `npm run migration:run` em app-api quando aprovado.

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir, para os dois novos módulos: tags Swagger `@ApiTags('skills')` /
  `@ApiTags('condition')` (ou nome equivalente coerente com a rota), descrição das
  operações (`@ApiOperation`) de cada endpoint, respostas de sucesso/erro
  (`@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNotFoundResponse`,
  `@ApiConflictResponse`, `@ApiBadRequestResponse`, `@ApiNoContentResponse`) já
  anotadas nos DTOs/controllers da etapa 1, e a atualização textual do endpoint
  `GET /search` para mencionar os novos tipos pesquisáveis.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Ambas as etapas ("1. api-dev" e "2. api-dev-doc") estão marcadas como "Status:
concluído" e foram revisadas integralmente: entidades (`Skill`/`SkillSection`,
`Condition`/`ConditionSection`), as seis migrations, os dois módulos Nest completos
(`SkillsModule`/`ConditionsModule` com controller, service, DTOs e módulo), o registro
em `app.module.ts` e a integração com `SearchService`/`SearchController`/
`LinkableEntityType`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-api/src/modules/skills/entities/skill.entity.ts`
- `app-api/src/modules/skills/entities/skill-section.entity.ts`
- `app-api/src/modules/conditions/entities/condition.entity.ts`
- `app-api/src/modules/conditions/entities/condition-section.entity.ts`
- `app-api/src/database/migrations/1784305810000-CreateSkillsTable.ts`
- `app-api/src/database/migrations/1784305820000-CreateSkillTagsTable.ts`
- `app-api/src/database/migrations/1784305830000-CreateSkillSectionsTable.ts`
- `app-api/src/database/migrations/1784305840000-CreateConditionsTable.ts`
- `app-api/src/database/migrations/1784305850000-CreateConditionTagsTable.ts`
- `app-api/src/database/migrations/1784305860000-CreateConditionSectionsTable.ts`
- `app-api/src/modules/skills/dto/create-skill.dto.ts`
- `app-api/src/modules/skills/dto/update-skill.dto.ts`
- `app-api/src/modules/skills/dto/skill-section-input.dto.ts`
- `app-api/src/modules/skills/dto/find-skills-query.dto.ts`
- `app-api/src/modules/skills/dto/skill-response.dto.ts`
- `app-api/src/modules/skills/dto/skill-section-response.dto.ts`
- `app-api/src/modules/skills/dto/skill-list-item-response.dto.ts`
- `app-api/src/modules/skills/dto/paginated-skills-response.dto.ts`
- `app-api/src/modules/skills/skills.service.ts`
- `app-api/src/modules/skills/skills.controller.ts`
- `app-api/src/modules/skills/skills.module.ts`
- `app-api/src/modules/conditions/dto/create-condition.dto.ts`
- `app-api/src/modules/conditions/dto/update-condition.dto.ts`
- `app-api/src/modules/conditions/dto/condition-section-input.dto.ts`
- `app-api/src/modules/conditions/dto/find-conditions-query.dto.ts`
- `app-api/src/modules/conditions/dto/condition-response.dto.ts`
- `app-api/src/modules/conditions/dto/condition-section-response.dto.ts`
- `app-api/src/modules/conditions/dto/condition-list-item-response.dto.ts`
- `app-api/src/modules/conditions/dto/paginated-conditions-response.dto.ts`
- `app-api/src/modules/conditions/conditions.service.ts`
- `app-api/src/modules/conditions/conditions.controller.ts`
- `app-api/src/modules/conditions/conditions.module.ts`
- `app-api/src/app.module.ts`
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`
- `app-api/src/modules/search/search.module.ts`
- `app-api/src/modules/search/search.service.ts`
- `app-api/src/modules/search/search.controller.ts`
- `app-api/src/modules/search/dto/search-result-item-response.dto.ts`

Pontos conferidos especificamente:
- Consistência migration ↔ entidade: nomes de tabela (`skills`/`skill_sections`/
  `skill_tags`, `conditions`/`condition_sections`/`condition_tags`), colunas
  (`name` único, `description` nullable, `label`, `order` `int`, `skill_id`/
  `condition_id`), FKs com `onDelete: 'CASCADE'` nas tabelas de junção e de seções, e
  `down()` revertendo exatamente o `up()` (drop de constraints/índices na ordem
  inversa) — tudo em conformidade com o padrão de `rules`/`locations`.
- `JwtAuthGuard` + `GoogleAccessGuard` + `@GoogleAccess('read-only')` aplicados a nível
  de controller em `SkillsController` e `ConditionsController`, idêntico a
  `RulesController`, restringindo `create`/`update`/`remove` a usuários não-Google.
- Mensagens de erro (`NotFoundException`/`ConflictException`) em pt-BR e consistentes
  com o restante do projeto ("Perícia não encontrada.", "Já existe uma condição com
  este nome.", "Uma ou mais tags não foram encontradas.", etc.).
- Integração com `SearchService`/`LinkableEntityType`: `SKILL`/`CONDITION` adicionados
  ao enum, repositórios injetados e entradas correspondentes no array
  `linkableEntities`, `SearchModule` com os `TypeOrmModule.forFeature` atualizados, e
  textos de `@ApiOperation`/`@ApiProperty` em `SearchController`/
  `SearchResultItemResponseDto` mencionando "perícias" e "condições".
- DTOs de resposta usam `fromEntity`, não vazam campos não solicitados, e a
  listagem enxuta (`SkillListItemResponseDto`/`ConditionListItemResponseDto`) inclui
  `tags` por analogia direta a `LocationListItemResponseDto`, conforme decisão
  registrada na spec.
- `SkillsModule`/`ConditionsModule` registrados em `app.module.ts` com
  `autoLoadEntities: true` cobrindo o registro das quatro novas entidades.

Nenhum achado bloqueante ou de estilo a reportar.
