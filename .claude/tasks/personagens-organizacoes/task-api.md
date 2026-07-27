# Task API: Personagens e Organizações

## Contexto
Ver .claude/tasks/personagens-organizacoes/spec.md

Módulos de referência a seguir como padrão: `app-api/src/modules/divinities/` (ManyToMany de tags com `JoinTable` dedicada, `ManyToOne` opcional com `onDelete: 'SET NULL'` a modelar de forma análoga ao `onDelete: 'RESTRICT'` de `Divinity.category`) e `app-api/src/modules/locations/` (sub-entidade filha gerenciada junto do pai — `LocationSection` — e relação derivada/somente-leitura no DTO de resposta — `Location.pointsOfInterestOf` / `LocationShallowResponseDto`), ambos citados no pedido do usuário.

Status geral: Pendente

## Etapas

### 1. api-dev
Status: concluído

#### Entidade

**`Character` (`characters`)**
- Campos:
  - `name` (string, obrigatório) — **sem** índice único (decisão explícita do spec: homônimos permitidos).
  - `referenceImage` (varchar, nullable).
  - `description` (text, nullable, HTML/rich text).
  - `isDead` (boolean, `default: false`, obrigatório).
- Relacionamentos:
  - `race`: `ManyToOne(() => Race)`, `nullable: true`, `onDelete: 'SET NULL'`, `@JoinColumn({ name: 'race_id' })` — segue o padrão de FK opcional do projeto (contraste com `Divinity.category`/`Race.category`, que são `RESTRICT` por serem obrigatórios; aqui é `SET NULL` por ser opcional, conforme decisão do spec).
  - `tags`: `ManyToMany(() => Tag)` com `@JoinTable({ name: 'character_tags', joinColumn: { name: 'character_id' }, inverseJoinColumn: { name: 'tag_id' } })`, no padrão de `divinity_tags`/`race_tags`.
  - `kinships`: `OneToMany(() => CharacterKinship, (k) => k.character, { cascade: true, orphanedRowAction: 'delete' })` — mesmo padrão de `Location.sections`, permitindo que a lista seja substituída inteira a cada `update` (remover órfãos automaticamente).
  - **Não** possui campo próprio de `organizations` na entidade — o quadro de organizações no GET é calculado no service (ver "Controller" abaixo), não é uma coluna/relação mapeada no `Character`.

**`Organization` (`organizations`)**
- Campos:
  - `name` (string, obrigatório) — **com** `@Index({ unique: true })`, no padrão de `Divinity.name`/`Race.name`/`Location.name`.
  - `referenceImage` (varchar, nullable).
  - `description` (text, nullable, HTML/rich text).
- Relacionamentos:
  - `tags`: `ManyToMany(() => Tag)` com `@JoinTable({ name: 'organization_tags', ... })`, mesmo padrão.
  - `members`: `OneToMany(() => OrganizationMember, (m) => m.organization, { cascade: true, orphanedRowAction: 'delete' })`.

**`CharacterKinship` (`character_kinships`)** — entidade de junção própria (não `ManyToMany` simples)
- Campos: `kinship` (varchar ou text, obrigatório, texto livre — grau/tipo de parentesco).
- Relacionamentos:
  - `character`: `ManyToOne(() => Character, (c) => c.kinships, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'character_id' })` — o "dono" do vínculo.
  - `relative`: `ManyToOne(() => Character, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'relative_id' })` — o personagem referenciado como parente. **Sem** relação inversa mapeada em `Character` (o vínculo é unidirecional: não há `kinshipsOf`/equivalente a `pointsOfInterestOf` aqui, pois o spec não pede exibir "quem me referenciou como parente").
  - Constraint de unicidade composta em `(character_id, relative_id)` — impede duplicidade do mesmo par, conforme decisão do spec. Modelar como `@Unique(['character', 'relative'])` na entidade (ou índice único composto equivalente) e refletir na migration.
  - Observação de cascata: como ambas as FKs (`character_id` e `relative_id`) apontam para `characters` com `ON DELETE CASCADE`, excluir um personagem remove automaticamente tanto os parentescos em que ele é o "dono" quanto aqueles em que ele é o "parente" referenciado por terceiros — atende à regra 3 do spec sem lógica adicional no service.

