# Task API: Saber (feature irmã de Proficiências)

## Contexto
Não existe `.claude/tasks/saberes/spec.md` — as regras de negócio já foram fechadas
diretamente com o usuário na demanda que originou este plano (ver mensagem de
orquestração). Este plano usa como referência estrutural a feature já entregue
`.claude/tasks/proficiencias/task-api.md` (Parte B e Parte C), reaproveitando
literalmente o mesmo padrão de associação polimórfica por dono e de recomputação na
ficha, com as diferenças explícitas descritas abaixo.

## Contrato de API (fonte de verdade para o planejamento web)

Esta seção é normativa: o planejamento web desta demanda deve usar exatamente estes
nomes, sem inferir variações.

- **Nenhuma rota nova de CRUD é criada para Saber.** Não existe `/knowledges` como
  controller público (mesmo padrão de `proficiencies`, que também não tem controller
  próprio). As rotas que passam a aceitar/retornar saberes são as já existentes das 5
  entidades donas, com assinatura inalterada:
  - `POST /talents`, `GET /talents`, `GET /talents/:id`, `PUT /talents/:id`, `DELETE /talents/:id`
  - `POST /trainings`, `GET /trainings`, `GET /trainings/:id`, `PUT /trainings/:id`, `DELETE /trainings/:id`
  - `POST /characteristics`, `GET /characteristics`, `GET /characteristics/:id`, `PUT /characteristics/:id`, `DELETE /characteristics/:id`
  - `POST /biographies`, `GET /biographies`, `GET /biographies/:id`, `PUT /biographies/:id`, `DELETE /biographies/:id`
  - `POST /races`, `GET /races`, `GET /races/:id`, `PUT /races/:id`, `DELETE /races/:id`
  - `PUT /sheets/:id/race`, `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography`,
    `DELETE /sheets/:id/biography` — assinatura inalterada; passam também a recomputar
    `saberes` (ver Controller/Sheets abaixo).
  - `GET /proficiency-gradations` — **reaproveitado sem alteração** como fonte das
    opções de graduação para o seletor de Saber no frontend (a mesma tabela
    `proficiency_gradations`/`ProficiencyGradation` já usada por Proficiências). Não
    existe endpoint próprio de graduações para Saber.
  - **Não existe** nenhum endpoint de "ajuste"/conflito para Saber (nada análogo a
    `PUT /sheets/:id/proficiency-adjustments/:adjustmentId`), pois a regra de negócio
    confirmada é "descarte sem compensação", sem intervenção manual do usuário.

- **Nome exato do campo nos DTOs das 5 entidades donas**: `knowledges`.
  - `Create<Entidade>Dto` / `Update<Entidade>Dto`: `knowledges?: KnowledgeItemInputDto[]`
    (opcional, mesmo padrão de `proficiencies?: ProficiencyItemInputDto[]`).
  - `<Entidade>ResponseDto`: `knowledges: KnowledgeItemResponseDto[]` (obrigatório no
    retorno, na ordem de inserção).
  - `KnowledgeItemInputDto`: `{ title: string; gradation: string /* uuid */ }`.
  - `KnowledgeItemResponseDto`: `{ id: string; title: string; gradation: { id: string; name: string; level: number } }`.
  - Justificativa do nome: segue a mesma convenção já usada para `proficiencies` — o
    campo exposto nas 5 entidades donas usa o nome técnico em inglês do módulo
    (`knowledges`, plural de `Knowledge`), e não a palavra em português "saberes". A
    palavra em português é reservada para o campo do snapshot da ficha, exatamente
    como o par existente `proficiencies` (campo nas 5 entidades) / `proficiencias`
    (campo no snapshot da ficha).

- **Nome exato do campo no `SheetResponseDto`**: `saberes` (pt-BR, explícito no pedido
  do usuário), do tipo `SheetKnowledgeSnapshotResponseDto`. Segue a mesma convenção
  pt-BR já usada em `melhorias`, `defeitos` e `proficiencias` no mesmo DTO.
  **Não existe** `saberesAjustados` nem qualquer campo equivalente — confirmado
  explicitamente pelo usuário que não há mecanismo de ajuste para Saber.

