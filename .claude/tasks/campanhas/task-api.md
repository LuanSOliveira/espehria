# Task API: Campanhas

## Contexto
Não existe `.claude/tasks/campanhas/spec.md` para esta demanda — os requisitos abaixo
foram validados diretamente com o usuário (transcritos na mensagem que originou este
plano) e são a fonte da verdade factual. Nomes de entidades/propriedades em inglês;
mensagens de erro/validação em pt-BR, seguindo o restante do projeto.

Módulos de referência a seguir como padrão estrutural: `app-api/src/modules/locations/`
(seções filhas via `LocationSection`, tags `ManyToMany` com `JoinTable` dedicada,
listagem paginada com filtro por nome) e `app-api/src/modules/users/` (estrutura básica
de módulo). Duas regras de negócio **não-padrão** em relação ao restante do projeto
(detalhadas abaixo) tornam esta demanda diferente de um CRUD de conteúdo comum:
visibilidade restrita ao dono (`createdBy`) e bloqueio total a usuários Google.

Status geral: Pendente

## Regras de negócio não-padrão (aplicam-se a Campaign e PlannedSession)

### 1. Visibilidade restrita ao dono
Diferente do resto do projeto (entidades de conteúdo são visíveis a todos os usuários
autenticados), **todas** as operações de `Campaign` (`list`, `findOne`, `update`,
`delete`) devem ser filtradas por `createdBy = usuário autenticado`, diretamente nas
queries do `CampaignsService` — nunca apenas no controller. Se o recurso pertencer a
outro usuário (ou não existir), a resposta é sempre `404 NotFoundException` com
mensagem pt-BR (`'Campanha não encontrada.'`) — nunca `403 Forbidden` e nunca uma
resposta que permita distinguir "não existe" de "existe mas não é seu" (não vazar
existência de recursos de outros usuários).

`PlannedSession` não tem `createdBy` próprio — herda a checagem via a campanha-pai:
toda operação sobre `PlannedSession`/`PlannedSessionSection` primeiro resolve e valida
a propriedade da `Campaign` referenciada (`campaignId` da rota) antes de tocar em
qualquer sessão planejada. Se a campanha não existir ou não pertencer ao usuário
autenticado → `404 NotFoundException('Campanha não encontrada.')`. Se a campanha é do
usuário mas a sessão planejada não existe (ou não pertence a essa campanha) →
`404 NotFoundException('Sessão planejada não encontrada.')`.

O usuário autenticado chega ao service via `@CurrentUser()` no controller
(`app-api/src/modules/auth/decorators/current-user.decorator.ts`, já existente — não
recriar), repassado explicitamente como parâmetro (`currentUser: User`) em todo método
público de `CampaignsService`/`PlannedSessionsService` que leia, altere ou remova um
registro.

