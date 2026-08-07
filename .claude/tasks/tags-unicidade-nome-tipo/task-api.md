# Task API: Unicidade de Tag por (name, type)

## Contexto
Não há `spec.md` para esta demanda — a regra de negócio já foi esclarecida diretamente
pelo solicitante:

- Hoje a unicidade de `Tag` é só por `name` (índice único `IDX_tags_name`).
- Nova regra: unicidade passa a ser pela combinação `(name, type)`.
- Duas tags com mesmo `name` e `type` diferentes: permitido.
- Duas tags com mesmo `name` e mesmo `type` (incluindo ambas com `type = null`):
  bloqueado.

## Etapas

### 1. api-dev

#### Entidade

Arquivo: `app-api/src/modules/tags/entities/tag.entity.ts`.

- Remover o `@Index({ unique: true })` que hoje está no campo `name`.
- Campos da entidade não mudam (`name: string`, `color: string`,
  `type: string | null`) — a alteração é só na indexação/constraint, não no shape
  dos dados.
- **Sobre declarar o novo índice composto na entidade**: a regra de negócio exige
  tratar `type = NULL` como um valor comparável (duas tags com mesmo `name` e ambas
  `type = NULL` devem colidir). Um índice único padrão do Postgres em `(name, type)`
  **não** cobre esse caso, porque o Postgres trata cada `NULL` como distinto em
  índices únicos. A estratégia escolhida é um índice único por expressão:
  `(name, COALESCE(type, ''))`.
  - O decorator `@Index()` do TypeORM não tem suporte direto para índices por
    expressão (`COALESCE(...)`) — ele gera índices sobre nomes de coluna, não sobre
    expressões arbitrárias. Portanto **este índice não deve ser declarado via
    decorator na entidade**; ele deve existir apenas como SQL puro na migration.
  - Deixar um comentário curto no arquivo da entidade, acima da classe ou do campo
    `name`, explicando que a unicidade de `(name, type)` é garantida por um índice
    de expressão criado diretamente na migration (não representável via
    `@Index`), para que quem rodar `migration:generate` no futuro não estranhe a
    ausência do decorator nem tente "corrigir" isso gerando uma migration que
    dropa o índice.
  - Importante: como esse índice não está espelhado na metadata da entidade, é
    esperado (e aceitável) que uma futura `migration:generate` possa detectar o
    índice como "extra" em relação à entidade. `api-dev` deve estar ciente disso
    ao revisar diffs gerados automaticamente no futuro — não é uma tarefa desta
    etapa, é só um alerta a registrar.
  - A validação de negócio em si (bloquear duplicata) é feita primariamente pelo
    service, na criação/atualização (ver abaixo); o índice único no banco é a
    segunda camada de proteção (garante consistência mesmo sob concorrência/race
    condition).

#### Migration

- Necessária: sim (toda alteração de schema/índice passa por migration, `synchronize`
  é `false`).
- Nova migration: `src/database/migrations/<timestamp>-ChangeTagsUniqueIndexToNameAndType.ts`
  (timestamp epoch em milissegundos, 13 dígitos, maior que o das migrations
  existentes de tags).
- `up()`:
  1. `DROP INDEX "public"."IDX_tags_name"` — remove o índice único antigo.
  2. `CREATE UNIQUE INDEX "IDX_tags_name_type" ON "tags" ("name", COALESCE("type", ''))`
     — cria o índice único composto, tratando `type = NULL` como `''` para fins de
     comparação de unicidade.
- `down()`: reverte na ordem inversa —
  1. `DROP INDEX "public"."IDX_tags_name_type"`.
  2. `CREATE UNIQUE INDEX "IDX_tags_name" ON "tags" ("name")` (restaura o índice
     antigo, no mesmo formato da migration original `CreateTagsTable`).
- Risco com dados existentes: nenhum. Como o índice único antigo já garantia
  unicidade só por `name`, não podem existir hoje duas tags com o mesmo `name`
  (com ou sem `type` igual) — logo a criação do novo índice único composto não
  encontrará violação de dados ao ser aplicada.
- Seguir o padrão de estilo da skill `api-migration` (SQL puro via
  `queryRunner.query(...)`, nome de classe = nome do arquivo, propriedade `name`
  idêntica ao nome da classe). Não executar `migration:run` automaticamente —
  perguntar ao usuário antes, conforme a skill.

