# Task API: Equipamentos submenu (substituição de Equipamentos por Armas, Armaduras, Acessórios e Escudos)

## Contexto
Ver .claude/tasks/equipamentos-submenu/spec.md

## Etapas

### 1. api-dev

#### Entidade

**Remoção**
- Deletar por completo o módulo `app-api/src/modules/equipment/` (`equipment.controller.ts`, `equipment.service.ts`, `equipment.module.ts`, `entities/equipment.entity.ts`, `entities/equipment-tag.entity.ts`, e os 6 DTOs em `dto/`).
- Remover o import e o registro de `EquipmentModule` em `src/app.module.ts` (linha 24 do import e a entrada `EquipmentModule` na lista de `imports`, hoje logo após `FamiliesModule` e antes de `MaterialsModule`).

**Criação — 4 módulos novos e independentes**

Cada módulo replica exatamente a estrutura de `materials/` (referência mais fiel, já que `Material` já nasce com `price`/`currency`/tags com `order` no formato final — `equipment/` é útil como referência de comportamento/mensagens, mas seu schema evoluiu por 3 migrations sucessivas que não devem ser replicadas). Convenção de nomes: entidade no singular (`Weapon`, `Armor`, `Accessory`, `Shield`), módulo/controller/service no plural (`WeaponsModule`, `WeaponsController`, `WeaponsService` etc.), igual ao padrão `Material`/`MaterialsModule`.

Campos idênticos nas 4 entidades principais (mesmos tipos/constraints de `Equipment`/`Material` hoje):
- `name` (`varchar`, `NOT NULL`, índice único) — obrigatório e único por entidade.
- `referenceImage` → coluna `reference_image` (`varchar`, nullable).
- `description` (`text`, nullable, HTML).
- `price` (`integer`, nullable).
- `currency` → `ManyToOne(() => Currency, { nullable: true, onDelete: 'SET NULL' })`, `@JoinColumn({ name: 'currency_id' })`; `currencyId` obrigatório no DTO de criação quando `price` é informado (mesma regra de `CreateEquipmentDto`/`ValidateIf`).
- `privateInformation` → coluna `private_information` (`text`, nullable).
- `tags` (não mapeado como coluna própria — carregado via `loadOrderedTagsForOwner`/`loadOrderedTagsMap` a partir da tabela de junção, igual a `Equipment.tags`).

Entidades de junção de tags (uma por módulo), campos idênticos a `EquipmentTag`/`MaterialTag`:
- `order` (`int`, default `0`).
- `<owner>` → `ManyToOne(() => <Entity>, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: '<owner>_id' })`.
- `tag` → `ManyToOne(() => Tag, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'tag_id' })`.
- `@Unique(['<owner>', 'tag'])` na classe.

Detalhamento por entidade:

| Entidade | Pasta do módulo | Entidade principal | Tabela principal | Entidade de junção | Tabela de junção | Coluna dona na junção |
|---|---|---|---|---|---|---|
| Armas | `app-api/src/modules/weapons/` | `Weapon` | `weapons` | `WeaponTag` | `weapon_tags` | `weapon_id` |
| Armaduras | `app-api/src/modules/armors/` | `Armor` | `armors` | `ArmorTag` | `armor_tags` | `armor_id` |
| Acessórios | `app-api/src/modules/accessories/` | `Accessory` | `accessories` | `AccessoryTag` | `accessory_tags` | `accessory_id` |
| Escudos | `app-api/src/modules/shields/` | `Shield` | `shields` | `ShieldTag` | `shield_tags` | `shield_id` |

Cada `<X>sModule` importa `TypeOrmModule.forFeature([<Entity>, <Entity>Tag, Tag, Currency])`, declara `controllers: [<X>sController]`, `providers: [<X>sService]`, `exports: [<X>sService]` (igual a `MaterialsModule`).

