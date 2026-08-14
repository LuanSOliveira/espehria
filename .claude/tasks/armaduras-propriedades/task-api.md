# Task API: Novas propriedades em Armaduras

## Contexto

Não existe `.claude/tasks/armaduras-propriedades/spec.md` para esta demanda — o enunciado
recebido diretamente da orquestração é a fonte de verdade. Este plano é estruturalmente
análogo à demanda anterior "Traços (nova entidade) e alterações em Armas"
(`.claude/tasks/tracos-armas/task-api.md`, já implementada nesta mesma sessão) e reaproveita
deliberadamente os mesmos padrões: `common/transformers/decimal.transformer.ts`
(`DecimalTransformer`), o padrão de junção dedicada `Weapon`↔`Trait` (`WeaponTrait`/
`weapon_traits`) replicado agora para `Armor`↔`Trait`, o padrão de tabela auxiliar com seed
(`SizeGrade`/`size_grades` como precedente direto de coluna `order`), e o filtro
`traitTypeId`, já existente em `GET /traits`, que só precisa ser reaproveitado pelo
frontend — nenhuma alteração é necessária no módulo `traits` nesta demanda.

Investigação de código feita em: `app-api/src/modules/armors/**` (entidade/DTOs/service/
controller/module atuais), `app-api/src/modules/weapons/**` (padrão espelho, já contém os
mesmos tipos de campo pedidos aqui: `nickname`, `volume`, FK de tabela auxiliar
`sizeGrade`, `traits` via `WeaponTrait`), `app-api/src/modules/size-grades/**` (padrão de
tabela auxiliar com coluna `order`), `app-api/src/modules/damage-types/**` (padrão de
tabela auxiliar sem coluna `order`), `app-api/src/modules/traits/**` (confirmação do
filtro `traitTypeId` já existente em `FindTraitsQueryDto`/`TraitsService.findAllPaginated`),
`app-api/src/modules/search/search.service.ts`/`linkable-entity-type.enum.ts` (confirmação
de que `Armor` já está indexada na busca global) e `app-api/src/database/migrations/`
(confirmação do timestamp mais recente).

**Confirmado por leitura direta de `app-api/src/modules/armors/entities/armor.entity.ts`:**
`Armor` hoje possui apenas `name`, `referenceImage`, `description`, `price`, `currency`,
`privateInformation`, `tags` — nenhum campo de categoria existe. "Categoria" é, portanto,
caso de nova tabela auxiliar (não de reaproveitamento de coluna existente).

**Confirmado por leitura de `app-api/src/modules/search/search.service.ts`
(linha ~68-151):** `Armor` já está registrada em `linkableEntities` com
`LinkableEntityType.ARMOR`. Nenhuma alteração em `search` é necessária nesta demanda — os
novos campos de `Armor` não afetam a indexação (a busca global já indexa por nome/tipo, não
pelos campos de propriedade que estão sendo adicionados).

**Lacuna de requisito sinalizada (não decidida por conta própria — ver Decisão 3 abaixo):**
o enunciado marca explicitamente apenas "Limite de modificador de Destreza" e "Penalidade em
teste" como OPCIONAL, mas não marca "Bônus de CA", "Categoria", "Força" e "Penalidade de
Velocidade" nem como opcionais nem como obrigatórios. Como a instrução transversal da
demanda determina "todas seguindo o critério de opcional/nullable para não quebrar contrato
existente, EXCETO onde o enunciado indicar obrigatoriedade" — e o enunciado não indica
obrigatoriedade textual para nenhum desses quatro campos — este plano trata **todos os 7
campos novos de valor (fora `traits`) como opcionais/nullable**, tanto no banco quanto no
DTO de entrada. Fica sinalizado para revisão do usuário: se a intenção for que "Bônus de
CA", "Categoria", "Força" e/ou "Penalidade de Velocidade" sejam campos obrigatórios no
formulário (apenas nullable no banco por segurança, mas `@IsNotEmpty`/sem `@IsOptional` no
DTO de criação), isso deve ser confirmado antes da implementação — o plano atual não assume
essa obrigatoriedade.

## Decisões de design

### 1. Nova tabela auxiliar `armor_categories` (Categoria)

Confirmado que `Armor` não possui hoje nenhum campo de categoria (ver "Contexto" acima).
Segue o mesmo padrão já estabelecido em `trait-types`/`size-grades`/`damage-types`: nova
entidade `ArmorCategory` (módulo `armor-categories`) estendendo `BaseEntity`, com `name`
único e módulo somente leitura (`GET /armor-categories`, `@GoogleAccess('read-only')`, sem
paginação, seed via migration).

