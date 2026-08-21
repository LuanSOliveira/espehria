# Task API: Ficha - Inventário (gestão de itens)

## Contexto
Ver .claude/tasks/ficha-inventario-itens/spec.md (escopo confirmado com o usuário).
Contexto adicional (funcionalidade já em produção, não alterar regras já fechadas):
.claude/tasks/ficha-inventario/spec.md e .claude/tasks/ficha-inventario/task-api.md
(criaram `sheets.pc/pp/po/pl` e `sheets.loaded_volume` como `int`).

## Etapas

### 1. api-dev

Esta etapa cobre três frentes independentes de schema (detalhadas abaixo) mais a nova
API de gestão de itens de inventário. Todas devem ser feitas pelo mesmo agente.

#### Entidade

**A. Cinco entidades de catálogo ganham o campo `volume` (hoje só existe em
`Weapon`/`Armor`/`Shield`).**
- Entidades: `Utility` (`app-api/src/modules/utilities/entities/utility.entity.ts`),
  `Consumable` (`.../consumables/entities/consumable.entity.ts`), `Material`
  (`.../materials/entities/material.entity.ts`), `Ammunition`
  (`.../ammunition/entities/ammunition.entity.ts`), `Accessory`
  (`.../accessories/entities/accessory.entity.ts`).
- Campo novo em cada uma: `volume` — `@Column({ type: 'numeric', precision: 4, scale:
  1, nullable: true, transformer: DecimalTransformer })`, `volume!: number | null;`.
  Copiar exatamente o padrão já usado em `Weapon.volume`/`Armor.volume`/
  `Shield.volume` (mesmo `precision`/`scale`, mesmo `DecimalTransformer` de
  `app-api/src/common/transformers/decimal.transformer.ts`, nullable, sem valor
  default).
- Ajustar os DTOs das 5 entidades:
  - `Create*Dto` (ex.: `CreateUtilityDto`): adicionar `volume?: number` com
    `@ApiPropertyOptional`, `@IsOptional()`, `@IsNumber({ maxDecimalPlaces: 1 }, {
    message: 'O volume deve ter no máximo 1 casa decimal.' })`, `@Min(0, { message: 'O
    volume não pode ser negativo.' })` — mesmo padrão de `CreateWeaponDto.volume`.
  - `Update*Dto`: mesmo campo, mesmas validações (padrão `PartialType`/campos
    opcionais já usado nesses módulos).
  - `*ResponseDto`: adicionar `volume: number | null` com `@ApiPropertyOptional`, e
    preencher em `fromEntity`.
  - Serviço de cada módulo (`*.service.ts`, métodos `create`/`update`): atribuir
    `volume` seguindo o mesmo fluxo já usado para os demais campos escalares
    (`price`, etc.) desses serviços.
- Relacionamentos: nenhum novo.

**B. `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`) — alteração de
coluna existente + coluna nova.**
- `loadedVolume` (coluna `loaded_volume`): deixa de ser `@Column({ type: 'int',
  default: 0 })` e passa a ser `@Column({ type: 'numeric', precision: 6, scale: 1,
  default: 0, transformer: DecimalTransformer, name: 'loaded_volume' })`. Usar
  `precision: 6` (mesma lógica de folga que os demais campos decimais do projeto,
  suficiente para comportar itens + moedas sem estourar) — ajustar se o revisor
  considerar outro valor mais adequado, mas manter `scale: 1` (mesma granularidade
  decimal de `volume` nas 8 categorias, já que a soma nunca precisa de mais de 1 casa
  decimal).
- Novo campo `itemsVolume` (coluna `items_volume`): `@Column({ type: 'numeric',
  precision: 6, scale: 1, default: 0, transformer: DecimalTransformer, name:
  'items_volume' })`, `itemsVolume!: number;` — soma do volume vindo dos itens do
  inventário (unitário × quantidade, sem arredondar), recalculada do zero a cada
  adição/remoção de item (nunca por incremento/decremento).
- `pc`, `pp`, `po`, `pl` permanecem `int` (moedas continuam inteiras) — sem alteração.
- Relacionamentos: nenhum novo nesta entidade.

**C. Nova entidade relacional `SheetInventoryItem`
(`app-api/src/modules/sheets/entities/sheet-inventory-item.entity.ts`)** — um card de
item do inventário da ficha, seguindo o padrão de `SheetTrainingSlot`/
`SheetAbilityExtra` (extends `BaseEntity`, sem `@ApiProperty` na entidade — exposição
via DTO próprio, como as demais entidades relacionais do módulo).
- `sheet`: `@ManyToOne(() => Sheet, { nullable: false, onDelete: 'CASCADE' })` +
  `@JoinColumn({ name: 'sheet_id' })`.
- `category`: `@Column({ type: 'enum', enum: SheetInventoryItemCategory, name:
  'category' })` — novo enum `SheetInventoryItemCategory`
  (`app-api/src/modules/sheets/enums/sheet-inventory-item-category.enum.ts`) com um
  valor por módulo de catálogo: `UTILITY`, `CONSUMABLE`, `MATERIAL`, `AMMUNITION`,
  `WEAPON`, `ARMOR`, `ACCESSORY`, `SHIELD` (mesmo espírito de
  `SheetAbilityBucketType`, já existente no módulo).
- `quantity`: `@Column({ type: 'int' })`, `quantity!: number;` — inteiro `>= 1`
  (validado no DTO/serviço, não via `CHECK` de banco, para manter consistência com o
  restante do módulo que valida regra de negócio na camada de serviço).
- `equipped`: `@Column({ type: 'boolean', default: false })`, `equipped!: boolean;` —
  aplicável apenas às categorias `WEAPON`/`ARMOR`/`ACCESSORY`/`SHIELD`; para as demais
  categorias o serviço nunca altera este valor (permanece `false`).
- `unitVolume` (coluna `unit_volume`): `@Column({ type: 'numeric', precision: 4, scale:
  1, default: 0, transformer: DecimalTransformer, name: 'unit_volume' })`,
  `unitVolume!: number;` — volume unitário do item no momento da adição, extraído do
  snapshot (`data.volume`) e persistido também como coluna própria para permitir
  recomputar `items_volume` sem precisar interpretar o formato do jsonb a cada
  cálculo. Decisão de implementação (não é um campo adicional pedido pelo usuário além
  do que o spec já descreve como "volume unitário também persistido no snapshot") —
  sinalizar ao revisor que `unitVolume` é redundante por design com `data.volume`
  (a fonte de verdade para exibição é sempre `data`; `unitVolume` existe só para
  cálculo eficiente).
- `data`: `@Column({ type: 'jsonb' })`, `data!: Record<string, unknown>;` — snapshot
  completo dos campos do item exibidos/editáveis na categoria (nome, imagem,
  descrição, preço + nome/símbolo da moeda copiados, informações privadas, tags
  copiadas por nome/id, volume, e os campos específicos de cada categoria — traços,
  graduação de tamanho, dano, encantamentos/aprimoramentos, etc.), sem qualquer FK
  viva para os registros de catálogo de origem (moeda, traços, tags, tipo de dano
  etc. entram como valor copiado dentro do jsonb, nunca como coluna relacional nesta
  entidade). Tipar como `Record<string, unknown>` na entidade (mesmo nível de
  tipagem frouxa já usado para `SheetKnowledgeSnapshot`/`SheetProficiencySnapshot`
  não se aplica aqui por variar por categoria; se preferir tipagem mais forte, um
  tipo union `SheetInventoryItemSnapshot` discriminado por `category` é aceitável,
  a critério do api-dev).
- Índices/constraints: nenhuma constraint de unicidade a nível de banco para a regra
  de empilhamento — comparar jsonb via índice único é frágil (ordem de chaves,
  normalização). O empilhamento (ver abaixo) é responsabilidade da camada de serviço.
  Não é necessária nenhuma outra constraint além da FK `sheet_id` com `ON DELETE
  CASCADE`.

