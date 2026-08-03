# Task API: Biografias

## Contexto
Ver .claude/tasks/biografias/spec.md

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/biographies/entities/biography.entity.ts
Migration: app-api/src/database/migrations/1784306230000-CreateBiographiesAndExtendOwnerRelations.ts
Rotas: POST /biographies, GET /biographies, GET /biographies/:id, PUT /biographies/:id, DELETE /biographies/:id
Arquivos:
- app-api/src/modules/biographies/dto/create-biography.dto.ts
- app-api/src/modules/biographies/dto/update-biography.dto.ts
- app-api/src/modules/biographies/dto/find-biographies-query.dto.ts
- app-api/src/modules/biographies/dto/biography-response.dto.ts
- app-api/src/modules/biographies/dto/biography-list-item-response.dto.ts
- app-api/src/modules/biographies/dto/paginated-biographies-response.dto.ts
- app-api/src/modules/biographies/biographies.service.ts
- app-api/src/modules/biographies/biographies.controller.ts
- app-api/src/modules/biographies/biographies.module.ts
- app-api/src/app.module.ts (registro do BiographiesModule)
- app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts (adicionado BIOGRAPHY)
- app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts (coluna ownerBiography, CK e Unique atualizados)
- app-api/src/modules/improvement-flaws/improvement-flaws.service.ts (ownerColumnFor cobre BIOGRAPHY)
- app-api/src/modules/improvement-flaws/improvement-flaws.module.ts (registro de Biography no TypeOrmModule.forFeature)
- app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts (adicionado BIOGRAPHY)
- app-api/src/modules/entity-links/entities/entity-link.entity.ts (colunas ownerBiography/targetBiography, CKs e Unique atualizados)
- app-api/src/modules/entity-links/entity-links.service.ts (repositoryFor/ownerColumnFor/targetColumnFor/loadReferencesFor/toResponse cobrem BIOGRAPHY)
- app-api/src/modules/entity-links/entity-links.module.ts (registro de Biography no TypeOrmModule.forFeature)
- app-api/src/modules/search/enums/linkable-entity-type.enum.ts (adicionado BIOGRAPHY)
- app-api/src/modules/search/search.service.ts (repositório de Biography incluído em linkableEntities)
- app-api/src/modules/search/search.module.ts (registro de Biography no TypeOrmModule.forFeature)
- app-api/src/modules/search/search.controller.ts (menção a "biografias" no @ApiOperation)
- app-api/src/modules/search/dto/search-result-item-response.dto.ts (menção a "biografia" na descrição do enum)

Pendência registrada para api-dev-codereviewer: confirmar se a extensão simétrica de
`ReferenceableEntityType` com `BIOGRAPHY` (incluindo `targetBiography` em
`EntityLink`) é de fato a decisão pretendida, dado que isso permite tecnicamente que
qualquer lista de entity-links do sistema (não só Habilidades Adicionais de
Biografia) passe a referenciar uma Biografia como alvo — efeito colateral já
sinalizado no spec/task como ponto de atenção, não uma lacuna de implementação.

#### Entidade

- Entidade: `Biography` (tabela `biographies`), em `app-api/src/modules/biographies/entities/biography.entity.ts`, estendendo `BaseEntity` (`id` UUID, `createdAt`, `updatedAt` herdados automaticamente).
- Campos próprios:
  - `name` (string, obrigatório, único — `@Index({ unique: true }) @Column()`, mesmo padrão de `Training.name`/`Divinity.name`).
  - `description` (`@Column({ type: 'text', nullable: true })`, HTML livre, opcional — mesmo padrão de `Training.description`).
  - `imageReference` (`@Column({ type: 'varchar', nullable: true, name: 'image_reference' })`, opcional — nome de propriedade literal `imageReference` fixado pelo spec, não `referenceImage`/`referenceImageUrl`; validado como URL nos DTOs via `@IsUrl`, análogo ao tratamento de `Divinity.referenceImage`/`create-divinity.dto.ts`).
  - `tags` (`@ManyToMany(() => Tag)` com `@JoinTable({ name: 'biography_tags', joinColumn: { name: 'biography_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' } })`, opcional — mesmo padrão de `training_tags`).
