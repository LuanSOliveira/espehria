# Task API: Ajustes na aba Habilidades da Ficha (regra de Raça para Talentos + novo ponto de leitura paginado com elegibilidade)

## Contexto
Ver .claude/tasks/ficha-habilidades-ajustes/spec.md — decisões de investigação nº 1-10 e "Escopo
confirmado" (itens 1-9), especialmente decisões nº 1-7 (item 3, regra de Raça) e nº 8-10 (item 4,
novo ponto de leitura).

Continuação de `.claude/tasks/ficha-habilidades/` (aba HABILIDADES da ficha), cujo
`task-api.md` já existe e descreve a implementação atual (10 endpoints, `computeSheetAbilities`,
`evaluateAbilityRequirements`, `recomputeSheetAbilitySnapshots`) — usado abaixo como base de
investigação de código, não replanejado.

Achados confirmados por leitura direta de `app-api/src/modules/sheets/sheets.service.ts` e
`sheets.controller.ts` (estado atual, pós-revisão da demanda anterior):

- `evaluateAbilityRequirements` (`sheets.service.ts:617-644`) hoje recebe `item: { level,
  requirements }`, `sheet` e `presentIdsByBucket`, e é chamada em exatamente **7 pontos**: dentro de
  `computeSheetAbilities` via `toCard` (herdados, ~966-980) e `toExtraCard` (extras e slot,
  ~982-996), e em `addCharacteristicExtra` (~1949), `addTrainingExtra` (~2037), `addTalentExtra`
  (~2122), `fillTrainingSlot` (~2219) — confirma a contagem do spec.
- `findAccessibleById` (`sheets.service.ts:1357-1396`) já carrega `race: { category, characteristics,
  talents }` — `sheet.race?.talents` (ids dos talentos da Raça vinculada) já está disponível em toda
  função que recebe `sheet` obtido por esse método, sem query nova.
- Tags: `findTalentWithTagsById` (usada em `addTalentExtra`) já popula `talent.tags` (via
  `loadOrderedTagsForOwner`, entidades `Tag[]` com campo `name`); os `RawEntry`/itens extras
  montados em `computeSheetAbilities` já carregam `.tags` como `TagResponseDto[]` (também com
  `name`). Nenhum dos 6 pontos de chamada hoje ativos (fora do endpoint removido) precisa de uma
  query nova de tags.
- `checkAbilityRequirements` (service, `sheets.service.ts:1774-1916`) e o endpoint
  `POST /sheets/:id/abilities/requirement-checks` (controller, `sheets.controller.ts:392-420`) são o
  único ponto hoje sem tags carregadas — mas, por ser inteiramente removido nesta demanda (decisão nº
  10 do spec), essa lacuna desaparece junto com a remoção, sem necessidade de supri-la.
- `EntityLinksService.loadLinksForOwnersBatched` (`entity-links.service.ts:427-598`) já agrupa por
  `(linkType, ownerColumn)` executando no máximo uma query `IN (...)` por combinação — confirmado
  sem N+1, reaproveitado tanto pelo cálculo de herança quanto pela nova validação.
- `common/utils/ordered-tags.util.ts` expõe `loadOrderedTagsMap`/`loadOrderedTagsForOwner`, já usados
  em todo o módulo de fichas para carregar tags em lote — mesmo padrão a reaproveitar no novo ponto
  de leitura.
- `TalentsService.findAllPaginated` (`talents.service.ts:263-341`) é a referência direta do padrão de
  filtro name/level/tagIds com `groupBy`/`having` para contagem correta com filtro de tags — o mesmo
  padrão existe, quase idêntico, em `characteristics.service.ts`/`trainings.service.ts`. `SheetsService`
  já tem os 3 repositórios de catálogo (`characteristicsRepository`, `trainingsRepository`,
  `talentsRepository`) e seus repositórios de tag (`characteristicTagsRepository`,
  `trainingTagsRepository`, `talentTagsRepository`) injetados — nenhum repositório novo precisa ser
  adicionado a `SheetsModule`.
- `EntityReferenceInputDto`/`EntityReferenceResponseDto` já expõem `entityType`/`tags`/`level`;
  `Tag` entity (`tags/entities/tag.entity.ts`) tem campo `name`.

## Etapas

### 1. api-dev
Status: concluído (com uma pendência registrada abaixo — ver "Desvios")

Entidade: não aplicável (nenhuma entidade nova nem alterada), conforme previsto no plano.

Migration: não aplicável (nenhuma alteração de schema), conforme previsto no plano. `npm run
migration:run` **não** foi executado, por restrição explícita do usuário.

