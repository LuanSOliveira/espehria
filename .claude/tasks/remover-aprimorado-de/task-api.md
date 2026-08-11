# Task API: Remover propriedade "Aprimorado de" das Habilidades

## Contexto
Não existe `spec.md` para esta demanda. Escopo confirmado diretamente pelo usuário: remover
completamente a propriedade "Aprimorado de" (`improvedFrom` / `EntityLinkType.IMPROVED_FROM`) das 5
entidades "Habilidades" — Treinamento, Talento, Característica, Técnica e Magia — sem deixar código
morto, DTOs, validações ou textos de documentação que ainda referenciem o conceito.

Investigação confirmada em `app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/{trainings,talents,characteristics,techniques,spells}/{*.service.ts,dto/*.ts,*.controller.ts}`
e `app-api/src/modules/biographies/biographies.service.ts`. `IMPROVED_FROM` não é referenciado por
nenhuma entidade fora dessas 5 (Biografia **não tem** `improvedFrom` próprio, mas seu service chama
`EntityLinksService.validateLists` passando `improvedFrom: []` só para satisfazer a assinatura atual
— ver detalhe na subseção Controller).

## Etapas

### 1. api-dev
Status: concluído

Entidade: `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts` (valor
`IMPROVED_FROM` removido; enum passa a conter apenas `REQUIREMENT` e
`ADDITIONAL_ABILITY`). Nenhuma coluna de nenhuma entidade TypeORM foi alterada.

Migration: `app-api/src/database/migrations/1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`
(nova — **apenas criada, `npm run migration:run` NÃO foi executado**, conforme
restrição do usuário; `up()` deleta as linhas `link_type = 'improved_from'` antes de
recriar o enum sem esse valor; `down()` recria o valor no enum mas documenta em
comentário que não restaura os dados apagados). As migrations históricas
`1784306060000-CreateEntityLinks.ts` e
`1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts` não foram alteradas.

Rotas: nenhuma rota HTTP criada/removida/renomeada — mesmos endpoints CRUD de sempre em
`trainings`, `talents`, `characteristics`, `techniques` e `spells`
(`POST/GET/GET :id/PUT :id/DELETE :id`), apenas com o campo `improvedFrom` removido de
entrada e saída.

Arquivos alterados:
- `app-api/src/modules/entity-links/entity-links.service.ts` (`validateLists` sem
  `improvedFrom`, exclusividade agora só entre `requirements`/`additionalAbilities`;
  `loadReferencesFor` sem `improvedFrom`; mensagens de `resolveReferences` atualizadas)
- `app-api/src/modules/trainings/trainings.service.ts`,
  `app-api/src/modules/trainings/trainings.controller.ts`,
  `app-api/src/modules/trainings/dto/create-training.dto.ts`,
  `app-api/src/modules/trainings/dto/training-response.dto.ts`
- `app-api/src/modules/talents/talents.service.ts`,
  `app-api/src/modules/talents/talents.controller.ts`,
  `app-api/src/modules/talents/dto/create-talent.dto.ts`,
  `app-api/src/modules/talents/dto/talent-response.dto.ts`
