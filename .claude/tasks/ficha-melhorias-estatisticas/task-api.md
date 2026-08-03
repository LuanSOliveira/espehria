# Task API: Ficha — Biografia, melhorias/defeitos snapshot e Raça com melhorias/defeitos próprios

## Contexto
Ver `.claude/tasks/ficha-melhorias-estatisticas/spec.md` (fonte da verdade; seção "Escopo
confirmado" já fecha todas as decisões de produto). Este plano cobre exclusivamente o
`app-api`, itens 1–6 da seção "Escopo app-api" do spec.

Investigação de código relevante (base factual deste plano):
- `app-api/src/modules/sheets/entities/sheet.entity.ts`: hoje tem `race: Race | null`
  (`@ManyToOne`, `onDelete: 'SET NULL'`, `JoinColumn race_id`), sem `biography` e sem
  colunas `jsonb`.
- `app-api/src/modules/sheets/sheets.service.ts`: `update()` trata `dto.raceId` como
  autosave de campo simples; `findRaceById` carrega `relations: { category, tags,
  characteristics: { tags }, talents: { tags } }`; `findAccessibleById` carrega as mesmas
  relations de `race` + `campaign` + `createdBy`; `isRestrictedToOwnSheets` (usuários
  `provider === AuthProvider.GOOGLE` só acessam fichas próprias) é usada em
  `findAccessibleById`, `update` e `remove` — **todo método novo deve reusar
  `findAccessibleById` para herdar essa restrição automaticamente**.
- `app-api/src/modules/sheets/sheets.controller.ts`: usa só `@UseGuards(JwtAuthGuard)`
  (sem `GoogleAccessGuard`/`@GoogleAccess`), porque a restrição de acesso já é por posse
  (via `isRestrictedToOwnSheets` no service), não por nível de acesso Google — os novos
  endpoints devem seguir o mesmo padrão (sem `GoogleAccessGuard`).
- `app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`: 4 owners
  hoje (`ownerTalent`, `ownerTraining`, `ownerCharacteristic`, `ownerBiography`), todos
  `@ManyToOne` nullable + `onDelete: 'CASCADE'`; `@Check('CK_improvement_flaws_owner_exclusive',
  'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id,
  owner_biography_id) = 1')`; `@Unique(['category', 'ownerTalent', 'ownerTraining',
  'ownerCharacteristic', 'ownerBiography', 'type', 'property'])`.
- `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`:
  `TALENT | TRAINING | CHARACTERISTIC | BIOGRAPHY`.
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`: `ownerColumnFor`
  (switch sobre `ImprovementFlawOwnerType`) e o tipo `OwnerColumn` mapeiam o enum para a
  coluna de relação correta; usados por `replaceItems`/`loadItemsFor`, que por sua vez são
  usados por `talents`, `trainings`, `characteristics` e `biographies`.
- `app-api/src/modules/talents/` é o módulo de referência para "entidade com melhorias E
  defeitos próprios" (`category = improvement` e `category = flaw`): `TalentsService`
  injeta `ImprovementFlawsService`; `create`/`update` resolvem, validam
  (`validateAndResolveItems` + `validateLists`) e persistem via `replaceItems(...,
  ImprovementFlawOwnerType.TALENT, ..., ImprovementFlawCategory.IMPROVEMENT/FLAW, ...)`;
  `findById` retorna `{ talent, improvedFrom, requirements, additionalAbilities,
  improvements, flaws }`; `TalentResponseDto.fromEntity(talent, references)` recebe um
  segundo parâmetro **obrigatório** com as listas resolvidas (não vêm do entity). Racas
  hoje só têm `characteristics`/`talents` (many-to-many, sem melhorias/defeitos próprios)
  — este plano estende `races` para o mesmo padrão de `talents`, mas só para
  melhorias/defeitos (não para `improvedFrom`/`requirements`/`additionalAbilities`, que
  `Race` não tem e não deve ganhar).
- `ImprovementFlawItemResponseDto` (`value`, `type`, `property`) **não expõe o `id`** do
  registro `ImprovementFlaw` — usado hoje só para exibição de listas completas. Para o
  snapshot da ficha, o `id` do registro real é necessário (ver seção "Entidade" abaixo,
  snapshot precisa diferenciar item real de item livre e permitir reabrir o modal de
  Biografia pré-preenchido com a melhoria previamente selecionada). Por isso o snapshot
  da ficha **não reaproveita** `ImprovementFlawItemResponseDto`/`loadItemsFor` — usa
  acesso direto ao repositório de `ImprovementFlaw` dentro de `SheetsService` (mesmo
  padrão já usado por `SheetsService` para `Campaign`/`Race`, que acessa repositórios
  diretamente em vez de passar pelos services desses módulos).
- `RaceResponseDto.fromEntity(race)` hoje tem **um único parâmetro** e é chamado em 3
  lugares fora de `races.controller.ts`: `characters/dto/character-response.dto.ts`,
  `characters/dto/character-list-item-response.dto.ts` e
  `sheets/dto/sheet-response.dto.ts`. Ao adicionar `improvements`/`flaws` à
  `RaceResponseDto` (item 6 do spec), a assinatura de `fromEntity` **não pode virar
  obrigatória** sem quebrar esses 3 call sites — ver decisão de design na seção
  "Entidade" abaixo.
- `ImprovementFlawType`/`ImprovementFlawProperty` são seedados via migration; o tipo
  "Atributo" já existe (seed `1784306250000-SeedImprovementFlawAttributeType.ts`,
  `.claude/tasks/melhorias-tipo-atributo/`), vinculado às 6 propriedades de atributo
  (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma). Não há flag
  booleana "é atributo" — a checagem é sempre por `type.name === 'Atributo'` ou por
  join com a tabela de tipos filtrando `name = 'Atributo'`.
- Último timestamp de migration existente no repositório: `1784306250000`
  (`app-api/src/database/migrations/`). Timestamps sugeridos para as 2 migrations novas:
  `1784306260000` e `1784306270000`.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/sheets/entities/sheet.entity.ts` (adicionados `biography`,
  `melhorias`, `defeitos`); `app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`
  (adicionado `ownerRace`, `@Check`/`@Unique` atualizados); `Race`
  (`app-api/src/modules/races/entities/race.entity.ts`) sem alteração de schema
  (conforme plano — melhorias/defeitos são registros em `improvement_flaws`)
- Migration: `app-api/src/database/migrations/1784306260000-AddRaceOwnerToImprovementFlaws.ts`;
  `app-api/src/database/migrations/1784306270000-AddBiographyAndSnapshotsToSheets.ts`
- Rotas: `PUT /sheets/:id/race`, `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography`,
  `DELETE /sheets/:id/biography` (novas); `PUT /sheets/:id` (alterada — `raceId`
  removido do `UpdateSheetDto`); `GET /sheets/:id` (resposta reformulada — inclui
  `biography`/`melhorias`/`defeitos`); `POST /races`, `PUT /races/:id`, `GET /races/:id`
  (contrato de request/response estendido, sem mudança de rota/método)
- Arquivos:
  - `app-api/src/modules/sheets/interfaces/sheet-improvement-flaw-snapshot.interface.ts` (novo)
  - `app-api/src/modules/sheets/dto/link-sheet-race.dto.ts` (novo)
  - `app-api/src/modules/sheets/dto/link-sheet-biography.dto.ts` (novo)
  - `app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-entry-response.dto.ts` (novo)
  - `app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-response.dto.ts` (novo)
  - `app-api/src/modules/sheets/dto/sheet-response.dto.ts` (alterado — `biography`,
    `melhorias`, `defeitos`)
  - `app-api/src/modules/sheets/dto/update-sheet.dto.ts` (alterado — `raceId` removido)
  - `app-api/src/modules/sheets/sheets.service.ts` (alterado — `linkRace`, `unlinkRace`,
    `linkBiography`, `unlinkBiography` novos; `update` sem bloco `raceId`;
    `findAccessibleById` carregando `biography: { tags: true }`)
  - `app-api/src/modules/sheets/sheets.controller.ts` (alterado — 4 endpoints novos)
  - `app-api/src/modules/sheets/sheets.module.ts` (alterado — `Biography`,
    `ImprovementFlaw`, `ImprovementFlawType`, `ImprovementFlawProperty` no
    `TypeOrmModule.forFeature`)
  - `app-api/src/modules/biographies/dto/biography-option-response.dto.ts` (novo)
  - `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`
    (alterado — `RACE` adicionado)
  - `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts` (alterado —
    `OwnerColumn`/`ownerColumnFor` cobrindo `RACE`)
  - `app-api/src/modules/races/races.module.ts` (alterado — importa `ImprovementFlawsModule`)
  - `app-api/src/modules/races/races.service.ts` (alterado — `RaceWithReferences`,
    `findById`/`create`/`update` com `improvements`/`flaws`)
  - `app-api/src/modules/races/races.controller.ts` (alterado — `create`/`findOne`/`update`
    passam `improvements`/`flaws` para `RaceResponseDto.fromEntity`)
  - `app-api/src/modules/races/dto/create-race.dto.ts` (alterado — `improvements`/`flaws`
    opcionais)
  - `app-api/src/modules/races/dto/race-response.dto.ts` (alterado — `improvements`/`flaws`,
    segundo parâmetro opcional de `fromEntity`)
  - `app-api/src/modules/races/dto/update-race.dto.ts` (sem alteração de código — herda via
    `PartialType`)

**Follow-up (2026-08-03):** `ImprovementFlawItemResponseDto` (usado por
`ImprovementFlawsService.loadItemsFor`, consumido pelas respostas de Biografia,
Treinamento, Talento, Característica e Raça) não expunha o `id` do registro
`ImprovementFlaw`, impedindo o frontend de enviar `selectedImprovementId` em `PUT
/sheets/:id/biography`. Corrigido adicionando `id: string` ao DTO, preenchido em
`fromResolved` a partir de `item.id`. `app-api/src/modules/improvement-flaws/dto/improvement-flaw-item-response.dto.ts`
(alterado). Mudança aditiva; `loadItemsFor` já carrega o `id` por padrão (`find()` sem
`select` explícito), nenhum outro call site precisou de ajuste.

#### Entidade

**A) `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`)**
- Adicionar `biography: Biography | null` — `@ApiPropertyOptional({ type: () =>
  Biography })` `@ManyToOne(() => Biography, { nullable: true, onDelete: 'SET NULL' })`
  `@JoinColumn({ name: 'biography_id' })`, exatamente análogo ao `race` já existente
  (mesmo `onDelete: 'SET NULL'`, mesmo estilo).
