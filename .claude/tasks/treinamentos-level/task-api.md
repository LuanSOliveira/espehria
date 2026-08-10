# Task API: Nível (level) em Treinamentos

## Contexto
Não existe `spec.md` para esta demanda — ela já vem fechada na própria solicitação.
Trata-se da continuação direta da demanda anterior documentada em
`.claude/tasks/habilidades-level/task-api.md`, que adicionou `level` a
`characteristics`, `talents`, `techniques` e `spells`, mas explicitamente deixou
`trainings` de fora. Esta task traz `trainings` para o mesmo padrão, replicando
exatamente a dinâmica já aprovada e implementada para `talents`/`characteristics`.

Investigação prévia (`app-api/src/modules/trainings`, `app-api/src/modules/talents`,
`app-api/src/modules/entity-links`, `app-api/src/database/migrations`) confirmou que:
- `Training` (`app-api/src/modules/trainings/entities/training.entity.ts`) tem hoje
  exatamente o mesmo formato de `Talent`/`Characteristic` antes da demanda anterior
  (`name`, `description`, `tags`, sem `referenceImage`), e o módulo `trainings` tem o
  mesmo CRUD completo (`POST`/`GET`/`GET :id`/`PUT`/`DELETE`) com suporte a
  `improvedFrom`/`requirements`/`additionalAbilities` (via `EntityLinksService`),
  `improvements`/`flaws` (via `ImprovementFlawsService`), `proficiencies` (via
  `ProficienciesService`) e `knowledges` (via `KnowledgesService`) — todos esses
  recursos adicionais já existem em `trainings` e **não são afetados** por esta
  demanda; só o campo `level` é adicionado, seguindo o padrão de `talents`.
- O controller `TrainingsController` já usa `@UseGuards(JwtAuthGuard,
  GoogleAccessGuard)` + `@GoogleAccess('read-only')` a nível de controller —
  inalterado por esta demanda.
- A migration mais recente do repositório é
  `1784306530000-CreateShieldTagsTable.ts`; a nova migration desta demanda usará o
  timestamp `1784306540000`, seguindo o mesmo padrão seguro de "adicionar coluna NOT
  NULL em tabela já populada" (nullable → `UPDATE` → `SET NOT NULL`) usado em
  `1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`.
- `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts` já possui o
  campo `level: number | null` (introduzido na demanda anterior) e a lógica
  `fromResolved`/`dto.level = entity.level ?? null` já é genérica o suficiente: ela
  não precisa de nenhuma alteração de código para passar a propagar `level` também
  para treinamentos, pois `EntityLinksService.loadReferencesFor` já carrega a
  entidade `Training` completa (via relation `targetTraining: true`) e a repassa
  para `fromResolved` — assim que `Training` ganhar a coluna `level`, o valor passa a
  ser propagado automaticamente. **Muda apenas a `@ApiProperty.description`** do
  campo `level` nesse DTO, que hoje afirma "null quando a entidade referenciada for
  um treinamento (que não possui nível)" — isso fica factualmente incorreto após esta
  demanda. A nova descrição deve refletir que `level` é `null` apenas para o caso de
  `biography` (biografia), que é o único `ReferenceableEntityType` (ver
  `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`:
  `TRAINING`, `TALENT`, `TECHNIQUE`, `SPELL`, `CHARACTERISTIC`, `BIOGRAPHY`) que
  permanece sem nível depois desta mudança.
- `EntityLinksService` (`resolveReferences`, `replaceLinks`, `loadReferencesFor`,
  `ResolvedReference`) **não precisa de nenhuma alteração** — mesma conclusão já
  registrada na demanda anterior, agora também válida para `Training`.
- `UpdateTrainingDto` (`app-api/src/modules/trainings/dto/update-training.dto.ts`) já
  é `PartialType(CreateTrainingDto)` — confirmado, não precisa de edição de código;
  `level` passa a ser aceito como campo opcional automaticamente assim que
  `CreateTrainingDto` for alterado.
- `FindTrainingsQueryDto`
  (`app-api/src/modules/trainings/dto/find-trainings-query.dto.ts`) não recebe filtro
  nem ordenação por `level`, consistente com a decisão já tomada para as outras 4
  entidades na demanda anterior (nenhum motivo novo identificado para divergir aqui).
- `SearchService`/`SearchResultItemResponseDto` (`app-api/src/modules/search/`)
  seguem fora de escopo — o resultado de busca global só expõe
  `id`/`name`/`entityType`, sem `tags`, `description` ou qualquer outro campo de
  detalhe; a demanda não pede `level` na busca.
