# Task Web: Biografias

## Contexto
Ver .claude/tasks/biografias/spec.md

## Etapas

### 1. web-dev
Status: concluído
Componentes:
- app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographiesList/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographiesListItem/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyView/index.tsx
Arquivos:
- app-web/src/app/(authorized)/biografias/page.tsx
- app-web/src/shared/interfaces/Entities/Biography/index.ts
- app-web/src/shared/interfaces/Entities/index.ts (registro do barrel)
- app-web/src/shared/formSchemas/BiographyFormSchema/index.ts
- app-web/src/shared/formSchemas/index.ts (registro do barrel)
- app-web/src/store/PageStore/BiographiesStore/index.ts
- app-web/src/store/index.ts (registro do barrel)
- app-web/src/shared/routes.ts (rota `biographies: '/biografias'` em MENU_ROUTES e APP_ROUTES.private)
- app-web/src/app/(authorized)/components/Sidebar/data/index.ts (item "Biografias", ícone FiEdit3, seção JOGO)
- app-web/src/shared/constants/EntityMentions/index.ts (labels/URL/viewable types para `biography`)
- app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx (registro de `BiographyView` para `biography`)

#### Componentes (se necessário)
- Componente: `BiographiesFilterSection`
  - Local: `app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`
  - Comportamento esperado: seguir exatamente o padrão de `TrainingsFilterSection`
    (`app-web/src/app/(authorized)/treinamentos/components/TrainingsFilterSection/index.tsx`)
    — formulário com um único `DefaultTextInput` de busca por nome (ícone `FiSearch`)
    e botão "Filtrar"; os inputs de filtro não ficam inline em `page.tsx`.

  Nenhum outro componente reutilizável novo é necessário: todos os demais blocos
  (miniatura de imagem, tags, listas de melhorias/habilidades adicionais, rich
  text, imagem quadrada com ampliação, placeholders) já existem em
  `shared/components/` (`ImageAvatarPreview`, `TagBadge`, `ImagePreviewDialog`,
  `RichTextViewer`, `EntityReferenceListField`/`EntityReferenceCard`,
  `ImprovementDefectListField`/`ImprovementDefectCard`, `FormRichTextInput`,
  `FormMultiAutocompleteInput`, `FormTextInput`) e serão reaproveitados como estão.

#### Funcionalidade

##### Rota e menu
- Nova rota privada `/biografias`: adicionar `biographies: '/biografias'` em
  `MENU_ROUTES` e em `APP_ROUTES.private` de `app-web/src/shared/routes.ts`.
- Nova entrada "Biografias" na seção `title: 'JOGO'` de
  `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` (junto de
  Regras, Perícias e Condições), com ícone `react-icons/fi` ainda não usado na
  seção (ex.: `FiBookOpen` já está em uso por "Regras" — escolher outro ícone
  livre de conflito visual, ex. `FiUser` já usado por Personagens; sugerir algo
  como `FiEdit3` ou `FiFileText`, evitando reuso de ícone já atribuído a outra
  entrada do menu).

##### Estrutura de página (`app-web/src/app/(authorized)/biografias/`)
- `page.tsx`: réplica estrutural de `treinamentos/page.tsx` — título "Biografias",
  botão "Novo" (oculto para `isGoogleUser`), `BiographiesFilterSection`,
  `BiographiesList` (tabela paginada), `FormModal` com `BiographyCreateForm`,
  `ViewModal` com `BiographyView`, `ConfirmationModal` de exclusão. Estado local:
  `nameInput`, `isFormModalOpen`, `biographyPendingDelete`, `biographyPendingView`,
  `filters` (`page`/`perPage` via `APP_DEFAULT_PAGE_SIZE`).
- `components/BiographiesList/index.tsx`: réplica de `TrainingsList`/`DivinitiesList`
  — `TableContainer`/paginação padrão, cabeçalho de colunas na ordem: Imagem, Nome,
  Tags, Ações; renderiza `BiographiesListItem` por linha.
