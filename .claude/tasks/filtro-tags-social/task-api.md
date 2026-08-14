# Task API: Filtro por tags (tagIds) nos endpoints de listagem de families, organizations, characters, biographies, campaigns e planned-sessions

## Contexto
Não existe `.claude/tasks/filtro-tags-social/spec.md` para esta demanda — o planejamento segue diretamente o pedido do usuário, que já trouxe o padrão de referência obrigatório a ser replicado (módulo `trainings`).

Objetivo: adicionar o filtro `tagIds` (array de UUIDs, semântica AND) nos endpoints de **listagem** dos 6 módulos abaixo. Todos já possuem relacionamento com tags via tabela de junção própria; **não há alteração de entidade nem migration em nenhum dos 6 módulos** — o trabalho é exclusivamente no DTO de query de listagem (`find-*-query.dto.ts`, já existente nos 6 módulos) e no método `findAllPaginated` do respectivo service.

### Padrão de referência obrigatório (replicar fielmente, não reinventar)
- DTO: `app-api/src/modules/trainings/dto/find-trainings-query.dto.ts` — campo `tagIds?: string[]` com `@IsOptional() @IsArray() @IsUUID('4', { each: true })` e `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: '...' })`, cuja description (pt-BR) explica a semântica AND e a notação de querystring `tagIds[]=uuid1&tagIds[]=uuid2`.
- Service: `app-api/src/modules/trainings/trainings.service.ts`, método `findAllPaginated` (linhas ~263-344):
  - `const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;`
  - Dedupe: `const uniqueTagIds = [...new Set(query.tagIds)];`
  - `innerJoin` na tabela de junção com alias `<entidade>_tag_filter`, condição `<entidade>_tag_filter.<fk> = <alias>.id AND <entidade>_tag_filter.tag_id IN (:...tagIds)`.
  - `.groupBy('<alias>.id').having('COUNT(DISTINCT <join_alias>.tag_id) = :tagCount', { tagCount: uniqueTagIds.length })` — cada registro precisa ter TODAS as tags informadas.
  - **Particularidade crítica**: `getManyAndCount()` NÃO computa o total corretamente quando a query tem `groupBy`/`having` (o count interno do TypeORM ignora o agrupamento). Hoje, todos os 6 módulos usam `const [ids, total] = await queryBuilder....getManyAndCount()`. Isso precisa ser trocado pelo padrão de trainings: calcular `total` **antes** de paginar, separadamente, só quando `hasTagFilter` for verdadeiro (via `queryBuilder.clone().select('<alias>.id').getRawMany()).length`), e usar `getCount()` simples caso contrário; depois obter `ids` com `.select([...]).orderBy(...).skip().take().getMany()`.
- Também consultar `talents` e `characteristics`, que seguem o mesmo padrão, como referência adicional.

Mensagens/descrições Swagger em pt-BR, adaptando o texto de "treinamentos" para o substantivo de cada entidade (famílias, organizações, personagens, biografias, campanhas, sessões planejadas).

## Etapas

### 1. api-dev
Status: concluído

Aplicar, em cada um dos 6 módulos abaixo, a mesma alteração: (a) adicionar `tagIds` ao DTO de query de listagem já existente e (b) alterar o método `findAllPaginated` do service para aplicar o filtro e corrigir o cálculo de `total`, seguindo fielmente o padrão de `trainings` descrito no Contexto.

