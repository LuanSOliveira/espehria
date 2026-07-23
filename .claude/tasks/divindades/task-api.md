# Task API: Divindades

## Contexto
Não existe `.claude/tasks/divindades/spec.md` para esta demanda — o requisito
foi informado diretamente pelo solicitante, de forma completa e já
esclarecida, sem necessidade de passar pelo agente `spec`. Este plano usa
como referência de padrões o módulo `app-api/src/modules/eras/` (entidade
mais próxima em formato de campos: `name` obrigatório, imagem de referência
opcional com `@IsUrl` condicional, `description` em texto rico opcional,
relação `ManyToMany` com `Tag` via `@JoinTable` dedicada, paginação padrão
`{ data, total, page, perPage } + totalPages`, convenção `fromEntity`),
**removendo inteiramente o conceito de `order`/reordenação em cascata**
presente em `Era` (Divindade não tem posição/ordem) e **sem** relação
obrigatória com nenhuma entidade de categoria (ao contrário de
`Race`/`Creature`, que têm `category` obrigatória via `ManyToOne` +
`onDelete: 'RESTRICT'`). A entidade `Tag` já existente em
`app-api/src/modules/tags/entities/tag.entity.ts` é reaproveitada na relação
`ManyToMany`.

Divergência deliberada de nome em relação ao padrão observado em
`Era`/`Race`/`Creature` (que usam `referenceImageUrl`): o requisito já
validado com o usuário pede explicitamente a propriedade `referenceImage`
(tradução direta de "Imagem Referência"), não `referenceImageUrl`. Mantém-se,
porém, a mesma validação condicional de URL (`@IsOptional` + `@IsUrl` com
mensagem pt-BR customizada) e o mesmo estilo de nome de coluna física em
snake_case correspondente (`reference_image`, em vez de
`reference_image_url`).

**Confirmado com o usuário:** `name` deve ser **único**, mesmo padrão de
`Era.name`/`Race.name` (`@Index({ unique: true })` na entidade + constraint
`UNIQUE` na migration + verificação 409 pt-BR no service em `create`/`update`
quando o nome já existe, mensagem "Já existe uma divindade com este nome.").

## Etapas

### 1. api-dev

#### Entidade

**`Divinity`** (tabela `divinities`), estendendo `BaseEntity` (herda `id`
uuid, `createdAt`, `updatedAt`). Nomes de colunas/propriedades em inglês;
apenas mensagens de erro/validação ficam em pt-BR:

- `name` (varchar, not null) — obrigatório e **único**. Índice único
  (`@Index({ unique: true })`, mesmo padrão de `Era.name`/`Race.name`).
- `referenceImage` (varchar, nullable, coluna `reference_image`) — opcional;
  quando preenchido deve ser uma URL válida (`@IsUrl` condicional no DTO,
  mensagem pt-BR customizada — mesmo padrão de `Era.referenceImageUrl` /
  `Race.referenceImageUrl`, mas com nome de propriedade/coluna divergente
  conforme especificado pelo usuário).
- `description` (text, nullable) — campo de texto rico (HTML gerado pelo
  Tiptap no frontend), opcional, mesmo padrão de `Era.description` /
  `Race.description`.
- `tags` — relação `ManyToMany` para `Tag`
  (`modules/tags/entities/tag.entity.ts`), via `@JoinTable` dedicada
  `divinity_tags` (`divinity_id` / `tag_id`), exatamente no mesmo padrão de
  `Era.tags` / `era_tags`. Opcional (array vazio quando nenhuma tag é
  associada).

Nenhum campo de ordenação (`order`/`ordering`) e nenhuma relação
`ManyToOne` obrigatória com entidade de categoria — `Divinity` é uma
entidade "solta", sem agregado de categoria nem posição relativa.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `src/database/migrations/`). Última migration existente é
  `1784305500000-ChangeEventYearColumnsToInteger.ts`; as novas devem ter
  timestamp posterior:

- Migration 1 — `CreateDivinitiesTable` (timestamp sugerido
  `1784305510000`): cria a tabela `divinities` com `id`, `created_at`,
  `updated_at` (padrão `BaseEntity`), `name` varchar not null + índice único
  (`IDX_divinities_name`, mesmo padrão de `IDX_eras_name`),
  `reference_image` varchar nullable, `description` text nullable. Sem
  coluna de ordenação.