- Adicionar duas colunas `jsonb` irmãs, com os nomes literais em português pedidos pelo
  spec (`melhorias`/`defeitos` — diferente do restante do código, que usa nomes em
  inglês; **não "corrigir" para inglês**, é intencional): `melhorias:
  SheetImprovementFlawSnapshot` e `defeitos: SheetImprovementFlawSnapshot`, ambas
  `@Column({ type: 'jsonb', default: { race: [], biography: [], trainings: [], talents:
  [], characteristics: [] } })`. Sem `@ApiProperty` na entidade (a exposição via Swagger
  fica nos DTOs de resposta, como já é padrão no projeto).
- Criar a interface `SheetImprovementFlawSnapshot` em
  `app-api/src/modules/sheets/interfaces/sheet-improvement-flaw-snapshot.interface.ts`:
  ```ts
  export interface SheetImprovementFlawSnapshotEntry {
    id: string | null; // id do ImprovementFlaw real; null para a melhoria livre da Biografia
    value: number;
    type: { id: string; name: string };
    property: { id: string; name: string };
    sourceName: string; // nome da raça/biografia que concedeu (para "Concedida por: <nome>" no frontend)
  }

  export interface SheetImprovementFlawSnapshot {
    race: SheetImprovementFlawSnapshotEntry[];
    biography: SheetImprovementFlawSnapshotEntry[];
    trainings: SheetImprovementFlawSnapshotEntry[];
    talents: SheetImprovementFlawSnapshotEntry[];
    characteristics: SheetImprovementFlawSnapshotEntry[];
  }
  ```
  Por ora `trainings`/`talents`/`characteristics` são sempre preenchidos como `[]` pelos
  novos fluxos (nenhum endpoint desta task os popula) — apenas estrutura pronta para uso
  futuro, conforme o spec.
