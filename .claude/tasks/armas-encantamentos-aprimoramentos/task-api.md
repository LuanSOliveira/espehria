# Task API: Encantamentos e Aprimoramentos da Arma (Weapon)

## Contexto
Ver .claude/tasks/armas-encantamentos-aprimoramentos/spec.md (se existir)

Não há `spec.md` para esta demanda. O escopo abaixo foi definido diretamente pelo
orquestrador (decisões já fechadas, não reabrir).

Esta task depende, conceitualmente, da demanda irmã já planejada em
`.claude/tasks/encantamentos-aprimoramentos/task-api.md`, que cria os módulos
`enchantments` (entidade `Enchantment`) e `enhancements` (entidade `Enhancement`), cada
um com `name`, `type` (enum `weapon|armor|shield|accessory`, nullable) e `effect`
(text/HTML, nullable), com `GET /enchantments?type=weapon` / `GET
/enhancements?type=weapon`. Essas duas entidades já existem no código no momento deste
planejamento (`app-api/src/modules/enchantments/**`, `app-api/src/modules/enhancements/**`
— entidades e DTOs presentes; migrations dessas tabelas ainda não confirmadas como
existentes no repositório na data deste plano).

**Importante**: apesar da dependência conceitual (o frontend usará `Enchantment`/
`Enhancement` como catálogo de preenchimento), **não há relacionamento/FK** entre
`Weapon` e essas entidades. O que a arma persiste é uma **cópia** dos dados
(`name`/`effect`) no momento em que o usuário escolhe o item no formulário. Portanto a
implementação desta task é tecnicamente independente das tabelas `enchantments`/
`enhancements` já existirem fisicamente no banco — só depende delas existirem como
conceito/nome de campo para efeito de nomenclatura consistente (`enhancements`, e não
`improvements`, pelo mesmo motivo já registrado na task irmã: evitar colisão com
`improvement-flaws`/Melhorias e Defeitos).

Decisões já tomadas pelo orquestrador (não reabrir):
- Sem relacionamento/FK entre `Weapon` e `Enchantment`/`Enhancement`.
- Modelagem via duas colunas `jsonb` em `weapons` (`enchantments`, `enhancements`),
  cada uma um array de `{ name: string; effect: string | null }`, **sem** entidades
  filhas `OneToMany` e **sem** FK — ao contrário do padrão usado em
  `WeaponAlternativeDamage`/`WeaponExtraDamage` (que são tabelas próprias com FK para
  `weapons`).
- Precedente de estilo a seguir: colunas `jsonb` de `Sheet`
  (`app-api/src/modules/sheets/entities/sheet.entity.ts`) e suas migrations
  (`1784306270000-AddBiographyAndSnapshotsToSheets.ts`, entre outras).
- Ordem dos itens no array deve ser preservada (ordem de exibição no formulário) — como
  é um array JSON, a ordem é preservada nativamente pela serialização, sem necessidade
  de coluna `order` (diferente de `WeaponAlternativeDamage`/`WeaponExtraDamage`, que têm
  coluna `order` própria por serem tabelas relacionais).
- DTOs de criação/atualização aceitam `enchantments?`/`enhancements?` como arrays de um
  DTO aninhado validado com `@IsArray() @ValidateNested({ each: true }) @Type(() =>
  ...)` e `@IsOptional()`.
- Os dois arrays aparecem na resposta de detalhe (`fromEntity`); decisão registrada
  abaixo sobre não aparecerem na listagem paginada.
- Migration própria, `NOT NULL DEFAULT '[]'`, `down()` removendo as colunas.
- Semântica de update: substituição integral do array quando o campo é enviado,
  mantém valor atual quando omitido — mesma lógica dos demais campos opcionais do
  `WeaponsService.update`.
- Nenhuma mudança de permissão: `JwtAuthGuard` + `GoogleAccessGuard` /
  `@GoogleAccess('read-only')` já aplicados a nível de `WeaponsController`, sem
  alteração necessária.

Investigação de código relevante já feita (para orientar a etapa 1, sem gerar código
aqui):
- `app-api/src/modules/weapons/entities/weapon.entity.ts` — entidade `Weapon`, estende
  `BaseEntity`, sem colunas `jsonb` hoje.
