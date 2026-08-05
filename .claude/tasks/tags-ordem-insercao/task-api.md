# Task API: Ordem de inserção das tags (persistência e leitura ordenada)

## Contexto
Ver `.claude/tasks/tags-ordem-insercao/spec.md` para o escopo confirmado
(comportamento esperado, decisões 1-4, lista das 24 tabelas de junção e pontos
técnicos já mapeados). Este plano cobre exclusivamente o `app-api`.

## Etapas

### 1. api-dev

**Status:** concluído

**Resumo da implementação:**

- **Helper compartilhado**: criado `app-api/src/common/utils/ordered-tags.util.ts`
  com `loadOrderedTagsMap` (busca em lote, `order ASC, id ASC`),
  `loadOrderedTagsForOwner` (atalho para 1 dono), `createOrderedTagJunctions`
  (grava linhas de junção com `order = índice`) e `replaceOrderedTagJunctions`
  (apaga tudo e recria — usado em `update`). Essas duas últimas não estavam no
  plano original como funções nomeadas, mas foram extraídas para evitar
  duplicar a mesma lógica de gravação nos 24 services (mesmo espírito do
  helper de leitura já previsto no plano).
- **24 entidades de junção** criadas em `entities/<owner>-tag.entity.ts` de
  cada um dos 24 módulos (Ammunition, Biography, Campaign, Character,
  Characteristic, Condition, Consumable, Creature, Divinity, Equipment, Era,
  Event, Family, Location, Material, Organization, PlannedSession, Race,
  Skill, Spell, Talent, Technique, Training, Utility), cada uma estendendo
  `BaseEntity`, com `order: number` (default 0), `@ManyToOne` para o dono e
  para `Tag` (`onDelete: 'CASCADE'`) e `@Unique(['<owner>', 'tag'])`.
- **24 entidades donas** alteradas: campo `tags!: Tag[]` mantido apenas como
  campo simples com `@ApiProperty` (sem `@ManyToMany`/`@JoinTable`), preenchido
  em memória pelos services.
- **24 services** atualizados: `findTagsByIds` corrigido para preservar a
  ordem de `tagIds` (Map + `uniqueIds.map(...)`, incluindo as variantes
  transacionais com `Repository<Tag>` opcional em `characters.service.ts`,
  `eras.service.ts` e `families.service.ts`); `findById`/`findOne...` e
  `findAllPaginated` passaram a montar `entity.tags` via
  `loadOrderedTagsForOwner`/`loadOrderedTagsMap` em vez de `relations: { tags:
  true }`; `create` grava as linhas de junção via `createOrderedTagJunctions`
  após salvar o dono; `update` usa `replaceOrderedTagJunctions` somente quando
  `dto.tagIds !== undefined`, preservando as tags existentes (via `let tags =
  entity.tags`) quando o campo não é informado.
- **24 módulos** (`*.module.ts`) atualizados para registrar a nova entidade de
  junção via `TypeOrmModule.forFeature`.
- **Consumidores cruzados corrigidos** (varredura confirmou que os únicos
  consumidores de `tags: true` aninhado fora dos 24 "donos" eram exatamente os
  4 já mapeados no plano — nenhum outro encontrado):
  - `characters.service.ts` — `race.tags` aninhado corrigido (injeta
    `RaceTag`), tanto em `findById`/`findAllPaginated` quanto no bloco
    transacional de `update` e no helper privado `findRaceById`.
  - `races.service.ts` — `characteristics.tags` e `talents.tags` aninhados
    corrigidos via helper privado `attachOrderedTags` (injeta
    `CharacteristicTag` e `TalentTag`).
  - `sheets.service.ts` — `race` (com `characteristics`/`talents` e tags
    aninhadas) e `biography.tags` corrigidos via helper privado
    `attachRaceOrderedTags` reaplicado em `findRaceById` e
    `findAccessibleById`; um uso adicional de `relations: { tags: true }` em
    `linkBiography` (carregamento de `biography` não utilizado depois) foi
    simplificado para `findOneBy` sem relação, já que `biography.tags` nunca
    era lido nesse ponto.
  - `entity-links.service.ts` — os 6 relacionamentos `target<Tipo>: { tags:
    true }` em `loadReferencesFor` substituídos por relations simples +
    `loadOrderedTagsMap` por tipo, atribuindo `tags` a cada entidade-alvo antes
    de montar `EntityReferenceResponseDto`.
- Módulos correspondentes (`characters.module.ts`, `races.module.ts`,
  `sheets.module.ts`, `entity-links.module.ts`) atualizados com os repositórios
  de junção adicionais necessários.
