# Task API: Histórico (Eras e Eventos)

## Contexto
Não existe `.claude/tasks/historia-eras-eventos/spec.md` para esta demanda — o
requisito foi informado diretamente pelo solicitante, de forma completa e já
esclarecida (incluindo a regra de negócio de reordenação em cascata), sem
necessidade de passar pelo agente `spec`. Este plano usa como referência de
padrões o módulo `app-api/src/modules/races/` (entidade com relação
`ManyToMany` para `Tag` via `@JoinTable` dedicada, campo `description` em
texto rico opcional, `referenceImageUrl` com `@IsUrl` condicional, paginação
padrão `{ data, total, page, perPage } + totalPages`, convenção
`fromEntity`, rota estática declarada antes de `GET /:id` — vide
`GET /races/categories`), reaproveitando a entidade `Tag` já existente em
`app-api/src/modules/tags/entities/tag.entity.ts`. Duas entidades novas serão
criadas — `Era` e `Event` — cada uma com módulo próprio
(`src/modules/eras/`, `src/modules/events/`), já que representam agregados
distintos com CRUDs e controllers independentes, mesmo havendo uma relação
opcional `Event.era → Era`.

## Etapas

### 1. api-dev

#### Entidade

**`Era`** (tabela `eras`), estendendo `BaseEntity` (herda `id` uuid,
`createdAt`, `updatedAt`). Nomes de colunas/propriedades em inglês; apenas
mensagens de erro/validação ficam em pt-BR:

- `name` (varchar) — obrigatório, único. Índice único (`@Index({ unique:
  true })`, mesmo padrão de `Race.name`).
- `referenceImageUrl` (varchar, nullable, coluna `reference_image_url`) —
  opcional; quando preenchido deve ser uma URL válida (`@IsUrl` condicional
  no DTO, mensagem pt-BR customizada — mesmo padrão de
  `Race.referenceImageUrl` / `Creature.referenceImageUrl`).
- `description` (text, nullable) — campo de texto rico (HTML), opcional,
  mesmo padrão de `Race.description` / `Location.description`.
- `tags` — relação `ManyToMany` para `Tag`
  (`modules/tags/entities/tag.entity.ts`), via `@JoinTable` dedicada
  `era_tags` (`era_id` / `tag_id`), exatamente no mesmo padrão de
  `Race.tags` / `race_tags`.
- `order` (int, not null) — propriedade da entidade chamada `order`, mas
  mapeada para a coluna física **`ordering`** (`@Column({ name: 'ordering'
  })`), já que `order` é palavra reservada em SQL e isso evita ter que
  escapar a coluna em toda query/QueryBuilder. Deve existir uma constraint
  única em `ordering` — ver nota importante na subseção Migration sobre por
  que essa constraint precisa ser `DEFERRABLE INITIALLY DEFERRED` (não uma
  simples `CREATE UNIQUE INDEX`), para viabilizar o shuffle em cascata dentro
  de uma única transação sem violar a unicidade em estados intermediários.

**`Event`** (tabela `events`), estendendo `BaseEntity`:

- `name` (varchar) — obrigatório. **Não** é único (sem `@Index({ unique:
  true })`, ao contrário de `Era.name` / `Race.name`).
- `referenceImageUrl` (varchar, nullable, coluna `reference_image_url`) —
  opcional, mesmo padrão de URL condicional descrito acima.
- `startYear` (varchar, nullable, coluna `start_year`) — opcional, texto
  livre (não numérico, sem validação de formato de data/ano).
- `endYear` (varchar, nullable, coluna `end_year`) — opcional, texto livre,
  mesmo padrão de `startYear`.
- `description` (text, nullable) — texto rico (HTML), opcional, mesmo padrão
  de `Era.description`.
- `tags` — relação `ManyToMany` para `Tag`, via `@JoinTable` dedicada
  `event_tags` (`event_id` / `tag_id`), mesmo padrão de `Era.tags`.
- `era` — relação `ManyToOne(() => Era, { nullable: true, onDelete: 'SET
  NULL' })` + `@JoinColumn({ name: 'era_id' })`. Opcional — um evento pode
  não ter era vinculada. Este é um padrão novo no projeto (as relações
  `ManyToOne` existentes, como `Creature.category` / `Race.category`, são
  `nullable: false` com `onDelete: 'RESTRICT'`); aqui a relação é opcional e
  usa `SET NULL` porque a exclusão de uma `Era` não deve bloquear nem
  cascatear a exclusão dos `Event` vinculados — eles apenas perdem a
  referência.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `src/database/migrations/`). Última migration existente é
  `1784305450000-CreateRaceTagsTable.ts`; as novas devem ter timestamp
  posterior, na seguinte ordem (cada uma depende da anterior via FK):

- Migration 1 — `CreateErasTable` (timestamp sugerido `1784305460000`): cria
  a tabela `eras` com `id`, `created_at`, `updated_at` (padrão `BaseEntity`),
  `name` varchar not null + índice único (`IDX_eras_name`),
  `reference_image_url` varchar nullable, `description` text nullable,
  `ordering` integer not null. **Importante**: a unicidade de `ordering` deve
  ser criada como constraint (`ALTER TABLE "eras" ADD CONSTRAINT
  "UQ_eras_ordering" UNIQUE ("ordering") DEFERRABLE INITIALLY DEFERRED`), e
  não como um simples `CREATE UNIQUE INDEX`. Isso é necessário porque a
  regra de reordenação em cascata do service faz múltiplos `UPDATE`s que
  passam por estados intermediários com valores de `ordering` teoricamente
  colidentes (ex.: ao incrementar em bloco todas as eras com `ordering >=
  N`), e uma constraint `UNIQUE` comum é validada linha a linha durante a
  execução do statement/transação, enquanto uma constraint `DEFERRABLE
  INITIALLY DEFERRED` só é validada no `COMMIT`, permitindo que o shuffle
  aconteça com segurança dentro da mesma transação. `migration:generate` não
  gera esse tipo de constraint automaticamente a partir de um `@Index`
  simples — precisa ser ajustado manualmente no SQL da migration (ou
  declarado de forma equivalente na entidade, se o TypeORM suportar
  `deferrable` na opção do índice/constraint; caso não suporte de forma
  direta pela decoration, ajustar o SQL gerado manualmente e manter a
  entidade apenas com `@Column({ name: 'ordering' })`, documentando a
  constraint apenas na migration).