Rotas:
- `GET /sheets/:id/abilities/candidates` (nova) — `app-api/src/modules/sheets/sheets.controller.ts`
- `POST /sheets/:id/abilities/requirement-checks` (removida) — controller/service/DTOs excluídos
  conforme checklist do plano.

Arquivos criados:
- `app-api/src/modules/sheets/dto/find-sheet-ability-candidates-query.dto.ts`
- `app-api/src/modules/sheets/dto/sheet-ability-candidate-response.dto.ts`
- `app-api/src/modules/sheets/dto/paginated-sheet-ability-candidates-response.dto.ts`

Arquivos alterados:
- `app-api/src/modules/sheets/sheets.service.ts`: constante `RACE_TALENT_REQUIREMENT_TAG_NAME`;
  novo método privado `evaluateRaceTalentTagRule`; `evaluateAbilityRequirements` generalizado
  (`id`/`entityType`/`tags` adicionados ao parâmetro `item`, `raceTagRuleMet` incorporado por
  conjunção); os 7 call sites atualizados (`toCard`/`toExtraCard` dentro de
  `computeSheetAbilities`, `addCharacteristicExtra`, `addTrainingExtra`, `addTalentExtra`,
  `fillTrainingSlot`, e o novo `findAbilityCandidates`); método privado `bucketForEntityType`
  extraído (reaproveitando o antigo `bucketFor` local de `checkAbilityRequirements`); método
  `checkAbilityRequirements` e a interface `AbilityRequirementCheckResult` removidos; novo método
  `findAbilityCandidates` e as interfaces `SheetAbilityCandidateResult`/
  `PaginatedSheetAbilityCandidates` adicionados; import de `CheckAbilityRequirementsDto` removido,
  import de `FindSheetAbilityCandidatesQueryDto` adicionado.
- `app-api/src/modules/sheets/sheets.controller.ts`: método `checkAbilityRequirements` e a rota
  `POST :id/abilities/requirement-checks` removidos; novo método `findAbilityCandidates` na rota
  `GET :id/abilities/candidates` adicionado; imports de `CheckAbilityRequirementsDto` e
  `AbilityRequirementCheckResponseDto` removidos; imports de
  `FindSheetAbilityCandidatesQueryDto`/`PaginatedSheetAbilityCandidatesResponseDto`/
  `SheetAbilityCandidateResponseDto` adicionados.

Nenhuma alteração foi necessária em `sheets.module.ts` — todos os repositórios usados pelo novo
método (`characteristicsRepository`, `trainingsRepository`, `talentsRepository` e seus
repositórios de tag) já estavam injetados em `SheetsService`.

Desvios em relação ao plano:
- **Não foi possível excluir fisicamente** `app-api/src/modules/sheets/dto/check-ability-requirements.dto.ts`
  e `app-api/src/modules/sheets/dto/ability-requirement-check-response.dto.ts`, como pedido no
  checklist de remoção (item 10 da seção Controller do plano). O agente api-dev não possui, neste
  ambiente, uma ferramenta de exclusão de arquivos (apenas Read/Grep/Glob/Edit/Write/Skill — Write
  reescreve conteúdo mas não remove o arquivo do disco). Confirmado por leitura (`Grep` em todo
  `app-api/src`) que nenhum outro arquivo do código-fonte referencia mais
  `CheckAbilityRequirementsDto`, `AbilityRequirementCheckResponseDto`,
  `AbilityRequirementCheckResult` ou `checkAbilityRequirements` — os dois arquivos ficaram
  completamente órfãos (nenhum import, não registrados em `SheetsModule`), mas continuam
  fisicamente presentes no repositório. **Ação pendente**: excluir manualmente (ou via uma etapa
  com acesso a shell/Bash) os dois arquivos citados acima antes de considerar o checklist de
  remoção 100% concluído.
- Nenhum outro desvio: os 7 call sites, a assinatura de `evaluateAbilityRequirements`, o algoritmo
  de `findAbilityCandidates` (filtro antes de paginar, `onlyEligible` aplicado antes do total, uma
  query batched de `requirements` e uma de `tags` para todo o conjunto filtrado) e as mensagens de
  erro em pt-BR seguem exatamente o que foi especificado no plano.

#### Entidade
Não se aplica — nenhuma entidade nova nem alteração de entidade existente. A regra de tag "Raça" é
derivada em tempo de leitura a partir de dados já existentes (tags do Talento + `Race.talents`,
já carregados hoje), e o novo ponto de leitura não introduz nenhum dado persistido novo (requisito de
backend nº 6 do spec).

#### Migration
Necessária: **não**. Confirmado pelo spec (requisito nº 6) e pela investigação acima: nenhuma coluna,
tabela ou índice novo é necessário para nenhum dos dois itens.