- Verificação final: grep por `tags: true` e por `@ManyToMany(() => Tag)` em
  todo `app-api/src` não retornou nenhuma ocorrência remanescente.

**Desvio do plano (justificado):** nenhum desvio de arquitetura. A única
adição não literalmente descrita no plano foi a extração de
`createOrderedTagJunctions`/`replaceOrderedTagJunctions` como funções do
helper compartilhado (o plano só especificava a assinatura de leitura,
`loadOrderedTagsMap`) — feito para manter consistência entre os 24 services e
evitar divergência de implementação da lógica de gravação descrita na seção
"Gravação (create/update) usando a ordem resolvida".

#### Entidade

**Decisão central: entidade de junção explícita, uma por relação (24 no total)**

O `@ManyToMany` + `@JoinTable` simples do TypeORM não suporta uma coluna extra
(`order`) na tabela de junção. A única forma de acrescentar essa coluna e
continuar usando o TypeORM de forma idiomática é modelar cada tabela de junção
como uma entidade explícita, com dois `@ManyToOne` (dono da relação e `Tag`) e
a coluna `order`. Esse padrão já existe no código (não é uma novidade
arquitetural): `OrganizationMember`
(`app-api/src/modules/organizations/entities/organization-member.entity.ts`),
`FamilyMember` e `FamilyRelationship`
(`app-api/src/modules/families/entities/`) já são entidades de junção
explícitas estendendo `BaseEntity`, com `@Unique([...])` garantindo a
não-duplicação que antes vinha da chave primária composta. O mesmo padrão
existe para ordenação sequencial em `LocationSection`
(`app-api/src/modules/locations/entities/location-section.entity.ts`), que já
tem uma coluna `order: number` preenchida como `order: index` ao criar a
lista — esse é o precedente direto a seguir para a coluna de ordem das tags.

Para cada uma das 24 relações, criar uma entidade `<Owner>Tag` (extends
`BaseEntity`, portanto ganha `id` uuid, `createdAt`, `updatedAt`) com:
- `order: number` (`@Column({ type: 'int', default: 0 })`) — tolera registros
  legados (ver seção Migration).
- `<owner>: <Owner>` (`@ManyToOne(() => <Owner>, { onDelete: 'CASCADE' }) @JoinColumn({ name: '<owner>_id' })`).
- `tag: Tag` (`@ManyToOne(() => Tag, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'tag_id' })`).
- `@Unique(['<owner>', 'tag'])` no nível da entidade, substituindo a garantia
  de unicidade que hoje vem da PK composta `(<owner>_id, tag_id)`.

Nas 24 entidades donas, remover o `@ManyToMany(() => Tag) @JoinTable({...})
tags!: Tag[]` e substituir por um campo `tags!: Tag[]` **sem decorators de
relação do TypeORM** (continua com `@ApiProperty` só para fins de
documentação/tipagem). Esse campo passa a ser preenchido em memória pelo
service (não é mais gerenciado automaticamente pelo TypeORM) — ver detalhes de
leitura/escrita abaixo. Não é necessário declarar a relação inversa
(`@OneToMany`) na entidade dona; o service injeta o repositório da entidade de
junção diretamente.

Tabela de mapeamento (entidade dona → tabela atual → coluna dona → nova
entidade de junção a criar):

| # | Módulo | Entidade dona | Tabela atual | Coluna dona | Nova entidade de junção |
|---|--------|----------------|--------------|-------------|--------------------------|
| 1 | ammunition | Ammunition | ammunition_tags | ammunition_id | AmmunitionTag |
| 2 | biographies | Biography | biography_tags | biography_id | BiographyTag |
| 3 | campaigns | Campaign | campaign_tags | campaign_id | CampaignTag |
| 4 | characters | Character | character_tags | character_id | CharacterTag |
| 5 | characteristics | Characteristic | characteristic_tags | characteristic_id | CharacteristicTag |
| 6 | conditions | Condition | condition_tags | condition_id | ConditionTag |
| 7 | consumables | Consumable | consumable_tags | consumable_id | ConsumableTag |
| 8 | creatures | Creature | creature_tags | creature_id | CreatureTag |
| 9 | divinities | Divinity | divinity_tags | divinity_id | DivinityTag |
| 10 | equipment | Equipment | equipment_tags | equipment_id | EquipmentTag |
| 11 | eras | Era | era_tags | era_id | EraTag |
| 12 | events | Event | event_tags | event_id | EventTag |
| 13 | families | Family | family_tags | family_id | FamilyTag |
| 14 | locations | Location | location_tags | location_id | LocationTag |
| 15 | materials | Material | material_tags | material_id | MaterialTag |
| 16 | organizations | Organization | organization_tags | organization_id | OrganizationTag |
| 17 | planned-sessions | PlannedSession | planned_session_tags | planned_session_id | PlannedSessionTag |
| 18 | races | Race | race_tags | race_id | RaceTag |
| 19 | skills | Skill | skill_tags | skill_id | SkillTag |
| 20 | spells | Spell | spell_tags | spell_id | SpellTag |
| 21 | talents | Talent | talent_tags | talent_id | TalentTag |
| 22 | techniques | Technique | technique_tags | technique_id | TechniqueTag |
| 23 | trainings | Training | training_tags | training_id | TrainingTag |
| 24 | utilities | Utility | utility_tags | utility_id | UtilityTag |

