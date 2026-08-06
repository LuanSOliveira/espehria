# Task API: Saber editável + notas na ficha

## Contexto
Não há `spec.md` para esta demanda — as decisões de negócio já foram fechadas
diretamente com o usuário e estão reproduzidas abaixo. Esta demanda tem 4 partes;
as partes 2 e 3 (puramente visuais, sem impacto de contrato) não fazem parte deste
plano. Este plano cobre apenas:

- **Parte 1** — campo booleano `editable` na entidade `Knowledge`, propagado pelos 5
  módulos donos e pelo snapshot `saberes` da ficha.
- **Parte 4** — nota de texto livre por saber, associada à ficha + ao `id` real do
  registro de `Knowledge`, salva via endpoint dedicado de autosave, preservada em
  recomputes do snapshot enquanto o saber continuar presente na ficha.

## Investigação de código (referência para o api-dev)

- `Knowledge` (`app-api/src/modules/knowledges/entities/knowledge.entity.ts`): entidade
  com `sortOrder`, `title`, `gradation` (M2O `ProficiencyGradation`), e exatamente um
  owner não nulo entre `ownerTalent`/`ownerTraining`/`ownerCharacteristic`/
  `ownerBiography`/`ownerRace` (via `CHECK` `num_nonnulls(...) = 1`).
- `KnowledgeItemInputDto`/`KnowledgeItemResponseDto` (`app-api/src/modules/knowledges/dto/`)
  são os DTOs **compartilhados** usados diretamente (sem redeclaração) pelos 5 módulos
  donos — confirmado em `create-race.dto.ts` (`knowledges?: KnowledgeItemInputDto[]`) e em
  `races.service.ts` (`knowledges: KnowledgeItemResponseDto[]`). O mesmo padrão se repete em
  talents, trainings, characteristics e biographies. **Consequência importante**: alterar os
  DTOs e o `KnowledgesService` compartilhados propaga automaticamente para os 5 módulos —
  não é necessário editar talents/trainings/characteristics/biographies/races.service.ts nem
  seus DTOs além do que já reusam `KnowledgeItemInputDto`/`KnowledgeItemResponseDto`.
- `KnowledgesService` (`app-api/src/modules/knowledges/knowledges.service.ts`): expõe
  `validateAndResolveItems` (resolve/normaliza título+graduação), `validateList` (rejeita
  título duplicado), `replaceItems` (delete+insert por owner) e `loadItemsFor` (leitura
  ordenada por `sortOrder`, mapeada com `KnowledgeItemResponseDto.fromResolved`).
- `SheetKnowledgeSnapshotEntry`/`SheetKnowledgeSnapshot`
  (`app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts`): hoje
  `{ id, title, gradation: { id, name, level }, sourceName }`, agrupado em
  `{ race, biography, trainings, talents, characteristics }`.
- `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`): `saberes` é coluna
  `jsonb` com default `{ race: [], biography: [], trainings: [], talents: [],
  characteristics: [] }`. Outras colunas de snapshot (`melhorias`, `defeitos`,
  `proficiencias`, `proficienciasAjustadas`) seguem o mesmo padrão de coluna `jsonb`
  dedicada na própria ficha.
- `SheetsService.recomputeKnowledges` (`app-api/src/modules/sheets/sheets.service.ts`,
  ~linha 255): reconstrói `sheet.saberes` do zero a cada chamada, iterando
  `orderedSources` (raça e/ou biografia, únicas origens hoje vinculáveis) e aplicando
  "maior graduação vence" por título normalizado (trim + lowercase). É chamado em
  `linkRace`, `unlinkRace`, `linkBiography` e `unlinkBiography` — sempre antes do
  `save(sheet)` final desses métodos.
- `SheetsService.findAccessibleById` já centraliza a checagem de posse (usuário
  `provider: 'google'` só acessa fichas próprias; demais usuários acessam qualquer
  ficha) — é o método correto a reutilizar para o novo endpoint, no mesmo padrão de
  `linkRace`/`linkBiography`/`resolveProficiencyAdjustment`.