- `app-api/src/modules/weapons/weapons.service.ts` — `create`/`update`/`findById`/
  `findAllPaginated`; o método `update` usa o padrão `if (dto.campo !== undefined) {
  weapon.campo = dto.campo; }` para campos simples, e um padrão mais elaborado
  (remover child rows explicitamente antes de reatribuir, ver comentário no código) só
  para `alternativeDamages`/`extraDamages`, que são entidades filhas com FK — **não
  aplicável** aqui, pois colunas `jsonb` são atualizadas com um simples `UPDATE`
  reatribuindo o valor da coluna, sem necessidade de lidar com órfãos.
- `app-api/src/modules/weapons/dto/create-weapon.dto.ts` — padrão de DTO aninhado já
  existe em `alternativeDamages`/`extraDamages` (`WeaponDamageInputDto`), usando
  `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() =>
  WeaponDamageInputDto)`.
- `app-api/src/modules/weapons/dto/weapon-response.dto.ts` e
  `weapon-damage-response.dto.ts` — padrão de DTO de resposta aninhado com `static
  fromEntity`, separado do DTO de entrada (`WeaponDamageInputDto` vs
  `WeaponDamageResponseDto`).
- `app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts` — **já omite**
  `description`, `privateInformation`, `alternativeDamages` e `extraDamages` da
  listagem paginada (só expõe campos "leves"). Esse é o precedente direto usado para a
  decisão abaixo de também omitir `enchantments`/`enhancements` da listagem.
- `app-api/src/modules/sheets/entities/sheet.entity.ts` e migrations
  `1784306270000-AddBiographyAndSnapshotsToSheets.ts` — estilo de coluna `jsonb` com
  `default` e tipo TS via `interface` importado com `import type`.
- `app-api/src/database/migrations/1784306660000-AddWeaponPropertiesToWeaponsTable.ts`
  — padrão de migration de alteração da tabela `weapons` (`ALTER TABLE ... ADD`/`DROP
  COLUMN`).
- Última migration existente hoje que toca `weapons`:
  `1784306740000-CreateWeaponExtraDamagesTable.ts`. Nenhuma migration de
  `enchantments`/`enhancements` foi encontrada no repositório neste momento — ver nota
  de coordenação de timestamp na subseção Migration abaixo.

## Etapas

### 1. api-dev

#### Entidade

Não é criação de entidade nova — é alteração da entidade `Weapon` já existente
(`app-api/src/modules/weapons/entities/weapon.entity.ts`), adicionando duas colunas
`jsonb`.

- Entidade alterada: `Weapon` (tabela `weapons`).
- Novos campos:
  - `enchantments: WeaponEmbeddedEffect[]` — `@Column({ type: 'jsonb', default: [] })`,
    sem `nullable` (sempre array, nunca `null`), sem `name` customizado (propriedade
    `enchantments` já é uma palavra só, mapeia direto para a coluna `enchantments` —
    mesmo raciocínio de `melhorias`/`defeitos`/`saberes` em `Sheet`, que também não têm
    `name` customizado).
  - `enhancements: WeaponEmbeddedEffect[]` — idêntico, coluna `enhancements`.
  - Anotar ambos com `@ApiProperty({ type: () => [WeaponEmbeddedEffectResponseDto],
    description: '...' })` no estilo já usado para `tags`/`traits` na própria entidade
    `Weapon` (linhas 46 e 79 do arquivo atual), mesmo que aqui não seja uma relação
    TypeORM de verdade — é só para o Swagger gerado a partir da entidade não ficar sem
    tipo.
- Relacionamentos: nenhum. Sem `ManyToOne`/`OneToMany`/`JoinColumn`, sem FK para
  `enchantments`/`enhancements`. É um valor JSON puro copiado no momento da
  criação/edição da arma.
- Novo tipo TS compartilhado (decisão de nome tomada aqui, conforme pedido no escopo):
  `WeaponEmbeddedEffect`, em
  `app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts` (nova
  pasta `interfaces/` dentro do módulo `weapons`, seguindo o padrão de
  `app-api/src/modules/sheets/interfaces/*.interface.ts`):
  ```ts
  export interface WeaponEmbeddedEffect {
    name: string;
    effect: string | null;
  }
  ```
  Usado como tipo de `Weapon.enchantments`/`Weapon.enhancements` (importado com `import
  type`, mesmo padrão de `Sheet`).
- `autoLoadEntities: true` já cobre a entidade `Weapon` (nenhuma alteração adicional de
  registro — não é entidade nova).

#### Migration