#### Controller

**Item 3 — regra de requisito de Talento com tag "Raça" (spec, decisões nº 1-7, escopo 1-6)**

1. Nova constante nomeada em `sheets.service.ts`, no mesmo bloco de `ATTRIBUTE_TYPE_NAME`/
   `DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME`/`INITIAL_TRAINING_SLOT_COUNT`:
   `const RACE_TALENT_REQUIREMENT_TAG_NAME = 'Raça';`.

2. Generalizar `evaluateAbilityRequirements`: o parâmetro `item` passa a incluir `id` e `entityType`
   (`ReferenceableEntityType`) além de `level`/`requirements`, e um novo campo `tags: { name: string
   }[]` (tipo estrutural compatível tanto com `Tag[]` — `talent.tags` — quanto com
   `TagResponseDto[]` — itens montados em `computeSheetAbilities` — sem exigir conversão nos call
   sites). `sheet` continua sendo recebido como parâmetro (já é) — não é necessário um parâmetro
   adicional para o conjunto de talentos de Raça: a função lê `sheet.race?.talents` diretamente
   (já carregado, ver investigação acima).
   ```
   private evaluateAbilityRequirements(
     item: {
       id: string;
       entityType: ReferenceableEntityType;
       level: number;
       tags: { name: string }[];
       requirements: EntityReferenceResponseDto[];
     },
     sheet: Sheet,
     presentIdsByBucket: { trainings: Set<string>; talents: Set<string>; characteristics: Set<string> },
   ): boolean {
     const levelMet = sheet.level >= item.level;
     const requirementsMet = item.requirements.every(/* switch existente, inalterado */);
     const raceTagRuleMet = this.evaluateRaceTalentTagRule(item, sheet);
     return levelMet && requirementsMet && raceTagRuleMet;
   }
   ```
   Nova função privada auxiliar (mantém `evaluateAbilityRequirements` legível, isola a regra nova):
   ```
   private evaluateRaceTalentTagRule(
     item: { id: string; entityType: ReferenceableEntityType; tags: { name: string }[] },
     sheet: Sheet,
   ): boolean {
     if (item.entityType !== ReferenceableEntityType.TALENT) {
       return true; // regra não se aplica a Característica/Treinamento (escopo item 6)
     }
     const normalizedTagName = (name: string) => name.trim().toLowerCase();
     const hasRaceTag = item.tags.some(
       (tag) => normalizedTagName(tag.name) === normalizedTagName(RACE_TALENT_REQUIREMENT_TAG_NAME),
     );
     if (!hasRaceTag) {
       return true;
     }
     const raceTalentIds = new Set((sheet.race?.talents ?? []).map((talent) => talent.id));
     return raceTalentIds.has(item.id); // ficha sem raça => conjunto vazio => sempre false (escopo item 2)
   }
   ```
   Normalização (`trim()` + `toLowerCase()` em ambos os lados) segue exatamente o padrão de
   `normalizedTitle` em `recomputeKnowledges` (`sheets.service.ts:484`), conforme decisão nº 6 do
   spec.

3. Atualizar os 7 call sites para repassar `id`/`entityType`/`tags`:
   - `toCard`/`toExtraCard` dentro de `computeSheetAbilities`: já recebem `entityType` como
     parâmetro (usado hoje para `requirementsFor`) e o item já carrega `.id`/`.tags` — só é preciso
     incluir esses dois campos no objeto passado a `evaluateAbilityRequirements`.
   - `addCharacteristicExtra`/`addTrainingExtra`/`fillTrainingSlot`: passar
     `entityType: ReferenceableEntityType.CHARACTERISTIC`/`.TRAINING` e `tags:
     characteristic.tags`/`training.tags` (já carregadas por `findCharacteristicWithTagsById`/
     `findTrainingWithTagsById`) e `id: characteristic.id`/`training.id` — a regra é sempre `true`
     para esses dois tipos (via `evaluateRaceTalentTagRule`), mas o call site precisa fornecer os
     campos para manter a assinatura única.
   - `addTalentExtra`: passar `entityType: ReferenceableEntityType.TALENT`, `tags: talent.tags`
     (já carregadas por `findTalentWithTagsById`) e `id: talent.id` — este é o call site onde a
     regra efetivamente pode bloquear a adição.
   - Novo método de listagem de candidatos (item 4 abaixo): cada candidato avaliado já carrega
     `tags`/`entityType`/`id` no mesmo formato.

4. A regra se aplica a Talentos herdados (via Raça, Biografia ou item vinculado com
   `additionalAbilities`) automaticamente, por já estar embutida em `toCard`/`toExtraCard` dentro de
   `computeSheetAbilities` — nenhuma lógica adicional de "herança" é necessária (decisão nº 3 e
   escopo item 4 do spec: mesmo mecanismo único de requisitos já usado para level/`requirements`).