- Migration 2 — `CreateEraTagsTable` (timestamp sugerido `1784305470000`):
  cria a tabela de junção `era_tags` (`era_id` uuid not null, `tag_id` uuid
  not null, PK composta `(era_id, tag_id)`, índices em cada coluna, FK
  `era_id` → `eras(id)` `ON DELETE CASCADE`, FK `tag_id` → `tags(id)` `ON
  DELETE CASCADE`), no mesmo formato de
  `1784305450000-CreateRaceTagsTable.ts`. Depende de `CreateErasTable` e da
  `CreateTagsTable` (`1784305370000`) já existente.
- Migration 3 — `CreateEventsTable` (timestamp sugerido `1784305480000`):
  cria a tabela `events` com `id`, `created_at`, `updated_at`, `name` varchar
  not null (**sem** índice único), `reference_image_url` varchar nullable,
  `start_year` varchar nullable, `end_year` varchar nullable, `description`
  text nullable, `era_id` uuid nullable com FK para `eras(id)` — `ON DELETE
  SET NULL` (`ON UPDATE NO ACTION`). Depende de `CreateErasTable` (FK).
- Migration 4 — `CreateEventTagsTable` (timestamp sugerido `1784305490000`):
  cria a tabela de junção `event_tags` (`event_id` uuid not null, `tag_id`
  uuid not null, PK composta `(event_id, tag_id)`, índices em cada coluna, FK
  `event_id` → `events(id)` `ON DELETE CASCADE`, FK `tag_id` → `tags(id)` `ON
  DELETE CASCADE`). Depende de `CreateEventsTable` e de `CreateTagsTable`.
- Gerar as quatro via `npm run migration:generate` a partir das entidades já
  criadas (`Era`, `Event`) e revisar manualmente o SQL resultante — em
  particular a constraint `DEFERRABLE INITIALLY DEFERRED` em
  `eras.ordering` (não gerada automaticamente por um `@Index` simples) e a
  FK `era_id` com `ON DELETE SET NULL` em `events` (conferir que o TypeORM
  gerou exatamente `SET NULL` e não `RESTRICT`/`CASCADE`/`NO ACTION` por
  omissão).

#### Controller

- Novo módulo `ErasModule` (`src/modules/eras/`), com `ErasController`,
  `ErasService`, `TypeOrmModule.forFeature([Era, Tag])`. Novo módulo
  `EventsModule` (`src/modules/events/`), com `EventsController`,
  `EventsService`, `TypeOrmModule.forFeature([Event, Era, Tag])` (o módulo de
  eventos referencia `Era` diretamente via `forFeature`, sem precisar
  importar `ErasModule`, mesmo padrão de `RacesModule` referenciando `Tag`
  diretamente sem importar `TagsModule`). Ambos os módulos (`ErasModule`,
  `EventsModule`) precisam ser importados em `app.module.ts` (entidades já
  são auto-registradas via `autoLoadEntities: true`).
- Ambos os controllers protegidos por `@UseGuards(JwtAuthGuard)` +
  `@ApiBearerAuth()`, mesmo padrão de `RacesController`.

**`ErasController`**:
- Endpoints:
  - `POST /eras` — cria era. Valida `name` único (409 pt-BR, "Já existe uma
    era com este nome."), `tagIds` existentes quando informados (404 pt-BR,
    "Uma ou mais tags não foram encontradas."). Recomenda-se também validar
    que `order` está dentro do intervalo válido `1..(quantidade de eras
    existentes + 1)` (400 pt-BR, ex.: "A posição informada é inválida.") —
    validação de robustez adicional não detalhada explicitamente no pedido,
    mas coerente com a regra de "opções de 1 até count+1" descrita para o
    frontend; sinalizar essa adição no código/comentário do service para
    revisão. Aplica a regra de reordenação em cascata na criação (ver
    detalhamento do service abaixo), toda a operação (incremento em cascata
    + insert) dentro de uma transação (`dataSource.transaction(...)`).
    Retorna `EraResponseDto`.
  - `GET /eras` — lista paginada. Query DTO com `name` (opcional, `ILIKE`
    parcial), `page`, `perPage` (defaults de
    `common/variables/pagination.ts`). Ordenação padrão:
    `orderBy('era.ordering', 'ASC')` (**não** por nome). Retorna
    `PaginatedErasResponseDto` composto por `EraListItemResponseDto`
    (enxuto, incluindo `order`, `referenceImageUrl`, `name`, `tags` — a
    listagem exibe tags).
  - `GET /eras/all` — todas as eras sem paginação, ordenadas por `order`
    (coluna `ordering`) ASC. Necessário tanto para popular o autocomplete de
    eras no formulário de Eventos quanto para o frontend calcular as opções
    de ordenação disponíveis. Retorna `EraOptionResponseDto[]` (DTO enxuto
    dedicado: `id`, `name`, `order` — mesmo espírito de
    `RaceCategoryResponseDto` como DTO auxiliar minimalista para um endpoint
    de apoio). **Importante**: declarar este método antes de `GET /eras/:id`
    na classe do controller, para que a rota estática `all` não seja
    capturada pelo parâmetro dinâmico `:id` — mesmo cuidado de
    `GET /races/categories`.
  - `GET /eras/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR se não
    encontrada ("Era não encontrada."). Retorna `EraResponseDto` completo
    (todos os campos, incluindo `order`, + tags).
  - `PUT /eras/:id` — atualiza era. Mesmas validações de nome único ao
    trocar nome, `tagIds` válidos quando informados. Quando `dto.order` é
    informado e diferente do `order` atual, aplica a reordenação em cascata
    de reindexação (ver service), também dentro de transação. Retorna
    `EraResponseDto`.
  - `DELETE /eras/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrada. Aplica a reordenação em cascata (decremento) das eras
    posteriores, dentro de transação. Os `Event` vinculados ficam com `era =
    null` automaticamente via `ON DELETE SET NULL` do schema, sem lógica
    adicional no service. A remoção de linhas em `era_tags` é resolvida pelo
    `ON DELETE CASCADE` do schema.

