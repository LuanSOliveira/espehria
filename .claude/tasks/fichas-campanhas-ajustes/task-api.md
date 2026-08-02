# Task API: Ajustes em fichas e campanhas — modais "Usuários Permitidos" e "Fichas Cadastradas"

## Contexto
Não existe `spec.md` para esta demanda; o requisito completo foi fornecido diretamente
pelo orquestrador. A parte de frontend está sendo planejada em paralelo em
`.claude/tasks/fichas-campanhas-ajustes/task-web.md`. Este plano cobre exclusivamente o
`app-api`.

Investigação prévia confirmada no código atual:
- `app-api/src/modules/campaigns/campaigns.service.ts`: não há endpoint dedicado para
  remover um único `allowedUser`; hoje só existe substituição total da lista via
  `PUT /campaigns/:id` (`update()`, linha ~218).
- `CampaignResponseDto` já expõe `allowedUsers: UserResponseDto[]` e `findOwnedById` já
  carrega a relação — o modal (A) já tem dados de listagem via `GET /campaigns/:id`.
- `sheets.service.ts` `findAllPaginated` sempre filtra por `sheet.createdBy = currentUser`
  — o dono da campanha não consegue listar fichas de outros usuários via `GET /sheets`.
  É necessário um endpoint novo.
- `sheets.service.ts` `findAccessibleById`/`update()` só restringem usuários com
  `provider === GOOGLE`; um dono de campanha (não-Google) tecnicamente já conseguiria
  desvincular uma ficha de terceiro via `PUT /sheets/:id` sem nenhuma verificação de que
  a campanha é dele. Isso é uma falha de autorização e não deve ser usado como caminho
  para o modal (B).
- `CampaignsController` usa `@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('blocked')` (nível de classe); `SheetsController` usa apenas
  `JwtAuthGuard`.
- `Sheet.campaign` é `ManyToOne` nullable com `onDelete: 'SET NULL'` — desvincular é um
  `UPDATE` comum de coluna já nullable, sem qualquer alteração de schema.
- `CampaignsModule` hoje registra `TypeOrmModule.forFeature([Campaign, CampaignSection,
  Tag, User])` e não importa `SheetsModule`. `SheetsModule` importa `CampaignsModule` (para
  `CampaignsService.findVisibleForUser` no endpoint `GET /sheets/campaign-options`) e
  registra a entidade `Campaign` diretamente em seu próprio `forFeature`, sem depender do
  módulo de campanhas para isso. Para não criar dependência circular de módulos, o mesmo
  padrão deve ser espelhado no sentido inverso.
- Existe precedente de transação explícita no projeto (`characters.service.ts` e
  `families.service.ts`, ambos usando `DataSource` injetado + `dataSource.transaction(async
  (manager) => { const repo = manager.getRepository(...); ... })`). Este é o padrão a
  seguir para a cascata obrigatória.

## Decisões de arquitetura (justificadas)

1. **Endpoint dedicado para remover um usuário permitido**: será criado
   `DELETE /campaigns/:id/allowed-users/:userId` no `CampaignsController`. Isso evita
   forçar o frontend a reenviar a lista inteira de `allowedUserIds` via `PUT` só para
   remover um item, e dá um ponto único e explícito para acionar a cascata de
   desvínculo de fichas.

   **Importante**: a regra de cascata é uma invariante de dados (“ao remover um usuário
   dos `allowedUsers`, as fichas dele nesta campanha perdem o vínculo”), não uma regra
   exclusiva de um endpoint. Portanto o método `update()` existente (`PUT /campaigns/:id`)
   **também** deve aplicar a mesma cascata quando `dto.allowedUserIds` for informado e
   resultar na remoção de um ou mais usuários que antes estavam em `allowedUsers` — caso
   contrário seria possível burlar a regra usando o endpoint de update genérico. Ambos os
   fluxos devem compartilhar a mesma lógica de cascata (método privado no service),
   executada dentro de uma transação (`DataSource.transaction`).

