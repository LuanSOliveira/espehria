# Task API: Menção a entidades (@mention) — endpoint de busca global

## Contexto
Ver .claude/tasks/entity-mentions/spec.md

Escopo backend confirmado na spec: criar um módulo `search` novo, sem alterar
nenhuma entidade existente, sem migration, expondo `GET /search?query=...`
protegido por `JwtAuthGuard`. Não há necessidade de nenhum outro endpoint novo
para resolver o nome atual de uma entidade mencionada (decisão detalhada
abaixo, na etapa 1).

Módulos de referência usados como padrão: `app-api/src/modules/users/` e
`app-api/src/modules/creatures/` (estrutura de módulo, DTOs com
`class-validator`/`@ApiProperty`, convenção `fromEntity`, `JwtAuthGuard`,
`ILIKE` para busca por nome, mensagens de erro em pt-BR).

## Etapas

### 1. api-dev

Status: concluído
Entidade: não aplicável (nenhuma entidade criada/alterada; `entityType` é atribuído em código a partir de `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`)
Migration: não aplicável
Rotas: GET /search
Arquivos:
- app-api/src/modules/search/enums/linkable-entity-type.enum.ts
- app-api/src/modules/search/dto/search-query.dto.ts
- app-api/src/modules/search/dto/search-result-item-response.dto.ts
- app-api/src/modules/search/search.service.ts
- app-api/src/modules/search/search.controller.ts
- app-api/src/modules/search/search.module.ts
- app-api/src/app.module.ts (registro do SearchModule)

Decisões de escopo tomadas durante a implementação (não explícitas na spec/task):
- `SearchQueryDto.query` valida apenas `@IsString()` + `@IsNotEmpty()`, sem
  `@MinLength(2)` — seguindo a decisão já registrada na task de que o mínimo de
  2 caracteres é responsabilidade de UX do frontend, não do contrato da API.
  Sinalizando aqui a preferência default (sem `@MinLength(2)`) para validação
  antes de fechar em definitivo.
- Ordem de mesclagem entre tipos: resultados de `User` são concatenados antes
  dos de `Creature` (busca até 10 em cada, concatena nessa ordem fixa e então
  trunca em 10 no total), conforme decisão já registrada na task — nenhuma
  prioridade de produto foi definida entre os tipos.
- A busca em `User` não filtra por `provider` (ex.: `AuthProvider.LOCAL`,
  usado em `UsersService.findAllLocalPaginated`) — considera todos os
  usuários, já que a task/spec não menciona essa restrição para o endpoint de
  busca global. Sinalizando essa decisão para validação, caso o time prefira
  restringir a usuários locais.

#### Entidade
- Não é necessária nenhuma entidade nova nem alteração em entidades existentes
  (`User`, `Creature`). Conforme decisão arquitetural já validada na spec, o
  `entityType` **não** é uma coluna de banco — é atribuído em código, no
  service do novo módulo, conforme qual repositório está sendo consultado.
- Criar um enum `LinkableEntityType` (ex.:
  `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`), seguindo o
  padrão de `AuthProvider`
  (`app-api/src/modules/users/enums/auth-provider.enum.ts`):
  ```
  USER = 'user'
  CREATURE = 'creature'
  ```
  Esse enum é a "lista fixa e mantida manualmente" de tipos linkáveis citada na
  spec; adicionar novos tipos no futuro (ex.: uma terceira entidade) significa
  adicionar um valor aqui e uma entrada na lista de busca do service (ver
  abaixo) — nenhuma migration envolvida.
- Novo módulo `SearchModule`
  (`app-api/src/modules/search/search.module.ts`) importando
  `TypeOrmModule.forFeature([User, Creature])` diretamente (não depende de
  `UsersModule`/`CreaturesModule`, pois só precisa dos repositórios para uma
  busca somente-leitura por `name`). Registrar `SearchModule` em
  `app.module.ts` (import na lista de módulos, ao lado de `UsersModule`,
  `CreaturesModule`, etc. — feito pelo `api-dev` junto com o restante da
  implementação).

#### Migration
- Necessária: não. Nenhuma coluna, tabela ou constraint é criada/alterada;
  `entityType` é um valor calculado em código, nunca persistido. Confirmar que
  nenhuma migration é gerada para esta feature.

#### Controller
- Módulo: `search` (`app-api/src/modules/search/`).
- Endpoints:
  - `GET /search?query=<string>` — protegido por `@UseGuards(JwtAuthGuard)` +
    `@ApiBearerAuth()`, seguindo exatamente o padrão de
    `UsersController`/`CreaturesController` (`@ApiTags('search')`).