- `SheetResponseDto.fromEntity` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`)
  monta `saberes` via `SheetKnowledgeSnapshotResponseDto.fromEntity(sheet.saberes)`, que
  por sua vez mapeia cada entrada com
  `SheetKnowledgeSnapshotEntryResponseDto.fromRaw(entry)`.
- Endpoints de ficha existentes (`app-api/src/modules/sheets/sheets.controller.ts`) seguem
  o padrão: `@UseGuards(JwtAuthGuard)` a nível de controller, `@CurrentUser()` para o
  usuário autenticado, `ParseUUIDPipe` nos params de rota, e retorno de `SheetResponseDto`
  completo em todo endpoint de mutação (não apenas o fragmento alterado).

## Decisão técnica: onde persistir a nota do saber (Parte 4)

**Decisão: nova coluna `jsonb` dedicada na própria ficha, mapeando `knowledgeId → texto`
(não dentro das entradas do snapshot `saberes`).**

Nome proposto: `Sheet.saberesAnotacoes` (coluna `saberes_anotacoes`, tipo `jsonb`,
`NOT NULL DEFAULT '{}'::jsonb`), tipada como `Record<string, string>`.

Justificativa (as três opções levantadas foram avaliadas):

1. **Campo dentro da própria entrada do snapshot `saberes`** — rejeitada. O
   `recomputeKnowledges` **reconstrói `sheet.saberes` do zero** a cada
   link/unlink de raça/biografia (novo objeto, novos arrays, uma entrada por título
   vencedor). Guardar a nota dentro da entrada exigiria ler o snapshot anterior,
   localizar a entrada por `id`, extrair a nota e reinjetá-la na entrada recém-criada
   correspondente — lógica replicada em quatro pontos de chamada
   (`linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography`), e qualquer bug ou
   esquecimento futuro nessa reinjeção apaga silenciosamente dado de usuário sem
   nenhum erro visível. É exatamente o risco que o pedido pede para pesar.
2. **Tabela relacional dedicada** (ex.: `sheet_knowledge_notes` com FK para `sheets` e
   `knowledges`) — descartada por desproporcional ao caso de uso: é essencially um mapa
   chave→texto por ficha, sem necessidade de índices, queries ou relações próprias; o
   projeto já usa colunas `jsonb` na própria ficha para dados igualmente "por ficha e
   por origem" (`melhorias`, `defeitos`, `proficiencias`, `proficienciasAjustadas`,
   `saberes`), então uma tabela dedicada quebraria esse padrão sem ganho real.
3. **Coluna `jsonb` separada, mapeando `knowledgeId → texto`** — escolhida. Ela nunca é
   tocada por `recomputeKnowledges` na reconstrução de `saberes`, então o valor
   **sobrevive automaticamente** a qualquer recompute, independentemente de bugs na
   lógica de reconstrução do snapshot. A "reaplicação" acontece de forma trivial e seguro
   **na montagem da resposta** (`SheetResponseDto`/`SheetKnowledgeSnapshotResponseDto`),
   por simples lookup `saberesAnotacoes[entry.id]` — não há reconstrução de estado
   envolvida, só leitura.

**Poda (descarte) de notas órfãs**: como pedido, a nota deve ser descartada quando aquele
saber específico deixa de existir na ficha. Isso é resolvido dentro do próprio
`recomputeKnowledges`: depois de montar o novo `saberes`, colete o conjunto de todos os
`id` presentes nas 5 categorias e filtre `sheet.saberesAnotacoes`, mantendo apenas as
chaves cujo `id` ainda está nesse conjunto (`sheet.saberesAnotacoes = filtered`). Isso
cobre tanto o caso "entidade de origem desvinculada" quanto o caso de um saber que deixa
de ser o vencedor da disputa "maior graduação vence" — em ambos os casos o `id`
correspondente deixa de aparecer no `saberes` ativo da ficha, logo, do ponto de vista da
ficha, o saber "deixou de existir" nela. **Atenção do api-dev**: como o `id` de uma
entrada em `saberes` é sempre o `id` real e imutável do registro de `Knowledge` de onde
ela veio, a preservação por chave funciona sem nenhuma lógica adicional — só a poda
acima precisa ser implementada explicitamente.

**Assunção sinalizada (não fechada explicitamente com o usuário)**: o endpoint de
salvar a nota valida que o saber referenciado tem `editable = true` no momento da
gravação, retornando `409 Conflict` caso contrário — camada de defesa adicional, já que
a exibição condicional do input é responsabilidade do frontend e não deveria ser a única
barreira. Se este comportamento não for desejado, ajustar antes de implementar.

## Contrato de API (fonte de verdade para o planejamento web)

> Esta seção é normativa. O planejamento web deve tratá-la como fonte de verdade do
> contrato de backend para esta demanda.

### Campo booleano `editable`

Nome exato do campo, idêntico em todos os pontos abaixo: **`editable`** (`boolean`).

- `KnowledgeItemInputDto` (input de `knowledges` em talents/trainings/characteristics/
  biographies/races): campo opcional `editable?: boolean`; ausência equivale a `false`.
- `KnowledgeItemResponseDto` (output de `knowledges` nesses mesmos 5 módulos): campo
  obrigatório `editable: boolean`.
- Cada entrada de `saberes.*` no `SheetResponseDto` (ver formato completo abaixo): campo
  obrigatório `editable: boolean`, refletindo o valor do registro de `Knowledge` de
  origem no momento do último recompute.

### Formato final de uma entrada do snapshot `saberes` (após as duas partes)

Cada item de `saberes.race[]`, `saberes.biography[]`, `saberes.trainings[]`,
`saberes.talents[]` e `saberes.characteristics[]` no `SheetResponseDto` passa a ter,
exatamente:

```json
{
  "id": "uuid — id real do registro de Knowledge",
  "title": "string",
  "gradation": { "id": "uuid", "name": "string", "level": 0 },
  "sourceName": "string",
  "editable": false,
  "note": "string ou null — null quando nenhuma nota foi salva ainda para este saber"
}
```

`note` é computado no momento da resposta (lookup em `Sheet.saberesAnotacoes` pelo `id`
da entrada) — não é um campo persistido dentro do snapshot em si, mas o contrato de API
o expõe sempre junto de cada entrada, como acima.

### Endpoint novo: salvar nota de um saber

```
PUT /sheets/:id/knowledge-notes/:knowledgeId
```

- `:id` — uuid da ficha.
- `:knowledgeId` — uuid do saber, exatamente o mesmo valor do campo `id` de uma entrada
  em `saberes.*` da ficha (isto é, o `id` real do registro de `Knowledge`).
- Body:
  ```json
  { "note": "string — livre, string vazia permitida para limpar a nota, máx. 2000 caracteres" }
  ```
- Resposta `200 OK`: corpo **idêntico em forma** ao de todos os outros endpoints de
  mutação da ficha — `SheetResponseDto` completo (mesmo shape de `PUT /sheets/:id/race`,
  `PUT /sheets/:id/biography` etc.), com a entrada correspondente em `saberes.*` já
  refletindo o `note` recém-salvo.
- Erros:
  - `404` — ficha não encontrada ou não pertence ao usuário autenticado (mesma
    mensagem/padrão dos demais endpoints de ficha).
  - `404` — `knowledgeId` não corresponde a nenhum `id` presente em `saberes.*` da
    ficha no momento da requisição.
  - `409` — o saber referenciado tem `editable = false` (ver assunção sinalizada acima).
  - `400` — `note` ausente, não-string, ou maior que 2000 caracteres.

### O que muda e o que não muda

- **Mudam** (mesmo método + path, novo campo no payload): todos os endpoints que
  aceitam/retornam `knowledges` em talents, trainings, characteristics, biographies e
  races (ganham `editable` no array `knowledges`, request e response); todos os
  endpoints de `SheetsController` que retornam `SheetResponseDto` (`POST /sheets`,
  `GET /sheets/:id`, `PUT /sheets/:id`, `PUT/DELETE /sheets/:id/race`,
  `PUT/DELETE /sheets/:id/biography`, `PUT /sheets/:id/proficiency-adjustments/:adjustmentId`)
  — ganham `editable` e `note` em cada entrada de `saberes.*`.
- **Não muda**: `GET /sheets` (`PaginatedSheetsResponseDto` → `SheetListItemResponseDto`,
  que não expõe `saberes`); `GET /sheets/campaign-options`; `DELETE /sheets/:id`; nenhum
  endpoint muda de método ou de path.
- **Novo**: `PUT /sheets/:id/knowledge-notes/:knowledgeId`, descrito acima.

## Etapas

### 1. api-dev

#### Entidade

- **`Knowledge`** (`app-api/src/modules/knowledges/entities/knowledge.entity.ts`):
  adicionar campo `editable: boolean` — `@Column({ type: 'boolean', default: false })`.
  Sem novos relacionamentos.
- **`Sheet`** (`app-api/src/modules/sheets/entities/sheet.entity.ts`): adicionar campo
  `saberesAnotacoes: Record<string, string>` —
  `@Column({ type: 'jsonb', default: {}, name: 'saberes_anotacoes' })`. Sem novos
  relacionamentos.
- Nenhuma entidade nova é criada.

#### Migration

- Necessária: **sim** (duas alterações de schema, `synchronize` é `false`):
  1. `ALTER TABLE knowledges ADD COLUMN editable boolean NOT NULL DEFAULT false;` — como
     a tabela já pode ter dados, o `DEFAULT false` no próprio `ADD COLUMN` garante que
     linhas existentes recebam `false` automaticamente, sem passo de backfill separado.
     `down`: `DROP COLUMN editable`.
  2. `ALTER TABLE sheets ADD COLUMN saberes_anotacoes jsonb NOT NULL DEFAULT '{}'::jsonb;`
     — mesma lógica, sem backfill necessário (fichas existentes começam com mapa vazio).
     `down`: `DROP COLUMN saberes_anotacoes`.
  - Pode ser uma única migration (ex.: `AddEditableToKnowledgesAndNotesToSheets`) ou duas
    migrations separadas seguindo a convenção de nomes já usada em
    `app-api/src/database/migrations/` (ex.: `AddXToYTable`) — critério do api-dev.

#### Controller

- **Nenhum endpoint novo em talents/trainings/characteristics/biographies/races** — eles
  reusam diretamente `KnowledgeItemInputDto`/`KnowledgeItemResponseDto`, então basta
  alterar o DTO compartilhado (ver abaixo) para o campo `editable` propagar
  automaticamente em todos os endpoints existentes desses 5 módulos que já
  aceitam/retornam `knowledges`.
- **DTOs a alterar** (compartilhados, `app-api/src/modules/knowledges/dto/`):
  - `KnowledgeItemInputDto`: adicionar `editable?: boolean` (`@IsOptional()`,
    `@IsBoolean()`), default `false` quando ausente — aplicar o default em
    `KnowledgesService.validateAndResolveItems`/`replaceItems` (não no DTO em si, já que
    `class-validator` não gera default automaticamente sem `@Transform`/valor padrão
    explícito no service).
  - `KnowledgeItemResponseDto`: adicionar `editable: boolean` (`@ApiProperty`), preenchido
    em `fromResolved` a partir de `item.editable`.
  - `KnowledgesService`: `ResolvedKnowledgeItem` ganha `editable: boolean`;
    `validateAndResolveItems` captura `item.editable ?? false`; `replaceItems` inclui
    `editable: resolvedItem.editable` no `rowData` de cada linha criada.
- **`SheetsController`** (`app-api/src/modules/sheets/sheets.controller.ts`): um endpoint
  novo:
  - `PUT /sheets/:id/knowledge-notes/:knowledgeId` — `@UseGuards(JwtAuthGuard)` (herdado
    do controller), `@Param('id', ParseUUIDPipe)`, `@Param('knowledgeId', ParseUUIDPipe)`,
    `@Body() dto: UpdateSheetKnowledgeNoteDto`, `@CurrentUser() currentUser: User`, retorna
    `SheetResponseDto.fromEntity(...)`. Documentar com `@ApiOperation`, `@ApiOkResponse`,
    `@ApiNotFoundResponse`, `@ApiConflictResponse`, `@ApiBadRequestResponse` no mesmo
    padrão dos demais endpoints de ficha.
- **DTO novo**: `UpdateSheetKnowledgeNoteDto`
  (`app-api/src/modules/sheets/dto/update-sheet-knowledge-note.dto.ts`) — campo
  `note: string` com `@IsString()` e `@MaxLength(2000)` (sem `@IsNotEmpty()`, já que
  string vazia é uma limpeza válida de nota).
- **`SheetsService`** — novo método `updateKnowledgeNote(id, knowledgeId, dto,
  currentUser)`:
  1. `findAccessibleById(id, currentUser)`; `404` (mensagem padrão "Ficha não encontrada
     ou não pertence ao usuário.") se nulo.
  2. Procurar `knowledgeId` em todas as 5 categorias de `sheet.saberes`; `404` ("Saber
     não encontrado nesta ficha.") se não encontrado.
  3. Se a entrada encontrada tiver `editable === false`, `409` ("Este saber não é
     editável e não pode receber uma nota.") — ver assunção sinalizada.
  4. `sheet.saberesAnotacoes = { ...sheet.saberesAnotacoes, [knowledgeId]: dto.note }`.
  5. `save(sheet)`.
- **`recomputeKnowledges`** (mesmo arquivo, ~linha 255): dois ajustes:
  1. Ao montar cada `entry: SheetKnowledgeSnapshotEntry`, incluir `editable: item.editable`
     (lido do registro `Knowledge`, já carregado via `relations: { gradation: true }` —
     não precisa de nova relation, `editable` é coluna própria da entidade).
  2. Após montar o novo `saberes`, coletar o conjunto de todos os `id` presentes nas 5
     categorias e podar `sheet.saberesAnotacoes`, mantendo só as chaves cujo `id` está
     nesse conjunto (ver seção de decisão técnica acima).
- **`SheetKnowledgeSnapshotEntry`** (interface,
  `app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts`): adicionar
  `editable: boolean`. **Não** adicionar `note` aqui — ele não é persistido no snapshot
  (ver decisão técnica).
- **`SheetKnowledgeSnapshotEntryResponseDto`**
  (`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts`):
  adicionar `editable: boolean` e `note: string | null`; alterar `fromRaw` para receber um
  segundo parâmetro `note: string | null` e preenchê-lo, além de `dto.editable =
  entry.editable`.
- **`SheetKnowledgeSnapshotResponseDto`**
  (`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts`): alterar
  `fromEntity` para receber também `notes: Record<string, string>` e repassar
  `notes[entry.id] ?? null` para cada chamada de `SheetKnowledgeSnapshotEntryResponseDto.fromRaw`.
- **`SheetResponseDto.fromEntity`**
  (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`): trocar a chamada para
  `SheetKnowledgeSnapshotResponseDto.fromEntity(sheet.saberes, sheet.saberesAnotacoes)`.