- Colunas inteiras no projeto usam `@Column({ type: 'int', ... })` no lado da
  entidade e SQL `integer` na migration. DTOs de corpo (`Create*Dto`) com campos
  numéricos obrigatórios usam apenas `@IsInt()`/`@Min()`, sem
  `@Type(() => Number)` (esse decorator é só para DTOs de query, onde o valor chega
  como string na querystring) — `CreateTrainingDto.level` segue a mesma convenção de
  `CreateTalentDto.level`.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/trainings/entities/training.entity.ts`
- Migration: `app-api/src/database/migrations/1784306540000-AddLevelToTrainingsTable.ts`
- Rotas: `POST /trainings`, `GET /trainings`, `GET /trainings/:id`,
  `PUT /trainings/:id`, `DELETE /trainings/:id` (inalteradas, apenas contrato de
  request/response mudou)
- Arquivos: `app-api/src/modules/trainings/dto/create-training.dto.ts`,
  `app-api/src/modules/trainings/dto/training-response.dto.ts`,
  `app-api/src/modules/trainings/dto/training-list-item-response.dto.ts`,
  `app-api/src/modules/trainings/trainings.service.ts`,
  `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`
  (apenas ajuste da `@ApiProperty.description` de `level`)

#### Entidade
- Entidade: `app-api/src/modules/trainings/entities/training.entity.ts`
- Campos: adicionar `level` (`int`, `nullable: false`, sem `default` no lado do
  TypeORM — o fallback `1` para linhas já existentes é tratado só na migration), na
  mesma posição relativa usada em `Talent`/`Characteristic` (logo após `name`, antes
  de `description`):

  ```ts
  @ApiProperty({ description: 'Nível do treinamento (obrigatório)', example: 3 })
  @Column({ type: 'int' })
  level!: number;
  ```

- Relacionamentos: nenhum relacionamento novo é necessário; `level` é uma coluna
  escalar simples, igual às demais (`name`, `description`). Nenhuma alteração nos
  relacionamentos já existentes de `Training` com `TrainingTag`, `EntityLink`,
  `ImprovementFlaw`, `Proficiency` ou `Knowledge`.

#### Migration
- Necessária: sim.
- Nova migration:
  `app-api/src/database/migrations/1784306540000-AddLevelToTrainingsTable.ts`
  (timestamp posterior ao mais recente do repositório, `1784306530000`).
- `up()`, na sequência segura para tabela já populada (mesmo padrão de
  `1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`):
  1. `ALTER TABLE "trainings" ADD COLUMN "level" integer`
  2. `UPDATE "trainings" SET "level" = 1 WHERE "level" IS NULL`
  3. `ALTER TABLE "trainings" ALTER COLUMN "level" SET NOT NULL`
- `down()`: `ALTER TABLE "trainings" DROP COLUMN "level"`.
- Não mexer em nenhuma outra tabela (`talents`, `characteristics`, `techniques`,
  `spells`, `entity_links` etc. já foram tratadas na migration anterior e não são
  afetadas por esta).
- Se gerada via `npm run migration:generate`, revisar o SQL final contra a sequência
  acima antes de finalizar.

#### Controller
Não há novos endpoints — o CRUD de `trainings` já existe
(`POST /trainings`, `GET /trainings`, `GET /trainings/:id`, `PUT /trainings/:id`,
`DELETE /trainings/:id`). A alteração é nos DTOs de entrada e saída do módulo, para
que `level` seja aceito na criação/atualização e devolvido nas respostas (detalhe e
item de lista), mais o ajuste de descrição em `entity-links`.

**DTO de criação** — `app-api/src/modules/trainings/dto/create-training.dto.ts`:
adicionar campo novo, obrigatório, logo após `name` (mesma posição relativa de
`CreateTalentDto`):

```ts
@ApiProperty({
  example: 3,
  description: 'Nível do treinamento (obrigatório, número inteiro >= 1)',
})
@IsInt({ message: 'O nível deve ser um número inteiro.' })
@Min(1, { message: 'O nível deve ser maior ou igual a 1.' })
level: number;
```

Importar `IsInt`, `Min` de `class-validator` (ainda não importados neste arquivo).
**Sem** `@Type(() => Number)` — corpo JSON, não querystring.

**DTO de atualização** — `app-api/src/modules/trainings/dto/update-training.dto.ts`:
sem alteração de código, já é `PartialType(CreateTrainingDto)`, `level` passa a ser
aceito como campo opcional automaticamente.

**DTO de query** — `app-api/src/modules/trainings/dto/find-trainings-query.dto.ts`:
sem alteração (nenhum filtro/ordenação por `level` foi pedido, consistente com a
decisão já tomada para as demais 4 entidades).

**DTO de resposta (detalhe)** —
`app-api/src/modules/trainings/dto/training-response.dto.ts`: adicionar `level` como
`@ApiProperty` (logo após `name`) e atribuição em `fromEntity`:

```ts
@ApiProperty({ description: 'Nível do treinamento', example: 3 })
level: number;
// ...
dto.level = training.level;
```

**DTO de resposta (item de lista)** —
`app-api/src/modules/trainings/dto/training-list-item-response.dto.ts`: mesma
alteração (campo `level` + atribuição em `fromEntity`).

**Serviço** — `app-api/src/modules/trainings/trainings.service.ts`:
- Em `create(...)`: incluir `level: dto.level` no objeto passado a
  `this.trainingsRepository.create({...})` (junto de `name`, `description`).
- Em `update(...)`: adicionar, junto às demais atribuições condicionais (ex.:
  `if (dto.description !== undefined) ...`):

  ```ts
  if (dto.level !== undefined) {
    training.level = dto.level;
  }
  ```

- `findAllPaginated` já carrega a entidade completa via `this.trainingsRepository.find(...)`
  para popular a listagem (após a query de ids paginados) — como `level` é uma
  coluna simples (não uma relation), já vem incluída automaticamente nesse segundo
  `find()`; não é necessário adicionar `level` a nenhum `select` explícito na
  `queryBuilder` de ids nem em `find()`.

**`entity-links`** — ajustar apenas a documentação do campo já existente:
- `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`: atualizar
  a `@ApiProperty.description` de `level` de "Nível da entidade referenciada
  (característica, talento, técnica ou magia); null quando a entidade referenciada
  for um treinamento (que não possui nível)" para algo como "Nível da entidade
  referenciada (característica, talento, técnica, magia ou treinamento); null quando
  a entidade referenciada for uma biografia (que não possui nível)". **Não alterar**
  o campo `level: number | null`, a assinatura de `fromResolved`
  (`entity: { id: string; name: string; tags?: Tag[]; level?: number }`) nem a lógica
  `dto.level = entity.level ?? null` — já funcionam corretamente para `Training` assim
  que a entidade ganhar a coluna `level` (o valor real passa a ser propagado ao invés
  de `undefined`/`null`).
- `app-api/src/modules/entity-links/entity-links.service.ts`: **sem alteração**
  (`loadReferencesFor` já carrega `Training` completo via relation `targetTraining:
  true` e repassa para `fromResolved`; `resolveReferences`/`ResolvedReference` não
  alimentam nenhuma resposta ao cliente e não precisam mudar).

**Busca (`SearchService`/`SearchResultItemResponseDto`) — sem alteração.** Resultado
de busca global só expõe `id`/`name`/`entityType`; `level` não é pedido aí.

- Endpoints (inalterados, apenas contrato de request/response mudou):
  `POST /trainings`, `GET /trainings`, `GET /trainings/:id`, `PUT /trainings/:id`,
  `DELETE /trainings/:id`.
- DTOs afetados: `CreateTrainingDto`, `TrainingResponseDto`,
  `TrainingListItemResponseDto`, mais a descrição de `EntityReferenceResponseDto`
  (módulo `entity-links`). `UpdateTrainingDto` e `FindTrainingsQueryDto` não
  precisam de edição de código.
- Acesso Google: read-only (padrão, inalterado) — `TrainingsController` já usa
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a
  nível de controller; esta demanda não altera nível de acesso, apenas o contrato de
  dados dos endpoints já existentes.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1 (concluída).
- Cobrir no Swagger:
  - `@ApiProperty` completo (com `example`) para `level` em `CreateTrainingDto`,
    `TrainingResponseDto` e `TrainingListItemResponseDto`.
  - Ajuste da `@ApiProperty.description` de `level` em
    `EntityReferenceResponseDto` (módulo `entity-links`), deixando claro que agora
    `level` é `null` apenas para o caso de `biography`, não mais para `training`.
  - Nenhuma nova `@ApiOperation`/rota é criada; não é necessário adicionar
    `@ApiBadRequestResponse` novo além do já existente (validação de `level`
    inválido já cai no 400 padrão do `ValidationPipe`, com mensagens pt-BR definidas
    nos decorators do DTO).

#### Arquivos alterados:
- Nenhum arquivo foi alterado nesta etapa. A documentação Swagger foi completada na etapa 1 (api-dev):
  - `app-api/src/modules/trainings/dto/create-training.dto.ts` - `@ApiProperty` com `example` para `level`
  - `app-api/src/modules/trainings/dto/training-response.dto.ts` - `@ApiProperty` com `example` para `level`
  - `app-api/src/modules/trainings/dto/training-list-item-response.dto.ts` - `@ApiProperty` com `example` para `level`
  - `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts` - descrição de `level` ajustada
  - `app-api/src/modules/trainings/trainings.controller.ts` - documentação Swagger já completa

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - `Training` com `level` (`@Column({ type: 'int' })`, sem `nullable: true`, sem
    `default`) na mesma posição relativa usada em `Talent`/`Characteristic` (logo
    após `name`).
  - A migration `AddLevelToTrainingsTable` cobrindo exatamente a tabela `trainings`
    na sequência `ADD COLUMN` (nullable) → `UPDATE ... SET level = 1 WHERE level IS
    NULL` → `ALTER COLUMN ... SET NOT NULL`, com `down()` fazendo `DROP COLUMN` — e
    nenhuma alteração incidental em outras tabelas (`talents`, `characteristics`,
    `techniques`, `spells`, `entity_links`).
  - `level` obrigatório (`@IsInt`, `@Min(1)`, sem `@Type(() => Number)`) em
    `CreateTrainingDto`, propagado automaticamente como opcional em
    `UpdateTrainingDto` via `PartialType`, e persistido/atualizado corretamente em
    `TrainingsService` (`create` grava `level: dto.level`; `update` só sobrescreve
    quando `dto.level !== undefined`).
  - `level` presente em `TrainingResponseDto` e `TrainingListItemResponseDto`
    (Swagger e `fromEntity`).
  - `EntityReferenceResponseDto.level` continua populado corretamente: número real
    para característica/talento/técnica/magia/treinamento, `null` apenas para
    biografia — sem nenhuma alteração de código em
    `resolveReferences`/`loadReferencesFor`/`fromResolved` além da
    `@ApiProperty.description`.
  - Confirmar que `SearchService`/`SearchResultItemResponseDto` permanecem
    intocados (fora de escopo).
  - `FindTrainingsQueryDto` permanece sem filtro/ordenação por `level`.
  - Mensagens de validação em pt-BR consistentes com o restante do projeto.
  - Nenhuma alteração em `app-web`.

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como "Status: concluído" —
revisão executada normalmente sobre os arquivos listados.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-api/src/modules/trainings/entities/training.entity.ts` — coluna `level`
  adicionada como `@Column({ type: 'int' })`, sem `nullable: true` e sem `default`,
  na posição correta (logo após `name`, antes de `description`), com `@ApiProperty`
  coerente; idêntico ao padrão já usado em `Talent`.
