# Task API: Tags (CRUD completo)

## Contexto
Não há `.claude/tasks/tags/spec.md` para esta demanda — o pedido já veio claro
diretamente do usuário (ver mensagem original que originou este plano).

Requisitos de negócio fornecidos:
- Nova entidade `Tag` estendendo `BaseEntity`, com os campos `name` (Nome) e
  `color` (Cor — valor de cor, ex. hex).
- CRUD completo seguindo o padrão do módulo `users`
  (`app-api/src/modules/users/`): entidade, DTOs com `class-validator`
  (create/update/find-query/response/paginated-response), service, controller
  com paginação e listagem com filtro por nome, module.
- Migration TypeORM obrigatória (`synchronize` é `false`).
- Mensagens de erro/validação em pt-BR.
- Endpoints protegidos por `JwtAuthGuard`, seguindo o padrão do projeto.

Módulo de referência usado como padrão: `app-api/src/modules/users/`
(estrutura de módulo, `BaseEntity`, DTOs com `class-validator`/`@ApiProperty`,
convenção `fromEntity`, paginação `{ data, total, page, perPage }` +
`totalPages`, `JwtAuthGuard`/`@ApiBearerAuth()`, mensagens de erro pt-BR via
`ConflictException`/`NotFoundException`).

Ponto a sinalizar (lacuna de requisito, não de arquitetura): o pedido não
especifica se `name` deve ser único (como `email` é em `User`) nem qual o
formato/validação esperado para `color` (ex.: restringir a hex `#RRGGBB` via
regex, ou aceitar qualquer string livre de cor). O plano abaixo assume, como
padrão conservador alinhado ao restante do projeto, que `name` é único (mesmo
padrão de unicidade de `User.email`) e que `color` é validado como string hex
via `@Matches`. Validar essas duas decisões com o usuário antes ou durante a
implementação, ajustando se necessário.

## Etapas

### 1. api-dev

Status: concluído
Entidade: app-api/src/modules/tags/entities/tag.entity.ts
Migration: app-api/src/database/migrations/1784305370000-CreateTagsTable.ts
Rotas: POST /tags, GET /tags, GET /tags/:id, PUT /tags/:id, DELETE /tags/:id
Arquivos: app-api/src/modules/tags/dto/create-tag.dto.ts, app-api/src/modules/tags/dto/update-tag.dto.ts, app-api/src/modules/tags/dto/find-tags-query.dto.ts, app-api/src/modules/tags/dto/tag-response.dto.ts, app-api/src/modules/tags/dto/paginated-tags-response.dto.ts, app-api/src/modules/tags/tags.service.ts, app-api/src/modules/tags/tags.controller.ts, app-api/src/modules/tags/tags.module.ts, app-api/src/app.module.ts (registro do TagsModule)

#### Entidade

- `Tag` (tabela `tags`), estendendo `BaseEntity` (herda `id` uuid,
  `createdAt`, `updatedAt`), em
  `app-api/src/modules/tags/entities/tag.entity.ts`:
  - `name` (varchar) — "Nome" — obrigatório. Índice único
    (`@Index({ unique: true })`, mesmo padrão de `email` em `User`) — **assumido
    por padrão**, já que o pedido não define explicitamente unicidade; sinalizar
    para confirmação.
  - `color` (varchar) — "Cor" — obrigatório, valor de cor (ex.: hex
    `#RRGGBB`). Sem relacionamentos.
  - Sem outros campos além dos herdados de `BaseEntity`.
- Nenhum relacionamento com outras entidades é exigido pelo escopo atual.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `app-api/src/database/migrations/`).
- Nome sugerido: `CreateTagsTable` (timestamp posterior ao das migrations já
  existentes, ex. `1784305370000-CreateTagsTable.ts`, seguindo o padrão de
  nomenclatura de `1784305360000-CreateCreaturesTable.ts`).
- Cria a tabela `tags` com:
  - `id` uuid PK default `gen_random_uuid()`, `created_at`, `updated_at`
    (padrão `BaseEntity`, igual às demais tabelas);
  - `name` varchar not null + índice único;
  - `color` varchar not null.