- Necessária: sim (`synchronize: false`).
- Uma única migration alterando `weapons`, seguindo o padrão de
  `1784306660000-AddWeaponPropertiesToWeaponsTable.ts` e de
  `1784306270000-AddBiographyAndSnapshotsToSheets.ts` (colunas `jsonb` com default):
  - Nome sugerido: `AddEnchantmentsAndEnhancementsToWeaponsTable`.
  - `up()`:
    ```sql
    ALTER TABLE "weapons" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'
    ALTER TABLE "weapons" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'
    ```
  - `down()`, ordem inversa:
    ```sql
    ALTER TABLE "weapons" DROP COLUMN "enhancements"
    ALTER TABLE "weapons" DROP COLUMN "enchantments"
    ```
  - Sem `CREATE TYPE`/enum nativo (não há enum aqui, diferente das migrations de
    `enchantments`/`enhancements` como tabelas próprias na task irmã) e sem
    `CREATE INDEX`/`CONSTRAINT` (não há unicidade nem FK a declarar).
  - **Nota de coordenação de timestamp**: a última migration hoje que toca `weapons` é
    `1784306740000-CreateWeaponExtraDamagesTable.ts`, e nenhuma migration de criação das
    tabelas `enchantments`/`enhancements` foi encontrada no repositório no momento deste
    plano (só as entidades/DTOs delas existem). Como não há FK entre `weapons` e essas
    tabelas, esta migration **não depende** delas existirem — pode ser gerada/aplicada
    independentemente. Ainda assim, ao gerar o timestamp (via `npm run
    migration:generate -- src/database/migrations/<Nome>` ou escrita manual), o
    `api-dev` deve conferir o estado mais recente de `src/database/migrations/` no
    momento da implementação para evitar colisão de timestamp com migrations criadas em
    paralelo pela task irmã.

#### Controller

Nenhum endpoint novo — `WeaponsController` já expõe `POST /weapons`, `GET /weapons`,
`GET /weapons/:id`, `PUT /weapons/:id`, `DELETE /weapons/:id`
(`app-api/src/modules/weapons/weapons.controller.ts`). A mudança é os DTOs de
entrada/saída de `POST`/`GET :id`/`PUT` passarem a aceitar/retornar os dois novos
campos.

- Endpoints afetados (sem mudança de rota/método):
  - `POST /weapons` — `CreateWeaponDto` passa a aceitar `enchantments?`/`enhancements?`.
  - `PUT /weapons/:id` — `UpdateWeaponDto` (via `PartialType(CreateWeaponDto)`) herda os
    dois campos automaticamente como opcionais — nenhuma alteração direta necessária em
    `update-weapon.dto.ts`.
  - `GET /weapons/:id` — `WeaponResponseDto` passa a retornar `enchantments`/
    `enhancements`.
  - `GET /weapons` — **decisão registrada**: `enchantments`/`enhancements` **não**
    aparecem em `WeaponListItemResponseDto`. Justificativa: essa listagem já omite
    outros campos "pesados" da mesma arma — `description`, `privateInformation`,
    `alternativeDamages` e `extraDamages` — mantendo só os campos usados em cards/linhas
    de tabela. Encantamentos/aprimoramentos seguem o mesmo padrão de dado
    detalhado/opcional que só faz sentido na tela de detalhe/edição da arma.
- Novos DTOs (arquivos novos em `app-api/src/modules/weapons/dto/`):
  - `WeaponEmbeddedEffectDto` (entrada, usado dentro de `CreateWeaponDto`/
    `UpdateWeaponDto`):
    - `name: string` — `@IsString() @IsNotEmpty()`, obrigatório dentro do item (mesmo
      que o array em si seja opcional).
    - `effect?: string` — `@IsOptional() @IsString()`, suporta HTML (mesmo tratamento
      de `description`/`privateInformation` — sem sanitização adicional).
  - `WeaponEmbeddedEffectResponseDto` (saída, usado dentro de `WeaponResponseDto`),
    espelhando o padrão `WeaponDamageInputDto`/`WeaponDamageResponseDto` (DTO de entrada
    separado do DTO de saída), mas mais simples por não ter `id`/`order` (o item
    embutido não é uma entidade própria com PK, e a ordem já é a ordem do array JSON):
    - `name: string`.
    - `effect: string | null`.
    - `static fromEntity(item: WeaponEmbeddedEffect): WeaponEmbeddedEffectResponseDto`.
