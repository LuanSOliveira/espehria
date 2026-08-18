# Task API: Encantamentos e Aprimoramentos em Armaduras, Escudos e Acessórios

## Contexto
Ver .claude/tasks/equipamentos-encantamentos-aprimoramentos/spec.md (se existir)

Não há `spec.md` para esta demanda. O escopo abaixo foi definido diretamente pelo
orquestrador (decisões já fechadas, não reabrir).

Esta task é uma **extensão/refatoração**, não uma implementação do zero. O comportamento
já existe, implementado e revisado, em `weapons` (ver
`.claude/tasks/armas-encantamentos-aprimoramentos/task-api.md`, inclusive a seção
`## Revisão`) e depende conceitualmente de `.claude/tasks/encantamentos-aprimoramentos/task-api.md`
(módulos `enchantments`/`enhancements`, usados apenas como catálogo de preenchimento no
frontend — sem FK).

Estado atual confirmado por leitura direta do código nesta etapa de planejamento:
- `Weapon` (`app-api/src/modules/weapons/entities/weapon.entity.ts`) tem duas colunas
  `jsonb` — `enchantments` e `enhancements` — `@Column({ type: 'jsonb', default: [] })`,
  tipadas com `WeaponEmbeddedEffect` (`app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts`,
  `{ name: string; effect: string | null }`), sem `ManyToOne`/`OneToMany`/FK.
- DTOs de entrada/saída hoje prefixados com "Weapon":
  `app-api/src/modules/weapons/dto/weapon-embedded-effect.dto.ts`
  (`WeaponEmbeddedEffectDto`, entrada: `name` obrigatório `@IsString() @IsNotEmpty()`,
  `effect?` opcional `@IsOptional() @IsString()`) e
  `app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts`
  (`WeaponEmbeddedEffectResponseDto`, saída: `name: string`, `effect: string | null`,
  `static fromEntity`).
- `CreateWeaponDto` (`app-api/src/modules/weapons/dto/create-weapon.dto.ts`) tem
  `enchantments?`/`enhancements?: WeaponEmbeddedEffectDto[]`, ambos
  `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => WeaponEmbeddedEffectDto)`.
  `UpdateWeaponDto` herda via `PartialType(CreateWeaponDto)`, sem código próprio.
- `WeaponResponseDto` (detalhe) expõe `enchantments`/`enhancements` mapeados via
  `WeaponEmbeddedEffectResponseDto.fromEntity`. `WeaponListItemResponseDto` (listagem
  paginada) **não** expõe nenhum dos dois campos — decisão já registrada e revisada na
  task irmã, a ser replicada aqui.
- `WeaponsService.create()` monta os arrays a partir do DTO com fallback
  `(dto.enchantments ?? []).map((item) => ({ name: item.name, effect: item.effect ?? null }))`.
  `WeaponsService.update()` usa `if (dto.enchantments !== undefined) { weapon.enchantments = dto.enchantments.map(...) }`
  — substituição integral quando enviado (mesmo `[]`), preservação quando omitido.
  `findById()`/`findAllPaginated()` não precisam de alteração de query (coluna `jsonb`
  simples, carregada junto com qualquer `find`/`findOne`).
- Migration de referência:
  `app-api/src/database/migrations/1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts`
  — `up()` com dois `ALTER TABLE "weapons" ADD "<coluna>" jsonb NOT NULL DEFAULT '[]'`,
  `down()` com os dois `DROP COLUMN` em ordem inversa. É a **última migration existente
  no repositório até o momento deste plano** (nenhuma migration com timestamp posterior
  a `1784306770000` foi encontrada).
- `app-api/src/common/` hoje contém apenas `entities/base.entity.ts`,
  `variables/pagination.ts`, `utils/ordered-tags.util.ts` e
  `transformers/decimal.transformer.ts` — **não existem ainda** `interfaces/` nem `dto/`
  dentro de `common/`. Convenção adotada para os novos arquivos compartilhados (mesmo
  padrão de nomenclatura já usado dentro dos módulos, ex.: `weapons/interfaces/*.interface.ts`,
  `weapons/dto/*.dto.ts`):
  - `app-api/src/common/interfaces/embedded-effect.interface.ts` → `export interface EmbeddedEffect { name: string; effect: string | null; }`.
  - `app-api/src/common/dto/embedded-effect.dto.ts` → `export class EmbeddedEffectDto` (entrada).
  - `app-api/src/common/dto/embedded-effect-response.dto.ts` → `export class EmbeddedEffectResponseDto` (saída, com `static fromEntity`).
- `Armor` (`app-api/src/modules/armors/entities/armor.entity.ts`), `Shield`
  (`.../shields/entities/shield.entity.ts`) e `Accessory`
  (`.../accessories/entities/accessory.entity.ts`) hoje **não têm** nenhuma coluna
  `jsonb`/`enchantments`/`enhancements`. As três seguem o mesmo esqueleto de `Weapon`
  (`name`, `referenceImage`, `description`, `price`, `currency`, `privateInformation`,
  `tags`), com `Armor`/`Shield` também tendo `nickname`/`volume` e campos próprios de
  categoria/estatísticas; `Accessory` é a mais enxuta (sem `nickname`/`volume`/`traits`).
  Nenhuma das três tem relação com `Enchantment`/`Enhancement`.
