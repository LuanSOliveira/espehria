# Task API: Filtro por tags nos endpoints de listagem de traços, magias, técnicas, perícias e condições

## Contexto
Não existe `.claude/tasks/filtro-tags-habilidades/spec.md`. Este plano foi elaborado
diretamente a partir do pedido, sem lacunas de requisito relevantes identificadas — a
demanda é objetiva (replicar um padrão já existente em 5 módulos) e o padrão de
referência (`trainings`, confirmado também em `talents` e `characteristics`) está
totalmente implementado e documentado no código.

Nenhuma migration, alteração de entidade ou de controller (além do parâmetro de query)
é necessária: as 5 entidades já possuem relacionamento com tags via tabela de junção
própria e os 5 controllers já expõem `GET` de listagem paginada com
`@GoogleAccess('read-only')` a nível de controller. O trabalho é exclusivamente:
1. adicionar `tagIds?: string[]` ao DTO de query de listagem de cada módulo;
2. aplicar o filtro AND por tags (com `innerJoin` + `groupBy` + `having`) no método
   `findAllPaginated` do respectivo service, replicando fielmente a solução de
   `trainings.service.ts` (linhas ~263-344), incluindo o tratamento especial do
   `total` quando há `groupBy`/`having`.

Todos os 5 módulos (`traits`, `spells`, `techniques`, `skills`, `conditions`) JÁ
possuem um `find-*-query.dto.ts` — não é necessário criar nenhum DTO de query novo,
apenas estendê-los.

## Etapas

### 1. api-dev

Aplicar o mesmo padrão (DTO + service) em cada um dos 5 módulos abaixo. Em todos os
casos, a entidade e o controller **não são alterados** (endpoint `GET` de listagem já
existe e já aceita `@Query()` do DTO correspondente).

---

#### Módulo: traits (traços)

##### Entidade
- Não altera entidade. `Trait` já possui relacionamento com tags via `TraitTag`
  (`app-api/src/modules/traits/entities/trait-tag.entity.ts`).
- Tabela de junção: `trait_tags`, FK do dono: `trait_id` (conforme `@JoinColumn({ name: 'trait_id' })` em `TraitTag`). Confirmar esses nomes lendo o arquivo antes de escrever a query (não assumir por convenção).

##### Migration
- Necessária: não.

##### Controller
- Endpoints afetados: `GET /traits` (listagem paginada, sem alteração de rota/assinatura do controller — apenas o `FindTraitsQueryDto` ganha um novo campo opcional).
- DTOs: `FindTraitsQueryDto` (`app-api/src/modules/traits/dto/find-traits-query.dto.ts`) — adicionar campo `tagIds?: string[]` com `@IsOptional() @IsArray() @IsUUID('4', { each: true })` e `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: '...' })`, texto de descrição em pt-BR explicando semântica AND e notação `tagIds[]=uuid1&tagIds[]=uuid2` (copiar o texto usado em `FindTrainingsQueryDto`, adaptando "treinamentos" para "traços").
- Service: `TraitsService.findAllPaginated` (`app-api/src/modules/traits/traits.service.ts`, atualmente linhas 118-168) — inserir o bloco de filtro por tags entre o filtro de `traitTypeId` e o `getManyAndCount()`, seguindo exatamente o padrão de `trainings.service.ts`:
  - `const hasTagFilter = !!query.tagIds && query.tagIds.length > 0;`
  - dedupe com `[...new Set(query.tagIds)]`
  - `innerJoin('trait_tags', 'trait_tag_filter', 'trait_tag_filter.trait_id = trait.id AND trait_tag_filter.tag_id IN (:...tagIds)', { tagIds: uniqueTagIds })`
  - `.groupBy('trait.id').having('COUNT(DISTINCT trait_tag_filter.tag_id) = :tagCount', { tagCount: uniqueTagIds.length })`
  - Substituir o atual `getManyAndCount()` único pela mesma bifurcação de `total` usada em `trainings`/`talents`/`characteristics`: `total` calculado via `getCount()` clonado quando não há filtro de tags, e via `select('trait.id').getRawMany().length` sobre uma cópia da query já filtrada/agrupada quando `hasTagFilter` for `true`. Depois, buscar `ids` com `.select(['trait.id', 'trait.name']).orderBy(...).skip().take().getMany()`.
  - Atenção: `traits` já possui `andWhere('trait.trait_type_id = :traitTypeId', ...)` — confirmar que esse filtro convive normalmente com o `groupBy('trait.id')` (filtro simples de igualdade sobre coluna própria da entidade, sem impacto esperado, mas validar).
