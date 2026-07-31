# Task API: Aprimorado de / Requisitos (Treinamentos, Talentos, Técnicas, Magias)

## Contexto
Ver .claude/tasks/improved-from-requirements/spec.md

O spec deixou explicitamente em aberto, para esta etapa de planejamento, a escolha do
modelo de dados que sustenta as referências cruzadas entre as 4 entidades (`Training`,
`Talent`, `Technique`, `Spell`) nos campos `improvedFrom` e `requirements`. Essa decisão
é fechada abaixo, na seção "Decisão de modelagem" da etapa 1, e deve ser seguida à risca
pelo `api-dev` — não é uma sugestão em aberto.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/entity-links/entities/entity-link.entity.ts`
- Migration: `app-api/src/database/migrations/1784306060000-CreateEntityLinks.ts`
- Rotas: `POST /trainings`, `GET /trainings`, `GET /trainings/:id`, `PUT /trainings/:id`, `DELETE /trainings/:id`, `POST /talents`, `GET /talents`, `GET /talents/:id`, `PUT /talents/:id`, `DELETE /talents/:id`, `POST /techniques`, `GET /techniques`, `GET /techniques/:id`, `PUT /techniques/:id`, `DELETE /techniques/:id`, `POST /spells`, `GET /spells`, `GET /spells/:id`, `PUT /spells/:id`, `DELETE /spells/:id` (todas já existentes; contrato de `POST`/`GET :id`/`PUT` alterado para incluir `improvedFrom`/`requirements`, `GET` listagem e `DELETE` sem alteração de contrato)
- Arquivos:
  - `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`
  - `app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`
  - `app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`
  - `app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`
  - `app-api/src/modules/entity-links/entity-links.service.ts`
  - `app-api/src/modules/entity-links/entity-links.module.ts`
  - `app-api/src/modules/trainings/dto/create-training.dto.ts`
  - `app-api/src/modules/trainings/dto/training-response.dto.ts`
  - `app-api/src/modules/trainings/trainings.service.ts`
  - `app-api/src/modules/trainings/trainings.controller.ts`
  - `app-api/src/modules/trainings/trainings.module.ts`
  - `app-api/src/modules/talents/dto/create-talent.dto.ts`
  - `app-api/src/modules/talents/dto/talent-response.dto.ts`
  - `app-api/src/modules/talents/talents.service.ts`
  - `app-api/src/modules/talents/talents.controller.ts`
  - `app-api/src/modules/talents/talents.module.ts`
  - `app-api/src/modules/techniques/dto/create-technique.dto.ts`
  - `app-api/src/modules/techniques/dto/technique-response.dto.ts`
  - `app-api/src/modules/techniques/techniques.service.ts`
  - `app-api/src/modules/techniques/techniques.controller.ts`
  - `app-api/src/modules/techniques/techniques.module.ts`
  - `app-api/src/modules/spells/dto/create-spell.dto.ts`
  - `app-api/src/modules/spells/dto/spell-response.dto.ts`
  - `app-api/src/modules/spells/spells.service.ts`
  - `app-api/src/modules/spells/spells.controller.ts`
  - `app-api/src/modules/spells/spells.module.ts`

#### Decisão de modelagem (fechada nesta etapa de planejamento)

Modelo escolhido: **tabela de junção dedicada única, com colunas de chave estrangeira
anuláveis por tipo de entidade ("exclusive arc" / polimorfismo via FK nula), com
`ON DELETE CASCADE` real no banco em todas as colunas.**

Justificativa frente aos critérios do spec (seção "Requisitos para a etapa de
planejamento do backend"):

- **Critério 1 (referência cruzada entre as 4 entidades, nos 2 campos):** uma única
  tabela `entity_links` guarda tanto o lado "dono" da relação (o registro que possui a
  lista `improvedFrom`/`requirements`) quanto o lado "alvo" (o item referenciado),
  cada lado podendo ser qualquer uma das 4 entidades. Isso cobre as 16 combinações
  possíveis (dono × alvo) e os 2 campos (`improvedFrom`/`requirements`) com uma
  modelagem só.
- **Critério 2 (cascata real de exclusão):** o spec já identificou o trade-off central —
  coluna polimórfica pura (`targetType`+`targetId` sem FK) não permite `ON DELETE
  CASCADE` de verdade, exigindo limpeza manual na aplicação. A alternativa escolhida usa
  uma coluna de FK anulável por entidade possível (4 colunas no lado "dono", 4 colunas
  no lado "alvo"), cada uma com `onDelete: 'CASCADE'` de fato no banco. Isso significa
  que a exclusão de qualquer treinamento/talento/técnica/magia (dono ou alvo) apaga
  automaticamente as linhas de `entity_links` correspondentes, sem exigir nenhuma
  lógica de limpeza manual em `remove()` das 4 entidades — a integridade referencial
  fica garantida pelo próprio Postgres, como pedido pelo spec.
- **Critério 3 (validações de bloqueio):** a resolução dos alvos (existência) e as
  regras de autorreferência/duplicidade/exclusividade entre listas continuam sendo
  responsabilidade da camada de aplicação (não são coisas que o modelo de dados sozinho
  resolveria de forma completa e com boas mensagens em pt-BR) — ver detalhamento do
  serviço abaixo.
- **Critério 4 (leitura com `id`/`name`/`entityType` minúsculo):** a tabela guarda
  apenas os relacionamentos (FKs); o serviço compartilhado resolve, para cada linha, o
  nome do item apontado e monta a resposta com o mesmo formato e os mesmos valores
  minúsculos (`training`, `talent`, `technique`, `spell`) já usados pelo
  `LinkableEntityType` do módulo `search`.
- **Critério 5 (formato de escrita simétrico):** o formato de escrita (array de
  `{ entityType, id }`) mapeia diretamente para "em qual das 4 colunas de FK gravar o
  id", tanto para `improvedFrom` quanto para `requirements` — simétrico entre os dois
  campos e entre as 4 entidades donas.
- **Critério 6 (reaproveitar listagens paginadas existentes):** essa decisão não cria
  nenhum endpoint novo de busca; os endpoints `GET /trainings`, `GET /talents`,
  `GET /techniques`, `GET /spells` já existentes continuam sendo os únicos usados para
  alimentar o modal de seleção do frontend.

Alternativa descartada: tabela(s) com coluna polimórfica pura (`target_type` +
`target_id`, sem FK de banco) — descartada por não satisfazer o critério 2 (exigiria
"garbage collection" manual das referências a cada exclusão, com risco de referências
órfãs em caso de falha/esquecimento).

#### Entidade

**Nova entidade de junção (não é uma das 4 entidades de domínio):**

- Entidade: `EntityLink` (tabela `entity_links`), em novo módulo `entity-links`
  (`src/modules/entity-links/`), estendendo `BaseEntity` (dá `id`, `createdAt`,
  `updatedAt`).
- Campos:
  - `linkType` (enum `EntityLinkType`: `IMPROVED_FROM = 'improved_from'`,
    `REQUIREMENT = 'requirement'`) — coluna `link_type`, obrigatória.
  - Lado "dono" (exatamente uma das 4 colunas abaixo preenchida por linha):
    `ownerTraining` (`ManyToOne(() => Training)`, nullable, `onDelete: 'CASCADE'`,
    `@JoinColumn({ name: 'owner_training_id' })`), `ownerTalent` (`owner_talent_id`),
    `ownerTechnique` (`owner_technique_id`), `ownerSpell` (`owner_spell_id`) — mesmo
    padrão para as 4.
  - Lado "alvo" (exatamente uma das 4 colunas abaixo preenchida por linha):
    `targetTraining` (`target_training_id`), `targetTalent` (`target_talent_id`),
    `targetTechnique` (`target_technique_id`), `targetSpell` (`target_spell_id`) —
    mesmo padrão, todas `ManyToOne` nullable com `onDelete: 'CASCADE'`.
- Constraints a declarar na própria entidade (decorators do TypeORM):
  - `@Check('CK_entity_links_owner_exclusive', 'num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id) = 1')`
    — garante exatamente um lado "dono" preenchido.
  - `@Check('CK_entity_links_target_exclusive', 'num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id) = 1')`
    — garante exatamente um lado "alvo" preenchido.
  - `@Unique(['linkType', 'ownerTraining', 'ownerTalent', 'ownerTechnique', 'ownerSpell', 'targetTraining', 'targetTalent', 'targetTechnique', 'targetSpell'])`
    — impede duplicidade da mesma combinação (dono, alvo, tipo de lista) a nível de
    banco, reforçando a regra 3 do spec (mesmo com a validação já feita na aplicação).
  - Índices adicionais recomendados (podem ser adicionados na migration, não
    necessariamente como `@Index` na entidade): um índice composto por
    `(link_type, owner_training_id)`, `(link_type, owner_talent_id)`,
    `(link_type, owner_technique_id)`, `(link_type, owner_spell_id)` — usados na
    consulta "carregar todas as referências de saída de um registro dono" (usada em
    todo `findById`/`create`/`update` das 4 entidades).
- Relacionamentos: todos os 8 acima; nenhum é bidirecional (não é necessário declarar
  `OneToMany` inverso em `Training`/`Talent`/`Technique`/`Spell` — a consulta parte
  sempre de `EntityLink`, filtrando pela FK do dono).

**Entidades de domínio (`Training`, `Talent`, `Technique`, `Spell`):**

- Não recebem nenhuma coluna ou relação nova em si mesmas. `improvedFrom` e
  `requirements` não são propriedades TypeORM dessas 4 entidades — são compostas em
  tempo de leitura pelo serviço a partir de `EntityLink`, e não fazem parte do objeto
  `Training`/`Talent`/`Technique`/`Spell` retornado por `findById` nos serviços atuais.

**Novo enum `ReferenceableEntityType`** (`src/modules/entity-links/enums/referenceable-entity-type.enum.ts`):
`TRAINING = 'training'`, `TALENT = 'talent'`, `TECHNIQUE = 'technique'`,
`SPELL = 'spell'` — mesmos 4 valores (mesma grafia minúscula) já usados por
`LinkableEntityType` no módulo `search`, porém como enum próprio e mais restrito (só
essas 4 entidades são alvos/donos válidos de `improvedFrom`/`requirements`; reaproveitar
`LinkableEntityType` diretamente permitiria valores inválidos como `'user'` passarem na
validação do DTO).

**Novos DTOs compartilhados** (`src/modules/entity-links/dto/`), usados pelas 4
entidades de domínio:

- `EntityReferenceInputDto` (formato de escrita, usado em create/update):
  - `entityType: ReferenceableEntityType` (`@IsEnum(ReferenceableEntityType)`)
  - `id: string` (`@IsUUID('4')`)
- `EntityReferenceResponseDto` (formato de leitura, usado apenas no endpoint de
  detalhe):
  - `id: string` (uuid)
  - `name: string`
  - `entityType: ReferenceableEntityType`
  - `static fromResolved(entity: { id: string; name: string }, entityType: ReferenceableEntityType): EntityReferenceResponseDto`
    — mesmo padrão de `SearchResultItemResponseDto.fromEntity`.

**Novo serviço compartilhado `EntityLinksService`** (`src/modules/entity-links/entity-links.service.ts`),
exportado por um novo `EntityLinksModule` (importa `TypeOrmModule.forFeature([EntityLink, Training, Talent, Technique, Spell])`,
sem depender dos módulos `TrainingsModule`/`TalentsModule`/`TechniquesModule`/`SpellsModule`
— evita import cíclico, análogo ao que `SearchService` já faz injetando repositórios de
várias entidades diretamente). É importado por `TrainingsModule`, `TalentsModule`,
`TechniquesModule` e `SpellsModule`. Responsabilidades a implementar:

- `resolveReferences(refs: EntityReferenceInputDto[]): Promise<ResolvedReference[]>` —
  agrupa os `refs` por `entityType`, busca em lote nos repositórios de `Training`/
  `Talent`/`Technique`/`Spell` (um `findBy({ id: In(ids) })` por tipo presente) e
  lança `NotFoundException` em pt-BR (ex.: "Um ou mais itens referenciados em
  Aprimorado de/Requisitos não foram encontrados.") se algum id não existir — mesmo
  padrão do `findTagsByIds` já usado em `TrainingsService`.
- `validateLists(params: { ownerEntityType: ReferenceableEntityType; ownerId?: string; improvedFrom: EntityReferenceInputDto[]; requirements: EntityReferenceInputDto[] }): void`
  — aplica as regras de negócio 2, 3 e 4 do spec sobre o par **efetivo** de listas
  (ver nota sobre update parcial abaixo):
  - Autorreferência (regra 2): nenhum item de `improvedFrom`/`requirements` pode ter
    `entityType === ownerEntityType` e `id === ownerId` (só se aplica quando `ownerId`
    existe, ou seja, em update; em create é impossível referenciar um id que ainda não
    existe). Erro sugerido: `ConflictException` — "Um item não pode ser Aprimorado de/Requisito de si mesmo."
  - Duplicidade na mesma lista (regra 3): nenhum par `(entityType, id)` pode se repetir
    dentro de `improvedFrom` nem dentro de `requirements`. Erro sugerido:
    `ConflictException` — "Um item não pode ser adicionado duas vezes à mesma lista."
  - Exclusividade entre listas (regra 4): nenhum par `(entityType, id)` pode aparecer
    simultaneamente em `improvedFrom` e em `requirements`. Erro sugerido:
    `ConflictException` — "Um item não pode estar em Aprimorado de e em Requisitos ao mesmo tempo."
- `replaceLinks(ownerEntityType: ReferenceableEntityType, ownerId: string, linkType: EntityLinkType, refs: EntityReferenceInputDto[]): Promise<void>`
  — remove todas as linhas `EntityLink` existentes para `(ownerEntityType, ownerId, linkType)`
  e insere uma linha por item de `refs`, preenchendo a coluna de dono correspondente a
  `ownerEntityType` e a coluna de alvo correspondente a `ref.entityType`. Usada tanto no
  `create` (depois de o registro dono já ter sido salvo e ter um `id`) quanto no
  `update` das 4 entidades, uma chamada para `improvedFrom` e outra para `requirements`.
- `loadReferencesFor(ownerEntityType: ReferenceableEntityType, ownerId: string): Promise<{ improvedFrom: EntityReferenceResponseDto[]; requirements: EntityReferenceResponseDto[] }>`
  — busca as linhas de `EntityLink` para o dono (ambos os `linkType`), resolve o nome de
  cada alvo (batch por tipo, mesma lógica de `resolveReferences`) e devolve os dois
  arrays já no formato de leitura (ordenados por nome, `ASC`, mesmo padrão de ordenação
  já usado nas listagens das 4 entidades). Usado por `findById`, e também depois de
  `create`/`update` para montar a resposta do DTO de detalhe.

**Nota importante sobre update parcial (evitar ambiguidade para o `api-dev`):** como
`UpdateTrainingDto`/`UpdateTalentDto`/`UpdateTechniqueDto`/`UpdateSpellDto` são
`PartialType`, é possível enviar só `improvedFrom` sem enviar `requirements` (ou
vice-versa) num `PUT`. Nesse caso, antes de chamar `validateLists`, o serviço da
entidade (ex.: `TrainingsService.update`) deve montar o par **efetivo**: se
`dto.improvedFrom` for `undefined`, usar a lista `improvedFrom` atualmente persistida
(via `loadReferencesFor`) convertida de volta para `EntityReferenceInputDto[]`; o mesmo
para `requirements`. Isso é necessário para que a regra 4 (exclusividade entre as duas
listas) seja validada corretamente mesmo quando só uma das duas listas está sendo
alterada na requisição. Campo enviado como array vazio (`[]`) significa "esvaziar a
lista" (mesmo padrão já usado por `tagIds` no `update` atual).

**Alterações nas 4 entidades de domínio (idênticas para `Training`/`Talent`/`Technique`/`Spell`,
ajustando apenas nomes):**

- `Create<Entity>Dto` / `Update<Entity>Dto` (este via `PartialType`) ganham:
  - `improvedFrom?: EntityReferenceInputDto[]` (`@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EntityReferenceInputDto)`)
  - `requirements?: EntityReferenceInputDto[]` (mesmos decorators)
- `<Entity>ResponseDto` (resposta de detalhe — usada em `POST`, `GET /:id` e `PUT`)
  ganha:
  - `improvedFrom: EntityReferenceResponseDto[]`
  - `requirements: EntityReferenceResponseDto[]`
  - `static fromEntity` passa a receber também esses dois arrays já resolvidos como
    parâmetros adicionais (ex.: `fromEntity(training: Training, improvedFrom: EntityReferenceResponseDto[], requirements: EntityReferenceResponseDto[])`),
    já que resolvê-los exige consulta assíncrona e não pode ser feito dentro do
    `fromEntity` estático síncrono atual.
- `<Entity>ListItemResponseDto` / `Paginated<Entity>sResponseDto` **não** mudam —
  o spec restringe a exigência de retornar `improvedFrom`/`requirements` ao "endpoint de
  detalhe" (item 4 da seção de planejamento); a listagem paginada usada pelo modal de
  seleção do frontend continua no formato atual.
- `<Entity>sService`:
  - `findById` passa a também chamar `entityLinksService.loadReferencesFor(...)` e
    devolver (ou ao controller, ou como parte do retorno do método) tanto a entidade
    quanto os dois arrays resolvidos, para o controller montar o
    `<Entity>ResponseDto.fromEntity(entity, improvedFrom, requirements)`.
  - `create`: após resolver tags e validar nome (fluxo atual inalterado), chama
    `entityLinksService.resolveReferences` e `validateLists` (com `ownerId: undefined`)
    para os dois campos antes de salvar; salva a entidade; em seguida chama
    `replaceLinks` duas vezes (uma por `linkType`) usando o `id` recém-criado; por fim
    monta a resposta chamando `loadReferencesFor` (ou reaproveita os `refs` já
    resolvidos em memória, para evitar uma consulta redundante).
  - `update`: monta o par efetivo de listas (ver nota acima), valida e resolve
    referências, aplica `replaceLinks` para os campos efetivamente enviados no DTO, e
    recarrega/monta a resposta da mesma forma que `create`.
  - `remove`: **sem alteração de código necessária** — a exclusão em cascata das
    referências (regra 6) é garantida pelo `ON DELETE CASCADE` das FKs de
    `entity_links`, tanto quando o registro excluído é "dono" quanto quando é "alvo" de
    referências em outros registros.

#### Migration

- Necessária: sim.
- Uma única migration nova, cobrindo exclusivamente a criação da tabela `entity_links`
  (nenhuma alteração de schema é necessária nas tabelas `trainings`, `talents`,
  `techniques`, `spells` — elas não ganham colunas novas):
  - Criação do tipo enum do Postgres para `link_type` (`'improved_from'`, `'requirement'`).
  - Criação da tabela `entity_links` com todas as colunas descritas na seção
    "Entidade" acima (`id`, `created_at`, `updated_at` herdados de `BaseEntity`,
    `link_type`, as 4 colunas `owner_*_id` e as 4 colunas `target_*_id`).
  - 8 foreign keys (`owner_training_id → trainings.id`, `owner_talent_id → talents.id`,
    `owner_technique_id → techniques.id`, `owner_spell_id → spells.id`,
    `target_training_id → trainings.id`, `target_talent_id → talents.id`,
    `target_technique_id → techniques.id`, `target_spell_id → spells.id`), todas com
    `ON DELETE CASCADE`.
  - 2 check constraints (`CK_entity_links_owner_exclusive`, `CK_entity_links_target_exclusive`)
    usando `num_nonnulls(...) = 1`, conforme detalhado na seção "Entidade".
  - 1 unique constraint sobre as 9 colunas (`link_type` + 4 colunas de dono + 4 colunas
    de alvo).
  - Índices recomendados: um por combinação `(link_type, owner_<entidade>_id)` (4 no
    total), para acelerar a consulta de carregamento das listas de um registro dono.
  - Gerar via `npm run migration:generate -- src/database/migrations/CreateEntityLinks`
    depois de a entidade `EntityLink` estar declarada (com `autoLoadEntities: true` ela
    já será detectada automaticamente) e revisar o SQL gerado para garantir que os
    `CHECK`/`UNIQUE`/`ON DELETE CASCADE` descritos acima estejam presentes (o TypeORM
    gera os `CHECK` a partir do decorator `@Check`, mas vale conferir o SQL final).

#### Controller

- Nenhum endpoint novo é criado (nem para `EntityLink`/`entity-links`, nem um endpoint
  de busca dedicado — reaproveitam-se os endpoints de listagem paginada já existentes
  `GET /trainings`, `GET /talents`, `GET /techniques`, `GET /spells`, usados pelo modal
  de seleção do frontend, conforme item 6 da seção de planejamento do spec).
- Endpoints existentes afetados (mesmas mudanças replicadas para as 4 entidades —
  `trainings`, `talents`, `techniques`, `spells`):
  - `POST /trainings` (e equivalentes `/talents`, `/techniques`, `/spells`): body passa
    a aceitar `improvedFrom`/`requirements`; resposta (`TrainingResponseDto` e
    equivalentes) passa a incluir os dois campos resolvidos; documentar novos
    `@ApiConflictResponse` (regras de bloqueio) e reforçar `@ApiNotFoundResponse`
    (referência inexistente) e `@ApiBadRequestResponse` (formato inválido de
    `entityType`/`id`).
  - `PUT /trainings/:id` (e equivalentes): mesmas mudanças de `POST`, mais a nuance do
    update parcial (par efetivo de listas) descrita na seção "Entidade".
  - `GET /trainings/:id` (e equivalentes): resposta passa a incluir `improvedFrom`/
    `requirements` resolvidos.
  - `GET /trainings` (listagem paginada) e `DELETE /trainings/:id` (e equivalentes):
    sem alteração de contrato — a exclusão continua um `DELETE` simples, cascata
    resolvida no banco.
- DTOs novos/alterados: `EntityReferenceInputDto`, `EntityReferenceResponseDto`
  (compartilhados, em `entity-links/dto/`); `Create<Entity>Dto`, `Update<Entity>Dto`,
  `<Entity>ResponseDto` alterados para `Training`, `Talent`, `Technique`, `Spell`
  (8 arquivos no total, 2 por entidade × 4 entidades, sem contar os DTOs
  compartilhados).
- Acesso Google: read-only (padrão) — mantém o `@GoogleAccess('read-only')` já existente
  nos 4 controllers (`TrainingsController`, `TalentsController`, `TechniquesController`,
  `SpellsController`); usuários Google continuam bloqueados de `POST`/`PUT`/`DELETE`
  (incluindo adicionar/remover itens de `improvedFrom`/`requirements`, que fazem parte
  do corpo de `POST`/`PUT`) e liberados apenas para `GET`, conforme regra de negócio 7
  do spec (nenhuma regra de acesso adicional).

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger:
  - Novo schema `EntityReferenceInputDto` (campos `entityType` — enum com os 4 valores
    minúsculos — e `id` — uuid) e `EntityReferenceResponseDto` (`id`, `name`,
    `entityType`), com `@ApiProperty`/`@ApiPropertyOptional` e exemplos.
  - Em `Create<Entity>Dto`/`Update<Entity>Dto` das 4 entidades: `@ApiPropertyOptional({ type: () => [EntityReferenceInputDto], description: '...' })`
    para `improvedFrom` e para `requirements`, explicando em pt-BR o formato esperado e
    as regras de bloqueio (autorreferência, duplicidade, exclusividade entre as duas
    listas).
  - Em `<Entity>ResponseDto` das 4 entidades: `@ApiProperty({ type: () => [EntityReferenceResponseDto], description: '...' })`
    para `improvedFrom` e `requirements`.
  - Novas respostas de erro documentadas nos 4 controllers (`POST`/`PUT`):
    `@ApiConflictResponse` para autorreferência/duplicidade/exclusividade (mensagens em
    pt-BR) e reforço de `@ApiNotFoundResponse` para item referenciado inexistente.
  - Confirmar que a listagem paginada (`GET` sem `:id`) permanece documentada sem os
    dois novos campos, já que eles só aparecem no endpoint de detalhe.

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - As 2 checks (`num_nonnulls`), a unique constraint de 9 colunas e as 8 FKs com
    `ON DELETE CASCADE` realmente presentes na migration gerada (não só na entidade).
  - Autorreferência, duplicidade e exclusividade entre listas realmente validadas sobre
    o par **efetivo** de listas em `update` (não só sobre o que veio no `dto`, como
    detalhado na nota de update parcial).
  - Nenhuma referência quebrada possível após `DELETE` de qualquer uma das 4 entidades
    (cascata realmente cobre tanto o lado dono quanto o lado alvo).
  - `improvedFrom`/`requirements` presentes apenas no endpoint de detalhe (`POST`,
    `PUT`, `GET /:id`), não nas listagens paginadas.
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto.
  - Nenhum código de produção fora do escopo planejado (sem criar recurso de "seções",
    sem relação bidirecional, sem regra de permissão adicional).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. Verificação detalhada dos
pontos de atenção listados na etapa 3:

- **Checks, unique constraint e FKs com `ON DELETE CASCADE` na migration**: a migration
  `1784306060000-CreateEntityLinks.ts` cria de fato as 2 `CHECK` constraints
  (`CK_entity_links_owner_exclusive`, `CK_entity_links_target_exclusive`, ambas via
  `num_nonnulls(...) = 1`), a unique index sobre as 9 colunas
  (`IDX_entity_links_unique_combination`, no mesmo padrão de unique index — não
  `UQ_` — já usado em `CreateTrainingsTable.ts` e equivalentes para colunas únicas) e as
  8 foreign keys (4 `owner_*_id`, 4 `target_*_id`) todas com `ON DELETE CASCADE ON
  UPDATE NO ACTION`, exatamente batendo com os decorators `@Check`/`@Unique`/
  `ManyToOne({ onDelete: 'CASCADE' })` declarados em `entity-link.entity.ts`. O `down()`
  reverte a `up()` na ordem inversa correta (FKs → índices → tabela → tipo enum).
- **Autorreferência/duplicidade/exclusividade sobre o par efetivo em `update`**:
  confirmado nos 4 serviços (`trainings.service.ts`, `talents.service.ts`,
  `techniques.service.ts`, `spells.service.ts`) — quando `dto.improvedFrom` ou
  `dto.requirements` vem `undefined`, o serviço busca o par persistido via
  `entityLinksService.loadReferencesFor(...)` e monta `effectiveImprovedFrom`/
  `effectiveRequirements` antes de chamar `validateLists`, garantindo que a regra 4
  (exclusividade entre listas) seja avaliada corretamente mesmo em atualização parcial
  de só uma das duas listas.
- **Cascata de exclusão sem referências quebradas**: as 8 FKs com `ON DELETE CASCADE`
  cobrem tanto o lado "dono" (`owner_training_id`, `owner_talent_id`,
  `owner_technique_id`, `owner_spell_id`) quanto o lado "alvo"
  (`target_training_id`, `target_talent_id`, `target_technique_id`, `target_spell_id`),
  cada uma apontando para a tabela correta; `remove()` das 4 entidades não precisa (e
  não tem) lógica adicional de limpeza, como planejado.
- **`improvedFrom`/`requirements` restritos ao endpoint de detalhe**: presentes apenas
  em `Create<Entity>Dto`/`Update<Entity>Dto` (entrada) e `<Entity>ResponseDto` (usado em
  `POST`, `PUT`, `GET /:id`); confirmado que `<Entity>ListItemResponseDto` e
  `Paginated<Entity>sResponseDto` das 4 entidades não foram alterados e continuam sem
  esses campos.
- **Mensagens de erro em pt-BR**: `NotFoundException`/`ConflictException` em
  `entity-links.service.ts` usam texto em português consistente com o padrão já usado
  nos 4 serviços (ex.: "Um ou mais itens referenciados em Aprimorado de/Requisitos não
  foram encontrados.", "Um item não pode ser Aprimorado de/Requisito de si mesmo.").
- **Escopo**: nenhuma alteração fora do planejado — sem recurso de "seções", sem
  relação bidirecional (`EntityLink` não tem `OneToMany` inverso em `Training`/
  `Talent`/`Technique`/`Spell`), sem regra de permissão adicional (os 4 controllers
  mantêm `@GoogleAccess('read-only')` já existente, sem novo decorator/guard). Nenhum
  endpoint novo foi criado; os módulos das 4 entidades importam `EntityLinksModule` sem
  criar import cíclico (o `EntityLinksModule` não importa `TrainingsModule`/
  `TalentsModule`/`TechniquesModule`/`SpellsModule`).

Arquivos revisados: `app-api/src/modules/entity-links/entities/entity-link.entity.ts`,
`app-api/src/database/migrations/1784306060000-CreateEntityLinks.ts`,
`app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`,
`app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`,
`app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/entity-links/entity-links.module.ts`,
`app-api/src/modules/trainings/dto/create-training.dto.ts`,
`app-api/src/modules/trainings/dto/training-response.dto.ts`,
`app-api/src/modules/trainings/dto/update-training.dto.ts`,
`app-api/src/modules/trainings/dto/training-list-item-response.dto.ts`,
`app-api/src/modules/trainings/dto/paginated-trainings-response.dto.ts`,
`app-api/src/modules/trainings/trainings.service.ts`,
`app-api/src/modules/trainings/trainings.controller.ts`,
`app-api/src/modules/trainings/trainings.module.ts`,
`app-api/src/modules/trainings/entities/training.entity.ts`,
`app-api/src/modules/talents/dto/create-talent.dto.ts`,
`app-api/src/modules/talents/dto/talent-response.dto.ts`,
`app-api/src/modules/talents/dto/talent-list-item-response.dto.ts`,
`app-api/src/modules/talents/talents.service.ts`,
`app-api/src/modules/talents/talents.controller.ts`,
`app-api/src/modules/talents/talents.module.ts`,
`app-api/src/modules/techniques/dto/create-technique.dto.ts`,
`app-api/src/modules/techniques/dto/technique-response.dto.ts`,
`app-api/src/modules/techniques/dto/technique-list-item-response.dto.ts`,
`app-api/src/modules/techniques/techniques.service.ts`,
`app-api/src/modules/techniques/techniques.controller.ts`,
`app-api/src/modules/techniques/techniques.module.ts`,
`app-api/src/modules/spells/dto/create-spell.dto.ts`,
`app-api/src/modules/spells/dto/spell-response.dto.ts`,
`app-api/src/modules/spells/dto/spell-list-item-response.dto.ts`,
`app-api/src/modules/spells/spells.service.ts`,
`app-api/src/modules/spells/spells.controller.ts`,
`app-api/src/modules/spells/spells.module.ts`.
