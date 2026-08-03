# Task API: Melhorias e Defeitos em Talentos, Treinamentos e Características

## Contexto
Ver `.claude/tasks/melhorias-defeitos/spec.md` — seção "Escopo confirmado" é a fonte de
verdade das regras de negócio (não reabrir essas decisões).

O spec deixou explicitamente em aberto, para esta etapa de planejamento, quatro decisões
técnicas (seção "Requisitos para a etapa de planejamento do backend"). Todas as quatro
são fechadas de forma definitiva abaixo, e devem ser seguidas à risca pelo `api-dev` —
não são sugestões em aberto.

Referência de padrão mais próxima no código: `.claude/tasks/improved-from-requirements/task-api.md`
e o módulo real resultante `app-api/src/modules/entity-links/` (campos `improvedFrom`/
`requirements`/`additionalAbilities` de `Training`/`Talent`/`Technique`/`Spell`/
`Characteristic`). A modelagem desta demanda reaproveita o padrão "exclusive arc" desse
módulo para o lado "dono" (Talento/Treinamento/Característica), mas **não** é o mesmo
caso de uso — aqui cada item carrega campos próprios (`value`, `type`, `property`), não é
uma referência a outro registro de conteúdo, e a ordem de inserção precisa ser
preservada (o módulo `entity-links` ordena por nome, o que não se aplica aqui). Por isso
o modelo de dados é nova entidade dedicada, não uma extensão de `EntityLink`.

## Decisões fechadas nesta etapa

### 1. Modelagem: tabela única com discriminador + "exclusive arc" para o dono

**Decisão:** uma única tabela nova `improvement_flaws` (entidade `ImprovementFlaw`), com
uma coluna `category` (enum `improvement_flaw_category_enum`: `'improvement'` | `'flaw'`)
como discriminador, e o lado "dono" modelado como "exclusive arc" — 3 colunas de FK
anuláveis (`owner_talent_id`, `owner_training_id`, `owner_characteristic_id`), cada uma
com `ON DELETE CASCADE` real no banco, mais `CHECK num_nonnulls(...) = 1`. É o mesmo
padrão de dono já usado em `entity_links`, mas **sem** o lado "alvo" polimórfico — aqui
o "alvo" não é um registro de conteúdo, e sim uma linha das duas tabelas auxiliares de
seed (`type_id`/`property_id`, FKs simples, não polimórficas, sem cascade).

Justificativa:
- **Tabela única vs. duas tabelas (Melhoria/Defeito) separadas:** tabela única com
  discriminador foi escolhida por consistência com o padrão já estabelecido no projeto
  para exatamente este tipo de cenário (dono polimórfico + categorias fixas) —
  `entity_links` já resolve 3 categorias (`improved_from`/`requirement`/
  `additional_ability`) com uma tabela e um enum, evitando duplicar FKs/constraints/
  índices/serviço em duas tabelas quase idênticas. A leitura sempre precisa carregar
  "todos os itens do dono" e depois separar por categoria na camada de aplicação de
  qualquer forma (mesma lógica que `EntityLinksService.loadReferencesFor` já faz),
  então duas tabelas não trariam benefício de consulta, só duplicação de código.
- **Cascata real no banco (trade-off já discutido na demanda anterior):** assim como em
  `entity_links`, uma coluna polimórfica pura (`owner_type` + `owner_id`, sem FK) não
  permitiria `ON DELETE CASCADE` de verdade — exigiria limpeza manual em `remove()` das
  3 entidades. Optou-se pelas 3 colunas de FK anuláveis com `onDelete: 'CASCADE'` real,
  para que excluir um Talento/Treinamento/Característica apague automaticamente seus
  itens de Melhoria/Defeito, sem lógica adicional nos 3 serviços.
- **Nuance nova em relação ao precedente — ordem de inserção:** `entity_links` não
  precisa preservar ordem de inserção (ordena por nome na leitura). Aqui a regra de
  negócio 9 do spec exige ordem de inserção. Como não há endpoints dedicados de
  adicionar/remover item (ver decisão 3 — a lista inteira é substituída a cada
  `POST`/`PUT`, mesmo padrão de `replaceLinks`), a ordem é garantida por uma coluna
  própria `sortOrder` (`sort_order`, inteiro, not null), preenchida pelo backend com o
  índice do item dentro do array recebido (0-based) a cada substituição total da lista
  Melhorias/Defeitos daquele dono. A leitura ordena por `sort_order ASC`.
- **Alternativa descartada — duas tabelas separadas (`talent_improvements`,
  `talent_flaws`, etc. ou `improvements`/`flaws` genéricas):** descartada pelos mesmos
  motivos do precedente (duplicação de constraints/índices/service sem ganho de
  consulta) e por complicar a regra 6 (exclusividade entre as duas listas), que passaria
  a exigir consultar duas tabelas em vez de filtrar uma coluna `category` na mesma
  tabela.

### 2. Validação de compatibilidade Tipo × Propriedade

**Decisão:** coluna de vínculo direto entre as tabelas auxiliares — `ImprovementFlawProperty`
ganha uma FK obrigatória `type_id` → `ImprovementFlawType` (cada propriedade pertence a
exatamente um tipo). O endpoint `GET /improvement-flaw-properties` expõe esse vínculo
como `typeId` (uuid) no DTO de resposta, para que o `planejamento-web` filtre o
Autocomplete de Propriedade a partir do Tipo selecionado usando o dado retornado pela
API, sem precisar hardcodar a regra "Ataque → Ataque Corpo-a-Corpo/Ataque a Distância;
Teste de Resistência → 6 atributos" no frontend.

A validação no backend (regra de negócio 4) é feita na camada de aplicação, mas usando
esse vínculo de dados como fonte de verdade (não uma tabela de mapeamento hardcoded no
código): para cada item recebido, depois de carregar a `ImprovementFlawProperty`
referenciada (com sua relação `type`), comparar `property.type.id` com o `type` (id)
informado no item; se forem diferentes, `ConflictException` em pt-BR.