**Coluna de ordem: sim.** As quatro opções pedidas ("Sem Armadura", "Armadura Leve",
"Armadura Média", "Armadura Pesada") têm uma progressão semântica natural (Nenhuma → Leve →
Média → Pesada) que a ordenação alfabética **não** preserva: alfabeticamente a ordem seria
"Armadura Leve", "Armadura Média", "Armadura Pesada", "Sem Armadura" (com "Sem Armadura" por
último, já que `S` > `A`), o que quebraria a progressão esperada no Autocomplete do
frontend. Este é exatamente o mesmo cenário que motivou a coluna `order` em `SizeGrade` (ver
decisão 1 de `tracos-armas/task-api.md`) e diferente de `DamageType`/`Currency`/
`ImprovementFlawType`, cujas opções não têm sequência semântica e por isso usam apenas
`name ASC`. Por isso `ArmorCategory` ganha `order` (`int`, `not null`, índice único,
`findAll()` ordenado por `order ASC`, não por `name`) — mesmo formato exato de `SizeGrade`.
Seed, na ordem exata pedida: `('Sem Armadura', 1), ('Armadura Leve', 2), ('Armadura Média',
3), ('Armadura Pesada', 4)`.

### 2. Precisão numérica de Volume e Penalidade de Velocidade (Metros)

Ambos os campos: coluna `numeric(4,1)` (`type: 'numeric', precision: 4, scale: 1`),
nullable, usando o `DecimalTransformer` já existente em
`app-api/src/common/transformers/decimal.transformer.ts` (criado na demanda `tracos-armas`
e já aplicado em `Weapon.volume`/`Weapon.distanceMeters`) — reaproveitado tal como está, sem
nenhuma alteração no utilitário. Validação no DTO de entrada: `@IsNumber({
maxDecimalPlaces: 1 })` + `@Min(0)`, mesmo critério de `CreateWeaponDto.volume`/
`distanceMeters`.

### 3. Campos opcionais vs. obrigatórios (ver também "Lacuna de requisito sinalizada" acima)