- Acesso Google: read-only (padrão, já aplicado a nível de controller — nenhuma mudança necessária).

---

#### Módulo: spells (magias)

##### Entidade
- Não altera entidade. `Spell` já possui relacionamento via `SpellTag`
  (`app-api/src/modules/spells/entities/spell-tag.entity.ts`).
- Tabela de junção: `spell_tags`, FK do dono: `spell_id`. Confirmar no arquivo da entidade antes de implementar.

##### Migration
- Necessária: não.

##### Controller
- Endpoints afetados: `GET /spells` (listagem paginada).
- DTOs: `FindSpellsQueryDto` (`app-api/src/modules/spells/dto/find-spells-query.dto.ts`) — adicionar `tagIds?: string[]` com as mesmas validações/decorators descritos acima, description adaptada para "magias".
- Service: `SpellsService.findAllPaginated` (`app-api/src/modules/spells/spells.service.ts`, atualmente linhas 138-181) — hoje só filtra por `name`; inserir o bloco de filtro por tags (mesmo padrão: `hasTagFilter`, `innerJoin` em `spell_tags`/`spell_tag_filter` com condição `spell_tag_filter.spell_id = spell.id AND spell_tag_filter.tag_id IN (:...tagIds)`, `groupBy('spell.id')`, `having(...)`) antes do `getManyAndCount()`, e aplicar a mesma bifurcação de cálculo de `total`.
- Nenhum outro filtro/join hoje presente em `findAllPaginated` de spells — sem risco de conflito com `groupBy`/`ORDER BY` além do já mapeado no padrão de referência.
- Acesso Google: read-only (padrão, já aplicado a nível de controller).

---

#### Módulo: techniques (técnicas)

##### Entidade
- Não altera entidade. `Technique` já possui relacionamento via `TechniqueTag`
  (`app-api/src/modules/techniques/entities/technique-tag.entity.ts`).
- Tabela de junção: `technique_tags`, FK do dono: `technique_id`. Confirmar no arquivo da entidade.

##### Migration
- Necessária: não.

##### Controller
- Endpoints afetados: `GET /techniques` (listagem paginada).
- DTOs: `FindTechniquesQueryDto` (`app-api/src/modules/techniques/dto/find-techniques-query.dto.ts`) — adicionar `tagIds?: string[]` com as mesmas validações/decorators, description adaptada para "técnicas".
- Service: `TechniquesService.findAllPaginated` (`app-api/src/modules/techniques/techniques.service.ts`, atualmente linhas 138-186) — hoje só filtra por `name`; inserir o bloco de filtro por tags (`innerJoin` em `technique_tags`/`technique_tag_filter`, condição `technique_tag_filter.technique_id = technique.id AND technique_tag_filter.tag_id IN (:...tagIds)`, `groupBy('technique.id')`, `having(...)`) antes do `getManyAndCount()`, com a mesma bifurcação de `total`.
- Sem outros filtros/joins hoje em `findAllPaginated` — sem risco de conflito adicional.
- Acesso Google: read-only (padrão, já aplicado a nível de controller).

---

#### Módulo: skills (perícias)

