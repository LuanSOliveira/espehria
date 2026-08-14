# Task API: Filtro por tags (tagIds) na listagem de itens

## Contexto
Não existe `.claude/tasks/filtro-tags-itens/spec.md`. O planejamento foi feito
diretamente a partir do pedido do usuário: adicionar o filtro `tagIds` aos
endpoints `GET` (listagem paginada) dos 8 módulos de itens abaixo, replicando
exatamente o padrão já implementado em `trainings` (e confirmado também em
`talents`/`characteristics`).

Módulos afetados: `weapons`, `armors`, `shields`, `accessories`, `ammunition`,
`materials`, `consumables`, `utilities`.

Nenhuma entidade nova, nenhuma migration e nenhuma mudança de relacionamento
são necessárias — todas as 8 entidades já possuem tabela de junção própria com
tags (`*_tags`), já expostas via `tags` na entidade e já suportadas na criação/
atualização (`tagIds` já existe em `create-*.dto.ts`/`update-*.dto.ts`). O
trabalho é exclusivamente: (1) adicionar `tagIds` ao DTO de query de listagem
de cada módulo e (2) aplicar o filtro AND por tags no método `findAllPaginated`
do respectivo service, incluindo a correção de contagem de total quando há
`groupBy`/`having`.

### Padrão de referência (não copiar sem adaptar os nomes)
- DTO: `app-api/src/modules/trainings/dto/find-trainings-query.dto.ts` — campo
  `tagIds?: string[]` com `@IsOptional() @IsArray() @IsUUID('4', { each: true })`
  e `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, ... })`
  cuja `description` explica a semântica AND e a notação de querystring
  `tagIds[]=uuid1&tagIds[]=uuid2`.
- Service: `app-api/src/modules/trainings/trainings.service.ts`, método
  `findAllPaginated` (linhas ~263-344, filtro de tags em ~284-298 e comentário
  sobre o total em ~300-309). Lógica:
  1. `const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;`
  2. dedupe com `const uniqueTagIds = [...new Set(query.tagIds)];`
  3. `innerJoin('<tabela_juncao>', '<alias>_tag_filter', '<alias>_tag_filter.<fk_coluna> = <alias>.id AND <alias>_tag_filter.tag_id IN (:...tagIds)', { tagIds: uniqueTagIds })`
  4. `.groupBy('<alias>.id').having('COUNT(DISTINCT <alias>_tag_filter.tag_id) = :tagCount', { tagCount: uniqueTagIds.length })`
  5. **Total**: como `getManyAndCount()` não computa corretamente o total quando
     há `groupBy`/`having`, calcular o total separadamente **apenas quando
     `hasTagFilter` for true**, usando `queryBuilder.clone().select('<alias>.id').getRawMany()).length`.
     Sem filtro de tags, manter `getCount()`/`getManyAndCount()` como já está
     hoje em cada módulo (ver particularidade por módulo abaixo).

## Etapas

### 1. api-dev

Status: concluído

Implementado exatamente conforme especificado, replicando o padrão de
`trainings` (`hasTagFilter` + `innerJoin` na tabela de junção real +
`groupBy`/`having` + total bifurcado) nos 8 módulos de itens, sem criar
entidade, migration ou alterar controllers/módulos:

- **weapons**: `tagIds` adicionado a `dto/find-weapons-query.dto.ts`; filtro
  aplicado em `WeaponsService.findAllPaginated` via `weapon_tags`/`weapon_id`,
  alias `weapon`. Confirmado que `loadOrderedTraitsMap` continua sendo
  chamado após a resolução de ids, fora do queryBuilder principal.
- **armors**: `tagIds` adicionado a `dto/find-armors-query.dto.ts`; filtro em
  `ArmorsService.findAllPaginated` via `armor_tags`/`armor_id`, alias
  `armor`. Mesma confirmação sobre `loadOrderedTraitsMap`.
- **shields**: `tagIds` adicionado a `dto/find-shields-query.dto.ts`; filtro
  em `ShieldsService.findAllPaginated` via `shield_tags`/`shield_id`, alias
  `shield`.
