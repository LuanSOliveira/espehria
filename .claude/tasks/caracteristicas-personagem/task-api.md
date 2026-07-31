# Task API: Características de Personagem (Treinamentos, Talentos, Técnicas e Magias)

## Contexto
Não existe `.claude/tasks/caracteristicas-personagem/spec.md` para esta demanda — o
pedido do usuário (transcrito na mensagem que originou este plano) é a fonte de
verdade factual.

Quatro entidades novas, agrupadas sob o conceito de "Características de Personagem":
`Training` (Treinamentos), `Talent` (Talentos), `Technique` (Técnicas) e `Spell`
(Magias). As quatro seguem integralmente o padrão já estabelecido pelo módulo
`app-api/src/modules/utilities/**` (nome único, `description` em rich text/HTML,
`referenceImage` como texto/URL opcional, tags `ManyToMany` com `JoinTable` dedicada,
paginação com filtro por nome, `GoogleAccessGuard` read-only em nível de controller,
integração com `SearchService`/`LinkableEntityType`) — **sem** o relacionamento de
`sections` que existe em `skills`/`conditions`/`rules`/`locations`.

Diferença de campos entre os dois pares:
- `Training` e `Talent`: `name*`, `tags`, `description` (rich text). **Sem**
  `referenceImage`.
- `Technique` e `Spell`: `referenceImage` (URL opcional), `name*`, `tags`,
  `description` (rich text).

As quatro entidades são implementadas como quatro módulos Nest independentes e
paralelos (`trainings`, `talents`, `techniques`, `spells`), cada um espelhando
integralmente a estrutura descrita abaixo — apenas o nome do
módulo/entidade/rota/campo `referenceImage` (presente ou ausente) muda entre eles.

## Decisões tomadas por analogia direta a padrões já existentes (não são lacunas de requisito)

- `name`: `@Index({ unique: true })`, coluna `character varying` sem tamanho fixo —
  mesmo padrão de `Utility`/`Skill`/`Condition`/`Rule` (todas as entidades desse tipo
  no projeto têm nome único).
- `description`: `text`, `nullable: true` — mesmo padrão de `Utility.description`
  (rich text HTML, sem `privateInformation`/`price`, pois o pedido não menciona esses
  campos para estas quatro entidades).
- `referenceImage` (só em `Technique`/`Spell`): `varchar`, `nullable: true`, coluna
  física `reference_image` — idêntico a `Utility.referenceImage`/
  `Character.referenceImage`, validado no DTO de criação/atualização com `@IsUrl()` +
  `@IsOptional()`, mesma mensagem de erro pt-BR usada em `CreateUtilityDto`.
- `referenceImage` entra tanto no DTO de detalhe quanto no DTO enxuto de listagem
  (`TechniqueListItemResponseDto`/`SpellListItemResponseDto`) — mesma decisão já
  tomada para `UtilityListItemResponseDto`, para permitir exibir a imagem de
  referência diretamente na listagem sem uma segunda chamada.
- Tabelas de junção de tags nomeadas `training_tags`, `talent_tags`,
  `technique_tags`, `spell_tags` — mesmo padrão de `utility_tags`/`skill_tags`.
- Nenhuma das quatro entidades tem `sections`, `price` ou `privateInformation`: o
  pedido não menciona esses campos para estas entidades, e a instrução explícita da
  tarefa confirma que elas não têm o relacionamento de seções presente em
  skills/conditions.

## Etapas

### 1. api-dev

#### Entidade

Aplicar duplicando integralmente para os quatro módulos (`trainings`, `talents`,
`techniques`, `spells`), seguindo `app-api/src/modules/utilities/entities/utility.entity.ts`
como base estrutural exata (removendo `price` e `privateInformation`, que não fazem
parte do pedido).

- `Training` (tabela `trainings`), estendendo `BaseEntity`:
  - Campos: `name` (string, `@Index({ unique: true })`, obrigatório), `description`
    (`text`, `nullable: true`, opcional).
  - Relacionamentos: `tags` — `ManyToMany(() => Tag)` + `@JoinTable` dedicada
    (`training_tags`, colunas `training_id`/`tag_id`), sem filtro por tipo de tag.
  - Sem `referenceImage`, sem `sections`.
