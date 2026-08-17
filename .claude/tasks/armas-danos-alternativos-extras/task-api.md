# Task API: Danos Alternativos e Danos Extras em Armas

## Contexto
Ver .claude/tasks/armas-danos-alternativos-extras/spec.md (se existir)

**Não existe `spec.md` para esta demanda** — o requisito completo foi descrito diretamente
pelo solicitante da task, incluindo a decisão de modelagem (entidades filhas, não JSON) e o
precedente a seguir (`families` com `members`/`relationships`, `locations` com `sections`).
Este plano é construído com base direta nesse pedido e na investigação do código atual de
`app-api/src/modules/weapons/**`, `app-api/src/modules/families/**` e
`app-api/src/modules/locations/**`. Pontos que não foram explicitamente resolvidos pelo
pedido estão sinalizados como tal ao longo do documento, em vez de assumidos silenciosamente.

Investigação de código feita em: `app-api/src/modules/weapons/entities/weapon.entity.ts`
(campos de dano principal, linhas 76-108), `app-api/src/modules/weapons/dto/create-weapon.dto.ts`,
`update-weapon.dto.ts`, `weapon-response.dto.ts`, `weapon-list-item-response.dto.ts`,
`app-api/src/modules/weapons/weapons.service.ts`, `weapons.controller.ts`, `weapons.module.ts`,
`app-api/src/modules/weapons/enums/weapon-damage-die.enum.ts`,
`app-api/src/modules/families/entities/family.entity.ts` + `family-member.entity.ts`
(padrão `OneToMany` com `cascade: true, orphanedRowAction: 'delete'` + `ManyToOne` com
`onDelete: 'CASCADE'`), `app-api/src/modules/locations/entities/location-section.entity.ts`,
`dto/location-section-input.dto.ts`, `dto/location-section-response.dto.ts`,
`locations.service.ts` (padrão `buildSections`, carga ordenada via `relations` + sort em
`fromEntity`, e o cuidado necessário no `update` ao substituir a lista inteira — ver seção
Migration/Controller abaixo) e a migration mais recente do repositório,
`app-api/src/database/migrations/1784306720000-AddShieldPropertiesToShieldsTable.ts`
(referência de timestamp para a nova migration).

## Etapas

### 1. api-dev

#### Entidade

**Duas novas entidades filhas independentes**, mesma decisão de modelagem já usada em
`Family` (`members` + `relationships`) e em `Location` (`sections`): entidades com FK para a
arma, não campo JSON.

- **`WeaponAlternativeDamage`** — nova entidade em
  `app-api/src/modules/weapons/entities/weapon-alternative-damage.entity.ts`, estendendo
  `BaseEntity` (herda `id`, `createdAt`, `updatedAt`), mapeada para a tabela
  `weapon_alternative_damages`.
- **`WeaponExtraDamage`** — nova entidade em
  `app-api/src/modules/weapons/entities/weapon-extra-damage.entity.ts`, estendendo
  `BaseEntity`, mapeada para a tabela `weapon_extra_damages`.

Ambas têm **exatamente os mesmos 7 campos** do dano principal de `Weapon`
(linhas 76-108 de `weapon.entity.ts`), replicados com os mesmos tipos/nomes de coluna, mais
uma coluna `order` para preservar a ordem de inserção (mesmo papel de
`LocationSection.order`):