- **accessories**: `tagIds` adicionado a `dto/find-accessories-query.dto.ts`;
  filtro em `AccessoriesService.findAllPaginated` via
  `accessory_tags`/`accessory_id`, alias `accessory`.
- **ammunition**: `tagIds` adicionado a `dto/find-ammunition-query.dto.ts`;
  filtro em `AmmunitionService.findAllPaginated` via
  `ammunition_tags`/`ammunition_id`, alias `ammunition`.
- **materials**: `tagIds` adicionado a `dto/find-materials-query.dto.ts`;
  filtro em `MaterialsService.findAllPaginated` via
  `material_tags`/`material_id`, alias `material`.
- **consumables**: `tagIds` adicionado a `dto/find-consumables-query.dto.ts`;
  filtro em `ConsumablesService.findAllPaginated` via
  `consumable_tags`/`consumable_id`, alias `consumable`.
- **utilities**: `tagIds` adicionado a `dto/find-utilities-query.dto.ts`;
  filtro em `UtilitiesService.findAllPaginated` via
  `utility_tags`/`utility_id`, alias `utility`.

Nomes de tabela/coluna de junção conferidos linha a linha contra as
migrations indicadas na tabela da seção (`CreateWeaponTagsTable`,
`CreateArmorTagsTable`, `CreateShieldTagsTable`, `CreateAccessoryTagsTable`,
`CreateAmmunitionTagsTable`, `CreateMaterialTagsTable`,
`CreateConsumableTagsTable`, `CreateUtilityTagsTable`) — todos batem
exatamente com o padrão descrito. Filtro `name` (ILIKE) preservado antes do
filtro de tags em todos os 8 services; dedupe de `tagIds` aplicado antes do
`having`; nenhuma validação de tags inexistentes foi introduzida no filtro de
listagem (segue o padrão de `trainings`); nenhum DTO de create/update, entidade,
controller, module ou migration foi alterado.

#### Entidade
- Não se aplica. Nenhuma entidade nova ou alterada. As 8 entidades de item
  (`Weapon`, `Armor`, `Shield`, `Accessory`, `Ammunition`, `Material`,
  `Consumable`, `Utility`) e suas respectivas tabelas de junção de tags já
  existem e já são usadas em `create`/`update`/`findById`. Nenhum campo,
  relacionamento ou constraint precisa mudar.

#### Migration
- Necessária: não. Não há alteração de schema — apenas de filtro em memória/
  query builder na camada de service. Não gerar nenhuma migration.

#### Controller
- Nenhum endpoint novo é necessário. Os 8 endpoints `GET` de listagem paginada
  já existem e apenas passam a aceitar o parâmetro de query `tagIds[]` (via o
  DTO de query, sem mudança na assinatura do método do controller nem no
  `@ApiOperation`/rota).
- Endpoints afetados (apenas os de listagem): `GET /weapons`, `GET /armors`,
  `GET /shields`, `GET /accessories`, `GET /ammunition`, `GET /materials`,
  `GET /consumables`, `GET /utilities`.
- Acesso Google: **read-only** (padrão, mantido — todos os 8 controllers já
  estão com `@GoogleAccess('read-only')`; não há mudança de acesso, pois o
  filtro é apenas para listagem).

Para cada módulo, adicionar `tagIds` ao respectivo DTO de query e implementar
o filtro no service, conferindo antes o nome real da tabela de junção e da
coluna FK diretamente em `*-tag.entity.ts` (já confirmados abaixo, mas
**revalidar contra a migration correspondente antes de codificar**, pois é a
migration que reflete o schema real aplicado):