##### Entidade
- Não altera entidade. `Skill` já possui relacionamento via `SkillTag`
  (`app-api/src/modules/skills/entities/skill-tag.entity.ts`).
- Tabela de junção: `skill_tags`, FK do dono: `skill_id`. Confirmar no arquivo da entidade.

##### Migration
- Necessária: não.

##### Controller
- Endpoints afetados: `GET /skills` (listagem paginada).
- DTOs: `FindSkillsQueryDto` (`app-api/src/modules/skills/dto/find-skills-query.dto.ts`) — adicionar `tagIds?: string[]` com as mesmas validações/decorators, description adaptada para "perícias".
- Service: `SkillsService.findAllPaginated` (`app-api/src/modules/skills/skills.service.ts`, atualmente linhas 133-184) — **atenção especial**: este método já faz `.leftJoin('skill.keyAttribute', 'keyAttribute')` e filtra por `query.keyAttributeId` via `andWhere('skill.keyAttribute = :keyAttributeId', ...)`. Ao introduzir `groupBy('skill.id')` para o filtro de tags, validar que:
  - o `leftJoin` com `keyAttribute` não quebra por causa do agrupamento — como nenhuma coluna de `keyAttribute` é selecionada no `select(['skill.id', 'skill.name'])` final, não deveria ser necessário incluir `keyAttribute.id` no `groupBy`, mas confirmar rodando a query (Postgres exige que toda coluna selecionada/ordenada não agregada esteja no `GROUP BY`; como só `skill.id`/`skill.name` são selecionadas, incluir `skill.name` no `groupBy` também, se necessário, para evitar erro do Postgres — verificar se `trainings`/`characteristics` precisaram disso, já que eles também fazem `select(['x.id', 'x.name'])` sem incluir `name` no `groupBy` e aparentemente funcionam, pois `id` já é chave primária e o Postgres permite agrupar só pela PK quando há constraint de unicidade — mas testar no caso de skills por causa do join extra).
  - Inserir o bloco de filtro por tags (`innerJoin` em `skill_tags`/`skill_tag_filter`, condição `skill_tag_filter.skill_id = skill.id AND skill_tag_filter.tag_id IN (:...tagIds)`, `groupBy('skill.id')`, `having('COUNT(DISTINCT skill_tag_filter.tag_id) = :tagCount', ...)`) após os filtros de `name`/`keyAttributeId` e antes do `getManyAndCount()`, com a mesma bifurcação de `total` (usando `select('skill.id').getRawMany().length` quando `hasTagFilter`).
- Acesso Google: read-only (padrão, já aplicado a nível de controller).

---

#### Módulo: conditions (condições)

##### Entidade
- Não altera entidade. `Condition` já possui relacionamento via `ConditionTag`
  (`app-api/src/modules/conditions/entities/condition-tag.entity.ts`).
- Tabela de junção: `condition_tags`, FK do dono: `condition_id`. Confirmar no arquivo da entidade.

##### Migration
- Necessária: não.

##### Controller
- Endpoints afetados: `GET /conditions` (listagem paginada).
- DTOs: `FindConditionsQueryDto` (`app-api/src/modules/conditions/dto/find-conditions-query.dto.ts`) — adicionar `tagIds?: string[]` com as mesmas validações/decorators, description adaptada para "condições".
- Service: `ConditionsService.findAllPaginated` (`app-api/src/modules/conditions/conditions.service.ts`, atualmente linhas 122-169) — hoje só filtra por `name`; a listagem não faz join com `sections` (`sections` só é carregado em `findById`/`create`/`update`), então não há conflito de `groupBy` com relacionamento de seções nesta consulta. Inserir o bloco de filtro por tags (`innerJoin` em `condition_tags`/`condition_tag_filter`, condição `condition_tag_filter.condition_id = condition.id AND condition_tag_filter.tag_id IN (:...tagIds)`, `groupBy('condition.id')`, `having(...)`) antes do `getManyAndCount()`, com a mesma bifurcação de `total`.
- Acesso Google: read-only (padrão, já aplicado a nível de controller).