Resumo do que foi alterado por módulo (DTO + service, seguindo fielmente o padrão de `trainings`; nenhuma entidade/migration/nível de acesso Google alterado):
- **families**: `find-families-query.dto.ts` ganhou `tagIds?: string[]`; `FamiliesService.findAllPaginated` passou a fazer `innerJoin('family_tags', 'family_tag_filter', 'family_tag_filter.family_id = family.id AND family_tag_filter.tag_id IN (:...tagIds)')` + `groupBy('family.id')`/`having(...)` quando `tagIds` informado, e o `total` passou a ser calculado separadamente (`getRawMany().length` com filtro de tags, `getCount()` sem) em vez de `getManyAndCount()`.
- **organizations**: mesma alteração, tabela `organization_tags`, coluna `organization_id`, alias de join `organization_tag_filter`.
- **characters**: mesma alteração, tabela `character_tags`, coluna `character_id`, alias `character_tag_filter`. O `groupBy`/`having`/`innerJoin` ficou restrito à query de paginação (seleção de `id`/`name`); a query subsequente `charactersRepository.find({ relations: { race: { category: true } }, ... })` não foi tocada.
- **biographies**: mesma alteração, tabela `biography_tags`, coluna `biography_id`, alias `biography_tag_filter`.
- **campaigns**: mesma alteração, tabela `campaign_tags`, coluna `campaign_id`, alias `campaign_tag_filter`; o `andWhere('campaign.createdBy = :userId', ...)` pré-existente foi mantido intacto, e o filtro de tags compõe em AND sobre o mesmo `queryBuilder`.
- **planned-sessions**: mesma alteração, tabela `planned_session_tags`, coluna `planned_session_id` (nome físico da FK, distinto da propriedade `plannedSession` da entidade), alias `planned_session_tag_filter`; o `andWhere('plannedSession.campaign = :campaignId', ...)` e a chamada prévia a `ensureOwnedCampaign` foram mantidos intactos, com o filtro de tags composto em AND sobre o mesmo `queryBuilder`.

---

#### families

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `FamilyTag` (`app-api/src/modules/families/entities/family-tag.entity.ts`).
- Tabela de junção confirmada: `family_tags` (ver entidade e migration `app-api/src/database/migrations/1784305650000-CreateFamilyTagsTable.ts`). Colunas: `family_id`, `tag_id`. **Confirmar novamente no código antes de implementar**, não assumir por convenção.

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /families` (`FamiliesController.findAll`, `app-api/src/modules/families/families.controller.ts`, linhas ~63-82).
- DTO a alterar: `app-api/src/modules/families/dto/find-families-query.dto.ts` — adicionar `tagIds?: string[]` no padrão de `FindTrainingsQueryDto.tagIds` (description adaptada para "famílias").
- Service a alterar: `FamiliesService.findAllPaginated` (`app-api/src/modules/families/families.service.ts`, linhas ~608-653). Alias da entidade: `family`. Join alias sugerido: `family_tag_filter`.
- Atenção específica: `families` tem árvore genealógica (`FamilyMember`, `FamilyRelationship`, ver `families.service.ts`), mas o `findAllPaginated` atual não possui joins adicionais nem `orderBy` fora de `family.name` — validar, no momento da implementação, que nenhum join futuro/existente conflita com o `groupBy('family.id')` introduzido (o `orderBy('family.name')` é funcionalmente dependente da PK `id`, o que o Postgres aceita sem incluir a coluna no `GROUP BY`).
- Acesso Google: `read-only` (já configurado via `@GoogleAccess('read-only')` no controller) — não há alteração de nível de acesso nesta demanda, apenas um novo parâmetro de query opcional.

---

#### organizations

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `OrganizationTag` (`app-api/src/modules/organizations/entities/organization-tag.entity.ts`).
- Tabela de junção confirmada: `organization_tags` (ver entidade e migration `1784305600000-CreateOrganizationTagsTable.ts`). Colunas: `organization_id`, `tag_id`. Confirmar novamente antes de implementar.

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /organizations` (`OrganizationsController.findAll`, `app-api/src/modules/organizations/organizations.controller.ts`, linhas ~67+).
- DTO a alterar: `app-api/src/modules/organizations/dto/find-organizations-query.dto.ts` — adicionar `tagIds?: string[]` no mesmo padrão (description adaptada para "organizações").
- Service a alterar: `OrganizationsService.findAllPaginated` (`app-api/src/modules/organizations/organizations.service.ts`, linhas ~236-287). Alias da entidade: `organization`. Join alias sugerido: `organization_tag_filter`.
- Atenção específica: `organizations` tem relacionamento de membros com `characters` via `OrganizationMember` (`app-api/src/modules/organizations/entities/organization-member.entity.ts`), mas o `findAllPaginated` atual não faz join com essa tabela. Validar, no momento da implementação, que não há join/ordenação adicional que conflite com o `groupBy('organization.id')` introduzido.
- Acesso Google: `read-only` (já configurado) — sem alteração.

---

