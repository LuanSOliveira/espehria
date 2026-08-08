# Task API: Pontos de Vida (Raça e Ficha)

## Contexto
Ver .claude/tasks/ficha-pontos-de-vida/spec.md

## Etapas

### 1. api-dev

#### Entidade

**Raça (`app-api/src/modules/races/entities/race.entity.ts`)**
- Adicionar coluna `hitPoints` logo após `description` (linhas 32-33 atuais):
  - `@ApiProperty()` (obrigatório, não opcional, já que a coluna é `NOT NULL`).
  - `@Column({ type: 'int', name: 'hit_points' })`
  - Tipo `number`, sem `nullable`.
- Sem outros relacionamentos envolvidos.

**Ficha (`app-api/src/modules/sheets/entities/sheet.entity.ts`)**
- Adicionar duas colunas escalares novas, posicionadas próximas a `level` (campo numérico simples já existente) para manter coesão lógica:
  - `currentHitPoints`: `@ApiPropertyOptional()`, `@Column({ type: 'int', nullable: true, name: 'current_hit_points' })`, tipo `number | null`.
  - `temporaryHitPoints`: `@ApiPropertyOptional()`, `@Column({ type: 'int', nullable: true, name: 'temporary_hit_points' })`, tipo `number | null`.
- Nenhum campo de "PV máximo" é persistido na entidade — ele é calculado no client (base 0 + `hitPoints` da raça vinculada), mesmo modelo já usado para Classe de Armadura. Nenhuma alteração adicional é necessária na entidade `Sheet` para o PV máximo além de garantir que `race.hitPoints` já viaje na resposta (ver seção Controller/DTOs).
- Sem novos relacionamentos.

#### Migration
- Necessária: sim — duas migrations (uma por tabela, seguindo a convenção de uma alteração de schema por migration já usada no projeto):
  1. **Races — `hit_points`**: espelhar o padrão de `AddArmorClassKeyAttributeToSheetsTable` (`app-api/src/database/migrations/1784306420000-AddArmorClassKeyAttributeToSheetsTable.ts`), adaptado para o caso descrito no spec:
     - `ALTER TABLE "races" ADD "hit_points" integer DEFAULT 0` (usar `DEFAULT` apenas como mecanismo transitório para o backfill).
     - `UPDATE "races" SET "hit_points" = 0 WHERE "hit_points" IS NULL` (redundante com o `DEFAULT`, mas explícito e seguro caso o `DEFAULT` não tenha sido aplicado por algum motivo).
     - `ALTER TABLE "races" ALTER COLUMN "hit_points" SET NOT NULL`.
     - `ALTER TABLE "races" ALTER COLUMN "hit_points" DROP DEFAULT` — obrigatório conforme decisão registrada no spec: a coluna não deve manter `DEFAULT` residual, para que inserts diretos no banco (fora da API) não recebam `0` silenciosamente.
     - `down()`: `ALTER TABLE "races" DROP COLUMN "hit_points"`.
  2. **Sheets — `current_hit_points` e `temporary_hit_points`**: colunas nullable, sem backfill e sem `NOT NULL` (permanecem nullable indefinidamente, pois "vazio" é um estado de negócio válido, não um estado transitório de migração):
     - `ALTER TABLE "sheets" ADD "current_hit_points" integer`.
     - `ALTER TABLE "sheets" ADD "temporary_hit_points" integer`.
     - Nenhum `DEFAULT`, nenhum backfill, nenhum `NOT NULL`.
     - `down()`: `DROP COLUMN` das duas colunas.

#### Controller

