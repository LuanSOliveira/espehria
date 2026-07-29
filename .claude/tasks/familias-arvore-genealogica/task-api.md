# Task API: Famílias e árvore genealógica

## Contexto
Ver .claude/tasks/familias-arvore-genealogica/spec.md

Módulos de referência a seguir como padrão: `app-api/src/modules/organizations/` (entidade
principal com `ManyToMany` de tags via `JoinTable` dedicada + entidade de junção própria
`OrganizationMember` com posição/atributo extra e `Unique(['organization', 'character'])`,
sincronização "substituição total" no `update` via `syncMembers`) e
`app-api/src/modules/characters/` (entidade a ser alterada: remoção de `CharacterKinship`
e seus DTOs, adição de `family`/`secondaryFamily`). `app-api/src/modules/users/entities/user.entity.ts`
é a referência para coluna `type: 'enum'` (`AuthProvider`), usada aqui para `classification`
(`Family`) e para o tipo de vínculo (`FamilyRelationship`).

Status geral: Pendente

## Etapas

### 1. api-dev
Status: concluído

#### Entidade

**`Family` (`families`)** — nova entidade, `app-api/src/modules/families/entities/family.entity.ts`
- Campos:
  - `name` (string, obrigatório). **Ponto de atenção (lacuna de requisito, não de arquitetura):**
    o spec não esclarece se o nome da família deve ser único (como `Organization.name`/
    `Divinity.name`, com `@Index({ unique: true })` + `ConflictException`) ou pode se repetir
    (como `Character.name`, sem índice único — por exemplo, duas casas nobres homônimas em
    regiões diferentes). Sugestão de default, a confirmar antes ou durante a implementação:
    seguir o padrão de `Character.name` (**sem** índice único), por ser conceitualmente mais
    próximo (múltiplas famílias podem compartilhar sobrenome). Não travar a implementação nisso,
    mas registrar a decisão tomada nesta etapa.
  - `referenceImage` (varchar, nullable) — mesma coluna/`@Column` de `Organization.referenceImage`.
  - `description` (text, nullable, HTML/rich text) — mesmo padrão de `Organization.description`.
  - `classification` (enum obrigatório, **sem** tabela de categoria — decisão já confirmada no
    spec). Criar `app-api/src/modules/families/enums/family-classification.enum.ts`:
    ```ts
    export enum FamilyClassification {
      ROYALTY = 'royalty',
      NOBILITY = 'nobility',
      COMMONER = 'commoner',
    }
    ```
    (rótulos em pt-BR — Real/Nobreza/Plebe — ficam no front, nomes/valores do enum em inglês,
    convenção do projeto). Coluna: `@Column({ type: 'enum', enum: FamilyClassification })`, no
    padrão exato de `User.provider`/`AuthProvider`.
- Relacionamentos:
  - `tags`: `ManyToMany(() => Tag)` com `@JoinTable({ name: 'family_tags', joinColumn: { name: 'family_id' }, inverseJoinColumn: { name: 'tag_id' } })`, espelhando `organization_tags`/`divinity_tags`.
  - `members`: `OneToMany(() => FamilyMember, (m) => m.family, { cascade: true, orphanedRowAction: 'delete' })`.
  - `relationships`: `OneToMany(() => FamilyRelationship, (r) => r.family, { cascade: true, orphanedRowAction: 'delete' })`.

**`FamilyMember` (`family_members`)** — nova entidade de junção própria, `.../families/entities/family-member.entity.ts`, seguindo à risca o precedente de `OrganizationMember`:
- Campos: `positionX` (número, obrigatório — posição x do card no quadro), `positionY` (número, obrigatório — posição y do card). Tipo de coluna sugerido: `'double precision'` (coordenadas de canvas, não necessariamente inteiras).
- Relacionamentos:
  - `family`: `ManyToOne(() => Family, (f) => f.members, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'family_id' })`.
  - `character`: `ManyToOne(() => Character, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'character_id' })`.
  - `@Unique(['family', 'character'])` — impede o mesmo personagem aparecer duas vezes como card na mesma árvore, no padrão exato de `@Unique(['organization', 'character'])`.

**`FamilyRelationshipType`** — `app-api/src/modules/families/enums/family-relationship-type.enum.ts`:
```ts
export enum FamilyRelationshipType {
  PARENT = 'parent',
  SPOUSE = 'spouse',
}
```

**`FamilyRelationship` (`family_relationships`)** — nova entidade de junção própria, `.../families/entities/family-relationship.entity.ts`:
- Campos: `type` (`FamilyRelationshipType`, obrigatório) — `@Column({ type: 'enum', enum: FamilyRelationshipType })`.
- Relacionamentos:
  - `family`: `ManyToOne(() => Family, (f) => f.relationships, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'family_id' })`.
  - `sourceCharacter`: `ManyToOne(() => Character, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'source_character_id' })` — para `PARENT`, é o pai/mãe (responsável); para `SPOUSE`, um dos dois cônjuges (par não ordenado, mas armazenado com um lado fixo como "origem").
  - `targetCharacter`: `ManyToOne(() => Character, { onDelete: 'CASCADE' })`, `@JoinColumn({ name: 'target_character_id' })` — para `PARENT`, o filho/filha; para `SPOUSE`, o outro cônjuge.
  - `@Unique(['family', 'sourceCharacter', 'targetCharacter'])` — impede duplicidade exata do mesmo par dentro da mesma família. **Não** cobre sozinho a regra de "`SPOUSE` gravado uma única vez, sem duplicar A→B e B→A" (par invertido) — isso precisa ser validado explicitamente no service (ver regras de negócio abaixo), já que o banco não normaliza a ordem do par.

**Alterações em `Character` (`characters`)**
- **Remover por completo:**
  - A relação `kinships` (`OneToMany(() => CharacterKinship, ...)`) e o import de `CharacterKinship` em `character.entity.ts`.
  - O arquivo `app-api/src/modules/characters/entities/character-kinship.entity.ts` (entidade `CharacterKinship`).
  - Os arquivos `app-api/src/modules/characters/dto/character-kinship-input.dto.ts` e `app-api/src/modules/characters/dto/character-kinship-response.dto.ts`.
  - Todo uso de `CharacterKinship`/`CharacterKinshipInputDto` em `characters.service.ts` (métodos `buildKinships`, `syncKinships`, `assertNoDuplicateRelatives`, `assertNoSelfKinship`, `findCharactersByIds` — reavaliar se `findCharactersByIds` ainda é necessária para outra finalidade; se não for, remover também) e em `characters.controller.ts` (referências a `kinships` no corpo dos endpoints e nas descrições Swagger).
