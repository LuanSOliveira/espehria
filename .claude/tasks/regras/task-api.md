# Task API: Regras (Rule)

## Contexto
Não existe `.claude/tasks/regras/spec.md` para esta demanda — o pedido foi informado
diretamente pelo solicitante (reproduzido integralmente na mensagem que originou este
plano) e já está completo/esclarecido quanto aos campos e regras de negócio do backend.

Investigação de referência (fonte da verdade estrutural deste plano):
- `app-api/src/modules/locations/entities/location.entity.ts` — campo `description`
  (rich text/HTML) a replicar tal e qual: `@Column({ type: 'text', nullable: true })`,
  propriedade `description!: string | null`, sem `name` explícito de coluna (uma só
  palavra).
- `app-api/src/modules/locations/entities/location-section.entity.ts` — template exato
  para a entidade de seção dinâmica ("Adicionar Seção"): `label` (varchar, obrigatório),
  `description` (text, nullable, rich text), `order` (int, obrigatório, preserva a ordem
  de adição), `ManyToOne` para a entidade pai com `onDelete: 'CASCADE'` e `@JoinColumn`.
- `app-api/src/modules/locations/dto/location-section-input.dto.ts` e
  `dto/location-section-response.dto.ts` — DTOs de entrada/saída da seção a replicar
  (apenas trocando `location` por `rule` no nome das classes e nos comentários).
- `app-api/src/modules/locations/locations.service.ts` — método privado `buildSections`
  (cria as seções na ordem do array recebido, `order` = índice), e o tratamento de
  `update` quando `dto.sections !== undefined`: as seções antigas são removidas
  explicitamente via `locationSectionsRepository.remove(...)` **antes** de atribuir o
  novo array a `location.sections`, porque reatribuir a relação `OneToMany` direto com
  `orphanedRowAction: 'delete'` quebra em violação de not-null (o TypeORM tenta um
  `UPDATE ... SET location_id = NULL` nas linhas órfãs antes de excluí-las). O mesmo
  padrão/comentário deve ser replicado em `RulesService.update` para `rule.sections`.
- `app-api/src/modules/locations/locations.controller.ts` — padrão de rotas CRUD,
  guards (`JwtAuthGuard` + `GoogleAccessGuard` + `@GoogleAccess('read-only')`) e
  documentação Swagger a replicar.
- `app-api/src/database/migrations/1784305400000-CreateLocationsTable.ts` e
  `1784305530000-CreateLocationSectionsTable.ts` — template exato de migration (tabela
  principal com índice único de `name`; tabela de seções com FK `ON DELETE CASCADE`).
- `app-api/src/modules/search/` (`search.service.ts`, `search.controller.ts`,
  `search.module.ts`, `enums/linkable-entity-type.enum.ts`,
  `dto/search-result-item-response.dto.ts`) — padrão de registro de uma entidade no
  mecanismo de busca global (`@mention`), a replicar para `Rule`.

Diferença deliberada em relação ao template `Location`: `Rule` **não** tem `type`,
`referenceImageUrl`, `privateInformation`, `tags` nem `pointsOfInterest` — o pedido lista
explicitamente apenas três blocos de campos (`name`, `description`, seções dinâmicas), e
nenhum desses outros campos/relacionamentos de `Location` foi solicitado. Este plano não
os replica.

**Ponto de atenção sinalizado (não decidido por conta própria):** o pedido não menciona
explicitamente se `name` deve ser único. Todas as entidades de conteúdo equivalentes já
existentes no projeto (`Location.name`, `Race.name`, `Era.name`, `Organization.name`,
`Tag.name`, etc.) usam `@Index({ unique: true })` em `name` com validação de conflito
(409, "Já existe um/uma ... com este nome.") tanto na criação quanto na atualização. Por
consistência estrutural com o restante do domínio, este plano assume a mesma convenção
para `Rule.name` (único). Se o solicitante quiser nomes de regra duplicados permitidos,
avisar antes da implementação.

