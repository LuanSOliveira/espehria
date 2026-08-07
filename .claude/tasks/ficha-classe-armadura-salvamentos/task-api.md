# Task API: Classe de Armadura e Salvamentos na ficha

## Contexto
Ver .claude/tasks/ficha-classe-armadura-salvamentos/spec.md

Escopo de backend intencionalmente pequeno: a maior parte da funcionalidade (quadros
visuais de Classe de Armadura e Salvamentos, círculo de valor, cálculo de modificador)
é frontend e será planejada em seguida (`task-web.md`), usando este documento como
contrato. Precedente direto de estrutura de plano: `.claude/tasks/ficha-pericias/task-api.md`
(perícias na ficha) e `.claude/tasks/pericias-atributo-chave/task-api.md` (atributo
chave em Perícias, mesmo padrão de FK que este plano reaproveita).

## Fora de escopo (confirmado)
- **Salvamentos não exigem nenhuma mudança de backend.** 'Fortitude', 'Reflexo' e
  'Vontade' já estão catalogados exatamente como as 17 perícias existentes — tanto
  como propriedades de melhoria/defeito do tipo 'Proficiência' quanto como
  propriedades de proficiência (ver "Contexto factual apurado no código" no
  `spec.md`). A graduação de cada salvamento já está disponível no snapshot de
  proficiências da ficha (`sheet.proficiencias`, casado por nome), exatamente como já
  acontece para as perícias. Nenhum catálogo novo, nenhuma migration e nenhum
  endpoint são necessários para Salvamentos.
- O valor numérico da Classe de Armadura e os modificadores dos 3 Salvamentos **não
  são persistidos** — são calculados inteiramente no client, a partir de dados já
  existentes (atributos e snapshot de proficiências). O único dado novo a persistir é
  a escolha do atributo-chave da CA.

## Etapas

### 1. api-dev

Status: concluído
Entidade: app-api/src/modules/sheets/entities/sheet.entity.ts (campo novo `armorClassKeyAttribute`)
Migration: app-api/src/database/migrations/1784306420000-AddArmorClassKeyAttributeToSheetsTable.ts
Rotas: PUT /sheets/:id (inalterada na assinatura, DTO de entrada e de resposta alterados)
Arquivos: app-api/src/modules/sheets/sheets.module.ts (import de `Attribute` no `TypeOrmModule.forFeature`), app-api/src/modules/sheets/dto/update-sheet.dto.ts (campo `armorClassKeyAttributeId`), app-api/src/modules/sheets/dto/sheet-response.dto.ts (campo `armorClassKeyAttribute`), app-api/src/modules/sheets/sheets.service.ts (`findAttributeById`, `findDefaultArmorClassKeyAttribute`, `create()`, `update()`, `findAccessibleById()`)

#### Entidade
**Alteração na entidade `Sheet`** (`app-api/src/modules/sheets/entities/sheet.entity.ts`)
- Campo novo: `armorClassKeyAttribute` — `@ManyToOne(() => Attribute, { nullable:
  false, onDelete: 'RESTRICT' })` + `@JoinColumn({ name: 'armor_class_key_attribute_id' })`,
  com `@ApiProperty({ type: () => Attribute, description: 'Atributo chave selecionado
  para a Classe de Armadura' })`.
