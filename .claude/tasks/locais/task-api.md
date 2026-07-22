# Task API: Locais

## Contexto
Não existe `.claude/tasks/locais/spec.md` para esta demanda — o requisito foi
informado diretamente e já está completo/esclarecido (confirmado pelo
solicitante, incluindo a decisão de que `type` é apenas uma coluna de texto
livre, não uma entidade separada nem enum). Este plano usa como referência de
padrões o módulo `app-api/src/modules/creatures/` (estrutura de entidade,
DTOs, paginação, guards) e reaproveita a entidade `Tag` já existente em
`app-api/src/modules/tags/entities/tag.entity.ts` via relação `ManyToMany`,
no mesmo formato de `creature_tags`.

## Etapas

### 1. api-dev
Status: concluído
Depende de: nada (etapa inicial)

#### Entidade

**`Location`** (tabela `locations`), estendendo `BaseEntity` (herda `id`
uuid, `createdAt`, `updatedAt`). Nomes de colunas/propriedades em inglês;
apenas mensagens de erro/validação ficam em pt-BR:

- `name` (varchar) — "Nome" — obrigatório, único. Aplicar índice único
  (mesmo padrão de `@Index({ unique: true })` usado em `Creature.name`).
- `type` (varchar, nullable) — "Tipo" — opcional, texto livre (não é FK para
  entidade separada nem enum — decisão já confirmada). Filtrável na listagem
  via `ILIKE` parcial, igual ao filtro de `name`.
- `referenceImageUrl` (varchar, nullable, coluna `reference_image_url`) —
  "Imagem Referência" — opcional; quando preenchido deve ser uma URL válida
  (`@IsUrl` no DTO, mensagem pt-BR customizada; validação não fica na
  entidade — mesmo padrão de `Creature.referenceImageUrl`).
- `description` (text, nullable) — "Descrição" — opcional, texto com
  formatação rica armazenado como string HTML (mesmo padrão dos campos de
  texto rico de `Creature`, ex. `physicalCharacteristics`).
- `tags` — relação `ManyToMany` para `Tag` (`modules/tags/entities/tag.entity.ts`),
  via `@JoinTable` dedicada `location_tags`
  (`location_id` / `tag_id`), exatamente no mesmo padrão de
  `Creature.tags` / `creature_tags`.
- `pointsOfInterest` — relação `ManyToMany` **auto-referenciada** em
  `Location` (lado proprietário/direcionado): uma localidade pode apontar
  para outras localidades como pontos de interesse, sem implicar o inverso
  automaticamente. Implementar como duas propriedades `ManyToMany` na mesma
  classe, apontando uma para a outra via `mappedBy` implícito do TypeORM:
  ```ts
  @ManyToMany(() => Location, (location) => location.pointsOfInterestOf)
  @JoinTable({
    name: 'location_points_of_interest',
    joinColumn: { name: 'location_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'point_of_interest_id',
      referencedColumnName: 'id',
    },
  })
  pointsOfInterest!: Location[];

  @ManyToMany(() => Location, (location) => location.pointsOfInterest)
  pointsOfInterestOf!: Location[];
  ```
- `pointsOfInterestOf` — lado inverso (não proprietário) da mesma relação:
  localidades que apontam para esta como ponto de interesse. Somente leitura
  pela API — nunca setável diretamente via `create`/`update` (apenas
  `pointsOfInterestIds`, que altera o lado proprietário `pointsOfInterest`).

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `src/database/migrations/`).
- Migration 1 — `CreateLocationsTable`: cria a tabela `locations` com:
  - `id`, `created_at`, `updated_at` (padrão `BaseEntity`);
  - `name` varchar not null + índice único;
  - `type` varchar nullable;
  - `reference_image_url` varchar nullable;
  - `description` text nullable.
- Migration 2 — `CreateLocationTagsTable`: cria a tabela de junção
  `location_tags` (`location_id` uuid not null, `tag_id` uuid not null, PK
  composta `(location_id, tag_id)`, índices em cada coluna, FK
  `location_id` → `locations(id)` `ON DELETE CASCADE`, FK `tag_id` →
  `tags(id)` `ON DELETE CASCADE`), no mesmo formato de
  `1784305380000-CreateCreatureTagsTable.ts`. Deve rodar depois da migration
  de `locations` e depois de `CreateTagsTable` já existente (depende de
  ambas as tabelas via FK).
