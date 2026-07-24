# Task API: Seções de Local

## Contexto
Ver .claude/tasks/locais-secoes/spec.md

## Etapas

### 1. api-dev

#### Entidade
- Nova entidade `LocationSection` em `app-api/src/modules/locations/entities/location-section.entity.ts`,
  estendendo `BaseEntity` (herda `id`, `createdAt`, `updatedAt`).
- Campos:
  - `label` (`string`, `@Column()` obrigatório — texto simples, sem HTML).
  - `description` (`string | null`, `@Column({ type: 'text', nullable: true })` — rich text/HTML,
    segue o mesmo padrão de `Location.description`; pode ficar vazia/nula).
  - `order` (`number`, `@Column({ type: 'int' })` — coluna de ordem que preserva a sequência de
    adição das seções; preenchida pelo backend com base na posição do array recebido, não é
    exposta como campo editável pelo cliente).
  - `location` (`ManyToOne(() => Location, (location) => location.sections)` com
    `@JoinColumn({ name: 'location_id' })`, `onDelete: 'CASCADE'` — FK obrigatória para o local dono
    da seção).
- Alteração em `Location` (`app-api/src/modules/locations/entities/location.entity.ts`):
  - Adicionar `@OneToMany(() => LocationSection, (section) => section.location, { cascade: true })`
    no campo `sections!: LocationSection[]`, seguindo o padrão de cascade descrito no spec (seções
    são criadas/atualizadas/removidas junto com o Local). Como o TypeORM `cascade` em `OneToMany`
    não remove órfãos automaticamente ao reatribuir o array, o serviço deve tratar explicitamente
    a remoção de seções excluídas no update (ver abaixo), e não depender apenas do cascade para
    esse caso.
  - Expor `@ApiProperty({ type: () => [LocationSection], description: 'Seções do local' })` acima
    do campo, no mesmo estilo já usado para `tags`.
- Relacionamentos: `LocationSection N:1 Location` (FK `location_id`, obrigatória, cascade de exclusão
  a nível de banco `ON DELETE CASCADE`); `Location 1:N LocationSection`.

#### Migration
- Necessária: sim. Nova migration em `app-api/src/database/migrations/`, seguindo o padrão das
  migrations existentes de `locations` (timestamp sequencial, nome `CreateLocationSectionsTable`).
- Deve criar a tabela `location_sections` com colunas: `id` (uuid, PK, default `gen_random_uuid()`),
  `created_at`, `updated_at` (padrão `BaseEntity`), `label` (`character varying NOT NULL`),
  `description` (`text`, nullable), `order` (`integer NOT NULL`), `location_id` (`uuid NOT NULL`).
- Deve criar índice em `location_id` (padrão usado em `location_points_of_interest`) e a constraint
  de FK `location_id` → `locations(id)` com `ON DELETE CASCADE ON UPDATE NO ACTION`.
- `down()` deve reverter na ordem inversa: drop da FK, drop do índice, drop da tabela.

#### Controller
- Não há novos endpoints dedicados a `LocationSection` — seções são gerenciadas de forma aninhada
  através dos endpoints já existentes de `Location` (`POST /locations`, `PUT /locations/:id`,
  `GET /locations`, `GET /locations/:id`), sem rotas próprias de CRUD para seção, conforme o spec
  (adicionar/remover seções acontece via criação/atualização do Local).