## Etapas

### 1. api-dev
Status: concluído
Entidade: app-api/src/modules/rules/entities/rule.entity.ts (e app-api/src/modules/rules/entities/rule-section.entity.ts)
Migration: app-api/src/database/migrations/1784305790000-CreateRulesTable.ts e app-api/src/database/migrations/1784305800000-CreateRuleSectionsTable.ts (não executadas — pendente confirmação do usuário para rodar `npm run migration:run`)
Rotas: POST /rules, GET /rules, GET /rules/:id, PUT /rules/:id, DELETE /rules/:id
Arquivos: app-api/src/modules/rules/dto/create-rule.dto.ts, app-api/src/modules/rules/dto/update-rule.dto.ts, app-api/src/modules/rules/dto/find-rules-query.dto.ts, app-api/src/modules/rules/dto/rule-section-input.dto.ts, app-api/src/modules/rules/dto/rule-section-response.dto.ts, app-api/src/modules/rules/dto/rule-response.dto.ts, app-api/src/modules/rules/dto/rule-list-item-response.dto.ts, app-api/src/modules/rules/dto/paginated-rules-response.dto.ts, app-api/src/modules/rules/rules.service.ts, app-api/src/modules/rules/rules.controller.ts, app-api/src/modules/rules/rules.module.ts, app-api/src/app.module.ts (registro de RulesModule), app-api/src/modules/search/enums/linkable-entity-type.enum.ts, app-api/src/modules/search/search.module.ts, app-api/src/modules/search/search.service.ts, app-api/src/modules/search/search.controller.ts, app-api/src/modules/search/dto/search-result-item-response.dto.ts

#### Entidade

**`Rule`** — `app-api/src/modules/rules/entities/rule.entity.ts`, tabela `rules`,
estende `BaseEntity` (herda `id` uuid, `createdAt`, `updatedAt`):
- `name` (varchar, `@Column()`) — obrigatório, texto simples, único
  (`@Index({ unique: true })`, mesmo padrão de `Location.name`). Ver nota de atenção na
  seção "Contexto" sobre esta decisão de unicidade.
- `description` (`@Column({ type: 'text', nullable: true })`, propriedade
  `description!: string | null`) — opcional, texto rico (HTML), mesmo padrão exato de
  `Location.description`.
- `sections` (`OneToMany` para `RuleSection`, `cascade: true`,
  `orphanedRowAction: 'delete'`) — seções dinâmicas ("Adicionar Seção"), mesmo padrão
  exato de `Location.sections`.

**`RuleSection`** — `app-api/src/modules/rules/entities/rule-section.entity.ts`, tabela
`rule_sections`, estende `BaseEntity`, template exato de `LocationSection`:
- `label` (varchar, `@Column()`) — obrigatório, texto simples (título da seção).
- `description` (`@Column({ type: 'text', nullable: true })`) — opcional, texto rico
  (HTML), pode ficar vazia/não informada.
- `order` (`@Column({ type: 'int' })`) — obrigatório, posição da seção na sequência de
  adição (índice do array recebido na criação/atualização). Sem reordenação — o valor só
  é definido na criação das seções, nunca alterado depois via endpoint dedicado.
- `rule` (`ManyToOne(() => Rule, (rule) => rule.sections, { onDelete: 'CASCADE' })` +
  `@JoinColumn({ name: 'rule_id' })`) — FK para a regra pai.

Sem limite mínimo/máximo de seções (array pode ser vazio ou ter qualquer quantidade),
mesmo comportamento de `Location.sections`. `Rule` não possui nenhum outro campo ou
relacionamento (sem `tags`, sem `type`, sem `referenceImageUrl`/`referenceImage`, sem
`privateInformation`, sem relação para outras `Rule`).

#### Migration

- Necessária: **sim** (`synchronize: false`; toda alteração de schema requer migration
  em `src/database/migrations/`).