- `type`/`property` guardam `id` + `name` (não apenas o `id`) para permitir ao frontend
  filtrar por `type.name === 'Atributo'` e casar `property.name` com o atributo, sem
  round-trip adicional — é o que a aba Estatísticas do frontend consome (ver "Contexto
  técnico" do spec, item 4 do escopo app-api). **Nenhum endpoint novo de cálculo é
  necessário no app-api**: o cálculo (base 10 + soma de melhorias − soma de defeitos do
  tipo Atributo, modificador `floor((valor-10)/2)`) é responsabilidade do app-web,
  consumindo os dados já expostos em `GET /sheets/:id` (`melhorias`/`defeitos`). Isso é
  uma decisão de arquitetura deste plano, não uma lacuna de requisito — se a etapa de
  planejamento do frontend concluir que precisa de um valor pré-calculado do backend,
  isso deve ser tratado como um ajuste à parte, não implementado preventivamente aqui.

**B) `ImprovementFlaw` (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`)**
- Adicionar `ownerRace: Race | null` — `@ManyToOne(() => Race, { nullable: true,
  onDelete: 'CASCADE' })` `@JoinColumn({ name: 'owner_race_id' })`, mesmo padrão dos
  outros 4 owners (import `Race` de `../../races/entities/race.entity`).
- Atualizar `@Check('CK_improvement_flaws_owner_exclusive', ...)` para: `'num_nonnulls(
  owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id,
  owner_race_id) = 1'`.
- Atualizar `@Unique([...])` para incluir `'ownerRace'`: `['category', 'ownerTalent',
  'ownerTraining', 'ownerCharacteristic', 'ownerBiography', 'ownerRace', 'type',
  'property']`.