Cada módulo deve registrar sua nova entidade de junção via
`TypeOrmModule.forFeature([...])` no respectivo `*.module.ts` (o
`autoLoadEntities: true` cobre o schema, mas a injeção de repositório via
`@InjectRepository` continua exigindo o registro no módulo).

**Helper compartilhado para resolver/anexar tags ordenadas**

Como a lógica de "buscar linhas de junção de um lote de donos, ordenar por
`order` com desempate estável e agrupar em `Map<ownerId, Tag[]>`" se repete
nos 24 services (e em consumidores fora dos 24, ver abaixo), recomenda-se
criar um helper único e reutilizável (ex.: `common/utils/ordered-tags.util.ts`
ou dentro do módulo `tags`), com uma assinatura próxima de:
`loadOrderedTagsMap<J extends { id: string; order: number; tag: Tag }>(junctionRepository: Repository<J>, ownerIds: string[], ownerRelationName: string): Promise<Map<string, Tag[]>>`.
Cada service usa esse helper para popular `entity.tags` após carregar a
entidade principal (sem `tags: true` no `relations`).

**Critério de desempate estável na leitura**

Ordenar sempre por `order ASC` e, como segundo critério, pelo `id` (uuid) da
própria linha de junção (`ORDER BY "order" ASC, "id" ASC`). O `id` é
garantidamente único e sua ordenação é determinística no Postgres, portanto
duas consultas sucessivas sempre devolvem a mesma sequência mesmo quando
várias linhas legadas têm `order = 0` (valor default, sem backfill). Não há
pretensão de que esse desempate reflita a ordem real de inserção histórica —
isso é aceitável pois o spec já define que registros legados ficam com ordem
indefinida/arbitrária até serem reeditados; o requisito é apenas estabilidade
entre requisições, que o `id` garante.

Esse critério deve ser aplicado tanto no `findById`/detalhe quanto na
montagem da página em `findAllPaginated`, para os 24 módulos.

**Divergência proposital em relação ao padrão de `LocationSection`**

Em `LocationResponseDto.fromEntity`, o `order` mora na própria entidade
relacionada (`section.order`) e o sort acontece dentro do DTO
(`.slice().sort((a,b) => a.order - b.order)`). Para tags isso não é possível
da mesma forma: o `order` mora na linha de junção, não na entidade `Tag`. Por
isso a ordenação deve ocorrer no service, no momento em que a linha de junção
é convertida para `Tag[]` (antes de atribuir a `entity.tags`) — os response
DTOs não precisam (e não devem) reordenar `entity.tags` de novo.

**Impacto cruzado — não é só o service "dono" de cada uma das 24 relações**

Vários services fora do módulo dono também fazem eager-load aninhado de
`tags` de entidades que fazem parte das 24 (ex.: a raça de um personagem, ou
os alvos de um `EntityLink`). Esses pontos também usam
`relations: { ...: { tags: true } }` e vão quebrar (relação inexistente)
assim que o `@ManyToMany` for removido — precisam ser adaptados para usar o
mesmo helper de anexação ordenada em vez do `relations` aninhado:
- `app-api/src/modules/characters/characters.service.ts` — carrega
  `race.tags` aninhado (linhas ~55, 79, 210, 237: `race: { category: true, tags: true }`).
- `app-api/src/modules/races/races.service.ts` — já é um dos 24, mas também
  carrega `characteristics: { tags: true }` e `talents: { tags: true }`
  aninhados (linhas ~65-66) — precisa do mesmo tratamento para as tags de
  `Characteristic` e `Talent`, não só para as próprias.
- `app-api/src/modules/sheets/sheets.service.ts` — carrega `race` (com
  `characteristics`/`talents` e suas tags aninhadas) e `biography.tags`
  (linhas ~69-74 e ~159-165).
- `app-api/src/modules/entity-links/entity-links.service.ts` — carrega tags
  aninhadas de `targetTraining`, `targetTalent`, `targetTechnique`,
  `targetSpell`, `targetCharacteristic`, `targetBiography` (linhas ~288-293).

