# Task API: Proficiência como feature independente (reversão + nova feature + aba na ficha)

## Contexto
Ver .claude/tasks/proficiencias/spec.md

Esta tarefa cobre as três partes do escopo confirmado no spec:

- **Parte A** — reversão da seed do tipo "Proficiência" dentro de Melhoria/Defeito.
- **Parte B** — nova feature "Proficiências" independente (tabelas auxiliares próprias +
  associação polimórfica nas 5 entidades donas).
- **Parte C** — nova aba "Proficiências" na ficha, com sincronização, regra de conflito e
  seção "Proficiências Ajustadas".

Como a implementação de entidade, migration e controller é feita por um único agente
(`api-dev`), todo o trabalho abaixo está descrito dentro da etapa "1. api-dev", organizado
por Parte e por subseção.

## Etapas

### 1. api-dev

#### Entidade

**Parte A — reversão.** Nenhuma entidade é criada ou alterada nesta parte. `ImprovementFlawType`,
`ImprovementFlawProperty` e `ImprovementFlaw` permanecem exatamente como estão — a reversão é
puramente um `DELETE` de dados de seed via migration (ver "Migration" abaixo). A migration
original `app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts`
não deve ser editada nem removida.

**Parte B — novas entidades/tabelas auxiliares.**

- `ProficiencyProperty` (nova entidade, tabela `proficiency_properties`), espelhando
  exatamente `ImprovementFlawType`
  (`app-api/src/modules/improvement-flaw-types/entities/improvement-flaw-type.entity.ts`):
  extends `BaseEntity`; campo `name` (`string`, `@Column()`, `@Index({ unique: true })`,
  `@ApiProperty()`). Sem relação com tipos (diferente de `ImprovementFlawProperty`, que tem
  `ManyToMany` com `ImprovementFlawType` — aqui não existe conceito de "tipo" de
  proficiência, então não replicar essa relação).
- `ProficiencyGradation` (nova entidade, tabela `proficiency_gradations`): extends
  `BaseEntity`; campo `name` (`string`, único); campo `level` (`int`, `@Column({ type: 'int' })`,
  também único — usado exclusivamente para comparar magnitude entre graduações, não para
  ordenação de exibição de cards). Nomear o campo `level` (e não `sortOrder`, para não
  confundir com o campo de ordem de inserção usado em `Proficiency`, descrito abaixo).