- `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`:
  adicionar `RACE = 'race'`.
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`: adicionar o
  case `RACE` em `ownerColumnFor` (retornando `'ownerRace'`) e incluir `'ownerRace'` no
  tipo `OwnerColumn`. Nenhuma outra alteração é necessária neste service — `replaceItems`
  e `loadItemsFor` já são genéricos por `ownerColumn`.

**C) `Race` (`app-api/src/modules/races/entities/race.entity.ts`)**
- **Nenhuma alteração de coluna/relacionamento na entidade** — melhorias/defeitos
  próprios da raça são registros em `improvement_flaws` com `owner_race_id` preenchido
  (via a nova FK do item B), não uma coluna/relação nova em `Race`. O módulo `races`
  ganha suporte a esses registros na camada de service/DTO/controller (ver abaixo),
  exatamente como `talents`/`trainings`/`characteristics`/`biographies` já fazem sem ter
  coluna própria para isso.
- `RacesModule` (`app-api/src/modules/races/races.module.ts`): importar
  `ImprovementFlawsModule` (mesmo padrão de `TalentsModule`/`BiographiesModule`).
- `RacesService` (`app-api/src/modules/races/races.service.ts`): injetar
  `ImprovementFlawsService`. Replicar exatamente o padrão de `TalentsService`
  (`app-api/src/modules/talents/talents.service.ts`) restrito a melhorias/defeitos (sem
  `EntityLinksService`, que `Race` não usa):
  - Novo tipo `RaceWithReferences { race: Race; improvements:
    ImprovementFlawItemResponseDto[]; flaws: ImprovementFlawItemResponseDto[] }`.
  - `findById` passa a retornar `RaceWithReferences | null`, carregando `improvements`/
    `flaws` via `improvementFlawsService.loadItemsFor(ImprovementFlawOwnerType.RACE,
    id)` além do `race` (com as relations já existentes: `category, tags,
    characteristics: { tags }, talents: { tags }`).
  - `create(dto)`: resolver (`validateAndResolveItems`) e validar
    (`validateLists({ improvements, flaws })`) as novas listas `dto.improvements ?? []` e
    `dto.flaws ?? []` antes de salvar a raça; após salvar, `replaceItems(RACE,
    savedRace.id, IMPROVEMENT, ...)` e `replaceItems(RACE, savedRace.id, FLAW, ...)`;
    retornar `RaceWithReferences` recarregando via `loadItemsFor`.
  - `update(id, dto)`: mesmo padrão de "valor efetivo" do `TalentsService.update` —
    se `dto.improvements`/`dto.flaws` vierem `undefined`, carregar os atuais via
    `loadItemsFor` antes de validar (para não quebrar a validação de
    `validateLists`/exclusividade ao atualizar só outros campos); só chamar
    `replaceItems` para a lista que veio definida no DTO.
  - `findAllPaginated`/`remove`: sem alteração (melhorias/defeitos não aparecem na
    listagem, mesmo padrão de `talents`).
- `CreateRaceDto` (`app-api/src/modules/races/dto/create-race.dto.ts`): adicionar
  `improvements?: ImprovementFlawItemInputDto[]` e `flaws?: ImprovementFlawItemInputDto[]`
  (`@ApiPropertyOptional`, `@IsOptional`, `@IsArray`, `@ValidateNested({ each: true })`,
  `@Type(() => ImprovementFlawItemInputDto)`), texto de `description` no padrão já usado
  em `CreateTalentDto` (duplicidade Tipo×Propriedade, exclusividade entre listas,
  compatibilidade Tipo×Propriedade).
- `UpdateRaceDto` (`app-api/src/modules/races/dto/update-race.dto.ts`): **nenhuma
  alteração de código** — já é `PartialType(CreateRaceDto)`, então herda os novos campos
  como opcionais automaticamente.
- `RaceResponseDto` (`app-api/src/modules/races/dto/race-response.dto.ts`): adicionar
  `improvements: ImprovementFlawItemResponseDto[]` e `flaws:
  ImprovementFlawItemResponseDto[]`.
  - **Decisão de design obrigatória para não quebrar os 3 call sites existentes**
    (`characters/dto/character-response.dto.ts`,
    `characters/dto/character-list-item-response.dto.ts`,
    `sheets/dto/sheet-response.dto.ts`, todos chamando `RaceResponseDto.fromEntity(race)`
    com um único argumento): tornar o segundo parâmetro de `fromEntity` **opcional**,
    com default `{ improvements: [], flaws: [] }`:
    ```ts
    static fromEntity(
      race: Race,
      references: {
        improvements: ImprovementFlawItemResponseDto[];
        flaws: ImprovementFlawItemResponseDto[];
      } = { improvements: [], flaws: [] },
    ): RaceResponseDto { ... }
    ```
    `RacesController` (create/findOne/update) passa sempre o valor real vindo do
    service; os 3 call sites existentes continuam chamando sem o segundo argumento e
    passam a receber `improvements`/`flaws` vazios (aceitável: nem `characters` nem o
    card de raça embutido em `SheetResponseDto` precisam da lista própria de
    melhorias/defeitos da raça ali — a ficha já expõe isso via seu próprio snapshot
    `melhorias.race`/`defeitos.race`). **Não alterar `characters` para passar o segundo
    argumento** — fora de escopo desta task.
  - `RaceListItemResponseDto`: **sem alteração** — segue sem `improvements`/`flaws`
    (mesmo padrão de `TalentListItemResponseDto`, que também não expõe essas listas na
    listagem paginada).

**D) `Biography` — DTO leve para embutir em `Sheet`**
- Criar `BiographyOptionResponseDto`
  (`app-api/src/modules/biographies/dto/biography-option-response.dto.ts`), espelhando
  `CampaignOptionResponseDto` mas com um pouco mais de campo (o card de Biografia na
  ficha precisa de nome/descrição/imagem/tags para o "visualizar", mesmo padrão do card
  de Raça hoje): `id`, `name`, `description`, `imageReference`, `tags:
  TagResponseDto[]`, `fromEntity(biography: Biography)`. **Não reaproveitar**
  `BiographyResponseDto` para este embed — ele exige um segundo parâmetro obrigatório
  (`additionalAbilities`/`improvements`) que forçaria `SheetsService` a chamar
  `BiographiesService`/`ImprovementFlawsService` só para montar o card da ficha,
  informação que não é usada ali (a ficha já expõe as melhorias relevantes via
  `melhorias.biography`).

**E) Snapshot na resposta da ficha**
- Criar `SheetImprovementFlawSnapshotEntryResponseDto`
  (`app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-entry-response.dto.ts`):
  `id: string | null`, `value: number`, `type: ImprovementFlawTypeResponseDto`,
  `property: ImprovementFlawPropertyResponseDto`, `sourceName: string`, com
  `fromEntry(entry: SheetImprovementFlawSnapshotEntry, type: ImprovementFlawType,
  property: ImprovementFlawProperty)` ou, mais simples, um `fromRaw(entry:
  SheetImprovementFlawSnapshotEntry)` que monta `type`/`property` a partir dos campos
  `{id, name}` já achatados no snapshot (sem precisar recarregar as entidades — o
  snapshot já é auto-suficiente, esse é o ponto de congelar os dados).
- Criar `SheetImprovementFlawSnapshotResponseDto`
  (`app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-response.dto.ts`):
  `race`, `biography`, `trainings`, `talents`, `characteristics`, todos
  `SheetImprovementFlawSnapshotEntryResponseDto[]`, com `fromEntity(snapshot:
  SheetImprovementFlawSnapshot)`.
- `SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`):
  - Adicionar `biography: BiographyOptionResponseDto | null`.
  - Adicionar `melhorias: SheetImprovementFlawSnapshotResponseDto` e `defeitos:
    SheetImprovementFlawSnapshotResponseDto`.
  - `race` continua `RaceResponseDto | null`, agora via `RaceResponseDto.fromEntity(sheet.race)`
    (sem segundo argumento — ver decisão no item C).

#### Migration
- Necessária: **sim**, 2 migrations novas, timestamps sequenciais a partir do último
  existente (`1784306250000`):

  **1. `AddRaceOwnerToImprovementFlaws1784306260000`**
  (`app-api/src/database/migrations/1784306260000-AddRaceOwnerToImprovementFlaws.ts`):
  - `up()`, nesta ordem:
    1. `ALTER TABLE "improvement_flaws" ADD COLUMN "owner_race_id" uuid`
    2. `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_race_id" FOREIGN KEY ("owner_race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    3. `CREATE INDEX "IDX_improvement_flaws_owner_race" ON "improvement_flaws" ("owner_race_id", "category")`
    4. `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "CK_improvement_flaws_owner_exclusive"`
    5. `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1)`
    6. `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`
    7. `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "owner_biography_id", "owner_race_id", "type_id", "property_id")`
  - `down()`: exatamente a ordem inversa (recriar índice/CHECK antigos sem
    `owner_race_id`, depois dropar índice/FK/coluna novos) — usar
    `1784306230000-CreateBiographiesAndExtendOwnerRelations.ts` como referência de
    estilo (é a migration mais recente que fez a mesma operação para `owner_biography_id`).

  **2. `AddBiographyAndSnapshotsToSheets1784306270000`**
  (`app-api/src/database/migrations/1784306270000-AddBiographyAndSnapshotsToSheets.ts`):
  - `up()`:
    1. `ALTER TABLE "sheets" ADD COLUMN "biography_id" uuid`
    2. `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_biography_id" FOREIGN KEY ("biography_id") REFERENCES "biographies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
       (sem índice — segue o mesmo padrão de `race_id` em `sheets`, que também não tem
       índice dedicado, só `campaign_id`/`created_by_id` têm)
    3. `ALTER TABLE "sheets" ADD COLUMN "melhorias" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`
    4. `ALTER TABLE "sheets" ADD COLUMN "defeitos" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`
  - `down()`: `ALTER TABLE "sheets" DROP COLUMN "defeitos"`, `DROP COLUMN "melhorias"`,
    `DROP CONSTRAINT "FK_sheets_biography_id"`, `DROP COLUMN "biography_id"` (ordem
    inversa).
  - Conferir se os nomes de coluna (`melhorias`/`defeitos`, sem `snake_case` adicional
    pois já são uma palavra só) batem exatamente com o `@Column` da entidade (sem
    `name:` explícito necessário, já que o nome da propriedade já é o nome da coluna).

#### Controller

**Endpoints:**
- `PUT /sheets/:id/race` — vincula/troca a raça da ficha.
- `DELETE /sheets/:id/race` — desvincula a raça da ficha.
- `PUT /sheets/:id/biography` — vincula/troca a biografia da ficha (com a melhoria
  selecionada + melhoria livre).
- `DELETE /sheets/:id/biography` — desvincula a biografia da ficha.
- `PUT /sheets/:id` (existente) — **`raceId` removido do `UpdateSheetDto`** (ver DTOs
  abaixo); passa a tratar só `name`/`referenceImage`/`level`/`campaignId`, exatamente
  como o spec descreve ("autosave de campo simples... que continua tratando os demais
  campos como hoje" — implicitamente excluindo raça/biografia, que passam a ser
  exclusividade dos endpoints dedicados). Com `ValidationPipe({ forbidNonWhitelisted:
  true })` já configurado globalmente, enviar `raceId` neste endpoint depois da mudança
  passa a resultar em `400 Bad Request` — é o comportamento desejado para forçar o uso
  do endpoint dedicado.
- `GET /sheets/:id` (existente) — **resposta reformulada**, sem mudança de rota/método:
  `SheetResponseDto` passa a incluir `biography`, `melhorias`, `defeitos`.
- `POST /races`, `PUT /races/:id`, `GET /races/:id` (existentes) — **sem mudança de rota
  nem de método**, apenas contrato de request (`improvements`/`flaws` opcionais no
  create/update) e de resposta (`improvements`/`flaws` no `RaceResponseDto`).

**Novos endpoints em `app-api/src/modules/sheets/sheets.controller.ts`:**

```
PUT /sheets/:id/race
  Body: LinkSheetRaceDto { raceId: string }
  200 OK → SheetResponseDto
  404 → ficha não encontrada/não pertence ao usuário, ou raça não encontrada
  400 → id/raceId em formato inválido