O `api-dev` deve varrer o código por `tags: true` (não só nos 24 services
"donos") para garantir que nenhum consumidor cruzado fique quebrado.

**Correção do padrão `findTagsByIds` (ordem de gravação)**

Hoje `findTagsByIds` faz `tagsRepository.findBy({ id: In(uniqueIds) })`, cujo
retorno não respeita a ordem de `tagIds`. Deve passar a reconstruir a ordem a
partir do array de entrada:
1. Deduplicar preservando a primeira ocorrência: `const uniqueIds = [...new Set(tagIds)]`.
2. Buscar as tags (`findBy({ id: In(uniqueIds) })`), validar que a quantidade bate (como já é feito).
3. Montar um `Map<id, Tag>` a partir do resultado e devolver
   `uniqueIds.map((id) => tagsById.get(id)!)` — ou seja, o array de retorno
   passa a seguir a ordem de `uniqueIds` (que é a ordem de `dto.tagIds`
   deduplicada), independentemente da ordem física devolvida pelo banco.

Esse ajuste deve ser replicado nos 24 services, incluindo as variantes que
recebem um `Repository<Tag>` opcional por rodar dentro de transação
(`characters.service.ts`, `eras.service.ts`, `families.service.ts`).

**Gravação (create/update) usando a ordem resolvida**

Como as tags deixam de ser uma relação `@ManyToMany` gerenciada
automaticamente pelo TypeORM ao salvar a entidade dona, `create` e `update`
passam a gerenciar explicitamente as linhas de junção:
- `create`: salvar a entidade dona normalmente (sem tocar em `tags`); depois,
  se houver `tagIds`, criar uma linha de junção por tag resolvida, com
  `order` igual ao índice da tag no array já ordenado (`tags.map((tag, index) => junctionRepository.create({ [owner]: savedOwner, tag, order: index }))`) e salvar em lote; por fim, atribuir `savedOwner.tags = tags` em memória para a resposta.
- `update`: quando `dto.tagIds !== undefined`, apagar todas as linhas de
  junção existentes para aquele dono (`junctionRepository.delete({ [owner]: { id } })`) e recriar do zero na ordem resolvida (mesma lógica do create).
  Quando `dto.tagIds` não for informado, não tocar nas linhas de junção
  existentes (comportamento equivalente ao atual).

Esse "apagar tudo e recriar" é intencionalmente simples (sem diff
linha-a-linha) — listas de tags por entidade são tipicamente pequenas, então
o custo é desprezível, e evita lógica de reconciliação desnecessária.

#### Migration

**Necessária: sim.** Uma migration (pode ser um único arquivo cobrindo as 24
tabelas, seguindo blocos repetidos por tabela) que, para cada uma das 24
tabelas listadas na tabela acima:
1. `ADD COLUMN "id" uuid NOT NULL DEFAULT gen_random_uuid()`.
2. `ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`.
3. `ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now()`.
4. `ADD COLUMN "order" integer NOT NULL DEFAULT 0` — tolera as linhas
   legadas sem exigir backfill (decisão 2 do spec: nenhuma ordem alfabética
   retroativa deve ser atribuída; o `default 0` é só para satisfazer a
   constraint `NOT NULL`, não uma tentativa de ordenação).
5. `DROP CONSTRAINT "PK_<tabela>"` (a PK composta atual em `(<owner>_id, tag_id)`).
6. `ADD CONSTRAINT "PK_<tabela>_id" PRIMARY KEY ("id")`.
7. `ADD CONSTRAINT "UQ_<tabela>_<owner>_id_tag_id" UNIQUE ("<owner>_id", "tag_id")` — repõe a garantia de não-duplicação que antes vinha da PK composta.
8. Manter (ou recriar, se necessário) os índices não-únicos existentes em
   `<owner>_id` e `tag_id` (hoje já existem como `IDX_<tabela>_<owner>_id` e
   `IDX_<tabela>_tag_id` — conferir se sobrevivem ao drop da PK composta ou
   se precisam ser recriados).

Nenhuma linha existente é apagada ou reescrita quanto a `<owner>_id`/`tag_id`
— apenas colunas novas são adicionadas com defaults, preservando todas as
associações já existentes. O `down()` da migration deve reverter
simetricamente (repor a PK composta, remover a UNIQUE e as colunas novas).

O `data-source.ts` já aponta para `src/database/migrations/`; seguir a
convenção de nome de arquivo com timestamp maior que o último existente
(`1784306270000-AddBiographyAndSnapshotsToSheets.ts`), ex.:
`178430XXXXXXX-AddOrderToTagJunctionTables.ts`.

