# Task API: Características

## Contexto
Ver .claude/tasks/caracteristicas-habilidade/spec.md (se existir)

Não existe `spec.md` para esta demanda. O pedido do usuário já fechou todas as
decisões de modelagem: replicar EXATAMENTE o padrão do módulo
`app-api/src/modules/talents/` (referência canônica) para uma nova entidade
"características" (`Characteristic`), incluindo participação como owner/target no
mecanismo de `improvedFrom`/`requirements` do módulo `entity-links` (mesmo modelo
já usado por `training`/`talent`/`technique`/`spell`, documentado em
`.claude/tasks/improved-from-requirements/task-api.md`).

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/characteristics/entities/characteristic.entity.ts`
- Migration:
  - `app-api/src/database/migrations/1784306070000-CreateCharacteristicsTable.ts`
  - `app-api/src/database/migrations/1784306080000-CreateCharacteristicTagsTable.ts`
  - `app-api/src/database/migrations/1784306090000-AddCharacteristicToEntityLinksTable.ts`
- Rotas: `POST /characteristics`, `GET /characteristics`, `GET /characteristics/:id`,
  `PUT /characteristics/:id`, `DELETE /characteristics/:id`
- Arquivos:
  - `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`
  - `app-api/src/modules/characteristics/dto/update-characteristic.dto.ts`
  - `app-api/src/modules/characteristics/dto/find-characteristics-query.dto.ts`
  - `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`
  - `app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`
  - `app-api/src/modules/characteristics/dto/paginated-characteristics-response.dto.ts`
  - `app-api/src/modules/characteristics/characteristics.service.ts`
  - `app-api/src/modules/characteristics/characteristics.controller.ts`
  - `app-api/src/modules/characteristics/characteristics.module.ts`
  - `app-api/src/app.module.ts` (registro de `CharacteristicsModule`)
  - `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`
    (adicionado `CHARACTERISTIC`)
  - `app-api/src/modules/entity-links/entities/entity-link.entity.ts`
    (`ownerCharacteristic`/`targetCharacteristic`, checks e unique atualizados)
  - `app-api/src/modules/entity-links/entity-links.service.ts` (switches,
    `loadReferencesFor`)
  - `app-api/src/modules/entity-links/entity-links.module.ts` (`Characteristic` no
    `forFeature`)
  - `app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`
    (description atualizada)
  - `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` (adicionado
    `CHARACTERISTIC`)
  - `app-api/src/modules/search/search.module.ts` (`Characteristic` no
    `forFeature`)
  - `app-api/src/modules/search/search.service.ts` (repositório injetado e
    `linkableEntities`)
  - `app-api/src/modules/search/search.controller.ts` (texto de
    `@ApiOperation` atualizado)
  - `app-api/src/modules/search/dto/search-result-item-response.dto.ts`
    (description de `entityType` atualizada)

#### Entidade

Novo módulo `app-api/src/modules/characteristics/`, espelhando integralmente
`app-api/src/modules/talents/` (mesma estrutura de arquivos:
`entities/characteristic.entity.ts`, `dto/`, `characteristics.service.ts`,
`characteristics.controller.ts`, `characteristics.module.ts`).

- Entidade: `Characteristic` (tabela `characteristics`), estendendo `BaseEntity`
  (`id` uuid, `createdAt`, `updatedAt` herdados).
- Campos:
  - `name` (`string`, `@Column()`, `@Index({ unique: true })`, obrigatório) —
    idêntico a `Talent.name`.
  - `description` (`text`, `nullable: true`, opcional) — idêntico a
    `Talent.description`.
- Relacionamentos:
  - `tags`: `@ManyToMany(() => Tag)` + `@JoinTable({ name: 'characteristic_tags', joinColumn: { name: 'characteristic_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' } })`
    — idêntico ao `tags` de `Talent`, apenas trocando o nome da join table e das
    colunas (`talent_id` → `characteristic_id`).
- `autoLoadEntities: true` cobre o registro automático da entidade `Characteristic`;
  ainda assim, o novo `CharacteristicsModule` precisa ser adicionado em `imports`
  de `app-api/src/app.module.ts` (mesmo padrão de `TalentsModule`,
  `TechniquesModule`, `SpellsModule` já registrados lá).

**Alterações necessárias no módulo `entity-links` para suportar `characteristic`
como owner e como target** (mesmo mecanismo já usado por
`training`/`talent`/`technique`/`spell`):

- `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`:
  adicionar `CHARACTERISTIC = 'characteristic'` ao enum `ReferenceableEntityType`
  (mesma grafia minúscula usada pelos demais valores).
- `app-api/src/modules/entity-links/entities/entity-link.entity.ts`:
  - Importar `Characteristic` de `../../characteristics/entities/characteristic.entity`.
  - Adicionar `ownerCharacteristic!: Characteristic | null` —
    `@ManyToOne(() => Characteristic, { nullable: true, onDelete: 'CASCADE' })` +
    `@JoinColumn({ name: 'owner_characteristic_id' })`.
  - Adicionar `targetCharacteristic!: Characteristic | null` — mesmo padrão, com
    `@JoinColumn({ name: 'target_characteristic_id' })`.
  - Atualizar o `@Check('CK_entity_links_owner_exclusive', ...)` para
    `'num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id, owner_characteristic_id) = 1'`.
  - Atualizar o `@Check('CK_entity_links_target_exclusive', ...)` para
    `'num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id, target_characteristic_id) = 1'`.
  - Atualizar o `@Unique([...])` para incluir `'ownerCharacteristic'` (após
    `'ownerSpell'`) e `'targetCharacteristic'` (após `'targetSpell'`).
- `app-api/src/modules/entity-links/entity-links.service.ts`:
  - Importar `Characteristic` e injetar `@InjectRepository(Characteristic) private readonly characteristicsRepository: Repository<Characteristic>` no construtor.
  - Adicionar `'ownerCharacteristic'` ao tipo `OwnerColumn` e `'targetCharacteristic'`
    ao tipo `TargetColumn`.
  - `repositoryFor`: adicionar `case ReferenceableEntityType.CHARACTERISTIC: return this.characteristicsRepository;`.
  - `ownerColumnFor`: adicionar `case ReferenceableEntityType.CHARACTERISTIC: return 'ownerCharacteristic';`.
  - `targetColumnFor`: adicionar `case ReferenceableEntityType.CHARACTERISTIC: return 'targetCharacteristic';`.
  - `loadReferencesFor`: adicionar `targetCharacteristic: { tags: true }` ao objeto
    `relations` da query, e um novo `if (link.targetCharacteristic) { return EntityReferenceResponseDto.fromResolved(link.targetCharacteristic, ReferenceableEntityType.CHARACTERISTIC); }` em `toResponse`, antes do fallback final (que hoje assume `targetSpell` como último caso — ajustar esse fallback para o novo último caso ser `targetCharacteristic`, ou tornar o `if` de `targetSpell` explícito também, evitando qualquer ambiguidade).
  - Nenhuma outra lógica do serviço (`resolveReferences`, `validateLists`,
    `replaceLinks`) precisa de alteração — todas já operam de forma genérica via
    `entityType`/`ownerColumnFor`/`targetColumnFor`/`repositoryFor`.
- `app-api/src/modules/entity-links/entity-links.module.ts`: adicionar
  `Characteristic` ao array de `TypeOrmModule.forFeature([EntityLink, Training, Talent, Technique, Spell, Characteristic])`.
- `app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts` e
  `entity-reference-response.dto.ts`: nenhuma alteração de código necessária (o
  `@ApiProperty({ enum: ReferenceableEntityType, ... })` já reflete o enum
  automaticamente); apenas revisar/ajustar o texto da `description` para
  mencionar "característica" na enumeração de tipos, junto com
  treinamento/talento/técnica/magia.
- `CharacteristicsModule` importa `EntityLinksModule` (mesmo padrão de
  `TalentsModule`) para o `CharacteristicsService` poder chamar
  `entityLinksService.validateLists`/`resolveReferences`/`replaceLinks`/`loadReferencesFor`
  usando `ReferenceableEntityType.CHARACTERISTIC` como `ownerEntityType`.

**Integração com busca (`SearchService`/`LinkableEntityType`)** — necessária para
que características apareçam no autocomplete de menções, assim como
treinamentos/talentos/técnicas/magias já aparecem:

- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`: adicionar
  `CHARACTERISTIC = 'characteristic'` a `LinkableEntityType`.