5. Nenhuma alteração de rota, DTO de entrada/saída ou mensagem de erro é necessária para o item 3 —
   o efeito já é refletido no campo `requirementsMet`, já exposto por `GET /sheets/:id/abilities` e
   (após o item 4 abaixo) pelo novo ponto de leitura de candidatos.

**Item 4 — novo ponto de leitura paginado com elegibilidade avaliada no servidor (spec, decisões nº
8-10, escopo 7-9)**

6. Novo endpoint: **`GET /sheets/:id/abilities/candidates`**, em `SheetsController`, sob
   `@UseGuards(JwtAuthGuard)` (já aplicado a nível de classe) + `@CurrentUser()` — mesmo padrão dos
   demais endpoints de `/sheets/:id/*`, sem `@GoogleAccess` (não é um CRUD de catálogo compartilhado;
   segue o padrão já usado por `GET /sheets/:id/abilities`). Retorna
   `PaginatedSheetAbilityCandidatesResponseDto`.

   Query DTO novo, `FindSheetAbilityCandidatesQueryDto`
   (`app-api/src/modules/sheets/dto/find-sheet-ability-candidates-query.dto.ts`):
   - `entityType: ReferenceableEntityType` (obrigatório, `@IsEnum(ReferenceableEntityType)`) —
     restrito em tempo de execução a `training | talent | characteristic` no service (400 com a
     mesma mensagem já usada em `checkAbilityRequirements`: "Apenas itens do tipo treinamento,
     talento ou característica podem ser avaliados neste endpoint.", reaproveitada antes de ser
     removida do método antigo).
   - `name?: string` (`@IsOptional() @IsString()`), `level?: number` (`@IsOptional() @Type(() =>
     Number) @IsInt() @Min(1)`), `tagIds?: string[]` (`@IsOptional() @IsArray() @IsUUID('4', {each:
     true})`) — mesmos decorators/mensagens de `FindTalentsQueryDto`.
   - `onlyEligible?: boolean` (`@IsOptional() @Type(() => Boolean) @IsBoolean()`) — novo parâmetro,
     equivalente ao estado do checkbox do modal (decisão nº 9); ausente/`false` = comportamento atual
     (lista todos os itens que atendem aos demais filtros).
   - `page?: number`/`perPage?: number` — mesmos decorators de `FindTalentsQueryDto`.