#### Migration
- Necessária: sim, três migrations (`synchronize: false`), seguindo o padrão dos
  arquivos já existentes em `app-api/src/database/migrations/` (uma classe por
  arquivo, `up`/`down` simétricos, gerados via `npm run migration:generate`):
  1. **Adicionar `volume` às 5 tabelas de catálogo** (`utilities`, `consumables`,
     `materials`, `ammunition`, `accessories`): `ALTER TABLE "<tabela>" ADD "volume"
     numeric(4,1)` para cada uma, no mesmo formato usado em
     `1784306660000-AddWeaponPropertiesToWeaponsTable.ts` para a coluna `volume`
     (nullable, sem default). Pode ser uma única migration cobrindo as 5 tabelas (ex.:
     `AddVolumeToItemCatalogTables`) ou 5 migrations dedicadas — a critério do
     api-dev, desde que `down()` reverta exatamente o que `up()` criou, na ordem
     inversa.
  2. **Alterar `sheets.loaded_volume` de `int` para `numeric` + adicionar
     `sheets.items_volume`.** Atenção especial: `ALTER COLUMN "loaded_volume" TYPE
     numeric(6,1) USING "loaded_volume"::numeric` (conversão explícita necessária —
     um `ALTER TYPE` direto de `integer` para `numeric` falha sem `USING` em alguns
     casos e deve ser testado). Os dados já existentes em produção (valores inteiros)
     são preservados pela conversão. Adicionar `items_volume numeric(6,1) NOT NULL
     DEFAULT 0`. `down()` deve reverter o tipo para `integer` (`USING
     round("loaded_volume")::integer` ou equivalente) e remover `items_volume`.
  3. **Criar a tabela `sheet_inventory_items`**, seguindo o padrão de
     `1784306550000-CreateSheetTrainingSlotsTable.ts`: `CREATE TYPE
     "public"."sheet_inventory_items_category_enum" AS ENUM(...)` com os 8 valores da
     categoria; `CREATE TABLE "sheet_inventory_items" ("id" uuid NOT NULL DEFAULT
     gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at"
     TIMESTAMP NOT NULL DEFAULT now(), "category"
     "public"."sheet_inventory_items_category_enum" NOT NULL, "quantity" integer NOT
     NULL, "equipped" boolean NOT NULL DEFAULT false, "unit_volume" numeric(4,1) NOT
     NULL DEFAULT 0, "data" jsonb NOT NULL, "sheet_id" uuid NOT NULL, CONSTRAINT
     "PK_sheet_inventory_items_id" PRIMARY KEY ("id"))` + `ALTER TABLE
     "sheet_inventory_items" ADD CONSTRAINT "FK_sheet_inventory_items_sheet_id"
     FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE NO
     ACTION`. Sem backfill necessário (tabela nova, sem dados anteriores). `down()`
     remove a FK, a tabela e o enum, nesta ordem.
- Ordem de execução relevante: a migration 3 depende apenas de `sheets` já existir
  (já existe); as migrations 1 e 2 são independentes entre si e da 3, mas devem ter
  timestamps crescentes coerentes com a ordem em que forem geradas.

#### Controller

**Lógica de negócio compartilhada pelos endpoints abaixo (a implementar no
`SheetsService`, reaproveitando o que já existe):**
- Cálculo do Volume Limite (`max(0, modificador de Força + 10)`) reaproveita
  exatamente a mesma fonte já usada para outros cálculos de atributo no serviço:
  `sheet.melhorias`/`sheet.defeitos`, filtrando entradas com `type.name ===
  ATTRIBUTE_TYPE_NAME` (`'Atributo'`, constante já existente em `sheets.service.ts`)
  e `property.name === 'Força'`, somando `value` das melhorias e subtraindo o das
  defeitos, com base 10 (`baseValue = 10 + Σmelhorias − Σdefeitos`), modificador
  `Math.floor((baseValue - 10) / 2)`, limite `Math.max(0, modificador + 10)`. Extrair
  como método privado (ex.: `computeVolumeLimit(sheet: Sheet): number`) para
  reutilizar entre criação/validação de itens.
- `recomputeItemsAndLoadedVolume(sheet)`: soma `quantity * unitVolume` de **todos** os
  `SheetInventoryItem` da ficha (consulta direta ao banco, não acumulação em memória),
  atribui a `sheet.itemsVolume`, e recalcula `sheet.loadedVolume =
  Math.floor((sheet.pc + sheet.pp + sheet.po + sheet.pl) / 1000) + sheet.itemsVolume`
  — sempre a partir da fonte, nunca somando/subtraindo sobre o valor anterior. Chamado
  ao final de toda adição e remoção de item.
- Empilhamento: ao adicionar um item, buscar itens existentes da mesma ficha com a
  mesma `category` e comparar `data` por igualdade profunda (ex.:
  `JSON.stringify` de uma versão normalizada/com chaves ordenadas dos dois objetos,
  ou comparação estrutural campo a campo) — se houver um item idêntico, somar
  `quantity` a ele em vez de criar um novo registro; caso contrário, criar um novo
  `SheetInventoryItem`.
- Resolução do snapshot na adição: se o corpo indicar item existente do catálogo
  (`catalogItemId`), buscar a entidade no repositório do módulo correspondente à
  `category` (reaproveitar os serviços/repositórios dos módulos `utilities`,
  `consumables`, `materials`, `ammunition`, `weapons`, `armors`, `accessories`,
  `shields` — via injeção desses serviços/repositórios no `SheetsModule`, como já é
  feito hoje para `Race`/`Training`/`Talent`/`Characteristic`) e montar `data` a
  partir dela (mapeando também os campos hoje FK — moeda, traços, tipo de dano,
  graduação de tamanho, tags, encantamentos/aprimoramentos — como valores copiados,
  não como referência); se o corpo indicar item avulso (`customData`), validar o
  payload conforme os campos esperados daquela categoria (reaproveitando as mesmas
  regras de validação dos `Create*Dto` de cada categoria, sem persistir nada nos
  módulos de catálogo) e usar o payload validado como `data`. Em ambos os casos,
  `unitVolume = data.volume ?? 0` (ver ponto em aberto abaixo).

**Endpoints novos, todos aninhados em `/sheets/:id/inventory-items`, protegidos por
`@UseGuards(JwtAuthGuard)` (já aplicado a nível de classe no `SheetsController`) e
usando `findAccessibleById(id, currentUser)` para resolver/validar a ficha antes de
qualquer leitura/escrita (mesma regra de acesso de todo o módulo `sheets`):**

- `GET /sheets/:id/inventory-items` — lista os itens de inventário da ficha, com
  contadores por categoria. Query params opcionais: `category` (filtra os itens
  retornados por uma das 8 categorias) e `equippedOnly` (boolean; quando `true`,
  retorna somente itens com `equipped = true`, para alimentar a aba "Equipados" nas 4
  categorias aplicáveis). Os contadores por categoria (`counts`) sempre refletem o
  total de cards por categoria na ficha (não são afetados pelos filtros de
  query — servem para os contadores fixos das sub-abas de "Carregados"). Resposta:
  `SheetInventoryListResponseDto` com `counts: Record<categoria, number>` e `items:
  SheetInventoryItemResponseDto[]`.
- `POST /sheets/:id/inventory-items` — adiciona um item (avulso ou existente).
  Corpo: `AddSheetInventoryItemDto`. Valida volume limite (ver lógica acima) antes de
  persistir; se ultrapassar, rejeita com `ConflictException` (mensagem em pt-BR
  informando que a quantidade solicitada supera o volume limite que a ficha pode
  carregar) e não persiste nada. Aplica empilhamento se aplicável, recomputa
  `itemsVolume`/`loadedVolume`, salva ficha + item em transação. Resposta (201):
  `SheetInventoryMutationResponseDto` — bundle com `sheet: SheetResponseDto`
  (refletindo `itemsVolume`/`loadedVolume` atualizados) e `inventory:
  SheetInventoryListResponseDto` atualizada, no mesmo espírito de
  `SheetAbilitiesMutationResponseDto` já usado no módulo para outras mutações.
- `POST /sheets/:id/inventory-items/:itemId/remove` — remove quantidade parcial ou
  total de um item. Corpo: `RemoveSheetInventoryItemDto { quantity: number }`
  (`@IsInt()`, `@Min(1)`). Valida que `quantity <= item.quantity atual` (senão
  `BadRequestException` em pt-BR); sem validação de volume limite (só a adição é
  restrita). Se `quantity === item.quantity`, remove o registro; caso contrário,
  decrementa `item.quantity`. Recomputa `itemsVolume`/`loadedVolume`. Resposta (200):
  `SheetInventoryMutationResponseDto`.
- `PUT /sheets/:id/inventory-items/:itemId/equip` — marca `equipped = true`.
  `ConflictException` se a categoria do item não for uma das 4 equipáveis
  (Armas/Armaduras/Acessórios/Escudos). Não altera `quantity`/`itemsVolume`/
  `loadedVolume`. Resposta (200): `SheetInventoryMutationResponseDto`.
- `PUT /sheets/:id/inventory-items/:itemId/unequip` — marca `equipped = false`, mesmas
  restrições de categoria do endpoint acima. Resposta (200):
  `SheetInventoryMutationResponseDto`.

**Ponto em aberto (lacuna de requisito, não decidir sozinho):** o spec não define o
que fazer quando o volume unitário do item (do catálogo ou do formulário avulso) está
em branco/nulo — usar `0` na soma (opção assumida acima só como placeholder de
implementação) ou impedir a adição exigindo que o volume seja preenchido nesse
fluxo específico. Da mesma forma, o spec não define se chamar `equip` num item já
equipado (ou `unequip` num item já desequipado) deve ser um erro (`409`) ou uma
operação idempotente sem efeito — o plano acima assume `409` só como comportamento
provisório de implementação, mas ambos os pontos devem ser confirmados antes ou
durante a implementação.

