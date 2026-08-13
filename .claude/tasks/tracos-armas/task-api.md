# Task API: Traços (nova entidade) e alterações em Armas

## Contexto

Não existe `.claude/tasks/tracos-armas/spec.md` para esta demanda — o enunciado recebido
diretamente da orquestração é a fonte de verdade (reproduzido em resumo abaixo) e este
plano foi complementado por inspeção do código já existente em `app-api/src/modules/`,
em especial `weapons/`, `tags/`, `improvement-flaws/`, `currencies/`,
`improvement-flaw-types/`, `proficiency-gradations/`, `families/` (padrão de enum fixo) e
`search/`.

Resumo do escopo:
- **Parte 1** — CRUD completo de uma nova entidade "Traços" (`Trait`): nome (obrigatório,
  único), tipo de traço (opcional, tabela auxiliar Arma/Armadura), tags (opcional,
  reaproveitando o padrão de junção de `tags`), descrição (opcional, `text` nullable).
- **Parte 2** — novos campos opcionais em `Weapon`: apelido, volume (decimal 1 casa),
  grau de tamanho (tabela auxiliar ordenada), mãos ("1"/"2"), estilo de arma
  ("Corpo a Corpo"/"A Distância"), traços (N:N com `Trait`), grupo de dano (valor, dado,
  tipo de dano via tabela auxiliar, dano mágico booleano), distância em metros (decimal 1
  casa), usa munição (booleano), ações de recarga (inteiro).
- Requisitos transversais: migrations para tudo (`synchronize: false`), busca global
  (`search`) passa a indexar Traços, `GoogleAccessGuard` nas rotas de escrita do novo CRUD
  de Traços, nenhuma quebra de contrato em `weapons` (campos novos sempre opcionais e
  nullable).