- **Adicionar:**
  - `family`: `ManyToOne(() => Family, { nullable: true, onDelete: 'SET NULL' })`, `@JoinColumn({ name: 'family_id' })` — família primária, opcional.
  - `secondaryFamily`: `ManyToOne(() => Family, { nullable: true, onDelete: 'SET NULL' })`, `@JoinColumn({ name: 'secondary_family_id' })` — família secundária, opcional (ex.: cônjuge vindo de outra família).
  - **Ponto de atenção (regra de negócio não coberta explicitamente no spec):** ao editar um personagem diretamente e definir `familyId`/`secondaryFamilyId`, o spec não esclarece se `familyId === secondaryFamilyId` (mesma família nos dois campos) deve ser bloqueado. Sugestão a confirmar: bloquear com `BadRequestException` em pt-BR (mensagem tipo "Família primária e secundária não podem ser a mesma família."), no mesmo padrão de `assertNoSelfKinship`. Sinalizar a decisão tomada, sem travar a implementação.

#### Migration
- Necessária: **sim**. `synchronize` é `false` — toda alteração de schema requer migration escrita à mão em `src/database/migrations/`, seguindo o padrão granular já usado no projeto (uma migration por tabela/alteração lógica). Último timestamp existente é `1784305620000` (`CreateOrganizationMembersTable`); sugestão de sequência a partir de `1784305630000`:
  1. **`DropCharacterKinshipsTable`** — dropar as duas FKs (`FK_character_kinships_character_id`, `FK_character_kinships_relative_id`), os três índices (`IDX_character_kinships_character_id_relative_id`, `IDX_character_kinships_character_id`, `IDX_character_kinships_relative_id`) e a tabela `character_kinships`, **sem** qualquer migração de dados (o backup, se desejado, é responsabilidade do usuário fora deste processo, conforme já confirmado no spec). O `down()` deve recriar a tabela/índices/FKs exatamente como em `1784305610000-CreateCharacterKinshipsTable.ts` (estrutura vazia, sem repovoar dados).
  2. **`CreateFamiliesTable`** — `CREATE TYPE "public"."families_classification_enum" AS ENUM('royalty', 'nobility', 'commoner')` seguido de `CREATE TABLE "families"` com colunas de `BaseEntity` + `name` (varchar, not null — índice único a confirmar conforme ponto de atenção acima), `reference_image` (varchar, nullable), `description` (text, nullable), `classification` (enum, not null).
  3. **`CreateFamilyTagsTable`** — tabela de junção `(family_id, tag_id)`, PK composta, índices em cada FK, FKs `ON DELETE CASCADE` para `families` e `tags`, no padrão exato de `organization_tags`.
  4. **`CreateFamilyMembersTable`** — colunas de `BaseEntity` + `position_x` (double precision, not null), `position_y` (double precision, not null), `family_id` (uuid, not null, FK `families(id)` `ON DELETE CASCADE`), `character_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`); índice único composto em `(family_id, character_id)`; índices simples em cada FK — no padrão exato de `CreateOrganizationMembersTable`.
  5. **`CreateFamilyRelationshipsTable`** — `CREATE TYPE "public"."family_relationships_type_enum" AS ENUM('parent', 'spouse')` seguido de `CREATE TABLE "family_relationships"` com colunas de `BaseEntity` + `type` (enum, not null), `family_id` (uuid, not null, FK `families(id)` `ON DELETE CASCADE`), `source_character_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`), `target_character_id` (uuid, not null, FK `characters(id)` `ON DELETE CASCADE`); índice único composto em `(family_id, source_character_id, target_character_id)`; índices simples em cada FK.
  6. **`AddFamilyColumnsToCharactersTable`** — `ALTER TABLE "characters" ADD "family_id" uuid` e `ADD "secondary_family_id" uuid` (ambas nullable), com FKs `FK_characters_family_id`/`FK_characters_secondary_family_id` para `families(id)` `ON DELETE SET NULL`, e índices simples em cada coluna nova.
- Atenção ao checklist de consistência migration↔entidade (skill `api-migration`): nomes de coluna em snake_case batendo com `@JoinColumn({ name: '...' })`, `onDelete` de cada FK batendo exatamente com o decorator da entidade (`CASCADE` em `FamilyMember`/`FamilyRelationship`, `SET NULL` em `Character.family`/`Character.secondaryFamily`), e nome do enum Postgres consistente entre a migration e o que o TypeORM vai gerar a partir de `@Column({ type: 'enum', enum: ... })`.
- Como sempre, escrever a(s) migration(s) não aplica no banco por si só — perguntar ao usuário antes de rodar `npm run migration:run`.

#### Controller

**`FamiliesController` (`families.controller.ts`)** — novo módulo `app-api/src/modules/families/`, estrutura completa seguindo `organizations` linha a linha:
- Endpoints:
  - `POST /families` — cria família com `tags`, `members` (array de cards com posição) e `relationships` (vínculos entre os cards) em memória, persistidos junto; ao final, aplica a regra de sincronização de `family`/`secondaryFamily` nos personagens presentes em `members` (ver regras de negócio abaixo).
  - `GET /families` — lista paginada com filtro por `name` (ILIKE), no padrão de `FindOrganizationsQueryDto`/`findAllPaginated`.
  - `GET /families/:id` — retorna a família completa: `tags`, `members` (com o personagem "raso" e a posição), `relationships` (com os dois personagens "rasos" e o `type`), e o campo derivado `looseCharacters` (personagens cuja `family` ou `secondaryFamily` aponta para esta família mas que ainda não têm `FamilyMember` correspondente — fluxo inverso do spec).
  - `PUT /families/:id` — atualiza campos simples, `tags` (substituição total) e sincroniza `members`/`relationships` (substituição total com efeitos colaterais em `Character.family`/`Character.secondaryFamily`, ver abaixo).
  - `DELETE /families/:id` — remove a família; cascata de `family_members`/`family_relationships` automática via FK `ON DELETE CASCADE`; `Character.family`/`Character.secondaryFamily` que apontavam para esta família são automaticamente zerados via `ON DELETE SET NULL` (sem lógica adicional necessária no service para este caso específico).