- **Formato exato de cada entrada do snapshot `saberes`** (uma coleção agrupada por
  origem, com as mesmas 5 chaves já usadas em `proficiencias`/`melhorias`/`defeitos`:
  `race`, `biography`, `trainings`, `talents`, `characteristics` — as 3 últimas sempre
  `[]` por ora, pois só Raça e Biografia são hoje vinculáveis à ficha):
  ```ts
  interface SheetKnowledgeSnapshotEntryResponseDto {
    id: string;
    title: string;
    gradation: { id: string; name: string; level: number };
    sourceName: string;
  }

  interface SheetKnowledgeSnapshotResponseDto {
    race: SheetKnowledgeSnapshotEntryResponseDto[];
    biography: SheetKnowledgeSnapshotEntryResponseDto[];
    trainings: SheetKnowledgeSnapshotEntryResponseDto[];
    talents: SheetKnowledgeSnapshotEntryResponseDto[];
    characteristics: SheetKnowledgeSnapshotEntryResponseDto[];
  }
  ```
  `title` é o texto livre já normalizado por trim (sem espaços nas pontas, mas com a
  capitalização original digitada pelo usuário preservada). `gradation.level` é o
  campo que o frontend usa para exibir/ordenar magnitude, igual a Proficiência.

## Etapas

### 1. api-dev

#### Entidade

**Nova entidade `Knowledge`** (tabela `knowledges`), módulo novo
`app-api/src/modules/knowledges/`, espelhando estruturalmente `Proficiency`
(`app-api/src/modules/proficiencies/entities/proficiency.entity.ts`) nas colunas de
dono, mas com uma diferença estrutural central pedida pelo usuário:

- `sortOrder` (`int`, `name: 'sort_order'`) — ordem de inserção, mesmo papel do campo
  equivalente em `Proficiency`.
- `title` (`varchar`, `@Column()`, não nulo) — **texto livre**, não uma FK para uma
  tabela de propriedades fixas (diferença estrutural central em relação a
  `Proficiency.property`). Armazenado com trim aplicado pelo service antes de salvar
  (remove espaços nas pontas), mas **sem** normalização de caixa (preserva a
  capitalização digitada pelo usuário para exibição). Não é feito collapse de espaços
  internos múltiplos — apenas trim nas pontas, leitura literal de "case-insensitive +
  trim" do pedido.
- `gradation` — `@ManyToOne(() => ProficiencyGradation, { nullable: false })`,
  `@JoinColumn({ name: 'gradation_id' })`. **Reaproveita a entidade/tabela já
  existente** `ProficiencyGradation` / `proficiency_gradations`
  (`app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts`)
  — nenhuma tabela nova de graduação é criada para Saber.
- Colunas de dono mutuamente exclusivas, idênticas em nome e comportamento às de
  `Proficiency`: `ownerTalent` (`owner_talent_id` → `talents`), `ownerTraining`
  (`owner_training_id` → `trainings`), `ownerCharacteristic`
  (`owner_characteristic_id` → `characteristics`), `ownerBiography`
  (`owner_biography_id` → `biographies`), `ownerRace` (`owner_race_id` → `races`),
  todas `@ManyToOne({ nullable: true, onDelete: 'CASCADE' })`.
- `@Check('CK_knowledges_owner_exclusive', 'num_nonnulls(owner_talent_id,
  owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1')`.
- **Sem `@Unique` de entidade** (diferença deliberada em relação a `Proficiency`, que
  tem `@Unique([...owners, 'property'])`): a unicidade de `title` por dono exige
  comparação normalizada (`lower(trim(title))`), que não é representável pelo decorator
  `@Unique` baseado em nome de coluna simples. A garantia de unicidade fica a cargo de
  (a) validação no service (ver abaixo) e (b) índices únicos funcionais parciais
  criados via migration (ver "Migration" abaixo) — a entidade não declara metadata de
  índice para eles (o projeto já roda com `synchronize: false`, então isso é seguro e
  seguro é o mesmo espírito de índices/constraints "somente-migration" já usados no
  restante do projeto).
- Novo enum `KnowledgeOwnerType`
  (`app-api/src/modules/knowledges/enums/knowledge-owner-type.enum.ts`), idêntico em
  valores a `ProficiencyOwnerType`: `TALENT`, `TRAINING`, `CHARACTERISTIC`,
  `BIOGRAPHY`, `RACE`.

**Robustez da regra "case-insensitive + trim" (decisão explícita, conforme pedido)**:
dupla camada, não apenas uma:
1. **Service** (`KnowledgesService`, ver "Controller" abaixo): normaliza cada `title`
   recebido via `title.trim().toLowerCase()` para (a) detectar duplicata dentro da
   própria lista submetida (`validateList`) e (b) resolver/agrupar itens por título
   normalizado antes de persistir (`validateAndResolveItems`). Esta é a camada que
   produz mensagens de erro amigáveis em pt-BR.