**`OrganizationMember` (`organization_members`)** — entidade de junção própria (não `ManyToMany` simples)
- Campos: `role` (varchar ou text, obrigatório, texto livre — função exercida).
- Relacionamentos:
  - `organization`: `ManyToOne(() => Organization, (o) => o.members, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'organization_id' })`.
  - `character`: `ManyToOne(() => Character, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'character_id' })`.
  - Constraint de unicidade composta em `(organization_id, character_id)` — impede duplicidade do mesmo par.

**Ponto de atenção (não é lacuna de arquitetura, é regra de negócio não coberta no spec):** o spec não esclarece se um personagem pode ser cadastrado como parente de si mesmo (`relativeId === id do próprio personagem` no array `kinships`). Sinalizar esse ponto para confirmação/decisão explícita antes ou durante a implementação, em vez de assumir bloqueio ou permissão por conta própria.

#### Migration
- Necessária: **sim**. `synchronize` é `false`; toda alteração de schema requer migration em `src/database/migrations/` (gerada com `npm run migration:generate -- src/database/migrations/<Name>`, seguindo o timestamp sequencial já usado — último existente é `1784305560000-AddDivinePropertiesToDivinitiesTable`).
- Tabelas/alterações a cobrir (podem ser uma migration por tabela, seguindo o padrão granular já usado em `CreateDivinitiesTable` / `CreateDivinityTagsTable` / `CreateDivinityCategoriesTable`):
  1. `CREATE TABLE characters` — colunas de `BaseEntity` (`id` uuid pk default `gen_random_uuid()`, `created_at`, `updated_at`) + `name` (varchar, not null, **sem** índice único), `reference_image` (varchar, nullable), `description` (text, nullable), `is_dead` (boolean, not null, default `false`), `race_id` (uuid, nullable) com índice e FK para `races(id)` `ON DELETE SET NULL`.
  2. `CREATE TABLE character_tags` — tabela de junção `(character_id, tag_id)`, PK composta, índices em cada FK, FKs `ON DELETE CASCADE` para `characters` e `tags`, no padrão de `divinity_tags`/`race_tags`.
  3. `CREATE TABLE organizations` — colunas de `BaseEntity` + `name` (varchar, not null, **índice único**), `reference_image` (varchar, nullable), `description` (text, nullable).
  4. `CREATE TABLE organization_tags` — tabela de junção `(organization_id, tag_id)`, mesmo padrão de `character_tags`.
  5. `CREATE TABLE character_kinships` — colunas de `BaseEntity` + `kinship` (varchar/text, not null), `character_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`), `relative_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`); índice único composto em `(character_id, relative_id)`; índices simples em cada FK (padrão de `location_sections`/`location_points_of_interest`).
  6. `CREATE TABLE organization_members` — colunas de `BaseEntity` + `role` (varchar/text, not null), `organization_id` (uuid, not null, FK `organizations(id)` `ON DELETE CASCADE`), `character_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`); índice único composto em `(organization_id, character_id)`; índices simples em cada FK.

#### Controller

**`CharactersController` (`characters.controller.ts`)**
- Endpoints:
  - `POST /characters` — cria personagem (com tags e lista de parentescos em memória, persistidos junto, no padrão de `sections`/`pointsOfInterest` em `CreateLocationDto`/`LocationsService.create`).
  - `GET /characters` — lista paginada com filtro por `name` (ILIKE), no padrão de `FindDivinitiesQueryDto`/`findAllPaginated`.
  - `GET /characters/:id` — retorna o personagem completo, incluindo `kinships` (com o personagem parente "raso") e o quadro derivado `organizations` (calculado no service a partir de `OrganizationMember` onde `character = id`, **não** persistido em `Character`).
  - `PUT /characters/:id` — atualiza campos simples, tags (substituição total, padrão `dto.tagIds !== undefined`), raça e a lista de `kinships` (substituição total da lista, aproveitando `cascade`/`orphanedRowAction: 'delete'` do `OneToMany`, no padrão de `LocationsService.update` para `sections`). Deve validar duplicidade de par `(character, relativeId)` dentro do array recebido antes de persistir, retornando erro de validação em pt-BR (não somente confiar na constraint de banco).
  - `DELETE /characters/:id` — remove o personagem; cascatas de `character_kinships` (como dono e como parente) e `organization_members` ocorrem automaticamente via `ON DELETE CASCADE` das FKs.