- `ArmorsService`/`ShieldsService`/`AccessoriesService` seguem exatamente o mesmo padrão
  de `WeaponsService` para `create()`/`update()`/`findById()`/`findAllPaginated()`
  (`if (dto.campo !== undefined) { entidade.campo = dto.campo; }` para campos simples).
- `ArmorResponseDto`/`ShieldResponseDto`/`AccessoryResponseDto` (detalhe) e
  `ArmorListItemResponseDto`/`ShieldListItemResponseDto`/`AccessoryListItemResponseDto`
  (listagem) seguem o mesmo padrão de `WeaponResponseDto`/`WeaponListItemResponseDto`
  (campos "pesados" como `description`/`privateInformation` presentes no detalhe, mas
  ausentes na listagem — precedente direto para omitir `enchantments`/`enhancements`
  também da listagem das três).
- `ArmorsController`/`ShieldsController`/`AccessoriesController` já aplicam
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a nível de
  controller — confirmado por leitura direta, nenhuma alteração necessária.

Decisões já tomadas pelo orquestrador (não reabrir):
1. Extrair `WeaponEmbeddedEffect`/`WeaponEmbeddedEffectDto`/`WeaponEmbeddedEffectResponseDto`
   para `app-api/src/common/` como `EmbeddedEffect`/`EmbeddedEffectDto`/`EmbeddedEffectResponseDto`,
   refatorar `weapons` para consumir os compartilhados e remover os três arquivos
   prefixados com `weapon-embedded-effect*` — sem alterar contrato de API nem schema de
   banco, sem migration nova por causa dessa refatoração.
2. Adicionar `enchantments`/`enhancements` (`jsonb NOT NULL DEFAULT '[]'`, array de
   `{ name, effect }`, sem FK) às tabelas `armors`, `shields` e `accessories`, com a
   mesma modelagem de `weapons`.
3. Uma única migration cobrindo as três tabelas, timestamp posterior a
   `1784306770000`, `down()` removendo as seis colunas.
4. DTOs de create/update dos três módulos com `enchantments?`/`enhancements?` opcionais,
   validados com `@IsArray() @ValidateNested({ each: true }) @Type(() => EmbeddedEffectDto) @IsOptional()`,
   expostos no DTO de resposta de detalhe via `fromEntity`, **omitidos** da listagem
   paginada (mesma decisão de `weapons`).
5. Semântica de update idêntica a `weapons`: enviar substitui o array inteiro, omitir
   preserva o valor atual.
6. Nenhuma mudança de permissão: os três controllers já usam `JwtAuthGuard` +
   `GoogleAccessGuard` + `@GoogleAccess('read-only')` — confirmado acima.
7. Mensagens de erro em pt-BR (nenhuma mensagem nova é introduzida por esta demanda além
   das já existentes de validação — `class-validator` já cobre `name`/`effect` de cada
   item embutido).

## Etapas

### 1. api-dev

#### Entidade

Parte A — refatoração compartilhada (sem mudança de contrato/schema):
- Criar `app-api/src/common/interfaces/embedded-effect.interface.ts`:
  ```ts
  export interface EmbeddedEffect {
    name: string;
    effect: string | null;
  }
  ```
- Criar `app-api/src/common/dto/embedded-effect.dto.ts` (`EmbeddedEffectDto`, entrada),
  conteúdo idêntico ao atual `WeaponEmbeddedEffectDto` (mesmos decorators, mesmo
  `example`/`description`), apenas renomeando a classe.
- Criar `app-api/src/common/dto/embedded-effect-response.dto.ts`
  (`EmbeddedEffectResponseDto`, saída, com `static fromEntity(item: EmbeddedEffect): EmbeddedEffectResponseDto`),
  conteúdo idêntico ao atual `WeaponEmbeddedEffectResponseDto`, apenas renomeando a
  classe e o tipo de entrada do `fromEntity` (de `WeaponEmbeddedEffect` para
  `EmbeddedEffect`).
- Remover os três arquivos antigos: `app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts`,
  `app-api/src/modules/weapons/dto/weapon-embedded-effect.dto.ts`,
  `app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts`.
- Atualizar `Weapon` (`weapon.entity.ts`): trocar o `import type { WeaponEmbeddedEffect }`
  por `import type { EmbeddedEffect } from '../../../common/interfaces/embedded-effect.interface'`
  e o `import { WeaponEmbeddedEffectResponseDto }` (usado só no `@ApiProperty({ type: () => [...] })`
  de `enchantments`/`enhancements`) por
  `import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto'`.
  Tipos das colunas passam de `WeaponEmbeddedEffect[]` para `EmbeddedEffect[]`. Nenhuma
  mudança de `@Column(...)`, nome de coluna, `default` ou `nullable` — é renomeação
  pura de tipo/import.
