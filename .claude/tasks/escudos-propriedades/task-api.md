# Task API: Novas propriedades em Escudos

## Contexto

Ver `.claude/tasks/escudos-propriedades/spec.md` — contém a demanda completa e todas as
decisões já confirmadas com o usuário (7 campos novos, todos opcionais, sem alteração de
listagem/filtros, cálculo de "Limiar de Quebra" no backend).

Este plano replica de perto o precedente já implementado em
`.claude/tasks/armaduras-propriedades/task-api.md` (`Armor`), reaproveitando os mesmos
padrões de nomenclatura e tipo de coluna para os campos equivalentes: `nickname`, `volume`
(`numeric(4,1)` com `DecimalTransformer`), `armorClassBonus` (`armor_class_bonus`),
`speedPenaltyMeters` (`speed_penalty_meters`).

Investigação de código feita em: `app-api/src/modules/shields/**` (entidade, DTOs, service,
controller e module atuais de `Shield`), `app-api/src/modules/armors/entities/armor.entity.ts`
e `app-api/src/modules/armors/dto/create-armor.dto.ts` (padrão espelho para os 4 campos com
precedente direto), `app-api/src/common/transformers/decimal.transformer.ts`
(`DecimalTransformer`, reaproveitado sem alteração) e `app-api/src/database/migrations/`
(confirmação de que `1784306710000-CreateArmorTraitsTable.ts` é o timestamp mais recente
hoje no diretório).

**Diferença relevante em relação ao precedente de Armaduras:** esta demanda não inclui
nenhuma nova tabela auxiliar nem relacionamento (`Shield` não ganha uma FK de categoria nem
uma relação N:N como `traits` em `Armor`). São apenas colunas simples na tabela `shields`,
o que torna o escopo mais simples que o de `armaduras-propriedades`: uma única migration
(sem tabela auxiliar, sem tabela de junção), e nenhuma alteração em `ShieldsModule` além da
entidade `Shield` em si (repositórios já injetados — `Shield`, `ShieldTag`, `Tag`,
`Currency` — permanecem suficientes).

**Ponto de atenção central (já resolvido pelo spec, não é lacuna a levantar):**
`breakThreshold` ("Limiar de Quebra") é persistido, mas **não é um campo aceito nos DTOs de
entrada** (`CreateShieldDto`/`UpdateShieldDto`). Ele é inteiramente derivado por
`ShieldsService` a partir de `hitPoints` — `floor(hitPoints / 2)`, com `0` quando
`hitPoints` estiver vazio/nulo — tanto em `create` quanto em `update`. Como o `ValidationPipe`
global usa `whitelist: true, forbidNonWhitelisted: true` (`main.ts`), qualquer tentativa do
cliente de enviar `breakThreshold` no corpo da requisição já é rejeitada com `400` só por
não estar declarado no DTO — reforçando que o cliente nunca controla esse valor.

## Etapas

### 1. api-dev

#### Entidade

Alterações em `Shield` (`app-api/src/modules/shields/entities/shield.entity.ts`), todos os
campos novos opcionais/nullable exceto `breakThreshold` (sempre presente, com default `0`),
sem alterar nenhum campo existente:

- `nickname` (`string | null`, `@Column({ type: 'varchar', nullable: true })`) — "Apelido",
  texto livre, sem restrição de formato.
