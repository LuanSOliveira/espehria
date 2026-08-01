# Task API: Itens - Preço numérico e Moeda

## Contexto
Ver .claude/tasks/itens-preco-moeda/spec.md

Padrão de referência investigado no código: módulo `attributes` (lookup somente leitura,
sem CRUD de escrita, sem paginação — `app-api/src/modules/attributes/`) e suas migrations
`1784306030000-CreateAttributesTable.ts` / `1784306040000-SeedAttributesTable.ts`. Padrão
de FK ManyToOne nullable/obrigatória investigado em `app-api/src/modules/skills/entities/skill.entity.ts`
(relação `keyAttribute`) e na migration `1784306050000-AddKeyAttributeToSkillsTable.ts`.
Padrão de migration que aplica a mesma alteração a várias tabelas de uma vez investigado em
`1784305690000-AddPrivateInformationToContentTables.ts`.

As 5 entidades de item (`equipment`, `materials`, `consumables`, `ammunition`, `utilities`)
possuem estrutura idêntica hoje: `name` (varchar, único), `referenceImage` (varchar
nullable, coluna `reference_image`), `description` (text nullable), `price` (varchar
nullable), `privateInformation` (text nullable, coluna `private_information`), `tags`
(ManyToMany). Cada módulo segue o mesmo padrão de entity/dto/service/controller/module,
com o repositório de `Tag` injetado diretamente no service (sem importar `TagsModule`).

## Etapas

### 1. api-dev
Status: concluído

#### Entidade

**Nova entidade de moeda** (novo módulo `currencies`, seguindo o padrão de `attributes`):
- Entidade: `Currency` — `app-api/src/modules/currencies/entities/currency.entity.ts`
- Tabela: `currencies`
- Campos:
  - `abbreviation` (varchar, obrigatório, único — `@Index({ unique: true })`, ex.: "PO")
  - `name` (varchar, obrigatório, ex.: "Ouro")
- Relacionamentos: nenhum (lookup simples, extende `BaseEntity`).
- Sem CRUD de escrita — apenas os 4 registros fixos via seed (PC/Cobre, PP/Prata, PO/Ouro,
  PL/Platina), sem endpoints de create/update/delete.

**Alteração nas 5 entidades de item** (`equipment/entities/equipment.entity.ts`,
`materials/entities/material.entity.ts`, `consumables/entities/consumable.entity.ts`,
`ammunition/entities/ammunition.entity.ts`, `utilities/entities/utility.entity.ts`):
- Campo `price`: alterar de `@Column({ type: 'varchar', nullable: true }) price!: string | null;`
  para `@Column({ type: 'integer', nullable: true }) price!: number | null;`.
- Novo campo `currency` (relacionamento ManyToOne opcional para `Currency`):
  ```
  @ManyToOne(() => Currency, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency | null;
  ```
  (`onDelete: 'SET NULL'` é consistente com o fato de a FK ser nullable; como não há
  endpoint de exclusão de moeda, o comportamento prático não é exercitado, mas mantém a
  coerência do schema.)

#### Migration
- Necessária: sim (3 migrations, nesta ordem, dando sequência aos timestamps já usados —
  o último existente é `1784306110000`):

  1. `1784306120000-CreateCurrenciesTable.ts` — cria a tabela `currencies` (`id`,
     `created_at`, `updated_at`, `abbreviation` varchar not null, `name` varchar not null)
     e índice único em `abbreviation`, seguindo exatamente o padrão de
     `1784306030000-CreateAttributesTable.ts`.
  2. `1784306130000-SeedCurrenciesTable.ts` — insere os 4 registros fixos: `('PC', 'Cobre')`,
     `('PP', 'Prata')`, `('PO', 'Ouro')`, `('PL', 'Platina')`, seguindo o padrão de
     `1784306040000-SeedAttributesTable.ts` (e o `down` remove esses mesmos registros).
  3. `1784306140000-ChangePriceAndAddCurrencyToItemTables.ts` — uma única migration que
     itera sobre as 5 tabelas (`equipment`, `materials`, `consumables`, `ammunition`,
     `utilities`), seguindo o padrão multi-tabela de
     `1784305690000-AddPrivateInformationToContentTables.ts`. Para cada tabela:
     - Altera o tipo da coluna `price` de `character varying` para `integer`, descartando
       (tornando `NULL`) qualquer valor que não seja um inteiro válido. Ex. de `USING`:
       `ALTER TABLE "<tabela>" ALTER COLUMN "price" TYPE integer USING (CASE WHEN "price" ~ '^[0-9]+$' THEN "price"::integer ELSE NULL END)`.
     - Adiciona a coluna `currency_id uuid` (nullable).
     - Adiciona a constraint de FK `currency_id` → `currencies(id)` com
       `ON DELETE SET NULL ON UPDATE NO ACTION`.
     - O `down` deve reverter: remover a FK, remover a coluna `currency_id` e retornar
       `price` para `character varying` (conversão de volta para texto, sem tentar
       recuperar os valores descartados na subida — consistente com a decisão do spec de
       que não há necessidade de preservação de dados).

