# Task API: Habilidades Adicionais (Treinamentos, Talentos, Características)

## Contexto
Ver .claude/tasks/habilidades-adicionais/spec.md — seção "Escopo confirmado" e,
especialmente, "Requisitos para a etapa de planejamento do backend".

Esta demanda estende a infraestrutura genérica já existente em
`app-api/src/modules/entity-links/` (`EntityLink`, `EntityLinkType`,
`ReferenceableEntityType`, `EntityReferenceInputDto`/`EntityReferenceResponseDto`,
`EntityLinksService`), documentada e revisada em
`.claude/tasks/improved-from-requirements/task-api.md` e já ampliada uma vez para
incluir `Characteristic` como quinta entidade em
`.claude/tasks/caracteristicas-habilidade/task-api.md`. Esta task NÃO recria nada
dessa infraestrutura — apenas adiciona um terceiro `linkType`
(`ADDITIONAL_ABILITY = 'additional_ability'`) e o expõe como a propriedade
`additionalAbilities` em três das cinco entidades já suportadas.

O ponto de maior risco técnico é a alteração do tipo enum do Postgres
`entity_links_link_type_enum` (hoje com dois valores) para incluir um terceiro
valor, e como isso é revertido em `down()` — ver seção "Migration" abaixo, que
fecha essa decisão de forma inequívoca.

## Etapas

### 1. api-dev
- Status: concluído
- Entidade: nenhuma entidade de domínio nova; nenhuma coluna nova em `EntityLink`
  nem em `Training`/`Talent`/`Characteristic`/`Technique`/`Spell`. Alteração
  restrita ao enum `EntityLinkType` e à camada de aplicação (DTOs/serviços das 3
  entidades donas + `EntityLinksService`).
- Migration: necessária (alteração do tipo enum `link_type` no Postgres).
- Controller: nenhum endpoint novo; contrato de `POST`/`GET :id`/`PUT` alterado
  apenas para `trainings`, `talents`, `characteristics` (inclusão de
  `additionalAbilities` no body de entrada e na resposta de detalhe).
- Arquivos:
  - `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`
  - `app-api/src/modules/entity-links/entity-links.service.ts`
  - `app-api/src/database/migrations/1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts` (novo)
  - `app-api/src/modules/trainings/dto/create-training.dto.ts`
  - `app-api/src/modules/trainings/dto/training-response.dto.ts`
  - `app-api/src/modules/trainings/trainings.service.ts`
  - `app-api/src/modules/trainings/trainings.controller.ts`
  - `app-api/src/modules/talents/dto/create-talent.dto.ts`
  - `app-api/src/modules/talents/dto/talent-response.dto.ts`
  - `app-api/src/modules/talents/talents.service.ts`
  - `app-api/src/modules/talents/talents.controller.ts`
  - `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`
  - `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`
  - `app-api/src/modules/characteristics/characteristics.service.ts`
  - `app-api/src/modules/characteristics/characteristics.controller.ts`
  - `app-api/src/modules/techniques/**` — **não tocar** (fora de escopo, ver nota
    abaixo)
  - `app-api/src/modules/spells/**` — **não tocar** (fora de escopo, ver nota
    abaixo)
  - `app-api/src/modules/trainings/dto/update-training.dto.ts`,
    `app-api/src/modules/talents/dto/update-talent.dto.ts`,
    `app-api/src/modules/characteristics/dto/update-characteristic.dto.ts` — sem
    alteração de código (são `PartialType(Create<Entity>Dto)`; herdam
    `additionalAbilities?` automaticamente).

#### Entidade

**`EntityLinkType`** (`app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`):
adicionar um terceiro valor ao enum existente, preservando os dois já presentes:

```ts
export enum EntityLinkType {
  IMPROVED_FROM = 'improved_from',
  REQUIREMENT = 'requirement',
  ADDITIONAL_ABILITY = 'additional_ability',
}
```

**`EntityLink`** (`app-api/src/modules/entity-links/entities/entity-link.entity.ts`):
**nenhuma alteração**. As 5 colunas de dono (`owner_training_id`,
`owner_talent_id`, `owner_technique_id`, `owner_spell_id`,
`owner_characteristic_id`) e as 5 colunas de alvo (`target_*_id` equivalentes) já
existem desde a extensão para `Characteristic`. Os decorators `@Check` (checam
`num_nonnulls` sobre nomes de coluna) e `@Unique` (lista nomes de coluna,
incluindo `linkType`) não fazem referência a valores específicos do enum — apenas
ao tipo da coluna `link_type` como um todo — logo continuam válidos e não
precisam de nenhum ajuste de decorator para o novo valor. **Confirmação
explícita para o `api-dev`: não crie nenhuma coluna nova em `EntityLink` nem
altere `@Check`/`@Unique` nesta task.**

