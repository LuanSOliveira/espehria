# Task API: Novo tipo "Atributo" em Melhorias/Defeitos (relação Tipo × Propriedade many-to-many)

## Contexto
Não existe `.claude/tasks/melhorias-tipo-atributo/spec.md`. O modelo de dados já foi
validado diretamente com o usuário (não reabrir essa decisão): a relação entre
`ImprovementFlawType` e `ImprovementFlawProperty` deixa de ser `ManyToOne` (uma
propriedade pertence a exatamente um tipo) e passa a ser `ManyToMany` (uma propriedade
pode pertencer a vários tipos), para permitir que o novo tipo **"Atributo"** reaproveite
as 6 propriedades já existentes sob "Teste de Resistência" (Força, Destreza,
Constituição, Inteligência, Sabedoria, Carisma) sem duplicar linhas.

Estado atual investigado no código (base factual deste plano):
- `ImprovementFlawType` (`app-api/src/modules/improvement-flaw-types/entities/improvement-flaw-type.entity.ts`,
  tabela `improvement_flaw_types`): só `name` (único). Seedada com `Ataque` e
  `Teste de Resistência` (migration `1784306190000-SeedImprovementFlawTypesTable.ts`).
- `ImprovementFlawProperty` (`app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`,
  tabela `improvement_flaw_properties`): `name` (único) + `type` (`@ManyToOne(() =>
  ImprovementFlawType, { nullable: false }) @JoinColumn({ name: 'type_id' })`). Seedada
  (migration `1784306210000-SeedImprovementFlawPropertiesTable.ts`) com 8 linhas: Ataque
  Corpo-a-Corpo / Ataque a Distância (tipo Ataque) e Força/Destreza/Constituição/
  Inteligência/Sabedoria/Carisma (tipo Teste de Resistência).
- `ImprovementFlawPropertiesService.findAll` (`app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.service.ts:15`):
  `relations: { type: true }`.
- `ImprovementFlawPropertyResponseDto` (`app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`):
  expõe `typeId: string`, preenchido em `fromEntity` por `property.type.id` (linhas 24 e
  32).
- `ImprovementFlawsService` (`app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`):
  - `validateAndResolveItems` (linha 63): carrega properties com `relations: { type:
    true }` e, na linha 89, valida `property.type.id !== item.type` para checar
    compatibilidade Tipo×Propriedade.
  - `loadItemsFor` (linha 199): carrega os itens persistidos (`ImprovementFlaw`) com
    `relations: { type: true, property: true }` — **este `property: true` raso é o ponto
    crítico desta demanda** (ver seção "Ponto crítico de regressão" abaixo).
- `ImprovementFlawItemResponseDto.fromResolved` (`app-api/src/modules/improvement-flaws/dto/improvement-flaw-item-response.dto.ts:23`)
  chama `ImprovementFlawPropertyResponseDto.fromEntity(item.property)`, que hoje lê
  `property.type.id` e passará a ler `property.types.map(...)`.