- Relacionamentos: `Sheet` N:1 `Attribute` (obrigatório, `onDelete: 'RESTRICT'`).
- **Decisão: FK para `attributes`, não coluna de texto com o nome do atributo.**
  Justificativa:
  - Reaproveita exatamente o único precedente de "atributo chave" já existente no
    projeto — `Skill.keyAttribute` (`app-api/src/modules/skills/entities/skill.entity.ts`),
    incluindo a mesma cardinalidade, `onDelete: 'RESTRICT'` e forma de exposição na
    resposta (`AttributeResponseDto` completo, não apenas o nome).
  - Garante integridade referencial contra a tabela `attributes` (que já existe e é
    seedada com exatamente os 6 nomes válidos — `Força`, `Destreza`, `Constituição`,
    `Inteligência`, `Sabedoria`, `Carisma`), evitando um segundo local onde o nome do
    atributo poderia ser digitado livremente e divergir dos 6 valores válidos.
  - Resolve diretamente a "atenção" apontada para o front: a resposta expõe tanto
    `id` quanto `name` do atributo-chave da CA (via `AttributeResponseDto`), exatamente
    como `SkillListItemResponseDto.keyAttribute` já faz para perícias. Conforme o
    contrato já normatizado em `.claude/tasks/ficha-pericias/task-api.md`, o
    cruzamento entre `keyAttribute.name` e o array de atributos calculados da ficha no
    client é feito **por nome** (case-insensitive + trim) — o mesmo mecanismo deve ser
    reaproveitado aqui pelo front para resolver o modificador do atributo-chave da CA.
    Isso é uma fonte de dados distinta das "propriedades de atributo" de
    melhorias/defeitos (`improvement_flaw_properties` do tipo 'Atributo'), que também
    compartilham os mesmos 6 nomes mas não têm FK entre si — limitação de schema já
    conhecida e não tratada nesta demanda, apenas repetida aqui por consistência com o
    padrão de Perícias.
- Nenhuma outra entidade é criada. `Attribute` (`app-api/src/modules/attributes/entities/attribute.entity.ts`)
  permanece inalterada — já expõe `id` e `name` via `AttributeResponseDto`.
- **Wiring de módulo:** `SheetsModule` (`app-api/src/modules/sheets/sheets.module.ts`)
  passa a importar `Attribute` também no `TypeOrmModule.forFeature([...])` (mesmo
  padrão de `Campaign`/`Race`/`Biography` já importados diretamente ali), para que
  `SheetsService` possa injetar `Repository<Attribute>` e validar o
  `armorClassKeyAttributeId` recebido.

#### Migration
- Necessária: **sim** (nova coluna obrigatória em `sheets`, `synchronize` é `false`).
- A tabela `sheets` já pode ter registros — a coluna nasce nullable, recebe backfill,
  e só depois vira `NOT NULL`, seguindo exatamente o padrão de
  `1784306050000-AddKeyAttributeToSkillsTable.ts` (precedente direto: mesma FK, mesma
  tabela de referência `attributes`), com backfill para `'Destreza'` em vez de
  `'Força'` (conforme decisão explícita do spec: "Destreza" é o padrão para a CA):
  1. `ALTER TABLE "sheets" ADD "armor_class_key_attribute_id" uuid` (nullable).
  2. `UPDATE "sheets" SET "armor_class_key_attribute_id" = (SELECT "id" FROM
     "attributes" WHERE "name" = 'Destreza') WHERE "armor_class_key_attribute_id" IS
     NULL` — cobre o backfill de todas as fichas já existentes, exatamente como
     pedido no escopo.
  3. `ALTER TABLE "sheets" ALTER COLUMN "armor_class_key_attribute_id" SET NOT NULL`.
  4. `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_armor_class_key_attribute_id"
     FOREIGN KEY ("armor_class_key_attribute_id") REFERENCES "attributes"("id") ON
     DELETE RESTRICT ON UPDATE NO ACTION`.
  - `down()`: `DROP CONSTRAINT "FK_sheets_armor_class_key_attribute_id"` seguido de
    `DROP COLUMN "armor_class_key_attribute_id"`, espelhando exatamente o `down()` de
    `1784306050000-AddKeyAttributeToSkillsTable.ts`.
  - Depende apenas da migration de seed `1784306040000-SeedAttributesTable.ts` (que já
    insere `'Destreza'`) já ter rodado — garantido pela ordem de timestamps.
  - Local: `app-api/src/database/migrations/`. Último timestamp existente no diretório
    é `1784306410000` (`ChangeTagsUniqueIndexToNameAndType`); usar um timestamp maior,
    ex. `1784306420000-AddArmorClassKeyAttributeToSheetsTable.ts`.

