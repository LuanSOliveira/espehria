# Task API: Relação muitos-para-muitos entre Criatura e Tag

## Contexto
Não há `.claude/tasks/criatura-tags/spec.md` para esta demanda — o pedido já
veio claro diretamente do usuário, com as seguintes regras de negócio
confirmadas (sem ambiguidade, não é necessário rodar `spec`):

- Uma criatura pode ter zero ou mais tags associadas, sem limite máximo.
- Uma tag pode estar associada a várias criaturas.
- Relação `@ManyToMany` com tabela de junção.

Módulos/arquivos de referência usados como padrão:
- `app-api/src/modules/creatures/` (entidade `Creature`, DTOs, service,
  controller — padrão de módulo já existente que será alterado).
- `app-api/src/modules/tags/` (entidade `Tag`, `TagResponseDto` — entidade já
  existente que será referenciada, sem alterações no seu próprio CRUD).
- `app-api/src/modules/creatures/entities/creature.entity.ts` já contém um
  precedente de relacionamento (`@ManyToOne` para `CreatureCategory`, com
  `@JoinColumn({ name: 'category_id' })`), mas é a primeira relação
  `@ManyToMany` do projeto — não há precedente direto de tabela de junção em
  `.claude/tasks/entity-mentions/` (aquela task foi resolvida sem nenhuma
  entidade/relação nova, ver `.claude/tasks/entity-mentions/task-api.md`) nem
  em nenhuma outra task já implementada. O plano abaixo segue o estilo já
  usado em `@ManyToOne`/migrations existentes (SQL puro via
  `queryRunner.query(...)`, nomes de colunas em snake_case, `ON DELETE`
  explícito) e a skill `api-migration`
  (`.claude/skills/api-migration/SKILL.md`), adaptando-o para uma tabela de
  junção `@ManyToMany`.

Ponto a sinalizar (lacuna de requisito, não de arquitetura): o pedido não
define explicitamente o comportamento de `ON DELETE` da tabela de junção
quando uma criatura ou uma tag é removida. O plano abaixo assume `CASCADE` em
ambas as pontas (remover a criatura ou a tag remove apenas as linhas de
associação na tabela de junção, nunca a outra entidade) — é o comportamento
padrão esperado para tabelas de junção `@ManyToMany` e não conflita com o
`ON DELETE RESTRICT` já usado em `Creature.category` (que é uma relação
obrigatória `@ManyToOne`, cenário diferente). Validar esta suposição antes de
aplicar a migration, caso o time prefira outro comportamento.

Também não é definido se a relação deve ser bidirecional (com um campo
inverso `creatures` em `Tag`) ou apenas unidirecional (Creature → Tag). O
plano abaixo assume **unidirecional** (dono da relação é `Creature`, via
`@JoinTable`, sem campo inverso em `Tag`), pois nenhum endpoint de `Tag` foi
solicitado para listar as criaturas associadas — apenas o sentido
Criatura → Tags é exigido pelo escopo (DTOs de criatura exibindo suas tags).
Sinalizando essa decisão para confirmação; caso o time queira futuramente
`GET /tags/:id` retornando as criaturas associadas, o campo inverso
(`@ManyToMany(() => Creature, (creature) => creature.tags) creatures:
Creature[]` em `Tag`) pode ser adicionado depois sem quebrar o que está
descrito aqui.

## Etapas

### 1. api-dev

#### Entidade

- Alterar `Creature`
  (`app-api/src/modules/creatures/entities/creature.entity.ts`), adicionando
  um novo campo de relacionamento:
  ```ts
  @ApiProperty({ type: () => [Tag], description: 'Tags associadas à criatura' })
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'creature_tags',
    joinColumn: { name: 'creature_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
  ```
  - Import novo: `Tag` de `../../tags/entities/tag.entity` e `ManyToMany`,
    `JoinTable` de `typeorm` (junto aos imports já existentes de
    `ManyToOne`/`JoinColumn`).
  - Nenhuma alteração é necessária em `Tag`
    (`app-api/src/modules/tags/entities/tag.entity.ts`) — relação
    unidirecional, sem campo inverso, conforme decisão registrada acima.
  - `Creature` é o lado dono da relação (`@JoinTable` fica nela), consistente
    com o fato de que o CRUD de criaturas é quem recebe/persiste `tagIds`.

#### Migration

- Necessária: sim (`synchronize` é `false`; toda alteração de schema precisa
  de migration em `app-api/src/database/migrations/`, conforme a skill
  `api-migration`).
