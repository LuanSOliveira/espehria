# Task API: Reestruturação da entidade Divindade (novas propriedades)

## Contexto
Não existe `.claude/tasks/divindades-propriedades/spec.md`. O planejamento foi feito com
base direta no pedido do usuário e na investigação do código existente em
`app-api/src/modules/divinities/` (entidade `Divinity`, DTOs `CreateDivinityDto`,
`UpdateDivinityDto`, `DivinityResponseDto`, `DivinityListItemResponseDto`,
`divinities.service.ts`, `divinities.controller.ts`) e nas migrations já existentes do
módulo (`1784305510000-CreateDivinitiesTable.ts`,
`1784305550000-AddCategoryToDivinitiesTable.ts`).

Nenhum campo existente da entidade (`name`, `category`, `referenceImage`, `description`,
`tags`) deve ser removido ou ter seu comportamento alterado — esta task apenas adiciona
campos novos, todos nullable/opcionais.

Padrões confirmados no código atual (a serem seguidos nos novos campos):
- Colunas de uma palavra não recebem `name` explícito no `@Column` (ex.: `description`).
  Colunas compostas por múltiplas palavras recebem `name` explícito em snake_case (ex.:
  `referenceImage` → `name: 'reference_image'`, `category` → `name: 'category_id'`), pois
  o projeto não usa `NamingStrategy` automática.
- Campos de texto rico (hoje só `description`) são mapeados como `@Column({ type: 'text', nullable: true })`, armazenam HTML e são validados no DTO apenas com `@IsOptional() @IsString()` — sem `@IsUrl` nem limite de tamanho.
- Campos de texto comum opcionais seguem o mesmo padrão de validação (`@IsOptional() @IsString()`); `referenceImage` é a única exceção que usa `@IsUrl` porque é de fato uma URL validada — os novos campos de texto comum **não** devem usar `@IsUrl`, mesmo `sacredSymbol` (que recebe uma URL de imagem), conforme pedido explícito do usuário de tratá-lo como texto comum.
- `UpdateDivinityDto` é `PartialType(CreateDivinityDto)`, então basta adicionar os campos uma vez no DTO de criação — a atualização os torna opcionais automaticamente.
- `DivinityResponseDto.fromEntity` expõe todos os campos da entidade (inclusive `description`), enquanto `DivinityListItemResponseDto` (usado na listagem paginada) expõe hoje apenas `id`, `referenceImage`, `name`, `category` e `tags` — não inclui `description`.
- Toda alteração de schema requer migration (`synchronize: false`), com nomenclatura `<timestamp>-<NomeDaMigration>.ts` em `src/database/migrations/`; o último timestamp usado no módulo é `1784305550000`, então a nova migration deve usar um timestamp maior (ex.: `1784305560000`).

**Ponto de atenção não coberto pelo pedido (sinalizado, não decidido por conta própria):**
o pedido não especifica se algum dos novos campos deve aparecer também em
`DivinityListItemResponseDto` (a listagem paginada/exibição em cards). Seguindo o padrão
já existente (onde `description`, um campo extenso, só aparece no detalhe via
`DivinityResponseDto`), este plano assume que **nenhum** dos novos campos (nem os de
texto comum, nem os de texto rico) deve ser adicionado à listagem — apenas ao detalhe.
Se essa suposição estiver incorreta, favor confirmar antes da implementação.

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/divinities/entities/divinity.entity.ts
Migration: app-api/src/database/migrations/1784305560000-AddDivinePropertiesToDivinitiesTable.ts
Rotas: POST /divinities, GET /divinities, GET /divinities/categories, GET /divinities/:id, PUT /divinities/:id, DELETE /divinities/:id (nenhuma rota nova; endpoints existentes passam a aceitar/retornar os novos campos via DTOs atualizados)
Arquivos: app-api/src/modules/divinities/dto/create-divinity.dto.ts, app-api/src/modules/divinities/dto/divinity-response.dto.ts, app-api/src/modules/divinities/divinities.service.ts (update-divinity.dto.ts e divinities.controller.ts não precisaram de alteração de código)