- DTOs:
  - `CreateFamilyDto`: `name` (string, obrigatório), `referenceImage` (URL, opcional), `description` (string, opcional), `classification` (`FamilyClassification`, obrigatório, `@IsEnum`), `tagIds` (uuid[], opcional), `members` (array opcional de `FamilyMemberInputDto`), `relationships` (array opcional de `FamilyRelationshipInputDto`).
  - `FamilyMemberInputDto`: `characterId` (uuid, obrigatório), `positionX` (number, obrigatório), `positionY` (number, obrigatório).
  - `FamilyRelationshipInputDto`: `sourceCharacterId` (uuid, obrigatório), `targetCharacterId` (uuid, obrigatório), `type` (`FamilyRelationshipType`, obrigatório, `@IsEnum`).
  - `UpdateFamilyDto`: `PartialType(CreateFamilyDto)`.
  - `FindFamiliesQueryDto`: `name` (string, opcional), `page`, `perPage` (padrão `FindOrganizationsQueryDto`).
  - `FamilyResponseDto`: `id`, `name`, `referenceImage`, `description`, `classification`, `tags` (`TagResponseDto[]`), `members` (`FamilyMemberResponseDto[]`), `relationships` (`FamilyRelationshipResponseDto[]`), `looseCharacters` (`CharacterShallowResponseDto[]`, campo derivado/somente leitura, documentado como tal — mesmo padrão de `organizations` no `CharacterResponseDto`), `createdAt`, `updatedAt`.
  - `FamilyMemberResponseDto`: `id`, `positionX`, `positionY`, `character` (`CharacterShallowResponseDto`, reaproveitado de `characters/dto`).
  - `FamilyRelationshipResponseDto`: `id`, `type`, `sourceCharacter` (`CharacterShallowResponseDto`), `targetCharacter` (`CharacterShallowResponseDto`).
  - `FamilyListItemResponseDto`: `id`, `referenceImage`, `name`, `classification`, `tags`.
  - `FamilyShallowResponseDto` (novo, em `families/dto`, para uso em `CharacterResponseDto.family`/`.secondaryFamily`): `id`, `name`, `referenceImage`, `classification`.
  - `PaginatedFamiliesResponseDto`: `data`, `total`, `page`, `perPage`, `totalPages`.

**Alterações em `CharactersController`/`CreateCharacterDto`/`CharacterResponseDto` (mesmo controller, sem mudança de rota)**
- `CreateCharacterDto`: remover `kinships` (e o import de `CharacterKinshipInputDto`); adicionar `familyId` (uuid, opcional) e `secondaryFamilyId` (uuid, opcional), ambos `@IsOptional() @IsUUID()`.
- `UpdateCharacterDto`: inalterado (`PartialType(CreateCharacterDto)` já herda os novos campos).
- `CharacterResponseDto`: remover `kinships` (e o import de `CharacterKinshipResponseDto`); adicionar `family: FamilyShallowResponseDto | null` e `secondaryFamily: FamilyShallowResponseDto | null`.
- `characters.service.ts`:
  - Injetar `Repository<Family>`, `Repository<FamilyMember>` e `Repository<FamilyRelationship>` (via `TypeOrmModule.forFeature` em `characters.module.ts`, sem importar `FamiliesModule` — mesmo padrão já usado com `OrganizationMember`, que é injetado diretamente sem importar `OrganizationsModule`).
  - `findById`: `relations` passa a incluir `family: true, secondaryFamily: true` no lugar de `kinships: { relative: true }`.
  - Novo método privado `findFamilyById(id)`, análogo a `findRaceById`, lançando `NotFoundException('Família não encontrada.')`.
  - `create`: resolver `family`/`secondaryFamily` a partir de `dto.familyId`/`dto.secondaryFamilyId` (`null` se não informado); aplicar a validação do "ponto de atenção" acima (família/secundária iguais) se confirmada.
  - `update`: quando `dto.familyId`/`dto.secondaryFamilyId` for alterado (para outra família ou para vazio) em relação ao valor atual do personagem, remover a linha `FamilyMember` correspondente à família **antiga** (se existir) e as linhas de `FamilyRelationship` daquela família que envolvam este personagem como `sourceCharacter`/`targetCharacter` — implementa o "fluxo inverso" do spec (remover a referência à família pela edição do personagem também desvincula/remove o card da árvore daquela família).