#### characters

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `CharacterTag` (`app-api/src/modules/characters/entities/character-tag.entity.ts`).
- Tabela de junção confirmada: `character_tags` (ver entidade e migration `1784305580000-CreateCharacterTagsTable.ts`). Colunas: `character_id`, `tag_id`. Confirmar novamente antes de implementar.

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /characters` (`CharactersController.findAll`, `app-api/src/modules/characters/characters.controller.ts`, linhas ~63+).
- DTO a alterar: `app-api/src/modules/characters/dto/find-characters-query.dto.ts` — adicionar `tagIds?: string[]` no mesmo padrão (description adaptada para "personagens").
- Service a alterar: `CharactersService.findAllPaginated` (`app-api/src/modules/characters/characters.service.ts`, linhas ~219-279). Alias da entidade: `character`. Join alias sugerido: `character_tag_filter`.
- Atenção específica: o método já faz, **depois** de obter os `ids` paginados, uma segunda consulta (`this.charactersRepository.find({ relations: { race: { category: true } }, ... })`) e carrega separadamente `tagsByCharacterId`/`tagsByRaceId`. Essa parte não muda — o `groupBy`/`having`/`innerJoin` do filtro de tags deve ficar restrito à primeira query (a que só seleciona `character.id`/`character.name` para paginação), sem afetar a query de carregamento completo dos personagens. `characters` também tem relação com `organizations` via `OrganizationMember`, mas isso não aparece no `findAllPaginated` atual — validar que nenhum join futuro conflita com o `groupBy('character.id')`.
- Acesso Google: `read-only` (já configurado) — sem alteração.

---

#### biographies

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `BiographyTag` (`app-api/src/modules/biographies/entities/biography-tag.entity.ts`).
- Tabela de junção confirmada: `biography_tags` (ver entidade; migration correspondente dentro de `1784306230000-CreateBiographiesAndExtendOwnerRelations.ts`, que também mexe em outras tabelas — conferir especificamente a criação de `biography_tags` e suas colunas `biography_id`/`tag_id` nesse arquivo antes de implementar).

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /biographies` (`BiographiesController.findAll`, `app-api/src/modules/biographies/biographies.controller.ts`, linhas ~77+).
- DTO a alterar: `app-api/src/modules/biographies/dto/find-biographies-query.dto.ts` — adicionar `tagIds?: string[]` no mesmo padrão (description adaptada para "biografias").
- Service a alterar: `BiographiesService.findAllPaginated` (`app-api/src/modules/biographies/biographies.service.ts`, linhas ~237-285). Alias da entidade: `biography`. Join alias sugerido: `biography_tag_filter`.
- Atenção específica: nenhuma particularidade adicional identificada — método simples, sem joins extras na query de listagem.
- Acesso Google: `read-only` (já configurado) — sem alteração.

---