**Migration implementada:**
`app-api/src/database/migrations/1784306280000-AddOrderToTagJunctionTables.ts`
— um único arquivo cobrindo as 24 tabelas via um array `TAG_JUNCTION_TABLES`
(`{ table, owner }`) iterado em `up()`/`down()`, reproduzindo exatamente os 8
passos acima por tabela (`up()`) e o inverso simétrico em ordem reversa
(`down()`: drop da UNIQUE, drop da PK em `id`, recriação da PK composta,
remoção de `order`/`updated_at`/`created_at`/`id`). Nenhum backfill de ordem.
Os índices não-únicos `IDX_<tabela>_<owner>_id`/`IDX_<tabela>_tag_id`
existentes desde a criação de cada tabela são objetos de índice
independentes da PK composta e não são afetados pelo `DROP CONSTRAINT`,
portanto não precisaram ser recriados — confirmado por leitura comparativa
das 24 migrations `Create<X>TagsTable` originais (todas seguem
`CONSTRAINT "PK_<tabela>" PRIMARY KEY ("<owner>_id", "tag_id")` mais os dois
`CREATE INDEX` separados). Migration ainda não executada (`npm run
migration:run`) — depende de confirmação explícita do usuário, conforme regra
da skill `api-migration`.

#### Controller

Nenhum endpoint novo e nenhuma alteração de contrato de request/response nos
24 controllers — os DTOs de entrada (`tagIds: string[]`) e de saída
(`tags: TagResponseDto[]`) continuam os mesmos. O que muda é o comportamento
interno:
- Leitura (`GET` de detalhe e listagem paginada): a API passa a devolver
  `tags` na ordem de inserção (com desempate estável), em vez de ordem
  arbitrária do banco.
- Escrita (`POST`/`PATCH`): a ordem de `tagIds` enviada no payload passa a
  ser persistida e refletida na leitura subsequente.

- Endpoints: nenhum novo (os 24 módulos mantêm seus endpoints de CRUD
  existentes inalterados).
- DTOs: nenhum novo DTO e nenhuma alteração nos DTOs existentes de
  create/update/response dos 24 módulos.
- Acesso Google: não aplicável — não há endpoint novo nem mudança de nível de
  acesso; os níveis já configurados em cada um dos 24 controllers permanecem
  como estão.

**Ajuste em response DTOs:** não é necessário alterar nenhum
`*ResponseDto.fromEntity` dos 24 módulos (nem os de entidades cross-module
afetadas, como `SheetResponseDto`/`EntityReferenceResponseDto`). Eles
continuam apenas mapeando `entity.tags` (`(entity.tags ?? []).map((tag) => TagResponseDto.fromEntity(tag))`) — a responsabilidade de entregar esse array
já ordenado passa a ser inteiramente do service, antes de a entidade chegar
ao DTO.

**Escopo de regressão:** mudança sistemática nos 24 módulos abaixo (mais os
4 pontos de consumo cruzado listados na seção Entidade). O `api-dev` não deve
deixar nenhum destes de fora:
`ammunition`, `biographies`, `campaigns`, `characters`, `characteristics`,
`conditions`, `consumables`, `creatures`, `divinities`, `equipment`, `eras`,
`events`, `families`, `locations`, `materials`, `organizations`,
`planned-sessions`, `races`, `skills`, `spells`, `talents`, `techniques`,
`trainings`, `utilities`.

**Ponto em aberto para o `api-dev` avaliar durante a implementação (não é
lacuna de requisito, é detalhe técnico a confirmar no código):** conferir se
existe algum outro consumidor de `tags: true` aninhado além dos quatro
listados na seção Entidade (a varredura foi feita por grep no momento deste
planejamento; novos usos podem ter sido adicionados depois).

### 2. api-dev-doc

**Status:** concluído

**Resumo da documentação atualizada:**

- Todos os 24 módulos tiveram seus DTOs de documentação Swagger atualizados:
  - **DTOs de response**: Campo `tags` agora inclui na descrição "na ordem de inserção" (ex.: "Tags associadas à característica, na ordem de inserção")
  - **DTOs de create/update**: Campo `tagIds` agora inclui na descrição "na ordem de inserção preservada" (ex.: "IDs das tags associadas à característica, na ordem de inserção preservada (array de UUIDs válidos)")
- Módulos documentados: Ammunition, Biography, Campaign, Character, Characteristic, Condition, Consumable, Creature, Divinity, Equipment, Era, Event, Family, Location, Material, Organization, PlannedSession, Race, Skill, Spell, Talent, Technique, Training, Utility
- A documentação deixa explícito que a ordem é preservada de ponta a ponta (ordem de inserção, não alfabética)
- Nenhum novo endpoint ou schema foi adicionado — apenas as descrições de campos existentes foram reforçadas conforme especificado