- Duas migrations, seguindo exatamente o padrão de
  `1784305400000-CreateLocationsTable.ts` +
  `1784305530000-CreateLocationSectionsTable.ts`. Última migration existente no projeto:
  `1784305780000-CreateAmmunitionTagsTable.ts` — usar timestamps posteriores:
  1. `1784305790000-CreateRulesTable.ts` — cria a tabela `rules` com `id` uuid PK
     (`gen_random_uuid()`), `created_at`, `updated_at` (padrão `BaseEntity`), `name`
     varchar not null + índice único (`IDX_rules_name`), `description` text nullable.
  2. `1784305800000-CreateRuleSectionsTable.ts` — cria a tabela `rule_sections` com `id`
     uuid PK, `created_at`, `updated_at`, `label` varchar not null, `description` text
     nullable, `order` integer not null, `rule_id` uuid not null, índice
     `IDX_rule_sections_rule_id` em `rule_id`, FK `FK_rule_sections_rule_id` →
     `rules(id)` `ON DELETE CASCADE ON UPDATE NO ACTION` (equivalente exato de
     `FK_location_sections_location_id`).
- Gerar via `npm run migration:generate` a partir das entidades já criadas e revisar o
  SQL resultante campo a campo contra a entidade (checklist da skill `api-migration`).
  **Nunca rodar `npm run migration:run` automaticamente** — perguntar ao usuário antes.

#### Controller