DELETE /sheets/:id/race
  Sem body
  200 OK → SheetResponseDto (sheet atualizado, com race: null e melhorias.race/defeitos.race vazios)
  404 → ficha não encontrada/não pertence ao usuário
  400 → id em formato inválido
```
(Sem `@HttpCode(HttpStatus.NO_CONTENT)` — segue o padrão já usado em
`CampaignsController.removeAllowedUser` para "desvincular e devolver o recurso pai
atualizado", diferente do `DELETE :id` que remove a ficha inteira e aí sim retorna 204;
o frontend precisa do `sheet` atualizado sem round-trip extra para re-renderizar os
cards Raça/Estatísticas/Melhorias/Defeitos.)

```
PUT /sheets/:id/biography
  Body: LinkSheetBiographyDto {
    biographyId: string;
    selectedImprovementId: string; // id do ImprovementFlaw real da biografia (categoria improvement, tipo "Atributo")
    freeImprovementPropertyId: string; // property da melhoria livre; tipo/valor fixos no backend ("Atributo"/2)
  }
  200 OK → SheetResponseDto
  404 → ficha, biografia, melhoria selecionada ou propriedade não encontrados
  409 → melhoria selecionada não pertence à biografia informada / não é do tipo "Atributo",
        ou propriedade da melhoria livre incompatível com o tipo "Atributo"
  400 → id/uuids em formato inválido

DELETE /sheets/:id/biography
  Sem body
  200 OK → SheetResponseDto (sheet atualizado, com biography: null e melhorias.biography/defeitos.biography vazios)
  404 → ficha não encontrada/não pertence ao usuário
  400 → id em formato inválido