#### Entidade
- Entidade: `Divinity` (`app-api/src/modules/divinities/entities/divinity.entity.ts`)
- Campos existentes: mantidos sem alteração (`name`, `category`, `referenceImage`, `description`, `tags`).
- Campos novos — texto comum (`@Column({ type: 'varchar', nullable: true, name: '<snake_case>' })` quando o nome tiver mais de uma palavra; sem `name` explícito quando for uma palavra só):
  - `titles: string | null` (coluna `titles`) — Títulos
  - `alignment: string | null` (coluna `alignment`) — Alinhamento
  - `domainSphere: string | null` (coluna `domain_sphere`) — Esfera de Domínio
  - `primaryElement: string | null` (coluna `primary_element`) — Elemento Primário
  - `sacredSymbol: string | null` (coluna `sacred_symbol`) — Símbolo Sagrado (recebe URL de imagem, mas mapeado e validado como texto comum, não como `referenceImage`)
  - `sacredAnimal: string | null` (coluna `sacred_animal`) — Animal Sagrado
  - `sacredColor: string | null` (coluna `sacred_color`) — Cor Sagrada
- Campos novos — texto rico (`@Column({ type: 'text', nullable: true })`, mesmo padrão de `description`; nome de coluna igual ao nome da propriedade quando for uma palavra só, snake_case explícito quando composto):
  - `personality: string | null` (coluna `personality`) — Personalidade
  - `divineDomains: string | null` (coluna `divine_domains`) — Domínios Divinos
  - `powers: string | null` (coluna `powers`) — Poderes
  - `worldInfluence: string | null` (coluna `world_influence`) — Influência no Mundo
  - `divineAppearance: string | null` (coluna `divine_appearance`) — Aparência Divina
  - `avatars: string | null` (coluna `avatars`) — Avatares
  - `church: string | null` (coluna `church`) — Igreja
  - `cult: string | null` (coluna `cult`) — Culto
  - `blessings: string | null` (coluna `blessings`) — Bênçãos
  - `curses: string | null` (coluna `curses`) — Maldições
  - `legends: string | null` (coluna `legends`) — Lendas
  - `commandments: string | null` (coluna `commandments`) — Mandamentos
  - `oaths: string | null` (coluna `oaths`) — Juramentos
  - `curiosities: string | null` (coluna `curiosities`) — Curiosidades
- Relacionamentos: nenhum novo relacionamento — `category` (ManyToOne) e `tags` (ManyToMany) permanecem inalterados.
- DTOs a atualizar:
  - `CreateDivinityDto`: adicionar os 21 campos acima, todos `@IsOptional() @IsString()` com `@ApiPropertyOptional` (descrição em pt-BR e `example` coerente com cada campo). Não usar `@IsUrl` em `sacredSymbol`.
  - `UpdateDivinityDto`: nenhuma alteração de código necessária — continua `PartialType(CreateDivinityDto)`, já herda os novos campos como opcionais.
  - `DivinityResponseDto`: adicionar os 21 campos como `string | null` com `@ApiPropertyOptional`, e atualizar `fromEntity` para copiá-los da entidade (`dto.titles = divinity.titles`, etc.).
  - `DivinityListItemResponseDto`: sem alterações — conforme suposição documentada no Contexto, os novos campos não entram na listagem, seguindo o padrão atual de `description`.
- Service (`divinities.service.ts`) a atualizar:
  - `create`: incluir os 21 novos campos (com fallback `?? null`) no objeto passado a `divinitiesRepository.create(...)`, no mesmo padrão de `referenceImage`/`description`.
  - `update`: incluir, para cada novo campo, o mesmo padrão condicional já usado (`if (dto.<campo> !== undefined) { divinity.<campo> = dto.<campo>; }`).
  - Nenhuma alteração nas validações de unicidade de nome, categoria ou tags.