2. **Listagem de fichas da campanha**: `GET /campaigns/:id/sheets` retorna **lista simples
   (array), sem paginação**. Justificativa: o consumo é um modal de gerenciamento (não uma
   tela de listagem principal), e o projeto já tem precedente de endpoints "para modal/
   seleção" que retornam array plano em vez de `Paginated<X>ResponseDto` (ex.:
   `GET /sheets/campaign-options` → `CampaignOptionResponseDto[]`, e
   `CampaignsService.findVisibleForUser`). O volume esperado de fichas por campanha é
   pequeno (jogadores de uma mesma campanha). Se no futuro isso se mostrar um problema de
   volume, migrar para paginação é uma mudança aditiva e não-quebra de contrato para quem
   já espera um array — mas por ora um array simples é suficiente e mais simples de
   consumir no modal.
   > Sinalização de ambiguidade: não há um requisito explícito sobre volume esperado de
   > fichas por campanha; se o time de produto souber de campanhas com centenas de
   > jogadores, esse ponto deve ser revisitado.

3. **Desvincular uma ficha da campanha (modal B)**: será criado um endpoint dedicado
   `DELETE /campaigns/:id/sheets/:sheetId` no `CampaignsController` (não em
   `SheetsController`, e não reaproveitando `PUT /sheets/:id`). Justificativa: o
   `SheetsService` não tem, e não deveria precisar ter, conhecimento sobre "quem é o dono
   da campanha" — essa é uma regra de autorização do domínio de campanhas. Usar
   `PUT /sheets/:id` como já é tecnicamente possível hoje (falha de autorização
   pré-existente, não deste escopo) permitiria a qualquer usuário autenticado não-Google
   alterar `campaignId` de fichas alheias sem qualquer checagem de propriedade da
   campanha. O novo endpoint valida explicitamente, via `findOwnedById`, que a campanha
   pertence ao usuário autenticado, e que a ficha (`sheetId`) está de fato vinculada a
   essa campanha, antes de setar `campaign = null`. A ficha nunca é excluída, apenas
   desvinculada.

4. **Wiring de módulos sem dependência circular**: `CampaignsModule` passa a registrar a
   entidade `Sheet` diretamente em seu `TypeOrmModule.forFeature([...])` (assim como
   `SheetsModule` já registra `Campaign` diretamente, sem importar `CampaignsModule` só
   para isso). Isso permite injetar `@InjectRepository(Sheet)` dentro de
   `CampaignsService` sem importar `SheetsModule` em `CampaignsModule` (o que criaria
   dependência circular de módulos, já que `SheetsModule` importa `CampaignsModule`).
   `CampaignsService` também passa a injetar `DataSource` (de `typeorm`), seguindo o
   padrão já usado em `characters.service.ts`/`families.service.ts`, para a transação da
   cascata.

5. **Resposta do endpoint de remoção de usuário permitido**: `DELETE
   /campaigns/:id/allowed-users/:userId` retorna `200 OK` com `CampaignResponseDto`
   atualizado (e não `204 No Content`), pois o frontend do modal (A) precisa refletir
   imediatamente a lista de `allowedUsers` já sem o usuário removido, sem precisar de uma
   segunda chamada.

6. **Resposta do endpoint de desvínculo de ficha**: `DELETE /campaigns/:id/sheets/:sheetId`
   retorna `204 No Content`, consistente com o padrão já usado em
   `CampaignsController.remove` e `SheetsController.remove` — o item some da lista do
   modal e não há necessidade de corpo de resposta.

## Etapas

### 1. api-dev

#### Entidade
- Não há criação de entidade nova.
- `Campaign` (existente, sem alteração de colunas): a relação `allowedUsers`
  (`ManyToMany` com `User`, tabela de junção `campaign_allowed_users`) passa a ser
  manipulada também via remoção pontual de um único usuário (usando
  `manager.createQueryBuilder().relation(Campaign, 'allowedUsers').of(campaignId).remove(userId)`
  ou equivalente), além da substituição total já existente em `update()`.
