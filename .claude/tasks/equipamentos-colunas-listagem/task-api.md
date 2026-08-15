# Task API: Expor colunas adicionais de Escudos na listagem

## Contexto
Não existe `spec.md` para esta demanda — o escopo foi decidido diretamente pelo
usuário e está descrito abaixo. A demanda mais ampla (adicionar colunas às tabelas
de Armas, Armaduras e Escudos em app-web, seção ITENS >>> EQUIPAMENTOS) é planejada
separadamente pelo `planejamento-web` em `task-web.md`; este plano cobre **apenas**
a mudança de backend necessária para Escudos.

**Nota de histórico:** a demanda anterior `.claude/tasks/escudos-propriedades/`
decidiu explicitamente, em seu `spec.md`, **não** expor `armorClassBonus`,
`hardness`, `hitPoints` e `breakThreshold` no DTO de listagem de escudos. Esta
demanda reverte conscientemente aquela decisão, por escolha explícita do usuário.
Não é uma violação do escopo anterior — é uma mudança de requisito posterior e
intencional.

Armas e Armaduras não são afetadas no backend: `WeaponListItemResponseDto` já expõe
`damageValue`/`damageDie`/`damageType` e `ArmorListItemResponseDto` já expõe
`armorCategory`/`armorClassBonus`/`dexterityModifierLimit`. Nada a fazer nesses
módulos.

## Etapas

### 1. api-dev

#### Entidade
- Não é necessário criar ou alterar entidade. Os quatro campos já existem em
  `app-api/src/modules/shields/entities/shield.entity.ts`:
  - `armorClassBonus: number | null` (`@Column({ type: 'int', name: 'armor_class_bonus', nullable: true })`)
  - `hardness: number | null` (`@Column({ type: 'int', nullable: true })`)
  - `hitPoints: number | null` (`@Column({ type: 'int', name: 'hit_points', nullable: true })`)
  - `breakThreshold: number` — **atenção**: na entidade este campo **não é nullable**
    (`@Column({ type: 'int', name: 'break_threshold', default: 0 })`), calculado como
    `floor(hitPoints / 2)` ou `0` quando `hitPoints` está vazio/nulo (ver
    `ShieldsService.create`/`update`). `ShieldResponseDto.breakThreshold` já reflete
    isso como `number` (não opcional) com `@ApiProperty`, não `@ApiPropertyOptional`.
    O DTO de listagem deve seguir esse mesmo padrão para `breakThreshold`, e não o
    tipo `number | null` mencionado informalmente na descrição da demanda.
- Relacionamentos: nenhum novo.

#### Migration
- Necessária: não. As quatro colunas já existem no banco (criadas pela migration da
  demanda `escudos-propriedades`) e a entidade `Shield` já as declara. Nenhuma
  alteração de schema nesta demanda.

#### Controller
- Nenhum novo endpoint. `GET /shields` (listagem paginada) já existe e permanece
  inalterado — não alterar `ShieldsController`, `ShieldsService`, `CreateShieldDto`,
  `UpdateShieldDto`, `FindShieldsQueryDto` nem `ShieldResponseDto`.
- Verificação do carregamento de dados: em
  `app-api/src/modules/shields/shields.service.ts`, o método `findAllPaginated`
  busca primeiro apenas `shield.id`/`shield.name` via query builder (para paginação
  e ordenação), mas em seguida recarrega os registros completos com
  `this.shieldsRepository.find({ where: { id: In(...) }, relations: { currency: true }, order: { name: 'ASC' } })`
  — sem `select` restritivo. Ou seja, **todos os campos da entidade `Shield`**,
  incluindo `armorClassBonus`, `hardness`, `hitPoints` e `breakThreshold`, já vêm
  populados nas entidades retornadas por esse método. **Nenhum ajuste no service é
  necessário.**
- Alteração exclusiva: em
  `app-api/src/modules/shields/dto/shield-list-item-response.dto.ts`
  (`ShieldListItemResponseDto`), adicionar quatro novas propriedades e mapeá-las em
  `fromEntity`, reaproveitando exatamente as descrições/exemplos já usados em
  `ShieldResponseDto`:
  - `@ApiPropertyOptional({ description: 'Bônus de CA do escudo, mínimo 0', example: 2 }) armorClassBonus: number | null;`
  - `@ApiPropertyOptional({ description: 'Dureza do escudo, mínimo 0', example: 5 }) hardness: number | null;`
  - `@ApiPropertyOptional({ description: 'Pontos de vida do escudo, mínimo 0', example: 10 }) hitPoints: number | null;`
  - `@ApiProperty({ description: 'Limiar de quebra do escudo (somente leitura, calculado pela API como floor(Pontos de Vida / 2), ou 0 quando Pontos de Vida está vazio/nulo)', example: 5 }) breakThreshold: number;`
  - Em `fromEntity`, adicionar as atribuições correspondentes:
    `dto.armorClassBonus = shield.armorClassBonus;`,
    `dto.hardness = shield.hardness;`,
    `dto.hitPoints = shield.hitPoints;`,
    `dto.breakThreshold = shield.breakThreshold;`
  - Mudança puramente aditiva: nenhuma propriedade existente do DTO é removida ou
    alterada; a ordem sugerida é inserir os novos campos após `tags`, mantendo o
    restante do arquivo como está.