7. Novo método de serviço `findAbilityCandidates(sheetId, query, currentUser):
   Promise<{ data: SheetAbilityCandidateResult[]; total: number; page: number; perPage: number }>`
   em `SheetsService`. Algoritmo (implementa a decisão nº 9 — elegibilidade avaliada **antes** da
   paginação):
   1. `findAccessibleById` (404 se não encontrada/não pertence ao usuário — mesma mensagem padrão).
   2. Validar `query.entityType` contra o conjunto permitido (400 se fora de
      training/talent/characteristic).
   3. Resolver, via `switch(query.entityType)` (mesmo estilo de `repositoryFor`/`ownerColumnFor` em
      `EntityLinksService`, ou dos dicionários já existentes em `sheets.service.ts` como
      `BUCKET_OWNER_COLUMN`), o repositório de catálogo (`characteristicsRepository`/
      `trainingsRepository`/`talentsRepository`), o repositório de tag correspondente
      (`characteristicTagsRepository`/`trainingTagsRepository`/`talentTagsRepository`), o nome da
      relação de dono para `loadOrderedTagsMap` (`'characteristic'`/`'training'`/`'talent'`) e a
      chave de bucket (`SheetAbilityBucketKey`).
   4. Montar a query de filtro sobre o repositório de catálogo resolvido, reaproveitando
      **exatamente** o padrão já usado em `TalentsService.findAllPaginated`/
      `TrainingsService.findAllPaginated`/`CharacteristicsService.findAllPaginated` (`name ILIKE`,
      `level =`, `tagIds` via `innerJoin` na tabela de junção de tag + `groupBy`/`having
      COUNT(DISTINCT tag_id) = tagCount`) — implementado como um `switch`/bloco por `entityType`
      dentro do novo método (mesma duplicação de 3 blocos já existente entre os 3 módulos de
      catálogo hoje, conforme "Pontos de atenção" do spec; não é extraído um helper compartilhado
      nesta etapa, para não introduzir uma refatoração cross-módulo fora do escopo pedido).
   5. **Diferença deliberada em relação ao padrão dos 3 módulos**: a query aqui **não** aplica
      `skip`/`take` neste ponto — busca **todos** os ids/nomes/níveis que atendem a
      `name`/`level`/`tagIds` (sem paginar ainda), pois a elegibilidade (que ainda depende de
      `onlyEligible`) só pode ser calculada depois, e a paginação deve refletir o total já filtrado
      por elegibilidade (decisão nº 9).
   6. Carregar `slots`/`extras` da ficha (`loadSlotsWithTags`/`loadExtrasWithTags`, já existentes) e
      chamar `computeSheetAbilities(sheet, slots, extras)` para obter `presentIdsByBucket` — mesma
      função já usada por `getAbilities`/`checkAbilityRequirements`, garante que "já presente" para
      os candidatos considere herdados + slot + extras, exatamente como hoje.
   7. Carregar, em lote, `requirements` de todos os candidatos filtrados via
      `entityLinksService.loadLinksForOwnersBatched([...candidatos], [EntityLinkType.REQUIREMENT])`
      — uma única query `IN (...)` (todos os candidatos são do mesmo `entityType`, portanto uma só
      combinação linkType/ownerColumn).
   8. Carregar, em lote, `tags` de todos os candidatos filtrados via `loadOrderedTagsMap` sobre o
      repositório de tag resolvido no passo 3 — uma única query, reaproveitada tanto para exibição
      (campo `tags` do card) quanto para a regra de tag "Raça" quando `entityType === TALENT`
      (decisão nº 1/nº 5 do spec sobre generalizar `evaluateAbilityRequirements`). Carregar para o
      conjunto completo filtrado (não só a página) é necessário porque a regra de Raça pode afetar
      quais itens são elegíveis em qualquer posição da lista, não só na página atual — custo aceito
      explicitamente pelo spec ("Pontos de atenção": catálogos de referência, tipicamente pequenos).
   9. Para cada candidato, computar `alreadyPresent = presentIdsByBucket[bucket].has(candidato.id)` e
      `requirementsMet = evaluateAbilityRequirements({ id, entityType: query.entityType, level,
      tags, requirements }, sheet, presentIdsByBucket)`.
   10. Se `query.onlyEligible === true`, filtrar a lista mantendo apenas `requirementsMet === true`
       (decisão nº 8: filtro não considera `alreadyPresent` — um item já presente que atenda aos
       requisitos continua na lista filtrada).
   11. `total = <tamanho da lista já filtrada>`; aplicar `skip`/`take` **em memória** sobre essa
       lista (`page`/`perPage` com defaults de `common/variables/pagination.ts`, mesmo padrão dos
       demais endpoints paginados).
   12. Retornar `{ data, total, page, perPage }` — `data` já contendo `id`, `name`, `level`, `tags`,
       `alreadyPresent`, `requirementsMet` por item da página (nenhuma segunda chamada necessária no
       frontend, conforme decisão nº 9/nº 10).

8. Controller: método `findAbilityCandidates` monta `PaginatedSheetAbilityCandidatesResponseDto`
   computando `totalPages: Math.ceil(total / perPage)` no controller (mesmo padrão de `findAll` para
   `PaginatedSheetsResponseDto`, `sheets.controller.ts:139-162`).

9. **Novos DTOs** (em `app-api/src/modules/sheets/dto/`):
   - `find-sheet-ability-candidates-query.dto.ts` → `FindSheetAbilityCandidatesQueryDto` (descrito
     acima).
   - `sheet-ability-candidate-response.dto.ts` → `SheetAbilityCandidateResponseDto { id, name,
     level, tags: TagResponseDto[], alreadyPresent: boolean, requirementsMet: boolean }`, com
     `static fromRaw(raw): SheetAbilityCandidateResponseDto` (mesmo padrão de
     `SheetAbilityCardResponseDto`/`AbilityRequirementCheckResponseDto`).
   - `paginated-sheet-ability-candidates-response.dto.ts` →
     `PaginatedSheetAbilityCandidatesResponseDto { data: SheetAbilityCandidateResponseDto[], total,
     page, perPage, totalPages }` (mesmo padrão de `PaginatedSheetsResponseDto`).