---

**Status:** concluído

Alterações por módulo:
- `traits`: `FindTraitsQueryDto` (`app-api/src/modules/traits/dto/find-traits-query.dto.ts`) ganhou `tagIds?: string[]`; `TraitsService.findAllPaginated` (`app-api/src/modules/traits/traits.service.ts`) ganhou o bloco `hasTagFilter`/`innerJoin('trait_tags', 'trait_tag_filter', ...)`/`groupBy`/`having` e a bifurcação de `total` (`getCount()` vs `getRawMany().length`), convivendo normalmente com o `andWhere('trait.trait_type_id = ...')` já existente.
- `spells`: `FindSpellsQueryDto` (`app-api/src/modules/spells/dto/find-spells-query.dto.ts`) ganhou `tagIds?: string[]`; `SpellsService.findAllPaginated` (`app-api/src/modules/spells/spells.service.ts`) ganhou o mesmo bloco de filtro (`spell_tags`/`spell_tag_filter`) e bifurcação de `total`.
- `techniques`: `FindTechniquesQueryDto` (`app-api/src/modules/techniques/dto/find-techniques-query.dto.ts`) ganhou `tagIds?: string[]`; `TechniquesService.findAllPaginated` (`app-api/src/modules/techniques/techniques.service.ts`) ganhou o mesmo bloco de filtro (`technique_tags`/`technique_tag_filter`) e bifurcação de `total`.
- `skills`: `FindSkillsQueryDto` (`app-api/src/modules/skills/dto/find-skills-query.dto.ts`) ganhou `tagIds?: string[]`; `SkillsService.findAllPaginated` (`app-api/src/modules/skills/skills.service.ts`) ganhou o bloco de filtro (`skill_tags`/`skill_tag_filter`) inserido após o `andWhere` de `keyAttributeId`, mantendo o `leftJoin('skill.keyAttribute', 'keyAttribute')` existente. Confirmado por leitura que `groupBy('skill.id')` convive normalmente com esse join, já que somente `skill.id`/`skill.name` são selecionados e `id` é chave primária (dependência funcional aceita pelo Postgres) — nenhuma coluna de `keyAttribute` é agrupada ou selecionada.
- `conditions`: `FindConditionsQueryDto` (`app-api/src/modules/conditions/dto/find-conditions-query.dto.ts`) ganhou `tagIds?: string[]`; `ConditionsService.findAllPaginated` (`app-api/src/modules/conditions/conditions.service.ts`) ganhou o mesmo bloco de filtro (`condition_tags`/`condition_tag_filter`) e bifurcação de `total`.

Nenhuma entidade, migration, controller ou guard (`@GoogleAccess('read-only')`) foi alterado — apenas os 5 `find-*-query.dto.ts` e os 5 `*.service.ts` listados acima.

### 2. api-dev-doc
- Depende da etapa 1.
- Para cada um dos 5 módulos, garantir que o Swagger reflita o novo parâmetro `tagIds` na listagem: `@ApiPropertyOptional` já documenta o campo no DTO (não é necessário endpoint novo em `@ApiOperation`/`@ApiOkResponse`, pois a resposta paginada não muda de formato). Revisar se a descrição de cada `@ApiOperation({ summary: 'Lista ... com paginação e filtro' })` nos 5 controllers continua condizente (já menciona "filtro" de forma genérica, então provavelmente não precisa de alteração — mas conferir).
- Conferir se existe alguma documentação complementar (ex.: README de módulo, coleção Postman/Insomnia) que liste os filtros disponíveis por módulo e precise ser atualizada.

**Status:** concluído