#### Integração com `search`
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`: adicionar `FAMILY = 'family'`.
- `app-api/src/modules/search/search.service.ts`: injetar `Repository<Family>` e incluí-lo no array `linkableEntities`, seguindo exatamente o mesmo padrão de busca por `entity.name ILIKE` já usado para as demais entidades (mesmo `MAX_RESULTS`).
- `app-api/src/modules/search/search.module.ts`: adicionar `Family` ao `TypeOrmModule.forFeature([...])`.

#### Registro do módulo
- `app-api/src/modules/families/families.module.ts`: `TypeOrmModule.forFeature([Family, FamilyMember, FamilyRelationship, Tag, Character])`; `controllers: [FamiliesController]`; `providers: [FamiliesService]`; `exports: [FamiliesService]`.
- `app-api/src/modules/characters/characters.module.ts`: remover `CharacterKinship` do `forFeature`; adicionar `Family`, `FamilyMember`, `FamilyRelationship`.
- `app-api/src/app.module.ts`: adicionar `FamiliesModule` ao array `imports`, junto dos módulos já existentes.

#### Decisões tomadas nos pontos de atenção (confirmadas pelo orquestrador)
- **`Family.name` sem índice único**: seguido o padrão de `Character.name` — `@Column()` simples, sem `@Index({ unique: true })` e sem verificação de duplicidade/`ConflictException` no `FamiliesService`. Justificativa: famílias distintas podem legitimamente compartilhar sobrenome.
- **`familyId === secondaryFamilyId` bloqueado**: `CharactersService` lança `BadRequestException('A família secundária não pode ser a mesma da família primária.')` tanto em `create` quanto em `update` (método privado `assertFamiliesAreDifferent`, no mesmo padrão do antigo `assertNoSelfKinship`), considerando o valor efetivo final de `familyId`/`secondaryFamilyId` (novo valor do DTO quando informado, ou valor atual do personagem quando o campo não for enviado no `update`).
- **Enums em minúsculas**: `FamilyClassification` = `royalty` | `nobility` | `commoner`; `FamilyRelationshipType` = `parent` | `spouse`, exatamente como especificado no plano.
- **Nomes de campo do vínculo**: `sourceCharacter`/`targetCharacter` na entidade/response DTO, `sourceCharacterId`/`targetCharacterId` no DTO de input, mantidos exatamente como no plano.
- **`looseCharacters`**: campo derivado separado em `FamilyResponseDto` (não misturado em `members`), calculado em `FamiliesService.findLooseCharacters` a partir de personagens cuja `family`/`secondaryFamily` aponta para a família mas que não têm `FamilyMember` correspondente. Nenhuma posição é inventada para esses personagens — cabe ao frontend posicioná-los.

#### Pendência que exige atenção do próximo agente com acesso a terminal/filesystem completo
Este agente (`api-dev`) não tem acesso a uma ferramenta de exclusão de arquivos (apenas Read/Grep/Glob/Edit/Write/Skill). Por isso, os três arquivos abaixo — que deveriam ser **fisicamente apagados** do repositório conforme a demanda de remoção completa de `CharacterKinship` — foram apenas esvaziados (conteúdo substituído por um comentário explicando a razão) e precisam ser deletados de fato antes do merge:
- `app-api/src/modules/characters/entities/character-kinship.entity.ts`
- `app-api/src/modules/characters/dto/character-kinship-input.dto.ts`
- `app-api/src/modules/characters/dto/character-kinship-response.dto.ts`

Nenhum código remanescente do projeto importa ou referencia esses três arquivos — a remoção física é segura.

#### Resumo para a etapa 2 (api-dev-doc)
Status: concluído
Entidade: `app-api/src/modules/families/entities/family.entity.ts` (+ `family-member.entity.ts`, `family-relationship.entity.ts`); alterações em `app-api/src/modules/characters/entities/character.entity.ts` (remoção de `kinships`, adição de `family`/`secondaryFamily`)
Migration:
- `app-api/src/database/migrations/1784305630000-DropCharacterKinshipsTable.ts`
- `app-api/src/database/migrations/1784305640000-CreateFamiliesTable.ts`
- `app-api/src/database/migrations/1784305650000-CreateFamilyTagsTable.ts`
- `app-api/src/database/migrations/1784305660000-CreateFamilyMembersTable.ts`
- `app-api/src/database/migrations/1784305670000-CreateFamilyRelationshipsTable.ts`
- `app-api/src/database/migrations/1784305680000-AddFamilyColumnsToCharactersTable.ts`
(nenhuma migration foi executada — `npm run migration:run` depende de confirmação explícita do usuário)
Rotas: POST /families, GET /families, GET /families/:id, PUT /families/:id, DELETE /families/:id (sem mudança de rota em /characters)
Arquivos:
- `app-api/src/modules/families/enums/family-classification.enum.ts`
- `app-api/src/modules/families/enums/family-relationship-type.enum.ts`
- `app-api/src/modules/families/dto/create-family.dto.ts`
- `app-api/src/modules/families/dto/update-family.dto.ts`
- `app-api/src/modules/families/dto/find-families-query.dto.ts`
- `app-api/src/modules/families/dto/family-member-input.dto.ts`
- `app-api/src/modules/families/dto/family-relationship-input.dto.ts`
- `app-api/src/modules/families/dto/family-member-response.dto.ts`
- `app-api/src/modules/families/dto/family-relationship-response.dto.ts`
- `app-api/src/modules/families/dto/family-response.dto.ts`
- `app-api/src/modules/families/dto/family-list-item-response.dto.ts`
- `app-api/src/modules/families/dto/family-shallow-response.dto.ts`
- `app-api/src/modules/families/dto/paginated-families-response.dto.ts`
- `app-api/src/modules/families/families.service.ts`
- `app-api/src/modules/families/families.controller.ts`
- `app-api/src/modules/families/families.module.ts`
- `app-api/src/modules/characters/dto/create-character.dto.ts` (remoção de `kinships`, adição de `familyId`/`secondaryFamilyId`)
- `app-api/src/modules/characters/dto/character-response.dto.ts` (remoção de `kinships`, adição de `family`/`secondaryFamily`)
- `app-api/src/modules/characters/characters.service.ts` (remoção da lógica de `kinships`; adição de `findFamilyById`, `assertFamiliesAreDifferent`, `detachCharacterFromFamily`, sincronização de `family`/`secondaryFamily`)
- `app-api/src/modules/characters/characters.module.ts` (remoção de `CharacterKinship`, adição de `Family`/`FamilyMember`/`FamilyRelationship`)
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts` (adição de `FAMILY`)
- `app-api/src/modules/search/search.service.ts` (registro de `Family` na busca)
- `app-api/src/modules/search/search.module.ts` (registro de `Family` no `forFeature`)
- `app-api/src/app.module.ts` (registro de `FamiliesModule`)
- Esvaziados/pendentes de exclusão física (ver pendência acima): `app-api/src/modules/characters/entities/character-kinship.entity.ts`, `app-api/src/modules/characters/dto/character-kinship-input.dto.ts`, `app-api/src/modules/characters/dto/character-kinship-response.dto.ts`

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger de `FamiliesController`: `@ApiTags('families')`, `@ApiBearerAuth()`/`@UseGuards(JwtAuthGuard)` documentados, `@ApiOperation` em cada endpoint (criar, listar paginado com filtro por nome, buscar por id, atualizar, remover), `@ApiCreatedResponse`/`@ApiOkResponse`/`@ApiNoContentResponse` com os DTOs corretos, `@ApiNotFoundResponse` para família/tag/personagem-membro não encontrados, `@ApiBadRequestResponse` para URL de imagem inválida, `classification`/`type` fora do enum, IDs em formato inválido, duplicidade de par em `members`/`relationships`, autovínculo (`sourceCharacterId === targetCharacterId`) e par `SPOUSE` invertido já existente. `@ApiProperty`/`@ApiPropertyOptional` com `description`/`example` em todos os campos novos, incluindo o campo derivado `looseCharacters` (documentar explicitamente que é somente leitura, calculado no service, não aceito em `create`/`update` — mesmo padrão da nota já usada em `organizations` no `CharacterResponseDto`).
- Atualizar Swagger de `CharactersController`: remover toda menção a "parentesco"/`kinships` nas descrições de `@ApiNotFoundResponse`/`@ApiBadRequestResponse` existentes (ex.: "personagem-relativo não encontrado", "personagem tentando referenciar a si mesmo como parente", "duplicidade de par em parentescos"); adicionar descrições para `familyId`/`secondaryFamilyId` inválidos ou não encontrados, e (se confirmado o ponto de atenção da etapa 1) para `familyId === secondaryFamilyId`. Documentar `family`/`secondaryFamily` em `CharacterResponseDto` com `@ApiPropertyOptional`.
- Atualizar `@ApiProperty({ enum: ... })` de `classification` (`FamilyClassification`) e `type` (`FamilyRelationshipType`) para que o Swagger exponha corretamente as opções fixas.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Consistência migration ↔ entidade nas 6 migrations novas (nomes de coluna snake_case, tipos, nullability, PKs, índices, FKs e nomes de enum Postgres).
  - `ON DELETE` de cada FK: `CASCADE` em `FamilyMember`/`FamilyRelationship` (ambas as pontas), `SET NULL` em `Character.family`/`Character.secondaryFamily`.
  - Regra `PARENT` gravado apenas na direção pai/mãe → filho (sem duplicar a direção inversa) e `SPOUSE` gravado uma única vez (validação explícita no service contra o par invertido, já que a constraint única do banco não normaliza ordem).
  - Sincronização completa da regra de negócio "família primária/secundária" ao salvar a árvore (idempotência ao já estar associado, definição de `secondaryFamily` apenas quando `family` já é diferente, limpeza do campo correto ao remover da árvore) e do fluxo inverso (edição direta do personagem removendo/alterando `familyId`/`secondaryFamilyId` também desvincula o `FamilyMember`/`FamilyRelationship` daquela família).
  - Remoção completa e sem resíduos de `CharacterKinship` (entidade, DTOs, imports, métodos de service, Swagger) — nenhuma referência solta a "parentesco"/`kinships` deve restar no código.
  - Registro completo do módulo `search` (enum, service, module) para `Family`, e `FamiliesModule`/`CharactersModule` registrados corretamente em `app.module.ts`/`characters.module.ts`.
  - Nenhum campo sensível ou não previsto vazado nos DTOs de resposta novos (`FamilyResponseDto`, `FamilyShallowResponseDto`, `FamilyMemberResponseDto`, `FamilyRelationshipResponseDto`).

