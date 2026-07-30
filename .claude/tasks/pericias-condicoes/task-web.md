# Task Web: Perícias e Condições

## Contexto
Ver .claude/tasks/pericias-condicoes/spec.md

Duas páginas CRUD paralelas e estruturalmente idênticas — "Perícias" (`skills`) e
"Condições" (`conditions`) — seguindo o padrão de `app-web/src/app/(authorized)/regras/**`
(referência de listagem + form + view) acrescido do campo de Tags no padrão de
`app-web/src/app/(authorized)/locais/**`. Depende dos endpoints REST criados pelo plano
de backend (`.claude/tasks/pericias-condicoes/task-api.md`), que deve rodar antes.

Esta task também corrige uma lacuna hoje existente em "Regras" no sistema de menções
(@mention), integrando `rule` junto com os novos tipos `skill` e `condition`.

## Etapas

### 1. web-dev

#### Componentes (se necessário)

- Componente: `SkillsFilterSection` (novo, em `app/(authorized)/pericias/components/SkillsFilterSection`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`
  - Comportamento esperado: réplica exata do padrão `RulesFilterSection` (`app-web/src/app/(authorized)/regras/components/RulesFilterSection`) — formulário com `DefaultTextInput` (campo "Nome", ícone de busca) e `PrimaryButton` "Filtrar"; nenhum input de filtro deve ficar inline em `page.tsx`.

- Componente: `ConditionsFilterSection` (novo, em `app/(authorized)/condicoes/components/ConditionsFilterSection`)
  - Props: idênticas a `SkillsFilterSection`.
  - Comportamento esperado: idêntico a `SkillsFilterSection`, apenas trocando o texto/ids para "Condições".

Todos os demais blocos de UI necessários (inputs de texto/rich text/tags, modais, botões, textos, tabela paginada) já existem em `shared/components/` (`FormTextInput`, `FormRichTextInput`, `FormMultiAutocompleteInput`, `DefaultTextInput`, `RichTextViewer`, `PrimaryButton`/`SecondaryButton`, `FormModal`/`ViewModal`/`ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`) — reaproveitar sem criar novos.

#### Funcionalidade

Estrutura de implementação: para cada entidade (Perícias e Condições) replicar 1:1 a
composição de arquivos já usada por "Regras", acrescentando tags no padrão de "Locais".
Nomes de arquivo sugeridos (ajustáveis pelo `web-dev` mantendo a convenção do projeto):

**Perícias (`skills`)**

- Rotas/páginas:
  - `shared/routes.ts`: adicionar `skills: '/pericias'` em `MENU_ROUTES` e em
    `APP_ROUTES.private`.
  - `app/(authorized)/components/Sidebar/data/index.ts`: adicionar item "Perícias"
    (`href: APP_ROUTES.private.skills`, ícone próprio ex.: `FiZap`) na seção "JOGO",
    ao lado de "Regras".
  - `app/(authorized)/pericias/page.tsx`: réplica de `app/(authorized)/regras/page.tsx`
    — título "Perícias", botão "Novo" (oculto para usuário Google), `SkillsFilterSection`,
    `SkillsList`, `FormModal` com `SkillCreateForm`, `ViewModal` com `SkillView`,
    `ConfirmationModal` de exclusão com mensagem `Tem certeza que deseja excluir a
    perícia "..."?`.
  - `app/(authorized)/pericias/components/SkillsList` e `SkillsListItem`: réplica de
    `RulesList`/`RulesListItem` (tabela Nome + Ações: visualizar sempre, editar/excluir
    apenas se `!isGoogleUser`).
  - `app/(authorized)/pericias/components/SkillCreateForm`: réplica de `RuleCreateForm`
    acrescida da busca de tags (`useGetEntityList<ITag, ITagListFilters>({ url: '/tags',
    filters: { perPage: 100 } })`, sem filtro por tipo) e do campo
    `FormMultiAutocompleteInput` de tags, no mesmo layout de `LocationCreateForm`.
  - `app/(authorized)/pericias/components/SkillSectionsField` e `SkillSectionCard`:
    réplica exata de `RuleSectionsField`/`RuleSectionCard` (campos "Label" + "Descrição"
    rich text dentro de `useFieldArray`, botão "Adicionar Seção" alinhado à direita,
    grade de 2 colunas, remoção direta sem confirmação, bloco omitido no modal de
    visualização quando vazio).
  - `app/(authorized)/pericias/components/SkillView`: réplica de `LocationView` na
    ordem: (1) nome centralizado no topo; (2) tags (chips) logo abaixo; (3) bloco de
    descrição em largura total (`APP_CONTAINER_STYLES.detailSectionBox`); (4) grade de
    seções adicionais (`SkillSectionCard`), omitida se vazia. Sem banner de imagem
    (Perícias não tem esse campo).

- Integrações com API:
  - `GET /skills` (paginado, filtro `name`) via `useGetEntityList<ISkillListItem,
    ISkillListFilters>`.
  - `GET /skills/:id` via `useGetEntityById<ISkill>` (form em modo edição e `SkillView`).
  - `POST /skills` via `usePostEntity<ISkill, SkillPayload>`.
  - `PUT /skills/:id` via `usePutEntity<ISkill, SkillPayload>`.
  - `DELETE /skills/:id` via `useDeleteEntity`.
  - `GET /tags` (`perPage: 100`, sem filtro) para popular as opções do
    `FormMultiAutocompleteInput` de tags.
  - Todas invalidando `[['/skills']]` em criação/edição/exclusão.

- Interfaces novas em `shared/interfaces/Entities/Skill/index.ts`: `ISkillSection`
  (`id`, `label`, `description?`, `order`), `ISkill` (extends `IEntity`; `name`,
  `description?`, `tags: ITag[]`, `sections: ISkillSection[]`, `createdAt`,
  `updatedAt`), `ISkillListItem` (`id`, `name`), `ISkillListFilters` (`name?`, `page?`,
  `perPage?`) — mesmo shape de `IRule`/`IRuleListItem`/`IRuleListFilters` acrescido de
  `tags`.

- Schema/validação em `shared/formSchemas/SkillFormSchema/index.ts` (mesmo padrão de
  `RuleFormSchema` + `tagIds` de `LocationFormSchema`):
  - `name`: string, obrigatório (`min(1, 'Informe o nome')`).
  - `description`: string, opcional (sem `min`, igual a `ruleFormSchema.description`).
  - `tagIds`: `z.array(z.string()).optional()`.
  - `sections`: array de `{ label: string (obrigatório), description?: string }`.
  - Payload de envio (`SkillPayload`) inclui `tagIds` sempre como array (`?? []`) e
    `sections` com `description` convertido para `undefined` quando vazio, igual ao
    `buildPayload` de `RuleCreateForm`/`LocationCreateForm`.

- Store: `store/PageStore/SkillsStore/index.ts` com `useSelectedSkillStore`
  (`selectedSkill: ISkillListItem | null`, `setSelectedSkill`, `resetSelectedSkill`),
  réplica de `useSelectedRuleStore`.

- Acesso Google: ocultar botão "Novo" na página, e "Editar"/"Excluir" no item da
  listagem via `useIsGoogleUser()`, mantendo apenas "Visualizar" — padrão idêntico ao
  já aplicado em `RulesPage`/`RulesListItem` (comportamento padrão da skill
  `web-permissao-google-readonly`, sem alteração solicitada).

**Condições (`conditions`)**

Estrutura, componentes, hooks, schema e store idênticos aos de Perícias acima, apenas
trocando nomenclatura/rota/endpoint:

- Rotas/páginas: `MENU_ROUTES.conditions = '/condicoes'` /
  `APP_ROUTES.private.conditions`; item "Condições" na Sidebar (seção "JOGO", ícone
  próprio ex.: `FiActivity`); `app/(authorized)/condicoes/page.tsx` (título
  "Condições", mensagem de exclusão `Tem certeza que deseja excluir a condição "..."?`);
  `ConditionsList`/`ConditionsListItem`; `ConditionCreateForm`;
  `ConditionSectionsField`/`ConditionSectionCard`; `ConditionView`.
- Integrações com API: `GET /conditions` (paginado, filtro `name`), `GET
  /conditions/:id`, `POST /conditions`, `PUT /conditions/:id`, `DELETE
  /conditions/:id`, mais `GET /tags` (mesmo uso descrito acima); invalidando
  `[['/conditions']]`.
- Interfaces: `shared/interfaces/Entities/Condition/index.ts` com `IConditionSection`,
  `ICondition`, `IConditionListItem`, `IConditionListFilters` — mesmo shape de
  `ISkill*` acima.
- Schema: `shared/formSchemas/ConditionFormSchema/index.ts`, mesmo shape de
  `SkillFormSchema`.
- Store: `store/PageStore/ConditionsStore/index.ts` com `useSelectedConditionStore`,
  mesmo shape de `useSelectedSkillStore`.
- Acesso Google: mesmo padrão (ocultar criar/editar/excluir, manter visualizar).

**Integração com menções e busca (@mention), incluindo correção de "Regras"**

- `shared/constants/EntityMentions/index.ts`:
  - `ENTITY_MENTION_TYPE_LABELS`: adicionar `skill: 'perícia'`, `condition:
    'condição'`, e adicionar a entrada hoje ausente `rule: 'regra'`.
  - `ENTITY_MENTION_DETAIL_URL_BY_TYPE`: adicionar `skill: (id) => \`/skills/${id}\``,
    `condition: (id) => \`/conditions/${id}\``, e a entrada ausente `rule: (id) =>
    \`/rules/${id}\``.
  - `ENTITY_MENTION_VIEWABLE_TYPES`: adicionar `'skill'`, `'condition'` e `'rule'`
    (hoje ausente) ao array.
- `shared/components/EntityMentionViewDispatcher/index.tsx`: adicionar ao
  `ENTITY_MENTION_VIEW_REGISTRY` as entradas `skill` → `SkillView`, `condition` →
  `ConditionView` (importados de `app/(authorized)/pericias/components/SkillView` e
  `app/(authorized)/condicoes/components/ConditionView`, reaproveitando exatamente os
  componentes criados para as páginas de listagem) e `rule` → `RuleView` (já existe em
  `app/(authorized)/regras/components/RuleView`, apenas registrar — nenhuma alteração
  no componente em si é necessária).
- Nenhuma alteração adicional de busca é necessária no app-web: o autocomplete de
  menções consome `GET /search`, cujo retorno já incluirá `Skill`/`Condition` a partir
  da atualização do `SearchService` feita no plano de backend; a atualização de
  `ENTITY_MENTION_TYPE_LABELS` acima é suficiente para exibir o rótulo pt-BR correto
  nas sugestões.
- Acesso Google: não se aplica a esta subseção (visualização de menções é somente
  leitura, disponível para todos os usuários autenticados, sem alteração de
  comportamento por tipo de usuário).

Status: concluído
Componentes: app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsList/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsListItem/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillSectionsField/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillSectionCard/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillView/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsFilterSection/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsList/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsListItem/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionSectionsField/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionSectionCard/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionView/index.tsx
Arquivos: app-web/src/app/(authorized)/pericias/page.tsx, app-web/src/app/(authorized)/condicoes/page.tsx, app-web/src/shared/routes.ts, app-web/src/app/(authorized)/components/Sidebar/data/index.ts, app-web/src/shared/interfaces/Entities/Skill/index.ts, app-web/src/shared/interfaces/Entities/Condition/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/formSchemas/SkillFormSchema/index.ts, app-web/src/shared/formSchemas/ConditionFormSchema/index.ts, app-web/src/shared/formSchemas/index.ts, app-web/src/store/PageStore/SkillsStore/index.ts, app-web/src/store/PageStore/ConditionsStore/index.ts, app-web/src/store/index.ts, app-web/src/shared/constants/EntityMentions/index.ts, app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas (comparando linha a linha com os pares de referência `regras/**` e `locais/**`):

- **Páginas** (`app-web/src/app/(authorized)/pericias/page.tsx`, `.../condicoes/page.tsx`): réplicas fiéis de `regras/page.tsx`; botão "Novo" oculto para `isGoogleUser`; usam `useGetEntityList`/`useDeleteEntity` (hooks genéricos); `invalidateQueryKeys: [['/skills']]` / `[['/conditions']]` na exclusão; modo criar/editar derivado da store `useSelectedSkillStore`/`useSelectedConditionStore` (não de prop manual); `FormModal`/`ViewModal`/`ConfirmationModal` reaproveitados; mensagens de confirmação de exclusão conforme especificado ("Tem certeza que deseja excluir a perícia/condição \"...\"?").
- **`SkillsFilterSection`/`ConditionsFilterSection`**: réplicas exatas de `RulesFilterSection`, apresentacionais (recebem `nameValue`/`onNameChange`/`onSubmit` via props, sem estado ou chamada de API própria), usando `DefaultTextInput` com ícone `FiSearch` (react-icons) e `PrimaryButton`; nenhum filtro inline em `page.tsx`.
- **`SkillsList`/`SkillsListItem`, `ConditionsList`/`ConditionsListItem`**: réplicas de `RulesList`/`RulesListItem`; ícones `FiEdit2`/`FiEye`/`FiTrash2` de `react-icons`; `IconButton` com `aria-label` em pt-BR ("Visualizar"/"Editar"/"Excluir"); ações de editar/excluir dentro do próprio `ListItem` ocultas via `useIsGoogleUser()`, mantendo apenas visualizar — conforme skill `web-permissao-google-readonly`.
- **`SkillCreateForm`/`ConditionCreateForm`**: seguem o padrão `web-form-cadastro` — renderizados dentro de `FormModal` (via `page.tsx`), modo edição derivado de `useSelectedSkillStore`/`useSelectedConditionStore`, e as mutations `usePostEntity`/`usePutEntity` têm `invalidateQueryKeys` apontando para `['/skills']`/`['/conditions']` em sucesso (sem `refetch()` manual). Campo de tags via `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: 100 } })` sem filtro de tipo, com `FormMultiAutocompleteInput`, no mesmo layout de `LocationCreateForm`. Estado de loading (`CircularProgress` + texto) e erro (`showToast` no `useEffect` de `isError`) tratados na busca do detalhe em modo edição.
- **`SkillSectionsField`/`SkillSectionCard` e `ConditionSectionsField`/`ConditionSectionCard`**: réplicas exatas de `RuleSectionsField`/`RuleSectionCard` — `useFieldArray`, botão "Adicionar Seção" alinhado à direita, grade de 2 colunas, remoção direta sem confirmação (`FiTrash2` com `aria-label` pt-BR), bloco omitido no `SkillView`/`ConditionView` quando `sections.length === 0`.
- **`SkillView`/`ConditionView`**: layout na ordem exigida pelo spec — (1) nome centralizado (`Title` customizado) → (2) tags (`Chip` com `getContrastTextColor`) → (3) bloco de descrição em largura total (`APP_CONTAINER_STYLES.detailSectionBox`) → (4) grade de seções adicionais omitida quando vazia; sem banner de imagem (correto, Perícias/Condições não têm esse campo); tratamento de `isLoading` e `isError` (incluindo caso 404 com `onNotFound`), igual ao padrão de `LocationView`/`RuleView`.
- **Interfaces** (`shared/interfaces/Entities/Skill`, `.../Condition`, e registro em `.../Entities/index.ts`): mesmo shape de `IRule`/`IRuleListItem`/`IRuleListFilters` acrescido de `tags: ITag[]`, tipagem correta sem `any`.
- **Schemas** (`shared/formSchemas/SkillFormSchema`, `.../ConditionFormSchema`, registrados em `shared/formSchemas/index.ts`): `zod` + `@hookform/resolvers/zod` (não Yup); `name` obrigatório com mensagem pt-BR "Informe o nome"; `description` opcional sem `min`, igual a `ruleFormSchema.description`; `tagIds` opcional; `sections` com `label` obrigatório ("Informe o label") e `description` opcional — shape idêntico ao pedido.
- **Stores** (`store/PageStore/SkillsStore`, `.../ConditionsStore`, registrados em `store/index.ts`): réplicas exatas de `useSelectedRuleStore`, com `selectedX`/`setSelectedX`/`resetSelectedX`.
- **Rotas** (`shared/routes.ts`): `skills: '/pericias'` e `conditions: '/condicoes'` adicionados tanto em `MENU_ROUTES` quanto em `APP_ROUTES.private`.
- **Sidebar** (`app/(authorized)/components/Sidebar/data/index.ts`): itens "Perícias" (`FiZap`) e "Condições" (`FiActivity`) adicionados à seção "JOGO", ao lado de "Regras", cada um com ícone próprio de `react-icons/fi`.
- **Menções (`shared/constants/EntityMentions/index.ts` e `shared/components/EntityMentionViewDispatcher/index.tsx`)**: os quatro pontos exigidos foram atualizados para `skill`, `condition` e a correção de `rule` (antes ausente) — `ENTITY_MENTION_TYPE_LABELS` (`skill: 'perícia'`, `condition: 'condição'`, `rule: 'regra'`), `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (`/skills/:id`, `/conditions/:id`, `/rules/:id`), `ENTITY_MENTION_VIEWABLE_TYPES` (inclui os três) e `ENTITY_MENTION_VIEW_REGISTRY` (registra `SkillView`, `ConditionView` e `RuleView`, reaproveitando os componentes já criados/existentes, sem duplicação). `EntityMentionPendingView.entityType` é tipado como `string` genérico, então não há union type a atualizar à parte.
- Nenhum uso de `@mui/icons-material`, SVG customizado ou emoji como ícone funcional; todos os ícones vêm de `react-icons/fi`.
- Nenhuma duplicação de componente já existente em `shared/components/` — todos os blocos reutilizáveis (`FormTextInput`, `FormRichTextInput`, `FormMultiAutocompleteInput`, `DefaultTextInput`, `RichTextViewer`, `PrimaryButton`/`SecondaryButton`, `FormModal`/`ViewModal`/`ConfirmationModal`, `PageContainer`, `Title`/`Label`/`DefaultText`) foram reaproveitados sem recriação.

Arquivos revisados: app-web/src/app/(authorized)/pericias/page.tsx, app-web/src/app/(authorized)/condicoes/page.tsx, app-web/src/app/(authorized)/pericias/components/SkillsFilterSection/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsList/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillsListItem/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillSectionsField/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillSectionCard/index.tsx, app-web/src/app/(authorized)/pericias/components/SkillView/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsFilterSection/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsList/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionsListItem/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionCreateForm/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionSectionsField/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionSectionCard/index.tsx, app-web/src/app/(authorized)/condicoes/components/ConditionView/index.tsx, app-web/src/shared/routes.ts, app-web/src/app/(authorized)/components/Sidebar/data/index.ts, app-web/src/shared/interfaces/Entities/Skill/index.ts, app-web/src/shared/interfaces/Entities/Condition/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/formSchemas/SkillFormSchema/index.ts, app-web/src/shared/formSchemas/ConditionFormSchema/index.ts, app-web/src/shared/formSchemas/index.ts, app-web/src/store/PageStore/SkillsStore/index.ts, app-web/src/store/PageStore/ConditionsStore/index.ts, app-web/src/store/index.ts, app-web/src/shared/constants/EntityMentions/index.ts, app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx.
