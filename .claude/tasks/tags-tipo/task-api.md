# Task API: Adição da propriedade "tipo" em Tags

## Contexto
Ver .claude/tasks/tags-tipo/spec.md

Esta demanda é uma **ALTERAÇÃO de entidade já existente e com dados em produção**
(`Tag`), não a criação de um módulo novo. Todos os arquivos abaixo já existem em
`app-api/src/modules/tags/` e devem ser ajustados; a migration deve apenas
adicionar uma coluna nullable, sem qualquer backfill de dados.

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/tags/entities/tag.entity.ts
Migration: app-api/src/database/migrations/1784305700000-AddTypeToTagsTable.ts
Rotas: POST /tags, GET /tags, GET /tags/:id, PUT /tags/:id (nenhuma rota nova, apenas ajuste de payload/filtro/resposta)
Arquivos: app-api/src/modules/tags/dto/create-tag.dto.ts, app-api/src/modules/tags/dto/tag-response.dto.ts, app-api/src/modules/tags/dto/find-tags-query.dto.ts, app-api/src/modules/tags/tags.service.ts (update-tag.dto.ts e paginated-tags-response.dto.ts não precisaram de alteração, conforme previsto na task)

#### Entidade
- Entidade: `Tag` (`app-api/src/modules/tags/entities/tag.entity.ts`) — alteração,
  não criação.
- Campo novo: `type` (`string`, opcional/nullable).
  - `@ApiProperty({ required: false, nullable: true })`
  - `@Column({ type: 'varchar', length: 100, nullable: true })`
  - Sem `@Index` (não há requisito de unicidade ou busca indexada além do ILIKE
    já usado para `name`, que também não é indexado por padrão em `find`, apenas
    o `name` tem `@Index({ unique: true })` — esse índice de `name` não é afetado
    e deve ser mantido como está).
- Relacionamentos: nenhum (campo é texto livre, sem enum nem FK), conforme
  confirmado no spec ("Definição de uma lista fixa/enum de tipos possíveis" está
  fora de escopo).

#### Migration
- Necessária: sim.
- Nome sugerido (seguindo o padrão cronológico de `src/database/migrations/`):
  `AddTypeToTagsTable` com timestamp maior que o último existente
  (`1784305690000-AddPrivateInformationToContentTables.ts`), ex.:
  `1784305700000-AddTypeToTagsTable.ts`.
- `up`: `ALTER TABLE "tags" ADD "type" character varying(100)` (coluna nullable,
  sem `DEFAULT`, sem backfill — todas as tags existentes ficam com `type = NULL`).
- `down`: `ALTER TABLE "tags" DROP COLUMN "type"`.
- Gerar via `npm run migration:generate` (dentro de `app-api`) ou escrever a mão
  seguindo o padrão de outras migrations `Add*To*Table` do projeto (ver
  `1784305560000-AddDivinePropertiesToDivinitiesTable.ts` como referência de estilo).

#### Controller
- Endpoints afetados (nenhum endpoint novo, apenas ajuste de payload/filtro dos
  já existentes em `app-api/src/modules/tags/tags.controller.ts`):
  - `POST /tags` — passa a aceitar `type` opcional no corpo.
  - `GET /tags` — passa a aceitar `type` como novo parâmetro de filtro opcional
    (query), combinável com o filtro existente por `name`.
  - `GET /tags/:id` — resposta passa a incluir `type`.
  - `PUT /tags/:id` — passa a aceitar `type` opcional no corpo para atualização.
  - `DELETE /tags/:id` — sem alteração.