- **`SheetListItemResponseDto`**: nenhuma alteração (não expõe `saberes`).
- **Acesso Google**: `SheetsController` não é um CRUD de gerenciamento — é o recurso de
  dados do próprio usuário, já protegido por `findAccessibleById` (usuários
  `provider: 'google'` só acessam fichas próprias, mesma regra de
  `linkRace`/`linkBiography`/demais mutações da ficha). Não se aplica o nível de acesso
  `read-only`/`blocked` da skill `api-permissao-google-readonly` aqui, pelo mesmo motivo
  que os demais endpoints de mutação de `SheetsController` (`linkRace`, `linkBiography`,
  `resolveProficiencyAdjustment`, `update`) já não o aplicam.

Status: concluído

Nota do api-dev: além do descrito acima, foi necessário ajustar
`races.service.ts`/`biographies.service.ts`/`characteristics.service.ts`/
`trainings.service.ts`/`talents.service.ts` (método `update` de cada um) — o trecho que
reconstrói `effectiveKnowledges` a partir dos itens já persistidos (usado quando
`dto.knowledges` não é enviado na atualização) não incluía `editable` no objeto
`KnowledgeItemInputDto` reconstruído, o que faria `editable` ser silenciosamente
resetado para `false` em qualquer atualização dessas entidades que não reenviasse
`knowledges` explicitamente. Adicionado `editable: item.editable` em cada um dos 5
pontos para preservar o valor corretamente. Não há endpoint, rota ou regra de negócio
nova além do especificado — apenas a correção necessária para o campo `editable`
realmente propagar sem perda de dado.

