# Task API: Itens (Equipamentos, Materiais, Consumíveis, Munições)

## Contexto
Não existe `.claude/tasks/itens/spec.md` para esta demanda — o requisito foi
informado diretamente pelo solicitante (reproduzido integralmente na mensagem
que originou este plano) e já está completo/esclarecido quanto aos campos e
regras de negócio do backend, sem necessidade de passar pelo agente `spec`.

Este plano cobre **4 entidades de conteúdo com estrutura idêntica**:
`Equipment` (Equipamentos), `Material` (Materiais), `Consumable` (Consumíveis)
e `Ammunition` (Munições). Cada uma vira um módulo independente em
`app-api/src/modules/`, seguindo o padrão já estabelecido pelas entidades de
conteúdo existentes (`races`, `eras`, `locations`, `creatures`, `divinities`,
`characters`, `families`, `organizations`, etc.) — o projeto não usa nenhuma
abstração de "entidade genérica de item"; cada módulo tem sua própria
entidade, DTOs, service e controller, ainda que o conteúdo seja quase todo
repetido 4x.

**Entidade de referência (template exato a seguir): `Organization`**
(`app-api/src/modules/organizations/`) — é o match exato do conjunto de
campos pedido: `name` (obrigatório, único), `referenceImage` (opcional,
`@IsUrl` condicional), `description` (texto rico opcional),
`privateInformation` (texto rico opcional) e `tags` (`ManyToMany` com `Tag`
via `@JoinTable` dedicada `organization_tags`). A única diferença é que
`Organization` tem uma relação adicional `OneToMany members`
(`OrganizationMember`, com `cascade`/`orphanedRowAction: 'delete'`) que **não
deve ser replicada** — as 4 entidades desta task não têm noção de membros.
Além disso, as 4 entidades ganham um campo que `Organization` não possui:
`price` (varchar, nullable, texto livre — ver detalhes na subseção
"Entidade" da etapa 1), que deve ser adicionado além do conjunto de campos
copiado do template. Usar secundariamente `Race`/`Era`
(`app-api/src/modules/races/`, `app-api/src/modules/eras/`) apenas como
referência de estilo de service/DTOs/paginação (padrão de duas consultas na
paginação, `PartialType` em `Update*Dto`, etc.) — `Race` tem uma `category`
obrigatória e `Era` tem um campo `order` com lógica de reordenação em
cascata; **nenhum dos dois deve ser replicado**, pois nenhuma das 4 entidades
desta task tem categoria nem ordenação.

**Investigação sobre nomenclatura do campo "Imagem Referência"**: o projeto
tem duas convenções coexistentes para este campo. As entidades de conteúdo
mais antigas — `Race`, `Era`, `Location`, `Creature`, `Event` — usam
`referenceImageUrl` (propriedade) / `reference_image_url` (coluna). Já as 4
entidades de conteúdo mais recentes — `Divinity`, `Character`, `Family` e
`Organization` (exemplo canônico:
`app-api/src/modules/organizations/entities/organization.entity.ts`, coluna
`reference_image`) — usam `referenceImage` (propriedade) /
`reference_image` (coluna), que também é o nome literal pedido pelo
solicitante e o contrato já fixado no plano de frontend
(`.claude/tasks/itens/task-web.md`). **Decisão: usar `referenceImage` /
`reference_image` nas 4 novas entidades**, por ser (1) a convenção mais
recente do projeto, adotada pelas últimas 4 entidades criadas, (2) o nome
literal pedido pelo solicitante, e (3) o contrato já assumido pelo `app-web`
— evitando um descompasso de integração API↔Web.