**Entidades de domínio (`Training`, `Talent`, `Characteristic`,
`Technique`, `Spell`):** nenhuma recebe coluna ou relação TypeORM nova.
`additionalAbilities`, assim como `improvedFrom`/`requirements`, não é uma
propriedade persistida na entidade — é composta em tempo de leitura pelo
`EntityLinksService` a partir de `EntityLink`.

**Donas da nova lista: apenas `Training`, `Talent`, `Characteristic`.**
`Technique` e `Spell` **não** recebem `additionalAbilities` em nenhum DTO,
service ou controller — nenhum arquivo em `app-api/src/modules/techniques/` ou
`app-api/src/modules/spells/` deve ser alterado nesta task. Elas continuam
válidas apenas como **alvo** (`target*`) de referências de
`additionalAbilities` das 3 entidades donas, o que já funciona sem nenhuma
alteração adicional porque `ReferenceableEntityType` já cobre as 5 entidades
como valores possíveis de `entityType` em `EntityReferenceInputDto`/
`EntityReferenceResponseDto` — nenhuma mudança necessária nesse enum nem nesses
DTOs compartilhados para esta task.

#### Migration

- Necessária: sim — uma única migration nova,
  `app-api/src/database/migrations/1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`
  (próximo timestamp sequencial após `1784306140000-ChangePriceAndAddCurrencyToItemTables.ts`,
  o mais recente do repositório).
- **Abordagem decidida (fechada nesta etapa de planejamento) para `up()`:** usar
  `ALTER TYPE ... ADD VALUE`, que é a forma suportada pelo Postgres para
  adicionar um valor a um tipo enum existente sem recriar a tabela:
  ```sql
  ALTER TYPE "public"."entity_links_link_type_enum" ADD VALUE 'additional_ability';
  ```
  (nome do tipo confirmado em `1784306060000-CreateEntityLinks.ts`:
  `entity_links_link_type_enum`, criado como
  `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement')`).
  Esta migration não insere nem atualiza nenhuma linha usando o novo valor — ela
  só amplia o domínio do tipo — logo não há necessidade de usar o valor na mesma
  transação em que foi criado (restrição do Postgres que não se aplica aqui).
- **Abordagem decidida para `down()` (Postgres não permite `ALTER TYPE ... DROP VALUE`):**
  recriar o tipo enum sem o valor novo, seguindo exatamente esta sequência (nessa
  ordem):
  1. `DELETE FROM "entity_links" WHERE "link_type" = 'additional_ability'` —
     remove qualquer linha que já use o valor novo (passo destrutivo necessário;
     sem ele o `ALTER COLUMN ... USING` do passo 4 falharia com dado
     incompatível com o tipo antigo). Documentar no corpo da migration, via
     comentário, que este `down()` é destrutivo para dados de
     "Habilidades Adicionais" caso já existam — mesmo padrão de cautela já
     esperado para reversão de uma migration que amplia um domínio de dados.
  2. `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO "entity_links_link_type_enum_old"`
  3. `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement')`
  4. `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE "public"."entity_links_link_type_enum" USING "link_type"::text::"public"."entity_links_link_type_enum"`
  5. `DROP TYPE "public"."entity_links_link_type_enum_old"`

  Isso restaura o tipo `entity_links_link_type_enum` bit a bit ao estado
  produzido por `1784306060000-CreateEntityLinks.ts` (mesmo nome, mesmos dois
  valores, mesma coluna `link_type` apontando para ele).
- **Nenhuma outra alteração de schema é necessária** nesta migration: sem novas
  colunas, sem novos `CHECK`/`UNIQUE`, sem alteração na tabela `entity_links` além
  do tipo da coluna `link_type` em si (que continua `NOT NULL`, sem default,
  exatamente como hoje).
- **Índices: nenhum índice novo é necessário.** Os 5 índices compostos já
  existentes (`IDX_entity_links_link_type_owner_training_id`,
  `..._owner_talent_id`, `..._owner_technique_id`, `..._owner_spell_id`,
  `IDX_entity_links_link_type_owner_characteristic_id`) têm `link_type` como
  primeira coluna sem restringir a um valor específico — o Postgres os usa
  automaticamente também para consultas com
  `link_type = 'additional_ability' AND owner_<entidade>_id = ...`, que é
  exatamente o padrão de consulta usado por `loadReferencesFor`/`replaceLinks`.
  **Confirmação explícita para o `api-dev`: não crie nenhum índice novo nesta
  task.**
- **Ponto de atenção para revisão (compatibilidade de versão do Postgres):**
  `ALTER TYPE ... ADD VALUE` dentro de um bloco de transação só é suportado a
  partir do Postgres 12. Como o `migration:run` do TypeORM (sem flag de
  transação customizada em `data-source.ts`) executa as migrations pendentes
  dentro de uma transação, confirmar que o Postgres de todos os ambientes
  (local/staging/produção) é versão 12+ antes de aplicar esta migration. Não é
  esperado que isso seja um problema (repositório já usa recursos modernos do
  Postgres, como `pgcrypto`/`gen_random_uuid()`), mas o `api-dev-codereviewer`
  deve sinalizar explicitamente se encontrar qualquer indicação em contrário.