- `app-api/src/modules/search/search.module.ts`: adicionar `Characteristic` ao
  array de `TypeOrmModule.forFeature([...])`.
- `app-api/src/modules/search/search.service.ts`: injetar
  `@InjectRepository(Characteristic) private readonly characteristicsRepository: Repository<Characteristic>`
  no construtor e adicionar
  `{ entityType: LinkableEntityType.CHARACTERISTIC, repository: this.characteristicsRepository }`
  ao array `linkableEntities` (mesmo padrão usado para `Talent`/`Spell`).
- `app-api/src/modules/search/search.controller.ts` e
  `app-api/src/modules/search/dto/search-result-item-response.dto.ts`: atualizar o
  texto descritivo (`@ApiOperation`/`@ApiProperty` de `entityType`) para incluir
  "característica" na lista de tipos pesquisáveis suportados.

Nenhum outro ponto do backend enumera `ReferenceableEntityType`/`LinkableEntityType`
além dos arquivos já listados acima (confirmado via busca por
`ReferenceableEntityType`, `ownerSpell`/`targetSpell`/`'spell'` em todo
`app-api/src`); não há um "dispatcher de entity mentions" separado — o único ponto
de agregação de tipos linkáveis é o `SearchService` já coberto acima.

#### Migration

- Necessária: sim (três migrations novas, já que `synchronize` fica `false`).
- Gerar/escrever seguindo exatamente o padrão das migrations de `talents`
  (`app-api/src/database/migrations/1784305910000-CreateTalentsTable.ts` e
  `1784305920000-CreateTalentTagsTable.ts`) e da migration de `entity_links`
  (`app-api/src/database/migrations/1784306060000-CreateEntityLinks.ts`, a mais
  recente do repositório). Usar timestamps sequenciais a partir dela:
  1. `1784306070000-CreateCharacteristicsTable.ts` — cria a tabela
     `characteristics` (`id` uuid `DEFAULT gen_random_uuid()`, `created_at`,
     `updated_at`, `name character varying NOT NULL`, `description text`,
     `CONSTRAINT "PK_characteristics_id" PRIMARY KEY ("id")`) e o índice único
     `IDX_characteristics_name` em `name` — espelho exato de
     `CreateTalentsTable`, apenas trocando `talents`/`talent` por
     `characteristics`/`characteristic`. `down()`: drop do índice, depois da
     tabela.
  2. `1784306080000-CreateCharacteristicTagsTable.ts` — cria a tabela de junção
     `characteristic_tags` (`characteristic_id uuid NOT NULL`,
     `tag_id uuid NOT NULL`, PK composta `PK_characteristic_tags`), índices
     individuais `IDX_characteristic_tags_characteristic_id` e
     `IDX_characteristic_tags_tag_id`, e duas FKs
     (`FK_characteristic_tags_characteristic_id` → `characteristics(id)`,
     `FK_characteristic_tags_tag_id` → `tags(id)`), ambas `ON DELETE CASCADE ON
     UPDATE NO ACTION` — espelho exato de `CreateTalentTagsTable`. `down()`:
     drop das 2 FKs, dos 2 índices, depois da tabela (ordem inversa).
  3. `1784306090000-AddCharacteristicToEntityLinksTable.ts` — altera
     `entity_links` para incluir as duas novas colunas:
     - `ALTER TABLE "entity_links" ADD COLUMN "owner_characteristic_id" uuid`
     - `ALTER TABLE "entity_links" ADD COLUMN "target_characteristic_id" uuid`
     - Adicionar FKs `FK_entity_links_owner_characteristic_id` (
       `owner_characteristic_id` → `characteristics(id)`) e
       `FK_entity_links_target_characteristic_id` (`target_characteristic_id` →
       `characteristics(id)`), ambas `ON DELETE CASCADE ON UPDATE NO ACTION`.
     - Adicionar novo índice `IDX_entity_links_link_type_owner_characteristic_id`
       em `("link_type", "owner_characteristic_id")` — mesmo padrão dos 4 índices
       já existentes por tipo de owner.
     - **Recriar (drop + create)** as duas check constraints, já que Postgres não
       permite alterar o corpo de um `CHECK` existente:
       - `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_owner_exclusive"`
         seguido de
         `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id, owner_characteristic_id) = 1)`.
       - Mesma coisa para `CK_entity_links_target_exclusive`, incluindo
         `target_characteristic_id`.
     - **Recriar (drop + create)** o índice único de combinação: `DROP INDEX
       "public"."IDX_entity_links_unique_combination"` seguido de
       `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "owner_characteristic_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id", "target_characteristic_id")`.
     - `down()` completo e na ordem inversa exata: recriar o unique index antigo
       (sem as colunas de característica) e as 2 checks antigas (sem
       `owner_characteristic_id`/`target_characteristic_id`), remover o novo
       índice por tipo, remover as 2 FKs novas, remover as 2 colunas novas —
       deixando `entity_links` bit a bit igual ao estado produzido por
       `1784306060000-CreateEntityLinks.ts`.
