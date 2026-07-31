# Task Web: Características (Habilidades)

## Contexto
Não há `spec.md` para esta demanda — o escopo e as decisões abaixo foram fornecidos
diretamente pelo solicitante e são tratados como fechados. A referência canônica de
implementação é a feature `talentos` (`app-web/src/app/(authorized)/talentos/`), que
deve ser replicada 1:1 para a nova entidade "Características", consumindo o endpoint
`/characteristics` (mesmo contrato de `/talents`: `name`, `description`, `tags`,
`improvedFrom`, `requirements`, paginação `page`/`perPage`, filtro por `name`).

## Etapas

### 1. web-dev
Status: concluído
Componentes:
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsListItem/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsList/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
Arquivos:
- app-web/src/app/(authorized)/caracteristicas/page.tsx
- app-web/src/shared/routes.ts
- app-web/src/app/(authorized)/components/Sidebar/data/index.ts
- app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts
- app-web/src/shared/formSchemas/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/shared/interfaces/Entities/index.ts
- app-web/src/store/PageStore/CharacteristicsStore/index.ts
- app-web/src/store/index.ts
- app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx
- app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx
- app-web/src/shared/constants/EntityMentions/index.ts

#### Componentes (se necessário)
Todos os componentes necessários já existem como padrão em `shared/components/`
(`EntityReferenceListField`, `EntityReferenceCard`, `EntityReferenceSelectionModal`,
`RichTextViewer`, `TagBadge`, Inputs `Form*`/`Default*`, Modals, Containers, Texts,
Buttons). Nenhum componente novo e genérico precisa ser criado em
`shared/components/`. Os componentes a criar são todos específicos da página
"Características", espelhando exatamente os equivalentes de `talentos/components/`
(nenhuma lógica nova, apenas troca de entidade/nome/rótulos):

