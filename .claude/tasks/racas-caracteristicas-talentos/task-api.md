# Task API: Remoção de "Características Físicas" e novos relacionamentos de raças com características e talentos

## Contexto
Não existe `.claude/tasks/racas-caracteristicas-talentos/spec.md`. As decisões abaixo já
estão fechadas pelo solicitante (ver mensagem original da demanda) e não devem ser
reabertas. Esta tarefa altera exclusivamente o módulo `app-api/src/modules/races/` e cria
uma nova migration. **Nenhuma alteração deve ser feita em `app-api/src/modules/creatures/`**,
mesmo que essa entidade também tenha um campo `physicalCharacteristics` — esse campo
pertence a `Creature` e está fora de escopo.

Módulos de referência já existentes e usados como padrão:
- `app-api/src/modules/characteristics/` (entidade `Characteristic`, tabela `characteristics`,
  `CharacteristicListItemResponseDto` com `id`, `name`, `level`, `tags`).
- `app-api/src/modules/talents/` (entidade `Talent`, tabela `talents`,
  `TalentListItemResponseDto` com `id`, `name`, `level`, `tags`).
- Relação `tags` da própria `Race` (`race_tags`) como modelo exato para as novas
  join tables `race_characteristics` e `race_talents` (mesmo estilo de `@ManyToMany` +
  `@JoinTable` explícito, sem usar o mecanismo de `entity_links`).

## Etapas

### 1. api-dev

#### Entidade
Arquivo: `app-api/src/modules/races/entities/race.entity.ts`

- Remover completamente a coluna `physicalCharacteristics` (`@Column({ type: 'text', nullable: true, name: 'physical_characteristics' })`).
- Adicionar dois novos relacionamentos `ManyToMany`, no mesmo estilo da relação `tags`
  já existente na entidade:
  - `characteristics!: Characteristic[]`
    ```ts
    @ApiProperty({ type: () => [Characteristic], description: 'Características associadas à raça' })
    @ManyToMany(() => Characteristic)
    @JoinTable({
      name: 'race_characteristics',
      joinColumn: { name: 'race_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'characteristic_id', referencedColumnName: 'id' },
    })
    characteristics!: Characteristic[];
    ```
  - `talents!: Talent[]`
    ```ts
    @ApiProperty({ type: () => [Talent], description: 'Talentos associados à raça' })
    @ManyToMany(() => Talent)
    @JoinTable({
      name: 'race_talents',
      joinColumn: { name: 'race_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'talent_id', referencedColumnName: 'id' },
    })
    talents!: Talent[];
    ```
  - Importar `Characteristic` de `../../characteristics/entities/characteristic.entity`
    e `Talent` de `../../talents/entities/talent.entity`.
- `autoLoadEntities: true` já está configurado — não é necessário registrar as entidades
  manualmente em `app.module.ts`.

Arquivo: `app-api/src/modules/races/races.module.ts`
- Adicionar `Characteristic` e `Talent` ao `TypeOrmModule.forFeature([...])` (necessário
  para injetar seus repositórios em `RacesService`, do mesmo jeito que `Tag` já está
  incluído).

#### Migration
- Necessária: sim.
- Novo arquivo em `app-api/src/database/migrations/`, com timestamp posterior ao mais
  recente do repositório (`1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`),
  por exemplo `1784306110000-AddRaceCharacteristicsAndTalentsRelations.ts`, seguindo o
  padrão de `1784305450000-CreateRaceTagsTable.ts`:
  - `up()`:
    1. Criar tabela `race_characteristics` (`race_id` uuid NOT NULL, `characteristic_id`
       uuid NOT NULL, PK composta `PK_race_characteristics` em `(race_id, characteristic_id)`),
       índices `IDX_race_characteristics_race_id` e `IDX_race_characteristics_characteristic_id`,
       FKs `FK_race_characteristics_race_id` → `races(id)` e
       `FK_race_characteristics_characteristic_id` → `characteristics(id)`, ambas
       `ON DELETE CASCADE ON UPDATE NO ACTION`.
    2. Criar tabela `race_talents` (`race_id` uuid NOT NULL, `talent_id` uuid NOT NULL,
       PK composta `PK_race_talents` em `(race_id, talent_id)`), índices
       `IDX_race_talents_race_id` e `IDX_race_talents_talent_id`, FKs
       `FK_race_talents_race_id` → `races(id)` e `FK_race_talents_talent_id` →
       `talents(id)`, ambas `ON DELETE CASCADE ON UPDATE NO ACTION`.
    3. Remover a coluna `physical_characteristics` da tabela `races`
       (`ALTER TABLE "races" DROP COLUMN "physical_characteristics"`) — **apenas de
       `races`, jamais de `creatures`**.
  - `down()` (ordem inversa e completa):
    1. Recriar a coluna `physical_characteristics` em `races`
       (`ALTER TABLE "races" ADD COLUMN "physical_characteristics" text`, nullable).
    2. Derrubar constraints/índices/tabela `race_talents` (FKs, índices, `DROP TABLE`).
    3. Derrubar constraints/índices/tabela `race_characteristics` (FKs, índices,
       `DROP TABLE`).