Justificativa: a alternativa "regra pura na camada de aplicação" (ex.: um `switch`/mapa
fixo em código relacionando os 2 tipos aos 8 nomes de propriedade) foi descartada porque
obrigaria o `planejamento-web` a hardcodar a mesma regra no frontend (já que a API não
exporia o vínculo), duplicando a regra de negócio em dois lugares e divergindo caso um
dos dois seja alterado no futuro. A coluna de vínculo resolve os dois lados com uma
única fonte de verdade.

### 3. Contrato de escrita/leitura de `improvements`/`flaws` e nuance de update parcial

**Formato de escrita** (`POST`/`PUT`, campo `improvements` e campo `flaws`, ambos
opcionais, cada um um array de itens `ImprovementFlawItemInputDto`):
```json
{ "value": 3, "type": "550e8400-...-type-uuid", "property": "550e8400-...-property-uuid" }
```
- `value`: inteiro, mínimo 1, sem máximo (`@IsInt`, `@Min(1)`, mensagens pt-BR).
- `type`: uuid da `ImprovementFlawType` (`@IsUUID('4')`).
- `property`: uuid da `ImprovementFlawProperty` (`@IsUUID('4')`).
- Todos os 3 campos obrigatórios dentro de cada item (o array em si é opcional no DTO
  do talento/treinamento/característica, mas cada item dele tem os 3 campos
  obrigatórios — reflete a regra de negócio 1 do spec).

**Formato de leitura** (dentro de `TalentResponseDto`/`TrainingResponseDto`/
`CharacteristicResponseDto`, usado em `POST`, `PUT` e `GET /:id` — não na listagem
paginada, mesmo critério já aplicado a `improvedFrom`/`requirements`/
`additionalAbilities`), cada item como `ImprovementFlawItemResponseDto`:
```json
{
  "value": 3,
  "type": { "id": "...", "name": "Ataque" },
  "property": { "id": "...", "name": "Ataque Corpo-a-Corpo", "typeId": "..." }
}
```
`type`/`property` são objetos resolvidos (reaproveitando `ImprovementFlawTypeResponseDto`
e `ImprovementFlawPropertyResponseDto`, os mesmos DTOs usados pelos endpoints das
tabelas auxiliares), não apenas ids — evita round-trips extras no frontend para exibir o
card com nome do tipo/propriedade, mesmo critério já usado para `tags` (que embute
`TagResponseDto`, não apenas `tagIds`, na resposta).

**Substituição total da lista, sem endpoints dedicados de item:** não há
"adicionar/remover item" como operação de API — a regra de negócio 8 do spec (sem
edição de item, apenas adicionar/remover) é resolvida inteiramente no frontend, que
monta o array completo antes de salvar; o backend sempre recebe e persiste a lista
completa a cada `POST`/`PUT` (mesmo padrão de substituição total já usado por
`replaceLinks`/`tagIds`). Array vazio (`[]`) significa "lista vazia"; campo ausente
(`undefined`) no `PUT` significa "não alterar esta lista" (ver nuance abaixo).

**Nuance de update parcial (mesma nuance identificada na demanda anterior — confirmada
que também se aplica aqui):** como `Update<Entity>Dto` é `PartialType`, um `PUT` pode
enviar só `improvements` sem enviar `flaws` (ou vice-versa). A regra de negócio 6
(exclusividade entre Melhorias e Defeitos do mesmo registro) só pode ser validada
corretamente se as duas listas forem avaliadas em conjunto. Portanto, antes de validar,
o serviço de cada entidade (`TalentsService.update`, `TrainingsService.update`,
`CharacteristicsService.update`) deve montar o **par efetivo**: se `dto.improvements`
for `undefined`, usar a lista `improvements` atualmente persistida (via
`ImprovementFlawsService.loadItemsFor`, convertendo cada
`ImprovementFlawItemResponseDto` de volta para `ImprovementFlawItemInputDto` —
`{ value: item.value, type: item.type.id, property: item.property.id }`); o mesmo para
`flaws`. É exatamente a mesma lógica já implementada em `talents.service.ts` para
`effectiveImprovedFrom`/`effectiveRequirements`/`effectiveAdditionalAbilities` (linhas
216–261 do arquivo atual) — replicar esse padrão literalmente, adicionando
`effectiveImprovements`/`effectiveFlaws`. Depois de validar sobre o par efetivo, a
persistência (`replaceItems`) só deve rodar para os campos que **de fato vieram** no
`dto` (`dto.improvements !== undefined` / `dto.flaws !== undefined`), nunca para o
campo que foi só "emprestado" da base para validação.

### 4. Rotas das duas tabelas auxiliares

Seguindo exatamente o padrão `Attribute`/`Currency` (`GET` único, não paginado,
`@GoogleAccess('read-only')`, sem CRUD de usuário):
- `GET /improvement-flaw-types` → lista os 2 tipos fixos (`ImprovementFlawTypeResponseDto[]`).
- `GET /improvement-flaw-properties` → lista as 8 propriedades fixas
  (`ImprovementFlawPropertyResponseDto[]`, incluindo `typeId`).

## Etapas

### 1. api-dev
- Status: concluído
- Entidades:
  - `app-api/src/modules/improvement-flaw-types/entities/improvement-flaw-type.entity.ts`
  - `app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`
  - `app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`
- Enums: `app-api/src/modules/improvement-flaws/enums/improvement-flaw-category.enum.ts`,
  `app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`