- DTOs:
  - **Request** — `SearchQueryDto`
    (`app-api/src/modules/search/dto/search-query.dto.ts`): campo `query:
    string`, obrigatório, com `@IsString()` + `@IsNotEmpty()` e
    `@ApiProperty({ description: 'Texto a ser buscado no nome das entidades
    linkáveis' })`. Decisão de escopo do planejamento: o backend valida apenas
    que `query` é uma string não vazia — a regra de "mínimo de 2 caracteres
    após o @" é responsabilidade de UX do frontend (debounce/gatilho), não uma
    restrição de contrato da API; se o time preferir replicar essa regra no
    backend com `@MinLength(2)`, sinalizar essa preferência antes de
    implementar, pois não está explícita na spec como requisito de API.
  - **Response** — `SearchResultItemResponseDto`
    (`app-api/src/modules/search/dto/search-result-item-response.dto.ts`):
    ```
    id: string          (@ApiProperty({ format: 'uuid' }))
    name: string         (@ApiProperty())
    entityType: LinkableEntityType (@ApiProperty({ enum: LinkableEntityType }))
    ```
    Sem `fromEntity(entity)` único (a entidade de origem varia); usar um
    factory estático que recebe explicitamente o tipo, ex.:
    `static fromEntity(entity: { id: string; name: string }, entityType:
    LinkableEntityType): SearchResultItemResponseDto`, chamado pelo service
    com o `entityType` correto para cada repositório consultado.
  - O endpoint retorna diretamente `SearchResultItemResponseDto[]`
    (`@ApiOkResponse({ type: [SearchResultItemResponseDto] })`) — sem
    envelope de paginação (`Paginated*ResponseDto`), pois a spec define
    explicitamente "sem paginação, apenas truncando nos 10 primeiros".
- Service (`SearchService`,
  `app-api/src/modules/search/search.service.ts`):
  - Mantém internamente a lista fixa de entidades linkáveis, ex.: um array
    `[{ entityType: LinkableEntityType.USER, repository: usersRepository },
    { entityType: LinkableEntityType.CREATURE, repository:
    creaturesRepository }]`.
  - Para cada entrada, roda uma query `ILIKE` sobre `name`
    (`.createQueryBuilder(alias).where('<alias>.name ILIKE :query', { query:
    \`%${query}%\` }).orderBy('<alias>.name', 'ASC').take(10).getMany()`),
    igual ao padrão já usado em `UsersService.findAllLocalPaginated` e
    `CreaturesService.findAllPaginated`.
  - Consolida os resultados de todas as entidades (mapeando cada um para
    `SearchResultItemResponseDto.fromEntity(row, entityType)`) e trunca ao
    total de 10 primeiros. Decisão de implementação (não coberta explicitamente
    na spec): buscar até 10 por entidade, concatenar na ordem da lista fixa
    (`User`, depois `Creature`) e então cortar em 10 — a spec não define uma
    ordem de "prioridade" entre tipos quando ambos retornam resultados; se essa
    ordem importar para o produto, validar com o usuário antes de fechar a
    implementação.
  - Sem autenticação/verificação adicional além do `JwtAuthGuard` do
    controller — a service não recebe nem valida o usuário autenticado, pois
    a busca não é escopada por usuário.