- `app-api/src/modules/characteristics/characteristics.service.ts`,
  `app-api/src/modules/characteristics/characteristics.controller.ts`,
  `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
  `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`
- `app-api/src/modules/techniques/techniques.service.ts`,
  `app-api/src/modules/techniques/techniques.controller.ts`,
  `app-api/src/modules/techniques/dto/create-technique.dto.ts`,
  `app-api/src/modules/techniques/dto/technique-response.dto.ts`
- `app-api/src/modules/spells/spells.service.ts`,
  `app-api/src/modules/spells/spells.controller.ts`,
  `app-api/src/modules/spells/dto/create-spell.dto.ts`,
  `app-api/src/modules/spells/dto/spell-response.dto.ts`
- `app-api/src/modules/biographies/biographies.service.ts` (dois call sites de
  `validateLists` ajustados, removendo `improvedFrom: []`)

Desvios em relação ao plano: nenhum. Todas as mensagens de erro, assinaturas de método
e descrições de DTO foram atualizadas exatamente conforme especificado na seção. Uma
grep final por `improvedFrom|improved_from|IMPROVED_FROM|Aprimorado` em `app-api/src`
confirma que as únicas ocorrências remanescentes estão nas migrations históricas
(`1784306060000-CreateEntityLinks.ts`, `1784306150000-...enum.ts`) e na migration nova
desta demanda — nenhuma referência viva fora de `src/database/migrations/`.

#### Entidade

Nenhuma entidade TypeORM ganha ou perde colunas. A única mudança de "modelo" é a remoção do valor
`IMPROVED_FROM = 'improved_from'` do enum `EntityLinkType`
(`app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`), que passa a conter apenas
`REQUIREMENT = 'requirement'` e `ADDITIONAL_ABILITY = 'additional_ability'`. A entidade `EntityLink`
(`app-api/src/modules/entity-links/entities/entity-link.entity.ts`) não precisa de alteração — a
coluna `linkType` já é tipada genericamente como `EntityLinkType` e as colunas `owner*`/`target*` são
compartilhadas pelos três tipos de link, não específicas de `improved_from`.

Nenhum DTO/utilitário genérico de `entity-links` (`EntityReferenceInputDto`,
`EntityReferenceResponseDto`, `ReferenceableEntityType`) é exclusivo de `improvedFrom` — todos são
compartilhados com `requirements`/`additionalAbilities` e devem permanecer intactos.

#### Migration

Necessária: **sim**. Em Postgres não é possível remover um valor de um tipo `ENUM` diretamente
(`ALTER TYPE ... DROP VALUE` não existe) — é preciso recriar o tipo, seguindo exatamente o padrão já
usado no `down()` de `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts` (RENAME do tipo
atual → CREATE TYPE novo sem o valor → ALTER COLUMN ... USING ... → DROP TYPE antigo).

**Nome do arquivo**: como já existem 2 migrations de uma demanda anterior (`ficha-habilidades`) ainda
não executadas —
`app-api/src/database/migrations/1784306550000-CreateSheetTrainingSlotsTable.ts` e
`app-api/src/database/migrations/1784306560000-CreateSheetAbilityExtrasTable.ts` — a nova migration
desta demanda entra na fila **depois** delas. Usar timestamp `1784306570000`:
`app-api/src/database/migrations/1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`.

**`up()`** (nesta ordem):
1. `DELETE FROM "entity_links" WHERE "link_type" = 'improved_from'` — obrigatório antes do `ALTER
   COLUMN`, senão a conversão de tipo falha para qualquer linha que ainda use o valor removido.
2. `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO
   "entity_links_link_type_enum_old"`.
3. `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('requirement',
   'additional_ability')` — sem `'improved_from'`.
4. `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE
   "public"."entity_links_link_type_enum" USING
   "link_type"::text::"public"."entity_links_link_type_enum"`.
5. `DROP TYPE "public"."entity_links_link_type_enum_old"`.

**`down()`** — documentar explicitamente no comentário do método (e sinalizar aqui) que ele
**recria o valor `'improved_from'` no enum, mas não restaura as linhas apagadas pelo `DELETE` do
`up()`** (perda de dados irreversível, mesmo padrão já aceito no `down()` de
`1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts` para `'additional_ability'`):
1. `ALTER TYPE "public"."entity_links_link_type_enum" RENAME TO
   "entity_links_link_type_enum_old"`.
2. `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement',
   'additional_ability')`.
3. `ALTER TABLE "entity_links" ALTER COLUMN "link_type" TYPE
   "public"."entity_links_link_type_enum" USING
   "link_type"::text::"public"."entity_links_link_type_enum"`.
4. `DROP TYPE "public"."entity_links_link_type_enum_old"`.

**Restrição obrigatória**: o api-dev deve apenas **criar** o arquivo de migration
(`npm run migration:generate` não se aplica aqui, pois é uma migration de dado/enum escrita à mão,
seguindo o padrão das duas migrations históricas citadas — usar o mesmo `MigrationInterface`/queries
manuais). **Não executar `npm run migration:run` em nenhuma hipótese.** O usuário roda todas as
migrations pendentes manualmente (as 2 de `ficha-habilidades` + esta) depois de revisar. Não editar as
migrations históricas (`1784306060000-CreateEntityLinks.ts` e
`1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`) — elas continuam representando o
histórico já aplicado.

#### Controller

Não há criação/alteração de rotas HTTP (mesmos endpoints CRUD de sempre nos 5 módulos) — a mudança é
inteiramente na remoção de um campo de entrada/saída e no ajuste da lógica de validação de
exclusividade mútua que hoje envolve 3 (ou 2) listas. Alterar, em cada um dos 5 módulos:

**`app-api/src/modules/entity-links/entity-links.service.ts`**:
- `validateLists`: remover o parâmetro `improvedFrom` da assinatura (que passa a ser
  `{ ownerEntityType; ownerId?; requirements: EntityReferenceInputDto[]; additionalAbilities?:
  EntityReferenceInputDto[] }`, com `additionalAbilities` continuando opcional/`?? []` como já é
  hoje). Remover o bloco de coleta/checagem de `improvedFromKeys` e a checagem de exclusividade contra
  ele. Resultado: exclusividade mútua passa a ser **só entre `requirements` e `additionalAbilities`**
  (uma única checagem, não duas). Para Técnica e Magia, que só têm `requirements`, o chamador
  simplesmente não passa `additionalAbilities` (fica `undefined`/`[]` pelo default já existente) —
  **não é necessário nenhum branch especial nem função separada**: a mesma `validateLists` genérica
  continua válida para os 5 casos, apenas com a checagem de exclusividade tornando-se um no-op natural
  quando só há uma lista. Atualizar as mensagens de erro para remover "Aprimorado de":
  - Self-reference: `'Um item não pode ser Requisito ou Habilidade Adicional de si mesmo.'`
  - Exclusividade mútua: `'Um item não pode estar em Requisitos e Habilidades Adicionais ao mesmo
    tempo.'`
