# Task API: Nível (level) em Características, Talentos, Técnicas e Magias

## Contexto
Não existe `spec.md` para esta demanda — as decisões de modelagem já vieram fechadas
na própria solicitação. Trata-se de uma alteração transversal em 4 módulos já
existentes e homogêneos (`characteristics`, `talents`, `techniques`, `spells`, todos
espelhando o mesmo padrão de `talents`, conforme investigação abaixo), mais os
pontos de integração em `entity-links` (cards "Aprimorado de"/"Requisitos"). O módulo
`trainings` fica de fora — não recebe `level`.

Investigação prévia (`app-api/src/modules/{characteristics,talents,techniques,spells,trainings}`,
`app-api/src/modules/entity-links`, `app-api/src/modules/search`) confirmou que:
- As 4 entidades (`Characteristic`, `Talent`, `Technique`, `Spell`) têm hoje os mesmos
  campos base (`name`, `description`, `tags`), diferindo apenas por `Technique`/`Spell`
  terem também `referenceImage`. `Training` tem exatamente o mesmo formato de
  `Talent`/`Characteristic` (sem `referenceImage`) e **não será alterado**.
- Os 4 módulos têm CRUD completo idêntico (`POST`/`GET`/`GET :id`/`PUT`/`DELETE`),
  incluindo suporte a `improvedFrom`/`requirements` via `EntityLinksService`, com
  `@GoogleAccess('read-only')` a nível de controller.
- `EntityReferenceResponseDto.fromResolved(entity, entityType)` (em
  `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`) é o único
  ponto que constrói os itens de `improvedFrom`/`requirements` retornados pela API —
  ele recebe a entidade já carregada (com `tags`) vinda de
  `EntityLinksService.loadReferencesFor`, incluindo o caso de `Training` (que não terá
  `level`).
- `EntityLinksService.resolveReferences` (usada em `create`/`update` só para validar
  que as referências existem) devolve `ResolvedReference { entityType, id, name }`,
  cujo retorno **não é usado** pelos serviços chamadores (só serve para levantar
  `NotFoundException` se algo não existir) — não alimenta nenhuma resposta ao
  cliente. Por isso, ao contrário do que a redação da demanda sugere literalmente,
  **não é necessário alterar `resolveReferences`/`ResolvedReference`, nem
  `loadReferencesFor`** para propagar `level`: basta ajustar `fromResolved`, que já
  recebe a entidade completa (incluindo o novo campo `level`, quando existir) através
  de `loadReferencesFor`. Isso é sinalizado explicitamente abaixo para não gerar
  código morto/redundante.
- `SearchResultItemResponseDto`/`SearchService` (busca global) só expõem
  `id`/`name`/`entityType` — não há `tags`, `description` nem qualquer outro campo de
  detalhe hoje, e a demanda não pede `level` na busca. **Não muda.**
- A migration mais recente do repositório é
  `1784306090000-AddCharacteristicToEntityLinksTable.ts`; o padrão de "adicionar
  coluna NOT NULL em tabela já populada" (nullable → `UPDATE` → `SET NOT NULL`) já é
  usado em `1784306050000-AddKeyAttributeToSkillsTable.ts` e reaproveitado aqui.
- Colunas inteiras no projeto usam `@Column({ type: 'int', ... })` no lado da
  entidade (ex.: `Event.startYear`, `Era.ordering`), e SQL `integer` na migration
  correspondente (ex.: `ChangeEventYearColumnsToInteger`).
