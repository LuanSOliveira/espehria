# Task API: Melhorias de Proficiência e persistência das demais melhorias da biografia no snapshot

## Contexto
Ver .claude/tasks/melhorias-proficiencia/spec.md

Escopo de backend (Partes 1 e 2 do spec). A Parte 3 (frontend) não faz parte deste
plano e só deve começar após a conclusão das etapas abaixo.

## Etapas

### 1. api-dev

#### Entidade
- Não há criação nem alteração de entidade. `ImprovementFlawType`, `ImprovementFlawProperty`
  (`app-api/src/modules/improvement-flaw-properties/entities/improvement-flaw-property.entity.ts`),
  `ImprovementFlaw` e `Sheet` permanecem exatamente como estão.
- O novo tipo "Proficiência" e as 20 novas propriedades são dados de seed inseridos
  via migration (ver abaixo), reutilizando o modelo `ManyToMany` já existente entre
  `ImprovementFlawProperty` e `ImprovementFlawType` através da tabela de junção
  `improvement_flaw_property_types` (colunas `property_id`, `type_id`; hoje
  `improvement_flaw_properties` não tem mais coluna `type_id` própria — foi migrada
  para essa tabela de junção em `1784306240000-ChangeImprovementFlawPropertiesTypeToManyToMany.ts`).
- Sem impacto em `Sheet.melhorias`/`Sheet.defeitos` (colunas jsonb array já suportam
  N entradas, conforme "Escopo confirmado" do spec).

#### Migration
- Necessária: sim — migration de seed de dados (não de schema), no padrão de
  `app-api/src/database/migrations/1784306250000-SeedImprovementFlawAttributeType.ts`.
- Nome sugerido (timestamp incremental após o mais recente do diretório,
  `1784306280000-AddOrderToTagJunctionTables.ts`): algo como
  `1784306290000-SeedImprovementFlawProficiencyType.ts`.
- `up()`, na ordem:
  1. `INSERT INTO "improvement_flaw_types" ("name") VALUES ('Proficiência')`.
  2. `INSERT INTO "improvement_flaw_properties" ("name") VALUES (...)` com as 20
     propriedades novas: Acrobatismo, Arcanismo, Atletismo, Diplomacia, Dissimulação,
     Furtividade, Intimidação, Ladroagem, Manufatura, Medicina, Natureza, Ocultismo,
     Performance, Percepção, Religião, Sobrevivência, Sociedade, Fortitude, Reflexo,
     Vontade. Atenção: diferente de `1784306210000-SeedImprovementFlawPropertiesTable.ts`
     (schema antigo, com `type_id` direto na tabela de properties), o schema atual da
     tabela `improvement_flaw_properties` só tem a coluna `name` — o INSERT deve
     inserir só `name`, sem `type_id`.
  3. `INSERT INTO "improvement_flaw_property_types" ("property_id", "type_id") SELECT p.id, t.id FROM "improvement_flaw_properties" p JOIN "improvement_flaw_types" t ON t.name = 'Proficiência' WHERE p.name IN (as 20 propriedades)`
     — mesmo padrão de `SeedImprovementFlawAttributeType`.
- `down()`, revertendo na ordem inversa:
  1. `DELETE FROM "improvement_flaw_property_types" WHERE "type_id" = (SELECT "id" FROM "improvement_flaw_types" WHERE "name" = 'Proficiência')`.
  2. `DELETE FROM "improvement_flaw_properties" WHERE "name" IN (as 20 propriedades)`.
  3. `DELETE FROM "improvement_flaw_types" WHERE "name" = 'Proficiência'`.
- Confirmado no spec: nenhuma das 20 propriedades colide com nomes já existentes
  (`name` tem índice único em `ImprovementFlawProperty`), então o INSERT do passo 2
  não deve falhar por unicidade.

#### Controller
- Não há novo endpoint, DTO ou alteração de rota. O endpoint existente de vínculo de
  biografia (`SheetsController.linkBiography`, em
  `app-api/src/modules/sheets/sheets.controller.ts`) e o `LinkSheetBiographyDto`
  permanecem inalterados — o payload de entrada não muda.
- Alteração necessária é apenas na lógica de `SheetsService.linkBiography`
  (`app-api/src/modules/sheets/sheets.service.ts`, método `linkBiography`, hoje nas
  linhas ~322-418):
  - Hoje o método monta `biographyImprovements` com exatamente 2 entradas: a melhoria
    de atributo selecionada (`selectedImprovement`) e a melhoria de atributo livre
    (`freeImprovementProperty` + `attributeType`).
  - Deve passar a também buscar todas as `ImprovementFlaw` cuja `ownerBiography.id`
    seja a biografia vinculada, `category === ImprovementFlawCategory.IMPROVEMENT`
    e cujo `type.name` seja diferente de `ATTRIBUTE_TYPE_NAME` ('Atributo') — usando
    o mesmo padrão de busca já usado em `linkRace` (`improvementFlawsRepository.find`
    com `relations: { type: true, property: { types: true } }`, ordenado por
    `sortOrder: 'ASC'`).
  - Cada item encontrado deve ser convertido para `SheetImprovementFlawSnapshotEntry`
    no mesmo formato já usado (`id`, `value`, `type: { id, name }`,
    `property: { id, name }`, `sourceName: biography.name`) e concatenado ao array
    `biographyImprovements` (que continua contendo a entrada do atributo selecionado
    e a entrada de atributo livre, sem alterar a ordem/posicionamento dessas duas).
  - Não filtrar por tipo "Proficiência" especificamente — o filtro correto é
    "categoria IMPROVEMENT e tipo diferente de Atributo", o que automaticamente
    inclui Proficiência e qualquer outro tipo futuro sem exigir nova mudança de código.
  - Nenhuma validação existente (melhoria de atributo selecionada, propriedade livre
    compatível com o tipo Atributo) deve ser alterada.
  - `sheet.defeitos = { ...sheet.defeitos, biography: [] }` permanece exatamente como
    está (defeitos da biografia continuam fora de escopo, sempre zerados).
  - `unlinkBiography` não precisa de nenhuma alteração — já zera
    `sheet.melhorias.biography` por completo, cobrindo as novas entradas.