- Gerar a migration manualmente (não via `migration:generate`, já que esta
  alteração de enum não é algo que o TypeORM consiga gerar automaticamente a
  partir de uma mudança na entidade — o decorator `@Column({ type: 'enum', enum: EntityLinkType })`
  apenas adiciona o valor ao array `enum`, mas o TypeORM não gera `ALTER TYPE`
  para enums já existentes de forma confiável; escrever o SQL manualmente como
  especificado acima é a abordagem mais segura e previsível).

#### Controller

- Nenhum endpoint novo é criado.
- Endpoints existentes afetados (mesma mudança replicada para as 3 entidades
  donas — `trainings`, `talents`, `characteristics`):
  - `POST /trainings` (e `/talents`, `/characteristics`): body passa a aceitar
    `additionalAbilities?: EntityReferenceInputDto[]`; resposta
    (`TrainingResponseDto`/`TalentResponseDto`/`CharacteristicResponseDto`) passa
    a incluir `additionalAbilities: EntityReferenceResponseDto[]` resolvido;
    atualizar o texto de `@ApiConflictResponse`/`@ApiNotFoundResponse`/
    `@ApiBadRequestResponse` já existentes nesses 3 controllers para mencionar
    "Habilidades Adicionais" junto de "Aprimorado de"/"Requisitos" (ex.:
    `@ApiConflictResponse` de `TalentsController.create` hoje diz "...violação
    de regra em Aprimorado de/Requisitos (autorreferência, duplicata ou item em
    ambas as listas)" — deve passar a dizer "...violação de regra em Aprimorado
    de/Requisitos/Habilidades Adicionais (autorreferência, duplicata ou item em
    mais de uma das três listas)"; mesmo ajuste nos 3 controllers, em `create` e
    `update`).
  - `PUT /trainings/:id` (e equivalentes): mesmas mudanças de `POST`, mais a
    nuance do "trio efetivo" descrita na seção "Entidade"/serviço abaixo.
  - `GET /trainings/:id` (e equivalentes): resposta passa a incluir
    `additionalAbilities` resolvido.
  - `GET /trainings` (listagem paginada) e `DELETE /trainings/:id` (e
    equivalentes): **sem alteração de contrato** — `additionalAbilities` não
    aparece em `TrainingListItemResponseDto`/`PaginatedTrainingsResponseDto` (e
    equivalentes de `talents`/`characteristics`); `DELETE` continua simples, sem
    lógica de cascata manual.
  - `POST /techniques`, `GET /techniques`, `GET /techniques/:id`,
    `PUT /techniques/:id`, `DELETE /techniques/:id` e os 5 equivalentes de
    `/spells`: **sem nenhuma alteração** — Técnicas e Magias não são donas de
    `additionalAbilities` (item 5 do escopo confirmado).
- DTOs alterados: `CreateTrainingDto`, `TrainingResponseDto`, `CreateTalentDto`,
  `TalentResponseDto`, `CreateCharacteristicDto`, `CharacteristicResponseDto` (6
  arquivos; `Update*Dto` das 3 entidades herdam o campo automaticamente via
  `PartialType`, sem alteração de arquivo). Nenhum DTO novo é criado — reaproveita
  `EntityReferenceInputDto`/`EntityReferenceResponseDto` já existentes.
- Acesso Google: **read-only (padrão)** — mantém `@GoogleAccess('read-only')` já
  existente nos 3 controllers (`TrainingsController`, `TalentsController`,
  `CharacteristicsController`); usuários Google continuam bloqueados de
  `POST`/`PUT`/`DELETE` (incluindo adicionar/remover itens de
  `additionalAbilities`, que faz parte do corpo de `POST`/`PUT`) e liberados
  apenas para `GET`, conforme item 8 do escopo confirmado (nenhuma regra de
  acesso adicional).

#### Detalhamento da evolução de `EntityLinksService` (`entity-links.service.ts`)

**`validateLists` — nova assinatura, retrocompatível com `Technique`/`Spell`:**

```ts
validateLists(params: {
  ownerEntityType: ReferenceableEntityType;
  ownerId?: string;
  improvedFrom: EntityReferenceInputDto[];
  requirements: EntityReferenceInputDto[];
  additionalAbilities?: EntityReferenceInputDto[];
}): void
```

- `additionalAbilities` é **opcional** no parâmetro (`?`) e tratado internamente
  como `const additionalAbilities = params.additionalAbilities ?? [];`. Isso
  garante que `TechniquesService`/`SpellsService` — que nunca terão essa lista —
  continuem chamando `validateLists` exatamente como hoje, sem precisar passar
  o novo campo, sem quebrar em tempo de compilação nem de execução (o terceiro
  conjunto simplesmente ficará sempre vazio para essas duas entidades, o que não
  aciona nenhuma das validações abaixo).