- Nome sugerido: `CreateCreatureTagsTable`, timestamp posterior ao das
  migrations já existentes (a mais recente é
  `1784305370000-CreateTagsTable.ts`), ex.:
  `1784305380000-CreateCreatureTagsTable.ts`.
- Cria a tabela de junção `creature_tags`, seguindo o estilo SQL puro já
  usado no projeto (ver `1784305360000-CreateCreaturesTable.ts` como
  referência de `up()`/`down()`):
  - `creature_id` uuid NOT NULL, `tag_id` uuid NOT NULL;
  - chave primária composta `CONSTRAINT "PK_creature_tags" PRIMARY KEY
    ("creature_id", "tag_id")` (sem colunas herdadas de `BaseEntity` — tabela
    de junção pura, sem `id`/`created_at`/`updated_at`, mesmo padrão que o
    TypeORM gera por padrão para `@JoinTable` sem entidade própria);
  - índices individuais em cada FK (`CREATE INDEX "IDX_creature_tags_creature_id"
    ON "creature_tags" ("creature_id")` e `CREATE INDEX
    "IDX_creature_tags_tag_id" ON "creature_tags" ("tag_id")`), mesmo padrão
    que o TypeORM gera automaticamente para colunas de `@JoinTable`;
  - `ALTER TABLE "creature_tags" ADD CONSTRAINT "FK_creature_tags_creature_id"
    FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE
    CASCADE`;
  - `ALTER TABLE "creature_tags" ADD CONSTRAINT "FK_creature_tags_tag_id"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE`
    (`ON DELETE CASCADE` em ambas as FKs, conforme decisão assumida na seção
    "Contexto" — validar antes de aplicar).
  - `down()` desfaz na ordem inversa: drop das duas `FK`, drop dos dois
    índices, `DROP TABLE "creature_tags"`.
- Gerar via `npm run migration:generate -- src/database/migrations/CreateCreatureTagsTable`
  a partir da entidade `Creature` já alterada, e revisar o SQL resultante
  (nomes de constraints/índices, tipos, `ON DELETE`) antes de considerar
  pronta — conferindo item a item contra o checklist de consistência da
  skill `api-migration`.
- **Importante**: a migration deve ser criada como arquivo, mas **não deve
  ser executada automaticamente** (`npm run migration:run`). Conforme a
  skill `api-migration`, sempre perguntar ao usuário antes de rodar
  `migration:run`/`migration:revert` e só prosseguir após confirmação
  explícita.

#### Controller

- Nenhum endpoint novo — os endpoints existentes de `creatures` passam a
  aceitar/retornar tags:
  - `POST /creatures` — `CreateCreatureDto` passa a aceitar `tagIds?:
    string[]` (array opcional de UUIDs). Resposta (`CreatureResponseDto`)
    passa a incluir `tags`.
  - `GET /creatures` — cada item de `PaginatedCreaturesResponseDto.data`
    (`CreatureListItemResponseDto`) passa a incluir `tags`.
  - `GET /creatures/:id` — resposta (`CreatureResponseDto`) passa a incluir
    `tags`.
  - `PUT /creatures/:id` — `UpdateCreatureDto` passa a aceitar `tagIds?:
    string[]` (herdado de `CreateCreatureDto` via `PartialType`). Resposta
    passa a incluir `tags`.
  - `DELETE /creatures/:id` — sem alteração (a remoção da criatura já
    remove em cascata as linhas correspondentes em `creature_tags` via `ON
    DELETE CASCADE` da migration; nenhuma tag é removida).