#### Controller e Service

Não há novo endpoint — os endpoints existentes (`POST /tags`, `PUT /tags/:id`)
continuam os mesmos. A mudança é na lógica de validação de unicidade dentro do
`TagsService`, consumida pelo controller já existente.

- Endpoints (sem alteração de rota): `POST /tags`, `GET /tags`, `GET /tags/:id`,
  `PUT /tags/:id`, `DELETE /tags/:id`.
- DTOs: `CreateTagDto`, `UpdateTagDto` (sem alteração de campos — `name`, `color`,
  `type?` já existem e cobrem o necessário).
- **Service (`app-api/src/modules/tags/tags.service.ts`)**:
  - Renomear `findByName(name: string)` para `findByNameAndType(name: string, type: string | null)`.
    Como confirmado, esse método só é consumido internamente em `tags.service.ts`
    (linhas 40 e 87) — nenhum controller ou outro módulo depende da assinatura
    atual, então pode ser alterado livremente.
  - Implementação: usar `createQueryBuilder` (ou `findOneBy` com tratamento
    condicional) para buscar por `name` E `type`, tratando `type` ausente/`undefined`
    como `null`. Ao consultar `type = null`, usar `IsNull()` do TypeORM
    (`findOneBy({ name, type: IsNull() })`) em vez de `findOneBy({ name, type: null })`,
    já que este último não filtra corretamente por `NULL` no TypeORM.
  - `create()`: normalizar `dto.type` para `null` quando `undefined`, chamar
    `findByNameAndType(dto.name, type)`; se existir, lançar `ConflictException`
    com a nova mensagem.
  - `update()`: a validação atual só roda `if (dto.name && dto.name !== tag.name)`,
    o que não cobre o caso de alterar somente o `type` mantendo o `name` (e também
    não cobre alterar `type` para um valor que colide com outra tag de mesmo
    `name`). Trocar a lógica para:
    1. Calcular o par final resultante: `finalName = dto.name ?? tag.name`,
       `finalType = dto.type !== undefined ? dto.type : tag.type` (normalizando
       `undefined`/string vazia conforme o padrão já usado no DTO — `type` é
       opcional e pode vir `null`/ausente).
    2. Se `finalName !== tag.name || finalType !== tag.type`, buscar
       `findByNameAndType(finalName, finalType)` **excluindo o próprio registro**
       (`id != tag.id`, via `Not(id)` no `findOneBy`/`where` ou cláusula
       `andWhere('tag.id != :id', { id })` no query builder).
    3. Se encontrar outro registro com o mesmo par, lançar `ConflictException`.
    4. Só então aplicar `tag.name = finalName`, `tag.color = dto.color ?? tag.color`,
       `tag.type = finalType` e salvar.
  - Mensagem de erro: trocar `'Este nome já está em uso.'` por
    `'Já existe uma tag com este nome e tipo.'` (pt-BR, mesmo tom das mensagens
    já usadas no módulo) em `create()` e `update()`.
  - Não é necessário tratamento adicional de erro `23505` do Postgres para esta
    demanda — a validação de aplicação cobre o caminho normal, e o índice único
    composto é a rede de segurança para race conditions; não foi pedido tratamento
    explícito de conflito de baixo nível e não há padrão equivalente hoje no
    módulo (`create`/`update` atuais também não tratam `23505`), então manter
    consistência com o padrão existente.
- Acesso Google: já é `read-only` a nível de classe no controller
  (`@GoogleAccess('read-only')` em `TagsController`, `app-api/src/modules/tags/tags.controller.ts`
  linha 40) — nenhuma mudança necessária aqui, pois esta demanda não altera
  endpoints nem seus níveis de acesso.

Status: concluído
Entidade: app-api/src/modules/tags/entities/tag.entity.ts
Migration: app-api/src/database/migrations/1784306410000-ChangeTagsUniqueIndexToNameAndType.ts
Rotas: sem alteração (POST /tags, GET /tags, GET /tags/:id, PUT /tags/:id, DELETE /tags/:id)
Arquivos: app-api/src/modules/tags/tags.service.ts (findByName renomeado para
findByNameAndType com suporte a excludeId e IsNull(); create() e update() usando o
novo par (name, type) e mensagem 'Já existe uma tag com este nome e tipo.')
Pendências: mensagens de erro em @ApiConflictResponse do TagsController e a
descrição do campo `name` em CreateTagDto ainda citam o texto/regra antigos —
ajuste de responsabilidade da etapa api-dev-doc, conforme já registrado na
seção "2. api-dev-doc" desta task.