### 2. Bloqueio total a usuários Google
`GoogleAccessGuard` (`app-api/src/modules/auth/guards/google-access.guard.ts`) **já
suporta** o nível `'blocked'` no decorator `@GoogleAccess(...)`: quando o nível é
`'blocked'`, o guard lança `ForbiddenException` para **qualquer** método (inclusive
`GET`), não apenas métodos de escrita como no nível padrão `'read-only'`. Esse
comportamento já é usado hoje em `UsersController` (`@GoogleAccess('blocked')`,
`app-api/src/modules/users/users.controller.ts`). Portanto **nenhum guard novo é
necessário** — basta aplicar `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
`@GoogleAccess('blocked')` a nível de controller em `CampaignsController` e em
`PlannedSessionsController`, em vez do padrão somente-leitura da skill
`api-permissao-google-readonly`. Usuários `provider: 'local'` não são afetados.

## Decisão arquitetural: `PlannedSession` como módulo próprio com rotas aninhadas

**Decisão: `PlannedSession` será um módulo Nest independente (`planned-sessions`),
montado sob rotas aninhadas `campaigns/:campaignId/planned-sessions[/:id]`, com CRUD
completo próprio (create/list/findOne/update/remove, DTOs e paginação dedicados) — e
não um array embutido no payload de `Campaign` nem um recurso plano filtrado por
`?campaignId=`.**

Justificativa (investigado o precedente do projeto antes de decidir):

- O único padrão de "sub-recurso" já existente no projeto (`LocationSection` em
  `locations`, `OrganizationMember` em `organizations`, `FamilyMember`/
  `FamilyRelationship` em `families`) é sempre um **valor filho simples**: sem
  controller/rota próprios, sem paginação própria, gerenciado inteiramente como um
  array no `create`/`update` do pai (`cascade: true, orphanedRowAction: 'delete'` no
  `OneToMany`), e sem relações M2M ou coleções aninhadas próprias — um único nível de
  aninhamento.
- `PlannedSession` não se encaixa nesse padrão: tem `tags` (`ManyToMany` própria) **e**
  sua própria coleção de seções (`PlannedSessionSection`, mesma mecânica de
  `LocationSection`) — ou seja, dois níveis de aninhamento (`Campaign` →
  `PlannedSession` → `PlannedSessionSection`) mais um relacionamento M2M próprio.
  Embuti-la inteira dentro do payload de `Campaign` obrigaria criar/editar todas as
  sessões planejadas (e todas as seções de cada uma) num único payload gigante sempre
  que a campanha for salva — não corresponde ao uso esperado (sessões são preparadas e
  editadas ao longo do tempo, individualmente, conforme o mestre prepara cada sessão).
  Em complexidade, `PlannedSession` está muito mais próxima de um recurso de primeira
  classe (como `Location`) do que de um valor filho simples (como `LocationSection`).
- Dado que precisa de CRUD independente, a escolha seguinte é entre rota aninhada
  (`campaigns/:campaignId/planned-sessions`) e recurso plano filtrado por query param
  (`planned-sessions?campaignId=`). Optou-se pela rota aninhada porque: (a) uma sessão
  planejada nunca existe sem uma campanha-pai — `campaignId` não é um filtro opcional,
  é parte da identidade do recurso; (b) a checagem de propriedade depende sempre de
  resolver a campanha-pai primeiro (ver regra de negócio 1 acima), e expressar isso na
  URL torna essa fronteira de posse explícita e obrigatória em toda rota, reduzindo o
  risco de esquecer o filtro em algum endpoint; (c) o consumo natural do front-end é
  "listar sessões desta campanha", um drill-down, não uma listagem global filtrável.
- Este é o **primeiro precedente no projeto** de um módulo com rotas aninhadas sob
  outro recurso — registrar isso explicitamente para quem revisar/mantiver depois.

## Etapas

### 1. api-dev
Status: concluído

#### Entidade

**`Campaign`** (`app-api/src/modules/campaigns/entities/campaign.entity.ts`, tabela
`campaigns`), estendendo `BaseEntity`:
- Campos:
  - `referenceImageUrl` (`varchar`, nullable, coluna `reference_image_url`) — URL de
    imagem, opcional. Validar com `@IsUrl()` no DTO de criação/atualização, mesmo
    padrão de `Location.referenceImageUrl`.
  - `name` (`varchar`, **obrigatório**). Sem decisão explícita de unicidade no pedido —
    seguir o padrão mais comum do projeto (`@Index({ unique: true })`, como
    `Location.name`/`Organization.name`) **a menos que o usuário sinalize que campanhas
    de nomes repetidos devem ser permitidas** (ponto de atenção: como campanhas são
    visíveis só ao dono, duplicidade de nome entre usuários diferentes é normal — se
    unicidade for aplicada, deve ser condicionada a `createdBy`, não global; avaliar
    índice único composto `(name, created_by_id)` em vez de único simples em `name`).
  - `description` (`text`, nullable) — rich text/HTML, mesmo padrão de
    `Location.description`/`Rule.description`.
- Relacionamentos:
  - `tags`: `ManyToMany(() => Tag)` + `@JoinTable({ name: 'campaign_tags', joinColumn:
    { name: 'campaign_id' }, inverseJoinColumn: { name: 'tag_id' } })`, opcional, mesmo
    padrão de `Location.tags`.
  - `createdBy`: `ManyToOne(() => User)`, **obrigatório** (`nullable: false`),
    `@JoinColumn({ name: 'created_by_id' })`. **Primeiro precedente no projeto de uma
    FK de conteúdo para `User`** (não existe hoje nenhuma entidade de conteúdo com
    `ManyToOne` para `User`) — preenchida no `create` a partir do usuário autenticado
    (`@CurrentUser()`), nunca aceita no DTO de criação/atualização. `onDelete:
    'CASCADE'` — decisão de api-dev-planejamento: como campanhas só existem/são visíveis
    para o próprio dono, se o usuário for removido não há motivo de negócio para manter
    campanhas órfãs inacessíveis; segue o mesmo raciocínio de cascata usado em
    `LocationSection`/`OrganizationMember` (filho morre com o pai).
  - `sections`: `OneToMany(() => CampaignSection, (s) => s.campaign, { cascade: true,
    orphanedRowAction: 'delete' })` — mesmo padrão de `Location.sections`.

**`CampaignSection`**
(`app-api/src/modules/campaigns/entities/campaign-section.entity.ts`, tabela
`campaign_sections`), estendendo `BaseEntity` — espelha `LocationSection` campo a
campo:
- `label` (`varchar`, obrigatório).
- `description` (`text`, nullable) — rich text.
- `order` (`int`, obrigatório) — posição na sequência de adição.
- `campaign`: `ManyToOne(() => Campaign, (c) => c.sections, { onDelete: 'CASCADE' })`,
  `@JoinColumn({ name: 'campaign_id' })`.
- Gerenciada **inteiramente** via o array `sections` do `create`/`update` de
  `Campaign` (sem controller/rota própria) — mesmo padrão de `LocationSection`.

**`PlannedSession`**
(`app-api/src/modules/planned-sessions/entities/planned-session.entity.ts`, tabela
`planned_sessions`), estendendo `BaseEntity`:
- Campos:
  - `name` (`varchar`, **obrigatório**).
  - `introduction` (`text`, nullable) — rich text, opcional.
- Relacionamentos:
  - `tags`: `ManyToMany(() => Tag)` + `@JoinTable({ name: 'planned_session_tags',
    joinColumn: { name: 'planned_session_id' }, inverseJoinColumn: { name: 'tag_id' }
    })`, opcional.
  - `campaign`: `ManyToOne(() => Campaign)`, **obrigatório**, `@JoinColumn({ name:
    'campaign_id' })`, `onDelete: 'CASCADE'` (sessão planejada não existe sem a
    campanha-pai).
  - `sections`: `OneToMany(() => PlannedSessionSection, (s) => s.plannedSession, {
    cascade: true, orphanedRowAction: 'delete' })`.
- Sem `createdBy` próprio — propriedade sempre resolvida via `campaign.createdBy` (ver
  regra de negócio 1).

**`PlannedSessionSection`**
(`app-api/src/modules/planned-sessions/entities/planned-session-section.entity.ts`,
tabela `planned_session_sections`), estendendo `BaseEntity` — mesma mecânica de
`LocationSection`/`CampaignSection`:
- `label` (`varchar`, obrigatório).
- `description` (`text`, nullable) — rich text.
- `order` (`int`, obrigatório).
- `plannedSession`: `ManyToOne(() => PlannedSession, (p) => p.sections, { onDelete:
  'CASCADE' })`, `@JoinColumn({ name: 'planned_session_id' })`.
- Gerenciada inteiramente via o array `sections` do `create`/`update` de
  `PlannedSession` (sem controller/rota própria).

`autoLoadEntities: true` já cobre o registro automático das quatro entidades novas —
nenhuma alteração manual em `app.module.ts` além de registrar os dois módulos Nest
(`CampaignsModule`, `PlannedSessionsModule`) em `imports`.

#### Migration

- Necessária: **sim** (`synchronize: false`; toda alteração de schema precisa de
  migration em `src/database/migrations/`).
- Seguir o padrão granular já usado no projeto (uma migration por tabela, ver
  `CreateLocationsTable` → `CreateLocationTagsTable` → `CreateLocationSectionsTable`),
  seis migrations no total, com timestamps sequenciais a partir de `1784305970000` (a
  última migration existente no repositório é
  `1784305960000-CreateSpellTagsTable.ts`), nesta ordem de dependência:
  1. `CreateCampaignsTable` — colunas de `BaseEntity` + `reference_image_url`
     (`character varying`, nullable), `name` (`character varying NOT NULL`,
     índice — simples ou único conforme decisão de unicidade acima),
     `description` (`text`, nullable), `created_by_id` (`uuid NOT NULL`, índice, FK
     para `users(id)` `ON DELETE CASCADE`).
  2. `CreateCampaignTagsTable` — tabela de junção `(campaign_id, tag_id)`, PK composta,
     índices em cada FK, `ON DELETE CASCADE` para `campaigns` e `tags` — padrão de
     `location_tags`.
  3. `CreateCampaignSectionsTable` — colunas de `BaseEntity` + `label` (`character
     varying NOT NULL`), `description` (`text`, nullable), `order` (`int NOT NULL`),
     `campaign_id` (`uuid NOT NULL`, índice, FK `campaigns(id)` `ON DELETE CASCADE`) —
     padrão de `location_sections`.
  4. `CreatePlannedSessionsTable` — colunas de `BaseEntity` + `name` (`character
     varying NOT NULL`), `introduction` (`text`, nullable), `campaign_id` (`uuid NOT
     NULL`, índice, FK `campaigns(id)` `ON DELETE CASCADE`).
  5. `CreatePlannedSessionTagsTable` — tabela de junção `(planned_session_id, tag_id)`,
     mesmo padrão de `campaign_tags`.
  6. `CreatePlannedSessionSectionsTable` — colunas de `BaseEntity` + `label`,
     `description`, `order`, `planned_session_id` (`uuid NOT NULL`, índice, FK
     `planned_sessions(id)` `ON DELETE CASCADE`) — padrão de `campaign_sections`.
- Gerar com `npm run migration:generate -- src/database/migrations/<Nome>` a partir das
  entidades já criadas (ou escrever manualmente seguindo o estilo SQL puro das
  migrations existentes). **Não executar `npm run migration:run` automaticamente** —
  perguntar ao usuário antes, conforme skill `api-migration`.

#### Controller

**`CampaignsController`** (`app-api/src/modules/campaigns/campaigns.controller.ts`,
rota base `campaigns`):
- Guards: `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('blocked')` a
  nível de controller (ver regra de negócio 2).
- Endpoints:
  - `POST /campaigns` — cria uma campanha. `createdBy` vem de `@CurrentUser()`, nunca
    do body. `CreateCampaignDto`: `name` (obrigatório), `referenceImageUrl?` (URL),
    `description?`, `tagIds?` (`string[]`, uuid), `sections?`
    (`CampaignSectionInputDto[]`, mesmo formato de `LocationSectionInputDto` — `label`
    + `description?`).
  - `GET /campaigns` — lista paginada, filtrada por `createdBy = @CurrentUser()` no
    service (`FindCampaignsQueryDto`: `name?`, `page?`, `perPage?`).
  - `GET /campaigns/:id` — busca por id, **404 pt-BR** (`'Campanha não encontrada.'`)
    se não existir **ou** não pertencer ao usuário autenticado.
  - `PUT /campaigns/:id` — atualiza (mesma checagem de posse; `UpdateCampaignDto =
    PartialType(CreateCampaignDto)`, sem permitir alterar `createdBy`).
  - `DELETE /campaigns/:id` — remove (mesma checagem de posse; `204 No Content`).
- DTOs (`app-api/src/modules/campaigns/dto/`):
  - `CreateCampaignDto`, `UpdateCampaignDto` (`PartialType`).
  - `CampaignSectionInputDto` (`label`, `description?`) — espelha
    `LocationSectionInputDto`.
  - `CampaignSectionResponseDto` (`id`, `label`, `description`, `order`, `createdAt`,
    `updatedAt`, `static fromEntity`) — espelha `LocationSectionResponseDto`.
  - `FindCampaignsQueryDto` (`name?`, `page?`, `perPage?`).
  - `CampaignResponseDto` (`id`, `referenceImageUrl`, `name`, `description`, `tags`
    (`TagResponseDto[]`), `sections` (`CampaignSectionResponseDto[]`, ordenadas por
    `order`), `createdBy` (`UserResponseDto`, reaproveitar
    `app-api/src/modules/users/dto/user-response.dto.ts`), `createdAt`, `updatedAt`).
  - `CampaignListItemResponseDto` (`id`, `referenceImageUrl`, `name`, `tags`) — espelha
    `LocationListItemResponseDto`.
  - `PaginatedCampaignsResponseDto` (`data`, `total`, `page`, `perPage`, `totalPages`).
- Service (`CampaignsService`) — todo método que lê/altera/remove recebe o
  `currentUser: User` (ou `userId: string`) como parâmetro explícito:
  - `create(dto, currentUser)`.
  - `findAllPaginated(query, currentUser)` — `queryBuilder.andWhere('campaign.createdBy
    = :userId', { userId: currentUser.id })` (TypeORM resolve relação `ManyToOne` para
    a coluna de FK diretamente, sem exigir join explícito).
  - `findOwnedById(id, userId)` — `where: { id, createdBy: { id: userId } }` — método
    reutilizado tanto pelo `findOne`/`update`/`remove` do próprio módulo quanto por
    `PlannedSessionsService` (via `CampaignsService` exportado) para validar a posse da
    campanha-pai.
  - `update(id, dto, currentUser)`/`remove(id, currentUser)` — buscam via
    `findOwnedById`; se `null`, `throw new NotFoundException('Campanha não
    encontrada.')` antes de qualquer outra validação.