CRUD completo em `app-api/src/modules/rules/rules.controller.ts`, rota `/rules`, mesmo
padrão de `LocationsController`/`RacesController`:
- `POST /rules` — cria a regra. Valida `name` único (409 pt-BR, "Já existe uma regra com
  este nome."). Aceita `sections` opcional (array, criado na ordem enviada). Retorna
  `RuleResponseDto`.
- `GET /rules` — lista paginada com filtro por nome (`name`, opcional, `ILIKE` parcial
  case-insensitive) + `page`/`perPage` (defaults de `common/variables/pagination.ts`).
  Ordenação padrão por `name` ASC. Como `Rule` não tem nenhuma relação `ManyToMany` (ao
  contrário de `Location`, que precisa do padrão de duas consultas por causa de `tags`),
  a listagem pode usar uma única `createQueryBuilder` com `skip`/`take` +
  `getManyAndCount`, sem carregar `sections` (mesmo padrão simples de
  `TagsService.findAllPaginated`, adaptado para ordenar por `name` ASC ao invés de
  `createdAt`, mantendo consistência com o restante das entidades de conteúdo). Retorna
  `PaginatedRulesResponseDto` composto por `RuleListItemResponseDto`.
- `GET /rules/:id` — busca por id (`ParseUUIDPipe`), 404 pt-BR ("Regra não encontrada.")
  se não encontrado. Carrega `relations: { sections: true }`. Retorna `RuleResponseDto`
  completo (`name`, `description`, `sections` ordenadas por `order` ASC).
- `PUT /rules/:id` — atualiza (mesma validação de nome único ao trocar o nome; demais
  campos seguem o padrão `!== undefined` do service). Ao reenviar `sections`, substitui
  o array inteiro (remoção explícita das seções antigas antes de atribuir as novas — ver
  nota na seção "Contexto" sobre o bug de not-null com `orphanedRowAction`). Retorna
  `RuleResponseDto`.
- `DELETE /rules/:id` — remove, `204 No Content`, 404 pt-BR se não encontrado. Remoção
  das seções é resolvida por `ON DELETE CASCADE` do schema, sem lógica adicional no
  service.

DTOs (`app-api/src/modules/rules/dto/`):
- `CreateRuleDto` — `name` (`@IsString`, `@IsNotEmpty`, obrigatório); `description`
  (`@IsOptional`, `@IsString` — suporta HTML); `sections` (`@IsOptional`, `@IsArray`,
  `@ValidateNested({ each: true })`, `@Type(() => RuleSectionInputDto)`).
- `UpdateRuleDto` — `PartialType(CreateRuleDto)`.
- `RuleSectionInputDto` — `label` (`@IsString`, `@IsNotEmpty`, obrigatório); `description`
  (`@IsOptional`, `@IsString` — suporta HTML, pode ficar vazia/ausente). Template exato
  de `LocationSectionInputDto`.
- `FindRulesQueryDto` — `name?` (`@IsOptional @IsString`, filtro parcial), `page?`,
  `perPage?` (mesmo padrão de `FindLocationsQueryDto`/`FindRacesQueryDto`, sem filtros
  adicionais).
- `RuleResponseDto` — `id`, `name`, `description`, `sections`
  (`RuleSectionResponseDto[]`, ordenadas por `order` ASC antes de mapear, mesmo padrão
  de `LocationResponseDto.fromEntity`), `createdAt`, `updatedAt`; com
  `static fromEntity(entity): RuleResponseDto`.
- `RuleSectionResponseDto` — `id`, `label`, `description`, `order`, `createdAt`,
  `updatedAt`; com `static fromEntity(entity)`. Template exato de
  `LocationSectionResponseDto`.
- `RuleListItemResponseDto` — enxuto: `id`, `name` (sem `description`/`sections` na
  listagem, mesmo princípio de enxugamento usado em `LocationListItemResponseDto`/
  `RaceListItemResponseDto`, adaptado porque `Rule` não tem `referenceImageUrl`/`tags`);
  com `static fromEntity(entity)`.
- `PaginatedRulesResponseDto` — `data: RuleListItemResponseDto[]`, `total`, `page`,
  `perPage`, `totalPages`.

Service `RulesService` (`app-api/src/modules/rules/rules.service.ts`), injeta apenas
`Repository<Rule>` e `Repository<RuleSection>` (sem `Repository<Tag>`, diferente de
`LocationsService`, já que não há `tagIds` nem pontos de interesse):
- `findByName(name)`, `findById(id)` (com `relations: { sections: true }`);
- `buildSections(sections)` privado, idêntico a `LocationsService.buildSections`
  (mapeia o array recebido para `RuleSection[]`, `order` = índice);
- `create`: valida nome único (409), monta `sections` via `buildSections` quando
  informado (array vazio quando ausente), persiste;
- `findAllPaginated`: filtra por `name` (`ILIKE` parcial), ordena por `rule.name` ASC,
  pagina com `skip`/`take` + `getManyAndCount` diretamente (sem relação a carregar);
- `update`: valida nome único ao trocar, demais campos (`description`) seguem o padrão
  `if (dto.campo !== undefined) { rule.campo = dto.campo; }`, e ao receber
  `dto.sections !== undefined` remove explicitamente as seções antigas via
  `ruleSectionsRepository.remove(...)` antes de atribuir as novas (mesmo comentário/
  motivo documentado em `LocationsService.update`, ver nota na seção "Contexto");
- `remove`: `delete({ id })`, 404 pt-BR ("Regra não encontrada.") se `affected === 0`.

Módulo `RulesModule` (`app-api/src/modules/rules/rules.module.ts`):
`TypeOrmModule.forFeature([Rule, RuleSection])`, `controllers: [RulesController]`,
`providers: [RulesService]`, `exports: [RulesService]`. Registrar o import em
`app-api/src/app.module.ts` (a entidade é auto-registrada via `autoLoadEntities: true`,
não precisa de registro manual adicional).

Acesso Google: **`read-only` (padrão)** — CRUD completo de conteúdo, sem indicação no
pedido de um nível diferente; aplicar a skill `api-permissao-google-readonly`, exatamente
como em `LocationsController`/`RacesController`:
```ts
@ApiTags('rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GoogleAccessGuard)
@GoogleAccess('read-only')
@Controller('rules')
```

Observação: o controller deve incluir também as anotações finas de Swagger
(`@ApiOperation`/`@ApiCreatedResponse`/`@ApiConflictResponse`/`@ApiNotFoundResponse`/
`@ApiBadRequestResponse`/`@ApiOkResponse`/`@ApiNoContentResponse`) já na primeira
implementação, seguindo o padrão de `LocationsController`; a etapa `api-dev-doc` revisa e
complementa essa documentação.

**Search (mecanismo de `@mention`)** — fora das três subseções padrão, mas parte
obrigatória desta etapa: incluir `Rule` no módulo `app-api/src/modules/search/`, seguindo
exatamente o padrão existente:
- `enums/linkable-entity-type.enum.ts`: adicionar `RULE = 'rule'` ao final do enum
  `LinkableEntityType`.
- `search.module.ts`: importar `Rule`
  (`app-api/src/modules/rules/entities/rule.entity.ts`) e adicioná-la ao array de
  `TypeOrmModule.forFeature([...])`, junto das demais entidades.
- `search.service.ts`: injetar `@InjectRepository(Rule) private readonly rulesRepository:
  Repository<Rule>` no construtor, e adicionar `{ entityType: LinkableEntityType.RULE,
  repository: this.rulesRepository }` ao array `linkableEntities` dentro de
  `search(...)` — a lógica de busca (`ILIKE` por nome, `MAX_RESULTS`,
  `orderBy('entity.name', 'ASC')`) já é genérica e não precisa de alteração além de
  estender o array.
- `search.controller.ts`: atualizar o `summary` do `@ApiOperation` do `GET /search` para
  incluir "regras" na lista em pt-BR de entidades buscáveis.
- `dto/search-result-item-response.dto.ts`: atualizar a descrição do `@ApiProperty` de
  `entityType` para incluir "regra" na lista de tipos suportados.

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1 (api-dev).
- Revisar/complementar a documentação Swagger de `RulesController`: `@ApiTags('rules')`,
  `@ApiOperation({ summary })` em pt-BR para cada rota (criar, listar, buscar por id,
  atualizar, remover).
- Garantir respostas documentadas: `@ApiCreatedResponse` (POST), `@ApiOkResponse`
  (GET/PUT), `@ApiNoContentResponse` (DELETE), `@ApiConflictResponse` (409, nome
  duplicado), `@ApiNotFoundResponse` (404 — regra não encontrada, cobrindo `update`,
  `findOne` e `remove`), `@ApiBadRequestResponse` (dados obrigatórios ausentes, `id` em
  formato inválido).
- Conferir que todos os campos de `CreateRuleDto`/`UpdateRuleDto`/`RuleSectionInputDto`/
  `RuleResponseDto`/`RuleSectionResponseDto`/`RuleListItemResponseDto` possuem
  `@ApiProperty`/`@ApiPropertyOptional` com exemplos coerentes (ex.: nome de exemplo
  "Regras de Combate" para `Rule`, título de seção de exemplo "Iniciativa" para
  `RuleSection`, incluindo um exemplo em HTML para `description`), documentando
  claramente que apenas `name` é obrigatório na regra e apenas `label` é obrigatório em
  cada seção.
- Atualizar o `@ApiOperation summary` de `GET /search` (`search.controller.ts`) e a
  descrição do `@ApiProperty` de `entityType` em `SearchResultItemResponseDto` para
  incluir "regras"/"regra".
- Validar no `/docs` que o novo grupo de rotas `rules` aparece corretamente documentado e
  que `GET /search` reflete o novo `LinkableEntityType.RULE`.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima.
- Revisar as entidades `Rule`/`RuleSection`: tipos, nullability (`description` nullable
  em ambas; `name`/`label` not null; `order` not null), `name` com
  `@Index({ unique: true })`, a relação `OneToMany`/`ManyToOne` com `cascade: true` +
  `orphanedRowAction: 'delete'` em `Rule.sections` e `onDelete: 'CASCADE'` em
  `RuleSection.rule`, e confirmar que `Rule` não ganhou nenhum campo/relacionamento fora
  do pedido (sem `tags`, `type`, `referenceImageUrl`/`referenceImage`,
  `privateInformation`, pontos de interesse).
- Revisar as duas migrations: ordem de execução (`CreateRulesTable` antes de
  `CreateRuleSectionsTable`, ambas posteriores a
  `1784305780000-CreateAmmunitionTagsTable.ts`), colunas e nullability idênticas às
  entidades, índice único em `rules.name`, índice em `rule_sections.rule_id`, FK
  `ON DELETE CASCADE ON UPDATE NO ACTION` de `rule_sections.rule_id` →
  `rules(id)`, `down()` revertendo tudo (constraints, índices, tabelas) na ordem inversa
  do `up()` em ambas.
- Revisar DTOs e validações: unicidade de nome (409 pt-BR) em `create`/`update`,
  `description` opcional e sem `@IsNotEmpty` em `Rule` e em `RuleSection`, `label`
  obrigatório (`@IsString`, `@IsNotEmpty`) em `RuleSectionInputDto`, `sections` validado
  com `@ValidateNested({ each: true })` + `@Type(() => RuleSectionInputDto)`,
  `PartialType` correto em `UpdateRuleDto`.
- Revisar `RulesService`: que `update` remove explicitamente as seções antigas via
  `ruleSectionsRepository.remove(...)` antes de reatribuir `rule.sections` quando
  `dto.sections !== undefined` (evitando o bug de violação de not-null do
  `orphanedRowAction`, documentado em `LocationsService.update`), que `findById` carrega
  `relations: { sections: true }`, e que `findAllPaginated` ordena por `name` ASC sem
  carregar `sections` desnecessariamente na listagem.
- Revisar `RulesController`: guards (`JwtAuthGuard` + `GoogleAccessGuard` +
  `@GoogleAccess('read-only')`), filtro `name` via `ILIKE` parcial, paginação
  `{ data, total, page, perPage }` + `totalPages` calculado no controller, uso de
  `fromEntity` em todos os DTOs de resposta, `sections` ordenadas por `order` ASC em
  `RuleResponseDto.fromEntity`.
- Revisar as alterações no módulo `search`: enum `LinkableEntityType` com `RULE = 'rule'`,
  `search.module.ts` com `Rule` registrada em `TypeOrmModule.forFeature`,
  `search.service.ts` com o novo repositório injetado e adicionado ao array
  `linkableEntities` sem alterar a lógica de busca genérica existente, `summary` do
  `@ApiOperation` de `GET /search` e descrição de `entityType` em
  `SearchResultItemResponseDto` atualizados.
- Confirmar que `RulesModule` está registrado em `app-api/src/app.module.ts`.
- Confirmar mensagens de erro/validação em pt-BR em todos os pontos (nome duplicado,
  regra não encontrada), enquanto nomes de entidade/colunas/DTOs/JSON permanecem em
  inglês (`Rule`, `RuleSection`, `name`, `description`, `label`, `order`, `sections`).
- Confirmar aderência às convenções do `CLAUDE.md` (`BaseEntity`, `autoLoadEntities`,
  convenção `fromEntity`, paginação padrão `{ data, total, page, perPage }` +
  `totalPages`, Swagger completo, `synchronize: false` com toda alteração de schema via
  migration, skill `api-permissao-google-readonly` aplicada no controller).

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" confirmadas como "Status: concluído" antes desta
revisão — não há bloqueio por trabalho incompleto.

Arquivos lidos e comparados linha a linha com os templates de referência
(`app-api/src/modules/locations/**`, `1784305400000-CreateLocationsTable.ts`,
`1784305530000-CreateLocationSectionsTable.ts`) e com o `CLAUDE.md` da raiz:
- `app-api/src/modules/rules/entities/rule.entity.ts`
- `app-api/src/modules/rules/entities/rule-section.entity.ts`
- `app-api/src/database/migrations/1784305790000-CreateRulesTable.ts`
- `app-api/src/database/migrations/1784305800000-CreateRuleSectionsTable.ts`
- `app-api/src/modules/rules/dto/create-rule.dto.ts`
- `app-api/src/modules/rules/dto/update-rule.dto.ts`
- `app-api/src/modules/rules/dto/find-rules-query.dto.ts`
- `app-api/src/modules/rules/dto/rule-section-input.dto.ts`
- `app-api/src/modules/rules/dto/rule-section-response.dto.ts`
- `app-api/src/modules/rules/dto/rule-response.dto.ts`
- `app-api/src/modules/rules/dto/rule-list-item-response.dto.ts`
- `app-api/src/modules/rules/dto/paginated-rules-response.dto.ts`
- `app-api/src/modules/rules/rules.service.ts`
- `app-api/src/modules/rules/rules.controller.ts`
- `app-api/src/modules/rules/rules.module.ts`
- `app-api/src/app.module.ts` (registro de `RulesModule`)
- `app-api/src/modules/search/enums/linkable-entity-type.enum.ts`
- `app-api/src/modules/search/search.module.ts`
- `app-api/src/modules/search/search.service.ts`
- `app-api/src/modules/search/search.controller.ts`
- `app-api/src/modules/search/dto/search-result-item-response.dto.ts`

Pontos verificados e conformes:
- **Entidades**: `Rule` (`name` varchar not null com `@Index({ unique: true })`,
  `description` text nullable, `sections` `OneToMany` com `cascade: true` +
  `orphanedRowAction: 'delete'`) e `RuleSection` (`label` varchar not null,
  `description` text nullable, `order` int not null, `ManyToOne` para `Rule` com
  `onDelete: 'CASCADE'` + `@JoinColumn({ name: 'rule_id' })`) replicam exatamente o
  template de `Location`/`LocationSection`. `Rule` não possui `type`,
  `referenceImageUrl`, `privateInformation`, `tags` nem `pointsOfInterest`, conforme o
  escopo definido no plano.
- **Migrations**: `1784305790000-CreateRulesTable.ts` e
  `1784305800000-CreateRuleSectionsTable.ts` são posteriores a
  `1784305780000-CreateAmmunitionTagsTable.ts` e executam na ordem correta (`rules`
  antes de `rule_sections`). Colunas, tipos e nullability batem exatamente com as
  entidades; índice único `IDX_rules_name` em `rules.name`; índice
  `IDX_rule_sections_rule_id` em `rule_sections.rule_id`; FK
  `FK_rule_sections_rule_id` com `ON DELETE CASCADE ON UPDATE NO ACTION`; `down()` de
  ambas reverte constraints/índices/tabelas na ordem inversa do `up()`.
- **`RulesService.update`**: remove explicitamente as seções antigas via
  `ruleSectionsRepository.remove(rule.sections)` antes de reatribuir `rule.sections`
  quando `dto.sections !== undefined`, com o mesmo comentário explicativo do bug de
  not-null com `orphanedRowAction` documentado em `LocationsService.update` — padrão
  replicado corretamente. `findById` carrega `relations: { sections: true }`;
  `findAllPaginated` ordena por `rule.name` ASC via `createQueryBuilder` com
  `skip`/`take` + `getManyAndCount`, sem carregar `sections`.
- **`RulesController`**: guards `JwtAuthGuard` + `GoogleAccessGuard` +
  `@GoogleAccess('read-only')` aplicados no nível do controller (cobrindo todas as
  rotas, inclusive as de escrita); filtro `name` via `ILIKE` parcial; paginação
  retorna `{ data, total, page, perPage }` com `totalPages = Math.ceil(total / perPage)`
  calculado no controller; todos os DTOs de resposta usam `fromEntity`;
  `RuleResponseDto.fromEntity` ordena `sections` por `order` ASC antes de mapear.
- **DTOs/validação**: `CreateRuleDto.name` com `@IsString @IsNotEmpty`;
  `description` opcional sem `@IsNotEmpty` (permite string vazia) em `Rule` e em
  `RuleSectionInputDto`; `label` obrigatório em `RuleSectionInputDto`; `sections`
  validado com `@IsArray @ValidateNested({ each: true }) @Type(() =>
  RuleSectionInputDto)`; `UpdateRuleDto extends PartialType(CreateRuleDto)` correto.
  Nenhum campo sensível ou de outra entidade vazado nos response DTOs.
- **Unicidade de nome**: `create` e `update` validam conflito de `name` com
  `ConflictException('Já existe uma regra com este nome.')` (409, pt-BR), replicando
  exatamente `LocationsService`. `remove` lança `NotFoundException('Regra não
  encontrada.')` quando `affected === 0`.
- **Módulo `search`**: `LinkableEntityType.RULE = 'rule'` adicionado ao final do enum;
  `Rule` registrada em `TypeOrmModule.forFeature` de `search.module.ts`; `SearchService`
  injeta `rulesRepository` e adiciona `{ entityType: LinkableEntityType.RULE,
  repository: this.rulesRepository }` ao array `linkableEntities` sem alterar a lógica
  genérica de busca (`ILIKE`, `MAX_RESULTS`, `orderBy('entity.name', 'ASC')`);
  `search.controller.ts` e `SearchResultItemResponseDto` atualizados para mencionar
  "regras"/"regra" na documentação Swagger.
- **`RulesModule`**: `TypeOrmModule.forFeature([Rule, RuleSection])`, `controllers`,
  `providers`, `exports: [RulesService]` corretos; importado e registrado em
  `app-api/src/app.module.ts`.
- **Convenções gerais do `CLAUDE.md`**: `BaseEntity` estendida em ambas as entidades
  (sem registro manual necessário, `autoLoadEntities: true`); nenhuma query
  concatena input do usuário (uso de parâmetros nomeados `:name`/`:query` em todos os
  `ILIKE`); mensagens de erro em pt-BR; nomes de entidades/colunas/DTOs/JSON em inglês
  (`Rule`, `RuleSection`, `name`, `description`, `label`, `order`, `sections`);
  `synchronize: false` respeitado (schema via migrations, não executadas
  automaticamente).

Nenhum problema bloqueante, de segurança ou de inconsistência migration↔entidade foi
encontrado.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/rules/entities/rule.entity.ts`,
`app-api/src/modules/rules/entities/rule-section.entity.ts`,
`app-api/src/database/migrations/1784305790000-CreateRulesTable.ts`,
`app-api/src/database/migrations/1784305800000-CreateRuleSectionsTable.ts`,
`app-api/src/modules/rules/dto/create-rule.dto.ts`,
`app-api/src/modules/rules/dto/update-rule.dto.ts`,
`app-api/src/modules/rules/dto/find-rules-query.dto.ts`,
`app-api/src/modules/rules/dto/rule-section-input.dto.ts`,
`app-api/src/modules/rules/dto/rule-section-response.dto.ts`,
`app-api/src/modules/rules/dto/rule-response.dto.ts`,
`app-api/src/modules/rules/dto/rule-list-item-response.dto.ts`,
`app-api/src/modules/rules/dto/paginated-rules-response.dto.ts`,
`app-api/src/modules/rules/rules.service.ts`,
`app-api/src/modules/rules/rules.controller.ts`,
`app-api/src/modules/rules/rules.module.ts`,
`app-api/src/app.module.ts`,
`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`,
`app-api/src/modules/search/search.module.ts`,
`app-api/src/modules/search/search.service.ts`,
`app-api/src/modules/search/search.controller.ts`,
`app-api/src/modules/search/dto/search-result-item-response.dto.ts`.