- Migration 3 — `CreateLocationPointsOfInterestTable`: cria a tabela de
  junção auto-referenciada `location_points_of_interest` (`location_id` uuid
  not null, `point_of_interest_id` uuid not null, PK composta
  `(location_id, point_of_interest_id)`, índices em cada coluna, FK
  `location_id` → `locations(id)` `ON DELETE CASCADE`, FK
  `point_of_interest_id` → `locations(id)` `ON DELETE CASCADE`). O
  `ON DELETE CASCADE` em ambas as colunas garante que, ao excluir um local
  (seja ele o "dono" da relação ou um ponto de interesse referenciado por
  outros), as linhas de junção correspondentes são removidas
  automaticamente nos dois sentidos, sem impedir a exclusão — mesma
  abordagem de associação (não dependência obrigatória) usada em
  `creature_tags`.
- Gerar as três via `npm run migration:generate` a partir das entidades já
  criadas (`Location`) e revisar o SQL resultante, especialmente as FKs
  duplicadas de `location_points_of_interest` apontando para a mesma tabela
  `locations`.

#### Controller

- Novo módulo `LocationsModule` (`src/modules/locations/`), com
  `LocationsController`, `LocationsService`,
  `TypeOrmModule.forFeature([Location, Tag])` (entidade `Location` já
  auto-registrada via `autoLoadEntities: true`, sem passo manual adicional
  em `app.module.ts`; `LocationsModule` em si precisa ser importado em
  `app.module.ts`, como os demais módulos de feature).