- `CampaignsModule`: `TypeOrmModule.forFeature([Campaign, CampaignSection, Tag])`,
  `exports: [CampaignsService]` (necessário para `PlannedSessionsModule`).

**`PlannedSessionsController`**
(`app-api/src/modules/planned-sessions/planned-sessions.controller.ts`, rota base
`campaigns/:campaignId/planned-sessions` — ver decisão arquitetural acima):
- Guards: `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('blocked')` a
  nível de controller.
- Endpoints (todos recebem `@Param('campaignId', ParseUUIDPipe) campaignId: string`):
  - `POST /campaigns/:campaignId/planned-sessions` — cria uma sessão planejada
    vinculada à campanha (valida posse da campanha antes de criar).
    `CreatePlannedSessionDto`: `name` (obrigatório), `introduction?`, `tagIds?`,
    `sections?` (`PlannedSessionSectionInputDto[]`).
  - `GET /campaigns/:campaignId/planned-sessions` — lista paginada das sessões da
    campanha (valida posse da campanha antes de listar; `FindPlannedSessionsQueryDto`:
    `name?`, `page?`, `perPage?` — sem `campaignId` na query, já vem da rota).
  - `GET /campaigns/:campaignId/planned-sessions/:id` — busca por id dentro da
    campanha; `404` (`'Campanha não encontrada.'`) se a campanha não existir/não for do
    usuário, `404` (`'Sessão planejada não encontrada.'`) se a campanha é do usuário
    mas a sessão não existe/não pertence a ela.
  - `PUT /campaigns/:campaignId/planned-sessions/:id` — atualiza (mesma cadeia de
    validação; `UpdatePlannedSessionDto = PartialType(CreatePlannedSessionDto)`).
  - `DELETE /campaigns/:campaignId/planned-sessions/:id` — remove (mesma cadeia de
    validação; `204 No Content`).