- Migration 2 — `CreateDivinityTagsTable` (timestamp sugerido
  `1784305520000`): cria a tabela de junção `divinity_tags` (`divinity_id`
  uuid not null, `tag_id` uuid not null, PK composta
  `(divinity_id, tag_id)`, índices em cada coluna, FK `divinity_id` →
  `divinities(id)` `ON DELETE CASCADE`, FK `tag_id` → `tags(id)`
  `ON DELETE CASCADE`), no mesmo formato de
  `1784305470000-CreateEraTagsTable.ts`. Depende de `CreateDivinitiesTable` e
  da `CreateTagsTable` (`1784305370000`) já existente.
- Gerar as duas via `npm run migration:generate` a partir da entidade
  `Divinity` já criada e revisar manualmente o SQL resultante (nome das
  constraints/índices, tipos de coluna, `down()` revertendo tudo — índices,
  FKs e tabelas — na ordem inversa do `up()`).

#### Controller

- Novo módulo `DivinitiesModule` (`src/modules/divinities/`), com
  `DivinitiesController`, `DivinitiesService`,
  `TypeOrmModule.forFeature([Divinity, Tag])` (referenciando `Tag`
  diretamente via `forFeature`, sem precisar importar `TagsModule`, mesmo
  padrão de `ErasModule`/`RacesModule`). O módulo precisa ser importado em
  `app.module.ts` (a entidade já é auto-registrada via
  `autoLoadEntities: true`).
- Controller protegido por `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`,
  mesmo padrão de `ErasController`.

**`DivinitiesController`**:
- Endpoints:
  - `POST /divinities` — cria divindade. Valida `name` único (409 pt-BR,
    "Já existe uma divindade com este nome."), `tagIds` existentes quando
    informados (404 pt-BR, "Uma ou mais tags não foram encontradas.").
    Retorna `DivinityResponseDto`.
  - `GET /divinities` — lista paginada. Query DTO com `name` (opcional,
    `ILIKE` parcial), `page`, `perPage` (defaults de
    `common/variables/pagination.ts`). Ordenação padrão:
    `orderBy('divinity.name', 'ASC')` (não há coluna de posição para ordenar
    por ela, ao contrário de `Era`). Retorna
    `PaginatedDivinitiesResponseDto` composto por
    `DivinityListItemResponseDto` (enxuto: `id`, `referenceImage`, `name`,
    `tags` — a listagem exibe tags).
  - `GET /divinities/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
    encontrada ("Divindade não encontrada."). Retorna `DivinityResponseDto`
    completo (`id`, `name`, `referenceImage`, `description`, `tags`,
    `createdAt`, `updatedAt`).
  - `PUT /divinities/:id` — atualiza divindade. Mesma validação de nome
    único ao trocar o nome (409 pt-BR) e de `tagIds` válidos quando
    informados; demais campos seguem o padrão `!== undefined` (omitir o
    campo no body mantém o valor atual). Retorna `DivinityResponseDto`.
  - `DELETE /divinities/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrada ("Divindade não encontrada."). A remoção de linhas em
    `divinity_tags` é resolvida pelo `ON DELETE CASCADE` do schema.

- DTOs de `Divinity`:
  - `CreateDivinityDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
    - `referenceImage` (`@IsOptional`, `@IsUrl`, mensagem pt-BR customizada,
      mesmo padrão de `CreateEraDto.referenceImageUrl`, mas com nome de
      propriedade `referenceImage`);
    - `description` (`@IsOptional`, `@IsString`);
    - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`).
  - `UpdateDivinityDto` — `PartialType(CreateDivinityDto)` (mesmo padrão
    simples de `UpdateEraDto`/`UpdateRaceDto`; não há necessidade de
    tratamento especial de campo nulável explícito, já que não há nenhuma
    relação `ManyToOne` opcional como `Event.era`).
  - `FindDivinitiesQueryDto` — `name?` (`@IsOptional @IsString`, filtro
    parcial), `page?`, `perPage?` (mesmo padrão de `FindErasQueryDto`, sem
    filtro adicional de ordenação).
  - `DivinityResponseDto` — `id`, `name`, `referenceImage`, `description`,
    `tags` (`TagResponseDto[]`), `createdAt`, `updatedAt`; com `static
    fromEntity(divinity): DivinityResponseDto`.
  - `DivinityListItemResponseDto` — enxuto: `id`, `referenceImage`, `name`,
    `tags` (`TagResponseDto[]`); com `static fromEntity(divinity)`.
  - `PaginatedDivinitiesResponseDto` — `data: DivinityListItemResponseDto[]`,
    `total`, `page`, `perPage`, `totalPages` (mesmo padrão de
    `PaginatedErasResponseDto`).