- DTOs:
  - `CreateCharacterDto`: `name` (string, obrigatório), `referenceImage` (URL, opcional), `description` (string, opcional), `isDead` (boolean, opcional, default `false`), `raceId` (uuid, opcional), `tagIds` (uuid[], opcional), `kinships` (array opcional de `CharacterKinshipInputDto`).
  - `CharacterKinshipInputDto`: `relativeId` (uuid, obrigatório), `kinship` (string, obrigatório) — no padrão de `LocationSectionInputDto`.
  - `UpdateCharacterDto`: `PartialType(CreateCharacterDto)`.
  - `FindCharactersQueryDto`: `name` (string, opcional), `page`, `perPage` (padrão de `FindDivinitiesQueryDto`).
  - `CharacterResponseDto`: `id`, `name`, `referenceImage`, `description`, `isDead`, `race` (`RaceResponseDto | null`, reaproveitando o DTO já existente em `races/dto/race-response.dto.ts`, no padrão de `Divinity.category` embutindo `DivinityCategoryResponseDto`), `tags` (`TagResponseDto[]`), `kinships` (`CharacterKinshipResponseDto[]`), `organizations` (`OrganizationShallowResponseDto[]`, campo derivado/somente-leitura, documentado como tal — mesmo padrão de `pointsOfInterestOf` em `LocationResponseDto`), `createdAt`, `updatedAt`.
  - `CharacterKinshipResponseDto`: `id`, `kinship`, `relative` (`CharacterShallowResponseDto`).
  - `CharacterShallowResponseDto`: `id`, `name`, `referenceImage`, `isDead` — reaproveitado para representar o personagem "parente" em `kinships` e o personagem em `members` de organização (padrão de `LocationShallowResponseDto`).
  - `CharacterListItemResponseDto`: `id`, `referenceImage`, `name`, `isDead`, `race` (`RaceResponseDto | null`), `tags`.
  - `PaginatedCharactersResponseDto`: `data`, `total`, `page`, `perPage`, `totalPages` (padrão `PaginatedDivinitiesResponseDto`).
  - `OrganizationShallowResponseDto`: `id`, `name`, `referenceImage` — usado no quadro derivado de organizações do personagem.

**`OrganizationsController` (`organizations.controller.ts`)**
- Endpoints:
  - `POST /organizations` — cria organização (com tags e lista de `members` em memória, persistidos junto).
  - `GET /organizations` — lista paginada com filtro por `name` (ILIKE).
  - `GET /organizations/:id` — retorna a organização completa, incluindo `members` (com o personagem "raso").
  - `PUT /organizations/:id` — atualiza campos simples, tags e a lista de `members` (substituição total, mesmo padrão de `kinships`); deve validar duplicidade de par `(organization, characterId)` no array recebido antes de persistir, retornando erro em pt-BR.
  - `DELETE /organizations/:id` — remove a organização; cascata de `organization_members` automática via FK.
- DTOs:
  - `CreateOrganizationDto`: `name` (string, obrigatório), `referenceImage` (URL, opcional), `description` (string, opcional), `tagIds` (uuid[], opcional), `members` (array opcional de `OrganizationMemberInputDto`).
  - `OrganizationMemberInputDto`: `characterId` (uuid, obrigatório), `role` (string, obrigatório).
  - `UpdateOrganizationDto`: `PartialType(CreateOrganizationDto)`.
  - `FindOrganizationsQueryDto`: `name` (string, opcional), `page`, `perPage`.
  - `OrganizationResponseDto`: `id`, `name`, `referenceImage`, `description`, `tags` (`TagResponseDto[]`), `members` (`OrganizationMemberResponseDto[]`), `createdAt`, `updatedAt`.
  - `OrganizationMemberResponseDto`: `id`, `role`, `character` (`CharacterShallowResponseDto`).
  - `OrganizationListItemResponseDto`: `id`, `referenceImage`, `name`, `tags`.
  - `PaginatedOrganizationsResponseDto`: `data`, `total`, `page`, `perPage`, `totalPages`.

