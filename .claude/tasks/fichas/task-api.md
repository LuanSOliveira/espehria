# Task API: Fichas

## Contexto
Ver .claude/tasks/fichas/spec.md — escopo confirmado, sem pontos em aberto. Este plano
implementa três frentes: (1) novo módulo `sheets` (fichas), (2) extensão do módulo
`campaigns` com `allowedUsers`, (3) duas consultas dedicadas de leitura (campanhas
visíveis para fichas e usuários Google para o autocomplete de "Usuários Permitidos").

Módulos existentes usados como referência de padrão: `campaigns` (relação
`ManyToOne` para `User` dono, filtro paginado com `ILIKE`, DTOs com `fromEntity`,
substituição total de listas em `update` como `tagIds`), `characters` (campo
`referenceImage` e `raceId` opcional), `users` (`AuthProvider`, filtro paginado por
e-mail), `eras` (padrão de endpoint auxiliar de opções `GET /eras/all`, registrado
antes da rota `:id`).

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/sheets/entities/sheet.entity.ts
Migration: app-api/src/database/migrations/1784306160000-CreateSheetsTable.ts, app-api/src/database/migrations/1784306170000-CreateCampaignAllowedUsersTable.ts
Rotas: POST /sheets, GET /sheets, GET /sheets/campaign-options, GET /sheets/:id, PUT /sheets/:id, DELETE /sheets/:id, GET /users/google
Arquivos: app-api/src/modules/sheets/dto/create-sheet.dto.ts, app-api/src/modules/sheets/dto/update-sheet.dto.ts, app-api/src/modules/sheets/dto/find-sheets-query.dto.ts, app-api/src/modules/sheets/dto/sheet-response.dto.ts, app-api/src/modules/sheets/dto/sheet-list-item-response.dto.ts, app-api/src/modules/sheets/dto/paginated-sheets-response.dto.ts, app-api/src/modules/sheets/sheets.service.ts, app-api/src/modules/sheets/sheets.controller.ts, app-api/src/modules/sheets/sheets.module.ts, app-api/src/app.module.ts (registro do SheetsModule), app-api/src/modules/campaigns/entities/campaign.entity.ts (campo allowedUsers), app-api/src/modules/campaigns/dto/create-campaign.dto.ts (campo allowedUserIds), app-api/src/modules/campaigns/dto/campaign-response.dto.ts (campo allowedUsers), app-api/src/modules/campaigns/dto/campaign-option-response.dto.ts (novo), app-api/src/modules/campaigns/campaigns.service.ts (validação de allowedUserIds e findVisibleForUser), app-api/src/modules/campaigns/campaigns.module.ts (registro de User no TypeOrmModule), app-api/src/modules/users/dto/find-google-users-query.dto.ts (novo), app-api/src/modules/users/users.service.ts (findAllGooglePaginated), app-api/src/modules/users/users.controller.ts (rota GET /users/google)

#### Entidade

**Nova entidade `Sheet`** (`app-api/src/modules/sheets/entities/sheet.entity.ts`),
tabela `sheets`, estende `BaseEntity`:

- `name` (`string`, `@Column()`, obrigatório, sem unicidade — mesmo padrão de
  `Character.name`).
- `referenceImage` (`string | null`, `@Column({ type: 'varchar', nullable: true, name:
  'reference_image' })`) — segue exatamente o padrão de `Character.referenceImage`
  (NÃO `referenceImageUrl`, que é o padrão de `Campaign`).
- `level` (`number`, `@Column({ type: 'int', default: 1 })`) — inteiro, mínimo 1
  validado via DTO na atualização; no `create()` do service o valor é sempre gravado
  como `1`, ignorando qualquer campo `level` do payload de criação (o `CreateSheetDto`
  nem deve expor esse campo — ver Controller).
- `campaign` (`Campaign | null`, `@ManyToOne(() => Campaign, { nullable: true,
  onDelete: 'SET NULL' }) @JoinColumn({ name: 'campaign_id' })`).
