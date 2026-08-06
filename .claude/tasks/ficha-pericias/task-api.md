# Task API: Perícias na ficha

## Contexto
Não existe `spec.md` para esta demanda — o escopo de backend foi fechado diretamente
com o usuário e está descrito abaixo. O escopo de backend é intencionalmente pequeno:
a maior parte da funcionalidade (quadro de perícias na ficha, cálculo de modificador)
é frontend e será planejada em seguida, usando este documento como contrato.

Contexto de domínio (não é escopo de implementação nesta demanda, apenas para
entendimento): o cruzamento entre `Skill.keyAttribute.name` e os atributos da ficha, e
entre `Skill.name` e as propriedades de proficiência do personagem, será feito pelo
frontend **por nome** (case-insensitive + trim), pois não há FK entre essas entidades.
Essa é uma limitação conhecida do schema atual e **não deve ser corrigida nesta
demanda** — nenhuma alteração de relacionamento é necessária no backend.

## Etapas

### 1. api-dev

#### Entidade
- Entidade: `ProficiencyGradation` (`app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts`), tabela `proficiency_gradations`. **Não é uma entidade nova** — é uma alteração em entidade já existente.
- Campo novo: `bonus` (`integer`, NOT NULL). Adicionar a coluna com `@Column({ type: 'int' })` na entidade, seguindo o mesmo padrão do campo `level` já existente (sem índice único, diferente de `level`/`name`).
- Documentar no `@ApiProperty()`/comentário do campo a diferença semântica em relação a `level`, para evitar confusão futura:
  - `level`: magnitude usada para **comparar** graduações entre si (já consumido no merge de Proficiências e Saberes).
  - `bonus`: valor numérico somado ao modificador do atributo-chave no cálculo de perícia da ficha.
- Relacionamentos: nenhum (tabela sem FKs, comportamento inalterado).
- Nenhuma outra entidade é criada ou alterada nesta demanda (`Skill` e `Attribute` permanecem como estão).

#### Migration
- Necessária: **sim**.
- A tabela `proficiency_gradations` já tem 5 registros em produção/dev, e a coluna precisa ser NOT NULL — portanto a migration não pode simplesmente `ADD COLUMN ... NOT NULL` em um único passo. Seguir o padrão já usado em `1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`:
  1. `ALTER TABLE "proficiency_gradations" ADD COLUMN "bonus" integer` (sem `NOT NULL` ainda, coluna nasce nullable).
  2. `UPDATE` populando os 5 registros existentes pelo `name`:
     - `Destreinado` = 0
     - `Básico` = 3
     - `Avançado` = 5
     - `Especialista` = 7
     - `Lendário` = 9
  3. `ALTER TABLE "proficiency_gradations" ALTER COLUMN "bonus" SET NOT NULL`.
  - O `down()` deve simplesmente `ALTER TABLE "proficiency_gradations" DROP COLUMN "bonus"`.
  - Nome de arquivo sugerido, seguindo a convenção de timestamp incremental do diretório: `<timestamp>-AddBonusToProficiencyGradationsTable.ts` (gerar timestamp maior que o último existente em `app-api/src/database/migrations/`).
  - Não usar `synchronize`; gerar/escrever a migration manualmente com `queryRunner.query(...)` como as migrations vizinhas.

#### Controller
- Nenhum endpoint novo. Único ajuste: o DTO de resposta de `GET /proficiency-gradations` (`ProficiencyGradationResponseDto`, em `app-api/src/modules/proficiency-gradations/dto/proficiency-gradation-response.dto.ts`) passa a incluir o campo `bonus` (number), preenchido em `fromEntity()` a partir da entidade.
- `ProficiencyGradationsController`/`ProficiencyGradationsService` não precisam de nenhuma mudança de lógica — `findAll()` já retorna a entidade completa (`find({ order: { level: 'ASC' } })`), o campo novo vem automaticamente do SELECT.
- Endpoints afetados: `GET /proficiency-gradations` (já existente, somente leitura).
- DTOs: `ProficiencyGradationResponseDto` (alterado — novo campo `bonus`).
- Acesso Google: mantém o nível já existente no controller (`read-only`, via `@GoogleAccess('read-only')` em `ProficiencyGradationsController`). Não há alteração de acesso — o endpoint já era somente leitura (`GET`).

#### Avaliação: buscar todas as perícias
Decisão: **não alterar o backend**. O frontend deve chamar `GET /skills` passando
`perPage=100` (junto com `page=1`, que é o default). Justificativa:
- `FindSkillsQueryDto` já aceita `perPage` sem limite máximo (só `@Min(1)`), então nenhuma mudança de contrato é necessária.
- O número de perícias no sistema é pequeno e fixo na prática (perícias de um sistema de RPG, dezenas no máximo) — 100 é uma margem confortável acima de qualquer contagem razoável, sem risco de paginação truncar a lista.
- Adicionar um modo explícito de "sem paginação" (`perPage=0`/flag `all=true`) traria complexidade desproporcional ao ganho: exigiria alterar `FindSkillsQueryDto`, `SkillsService.findAllPaginated` e a resposta paginada, para resolver um problema que já é coberto por um valor de `perPage` alto.
- Nenhuma migration, DTO ou lógica de serviço muda em `skills` por causa deste item.