**`EventsController`**:
- Endpoints:
  - `POST /events` — cria evento. `eraId` validado contra existência quando
    informado (404 pt-BR, "Era não encontrada."), `tagIds` validados quando
    informados (404 pt-BR, "Uma ou mais tags não foram encontradas."). `name`
    não precisa ser único (sem verificação de conflito). Retorna
    `EventResponseDto`.
  - `GET /events` — lista paginada. Filtros: `name` (parcial `ILIKE`),
    `eraId` (igualdade exata), `startYear` e `endYear` (comparação textual
    via `ILIKE` parcial sobre a coluna varchar — **limitação a documentar**:
    como esses campos são texto livre por especificação, não numéricos, o
    filtro não realiza nenhuma comparação cronológica/numérica real — ex.:
    filtrar `startYear=800` casa apenas com valores que contenham
    literalmente "800" na string, sem considerar ordenação temporal ou
    intervalos). Ordenação padrão: `orderBy('event.name', 'ASC')`. Retorna
    `PaginatedEventsResponseDto` composto por `EventListItemResponseDto`
    (`referenceImageUrl`, `name`, `startYear`, `endYear`, `era` resumida —
    `EraSummaryResponseDto | null` —, `tags`).
  - `GET /events/:id` — detalhe completo, incluindo `era`
    (`EraSummaryResponseDto | null`, formato `{ id, name }`) e `tags`. 404
    pt-BR se não encontrado ("Evento não encontrado.").
  - `PUT /events/:id` — atualiza evento, mesmas validações de `eraId` e
    `tagIds`. Suporta limpar a era vinculada enviando `eraId: null`
    explicitamente (ver DTO abaixo) — omitir o campo mantém a era atual
    inalterada, enviar um novo `eraId` válido troca a era, enviar `null`
    remove a vinculação.
  - `DELETE /events/:id` — remove, `204 No Content`, 404 pt-BR se não
    encontrado ("Evento não encontrado."). A remoção de linhas em
    `event_tags` é resolvida pelo `ON DELETE CASCADE` do schema.

- DTOs de `Era`:
  - `CreateEraDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório);
    - `referenceImageUrl` (`@IsOptional`, `@IsUrl`, mensagem pt-BR
      customizada, mesmo padrão de `CreateRaceDto.referenceImageUrl`);
    - `description` (`@IsOptional`, `@IsString`);
    - `order` (`@IsInt`, `@Min(1)`, obrigatório — não é opcional, pois toda
      criação exige uma posição válida no intervalo `1..count+1`);
    - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`).
  - `UpdateEraDto` — `PartialType(CreateEraDto)` (incluindo `order` como
    opcional; quando omitido, a posição da era não muda e nenhuma
    reordenação em cascata é acionada).
  - `FindErasQueryDto` — `name?` (`@IsOptional @IsString`), `page?`,
    `perPage?` (mesmo padrão de `FindRacesQueryDto`, sem filtro adicional de
    ordenação — a listagem sempre ordena por `order` ASC).
  - `EraResponseDto` — `id`, `name`, `referenceImageUrl`, `description`,
    `order`, `tags` (`TagResponseDto[]`), `createdAt`, `updatedAt`; com
    `static fromEntity(era): EraResponseDto`.
  - `EraListItemResponseDto` — enxuto: `id`, `referenceImageUrl`, `name`,
    `order`, `tags` (`TagResponseDto[]`); com `static fromEntity(era)`.
  - `PaginatedErasResponseDto` — `data: EraListItemResponseDto[]`, `total`,
    `page`, `perPage`, `totalPages` (mesmo padrão de
    `PaginatedRacesResponseDto`).
  - `EraOptionResponseDto` — DTO minimalista dedicado ao endpoint
    `GET /eras/all`: `id`, `name`, `order`; com `static
    fromEntity(era): EraOptionResponseDto`.
  - `EraSummaryResponseDto` — DTO minimalista reaproveitado dentro dos DTOs
    de `Event` para representar a era vinculada de forma resumida: `id`,
    `name`; com `static fromEntity(era: Era | null):
    EraSummaryResponseDto | null` (retorna `null` quando o evento não tem
    era vinculada).