- `loadReferencesFor`: remover `improvedFrom` do tipo de retorno, do filtro
  `.filter((link) => link.linkType === EntityLinkType.IMPROVED_FROM)` e do objeto retornado — retorna
  só `{ requirements, additionalAbilities }`.
- `resolveReferences`: atualizar as duas mensagens de `NotFoundException` removendo "Aprimorado de"
  (`'Um ou mais itens referenciados em Requisitos/Habilidades Adicionais não foram encontrados.'`).
- `loadLinksForOwnersBatched`: nenhuma alteração estrutural — já recebe `linkTypes` como parâmetro
  genérico, sem hardcode de `IMPROVED_FROM`; apenas deixa de poder receber esse valor (o enum não o
  tem mais).

**Nos 5 services** (`trainings.service.ts`, `talents.service.ts`, `characteristics.service.ts`,
`techniques.service.ts`, `spells.service.ts`):
- Remover `improvedFrom` das interfaces `*WithReferences` (`TrainingWithReferences`,
  `TalentWithReferences`, `CharacteristicWithReferences`, `TechniqueWithReferences`,
  `SpellWithReferences`).
- Em `findById`/`create`/`update`: remover a desestruturação de `improvedFrom` de
  `loadReferencesFor(...)`, remover `improvedFromInput`/`effectiveImprovedFrom` (inclusive o ramo que
  recarrega o valor atual via `current.improvedFrom` em updates parciais), remover a chamada a
  `entityLinksService.resolveReferences(improvedFromInput)`, remover a chamada a
  `entityLinksService.replaceLinks(..., EntityLinkType.IMPROVED_FROM, ...)`, remover `improvedFrom` do
  objeto passado para `validateLists` e do objeto de retorno do método.
- Em Treinamento/Talento/Característica (as 3 com `additionalAbilities`): a chamada a
  `validateLists` passa a enviar só `requirements`/`additionalAbilities` (sem `improvedFrom`).