## Revisão

Revisão realizada sobre os arquivos das etapas 1 (`api-dev`) e 2 (`api-dev-doc`), ambas
marcadas como concluídas. Consistência migration↔entidade (as 6 migrations novas),
`ON DELETE` de cada FK, registro do módulo `search`, registro de `FamiliesModule`/
`CharactersModule`, e ausência de vazamento de campos sensíveis nos DTOs de resposta
novos foram conferidos e estão corretos — nenhum achado nesses pontos. Remoção de
`CharacterKinship`: confirmado que não resta nenhuma referência ativa/import a
`CharacterKinship`/`CharacterKinshipInputDto`/`CharacterKinshipResponseDto` em nenhum
arquivo de código (os três arquivos esvaziados são a pendência de exclusão física já
conhecida, não tratada como achado novo). Os achados abaixo se concentram na regra de
negócio de sincronização família primária/secundária e nas validações de vínculos de
`family_relationships`.

- **`app-api/src/modules/families/families.service.ts:116-138` (método `assertNoDuplicateRelationshipPairs`)** — A validação de "par cônjuge invertido" tem dois problemas em relação à regra confirmada ("`SPOUSE` gravado uma única vez, sem duplicar A→B e B→A" e "`PARENT` gravado apenas na direção pai/mãe → filho, sem duplicar a direção inversa"):
  1. Falso positivo: o `Set<string> seen` guarda apenas a chave `sourceId:targetId`, sem registrar o `type` de cada vínculo. Ao processar um vínculo `SPOUSE`, o código verifica se a chave invertida já está em `seen` — mas essa chave pode ter sido adicionada por um vínculo de tipo **diferente** (ex.: `PARENT`). Um payload como `[{source: A, target: B, type: PARENT}, {source: B, target: A, type: SPOUSE}]` é rejeitado com a mensagem "O vínculo de cônjuge entre estes personagens já foi cadastrado.", embora não exista nenhum vínculo `SPOUSE` duplicado — o vínculo anterior é um `PARENT` em direção inversa, uma combinação que o spec não proíbe.
  2. Ausência de verificação simétrica para `PARENT`: apenas vínculos `SPOUSE` passam pela checagem de par invertido (bloco `if (relationship.type === FamilyRelationshipType.SPOUSE)`); um payload com `[{A,B,PARENT}, {B,A,PARENT}]` (A é pai/mãe de B **e** B é pai/mãe de A simultaneamente, uma contradição genealógica) passa sem erro.
  - Trecho: `if (relationship.type === FamilyRelationshipType.SPOUSE) { const invertedKey = ...; if (seen.has(invertedKey)) { throw ... } }`
  - Sugestão: trocar `seen: Set<string>` por um `Map<string, FamilyRelationshipType>` (chave → tipo). Ao checar a chave invertida, validar que o tipo do registro existente é igual ao do vínculo atual antes de lançar a exceção (em vez de bloquear qualquer tipo prévio). Se a intenção for também impedir a direção invertida de `PARENT`, replicar a mesma checagem para esse tipo (fora do `if` restrito a `SPOUSE`), com mensagem de erro pt-BR específica.

- **`app-api/src/modules/families/families.service.ts:207-228` (método `applyFamilyAssignments`)** — Não há validação de limite: um personagem só pode ter no máximo duas famílias (`family` e `secondaryFamily`). Quando um personagem que já possui `family` e `secondaryFamily` definidos para **duas famílias diferentes** da família sendo salva é adicionado como membro (`members`) de uma **terceira** família, o código cai no branch `else` e sobrescreve silenciosamente `character.secondaryFamily` para apontar para essa terceira família — sem lançar exceção e sem limpar o `FamilyMember`/`FamilyRelationship` do personagem na família que estava em `secondaryFamily` antes. Resultado: a família anteriormente em `secondaryFamily` fica com um `FamilyMember` (card) órfão referenciando um personagem cujo `secondaryFamily` não aponta mais para ela — estado inconsistente entre a árvore daquela família e o campo do personagem.
  - Trecho: `if (!character.family) { character.family = family; } else { character.secondaryFamily = family; }`
  - Sugestão: antes de sobrescrever, verificar se `character.family` e `character.secondaryFamily` já estão ambos definidos (e diferentes desta família); nesse caso, lançar `BadRequestException` em pt-BR (ex.: "O personagem já está associado ao número máximo de duas famílias.") em vez de sobrescrever silenciosamente.