- Relacionamentos indiretos, via reuso dos mecanismos genéricos já existentes (fora da entidade `Biography` propriamente dita):
  - **`improvements`** — reaproveita `ImprovementFlawsService`/`ImprovementFlaw` (`app-api/src/modules/improvement-flaws/`). É preciso registrar Biography como novo "owner" desse mecanismo:
    - Adicionar `BIOGRAPHY = 'biography'` a `ImprovementFlawOwnerType` (`improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`).
    - Adicionar coluna `ownerBiography` (`@ManyToOne(() => Biography, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'owner_biography_id' })`) à entidade `ImprovementFlaw`, incluindo-a no `@Check('CK_improvement_flaws_owner_exclusive', 'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id) = 1')` e no `@Unique([...])` da tabela (mesmo padrão usado para os owners existentes).
    - Adicionar o caso `BIOGRAPHY -> 'ownerBiography'` em `ownerColumnFor` (`improvement-flaws.service.ts`).
    - Registrar `Biography` no `TypeOrmModule.forFeature` do `ImprovementFlawsModule` (necessário pelo novo `@ManyToOne`).
    - Biografia usa apenas a categoria `IMPROVEMENT` (não existe `FLAW`/Defeitos em Biografia): ao chamar `replaceItems`/`loadItemsFor`/`validateLists` do `ImprovementFlawsService`, sempre tratar `flaws` como lista vazia fixa (`[]`) e nunca expor `flaws` em nenhum DTO de Biografia.
  - **`additionalAbilities`** — reaproveita `EntityLinksService`/`EntityLink` (`app-api/src/modules/entity-links/`). É preciso registrar Biography como novo "owner":
    - Adicionar `BIOGRAPHY = 'biography'` a `ReferenceableEntityType` (`entity-links/enums/referenceable-entity-type.enum.ts`).
    - Adicionar colunas `ownerBiography` e `targetBiography` (`@ManyToOne(() => Biography, { nullable: true, onDelete: 'CASCADE' })`) à entidade `EntityLink`, atualizando os `@Check(...)` de exclusividade de owner e de target, e o `@Unique([...])` da tabela, para incluir as duas novas colunas — replicando exatamente o precedente já existente no código de `1784306090000-AddCharacteristicToEntityLinksTable.ts` (quando `Characteristic` foi adicionada, owner e target foram criados simetricamente na mesma migration).
    - Adicionar os casos `BIOGRAPHY` em `repositoryFor`, `ownerColumnFor` e `targetColumnFor` (`entity-links.service.ts`); adicionar `targetBiography: { tags: true }` às `relations` de `loadReferencesFor`; adicionar um branch `if (link.targetBiography) { ... }` em `toResponse` (`entity-links.service.ts`).
    - Registrar `Biography` no `TypeOrmModule.forFeature` do `EntityLinksModule`.
    - Biografia usa apenas o tipo de link `ADDITIONAL_ABILITY` (não existem `IMPROVED_FROM`/Aprimorado de nem `REQUIREMENT`/Requisitos em Biografia): ao chamar `replaceLinks`/`loadReferencesFor`/`validateLists` do `EntityLinksService`, sempre tratar `improvedFrom`/`requirements` como listas vazias fixas (`[]`) e nunca expor esses campos em nenhum DTO de Biografia.
  - **Ponto de atenção (decisão de arquitetura levantada nesta investigação, não uma lacuna de requisito):** ao adicionar `BIOGRAPHY` ao enum compartilhado `ReferenceableEntityType`, o tipo passa a ficar tecnicamente selecionável como `entityType` em `EntityReferenceInputDto` em **qualquer** lista de referência do sistema (ex.: `additionalAbilities`/`improvedFrom`/`requirements` de Treinamentos, Talentos, Técnicas, Magias, Características), não apenas nas Habilidades Adicionais de Biografia — já que o mecanismo é genérico e simétrico (owner e target compartilham o mesmo enum). O spec não veda nem pede esse comportamento; ele apenas descreve o que a própria lista de Biografia pode conter. Optou-se, nesta investigação, por seguir o precedente exato já estabelecido no código (owner + target simétricos, como foi feito para `Characteristic`) por ser o padrão do mecanismo genérico e evitar tratamento especial dentro dele. Se esse efeito colateral (outras entidades passando a poder referenciar uma Biografia) não for desejado, deve ser confirmado antes da implementação — reforçado como item de atenção na etapa `api-dev-codereviewer`.