- DTOs de corpo (`Create*Dto`) com campos numéricos obrigatórios usam apenas
  `@IsInt()` (+ `@Min()` quando aplicável), **sem** `@Type(() => Number)` — esse
  decorator só é usado nos DTOs de **query** (`Find*QueryDto`), porque ali o valor
  chega como string na querystring (ver `CreateEventDto.startYear` vs.
  `FindEventsQueryDto.startYear`). Como `level` não terá filtro de busca (decisão 6
  da demanda), nenhum `Find*QueryDto` muda, e o `@Type(() => Number)` não se aplica
  a este caso.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/characteristics/entities/characteristic.entity.ts`,
  `app-api/src/modules/talents/entities/talent.entity.ts`,
  `app-api/src/modules/techniques/entities/technique.entity.ts`,
  `app-api/src/modules/spells/entities/spell.entity.ts`
- Migration: `app-api/src/database/migrations/1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`
- Rotas: `POST /characteristics`, `GET /characteristics`, `GET /characteristics/:id`,
  `PUT /characteristics/:id`, `DELETE /characteristics/:id`; idem para `/talents`,
  `/techniques`, `/spells` (endpoints inalterados, apenas contrato de request/response)
- Arquivos: `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
  `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`,
  `app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`,
  `app-api/src/modules/characteristics/characteristics.service.ts`,
  `app-api/src/modules/talents/dto/create-talent.dto.ts`,
  `app-api/src/modules/talents/dto/talent-response.dto.ts`,
  `app-api/src/modules/talents/dto/talent-list-item-response.dto.ts`,
  `app-api/src/modules/talents/talents.service.ts`,
  `app-api/src/modules/techniques/dto/create-technique.dto.ts`,
  `app-api/src/modules/techniques/dto/technique-response.dto.ts`,
  `app-api/src/modules/techniques/dto/technique-list-item-response.dto.ts`,
  `app-api/src/modules/techniques/techniques.service.ts`,
  `app-api/src/modules/spells/dto/create-spell.dto.ts`,
  `app-api/src/modules/spells/dto/spell-response.dto.ts`,
  `app-api/src/modules/spells/dto/spell-list-item-response.dto.ts`,
  `app-api/src/modules/spells/spells.service.ts`,
  `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`.
  `Update*Dto` e `Find*QueryDto` das 4 entidades não precisaram de alteração de código
  (conforme já indicado na seção); `entity-links.service.ts` também não precisou de
  alteração.

#### Entidade

Adicionar um novo campo `level` às 4 entidades, do tipo `int`, `nullable: false`, sem
`default` no lado do TypeORM (o valor de fallback `1` para linhas já existentes é
tratado só na migration, não no modelo):

- `app-api/src/modules/characteristics/entities/characteristic.entity.ts`
- `app-api/src/modules/talents/entities/talent.entity.ts`
- `app-api/src/modules/techniques/entities/technique.entity.ts`
- `app-api/src/modules/spells/entities/spell.entity.ts`

Em cada arquivo, adicionar (sugestão de posição: logo após `name`, mantendo a mesma
posição relativa nas 4 entidades para consistência):

```ts
@ApiProperty({ description: 'Nível da <entidade> (obrigatório)', example: 3 })
@Column({ type: 'int' })
level!: number;
```

**Não alterar** `app-api/src/modules/trainings/entities/training.entity.ts` — treinamentos
não recebem `level`.

Relacionamentos: nenhum relacionamento novo é necessário; `level` é uma coluna
escalar simples, igual às demais (`name`, `description`).

#### Migration

- Necessária: sim.
- Uma única migration nova, cobrindo as 4 tabelas em sequência:
  `app-api/src/database/migrations/1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`
  (timestamp posterior ao mais recente do repositório, `1784306090000`).
- `up()`, para cada uma das 4 tabelas (`characteristics`, `talents`, `techniques`,
  `spells`), na sequência segura para tabelas já populadas (mesmo padrão de
  `1784306050000-AddKeyAttributeToSkillsTable.ts`):
  1. `ALTER TABLE "<tabela>" ADD COLUMN "level" integer`
  2. `UPDATE "<tabela>" SET "level" = 1 WHERE "level" IS NULL`
  3. `ALTER TABLE "<tabela>" ALTER COLUMN "level" SET NOT NULL`
- `down()`: `ALTER TABLE "<tabela>" DROP COLUMN "level"` para as mesmas 4 tabelas, em
  ordem inversa à do `up()`.
- Não mexer na tabela `trainings` nem em `entity_links` (esta migration não adiciona
  coluna nenhuma em `entity_links` — `level` não é uma nova coluna de vínculo, é lida
  diretamente da entidade referenciada em tempo de resposta).
- Revisar o SQL final (se gerado via `npm run migration:generate`) contra a sequência
  acima antes de finalizar.

#### Controller