- Revisar o SQL final gerado (se usar `npm run migration:generate`) contra o
  descrito acima antes de finalizar, especialmente a recriação dos 2 `CHECK` e do
  `UNIQUE INDEX` de `entity_links` — o TypeORM pode gerar essas alterações em
  ordem/forma ligeiramente diferente da manual; o resultado final precisa ser
  equivalente ao especificado.

#### Controller

Módulo Nest completo (`CharacteristicsController`, `CharacteristicsService`,
`CharacteristicsModule`), espelhando integralmente
`app-api/src/modules/talents/talents.controller.ts` /
`talents.service.ts` / `talents.module.ts`, incluindo suporte a
`improvedFrom`/`requirements` via `EntityLinksService`.

- Endpoints:
  - `POST /characteristics` — cria uma característica; body aceita `name`
    (obrigatório), `description?`, `tagIds?`, `improvedFrom?`, `requirements?`;
    resposta `CharacteristicResponseDto` (incluindo `improvedFrom`/`requirements`
    resolvidos).
  - `GET /characteristics` — lista paginada com filtro opcional por `name`
    (`ILIKE`), `page?`, `perPage?`; resposta `PaginatedCharacteristicsResponseDto`.
  - `GET /characteristics/:id` — busca por id; 404 pt-BR
    ("Característica não encontrada.") se não existir; resposta
    `CharacteristicResponseDto`.
  - `PUT /characteristics/:id` — atualiza (mesma lógica de nome único, tags e
    par efetivo de `improvedFrom`/`requirements` do `TalentsService.update`);
    409 pt-BR se novo nome já existir.
  - `DELETE /characteristics/:id` — remove (204); 404 pt-BR se não encontrado;
    cascata de `entity_links` (owner e target) resolvida pelo `ON DELETE CASCADE`
    das novas FKs, sem lógica adicional no `remove()`.