### 3. api-dev-codereviewer

**Status:** concluído

- Revisar tudo acima, com atenção especial a:
  - Consistência das 24 entidades de junção (mesmo padrão de campos,
    `@Unique`, `onDelete: 'CASCADE'`).
  - A migration cobre as 24 tabelas sem exceção e é reversível.
  - `findTagsByIds` corrigido nos 24 services (e variantes transacionais).
  - Nenhum consumidor cruzado (`characters`, `races`, `sheets`,
    `entity-links`, e qualquer outro encontrado) ficou com `relations: { tags: true }` aninhado quebrado.
  - Desempate estável (`order ASC, id ASC`) aplicado tanto no detalhe quanto
    na listagem paginada dos 24 módulos.

## Revisão

Escopo revisado: helper compartilhado
(`app-api/src/common/utils/ordered-tags.util.ts`), migration
`app-api/src/database/migrations/1784306280000-AddOrderToTagJunctionTables.ts`,
as 24 entidades `<Owner>Tag`, os 24 `*.module.ts`, os 24 `*.service.ts`
donos (incluindo as variantes transacionais de `characters`, `eras` e
`families`), os 4 consumidores cruzados (`characters.service.ts`,
`races.service.ts`, `sheets.service.ts`, `entity-links.service.ts`) e uma
amostragem de DTOs/controllers/entidades donas afetadas. Confirmado por grep
que não sobra nenhuma ocorrência de `tags: true` nem de
`@ManyToMany(() => Tag)` em `app-api/src`, e que os 24 módulos registram
corretamente sua entidade de junção via `TypeOrmModule.forFeature`. As 24
entidades `<Owner>Tag` são idênticas em estrutura (`order` com `default: 0`,
`@ManyToOne` duplo com `onDelete: 'CASCADE'`, `@Unique(['<owner>', 'tag'])`,
`@JoinColumn` batendo com a coluna da migration). `findTagsByIds` foi
confirmado corrigido (dedup + `Map` + `uniqueIds.map(...)`) nos 24 services e
nas 3 variantes transacionais. O desempate `order ASC, id ASC` está
centralizado em `loadOrderedTagsMap`/`loadOrderedTagsForOwner` e é usado de
forma consistente tanto no detalhe quanto na listagem paginada dos 24
módulos (confirmado via contagem de uso: todos ≥ 4 ocorrências, cobrindo
import + detalhe + listagem, e mais nos módulos com consumo cruzado). A
migration cobre as 24 tabelas sem exceção, o nome da PK dropada
(`PK_<table>`) bate exatamente com o nome usado nas 24 migrations
`Create<X>TagsTable` originais (conferido por grep em todas), e o `down()`
reverte simetricamente o `up()` em ordem inversa.

Dois achados, nenhum bloqueante:

- **`app-api/src/database/migrations/1784306280000-AddOrderToTagJunctionTables.ts:67-69`**
  — A garantia de unicidade `(owner_id, tag_id)` é recriada como uma
  `ALTER TABLE ... ADD CONSTRAINT "UQ_<table>_<owner>_tag_id" UNIQUE (...)`.
  Isso funciona, mas diverge do padrão já estabelecido no projeto para o
  mesmo cenário (entidade com `@Unique([...])` sem nome explícito e sem
  `synchronize`): as migrations manuscritas existentes para o mesmo padrão
  (`1784305620000-CreateOrganizationMembersTable.ts`,
  `1784305670000-CreateFamilyRelationshipsTable.ts`) implementam a mesma
  garantia como `CREATE UNIQUE INDEX "IDX_<table>_<col1>_<col2>"`, não como
  `CONSTRAINT ... UNIQUE`. Não é um erro de execução (a unicidade é
  igualmente garantida), mas é uma inconsistência de convenção/nomenclatura
  com o restante do código.
  - Trecho: `` `ALTER TABLE "${table}" ADD CONSTRAINT "UQ_${table}_${owner}_tag_id" UNIQUE ("${owner}", "tag_id")` ``
  - Sugestão: alinhar ao padrão existente, trocando por
    `CREATE UNIQUE INDEX "IDX_${table}_${owner}_tag_id" ON "${table}" ("${owner}", "tag_id")`
    no `up()` e o `DROP INDEX` correspondente no `down()` (mesmo estilo de
    `CreateOrganizationMembersTable`/`CreateFamilyRelationshipsTable`).