- DTOs (em `app-api/src/modules/creatures/dto/`):
  - `CreateCreatureDto` — novo campo:
    ```ts
    @ApiPropertyOptional({
      type: [String],
      format: 'uuid',
      description: 'IDs das tags associadas à criatura',
      example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    tagIds?: string[];
    ```
    Se omitido, a criatura é criada sem nenhuma tag associada (consistente
    com "zero ou mais tags", sem tornar o campo obrigatório).
  - `UpdateCreatureDto` — continua `PartialType(CreateCreatureDto)`, sem
    alteração de código; `tagIds` já fica opcional automaticamente. Decisão
    de semântica de update (sinalizando para confirmação, pois o pedido não
    define explicitamente): se `tagIds` **não for enviado** no `PUT`, a
    lista de tags atual da criatura permanece inalterada (mesmo padrão dos
    demais campos opcionais do `update`, que só alteram o que for
    explicitamente enviado); se `tagIds` **for enviado** (incluindo um array
    vazio `[]`), a lista de tags é **substituída integralmente** pela
    enviada — não é um "adicionar"/"remover" incremental. Este é o
    comportamento mais previsível para um campo de array em um DTO de
    update parcial, mas deve ser validado com o time/frontend antes de
    fechar em definitivo, pois `[]` explícito ("remover todas as tags") e
    ausência do campo ("não mexer nas tags") têm semânticas diferentes que
    o consumidor da API precisa conhecer.
  - `CreatureResponseDto` e `CreatureListItemResponseDto` — novo campo:
    ```ts
    @ApiProperty({ type: () => [TagResponseDto], description: 'Tags associadas à criatura' })
    tags: TagResponseDto[];
    ```
    reutilizando `TagResponseDto` (`app-api/src/modules/tags/dto/tag-response.dto.ts`,
    que já expõe `id`, `name`, `color` — mais `createdAt`, herdado do DTO
    existente) em vez de criar um DTO minimalista novo só com `id`/`name`/
    `color` — mesmo padrão já usado para `CreatureCategoryResponseDto`
    aninhado em `CreatureResponseDto`/`CreatureListItemResponseDto`. Import
    cross-module de `TagResponseDto` no módulo `creatures`, sem criar
    dependência de módulo (`CreaturesModule` não precisa importar
    `TagsModule` só por causa do DTO — DTOs são apenas classes/tipos).
    `fromEntity` de ambos os DTOs passa a mapear `dto.tags =
    (creature.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag))`.
- Module (`app-api/src/modules/creatures/creatures.module.ts`): passa a
  importar também `TypeOrmModule.forFeature([Creature, CreatureCategory,
  Tag])` (adicionando `Tag` à lista já existente), seguindo o mesmo
  precedente já usado em `SearchModule`
  (`app-api/src/modules/search/search.module.ts`) de importar o repositório
  de uma entidade de outro módulo diretamente via `forFeature`, em vez de
  importar o módulo inteiro (`TagsModule`) — aqui o uso é apenas para
  validar/carregar `Tag` por id dentro de `CreaturesService`, sem nenhuma
  regra de negócio de `Tag` sendo duplicada.
- Service (`CreaturesService`,
  `app-api/src/modules/creatures/creatures.service.ts`):
  - Injetar `@InjectRepository(Tag) private readonly tagsRepository:
    Repository<Tag>` no construtor (junto aos repositórios já existentes de
    `Creature`/`CreatureCategory`).
  - Novo método privado auxiliar, ex. `findTagsByIds(tagIds: string[]):
    Promise<Tag[]>`:
    - Busca `this.tagsRepository.findBy({ id: In(tagIds) })` (ou
      `createQueryBuilder` equivalente);
    - Se `found.length !== tagIds.length`, lança
      `NotFoundException('Uma ou mais tags não foram encontradas.')` (pt-BR,
      mesmo padrão da mensagem de categoria não encontrada em `create`).
  - `create(dto)`: se `dto.tagIds` estiver definido e não vazio, resolve as
    `Tag`s via `findTagsByIds` e atribui `creature.tags = tags` antes do
    `save`; se `dto.tagIds` for `undefined` ou array vazio, `creature.tags =
    []` (nenhuma tag associada na criação).
  - `update(id, dto)`: se `dto.tagIds !== undefined`, resolve as `Tag`s via
    `findTagsByIds` (permitindo array vazio, que resulta em `creature.tags =
    []`, removendo todas as associações) e atribui `creature.tags = tags`;
    se `dto.tagIds` for `undefined`, não toca no campo `tags` da criatura
    (mesmo padrão `if (dto.campo !== undefined)` já usado para os demais
    campos opcionais do método).
  - `findById(id)`: adicionar `tags: true` ao objeto `relations` já existente
    (`relations: { category: true, tags: true }`), para que `GET
    /creatures/:id` retorne as tags sem N+1.
  - `findAllPaginated(query)`: adicionar
    `.leftJoinAndSelect('creature.tags', 'tags')` à `queryBuilder` já
    existente (ao lado do `leftJoinAndSelect('creature.category',
    'category')`), para que `GET /creatures` retorne as tags de cada item
    sem N+1. Nenhum filtro novo por tag é solicitado pelo escopo atual —
    `FindCreaturesQueryDto` não precisa de um `tagId?`/`tagIds?` novo (fora
    de escopo; sinalizar caso o time queira filtrar criaturas por tag no
    futuro).
  - Nenhuma alteração nos métodos `findByName`, `findCategoryById`,
    `findAllCategories`, `remove`.