- DTOs (`app-api/src/modules/characteristics/dto/`):
  - `CreateCharacteristicDto` — idêntico a `CreateTalentDto`: `name` (`@IsString @IsNotEmpty`),
    `description?` (`@IsOptional @IsString`), `tagIds?` (`@IsOptional @IsArray @IsUUID('4', { each: true })`),
    `improvedFrom?`/`requirements?` (`@IsOptional @IsArray @ValidateNested({ each: true }) @Type(() => EntityReferenceInputDto)`).
  - `UpdateCharacteristicDto extends PartialType(CreateCharacteristicDto)`.
  - `FindCharacteristicsQueryDto` — idêntico a `FindTalentsQueryDto`: `name?`,
    `page?`, `perPage?`.
  - `CharacteristicResponseDto` — idêntico a `TalentResponseDto`: `id`, `name`,
    `description`, `tags` (`TagResponseDto[]`), `improvedFrom`/`requirements`
    (`EntityReferenceResponseDto[]`), `createdAt`, `updatedAt`, com
    `static fromEntity(characteristic, improvedFrom, requirements)`.
  - `CharacteristicListItemResponseDto` — idêntico a `TalentListItemResponseDto`:
    `id`, `name`, `tags`, com `static fromEntity(characteristic)`.
  - `PaginatedCharacteristicsResponseDto` — idêntico a
    `PaginatedTalentsResponseDto`: `data`, `total`, `page`, `perPage`,
    `totalPages`.