| Módulo | DTO de query (já existe) | Entidade de junção / tabela real | Coluna FK | Migration de referência | Alias do queryBuilder | Método a alterar |
|---|---|---|---|---|---|---|
| weapons | `weapons/dto/find-weapons-query.dto.ts` | `WeaponTag` → `weapon_tags` | `weapon_id` | `1784306470000-CreateWeaponTagsTable.ts` (+ `1784306280000-AddOrderToTagJunctionTables.ts`) | `weapon` | `WeaponsService.findAllPaginated` |
| armors | `armors/dto/find-armors-query.dto.ts` | `ArmorTag` → `armor_tags` | `armor_id` | `1784306490000-CreateArmorTagsTable.ts` (+ `1784306280000-...`) | `armor` | `ArmorsService.findAllPaginated` |
| shields | `shields/dto/find-shields-query.dto.ts` | `ShieldTag` → `shield_tags` | `shield_id` | `1784306530000-CreateShieldTagsTable.ts` (+ `1784306280000-...`) | `shield` | `ShieldsService.findAllPaginated` |
| accessories | `accessories/dto/find-accessories-query.dto.ts` | `AccessoryTag` → `accessory_tags` | `accessory_id` | `1784306510000-CreateAccessoryTagsTable.ts` (+ `1784306280000-...`) | `accessory` | `AccessoriesService.findAllPaginated` |
| ammunition | `ammunition/dto/find-ammunition-query.dto.ts` | `AmmunitionTag` → `ammunition_tags` | `ammunition_id` | `1784305780000-CreateAmmunitionTagsTable.ts` (+ `1784306280000-...`) | `ammunition` | `AmmunitionService.findAllPaginated` |
| materials | `materials/dto/find-materials-query.dto.ts` | `MaterialTag` → `material_tags` | `material_id` | `1784305740000-CreateMaterialTagsTable.ts` (+ `1784306280000-...`) | `material` | `MaterialsService.findAllPaginated` |
| consumables | `consumables/dto/find-consumables-query.dto.ts` | `ConsumableTag` → `consumable_tags` | `consumable_id` | `1784305760000-CreateConsumableTagsTable.ts` (+ `1784306280000-...`) | `consumable` | `ConsumablesService.findAllPaginated` |
| utilities | `utilities/dto/find-utilities-query.dto.ts` | `UtilityTag` → `utility_tags` | `utility_id` | `1784305880000-CreateUtilityTagsTable.ts` (+ `1784306280000-...`) | `utility` | `UtilitiesService.findAllPaginated` |