Não há novos endpoints — os 4 CRUDs já existem. A alteração é nos DTOs de entrada e
saída de cada módulo, para que `level` seja aceito na criação/atualização e devolvido
nas respostas (detalhe e item de lista).

**DTOs de criação** (campo novo, obrigatório):
- `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`
- `app-api/src/modules/talents/dto/create-talent.dto.ts`
- `app-api/src/modules/techniques/dto/create-technique.dto.ts`
- `app-api/src/modules/spells/dto/create-spell.dto.ts`

Adicionar, em cada um (logo após `name`, mesma posição relativa da entidade):

```ts
@ApiProperty({ example: 3, description: 'Nível da <entidade> (obrigatório, número inteiro >= 1)' })
@IsInt({ message: 'O nível deve ser um número inteiro.' })
@Min(1, { message: 'O nível deve ser maior ou igual a 1.' })
level: number;
```

Importar `IsInt`, `Min` de `class-validator` nos 4 arquivos (ainda não importados
neles). **Sem** `@Type(() => Number)` — corpo JSON, não querystring (ver nota na
seção "Contexto").

**DTOs de atualização** — nenhuma alteração de código necessária: os 4
`Update*Dto` já são `PartialType(Create*Dto)`, então `level` passa a ser aceito como
campo opcional automaticamente assim que o `Create*Dto` correspondente for alterado:
- `app-api/src/modules/characteristics/dto/update-characteristic.dto.ts`
- `app-api/src/modules/talents/dto/update-talent.dto.ts`
- `app-api/src/modules/techniques/dto/update-technique.dto.ts`
- `app-api/src/modules/spells/dto/update-spell.dto.ts`

**DTOs de query (`Find*QueryDto`) — sem alteração** (não foi pedido filtro/ordenação
por `level`, decisão 6 da demanda):
- `app-api/src/modules/characteristics/dto/find-characteristics-query.dto.ts`
- `app-api/src/modules/talents/dto/find-talents-query.dto.ts`
- `app-api/src/modules/techniques/dto/find-techniques-query.dto.ts`
- `app-api/src/modules/spells/dto/find-spells-query.dto.ts`

**DTOs de resposta (detalhe)** — adicionar `level` como `@ApiProperty` +
atribuição em `fromEntity`:
- `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`
- `app-api/src/modules/talents/dto/talent-response.dto.ts`
- `app-api/src/modules/techniques/dto/technique-response.dto.ts`
- `app-api/src/modules/spells/dto/spell-response.dto.ts`

```ts
@ApiProperty({ description: 'Nível da <entidade>', example: 3 })
level: number;
// ...
dto.level = <entidade>.level;
```

**DTOs de resposta (item de lista)** — mesma alteração, nos 4 arquivos:
- `app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`
- `app-api/src/modules/talents/dto/talent-list-item-response.dto.ts`
- `app-api/src/modules/techniques/dto/technique-list-item-response.dto.ts`
- `app-api/src/modules/spells/dto/spell-list-item-response.dto.ts`

**Serviços** — persistir e retornar `level` em `create`/`update` (sem novo filtro ou
ordenação por `level` em `findAllPaginated`):
- `app-api/src/modules/characteristics/characteristics.service.ts`
- `app-api/src/modules/talents/talents.service.ts`
- `app-api/src/modules/techniques/techniques.service.ts`
- `app-api/src/modules/spells/spells.service.ts`

Em cada `create(...)`: incluir `level: dto.level` no objeto passado a
`<repo>.create({...})` (junto de `name`, `description`, `tags`, etc.).
Em cada `update(...)`: adicionar, junto às demais atribuições condicionais
(`if (dto.description !== undefined) ...`):

```ts
if (dto.level !== undefined) {
  <entidade>.level = dto.level;
}
```

`findAllPaginated` de cada serviço já carrega a entidade completa (via
`relations: { tags: true }` após a query de ids paginados) para popular a listagem —
como `level` é uma coluna simples (não uma relation), ela já vem incluída
automaticamente nesse segundo `find()`; não é necessário adicionar `level` a nenhum
`select`/`relations` explícito.

