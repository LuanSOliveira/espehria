# Task API: Ficha - Inventário (Volume e Moedas)

## Contexto
Ver .claude/tasks/ficha-inventario/spec.md

## Etapas

### 1. api-dev

#### Entidade
- Entidade: `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`) — alteração,
  não criação de entidade nova.
- Campos novos:
  - `pc` (int, not null, default `0`) — quantidade de Peças de Cobre. Coluna `pc`.
  - `pp` (int, not null, default `0`) — quantidade de Peças de Prata. Coluna `pp`.
  - `po` (int, not null, default `0`) — quantidade de Peças de Ouro. Coluna `po`.
  - `pl` (int, not null, default `0`) — quantidade de Peças de Platina. Coluna `pl`.
  - `loadedVolume` (int, not null, default `0`) — Volume Carregado. Coluna
    `loaded_volume`.
  - Todos os 5 campos seguem o mesmo padrão de `@Column({ type: 'int', ... })` +
    `@ApiProperty`/`@ApiPropertyOptional` já usado em `currentHitPoints`/
    `temporaryHitPoints`, mas **sem** `nullable: true` (diferente de PV atual/
    temporário): o spec define valor inicial fixo em 0 e validação de inteiro
    `>= 0`, sem estado "não informado". Usar `default: 0` na coluna para que o
    valor exista desde a criação da ficha (não há endpoint de criação explícito
    destes campos — nascem zerados).
- Relacionamentos: nenhum novo. Volume Máximo e Volume Limite NÃO são colunas —
  continuam sendo derivados no client a partir do modificador de Força (mesmo
  padrão de Classe de Armadura/PV máximo), conforme decisão já fechada no spec.
  Não implementar esses dois no backend.

#### Migration
- Necessária: sim. Toda alteração de schema passa por migration (`synchronize:
  false`).
- Adicionar 5 colunas `integer NOT NULL DEFAULT 0` na tabela `sheets`: `pc`, `pp`,
  `po`, `pl`, `loaded_volume`. Seguir o padrão de nomenclatura/estrutura já usado
  em `1784306440000-AddHitPointsToSheetsTable.ts` (uma migration dedicada,
  `ALTER TABLE "sheets" ADD ...` no `up`, `DROP COLUMN` no `down`, na ordem
  inversa). Como as colunas são `NOT NULL`, incluir `DEFAULT 0` no `ADD COLUMN`
  para que a migration não falhe em fichas já existentes (linhas atuais recebem
  0 automaticamente).

#### Controller
- Não há novos endpoints. Os campos são expostos e atualizados através dos
  endpoints já existentes do módulo `sheets`:
  - `GET /sheets/:id` — passa a retornar `pc`, `pp`, `po`, `pl`, `loadedVolume`
    no `SheetResponseDto`.
  - `PUT /sheets/:id` — passa a aceitar `pc`, `pp`, `po`, `pl`, `loadedVolume`
    como campos opcionais no `UpdateSheetDto`, seguindo o mesmo fluxo de
    autosave com debounce já usado por `currentHitPoints`/`temporaryHitPoints`
    no client (tanto digitação direta quanto os cliques nas setas de conversão
    e a atualização do Volume Carregado calculado, tudo chega nesta mesma
    chamada PUT).