- **Autorreferência (regra 2 do spec):** o `if (ownerId)` passa a iterar sobre
  `[...improvedFrom, ...requirements, ...additionalAbilities]` (hoje itera só
  sobre as duas primeiras). Mensagem atualizada: "Um item não pode ser
  Aprimorado de/Requisito/Habilidade Adicional de si mesmo." (era "...ser
  Aprimorado de/Requisito de si mesmo.").
  - Nota: para `Technique`/`Spell` (que não usam `additionalAbilities`,
    ownerEntityType nunca será `TRAINING`/`TALENT`/`CHARACTERISTIC` nesse
    contexto), o conjunto adicional vazio não altera o comportamento atual.
- **Duplicidade dentro da mesma lista (regra 3):** manter a lógica atual
  (`Set` por lista, lança ao encontrar chave repetida), duplicando o mesmo
  bloco para um terceiro `Set` (`additionalAbilitiesKeys`). Mensagem inalterada:
  "Um item não pode ser adicionado duas vezes à mesma lista."
- **Exclusividade mútua entre as três listas (regra 4 — "trio" em vez de
  "par"):** substituir a checagem atual de um único par
  (`improvedFromKeys` × `requirementsKeys`) por três checagens de par cruzado:
  `improvedFromKeys` × `requirementsKeys`, `improvedFromKeys` ×
  `additionalAbilitiesKeys`, `requirementsKeys` × `additionalAbilitiesKeys`.
  Mensagem única e genérica para as três checagens (evita repetir texto por
  par): "Um item não pode estar em mais de uma das listas Aprimorado de,
  Requisitos e Habilidades Adicionais ao mesmo tempo." (era "Um item não pode
  estar em Aprimorado de e em Requisitos ao mesmo tempo.").
  - Como `additionalAbilitiesKeys` é sempre vazio para `Technique`/`Spell`
    (parâmetro nunca informado), as duas checagens novas nunca disparam para
    essas duas entidades — comportamento delas permanece idêntico ao atual.
- `resolveReferences`: **sem alteração de assinatura ou lógica** (já é
  agnóstico de `linkType`/lista; só resolve uma lista de referências por vez).
  Apenas a mensagem de erro (`NotFoundException`) muda de "Um ou mais itens
  referenciados em Aprimorado de/Requisitos não foram encontrados." para "Um ou
  mais itens referenciados em Aprimorado de/Requisitos/Habilidades Adicionais
  não foram encontrados." (mesmo texto genérico compartilhado por todas as
  chamadas, incluindo as de `Technique`/`Spell` — aceitável, pois é só uma
  mensagem de fallback informativa, não trava nenhuma regra nova para essas
  entidades).
- `replaceLinks`: **sem alteração** (já recebe `linkType: EntityLinkType` como
  parâmetro explícito; basta os 3 serviços donos passarem
  `EntityLinkType.ADDITIONAL_ABILITY` numa terceira chamada).
- `loadReferencesFor`: **assinatura de parâmetros inalterada**
  (`ownerEntityType`, `ownerId`); tipo de retorno ganha um terceiro campo:
  ```ts
  Promise<{
    improvedFrom: EntityReferenceResponseDto[];
    requirements: EntityReferenceResponseDto[];
    additionalAbilities: EntityReferenceResponseDto[];
  }>
  ```
  A consulta `entityLinksRepository.find(...)` já busca **todas** as linhas do
  dono independentemente de `linkType` (não há `where: { linkType }` na query
  atual) — logo nenhuma alteração é necessária nas `relations` nem no `where`.
  Basta adicionar um terceiro filtro/mapeamento simétrico aos dois já
  existentes:
  ```ts
  const additionalAbilities = links
    .filter((link) => link.linkType === EntityLinkType.ADDITIONAL_ABILITY)
    .map(toResponse)
    .sort(sortByName);
  ```
  e incluir `additionalAbilities` no objeto retornado. Como `TechniquesService`/
  `SpellsService` hoje desestruturam apenas `{ improvedFrom, requirements }` do
  retorno dessa função, a propriedade extra é ignorada automaticamente — **não é
  necessário alterar `techniques.service.ts` nem `spells.service.ts`** para
  compilar ou funcionar corretamente.

**Chamada pelas 3 entidades donas (`TrainingsService`, `TalentsService`,
`CharacteristicsService`) — mesmo padrão em `create` e `update`, replicando
exatamente a estrutura hoje usada para o par `improvedFrom`/`requirements`
(ver `trainings.service.ts` como referência):**

- `create`: `additionalAbilitiesInput = dto.additionalAbilities ?? []`; incluir
  esse terceiro array na chamada de `validateLists` (novo parâmetro nomeado
  `additionalAbilities`); chamar
  `entityLinksService.resolveReferences(additionalAbilitiesInput)` junto das
  outras duas chamadas; após salvar o registro, chamar `replaceLinks(...,
  EntityLinkType.ADDITIONAL_ABILITY, additionalAbilitiesInput)` como terceira
  chamada (além das duas já existentes); montar a resposta final incluindo
  `additionalAbilities` vindo de `loadReferencesFor`.
