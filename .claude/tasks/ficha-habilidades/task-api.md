# Task API: Aba Habilidades da Ficha (Características, Treinamentos, Talentos)

## Contexto
Ver .claude/tasks/ficha-habilidades/spec.md

Este plano resolve as decisões de arquitetura deixadas em aberto pelo spec (seção "Requisitos
para o planejamento de backend" e decisão de investigação nº 13), com base na investigação do
código atual de `app-api/src/modules/sheets`, `entity-links`, `races`, `biographies`,
`characteristics`, `trainings`, `talents`, `improvement-flaws`, `proficiencies` e `knowledges`.

Achados relevantes que fundamentam as decisões abaixo:
- `ImprovementFlaw`, `Proficiency` e `Knowledge` já possuem colunas `ownerTraining`/`ownerTalent`/
  `ownerCharacteristic` (além de `ownerRace`/`ownerBiography`) — **nenhuma migration é necessária
  nessas três tabelas**, elas já suportam Treinamento/Talento/Característica como donos.
- As interfaces `SheetProficiencySnapshot`/`SheetKnowledgeSnapshot`/`SheetImprovementFlawSnapshot`
  já têm as chaves `trainings`/`talents`/`characteristics` — **nenhuma migration é necessária na
  tabela `sheets`** para os buckets em si.
- `Race` não usa `entity_links` (características/talentos são `ManyToMany` direto,
  `race.characteristics`/`race.talents`, já carregados com tags via `attachRaceOrderedTags`).
  `Biography`/`Characteristic`/`Training`/`Talent` contribuem herança via
  `EntityLinkType.ADDITIONAL_ABILITY` em `entity_links`.
- `BiographyOptionResponseDto` (usado exclusivamente para `sheet.biography`) hoje não expõe
  `additionalAbilities` — único uso desse DTO em todo o código é em `SheetResponseDto`, o que
  facilita estendê-lo sem efeitos colaterais em outros endpoints.
- `SheetsController`/`SheetsService` não usam `@GoogleAccess`/`GoogleAccessGuard` (esse mecanismo é
  usado apenas nos CRUDs de catálogo compartilhado — Características, Treinamentos, Talentos,
  Raças, Biografias). O controle de acesso de fichas já é feito via `isRestrictedToOwnSheets`
  (`currentUser.provider === AuthProvider.GOOGLE` só enxerga fichas próprias) dentro de
  `SheetsService`, aplicado identicamente a todos os endpoints de `/sheets/:id/*` existentes.

## Etapas

### 1. api-dev
Status: concluído

#### Entidade

**Duas entidades novas**, ambas em `app-api/src/modules/sheets/entities/`, resolvendo a decisão de
investigação nº 13 (modelagem de persistência dos vínculos explícitos ficha↔habilidade). Optou-se
por **tabelas de junção com metadado** (não snapshot jsonb), pois os vínculos explícitos (slots e
extras) são estado que precisa ser consultado, filtrado e ter integridade referencial (`onDelete`)
com Treinamento/Talento/Característica — diferente de `melhorias`/`defeitos`/`proficiencias`/
`saberes`, que são snapshots derivados recalculados do zero a cada mutação e não precisam de
integridade referencial própria. Itens **herdados nunca são persistidos** (nem aqui, nem em jsonb):
são sempre computados em tempo de leitura a partir de `race.characteristics`/`race.talents`,
`biography` e dos próprios vínculos explícitos abaixo (ver subseção Controller, "Cálculo de
herança").

1. **`SheetTrainingSlot`** (representa cada slot de Treinamento da ficha, vazio ou preenchido):
   - Campos: `id` (uuid, `BaseEntity`), `slotIndex` (int, posição do slot na ficha, 1-based).
   - Relacionamentos: `sheet` (`ManyToOne(Sheet)`, `onDelete: 'CASCADE'`, `JoinColumn sheet_id`,
     obrigatório); `training` (`ManyToOne(Training)`, `nullable: true`, `onDelete: 'SET NULL'`,
     `JoinColumn training_id` — `null` = slot vazio).
   - **Decisão de projeto**: o "level da ficha que liberou o slot" (metadado exigido pelo requisito
     de backend nº 2) **não é uma coluna persistida** — é derivado deterministicamente de
     `slotIndex` pela fórmula já fixada na decisão de investigação nº 6 (`slotIndex <= 3 ? 1 :
     slotIndex - 2`), calculado em tempo de leitura no service. Isso evita duplicar uma informação
     que já é 100% determinada por `slotIndex`, com única fonte de verdade. Uma linha de slot
     existe **independentemente** de estar vazia ou preenchida — é isso que garante o metadado de
     liberação mesmo com o slot vazio.
   - Uma linha por slot por ficha; a quantidade de linhas é sincronizada com o level da ficha pelo
     service (ver Controller, "Sincronização de slots por level").

2. **`SheetAbilityExtra`** (representa cada Característica/Treinamento/Talento vinculado à ficha
   como "extra", sem limite de quantidade):
   - Campos: `id` (uuid, `BaseEntity`), `entityType` (enum novo `SheetAbilityBucketType` — valores
     `'training' | 'talent' | 'characteristic'` — criado em
     `app-api/src/modules/sheets/enums/sheet-ability-bucket-type.enum.ts`; **não** reaproveitar
     `ReferenceableEntityType`, que inclui Técnica/Magia/Biografia, valores que nunca se aplicam a
     um extra de ficha).
   - Relacionamentos: `sheet` (`ManyToOne(Sheet)`, `onDelete: 'CASCADE'`, obrigatório); `training`
     (`ManyToOne(Training)`, `nullable: true`, `onDelete: 'CASCADE'`); `talent` (`ManyToOne(Talent)`,
     `nullable: true`, `onDelete: 'CASCADE'`); `characteristic` (`ManyToOne(Characteristic)`,
     `nullable: true`, `onDelete: 'CASCADE'`) — exatamente um dos três não-nulo, coerente com
     `entityType`. `onDelete: 'CASCADE'` (diferente do `SET NULL` do slot) porque um extra sem a
     entidade correspondente não faz sentido como registro (mesmo padrão de `target*` em
     `EntityLink`).
   - Ordem de exibição/precedência ("na ordem em que foram adicionados", decisão de investigação
     nº 3): ordenar por `createdAt ASC, id ASC` — não é necessária uma coluna `sortOrder` dedicada,
     pois não há reordenação manual pelo usuário (diferente de tags/proficiências de catálogo).
   - Constraint de exclusividade: `@Check('CK_sheet_ability_extras_target_exclusive',
     'num_nonnulls(training_id, talent_id, characteristic_id) = 1')`, mesmo padrão de
     `EntityLink`/`ImprovementFlaw`/`Proficiency`/`Knowledge`.

3. **Alteração em entidade existente — `Biography`**
   (`app-api/src/modules/biographies/entities/biography.entity.ts`): adicionar campo transiente
   `additionalAbilities!: EntityReferenceResponseDto[]` (sem `@Column`, mesmo padrão já usado para
   `tags!: Tag[]` nesta e em outras entidades — populado em tempo de leitura, não persistido nesta
   tabela). Resolve o gap identificado na decisão de investigação nº 1/requisito de backend nº 6:
   `SheetsService` passa a popular esse campo (nova função auxiliar `attachBiographyAdditionalAbilities`,
   espelhando `attachRaceOrderedTags`) sempre que carregar `sheet.biography` (em
   `findAccessibleById` e em todo ponto que retorna uma ficha com biografia vinculada), consultando
   `EntityLinksService`/o novo carregamento em lote (ver Controller). `BiographyOptionResponseDto.fromEntity`
   passa a ler `biography.additionalAbilities ?? []` — **sem** alterar a assinatura de
   `BiographyOptionResponseDto.fromEntity(biography)` nem de `SheetResponseDto.fromEntity(sheet)`,
   portanto **nenhum call site em `SheetsController` precisa mudar**. Confirma-se que
   `sheet.race.characteristics`/`sheet.race.talents` continuam expostos sem alteração (já vêm
   populados hoje, decisão de investigação nº 1).

4. **Unificação de tipo**: introduzir o tipo `SheetAbilityBucketType = 'training' | 'talent' |
   'characteristic'` (o mesmo enum do item 2) como o tipo compartilhado para: coluna `entityType` de
   `SheetAbilityExtra`, o tipo de `ProficiencySource['type']` estendido (ver abaixo) e a resolução
   do mapa de bucket (`melhorias.trainings`/`.talents`/`.characteristics`), evitando três
   definições paralelas do mesmo conceito.

#### Migration

Necessária: **sim** — duas tabelas novas. As tabelas `improvement_flaws`, `proficiencies`,
`knowledges` e `entity_links` **não precisam de migration** (colunas de dono para
Treinamento/Talento/Característica já existem, conforme investigação).

1. **`CreateSheetTrainingSlotsTable`**: cria `sheet_training_slots` (`id` uuid PK,
   `sheet_id` FK → `sheets.id` `ON DELETE CASCADE` NOT NULL, `slot_index` int NOT NULL,
   `training_id` FK → `trainings.id` `ON DELETE SET NULL` nullable, `created_at`, `updated_at`).
   Constraints: `UNIQUE(sheet_id, slot_index)`; índice único parcial adicional
   `CREATE UNIQUE INDEX ... ON sheet_training_slots (sheet_id, training_id) WHERE training_id IS
   NOT NULL` para impedir duas linhas de slot apontando para o mesmo Treinamento na mesma ficha (uma
   camada extra de defesa; a regra de presença única global — incluindo herdados — continua sendo
   responsabilidade do service, pois não é expressável só com SQL).
   **Backfill obrigatório na própria migration**: para cada ficha já existente em `sheets`, inserir
   `3 + (level - 1)` linhas de slot (`slot_index` de 1 até a contagem, `training_id` NULL), usando o
   `level` atual de cada ficha — sem isso, fichas criadas antes deste deploy ficariam com zero slots
   na aba Treinamentos.
2. **`CreateSheetAbilityExtrasTable`**: cria `sheet_ability_extras` (`id` uuid PK, `sheet_id` FK →
   `sheets.id` `ON DELETE CASCADE` NOT NULL, `entity_type` enum
   (`training`/`talent`/`characteristic`) NOT NULL, `training_id` FK → `trainings.id`
   `ON DELETE CASCADE` nullable, `talent_id` FK → `talents.id` `ON DELETE CASCADE` nullable,
   `characteristic_id` FK → `characteristics.id` `ON DELETE CASCADE` nullable, `created_at`,
   `updated_at`). Constraint: `CHECK (num_nonnulls(training_id, talent_id, characteristic_id) = 1)`.
   Índices únicos parciais análogos aos do slot, um por coluna de entidade (`sheet_id, training_id`
   / `sheet_id, talent_id` / `sheet_id, characteristic_id`, cada um `WHERE ... IS NOT NULL`), para
   impedir duplicidade literal do mesmo item como extra na mesma ficha. Nenhum backfill necessário
   (tabela nova, sem dados legados).

`autoLoadEntities: true` cobre o registro das novas entidades — não é necessário alterar
`app.module.ts`.

#### Controller

**Módulo (`sheets.module.ts`)**: adicionar ao `TypeOrmModule.forFeature([...])` as entidades
`Training`, `TrainingTag`, `Talent`, `Characteristic` (hoje só os repositórios de tag dessas duas
últimas estão registrados) e as duas entidades novas (`SheetTrainingSlot`, `SheetAbilityExtra`);
importar `EntityLinksModule` (exporta `EntityLinksService`, necessário para ler
`additionalAbilities`/`requirements` de Biografia/Treinamento/Talento/Característica).

**Generalização de `EntityLinksService`** (`app-api/src/modules/entity-links/entity-links.service.ts`):
adicionar um novo método de carregamento em lote, ex.:
`loadLinksForOwnersBatched(owners: { entityType: ReferenceableEntityType; id: string }[], linkTypes:
EntityLinkType[]): Promise<Map<string, EntityReferenceResponseDto[]>>` (chave
`` `${linkType}:${entityType}:${id}` ``), que agrupa os `owners` por coluna de dono e executa **no
máximo uma query `IN (...)` por combinação (linkType, coluna de dono)**, em vez de uma query por
entidade — resolve a exigência de evitar N+1 (requisito de backend nº 1, atenção explícita da
decisão de investigação nº 4). É usado tanto para `additionalAbilities` (cálculo de herança) quanto
para `requirements` (validação de requisitos) dos itens atualmente presentes na ficha, e também dos
itens específicos consultados no endpoint de verificação de requisitos do modal (ver abaixo). Método
existente `loadReferencesFor` permanece inalterado (ainda usado pelos CRUDs de
Característica/Treinamento/Talento/Biografia).

**Cálculo de herança (requisito de backend nº 1)** — nova função privada em `SheetsService`, ex.
`computeSheetAbilities(sheet: Sheet, slots: SheetTrainingSlot[], extras: SheetAbilityExtra[])`:
1. **Origens "raiz"** que contribuem `additionalAbilities` (herança de um nível apenas, decisão do
   usuário nº 2 e decisão de investigação nº 2/nº 3 — itens já herdados **não** recontribuem):
   `sheet.race` (contribui direto via `race.characteristics`/`race.talents`, sem `entity_links`),
   `sheet.biography` (via `entity_links`), e cada Treinamento/Talento/Característica **atualmente
   vinculado explicitamente** (slot preenchido ou extra — carregados de `SheetTrainingSlot`/
   `SheetAbilityExtra`) — **não** os próprios itens herdados exibidos (evita recursão além de um
   nível).
2. Para as origens via `entity_links` (biografia + cada item vinculado), usar
   `loadLinksForOwnersBatched(..., [ADDITIONAL_ABILITY])` batched (uma query por tipo de dono).
3. Montar, por bucket (`characteristics`/`trainings`/`talents`), a lista de itens herdados: um card
   por par (item, origem) — **sem deduplicar na exibição** (item 7 do escopo: mesma característica
   herdada de duas origens gera dois cards). Ordenação de exibição alfabética por nome dentro de
   cada origem (mesma convenção de `sortByName` em `loadReferencesFor`), origens na ordem Raça →
   Biografia → Treinamentos vinculados (slot, em ordem de `slotIndex`, depois extras em ordem de
   criação) → Talentos vinculados (extras) → Características vinculadas (extras).
4. Para cada item herdado/slot/extra exibido, resolver seus próprios `requirements` (batched, mesmo
   método) e computar `requirementsMet` (ver "Validação de requisitos" abaixo) e `alreadyPresent`
   não se aplica a esses (já estão presentes por definição).
5. Retornar a estrutura consolidada por sub-aba (ver DTOs abaixo).

**Regra de presença única (requisito de backend nº 2, decisão de investigação nº 7)**: antes de
qualquer escrita (adicionar extra, preencher slot), calcular o conjunto de ids atualmente presentes
por bucket (união de herdados + slot preenchido + extras, deduplicados por id) e rejeitar com
`ConflictException` ("Este item já está vinculado à ficha, seja por herança, slot ou extra.") se o
item alvo já estiver nesse conjunto.

**Validação de requisitos (requisito de backend nº 5, decisão de investigação nº 5)** — nova função
privada `evaluateAbilityRequirements(item: { level: number; requirements: EntityReferenceResponseDto[]
}, sheet: Sheet, presentIdsByBucket): boolean`:
- Nível: `sheet.level >= item.level`.
- Para cada entrada de `item.requirements` (semântica **E**): Característica/Treinamento/Talento →
  presente em `presentIdsByBucket` correspondente; Biografia → `sheet.biography?.id === entrada.id`;
  Técnica/Magia → sempre `false`.
- `requirementsMet = nívelOk && requirements.every(atendido)`.

**Generalização de `recomputeProficiencies`/`recomputeKnowledges`** (requisito de backend nº 3):
- `ProficiencySource['type']` deixa de ser `Extract<..., 'race' | 'biography'>` e passa a ser o
  `SheetAbilityBucketType` completo: `'race' | 'biography' | 'training' | 'talent' |
  'characteristic'`.
- O `ownerColumn` deixa de ser resolvido por ternário e passa a ser um mapa constante:
  `OWNER_COLUMN_BY_SOURCE_TYPE: Record<ProficiencySource['type'], 'ownerRace' | 'ownerBiography' |
  'ownerTraining' | 'ownerTalent' | 'ownerCharacteristic'>`.
- Nova função privada `buildOrderedAbilitySources(sheet, computedAbilities): ProficiencySource[]`
  monta `orderedSources` na ordem: Raça (se houver) → Biografia (se houver) → para cada bucket, na
  ordem `trainings → talents → characteristics` (ordem já convencionada nas interfaces de snapshot,
  decisão de investigação nº 2): itens herdados **deduplicados por id** (mantendo a primeira
  ocorrência, na ordem de origem descrita acima) → itens de slot em ordem de `slotIndex` (só
  `trainings`) → itens extras em ordem de criação. **Atenção de implementação**: a lista de herdados
  usada para exibição (com duplicata por origem) é diferente da usada aqui — para
  `recomputeProficiencies`/`recomputeKnowledges`/melhorias/defeitos, cada item distinto deve
  contribuir suas próprias proficiências/saberes/melhorias/defeitos **uma única vez**, mesmo que
  apareça herdado por mais de uma origem (evita contagem duplicada).
- `recomputeProficiencies`/`recomputeKnowledges` (assinatura inalterada, já recebem `orderedSources`
  genérico) passam a ser chamadas com a lista completa (Raça+Biografia+3 buckets) sempre que
  qualquer vínculo relevante mudar — não só em `linkRace`/`linkBiography` como hoje.

**Generalização da aplicação de melhorias/defeitos** (requisito de backend nº 4): nova função
privada `rebuildBucketImprovementFlaws(bucket: SheetAbilityBucketType, sources: {id: string; name:
string}[])` que, para cada fonte (na mesma ordem herdados→slot→extras, deduplicada), busca em
`improvementFlawsRepository` por `ownerTraining`/`ownerTalent`/`ownerCharacteristic` = id da fonte,
separa `IMPROVEMENT`/`FLAW` (mesmo padrão de `linkRace`, **sem** as regras especiais de melhoria
selecionada/livre da Biografia — item 22 do escopo) e concatena as entradas na ordem das fontes.
Resultado é atribuído a `sheet.melhorias.trainings/.talents/.characteristics` e
`sheet.defeitos.trainings/.talents/.characteristics` via spread (`{ ...sheet.melhorias,
trainings: novoValor }`), preservando `race`/`biography` intocados. **Importante**:
`melhorias.race`/`defeitos.race` e `melhorias.biography`/`defeitos.biography` continuam geridos
exclusivamente pela lógica hoje existente em `linkRace`/`unlinkRace`/`linkBiography`/
`unlinkBiography` (a de Biografia tem estado — melhoria escolhida + livre — que não pode ser
regenerado do zero sem os parâmetros originais do DTO de vínculo); **não** são recalculados pela
nova função genérica.

**Efeito em cascata — nova função orquestradora** `recomputeSheetAbilitySnapshots(sheet: Sheet):
Promise<void>` que executa, nesta ordem: (1) carrega slots/extras atuais; (2) computa herança
(`computeSheetAbilities`); (3) `rebuildBucketImprovementFlaws` para os 3 buckets; (4)
`buildOrderedAbilitySources` + `recomputeProficiencies` + `recomputeKnowledges` com a lista completa
(Raça+Biografia+3 buckets). Esta função passa a ser chamada por:
- `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` (**alteração em métodos existentes**):
  hoje só recalculam proficiências/saberes de Raça+Biografia; devem passar a chamar
  `recomputeSheetAbilitySnapshots` no lugar das chamadas atuais a `recomputeProficiencies`/
  `recomputeKnowledges`, pois trocar Raça/Biografia também muda a composição herdada dos buckets
  `trainings`/`talents`/`characteristics` (ex.: `race.characteristics` alimenta o bucket
  `characteristics`; `biography.additionalAbilities` pode referenciar qualquer um dos três tipos).
  A lógica própria de `melhorias.race`/`defeitos.race`/`melhorias.biography`/`defeitos.biography`
  permanece como está.
- Todas as novas operações de extras/slots (adicionar/remover extra, preencher/esvaziar slot).
- A sincronização de slots por redução/aumento de level (abaixo).

**Sincronização de slots por level (requisito de backend nº 2/nº 7, item 13 do escopo)** — nova
função privada `syncTrainingSlotsForLevel(sheet: Sheet, newLevel: number): Promise<void>`, chamada
de dentro de `SheetsService.update()` sempre que `dto.level !== undefined && dto.level !==
sheet.level` (antes de salvar a ficha com o novo level):
- `newSlotCount = 3 + (newLevel - 1)`.
- Se `newSlotCount` > contagem atual: cria linhas de slot vazias com `slotIndex` sequencial até
  `newSlotCount`.
- Se `newSlotCount` < contagem atual: remove as linhas com `slotIndex > newSlotCount`; para cada uma
  que estava preenchida, isso desvincula o Treinamento daquele slot. Cobre reduções de múltiplos
  levels de uma vez (ex.: level 5 → level 1 remove todas as linhas com `slotIndex > 3` numa única
  passada).
- Ao final, chama `recomputeSheetAbilitySnapshots(sheet)` (a remoção de treinamento(s) do slot afeta
  melhorias/defeitos/proficiências/saberes do bucket `trainings`, e potencialmente `talents`/
  `characteristics` se o treinamento removido tinha `additionalAbilities` próprias).
- `SheetsService.create()` passa a criar as 3 linhas de slot iniciais (`slotIndex` 1–3,
  `training: null`) após salvar a ficha nova (que sempre nasce com `level: 1`).
- **Decisão sobre o retorno de `PUT /sheets/:id`**: mantém o contrato atual, retornando apenas
  `SheetResponseDto` (que já reflete `melhorias`/`defeitos`/`proficiencias`/`saberes` atualizados).
  A listagem de slots (necessária para a sub-aba Treinamentos refletir a mudança de quantidade,
  requisito de frontend nº 9) é obtida pelo frontend com uma chamada a `GET /sheets/:id/abilities`
  logo após uma atualização de level bem-sucedida — decisão deliberada para não onerar todo `PUT
  /sheets/:id` (usado em autosave de campos triviais como nome/PV) com o custo do cálculo de
  herança, que só é necessário quando a sub-aba Habilidades está em uso.

**Endpoints novos, todos em `SheetsController`, sob `@UseGuards(JwtAuthGuard)` (mesmo padrão do
controller, sem `@GoogleAccess`)**:

1. `GET /sheets/:id/abilities` — leitura consolidada por sub-aba (requisito de backend nº 1 e nº 7).
   Retorna `SheetAbilitiesResponseDto`:
   ```
   { characteristics: { inherited: SheetAbilityCardResponseDto[]; extras: SheetAbilityCardResponseDto[] },
     trainings: { slots: SheetTrainingSlotResponseDto[]; inherited: [...]; extras: [...] },
     talents: { inherited: [...]; extras: [...] } }
   ```
   `SheetAbilityCardResponseDto { id, name, level, tags, requirementsMet: boolean, origin:
   { entityType, id, name } | null }` (`origin` só preenchido para itens herdados, nulo para
   slot/extra, conforme decisão de investigação nº 8/escopo item 10). `SheetTrainingSlotResponseDto
   { slotIndex, unlockedAtLevel, training: SheetAbilityCardResponseDto | null }`.
2. `POST /sheets/:id/abilities/requirement-checks` — verificação em lote de presença/requisitos
   para itens arbitrários do catálogo (uso pelo modal de seleção, requisito de backend nº 5b).
   Corpo: `{ items: EntityReferenceInputDto[] }` (reaproveita o DTO já existente de
   `entity-links`, restringindo `entityType` a `training | talent | characteristic` via validação —
   400 se outro tipo for enviado). Retorna `AbilityRequirementCheckResponseDto[]`:
   `{ entityType, id, alreadyPresent: boolean, requirementsMet: boolean }[]`. **Decisão de
   arquitetura**: implementado como endpoint próprio do domínio de fichas (não um novo endpoint de
   busca de catálogo) para evitar dependência circular de módulo — os módulos de Característica/
   Treinamento/Talento não podem depender de `SheetsModule` (que já depende deles), então a
   avaliação de "já presente"/"requisitos atendidos" para itens do catálogo só pode ser feita a
   partir do lado de `SheetsModule`, que já tem acesso a `EntityLinksService` e ao estado da ficha.
   Isso preserva o requisito de backend nº 8 (nenhum novo endpoint de busca de catálogo) — este
   endpoint não pagina nem busca o catálogo, apenas avalia ids específicos enviados pelo frontend
   (a página atual do modal, tipicamente ≤ 20 itens).
3. `POST /sheets/:id/characteristics/extras` — corpo `AddCharacteristicExtraDto { characteristicId
   }`. Valida presença única + `requirementsMet` (rejeita com `ConflictException` em ambos os
   casos), cria `SheetAbilityExtra`, chama `recomputeSheetAbilitySnapshots`.
4. `DELETE /sheets/:id/characteristics/extras/:characteristicId` — remove o extra (404 se não
   existir como extra desta ficha), chama `recomputeSheetAbilitySnapshots`.
5. `POST /sheets/:id/trainings/extras` — `AddTrainingExtraDto { trainingId }` — mesmo padrão do
   item 3.
6. `DELETE /sheets/:id/trainings/extras/:trainingId` — mesmo padrão do item 4.
7. `POST /sheets/:id/talents/extras` — `AddTalentExtraDto { talentId }` — mesmo padrão do item 3.
8. `DELETE /sheets/:id/talents/extras/:talentId` — mesmo padrão do item 4.
9. `PUT /sheets/:id/trainings/slots/:slotIndex/training` — corpo `FillTrainingSlotDto { trainingId
   }`. 404 se o slot não existir na ficha; `ConflictException` se o slot já estiver preenchido, se o
   Treinamento já estiver presente em outro lugar da ficha, ou se `requirementsMet` for falso.
   Preenche `SheetTrainingSlot.training`, chama `recomputeSheetAbilitySnapshots`.
10. `DELETE /sheets/:id/trainings/slots/:slotIndex/training` — esvazia o slot (`training = null`,
    a linha do slot **não** é removida — preserva o metadado de liberação), chama
    `recomputeSheetAbilitySnapshots`. 404 se o slot não existir ou já estiver vazio.

Endpoints 3–10 retornam um DTO composto `SheetAbilitiesMutationResponseDto { sheet:
SheetResponseDto; abilities: SheetAbilitiesResponseDto }`, para que o frontend atualize em uma única
chamada tanto os snapshots (melhorias/defeitos/proficiências/saberes, parte de `SheetResponseDto`)
quanto a listagem de habilidades (`abilities`) afetados pela mutação — evita round-trip duplicado a
cada ação do usuário na aba Habilidades (diferente de `PUT /sheets/:id`, que é usado em contextos
mais amplos/triviais e mantém o contrato atual, conforme justificado acima).

DTOs novos (em `app-api/src/modules/sheets/dto/`): `SheetAbilityCardResponseDto`,
`SheetTrainingSlotResponseDto`, `SheetAbilitiesResponseDto` (e sub-DTOs por sub-aba),
`SheetAbilitiesMutationResponseDto`, `AddCharacteristicExtraDto`, `AddTrainingExtraDto`,
`AddTalentExtraDto`, `FillTrainingSlotDto`, `AbilityRequirementCheckResponseDto`. O corpo de
`POST /sheets/:id/abilities/requirement-checks` reaproveita `EntityReferenceInputDto`
(`app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`), já com `class-validator`
(`@IsEnum`/`@IsUUID`) — sem necessidade de um novo DTO de input equivalente.

Todos os `NotFoundException`/`ConflictException`/mensagens de validação em pt-BR, seguindo o padrão
já usado em `sheets.service.ts` (ex.: "Ficha não encontrada ou não pertence ao usuário.",
"Treinamento não encontrado.", "Este item já está vinculado à ficha.").

**Acesso Google**: não aplicável no sentido do template padrão de CRUD — os novos endpoints não
usam `@GoogleAccess`/`GoogleAccessGuard` (mecanismo restrito aos CRUDs de catálogo compartilhado).
Seguem exatamente o padrão já usado por `PUT /sheets/:id/race`, `DELETE /sheets/:id/biography` etc.:
apenas `@UseGuards(JwtAuthGuard)` + `@CurrentUser()`, com a restrição de propriedade (usuários
`provider: 'google'` só acessam fichas próprias) já garantida por `isRestrictedToOwnSheets` dentro
de `SheetsService.findAccessibleById`, reaproveitado por todos os novos métodos de serviço
(requisito de backend nº 9 — nenhuma regra de permissão nova).

**Ponto de atenção para o api-dev**: excluir um Treinamento/Talento/Característica/Raça do catálogo
(via `DELETE /trainings/:id` etc.) aciona `onDelete: 'SET NULL'`/`'CASCADE'` diretamente no banco,
sem passar por `SheetsService` — isso deixa os snapshots (`melhorias`/`defeitos`/`proficiencias`/
`saberes`) de fichas afetadas desatualizados até a próxima mutação da ficha. Este comportamento já
existe hoje para Raça (`sheet.race` com `onDelete: 'SET NULL'`) e não é resolvido por este plano —
mantém-se o mesmo nível de consistência eventual já aceito no código atual, fora de escopo desta
demanda.

---

Status: concluído
Entidade:
- `app-api/src/modules/sheets/entities/sheet-training-slot.entity.ts` (`SheetTrainingSlot`, nova)
- `app-api/src/modules/sheets/entities/sheet-ability-extra.entity.ts` (`SheetAbilityExtra`, nova)
- `app-api/src/modules/biographies/entities/biography.entity.ts` (alterada: campo transiente
  `additionalAbilities`)
Migration:
- `app-api/src/database/migrations/1784306550000-CreateSheetTrainingSlotsTable.ts` (cria
  `sheet_training_slots`, com backfill de slots para fichas existentes)
- `app-api/src/database/migrations/1784306560000-CreateSheetAbilityExtrasTable.ts` (cria
  `sheet_ability_extras`)
Rotas:
- GET /sheets/:id/abilities
- POST /sheets/:id/abilities/requirement-checks
- POST /sheets/:id/characteristics/extras
- DELETE /sheets/:id/characteristics/extras/:characteristicId
- POST /sheets/:id/trainings/extras
- DELETE /sheets/:id/trainings/extras/:trainingId
- POST /sheets/:id/talents/extras
- DELETE /sheets/:id/talents/extras/:talentId
- PUT /sheets/:id/trainings/slots/:slotIndex/training
- DELETE /sheets/:id/trainings/slots/:slotIndex/training
Arquivos:
- `app-api/src/modules/sheets/enums/sheet-ability-bucket-type.enum.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-ability-origin-response.dto.ts` (novo, exporta também o tipo
  `SheetAbilityOriginEntityType`, ver desvio nº 1 abaixo)
- `app-api/src/modules/sheets/dto/sheet-ability-card-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-training-slot-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-characteristics-abilities-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-trainings-abilities-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-talents-abilities-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-abilities-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/sheet-abilities-mutation-response.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/add-characteristic-extra.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/add-training-extra.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/add-talent-extra.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/fill-training-slot.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/check-ability-requirements.dto.ts` (novo)
- `app-api/src/modules/sheets/dto/ability-requirement-check-response.dto.ts` (novo)
- `app-api/src/modules/biographies/dto/biography-option-response.dto.ts` (alterado: expõe
  `additionalAbilities`)
- `app-api/src/modules/entity-links/entity-links.service.ts` (alterado: novo método
  `loadLinksForOwnersBatched`)
- `app-api/src/modules/sheets/sheets.service.ts` (reescrito: `computeSheetAbilities`,
  `evaluateAbilityRequirements`, `rebuildBucketImprovementFlaws`, `buildOrderedAbilitySources`,
  `recomputeSheetAbilitySnapshots`, `syncTrainingSlotsForLevel`, `attachBiographyAdditionalAbilities`,
  novos métodos públicos de leitura/mutação de habilidades, `linkRace`/`unlinkRace`/`linkBiography`/
  `unlinkBiography`/`create`/`update` ajustados)
- `app-api/src/modules/sheets/sheets.controller.ts` (reescrito: 10 endpoints novos + helpers privados
  de mapeamento para os DTOs de habilidades)
- `app-api/src/modules/sheets/sheets.module.ts` (alterado: registra `SheetTrainingSlot`,
  `SheetAbilityExtra`, `Training`, `TrainingTag`, `Talent`, `Characteristic`; importa
  `EntityLinksModule`)

Desvios em relação ao plano (com justificativa):
1. O plano define `SheetAbilityCardResponseDto.origin` como `{ entityType, id, name }` sem detalhar
   o tipo de `entityType`, e reaproveita a nomenclatura de `ReferenceableEntityType` (Treinamento/
   Talento/Técnica/Magia/Característica/Biografia) em outros pontos do texto — mas `ReferenceableEntityType`
   não inclui `RACE` (Raça não é uma entidade referenciável em `entity_links`, conforme decisão de
   investigação nº 1 do spec), e Raça é uma origem válida de item herdado ("via Raça X"). Para não
   inventar uma decisão de arquitetura maior (ex.: adicionar `RACE` a `ReferenceableEntityType`, o que
   afetaria `entity_links` e todos os módulos que o consomem), criei um tipo local
   `SheetAbilityOriginEntityType = ReferenceableEntityType | 'race'`, usado exclusivamente em
   `SheetAbilityOriginResponseDto`/`SheetAbilityCard` (serviço de fichas). Nenhum outro módulo é
   afetado.
2. Os métodos de serviço para os 10 endpoints retornam estruturas "raw" (`SheetAbilitiesData`,
   `SheetAbilityMutationResult`, `AbilityRequirementCheckResult[]`), não instâncias dos DTOs de
   resposta — seguindo o padrão já estabelecido no projeto (ex.: `TrainingsService.findById` retorna
   `TrainingWithReferences`, não `TrainingResponseDto`) de que a montagem do DTO de resposta é
   responsabilidade do controller, não do service. O controller centraliza essa montagem em três
   helpers privados (`toCardDto`, `toAbilitiesResponseDto`, `toMutationResponseDto`).
3. Não foi necessário alterar `app.module.ts` (`SheetsModule` já estava registrado) nem criar um DTO
   de input próprio para `POST /sheets/:id/abilities/requirement-checks` (reaproveita
   `EntityReferenceInputDto` dentro de um DTO wrapper `CheckAbilityRequirementsDto { items }`), como já
   antecipado pelo próprio plano.

Pendências para a etapa 3 (api-dev-codereviewer) revisar com atenção, além do checklist já listado na
seção 3 abaixo: a extensa lógica de dedução de herança/presença/requisitos em
`SheetsService.computeSheetAbilities` foi escrita em uma única passada, sem testes automatizados
criados nesta etapa (fora do escopo de `api-dev`) — validar manualmente os cenários de duplicidade de
origem, dedup por bucket e a ordem de precedência antes de considerar pronta para produção.

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1 ✅
- Cobertura no Swagger completada:
  - ✅ Os 10 endpoints novos com @ApiOperation, respostas 200/201/204, @ApiNotFoundResponse,
    @ApiConflictResponse, @ApiBadRequestResponse com mensagens de validação em pt-BR,
    seguindo o padrão de descrições já usado em `sheets.controller.ts`
  - ✅ Todos os @ApiProperty/@ApiPropertyOptional dos DTOs novos:
    - SheetAbilityCardResponseDto (id, name, level, tags, requirementsMet, origin)
    - SheetTrainingSlotResponseDto (slotIndex, unlockedAtLevel, training)
    - SheetCharacteristicsAbilitiesResponseDto (inherited, extras)
    - SheetTrainingsAbilitiesResponseDto (slots, inherited, extras)
    - SheetTalentsAbilitiesResponseDto (inherited, extras)
    - SheetAbilitiesResponseDto (characteristics, trainings, talents) — adicionadas descrições
    - SheetAbilitiesMutationResponseDto (sheet, abilities)
    - AbilityRequirementCheckResponseDto (entityType, id, alreadyPresent, requirementsMet)
    - SheetAbilityOriginResponseDto (entityType, id, name)
    - AddCharacteristicExtraDto (characteristicId)
    - AddTrainingExtraDto (trainingId)
    - AddTalentExtraDto (talentId)
    - FillTrainingSlotDto (trainingId)
    - CheckAbilityRequirementsDto (items)
  - ✅ Novo campo `additionalAbilities` em `BiographyOptionResponseDto` com @ApiProperty
  - ✅ Confirmado: tag Swagger usada é `sheets` (mesma do restante do controller)

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Regra de presença única cobrindo herdados (calculados) + slots + extras em todas as operações
    de escrita, e a dedução correta ao montar `orderedSources` (herdados deduplicados por id, sem
    contagem duplicada de melhorias/proficiências/saberes quando o mesmo item é herdado de duas
    origens).
  - Sincronização de slots em redução/aumento de level, incluindo redução de múltiplos levels de
    uma vez, e o desvínculo + recálculo consistente do(s) Treinamento(s) removido(s).
  - Que `melhorias.race`/`defeitos.race`/`melhorias.biography`/`defeitos.biography` não sejam
    afetados pela nova função genérica de melhorias/defeitos (só `trainings`/`talents`/
    `characteristics`).
  - Que `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` passem a recalcular também os
    buckets `trainings`/`talents`/`characteristics` (e não só `race`/`biography` como hoje).
  - Ausência de N+1 no cálculo de herança e na verificação de requisitos em lote.
  - Migration: constraints, índices únicos parciais e o backfill de slots para fichas já existentes.

## Revisão

Revisão cobrindo `app-api/src/modules/sheets/entities/sheet-training-slot.entity.ts`,
`app-api/src/modules/sheets/entities/sheet-ability-extra.entity.ts`,
`app-api/src/modules/biographies/entities/biography.entity.ts`,
`app-api/src/database/migrations/1784306550000-CreateSheetTrainingSlotsTable.ts`,
`app-api/src/database/migrations/1784306560000-CreateSheetAbilityExtrasTable.ts`,
`app-api/src/modules/sheets/sheets.service.ts`, `app-api/src/modules/sheets/sheets.controller.ts`,
`app-api/src/modules/sheets/sheets.module.ts`, `app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/entity-links/entity-links.module.ts`,
`app-api/src/modules/biographies/dto/biography-option-response.dto.ts`, os 14 DTOs novos em
`app-api/src/modules/sheets/dto/`, `app-api/src/modules/sheets/enums/sheet-ability-bucket-type.enum.ts`
e as interfaces de snapshot em `app-api/src/modules/sheets/interfaces/`, contra `spec.md` e o plano
registrado nas seções 1/2 acima.

Pontos positivos confirmados: os 10 endpoints novos usam `@UseGuards(JwtAuthGuard)` +
`@CurrentUser()` e todos os métodos de serviço correspondentes passam por
`findAccessibleById`/`isRestrictedToOwnSheets` (sem IDOR); `loadLinksForOwnersBatched` de fato
executa no máximo uma query `IN (...)` por combinação (linkType, coluna de dono), sem N+1, e é usada
corretamente tanto para `additionalAbilities` quanto para `requirements` em `computeSheetAbilities`;
a herança respeita o limite de um nível (apenas Raça/Biografia/itens explicitamente vinculados via
slot ou extra são origens — itens já herdados não recontribuem); `melhorias.race`/`defeitos.race`/
`melhorias.biography`/`defeitos.biography` não são tocados por `rebuildBucketImprovementFlaws`;
`linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` passaram a chamar
`recomputeSheetAbilitySnapshots`; as migrations criam as tabelas com os campos, FKs (`ON DELETE
CASCADE`/`SET NULL` corretos), `CHECK` de exclusividade e índices únicos parciais exatamente como
descrito na entidade correspondente, o backfill de slots para fichas existentes está presente e
correto, e os `down()` revertem o `up()` adequadamente; todas as mensagens de erro estão em pt-BR;
`synchronize: false` não foi alterado.

- **`app-api/src/modules/sheets/sheets.service.ts` (função privada `computeSheetAbilities`, trecho
  que monta `orderedDistinctByBucket`, por volta das linhas 1025–1048)** — falta deduplicação por id
  **entre** os segmentos herdados/slot/extras ao montar a lista usada por
  `buildOrderedAbilitySources`/`rebuildBucketImprovementFlaws`/`recomputeProficiencies`/
  `recomputeKnowledges`. `dedupById` só remove duplicatas dentro da própria lista de herdados (caso
  do mesmo item herdado de duas origens diferentes), mas não contra itens que já estão em slot ou
  extra. Cenário concreto: um Treinamento X é adicionado como extra da ficha; depois, a Raça/
  Biografia da ficha é trocada para uma cujo `additionalAbilities` também inclui X (ou um novo extra
  cujo `additionalAbilities` referencia X é adicionado) — nesse momento X passa a aparecer duas vezes
  em `orderedDistinctByBucket.trainings` (uma vez como herdado, outra como extra). Isso não é
  bloqueado por nenhuma validação de escrita existente (a regra de presença única só impede
  *adicionar* um item já presente, não impede que um item já presente passe a ser *também* herdado
  depois). O efeito é contagem duplicada real: em `rebuildBucketImprovementFlaws` a mesma
  melhoria/defeito de X é aplicada duas vezes (valor efetivamente dobrado no snapshot da ficha); em
  `recomputeProficiencies`, a mesma origem/id é processada duas vezes e, como a segunda passagem tem
  `gradation.level` igual (não maior) à primeira, cai no ramo de "ajuste" e gera um registro de
  conflito de proficiência espúrio de X contra si mesmo. Isso contraria diretamente o comentário do
  próprio código-fonte ("cada item distinto deve contribuir suas próprias
  proficiências/saberes/melhorias/defeitos uma única vez, mesmo que apareça herdado por mais de uma
  origem (evita contagem duplicada)").
  - Trecho:
    ```
    trainings: [
      ...dedupById(trainingsInherited),
      ...filledSlots.map((slot) => ({ id: slot.training.id, name: slot.training.name })),
      ...trainingExtraItems.map((item) => ({ id: item.id, name: item.name })),
    ],
    ```
  - Sugestão: após concatenar os três segmentos de cada bucket (herdados deduplicados → slot →
    extras), aplicar uma deduplicação final por `id` sobre a lista inteira (mantendo a primeira
    ocorrência, preservando a ordem de precedência já definida pela decisão de investigação nº 3),
    para `trainings`, `talents` e `characteristics`.

- **`app-api/src/modules/sheets/sheets.controller.ts:392-419` (`checkAbilityRequirements`)** — o
  método é `@Post(':id/abilities/requirement-checks')` sem `@HttpCode`, portanto retorna HTTP 201
  (padrão do Nest para `POST`) em tempo de execução, mas está documentado com `@ApiOkResponse` (200),
  divergindo do comportamento real do endpoint.
  - Trecho: `@Post(':id/abilities/requirement-checks') ... @ApiOkResponse({ type:
    [AbilityRequirementCheckResponseDto] })` sem `@HttpCode`.
  - Sugestão: adicionar `@HttpCode(HttpStatus.OK)` (o endpoint apenas avalia/consulta, não cria
    recurso), mantendo a documentação já correta como 200.

- **`app-api/src/modules/sheets/sheets.service.ts` (`recomputeProficiencies`, `recomputeKnowledges`,
  `rebuildBucketImprovementFlaws`)** — cada uma continua executando uma query por "source" dentro de
  um `for...of` com `await` sequencial (padrão pré-existente, antes limitado a no máximo 2 origens —
  raça e biografia). Agora que a lista de origens inclui um número ilimitado de
  treinamentos/talentos/características extras/slots, toda chamada a `recomputeSheetAbilitySnapshots`
  (disparada em cada mutação de extra/slot) executa até 5×N queries sequenciais (N = itens vinculados
  na ficha), ao contrário de `loadLinksForOwnersBatched`, que foi corretamente batchado com `IN
  (...)`. Não é um bug funcional, mas é um risco real de performance/N+1 conforme a ficha acumula
  extras, relevante para o ponto de atenção desta revisão sobre ausência de N+1.
  - Sugestão: agrupar as buscas de `proficiencies`/`knowledges`/`improvementFlaws` por `ownerColumn`
    numa única query `IN (...)` por (tabela, coluna de dono), reconstruindo a ordem de precedência em
    memória a partir do resultado agrupado — mesmo padrão já usado em `loadLinksForOwnersBatched`.

- **Regra de presença única — janela de corrida entre tabelas** — a regra é garantida apenas na
  camada de aplicação no momento da escrita (comparação contra `presentIdsByBucket` computado antes
  do insert em cada método `add*Extra`/`fillTrainingSlot`), sem transação/lock cobrindo o ciclo
  leitura-validação-escrita. Os índices únicos parciais no banco (`sheet_training_slots` e
  `sheet_ability_extras`) só protegem duplicidade dentro da mesma tabela — não impedem, por exemplo,
  uma corrida entre `PUT .../trainings/slots/:slotIndex/training` e `POST .../trainings/extras` para
  o mesmo treinamento em requisições concorrentes. Já reconhecido no texto do plano ("a regra de
  presença única global... não é expressável só com SQL"), mas vale registrar como ponto sem nenhuma
  camada adicional de proteção (transação com lock).
  - Sugestão (opcional, a critério do time): encapsular leitura+validação+escrita de cada mutação em
    uma transação (`manager.transaction`/`queryRunner`) com `pessimistic_write` sobre a ficha, caso o
    risco de concorrência seja considerado relevante em produção.

### Correções aplicadas (rodada de correção pós-revisão)

- **Achado 1 (Alto) — corrigido.** Em `app-api/src/modules/sheets/sheets.service.ts`
  (`computeSheetAbilities`), foi adicionada uma nova função `dedupFinal` aplicada sobre a lista já
  concatenada (herdados deduplicados → slot → extras) de cada bucket (`trainings`, `talents`,
  `characteristics`) ao montar `orderedDistinctByBucket` — mantém a primeira ocorrência por `id`,
  preservando a ordem de precedência herdados → slot → extras (decisão de investigação nº 3 do
  spec). Isso elimina a contagem duplicada de melhorias/defeitos/proficiências/saberes quando um
  item já presente como slot/extra passa também a ser herdado (ou vice-versa) por uma nova origem.
  A dedup é aplicada apenas a `orderedDistinctByBucket` (usado por
  `rebuildBucketImprovementFlaws`/`buildOrderedAbilitySources`/`recomputeProficiencies`/
  `recomputeKnowledges`) — as listas de exibição (`characteristicsInheritedCards`,
  `trainingsInheritedCards`, `talentsInheritedCards`, geradas a partir de `characteristicsInherited`/
  `trainingsInherited`/`talentsInherited`, não deduplicadas) permanecem inalteradas, preservando a
  regra de exibição do spec (item 7 do escopo confirmado) de um card por origem quando a mesma
  característica é herdada de duas origens diferentes.
- **Achado 2 (Médio) — corrigido.** Em `app-api/src/modules/sheets/sheets.controller.ts`, foi
  adicionado `@HttpCode(HttpStatus.OK)` ao método `checkAbilityRequirements`
  (`POST /sheets/:id/abilities/requirement-checks`), alinhando o status HTTP real (200) com a
  documentação Swagger já existente (`@ApiOkResponse`). `HttpCode`/`HttpStatus` já estavam
  importados de `@nestjs/common` no arquivo.
- **Achados 3 e 4 permanecem em aberto por decisão de escopo** — não foram corrigidos nesta rodada
  (performance de queries sequenciais em `recomputeProficiencies`/`recomputeKnowledges`/
  `rebuildBucketImprovementFlaws`, e a janela de corrida teórica sem transação na regra de presença
  única). Seguem registrados como observação para decisão futura do time.