- `Talent` (tabela `talents`): estrutura idêntica a `Training` (`name`, `description`,
  `tags` via `talent_tags`).
- `Technique` (tabela `techniques`), estendendo `BaseEntity`:
  - Campos: `referenceImage` (`varchar`, `nullable: true`, coluna `reference_image`,
    opcional), `name` (string, `@Index({ unique: true })`, obrigatório), `description`
    (`text`, `nullable: true`, opcional).
  - Relacionamentos: `tags` — `ManyToMany(() => Tag)` + `@JoinTable` dedicada
    (`technique_tags`, colunas `technique_id`/`tag_id`).
  - Sem `sections`.
- `Spell` (tabela `spells`): estrutura idêntica a `Technique` (`referenceImage`,
  `name`, `description`, `tags` via `spell_tags`).
- `autoLoadEntities: true` já cobre o registro automático das quatro novas entidades
  (`Training`, `Talent`, `Technique`, `Spell`) — nenhuma alteração manual em
  `app.module.ts` é necessária para as entidades em si (mas os quatro módulos Nest
  precisam ser registrados em `imports` de `app.module.ts`, assim como
  `UtilitiesModule` foi).

#### Migration

- Necessária: sim (schema com `synchronize: false`).
- Seguir exatamente o padrão de duas migrations por módulo já usado por `utilities`
  (`CreateUtilitiesTable` → `CreateUtilityTagsTable`), sem migration de seções (essas
  entidades não têm `sections`):
  1. Tabela principal: `id` (uuid, `pgcrypto`/`gen_random_uuid()`), `created_at`,
     `updated_at`, `name` (`character varying NOT NULL`, índice único
     `IDX_<tabela>_name`), `description` (`text`, nullable) — e, apenas em
     `techniques`/`spells`, `reference_image` (`character varying`, nullable) antes ou
     depois de `name` conforme a ordem de colunas da entidade.
  2. Tabela de junção de tags (`training_tags`/`talent_tags`/`technique_tags`/
     `spell_tags`): `<entidade>_id` + `tag_id`, PK composta, índices individuais em
     cada coluna, FKs com `onDelete: 'CASCADE'` para a tabela principal e para `tags`
     — mesmo padrão de `utility_tags`.
- Gerar com `npm run migration:generate -- src/database/migrations/<Nome>` a partir
  das entidades já criadas (ou escrever manualmente seguindo o padrão de
  `1784305870000-CreateUtilitiesTable.ts`/`1784305880000-CreateUtilityTagsTable.ts`),
  uma migration por tabela, oito migrations no total, com timestamps sequenciais
  a partir de `1784305890000` (a última migration existente no repositório é
  `1784305880000-CreateUtilityTagsTable`), nomeadas de forma análoga às existentes
  (ex.: `CreateTrainingsTable`, `CreateTrainingTagsTable`, `CreateTalentsTable`,
  `CreateTalentTagsTable`, `CreateTechniquesTable`, `CreateTechniqueTagsTable`,
  `CreateSpellsTable`, `CreateSpellTagsTable`).

#### Controller

Quatro módulos Nest completos (`TrainingsModule`, `TalentsModule`, `TechniquesModule`,
`SpellsModule`), cada um com `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`,
seguindo integralmente `app-api/src/modules/utilities/**` como referência de service
(métodos `findByName`, `findById` com `relations: { tags: true }`, `findTagsByIds`,
`create`, `findAllPaginated`, `update`, `remove` — sem lógica de seções) e de
controller/DTOs de `utilities`.

- Endpoints (replicados identicamente para as quatro rotas):
  - `POST /trainings` — cria um treinamento.
  - `GET /trainings` — lista paginada com filtro opcional por nome
    (`FindTrainingsQueryDto` com `name?`, `page?`, `perPage?`, idêntico a
    `FindUtilitiesQueryDto`).
  - `GET /trainings/:id` — busca por id (404 pt-BR se não encontrado).
  - `PUT /trainings/:id` — atualiza (409 pt-BR se novo nome já existir).
  - `DELETE /trainings/:id` — remove (204, 404 pt-BR se não encontrado).
  - Equivalente exato em `/talents`, `/techniques`, `/spells`.