- **`app-api/src/modules/races/races.service.ts:352-363`** (método `update`)
  — Quando `dto.characteristicIds` e/ou `dto.talentIds` são informados no
  `PUT /races/:id`, `race.characteristics`/`race.talents` são reatribuídos a
  partir de `findCharacteristicsByIds`/`findTalentsByIds`, que fazem apenas
  um `findBy({ id: In(...) })` simples — sem popular `.tags` dessas
  características/talentos (diferente de `attachOrderedTags`, chamado só no
  `findById`/detalhe). Como `update()` não re-executa `attachOrderedTags`
  nem chama `this.findById(id)` de novo ao final (diferente do padrão usado
  em `charactersService.update`, `organizationsService.update` e
  `familiesService.update`, que sempre re-buscam a entidade completa após a
  transação), a resposta imediata do `PUT /races/:id` retorna
  `characteristics[].tags`/`talents[].tags` vazios para qualquer
  característica/talento recém-associado nessa mesma chamada — mesmo que
  essas tags existam de fato no banco. `CharacteristicListItemResponseDto.fromEntity`/`TalentListItemResponseDto.fromEntity`
  não quebram (usam `?? []`), mas o dado retornado fica incorreto até a
  próxima consulta (`GET /races/:id`, que passa por `attachOrderedTags` e
  corrige a leitura). É o mesmo tipo de risco ("tags vir vazio em runtime")
  que a task pediu para verificar nos consumidores cruzados, só que
  localizado dentro do próprio `RacesService.update`.
  - Trecho: `race.characteristics = dto.characteristicIds.length > 0 ? await this.findCharacteristicsByIds(dto.characteristicIds) : [];`
  - Sugestão: depois de reatribuir `race.characteristics`/`race.talents`
    (ou, mais simplesmente, após salvar), rechamar `attachOrderedTags(race)`
    (ou ao menos os dois blocos de `loadOrderedTagsMap` para
    `characteristicTagsRepository`/`talentTagsRepository`) antes de montar o
    retorno, para que a resposta do `PUT` reflita as tags reais das
    características/talentos recém-atribuídos.

### Correções aplicadas (pós-revisão)

- **Achado 1 (migration)**: `1784306280000-AddOrderToTagJunctionTables.ts`
  ajustado no `up()` — a linha `ALTER TABLE ... ADD CONSTRAINT
  "UQ_${table}_${owner}_tag_id" UNIQUE (...)` foi substituída por
  `CREATE UNIQUE INDEX "IDX_${table}_${owner}_tag_id" ON "${table}"
  ("${owner}", "tag_id")`, no mesmo estilo de
  `CreateOrganizationMembersTable`/`CreateFamilyRelationshipsTable`. O `down()`
  foi ajustado simetricamente, trocando `ALTER TABLE ... DROP CONSTRAINT
  "UQ_${table}_${owner}_tag_id"` por `DROP INDEX
  "public"."IDX_${table}_${owner}_tag_id"` (mesma sintaxe com schema
  `"public".` usada nos dois arquivos de referência). Nenhuma outra linha da
  migration foi alterada; migration segue não executada.
- **Achado 2 (`races.service.ts`, método `update`)**: ao final do `update`,
  após `const savedRace = await this.racesRepository.save(race);`, a linha
  `savedRace.tags = tags;` foi substituída por
  `await this.attachOrderedTags(savedRace);`. Esse helper privado já existente
  (reaproveitado do `findById`) recarrega `savedRace.tags` via
  `loadOrderedTagsForOwner` (refletindo as junções já regravadas por
  `replaceOrderedTagJunctions` quando `dto.tagIds` foi informado) e também
  popula `characteristic.tags`/`talent.tags` para todas as
  `race.characteristics`/`race.talents` atuais — incluindo as recém-associadas
  via `dto.characteristicIds`/`dto.talentIds` no mesmo `PUT`. A variável local
  `tags` permanece usada apenas para resolver e gravar as tags da própria
  raça (`findTagsByIds` + `replaceOrderedTagJunctions`); nenhuma outra lógica
  do método foi alterada.

## Re-revisão das correções (pós-correção)

Escopo desta rodada: exclusivamente os dois pontos corrigidos acima —
`app-api/src/database/migrations/1784306280000-AddOrderToTagJunctionTables.ts`
e o método `update` de `app-api/src/modules/races/races.service.ts`. Não foi
repetida a revisão completa dos 24 módulos (já aprovada anteriormente).

**Migration — achado 1 corrigido, confirmado:**
- (a) `up()` continua iterando as 24 entradas de `TAG_JUNCTION_TABLES`, sem
  omissão. A garantia de unicidade `(owner_id, tag_id)` foi preservada (não
  removida): passou de `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (...)` para
  `CREATE UNIQUE INDEX "IDX_${table}_${owner}_tag_id" ON "${table}"
  ("${owner}", "tag_id")` — um índice único continua rejeitando duplicatas no
  Postgres exatamente como a constraint fazia.