**Investigação sobre a "permissão de visualização" de `privateInformation`**:
não existe, hoje, nenhum mecanismo de filtragem no `app-api` que oculte
`privateInformation` de determinados usuários — o campo é sempre incluído no
`*ResponseDto.fromEntity(...)` de todas as entidades que o possuem (`Race`,
`Era`, `Location`, `Creature`, `Divinity`, `Character`, `Organization`,
`Family`, `Event`), para qualquer usuário autenticado (`JwtAuthGuard`). Não
há campo de papel/role em `User` (`app-api/src/modules/users/entities/user.entity.ts`)
nem uso de `@CurrentUser()` em nenhum desses controllers para esse fim. A
"permissão de visualização" mencionada no pedido (commits "Propriedade de
informações privadas" / "Permissões de visualização") é implementada
inteiramente no `app-web` (ocultar/exibir o campo na UI conforme o usuário),
fora do escopo deste agente. **Portanto: para as 4 novas entidades, o
mecanismo a replicar no backend é justamente não ter mecanismo nenhum** —
`privateInformation` é apenas mais um campo de texto rico opcional, sempre
presente no DTO de resposta completo, sem guard adicional além do
`JwtAuthGuard`/`GoogleAccessGuard` padrão do controller. Não inventar
filtragem por papel de usuário no `app-api`.

## Etapas

### 1. api-dev
Status: concluído
Entidade:
- app-api/src/modules/equipment/entities/equipment.entity.ts
- app-api/src/modules/materials/entities/material.entity.ts
- app-api/src/modules/consumables/entities/consumable.entity.ts
- app-api/src/modules/ammunition/entities/ammunition.entity.ts
Migration:
- app-api/src/database/migrations/1784305710000-CreateEquipmentTable.ts
- app-api/src/database/migrations/1784305720000-CreateEquipmentTagsTable.ts
- app-api/src/database/migrations/1784305730000-CreateMaterialsTable.ts
- app-api/src/database/migrations/1784305740000-CreateMaterialTagsTable.ts
- app-api/src/database/migrations/1784305750000-CreateConsumablesTable.ts
- app-api/src/database/migrations/1784305760000-CreateConsumableTagsTable.ts
- app-api/src/database/migrations/1784305770000-CreateAmmunitionTable.ts
- app-api/src/database/migrations/1784305780000-CreateAmmunitionTagsTable.ts
(nenhuma foi executada — `npm run migration:run` não foi rodado, conforme
instrução de sempre perguntar ao usuário antes)
Rotas:
- POST /equipment, GET /equipment, GET /equipment/:id, PUT /equipment/:id, DELETE /equipment/:id
- POST /materials, GET /materials, GET /materials/:id, PUT /materials/:id, DELETE /materials/:id
- POST /consumables, GET /consumables, GET /consumables/:id, PUT /consumables/:id, DELETE /consumables/:id
- POST /ammunition, GET /ammunition, GET /ammunition/:id, PUT /ammunition/:id, DELETE /ammunition/:id
Arquivos:
- app-api/src/modules/equipment/{dto/create-equipment.dto.ts, dto/update-equipment.dto.ts, dto/find-equipment-query.dto.ts, dto/equipment-response.dto.ts, dto/equipment-list-item-response.dto.ts, dto/paginated-equipment-response.dto.ts, equipment.service.ts, equipment.controller.ts, equipment.module.ts}
- app-api/src/modules/materials/{dto/create-material.dto.ts, dto/update-material.dto.ts, dto/find-materials-query.dto.ts, dto/material-response.dto.ts, dto/material-list-item-response.dto.ts, dto/paginated-materials-response.dto.ts, materials.service.ts, materials.controller.ts, materials.module.ts}
- app-api/src/modules/consumables/{dto/create-consumable.dto.ts, dto/update-consumable.dto.ts, dto/find-consumables-query.dto.ts, dto/consumable-response.dto.ts, dto/consumable-list-item-response.dto.ts, dto/paginated-consumables-response.dto.ts, consumables.service.ts, consumables.controller.ts, consumables.module.ts}
- app-api/src/modules/ammunition/{dto/create-ammunition.dto.ts, dto/update-ammunition.dto.ts, dto/find-ammunition-query.dto.ts, dto/ammunition-response.dto.ts, dto/ammunition-list-item-response.dto.ts, dto/paginated-ammunition-response.dto.ts, ammunition.service.ts, ammunition.controller.ts, ammunition.module.ts}
- app-api/src/app.module.ts (registro dos 4 novos módulos)
- app-api/src/modules/search/enums/linkable-entity-type.enum.ts (4 novos valores)
- app-api/src/modules/search/search.module.ts (4 novas entidades em TypeOrmModule.forFeature)
- app-api/src/modules/search/search.service.ts (4 novos repositórios + linkableEntities)
- app-api/src/modules/search/search.controller.ts (summary do GET /search atualizado)
- app-api/src/modules/search/dto/search-result-item-response.dto.ts (descrição de entityType atualizada)

#### Entidade

Estrutura **idêntica** para as 4 entidades abaixo, todas estendendo
`BaseEntity` (herda `id` uuid, `createdAt`, `updatedAt`). Nomes de
colunas/propriedades em inglês; mensagens de erro/validação em pt-BR.

Campos (mesmos para as 4):
- `name` (varchar) — "Nome" — **obrigatório, único** (`@Index({ unique: true })`,
  mesmo padrão de `Organization.name` / `Race.name` / `Era.name`). Único
  campo obrigatório de todo o cadastro, conforme pedido.
- `referenceImage` (varchar, nullable, coluna `reference_image`) — "Imagem
  Referência" — opcional; é uma URL de imagem (texto), não upload. Quando
  preenchida deve ser uma URL válida (`@IsUrl` condicional no DTO, mensagem
  pt-BR customizada — mesmo padrão de `Organization.referenceImage`).
- `description` (text, nullable) — "Descrição" — texto longo com formatação
  (HTML), opcional, mesmo padrão de `Organization.description` /
  `Race.description` / `Era.description`.
- `price` (varchar, nullable) — "Preço" — **texto comum (string), não
  numérico**, opcional. Sem validação de formato além de `@IsString`
  (o solicitante foi explícito que não é um campo numérico). Campo adicional
  que não existe no template de referência `Organization` (ver nota na seção
  "Contexto").
- `privateInformation` (text, nullable, coluna `private_information`) —
  "Informações Privadas" — texto longo com formatação (HTML), opcional,
  mesmo padrão de `Organization.privateInformation` / `Race.privateInformation` /
  `Era.privateInformation`. Ver nota na seção "Contexto" sobre não haver
  mecanismo de permissão adicional a implementar no backend para este campo.
- `tags` — relação `ManyToMany` para `Tag`
  (`app-api/src/modules/tags/entities/tag.entity.ts`), via `@JoinTable`
  dedicada por entidade (ver tabela de nomes abaixo), exatamente no mesmo
  padrão de `Organization.tags` / `organization_tags`.

Nomes concretos por entidade (usar exatamente estes):

| Domínio (pt-BR) | Classe da entidade | Tabela | Tabela de junção de tags | Módulo (pasta) | Rota (prefixo) |
|---|---|---|---|---|---|
| Equipamentos | `Equipment` | `equipment` | `equipment_tags` (`equipment_id`/`tag_id`) | `src/modules/equipment/` | `/equipment` |
| Materiais | `Material` | `materials` | `material_tags` (`material_id`/`tag_id`) | `src/modules/materials/` | `/materials` |
| Consumíveis | `Consumable` | `consumables` | `consumable_tags` (`consumable_id`/`tag_id`) | `src/modules/consumables/` | `/consumables` |
| Munições | `Ammunition` | `ammunition` | `ammunition_tags` (`ammunition_id`/`tag_id`) | `src/modules/ammunition/` | `/ammunition` |

Nenhuma das 4 entidades tem relacionamento `ManyToOne` para categoria (ao
contrário de `Race`), campo de ordenação (ao contrário de `Era`), nem relação
`OneToMany` de membros (ao contrário de `Organization`) — não replicar essas
partes dos templates de referência.

#### Migration

- Necessária: **sim** para as 4 entidades (`synchronize` é `false`; toda
  alteração de schema precisa de migration em `src/database/migrations/`).
- Decisão: **uma migration por tabela + uma por tabela de junção de tags**
  (8 migrations no total), seguindo exatamente o padrão cronológico já usado
  no projeto para cada entidade de conteúdo nova (ex.: `CreateOrganizationsTable`
  + `CreateOrganizationTagsTable`, `CreateRacesTable` + `CreateRaceTagsTable`)
  — **não** consolidar as 4 entidades em uma migration única, para manter
  consistência com o histórico de `src/database/migrations/` (uma migration =
  uma responsabilidade de schema).
- Última migration existente: `1784305700000-AddTypeToTagsTable.ts`. Usar
  timestamps posteriores, na ordem abaixo (cada tabela de junção depende da
  tabela principal correspondente e de `CreateTagsTable` `1784305370000`, já
  existente):
  1. `1784305710000-CreateEquipmentTable.ts`
  2. `1784305720000-CreateEquipmentTagsTable.ts`
  3. `1784305730000-CreateMaterialsTable.ts`
  4. `1784305740000-CreateMaterialTagsTable.ts`
  5. `1784305750000-CreateConsumablesTable.ts`
  6. `1784305760000-CreateConsumableTagsTable.ts`
  7. `1784305770000-CreateAmmunitionTable.ts`
  8. `1784305780000-CreateAmmunitionTagsTable.ts`
- Cada `Create<Entidade>Table` cria a tabela com `id` uuid PK
  (`gen_random_uuid()`), `created_at`, `updated_at` (padrão `BaseEntity`),
  `name` varchar not null + índice único (`IDX_<tabela>_name`),
  `reference_image` varchar nullable, `description` text nullable,
  `price` varchar nullable, `private_information` text nullable — todas as
  colunas já na criação da tabela (diferente do caso histórico de
  `AddPrivateInformationToContentTables`, que foi um retrofit em tabelas
  pré-existentes; aqui as tabelas são novas, então `private_information`
  entra direto no `CREATE TABLE`). Referência de coluna/nomenclatura:
  `1784305590000-CreateOrganizationsTable.ts` (`reference_image` já
  presente na criação da tabela).
- Cada `Create<Entidade>TagsTable` cria a tabela de junção
  (`<entidade>_id` uuid not null, `tag_id` uuid not null, PK composta,
  índices em cada coluna, FK `<entidade>_id` → `<tabela>(id)` `ON DELETE
  CASCADE`, FK `tag_id` → `tags(id)` `ON DELETE CASCADE`), no mesmo formato
  de `1784305600000-CreateOrganizationTagsTable.ts` (referência primária,
  entidade template desta task), com `1784305450000-CreateRaceTagsTable.ts` /
  `1784305470000-CreateEraTagsTable.ts` como referência adicional.
- Gerar via `npm run migration:generate` a partir das entidades já criadas e
  revisar o SQL resultante campo a campo contra a entidade (checklist da
  skill `api-migration`). **Nunca rodar `npm run migration:run` automaticamente**
  — perguntar ao usuário antes.

#### Controller

CRUD completo, idêntico nas 4 entidades (apenas trocando nome de
entidade/rota):
- `POST /<rota>` — cria o registro. Valida `name` único (409 pt-BR, ex.:
  "Já existe um equipamento com este nome." / "...material..." /
  "...consumível..." / "...item de munição..." — adaptar a mensagem ao
  domínio de cada entidade), `tagIds` existentes quando informados (404
  pt-BR, "Uma ou mais tags não foram encontradas."). Retorna
  `<Entidade>ResponseDto`.
- `GET /<rota>` — lista paginada com filtro por nome (`name`, opcional,
  `ILIKE` parcial case-insensitive) + `page`/`perPage` (defaults de
  `common/variables/pagination.ts`). Ordenação padrão por `name` ASC.
  Retorna `Paginated<Entidade>ResponseDto` composto por
  `<Entidade>ListItemResponseDto`.
- `GET /<rota>/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
  encontrado. Retorna `<Entidade>ResponseDto` completo (todos os campos +
  tags).
- `PUT /<rota>/:id` — atualiza (mesmas validações de nome único ao trocar o
  nome, `tagIds` válidos quando informados; demais campos seguem o padrão
  `!== undefined` do service, preservando valores não enviados). Retorna
  `<Entidade>ResponseDto`.
- `DELETE /<rota>/:id` — remove, `204 No Content`, 404 pt-BR se não
  encontrado. Remoção de linhas na tabela de junção de tags é resolvida por
  `ON DELETE CASCADE` do schema, sem lógica adicional no service.

DTOs por entidade (prefixo = nome da entidade, ex. `CreateEquipmentDto`,
`CreateMaterialDto`, `CreateConsumableDto`, `CreateAmmunitionDto`):
- `Create<Entidade>Dto`:
  - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
  - `referenceImage` (`@IsOptional`, `@IsUrl`, mensagem pt-BR customizada
    "A URL da imagem de referência é inválida.", mesmo padrão de
    `CreateOrganizationDto.referenceImage`);
  - `description` (`@IsOptional`, `@IsString` — suporta HTML);
  - `price` (`@IsOptional`, `@IsString` — texto livre, sem validação
    numérica/formato);
  - `privateInformation` (`@IsOptional`, `@IsString` — suporta HTML);
  - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`).