#### Controller
- **Nenhum endpoint novo.** O campo entra no `UpdateSheetDto` do `PUT /sheets/:id`
  já existente, em vez de ganhar um endpoint granular próprio.
- **Justificativa da escolha (granular vs. `UpdateSheetDto`):** os endpoints
  granulares existentes (`PUT :id/race`, `PUT :id/biography`,
  `PUT :id/proficiency-adjustments/:adjustmentId`, `PUT :id/knowledge-notes/:knowledgeId`)
  existem porque cada um dispara efeitos colaterais complexos (recomputar snapshots de
  melhorias/defeitos/proficiências/saberes) e/ou opera sobre um subitem identificado
  pelo seu próprio id dentro de uma coleção (`adjustmentId`, `knowledgeId`). A escolha
  do atributo-chave da CA não tem nenhuma dessas características: é a troca de um
  único campo escalar (uma FK) na própria ficha, sem nenhum recálculo de snapshot —
  exatamente o mesmo perfil de `campaignId`, que já é tratado dentro de
  `UpdateSheetDto`/`SheetsService.update()`. Reaproveitar o mesmo padrão evita
  proliferar endpoints de campo único.
- **`CreateSheetDto`: sem alteração.** O atributo-chave da CA não é informado na
  criação — a ficha nasce sempre com `'Destreza'`, definido pelo próprio
  `SheetsService.create()` (mesmo padrão de `level: 1`, que também é fixado no
  serviço e não aparece no DTO de criação). O serviço deve buscar a entidade
  `Attribute` cujo `name` é `'Destreza'` (analogia direta ao backfill da migration) e
  atribuí-la a `armorClassKeyAttribute` ao montar a nova `Sheet`.
- **`UpdateSheetDto`** (`app-api/src/modules/sheets/dto/update-sheet.dto.ts`): novo
  campo opcional `armorClassKeyAttributeId` (`@IsOptional() @IsUUID()`, **sem**
  `ValidateIf`/suporte a `null` — diferente de `campaignId`, o atributo-chave da CA
  não pode ser "desvinculado", apenas trocado entre os 6 valores válidos).
- **`SheetsService.update()`**: passa a tratar
  `if (dto.armorClassKeyAttributeId !== undefined) { sheet.armorClassKeyAttribute =
  await this.findAttributeById(dto.armorClassKeyAttributeId); }`, com um helper
  privado `findAttributeById` análogo a `findCampaignById`, lançando
  `NotFoundException('Atributo chave não encontrado.')` quando o id não existir —
  mesma mensagem de erro já usada em `SkillsService` para o mesmo caso de uso.