- (b) `down()` reverte simetricamente: `DROP INDEX
  "public"."IDX_${table}_${owner}_tag_id"` (não há mais tentativa de `DROP
  CONSTRAINT` de algo que não existe), seguido do drop da PK em `id`, recriação
  da PK composta e remoção das colunas novas — mesma ordem inversa do `up()`.
- (c) Verificado por leitura direta de duas migrations originais
  (`1784305450000-CreateRaceTagsTable.ts` e
  `1784306010000-CreatePlannedSessionTagsTable.ts`) que os índices não-únicos
  pré-existentes seguem o padrão `IDX_<table>_<owner>` e `IDX_<table>_tag_id`
  (ex.: `IDX_race_tags_race_id`, `IDX_race_tags_tag_id`). O novo índice único
  gerado é `IDX_<table>_<owner>_tag_id` (ex.: `IDX_race_tags_race_id_tag_id`),
  que inclui os dois segmentos e portanto não colide com nenhum dos dois
  nomes de índice de coluna única já existentes, em nenhuma das 24 tabelas
  (o padrão de nome da coluna `owner` já inclui o sufixo `_id`, então não há
  duplicação de segmento). O nome também é consistente com o padrão já usado
  em `1784305620000-CreateOrganizationMembersTable.ts`
  (`IDX_organization_members_organization_id_character_id`), que é o mesmo
  estilo citado como referência na correção.
- (d) A ordem das operações no `up()` permanece válida: colunas novas são
  adicionadas primeiro, depois a PK composta é dropada e a nova PK (`id`) é
  criada, e só então o índice único é criado — não há dependência entre o
  índice único e o estado da PK, então a ordem não introduz erro de execução.
  O `down()` espelha isso corretamente (índice único dropado antes da PK em
  `id`, PK composta recriada antes da remoção das colunas).
- Nenhum problema encontrado neste ponto. Achado 1 considerado corrigido.

**`races.service.ts` — achado 2 corrigido, confirmado, com uma observação
menor não bloqueante:**
- `replaceOrderedTagJunctions` (linhas 345-350) é `await`ado antes de
  `racesRepository.save(race)` (linha 406) e antes de
  `attachOrderedTags(savedRace)` (linha 407); como as chamadas são
  sequenciais (sem races de concorrência dentro do próprio método), quando
  `attachOrderedTags` roda, as linhas de junção de tag da raça já refletem o
  estado final gravado por `replaceOrderedTagJunctions` — não há leitura de
  estado desatualizado nem sobrescrita das tags recém-gravadas por um valor
  antigo.
- `race.characteristics`/`race.talents` são reatribuídos (linhas 352-363,
  quando os respectivos `dto.*Ids` são informados) antes do `save`, e
  `attachOrderedTags(savedRace)` itera sobre `race.characteristics`/
  `race.talents` *depois* dessa reatribuição — populando `.tags` para as
  características/talentos recém-associados na mesma chamada. Confirma que o
  achado 2 original (tags vazias de características/talentos recém-associados
  na resposta imediata do `PUT`) está corrigido: a resposta do `PUT
  /races/:id` agora reflete `characteristics[].tags`/`talents[].tags`
  corretos, iguais aos que um `GET /races/:id` subsequente retornaria.
- Observação não bloqueante (consulta redundante, não incorreção): o próprio
  `update()` já chama `attachOrderedTags` indiretamente uma primeira vez ao
  carregar a raça via `const result = await this.findById(id);` (linha 311,
  que internamente chama `attachOrderedTags(race)` na linha 113). Essa
  primeira chamada popula `race.tags` e as tags de
  `characteristics`/`talents` do estado *anterior* às alterações do `PUT`;
  se `dto.tagIds`/`dto.characteristicIds`/`dto.talentIds` forem informados,
  esse trabalho é descartado e uma segunda chamada a `attachOrderedTags`
  (linha 407) refaz as mesmas consultas (até 3 buscas: tags da raça, mapa de
  tags de características, mapa de tags de talentos) para refletir o estado
  final. Isso não causa dado incorreto — é a troca de correção aceita pela
  própria task (abordagem "apagar tudo e recriar", já assumida como
  intencionalmente simples) —, mas é um custo de consultas evitável em tese
  (ex.: só popular tags após todas as reatribuições, evitando o trabalho
  duplicado da primeira chamada quando os IDs mudam). Não bloqueante; reportado
  apenas como possível otimização futura, não como regressão de
  comportamento.

**Conclusão desta rodada:** os dois achados da revisão anterior foram
corrigidos corretamente, sem introduzir bugs, inconsistência
migration↔entidade ou vazamento de dados. Nenhum novo achado bloqueante.
Aprovado.