- Alterações necessárias nos DTOs de `Location`:
  - **Novo DTO** `LocationSectionInputDto` (em
    `app-api/src/modules/locations/dto/location-section-input.dto.ts`), usado dentro de
    `CreateLocationDto`/`UpdateLocationDto`:
    - `label`: `@IsString() @IsNotEmpty()`.
    - `description?`: `@IsOptional() @IsString()` (aceita string vazia/HTML; sem `@IsNotEmpty()`).
  - `CreateLocationDto` (`app-api/src/modules/locations/dto/create-location.dto.ts`): adicionar
    campo opcional `sections?: LocationSectionInputDto[]` com
    `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LocationSectionInputDto)`
    e `@ApiPropertyOptional({ type: () => [LocationSectionInputDto] })`. A ordem de criação das
    seções é a ordem dos itens no array (o serviço atribui `order` sequencialmente ao persistir).
  - `UpdateLocationDto` estende `PartialType(CreateLocationDto)` — herdará `sections` automaticamente
    como opcional; nenhuma alteração adicional de arquivo é necessária, mas o serviço deve tratar
    `sections !== undefined` no update como "substituir integralmente a lista de seções" (remover
    as seções antigas que não estão mais presentes e recriar/reordenar conforme o novo array),
    já que o spec não define uma operação de "editar seção existente" — apenas adicionar/remover.
  - `LocationResponseDto` (`app-api/src/modules/locations/dto/location-response.dto.ts`): adicionar
    `sections: LocationSectionResponseDto[]` (novo DTO de resposta, com `fromEntity` próprio,
    seguindo a convenção `static fromEntity`), populado a partir de `location.sections` ordenado
    por `order` ascendente. Campos do `LocationSectionResponseDto`: `id`, `label`, `description`,
    `order`, `createdAt`, `updatedAt` (não incluir referência de volta ao `location` para evitar
    ciclo, mesmo padrão de dto "shallow" já usado no módulo).
  - `LocationListItemResponseDto` e `LocationShallowResponseDto`: **não** precisam incluir `sections`
    — não fazem parte do escopo confirmado (listagem e visualização resumida de local como ponto de
    interesse não exibem seções); manter como estão.
  - Ajustes no `LocationsService` (`app-api/src/modules/locations/locations.service.ts`):
    - `findById`: incluir `sections: true` em `relations` para carregar as seções junto com o local.
    - `findAllPaginated`: não precisa carregar `sections` (lista não exibe seções).
    - `create`: mapear `dto.sections` (se houver) para entidades `LocationSection` com `order`
      sequencial (índice do array) antes de atribuir ao `location.sections` e salvar (aproveitando
      o cascade de `OneToMany`).
    - `update`: quando `dto.sections !== undefined`, substituir a coleção de seções do local pela
      nova lista (removendo as seções antigas que não estejam mais presentes — via `save` com
      cascade mais remoção explícita das seções órfãs, dado que TypeORM não remove órfãos por
      padrão em `OneToMany` sem `orphanedRowAction: 'delete'`; considerar configurar
      `orphanedRowAction: 'delete'` no `OneToMany` de `sections` para simplificar essa lógica).
  - Nenhuma alteração é necessária em `LocationsController` além dos tipos já refletidos pelos DTOs
    (os métodos existentes continuam repassando `dto` para o service e `LocationResponseDto.fromEntity`
    para a resposta).

Status: concluído
Entidade: app-api/src/modules/locations/entities/location-section.entity.ts
Migration: app-api/src/database/migrations/1784305530000-CreateLocationSectionsTable.ts
Rotas: nenhuma rota nova (seções gerenciadas via POST /locations, PUT /locations/:id, GET /locations, GET /locations/:id, já existentes)
Arquivos: app-api/src/modules/locations/entities/location.entity.ts (adição de sections OneToMany com cascade + orphanedRowAction: 'delete'), app-api/src/modules/locations/dto/location-section-input.dto.ts (novo), app-api/src/modules/locations/dto/location-section-response.dto.ts (novo), app-api/src/modules/locations/dto/create-location.dto.ts (campo sections), app-api/src/modules/locations/dto/location-response.dto.ts (campo sections), app-api/src/modules/locations/locations.service.ts (findById com relations.sections, buildSections, create/update tratando dto.sections), app-api/src/modules/locations/locations.module.ts (registro do repositório LocationSection)
Pendência sinalizada: nenhuma decisão de arquitetura adicional necessária — reindexação sequencial de order (0..n-1) aplicada tanto em create quanto em update (substituição integral da lista quando dto.sections !== undefined), conforme assumido no spec/task.

**Ponto de atenção (fora do escopo de arquitetura, sinalizar para o api-dev):** o spec não define um
limite de tamanho para `label`/`description`, nem se `order` deve ser reindexado ao remover uma seção
do meio da lista em uma atualização — assumir reindexação sequencial (0..n-1) a cada `update` que
envie `sections`, já que a substituição integral da lista já implica recomputar a ordem a partir do
array recebido.