- `Update<Entidade>Dto` — `PartialType(Create<Entidade>Dto)`, mesmo padrão
  de `UpdateOrganizationDto`/`UpdateRaceDto`/`UpdateEraDto`.
- `Find<Entidade>QueryDto` — `name?` (`@IsOptional @IsString`, filtro
  parcial), `page?`, `perPage?` (mesmo padrão de `FindOrganizationsQueryDto`/
  `FindRacesQueryDto`/`FindErasQueryDto`, sem filtros adicionais já que não
  há categoria).
- `<Entidade>ResponseDto` — `id`, `name`, `referenceImage`, `description`,
  `price`, `privateInformation`, `tags` (`TagResponseDto[]`), `createdAt`,
  `updatedAt`; com `static fromEntity(entity): <Entidade>ResponseDto`.
- `<Entidade>ListItemResponseDto` — enxuto: `id`, `referenceImage`,
  `name`, `tags` (`TagResponseDto[]`) — mesmo conjunto mínimo usado em
  `OrganizationListItemResponseDto`/`RaceListItemResponseDto`/
  `EraListItemResponseDto` (sem `description`/`price`/`privateInformation`
  na listagem); com `static fromEntity(entity)`.
- `Paginated<Entidade>ResponseDto` — `data: <Entidade>ListItemResponseDto[]`,
  `total`, `page`, `perPage`, `totalPages`.