**Validação de negócio a implementar no service (ambos os módulos), replicando as regras já confirmadas no spec:**
- Rejeitar (com mensagem pt-BR, ex. `ConflictException`/`BadRequestException`) qualquer array de `kinships`/`members` recebido no `create`/`update` que contenha o mesmo `relativeId`/`characterId` mais de uma vez.
- `findOne`/`findById` de `Character` deve montar o campo `organizations` fazendo uma consulta em `OrganizationMember` (via repositório injetado no `CharactersService`, ou método exposto pelo `OrganizationsService`) filtrando por `character.id`, e mapear para `OrganizationShallowResponseDto`.
- Módulos (`characters.module.ts`, `organizations.module.ts`): registrar via `TypeOrmModule.forFeature([...])` as entidades `Character`, `CharacterKinship`, `Organization`, `OrganizationMember`, `Tag`, `Race` conforme necessário em cada módulo (padrão de `DivinitiesModule`/`LocationsModule`); é necessário decidir se `CharactersModule` e `OrganizationsModule` importam um ao outro (ou compartilham repositórios) para viabilizar a consulta cruzada do quadro de organizações — usar `exports`/`imports` de módulo no mesmo padrão de `LocationsModule.exports`.

**Atualização do módulo de busca global (`search`), conforme escopo confirmado no spec:**
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`: adicionar `CHARACTER = 'character'` e `ORGANIZATION = 'organization'`.
- `app-api/src/modules/search/search.service.ts`: injetar `Repository<Character>` e `Repository<Organization>` e incluí-los no array `linkableEntities`, seguindo exatamente o mesmo padrão de busca por `entity.name ILIKE` já usado para as demais entidades (mesmo `MAX_RESULTS`).
- `app-api/src/modules/search/search.module.ts`: adicionar `Character` e `Organization` ao `TypeOrmModule.forFeature([...])`.

Status: concluído
Entidade:
- `app-api/src/modules/characters/entities/character.entity.ts`
- `app-api/src/modules/characters/entities/character-kinship.entity.ts`
- `app-api/src/modules/organizations/entities/organization.entity.ts`
- `app-api/src/modules/organizations/entities/organization-member.entity.ts`
Migration:
- `app-api/src/database/migrations/1784305570000-CreateCharactersTable.ts`
- `app-api/src/database/migrations/1784305580000-CreateCharacterTagsTable.ts`
- `app-api/src/database/migrations/1784305590000-CreateOrganizationsTable.ts`
- `app-api/src/database/migrations/1784305600000-CreateOrganizationTagsTable.ts`
- `app-api/src/database/migrations/1784305610000-CreateCharacterKinshipsTable.ts`
- `app-api/src/database/migrations/1784305620000-CreateOrganizationMembersTable.ts`
(migrations escritas, ainda não executadas contra o banco — pendente `npm run migration:run` mediante confirmação do usuário)
Rotas:
- POST /characters
- GET /characters
- GET /characters/:id
- PUT /characters/:id
- DELETE /characters/:id
- POST /organizations
- GET /organizations
- GET /organizations/:id
- PUT /organizations/:id
- DELETE /organizations/:id
Arquivos:
- `app-api/src/modules/characters/dto/create-character.dto.ts`
- `app-api/src/modules/characters/dto/update-character.dto.ts`
- `app-api/src/modules/characters/dto/character-kinship-input.dto.ts`
- `app-api/src/modules/characters/dto/find-characters-query.dto.ts`
- `app-api/src/modules/characters/dto/character-response.dto.ts`
- `app-api/src/modules/characters/dto/character-list-item-response.dto.ts`
- `app-api/src/modules/characters/dto/character-shallow-response.dto.ts`
- `app-api/src/modules/characters/dto/character-kinship-response.dto.ts`
- `app-api/src/modules/characters/dto/paginated-characters-response.dto.ts`
- `app-api/src/modules/characters/characters.service.ts`
- `app-api/src/modules/characters/characters.controller.ts`
- `app-api/src/modules/characters/characters.module.ts`
- `app-api/src/modules/organizations/dto/create-organization.dto.ts`
- `app-api/src/modules/organizations/dto/update-organization.dto.ts`
- `app-api/src/modules/organizations/dto/organization-member-input.dto.ts`
- `app-api/src/modules/organizations/dto/find-organizations-query.dto.ts`
- `app-api/src/modules/organizations/dto/organization-response.dto.ts`
- `app-api/src/modules/organizations/dto/organization-list-item-response.dto.ts`
- `app-api/src/modules/organizations/dto/organization-shallow-response.dto.ts`
- `app-api/src/modules/organizations/dto/organization-member-response.dto.ts`
- `app-api/src/modules/organizations/dto/paginated-organizations-response.dto.ts`
- `app-api/src/modules/organizations/organizations.service.ts`
- `app-api/src/modules/organizations/organizations.controller.ts`
- `app-api/src/modules/organizations/organizations.module.ts`
- `app-api/src/app.module.ts` (registro de `CharactersModule`/`OrganizationsModule`)
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` (CHARACTER, ORGANIZATION)
- `app-api/src/modules/search/search.service.ts` (repositórios/linkableEntities de Character e Organization)
- `app-api/src/modules/search/search.module.ts` (forFeature de Character e Organization)