### 2. api-dev-doc
- Depende da etapa 1
- Garantir `@ApiProperty`/`@ApiPropertyOptional` completos em `LocationSectionInputDto` e
  `LocationSectionResponseDto` (exemplos de `label` e `description` em HTML), e atualizar as
  descrições Swagger de `CreateLocationDto`/`UpdateLocationDto`/`LocationResponseDto` para mencionar
  o novo campo `sections`. Não é necessária nova tag Swagger — segue em `locations`.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Revisão completa das etapas 1 (api-dev) e 2 (api-dev-doc), ambas marcadas como
"Status: concluído". Arquivos revisados: entidade `LocationSection`, alteração na
entidade `Location`, migration `CreateLocationSectionsTable`, DTOs
(`LocationSectionInputDto`, `LocationSectionResponseDto`, `CreateLocationDto`,
`UpdateLocationDto`, `LocationResponseDto`, `LocationListItemResponseDto`,
`LocationShallowResponseDto`), `locations.service.ts`, `locations.module.ts` e
`locations.controller.ts`.

Verificações realizadas: consistência migration ↔ entidade (colunas, tipos,
nullable, índice, FK com `ON DELETE CASCADE`, `down()` revertendo na ordem inversa),
convenção `fromEntity` (inclusive ordenação por `order` ascendente e ausência de
referência cíclica de volta a `location`), cascade/orphan removal (`cascade: true` +
`orphanedRowAction: 'delete'` no `OneToMany`, combinado com a substituição integral
do array `sections` no `update`), validação `class-validator` em
`LocationSectionInputDto`/`CreateLocationDto`, e exposição de dados (nenhum campo
sensível ou de outra entidade vazado nas respostas).

Não foram encontrados erros de compilação/execução, problemas de segurança ou
inconsistências entre a migration e a entidade — todos os nomes de coluna, tipos,
nullability, índice (`IDX_location_sections_location_id`) e constraint de FK
(`FK_location_sections_location_id`) da migration correspondem exatamente ao que a
entidade `LocationSection` declara, seguindo o mesmo padrão de nomenclatura já usado
em `location_points_of_interest`.

- **app-api/src/modules/locations/entities/location-section.entity.ts:7-20** —
  Inconsistência menor de documentação Swagger: os campos `label`, `description` e
  `order` da entidade `LocationSection` não têm `@ApiProperty()`/`@ApiPropertyOptional()`,
  diferente do padrão usado em `Tag` (`app-api/src/modules/tags/entities/tag.entity.ts`),
  que é a outra entidade referenciada diretamente via `type: () => [X]` em um campo de
  `Location` (no caso, `tags`) e tem todos os seus campos decorados com `@ApiProperty()`.
  Como `Location.sections` foi anotado com
  `@ApiProperty({ type: () => [LocationSection], description: 'Seções do local' })`
  (mesmo estilo de `tags`), o mesmo padrão de decorar os campos da entidade referenciada
  deveria ter sido seguido para manter a metadata Swagger da entidade coerente — mesmo
  que, na prática, a resposta real da API use `LocationSectionResponseDto` (que está
  corretamente documentado) e não a entidade diretamente.
  - Trecho: `@Column()\n  label!: string;` (sem `@ApiProperty()` acima)
  - Sugestão: adicionar `@ApiProperty()`/`@ApiPropertyOptional()` em `label`,
    `description` e `order`, espelhando o que é feito em `Tag.name`/`Tag.color`, para
    manter consistência com o padrão já estabelecido no módulo — ou, alternativamente,
    remover o `@ApiProperty({ type: () => [LocationSection], ... })` do campo `sections`
    em `Location` caso a intenção seja não expor a entidade crua na documentação (assim
    como já ocorre de forma inconsistente/preexistente com `tags`,
    `pointsOfInterest`/`pointsOfInterestOf`, que também não são efetivamente renderizados
    no Swagger servido, já que os controllers só usam DTOs de resposta).

Fora esse ponto de estilo/documentação (não bloqueante), o restante da implementação
está de acordo com os padrões do `CLAUDE.md` e com o spec em
`.claude/tasks/locais-secoes/spec.md`.

**Corrigido:** Os campos `label`, `description` e `order` da entidade `LocationSection`
foram anotados com `@ApiProperty()` e `@ApiPropertyOptional()` respectivamente em
`app-api/src/modules/locations/entities/location-section.entity.ts`, incluindo
descrições em pt-BR e exemplos, alinhando-se com o padrão usado em `Tag` e em
`LocationSectionResponseDto`.