**Races (`app-api/src/modules/races/races.controller.ts` + `races.service.ts`)**
- Nenhum novo endpoint — apenas os DTOs existentes de `POST /races` e `PUT /races/:id` passam a exigir/aceitar `hitPoints`.
- DTOs a alterar:
  - `CreateRaceDto` (`app-api/src/modules/races/dto/create-race.dto.ts`): adicionar `hitPoints` logo após `description` (linhas 41-47 atuais), obrigatório:
    - `@ApiProperty({ example: 5, description: 'Pontos de Vida da raça (inteiro, mínimo 1, obrigatório)' })`
    - `@Type(() => Number)`, `@IsInt({ message: 'Os Pontos de Vida devem ser um número inteiro.' })`, `@Min(1, { message: 'Os Pontos de Vida devem ser maior ou igual a 1.' })`.
  - `UpdateRaceDto` (`app-api/src/modules/races/dto/update-race.dto.ts`): hoje é apenas `PartialType(CreateRaceDto)`, o que tornaria `hitPoints` opcional — como o spec exige obrigatoriedade também na atualização, é necessário sobrescrever explicitamente a propriedade `hitPoints` na subclasse (mesma técnica de redeclarar um campo após `PartialType` para restaurar obrigatoriedade), repetindo os mesmos decorators de validação do `CreateRaceDto` (sem `@IsOptional`).
  - `RaceResponseDto` (`app-api/src/modules/races/dto/race-response.dto.ts`): adicionar `hitPoints: number` logo após `description` (linhas 38-42 atuais), com `@ApiProperty()`; incluir `dto.hitPoints = race.hitPoints;` em `fromEntity()`.
  - `races.service.ts`: no `create()`, incluir `hitPoints: dto.hitPoints` na criação da entidade; no `update()`, adicionar `if (dto.hitPoints !== undefined) { race.hitPoints = dto.hitPoints; }` (mesmo padrão dos demais campos escalares) — como `hitPoints` é obrigatório no DTO de update, na prática sempre virá definido, mas o guard `!== undefined` mantém consistência com o restante do método.
- Acesso Google: read-only (padrão, já vigente no controller via `@GoogleAccess('read-only')` a nível de classe — nenhuma mudança de política necessária, pois não há novo endpoint).

**Sheets (`app-api/src/modules/sheets/sheets.controller.ts` + `sheets.service.ts`)**
- Nenhum novo endpoint — os campos novos entram no `PUT /sheets/:id` já existente.
- DTOs a alterar:
  - `UpdateSheetDto` (`app-api/src/modules/sheets/dto/update-sheet.dto.ts`): adicionar `currentHitPoints` e `temporaryHitPoints`, cada um seguindo o padrão já usado em `referenceImage`/`campaignId` para aceitar `null` explícito distinto de omissão:
    - `@ApiPropertyOptional({ nullable: true, example: 12, description: 'PV atual da ficha (inteiro, aceita negativos). Omitir o campo mantém o valor atual inalterado; enviar "null" explicitamente limpa o campo' })`
    - `@IsOptional()`, `@ValidateIf((_object, value) => value !== null)`, `@Type(() => Number)`, `@IsInt({ message: 'O PV atual deve ser um número inteiro.' })` — sem `@Min`/`@Max` (sem piso nem teto, aceita negativos).
    - Mesma estrutura para `temporaryHitPoints`, com mensagens equivalentes para "PV temporário".
  - `SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`): adicionar `currentHitPoints: number | null` e `temporaryHitPoints: number | null` com `@ApiPropertyOptional()`, populados em `fromEntity()` a partir da entidade. O campo `race` já usa `RaceResponseDto.fromEntity(sheet.race)` (DTO completo), então `race.hitPoints` já chega ao client automaticamente assim que a Parte 1 (Raça) for implementada — nenhuma alteração adicional é necessária aqui para propagar o `hitPoints` da raça.
  - `sheets.service.ts` — método `update()`: adicionar, no mesmo padrão dos demais campos (`if (dto.campo !== undefined) sheet.campo = dto.campo;`):
    - `if (dto.currentHitPoints !== undefined) { sheet.currentHitPoints = dto.currentHitPoints; }`
    - `if (dto.temporaryHitPoints !== undefined) { sheet.temporaryHitPoints = dto.temporaryHitPoints; }`
    - Isso já cobre corretamente omissão (mantém valor atual) vs. `null` explícito (limpa o campo), pois `dto.campo` pode valer `null` sem ser `undefined`.