2. **Migration**: 5 índices únicos parciais (um por dono), cada um sobre
   `(owner_X_id, lower(btrim(title)))` com `WHERE owner_X_id IS NOT NULL` — ver detalhe
   em "Migration". Isso evita a armadilha de índice único composto com múltiplas
   colunas de dono sempre nulas (como ocorre com o índice único de `Proficiency`, que
   ao incluir as 5 colunas de dono na mesma expressão nunca detecta colisão de fato,
   já que 4 das 5 colunas são sempre `NULL` e `NULL` nunca é considerado igual a `NULL`
   pelo Postgres em constraints `UNIQUE`); ao fazer um índice **parcial por dono**
   (`WHERE owner_X_id IS NOT NULL`), todas as linhas indexadas por aquele índice têm a
   coluna de dono sempre preenchida, então a comparação de igualdade funciona
   corretamente e a constraint é de fato efetiva no banco.

**Integração nas 5 entidades donas** (Talent, Training, Characteristic, Biography,
Race) — mesmo padrão já usado para `proficiencies`, reaproveitando o campo único
`knowledges` (sem separação em categorias):
- Em cada `Create<Entidade>Dto`/`Update<Entidade>Dto`: novo campo opcional
  `knowledges?: KnowledgeItemInputDto[]`
  (`@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => KnowledgeItemInputDto)`).
- Em cada `<Entidade>ResponseDto`: novo campo `knowledges: KnowledgeItemResponseDto[]`,
  preenchido a partir de `KnowledgesService.loadItemsFor(...)`, no mesmo ponto em que
  `proficiencies` já é preenchido hoje.
- Em cada `<Entidade>Service`: injetar `KnowledgesService`
  (`app-api/src/modules/knowledges/knowledges.service.ts`, novo) exatamente como
  `ProficienciesService` já é injetado hoje (ver `talents.service.ts` como referência
  literal de onde encaixar as chamadas equivalentes a
  `validateAndResolveItems`/`validateList`/`replaceItems`/`loadItemsFor`, tanto em
  `create` quanto em `update`, inclusive no caminho de `update` que recarrega a lista
  atual — convertendo `KnowledgeItemResponseDto` de volta para `KnowledgeItemInputDto`
  — quando `dto.knowledges` não é enviado).
- Em cada `<Entidade>Module`: importar `KnowledgesModule`
  (`app-api/src/modules/knowledges/knowledges.module.ts`, novo) ao lado do já existente
  `ProficienciesModule`.

#### Migration

Necessária: sim — duas migrations novas, com timestamps sugeridos após a última
existente (`1784306360000-AddProficienciesSnapshotsToSheets.ts`):

1. **`1784306370000-CreateKnowledgesTable.ts`** — cria a tabela `knowledges` (`id` uuid
   PK default `gen_random_uuid()`, `created_at`, `updated_at`, `sort_order` integer not
   null, `title` character varying not null, `gradation_id` uuid not null,
   `owner_talent_id`/`owner_training_id`/`owner_characteristic_id`/
   `owner_biography_id`/`owner_race_id` uuid nullable), com:
   - `CONSTRAINT "CK_knowledges_owner_exclusive" CHECK (num_nonnulls(owner_talent_id,
     owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1)`;
   - **5 índices únicos parciais funcionais** (um por dono, cada um servindo também de
     índice de lookup por dono — por isso não são criados índices simples adicionais):
     ```sql
     CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_talent_title" ON "knowledges" ("owner_talent_id", (lower(btrim("title")))) WHERE "owner_talent_id" IS NOT NULL;
     CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_training_title" ON "knowledges" ("owner_training_id", (lower(btrim("title")))) WHERE "owner_training_id" IS NOT NULL;
     CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_characteristic_title" ON "knowledges" ("owner_characteristic_id", (lower(btrim("title")))) WHERE "owner_characteristic_id" IS NOT NULL;
     CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_biography_title" ON "knowledges" ("owner_biography_id", (lower(btrim("title")))) WHERE "owner_biography_id" IS NOT NULL;
     CREATE UNIQUE INDEX "IDX_knowledges_unique_owner_race_title" ON "knowledges" ("owner_race_id", (lower(btrim("title")))) WHERE "owner_race_id" IS NOT NULL;
     ```
   - FKs: `gradation_id` → `proficiency_gradations(id)` `ON DELETE NO ACTION` (reusa a
     tabela existente — **não criar `knowledge_gradations` nem tabela equivalente**), e
     os 5 owners → `talents(id)`/`trainings(id)`/`characteristics(id)`/
     `biographies(id)`/`races(id)`, todos `ON DELETE CASCADE` (mesmo padrão de
     `1784306350000-CreateProficienciesTable.ts`).
   - `down()` reverte na ordem inversa: drop das 5 FKs de dono, drop da FK de
     `gradation_id`, drop dos 5 índices únicos parciais, `DROP TABLE "knowledges"`.