- `CharacteristicsService` — espelho de `TalentsService`: `findByName`,
  `findById` (retorna `{ characteristic, improvedFrom, requirements }` via
  `entityLinksService.loadReferencesFor(ReferenceableEntityType.CHARACTERISTIC, id)`),
  `findTagsByIds`, `create` (valida nome único, resolve tags,
  `validateLists`/`resolveReferences`/`replaceLinks` para `improvedFrom` e
  `requirements` com `ReferenceableEntityType.CHARACTERISTIC`), `findAllPaginated`
  (mesmo padrão de 2 consultas — ids+total paginados, depois carga completa com
  `relations: { tags: true }` — usado por `TalentsService.findAllPaginated`),
  `update` (nome único condicional, tags, par efetivo de `improvedFrom`/
  `requirements` antes de `validateLists`) e `remove` (delete simples).
- `CharacteristicsModule`: `TypeOrmModule.forFeature([Characteristic, Tag])` +
  `EntityLinksModule`, `controllers: [CharacteristicsController]`,
  `providers: [CharacteristicsService]`, `exports: [CharacteristicsService]` —
  idêntico a `TalentsModule`. Registrar `CharacteristicsModule` em `imports` de
  `app-api/src/app.module.ts`.
- Acesso Google: read-only (padrão) — `@UseGuards(JwtAuthGuard, GoogleAccessGuard)`
  + `@GoogleAccess('read-only')` a nível de controller, idêntico a
  `TalentsController` (usuários Google bloqueados de `POST`/`PUT`/`DELETE`,
  liberados para `GET`). O pedido não indicou nível de acesso diferente do padrão
  usado por `talents`, então nenhum outro nível é aplicado.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger, seguindo o padrão já usado em `TalentsController`/DTOs de
  `talents`:
  - `@ApiTags('characteristics')`, `@ApiBearerAuth()` no controller.
  - `@ApiOperation({ summary })` em pt-BR para os 5 endpoints (criar, listar,
    buscar por id, atualizar, remover).
  - `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse` com o DTO de
    resposta correto por endpoint.
  - `@ApiConflictResponse` (nome duplicado; violação de regra em
    `improvedFrom`/`requirements` — autorreferência, duplicata, item em ambas as
    listas), `@ApiNotFoundResponse` (característica, tags ou entidades
    referenciadas não encontradas) e `@ApiBadRequestResponse` (dados inválidos,
    id em formato inválido, `entityType`/`id` inválido em
    `improvedFrom`/`requirements`) em cada endpoint aplicável, com o mesmo texto
    de `talents` adaptado para "característica"/"característica(s)".
  - `@ApiProperty`/`@ApiPropertyOptional` completos em todos os campos de
    `CreateCharacteristicDto`, `UpdateCharacteristicDto`,
    `FindCharacteristicsQueryDto`, `CharacteristicResponseDto`,
    `CharacteristicListItemResponseDto`, `PaginatedCharacteristicsResponseDto`,
    com exemplos em pt-BR análogos aos de `talents`.
  - Atualizar a `description` do `@ApiProperty` de `entityType` em
    `EntityReferenceInputDto`/`EntityReferenceResponseDto` (módulo
    `entity-links`) para mencionar "característica" na enumeração de tipos.
  - Atualizar `@ApiOperation`/`@ApiProperty` de `entityType` em
    `search.controller.ts`/`SearchResultItemResponseDto` para incluir
    "característica" na lista de tipos pesquisáveis.

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Entidade `Characteristic`, migrations (`CreateCharacteristicsTable`,
    `CreateCharacteristicTagsTable`) e módulo completo
    (controller/service/module/dto) equivalentes byte a byte ao padrão de
    `talents`, salvo nomes.
  - `AddCharacteristicToEntityLinksTable`: as 2 colunas novas, as 2 FKs com
    `ON DELETE CASCADE`, o índice por tipo de owner, e principalmente a
    recriação correta (drop + create, não apenas alteração parcial) dos 2
    `CHECK` e do `UNIQUE INDEX` de `entity_links`, incluindo as novas colunas de
    característica — e que o `down()` restaure exatamente o estado anterior
    (idêntico ao produzido por `CreateEntityLinks`).
  - `ReferenceableEntityType.CHARACTERISTIC` tratado em todos os `switch`
    (`repositoryFor`, `ownerColumnFor`, `targetColumnFor`) e em
    `loadReferencesFor` (relations + resolução de `targetCharacteristic`) de
    `entity-links.service.ts`, sem nenhum `case` faltando.
  - `LinkableEntityType.CHARACTERISTIC` integrado em `search.module.ts`/
    `search.service.ts` (repositório injetado e presente no array
    `linkableEntities`), com o mesmo comportamento de bloqueio Google já
    aplicado às demais entidades públicas (características não devem ser
    bloqueadas de busca — apenas campanhas/sessões planejadas são).
  - `@GoogleAccess('read-only')` aplicado em `CharacteristicsController`, sem
    nível de acesso divergente do resto do módulo.
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto
    (nome duplicado, característica/tags/referências não encontradas, regras de
    `improvedFrom`/`requirements`).
  - Nenhum código fora do escopo planejado (sem campos além de
    `name`/`description`/`tags`/`improvedFrom`/`requirements`, sem relação
    bidirecional nova em `Characteristic`, sem alteração em `app-web`).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. A revisão comparou,