- `volume` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1, nullable:
  true, transformer: DecimalTransformer })`) — mesma forma de `Armor.volume`, reaproveitando
  `DecimalTransformer` de `app-api/src/common/transformers/decimal.transformer.ts` sem
  nenhuma alteração no utilitário.
- `armorClassBonus` (`number | null`, `@Column({ type: 'int', name: 'armor_class_bonus',
  nullable: true })`) — "Bônus de CA", mesmo nome de coluna/campo já usado em `Armor`.
- `speedPenaltyMeters` (`number | null`, `@Column({ type: 'numeric', precision: 4, scale: 1,
  name: 'speed_penalty_meters', nullable: true, transformer: DecimalTransformer })` —
  "Penalidade de Velocidade (Metros)", mesma forma de `Armor.speedPenaltyMeters`.
- `hardness` (`number | null`, `@Column({ type: 'int', nullable: true })`) — "Dureza", sem
  precedente em Armaduras; mínimo 0 aplicado apenas no DTO de entrada (a coluna em si não
  impõe `CHECK`, mesmo critério já usado nos demais campos inteiros do projeto, ex.:
  `Armor.armorClassBonus`).
- `hitPoints` (`number | null`, `@Column({ type: 'int', name: 'hit_points', nullable:
  true })`) — "Pontos de Vida", sem precedente em Armaduras; mínimo 0 no DTO de entrada.
- `breakThreshold` (`number`, `@Column({ type: 'int', name: 'break_threshold', default:
  0 })`, **não nullable**, sem `@ApiProperty` de entrada — "Limiar de Quebra". Diferente dos
  demais 6 campos, esta coluna nunca fica indefinida: é sempre calculada e persistida pelo
  `ShieldsService` (ver lógica abaixo), nunca aceita diretamente do cliente.

`CreateShieldDto`/`UpdateShieldDto`
(`app-api/src/modules/shields/dto/create-shield.dto.ts`, `UpdateShieldDto` via
`PartialType(CreateShieldDto)` já existente e inalterado) ganham, todos opcionais, **sem
`breakThreshold`**:
- `nickname?: string` (`@IsOptional @IsString`).
- `volume?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`, mesma
  mensagem de erro em pt-BR já usada em `CreateArmorDto.volume`).
- `armorClassBonus?: number` (`@IsOptional @IsInt @Min(0)`).
- `speedPenaltyMeters?: number` (`@IsOptional @IsNumber({ maxDecimalPlaces: 1 }) @Min(0)`).
- `hardness?: number` (`@IsOptional @IsInt @Min(0)`, mensagem: "A dureza deve ser um número
  inteiro." / "A dureza não pode ser negativa.").
- `hitPoints?: number` (`@IsOptional @IsInt @Min(0)`, mensagem: "Os pontos de vida devem ser
  um número inteiro." / "Os pontos de vida não podem ser negativos."). Observação: `0` é um
  valor válido e distinto de "vazio/nulo" — o service deve tratar isso com
  `dto.hitPoints !== undefined && dto.hitPoints !== null` (não com checagem de "falsy"), já
  que `Min(0)` permite `0` como pontos de vida legítimos.

`ShieldResponseDto` (`app-api/src/modules/shields/dto/shield-response.dto.ts`) ganha os 7
campos de leitura: `nickname`, `volume`, `armorClassBonus`, `speedPenaltyMeters`, `hardness`,
`hitPoints`, `breakThreshold` — todos populados em `fromEntity` a partir da entidade.

`ShieldListItemResponseDto`
(`app-api/src/modules/shields/dto/shield-list-item-response.dto.ts`) **não é alterado** —
fora de escopo por decisão explícita do spec (seção "Fora do escopo desta demanda").

`ShieldsService` (`app-api/src/modules/shields/shields.service.ts`) ganha a lógica de
cálculo de `breakThreshold`, aplicada tanto em `create` quanto em `update`:
- `create`: `hardness: dto.hardness ?? null`, `hitPoints: dto.hitPoints ?? null`,
  `breakThreshold: dto.hitPoints != null ? Math.floor(dto.hitPoints / 2) : 0` (mesma
  convenção `dto.campo ?? null` já usada para os demais campos opcionais de `Shield`),
  junto com `nickname`, `volume`, `armorClassBonus`, `speedPenaltyMeters` seguindo a mesma
  convenção.
- `update`: segue a convenção já usada no método (`dto.campo !== undefined` atualiza o
  campo). Quando `dto.hitPoints !== undefined`, além de atualizar `shield.hitPoints`,
  recalcula `shield.breakThreshold = dto.hitPoints != null ? Math.floor(dto.hitPoints / 2) :
  0` no mesmo bloco — garantindo que `breakThreshold` nunca fique desatualizado em relação a
  `hitPoints` após um `PUT`. Quando `dto.hitPoints` não é enviado (`undefined`), nem
  `hitPoints` nem `breakThreshold` são tocados.
- Nenhuma validação de existência (`findXById`) é necessária para os 6 campos de valor
  simples — não há relacionamento novo nesta demanda.

`ShieldsModule` (`app-api/src/modules/shields/shields.module.ts`): **sem alteração** — os
repositórios já injetados (`Shield`, `ShieldTag`, `Tag`, `Currency`) continuam suficientes,
já que nenhuma tabela nova nem relacionamento novo é introduzido.

#### Migration

Necessária: sim — uma única migration nova, após `1784306710000-CreateArmorTraitsTable.ts`
(timestamp mais recente hoje no diretório `app-api/src/database/migrations/`):

- `1784306720000-AddShieldPropertiesToShieldsTable.ts` — adiciona à tabela `shields`:
  `nickname` varchar nullable, `volume` numeric(4,1) nullable, `armor_class_bonus` integer
  nullable, `speed_penalty_meters` numeric(4,1) nullable, `hardness` integer nullable,
  `hit_points` integer nullable, `break_threshold` integer **not null default 0**. Sem
  nenhuma FK nova (nenhum relacionamento é introduzido). `down()` remove as 7 colunas na
  ordem inversa da criação. Mesmo formato SQL de
  `1784306700000-AddArmorPropertiesToArmorsTable.ts`, porém mais simples (sem `ALTER TABLE
  ... ADD CONSTRAINT` de FK).

Gerar a migration via `npm run migration:generate -- src/database/migrations/<Nome>` depois
de a entidade `Shield` estar alterada (`autoLoadEntities: true` detecta as novas colunas
automaticamente) e revisar o SQL gerado, conferindo em especial que `break_threshold` saia
como `integer NOT NULL DEFAULT 0` (não nullable, diferente das outras 6 colunas). **A
migration deve ser criada mas NÃO executada** — `synchronize: false` está ativo e o usuário
roda `npm run migration:run` manualmente após revisar o SQL gerado; nenhuma etapa deste
plano inclui rodar a migration contra o banco.

#### Controller

**Nenhum endpoint novo.** Os endpoints existentes de `ShieldsController`
(`app-api/src/modules/shields/shields.controller.ts`) têm apenas o contrato de
request/response ampliado, sem mudança de método/caminho:
- `POST /shields`, `PUT /shields/:id`, `GET /shields/:id` passam a aceitar (exceto
  `breakThreshold`, nunca aceito) e retornar os 7 campos novos.
- `GET /shields` (listagem) **não é alterado** — `ShieldListItemResponseDto` e
  `FindShieldsQueryDto` permanecem exatamente como estão, por decisão explícita do spec.

Atualizar `@ApiBadRequestResponse` de `POST`/`PUT` em `ShieldsController` para mencionar
também os novos critérios numéricos (`volume`/`speedPenaltyMeters` com mais de 1 casa
decimal ou negativos; `armorClassBonus`/`hardness`/`hitPoints` negativos). Não é necessário
alterar `@ApiNotFoundResponse` — nenhum dos 7 campos novos introduz uma referência a outra
entidade que possa "não ser encontrada".

- **Acesso Google: inalterado.** `ShieldsController` já usa
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` no controller
  inteiro (confirmado em `app-api/src/modules/shields/shields.controller.ts`); os campos
  novos não mudam esse nível de acesso — escudos continuam sendo conteúdo de catálogo, não
  um recurso de gerenciamento restrito, mesmo critério já usado para `armors`/`weapons`. Não
  há justificativa para `blocked`.
