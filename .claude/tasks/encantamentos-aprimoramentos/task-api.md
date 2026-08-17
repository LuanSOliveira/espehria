# Task API: Encantamentos e Aprimoramentos

## Contexto
Ver .claude/tasks/encantamentos-aprimoramentos/spec.md (se existir)

Não há `spec.md` para esta demanda. O escopo abaixo foi definido diretamente pelo
orquestrador (decisões já fechadas, não reabrir):

Duas entidades novas, irmãs e completamente independentes entre si (sem relação/FK
entre elas): **Encantamentos** (módulo `enchantments`, entidade `Enchantment`, tabela
`enchantments`) e **Aprimoramentos** (módulo `enhancements`, entidade `Enhancement`,
tabela `enhancements`). Ambas têm exatamente os mesmos campos e o mesmo comportamento
de CRUD — apenas nome do módulo/entidade/rota muda entre elas.

Decisão de nomenclatura já tomada e que deve ser registrada aqui: o nome em inglês de
"Aprimoramentos" é **`enhancements`/`Enhancement`**, deliberadamente **não**
`improvements`, para evitar confusão com o módulo já existente `improvement-flaws`
(Melhorias e Defeitos). Os labels em português ficam inteiramente na UI (app-web); a
API só expõe os valores em inglês dos enums.

Nenhuma entidade de referência simples e sem relacionamentos (tags, moeda, seções etc.)
foi encontrada como cópia exata do formato pedido; o módulo `traits` foi usado como base
estrutural mais próxima (nome único indexado, campo de descrição rich text, CRUD +
paginação + filtro, `GoogleAccessGuard` a nível de controller), removendo o
relacionamento com `TraitType`/`Tag` (não fazem parte do escopo pedido) e substituindo
por um enum `type` nativo do Postgres armazenado diretamente na tabela (padrão de
`WeaponHands`/`WeaponStyle` em `weapons.entity.ts` e `ImprovementFlawCategory` em
`improvement-flaw.entity.ts`). O módulo `accessories` foi conferido em paralelo e segue
a mesma estrutura de `traits` (também não serve de base para o enum `type`, que não
existe lá).

## Etapas

### 1. api-dev

#### Entidade

Duplicar integralmente para os dois módulos (`enchantments` e `enhancements`) — apenas
o nome do módulo/entidade/rota muda entre eles.

- Entidade: `Enchantment` (tabela `enchantments`) / `Enhancement` (tabela
  `enhancements`), estendendo `BaseEntity` (`common/entities/base.entity.ts` — já
  fornece `id` uuid, `createdAt`, `updatedAt`).
- Campos (idênticos nas duas entidades):
  - `name: string` — `@Column()` obrigatório, `@Index({ unique: true })` — padrão
    exato de `Trait.name`/`Accessory.name`.
  - `type: EnchantmentType | null` (ou `EnhancementType | null`) — `@Column({ type:
    'enum', enum: EnchantmentType, nullable: true })`, sem `name` customizado na coluna
    (fica `type` mesmo) — padrão de `Weapon.hands`
    (`app-api/src/modules/weapons/entities/weapon.entity.ts:68`).
  - `effect: string | null` — `@Column({ type: 'text', nullable: true })` — mesmo
    tratamento de rich text já usado em `Trait.description`/`Accessory.description`
    (HTML armazenado como texto puro, sem sanitização adicional na entidade).
- Sem relacionamentos: nenhuma `ManyToOne`/`ManyToMany`/`OneToMany` — as duas entidades
  não têm tags, moeda, seções ou vínculo entre si.
- Novos enums próprios por módulo (sem reaproveitar enum entre módulos, conforme
  decisão do orquestrador):
  - `app-api/src/modules/enchantments/enums/enchantment-type.enum.ts`:
    ```ts
    export enum EnchantmentType {
      WEAPON = 'weapon',
      ARMOR = 'armor',
      SHIELD = 'shield',
      ACCESSORY = 'accessory',
    }
    ```
  - `app-api/src/modules/enhancements/enums/enhancement-type.enum.ts`: idêntico, porém
    `EnhancementType`.
- `autoLoadEntities: true` (já configurado em `app.module.ts`) cobre o registro
  automático de `Enchantment` e `Enhancement` — nenhuma alteração manual de entidades
  no TypeORM além de registrar os módulos (ver `app.module.ts` na subseção Controller).

#### Migration

- Necessária: sim (`synchronize: false`; toda alteração de schema precisa de
  migration).