- `update`: aplicar a mesma lógica de "par efetivo" já existente, agora como
  **"trio efetivo"**: se `dto.additionalAbilities` vier `undefined`, carregar a
  lista persistida via `loadReferencesFor` (já disponível no mesmo carregamento
  que hoje resolve `effectiveImprovedFrom`/`effectiveRequirements`) e convertê-la
  de volta para `EntityReferenceInputDto[]` (mesma transformação
  `{ entityType, id }` já aplicada às outras duas). Isso deve valer
  **independentemente** de quais das três vierem `undefined` — se só uma vier
  `undefined`, ou duas, ou nenhuma, a validação de exclusividade (regra 4)
  precisa sempre considerar o estado efetivo das três. Passar as três listas
  efetivas para `validateLists`. Chamar `resolveReferences`/`replaceLinks` para
  `additionalAbilities` apenas quando `dto.additionalAbilities !== undefined`
  (mesmo padrão condicional já usado para os outros dois campos — atualização
  parcial só substitui a(s) lista(s) efetivamente enviada(s) no `PUT`).
  Recarregar/montar a resposta final incluindo `additionalAbilities` da mesma
  forma que `create`.
- `findById`: passa a também retornar `additionalAbilities` (terceiro campo do
  objeto retornado por `loadReferencesFor`), incluído no objeto
  `TrainingWithReferences`/`TalentWithReferences`/`CharacteristicWithReferences`
  (interfaces já existentes nos 3 serviços — ganham o campo
  `additionalAbilities: EntityReferenceResponseDto[]`).
- `remove`: **sem alteração de código** — cascata de exclusão de
  `additionalAbilities` (regra 6 do spec) já garantida pelas mesmas FKs
  `ON DELETE CASCADE` que cobrem `improvedFrom`/`requirements`, pois é a mesma
  tabela `entity_links` e as mesmas colunas `owner_*_id`/`target_*_id` —
  independente do valor de `link_type` da linha.

**DTOs das 3 entidades donas (mesmo padrão em `Create<Entity>Dto` e
`<Entity>ResponseDto`, replicando exatamente o campo `requirements` já
existente, apenas trocando o nome):**

- `Create<Entity>Dto` (Training/Talent/Characteristic) ganha, logo após
  `requirements?`:
  ```ts
  @ApiPropertyOptional({
    type: () => [EntityReferenceInputDto],
    description:
      'Habilidades adicionais associadas a este(a) <entidade>. Não pode referenciar a si mesmo, conter duplicatas ou estar simultaneamente em Aprimorado de ou em Requisitos.',
    example: [{ entityType: 'technique', id: '550e8400-e29b-41d4-a716-446655440002' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityReferenceInputDto)
  additionalAbilities?: EntityReferenceInputDto[];
  ```
  (texto de `description` ajustado para "este treinamento"/"este talento"/"esta
  característica" em cada uma das 3 entidades, seguindo o mesmo padrão de
  gênero/artigo já usado nos textos de `improvedFrom`/`requirements` de cada
  uma).
- `<Entity>ResponseDto` (usada em `POST`, `GET /:id`, `PUT`) ganha, logo após
  `requirements`:
  ```ts
  @ApiProperty({
    type: () => [EntityReferenceResponseDto],
    description: 'Habilidades adicionais associadas a este(a) <entidade>',
  })
  additionalAbilities: EntityReferenceResponseDto[];
  ```
  e `static fromEntity` ganha um terceiro parâmetro
  `additionalAbilities: EntityReferenceResponseDto[]`, atribuído a
  `dto.additionalAbilities`, mantendo a mesma ordem de parâmetros já usada
  (entidade, improvedFrom, requirements, **additionalAbilities**).
- `<Entity>ListItemResponseDto` / `Paginated<Entity>sResponseDto` das 3
  entidades: **sem alteração** — `additionalAbilities`, assim como
  `improvedFrom`/`requirements` hoje, só aparece no endpoint de detalhe (item 6
  do escopo confirmado do spec).

Status: concluído
Entidade: nenhuma (alteração restrita ao enum `EntityLinkType` e à camada de
aplicação — ver `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`)
Migration: `app-api/src/database/migrations/1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`
Rotas: POST /trainings, GET /trainings/:id, PUT /trainings/:id, POST /talents,
GET /talents/:id, PUT /talents/:id, POST /characteristics,
GET /characteristics/:id, PUT /characteristics/:id (contratos alterados, nenhuma
rota nova)
Arquivos:
- app-api/src/modules/entity-links/enums/entity-link-type.enum.ts
- app-api/src/modules/entity-links/entity-links.service.ts
- app-api/src/modules/trainings/dto/create-training.dto.ts
- app-api/src/modules/trainings/dto/training-response.dto.ts
- app-api/src/modules/trainings/trainings.service.ts
- app-api/src/modules/trainings/trainings.controller.ts
- app-api/src/modules/talents/dto/create-talent.dto.ts
- app-api/src/modules/talents/dto/talent-response.dto.ts
- app-api/src/modules/talents/talents.service.ts
- app-api/src/modules/talents/talents.controller.ts
- app-api/src/modules/characteristics/dto/create-characteristic.dto.ts
- app-api/src/modules/characteristics/dto/characteristic-response.dto.ts
- app-api/src/modules/characteristics/characteristics.service.ts
- app-api/src/modules/characteristics/characteristics.controller.ts
- `update-training.dto.ts`/`update-talent.dto.ts`/`update-characteristic.dto.ts`:
  sem alteração de código (herdam `additionalAbilities?` via `PartialType`)