Entidade: `app-api/src/modules/knowledges/entities/knowledge.entity.ts` (campo
`editable`); `app-api/src/modules/sheets/entities/sheet.entity.ts` (campo
`saberesAnotacoes`)
Migration: `app-api/src/database/migrations/1784306400000-AddEditableToKnowledgesAndNotesToSheets.ts`
Rotas: `PUT /sheets/:id/knowledge-notes/:knowledgeId` (nova); demais rotas de
talents/trainings/characteristics/biographies/races/sheets inalteradas em
método/caminho, apenas com `editable`/`note` propagados nos payloads existentes.
Arquivos:
- `app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts`
- `app-api/src/modules/knowledges/dto/knowledge-item-response.dto.ts`
- `app-api/src/modules/knowledges/knowledges.service.ts`
- `app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts`
- `app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts`
- `app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts`
- `app-api/src/modules/sheets/dto/sheet-response.dto.ts`
- `app-api/src/modules/sheets/dto/update-sheet-knowledge-note.dto.ts` (novo)
- `app-api/src/modules/sheets/sheets.service.ts`
- `app-api/src/modules/sheets/sheets.controller.ts`
- `app-api/src/modules/races/races.service.ts`
- `app-api/src/modules/biographies/biographies.service.ts`
- `app-api/src/modules/characteristics/characteristics.service.ts`
- `app-api/src/modules/trainings/trainings.service.ts`
- `app-api/src/modules/talents/talents.service.ts`