Service por entidade (`<Entidade>Service`, injeta `Repository<Entidade>` e
`Repository<Tag>`), pontos principais a replicar do padrão de
`OrganizationsService`/`RacesService`/`ErasService`:
- `findByName(name)`, `findById(id)` (com `relations: { tags: true }`);
- `findTagsByIds(tagIds)` privado, idêntico ao já usado nos outros módulos
  (404 pt-BR se alguma tag não existir);
- `create`: valida nome único (409), resolve `tags` a partir dos ids
  informados (array vazio quando ausente), persiste;
- `findAllPaginated`: filtra por `name` (`ILIKE` parcial), ordena por
  `<entidade>.name` ASC, pagina buscando primeiro `id`/`name` via
  `skip`/`take` + `getManyAndCount` e depois recarrega a página completa com
  `relations: { tags: true }` (mesmo padrão de `RacesService.findAllPaginated`,
  evitando duplicação de linhas por `ManyToMany` + paginação);
- `update`: valida nome único ao trocar, resolve `tags` apenas quando
  `dto.tagIds !== undefined` (preserva a relação quando omitido), demais
  campos (`referenceImage`, `description`, `price`, `privateInformation`)
  seguem o padrão `if (dto.campo !== undefined) { entity.campo = dto.campo; }`;