- **`app-api/src/modules/families/families.service.ts:259-332` (método `syncMembers`)** — Ao remover um personagem da lista `members` em um `PUT /families/:id`, o código remove o `FamilyMember` correspondente e limpa `family`/`secondaryFamily` do personagem via `clearFamilyReferenceForCharacters`, mas **não** remove os registros de `FamilyRelationship` desta família em que esse personagem aparece como `sourceCharacter`/`targetCharacter`. Como `UpdateFamilyDto` é `PartialType(CreateFamilyDto)`, o campo `relationships` é opcional — um `PUT` pode enviar `members` sem esse personagem mas omitir `relationships` por completo (`dto.relationships === undefined`), caso em que `syncRelationships` nunca é chamado e os vínculos antigos permanecem no banco, referenciando um personagem sem card na árvore. Esse comportamento é assimétrico ao "fluxo inverso" implementado em `characters.service.ts` (`detachCharacterFromFamily`, linhas 115-131), que remove `FamilyMember` **e** `FamilyRelationship` juntos ao desvincular um personagem de uma família pela edição direta do personagem.
  - Trecho: `if (removedMembers.length > 0) { ...; await this.clearFamilyReferenceForCharacters(family, removedCharacters); await this.familyMembersRepository.remove(removedMembers); }` (sem remoção de `FamilyRelationship` correspondente)
  - Sugestão: em `syncMembers`, ao identificar `removedMembers`, remover também (via `familyRelationshipsRepository.delete`) as `FamilyRelationship` desta família em que o personagem removido aparece como `sourceCharacter` ou `targetCharacter`, independentemente do que `dto.relationships` contiver — espelhando a lógica já usada em `detachCharacterFromFamily`.

- **`app-api/src/modules/families/families.service.ts:169-201, 334-409` (métodos `buildRelationships`/`syncRelationships`)** — Não há validação garantindo que os personagens referenciados em `relationships` (`sourceCharacterId`/`targetCharacterId`) estejam entre os `characterId`s de `members` da mesma requisição (`create`) ou entre os membros atuais da família (`update`). Isso permite gravar vínculos de parentesco para personagens sem card na árvore dessa família, o que diverge da descrição do spec ("a partir de cada card é possível criar vínculos de parentesco... para outros cards já no quadro") e pode gerar uma aresta no quadro (React Flow) apontando para um nó que não existe na resposta de `members`.
  - Trecho: `buildRelationships`/`syncRelationships` resolvem `sourceCharacter`/`targetCharacter` via `findCharactersByIds`, que apenas verifica se os personagens existem — não se são membros da família.
  - Sugestão: validar que todo `sourceCharacterId`/`targetCharacterId` de `relationships` esteja contido no conjunto de `characterId`s de `members` (no `create`) ou nos membros já sincronizados da família (no `update`), lançando `BadRequestException` em pt-BR caso contrário (ex.: "Só é possível criar vínculos entre personagens já adicionados como membros da árvore.").

### Correções aplicadas (pós-revisão)

Os 4 achados foram corrigidos em `app-api/src/modules/families/families.service.ts`
(nenhum descartado):

- **Achado 1 (`assertNoDuplicateRelationshipPairs`)**: `seen` passou de `Set<string>`
  para `Map<string, FamilyRelationshipType>`. A checagem de par invertido agora só
  lança exceção quando o tipo do vínculo já registrado para a chave invertida é igual
  ao do vínculo atual (elimina o falso positivo entre `PARENT`/`SPOUSE` cruzados). A
  checagem de par invertido passou a valer também para `PARENT` (não só `SPOUSE`), com
  mensagem pt-BR própria: "Um personagem não pode ser simultaneamente ascendente e
  descendente do outro." A mensagem de cônjuge duplicado ("O vínculo de cônjuge entre
  estes personagens já foi cadastrado.") foi mantida como estava para o caso `SPOUSE`.
- **Achado 2 (`applyFamilyAssignments`)**: adicionado `else if (!character.secondaryFamily)`
  antes de `else`; quando o personagem já possui `family` **e** `secondaryFamily`
  preenchidos (com duas famílias diferentes desta), a atribuição a uma terceira família
  agora lança `BadRequestException('O personagem já está associado ao número máximo de
  duas famílias.')` em vez de sobrescrever `secondaryFamily` silenciosamente.
- **Achado 3 (`syncMembers`)**: novo método privado `removeRelationshipsForCharacters`
  (espelha `detachCharacterFromFamily` de `characters.service.ts`), chamado em
  `syncMembers` para os `removedCharacterIds` sempre que há membros removidos —
  independentemente do valor de `dto.relationships`. Remove via `familyRelationshipsRepository.delete`
  as `FamilyRelationship` desta família em que o personagem removido aparece como
  `sourceCharacter` ou `targetCharacter`.
- **Achado 4 (`buildRelationships`/`syncRelationships`)**: ambos os métodos passaram a
  receber um parâmetro `memberCharacterIds: Set<string>` e chamam o novo método privado
  `assertRelationshipsWithinMembers`, que lança `BadRequestException('Só é possível criar
  vínculos entre personagens já adicionados como membros da árvore.')` caso algum
  `sourceCharacterId`/`targetCharacterId` não esteja no conjunto. No `create`, o conjunto
  vem de `dto.members` (ids brutos da requisição); no `update`, vem de `dto.members` (se
  enviado) ou dos membros já carregados de `family.members` (se `dto.members` não foi
  enviado no `PUT`).

`app-api/src/modules/families/families.controller.ts`: `@ApiBadRequestResponse` de
`POST /families` e `PUT /families/:id` atualizados para mencionar a contradição de
ascendência (par `PARENT` invertido), o vínculo envolvendo personagem fora dos membros
da árvore, e o limite de duas famílias por personagem.