```

**Novos DTOs (`app-api/src/modules/sheets/dto/`):**
- `link-sheet-race.dto.ts` — `LinkSheetRaceDto { raceId: string }` (`@IsUUID()`,
  obrigatório — diferente de `UpdateSheetDto.raceId`, que era opcional/nullable para
  autosave parcial; aqui o campo é sempre obrigatório porque o endpoint só existe para
  vincular).
- `link-sheet-biography.dto.ts` — `LinkSheetBiographyDto { biographyId: string;
  selectedImprovementId: string; freeImprovementPropertyId: string }`, todos
  `@IsUUID()` obrigatórios. **Não incluir `value`/`type` da melhoria livre no DTO** — são
  fixos no backend (`'Atributo'`/`2`), conforme o spec ("tipo e valor fixos"); aceitar
  esses campos do cliente abriria brecha para burlar a regra de negócio.
- `sheet-improvement-flaw-snapshot-entry-response.dto.ts` e
  `sheet-improvement-flaw-snapshot-response.dto.ts` — ver seção Entidade, item E.
- `biography-option-response.dto.ts` em `app-api/src/modules/biographies/dto/` — ver
  seção Entidade, item D (fica no módulo `biographies` por consistência com
  `CampaignOptionResponseDto`, que fica em `campaigns/dto/`, não em quem consome).
- `UpdateSheetDto` (`app-api/src/modules/sheets/dto/update-sheet.dto.ts`): **remover**
  o campo `raceId` (e seu `@ApiPropertyOptional`/`@IsOptional`/`@ValidateIf`/`@IsUUID`).

**`SheetsService` (`app-api/src/modules/sheets/sheets.service.ts`) — métodos novos:**
- `linkRace(id, dto: LinkSheetRaceDto, currentUser): Promise<Sheet>`
  1. `findAccessibleById(id, currentUser)` → 404 se `null` (mesma mensagem já usada:
     `'Ficha não encontrada ou não pertence ao usuário.'`).
  2. `findRaceById(dto.raceId)` (método já existente, reaproveitado) → 404 se não
     encontrada.
  3. Buscar os registros próprios da raça em `improvement_flaws` (`ownerRace: { id:
     race.id }`, `relations: { type: true, property: { types: true } }`) via
     repositório de `ImprovementFlaw` injetado diretamente em `SheetsService` (ver
     Module abaixo) — **não** via `ImprovementFlawsService.loadItemsFor`, pois este
     precisa do `id` de cada registro para o snapshot (ver nota na seção Contexto).
  4. Separar por `category` (`IMPROVEMENT`/`FLAW`) e mapear cada item para
     `SheetImprovementFlawSnapshotEntry { id: item.id, value: item.value, type: {
     id: item.type.id, name: item.type.name }, property: { id: item.property.id, name:
     item.property.name }, sourceName: race.name }`.
  5. `sheet.race = race`; `sheet.melhorias = { ...sheet.melhorias, race:
     <novasMelhorias> }`; `sheet.defeitos = { ...sheet.defeitos, race: <novosDefeitos>
     }` (substituição total da chave `race`, preservando `biography`/`trainings`/
     `talents`/`characteristics` intactos — regra explícita do spec: trocar de raça
     substitui, não acumula).
  6. `save` e retornar o `sheet`.
- `unlinkRace(id, currentUser): Promise<Sheet>`
  1. `findAccessibleById` → 404 se `null`.
  2. `sheet.race = null`; `sheet.melhorias = { ...sheet.melhorias, race: [] }`;
     `sheet.defeitos = { ...sheet.defeitos, race: [] }`.
  3. `save` e retornar.
- `linkBiography(id, dto: LinkSheetBiographyDto, currentUser): Promise<Sheet>`
  1. `findAccessibleById` → 404.
  2. Buscar `Biography` por `dto.biographyId` (`relations: { tags: true }`) → 404
     `'Biografia não encontrada.'` se ausente.
  3. Buscar o `ImprovementFlaw` selecionado por `dto.selectedImprovementId`
     (`relations: { type: true, property: { types: true }, ownerBiography: true }`) →
     404 `'Melhoria selecionada não encontrada.'` se ausente; validar
     `item.ownerBiography?.id === biography.id`, `item.category ===
     ImprovementFlawCategory.IMPROVEMENT` e `item.type.name === 'Atributo'` → 409
     `'A melhoria selecionada não pertence à biografia informada ou não é do tipo
     Atributo.'` se qualquer uma falhar.
  4. Buscar o tipo "Atributo" (`ImprovementFlawType` por `name`) e a `ImprovementFlawProperty`
     de `dto.freeImprovementPropertyId` (`relations: { types: true }`) → 404 se
     ausentes; validar `property.types.some(t => t.id === atributoType.id)` → 409
     `'A propriedade selecionada não é compatível com o tipo Atributo.'` se
     incompatível.
  5. Montar `melhorias.biography = [ {id: selectedImprovement.id, value:
     selectedImprovement.value, type: {...}, property: {...}, sourceName:
     biography.name}, {id: null, value: 2, type: {id: atributoType.id, name:
     atributoType.name}, property: {id: property.id, name: property.name},
     sourceName: biography.name} ]`; `defeitos.biography = []` (fluxo não alimenta
     defeitos — regra explícita do spec).
  6. `sheet.biography = biography`; atualizar as duas chaves `biography` em
     `sheet.melhorias`/`sheet.defeitos` (preservando as demais chaves); `save` e
     retornar.
- `unlinkBiography(id, currentUser): Promise<Sheet>` — análogo a `unlinkRace`, zerando
  `sheet.biography`, `melhorias.biography` e `defeitos.biography`.
- `update(id, dto, currentUser)` (existente): remover o bloco `if (dto.raceId !==
  undefined) { ... }` (campo não existe mais em `UpdateSheetDto`).
- `findAllPaginated`/`findAccessibleById`: sem mudança de assunto de negócio, mas
  `findAccessibleById` deve continuar retornando `race`/`biography`/`campaign`/
  `createdBy` carregados (adicionar `biography: { tags: true }` às `relations`) —
  `melhorias`/`defeitos` são colunas simples, vêm sempre por padrão em qualquer
  `find`/`findOne` sem precisar declarar em `relations`.

**`SheetsModule` (`app-api/src/modules/sheets/sheets.module.ts`):**
- Adicionar ao `TypeOrmModule.forFeature([...])`: `Biography`, `ImprovementFlaw`,
  `ImprovementFlawType`, `ImprovementFlawProperty` (acesso direto a repositório, mesmo
  padrão já usado para `Campaign`/`Race` neste módulo — não importar
  `ImprovementFlawsModule`/`BiographiesModule` como um todo, pois `SheetsService` só
  precisa de leitura pontual, não da lógica completa de `replaceItems`/validação de
  listas desses services).

**Acesso Google:**
- `SheetsController` (novos endpoints `PUT/DELETE /sheets/:id/race` e
  `PUT/DELETE /sheets/:id/biography`): **sem `GoogleAccessGuard`/`@GoogleAccess`**,
  mesmo padrão já usado no restante do `SheetsController` — fichas são recurso de posse
  do próprio usuário (`isRestrictedToOwnSheets` em `SheetsService`, aplicado via
  `findAccessibleById` em todos os métodos novos), não um recurso de gerenciamento
  restrito ao qual se aplicaria o padrão `read-only`/`blocked` da skill
  `api-permissao-google-readonly`. Usuários Google devem poder vincular/desvincular
  raça e biografia nas próprias fichas normalmente.
- `RacesController`: **sem alteração** — já usa `@GoogleAccess('read-only')` no
  controller inteiro (skill `api-permissao-google-readonly`, comportamento padrão);
  como este plano só estende os DTOs de `create`/`update` (sem endpoint novo), usuários
  Google continuam sem poder criar/editar raças (nem suas melhorias/defeitos próprios),
  o que é consistente com o nível já vigente.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Documentar no Swagger (`@ApiOperation`/`@ApiOkResponse`/`@ApiNotFoundResponse`/
  `@ApiConflictResponse`/`@ApiBadRequestResponse`) os 4 endpoints novos de
  `SheetsController`, seguindo o mesmo nível de detalhe já usado nos demais métodos do
  controller (ex.: `update`/`remove` em `sheets.controller.ts`) — descrever
  explicitamente, no `summary`/`description`, que vincular substitui totalmente as
  entradas anteriores de `melhorias.race`/`defeitos.race` (ou `melhorias.biography`) e
  que desvincular as esvazia.