- **Atenção — não confundir dois `type`s diferentes:** a entidade `ImprovementFlaw`
  (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`) também
  tem um campo próprio `type` (`@ManyToOne(() => ImprovementFlawType)`, `type_id` em
  `improvement_flaws`) — é o Tipo efetivamente escolhido pelo usuário em cada item de
  Melhoria/Defeito (Talento/Treinamento/Característica/Biografia), e **não muda nesta
  demanda**. A mudança de `ManyToOne` para `ManyToMany` é exclusiva da relação entre
  `ImprovementFlawProperty` e `ImprovementFlawType` (a tabela auxiliar de "quais tipos
  esta propriedade aceita"). Não fazer rename cego de todo `type`/`type_id` do módulo —
  só o vínculo Property↔Type.

### Ponto crítico de regressão identificado

Em `improvement-flaws.service.ts`, `loadItemsFor` (linha ~199) usa `relations: { type:
true, property: true }` — a relação `property` é carregada "rasa" (sem sub-relações). O
`ImprovementFlawItemResponseDto.fromResolved` chama
`ImprovementFlawPropertyResponseDto.fromEntity(item.property)`, que, após a mudança,
fará `property.types.map(t => t.id)`. Se `property.types` não vier carregado
(`undefined`), isso quebra em runtime — e quebra a **leitura** de Treinamentos,
Características e Biografias (que usam `loadItemsFor` para montar a resposta de
`improvements`/`flaws`), não só a escrita. O `relations` precisa virar
`{ type: true, property: { types: true } }` (relação aninhada). Foi feito grep por todos
os outros usos de `property.type`/`type: true` no contexto de improvement-flaws (ver
lista completa abaixo, seção Entidade) — não há mais nenhum ponto além dos já listados.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: `app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`
  (campo `type` `@ManyToOne` removido, substituído por `types: ImprovementFlawType[]`
  `@ManyToMany` + `@JoinTable('improvement_flaw_property_types')`)
- Migration:
  `app-api/src/database/migrations/1784306240000-ChangeImprovementFlawPropertiesTypeToManyToMany.ts`
  (cria tabela de junção, migra os 8 vínculos existentes, remove `type_id`) e
  `app-api/src/database/migrations/1784306250000-SeedImprovementFlawAttributeType.ts`
  (seed do novo tipo "Atributo" e vínculo às 6 propriedades de Teste de Resistência)
- Rotas: nenhuma rota nova/alterada. `GET /improvement-flaw-types` e
  `GET /improvement-flaw-properties` mantidos, apenas com mudança de formato de campo
  (`typeId` → `typeIds`) na resposta de `GET /improvement-flaw-properties`.
- Arquivos:
  - `app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.service.ts`
    (`relations: { type: true }` → `relations: { types: true }`)
  - `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`
    (`typeId: string` → `typeIds: string[]`, `fromEntity` ajustado)
  - `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`
    (`validateAndResolveItems`: `relations: { type: true }` → `relations: { types: true
    }` e validação de compatibilidade via `property.types.some(...)`; `loadItemsFor`:
    `relations: { type: true, property: true }` → `relations: { type: true, property: {
    types: true } }`, corrigindo o ponto crítico de regressão de leitura)

#### Entidade

**`ImprovementFlawProperty` (`app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`) — troca de relacionamento:**
- Remover `type!: ImprovementFlawType` (`@ManyToOne` + `@JoinColumn({ name: 'type_id' })`).
- Adicionar `types!: ImprovementFlawType[]`:
  ```ts
  @ManyToMany(() => ImprovementFlawType)
  @JoinTable({
    name: 'improvement_flaw_property_types',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'type_id', referencedColumnName: 'id' },
  })
  types!: ImprovementFlawType[];
  ```
  (mesmo padrão de `Race.characteristics`/`Race.talents` em
  `app-api/src/modules/races/entities/race.entity.ts` — join table com PK composta,
  índice em cada coluna, FKs com `ON DELETE CASCADE` para ambos os lados). `ImprovementFlawProperty`
  é o lado dono (`@JoinTable` fica em `types`); `ImprovementFlawType` não precisa de lado
  inverso (`@ManyToMany` mapeado), pois não há necessidade de navegar de Tipo para
  Propriedades no código atual.
- `ImprovementFlawType` (`app-api/src/modules/improvement-flaw-types/entities/improvement-flaw-type.entity.ts`):
  **nenhuma alteração de código** — continua só com `name` único; o novo tipo "Atributo"
  é inserido por migration de seed, não por mudança de entidade.
- `ImprovementFlaw` (`app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts`):
  **nenhuma alteração** — seu campo próprio `type` (`ManyToOne`, `type_id` em
  `improvement_flaws`) é o Tipo escolhido no item, não a relação Property↔Type, e fica
  intacto (ver "Atenção" no Contexto).

**Serviços e DTOs a ajustar (grep confirmou que estes são os únicos pontos com
`property.type`/`type: true` relacionados a Property↔Type no módulo):**
- `app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.service.ts:15`
  — `relations: { type: true }` → `relations: { types: true }`.
- `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`
  — trocar `typeId: string` (linha 24) por `typeIds: string[]` (`@ApiProperty({ type:
  [String], format: 'uuid', description: 'Identificadores dos tipos de melhoria/defeito
  aos quais esta propriedade pertence' })`); em `fromEntity` (linha 32), trocar `dto.typeId
  = property.type.id` por `dto.typeIds = property.types.map((type) => type.id)`.
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts`:
  - `validateAndResolveItems`, busca de properties (linha ~63): `relations: { type: true
    }` → `relations: { types: true }`.
  - `validateAndResolveItems`, validação de compatibilidade (linha ~89): `if
    (property.type.id !== item.type)` → `if (!property.types.some((type) => type.id ===
    item.type))`, mantendo a mesma `ConflictException` em pt-BR já existente ("A
    propriedade selecionada não é compatível com o tipo selecionado.").
  - `loadItemsFor` (linha ~199): `relations: { type: true, property: true }` →
    `relations: { type: true, property: { types: true } }` — **correção do ponto crítico
    de regressão** descrito acima; sem essa mudança aninhada, a leitura de
    Treinamentos/Características/Biografias/Talentos quebra.
- Nenhum outro arquivo do módulo referencia `property.type`/`typeId` (confirmado por
  grep em `app-api/src/modules`).

#### Migration
- Necessária: **sim**, 2 migrations novas, na ordem abaixo (timestamps sugeridos —
  último timestamp existente no repositório é `1784306230000`, gerar sequencialmente
  a partir daí via `npm run migration:generate -- src/database/migrations/<Nome>` depois
  de a entidade estar alterada):

  **1. `ChangeImprovementFlawPropertiesTypeToManyToMany` (ex.: `1784306240000`) — migration de schema:**
  - `up()`:
    1. Criar a tabela de junção `improvement_flaw_property_types` com PK composta
       (mesmo padrão de `race_characteristics`/`race_talents` em
       `1784306110000-AddRaceCharacteristicsAndTalentsRelations.ts`):
       `CREATE TABLE "improvement_flaw_property_types" ("property_id" uuid NOT NULL,
       "type_id" uuid NOT NULL, CONSTRAINT "PK_improvement_flaw_property_types" PRIMARY
       KEY ("property_id", "type_id"))`.
    2. Índices em cada coluna: `IDX_improvement_flaw_property_types_property_id`,
       `IDX_improvement_flaw_property_types_type_id`.
    3. FKs com `ON DELETE CASCADE` para ambos os lados:
       `FK_improvement_flaw_property_types_property_id` (`property_id` →
       `improvement_flaw_properties.id`), `FK_improvement_flaw_property_types_type_id`
       (`type_id` → `improvement_flaw_types.id`).
    4. **Migrar os dados existentes** antes de remover a coluna antiga: `INSERT INTO
       "improvement_flaw_property_types" ("property_id", "type_id") SELECT "id",
       "type_id" FROM "improvement_flaw_properties"` — uma linha por propriedade
       existente (8 linhas hoje), preservando exatamente os vínculos atuais.
    5. Remover a coluna antiga e seus objetos: `ALTER TABLE
       "improvement_flaw_properties" DROP CONSTRAINT
       "FK_improvement_flaw_properties_type_id"`, `DROP INDEX "public"."IDX_improvement_flaw_properties_type_id"`,
       `ALTER TABLE "improvement_flaw_properties" DROP COLUMN "type_id"`.
  - `down()` (reverte a coluna e repopula a partir da junção **antes** de reaplicar o
    `NOT NULL` — seguindo a ordem inversa exata do `up()`):
    1. Recriar a coluna, inicialmente nullable: `ALTER TABLE
       "improvement_flaw_properties" ADD COLUMN "type_id" uuid`.
    2. Repopular a partir da junção: `UPDATE "improvement_flaw_properties" p SET
       "type_id" = (SELECT "type_id" FROM "improvement_flaw_property_types" WHERE
       "property_id" = p."id" LIMIT 1)`.
    3. Reaplicar `NOT NULL`: `ALTER TABLE "improvement_flaw_properties" ALTER COLUMN
       "type_id" SET NOT NULL`.
    4. Recriar índice e FK: `CREATE INDEX "IDX_improvement_flaw_properties_type_id" ON
       "improvement_flaw_properties" ("type_id")`, `ALTER TABLE
       "improvement_flaw_properties" ADD CONSTRAINT
       "FK_improvement_flaw_properties_type_id" FOREIGN KEY ("type_id") REFERENCES
       "improvement_flaw_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.
    5. Dropar FKs/índices/tabela de junção: `DROP CONSTRAINT`s de
       `improvement_flaw_property_types`, `DROP INDEX`s, `DROP TABLE
       "improvement_flaw_property_types"`.
  - **Limitação documentada do `down()`** (não é possível evitar sem perda de dados em
    todos os cenários): o `UPDATE ... LIMIT 1` do passo 2 assume que, no momento em que
    este `down()` roda, cada propriedade tem **no máximo um** vínculo na tabela de
    junção — o que só é garantido se a migration de seed (item 2 abaixo, que cria os
    vínculos extras de "Atributo") já tiver sido revertida antes (ordem natural de
    `migration:revert`, que desfaz da mais recente para a mais antiga). Se este `down()`
    for executado fora dessa ordem (ex.: com vínculos "Atributo" ainda presentes), o
    `LIMIT 1` escolhe um vínculo arbitrário e os demais são perdidos ao reconstituir a
    coluna `type_id` (que só suporta um tipo por propriedade). Esta é uma limitação
    aceita e inerente a "desfazer" uma relação N:N de volta para 1:N quando já existem
    múltiplos vínculos reais — não há forma de reverter sem perda nesse cenário
    específico; a mitigação é reverter migrations sempre na ordem correta (a mais
    recente primeiro).

  **2. `SeedImprovementFlawAttributeType` (ex.: `1784306250000`) — migration de seed,
  mesmo estilo de `1784306190000-SeedImprovementFlawTypesTable.ts`/
  `1784306210000-SeedImprovementFlawPropertiesTable.ts`:**
  - `up()`:
    1. `INSERT INTO "improvement_flaw_types" ("name") VALUES ('Atributo')`.
    2. Vincular as 6 propriedades já existentes ao novo tipo, resolvendo ids por nome
       (não hardcodear uuid), sem duplicar nem alterar os vínculos existentes com
       "Teste de Resistência":
       ```sql
       INSERT INTO "improvement_flaw_property_types" ("property_id", "type_id")
       SELECT p.id, t.id
       FROM "improvement_flaw_properties" p
       JOIN "improvement_flaw_types" t ON t.name = 'Atributo'
       WHERE p.name IN ('Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma')
       ```
  - `down()`:
    1. `DELETE FROM "improvement_flaw_property_types" WHERE "type_id" = (SELECT "id"
       FROM "improvement_flaw_types" WHERE "name" = 'Atributo')`.
    2. `DELETE FROM "improvement_flaw_types" WHERE "name" = 'Atributo'`.

  - Gerar com `npm run migration:generate` a partir de dentro de `app-api` após alterar
    a entidade `ImprovementFlawProperty`, e revisar/completar manualmente o SQL gerado
    (o `INSERT`/`UPDATE` de migração de dados e os `INSERT`s de seed sempre são escritos
    à mão, como nas migrations de seed já existentes do módulo).

#### Controller
- **Nenhum endpoint novo, nenhuma rota alterada de método/caminho.** Apenas contrato de
  resposta:
  - `GET /improvement-flaw-types` (`ImprovementFlawTypesController`) — resposta passa a
    incluir automaticamente "Atributo" na lista (nenhuma alteração de código no
    controller/service/DTO deste módulo, pois já lista todas as linhas de
    `improvement_flaw_types`).
  - `GET /improvement-flaw-properties` (`ImprovementFlawPropertiesController`) — mesma
    rota, mas o campo `typeId` (uuid único) do `ImprovementFlawPropertyResponseDto` passa
    a ser `typeIds` (array de uuids); Força/Destreza/Constituição/Inteligência/Sabedoria/Carisma
    passam a retornar `typeIds` com 2 elementos (Teste de Resistência + Atributo).
  - **Endpoints afetados indiretamente (sem mudança de contrato de request/response,
    mas cuja implementação interna depende da correção do ponto crítico descrito
    acima):** `POST`/`PUT`/`GET /:id` de `talents`, `trainings`, `characteristics` e
    `biographies` — todos usam `ImprovementFlawsService.loadItemsFor` para montar
    `improvements`/`flaws` na resposta. Sem a correção do `relations` aninhado em
    `loadItemsFor`, esses endpoints passam a quebrar em runtime na leitura (não é uma
    mudança de contrato, é a garantia de que o contrato existente continue funcionando).
- DTOs afetados: `ImprovementFlawPropertyResponseDto` (`typeId` → `typeIds`). Nenhum DTO
  de `talents`/`trainings`/`characteristics`/`biographies` muda de forma (continuam
  embutindo `ImprovementFlawPropertyResponseDto` dentro de
  `ImprovementFlawItemResponseDto.property`, que agora vem com `typeIds` em vez de
  `typeId`).
- Acesso Google: **read-only (padrão)** — sem alteração. `ImprovementFlawTypesController`
  e `ImprovementFlawPropertiesController` já usam `@GoogleAccess('read-only')` e
  continuam assim (endpoints de leitura de tabelas de seed, sem escrita exposta). Os
  controllers de `talents`/`trainings`/`characteristics`/`biographies` também não mudam
  de nível de acesso.

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Atualizar `@ApiProperty` de `ImprovementFlawPropertyResponseDto`
  (`app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts`):
  documentar `typeIds` como array de uuids, com `description` em pt-BR explicando que uma
  propriedade pode pertencer a múltiplos tipos (ex.: Força pertence a "Teste de
  Resistência" e "Atributo") e `example` coerente (array com 1 ou 2 uuids).
  - Cuidar da nomenclatura no exemplo/example do Swagger para refletir claramente a
    mudança de singular para plural (evitar exemplos que ainda sugiram um único tipo por
    propriedade).
- Conferir se `ApiOperation`/`ApiOkResponse` de
  `ImprovementFlawPropertiesController`/`ImprovementFlawTypesController` continuam
  corretos (não deveriam precisar de alteração de texto, já que a rota e o tipo de
  retorno — array de DTOs — não mudam, só o formato interno de um campo).
- Não há novos `@ApiConflictResponse`/`@ApiNotFoundResponse` a documentar — a mensagem de
  erro de incompatibilidade Tipo×Propriedade já existente
  ("A propriedade selecionada não é compatível com o tipo selecionado.") continua igual,
  só muda a forma de checagem internamente (`some` sobre `types` em vez de comparação
  direta).

#### Arquivos alterados:
- `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts` (field `typeIds` com `@ApiProperty` documentado corretamente como array de UUIDs)

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - A migration de schema realmente migra os 8 vínculos existentes para a tabela de
    junção **antes** de dropar `type_id` (sem perda de dados na direção `up`), e o
    `down()` reconstrói a coluna a partir da junção antes de reaplicar `NOT NULL`/índice/FK,
    com a limitação de reversão fora de ordem documentada explicitamente (não silenciada).
  - A migration de seed do "Atributo" vincula exatamente as 6 propriedades corretas
    (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma) ao novo tipo,
    resolvendo os ids por nome (subselect/join), sem hardcodear uuid, e **sem duplicar
    nem remover** os vínculos existentes dessas mesmas 6 propriedades com "Teste de
    Resistência".
  - `ImprovementFlawProperty.types` realmente configurado como `@ManyToMany` com
    `@JoinTable` correto (nome da tabela e nomes de coluna batendo com a migration), e
    que `ImprovementFlawType` não precisa de lado inverso.
  - **Verificar especificamente que `loadItemsFor` usa `relations: { type: true,
    property: { types: true } }`** (relação aninhada) — este é o ponto de maior risco de
    regressão silenciosa (leitura de Treinamentos/Características/Biografias/Talentos
    quebrando com `property.types` undefined). Testar mentalmente (ou via leitura do
    código) que `ImprovementFlawPropertyResponseDto.fromEntity` nunca recebe uma
    `ImprovementFlawProperty` sem `types` carregado em nenhum dos pontos de chamada do
    módulo.
  - Validação de compatibilidade Tipo×Propriedade em `validateAndResolveItems` usando
    `property.types.some((type) => type.id === item.type)`, preservando a mesma
    `ConflictException` em pt-BR.
  - `ImprovementFlawPropertyResponseDto.typeIds` corretamente populado como array (não
    apenas o primeiro elemento) e documentado no Swagger.
  - Confirmar que o campo `type` da entidade `ImprovementFlaw` (Tipo escolhido no item de
    Melhoria/Defeito) **não foi alterado** — nenhum rename cego de `type`/`type_id` fora
    da relação Property↔Type.
  - Nenhuma alteração de rota, método ou nível de acesso Google nos controllers
    envolvidos.
  - Mensagens de erro em pt-BR inalteradas e consistentes.

## Revisão

Revisão realizada com foco nos pontos de risco indicados pelo orquestrador (schema
ManyToMany, migrations `1784306240000`/`1784306250000`, ponto crítico de regressão em
`loadItemsFor`, e integridade do campo `ImprovementFlaw.type`). Nenhum problema
bloqueante ou de regressão foi encontrado; um único ponto menor de aderência ao
enunciado da etapa 2 (api-dev-doc) é reportado abaixo, sem impacto funcional.

- **`app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts:23`** — o `example` do `@ApiProperty` de `typeIds` contém apenas um único uuid (`['550e8400-e29b-41d4-a716-446655440000']`), o que não deixa tão evidente no Swagger a mudança de singular (um tipo) para plural (múltiplos tipos), especialmente para o caso das 6 propriedades de Teste de Resistência que agora também pertencem a "Atributo". A etapa 2 (api-dev-doc) pedia explicitamente "evitar exemplos que ainda sugiram um único tipo por propriedade".
  - Trecho: `example: ['550e8400-e29b-41d4-a716-446655440000']`
  - Sugestão: usar um `example` com dois uuids (ex.: `['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002']`), refletindo o caso real de uma propriedade vinculada a "Teste de Resistência" e "Atributo" simultaneamente.
  - **Status: CORRIGIDO** — o `example` foi alterado para conter dois uuids distintos, refletindo corretamente o comportamento plural da propriedade.

Pontos verificados e aprovados (sem achados):
- `app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts` — `types` corretamente `@ManyToMany(() => ImprovementFlawType)` + `@JoinTable({ name: 'improvement_flaw_property_types', joinColumn: { name: 'property_id', ... }, inverseJoinColumn: { name: 'type_id', ... } })`, mesmo padrão de `Race.characteristics`/`Race.talents`. `ImprovementFlawType` não tem lado inverso, como especificado.
- `app-api/src/database/migrations/1784306240000-ChangeImprovementFlawPropertiesTypeToManyToMany.ts` — `up()` cria a tabela de junção com PK composta, índices em `property_id`/`type_id`, FKs `ON DELETE CASCADE` para ambos os lados (nomes de tabela/coluna/constraint idênticos aos usados na entidade e nos índices/FKs originais criados em `1784306200000-CreateImprovementFlawPropertiesTable.ts`), migra os 8 vínculos existentes via `INSERT ... SELECT "id", "type_id" FROM "improvement_flaw_properties"` **antes** de dropar a FK/índice/coluna `type_id` antiga (ordem correta, sem perda de dados). `down()` recria `type_id` nullable, repopula via `UPDATE ... SELECT ... LIMIT 1` a partir da tabela de junção **antes** de reaplicar `NOT NULL`, índice e FK, e só então dropa a tabela de junção — ordem inversa exata do `up()`. A limitação do `LIMIT 1` ao reverter fora de ordem (com vínculos "Atributo" ainda presentes) está documentada explicitamente em comentário na task, não silenciada no código nem no plano.
- `app-api/src/database/migrations/1784306250000-SeedImprovementFlawAttributeType.ts` — vincula exatamente as 6 propriedades corretas (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma) ao novo tipo "Atributo" via `JOIN`/`WHERE p.name IN (...)`, resolvendo ids por nome (sem uuid hardcoded), sem tocar nos vínculos existentes com "Teste de Resistência" (apenas `INSERT`, nenhum `UPDATE`/`DELETE` nos vínculos antigos). `down()` remove somente os vínculos do tipo "Atributo" e o próprio tipo, sem afetar os vínculos com "Teste de Resistência".
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts:199` — `loadItemsFor` usa `relations: { type: true, property: { types: true } }` (relação aninhada), corrigindo o ponto crítico de regressão descrito na task. Confirmado por grep que este é o único ponto de carga de `ImprovementFlaw` usado para montar respostas de Treinamentos/Características/Talentos/Biografias, e que os únicos dois pontos de chamada de `ImprovementFlawPropertyResponseDto.fromEntity` no repositório (`improvement-flaw-properties.controller.ts:30` e `improvement-flaw-item-response.dto.ts:23`) sempre recebem uma `ImprovementFlawProperty` com `types` carregado (`findAll()` usa `relations: { types: true }`; `loadItemsFor` usa a relação aninhada corrigida).
- `app-api/src/modules/improvement-flaws/improvement-flaws.service.ts:89` — validação de compatibilidade `if (!property.types.some((type) => type.id === item.type))` preserva o comportamento correto (mesma semântica de "propriedade pertence ao tipo selecionado", agora sobre um array) e mantém a mesma `ConflictException('A propriedade selecionada não é compatível com o tipo selecionado.')` em pt-BR.
- `app-api/src/modules/improvement-flaw-properties/dto/improvement-flaw-property-response.dto.ts` — `typeIds: string[]` corretamente populado via `property.types.map((type) => type.id)` (array completo, não só o primeiro elemento), documentado com `@ApiProperty({ type: [String], format: 'uuid', description: '...' })`.
- `app-api/src/modules/improvement-flaws/entities/improvement-flaw.entity.ts` — campo `type` (`@ManyToOne(() => ImprovementFlawType, { nullable: false })`, `type_id` em `improvement_flaws`) permanece intacto; nenhum rename cego de `type`/`type_id` fora da relação Property↔Type. Confirmado por grep que os demais usos de `item.type.id` em `talents.service.ts`, `trainings.service.ts`, `characteristics.service.ts` e `biographies.service.ts` referem-se a este campo (Tipo escolhido no item), não à relação Property↔Type.
- `app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.controller.ts` e `app-api/src/modules/improvement-flaw-types/improvement-flaw-types.controller.ts` — nenhuma alteração de rota, método ou nível de acesso Google; ambos continuam com `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`.
- `app-api/src/modules/improvement-flaw-properties/improvement-flaw-properties.service.ts` — `findAll` usa `relations: { types: true }`, consistente com o novo relacionamento.