**DTOs:**
- `AddSheetInventoryItemDto` — `category` (enum, obrigatório), `quantity` (int `>=
  1`, obrigatório), e exatamente um entre `catalogItemId` (uuid, item existente do
  catálogo da categoria informada) ou `customData` (objeto com os campos do
  formulário de cadastro da categoria informada, avulso) — validar mutuamente
  exclusivo e obrigatório via `@ValidateIf`, mensagens em pt-BR. Validação de
  `customData` reaproveitando os `Create*Dto` de cada categoria (sugestão de
  implementação: `class-validator`'s `validate()` chamado manualmente no serviço
  contra o DTO correspondente à `category`, já que a decoração estática não suporta
  bem um formato que varia por valor de um outro campo).
- `RemoveSheetInventoryItemDto` — `quantity` (int `>= 1`, obrigatório).
- `SheetInventoryItemResponseDto` — `id`, `category`, `quantity`, `equipped`,
  `unitVolume`, `data` (snapshot completo), `createdAt`, `updatedAt`, com
  `fromEntity`.
- `SheetInventoryListResponseDto` — `counts: Record<SheetInventoryItemCategory,
  number>`, `items: SheetInventoryItemResponseDto[]`.
- `SheetInventoryMutationResponseDto` — `sheet: SheetResponseDto`, `inventory:
  SheetInventoryListResponseDto`.
- `SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`):
  ajustar o tipo de `loadedVolume` (que já existe, hoje documentado como inteiro) para
  refletir que passa a aceitar decimais, e adicionar `itemsVolume: number` novo,
  preenchidos em `fromEntity` a partir da entidade.
- `UpdateSheetDto`: o campo `loadedVolume` já existente (`@IsInt()`) deve trocar para
  aceitar decimal (`@IsNumber({ maxDecimalPlaces: 1 })` em vez de `@IsInt()`, mesma
  mensagem em pt-BR ajustada) — mantendo a possibilidade de o client continuar
  enviando o valor recomputado localmente via `PUT /sheets/:id` para os fluxos que
  não passam pelos novos endpoints de item (ex.: recomputo local ao editar moedas).
  Confirmar com o time se `itemsVolume` também deve ser aceito nesse mesmo PUT
  genérico ou se só é escrito pelos endpoints de item — sinalizado aqui como ponto a
  alinhar, já que o spec só descreve a recomputação a partir dos novos endpoints, não
  reabrindo o fluxo de autosave de moedas da task anterior.

- Acesso Google:
  - Endpoints de `sheet-inventory-items` (`GET`/`POST`/`PUT` acima): não seguem o
    padrão genérico `read-only`/`blocked` de CRUD de catálogo — seguem a mesma regra
    já aplicada a todo o módulo `sheets` (`findAccessibleById` combinado com a
    restrição a fichas próprias para usuários `provider: 'google'`, já implementada
    em `sheets.service.ts`). Nenhuma regra nova de acesso Google a criar.
  - Controllers de `utilities`/`consumables`/`materials`/`ammunition`/`accessories`:
    nenhum endpoint novo é criado nessas 5 categorias (apenas o campo `volume` nos
    DTOs/entidade já existentes); o nível de acesso Google desses controllers
    permanece o que já está configurado hoje, sem alteração.

Status: concluído

Decisões dos pontos em aberto (definidas pelo orquestrador, implementadas como segue):
- Volume unitário nulo/em branco: tratado como `0` na soma (`unitVolume = data.volume
  ?? 0`), sem impedir a adição (`resolveSnapshotForAdd` em `sheets.service.ts`).
- `equip`/`unequip` idempotentes: retornam 200 sem efeito colateral quando o item já
  está no estado solicitado (`setInventoryItemEquipped` em `sheets.service.ts`);
  `ConflictException` mantido apenas para categoria não equipável.
- `itemsVolume` não é aceito em `UpdateSheetDto` (somente leitura em
  `SheetResponseDto`, escrito exclusivamente pelos endpoints de inventory-items);
  `loadedVolume` em `UpdateSheetDto` passou de `@IsInt()` para
  `@IsNumber({ maxDecimalPlaces: 1 })`.

Entidade:
- app-api/src/modules/sheets/entities/sheet-inventory-item.entity.ts (nova)
- app-api/src/modules/sheets/entities/sheet.entity.ts (loadedVolume alterado para
  numeric(6,1); itemsVolume novo)
- app-api/src/modules/utilities/entities/utility.entity.ts (campo volume novo)
- app-api/src/modules/consumables/entities/consumable.entity.ts (campo volume novo)
- app-api/src/modules/materials/entities/material.entity.ts (campo volume novo)
- app-api/src/modules/ammunition/entities/ammunition.entity.ts (campo volume novo)
- app-api/src/modules/accessories/entities/accessory.entity.ts (campo volume novo)

Migration:
- app-api/src/database/migrations/1784306800000-AddVolumeToItemCatalogTables.ts
  (volume nas 5 tabelas de catálogo)
- app-api/src/database/migrations/1784306810000-ChangeLoadedVolumeToNumericAndAddItemsVolumeToSheets.ts
  (sheets.loaded_volume int -> numeric(6,1); sheets.items_volume novo)
- app-api/src/database/migrations/1784306820000-CreateSheetInventoryItemsTable.ts
  (tabela sheet_inventory_items + enum)

Rotas:
- GET /sheets/:id/inventory-items
- POST /sheets/:id/inventory-items
- POST /sheets/:id/inventory-items/:itemId/remove
- PUT /sheets/:id/inventory-items/:itemId/equip
- PUT /sheets/:id/inventory-items/:itemId/unequip

Arquivos (demais criados/alterados):
- app-api/src/modules/sheets/enums/sheet-inventory-item-category.enum.ts (novo)
- app-api/src/modules/sheets/dto/add-sheet-inventory-item.dto.ts (novo)
- app-api/src/modules/sheets/dto/remove-sheet-inventory-item.dto.ts (novo)
- app-api/src/modules/sheets/dto/find-sheet-inventory-items-query.dto.ts (novo)
- app-api/src/modules/sheets/dto/sheet-inventory-item-response.dto.ts (novo)
- app-api/src/modules/sheets/dto/sheet-inventory-list-response.dto.ts (novo)
- app-api/src/modules/sheets/dto/sheet-inventory-mutation-response.dto.ts (novo)
- app-api/src/modules/sheets/dto/sheet-response.dto.ts (itemsVolume novo,
  loadedVolume redocumentado como decimal)
- app-api/src/modules/sheets/dto/update-sheet.dto.ts (loadedVolume decimal;
  itemsVolume não aceito)
- app-api/src/modules/sheets/sheets.service.ts (computeVolumeLimit,
  recomputeItemsAndLoadedVolume, resolução de snapshot catálogo/avulso,
  empilhamento, listInventoryItems/addInventoryItem/removeInventoryItem/
  equipInventoryItem/unequipInventoryItem)
- app-api/src/modules/sheets/sheets.controller.ts (5 endpoints novos)
- app-api/src/modules/sheets/sheets.module.ts (registra SheetInventoryItem e importa
  os 8 módulos de catálogo)
- app-api/src/modules/{utilities,consumables,materials,ammunition,accessories}/dto/create-*.dto.ts
  (campo volume novo)