- **`SheetResponseDto`** (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`):
  novo campo `armorClassKeyAttribute: AttributeResponseDto` (sempre presente, **não**
  opcional/nulo — `@ApiProperty({ type: () => AttributeResponseDto, description:
  'Atributo chave selecionado para a Classe de Armadura (10 + modificador deste
  atributo é a Classe de Armadura base, calculada no client)' })`), populado em
  `fromEntity()` via `AttributeResponseDto.fromEntity(sheet.armorClassKeyAttribute)` —
  mesmo padrão de `SkillResponseDto.keyAttribute`. `findAccessibleById()` em
  `SheetsService` precisa carregar a relação `armorClassKeyAttribute: true` em
  `relations` para que o campo venha preenchido.
- **`SheetListItemResponseDto`: sem alteração.** Segue o mesmo precedente já
  aplicado a `race`/`biography`/`melhorias`/`proficiencias` — campos de detalhe
  completo da ficha não aparecem no item de listagem, que hoje só expõe
  `id`/`name`/`referenceImage`/`level`/`campaign`. A CA não é necessária na tela de
  listagem de fichas.
- Endpoints afetados: `PUT /sheets/:id` (já existente — apenas o DTO de entrada ganha
  um campo opcional e o DTO de resposta ganha um campo novo). Nenhuma outra rota muda.
- DTOs: `UpdateSheetDto` (alterado), `SheetResponseDto` (alterado). Nenhum DTO novo é
  criado.
- Acesso Google: **inalterado**. `SheetsController` não aplica `@GoogleAccess`/
  `GoogleAccessGuard` hoje (fichas são recurso do próprio usuário, restrito por
  `isRestrictedToOwnSheets`/`createdBy`, não por nível de acesso de provider) — esta
  demanda não introduz controller novo nem CRUD novo, portanto não há decisão de
  nível de acesso Google a tomar aqui; o comportamento existente do `PUT /sheets/:id`
  permanece o mesmo para usuários `provider: 'google'`.

### 2. api-dev-doc

Status: concluído

Arquivos alterados:
- app-api/src/modules/sheets/entities/sheet.entity.ts (atualizado `@ApiProperty` de `armorClassKeyAttribute`)
- app-api/src/modules/sheets/dto/update-sheet.dto.ts (atualizado `@ApiPropertyOptional` de `armorClassKeyAttributeId`)
- app-api/src/modules/sheets/sheets.controller.ts (atualizado `@ApiNotFoundResponse` e `@ApiBadRequestResponse` de `PUT /sheets/:id`)

Mudanças realizadas:
- Atualizar `@ApiProperty` de `Sheet.armorClassKeyAttribute` (entidade) e de
  `SheetResponseDto.armorClassKeyAttribute` com descrição explicando o papel do campo
  (atributo-chave da Classe de Armadura, base 10 + modificador calculado no client).
- Atualizar `@ApiPropertyOptional` de `UpdateSheetDto.armorClassKeyAttributeId` com
  `description` e `example` (uuid de um dos 6 atributos), deixando claro que o valor
  deve ser um dos ids retornados por `GET /attributes`.
- Atualizar o `@ApiOperation summary` de `PUT /sheets/:id` (se necessário) para
  mencionar que o endpoint também atualiza o atributo-chave da Classe de Armadura.
- Atualizar o `@ApiBadRequestResponse`/`@ApiNotFoundResponse` de `PUT /sheets/:id`
  para cobrir o novo caso de erro: `armorClassKeyAttributeId` em formato inválido
  (`@ApiBadRequestResponse`) ou atributo não encontrado (`@ApiNotFoundResponse`,
  mensagem "Atributo chave não encontrado.").
- Nenhuma outra rota (`attributes`, `skills`, demais módulos) precisa de ajuste de
  documentação nesta demanda.

### 3. api-dev-codereviewer

Status: concluído
- Revisar tudo acima, com atenção especial a:
  - A migration cobre `ADD COLUMN` (nullable) → `UPDATE` de backfill para `'Destreza'`
    → `ALTER ... SET NOT NULL` → `ADD CONSTRAINT` (FK `ON DELETE RESTRICT`), e o
    `down()` reverte limpo (`DROP CONSTRAINT` seguido de `DROP COLUMN`).
  - `Sheet.armorClassKeyAttribute` bate exatamente com a coluna/FK criada na migration
    (nome da coluna `armor_class_key_attribute_id`, `nullable: false`, `onDelete:
    'RESTRICT'`).
  - `SheetsService.create()` usa `'Destreza'` (não `'Força'` ou outro valor) como
    atributo-chave padrão para fichas novas.
  - `SheetsService.update()`/`findAccessibleById()` carregam e validam
    `armorClassKeyAttribute`/`armorClassKeyAttributeId` corretamente, com
    `NotFoundException('Atributo chave não encontrado.')` no caso de id inexistente.
  - `SheetResponseDto.fromEntity` propaga `armorClassKeyAttribute` via
    `AttributeResponseDto.fromEntity`, sem vazar campos internos.
  - Nenhuma alteração indevida em `SheetListItemResponseDto`, `CreateSheetDto`, ou em
    qualquer endpoint granular (`race`, `biography`, `proficiency-adjustments`,
    `knowledge-notes`) além do necessário.
  - Nenhuma mudança de backend relacionada a Salvamentos (confirmar que nenhum
    catálogo, migration ou endpoint novo foi introduzido para Fortitude/Reflexo/
    Vontade).

---

## Contrato de API (fonte de verdade para o planejamento web)

Esta seção é normativa. O planejamento do frontend
(`ficha-classe-armadura-salvamentos/task-web.md`) deve se basear exatamente nestes
formatos, sem reconsultar o backend.

### `PUT /sheets/:id` — corpo da requisição (novo campo)
```json
{
  "armorClassKeyAttributeId": "string (uuid, opcional)"
}
```
- Campo novo, opcional, ao lado dos já existentes (`name`, `referenceImage`, `level`,
  `campaignId`). Omitir o campo mantém o atributo-chave atual inalterado.
- Deve ser um dos 6 ids retornados por `GET /attributes` (Força, Destreza,
  Constituição, Inteligência, Sabedoria, Carisma). Não aceita `null` (diferente de
  `campaignId`) — a CA sempre tem um atributo-chave selecionado.
- Erros: `400` se o id não for um uuid válido; `404` (`"Atributo chave não
  encontrado."`) se o id não corresponder a nenhum atributo existente.

### `GET /sheets/:id` e resposta de `POST /sheets` / `PUT /sheets/:id` (novo campo)
```json
{
  "armorClassKeyAttribute": {
    "id": "string (uuid)",
    "name": "string"
  }
}
```
- Campo novo, sempre presente (nunca nulo). Em fichas recém-criadas ou já existentes
  antes desta mudança, vem preenchido com o atributo `"Destreza"` por padrão.
- `id`: uuid do atributo, casa com os ids de `GET /attributes`.
- `name`: nome de exibição (ex.: `"Destreza"`). Para resolver o modificador do
  atributo-chave da CA a partir dos atributos calculados no client, o front deve
  comparar `armorClassKeyAttribute.name` com o `label` dos atributos calculados na
  ficha, por **nome** (case-insensitive + trim) — exatamente o mesmo mecanismo já
  normatizado em `.claude/tasks/ficha-pericias/task-api.md` para `Skill.keyAttribute`.
  `armorClassKeyAttribute.id` também está disponível caso o front prefira/precise
  casar por id contra a lista de `GET /attributes` (ex.: para pré-selecionar a opção
  certa no autocomplete).
- **Não confundir** esta fonte com as "propriedades de atributo" de melhorias/defeitos
  (`improvement_flaw_properties` do tipo `'Atributo'`, presentes em
  `sheet.melhorias`/`sheet.defeitos`) — são catálogos distintos que apenas
  coincidentemente compartilham os mesmos 6 nomes. O casamento de nomes entre eles
  (para calcular o modificador final de um atributo) já é responsabilidade do client e
  não muda nesta demanda.
- `SheetListItemResponseDto` (usado em `GET /sheets`, listagem) **não** ganha este
  campo — só o detalhe (`SheetResponseDto`) o expõe.

### `GET /sheets` (listagem) — sem alteração
- Formato de `SheetListItemResponseDto` inalterado (`id`, `name`, `referenceImage`,
  `level`, `campaign`). Não inclui `armorClassKeyAttribute`.

### `GET /attributes` — sem alteração
- Continua retornando `AttributeResponseDto[]` (`id`, `name`) com os 6 atributos fixos,
  sem paginação. É a fonte usada para popular o autocomplete de atributo-chave da CA
  (mesmas 6 opções, mesmos ids/nomes usados em `Skill.keyAttribute`).

### Salvamentos (Fortitude, Reflexo, Vontade) — nenhum endpoint novo ou alterado
- Não há nenhum campo, endpoint ou DTO de backend relacionado a Salvamentos. O front
  deve montar os 3 cards fixos no client (atributos-chave fixos: Fortitude→
  Constituição, Reflexo→Destreza, Vontade→Sabedoria) e casar a graduação de cada um
  por **nome** contra `sheet.proficiencias` (mesmo mecanismo já usado para as 17
  perícias), sem nenhuma chamada de API adicional além das já usadas para montar a
  aba Estatísticas hoje.

### Confirmações explícitas
- Nenhum outro endpoint muda nesta demanda além de `PUT /sheets/:id` (novo campo no
  corpo) e `GET /sheets/:id`/resposta de `POST /sheets`/`PUT /sheets/:id` (novo campo
  na resposta). `GET /sheets`, `GET /attributes`, `GET /sheets/campaign-options` e
  todos os demais endpoints permanecem exatamente como estão.
- **O cálculo do valor da Classe de Armadura e dos modificadores de Salvamentos é
  feito inteiramente no frontend.** O backend apenas fornece o atributo-chave
  escolhido para a CA (`armorClassKeyAttribute`); nenhuma lógica de soma/fórmula de CA
  ou Salvamentos existe ou deve ser adicionada no `app-api`.

## Revisão

Arquivos revisados: `app-api/src/database/migrations/1784306420000-AddArmorClassKeyAttributeToSheetsTable.ts`,
`app-api/src/modules/sheets/entities/sheet.entity.ts`,
`app-api/src/modules/sheets/sheets.module.ts`,
`app-api/src/modules/sheets/sheets.service.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`,
`app-api/src/modules/sheets/dto/create-sheet.dto.ts`,
`app-api/src/modules/sheets/dto/update-sheet.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-list-item-response.dto.ts`.

Verificações confirmadas (sem problema):
- Migration vs. entidade: coluna `armor_class_key_attribute_id`, `nullable: false` (após o
  `SET NOT NULL`), `onDelete: 'RESTRICT'` e nome da FK batem exatamente entre
  `Sheet.armorClassKeyAttribute` e a migration. Sequência do `up()` (`ADD COLUMN` nullable →
  `UPDATE` de backfill para `'Destreza'` → `SET NOT NULL` → `ADD CONSTRAINT`) e o `down()`
  (`DROP CONSTRAINT` → `DROP COLUMN`) espelham fielmente o precedente
  `1784306050000-AddKeyAttributeToSkillsTable.ts`. O backfill cobre corretamente a base vazia
  (a cláusula `WHERE ... IS NULL` é um no-op inofensivo quando não há registros) e depende
  apenas da ordem de timestamp da seed de atributos (`1784306040000-SeedAttributesTable.ts`,
  que insere `'Destreza'` com grafia idêntica à usada no backfill e no `SheetsService`).
- `SheetsService.create()` usa `DEFAULT_ARMOR_CLASS_KEY_ATTRIBUTE_NAME = 'Destreza'` (não
  `'Força'`) via `findDefaultArmorClassKeyAttribute()`, e atribui a entidade completa a
  `armorClassKeyAttribute` antes do `save()` — a resposta de `POST /sheets` não depende de
  reload nem de relação lazy, então `SheetResponseDto.fromEntity` funciona corretamente.
- Todos os caminhos que retornam `SheetResponseDto` (`create`, `findOne`/`findAccessibleById`,
  `update`, `linkRace`, `unlinkRace`, `linkBiography`, `unlinkBiography`,
  `resolveProficiencyAdjustment`, `updateKnowledgeNote`) passam por `findAccessibleById`
  (que inclui `armorClassKeyAttribute: true` em `relations`) ou, no caso de `create()`,
  atribuem a entidade completa diretamente — não há caminho em que `fromEntity` receba
  `sheet.armorClassKeyAttribute` não carregado.
- `SheetsService.update()` só reatribui `armorClassKeyAttribute` quando
  `dto.armorClassKeyAttributeId !== undefined`, usando `findAttributeById()` com
  `NotFoundException('Atributo chave não encontrado.')` — mensagem idêntica à já usada em
  `SkillsService` para o mesmo caso de uso, em pt-BR.
- `UpdateSheetDto.armorClassKeyAttributeId` é opcional, validado com `@IsUUID()`, e
  corretamente **não** aceita `null` (sem `ValidateIf`), diferente de `campaignId` — consistente
  com a decisão do plano de que a CA sempre tem um atributo-chave selecionado.
- `SheetResponseDto.fromEntity` propaga `armorClassKeyAttribute` via
  `AttributeResponseDto.fromEntity`, que expõe apenas `id`/`name`, sem vazar campos internos
  da entidade `Attribute`.
- `CreateSheetDto` e `SheetListItemResponseDto` permanecem inalterados, conforme o plano; nenhum
  endpoint granular (`race`, `biography`, `proficiency-adjustments`, `knowledge-notes`) foi
  tocado além do necessário.
- Confirmado: nenhuma mudança de backend relacionada a Salvamentos — nenhum catálogo,
  migration ou endpoint novo foi introduzido para Fortitude/Reflexo/Vontade (busca por
  `Salvamento|Fortitude|Reflexo|Vontade` em `app-api/src` não retorna nenhum arquivo
  novo/alterado desta demanda).

Achados (não bloqueantes):
- **`app-api/src/modules/sheets/sheets.service.ts:124-132`** — `findDefaultArmorClassKeyAttribute()`
  lança `NotFoundException('Atributo chave não encontrado.')` quando o atributo `'Destreza'`
  não é encontrado durante `create()`. Semanticamente essa é uma falha de dado de catálogo/seed
  (não uma entrada inválida do usuário: `POST /sheets` não recebe nenhum id de atributo), então
  devolver um 404 ao cliente é um pouco enganoso — o cliente não tem como saber que o "recurso
  não encontrado" é um atributo interno que ele nunca informou. Na prática esse caminho é
  inatingível em qualquer ambiente com as migrations aplicadas na ordem correta (a seed de
  `'Destreza'` é anterior à migration desta demanda), então o risco real é baixo.
  - Trecho: `if (!attribute) { throw new NotFoundException('Atributo chave não encontrado.'); }`
  - Sugestão: considerar lançar uma exceção de servidor (`InternalServerErrorException`, com
    mensagem indicando inconsistência de dados de catálogo) em vez de `NotFoundException` para
    esse caso específico de busca por nome fixo/interno, reservando `NotFoundException` para o
    caso de `findAttributeById` (busca por id informado pelo cliente em `update()`), onde o 404
    é semanticamente correto.
- **`app-api/src/modules/sheets/sheets.controller.ts:54-67`** — O endpoint `POST /sheets`
  documenta apenas `@ApiCreatedResponse` e `@ApiBadRequestResponse`, sem `@ApiNotFoundResponse`,
  mesmo que `create()` possa (na teoria, ver achado acima) lançar `NotFoundException` via
  `findDefaultArmorClassKeyAttribute()`. Consistente com o achado anterior: se a sugestão de
  trocar para `InternalServerErrorException` for aplicada, este ponto deixa de ser relevante;
  caso contrário, faltaria documentar o 404 no Swagger de `POST /sheets`.
  - Sugestão: resolver em conjunto com o achado anterior (ajustar o tipo de exceção elimina a
    necessidade de documentar um 404 aqui).

Nenhum problema bloqueante encontrado. A consistência migration↔entidade, o backfill, o
default de criação, o carregamento de `armorClassKeyAttribute` em todos os caminhos de resposta,
a validação/mensagens de erro em pt-BR e o não vazamento de Salvamentos estão todos corretos e
de acordo com os padrões do `CLAUDE.md` e o contrato de API normatizado nesta task.