### 2. api-dev-doc
- Depende da etapa 1

Documentação Swagger/OpenAPI completa adicionada aos seguintes arquivos:

**DTOs de Conhecimento:**
- `KnowledgeItemInputDto`: Campo `editable` com `@ApiPropertyOptional` documentando que permite anotações livres na ficha
- `KnowledgeItemResponseDto`: Campo `editable` com `@ApiProperty` documentando que permite anotações livres na ficha

**DTOs de Snapshot de Saberes:**
- `SheetKnowledgeSnapshotEntryResponseDto`: 
  - Campo `editable`: Documentado como "Indica se este saber permite anotações livres (define a permissão no saber original)"
  - Campo `note`: Documentado como "Nota livre associada a este saber na ficha (computada por lookup, máx. 2000 caracteres). Nula quando nenhuma nota foi salva ainda. Não é persistida dentro do snapshot — sobrevive a recomputes enquanto o saber permanecer na ficha"
- `SheetKnowledgeSnapshotResponseDto`: Descrições de categorias ajustadas para melhor clareza

**DTO de entrada para novo endpoint:**
- `UpdateSheetKnowledgeNoteDto`: Campo `note` com `@ApiProperty` documentando limite de 2000 caracteres e permissão de string vazia

**Controller:**
- `SheetsController.updateKnowledgeNote`: Novo endpoint `PUT /sheets/:id/knowledge-notes/:knowledgeId` com decorators completos:
  - `@ApiOperation`: Summary descritivo
  - `@ApiOkResponse`: Retorna `SheetResponseDto` completo
  - `@ApiNotFoundResponse`: Cobre ficha não encontrada e saber não encontrado
  - `@ApiConflictResponse`: Cobre caso de saber não editável (editable = false)
  - `@ApiBadRequestResponse`: Cobre validação de ID e nota