- Uma migration por entidade (`CreateEnchantmentsTable`, `CreateEnhancementsTable`),
  seguindo exatamente o padrão de `1784306600000-CreateTraitsTable.ts` e o de criação
  de enum nativo usado em `1784306220000-CreateImprovementFlawsTable.ts` /
  `1784306660000-AddWeaponPropertiesToWeaponsTable.ts`:
  1. `CREATE TYPE "public"."enchantments_type_enum" AS ENUM('weapon', 'armor',
     'shield', 'accessory')` (nome do tipo segue a convenção TypeORM
     `<tabela>_<coluna>_enum`).
  2. `CREATE TABLE "enchantments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),
     "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL
     DEFAULT now(), "name" character varying NOT NULL, "type"
     "public"."enchantments_type_enum", "effect" text, CONSTRAINT
     "PK_enchantments_id" PRIMARY KEY ("id"))`.
  3. `CREATE UNIQUE INDEX "IDX_enchantments_name" ON "enchantments" ("name")`.
  4. `down()` revertendo na ordem inversa: `DROP INDEX`, `DROP TABLE`, `DROP TYPE`.
  - Equivalente exato para `enhancements`/`enhancements_type_enum`.
- Gerar com `npm run migration:generate -- src/database/migrations/<Nome>` a partir das
  entidades já criadas (ou escrever manualmente seguindo o padrão acima).

#### Controller