- DTOs:
  - `UpdateSheetDto` (`app-api/src/modules/sheets/dto/update-sheet.dto.ts`):
    adicionar `pc?`, `pp?`, `po?`, `pl?`, `loadedVolume?`, cada um com
    `@IsOptional()`, `@Type(() => Number)`, `@IsInt({ message: '... deve ser um
    número inteiro.' })`, `@Min(0, { message: '... deve ser maior ou igual a
    0.' })` — mensagens em pt-BR seguindo o padrão dos campos existentes. Sem
    `@ValidateIf` para `null` (diferente de `currentHitPoints`), pois estes
    campos não são nuláveis.
  - `SheetResponseDto` (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`):
    adicionar `pc`, `pp`, `po`, `pl`, `loadedVolume` como `@ApiProperty` (não
    opcionais, sempre inteiros `>= 0`), e preenchê-los em `fromEntity` a partir
    da entidade.
  - No serviço (`sheets.service.ts`, método `update`), replicar o padrão já
    usado para `currentHitPoints`/`temporaryHitPoints`: se `dto.pc !==
    undefined`, atribuir `sheet.pc = dto.pc` (idem para `pp`, `po`, `pl`,
    `loadedVolume`). O backend apenas persiste os valores enviados pelo
    client — o cálculo de `loadedVolume` (`floor((PC+PP+PO+PL)/1000)` +
    contribuição de itens, hoje 0) e a lógica de conversão entre moedas são
    responsabilidade do client, conforme já decidido no spec; não é necessário
    recalcular ou validar essa fórmula no backend.
  - Não é necessário alterar `SheetListItemResponseDto`/`PaginatedSheetsResponseDto`
    nem outros DTOs de listagem, pois o spec trata Volume/Moedas como parte da
    tela de visualização detalhada da ficha, não da listagem.
- Acesso Google: não se aplica (nenhum endpoint novo é criado). Os campos
  passam a trafegar pelos endpoints `GET /sheets/:id`/`PUT /sheets/:id` já
  existentes, que já têm suas próprias regras de acesso para usuários
  `provider: 'google'` (restrição a fichas próprias, ver
  `isRestrictedToOwnSheets` em `sheets.service.ts`) — nada muda aqui.

Status: concluído
Entidade: app-api/src/modules/sheets/entities/sheet.entity.ts
Migration: app-api/src/database/migrations/1784306790000-AddVolumeAndCoinsToSheetsTable.ts
Rotas: GET /sheets/:id, PUT /sheets/:id (endpoints já existentes, sem alteração de rota — apenas novos campos trafegando pelo payload)
Arquivos: app-api/src/modules/sheets/dto/update-sheet.dto.ts, app-api/src/modules/sheets/dto/sheet-response.dto.ts, app-api/src/modules/sheets/sheets.service.ts

### 2. api-dev-doc

Documentação dos endpoints existentes `GET /sheets/:id` e `PUT /sheets/:id` com os novos campos de moedas (PC, PP, PO, PL) e Volume Carregado.

#### Decorators Swagger adicionados/ajustados:

**Controller (`sheets.controller.ts`)**:
- `@ApiTags('sheets')` — classe do controller (já existia)
- `@ApiBearerAuth()` — classe do controller (já existia)
- GET `:id`: `@ApiOperation`, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiBadRequestResponse` — já existentes, sem alterações
- PUT `:id`: atualizada a descrição de `@ApiBadRequestResponse` para incluir validação de moedas e Volume Carregado

**DTOs**:
- `UpdateSheetDto`: campos `pc?`, `pp?`, `po?`, `pl?`, `loadedVolume?` com `@ApiPropertyOptional`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)` e mensagens de validação em pt-BR — já adicionados pela etapa 1
- `SheetResponseDto`: campos `pc`, `pp`, `po`, `pl`, `loadedVolume` com `@ApiProperty`, exemplos e descrições em pt-BR — já adicionados pela etapa 1

**Entidade (`Sheet`)**:
- `@ApiProperty` para `pc`, `pp`, `po`, `pl`, `loadedVolume` na classe entity — já adicionados pela etapa 1

Todos os decorators de documentação estão consistentes com o padrão do projeto (pt-BR, exemplos, descrições claras).

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-api/src/modules/sheets/entities/sheet.entity.ts
- app-api/src/database/migrations/1784306790000-AddVolumeAndCoinsToSheetsTable.ts
- app-api/src/modules/sheets/dto/update-sheet.dto.ts
- app-api/src/modules/sheets/dto/sheet-response.dto.ts
- app-api/src/modules/sheets/dto/create-sheet.dto.ts
- app-api/src/modules/sheets/sheets.service.ts
- app-api/src/modules/sheets/sheets.controller.ts

Pontos verificados especificamente:
- **Migration ↔ entidade**: as 5 colunas novas (`pc`, `pp`, `po`, `pl`, `loaded_volume`)
  batem exatamente entre `sheet.entity.ts` (`@Column({ type: 'int', default: 0 })`,
  com `name: 'loaded_volume'` apenas onde o nome da coluna difere da propriedade) e a
  migration (`integer NOT NULL DEFAULT 0` para as 5 colunas, mesma ordem em `up()` e
  ordem inversa em `down()`, sem naming strategy customizada no projeto — os nomes de
  coluna default do TypeORM para `pc`/`pp`/`po`/`pl` já coincidem com os nomes de
  propriedade).
- **`UpdateSheetDto`**: os 5 campos (`pc`, `pp`, `po`, `pl`, `loadedVolume`) usam
  `@IsOptional()` + `@Type(() => Number)` + `@IsInt()` + `@Min(0)`, todos com mensagens
  de validação em pt-BR consistentes com o padrão dos campos existentes
  (`currentHitPoints`/`temporaryHitPoints`/`level`). Corretamente sem `@ValidateIf`
  para `null`, já que os campos não são nuláveis (diferente de `currentHitPoints`/
  `temporaryHitPoints`).
- **`SheetResponseDto`**: os 5 campos são `@ApiProperty` (não opcionais, condizente
  com colunas `NOT NULL`), preenchidos em `fromEntity` diretamente a partir da
  entidade, sem vazamento de dados de outras entidades/campos sensíveis.
- **Serviço (`sheets.service.ts`, método `update`)**: replica fielmente o padrão de
  atribuição condicional (`if (dto.campo !== undefined) sheet.campo = dto.campo`) já
  usado para `currentHitPoints`/`temporaryHitPoints`, para os 5 campos novos.
- **`create()` / defaults**: os 5 campos não são setados explicitamente em
  `sheetsRepository.create(...)` na criação da ficha; isso não gera inconsistência,
  pois as colunas declaram `default: 0` na metadata do TypeORM, o que faz o
  `InsertQueryBuilder` incluí-las na cláusula `RETURNING` do Postgres e popular
  corretamente o valor `0` de volta na entidade retornada por `save()`.
- **Controller/Swagger**: `GET /sheets/:id` e `PUT /sheets/:id` continuam protegidos
  por `@UseGuards(JwtAuthGuard)` (nível de classe) sem alteração de rota; a descrição
  do `@ApiBadRequestResponse` do `PUT /sheets/:id` foi atualizada para mencionar a
  validação de moedas/Volume Carregado, condizente com o comportamento real do
  endpoint. Acesso Google não se aplica (nenhum endpoint novo criado; a restrição a
  fichas próprias via `isRestrictedToOwnSheets` já existente permanece inalterada).
- **Listagem**: `SheetListItemResponseDto`/`PaginatedSheetsResponseDto` e a query de
  `findAllPaginated` (que seleciona apenas `id`/`name` na etapa de paginação)
  corretamente não foram alterados, conforme o spec definir moedas/volume como parte
  apenas da visualização detalhada da ficha.