- DTOs (por módulo, nomeados com o prefixo da entidade):
  - `CreateTrainingDto` — `name` (string, obrigatório), `description?` (string,
    HTML), `tagIds?` (`string[]`, `@IsUUID('4', { each: true })`, opcional) — sem
    `referenceImage`.
  - `CreateTalentDto` — idêntico a `CreateTrainingDto`.
  - `CreateTechniqueDto` — `name` (obrigatório), `referenceImage?` (string,
    `@IsUrl()`, opcional), `description?` (opcional), `tagIds?` (opcional) — idêntico
    a `CreateUtilityDto` sem `price`/`privateInformation`.
  - `CreateSpellDto` — idêntico a `CreateTechniqueDto`.
  - `Update<Entidade>Dto extends PartialType(Create<Entidade>Dto)` para as quatro.
  - `Find<Entidades>QueryDto` — `name?`, `page?`, `perPage?` — idêntico a
    `FindUtilitiesQueryDto`, para as quatro.
  - `<Entidade>ResponseDto` (resposta de detalhe) — `id`, `name`, `description`,
    `tags` (`TagResponseDto[]`), `createdAt`, `updatedAt` (e `referenceImage` apenas
    em `Technique`/`Spell`) — com `static fromEntity`, mesmo padrão de
    `UtilityResponseDto`.
  - `<Entidade>ListItemResponseDto` (resposta enxuta de listagem) — `id`, `name`,
    `tags` (`TagResponseDto[]`) (e `referenceImage` apenas em `Technique`/`Spell`) —
    idêntico a `UtilityListItemResponseDto`.
  - `Paginated<Entidades>ResponseDto` — `data`, `total`, `page`, `perPage`,
    `totalPages` — idêntico a `PaginatedUtilitiesResponseDto`, para as quatro.
- `TrainingsModule`/`TalentsModule`/`TechniquesModule`/`SpellsModule`:
  `TypeOrmModule.forFeature([<Entidade>, Tag])`, controller, service, `exports:
  [<Entidade>sService]` — padrão de `UtilitiesModule`. Registrar os quatro módulos em
  `imports` de `app.module.ts`.
- Acesso Google: `read-only` (padrão) — aplicar `@UseGuards(JwtAuthGuard,
  GoogleAccessGuard)` e `@GoogleAccess('read-only')` a nível de controller nos quatro
  módulos, restringindo `create`/`update`/`remove` a usuários não-Google, exatamente
  como em `UtilitiesController`/`SkillsController`/`ConditionsController`. O pedido
  não indicou nada diferente do padrão já usado para itens/perícias/condições, então
  o padrão é aplicado sem levantar dúvida adicional.

#### Integração com busca (SearchService/SearchController)

- `LinkableEntityType`
  (`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`): adicionar
  `TRAINING = 'training'`, `TALENT = 'talent'`, `TECHNIQUE = 'technique'`,
  `SPELL = 'spell'`.
- `SearchModule`: adicionar `Training`, `Talent`, `Technique`, `Spell` ao array de
  `TypeOrmModule.forFeature([...])`.
- `SearchService`: injetar `Repository<Training>`, `Repository<Talent>`,
  `Repository<Technique>`, `Repository<Spell>` no construtor e adicionar as quatro
  novas entradas correspondentes no array `linkableEntities` usado pelo método
  `search`, seguindo exatamente o padrão já usado para `Utility` (`{ entityType:
  LinkableEntityType.TRAINING, repository: this.trainingsRepository }`, idem para os
  outros três).
- `SearchController`/`SearchResultItemResponseDto`: atualizar o texto descritivo de
  `@ApiOperation` (`search`) e do `@ApiProperty` de `entityType` em
  `SearchResultItemResponseDto` para mencionar "treinamentos", "talentos",
  "técnicas" e "magias" na lista de entidades pesquisáveis, mantendo consistência
  com a documentação atual (que já enumera todos os tipos suportados por extenso).