- `app-api/src/database/migrations/1784306540000-AddLevelToTrainingsTable.ts` —
  timestamp posterior ao mais recente do repositório (`1784306530000`, confirmado
  não haver colisão), sequência segura `ADD COLUMN` (nullable) → `UPDATE ... SET
  level = 1 WHERE level IS NULL` → `ALTER COLUMN ... SET NOT NULL`, `down()` faz
  `DROP COLUMN`; nenhuma outra tabela é tocada.
- `app-api/src/modules/trainings/dto/create-training.dto.ts` — `level` obrigatório,
  `@IsInt`/`@Min(1)` com mensagens em pt-BR, sem `@Type(() => Number)` (correto para
  corpo JSON), `IsInt`/`Min` importados corretamente de `class-validator`.
- `app-api/src/modules/trainings/dto/update-training.dto.ts` — inalterado,
  `PartialType(CreateTrainingDto)` já propaga `level` como opcional.
- `app-api/src/modules/trainings/dto/training-response.dto.ts` e
  `training-list-item-response.dto.ts` — `level` presente como `@ApiProperty` e
  atribuído corretamente em `fromEntity` (`dto.level = training.level`).
- `app-api/src/modules/trainings/trainings.service.ts` — `create()` grava
  `level: dto.level` no `repository.create(...)`; `update()` só sobrescreve quando
  `dto.level !== undefined`; `findAllPaginated` continua populando `level`
  automaticamente via `find()` da entidade completa, sem necessidade de `select`
  explícito.
- `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts` — apenas a
  `@ApiProperty.description` de `level` foi ajustada, refletindo corretamente que
  agora `level` é `null` só para `biography`; `level: number | null`, assinatura de
  `fromResolved` e a lógica `dto.level = entity.level ?? null` permanecem intactas.
- `app-api/src/modules/entity-links/entity-links.service.ts` — confirmado sem
  alteração; `loadReferencesFor` já carrega `targetTraining` completo via relation e
  repassa para `fromResolved`, propagando `level` automaticamente assim que a coluna
  existir na entidade.
- `app-api/src/modules/trainings/dto/find-trainings-query.dto.ts` — confirmado sem
  filtro/ordenação por `level`, consistente com a decisão já tomada para as demais 4
  entidades.
- `app-api/src/modules/trainings/trainings.controller.ts` — nenhuma rota nova;
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  mantidos a nível de controller; documentação Swagger (`@ApiOperation`,
  `@ApiOkResponse`, `@ApiBadRequestResponse` etc.) consistente com o comportamento
  real dos endpoints.
- `app-api/src/modules/search/` — confirmado intocado (fora de escopo, resultado de
  busca global não expõe `level`).
- Nenhuma alteração em `app-web`.