10. **Remoção de `POST /sheets/:id/abilities/requirement-checks`** (decisão nº 10 do spec — sem
    consumidor remanescente após a migração do frontend para o novo endpoint):
    - `sheets.controller.ts`: remover o método `checkAbilityRequirements` e o decorator `@Post
      (':id/abilities/requirement-checks')` (linhas ~392-420), e os imports agora não usados
      (`CheckAbilityRequirementsDto`, `AbilityRequirementCheckResponseDto`).
    - `sheets.service.ts`: remover o método `checkAbilityRequirements` (linhas ~1774-1916) e a
      interface `AbilityRequirementCheckResult` (linhas ~175-180), e o import agora não usado de
      `CheckAbilityRequirementsDto`. Confirmar que nenhum outro método do service depende dessas
      declarações antes de remover.
    - Excluir os arquivos `app-api/src/modules/sheets/dto/check-ability-requirements.dto.ts` e
      `app-api/src/modules/sheets/dto/ability-requirement-check-response.dto.ts` por completo — sem
      substituto direto (o formato de resposta do novo endpoint é
      `SheetAbilityCandidateResponseDto`, não um DTO equivalente).
    - Nenhuma migration nem alteração de módulo é necessária para esta remoção (DTOs não são
      registrados em `SheetsModule`).