Arquivos revisados sem achados adicionais: `app-api/src/modules/families/entities/family.entity.ts`,
`app-api/src/modules/families/entities/family-member.entity.ts`,
`app-api/src/modules/families/entities/family-relationship.entity.ts`,
`app-api/src/modules/families/enums/family-classification.enum.ts`,
`app-api/src/modules/families/enums/family-relationship-type.enum.ts`,
`app-api/src/modules/families/families.controller.ts`,
`app-api/src/modules/families/families.module.ts`,
`app-api/src/modules/families/dto/*.ts`,
`app-api/src/database/migrations/1784305630000-DropCharacterKinshipsTable.ts`,
`app-api/src/database/migrations/1784305640000-CreateFamiliesTable.ts`,
`app-api/src/database/migrations/1784305650000-CreateFamilyTagsTable.ts`,
`app-api/src/database/migrations/1784305660000-CreateFamilyMembersTable.ts`,
`app-api/src/database/migrations/1784305670000-CreateFamilyRelationshipsTable.ts`,
`app-api/src/database/migrations/1784305680000-AddFamilyColumnsToCharactersTable.ts`,
`app-api/src/modules/characters/entities/character.entity.ts`,
`app-api/src/modules/characters/characters.controller.ts`,
`app-api/src/modules/characters/characters.module.ts`,
`app-api/src/modules/characters/dto/create-character.dto.ts`,
`app-api/src/modules/characters/dto/update-character.dto.ts`,
`app-api/src/modules/characters/dto/character-response.dto.ts`,
`app-api/src/modules/characters/dto/character-shallow-response.dto.ts`,
`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`,
`app-api/src/modules/search/search.service.ts`,
`app-api/src/modules/search/search.module.ts`,
`app-api/src/app.module.ts`.

### Re-revisão

Re-revisão focada nos 4 achados da seção "## Revisão" acima, à luz das correções
registradas em "Correções aplicadas (pós-revisão)". Arquivos conferidos:
`app-api/src/modules/families/families.service.ts`,
`app-api/src/modules/families/families.controller.ts`,
`app-api/src/modules/families/dto/family-relationship-input.dto.ts`,
`app-api/src/modules/families/entities/family-relationship.entity.ts`,
`app-api/src/modules/characters/characters.service.ts` (para comparar o padrão de
`detachCharacterFromFamily`, usado como referência da correção do achado 3).