**DTOs de query — todos já existem** (nenhum precisa ser criado do zero).
Todos os 8 hoje têm apenas `name?`, `page?`, `perPage?`. Para cada um,
adicionar o campo `tagIds?: string[]`, seguindo exatamente as decorations e o
texto de `description` do `FindTrainingsQueryDto`, adaptando apenas o
substantivo do item (ex.: "Retorna apenas armas que possuem TODAS as tags
informadas (AND)", "Retorna apenas armaduras que possuem...", etc., em pt-BR).

**Service — mudança idêntica em cada um dos 8 `findAllPaginated`**, seguindo o
bloco de código do padrão de referência (seção acima), com os nomes de
alias/tabela/coluna da tabela por módulo. Pontos de atenção específicos a
validar durante a implementação, um a um:
- Em todos os 8 módulos o `select` atual da query de ids é
  `[<alias>.id, <alias>.name]` e o `orderBy` é `<alias>.name ASC` — isso é
  compatível com `groupBy(<alias>.id)` no Postgres por dependência funcional
  da chave primária (mesmo padrão já usado e validado em `trainings`), então
  não deve haver erro de "column must appear in GROUP BY clause". Ainda assim,
  validar manualmente (rodar a query) após implementar cada módulo.
  - Nos 2 módulos com traits (`weapons`, `armors`), os traits são carregados
    em uma consulta separada (`loadOrderedTraitsMap`) após a resolução dos
    ids, não dentro do mesmo `queryBuilder` da listagem — logo não há
    join/coluna adicional na query principal que possa conflitar com o
    `groupBy` introduzido pelo filtro de tags. Confirmar que isso permanece
    verdadeiro após a alteração.
- Hoje todos os 8 services usam `getManyAndCount()` diretamente (sem
  `hasTagFilter`). Ao introduzir o filtro, replicar a bifurcação de `trainings`:
  quando `hasTagFilter` for `true`, calcular `total` separadamente via
  `queryBuilder.clone().select('<alias>.id').getRawMany()).length` (após
  aplicar `innerJoin`/`groupBy`/`having`, mas antes de `skip`/`take`); quando
  `false`, manter o comportamento atual equivalente (`getCount()` ou o
  `getManyAndCount()` já usado) — não alterar o resultado para quem não filtra
  por tag.
- Preservar o filtro `name` (`ILIKE`) já existente em todos os 8 módulos,
  aplicando-o antes do filtro de tags (mesma ordem de `andWhere`s do padrão de
  `trainings`).
- Reutilizar a validação de tags inexistentes já usada no `create`/`update`
  de cada módulo (`NotFoundException('Uma ou mais tags não foram
  encontradas.')`) **apenas se fizer sentido para o filtro de listagem** — no
  padrão de `trainings`, o filtro de listagem por `tagIds` **não** valida se
  as tags existem (um id inexistente simplesmente não casará com nenhum
  registro, retornando lista vazia); não introduzir validação extra que não
  exista no padrão de referência.
- Não alterar a resposta paginada (`Paginated<X>ResponseDto`) nem os DTOs de
  criação/atualização — o `tagIds` de listagem é um campo novo e isolado no
  DTO de query, sem relação com o `tagIds` já existente em `create-*`/
  `update-*`.

### 2. api-dev-doc

Status: concluído

- Depende da etapa 1.
- Para os 8 módulos, garantir que o novo campo `tagIds` do DTO de query tenha
  `@ApiPropertyOptional` completo (type, format, isArray, description e
  example), de forma que o Swagger em `/docs` exiba corretamente o parâmetro
  como array de UUIDs na listagem de cada recurso (`weapons`, `armors`,
  `shields`, `accessories`, `ammunition`, `materials`, `consumables`,
  `utilities`).
- Não é necessário alterar `@ApiOperation`/`@ApiOkResponse` dos endpoints de
  listagem, já que a rota, o método e o formato de resposta paginada não
  mudam — apenas o Swagger do parâmetro de query novo.
- Revisar se a descrição de cada `tagIds` está em pt-BR e reflete corretamente
  a semântica AND e a notação `tagIds[]=uuid1&tagIds[]=uuid2`, adaptada ao
  substantivo do item de cada módulo (arma, armadura, escudo, acessório, item
  de munição, material, consumível, utilitário).

### 3. api-dev-codereviewer

Status: concluído

- Revisar tudo acima nos 8 módulos, com atenção especial a:
  - Nome correto de tabela/coluna de junção usado no `innerJoin` de cada
    módulo (conferir contra a migration listada na tabela acima).
  - Alias do queryBuilder correto por módulo (não reaproveitar acidentalmente
    o alias de outro módulo por cópia/cola).
  - Cálculo de `total` correto e só bifurcado quando `hasTagFilter` é `true`,
    sem regressão no comportamento de listagem sem filtro de tags.
  - Dedupe de `tagIds` (`[...new Set(...)]`) aplicado antes do `having` com
    `tagCount`.
  - Nenhuma migration, entidade ou controller alterado indevidamente.
  - Mensagens/descrições em pt-BR e consistentes com o padrão de `trainings`.

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" conferidas como "Status: concluído"
antes da revisão, conforme exigido.

Revisão realizada nos 8 módulos (`weapons`, `armors`, `shields`,
`accessories`, `ammunition`, `materials`, `consumables`, `utilities`),
comparando cada `dto/find-*-query.dto.ts` e cada `*.service.ts` (método
`findAllPaginated`) contra o padrão de referência de
`trainings/dto/find-trainings-query.dto.ts` e
`trainings/trainings.service.ts`, e validando nome de tabela/coluna de
junção contra a migration correspondente de cada módulo:

- DTOs de query: os 8 `find-*-query.dto.ts` adicionam `tagIds?: string[]`
  com `@IsOptional() @IsArray() @IsUUID('4', { each: true })` e
  `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, ... })`,
  com `description` em pt-BR explicando a semântica AND e a notação
  `tagIds[]=uuid1&tagIds[]=uuid2`, adaptada corretamente ao substantivo de
  cada item (arma, armadura, escudo, acessório, item de munição, material,
  consumível, utilitário). Campos `name`, `page`, `perPage` preservados sem
  alteração.
- Services: os 8 `findAllPaginated` replicam exatamente a lógica de
  `trainings` — `hasTagFilter = !!query.tagIds && query.tagIds.length > 0`,
  dedupe via `[...new Set(query.tagIds)]`, `innerJoin` na tabela de junção
  real com a condição `<alias>_tag_filter.<fk> = <alias>.id AND
  <alias>_tag_filter.tag_id IN (:...tagIds)`, seguido de
  `groupBy('<alias>.id')` e `having('COUNT(DISTINCT
  <alias>_tag_filter.tag_id) = :tagCount', ...)`. O filtro `name` (ILIKE) é
  aplicado antes do filtro de tags em todos os 8. O `total` é bifurcado
  corretamente: `getCount()` quando `hasTagFilter` é `false` (comportamento
  preservado) e `(await queryBuilder.clone().select('<alias>.id').getRawMany()).length`
  quando `true`, calculado antes de `skip`/`take`.
- Nome de tabela/coluna de junção conferido contra a migration de cada
  módulo — todos batem exatamente:
  - weapons → `weapon_tags` / `weapon_id` (`1784306470000-CreateWeaponTagsTable.ts`)
  - armors → `armor_tags` / `armor_id` (`1784306490000-CreateArmorTagsTable.ts`)
  - shields → `shield_tags` / `shield_id` (`1784306530000-CreateShieldTagsTable.ts`)
  - accessories → `accessory_tags` / `accessory_id` (`1784306510000-CreateAccessoryTagsTable.ts`)
  - ammunition → `ammunition_tags` / `ammunition_id` (`1784305780000-CreateAmmunitionTagsTable.ts`)
  - materials → `material_tags` / `material_id` (`1784305740000-CreateMaterialTagsTable.ts`)
  - consumables → `consumable_tags` / `consumable_id` (`1784305760000-CreateConsumableTagsTable.ts`)
  - utilities → `utility_tags` / `utility_id` (`1784305880000-CreateUtilityTagsTable.ts`)
- Alias do queryBuilder correto e isolado por módulo em todos os 8 (`weapon`,
  `armor`, `shield`, `accessory`, `ammunition`, `material`, `consumable`,
  `utility`) — nenhum reaproveitamento acidental de alias de outro módulo.
- Nos módulos com traits (`weapons`, `armors`), `loadOrderedTraitsMap`
  continua sendo chamado em consulta separada após a resolução dos ids
  (fora do `queryBuilder` principal), sem interferência com o
  `groupBy`/`having` introduzido pelo filtro de tags.
- Nenhuma migration, entidade ou controller foi alterado: `tagIds` não
  aparece em nenhum arquivo de `entities/`, `database/migrations/` ou
  `*.controller.ts` dos 8 módulos — apenas nos DTOs de query e nos services,
  como especificado. Os 8 controllers mantêm
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  inalterados.
- Filtro de listagem por `tagIds` não introduz validação de tags
  inexistentes (consistente com o padrão de `trainings` — um id inexistente
  simplesmente não casa com nenhum registro).
- Mensagens e descrições em pt-BR, consistentes entre os 8 módulos e com o
  padrão de `trainings`.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/weapons/dto/find-weapons-query.dto.ts`,
`app-api/src/modules/weapons/weapons.service.ts`,
`app-api/src/modules/armors/dto/find-armors-query.dto.ts`,
`app-api/src/modules/armors/armors.service.ts`,
`app-api/src/modules/shields/dto/find-shields-query.dto.ts`,
`app-api/src/modules/shields/shields.service.ts`,
`app-api/src/modules/accessories/dto/find-accessories-query.dto.ts`,
`app-api/src/modules/accessories/accessories.service.ts`,
`app-api/src/modules/ammunition/dto/find-ammunition-query.dto.ts`,
`app-api/src/modules/ammunition/ammunition.service.ts`,
`app-api/src/modules/materials/dto/find-materials-query.dto.ts`,
`app-api/src/modules/materials/materials.service.ts`,
`app-api/src/modules/consumables/dto/find-consumables-query.dto.ts`,
`app-api/src/modules/consumables/consumables.service.ts`,
`app-api/src/modules/utilities/dto/find-utilities-query.dto.ts`,
`app-api/src/modules/utilities/utilities.service.ts`.