Status: concluído
Entidade: app-api/src/modules/creatures/entities/creature.entity.ts
Migration: app-api/src/database/migrations/1784305380000-CreateCreatureTagsTable.ts (não executada — aguardando confirmação explícita do usuário para `npm run migration:run`)
Rotas: POST /creatures, GET /creatures, GET /creatures/:id, PUT /creatures/:id (todas já existentes, sem rota nova — passaram a aceitar/retornar `tags`)
Arquivos: app-api/src/modules/creatures/dto/create-creature.dto.ts, app-api/src/modules/creatures/dto/creature-response.dto.ts, app-api/src/modules/creatures/dto/creature-list-item-response.dto.ts, app-api/src/modules/creatures/creatures.service.ts, app-api/src/modules/creatures/creatures.module.ts (update-creature.dto.ts e creatures.controller.ts sem alteração de código, pois herdam/reutilizam o já existente)

### 2. api-dev-doc

- Depende da etapa 1.
- Atualizar `@ApiProperty`/`@ApiPropertyOptional` novos com descrições em
  pt-BR e exemplos coerentes:
  - `CreateCreatureDto.tagIds` — `@ApiPropertyOptional` com `type: [String]`,
    `format: 'uuid'`, descrição "IDs das tags associadas à criatura" e
    exemplo com pelo menos um UUID.
  - `CreatureResponseDto.tags` / `CreatureListItemResponseDto.tags` —
    `@ApiProperty` com `type: () => [TagResponseDto]` e descrição "Tags
    associadas à criatura".
  - `Creature.tags` (entidade, decorada com `@ApiProperty` pois o projeto
    também documenta a entidade — ver `category` na própria entidade) —
    `type: () => [Tag]`, descrição equivalente.
- Atualizar `@ApiNotFoundResponse` e `@ApiBadRequestResponse` já existentes
  em `CreaturesController` (`create` e `update`) para cobrir também o novo
  caso de erro:
  - `create`: `@ApiNotFoundResponse({ description: 'Categoria não
    encontrada ou uma ou mais tags não encontradas' })` (ajustar a descrição
    já existente, que hoje só menciona categoria).
  - `update`: mesma alteração de descrição em
    `@ApiNotFoundResponse({ description: 'Criatura, categoria ou uma ou
    mais tags não encontradas' })`.
- Conferir que `@ApiOkResponse`/`@ApiCreatedResponse` de `create`, `findAll`,
  `findOne`, `update` continuam corretos (apontam para os mesmos DTOs, que
  agora incluem `tags` — nenhuma mudança de tipo de resposta, apenas de
  conteúdo).
- Nenhuma alteração de documentação é necessária em `TagsController`/
  `tags/dto/*` — o CRUD de `Tag` em si não muda; apenas `TagResponseDto` é
  reutilizado (import), sem alteração de conteúdo.

Status: concluído

## Revisão

**Status: corrigido** — os dois achados abaixo foram corrigidos em
`app-api/src/modules/creatures/creatures.service.ts`:

- `findAllPaginated` agora busca primeiro os `id`s paginados (query builder
  sem `leftJoinAndSelect('creature.tags', ...)`, com `.select('creature.id')`,
  mantendo filtros/`orderBy`/`skip`/`take`/`getManyAndCount` como antes) e, em
  seguida, busca as entidades completas via
  `this.creaturesRepository.find({ where: { id: In(ids) }, relations: { category: true, tags: true } })`,
  remontando o array `data` na ordem original dos ids paginados (via `Map`).
  `total`/`totalPages` continuam corretos e agora consistentes com `data`.
- `findTagsByIds` agora deduplica `tagIds` (`const uniqueIds = [...new Set(tagIds)]`)
  antes de buscar e comparar (`tags.length !== uniqueIds.length`), eliminando
  o falso positivo de `NotFoundException` quando `tagIds` contém ids
  repetidos de tags existentes.