**`entity-links`** — expor `level` nos itens de `improvedFrom`/`requirements`:
- `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`:
  - Adicionar campo `level: number | null` com
    `@ApiProperty({ nullable: true, description: 'Nível da entidade referenciada (característica, talento, técnica ou magia); null quando a entidade referenciada for um treinamento (que não possui nível)', example: 3 })`.
  - Ajustar a assinatura de `fromResolved` para aceitar opcionalmente `level` na
    entidade recebida: `entity: { id: string; name: string; tags?: Tag[]; level?: number }`.
  - Em `fromResolved`, atribuir `dto.level = entity.level ?? null;`. Como
    `Training` não terá a propriedade `level`, o valor chega `undefined` e vira
    `null` automaticamente; para `Characteristic`/`Talent`/`Technique`/`Spell` (que
    passarão a ter `level: number`), o valor real é propagado.
- `app-api/src/modules/entity-links/entity-links.service.ts`: **sem alteração**
  (ver nota de investigação acima — `loadReferencesFor` já repassa a entidade
  completa, incluindo o novo campo `level` quando presente, para `fromResolved`;
  `resolveReferences`/`ResolvedReference` não alimentam nenhuma resposta ao cliente
  e não precisam mudar).

**Busca (`SearchService`/`SearchResultItemResponseDto`) — sem alteração.** O
resultado de busca hoje só expõe `id`/`name`/`entityType` (nem `tags` nem
`description` aparecem); a demanda não pede `level` aí, então nada muda em
`app-api/src/modules/search/`.

- Endpoints (inalterados, apenas contrato de request/response mudou):
  `POST /characteristics`, `GET /characteristics`, `GET /characteristics/:id`,
  `PUT /characteristics/:id`, `DELETE /characteristics/:id`; idem para
  `/talents`, `/techniques`, `/spells`.
- DTOs afetados: `Create*Dto`, `*ResponseDto`, `*ListItemResponseDto` das 4
  entidades, mais `EntityReferenceResponseDto` (módulo `entity-links`). `Update*Dto`
  e `Find*QueryDto` não precisam de edição de código.
- Acesso Google: read-only (padrão, inalterado) — os 4 controllers já usam
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a
  nível de controller; esta demanda não altera nível de acesso, apenas o contrato de
  dados dos endpoints já existentes.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger, nos 4 módulos e em `entity-links`:
  - `@ApiProperty` completo (com `example`) para `level` em `Create*Dto`,
    `*ResponseDto` e `*ListItemResponseDto` das 4 entidades.
  - `@ApiProperty` completo para o novo campo `level` em
    `EntityReferenceResponseDto`, deixando claro na `description` que ele é `null`
    para treinamentos.
  - Nenhuma nova `@ApiOperation`/rota é criada; não é necessário adicionar
    `@ApiBadRequestResponse` novo além do já existente (validação de `level`
    inválido já cai no 400 padrão do `ValidationPipe` com mensagens pt-BR definidas
    nos decorators do DTO).

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - As 4 entidades (`Characteristic`, `Talent`, `Technique`, `Spell`) com `level`
    (`@Column({ type: 'int' })`, sem `nullable: true`, sem `default`) e `Training`
    **sem** nenhuma alteração.
  - A migration única (`AddLevelToCharacteristicsTalentsTechniquesSpellsTable`)
    cobrindo exatamente as 4 tabelas na sequência
    `ADD COLUMN` (nullable) → `UPDATE ... SET level = 1 WHERE level IS NULL` →
    `ALTER COLUMN ... SET NOT NULL`, com `down()` fazendo `DROP COLUMN` nas 4
    tabelas — e nenhuma alteração incidental em `trainings` ou `entity_links`.
  - `level` obrigatório (`@IsInt`, `@Min(1)`, sem `@Type(() => Number)`) nos 4
    `Create*Dto`, propagado automaticamente como opcional nos `Update*Dto` via
    `PartialType`, e persistido/atualizado corretamente nos 4 serviços (`create`
    grava `level: dto.level`; `update` só sobrescreve quando
    `dto.level !== undefined`).
  - `level` presente nas 4 `*ResponseDto` e `*ListItemResponseDto` (Swagger e
    `fromEntity`).
  - `EntityReferenceResponseDto.level` populado corretamente: número real para
    característica/talento/técnica/magia, `null` para treinamento — sem nenhuma
    alteração desnecessária em `resolveReferences`/`loadReferencesFor`.
  - Confirmar que `SearchService`/`SearchResultItemResponseDto` permanecem
    intocados (fora de escopo, conforme decisão 7 da demanda).
  - Mensagens de validação em pt-BR consistentes com o restante do projeto.
  - Nenhuma alteração em `app-web`.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:

- Entidades: `app-api/src/modules/characteristics/entities/characteristic.entity.ts`,
  `app-api/src/modules/talents/entities/talent.entity.ts`,
  `app-api/src/modules/techniques/entities/technique.entity.ts`,
  `app-api/src/modules/spells/entities/spell.entity.ts` — todas com
  `level!: number` via `@Column({ type: 'int' })`, sem `nullable`/`default`, na mesma
  posição relativa (logo após `name`), com `@ApiProperty` coerente. Confirmado que
  `app-api/src/modules/trainings/entities/training.entity.ts` permanece intocado (sem
  campo `level`).
- Migration: `app-api/src/database/migrations/1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`
  — cobre exatamente as 4 tabelas (`characteristics`, `talents`, `techniques`,
  `spells`) na sequência `ADD COLUMN` (nullable) → `UPDATE ... SET level = 1 WHERE
  level IS NULL` → `ALTER COLUMN ... SET NOT NULL`, com `down()` fazendo `DROP COLUMN`
  nas mesmas 4 tabelas em ordem inversa. Sem alteração incidental em `trainings` ou
  `entity_links`. Consistente com o padrão de `1784306050000-AddKeyAttributeToSkillsTable.ts`.
- DTOs de criação: `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
  `app-api/src/modules/talents/dto/create-talent.dto.ts`,
  `app-api/src/modules/techniques/dto/create-technique.dto.ts`,
  `app-api/src/modules/spells/dto/create-spell.dto.ts` — `level` obrigatório com
  `@IsInt`/`@Min(1)` e mensagens em pt-BR, sem `@Type(() => Number)` (correto, corpo
  JSON), `@ApiProperty` com `example`.
- DTOs de atualização (`update-characteristic.dto.ts`, `update-talent.dto.ts`,
  `update-technique.dto.ts`, `update-spell.dto.ts`) — confirmados inalterados,
  continuam `PartialType(Create*Dto)`, `level` já opcional automaticamente.
- DTOs de query (`find-characteristics-query.dto.ts` e equivalentes) — confirmados
  inalterados, sem filtro/ordenação por `level`.
- DTOs de resposta (detalhe e item de lista) das 4 entidades — `level` presente com
  `@ApiProperty` e atribuído em `fromEntity`, sem vazamento de campos internos.
- Serviços (`characteristics.service.ts`, `talents.service.ts`,
  `techniques.service.ts`, `spells.service.ts`) — `create` grava `level: dto.level`;
  `update` só sobrescreve quando `dto.level !== undefined`; `findAllPaginated`
  continua populando `level` automaticamente via `relations: { tags: true }` no
  segundo `find()`, sem necessidade de alteração.
- `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts` — campo
  `level: number | null` com `@ApiProperty` correto (`nullable: true` e descrição
  explicando o caso de treinamento); `fromResolved` aceita `level?: number` na
  entidade recebida e atribui `dto.level = entity.level ?? null`, produzindo `null`
  para `Training` (que não tem a propriedade) e o valor real para as demais 4
  entidades.
- `app-api/src/modules/entity-links/entity-links.service.ts` — confirmado inalterado;
  `resolveReferences`/`ResolvedReference`/`loadReferencesFor` não precisavam mudar,
  como antecipado na investigação da task, e de fato não mudaram.
- `app-api/src/modules/search/` — confirmado que nenhum arquivo do módulo referencia
  `level`; `SearchService`/`SearchResultItemResponseDto` permanecem intocados, fora de
  escopo conforme decisão 7 da demanda.
- Controllers (`characteristics.controller.ts` e equivalentes) — confirmado que
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  continuam presentes a nível de controller, sem alteração de nível de acesso.
- Nenhuma alteração encontrada em `app-web/`.