# Task API: Filtros de nome, level e tags em Treinamentos, Talentos e Características

## Contexto
Ver .claude/tasks/filtros-nome-level-tags/spec.md

Demanda de paridade total entre três módulos já existentes e estruturalmente idênticos:
`trainings`, `talents` e `characteristics`. Não há criação de entidade nova — apenas
extensão do filtro de listagem (`FindXQueryDto` + `findAllPaginated`) de cada um dos três
módulos para suportar `level` (valor exato) e `tagIds` (múltiplos, semântica AND),
combinados de forma cumulativa com o filtro de `name` já existente. As três alterações
são análogas e devem ser aplicadas de forma idêntica nos três módulos.

## Etapas

### 1. api-dev

#### Entidade
- Não se aplica. Nenhuma entidade nova é criada e nenhum campo é adicionado às entidades
  existentes (`Training`, `Talent`, `Characteristic` já possuem `name`, `level` e
  relacionamento com `tags` via `TrainingTag`/`TalentTag`/`CharacteristicTag`). Esta
  demanda altera apenas a camada de consulta (DTO de filtro + query builder no service),
  sem impacto de schema.

#### Migration
- Necessária: não. Não há alteração de schema (colunas, índices ou tabelas de junção
  permanecem como estão).

#### Controller
- Endpoints afetados (sem criar rota nova, apenas estendendo o filtro do endpoint de
  listagem já existente em cada módulo):
  - `GET /trainings`
  - `GET /talents`
  - `GET /characteristics`
- DTOs a alterar: `FindTrainingsQueryDto`, `FindTalentsQueryDto`,
  `FindCharacteristicsQueryDto` (um em cada módulo, mesma alteração nos três).
  - Adicionar `level?: number` opcional: `@IsOptional()`, `@Type(() => Number)`,
    `@IsInt({ message: 'O nível deve ser um número inteiro.' })`,
    `@Min(1, { message: 'O nível deve ser maior ou igual a 1.' })` — mesmas mensagens/
    regras já usadas no `level` do `CreateTrainingDto` (`app-api/src/modules/trainings/dto/create-training.dto.ts`),
    para manter consistência de validação entre criação e filtro.
  - Adicionar `tagIds?: string[]` opcional: `@IsOptional()`, `@IsArray()`,
    `@IsUUID('4', { each: true })` — mesmo padrão do `tagIds` do `CreateTrainingDto`.
    Como filtro vem via querystring, o controller precisa continuar aceitando o parâmetro
    repetido (`?tagIds=uuid1&tagIds=uuid2`) da forma como o `ValidationPipe` global já
    transforma array de query params (mesmo mecanismo hoje usado para outros filtros em
    array no projeto, se houver; caso os DTOs de consulta do projeto não tenham precedente
    de array em query string, o `api-dev` deve validar que o `class-transformer` está
    interpretando `tagIds` corretamente como array antes de finalizar).
  - `name` permanece sem alterações (busca parcial, case-insensitive, ILIKE).
- Ajuste no `findAllPaginated` de cada um dos três services
  (`trainings.service.ts`, `talents.service.ts`, `characteristics.service.ts`), no mesmo
  `queryBuilder` que já existe (o que hoje só aplica `andWhere` de `name`):
  - Filtro por `level`: `andWhere('<alias>.level = :level', { level: query.level })`
    quando `query.level` estiver definido. Valor exato, sem faixa.
  - Filtro por `tagIds` com semântica AND (registro deve possuir TODAS as tags
    selecionadas): não é possível resolver com um único `IN` simples, pois isso
    implementaria OR. A abordagem a seguir no `api-dev` é fazer `innerJoin` do
    `queryBuilder` principal com a tabela de junção correspondente
    (`training_tags`/`talent_tags`/`characteristic_tags`) filtrando
    `tag_id IN (:...tagIds)`, agrupando por `<alias>.id` (`groupBy`) e aplicando
    `having('COUNT(DISTINCT <junction>.tag_id) = :tagCount', { tagCount: tagIds.length })`
    — só quando `query.tagIds` estiver definido e não vazio. Isso é compatível com o
    padrão atual do método, que já seleciona apenas `id`/`name` na primeira query (para
    paginação) e depois recarrega as entidades completas com `tags` via
    `loadOrderedTagsMap` — o `api-dev` deve preservar esse fluxo em duas etapas
    (buscar ids paginados/filtrados → recarregar entidades completas + tags ordenadas),
    sem duplicar linhas por causa do join com a tabela de junção (o `groupBy`/`having`
    evita isso).
  - Todos os filtros (`name`, `level`, `tagIds`) continuam cumulativos via `andWhere`
    encadeado no mesmo `queryBuilder`, mantendo `orderBy('<alias>.name', 'ASC')`,
    `skip`/`take` como já estão.
  - Esta mesma lógica de filtro (name + level + tags AND) deve ser replicada de forma
    idêntica nos três services, respeitando os nomes de alias/tabela de junção
    específicos de cada módulo (`training`/`training_tags`, `talent`/`talent_tags`,
    `characteristic`/`characteristic_tags`).