lado a lado, cada arquivo novo/alterado desta task com seu equivalente canônico em
`talents` (e, para os pontos de integração genéricos, com o restante dos tipos já
suportados em `entity-links`/`search`), conforme detalhado abaixo:

- **Entidade** — `app-api/src/modules/characteristics/entities/characteristic.entity.ts`
  é idêntica a `app-api/src/modules/talents/entities/talent.entity.ts` (campos
  `name`/`description`, `@Index({ unique: true })`, `tags` via `@ManyToMany`/
  `@JoinTable` com `characteristic_tags`/`characteristic_id`), estendendo
  `BaseEntity` corretamente.
- **Migrations** —
  `app-api/src/database/migrations/1784306070000-CreateCharacteristicsTable.ts` e
  `1784306080000-CreateCharacteristicTagsTable.ts` espelham exatamente
  `CreateTalentsTable`/`CreateTalentTagsTable` (tipos, constraints, nomes de
  índices/FKs, `down()` na ordem inversa correta). A migration
  `1784306090000-AddCharacteristicToEntityLinksTable.ts` adiciona corretamente as 2
  colunas (`owner_characteristic_id`/`target_characteristic_id`), as 2 FKs com
  `ON DELETE CASCADE`, o índice `IDX_entity_links_link_type_owner_characteristic_id`,
  e recria (drop + create, não apenas altera) os 2 `CHECK`
  (`CK_entity_links_owner_exclusive`/`CK_entity_links_target_exclusive`) e o
  `UNIQUE INDEX` (`IDX_entity_links_unique_combination`) incluindo as novas colunas;
  o `down()` reverte na ordem inversa exata, restaurando bit a bit o estado
  produzido por `1784306060000-CreateEntityLinks.ts` (checks e unique index sem as
  colunas de característica, antes de remover índice, FKs e colunas).
- **`entity-links`** —
  `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts` tem
  `CHARACTERISTIC = 'characteristic'`;
  `app-api/src/modules/entity-links/entities/entity-link.entity.ts` tem
  `ownerCharacteristic`/`targetCharacteristic` com `@ManyToOne`/`@JoinColumn`
  corretos e os `@Check`/`@Unique` atualizados;
  `app-api/src/modules/entity-links/entity-links.service.ts` trata
  `ReferenceableEntityType.CHARACTERISTIC` em todos os `switch`
  (`repositoryFor`, `ownerColumnFor`, `targetColumnFor`), e `loadReferencesFor`
  inclui `targetCharacteristic: { tags: true }` nas `relations` e um `if` explícito
  para `targetSpell` antes do fallback para `targetCharacteristic` — sem
  ambiguidade no fallback, como pedido na task;
  `entity-links.module.ts` inclui `Characteristic` no `forFeature`; as
  `description` de `entity-reference-input.dto.ts`/`entity-reference-response.dto.ts`
  mencionam "característica" na enumeração.