- Service `DivinitiesService` (injeta `Repository<Divinity>` e
  `Repository<Tag>`; **não** precisa de `DataSource`/transação, já que não
  há nenhuma regra de reordenação em cascata nem múltiplos updates
  dependentes — diferente de `ErasService`), pontos principais:
  - `findByName(name)`, `findById(id)` (com `relations: { tags: true }`);
  - `findTagsByIds(tagIds)` privado, idêntico ao já usado em
    `ErasService`/`RacesService` (404 pt-BR se alguma tag não existir);
  - `create(dto)`: valida nome único (409 pt-BR, "Já existe uma divindade
    com este nome.", mesmo padrão de `ErasService.create`), resolve `tags` a
    partir dos ids informados (array vazio quando ausente), persiste via
    `divinitiesRepository.save` (sem transação — não há cascata a proteger);
  - `findAllPaginated(query)`: filtra por `name` (`ILIKE` parcial), ordena
    por `divinity.name` ASC, pagina buscando primeiro `id` via
    `skip`/`take` + `getManyAndCount` e depois recarrega a página completa
    com `relations: { tags: true }` (mesmo padrão de duas consultas usado em
    `ErasService.findAllPaginated`/`RacesService.findAllPaginated`, evitando
    duplicação de linhas por `ManyToMany` + paginação);
  - `update(id, dto)`: carrega a divindade atual (404 pt-BR se não
    encontrada), valida nome único ao trocar (409 pt-BR), atualiza
    `name`/`referenceImage`/`description` apenas quando `!== undefined`,
    resolve `tags` apenas quando `dto.tagIds !== undefined` (preserva a
    relação quando omitido), salva;
  - `remove(id)`: `delete({ id })`, 404 pt-BR se `affected === 0`.

Status: concluído
Entidade: app-api/src/modules/divinities/entities/divinity.entity.ts
Migration: app-api/src/database/migrations/1784305510000-CreateDivinitiesTable.ts,
app-api/src/database/migrations/1784305520000-CreateDivinityTagsTable.ts
Rotas: POST /divinities, GET /divinities, GET /divinities/:id, PUT /divinities/:id,
DELETE /divinities/:id
Arquivos: app-api/src/modules/divinities/dto/create-divinity.dto.ts,
app-api/src/modules/divinities/dto/update-divinity.dto.ts,
app-api/src/modules/divinities/dto/find-divinities-query.dto.ts,
app-api/src/modules/divinities/dto/divinity-response.dto.ts,
app-api/src/modules/divinities/dto/divinity-list-item-response.dto.ts,
app-api/src/modules/divinities/dto/paginated-divinities-response.dto.ts,
app-api/src/modules/divinities/divinities.service.ts,
app-api/src/modules/divinities/divinities.controller.ts,
app-api/src/modules/divinities/divinities.module.ts,
app-api/src/app.module.ts (registro de DivinitiesModule)

Observação: o controller inclui apenas as anotações Swagger estruturais
(`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` finos
ficam a cargo da etapa `api-dev-doc`, conforme escopo desta etapa.

Observação (pendência de execução): este agente só tem acesso às ferramentas
Read/Grep/Glob/Edit/Write/Skill (sem Bash), portanto não foi possível rodar
`npm run migration:generate`/`npm run build`/`npm run migration:run` neste
ambiente. As duas migrations foram escritas manualmente seguindo exatamente o
padrão de `1784305460000-CreateErasTable.ts`/`1784305470000-CreateEraTagsTable.ts`,
com conferência campo a campo contra a entidade `Divinity` (colunas `name`
com índice único `IDX_divinities_name`, `reference_image` nullable,
`description` nullable — sem coluna de ordenação —, e a tabela de junção
`divinity_tags` com PK composta, índices em ambas as colunas e FKs `ON DELETE
CASCADE` para `divinities(id)`/`tags(id)`). Recomenda-se rodar `npm run build`
(e, mediante confirmação explícita do usuário, `npm run migration:generate`/
`npm run migration:run`) em um ambiente com acesso a shell antes de prosseguir
para a etapa `api-dev-doc`/revisão final, para validar que o SQL gerado
automaticamente pelo TypeORM coincide exatamente com o escrito manualmente
aqui.

### 2. api-dev-doc
- Depende da etapa 1 (api-dev).
- Adicionar `@ApiTags('divinities')` em `DivinitiesController`, com
  `@ApiOperation({ summary })` em pt-BR para cada rota (criar, listar,
  buscar por id, atualizar, remover).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, em `create`/`update`),
  `@ApiNotFoundResponse` (404 — divindade não encontrada, tags não
  encontradas, cobrindo `create`, `findOne`, `update`, `remove` de forma
  precisa), `@ApiBadRequestResponse` (URL inválida em `referenceImage`,
  `id`/`tagIds` em formato inválido).
- Conferir que todos os campos de `CreateDivinityDto`/`UpdateDivinityDto`/
  `DivinityResponseDto`/`DivinityListItemResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes, incluindo
  `description` (exemplo em HTML) e `referenceImage` (exemplo de URL,
  deixando claro no texto da propriedade que o nome diverge
  intencionalmente do padrão `referenceImageUrl` usado em outras entidades
  do projeto, por especificação literal do requisito).
- Validar no `/docs` que a listagem paginada (`GET /divinities`) documenta
  corretamente o filtro `name` (parcial, case-insensitive) e que
  `DivinityListItemResponseDto` documenta `tags` (a listagem exibe tags).

Status: concluído
Arquivos: app-api/src/modules/divinities/divinities.controller.ts

### 3. api-dev-codereviewer
- Revisar tudo acima.
- Revisar a entidade `Divinity`: tipos, nullability (`referenceImage`/
  `description` nullable, `name` not null), índice único em `name`
  (`@Index({ unique: true })`), nome de coluna física `reference_image`
  (não `reference_image_url`), relação `ManyToMany` com `Tag` via
  `@JoinTable` dedicada `divinity_tags`, ausência de qualquer coluna de
  ordenação (`order`/`ordering`) e de qualquer relação `ManyToOne`
  obrigatória com entidade de categoria.
- Revisar as migrations: ordem de execução (`divinities` → `divinity_tags`,
  dependendo também de `CreateTagsTable` já existente), índice único em
  `name` (`IDX_divinities_name`, criado como `CREATE UNIQUE INDEX`, não
  `DEFERRABLE` — não há regra de reordenação em cascata que exija isso),
  PK composta e índices da tabela de junção `divinity_tags` com FKs
  `ON DELETE CASCADE` nas duas colunas, `down()` revertendo tudo (índices,
  FKs, tabelas) na ordem inversa do `up()`.
- Revisar DTOs e validações: `@IsUrl` condicional em `referenceImage`
  (mensagem pt-BR), `tagIds` validados contra existência real (404 pt-BR)
  em `create`/`update`, `UpdateDivinityDto` como `PartialType` simples (sem
  necessidade de tratamento de campo nulável explícito).
- Revisar o service `DivinitiesService`: validação de nome único (409
  pt-BR) em `create`/`update` (inclusive ao editar sem trocar o próprio
  nome — não deve conflitar consigo mesma), que `update` só reatribui
  `tags` quando `dto.tagIds !== undefined`, e que `findAllPaginated` ordena
  por `name` ASC sem causar N+1 (padrão de duas consultas: ids paginados +
  reload com `relations`).
- Revisar o controller: guard (`JwtAuthGuard`/`ApiBearerAuth`), paginação
  `{ data, total, page, perPage }` + `totalPages` calculado no controller,
  uso de `fromEntity` em todos os DTOs de resposta.
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos
  (divindade não encontrada, nome duplicado, tags não encontradas, URL
  inválida), enquanto nomes de entidade/colunas/DTOs/JSON permanecem em
  inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration,
  `DivinitiesModule` registrado em `app.module.ts`).

## Revisão

Escopo revisado: `app-api/src/modules/divinities/entities/divinity.entity.ts`,
`app-api/src/database/migrations/1784305510000-CreateDivinitiesTable.ts`,
`app-api/src/database/migrations/1784305520000-CreateDivinityTagsTable.ts`,
todos os DTOs de `divinities` listados no campo "Arquivos" da etapa
"1. api-dev" (`create-divinity.dto.ts`, `update-divinity.dto.ts`,
`find-divinities-query.dto.ts`, `divinity-response.dto.ts`,
`divinity-list-item-response.dto.ts`, `paginated-divinities-response.dto.ts`),
`divinities.service.ts`, `divinities.controller.ts`, `divinities.module.ts` e o
registro em `app.module.ts`. Etapas "1. api-dev" e "2. api-dev-doc" estão ambas
marcadas como "Status: concluído", portanto a revisão avaliou o trabalho como
pronto para análise final. Como este agente de revisão só tem acesso às
ferramentas Read/Grep/Glob/Edit (sem Bash), não foi possível rodar `npm run
build`/`npm run migration:run` para validar a compilação/aplicação das
migrations escritas manualmente — a verificação abaixo foi feita por leitura e
comparação campo a campo com o SQL de `1784305460000-CreateErasTable.ts`/
`1784305470000-CreateEraTagsTable.ts`, já testado/aprovado anteriormente.

Confirmado que estão corretos e de acordo com o `CLAUDE.md`/plano da task:

- **Índice único em `name` (não `DEFERRABLE`)**: `Divinity.name` tem
  `@Index({ unique: true })` (mesma ordem de decorators de `Era.name`:
  `@ApiProperty()`, `@Index({ unique: true })`, `@Column()`);
  `1784305510000-CreateDivinitiesTable.ts` cria `IDX_divinities_name` via
  `CREATE UNIQUE INDEX` simples (não uma constraint `DEFERRABLE INITIALLY
  DEFERRED`), corretamente, já que não há nenhuma regra de reordenação em
  cascata que exija estados intermediários colidentes — divergindo, de forma
  correta e intencional, do padrão `UQ_eras_ordering` usado em `Era`.
- **Verificação 409 de nome duplicado sem falso-positivo em `update`**:
  `DivinitiesService.create` verifica `findByName(dto.name)` antes do insert
  (409 pt-BR, "Já existe uma divindade com este nome."); `update` usa
  `if (dto.name && dto.name !== divinity.name)` antes de checar duplicidade —
  idêntico ao padrão já aprovado em `ErasService.update` — portanto editar uma
  divindade sem trocar o próprio nome não aciona o 409 contra si mesma.
- **`referenceImage` consistente em toda a stack**: propriedade da entidade
  (`referenceImage!: string | null`), coluna física `reference_image`
  (`@Column({ type: 'varchar', nullable: true, name: 'reference_image' })`,
  refletida exatamente em `1784305510000-CreateDivinitiesTable.ts` como
  `"reference_image" character varying`), `CreateDivinityDto.referenceImage`,
  `DivinityResponseDto.referenceImage`, `DivinityListItemResponseDto
  .referenceImage` e uso consistente no controller/service — nenhuma
  ocorrência residual de `referenceImageUrl` no módulo `divinities`.
- **Ausência de `order`/`ordering` e de relação `ManyToOne` de categoria**:
  confirmada tanto na entidade (`Divinity` só tem `name`, `referenceImage`,
  `description`, `tags`, além de `id`/`createdAt`/`updatedAt` herdados de
  `BaseEntity`) quanto nas migrations e nos DTOs/service/controller — nenhum
  vestígio de coluna de posição ou de `ManyToOne` obrigatória.
- **Migrations**: ordem cronológica correta e posterior à última migration
  existente (`1784305500000-ChangeEventYearColumnsToInteger.ts`), com
  `1784305510000-CreateDivinitiesTable.ts` (`divinities`) antes de
  `1784305520000-CreateDivinityTagsTable.ts` (`divinity_tags`, que depende de
  `divinities` e de `tags`/`1784305370000-CreateTagsTable.ts`); tipos de coluna
  (`character varying`, `text`, `uuid`), nullability, PK simples
  (`PK_divinities_id`) e PK composta (`PK_divinity_tags` em
  `(divinity_id, tag_id)`), índices (`IDX_divinity_tags_divinity_id`,
  `IDX_divinity_tags_tag_id`) e FKs (`FK_divinity_tags_divinity_id` →
  `divinities(id)`, `FK_divinity_tags_tag_id` → `tags(id)`, ambas `ON DELETE
  CASCADE ON UPDATE NO ACTION`) conferem exatamente com a entidade e com o
  formato de `1784305470000-CreateEraTagsTable.ts`; `down()` de ambas as
  migrations reverte tudo (constraints/FKs, índices, tabela) na ordem inversa
  do `up()`.
- **DTOs e validação**: `CreateDivinityDto.referenceImage` com `@IsOptional()`
  + `@IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })`
  (mensagem pt-BR customizada); `tagIds` com `@IsOptional`, `@IsArray`,
  `@IsUUID('4', { each: true })`, validados contra existência real via
  `findTagsByIds` (404 pt-BR, "Uma ou mais tags não foram encontradas.") em
  `create`/`update`; `UpdateDivinityDto` é um `PartialType(CreateDivinityDto)`
  simples, sem necessidade de tratamento de campo nulável explícito (coerente
  com a ausência de qualquer relação `ManyToOne` opcional, ao contrário de
  `Event.eraId`).
- **Service `DivinitiesService`**: `findAllPaginated` ordena por
  `divinity.name` ASC (sem coluna de posição para ordenar) usando o mesmo
  padrão de duas consultas (ids paginados + reload com `relations: { tags:
  true }`) de `ErasService`/`RacesService`, evitando N+1 e duplicação de linhas
  por `ManyToMany` + paginação; `update` só reatribui `tags` quando
  `dto.tagIds !== undefined`, preservando a relação quando omitido; `remove`
  usa `delete({ id })` com checagem de `affected === 0` (404 pt-BR).
- **Controller**: `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` no nível da
  classe; paginação `{ data, total, page, perPage }` + `totalPages =
  Math.ceil(total / perPage)` calculado no controller; `fromEntity` usado em
  `DivinityResponseDto`/`DivinityListItemResponseDto` em todos os endpoints de
  resposta; `ParseUUIDPipe` em `:id`.
- **Documentação Swagger**: `@ApiTags('divinities')`, `@ApiOperation({
  summary })` em pt-BR em todas as rotas, `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` presente tanto em `create` quanto em `update` (nome
  duplicado), `@ApiNotFoundResponse`/`@ApiBadRequestResponse` presentes e
  coerentes com o comportamento real de cada rota; `CreateDivinityDto
  .referenceImage` documenta explicitamente, no texto da propriedade, a
  divergência intencional do nome em relação a `referenceImageUrl` usado em
  outras entidades do projeto.
- **Mensagens de erro/validação**: em pt-BR em todos os pontos ("Já existe uma
  divindade com este nome.", "Divindade não encontrada.", "Uma ou mais tags
  não foram encontradas.", "A URL da imagem de referência é inválida."), nomes
  de entidade/coluna/DTO/JSON em inglês.
- **Módulo**: `DivinitiesModule` com `TypeOrmModule.forFeature([Divinity,
  Tag])` (referenciando `Tag` diretamente, sem importar `TagsModule`, mesmo
  padrão de `ErasModule`), registrado em `app.module.ts`; entidade
  auto-carregada via `autoLoadEntities: true`.

Problema encontrado (não bloqueante, apenas documentação incompleta):

- **`app-api/src/modules/divinities/dto/divinity-response.dto.ts:19-24`** e
  **`app-api/src/modules/divinities/dto/divinity-list-item-response.dto.ts:13-18`**
  — A nota sobre a divergência intencional do nome `referenceImage` em relação
  ao padrão `referenceImageUrl` usado em outras entidades do projeto só está
  presente no `@ApiPropertyOptional` de `CreateDivinityDto.referenceImage`
  (herdada por `UpdateDivinityDto` via `PartialType`). O plano da task pede
  essa clareza "incluindo `referenceImage`" ao conferir os campos de
  `CreateDivinityDto`/`UpdateDivinityDto`/`DivinityResponseDto`/
  `DivinityListItemResponseDto`, mas as descrições de `referenceImage` em
  `DivinityResponseDto` e `DivinityListItemResponseDto` só mencionam que o
  campo "pode ser nula se não informada", sem repetir a nota de divergência de
  nome.
  - Trecho: `@ApiPropertyOptional({ description: 'URL de uma imagem de
    referência da divindade (pode ser nula se não informada)', example:
    'https://exemplo.com/zeus.jpg' })` (em ambos os arquivos).
  - Sugestão: complementar a `description` desses dois campos com a mesma nota
    usada em `CreateDivinityDto` (ex.: "... nome de propriedade diverge
    intencionalmente de `referenceImageUrl`, usado em outras entidades do
    projeto, por especificação literal do requisito"), para que a divergência
    fique documentada também nos DTOs de resposta consultados via `/docs`.

Demais itens revisados (entidade, migrations, DTOs, service, controller,
mensagens de erro, Swagger, módulo) estão corretos e sem outros problemas
identificados — em particular, os cinco pontos de risco levantados no plano
(índice único não-`DEFERRABLE`, verificação 409 sem falso-positivo em
`update`, nome de propriedade `referenceImage` consistente, ausência de
`order`/`ManyToOne` de categoria, e migrations escritas manualmente
consistentes com a entidade) foram confirmados como corretamente
implementados.