- `race` (`Race | null`, `@ManyToOne(() => Race, { nullable: true, onDelete: 'SET
  NULL' }) @JoinColumn({ name: 'race_id' })`).
- `createdBy` (`User`, `@ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE'
  }) @JoinColumn({ name: 'created_by_id' })`) — dono da ficha; segue o mesmo padrão de
  `Campaign.createdBy` (cascade ao excluir o usuário dono).

**Alteração na entidade `Campaign`** (`app-api/src/modules/campaigns/entities/campaign.entity.ts`):

- Nova relação `allowedUsers: User[]` — `@ManyToMany(() => User) @JoinTable({ name:
  'campaign_allowed_users', joinColumn: { name: 'campaign_id', referencedColumnName:
  'id' }, inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' } })`.
- Regra de negócio (validada no `CampaignsService`, não no banco): apenas usuários com
  `provider = GOOGLE` podem ser incluídos em `allowedUsers`. Ao criar/atualizar uma
  campanha com `allowedUserIds`, buscar os usuários por id e rejeitar com
  `BadRequestException` (mensagem pt-BR, ex.: "Um ou mais usuários informados não são
  usuários Google válidos.") se algum id não existir ou não tiver `provider =
  GOOGLE`. Reaproveitar o padrão já usado por `findTagsByIds` no `CampaignsService`.
  A validação usa `UsersService` (via `UsersModule` importado por `CampaignsModule`) ou
  um novo método dedicado no repositório de `User` injetado em `CampaignsService`.

#### Migration

- Necessária: **sim**, duas migrations.
  1. `CreateSheetsTable`: cria a tabela `sheets` com `id`/`created_at`/`updated_at`
     (padrão `BaseEntity`), `name` (varchar not null), `reference_image` (varchar
     nullable), `level` (integer not null default 1), `campaign_id` (uuid nullable,
     FK para `campaigns(id)` `ON DELETE SET NULL`), `race_id` (uuid nullable, FK para
     `races(id)` `ON DELETE SET NULL`), `created_by_id` (uuid not null, FK para
     `users(id)` `ON DELETE CASCADE`). Criar índices em `created_by_id` (usado em toda
     consulta de listagem/acesso) e em `campaign_id` (usado no filtro por campanha).
     Seguir o padrão SQL já usado em `CreateCampaignsTable`.
  2. `CreateCampaignAllowedUsersTable`: cria a tabela de junção
     `campaign_allowed_users` (`campaign_id` uuid not null, `user_id` uuid not null,
     PK composta), com índices em cada coluna e FKs `campaign_id → campaigns(id) ON
     DELETE CASCADE` e `user_id → users(id) ON DELETE CASCADE` (a remoção do usuário
     apenas apaga a linha de junção, sem afetar a campanha — conforme seção 5 da
     spec). Seguir o padrão SQL já usado em `CreateCampaignTagsTable`.
- Lembrar de rodar `npm run migration:generate` (ou escrever manualmente seguindo o
  padrão acima) e não habilitar `synchronize`.

#### Controller

**`SheetsController`** (`app-api/src/modules/sheets/sheets.controller.ts`, rota
`/sheets`):

- **NÃO usa `@GoogleAccess` nem precisa do `GoogleAccessGuard`** — apenas
  `@UseGuards(JwtAuthGuard)`. Esta é uma exceção intencional (seção 3 da spec):
  usuários Google podem criar/editar/excluir as próprias fichas livremente.
- Endpoints:
  - `POST /sheets` — cria uma ficha para o usuário autenticado (`createdBy =
    currentUser`). Body: `CreateSheetDto` com `name` (obrigatório), `referenceImage`
    (opcional, URL), `campaignId` (opcional, uuid — validado apenas quanto à
    existência da campanha; a regra de visibilidade de `allowedUsers` só se aplica à
    consulta dedicada da seção 4, não bloqueia o `campaignId` informado
    diretamente). **NÃO expõe `level` nem `race`** (fixados pelo backend/editáveis só
    depois). O service sempre grava `level = 1`, ignorando qualquer valor enviado.
  - `GET /sheets` — lista paginada, **sempre** filtrada por `createdBy = currentUser`
    (Google e local só veem as próprias fichas aqui). Query DTO
    `FindSheetsQueryDto`: `name?` (ILIKE parcial), `campaignId?` (uuid, filtro exato),
    `page?`, `perPage?` (convenção padrão `DEFAULT_PAGE`/`DEFAULT_PER_PAGE`). Resposta:
    `PaginatedSheetsResponseDto<SheetListItemResponseDto>`
    (`data`/`total`/`page`/`perPage`/`totalPages`, `getManyAndCount`).
  - `GET /sheets/campaign-options` — **endpoint dedicado da seção 4 da spec** (rota
    estática, deve ser declarada ANTES de `GET /sheets/:id` na classe do controller
    para não ser capturada pelo parâmetro `:id`). Retorna a lista de campanhas
    visíveis ao usuário autenticado (sem paginação — é usada tanto no autocomplete de
    campanha do cadastro/edição de ficha quanto no filtro por campanha da listagem):
    - Google: apenas campanhas em que o usuário está em `allowedUsers`.
    - Local: todas as campanhas, de qualquer dono.
    A lógica de consulta fica em `CampaignsService` (novo método público, ex.:
    `findVisibleForUser(currentUser)`), reaproveitado aqui via `CampaignsModule`
    importado por `SheetsModule` (`CampaignsModule` já exporta `CampaignsService`).
    Resposta: `CampaignOptionResponseDto[]` (novo DTO simples com `id`/`name`, no
    módulo `campaigns/dto`, análogo a `EraOptionResponseDto`).
  - `GET /sheets/:id` — busca uma ficha. Regra de acesso (seção 3):
    - Local: acesso a QUALQUER ficha, independente do dono.
    - Google: apenas a própria ficha; caso contrário, `NotFoundException` ("Ficha não
      encontrada ou não pertence ao usuário.") — mesmo padrão de `Campaign`.
    Resposta: `SheetResponseDto` (inclui `campaign` e `race` relacionados e
    `createdBy`, útil para o usuário local que acessa ficha de outro dono).
  - `PUT /sheets/:id` — atualização parcial por campo (autosave). Mesma regra de
    acesso de `GET/:id` (local: qualquer ficha; Google: só a própria, 404 caso
    contrário). Body: `UpdateSheetDto`, todos os campos opcionais: `name?`,
    `referenceImage?` (aceita `null` explícito para limpar), `level?` (inteiro,
    mínimo 1), `campaignId?` (uuid, aceita `null` para desvincular), `raceId?` (uuid,
    aceita `null` para desvincular). O service atualiza apenas os campos presentes no
    body (`!== undefined`), reaproveitando o padrão já usado em
    `CampaignsService.update` — isso permite que o autosave por campo do frontend
    envie um único campo por requisição sem afetar os demais.
  - `DELETE /sheets/:id` — mesma regra de acesso de `GET/PUT /:id`. `204 No Content`.
- DTOs a criar: `CreateSheetDto`, `UpdateSheetDto`, `FindSheetsQueryDto`,
  `SheetResponseDto`, `SheetListItemResponseDto` (todos em `sheets/dto/`), mais
  `CampaignOptionResponseDto` em `campaigns/dto/`.
- Acesso Google: **não aplicável / sem `@GoogleAccess`** — exceção explícita e
  intencional descrita na spec (seção 3): fichas são área pessoal do jogador, não
  recurso de mundo/campanha. Justificativa já validada no escopo confirmado, não
  requer nova decisão.

**Alterações no `CampaignsController`** (`app-api/src/modules/campaigns/campaigns.controller.ts`):

- O `@GoogleAccess('blocked')` de classe permanece INTACTO — nenhuma rota nova é
  adicionada aqui para expor campanhas a Google.
- `CreateCampaignDto`/`UpdateCampaignDto` ganham campo opcional `allowedUserIds?:
  string[]` (array de uuids, mesmo padrão de `tagIds`). `POST /campaigns` e `PUT
  /campaigns/:id` passam a aceitar e persistir essa lista (substituição total da
  lista em `update`, mesmo padrão de `tagIds`).
- `CampaignResponseDto` ganha campo `allowedUsers: UserResponseDto[]` (reaproveita
  `UserResponseDto` já existente). `CampaignListItemResponseDto` não precisa desse
  campo (não é exibido na listagem padrão de campanhas).
- `CampaignsService.findOwnedById` precisa carregar a relação `allowedUsers` (usada
  em `findOne`, `update`, `remove`).

**Alterações no `UsersController`** (`app-api/src/modules/users/users.controller.ts`):

- Continua com `@GoogleAccess('blocked')` de classe — a nova rota herda o bloqueio
  para Google, o que é o comportamento desejado pela seção 5 da spec ("acessível a
  qualquer usuário local"; Google não precisa e não deve acessar).
- Novo endpoint `GET /users/google` — rota estática, deve ser declarada ANTES de `GET
  /users/:id` na classe do controller. Paginado, busca por nome OU e-mail (um único
  parâmetro `search`, ILIKE em `name` e `email`), filtrando sempre `provider =
  GOOGLE`. Novo DTO `FindGoogleUsersQueryDto` (`search?`, `page?`, `perPage?`, em
  `users/dto/`). Novo método `UsersService.findAllGooglePaginated(query)` (mesmo
  padrão de `findAllLocalPaginated`, trocando o filtro de provider e usando OR entre
  `name`/`email`). Resposta: reaproveita `PaginatedUsersResponseDto`/`UserResponseDto`
  já existentes (nenhum DTO novo de resposta necessário).
- Acesso Google: bloqueado (herdado do `@GoogleAccess('blocked')` de classe, já
  existente e não alterado).

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger: tag `sheets` no novo controller; `@ApiOperation`,
  `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`,
  `@ApiNotFoundResponse` (mensagens "Ficha não encontrada ou não pertence ao
  usuário."), `@ApiBadRequestResponse` (URL inválida, ids em formato inválido,
  `level` fora do intervalo válido) em todos os endpoints de `SheetsController`,
  incluindo o endpoint `GET /sheets/campaign-options`.
- Documentar os novos campos `@ApiProperty`/`@ApiPropertyOptional` em `Sheet`,
  `CreateSheetDto`, `UpdateSheetDto`, `SheetResponseDto`, `SheetListItemResponseDto`,
  `CampaignOptionResponseDto`.
- Documentar em `CampaignsController` o novo campo `allowedUserIds` em
  `CreateCampaignDto`/`UpdateCampaignDto` e `allowedUsers` em `CampaignResponseDto`
  (com `@ApiPropertyOptional`/`@ApiProperty` e descrição explicando a restrição a
  usuários `provider = GOOGLE`), além de `@ApiBadRequestResponse` cobrindo o novo
  caso de usuários inválidos/não-Google em `allowedUserIds`.
- Documentar o novo endpoint `GET /users/google` em `UsersController`
  (`@ApiOperation`, `@ApiOkResponse({ type: PaginatedUsersResponseDto })`), deixando
  claro na descrição que retorna somente usuários com `provider = GOOGLE`.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Ordem de declaração das rotas estáticas (`GET /sheets/campaign-options`, `GET
    /users/google`) antes das rotas `:id` correspondentes.
  - `@GoogleAccess('blocked')` do `CampaignsController` permanece intacto e nenhuma
    rota de campanha é aberta para Google fora do endpoint dedicado em `SheetsController`.
  - `SheetsController` de fato não usa `@GoogleAccess`/`GoogleAccessGuard`.
  - Regra de acesso a `/sheets/:id` (local: total; Google: só a própria ficha, 404
    caso contrário) aplicada igualmente em `GET`, `PUT` e `DELETE`.
  - Listagem de fichas sempre escopada ao `createdBy` do usuário autenticado,
    independentemente do provider.
  - `level` fixado em `1` no `create()` do `SheetsService`, ignorando qualquer valor
    do DTO de criação (que nem deve expor o campo).
  - `SET NULL` (sem cascade de exclusão de fichas) nas FKs `campaign_id` e `race_id`
    da tabela `sheets`, validado tanto na entidade quanto na migration.
  - Validação de `allowedUserIds` restrita a `provider = GOOGLE`, com mensagens de
    erro em pt-BR.
  - Convenções gerais: DTOs com `class-validator`, response DTOs com `static
    fromEntity`, paginação padrão (`page`/`perPage`/`totalPages`), mensagens de erro
    em pt-BR.

## Revisão

Pontos verificados e aprovados (sem achados):
- Ordem das rotas estáticas: `GET /sheets/campaign-options` está declarada antes de
  `GET /sheets/:id` em `sheets.controller.ts`, e `GET /users/google` está declarada
  antes de `GET /users/:id` em `users.controller.ts`.
- `@GoogleAccess('blocked')` de classe permanece intacto em `campaigns.controller.ts`;
  nenhuma rota nova do módulo de campanhas foi aberta para Google. A única forma de um
  usuário Google enxergar dados de campanha é via `CampaignsService.findVisibleForUser`,
  consumido apenas por `SheetsController`.
- `SheetsController` usa somente `@UseGuards(JwtAuthGuard)`, sem `@GoogleAccess`/
  `GoogleAccessGuard`, conforme a exceção intencional da spec.
- Regra de acesso a `/sheets/:id` (local: qualquer ficha; Google: só a própria, 404
  "Ficha não encontrada ou não pertence ao usuário.") está implementada de forma
  centralizada em `SheetsService.findAccessibleById` e aplicada de forma consistente em
  `GET`, `PUT` (via `update`) e `DELETE` (via `remove`).
- `SheetsService.findAllPaginated` sempre filtra por `sheet.createdBy = currentUser.id`,
  independentemente do provider.
- `SheetsService.create` grava `level: 1` de forma fixa, e `CreateSheetDto` não expõe o
  campo `level`.
- FKs `campaign_id` e `race_id` da tabela `sheets` estão `ON DELETE SET NULL` tanto na
  entidade (`Sheet.campaign`/`Sheet.race`, `onDelete: 'SET NULL'`) quanto na migration
  `CreateSheetsTable`, e o `down()` reverte corretamente o `up()` em ambas as migrations
  novas (`CreateSheetsTable` e `CreateCampaignAllowedUsersTable`).
- `CampaignsService.findAllowedUsersByIds` valida que todos os ids existem e têm
  `provider = GOOGLE`, lançando `BadRequestException` com mensagem em pt-BR ("Um ou mais
  usuários informados não são usuários Google válidos."), reaproveitando o mesmo padrão
  de `findTagsByIds`.
- Estrutura, DTOs (`class-validator`), `fromEntity`, paginação padrão
  (`data`/`total`/`page`/`perPage`/`totalPages`) e `synchronize`/migrations seguem o
  padrão do projeto.

Achados:

- **`app-api/src/modules/sheets/sheets.service.ts:43-52` (`findRaceById`) e
  `sheets.service.ts:123-134` (`findAccessibleById`)** — a relação `race` é carregada
  sempre com `relations: { category: true, tags: true }`, sem `characteristics` nem
  `talents`. Como `SheetResponseDto.race` reaproveita `RaceResponseDto` (que expõe
  `characteristics`/`talents` a partir de `race.characteristics`/`race.talents`), toda
  ficha com raça vinculada retornará `characteristics: []` e `talents: []`
  incondicionalmente (sem erro, pois `fromEntity` usa `?? []`), mesmo quando a raça
  possui características/talentos associados — divergindo do padrão já usado em
  `RacesService.findById`, que carrega `{ category: true, tags: true, characteristics:
  { tags: true }, talents: { tags: true } }` exatamente para alimentar esse mesmo
  `RaceResponseDto.fromEntity`.
  - Trecho: `relations: { category: true, tags: true }` (em ambos os métodos citados).
  - Sugestão: alinhar as relações carregadas do `race` em `findRaceById` e
    `findAccessibleById` com o padrão de `RacesService.findById`, incluindo
    `characteristics: { tags: true }` e `talents: { tags: true }`.

- **`app-api/src/modules/sheets/sheets.controller.ts` (`findCampaignOptions`, `GET
  /sheets/campaign-options`)** — falta o decorator `@ApiBadRequestResponse`, que a
  etapa 2 (api-dev-doc) previa explicitamente para "todos os endpoints de
  `SheetsController`, incluindo o endpoint `GET /sheets/campaign-options`". O endpoint
  hoje só tem `@ApiOperation` e `@ApiOkResponse`.
  - Trecho:
    ```ts
    @Get('campaign-options')
    @ApiOperation({ summary: '...' })
    @ApiOkResponse({ type: [CampaignOptionResponseDto] })
    async findCampaignOptions(...)
    ```
  - Sugestão: adicionar `@ApiBadRequestResponse` (ou registrar explicitamente que o
    endpoint não recebe parâmetros de entrada e por isso não possui esse caso, ajustando
    a redação da etapa 2 em vez do código) para manter a documentação Swagger alinhada
    ao que foi planejado.

- **`app-api/src/modules/sheets/dto/update-sheet.dto.ts:40-44` (campo `level`)** — os
  decorators `@IsInt()`/`@Min(1)` não têm mensagem customizada em pt-BR, diferente do
  padrão já consolidado no projeto para o campo "nível" em outros módulos (`spells`,
  `talents`, `techniques`, `characteristics`), que sempre usam mensagens como "O nível
  deve ser um número inteiro." e "O nível deve ser maior ou igual a 1.". Sem a mensagem
  customizada, uma validação inválida de `level` retornará a mensagem padrão do
  `class-validator` em inglês, quebrando a convenção de mensagens de erro em pt-BR
  citada tanto no `CLAUDE.md` quanto no ponto de atenção desta própria etapa de revisão.
  - Trecho:
    ```ts
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    level?: number;
    ```
  - Sugestão: adicionar mensagens em pt-BR, por exemplo `@IsInt({ message: 'O nível deve
    ser um número inteiro.' })` e `@Min(1, { message: 'O nível deve ser maior ou igual a
    1.' })`, seguindo o padrão de `CreateCharacteristicDto`/`CreateSpellDto`/
    `CreateTalentDto`/`CreateTechniqueDto`.

Correções aplicadas (todos os achados):

- **Achado 1**: `sheets.service.ts` — `findRaceById` e `findAccessibleById` agora
  carregam `race` com `{ category: true, tags: true, characteristics: { tags: true },
  talents: { tags: true } }`, igual ao padrão de `RacesService.findById`. Fichas com
  raça vinculada passam a retornar `characteristics`/`talents` corretamente preenchidos
  em `SheetResponseDto`.
- **Achado 2**: `sheets.controller.ts` — adicionado decorador `@ApiBadRequestResponse({
  description: 'Dados inválidos ou não processáveis' })` ao endpoint `GET
  /sheets/campaign-options`, alinhando a documentação Swagger com o padrão aplicado aos
  demais endpoints do `SheetsController`.
- **Achado 3**: `update-sheet.dto.ts` — o campo `level` agora usa `@IsInt({ message: 'O
  nível deve ser um número inteiro.' })` e `@Min(1, { message: 'O nível deve ser maior
  ou igual a 1.' })`, alinhado ao padrão de mensagens pt-BR já usado em
  `CreateCharacteristicDto`/`CreateSpellDto`/`CreateTalentDto`/`CreateTechniqueDto`.