#### campaigns

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `CampaignTag` (`app-api/src/modules/campaigns/entities/campaign-tag.entity.ts`).
- Tabela de junção confirmada: `campaign_tags` (ver entidade e migration `1784305980000-CreateCampaignTagsTable.ts`). Colunas: `campaign_id`, `tag_id`. Confirmar novamente antes de implementar.

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /campaigns` (`CampaignsController.findAll`, `app-api/src/modules/campaigns/campaigns.controller.ts`, linhas ~71+).
- DTO a alterar: `app-api/src/modules/campaigns/dto/find-campaigns-query.dto.ts` — adicionar `tagIds?: string[]` no mesmo padrão (description adaptada para "campanhas").
- Service a alterar: `CampaignsService.findAllPaginated` (`app-api/src/modules/campaigns/campaigns.service.ts`, linhas ~176-225). Alias da entidade: `campaign`. Join alias sugerido: `campaign_tag_filter`.
- Atenção específica: a query já tem um filtro existente `.andWhere('campaign.createdBy = :userId', { userId: currentUser.id })` (listagem restrita ao usuário autenticado). O filtro de tags deve compor em AND com esse filtro de ownership, sem alterá-lo — aplicar `innerJoin`/`groupBy`/`having` adicionalmente, mantendo o `andWhere` de `createdBy` intacto.
- Acesso Google: `blocked` (já configurado via `@GoogleAccess('blocked')` no controller — usuários Google não têm acesso a campanhas) — sem alteração.

---

#### planned-sessions

##### Entidade
- Não aplicável — nenhuma entidade nova ou alterada. Relacionamento já existe via `PlannedSessionTag` (`app-api/src/modules/planned-sessions/entities/planned-session-tag.entity.ts`).
- Tabela de junção confirmada: `planned_session_tags` (ver entidade e migration `1784306010000-CreatePlannedSessionTagsTable.ts`). Colunas: `planned_session_id`, `tag_id`. Confirmar novamente antes de implementar. Note que a propriedade de relação na entidade é `plannedSession` (camelCase) — ao montar a condição do `innerJoin`, usar o nome real da coluna física (`planned_session_id`), não o nome da propriedade TypeORM.

##### Migration
- Necessária: não.

##### Controller
- Endpoint afetado: `GET /campaigns/:campaignId/planned-sessions` (`PlannedSessionsController.findAll`, `app-api/src/modules/planned-sessions/planned-sessions.controller.ts`, linhas ~75-102).
- DTO a alterar: `app-api/src/modules/planned-sessions/dto/find-planned-sessions-query.dto.ts` — adicionar `tagIds?: string[]` no mesmo padrão (description adaptada para "sessões planejadas").
- Service a alterar: `PlannedSessionsService.findAllPaginated` (`app-api/src/modules/planned-sessions/planned-sessions.service.ts`, linhas ~151-203). Alias da entidade: `plannedSession`. Join alias sugerido: `planned_session_tag_filter`.
- **Atenção crítica (caso mais delicado dos 6 módulos)**: a listagem já é aninhada por campanha — a query atual tem `.andWhere('plannedSession.campaign = :campaignId', { campaignId })`, após `ensureOwnedCampaign(campaignId, currentUser.id)`. O filtro de tags deve compor em AND com esse escopo por campanha, sem substituí-lo: o `innerJoin`/`groupBy`/`having` do filtro de tags é adicional, mantendo intacto o `andWhere` de `campaignId` (e a validação de ownership da campanha, que continua ocorrendo antes de montar a query). Verificar, ao implementar, que o `having('COUNT(DISTINCT planned_session_tag_filter.tag_id) = :tagCount', ...)` conta apenas as tags dentro do universo já restrito à campanha (o `innerJoin` usa a condição `planned_session_tag_filter.planned_session_id = plannedSession.id`, então isso é natural, mas deve ser conferido em teste manual/e2e).
- Acesso Google: `blocked` (já configurado via `@GoogleAccess('blocked')` no controller) — sem alteração.

---

### 2. api-dev-doc
Status: concluído

- Para cada um dos 6 módulos, atualizar a documentação Swagger do parâmetro `tagIds` no respectivo DTO de query (`@ApiPropertyOptional` já cobre isso ao seguir o padrão de trainings — conferir se a description ficou coerente com o substantivo da entidade e com a notação de querystring `tagIds[]=uuid1&tagIds[]=uuid2`).
- Não é esperada alteração nos DTOs de resposta (`Paginated*ResponseDto`, `*ListItemResponseDto`) nem nas tags/`@ApiOperation` dos endpoints — a mudança é apenas um novo parâmetro de query opcional em endpoints já documentados. Conferir, ainda assim, que o Swagger em `/docs` reflete corretamente o novo campo em cada um dos 6 `GET` de listagem.

**Resumo da verificação:**
- **families**: `FindFamiliesQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description "Filtro por tags (array de UUIDs). Retorna apenas famílias que possuem TODAS as tags informadas (AND). Na querystring, use a notação com colchetes: `tagIds[]=uuid1&tagIds[]=uuid2&...`". Controller com `@ApiTags('families')`, `@ApiOperation({ summary: 'Lista famílias com paginação e filtro' })`, `@ApiOkResponse`, `@ApiBadRequestResponse`.
- **organizations**: `FindOrganizationsQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description adaptada para "organizações". Controller com documentação Swagger completa.
- **characters**: `FindCharactersQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description adaptada para "personagens". Controller com documentação Swagger completa.
- **biographies**: `FindBiographiesQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description adaptada para "biografias". Controller com documentação Swagger completa.
- **campaigns**: `FindCampaignsQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description adaptada para "campanhas". Controller com documentação Swagger completa.
- **planned-sessions**: `FindPlannedSessionsQueryDto` possui `@ApiPropertyOptional` completo em `tagIds` com description adaptada para "sessões planejadas". Controller com documentação Swagger completa.

Todas as descriptions utilizam pt-BR, explicam corretamente a semântica AND e a notação de querystring, seguindo fielmente o padrão de trainings. Os endpoints de listagem (`GET`) em todos os 6 módulos refletem corretamente o novo parâmetro `tagIds` na documentação Swagger disponível em `/docs`.