- Sinalização de lacuna de requisito: o spec não define explicitamente o formato de
  envio de `tagIds` na querystring (múltiplos parâmetros repetidos `tagIds=a&tagIds=b`
  vs. lista separada por vírgula). O `api-dev` deve seguir o padrão de query array já
  usado em outros filtros do projeto, se existir; caso não haja precedente, adotar o
  formato de parâmetro repetido (`tagIds[]` ou `tagIds` repetido), que é o suportado
  nativamente pelo `ValidationPipe`/`class-transformer` do Nest sem configuração
  adicional, e documentar a escolha no Swagger (`isArray: true` em `@ApiPropertyOptional`).
- `@ApiOperation({ summary: ... })` dos três endpoints `GET` de listagem deve ser
  atualizado para mencionar os novos filtros (ex.: "Lista treinamentos com paginação e
  filtro por nome, level e tags").
- Acesso Google: mantém o nível já existente nos três controllers — `read-only`
  (`@GoogleAccess('read-only')`, já aplicado hoje em `TrainingsController`,
  `TalentsController` e `CharacteristicsController`). Nenhuma mudança de acesso é
  necessária, pois o endpoint alterado (`GET` de listagem) já é de leitura.

Status: concluído
Entidade: não aplicável (nenhuma entidade nova ou alterada; `Training`, `Talent`,
`Characteristic` permanecem inalteradas)
Migration: não aplicável (nenhuma alteração de schema)
Rotas: GET /trainings, GET /talents, GET /characteristics (mesmas rotas já
existentes, apenas com filtro estendido)
Arquivos:
- app-api/src/modules/trainings/dto/find-trainings-query.dto.ts
- app-api/src/modules/trainings/trainings.service.ts
- app-api/src/modules/trainings/trainings.controller.ts
- app-api/src/modules/talents/dto/find-talents-query.dto.ts
- app-api/src/modules/talents/talents.service.ts
- app-api/src/modules/talents/talents.controller.ts
- app-api/src/modules/characteristics/dto/find-characteristics-query.dto.ts
- app-api/src/modules/characteristics/characteristics.service.ts
- app-api/src/modules/characteristics/characteristics.controller.ts

Decisão de serialização de `tagIds` na querystring (lacuna deixada em aberto pelo
plano): foi adotado o formato de parâmetro repetido com notação de colchetes,
`tagIds[]=<uuid1>&tagIds[]=<uuid2>&...` (ex.:
`GET /trainings?tagIds[]=550e8400-e29b-41d4-a716-446655440000&tagIds[]=6ba7b810-9dad-11d1-80b4-00c04fd430c8`).
Motivo: o parser de querystring padrão do Express/Nest (`qs`) só garante que o valor
chegue como array em `query.tagIds` (necessário para passar em `@IsArray()`) quando a
notação de colchetes é usada — com `tagIds=a&tagIds=b` "puro" (sem colchetes), um
único valor selecionado chega como string simples em vez de array de um elemento,
falhando a validação `@IsArray()`. A notação `tagIds[]=...` funciona de forma
consistente tanto para uma tag quanto para múltiplas. O frontend deve montar a
querystring dessa forma (a maioria dos serializadores de query de bibliotecas HTTP,
como `qs`/axios com `paramsSerializer` padrão do `qs`, já gera esse formato
automaticamente para um array). Nota de pendência para `api-dev-doc`: documentar esse
formato explicitamente na descrição do `@ApiPropertyOptional` de `tagIds` nos três
DTOs (além de `isArray: true`, que já foi adicionado nesta etapa).

Nota técnica adicional (não pedida explicitamente na task, mas necessária para
correção): o método interno `getManyAndCount()` do TypeORM não computa corretamente o
`total` quando a query usa `groupBy`/`having` (o count interno ignora o
agrupamento, o que produziria um `total` incorreto ao filtrar por `tagIds`). Por isso,
nos três services o cálculo de `total` foi separado do de `ids` paginados: o `total` é
obtido via `queryBuilder.clone().select('<alias>.id').getRawMany().length` (conta as
linhas já agrupadas/filtradas, sem paginação), e os `ids` da página atual via
`.select([...]).orderBy(...).skip(...).take(...).getMany()`. Isso preserva o fluxo em
duas etapas (buscar ids paginados/filtrados → recarregar entidades completas + tags)
já existente, apenas corrigindo a fonte do `total`.

### 2. api-dev-doc
- Depende da etapa 1.
- Atualizar `@ApiPropertyOptional` de `level` e `tagIds` nos três `FindXQueryDto` com
  descrição, exemplo e (para `tagIds`) `isArray: true`/`type: [String]`/`format: 'uuid'`,
  seguindo o padrão de documentação já usado no `tagIds` do `CreateTrainingDto` e
  equivalentes.
- Revisar o `@ApiOperation` dos três endpoints `GET /trainings`, `GET /talents`,
  `GET /characteristics` para refletir os novos filtros disponíveis.
- Conferir que o Swagger consolidado (`/docs`) reflete a paridade entre os três módulos
  (mesmos nomes de campo, mesmas descrições, mesmo padrão de exemplo).

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - Paridade real de implementação entre os três services (mesma lógica de
    `innerJoin`/`groupBy`/`having` para o filtro AND de tags, sem divergência de alias
    ou nome de coluna).
  - Ausência de duplicação de linhas na paginação (`total`/`data`) causada pelo `innerJoin`
    com a tabela de junção ao filtrar por tags.
  - Validação correta de `level` (inteiro ≥ 1) e `tagIds` (array de UUIDs v4) nos três
    DTOs de filtro.
  - Confirmação de que `name`, `level` e `tagIds` continuam sendo combináveis de forma
    cumulativa (AND) quando mais de um filtro é enviado simultaneamente.
  - Confirmação de que nenhuma migration foi criada indevidamente, já que não há
    alteração de schema.

Status: concluído

## Revisão

Arquivos revisados (paridade confirmada nos três módulos, mesma estrutura, alias e
nomes de coluna/tabela de junção em cada um):
- app-api/src/modules/trainings/dto/find-trainings-query.dto.ts
- app-api/src/modules/trainings/trainings.service.ts
- app-api/src/modules/trainings/trainings.controller.ts
- app-api/src/modules/talents/dto/find-talents-query.dto.ts
- app-api/src/modules/talents/talents.service.ts
- app-api/src/modules/talents/talents.controller.ts
- app-api/src/modules/characteristics/dto/find-characteristics-query.dto.ts
- app-api/src/modules/characteristics/characteristics.service.ts
- app-api/src/modules/characteristics/characteristics.controller.ts

Pontos confirmados como corretos (sem achados):
- Paridade de implementação é real e completa entre os três services: mesmo padrão de
  `innerJoin`/`groupBy('<alias>.id')`/`having('COUNT(DISTINCT <junction>.tag_id) = :tagCount', ...)`,
  com os aliases/tabelas de junção corretos para cada módulo
  (`training_tags`/`training_tag_filter`, `talent_tags`/`talent_tag_filter`,
  `characteristic_tags`/`characteristic_tag_filter`), e nomes de coluna FK
  (`training_id`/`tag_id` etc.) conferem com os `@JoinColumn` das entidades
  `TrainingTag`/`TalentTag`/`CharacteristicTag`.
- Não há duplicação de linhas na paginação: o `groupBy('<alias>.id')` agrupa por
  chave primária, e como `training.id`/`talent.id`/`characteristic.id` é a PK da
  tabela principal, o PostgreSQL aceita `training.name` no `SELECT`/`ORDER BY` mesmo
  fora do `GROUP BY` por dependência funcional — não gera erro nem linhas repetidas.
  Tanto a contagem (`total`) quanto os `ids` paginados usam a mesma query
  filtrada/agrupada (via `.clone()`), preservando consistência entre as duas etapas.
- `name`, `level` e `tagIds` continuam cumulativos (todos aplicados via `andWhere`
  encadeado na mesma `queryBuilder` antes do `groupBy`/`having`), confirmando semântica
  AND entre os três filtros.
- Validação de `level` (`@IsInt` + `@Min(1)`, mesmas mensagens do `CreateTrainingDto`) e
  `tagIds` (`@IsArray` + `@IsUUID('4', { each: true })`) está correta e idêntica nos
  três DTOs de filtro.
- Nenhuma migration foi criada para esta task (as migrations existentes em
  `src/database/migrations/` relacionadas a `Training`/`Talent`/`Characteristic` são
  anteriores e não fazem parte desta demanda), consistente com "não há alteração de
  schema".
- Acesso Google (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')`) mantido sem alteração nos três controllers, adequado
  por se tratar de endpoint de leitura.

Achados:

- **app-api/src/modules/trainings/trainings.service.ts:296-308** (e equivalente em
  **talents.service.ts:295-307** e **characteristics.service.ts:303-316**) — o filtro
  AND de `tagIds` usa `query.tagIds.length` diretamente como `tagCount` na cláusula
  `having`, sem deduplicar a lista recebida da querystring. Se o cliente enviar UUIDs
  repetidos (ex.: `tagIds[]=A&tagIds[]=A`), `tagCount` fica inflado (2) enquanto o
  `COUNT(DISTINCT ...tag_id)` real nunca passa da quantidade de tags únicas (1, já que
  a junção tem `@Unique(['training', 'tag'])`), fazendo a `HAVING` nunca bater e o
  registro ser excluído indevidamente do resultado — mesmo possuindo a tag solicitada.
  Isso é uma regressão em relação ao padrão já usado no mesmo service para o
  `create`/`update` de tags (`findTagsByIds` já deduplica com
  `[...new Set(tagIds)]`).
  - Trecho: `having('COUNT(DISTINCT training_tag_filter.tag_id) = :tagCount', { tagCount: query.tagIds.length })`
  - Sugestão: deduplicar `query.tagIds` antes de usá-lo tanto no `IN (:...tagIds)`
    quanto no `tagCount` (ex.: `const uniqueTagIds = [...new Set(query.tagIds)]`),
    replicando a mesma abordagem nos três services.

- **app-api/src/modules/trainings/trainings.service.ts:310-317** (e equivalente em
  **talents.service.ts:309-316** e **characteristics.service.ts:318-325**) — a correção
  do cálculo de `total` (necessária para o caso com `groupBy`/`having` de `tagIds`) é
  aplicada incondicionalmente, inclusive quando não há filtro de `tagIds` (e portanto
  nenhum `groupBy` foi montado). Nesse caso comum (listagem sem filtro de tags, ou só
  com `name`/`level`), a solução busca todos os ids da tabela inteira já filtrada via
  `getRawMany()` só para medir `.length`, em vez de um `SELECT COUNT(*)` — isto é mais
  caro em I/O/rede do que o `getManyAndCount()`/`getCount()` que o método usava
  implicitamente antes desta task (ou usaria naturalmente na ausência de
  `groupBy`/`having`), e passa a exigir uma consulta adicional (a lista de treinamentos
  já filtrados) mesmo quando ela não seria necessária para simplesmente contar. Em
  tabelas grandes, isso é uma regressão de performance para o caso mais comum
  (listagem sem filtro de tags).
  - Trecho: `const total = (await queryBuilder.clone().select('training.id').getRawMany()).length;`
  - Sugestão: aplicar a correção apenas quando `query.tagIds` estiver definido (ou seja,
    quando `groupBy`/`having` de fato existirem na query), usando, por exemplo,
    `queryBuilder.clone().getCount()` (ou equivalente) no caso simples sem tags, e
    reservar a estratégia de contagem via subquery (idealmente
    `SELECT COUNT(*) FROM (<query agrupada>) AS sub`, em vez de trazer todos os ids para
    a aplicação só para contar `.length`) para o caso com `tagIds`, reduzindo o volume
    de dados trafegado na contagem.

Correções aplicadas (idênticas nos três services —
`trainings.service.ts`, `talents.service.ts`, `characteristics.service.ts`):

1. Bug de corretude (`tagCount`): `query.tagIds` agora é deduplicado com
   `const uniqueTagIds = [...new Set(query.tagIds)]` antes de ser usado tanto no
   `IN (:...tagIds)` do `innerJoin` quanto no `tagCount` do `having`
   (`tagCount: uniqueTagIds.length`), eliminando o inflar de `tagCount` por UUIDs
   repetidos na querystring.
2. Regressão de performance (`total`): introduzida a variável
   `hasTagFilter = !!query.tagIds && query.tagIds.length > 0`, usada tanto para decidir
   se o `innerJoin`/`groupBy`/`having` são aplicados quanto para o cálculo de `total`.
   Quando `hasTagFilter` é `false` (sem filtro de tags, caso mais comum), `total` passa a
   ser obtido via `queryBuilder.clone().getCount()` (um `SELECT COUNT(*)` simples, sem
   trazer ids para a aplicação); quando `hasTagFilter` é `true`, mantém-se a estratégia
   anterior (`select('<alias>.id').getRawMany().length`), necessária pois
   `getCount()`/`getManyAndCount()` não computam corretamente o total sob `groupBy`/
   `having`.

## Re-revisão

Escopo: verificação pontual das duas correções aplicadas pelo `api-dev` (relatadas
acima em "Correções aplicadas") nos três services:
- app-api/src/modules/trainings/trainings.service.ts (`findAllPaginated`, linhas 275-356)
- app-api/src/modules/talents/talents.service.ts (`findAllPaginated`, linhas 275-353)
- app-api/src/modules/characteristics/characteristics.service.ts (`findAllPaginated`,
  linhas 282-372)

Pontos verificados:

1. **Deduplicação de `tagIds`** — confirmada e consistente nos três services.
   `const uniqueTagIds = [...new Set(query.tagIds)]` é calculado uma única vez dentro do
   bloco `if (hasTagFilter)` e reutilizado tanto no `innerJoin(...IN (:...tagIds), {
   tagIds: uniqueTagIds })` quanto no `having(..., { tagCount: uniqueTagIds.length })`
   (`trainings.service.ts:296-309`, `talents.service.ts:295-308`,
   `characteristics.service.ts:303-317`). Não há mais divergência entre a lista usada no
   `IN` e a usada para contagem — a semântica AND ("possui todas as tags solicitadas",
   contadas uma única vez cada) está correta mesmo com UUIDs repetidos na querystring.

2. **Cálculo de `total` nos dois caminhos** — confirmado correto e sem regressão de
   paginação nos três services. `hasTagFilter` decide de forma binária a estratégia:
   sem filtro de tags, `queryBuilder.clone().getCount()` (COUNT simples, sem `groupBy`);
   com filtro de tags, `(await queryBuilder.clone().select('<alias>.id').getRawMany()).length`
   sobre a query já com `innerJoin`/`groupBy`/`having` aplicados — uma linha por registro
   agrupado, contagem correta. O `.clone()` é tirado antes da aplicação de
   `select(['id','name'])`/`orderBy`/`skip`/`take` usados para buscar os `ids` da página
   atual, preservando os parâmetros (`name`, `level`, `tagIds`, `tagCount`) e não
   interferindo na paginação em nenhum dos dois caminhos.

3. **Paridade entre os três módulos** — preservada integralmente. A estrutura do
   `findAllPaginated` (nomes de variável `hasTagFilter`/`uniqueTagIds`/`total`/`ids`,
   ordem das operações, comentário explicativo sobre a limitação do
   `getManyAndCount()`/`getCount()` sob `groupBy`/`having`) é idêntica nos três services,
   diferindo apenas nos identificadores específicos de cada módulo (alias da entidade,
   nome da tabela de junção e do alias de filtro, mensagens de exceção). Nenhuma
   divergência de implementação entre `trainings`, `talents` e `characteristics`.

Resultado: **Aprovado.** As duas correções relatadas pelo `api-dev` foram aplicadas de
forma correta e idêntica nos três services, resolvendo integralmente os dois achados
anteriores (inflar de `tagCount` por UUIDs repetidos e custo desnecessário de `total`
via `getRawMany()` no caminho sem filtro de tags), sem introduzir nova regressão de
corretude ou de paginação. Nenhum novo achado nesta re-revisão.