Decisões e observações desta implementação:
- Auto-parentesco (`relativeId === id do próprio personagem`) bloqueado no `CharactersService` com `BadRequestException` em pt-BR (só se aplica em `update`, já que em `create` o personagem ainda não possui id para se autorreferenciar).
- Duplicidade de par validada no service tanto para `kinships` (por `relativeId`) quanto para `members` de organização (por `characterId`), antes de persistir, com `BadRequestException` em pt-BR.
- `CharactersModule` e `OrganizationsModule` não se importam mutuamente (evitando dependência circular de módulos Nest); cada um registra via `TypeOrmModule.forFeature` também a entidade da outra ponta que precisa consultar diretamente (`OrganizationMember` em `CharactersModule` para montar o quadro derivado de organizações; `Character` em `OrganizationsModule` para resolver `characterId` dos membros).
- `OrganizationShallowResponseDto` foi colocado em `organizations/dto` (por envolver a entidade `Organization`) e `CharacterShallowResponseDto` em `characters/dto` (por envolver a entidade `Character`), com import cruzado apenas de DTOs (sem ciclo, já que nenhum dos dois importa o outro de volta).

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger: `@ApiTags('characters')` e `@ApiTags('organizations')` nos respectivos controllers; `@ApiOperation` em cada endpoint (criar, listar paginado com filtro, buscar por id, atualizar, remover); `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse` com os DTOs de resposta corretos; `@ApiConflictResponse` para nome de organização duplicado e para duplicidade de par em `kinships`/`members`; `@ApiNotFoundResponse` para personagem/organização/raça/tag/personagem-relativo/personagem-membro não encontrados; `@ApiBadRequestResponse` para URL de imagem inválida, IDs em formato inválido e parâmetros de paginação/filtro inválidos. Garantir `@ApiProperty`/`@ApiPropertyOptional` com `description`/`example` em todos os campos novos dos DTOs (incluindo os campos derivados/somente-leitura `organizations` em `CharacterResponseDto`, documentando explicitamente que não são aceitos em `create`/`update`, no mesmo padrão da nota já existente em `pointsOfInterestOf`).

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a: cascata correta em ambas as pontas de `character_kinships` (dono e parente), unicidade composta em `character_kinships` e `organization_members`, `ON DELETE SET NULL` em `Character.race`, ausência de índice único em `Character.name` vs. presença em `Organization.name`, validação de duplicidade de par no payload (não só na constraint de banco), e atualização completa do módulo `search` (enum, service, module) nas três camadas.

## Revisão

Escopo revisado: as 4 entidades (`character.entity.ts`, `character-kinship.entity.ts`,
`organization.entity.ts`, `organization-member.entity.ts`), as 6 migrations
(`1784305570000` a `1784305620000`), os services/controllers/modules de `characters` e
`organizations`, todos os DTOs listados nas seções 1 e 2, e a atualização do módulo
`search` (`linkable-entity-type.enum.ts`, `search.service.ts`, `search.module.ts`).

Itens verificados e **aprovados** (sem problemas encontrados):
- Consistência migration ↔ entidade nas 6 migrations: nomes de coluna snake_case,
  tipos, nullability, PKs, índices e FKs (`ON DELETE SET NULL` em `characters.race_id`,
  `ON DELETE CASCADE` em ambas as FKs de `character_kinships` e `organization_members`,
  índice único composto em `(character_id, relative_id)` e em
  `(organization_id, character_id)`, índice único em `organizations.name` e sua
  ausência em `characters.name`) — tudo bate exatamente com as entidades e com o
  padrão já usado em `races`/`divinities`. Os métodos `down()` revertem corretamente
  os `up()` na ordem inversa (constraints → índices → tabela).