- DTOs afetados: `CreateShieldDto`, `UpdateShieldDto` (via `PartialType`, sem alteração
  direta), `ShieldResponseDto`. `ShieldListItemResponseDto`,
  `PaginatedShieldsResponseDto` e `FindShieldsQueryDto` permanecem inalterados.

Status: concluído
Entidade: app-api/src/modules/shields/entities/shield.entity.ts
Migration: app-api/src/database/migrations/1784306720000-AddShieldPropertiesToShieldsTable.ts (criada, não executada — pendente `npm run migration:run` manual do usuário)
Rotas: POST /shields, PUT /shields/:id, GET /shields/:id (contrato de request/response ampliado, sem mudança de método/caminho)
Arquivos: app-api/src/modules/shields/dto/create-shield.dto.ts, app-api/src/modules/shields/dto/shield-response.dto.ts, app-api/src/modules/shields/shields.service.ts, app-api/src/modules/shields/shields.controller.ts (apenas `@ApiBadRequestResponse` de POST/PUT ampliado)

### 2. api-dev-doc

- Depende da etapa 1.
- Cobrir na documentação Swagger:
  - `@ApiPropertyOptional` completos (com `example`) dos 6 campos novos de entrada em
    `CreateShieldDto`, descrevendo claramente que `volume`/`speedPenaltyMeters` aceitam no
    máximo 1 casa decimal e que todos têm mínimo 0.
  - `@ApiPropertyOptional`/`@ApiProperty` dos 7 campos novos em `ShieldResponseDto`,
    incluindo `breakThreshold` com descrição explícita de que é calculado pela API
    (`floor(Pontos de Vida / 2)`, `0` quando Pontos de Vida está vazio/nulo) e não é
    aceito como entrada — deixar claro no `description` que o campo é somente leitura.
  - Atualizar `@ApiBadRequestResponse` de `POST`/`PUT /shields/:id` conforme detalhado na
    etapa 1 (Controller).
  - Nenhuma alteração é necessária em `ShieldListItemResponseDto`,
    `PaginatedShieldsResponseDto`, `FindShieldsQueryDto`, nem em `search`/documentação de
    busca global (fora de escopo desta demanda).