- Atualizar `CreateWeaponDto` (`create-weapon.dto.ts`): trocar
  `import { WeaponEmbeddedEffectDto } from './weapon-embedded-effect.dto'` por
  `import { EmbeddedEffectDto } from '../../../common/dto/embedded-effect.dto'`; os
  campos `enchantments?`/`enhancements?` passam a ser tipados/anotados com
  `EmbeddedEffectDto`/`() => [EmbeddedEffectDto]` no lugar de `WeaponEmbeddedEffectDto`.
  Mesmos decorators (`@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EmbeddedEffectDto)`),
  mesma `description`. `UpdateWeaponDto` continua sem alteração (`PartialType` propaga
  o novo tipo automaticamente).
- Atualizar `WeaponResponseDto` (`weapon-response.dto.ts`): trocar
  `import { WeaponEmbeddedEffectResponseDto } from './weapon-embedded-effect-response.dto'`
  por `import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto'`;
  os campos `enchantments`/`enhancements` passam a ser `EmbeddedEffectResponseDto[]` e o
  `fromEntity` chama `EmbeddedEffectResponseDto.fromEntity(item)` no lugar de
  `WeaponEmbeddedEffectResponseDto.fromEntity(item)`. Mesma `description`.
- `WeaponsService` (`weapons.service.ts`): nenhuma alteração de lógica — `create()`/
  `update()` continuam montando `{ name: item.name, effect: item.effect ?? null }` a
  partir de `dto.enchantments`/`dto.enhancements`; o tipo desses campos muda
  transitivamente para `EmbeddedEffectDto[]` via `CreateWeaponDto`/`UpdateWeaponDto`,
  sem exigir nenhuma edição direta no `.ts` do service.
- `WeaponListItemResponseDto`: sem alteração (não referencia os tipos renomeados).
- Confirmar por leitura, ao final, que nenhuma outra referência a
  `WeaponEmbeddedEffect`/`WeaponEmbeddedEffectDto`/`WeaponEmbeddedEffectResponseDto`
  restou no código (`grep` pelo prefixo antes de finalizar a etapa).

Parte B — novas colunas em `armors`/`shields`/`accessories` (entidade alterada, não
criação de entidade nova):
- Entidades alteradas: `Armor` (tabela `armors`), `Shield` (tabela `shields`),
  `Accessory` (tabela `accessories`).
- Novos campos (idênticos nas três, mesma modelagem de `Weapon.enchantments`/`Weapon.enhancements`):
  - `enchantments: EmbeddedEffect[]` — `@Column({ type: 'jsonb', default: [] })`, sem
    `nullable`, sem `name` customizado de coluna.
  - `enhancements: EmbeddedEffect[]` — idêntico, coluna `enhancements`.
  - Anotar ambos com `@ApiProperty({ type: () => [EmbeddedEffectResponseDto], description: '...' })`
    no mesmo estilo já usado em `Weapon.enchantments`/`Weapon.enhancements`, com o texto
    de `description` adaptado para "armadura"/"escudo"/"acessório" em cada entidade.
  - Import: `import type { EmbeddedEffect } from '../../../common/interfaces/embedded-effect.interface';`
    e `import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';`
    em cada um dos três arquivos de entidade.
- Relacionamentos: nenhum. Sem FK com `Enchantment`/`Enhancement`, mesma justificativa
  já usada em `Weapon` (cópia de dados no momento da escolha no formulário, não
  referência viva ao catálogo).
- `autoLoadEntities: true` já cobre as três entidades (nenhuma alteração de registro).

#### Migration

- Necessária: sim (`synchronize: false`; alteração de schema em três tabelas).
- Uma única migration cobrindo as três tabelas, seguindo exatamente o padrão de
  `1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts`:
  - Nome sugerido: `AddEnchantmentsAndEnhancementsToEquipmentTables`.
  - Timestamp: deve ser posterior a `1784306770000` (última migration existente hoje no
    repositório). Ao gerar/escrever o arquivo, o `api-dev` deve conferir o estado mais
    recente de `src/database/migrations/` no momento da implementação para evitar
    colisão de timestamp — nenhuma outra migration com timestamp maior foi encontrada
    nesta investigação, mas a checagem final cabe à implementação.
  - `up()`, seis `ALTER TABLE`, na ordem `armors` → `shields` → `accessories` (ordem
    arbitrária mas estável, mesma ordem usada no `down()` em reverso):
    ```sql
    ALTER TABLE "armors" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "armors" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "shields" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "shields" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "accessories" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "accessories" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'
    ```
  - `down()`, ordem inversa (`accessories` → `shields` → `armors`, `enhancements` antes
    de `enchantments` em cada tabela, espelhando `1784306770000`):
    ```sql
    ALTER TABLE "accessories" DROP COLUMN "enhancements"
    ALTER TABLE "accessories" DROP COLUMN "enchantments"
    ALTER TABLE "shields" DROP COLUMN "enhancements"
    ALTER TABLE "shields" DROP COLUMN "enchantments"
    ALTER TABLE "armors" DROP COLUMN "enhancements"
    ALTER TABLE "armors" DROP COLUMN "enchantments"
    ```
  - Sem `CREATE TYPE`/enum, sem `CREATE INDEX`/`CONSTRAINT` (mesma justificativa de
    `weapons`: sem unicidade nem FK a declarar).
  - Nota de sequência explícita pelo orquestrador: as migrations `1784306750000`
    (`CreateEnchantmentsTable`), `1784306760000` (`CreateEnhancementsTable`) e
    `1784306770000` (`AddEnchantmentsAndEnhancementsToWeaponsTable`) ainda **não foram
    executadas** contra o banco no momento deste plano. A nova migration não tem FK com
    nenhuma delas (mesma independência já documentada para `1784306770000`), mas deve
    ser escrita e testada assumindo que será aplicada **em sequência, depois** das três
    — sem pressupor que `armors`/`shields`/`accessories` já tenham as colunas
    (idempotência não é necessária; é uma migration de `ADD COLUMN` simples).