- `app-api/src/modules/techniques/**` e `app-api/src/modules/spells/**`: não
  tocados, conforme escopo

### 2. api-dev-doc
- Status: concluído
- Depende da etapa 1.
- Cobrir no Swagger, seguindo o padrão já usado para `improvedFrom`/
  `requirements`:
  - Em `Create<Entity>Dto`/`Update<Entity>Dto` das 3 entidades donas
    (`trainings`, `talents`, `characteristics`): revisar/completar o
    `@ApiPropertyOptional` de `additionalAbilities` (texto em pt-BR explicando o
    formato esperado — array de `{ entityType, id }` — e as três regras de
    bloqueio: autorreferência, duplicidade, exclusividade com `improvedFrom` e
    `requirements`).
  - Em `<Entity>ResponseDto` das 3 entidades: revisar/completar o `@ApiProperty`
    de `additionalAbilities`.
  - Atualizar o texto de `@ApiConflictResponse`/`@ApiNotFoundResponse`/
    `@ApiBadRequestResponse` nos 3 controllers (`create` e `update`) para
    mencionar "Habilidades Adicionais" junto de "Aprimorado de"/"Requisitos",
    caso a etapa 1 não tenha finalizado esse texto por completo.
  - Confirmar que a listagem paginada (`GET` sem `:id`) das 3 entidades
    permanece documentada sem `additionalAbilities`, já que só aparece no
    endpoint de detalhe.
  - Confirmar que nenhum schema/endpoint de `techniques`/`spells` foi tocado ou
    precisa de atualização de documentação (essas duas entidades não ganham a
    propriedade).
  - Revisar se o `enumName`/`description` de `ReferenceableEntityType` em
    `EntityReferenceInputDto`/`EntityReferenceResponseDto` (módulo
    `entity-links`) já cobre corretamente as 5 entidades como possíveis alvos
    (já cobre — nenhuma alteração de texto esperada aqui, apenas confirmação).

### 3. api-dev-codereviewer
- Status: concluído
- Revisar tudo acima, com atenção especial a:
  - `EntityLinkType.ADDITIONAL_ABILITY` adicionado sem remover/reordenar os dois
    valores existentes (ordem/valores de `IMPROVED_FROM`/`REQUIREMENT`
    preservados).
  - A migration `AddAdditionalAbilityToEntityLinksLinkTypeEnum`: `up()` usa
    `ALTER TYPE ... ADD VALUE` corretamente qualificado com schema
    (`"public"."entity_links_link_type_enum"`); `down()` executa, na ordem
    exata especificada (delete das linhas com o valor novo → rename do tipo
    antigo → create do tipo novo com só os 2 valores originais → alter column
    com `USING` cast → drop do tipo renomeado), restaurando o estado
    bit-a-bit produzido por `CreateEntityLinks`. Nenhuma coluna, `CHECK`,
    `UNIQUE` ou índice de `entity_links` foi alterado por esta migration (só o
    tipo enum da coluna `link_type`).
  - `validateLists`: `additionalAbilities` realmente opcional na assinatura
    (retrocompatibilidade com as chamadas existentes de
    `TechniquesService`/`SpellsService`, que não devem ter sido alteradas);
    autorreferência, duplicidade e exclusividade mútua realmente cobrindo as
    três listas quando presentes, sem alterar o comportamento observável para
    `Technique`/`Spell` (que nunca passam o terceiro parâmetro).
  - `update()` das 3 entidades donas: "trio efetivo" corretamente calculado —
    qualquer uma das três listas ausente no `PUT` deve ser substituída pela
    versão persistida (via `loadReferencesFor`) antes de `validateLists`,
    cobrindo os cenários de 1, 2 ou 3 campos ausentes simultaneamente, não só o
    caso de exatamente um campo ausente.
  - `additionalAbilities` presente apenas no endpoint de detalhe (`POST`,
    `PUT`, `GET /:id`) das 3 entidades donas — confirmar que
    `TrainingListItemResponseDto`/`TalentListItemResponseDto`/
    `CharacteristicListItemResponseDto` e os 3 `Paginated*ResponseDto`
    correspondentes não foram alterados.
  - Nenhum arquivo de `app-api/src/modules/techniques/` ou
    `app-api/src/modules/spells/` foi alterado.
  - Cascata de exclusão: `remove()` das 5 entidades (`training`/`talent`/
    `characteristic`/`technique`/`spell`) permanece sem lógica adicional; a
    exclusão de qualquer uma delas continua limpando automaticamente qualquer
    linha de `entity_links` que a referencie como alvo de
    `additionalAbilities`, via as mesmas FKs `ON DELETE CASCADE` já existentes
    (nenhuma FK nova foi necessária para isso).
  - Mensagens de erro em pt-BR atualizadas de forma consistente nas 3 (não
    parcialmente) — `NotFoundException` de referência inexistente,
    `ConflictException` de autorreferência e `ConflictException` de
    exclusividade entre listas — sem deixar nenhuma delas mencionando só
    "Aprimorado de/Requisitos" enquanto outra já foi atualizada.
  - `@GoogleAccess('read-only')` inalterado nos 3 controllers (nenhum novo nível
    de acesso introduzido).
  - Nenhum código fora do escopo planejado (sem endpoint novo, sem relação
    bidirecional, sem alteração em `app-web`).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. Revisão conduzida