Cada `<X>sService` replica `EquipmentService`/`MaterialsService` linha a linha (adaptando nomes): `findByName`, `findById` (com `relations: { currency: true }` + `loadOrderedTagsForOwner`), `findTagsByIds` (lança `NotFoundException('Uma ou mais tags não foram encontradas.')`), `findCurrencyById` (lança `NotFoundException('Moeda não encontrada.')`), `create` (checa nome duplicado com `ConflictException`, resolve tags/currency, `createOrderedTagJunctions`), `findAllPaginated` (query builder com filtro `ILIKE` por `name`, paginação via `DEFAULT_PAGE`/`DEFAULT_PER_PAGE`, batch load de tags via `loadOrderedTagsMap`), `update` (mesmas regras de `price`/`currencyId`/`tagIds` com `replaceOrderedTagJunctions`), `remove`. Mensagens de erro em pt-BR adaptadas ao gênero de cada palavra:
- Armas (fem.): "Já existe uma arma com este nome.", "Arma não encontrada."
- Armaduras (fem.): "Já existe uma armadura com este nome.", "Armadura não encontrada."
- Acessórios (masc.): "Já existe um acessório com este nome.", "Acessório não encontrado."
- Escudos (masc.): "Já existe um escudo com este nome.", "Escudo não encontrado."

Registrar os 4 novos módulos em `src/app.module.ts` (import + `imports[]`), no lugar onde `EquipmentModule` estava (ou em sequência logo após `FamiliesModule`), na ordem Weapons, Armors, Accessories, Shields.

#### Migration

Necessária: sim — `synchronize` é `false`, toda mudança de schema exige migration em `src/database/migrations/`.

O estado final consolidado a replicar (verificado em `1784305710000-CreateEquipmentTable.ts` + `1784305720000-CreateEquipmentTagsTable.ts` + `1784306140000-ChangePriceAndAddCurrencyToItemTables.ts` + `1784306280000-AddOrderToTagJunctionTables.ts`, e confirmado igual em `materials`) é:

- Tabela principal (`weapons`/`armors`/`accessories`/`shields`): `id uuid PK DEFAULT gen_random_uuid()`, `created_at`/`updated_at TIMESTAMP NOT NULL DEFAULT now()`, `name character varying NOT NULL` com índice único (`IDX_<tabela>_name`), `reference_image character varying` nullable, `description text` nullable, `price integer` nullable, `currency_id uuid` nullable com FK `FK_<tabela>_currency_id` para `currencies(id) ON DELETE SET NULL`, `private_information text` nullable. As novas tabelas devem nascer já com `price` como `integer` e a coluna `currency_id`/FK — **não** replicar o passo intermediário em que `price` era `character varying` sem moeda.
- Tabela de junção (`weapon_tags`/`armor_tags`/`accessory_tags`/`shield_tags`): `id uuid PK DEFAULT gen_random_uuid()` (constraint `PK_<tabela>_id`), `created_at`/`updated_at TIMESTAMP NOT NULL DEFAULT now()`, `order integer NOT NULL DEFAULT 0`, `<owner>_id uuid NOT NULL` com FK `FK_<tabela>_<owner>_id` para `<tabela_principal>(id) ON DELETE CASCADE`, `tag_id uuid NOT NULL` com FK `FK_<tabela>_tag_id` para `tags(id) ON DELETE CASCADE`, índice único composto `IDX_<tabela>_<owner>_id_tag_id` em (`<owner>_id`, `tag_id`), e índices simples `IDX_<tabela>_<owner>_id` e `IDX_<tabela>_tag_id`. As novas tabelas devem nascer já com PK simples em `id` — **não** replicar a PK composta `(<owner>_id, tag_id)` que `equipment_tags` teve originalmente antes de `AddOrderToTagJunctionTables`.

Migrations a criar (timestamps sequenciais a partir do último existente, `1784306440000-AddHitPointsToSheetsTable.ts`; nomes/ordem sugeridos, `up`/`down` completos em cada uma):