- Componente: `CharacteristicsFilterSection`
  (`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`,
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`
  - Comportamento esperado: idêntico a `TalentsFilterSection` — formulário com
    `DefaultTextInput` (id `characteristics-name-filter`, label "Nome", placeholder
    "Buscar por nome", ícone `FiSearch`) e `PrimaryButton` "Filtrar". Nunca inline em
    `page.tsx` (padrão `web-secao-filtros`).

- Componente: `CharacteristicsListItem`
  (`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsListItem/index.tsx`)
  - Props: `characteristic: ICharacteristicListItem`,
    `onView: (characteristic) => void`, `onEdit: (characteristic) => void`,
    `onDelete: (characteristic) => void`
  - Comportamento esperado: idêntico a `TalentsListItem` — linha de tabela com nome,
    tags (`TagBadge`) e ações (Visualizar sempre visível; Editar/Excluir ocultos
    quando `useIsGoogleUser()` for `true`).

- Componente: `CharacteristicsList`
  (`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsList/index.tsx`)
  - Props: `characteristics: ICharacteristicListItem[]`, `total: number`,
    `page: number`, `isLoading: boolean`, `onPageChange`, `onView`, `onEdit`,
    `onDelete`
  - Comportamento esperado: idêntico a `TalentsList` — tabela com colunas Nome/Tags/
    Ações, estado vazio "Nenhuma característica encontrada.", `TablePagination` com
    `APP_DEFAULT_PAGE_SIZE`.

- Componente: `CharacteristicView`
  (`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`)
  - Props: `characteristicId: string`, `onNotFound?: () => void`
  - Comportamento esperado: idêntico a `TalentView` — busca via
    `useGetEntityById<ICharacteristic>({ url: '/characteristics/${characteristicId}' })`,
    exibe nome, tags, descrição (`RichTextViewer`) e as seções "Aprimorado de" e
    "Requisitos" com `EntityReferenceCard`, tratamento de 404 com toast e
    `onNotFound`.

- Componente: `CharacteristicCreateForm`
  (`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`)
  - Props: `onSaved: () => void`
  - Comportamento esperado: idêntico a `TalentCreateForm` — `react-hook-form` com
    `characteristicFormResolver`/`characteristicFormDefaultValues`, campos Nome
    (`FormTextInput`), Tags (`FormMultiAutocompleteInput` sobre `/tags`), Descrição
    (`FormRichTextInput`), e dois `EntityReferenceListField` ("Aprimorado de" /
    "Requisitos", `currentEntityType="characteristic"`), modo edição carregado via
    `useGetEntityById<ICharacteristic>({ url: '/characteristics/${id}', enabled: isEditMode })`,
    submit via `usePostEntity`/`usePutEntity` para `/characteristics` com
    `invalidateQueryKeys: [['/characteristics']]`, toasts de sucesso/erro em pt-BR
    ("Característica cadastrada/atualizada/excluída com sucesso.", "Não foi possível
    cadastrar/atualizar/excluir a característica.").

Todos esses componentes precisam existir antes de a página consumi-los.

#### Funcionalidade
- Páginas/rotas:
  - Criar `app-web/src/app/(authorized)/caracteristicas/page.tsx`, espelhando
    exatamente `talentos/page.tsx`: título "Características", botão "Novo" oculto
    para `isGoogleUser`, estado de filtros (`page`, `perPage: APP_DEFAULT_PAGE_SIZE`,
    `name`), `CharacteristicsFilterSection`, `CharacteristicsList`, `FormModal`
    ("Editar característica" / "Nova característica", `size="wide"`) com
    `CharacteristicCreateForm`, `ViewModal` ("Detalhes da Característica",
    `size="wide"`) com `CharacteristicView`, e `ConfirmationModal` de exclusão
    ("Excluir característica" / `Tem certeza que deseja excluir a característica
    "{nome}"?`).
  - Registrar a rota em `app-web/src/shared/routes.ts`: adicionar
    `characteristics: '/caracteristicas'` em `MENU_ROUTES` e em
    `APP_ROUTES.private` (mesmo padrão de `talents`).
  - Adicionar o item de navegação em
    `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`, na seção
    "Habilidades" (junto de Treinamentos/Talentos/Técnicas/Magias): `{ label:
    'Características', href: APP_ROUTES.private.characteristics, icon: FiLayers }`.
    Importar `FiLayers` de `react-icons/fi` — ícone ainda não utilizado no arquivo e
    coerente com "conjunto de traços/atributos" (nenhum dos ícones já importados
    nesse arquivo é reutilizado). Se `FiLayers` não estiver disponível na versão de
    `react-icons` do projeto, usar `FiAward` como alternativa (também não utilizada e
    coerente).

- Integrações com API:
  - `GET /characteristics` (listagem paginada, filtro `name`) via `useGetEntityList`.
  - `GET /characteristics/:id` (detalhe, view e edição) via `useGetEntityById`.
  - `POST /characteristics` (criação) via `usePostEntity`.
  - `PUT /characteristics/:id` (edição) via `usePutEntity`.
  - `DELETE /characteristics/:id` (exclusão) via `useDeleteEntity`.
  - `GET /tags` (opções de tags no formulário), já reaproveitado do padrão existente.
  - Todas as mutações devem invalidar `[['/characteristics']]`.

- Formulário/validação:
  - Criar `app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts`
    espelhando `TalentFormSchema`:
    ```ts
    export const characteristicFormSchema = z.object({
      name: z.string().min(1, 'Informe o nome'),
      description: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
    });
    ```
    exportar `CharacteristicFormData`, `characteristicFormResolver`
    (`zodResolver`) e `characteristicFormDefaultValues`
    (`{ name: '', description: '', tagIds: [] }`).
  - Registrar `export * from './CharacteristicFormSchema';` em
    `app-web/src/shared/formSchemas/index.ts` (junto às demais entidades de
    Habilidades).
  - `improvedFrom` e `requirements` não fazem parte do schema de zod — assim como em
    talentos, são geridos como estado local (`IEntityReference[]`) no
    `CharacteristicCreateForm` e enviados no payload da mutação junto aos dados do
    formulário (`entityType`/`id` apenas).
  - Criar a interface em
    `app-web/src/shared/interfaces/Entities/Characteristic/index.ts` espelhando
    `Entities/Talent`:
    ```ts
    export interface ICharacteristic extends IEntity {
      name: string;
      description?: string | null;
      tags: ITag[];
      improvedFrom: IEntityReference[];
      requirements: IEntityReference[];
      createdAt: string;
      updatedAt: string;
    }

    export interface ICharacteristicListItem {
      id: string;
      name: string;
      tags: ITag[];
    }

    export interface ICharacteristicListFilters {
      name?: string;
      page?: number;
      perPage?: number;
    }
    ```
    e registrar `export * from './Characteristic';` em
    `app-web/src/shared/interfaces/Entities/index.ts`.
  - Criar o store de seleção em
    `app-web/src/store/PageStore/CharacteristicsStore/index.ts` espelhando
    `TalentsStore` (`useSelectedCharacteristicStore` com `selectedCharacteristic`,
    `setSelectedCharacteristic`, `resetSelectedCharacteristic`), e registrar
    `export * from './PageStore/CharacteristicsStore';` em
    `app-web/src/store/index.ts` (seção "PAGE STORIES", junto às demais entidades de
    Habilidades).

- Pontos transversais que precisam reconhecer o novo `entityType: 'characteristic'`
  (levantados via grep por `entityType`, `'spell'`/`'talent'`/`'technique'` em todo
  `app-web/src/shared`; nenhum deles cria página nova, apenas adiciona uma entrada ao
  padrão existente):
  - `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`:
    adicionar `{ label: 'Características', entityType: 'characteristic', url:
    '/characteristics' }` ao array `ENTITY_REFERENCE_SELECTION_TABS` (faz a aba
    aparecer nos modais de "Adicionar Aprimorado de"/"Adicionar Requisitos" de
    treinamentos, talentos, técnicas, magias e da própria característica).
  - `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`: importar
    `CharacteristicView` de
    `@/app/(authorized)/caracteristicas/components/CharacteristicView` e adicionar a
    entrada `characteristic: ({ entityId, onNotFound }) => (<CharacteristicView
    characteristicId={entityId} onNotFound={onNotFound} />)` ao
    `ENTITY_MENTION_VIEW_REGISTRY`.
  - `app-web/src/shared/constants/EntityMentions/index.ts`: adicionar
    `characteristic: 'característica'` a `ENTITY_MENTION_TYPE_LABELS`,
    `characteristic: (id) => \`/characteristics/${id}\`` a
    `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, e `'characteristic'` ao array
    `ENTITY_MENTION_VIEWABLE_TYPES` (mantém a menção `@` no `RichTextViewer` e a
    lista de sugestão de menção — `MentionSuggestionList` — cobrindo
    características; a busca em si é resolvida pelo backend via `/characteristics`
    e pelo endpoint de busca global, que já retorna qualquer `entityType`
    existente, sem enumeração adicional no frontend).
  - Nenhum outro arquivo de `shared/` enumera tipos de entidade além dos três acima
    (confirmado por grep em `entityType` e nos literais `'talent'`/`'technique'`/
    `'spell'` — os demais resultados são as próprias páginas de treinamentos/
    talentos/técnicas/magias, que não precisam de alteração).

- Acesso Google: ocultar criar/editar/excluir (padrão) — botão "Novo" oculto na
  página, e ações "Editar"/"Excluir" ocultas em `CharacteristicsListItem` quando
  `useIsGoogleUser()` retornar `true`, mantendo apenas "Visualizar", exatamente como
  em `talentos`.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. A etapa "1. web-dev"
está marcada como concluída e a implementação replica fielmente (1:1) a feature de
referência `talentos`, conforme exigido no contexto da task, sem introduzir bugs,
desvios de padrão ou regressões.

Arquivos revisados (comparados linha a linha com seus equivalentes em
`app-web/src/app/(authorized)/talentos/`):
- app-web/src/app/(authorized)/caracteristicas/page.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsListItem/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsList/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
- app-web/src/shared/routes.ts
- app-web/src/app/(authorized)/components/Sidebar/data/index.ts
- app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts
- app-web/src/shared/formSchemas/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/shared/interfaces/Entities/index.ts
- app-web/src/store/PageStore/CharacteristicsStore/index.ts
- app-web/src/store/index.ts
- app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx
- app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx
- app-web/src/shared/constants/EntityMentions/index.ts

Pontos verificados e conformes:
- Rota registrada em `MENU_ROUTES`/`APP_ROUTES.private` (`characteristics: '/caracteristicas'`),
  item de navegação na seção "Habilidades" do Sidebar usando `FiLayers` (ícone ainda
  não utilizado no arquivo, importado de `react-icons/fi`).
- `CharacteristicsFilterSection` é um componente apresentacional dedicado (props
  `nameValue`/`onNameChange`/`onSubmit`), sem estado ou chamada de API própria —
  segue o padrão `web-secao-filtros`; nenhum `<form>` de filtro inline em `page.tsx`.
- `CharacteristicsListItem`/`CharacteristicsList` seguem a estrutura de tabela +
  `TablePagination` com `APP_DEFAULT_PAGE_SIZE`, estado vazio em pt-BR, e ocultam
  Editar/Excluir via `useIsGoogleUser()` (padrão `web-permissao-google-readonly`),
  mantendo apenas Visualizar. Todos os `IconButton` sem texto visível têm
  `aria-label` em pt-BR.
- `CharacteristicView` trata loading, erro genérico e 404 (com `onNotFound` e toast
  "Entidade não encontrada."), exibindo nome, tags, descrição via `RichTextViewer` e
  as seções "Aprimorado de"/"Requisitos" com `EntityReferenceCard`.
- `CharacteristicCreateForm` segue o padrão `web-form-cadastro`: renderizado dentro
  de `FormModal`, modo criar/editar derivado de `useSelectedCharacteristicStore`
  (não de prop manual), `react-hook-form` + `zod`
  (`characteristicFormResolver`/`characteristicFormDefaultValues`), `usePostEntity`/
  `usePutEntity` com `invalidateQueryKeys: [['/characteristics']]` em ambas as
  mutações (nenhum `refetch()` manual), toasts de sucesso/erro em pt-BR, e
  `improvedFrom`/`requirements` geridos como estado local `IEntityReference[]` fora
  do schema zod, conforme especificado.
- `ICharacteristic`/`ICharacteristicListItem`/`ICharacteristicListFilters` batem com
  o contrato descrito e com os usos em componentes (sem `any`, sem incompatibilidade
  de tipos com `RichTextViewer`, `EntityReferenceListField`, `useGetEntityList`/
  `useGetEntityById`/`usePostEntity`/`usePutEntity`).
- `useSelectedCharacteristicStore` (Zustand) segue o mesmo formato de
  `useSelectedTalentStore`, registrado em `store/index.ts` na seção "PAGE STORIES".
- Pontos transversais de `entityType: 'characteristic'` adicionados corretamente:
  aba "Características" em `ENTITY_REFERENCE_SELECTION_TABS`
  (`EntityReferenceSelectionModal`), entrada no `ENTITY_MENTION_VIEW_REGISTRY`
  (`EntityMentionViewDispatcher`, com import de `CharacteristicView`), e entradas em
  `ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE` e
  `ENTITY_MENTION_VIEWABLE_TYPES` em `shared/constants/EntityMentions`.
- Ícones em todos os arquivos são importados de `react-icons` (`react-icons/fi`);
  nenhum uso de `@mui/icons-material`, SVG customizado ou emoji como ícone
  funcional.
- Nenhuma duplicação de componente genérico: os componentes específicos da página
  reaproveitam `EntityReferenceListField`, `EntityReferenceCard`,
  `EntityReferenceSelectionModal`, `RichTextViewer`, `TagBadge`, Inputs `Form*`/
  `Default*`, Modals, Containers e Texts já existentes em `shared/components/`.