comparando cada arquivo tocado pelas etapas 1 (`api-dev`) e 2 (`api-dev-doc`) — ambas
efetivamente concluídas — contra o plano acordado em `task-api.md`, as regras de
negócio de `spec.md` e os padrões de `CLAUDE.md`.

Pontos de maior risco verificados em detalhe:

- **Migration `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`**:
  `up()` usa `ALTER TYPE "public"."entity_links_link_type_enum" ADD VALUE
  'additional_ability'` corretamente qualificado com schema, sem tocar em nenhuma
  coluna/`CHECK`/`UNIQUE`/índice de `entity_links`. `down()` segue exatamente a
  sequência fechada no planejamento e na ordem correta: (1) `DELETE FROM
  "entity_links" WHERE "link_type" = 'additional_ability'` (com comentário no corpo
  da migration documentando que é destrutivo), (2) `RENAME` do tipo para
  `_old`, (3) `CREATE TYPE` com só os dois valores originais
  (`'improved_from', 'requirement'`), (4) `ALTER TABLE ... ALTER COLUMN ... USING
  "link_type"::text::"public"."entity_links_link_type_enum"`, (5) `DROP TYPE
  ..._old`. Restaura bit a bit o estado produzido por
  `1784306060000-CreateEntityLinks.ts` (mesmo nome de tipo, mesmos dois valores,
  mesma coluna apontando para ele). Nenhuma indicação, em `data-source.ts`,
  `configuration.ts`, `.env.example` ou em qualquer `docker-compose`/manifesto do
  repositório, de uma versão do Postgres anterior à 12 — não há motivo para
  bloquear a aplicação de `ALTER TYPE ... ADD VALUE` dentro da transação usada pelo
  `migration:run` do TypeORM.
- **`EntityLinkType`**: `ADDITIONAL_ABILITY = 'additional_ability'` adicionado como
  terceiro valor, preservando `IMPROVED_FROM`/`REQUIREMENT` na mesma ordem/valores
  originais.
- **`validateLists` (`entity-links.service.ts`)**: `additionalAbilities` é opcional
  na assinatura (`params.additionalAbilities ?? []`); a checagem de autorreferência
  itera `[...improvedFrom, ...requirements, ...additionalAbilities]`; duplicidade é
  checada com um terceiro `Set` (`additionalAbilitiesKeys`); a exclusividade mútua
  cobre os três pares cruzados (`improvedFrom`×`requirements`,
  `improvedFrom`×`additionalAbilities`, `requirements`×`additionalAbilities`) com a
  mensagem genérica "Um item não pode estar em mais de uma das listas Aprimorado de,
  Requisitos e Habilidades Adicionais ao mesmo tempo.". `TechniquesService`
  (`techniques.service.ts`) e `SpellsService` (`spells.service.ts`) continuam
  chamando `validateLists` só com `improvedFrom`/`requirements`, sem o terceiro
  parâmetro, e não foram alterados — retrocompatibilidade confirmada, sem regressão
  observável (o conjunto adicional fica sempre vazio para essas duas entidades).
  `loadReferencesFor` ganhou o terceiro campo `additionalAbilities` no retorno sem
  alterar `where`/`relations`; como `TechniquesService`/`SpellsService` desestruturam
  só `{ improvedFrom, requirements }`, a propriedade extra é ignorada normalmente.
- **"Trio efetivo" em `update()`** de `TrainingsService`, `TalentsService` e
  `CharacteristicsService`: as três variáveis efetivas
  (`effectiveImprovedFrom`/`effectiveRequirements`/`effectiveAdditionalAbilities`)
  são inicializadas a partir do DTO e, se qualquer uma das três vier `undefined`, o
  bloco único de `loadReferencesFor` é chamado uma vez e cada campo ainda
  `undefined` é preenchido individualmente a partir da lista persistida — cobrindo
  corretamente os cenários de 1, 2 ou 3 campos ausentes simultaneamente no `PUT`,
  não apenas o caso de exatamente um ausente. `resolveReferences`/`replaceLinks`
  para `additionalAbilities` só são chamados quando `dto.additionalAbilities !==
  undefined`, mesmo padrão condicional das outras duas listas. As três services
  (`trainings.service.ts`, `talents.service.ts`, `characteristics.service.ts`)
  replicam exatamente o mesmo padrão.