- `damageValue` (`number | null`, `@Column({ type: 'int', name: 'damage_value', nullable: true })`).
- `damageDie` (`WeaponDamageDie | null`, `@Column({ type: 'enum', enum: WeaponDamageDie, name: 'damage_die', nullable: true })` — reaproveita o enum já existente em `app-api/src/modules/weapons/enums/weapon-damage-die.enum.ts`, sem alteração nele).
- `damageType` (`DamageType | null`, `@ManyToOne(() => DamageType, { nullable: true })` + `@JoinColumn({ name: 'damage_type_id' })`).
- `magicalDamage` (`boolean`, `@Column({ type: 'boolean', name: 'magical_damage', default: false })`).
- `distanceMeters` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1, name: 'distance_meters', nullable: true, transformer: DecimalTransformer })` — reaproveita `DecimalTransformer` de `app-api/src/common/transformers/decimal.transformer.ts` sem alteração).
- `reloadActions` (`number | null`, `@Column({ type: 'int', name: 'reload_actions', nullable: true })`).
- `usesAmmunition` (`boolean`, `@Column({ type: 'boolean', name: 'uses_ammunition', default: false })`).
- `order` (`number`, `@Column({ type: 'int' })` — preenchida pelo backend a partir da posição
  no array recebido, não é um campo editável pelo cliente; mesma convenção de
  `LocationSection.order`).
- `weapon` (`Weapon`, `@ManyToOne(() => Weapon, (weapon) => weapon.alternativeDamages` /
  `.extraDamages, { onDelete: 'CASCADE' })` + `@JoinColumn({ name: 'weapon_id' })` — FK
  obrigatória para a arma dona do item).

Os dois `@Column` de enum vão gerar dois tipos Postgres próprios (um por tabela, ex.
`weapon_alternative_damages_damage_die_enum` e `weapon_extra_damages_damage_die_enum`),
seguindo o comportamento padrão do TypeORM — mesmo padrão implícito já usado quando o
projeto tem o mesmo enum TS mapeado em mais de uma coluna/tabela.

**Alteração em `Weapon`** (`app-api/src/modules/weapons/entities/weapon.entity.ts`) — nenhum
campo de dano principal existente é alterado, apenas dois novos relacionamentos adicionados
ao final da classe:

```
@ApiProperty({ type: () => [WeaponAlternativeDamage], description: 'Danos alternativos da arma' })
@OneToMany(() => WeaponAlternativeDamage, (damage) => damage.weapon, { cascade: true, orphanedRowAction: 'delete' })
alternativeDamages!: WeaponAlternativeDamage[];