- Acesso Google: não aplicável — `SheetsController` não usa `GoogleAccessGuard`/`@GoogleAccess` (apenas `JwtAuthGuard`); fichas são recursos do próprio usuário autenticado, sem política de restrição por provedor. Nenhuma mudança de acesso é necessária ou cabível aqui.

Status: concluído
Entidade:
- app-api/src/modules/races/entities/race.entity.ts (coluna `hitPoints` adicionada)
- app-api/src/modules/sheets/entities/sheet.entity.ts (colunas `currentHitPoints` e `temporaryHitPoints` adicionadas)
Migration:
- app-api/src/database/migrations/1784306430000-AddHitPointsToRacesTable.ts
- app-api/src/database/migrations/1784306440000-AddHitPointsToSheetsTable.ts
Rotas: nenhuma rota nova — `POST /races`, `PUT /races/:id` e `PUT /sheets/:id` (já existentes) passam a aceitar/exigir os novos campos.
Arquivos:
- app-api/src/modules/races/dto/create-race.dto.ts (campo `hitPoints` obrigatório)
- app-api/src/modules/races/dto/update-race.dto.ts (override de `hitPoints` obrigatório sobre `PartialType`)
- app-api/src/modules/races/dto/race-response.dto.ts (campo `hitPoints` exposto e populado em `fromEntity`)
- app-api/src/modules/races/races.service.ts (`create`/`update` passam `hitPoints`)
- app-api/src/modules/sheets/dto/update-sheet.dto.ts (campos `currentHitPoints`/`temporaryHitPoints`, aceitando `null` explícito)
- app-api/src/modules/sheets/dto/sheet-response.dto.ts (campos `currentHitPoints`/`temporaryHitPoints` expostos e populados em `fromEntity`)
- app-api/src/modules/sheets/sheets.service.ts (`update` trata `currentHitPoints`/`temporaryHitPoints`)

### 2. api-dev-doc
- Depende da etapa 1.
- Cobrir no Swagger:
  - `CreateRaceDto`/`UpdateRaceDto`: novo `@ApiProperty` de `hitPoints` (obrigatório, mínimo 1, tipo inteiro) documentado nos dois DTOs, inclusive a obrigatoriedade explícita no update (divergência do padrão usual de `PartialType`).
  - `RaceResponseDto`: novo `@ApiProperty` de `hitPoints`.
  - Atualizar as descrições de `@ApiBadRequestResponse` de `POST /races` e `PUT /races/:id` para mencionar a validação de `hitPoints` (inteiro ≥ 1) entre os motivos de erro 400.
  - `UpdateSheetDto`: novos `@ApiPropertyOptional` de `currentHitPoints`/`temporaryHitPoints`, deixando claro no texto da descrição o comportamento de "omitir mantém, `null` explícito limpa, sem piso/teto".
  - `SheetResponseDto`: novos `@ApiPropertyOptional` de `currentHitPoints`/`temporaryHitPoints`.
  - Revisar se a descrição de `@ApiBadRequestResponse` de `PUT /sheets/:id` precisa mencionar os novos campos (formato inteiro).