#### Controller

**Novo controller de moedas** (`app-api/src/modules/currencies/currencies.controller.ts`):
- Endpoints: `GET /currencies` — lista todas as moedas, sem paginação, ordenadas por
  `abbreviation` (ou `name`, a definir pelo api-dev seguindo o critério já usado em
  `attributes.service.ts`, que ordena por `name`).
- DTOs: `CurrencyResponseDto` (`id`, `abbreviation`, `name`, com `static fromEntity`).
- Acesso Google: read-only (padrão) — mesmo nível já usado em `AttributesController`.
- Módulo (`currencies.module.ts`) registra `TypeOrmModule.forFeature([Currency])`,
  declara `CurrenciesController`/`CurrenciesService` e exporta `CurrenciesService`
  (mesmo padrão de `attributes.module.ts`).

**Alterações nos controllers das 5 entidades de item** — nenhum endpoint novo é
criado; os existentes (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`) são
mantidos, mas os DTOs que eles usam mudam de formato (ver abaixo). Cada um dos 5 módulos
deve injetar o repositório de `Currency` diretamente no seu service (mesmo padrão hoje
usado para `Tag`, sem importar `CurrenciesModule`), adicionando `Currency` ao
`TypeOrmModule.forFeature([...])` de cada `*.module.ts`.

Para cada uma das 5 entidades (`equipment`, `materials`, `consumables`, `ammunition`,
`utilities`), replicar as seguintes alterações (arquivos análogos em cada módulo):

- `dto/create-<entidade>.dto.ts`:
  - `price?: number` — trocar `@IsString()` por `@IsInt({ message: '...' })` (mantendo
    `@IsOptional()`); adicionar validação de não-negativo se fizer sentido (`@Min(0)`).
  - `currencyId?: string` — novo campo, `@IsUUID('4')`, mas com obrigatoriedade
    condicionada ao preenchimento de `price`, via `@ValidateIf` do `class-validator`:
    ```
    @ValidateIf((dto) => dto.price !== undefined && dto.price !== null)
    @IsUUID('4', { message: 'A moeda é obrigatória quando o preço é informado.' })
    currencyId?: string;
    ```
- `dto/update-<entidade>.dto.ts`: continua `extends PartialType(Create<Entidade>Dto)` —
  a validação condicional de `currencyId` permanece válida também na edição, pois avalia
  o `price` do próprio corpo da requisição de update.
  - **Decisão do usuário (posterior ao plano, já implementada)**: ao editar um item e
    apagar o preço que já tinha moeda preenchida (`price` explicitamente `null` no corpo
    do update), a `currency` do registro é limpa junto (setada como `null`),
    independentemente de `currencyId` ter sido enviado ou não na mesma requisição —
    mantendo a regra "moeda obrigatória apenas se há preço" consistente. Implementado no
    `update` dos 5 services: `if (dto.price === null) { entidade.currency = null; } else
    if (dto.currencyId !== undefined) { entidade.currency = await
    this.findCurrencyById(dto.currencyId); }`.
- `entities/<entidade>.entity.ts`: ver seção "Entidade" acima.
- `<entidade>.service.ts`:
  - Injetar `@InjectRepository(Currency) private readonly currencyRepository: Repository<Currency>`.
  - Novo método privado `findCurrencyById(currencyId: string): Promise<Currency>` que
    lança `NotFoundException('Moeda não encontrada.')` caso não exista, seguindo o mesmo
    padrão de `findTagsByIds`.
  - `create`: se `dto.currencyId` informado, resolver via `findCurrencyById`; setar
    `price: dto.price ?? null` e `currency` (entidade resolvida ou `null`).
  - `update`: se `dto.price !== undefined`, atualizar `price`; se `dto.currencyId !== undefined`,
    resolver e atualizar `currency`.
  - `findById`: incluir `currency: true` em `relations` (junto de `tags: true`).
  - `findAllPaginated`: incluir `currency: true` na segunda consulta (`find` com
    `relations`), que hoje só carrega `tags`, para que a listagem também exponha a moeda.
- `dto/<entidade>-response.dto.ts` (detalhe):
  - `price: number | null` (era `string | null`).
  - `currency: CurrencyResponseDto | null` — novo campo, populado a partir de
    `entity.currency` via `CurrencyResponseDto.fromEntity(...)` quando presente, senão
    `null`.
- `dto/<entidade>-list-item-response.dto.ts` (listagem):
  - Hoje não expõe `price`. Deve passar a expor `price: number | null` e
    `currency: CurrencyResponseDto | null`, com o mesmo mapeamento do DTO de detalhe,
    para que a listagem do frontend possa compor "100 PO - Ouro" (ou exibir apenas a
    parte preenchida).
- `dto/paginated-<entidade>-response.dto.ts`: sem alteração estrutural (apenas reflete o
  novo shape do list-item DTO).
- `dto/find-<entidade>-query.dto.ts`: sem alteração — filtros de listagem permanecem
  inalterados (fora de escopo, conforme spec).
- Acesso Google: read-only (padrão) — mantém o nível já configurado em cada um dos 5
  controllers hoje (`@GoogleAccess('read-only')`), sem alteração.

Status: concluído
Entidade:
- app-api/src/modules/currencies/entities/currency.entity.ts (nova)
- app-api/src/modules/equipment/entities/equipment.entity.ts (alterada: price -> integer, + currency ManyToOne)
- app-api/src/modules/materials/entities/material.entity.ts (idem)
- app-api/src/modules/consumables/entities/consumable.entity.ts (idem)
- app-api/src/modules/ammunition/entities/ammunition.entity.ts (idem)
- app-api/src/modules/utilities/entities/utility.entity.ts (idem)
Migration:
- app-api/src/database/migrations/1784306120000-CreateCurrenciesTable.ts
- app-api/src/database/migrations/1784306130000-SeedCurrenciesTable.ts
- app-api/src/database/migrations/1784306140000-ChangePriceAndAddCurrencyToItemTables.ts
Rotas: GET /currencies (novo). Sem rotas novas nas 5 entidades de item — POST /equipment,
GET /equipment, GET /equipment/:id, PUT /equipment/:id, DELETE /equipment/:id (e análogas
para /materials, /consumables, /ammunition, /utilities) mantidas, apenas com DTOs
alterados.
Arquivos:
- app-api/src/modules/currencies/dto/currency-response.dto.ts (novo)
- app-api/src/modules/currencies/currencies.service.ts (novo)
- app-api/src/modules/currencies/currencies.controller.ts (novo)
- app-api/src/modules/currencies/currencies.module.ts (novo)
- app-api/src/app.module.ts (import de CurrenciesModule)
- Para cada uma das 5 entidades de item (equipment, materials, consumables, ammunition,
  utilities): dto/create-<entidade>.dto.ts, dto/update-<entidade>.dto.ts (sem alteração
  de código, apenas herda o novo shape via PartialType), dto/<entidade>-response.dto.ts,
  dto/<entidade>-list-item-response.dto.ts, <entidade>.service.ts, <entidade>.module.ts
  (adição de Currency ao TypeOrmModule.forFeature)
Observação: a decisão do usuário sobre limpar `currency` quando `price` é apagado em uma
edição (ver "Ponto de atenção" acima) já foi implementada nos 5 services e não é mais uma
lacuna em aberto.

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Cobrir na documentação Swagger: novo `@ApiTags('currencies')` e `@ApiOkResponse({ type: [CurrencyResponseDto] })`
  no endpoint `GET /currencies`; atualização dos `@ApiProperty`/`@ApiPropertyOptional` de
  `price` (novo tipo `integer`, exemplo numérico) e do novo campo `currencyId`/`currency`
  (obrigatoriedade condicional documentada em texto, já que `class-validator`/Swagger não
  expressam validação condicional nativamente) em `create`, `update`, response de detalhe
  e response de item de listagem das 5 entidades de item.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima: nova entidade/módulo `currencies`, as 3 migrations (ordem e reversão
  correta via `down`), as alterações de entidade/DTO/service/controller nas 5 entidades de
  item, a validação condicional de moeda, e a documentação Swagger.

## Revisão

Verificações específicas solicitadas:
- **Migrations (1784306120000/1784306130000/1784306140000)**: `up`/`down` conferem
  exatamente com o planejado — tabela `currencies` (uuid, timestamps, `abbreviation`
  varchar not null + índice único, `name` varchar not null) revertida corretamente; seed
  dos 4 registros fixos com `down` fazendo `DELETE` pelos mesmos valores; alteração de
  `price` para `integer` com `USING` descartando não numéricos, `currency_id uuid`
  nullable e FK `ON DELETE SET NULL` nas 5 tabelas, com `down` removendo FK, coluna e
  revertendo `price` para `character varying`, nesta ordem, nas 5 tabelas. Consistente
  com o padrão de `1784306030000-CreateAttributesTable.ts` e
  `1784306050000-AddKeyAttributeToSkillsTable.ts`. Nenhum problema encontrado aqui.
- **Consistência migration ↔ entidade**: `price!: number | null` (`type: 'integer'`) e
  `currency!: Currency | null` (`@ManyToOne(..., { nullable: true, onDelete: 'SET NULL' })`
  com `@JoinColumn({ name: 'currency_id' })`) idênticos nas 5 entidades
  (`equipment.entity.ts`, `material.entity.ts`, `consumable.entity.ts`,
  `ammunition.entity.ts`, `utility.entity.ts`) e refletem exatamente as colunas criadas
  pela migration. Nenhuma divergência encontrada.
- **Validação condicional de `currencyId` via `@ValidateIf` em update (`PartialType`)**:
  confirmado que funciona — `UpdateXDto extends PartialType(CreateXDto)` preserva os
  decorators originais, e o callback do `@ValidateIf` lê `dto.price` do próprio corpo da
  requisição de update (não do estado atual da entidade), exatamente como assumido no
  plano. Nenhum problema encontrado.
- **`price: null` atravessando o `ValidationPipe` global até o service**: confirmado que
  funciona como decidido pelo usuário. `@IsOptional()` do `class-validator` trata
  `null` como valor "vazio" e ignora os demais validadores (`@IsInt()`, `@Min(0)`) nesse
  caso; como `price` não tem `@Type(() => Number)`, o `transform: true` do
  `ValidationPipe` (sem `enableImplicitConversion`) não descarta nem converte o `null`.
  O valor chega intacto ao service, onde `dto.price === null` aciona corretamente
  `entidade.currency = null` nos 5 services (`equipment.service.ts`,
  `materials.service.ts`, `consumables.service.ts`, `ammunition.service.ts`,
  `utilities.service.ts`). Nenhum problema encontrado — a regra de negócio decidida pelo
  usuário é de fato exercitada.
- **Carregamento da relação `currency`**: `findById` e a segunda consulta de
  `findAllPaginated` incluem `currency: true` em `relations` (junto de `tags: true`) nos
  5 services, expondo a moeda tanto no detalhe quanto na listagem. Nenhum problema
  encontrado.

Problemas encontrados:

- **`app-api/src/modules/equipment/dto/create-equipment.dto.ts:45`,
  `app-api/src/modules/materials/dto/create-material.dto.ts:45`,
  `app-api/src/modules/consumables/dto/create-consumable.dto.ts:45`,
  `app-api/src/modules/ammunition/dto/create-ammunition.dto.ts:45`,
  `app-api/src/modules/utilities/dto/create-utility.dto.ts:45`** — o decorator
  `@Min(0)` aplicado a `price` não tem `message` em pt-BR, ao contrário da convenção já
  usada no projeto para `@Min()` em DTOs de criação (ex.:
  `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts:29`,
  `app-api/src/modules/techniques/dto/create-technique.dto.ts:30`,
  `app-api/src/modules/spells/dto/create-spell.dto.ts:30`,
  `app-api/src/modules/talents/dto/create-talent.dto.ts:29`, todos com
  `@Min(1, { message: '...' })`). Sem a mensagem customizada, a resposta de validação
  cairá na mensagem padrão em inglês do `class-validator` ("price must not be less than
  0"), quebrando a convenção de mensagens de erro em pt-BR do `CLAUDE.md`.
  - Trecho: `@Min(0)\n  price?: number;`
  - Sugestão: adicionar mensagem, ex.: `@Min(0, { message: 'O preço não pode ser
    negativo.' })`, replicando nos 5 arquivos.
  - **Status: corrigido.** Adicionado `{ message: 'O preço não pode ser negativo.' }`
    ao `@Min(0)` de `price` nos 5 `create-<entidade>.dto.ts`
    (`equipment`, `materials`, `consumables`, `ammunition`, `utilities`), seguindo
    exatamente o padrão de `create-characteristic.dto.ts`/`create-technique.dto.ts`/
    `create-spell.dto.ts`/`create-talent.dto.ts`.

- **`app-api/src/modules/equipment/equipment.controller.ts` (métodos `create` e
  `update`, e os equivalentes em `materials.controller.ts`,
  `consumables.controller.ts`, `ammunition.controller.ts`,
  `utilities.controller.ts`)** — o `@ApiNotFoundResponse` de `POST /` e `PUT /:id`
  documenta apenas "Uma ou mais tags não foram encontradas" (create) e "Equipamento [ou
  análogo] ou uma ou mais tags não encontrados" (update), mas desde esta task o service
  também pode lançar `NotFoundException('Moeda não encontrada.')` a partir de
  `findCurrencyById` quando `currencyId` é informado e não existe — em ambos os
  fluxos (`create` e `update`), nas 5 entidades. A documentação Swagger ficou
  desatualizada em relação ao comportamento real do endpoint.
  - Trecho: `@ApiNotFoundResponse({ description: 'Uma ou mais tags não foram
    encontradas' })` (create) e `@ApiNotFoundResponse({ description: 'Equipamento ou
    uma ou mais tags não encontrados' })` (update), em `equipment.controller.ts` e nos 4
    controllers análogos.
  - Sugestão: atualizar a descrição para mencionar também a moeda, ex.: "Uma ou mais
    tags não foram encontradas, ou a moeda informada não existe" (create) e
    "Equipamento, uma ou mais tags, ou a moeda informados não foram encontrados"
    (update), replicando nos 5 controllers.
  - Status: corrigido — descrição atualizada em todos os 5 controllers (equipment,
    materials, consumables, ammunition, utilities), tanto para `POST /` quanto para
    `PUT /:id`.

Fora esses dois achados (ambos de documentação/mensagens, não bloqueantes), os demais
itens revisados — nova entidade/módulo `currencies` (`entity`, `dto`, `service`,
`controller`, `module`, registro em `app.module.ts`), alterações de entidade/DTO
(create/update/response/list-item)/service/controller/module nas 5 entidades de item,
guards (`JwtAuthGuard` + `GoogleAccessGuard` + `@GoogleAccess('read-only')` em todos os
6 controllers), ausência de exposição de dados sensíveis, e a documentação Swagger dos
novos campos `price`/`currencyId`/`currency` — estão de acordo com os padrões do
`CLAUDE.md` e com o que foi decidido no `spec.md`.