Documentação deixa bem explícita a diferença entre `editable` (permissão no saber original) e `note` (texto de anotação associado à ficha, computado por lookup, não persistido dentro do snapshot).

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. Checagens específicas
realizadas, por ordem de risco:

1. **Preservação das notas no recompute** — confirmado. `Sheet.saberesAnotacoes`
   (`app-api/src/modules/sheets/entities/sheet.entity.ts:107-108`) é coluna `jsonb`
   dedicada, nunca tocada na reconstrução de `sheet.saberes` dentro de
   `recomputeKnowledges` (`app-api/src/modules/sheets/sheets.service.ts:256-332`). O
   método só poda chaves órfãs ao final (`sheet.saberesAnotacoes = Object.fromEntries(...)`,
   linhas 327-331), filtrando por um `Set` com todos os `id` ainda presentes nas 5
   categorias do novo snapshot — uma nota de saber que permanece na ficha nunca é
   tocada, pois sua chave (`id` real e imutável do `Knowledge`) segue no `Set`. O `note`
   é resolvido só na resposta, por lookup (`SheetKnowledgeSnapshotResponseDto.fromEntity`,
   `notes[entry.id] ?? null`), nunca persistido dentro do snapshot. Testei mentalmente os
   4 fluxos que chamam `recomputeKnowledges` (`linkRace`, `unlinkRace`, `linkBiography`,
   `unlinkBiography`) e em nenhum deles `saberesAnotacoes` é reatribuído fora desse
   método — link/unlink de Raça ou Biografia não causa perda de nota de saberes que
   permaneceram.