- **`app-api/src/modules/creatures/creatures.service.ts:117-147` (`findAllPaginated`)** —
  Bug de paginação ao combinar `leftJoinAndSelect('creature.tags', 'tags')`
  (relação `@ManyToMany`, portanto "to-many") com `.skip()`/`.take()` na mesma
  query builder. É uma limitação conhecida do TypeORM: `LIMIT`/`OFFSET` são
  aplicados sobre as linhas cru já achatadas pelo `JOIN` (uma linha por par
  criatura/tag), e não sobre as entidades raiz distintas — diferente de
  `getCount()`, que usa `COUNT(DISTINCT ...)` e por isso continua correto. Na
  prática, para uma criatura com N tags (N > 1), a paginação pode: (a)
  devolver menos criaturas do que `perPage` numa página mesmo havendo mais
  registros disponíveis, (b) "cortar" o `skip`/`take` no meio das tags de uma
  criatura, ou (c) omitir criaturas inteiras de uma página, enquanto `total`
  (calculado à parte) permanece correto — ou seja, `GET /creatures` pode
  retornar uma lista inconsistente com `totalPages`/`total`. Isso não
  acontece com o `leftJoinAndSelect('creature.category', 'category')` já
  existente, pois `category` é `@ManyToOne` (uma linha por criatura, sem
  multiplicação).
  - Trecho:
    ```ts
    const queryBuilder = this.creaturesRepository
      .createQueryBuilder('creature')
      .leftJoinAndSelect('creature.category', 'category')
      .leftJoinAndSelect('creature.tags', 'tags');
    ...
    const [data, total] = await queryBuilder
      .orderBy('creature.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
    ```
  - Sugestão: separar em duas consultas para manter "uma única query por
    página" sem reintroduzir N+1: (1) buscar apenas os `id` das criaturas
    aplicando os filtros existentes + `orderBy`/`skip`/`take` **sem** o join
    de `tags` (o join de `category` pode ficar, pois não multiplica linhas,
    ou também ser removido se usado apenas para filtro); (2) buscar as
    entidades completas via `this.creaturesRepository.find({ where: { id:
    In(ids) }, relations: { category: true, tags: true }, order: { name:
    'ASC' } })`, preservando a ordem dos `ids` obtidos no passo 1 (o `find`
    com `In` não garante ordem). Alternativa: usar `getMany()` normal (sem
    `getCount` acoplado) só depois de já ter a lista de ids paginada.

- **`app-api/src/modules/creatures/creatures.service.ts:58-64` (`findTagsByIds`)** —
  A validação `tags.length !== tagIds.length` não lida com ids duplicados em
  `dto.tagIds`. Se o cliente enviar `tagIds` com um id repetido (ex.:
  `['a', 'a']`), a consulta `findBy({ id: In(tagIds) })` retorna apenas 1
  registro (já que `IN` não duplica linhas), mas `tagIds.length` é 2 — o que
  dispara `NotFoundException('Uma ou mais tags não foram encontradas.')`
  mesmo que a tag exista. É um caso legítimo (nada no DTO impede duplicatas
  hoje).
  - Trecho:
    ```ts
    private async findTagsByIds(tagIds: string[]): Promise<Tag[]> {
      const tags = await this.tagsRepository.findBy({ id: In(tagIds) });
      if (tags.length !== tagIds.length) {
        throw new NotFoundException('Uma ou mais tags não foram encontradas.');
      }
      return tags;
    }
    ```
  - Sugestão: deduplicar antes de comparar, ex. `const uniqueIds = [...new
    Set(tagIds)]; ... if (tags.length !== uniqueIds.length)`, ou adicionar
    `@ArrayUnique()` (class-validator) em `CreateCreatureDto.tagIds` para
    rejeitar duplicatas já na validação de entrada, com mensagem pt-BR (ex.:
    `{ message: 'A lista de tags não pode conter ids duplicados.' }`).

### Pontos conferidos e aprovados

- Consistência `Creature.tags` (entidade) ↔ migration
  `CreateCreatureTagsTable` ↔ `@JoinTable`: nomes de tabela (`creature_tags`)
  e colunas (`creature_id`, `tag_id`) idênticos; PK composta
  `PK_creature_tags` sem colunas de `BaseEntity` (correto para tabela de
  junção pura); índices individuais `IDX_creature_tags_creature_id`/
  `IDX_creature_tags_tag_id`; FKs com `ON DELETE CASCADE` em ambas as pontas,
  conforme decisão registrada na seção "Contexto"; `down()` reverte na ordem
  inversa correta (drop das duas FKs, depois dos dois índices, depois da
  tabela).