- Migrations (5, nesta ordem):
  1. `app-api/src/database/migrations/1784306180000-CreateImprovementFlawTypesTable.ts`
  2. `app-api/src/database/migrations/1784306190000-SeedImprovementFlawTypesTable.ts`
  3. `app-api/src/database/migrations/1784306200000-CreateImprovementFlawPropertiesTable.ts`
  4. `app-api/src/database/migrations/1784306210000-SeedImprovementFlawPropertiesTable.ts`
  5. `app-api/src/database/migrations/1784306220000-CreateImprovementFlawsTable.ts`
- Rotas novas:
  - `GET /improvement-flaw-types` (`ImprovementFlawTypesController`)
  - `GET /improvement-flaw-properties` (`ImprovementFlawPropertiesController`)
- Rotas alteradas (contrato de request/response, sem mudança de método/caminho):
  `POST /talents`, `PUT /talents/:id`, `GET /talents/:id`, `POST /trainings`,
  `PUT /trainings/:id`, `GET /trainings/:id`, `POST /characteristics`,
  `PUT /characteristics/:id`, `GET /characteristics/:id`.
- Módulos novos: `app-api/src/modules/improvement-flaw-types/` (entidade, DTO de resposta,
  service, controller, module), `app-api/src/modules/improvement-flaw-properties/`
  (entidade, DTO de resposta, service, controller, module), `app-api/src/modules/improvement-flaws/`
  (enums, entidade, DTOs de item, `improvement-flaws.service.ts`, `improvement-flaws.module.ts`
  — sem controller, não registrado em `app.module.ts`).
- Arquivos alterados: `app-api/src/app.module.ts` (registro de
  `ImprovementFlawTypesModule`/`ImprovementFlawPropertiesModule`); em cada um dos 3 módulos
  de domínio (`talents`, `trainings`, `characteristics`): `*.module.ts` (import de
  `ImprovementFlawsModule`), `*.controller.ts`, `*.service.ts`, `dto/create-*.dto.ts`,
  `dto/*-response.dto.ts` (campos `improvements`/`flaws`, `Update*Dto` herda via
  `PartialType`, inalterado).
- Verificação de retomada: revisão completa de todos os arquivos acima confirmou que a
  implementação já estava correta e completa (par efetivo em `update` replicado
  identicamente nos 3 serviços, validação Tipo×Propriedade via `property.type.id`,
  `sortOrder` preenchido pelo índice do array em `replaceItems` e ordenado por
  `sortOrder ASC` em `loadItemsFor`, `CHECK`/`UNIQUE`/FKs com `ON DELETE CASCADE` na
  migration batendo exatamente com a entidade, `improvements`/`flaws` ausentes nos
  `ListItemResponseDto`/paginação, `ImprovementFlawsModule` sem controller e não
  registrado em `app.module.ts`). Nenhuma correção de código foi necessária.

#### Entidade

**Duas novas entidades de seed (tabelas auxiliares, não editáveis via CRUD de
usuário), seguindo fielmente o padrão de `app-api/src/modules/attributes/entities/attribute.entity.ts`:**

- `ImprovementFlawType` (`app-api/src/modules/improvement-flaw-types/entities/improvement-flaw-type.entity.ts`,
  tabela `improvement_flaw_types`), estende `BaseEntity`:
  - `name` (`string`, `@Column()`, `@Index({ unique: true })`, `@ApiProperty()`).
  - Seed (via migration): `'Ataque'`, `'Teste de Resistência'`.
- `ImprovementFlawProperty` (`app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`,
  tabela `improvement_flaw_properties`), estende `BaseEntity`:
  - `name` (`string`, `@Column()`, `@Index({ unique: true })`, `@ApiProperty()`).
  - `type` (`ManyToOne(() => ImprovementFlawType)`, **not null**, `@JoinColumn({ name: 'type_id' })`,
    sem `onDelete: 'CASCADE'` — default `RESTRICT`/`NO ACTION`, pois a tabela de tipos
    nunca é excluída via API; vínculo usado para a validação da decisão 2 e exposto na
    resposta como `typeId`).
  - Seed (via migration), com o vínculo `type_id` já resolvido por subselect pelo nome
    do tipo (não hardcodear uuids):
    - Tipo "Ataque": `'Ataque Corpo-a-Corpo'`, `'Ataque a Distância'`.
    - Tipo "Teste de Resistência": `'Força'`, `'Destreza'`, `'Constituição'`,
      `'Inteligência'`, `'Sabedoria'`, `'Carisma'`.

**Nova entidade de itens (não é uma tabela de seed — armazena os itens efetivamente
adicionados a cada Talento/Treinamento/Característica):**