- Nenhuma alteração adicional de rota/DTO de busca é necessária: o mesmo endpoint
  `GET /search` já cobre autocomplete de menções para as novas entidades assim que
  estiverem registradas aqui.

Status: concluído
Entidade: app-api/src/modules/trainings/entities/training.entity.ts, app-api/src/modules/talents/entities/talent.entity.ts, app-api/src/modules/techniques/entities/technique.entity.ts, app-api/src/modules/spells/entities/spell.entity.ts
Migration: app-api/src/database/migrations/1784305890000-CreateTrainingsTable.ts, app-api/src/database/migrations/1784305900000-CreateTrainingTagsTable.ts, app-api/src/database/migrations/1784305910000-CreateTalentsTable.ts, app-api/src/database/migrations/1784305920000-CreateTalentTagsTable.ts, app-api/src/database/migrations/1784305930000-CreateTechniquesTable.ts, app-api/src/database/migrations/1784305940000-CreateTechniqueTagsTable.ts, app-api/src/database/migrations/1784305950000-CreateSpellsTable.ts, app-api/src/database/migrations/1784305960000-CreateSpellTagsTable.ts
Rotas: POST /trainings, GET /trainings, GET /trainings/:id, PUT /trainings/:id, DELETE /trainings/:id, POST /talents, GET /talents, GET /talents/:id, PUT /talents/:id, DELETE /talents/:id, POST /techniques, GET /techniques, GET /techniques/:id, PUT /techniques/:id, DELETE /techniques/:id, POST /spells, GET /spells, GET /spells/:id, PUT /spells/:id, DELETE /spells/:id
Arquivos: app-api/src/modules/trainings/{dto/create-training.dto.ts,dto/update-training.dto.ts,dto/find-trainings-query.dto.ts,dto/training-response.dto.ts,dto/training-list-item-response.dto.ts,dto/paginated-trainings-response.dto.ts,trainings.service.ts,trainings.controller.ts,trainings.module.ts}; app-api/src/modules/talents/{dto/create-talent.dto.ts,dto/update-talent.dto.ts,dto/find-talents-query.dto.ts,dto/talent-response.dto.ts,dto/talent-list-item-response.dto.ts,dto/paginated-talents-response.dto.ts,talents.service.ts,talents.controller.ts,talents.module.ts}; app-api/src/modules/techniques/{dto/create-technique.dto.ts,dto/update-technique.dto.ts,dto/find-techniques-query.dto.ts,dto/technique-response.dto.ts,dto/technique-list-item-response.dto.ts,dto/paginated-techniques-response.dto.ts,techniques.service.ts,techniques.controller.ts,techniques.module.ts}; app-api/src/modules/spells/{dto/create-spell.dto.ts,dto/update-spell.dto.ts,dto/find-spells-query.dto.ts,dto/spell-response.dto.ts,dto/spell-list-item-response.dto.ts,dto/paginated-spells-response.dto.ts,spells.service.ts,spells.controller.ts,spells.module.ts}; app-api/src/app.module.ts (registro dos quatro módulos); app-api/src/modules/search/enums/linkable-entity-type.enum.ts, app-api/src/modules/search/search.module.ts, app-api/src/modules/search/search.service.ts, app-api/src/modules/search/search.controller.ts, app-api/src/modules/search/dto/search-result-item-response.dto.ts (integração de busca)
Pendências: nenhuma. Migrations criadas mas não executadas — rodar `npm run migration:run` em app-api quando aprovado.

### 2. api-dev-doc
Status: concluído
Arquivos alterados: app-api/src/modules/trainings/trainings.controller.ts, app-api/src/modules/talents/talents.controller.ts, app-api/src/modules/techniques/techniques.controller.ts, app-api/src/modules/spells/spells.controller.ts, app-api/src/modules/trainings/dto/create-training.dto.ts, app-api/src/modules/trainings/dto/training-response.dto.ts, app-api/src/modules/trainings/dto/training-list-item-response.dto.ts, app-api/src/modules/talents/dto/create-talent.dto.ts, app-api/src/modules/talents/dto/talent-response.dto.ts, app-api/src/modules/talents/dto/talent-list-item-response.dto.ts, app-api/src/modules/techniques/dto/create-technique.dto.ts, app-api/src/modules/techniques/dto/technique-response.dto.ts, app-api/src/modules/techniques/dto/technique-list-item-response.dto.ts, app-api/src/modules/spells/dto/create-spell.dto.ts, app-api/src/modules/spells/dto/spell-response.dto.ts, app-api/src/modules/spells/dto/spell-list-item-response.dto.ts, app-api/src/modules/search/search.controller.ts, app-api/src/modules/search/dto/search-result-item-response.dto.ts