- `components/BiographiesListItem/index.tsx`: réplica de `DivinitiesListItem` —
  primeira coluna com `ImageAvatarPreview` (`imageUrl={biography.imageReference}`,
  `alt={biography.name}`, placeholder automático quando ausente), depois Nome,
  depois Tags (`TagBadge` por tag), depois ações: "Visualizar" sempre visível
  (`FiEye`), "Editar" (`FiEdit2`) e "Excluir" (`FiTrash2`) somente quando
  `!useIsGoogleUser()`.
- `components/BiographyCreateForm/index.tsx`: réplica de `TrainingCreateForm`,
  adaptada aos campos de Biografia (ver Formulário/validação abaixo).
- `components/BiographyView/index.tsx`: modal de visualização com o layout
  específico (ver detalhamento abaixo), combinando o padrão de imagem
  quadrada/placeholder/ampliação de `DivinityView` com o padrão de seções de
  Melhorias/Habilidades Adicionais de `TrainingView`.
- `components/BiographiesFilterSection/index.tsx`: ver subseção Componentes.

##### Integrações com API
- Listagem: `useGetEntityList<IBiographyListItem, IBiographyListFilters>({ url: '/biographies', filters })`.
- Detalhe (view e edição): `useGetEntityById<IBiography>({ url: '/biographies/{id}' })`.
- Criação: `usePostEntity<IBiography, BiographyPayload>({ url: '/biographies', invalidateQueryKeys: [['/biographies']] })`.
- Atualização: `usePutEntity<IBiography, BiographyPayload>({ url: '/biographies/{id}', invalidateQueryKeys: [['/biographies']] })`.
- Exclusão: `useDeleteEntity({ url: '/biographies/{id}', invalidateQueryKeys: [['/biographies']] })`.
- Tags para o multiautocomplete: reaproveitar `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: 100 } })`, igual a `TrainingCreateForm`.
- Novas interfaces em `shared/interfaces/Entities/Biography/` (`IBiography`,
  `IBiographyListItem`, `IBiographyListFilters`) seguindo o modelo de
  `shared/interfaces/Entities/Training/index.ts` (campos `id`, `name`,
  `description`, `imageReference`, `tags`, `improvements`, `additionalAbilities`,
  `createdAt`/`updatedAt` herdados), sem os campos `flaws`, `improvedFrom` e
  `requirements`.
- Novo store `store/PageStore/BiographiesStore/index.ts`, réplica de
  `TrainingsStore` (`useSelectedBiographyStore` com `selectedBiography`,
  `setSelectedBiography`, `resetSelectedBiography`), exportado em
  `store/index.ts` junto aos demais.

##### Formulário/validação
- Novo schema `shared/formSchemas/BiographyFormSchema/index.ts`, zod + resolver,
  seguindo o padrão de `TrainingFormSchema` combinado com a validação de URL de
  `DivinityFormSchema` (`referenceImage`):
  - `name`: `z.string().min(1, 'Informe o nome')`.
  - `description`: `z.string().optional()`.
  - `tagIds`: `z.array(z.string()).optional()`.
  - `imageReference`: string opcional validada como URL quando preenchida
    (mesmo padrão do `refine` usado em `referenceImage`/`sacredSymbol` de
    `DivinityFormSchema`: `value === '' || z.string().url().safeParse(value).success`),
    com valor padrão `''`.
  - Exportar `BiographyFormData`, `biographyFormResolver`,
    `biographyFormDefaultValues` (`name: ''`, `description: ''`, `tagIds: []`,
    `imageReference: ''`), e registrar em `shared/formSchemas/index.ts`.
  - Não há variante de edição distinta necessária (nenhum campo com
    comportamento diferente entre criar/editar, ao contrário do padrão de senha
    opcional em `UserFormSchema`).
- `BiographyCreateForm`: estado local (fora do schema, como em
  `TrainingCreateForm`) para `additionalAbilities: IEntityReference[]` e
  `improvements: IImprovementDefectItem[]` — SEM estado de `flaws`,
  `improvedFrom` nem `requirements`.