Todos os 7 campos novos de valor são opcionais/nullable no banco e no DTO de entrada,
seguindo a instrução transversal explícita da demanda ("todas seguindo o critério de
opcional/nullable... EXCETO onde o enunciado indicar obrigatoriedade") — nenhum dos sete é
declarado como obrigatório no enunciado, apenas dois são explicitamente rotulados
"OPCIONAL" (o que é tratado aqui como reforço, não como contraste implícito de
obrigatoriedade dos demais; ver lacuna sinalizada acima para o usuário confirmar).

### 4. Relação Armadura ↔ Traços

Mesma modelagem de `Weapon`↔`Trait` (ver decisão 3 de `tracos-armas/task-api.md`, campo a
campo): nova entidade de junção dedicada `ArmorTrait` (`armor_traits`) — `order` (`int`,
default `0`), `armor` (`ManyToOne`, `onDelete: 'CASCADE'`), `trait` (`ManyToOne`,
`onDelete: 'CASCADE'`), `@Unique(['armor', 'trait'])`. Ordem de leitura `order ASC, id ASC`
(desempate estável), estratégia "delete + recreate" a cada `POST`/`PUT` que envie
`traitIds`, implementada inline em `ArmorsService` (sem utilitário genérico, mesma
justificativa da decisão 3 de `tracos-armas`: hoje apenas `Weapon` e, a partir desta
demanda, `Armor` referenciam `Trait` — ainda não há massa crítica de reaproveitamento que
justifique extrair um utilitário genérico do estilo `ordered-tags.util.ts` para traços; se
uma terceira entidade vier a referenciar `Trait`, essa extração deve ser reavaliada).

O front filtrará os traços por tipo "Armadura" usando `traitTypeId` em `GET /traits`, filtro
que **já existe** (`FindTraitsQueryDto.traitTypeId`, implementado em
`TraitsService.findAllPaginated` — confirmado por leitura direta de
`app-api/src/modules/traits/dto/find-traits-query.dto.ts`). Nenhuma alteração é necessária
no módulo `traits` nesta demanda.

### 5. FK de `armorCategory` sem cascade

`Armor.armorCategory` segue o mesmo critério de `Weapon.sizeGrade`/`Weapon.damageType`:
`@ManyToOne(() => ArmorCategory, { nullable: true })` **sem** `onDelete: 'CASCADE'` (default
`NO ACTION`/`RESTRICT`) — tabela de seed, nunca excluída via API, então não há necessidade
de comportamento de exclusão em cascata ou `SET NULL`. (Diferente de `Armor.currency`, que
usa `onDelete: 'SET NULL'` por decisão pré-existente do módulo `currencies`; este plano não
altera esse comportamento pré-existente, apenas segue o precedente mais recente — e mais
próximo em natureza — de `sizeGrade`/`damageType` para o novo campo `armorCategory`.)

### 6. Busca global (`search`)

Nenhuma alteração necessária. `Armor` já está indexada em `SearchService.linkableEntities`
com `LinkableEntityType.ARMOR` (confirmado por leitura direta). Os novos campos são
propriedades de detalhe, não afetam o que já é buscado/exibido pela busca global.

## Etapas

### 1. api-dev

Status: concluído
Entidade: app-api/src/modules/armors/entities/armor.entity.ts (+ armor-trait.entity.ts,
  app-api/src/modules/armor-categories/entities/armor-category.entity.ts)
Migration: app-api/src/database/migrations/1784306680000-CreateArmorCategoriesTable.ts,
  1784306690000-SeedArmorCategoriesTable.ts,
  1784306700000-AddArmorPropertiesToArmorsTable.ts,
  1784306710000-CreateArmorTraitsTable.ts (não executadas no banco — pendente
  `npm run migration:run` mediante confirmação do usuário)
Rotas: GET /armor-categories (nova); POST /armors, PUT /armors/:id, GET /armors/:id,
  GET /armors (contrato ampliado, mesmo método/caminho)
Arquivos: DTOs/service/controller/module de armor-categories
  (app-api/src/modules/armor-categories/**); app-api/src/modules/armors/dto/
  create-armor.dto.ts (update-armor.dto.ts via PartialType, inalterado),
  armor-response.dto.ts, armor-list-item-response.dto.ts;
  app-api/src/modules/armors/armors.service.ts, armors.module.ts,
  armors.controller.ts (apenas @ApiNotFoundResponse/@ApiBadRequestResponse de
  POST/PUT); app-api/src/app.module.ts (registro do módulo novo)

#### Entidade

**Módulo novo `armor-categories` (tabela auxiliar, somente leitura):**
- `ArmorCategory` (`app-api/src/modules/armor-categories/entities/armor-category.entity.ts`,
  tabela `armor_categories`), estende `BaseEntity`: `name` (`string`, `@Column()`,
  `@Index({ unique: true })`, `@ApiProperty()`); `order` (`int`, `@Column({ type: 'int' })`,
  `@Index({ unique: true })`, `@ApiProperty()` — ver decisão 1). Seed via migration, na
  ordem exata pedida: `('Sem Armadura', 1), ('Armadura Leve', 2), ('Armadura Média', 3),
  ('Armadura Pesada', 4)`.
- DTO `ArmorCategoryResponseDto` (`app-api/src/modules/armor-categories/dto/
  armor-category-response.dto.ts`): `id`, `name`, `order`, `static fromEntity` — mesmo
  padrão de `SizeGradeResponseDto`.
- `ArmorCategoriesService` (`findAll()` apenas, ordenado por `{ order: 'ASC' }`, mesmo
  padrão de `SizeGradesService`).
- `ArmorCategoriesModule` (`TypeOrmModule.forFeature([ArmorCategory])`, controller +
  service, `exports: [ArmorCategoriesService]`), registrado em `app-api/src/app.module.ts`.

**Alterações em `Armor`** (`app-api/src/modules/armors/entities/armor.entity.ts`), todos os
campos novos opcionais/nullable (ver decisão 3), sem alterar nenhum campo existente:
- `nickname` (`string | null`, `@Column({ type: 'varchar', nullable: true })`).
- `volume` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1,
  nullable: true, transformer: DecimalTransformer })` — ver decisão 2).
- `armorCategory` (`ManyToOne(() => ArmorCategory, { nullable: true })`,
  `@JoinColumn({ name: 'armor_category_id' })`, sem cascade — ver decisão 5).
- `armorClassBonus` (`number | null`, `@Column({ type: 'int', name: 'armor_class_bonus',
  nullable: true })` — "Bônus de CA").
- `dexterityModifierLimit` (`number | null`, `@Column({ type: 'int', name:
  'dexterity_modifier_limit', nullable: true })` — "Limite de modificador de Destreza",
  explicitamente opcional no enunciado).
- `strength` (`number | null`, `@Column({ type: 'int', nullable: true })` — "Força").
- `checkPenalty` (`number | null`, `@Column({ type: 'int', name: 'check_penalty',
  nullable: true })` — "Penalidade em teste", explicitamente opcional no enunciado).
- `speedPenaltyMeters` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1,
  name: 'speed_penalty_meters', nullable: true, transformer: DecimalTransformer })` —
  "Penalidade de Velocidade (Metros)", ver decisão 2).
- `traits` (`Trait[]`, não é coluna própria — populada em tempo de leitura a partir da nova
  `ArmorTrait`, mesmo critério de `tags` e de `Weapon.traits`).

Novo arquivo de suporte em `armors`:
- `app-api/src/modules/armors/entities/armor-trait.entity.ts` (`ArmorTrait`, ver decisão 4),
  campo a campo idêntica a `app-api/src/modules/weapons/entities/weapon-trait.entity.ts`.

`CreateArmorDto`/`UpdateArmorDto`
(`app-api/src/modules/armors/dto/create-armor.dto.ts`, `UpdateArmorDto` via
`PartialType(CreateArmorDto)` já existente e inalterado) ganham, todos opcionais:
- `nickname?: string` (`@IsOptional @IsString`).
- `volume?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`).
- `armorCategoryId?: string` (`@IsOptional @IsUUID('4')`).
- `armorClassBonus?: number` (`@IsOptional @IsInt @Min(0)`).
- `dexterityModifierLimit?: number` (`@IsOptional @IsInt @Min(1)`).
- `strength?: number` (`@IsOptional @IsInt @Min(0)`).
- `checkPenalty?: number` (`@IsOptional @IsInt @Min(1)`).
- `speedPenaltyMeters?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`).
- `traitIds?: string[]` (`@IsOptional @IsArray @IsUUID('4', { each: true })`, mesmo contrato
  de `tagIds`, ordem de inserção preservada).

`ArmorResponseDto`/`ArmorListItemResponseDto`
(`app-api/src/modules/armors/dto/armor-response.dto.ts`,
`armor-list-item-response.dto.ts`) ganham os campos equivalentes de leitura (`nickname`,
`volume`, `armorCategory: ArmorCategoryResponseDto | null`, `armorClassBonus`,
`dexterityModifierLimit`, `strength`, `checkPenalty`, `speedPenaltyMeters`,
`traits: TraitResponseDto[]`) — `traits` usa o `TraitResponseDto` completo do módulo
`traits` (não uma versão reduzida), mesmo critério já usado em `WeaponResponseDto`/
`WeaponListItemResponseDto` e para `tags` em ambos os DTOs de `Armor`. Ambos os DTOs
ganham `traits` (mesmo critério de já incluir `tags` na listagem).

`ArmorsService` (`app-api/src/modules/armors/armors.service.ts`) ganha:
- Injeção de `Repository<ArmorTrait>`, `Repository<ArmorCategory>`, `Repository<Trait>`
  (para validar `traitIds`, mesmo padrão de `findTagsByIds`/`WeaponsService`).
- `findTraitsByIds`, `findArmorCategoryById` — mesma forma de `findTagsByIds`/
  `findCurrencyById` já existentes (`NotFoundException` em pt-BR: "Um ou mais traços não
  foram encontrados.", "Categoria de armadura não encontrada.").
- Carregamento/gravação ordenada de `traits` inline (sem utilitário genérico, ver decisão
  4): `loadOrderedTraitsForArmor`, `loadOrderedTraitsMap`, `createOrderedTraitJunctions`,
  `replaceOrderedTraitJunctions` — mesma lógica das funções equivalentes já implementadas em
  `WeaponsService`, especializada em `ArmorTrait`/`Trait`, chamadas em `create`/`update`/
  `findById`/`findAllPaginated` no mesmo ponto em que `tags` já são tratadas.
- `create`/`update`: aplicam os novos campos seguindo a mesma convenção já usada para os
  campos opcionais existentes (`dto.campo !== undefined` em `update`; `dto.campo ?? null` em
  `create`, todos nullable, sem default booleano nesta demanda).

`ArmorsModule` (`app-api/src/modules/armors/armors.module.ts`) passa a importar também
`ArmorTrait`, `ArmorCategory`, `Trait` no `TypeOrmModule.forFeature([...])` (repositório
direto de `Trait`, mesmo critério já usado por `WeaponsModule` — que injeta
`Repository<Trait>` diretamente em vez de importar `TraitsModule`, evitando import
cíclico).

#### Migration

Necessária: sim — 4 migrations novas, todas após
`1784306670000-CreateWeaponTraitsTable.ts` (timestamp mais recente hoje no diretório,
confirmado por leitura de `app-api/src/database/migrations/`), com timestamps sugeridos
incrementais de 10000 em 10000, nesta ordem (tabela referenciada antes da FK que a usa):

1. `1784306680000-CreateArmorCategoriesTable.ts` — cria `armor_categories` (`id`,
   `created_at`, `updated_at`, `name` varchar not null, `order` integer not null) + índice
   único em `name` + índice único em `order`. Mesmo SQL padrão de
   `1784306620000-CreateSizeGradesTable.ts`.
2. `1784306690000-SeedArmorCategoriesTable.ts` — `INSERT INTO armor_categories (name,
   "order") VALUES ('Sem Armadura', 1), ('Armadura Leve', 2), ('Armadura Média', 3),
   ('Armadura Pesada', 4)`; `down()` faz `DELETE ... WHERE name IN (...)`. Mesmo padrão de
   `1784306630000-SeedSizeGradesTable.ts`.
3. `1784306700000-AddArmorPropertiesToArmorsTable.ts` — adiciona à tabela `armors`:
   `nickname` varchar nullable, `volume` numeric(4,1) nullable, `armor_category_id` uuid
   nullable + FK `→ armor_categories.id` sem cascade (`ON DELETE NO ACTION`),
   `armor_class_bonus` integer nullable, `dexterity_modifier_limit` integer nullable,
   `strength` integer nullable, `check_penalty` integer nullable, `speed_penalty_meters`
   numeric(4,1) nullable. `down()` remove a FK e as colunas na ordem inversa. Sem nenhum
   tipo enum Postgres novo (diferente de `1784306660000-
   AddWeaponPropertiesToWeaponsTable.ts`, que precisou de 3 enums — nenhum dos campos novos
   de `Armor` é um enum fixo).
4. `1784306710000-CreateArmorTraitsTable.ts` — cria `armor_traits` (`id`, `created_at`,
   `updated_at`, `order` integer not null default 0, `armor_id` uuid not null, `trait_id`
   uuid not null) + índice único composto (`armor_id`, `trait_id`) + índices simples em
   `armor_id`/`trait_id` + FKs `ON DELETE CASCADE` para `armors`/`traits`. Mesmo SQL padrão
   de `1784306670000-CreateWeaponTraitsTable.ts`.

Gerar cada migration via `npm run migration:generate -- src/database/migrations/<Nome>`
depois de as entidades estarem declaradas (`autoLoadEntities: true` detecta `ArmorCategory`/
`ArmorTrait` automaticamente, e as novas colunas de `Armor`) e revisar o SQL gerado,
conferindo que `UNIQUE`/FKs batem exatamente com o descrito acima (os `INSERT` de seed são
sempre escritos manualmente, como nas demais migrations de seed já existentes). **As
migrations devem ser criadas mas NÃO executadas** — `synchronize: false` está ativo e o
usuário rodará `npm run migration:run` manualmente após revisar o SQL gerado; nenhuma etapa
deste plano inclui rodar a migration contra o banco.

#### Controller

**Um novo endpoint de leitura (tabela auxiliar, sem paginação)**, mesmo padrão exato de
`SizeGradesController`/`DamageTypesController`/`TraitTypesController`
(`@UseGuards(JwtAuthGuard, GoogleAccessGuard)`, `@GoogleAccess('read-only')`, sem filtro):
- `GET /armor-categories` (`ArmorCategoriesController`) → `ArmorCategoryResponseDto[]`,
  ordenado por `order ASC` (não alfabético — ver decisão 1).
- Acesso Google: **read-only (padrão)** — tabela auxiliar de catálogo, mesmo critério das
  demais tabelas auxiliares já existentes.

**Endpoints existentes de `armors` afetados (contrato de request/response, sem mudança de
método/caminho):** `POST /armors`, `PUT /armors/:id`, `GET /armors/:id`, `GET /armors`
passam a aceitar/retornar os 8 campos novos opcionais descritos em "Entidade". Atualizar
`@ApiNotFoundResponse`/`@ApiBadRequestResponse` de `POST`/`PUT` em `ArmorsController`
(`app-api/src/modules/armors/armors.controller.ts`) para mencionar também: categoria de
armadura ou um ou mais traços não encontrados (`404`), e `volume`/`speedPenaltyMeters` com
mais de 1 casa decimal ou negativos, demais campos numéricos negativos ou fora do mínimo
exigido (`400`).
- **Acesso Google de `armors`: inalterado** — mantém `@GoogleAccess('read-only')` já
  existente no controller inteiro; os campos novos não mudam o nível de acesso (armaduras
  são conteúdo de catálogo, mesmo critério já usado para `weapons`/`tags`, não um recurso de
  gerenciamento restrito — não há justificativa para `blocked`).
- DTOs afetados: `CreateArmorDto`, `UpdateArmorDto` (via `PartialType`, sem alteração
  direta), `ArmorResponseDto`, `ArmorListItemResponseDto`, `PaginatedArmorsResponseDto` (sem
  alteração de estrutura, apenas do item interno). `FindArmorsQueryDto` permanece
  inalterado — nenhum filtro novo foi pedido para `GET /armors` nesta demanda.

### 2. api-dev-doc

Status: concluído

- Depende da etapa 1.
- Cobrir na documentação Swagger:
  - Tag/descrição do novo controller `armor-categories` (`@ApiOperation` indicando lista
    fixa ordenada por posição, mesmo padrão de `size-grades`).
  - `@ApiProperty`/`@ApiPropertyOptional` completos (com `example`) em
    `ArmorCategoryResponseDto`.
  - `@ApiProperty`/`@ApiPropertyOptional` dos 8 campos novos em `CreateArmorDto`/
    `ArmorResponseDto`/`ArmorListItemResponseDto`, com descrição clara de que
    `volume`/`speedPenaltyMeters` aceitam no máximo 1 casa decimal, e do mínimo exigido de
    cada campo inteiro (`armorClassBonus`/`strength` mínimo 0;
    `dexterityModifierLimit`/`checkPenalty` mínimo 1, opcionais).
  - Atualizar `@ApiNotFoundResponse`/`@ApiBadRequestResponse` de `POST`/`PUT /armors/:id`
    conforme detalhado na etapa 1 (Controller).
  - Nenhuma alteração é necessária em `SearchResultItemResponseDto`/documentação de
    `search` (Armor já documentada, nenhum campo novo afeta a busca global).

### 3. api-dev-codereviewer

Status: concluído

- Revisar tudo acima, com atenção especial a:
  - Confirmar que `Armor` realmente não tinha nenhum campo de categoria antes desta
    demanda (checagem já feita no planejamento, mas deve ser reconfirmada no código final).
  - `armor_categories.order` com índice único e `findAll()` ordenando por `order ASC` (não
    por `name`), seed batendo exatamente com os 4 nomes e a ordem pedida (`Sem Armadura` →
    `Armadura Leve` → `Armadura Média` → `Armadura Pesada`).
  - `DecimalTransformer` (reaproveitado sem alteração) realmente aplicado em `volume`/
    `speedPenaltyMeters` de `Armor` — resposta da API devolvendo `number`, nunca `string`.
  - `ArmorTrait`/`armor_traits` espelhando fielmente `WeaponTrait`/`weapon_traits` (mesma
    coluna `order`, mesmo `@Unique`, mesmas duas FKs `ON DELETE CASCADE`), e a ordem de
    `traits` na resposta de `Armor` preservada (`order ASC, id ASC`).
  - Todos os 8 campos novos de `Armor` realmente `nullable`/opcionais no banco e no DTO de
    entrada (ver decisão 3 e a lacuna sinalizada — nenhum foi implementado como obrigatório
    sem confirmação explícita do usuário), e nenhum campo existente de `Armor`/
    `ArmorResponseDto`/`CreateArmorDto` alterado ou removido.
  - `traits`/`tags` usando o `ResponseDto` completo (não apenas ids) tanto em
    `ArmorResponseDto` quanto em `ArmorListItemResponseDto`.
  - `armorCategory` sem `onDelete: 'CASCADE'` nem `SET NULL` (default `NO ACTION`), mesma
    forma de `sizeGrade`/`damageType` em `Weapon` (ver decisão 5).
  - `GoogleAccessGuard` + `@GoogleAccess('read-only')` presentes em
    `ArmorCategoriesController`; nível de acesso de `ArmorsController` inalterado
    (`read-only`, já existente antes desta demanda).
  - Nenhuma alteração indevida em `search` (`Armor` já indexada antes desta demanda, sem
    necessidade de mudança) nem em `traits` (filtro `traitTypeId` já existente, reaproveitado
    sem alteração).
  - Migrations: `1784306680000` a `1784306710000`, ordem de criação de tabela antes da FK
    que a referencia, nomes de constraint/índice seguindo a convenção `PK_`/`FK_`/`IDX_` já
    usada no restante do diretório (comparado com `CreateSizeGradesTable`/
    `CreateWeaponTraitsTable`/`AddWeaponPropertiesToWeaponsTable`). Cada `down()` reverte
    exatamente o que o `up()` correspondente criou, na ordem inversa. **Confirmar que as
    migrations não foram executadas contra o banco** (pendente `npm run migration:run`
    manual do usuário).
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto.
  - Nenhum código de produção fora do escopo planejado (sem paginação no endpoint auxiliar,
    sem filtro novo em `GET /armors`, sem alterar o nível de acesso Google de `armors`).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Cobertura da revisão (etapas 1 e 2, ambas `Status: concluído`): entidades, migrations, DTOs,
service, controllers e módulos de `armor-categories` e `armors`, comparados ao CLAUDE.md, às
decisões de design registradas acima e ao padrão espelho de `tracos-armas/task-api.md`
(`ArmorTrait`/`armor_traits` vs. `WeaponTrait`/`weapon_traits`, `ArmorCategory`/
`armor_categories` vs. `SizeGrade`/`size_grades`).

Pontos verificados e confirmados corretos:

- **`Armor` sem campo de categoria pré-existente**: reconfirmado por leitura direta de
  `app-api/src/modules/armors/entities/armor.entity.ts` — antes desta demanda a entidade
  tinha apenas `name`, `referenceImage`, `description`, `price`, `currency`,
  `privateInformation`, `tags`; nenhum desses campos foi alterado ou removido, os 8 campos
  novos (`nickname`, `volume`, `armorCategory`, `armorClassBonus`,
  `dexterityModifierLimit`, `strength`, `checkPenalty`, `speedPenaltyMeters`, `traits`) foram
  apenas adicionados.
- **`armor_categories.order`**: índice único na entidade (`@Index({ unique: true })` em
  `order`) e na migration `1784306680000-CreateArmorCategoriesTable.ts`
  (`CREATE UNIQUE INDEX "IDX_armor_categories_order"`), mesmo formato de
  `1784306620000-CreateSizeGradesTable.ts`. `ArmorCategoriesService.findAll()` ordena por
  `{ order: 'ASC' }` (não por `name`). Seed em
  `1784306690000-SeedArmorCategoriesTable.ts` bate exatamente com os 4 nomes e a ordem
  pedida: `('Sem Armadura', 1), ('Armadura Leve', 2), ('Armadura Média', 3), ('Armadura
  Pesada', 4)`; `down()` reverte com `DELETE ... WHERE name IN (...)` pelos mesmos 4 nomes.
- **`DecimalTransformer`**: reaproveitado sem alteração
  (`app-api/src/common/transformers/decimal.transformer.ts`), aplicado via `transformer:`
  no `@Column` de `volume` e `speedPenaltyMeters` em
  `app-api/src/modules/armors/entities/armor.entity.ts`, ambos `numeric(4,1)` consistente
  entre entidade e migration (`1784306700000-AddArmorPropertiesToArmorsTable.ts`:
  `numeric(4,1)` nas duas colunas). `from` converte `string | null` → `number | null` via
  `parseFloat`, garantindo que a API nunca devolva string para esses dois campos.
- **`ArmorTrait`/`armor_traits`**
  (`app-api/src/modules/armors/entities/armor-trait.entity.ts`): campo a campo idêntica a
  `WeaponTrait`/`weapon_traits` (mesma coluna `order` com `default: 0`, mesmo
  `@Unique(['armor', 'trait'])`, mesmas duas FKs `onDelete: 'CASCADE'` tanto para `armor`
  quanto para `trait`). A migration `1784306710000-CreateArmorTraitsTable.ts` espelha
  exatamente `1784306670000-CreateWeaponTraitsTable.ts` (mesma estrutura de índice único
  composto `(armor_id, trait_id)`, índices simples em cada FK, `ON DELETE CASCADE` nas duas
  FKs). A ordem de `traits` na resposta de `Armor` é carregada com `order: 'ASC', id: 'ASC'`
  em `ArmorsService.loadOrderedTraitsMap`, mesmo critério de desempate estável usado em
  `WeaponsService`.
- **8 campos novos de `Armor`**: todos `nullable` na entidade e na migration, e todos
  `@IsOptional` em `CreateArmorDto` (`UpdateArmorDto` via `PartialType`, sem alteração
  direta) — nenhum foi implementado como obrigatório, consistente com a decisão 3 e a
  premissa confirmada com o usuário. Nenhum campo pré-existente de `Armor`/
  `ArmorResponseDto`/`CreateArmorDto` foi alterado ou removido.
- **`traits`/`tags` em `Armor`**: tanto `ArmorResponseDto` quanto
  `ArmorListItemResponseDto` usam `TraitResponseDto`/`TagResponseDto` completos (não apenas
  ids), populados via `fromEntity` a partir de `armor.traits ?? []`/`armor.tags ?? []`.
- **`armorCategory` sem cascade**: `@ManyToOne(() => ArmorCategory, { nullable: true })` em
  `Armor`, sem `onDelete: 'CASCADE'` nem `SET NULL` — mesma forma de
  `Weapon.sizeGrade`/`Weapon.damageType`. A migration confirma
  `ON DELETE NO ACTION` na FK `FK_armors_armor_category_id`, mesmo padrão de
  `FK_weapons_size_grade_id`/`FK_weapons_damage_type_id`.
- **`GoogleAccessGuard` + `@GoogleAccess('read-only')`**: presentes em
  `ArmorCategoriesController` (`app-api/src/modules/armor-categories/armor-categories.controller.ts`),
  bloqueando escrita (embora o controller só exponha `GET`, mesmo critério defensivo já
  usado nas demais tabelas auxiliares). `ArmorsController` manteve
  `@GoogleAccess('read-only')` inalterado no controller inteiro.
- **`total`/`totalPages` de `GET /armors`**: `ArmorsService.findAllPaginated` aplica o
  filtro `name` (quando informado) via `andWhere` antes de `getManyAndCount()`, então
  `total`/`totalPages` refletem o conjunto já filtrado, mesma estratégia de duas consultas
  (ids paginados + fetch completo por id) já usada em `WeaponsService`/`TraitsService`.
- **Migrations**: as 4 novas (`1784306680000` a `1784306710000`) seguem a ordem de
  dependência correta (tabela `armor_categories` antes da FK que a referencia em `armors`,
  `armors`/`traits` já existentes antes de `armor_traits`). Nomes de constraint/índice
  seguem a convenção `PK_<tabela>_id`/`FK_<tabela>_<coluna>`/`IDX_<tabela>_<coluna(s)>` já
  usada no restante do diretório (comparado com `CreateSizeGradesTable`,
  `CreateWeaponTraitsTable`, `AddWeaponPropertiesToWeaponsTable`). Cada `down()` reverte
  exatamente o que o `up()` correspondente criou, na ordem inversa (FK antes das colunas em
  `AddArmorPropertiesToArmorsTable`, colunas na ordem inversa da criação). Nenhum tipo enum
  Postgres novo foi criado, consistente com a decisão de design (nenhum campo novo de
  `Armor` é um enum fixo). Confirmado que as 4 migrations não constam como executadas nesta
  revisão de código — a execução (`npm run migration:run`) é pendência manual do usuário,
  fora do escopo desta revisão, e não é reportada como problema.
- **Mensagens de erro em pt-BR**: `NotFoundException`/`ConflictException` em
  `ArmorsService` seguem o mesmo padrão de mensagens em português já usado no restante do
  projeto (ex.: "Categoria de armadura não encontrada.", "Um ou mais traços não foram
  encontrados.", "Já existe uma armadura com este nome.").
- **Escopo**: nenhuma paginação foi adicionada ao endpoint auxiliar
  `GET /armor-categories`, nenhum filtro novo foi introduzido em `GET /armors`
  (`FindArmorsQueryDto` permanece com apenas `name`/`page`/`perPage`), e o nível de acesso
  Google de `ArmorsController` permanece inalterado (`read-only`, já existente antes desta
  demanda). Nenhuma alteração indevida foi feita em `search`/`traits` (confirmado por busca
  textual — nenhuma referência a "armor" nos arquivos do módulo `traits`, e
  `SearchService`/`SearchModule` seguem referenciando `Armor` exatamente como antes).
- **Documentação Swagger**: `@ApiTags`/`@ApiOperation`/`@ApiOkResponse` presentes em
  `ArmorCategoriesController`; `@ApiProperty`/`@ApiPropertyOptional` com `example` completos
  em `ArmorCategoryResponseDto` e nos 8 campos novos de `CreateArmorDto`/`ArmorResponseDto`/
  `ArmorListItemResponseDto`, incluindo descrição do limite de 1 casa decimal para
  `volume`/`speedPenaltyMeters` e do mínimo exigido de cada campo inteiro
  (`armorClassBonus`/`strength` mínimo 0; `dexterityModifierLimit`/`checkPenalty` mínimo 1).
  `@ApiNotFoundResponse`/`@ApiBadRequestResponse` de `POST`/`PUT /armors/:id` em
  `ArmorsController` mencionam categoria de armadura e traços não encontrados, e os novos
  critérios numéricos de validação.

Arquivos revisados: app-api/src/modules/armor-categories/entities/armor-category.entity.ts,
app-api/src/modules/armor-categories/dto/armor-category-response.dto.ts,
app-api/src/modules/armor-categories/armor-categories.service.ts,
app-api/src/modules/armor-categories/armor-categories.controller.ts,
app-api/src/modules/armor-categories/armor-categories.module.ts,
app-api/src/modules/armors/entities/armor.entity.ts,
app-api/src/modules/armors/entities/armor-trait.entity.ts,
app-api/src/modules/armors/entities/armor-tag.entity.ts (referência),
app-api/src/modules/armors/dto/create-armor.dto.ts,
app-api/src/modules/armors/dto/update-armor.dto.ts,
app-api/src/modules/armors/dto/armor-response.dto.ts,
app-api/src/modules/armors/dto/armor-list-item-response.dto.ts,
app-api/src/modules/armors/dto/find-armors-query.dto.ts,
app-api/src/modules/armors/dto/paginated-armors-response.dto.ts,
app-api/src/modules/armors/armors.service.ts,
app-api/src/modules/armors/armors.module.ts,
app-api/src/modules/armors/armors.controller.ts,
app-api/src/common/transformers/decimal.transformer.ts (referência, reaproveitado sem
alteração), app-api/src/modules/weapons/entities/weapon-trait.entity.ts (referência),
app-api/src/database/migrations/1784306620000-CreateSizeGradesTable.ts (referência),
app-api/src/database/migrations/1784306660000-AddWeaponPropertiesToWeaponsTable.ts
(referência), app-api/src/database/migrations/1784306670000-CreateWeaponTraitsTable.ts
(referência), app-api/src/database/migrations/1784306680000-CreateArmorCategoriesTable.ts,
app-api/src/database/migrations/1784306690000-SeedArmorCategoriesTable.ts,
app-api/src/database/migrations/1784306700000-AddArmorPropertiesToArmorsTable.ts,
app-api/src/database/migrations/1784306710000-CreateArmorTraitsTable.ts,
app-api/src/modules/search/search.service.ts (referência, confirmado inalterado), e
app-api/src/app.module.ts (registro de `ArmorCategoriesModule`).