- DTOs de `Event`:
  - `CreateEventDto`:
    - `name` (`@IsString`, `@IsNotEmpty`, obrigatório, sem unicidade);
    - `referenceImageUrl` (`@IsOptional`, `@IsUrl`, mensagem pt-BR
      customizada);
    - `startYear` (`@IsOptional`, `@IsString` — texto livre, sem validação
      numérica);
    - `endYear` (`@IsOptional`, `@IsString` — mesmo padrão de `startYear`);
    - `description` (`@IsOptional`, `@IsString`);
    - `eraId` (`@IsOptional`, `@IsUUID`, opcional — um evento pode não ter
      era);
    - `tagIds` (`@IsOptional`, `@IsArray`, `@IsUUID('4', { each: true })`).
  - `UpdateEventDto` — `PartialType(CreateEventDto)`, mas **reescrevendo a
    propriedade `eraId` para aceitar `null` explicitamente**
    (`eraId?: string | null`, com `@IsOptional()` seguido de
    `@ValidateIf((o) => o.eraId !== null)` antes do `@IsUUID()`) —
    divergência deliberada do padrão simples de `PartialType` usado em
    `UpdateRaceDto`, necessária para permitir desvincular a era de um evento
    explicitamente (enviar `eraId: null`) sem impactar o comportamento de
    "omitir o campo = não alterar" usado pelos demais campos opcionais.
  - `FindEventsQueryDto` — `name?` (`@IsOptional @IsString`, `ILIKE`
    parcial), `eraId?` (`@IsOptional @IsUUID`, igualdade exata), `startYear?`
    e `endYear?` (`@IsOptional @IsString`, `ILIKE` parcial — documentar a
    limitação de comparação puramente textual no `@ApiPropertyOptional`),
    `page?`, `perPage?`.
  - `EventResponseDto` — `id`, `name`, `referenceImageUrl`, `startYear`,
    `endYear`, `description`, `era` (`EraSummaryResponseDto | null`), `tags`
    (`TagResponseDto[]`), `createdAt`, `updatedAt`; com `static
    fromEntity(event): EventResponseDto`.
  - `EventListItemResponseDto` — enxuto: `id`, `referenceImageUrl`, `name`,
    `startYear`, `endYear`, `era` (`EraSummaryResponseDto | null`), `tags`
    (`TagResponseDto[]`); com `static fromEntity(event)`.
  - `PaginatedEventsResponseDto` — `data: EventListItemResponseDto[]`,
    `total`, `page`, `perPage`, `totalPages`.

- Service `ErasService` (injeta `Repository<Era>`, `Repository<Tag>` e
  `DataSource` para as transações), pontos principais:
  - `findByName(name)`, `findById(id)` (com `relations: { tags: true }`),
    `findAllOrdered()` (todas as eras, `order: { order: 'ASC' }` — atenção:
    a propriedade TypeORM usada no `order`/`relations` do repository é
    `order` (nome da propriedade da entidade), mas a coluna física é
    `ordering`; no `QueryBuilder` usar sempre o alias da propriedade
    (`era.order`), nunca a palavra reservada `order` diretamente como SQL
    cru), `count()` (via `racesRepository`-like `.count()`) para calcular o
    limite superior válido de `order` na criação;
  - `findTagsByIds(tagIds)` privado, idêntico ao de `RacesService` (404
    pt-BR se alguma tag não existir);
  - `create(dto)`: dentro de `this.dataSource.transaction(async (manager) =>
    {...})` — valida nome único (409), valida `order` dentro do intervalo
    `1..count+1` (400 pt-BR se fora do intervalo), resolve `tags` a partir
    dos ids informados (array vazio quando ausente), executa um `UPDATE`
    via `manager` incrementando em 1 o `order` de todas as eras com `order
    >= dto.order` (`UPDATE eras SET ordering = ordering + 1 WHERE ordering
    >= :order`), depois insere a nova era com `order = dto.order` — tudo na
    mesma transação, que só valida a constraint `DEFERRABLE` no commit;
  - `findAllPaginated(query)`: filtra por `name` (`ILIKE` parcial), ordena
    por `era.order` ASC (propriedade mapeada para `ordering`), pagina
    buscando primeiro `id` via `skip`/`take` + `getManyAndCount` e depois
    recarrega a página completa com `relations: { tags: true }` (mesmo
    padrão de `RacesService.findAllPaginated`, evitando duplicação de linhas
    por `ManyToMany` + paginação);
  - `update(id, dto)`: dentro de transação — carrega a era atual, valida
    nome único ao trocar, resolve `tags` apenas quando `dto.tagIds !==
    undefined` (preserva a relação quando omitido). Quando `dto.order !==
    undefined && dto.order !== era.order` (chamando de `A` o valor atual e
    `B` o novo): se `B < A`, incrementa em 1 o `order` de todas as eras com
    `order` em `[B, A-1]`; se `B > A`, decrementa em 1 o `order` de todas as
    eras com `order` em `[A+1, B]`; em seguida atribui `era.order = B` e
    salva — a ordem dos updates dentro da transação não precisa de um passo
    "sentinela" (valor temporário fora da faixa) graças à constraint
    `DEFERRABLE INITIALLY DEFERRED`, mas o service deve mesmo assim
    encapsular tudo em uma única transação (`dataSource.transaction` ou
    `queryRunner` com `startTransaction`/`commitTransaction`/
    `rollbackTransaction`) para garantir atomicidade;
  - `remove(id)`: dentro de transação — carrega a era (404 pt-BR se não
    encontrada), guarda seu `order` (`P`), remove a era (`delete({ id })`),
    decrementa em 1 o `order` de todas as eras com `order > P`.