- **Exposição de `additionalAbilities` apenas no detalhe**: presente em
  `CreateTrainingDto`/`CreateTalentDto`/`CreateCharacteristicDto`,
  `TrainingResponseDto`/`TalentResponseDto`/`CharacteristicResponseDto` (com
  `fromEntity` recebendo o terceiro parâmetro na ordem `entidade, improvedFrom,
  requirements, additionalAbilities`) e usado em `POST`/`GET :id`/`PUT` dos 3
  controllers; ausente em `TrainingListItemResponseDto`/
  `TalentListItemResponseDto`/`CharacteristicListItemResponseDto` e nos 3
  `Paginated*ResponseDto` correspondentes, confirmado por leitura direta desses 6
  arquivos.
- **Escopo de `techniques`/`spells`**: `techniques.service.ts`,
  `techniques.controller.ts`, `spells.service.ts`, `spells.controller.ts` e seus
  DTOs não fazem nenhuma menção a `additionalAbilities`/"Habilidades Adicionais";
  os textos de `@ApiConflictResponse`/`@ApiNotFoundResponse`/`@ApiBadRequestResponse`
  desses dois controllers permanecem com a redação antiga ("...Aprimorado de/
  Requisitos (autorreferência, duplicata ou item em ambas as listas)"), consistente
  com a decisão de não tocar nesses módulos.
- **Cascata de exclusão**: `remove()` das 5 entidades permanece um `delete` simples
  sem lógica adicional; a integridade é garantida pelas mesmas FKs `ON DELETE
  CASCADE` (`owner_*_id`/`target_*_id`) já existentes em `EntityLink`, que não foi
  alterada nesta task.
- **Mensagens de erro em pt-BR**: as três mensagens afetadas (`NotFoundException`
  de referência inexistente, `ConflictException` de autorreferência,
  `ConflictException` de exclusividade) foram atualizadas de forma consistente nas
  três ocorrências dentro de `entity-links.service.ts`, sem nenhuma menção
  remanescente só a "Aprimorado de/Requisitos" nesse arquivo.
- **`@GoogleAccess('read-only')`**: inalterado nos 3 controllers
  (`TrainingsController`, `TalentsController`, `CharacteristicsController`), sem
  novo nível de acesso introduzido.
- **Fora de escopo**: nenhum endpoint novo, nenhuma relação bidirecional, nenhuma
  coluna/relação TypeORM nova em `EntityLink` ou nas 5 entidades de domínio, e
  nenhuma alteração em `app-web` identificada nos arquivos revisados.

Arquivos revisados:
`app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`,
`app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/entity-links/entities/entity-link.entity.ts`,
`app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-response.dto.ts`,
`app-api/src/database/migrations/1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`,
`app-api/src/database/migrations/1784306060000-CreateEntityLinks.ts` (referência),
`app-api/src/modules/trainings/dto/create-training.dto.ts`,
`app-api/src/modules/trainings/dto/training-response.dto.ts`,
`app-api/src/modules/trainings/dto/training-list-item-response.dto.ts`,
`app-api/src/modules/trainings/dto/paginated-trainings-response.dto.ts`,
`app-api/src/modules/trainings/dto/update-training.dto.ts`,
`app-api/src/modules/trainings/trainings.service.ts`,
`app-api/src/modules/trainings/trainings.controller.ts`,
`app-api/src/modules/talents/dto/create-talent.dto.ts`,
`app-api/src/modules/talents/dto/talent-response.dto.ts`,
`app-api/src/modules/talents/dto/talent-list-item-response.dto.ts`,
`app-api/src/modules/talents/dto/paginated-talents-response.dto.ts`,
`app-api/src/modules/talents/dto/update-talent.dto.ts`,
`app-api/src/modules/talents/talents.service.ts`,
`app-api/src/modules/talents/talents.controller.ts`,
`app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
`app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`,
`app-api/src/modules/characteristics/dto/characteristic-list-item-response.dto.ts`,
`app-api/src/modules/characteristics/dto/paginated-characteristics-response.dto.ts`,
`app-api/src/modules/characteristics/dto/update-characteristic.dto.ts`,
`app-api/src/modules/characteristics/characteristics.service.ts`,
`app-api/src/modules/characteristics/characteristics.controller.ts`,
`app-api/src/modules/techniques/techniques.service.ts`,
`app-api/src/modules/techniques/techniques.controller.ts` (confirmação de não
alteração), `app-api/src/modules/spells/spells.service.ts`,
`app-api/src/modules/spells/spells.controller.ts` (confirmação de não alteração).