- `ImprovementFlaw` (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`,
  tabela `improvement_flaws`), estende `BaseEntity`:
  - `category` (`@Column({ type: 'enum', enum: ImprovementFlawCategory, name: 'category' })`,
    not null) — enum `ImprovementFlawCategory { IMPROVEMENT = 'improvement', FLAW = 'flaw' }`
    em `app-api/src/modules/improvement-flaws/enums/improvement-flaw-category.enum.ts`.
  - `value` (`@Column({ type: 'int' })`, not null; validação de mínimo 1 só na camada de
    DTO — `@IsInt()`/`@Min(1)` — sem `CHECK` de banco, mesmo critério já usado para o
    campo `level` de `Talent`/`Characteristic`, que também não tem `CHECK` de banco).
  - `sortOrder` (`@Column({ type: 'int', name: 'sort_order' })`, not null — posição do
    item dentro da lista `improvements`/`flaws` daquele dono, preenchida pelo backend a
    cada substituição total da lista; ver decisão 1).
  - `type` (`ManyToOne(() => ImprovementFlawType)`, not null, `@JoinColumn({ name: 'type_id' })`,
    sem cascade).
  - `property` (`ManyToOne(() => ImprovementFlawProperty)`, not null,
    `@JoinColumn({ name: 'property_id' })`, sem cascade).
  - Lado "dono" (exatamente um preenchido por linha, "exclusive arc", mesmo padrão de
    `EntityLink`): `ownerTalent` (`ManyToOne(() => Talent)`, nullable,
    `onDelete: 'CASCADE'`, `@JoinColumn({ name: 'owner_talent_id' })`), `ownerTraining`
    (`owner_training_id`), `ownerCharacteristic` (`owner_characteristic_id`) — **não**
    inclui `ownerTechnique`/`ownerSpell` (Técnicas e Magias estão fora de escopo desta
    demanda, conforme contexto fornecido).
  - Constraints na entidade:
    - `@Check('CK_improvement_flaws_owner_exclusive', 'num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id) = 1')`.
    - `@Unique(['category', 'ownerTalent', 'ownerTraining', 'ownerCharacteristic', 'type', 'property'])`
      — reforça a nível de banco a regra 5 (não duplicidade dentro da mesma lista);
      **não** cobre a regra 6 (exclusividade entre `improvements` e `flaws`, que
      atravessa `category`), essa continua sendo responsabilidade exclusiva da camada de
      aplicação (mesmo critério já documentado no precedente para autorreferência/
      duplicidade/exclusividade de `entity_links`).
  - Relacionamentos: nenhum bidirecional (sem `OneToMany` inverso em `Talent`/
    `Training`/`Characteristic`/`ImprovementFlawType`/`ImprovementFlawProperty`).

**Entidades de domínio (`Talent`, `Training`, `Characteristic`):** não recebem nenhuma
coluna ou relação nova em si mesmas — `improvements`/`flaws` não são propriedades
TypeORM dessas 3 entidades, são compostas em tempo de leitura pelo serviço compartilhado
a partir de `ImprovementFlaw`, mesmo critério já usado para `improvedFrom`/
`requirements`/`additionalAbilities`.

**Novo enum interno** `ImprovementFlawOwnerType` (`app-api/src/modules/improvement-flaws/enums/improvement-flaw-owner-type.enum.ts`):
`TALENT = 'talent'`, `TRAINING = 'training'`, `CHARACTERISTIC = 'characteristic'` — enum
próprio (não reaproveita `ReferenceableEntityType` de `entity-links`, que inclui
`TECHNIQUE`/`SPELL`, fora de escopo aqui) usado apenas internamente pelo
`ImprovementFlawsService` para saber em qual coluna de dono operar; **não** é exposto em
nenhum DTO de entrada (diferente de `ReferenceableEntityType`, que é escolhido pelo
cliente em `EntityReferenceInputDto` — aqui o "dono" é sempre implícito pelo
controller/serviço que chama, nunca escolhido pelo cliente).

**Novos DTOs compartilhados** (`app-api/src/modules/improvement-flaws/dto/`):
- `ImprovementFlawItemInputDto` (formato de escrita): `value: number` (`@IsInt`,
  `@Min(1)`, mensagens pt-BR), `type: string` (`@IsUUID('4')`), `property: string`
  (`@IsUUID('4')`).
- `ImprovementFlawItemResponseDto` (formato de leitura): `value: number`,
  `type: ImprovementFlawTypeResponseDto`, `property: ImprovementFlawPropertyResponseDto`,
  com `static fromResolved(item: ImprovementFlaw): ImprovementFlawItemResponseDto`
  (requer que `item.type`/`item.property` já estejam carregados via `relations`).

**Novos DTOs das tabelas auxiliares** (mesmo padrão de `AttributeResponseDto`):
- `app-api/src/modules/improvement-flaw-types/dto/improvement-flaw-type-response.dto.ts`
  (`ImprovementFlawTypeResponseDto`): `id`, `name`, `static fromEntity`.
- `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`
  (`ImprovementFlawPropertyResponseDto`): `id`, `name`, `typeId` (uuid, extraído de
  `property.type.id` — exige que o `findAll` do serviço de propriedades carregue a
  relação `type`), `static fromEntity`.

**Novo serviço compartilhado `ImprovementFlawsService`** (`app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`),
exportado por `ImprovementFlawsModule` (`TypeOrmModule.forFeature([ImprovementFlaw, ImprovementFlawType, ImprovementFlawProperty])`
— não precisa dos repositórios de `Talent`/`Training`/`Characteristic`, pois a existência
do dono já é garantida pelo serviço chamador antes de invocar este serviço, mesmo
critério que evita import cíclico usado em `EntityLinksModule`). É importado por
`TalentsModule`, `TrainingsModule` e `CharacteristicsModule` — **não** é registrado em
`app-api/src/app.module.ts` (não tem controller, mesmo critério de `EntityLinksModule`).
Responsabilidades a implementar:

- `validateAndResolveItems(items: ImprovementFlawItemInputDto[]): Promise<Map<string, { type: ImprovementFlawType; property: ImprovementFlawProperty }>>`
  (chave = `` `${type}:${property}` `` ou índice — decisão de implementação livre) —
  busca em lote (`findBy({ id: In(ids) })`) os tipos e propriedades referenciados,
  carregando a relação `property.type`; lança `NotFoundException` em pt-BR se algum id
  de `type`/`property` não existir (ex.: "Um ou mais tipos ou propriedades de
  melhoria/defeito não foram encontrados."); em seguida, para cada item, verifica
  `property.type.id === item.type` e lança `ConflictException` em pt-BR se divergir
  (ex.: "A propriedade selecionada não é compatível com o tipo selecionado.") — regra de
  negócio 4 do spec, decisão 2 acima.
- `validateLists(params: { improvements: ImprovementFlawItemInputDto[]; flaws: ImprovementFlawItemInputDto[] }): void`
  — aplica as regras 5 e 6 do spec sobre o par **efetivo** de listas (ver decisão 3):
  - Duplicidade na mesma lista (regra 5): nenhum par `(type, property)` pode se repetir
    dentro de `improvements` nem dentro de `flaws`. `ConflictException` em pt-BR (ex.:
    "Uma mesma combinação de Tipo e Propriedade não pode ser adicionada duas vezes na
    mesma lista.").
  - Exclusividade entre listas (regra 6): nenhum par `(type, property)` pode aparecer
    simultaneamente em `improvements` e em `flaws`. `ConflictException` em pt-BR (ex.:
    "Uma mesma combinação de Tipo e Propriedade não pode estar em Melhorias e em
    Defeitos ao mesmo tempo.").
- `replaceItems(ownerType: ImprovementFlawOwnerType, ownerId: string, category: ImprovementFlawCategory, items: ImprovementFlawItemInputDto[]): Promise<void>`
  — remove todas as linhas `ImprovementFlaw` existentes para `(ownerType, ownerId, category)`
  e insere uma linha por item de `items`, preenchendo a coluna de dono correspondente,
  `type`/`property` (reaproveitando os tipos/propriedades já resolvidos por
  `validateAndResolveItems`, para não repetir consulta) e `sortOrder` = índice do item
  no array (0-based). Usada tanto no `create` quanto no `update` das 3 entidades, uma
  chamada para `improvements` e outra para `flaws`.
- `loadItemsFor(ownerType: ImprovementFlawOwnerType, ownerId: string): Promise<{ improvements: ImprovementFlawItemResponseDto[]; flaws: ImprovementFlawItemResponseDto[] }>`
  — busca as linhas de `ImprovementFlaw` para o dono (ambas as categorias, `relations: { type: true, property: true }`),
  ordena por `sortOrder ASC` (regra de negócio 9 — ordem de inserção), separa por
  `category` e devolve os dois arrays já no formato de leitura. Usado por `findById`, e
  também depois de `create`/`update` para montar a resposta.

**Alterações nas 3 entidades de domínio (idênticas para `Talent`/`Training`/
`Characteristic`, ajustando apenas nomes — replicar literalmente o padrão já existente
para `improvedFrom`/`requirements`/`additionalAbilities` nos mesmos 3 módulos):**

- `Create<Entity>Dto`/`Update<Entity>Dto` (via `PartialType`) ganham:
  - `improvements?: ImprovementFlawItemInputDto[]` (`@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ImprovementFlawItemInputDto)`).
  - `flaws?: ImprovementFlawItemInputDto[]` (mesmos decorators).
- `<Entity>ResponseDto` ganha:
  - `improvements: ImprovementFlawItemResponseDto[]`.
  - `flaws: ImprovementFlawItemResponseDto[]`.
  - `static fromEntity` passa a receber também os dois arrays já resolvidos. Como a
    assinatura já tem 3 parâmetros extras (`improvedFrom`, `requirements`,
    `additionalAbilities`) além da entidade, recomenda-se (não é obrigatório, mas deve
    ser consistente entre os 3 módulos) agrupar os arrays extras em um único parâmetro
    objeto para não crescer para 6 parâmetros posicionais — forma exata fica a critério
    do `api-dev`, desde que aplicada de forma idêntica nos 3 módulos.
  - `<Entity>ListItemResponseDto`/`Paginated<Entity>sResponseDto` **não** mudam —
    `improvements`/`flaws` só aparecem no endpoint de detalhe (`POST`, `GET /:id`,
    `PUT`), mesmo critério já usado para `improvedFrom`/`requirements`/
    `additionalAbilities`.
- `<Entity>sService`:
  - `findById`: também chama `improvementFlawsService.loadItemsFor(<OwnerType>, id)` e
    devolve `improvements`/`flaws` junto com o restante (estender a interface
    `TalentWithReferences`/equivalente já existente em cada serviço).
  - `create`: após validar nome/tags e **antes** de salvar a entidade, chama
    `improvementFlawsService.validateAndResolveItems` para `improvementsInput` e
    `flawsInput` (`dto.improvements ?? []` / `dto.flaws ?? []`) e
    `improvementFlawsService.validateLists({ improvements: improvementsInput, flaws: flawsInput })`;
    depois de salvar a entidade (com `id` gerado), chama `replaceItems` duas vezes (uma
    por `category`); monta a resposta via `loadItemsFor` (ou reaproveitando os itens já
    resolvidos em memória).
  - `update`: monta o par efetivo `effectiveImprovements`/`effectiveFlaws` (ver decisão
    3 — nuance de update parcial, replicar literalmente o padrão de
    `effectiveImprovedFrom`/`effectiveRequirements` de `talents.service.ts`), valida e
    resolve itens sobre o par efetivo, salva a entidade, aplica `replaceItems` **apenas**
    para os campos que vieram de fato no `dto` (`dto.improvements !== undefined` /
    `dto.flaws !== undefined`), recarrega/monta a resposta via `loadItemsFor`.
  - `remove`: sem alteração de código — a exclusão em cascata dos itens de
    Melhoria/Defeito é garantida pelo `ON DELETE CASCADE` das colunas de dono de
    `improvement_flaws`.
- `<Entity>Module` (`talents.module.ts`, `trainings.module.ts`,
  `characteristics.module.ts`): passam a importar também `ImprovementFlawsModule`
  (além do `EntityLinksModule` já importado).

**Novos módulos das tabelas auxiliares** (`ImprovementFlawTypesModule`,
`ImprovementFlawPropertiesModule`) devem ser registrados em
`app-api/src/app.module.ts` (mesmo padrão de `AttributesModule`/`CurrenciesModule`, que
já estão listados lá — `ImprovementFlawsModule`, sem controller, **não** entra nessa
lista).

#### Migration
- Necessária: sim — 5 migrations novas, na ordem abaixo (nomes sugeridos; timestamps
  reais gerados sequencialmente após `1784306170000-CreateCampaignAllowedUsersTable.ts`,
  o mais recente hoje, via `npm run migration:generate`):
  1. `CreateImprovementFlawTypesTable` — cria `improvement_flaw_types`
     (`id`, `created_at`, `updated_at` herdados de `BaseEntity`, `name` varchar not null)
     + índice único em `name` (mesmo SQL padrão de `CreateAttributesTable`).
  2. `SeedImprovementFlawTypesTable` — `INSERT INTO improvement_flaw_types (name) VALUES ('Ataque'), ('Teste de Resistência')`
     (mesmo padrão de `SeedAttributesTable`); `down()` faz `DELETE ... WHERE name IN (...)`.
  3. `CreateImprovementFlawPropertiesTable` — cria `improvement_flaw_properties`
     (`id`, `created_at`, `updated_at`, `name` varchar not null, `type_id` uuid not null)
     + índice único em `name` + FK `type_id → improvement_flaw_types.id` **sem**
     `ON DELETE CASCADE` (default `NO ACTION`) + índice em `type_id`.
  4. `SeedImprovementFlawPropertiesTable` — insere as 8 propriedades resolvendo
     `type_id` por subselect pelo nome do tipo (não hardcodear uuid), ex.:
     `INSERT INTO improvement_flaw_properties (name, type_id) SELECT 'Ataque Corpo-a-Corpo', id FROM improvement_flaw_types WHERE name = 'Ataque'`
     (uma instrução por propriedade, ou uma única query com `VALUES`/`JOIN` — detalhe de
     implementação livre, desde que resolva o `type_id` a partir do nome do tipo em vez
     de um literal); `down()` remove as 8 linhas por nome.
  5. `CreateImprovementFlawsTable` — cria `improvement_flaws`:
     - Tipo enum Postgres `improvement_flaws_category_enum` (`'improvement'`, `'flaw'`).
     - Colunas: `id`, `created_at`, `updated_at` (herdadas), `category`
       (`improvement_flaws_category_enum`, not null), `value` (integer, not null),
       `sort_order` (integer, not null), `type_id` (uuid, not null), `property_id`
       (uuid, not null), `owner_talent_id` (uuid, nullable), `owner_training_id` (uuid,
       nullable), `owner_characteristic_id` (uuid, nullable).
     - FKs: `type_id → improvement_flaw_types.id` (sem cascade), `property_id → improvement_flaw_properties.id`
       (sem cascade), `owner_talent_id → talents.id` `ON DELETE CASCADE`,
       `owner_training_id → trainings.id` `ON DELETE CASCADE`, `owner_characteristic_id → characteristics.id`
       `ON DELETE CASCADE`.
     - Check `CK_improvement_flaws_owner_exclusive`:
       `num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id) = 1`.
     - Unique index `IDX_improvement_flaws_unique_combination` sobre
       (`category`, `owner_talent_id`, `owner_training_id`, `owner_characteristic_id`,
       `type_id`, `property_id`) — mesmo padrão de unique index (não `UQ_`) já usado em
       `IDX_entity_links_unique_combination`.
     - Índices recomendados para consulta por dono: `IDX_improvement_flaws_owner_talent`
       (`owner_talent_id`, `category`), `IDX_improvement_flaws_owner_training`
       (`owner_training_id`, `category`), `IDX_improvement_flaws_owner_characteristic`
       (`owner_characteristic_id`, `category`).
  - Gerar cada migration via `npm run migration:generate -- src/database/migrations/<Nome>`
    depois de as entidades estarem declaradas (`autoLoadEntities: true` detecta
    automaticamente `ImprovementFlawType`/`ImprovementFlawProperty`/`ImprovementFlaw`) e
    revisar o SQL gerado, conferindo que `CHECK`/`UNIQUE`/`ON DELETE CASCADE`/índices
    batem com o descrito acima (o TypeORM gera parte disso a partir dos decorators, mas
    os `INSERT` de seed são sempre escritos manualmente, como nas migrations de seed já
    existentes).

#### Controller
- **Nenhum endpoint novo de escrita** para `ImprovementFlaw`/`improvement_flaws` (sem
  `POST`/`PUT`/`DELETE` de item — substituição total via `improvements`/`flaws` dentro
  do `POST`/`PUT` das 3 entidades donas, conforme decisão 3).
- **Dois novos endpoints de leitura** (tabelas auxiliares, sem paginação):
  - `GET /improvement-flaw-types` (`ImprovementFlawTypesController`, módulo
    `app-api/src/modules/improvement-flaw-types/`) → `ImprovementFlawTypeResponseDto[]`.
  - `GET /improvement-flaw-properties` (`ImprovementFlawPropertiesController`, módulo
    `app-api/src/modules/improvement-flaw-properties/`) → `ImprovementFlawPropertyResponseDto[]`
    (inclui `typeId`).
  - Ambos: `@UseGuards(JwtAuthGuard, GoogleAccessGuard)`, `@GoogleAccess('read-only')`,
    mesmo padrão exato de `AttributesController`/`CurrenciesController` (sem filtro,
    sem paginação, ordenado por `name` `ASC`).
- **Endpoints existentes afetados** (mesmas mudanças replicadas para as 3 entidades —
  `talents`, `trainings`, `characteristics`):
  - `POST /talents` (e equivalentes `/trainings`, `/characteristics`): body passa a
    aceitar `improvements`/`flaws`; resposta passa a incluir os dois campos resolvidos;
    documentar novos `@ApiConflictResponse` (duplicidade/exclusividade/incompatibilidade
    tipo×propriedade) e reforçar `@ApiNotFoundResponse` (tipo/propriedade inexistente) e
    `@ApiBadRequestResponse` (formato inválido de `value`/`type`/`property`).
  - `PUT /talents/:id` (e equivalentes): mesmas mudanças de `POST`, mais a nuance do
    update parcial (par efetivo de listas) descrita na decisão 3.
  - `GET /talents/:id` (e equivalentes): resposta passa a incluir `improvements`/`flaws`
    resolvidos.
  - `GET /talents` (listagem paginada) e `DELETE /talents/:id` (e equivalentes): sem
    alteração de contrato.
- DTOs novos/alterados: `ImprovementFlawItemInputDto`, `ImprovementFlawItemResponseDto`
  (compartilhados, em `improvement-flaws/dto/`); `ImprovementFlawTypeResponseDto`,
  `ImprovementFlawPropertyResponseDto` (em seus respectivos módulos);
  `Create<Entity>Dto`, `Update<Entity>Dto`, `<Entity>ResponseDto` alterados para
  `Talent`, `Training`, `Characteristic` (6 arquivos, 2 por entidade × 3 entidades, sem
  contar os DTOs novos e compartilhados).
- Acesso Google: **read-only (padrão)** — mantém `@GoogleAccess('read-only')` já
  existente em `TalentsController`/`TrainingsController`/`CharacteristicsController`
  (nenhuma mudança de nível de acesso; usuários Google continuam bloqueados de
  `POST`/`PUT`/`DELETE`, incluindo alterar `improvements`/`flaws`, e liberados para
  `GET`). Os 2 novos controllers de tabelas auxiliares também usam **read-only**, mesmo
  padrão de `AttributesController`/`CurrenciesController` — não há justificativa para
  `blocked`, pois são apenas leitura de dados de seed, sem operação de escrita exposta.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Arquivos tocados:
  - `app-api/src/modules/improvement-flaw-types/improvement-flaw-types.controller.ts`
  - `app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.controller.ts`
  - `app-api/src/modules/talents/talents.controller.ts`
  - `app-api/src/modules/talents/dto/create-talent.dto.ts`
  - `app-api/src/modules/trainings/trainings.controller.ts`
  - `app-api/src/modules/trainings/dto/create-training.dto.ts`
  - `app-api/src/modules/characteristics/characteristics.controller.ts`
  - `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`
- Documentação realizada:
  - Novos schemas `ImprovementFlawTypeResponseDto`, `ImprovementFlawPropertyResponseDto`,
    `ImprovementFlawItemInputDto` e `ImprovementFlawItemResponseDto` com `@ApiProperty`
    e exemplos completos, incluindo descrição de `typeId` em pt-BR.
  - Tags Swagger `improvement-flaw-types` e `improvement-flaw-properties` com `@ApiOperation`
    indicando que são listas fixas.
  - Campos `improvements` e `flaws` em `Create<Entity>Dto` dos 3 módulos com descrições
    claras em pt-BR sobre formato esperado (valor inteiro >= 1, compatibilidade tipo×propriedade)
    e regras de bloqueio (duplicidade, exclusividade, incompatibilidade).
  - Campos `improvements` e `flaws` em `<Entity>ResponseDto` dos 3 módulos com documentação
    de ordem de inserção.
  - Respostas de erro documentadas nos 3 controllers (`POST`/`PUT`): `@ApiConflictResponse`
    detalhando duplicidade/exclusividade/incompatibilidade tipo×propriedade e `@ApiNotFoundResponse`
    para tipo/propriedade inexistente, com mensagens em pt-BR.
  - Confirmado que listagem paginada (`GET` sem `:id`) permanece sem `improvements`/`flaws`.

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - O `CHECK num_nonnulls` (3 colunas de dono), a unique index de 6 colunas e as 3 FKs
    de dono com `ON DELETE CASCADE` realmente presentes na migration gerada (não só na
    entidade) — e as 2 FKs `type_id`/`property_id` **sem** cascade.
  - Seeds de `improvement_flaw_properties` realmente resolvendo `type_id` por nome do
    tipo (subselect/join), nunca por uuid hardcoded.
  - Regra 4 (compatibilidade tipo×propriedade) validada consultando o vínculo real
    `property.type.id` persistido no banco, não um mapa fixo em código.
  - Regras 5 e 6 (duplicidade/exclusividade) validadas sobre o par **efetivo** de listas
    em `update` (não só sobre o que veio no `dto`), replicando a mesma nuance já
    aplicada a `improvedFrom`/`requirements`/`additionalAbilities`.
  - `sort_order` corretamente recalculado (índice do array) a cada substituição total da
    lista, e a leitura (`loadItemsFor`) realmente ordenando por `sort_order ASC`
    (ordem de inserção preservada, regra de negócio 9).
  - Nenhuma referência quebrada possível após `DELETE` de Talento/Treinamento/
    Característica (cascata cobre as 3 colunas de dono).
  - `improvements`/`flaws` presentes apenas no endpoint de detalhe (`POST`, `PUT`,
    `GET /:id`) das 3 entidades, não nas listagens paginadas.
  - `ImprovementFlawsModule` não registrado em `app.module.ts` (sem controller);
    `ImprovementFlawTypesModule`/`ImprovementFlawPropertiesModule` registrados.
  - Nenhum endpoint de escrita (`POST`/`PUT`/`DELETE`) criado para as duas tabelas
    auxiliares — apenas `GET`.
  - Acesso Google inalterado (`read-only`) nos 3 controllers principais e nos 2 novos
    controllers de tabelas auxiliares.
  - Mensagens de erro em pt-BR consistentes com o padrão do restante do projeto.
  - Nenhum código de produção fora do escopo planejado (sem incluir Técnicas/Magias
    como donos possíveis, sem funcionalidade de edição de item, sem valor máximo).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. Verificação detalhada por
ponto de atenção listado na etapa 3:

- **CHECK/Unique/FKs de dono em `improvement_flaws`**: confirmados na migration
  `app-api/src/database/migrations/1784306220000-CreateImprovementFlawsTable.ts` —
  `CK_improvement_flaws_owner_exclusive` com `num_nonnulls(owner_talent_id,
  owner_training_id, owner_characteristic_id) = 1`, unique index
  `IDX_improvement_flaws_unique_combination` sobre as 6 colunas exatas
  (`category`, `owner_talent_id`, `owner_training_id`, `owner_characteristic_id`,
  `type_id`, `property_id`), e as 3 FKs de dono com `ON DELETE CASCADE` real
  (`FK_improvement_flaws_owner_talent_id`/`_owner_training_id`/`_owner_characteristic_id`).
  As FKs `type_id`/`property_id` estão corretamente `ON DELETE NO ACTION`. Tudo bate
  com a entidade `app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`
  (`@Check`, `@Unique`, `onDelete: 'CASCADE'` apenas nas 3 colunas de dono).
- **Seeds de `improvement_flaw_properties`**: a migration
  `app-api/src/database/migrations/1784306210000-SeedImprovementFlawPropertiesTable.ts`
  resolve `type_id` via `SELECT ... FROM (VALUES ...) AS v(name, type_name) JOIN
  improvement_flaw_types t ON t.name = v.type_name`, sem nenhum uuid hardcoded.
- **Regra 4 (compatibilidade Tipo×Propriedade)**: `ImprovementFlawsService.validateAndResolveItems`
  (`app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`) carrega a
  `ImprovementFlawProperty` com a relação `type` e compara `property.type.id !==
  item.type`, lançando `ConflictException` em pt-BR — vínculo de dado real, não mapa
  fixo em código.
- **Regras 5/6 sobre o par efetivo em `update`**: `TalentsService.update`,
  `TrainingsService.update` e `CharacteristicsService.update` replicam identicamente o
  padrão de `effectiveImprovedFrom`/`effectiveRequirements`/`effectiveAdditionalAbilities`
  para `effectiveImprovements`/`effectiveFlaws` — se `dto.improvements`/`dto.flaws` vier
  `undefined`, a lista atual é recarregada via `improvementFlawsService.loadItemsFor` e
  convertida de volta para `ImprovementFlawItemInputDto`. `validateAndResolveItems`/
  `validateLists` rodam sobre esse par efetivo, e `replaceItems` só é chamado para os
  campos que de fato vieram no `dto` (`dto.improvements !== undefined` /
  `dto.flaws !== undefined`), nunca para o campo apenas "emprestado" da base.
- **`sort_order`**: `ImprovementFlawsService.replaceItems` preenche `sortOrder: index`
  a partir do índice do item no array recebido a cada substituição total, e
  `loadItemsFor` ordena por `sortOrder: 'ASC'` antes de separar por categoria — ordem de
  inserção preservada (regra de negócio 9).
- **Cascata em `DELETE` de Talento/Treinamento/Característica**: as 3 FKs de dono em
  `improvement_flaws` têm `ON DELETE CASCADE` real tanto na entidade quanto na
  migration; os 3 `<Entity>sService.remove` não precisam de lógica adicional, e de fato
  não têm nenhuma.
- **`improvements`/`flaws` apenas no endpoint de detalhe**: confirmado em
  `TalentResponseDto`/`TrainingResponseDto`/`CharacteristicResponseDto` (usados em
  `POST`, `PUT`, `GET /:id`) vs. `TalentListItemResponseDto`/
  `TrainingListItemResponseDto`/`CharacteristicListItemResponseDto` (usados na
  listagem paginada), que não possuem esses campos.
- **`ImprovementFlawsModule` sem controller/não registrado**: confirmado — não declara
  `controllers` em `app-api/src/modules/improvement-flaws/improvement-flaws.module.ts`
  e não aparece em `app-api/src/app.module.ts`, enquanto
  `ImprovementFlawTypesModule`/`ImprovementFlawPropertiesModule` estão registrados lá
  (linhas 104-105).
- **Nenhum endpoint de escrita nas tabelas auxiliares**: `ImprovementFlawTypesController`
  e `ImprovementFlawPropertiesController` expõem apenas `@Get()`, sem `POST`/`PUT`/`DELETE`.
- **Acesso Google inalterado**: os 3 controllers principais mantêm
  `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')` já
  existentes (sem alteração de nível); os 2 novos controllers de tabelas auxiliares usam
  exatamente o mesmo padrão de `AttributesController`/`CurrenciesController`
  (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`, `GET`
  único sem paginação).
- **Mensagens de erro em pt-BR**: todas as mensagens novas (`NotFoundException`/
  `ConflictException` em `ImprovementFlawsService`) estão em pt-BR e consistentes com o
  estilo do restante do projeto (ex.: "A propriedade selecionada não é compatível com o
  tipo selecionado.", "Uma mesma combinação de Tipo e Propriedade não pode estar em
  Melhorias e em Defeitos ao mesmo tempo.").
- **Fora de escopo respeitado**: `ImprovementFlawOwnerType` não inclui
  `TECHNIQUE`/`SPELL`; a entidade `ImprovementFlaw` não tem colunas
  `owner_technique_id`/`owner_spell_id`; não há endpoint de edição de item; `value` não
  tem validação de máximo (`@IsInt()`/`@Min(1)` apenas).

Arquivos revisados: entidades, enums, DTOs, services, controllers e módulos de
`app-api/src/modules/improvement-flaw-types/`, `app-api/src/modules/improvement-flaw-properties/`
e `app-api/src/modules/improvement-flaws/`; as 5 migrations em
`app-api/src/database/migrations/1784306180000` a `1784306220000`; os arquivos alterados
de `app-api/src/modules/talents/`, `app-api/src/modules/trainings/` e
`app-api/src/modules/characteristics/` (`*.controller.ts`, `*.service.ts`, `*.module.ts`,
`dto/create-*.dto.ts`, `dto/update-*.dto.ts`, `dto/*-response.dto.ts`,
`dto/*-list-item-response.dto.ts`); e `app-api/src/app.module.ts`.