- Gerar via `npm run migration:generate -- src/database/migrations/CreateTagsTable`
  a partir da entidade já criada, e revisar o SQL resultante (nomes de
  constraints/índices, tipos, nullability) antes de aplicar.

#### Controller

- Novo módulo `TagsModule` (`app-api/src/modules/tags/`), com
  `TagsController`, `TagsService`, `TagsModule` importando
  `TypeOrmModule.forFeature([Tag])`. Entidade fica auto-registrada via
  `autoLoadEntities: true`, sem passo manual adicional além de registrar
  `TagsModule` em `app.module.ts` (ao lado de `UsersModule`,
  `CreaturesModule`, `SearchModule`).
- Protegido por `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` a nível de
  classe, mesmo padrão de `UsersController`/`CreaturesController`.
- Endpoints:
  - `POST /tags` — cria tag. Valida `name` único (409 pt-BR se duplicado,
    mesmo padrão de `ConflictException` usado para e-mail em `UsersService`).
  - `GET /tags` — lista paginada com filtro por nome (`name?`, busca parcial
    `ILIKE`, mesmo padrão de `email` em `FindUsersQueryDto`/
    `UsersService.findAllLocalPaginated`), mais `page`/`perPage` (defaults
    `DEFAULT_PAGE`/`DEFAULT_PER_PAGE` de `common/variables/pagination.ts`).
    Ordenação padrão: `orderBy('tag.createdAt', 'DESC')` (mesmo padrão de
    `UsersService`). Retorna `PaginatedTagsResponseDto`.
  - `GET /tags/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR
    ("Tag não encontrada.") se não encontrada. Retorna `TagResponseDto`.
  - `PUT /tags/:id` — atualiza tag (mesma validação de unicidade de `name` ao
    trocar o valor, mesmo padrão de `UsersService.updateLocalUser`). Retorna
    `TagResponseDto`.
  - `DELETE /tags/:id` — remove, `204 No Content`, 404 pt-BR
    ("Tag não encontrada.") se não encontrada (mesmo padrão de `remove` em
    `UsersController`/`deleteLocalUser` em `UsersService`).
- DTOs (em `app-api/src/modules/tags/dto/`):
  - `CreateTagDto` — `name` (`@IsString`, `@IsNotEmpty`, obrigatório), `color`
    (`@IsString`, `@IsNotEmpty`, obrigatório; considerar `@Matches(/^#([0-9A-Fa-f]{6})$/)`
    com mensagem pt-BR customizada para validar formato hex — assumido por
    padrão, sinalizar para confirmação do formato exato aceito).
  - `UpdateTagDto` — `PartialType(CreateTagDto)`, mesmo padrão de
    `UpdateUserDto`.
  - `FindTagsQueryDto` — `name?` (`@IsOptional @IsString`), `page?`,
    `perPage?` (mesmo padrão de `FindUsersQueryDto`).
  - `TagResponseDto` — `id`, `name`, `color`, `createdAt` (mesmo conjunto de
    campos expostos que `UserResponseDto`, incluindo `updatedAt` se fizer
    sentido para o consumidor da API — seguir exatamente o padrão de
    `UserResponseDto`, que expõe `createdAt` mas não `updatedAt`); com
    `static fromEntity(tag): TagResponseDto`.
  - `PaginatedTagsResponseDto` — `data: TagResponseDto[]`, `total`, `page`,
    `perPage`, `totalPages` (mesmo padrão de `PaginatedUsersResponseDto`).
- Service (`TagsService`, `app-api/src/modules/tags/tags.service.ts`):
  - `create(dto: CreateTagDto): Promise<Tag>` — valida `name` único
    (`ConflictException('Este nome já está em uso.')` se duplicado, mesma
    forma de mensagem/estrutura de `UsersService.createLocalUserWithPassword`).
  - `findById(id): Promise<Tag | null>`.
  - `findAllPaginated(query: FindTagsQueryDto)` — mesmo padrão de
    `findAllLocalPaginated`, mas sem filtro de `provider` (não se aplica a
    `Tag`).
  - `update(id, dto: UpdateTagDto): Promise<Tag>` — 404 pt-BR
    (`NotFoundException('Tag não encontrada.')`) se não encontrada; 409 pt-BR
    se `name` alterado colidir com outra tag existente.
  - `remove(id): Promise<void>` — 404 pt-BR se não encontrada.

