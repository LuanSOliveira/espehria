# Task Web: Características de Personagem (Treinamentos, Talentos, Técnicas e Magias)

## Contexto
Não existe `spec.md` para esta demanda — o pedido do usuário (reproduzido na mensagem que
originou este plano) é a fonte da verdade. Quatro páginas CRUD novas, agrupadas em uma
nova seção de menu "Características de Personagem":

- **Treinamentos** (`training`) e **Talentos** (`talent`): mesma estrutura de campos
  (`name`, `tags`, `description` rich text) e mesmo layout de visualização — seguem 1:1 o
  padrão já existente de `app-web/src/app/(authorized)/pericias/**` (`skill`), porém
  **sem** o bloco de seções (`sections`/`SkillSectionsField`/`SkillSectionCard`) que
  Perícias/Condições possuem — os campos destas 4 novas entidades são exatamente os
  listados no pedido, nada mais.
- **Técnicas** (`technique`) e **Magias** (`spell`): mesma estrutura de campos
  (`referenceImage`, `name`, `tags`, `description` rich text) e mesmo layout de
  visualização com imagem quadrada — seguem o padrão de imagem já usado em
  `app-web/src/app/(authorized)/equipamentos/**` (`equipment`) e
  `app-web/src/app/(authorized)/utilitarios/**` (`utility`), porém **sem** os campos
  `price`/`privateInformation` que essas entidades têm (não fazem parte do pedido).

Depende dos endpoints REST criados pelo plano de backend
(`.claude/tasks/caracteristicas-personagem/task-api.md`, em elaboração em paralelo), que
seguirá o mesmo padrão de `/skills`/`/conditions` — assume-se portanto endpoints
`/trainings`, `/talents`, `/techniques`, `/spells` (pluralização regular de
`training`/`talent`/`technique`/`spell`, mesma convenção de `skill`→`/skills`,
`condition`→`/conditions`). **web-dev deve confirmar esses nomes de endpoint contra o
`task-api.md` final antes de codar**; se divergirem, ajustar `url` dos hooks de query e
os nomes de arquivo/URL de detalhe em `EntityMentions` de acordo, mantendo o restante do
plano inalterado.

## Etapas

### 1. web-dev

#### Componentes (se necessário)

Nenhum componente genérico novo em `shared/components/` é necessário — todos os blocos de
UI (inputs de texto/rich text/tags, modais, botões, textos, tabela paginada,
`ImagePreviewDialog`) já existem e devem ser reaproveitados exatamente como em
`pericias`/`equipamentos`/`utilitarios`. Apenas as 4 seções de filtro de listagem, que
nunca ficam inline em `page.tsx`, precisam ser criadas (padrão `web-secao-filtros`,
réplica exata de `SkillsFilterSection`/`EquipmentFilterSection`):