Verificação realizada:
- `traits`, `spells`, `techniques`, `skills`, `conditions`: todos os 5 `find-*-query.dto.ts` já possuem `@ApiPropertyOptional({ type: [String], format: 'uuid', isArray: true, description: 'Filtro por tags...', example: [...] })` com descrição clara em pt-BR explicando semântica AND e notação querystring.
- Todos os 5 controllers possuem `@ApiTags`, `@ApiBearerAuth()`, `@ApiOperation({ summary: 'Lista ... com paginação e filtro' })`, `@ApiOkResponse` e `@ApiBadRequestResponse` adequados. Os sumários já mencionam "filtro".
- Não há READMEs, coleções Postman/Insomnia ou documentação complementar a atualizar.

### 3. api-dev-codereviewer
- Revisar os 5 módulos (`traits`, `spells`, `techniques`, `skills`, `conditions`):
  - Confirmar que o nome da tabela de junção e da coluna FK usados em cada `innerJoin` batem exatamente com o `@Entity(...)`/`@JoinColumn({ name: ... })` da respectiva `*-tag.entity.ts` (não authorial por convenção).
  - Confirmar que a bifurcação de cálculo de `total` (com/sem `hasTagFilter`) foi replicada corretamente em todos os 5 services, incluindo o comentário explicativo em pt-BR sobre a limitação do `getManyAndCount()` com `groupBy`/`having`.
  - Validar especificamente o caso de `skills` (join extra com `keyAttribute`) quanto a eventuais erros do Postgres relacionados a `GROUP BY` faltando colunas selecionadas.
  - Confirmar que `@GoogleAccess('read-only')` permanece intacto nos 5 controllers (nenhuma alteração de guard/decorator é esperada nesta tarefa).
  - Confirmar que as mensagens/descrições em pt-BR seguem o padrão do restante do projeto.

**Status:** concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificação realizada, arquivo por arquivo, para os 5 módulos (`traits`, `spells`,
`techniques`, `skills`, `conditions`):

- **Nome de tabela de junção / FK no `innerJoin`**: confirmado por leitura de cada
  `*-tag.entity.ts` que os nomes usados nos `innerJoin(...)` dos services batem
  exatamente com `@Entity(...)` e `@JoinColumn({ name: ... })`:
  - `TraitTag` → `@Entity('trait_tags')`, `@JoinColumn({ name: 'trait_id' })` ↔
    `traits.service.ts` usa `innerJoin('trait_tags', 'trait_tag_filter',
    'trait_tag_filter.trait_id = trait.id AND ...')`. Correto.
  - `SpellTag` → `@Entity('spell_tags')`, `@JoinColumn({ name: 'spell_id' })` ↔
    `spells.service.ts` usa `spell_tags`/`spell_tag_filter.spell_id`. Correto.
  - `TechniqueTag` → `@Entity('technique_tags')`, `@JoinColumn({ name: 'technique_id' })`
    ↔ `techniques.service.ts` usa `technique_tags`/`technique_tag_filter.technique_id`.
    Correto.
  - `SkillTag` → `@Entity('skill_tags')`, `@JoinColumn({ name: 'skill_id' })` ↔
    `skills.service.ts` usa `skill_tags`/`skill_tag_filter.skill_id`. Correto.
  - `ConditionTag` → `@Entity('condition_tags')`, `@JoinColumn({ name: 'condition_id' })`
    ↔ `conditions.service.ts` usa `condition_tags`/`condition_tag_filter.condition_id`.
    Correto.

- **Bifurcação de cálculo de `total`**: os 5 services replicam fielmente o padrão de
  `trainings.service.ts` — `hasTagFilter` calculado via `!!query.tagIds &&
  query.tagIds.length > 0`, dedupe com `[...new Set(query.tagIds)]`, `innerJoin` +
  `groupBy('<entidade>.id')` + `having('COUNT(DISTINCT ..._tag_filter.tag_id) =
  :tagCount', ...)`, e a bifurcação `total = hasTagFilter ?
  (await queryBuilder.clone().select('<entidade>.id').getRawMany()).length :
  await queryBuilder.clone().getCount()`, sempre precedida do comentário explicativo em
  pt-BR sobre a limitação do `getManyAndCount()` com `groupBy`/`having`. Presente e
  correto em `traits.service.ts`, `spells.service.ts`, `techniques.service.ts`,
  `skills.service.ts` e `conditions.service.ts`.