- DTOs a ajustar:
  - `CreateTagDto` (`dto/create-tag.dto.ts`): adicionar `type?: string` com
    `@IsOptional()`, `@IsString()`, `@MaxLength(100)` e `@ApiPropertyOptional`
    (exemplo de valor livre, ex.: `'Monstro'` ou similar condizente com o domínio
    de tags).
  - `UpdateTagDto` (`dto/update-tag.dto.ts`): não precisa de alteração direta —
    continua `PartialType(CreateTagDto)`, então `type` já fica opcional
    automaticamente ao adicionar o campo no `CreateTagDto`.
  - `TagResponseDto` (`dto/tag-response.dto.ts`): adicionar propriedade
    `type: string | null` com `@ApiProperty({ nullable: true })` e incluir o
    campo no `fromEntity` (`dto.type = tag.type ?? null`).
  - `FindTagsQueryDto` (`dto/find-tags-query.dto.ts`): adicionar `type?: string`
    opcional (`@IsOptional()`, `@IsString()`), seguindo exatamente o mesmo padrão
    já usado para `name` (mesmo tipo de decorators, mesma descrição de "busca
    parcial").
  - `PaginatedTagsResponseDto`: sem alteração (já reaproveita `TagResponseDto`).
- Ajustes de `TagsService` (`tags.service.ts`) necessários para suportar o novo
  campo (mesmo não sendo um DTO, deve ser coberto pela mesma etapa de
  implementação):
  - `create`: incluir `type: dto.type` ao montar a entidade em
    `tagsRepository.create(...)`.
  - `update`: aplicar `tag.type = dto.type` quando `dto.type` foi enviado (usar a
    mesma lógica condicional já usada para `color`, atentando que `type` opcional
    deve poder ser explicitamente limpo/alterado conforme o valor enviado — não
    há regra adicional de unicidade a validar aqui, ao contrário de `name`).
  - `findAllPaginated`: adicionar `if (query.type) { queryBuilder.andWhere('tag.type ILIKE :type', { type: \`%${query.type}%\` }); }`,
    espelhando exatamente o bloco já existente para `query.name`, e combinável
    com ele (ambos usam `andWhere`, então funcionam em conjunto).
- Acesso Google: `read-only` (mantém o nível já configurado no controller via
  `@GoogleAccess('read-only')`; a demanda não pede mudança de nível de acesso).

### 2. api-dev-doc
Status: concluído
Arquivos alterados:
- app-api/src/modules/tags/dto/create-tag.dto.ts (adicionada descrição e exemplo ao campo `type`)
- app-api/src/modules/tags/dto/tag-response.dto.ts (adicionada descrição ao campo `type`)
- app-api/src/modules/tags/dto/find-tags-query.dto.ts (adicionada descrição e exemplo ao campo `type`)
- app-api/src/modules/tags/tags.controller.ts (atualizado summary do `GET /tags` para mencionar filtro por tipo)

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima: alteração da entidade `Tag`, migration de adição de coluna
  (sem backfill, com `down` revertendo corretamente), DTOs (`CreateTagDto`,
  `TagResponseDto`, `FindTagsQueryDto`), `TagsService` (create/update/findAllPaginated)
  e documentação Swagger, confirmando aderência ao spec confirmado em
  `.claude/tasks/tags-tipo/spec.md` (campo opcional, varchar(100), filtro ILIKE
  parcial case-insensitive idêntico ao de `name`, sem unicidade/validação extra).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-api/src/modules/tags/entities/tag.entity.ts
- app-api/src/database/migrations/1784305700000-AddTypeToTagsTable.ts
- app-api/src/modules/tags/dto/create-tag.dto.ts
- app-api/src/modules/tags/dto/update-tag.dto.ts
- app-api/src/modules/tags/dto/tag-response.dto.ts
- app-api/src/modules/tags/dto/find-tags-query.dto.ts
- app-api/src/modules/tags/dto/paginated-tags-response.dto.ts
- app-api/src/modules/tags/tags.service.ts
- app-api/src/modules/tags/tags.controller.ts

Pontos verificados e conformes:
- **Migration ↔ entidade**: a coluna `type` na migration
  (`ALTER TABLE "tags" ADD "type" character varying(100)`, nullable, sem `DEFAULT`)
  corresponde exatamente ao `@Column({ type: 'varchar', length: 100, nullable: true })`
  da entidade `Tag`. O `down` (`DROP COLUMN "type"`) reverte corretamente o `up`, sem
  deixar índices ou constraints órfãos. Nenhum `@Index` foi adicionado ao campo,
  conforme especificado, e o índice único de `name` permanece intocado.
- **Timestamp da migration**: `1784305700000-AddTypeToTagsTable.ts` é maior que o
  último arquivo existente (`1784305690000-AddPrivateInformationToContentTables.ts`)
  e não colide com nenhum outro timestamp em `src/database/migrations/`.
- **`@MaxLength(100)`**: presente em `CreateTagDto.type`, alinhado ao `varchar(100)`
  da coluna e herdado por `UpdateTagDto` via `PartialType`.
- **Lógica de `update` no service**: `if (dto.type !== undefined) { tag.type = dto.type; }`
  permite limpar o campo enviando `null` (passa por `@IsOptional()`, que trata
  `null`/`undefined` como "ausente" e ignora as demais validações) ou `''` (string
  válida, passa em `@IsString()`/`@MaxLength(100)`), sem efeito colateral sobre
  `name`/`color`, que continuam com suas próprias condições independentes. O padrão
  é idêntico ao já usado em outros módulos do projeto (ex.:
  `locations.service.ts`, `creatures.service.ts`) para campos opcionais que aceitam
  limpeza explícita.
- **Filtro em `findAllPaginated`**: o bloco `if (query.type) { queryBuilder.andWhere('tag.type ILIKE :type', { type: \`%${query.type}%\` }); }`
  espelha exatamente o bloco já existente para `query.name`, usa parâmetro nomeado
  (`:type`) sem concatenação direta de input do usuário na string SQL (sem risco de
  SQL injection), e é combinável com o filtro de `name` via `andWhere` (ambos
  aplicados independentemente, com efeito de "E" lógico).
- **`TagResponseDto.fromEntity`**: expõe `type` corretamente (`tag.type ?? null`),
  sem vazar nenhum campo interno ou de outra entidade; `Tag` não possui campos
  sensíveis (`password` ou `select: false`) que pudessem ser expostos.
- **Documentação Swagger**: `@ApiPropertyOptional`/`@ApiProperty` do campo `type`
  presentes e coerentes em `CreateTagDto`, `TagResponseDto` e `FindTagsQueryDto`; o
  `summary` do `GET /tags` foi atualizado para mencionar o filtro por tipo,
  refletindo o comportamento real do endpoint.
- **Google Access**: `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('read-only')` mantidos sem alteração no controller, conforme
  indicado explicitamente na task (nenhuma mudança de nível de acesso solicitada).