Status: concluído
Arquivos alterados:
- app-api/src/modules/races/races.controller.ts (@ApiBadRequestResponse de POST /races e PUT /races/:id atualizadas para mencionar validação de hitPoints)
- app-api/src/modules/sheets/sheets.controller.ts (@ApiBadRequestResponse de PUT /sheets/:id atualizada para mencionar validação de currentHitPoints/temporaryHitPoints)
Arquivos já contendo a documentação Swagger completa (verificados, sem alterações necessárias):
- app-api/src/modules/races/dto/create-race.dto.ts (@ApiProperty de hitPoints)
- app-api/src/modules/races/dto/update-race.dto.ts (@ApiProperty de hitPoints)
- app-api/src/modules/races/dto/race-response.dto.ts (@ApiProperty de hitPoints)
- app-api/src/modules/sheets/dto/update-sheet.dto.ts (@ApiPropertyOptional de currentHitPoints/temporaryHitPoints)
- app-api/src/modules/sheets/dto/sheet-response.dto.ts (@ApiPropertyOptional de currentHitPoints/temporaryHitPoints)

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - A migration de `races.hit_points` não deixar `DEFAULT` residual na coluna após o backfill.
  - `UpdateRaceDto.hitPoints` de fato permanecer obrigatório mesmo estendendo `PartialType(CreateRaceDto)` (override correto, sem `@IsOptional` vazando por herança).
  - `UpdateSheetDto.currentHitPoints`/`temporaryHitPoints` tratarem corretamente `null` explícito vs. campo omitido (mesmo padrão de `referenceImage`/`campaignId`), e não terem `@Min`/`@Max` indevidos.
  - `SheetResponseDto` expor `race.hitPoints` corretamente via `RaceResponseDto.fromEntity` (sem regressão ao usar por engano um DTO resumido, como `RaceListItemResponseDto`).
  - Nomenclatura de colunas (`hit_points`, `current_hit_points`, `temporary_hit_points`) e propriedades (`hitPoints`, `currentHitPoints`, `temporaryHitPoints`) consistentes em entidade, DTOs e migrations.

Status: concluído

## Revisão

- **app-api/src/modules/races/dto/update-race.dto.ts:6-15** — `hitPoints` continua efetivamente opcional em `PUT /races/:id`, apesar do override, porque `PartialType(CreateRaceDto)` aplica `@IsOptional()` sobre a metadata de `hitPoints` numa classe intermediária que fica na cadeia de protótipos de `UpdateRaceDto`. O `class-validator` (`MetadataStorage.getTargetValidationMetadatas`) coleta metadados de validação de **toda** a cadeia de herança, não apenas da classe mais específica, e só deduplica entradas quando `propertyName` **e** `type` coincidem. Como o `@IsOptional()` herdado é do tipo `CONDITIONAL_VALIDATION` e a redeclaração em `UpdateRaceDto` só adiciona `@Type`/`@IsInt`/`@Min` (sem um `@IsOptional` próprio para "brigar" pelo dedupe), o `@IsOptional()` herdado permanece ativo e, na validação (`ValidationExecutor.performValidations` → `conditionalValidations`), faz o campo ser pulado inteiramente quando omitido — ou seja, um `PUT /races/:id` sem `hitPoints` no corpo passa pelo `ValidationPipe` sem erro 400, e o service (`if (dto.hitPoints !== undefined)`) simplesmente mantém o valor atual. Isso contraria a decisão explícita do spec ("Obrigatório no create **e no update**"). Confirmei que este é o único DTO do projeto que tenta "restaurar obrigatoriedade" redeclarando um campo direto sobre `PartialType(Create...Dto)`; o padrão já usado em `app-api/src/modules/events/dto/update-event.dto.ts` para alterar o comportamento de um campo específico usa `PartialType(OmitType(CreateEventDto, [...] as const))` antes de redeclarar o campo, exatamente para evitar esse vazamento de metadados.
  - Trecho: `export class UpdateRaceDto extends PartialType(CreateRaceDto) { @ApiProperty(...) @Type(() => Number) @IsInt(...) @Min(1, ...) hitPoints: number; }`
  - Sugestão: trocar para `export class UpdateRaceDto extends PartialType(OmitType(CreateRaceDto, ['hitPoints'] as const)) { ... }` (importando `OmitType` de `@nestjs/swagger`), mantendo a redeclaração de `hitPoints` com os mesmos decorators atuais (sem `@IsOptional`). Como `hitPoints` é excluído da classe base antes do `PartialType`, nenhuma metadata de validação (incluindo o `@IsOptional()` automático) é copiada para ele, e a redeclaração passa a ser a única fonte de validação para o campo — tornando-o de fato obrigatório em `PUT /races/:id`. Adicionar um teste (unitário ou e2e) cobrindo "PUT /races/:id sem hitPoints deve retornar 400" ajudaria a evitar regressão futura, já que hoje não há nenhum teste cobrindo este caso.
  - **Status: RESOLVIDO (revalidado em 2026-08-08).** `app-api/src/modules/races/dto/update-race.dto.ts` foi atualizado exatamente conforme a sugestão: agora estende `PartialType(OmitType(CreateRaceDto, ['hitPoints'] as const))`, com `OmitType` importado corretamente de `@nestjs/swagger`, e redeclara `hitPoints: number` com `@ApiProperty({ example: 5, description: 'Pontos de Vida da raça (inteiro, mínimo 1, obrigatório)' })`, `@Type(() => Number)`, `@IsInt(...)` e `@Min(1, ...)` — sem nenhum `@IsOptional` próprio ou herdado (o `OmitType` remove `hitPoints` da classe base antes do `PartialType`, então nenhuma metadata de validação da classe base é copiada para o campo redeclarado). A documentação Swagger (`@ApiProperty`) aplicada pelo `api-dev-doc` foi preservada com o mesmo texto/exemplo do `CreateRaceDto`. Confirmado também que `hitPoints` continua existindo e obrigatório (`@ApiProperty`, `@Type`, `@IsInt`, `@Min(1)`, sem `@IsOptional`) em `app-api/src/modules/races/dto/create-race.dto.ts` (linhas 51-58), pré-requisito para o `OmitType(CreateRaceDto, ['hitPoints'])` compilar sem erro de tipo. Nenhum outro arquivo do módulo `races` foi impactado pela mudança. `PUT /races/:id` agora exige `hitPoints` corretamente.