- Em Técnica/Magia (só `requirements`): a chamada a `validateLists` passa a enviar só `requirements` —
  **sem `additionalAbilities`**, aproveitando o parâmetro opcional; não introduzir nenhuma lógica
  condicional nova, é a mesma função genérica.

**`app-api/src/modules/biographies/biographies.service.ts`** (fora da lista original de 12
referências, mas impactado pela mudança de assinatura de `validateLists`): Biografia não tem
`improvedFrom` nem `requirements` próprios, mas hoje chama `validateLists` duas vezes (linhas ~141 e
~341) passando `improvedFrom: [], requirements: []` só para satisfazer a assinatura atual e obter a
checagem de auto-referência/duplicidade/exclusividade de `additionalAbilities`. Ajustar as duas
chamadas para remover a propriedade `improvedFrom: []` (mantendo `requirements: []`, que Biografia
continua sem usar de fato, e `additionalAbilities`).

**Nos 5 controllers e nos DTOs de cada módulo**:
- `dto/create-*.dto.ts`: remover o campo `improvedFrom` (`@ApiPropertyOptional`, `@IsOptional`,
  `@IsArray`, `@ValidateNested`, `@Type(() => EntityReferenceInputDto)`). Nas descrições restantes de
  `requirements`/`additionalAbilities`, remover a menção a "Aprimorado de" (ex.: em
  `create-training.dto.ts`, a descrição de `requirements` hoje diz "...ou estar simultaneamente em
  Aprimorado de" e a de `additionalAbilities` diz "...ou em Requisitos" citando as duas — atualizar
  para refletir só a exclusividade remanescente entre `requirements` e `additionalAbilities`; em
  Técnica/Magia, a descrição de `requirements` não deve mais citar exclusividade com nenhuma outra
  lista).
- `dto/update-*.dto.ts`: são todos `PartialType(Create*Dto)` — nenhuma alteração direta necessária,
  refletem automaticamente a remoção feita no DTO de create.
- `dto/*-response.dto.ts`: remover a propriedade `improvedFrom` (`@ApiProperty` + campo), removê-la da
  assinatura do parâmetro `references`/equivalente de `fromEntity(...)` e da atribuição
  `dto.improvedFrom = references.improvedFrom`.
