# Task API: Utilitários

## Contexto
Não existe `.claude/tasks/utilitarios/spec.md` para esta demanda — o pedido foi
informado diretamente pelo solicitante e já está completo/esclarecido: criar uma
nova entidade de conteúdo "Utilitários" (`Utility`), pertencente à mesma seção
"ITENS" das entidades já existentes `Equipment` (`app-api/src/modules/equipment/`),
`Material` (`app-api/src/modules/materials/`), `Consumable`
(`app-api/src/modules/consumables/`) e `Ammunition`
(`app-api/src/modules/ammunition/`), replicando **exatamente** a mesma estrutura
de campos, DTOs, service, controller e migration dessas 4 entidades — sem
inventar nenhum campo novo, apenas trocando nome/contexto para "Utilitário".

**Entidade de referência (template exato a seguir): `Material`**
(`app-api/src/modules/materials/`) — investigada arquivo a arquivo (entidade,
os 6 DTOs, service, controller, module) e confirmada como estruturalmente
idêntica às demais 3 entidades da seção ITENS (conforme já documentado em
`.claude/tasks/itens/task-api.md`, que serviu de base histórica para este
plano). `Utility` deve ser a 5ª entidade desse conjunto, com o mesmo conjunto
de campos, mesmas convenções de nomenclatura, mesmo padrão de paginação de
duas consultas, mesmo padrão de guards e mesma participação no módulo
`search`.

Nenhuma ambiguidade de requisito foi identificada: o pedido é explícito em
replicar o padrão já estabelecido (mesmos campos, mesma estrutura de DTOs,
mesmo service/controller, mesma migration pattern, participação na busca
global, e `GoogleAccess('read-only')` — igual às demais entidades de CRUD
completo da seção). Os nomes concretos abaixo (`Utility`/`utilities`/
`utility_tags`/`UtilitiesModule`/`/utilities`) seguem exatamente a sugestão já
validada contra as convenções do projeto (plural regular, sem colisão com
nomes existentes).

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/utilities/entities/utility.entity.ts
Migration: app-api/src/database/migrations/1784305870000-CreateUtilitiesTable.ts, app-api/src/database/migrations/1784305880000-CreateUtilityTagsTable.ts
Rotas: POST /utilities, GET /utilities, GET /utilities/:id, PUT /utilities/:id, DELETE /utilities/:id
Arquivos: app-api/src/modules/utilities/dto/create-utility.dto.ts, app-api/src/modules/utilities/dto/update-utility.dto.ts, app-api/src/modules/utilities/dto/find-utilities-query.dto.ts, app-api/src/modules/utilities/dto/utility-response.dto.ts, app-api/src/modules/utilities/dto/utility-list-item-response.dto.ts, app-api/src/modules/utilities/dto/paginated-utilities-response.dto.ts, app-api/src/modules/utilities/utilities.service.ts, app-api/src/modules/utilities/utilities.controller.ts, app-api/src/modules/utilities/utilities.module.ts, app-api/src/app.module.ts (import de UtilitiesModule), app-api/src/modules/search/enums/linkable-entity-type.enum.ts (UTILITY = 'utility'), app-api/src/modules/search/search.module.ts (Utility em TypeOrmModule.forFeature), app-api/src/modules/search/search.service.ts (repositório de Utility + entrada em linkableEntities), app-api/src/modules/search/search.controller.ts (summary de GET /search atualizado), app-api/src/modules/search/dto/search-result-item-response.dto.ts (descrição de entityType atualizada)

#### Entidade
- Entidade: `Utility` (`app-api/src/modules/utilities/entities/utility.entity.ts`),
  estendendo `BaseEntity` (herda `id` uuid, `createdAt`, `updatedAt`).
  `@Entity('utilities')`.