- Service `EventsService` (injeta `Repository<Event>`, `Repository<Era>`,
  `Repository<Tag>`; não precisa de `DataSource`/transação, já que não há
  regra de reordenação em cascata para eventos), pontos principais:
  - `findById(id)` (com `relations: { era: true, tags: true }`);
  - `findEraById(id)` (`erasRepository.findOneBy({ id })`);
  - `findTagsByIds(tagIds)` privado, idêntico ao padrão já usado;
  - `create(dto)`: resolve `era` a partir de `dto.eraId` quando informado
    (404 pt-BR "Era não encontrada." se não existir; `null` quando
    `eraId` ausente), resolve `tags` a partir dos ids informados (array
    vazio quando ausente), persiste;
  - `findAllPaginated(query)`: filtra por `name` (`ILIKE` parcial), `eraId`
    (igualdade exata via `event.era = :eraId`), `startYear`/`endYear`
    (`ILIKE` parcial), ordena por `event.name` ASC, pagina com o mesmo
    padrão de duas consultas (ids paginados + reload com `relations: {
    era: true, tags: true }`) usado em `RacesService`/`ErasService`;
  - `update(id, dto)`: valida `dto.eraId` — se `undefined`, não altera a
    era atual; se `null`, define `event.era = null`; se uma string, resolve
    a era (404 pt-BR se não existir) e atribui. Resolve `tags` apenas
    quando `dto.tagIds !== undefined`. Demais campos seguem o padrão
    `!== undefined` já usado em `RacesService.update`;
  - `remove(id)`: `delete({ id })`, 404 pt-BR se `affected === 0`.

Status: concluído
Entidade: app-api/src/modules/eras/entities/era.entity.ts,
app-api/src/modules/events/entities/event.entity.ts
Migration: app-api/src/database/migrations/1784305460000-CreateErasTable.ts,
app-api/src/database/migrations/1784305470000-CreateEraTagsTable.ts,
app-api/src/database/migrations/1784305480000-CreateEventsTable.ts,
app-api/src/database/migrations/1784305490000-CreateEventTagsTable.ts
Rotas: POST /eras, GET /eras, GET /eras/all, GET /eras/:id, PUT /eras/:id,
DELETE /eras/:id, POST /events, GET /events, GET /events/:id, PUT /events/:id,
DELETE /events/:id
Arquivos: app-api/src/modules/eras/dto/create-era.dto.ts,
app-api/src/modules/eras/dto/update-era.dto.ts,
app-api/src/modules/eras/dto/find-eras-query.dto.ts,
app-api/src/modules/eras/dto/era-response.dto.ts,
app-api/src/modules/eras/dto/era-list-item-response.dto.ts,
app-api/src/modules/eras/dto/paginated-eras-response.dto.ts,
app-api/src/modules/eras/dto/era-option-response.dto.ts,
app-api/src/modules/eras/dto/era-summary-response.dto.ts,
app-api/src/modules/eras/eras.service.ts,
app-api/src/modules/eras/eras.controller.ts,
app-api/src/modules/eras/eras.module.ts,
app-api/src/modules/events/dto/create-event.dto.ts,
app-api/src/modules/events/dto/update-event.dto.ts,
app-api/src/modules/events/dto/find-events-query.dto.ts,
app-api/src/modules/events/dto/event-response.dto.ts,
app-api/src/modules/events/dto/event-list-item-response.dto.ts,
app-api/src/modules/events/dto/paginated-events-response.dto.ts,
app-api/src/modules/events/events.service.ts,
app-api/src/modules/events/events.controller.ts,
app-api/src/modules/events/events.module.ts,
app-api/src/app.module.ts (registro de ErasModule e EventsModule)

Observação: o controller inclui apenas as anotações Swagger estruturais
(`@ApiTags`, `@ApiBearerAuth`) — `@ApiOperation`/`@ApiCreatedResponse`/
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` finos
ficam a cargo da etapa `api-dev-doc`, conforme escopo desta etapa.

Observação (pendência de execução): não foi possível rodar
`npm run migration:generate`/`npm run build` neste ambiente, pois este agente
só tem acesso às ferramentas Read/Grep/Glob/Edit/Write/Skill (sem Bash). As
quatro migrations foram escritas manualmente seguindo o padrão de
`1784305430000-CreateRaceCategoriesTable.ts`/`1784305440000-CreateRacesTable.ts`/
`1784305450000-CreateRaceTagsTable.ts`, com conferência campo a campo contra as
entidades `Era`/`Event` (incluindo a constraint `UQ_eras_ordering` `UNIQUE
("ordering") DEFERRABLE INITIALLY DEFERRED` e a FK `FK_events_era_id` com `ON
DELETE SET NULL`). Recomenda-se rodar `npm run build` (e, se aplicável,
`npm run migration:generate`/`npm run migration:run` mediante confirmação) em
um ambiente com acesso a shell antes de prosseguir para a etapa
`api-dev-doc`/revisão final.

### 2. api-dev-doc
- Depende da etapa 1 (api-dev).
- Revisar/complementar a documentação Swagger de todos os endpoints novos:
  `@ApiTags('eras')` em `ErasController` e `@ApiTags('events')` em
  `EventsController`, com `@ApiOperation({ summary })` em pt-BR para cada
  rota (criar, listar, listar todas/ordenadas, buscar por id, atualizar,
  remover, em ambos os módulos).
- Garantir respostas documentadas em `ErasController`: `@ApiCreatedResponse`
  (POST), `@ApiOkResponse` (GET/PUT, incluindo `GET /eras/all`),
  `@ApiNoContentResponse` (DELETE), `@ApiConflictResponse` (409, nome
  duplicado), `@ApiNotFoundResponse` (404 — era não encontrada, tags não
  encontradas, cobrindo `create`, `update`, `findOne`/`remove` de forma
  precisa), `@ApiBadRequestResponse` (URL inválida em `referenceImageUrl`,
  `order` fora do intervalo válido, `id`/`tagIds` em formato inválido).
- Garantir respostas documentadas em `EventsController`, mesmo padrão:
  `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`,
  `@ApiNotFoundResponse` (evento não encontrado, era não encontrada quando
  `eraId` informado, tags não encontradas), `@ApiBadRequestResponse` (URL
  inválida, `eraId`/`tagIds`/`id` em formato inválido).
- Conferir que todos os campos de `CreateEraDto`/`UpdateEraDto`/
  `EraResponseDto`/`EraListItemResponseDto`/`EraOptionResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes, incluindo
  `description` (exemplo em HTML) e `order` (exemplo numérico, descrição
  explicando o intervalo válido `1..count+1` na criação).