2. **Migration ↔ entidade** — `1784306400000-AddEditableToKnowledgesAndNotesToSheets.ts`
   confere exatamente com `knowledge.entity.ts` (`editable boolean NOT NULL DEFAULT
   false`, coerente com `@Column({ type: 'boolean', default: false })`, que o TypeORM
   trata como `NOT NULL` por padrão) e com `sheet.entity.ts` (`saberes_anotacoes jsonb
   NOT NULL DEFAULT '{}'`, coerente com `@Column({ type: 'jsonb', default: {}, name:
   'saberes_anotacoes' })`). O padrão `DEFAULT '{}'` sem cast explícito para jsonb já é
   usado em migration anterior (`1784306360000-AddProficienciesSnapshotsToSheets.ts`,
   `DEFAULT '[]'`), então é consistente com o projeto. `down()` reverte as duas
   alterações na ordem inversa correta (`sheets.saberes_anotacoes` primeiro, depois
   `knowledges.editable`). Timestamp (`1784306400000`) é o mais recente da pasta,
   sem colisão.

3. **Aderência ao contrato (linhas 113-175)** — `editable?: boolean` opcional em
   `KnowledgeItemInputDto`, `editable: boolean` obrigatório em
   `KnowledgeItemResponseDto`; entrada de `saberes.*` no formato exato `{ id, title,
   gradation: { id, name, level }, sourceName, editable, note }` (ver
   `SheetKnowledgeSnapshotEntryResponseDto`/`fromRaw`); endpoint `PUT
   /sheets/:id/knowledge-notes/:knowledgeId` com `UpdateSheetKnowledgeNoteDto { note:
   string, @IsString(), @MaxLength(2000), sem @IsNotEmpty() }` retornando
   `SheetResponseDto.fromEntity(...)` completo. Erros implementados exatamente como
   especificado: 404 (ficha inacessível via `findAccessibleById`), 404 (`knowledgeId`
   não encontrado em nenhuma das 5 categorias de `sheet.saberes`), 409 (`editable ===
   false`), 400 (via `ValidationPipe` global + decorators do DTO).

4. **Correção extra do api-dev (`editable: item.editable` em 5 services)** — validado
   nos 5 pontos (`races.service.ts:494`, `biographies.service.ts:407`,
   `characteristics.service.ts:510`, `trainings.service.ts:488`,
   `talents.service.ts:489`), todos dentro do mesmo bloco `if (effectiveKnowledges ===
   undefined)` que reconstrói o array a partir de `loadItemsFor` quando `dto.knowledges`
   não é reenviado. A correção é necessária e suficiente: sem ela, `editable` seria
   perdido silenciosamente em qualquer `update` que omitisse `knowledges`. Nenhum efeito
   colateral identificado — o campo é só mais uma propriedade copiada do item já
   carregado, sem impacto em `title`/`gradation` nem na lógica de resolução por título
   normalizado.

5. **Segurança** — `updateKnowledgeNote` usa `findAccessibleById(id, currentUser)` (mesma
   checagem de posse dos demais métodos de `SheetsService`) e valida `entry.editable`
   antes de gravar a nota, lançando `ConflictException` com mensagem em pt-BR quando
   `false`. Rota protegida por `@UseGuards(JwtAuthGuard)` herdado do controller. Não se
   aplica `GoogleAccessGuard`/`@GoogleAccess`, pelo mesmo motivo já documentado para os
   demais endpoints de mutação de `SheetsController` (recurso de dados do próprio
   usuário, não CRUD de gerenciamento) — consistente com o padrão de
   `linkRace`/`linkBiography`/`resolveProficiencyAdjustment`.

Arquivos revisados: `app-api/src/modules/knowledges/entities/knowledge.entity.ts`,
`app-api/src/modules/sheets/entities/sheet.entity.ts`,
`app-api/src/database/migrations/1784306400000-AddEditableToKnowledgesAndNotesToSheets.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-response.dto.ts`,
`app-api/src/modules/knowledges/knowledges.service.ts`,
`app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-response.dto.ts`,
`app-api/src/modules/sheets/dto/update-sheet-knowledge-note.dto.ts`,
`app-api/src/modules/sheets/sheets.service.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`,
`app-api/src/modules/races/races.service.ts`,
`app-api/src/modules/biographies/biographies.service.ts`,
`app-api/src/modules/characteristics/characteristics.service.ts`,
`app-api/src/modules/trainings/trainings.service.ts`,
`app-api/src/modules/talents/talents.service.ts`.