### 2. api-dev-doc
- Depende da etapa 1.
- Ajustar as descrições de erro 409 (`@ApiConflictResponse`) em `POST /tags` e
  `PUT /tags/:id` no `TagsController`, hoje `'Este nome já está em uso.'`, para o
  novo texto `'Já existe uma tag com este nome e tipo.'`, mantendo consistência
  com a mensagem lançada pelo service.
- Atualizar a descrição do campo `name` em `CreateTagDto`
  (`@ApiProperty({ description: 'Nome da tag (deve ser único)' })`) para refletir
  que a unicidade agora é pela combinação nome+tipo (ex.: "Nome da tag (único em
  conjunto com o tipo)").
- Fora esses dois pontos (mensagem de conflito e descrição do campo `name`), não
  há necessidade de novos `@ApiProperty`, novas tags Swagger ou novos schemas de
  resposta — os endpoints, DTOs de request/response e status codes não mudam.

Status: concluído
Arquivos alterados:
- app-api/src/modules/tags/tags.controller.ts (atualizado @ApiConflictResponse em POST e PUT)
- app-api/src/modules/tags/dto/create-tag.dto.ts (atualizado @ApiProperty description do campo name)

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - Se a query de `findByNameAndType` usa `IsNull()` corretamente para `type = null`
    (e não `findOneBy({ type: null })`, que não filtra por `NULL`).
  - Se a validação de `update()` cobre corretamente os três casos: alterar só
    `name`, alterar só `type`, e alterar ambos — sempre excluindo o próprio
    registro da busca de conflito.
  - Se a migration reflete exatamente o índice de expressão `(name, COALESCE(type, ''))`
    e se `down()` restaura fielmente o índice único antigo por `name`.
  - Se a entidade não declara (via decorator) um índice que não é representável
    pelo TypeORM, e se o comentário explicativo está presente e claro.
  - Se as mensagens de erro estão em pt-BR e consistentes entre service e Swagger.

## Revisão

- **app-api/src/modules/tags/tags.service.ts:40-44 e :47-49** — A normalização de
  `type` só trata `undefined`/`null` como equivalentes (`const type = dto.type ?? null;`
  em `create()`, e `type === null ? IsNull() : type` em `findByNameAndType()`), mas o
  índice único criado na migration `ChangeTagsUniqueIndexToNameAndType` é sobre
  `COALESCE("type", '')`, que trata `NULL` e `''` (string vazia) como o **mesmo**
  valor no Postgres. Como `CreateTagDto`/`UpdateTagDto` permitem `type` vazio
  (`@IsOptional() @IsString() @MaxLength(100)`, sem `@IsNotEmpty()`), é possível
  reproduzir de forma determinística (não é caso de *race condition*):
  1. Criar tag `name = 'X'`, `type` ausente → persiste `type = null`.
  2. Criar tag `name = 'X'`, `type = ''` → `findByNameAndType('X', '')` cai no
     ramo `else` do ternário (`type === null` é `false` para `''`), consulta
     `type = ''` (comparação literal, não `IsNull()`), não encontra a tag do passo 1
     e a validação de aplicação deixa passar.
  3. O `INSERT` então viola o índice único (`COALESCE(NULL, '') = COALESCE('', '') = ''`),
     lançando um erro Postgres `23505` **não tratado** (a task decidiu não tratar
     `23505` partindo da premissa de que o índice só serviria de proteção contra
     concorrência) — o cliente recebe um `500 Internal Server Error` cru em vez do
     `409 ConflictException` com mensagem em pt-BR esperado.
  - Trecho: `type: type === null ? IsNull() : type,` (`tags.service.ts:42`) e
    `const type = dto.type ?? null;` (`tags.service.ts:48`)
  - Sugestão: normalizar `type` de forma consistente em todos os pontos (criação,
    atualização e busca de conflito), tratando string vazia como equivalente a
    `null` — por exemplo `const type = dto.type?.trim() ? dto.type.trim() : null;`
    tanto em `create()` quanto no cálculo de `finalType` em `update()` — para que a
    validação de aplicação espelhe a semântica de `COALESCE(type, '')` usada no
    índice.