Dois módulos Nest completos e paralelos (`EnchantmentsModule` / `EnhancementsModule`),
cada um com `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, `enums/`, seguindo
integralmente `app-api/src/modules/traits/**` como referência de service (métodos
`findByName`, `findById`, `create` com checagem de nome duplicado via
`ConflictException`, `findAllPaginated` com `createQueryBuilder` + `skip`/`take` +
`getManyAndCount`, `update`, `remove`) e de controller/DTOs — porém sem os métodos de
resolução de tags/tipo relacional (`findTagsByIds`, `findTraitTypeById`), já que não há
relacionamentos.

- Endpoints (replicados identicamente para `/enchantments` e `/enhancements`):
  - `POST /enchantments` — cria um encantamento.
  - `GET /enchantments` — lista paginada com filtros opcionais por nome (busca parcial
    ILIKE, mesmo padrão de `FindTraitsQueryDto.name`) e por `type` (igualdade exata) —
    o filtro por `type` é requisito explícito, pois o frontend listará apenas registros
    com `type = weapon` em uma tela futura.
  - `GET /enchantments/:id` — busca por id (404 pt-BR se não encontrado).
  - `PUT /enchantments/:id` — atualiza (409 pt-BR se novo nome já existir).
  - `DELETE /enchantments/:id` — remove (204, 404 pt-BR se não encontrado).
  - Equivalente exato em `/enhancements`.
- DTOs (por módulo, nomeados com o prefixo da entidade):
  - `CreateEnchantmentDto` — `name` (string, `@IsString() @IsNotEmpty()`,
    obrigatório), `type?` (`@IsOptional() @IsEnum(EnchantmentType)`, opcional),
    `effect?` (`@IsOptional() @IsString()`, opcional, suporta HTML — mesmo tratamento
    de `CreateTraitDto.description`/`CreateAccessoryDto.description`, sem validação
    adicional de sanitização).
  - `UpdateEnchantmentDto extends PartialType(CreateEnchantmentDto)`.
  - `FindEnchantmentsQueryDto` — `name?` (`@IsOptional() @IsString()`, busca parcial),
    `type?` (`@IsOptional() @IsEnum(EnchantmentType)`, igualdade exata), `page?`,
    `perPage?` (`@Type(() => Number) @IsInt() @Min(1)`, opcionais) — mesmo padrão de
    `FindTraitsQueryDto`.
  - `EnchantmentResponseDto` (resposta de detalhe) — `id`, `name`, `type`
    (`EnchantmentType | null`), `effect` (`string | null`), `createdAt`, `updatedAt` —
    com `static fromEntity`, mesmo padrão de `TraitResponseDto`.
  - `EnchantmentListItemResponseDto` (resposta enxuta de listagem) — `id`, `name`,
    `type` — sem `effect`, seguindo o padrão já usado em `TraitListItemResponseDto`/
    `AccessoryListItemResponseDto`, que omitem o campo de rich text na listagem.
  - `PaginatedEnchantmentsResponseDto` — `data`
    (`EnchantmentListItemResponseDto[]`), `total`, `page`, `perPage`, `totalPages` —
    idêntico a `PaginatedTraitsResponseDto`.
  - Equivalente exato com prefixo `Enhancement`/`EnhancementType` para o segundo
    módulo.
- `EnchantmentsModule`: `TypeOrmModule.forFeature([Enchantment])`, controller, service,
  `exports: [EnchantmentsService]` — padrão de `TraitsModule`, porém sem `TraitTag`/
  `Tag`/`TraitType` no array (não há relacionamentos). Equivalente para
  `EnhancementsModule`.
- Registrar `EnchantmentsModule` e `EnhancementsModule` em `app-api/src/app.module.ts`
  (import + array `imports`), mesmo padrão de `TraitsModule`/`AccessoriesModule` já
  registrados lá.
- Acesso Google: **read-only (padrão)** — aplicar `@UseGuards(JwtAuthGuard,
  GoogleAccessGuard)` e `@GoogleAccess('read-only')` a nível de controller nos dois
  módulos, restringindo `create`/`update`/`remove` a usuários não-Google, exatamente
  como em `TraitsController`/`AccessoriesController`. Confirmado explicitamente pelo
  orquestrador (não é uma decisão assumida por este agente).

#### Integração com busca (SearchService/SearchController) — requisito explícito

- `LinkableEntityType`
  (`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`): adicionar
  `ENCHANTMENT = 'enchantment'` e `ENHANCEMENT = 'enhancement'`.
- `SearchModule` (`app-api/src/modules/search/search.module.ts`): adicionar
  `Enchantment` e `Enhancement` ao array de `TypeOrmModule.forFeature([...])` e aos
  imports do arquivo.
- `SearchService` (`app-api/src/modules/search/search.service.ts`): injetar
  `Repository<Enchantment>` e `Repository<Enhancement>` no construtor e adicionar as
  duas novas entradas correspondentes no array `linkableEntities` usado pelo método
  `search`, seguindo exatamente o padrão já usado para `Trait` (`{ entityType:
  LinkableEntityType.ENCHANTMENT, repository: this.enchantmentsRepository }`, idem para
  `ENHANCEMENT`). Nenhuma regra especial de visibilidade por `AuthProvider.GOOGLE` é
  necessária (só se aplica a `CAMPAIGN`/`PLANNED_SESSION`, que são recursos privados de
  dono — encantamentos/aprimoramentos são catálogo público, igual a `Trait`).
- `SearchController`/`SearchResultItemResponseDto`: atualizar o texto descritivo de
  `@ApiOperation` (`search`) em `search.controller.ts` e do `@ApiProperty` de
  `entityType` em `search-result-item-response.dto.ts` para mencionar "encantamentos" e
  "aprimoramentos" na lista de entidades pesquisáveis, mantendo consistência com a
  enumeração por extenso já existente.
- Nenhuma alteração adicional de rota/DTO de busca é necessária: o mesmo endpoint
  `GET /search` já cobre a busca das novas entidades assim que estiverem registradas
  aqui.

#### Impacto em `entity-links` — verificado, sem alteração necessária

`app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`
(`ReferenceableEntityType`) é usado exclusivamente para o mecanismo de
Requisitos/Habilidades Adicionais entre `Training`, `Talent`, `Technique`, `Spell`,
`Characteristic` e `Biography` (ver `EntityLinksService`). Encantamentos e
Aprimoramentos não fazem parte dessa lista de entidades vinculáveis por
Requisito/Habilidade Adicional — nem o pedido do orquestrador menciona esse
comportamento para elas. Não há, portanto, nenhuma alteração necessária em
`entity-links` (`entity-link.entity.ts`, `entity-links.service.ts`,
`entity-reference-input.dto.ts`, `entity-reference-response.dto.ts`) para esta
demanda.

Status: concluído
Entidade: app-api/src/modules/enchantments/entities/enchantment.entity.ts, app-api/src/modules/enhancements/entities/enhancement.entity.ts
Migration: app-api/src/database/migrations/1784306750000-CreateEnchantmentsTable.ts, app-api/src/database/migrations/1784306760000-CreateEnhancementsTable.ts
Rotas: POST /enchantments, GET /enchantments, GET /enchantments/:id, PUT /enchantments/:id, DELETE /enchantments/:id, POST /enhancements, GET /enhancements, GET /enhancements/:id, PUT /enhancements/:id, DELETE /enhancements/:id
Arquivos: app-api/src/modules/enchantments/enums/enchantment-type.enum.ts, app-api/src/modules/enchantments/dto/create-enchantment.dto.ts, app-api/src/modules/enchantments/dto/update-enchantment.dto.ts, app-api/src/modules/enchantments/dto/find-enchantments-query.dto.ts, app-api/src/modules/enchantments/dto/enchantment-response.dto.ts, app-api/src/modules/enchantments/dto/enchantment-list-item-response.dto.ts, app-api/src/modules/enchantments/dto/paginated-enchantments-response.dto.ts, app-api/src/modules/enchantments/enchantments.service.ts, app-api/src/modules/enchantments/enchantments.controller.ts, app-api/src/modules/enchantments/enchantments.module.ts, app-api/src/modules/enhancements/enums/enhancement-type.enum.ts, app-api/src/modules/enhancements/dto/create-enhancement.dto.ts, app-api/src/modules/enhancements/dto/update-enhancement.dto.ts, app-api/src/modules/enhancements/dto/find-enhancements-query.dto.ts, app-api/src/modules/enhancements/dto/enhancement-response.dto.ts, app-api/src/modules/enhancements/dto/enhancement-list-item-response.dto.ts, app-api/src/modules/enhancements/dto/paginated-enhancements-response.dto.ts, app-api/src/modules/enhancements/enhancements.service.ts, app-api/src/modules/enhancements/enhancements.controller.ts, app-api/src/modules/enhancements/enhancements.module.ts, app-api/src/app.module.ts (registro dos dois módulos), app-api/src/modules/search/enums/linkable-entity-type.enum.ts (ENCHANTMENT/ENHANCEMENT), app-api/src/modules/search/search.module.ts (Enchantment/Enhancement no forFeature), app-api/src/modules/search/search.service.ts (repositórios + entradas em linkableEntities). Pendência registrada para a etapa api-dev-doc: a atualização textual do @ApiOperation em search.controller.ts e do @ApiProperty de entityType em search-result-item-response.dto.ts (mencionar "encantamentos"/"aprimoramentos") não foi feita aqui, pois é documentação Swagger fina, explicitamente atribuída à etapa 2 pelo próprio texto desta task.
Migration não aplicada ao banco (`npm run migration:run` não foi executado, conforme padrão do projeto — requer confirmação explícita do usuário).

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir, para os dois novos módulos: tags Swagger `@ApiTags('enchantments')` /
  `@ApiTags('enhancements')`, descrição das operações (`@ApiOperation`) de cada
  endpoint (incluindo menção ao filtro por `type` na listagem), respostas de
  sucesso/erro (`@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNotFoundResponse`,
  `@ApiConflictResponse`, `@ApiBadRequestResponse`, `@ApiNoContentResponse`) já
  anotadas nos DTOs/controllers da etapa 1, os `@ApiProperty`/`@ApiPropertyOptional`
  de `type` (com `enum: EnchantmentType`/`enum: EnhancementType`) e `effect` (deixando
  claro no `description` que o campo suporta HTML), e a atualização textual do
  endpoint `GET /search` para mencionar os dois novos tipos pesquisáveis.

Status: concluído
Arquivos alterados: app-api/src/modules/search/search.controller.ts, app-api/src/modules/search/dto/search-result-item-response.dto.ts

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Etapas 1 (`api-dev`) e 2 (`api-dev-doc`) estão marcadas como "Status: concluído" e
foram revisadas em conjunto (os mesmos arquivos foram tocados nas duas etapas).

Pontos verificados e conformes:
- **Consistência migration ↔ entidade**: `enchantment.entity.ts`/`enhancement.entity.ts`
  batem exatamente com `1784306750000-CreateEnchantmentsTable.ts`/
  `1784306760000-CreateEnhancementsTable.ts` — nome de colunas (`name`, `type`,
  `effect`), tipo do enum nativo (`enchantments_type_enum`/`enhancements_type_enum`
  com os 4 valores na mesma ordem da entidade), `nullable` de `type`/`effect`,
  `character varying NOT NULL` para `name`, índice único (`IDX_enchantments_name`/
  `IDX_enhancements_name`) e `down()` revertendo na ordem inversa correta (`DROP
  INDEX` → `DROP TABLE` → `DROP TYPE`). Timestamps das migrations (`...750000`/
  `...760000`) não colidem com nenhuma migration existente e ficam corretamente após
  todas as demais na ordem cronológica.
- **Guards/Google Access**: os dois controllers (`enchantments.controller.ts`,
  `enhancements.controller.ts`) aplicam `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` a nível de classe, idêntico ao padrão de
  `TraitsController`.
- **Filtro por `type`/`name` e contrato paginado**: `findAllPaginated` em ambos os
  services aplica `ILIKE` para `name` e igualdade exata para `type` via
  `createQueryBuilder`, com `skip`/`take`/`getManyAndCount`; os controllers montam a
  resposta com `data`, `total`, `page`, `perPage` e `totalPages` calculado
  (`Math.ceil(total / perPage)`), consistente com `PaginatedEnchantmentsResponseDto`/
  `PaginatedEnhancementsResponseDto` e o padrão de `traits`.
- **Integração com `search`**: `LinkableEntityType` recebeu `ENCHANTMENT`/
  `ENHANCEMENT`; `SearchModule` registra `Enchantment`/`Enhancement` no
  `TypeOrmModule.forFeature`; `SearchService` injeta os dois repositórios e adiciona
  as entradas correspondentes em `linkableEntities`, sem regra especial de
  visibilidade por `AuthProvider.GOOGLE` (correto, pois são catálogo público como
  `Trait`). `search.controller.ts` (`@ApiOperation`) e
  `search-result-item-response.dto.ts` (`@ApiProperty` de `entityType`) foram
  atualizados na etapa 2 mencionando "encantamentos" e "aprimoramentos" na
  enumeração por extenso.
- **Mensagens de erro e `fromEntity`**: `NotFoundException`/`ConflictException` com
  mensagens em pt-BR ("Encantamento não encontrado.", "Já existe um encantamento com
  este nome." e equivalentes para aprimoramento) em `create`/`update`/`remove` dos
  dois services e nos controllers (`findOne`); `EnchantmentResponseDto`/
  `EnhancementResponseDto` e as variantes `*ListItemResponseDto` usam
  `static fromEntity` corretamente, sem vazar nenhum campo além de `id`, `name`,
  `type`, `effect`, `createdAt`, `updatedAt` (não há campos sensíveis nas entidades).
- **DTOs/validação**: `CreateEnchantmentDto`/`CreateEnhancementDto` usam
  `@IsString()`/`@IsNotEmpty()` em `name` e `@IsOptional()`/`@IsEnum(...)` em `type`,
  `@IsOptional()`/`@IsString()` em `effect`; `Update*Dto extends PartialType(Create*Dto)`
  torna todos os campos opcionais na atualização, consistente com `UpdateTraitDto`;
  `Find*QueryDto` segue o mesmo padrão de paginação (`@Type(() => Number)`, `@IsInt()`,
  `@Min(1)`) usado em `FindTraitsQueryDto`.
- **Módulos e registro**: `EnchantmentsModule`/`EnhancementsModule` seguem o padrão de
  `TraitsModule` (`TypeOrmModule.forFeature`, controller, service, `exports`), e ambos
  estão registrados em `app.module.ts`.
- Os dois módulos (`enchantments`/`enhancements`) são espelhos exatos um do outro
  (nomes de classes, mensagens e rotas trocando apenas o prefixo/termo em português),
  sem resíduos de copy-paste (não há referência cruzada a `Enchantment` dentro dos
  arquivos de `enhancements` nem vice-versa).

Arquivos revisados: app-api/src/modules/enchantments/entities/enchantment.entity.ts,
app-api/src/modules/enhancements/entities/enhancement.entity.ts,
app-api/src/database/migrations/1784306750000-CreateEnchantmentsTable.ts,
app-api/src/database/migrations/1784306760000-CreateEnhancementsTable.ts,
app-api/src/modules/enchantments/enums/enchantment-type.enum.ts,
app-api/src/modules/enhancements/enums/enhancement-type.enum.ts,
app-api/src/modules/enchantments/dto/*.ts, app-api/src/modules/enhancements/dto/*.ts,
app-api/src/modules/enchantments/enchantments.service.ts,
app-api/src/modules/enchantments/enchantments.controller.ts,
app-api/src/modules/enchantments/enchantments.module.ts,
app-api/src/modules/enhancements/enhancements.service.ts,
app-api/src/modules/enhancements/enhancements.controller.ts,
app-api/src/modules/enhancements/enhancements.module.ts, app-api/src/app.module.ts,
app-api/src/modules/search/enums/linkable-entity-type.enum.ts,
app-api/src/modules/search/search.module.ts,
app-api/src/modules/search/search.service.ts,
app-api/src/modules/search/search.controller.ts,
app-api/src/modules/search/dto/search-result-item-response.dto.ts.