- Controller (`divinities.controller.ts`): nenhuma alteração de rota necessária — os endpoints existentes (`POST /divinities`, `PUT /divinities/:id`, `GET /divinities/:id`, `GET /divinities`) já usam os DTOs que serão atualizados, então os novos campos passam a ser aceitos/retornados automaticamente. Não é necessário `@ApiBadRequestResponse` adicional além dos já existentes.

#### Migration
- Necessária: sim.
- Nova migration `ALTER TABLE` sobre a tabela `divinities`, seguindo o padrão de
  `1784305550000-AddCategoryToDivinitiesTable.ts`: nome sugerido
  `AddDivinePropertiesToDivinitiesTable`, timestamp maior que `1784305550000` (ex.:
  `1784305560000`).
- `up`: adicionar as 21 colunas novas via `ALTER TABLE "divinities" ADD "<coluna>" character varying` (para as 7 de texto comum) e `ALTER TABLE "divinities" ADD "<coluna>" text` (para as 14 de texto rico), todas nullable (sem `NOT NULL`, sem `DEFAULT`).
- `down`: `ALTER TABLE "divinities" DROP COLUMN "<coluna>"` para cada uma das 21 colunas, na ordem inversa.
- Não requer backfill de dados (todas nullable, sem uso em índices/constraints).
- Gerar com `npm run migration:generate -- src/database/migrations/AddDivinePropertiesToDivinitiesTable` a partir de dentro de `app-api`, após alterar a entidade, para garantir que o SQL gerado bata exatamente com os tipos/nomes de coluna definidos na entidade.

#### Controller
- Endpoints: nenhum endpoint novo. Os existentes continuam:
  - `POST /divinities`
  - `GET /divinities`
  - `GET /divinities/categories`
  - `GET /divinities/:id`
  - `PUT /divinities/:id`
  - `DELETE /divinities/:id`
- DTOs afetados: `CreateDivinityDto`, `UpdateDivinityDto` (via `PartialType`), `DivinityResponseDto`. `DivinityListItemResponseDto`, `FindDivinitiesQueryDto` e `PaginatedDivinitiesResponseDto` não são afetados por esta demanda.

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Atualizar a documentação Swagger dos DTOs afetados (`@ApiPropertyOptional` com `description` em pt-BR e `example` para cada um dos 21 novos campos em `CreateDivinityDto` e `DivinityResponseDto`), garantindo que `/docs` reflita claramente quais campos são texto comum e quais são texto rico/HTML (mesmo texto de descrição usado hoje para `description`, adaptado a cada campo).
- Conferir se `ApiOperation`/`ApiCreatedResponse`/`ApiOkResponse` do controller continuam corretos (não deveriam precisar de alteração, já que os DTOs referenciados continuam os mesmos).

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima: entidade (`divinity.entity.ts`), migration nova, DTOs
  (`CreateDivinityDto`, `UpdateDivinityDto`, `DivinityResponseDto`), service e controller.
- Confirmar que nenhum campo existente foi removido ou teve comportamento alterado.
- Confirmar que todos os 21 novos campos são nullable/opcionais em entidade, migration,
  create e update.
- Confirmar consistência de nomenclatura de colunas (snake_case explícito apenas onde o
  nome da propriedade tem mais de uma palavra) e que `sacredSymbol` não foi validado como
  URL.