- **app-api/src/modules/tags/dto/create-tag.dto.ts:30-37** (herdado por
  `update-tag.dto.ts` via `PartialType`) — O campo `type` é tipado/documentado como
  `type?: string` (sem `nullable: true` no `@ApiPropertyOptional`), mas a lógica de
  `update()` em `tags.service.ts:96` (`dto.type !== undefined ? dto.type : tag.type`)
  já depende de aceitar `type: null` explícito no corpo da requisição para permitir
  "resetar" o tipo de uma tag para `null` — cenário central desta task (duas tags
  com mesmo `name` e ambas `type = null` devem colidir). O Swagger não documenta
  essa possibilidade.
  - Trecho: `@ApiPropertyOptional({ description: 'Tipo da tag (campo livre, opcional)', example: 'Monstro' }) @IsOptional() @IsString() @MaxLength(100) type?: string;`
  - Sugestão: adicionar `nullable: true` ao `@ApiPropertyOptional` do campo `type`
    (e ajustar o tipo TS para `string | null`) para documentar corretamente que
    enviar `type: null` é uma forma válida e intencional de limpar o campo. Ficou
    fora do escopo declarado da etapa `api-dev-doc`, mas é relevante para a
    precisão do Swagger frente ao comportamento real do endpoint `PUT /tags/:id`.

Pontos verificados e aprovados, sem problemas encontrados:
- `findByNameAndType` usa `IsNull()` corretamente para o caso `type = null`
  (`tags.service.ts:40-45`), em vez do `findOneBy({ type: null })` que não filtra
  por `NULL` no TypeORM.
- `update()` cobre corretamente os três casos (alterar só `name`, só `type`, ou
  ambos) via `finalName`/`finalType` e sempre exclui o próprio registro da busca
  de conflito (`findByNameAndType(finalName, finalType, id)`,
  `tags.service.ts:95-103`).
- A migration `1784306410000-ChangeTagsUniqueIndexToNameAndType.ts` reflete
  exatamente o índice de expressão `(name, COALESCE(type, ''))` pedido, com
  timestamp maior que as migrations de tags existentes, nome de classe/arquivo
  consistentes, e `down()` restaura fielmente o índice único antigo por `name`
  (mesmo formato de `CreateTagsTable`).
- A entidade `tag.entity.ts` não declara via `@Index` o índice de expressão (não
  representável pelo TypeORM) e traz o comentário explicativo pedido, referenciando
  a migration correta.
- Mensagens de erro (`'Já existe uma tag com este nome e tipo.'`) estão em pt-BR e
  consistentes entre `tags.service.ts` (`create`/`update`) e os
  `@ApiConflictResponse` de `POST /tags`/`PUT /tags/:id` em `tags.controller.ts`.
  A descrição do campo `name` em `create-tag.dto.ts` também foi atualizada
  corretamente.
- Acesso Google (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` a nível de classe) permanece correto e inalterado,
  como esperado — não há necessidade de mudança nesta demanda.

### Correções pós-revisão

Status: concluído

- **`app-api/src/modules/tags/tags.service.ts`**: adicionado método privado
  `normalizeType(type?: string | null): string | null`
  (`type?.trim() ? type.trim() : null`), que trata string vazia/só espaços como
  equivalente a `null`, espelhando `COALESCE("type", '')` do índice único. Aplicado
  de forma consistente em `create()` (substitui `dto.type ?? null`), no cálculo de
  `finalType` em `update()` (substitui `dto.type !== undefined ? dto.type : tag.type`)
  e dentro de `findByNameAndType()` (normaliza o parâmetro `type` recebido antes de
  decidir entre `IsNull()` e o valor literal), fechando o caminho que antes permitia
  `type: ''` colidir com `type: null` no banco (erro `23505` não tratado) sem ser
  barrado pela validação de aplicação.
- **`app-api/src/modules/tags/dto/create-tag.dto.ts`**: campo `type` alterado de
  `type?: string` para `type?: string | null`, e `nullable: true` adicionado ao
  `@ApiPropertyOptional`, documentando que enviar `type: null` é uma forma válida e
  intencional de limpar o campo (herdado por `UpdateTagDto` via `PartialType`).

Migration e entidade não foram alteradas — o índice `COALESCE(type, '')` da migration
permanece a referência correta.