#### Controller
- Endpoints existentes não mudam de rota: `POST /races`, `GET /races`, `GET /races/categories`,
  `GET /races/:id`, `PUT /races/:id`, `DELETE /races/:id` (`app-api/src/modules/races/races.controller.ts`).
  Nenhum endpoint novo é necessário — apenas os DTOs de entrada/saída mudam de forma
  (via `CreateRaceDto`/`UpdateRaceDto`/`RaceResponseDto`).
- DTOs afetados:
  - `app-api/src/modules/races/dto/create-race.dto.ts`: remover a propriedade
    `physicalCharacteristics` (`@ApiPropertyOptional` + `@IsOptional` + `@IsString`);
    adicionar `characteristicIds?: string[]` e `talentIds?: string[]`, cada um com
    `@ApiPropertyOptional({ type: [String], format: 'uuid', ... })`, `@IsOptional()`,
    `@IsArray()`, `@IsUUID('4', { each: true })`, no mesmo estilo do já existente `tagIds`.
  - `app-api/src/modules/races/dto/update-race.dto.ts`: continua `PartialType(CreateRaceDto)`,
    não precisa de alteração direta — herda os novos campos e perde `physicalCharacteristics`
    automaticamente.
  - `app-api/src/modules/races/dto/race-response.dto.ts`: remover a propriedade
    `physicalCharacteristics` (e seu preenchimento em `fromEntity`); adicionar
    `characteristics: CharacteristicListItemResponseDto[]` e
    `talents: TalentListItemResponseDto[]`, reutilizando
    `app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`
    e `app-api/src/modules/talents/dto/talent-list-item-response.dto.ts` (import direto
    dessas classes, sem duplicar shape). Preencher em `fromEntity` mapeando
    `race.characteristics`/`race.talents` com `.fromEntity(...)`, com fallback para
    array vazio (`?? []`), no mesmo padrão usado para `tags`.
  - `app-api/src/modules/races/dto/race-list-item-response.dto.ts`: **não** expõe
    `physicalCharacteristics` (já confirmado por leitura do arquivo) — nenhuma remoção
    necessária aqui. **Não** adicionar `characteristics`/`talents` a este DTO (não foi
    pedido e evita custo de N+1 na listagem paginada).
  - `app-api/src/modules/races/dto/paginated-races-response.dto.ts` e
    `app-api/src/modules/races/dto/find-races-query.dto.ts`: nenhuma alteração esperada
    (confirmar durante a implementação que não referenciam `physicalCharacteristics`).