Demais pontos analisados e aprovados, sem problemas encontrados:
- Migration `1784306430000-AddHitPointsToRacesTable.ts`: segue corretamente o padrão "ADD nullable com DEFAULT → backfill → SET NOT NULL → DROP DEFAULT", sem `DEFAULT` residual; `down()` reverte corretamente.
- Migration `1784306440000-AddHitPointsToSheetsTable.ts`: colunas nullable sem backfill/DEFAULT/NOT NULL, conforme decisão do spec; `down()` reverte as duas colunas na ordem inversa.
- `app-api/src/modules/races/entities/race.entity.ts` e `app-api/src/modules/sheets/entities/sheet.entity.ts`: colunas/tipos/nullability batem exatamente com as migrations correspondentes; posicionamento lógico (`hitPoints` após `description`; `currentHitPoints`/`temporaryHitPoints` após `level`) respeitado.
- `app-api/src/modules/races/dto/create-race.dto.ts`: `hitPoints` obrigatório, com `@Type(() => Number)`, `@IsInt`, `@Min(1)` e mensagens em pt-BR corretas.
- `app-api/src/modules/races/dto/race-response.dto.ts`: `hitPoints` exposto e populado em `fromEntity`, sem vazar campos sensíveis.
- `app-api/src/modules/races/races.service.ts`: `create`/`update` tratam `hitPoints` conforme o padrão dos demais campos escalares.
- `app-api/src/modules/sheets/dto/update-sheet.dto.ts`: `currentHitPoints`/`temporaryHitPoints` usam corretamente `@IsOptional()` + `@ValidateIf((_o, value) => value !== null)` (mesmo padrão de `referenceImage`/`campaignId`), sem `@Min`/`@Max` indevidos, permitindo negativos.
- `app-api/src/modules/sheets/dto/sheet-response.dto.ts`: `currentHitPoints`/`temporaryHitPoints` expostos corretamente; `race` usa `RaceResponseDto.fromEntity(sheet.race)` (DTO completo, não `RaceListItemResponseDto`), então `race.hitPoints` chega íntegro ao client.
- `app-api/src/modules/sheets/sheets.service.ts`: `update()` trata `undefined` (omitido, mantém) vs. `null` (limpa) corretamente para os dois campos novos.
- `app-api/src/modules/races/races.controller.ts` e `app-api/src/modules/sheets/sheets.controller.ts`: `@ApiBadRequestResponse` de `POST /races`, `PUT /races/:id` e `PUT /sheets/:id` mencionam a validação dos novos campos; acesso Google mantido inalterado conforme o escopo (races: `@GoogleAccess('read-only')` a nível de classe; sheets: apenas `JwtAuthGuard`, sem alteração necessária).