- Componente: `TrainingsFilterSection` (`app/(authorized)/treinamentos/components/TrainingsFilterSection`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`
  - Comportamento esperado: réplica exata de `SkillsFilterSection` — `DefaultTextInput` (campo "Nome", ícone `FiSearch`) + `PrimaryButton` "Filtrar".

- Componente: `TalentsFilterSection` (`app/(authorized)/talentos/components/TalentsFilterSection`)
  - Props: idênticas a `TrainingsFilterSection`.
  - Comportamento esperado: idêntico, apenas trocando texto/ids para "Talentos".

- Componente: `TechniquesFilterSection` (`app/(authorized)/tecnicas/components/TechniquesFilterSection`)
  - Props: idênticas a `TrainingsFilterSection`.
  - Comportamento esperado: idêntico, trocando texto/ids para "Técnicas".

- Componente: `SpellsFilterSection` (`app/(authorized)/magias/components/SpellsFilterSection`)
  - Props: idênticas a `TrainingsFilterSection`.
  - Comportamento esperado: idêntico, trocando texto/ids para "Magias".

#### Funcionalidade

**Navegação (menu)**

- `shared/routes.ts`: adicionar em `MENU_ROUTES` e em `APP_ROUTES.private`:
  `trainings: '/treinamentos'`, `talents: '/talentos'`, `techniques: '/tecnicas'`,
  `spells: '/magias'`.
- `app/(authorized)/components/Sidebar/data/index.ts`: adicionar uma nova `NavSection` com
  `title: 'Características de Personagem'` (mesma convenção de capitalização usada nas
  seções existentes, ex. `'Itens'`; a exibição em caixa alta, se houver, é responsabilidade
  do estilo do componente `Sidebar`, não do dado), posicionada no array `NAV_SECTIONS`
  logo **após** a seção `'Itens'` e **antes** da seção `'Gerenciamento'`. Itens (na ordem
  pedida): "Treinamentos" (`APP_ROUTES.private.trainings`), "Talentos"
  (`APP_ROUTES.private.talents`), "Técnicas" (`APP_ROUTES.private.techniques`), "Magias"
  (`APP_ROUTES.private.spells`). Ícones sugeridos de `react-icons/fi` (nenhum ainda em
  uso no arquivo — ajustável pelo web-dev mantendo unicidade): `FiTrendingUp`
  (Treinamentos), `FiStar` (Talentos), `FiTarget` (Técnicas), `FiCloudLightning` (Magias).

**Treinamentos (`training`) — sem imagem, sem seções**

Estrutura de arquivos réplica 1:1 de `pericias`/`skill` (`app-web/src/app/(authorized)/pericias/**`),
**omitindo** completamente `SkillSectionsField`/`SkillSectionCard` e o campo `sections`
(não existe no pedido para estas entidades):

- Páginas/rotas:
  - `app/(authorized)/treinamentos/page.tsx`: réplica de `pericias/page.tsx` — título
    "Treinamentos", botão "Novo" (oculto para usuário Google), `TrainingsFilterSection`,
    `TrainingsList`, `FormModal` com `TrainingCreateForm`, `ViewModal` com `TrainingView`,
    `ConfirmationModal` de exclusão com mensagem `Tem certeza que deseja excluir o
    treinamento "..."?`.
  - `app/(authorized)/treinamentos/components/TrainingsList` e `TrainingsListItem`:
    réplica de `SkillsList`/`SkillsListItem` (tabela Nome + Ações: visualizar sempre,
    editar/excluir apenas se `!isGoogleUser`).
  - `app/(authorized)/treinamentos/components/TrainingCreateForm`: réplica de
    `SkillCreateForm` **sem** `SkillSectionsField` — apenas `FormTextInput` (nome),
    `FormMultiAutocompleteInput` de tags (`useGetEntityList<ITag, ITagListFilters>({ url:
    '/tags', filters: { perPage: 100 } })`) e `FormRichTextInput` (descrição).
  - `app/(authorized)/treinamentos/components/TrainingView`: réplica de `SkillView` **sem**
    o bloco de `sections` — ordem: (1) nome centralizado no topo; (2) tags (chips) logo
    abaixo, centralizadas; (3) bloco de descrição em largura total
    (`APP_CONTAINER_STYLES.detailSectionBox`).

- Integrações com API:
  - `GET /trainings` (paginado, filtro `name`) via `useGetEntityList<ITrainingListItem,
    ITrainingListFilters>`.
  - `GET /trainings/:id` via `useGetEntityById<ITraining>` (form em modo edição e
    `TrainingView`).
  - `POST /trainings` via `usePostEntity<ITraining, TrainingPayload>`.
  - `PUT /trainings/:id` via `usePutEntity<ITraining, TrainingPayload>`.
  - `DELETE /trainings/:id` via `useDeleteEntity`.
  - `GET /tags` (`perPage: 100`, sem filtro) para o `FormMultiAutocompleteInput` de tags.
  - Todas invalidando `[['/trainings']]` em criação/edição/exclusão.

- Interfaces novas em `shared/interfaces/Entities/Training/index.ts`: `ITraining`
  (extends `IEntity`; `name`, `description?`, `tags: ITag[]`, `createdAt`, `updatedAt`),
  `ITrainingListItem` (`id`, `name`, `tags: ITag[]` — para exibir eventualmente na
  listagem se necessário, mesmo shape de `ISkillListItem`), `ITrainingListFilters`
  (`name?`, `page?`, `perPage?`). Registrar em `shared/interfaces/Entities/index.ts`.

- Schema/validação em `shared/formSchemas/TrainingFormSchema/index.ts` (mesmo padrão de
  `SkillFormSchema`, sem `sections`):
  - `name`: string, obrigatório (`min(1, 'Informe o nome')`).
  - `description`: string, opcional (sem `min`).
  - `tagIds`: `z.array(z.string()).optional()`.
  - Payload de envio (`TrainingPayload`) inclui `tagIds` sempre como array (`?? []`).
  - Registrar em `shared/formSchemas/index.ts`.

- Store: `store/PageStore/TrainingsStore/index.ts` com `useSelectedTrainingStore`
  (`selectedTraining: ITrainingListItem | null`, `setSelectedTraining`,
  `resetSelectedTraining`), réplica de `useSelectedSkillStore`. Registrar em
  `store/index.ts`.

- Acesso Google: ocultar botão "Novo" na página, e "Editar"/"Excluir" no item da
  listagem via `useIsGoogleUser()`, mantendo apenas "Visualizar" — padrão idêntico ao já
  aplicado em `SkillsPage`/`SkillsListItem` (comportamento padrão da skill
  `web-permissao-google-readonly`, sem alteração solicitada pelo pedido).

**Talentos (`talent`) — sem imagem, sem seções**

Estrutura, componentes, hooks, schema e store idênticos aos de Treinamentos acima, apenas
trocando nomenclatura/rota/endpoint:

- Rotas/páginas: `app/(authorized)/talentos/page.tsx` (título "Talentos", mensagem de
  exclusão `Tem certeza que deseja excluir o talento "..."?`); `TalentsList`/
  `TalentsListItem`; `TalentCreateForm`; `TalentView` (mesma ordem: nome centralizado →
  tags → bloco de descrição, sem seções).
- Integrações com API: `GET /talents` (paginado, filtro `name`), `GET /talents/:id`,
  `POST /talents`, `PUT /talents/:id`, `DELETE /talents/:id`, mais `GET /tags`; invalidando
  `[['/talents']]`.
- Interfaces: `shared/interfaces/Entities/Talent/index.ts` com `ITalent`,
  `ITalentListItem`, `ITalentListFilters` — mesmo shape de `ITraining*` acima.
- Schema: `shared/formSchemas/TalentFormSchema/index.ts`, mesmo shape de
  `TrainingFormSchema`.
- Store: `store/PageStore/TalentsStore/index.ts` com `useSelectedTalentStore`, mesmo
  shape de `useSelectedTrainingStore`.
- Acesso Google: mesmo padrão (ocultar criar/editar/excluir, manter visualizar).

**Técnicas (`technique`) — com imagem quadrada, sem seções**

Estrutura de arquivos réplica de `equipamentos`/`equipment`
(`app-web/src/app/(authorized)/equipamentos/**`), **sem** os campos `price` e
`privateInformation` (ausentes no pedido) e sem bloco de "Informações Privadas":

- Páginas/rotas:
  - `app/(authorized)/tecnicas/page.tsx`: réplica de `equipamentos/page.tsx` — título
    "Técnicas", botão "Novo" (oculto para usuário Google), `TechniquesFilterSection`,
    `TechniquesList`, `FormModal` com `TechniqueCreateForm`, `ViewModal` com
    `TechniqueView`, `ConfirmationModal` de exclusão com mensagem `Tem certeza que deseja
    excluir a técnica "..."?`.
  - `app/(authorized)/tecnicas/components/TechniquesList` e `TechniquesListItem`: réplica
    de `EquipmentList`/`EquipmentListItem` (tabela Nome + Ações: visualizar sempre,
    editar/excluir apenas se `!isGoogleUser`).
  - `app/(authorized)/tecnicas/components/TechniqueCreateForm`: réplica de
    `EquipmentCreateForm` **sem** os campos `price`/`privateInformation` — grid com
    `FormTextInput` (nome), `FormTextInput` (imagem referência, placeholder
    `https://exemplo.com/imagem.jpg`), `FormMultiAutocompleteInput` de tags, e
    `FormRichTextInput` (descrição) em largura própria (sem par de rich text ao lado, já
    que não há campo de informações privadas).
  - `app/(authorized)/tecnicas/components/TechniqueView`: réplica de `EquipmentView` **sem**
    o bloco condicional "Informações Privadas" (`!isGoogleUser`) e sem o campo de preço —
    layout: imagem quadrada 400x400 (`Box component="img"`, `objectFit: cover`, borda
    dourada, placeholder `FiImage` quando `referenceImage` vazio, clique abre
    `ImagePreviewDialog` já existente em `shared/components/ImagePreviewDialog`) ao lado
    do bloco nome+tags (nome à esquerda, não centralizado — mesmo alinhamento de
    `EquipmentView`); tags (chips) logo abaixo do nome; abaixo dessa seção
    imagem+nome+tags, o bloco de descrição em largura total
    (`APP_CONTAINER_STYLES.detailSectionBox`).

- Integrações com API:
  - `GET /techniques` (paginado, filtro `name`) via `useGetEntityList<ITechniqueListItem,
    ITechniqueListFilters>`.
  - `GET /techniques/:id` via `useGetEntityById<ITechnique>`.
  - `POST /techniques` via `usePostEntity<ITechnique, TechniquePayload>`.
  - `PUT /techniques/:id` via `usePutEntity<ITechnique, TechniquePayload>`.
  - `DELETE /techniques/:id` via `useDeleteEntity`.
  - `GET /tags` (`perPage: 100`, sem filtro) para o `FormMultiAutocompleteInput` de tags.
  - Todas invalidando `[['/techniques']]` em criação/edição/exclusão.

- Interfaces novas em `shared/interfaces/Entities/Technique/index.ts`: `ITechnique`
  (extends `IEntity`; `name`, `referenceImage?: string | null`, `description?`, `tags:
  ITag[]`, `createdAt`, `updatedAt`), `ITechniqueListItem` (`id`, `referenceImage?: string
  | null`, `name`, `tags: ITag[]` — mesmo shape de `IEquipmentListItem`),
  `ITechniqueListFilters` (`name?`, `page?`, `perPage?`). Registrar em
  `shared/interfaces/Entities/index.ts`.

- Schema/validação em `shared/formSchemas/TechniqueFormSchema/index.ts` (mesmo padrão de
  `EquipmentFormSchema`, sem `price`/`privateInformation`):
  - `name`: string, obrigatório (`min(1, 'Informe o nome')`).
  - `referenceImage`: string, opcional — validado como URL válida quando preenchido
    (`refine` idêntico ao de `equipmentFormSchema.referenceImage`: aceita vazio ou URL
    válida, mensagem "Informe uma URL de imagem válida").
  - `tagIds`: `z.array(z.string()).optional()`.
  - `description`: string, opcional.
  - Payload de envio (`TechniquePayload`) com `referenceImage`/`description` convertidos
    para `undefined` quando vazios e `tagIds` sempre como array, igual ao `buildPayload`
    de `EquipmentCreateForm`. Registrar em `shared/formSchemas/index.ts`.

- Store: `store/PageStore/TechniquesStore/index.ts` com `useSelectedTechniqueStore`
  (`selectedTechnique: ITechniqueListItem | null`, `setSelectedTechnique`,
  `resetSelectedTechnique`), réplica de `useSelectedEquipmentStore`. Registrar em
  `store/index.ts`.

- Acesso Google: ocultar botão "Novo" na página, e "Editar"/"Excluir" no item da listagem
  via `useIsGoogleUser()`, mantendo apenas "Visualizar" — mesmo padrão de
  `EquipmentPage`/`EquipmentListItem` (skill `web-permissao-google-readonly`, sem
  alteração solicitada pelo pedido; note que o bloco condicional de "Informações
  Privadas" de `EquipmentView` não se aplica aqui pois esse campo não existe nesta
  entidade).

**Magias (`spell`) — com imagem quadrada, sem seções**

Estrutura, componentes, hooks, schema e store idênticos aos de Técnicas acima, apenas
trocando nomenclatura/rota/endpoint:

- Rotas/páginas: `app/(authorized)/magias/page.tsx` (título "Magias", mensagem de
  exclusão `Tem certeza que deseja excluir a magia "..."?`); `SpellsList`/
  `SpellsListItem`; `SpellCreateForm`; `SpellView` (mesmo layout: imagem quadrada + nome
  ao lado + tags abaixo do nome + bloco de descrição abaixo da seção imagem+nome+tags).
- Integrações com API: `GET /spells` (paginado, filtro `name`), `GET /spells/:id`,
  `POST /spells`, `PUT /spells/:id`, `DELETE /spells/:id`, mais `GET /tags`; invalidando
  `[['/spells']]`.
- Interfaces: `shared/interfaces/Entities/Spell/index.ts` com `ISpell`, `ISpellListItem`,
  `ISpellListFilters` — mesmo shape de `ITechnique*` acima.
- Schema: `shared/formSchemas/SpellFormSchema/index.ts`, mesmo shape de
  `TechniqueFormSchema`.
- Store: `store/PageStore/SpellsStore/index.ts` com `useSelectedSpellStore`, mesmo shape
  de `useSelectedTechniqueStore`.
- Acesso Google: mesmo padrão (ocultar criar/editar/excluir, manter visualizar).

**Integração com busca global (@mention)**

- `shared/constants/EntityMentions/index.ts`:
  - `ENTITY_MENTION_TYPE_LABELS`: adicionar `training: 'treinamento'`, `talent:
    'talento'`, `technique: 'técnica'`, `spell: 'magia'`.
  - `ENTITY_MENTION_DETAIL_URL_BY_TYPE`: adicionar `training: (id) =>
    \`/trainings/${id}\``, `talent: (id) => \`/talents/${id}\``, `technique: (id) =>
    \`/techniques/${id}\``, `spell: (id) => \`/spells/${id}\`` (ajustar os prefixos de
    URL se os endpoints reais do backend divergirem do assumido em Contexto).
  - `ENTITY_MENTION_VIEWABLE_TYPES`: adicionar `'training'`, `'talent'`, `'technique'`,
    `'spell'` ao array.
- `shared/components/EntityMentionViewDispatcher/index.tsx`: adicionar ao
  `ENTITY_MENTION_VIEW_REGISTRY` as entradas `training` → `TrainingView`, `talent` →
  `TalentView`, `technique` → `TechniqueView`, `spell` → `SpellView` (importados dos
  componentes criados acima para as páginas de listagem — reaproveitados, sem
  duplicação).
- Nenhuma alteração adicional de busca é necessária no app-web: o autocomplete de
  menções consome `GET /search`, cujo retorno já incluirá as 4 novas entidades a partir
  da atualização do `SearchService` feita no plano de backend; as atualizações acima em
  `ENTITY_MENTION_TYPE_LABELS`/`ENTITY_MENTION_DETAIL_URL_BY_TYPE`/
  `ENTITY_MENTION_VIEWABLE_TYPES`/`ENTITY_MENTION_VIEW_REGISTRY` são suficientes para
  exibir o rótulo pt-BR correto nas sugestões e permitir a visualização por menção.
- Acesso Google: não se aplica a esta subseção (visualização de menções é somente
  leitura, disponível para todos os usuários autenticados, sem alteração de
  comportamento por tipo de usuário).

Status: concluído
Componentes: app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx, app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx, app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx, app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx, app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx, app-web/src/app/(authorized)/talentos/components/TalentsFilterSection/index.tsx, app-web/src/app/(authorized)/talentos/components/TalentsList/index.tsx, app-web/src/app/(authorized)/talentos/components/TalentsListItem/index.tsx, app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx, app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx, app-web/src/app/(authorized)/tecnicas/components/TechniquesFilterSection/index.tsx, app-web/src/app/(authorized)/tecnicas/components/TechniquesList/index.tsx, app-web/src/app/(authorized)/tecnicas/components/TechniquesListItem/index.tsx, app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx, app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx, app-web/src/app/(authorized)/magias/components/SpellsFilterSection/index.tsx, app-web/src/app/(authorized)/magias/components/SpellsList/index.tsx, app-web/src/app/(authorized)/magias/components/SpellsListItem/index.tsx, app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx, app-web/src/app/(authorized)/magias/components/SpellView/index.tsx
Arquivos: app-web/src/app/(authorized)/treinamentos/page.tsx, app-web/src/app/(authorized)/talentos/page.tsx, app-web/src/app/(authorized)/tecnicas/page.tsx, app-web/src/app/(authorized)/magias/page.tsx, app-web/src/shared/interfaces/Entities/Training/index.ts, app-web/src/shared/interfaces/Entities/Talent/index.ts, app-web/src/shared/interfaces/Entities/Technique/index.ts, app-web/src/shared/interfaces/Entities/Spell/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/formSchemas/TrainingFormSchema/index.ts, app-web/src/shared/formSchemas/TalentFormSchema/index.ts, app-web/src/shared/formSchemas/TechniqueFormSchema/index.ts, app-web/src/shared/formSchemas/SpellFormSchema/index.ts, app-web/src/shared/formSchemas/index.ts, app-web/src/store/PageStore/TrainingsStore/index.ts, app-web/src/store/PageStore/TalentsStore/index.ts, app-web/src/store/PageStore/TechniquesStore/index.ts, app-web/src/store/PageStore/SpellsStore/index.ts, app-web/src/store/index.ts, app-web/src/shared/routes.ts, app-web/src/app/(authorized)/components/Sidebar/data/index.ts, app-web/src/shared/constants/EntityMentions/index.ts, app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx
Pendências: nenhuma. Endpoints e shapes de DTO confirmados contra o código real de app-api/src/modules/{trainings,talents,techniques,spells} antes da implementação (idênticos ao assumido em Contexto/task-api.md).

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas (comparando cada arquivo novo com seu par de referência —
`pericias`/`skill` para Treinamentos/Talentos e `equipamentos`/`equipment` para
Técnicas/Magias — e com o `CLAUDE.md`):

- **Páginas** (`treinamentos/page.tsx`, `talentos/page.tsx`, `tecnicas/page.tsx`,
  `magias/page.tsx`): réplicas fiéis de `SkillsPage`/`EquipmentPage` — `PageContainer`,
  botão "Novo" oculto via `useIsGoogleUser()`, `*FilterSection`, `*List`, `FormModal` +
  `*CreateForm`, `ViewModal` + `*View`, `ConfirmationModal` com mensagens de exclusão
  pt-BR corretas ("Tem certeza que deseja excluir o treinamento/o talento/a técnica/a
  magia..."), `useDeleteEntity`/`useGetEntityList` de `hooks/Queries` com
  `invalidateQueryKeys` apontando para a própria listagem (`[['/trainings']]`,
  `[['/talents']]`, `[['/techniques']]`, `[['/spells']]`).
- **`*FilterSection`** (Trainings/Talents/Techniques/Spells): apresentacionais, sem
  estado ou chamada de API própria, réplica exata de `SkillsFilterSection` (props
  `nameValue`/`onNameChange`/`onSubmit`, `DefaultTextInput` com ícone `FiSearch` de
  `react-icons/fi`, `PrimaryButton` "Filtrar").
- **`*List`/`*ListItem`**: Treinamentos/Talentos seguem a tabela de duas colunas
  (Nome + Ações) de `SkillsList`/`SkillsListItem`; Técnicas/Magias seguem a tabela de
  quatro colunas (Imagem/Nome/Tags/Ações) de `EquipmentList`/`EquipmentListItem`,
  reaproveitando `ImageAvatarPreview` e `TagBadge` já existentes (sem duplicação de
  componentes). Ações de editar/excluir corretamente condicionadas a `!isGoogleUser()`
  via `useIsGoogleUser`, com `aria-label` em pt-BR nos `IconButton`s de
  visualizar/editar/excluir.
- **`*CreateForm`**: `react-hook-form` + `zod` via `shared/formSchemas/*FormSchema`,
  renderizados dentro de `FormModal`, modo criar/editar corretamente derivado das
  stores `useSelected*Store` (não de prop manual). Treinamentos/Talentos omitem
  completamente `SkillSectionsField`/campo `sections`; Técnicas/Magias reproduzem o
  campo `referenceImage` (`FormTextInput` com placeholder de URL) e omitem
  `price`/`privateInformation`. Mutations de criar/editar (`usePostEntity`/
  `usePutEntity`) com `invalidateQueryKeys` corretos, estados de loading (spinner ao
  carregar detalhe em modo edição, `isLoading` no botão de submit) e erro (`showToast`
  em pt-BR) tratados.
- **`*View`**: Treinamentos/Talentos seguem o layout nome centralizado → tags
  centralizadas → bloco de descrição em largura total, sem bloco de seções — idêntico a
  `SkillView` sem `SkillSectionCard`. Técnicas/Magias seguem o layout imagem quadrada
  400x400 (`Box component="img"`, `objectFit: cover`, borda dourada, placeholder
  `FiImage`, clique abre `ImagePreviewDialog`) ao lado do bloco nome (à esquerda) + tags,
  com bloco de descrição em largura total abaixo — idêntico a `EquipmentView` sem preço
  e sem o bloco condicional "Informações Privadas". Estado de loading e erro (404 vs.
  erro genérico) tratados com `showToast` e `onNotFound` para uso pelo
  `EntityMentionViewDispatcher`.
- **Interfaces** (`ITraining`/`ITalent`/`ITechnique`/`ISpell` + `*ListItem`/
  `*ListFilters`) em `shared/interfaces/Entities/<Entidade>/index.ts`, registradas em
  `shared/interfaces/Entities/index.ts`; shapes conferem com os DTOs reais de
  `app-api/src/modules/{trainings,talents,techniques,spells}` (`TrainingResponseDto`,
  `TrainingListItemResponseDto`, `TechniqueResponseDto`, etc.) — sem `sections` para
  Treinamentos/Talentos, sem `price`/`privateInformation` para Técnicas/Magias.
- **Schemas** (`shared/formSchemas/{Training,Talent,Technique,Spell}FormSchema`):
  `name` obrigatório, `description` opcional, `tagIds` opcional; `referenceImage` com o
  mesmo `refine` de URL válida usado em `EquipmentFormSchema` para Técnicas/Magias.
  Todos registrados em `shared/formSchemas/index.ts`.
- **Stores** (`store/PageStore/{Trainings,Talents,Techniques,Spells}Store`): réplicas
  exatas de `useSelectedSkillStore`/`useSelectedEquipmentStore`, registradas em
  `store/index.ts`.
- **Navegação**: `shared/routes.ts` com as 4 novas entradas em `MENU_ROUTES` e
  `APP_ROUTES.private`; `Sidebar/data/index.ts` com a seção "Características de
  Personagem" posicionada corretamente logo após "Itens" e antes de "Gerenciamento",
  itens na ordem pedida, ícones únicos de `react-icons/fi`
  (`FiTrendingUp`/`FiStar`/`FiTarget`/`FiCloudLightning`) sem colisão com os já usados no
  arquivo.
- **Integração com `@mention`**: `ENTITY_MENTION_TYPE_LABELS`,
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE` e `ENTITY_MENTION_VIEWABLE_TYPES` atualizados com
  os 4 novos tipos em pt-BR; `EntityMentionViewDispatcher` com as 4 novas entradas no
  `ENTITY_MENTION_VIEW_REGISTRY`, reaproveitando os componentes `*View` já criados para
  as páginas de listagem (sem duplicação).
- **Confirmação de endpoints**: `app-api/src/modules/{trainings,talents,techniques,
  spells}` existem com `@Controller('trainings'|'talents'|'techniques'|'spells')` e
  DTOs de resposta com os shapes assumidos pelo web-dev; `SearchService` já inclui as 4
  novas entidades, então a integração de busca global funciona sem alterações
  adicionais no app-web.
- Nenhum ícone de `@mui/icons-material` ou biblioteca alternativa encontrado; todos os
  ícones vêm de `react-icons/fi`.
- Nenhuma duplicação de componente genérico: os 4 conjuntos de páginas reaproveitam
  integralmente `shared/components/` (Inputs, Buttons, Modals, Texts, Containers,
  `ImagePreviewDialog`, `ImageAvatarPreview`, `TagBadge`, `RichTextViewer`) sem recriar
  UI equivalente inline.

Arquivos revisados: app-web/src/app/(authorized)/treinamentos/page.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx,
app-web/src/app/(authorized)/talentos/page.tsx,
app-web/src/app/(authorized)/talentos/components/TalentsFilterSection/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentsList/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentsListItem/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx,
app-web/src/app/(authorized)/tecnicas/page.tsx,
app-web/src/app/(authorized)/tecnicas/components/TechniquesFilterSection/index.tsx,
app-web/src/app/(authorized)/tecnicas/components/TechniquesList/index.tsx,
app-web/src/app/(authorized)/tecnicas/components/TechniquesListItem/index.tsx,
app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx,
app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx,
app-web/src/app/(authorized)/magias/page.tsx,
app-web/src/app/(authorized)/magias/components/SpellsFilterSection/index.tsx,
app-web/src/app/(authorized)/magias/components/SpellsList/index.tsx,
app-web/src/app/(authorized)/magias/components/SpellsListItem/index.tsx,
app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx,
app-web/src/app/(authorized)/magias/components/SpellView/index.tsx,
app-web/src/shared/interfaces/Entities/Training/index.ts,
app-web/src/shared/interfaces/Entities/Talent/index.ts,
app-web/src/shared/interfaces/Entities/Technique/index.ts,
app-web/src/shared/interfaces/Entities/Spell/index.ts,
app-web/src/shared/interfaces/Entities/index.ts,
app-web/src/shared/formSchemas/TrainingFormSchema/index.ts,
app-web/src/shared/formSchemas/TalentFormSchema/index.ts,
app-web/src/shared/formSchemas/TechniqueFormSchema/index.ts,
app-web/src/shared/formSchemas/SpellFormSchema/index.ts,
app-web/src/shared/formSchemas/index.ts,
app-web/src/store/PageStore/TrainingsStore/index.ts,
app-web/src/store/PageStore/TalentsStore/index.ts,
app-web/src/store/PageStore/TechniquesStore/index.ts,
app-web/src/store/PageStore/SpellsStore/index.ts, app-web/src/store/index.ts,
app-web/src/shared/routes.ts,
app-web/src/app/(authorized)/components/Sidebar/data/index.ts,
app-web/src/shared/constants/EntityMentions/index.ts,
app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx.