- Endpoints: nenhum novo. `POST` (ou verbo já existente) para vincular biografia e
  o endpoint de desvincular permanecem com assinatura e nível de acesso atuais.
- DTOs: nenhum novo e nenhuma alteração em `LinkSheetBiographyDto` — as melhorias
  não-Atributo são inteiramente derivadas no backend a partir da biografia informada.
- Acesso Google: não se aplica alteração — o controller de fichas não sofre mudança
  de rota/guard nesta demanda; manter o nível de acesso já implementado hoje.

Status: concluído
Entidade: não aplicável (nenhuma entidade criada ou alterada)
Migration: app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts
Rotas: nenhuma nova (POST /sheets/:id/biography e demais rotas de sheets permanecem inalteradas)
Arquivos: app-api/src/modules/sheets/sheets.service.ts (método linkBiography)

### 2. api-dev-doc
- Depende da etapa 1
- Nenhum novo `@ApiProperty`/DTO é necessário (sem mudança de contrato de request/
  response). Vale conferir se a documentação Swagger do endpoint de vínculo de
  biografia menciona explicitamente o comportamento do snapshot de melhorias, e
  atualizar a descrição para refletir que agora inclui também as melhorias
  não-Atributo da biografia, caso essa descrição exista e fique desatualizada.

Status: concluído
Arquivo atualizado: app-api/src/modules/sheets/sheets.controller.ts (método linkBiography com documentação atualizada)

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como "Status: concluído".
Arquivos revisados:
- `app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts`
- `app-api/src/modules/sheets/sheets.service.ts` (método `linkBiography`)
- `app-api/src/modules/sheets/sheets.controller.ts` (método `linkBiography`)

Verificações realizadas:
- **Migration**: `up()` insere o tipo `Proficiência`, depois as 20 propriedades
  (apenas coluna `name`, sem `type_id` — coerente com o schema atual pós
  `1784306240000-ChangeImprovementFlawPropertiesTypeToManyToMany.ts`, confirmado lendo
  essa migration e `CreateImprovementFlawPropertiesTable`/`CreateImprovementFlawTypesTable`,
  que têm `id uuid DEFAULT gen_random_uuid()`, então o INSERT sem `id`/`type_id` é
  válido) e por fim a junção `improvement_flaw_property_types` via `SELECT ... JOIN`,
  no mesmo padrão de `1784306250000-SeedImprovementFlawAttributeType.ts`. `down()`
  reverte na ordem inversa correta (junção → propriedades → tipo), evitando problemas
  de FK. As 20 propriedades (Acrobatismo, Arcanismo, Atletismo, Diplomacia,
  Dissimulação, Furtividade, Intimidação, Ladroagem, Manufatura, Medicina, Natureza,
  Ocultismo, Performance, Percepção, Religião, Sobrevivência, Sociedade, Fortitude,
  Reflexo, Vontade) estão com acentuação correta e não colidem com nomes já existentes
  nas demais migrations de seed (`Ataque Corpo-a-Corpo`, `Ataque a Distância`, `Força`,
  `Destreza`, `Constituição`, `Inteligência`, `Sabedoria`, `Carisma`), respeitando o
  índice único em `name`. Timestamp (`1784306290000`) é o mais recente do diretório,
  sem conflito de ordem.
- **`SheetsService.linkBiography`**: a nova consulta usa exatamente o padrão de
  `linkRace` (`improvementFlawsRepository.find` com `relations: { type: true, property:
  { types: true } }`, `order: { sortOrder: 'ASC' }`), filtrando por
  `ownerBiography.id`, `category: ImprovementFlawCategory.IMPROVEMENT` e
  `type: { name: Not(ATTRIBUTE_TYPE_NAME) }` — condizente com a exigência de filtrar
  por "categoria IMPROVEMENT e tipo diferente de Atributo" sem acoplar a um tipo
  específico. Não há sobreposição com a melhoria de atributo já incluída
  (`selectedImprovement` é sempre do tipo Atributo, logo fica fora do filtro
  `Not(ATTRIBUTE_TYPE_NAME)`). As duas entradas originais (melhoria de atributo
  selecionada e melhoria de atributo livre) permanecem nas duas primeiras posições do
  array, seguidas do `.map(toBiographyEntry)` das demais melhorias da biografia, sem
  alterar a ordem existente. `sheet.defeitos.biography` continua sendo zerado. As
  validações existentes (melhoria pertence à biografia e é do tipo Atributo,
  propriedade livre compatível com o tipo Atributo) não foram alteradas.
  `unlinkBiography` também não foi alterado.
- **Swagger (`sheets.controller.ts`)**: o `@ApiOperation.summary` de
  `PUT /sheets/:id/biography` foi atualizado para mencionar que o snapshot agora
  inclui "melhorias de atributo, proficiências e demais melhorias da biografia",
  coerente com o comportamento genérico implementado (não restrito a Proficiência).
  Guards, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse` e
  `@ApiBadRequestResponse` permanecem inalterados e continuam corretos, pois nenhuma
  validação/contrato de request/response mudou.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/database/migrations/1784306290000-SeedImprovementFlawProficiencyType.ts`,
`app-api/src/modules/sheets/sheets.service.ts`,
`app-api/src/modules/sheets/sheets.controller.ts`.