- Confirmar que `DivinityListItemResponseDto` permanece intocado, conforme suposição
  documentada no Contexto (ou revalidar essa suposição junto ao solicitante, se for o
  caso).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/divinities/entities/divinity.entity.ts`,
`app-api/src/database/migrations/1784305560000-AddDivinePropertiesToDivinitiesTable.ts`,
`app-api/src/modules/divinities/dto/create-divinity.dto.ts`,
`app-api/src/modules/divinities/dto/update-divinity.dto.ts`,
`app-api/src/modules/divinities/dto/divinity-response.dto.ts`,
`app-api/src/modules/divinities/dto/divinity-list-item-response.dto.ts`,
`app-api/src/modules/divinities/divinities.service.ts`,
`app-api/src/modules/divinities/divinities.controller.ts`.

Verificações realizadas:
- **Campos existentes preservados**: `name`, `category`, `referenceImage`, `description`
  e `tags` continuam sem alteração de tipo, nullability ou coluna na entidade, DTOs e
  service.
- **21 campos novos nullable/opcionais em todas as camadas**: confirmados como
  `@Column({ ..., nullable: true })` na entidade (`divinity.entity.ts:36-97`), sem
  `NOT NULL`/`DEFAULT` na migration (`1784305560000-...ts:8-53`), como
  `@IsOptional() @IsString()` em `CreateDivinityDto` (todos os 21 campos), herdados
  como opcionais em `UpdateDivinityDto` via `PartialType`, e como `string | null` com
  `@ApiPropertyOptional` em `DivinityResponseDto`.
- **Nomenclatura de colunas**: snake_case explícito (`name: '...'`) usado apenas nos
  campos compostos (`domainSphere` → `domain_sphere`, `primaryElement` →
  `primary_element`, `sacredSymbol` → `sacred_symbol`, `sacredAnimal` →
  `sacred_animal`, `sacredColor` → `sacred_color`, `divineDomains` →
  `divine_domains`, `worldInfluence` → `world_influence`, `divineAppearance` →
  `divine_appearance`), e omitido nos campos de uma palavra (`titles`, `alignment`,
  `personality`, `powers`, `avatars`, `church`, `cult`, `blessings`, `curses`,
  `legends`, `commandments`, `oaths`, `curiosities`) — consistente com o padrão de
  `referenceImage`/`description` já existente no módulo.
- **`sacredSymbol` validado como texto comum**: `create-divinity.dto.ts:77-84` usa
  apenas `@IsOptional() @IsString()`, sem `@IsUrl`, conforme exigido explicitamente.
- **Migration ↔ entidade**: as 21 colunas do `up()` (7 `character varying` para os
  campos de texto comum, 14 `text` para os de texto rico) correspondem exatamente
  aos nomes/tipos/nullability definidos na entidade; o `down()` remove as mesmas 21
  colunas em ordem inversa ao `up()`, revertendo corretamente.
- **`DivinityListItemResponseDto` intocado**: continua expondo apenas `id`,
  `referenceImage`, `name`, `category` e `tags`, sem nenhum dos 21 novos campos —
  consistente com a suposição documentada no Contexto (mesmo padrão já aplicado a
  `description`).
- **Service**: `create()` inclui os 21 campos com fallback `?? null` no mesmo padrão
  de `referenceImage`/`description`; `update()` aplica o padrão condicional
  `if (dto.<campo> !== undefined) { divinity.<campo> = dto.<campo>; }` para cada um
  dos 21 campos, preservando valores existentes quando o campo não é enviado.
- **Controller**: nenhuma rota nova nem alteração necessária; os DTOs atualizados são
  usados nos endpoints existentes sem mudança de assinatura, mantendo
  `@UseGuards(JwtAuthGuard)` e as respostas de erro (`@ApiConflictResponse`,
  `@ApiNotFoundResponse`, `@ApiBadRequestResponse`) já corretas para o
  comportamento do service.
- **Documentação Swagger (etapa 2)**: todos os 21 campos possuem
  `@ApiPropertyOptional` com `description` em pt-BR e `example` coerente, distinguindo
  claramente campos de texto comum dos de texto rico/HTML em `CreateDivinityDto` e
  `DivinityResponseDto`.
- Nenhum dado sensível exposto, nenhuma query concatenando input do usuário, nenhum
  problema de tipagem/compilação identificado.