- DTOs existentes alterados:
  - `CreateWeaponDto` (`app-api/src/modules/weapons/dto/create-weapon.dto.ts`) — dois
    novos campos opcionais, mesmo estilo de `alternativeDamages`/`extraDamages`:
    ```ts
    @ApiPropertyOptional({
      type: () => [WeaponEmbeddedEffectDto],
      description:
        'Encantamentos da arma (cópia de nome/efeito escolhidos do catálogo de Encantamentos, sem vínculo/FK), na ordem de inserção preservada',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WeaponEmbeddedEffectDto)
    enchantments?: WeaponEmbeddedEffectDto[];
    ```
    Idêntico para `enhancements?` (mesma estrutura, texto de descrição mencionando
    "Aprimoramentos"/catálogo de Aprimoramentos).
  - `UpdateWeaponDto` — nenhuma alteração de código (`PartialType(CreateWeaponDto)` já
    propaga os dois novos campos como opcionais).
  - `WeaponResponseDto` (`app-api/src/modules/weapons/dto/weapon-response.dto.ts`) —
    dois novos campos e mapeamento em `fromEntity`:
    ```ts
    @ApiProperty({
      type: () => [WeaponEmbeddedEffectResponseDto],
      description: 'Encantamentos da arma, na ordem de inserção',
    })
    enchantments: WeaponEmbeddedEffectResponseDto[];
    ```
    Idêntico para `enhancements`. Em `fromEntity`:
    ```ts
    dto.enchantments = (weapon.enchantments ?? []).map((item) =>
      WeaponEmbeddedEffectResponseDto.fromEntity(item),
    );
    dto.enhancements = (weapon.enhancements ?? []).map((item) =>
      WeaponEmbeddedEffectResponseDto.fromEntity(item),
    );
    ```
  - `WeaponListItemResponseDto` — sem alteração (decisão acima).
- `WeaponsService` (`app-api/src/modules/weapons/weapons.service.ts`):
  - `create()`: montar os arrays a partir do DTO ao construir o objeto passado para
    `weaponsRepository.create({...})`, mesmo padrão dos demais campos com fallback:
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
  - `update()`: seguir o padrão `if (dto.campo !== undefined) { weapon.campo = ...; }`
    já usado para os demais campos opcionais simples (não o padrão de remoção explícita
    usado em `alternativeDamages`/`extraDamages`, que só existe por causa da FK/`cascade`
    dessas tabelas filhas — aqui basta reatribuir o valor da coluna `jsonb`):
    ```ts
    if (dto.enchantments !== undefined) {
      weapon.enchantments = dto.enchantments.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    if (dto.enhancements !== undefined) {
      weapon.enhancements = dto.enhancements.map((item) => ({
        name: item.name,
        effect: item.effect ?? null,
      }));
    }
    ```
    Isso implementa a semântica pedida: substituição integral quando o campo é enviado
    (mesmo um array vazio `[]` substitui o conteúdo anterior por vazio), e preservação do
    valor atual quando o campo é omitido (`undefined`).
  - `findById()`/`findAllPaginated()`: nenhuma alteração de query necessária — colunas
    `jsonb` simples são carregadas automaticamente com qualquer `find`/`findOne` da
    entidade `Weapon` (não são relação, não exigem `relations: {...}`), exatamente como
    já acontece hoje com `description`/`privateInformation`.
- `WeaponsController`: nenhuma mudança de assinatura de método (os DTOs já cobrem os
  novos campos automaticamente via `@Body()`/serialização de resposta). Apenas os textos
  de `@ApiBadRequestResponse` de `create`/`update` devem passar a mencionar a nova causa
  de erro de validação (nome ausente/vazio dentro de um item de `enchantments`/
  `enhancements`) — detalhamento fica a cargo da etapa 2 (`api-dev-doc`), que já é quem
  revisa/ajusta esses textos descritivos no restante do controller.