- Depende da etapa 1
- Toda a documentação Swagger foi implementada durante a etapa 1 (api-dev) com cobertura completa:
  - Tags Swagger `@ApiTags('trainings')` / `@ApiTags('talents')` / `@ApiTags('techniques')` / `@ApiTags('spells')` aplicadas em todos os controllers
  - `@ApiBearerAuth()` e `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` presentes em todos os controllers
  - `@ApiOperation({ summary })` com descrições em pt-BR para cada endpoint (criar, listar, buscar por id, atualizar, remover)
  - Respostas documentadas: `@ApiCreatedResponse` (POST), `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE), `@ApiConflictResponse` (409), `@ApiNotFoundResponse` (404), `@ApiBadRequestResponse` (400)
  - Todos os campos dos DTOs (`CreateXDto`, `UpdateXDto`, `XResponseDto`, `XListItemResponseDto`) possuem `@ApiProperty` / `@ApiPropertyOptional` com exemplos e descrições em pt-BR
  - Campo `referenceImage` documentado em `CreateTechniqueDto`, `CreateSpellDto`, `TechniqueResponseDto`, `SpellResponseDto`, `TechniqueListItemResponseDto`, `SpellListItemResponseDto`
  - Endpoint `GET /search` (`search.controller.ts`) atualizado com menção aos quatro novos tipos pesquisáveis (treinamentos, talentos, técnicas e magias)
  - Campo `entityType` em `SearchResultItemResponseDto` documentado com descrição incluindo os quatro novos tipos pesquisáveis
  - Nenhuma alteração adicional foi necessária: toda a documentação segue o padrão já estabelecido pelo módulo `utilities` e é validável em `/docs`

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como `Status: concluído`, com
listas de arquivos registradas; ambas foram revisadas integralmente.

Foram lidos e comparados com o padrão de referência (`app-api/src/modules/utilities/**`
e suas migrations `1784305870000-CreateUtilitiesTable`/
`1784305880000-CreateUtilityTagsTable`):

- Entidades: `app-api/src/modules/trainings/entities/training.entity.ts`,
  `app-api/src/modules/talents/entities/talent.entity.ts`,
  `app-api/src/modules/techniques/entities/technique.entity.ts`,
  `app-api/src/modules/spells/entities/spell.entity.ts`
- Migrations: `app-api/src/database/migrations/1784305890000-CreateTrainingsTable.ts`,
  `1784305900000-CreateTrainingTagsTable.ts`, `1784305910000-CreateTalentsTable.ts`,
  `1784305920000-CreateTalentTagsTable.ts`, `1784305930000-CreateTechniquesTable.ts`,
  `1784305940000-CreateTechniqueTagsTable.ts`, `1784305950000-CreateSpellsTable.ts`,
  `1784305960000-CreateSpellTagsTable.ts`
- Módulos completos (controller/service/module/dto) de `trainings`, `talents`,
  `techniques` e `spells`
- `app-api/src/app.module.ts` (registro dos quatro módulos)
- Integração de busca: `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`,
  `search.module.ts`, `search.service.ts`, `search.controller.ts`,
  `dto/search-result-item-response.dto.ts`
- `app-api/src/modules/auth/decorators/google-access.decorator.ts` e
  `app-api/src/modules/auth/guards/google-access.guard.ts` (conferência do
  comportamento de `GoogleAccess('read-only')`)

Pontos verificados especificamente:
- Consistência migration ↔ entidade: nomes de tabela (`trainings`/`talents`/
  `techniques`/`spells`), colunas (`name`, `description`, `reference_image` apenas em
  `techniques`/`spells`, na mesma ordem da entidade), índice único de `name`
  (`IDX_<tabela>_name`), tabelas de junção (`training_tags`/`talent_tags`/
  `technique_tags`/`spell_tags`) com PK composta, índices individuais por coluna e FKs
  `ON DELETE CASCADE` para a tabela principal e para `tags` — tudo confere
  exatamente com a entidade correspondente. Os métodos `down()` revertem
  exatamente o `up()` de cada migration (drop de constraints, índices e tabela na
  ordem inversa de criação).
- `JwtAuthGuard` + `GoogleAccessGuard` + `@GoogleAccess('read-only')` aplicados a
  nível de controller nos quatro controllers (`TrainingsController`,
  `TalentsController`, `TechniquesController`, `SpellsController`), restringindo
  `create`/`update`/`remove` a métodos não-GET para usuários Google, exatamente como
  em `UtilitiesController`.
- Mensagens de erro (`ConflictException`, `NotFoundException`) em pt-BR e
  consistentes entre os quatro módulos (ex.: "Já existe um treinamento/talento/uma
  técnica/uma magia com este nome.", "Treinamento/Talento/Técnica/Magia não
  encontrado(a).", "Uma ou mais tags não foram encontradas.").
- Integração com `SearchService`/`SearchModule`/`LinkableEntityType` completa: as
  quatro novas entidades foram adicionadas ao array `TypeOrmModule.forFeature` de
  `SearchModule`, injetadas no construtor de `SearchService` e incluídas no array
  `linkableEntities` usado pelo método `search`, seguindo exatamente o padrão de
  `Utility`. `LinkableEntityType` recebeu os quatro novos valores
  (`TRAINING`/`TALENT`/`TECHNIQUE`/`SPELL`). `SearchController` e
  `SearchResultItemResponseDto` foram atualizados para mencionar "treinamentos",
  "talentos", "técnicas" e "magias" na documentação Swagger.
- DTOs de criação/atualização com `class-validator` completo (`@IsString`/
  `@IsNotEmpty` em `name`, `@IsOptional` em `description`/`tagIds`/`referenceImage`,
  `@IsUUID('4', { each: true })` em `tagIds`, `@IsUrl()` com mensagem pt-BR em
  `referenceImage` apenas em `Technique`/`Spell`); `Update<Entidade>Dto` como
  `PartialType(Create<Entidade>Dto)`.
- DTOs de resposta (`<Entidade>ResponseDto`/`<Entidade>ListItemResponseDto`) usam
  `static fromEntity`, expõem apenas os campos previstos no plano (sem vazar nada de
  `Tag` além do que `TagResponseDto.fromEntity` já expõe) e `referenceImage` presente
  apenas em `Technique`/`Spell`, inclusive no DTO enxuto de listagem, como
  especificado.
- `Paginated<Entidades>ResponseDto` com `data`/`total`/`page`/`perPage`/`totalPages`
  idêntico ao padrão de `PaginatedUtilitiesResponseDto` nos quatro módulos.
- Documentação Swagger (`@ApiTags`, `@ApiOperation`, `@ApiCreatedResponse`/
  `@ApiOkResponse`/`@ApiNoContentResponse`/`@ApiConflictResponse`/
  `@ApiNotFoundResponse`/`@ApiBadRequestResponse`, `@ApiProperty`/
  `@ApiPropertyOptional`) presente e coerente com o comportamento real de cada
  endpoint nos quatro controllers e em todos os DTOs.
- `TrainingsModule`/`TalentsModule`/`TechniquesModule`/`SpellsModule` com
  `TypeOrmModule.forFeature([<Entidade>, Tag])`, `exports: [<Entidade>sService]`, e
  registro correto em `imports` de `app.module.ts`.

Aprovado. Nenhum problema encontrado nos arquivos revisados: entidades, migrations,
controllers, services, modules e DTOs de `trainings`, `talents`, `techniques` e
`spells`, além das alterações em `app.module.ts` e no módulo `search` (enum,
module, service, controller e DTO de resposta).