#### Migration

- Necessária: sim (obrigatória, já que `synchronize: false`). Recomenda-se uma única migration cobrindo os quatro pontos abaixo (ou um conjunto coeso, a critério do `api-dev`):
  1. Criar a tabela `biographies` (`id`, `created_at`, `updated_at`, `name` com índice único, `description` nullable, `image_reference` nullable) — mesmo padrão de `1784305890000-CreateTrainingsTable.ts`.
  2. Criar a tabela de junção `biography_tags` — mesmo padrão de `1784305900000-CreateTrainingTagsTable.ts`.
  3. Alterar `improvement_flaws`: adicionar coluna `owner_biography_id` (uuid, nullable) com FK para `biographies` (`ON DELETE CASCADE`), índice `IDX_improvement_flaws_owner_biography` (`owner_biography_id`, `category`), e recriar `CK_improvement_flaws_owner_exclusive` e `IDX_improvement_flaws_unique_combination` incluindo a nova coluna — mesmo padrão de `1784306220000-CreateImprovementFlawsTable.ts`.
  4. Alterar `entity_links`: adicionar colunas `owner_biography_id` e `target_biography_id` (uuid, nullable) com FKs para `biographies` (`ON DELETE CASCADE`), índice `IDX_entity_links_link_type_owner_biography_id`, e recriar `CK_entity_links_owner_exclusive`, `CK_entity_links_target_exclusive` e `IDX_entity_links_unique_combination` incluindo as novas colunas — replicando exatamente `1784306090000-AddCharacteristicToEntityLinksTable.ts` (usando `biography` no lugar de `characteristic`).
  - `down()` deve reverter os quatro passos acima, na ordem inversa, seguindo o padrão de reversão já usado nas migrations citadas.

#### Controller

- Endpoints:
  - `POST /biographies` — cria uma biografia.
  - `GET /biographies` — lista paginada com filtro por nome (`FindBiographiesQueryDto`: `name?`, `page?`, `perPage?`).
  - `GET /biographies/:id` — busca por id.
  - `PUT /biographies/:id` — atualiza uma biografia.
  - `DELETE /biographies/:id` — remove uma biografia.
- DTOs (`app-api/src/modules/biographies/dto/`, seguindo exatamente o padrão de `trainings/dto/`, porém **sem** `flaws`, `improvedFrom` e `requirements`):
  - `CreateBiographyDto`: `name` (string, obrigatório), `description?` (string), `imageReference?` (string, `@IsUrl({}, { message: 'A URL da imagem de referência é inválida.' })`), `tagIds?` (array de UUIDs), `improvements?` (`ImprovementFlawItemInputDto[]`), `additionalAbilities?` (`EntityReferenceInputDto[]`).
  - `UpdateBiographyDto`: `PartialType(CreateBiographyDto)`.
  - `BiographyResponseDto`: `id`, `name`, `description`, `imageReference`, `tags` (`TagResponseDto[]`), `improvements` (`ImprovementFlawItemResponseDto[]`), `additionalAbilities` (`EntityReferenceResponseDto[]`), `createdAt`, `updatedAt`; `static fromEntity(biography, { improvements, additionalAbilities })`.
  - `BiographyListItemResponseDto`: `id`, `name`, `imageReference`, `tags` (`TagResponseDto[]`) — inclui `imageReference` (diferindo de `TrainingListItemResponseDto`, que não tem campo de imagem) porque a listagem web exige miniatura como primeira coluna, conforme "Comportamento da listagem" do spec.
  - `PaginatedBiographiesResponseDto`: `data` (`BiographyListItemResponseDto[]`), `total`, `page`, `perPage`, `totalPages`.
  - `FindBiographiesQueryDto`: `name?`, `page?`, `perPage?` — idêntico em estrutura a `FindTrainingsQueryDto`.