- Serviço (`app-api/src/modules/races/races.service.ts`):
  - Injetar `Repository<Characteristic>` e `Repository<Talent>` no construtor (via
    `@InjectRepository`), analogamente ao já existente `Repository<Tag>`.
  - Criar métodos privados `findCharacteristicsByIds(ids: string[])` e
    `findTalentsByIds(ids: string[])`, espelhando exatamente `findTagsByIds`: deduplicar
    ids, buscar por `In(uniqueIds)`, e se `length` não bater, lançar
    `NotFoundException` em pt-BR listando os ids não encontrados (ex.:
    `` `As seguintes características não foram encontradas: ${idsNaoEncontrados.join(', ')}.` ``
    e o equivalente para talentos). Isso é uma melhoria em relação ao `findTagsByIds`
    atual (que não lista os ids não encontrados) — seguir a instrução da demanda que
    pede explicitamente a listagem dos ids ausentes na mensagem de erro para os novos
    relacionamentos.
  - `create()`: resolver `dto.characteristicIds`/`dto.talentIds` (vazio se não enviados)
    e incluir `characteristics`/`talents` no `this.racesRepository.create({...})`;
    remover a atribuição de `physicalCharacteristics: dto.physicalCharacteristics ?? null`.
  - `update()`: remover o bloco `if (dto.physicalCharacteristics !== undefined) { ... }`;
    adicionar blocos análogos ao de `tagIds` para `characteristicIds` e `talentIds`
    (`if (dto.characteristicIds !== undefined) { race.characteristics = ... }` e
    equivalente para talentos).
  - `findById()`: incluir `characteristics: true` e `talents: true` em `relations` (com
    suas `tags` carregadas automaticamente via a própria relação `tags` de
    `Characteristic`/`Talent` — confirmar que TypeORM resolve `relations: { characteristics: { tags: true }, talents: { tags: true } }` para trazer as tags aninhadas; caso não traga por padrão, usar essa forma aninhada explicitamente).
  - `findAllPaginated()`: **não** adicionar `characteristics`/`talents` às `relations`
    usadas na busca detalhada pós-paginação (mantém apenas `category: true, tags: true`),
    para evitar custo desnecessário de joins em uma listagem que não expõe esses dados
    (`RaceListItemResponseDto` não os inclui).
- Acesso Google: `read-only` (padrão, já aplicado no controller via
  `@GoogleAccess('read-only')` — nenhuma mudança necessária).

Status: concluído
Entidade: app-api/src/modules/races/entities/race.entity.ts
Migration: app-api/src/database/migrations/1784306110000-AddRaceCharacteristicsAndTalentsRelations.ts
Rotas: POST /races, GET /races, GET /races/categories, GET /races/:id, PUT /races/:id, DELETE /races/:id (rotas inalteradas; apenas DTOs de entrada/saída mudaram de forma)
Arquivos: app-api/src/modules/races/races.module.ts, app-api/src/modules/races/races.service.ts, app-api/src/modules/races/dto/create-race.dto.ts, app-api/src/modules/races/dto/race-response.dto.ts

### 2. api-dev-doc
- Depende da etapa 1.
- Atualizar Swagger: `@ApiProperty`/`@ApiPropertyOptional` dos novos campos
  (`characteristicIds`, `talentIds` em create/update; `characteristics`, `talents` em
  `RaceResponseDto`) devem ter descrições e exemplos claros em pt-BR, incluindo menção a
  que `characteristics`/`talents` retornam id/name/level/tags para suportar filtro por
  level e exibição de tags no frontend.
- Atualizar as descrições de `@ApiNotFoundResponse` nos endpoints `POST /races` e
  `PUT /races/:id` em `races.controller.ts` para mencionar também "uma ou mais
  características não encontradas" e "um ou mais talentos não encontrados", já que os
  novos ids inválidos passam a gerar 404 nesses endpoints.