- Endpoints: nenhum novo/alterado (`GET /shields` já existente, resposta enriquecida).
- DTOs: `ShieldListItemResponseDto` (único arquivo alterado nesta demanda).
- Acesso Google: sem alteração — mantém o nível de acesso já configurado no
  `ShieldsController` (mudança restrita ao DTO de resposta, não afeta guards/regras
  de acesso).

Status: concluído
Entidade: não aplicável (nenhuma alteração de entidade)
Migration: não aplicável
Rotas: nenhuma nova (GET /shields já existente, resposta enriquecida)
Arquivos: app-api/src/modules/shields/dto/shield-list-item-response.dto.ts

### 2. api-dev-doc
- Depende da etapa 1.
- Atualizar a documentação Swagger do módulo `shields` conforme necessário para
  refletir os quatro novos campos (`armorClassBonus`, `hardness`, `hitPoints`,
  `breakThreshold`) agora presentes na resposta de `GET /shields` via
  `ShieldListItemResponseDto`, garantindo que os `@ApiProperty`/`@ApiPropertyOptional`
  adicionados na etapa 1 estejam corretos e consistentes com `ShieldResponseDto`.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - `breakThreshold` deve ser `number` (não nullable, `@ApiProperty`), não
    `number | null`, para consistência com a entidade e com `ShieldResponseDto`.
  - Nenhum arquivo além de `shield-list-item-response.dto.ts` foi alterado
    (nenhuma entidade, migration, service, controller ou outros DTOs de `shields`).
  - Confirmar que `fromEntity` mapeia corretamente os quatro novos campos.
  - Confirmar que a mudança é aditiva e não quebra nenhum consumidor existente do
    DTO de listagem.

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas:
- Etapas "1. api-dev" e "2. api-dev-doc" estão marcadas como "Status: concluído" e o
  trabalho corresponde ao que está descrito nelas.
- `app-api/src/modules/shields/dto/shield-list-item-response.dto.ts` — os quatro
  novos campos (`armorClassBonus`, `hardness`, `hitPoints`, `breakThreshold`) foram
  adicionados após `tags`, sem remover ou alterar nenhuma propriedade existente do
  DTO (mudança puramente aditiva, não quebra consumidores existentes de
  `GET /shields`).
  - `armorClassBonus`, `hardness` e `hitPoints` estão tipados como `number | null`
    com `@ApiPropertyOptional`, espelhando exatamente `ShieldResponseDto` e a
    entidade `Shield`.
  - `breakThreshold` está corretamente tipado como `number` (não nullable) com
    `@ApiProperty`, consistente com `Shield.breakThreshold`
    (`@Column({ type: 'int', name: 'break_threshold', default: 0 })`) e com
    `ShieldResponseDto.breakThreshold`, evitando o `number | null` mencionado
    informalmente na descrição da demanda.
  - `fromEntity` mapeia os quatro campos corretamente:
    `dto.armorClassBonus = shield.armorClassBonus`, `dto.hardness = shield.hardness`,
    `dto.hitPoints = shield.hitPoints`, `dto.breakThreshold = shield.breakThreshold`.
  - As descrições/exemplos dos `@ApiProperty`/`@ApiPropertyOptional` batem
    exatamente com os de `ShieldResponseDto`, mantendo a documentação Swagger
    coerente entre os dois DTOs.
- Confirmado por leitura de `app-api/src/modules/shields/shields.service.ts` que
  `findAllPaginated` recarrega os escudos via
  `this.shieldsRepository.find({ where: { id: In(...) }, relations: { currency: true }, order: { name: 'ASC' } })`,
  sem `select` restritivo, portanto `armorClassBonus`, `hardness`, `hitPoints` e
  `breakThreshold` já vêm populados na entidade retornada — nenhum ajuste no service
  era necessário, e de fato nenhum foi feito.
- Confirmado que nenhum outro arquivo do módulo `shields` foi alterado nesta
  demanda: `shields.controller.ts`, `shields.module.ts`,
  `entities/shield.entity.ts`, `entities/shield-tag.entity.ts`,
  `dto/create-shield.dto.ts`, `dto/update-shield.dto.ts`,
  `dto/find-shields-query.dto.ts`, `dto/paginated-shields-response.dto.ts` e
  `dto/shield-response.dto.ts` permanecem inalterados e consistentes com o restante
  do código (o `paginated-shields-response.dto.ts` referencia
  `ShieldListItemResponseDto` por tipo, então os novos campos passam a aparecer na
  listagem automaticamente, sem exigir alteração adicional).
- Não há migration nesta demanda (as quatro colunas já existiam), e a entidade
  `Shield` não foi alterada — nada a verificar quanto a consistência
  migration↔entidade além do que já existia.
- Nenhum dado sensível é exposto pela alteração; os campos adicionados já eram
  expostos em `ShieldResponseDto` (detalhe do escudo) e não há relação com
  `password` ou outros campos `select: false`.

Arquivos revisados:
- `app-api/src/modules/shields/dto/shield-list-item-response.dto.ts`
- `app-api/src/modules/shields/dto/shield-response.dto.ts`
- `app-api/src/modules/shields/dto/paginated-shields-response.dto.ts`
- `app-api/src/modules/shields/shields.service.ts`
- `app-api/src/modules/shields/entities/shield.entity.ts`