@ApiProperty({ type: () => [WeaponExtraDamage], description: 'Danos extras da arma' })
@OneToMany(() => WeaponExtraDamage, (damage) => damage.weapon, { cascade: true, orphanedRowAction: 'delete' })
extraDamages!: WeaponExtraDamage[];
```

(estilo ilustrativo — o código real é escrito pelo `api-dev`, não por este plano).

Relacionamentos: `WeaponAlternativeDamage N:1 Weapon` (FK `weapon_id`, obrigatória,
`ON DELETE CASCADE`), `WeaponExtraDamage N:1 Weapon` (idem), `Weapon 1:N WeaponAlternativeDamage`,
`Weapon 1:N WeaponExtraDamage` — duas listas independentes, cada uma com seu próprio cascade,
exatamente como `members`/`relationships` em `Family`. Cada item de dano alternativo/extra
também referencia opcionalmente um `DamageType` (mesma FK `damage_type_id` já usada no dano
principal da arma), sem relação nova a criar em `DamageType`.

#### Migration

Necessária: sim — duas migrations novas (uma tabela por migration, mesmo padrão usado para
`family_members`/`family_relationships`: `1784305660000-CreateFamilyMembersTable.ts` e
`1784305670000-CreateFamilyRelationshipsTable.ts`), após
`1784306720000-AddShieldPropertiesToShieldsTable.ts` (timestamp mais recente hoje no
diretório `app-api/src/database/migrations/`):

- `1784306730000-CreateWeaponAlternativeDamagesTable.ts` — cria a tabela
  `weapon_alternative_damages` com: `id` (uuid, PK, default `gen_random_uuid()`, extensão
  `pgcrypto` já habilitada no projeto), `created_at`/`updated_at` (padrão `BaseEntity`),
  `damage_value` (integer, nullable), `damage_die` (novo enum Postgres próprio da tabela,
  nullable), `damage_type_id` (uuid, nullable), `magical_damage` (boolean NOT NULL DEFAULT
  false), `distance_meters` (numeric(4,1), nullable), `reload_actions` (integer, nullable),
  `uses_ammunition` (boolean NOT NULL DEFAULT false), `order` (integer NOT NULL), `weapon_id`
  (uuid NOT NULL). Índice em `weapon_id` (mesmo padrão de `IDX_location_sections_location_id`)
  e duas FKs: `weapon_id` → `weapons(id)` `ON DELETE CASCADE ON UPDATE NO ACTION`,
  `damage_type_id` → `damage_types(id)` `ON DELETE NO ACTION ON UPDATE NO ACTION` (mesma regra
  já usada pela FK equivalente em `weapons.damage_type_id`, ver
  `1784306660000-AddWeaponPropertiesToWeaponsTable.ts`). `down()` reverte na ordem inversa:
  drop das duas FKs, drop do índice, drop da tabela, drop do tipo enum.
- `1784306740000-CreateWeaponExtraDamagesTable.ts` — estrutura idêntica, tabela
  `weapon_extra_damages`, mesmas colunas/índice/FKs (`weapon_id` → `weapons(id)` `ON DELETE
  CASCADE`, `damage_type_id` → `damage_types(id)`), enum Postgres próprio dessa tabela.

Gerar as migrations via `npm run migration:generate -- src/database/migrations/<Nome>` depois
de as entidades `WeaponAlternativeDamage`/`WeaponExtraDamage` estarem criadas e o
relacionamento em `Weapon` adicionado (`autoLoadEntities: true` detecta as novas entidades
automaticamente) e revisar o SQL gerado, conferindo nomes de coluna em snake_case, os dois
enums Postgres, os índices e as duas FKs por tabela. **As migrations devem ser criadas mas
NÃO executadas** — `synchronize: false` está ativo; o usuário roda `npm run migration:run`
manualmente após revisar o SQL gerado. Nenhuma etapa deste plano inclui rodar a migration
contra o banco.

#### Controller

**Nenhum endpoint novo.** As duas listas são geridas de forma aninhada através dos endpoints
já existentes de `Weapon` (`POST /weapons`, `PUT /weapons/:id`, `GET /weapons/:id`), sem
rotas próprias de CRUD para dano alternativo/extra — mesmo critério já usado para
`LocationSection` (seções geridas apenas via `Location`).

**DTOs:**

- **Novo DTO reutilizável** `WeaponDamageInputDto`
  (`app-api/src/modules/weapons/dto/weapon-damage-input.dto.ts`), usado dentro de **ambos**
  os arrays de `CreateWeaponDto`. Espelha exatamente os validadores já usados para o dano
  principal em `CreateWeaponDto` (linhas 141-202):
  - `damageValue?: number` — `@IsOptional() @IsInt() @Min(0)`, mesmas mensagens pt-BR já
    usadas ("O valor do dano deve ser um número inteiro." / "O valor do dano não pode ser
    negativo.").
  - `damageDie?: WeaponDamageDie` — `@IsOptional() @IsEnum(WeaponDamageDie)`.
  - `damageTypeId?: string` — `@IsOptional() @IsUUID('4')`.
  - `magicalDamage?: boolean` — `@IsOptional() @IsBoolean()`.
  - `distanceMeters?: number` — `@IsOptional() @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`,
    mesma mensagem pt-BR já usada.
  - `usesAmmunition?: boolean` — `@IsOptional() @IsBoolean()`.
  - `reloadActions?: number` — `@IsOptional() @IsInt() @Min(0)`, mesma mensagem pt-BR já
    usada.
  - Todos os `@ApiPropertyOptional` com `example` seguindo os mesmos valores de exemplo já
    usados nos campos equivalentes de `CreateWeaponDto`.

- `CreateWeaponDto` (`app-api/src/modules/weapons/dto/create-weapon.dto.ts`) ganha dois
  campos novos, ambos opcionais, ao final da classe:
  - `alternativeDamages?: WeaponDamageInputDto[]` —
    `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => WeaponDamageInputDto)`
    + `@ApiPropertyOptional({ type: () => [WeaponDamageInputDto], description: 'Danos alternativos da arma, na ordem de inserção preservada' })`.
  - `extraDamages?: WeaponDamageInputDto[]` — mesmos decorators, descrição equivalente para
    "Danos extras da arma, na ordem de inserção preservada".
  - A ordem de criação de cada lista é a ordem dos itens no respectivo array (o serviço
    atribui `order` sequencialmente ao persistir, mesma convenção de `LocationSection`).

- `UpdateWeaponDto` (`app-api/src/modules/weapons/dto/update-weapon.dto.ts`) já estende
  `PartialType(CreateWeaponDto)` — herda `alternativeDamages`/`extraDamages` automaticamente
  como opcionais, sem alteração adicional de arquivo. O serviço deve tratar
  `dto.alternativeDamages !== undefined` e `dto.extraDamages !== undefined`
  **independentemente um do outro** como "substituir integralmente aquela lista" (a lista não
  mencionada no `PUT` permanece intocada) — mesma semântica já usada para `sections` em
  `LocationsService`, já que não existe (nem foi pedida) uma operação de "editar item
  existente" isolado, apenas substituição integral da lista via novo array.

- **Novo DTO de resposta** `WeaponDamageResponseDto`
  (`app-api/src/modules/weapons/dto/weapon-damage-response.dto.ts`), reutilizado para os
  itens de **ambas** as listas na resposta (`WeaponAlternativeDamage` e `WeaponExtraDamage`
  têm o mesmo formato de campos, então um único DTO de resposta serve para os dois — o método
  `fromEntity` aceita `WeaponAlternativeDamage | WeaponExtraDamage`):
  - `id`, `damageValue`, `damageDie`, `damageType` (`DamageTypeResponseDto | null`, mesma
    convenção do dano principal em `WeaponResponseDto`), `magicalDamage`, `distanceMeters`,
    `usesAmmunition`, `reloadActions`, `order` (exposto por consistência com
    `LocationSectionResponseDto.order`, ainda que a posição no array já implique a ordem).
    **Não** inclui `createdAt`/`updatedAt` nem referência de volta a `weapon`, para evitar
    ciclo — mesmo padrão "shallow" de `LocationSectionResponseDto`.

- `WeaponResponseDto` (`app-api/src/modules/weapons/dto/weapon-response.dto.ts`) ganha dois
  campos novos:
  - `alternativeDamages: WeaponDamageResponseDto[]`
  - `extraDamages: WeaponDamageResponseDto[]`
  - Populados em `fromEntity` a partir de `weapon.alternativeDamages`/`weapon.extraDamages`,
    ordenados por `order` ascendente antes de mapear (`.slice().sort((a, b) => a.order - b.order).map(...)`),
    mesmo padrão usado em `LocationResponseDto.fromEntity` para `sections`.

- `WeaponListItemResponseDto`
  (`app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts`) **não** é alterado —
  a listagem paginada não precisa exibir as duas novas listas.
  **Ponto sinalizado (sem `spec.md` para confirmar formalmente):** essa decisão segue
  diretamente a indicação do pedido ("a lista da tela não precisa deles, então
  provavelmente não") e o precedente de `sections`/`traits` internos que também ficam de
  fora de `WeaponListItemResponseDto`/`LocationListItemResponseDto` quando não usados na
  grade de listagem. Se a tela de listagem de armas precisar exibir algum resumo dos danos
  alternativos/extras no futuro, isso é uma decisão de produto fora do escopo já indicado
  aqui e deve ser tratada como uma nova demanda.

**Ajustes em `WeaponsService`** (`app-api/src/modules/weapons/weapons.service.ts`):

- Injetar dois novos repositórios: `WeaponAlternativeDamage` e `WeaponExtraDamage` (via
  `@InjectRepository`).
- `findById`: incluir `alternativeDamages: { damageType: true }` e
  `extraDamages: { damageType: true }` em `relations` (relação aninhada necessária para que
  `damageType` de cada item venha populado, mesmo motivo pelo qual `damageType: true` já é
  carregado para o dano principal da arma). A ordenação em si não é garantida pela opção
  `relations` do TypeORM — deve ser aplicada depois, na `fromEntity` (ver acima), mesmo padrão
  usado por `LocationResponseDto`/`location.sections`.
- `findAllPaginated`: **não** carrega `alternativeDamages`/`extraDamages` (consistente com a
  decisão de não expor essas listas em `WeaponListItemResponseDto`).
- Novo método privado `buildDamageEntries` (ou dois métodos análogos, um para cada
  repositório/entidade, já que são classes TypeORM distintas) que recebe
  `WeaponDamageInputDto[]` e devolve as entidades prontas para cascade save, com:
  - `order` sequencial (índice do array), mesma lógica de `buildSections` em
    `LocationsService`.
  - Resolução de `damageTypeId` → `DamageType` reaproveitando o `damageTypesRepository` já
    injetado no serviço (mesmo repositório usado por `findDamageTypeById`). Para evitar N+1
    queries quando a lista tem vários itens, buscar todos os `damageTypeId` únicos referenciados
    pelos itens da lista em uma única consulta (mesmo padrão de `findTagsByIds`/`findTraitsByIds`)
    e mapear cada item ao seu `DamageType` já carregado; lançar `NotFoundException` em pt-BR
    ("Um ou mais tipos de dano informados nos danos alternativos não foram encontrados." /
    "...nos danos extras não foram encontrados.", mensagens distintas por lista) se algum id
    não existir.
- `create`: quando `dto.alternativeDamages`/`dto.extraDamages` estiverem presentes e não
  vazios, construir as entidades via `buildDamageEntries` e atribuir a
  `weapon.alternativeDamages`/`weapon.extraDamages` antes do `save` (cascade cuida da
  persistência, mesma mecânica de `sections` em `LocationsService.create`); caso contrário,
  `[]`.
- `update`: quando `dto.alternativeDamages !== undefined` (independentemente de
  `dto.extraDamages`), **remover explicitamente os itens antigos da lista antes de
  reatribuir o array novo**, pelo mesmo motivo já documentado em `LocationsService.update`
  (comentário nas linhas 272-279 de `locations.service.ts`): reatribuir a coleção inteira e
  confiar apenas em `cascade` + `orphanedRowAction: 'delete'` falha com violação de not-null,
  porque o TypeORM tenta um `UPDATE` setando `weapon_id = NULL` nas linhas órfãs antes de
  excluí-las. A solução é chamar
  `await this.weaponAlternativeDamagesRepository.remove(weapon.alternativeDamages)` (se houver
  itens) antes de atribuir `weapon.alternativeDamages = dto.alternativeDamages.length > 0 ? await this.buildDamageEntries(...) : []`.
  Tratamento idêntico e **independente** para `extraDamages` com o outro repositório — as duas
  listas podem ser substituídas em chamadas de `PUT` diferentes sem afetar uma à outra.
- `remove`: sem alteração — a FK `weapon_id` com `ON DELETE CASCADE` já garante a limpeza dos
  itens de dano alternativo/extra quando a arma é removida (mesma garantia já existente para
  `weapon_tags`/`weapon_traits` — validar se essas tabelas de junção já têm `ON DELETE CASCADE`
  para `weapon_id` como referência de consistência, mas isso é fora do escopo desta demanda).

**`WeaponsModule`** (`app-api/src/modules/weapons/weapons.module.ts`): registrar
`WeaponAlternativeDamage` e `WeaponExtraDamage` em `TypeOrmModule.forFeature([...])`, junto
das entidades já existentes.

**Acesso Google: inalterado.** `WeaponsController`
(`app-api/src/modules/weapons/weapons.controller.ts`) já usa
`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` no nível do
controller inteiro. Os dois campos novos ampliam apenas o contrato de request/response dos
endpoints já existentes (`POST /weapons`, `PUT /weapons/:id`, `GET /weapons/:id`,
`GET /weapons/:id` embutido em `GET /weapons`) — sem introduzir nenhum endpoint novo, e sem
justificativa para mudar o nível de acesso: armas continuam sendo conteúdo de catálogo, não
um recurso de gerenciamento restrito, mesmo critério já usado para `armors`/`shields`.

Atualizar `@ApiNotFoundResponse`/`@ApiBadRequestResponse` de `POST`/`PUT` em
`WeaponsController` para mencionar também: tipos de dano informados dentro dos arrays de
danos alternativos/extras que não foram encontrados (`404`), e itens inválidos dentro desses
arrays (enum de `damageDie` fora do domínio, `distanceMeters` com mais de 1 casa decimal ou
negativo, valores negativos em `damageValue`/`reloadActions`) como `400`.

- Endpoints: nenhum novo — `POST /weapons`, `GET /weapons`, `GET /weapons/:id`,
  `PUT /weapons/:id`, `DELETE /weapons/:id` (contrato de `POST`/`PUT`/`GET /weapons/:id`
  ampliado; `GET /weapons` e `DELETE /weapons/:id` inalterados).
- DTOs: `WeaponDamageInputDto` (novo), `WeaponDamageResponseDto` (novo), `CreateWeaponDto`
  (campos `alternativeDamages`/`extraDamages`), `UpdateWeaponDto` (herdado via `PartialType`,
  sem alteração direta de arquivo), `WeaponResponseDto` (campos `alternativeDamages`/
  `extraDamages`). `WeaponListItemResponseDto`, `PaginatedWeaponsResponseDto` e
  `FindWeaponsQueryDto` permanecem inalterados.
- Acesso Google: read-only (padrão, já existente — sem alteração).

Status: concluído
Entidade: app-api/src/modules/weapons/entities/weapon-alternative-damage.entity.ts, app-api/src/modules/weapons/entities/weapon-extra-damage.entity.ts (mais alteração em app-api/src/modules/weapons/entities/weapon.entity.ts adicionando os dois relacionamentos `OneToMany`)
Migration: app-api/src/database/migrations/1784306730000-CreateWeaponAlternativeDamagesTable.ts, app-api/src/database/migrations/1784306740000-CreateWeaponExtraDamagesTable.ts (criadas, não executadas — usuário deve rodar `npm run migration:run` manualmente)
Rotas: nenhuma nova — contrato ampliado de POST /weapons, PUT /weapons/:id, GET /weapons/:id (já protegidas por JwtAuthGuard + GoogleAccessGuard read-only, inalterado)
Arquivos: app-api/src/modules/weapons/dto/weapon-damage-input.dto.ts (novo), app-api/src/modules/weapons/dto/weapon-damage-response.dto.ts (novo), app-api/src/modules/weapons/dto/create-weapon.dto.ts (campos alternativeDamages/extraDamages), app-api/src/modules/weapons/dto/weapon-response.dto.ts (campos alternativeDamages/extraDamages), app-api/src/modules/weapons/weapons.service.ts (repositórios injetados, findById com relations aninhadas, buildAlternativeDamageEntries/buildExtraDamageEntries, create/update tratando as duas listas), app-api/src/modules/weapons/weapons.module.ts (registro dos dois novos repositórios em TypeOrmModule.forFeature)
Pendência para api-dev-doc: WeaponsController.ts não foi alterado nesta etapa (nenhum endpoint novo, guards inalterados); a atualização fina de `@ApiNotFoundResponse`/`@ApiBadRequestResponse` de POST/PUT mencionando os novos casos de erro dos danos alternativos/extras (conforme já indicado na seção 2 deste arquivo) ainda precisa ser feita.

### 2. api-dev-doc
- Depende da etapa 1
- Garantir `@ApiProperty`/`@ApiPropertyOptional` completos (com `example`) em
  `WeaponDamageInputDto` e `WeaponDamageResponseDto`, espelhando a documentação já existente
  para os campos equivalentes do dano principal em `CreateWeaponDto`/`WeaponResponseDto`.
- Atualizar as descrições Swagger de `CreateWeaponDto.alternativeDamages`/`.extraDamages` e de
  `WeaponResponseDto.alternativeDamages`/`.extraDamages` deixando claro que são duas listas
  independentes, cada uma com os mesmos 7 campos do dano principal, e que a ordem de resposta
  reflete a ordem de inserção.
- Completar/revisar `@ApiBadRequestResponse`/`@ApiNotFoundResponse` de `POST /weapons` e
  `PUT /weapons/:id` em `WeaponsController` conforme detalhado na etapa 1 (Controller).
- Não é necessária nova tag Swagger — segue em `weapons`. Nenhuma alteração é necessária em
  `WeaponListItemResponseDto`, `PaginatedWeaponsResponseDto` ou `FindWeaponsQueryDto`.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como "Status: concluído"; revisão
feita sobre o trabalho como pronto, não incompleto.

Arquivos lidos e conferidos: `app-api/src/modules/weapons/entities/weapon-alternative-damage.entity.ts`,
`app-api/src/modules/weapons/entities/weapon-extra-damage.entity.ts`,
`app-api/src/modules/weapons/entities/weapon.entity.ts`,
`app-api/src/database/migrations/1784306730000-CreateWeaponAlternativeDamagesTable.ts`,
`app-api/src/database/migrations/1784306740000-CreateWeaponExtraDamagesTable.ts`,
`app-api/src/modules/weapons/dto/weapon-damage-input.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-damage-response.dto.ts`,
`app-api/src/modules/weapons/dto/create-weapon.dto.ts`,
`app-api/src/modules/weapons/dto/update-weapon.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-response.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts` (confirmado sem
alteração, conforme planejado), `app-api/src/modules/weapons/weapons.service.ts`,
`app-api/src/modules/weapons/weapons.controller.ts`,
`app-api/src/modules/weapons/weapons.module.ts`.

Pontos verificados especificamente:
- **Consistência migration ↔ entidade**: as duas migrations novas reproduzem exatamente
  as colunas das entidades (tipos, `snake_case`, `nullable`, `default false` em
  `magical_damage`/`uses_ammunition`, `numeric(4,1)` em `distance_meters`, `order` NOT
  NULL, `weapon_id` NOT NULL por ser `@ManyToOne` sem `nullable: true`, coerente com o
  comportamento padrão do TypeORM já usado em `FamilyMember.family`), os dois enums
  Postgres próprios por tabela têm os mesmos valores de `WeaponDamageDie`, os índices em
  `weapon_id` seguem o padrão `IDX_<tabela>_<coluna>` já usado em
  `IDX_location_sections_location_id`/`IDX_family_members_family_id`, as FKs usam
  `ON DELETE CASCADE` para `weapon_id` e `ON DELETE NO ACTION` para `damage_type_id`
  (idêntico à FK equivalente em `weapons.damage_type_id`,
  `1784306660000-AddWeaponPropertiesToWeaponsTable.ts`), e os nomes de constraint/índice
  seguem a convenção legível já usada em todas as migrations do projeto (não a convenção
  hash padrão do TypeORM, mas consistente com o precedente do repositório). O `down()`
  de ambas reverte na ordem inversa correta (drop das duas FKs, drop do índice, drop da
  tabela, drop do tipo enum).
- **Substituição integral das listas no `update`**: `WeaponsService.update` remove
  explicitamente os itens antigos via `weaponAlternativeDamagesRepository.remove(...)`/
  `weaponExtraDamagesRepository.remove(...)` antes de reatribuir o array novo, evitando o
  problema de violação de not-null do `orphanedRowAction` já documentado e resolvido do
  mesmo jeito em `LocationsService.update` (comparado linha a linha com
  `locations.service.ts:272-285`). Os blocos `if (dto.alternativeDamages !== undefined)` e
  `if (dto.extraDamages !== undefined)` são independentes — substituir uma lista em um
  `PUT` não afeta a outra, e a lista não mencionada permanece intocada.
- **N+1 na resolução de `damageTypeId`**: `buildAlternativeDamageEntries`/
  `buildExtraDamageEntries` chamam `findDamageTypesByIds`, que deduplica os ids
  (`[...new Set(...)]`) e faz uma única consulta `damageTypesRepository.findBy({ id: In(uniqueIds) })`,
  depois mapeia cada item da lista ao `DamageType` já carregado — sem query por item.
  `NotFoundException` é lançada com mensagens distintas por lista
  ("...nos danos alternativos não foram encontrados." / "...nos danos extras não foram
  encontrados."), como especificado na etapa 1.
- **Mensagens de erro em pt-BR**: todas as mensagens novas (`WeaponDamageInputDto`,
  `NotFoundException` de `buildAlternativeDamageEntries`/`buildExtraDamageEntries`) estão
  em português, consistentes com o restante do módulo.
- **DTOs/exposição de dados**: `WeaponDamageResponseDto.fromEntity` não expõe
  `createdAt`/`updatedAt` nem referência de volta a `weapon` (evita ciclo, igual a
  `LocationSectionResponseDto`); `DamageTypeResponseDto.fromEntity` expõe apenas `id`/
  `name`, sem dado sensível. `WeaponResponseDto.fromEntity` ordena as duas listas por
  `order` ascendente antes de mapear, como planejado.
- **Acesso Google**: `WeaponsController` inalterado, continua com
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` no nível do
  controller — coerente com a decisão registrada na etapa 1 (armas são conteúdo de
  catálogo, sem endpoint novo introduzido).
- **Swagger**: `@ApiBadRequestResponse`/`@ApiNotFoundResponse` de `POST /weapons` e
  `PUT /weapons/:id` mencionam corretamente os novos casos de erro dos arrays de danos
  alternativos/extras, e `@ApiProperty`/`@ApiPropertyOptional` de
  `WeaponDamageInputDto`/`WeaponDamageResponseDto` têm `example`/`description` completos.

Aprovado. Nenhum problema encontrado nos arquivos revisados: `weapon-alternative-damage.entity.ts`,
`weapon-extra-damage.entity.ts`, `weapon.entity.ts`,
`1784306730000-CreateWeaponAlternativeDamagesTable.ts`,
`1784306740000-CreateWeaponExtraDamagesTable.ts`, `weapon-damage-input.dto.ts`,
`weapon-damage-response.dto.ts`, `create-weapon.dto.ts`, `update-weapon.dto.ts`,
`weapon-response.dto.ts`, `weapon-list-item-response.dto.ts`, `weapons.service.ts`,
`weapons.controller.ts`, `weapons.module.ts`.