- app-api/src/modules/{utilities,consumables,materials,ammunition,accessories}/dto/*-response.dto.ts
  (campo volume novo)
- app-api/src/modules/{utilities,consumables,materials,ammunition,accessories}/*.service.ts
  (atribuição de volume em create/update; novo método buildSnapshotFromDto)
- app-api/src/modules/{weapons,armors,shields,accessories}/*.service.ts (novo método
  buildSnapshotFromDto, usado para montar o snapshot de itens avulsos de inventário)

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir com `@ApiProperty`/`@ApiPropertyOptional`: o campo `volume` novo nas 5
  entidades/DTOs de catálogo; `loadedVolume` (tipo/descrição atualizados para
  decimal) e `itemsVolume` novo em `Sheet`/`SheetResponseDto`/`UpdateSheetDto`; e
  toda a superfície nova de `/sheets/:id/inventory-items` (`@ApiTags('sheets')`
  já herdado do controller, `@ApiOperation`, `@ApiOkResponse`/`@ApiCreatedResponse`,
  `@ApiNotFoundResponse` para ficha/item não encontrados, `@ApiConflictResponse` para
  volume limite excedido e categoria não equipável, `@ApiBadRequestResponse` para
  quantidade inválida/payload de item avulso inválido), incluindo os novos DTOs
  (`AddSheetInventoryItemDto`, `RemoveSheetInventoryItemDto`,
  `SheetInventoryItemResponseDto`, `SheetInventoryListResponseDto`,
  `SheetInventoryMutationResponseDto`) e o novo enum `SheetInventoryItemCategory`
  (`@ApiProperty({ enum: SheetInventoryItemCategory })` onde usado). Tudo em pt-BR,
  consistente com o restante do módulo.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Revisão completa dos arquivos das etapas "1. api-dev" e "2. api-dev-doc" (ambas
concluídas), incluindo as 3 migrations, as 6 entidades novas/alteradas, o novo enum,
os 7 DTOs novos de `sheets`, o ajuste em `SheetResponseDto`/`UpdateSheetDto`,
`sheets.service.ts`, `sheets.controller.ts`, `sheets.module.ts`, e o campo `volume`
(entidade + DTOs + serviço) nas 5 categorias de catálogo, comparados contra
`CLAUDE.md` e `.claude/tasks/ficha-inventario-itens/spec.md`. Migrations e entidades
batem exatamente (precision/scale/nullable/default, enum, FK `ON DELETE CASCADE`,
`down()` simétrico em todas as 3); a conversão `loaded_volume` int→numeric usa
`USING "loaded_volume"::numeric` no `up()` e `USING round("loaded_volume")::integer`
no `down()`, preservando os dados existentes. A aritmética de volume usa valor
decimal exato (sem `floor`/`round` indevido — `floor` aparece apenas na parcela de
moedas, conforme esperado) e `recomputeItemsAndLoadedVolume` sempre recalcula a
partir de uma consulta ao banco (nunca por acumulação), chamado ao final de toda
adição/remoção. Todos os 5 endpoints resolvem a ficha via `findAccessibleById`
antes de ler/escrever, e o `:itemId` é sempre buscado com `where: { id: itemId,
sheet: { id: sheet.id } }`, sem risco de IDOR entre fichas. Não foi encontrada
nenhuma FK viva no snapshot `data` (é sempre serializado via
`JSON.parse(JSON.stringify(...))` a partir de um `*ResponseDto`, quebrando qualquer
referência a entidade). `customData` é validado contra o `Create*Dto` da categoria
via `class-validator` manual com `whitelist`/`forbidNonWhitelisted`, e a
exclusividade com `catalogItemId` é reforçada em `resolveSnapshotForAdd`.

Problemas encontrados (nenhum bloqueante; nenhum de segurança ou de inconsistência
migration↔entidade):

- **app-api/src/modules/sheets/dto/find-sheet-inventory-items-query.dto.ts:22-25** —
  Severidade: Média. `equippedOnly` usa `@Type(() => Boolean)` + `@IsBoolean()`.
  `class-transformer` converte o valor via `Boolean(value)`, então uma query string
  não vazia como `"false"` também é convertida para `true` (`Boolean("false") ===
  true`). Um client que envie `?equippedOnly=false` explicitamente receberá o filtro
  como se fosse `true`. O mesmo padrão já existe em
  `find-sheet-ability-candidates-query.dto.ts` (pré-existente, não introduzido por
  esta task), mas afeta diretamente a correção deste endpoint novo.
  - Trecho: `@Type(() => Boolean)\n@IsBoolean()\nequippedOnly?: boolean;`
  - Sugestão: substituir por um `@Transform(({ value }) => value === true || value
    === 'true')` explícito (ou equivalente), tanto aqui quanto no DTO pré-existente
    que segue o mesmo padrão, para tratar corretamente `"false"`/ausência do
    parâmetro.

- **app-api/src/modules/sheets/sheets.service.ts:2926-2953 (`addInventoryItem`)** —
  Severidade: Média. `computeVolumeLimit`/a comparação com `volumeLimit` são feitos
  sobre a `sheet` obtida por `findAccessibleById` **antes** de abrir a
  `dataSource.transaction`, sem lock de linha (`SELECT ... FOR UPDATE`) e sem
  reler `itemsVolume`/moedas dentro da transação. Duas requisições concorrentes de
  adição na mesma ficha podem ambas passar na validação de volume limite com base no
  mesmo `itemsVolume` desatualizado e persistir, somando um volume total acima do
  limite — o que a regra de negócio (spec, seção "Validação de volume no backend")
  explicitamente proíbe. Risco baixo em uso real (usuário único editando a própria
  ficha), mas é uma violação de integridade sob concorrência.
  - Trecho: `const volumeLimit = this.computeVolumeLimit(sheet); ... if
    (Math.round(projectedLoadedVolume * 10) > Math.round(volumeLimit * 10)) { throw
    new ConflictException(...) }` — calculado fora do `this.dataSource.transaction(...)`
    que vem logo depois.
  - Sugestão: mover o cálculo de `volumeLimit`/`projectedLoadedVolume` para dentro da
    transação, relendo `itemsVolume` (ou a soma dos itens) e `pc/pp/po/pl` a partir do
    `manager` antes de validar, ou usar `SELECT ... FOR UPDATE` sobre a linha da
    ficha no início da transação para serializar adições concorrentes.

- **app-api/src/modules/sheets/dto/add-sheet-inventory-item.dto.ts:29-46** —
  Severidade: Baixa (não é falha de segurança — o resultado final para o client
  continua sendo um erro 400 em pt-BR, apenas por um caminho diferente do esperado).
  Quando `catalogItemId` **e** `customData` são informados simultaneamente, as duas
  condições `@ValidateIf` (`!dto.customData` e `!dto.catalogItemId`) avaliam para
  `false`, então **nenhum** dos dois decorators (`@IsUUID`/`@IsObject`) roda — o
  `ValidationPipe` não gera erro estruturado para esse caso, e a rejeição só ocorre
  depois, dentro de `SheetsService.resolveSnapshotForAdd` (`BadRequestException`
  genérica). Funciona porque há uma checagem redundante no serviço, mas o contrato
  de validação do DTO (e o Swagger, que documenta "nunca os dois" nesse nível) não
  cobre esse caso.
  - Trecho: `@ValidateIf((dto) => !dto.customData) @IsUUID('4', {...})
    catalogItemId?: string;` / `@ValidateIf((dto) => !dto.catalogItemId)
    @IsObject({...}) customData?: Record<string, unknown>;`
  - Sugestão: adicionar uma validação de classe (`@ValidatorConstraint` custom, ou um
    decorator aplicado à própria classe) que rejeite explicitamente o caso "os dois
    presentes", em vez de depender só do `BadRequestException` manual do serviço.

- **app-api/src/modules/weapons/weapons.service.ts:271-337 (`buildSnapshotFromDto`)
  e equivalentes em `armors`/`shields`/`accessories`/`utilities`/`consumables`/
  `materials`/`ammunition`, consumidos em
  app-api/src/modules/sheets/sheets.service.ts:2786-2843
  (`buildSnapshotFromCustomData`) e :2687-2689 (`toPlainSnapshot`)** — Severidade:
  Baixa. Para item avulso, a entidade é criada via `xxxRepository.create(...)` e
  nunca salva, então `id`/`createdAt`/`updatedAt` ficam `undefined`; como
  `toPlainSnapshot` faz `JSON.parse(JSON.stringify(dto))`, essas chaves são
  simplesmente omitidas do `data` persistido. Já para item existente do catálogo
  (`buildSnapshotFromCatalogItem`), a entidade vem do banco, então `data.id`/
  `data.createdAt`/`data.updatedAt` ficam presentes — mas `data.id` é o id do
  registro de catálogo de origem, não do `SheetInventoryItem`. O formato do
  snapshot fica inconsistente entre os dois fluxos (avulso vs. catálogo), e o id do
  catálogo de origem acaba embutido no snapshot da ficha, o que pode confundir o
  consumo no front (ex.: se algo ali assumir que `data.id` identifica o item de
  inventário).
  - Trecho: `const weapon = this.weaponsRepository.create({...}); ... return
    weapon;` (nunca persistido) → `this.toPlainSnapshot(WeaponResponseDto.fromEntity(entity))`
    → `JSON.parse(JSON.stringify(dto))`.
  - Sugestão: em `toPlainSnapshot` (ou em cada `buildSnapshotFrom*`), remover
    explicitamente `id`/`createdAt`/`updatedAt` do objeto antes de gravar em `data`,
    garantindo o mesmo formato para os dois fluxos e evitando embutir o id do
    catálogo de origem no snapshot da ficha.

Nenhum problema de severidade Alta foi encontrado. Aprovado com ressalvas: os 4
pontos acima (2 de severidade Média, 2 de severidade Baixa) não bloqueiam o
funcionamento correto descrito no spec e podem ser tratados como follow-up.

### Correções aplicadas (follow-up dos 4 achados)

- **`equippedOnly` (Média):** `find-sheet-inventory-items-query.dto.ts` trocou
  `@Type(() => Boolean)` por `@Transform(({ value }) => value === undefined ? value :
  value === true || value === 'true')`, mantendo `@IsBoolean()`. `equippedOnly=false`
  agora filtra como falso; parâmetro ausente continua sem filtro. (O mesmo padrão
  pré-existente em `find-sheet-ability-candidates-query.dto.ts`, fora do escopo desta
  task, não foi alterado.)
- **Janela de corrida no volume limite (Média):** em `addInventoryItem`
  (`sheets.service.ts`), a validação de Volume Limite foi movida para dentro da
  `dataSource.transaction`, após um `pessimistic_write` na linha da `Sheet`
  (`sheetsRepository.findOne({ where: { id: sheet.id }, lock: { mode:
  'pessimistic_write' } })`). Os campos escalares travados (`pc/pp/po/pl`,
  `melhorias`/`defeitos`) são copiados para a entidade `sheet` já carregada com as
  relações de `findAccessibleById` (evitando quebrar `SheetResponseDto.fromEntity`,
  que exige `armorClassKeyAttribute`/`createdBy`), e `recomputeItemsAndLoadedVolume` é
  chamado antes da validação (para ler `itemsVolume` fresco) e novamente após a
  inserção/empilhamento.
- **Exclusividade `catalogItemId`/`customData` (Baixa):** `add-sheet-inventory-item.dto.ts`
  ganhou um `@ValidatorConstraint` (`ExactlyOneOfCatalogItemIdOrCustomDataConstraint`)
  aplicado via `@Validate(...)` no campo `category` (não em `catalogItemId`/
  `customData`, já que `@ValidateIf` desativa todas as validações do próprio campo,
  inclusive `@Validate`, quando sua condição é falsa — o que faria a checagem ser
  pulada exatamente no caso "os dois informados"). Agora o `ValidationPipe` rejeita
  esse caso com 400 estruturado e mensagem em pt-BR, sem depender só da checagem
  manual em `resolveSnapshotForAdd` (mantida como defesa em profundidade).
- **Formato do snapshot `data` (Baixa):** `toPlainSnapshot` (`sheets.service.ts`), usado
  tanto por `buildSnapshotFromCatalogItem` quanto por `buildSnapshotFromCustomData`,
  agora remove `id`/`createdAt`/`updatedAt` do objeto serializado antes de retornar.
  Os dois fluxos (avulso e catálogo) passam a produzir o mesmo formato de `data`, e o
  id do registro de catálogo de origem não fica mais embutido no snapshot da ficha. A
  regra de empilhamento (comparação profunda de `data` via `stableStringify`) continua
  correta: itens idênticos do catálogo (mesmo `catalogItemId`, ou catalogItemIds
  distintos com dados exibidos idênticos) continuam empilhando, já que a remoção é
  aplicada uniformemente nos dois lados da comparação.

### Segunda passada — validação das correções

Validação pontual dos 4 achados corrigidos (não repete a revisão completa; itens 1 e 3
foram lidos por completo, itens 2 e 4 tiveram o trecho relevante de
`sheets.service.ts` e os `*ResponseDto`/`*.service.ts` de catálogo referenciados
(re)lidos).

**1. `equippedOnly` (`find-sheet-inventory-items-query.dto.ts:22-27`) — Aprovado.**
`@Transform(({ value }) => value === undefined ? value : value === true || value ===
'true')` cobre corretamente os três casos: ausente → `undefined` repassado ao
`@IsOptional()` (sem filtro); `"true"`/`true` → `true`; `"false"` (e qualquer outro
valor, incluindo string vazia) → `false`. `@IsBoolean()` roda depois do `@Transform`
(pipeline `transform: true` do Nest aplica `class-transformer` antes de
`class-validator`) e sempre recebe um `boolean` ou `undefined`, nunca rejeitando um
valor válido.

**2. Lock pessimista em `addInventoryItem` (`sheets.service.ts:2954-3024`) — Correto
no ponto principal, mas com um risco residual de deadlock não coberto pela correção.**
- O `pessimistic_write` é adquirido (`sheetsRepository.findOne({ where: { id:
  sheet.id }, lock: { mode: 'pessimistic_write' } })`) **antes** de
  `recomputeItemsAndLoadedVolume`/`computeVolumeLimit`, e os campos escalares lidos
  na validação (`pc/pp/po/pl`, `melhorias`/`defeitos`) são copiados do `lockedRow` para
  a entidade `sheet` já carregada por `findAccessibleById` antes do cálculo — a janela
  de corrida original foi fechada.
- A entidade `sheet` retornada ao final (`sheetsRepository.save(sheet)`, usada para
  montar `SheetResponseDto.fromEntity`) preserva `armorClassKeyAttribute`/`createdBy`/
  `race`/`biography`/`campaign` (carregados por `findAccessibleById` antes da
  transação e nunca sobrescritos), então `fromEntity` (que acessa
  `sheet.armorClassKeyAttribute` diretamente, sem null-check — ver
  `sheet-response.dto.ts:181-182`) não quebra. Nenhum campo relacional fica obsoleto
  porque nenhuma dessas relações é alterada por `addInventoryItem`; só os 6 campos
  escalares citados são ressincronizados. `recomputeItemsAndLoadedVolume` continua
  consultando `itemsRepository.find(...)` (via `manager.getRepository`, dentro da
  transação) tanto antes da validação quanto depois da inserção/empilhamento — sempre
  a partir da fonte, nunca por acumulação.
- **Risco de deadlock (não coberto pela correção):** a ordem de aquisição de locks em
  `addInventoryItem` é Sheet → Item (lock explícito na `Sheet` primeiro; a linha do
  `SheetInventoryItem` de destino do empilhamento só é travada depois, via
  `itemsRepository.save(stackTarget)`, se houver `stackTarget`). Em
  `removeInventoryItem` (`sheets.service.ts:3043-3070`), que roda numa transação
  própria mas **sem** `pessimistic_write` na `Sheet`, a ordem é o inverso: primeiro o
  item é modificado/removido (`itemsRepository.remove(item)` ou
  `itemsRepository.save(item)`, que trava a linha do item), e só ao final
  `sheetsRepository.save(sheet)` executa um `UPDATE` na `Sheet` (travando-a
  implicitamente) para persistir `itemsVolume`/`loadedVolume` recomputados. Se uma
  requisição de `POST .../inventory-items` que vai empilhar num item X (`stackTarget
  === item X`) correr concorrentemente com uma requisição de
  `POST .../inventory-items/X/remove` sobre o mesmo item X, é possível a seguinte
  espera circular: T1 (add) trava a `Sheet` e fica bloqueado esperando a linha do item
  X (que T2 já trava ao remover/decrementar); T2 (remove) já modificou o item X e fica
  bloqueado esperando a `Sheet` (que T1 já trava) no `sheetsRepository.save(sheet)`
  final — deadlock clássico, que o Postgres detecta e resolve abortando uma das duas
  transações com erro (a chamada correspondente falharia com 500 em vez do resultado
  esperado). Isso não existia como cenário antes da correção (antes, `addInventoryItem`
  não travava a `Sheet` explicitamente); a correção resolveu a janela de corrida da
  validação de volume limite mas introduziu uma ordem de lock inconsistente com
  `removeInventoryItem` para o par de recursos (`Sheet`, `SheetInventoryItem`).
  - Sugestão: padronizar a ordem de aquisição em todas as mutações de
    `sheet_inventory_items` — por exemplo, também adquirir `pessimistic_write` na
    `Sheet` logo no início da transação de `removeInventoryItem` (mesmo padrão já usado
    em `addInventoryItem`), garantindo que a `Sheet` seja sempre o primeiro recurso
    travado nas duas operações.
  - **Resolvido:** `removeInventoryItem` (`sheets.service.ts`) agora adquire
    `pessimistic_write` na linha da `Sheet` (`sheetsRepository.findOne({ where: { id:
    sheet.id }, lock: { mode: 'pessimistic_write' } })`) logo no início da transação,
    antes de qualquer leitura/escrita do `SheetInventoryItem` — mesmo padrão já usado em
    `addInventoryItem`. Os campos escalares usados por `recomputeItemsAndLoadedVolume`
    (`pc`/`pp`/`po`/`pl`) são ressincronizados a partir do `lockedRow` na entidade
    `sheet` já carregada por `findAccessibleById`, preservando as relações
    (`armorClassKeyAttribute`/`createdBy`/etc.) exigidas por
    `SheetResponseDto.fromEntity`. `setInventoryItemEquipped` (usado por
    `equipInventoryItem`/`unequipInventoryItem`) foi revisado e não precisou de
    alteração: ele só lê a `Sheet` (sem lock) para checar acesso e nunca persiste a
    `Sheet` (nenhum `sheetsRepository.save(sheet)`/`UPDATE` implícito) — apenas
    `sheetInventoryItemsRepository.save(item)` — então não participa da disputa de
    ordem de locks entre `Sheet` e `SheetInventoryItem`. Não há outro método de mutação
    de inventário que persista a `Sheet`. Ordem de locks confirmada, consistente em
    ambos os métodos que travam a `Sheet`: `addInventoryItem` → Sheet primeiro, depois
    `SheetInventoryItem` (lock explícito na Sheet, seguido de leitura/escrita do item
    via `itemsRepository`); `removeInventoryItem` → Sheet primeiro (lock explícito),
    depois `SheetInventoryItem` (leitura/remoção/decremento do item via
    `itemsRepository`), com o `UPDATE` final da `Sheet` (`sheetsRepository.save(sheet)`)
    não adquirindo lock novo por já estar sob a linha travada no início da mesma
    transação.

**3. `ExactlyOneOfCatalogItemIdOrCustomDataConstraint` (`add-sheet-inventory-item.dto.ts`)
— Aprovado.** Os três casos batem com o esperado: nenhum dos dois informados
(`Boolean(undefined) !== Boolean(undefined)` → `false !== false` → inválido); os dois
informados (`true !== true` → inválido); apenas um informado (`true !== false` ou
`false !== true` → válido). Mensagem
(`'Informe catalogItemId (item do catálogo) ou customData (item avulso), nunca os dois
nem nenhum.'`) está em pt-BR. A aplicação em `category` (via `@Validate(...)`, sem
`@ValidateIf`) não é anulada quando `category` está ausente/inválida: `class-validator`
roda todos os decorators de uma propriedade independentemente uns dos outros (não há
short-circuit entre `@IsEnum` e `@Validate` no mesmo campo), então a checagem de
exclusividade mútua é sempre avaliada, e `args.object` continua expondo
`catalogItemId`/`customData` do DTO completo independentemente do valor de `category`.

**4. `toPlainSnapshot` sem `id`/`createdAt`/`updatedAt` (`sheets.service.ts:2696-2702`)
— Aprovado para o caso relatado; correção é rasa por natureza, mas isso não reabre a
inconsistência original.** A remoção é aplicada uniformemente nos dois fluxos
(`buildSnapshotFromCatalogItem` e `buildSnapshotFromCustomData`, ambos passando por
`toPlainSnapshot`). Confirmado que objetos aninhados vindos de relações do catálogo
(ex.: `currency` → `CurrencyResponseDto.id`; `tags[]`/`traits[]` →
`TagResponseDto.id/createdAt`, `TraitResponseDto.id/createdAt/updatedAt`; `sizeGrade`,
`damageType`) continuam carregando seus próprios `id` (e, no caso de `tags`/`traits`,
também `createdAt`/`updatedAt`) — a remoção em `toPlainSnapshot` é de fato só rasa
(`delete plain.id/createdAt/updatedAt` no nível raiz do objeto serializado). Porém essa
não é uma inconsistência "deslocada" pela correção: em ambos os fluxos essas entidades
aninhadas (moeda, tags, traços, grau de tamanho, tipo de dano) são sempre buscadas do
banco por id (`buildSnapshotFromDto`, usado no fluxo avulso, chama os mesmos
`findCurrencyById`/`findTagsByIds`/`findTraitsByIds`/etc. usados no fluxo de
catálogo — ver `weapons.service.ts:271-337`), então os dois fluxos produzem o mesmo
formato aninhado (com os mesmos `id`s reais de catálogo) tanto antes quanto depois da
correção — não há divergência entre avulso e catálogo nesse nível, e a comparação de
empilhamento (`stableStringify`) continua correta pois os campos aninhados extras são
sempre computados da mesma forma nos dois lados.
Ressalva de severidade baixa (não é o problema original, é uma observação nova): os
`id`s aninhados de moeda/tags/traços embutidos no snapshot batem com o que o spec
descreve como esperado ("tags copiadas por nome/id"), mas `createdAt`/`updatedAt` de
`tags`/`traits` aninhados (não mencionados na lista de campos copiados do spec) ficam
como ruído extra persistido em todo item de inventário dessas categorias — não é um
bug funcional (não quebra empilhamento nem expõe dado sensível), apenas um campo a
mais do que o spec descreve como copiado.
  - Sugestão (opcional, baixa prioridade): se o time considerar relevante, aplicar a
    mesma remoção (`id`/`createdAt`/`updatedAt`) recursivamente em `toPlainSnapshot`
    para objetos/arrays aninhados, ou compor os DTOs de catálogo aninhados sem esses
    campos ao montar o snapshot — não bloqueante.

**Resumo desta passada:** 3 dos 4 pontos corrigidos foram validados como corretos e
completos (equippedOnly, exclusividade catalogItemId/customData, e o fechamento da
janela de corrida em si). Um ponto (severidade Média) permanece em aberto: a nova
ordem de aquisição de lock em `addInventoryItem` (Sheet → Item) é inconsistente com a
ordem implícita em `removeInventoryItem` (Item → Sheet), criando risco de deadlock sob
concorrência entre adição (com empilhamento) e remoção do mesmo item — não
identificado na primeira passada porque o lock explícito só foi introduzido nesta
correção. Um ponto adicional de severidade Baixa (observação, não bug) foi registrado
sobre a natureza rasa da remoção de `id`/`createdAt`/`updatedAt` em `toPlainSnapshot`
para objetos aninhados — não é uma regressão nem reabre o problema original, apenas
uma limitação conhecida da correção.

---

### Demanda incremental — revisão do endpoint de aumentar quantidade

Revisão restrita ao escopo tocado pela demanda incremental (etapas 4 e 5): o novo
método `SheetsService.increaseInventoryItem` (`sheets.service.ts:3099-3178`), o novo
DTO `IncreaseSheetInventoryItemDto`
(`sheets/dto/increase-sheet-inventory-item.dto.ts`) e a rota `POST
/sheets/:id/inventory-items/:itemId/increase` em `sheets.controller.ts:743-771`. A
base da feature (etapas 1-3) não foi reaberta.

**Pontos aprovados:**
- **Ordem de lock.** `increaseInventoryItem` adquire `pessimistic_write` na linha da
  `Sheet` (`sheetsRepository.findOne({ where: { id: sheet.id }, lock: { mode:
  'pessimistic_write' } })`) **antes** de qualquer leitura/escrita do
  `SheetInventoryItem` (a busca do item por `{ id: itemId, sheet: { id: sheet.id } }`
  só ocorre depois do lock), replicando exatamente a ordem já padronizada em
  `addInventoryItem`/`removeInventoryItem`. Não reabre o risco de deadlock corrigido
  na revisão das etapas 1-3.
- **Preservação de relações.** Apenas os campos escalares usados por
  `computeVolumeLimit`/`recomputeItemsAndLoadedVolume` (`pc`/`pp`/`po`/`pl`,
  `melhorias`/`defeitos`) são ressincronizados a partir do `lockedRow` na entidade
  `sheet` já carregada por `findAccessibleById`; nenhuma relação
  (`armorClassKeyAttribute`/`createdBy`/etc.) é tocada ou sobrescrita, mesmo padrão já
  validado como seguro em `addInventoryItem`/`removeInventoryItem`.
- **IDOR.** O item é buscado com `where: { id: itemId, sheet: { id: sheet.id } }`
  dentro da transação, mesma proteção usada nos endpoints vizinhos.
- **`recomputeItemsAndLoadedVolume` chamado duas vezes.** Confirmado que o método é
  puramente uma leitura do banco (`itemsRepository.find`) seguida de atribuição em
  memória em `sheet.itemsVolume`/`sheet.loadedVolume` — não persiste nada. Chamá-lo
  antes da validação (para obter `itemsVolume` fresco, já sob o lock da `Sheet`) e de
  novo após `itemsRepository.save(item)` (para refletir o novo total antes do
  `sheetsRepository.save(sheet)` final) não introduz nenhum efeito colateral
  indesejado; ambas as chamadas são necessárias e corretas, no mesmo espírito de
  `addInventoryItem`.
- **Comparação de volume limite.** Usa a mesma técnica de `addInventoryItem`
  (`Math.round(projectedLoadedVolume * 10) > Math.round(volumeLimit * 10)`, com
  `roundToOneDecimal` aplicado ao somatório antes da comparação). Verificação manual do
  caso de fronteira citado pelo orquestrador (limite 11, total projetado 10.9):
  `Math.round(10.9 * 10) = 109`, `Math.round(11 * 10) = 110`, `109 > 110` é falso →
  permitido, sem arredondar o resultado para cima. Como `unitVolume` (numeric(4,1)) e
  `quantity` (inteiro) sempre produzem, em valor real, um múltiplo exato de 0,1, e
  `sheet.itemsVolume` também já é sempre um múltiplo de 0,1, não há caso de fronteira
  em que a soma "verdadeira" caia perto de um `.x5` — o arredondamento final absorve
  qualquer ruído de ponto flutuante sem risco de falso positivo/negativo.
- **Mensagens pt-BR.** `NotFoundException` (ficha e item) e `ConflictException`
  (volume limite) usam exatamente o mesmo texto já usado em
  `addInventoryItem`/`removeInventoryItem`.
- **DTO.** `IncreaseSheetInventoryItemDto` espelha corretamente
  `RemoveSheetInventoryItemDto` (`@IsInt()`, `@Min(1)`, mesmas mensagens), com
  `@ApiProperty.description` contextualizada ao aumento, conforme decidido na etapa 4.

**Achados:**

- **`app-api/src/modules/sheets/sheets.controller.ts:743-757`
  (`increaseInventoryItem`)** — Severidade: Média. O endpoint é `@Post(...)` sem
  `@HttpCode(...)`, então o status HTTP real de resposta é `201 Created` (padrão do
  Nest para `@Post`), mas o Swagger documenta `@ApiOkResponse` (`200`). O corpo da
  resposta está correto (`SheetInventoryMutationResponseDto`), mas o código de status
  documentado não bate com o que a API de fato retorna — um client que valide o status
  exato (`=== 200`) falharia silenciosamente contra a documentação. O mesmo problema já
  existe em `removeInventoryItem` (`sheets.controller.ts:715-727`, etapa 1, fora do
  escopo desta revisão incremental), então não é uma regressão introduzida agora, mas é
  replicado por cópia do padrão no novo endpoint, dentro do escopo revisado.
  - Trecho: `@Post(':id/inventory-items/:itemId/increase') @ApiOperation({...})
    @ApiOkResponse({ type: SheetInventoryMutationResponseDto })` — sem `@HttpCode`.
  - Sugestão: adicionar `@HttpCode(HttpStatus.OK)` em `increaseInventoryItem` (já
    importados `HttpCode`/`HttpStatus` no arquivo) para que o status real seja `200`,
    condizente com o Swagger; avaliar o mesmo ajuste em `removeInventoryItem` como
    follow-up, já que ambos documentam `200` mas hoje retornam `201`.

- **`app-api/src/modules/sheets/sheets.service.ts:3154` (`increaseInventoryItem`)** —
  Severidade: Baixa. `additionalVolume = item.unitVolume * dto.quantity` não passa por
  `roundToOneDecimal` antes de ser somado a `sheet.itemsVolume` (diferente de
  `addInventoryItem:2953`, que calcula `additionalVolume` já com
  `this.roundToOneDecimal(unitVolume * dto.quantity)`). Não é um bug funcional — como
  `unitVolume` tem no máximo 1 casa decimal e `quantity` é inteiro, o produto "real" é
  sempre um múltiplo exato de 0,1, e o `roundToOneDecimal` aplicado depois, sobre
  `sheet.itemsVolume + additionalVolume` (linha 3155-3157), absorve qualquer ruído de
  ponto flutuante da mesma forma; o resultado final é idêntico ao de
  `addInventoryItem` em todos os casos. Mas não é literalmente "a mesma técnica" pedida
  na etapa 4 (que citava explicitamente reaproveitar a forma como `addInventoryItem`
  aplica `roundToOneDecimal`).
  - Trecho: `const additionalVolume = item.unitVolume * dto.quantity;` (sem
    `roundToOneDecimal`).
  - Sugestão (não bloqueante): por consistência de estilo com `addInventoryItem`,
    envolver com `this.roundToOneDecimal(...)` também aqui.

- **`app-api/src/modules/sheets/sheets.controller.ts:745,753,756`
  (`increaseInventoryItem`)** — Severidade: Baixa (estilo/formatação). As três linhas
  (`summary` do `@ApiOperation`, `description` do `@ApiBadRequestResponse` e
  `description` do `@ApiConflictResponse`) ultrapassam o `printWidth` padrão do
  Prettier (o projeto não sobrescreve `printWidth` em `.prettierrc`, então o padrão é
  80 colunas), diferente dos decorators vizinhos no mesmo arquivo (`addInventoryItem`,
  `removeInventoryItem`, `equipInventoryItem`), que quebram a `description` em uma
  linha própria quando o texto é longo. Não é um erro de compilação/execução, apenas
  inconsistência de formatação que `npm run format` reformataria automaticamente.
  - Trecho: `summary: 'Aumenta a quantidade de um item já existente no inventário da
    ficha',` (linha única, ~83 colunas); mesma situação nas duas `description` das
    linhas 753 e 756 (~86 e ~92 colunas).
  - Sugestão: rodar `npm run format` (ou quebrar manualmente `description`/`summary`
    em linha própria, como já é feito nos decorators vizinhos).

**Conclusão:** nenhum problema de severidade Alta ou de segurança encontrado no
escopo revisado (endpoint `increase`). A ordem de lock, a preservação de relações da
`Sheet`, a proteção contra IDOR, a aritmética de volume (na prática) e as mensagens
pt-BR estão corretas e consistentes com `addInventoryItem`/`removeInventoryItem`. Um
achado de severidade Média (status HTTP documentado como `200` mas retornado como
`201`, por ausência de `@HttpCode`) e dois de severidade Baixa (arredondamento não
literal do termo intermediário, e formatação de linhas longas nos decorators Swagger)
ficam registrados como follow-up, sem bloquear a funcionalidade.

**Correção dos 3 achados (nova passada):**

1. **Status HTTP divergente (Média).** Adicionado `@HttpCode(HttpStatus.OK)` em
   `increaseInventoryItem` (`sheets.controller.ts`), alinhando o status real (200) ao
   documentado via `@ApiOkResponse`. **O `removeInventoryItem` também foi alterado**
   (mesmo `@HttpCode(HttpStatus.OK)`), pois o mesmo defeito pré-existente foi
   confirmado nele: antes de alterar, foi feita busca (Grep) em
   `app-web/src/hooks/Queries/EntityQueries/` (incluindo
   `useRemoveSheetInventoryItemMutation` e
   `useIncreaseSheetInventoryItemQuantityMutation`) e em
   `app-web/src/app/(authorized)/fichas/` por checagens de `status === 201`/
   `response.status` — nenhuma dependência do código 201 foi encontrada nesses
   endpoints (a única checagem de status no diretório é `error?.response?.status ===
   404` em `fichas/[id]/page.tsx`, não relacionada). `addInventoryItem` (`POST
   /sheets/:id/inventory-items`) **não foi alterado**: continua `201 Created` por
   criar um recurso novo, e já está documentado com `@ApiCreatedResponse`, como
   esperado.
2. **Arredondamento (Baixa).** `additionalVolume` em `increaseInventoryItem`
   (`sheets.service.ts`) agora passa por `this.roundToOneDecimal(...)` antes de ser
   somado, replicando literalmente a técnica de `addInventoryItem`. A semântica da
   validação de fronteira (limite 11, total 10.9 permitido) não foi alterada — o
   arredondamento final sobre `sheet.itemsVolume + additionalVolume` e a comparação
   `Math.round(...)` permanecem exatamente como estavam.
3. **Formatação (Baixa).** As três linhas longas de `summary`/`description` nos
   decorators Swagger de `increaseInventoryItem` (`sheets.controller.ts`) foram
   quebradas em linha própria, no mesmo padrão já usado nos decorators vizinhos
   (`addInventoryItem`, `removeInventoryItem`).

---

## Demanda incremental: aumentar quantidade de item existente

Escopo novo, adicionado após a conclusão e revisão das etapas 1-3 acima (que
permanecem concluídas e não são reabertas). Cobre o endpoint simétrico de
`.../inventory-items/:itemId/remove`: aumentar a quantidade de um item que já existe
como card no inventário da ficha, sem reconstruir o payload de avulso/catálogo usado
em `POST /sheets/:id/inventory-items`.

### 4. api-dev

#### Entidade
- Não se aplica. Nenhuma entidade nova nem alteração de coluna — reutiliza
  integralmente `SheetInventoryItem` (`app-api/src/modules/sheets/entities/
  sheet-inventory-item.entity.ts`) já existente, incrementando o `quantity` de um
  registro já persistido.

#### Migration
- Necessária: não. Sem qualquer mudança de schema — nem nova tabela/coluna, nem
  alteração de tipo/constraint.

#### Controller
- Endpoint: `POST /sheets/:id/inventory-items/:itemId/increase`.
- Corpo: `{ quantity: number }` — inteiro positivo (`@IsInt()`, `@Min(1)`), mesma
  forma de `RemoveSheetInventoryItemDto`.
  - Decisão de DTO: **reaproveitar o mesmo formato de `RemoveSheetInventoryItemDto`
    através de um novo DTO dedicado, `IncreaseSheetInventoryItemDto`**, em vez de
    reutilizar literalmente a classe `RemoveSheetInventoryItemDto` no `@Body()`. As
    duas classes teriam exatamente o mesmo shape/validações (`quantity: number`,
    `@IsInt()`, `@Min(1)`), mas o texto do `@ApiProperty.description` de
    `RemoveSheetInventoryItemDto` é específico do fluxo de remoção ("não pode exceder
    a quantidade atual do item"), o que não se aplica aqui; e o Swagger já nomeia
    seus DTOs por operação nos demais endpoints do módulo (`Add*`/`Remove*`), então
    reaproveitar a classe de remoção para o corpo de `increase` produziria
    documentação enganosa. `IncreaseSheetInventoryItemDto` é um arquivo novo,
    espelhando exatamente a estrutura de `remove-sheet-inventory-item.dto.ts`, com
    descrição ajustada ao contexto de aumento (ex.: "Quantidade a adicionar ao item
    já existente (inteiro >= 1), respeitando o Volume Limite da ficha").
- Regras de negócio (`SheetsService`, novo método `increaseInventoryItem`, no mesmo
  padrão de `addInventoryItem`/`removeInventoryItem`):
  - Resolver a ficha via `findAccessibleById(id, currentUser)`, retornando
    `NotFoundException` em pt-BR se não encontrada/não pertencer ao usuário — mesma
    checagem inicial de todos os endpoints de inventário.
  - Buscar o `SheetInventoryItem` por `itemId` garantindo pertencimento à ficha
    (`where: { id: itemId, sheet: { id: sheet.id } }`), mesma proteção contra IDOR já
    usada em `removeInventoryItem`/`equipInventoryItem`/`unequipInventoryItem`;
    `NotFoundException` em pt-BR se não encontrado.
  - Transação com **a mesma ordem de lock já padronizada nesta feature**: adquirir
    `pessimistic_write` na linha da `Sheet` (`sheetsRepository.findOne({ where: { id:
    sheet.id }, lock: { mode: 'pessimistic_write' } })`) **primeiro**, antes de
    qualquer leitura/escrita do `SheetInventoryItem` — replicando exatamente o padrão
    de `addInventoryItem`/`removeInventoryItem` em `sheets.service.ts`, incluindo o
    mesmo cuidado de ressincronizar a partir do `lockedRow` apenas os campos
    escalares necessários (`pc`/`pp`/`po`/`pl`, `melhorias`/`defeitos`) na entidade
    `sheet` já carregada por `findAccessibleById` — preservando
    `armorClassKeyAttribute`/`createdBy`/demais relações exigidas por
    `SheetResponseDto.fromEntity`. Não travar a linha do `SheetInventoryItem` antes da
    `Sheet` em nenhuma circunstância, para não reabrir o risco de deadlock já
    documentado (e corrigido) na revisão das etapas 1-3.
  - Dentro da transação, após o lock: chamar `recomputeItemsAndLoadedVolume(sheet,
    itemsRepository)` para garantir `itemsVolume` fresco (mesma prática de
    `addInventoryItem`), então calcular `computeVolumeLimit(sheet)` (reaproveitar o
    método privado já existente, sem duplicar a fórmula).
  - Calcular o volume adicional como `unitVolume × quantity` do item já existente
    (`item.unitVolume` — coluna `numeric(4,1)` já persistida — multiplicado pelo
    `quantity` inteiro do corpo da requisição), **sem arredondamento** — mesma
    aritmética decimal exata já usada em `addInventoryItem` (`roundToOneDecimal`
    aplicado apenas para consolidar o resultado em 1 casa decimal, nunca para
    truncar/arredondar a comparação em si). Somar ao `itemsVolume`/`loadedVolume`
    projetados e comparar contra `volumeLimit` com a mesma técnica de comparação
    exata já usada em `addInventoryItem` (`Math.round(projetado * 10) >
    Math.round(volumeLimit * 10)`, evitando erro de ponto flutuante sem introduzir
    arredondamento indevido). Se ultrapassar, `ConflictException` com a mesma
    mensagem em pt-BR já usada em `addInventoryItem` ("A quantidade solicitada supera
    o volume limite que a ficha pode carregar."), sem persistir nada.
  - Se passar na validação: somar `dto.quantity` ao `item.quantity` atual
    (`item.quantity += dto.quantity`), salvar o item (`itemsRepository.save(item)`),
    e then chamar `recomputeItemsAndLoadedVolume(sheet, itemsRepository)` novamente
    (sempre a partir da fonte — consulta ao banco — nunca acumulando sobre o valor já
    calculado antes da validação), e persistir a `Sheet`
    (`sheetsRepository.save(sheet)`).
  - Fora da transação (mesmo padrão de `addInventoryItem`/`removeInventoryItem`):
    montar `inventory` via `buildInventoryList(savedSheet.id)` e retornar `{ sheet:
    savedSheet, inventory }` (`SheetInventoryMutationResult`).
- DTOs:
  - `IncreaseSheetInventoryItemDto` (novo, `app-api/src/modules/sheets/dto/
    increase-sheet-inventory-item.dto.ts`) — `quantity: number`, `@IsInt({ message:
    'A quantidade deve ser um número inteiro.' })`, `@Min(1, { message: 'A quantidade
    deve ser maior ou igual a 1.' })`, `@ApiProperty` com descrição própria do
    contexto de aumento (ver justificativa acima).
  - Resposta: `SheetInventoryMutationResponseDto` (já existente, reaproveitado sem
    alteração — mesmo bundle `{ sheet, inventory }` de todos os demais endpoints de
    mutação de inventário).
- Controller (`sheets.controller.ts`): novo método `increaseInventoryItem`, no mesmo
  formato dos vizinhos (`@Post(':id/inventory-items/:itemId/increase')`,
  `@Param('id', ParseUUIDPipe)`, `@Param('itemId', ParseUUIDPipe)`, `@Body() dto:
  IncreaseSheetInventoryItemDto`, `@CurrentUser() currentUser: User`), chamando
  `this.sheetsService.increaseInventoryItem(id, itemId, dto, currentUser)` e
  retornando via `this.toInventoryMutationResponseDto(result)` (helper já existente,
  reaproveitado sem alteração).
- Acesso Google: **read-only não se aplica** — este endpoint segue a mesma regra já
  estabelecida para todo `sheet-inventory-items` na etapa 1 (não é CRUD de catálogo
  genérico; segue `findAccessibleById` combinado com a restrição a fichas próprias
  para usuários `provider: 'google'`, já implementada em `sheets.service.ts`).
  Nenhuma regra nova de acesso Google a criar ou revisar.

Status: concluído

### 5. api-dev-doc
- Depende da etapa 4
- Documentar `POST /sheets/:id/inventory-items/:itemId/increase` em
  `sheets.controller.ts`, seguindo exatamente o padrão Swagger já usado nos vizinhos
  (`remove`/`equip`/`unequip`): `@ApiOperation({ summary: 'Aumenta a quantidade de um
  item já existente no inventário da ficha' })`, `@ApiOkResponse({ type:
  SheetInventoryMutationResponseDto })` (200, já que não cria um novo card quando o
  item já existe — mesmo código de status de `remove`), `@ApiNotFoundResponse`
  cobrindo ficha não encontrada/não pertencente ao usuário e item de inventário não
  encontrado nesta ficha (mesmo texto-base de `remove`/`equip`/`unequip`),
  `@ApiBadRequestResponse` cobrindo ID de ficha ou de item em formato inválido e
  quantidade inválida (não inteiro ou menor que 1), e **`@ApiConflictResponse`**
  cobrindo especificamente a quantidade solicitada superando o volume limite que a
  ficha pode carregar (mesmo texto usado em `POST /sheets/:id/inventory-items`).
- Documentar o novo DTO `IncreaseSheetInventoryItemDto` com `@ApiProperty` (campo
  `quantity`, mínimo 1, descrição em pt-BR contextualizada ao aumento de quantidade —
  ver texto sugerido na etapa 4).
- Nenhuma alteração nos DTOs/entidades já documentados nas etapas 1-2
  (`SheetInventoryMutationResponseDto`, `SheetInventoryItemResponseDto`, etc.) — são
  reaproveitados sem mudança de shape.

Status: concluído

### 6. api-dev-codereviewer
- Revisar tudo acima (etapas 4 e 5), com atenção específica a:
  - Ordem de lock (`Sheet` antes de `SheetInventoryItem`) consistente com
    `addInventoryItem`/`removeInventoryItem`, sem reabrir o risco de deadlock já
    corrigido na revisão das etapas 1-3.
  - Preservação das relações da `Sheet` (`armorClassKeyAttribute`, `createdBy` etc.)
    exigidas por `SheetResponseDto.fromEntity` após a ressincronização a partir do
    `lockedRow`.
  - Comparação decimal exata (sem arredondamento indevido) na validação do Volume
    Limite, e uso de `recomputeItemsAndLoadedVolume` sempre a partir da fonte (nunca
    por acumulação).
  - Consistência da mensagem de erro pt-BR do `ConflictException` com a já usada em
    `addInventoryItem`.
  - Cobertura Swagger completa do novo endpoint e do novo DTO, incluindo o
    `@ApiConflictResponse`.

Status: concluído