Status: concluído
Entidade: app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts
Migration: app-api/src/database/migrations/1784306390000-AddBonusToProficiencyGradationsTable.ts
Rotas: GET /proficiency-gradations (inalterada, apenas resposta ganhou o campo `bonus`)
Arquivos: app-api/src/modules/proficiency-gradations/dto/proficiency-gradation-response.dto.ts (novo campo `bonus` no DTO e em `fromEntity`). `proficiency-gradations.controller.ts`, `proficiency-gradations.service.ts` e `proficiency-gradations.module.ts` não precisaram de alteração. Nenhum arquivo do módulo `skills` foi alterado.

### 2. api-dev-doc
- Depende da etapa 1.
- Atualizar a documentação Swagger de `ProficiencyGradationResponseDto` com o novo `@ApiProperty()` de `bonus` (incluir `description` explicando que é o bônus numérico somado ao modificador de perícia, distinto de `level`).
- Confirmar que a descrição do endpoint `GET /proficiency-gradations` continua coerente (lista fixa de graduações) e, se necessário, mencionar na descrição do endpoint ou do DTO que `bonus` é o valor a ser usado no cálculo de perícia da ficha.
- Nenhuma outra rota (`skills`, demais módulos) precisa de ajuste de documentação nesta demanda.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - A migration realmente cobre `ADD COLUMN` (nullable) → `UPDATE` de seed → `ALTER ... SET NOT NULL`, e o `down()` reverte limpo (`DROP COLUMN`).
  - Os valores de seed batem exatamente com os informados (Destreinado=0, Básico=3, Avançado=5, Especialista=7, Lendário=9) e são associados pelo `name` correto (atenção a acentuação: "Básico", "Avançado", "Lendário").
  - `ProficiencyGradationResponseDto.fromEntity` propaga `bonus` corretamente.
  - Nenhuma alteração indevida em `skills` ou em qualquer outro módulo além de `proficiency-gradations`.

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-api/src/modules/proficiency-gradations/entities/proficiency-gradation.entity.ts`
- `app-api/src/database/migrations/1784306390000-AddBonusToProficiencyGradationsTable.ts`
- `app-api/src/modules/proficiency-gradations/dto/proficiency-gradation-response.dto.ts`
- `app-api/src/modules/proficiency-gradations/proficiency-gradations.controller.ts`
- `app-api/src/modules/proficiency-gradations/proficiency-gradations.service.ts`
- `app-api/src/modules/proficiency-gradations/proficiency-gradations.module.ts`

Detalhes da verificação:
- **Migration ↔ entidade**: a migration `1784306390000-AddBonusToProficiencyGradationsTable.ts` segue exatamente o padrão de três passos exigido para tabela já populada: (1) `ALTER TABLE "proficiency_gradations" ADD "bonus" integer` (nullable), (2) cinco `UPDATE`s de seed por `name`, (3) `ALTER COLUMN "bonus" SET NOT NULL`. Isso é consistente com o padrão de referência (`1784306100000-AddLevelToCharacteristicsTalentsTechniquesSpellsTable.ts`), com a diferença estilística de usar `UPDATE ... WHERE "name" = '...'` em vez de `WHERE "level" IS NULL` — ambos corretos, apenas abordagens distintas de seed (por nome vs. valor único). A entidade (`proficiency-gradation.entity.ts`) declara `bonus!: number` com `@Column({ type: 'int' })`, sem `@Index`, batendo com a migration (coluna `integer NOT NULL`, sem índice). `down()` reverte corretamente com `DROP COLUMN "bonus"`, simétrico ao `up()`.
- **Valores e acentuação do seed**: conferidos contra `1784306340000-SeedProficiencyGradationsTable.ts` (fonte da verdade dos `name`s já em produção) — os `name`s usados nos `UPDATE`s (`'Destreinado'`, `'Básico'`, `'Avançado'`, `'Especialista'`, `'Lendário'`) batem caractere a caractere, incluindo acentuação, com os inseridos originalmente. Valores de `bonus` (0, 3, 5, 7, 9) batem exatamente com os especificados na task.
- **Timestamp da migration**: `1784306390000` é maior que o último timestamp existente em `app-api/src/database/migrations/` (`1784306380000-AddKnowledgeSnapshotToSheets.ts`), respeitando a ordem incremental.
- **Contrato de API**: `ProficiencyGradationResponseDto` expõe exatamente `id`, `name`, `level`, `bonus`, todos preenchidos em `fromEntity()` a partir da entidade — sem campos extras nem faltantes, batendo com o formato normativo da seção "Contrato de API". `findAll()` continua ordenando por `level: 'ASC'` e o controller mantém `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` + `@GoogleAccess('read-only')`, sem alteração de rota/guards.
- **Coexistência `level`/`bonus`**: os `@ApiProperty()` de ambos os campos documentam a distinção semântica corretamente. `level` continua sendo o único campo consumido no merge de Proficiências e Saberes em `sheets.service.ts` (`item.gradation.level`, linhas 201/203/211/227/284/286/294) e em `proficiencies.service.ts` (via `ProficiencyGradation` completa, sem `select` restritivo) — nenhum desses usos foi alterado, e `bonus` não é referenciado em nenhuma lógica de comparação/merge, mantendo a separação de responsabilidades pretendida.
- **Módulo `skills`**: nenhuma referência a `bonus` ou `ProficiencyGradation` encontrada em `app-api/src/modules/skills/`; nenhum arquivo do módulo foi alterado, conforme decisão registrada na etapa 1.

---

## Contrato de API (fonte de verdade para o planejamento web)

Esta seção é normativa. O planejamento do frontend (`ficha-pericias/task-web.md`) deve
se basear exatamente nestes formatos, sem reconsultar o backend.

### `GET /proficiency-gradations`
- Sem alteração de rota, método, guards (`JwtAuthGuard`, `GoogleAccessGuard`) ou nível de acesso Google (`read-only`).
- Sem query params (retorna sempre a lista fixa completa, ordenada por `level` ASC).
- Resposta: `200 OK`, array de objetos com este formato (todos os campos sempre presentes):

```json
[
  {
    "id": "string (uuid)",
    "name": "string",
    "level": "number (integer)",
    "bonus": "number (integer)"
  }
]
```

- `id`: uuid da graduação.
- `name`: nome de exibição (ex.: `"Básico"`).
- `level`: magnitude para **comparação** entre graduações (não usar para cálculo de bônus).
- `bonus` **(novo campo)**: valor numérico a ser somado ao modificador do atributo-chave da perícia. Valores fixos e conhecidos hoje: Destreinado=0, Básico=3, Avançado=5, Especialista=7, Lendário=9 — mas o frontend deve ler `bonus` da resposta, não hardcodar esses valores.

### Buscar todas as perícias
- Endpoint: `GET /skills`.
- Query params exatos a enviar: `page=1&perPage=100` (nenhum outro filtro, a menos que a UI precise filtrar por nome/atributo — não é o caso aqui).
- Nenhuma alteração de backend foi feita ou é necessária para viabilizar isso: `perPage` já não tem limite máximo no `FindSkillsQueryDto` atual.
- Resposta: `200 OK`, formato `PaginatedSkillsResponseDto` (inalterado):

```json
{
  "data": [ /* SkillListItemResponseDto[] — ver abaixo */ ],
  "total": "number",
  "page": "number",
  "perPage": "number",
  "totalPages": "number"
}
```

- O frontend deve assumir que, com `perPage=100`, `data` conterá todas as perícias cadastradas (não implementar paginação incremental para este quadro).

### Formato de item de perícia (`SkillListItemResponseDto`, dentro de `data`)

```json
{
  "id": "string (uuid)",
  "name": "string",
  "keyAttribute": {
    "id": "string (uuid)",
    "name": "string"
  },
  "tags": [ /* TagResponseDto[] — não relevante para o cálculo de perícia */ ]
}
```

- `name`: nome da perícia (ex.: `"Furtividade"`). O cruzamento com as propriedades de proficiência do personagem é feito pelo frontend por **nome**, case-insensitive + trim (não há FK — limitação conhecida, fora do escopo desta demanda).
- `keyAttribute`: objeto (`AttributeResponseDto`), **não** apenas um id — tem exatamente os campos `id` e `name`. O cruzamento com o array `attributes` da ficha (que expõe `{ label, value, modifier }`) é feito pelo frontend comparando `keyAttribute.name` com `label`, também por nome (case-insensitive + trim).

### Confirmações explícitas
- **Nenhum outro endpoint muda** nesta demanda — apenas `GET /proficiency-gradations` ganha o campo `bonus` na resposta. `GET /skills` e todos os demais endpoints de `skills` (`POST`, `PUT`, `DELETE`, `GET /skills/:id`) permanecem exatamente como estão hoje.
- **O cálculo do modificador de perícia é feito inteiramente no frontend.** O backend apenas fornece os dados brutos (`bonus` por graduação de proficiência, `keyAttribute` por perícia); nenhuma lógica de soma/fórmula de perícia existe ou deve ser adicionada no `app-api`.