- Conferir que todos os campos de `CreateEventDto`/`UpdateEventDto`/
  `EventResponseDto`/`EventListItemResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes, incluindo
  `startYear`/`endYear` (exemplos de texto livre, ex.: "Ano 800 da Era
  Antiga") com descrição deixando claro que são campos textuais livres, não
  numéricos, e que os filtros de listagem correspondentes fazem
  correspondência textual (`ILIKE`), não comparação cronológica.
- Documentar explicitamente no `@ApiPropertyOptional` de `eraId` em
  `UpdateEventDto` que enviar `null` remove a vinculação com a era, e que
  omitir o campo mantém a era atual.
- Validar no `/docs` que `GET /eras/all` aparece corretamente documentado e
  não é ofuscado pela rota `GET /eras/:id`.
- Confirmar que `EraListItemResponseDto` documenta `order` e `tags`
  corretamente (a listagem de eras exibe a coluna "tags"), e que
  `EventListItemResponseDto`/`EventResponseDto` documentam `era` como
  `EraSummaryResponseDto` (nullable), refletindo que a vinculação é
  opcional.

Status: concluído
Arquivos: app-api/src/modules/eras/eras.controller.ts,
app-api/src/modules/events/events.controller.ts

### 3. api-dev-codereviewer
- Revisar tudo acima.
- Revisar as entidades `Era` e `Event`: tipos, nullability
  (`referenceImageUrl`/`description` nullable em ambas; `startYear`/
  `endYear` nullable apenas em `Event`; `order` not null em `Era`), o
  mapeamento `@Column({ name: 'ordering' })` para a propriedade `order`
  (garantir que nenhum ponto do código usa a palavra `order` como nome de
  coluna SQL cru sem escapar), a relação `ManyToMany` com `Tag` via
  `@JoinTable` dedicada em ambas as entidades (`era_tags`/`event_tags`), e a
  relação `ManyToOne` `Event.era` (`nullable: true`, `onDelete: 'SET NULL'`,
  coluna `era_id`) — confirmando que diverge intencionalmente do padrão
  `RESTRICT` usado em relações obrigatórias como `Race.category`.
- Revisar as migrations: ordem de execução (`eras` → `era_tags` → `events`
  → `event_tags`, dependendo também de `CreateTagsTable` já existente),
  constraint única em `ordering` criada como `DEFERRABLE INITIALLY DEFERRED`
  (não uma `CREATE UNIQUE INDEX` comum) — ponto crítico para a regra de
  reordenação em cascata funcionar sem violar a unicidade em estados
  intermediários dentro da transação —, FK `era_id` em `events` com `ON
  DELETE SET NULL` (não `RESTRICT`/`CASCADE`/`NO ACTION` por omissão do
  `migration:generate`), PK composta e índices das tabelas de junção
  `era_tags`/`event_tags` com FKs `ON DELETE CASCADE` nas duas colunas de
  cada uma, `down()` revertendo tudo (constraints, índices, tabelas) na
  ordem inversa do `up()`.
- Revisar DTOs e validações: unicidade de nome em `Era` (409 pt-BR) em
  `create`/`update`, ausência de verificação de unicidade em `Event.name`,
  `@IsUrl` condicional em `referenceImageUrl` de ambas, `order` obrigatório
  e `@IsInt`/`@Min(1)` em `CreateEraDto` (mais a validação de intervalo
  `1..count+1` no service), `eraId`/`tagIds` validados contra existência
  real (404 pt-BR) em `Event`, e o tratamento especial de `eraId` em
  `UpdateEventDto` (aceitando `null` explícito via `@ValidateIf`, distinto
  do padrão simples de `PartialType` usado nas demais entidades) —
  confirmar que omitir o campo preserva a era atual, enviar `null` limpa, e
  enviar um novo id troca.
- Revisar o service `ErasService`: que a regra de reordenação em cascata
  está correta e coberta por transação nos três cenários (criação —
  incremento de `order >= N`; edição — reindexação de faixa `[B, A-1]` ou
  `[A+1, B]` conforme a direção do movimento; exclusão — decremento de
  `order > P`), que `update` só reatribui `tags` quando `dto.tagIds !==
  undefined`, e que `findAllPaginated`/`findAllOrdered` ordenam
  corretamente por `order` (coluna `ordering`) sem causar N+1 desnecessário.
- Revisar o service `EventsService`: que `era` só é resolvida/revalidada
  quando `dto.eraId` está presente, com o tratamento correto de `null`
  (desvincular) vs. `undefined` (não alterar) vs. string (trocar/validar
  404), que `tags` só é reatribuída quando `dto.tagIds !== undefined`, e que
  os filtros de listagem (`name`/`startYear`/`endYear` via `ILIKE`, `eraId`
  exato) e a ordenação padrão por `name` ASC estão implementados sem N+1.
- Revisar os controllers: guards (`JwtAuthGuard`/`ApiBearerAuth`) em ambos,
  ordem das rotas em `ErasController` (`GET /eras/all` antes de
  `GET /eras/:id`), paginação `{ data, total, page, perPage }` +
  `totalPages` calculado no controller em ambos os módulos, uso de
  `fromEntity` em todos os DTOs de resposta (incluindo
  `EraSummaryResponseDto.fromEntity` retornando `null` quando o evento não
  tem era).
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome de
  era duplicado, era não encontrada, evento não encontrado, tags não
  encontradas, URL inválida, posição/`order` inválida), enquanto nomes de
  entidade/colunas/DTOs/JSON permanecem em inglês.
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`,
  `autoLoadEntities`, convenção `fromEntity`, paginação padrão
  `{ data, total, page, perPage }` + `totalPages`, Swagger completo,
  `synchronize: false` com toda alteração de schema via migration,
  `ErasModule`/`EventsModule` registrados em `app.module.ts`).