- Service (`BiographiesService`) e Module (`BiographiesModule`), em `app-api/src/modules/biographies/`, seguindo a estrutura de `TrainingsService`/`TrainingsModule` (importando `EntityLinksModule` e `ImprovementFlawsModule`, injetando `Repository<Biography>` e `Repository<Tag>`), com as seguintes particularidades:
  - `create`/`update` chamam `entityLinksService` com `ownerEntityType: ReferenceableEntityType.BIOGRAPHY`, `improvedFrom: []`/`requirements: []` fixos, e `additionalAbilities` vindo do DTO; usam `EntityLinkType.ADDITIONAL_ABILITY` como único tipo de link manipulado.
  - `create`/`update` chamam `improvementFlawsService` com `ownerType: ImprovementFlawOwnerType.BIOGRAPHY`, `flaws: []` fixo, e `improvements` vindo do DTO; usam `ImprovementFlawCategory.IMPROVEMENT` como única categoria manipulada.
  - Validação de nome duplicado (`ConflictException`, mensagem "Já existe uma biografia com este nome.") na criação e na atualização (quando o nome muda) — mesmo padrão de `TrainingsService`.
  - `findAllPaginated`: mesmo padrão de duas consultas (ids + total via query builder com `name ILIKE`, seguida de `find` com `relations: { tags: true }`), ordenação padrão `name ASC`.
  - `remove`: `NotFoundException` ("Biografia não encontrada.") se nenhum registro foi afetado.