- Acesso Google: **read-only (padrão)** — nenhuma mudança. `WeaponsController` já aplica
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` a nível de
  controller; `create`/`update` (únicos métodos que gravam os novos campos) já ficam
  bloqueados para usuários `provider: 'google'` por esse guard existente.

Status: concluído
Entidade: app-api/src/modules/weapons/entities/weapon.entity.ts
Migration: app-api/src/database/migrations/1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts
Rotas: nenhuma rota nova (POST /weapons, GET /weapons/:id, PUT /weapons/:id já existentes passam a aceitar/retornar `enchantments`/`enhancements`; GET /weapons não os expõe, por decisão já registrada)
Arquivos:
- app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts (novo)
- app-api/src/modules/weapons/dto/weapon-embedded-effect.dto.ts (novo, DTO de entrada)
- app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts (novo, DTO de saída com `fromEntity`)
- app-api/src/modules/weapons/dto/create-weapon.dto.ts (alterado: campos `enchantments?`/`enhancements?`)
- app-api/src/modules/weapons/dto/weapon-response.dto.ts (alterado: campos `enchantments`/`enhancements` e mapeamento em `fromEntity`)
- app-api/src/modules/weapons/weapons.service.ts (alterado: `create()` monta os arrays a partir do DTO; `update()` substitui os arrays quando enviados, preserva quando omitidos)
- app-api/src/modules/weapons/dto/update-weapon.dto.ts, weapon-list-item-response.dto.ts, weapons.controller.ts, weapons.module.ts: sem alteração (conforme decisões já registradas na task — `PartialType` propaga os campos, listagem não os expõe, controller não muda assinatura de rota, módulo não precisa de novo repositório para colunas `jsonb`)

### 2. api-dev-doc
- Depende da etapa 1
- Cobrir, para o módulo `weapons`: `@ApiProperty`/`@ApiPropertyOptional` completos de
  `WeaponEmbeddedEffectDto` e `WeaponEmbeddedEffectResponseDto` (`name` com exemplo de
  encantamento/aprimoramento, `effect` com `description` deixando claro que o campo
  suporta HTML, mesmo tratamento dado a `description`/`privateInformation` da própria
  arma).
- Atualizar as descrições de `enchantments`/`enhancements` em `CreateWeaponDto` e
  `WeaponResponseDto` para deixar claro que são cópias independentes (sem vínculo/FK)
  dos catálogos de Encantamentos (`enchantments`) e Aprimoramentos (`enhancements`), e
  que a ordem de inserção é preservada.
- Atualizar os textos de `@ApiBadRequestResponse` de `create`/`update` em
  `weapons.controller.ts` para incluir a nova causa de erro de validação: nome ausente/
  vazio em algum item de `enchantments`/`enhancements` (mesmo estilo de menção já dado
  aos itens de `alternativeDamages`/`extraDamages` nesses mesmos textos).
- Conferir que o Swagger de `GET /weapons/:id` reflita os dois novos arrays e que
  `GET /weapons` (listagem) não os exponha, documentando essa omissão de forma
  consistente com a de `description`/`privateInformation`/`alternativeDamages`/
  `extraDamages` já omitidos na listagem hoje.

Status: concluído
Arquivos alterados:
- app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts (melhorada documentação do campo `effect`)
- app-api/src/modules/weapons/dto/create-weapon.dto.ts (aprimoradas descrições de `enchantments` e `enhancements`)
- app-api/src/modules/weapons/dto/weapon-response.dto.ts (aprimoradas descrições de `enchantments` e `enhancements`)
- app-api/src/modules/weapons/weapons.controller.ts (atualizados textos de `@ApiBadRequestResponse` em `create` e `update` para incluir erros de validação em items de encantamentos/aprimoramentos)

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Escopo revisado: `app-api/src/modules/weapons/entities/weapon.entity.ts`,
`app-api/src/database/migrations/1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts`,
`app-api/src/modules/weapons/interfaces/weapon-embedded-effect.interface.ts`,
`app-api/src/modules/weapons/dto/weapon-embedded-effect.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts`,
`app-api/src/modules/weapons/dto/create-weapon.dto.ts`,
`app-api/src/modules/weapons/dto/update-weapon.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-response.dto.ts`,
`app-api/src/modules/weapons/dto/weapon-list-item-response.dto.ts`,
`app-api/src/modules/weapons/weapons.service.ts`,
`app-api/src/modules/weapons/weapons.controller.ts`,
`app-api/src/modules/weapons/weapons.module.ts`.

Verificações específicas confirmadas como corretas:
- Migration `1784306770000-AddEnchantmentsAndEnhancementsToWeaponsTable.ts` adiciona
  exatamente as colunas `enchantments`/`enhancements` como `jsonb NOT NULL DEFAULT
  '[]'`, e o `down()` remove ambas na ordem inversa do `up()`. Corresponde 1:1 com
  `@Column({ type: 'jsonb', default: [] })` em `Weapon.enchantments`/
  `Weapon.enhancements` (sem `nullable: true`, mesmos nomes de propriedade/coluna, sem
  `name` customizado). Sem colisão de timestamp com outras migrations existentes.
- `WeaponEmbeddedEffectDto` valida `name` com `@IsString() @IsNotEmpty()` (obrigatório
  item a item mesmo com o array pai opcional) e `effect` com
  `@IsOptional() @IsString()`. Os arrays `enchantments?`/`enhancements?` em
  `CreateWeaponDto` usam `@IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => WeaponEmbeddedEffectDto)`, mesmo padrão já validado em produção para
  `alternativeDamages`/`extraDamages` — com `ValidationPipe` global
  (`whitelist`/`forbidNonWhitelisted`/`transform`), isso rejeita tanto campos extras
  dentro de cada item quanto itens com `name` ausente/vazio.
- Semântica de update confirmada em `WeaponsService.update`: `if (dto.enchantments !==
  undefined)` substitui o array inteiro (inclusive por `[]` se enviado vazio);
  omitir o campo mantém `weapon.enchantments` como estava. Idêntico para
  `enhancements`.
- Nenhum `ManyToOne`/`OneToMany`/`JoinColumn` ou FK envolvendo `Enchantment`/
  `Enhancement` — a cópia é feita via `{ name: item.name, effect: item.effect ?? null
  }` tanto em `create()` quanto em `update()`, sem tocar nos módulos
  `enchantments`/`enhancements`.
- Ordem preservada: os arrays são simplesmente mapeados (`.map(...)`) sem reordenação,
  refletindo a ordem de inserção do JSON, tanto em `WeaponsService` quanto em
  `WeaponResponseDto.fromEntity`.
- `WeaponResponseDto` expõe `enchantments`/`enhancements` (detalhe); `POST`/`PUT`
  aceitam via `CreateWeaponDto`/`UpdateWeaponDto` (este via `PartialType`);
  `WeaponListItemResponseDto` (listagem paginada) não expõe nenhum dos dois campos,
  conforme decisão registrada — nenhum dado sensível ou não solicitado vazado.
- `WeaponsController` mantém `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` a nível de controller, sem alteração — consistente com
  a decisão de não mudar permissões.
- Textos de `@ApiBadRequestResponse` de `create`/`update` foram atualizados para
  mencionar a nova causa de erro de validação (nome ausente/vazio em item de
  encantamentos/aprimoramentos), e a documentação Swagger de
  `WeaponEmbeddedEffectDto`/`WeaponEmbeddedEffectResponseDto`/`CreateWeaponDto`/
  `WeaponResponseDto` deixa explícito que os campos são cópias independentes, sem
  vínculo/FK, com ordem de inserção preservada.

Um problema encontrado (menor, não bloqueante):

- **app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts:1** —
  Import não utilizado. O arquivo importa `ApiPropertyOptional` de `@nestjs/swagger`,
  mas os dois campos da classe (`name` e `effect`) usam apenas `@ApiProperty(...)`
  (inclusive `effect`, que é opcionalmente `null` mas documentado como `@ApiProperty`
  com `nullable: true`, não como `@ApiPropertyOptional`). Isso deixa um import morto
  que tende a ser sinalizado pela regra `no-unused-vars` do ESLint (`eslint.config.mjs`
  usa `eslint.configs.recommended`, que habilita essa regra), quebrando `npm run
  lint`.
  - Trecho: `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';`
  - Sugestão: remover `ApiPropertyOptional` do import (mantendo só `ApiProperty`), já
    que nenhum campo da classe é de fato opcional na resposta.

### Correção do achado (api-dev)

- `app-api/src/modules/weapons/dto/weapon-embedded-effect-response.dto.ts`: removido
  `ApiPropertyOptional` do import de `@nestjs/swagger` (mantido apenas `ApiProperty`).
  Confirmado que nenhum dos dois campos (`name`, `effect`) é de fato opcional na
  resposta — `effect` é `nullable: true`, não ausente — logo `@ApiPropertyOptional`
  não se aplicava a nenhum campo e a correção correta era remover o import, não usá-lo.
- Verificação: nenhuma outra ocorrência de `ApiPropertyOptional` restou no arquivo
  (confirmado por leitura). Não foi possível executar `npm run lint` neste agente
  (ferramenta Bash não disponível no escopo do api-dev); recomenda-se confirmar com
  `npm run lint` dentro de `app-api` antes do merge.

Status: concluído