### 3. api-dev-codereviewer
Status: concluído

Revisar, para os 6 módulos (families, organizations, characters, biographies, campaigns, planned-sessions):
- O nome real da tabela de junção e das colunas FK usados no `innerJoin` de cada service batem com a respectiva `*-tag.entity.ts` e migration (não foram assumidos por convenção).
- O dedupe de `tagIds` (`[...new Set(...)]`) e a semântica AND via `groupBy`/`having` foram replicados fielmente do padrão de `trainings`.
- A correção do cálculo de `total` (bug do `getManyAndCount()` com `groupBy`/`having`) foi aplicada em todos os 6 services, com `total` calculado separadamente apenas quando `hasTagFilter` for verdadeiro.
- Em `campaigns`, o filtro de tags compõe em AND com `campaign.createdBy = :userId` sem quebrá-lo.
- Em `planned-sessions`, o filtro de tags compõe em AND com o escopo por `campaignId` sem quebrá-lo, e a validação `ensureOwnedCampaign` continua ocorrendo.
- Em `characters`, o `groupBy`/`having`/`innerJoin` do filtro fica restrito à query de paginação (seleção de ids), sem vazar para a query subsequente de carregamento completo (`relations: { race: { category: true } }`).
- Em `families`, `organizations` e `characters`, não há conflito entre o `groupBy` introduzido e joins/ordenações pré-existentes na listagem.
- Mensagens e descriptions em pt-BR, consistentes com o restante do projeto.
- Nenhuma entidade, migration ou nível de acesso Google (`@GoogleAccess`) foi alterado indevidamente — a demanda é estritamente aditiva sobre os DTOs de query e os services de listagem.

## Revisão

Revisão realizada lendo, para cada um dos 6 módulos, o DTO de query
(`find-*-query.dto.ts`), o método `findAllPaginated` do respectivo service, a
entidade `*-tag.entity.ts` e a migration correspondente da tabela de junção, e
comparando linha a linha com o padrão de referência
(`app-api/src/modules/trainings/trainings.service.ts` e
`find-trainings-query.dto.ts`). Também foram conferidos os controllers dos 6
módulos quanto a `@UseGuards`/`@GoogleAccess` para confirmar que o nível de
acesso Google não foi alterado.

**Verificações de segurança (foco desta revisão):**
- `campaigns.service.ts` (`findAllPaginated`, linhas 176-253): o
  `queryBuilder` é criado já com `.andWhere('campaign.createdBy = :userId', { userId: currentUser.id })` **antes** de qualquer lógica de tags; o `innerJoin`/`groupBy`/`having` do filtro de tags é aplicado sobre esse mesmo `queryBuilder` em AND, e tanto o cálculo de `total` (via `queryBuilder.clone()`) quanto a query final de `ids` preservam o filtro de `createdBy`. Escopo de autorização por usuário permanece intacto.
- `planned-sessions.service.ts` (`findAllPaginated`, linhas 151-233): `ensureOwnedCampaign(campaignId, currentUser.id)` continua sendo chamado antes de montar o `queryBuilder`, que por sua vez já nasce com `.andWhere('plannedSession.campaign = :campaignId', { campaignId })`; o filtro de tags compõe em AND sobre o mesmo builder, sem substituir nem enfraquecer o escopo por campanha. `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('blocked')` permanecem intactos no controller.
- `@GoogleAccess` inalterado nos 6 controllers: `read-only` em families, organizations, characters, biographies; `blocked` em campaigns e planned-sessions — confirmado lendo cada controller.