- Validação de duplicidade de par (`relativeId`/`characterId` repetido no mesmo
  payload) implementada no service (`assertNoDuplicateRelatives`/
  `assertNoDuplicateMembers`), não dependendo apenas da constraint única do banco.
- Bloqueio de auto-parentesco (`assertNoSelfKinship`) implementado no `update` do
  `CharactersService`, com justificativa registrada para não se aplicar no `create`.
- Rotas protegidas com `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` em ambos os
  controllers, no mesmo padrão dos demais módulos.
- Query builders de listagem (`characters.service.ts`/`organizations.service.ts`)
  usam parâmetros nomeados (`:name`) no `ILIKE`, sem concatenação de input do
  usuário — sem risco de SQL injection.
- Nenhum campo sensível vazado nos DTOs de resposta (`CharacterShallowResponseDto`,
  `OrganizationShallowResponseDto` etc. expõem apenas os campos previstos no spec).
- `search.service.ts`, `search.module.ts` e `linkable-entity-type.enum.ts` atualizados
  de forma completa e consistente nas três camadas, seguindo exatamente o mesmo
  padrão (`entity.name ILIKE`, mesmo `MAX_RESULTS`) já usado para as demais entidades.
- `app.module.ts` registra `CharactersModule`/`OrganizationsModule` corretamente.

Problemas encontrados:

- **[app-api/src/modules/characters/characters.service.ts:45-50, 62-68, 202-206, 237]**
  — Bug crítico (quebra em runtime): `findById`, `findAllPaginated` e `findRaceById`
  carregam a relação `race` do personagem sem carregar as relações aninhadas
  `race.category` e `race.tags`. Porém `CharacterResponseDto`/
  `CharacterListItemResponseDto` reaproveitam `RaceResponseDto.fromEntity(character.race)`
  (conforme decisão do spec), e `RaceResponseDto.fromEntity` acessa
  `race.category.id`/`race.category.name` via `RaceCategoryResponseDto.fromEntity(race.category)`
  **sem checagem de nulo** (`category` é `@ApiProperty` obrigatório, não `?? null`).
  Como `category` é uma relação `ManyToOne` não-eager em `Race` (`race.entity.ts`), ela
  só é populada quando explicitamente pedida via `relations: { category: true }` — o que
  não ocorre em nenhum dos pontos citados. Resultado: qualquer `POST /characters`,
  `PUT /characters/:id`, `GET /characters` ou `GET /characters/:id` envolvendo um
  personagem com `raceId` preenchido lança `TypeError: Cannot read properties of
  undefined (reading 'id')` (500), pois `character.race.category` estará `undefined`.
  - Trecho (`characters.service.ts`):
    ```ts
    findById(id: string): Promise<Character | null> {
      return this.charactersRepository.findOne({
        where: { id },
        relations: { race: true, tags: true, kinships: { relative: true } },
      });
    }
    ...
    private async findRaceById(id: string): Promise<Race> {
      const race = await this.racesRepository.findOneBy({ id });
      ...
    }
    ```
  - Sugestão: carregar as relações aninhadas de `race` em todos os pontos onde a
    entidade é lida para compor a resposta — `relations: { race: { category: true, tags: true }, tags: true, kinships: { relative: true } }`
    em `findById`, o mesmo em `findAllPaginated`, e trocar `findRaceById` para usar
    `this.racesRepository.findOne({ where: { id }, relations: { category: true, tags: true } })`
    em vez de `findOneBy`, no mesmo padrão já usado em `races.service.ts`
    (`relations: { category: true, tags: true }`).