- Protegido por `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, mesmo
  padrão de `CreaturesController`/`UsersController`.
- Endpoints:
  - `POST /locations` — cria local. Valida `name` único (409 pt-BR,
    `ConflictException`, mesmo padrão de nome duplicado em
    `CreaturesService`), `tagIds` existentes (404 pt-BR, "Uma ou mais tags
    não foram encontradas.") e `pointsOfInterestIds` existentes (404 pt-BR,
    ex. "Um ou mais locais (pontos de interesse) não foram encontrados.").
    Retorna `LocationResponseDto`.
  - `GET /locations` — lista paginada. Query DTO com `name` (opcional,
    busca parcial `ILIKE`), `type` (opcional, busca parcial `ILIKE`),
    `page`, `perPage` (defaults `DEFAULT_PAGE`/`DEFAULT_PER_PAGE` de
    `common/variables/pagination.ts`). Ordenação padrão:
    `orderBy('location.name', 'ASC')`. Retorna
    `PaginatedLocationsResponseDto` composto por
    `LocationListItemResponseDto` (id, `referenceImageUrl`, `name`, `type`,
    `tags`).
  - `GET /locations/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
    encontrado. Retorna `LocationResponseDto` completo, incluindo `tags`
    (`TagResponseDto[]`), `pointsOfInterest` e `pointsOfInterestOf` (ambos
    como `LocationShallowResponseDto[]`, formato raso — id, name,
    referenceImageUrl — sem aninhar novamente `pointsOfInterest`/
    `pointsOfInterestOf` dos locais relacionados, evitando recursão).
  - `PUT /locations/:id` — atualiza local (mesmas validações de nome único
    ao trocar o nome, `tagIds`/`pointsOfInterestIds` válidos quando
    informados). Só deve alterar a relação `pointsOfInterest` quando
    `pointsOfInterestIds` for explicitamente enviado no payload (checar
    `dto.pointsOfInterestIds !== undefined`, mesmo padrão usado para
    `dto.tagIds` em `CreaturesService.update`); se omitido, a relação
    existente é preservada. Retorna `LocationResponseDto`.
  - `DELETE /locations/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrado (mesmo padrão de `remove` em `CreaturesController`). A
    remoção de linhas nas tabelas de junção `location_tags` e
    `location_points_of_interest` (nos dois sentidos) é resolvida pelo
    `ON DELETE CASCADE` do schema, sem necessidade de lógica adicional no
    service.
- DTOs:
  - `CreateLocationDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
    - `type` (`@IsOptional`, `@IsString`);
    - `referenceImageUrl` (`@IsOptional`, `@IsUrl`, mensagem de erro pt-BR
      customizada, mesmo padrão de `CreateCreatureDto.referenceImageUrl`);
    - `description` (`@IsOptional`, `@IsString`);
    - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`,
      mesmo padrão de `CreateCreatureDto.tagIds`);
    - `pointsOfInterestIds` (`@IsOptional`, `@IsArray`,
      `@IsUUID('4', { each: true })`) — IDs de outros locais a associar como
      pontos de interesse (lado proprietário).
  - `UpdateLocationDto` — `PartialType(CreateLocationDto)`, mesmo padrão de
    `UpdateCreatureDto`/`UpdateUserDto`.
  - `FindLocationsQueryDto` — `name?` (`@IsOptional @IsString`), `type?`
    (`@IsOptional @IsString`), `page?`, `perPage?` (mesmo padrão de
    `FindCreaturesQueryDto`).
  - `LocationResponseDto` — `id`, `name`, `type`, `referenceImageUrl`,
    `description`, `tags` (`TagResponseDto[]`), `pointsOfInterest`
    (`LocationShallowResponseDto[]`), `pointsOfInterestOf`
    (`LocationShallowResponseDto[]`), `createdAt`, `updatedAt`; com
    `static fromEntity(location): LocationResponseDto`.
  - `LocationListItemResponseDto` — enxuto: `id`, `referenceImageUrl`,
    `name`, `type`, `tags` (`TagResponseDto[]`); com
    `static fromEntity(location)`.
  - `LocationShallowResponseDto` — DTO raso usado exclusivamente para
    serializar itens de `pointsOfInterest`/`pointsOfInterestOf` dentro de
    `LocationResponseDto`, evitando recursão/serialização circular: `id`,
    `name`, `referenceImageUrl`; com `static fromEntity(location)`.
  - `PaginatedLocationsResponseDto` — `data: LocationListItemResponseDto[]`,
    `total`, `page`, `perPage`, `totalPages` (mesmo padrão de
    `PaginatedCreaturesResponseDto`).
- Service (`LocationsService`), pontos principais a replicar do padrão de
  `CreaturesService`:
  - `findByName(name)`, `findById(id)` (com `relations: { tags: true,
    pointsOfInterest: true, pointsOfInterestOf: true }`);
  - `findTagsByIds(tagIds)` privado, reaproveitando `TagsModule`/`Tag`
    (idêntico ao de `CreaturesService`, 404 pt-BR se alguma tag não existir);
  - `findLocationsByIds(ids)` privado, análogo, para validar
    `pointsOfInterestIds` (404 pt-BR se algum local referenciado não
    existir);
  - `create`: valida nome único (409), resolve `tags` e `pointsOfInterest`
    a partir dos ids informados (arrays vazios quando ausentes), persiste;
  - `findAllPaginated`: filtra por `name`/`type` via `ILIKE` parcial,
    ordena por `location.name` ASC, pagina com `skip`/`take` +
    `getManyAndCount`, recarrega os registros da página com relação `tags`
    (suficiente para `LocationListItemResponseDto`);
  - `update`: valida nome único ao trocar, resolve `tags` quando `tagIds`
    informado, resolve `pointsOfInterest` **apenas** quando
    `pointsOfInterestIds !== undefined` no DTO (não sobrescreve a relação
    quando o campo é omitido);
  - `remove`: `delete({ id })`, 404 pt-BR se `affected === 0`.

Status: concluído
Entidade: app-api/src/modules/locations/entities/location.entity.ts
Migration: app-api/src/database/migrations/1784305400000-CreateLocationsTable.ts,
app-api/src/database/migrations/1784305410000-CreateLocationTagsTable.ts,
app-api/src/database/migrations/1784305420000-CreateLocationPointsOfInterestTable.ts
Rotas: POST /locations, GET /locations, GET /locations/:id, PUT /locations/:id,
DELETE /locations/:id
Arquivos: app-api/src/modules/locations/dto/create-location.dto.ts,
app-api/src/modules/locations/dto/update-location.dto.ts,
app-api/src/modules/locations/dto/find-locations-query.dto.ts,
app-api/src/modules/locations/dto/location-response.dto.ts,
app-api/src/modules/locations/dto/location-list-item-response.dto.ts,
app-api/src/modules/locations/dto/location-shallow-response.dto.ts,
app-api/src/modules/locations/dto/paginated-locations-response.dto.ts,
app-api/src/modules/locations/locations.service.ts,
app-api/src/modules/locations/locations.controller.ts,
app-api/src/modules/locations/locations.module.ts,
app-api/src/app.module.ts (registro de LocationsModule)

Observação: o controller inclui apenas as anotações Swagger estruturais
(`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` finos
ficam a cargo da etapa `api-dev-doc`, conforme escopo desta etapa.

### 2. api-dev-doc
Depende da etapa 1 (api-dev)

- Revisar/complementar a documentação Swagger de todos os endpoints novos:
  `@ApiTags('locations')` no controller, `@ApiOperation({ summary })` em
  pt-BR para cada rota (create, list, get by id, update, delete).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, com mensagem pt-BR de
  exemplo), `@ApiNotFoundResponse` (404, local não encontrado, tag(s) não
  encontrada(s), ponto(s) de interesse não encontrado(s)),
  `@ApiBadRequestResponse` (validação — URL inválida em
  `referenceImageUrl`, ids em formato inválido).
- Conferir que todos os campos de `CreateLocationDto`/`UpdateLocationDto`/
  `LocationResponseDto`/`LocationListItemResponseDto`/
  `LocationShallowResponseDto` possuem `@ApiProperty`/`@ApiPropertyOptional`
  com exemplos coerentes, incluindo `type` (texto livre) e `description`
  (exemplo em HTML, mesmo padrão dos campos de texto rico de `Creature`).
- Documentar explicitamente, na descrição do `@ApiProperty` de
  `pointsOfInterestOf` em `LocationResponseDto`, que o campo é somente
  leitura (não aceito em `create`/`update`).
- Confirmar no `/docs` que `pointsOfInterest`/`pointsOfInterestOf`
  aparecem tipados como `LocationShallowResponseDto[]` (e não
  `LocationResponseDto[]`), evitando qualquer indício de referência
  circular no schema gerado pelo Swagger.

Status: concluído
Arquivos: app-api/src/modules/locations/locations.controller.ts,
app-api/src/modules/locations/dto/create-location.dto.ts,
app-api/src/modules/locations/dto/update-location.dto.ts,
app-api/src/modules/locations/dto/location-response.dto.ts,
app-api/src/modules/locations/dto/location-list-item-response.dto.ts,
app-api/src/modules/locations/dto/location-shallow-response.dto.ts,
app-api/src/modules/locations/dto/paginated-locations-response.dto.ts,
app-api/src/modules/locations/dto/find-locations-query.dto.ts
Cobertura: `@ApiTags('locations')`, `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiOkResponse`/`@ApiNoContentResponse`/`@ApiConflictResponse`/
`@ApiNotFoundResponse`/`@ApiBadRequestResponse` em todas as rotas;
`@ApiProperty`/`@ApiPropertyOptional` com exemplos em todos os campos dos
DTOs; `pointsOfInterestOf` documentado como somente leitura em
`LocationResponseDto`; `pointsOfInterest`/`pointsOfInterestOf` tipados como
`LocationShallowResponseDto[]` no schema Swagger.

### 3. api-dev-codereviewer
Depende das etapas 1 e 2

- Revisar a entidade `Location`: tipos, nullability (`type`,
  `referenceImageUrl`, `description` nullable; `name` not null + índice
  único), a relação `ManyToMany` auto-referenciada `pointsOfInterest`/
  `pointsOfInterestOf` (lado proprietário com `@JoinTable` apontando para
  `location_points_of_interest`, lado inverso sem `@JoinTable`), e a
  relação `ManyToMany` com `Tag` via `location_tags`.
- Revisar as migrations: ordem de execução (`locations` antes das tabelas
  de junção; `location_tags` depende também de `CreateTagsTable` já
  existente), PKs compostas e índices das tabelas de junção, FKs com
  `ON DELETE CASCADE` nas duas colunas de `location_points_of_interest`
  (ambas referenciando `locations(id)`), `down()` revertendo tudo
  (constraints, índices, tabelas) na ordem inversa.
- Revisar DTOs e validações: unicidade de nome (409 pt-BR) em `create` e
  `update`, `@IsUrl` condicional em `referenceImageUrl`, `tagIds` e
  `pointsOfInterestIds` validados contra existência real (404 pt-BR),
  `PartialType` correto em `UpdateLocationDto`, e — ponto crítico —
  confirmar que `pointsOfInterestOf` **não** é aceito como campo de
  entrada em nenhum DTO de escrita (`CreateLocationDto`/
  `UpdateLocationDto`), apenas exposto em DTOs de resposta.
- Revisar o service: que `update` só reatribui `pointsOfInterest` quando
  `dto.pointsOfInterestIds !== undefined` (preservando a relação existente
  quando o campo é omitido do payload), e que `findById`/listagem carregam
  as relações necessárias sem causar N+1 desnecessário.
- Revisar o controller: guards (`JwtAuthGuard`/`ApiBearerAuth`), filtros
  (`name` e `type`, ambos `ILIKE` parcial), ordenação padrão por `name`
  ASC, paginação `{ data, total, page, perPage }` + `totalPages`, uso de
  `fromEntity` em todos os DTOs de resposta, e uso de
  `LocationShallowResponseDto` (não `LocationResponseDto`) na serialização
  de `pointsOfInterest`/`pointsOfInterestOf` para evitar recursão.
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome
  duplicado, local não encontrado, tags não encontradas, pontos de
  interesse não encontrados, URL inválida), enquanto nomes de
  entidade/colunas/DTOs/JSON permanecem em inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration).

## Revisão

Escopo revisado: `app-api/src/modules/locations/entities/location.entity.ts`,
`app-api/src/database/migrations/1784305400000-CreateLocationsTable.ts`,
`app-api/src/database/migrations/1784305410000-CreateLocationTagsTable.ts`,
`app-api/src/database/migrations/1784305420000-CreateLocationPointsOfInterestTable.ts`,
`app-api/src/modules/locations/dto/create-location.dto.ts`,
`app-api/src/modules/locations/dto/update-location.dto.ts`,
`app-api/src/modules/locations/dto/find-locations-query.dto.ts`,
`app-api/src/modules/locations/dto/location-response.dto.ts`,
`app-api/src/modules/locations/dto/location-list-item-response.dto.ts`,
`app-api/src/modules/locations/dto/location-shallow-response.dto.ts`,
`app-api/src/modules/locations/dto/paginated-locations-response.dto.ts`,
`app-api/src/modules/locations/locations.service.ts`,
`app-api/src/modules/locations/locations.controller.ts`,
`app-api/src/modules/locations/locations.module.ts`,
`app-api/src/app.module.ts`.

Confirmado que estão corretos e de acordo com o `CLAUDE.md`/plano da task:
entidade `Location` com `name` not null + índice único (`@Index({ unique:
true })`), `type`/`referenceImageUrl` (mapeada para coluna
`reference_image_url`)/`description` (coluna `text`) todos `nullable: true`;
relação `ManyToMany` com `Tag` via `@JoinTable` dedicada `location_tags`
(`location_id`/`tag_id`), no mesmo formato de `Creature.tags`/
`creature_tags`; relação auto-referenciada `pointsOfInterest` (lado
proprietário, com `@JoinTable` apontando para `location_points_of_interest`,
colunas `location_id`/`point_of_interest_id`) e `pointsOfInterestOf` (lado
inverso, sem `@JoinTable`, `mappedBy` implícito via callback), exatamente
como especificado na etapa 1. Migrations com ordem de timestamp correta
(`CreateLocationsTable` 1784305400000 → `CreateLocationTagsTable` 1784305410000,
que depende também de `CreateTagsTable` 1784305370000, já anterior →
`CreateLocationPointsOfInterestTable` 1784305420000), PKs compostas e
índices em ambas as colunas das duas tabelas de junção, FKs com
`ON DELETE CASCADE` nas duas colunas de `location_points_of_interest` (ambas
referenciando `locations(id)`) e nas duas colunas de `location_tags`
(`locations(id)`/`tags(id)`), e `down()` revertendo constraints, índices e
tabelas na ordem inversa em ambas as migrations de junção. DTOs de escrita
com `@IsString`/`@IsNotEmpty` em `name`, `@IsOptional`/`@IsString` em `type`/
`description`, `@IsUrl` condicional com mensagem pt-BR customizada em
`referenceImageUrl`, `@IsArray`/`@IsUUID('4', { each: true })` em `tagIds`/
`pointsOfInterestIds`; `UpdateLocationDto` como `PartialType(CreateLocationDto)`;
confirmado que `pointsOfInterestOf` não é aceito em nenhum DTO de escrita
(`CreateLocationDto`/`UpdateLocationDto`), aparecendo apenas em
`LocationResponseDto`, com descrição explícita de que é campo somente
leitura. `LocationsService.update` só reatribui `pointsOfInterest` quando
`dto.pointsOfInterestIds !== undefined` (mesmo padrão de `dto.tagIds`),
preservando a relação quando o campo é omitido; unicidade de nome (409 pt-BR,
`ConflictException`) verificada em `create` e em `update` (apenas ao trocar o
nome); `findTagsByIds`/`findLocationsByIds` privados validam existência real
com 404 pt-BR ("Uma ou mais tags não foram encontradas."/"Um ou mais locais
(pontos de interesse) não foram encontrados."); `findById` carrega
`tags`/`pointsOfInterest`/`pointsOfInterestOf` em uma única consulta com
`relations`; `findAllPaginated` evita duplicação de linhas por `ManyToMany` +
paginação buscando primeiro só `id`/`name` paginados/ordenados e depois
recarregando a página com `relations: { tags: true }` (mesmo padrão de
`CreaturesService.findAllPaginated`, sem N+1 desnecessário). Controller com
`@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, filtros `name`/`type` via
`ILIKE` parcial, `orderBy('location.name', 'ASC')`, paginação
`{ data, total, page, perPage }` → `totalPages` calculado no controller, uso
de `fromEntity` em todos os DTOs de resposta, `LocationShallowResponseDto`
(não `LocationResponseDto`) usado para serializar `pointsOfInterest`/
`pointsOfInterestOf` evitando recursão; `LocationsModule` com
`TypeOrmModule.forFeature([Location, Tag])`, registrado em `app.module.ts`.
Mensagens de erro/validação em pt-BR em todos os pontos, com nomes de
entidade/colunas/DTOs/JSON em inglês.