1. `1784306450000-DropEquipmentTables.ts` — `up()`: dropa `equipment_tags` (constraints/índices/tabela) e depois `equipment` (índice/tabela), na ordem inversa da criação (junção antes da tabela principal, por causa da FK). `down()`: recria ambas as tabelas no formato final consolidado acima (para manter a migration reversível, seguindo o padrão do restante do projeto), sem restaurar dados.
2. `1784306460000-CreateWeaponsTable.ts` — cria `weapons` já no formato final.
3. `1784306470000-CreateWeaponTagsTable.ts` — cria `weapon_tags` já no formato final.
4. `1784306480000-CreateArmorsTable.ts` — cria `armors` já no formato final.
5. `1784306490000-CreateArmorTagsTable.ts` — cria `armor_tags` já no formato final.
6. `1784306500000-CreateAccessoriesTable.ts` — cria `accessories` já no formato final.
7. `1784306510000-CreateAccessoryTagsTable.ts` — cria `accessory_tags` já no formato final.
8. `1784306520000-CreateShieldsTable.ts` — cria `shields` já no formato final.
9. `1784306530000-CreateShieldTagsTable.ts` — cria `shield_tags` já no formato final.

Sem migração/preservação de dados de `equipment`/`equipment_tags` (drop puro, conforme escopo confirmado).

#### Controller

Cada um dos 4 controllers replica exatamente `MaterialsController`/`EquipmentController` (5 endpoints, mesmas guards, mesma estrutura de resposta):

- **Weapons** (`WeaponsController`, `@ApiTags('weapons')`, `@Controller('weapons')`):
  - `POST /weapons` — cria uma arma. DTO: `CreateWeaponDto`. Resposta: `WeaponResponseDto`.
  - `GET /weapons` — lista paginada com filtro por `name`. Query: `FindWeaponsQueryDto`. Resposta: `PaginatedWeaponsResponseDto` (`data: WeaponListItemResponseDto[]`).
  - `GET /weapons/:id` — busca por id. Resposta: `WeaponResponseDto`.
  - `PUT /weapons/:id` — atualiza. DTO: `UpdateWeaponDto` (`PartialType(CreateWeaponDto)`). Resposta: `WeaponResponseDto`.
  - `DELETE /weapons/:id` — remove (204 No Content).
- **Armors** (`ArmorsController`, `@ApiTags('armors')`, `@Controller('armors')`):
  - `POST /armors`, `GET /armors`, `GET /armors/:id`, `PUT /armors/:id`, `DELETE /armors/:id`.
  - DTOs: `CreateArmorDto`, `UpdateArmorDto`, `FindArmorsQueryDto`, `ArmorResponseDto`, `ArmorListItemResponseDto`, `PaginatedArmorsResponseDto`.
- **Accessories** (`AccessoriesController`, `@ApiTags('accessories')`, `@Controller('accessories')`):
  - `POST /accessories`, `GET /accessories`, `GET /accessories/:id`, `PUT /accessories/:id`, `DELETE /accessories/:id`.
  - DTOs: `CreateAccessoryDto`, `UpdateAccessoryDto`, `FindAccessoriesQueryDto`, `AccessoryResponseDto`, `AccessoryListItemResponseDto`, `PaginatedAccessoriesResponseDto`.
- **Shields** (`ShieldsController`, `@ApiTags('shields')`, `@Controller('shields')`):
  - `POST /shields`, `GET /shields`, `GET /shields/:id`, `PUT /shields/:id`, `DELETE /shields/:id`.
  - DTOs: `CreateShieldDto`, `UpdateShieldDto`, `FindShieldsQueryDto`, `ShieldResponseDto`, `ShieldListItemResponseDto`, `PaginatedShieldsResponseDto`.

Cada `Create<X>Dto` segue exatamente `CreateEquipmentDto`/`CreateMaterialDto`: `name` (`@IsString @IsNotEmpty`), `referenceImage` (`@IsOptional @IsUrl`), `description` (`@IsOptional @IsString`), `price` (`@IsOptional @IsInt @Min(0)`), `currencyId` (`@ValidateIf` quando `price` informado, `@IsUUID('4')`), `privateInformation` (`@IsOptional @IsString`), `tagIds` (`@IsOptional @IsArray @IsUUID('4', { each: true })`). `Update<X>Dto extends PartialType(Create<X>Dto)`. `Find<X>sQueryDto` com `name`, `page`, `perPage` (padrão `find-equipment-query.dto.ts`/`find-materials-query.dto.ts`). `<X>ResponseDto`/`<X>ListItemResponseDto` com `static fromEntity`, incluindo `currency: CurrencyResponseDto | null` e `tags: TagResponseDto[]` na ordem de inserção. `Paginated<X>sResponseDto` com `data`, `total`, `page`, `perPage`, `totalPages`.