- Atualizar `@ApiOperation`/`@ApiConflictResponse`/`@ApiNotFoundResponse` de `POST
  /races` e `PUT /races/:id` (`races.controller.ts`) para mencionar
  melhorias/defeitos próprios da raça, no mesmo padrão de texto já usado em
  `talents.controller.ts` (duplicidade Tipo×Propriedade, exclusividade entre listas,
  incompatibilidade Tipo×Propriedade).
- Revisar `@ApiProperty`/`@ApiPropertyOptional` de todos os DTOs novos/alterados
  listados na etapa 1 (`LinkSheetRaceDto`, `LinkSheetBiographyDto`,
  `SheetImprovementFlawSnapshotEntryResponseDto`,
  `SheetImprovementFlawSnapshotResponseDto`, `BiographyOptionResponseDto`,
  `SheetResponseDto`, `RaceResponseDto`, `CreateRaceDto`), com `example`/`description`
  em pt-BR realistas — em particular, o `example` de `SheetImprovementFlawSnapshotResponseDto`
  deve deixar claro que `trainings`/`talents`/`characteristics` vêm vazios por ora.
- Conferir se `UpdateSheetDto` (após remoção de `raceId`) ainda documenta corretamente
  os campos restantes, sem sobra de texto que mencione raça.

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - `ImprovementFlaw`: `@Check`/`@Unique` realmente incluem `owner_race_id`/`ownerRace`
    nos 3 lugares (entidade, migration `up`, migration `down` restaurando o estado
    anterior sem `owner_race_id`), sem quebrar os 4 owners existentes.
  - `ownerColumnFor`/`OwnerColumn` em `improvement-flaws.service.ts` cobrem `RACE` sem
    regressão nos demais casos.
  - `RaceResponseDto.fromEntity` com segundo parâmetro opcional (default `{
    improvements: [], flaws: [] }`) — confirmar que os 3 call sites existentes
    (`characters/dto/character-response.dto.ts`,
    `characters/dto/character-list-item-response.dto.ts`,
    `sheets/dto/sheet-response.dto.ts`) continuam compilando e funcionando sem
    alteração, e que `RacesController` sempre passa o valor real.
  - `RacesService.create`/`update`/`findById` replicam corretamente o padrão de
    `TalentsService` para `improvements`/`flaws` (resolução, validação de listas,
    `replaceItems` só quando o campo vier definido no `UpdateRaceDto`, "valor efetivo"
    carregado de `loadItemsFor` quando `undefined`).
  - `SheetsService.linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` **sempre**
    passam por `findAccessibleById` (preservando `isRestrictedToOwnSheets` para
    usuários Google) — nenhum novo método bypassa essa checagem.
  - Substituição total (não acumulativa) de `melhorias.race`/`defeitos.race` ao trocar
    de raça, e preservação das demais chaves (`biography`/`trainings`/`talents`/
    `characteristics`) intactas em toda operação que só mexe em `race` ou só em
    `biography`.
  - `linkBiography` valida corretamente: melhoria selecionada pertence à biografia
    informada, é `category = improvement` e `type.name === 'Atributo'`; propriedade da
    melhoria livre é compatível com o tipo "Atributo"; `value`/`type` da melhoria livre
    são sempre fixos no backend (`2`/`'Atributo'`), nunca aceitos do cliente.
  - `defeitos.biography` permanece sempre `[]` após `linkBiography` (fluxo não coleta
    defeitos), e é zerado também em `unlinkBiography`.
  - `UpdateSheetDto` sem `raceId`; `SheetsService.update` sem o bloco correspondente;
    nenhuma rota tratando `raceId` fora de `PUT /sheets/:id/race`.
  - Migrations: ordem de `up()`/`down()` espelhando exatamente
    `1784306230000-CreateBiographiesAndExtendOwnerRelations.ts` para a alteração de
    `improvement_flaws`; nomes de coluna (`melhorias`/`defeitos`, `biography_id`)
    batendo exatamente com as `@Column`/`@JoinColumn` da entidade `Sheet`; nenhuma
    coluna/índice/constraint na migration sem correspondência na entidade e
    vice-versa (checklist da skill `api-migration`).
  - Mensagens de erro em pt-BR, consistentes com o padrão já usado no restante do
    módulo (`'Ficha não encontrada ou não pertence ao usuário.'`, `'Raça não
    encontrada.'`, `'Biografia não encontrada.'`, etc.).
  - Nenhum endpoint novo/alterado de `RacesController` mudou nível de acesso Google
    (continua `read-only` no controller inteiro); `SheetsController` continua sem
    `GoogleAccessGuard` em nenhum método.

## Revisão

Revisão completa dos arquivos das etapas 1 (api-dev) e 2 (api-dev-doc), ambas
`Status: concluído`. Entidades, migrations, DTOs, services e controllers batem entre
si na maior parte dos pontos verificados (ver checklist detalhado abaixo). Dois
achados não bloqueantes:

- **`app-api/src/modules/sheets/sheets.service.ts` (método `linkRace`, consulta a
  `improvementFlawsRepository.find` para montar o snapshot da raça)** — a query que
  busca os registros próprios da raça em `improvement_flaws` não define `order:
  { sortOrder: 'ASC' }`, diferente do padrão já usado em
  `ImprovementFlawsService.loadItemsFor` (usado por `RacesService`/`TalentsService`
  para as mesmas listas). Sem `ORDER BY`, o Postgres não garante a ordem de retorno
  das linhas, então `melhorias.race`/`defeitos.race` no snapshot da ficha podem não
  refletir a ordem de inserção configurada na raça (a mesma ordem que
  `RaceResponseDto.improvements`/`.flaws` documenta explicitamente como "na ordem em
  que foram inseridas"). Isso é observável pelo usuário no frontend (lista de
  melhorias/defeitos da raça na ficha em ordem diferente da tela de edição da raça).
    - Trecho: `const items = await this.improvementFlawsRepository.find({ where: { ownerRace: { id: race.id } }, relations: { type: true, property: { types: true } } });`
    - Sugestão: adicionar `order: { sortOrder: 'ASC' }` à chamada, alinhando com
      `ImprovementFlawsService.loadItemsFor`.
    - **Corrigido (2026-08-03):** adicionado `order: { sortOrder: 'ASC' }` à query de
      `linkRace` em `app-api/src/modules/sheets/sheets.service.ts`, alinhando com
      `ImprovementFlawsService.loadItemsFor`. Conferido que nenhuma outra query de
      snapshot no mesmo service tem o mesmo problema: `linkBiography` usa `findOne`
      (registro único, sem ordenação aplicável) para buscar `biography` e
      `selectedImprovement`, não `find` com múltiplos registros.