- `Sheet` (existente, sem alteração de colunas): campo `campaign` (`ManyToOne` nullable,
  `onDelete: 'SET NULL'`) passa a ser setado para `null` em massa (todas as fichas de um
  `createdBy` específico dentro de uma campanha) pela cascata do item A, e individualmente
  pelo novo endpoint de desvínculo do item B.
- `CampaignsModule`: adicionar `Sheet` ao `TypeOrmModule.forFeature([Campaign,
  CampaignSection, Tag, User, Sheet])` para permitir `@InjectRepository(Sheet)` em
  `CampaignsService`, sem importar `SheetsModule` (evita dependência circular, já que
  `SheetsModule` importa `CampaignsModule`).
- `CampaignsService`: injetar `DataSource` (de `typeorm`) para uso de
  `dataSource.transaction(...)`, seguindo o padrão de `characters.service.ts` /
  `families.service.ts`.
- Novo método privado compartilhado em `CampaignsService`, ex.:
  `private async unassignSheetsOfRemovedAllowedUsers(manager: EntityManager,
  campaignId: string, removedUserIds: string[]): Promise<void>` — executa, dentro da
  transação recebida, um `UPDATE` em `sheets` setando `campaign = null` onde
  `campaign_id = campaignId AND created_by_id IN (removedUserIds)`. Não faz nada se
  `removedUserIds` estiver vazio.
- Novo método público `removeAllowedUser(campaignId: string, userId: string, currentUser:
  User): Promise<Campaign>`:
  1. Busca a campanha com `findOwnedById(campaignId, currentUser.id)`; se não existir,
     `NotFoundException('Campanha não encontrada.')`.
  2. Verifica se `userId` está de fato em `campaign.allowedUsers`; se não estiver,
     `NotFoundException('Usuário não está na lista de usuários permitidos desta
     campanha.')`.
  3. Dentro de `dataSource.transaction`: remove o usuário da relação `allowedUsers` da
     campanha e chama `unassignSheetsOfRemovedAllowedUsers` para essa campanha e
     `[userId]`.
  4. Retorna a campanha recarregada (com relações) para o controller montar o
     `CampaignResponseDto`.
- Alteração no método `update()` existente: antes de reatribuir
  `campaign.allowedUsers = ...` quando `dto.allowedUserIds !== undefined`, calcular
  `removedUserIds = campaign.allowedUsers.filter(u => !dto.allowedUserIds!.includes(u.id)).map(u => u.id)`.
  Envolver a operação inteira do `update()` (reatribuições de tags/seções/allowedUsers +
  `save`) em `dataSource.transaction`, e, após salvar a campanha, chamar
  `unassignSheetsOfRemovedAllowedUsers(manager, campaign.id, removedUserIds)` na mesma
  transação, caso `removedUserIds` não esteja vazio.
- Novo método `findSheetsOfCampaign(campaignId: string, currentUser: User): Promise<Sheet[]>`:
  1. Confirma propriedade via `findOwnedById(campaignId, currentUser.id)`; se não existir,
     `NotFoundException('Campanha não encontrada.')`.
  2. Busca em `sheetsRepository` todas as fichas com `campaign.id = campaignId`
     (independente de `createdBy`), carregando a relação `createdBy` (para o DTO), sem
     paginação, ordenadas por `name ASC`.
- Novo método `unassignSheet(campaignId: string, sheetId: string, currentUser: User):
  Promise<void>`:
  1. Confirma propriedade da campanha via `findOwnedById`; se não existir,
     `NotFoundException('Campanha não encontrada.')`.
  2. Busca a ficha por `id = sheetId` com relação `campaign`; se não existir OU
     `sheet.campaign?.id !== campaignId`, `NotFoundException('Ficha não encontrada ou
     não vinculada a esta campanha.')`.
  3. Seta `sheet.campaign = null` e salva (`UPDATE` simples, sem excluir a ficha).
- Relacionamentos: nenhum relacionamento novo é criado; a `Sheet` já referencia
  `Campaign` e `User` (`createdBy`) como hoje.