### 2. api-dev-doc

Status: concluído
Depende da etapa 1 (api-dev)

- Adicionar/revisar documentação Swagger de todos os endpoints novos:
  `@ApiTags('tags')` no controller, `@ApiOperation({ summary })` em pt-BR para
  cada rota (criar, listar, buscar por id, atualizar, remover).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST),
  `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE),
  `@ApiConflictResponse` (409, nome duplicado, com mensagem pt-BR de exemplo
  "Este nome já está em uso."), `@ApiNotFoundResponse` (404, "Tag não
  encontrada."), `@ApiBadRequestResponse` (validação — `name`/`color`
  ausentes ou formato de `color` inválido).
- Conferir que todos os campos de `CreateTagDto`/`UpdateTagDto`/
  `TagResponseDto`/`PaginatedTagsResponseDto` possuem `@ApiProperty`/
  `@ApiPropertyOptional` com exemplos coerentes (ex.: `name: 'Urgente'`,
  `color: '#FF5733'`).
- `@ApiBearerAuth()` no controller, mesmo padrão de `UsersController`/
  `CreaturesController`.

### 3. api-dev-codereviewer

Status: concluído
Depende das etapas 1 e 2

- Revisar a entidade `Tag` (tipos, nullability, índice único em `name` —
  confirmando se a decisão de unicidade assumida na etapa 1 foi validada ou
  precisa de ajuste).
- Revisar a migration `CreateTagsTable`: nome/tipo das colunas (`name`,
  `color` ambos varchar not null), índice único em `name`, `down()`
  revertendo tudo (índice e tabela), timestamp posterior às migrations
  existentes.
- Revisar DTOs e validações: `name` e `color` obrigatórios em
  `CreateTagDto`, `UpdateTagDto` como `PartialType`, unicidade de `name`
  tratada com `ConflictException` 409 pt-BR tanto em `create` quanto em
  `update`, validação de formato de `color` (se implementada, confirmar se
  está de acordo com o formato definido/confirmado).
- Revisar o controller: guards (`JwtAuthGuard`/`ApiBearerAuth`), paginação e
  filtro por `name` (`ILIKE` parcial), uso de `fromEntity` no DTO de
  resposta, status codes (`201` create, `200` list/get/update, `204`
  delete).
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome
  duplicado, tag não encontrada), enquanto nomes de entidade/colunas/DTOs/
  JSON permanecem em inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, `TagsModule` registrado em
  `app.module.ts`, Swagger completo).

## Revisão

Arquivos revisados: `app-api/src/modules/tags/entities/tag.entity.ts`,
`app-api/src/database/migrations/1784305370000-CreateTagsTable.ts`,
`app-api/src/modules/tags/dto/create-tag.dto.ts`,
`app-api/src/modules/tags/dto/update-tag.dto.ts`,
`app-api/src/modules/tags/dto/find-tags-query.dto.ts`,
`app-api/src/modules/tags/dto/tag-response.dto.ts`,
`app-api/src/modules/tags/dto/paginated-tags-response.dto.ts`,
`app-api/src/modules/tags/tags.service.ts`,
`app-api/src/modules/tags/tags.controller.ts`,
`app-api/src/modules/tags/tags.module.ts`, `app-api/src/app.module.ts`.

Etapas 1 (api-dev) e 2 (api-dev-doc) estão marcadas como "Status: concluído",
portanto a revisão abaixo cobre trabalho considerado pronto. A entidade, a
migration, os DTOs, o service, o controller e o module seguem de forma
consistente a estrutura, nomenclatura e convenções do módulo `users`
(`BaseEntity`, `autoLoadEntities`, `fromEntity`, paginação
`{ data, total, page, perPage }` + `totalPages`, `JwtAuthGuard` +
`@ApiBearerAuth()`, `ValidationPipe` global, mensagens de erro em pt-BR via
`ConflictException`/`NotFoundException`, `TagsModule` corretamente registrado
em `app.module.ts`). Não foram encontrados bugs de lógica, problemas de
tipagem, imports quebrados, vazamento de dados sensíveis ou inconsistências
entre a migration e a entidade (colunas `name`/`color` `character varying NOT
NULL` batem com os `@Column()` da entidade, índice único `IDX_tags_name`
presente em ambas as pontas, e o `down()` reverte corretamente o `up()` —
drop do índice seguido do drop da tabela, mesmo padrão de
`CreateCreaturesTable`).

Foram encontrados os seguintes pontos, nenhum deles bloqueante:

- **Severidade baixa (estilo/lint) — `app-api/src/modules/tags/dto/create-tag.dto.ts:5` e `:10`, `app-api/src/modules/tags/dto/find-tags-query.dto.ts:6`, `:11` e `:18`, `app-api/src/modules/tags/dto/paginated-tags-response.dto.ts:5`, `app-api/src/modules/tags/tags.controller.ts:46`, `:55` e `:91`** — várias chamadas `@ApiProperty(...)`/`@ApiPropertyOptional(...)`/`@ApiBadRequestResponse(...)` foram escritas em uma única linha ultrapassando o `printWidth` padrão do Prettier (80 colunas, sem override em `app-api/.prettierrc`), diferente do padrão usado nos DTOs de referência (`users/dto/user-response.dto.ts`, `users/dto/paginated-users-response.dto.ts`, `users/dto/find-users-query.dto.ts`), que quebram os objetos de configuração em múltiplas linhas. Como a regra `prettier/prettier` está configurada como `"error"` em `app-api/eslint.config.mjs`, `npm run lint`/`npm run format` reformatariam esses trechos.
  - Trecho: `@ApiProperty({ example: 'Urgente', description: 'Nome da tag (deve ser único)' })` (create-tag.dto.ts:5)
  - Sugestão: rodar `npm run format` (ou `npm run lint`) no módulo `tags` antes de finalizar a etapa, para alinhar a formatação ao padrão do restante do projeto.

- **Severidade informativa (decisão de produto ainda não confirmada) — `app-api/src/modules/tags/entities/tag.entity.ts:8` e `app-api/src/modules/tags/dto/create-tag.dto.ts:13-15`** — a própria seção "Contexto" da task já sinaliza que a unicidade de `name` (índice único, mesmo padrão de `User.email`) e o formato exato de `color` (regex `^#([0-9A-Fa-f]{6})$`, hex `#RRGGBB`) foram *assumidos* como padrão conservador, sem confirmação explícita do usuário. Nada neste arquivo indica que essas duas decisões foram validadas com o solicitante após a implementação. A implementação em si é consistente e está correta em relação à decisão assumida (índice único + `ConflictException` em `create`/`update`; `@Matches` com mensagem pt-BR), portanto isso não é um erro de código, mas uma pendência de confirmação de requisito que deveria ser resolvida antes do merge/deploy.
  - Trecho: `@Index({ unique: true })` (tag.entity.ts:8); `@Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'A cor deve estar no formato hexadecimal #RRGGBB.' })` (create-tag.dto.ts:13-15)
  - Sugestão: confirmar com o usuário/stakeholder se `name` deve mesmo ser único e se o formato hex `#RRGGBB` é o esperado para `color` (ou se deveria aceitar outros formatos de cor); documentar a decisão final na task.

Nenhum problema de segurança, de tratamento de erros, de nomenclatura/estrutura
de módulo ou de documentação Swagger foi encontrado. Endpoints protegidos por
`JwtAuthGuard` + `@ApiBearerAuth()`, filtro por `name` via `ILIKE` parcial,
`fromEntity` usado corretamente em todas as respostas (sem vazar campos
internos — `Tag` não possui campos sensíveis), status codes corretos (`201`
create, `200` list/get/update, `204` delete), e mensagens de erro/validação em
pt-BR (`'Este nome já está em uso.'`, `'Tag não encontrada.'`, `'A cor deve
estar no formato hexadecimal #RRGGBB.'`) com nomes de entidade/colunas/DTOs em
inglês, conforme convenção do projeto.