Nenhuma lacuna de requisito de negócio foi identificada — todas as decisões em aberto no
enunciado eram explicitamente de modelagem técnica (endereçadas abaixo em "Decisões de
design"). Não há pontos de negócio ambíguos a sinalizar.

## Decisões de design

### 1. Tabelas auxiliares vs. enum fixo

Seguindo a orientação explícita do enunciado, os três campos pedidos como Autocomplete
alimentado por tabela auxiliar usam o padrão já estabelecido em `currencies`,
`improvement-flaw-types` e `proficiency-gradations` (entidade própria estendendo
`BaseEntity`, `name` único, DTO de resposta com `static fromEntity`, service `findAll()`
sem paginação, controller `GET` único com `@GoogleAccess('read-only')`, seed via
migration, módulo registrado em `app.module.ts`):

- **Tipo de traço** → nova entidade `TraitType` (módulo `trait-types`), seed `'Arma'`,
  `'Armadura'`.
- **Grau de tamanho** → nova entidade `SizeGrade` (módulo `size-grades`). Diferente de
  `Currency`/`ImprovementFlawType` (que não têm ordem própria), aqui a ordem importa
  (Autocomplete deve listar Minúsculo → Imenso, não alfabeticamente) — segue o precedente
  de `ProficiencyGradation`, que já resolve exatamente esse caso com uma coluna `level`
  inteira e única usada tanto para ordenar quanto para comparar magnitude. Como aqui não
  existe necessidade de comparação de magnitude fora da ordem de exibição (nenhuma regra
  de negócio pede "maior que" entre graus de tamanho nesta demanda), a coluna é nomeada
  `order` (não `level`, para não sugerir uma semântica de comparação que não existe) —
  inteira, `not null`, única, `findAll()` ordena por `order ASC`.
- **Tipo de dano** → nova entidade `DamageType` (módulo `damage-types`), seed
  `'Contundente'`, `'Perfurante'`, `'Cortante'`; sem coluna de ordem (mesma característica
  de `Currency`/`ImprovementFlawType` — a ordem de exibição alfabética por `name ASC` é
  suficiente, não há sequência semântica pedida pelo enunciado como em Grau de tamanho).

Já **Mãos**, **Estilo de Arma** e **Dado** foram pedidos como Select de opções fixas (não
Autocomplete/tabela auxiliar). O projeto já tem precedente direto para exatamente esse
caso — campos de opções fixas e pequenas, sem necessidade de dado adicional por opção nem
de crescer/ser gerenciado via CRUD — modelados como coluna Postgres `enum` gerada a partir
de um TS `enum`, validada no DTO com `@IsEnum` (`FamilyClassification` em
`families.entity.ts`, `FamilyRelationshipType` em `family-relationship.entity.ts`,
`ImprovementFlawCategory` em `improvement-flaw.entity.ts`, `AuthProvider` em
`user.entity.ts`). Os três campos seguem esse mesmo padrão:

- `hands` → `WeaponHands` (`ONE = '1'`, `TWO = '2'`).
- `weaponStyle` → `WeaponStyle` (`MELEE = 'melee'`, `RANGED = 'ranged'`, rotulados no
  Swagger como "Corpo a Corpo"/"A Distância").
- `damageDie` → `WeaponDamageDie` (`D2 = 'd2'`, `D4 = 'd4'`, `D6 = 'd6'`, `D8 = 'd8'`,
  `D10 = 'd10'`, `D12 = 'd12'`, `D20 = 'd20'`, `D100 = 'd100'`).

Justificativa de não usar tabela auxiliar para esses três: diferente de Tipo de
traço/Grau de tamanho/Tipo de dano (que o próprio enunciado já pede explicitamente como
"tabela auxiliar"), estes três são pares/conjuntos fixos e pequenos, sem atributo adicional
por opção (nenhum "bônus" ou vínculo com outra tabela, como em `ProficiencyGradation`), e
o projeto já trata escolhas desse formato como enum de banco, não como tabela CRUD —
manter consistência evita introduzir 3 módulos auxiliares triviais a mais sem necessidade.

### 2. Precisão numérica de Volume e Distância (Metros)

Ambos os campos: coluna `numeric(4,1)` (`type: 'numeric', precision: 4, scale: 1` no
decorator `@Column`), nullable. O projeto não tem hoje nenhuma coluna decimal (todo campo
numérico existente, ex. `price` em `Weapon`, é `integer`), e o driver `pg`/TypeORM retorna
colunas `numeric` como `string` por padrão — sem tratamento, o DTO de resposta devolveria
`"12.5"` em vez de `12.5`. Para não introduzir esse bug, o plano inclui um novo utilitário
compartilhado `app-api/src/common/transformers/decimal.transformer.ts`, exportando um
`ValueTransformer` do TypeORM (`to: (value: number | null) => value`,
`from: (value: string | null) => value === null ? null : parseFloat(value)`), aplicado via
`transformer:` no `@Column` de `volume` e `distanceMeters`. Validação no DTO de entrada:
`@IsNumber({ maxDecimalPlaces: 1 }, { message: '...' })` + `@Min(0)`. `precision: 4` é
suficiente para valores realistas de volume/distância (até `999.9`) sem ficar
artificialmente apertado.

### 3. Relação Arma ↔ Traços

Traços são uma entidade de conteúdo independente com CRUD próprio, referenciada por id
(igual a `Tag`), e **não** um registro de valor por vínculo com campos próprios (`value`/
`type`/`property`) como os itens de `ImprovementFlaw`. Por isso o precedente correto para a
modelagem da relação é `WeaponTag`/`weapon_tags` (join table simples com coluna `order` para
preservar ordem de inserção, `@Unique(['weapon', 'tag'])`, FKs `ON DELETE CASCADE` dos dois
lados), **não** o padrão "exclusive arc" polimórfico de `ImprovementFlaw` — este último
existe para suportar múltiplos tipos de dono (Talento/Treinamento/Característica/
Biografia/Raça) para o mesmo item de melhoria/defeito, cenário que não se aplica aqui:
apenas `Weapon` referencia `Trait` nesta demanda.

Nova entidade de junção dedicada `WeaponTrait` (`weapon_traits`), campo a campo idêntica a
`WeaponTag`: `order` (`int`, default `0`), `weapon` (`ManyToOne`, `onDelete: 'CASCADE'`),
`trait` (`ManyToOne`, `onDelete: 'CASCADE'`), `@Unique(['weapon', 'trait'])`. A ordem dos
cards de Traços na resposta de `Weapon` é preservada da mesma forma que a de Tags: `order
ASC, id ASC` (desempate estável), recriando todas as linhas de junção do zero a cada
`PUT`/`POST` que envie `traitIds` (mesma estratégia "delete + recreate" de
`replaceOrderedTagJunctions`).

O utilitário `common/utils/ordered-tags.util.ts` existente é genérico na *linha de junção*
(`TagJunctionRow`), mas fixo no tipo de alvo (`Tag`), então não pode ser reaproveitado
literalmente para `Trait` sem alteração. Como hoje **apenas** `Weapon` referencia `Traits`
(diferente de `Tag`, referenciado por 24+ módulos, o que motivou extrair o utilitário
genérico), a decisão é **não** criar um utilitário genérico equivalente para Traços agora
(evitar abstração prematura) — as 4 operações (carregar ordenado, criar junções ordenadas,
substituir junções ordenadas) são implementadas diretamente em `WeaponsService`, no mesmo
espírito do que já é feito ali para `tags`, mas inline. Se uma futura demanda passar a
referenciar `Trait` a partir de outra entidade, aí sim vale extrair um utilitário genérico
análogo a `ordered-tags.util.ts`.

### 4. Filtro `traitTypeId` em `GET /traits` (server-side)

O plano de frontend (`.claude/tasks/tracos-armas/task-web.md`, decisão de design nº 3)
sinalizou que o modal de "adicionar Traços" em Armas precisa listar apenas os Traços cujo
tipo de traço seja "Arma". Sem um filtro server-side por `traitTypeId`, o front seria
obrigado a baixar todos os traços (potencialmente todas as páginas) e filtrar/paginar no
cliente — o que quebra a paginação real (`total`/`totalPages` deixariam de refletir o
conjunto exibido) e ainda obrigaria o frontend a hardcodar o nome de seed `'Arma'` para
identificar o tipo, em vez de apenas repassar o id já resolvido de `GET /trait-types`.

Por isso `FindTraitsQueryDto` ganha um filtro opcional `traitTypeId`, combinável com `name`
via `andWhere` no mesmo `queryBuilder` (mesmo princípio de composição de filtros já usado
nos demais `Find*QueryDto` do projeto, ainda que nenhum módulo existente combine hoje um
filtro por FK com o filtro de `name` — este é o primeiro precedente desse padrão
combinado). `TraitsService.findAllPaginated` aplica o filtro antes de `getManyAndCount`,
garantindo que `total`/`totalPages` reflitam apenas o conjunto já filtrado por tipo (e por
nome, quando ambos os filtros forem enviados).

## Etapas

### 1. api-dev

Status: concluído
Entidade: app-api/src/modules/traits/entities/trait.entity.ts (+ trait-tag.entity.ts,
  app-api/src/modules/trait-types/entities/trait-type.entity.ts,
  app-api/src/modules/size-grades/entities/size-grade.entity.ts,
  app-api/src/modules/damage-types/entities/damage-type.entity.ts,
  app-api/src/modules/weapons/entities/weapon-trait.entity.ts; alterações em
  app-api/src/modules/weapons/entities/weapon.entity.ts)
Migration: app-api/src/database/migrations/1784306580000-CreateTraitTypesTable.ts,
  1784306590000-SeedTraitTypesTable.ts, 1784306600000-CreateTraitsTable.ts,
  1784306610000-CreateTraitTagsTable.ts, 1784306620000-CreateSizeGradesTable.ts,
  1784306630000-SeedSizeGradesTable.ts, 1784306640000-CreateDamageTypesTable.ts,
  1784306650000-SeedDamageTypesTable.ts,
  1784306660000-AddWeaponPropertiesToWeaponsTable.ts,
  1784306670000-CreateWeaponTraitsTable.ts (não executadas no banco — pendente
  `npm run migration:run` mediante confirmação do usuário)
Rotas: GET /trait-types, GET /size-grades, GET /damage-types, POST /traits,
  GET /traits, GET /traits/:id, PUT /traits/:id, DELETE /traits/:id (novas);
  POST /weapons, PUT /weapons/:id, GET /weapons/:id, GET /weapons (contrato
  ampliado, mesmo método/caminho); GET /search (passa a poder retornar
  entityType: 'trait')
Arquivos: DTOs/service/controller/module de trait-types, size-grades,
  damage-types e traits (app-api/src/modules/trait-types/**,
  app-api/src/modules/size-grades/**, app-api/src/modules/damage-types/**,
  app-api/src/modules/traits/**); app-api/src/common/transformers/decimal.transformer.ts;
  app-api/src/modules/weapons/enums/weapon-hands.enum.ts,
  weapon-style.enum.ts, weapon-damage-die.enum.ts;
  app-api/src/modules/weapons/dto/create-weapon.dto.ts (+ update-weapon.dto.ts via
  PartialType), weapon-response.dto.ts, weapon-list-item-response.dto.ts;
  app-api/src/modules/weapons/weapons.service.ts, weapons.module.ts;
  app-api/src/modules/search/enums/linkable-entity-type.enum.ts,
  search.service.ts, search.module.ts; app-api/src/app.module.ts (registro dos
  4 módulos novos)

#### Entidade

**Módulo novo `trait-types` (tabela auxiliar, somente leitura):**
- `TraitType` (`app-api/src/modules/trait-types/entities/trait-type.entity.ts`, tabela
  `trait_types`), estende `BaseEntity`: `name` (`string`, `@Column()`,
  `@Index({ unique: true })`, `@ApiProperty()`). Seed via migration: `'Arma'`, `'Armadura'`.

**Módulo novo `size-grades` (tabela auxiliar, somente leitura):**
- `SizeGrade` (`app-api/src/modules/size-grades/entities/size-grade.entity.ts`, tabela
  `size_grades`), estende `BaseEntity`: `name` (`string`, único); `order` (`int`,
  `@Column({ type: 'int' })`, `@Index({ unique: true })` — ver decisão 1). Seed via
  migration, na ordem exata pedida: `('Minúsculo', 1), ('Pequeno', 2), ('Médio', 3),
  ('Grande', 4), ('Enorme', 5), ('Imenso', 6)`.

**Módulo novo `damage-types` (tabela auxiliar, somente leitura):**
- `DamageType` (`app-api/src/modules/damage-types/entities/damage-type.entity.ts`, tabela
  `damage_types`), estende `BaseEntity`: `name` (`string`, único). Seed via migration:
  `'Contundente'`, `'Perfurante'`, `'Cortante'`.

**Módulo novo `traits` (CRUD completo):**
- `Trait` (`app-api/src/modules/traits/entities/trait.entity.ts`, tabela `traits`),
  estende `BaseEntity`:
  - `name` (`string`, `@Column()`, `@Index({ unique: true })`, `@ApiProperty()`,
    obrigatório).
  - `traitType` (`ManyToOne(() => TraitType, { nullable: true })`,
    `@JoinColumn({ name: 'trait_type_id' })`, sem `onDelete: 'CASCADE'` — default
    `RESTRICT`/`NO ACTION`, mesma justificativa de `Weapon.currency`/demais FKs para
    tabelas de seed: a tabela auxiliar nunca é excluída via API).
  - `description` (`text`, nullable).
  - `tags` (`Tag[]`, não é coluna própria — populada em tempo de leitura a partir da nova
    tabela de junção `TraitTag`, exatamente como `Weapon.tags`).
- `TraitTag` (`app-api/src/modules/traits/entities/trait-tag.entity.ts`, tabela
  `trait_tags`), campo a campo idêntica a `WeaponTag`
  (`app-api/src/modules/weapons/entities/weapon-tag.entity.ts`): `order` (`int`, default
  `0`), `trait` (`ManyToOne(() => Trait, { onDelete: 'CASCADE' })`,
  `@JoinColumn({ name: 'trait_id' })`), `tag` (`ManyToOne(() => Tag, { onDelete: 'CASCADE' })`,
  `@JoinColumn({ name: 'tag_id' })`), `@Unique(['trait', 'tag'])`.
- DTOs (`app-api/src/modules/traits/dto/`), espelhando 1:1 `weapons`/`tags`:
  - `CreateTraitDto`: `name: string` (`@IsString @IsNotEmpty`), `traitTypeId?: string`
    (`@IsOptional @IsUUID('4')`), `description?: string` (`@IsOptional @IsString`),
    `tagIds?: string[]` (`@IsOptional @IsArray @IsUUID('4', { each: true })`, ordem de
    inserção preservada, mesmo contrato de `tagIds` em `CreateWeaponDto`).
  - `UpdateTraitDto`: `PartialType(CreateTraitDto)`.
  - `FindTraitsQueryDto`: `name?: string` (filtro `ILIKE`, opcional) + `traitTypeId?: string`
    (`@IsOptional @IsUUID('4')`, filtro exato pelo id do tipo de traço — ver decisão 4) +
    `page`/`perPage` (mesmo padrão de `FindWeaponsQueryDto`/`FindTagsQueryDto`). Os filtros
    `name` e `traitTypeId` são combináveis entre si (ambos aplicados via `andWhere` no
    mesmo `queryBuilder`, quando presentes).
  - `TraitResponseDto`: `id`, `name`, `traitType: TraitTypeResponseDto | null`,
    `description: string | null`, `tags: TagResponseDto[]`, `createdAt`, `updatedAt`,
    `static fromEntity`.
  - `TraitListItemResponseDto`: `id`, `name`, `traitType`, `tags` (sem `description`,
    mesmo critério de omissão de campos longos usado em `WeaponListItemResponseDto`).
  - `PaginatedTraitsResponseDto`: `data: TraitListItemResponseDto[]`, `total`, `page`,
    `perPage`, `totalPages`.
- DTOs das 3 tabelas auxiliares (mesmo padrão de `CurrencyResponseDto`/
  `ImprovementFlawTypeResponseDto`/`ProficiencyGradationResponseDto`):
  - `app-api/src/modules/trait-types/dto/trait-type-response.dto.ts`
    (`TraitTypeResponseDto`): `id`, `name`, `static fromEntity`.
  - `app-api/src/modules/size-grades/dto/size-grade-response.dto.ts`
    (`SizeGradeResponseDto`): `id`, `name`, `order`, `static fromEntity`.
  - `app-api/src/modules/damage-types/dto/damage-type-response.dto.ts`
    (`DamageTypeResponseDto`): `id`, `name`, `static fromEntity`.
- `TraitsService` (`app-api/src/modules/traits/traits.service.ts`), espelhando
  `WeaponsService`/`TagsService`: `findByName`, `findById` (carrega `traitType` via
  `relations`, tags via junção ordenada), `findTraitTypeById` (`NotFoundException` em
  pt-BR se inválido), `findTagsByIds` (mesma lógica de lote de `WeaponsService`),
  `create`/`update` (conflito de nome → `ConflictException` pt-BR "Já existe um traço com
  este nome."), `findAllPaginated` (`page`/`perPage`, `getManyAndCount`, mesma estratégia
  de 2 consultas de `WeaponsService.findAllPaginated` para evitar duplicar linhas ao
  paginar com junção; aplica `andWhere('trait.name ILIKE :name', ...)` quando `name` for
  informado e `andWhere('trait.trait_type_id = :traitTypeId', ...)` quando `traitTypeId`
  for informado — ambos opcionais e combináveis, ver decisão 4 — antes de `getManyAndCount`,
  garantindo que `total`/`totalPages` reflitam o conjunto já filtrado), `remove`.
- `TraitTypesService`/`SizeGradesService`/`DamageTypesService`: cada um só com `findAll()`
  (mesmo padrão de `CurrenciesService`/`ProficiencyGradationsService`); `SizeGradesService`
  ordena por `order ASC`, os outros dois por `name ASC`.
- Módulos: `TraitsModule` (`TypeOrmModule.forFeature([Trait, TraitTag, Tag, TraitType])`,
  controller + service, `exports: [TraitsService]` — necessário para `WeaponsModule`
  poder validar `traitIds` recebidos), `TraitTypesModule`, `SizeGradesModule`,
  `DamageTypesModule` (cada um só com sua própria entidade). Todos os 4 registrados em
  `app-api/src/app.module.ts`.

**Alterações em `Weapon`** (`app-api/src/modules/weapons/entities/weapon.entity.ts`),
todos os campos novos opcionais/nullable, sem alterar nenhum campo existente:
- `nickname` (`string | null`, `@Column({ type: 'varchar', nullable: true })`).
- `volume` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1,
  nullable: true, transformer: DecimalTransformer })` — ver decisão 2).
- `sizeGrade` (`ManyToOne(() => SizeGrade, { nullable: true })`,
  `@JoinColumn({ name: 'size_grade_id' })`, sem cascade).
- `hands` (`WeaponHands | null`, `@Column({ type: 'enum', enum: WeaponHands,
  nullable: true })`).
- `weaponStyle` (`WeaponStyle | null`, `@Column({ type: 'enum', enum: WeaponStyle,
  name: 'weapon_style', nullable: true })`).
- `traits` (`Trait[]`, não é coluna própria — populada em tempo de leitura a partir da
  nova `WeaponTrait`, mesmo critério de `tags`).
- `damageValue` (`number | null`, `@Column({ type: 'int', name: 'damage_value',
  nullable: true })`).
- `damageDie` (`WeaponDamageDie | null`, `@Column({ type: 'enum', enum: WeaponDamageDie,
  name: 'damage_die', nullable: true })`).
- `damageType` (`ManyToOne(() => DamageType, { nullable: true })`,
  `@JoinColumn({ name: 'damage_type_id' })`, sem cascade).
- `magicalDamage` (`boolean`, `@Column({ type: 'boolean', name: 'magical_damage',
  default: false })` — **não** nullable, sempre tem valor, default `false`).
- `distanceMeters` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1,
  name: 'distance_meters', nullable: true, transformer: DecimalTransformer })`).
- `usesAmmunition` (`boolean`, `@Column({ type: 'boolean', name: 'uses_ammunition',
  default: false })` — não nullable, default `false`).
- `reloadActions` (`number | null`, `@Column({ type: 'int', name: 'reload_actions',
  nullable: true })`).

Novos arquivos de suporte em `weapons`:
- `app-api/src/modules/weapons/entities/weapon-trait.entity.ts` (`WeaponTrait`, ver
  decisão 3).
- `app-api/src/modules/weapons/enums/weapon-hands.enum.ts` (`WeaponHands`),
  `weapon-style.enum.ts` (`WeaponStyle`), `weapon-damage-die.enum.ts`
  (`WeaponDamageDie`) — ver decisão 1.
- `app-api/src/common/transformers/decimal.transformer.ts` (`DecimalTransformer`,
  utilitário novo e compartilhado — ver decisão 2).

`CreateWeaponDto`/`UpdateWeaponDto` (`app-api/src/modules/weapons/dto/create-weapon.dto.ts`)
ganham, todos opcionais:
- `nickname?: string` (`@IsOptional @IsString`).
- `volume?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`).
- `sizeGradeId?: string` (`@IsOptional @IsUUID('4')`).
- `hands?: WeaponHands` (`@IsOptional @IsEnum(WeaponHands)`).
- `weaponStyle?: WeaponStyle` (`@IsOptional @IsEnum(WeaponStyle)`).
- `traitIds?: string[]` (`@IsOptional @IsArray @IsUUID('4', { each: true })`, mesmo
  contrato de `tagIds`, ordem de inserção preservada).
- `damageValue?: number` (`@IsOptional @IsInt @Min(0)`).
- `damageDie?: WeaponDamageDie` (`@IsOptional @IsEnum(WeaponDamageDie)`).
- `damageTypeId?: string` (`@IsOptional @IsUUID('4')`).
- `magicalDamage?: boolean` (`@IsOptional @IsBoolean`, default `false` aplicado no
  service quando ausente, mesmo critério de `isDead` em `CreateCharacterDto`).
- `distanceMeters?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`).
- `usesAmmunition?: boolean` (`@IsOptional @IsBoolean`, default `false`).
- `reloadActions?: number` (`@IsOptional @IsInt @Min(0)`).

`WeaponResponseDto`/`WeaponListItemResponseDto` ganham os campos equivalentes de leitura
(`nickname`, `volume`, `sizeGrade: SizeGradeResponseDto | null`, `hands`, `weaponStyle`,
`traits: TraitResponseDto[]`, `damageValue`, `damageDie`, `damageType: DamageTypeResponseDto
| null`, `magicalDamage`, `distanceMeters`, `usesAmmunition`, `reloadActions`) — `traits`
usa o mesmo `TraitResponseDto` completo do módulo `traits` (não uma versão reduzida), para
que o front renderize os cards de Traço sem round-trip extra, mesmo critério já usado para
`tags` embutir `TagResponseDto` completo. `WeaponListItemResponseDto` também ganha `traits`
(mesmo critério de já incluir `tags` na listagem).

`WeaponsService` ganha:
- Injeção de `Repository<WeaponTrait>`, `Repository<SizeGrade>`, `Repository<DamageType>`,
  `Repository<Trait>` (para validar `traitIds`, mesmo padrão de `findTagsByIds`).
- `findTraitsByIds`, `findSizeGradeById`, `findDamageTypeById` — mesma forma de
  `findTagsByIds`/`findCurrencyById` já existentes (`NotFoundException` em pt-BR quando
  algum id não existe: "Um ou mais traços não foram encontrados.", "Grau de tamanho não
  encontrado.", "Tipo de dano não encontrado.").
- Carregamento/gravação ordenada de `traits` inline (sem utilitário genérico, ver decisão
  3): `loadOrderedTraitsForWeapon`, `createOrderedTraitJunctions`,
  `replaceOrderedTraitJunctions` — mesma lógica de `ordered-tags.util.ts`, mas
  especializada em `WeaponTrait`/`Trait`, chamadas em `create`/`update`/`findById`/
  `findAllPaginated` no mesmo ponto em que `tags` já são tratadas.
- `create`/`update`: aplicam os novos campos seguindo a mesma convenção já usada para os
  campos opcionais existentes (`dto.campo !== undefined` em `update`; `dto.campo ?? null`
  ou `?? false` em `create`, conforme nullable ou boolean com default).

`WeaponsModule` passa a importar também `SizeGrade`, `DamageType`, `WeaponTrait`, `Trait`
no `TypeOrmModule.forFeature([...])` (ou, alternativamente, importar `TraitsModule` e usar
`TraitsService` para validar `traitIds` em vez de injetar `Repository<Trait>` diretamente —
decisão de implementação livre do `api-dev`, desde que não crie import cíclico; `TagsModule`
hoje não é importado por `WeaponsModule`, que usa `Repository<Tag>` direto, então o mesmo
critério — repositório direto — é o caminho mais consistente com o padrão já existente).

**Busca global (`search`):** novo `LinkableEntityType.TRAIT = 'trait'` em
`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`; `SearchModule` passa a
importar `Trait` no `TypeOrmModule.forFeature([...])`; `SearchService` ganha
`@InjectRepository(Trait) private readonly traitsRepository: Repository<Trait>` e uma nova
entrada `{ entityType: LinkableEntityType.TRAIT, repository: this.traitsRepository }` no
array `linkableEntities` — mesmo padrão de `Weapon`/`Tag`, sem filtro adicional de posse
(Traços não são recurso privado). Atualizar a descrição do `@ApiProperty` de `entityType`
em `SearchResultItemResponseDto` para incluir "traço" na lista de tipos.

#### Migration

Necessária: sim — 10 migrations novas, todas após `1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`
(timestamp mais recente hoje no diretório), com timestamps sugeridos incrementais de
10000 em 10000, nesta ordem (tabelas referenciadas antes das FKs que as usam):

1. `1784306580000-CreateTraitTypesTable.ts` — cria `trait_types` (`id`, `created_at`,
   `updated_at`, `name` varchar not null) + índice único em `name`. Mesmo SQL padrão de
   `CreateImprovementFlawTypesTable`.
2. `1784306590000-SeedTraitTypesTable.ts` — `INSERT INTO trait_types (name) VALUES
   ('Arma'), ('Armadura')`; `down()` faz `DELETE ... WHERE name IN (...)`.
3. `1784306600000-CreateTraitsTable.ts` — cria `traits` (`id`, `created_at`,
   `updated_at`, `name` varchar not null, `description` text, `trait_type_id` uuid
   nullable) + índice único em `name` + FK `trait_type_id → trait_types.id` **sem**
   `ON DELETE CASCADE` (default `NO ACTION`) + índice em `trait_type_id`.
4. `1784306610000-CreateTraitTagsTable.ts` — cria `trait_tags` (`id`, `created_at`,
   `updated_at`, `order` integer not null default 0, `trait_id` uuid not null, `tag_id`
   uuid not null) + índice único composto (`trait_id`, `tag_id`) + índices simples em
   `trait_id`/`tag_id` + FKs `ON DELETE CASCADE` para `traits`/`tags`. Mesmo SQL padrão de
   `CreateWeaponTagsTable`.
5. `1784306620000-CreateSizeGradesTable.ts` — cria `size_grades` (`id`, `created_at`,
   `updated_at`, `name` varchar not null, `order` integer not null) + índice único em
   `name` + índice único em `order`. Mesmo padrão de `CreateProficiencyGradationsTable`
   (com `order` no lugar de `level`).
6. `1784306630000-SeedSizeGradesTable.ts` — `INSERT INTO size_grades (name, "order")
   VALUES ('Minúsculo', 1), ('Pequeno', 2), ('Médio', 3), ('Grande', 4), ('Enorme', 5),
   ('Imenso', 6)`; `down()` remove as 6 linhas por nome.
7. `1784306640000-CreateDamageTypesTable.ts` — cria `damage_types` (`id`, `created_at`,
   `updated_at`, `name` varchar not null) + índice único em `name`.
8. `1784306650000-SeedDamageTypesTable.ts` — `INSERT INTO damage_types (name) VALUES
   ('Contundente'), ('Perfurante'), ('Cortante')`; `down()` remove as 3 por nome.
9. `1784306660000-AddWeaponPropertiesToWeaponsTable.ts` — cria os 3 tipos enum Postgres
   novos (`weapons_hands_enum` com `('1', '2')`, `weapons_weapon_style_enum` com
   `('melee', 'ranged')`, `weapons_damage_die_enum` com `('d2', 'd4', 'd6', 'd8', 'd10',
   'd12', 'd20', 'd100')`) e adiciona à tabela `weapons`: `nickname` varchar nullable,
   `volume` numeric(4,1) nullable, `size_grade_id` uuid nullable + FK `→ size_grades.id`
   sem cascade, `hands` `weapons_hands_enum` nullable, `weapon_style`
   `weapons_weapon_style_enum` nullable, `damage_value` integer nullable, `damage_die`
   `weapons_damage_die_enum` nullable, `damage_type_id` uuid nullable + FK
   `→ damage_types.id` sem cascade, `magical_damage` boolean not null default false,
   `distance_meters` numeric(4,1) nullable, `uses_ammunition` boolean not null default
   false, `reload_actions` integer nullable. `down()` remove as colunas/FKs na ordem
   inversa e depois os 3 tipos enum (mesmo padrão de `CreateSheetAbilityExtrasTable`
   para criação/remoção de tipo enum junto da tabela).
10. `1784306670000-CreateWeaponTraitsTable.ts` — cria `weapon_traits` (`id`, `created_at`,
    `updated_at`, `order` integer not null default 0, `weapon_id` uuid not null,
    `trait_id` uuid not null) + índice único composto (`weapon_id`, `trait_id`) + índices
    simples em `weapon_id`/`trait_id` + FKs `ON DELETE CASCADE` para `weapons`/`traits`.
    Mesmo SQL padrão de `CreateWeaponTagsTable`.

Gerar cada migration via `npm run migration:generate -- src/database/migrations/<Nome>`
depois de as entidades estarem declaradas (`autoLoadEntities: true` detecta
`TraitType`/`SizeGrade`/`DamageType`/`Trait`/`TraitTag`/`WeaponTrait` automaticamente, e as
novas colunas de `Weapon`) e revisar o SQL gerado, conferindo que `UNIQUE`/FKs/tipos enum
batem exatamente com o descrito acima (os `INSERT` de seed são sempre escritos manualmente,
como nas demais migrations de seed já existentes). Nenhuma migration adicional é necessária
para o filtro `traitTypeId` de `GET /traits` (decisão 4) — a coluna `trait_type_id` já é
criada pela migration 3 acima; o filtro é implementado apenas em código de aplicação
(`FindTraitsQueryDto` + `TraitsService.findAllPaginated`).

#### Controller

**Três novos endpoints de leitura (tabelas auxiliares, sem paginação)**, mesmo padrão
exato de `CurrenciesController`/`ImprovementFlawTypesController`/
`ProficiencyGradationsController` (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)`,
`@GoogleAccess('read-only')`, sem filtro):
- `GET /trait-types` (`TraitTypesController`) → `TraitTypeResponseDto[]`, ordenado por
  `name ASC`.
- `GET /size-grades` (`SizeGradesController`) → `SizeGradeResponseDto[]`, ordenado por
  `order ASC` (não alfabético — ver decisão 1).
- `GET /damage-types` (`DamageTypesController`) → `DamageTypeResponseDto[]`, ordenado por
  `name ASC`.

**Novo CRUD completo `Traços`** (`TraitsController`, mesmo padrão de
`WeaponsController`/`TagsController`):
- `POST /traits` → `TraitResponseDto`. `@ApiConflictResponse` (nome duplicado),
  `@ApiNotFoundResponse` (tipo de traço ou uma ou mais tags não encontrados),
  `@ApiBadRequestResponse` (dados obrigatórios ausentes/formato inválido).
- `GET /traits` → `PaginatedTraitsResponseDto` (query `name`, `traitTypeId`, `page`,
  `perPage` — `traitTypeId` filtra os traços pelo tipo, ex.: permite ao front listar
  apenas traços de tipo "Arma" no modal de seleção em `weapons`, ver decisão 4).
- `GET /traits/:id` → `TraitResponseDto`. `@ApiNotFoundResponse` (traço não encontrado).
- `PUT /traits/:id` → `TraitResponseDto`. Mesmas respostas de erro de `POST` + traço não
  encontrado.
- `DELETE /traits/:id` → `204 No Content`. `@ApiNotFoundResponse` (traço não encontrado).
- DTOs: `CreateTraitDto`, `UpdateTraitDto`, `FindTraitsQueryDto`, `TraitResponseDto`,
  `TraitListItemResponseDto`, `PaginatedTraitsResponseDto`.
- **Acesso Google: read-only (padrão)** — `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` no controller inteiro, mesmo critério de `WeaponsController`/
  `TagsController`: Traços são conteúdo de catálogo (como Armas/Tags), não um recurso de
  gerenciamento restrito — usuários Google leem livremente e são bloqueados apenas em
  `POST`/`PUT`/`DELETE`. Não há justificativa para `blocked` aqui.

**Endpoints existentes de `weapons` afetados (contrato de request/response, sem mudança de
método/caminho):** `POST /weapons`, `PUT /weapons/:id`, `GET /weapons/:id`, `GET /weapons`
passam a aceitar/retornar os novos campos opcionais descritos em "Entidade". Atualizar
`@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` de `POST`/`PUT` em
`WeaponsController` para mencionar também: grau de tamanho/tipo de dano/um ou mais traços
não encontrados (`404`), e valores de `hands`/`weaponStyle`/`damageDie` fora do enum ou
`volume`/`distanceMeters` com mais de 1 casa decimal ou negativos (`400`). **Acesso Google
de `weapons`: inalterado** — mantém `@GoogleAccess('read-only')` já existente, os campos
novos não mudam o nível de acesso.

**Busca global:** `GET /search` (`SearchController`, inalterado em assinatura) passa a
poder retornar itens com `entityType: 'trait'` — sem mudança de rota/DTO fora do enum
`LinkableEntityType` e da descrição do campo `entityType` em
`SearchResultItemResponseDto`.

### 2. api-dev-doc

Status: concluído

- Depende da etapa 1.
- Cobrir na documentação Swagger:
  - Tags/descrições dos 4 novos controllers: `trait-types`, `size-grades`, `damage-types`
    (`@ApiOperation` indicando lista fixa, mesmo padrão de `currencies`/
    `improvement-flaw-types`) e `traits` (`@ApiOperation` completo por endpoint do CRUD,
    mesmo padrão de `weapons`/`tags`).
  - `@ApiProperty`/`@ApiPropertyOptional` completos (com `example`) em todos os DTOs
    novos: `TraitTypeResponseDto`, `SizeGradeResponseDto`, `DamageTypeResponseDto`,
    `CreateTraitDto`, `UpdateTraitDto`, `FindTraitsQueryDto`, `TraitResponseDto`,
    `TraitListItemResponseDto`, `PaginatedTraitsResponseDto`.
  - Em `FindTraitsQueryDto`, incluir `@ApiPropertyOptional` para `traitTypeId` com
    descrição explícita de que serve para filtrar traços por tipo (ex.: apenas traços
    aplicáveis a Armas ou apenas a Armaduras), citando o formato esperado (UUID do
    `TraitType`, obtido via `GET /trait-types`) — ver decisão 4.
  - `@ApiProperty`/`@ApiPropertyOptional` dos 13 campos novos em `CreateWeaponDto`/
    `WeaponResponseDto`/`WeaponListItemResponseDto`, incluindo `enum:` explícito para
    `hands`/`weaponStyle`/`damageDie` (com rótulos em pt-BR na descrição, ex.: "1 ou 2
    mãos", "Corpo a Corpo ou A Distância") e descrição clara de que `volume`/
    `distanceMeters` aceitam no máximo 1 casa decimal.
  - Atualizar `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse` de
    `POST`/`PUT /weapons/:id` conforme detalhado na etapa 1 (Controller).
  - Atualizar a descrição do `@ApiProperty` de `entityType` em
    `SearchResultItemResponseDto` para incluir "traço" na enumeração de tipos linkáveis.

### 3. api-dev-codereviewer

Status: concluído

- Revisar tudo acima, com atenção especial a:
  - As 3 tabelas auxiliares (`trait_types`, `size_grades`, `damage_types`) realmente
    somente leitura (sem `POST`/`PUT`/`DELETE`), seeds batendo exatamente com os nomes e
    (no caso de `size_grades`) a ordem pedida no enunciado.
  - `size_grades.order` com índice único e `findAll()` ordenando por `order ASC` (não por
    `name`).
  - `DecimalTransformer` realmente aplicado em `volume`/`distanceMeters` — resposta da API
    devolvendo `number`, nunca `string`, para esses dois campos.
  - `WeaponTrait`/`weapon_traits` espelhando fielmente `WeaponTag`/`weapon_tags` (mesma
    coluna `order`, mesmo `@Unique`, mesmas duas FKs `ON DELETE CASCADE`), e a ordem de
    `traits` na resposta de `Weapon` preservada (`order ASC, id ASC`).
  - Todos os 13 campos novos de `Weapon` realmente `nullable`/opcionais no banco e no DTO
    (exceto `magicalDamage`/`usesAmmunition`, que são `not null default false`), e nenhum
    campo existente de `Weapon`/`WeaponResponseDto` alterado ou removido.
  - `traits`/`tags` usando o `ResponseDto` completo (não apenas ids) tanto em
    `WeaponResponseDto` quanto em `WeaponListItemResponseDto`.
  - O filtro `traitTypeId` de `GET /traits` funciona corretamente combinado com `name`
    (ambos aplicados, quando enviados juntos) e com a paginação — em particular, que
    `total`/`totalPages` retornados por `TraitsService.findAllPaginated` reflitam o
    conjunto **já filtrado** (por `traitTypeId` e/ou `name`), nunca o total geral de
    traços cadastrados (ver decisão 4).
  - `LinkableEntityType.TRAIT` presente no `SearchService`/`SearchModule` com o mesmo
    formato de filtro/ordenclusão dos demais tipos de conteúdo público (sem restrição de
    posse, diferente de `CAMPAIGN`/`PLANNED_SESSION`).
  - `GoogleAccessGuard` + `@GoogleAccess('read-only')` presentes em `TraitsController`
    (bloqueando escrita de usuários Google) e nos 3 controllers auxiliares; nível de
    acesso de `WeaponsController` inalterado.
  - Migrations: ordem de criação de tabelas antes das FKs que as referenciam, tipos enum
    Postgres criados e removidos corretamente em `up`/`down`, nomes de constraint/índice
    seguindo a convenção `PK_`/`FK_`/`IDX_` já usada no restante do diretório.
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto.
  - Nenhum código de produção fora do escopo planejado (sem paginação nos 3 endpoints
    auxiliares, sem filtro extra não pedido além de `traitTypeId`, sem alterar o nível de
    acesso Google de `weapons`).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Cobertura da revisão (etapas 1 e 2, ambas concluídas): entidades, migrations, DTOs,
services, controllers, módulos, utilitário compartilhado de decimal e alterações em
`search`, comparados ao CLAUDE.md e às decisões de design registradas acima.

Pontos verificados e confirmados corretos:

- **Tabelas auxiliares somente leitura** (`trait_types`, `size_grades`, `damage_types`):
  `TraitTypesController`/`SizeGradesController`/`DamageTypesController` expõem apenas
  `GET` (sem `POST`/`PUT`/`DELETE`), com `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')`, mesmo padrão exato de `CurrenciesController`. Seeds batem
  com os nomes pedidos: `trait_types` ('Arma', 'Armadura'), `size_grades` ('Minúsculo' a
  'Imenso', ordem 1–6 exatamente como especificado), `damage_types` ('Contundente',
  'Perfurante', 'Cortante').
- **`size_grades.order`**: índice único (`@Index({ unique: true })` na entidade e
  `CREATE UNIQUE INDEX "IDX_size_grades_order"` na migration
  `1784306620000-CreateSizeGradesTable.ts`), `SizeGradesService.findAll()` ordena por
  `{ order: 'ASC' }` (não por `name`).
- **`DecimalTransformer`**: aplicado via `transformer:` no `@Column` de `volume` e
  `distanceMeters` em `app-api/src/modules/weapons/entities/weapon.entity.ts`, com `from`
  convertendo `string | null` → `number | null` via `parseFloat`. `precision: 4, scale: 1`
  consistente entre entidade e migration (`numeric(4,1)`).
- **`WeaponTrait`/`weapon_traits`**
  (`app-api/src/modules/weapons/entities/weapon-trait.entity.ts`): campo a campo idêntica
  a `WeaponTag` (mesma coluna `order` com `default: 0`, mesmo `@Unique(['weapon', 'trait'])`,
  mesmas duas FKs `onDelete: 'CASCADE'`). A migration
  `1784306670000-CreateWeaponTraitsTable.ts` espelha exatamente
  `1784306470000-CreateWeaponTagsTable.ts` (mesma estrutura de índices/constraints). A
  ordem de `traits` é carregada com `order: 'ASC', id: 'ASC'` em
  `WeaponsService.loadOrderedTraitsMap`, mesmo critério de desempate de
  `ordered-tags.util.ts`.
- **13 campos novos de `Weapon`**: todos `nullable`/opcionais na entidade, migration e
  DTOs de entrada (`CreateWeaponDto`, com `@IsOptional` em todos), exceto `magicalDamage`
  e `usesAmmunition` (`not null default false` em entidade e migration, consistente com o
  service aplicando `?? false` em `create`). Nenhum campo pré-existente de `Weapon`/
  `WeaponResponseDto`/`CreateWeaponDto` foi alterado ou removido.
- **`traits`/`tags` em `Weapon`**: tanto `WeaponResponseDto` quanto
  `WeaponListItemResponseDto` usam `TraitResponseDto`/`TagResponseDto` completos (não
  apenas ids), populados via `fromEntity`.
- **Filtro `traitTypeId` em `GET /traits`**: `TraitsService.findAllPaginated` aplica
  `andWhere('trait.trait_type_id = :traitTypeId', ...)` e `andWhere('trait.name ILIKE
  :name', ...)` no mesmo `queryBuilder` antes de `getManyAndCount()`, então ambos os
  filtros (combináveis) e a paginação (`total`/`totalPages`) refletem corretamente o
  conjunto já filtrado — mesma estratégia de duas consultas (ids paginados + fetch
  completo por id) já usada em `WeaponsService.findAllPaginated`.
- **`LinkableEntityType.TRAIT`**: presente no enum, em `SearchModule`
  (`TypeOrmModule.forFeature` inclui `Trait`) e em `SearchService` (`linkableEntities`
  inclui a entrada de `Trait` sem nenhum filtro de posse adicional, ao contrário de
  `CAMPAIGN`/`PLANNED_SESSION`, que são explicitamente excluídos para usuários Google e
  filtrados por `createdBy`/`campaign.createdBy`). `SearchResultItemResponseDto.entityType`
  documenta "traço" na descrição do `@ApiProperty`.
- **`GoogleAccessGuard` + `@GoogleAccess('read-only')`**: presentes em `TraitsController`
  e nos 3 controllers auxiliares (bloqueando `POST`/`PUT`/`DELETE` de usuários Google,
  permitindo `GET`). `WeaponsController` manteve `@GoogleAccess('read-only')` inalterado.
- **Migrations**: as 10 novas seguem a ordem de dependência correta (tabelas base antes
  das FKs que as referenciam), os 3 tipos enum Postgres (`weapons_hands_enum`,
  `weapons_weapon_style_enum`, `weapons_damage_die_enum`) são criados no início do `up()`
  e removidos no fim do `down()` (depois de as colunas serem removidas), mesmo padrão de
  `CreateSheetAbilityExtrasTable`/`CreateFamiliesTable`. Nomes de constraint/índice
  seguem a convenção `PK_<tabela>_id`/`FK_<tabela>_<coluna>`/`IDX_<tabela>_<coluna(s)>`
  já usada no restante do diretório (comparado com `CreateWeaponTagsTable`,
  `CreateProficiencyGradationsTable`). Cada `down()` reverte exatamente o que o `up()`
  correspondente criou, na ordem inversa.
- **Mensagens de erro em pt-BR**: `NotFoundException`/`ConflictException`/
  `BadRequestException` (via `class-validator`) em `TraitsService`/`WeaponsService`
  seguem o mesmo padrão de mensagens em português já usado no restante do projeto (ex.:
  "Já existe um traço com este nome.", "Grau de tamanho não encontrado.", "Tipo de dano
  não encontrado.", "Um ou mais traços não foram encontrados.").
- **Escopo**: nenhuma paginação foi adicionada aos 3 endpoints auxiliares
  (`trait-types`/`size-grades`/`damage-types`), nenhum filtro além de `name`/`traitTypeId`
  foi introduzido em `GET /traits`, e o nível de acesso Google de `WeaponsController`
  permanece inalterado (`read-only`, já existente antes desta demanda).

Arquivos revisados: app-api/src/modules/traits/entities/trait.entity.ts,
app-api/src/modules/traits/entities/trait-tag.entity.ts,
app-api/src/modules/trait-types/entities/trait-type.entity.ts,
app-api/src/modules/size-grades/entities/size-grade.entity.ts,
app-api/src/modules/damage-types/entities/damage-type.entity.ts,
app-api/src/modules/weapons/entities/weapon-trait.entity.ts,
app-api/src/modules/weapons/entities/weapon.entity.ts,
app-api/src/modules/weapons/entities/weapon-tag.entity.ts (referência),
app-api/src/common/transformers/decimal.transformer.ts,
app-api/src/common/utils/ordered-tags.util.ts (referência),
app-api/src/modules/traits/dto/*.ts, app-api/src/modules/trait-types/dto/*.ts,
app-api/src/modules/size-grades/dto/*.ts, app-api/src/modules/damage-types/dto/*.ts,
app-api/src/modules/weapons/dto/create-weapon.dto.ts,
app-api/src/modules/weapons/dto/update-weapon.dto.ts,
app-api/src/modules/weapons/dto/weapon-response.dto.ts,
app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts,
app-api/src/modules/weapons/dto/find-weapons-query.dto.ts,
app-api/src/modules/weapons/enums/weapon-hands.enum.ts,
app-api/src/modules/weapons/enums/weapon-style.enum.ts,
app-api/src/modules/weapons/enums/weapon-damage-die.enum.ts,
app-api/src/modules/traits/traits.service.ts,
app-api/src/modules/traits/traits.controller.ts,
app-api/src/modules/traits/traits.module.ts,
app-api/src/modules/trait-types/trait-types.{service,controller,module}.ts,
app-api/src/modules/size-grades/size-grades.{service,controller,module}.ts,
app-api/src/modules/damage-types/damage-types.{service,controller,module}.ts,
app-api/src/modules/weapons/weapons.service.ts,
app-api/src/modules/weapons/weapons.controller.ts,
app-api/src/modules/weapons/weapons.module.ts,
app-api/src/modules/search/enums/linkable-entity-type.enum.ts,
app-api/src/modules/search/search.service.ts,
app-api/src/modules/search/search.module.ts,
app-api/src/modules/search/dto/search-result-item-response.dto.ts,
app-api/src/app.module.ts, e as 10 migrations
`1784306580000-CreateTraitTypesTable.ts` a
`1784306670000-CreateWeaponTraitsTable.ts`.