- `remove`: `delete({ id })`, 404 pt-BR se `affected === 0`.

Módulo por entidade (`<Entidade>Module`): `TypeOrmModule.forFeature([Entidade, Tag])`,
`controllers: [<Entidade>Controller]`, `providers: [<Entidade>Service]`,
`exports: [<Entidade>Service]`. Os 4 módulos (`EquipmentModule`,
`MaterialsModule`, `ConsumablesModule`, `AmmunitionModule`) precisam ser
importados em `app-api/src/app.module.ts` (entidades já são auto-registradas
via `autoLoadEntities: true`, não precisam de registro manual adicional).

Acesso Google: **`read-only` (padrão)** — as 4 entidades expõem CRUD
completo de conteúdo, sem indicação no pedido de um nível diferente; aplicar
a skill `api-permissao-google-readonly` nos 4 controllers, exatamente como
em `RacesController`/`ErasController`:
```ts
@ApiTags('<rota>')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('<rota>')
```

Observação: o controller deve incluir apenas as anotações Swagger
estruturais (`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/
`@ApiCreatedResponse`/`@ApiConflictResponse`/`@ApiNotFoundResponse`/
`@ApiBadRequestResponse` finos ficam a cargo da etapa `api-dev-doc`.

#### Search (mecanismo de @mention)

Fora das 3 subseções padrão, mas parte obrigatória desta etapa: adicionar as
4 novas entidades ao módulo `app-api/src/modules/search/`, seguindo
exatamente o padrão existente (ver `search.service.ts`, `search.controller.ts`,
`search.module.ts`, `enums/linkable-entity-type.enum.ts`,
`dto/search-result-item-response.dto.ts`):
- `enums/linkable-entity-type.enum.ts`: adicionar 4 valores ao final do enum
  `LinkableEntityType`, no mesmo estilo singular já usado (`RACE = 'race'`,
  `EVENT = 'event'`, etc.):
  ```ts
  EQUIPMENT = 'equipment',
  MATERIAL = 'material',
  CONSUMABLE = 'consumable',
  AMMUNITION = 'ammunition',
  ```
- `search.module.ts`: importar `Equipment`, `Material`, `Consumable`,
  `Ammunition` e adicioná-las ao array de `TypeOrmModule.forFeature([...])`,
  junto das demais.
- `search.service.ts`: injetar os 4 novos repositórios no construtor
  (`@InjectRepository(Equipment) private readonly equipmentRepository: Repository<Equipment>`,
  e equivalentes para `Material`/`Consumable`/`Ammunition`), e adicionar 4
  novas entradas ao array `linkableEntities` dentro de `search(...)`, no
  mesmo formato `{ entityType: LinkableEntityType.EQUIPMENT, repository: this.equipmentRepository }`
  (e equivalentes) — a lógica de busca (`ILIKE` por nome, `MAX_RESULTS`,
  `orderBy('entity.name', 'ASC')`) já é genérica e não precisa de nenhuma
  alteração além de estender o array.
- `search.controller.ts`: atualizar o `summary` do `@ApiOperation` do
  endpoint `GET /search` para incluir as 4 novas entidades na lista em
  pt-BR (atualmente "usuários, criaturas, tags, locais, raças, eras, eventos
  e divindades" — nota: o `summary` atual já está desatualizado em relação
  ao código, que também cobre `characters`/`organizations`/`families`;
  aproveitar esta etapa para corrigir o `summary` incluindo **todas** as
  entidades cobertas hoje pelo `search.service.ts`, mais as 4 novas:
  usuários, criaturas, tags, locais, raças, eras, eventos, divindades,
  personagens, organizações, famílias, equipamentos, materiais, consumíveis
  e munições).
- `dto/search-result-item-response.dto.ts`: atualizar a descrição do
  `@ApiProperty` de `entityType` para refletir a lista completa e atualizada
  de tipos suportados (mesma correção de desatualização do `summary` acima).
- `SearchService` não precisa de nenhum módulo importado das 4 novas
  entidades além do `TypeOrmModule.forFeature` direto (mesmo padrão já usado
  para `Race`/`Era`/etc., sem importar `EquipmentModule` etc.).

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1 (api-dev).
- Revisar/complementar a documentação Swagger dos 4 novos controllers:
  `@ApiTags('<rota>')` em cada um, `@ApiOperation({ summary })` em pt-BR
  para cada rota (criar, listar, buscar por id, atualizar, remover),
  adaptando o texto ao domínio de cada entidade (equipamento/material/
  consumível/item de munição).
- Garantir respostas documentadas em cada controller: `@ApiCreatedResponse`
  (POST), `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, mensagem pt-BR de exemplo
  adaptada ao domínio), `@ApiNotFoundResponse` (404 — registro não
  encontrado, uma ou mais tags não encontradas — cobrindo `create`, `update`
  e `findOne`/`remove`), `@ApiBadRequestResponse` (URL de imagem de
  referência inválida, `id`/`tagIds` em formato inválido).