2. **`1784306380000-AddKnowledgeSnapshotToSheets.ts`** — adiciona a coluna jsonb
   `saberes` à tabela `sheets`, mesmo padrão de
   `1784306360000-AddProficienciesSnapshotsToSheets.ts`, porém **sem** coluna de
   "ajustados" (não existe para Saber):
   ```sql
   ALTER TABLE "sheets" ADD COLUMN "saberes" jsonb NOT NULL
     DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}';
   ```
   `down()` remove a coluna.

Ordem relativa: `CreateKnowledgesTable` deve vir antes de `AddKnowledgeSnapshotToSheets`
apenas por convenção cronológica (não há dependência de FK entre elas, já que o
snapshot da ficha é jsonb desnormalizado); ambas devem vir depois de todas as
migrations de Proficiência já existentes, pois `gradation_id` referencia
`proficiency_gradations`, que precisa já existir (já existe desde
`1784306330000-CreateProficiencyGradationsTable.ts`).

#### Controller

**Novo módulo `knowledges` (sem controller próprio)**, espelhando
`app-api/src/modules/proficiencies/` (que também não expõe rota HTTP própria — é usado
internamente pelos módulos das 5 entidades donas e pelo módulo de fichas):

- `KnowledgeItemInputDto` (`dto/knowledge-item-input.dto.ts`): `title` (`string`,
  `@IsString() @IsNotEmpty()`), `gradation` (`uuid`, `@IsUUID('4')`).
- `KnowledgeItemResponseDto` (`dto/knowledge-item-response.dto.ts`): `id`, `title`,
  `gradation: ProficiencyGradationResponseDto` (reaproveitando o DTO já existente de
  `app-api/src/modules/proficiency-gradations/dto/proficiency-gradation-response.dto.ts`),
  com `static fromResolved(item: Knowledge)`.