- **Achado 1 (`assertNoDuplicateRelationshipPairs`) — corrigido corretamente.**
  `seen` agora é `Map<string, FamilyRelationshipType>`. A checagem de par invertido só
  lança exceção quando `invertedType === relationship.type`, o que elimina o falso
  positivo `PARENT`/`SPOUSE` cruzado (ex.: `[{A,B,PARENT}, {B,A,SPOUSE}]` não é mais
  rejeitado). A checagem simétrica para `PARENT` foi adicionada fora do bloco restrito
  a `SPOUSE`, com mensagem própria ("Um personagem não pode ser simultaneamente
  ascendente e descendente do outro."), bloqueando corretamente
  `[{A,B,PARENT}, {B,A,PARENT}]`. Nenhuma regressão: duplicidade exata do mesmo par
  (mesma direção) continua bloqueada via `seen.has(key)` antes mesmo de checar o
  invertido. Aprovado.

- **Achado 2 (`applyFamilyAssignments`) — mensagem/validação corrigida, mas a correção expõe um problema novo de integridade transacional.**
  O `else` silencioso foi substituído por `else if (!character.secondaryFamily) {...} else { throw new BadRequestException('O personagem já está associado ao número máximo de duas famílias.') }` — a validação em si está correta, em pt-BR, e não há mais sobrescrita silenciosa. Porém nem `create` nem `update`/`syncMembers` executam essas operações dentro de uma transação (`DataSource.transaction`/`queryRunner`), e `applyFamilyAssignments` agora pode lançar exceção **depois** de outras escritas já persistidas no banco:
  - Em `create` (linhas 494-501): `await this.familiesRepository.save(family)` já persiste a família, seus `members` e `relationships` (cascade) antes de `applyFamilyAssignments` ser chamado. Se essa chamada lançar `BadRequestException` (um dos personagens do payload já está no limite de duas famílias), o cliente recebe um erro 400, mas a `Family` e seus `FamilyMember`/`FamilyRelationship` **já foram gravados no banco** — uma família "fantasma" fica persistida mesmo com a criação reportada como falha.
  - Em `update`/`syncMembers` (linhas 309-383): `clearFamilyReferenceForCharacters`, `removeRelationshipsForCharacters` e `familyMembersRepository.remove/save` já escrevem no banco (membros removidos são desvinculados e apagados, novos `FamilyMember` são inseridos) **antes** de `applyFamilyAssignments` rodar por último. Se essa chamada final lançar a exceção de limite de duas famílias, a resposta ao cliente é um erro 400, mas os membros removidos já foram desvinculados/apagados e o novo `FamilyMember` do personagem que estourou o limite já foi inserido na tabela `family_members` — ficando inconsistente com o `Character.family`/`secondaryFamily` dele, que não chegou a ser atualizado.
  - Trecho (`create`): `const saved = await this.familiesRepository.save(family); if (members.length > 0) { await this.applyFamilyAssignments(saved, ...); }`
  - Trecho (`syncMembers`): `await this.familyMembersRepository.save(toSaveMembers); ... if (characters.length > 0) { await this.applyFamilyAssignments(family, characters); }`
  - Sugestão: envolver `create()` e `update()` (ou ao menos o trecho que vai de `familiesRepository.save`/`syncMembers` até `applyFamilyAssignments`) em uma transação única (`DataSource.transaction(async (manager) => {...})` ou `QueryRunner` com `startTransaction`/`commitTransaction`/`rollbackTransaction`), de forma que uma `BadRequestException` de `applyFamilyAssignments` desfaça também as gravações de `members`/`relationships` já realizadas na mesma requisição, evitando estado parcialmente persistido após uma resposta de erro.

- **Achado 3 (`syncMembers`) — corrigido corretamente.**
  `removeRelationshipsForCharacters` é chamado sempre que há `removedMembers`,
  independentemente de `dto.relationships` ter sido enviado, e remove via
  `familyRelationshipsRepository.delete` tanto o lado `sourceCharacter` quanto
  `targetCharacter`, no mesmo padrão de `detachCharacterFromFamily` em
  `characters.service.ts`. Observação menor, não bloqueante: quando **tanto**
  `dto.members` quanto `dto.relationships` são enviados no mesmo `PUT`, os
  `FamilyRelationship` do personagem removido já são apagados por
  `removeRelationshipsForCharacters` dentro de `syncMembers`; em seguida
  `syncRelationships` recalcula `toRemove` a partir do array `family.relationships`
  carregado no início do `update` (ainda contendo essas entidades já apagadas) e chama
  `familyRelationshipsRepository.remove(toRemove)` novamente sobre elas — uma segunda
  tentativa de exclusão sobre registros que já não existem mais. Isso não causa erro
  (TypeORM não lança exceção ao remover uma entidade cujo id já não existe no banco,
  apenas não afeta nenhuma linha) nem estado incorreto, apenas uma query redundante;
  não é necessário corrigir, mas fica registrado.

- **Achado 4 (`buildRelationships`/`syncRelationships`) — corrigido corretamente.**
  Ambos os métodos recebem `memberCharacterIds: Set<string>` e chamam
  `assertRelationshipsWithinMembers`. Em `create`, o conjunto vem de `dto.members ?? []`.
  Em `update`, o conjunto vem de `dto.members` quando informado, ou de
  `family.members` (carregado no início do `update`, antes de qualquer sincronização)
  quando `dto.members` é omitido — confirmado no trecho `dto.members !== undefined ?
  dto.members.map(...) : family.members.map((member) => member.character.id)`. Como
  `family.members` só reflete o estado real quando `dto.members` não foi enviado (e,
  nesse caso, `syncMembers` de fato não é chamado, então o array não fica desatualizado),
  o comportamento é correto tanto no `create` quanto no `update`, inclusive com
  `dto.members` omitido.

- **Contrato público / Swagger** — `FamilyRelationshipInputDto`, `FamilyMemberInputDto`
  e os demais DTOs de `families/dto` permanecem inalterados (nenhuma mudança de
  contrato). `families.controller.ts` teve os `@ApiBadRequestResponse` de
  `POST /families` e `PUT /families/:id` atualizados para mencionar a contradição de
  ascendência (par `PARENT` invertido), o vínculo fora dos membros da árvore e o limite
  de duas famílias por personagem — coerente com as novas mensagens de erro do service.

**Conclusão:** achados 1, 3 e 4 estão corrigidos corretamente, sem regressão. O achado 2
foi corrigido quanto à mensagem/validação em si (não há mais sobrescrita silenciosa),
mas a introdução do novo ponto de lançamento de exceção **sem transação envolvendo as
gravações anteriores** cria um cenário real de estado parcialmente persistido após uma
resposta de erro 400, tanto em `create` quanto em `update`/`syncMembers` — reportado
acima como problema a ser corrigido antes de considerar a demanda finalizada.

### Correção de atomicidade (pós-re-revisão)

Problema de atomicidade do achado 2 corrigido em
`app-api/src/modules/families/families.service.ts` e, pelo mesmo motivo, em
`app-api/src/modules/characters/characters.service.ts` (método `update`, que também
executa `detachCharacterFromFamily` — deletes de `FamilyMember`/`FamilyRelationship` —
antes do `save()` final do personagem, sem transação).

- **Padrão seguido**: o já usado em `app-api/src/modules/eras/eras.service.ts`
  (`DataSource` injetado no construtor via parâmetro simples, sem decorator —
  disponível globalmente porque `TypeOrmModule.forRootAsync` no `AppModule` já
  registra `DataSource` como provider — e `this.dataSource.transaction(async
  (manager) => {...})` envolvendo toda a escrita do método). Nenhuma alteração foi
  necessária em `families.module.ts`/`characters.module.ts` por causa disso.
- **`FamiliesService`**: `create()` e `update()` agora rodam inteiramente dentro de
  `this.dataSource.transaction(...)`. Todos os métodos privados que escrevem no banco
  (`findTagsByIds`, `findCharactersByIds`, `buildMembers`, `buildRelationships`,
  `applyFamilyAssignments`, `clearFamilyReferenceForCharacters`,
  `removeRelationshipsForCharacters`, `syncMembers`, `syncRelationships`, além do novo
  `findFamilyWithRelations` que substitui a query inline de `findById`) passaram a
  receber os repositórios como parâmetro opcional (default = repositório injetado,
  mesmo padrão de `ErasService.findTagsByIds`), e dentro da transação recebem
  explicitamente os repositórios obtidos via `manager.getRepository(...)`. Assim, uma
  `BadRequestException` lançada por `applyFamilyAssignments` (limite de duas famílias),
  por `assertRelationshipsWithinMembers` ou por qualquer outra validação durante a
  sincronização agora desfaz (rollback) toda gravação já feita na mesma requisição —
  incluindo a `Family`/`FamilyMember`/`FamilyRelationship` recém-persistidos em
  `create()`, e os membros removidos/atualizados/adicionados em `update()`/
  `syncMembers()`. `remove()` foi mantido sem transação (é um único `DELETE`, já
  atômico por si só).
- **`CharactersService`**: mesmo tratamento aplicado a `update()` (o único método com
  mais de uma escrita em sequência — `detachCharacterFromFamily` seguido do `save()`
  final do personagem; `create()` só tem uma escrita e não sofre do problema, mantido
  como estava). `findRaceById`, `findFamilyById`, `findTagsByIds` e
  `detachCharacterFromFamily` passaram a aceitar o repositório (ou os dois
  repositórios, no caso de `detachCharacterFromFamily`) como parâmetro opcional com
  default para o injetado, seguindo o mesmo padrão. Agora, se `findFamilyById` lançar
  `NotFoundException` para `secondaryFamilyId` depois que o bloco de `familyId` já
  tiver executado um `detachCharacterFromFamily` (delete de `FamilyMember`/
  `FamilyRelationship` da família antiga), a transação inteira é revertida.
- Nenhuma mensagem de erro pt-BR, nenhum DTO e nenhuma rota foi alterada — a correção é
  estritamente sobre atomicidade.
- **Redundância de dupla exclusão em `syncMembers`/`syncRelationships`** (mencionada na
  re-revisão como não bloqueante): mantida como estava. Eliminá-la exigiria também
  atualizar o array `family.relationships` em memória logo após
  `removeRelationshipsForCharacters` em `syncMembers` para refletir a remoção antes de
  `syncRelationships` recalcular `toRemove` — mudança que toca lógica de negócio já
  validada e aprovada na re-revisão, fora do escopo desta correção (que é só de
  atomicidade) e sem ganho além de evitar uma query redundante e inofensiva. Não
  alterado.

Arquivos alterados nesta correção:
- `app-api/src/modules/families/families.service.ts`
- `app-api/src/modules/characters/characters.service.ts`

Nenhuma alteração em `families.module.ts`, `characters.module.ts`, DTOs, controllers ou
rotas.