#### Migration
- Necessária: **não**. Nenhuma coluna, tabela, índice ou constraint nova é exigida — a
  coluna `sheets.campaign_id` já é nullable com `ON DELETE SET NULL`, e a tabela
  `campaign_allowed_users` (migration `1784306170000-CreateCampaignAllowedUsersTable`) já
  suporta remoção pontual de linhas da relação `ManyToMany`. Toda a mudança é de lógica de
  aplicação (services/controllers), não de schema.

#### Controller
- Todos os novos endpoints ficam em `CampaignsController` (não em `SheetsController`),
  para reaproveitar o guard de autorização de campanhas e a checagem de propriedade via
  `findOwnedById`.
- Endpoints novos:
  - `DELETE /campaigns/:id/allowed-users/:userId`
    - Parâmetros: `id` (UUID da campanha, `ParseUUIDPipe`), `userId` (UUID do usuário,
      `ParseUUIDPipe`).
    - Resposta: `200 OK` com `CampaignResponseDto` (campanha atualizada, já sem o
      usuário removido em `allowedUsers`).
    - Erros: `404` se a campanha não existir/não pertencer ao usuário autenticado, ou se
      `userId` não estiver na lista de `allowedUsers` da campanha; `400` se algum dos
      IDs não for um UUID válido; `403` herdado do guard (`GoogleAccessGuard` +
      `@GoogleAccess('blocked')` no nível da classe — usuários Google não acessam
      campanhas).
    - Efeito colateral obrigatório (mesma transação): todas as fichas com
      `createdBy = userId` e `campaign = id` passam a ter `campaign = null`.
  - `GET /campaigns/:id/sheets`
    - Parâmetros: `id` (UUID da campanha, `ParseUUIDPipe`).
    - Resposta: `200 OK` com `CampaignSheetResponseDto[]` (array simples, sem
      paginação — ver justificativa na seção de decisões).
    - Erros: `404` se a campanha não existir/não pertencer ao usuário autenticado; `400`
      se `id` não for UUID válido; `403` herdado do guard.
  - `DELETE /campaigns/:id/sheets/:sheetId`
    - Parâmetros: `id` (UUID da campanha, `ParseUUIDPipe`), `sheetId` (UUID da ficha,
      `ParseUUIDPipe`).
    - Resposta: `204 No Content`.
    - Erros: `404` se a campanha não existir/não pertencer ao usuário autenticado, ou se
      a ficha não existir/não estiver vinculada a essa campanha; `400` se algum ID for
      inválido; `403` herdado do guard.
    - Efeito: apenas `sheet.campaign = null`; a ficha nunca é excluída.
- DTOs:
  - Nenhum DTO de request novo é necessário (todos os parâmetros vêm de rota,
    validados via `ParseUUIDPipe`).
  - Novo DTO de resposta `CampaignSheetResponseDto` (novo arquivo, ex.:
    `campaigns/dto/campaign-sheet-response.dto.ts`), com `static fromEntity(sheet:
    Sheet)`, contendo:
    - `id: string` (uuid da ficha)
    - `name: string`
    - `referenceImage: string | null`
    - `level: number`
    - `createdBy: UserResponseDto` (usuário dono da ficha — necessário para o modal
      identificar de quem é cada ficha listada)
  - `CampaignResponseDto` já existente é reaproveitado como resposta do endpoint de
    remoção de usuário permitido (sem alterações no DTO em si).
- Acesso Google: **blocked**, herdado do nível de classe já existente em
  `CampaignsController` (`@UseGuards(JwtAuthGuard, GoogleAccessGuard)` +
  `@GoogleAccess('blocked')`). Nenhuma anotação adicional é necessária nos novos métodos,
  pois o `Reflector` do `GoogleAccessGuard` já combina handler + classe
  (`getAllAndOverride`) e o nível de classe já bloqueia totalmente usuários Google neste
  controller — consistente com o restante dos endpoints de campanhas.