- `KnowledgesService` (`knowledges.service.ts`), espelhando `ProficienciesService` com
  a adaptação de chave normalizada de título no lugar de id de propriedade:
  - `ownerColumnFor(ownerType: KnowledgeOwnerType)` — idêntico em estrutura ao de
    `ProficienciesService`.
  - `validateAndResolveItems(items: KnowledgeItemInputDto[]): Promise<Map<string, { title: string; gradation: ProficiencyGradation }>>`
    — chave do Map é o título normalizado (`item.title.trim().toLowerCase()`); busca
    `ProficiencyGradation` por id (`In(gradationIds)`), lança `NotFoundException`
    ("Uma ou mais graduações de saber não foram encontradas.") se algum id não
    existir; o valor armazenado no Map usa o título **trimado mas com capitalização
    original** (`item.title.trim()`), para persistir exatamente como o usuário digitou
    (só sem espaços nas pontas).
  - `validateList(items: KnowledgeItemInputDto[]): void` — normaliza cada título
    (`trim().toLowerCase()`) e lança `ConflictException` ("Um mesmo saber não pode ser
    adicionado duas vezes com o mesmo título.") se houver duas entradas com o mesmo
    título normalizado na mesma lista.
  - `replaceItems(ownerType, ownerId, items, resolvedItems?)` — apaga todos os
    registros do dono e reinsere com `sortOrder` = índice na lista e `title` =
    versão trimada (não normalizada) do resolved item, igual ao equivalente em
    `ProficienciesService`.
  - `loadItemsFor(ownerType, ownerId): Promise<KnowledgeItemResponseDto[]>` — busca
    ordenado por `sortOrder ASC`, mapeia via `KnowledgeItemResponseDto.fromResolved`.
- `KnowledgesModule`: `TypeOrmModule.forFeature([Knowledge, ProficiencyGradation])`
  (reaproveita `ProficiencyGradation`, não cria repositório de uma tabela de graduação
  nova), `providers: [KnowledgesService]`, `exports: [KnowledgesService]`. Não precisa
  ser registrado em `AppModule` (mesmo padrão de `ProficienciesModule`, importado
  apenas pelos módulos das 5 entidades donas).

**Integração nas 5 entidades donas (sem novas rotas)**: `POST`/`PUT`/`GET` de
`talents`, `trainings`, `characteristics`, `biographies` e `races` continuam com a
mesma assinatura de rota; o campo `knowledges` passa a ser aceito no body de
criação/atualização e devolvido no response. `@ApiConflictResponse`/
`@ApiNotFoundResponse`/`@ApiBadRequestResponse` de cada controller devem ter a
descrição atualizada para mencionar também `knowledges` (título duplicado no mesmo
dono → conflito; graduação inexistente → not found; formato de uuid inválido para
`gradation` → bad request) — detalhado na etapa `api-dev-doc`, mas o texto deve ficar
coerente com o que foi implementado.
- **Acesso Google**: sem alteração — os 5 controllers já são `@GoogleAccess('read-only')`
  hoje; a adição do campo `knowledges` não muda esse nível (mesma justificativa já
  usada para `proficiencies`).

**`SheetsController`/`SheetsService` (ficha)**:

Novo método privado `recomputeKnowledges(sheet, orderedSources)` em `SheetsService`,
adicionado **ao lado** de (sem alterar) `recomputeProficiencies`, com a mesma
assinatura de fontes ordenadas (`ProficiencySource`-like: origem que não é alvo da
operação atual primeiro, origem alvo por último — mesma justificativa de
dependência-de-ordem-de-vínculo já usada para Proficiências) — pode reaproveitar o
mesmo tipo `ProficiencySource`/uma interface irmã, à critério do `api-dev`, desde que
a ordem de processamento seja idêntica à de `recomputeProficiencies`:

1. Para cada origem vinculada (na ordem definida), buscar seus registros brutos em
   `knowledges` (`knowledgesRepository.find({ where: { ownerRace: { id } } / { ownerBiography: { id } }, relations: { gradation: true }, order: { sortOrder: 'ASC' } })`).
2. Manter um mapa `activeByNormalizedTitle` (título normalizado `trim().toLowerCase()`
   → `{ gradationLevel, sourceType, entry }`). Para cada item bruto
   `(title, gradation, sourceName, sourceType)` na ordem definida:
   - Se o título normalizado **não** está no mapa, **ou** está mas
     `gradation.level > existente.gradationLevel`: a entrada (nova ou substituta)
     assume o lugar de ativa para aquele título (se estava associada a outra origem,
     mover da lista antiga para a nova).
   - Senão (`gradation.level <= existente.gradationLevel`): o item é **descartado
     integralmente, sem qualquer registro de compensação** — diferença central em
     relação a `recomputeProficiencies` (que gera uma entrada em
     `proficienciasAjustadas` neste caso). Para Saber, **não existe** lista de
     ajustes — o item simplesmente não aparece em lugar nenhum do snapshot.
3. Ao final, `sheet.saberes` = agrupamento por origem das entradas que permaneceram
   ativas (mantendo `trainings`/`talents`/`characteristics` sempre `[]`). Atribuir
   sempre um **novo objeto/array** a `sheet.saberes` (nunca mutar em lugar), para
   garantir que o TypeORM detecte a mudança na coluna jsonb.
4. Chamar este método a partir de `linkRace`, `unlinkRace`, `linkBiography` e
   `unlinkBiography`, **ao lado** da chamada já existente a `recomputeProficiencies`
   (mesmo ponto do fluxo, logo antes do `this.sheetsRepository.save(sheet)`), com o
   mesmo conjunto de origens já calculado para `recomputeProficiencies` em cada
   método (não recalcular a lista de origens duas vezes de formas diferentes). **Não
   alterar em nada** a lógica pré-existente de `melhorias`/`defeitos`/`proficiencias`/
   `proficienciasAjustadas` desses 4 métodos — apenas acrescentar a nova chamada.

`SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`):
acrescentar `saberes: SheetKnowledgeSnapshotResponseDto` (novo DTO, espelhando
`SheetProficiencySnapshotResponseDto`, com `race`/`biography`/`trainings`/`talents`/
`characteristics: SheetKnowledgeSnapshotEntryResponseDto[]`, `static fromEntity`),
mais o novo DTO de entrada `SheetKnowledgeSnapshotEntryResponseDto`
(`{ id, title, gradation: ProficiencyGradationResponseDto, sourceName }`, `static
fromRaw`). **Não criar** nenhum DTO equivalente a
`SheetProficiencyAdjustmentResponseDto` para Saber.