## Revisão

Escopo revisado: `app-api/src/modules/eras/entities/era.entity.ts`,
`app-api/src/modules/events/entities/event.entity.ts`,
`app-api/src/database/migrations/1784305460000-CreateErasTable.ts`,
`app-api/src/database/migrations/1784305470000-CreateEraTagsTable.ts`,
`app-api/src/database/migrations/1784305480000-CreateEventsTable.ts`,
`app-api/src/database/migrations/1784305490000-CreateEventTagsTable.ts`,
todos os DTOs de `eras`/`events` listados no campo "Arquivos" da etapa
"1. api-dev", `eras.service.ts`, `eras.controller.ts`, `eras.module.ts`,
`events.service.ts`, `events.controller.ts`, `events.module.ts` e o registro
em `app.module.ts`. Etapas "1. api-dev" e "2. api-dev-doc" estão ambas
marcadas como "Status: concluído", portanto a revisão avaliou o trabalho como
pronto para análise final.

Confirmado que estão corretos e de acordo com o `CLAUDE.md`/plano da task:

- **Constraint `DEFERRABLE INITIALLY DEFERRED`**: `1784305460000-CreateErasTable.ts`
  cria `UQ_eras_ordering` via `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE
  ("ordering") DEFERRABLE INITIALLY DEFERRED` (não um `CREATE UNIQUE INDEX`
  comum), exatamente como exigido para permitir estados intermediários
  colidentes dentro da mesma transação. `ErasService.create`/`update`/`remove`
  encapsulam corretamente todas as operações (incremento/decremento em
  cascata + insert/update/delete) dentro de `this.dataSource.transaction(async
  (manager) => {...})`, sempre reutilizando o mesmo `manager` (via
  `manager.getRepository(Era)`/`manager.query`) para todas as queries da
  operação, garantindo que a validação da constraint só ocorra no `COMMIT`.
- **Lógica matemática da cascata**: verificada nos três cenários.
  - Criação: `UPDATE eras SET ordering = ordering + 1 WHERE ordering >=
    dto.order` antes do insert — correto.
  - Edição movendo para cima (`newOrder < currentOrder`): incrementa em 1 as
    eras com `ordering` em `[newOrder, currentOrder - 1]` (não atinge a
    própria era, cujo valor atual — `currentOrder` — fica fora dessa faixa) —
    correto.
  - Edição movendo para baixo (`newOrder > currentOrder`): decrementa em 1 as
    eras com `ordering` em `[currentOrder + 1, newOrder]` (mesma exclusão
    correta da própria era) — correto.
  - Exclusão: remove a era e decrementa em 1 as eras com `ordering > P` (P =
    posição da era removida) — correto.
- **FK `era_id` em `events`**: `1784305480000-CreateEventsTable.ts` cria
  `FK_events_era_id` com `ON DELETE SET NULL ON UPDATE NO ACTION`, coerente
  com `Event.era` (`ManyToOne(() => Era, { nullable: true, onDelete: 'SET
  NULL' })`), divergindo intencionalmente do `ON DELETE RESTRICT` usado em
  relações obrigatórias como `Race.category`.
- **`UpdateEventDto.eraId`**: `PartialType(OmitType(CreateEventDto, ['eraId']
  as const))` mais a redeclaração de `eraId?: string | null` com
  `@IsOptional()` + `@ValidateIf((_object, value) => value !== null)` +
  `@IsUUID()`. Comportamento funcional confirmado nos três casos: `undefined`
  (omitido) é ignorado por `@IsOptional()` (que já trata `null`/`undefined`
  como "vazio" e pula toda a validação da propriedade, tornando o
  `@ValidateIf` redundante nesse caso específico, mas inofensivo); `null` é
  igualmente liberado por `@IsOptional()`; uma string passa a validação
  `@IsUUID()` normalmente. `EventsService.update` trata os três casos de
  forma explícita e correta (`dto.eraId === undefined` não altera,
  `=== null` limpa a era, string resolve/valida 404). Único ponto cosmético:
  o `@ValidateIf` é, na prática, redundante dado o comportamento nativo de
  `@IsOptional()` em relação a `null` — não é um bug, apenas uma observação
  de estilo, sem necessidade de correção.
- **Ordem das rotas em `ErasController`**: `GET /eras/all` declarado antes de
  `GET /eras/:id`, evitando a captura pela rota dinâmica.