Status: concluído
Entidade: nenhuma entidade nova/alterada em colunas (`Campaign` e `Sheet` mantidos como
estão); `app-api/src/modules/campaigns/campaigns.module.ts` passou a registrar `Sheet`
em `TypeOrmModule.forFeature`.
Migration: não aplicável (nenhuma alteração de schema).
Rotas: DELETE /campaigns/:id/allowed-users/:userId, GET /campaigns/:id/sheets,
DELETE /campaigns/:id/sheets/:sheetId
Arquivos:
- app-api/src/modules/campaigns/campaigns.service.ts (injeção de `Sheet` repository e
  `DataSource`, método privado `unassignSheetsOfRemovedAllowedUsers`, métodos públicos
  `removeAllowedUser`, `findSheetsOfCampaign`, `unassignSheet`, e `update()` alterado para
  calcular `removedUserIds` e envolver a operação em `dataSource.transaction`)
- app-api/src/modules/campaigns/campaigns.controller.ts (endpoints
  `removeAllowedUser`, `findSheets`, `unassignSheet`)
- app-api/src/modules/campaigns/campaigns.module.ts (`Sheet` adicionado ao
  `TypeOrmModule.forFeature`)
- app-api/src/modules/campaigns/dto/campaign-sheet-response.dto.ts (novo DTO
  `CampaignSheetResponseDto` com `fromEntity`)