- DTOs (`app-api/src/modules/planned-sessions/dto/`):
  - `CreatePlannedSessionDto`, `UpdatePlannedSessionDto` (`PartialType`).
  - `PlannedSessionSectionInputDto` (`label`, `description?`).
  - `PlannedSessionSectionResponseDto` (`id`, `label`, `description`, `order`,
    `createdAt`, `updatedAt`, `static fromEntity`).
  - `FindPlannedSessionsQueryDto` (`name?`, `page?`, `perPage?`).
  - `PlannedSessionResponseDto` (`id`, `name`, `introduction`, `tags`
    (`TagResponseDto[]`), `sections` (`PlannedSessionSectionResponseDto[]`, ordenadas
    por `order`), `campaignId` (string — id da campanha-pai, somente leitura),
    `createdAt`, `updatedAt`).
  - `PlannedSessionListItemResponseDto` (`id`, `name`, `tags`).
  - `PaginatedPlannedSessionsResponseDto` (`data`, `total`, `page`, `perPage`,
    `totalPages`).
- Service (`PlannedSessionsService`) — injeta `CampaignsService` (via
  `PlannedSessionsModule` importando `CampaignsModule`):
  - Todo método público começa resolvendo `const campaign = await
    this.campaignsService.findOwnedById(campaignId, currentUser.id); if (!campaign)
    throw new NotFoundException('Campanha não encontrada.');` — antes de tocar em
    qualquer `PlannedSession`.
  - `create(campaignId, dto, currentUser)`, `findAllPaginated(campaignId, query,
    currentUser)` (`where: { campaign: { id: campaignId } }`), `findOwnedById(id,
    campaignId)` (`where: { id, campaign: { id: campaignId } }`, lançando
    `NotFoundException('Sessão planejada não encontrada.')` quando aplicável no
    controller/service), `update(...)`, `remove(...)`.