Status: concluído
Arquivos: app-api/src/modules/shields/dto/create-shield.dto.ts, app-api/src/modules/shields/dto/shield-response.dto.ts, app-api/src/modules/shields/shields.controller.ts

### 3. api-dev-codereviewer

- Revisar tudo acima, com atenção especial a:
  - `breakThreshold` realmente ausente de `CreateShieldDto`/`UpdateShieldDto` (o cliente não
    pode defini-lo — uma tentativa de enviá-lo no corpo deve ser rejeitada com `400` pelo
    `ValidationPipe` global `forbidNonWhitelisted: true`).
  - Cálculo de `breakThreshold` correto e consistente em `create` e `update`
    (`Math.floor(hitPoints / 2)`, `0` quando `hitPoints` for `null`/`undefined`), inclusive
    no caso de `hitPoints === 0` (não deve ser tratado como "vazio" — `breakThreshold` deve
    ser `0` legitimamente calculado, não por fallback).
  - Em `update`, `breakThreshold` só é recalculado quando `dto.hitPoints !== undefined`; se
    `hitPoints` não for enviado no `PUT`, tanto `hitPoints` quanto `breakThreshold`
    permanecem com o valor já persistido.
  - `DecimalTransformer` (reaproveitado sem alteração) realmente aplicado em `volume`/
    `speedPenaltyMeters` de `Shield` — resposta da API devolvendo `number`, nunca `string`.
  - Todos os 6 campos de valor de entrada (`nickname`, `volume`, `armorClassBonus`,
    `speedPenaltyMeters`, `hardness`, `hitPoints`) realmente `nullable`/opcionais no banco e
    no DTO de entrada, com `@Min(0)` em todos os numéricos (incluindo `hardness` e
    `hitPoints`, que não têm precedente em Armaduras), e nenhum campo existente de `Shield`/
    `ShieldResponseDto`/`CreateShieldDto` alterado ou removido.
  - `ShieldListItemResponseDto`, `PaginatedShieldsResponseDto` e `FindShieldsQueryDto`
    confirmados como não alterados (fora de escopo por decisão do spec).
  - Nível de acesso Google de `ShieldsController` inalterado (`read-only`, já existente
    antes desta demanda).
  - Migration `1784306720000-AddShieldPropertiesToShieldsTable.ts`: 7 colunas adicionadas,
    `break_threshold` como `integer NOT NULL DEFAULT 0` (diferente das outras 6, que são
    `nullable`), nenhuma FK nova, `down()` revertendo exatamente as 7 colunas na ordem
    inversa. **Confirmar que a migration não foi executada contra o banco** (pendente
    `npm run migration:run` manual do usuário).
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto.
  - Nenhum código de produção fora do escopo planejado (sem alteração em listagem/filtros de
    `shields`, sem tabela auxiliar nova, sem relacionamento novo, sem alteração no nível de
    acesso Google).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/shields/entities/shield.entity.ts`,
`app-api/src/modules/shields/dto/create-shield.dto.ts`,
`app-api/src/modules/shields/dto/update-shield.dto.ts`,
`app-api/src/modules/shields/dto/shield-response.dto.ts`,
`app-api/src/modules/shields/dto/shield-list-item-response.dto.ts`,
`app-api/src/modules/shields/shields.service.ts`,
`app-api/src/modules/shields/shields.controller.ts`,
`app-api/src/modules/shields/shields.module.ts`,
`app-api/src/database/migrations/1784306720000-AddShieldPropertiesToShieldsTable.ts`.

Pontos verificados:
- `breakThreshold` não existe em `CreateShieldDto`/`UpdateShieldDto` (`update-shield.dto.ts`
  usa `PartialType(CreateShieldDto)` sem campos adicionais) — com `ValidationPipe` global
  `forbidNonWhitelisted: true`, uma tentativa de enviá-lo no corpo é rejeitada com `400`.
- Cálculo de `breakThreshold` correto e consistente:
  - `create` (`shields.service.ts:114-117`):
    `dto.hitPoints !== undefined && dto.hitPoints !== null ? Math.floor(dto.hitPoints / 2) : 0`.
  - `update` (`shields.service.ts:252-256`): só recalcula quando
    `dto.hitPoints !== undefined`, tratando `hitPoints === 0` como valor legítimo (não cai no
    fallback `0` por "falsy"), e usa `dto.hitPoints !== null ? Math.floor(...) : 0` para o caso
    de limpeza explícita (`null`). Quando `hitPoints` não é enviado, nem `hitPoints` nem
    `breakThreshold` são tocados — confirmado.
- `DecimalTransformer` aplicado em `volume` e `speedPenaltyMeters` na entidade
  (`shield.entity.ts:40-60`), reaproveitado sem alteração do utilitário existente.
- Os 6 campos de entrada (`nickname`, `volume`, `armorClassBonus`, `speedPenaltyMeters`,
  `hardness`, `hitPoints`) são `nullable`/opcionais tanto na entidade quanto no DTO de
  entrada, com `@IsOptional` e `@Min(0)` em todos os numéricos, mensagens em pt-BR
  consistentes com o padrão já usado em `CreateArmorDto`. `breakThreshold` é o único
  `not null` com `default: 0`, coerente com a migration. Nenhum campo existente de `Shield`/
  `ShieldResponseDto`/`CreateShieldDto` foi alterado ou removido.
- `ShieldListItemResponseDto`, `PaginatedShieldsResponseDto` e `FindShieldsQueryDto`
  confirmados como não alterados — nenhuma referência aos 7 campos novos neles.
- `ShieldsController` mantém `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` no nível do controller, inalterado.
- Migration `1784306720000-AddShieldPropertiesToShieldsTable.ts` adiciona exatamente as 7
  colunas com os mesmos nomes/tipos/nullability da entidade (`break_threshold` como
  `integer NOT NULL DEFAULT 0`, as outras 6 nullable, sem FK nova), e `down()` remove as 7
  colunas na ordem inversa da criação. Não foi encontrado nenhum indício de execução da
  migration contra o banco (nenhuma alteração em artefatos de estado de banco no repositório);
  fica pendente a confirmação de `npm run migration:run` manual pelo usuário, como planejado.
- `ShieldsModule` permanece inalterado, sem necessidade de novos repositórios.
- `ShieldResponseDto.fromEntity` popula todos os campos, incluindo `breakThreshold`, sem
  vazar dados sensíveis ou de outra entidade além do já existente (`currency`, `tags`).