#### Controller

Nenhum endpoint novo em nenhum dos três módulos — `ArmorsController`, `ShieldsController`
e `AccessoriesController` já expõem `POST /armors|/shields|/accessories`, `GET .../`,
`GET .../:id`, `PUT .../:id`, `DELETE .../:id`. A mudança é os DTOs de entrada/saída de
`POST`/`GET :id`/`PUT` passarem a aceitar/retornar os dois novos campos, replicando
exatamente o tratamento dado a `weapons`.

- Endpoints afetados (sem mudança de rota/método), replicado para os três módulos:
  - `POST /armors` (`/shields`, `/accessories`) — `CreateArmorDto`/`CreateShieldDto`/
    `CreateAccessoryDto` passam a aceitar `enchantments?`/`enhancements?`.
  - `PUT .../:id` — `UpdateArmorDto`/`UpdateShieldDto`/`UpdateAccessoryDto` (via
    `PartialType(Create*Dto)`) herdam os dois campos automaticamente como opcionais —
    nenhuma alteração direta necessária nos três `update-*.dto.ts`.
  - `GET .../:id` — `ArmorResponseDto`/`ShieldResponseDto`/`AccessoryResponseDto`
    passam a retornar `enchantments`/`enhancements`.
  - `GET /armors` (`/shields`, `/accessories`) — **decisão replicada de `weapons`**:
    `enchantments`/`enhancements` **não** aparecem em `ArmorListItemResponseDto`/
    `ShieldListItemResponseDto`/`AccessoryListItemResponseDto`. Justificativa: as três
    listagens já omitem `description`/`privateInformation` (campos "pesados"), mantendo
    só os campos usados em cards/linhas de tabela — mesmo padrão que motivou a omissão
    em `WeaponListItemResponseDto`.
- DTOs alterados (nenhum DTO novo por módulo — os compartilhados de `common/dto/` já
  cobrem o tipo do item; a alteração é adicionar os dois campos de array em cada DTO
  existente):
  - `CreateArmorDto` (`app-api/src/modules/armors/dto/create-armor.dto.ts`),
    `CreateShieldDto` (`.../shields/dto/create-shield.dto.ts`), `CreateAccessoryDto`
    (`.../accessories/dto/create-accessory.dto.ts`) — dois novos campos opcionais cada,
    mesmo padrão de `CreateWeaponDto`:
    ```ts
    @ApiPropertyOptional({
      type: () => [EmbeddedEffectDto],
      description:
        'Encantamentos da <armadura|do escudo|do acessório>: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada. Cada item deve conter um nome (obrigatório) e um efeito opcional',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmbeddedEffectDto)
    enchantments?: EmbeddedEffectDto[];
    ```
    Idêntico para `enhancements?` (texto mencionando "Aprimoramentos"/`Enhancement`).
    Import: `import { EmbeddedEffectDto } from '../../../common/dto/embedded-effect.dto';`
    em cada um dos três arquivos.
  - `UpdateArmorDto`/`UpdateShieldDto`/`UpdateAccessoryDto` — nenhuma alteração de
    código (`PartialType(Create*Dto)` já propaga os dois novos campos como opcionais).
  - `ArmorResponseDto`/`ShieldResponseDto`/`AccessoryResponseDto` — dois novos campos e
    mapeamento em `fromEntity`, mesmo padrão de `WeaponResponseDto`:
    ```ts
    @ApiProperty({
      type: () => [EmbeddedEffectResponseDto],
      description:
        'Encantamentos da <armadura|do escudo|do acessório>: cópia independente de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK com a entidade Enchantment. Ordem de inserção preservada',
    })
    enchantments: EmbeddedEffectResponseDto[];
    ```
    Idêntico para `enhancements`. Em `fromEntity`:
    ```ts
    dto.enchantments = (entidade.enchantments ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.enhancements = (entidade.enhancements ?? []).map((item) =>
      EmbeddedEffectResponseDto.fromEntity(item),
    );
    ```
    Import: `import { EmbeddedEffectResponseDto } from '../../../common/dto/embedded-effect-response.dto';`
    em cada um dos três arquivos.
  - `ArmorListItemResponseDto`/`ShieldListItemResponseDto`/`AccessoryListItemResponseDto`
    — sem alteração (decisão acima).