- Revisar se `physicalCharacteristics` não ficou mencionado em nenhuma descrição
  remanescente de Swagger dentro de `races.controller.ts` ou dos DTOs de `races`.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - Confirmar que nenhuma referência a `physicalCharacteristics`/`physical_characteristics`
    restou em `app-api/src/modules/races/**`.
  - Confirmar que `app-api/src/modules/creatures/**` permanece intocado.
  - Validar a migration nova: nomes de constraints/índices únicos no schema, `down()`
    espelhando corretamente `up()` em ordem inversa, e que a coluna
    `physical_characteristics` recriada no `down()` seja `text nullable` (mesmo tipo
    original).
  - Validar que `findAllPaginated` não sofreu regressão de performance (não carrega
    `characteristics`/`talents` desnecessariamente).
  - Validar que as mensagens de erro de ids não encontrados estão em pt-BR e listam os
    ids ausentes, conforme pedido.

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/races/entities/race.entity.ts`,
`app-api/src/modules/races/races.module.ts`,
`app-api/src/modules/races/races.service.ts`,
`app-api/src/modules/races/races.controller.ts`,
`app-api/src/modules/races/dto/create-race.dto.ts`,
`app-api/src/modules/races/dto/update-race.dto.ts`,
`app-api/src/modules/races/dto/race-response.dto.ts`,
`app-api/src/modules/races/dto/race-list-item-response.dto.ts`,
`app-api/src/modules/races/dto/paginated-races-response.dto.ts`,
`app-api/src/modules/races/dto/find-races-query.dto.ts`,
`app-api/src/database/migrations/1784306110000-AddRaceCharacteristicsAndTalentsRelations.ts`.

Pontos conferidos:
- Nenhuma referência remanescente a `physicalCharacteristics`/`physical_characteristics`
  em `app-api/src/modules/races/**` (entidade, DTOs, service e controller). A busca em
  todo `app-api/src` só retorna ocorrências esperadas em `app-api/src/modules/creatures/**`
  e no `CREATE TABLE "races"` original (`1784305440000-CreateRacesTable.ts`).
- `app-api/src/modules/creatures/**` permanece intocado — `physicalCharacteristics`
  continua presente na entidade, DTOs e service de `creatures`, fora do escopo desta task.
- Migration nova (`1784306110000-AddRaceCharacteristicsAndTalentsRelations.ts`): nomes de
  tabelas/constraints/índices (`race_characteristics`, `race_talents`,
  `PK_race_characteristics`, `PK_race_talents`, `IDX_race_characteristics_*`,
  `IDX_race_talents_*`, `FK_race_characteristics_*`, `FK_race_talents_*`) seguem
  exatamente o padrão de `1784305450000-CreateRaceTagsTable.ts` e são únicos no schema
  (sem colisão com migrations existentes). `down()` espelha o `up()` em ordem inversa
  completa (recria `physical_characteristics`, depois derruba `race_talents` e por
  último `race_characteristics`, cada um removendo FKs, índices e tabela antes de seguir
  adiante). A coluna `physical_characteristics` recriada no `down()` é
  `text` (nullable, sem `NOT NULL`), consistente com o tipo original definido em
  `1784305440000-CreateRacesTable.ts` (`"physical_characteristics" text`, sem constraint
  de obrigatoriedade).
- `findAllPaginated` em `races.service.ts` mantém `relations: { category: true, tags: true }`
  na busca detalhada pós-paginação, sem incluir `characteristics`/`talents` — consistente
  com `RaceListItemResponseDto`, que não expõe esses campos. Nenhuma regressão de
  performance identificada.
- `findById` inclui `relations: { category: true, tags: true, characteristics: { tags: true }, talents: { tags: true } }`,
  garantindo que as tags de cada característica/talento venham carregadas para popular
  `CharacteristicListItemResponseDto`/`TalentListItemResponseDto` em `RaceResponseDto.fromEntity`.
- `findCharacteristicsByIds`/`findTalentsByIds` deduplicam ids, buscam via `In(uniqueIds)`
  e, quando faltam registros, lançam `NotFoundException` em pt-BR listando os ids não
  encontrados (`As seguintes características não foram encontradas: ...` /
  `Os seguintes talentos não foram encontrados: ...`), conforme pedido — indo além do
  `findTagsByIds` atual (mantido como estava, fora do escopo desta task).
- `create()`/`update()` em `races.service.ts` resolvem `characteristicIds`/`talentIds`
  de forma análoga a `tagIds`, sem atribuição residual de `physicalCharacteristics`.
- DTOs de entrada (`CreateRaceDto`) usam `@IsOptional()` + `@IsArray()` +
  `@IsUUID('4', { each: true })` para `characteristicIds`/`talentIds`, no mesmo estilo de
  `tagIds`. `UpdateRaceDto` continua `PartialType(CreateRaceDto)` sem alterações diretas.
- `RaceResponseDto` expõe `characteristics`/`talents` via `CharacteristicListItemResponseDto.fromEntity`/
  `TalentListItemResponseDto.fromEntity` (id, name, level, tags), com fallback `?? []`,
  sem vazar campos internos. `RaceListItemResponseDto` não inclui esses campos, como
  esperado.
- `races.module.ts` registra `Characteristic` e `Talent` em `TypeOrmModule.forFeature`,
  permitindo a injeção dos repositórios usados em `races.service.ts`.
- `races.controller.ts` mantém `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` em todo o controller (CRUD completo com acesso
  read-only ao Google, conforme já definido e sem mudança pedida nesta task).
  `@ApiNotFoundResponse` de `POST /races` e `PUT /races/:id` já mencionam "uma ou mais
  características não encontradas" e "um ou mais talentos não encontrados".
- Nenhuma referência a `physicalCharacteristics` remanescente em descrições Swagger de
  `races.controller.ts` ou dos DTOs de `races`.