### 2. api-dev-doc
- Depende da etapa 1.
- Cobrir no Swagger: `@ApiOperation`, `@ApiOkResponse`/`@ApiNoContentResponse`,
  `@ApiNotFoundResponse`, `@ApiForbiddenResponse` (mensagem "Usuários Google não têm
  acesso a campanhas", padrão já usado nos demais endpoints do controller) e
  `@ApiBadRequestResponse` (IDs em formato inválido) para os três novos endpoints,
  seguindo o mesmo estilo de descrição em pt-BR já usado nos demais métodos de
  `CampaignsController`.
- Garantir que `CampaignSheetResponseDto` tenha todas as propriedades anotadas com
  `@ApiProperty`/`@ApiPropertyOptional`, incluindo o campo aninhado `createdBy` com
  `type: () => UserResponseDto`.

Status: concluído

### 3. api-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - A cascata de desvínculo de fichas ser executada dentro da mesma transação em
    **ambos** os caminhos (`DELETE /campaigns/:id/allowed-users/:userId` e `PUT
    /campaigns/:id` com `allowedUserIds` reduzindo a lista).
  - `DELETE /campaigns/:id/sheets/:sheetId` nunca chamar `remove`/`delete` na ficha —
    apenas `save` com `campaign = null`.
  - `GET /campaigns/:id/sheets` e `DELETE /campaigns/:id/sheets/:sheetId` validarem
    propriedade da campanha via `findOwnedById` antes de qualquer operação sobre fichas
    de terceiros.
  - Ausência de dependência circular entre `CampaignsModule` e `SheetsModule` após a
    adição de `Sheet` ao `forFeature` de `CampaignsModule`.
  - Mensagens de erro em pt-BR consistentes com o restante do projeto.

Status: concluído

## Revisão

Arquivos revisados:
- `app-api/src/modules/campaigns/campaigns.service.ts`
- `app-api/src/modules/campaigns/campaigns.controller.ts`
- `app-api/src/modules/campaigns/campaigns.module.ts`
- `app-api/src/modules/campaigns/dto/campaign-sheet-response.dto.ts`
- (leitura de apoio, sem alterações: `app-api/src/modules/sheets/entities/sheet.entity.ts`,
  `app-api/src/modules/sheets/sheets.module.ts`,
  `app-api/src/modules/campaigns/entities/campaign.entity.ts`,
  `app-api/src/modules/campaigns/dto/campaign-response.dto.ts`,
  `app-api/src/modules/users/dto/user-response.dto.ts`,
  `app-api/src/modules/auth/guards/google-access.guard.ts`)

Pontos críticos apontados no escopo da revisão, verificados um a um:

1. **Cascata em ambos os caminhos dentro da mesma transação** — confirmado. Em
   `removeAllowedUser` (`campaigns.service.ts:297-335`), a remoção da relação
   `allowedUsers` e a chamada a `unassignSheetsOfRemovedAllowedUsers` ocorrem dentro do
   mesmo `dataSource.transaction`. Em `update()` (`campaigns.service.ts:194-270`), o
   `removedUserIds` é calculado antes da transação (apenas leitura em memória), mas o
   `save()` da campanha e a chamada a `unassignSheetsOfRemovedAllowedUsers` ocorrem
   dentro do mesmo `dataSource.transaction` — a escrita efetiva no banco (join table de
   `allowedUsers` via `save`, e o `UPDATE` em `sheets`) é atômica em ambos os fluxos.
2. **`unassignSheet` nunca remove a ficha** — confirmado. `campaigns.service.ts:353-375`
   apenas seta `sheet.campaign = null` e chama `sheetsRepository.save(sheet)`; não há
   `remove`/`delete` na ficha.
3. **Validação de propriedade da campanha antes de operar sobre fichas de terceiros** —
   confirmado em `findSheetsOfCampaign` e `unassignSheet`, ambos chamam
   `findOwnedById(campaignId, currentUser.id)` e lançam `NotFoundException` antes de
   qualquer acesso a `sheetsRepository`. Em `unassignSheet` a checagem adicional
   `sheet.campaign?.id !== campaignId` impede desvincular uma ficha de outra campanha
   mesmo que o `sheetId` exista.
4. **Ausência de dependência circular** — confirmado. `campaigns.module.ts` passou a
   registrar `Sheet` diretamente no `TypeOrmModule.forFeature` e não importa
   `SheetsModule`; `sheets.module.ts` continua importando `CampaignsModule` (relação
   unidirecional), espelhando o padrão já usado para `Campaign` dentro de
   `SheetsModule`.
5. **Mensagens de erro em pt-BR** — todas as mensagens novas (`'Campanha não
   encontrada.'`, `'Usuário não está na lista de usuários permitidos desta
   campanha.'`, `'Ficha não encontrada ou não vinculada a esta campanha.'`) estão em
   pt-BR e consistentes com o padrão do restante do arquivo.

Outros pontos verificados (DTOs, Swagger, wiring de módulo, segurança):
- `CampaignSheetResponseDto` expõe exatamente os campos definidos na etapa 1
  (`id`, `name`, `referenceImage`, `level`, `createdBy`), usa `fromEntity` e não vaza
  campos sensíveis; `createdBy` é montado via `UserResponseDto.fromEntity`, que não
  expõe `password`.
- `DELETE /campaigns/:id/allowed-users/:userId` não usa `@HttpCode`, ficando no
  default `200` do Nest para `@Delete`, coerente com a decisão de retornar
  `CampaignResponseDto` no corpo; `DELETE /campaigns/:id/sheets/:sheetId` usa
  `@HttpCode(HttpStatus.NO_CONTENT)` explicitamente, coerente com o padrão de
  `remove()` já existente no controller.
  a `GoogleAccessGuard` + `@GoogleAccess('blocked')` de nível de classe cobre os três
  novos endpoints sem necessidade de anotação por método (confirmado pelo uso de
  `getAllAndOverride` em `google-access.guard.ts`).
- Documentação Swagger (etapa 2) dos três novos endpoints inclui `@ApiOperation`,
  `@ApiOkResponse`/`@ApiNoContentResponse`, `@ApiNotFoundResponse`,
  `@ApiForbiddenResponse` e `@ApiBadRequestResponse`, com descrições em pt-BR
  coerentes com o comportamento real; `CampaignSheetResponseDto` tem todas as
  propriedades anotadas, incluindo `createdBy` com `type: () => UserResponseDto`.
- A releitura de `findOwnedById` ao final de `removeAllowedUser` (após a transação)
  não é redundante: é necessária porque a remoção do usuário de `allowedUsers` foi
  feita via `relation(...).remove(...)` diretamente no banco, sem refletir no array
  `allowedUsers` já carregado em memória — o reload garante que o
  `CampaignResponseDto` retornado reflita o estado pós-remoção.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-api/src/modules/campaigns/campaigns.service.ts`,
`app-api/src/modules/campaigns/campaigns.controller.ts`,
`app-api/src/modules/campaigns/campaigns.module.ts`,
`app-api/src/modules/campaigns/dto/campaign-sheet-response.dto.ts`.