- `*.controller.ts`: remover `improvedFrom` de qualquer chamada a `*ResponseDto.fromEntity(...)` que
  hoje o repasse, e atualizar as strings de `@ApiConflictResponse`/`@ApiBadRequestResponse`/
  `@ApiOperation` que hoje mencionam "Aprimorado de" (mensagens do tipo "...entidades referenciadas em
  Aprimorado de/Requisitos/Habilidades Adicionais...") para citar só Requisitos/Habilidades
  Adicionais.

**Acesso Google**: nenhuma alteração — os 5 controllers continuam com o nível de acesso já vigente
(`@GoogleAccess('read-only')` sobre `@UseGuards(JwtAuthGuard, GoogleAccessGuard)`, confirmado em
`trainings.controller.ts`), esta demanda não altera regras de permissão, apenas remove um campo.

**Checklist de arquivos a tocar (api-dev)**:
- `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`
- `app-api/src/modules/entity-links/entity-links.service.ts`
- `app-api/src/database/migrations/1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts` (novo)
- `app-api/src/modules/trainings/trainings.service.ts`,
  `app-api/src/modules/trainings/trainings.controller.ts`,
  `app-api/src/modules/trainings/dto/create-training.dto.ts`,
  `app-api/src/modules/trainings/dto/training-response.dto.ts`
- `app-api/src/modules/talents/talents.service.ts`,
  `app-api/src/modules/talents/talents.controller.ts`,
  `app-api/src/modules/talents/dto/create-talent.dto.ts`,
  `app-api/src/modules/talents/dto/talent-response.dto.ts`
- `app-api/src/modules/characteristics/characteristics.service.ts`,
  `app-api/src/modules/characteristics/characteristics.controller.ts`,
  `app-api/src/modules/characteristics/dto/create-characteristic.dto.ts`,
  `app-api/src/modules/characteristics/dto/characteristic-response.dto.ts`
- `app-api/src/modules/techniques/techniques.service.ts`,
  `app-api/src/modules/techniques/techniques.controller.ts`,
  `app-api/src/modules/techniques/dto/create-technique.dto.ts`,
  `app-api/src/modules/techniques/dto/technique-response.dto.ts`
- `app-api/src/modules/spells/spells.service.ts`, `app-api/src/modules/spells/spells.controller.ts`,
  `app-api/src/modules/spells/dto/create-spell.dto.ts`,
  `app-api/src/modules/spells/dto/spell-response.dto.ts`
- `app-api/src/modules/biographies/biographies.service.ts` (só os dois call sites de `validateLists`)

Recomenda-se, ao final, rodar `grep -ri "improvedFrom\|improved_from\|IMPROVED_FROM"` em
`app-api/src` (excluindo `src/database/migrations/`, que preserva o histórico) para confirmar que não
sobrou nenhuma referência viva.

### 2. api-dev-doc
Status: concluído
- Depende da etapa 1.
- Conferir que o Swagger (`/docs`) não expõe mais `improvedFrom` em nenhum `@ApiProperty` de
  create/update/response dos 5 módulos, e que nenhuma descrição remanescente (DTOs, `@ApiOperation`,
  `@ApiConflictResponse`, `@ApiBadRequestResponse`) menciona "Aprimorado de".
- Revisar se as descrições de `requirements`/`additionalAbilities` continuam corretas e coerentes após
  a simplificação da regra de exclusividade (2 listas em Treinamento/Talento/Característica; nenhuma
  exclusividade a documentar em Técnica/Magia, que só têm `requirements`).

**Resumo da verificação realizada:**
- DTOs (create/response) dos 5 módulos: Nenhum campo `improvedFrom`/`@ApiPropertyOptional` órfão encontrado.
- Descrições em `@ApiProperty`, `@ApiOperation`, `@ApiConflictResponse`, `@ApiBadRequestResponse`: Nenhuma menção a "Aprimorado de" ou `improvedFrom` fora das migrations históricas.
- Treinamento, Talento, Característica (com 2 listas): Descrições de `requirements` e `additionalAbilities` refletem corretamente a exclusividade mútua entre as duas listas.
- Técnica, Magia (apenas `requirements`): Descrição de `requirements` correta, sem menção a exclusividade com nenhuma outra lista.
- Entity-links service: `validateLists`, `loadReferencesFor` e `resolveReferences` atualizadas corretamente, sem resquício de `improvedFrom`.
- Grep final: Todos os resíduos de `improvedFrom`/`improved_from`/`IMPROVED_FROM`/`Aprimorado` estão apenas em migrations históricas (conforme esperado).

### 3. api-dev-codereviewer
Status: concluído
- Revisar tudo acima, com atenção especial a:
  - Nenhuma referência residual a `improvedFrom`/`IMPROVED_FROM`/"Aprimorado de" fora de
    `src/database/migrations/` (histórico).
  - `validateLists` genérica continua correta para os 5 casos (2 listas em
    Treinamento/Talento/Característica, 1 lista em Técnica/Magia), sem branch especial nem função
    duplicada, e sem regressão na checagem de auto-referência/duplicidade.
  - `biographies.service.ts` ajustado corretamente (não quebra a validação de
    `additionalAbilities`/auto-referência que Biografia depende de `validateLists`).
  - Migration nova: ordem correta das queries (`DELETE` antes do `ALTER TYPE`), nome/timestamp
    posicionado corretamente após as 2 migrations pendentes de `ficha-habilidades`
    (`1784306550000`/`1784306560000`), `down()` documentando explicitamente a perda de dados
    irreversível, e confirmação de que as migrations históricas
    (`1784306060000-CreateEntityLinks.ts`, `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`)
    não foram alteradas.
  - Confirmar que o api-dev **não** executou `npm run migration:run`.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas:
- **Grep global** por `improvedFrom|improved_from|IMPROVED_FROM|Aprimorado` em todo `app-api/src`
  (incluindo `test/`) confirma que as únicas ocorrências remanescentes estão nas migrations
  históricas (`1784306060000-CreateEntityLinks.ts`, `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`)
  e na migration nova desta demanda (`1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`) —
  nenhuma referência viva fora de `src/database/migrations/`.
- **Enum** `app-api/src/modules/entity-links/enums/entity-link-type.enum.ts` contém apenas
  `REQUIREMENT = 'requirement'` e `ADDITIONAL_ABILITY = 'additional_ability'`, conforme especificado.
- **Migration nova** (`1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`):
  - `up()` executa `DELETE FROM "entity_links" WHERE "link_type" = 'improved_from'` antes do
    RENAME/CREATE/ALTER/DROP do enum — ordem correta, evita falha do `ALTER COLUMN ... USING`.
  - Padrão RENAME→CREATE→ALTER→DROP idêntico ao usado no `down()` de
    `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`.
  - `down()` documenta explicitamente, em comentário, que recria o valor `'improved_from'` no enum
    mas **não restaura** as linhas apagadas pelo `DELETE` do `up()` (perda de dados irreversível) —
    mesmo padrão aceito na migration irmã.
  - Timestamp `1784306570000` vem corretamente depois de `1784306550000-CreateSheetTrainingSlotsTable.ts`
    e `1784306560000-CreateSheetAbilityExtrasTable.ts` (confirmado via listagem de
    `src/database/migrations/`), e não há colisão de timestamp com nenhuma outra migration.
  - Migrations históricas `1784306060000-CreateEntityLinks.ts` e
    `1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts` conferidas byte a byte contra o
    padrão esperado — intactas, não foram alteradas.
  - `synchronize: false` preservado em `src/database/data-source.ts`; migrations são descobertas via
    glob (`migrations: [join(__dirname, 'migrations', '*{.ts,.js}')]`), sem necessidade de registro
    manual do novo arquivo.
  - Não há evidência, nos artefatos revisáveis por esta ferramenta (arquivos-fonte), de que
    `npm run migration:run` tenha sido executado — a migration nova permanece apenas como arquivo
    criado, consistente com a restrição do usuário. Esta revisão não tem acesso a ferramentas de
    execução de comandos/consulta ao banco para confirmar o estado da tabela `migrations` de forma
    independente.
- **`entity-links.service.ts`**: `validateLists` recebe `{ ownerEntityType; ownerId?; requirements;
  additionalAbilities? }`, com `additionalAbilities` default `?? []`. A checagem de exclusividade
  mútua ficou reduzida a uma única comparação `requirementsKeys` × `additionalAbilitiesKeys`,
  correta para os 5 casos: em Técnica/Magia (só `requirements`), `additionalAbilities` chega vazio
  e o loop de exclusividade é um no-op natural, sem necessidade de branch especial. Mensagens de
  self-reference, duplicidade e exclusividade mútua em pt-BR e coerentes com o novo comportamento
  (sem menção a "Aprimorado de"). `loadReferencesFor` retorna só `{ requirements, additionalAbilities }`,
  filtrando por `EntityLinkType.REQUIREMENT`/`ADDITIONAL_ABILITY`. `resolveReferences` com mensagens
  de `NotFoundException` atualizadas. `loadLinksForOwnersBatched` genérica, sem hardcode de
  `IMPROVED_FROM`.
- **`biographies.service.ts`**: as duas chamadas a `validateLists` (em `create` e `update`) enviam
  `requirements: []` e `additionalAbilities` (input ou "conjunto efetivo" recarregado via
  `loadReferencesFor` em updates parciais), sem `improvedFrom: []`. Comportamento de
  auto-referência/duplicidade/exclusividade de `additionalAbilities` preservado; Biografia continua
  sem usar `requirements` de fato, apenas passando `[]` para satisfazer a assinatura, como já
  documentado no contexto da task.
- **5 services** (`trainings`, `talents`, `characteristics`, `techniques`, `spells`): interfaces
  `*WithReferences` sem `improvedFrom`; `findById`/`create`/`update` sem
  `improvedFromInput`/`effectiveImprovedFrom`/chamadas a `replaceLinks(..., IMPROVED_FROM, ...)`;
  em Treinamento/Talento/Característica a lógica de "conjunto efetivo" em `update` recarrega
  `requirements`/`additionalAbilities` separadamente quando ausentes do DTO, preservando o
  comportamento de atualização parcial; em Técnica/Magia a mesma lógica existe apenas para
  `requirements`, e `validateLists` é chamada sem `additionalAbilities` (aproveitando o parâmetro
  opcional), sem lógica condicional nova.
- **5 controllers**: guards `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`
  preservados nos 5 módulos; `fromEntity(...)` chamado sem `improvedFrom` em nenhum dos 5;
  `@ApiConflictResponse`/`@ApiBadRequestResponse`/`@ApiNotFoundResponse`/`@ApiOperation` sem menção a
  "Aprimorado de", mencionando apenas Requisitos/Habilidades Adicionais (ou só Requisitos em
  Técnica/Magia).
- **DTOs de create/response** dos 5 módulos: `create-*.dto.ts` sem campo `improvedFrom`, com
  descrições de `requirements`/`additionalAbilities` refletindo corretamente a exclusividade
  remanescente (2 listas em Treinamento/Talento/Característica; sem menção a exclusividade em
  Técnica/Magia, que só têm `requirements`); `update-*.dto.ts` são `PartialType(Create*Dto)` sem
  necessidade de alteração direta; `*-response.dto.ts` sem propriedade `improvedFrom`, com
  `fromEntity` recebendo só os campos aplicáveis a cada entidade.
- **DTOs/utilitários genéricos compartilhados** de `entity-links`
  (`EntityReferenceInputDto`, `EntityReferenceResponseDto`, `ReferenceableEntityType`,
  `entity-link.entity.ts`) intactos e sem qualquer referência a `improvedFrom`.
- Mensagens de erro (pt-BR) coerentes com o novo comportamento em todos os pontos revisados.

Arquivos revisados: `app-api/src/database/migrations/1784306570000-RemoveImprovedFromEntityLinksLinkTypeEnum.ts`,
`app-api/src/database/migrations/1784306150000-AddAdditionalAbilityToEntityLinksLinkTypeEnum.ts`,
`app-api/src/database/migrations/1784306060000-CreateEntityLinks.ts`,
`app-api/src/modules/entity-links/enums/entity-link-type.enum.ts`,
`app-api/src/modules/entity-links/enums/referenceable-entity-type.enum.ts`,
`app-api/src/modules/entity-links/entities/entity-link.entity.ts`,
`app-api/src/modules/entity-links/dto/entity-reference-input.dto.ts`,
`app-api/src/modules/entity-links/entity-links.service.ts`,
`app-api/src/modules/biographies/biographies.service.ts`,
`app-api/src/modules/trainings/{trainings.service.ts,trainings.controller.ts,dto/create-training.dto.ts,dto/update-training.dto.ts,dto/training-response.dto.ts}`,
`app-api/src/modules/talents/{talents.service.ts,talents.controller.ts,dto/create-talent.dto.ts,dto/talent-response.dto.ts}`,
`app-api/src/modules/characteristics/{characteristics.service.ts,characteristics.controller.ts,dto/create-characteristic.dto.ts,dto/characteristic-response.dto.ts}`,
`app-api/src/modules/techniques/{techniques.service.ts,techniques.controller.ts,dto/create-technique.dto.ts,dto/technique-response.dto.ts}`,
`app-api/src/modules/spells/{spells.service.ts,spells.controller.ts,dto/create-spell.dto.ts,dto/spell-response.dto.ts}`,
`app-api/src/database/data-source.ts`.