- **[app-api/src/modules/characters/characters.controller.ts:46-49, 112-115]** e
  **[app-api/src/modules/organizations/organizations.controller.ts:46-49, 104-107]**
  — Documentação Swagger incoerente com o comportamento real: ambos os endpoints
  documentam a duplicidade de par em `kinships`/`members` sob `@ApiConflictResponse`
  (HTTP 409), mas o código de fato lança `BadRequestException` (HTTP 400) para esse
  caso — `assertNoDuplicateRelatives`/`assertNoSelfKinship` em
  `characters.service.ts` e `assertNoDuplicateMembers` em `organizations.service.ts`.
  Em `organizations.controller.ts` o `@ApiConflictResponse` mistura corretamente o
  caso de nome duplicado (esse sim é `ConflictException`, 409) com o caso de membro
  duplicado (na verdade 400), na mesma descrição.
  - Trecho (`characters.controller.ts`):
    ```ts
    @ApiConflictResponse({
      description:
        'Duplicidade de par em parentescos (mesmo relativeId mais de uma vez)',
    })
    ```
  - Sugestão: mover a descrição de duplicidade de par de `kinships`/`members` para o
    `@ApiBadRequestResponse` de cada endpoint (já existente), deixando o
    `@ApiConflictResponse` em `organizations.controller.ts` restrito ao caso de nome
    de organização já existente; ou, alternativamente, alterar
    `assertNoDuplicateRelatives`/`assertNoDuplicateMembers` para lançar
    `ConflictException` caso a intenção seja mesmo semântica de conflito (409) — em
    ambos os casos, service e documentação Swagger devem ficar coerentes entre si.

### Correção do achado 1 (api-dev)

Status: **corrigido**.

`app-api/src/modules/characters/characters.service.ts` — os três pontos apontados
foram ajustados para carregar as relações aninhadas de `race`, no mesmo padrão já
usado em `races.service.ts` (`relations: { category: true, tags: true }`):
- `findById`: `relations` agora inclui `race: { category: true, tags: true }` (mantendo
  `tags: true` e `kinships: { relative: true }` do personagem).
- `findAllPaginated`: a busca final por `In(ids)` agora usa
  `relations: { race: { category: true, tags: true }, tags: true }` em vez de
  `race: true`.
- `findRaceById`: trocado `racesRepository.findOneBy({ id })` por
  `racesRepository.findOne({ where: { id }, relations: { category: true, tags: true } })`,
  garantindo que `race.category`/`race.tags` também estejam populados após
  `create`/`update` (via `character.race = await this.findRaceById(...)`).

Nenhum contrato de rota, nome de campo ou documentação Swagger foi alterado nesta
correção. O achado 2 (documentação Swagger de `@ApiConflictResponse` vs.
`BadRequestException`) permanece pendente, a ser tratado separadamente pelo agente
responsável pela documentação.

### Correção do achado 2 (api-dev-doc)

Status: **corrigido**.

`app-api/src/modules/characters/characters.controller.ts`:
- Endpoints `POST /characters` e `PUT /characters/:id`: removido o `@ApiConflictResponse`
  (não há casos de 409 em nenhum endpoint do módulo de personagens). Adicionada a descrição
  de duplicidade de par (`duplicidade de par em parentescos (mesmo relativeId mais de uma
  vez)`) ao `@ApiBadRequestResponse` (400), refletindo o real `BadRequestException`
  lançado por `assertNoDuplicateRelatives` nos services.

`app-api/src/modules/organizations/organizations.controller.ts`:
- Endpoints `POST /organizations` e `PUT /organizations/:id`: mantido o `@ApiConflictResponse`
  (409) restrito **exclusivamente** ao caso de nome de organização duplicado (`@Index({ unique: true })`
  em `Organization.name`), que realmente lança `ConflictException`. Adicionada a descrição
  de duplicidade de membros (`duplicidade de par em membros (mesmo characterId mais de uma
  vez)`) ao `@ApiBadRequestResponse` (400), refletindo o real `BadRequestException`
  lançado por `assertNoDuplicateMembers` nos services.

Nenhum contrato de rota, nome de método, lógica de negócio, validação de DTOs ou
comportamento real do código foi alterado. Apenas a documentação Swagger foi ajustada
para refletir coerentemente o que o código de fato faz.

## Revisão (re-verificação das correções)

Escopo re-revisado: `app-api/src/modules/characters/characters.service.ts`,
`app-api/src/modules/characters/characters.controller.ts`,
`app-api/src/modules/organizations/organizations.controller.ts`,
`app-api/src/modules/organizations/organizations.service.ts`, com comparação direta
contra `app-api/src/modules/races/races.service.ts` e
`app-api/src/modules/races/dto/race-response.dto.ts`.