- **Caso especial `skills` (join extra com `keyAttribute`)**: confirmado que
  `SkillsService.findAllPaginated` mantém `.leftJoin('skill.keyAttribute',
  'keyAttribute')` e o filtro `andWhere('skill.keyAttribute = :keyAttributeId', ...)`
  intactos, com o bloco de filtro de tags inserido depois desses filtros e antes do
  cálculo de `total`/paginação, exatamente como especificado na task. O `groupBy`
  aplicado é apenas `groupBy('skill.id')`, sem incluir colunas de `keyAttribute`. Como
  nenhuma coluna de `keyAttribute` é selecionada (`select(['skill.id', 'skill.name'])`)
  e `skill.id` é a chave primária de `skill`, a regra de dependência funcional do
  Postgres permite esse `GROUP BY` sem exigir `keyAttribute.id` ou `skill.name` no
  agrupamento — não há risco de erro `column ... must appear in the GROUP BY clause`.
  O service inclusive documenta esse raciocínio em comentário pt-BR explícito
  (`skills.service.ts`, bloco antes do cálculo de `total`), o que facilita manutenção
  futura.

- **`@GoogleAccess('read-only')`**: confirmado intacto em todos os 5 controllers
  (`traits.controller.ts`, `spells.controller.ts`, `techniques.controller.ts`,
  `skills.controller.ts`, `conditions.controller.ts`), sempre acompanhado de
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` a nível de classe, sem nenhuma
  alteração de guard/decorator nesta tarefa.

- **Mensagens/descrições em pt-BR**: as `@ApiPropertyOptional({ description: ... })`
  do novo campo `tagIds` em cada `find-*-query.dto.ts` seguem o mesmo texto padrão
  (semântica AND + notação `tagIds[]=uuid1&tagIds[]=uuid2`), adaptado corretamente
  para "traços", "magias", "técnicas", "perícias" e "condições" em cada módulo,
  consistente com o padrão de `FindTrainingsQueryDto`. As validações
  (`@IsOptional() @IsArray() @IsUUID('4', { each: true })`) são idênticas nos 5 DTOs.

Arquivos revisados:
- `app-api/src/modules/traits/dto/find-traits-query.dto.ts`,
  `app-api/src/modules/traits/traits.service.ts`,
  `app-api/src/modules/traits/traits.controller.ts`,
  `app-api/src/modules/traits/entities/trait-tag.entity.ts`
- `app-api/src/modules/spells/dto/find-spells-query.dto.ts`,
  `app-api/src/modules/spells/spells.service.ts`,
  `app-api/src/modules/spells/spells.controller.ts`,
  `app-api/src/modules/spells/entities/spell-tag.entity.ts`
- `app-api/src/modules/techniques/dto/find-techniques-query.dto.ts`,
  `app-api/src/modules/techniques/techniques.service.ts`,
  `app-api/src/modules/techniques/techniques.controller.ts`,
  `app-api/src/modules/techniques/entities/technique-tag.entity.ts`
- `app-api/src/modules/skills/dto/find-skills-query.dto.ts`,
  `app-api/src/modules/skills/skills.service.ts`,
  `app-api/src/modules/skills/skills.controller.ts`,
  `app-api/src/modules/skills/entities/skill-tag.entity.ts`
- `app-api/src/modules/conditions/dto/find-conditions-query.dto.ts`,
  `app-api/src/modules/conditions/conditions.service.ts`,
  `app-api/src/modules/conditions/conditions.controller.ts`,
  `app-api/src/modules/conditions/entities/condition-tag.entity.ts`