- Layout do formulário, na ordem definida no spec:
  1. Linha com `FormTextInput` (Nome) e `FormMultiAutocompleteInput` (Tags).
  2. `FormTextInput` de `imageReference` (campo de URL/texto, label "Imagem de
     Referência", placeholder de URL).
  3. `FormRichTextInput` de `description`.
  4. `ImprovementDefectListField` único, label "Melhorias", `category="improvement"`,
     `value={improvements}`, `onChange={setImprovements}` — sem `otherListValue`
     (não existe lista de Defeitos para validar exclusividade).
  5. `EntityReferenceListField` único, label "Habilidades Adicionais",
     `value={additionalAbilities}`, `onChange={setAdditionalAbilities}`,
     `otherListValues={[]}` (não há `improvedFrom`/`requirements` para excluir
     mutuamente), `currentEntityType="biography"`,
     `currentEntityId={selectedBiography?.id}` — o buscador com abas
     (Treinamentos, Talentos, Características, Técnicas, Magias) é o mesmo
     componente de `EntityReferenceListField`/`EntityReferenceSelectionModal`
     já usado por Treinamentos, sem alteração de comportamento.
  - Payload de envio (`buildPayload`): `{ ...data, description: data.description || undefined, tagIds: data.tagIds ?? [], imageReference: data.imageReference || undefined, improvements: improvements.map(...), additionalAbilities: additionalAbilities.map(...) }`.
  - Ao carregar dados em modo edição (`reset` a partir de `biographyDetail`),
    popular também `imageReference: biographyDetail.imageReference ?? ''`.

##### Modal de visualização (`BiographyView`)
- Bloco superior, lado a lado (empilhado em telas estreitas, `flex-col sm:flex-row`
  como em `DivinityView`):
  - Coluna esquerda: imagem em formato quadrado (ex. `width: 300, height: 300`,
    proporção 1:1 — ajustar as dimensões de `DivinityView`, que usa retângulo
    300x400, para um quadrado), com placeholder (`FiImage` sobre fundo
    `APP_COLORS.wood`) quando `imageReference` ausente, e ampliação via
    `ImagePreviewDialog` ao clicar, exatamente como o bloco de imagem principal
    de `DivinityView`.
  - Coluna direita: `Title` com o nome; abaixo, as tags (`Chip` por tag, mesmo
    padrão de cor/contraste de `TrainingView`/`DivinityView`); abaixo das tags,
    um bloco `APP_CONTAINER_STYLES.detailSectionBox` com cabeçalho "Descrição"
    (ícone `FiFileText`) e `RichTextViewer` no corpo, igual ao bloco de
    Descrição de `TrainingView`.
- Abaixo do bloco superior: seção "Melhorias" (`APP_CONTAINER_STYLES.detailSectionBox`,
  ícone `FiArrowUpCircle`, lista de `ImprovementDefectCard` ou
  `DefaultText` "Nenhum item adicionado." quando vazia) — sem seção "Defeitos".
- Abaixo de Melhorias: seção "Habilidades Adicionais" (mesmo bloco, ícone
  `FiPlusCircle`, lista de `EntityReferenceCard` ou texto de lista vazia) — sem
  seções "Aprimorado de"/"Requisitos".
- Tratamento de loading/erro/404 (`onNotFound`) idêntico ao de `TrainingView`/
  `DivinityView`.

##### Consumo do search global (web)
- `app-web/src/shared/constants/EntityMentions/index.ts`: adicionar `biography:
  'biografia'` em `ENTITY_MENTION_TYPE_LABELS`; adicionar `biography: (id) =>
  \`/biographies/${id}\`` em `ENTITY_MENTION_DETAIL_URL_BY_TYPE`; adicionar
  `'biography'` em `ENTITY_MENTION_VIEWABLE_TYPES`.
- `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`:
  importar `BiographyView` de
  `app-web/src/app/(authorized)/biografias/components/BiographyView` e
  registrar a entrada `biography: ({ entityId, onNotFound }) => (<BiographyView
  biographyId={entityId} onNotFound={onNotFound} />)` em
  `ENTITY_MENTION_VIEW_REGISTRY`.
- Nenhuma alteração é necessária em
  `shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx` nem na
  interface `ISearchResult` — ambos já são genéricos e passam a reconhecer o
  novo tipo automaticamente a partir dos mapas acima.

##### Acesso Google
- Ocultar criar/editar/excluir (padrão) — `useIsGoogleUser()` consultado em
  `page.tsx` (botão "Novo") e em `BiographiesListItem` (botões Editar/Excluir),
  replicando exatamente `DivinitiesListItem`. `BiographyView` permanece
  totalmente visível para usuários Google (não há campo equivalente a
  "Informações Privadas" de Divindade a ocultar).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/app/(authorized)/biografias/page.tsx
- app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographiesList/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographiesListItem/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyView/index.tsx
- app-web/src/shared/interfaces/Entities/Biography/index.ts
- app-web/src/shared/interfaces/Entities/index.ts
- app-web/src/shared/formSchemas/BiographyFormSchema/index.ts
- app-web/src/shared/formSchemas/index.ts
- app-web/src/store/PageStore/BiographiesStore/index.ts
- app-web/src/store/index.ts
- app-web/src/shared/routes.ts
- app-web/src/app/(authorized)/components/Sidebar/data/index.ts
- app-web/src/shared/constants/EntityMentions/index.ts
- app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx

Pontos verificados especificamente:
- A etapa "1. web-dev" estava marcada como "concluído" antes da revisão.
- `page.tsx`, `BiographiesFilterSection`, `BiographiesList` e `BiographiesListItem` são réplicas estruturais fiéis de `treinamentos`/`divindades` (rota no grupo `(authorized)`, seção de filtros extraída e apresentacional, hooks genéricos `useGetEntityList`/`useDeleteEntity` com `invalidateQueryKeys`, ícones `react-icons/fi`, `aria-label` em pt-BR nos `IconButton`).
- Nenhum resquício de Defeitos/"Aprimorado de"/Requisitos: `IBiography`, `biographyFormSchema`, `BiographyCreateForm` (estado local só com `additionalAbilities`/`improvements`, um único `ImprovementDefectListField` sem par de "Defeitos" e um único `EntityReferenceListField` sem "Aprimorado de"/"Requisitos") e `BiographyView` (apenas seções "Melhorias" e "Habilidades Adicionais") — tudo consistente com o spec.
- Criar/editar/excluir ocultos para `useIsGoogleUser()` em `page.tsx` (botão "Novo") e `BiographiesListItem` (Editar/Excluir); "Visualizar" permanece sempre visível. Backend reforça o mesmo contrato com `@GoogleAccess('read-only')` em `BiographiesController`.
- `BiographyCreateForm` segue o padrão `web-form-cadastro`: renderizado dentro de `FormModal`, modo criar/editar derivado de `useSelectedBiographyStore` (não de prop manual), e as mutations de criação/atualização usam `invalidateQueryKeys: [['/biographies']]`, mesma query key usada por `useGetEntityList` na listagem — sem `refetch()` manual.
- Contrato de API aderente (sem alterações em `app-api`): `CreateBiographyDto`/`UpdateBiographyDto` aceitam exatamente `name`, `description`, `imageReference`, `tagIds`, `additionalAbilities`, `improvements`; `BiographyResponseDto`/`BiographyListItemResponseDto`/`PaginatedBiographiesResponseDto`/`FindBiographiesQueryDto` batem com `IBiography`/`IBiographyListItem`/`IBiographyListFilters` e com o payload construído em `buildPayload`.
- Ícones exclusivamente de `react-icons/fi`; ícone `FiEdit3` do item "Biografias" no Sidebar não colide com os demais itens da seção "JOGO".
- Registro do search global (`EntityMentions`, `EntityMentionViewDispatcher`) completo e consistente com os demais tipos já registrados.