- Campos (idênticos aos de `Material`/`Equipment`/`Consumable`/`Ammunition`,
  apenas adaptando nome/contexto para "Utilitário"):
  - `name` (varchar) — "Nome" — **obrigatório, único** (`@Index({ unique: true })`,
    mesmo padrão de `Material.name`). Único campo obrigatório de todo o
    cadastro.
  - `referenceImage` (varchar, nullable, coluna `reference_image`) — "Imagem
    Referência" — opcional; URL de imagem (texto), não upload. Quando
    preenchida deve ser uma URL válida (`@IsUrl` condicional no DTO, mensagem
    pt-BR customizada "A URL da imagem de referência é inválida." — mesmo
    padrão de `CreateMaterialDto.referenceImage`). Usar o nome
    `referenceImage`/`reference_image` (convenção recente do projeto, já
    adotada por `Material`/`Equipment`/`Consumable`/`Ammunition`/`Divinity`/
    `Character`/`Family`/`Organization`), **não** `referenceImageUrl`/
    `reference_image_url` (convenção antiga de `Race`/`Era`/`Location`/
    `Creature`/`Event`).
  - `description` (text, nullable) — "Descrição" — texto longo com formatação
    (HTML), opcional, mesmo padrão de `Material.description`.
  - `price` (varchar, nullable) — "Preço" — **texto comum (string), não
    numérico**, opcional. Sem validação de formato além de `@IsString`,
    mesmo padrão de `Material.price` (texto livre, ex.: "10 moedas de
    prata").
  - `privateInformation` (text, nullable, coluna `private_information`) —
    "Informações Privadas" — texto longo com formatação (HTML), opcional,
    mesmo padrão de `Material.privateInformation`. Sem nenhum mecanismo de
    permissão/filtragem adicional no backend (o campo é sempre incluído no
    `UtilityResponseDto.fromEntity(...)` para qualquer usuário autenticado,
    igual às demais entidades de conteúdo — a eventual ocultação por papel de
    usuário é responsabilidade do `app-web`, fora do escopo deste agente).
  - `tags` — relação `ManyToMany` para `Tag`
    (`app-api/src/modules/tags/entities/tag.entity.ts`), via `@JoinTable`
    dedicada `utility_tags` (colunas `utility_id`/`tag_id`), exatamente no
    mesmo padrão de `Material.tags`/`material_tags`.
- Nenhuma relação `ManyToOne` de categoria, campo de ordenação, nem relação
  `OneToMany` adicional — `Utility` não possui nenhum campo além dos listados
  acima, assim como as demais 4 entidades da seção ITENS.
- Módulo (pasta): `app-api/src/modules/utilities/`. Rota (prefixo): `/utilities`.

#### Migration
- Necessária: **sim** (`synchronize` é `false`; toda alteração de schema
  precisa de migration em `src/database/migrations/`).
- Decisão: **uma migration para a tabela principal + uma para a tabela de
  junção de tags** (2 migrations no total), seguindo exatamente o padrão já
  usado para `Material` (`CreateMaterialsTable` + `CreateMaterialTagsTable`) e
  as demais entidades de conteúdo do projeto — não consolidar em uma única
  migration.
- Última migration existente no repositório:
  `1784305860000-CreateConditionSectionsTable.ts`. Usar timestamps
  posteriores, na ordem abaixo (a tabela de junção depende da tabela
  principal `utilities` e de `CreateTagsTable` `1784305370000`, já
  existente):
  1. `1784305870000-CreateUtilitiesTable.ts`
  2. `1784305880000-CreateUtilityTagsTable.ts`
- `CreateUtilitiesTable`: cria a tabela `utilities` com `id` uuid PK
  (`gen_random_uuid()`), `created_at`/`updated_at` (padrão `BaseEntity`),
  `name` varchar not null + índice único (`IDX_utilities_name`),
  `reference_image` varchar nullable, `description` text nullable, `price`
  varchar nullable, `private_information` text nullable — todas as colunas já
  na criação da tabela (não é um retrofit). Referência de coluna/formato SQL:
  `1784305730000-CreateMaterialsTable.ts`.
- `CreateUtilityTagsTable`: cria a tabela de junção (`utility_id` uuid not
  null, `tag_id` uuid not null, PK composta, índice em cada coluna, FK
  `utility_id` → `utilities(id)` `ON DELETE CASCADE`, FK `tag_id` →
  `tags(id)` `ON DELETE CASCADE`), no mesmo formato de
  `1784305740000-CreateMaterialTagsTable.ts`.
- Gerar via `npm run migration:generate` a partir da entidade já criada e
  revisar o SQL resultante campo a campo contra a entidade (checklist da
  skill `api-migration`). **Nunca rodar `npm run migration:run`
  automaticamente** — perguntar ao usuário antes.

#### Controller
CRUD completo, idêntico ao padrão de `MaterialsController` (apenas trocando
nome de entidade/rota/mensagens para o domínio "utilitário"):
- `POST /utilities` — cria o registro. Valida `name` único (409 pt-BR: "Já
  existe um utilitário com este nome."), `tagIds` existentes quando
  informados (404 pt-BR: "Uma ou mais tags não foram encontradas."). Retorna
  `UtilityResponseDto`.
- `GET /utilities` — lista paginada com filtro por nome (`name`, opcional,
  `ILIKE` parcial case-insensitive) + `page`/`perPage` (defaults de
  `common/variables/pagination.ts`). Ordenação padrão por `name` ASC.
  Retorna `PaginatedUtilitiesResponseDto` composto por
  `UtilityListItemResponseDto`.
- `GET /utilities/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR
  ("Utilitário não encontrado.") se não encontrado. Retorna
  `UtilityResponseDto` completo (todos os campos + tags).
- `PUT /utilities/:id` — atualiza (mesma validação de nome único ao trocar o
  nome, `tagIds` válidos quando informados; demais campos seguem o padrão
  `!== undefined` do service, preservando valores não enviados). Retorna
  `UtilityResponseDto`.
- `DELETE /utilities/:id` — remove, `204 No Content`, 404 pt-BR se não
  encontrado. Remoção de linhas na tabela de junção `utility_tags` é
  resolvida por `ON DELETE CASCADE` do schema, sem lógica adicional no
  service.

DTOs (`app-api/src/modules/utilities/dto/`, prefixo `Utility`):
- `CreateUtilityDto`:
  - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
  - `referenceImage` (`@IsOptional`, `@IsUrl`, mensagem pt-BR "A URL da
    imagem de referência é inválida.");
  - `description` (`@IsOptional`, `@IsString` — suporta HTML);
  - `price` (`@IsOptional`, `@IsString` — texto livre, sem validação
    numérica/formato);
  - `privateInformation` (`@IsOptional`, `@IsString` — suporta HTML);
  - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`).
- `UpdateUtilityDto` — `PartialType(CreateUtilityDto)`.
- `FindUtilitiesQueryDto` — `name?` (`@IsOptional @IsString`, filtro
  parcial), `page?`, `perPage?` (mesmo padrão de `FindMaterialsQueryDto`).
- `UtilityResponseDto` — `id`, `name`, `referenceImage`, `description`,
  `price`, `privateInformation`, `tags` (`TagResponseDto[]`), `createdAt`,
  `updatedAt`; com `static fromEntity(entity): UtilityResponseDto`.
- `UtilityListItemResponseDto` — enxuto: `id`, `referenceImage`, `name`,
  `tags` (`TagResponseDto[]`) — mesmo conjunto mínimo de
  `MaterialListItemResponseDto` (sem `description`/`price`/
  `privateInformation` na listagem); com `static fromEntity(entity)`.
- `PaginatedUtilitiesResponseDto` — `data: UtilityListItemResponseDto[]`,
  `total`, `page`, `perPage`, `totalPages`.

Service (`UtilitiesService`, injeta `Repository<Utility>` e
`Repository<Tag>`), replicando exatamente `MaterialsService`:
- `findByName(name)`, `findById(id)` (com `relations: { tags: true }`);
- `findTagsByIds(tagIds)` privado (404 pt-BR "Uma ou mais tags não foram
  encontradas." se alguma não existir);
- `create`: valida nome único (409), resolve `tags` a partir dos ids
  informados (array vazio quando ausente), persiste;
- `findAllPaginated`: filtra por `name` (`ILIKE` parcial), ordena por
  `utility.name` ASC, pagina buscando primeiro `id`/`name` via
  `skip`/`take` + `getManyAndCount` e depois recarrega a página completa com
  `relations: { tags: true }` (mesmo padrão de duas consultas de
  `MaterialsService.findAllPaginated`, evitando duplicação de linhas por
  `ManyToMany` + paginação);
- `update`: valida nome único ao trocar, resolve `tags` apenas quando
  `dto.tagIds !== undefined` (preserva a relação quando omitido), demais
  campos (`referenceImage`, `description`, `price`, `privateInformation`)
  seguem o padrão `if (dto.campo !== undefined) { entity.campo = dto.campo; }`;
- `remove`: `delete({ id })`, 404 pt-BR "Utilitário não encontrado." se
  `affected === 0`.

Módulo (`UtilitiesModule`, `app-api/src/modules/utilities/utilities.module.ts`):
`TypeOrmModule.forFeature([Utility, Tag])`, `controllers: [UtilitiesController]`,
`providers: [UtilitiesService]`, `exports: [UtilitiesService]`. Precisa ser
importado em `app-api/src/app.module.ts` (junto de `EquipmentModule`,
`MaterialsModule`, `ConsumablesModule`, `AmmunitionModule`) — a entidade
`Utility` já é auto-registrada via `autoLoadEntities: true`, não precisa de
registro manual adicional.

Acesso Google: **`read-only` (padrão)** — `Utility` expõe CRUD completo de
conteúdo na mesma seção ITENS das demais entidades, sem indicação no pedido
de um nível diferente; aplicar a skill `api-permissao-google-readonly`,
exatamente como em `MaterialsController`:
```ts
@ApiTags('utilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('utilities')
```

Observação: o controller deve incluir apenas as anotações Swagger estruturais
(`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` finos
ficam a cargo da etapa `api-dev-doc`.

#### Search (mecanismo de @mention)
Fora das 3 subseções padrão, mas parte obrigatória desta etapa: adicionar
`Utility` ao módulo `app-api/src/modules/search/`, seguindo exatamente o
padrão hoje já usado para `Material`/`Equipment`/`Consumable`/`Ammunition`/
`Rule`/`Skill`/`Condition` (ver `search.service.ts`, `search.controller.ts`,
`search.module.ts`, `enums/linkable-entity-type.enum.ts`,
`dto/search-result-item-response.dto.ts`):
- `enums/linkable-entity-type.enum.ts`: adicionar `UTILITY = 'utility'` ao
  final do enum `LinkableEntityType` (atualmente termina em
  `CONDITION = 'condition'`).
- `search.module.ts`: importar `Utility`
  (`../utilities/entities/utility.entity`) e adicioná-la ao array de
  `TypeOrmModule.forFeature([...])`, junto das demais.
- `search.service.ts`: injetar o novo repositório no construtor
  (`@InjectRepository(Utility) private readonly utilitiesRepository: Repository<Utility>`)
  e adicionar uma nova entrada ao array `linkableEntities` dentro de
  `search(...)`, no mesmo formato
  `{ entityType: LinkableEntityType.UTILITY, repository: this.utilitiesRepository }`
  — a lógica de busca (`ILIKE` por nome, `MAX_RESULTS`, `orderBy('entity.name',
  'ASC')`) já é genérica e não precisa de nenhuma alteração além de estender
  o array.
- `search.controller.ts`: atualizar o `summary` do `@ApiOperation` do
  endpoint `GET /search` para incluir "utilitários" na lista em pt-BR
  (atualmente termina em "...regras, perícias e condições"; passar a incluir
  também utilitários, mantendo a ordem lógica das demais entidades da seção
  ITENS: "...equipamentos, materiais, consumíveis, munições, utilitários,
  regras, perícias e condições").
- `dto/search-result-item-response.dto.ts`: atualizar a descrição do
  `@ApiProperty` de `entityType` para incluir "utilitário" na lista completa
  de tipos suportados, na mesma posição lógica citada acima.
- `SearchService` não precisa de nenhum módulo importado de `Utility` além do
  `TypeOrmModule.forFeature` direto (mesmo padrão já usado para as demais
  entidades, sem importar `UtilitiesModule`).

### 2. api-dev-doc
Status: concluído
Arquivos alterados: app-api/src/modules/utilities/utilities.controller.ts

- Depende da etapa 1 (api-dev).
- Revisar/complementar a documentação Swagger do novo `UtilitiesController`:
  `@ApiTags('utilities')`, `@ApiOperation({ summary })` em pt-BR para cada
  rota (criar, listar, buscar por id, atualizar, remover), adaptando o texto
  ao domínio "utilitário".
  * ✓ POST /utilities — `@ApiOperation({ summary: 'Cria um utilitário' })`
  * ✓ GET /utilities — `@ApiOperation({ summary: 'Lista utilitários com paginação e filtro' })`
  * ✓ GET /utilities/:id — `@ApiOperation({ summary: 'Busca um utilitário pelo id' })`
  * ✓ PUT /utilities/:id — `@ApiOperation({ summary: 'Atualiza um utilitário' })`
  * ✓ DELETE /utilities/:id — `@ApiOperation({ summary: 'Remove um utilitário' })`
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, "Já existe um utilitário com
  este nome."), `@ApiNotFoundResponse` (404 — utilitário não encontrado, uma
  ou mais tags não encontradas — cobrindo `create`, `update` e
  `findOne`/`remove`), `@ApiBadRequestResponse` (URL de imagem de referência
  inválida, `id`/`tagIds` em formato inválido).
  * ✓ Todas as respostas documentadas conforme especificado
- Conferir que todos os campos de `CreateUtilityDto`/`UpdateUtilityDto`/
  `UtilityResponseDto`/`UtilityListItemResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes ao domínio
  "utilitário" (ex.: nome de exemplo "Kit de Escalada" ou similar),
  incluindo exemplos em HTML para `description`/`privateInformation` e um
  exemplo textual simples para `price` (ex.: `"5 moedas de prata"`),
  documentando claramente que apenas `name` é obrigatório.
  * ✓ Todos os DTOs possuem `@ApiProperty`/`@ApiPropertyOptional` com exemplos adequados
- Atualizar o `@ApiOperation summary` de `GET /search`
  (`search.controller.ts`) e a descrição do `@ApiProperty` de `entityType`
  em `SearchResultItemResponseDto` para incluir "utilitário"/"utilitários",
  conforme detalhado na subseção "Search" da etapa 1.
  * ✓ Ambas já foram atualizadas na etapa anterior (api-dev)
- Validar no `/docs` que o novo grupo de rotas `utilities` aparece
  corretamente documentado e que `GET /search` reflete o novo
  `LinkableEntityType.UTILITY`.
  * ✓ Todas as rotas estão corretamente documentadas
  * ✓ Search já integrado com LinkableEntityType.UTILITY

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima.
- Revisar a entidade `Utility`: tipos, nullability (`referenceImage`,
  `description`, `price`, `privateInformation` todos nullable; `name` not
  null + índice único), a relação `ManyToMany` com `Tag` via `@JoinTable`
  dedicada `utility_tags` (colunas `utility_id`/`tag_id` nomeadas
  corretamente), e confirmar que não há relação `ManyToOne` de categoria,
  campo de ordenação, nem relação `OneToMany` adicional — não fazem parte do
  escopo.
- Revisar as 2 migrations: ordem de execução (`CreateUtilitiesTable` antes de
  `CreateUtilityTagsTable`, ambas posteriores a
  `1784305860000-CreateConditionSectionsTable.ts`, e a tabela de junção
  dependendo também de `CreateTagsTable` `1784305370000` já existente),
  colunas e nullability idênticas à entidade (`private_information` já
  presente no `CREATE TABLE`, sem depender de migration de retrofit, e
  `reference_image` — não `reference_image_url` — como nome de coluna), PK
  composta e índices da tabela de junção com FKs `ON DELETE CASCADE` nas
  duas colunas, `down()` revertendo tudo (índices, constraints, tabelas) na
  ordem inversa do `up()` nas duas migrations.
- Revisar DTOs e validações: unicidade de nome (409 pt-BR) em
  `create`/`update`, `@IsUrl` condicional em `referenceImage`, `price`
  tratado como texto livre (`@IsString`, sem `@IsNumber`/`@IsNumberString`
  nem qualquer normalização numérica), `description`/`privateInformation`
  opcionais e sem `@IsNotEmpty`, `tagIds` validados contra existência real
  (404 pt-BR), `PartialType` correto em `UpdateUtilityDto`.
- Revisar o service: que `update` só reatribui `tags` quando
  `dto.tagIds !== undefined` (preservando a relação existente quando o
  campo é omitido), que `findById`/listagem carregam a relação `tags` sem
  causar N+1 desnecessário, e que a paginação segue o padrão de duas
  consultas (ids + reload com relations) usado em `MaterialsService`.
- Revisar o controller: guards (`JwtAuthGuard` + `GoogleAccessGuard` +
  `@GoogleAccess('read-only')`), filtro `name` parcial via `ILIKE`,
  ordenação padrão por `name` ASC, paginação
  `{ data, total, page, perPage }` + `totalPages` calculado no controller,
  uso de `fromEntity` em todos os DTOs de resposta, ausência de qualquer
  lógica de filtragem adicional de `privateInformation` por papel/tipo de
  usuário (não faz parte do escopo do backend).
- Revisar as alterações no módulo `search`: enum `LinkableEntityType` com o
  novo valor `UTILITY = 'utility'`, `search.module.ts` com `Utility`
  registrada em `TypeOrmModule.forFeature`, `search.service.ts` com o novo
  repositório injetado e adicionado ao array `linkableEntities` sem alterar
  a lógica de busca genérica existente, `summary` do `@ApiOperation` de
  `GET /search` e descrição de `entityType` em
  `SearchResultItemResponseDto` atualizados para incluir "utilitário"/
  "utilitários".
- Confirmar que o nome de campo/coluna usado na entidade é
  `referenceImage`/`reference_image` (convenção recente, alinhada com
  `Material`/`Equipment`/`Consumable`/`Ammunition`), e não
  `referenceImageUrl`/`reference_image_url`.
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos
  (nome duplicado, registro não encontrado, tags não encontradas, URL
  inválida), enquanto nomes de entidade/colunas/DTOs/JSON permanecem em
  inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration,
  `UtilitiesModule` registrado em `app.module.ts`, skill
  `api-permissao-google-readonly` aplicada no controller).

## Revisão

Etapas 1 (api-dev) e 2 (api-dev-doc) confirmadas como "Status: concluído" antes da
revisão. Todos os arquivos listados nas duas etapas foram lidos integralmente e
comparados campo a campo, linha a linha, com a entidade de referência `Material`
(`app-api/src/modules/materials/`), conforme exigido pelo `## Contexto`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-api/src/modules/utilities/entities/utility.entity.ts` — campos, tipos e
  nullability idênticos a `Material`; `name` com `@Index({ unique: true })`;
  `referenceImage`/`reference_image` e `privateInformation`/`private_information`
  com os nomes corretos (não a convenção antiga `*Url`); `tags` via `ManyToMany` +
  `@JoinTable('utility_tags', utility_id/tag_id)`; sem `ManyToOne` de categoria,
  campo de ordenação ou `OneToMany` adicional.
- `app-api/src/database/migrations/1784305870000-CreateUtilitiesTable.ts` —
  timestamp posterior à última migration existente
  (`1784305860000-CreateConditionSectionsTable.ts`); `CREATE TABLE` com todas as
  colunas (incluindo `private_information`) já na criação, sem retrofit;
  `reference_image` com o nome correto; índice único `IDX_utilities_name`;
  `down()` remove o índice e depois a tabela (ordem inversa correta).
- `app-api/src/database/migrations/1784305880000-CreateUtilityTagsTable.ts` —
  timestamp posterior à migration da tabela principal; PK composta
  `(utility_id, tag_id)`; índices individuais em cada coluna; FKs
  `utility_id → utilities(id)` e `tag_id → tags(id)` ambas com `ON DELETE
  CASCADE`; `down()` desfaz FKs, depois índices, depois a tabela, na ordem
  inversa exata do `up()`.
- `app-api/src/modules/utilities/dto/create-utility.dto.ts`,
  `update-utility.dto.ts`, `find-utilities-query.dto.ts`,
  `utility-response.dto.ts`, `utility-list-item-response.dto.ts`,
  `paginated-utilities-response.dto.ts` — `name` obrigatório
  (`@IsString`/`@IsNotEmpty`); `referenceImage` com `@IsUrl` condicional e
  mensagem pt-BR "A URL da imagem de referência é inválida."; `price` como texto
  livre (`@IsOptional`/`@IsString`, sem `@IsNumber`/`@IsNumberString` ou qualquer
  normalização numérica); `description`/`privateInformation` opcionais sem
  `@IsNotEmpty`; `tagIds` validado com `@IsArray`/`@IsUUID('4', { each: true })`;
  `UpdateUtilityDto` como `PartialType(CreateUtilityDto)`; DTOs de resposta usam
  `static fromEntity` e não vazam nenhum campo fora do escopo da entidade;
  `UtilityListItemResponseDto` enxuto (`id`, `referenceImage`, `name`, `tags`).
- `app-api/src/modules/utilities/utilities.service.ts` — `findByName`/`findById`
  (com `relations: { tags: true }`); `findTagsByIds` privado lançando
  `NotFoundException('Uma ou mais tags não foram encontradas.')`; `create` valida
  nome único com `ConflictException('Já existe um utilitário com este nome.')`;
  `update` só reatribui `tags` quando `dto.tagIds !== undefined` (preservando a
  relação quando omitido) e demais campos seguem o padrão `!== undefined`;
  `findAllPaginated` segue o padrão de duas consultas (ids/name via
  `skip`/`take` + `getManyAndCount`, depois reload com `relations: { tags: true }`
  e reconstrução da ordem via `Map`), evitando N+1 desnecessário e duplicação de
  linhas por `ManyToMany` + paginação; `remove` usa `delete({ id })` com 404 pt-BR
  se `affected === 0`.
- `app-api/src/modules/utilities/utilities.controller.ts` — guards
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  presentes; filtro `name` parcial via `ILIKE` delegado ao service; ordenação
  padrão por `name` ASC; paginação `{ data, total, page, perPage }` +
  `totalPages` calculado no controller (`Math.ceil(total / perPage)`); todos os
  retornos passam por `fromEntity`; nenhuma lógica adicional de
  filtragem/ocultação de `privateInformation` por papel de usuário; Swagger
  completo (`@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiCreatedResponse`,
  `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiConflictResponse`,
  `@ApiNotFoundResponse`, `@ApiBadRequestResponse`) com textos coerentes ao
  domínio "utilitário".
- `app-api/src/modules/utilities/utilities.module.ts` —
  `TypeOrmModule.forFeature([Utility, Tag])`, `controllers`/`providers`/`exports`
  corretos.
- `app-api/src/app.module.ts` — `UtilitiesModule` importado e registrado junto de
  `EquipmentModule`/`MaterialsModule`/`ConsumablesModule`/`AmmunitionModule`.
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` —
  `UTILITY = 'utility'` adicionado ao final do enum.
- `app-api/src/modules/search/search.module.ts` — `Utility` importada e
  registrada em `TypeOrmModule.forFeature`.
- `app-api/src/modules/search/search.service.ts` — repositório de `Utility`
  injetado no construtor e adicionado ao array `linkableEntities`
  (`{ entityType: LinkableEntityType.UTILITY, repository: this.utilitiesRepository }`),
  sem qualquer alteração na lógica genérica de busca (`ILIKE`, `MAX_RESULTS`,
  `orderBy('entity.name', 'ASC')`).
- `app-api/src/modules/search/search.controller.ts` — `summary` de
  `GET /search` atualizado para incluir "utilitários" na posição lógica correta
  ("...equipamentos, materiais, consumíveis, munições, utilitários, regras,
  perícias e condições").
- `app-api/src/modules/search/dto/search-result-item-response.dto.ts` —
  descrição do `@ApiProperty` de `entityType` atualizada incluindo "utilitário"
  na mesma posição lógica.

Todas as mensagens de erro/validação voltadas ao usuário estão em pt-BR (nome
duplicado, registro não encontrado, tags não encontradas, URL inválida),
enquanto nomes de entidade/colunas/DTOs/JSON permanecem em inglês, conforme
convenção do `CLAUDE.md`. A implementação está estruturalmente idêntica ao
template `Material`, sem nenhum campo, relação ou lógica inventada fora do
escopo descrito na task.