Todas as rotas protegidas por `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@ApiBearerAuth()`.

**Acesso Google**: `read-only` (padrão) nos 4 controllers — mesmo nível que `EquipmentController`/`MaterialsController` têm hoje; nada no spec indica necessidade de nível diferente.

**Integração com busca global (`search`)**:
- `src/modules/search/search.module.ts`: remover import/registro de `Equipment` em `TypeOrmModule.forFeature([...])`; adicionar `Weapon`, `Armor`, `Accessory`, `Shield` no lugar (import de `entities/weapon.entity.ts` etc.).
- `src/modules/search/search.service.ts`: remover injeção de `equipmentRepository`/import de `Equipment`; injetar `weaponsRepository`, `armorsRepository`, `accessoriesRepository`, `shieldsRepository` (mesmo padrão dos demais `@InjectRepository`); no array `linkableEntities` dentro de `search()`, substituir a entrada `{ entityType: LinkableEntityType.EQUIPMENT, repository: this.equipmentRepository }` por 4 entradas equivalentes (`WEAPON`/`ARMOR`/`ACCESSORY`/`SHIELD`), sem nenhuma lógica especial de filtro (mesma cobertura simples de `ILIKE` em `name` que `Equipment` tem hoje — sem o tratamento adicional que `CAMPAIGN`/`PLANNED_SESSION` recebem).
- `src/modules/search/enums/linkable-entity-type.enum.ts`: remover `EQUIPMENT = 'equipment'`; adicionar, na mesma posição do enum, `WEAPON = 'weapon'`, `ARMOR = 'armor'`, `ACCESSORY = 'accessory'`, `SHIELD = 'shield'` (valores em inglês, minúsculos, seguindo a convenção existente dos demais valores do enum).
- `src/modules/search/dto/search-result-item-response.dto.ts`: atualizar a descrição do `@ApiProperty` de `entityType` (lista textual em pt-BR dos tipos linkáveis), trocando "equipamento" por "arma, armadura, acessório, escudo" na enumeração.

## Sinalização de lacuna (não é decisão de arquitetura)
O `spec.md` não define os valores literais (strings) dos 4 novos membros de `LinkableEntityType`. Este plano assume `weapon`/`armor`/`accessory`/`shield` por consistência direta com o padrão já usado no enum (ex.: `MATERIAL = 'material'`, `CONSUMABLE = 'consumable'`), mas não há confirmação explícita do usuário sobre esses valores — vale uma checagem rápida antes/durante a implementação caso haja preferência diferente (ex.: nomes em português).

Decisão do orquestrador: confirmado o uso literal de `WEAPON = 'weapon'`, `ARMOR = 'armor'`, `ACCESSORY = 'accessory'`, `SHIELD = 'shield'`, implementado conforme o plano.