Novas interfaces em `app-api/src/modules/sheets/interfaces/`:
`sheet-knowledge-snapshot.interface.ts`:
```ts
export interface SheetKnowledgeSnapshotEntry {
  id: string;
  title: string;
  gradation: { id: string; name: string; level: number };
  sourceName: string;
}
export interface SheetKnowledgeSnapshot {
  race: SheetKnowledgeSnapshotEntry[];
  biography: SheetKnowledgeSnapshotEntry[];
  trainings: SheetKnowledgeSnapshotEntry[];
  talents: SheetKnowledgeSnapshotEntry[];
  characteristics: SheetKnowledgeSnapshotEntry[];
}
```

`Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`): nova coluna
```ts
@Column({
  type: 'jsonb',
  default: {
    race: [],
    biography: [],
    trainings: [],
    talents: [],
    characteristics: [],
  },
})
saberes!: SheetKnowledgeSnapshot;
```
ao lado de `proficiencias`/`proficienciasAjustadas` — **sem** coluna irmã de
"ajustados".

`SheetsModule`: acrescentar `Knowledge` ao `TypeOrmModule.forFeature([...])` (mesmo
padrão de injeção direta de repositório já usado para `Proficiency`/
`ProficiencyProperty`/`ProficiencyGradation` — `ProficiencyGradation` já está
registrado e é reaproveitado, não precisa ser adicionado de novo). Não é necessário
importar `KnowledgesModule` inteiro.

`SheetsController`: **nenhum endpoint novo**. Apenas os `@ApiOperation.summary` de
`PUT /sheets/:id/race`, `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography` e
`DELETE /sheets/:id/biography` devem ser atualizados para também mencionar a
sincronização de saberes (detalhado na etapa `api-dev-doc`).

Status: concluído
Entidade: app-api/src/modules/knowledges/entities/knowledge.entity.ts
Migration: app-api/src/database/migrations/1784306370000-CreateKnowledgesTable.ts, app-api/src/database/migrations/1784306380000-AddKnowledgeSnapshotToSheets.ts
Rotas: nenhuma rota nova (campo `knowledges` embutido em POST/GET/PUT/DELETE /talents, /trainings, /characteristics, /biographies, /races; campo `saberes` recomputado em PUT/DELETE /sheets/:id/race e PUT/DELETE /sheets/:id/biography — assinaturas inalteradas)
Arquivos:
- app-api/src/modules/knowledges/enums/knowledge-owner-type.enum.ts
- app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts
- app-api/src/modules/knowledges/dto/knowledge-item-response.dto.ts
- app-api/src/modules/knowledges/knowledges.service.ts
- app-api/src/modules/knowledges/knowledges.module.ts
- app-api/src/modules/talents/dto/create-talent.dto.ts, dto/talent-response.dto.ts, talents.service.ts, talents.module.ts, talents.controller.ts
- app-api/src/modules/trainings/dto/create-training.dto.ts, dto/training-response.dto.ts, trainings.service.ts, trainings.module.ts, trainings.controller.ts
- app-api/src/modules/characteristics/dto/create-characteristic.dto.ts, dto/characteristic-response.dto.ts, characteristics.service.ts, characteristics.module.ts, characteristics.controller.ts
- app-api/src/modules/biographies/dto/create-biography.dto.ts, dto/biography-response.dto.ts, biographies.service.ts, biographies.module.ts, biographies.controller.ts
- app-api/src/modules/races/dto/create-race.dto.ts, dto/race-response.dto.ts, races.service.ts, races.module.ts, races.controller.ts
- app-api/src/modules/sheets/entities/sheet.entity.ts
- app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts
- app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts
- app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts
- app-api/src/modules/sheets/dto/sheet-response.dto.ts
- app-api/src/modules/sheets/sheets.module.ts
- app-api/src/modules/sheets/sheets.service.ts (repositório de Knowledge injetado, novo método privado `recomputeKnowledges`, chamado em `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` ao lado de `recomputeProficiencies`, sem alterar a lógica pré-existente de melhorias/defeitos/proficiências/proficienciasAjustadas)
Pendência: nenhuma migration foi executada (`npm run migration:run`) — deve ser rodada manualmente após revisão, conforme a skill de migration deste projeto.

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir: novos `@ApiProperty`/`@ApiPropertyOptional` do campo `knowledges` em
  `Create<Entidade>Dto`/`Update<Entidade>Dto`/`<Entidade>ResponseDto` das 5 entidades
  donas; atualização de `@ApiConflictResponse`/`@ApiNotFoundResponse`/
  `@ApiBadRequestResponse` dos 5 controllers mencionando as regras de `knowledges`
  (título duplicado → conflito; graduação inexistente → not found; uuid inválido →
  bad request); Swagger completo de `KnowledgeItemInputDto`/`KnowledgeItemResponseDto`
  com `example`; novos DTOs de ficha (`SheetKnowledgeSnapshotResponseDto`,
  `SheetKnowledgeSnapshotEntryResponseDto`) com `@ApiProperty` completos; atualização
  dos `@ApiOperation.summary` de `PUT/DELETE /sheets/:id/race` e
  `PUT/DELETE /sheets/:id/biography` mencionando a sincronização de saberes.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a: (a) os 5 índices únicos parciais da
  migration batendo exatamente com a expectativa de unicidade case-insensitive+trim
  por dono; (b) `recomputeKnowledges` implementando fielmente "maior graduação
  prevalece, menor é descartada sem compensação, sem lista de ajustes"; (c) nenhuma
  alteração indevida na lógica pré-existente de `melhorias`/`defeitos`/
  `proficiencias`/`proficienciasAjustadas` nos 4 métodos de link/unlink; (d) nomes de
  campo exatamente como definidos na seção "Contrato de API" (`knowledges` nas 5
  entidades donas, `saberes` no `SheetResponseDto`, sem nenhum campo de "ajustados"
  para Saber).

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas, todas conformes:

- **Migration ↔ entidade** (`1784306370000-CreateKnowledgesTable.ts` vs
  `knowledge.entity.ts`): colunas, tipos, nullability, `CK_knowledges_owner_exclusive`,
  os 5 índices únicos parciais funcionais (`(owner_X_id, lower(btrim("title"))) WHERE
  owner_X_id IS NOT NULL`) e as FKs (owners `ON DELETE CASCADE`, `gradation_id → 
  proficiency_gradations ON DELETE NO ACTION`) batem exatamente. Nenhuma tabela nova de
  graduação foi criada — `KnowledgesModule` reaproveita `ProficiencyGradation`/
  `proficiency_gradations` via `TypeOrmModule.forFeature`. `down()` reverte na ordem
  inversa correta (FKs de dono → FK de gradation → índices → drop table). Timestamps
  (`...370000`/`...380000`) vêm depois de `1784306360000-AddProficienciesSnapshotsToSheets.ts`,
  conforme exigido pela dependência de `proficiency_gradations` já existir.
- **`1784306380000-AddKnowledgeSnapshotToSheets.ts` vs `sheet.entity.ts`**: coluna
  jsonb `saberes` com o mesmo default estruturado (`{race,biography,trainings,talents,
  characteristics: []}`), sem coluna irmã de "ajustados", `down()` remove a coluna
  corretamente.
- **Contrato de API**: campo `knowledges` presente e com o formato exato
  (`{ id, title, gradation: { id, name, level } }`) nos DTOs de entrada/saída das 5
  entidades donas (`talents`, `trainings`, `characteristics`, `biographies`, `races`),
  sem nenhuma rota nova. Campo `saberes` no `SheetResponseDto` com o formato exato de
  entrada do snapshot (`{ id, title, gradation: {id,name,level}, sourceName }`),
  agrupado pelas 5 chaves (`race`/`biography`/`trainings`/`talents`/`characteristics`),
  as três últimas sempre `[]`. Nenhum campo/DTO/interface de "ajustados" foi criado
  para Saber (confirmado via busca por `saberesAjustad`/`KnowledgeAdjustment`, sem
  ocorrências).