- `Proficiency` (nova entidade, tabela `proficiencies`) — associação polimórfica entre uma
  entidade dona e um par propriedade+graduação, espelhando estruturalmente `ImprovementFlaw`
  (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`), mas sem os
  campos `category` e `value` (não existem em Proficiência — a "força" da proficiência é
  dada inteiramente pela graduação):
  - `sortOrder` (`int`, `name: 'sort_order'`) — ordem de inserção dentro da lista da entidade
    dona, usada apenas para exibição consistente dos cards (mesmo papel do `sortOrder` de
    `ImprovementFlaw`).
  - `property` — `@ManyToOne(() => ProficiencyProperty, { nullable: false })`,
    `@JoinColumn({ name: 'property_id' })`.
  - `gradation` — `@ManyToOne(() => ProficiencyGradation, { nullable: false })`,
    `@JoinColumn({ name: 'gradation_id' })`.
  - Colunas de dono mutuamente exclusivas, uma por entidade dona possível, todas
    `@ManyToOne({ nullable: true, onDelete: 'CASCADE' })` com `@JoinColumn`: `ownerTalent`
    (`owner_talent_id` → `talents`), `ownerTraining` (`owner_training_id` → `trainings`),
    `ownerCharacteristic` (`owner_characteristic_id` → `characteristics`), `ownerBiography`
    (`owner_biography_id` → `biographies`), `ownerRace` (`owner_race_id` → `races`).
  - `@Check('CK_proficiencies_owner_exclusive', 'num_nonnulls(owner_talent_id,
    owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1')`.
  - `@Unique(['ownerTalent', 'ownerTraining', 'ownerCharacteristic', 'ownerBiography',
    'ownerRace', 'property'])` — garante que "propriedade é única por entidade" (uma
    entidade dona não pode ter duas graduações para a mesma propriedade).
  - Novo enum `ProficiencyOwnerType` (`app-api/src/modules/proficiencies/enums/proficiency-owner-type.enum.ts`),
    idêntico em valores a `ImprovementFlawOwnerType`
    (`app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`):
    `TALENT`, `TRAINING`, `CHARACTERISTIC`, `BIOGRAPHY`, `RACE`.

**Parte B — integração nas 5 entidades donas.** Para `Talent`, `Training`, `Characteristic`,
`Biography` e `Race`, replicar exatamente o padrão hoje usado para `improvements`/`flaws`
(referência completa em `TalentsService`/`TalentsController`/`CreateTalentDto`/
`TalentResponseDto`/`TalentsModule`, em `app-api/src/modules/talents/`, que deve servir de
modelo literal para as outras 4 — `TrainingsService`, `CharacteristicsService`,
`BiographiesService` e `RacesService` já seguem o mesmo padrão de injeção de
`ImprovementFlawsService`, confirmado por grep em todos os 5 `*.service.ts`), mas para uma
única lista `proficiencies` (não há separação em duas categorias como
`improvements`/`flaws`, pois Proficiência não tem o conceito de melhoria/defeito):
- Em cada `Create<Entidade>Dto`/`Update<Entidade>Dto`: novo campo opcional
  `proficiencies?: ProficiencyItemInputDto[]` (`@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProficiencyItemInputDto)`).
- Em cada `<Entidade>ResponseDto`: novo campo `proficiencies: ProficiencyItemResponseDto[]`,
  preenchido a partir do retorno de `ProficienciesService.loadItemsFor(...)`.
- Em cada `<Entidade>Service`: injetar `ProficienciesService`
  (`app-api/src/modules/proficiencies/proficiencies.service.ts`, nova) exatamente como
  `ImprovementFlawsService` já é injetado; em `create`/`update`/`findById` (e equivalentes),
  chamar `validateAndResolveItems`, `validateList` e `replaceItems`/`loadItemsFor` para
  `proficiencies`, no mesmo ponto do fluxo em que `improvements`/`flaws` são tratados
  atualmente (ver método `create`/`update`/`findById` de `TalentsService` como referência
  literal de onde encaixar as chamadas equivalentes).
- Em cada `<Entidade>Module`: importar `ProficienciesModule`
  (`app-api/src/modules/proficiencies/proficiencies.module.ts`, nova) ao lado do já existente
  `ImprovementFlawsModule`.

**Parte C — Sheet (ficha).**

- `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`) ganha duas novas colunas
  jsonb, análogas a `melhorias`/`defeitos` mas com estrutura própria:
  - `proficiencias: SheetProficiencySnapshot` — agrupado por origem, mesmo formato de chaves
    de `SheetImprovementFlawSnapshot` (`race`, `biography`, `trainings`, `talents`,
    `characteristics`), default `{ race: [], biography: [], trainings: [], talents: [],
    characteristics: [] }`. Cada entrada é o item **efetivo/vencedor** (após resolução de
    conflito) daquela origem — ver algoritmo em "Controller" abaixo. `trainings`, `talents`
    e `characteristics` ficam sempre vazios por ora (essas 3 entidades ainda não são
    vinculáveis à ficha), mesma justificativa já usada em
    `SheetImprovementFlawSnapshotResponseDto`.
  - `proficienciasAjustadas: SheetProficiencyAdjustment[]` — lista plana (não agrupada por
    origem, pois a UI exibe uma única seção "Proficiências Ajustadas"), default `[]`.
- Nova interface `SheetProficiencySnapshot`
  (`app-api/src/modules/sheets/interfaces/sheet-proficiency-snapshot.interface.ts`),
  espelhando `SheetImprovementFlawSnapshot`:
  ```ts
  export interface SheetProficiencySnapshotEntry {
    id: string; // id do registro real em `proficiencies`
    property: { id: string; name: string };
    gradation: { id: string; name: string; level: number };
    sourceName: string; // nome da raça/biografia que trouxe a proficiência
  }
  export interface SheetProficiencySnapshot {
    race: SheetProficiencySnapshotEntry[];
    biography: SheetProficiencySnapshotEntry[];
    trainings: SheetProficiencySnapshotEntry[];
    talents: SheetProficiencySnapshotEntry[];
    characteristics: SheetProficiencySnapshotEntry[];
  }
  ```
- Nova interface `SheetProficiencyAdjustment`, no mesmo arquivo ou em
  `sheet-proficiency-adjustment.interface.ts`:
  ```ts
  export type SheetProficiencyAdjustmentSourceType =
    'race' | 'biography' | 'training' | 'talent' | 'characteristic';

  export interface SheetProficiencyAdjustment {
    id: string; // gerado em memória (uuid) a cada recálculo — não é FK de nenhuma tabela
    sourceType: SheetProficiencyAdjustmentSourceType;
    sourceName: string;
    originalProperty: { id: string; name: string };
    originalGradation: { id: string; name: string; level: number };
    adjustedPropertyId: string | null;
    adjustedProperty: { id: string; name: string } | null;
  }
  ```
  Importante: `originalGradation` é congelada e nunca editável pelo usuário (regra do
  spec); só `adjustedPropertyId`/`adjustedProperty` mudam, via o novo endpoint descrito em
  "Controller".

#### Migration

Necessária: sim — sete migrations novas, todas após
`1784306290000-SeedImprovementFlawProficiencyType.ts` (timestamp mais recente hoje no
diretório), com timestamps sugeridos incrementais de 10000 em 10000:

1. **`1784306300000-RevertImprovementFlawProficiencyType.ts`** (Parte A). `up()` executa,
   nesta ordem exata (join table → propriedades → tipo, conforme decidido no spec):
   ```sql
   DELETE FROM "improvement_flaw_property_types"
     WHERE "type_id" = (SELECT "id" FROM "improvement_flaw_types" WHERE "name" = 'Proficiência');
   DELETE FROM "improvement_flaw_properties" WHERE "name" IN (/* as 20 propriedades */);
   DELETE FROM "improvement_flaw_types" WHERE "name" = 'Proficiência';
   ```
   As 20 propriedades e a lista de nomes devem ser copiadas exatamente de
   `PROFICIENCY_PROPERTY_NAMES` em
   `app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts` para
   garantir que a lista bate 100% com o que foi inserido. `down()` desta nova migration
   **reinsere** os mesmos dados na mesma ordem do `up()` da migration original (tipo →
   propriedades → junção) — ou seja, o `down()` aqui é funcionalmente idêntico ao `up()` de
   `1784306290000`. Não editar a migration `1784306290000` em nenhum momento.
2. **`1784306310000-CreateProficiencyPropertiesTable.ts`** — cria a tabela
   `proficiency_properties` (`id` uuid PK default `gen_random_uuid()`, `created_at`,
   `updated_at`, `name` character varying not null), índice único
   `IDX_proficiency_properties_name` em `name`. Mesmo padrão de
   `1784306180000-CreateImprovementFlawTypesTable.ts`.
3. **`1784306320000-SeedProficiencyPropertiesTable.ts`** — insere as 20 propriedades fixas:
   Acrobatismo, Arcanismo, Atletismo, Diplomacia, Dissimulação, Furtividade, Intimidação,
   Ladroagem, Manufatura, Medicina, Natureza, Ocultismo, Performance, Percepção, Religião,
   Sobrevivência, Sociedade, Fortitude, Reflexo, Vontade (mesma lista de nomes da Parte A,
   agora na tabela nova e independente). `down()` remove por nome.
4. **`1784306330000-CreateProficiencyGradationsTable.ts`** — cria a tabela
   `proficiency_gradations` (`id`, `created_at`, `updated_at`, `name` character varying not
   null, `level` integer not null), índice único em `name` e índice único em `level`.
5. **`1784306340000-SeedProficiencyGradationsTable.ts`** — insere as 5 graduações fixas, na
   ordem crescente de magnitude: `('Destreinado', 1), ('Básico', 2), ('Avançado', 3),
   ('Especialista', 4), ('Lendário', 5)`. `down()` remove as 5 por nome.
6. **`1784306350000-CreateProficienciesTable.ts`** — cria a tabela `proficiencies` (`id`,
   `created_at`, `updated_at`, `sort_order` integer not null, `property_id` uuid not null,
   `gradation_id` uuid not null, `owner_talent_id`/`owner_training_id`/
   `owner_characteristic_id`/`owner_biography_id`/`owner_race_id` uuid nullable), com:
   - `CONSTRAINT "CK_proficiencies_owner_exclusive" CHECK (num_nonnulls(owner_talent_id,
     owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id) = 1)`;
   - índice único `IDX_proficiencies_unique_owner_property` em `(owner_talent_id,
     owner_training_id, owner_characteristic_id, owner_biography_id, owner_race_id,
     property_id)` (garante propriedade única por entidade dona);
   - índices simples por dono: `IDX_proficiencies_owner_talent` em `owner_talent_id`, e o
     mesmo para os outros 4 owners (sem coluna extra de categoria, diferente de
     `improvement_flaws`, pois não existe `category` aqui);
   - FKs: `property_id` → `proficiency_properties(id)` `ON DELETE NO ACTION`, `gradation_id`
     → `proficiency_gradations(id)` `ON DELETE NO ACTION`, e os 5 owners →
     `talents(id)`/`trainings(id)`/`characteristics(id)`/`biographies(id)`/`races(id)`,
     todos `ON DELETE CASCADE` (mesmo padrão de `1784306220000-CreateImprovementFlawsTable.ts`
     + `1784306260000-AddRaceOwnerToImprovementFlaws.ts`, já com os 5 owners desde a criação,
     diferente do histórico de `improvement_flaws` que ganhou `owner_race_id` depois).
   Modelar como uma única migration de criação (não replicar o histórico incremental de
   `improvement_flaws`, já que aqui os 5 owners nascem juntos).
7. **`1784306360000-AddProficienciesSnapshotsToSheets.ts`** — adiciona as duas colunas jsonb
   à tabela `sheets`, mesmo padrão de
   `1784306270000-AddBiographyAndSnapshotsToSheets.ts`:
   ```sql
   ALTER TABLE "sheets" ADD COLUMN "proficiencias" jsonb NOT NULL
     DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}';
   ALTER TABLE "sheets" ADD COLUMN "proficiencias_ajustadas" jsonb NOT NULL DEFAULT '[]';
   ```
   `down()` remove as duas colunas na ordem inversa.

Atenção: todas as 7 migrations devem ser aplicadas nesta ordem relativa (a de reversão pode
ser independente das demais, mas as de criação de tabela precisam vir antes das de seed
correspondentes, e `CreateProficienciesTable` precisa vir depois de
`CreateProficiencyPropertiesTable`/`CreateProficiencyGradationsTable`, já que referencia
ambas via FK).

#### Controller

**Parte B — módulos de tabela auxiliar somente leitura (novos).**

- Módulo `proficiency-properties` (`app-api/src/modules/proficiency-properties/`), espelhando
  1:1 `app-api/src/modules/improvement-flaw-types/` (não `improvement-flaw-properties`, pois
  não há relação com "tipos" aqui): `ProficiencyPropertiesService.findAll()` retorna todas
  ordenadas por `name ASC`; `ProficiencyPropertiesController` com `GET /proficiency-properties`,
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)`, `@GoogleAccess('read-only')`,
  `@ApiTags('proficiency-properties')`; `ProficiencyPropertyResponseDto { id, name }` com
  `fromEntity`. Registrar `ProficiencyPropertiesModule` em `AppModule` (mesmo nível de
  `ImprovementFlawTypesModule`/`ImprovementFlawPropertiesModule`).
- Módulo `proficiency-gradations` (`app-api/src/modules/proficiency-gradations/`), mesmo
  padrão: `ProficiencyGradationsService.findAll()` retorna todas ordenadas por `level ASC`
  (ordem crescente de magnitude — não alfabética, para que o autocomplete já apareça na
  ordem Destreinado→Lendário); `ProficiencyGradationsController` com
  `GET /proficiency-gradations`, mesmos guards/`GoogleAccess('read-only')`;
  `ProficiencyGradationResponseDto { id, name, level }` com `fromEntity`. Registrar
  `ProficiencyGradationsModule` em `AppModule`.

**Parte B — módulo `proficiencies` (novo, sem controller próprio).** Espelha
`app-api/src/modules/improvement-flaws/` (que também não tem controller — é usado
internamente pelos módulos das 5 entidades donas e pelo módulo de fichas):
- `ProficiencyItemInputDto` (`dto/proficiency-item-input.dto.ts`): `property` (uuid,
  `@IsUUID('4')`), `gradation` (uuid, `@IsUUID('4')`). Sem campo `value` (não existe em
  Proficiência).
- `ProficiencyItemResponseDto` (`dto/proficiency-item-response.dto.ts`): `id`,
  `property: ProficiencyPropertyResponseDto`, `gradation: ProficiencyGradationResponseDto`,
  com `static fromResolved(item: Proficiency)`.
- `ProficienciesService` (`proficiencies.service.ts`), espelhando `ImprovementFlawsService`
  mas simplificado (sem `category`, sem checagem de compatibilidade tipo×propriedade, pois
  não existe "tipo" em Proficiência):
  - `ownerColumnFor(ownerType: ProficiencyOwnerType)`.
  - `validateAndResolveItems(items: ProficiencyItemInputDto[]): Promise<Map<string, { property, gradation }>>`
    — busca `ProficiencyProperty`/`ProficiencyGradation` por id, lança `NotFoundException`
    ("Uma ou mais propriedades ou graduações de proficiência não foram encontradas.") se
    algum id não existir.
  - `validateList(items: ProficiencyItemInputDto[]): void` — lança `ConflictException`
    ("Uma mesma propriedade de proficiência não pode ser adicionada duas vezes.") se houver
    `property` duplicada na mesma lista (substitui a checagem dupla de `validateLists` de
    `ImprovementFlawsService`, que aqui vira uma única lista, sem categorias cruzadas).
  - `replaceItems(ownerType, ownerId, items, resolvedItems?)` — apaga todos os registros do
    dono e reinsere com `sortOrder` = índice na lista, igual ao equivalente em
    `ImprovementFlawsService`.
  - `loadItemsFor(ownerType, ownerId): Promise<ProficiencyItemResponseDto[]>` — busca
    ordenado por `sortOrder ASC`, mapeia via `ProficiencyItemResponseDto.fromResolved`.
- `ProficienciesModule`: `TypeOrmModule.forFeature([Proficiency, ProficiencyProperty,
  ProficiencyGradation])`, `providers: [ProficienciesService]`,
  `exports: [ProficienciesService]`. Não precisa ser registrado diretamente em `AppModule`
  (é importado pelos módulos das 5 entidades donas e alcançado transitivamente, mesmo padrão
  hoje usado por `ImprovementFlawsModule`, que também não aparece na lista de imports de
  `AppModule`).

**Parte B — integração nas 5 entidades donas (sem novas rotas).** Nenhum endpoint novo:
`POST`/`PUT`/`GET` de `talents`, `trainings`, `characteristics`, `biographies` e `races`
continuam com a mesma assinatura de rota; o campo `proficiencies` passa a ser aceito no
body de criação/atualização e devolvido no response, exatamente como `improvements`/`flaws`
hoje. `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` de cada
controller devem ter a descrição atualizada para mencionar também a nova lista
`proficiencies` (propriedade duplicada → conflito; propriedade/graduação inexistente →
not found; formato de uuid inválido → bad request) — isso é detalhado na etapa de
documentação (`api-dev-doc`), mas o `api-dev` deve deixar os textos coerentes com o que
implementou.
- Acesso Google: sem alteração — cada um dos 5 controllers já é `@GoogleAccess('read-only')`
  hoje (confirmado em `talents.controller.ts` e mesmo padrão nos outros 4); a adição do
  campo `proficiencies` não muda esse nível.

**Parte C — `SheetsController`/`SheetsService` (ficha).**

Regra geral de sincronização (aplicada nos 4 métodos abaixo): sempre que a raça ou a
biografia vinculada à ficha muda (vincular, trocar ou desvincular), a ficha recalcula
`proficiencias`/`proficienciasAjustadas` **do zero**, usando os dados brutos atuais de
`proficiencies` (tabela) para as origens atualmente vinculadas — nunca reaproveitando
escolhas de substituta feitas anteriormente. Isso vale mesmo quando a origem alterada não é
a dona do ajuste em questão: a re-execução do algoritmo abaixo naturalmente zera
`adjustedPropertyId`/`adjustedProperty` de **todos** os ajustes existentes, inclusive os que
vieram da entidade que não mudou — leitura literal do spec ("toda troca de entidade
recalcula conflitos e ajustes **integralmente**, do zero"). Deixar isso explícito no
código/comentário do método privado que implementa o algoritmo, para não ser "corrigido"
por engano depois.

Algoritmo de recomputação (método privado sugerido `recomputeProficiencies` em
`SheetsService`, chamado pelos 4 métodos de link/unlink de raça/biografia):
1. Reunir as origens efetivamente vinculadas à ficha **depois** da operação em curso (ex.:
   em `linkRace`, a raça nova + a biografia atual do `sheet`, se houver; em `unlinkRace`,
   apenas a biografia atual, se houver; simetricamente para `linkBiography`/`unlinkBiography`).
2. Buscar, para cada origem vinculada, seus registros brutos em `proficiencies`
   (`proficienciesRepository.find({ where: { ownerRace: { id } } / { ownerBiography: { id } }, relations: { property: true, gradation: true }, order: { sortOrder: 'ASC' } })`
   — mesmo estilo de query hoje usado inline em `linkRace` para `improvementFlawsRepository`).
3. Processar as listas brutas em uma ordem fixa e determinística que reflete "quem acabou
   de ser (re)vinculado é processado por último": a origem que **não** é o alvo da operação
   atual é processada **primeiro** (estado inicial), e a origem que é o alvo da operação
   atual (a raça em `linkRace`, a biografia em `linkBiography`) é processada **por último**,
   mesclando seus itens sobre o estado já construído. Em `unlinkRace`/`unlinkBiography` só
   existe a outra origem (se vinculada), processada sozinha. Esta escolha de ordem é o que
   implementa literalmente a regra do spec de que "o resultado pode variar conforme a ordem
   de vínculo" — ao vincular A e depois B, o recálculo do momento em que B é vinculado
   processa A primeiro e B por cima; se a ordem real de vínculo fosse invertida, seria B
   primeiro e A por cima, produzindo resultado potencialmente diferente para a mesma
   propriedade em conflito.
4. Manter, durante o processamento, um mapa `activeByPropertyId` (propriedade → `{ gradationLevel, entry }`)
   e uma lista `ajustes`. Para cada item bruto `(property, gradation, sourceName, sourceType)`
   na ordem definida no passo 3:
   - Se `property.id` **não** está em `activeByPropertyId`: adicionar como entrada ativa
     (`activeByPropertyId.set(property.id, { gradationLevel: gradation.level, entry: { id, property, gradation, sourceName } })`),
     na lista `proficiencias.<sourceType>` correspondente.
   - Se `property.id` **já** está em `activeByPropertyId` com `gradationLevel` existente:
     - Se `gradation.level > existente.gradationLevel`: a entrada ativa anterior é
       **descartada sem compensação** (não vira ajuste — regra explícita do spec) e a nova
       entrada assume o lugar de ativa para aquela propriedade (mover para a lista de
       `proficiencias.<sourceType>` da nova origem, remover da lista da origem anterior).
     - Senão (`gradation.level <= existente.gradationLevel`): o item novo **não** entra em
       `proficiencias` — vira uma entrada em `ajustes`: `{ id: randomUUID(), sourceType,
       sourceName, originalProperty: property, originalGradation: gradation,
       adjustedPropertyId: null, adjustedProperty: null }`. A entrada ativa existente não é
       alterada.
5. Ao final, `sheet.proficiencias` = agrupamento por origem das entradas que permaneceram
   ativas em `activeByPropertyId` (mantendo `trainings`/`talents`/`characteristics` sempre
   `[]`), e `sheet.proficienciasAjustadas` = lista `ajustes` construída no passo 4. Atribuir
   sempre um **novo objeto/array** a essas duas propriedades do `sheet` (não mutar em
   lugar), para garantir que o TypeORM detecte a mudança na coluna jsonb.
6. Chamar este método a partir de `linkRace`, `unlinkRace`, `linkBiography` e
   `unlinkBiography`, logo após a lógica hoje existente de `melhorias`/`defeitos` em cada um
   (sem alterar em nada essa lógica pré-existente — inclusive em `linkBiography`, que **não**
   deve ter seu comportamento atual de melhorias alterado, conforme reforçado no pedido:
   apenas acrescentar a chamada de sincronização de proficiências ao final do método, antes
   do `this.sheetsRepository.save(sheet)`).

Gap de requisito identificado (não decidido por conta própria — sinalizar ao usuário antes
de implementar, se possível, ou implementar a opção A abaixo como a leitura mais consistente
com a regra geral já declarada no spec, documentando a escolha): o spec não diz
explicitamente se uma propriedade **já escolhida como substituta** de outro ajuste (resolvida)
deve ficar indisponível como opção de substituta para ajustes futuros/outros, nem se uma nova
proficiência bruta trazida por uma entidade recém-vinculada, cuja propriedade coincide com uma
substituta já escolhida, deveria gerar algum tipo de conflito. Duas leituras possíveis:
- **(A)** Aplicar a regra geral já enunciada no spec — "cada propriedade permanece única na
  ficha como um todo" — também às substitutas escolhidas: uma substituta já escolhida por
  outro ajuste passa a contar como propriedade ocupada apenas para fins do **seletor** (não
  entra no algoritmo de recálculo do passo 3-4 acima, que só usa dados brutos de
  propriedade/graduação, nunca escolhas de substituta).
- **(B)** Ignorar substitutas escolhidas para fins de unicidade, permitindo (ainda que raro)
  duas linhas na ficha "resolvidas" para a mesma propriedade (uma ativa em `proficiencias`
  via substituta, outra futura).
Este plano assume a leitura (A) apenas para a validação do endpoint de escolha de
substituta (ver abaixo), por ser a extensão mais direta da regra já explícita no spec; o
`api-dev` deve confirmar essa leitura com o usuário antes de codar caso reste dúvida.

Novo endpoint de resolução de conflito (única interação manual da aba, conforme spec):
- `PUT /sheets/:id/proficiency-adjustments/:adjustmentId` — body:
  `ResolveProficiencyAdjustmentDto { propertyId: string (uuid, @IsUUID('4')) }`. Retorna
  `SheetResponseDto` (mesmo padrão de retorno de `linkRace`/`linkBiography`).
  - `SheetsService.resolveProficiencyAdjustment(sheetId, adjustmentId, dto, currentUser)`:
    1. `findAccessibleById` (mesma checagem de posse/Google usada nos demais métodos).
    2. Localizar o ajuste por `id` em `sheet.proficienciasAjustadas`; `NotFoundException`
       ("Ajuste de proficiência não encontrado.") se não existir.
    3. Calcular o conjunto de propriedades ocupadas = propriedades de todas as entradas
       ativas em `sheet.proficiencias` (todas as 5 chaves) **união** `adjustedPropertyId`
       de todos os **outros** ajustes já resolvidos em `sheet.proficienciasAjustadas`
       (leitura (A) do gap acima). Se `dto.propertyId` estiver nesse conjunto:
       `ConflictException` ("A propriedade selecionada já está aplicada na ficha.").
    4. Buscar `ProficiencyProperty` por `dto.propertyId`; `NotFoundException`
       ("Propriedade de proficiência não encontrada.") se não existir.
    5. Substituir o ajuste no array (nova referência de array, não mutação in-place) com
       `adjustedPropertyId`/`adjustedProperty` preenchidos; manter
       `originalProperty`/`originalGradation`/`sourceType`/`sourceName` intactos.
    6. Salvar e retornar o `sheet`.
  - Controller: mesmo padrão de guard de `SheetsController` (`@UseGuards(JwtAuthGuard)`,
    sem `GoogleAccessGuard`/`GoogleAccess`, pois o controller de fichas não usa essa
    restrição — é uma restrição por posse do próprio usuário, já tratada internamente por
    `isRestrictedToOwnSheets`/`findAccessibleById`).

Alterações nos 4 métodos existentes de link/unlink:
- `linkRace`/`unlinkRace`: acrescentar a chamada a `recomputeProficiencies` como último passo
  antes do `save`, sem alterar a lógica de `melhorias`/`defeitos` já existente.
- `linkBiography`: **não alterar nada da lógica atual de melhorias/defeitos** (conforme
  reforçado explicitamente no pedido) — acrescentar apenas a chamada a
  `recomputeProficiencies` como último passo antes do `save`.
- `unlinkBiography`: acrescentar a mesma chamada.

`SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`): acrescentar
- `proficiencias: SheetProficiencySnapshotResponseDto` (novo DTO, espelhando
  `SheetImprovementFlawSnapshotResponseDto`, com `race`/`biography`/`trainings`/`talents`/
  `characteristics: SheetProficiencySnapshotEntryResponseDto[]`);
- `proficienciasAjustadas: SheetProficiencyAdjustmentResponseDto[]` (novo DTO):
  `{ id, sourceType, sourceName, originalProperty: {id,name}, originalGradation:
  {id,name,level}, adjustedProperty: {id,name} | null }` — expor os 3 dados exigidos pelo
  spec: valor original (propriedade+graduação), entidade de origem, e valor ajustado
  escolhido (`adjustedProperty`, `null` enquanto pendente).
- `static fromEntity` de ambos os novos DTOs a partir das interfaces
  `SheetProficiencySnapshot`/`SheetProficiencyAdjustment[]`, no mesmo espírito de
  `SheetImprovementFlawSnapshotEntryResponseDto.fromRaw`.

`SheetsModule`: acrescentar `Proficiency`, `ProficiencyProperty`, `ProficiencyGradation` ao
`TypeOrmModule.forFeature([...])` (mesmo padrão de injeção direta de repositório já usado
para `ImprovementFlaw`/`ImprovementFlawType`/`ImprovementFlawProperty` — não é necessário
importar `ProficienciesModule` inteiro, pois `SheetsService` usa os repositórios
diretamente, replicando a query inline hoje usada em `linkRace`).

Status: concluído

Entidade:
- app-api/src/modules/proficiencies/entities/proficiency.entity.ts
- app-api/src/modules/proficiencies/enums/proficiency-owner-type.enum.ts
- app-api/src/modules/proficiency-properties/entities/proficiency-property.entity.ts
- app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts
- app-api/src/modules/sheets/entities/sheet.entity.ts (alterada: colunas `proficiencias` e `proficienciasAjustadas`)

Migration:
- app-api/src/database/migrations/1784306300000-RevertImprovementFlawProficiencyType.ts
- app-api/src/database/migrations/1784306310000-CreateProficiencyPropertiesTable.ts
- app-api/src/database/migrations/1784306320000-SeedProficiencyPropertiesTable.ts
- app-api/src/database/migrations/1784306330000-CreateProficiencyGradationsTable.ts
- app-api/src/database/migrations/1784306340000-SeedProficiencyGradationsTable.ts
- app-api/src/database/migrations/1784306350000-CreateProficienciesTable.ts
- app-api/src/database/migrations/1784306360000-AddProficienciesSnapshotsToSheets.ts
(migration original `1784306290000-SeedImprovementFlawProficiencyType.ts` mantida intocada, conforme instruído)

Rotas:
- GET /proficiency-properties
- GET /proficiency-gradations
- PUT /sheets/:id/proficiency-adjustments/:adjustmentId (novo)
- POST/GET/PUT/DELETE /talents, /trainings, /characteristics, /biographies, /races (assinatura de rota inalterada; corpo/resposta passam a incluir `proficiencies`)
- PUT/DELETE /sheets/:id/race e /sheets/:id/biography (assinatura inalterada; `SheetsService` agora também recalcula `proficiencias`/`proficienciasAjustadas` nesses 4 métodos)

Arquivos:
- app-api/src/modules/proficiencies/proficiencies.service.ts, proficiencies.module.ts, dto/proficiency-item-input.dto.ts, dto/proficiency-item-response.dto.ts
- app-api/src/modules/proficiency-properties/proficiency-properties.service.ts, proficiency-properties.controller.ts, proficiency-properties.module.ts, dto/proficiency-property-response.dto.ts
- app-api/src/modules/proficiency-gradations/proficiency-gradations.service.ts, proficiency-gradations.controller.ts, proficiency-gradations.module.ts, dto/proficiency-gradation-response.dto.ts
- app-api/src/app.module.ts (registro de `ProficiencyPropertiesModule`/`ProficiencyGradationsModule`)
- app-api/src/modules/talents/{dto/create-talent.dto.ts, dto/talent-response.dto.ts, talents.service.ts, talents.controller.ts, talents.module.ts}
- app-api/src/modules/trainings/{dto/create-training.dto.ts, dto/training-response.dto.ts, trainings.service.ts, trainings.controller.ts, trainings.module.ts}
- app-api/src/modules/characteristics/{dto/create-characteristic.dto.ts, dto/characteristic-response.dto.ts, characteristics.service.ts, characteristics.controller.ts, characteristics.module.ts}
- app-api/src/modules/biographies/{dto/create-biography.dto.ts, dto/biography-response.dto.ts, biographies.service.ts, biographies.controller.ts, biographies.module.ts}
- app-api/src/modules/races/{dto/create-race.dto.ts, dto/race-response.dto.ts, races.service.ts, races.controller.ts, races.module.ts}
- app-api/src/modules/sheets/{interfaces/sheet-proficiency-snapshot.interface.ts, interfaces/sheet-proficiency-adjustment.interface.ts, dto/sheet-proficiency-snapshot-entry-response.dto.ts, dto/sheet-proficiency-snapshot-response.dto.ts, dto/sheet-proficiency-adjustment-response.dto.ts, dto/resolve-proficiency-adjustment.dto.ts, dto/sheet-response.dto.ts, sheets.service.ts, sheets.controller.ts, sheets.module.ts}

Nenhuma pendência em aberto: o gap de requisito sinalizado no plano (unicidade de
substituta escolhida) foi resolvido pela leitura (A), conforme instrução da orquestração.
`@ApiOperation`/`@ApiOkResponse`/`@ApiNotFoundResponse`/`@ApiConflictResponse`/`@ApiBadRequestResponse`
finos para os endpoints novos (proficiency-properties, proficiency-gradations, novo endpoint
de ajuste em sheets) e a atualização de texto dos `@ApiConflictResponse`/`@ApiNotFoundResponse`/
`@ApiBadRequestResponse` já existentes nos 5 controllers de entidade dona ficam para a etapa
`api-dev-doc`, conforme escopo desta etapa.

### 2. api-dev-doc

Status: concluído

Cobrir na documentação Swagger:
- Tags/descrições dos 2 novos controllers somente leitura: `proficiency-properties` e
  `proficiency-gradations` (`@ApiOperation`, `@ApiOkResponse`), no mesmo padrão de
  `improvement-flaw-types`/`improvement-flaw-properties`.
- Atualizar `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` dos 5
  controllers de entidade dona (`talents`, `trainings`, `characteristics`, `biographies`,
  `races`) em `create`/`update`, mencionando as novas regras de `proficiencies`
  (propriedade duplicada na lista → conflito; propriedade/graduação inexistente →
  not found; uuid inválido → bad request), a exemplo do texto já existente para
  `improvements`/`flaws`.
- Novos `@ApiProperty`/`@ApiPropertyOptional` em `Create<Entidade>Dto`,
  `Update<Entidade>Dto` e `<Entidade>ResponseDto` para o campo `proficiencies`.
- `SheetsController`: atualizar `@ApiOperation.summary` de `PUT /sheets/:id/race`,
  `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography` e `DELETE /sheets/:id/biography`
  para mencionar a sincronização de proficiências (mesmo espírito da atualização já feita
  anteriormente no summary de `linkBiography` para mencionar "proficiências", que hoje já
  existe e deve continuar coerente); documentar o novo endpoint
  `PUT /sheets/:id/proficiency-adjustments/:adjustmentId` com `@ApiOperation`,
  `@ApiOkResponse({ type: SheetResponseDto })`, `@ApiNotFoundResponse` (ficha, ajuste ou
  propriedade não encontrados), `@ApiConflictResponse` (propriedade já aplicada na ficha),
  `@ApiBadRequestResponse` (IDs em formato inválido).
- Novos DTOs de resposta (`ProficiencyPropertyResponseDto`, `ProficiencyGradationResponseDto`,
  `ProficiencyItemResponseDto`, `SheetProficiencySnapshotResponseDto`,
  `SheetProficiencySnapshotEntryResponseDto`, `SheetProficiencyAdjustmentResponseDto`) e o
  novo DTO de entrada (`ProficiencyItemInputDto`, `ResolveProficiencyAdjustmentDto`) devem
  ter `@ApiProperty`/`@ApiPropertyOptional` completos com `example`, seguindo o padrão já
  usado em `ImprovementFlawItemResponseDto`/`ImprovementFlawTypeResponseDto`.

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Revisão focada nas prioridades indicadas pela orquestração: consistência migration↔entidade,
imutabilidade da migration `1784306290000`, fidelidade da regra de conflito ao spec, segurança/
posse do novo endpoint de fichas, e não alteração da lógica pré-existente de `linkBiography`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:

**Migrations (7 novas + confirmação da original intocada)**
- app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts (confirmado intocado — `up`/`down` idênticos ao lido antes desta tarefa)
- app-api/src/database/migrations/1784306300000-RevertImprovementFlawProficiencyType.ts (`up` remove join table → propriedades → tipo, na ordem exigida pelo spec; `down` reinsere na mesma ordem do `up()` da migration original, com a lista `PROFICIENCY_PROPERTY_NAMES` idêntica)
- app-api/src/database/migrations/1784306310000-CreateProficiencyPropertiesTable.ts
- app-api/src/database/migrations/1784306320000-SeedProficiencyPropertiesTable.ts (20 propriedades, mesma lista/ordem da Parte A)
- app-api/src/database/migrations/1784306330000-CreateProficiencyGradationsTable.ts (índices únicos em `name` e `level`)
- app-api/src/database/migrations/1784306340000-SeedProficiencyGradationsTable.ts (5 graduações, ordem crescente de `level`)
- app-api/src/database/migrations/1784306350000-CreateProficienciesTable.ts (check `CK_proficiencies_owner_exclusive` com `num_nonnulls(...) = 1`; índice único `IDX_proficiencies_unique_owner_property` cobrindo os 5 owners + `property_id`; FKs de propriedade/graduação `ON DELETE NO ACTION`, FKs dos 5 owners `ON DELETE CASCADE`; `down()` reverte na ordem inversa correta)
- app-api/src/database/migrations/1784306360000-AddProficienciesSnapshotsToSheets.ts (defaults jsonb batem com os defaults declarados na entidade `Sheet`)

**Entidades**
- app-api/src/modules/proficiencies/entities/proficiency.entity.ts — colunas de dono, `@Check` e `@Unique` batem exatamente com a migration `1784306350000` (mesmos nomes de coluna/constraint e mesma ordem no `@Unique`)
- app-api/src/modules/proficiencies/enums/proficiency-owner-type.enum.ts — valores idênticos a `ImprovementFlawOwnerType`
- app-api/src/modules/proficiency-properties/entities/proficiency-property.entity.ts
- app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts — `level` com índice único próprio, batendo com a migration
- app-api/src/modules/sheets/entities/sheet.entity.ts — colunas `proficiencias`/`proficienciasAjustadas` com defaults e nome de coluna (`proficiencias_ajustadas`) coerentes com a migration

**Módulos `proficiencies`, `proficiency-properties`, `proficiency-gradations`**
- app-api/src/modules/proficiencies/proficiencies.service.ts, proficiencies.module.ts, dto/proficiency-item-input.dto.ts, dto/proficiency-item-response.dto.ts — espelha `ImprovementFlawsService` simplificado, sem categoria/tipo, mensagens de erro em pt-BR conforme spec
- app-api/src/modules/proficiency-properties/{proficiency-properties.service.ts, proficiency-properties.controller.ts, proficiency-properties.module.ts, dto/proficiency-property-response.dto.ts} — `GET /proficiency-properties`, `JwtAuthGuard`+`GoogleAccessGuard`+`GoogleAccess('read-only')`, ordenado por `name ASC`
- app-api/src/modules/proficiency-gradations/{proficiency-gradations.service.ts, proficiency-gradations.controller.ts, proficiency-gradations.module.ts, dto/proficiency-gradation-response.dto.ts} — mesmo padrão de guard, ordenado por `level ASC`
- app-api/src/app.module.ts — `ProficiencyPropertiesModule`/`ProficiencyGradationsModule` registrados

**5 entidades donas (talents, trainings, characteristics, biographies, races)**
- DTOs de criação/atualização e de resposta das 5 entidades — campo `proficiencies` opcional/validado (`@IsOptional/@IsArray/@ValidateNested/@Type`) e exposto no response a partir de `loadItemsFor`
- Services das 5 entidades — injeção de `ProficienciesService`, chamadas a `validateAndResolveItems`/`validateList`/`replaceItems`/`loadItemsFor` no mesmo ponto do fluxo em que `improvements`/`flaws` são tratados, inclusive no caminho de `update` que recarrega a lista atual quando `dto.proficiencies` não é enviado
- Controllers das 5 entidades — `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` atualizados mencionando as regras de `proficiencies`; guards Google inalterados (`read-only`)
- Modules das 5 entidades — `ProficienciesModule` importado ao lado de `ImprovementFlawsModule`

**Sheets (Parte C)**
- app-api/src/modules/sheets/interfaces/sheet-proficiency-snapshot.interface.ts, interfaces/sheet-proficiency-adjustment.interface.ts — formato batendo com o spec
- app-api/src/modules/sheets/dto/sheet-proficiency-snapshot-entry-response.dto.ts, dto/sheet-proficiency-snapshot-response.dto.ts, dto/sheet-proficiency-adjustment-response.dto.ts, dto/resolve-proficiency-adjustment.dto.ts, dto/sheet-response.dto.ts — `fromRaw`/`fromEntity` corretos, `trainings`/`talents`/`characteristics` sempre vazios, `adjustedProperty` nulo enquanto pendente
- app-api/src/modules/sheets/sheets.service.ts:
  - `recomputeProficiencies` implementa fielmente o algoritmo do spec: maior graduação prevalece sem compensação para a descartada; graduação menor-ou-igual vira ajuste (`ConflictException` não se aplica aqui, é sempre aceito e viram entrada em `proficienciasAjustadas`); ordem de processamento com a origem-alvo por último, reproduzindo a dependência de ordem de vínculo esperada pelo spec; atribuição de novos objetos/arrays a `sheet.proficiencias`/`sheet.proficienciasAjustadas` (sem mutação in-place)
  - `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` chamam `recomputeProficiencies` como último passo antes do `save`, sem alterar a lógica pré-existente de `melhorias`/`defeitos` — em particular, `linkBiography` mantém intacta a lógica de melhoria de atributo selecionada + melhoria livre + demais melhorias não-Atributo da biografia
  - `resolveProficiencyAdjustment` usa `findAccessibleById` (mesma checagem de posse/Google dos demais métodos), calcula o conjunto de propriedades ocupadas unindo as 5 chaves de `proficiencias` ativas com os `adjustedPropertyId` de outros ajustes já resolvidos (leitura (A) do gap, conforme decidido), lança `ConflictException`/`NotFoundException` com as mensagens do spec, e substitui o ajuste no array por uma nova referência
- app-api/src/modules/sheets/sheets.controller.ts — novo endpoint `PUT /sheets/:id/proficiency-adjustments/:adjustmentId` com `@UseGuards(JwtAuthGuard)` apenas (sem `GoogleAccessGuard`, conforme padrão do restante do controller de fichas), Swagger completo (`@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse`, `@ApiBadRequestResponse`); summaries de `PUT/DELETE /sheets/:id/race` e `/biography` atualizados mencionando proficiências
- app-api/src/modules/sheets/sheets.module.ts — `Proficiency`, `ProficiencyProperty`, `ProficiencyGradation` adicionados ao `TypeOrmModule.forFeature`

Observação não bloqueante (fora do escopo desta tarefa, comportamento pré-existente e não alterado
por ela): `SheetResponseDto.fromEntity` chama `RaceResponseDto.fromEntity(sheet.race)` sem passar o
segundo argumento `references`, então `improvements`/`flaws`/`proficiencies` da raça aninhada no
retorno de `/sheets/:id` sempre aparecem como `[]` (o parâmetro tem default vazio). Esse padrão já
existia para `improvements`/`flaws` antes desta tarefa e a adição de `proficiencies` apenas seguiu a
mesma convenção já presente no código — não é uma regressão introduzida por esta task, mas fica
registrado caso vire prioridade de correção futura.