**Consistência migration ↔ entidade ↔ service (nome de tabela/coluna usados no `innerJoin`):**
- families: entidade `FamilyTag` usa `@Entity('family_tags')` com `@JoinColumn({ name: 'family_id' })`; migration `1784305650000-CreateFamilyTagsTable.ts` cria `family_tags(family_id, tag_id)`; service usa `innerJoin('family_tags', 'family_tag_filter', 'family_tag_filter.family_id = family.id AND ...')`. Confere.
- organizations: `OrganizationTag` → `organization_tags(organization_id, tag_id)` (migration `1784305600000-CreateOrganizationTagsTable.ts`); service usa `organization_tags`/`organization_id`. Confere.
- characters: `CharacterTag` → `character_tags(character_id, tag_id)` (migration `1784305580000-CreateCharacterTagsTable.ts`); service usa `character_tags`/`character_id`. Confere.
- biographies: `BiographyTag` → `biography_tags(biography_id, tag_id)` (dentro da migration `1784306230000-CreateBiographiesAndExtendOwnerRelations.ts`); service usa `biography_tags`/`biography_id`. Confere.
- campaigns: `CampaignTag` → `campaign_tags(campaign_id, tag_id)` (migration `1784305980000-CreateCampaignTagsTable.ts`); service usa `campaign_tags`/`campaign_id`. Confere.
- planned-sessions: `PlannedSessionTag` → `planned_session_tags(planned_session_id, tag_id)` (migration `1784306010000-CreatePlannedSessionTagsTable.ts`); service usa `planned_session_tags`/`planned_session_id` (nome físico da coluna, distinto da propriedade `plannedSession` da entidade, corretamente usado). Confere.

**Padrão `trainings` replicado fielmente nos 6 services (dedupe, `groupBy`/`having`, cálculo de `total`):**
- Todos os 6 `findAllPaginated` calculam `hasTagFilter = !!query.tagIds && query.tagIds.length > 0`, deduplicam com `[...new Set(query.tagIds)]`, aplicam `innerJoin(...).groupBy('<alias>.id').having('COUNT(DISTINCT <join_alias>.tag_id) = :tagCount', { tagCount: uniqueTagIds.length })` apenas quando `hasTagFilter`, e calculam `total` via `queryBuilder.clone().select('<alias>.id').getRawMany()).length` (com filtro) ou `queryBuilder.clone().getCount()` (sem filtro), antes de paginar com `.select([...]).orderBy(...).skip().take().getMany()`. Idêntico ao padrão de `trainings.service.ts`.
- `characters.service.ts`: o `groupBy`/`having`/`innerJoin` fica restrito à primeira query (seleção `character.id`/`character.name`); a query subsequente `charactersRepository.find({ relations: { race: { category: true } }, ... })` não é afetada, como esperado.
- `families`, `organizations`, `characters`: nenhum `groupBy`/`orderBy`/join adicional pré-existente conflita com o `groupBy('<alias>.id')` introduzido — cada `findAllPaginated` só ordena por `<alias>.name`, o que o Postgres aceita sem incluir a coluna no `GROUP BY` já que `id` é PK.

**DTOs de query (`find-*-query.dto.ts`):**
- Todos os 6 seguem exatamente o padrão de `FindTrainingsQueryDto.tagIds`: `@IsOptional() @IsArray() @IsUUID('4', { each: true })` com `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: '...' })`. As descriptions estão em pt-BR, explicam a semântica AND ("possuem TODAS as tags informadas") e a notação de querystring `tagIds[]=uuid1&tagIds[]=uuid2&...`, com o substantivo adaptado corretamente para cada entidade (famílias, organizações, personagens, biografias, campanhas, sessões planejadas).

**Mensagens/comentários em pt-BR:** os comentários explicativos sobre o bug do `getManyAndCount()` com `groupBy`/`having` estão em pt-BR e consistentes entre os 6 services (adaptando apenas o substantivo da entidade em cada comentário).

**Escopo da alteração:** conferido que nenhuma entidade, migration ou nível de acesso Google foi alterada — a mudança é estritamente aditiva sobre os 6 DTOs de query e os 6 métodos `findAllPaginated`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-api/src/modules/families/dto/find-families-query.dto.ts`
- `app-api/src/modules/families/families.service.ts`
- `app-api/src/modules/organizations/dto/find-organizations-query.dto.ts`
- `app-api/src/modules/organizations/organizations.service.ts`
- `app-api/src/modules/characters/dto/find-characters-query.dto.ts`
- `app-api/src/modules/characters/characters.service.ts`
- `app-api/src/modules/biographies/dto/find-biographies-query.dto.ts`
- `app-api/src/modules/biographies/biographies.service.ts`
- `app-api/src/modules/campaigns/dto/find-campaigns-query.dto.ts`
- `app-api/src/modules/campaigns/campaigns.service.ts`
- `app-api/src/modules/planned-sessions/dto/find-planned-sessions-query.dto.ts`
- `app-api/src/modules/planned-sessions/planned-sessions.service.ts`