- Acesso Google: **read-only (padrão)** — `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a nível de classe no `BiographiesController`, replicando exatamente `TrainingsController`/`DivinitiesController`. Não há justificativa para nível diferente do padrão; Biografia é conteúdo de jogo com CRUD completo como as demais entidades já cobertas por esse padrão.

Também fazem parte desta etapa as alterações no módulo de busca global (`app-api/src/modules/search/`), conforme escopo confirmado no spec:
- `search/enums/linkable-entity-type.enum.ts`: adicionar `BIOGRAPHY = 'biography'`.
- `search/search.service.ts`: injetar `Repository<Biography>` e adicionar `{ entityType: LinkableEntityType.BIOGRAPHY, repository: this.biographiesRepository }` ao array `linkableEntities` (sem tratamento especial de propriedade/owner — Biografia não é recurso privado como Campanhas/Sessões).
- `search/search.module.ts`: adicionar `Biography` ao `TypeOrmModule.forFeature([...])`.
- `search/search.controller.ts`: incluir "biografias" na enumeração em pt-BR do `@ApiOperation({ summary: ... })` do endpoint `GET /search`.

### 2. api-dev-doc
Status: concluído

Documentação Swagger implementada conforme especificação. Verificações realizadas:
- `@ApiTags('biographies')`, `@ApiBearerAuth()`, `@GoogleAccess('read-only')` e `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` presentes no nível da classe `BiographiesController`
- `@ApiOperation` com sumários em português em todos os endpoints (create, findAll, findOne, update, remove)
- `@ApiCreatedResponse` (POST), `@ApiOkResponse` (GET/PUT), `@ApiNoContentResponse` (DELETE) com DTOs corretos
- `@ApiConflictResponse`, `@ApiNotFoundResponse`, `@ApiBadRequestResponse` cobrindo todos os cenários mencionados na etapa 1
- Descrições de erro consistentes com padrão de `TrainingsController`, mas **sem** qualquer menção a Defeitos, Aprimorado de ou Requisitos (inexistentes em Biografia)
- Todos os campos em DTOs possuem `@ApiProperty` ou `@ApiPropertyOptional` com description e example quando apropriado
- `SearchController` já menciona "biografias" no sumário de `GET /search`

**Arquivos verificados e documentados:**
- app-api/src/modules/biographies/biographies.controller.ts
- app-api/src/modules/biographies/dto/create-biography.dto.ts
- app-api/src/modules/biographies/dto/update-biography.dto.ts
- app-api/src/modules/biographies/dto/find-biographies-query.dto.ts
- app-api/src/modules/biographies/dto/biography-response.dto.ts
- app-api/src/modules/biographies/dto/biography-list-item-response.dto.ts
- app-api/src/modules/biographies/dto/paginated-biographies-response.dto.ts
- app-api/src/modules/search/search.controller.ts (confirmado)

### 3. api-dev-codereviewer
Status: concluído

- Revisar tudo acima, com atenção especial para:
  - Consistência dos nomes de coluna/constraint na migration com as anotações TypeORM das entidades alteradas (`ImprovementFlaw`, `EntityLink`), e reversibilidade completa do `down()`.
  - Confirmar que `flaws`, `improvedFrom` e `requirements` nunca são aceitos nos DTOs de entrada nem expostos nas respostas de Biografia.
  - Confirmar se a extensão simétrica de `ReferenceableEntityType` com `BIOGRAPHY` (incluindo colunas de target) foi de fato a decisão pretendida, dado o efeito colateral descrito na subseção "Entidade" (outras entidades do sistema passam a poder referenciar uma Biografia através de suas próprias listas de entity-links); caso não seja desejado, reavaliar a abordagem antes de prosseguir para o frontend.
  - `GoogleAccessGuard`/`@GoogleAccess('read-only')` aplicado corretamente a nível de classe no `BiographiesController`.
  - Mensagens de erro em pt-BR consistentes com o padrão do restante da API.
  - Cobertura Swagger completa e sem menções residuais a Defeitos/Aprimorado de/Requisitos.

## Revisão

Ponto de atenção da etapa 1 (extensão simétrica de `ReferenceableEntityType` com
`BIOGRAPHY`, incluindo `targetBiography` em `EntityLink`): já avaliado e aprovado
pelo orquestrador por seguir exatamente o precedente de
`1784306090000-AddCharacteristicToEntityLinksTable.ts` (owner + target simétricos).
Verificação de consistência feita nesta revisão — confirmado que a implementação
replica o precedente com fidelidade: mesmas colunas (`owner_biography_id`/
`target_biography_id`), mesmo padrão de FK (`ON DELETE CASCADE`), mesmo índice único
apenas para owner (`IDX_entity_links_link_type_owner_biography_id`, sem equivalente
para target — igual ao precedente de `characteristic`), `CK_entity_links_owner_exclusive`/
`CK_entity_links_target_exclusive`/`IDX_entity_links_unique_combination` recriados
incluindo as duas novas colunas, e `down()` reverte exatamente na ordem inversa do
`up()`, restaurando os `CHECK`/índice/unique originais sem a coluna de biografia antes
de dropar as colunas. Mesma verificação aplicada à extensão de `improvement_flaws`
(`owner_biography_id`, `IDX_improvement_flaws_owner_biography`,
`CK_improvement_flaws_owner_exclusive`, `IDX_improvement_flaws_unique_combination`),
também fiel ao precedente de `1784306220000-CreateImprovementFlawsTable.ts`. As
anotações TypeORM de `EntityLink` e `ImprovementFlaw` (`@Check`, `@Unique`,
`@ManyToOne`/`@JoinColumn`) correspondem exatamente aos nomes de coluna/constraint
criados na migration. Nenhum problema encontrado nesse ponto.

Confirmado que `flaws`, `improvedFrom` e `requirements` nunca são aceitos nos DTOs de
entrada (`CreateBiographyDto`/`UpdateBiographyDto`) nem expostos nas respostas
(`BiographyResponseDto`/`BiographyListItemResponseDto`) de Biografia; o service
(`BiographiesService`) sempre passa `flaws: []`/`improvedFrom: []`/`requirements: []`
fixos para `ImprovementFlawsService`/`EntityLinksService` e usa exclusivamente
`ImprovementFlawCategory.IMPROVEMENT`/`EntityLinkType.ADDITIONAL_ABILITY`.

`GoogleAccessGuard` + `@GoogleAccess('read-only')` confirmados a nível de classe em
`BiographiesController`, replicando exatamente `TrainingsController`. Mensagens de
erro em pt-BR consistentes com o padrão do restante da API (`ConflictException`/
`NotFoundException` com os mesmos textos usados em `TrainingsService`, adaptados para
"biografia"). Cobertura Swagger dos endpoints de `BiographiesController` e dos DTOs
próprios de Biografia está completa e sem menções residuais a Defeitos/Aprimorado
de/Requisitos.

Um problema de documentação foi encontrado, fora do conjunto de arquivos listados nas
etapas 1 e 2, mas diretamente afetado pela extensão do enum compartilhado
`ReferenceableEntityType` com `BIOGRAPHY`:

- **app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts:9-11** e
  **app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts:23-25** —
  a descrição do `@ApiProperty` do campo `entityType` ainda lista apenas "treinamento,
  talento, técnica, magia ou característica", sem mencionar "biografia", apesar de
  `ReferenceableEntityType.BIOGRAPHY` já ser um valor válido e efetivamente aceito/
  retornado por esses mesmos DTOs quando usados em `CreateBiographyDto.additionalAbilities`
  e `BiographyResponseDto.additionalAbilities`. O `enum: ReferenceableEntityType` no
  decorator já reflete o valor correto no schema Swagger (o enum em si está certo), mas
  o texto de descrição ficou desatualizado — diferente do que foi feito em
  `search-result-item-response.dto.ts`, onde a descrição do enum `LinkableEntityType`
  foi corretamente atualizada para incluir "biografia".
  - Trecho: `'Tipo de entidade referenciada (treinamento, talento, técnica, magia ou característica)'`
  - Sugestão: atualizar as duas descrições para incluir "ou biografia" (ex.:
    "treinamento, talento, técnica, magia, característica ou biografia"), mantendo-as
    coerentes com o enum real.

Fora esse item de documentação, nenhum problema foi encontrado nos arquivos revisados:
app-api/src/modules/biographies/entities/biography.entity.ts,
app-api/src/database/migrations/1784306230000-CreateBiographiesAndExtendOwnerRelations.ts,
app-api/src/modules/biographies/dto/create-biography.dto.ts,
app-api/src/modules/biographies/dto/update-biography.dto.ts,
app-api/src/modules/biographies/dto/find-biographies-query.dto.ts,
app-api/src/modules/biographies/dto/biography-response.dto.ts,
app-api/src/modules/biographies/dto/biography-list-item-response.dto.ts,
app-api/src/modules/biographies/dto/paginated-biographies-response.dto.ts,
app-api/src/modules/biographies/biographies.service.ts,
app-api/src/modules/biographies/biographies.controller.ts,
app-api/src/modules/biographies/biographies.module.ts,
app-api/src/app.module.ts,
app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts,
app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts,
app-api/src/modules/improvement-flaws/improvement-flaws.service.ts,
app-api/src/modules/improvement-flaws/improvement-flaws.module.ts,
app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts,
app-api/src/modules/entity-links/entities/entity-link.entity.ts,
app-api/src/modules/entity-links/entity-links.service.ts,
app-api/src/modules/entity-links/entity-links.module.ts,
app-api/src/modules/search/enums/linkable-entity-type.enum.ts,
app-api/src/modules/search/search.service.ts,
app-api/src/modules/search/search.module.ts,
app-api/src/modules/search/search.controller.ts,
app-api/src/modules/search/dto/search-result-item-response.dto.ts.

## Correção do achado

O problema de documentação identificado na revisão foi corrigido:

- **app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts** e
  **app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts** —
  descrição do campo `entityType` atualizada para incluir "biografia", passando de
  "Tipo de entidade referenciada (treinamento, talento, técnica, magia ou
  característica)" para "Tipo de entidade referenciada (treinamento, talento,
  técnica, magia, característica ou biografia)", coerente com o enum
  `ReferenceableEntityType` que já aceita/retorna `BIOGRAPHY`, e consistente com o
  padrão de documentação já aplicado em `search-result-item-response.dto.ts`.