- `PlannedSessionsModule`: `imports: [CampaignsModule]`,
  `TypeOrmModule.forFeature([PlannedSession, PlannedSessionSection, Tag])`.

#### Integração com o módulo `search`

- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`: adicionar `CAMPAIGN
  = 'campaign'` e `PLANNED_SESSION = 'planned_session'` (primeiro valor multi-palavra
  do enum — não há precedente de convenção de casing para isso no projeto; `snake_case`
  minúsculo escolhido por consistência com o restante dos valores, que são sempre
  lowercase; confirmar/ajustar durante a implementação se preferir outra convenção).
- `app-api/src/modules/search/search.module.ts`: adicionar `Campaign` e
  `PlannedSession` ao array de `TypeOrmModule.forFeature([...])`.
- `app-api/src/modules/search/search.service.ts`: injetar `Repository<Campaign>` e
  `Repository<PlannedSession>` no construtor. **Tratamento diferenciado obrigatório**
  para essas duas entidades (diferente de todas as demais, que continuam globais e sem
  filtro de usuário):
  - `search(query, currentUser)` — assinatura passa a receber o usuário autenticado
    (ver alteração de controller abaixo).
  - Se `currentUser.provider === AuthProvider.GOOGLE`, **excluir** `CAMPAIGN` e
    `PLANNED_SESSION` do array `linkableEntities` antes do loop de busca (usuários
    Google são bloqueados de campanhas por completo — não devem nem ver esses tipos
    aparecerem em resultados de busca/menção).
  - Para `CAMPAIGN` (quando incluído): além do `entity.name ILIKE :query` já usado
    para todas as entidades, adicionar `.andWhere('entity.createdBy = :userId', {
    userId: currentUser.id })` — mesma filosofia do filtro de posse do
    `CampaignsService`.
  - Para `PLANNED_SESSION` (quando incluído): `PlannedSession` não tem `createdBy`
    próprio — usar `.leftJoin('entity.campaign', 'campaign').andWhere('campaign.createdBy
    = :userId', { userId: currentUser.id })` para filtrar pela posse da
    campanha-pai.
  - Todas as demais entidades do array (`User`, `Creature`, `Tag`, `Location`, etc.)
    permanecem exatamente como estão hoje — buscas globais, sem filtro de usuário.
- `app-api/src/modules/search/search.controller.ts`: adicionar `@CurrentUser()
  currentUser: User` como parâmetro do método `search` e repassar para
  `searchService.search(query.query, currentUser)`. Não é necessário alterar guards do
  controller (`JwtAuthGuard` já garante `request.user` populado) nem aplicar
  `GoogleAccessGuard` aqui — o bloqueio de Google para campanhas/sessões planejadas
  acontece por **filtragem de resultados**, não por bloqueio do endpoint `GET /search`
  em si (que continua acessível/misto para todos os usuários autenticados).
- `app-api/src/modules/search/dto/search-result-item-response.dto.ts`: o campo
  `entityType` já usa `enum: LinkableEntityType` — nenhuma alteração estrutural
  necessária além do enum; o texto descritivo (`@ApiProperty`/`@ApiOperation`
  mencionando "campanhas" e "sessões planejadas" por extenso) fica a cargo da etapa
  `api-dev-doc`, seguindo o padrão já usado para as demais entidades.

Status: concluído
Entidade: app-api/src/modules/campaigns/entities/campaign.entity.ts,
app-api/src/modules/campaigns/entities/campaign-section.entity.ts,
app-api/src/modules/planned-sessions/entities/planned-session.entity.ts,
app-api/src/modules/planned-sessions/entities/planned-session-section.entity.ts
Migration: app-api/src/database/migrations/1784305970000-CreateCampaignsTable.ts,
app-api/src/database/migrations/1784305980000-CreateCampaignTagsTable.ts,
app-api/src/database/migrations/1784305990000-CreateCampaignSectionsTable.ts,
app-api/src/database/migrations/1784306000000-CreatePlannedSessionsTable.ts,
app-api/src/database/migrations/1784306010000-CreatePlannedSessionTagsTable.ts,
app-api/src/database/migrations/1784306020000-CreatePlannedSessionSectionsTable.ts
(escritas mas NÃO executadas — `npm run migration:run` depende de confirmação
explícita do usuário, conforme skill `api-migration`)
Rotas: POST /campaigns, GET /campaigns, GET /campaigns/:id, PUT /campaigns/:id,
DELETE /campaigns/:id, POST /campaigns/:campaignId/planned-sessions,
GET /campaigns/:campaignId/planned-sessions,
GET /campaigns/:campaignId/planned-sessions/:id,
PUT /campaigns/:campaignId/planned-sessions/:id,
DELETE /campaigns/:campaignId/planned-sessions/:id
Arquivos: app-api/src/modules/campaigns/dto/create-campaign.dto.ts,
app-api/src/modules/campaigns/dto/update-campaign.dto.ts,
app-api/src/modules/campaigns/dto/campaign-section-input.dto.ts,
app-api/src/modules/campaigns/dto/campaign-section-response.dto.ts,
app-api/src/modules/campaigns/dto/find-campaigns-query.dto.ts,
app-api/src/modules/campaigns/dto/campaign-response.dto.ts,
app-api/src/modules/campaigns/dto/campaign-list-item-response.dto.ts,
app-api/src/modules/campaigns/dto/paginated-campaigns-response.dto.ts,
app-api/src/modules/campaigns/campaigns.service.ts,
app-api/src/modules/campaigns/campaigns.controller.ts,
app-api/src/modules/campaigns/campaigns.module.ts,
app-api/src/modules/planned-sessions/dto/create-planned-session.dto.ts,
app-api/src/modules/planned-sessions/dto/update-planned-session.dto.ts,
app-api/src/modules/planned-sessions/dto/planned-session-section-input.dto.ts,
app-api/src/modules/planned-sessions/dto/planned-session-section-response.dto.ts,
app-api/src/modules/planned-sessions/dto/find-planned-sessions-query.dto.ts,
app-api/src/modules/planned-sessions/dto/planned-session-response.dto.ts,
app-api/src/modules/planned-sessions/dto/planned-session-list-item-response.dto.ts,
app-api/src/modules/planned-sessions/dto/paginated-planned-sessions-response.dto.ts,
app-api/src/modules/planned-sessions/planned-sessions.service.ts,
app-api/src/modules/planned-sessions/planned-sessions.controller.ts,
app-api/src/modules/planned-sessions/planned-sessions.module.ts,
app-api/src/app.module.ts (registro de CampaignsModule/PlannedSessionsModule),
app-api/src/modules/search/enums/linkable-entity-type.enum.ts (CAMPAIGN,
PLANNED_SESSION),
app-api/src/modules/search/search.module.ts (Campaign/PlannedSession em
TypeOrmModule.forFeature),
app-api/src/modules/search/search.service.ts (filtro por createdBy/posse da
campanha-pai e exclusão para usuários Google),
app-api/src/modules/search/search.controller.ts (@CurrentUser() repassado ao
service)

### 2. api-dev-doc
Status: concluído

Arquivos alterados:
- app-api/src/modules/campaigns/campaigns.controller.ts (adicionados decorators `@ApiOperation`, `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse`, `@ApiBadRequestResponse`)
- app-api/src/modules/planned-sessions/planned-sessions.controller.ts (adicionados decorators `@ApiOperation`, `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse`, `@ApiBadRequestResponse`)
- app-api/src/modules/search/search.controller.ts (`@ApiOperation` atualizado para mencionar campanhas e sessões planejadas)
- app-api/src/modules/search/dto/search-result-item-response.dto.ts (`@ApiProperty` de `entityType` atualizado para mencionar campanhas e sessões planejadas)

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Filtro por `createdBy`/posse da campanha-pai presente em **todo** método de
    `CampaignsService`/`PlannedSessionsService` que lê, altera ou remove um registro
    (não só no `findOne`) — inclusive `findAllPaginated` (listagem) e o `where` usado
    em `update`/`remove` antes de persistir qualquer mudança.
  - Nenhuma rota de `campaigns`/`planned-sessions` retorna `403` para posse indevida —
    sempre `404`, e a mensagem de erro nunca distingue "não existe" de "existe mas não
    é seu".
  - `@GoogleAccess('blocked')` (não `'read-only'`) aplicado a nível de controller em
    `CampaignsController` e `PlannedSessionsController`, com `GoogleAccessGuard`
    sempre depois de `JwtAuthGuard` em `@UseGuards`.
  - `createdBy` nunca aceito via DTO de criação/atualização de `Campaign` (só
    preenchido a partir de `@CurrentUser()` no service).
  - Cascatas `ON DELETE CASCADE` consistentes entre entidade e migration em todas as
    FKs novas (`created_by_id` → `users`, `campaign_id` → `campaigns` em ambas as
    tabelas filhas, `planned_session_id` → `planned_sessions`).
  - Integração de busca: `CAMPAIGN`/`PLANNED_SESSION` excluídos do resultado para
    usuários Google, filtrados por `createdBy`/posse da campanha-pai para usuários
    `local`, e todas as demais entidades do `linkableEntities` permanecendo globais e
    inalteradas (nenhuma regressão de comportamento nas buscas já existentes).
  - `PlannedSessionsModule` importa `CampaignsModule` (não o inverso) — sem dependência
    circular entre os dois módulos.
  - Consistência migration ↔ entidade nas seis migrations novas (nomes de tabela/coluna
    em `snake_case`, tipos, nullability, PKs, índices e FKs, `down()` revertendo
    exatamente o `up()` na ordem inversa).

## Revisão

Revisão completa de entidades, migrations, DTOs, services, controllers, modules e
integração com `search` (etapas 1 e 2, ambas concluídas). Todos os pontos de atenção
listados acima foram verificados especificamente:

- Filtro por `createdBy`/posse da campanha-pai está presente em **todos** os métodos
  de leitura/alteração/remoção de `CampaignsService` (`findOwnedById`,
  `findAllPaginated` via `andWhere('campaign.createdBy = :userId', ...)`, `update`,
  `remove`) e de `PlannedSessionsService` (todos os métodos públicos chamam
  `ensureOwnedCampaign`/`findOneOwned` antes de tocar em qualquer `PlannedSession`).
  Nenhuma rota retorna `403` para posse indevida — sempre `404` via
  `NotFoundException`, sem distinguir "não existe" de "não é seu".
- `@GoogleAccess('blocked')` aplicado a nível de controller em ambos os controllers,
  sempre com `GoogleAccessGuard` depois de `JwtAuthGuard` em `@UseGuards`.
- `createdBy` nunca é aceito via `CreateCampaignDto`/`UpdateCampaignDto` — preenchido
  apenas a partir de `@CurrentUser()` no service.
- Cascatas `ON DELETE CASCADE` consistentes entre entidade e migration em todas as FKs
  novas (`created_by_id` → `users`, `campaign_id` → `campaigns` em ambas as tabelas
  filhas, `planned_session_id` → `planned_sessions`).
- Integração com `search`: `CAMPAIGN`/`PLANNED_SESSION` corretamente excluídos do
  array `linkableEntities` para usuários Google, filtrados por `createdBy`/posse da
  campanha-pai (via `leftJoin('entity.campaign', 'campaign')`) para usuários `local`,
  e as demais entidades permanecem globais e inalteradas.
- `PlannedSessionsModule` importa `CampaignsModule` (não o inverso) — sem dependência
  circular.
- As seis migrations novas são consistentes com as entidades (tipos, nullability, PKs,
  índices, FKs) e cada `down()` reverte exatamente o `up()` na ordem inversa.
- Índice único composto `(name, created_by_id)` em `Campaign` e ausência de
  restrição de unicidade em `PlannedSession.name` conforme decisão do orquestrador —
  aprovado, não é um achado.

Dois problemas menores encontrados (nenhum bloqueante):

- **`app-api/src/modules/campaigns/campaigns.controller.ts`** — `POST /campaigns` e
  `PUT /campaigns/:id` não documentam a resposta `409 Conflict` que
  `CampaignsService.create`/`update` efetivamente lançam (`ConflictException('Já
  existe uma campanha com este nome.')` quando o nome já existe para o mesmo usuário).
  `LocationsController` (mesmo padrão de duplicidade de nome) documenta esse caso com
  `@ApiConflictResponse({ description: 'Nome do local já existe' })` nos métodos
  `create`/`update`; `CampaignsController` não tem o decorator equivalente.
  - Trecho: bloco de decorators do método `create` (linhas 48–57) e `update`
    (linhas 121–133) em `campaigns.controller.ts`, sem `@ApiConflictResponse`.
  - Sugestão: importar `ApiConflictResponse` de `@nestjs/swagger` e adicionar
    `@ApiConflictResponse({ description: 'Já existe uma campanha com este nome' })`
    aos métodos `create` e `update`, espelhando `LocationsController`.

- **`app-api/src/modules/campaigns/campaigns.controller.ts:97`** — erro de digitação
  no texto do Swagger (`@ApiOperation`) do endpoint `GET /campaigns/:id`.
  - Trecho: `summary: 'Busca uma campanha pelo id, restrrita ao usuário autenticado'`
  - Sugestão: corrigir para `'restrita'` (uma letra "r" a mais).

Achado cosmético (severidade baixa, não bloqueante):

- **`app-api/src/modules/planned-sessions/entities/planned-session.entity.ts`** — a
  entidade não segue a formatação/estilo dos demais arquivos criados na mesma task:
  o import de `typeorm` está em uma única linha longa (`import { Column, Entity,
  JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';`, >80
  colunas, ao contrário de `campaign.entity.ts`/`campaign-section.entity.ts`/
  `planned-session-section.entity.ts`, todos formatados em múltiplas linhas) e é a
  única das quatro entidades novas sem nenhum decorator `@ApiProperty`/
  `@ApiPropertyOptional` nos campos (`Campaign`, `CampaignSection` e
  `PlannedSessionSection` têm documentação Swagger completa a nível de entidade).
  Isso não afeta o contrato real da API (que é definido pelos DTOs de resposta com
  `fromEntity`, corretamente documentados), mas é inconsistente dentro da própria
  task e provavelmente não passou por `npm run format`/`npm run lint`.
  - Trecho: `import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';`
  - Sugestão: rodar `npm run format`/`npm run lint` no arquivo e, por consistência
    com as demais entidades da task, considerar adicionar `@ApiProperty`/
    `@ApiPropertyOptional` aos campos de `PlannedSession`.
  - **Corrigido**: import de `typeorm` reformatado em múltiplas linhas (mesmo padrão
    de `campaign.entity.ts`/`campaign-section.entity.ts`/
    `planned-session-section.entity.ts`) e adicionados `@ApiProperty`/
    `@ApiPropertyOptional` em `name`, `introduction`, `tags` e `sections`, espelhando
    exatamente o padrão das demais entidades da task (nenhuma coluna, tipo,
    nullability, relacionamento ou cascata alterado — apenas formatação/decorators
    Swagger).

Nenhum problema de segurança, de lógica de posse/visibilidade, de vazamento de dados
sensíveis (senha ou dados de outro usuário) ou de inconsistência migration↔entidade foi
encontrado. Arquivos revisados: todos os listados em "Entidade", "Migration" e
"Arquivos" da etapa 1 (api-dev) e os arquivos alterados na etapa 2 (api-dev-doc).

## Correções de revisão

Os dois achados menores encontrados na revisão acima foram corrigidos:

1. **`app-api/src/modules/campaigns/campaigns.controller.ts`** — Adicionado
   `@ApiConflictResponse({ description: 'Já existe uma campanha com este nome' })`
   aos métodos `POST /campaigns` (create) e `PUT /campaigns/:id` (update), seguindo o
   padrão equivalente de `LocationsController`. O decorator foi importado de
   `@nestjs/swagger` e a descrição reflete que o conflito é por nome duplicado do
   próprio usuário.

2. **`app-api/src/modules/campaigns/campaigns.controller.ts:97`** — Corrigido typo no
   texto do Swagger: "restrrita" → "restrita" no summary do endpoint `GET
   /campaigns/:id`.

3. **`app-api/src/modules/planned-sessions/entities/planned-session.entity.ts`** —
   Reformatado o import de `typeorm` em múltiplas linhas (mesmo padrão de
   `campaign.entity.ts`/`campaign-section.entity.ts`/
   `planned-session-section.entity.ts`) e adicionados `@ApiProperty`/
   `@ApiPropertyOptional` nos campos `name`, `introduction`, `tags` e `sections`,
   deixando a entidade consistente com as demais criadas nesta task. Nenhuma coluna,
   tipo, nullability, relacionamento ou cascata foi alterado — a migration
   correspondente permanece em sincronia com a entidade.