- **Decisão: resolução do nome atual da entidade mencionada (não criar
  endpoint novo)**
  - A spec pede que a tag de menção sempre exiba o nome atual da entidade
    (refletindo renomeações), e levanta como possível necessidade técnica um
    endpoint para resolver `id + entityType -> nome atual`, sugerindo either
    um endpoint novo (ex. `GET /search/resolve`) ou reaproveitar endpoints de
    detalhe já existentes.
  - Decisão deste plano: **reaproveitar os endpoints de detalhe já
    existentes** — `GET /users/:id` (`UsersController.findOne`) e `GET
    /creatures/:id` (`CreaturesController.findOne`) — em vez de criar um
    endpoint de resolução dedicado no módulo `search`. Motivos:
    1. Ambos os endpoints já existem, já são protegidos por `JwtAuthGuard` e
       já retornam `name` no corpo (`UserResponseDto.name`,
       `CreatureResponseDto.name`), então nenhum trabalho de backend adicional
       é necessário para obter o nome atual.
    2. Para o caso que efetivamente abre o `ViewModal` nesta entrega
       (`creature`), o frontend já precisa buscar o objeto completo via `GET
       /creatures/:id` para popular o `CreatureView` (que exibe habitat, dieta,
       etc., não só o nome) — reaproveitar essa mesma chamada para resolver o
       nome evita uma segunda requisição.
    3. Mantém a responsabilidade do módulo `search` restrita ao que a spec
       define para ele (busca por `name` com lista fixa), sem duplicar em
       dois lugares (search + endpoints de detalhe) o mapeamento
       `entityType -> como buscar essa entidade`.
    4. Ambos os endpoints já retornam 404 com mensagem em pt-BR ("Usuário não
       encontrado.", "Criatura não encontrada.") quando o id não existe, o que
       cobre o caso de entidade excluída — o frontend intercepta esse erro e
       exibe seu próprio toast genérico "entidade não encontrada", sem
       precisar de um formato de erro específico do backend.
  - Implicação para o frontend (documentada aqui para consistência, mas fora
    do escopo de implementação deste agente): o dispatcher
    `entityType -> view` mencionado na spec deve ter, em paralelo, um mapa
    `entityType -> função de resolução` (`creature -> GET /creatures/:id`,
    `user -> GET /users/:id`) usado tanto para resolver o nome exibido na tag
    quanto (no caso de `creature`) para obter os dados completos ao abrir o
    `ViewModal`.
  - Nenhum endpoint novo de resolução é criado por esta tarefa. Caso, durante
    a implementação, se perceba que reaproveitar os endpoints de detalhe é
    inviável por algum motivo não previsto aqui (ex.: overfetching
    problemático, necessidade de um formato de erro uniforme entre tipos),
    sinalizar antes de introduzir um endpoint novo não coberto por este plano.

### 2. api-dev-doc

Status: concluído

- Depende da etapa 1.
- Documentação Swagger a cobrir:
  - `@ApiTags('search')` no novo `SearchController`.
  - `@ApiOperation({ summary: 'Busca entidades linkáveis (usuários e
    criaturas) por nome, para uso em menções (@mention)' })` no endpoint
    `GET /search`.
  - `@ApiOkResponse({ type: [SearchResultItemResponseDto] })`.
  - `@ApiBadRequestResponse` documentando o caso de `query` ausente/vazio
    (rejeitado pelo `ValidationPipe` global).
  - `@ApiBearerAuth()` no controller (mesmo padrão de `UsersController`/
    `CreaturesController`).
  - `@ApiProperty` completos em `SearchQueryDto` e
    `SearchResultItemResponseDto`, incluindo o enum `LinkableEntityType` em
    `entityType` (para o Swagger listar os valores possíveis `"user"` /
    `"creature"`).
  - Nenhuma alteração de documentação é necessária em `UsersController` ou
    `CreaturesController`, já que os endpoints `GET /users/:id` e `GET
    /creatures/:id` já existem e já estão documentados — apenas confirmar que
    a descrição desses endpoints continua correta ao serem reaproveitados
    pelo frontend para resolução de nome/dados.

Arquivos alterados:
- app-api/src/modules/search/search.controller.ts (adicionado @ApiOperation e @ApiBadRequestResponse)
- app-api/src/modules/search/dto/search-query.dto.ts (adicionado example ao @ApiProperty)
- app-api/src/modules/search/dto/search-result-item-response.dto.ts (adicionado descriptions completos aos @ApiProperty de todos os campos)

### 3. api-dev-codereviewer

Status: Pendente

- Revisar tudo acima, com atenção especial a:
  - Confirmar que nenhuma migration foi criada e que nenhuma entidade
    (`User`, `Creature`) foi alterada.
  - Confirmar que `entityType` nunca é lido de coluna de banco, apenas
    atribuído em código a partir do repositório de origem.
  - Confirmar que o limite de 10 resultados é aplicado sobre o total
    consolidado (não 10 por entidade sem truncamento final).
  - Confirmar `JwtAuthGuard` aplicado ao `SearchController`.
  - Confirmar mensagens de erro/validação em pt-BR.
  - Confirmar que nenhum endpoint novo de "resolve por id+entityType" foi
    introduzido sem necessidade, conforme decisão registrada na etapa 1.

## Revisão

Etapas 1 (api-dev) e 2 (api-dev-doc) estão marcadas como "Status: concluído" —
revisão realizada sobre o trabalho como entregue.

Verificação dos pontos de atenção da etapa 3:

- Nenhuma migration foi criada (`app-api/src/database/migrations/` contém
  apenas as 3 migrations pré-existentes de `users`/`creature-categories`/
  `creatures`) e nenhuma entidade (`User`, `Creature`) foi alterada. OK.
- `entityType` nunca é lido de coluna de banco: é passado como parâmetro
  explícito para `SearchResultItemResponseDto.fromEntity(entity, entityType)`
  a partir da lista fixa `linkableEntities` em `search.service.ts`, nunca
  vindo do resultado da query. OK.
- Limite de 10 é aplicado sobre o total consolidado: cada repositório é
  truncado em 10 (`take(MAX_RESULTS)`), os arrays são concatenados
  (`results.push(...)`) e só então o array final é cortado com
  `results.slice(0, MAX_RESULTS)` em `search.service.ts`. OK, consistente com
  a decisão registrada na etapa 1 (busca até 10 por entidade, concatena na
  ordem fixa User→Creature, corta em 10 no total).
- `JwtAuthGuard` está aplicado em `SearchController` via `@UseGuards(JwtAuthGuard)`
  no nível de classe, junto de `@ApiBearerAuth()`, no mesmo padrão de
  `CreaturesController`/`UsersController`. OK.
- Nenhum endpoint de "resolve por id+entityType" foi introduzido — apenas o
  `GET /search` existe em `search.controller.ts`, conforme a decisão
  registrada na etapa 1 de reaproveitar `GET /users/:id` e
  `GET /creatures/:id`. OK.
- Mensagens em pt-BR: o módulo `search` não lança nenhuma exception própria
  (`NotFoundException`/`BadRequestException`), então não há mensagem de erro
  de negócio a verificar. O único erro possível (`query` ausente/vazio) é
  responsabilidade do `ValidationPipe` global com as mensagens padrão do
  `class-validator` (em inglês), que **não** foram customizadas para pt-BR
  aqui — mas isso é consistente com o restante do projeto (`CreateUserDto`,
  `FindCreaturesQueryDto`, etc. também não customizam mensagens de
  `class-validator`), portanto não é uma regressão introduzida por esta
  feature. Classificação: recomendação (não bloqueante), pois o CLAUDE.md pede
  mensagens de erro em pt-BR de forma geral, mas o padrão já estabelecido no
  projeto não cobre isso para erros de validação de DTO — sinalizando para
  decisão do time se deve virar um débito técnico transversal, fora do escopo
  desta task pontual.

Outros pontos verificados (fora da lista da etapa 3, mas parte do escopo geral
de revisão):

- Estrutura de módulo (`enums/`, `dto/`, `*.controller.ts`, `*.service.ts`,
  `*.module.ts`) segue o padrão de `users`/`creatures`. `SearchModule` está
  registrado em `app.module.ts` ao lado dos demais módulos. OK.
- `SearchQueryDto` usa `@IsString()` + `@IsNotEmpty()` + `@ApiProperty` com
  `example`, conforme decisão registrada de não exigir `@MinLength(2)`. OK,
  consistente com o que foi documentado na etapa 1.
- `SearchResultItemResponseDto.fromEntity` não vaza `password` do `User`: a
  query builder (`createQueryBuilder('entity')...getMany()`) nunca chama
  `.addSelect('entity.password')`, então a coluna `select: false` continua
  excluída por padrão, e o factory só copia `id`/`name`/`entityType` para o
  DTO de resposta — nenhum campo interno do `User` ou do `Creature` vaza. OK.
- `ILIKE` sobre `name` com `orderBy('entity.name', 'ASC')` e `take(10)` segue
  exatamente o padrão usado em `UsersService.findAllLocalPaginated` e
  `CreaturesService.findAllPaginated`. OK.
- Documentação Swagger (`@ApiTags('search')`, `@ApiOperation`,
  `@ApiOkResponse({ type: [SearchResultItemResponseDto] })`,
  `@ApiBadRequestResponse`, `@ApiBearerAuth()`, `@ApiProperty` com `enum:
  LinkableEntityType` em `entityType`) está presente e coerente com o
  comportamento real do endpoint. OK.

Nenhum problema bloqueante encontrado. Aprovado, com uma recomendação não
bloqueante registrada acima (mensagens de validação de `query` em inglês,
padrão já pré-existente no projeto — fora do escopo desta task corrigir).

Arquivos revisados:
- app-api/src/modules/search/enums/linkable-entity-type.enum.ts
- app-api/src/modules/search/dto/search-query.dto.ts
- app-api/src/modules/search/dto/search-result-item-response.dto.ts
- app-api/src/modules/search/search.service.ts
- app-api/src/modules/search/search.controller.ts
- app-api/src/modules/search/search.module.ts
- app-api/src/app.module.ts