- `ArmorsService`/`ShieldsService`/`AccessoriesService`:
  - `create()`: montar os arrays a partir do DTO ao construir o objeto passado para
    `<repositorio>.create({...})`, mesmo padrão de `WeaponsService.create()`:
    ```ts
    enchantments: (dto.enchantments ?? []).map((item) => ({
      name: item.name,
      effect: item.effect ?? null,
    })),
    enhancements: (dto.enhancements ?? []).map((item) => ({
      name: item.name,
      effect: item.effect ?? null,
    })),
    ```
  - `update()`: seguir o padrão `if (dto.campo !== undefined) { entidade.campo = ...; }`
    já usado para os demais campos opcionais simples em cada service (nenhum dos três
    tem child rows/FK envolvidas em `enchantments`/`enhancements`, então não se aplica o
    padrão de remoção explícita usado para `alternativeDamages`/`extraDamages` em
    `weapons` — aqui basta reatribuir o valor da coluna `jsonb`, igual ao que
    `WeaponsService.update()` já faz para os mesmos dois campos):
    ```ts
    if (dto.enchantments !== undefined) {
      entidade.enchantments = dto.enchantments.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    if (dto.enhancements !== undefined) {
      entidade.enhancements = dto.enhancements.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    ```
    Isso implementa a semântica pedida: substituição integral quando o campo é enviado
    (mesmo `[]` substitui o conteúdo anterior por vazio), preservação do valor atual
    quando omitido (`undefined`).
  - `findById()`/`findAllPaginated()`: nenhuma alteração de query necessária — colunas
    `jsonb` simples são carregadas automaticamente com qualquer `find`/`findOne`/
    `createQueryBuilder(...).getMany()` das três entidades, exatamente como já acontece
    hoje com `description`/`privateInformation`.
- `ArmorsController`/`ShieldsController`/`AccessoriesController`: nenhuma mudança de
  assinatura de método (os DTOs já cobrem os novos campos automaticamente via
  `@Body()`/serialização de resposta). Os textos de `@ApiBadRequestResponse` de
  `create`/`update` devem passar a mencionar a nova causa de erro de validação (nome
  ausente/vazio dentro de um item de `enchantments`/`enhancements`) — detalhamento fica
  a cargo da etapa 2 (`api-dev-doc`), mesma divisão de trabalho já usada em `weapons`.