**Achado 1 (bug crítico de runtime) — CONFIRMADO CORRIGIDO.**
- `findById` (linhas 45-54) agora usa
  `relations: { race: { category: true, tags: true }, tags: true, kinships: { relative: true } }`.
- `findAllPaginated` (linha 211) agora usa
  `relations: { race: { category: true, tags: true }, tags: true }` na busca final por
  `In(ids)`.
- `findRaceById` (linhas 66-75) agora usa `racesRepository.findOne({ where: { id },
  relations: { category: true, tags: true } })` em vez de `findOneBy`, no mesmo padrão
  de `races.service.ts` (`findById`, linhas 41-46).
- `create` monta o personagem com `race` vindo de `findRaceById` (já corrigido) e
  `update` (linha 226) chama `findById` (já corrigido) e, quando `dto.raceId` é
  informado, também `findRaceById` (linha 244, já corrigido) — portanto os quatro
  fluxos que produzem `CharacterResponseDto`/`CharacterListItemResponseDto` com raça
  (`create`, `update`, `findById`/`GET :id`, `findAllPaginated`/`GET`) carregam
  `race.category` e `race.tags` de forma completa. Não sobrou nenhum caminho de leitura
  de `Character` com `race` não nulo que deixe de popular essas relações aninhadas.
  Como `RaceResponseDto.fromEntity` (linha 68) acessa `race.category.id`/`.name` via
  `RaceCategoryResponseDto.fromEntity(race.category)` sem fallback de nulo, o bug de
  `TypeError: Cannot read properties of undefined` em `POST/PUT/GET /characters*` com
  personagem com `raceId` preenchido está eliminado.

**Achado 2 (documentação Swagger incoerente) — CONFIRMADO CORRIGIDO, com uma ressalva
menor (novo achado de baixa severidade).**
- `characters.controller.ts`: `@ApiConflictResponse` foi removido de `create` (`POST`)
  e `update` (`PUT`), e a descrição de duplicidade de par em `kinships` foi movida para
  `@ApiBadRequestResponse`, coerente com `BadRequestException` lançado por
  `assertNoDuplicateRelatives`/`assertNoSelfKinship` em `characters.service.ts`. Não há
  nenhum `ConflictException` no módulo de personagens, então a ausência total de
  `@ApiConflictResponse` nesse controller está correta.
- `organizations.controller.ts`: `@ApiConflictResponse` permanece em `create` e
  `update`, mas agora com a descrição restrita a "Nome da organização já existe" —
  coerente com o `ConflictException` de fato lançado em `organizations.service.ts`
  (`create` linha 117, `update` linha 198) quando `dto.name` já existe. A duplicidade de
  par em `members` foi movida para `@ApiBadRequestResponse`, coerente com o
  `BadRequestException` de `assertNoDuplicateMembers`.
- Nenhuma regressão de contrato de rota, nome de campo, ou consistência
  migration↔entidade foi introduzida por nenhuma das duas correções — apenas
  `relations`/documentação Swagger foram tocadas.

- **[app-api/src/modules/characters/characters.controller.ts:19]** — Achado novo, baixa
  severidade (resíduo da correção do achado 2): o import `ApiConflictResponse` de
  `@nestjs/swagger` permanece no arquivo, mas o decorator não é mais usado em nenhum
  endpoint após a remoção do `@ApiConflictResponse` de `create`/`update`. É um import
  não utilizado.
  - Trecho:
    ```ts
    import {
      ApiBadRequestResponse,
      ApiBearerAuth,
      ApiConflictResponse,
      ApiCreatedResponse,
      ...
    } from '@nestjs/swagger';
    ```
  - Sugestão: remover `ApiConflictResponse` da lista de imports em
    `characters.controller.ts`, já que nenhum endpoint desse controller lança
    `ConflictException`.

Conclusão: os dois achados da rodada anterior foram efetivamente resolvidos. Resta
apenas o import não utilizado apontado acima (achado de estilo/lint, não bloqueante),
a ser removido em uma próxima correção.

### Correção do achado de import órfão (re-verificação)

Status: **corrigido**.

`app-api/src/modules/characters/characters.controller.ts` — o import `ApiConflictResponse`
de `@nestjs/swagger` foi removido da linha 19, já que não é utilizado em nenhum decorator
após a remoção do `@ApiConflictResponse` nos endpoints `POST` e `PUT`. Nenhuma outra
alteração foi realizada.