- Conferir que todos os campos de `Create<Entidade>Dto`/`Update<Entidade>Dto`/
  `<Entidade>ResponseDto`/`<Entidade>ListItemResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes ao domínio de
  cada entidade (ex.: nome de exemplo "Espada Longa" para `Equipment`,
  "Minério de Ferro" para `Material`, "Poção de Cura" para `Consumable`,
  "Flecha de Aço" para `Ammunition`), incluindo exemplos em HTML para
  `description`/`privateInformation` e um exemplo textual simples para
  `price` (ex.: `"50 moedas de ouro"`), documentando claramente que apenas
  `name` é obrigatório.
- Atualizar o `@ApiOperation summary` de `GET /search`
  (`search.controller.ts`) e a descrição do `@ApiProperty` de `entityType`
  em `SearchResultItemResponseDto` para incluir as 4 novas entidades (e
  corrigir a lista desatualizada existente, conforme detalhado na subseção
  "Search" da etapa 1).
- Validar no `/docs` que os 4 novos grupos de rotas aparecem corretamente
  documentados e que `GET /search` reflete o novo `LinkableEntityType`.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima.
- Revisar as 4 entidades: tipos, nullability (`referenceImage`,
  `description`, `price`, `privateInformation` todos nullable; `name` not
  null + índice único em cada uma), a relação `ManyToMany` com `Tag` via
  `@JoinTable` dedicada por entidade (`equipment_tags`/`material_tags`/
  `consumable_tags`/`ammunition_tags`, cada uma com as colunas de FK
  nomeadas corretamente), e confirmar que nenhuma das 4 tem relação
  `ManyToOne` para categoria, campo de ordenação, nem relação `OneToMany` de
  membros (não fazem parte do escopo).
- Revisar as 8 migrations: ordem de execução (tabela principal antes da
  respectiva tabela de junção, todas posteriores a
  `1784305700000-AddTypeToTagsTable.ts` e às tabelas de junção dependendo
  também de `CreateTagsTable` `1784305370000` já existente), colunas e
  nullability idênticas à entidade (incluindo `private_information` já
  presente no `CREATE TABLE`, sem depender de migration de retrofit, e
  `reference_image` — não `reference_image_url` — como nome de coluna),
  PK composta e índices das 4 tabelas de junção com FKs `ON DELETE CASCADE`
  nas duas colunas de cada uma, `down()` revertendo tudo (índices,
  constraints, tabelas) na ordem inversa do `up()` em todas as 8 migrations.
- Revisar DTOs e validações nas 4 entidades: unicidade de nome (409 pt-BR)
  em `create`/`update`, `@IsUrl` condicional em `referenceImage`,
  `price` tratado como texto livre (`@IsString`, sem `@IsNumber`/`@IsNumberString`
  nem qualquer normalização numérica), `description`/`privateInformation`
  opcionais e sem `@IsNotEmpty`, `tagIds` validados contra existência real
  (404 pt-BR), `PartialType` correto nos 4 `Update<Entidade>Dto`.
- Revisar os 4 services: que `update` só reatribui `tags` quando
  `dto.tagIds !== undefined` (preservando a relação existente quando o
  campo é omitido), que `findById`/listagem carregam a relação `tags` sem
  causar N+1 desnecessário, e que a paginação segue o padrão de duas
  consultas (ids + reload com relations) usado em `RacesService`/`ErasService`.
- Revisar os 4 controllers: guards (`JwtAuthGuard` + `GoogleAccessGuard` +
  `@GoogleAccess('read-only')`), filtros (`name` parcial via `ILIKE`),
  ordenação padrão por `name` ASC, paginação `{ data, total, page, perPage }`
  + `totalPages` calculado no controller, uso de `fromEntity` em todos os
  DTOs de resposta, ausência de qualquer lógica de filtragem adicional de
  `privateInformation` por papel/tipo de usuário (não faz parte do escopo do
  backend, conforme investigação documentada no "Contexto" deste plano).
- Revisar as alterações no módulo `search`: enum `LinkableEntityType` com os
  4 novos valores, `search.module.ts` com as 4 novas entidades registradas
  em `TypeOrmModule.forFeature`, `search.service.ts` com os 4 novos
  repositórios injetados e adicionados ao array `linkableEntities` sem
  alterar a lógica de busca genérica existente, `summary` do
  `@ApiOperation` de `GET /search` e descrição de `entityType` em
  `SearchResultItemResponseDto` atualizados e completos (incluindo as
  entidades que já existiam mas estavam ausentes do texto antigo:
  personagens, organizações, famílias).
- Confirmar que o nome de campo/coluna usado em todas as 4 entidades é
  `referenceImage`/`reference_image` (convenção recente, alinhada com
  `Divinity`/`Character`/`Family`/`Organization` e com o plano de frontend
  `.claude/tasks/itens/task-web.md`), e não `referenceImageUrl`/
  `reference_image_url` (convenção antiga de `Race`/`Era`/`Location`/
  `Creature`/`Event`).
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos das 4
  entidades (nome duplicado, registro não encontrado, tags não encontradas,
  URL inválida), enquanto nomes de entidade/colunas/DTOs/JSON permanecem em
  inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration, os 4
  módulos novos registrados em `app.module.ts`, skill
  `api-permissao-google-readonly` aplicada nos 4 controllers).

## Revisão

As etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como "concluído", e o
conteúdo revisado é consistente com o que ambas declaram ter produzido.
Revisão realizada arquivo a arquivo (entidades, migrations, DTOs, services,
controllers, módulos e o módulo `search`), com atenção especial aos pontos de
risco indicados pelo orquestrador.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-api/src/modules/equipment/entities/equipment.entity.ts
- app-api/src/modules/materials/entities/material.entity.ts
- app-api/src/modules/consumables/entities/consumable.entity.ts
- app-api/src/modules/ammunition/entities/ammunition.entity.ts
- app-api/src/database/migrations/1784305710000-CreateEquipmentTable.ts
- app-api/src/database/migrations/1784305720000-CreateEquipmentTagsTable.ts
- app-api/src/database/migrations/1784305730000-CreateMaterialsTable.ts
- app-api/src/database/migrations/1784305740000-CreateMaterialTagsTable.ts
- app-api/src/database/migrations/1784305750000-CreateConsumablesTable.ts
- app-api/src/database/migrations/1784305760000-CreateConsumableTagsTable.ts
- app-api/src/database/migrations/1784305770000-CreateAmmunitionTable.ts
- app-api/src/database/migrations/1784305780000-CreateAmmunitionTagsTable.ts
- app-api/src/modules/equipment/{dto/create-equipment.dto.ts, dto/update-equipment.dto.ts, dto/find-equipment-query.dto.ts, dto/equipment-response.dto.ts, dto/equipment-list-item-response.dto.ts, dto/paginated-equipment-response.dto.ts, equipment.service.ts, equipment.controller.ts, equipment.module.ts}
- app-api/src/modules/materials/{dto/create-material.dto.ts, dto/update-material.dto.ts, dto/find-materials-query.dto.ts, dto/material-response.dto.ts, dto/material-list-item-response.dto.ts, dto/paginated-materials-response.dto.ts, materials.service.ts, materials.controller.ts, materials.module.ts}
- app-api/src/modules/consumables/{dto/create-consumable.dto.ts, dto/update-consumable.dto.ts, dto/find-consumables-query.dto.ts, dto/consumable-response.dto.ts, dto/consumable-list-item-response.dto.ts, dto/paginated-consumables-response.dto.ts, consumables.service.ts, consumables.controller.ts, consumables.module.ts}
- app-api/src/modules/ammunition/{dto/create-ammunition.dto.ts, dto/update-ammunition.dto.ts, dto/find-ammunition-query.dto.ts, dto/ammunition-response.dto.ts, dto/ammunition-list-item-response.dto.ts, dto/paginated-ammunition-response.dto.ts, ammunition.service.ts, ammunition.controller.ts, ammunition.module.ts}
- app-api/src/app.module.ts
- app-api/src/modules/search/enums/linkable-entity-type.enum.ts
- app-api/src/modules/search/search.module.ts
- app-api/src/modules/search/search.service.ts
- app-api/src/modules/search/search.controller.ts
- app-api/src/modules/search/dto/search-result-item-response.dto.ts

Pontos conferidos especificamente:
- As 4 entidades são estruturalmente idênticas (mesmos tipos/nullability para
  `referenceImage`/`description`/`price`/`privateInformation`, `name` com
  `@Index({ unique: true })`), sem `ManyToOne` de categoria, campo de
  ordenação ou `OneToMany` de membros — nenhum resíduo dos templates
  `Race`/`Era`/`Organization`.
- Nome de coluna/propriedade `referenceImage`/`reference_image` (não
  `referenceImageUrl`/`reference_image_url`) confirmado nas 4 entidades e nas
  4 migrations de criação de tabela, alinhado com `Divinity`/`Character`/
  `Family`/`Organization` e com o contrato do `task-web.md`.
  `privateInformation`/`private_information` já presente no `CREATE TABLE` de
  cada uma das 4 tabelas principais (sem migration de retrofit).
- As 8 migrations seguem a ordem cronológica correta (tabela principal antes
  da respectiva tabela de junção, todas posteriores a
  `1784305700000-AddTypeToTagsTable.ts`), com colunas/nullability idênticas
  às entidades, PK composta e índices em `<entidade>_id`/`tag_id` nas 4
  tabelas de junção, FKs com `ON DELETE CASCADE ON UPDATE NO ACTION` nas duas
  colunas de cada junção, e `down()` revertendo constraints → índices →
  tabela na ordem inversa do `up()` em todas as 8 migrations.
- `price` é `varchar` nullable na entidade/migration e `@IsOptional()
  @IsString()` no `Create<Entidade>Dto` nas 4 entidades, sem qualquer
  `@IsNumber`/`@IsNumberString`/normalização numérica.
- `referenceImage` usa `@IsUrl` condicional com mensagem pt-BR customizada
  ("A URL da imagem de referência é inválida.") nas 4 entidades;
  `description`/`privateInformation` são opcionais, sem `@IsNotEmpty`;
  `tagIds` validado com `@IsArray`/`@IsUUID('4', { each: true })` no DTO e
  contra existência real via `findTagsByIds` (404 pt-BR "Uma ou mais tags não
  foram encontradas.") no service, nos 4 módulos; os 4 `Update<Entidade>Dto`
  usam `PartialType(Create<Entidade>Dto)`.
- Os 4 services replicam exatamente o padrão de duas consultas de
  `RacesService`/`ErasService` na paginação (ids/name via `skip`/`take` +
  `getManyAndCount`, depois reload com `relations: { tags: true }`),
  `findById` carrega `tags` sem N+1 adicional, e `update` só reatribui
  `tags` quando `dto.tagIds !== undefined`, preservando a relação quando
  omitido; demais campos seguem `if (dto.campo !== undefined)`.
- Os 4 controllers usam `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')`, filtro `name` via `ILIKE` parcial, ordenação
  por `name` ASC (delegada ao service), paginação
  `{ data, total, page, perPage }` com `totalPages` calculado no controller,
  `fromEntity` em todas as respostas, e nenhuma lógica adicional de
  filtragem de `privateInformation` por papel/tipo de usuário — consistente
  com a investigação documentada na seção "Contexto" deste plano.
- `search.module.ts`/`search.service.ts` registram os 4 novos repositórios
  sem alterar a lógica de busca genérica (`ILIKE` + `MAX_RESULTS` +
  `orderBy('entity.name', 'ASC')`); o `summary` de `GET /search`
  (`search.controller.ts`) e a descrição de `entityType`
  (`SearchResultItemResponseDto`) foram corrigidos e agora listam todas as
  entidades cobertas hoje, incluindo as que já existiam e estavam ausentes do
  texto antigo (personagens, organizações, famílias) mais as 4 novas.
- Mensagens de erro/validação (nome duplicado, registro não encontrado, tags
  não encontradas, URL inválida) em pt-BR em todos os pontos, com
  nomes de entidade/coluna/DTO/JSON em inglês, nos 4 módulos.
- Os 4 módulos (`EquipmentModule`, `MaterialsModule`, `ConsumablesModule`,
  `AmmunitionModule`) estão registrados em `app-api/src/app.module.ts`; as
  entidades não precisam de registro manual adicional
  (`autoLoadEntities: true`).