- Acesso Google: **read-only (padrão)** — nenhuma mudança. Os três controllers já
  aplicam `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a
  nível de controller (confirmado por leitura direta nesta etapa de planejamento);
  `create`/`update` (únicos métodos que gravam os novos campos) já ficam bloqueados para
  usuários `provider: 'google'` por esses guards existentes.

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir, para `app-api/src/common/dto/embedded-effect.dto.ts` e
  `embedded-effect-response.dto.ts`: `@ApiProperty`/`@ApiPropertyOptional` completos
  (mesmo nível de detalhe que existia em `WeaponEmbeddedEffectDto`/
  `WeaponEmbeddedEffectResponseDto` antes da refatoração — `name` com exemplo de
  encantamento/aprimoramento, `effect` com `description` deixando claro que o campo
  suporta HTML).
- Atualizar as descrições de `enchantments`/`enhancements` em `CreateArmorDto`/
  `CreateShieldDto`/`CreateAccessoryDto` e `ArmorResponseDto`/`ShieldResponseDto`/
  `AccessoryResponseDto` para deixar claro que são cópias independentes (sem vínculo/FK)
  dos catálogos de Encantamentos (`enchantments`) e Aprimoramentos (`enhancements`), com
  ordem de inserção preservada — mesmo texto de referência usado em `weapons`.
- Atualizar os textos de `@ApiBadRequestResponse` de `create`/`update` em
  `armors.controller.ts`, `shields.controller.ts` e `accessories.controller.ts` para
  incluir a nova causa de erro de validação: nome ausente/vazio em algum item de
  `enchantments`/`enhancements` (mesmo estilo usado em `weapons.controller.ts`).
- Conferir que o Swagger de `GET .../:id` (armaduras, escudos, acessórios) reflita os
  dois novos arrays e que a listagem paginada de cada um não os exponha, documentando
  essa omissão de forma consistente com a de `description`/`privateInformation` já
  omitidos na listagem hoje.
- Confirmar que a refatoração de `weapons` (Parte A da etapa 1) não deixou nenhuma
  referência residual a `WeaponEmbeddedEffect`/`WeaponEmbeddedEffectDto`/
  `WeaponEmbeddedEffectResponseDto` em textos de Swagger (`@ApiProperty`/
  `@ApiOperation`/exemplos) nos arquivos de `weapons`.

Status (etapa 2 — api-dev-doc): concluído

Arquivos alterados (documentação Swagger):
- app-api/src/common/dto/embedded-effect.dto.ts (ajuste de exemplo para ser neutro)
- app-api/src/common/dto/embedded-effect-response.dto.ts (ajuste de exemplo para ser neutro)
- app-api/src/modules/armors/armors.controller.ts (@ApiBadRequestResponse atualizado em create/update)
- app-api/src/modules/shields/shields.controller.ts (@ApiBadRequestResponse atualizado em create/update)
- app-api/src/modules/accessories/accessories.controller.ts (@ApiBadRequestResponse atualizado em create/update)

Confirmações:
- Os DTOs em common/dto/ têm @ApiProperty/@ApiPropertyOptional completos com exemplos neutros (não específicos de arma)
- As descrições de enchantments/enhancements em CreateArmorDto/CreateShieldDto/CreateAccessoryDto e ArmorResponseDto/ShieldResponseDto/AccessoryResponseDto já estavam presentes e indicam cópias independentes
- Os @ApiBadRequestResponse de create/update agora mencionam "nome ausente/vazio em algum item de encantamentos/aprimoramentos", replicando exatamente o padrão de weapons.controller.ts
- GET /:id (armaduras, escudos, acessórios) expõe os dois novos arrays via DTOs de resposta de detalhe
- GET (listagem paginada) dos três não expõe enchantments/enhancements, consistente com weapons
- Nenhuma referência residual a WeaponEmbeddedEffect*/weapon-embedded-effect* encontrada no código (confirmado por grep)

### 3. api-dev-codereviewer

Status (etapa 3 — api-dev-codereviewer): concluído

- Revisar tudo acima, com atenção especial a:
  - A refatoração de `weapons` para os tipos compartilhados não alterou nenhum contrato
    de API (mesmos nomes de campo JSON, mesmas validações, mesmas mensagens) nem gerou
    migration nova.
  - As seis novas colunas (`armors`/`shields`/`accessories` × `enchantments`/
    `enhancements`) batem 1:1 entre entidade e migration (tipo `jsonb`, `NOT NULL
    DEFAULT '[]'`, `down()` na ordem inversa correta).
  - A semântica de update (substituição integral quando enviado, preservação quando
    omitido) está implementada de forma idêntica nos três services.
  - `enchantments`/`enhancements` aparecem no DTO de resposta de detalhe das três
    entidades e estão ausentes dos três DTOs de listagem, consistente com `weapons`.
  - Nenhuma mudança de guard/permissão nos três controllers.

Status (etapa 1 — api-dev): concluído, com uma ressalva de ferramenta (ver nota abaixo).

Entidades alteradas:
- app-api/src/modules/weapons/entities/weapon.entity.ts (refatoração de tipo/import, sem mudança de schema)
- app-api/src/modules/armors/entities/armor.entity.ts (novas colunas enchantments/enhancements)
- app-api/src/modules/shields/entities/shield.entity.ts (novas colunas enchantments/enhancements)
- app-api/src/modules/accessories/entities/accessory.entity.ts (novas colunas enchantments/enhancements)

Migration: app-api/src/database/migrations/1784306780000-AddEnchantmentsAndEnhancementsToEquipmentTables.ts
(classe AddEnchantmentsAndEnhancementsToEquipmentTables1784306780000; timestamp posterior
ao maior existente no repositório no momento da implementação, 1784306770000; conferido
por leitura direta do diretório — nenhuma colisão)

Rotas: nenhuma rota nova. Contrato de POST/PUT/GET :id de /armors, /shields e
/accessories passa a incluir enchantments/enhancements; GET (listagem paginada) dos três
continua sem esses campos, replicando a decisão já usada em /weapons.

Arquivos criados:
- app-api/src/common/interfaces/embedded-effect.interface.ts (EmbeddedEffect)
- app-api/src/common/dto/embedded-effect.dto.ts (EmbeddedEffectDto)
- app-api/src/common/dto/embedded-effect-response.dto.ts (EmbeddedEffectResponseDto)
- app-api/src/database/migrations/1784306780000-AddEnchantmentsAndEnhancementsToEquipmentTables.ts

Arquivos alterados:
- app-api/src/modules/weapons/entities/weapon.entity.ts
- app-api/src/modules/weapons/dto/create-weapon.dto.ts
- app-api/src/modules/weapons/dto/weapon-response.dto.ts
- app-api/src/modules/armors/entities/armor.entity.ts
- app-api/src/modules/armors/dto/create-armor.dto.ts
- app-api/src/modules/armors/dto/armor-response.dto.ts
- app-api/src/modules/armors/armors.service.ts
- app-api/src/modules/shields/entities/shield.entity.ts
- app-api/src/modules/shields/dto/create-shield.dto.ts
- app-api/src/modules/shields/dto/shield-response.dto.ts
- app-api/src/modules/shields/shields.service.ts
- app-api/src/modules/accessories/entities/accessory.entity.ts
- app-api/src/modules/accessories/dto/create-accessory.dto.ts
- app-api/src/modules/accessories/dto/accessory-response.dto.ts
- app-api/src/modules/accessories/accessories.service.ts

Arquivos que deveriam ser removidos (não foi possível excluir — ver nota de ferramenta
abaixo), esvaziados/neutralizados (conteúdo zerado, sem exports, nenhuma referência
restante no código-fonte, confirmado por grep):
- app-api/src/modules/weapons/dto/weapon-embedded-effect.dto.ts
- app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts
- app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts

Nota de ferramenta (pendência para o orquestrador/usuário): o agente api-dev desta
execução só tem acesso a Read/Grep/Glob/Edit/Write/Skill — nenhuma dessas ferramentas
permite excluir um arquivo do sistema de arquivos. Os três arquivos acima foram
esvaziados (conteúdo em branco) para não deixar código morto funcional, mas continuam
existindo fisicamente no repositório com 0 bytes. É necessário que alguém com acesso a
exclusão de arquivo (Bash `rm`/equivalente) remova esses três arquivos fisicamente para
concluir a Parte A da refatoração conforme especificado.

Nenhuma migration nova foi gerada pela refatoração de weapons (Parte A) — confirmado:
`weapons` manteve exatamente as mesmas colunas jsonb (`enchantments`/`enhancements`,
mesmo nome, tipo, default), apenas o tipo/import TypeScript mudou.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

**Parte A — refatoração (extração dos DTOs compartilhados)**
- `app-api/src/common/interfaces/embedded-effect.interface.ts`,
  `app-api/src/common/dto/embedded-effect.dto.ts` e
  `app-api/src/common/dto/embedded-effect-response.dto.ts`: conteúdo idêntico ao que
  antes existia em `weapons` (mesmos decorators `class-validator`, mesmos `@ApiProperty`/
  `@ApiPropertyOptional`, mesmo `fromEntity`), apenas renomeados e com exemplos
  neutralizados (não específicos de arma) — refatoração pura, sem mudança de contrato.
  Localização em `common/interfaces/` e `common/dto/` respeita a convenção real do
  diretório (mesmo padrão de nomenclatura de `weapons/interfaces/*.interface.ts` e
  `weapons/dto/*.dto.ts`, apenas movido para o nível compartilhado).
- `app-api/src/modules/weapons/entities/weapon.entity.ts`,
  `app-api/src/modules/weapons/dto/create-weapon.dto.ts` e
  `app-api/src/modules/weapons/dto/weapon-response.dto.ts`: todos os usos de
  `WeaponEmbeddedEffect`/`WeaponEmbeddedEffectDto`/`WeaponEmbeddedEffectResponseDto`
  foram substituídos pelos tipos compartilhados (`EmbeddedEffect`/`EmbeddedEffectDto`/
  `EmbeddedEffectResponseDto`), sem alteração de `@Column(...)` (nome de coluna, tipo
  `jsonb`, `default: []` preservados), sem alteração de decorators de validação em
  `CreateWeaponDto` (`@IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => EmbeddedEffectDto)`), sem alteração de `description`/exemplo visível ao
  cliente da API, e sem alteração de `WeaponsService.create()`/`update()` (que já
  dependiam apenas do shape `{ name, effect }`, agnóstico ao nome do tipo). Contrato de
  `POST`/`PUT`/`GET :id` de `/weapons` permanece idêntico (mesmos nomes de campo JSON,
  mesmas validações, mesmas mensagens de erro).
- Confirmado por `grep` recursivo em `app-api/` que não resta nenhuma referência a
  `WeaponEmbeddedEffect`/`weapon-embedded-effect` em código-fonte, testes, barrels ou
  módulos. Os três arquivos legados (`weapon-embedded-effect.dto.ts`,
  `weapon-embedded-effect-response.dto.ts`, `weapon-embedded-effect.interface.ts`) não
  existem mais fisicamente no repositório — a "nota de ferramenta" registrada pela etapa
  1 (arquivos esvaziados de 0 bytes por falta de permissão de exclusão) está desatualizada
  em relação ao estado atual: os três arquivos foram efetivamente removidos em algum
  momento após aquele registro, e o `Glob`/`grep` confirmam que não há mais vestígio
  deles nem de suas referências. Não é um problema de revisão, apenas uma observação para
  manter a task atualizada.
- Nenhuma migration nova foi gerada pela refatoração de `weapons`, consistente com o
  esperado (mudança puramente de tipo/import TypeScript, sem alteração de schema).

**Parte B — extensão (armors, shields, accessories)**
- `app-api/src/database/migrations/1784306780000-AddEnchantmentsAndEnhancementsToEquipmentTables.ts`:
  seis `ALTER TABLE ... ADD "enchantments"/"enhancements" jsonb NOT NULL DEFAULT '[]'` em
  `up()` (ordem `armors` → `shields` → `accessories`, `enchantments` antes de
  `enhancements` em cada tabela) e seis `DROP COLUMN` em `down()` na ordem inversa exata
  (`accessories` → `shields` → `armors`, `enhancements` antes de `enchantments`),
  espelhando fielmente `1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts`.
  Batem 1:1 com as colunas declaradas em `Armor`, `Shield` e `Accessory`
  (`@Column({ type: 'jsonb', default: [] })`, sem `nullable`, sem nome de coluna
  customizado) — nome, tipo e "not null + default" consistentes entre entidade e
  migration nas três tabelas.
- Timestamp `1784306780000` é maior que o maior timestamp existente no repositório
  (`1784306770000`) e não colide com nenhum outro arquivo de migration (confirmado por
  `Glob` no diretório `src/database/migrations/`). A migration só executa `ALTER TABLE`
  em `armors`/`shields`/`accessories`, sem qualquer referência a `enchantments`/
  `enhancements` (tabelas criadas por `1784306750000`/`1784306760000`) — não há
  dependência quebrada mesmo essas três migrations anteriores ainda não tendo sido
  executadas contra o banco; a ordem sequencial por timestamp é suficiente.
- Nenhuma das três entidades (`Armor`, `Shield`, `Accessory`) declara `ManyToOne`/
  `OneToMany`/FK para `Enchantment`/`Enhancement` — confirmado por leitura direta, mesma
  modelagem de "cópia de dados" já usada em `Weapon`.
- DTOs de entrada (`CreateArmorDto`, `CreateShieldDto`, `CreateAccessoryDto`): campos
  `enchantments?`/`enhancements?: EmbeddedEffectDto[]` com
  `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EmbeddedEffectDto)`,
  idêntico ao padrão de `CreateWeaponDto`. Sob o `ValidationPipe` global
  (`whitelist`/`forbidNonWhitelisted`/`transform`), a validação aninhada funciona
  corretamente graças ao `@Type(() => EmbeddedEffectDto)` (necessário para
  `class-transformer` instanciar os itens do array antes do `class-validator` aplicar
  `@IsString()/@IsNotEmpty()` em `name` e `@IsOptional()/@IsString()` em `effect` de cada
  item). `UpdateArmorDto`/`UpdateShieldDto`/`UpdateAccessoryDto` herdam via
  `PartialType(Create*Dto)`, sem código próprio — comportamento correto.
- Semântica de update idêntica a `weapons` nos três services: em `create()`, os arrays
  são montados com `(dto.campo ?? []).map((item) => ({ name: item.name, effect:
  item.effect ?? null }))`; em `update()`, `if (dto.campo !== undefined) { entidade.campo
  = dto.campo.map(...) }` — substituição integral (mesmo `[]`) quando o campo é enviado,
  preservação do valor atual quando omitido. Verificado em `armors.service.ts`,
  `shields.service.ts` e `accessories.service.ts`.
- `ArmorResponseDto`/`ShieldResponseDto`/`AccessoryResponseDto` (detalhe) expõem
  `enchantments`/`enhancements` mapeados via `EmbeddedEffectResponseDto.fromEntity` em
  `fromEntity`. `ArmorListItemResponseDto`/`ShieldListItemResponseDto`/
  `AccessoryListItemResponseDto` (listagem paginada) não expõem nenhum dos dois campos —
  consistente com a decisão já revisada em `weapons`.
- Nenhuma mudança de guard/permissão: `ArmorsController`, `ShieldsController` e
  `AccessoriesController` continuam com `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` a nível de controller, cobrindo `create`/`update` (únicos
  métodos que gravam os novos campos).
- Mensagens de erro em pt-BR consistentes com o restante do projeto; os
  `@ApiBadRequestResponse` de `create`/`update` dos três controllers foram atualizados
  para mencionar "nome ausente/vazio em algum item de encantamentos/aprimoramentos",
  replicando o texto usado em `weapons.controller.ts`.

Arquivos revisados (Parte A): `app-api/src/common/interfaces/embedded-effect.interface.ts`,
`app-api/src/common/dto/embedded-effect.dto.ts`,
`app-api/src/common/dto/embedded-effect-response.dto.ts`,
`app-api/src/modules/weapons/entities/weapon.entity.ts`,
`app-api/src/modules/weapons/dto/create-weapon.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-response.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts`,
`app-api/src/modules/weapons/weapons.controller.ts`.

Arquivos revisados (Parte B): `app-api/src/database/migrations/1784306780000-AddEnchantmentsAndEnhancementsToEquipmentTables.ts`,
`app-api/src/modules/armors/entities/armor.entity.ts`,
`app-api/src/modules/armors/dto/create-armor.dto.ts`,
`app-api/src/modules/armors/dto/update-armor.dto.ts`,
`app-api/src/modules/armors/dto/armor-response.dto.ts`,
`app-api/src/modules/armors/dto/armor-list-item-response.dto.ts`,
`app-api/src/modules/armors/armors.service.ts`,
`app-api/src/modules/armors/armors.controller.ts`,
`app-api/src/modules/shields/entities/shield.entity.ts`,
`app-api/src/modules/shields/dto/create-shield.dto.ts`,
`app-api/src/modules/shields/dto/shield-response.dto.ts`,
`app-api/src/modules/shields/dto/shield-list-item-response.dto.ts`,
`app-api/src/modules/shields/shields.service.ts`,
`app-api/src/modules/shields/shields.controller.ts`,
`app-api/src/modules/accessories/entities/accessory.entity.ts`,
`app-api/src/modules/accessories/dto/create-accessory.dto.ts`,
`app-api/src/modules/accessories/dto/accessory-response.dto.ts`,
`app-api/src/modules/accessories/dto/accessory-list-item-response.dto.ts`,
`app-api/src/modules/accessories/accessories.service.ts`,
`app-api/src/modules/accessories/accessories.controller.ts`,
`app-api/src/database/migrations/1784306750000-CreateEnchantmentsTable.ts`,
`app-api/src/database/migrations/1784306760000-CreateEnhancementsTable.ts`,
`app-api/src/database/migrations/1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts`.