Status: concluído (com uma pendência de execução registrada abaixo)
Entidade: `app-api/src/modules/weapons/entities/weapon.entity.ts` + `entities/weapon-tag.entity.ts`, `app-api/src/modules/armors/entities/armor.entity.ts` + `entities/armor-tag.entity.ts`, `app-api/src/modules/accessories/entities/accessory.entity.ts` + `entities/accessory-tag.entity.ts`, `app-api/src/modules/shields/entities/shield.entity.ts` + `entities/shield-tag.entity.ts`
Migration:
- `app-api/src/database/migrations/1784306450000-DropEquipmentTables.ts`
- `app-api/src/database/migrations/1784306460000-CreateWeaponsTable.ts`
- `app-api/src/database/migrations/1784306470000-CreateWeaponTagsTable.ts`
- `app-api/src/database/migrations/1784306480000-CreateArmorsTable.ts`
- `app-api/src/database/migrations/1784306490000-CreateArmorTagsTable.ts`
- `app-api/src/database/migrations/1784306500000-CreateAccessoriesTable.ts`
- `app-api/src/database/migrations/1784306510000-CreateAccessoryTagsTable.ts`
- `app-api/src/database/migrations/1784306520000-CreateShieldsTable.ts`
- `app-api/src/database/migrations/1784306530000-CreateShieldTagsTable.ts`
Rotas:
- POST /weapons, GET /weapons, GET /weapons/:id, PUT /weapons/:id, DELETE /weapons/:id
- POST /armors, GET /armors, GET /armors/:id, PUT /armors/:id, DELETE /armors/:id
- POST /accessories, GET /accessories, GET /accessories/:id, PUT /accessories/:id, DELETE /accessories/:id
- POST /shields, GET /shields, GET /shields/:id, PUT /shields/:id, DELETE /shields/:id
Arquivos:
- Weapons: `app-api/src/modules/weapons/dto/{create-weapon,update-weapon,find-weapons-query,weapon-response,weapon-list-item-response,paginated-weapons-response}.dto.ts`, `weapons.service.ts`, `weapons.controller.ts`, `weapons.module.ts`
- Armors: `app-api/src/modules/armors/dto/{create-armor,update-armor,find-armors-query,armor-response,armor-list-item-response,paginated-armors-response}.dto.ts`, `armors.service.ts`, `armors.controller.ts`, `armors.module.ts`
- Accessories: `app-api/src/modules/accessories/dto/{create-accessory,update-accessory,find-accessories-query,accessory-response,accessory-list-item-response,paginated-accessories-response}.dto.ts`, `accessories.service.ts`, `accessories.controller.ts`, `accessories.module.ts`
- Shields: `app-api/src/modules/shields/dto/{create-shield,update-shield,find-shields-query,shield-response,shield-list-item-response,paginated-shields-response}.dto.ts`, `shields.service.ts`, `shields.controller.ts`, `shields.module.ts`
- `app-api/src/app.module.ts` (removido `EquipmentModule`, registrados `WeaponsModule`/`ArmorsModule`/`AccessoriesModule`/`ShieldsModule`)
- `app-api/src/modules/search/search.module.ts` e `search.service.ts` (substituição de `Equipment` pelas 4 novas entidades no `TypeOrmModule.forFeature` e no array `linkableEntities`)
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` (substituição de `EQUIPMENT` pelos 4 novos valores)
- `app-api/src/modules/search/dto/search-result-item-response.dto.ts` (descrição de `entityType` atualizada)

Pendência (limitação de ferramentas do agente api-dev, não decisão de arquitetura): a remoção completa da pasta `app-api/src/modules/equipment/` (controller, service, module, entidades, DTOs) e das duas migrations originais de criação (`1784305710000-CreateEquipmentTable.ts`, `1784305720000-CreateEquipmentTagsTable.ts` — que devem ser mantidas, pois fazem parte do histórico de migrations já aplicadas; apenas os arquivos do módulo em `src/modules/equipment/` precisam ser apagados) **não pôde ser executada**, pois o agente api-dev só tem acesso às ferramentas Read/Grep/Glob/Edit/Write/Skill, sem capacidade de exclusão de arquivo. Todo o código que referenciava `equipment` foi desregistrado (removido de `app.module.ts`, `search.module.ts`, `search.service.ts`, `linkable-entity-type.enum.ts`), então o módulo ficou órfão (nenhum arquivo do projeto mais importa nada de `src/modules/equipment/`) mas os arquivos físicos ainda existem em `app-api/src/modules/equipment/`. É necessário que um agente/passo com capacidade de exclusão de arquivo (ex.: via shell) apague essa pasta antes de considerar a demanda 100% concluída.

### 2. api-dev-doc
- Depende da etapa 1.
- Conferir Swagger (`/docs`) dos 4 novos controllers: tags (`weapons`, `armors`, `accessories`, `shields`), `@ApiOperation`, `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`/`@ApiNotFoundResponse`/`@ApiConflictResponse`/`@ApiBadRequestResponse` em cada endpoint (replicando exatamente as descrições de `EquipmentController`/`MaterialsController`, adaptadas ao gênero/nome de cada entidade).
- Conferir `@ApiProperty`/`@ApiPropertyOptional` de todos os DTOs novos (exemplos coerentes com armas/armaduras/acessórios/escudos, ex.: `name: 'Espada Longa'` para Weapon, `name: 'Armadura de Placas'` para Armor, `name: 'Anel de Proteção'` para Accessory, `name: 'Escudo de Torre'` para Shield).
- Conferir que o módulo `equipment` não deixou nenhum resquício de documentação (tag `equipment` no Swagger deve desaparecer).
- Conferir a descrição atualizada de `entityType` em `SearchResultItemResponseDto`.

Status: concluído

## Revisão

Aprovado. Nenhum problema de código, nomenclatura, DTOs/validação, tratamento de erros, segurança, guards de acesso Google ou consistência migration↔entidade encontrado nos arquivos revisados.

Pontos conferidos em detalhe:
- **Entidades e migrations (Weapon/Armor/Accessory/Shield + `*_tags`)**: as 4 entidades principais (`weapon.entity.ts`, `armor.entity.ts`, `accessory.entity.ts`, `shield.entity.ts`) e as 4 entidades de junção (`weapon-tag.entity.ts`, `armor-tag.entity.ts`, `accessory-tag.entity.ts`, `shield-tag.entity.ts`) reproduzem campo a campo o schema final consolidado de `Material`/`MaterialTag` (`id uuid`/`created_at`/`updated_at` via `BaseEntity`, `name` único, `reference_image`, `description`, `price integer` nullable, `currency` `ManyToOne` nullable com `onDelete: 'SET NULL'`, `private_information`, `order int default 0`, `@Unique(['<owner>', 'tag'])`). Todas as 9 migrations (`1784306450000` a `1784306530000`) foram lidas e conferem exatamente com as entidades: colunas, tipos, nullability, nomes de constraint (`PK_<tabela>_id`, `FK_<tabela>_currency_id`, `FK_<tabela>_<owner>_id`, `FK_<tabela>_tag_id`), índice único de nome (`IDX_<tabela>_name`), índice único composto (`IDX_<tabela>_<owner>_id_tag_id`) e os dois índices simples (`IDX_<tabela>_<owner>_id`, `IDX_<tabela>_tag_id`). As tabelas de junção já nascem com PK simples em `id` (não a PK composta legada) e `price`/`currency_id` já nascem no formato final (sem repetir o passo intermediário de `price character varying`).
- **Reversibilidade `up`/`down`**: em todas as 9 migrations o `down()` desfaz exatamente o que o `up()` fez, na ordem inversa (constraints/índices antes das tabelas). `1784306450000-DropEquipmentTables.ts` dropa `equipment_tags` (constraints/índices/tabela) antes de `equipment` (respeitando a FK), e seu `down()` recria `equipment` + índice + FK antes de `equipment_tags` — ordem coerente com a FK entre elas. As 4 migrations `Create<X>Tags` dropam a junção antes da tabela principal na cadeia de migrations seguinte, e cada uma dropa/recria apenas o que criou.
- **Remoção de `equipment`**: confirmado via grep em `app-api/src` que nenhum arquivo ativo (fora da própria pasta órfã `src/modules/equipment/` e das migrations históricas de criação, que devem mesmo ser preservadas) referencia `equipment`/`Equipment`. `app.module.ts` não importa mais `EquipmentModule` e já registra `WeaponsModule`, `ArmorsModule`, `AccessoriesModule`, `ShieldsModule` na ordem esperada. `search.module.ts` e `search.service.ts` substituíram `Equipment`/`equipmentRepository` pelas 4 novas entidades/repositórios sem lógica de filtro especial adicional (mesma cobertura simples de `ILIKE` em `name`). O enum `LinkableEntityType` tem `WEAPON`/`ARMOR`/`ACCESSORY`/`SHIELD` no lugar de `EQUIPMENT`, com os valores confirmados pelo orquestrador (`'weapon'`, `'armor'`, `'accessory'`, `'shield'`). A descrição do `@ApiProperty` de `entityType` em `search-result-item-response.dto.ts` já lista "arma, armadura, acessório, escudo" em vez de "equipamento".
- **Padrão do projeto / DTOs / paginação / guards**: os 4 controllers usam `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` + `@ApiBearerAuth()`, replicando exatamente `MaterialsController`. Todos os DTOs de resposta (`*ResponseDto`, `*ListItemResponseDto`) implementam `static fromEntity` e não vazam nenhum campo interno; `currency`/`tags` são mapeados via os DTOs correspondentes. A paginação segue o padrão `{ data, total, page, perPage }` no service e `totalPages: Math.ceil(total / perPage)` calculado no controller, com `Paginated<X>sResponseDto` correto em cada módulo. Os helpers `loadOrderedTagsForOwner`/`loadOrderedTagsMap`/`createOrderedTagJunctions`/`replaceOrderedTagJunctions` de `common/utils/ordered-tags.util.ts` são reutilizados sem duplicação de lógica.
- **Mensagens de erro em pt-BR com concordância de gênero**: conferido gênero correto em cada módulo — Weapons/Armors (fem.: "Já existe uma arma/armadura com este nome.", "Arma/Armadura não encontrada."), Accessories/Shields (masc.: "Já existe um acessório/escudo com este nome.", "Acessório/Escudo não encontrado.").
- **Swagger (etapa `api-dev-doc`)**: `@ApiTags`, `@ApiOperation`, `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`/`@ApiNotFoundResponse`/`@ApiConflictResponse`/`@ApiBadRequestResponse` presentes e coerentes em todos os endpoints dos 4 controllers, com exemplos de `@ApiProperty`/`@ApiPropertyOptional` adequados a cada entidade (`Espada Longa`, `Armadura de Placas`, `Anel de Proteção`, `Escudo de Torre`).

Arquivos revisados: `app-api/src/modules/weapons/**`, `app-api/src/modules/armors/**`, `app-api/src/modules/accessories/**`, `app-api/src/modules/shields/**`, `app-api/src/database/migrations/1784306450000-DropEquipmentTables.ts` a `1784306530000-CreateShieldTagsTable.ts`, `app-api/src/app.module.ts`, `app-api/src/modules/search/search.module.ts`, `app-api/src/modules/search/search.service.ts`, `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`, `app-api/src/modules/search/dto/search-result-item-response.dto.ts`, `app-api/src/common/utils/ordered-tags.util.ts`, `app-api/src/common/entities/base.entity.ts`.

**Pendência de limpeza (não é erro de implementação das etapas 1-2)**: a pasta `app-api/src/modules/equipment/` (controller, service, module, entidades, DTOs) ainda existe fisicamente em disco, órfã — nenhum arquivo ativo do projeto mais a importa (confirmado via busca por `equipment`/`Equipment` em `app-api/src`), mas os agentes `api-dev`/`api-dev-doc` não têm capacidade de excluir arquivos. É necessário um passo manual/separado (ex.: via shell, `rm -r app-api/src/modules/equipment/`) para apagar essa pasta antes de considerar a demanda `equipamentos-submenu` 100% concluída. As duas migrations originais (`1784305710000-CreateEquipmentTable.ts`, `1784305720000-CreateEquipmentTagsTable.ts`) foram corretamente preservadas, pois fazem parte do histórico de migrations já aplicadas.

### 3. api-dev-codereviewer
- Revisar tudo acima: remoção completa e limpa de `equipment` (módulo, registro em `app.module.ts`, referências em `search`), consistência dos 4 novos módulos com o padrão `materials`/`equipment` (nomes de arquivos, classes, mensagens de erro em pt-BR, uso de `loadOrderedTagsForOwner`/`loadOrderedTagsMap`/`createOrderedTagJunctions`/`replaceOrderedTagJunctions`), corretude das migrations (schema final igual ao consolidado de `equipment`, PK/índices/FKs da tabela de junção já no formato pós-`AddOrderToTagJunctionTables`, reversibilidade de `up`/`down`), nível de acesso Google (`read-only`) e integração completa com a busca global e o enum `LinkableEntityType`.