- **`app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-entry-response.dto.ts`
  (`SheetImprovementFlawSnapshotEntryResponseDto.fromRaw`, campo `property`)** — o
  DTO declara `property: ImprovementFlawPropertyResponseDto` e reaproveita o
  `@ApiProperty` desse tipo, cuja documentação (em
  `improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`)
  descreve `typeIds` como "Identificadores dos tipos de melhoria/defeito aos quais
  esta propriedade pertence" com exemplo de array não vazio. No entanto, `fromRaw`
  sempre preenche `typeIds: []`, porque essa informação não faz parte do snapshot
  congelado (`SheetImprovementFlawSnapshotEntry.property` só guarda `{id, name}`).
  O contrato Swagger fica desonesto: um consumidor da API pode razoavelmente supor
  que `melhorias.race[].property.typeIds`/`melhorias.biography[].property.typeIds`
  refletem os tipos reais da propriedade (ex.: para revalidar compatibilidade
  Tipo×Propriedade no frontend) e sempre receberá `[]`, o que é enganoso e não
  documentado como comportamento esperado neste contexto específico.
    - Trecho: `dto.property = { id: entry.property.id, name: entry.property.name, typeIds: [] };`
    - Sugestão: não reaproveitar `ImprovementFlawTypeResponseDto`/
      `ImprovementFlawPropertyResponseDto` (que prometem mais dados do que o
      snapshot realmente tem) — criar um tipo enxuto específico do snapshot, ex.
      `SheetImprovementFlawSnapshotTypeRefDto { id: string; name: string }` e
      `SheetImprovementFlawSnapshotPropertyRefDto { id: string; name: string }`,
      sem `typeIds`. Alternativa mais simples, se não quiser criar novos DTOs: manter
      os tipos atuais mas sobrescrever a descrição do `@ApiProperty` de `property`
      em `SheetImprovementFlawSnapshotEntryResponseDto` deixando explícito que
      `typeIds` é sempre `[]` neste contexto (snapshot congelado, sem relação
      `types` carregada) — a opção do novo tipo enxuto é preferível por não expor
      um campo estruturalmente morto.

Nenhum problema bloqueante encontrado. Em particular, foram confirmados corretos:
`@Check`/`@Unique` de `ImprovementFlaw` incluindo `ownerRace`/`owner_race_id` nos 3
lugares (entidade, migration `up`, migration `down` restaurando o estado anterior);
`ownerColumnFor`/`OwnerColumn` cobrindo `RACE` sem regressão; `RaceResponseDto.fromEntity`
com segundo parâmetro opcional (default `{ improvements: [], flaws: [] }`) e os 3
call sites existentes (`characters/dto/character-response.dto.ts`,
`characters/dto/character-list-item-response.dto.ts`,
`sheets/dto/sheet-response.dto.ts`) continuando a compilar sem alteração;
`RacesService.create`/`update`/`findById` replicando fielmente o padrão de
`TalentsService` (resolução, `validateLists`, `replaceItems` só quando o campo vier
definido, "valor efetivo" via `loadItemsFor` quando `undefined`);
`linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` sempre passando por
`findAccessibleById` (preservando `isRestrictedToOwnSheets`); substituição total
(não acumulativa) de `melhorias.race`/`defeitos.race` ao trocar de raça, com
preservação das demais chaves; `linkBiography` validando corretamente pertencimento
à biografia, categoria `improvement`, tipo "Atributo" e compatibilidade
Tipo×Propriedade da melhoria livre, com `value`/`type` sempre fixos no backend;
`defeitos.biography` sempre `[]` após `linkBiography` e zerado em `unlinkBiography`;
`UpdateSheetDto` sem `raceId` e `SheetsService.update` sem o bloco correspondente;
as duas migrations novas espelhando corretamente a ordem de `up()`/`down()` de
`1784306230000-CreateBiographiesAndExtendOwnerRelations.ts`, com nomes de coluna
(`melhorias`, `defeitos`, `biography_id`, `owner_race_id`) batendo exatamente com as
`@Column`/`@JoinColumn` das entidades `Sheet`/`ImprovementFlaw`; mensagens de erro em
pt-BR consistentes com o padrão do módulo; nenhuma mudança de nível de acesso Google
em `RacesController` (`read-only` mantido) nem `GoogleAccessGuard` adicionado a
`SheetsController`.

Arquivos revisados sem outros problemas encontrados:
`app-api/src/modules/sheets/entities/sheet.entity.ts`,
`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`,
`app-api/src/database/migrations/1784306260000-AddRaceOwnerToImprovementFlaws.ts`,
`app-api/src/database/migrations/1784306270000-AddBiographyAndSnapshotsToSheets.ts`,
`app-api/src/modules/sheets/interfaces/sheet-improvement-flaw-snapshot.interface.ts`,
`app-api/src/modules/sheets/dto/link-sheet-race.dto.ts`,
`app-api/src/modules/sheets/dto/link-sheet-biography.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-improvement-flaw-snapshot-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-response.dto.ts`,
`app-api/src/modules/sheets/dto/update-sheet.dto.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`,
`app-api/src/modules/sheets/sheets.module.ts`,
`app-api/src/modules/biographies/dto/biography-option-response.dto.ts`,
`app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`,
`app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`,
`app-api/src/modules/improvement-flaws/dto/improvement-flaw-item-response.dto.ts`,
`app-api/src/modules/races/races.module.ts`,
`app-api/src/modules/races/races.service.ts`,
`app-api/src/modules/races/races.controller.ts`,
`app-api/src/modules/races/dto/create-race.dto.ts`,
`app-api/src/modules/races/dto/race-response.dto.ts`,
`app-api/src/modules/races/dto/update-race.dto.ts`.