Problemas encontrados: nenhum bloqueante. Um ponto menor, de estilo, a
observar:

- **`app-api/src/modules/locations/entities/location.entity.ts:22`,
  `app-api/src/modules/locations/dto/location-response.dto.ts:31,60,61,64`,
  `app-api/src/modules/locations/dto/location-list-item-response.dto.ts:30,39`,
  `app-api/src/modules/locations/locations.service.ts:105`** — algumas
  linhas excedem o `printWidth` padrão do Prettier (80, conforme
  `app-api/.prettierrc`) por concentrar `@ApiProperty`/expressões em uma
  única linha, ex.: `@ApiProperty({ type: () => [TagResponseDto], description: 'Tags associadas ao local' })`.
  Não é um bug (o TypeScript compila e o Swagger é gerado corretamente), mas
  diverge da formatação padrão aplicada em outras partes do módulo (o
  próprio `create-location.dto.ts`, por exemplo, já quebra descrições longas
  em múltiplas linhas).
  - Sugestão: rodar `npm run format` (dentro de `app-api/`) para alinhar
    essas linhas com o restante do arquivo/módulo antes do merge.

Fora esse detalhe de formatação, não foram encontrados problemas de lógica,
tipagem, segurança, nomenclatura, consistência migration↔entidade ou
documentação Swagger nos arquivos revisados.