- **`recomputeKnowledges`** (`sheets.service.ts`): reaproveita a mesma interface
  `ProficiencySource` e a mesma ordem de fontes já calculada para
  `recomputeProficiencies` em `linkRace`/`unlinkRace`/`linkBiography`/
  `unlinkBiography`. Chave de unicidade é o título normalizado
  (`item.title.trim().toLowerCase()`), maior `gradation.level` vence, e o item
  descartado simplesmente não é adicionado a nenhuma estrutura (sem lista de
  ajustes, sem persistência de compensação). Ao final, atribui um novo objeto a
  `sheet.saberes` (nunca muta em lugar), garantindo detecção de mudança pelo TypeORM
  na coluna jsonb. Chamada adicionada lado a lado com `recomputeProficiencies`, logo
  antes do `save`, nos 4 métodos, sem alterar a lógica pré-existente de
  `melhorias`/`defeitos`/`proficiencias`/`proficienciasAjustadas` (diff conceitual:
  apenas as duas linhas `await this.recomputeKnowledges(sheet, proficiencySources);`
  foram acrescentadas).
- **Normalização de título consistente**: tanto `KnowledgesService.validateAndResolveItems`/
  `validateList` (usados em `create`/`update` das 5 entidades donas) quanto
  `recomputeKnowledges` usam a mesma regra `title.trim().toLowerCase()` para a chave de
  unicidade/merge, e `title.trim()` (preservando capitalização) para o valor persistido/
  exibido.
- **DTOs e validação**: `KnowledgeItemInputDto` (`title: IsString+IsNotEmpty`,
  `gradation: IsUUID('4')`) e `KnowledgeItemResponseDto` (`fromResolved`) corretos;
  `Create/Update<Entidade>Dto` com `knowledges?: KnowledgeItemInputDto[]` opcional e
  decorators `@IsOptional/@IsArray/@ValidateNested/@Type` corretos; `<Entidade>ResponseDto`
  usa `fromEntity`/referências resolvidas, sem vazar campos internos.
- **Segurança/Acesso Google**: os 5 controllers mantêm
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  inalterados; nenhuma rota nova foi exposta para Saber (sem controller próprio,
  mesmo padrão de `proficiencies`).
- **Swagger (api-dev-doc)**: `@ApiProperty`/`@ApiPropertyOptional` de `knowledges` nos
  5 pares de DTOs, Swagger completo de `KnowledgeItemInputDto`/`KnowledgeItemResponseDto`
  com `example`, `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse`
  dos 5 controllers atualizados mencionando as regras de `knowledges` (título duplicado
  → conflito; graduação inexistente → not found; uuid inválido → bad request); DTOs de
  ficha (`SheetKnowledgeSnapshotResponseDto`/`SheetKnowledgeSnapshotEntryResponseDto`)
  com `@ApiProperty` completos; `@ApiOperation.summary` de
  `PUT/DELETE /sheets/:id/race` e `PUT/DELETE /sheets/:id/biography` mencionam a
  sincronização de saberes.

Arquivos revisados: `app-api/src/modules/knowledges/entities/knowledge.entity.ts`,
`app-api/src/modules/knowledges/enums/knowledge-owner-type.enum.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-response.dto.ts`,
`app-api/src/modules/knowledges/knowledges.service.ts`,
`app-api/src/modules/knowledges/knowledges.module.ts`,
`app-api/src/database/migrations/1784306370000-CreateKnowledgesTable.ts`,
`app-api/src/database/migrations/1784306380000-AddKnowledgeSnapshotToSheets.ts`,
`app-api/src/modules/talents/{dto/create-talent.dto.ts,dto/talent-response.dto.ts,talents.service.ts,talents.module.ts,talents.controller.ts}`,
`app-api/src/modules/trainings/{dto/create-training.dto.ts,dto/training-response.dto.ts,trainings.service.ts,trainings.module.ts,trainings.controller.ts}`,
`app-api/src/modules/characteristics/{dto/create-characteristic.dto.ts,dto/characteristic-response.dto.ts,characteristics.service.ts,characteristics.module.ts,characteristics.controller.ts}`,
`app-api/src/modules/biographies/{dto/create-biography.dto.ts,dto/biography-response.dto.ts,biographies.service.ts,biographies.module.ts,biographies.controller.ts}`,
`app-api/src/modules/races/{dto/create-race.dto.ts,dto/race-response.dto.ts,races.service.ts,races.module.ts,races.controller.ts}`,
`app-api/src/modules/sheets/entities/sheet.entity.ts`,
`app-api/src/modules/sheets/interfaces/sheet-knowledge-snapshot.interface.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-response.dto.ts`,
`app-api/src/modules/sheets/sheets.module.ts`,
`app-api/src/modules/sheets/sheets.service.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`.