- **DTOs de resposta de `Era`/`Event`**: `EraResponseDto`/
  `EraListItemResponseDto` (completos, com `order`/`tags`), `EraOptionResponseDto`
  (`id`/`name`/`order`, usado exclusivamente em `GET /eras/all`) e
  `EraSummaryResponseDto` (`id`/`name`, usado exclusivamente como campo `era`
  embutido em `EventResponseDto`/`EventListItemResponseDto`, com
  `fromEntity(era: Era | null)` retornando `null` corretamente) — cada um
  usado exatamente no endpoint/contexto correto, sem vazamento de campos
  indevidos.
- **Entidades**: `Era`/`Event` com nullability correta
  (`referenceImageUrl`/`description` nullable em ambas; `startYear`/`endYear`
  nullable apenas em `Event`; `order` not null em `Era`), `@Column({ name:
  'ordering' })` mapeado corretamente, sem nenhum ponto do código usando a
  palavra `order` como identificador SQL cru sem escapar (nas queries em
  `manager.query` sempre se usa `ordering`; no `QueryBuilder`/`repository.find`
  sempre se usa a propriedade `order`/`era.order`, traduzida pelo TypeORM).
  `ManyToMany` com `Tag` via `@JoinTable` dedicada (`era_tags`/`event_tags`)
  em ambas, idêntico ao padrão de `Race.tags`.
- **Migrations**: ordem cronológica correta e dependente
  (`eras` → `era_tags` → `events` → `event_tags`, após
  `1784305450000-CreateRaceTagsTable.ts` e `CreateTagsTable` já existentes),
  PK composta e índices das tabelas de junção com FKs `ON DELETE CASCADE` nas
  duas colunas de cada uma, `down()` revertendo tudo (constraints, índices,
  tabelas) na ordem inversa do `up()` em todas as quatro migrations.
- **Services/controllers**: `findByName`/`findById`/`findAllOrdered`/
  `findTagsByIds` em `ErasService`, e `findById`/`findEraById`/
  `findTagsByIds` em `EventsService`, todos com `relations` carregadas em uma
  única consulta (sem N+1); paginação em ambos os services usando o padrão de
  duas consultas (ids paginados + reload com `relations`) idêntico ao de
  `RacesService`; `update` em ambos os services só reatribui `tags` quando
  `dto.tagIds !== undefined`, preservando a relação quando omitido; guards
  (`JwtAuthGuard`/`ApiBearerAuth()`) presentes em ambos os controllers;
  paginação `{ data, total, page, perPage }` + `totalPages` calculado no
  controller em ambos os módulos; `fromEntity` usado em todos os DTOs de
  resposta.
- **Mensagens de erro/validação**: em pt-BR em todos os pontos ("Já existe
  uma era com este nome.", "Era não encontrada.", "Evento não encontrado.",
  "Uma ou mais tags não foram encontradas.", "A posição informada é
  inválida.", "A URL da imagem de referência é inválida."), nomes de
  entidade/coluna/DTO/JSON em inglês.
- **Documentação Swagger**: `@ApiTags`/`@ApiOperation`/respostas
  (`@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`/
  `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse`)
  presentes e coerentes com o comportamento real em ambos os controllers;
  campos de todos os DTOs documentados com `@ApiProperty`/
  `@ApiPropertyOptional` e exemplos coerentes, incluindo a observação sobre
  `startYear`/`endYear` serem texto livre e o filtro `ILIKE` não realizar
  comparação cronológica.
- **Módulos**: `ErasModule`/`EventsModule` registrados em `app.module.ts`,
  `TypeOrmModule.forFeature` com as entidades corretas em cada um
  (`EventsModule` referenciando `Era` diretamente, sem importar `ErasModule`).

Problema encontrado:

- **`app-api/src/modules/eras/eras.service.ts:172-189` (método `update`)** —
  Ao contrário de `create` (que valida `dto.order` no intervalo `1..count+1`
  antes de aplicar a cascata), `update` não valida nenhum limite superior
  para `dto.order` — apenas o `@Min(1)` herdado de `CreateEraDto` via
  `PartialType` a nível de DTO. Isso permite que um `PUT /eras/:id` envie um
  `order` arbitrariamente maior que a quantidade de eras existentes (ex.:
  `order: 9999` quando há apenas 5 eras). Matematicamente a cascata ainda
  preserva a unicidade no commit (graças à constraint `DEFERRABLE`), então
  não há erro de execução — mas o valor de `ordering` da era passa a ficar
  fora da faixa contígua `1..count`, quebrando a invariante da qual `create`
  depende para calcular corretamente a posição "inserir ao final"
  (`dto.order === count + 1`): uma criação subsequente com esse valor
  acabaria capturando na cláusula `ordering >= dto.order` a era com o
  `ordering` residual alto e a deslocaria (`+1`), inserindo a nova era
  **antes** dela em vez de ao final da lista — resultado visualmente
  incorreto para o usuário, mesmo sem falha técnica.
  - Trecho: `if (dto.order !== undefined && dto.order !== era.order) { const
    currentOrder = era.order; const newOrder = dto.order; if (newOrder <
    currentOrder) { ... } else { ... } era.order = newOrder; }` (sem checagem
    de `newOrder > count` antes de aplicar a cascata).
  - Sugestão: antes de aplicar a cascata em `update`, buscar `const count =
    await erasRepository.count()` (dentro da mesma transação) e validar `if
    (dto.order < 1 || dto.order > count) { throw new BadRequestException('A
    posição informada é inválida.'); }` — usando `count` (não `count + 1`,
    já que aqui não se está adicionando uma nova era, apenas reposicionando
    uma existente entre as posições já ocupadas).

Demais itens revisados (entidades, migrations, DTOs, controllers, mensagens
de erro, Swagger, módulos) estão corretos e sem outros problemas
identificados.