- **Busca (`search`)** — `search.module.ts` inclui `Characteristic` no
  `forFeature`; `search.service.ts` injeta o repositório e adiciona
  `{ entityType: LinkableEntityType.CHARACTERISTIC, repository: ... }` ao array
  `linkableEntities`, sem bloqueio Google (apenas `CAMPAIGN`/`PLANNED_SESSION` são
  filtrados para usuários Google, conforme esperado); `linkable-entity-type.enum.ts`
  tem `CHARACTERISTIC = 'characteristic'`; `search.controller.ts` e
  `search-result-item-response.dto.ts` têm os textos descritivos atualizados
  incluindo "característica".
- **Controller/Service/Module/DTOs** —
  `characteristics.controller.ts`, `characteristics.service.ts`,
  `characteristics.module.ts` e todos os DTOs em
  `app-api/src/modules/characteristics/dto/` são equivalentes byte a byte aos
  arquivos correspondentes de `talents` (apenas nomes/textos trocados): rotas,
  guards (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  a nível de controller, sem divergência), documentação Swagger
  (`@ApiTags`/`@ApiOperation`/`@ApiCreatedResponse`/`@ApiOkResponse`/
  `@ApiNoContentResponse`/`@ApiConflictResponse`/`@ApiNotFoundResponse`/
  `@ApiBadRequestResponse`), validação `class-validator` nos DTOs de entrada,
  `fromEntity` nos DTOs de resposta (sem vazar campos internos), mensagens de erro
  em pt-BR consistentes (nome duplicado, característica/tags/referências não
  encontradas, regras de `improvedFrom`/`requirements`), paginação padrão
  (`page`/`perPage` → `{ data, total, page, perPage }` →
  `PaginatedCharacteristicsResponseDto` com `totalPages`), e `remove()` sem lógica
  adicional (cascata via `ON DELETE CASCADE` das FKs).
- **Registro do módulo** — `CharacteristicsModule` está corretamente registrado em
  `imports` de `app-api/src/app.module.ts`.
- **Escopo** — nenhum campo além de `name`/`description`/`tags`/`improvedFrom`/
  `requirements` foi adicionado, nenhuma relação bidirecional nova em
  `Characteristic`, e nenhuma alteração em `app-web` foi encontrada.

Arquivos revisados:
`app-api/src/modules/characteristics/entities/characteristic.entity.ts`,
`app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
`app-api/src/modules/characteristics/dto/update-characteristic.dto.ts`,
`app-api/src/modules/characteristics/dto/find-characteristics-query.dto.ts`,
`app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`,
`app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`,
`app-api/src/modules/characteristics/dto/paginated-characteristics-response.dto.ts`,
`app-api/src/modules/characteristics/characteristics.service.ts`,
`app-api/src/modules/characteristics/characteristics.controller.ts`,
`app-api/src/modules/characteristics/characteristics.module.ts`,
`app-api/src/app.module.ts`,
`app-api/src/database/migrations/1784306070000-CreateCharacteristicsTable.ts`,
`app-api/src/database/migrations/1784306080000-CreateCharacteristicTagsTable.ts`,
`app-api/src/database/migrations/1784306090000-AddCharacteristicToEntityLinksTable.ts`,
`app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`,
`app-api/src/modules/entity-links/entities/entity-link.entity.ts`,
`app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/entity-links/entity-links.module.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`,
`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`,
`app-api/src/modules/search/search.module.ts`,
`app-api/src/modules/search/search.service.ts`,
`app-api/src/modules/search/search.controller.ts`,
`app-api/src/modules/search/dto/search-result-item-response.dto.ts`.