11. Mensagens de erro (404/400/409, quando aplicável) em pt-BR, reaproveitando os textos já
    existentes no arquivo (ex.: "Ficha não encontrada ou não pertence ao usuário.", "Apenas itens do
    tipo treinamento, talento ou característica podem ser avaliados neste endpoint.").

**Acesso Google**: não aplicável no sentido do template padrão de CRUD de catálogo — o novo endpoint
`GET /sheets/:id/abilities/candidates` segue exatamente o padrão já usado por todos os demais
endpoints de `/sheets/:id/*` (`GET /sheets/:id/abilities`, `POST .../extras` etc.): apenas
`@UseGuards(JwtAuthGuard)` + `@CurrentUser()`, sem `@GoogleAccess`/`GoogleAccessGuard`, com a
restrição de propriedade (usuários `provider: 'google'` só acessam fichas próprias) garantida por
`isRestrictedToOwnSheets` dentro de `findAccessibleById`. Nenhuma regra de permissão nova (requisito
de backend nº 7 do spec).

**Pontos de atenção para o api-dev**:
- Ao remover `checkAbilityRequirements`, verificar se `bucketFor`/helpers locais definidos dentro
  desse método (ex.: mapeamento `entityType → SheetAbilityBucketKey`) são reaproveitáveis pelo novo
  método (`findAbilityCandidates` precisa do mesmo mapeamento) antes de duplicá-los — extrair como
  função privada única se fizer sentido.
- Custo de avaliar requisitos (incluindo tags para a regra de Raça) para todo o conjunto de
  candidatos filtrado por nome/level/tags antes de paginar é maior que o padrão atual dos 3 módulos
  de catálogo — aceito explicitamente pelo spec dado o tamanho típico desses catálogos; não otimizar
  além do batching já descrito (uma query de `requirements`, uma de `tags`) nesta etapa.
- Confirmar, ao implementar, que `computeSheetAbilities` não precisa de nenhum ajuste para este novo
  uso — ele já retorna `presentIdsByBucket` pronto para uso, independente de quais candidatos estão
  sendo avaliados.

### 2. api-dev-doc
Status: concluído

Arquivos documentados:
- `app-api/src/modules/sheets/sheets.controller.ts`: endpoint `GET :id/abilities/candidates` com
  `@ApiOperation`, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiBadRequestResponse` completos.
  Nenhuma referência ao endpoint removido `POST :id/abilities/requirement-checks`.
- `app-api/src/modules/sheets/dto/find-sheet-ability-candidates-query.dto.ts`: Todos os campos
  (`entityType`, `name`, `level`, `tagIds`, `onlyEligible`, `page`, `perPage`) com `@ApiProperty`/
  `@ApiPropertyOptional` + descrições e exemplos seguindo o padrão de `FindTalentsQueryDto`.
- `app-api/src/modules/sheets/dto/sheet-ability-candidate-response.dto.ts`: Todos os campos
  (`id`, `name`, `level`, `tags`, `alreadyPresent`, `requirementsMet`) com `@ApiProperty` +
  descrições. Campo `requirementsMet` menciona explicitamente a regra de tag "Raça": "Indica se
  a ficha atende aos requisitos (nível, requirements e, para Talento, a regra de tag "Raça")
  deste item".
- `app-api/src/modules/sheets/dto/paginated-sheet-ability-candidates-response.dto.ts`: Todos os
  campos (`data`, `total`, `page`, `perPage`, `totalPages`) com `@ApiProperty` + descrições.

Documentação completa com semântica da regra de Raça: O parâmetro `onlyEligible` do DTO de query
menciona a regra de tag "Raça" em sua descrição; o campo `requirementsMet` do DTO de resposta
menciona a aplicação da regra a Talentos. Consistente com o padrão pt-BR do projeto e com a @ApiTags('sheets').
Nenhuma referência remanescente ao endpoint removido.

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - `evaluateRaceTalentTagRule`: a regra só se aplica a `entityType === TALENT` (Característica/
    Treinamento sempre `true`); normalização `trim()` + `toLowerCase()` em ambos os lados da
    comparação de nome de tag; ficha sem Raça vinculada produz conjunto vazio e portanto sempre
    `false` para Talentos com tag "Raça".
  - Todos os 7 call sites de `evaluateAbilityRequirements` repassando corretamente `id`/`entityType`/
    `tags` — nenhum deles quebrado pela mudança de assinatura, incluindo os 6 pontos que já existiam
    antes desta demanda.
  - A regra de tag "Raça" se refletindo também em Talentos herdados (via `toCard` dentro de
    `computeSheetAbilities`), não só em extras — sem necessidade de lógica adicional além da já
    existente para level/`requirements`.
  - `GET /sheets/:id/abilities/candidates`: elegibilidade (`alreadyPresent`/`requirementsMet`)
    calculada para **todo** o conjunto filtrado por nome/level/tags antes de aplicar
    `skip`/`take`, com `total` refletindo exatamente esse conjunto (já considerando
    `onlyEligible` quando ativo) — nenhuma página vazia nem contagem desatualizada.
  - Ausência de N+1: uma query de `requirements` (`loadLinksForOwnersBatched`) e uma de `tags`
    (`loadOrderedTagsMap`) para todo o conjunto de candidatos filtrado, não uma por candidato.
  - `POST /sheets/:id/abilities/requirement-checks` totalmente removido: controller, service,
    interface `AbilityRequirementCheckResult`, e os dois arquivos de DTO
    (`check-ability-requirements.dto.ts`, `ability-requirement-check-response.dto.ts`) — nenhuma
    referência morta restante (imports não usados, rota ainda documentada no Swagger, etc.).
  - Nenhuma migration foi criada (confirmar que nenhuma alteração de schema foi introduzida).
  - Mensagens de erro em pt-BR consistentes com o padrão já usado no arquivo.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/sheets/sheets.service.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`,
`app-api/src/modules/sheets/sheets.module.ts`,
`app-api/src/modules/sheets/dto/find-sheet-ability-candidates-query.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-ability-candidate-response.dto.ts`,
`app-api/src/modules/sheets/dto/paginated-sheet-ability-candidates-response.dto.ts`.

Pontos verificados e confirmados corretos:

- **`evaluateRaceTalentTagRule`** (`sheets.service.ts:627-651`): retorna `true` incondicionalmente
  quando `item.entityType !== ReferenceableEntityType.TALENT` (Característica/Treinamento nunca são
  bloqueados por esta regra — escopo item 6); normalização `trim()` + `toLowerCase()` aplicada em
  ambos os lados da comparação do nome da tag, igual ao padrão de `normalizedTitle` em
  `recomputeKnowledges` (`sheets.service.ts:494`); `sheet.race?.talents ?? []` produz conjunto vazio
  quando a ficha não tem Raça vinculada, portanto todo Talento com tag "Raça" fica sempre
  `false` nesse caso (escopo item 2); combinada por conjunção (`levelMet && requirementsMet &&
  raceTagRuleMet`) em `evaluateAbilityRequirements` (`sheets.service.ts:694-695`), conforme escopo
  item 3.
- **7 call sites de `evaluateAbilityRequirements`** conferidos individualmente — todos repassam
  `id`/`entityType`/`tags`/`requirements` corretos e não vazios: `toCard`/`toExtraCard` dentro de
  `computeSheetAbilities` (`sheets.service.ts:1015-1057`), `addCharacteristicExtra` (linha ~2116,
  `entityType: CHARACTERISTIC`, `tags: characteristic.tags`), `addTrainingExtra` (linha ~2207,
  `entityType: TRAINING`, `tags: training.tags`), `addTalentExtra` (linha ~2295, `entityType:
  TALENT`, `tags: talent.tags`), `fillTrainingSlot` (linha ~2395, `entityType: TRAINING`, `tags:
  training.tags`) e o novo `findAbilityCandidates` (linha ~2051, `entityType: query.entityType`,
  `tags` vindas de `loadOrderedTagsMap` em lote). Nenhum call site passa `tags: []`/`entityType`
  incorreto por engano.
- **Talentos herdados via `additionalAbilities`**: confirmado por leitura de
  `EntityLinksService.loadLinksForOwnersBatched` (`entity-links.service.ts:508-576`) que
  `link.targetTalent.tags` é populado em lote (`loadOrderedTagsMap` sobre `talentTagsRepository`)
  antes de `EntityReferenceResponseDto.fromResolved` montar o `ability.tags` consumido por
  `toCard`/`toExtraCard` — a regra de Raça é avaliada corretamente também para talentos herdados
  (via Raça, Biografia, ou item vinculado com Habilidades Adicionais), sem lógica adicional, como
  descrito no plano (escopo item 4).
- **`GET /sheets/:id/abilities/candidates`** (`sheets.service.ts:1858-2083`): `findAccessibleById`
  chamado antes de qualquer outra operação (ownership/IDOR ok); `entityType` validado contra
  `training|talent|characteristic` com `BadRequestException` em pt-BR; a query de filtro
  (nome/level/tags, com `innerJoin`+`groupBy`/`having` para contagem correta de tags, mesmo padrão
  de `TalentsService.findAllPaginated`) roda sem `skip`/`take`; `alreadyPresent`/`requirementsMet`
  são calculados para **todo** o conjunto filtrado antes de `onlyEligible` e antes de `total =
  filtered.length`; `skip`/`take` aplicados em memória (`filtered.slice(...)`) somente depois —
  exatamente a ordem exigida pela decisão nº 9 do spec, evitando o bug de paginação que a demanda
  visava corrigir.
- **Ausência de N+1**: uma única chamada a `entityLinksService.loadLinksForOwnersBatched` (todos os
  candidatos filtrados, mesmo `entityType`, portanto uma única query `IN (...)`) e uma única chamada
  a `loadOrderedTagsMap` para tags de todos os candidatos — confirmado, nenhuma consulta por
  candidato.
- **Remoção do endpoint antigo**: `grep` em `app-api/src` por `CheckAbilityRequirementsDto`,
  `AbilityRequirementCheckResponseDto`, `AbilityRequirementCheckResult`, `checkAbilityRequirements` e
  `requirement-checks` não retorna nenhuma referência viva fora dos dois arquivos DTO órfãos já
  documentados como pendência conhecida (`check-ability-requirements.dto.ts`,
  `ability-requirement-check-response.dto.ts` — confirmados sem import externo e não registrados em
  `SheetsModule`, não quebram a compilação). Controller e service não contêm mais o método, a rota
  `POST :id/abilities/requirement-checks`, nem a interface `AbilityRequirementCheckResult`.
- **`sheets.module.ts`**: nenhum repositório novo foi necessário; todos os repositórios usados por
  `findAbilityCandidates` já estavam registrados; nenhuma referência a código removido.
- **Migration**: nenhuma migration nova foi criada; `src/database/migrations/` contém apenas
  migrations pré-existentes de Raça, não relacionadas a esta demanda — consistente com o requisito
  nº 6 do spec (nenhuma alteração de schema).
- **DTOs**: `FindSheetAbilityCandidatesQueryDto` usa exatamente os mesmos decorators/mensagens de
  `FindTalentsQueryDto` (`@IsInt`/`@Min` com mensagens em pt-BR, `@IsUUID('4', {each:true})` para
  `tagIds`), mais `onlyEligible` (`@Type(() => Boolean) @IsBoolean()`) documentado com
  `@ApiPropertyOptional`. `SheetAbilityCandidateResponseDto`/`PaginatedSheetAbilityCandidatesResponseDto`
  seguem o padrão `fromRaw`/`Paginated<X>ResponseDto` com `totalPages` computado no controller
  (`Math.ceil(total / perPage)`), igual a `findAll` (`sheets.controller.ts:156-162`). Nenhum campo
  sensível exposto — `SheetAbilityCandidateResponseDto` expõe apenas `id`/`name`/`level`/`tags`/
  `alreadyPresent`/`requirementsMet`.
- **Acesso Google**: controller mantém apenas `@UseGuards(JwtAuthGuard)` a nível de classe +
  `@CurrentUser()` no novo endpoint, sem `@GoogleAccess`, consistente com todos os demais endpoints
  de `/sheets/:id/*` já existentes (nenhum deles usa `@GoogleAccess`) — ownership restrita a usuários
  Google garantida por `isRestrictedToOwnSheets` dentro de `findAccessibleById`.
- **Documentação Swagger** (etapa `api-dev-doc`): `@ApiOperation`/`@ApiOkResponse`/
  `@ApiNotFoundResponse`/`@ApiBadRequestResponse` presentes e coerentes com o comportamento real do
  endpoint; `@ApiProperty`/`@ApiPropertyOptional` presentes em todos os campos dos 3 DTOs novos, com
  menção explícita à regra de tag "Raça" onde relevante (`onlyEligible`, `requirementsMet`); nenhuma
  referência remanescente ao endpoint removido em nenhum decorator Swagger.
- **Mensagens de erro**: todas em pt-BR e reaproveitadas do padrão já existente no arquivo ("Ficha
  não encontrada ou não pertence ao usuário.", "Apenas itens do tipo treinamento, talento ou
  característica podem ser avaliados neste endpoint.").