- A migration foi criada como arquivo
  (`app-api/src/database/migrations/1784305380000-CreateCreatureTagsTable.ts`)
  com timestamp posterior à mais recente existente e nome/classe consistentes
  com o padrão do projeto; nada nos arquivos revisados indica execução
  automática de `npm run migration:run` — o texto da task registra
  explicitamente que ela está "aguardando confirmação explícita do usuário".
- `tagIds` inexistente(s) resulta em `NotFoundException` pt-BR
  (`'Uma ou mais tags não foram encontradas.'`) tanto em `create` quanto em
  `update`, lançada antes de qualquer `save()` (mutações em memória no objeto
  `creature` só são persistidas no único `.save()` ao final do método, então
  uma falha em `findTagsByIds` não deixa persistência parcial).
- Semântica de `update` confere com o documentado: `tagIds` ausente
  (`undefined`) não toca no campo `tags` da criatura; `tagIds: []` resulta em
  `creature.tags = []` (remove todas as associações); `tagIds` com valores
  substitui integralmente a lista (nunca é incremental).
- `findById` usa `relations: { category: true, tags: true }` (uma única
  query, via `findOne`) — correto e sem o problema de paginação apontado
  acima, já que não há `skip`/`take` envolvidos numa busca por id único.
- Nenhuma alteração foi feita em `Tag`
  (`app-api/src/modules/tags/entities/tag.entity.ts`),
  `TagsController`/`TagsService`/DTOs de `tags` — `TagResponseDto` é apenas
  importado e reutilizado em `CreatureResponseDto`/
  `CreatureListItemResponseDto`, sem alteração de conteúdo, sem vazar campos
  sensíveis (a entidade `Tag` não possui campos `select: false`).
- Swagger coerente: `CreateCreatureDto.tagIds` documentado como
  `@ApiPropertyOptional` (`type: [String]`, `format: 'uuid'`); `tags` em
  `CreatureResponseDto`/`CreatureListItemResponseDto` documentado como
  `@ApiProperty` (sempre presente na resposta, mesmo que array vazio, o que
  bate com `(creature.tags ?? []).map(...)` em ambos os `fromEntity`);
  `@ApiNotFoundResponse` de `create`/`update` em `CreaturesController`
  atualizados para mencionar tags não encontradas.
- Aderência ao restante do `CLAUDE.md`: mensagens de erro em pt-BR;
  `autoLoadEntities` dispensa registro manual da relação; `CreaturesModule`
  importa `Tag` via `TypeOrmModule.forFeature` (sem acoplar a
  `TagsModule`, seguindo o precedente de `SearchModule`); `synchronize`
  permanece `false` (alteração de schema feita via migration).

### 3. api-dev-codereviewer

- Revisar tudo acima, com atenção especial a:
  - Consistência entre `Creature.tags` (entidade), a migration
    `CreateCreatureTagsTable` (colunas, PK composta, FKs, índices, `ON
    DELETE CASCADE` nas duas FKs) e o `@JoinTable` (nomes de tabela/colunas
    idênticos: `creature_tags`, `creature_id`, `tag_id`).
  - Confirmar que a migration não foi executada automaticamente
    (`npm run migration:run`) sem confirmação explícita do usuário.
  - Confirmar que `tagIds` inexistente(s) resulta em `NotFoundException`
    pt-BR (`'Uma ou mais tags não foram encontradas.'`) tanto em `create`
    quanto em `update`, e que a mensagem é lançada antes de qualquer
    persistência parcial.
  - Confirmar a semântica de `update` documentada na etapa 1: `tagIds`
    ausente não altera as tags atuais; `tagIds: []` remove todas as
    associações; `tagIds` com valores substitui integralmente a lista atual
    (não é incremental).
  - Confirmar que `findAllPaginated` e `findById` usam `leftJoinAndSelect`/
    `relations` para carregar `tags` sem N+1 (uma única query, sem lazy
    loading por item da lista).
  - Confirmar que nenhuma alteração foi feita em `Tag`/`TagsController`/
    `TagsService`/DTOs de `tags` além do reaproveitamento (import) de
    `TagResponseDto`.
  - Confirmar Swagger completo e coerente com o comportamento real
    (`tagIds` opcional na request, `tags` sempre presente — mesmo que array
    vazio — na response).
  - Confirmar aderência ao restante do `CLAUDE.md` (mensagens de erro em
    pt-BR, `autoLoadEntities` sem necessidade de registro manual da relação,
    `synchronize` permanecendo `false`).
