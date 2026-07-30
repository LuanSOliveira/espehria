# Task Web: Itens (Equipamentos, Materiais, Consumíveis, Munições)

## Contexto

Não há `.claude/tasks/itens/spec.md` — requisito recebido diretamente do
orquestrador (pedido reproduzido integralmente na mensagem de disparo desta
task). O backend correspondente está sendo planejado em paralelo em
`.claude/tasks/itens/task-api.md` (ainda não existe no momento deste
planejamento — ver nota de contrato abaixo).

**As 4 entidades têm estrutura idêntica** — mesmos campos, mesmas regras,
mesmo layout de listagem/formulário/visualização, diferindo apenas em nome/
rota/textos pt-BR. Este plano descreve o padrão uma única vez e aplica-o 4x
via a tabela de nomenclatura abaixo, seguindo a orientação do pedido de não
inventar abstração genérica além do que os padrões já existentes no projeto
sugerem (cada entidade continua com seus próprios arquivos de
Filter/List/ListItem/CreateForm/View/interface/store/schema — nunca
componentes compartilhados entre entidades, mesmo sendo visualmente
idênticos; mesmo precedente já usado em Raças/Eras/Eventos/Divindades/
Personagens/Organizações/Famílias).

### Template de replicação (investigação de código existente)

A feature `organizacoes` (`app-web/src/app/(authorized)/organizacoes/`) é o
**template exato** a replicar: é a entidade já implementada com o conjunto de
campos mais próximo do pedido — `name` (obrigatório), `referenceImage`
(texto, URL), `tagIds` (reaproveita `FormMultiAutocompleteInput` + `ITag`),
`description` (rich text), `privateInformation` (rich text, com a regra de
permissão de visualização já replicada em várias entidades). A única
diferença estrutural é que `organizacoes` tem também um campo relacional
`members` (não existe no pedido de Itens — **não replicar**) e não tem um
campo `price` (novo aqui, texto simples). Ou seja: **replicar
`organizacoes` integralmente, removendo `members` e adicionando `price`**.
Arquivos usados como referência linha a linha:
`organizacoes/page.tsx`, `organizacoes/components/OrganizationsFilterSection`,
`organizacoes/components/OrganizationsList`+`OrganizationsListItem`,
`organizacoes/components/OrganizationCreateForm`,
`organizacoes/components/OrganizationView`,
`shared/interfaces/Entities/Organization`,
`shared/formSchemas/OrganizationFormSchema`,
`store/PageStore/OrganizationsStore`.

Componentes genéricos já existentes e diretamente reaproveitáveis, sem
necessidade de criação: `ImageAvatarPreview`, `ImagePreviewDialog`,
`RichTextViewer`, `TagBadge`, `FormModal`, `ViewModal`, `ConfirmationModal`,
`PageContainer`, `Title`/`Label`/`DefaultText`, `PrimaryButton`,
`FormTextInput`, `FormRichTextInput`, `FormMultiAutocompleteInput`,
`DefaultTextInput`, hooks `useGetEntityList`/`useGetEntityById`/
`usePostEntity`/`usePutEntity`/`useDeleteEntity` de `hooks/Queries`, hook
`useIsGoogleUser` de `hooks/Auth`, interface `ITag` (já usada via `GET
/tags` com `useGetEntityList<ITag, ITagListFilters>`). **Não é necessário
criar nenhum componente pequeno novo em `shared/components/`** — todos os
inputs necessários já existem.

### Nomenclatura de propriedades — decisão fixada (contrato ainda não
existente em `task-api.md` no momento deste planejamento)

O pedido escreveu os nomes de campo em inglês entre parênteses
(`referenceImage`, `name`, `price`, `privateInfo`) mas pediu explicitamente,
para `referenceImage`, para seguir "a convenção de nome já usada no
projeto/API (ex.: `referenceImageUrl`) se divergir do nome literal do
pedido". Investigação do código mostrou que a convenção de nome **não é
única** no projeto: `Race`/`Location`/`Era`/`Event`/`Creature` (entidades
mais antigas, confirmado pela ordem cronológica das migrations em
`app-api/src/database/migrations/`) usam `referenceImageUrl`, enquanto
`Divinity`/`Character`/`Organization`/`Family` (as 4 entidades mais
recentes, criadas depois, na mesma ordem das migrations) usam
`referenceImage` (sem sufixo). Como Itens é a próxima leva de entidades a
ser criada, **este plano segue a convenção mais recente/atual: `referenceImage`**
(sem sufixo `Url`), igual a `Divinity`/`Character`/`Organization`/`Family` —
não `referenceImageUrl`. Da mesma forma, `privateInfo` do pedido é
normalizado para `privateInformation`, nome já usado literalmente por
**todas** as entidades que hoje têm esse campo (confirmado inclusive por uma
única migration global `AddPrivateInformationToContentTables` que adicionou
a coluna com esse nome em todas as tabelas de conteúdo de uma vez) — não é
uma divergência aceitável, é o nome já fixado no projeto inteiro. `price`
não tem precedente no projeto; usado literalmente como pedido, campo de
texto simples (sem validação numérica, conforme "input de texto comum").

**Importante para o `web-dev`**: se `task-api.md` (mesmo slug) já existir no
momento da implementação e definir nomes diferentes dos fixados aqui, o
contrato real da API definido lá prevalece — ajustar interfaces/schema/
payload para bater exatamente com o que o backend implementou, sem manter
os nomes deste documento por inércia.

**Contrato assumido** (mesmo formato em todas as 4 entidades, ajustar
`<entidade>`/`<entidades>` pela tabela abaixo):
- `GET /<entidades>` — paginado, filtro `name` (parcial). Retorna `{ data:
  I<Entidade>ListItem[], total, page, perPage }`, cada item com `id`,
  `referenceImage`, `name`, `tags` (`ITag[]`).
- `GET /<entidades>/:id` — detalhe completo: `id`, `name`, `referenceImage`,
  `description`, `price`, `privateInformation`, `tags`, `createdAt`,
  `updatedAt`.
- `POST /<entidades>` / `PUT /<entidades>/:id` — payload `{ name,
  referenceImage?, description?, price?, privateInformation?, tagIds? }`.
- `DELETE /<entidades>/:id` — 204.
- `GET /search?query=...` (já existente) — passa a incluir também resultados
  das 4 novas entidades (`entityType` minúsculo — ver tabela abaixo),
  conforme `task-api.md` em paralelo.

### Tabela de nomenclatura por entidade

| Campo | Equipamentos | Materiais | Consumíveis | Munições |
|---|---|---|---|---|
| Nome em inglês (singular) | `Equipment` | `Material` | `Consumable` | `Ammunition` |
| Rota (`APP_ROUTES.private`) | `equipment: '/equipamentos'` | `materials: '/materiais'` | `consumables: '/consumiveis'` | `ammunition: '/municoes'` |
| Endpoint assumido | `/equipment` | `/materials` | `/consumables` | `/ammunition` |
| Pasta de página | `app/(authorized)/equipamentos/` | `app/(authorized)/materiais/` | `app/(authorized)/consumiveis/` | `app/(authorized)/municoes/` |
| `entityType` (search/@mention) | `equipment` | `material` | `consumable` | `ammunition` |
| Label pt-BR (mention) | `equipamento` | `material` | `consumível` | `munição` |
| Interfaces | `IEquipment`, `IEquipmentListItem`, `IEquipmentListFilters` | `IMaterial`, `IMaterialListItem`, `IMaterialListFilters` | `IConsumable`, `IConsumableListItem`, `IConsumableListFilters` | `IAmmunition`, `IAmmunitionListItem`, `IAmmunitionListFilters` |
| `FilterSection` | `EquipmentFilterSection` | `MaterialsFilterSection` | `ConsumablesFilterSection` | `AmmunitionFilterSection` |
| `List`/`ListItem` | `EquipmentList`/`EquipmentListItem` | `MaterialsList`/`MaterialsListItem` | `ConsumablesList`/`ConsumablesListItem` | `AmmunitionList`/`AmmunitionListItem` |
| `CreateForm` | `EquipmentCreateForm` | `MaterialCreateForm` | `ConsumableCreateForm` | `AmmunitionCreateForm` |
| `View` | `EquipmentView` | `MaterialView` | `ConsumableView` | `AmmunitionView` |
| Store | `useSelectedEquipmentStore` (`PageStore/EquipmentStore`) | `useSelectedMaterialStore` (`PageStore/MaterialsStore`) | `useSelectedConsumableStore` (`PageStore/ConsumablesStore`) | `useSelectedAmmunitionStore` (`PageStore/AmmunitionStore`) |
| Schema | `equipmentFormSchema` (`formSchemas/EquipmentFormSchema`) | `materialFormSchema` (`formSchemas/MaterialFormSchema`) | `consumableFormSchema` (`formSchemas/ConsumableFormSchema`) | `ammunitionFormSchema` (`formSchemas/AmmunitionFormSchema`) |
| Título da página | "Equipamentos" | "Materiais" | "Consumíveis" | "Munições" |
| Item no singular (toasts/labels) | "equipamento"/"o equipamento" | "material"/"o material" | "consumível"/"o consumível" | "munição"/"a munição" |

*(Nomes de arquivo/pasta seguem singular ou plural conforme a gramática do
inglês, mesmo padrão já usado no projeto para `Race`→`RacesList` vs.
`Organization`→`OrganizationCreateForm`: "Equipment"/"Ammunition" são
substantivos incontáveis, por isso não levam "s" extra, diferente de
"Material"→"Materials"/"Consumable"→"Consumables".)*

### Navegação (Sidebar)

Nova seção `'Itens'` em `NAV_SECTIONS`
(`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`),
posicionada **entre `'História'` e `'Gerenciamento'`** (ou seja, imediatamente
acima de `'Gerenciamento'`, conforme pedido — o título já é exibido em
caixa-alta automaticamente pelo componente `Label`/`APP_TEXT_STYLES.label`
usado no cabeçalho de seção, `textTransform: uppercase`, sem necessidade de
escrever "ITENS" literalmente no dado). Itens da seção, nesta ordem (ordem do
pedido): Equipamentos, Materiais, Consumíveis, Munições. Ícones sugeridos
(nenhum reaproveitado dos já usados em `data/index.ts` — `FiHome`,
`FiFeather`, `FiSun`, `FiMapPin`, `MdOutlineFace`, `FiUser`, `FiBriefcase`,
`FiGitBranch`, `FiClock`, `FiCalendar`, `FiUsers`, `FiTag`): `FiTool`
(Equipamentos), `FiPackage` (Materiais), `FiCoffee` (Consumíveis),
`FiCrosshair` (Munições) — a critério do `web-dev` trocar por outro ícone do
mesmo pacote `react-icons/fi` caso algum não pareça adequado, desde que não
repita nenhum ícone já usado no arquivo.

### Busca global / `@menção` (search)

Investigado o mecanismo real de "busca global" consumido hoje no app-web:
**não existe uma barra de busca navegável separada** — o único consumidor de
`GET /search` é a extensão de `@menção` do editor rich text
(`FormRichTextInput`), que já suporta as entidades existentes através de
quatro peças, todas em `shared/`, que precisam ganhar uma entrada por
entidade nova:
- `ENTITY_MENTION_TYPE_LABELS` (`shared/constants/EntityMentions/index.ts`)
  — rótulo pt-BR exibido no menu de sugestão (`"Nome (equipamento)"` etc.):
  adicionar `equipment: 'equipamento'`, `material: 'material'`, `consumable:
  'consumível'`, `ammunition: 'munição'`.
- `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (mesmo arquivo) — usado por
  `RichTextViewer`/`EntityMentionNodeView` para resolver o nome atual da
  entidade mencionada via `useGetEntityById`: adicionar `equipment: (id) =>
  \`/equipment/${id}\``, `material: (id) => \`/materials/${id}\``,
  `consumable: (id) => \`/consumables/${id}\``, `ammunition: (id) =>
  \`/ammunition/${id}\``.
- `ENTITY_MENTION_VIEWABLE_TYPES` (mesmo arquivo) — adicionar os 4 novos
  `entityType` à lista, tornando a tag de menção clicável para essas
  entidades (mesmo padrão de `creature`/`location`/etc.).
- `ENTITY_MENTION_VIEW_REGISTRY`
  (`shared/components/EntityMentionViewDispatcher/index.tsx`) — adicionar as
  4 entradas mapeando `entityType -> <Entidade>View` (mesmo padrão das
  entradas já existentes, ex. `equipment: ({ entityId, onNotFound }) =>
  <EquipmentView equipmentId={entityId} onNotFound={onNotFound} />`),
  importando cada `View` da respectiva pasta de página (mesmo padrão de
  acoplamento `shared -> app` já usado e documentado nas entradas
  existentes).

Não existem hoje "ícones" nem "rota de destino do resultado" nesse
mecanismo (o clique numa menção abre um `ViewModal`, não navega para uma
rota) — este plano **replica exatamente o padrão existente** (labels +
resolução de detalhe + clicabilidade + view registrada), sem inventar
ícones ou navegação por rota que não existem em nenhuma entidade hoje.

### Permissão Google

Aplicado o padrão default da skill `web-permissao-google-readonly` às 4
páginas (nenhuma instrução do pedido pede comportamento diferente): botão
"Novo" oculto e ações Editar/Excluir ocultas em cada `<Entidade>ListItem`
para `provider: 'google'` via `useIsGoogleUser`, mantendo somente
"Visualizar". A seção "Informações Privadas" também fica oculta na
visualização para usuários Google (`!isGoogleUser &&`), replicando
exatamente o padrão já usado em `RaceView`/`DivinityView`/`OrganizationView`.
O formulário de criar/editar em si **não** precisa de nenhuma checagem
adicional de `isGoogleUser` (nem para ocultar o campo "Informações
Privadas" dentro do form) — o acesso ao formulário já é bloqueado a
montante (ação "Editar"/"Novo" ocultas), mesmo padrão já usado em
`RaceCreateForm`/`OrganizationCreateForm`, que não têm nenhuma checagem de
usuário Google internamente.

## Etapas

### 1. web-dev
Status: concluído
Componentes: `app-web/src/app/(authorized)/equipamentos/components/{EquipmentFilterSection,EquipmentList,EquipmentListItem,EquipmentCreateForm,EquipmentView}/index.tsx`; `app-web/src/app/(authorized)/materiais/components/{MaterialsFilterSection,MaterialsList,MaterialsListItem,MaterialCreateForm,MaterialView}/index.tsx`; `app-web/src/app/(authorized)/consumiveis/components/{ConsumablesFilterSection,ConsumablesList,ConsumablesListItem,ConsumableCreateForm,ConsumableView}/index.tsx`; `app-web/src/app/(authorized)/municoes/components/{AmmunitionFilterSection,AmmunitionList,AmmunitionListItem,AmmunitionCreateForm,AmmunitionView}/index.tsx`
Arquivos: `app-web/src/app/(authorized)/{equipamentos,materiais,consumiveis,municoes}/page.tsx`; `app-web/src/shared/routes.ts`; `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`; `app-web/src/shared/interfaces/Entities/{Equipment,Material,Consumable,Ammunition}/index.ts` + `app-web/src/shared/interfaces/Entities/index.ts`; `app-web/src/store/PageStore/{EquipmentStore,MaterialsStore,ConsumablesStore,AmmunitionStore}/index.ts` + `app-web/src/store/index.ts`; `app-web/src/shared/formSchemas/{EquipmentFormSchema,MaterialFormSchema,ConsumableFormSchema,AmmunitionFormSchema}/index.ts` + `app-web/src/shared/formSchemas/index.ts`; `app-web/src/shared/constants/EntityMentions/index.ts`; `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`. Contrato de API confirmado lendo os DTOs reais em `app-api/src/modules/{equipment,materials,consumables,ammunition}/dto/` (bate integralmente com o assumido no plano — `referenceImage`, `price`, `privateInformation`). Pendência de decisão documental: o bloco "Preço" em `<Entidade>View` foi implementado sempre visível com fallback "Não informado" quando ausente (não condicionado à presença do campo), pois essa é a leitura mais coerente do texto da seção Contexto (frase com instrução aparentemente contraditória — "renderizado apenas quando presente" vs. o parêntese que descreve texto de fallback) e é o padrão já usado em campos opcionais simples equivalentes (ex. `EventView` Data Início/Data Fim) — sinalizando aqui para revisão do code reviewer.

#### Componentes

Aplicar o template abaixo às 4 entidades, substituindo os tokens pela tabela
de nomenclatura da seção Contexto. Todos os componentes são específicos de
página (`app/(authorized)/<pasta>/components/`), nunca em
`shared/components/` — mesmo critério já usado em `organizacoes`/
`divindades`/`racas` (skill `web-componentes`).

- Componente: `<Entidade>FilterSection` (padrão `web-secao-filtros`,
  espelhando `OrganizationsFilterSection`).
  - Props: `nameValue: string`; `onNameChange: (value: string) => void`;
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: `form` (`mt-6 flex max-w-160 flex-wrap
    items-end gap-3`) com um único `DefaultTextInput` "Nome" (busca parcial,
    ícone `FiSearch`) e um `PrimaryButton` "Filtrar" — único filtro é nome,
    sem nenhum outro campo (a entidade não tem categoria/tipo).

- Componentes: `<Entidade>List` + `<Entidade>ListItem` (padrão
  `web-tabela-listagem`, espelhando `OrganizationsList`/
  `OrganizationsListItem`).
  - `<Entidade>ListProps`: `<entidades>: I<Entidade>ListItem[]`; `total:
    number`; `page: number`; `isLoading: boolean`; `onPageChange: (newPage:
    number) => void`; `onView: (item: I<Entidade>ListItem) => void`;
    `onEdit: (item: I<Entidade>ListItem) => void`; `onDelete: (item:
    I<Entidade>ListItem) => void`.
  - Comportamento esperado (`List`): `Table` com colunas "Imagem", "Nome",
    "Tags", "Ações" (`colSpan` do estado vazio = 4, texto pt-BR "Nenhum
    <item> encontrado."/"Nenhuma <item> encontrada." conforme gênero da
    tabela de nomenclatura), `TablePagination` com `APP_DEFAULT_PAGE_SIZE`,
    mesmas cores/bordas (`APP_COLORS.gold`) de `OrganizationsList`. Sem
    coluna de preço na listagem (não pedido explicitamente; preço só
    aparece no modal de visualização e no formulário).
  - `<Entidade>ListItemProps`: item + `onView`/`onEdit`/`onDelete` (mesmas
    assinaturas acima).
  - Comportamento esperado (`ListItem`): célula "Imagem" via
    `ImageAvatarPreview imageUrl={item.referenceImage} alt={item.name}`,
    "Nome", "Tags" (`item.tags.map((tag) => <TagBadge key={tag.id}
    name={tag.name} color={tag.color} />)`), "Ações" com três
    `IconButton`+`Tooltip` — "Visualizar" (`FiEye`, sempre visível),
    "Editar" (`FiEdit2`) e "Excluir" (`FiTrash2`) — as duas últimas
    envolvidas em `{!isGoogleUser && (...)}` via `useIsGoogleUser`, checagem
    feita dentro do próprio `ListItem` (skill
    `web-permissao-google-readonly`), mesmo padrão visual
    (`sx={{ color: APP_COLORS.textBrownDark }}`) de `OrganizationsListItem`.

- Componente: `<Entidade>View` (passado como `children` do `ViewModal`
  genérico; layout específico do pedido, espelhando `OrganizationView` com
  a adição do bloco "Preço").
  - Props: `<entidade>Id: string`; `onNotFound?: () => void` (mesmo
    propósito de `OrganizationViewProps.onNotFound`, usado pelo
    `EntityMentionViewDispatcher`).
  - Comportamento esperado:
    - Busca via `useGetEntityById<I<Entidade>>({ url:
      \`/<entidades>/${<entidade>Id}\` })`. Loading: `CircularProgress` +
      `DefaultText` ("Carregando dados <do/da> <entidade>..."). Erro:
      `showToast`, diferenciando 404 ("Entidade não encontrada." +
      `onNotFound?.()`) de outros erros (mensagem genérica), mesmo padrão de
      `OrganizationView`/`RaceView`.
    - Linha superior (`flex flex-col gap-4 sm:flex-row`):
      - Imagem **quadrada** à esquerda (`width: 400, height: 400,
        objectFit: 'cover', borderRadius: '6px', border: 2px solid
        APP_COLORS.gold`, clicável para `ImagePreviewDialog` quando
        `referenceImage` presente; fallback com `FiImage` centralizado,
        mesmo padrão de `OrganizationView`/`RaceView` — **não** usar a
        imagem retrato 300x400 de `DivinityView`, o pedido pede
        explicitamente "formato quadrado").
      - Coluna à direita (`flex w-full flex-col gap-3`), nesta ordem exata
        (conforme pedido):
        1. `Title` com o nome, mesmo override de estilo sem gradiente já
           usado em `RaceView`/`OrganizationView` (`textAlign: 'left'`,
           `textTransform: 'none'`, `backgroundImage: 'none'`, cor
           `APP_COLORS.textBrownDark`).
        2. Tags: `flex flex-wrap gap-2` de `Chip` coloridos
           (`backgroundColor: tag.color`, `color:
           getContrastTextColor(tag.color)`), renderizado apenas quando
           `tags.length > 0`, mesmo padrão de `OrganizationView`.
        3. Preço: bloco no padrão `APP_CONTAINER_STYLES.detailInfoField`
           (mesmo componente visual usado para "Categoria" em `RaceView`),
           ícone `FiDollarSign`, `Label` "Preço" + `DefaultText` com
           `item.price`, renderizado apenas quando `item.price` estiver
           presente (texto padrão "Não informado" quando ausente, mesmo
           critério dos demais campos opcionais simples da tela).
    - Abaixo da linha superior, dois blocos full-width empilhados (mesmo
      componente visual `APP_CONTAINER_STYLES.detailSectionBox`/
      `detailSectionBoxHeader` + `RichTextViewer` já usado em
      `OrganizationView`, sem o bloco extra de "Membros" que Organização
      tem e que não se aplica aqui):
      1. "Descrição" (ícone `FiFileText`, `value={item.description}`).
      2. "Informações Privadas" (ícone `FiLock`, `value=
         {item.privateInformation}`), **envolvido em `{!isGoogleUser &&
         (...)}`**, exatamente a mesma checagem de
         `RaceView`/`DivinityView`/`OrganizationView`.

- Componente: `<Entidade>CreateForm` (dentro de `FormModal`, seguindo
  `web-form-cadastro`, espelhando `OrganizationCreateForm` sem o campo
  `members`).
  - Props: `onSaved: () => void`.
  - Comportamento esperado:
    - Busca as opções de tag via `useGetEntityList<ITag, ITagListFilters>({
      url: '/tags', filters: { perPage: 100 } })`, mesmo padrão de
      `OrganizationCreateForm`.
    - Em modo edição (`isEditMode = !!selected<Entidade>` a partir da
      store), popula o formulário (`reset`) a partir de
      `useGetEntityById<I<Entidade>>({ url:
      \`/<entidades>/${selected<Entidade>?.id}\`, enabled: isEditMode })`:
      `name`, `referenceImage: detail.referenceImage ?? ''`, `description:
      detail.description ?? ''`, `price: detail.price ?? ''`,
      `privateInformation: detail.privateInformation ?? ''`, `tagIds:
      detail.tags?.map((tag) => tag.id) ?? []`. Mesmo tratamento de loading
      (`CircularProgress` + texto "Carregando dados <do/da>
      <entidade>...") e erro (`showToast`) de `OrganizationCreateForm`.
    - `buildPayload(data): <Entidade>Payload` (interface `<Entidade>Payload
      extends Omit<<Entidade>FormData, 'referenceImage'> { referenceImage?:
      string }`) — retorna `{ ...data, referenceImage: data.referenceImage
      || undefined, description: data.description || undefined, price:
      data.price || undefined, privateInformation: data.privateInformation
      || undefined, tagIds: data.tagIds ?? [] }`.
    - Submissão: `usePostEntity<I<Entidade>, <Entidade>Payload>` (`POST
      /<entidades>`) em criação e `usePutEntity<I<Entidade>,
      <Entidade>Payload>` (`PUT /<entidades>/:id`) em edição, com
      `invalidateQueryKeys: [['/<entidades>']]`, toasts "<Entidade,
      capitalizado> cadastrad<o/a> com sucesso."/"...atualizad<o/a> com
      sucesso." e erro exibindo `error.response?.data?.message` quando
      disponível, mesmo padrão de `OrganizationCreateForm`.
    - Layout (`FormModal` `size="wide"`, obrigatório pela skill
      `web-form-cadastro` — 6 campos e 2 `FormRichTextInput`): grid 1
      (`sm:grid-cols-2 lg:grid-cols-4`) com "Nome" (`FormTextInput`,
      obrigatório), "Imagem Referência" (`FormTextInput`, `name=
      "referenceImage"`), "Preço" (`FormTextInput`, `name="price"`) e
      "Tags" (`FormMultiAutocompleteInput<...FormData, ITag>`); grid 2
      (`lg:grid-cols-2`) com "Descrição" e "Informações Privadas" (ambos
      `FormRichTextInput`).

Estes componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado). Como
são 4 conjuntos idênticos, `web-dev` deve implementá-los seguindo à risca a
tabela de nomenclatura da seção Contexto para nomes de arquivo/pasta/rota/
propriedade — não inventar variações entre as 4 entidades.

#### Funcionalidade

- Rotas/constantes (`app-web/src/shared/routes.ts`): adicionar as 4 chaves
  da tabela de nomenclatura (`equipment: '/equipamentos'`, `materials:
  '/materiais'`, `consumables: '/consumiveis'`, `ammunition: '/municoes'`)
  em `MENU_ROUTES` e replicadas em `APP_ROUTES.private`, sem colisão com
  nenhuma rota já existente.

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`):
  nova seção `{ title: 'Itens', items: [...] }` inserida no array
  `NAV_SECTIONS` imediatamente antes da seção `'Gerenciamento'` (ou seja,
  logo depois de `'História'`), com os 4 itens na ordem do pedido
  (Equipamentos, Materiais, Consumíveis, Munições), `href` a partir de
  `APP_ROUTES.private.<chave>`, ícones conforme sugerido na seção Contexto.
  Nenhuma alteração necessária em `Sidebar/index.tsx`/
  `SidebarSectionAccordion` (já iteram `NAV_SECTIONS` genericamente,
  incluindo accordion/animação de expandir).

- Interfaces (novas, uma pasta por entidade em
  `app-web/src/shared/interfaces/Entities/<Entidade>/index.ts`, exportadas
  em `Entities/index.ts`), reaproveitando `ITag`/`IEntity` já existentes —
  mesmo shape para as 4, só o nome do tipo muda (ver tabela):
  - `I<Entidade>ListItem`: `{ id: string; referenceImage?: string | null;
    name: string; tags: ITag[] }`.
  - `I<Entidade>` (estende `IEntity`): `{ name: string; referenceImage?:
    string | null; description?: string | null; price?: string | null;
    privateInformation?: string | null; tags: ITag[]; createdAt: string;
    updatedAt: string }`.
  - `I<Entidade>ListFilters`: `{ name?: string; page?: number; perPage?:
    number }`.

- Stores de feature (uma por entidade, exportadas em `store/index.ts`):
  `app-web/src/store/PageStore/<Pasta>Store/index.ts` — `useSelected
  <Entidade>Store`, mesmo padrão de `useSelectedOrganizationStore`
  (`selected<Entidade>: I<Entidade>ListItem | null`, `setSelected<Entidade>`,
  `resetSelected<Entidade>`). Usada apenas para o modo criar/editar do
  `FormModal` — a visualização usa estado local `<entidade>PendingView` na
  própria `page.tsx`, mesma separação de responsabilidades já usada em
  `organizacoes`/`racas`/`divindades`.

- Schemas de formulário (um por entidade, exportados em
  `shared/formSchemas/index.ts`):
  `app-web/src/shared/formSchemas/<Entidade>FormSchema/index.ts` —
  `<entidade>FormSchema`, `<Entidade>FormData`, `<entidade>FormResolver`,
  `<entidade>FormDefaultValues` (`{ name: '', referenceImage: '',
  description: '', price: '', privateInformation: '', tagIds: [] }`). Sem
  variante de edição (schema único para criar/editar), mesma decisão já
  usada em Organizações/Divindades/Raças.

- Páginas de listagem (uma por entidade,
  `app-web/src/app/(authorized)/<pasta>/page.tsx`), seguindo a estrutura de
  `OrganizationsPage`:
  - `PageContainer` com `Title` (título da tabela de nomenclatura) e
    `PrimaryButton` "Novo" abrindo o `FormModal` em modo criação
    (`resetSelected<Entidade>` antes de abrir), oculto para
    `provider: 'google'` (`!isGoogleUser &&`).
  - Filtros via `<Entidade>FilterSection` (`nameValue` em estado local,
    aplicado a `filters` do `useGetEntityList` como `name` — trim, `||
    undefined` — ao submeter, resetando `page` para 1).
  - Listagem via `useGetEntityList<I<Entidade>ListItem,
    I<Entidade>ListFilters>` contra `GET /<entidades>`, com paginação
    (`APP_DEFAULT_PAGE_SIZE`).
  - `<Entidade>List` recebendo os dados + `onView`/`onEdit`/`onDelete`.
  - Visualização: estado local `<entidade>PendingView: I<Entidade>ListItem
    | null`; `handleView` seta esse estado; `<ViewModal
    open={!!<entidade>PendingView} onClose={() =>
    set<Entidade>PendingView(null)} title="Detalhes <do/da>
    <Entidade>" size="wide">{<entidade>PendingView && <<Entidade>View
    <entidade>Id={<entidade>PendingView.id} />}</ViewModal>`.
  - Edição: `onEdit` seta `selected<Entidade>` na store com o item da
    listagem e abre o `FormModal` (`title={selected<Entidade> ? 'Editar
    <entidade>' : 'Nov<o/a> <entidade>'}`, `size="wide"`).
  - Exclusão: `ConfirmationModal` com mensagem `Tem certeza que deseja
    excluir <o/a> <entidade> "{name}"?`, usando `useDeleteEntity` contra
    `DELETE /<entidades>/:id`, invalidando `[['/<entidades>']]` e exibindo
    toast de sucesso/erro.

- Integrações com API consumidas por cada uma das 4 páginas:
  - `GET /<entidades>` — listagem paginada, filtro `name`.
  - `GET /<entidades>/:id` — detalhe completo, usado em modo edição
    (`<Entidade>CreateForm`) e na visualização (`<Entidade>View`).
  - `POST /<entidades>` / `PUT /<entidades>/:id` / `DELETE
    /<entidades>/:id`.
  - `GET /tags` — já existente, reaproveitado para as opções de
    `FormMultiAutocompleteInput` (campo Tags), sem novo hook.
  - `GET /search` — já existente, sem alteração de código no front-end além
    dos registros em `shared/constants/EntityMentions` e
    `EntityMentionViewDispatcher` descritos na seção Contexto (o back-end é
    quem passa a incluir os 4 novos tipos no resultado, via `task-api`).

- Formulário/validação (schema `<entidade>FormSchema`, idêntico nas 4
  entidades):
  - `name` → "Nome" → `FormTextInput` → obrigatório
    (`z.string().min(1, 'Informe o nome')`) — único campo obrigatório,
    conforme pedido.
  - `referenceImage` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL via `refine` (mesmo padrão de
    `OrganizationFormSchema.referenceImage`/`DivinityFormSchema.
    referenceImage` — `z.string().refine((value) => value === '' ||
    z.string().url().safeParse(value).success, 'Informe uma URL de imagem
    válida')` — **não** usar `z.union`, mesmo bug já conhecido/documentado
    nas demais features).
  - `price` → "Preço" → `FormTextInput` → opcional, texto livre
    (`z.string()`, sem `refine` — "input de texto comum", sem validação
    numérica pedida).
  - `description` → "Descrição" → `FormRichTextInput` → opcional
    (`z.string()`, sem `refine` de não-vazio).
  - `privateInformation` → "Informações Privadas" → `FormRichTextInput` →
    opcional (`z.string()`), sem nenhuma checagem de `isGoogleUser` dentro
    do form (ver justificativa na seção Contexto).
  - `tagIds` → "Tags" → `FormMultiAutocompleteInput` → opcional
    (`z.array(z.string()).optional()`).

- Acesso Google: padrão default aplicado nas 4 páginas — botão "Novo" e
  ações Editar/Excluir ocultos para `provider: 'google'` (`useIsGoogleUser`),
  mantendo apenas "Visualizar"; seção "Informações Privadas" também oculta
  na visualização para esses usuários. Nenhuma instrução do pedido pede
  comportamento diferente do padrão da skill
  `web-permissao-google-readonly`.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Revisão realizada lendo integralmente o `task-web.md` (Contexto, Template de
replicação, Nomenclatura de propriedades, Tabela de nomenclatura por
entidade, Navegação, Busca global/`@menção`, Permissão Google, etapa "1.
web-dev" concluída) e o `CLAUDE.md` da raiz, e então comparando arquivo a
arquivo as 4 features replicadas (`equipamentos`, `materiais`, `consumiveis`,
`municoes`) contra o template `organizacoes` e entre si, além de checar o
contrato real da API em `app-api/src/modules/{equipment,materials,consumables,ammunition}/dto/`
e `app-api/src/modules/search/`.

Pontos verificados e conformes:

- **Consistência entre as 4 entidades (risco principal desta demanda)**:
  `page.tsx`, `<Entidade>FilterSection`, `<Entidade>List`/`<Entidade>ListItem`,
  `<Entidade>CreateForm`, `<Entidade>View` das 4 pastas
  (`app-web/src/app/(authorized)/{equipamentos,materiais,consumiveis,municoes}/`)
  foram lidos integralmente e são estruturalmente idênticos entre si e ao
  template `organizacoes` (menos `members`, mais `price`) — nenhum nome de
  arquivo, rota, store, schema, endpoint, `id` de input ou variável trocado
  entre entidades (erro clássico de replicação 4x não ocorreu). Textos pt-BR
  (títulos, toasts, `ConfirmationModal`, fallback "Não informado") conferem
  gênero/artigo corretos por entidade (ex.: "o equipamento"/"o
  material"/"o consumível"/"a munição", "Detalhes do
  Equipamento"/"...Material"/"...Consumível"/"Detalhes da Munição").
- **Contrato com a API real**: `EquipmentResponseDto`/`MaterialResponseDto`/
  `ConsumableResponseDto`/`AmmunitionResponseDto` e os respectivos
  `Create*Dto` (`app-api/src/modules/*/dto/`) usam exatamente `name`,
  `referenceImage` (sem sufixo `Url`, validado com `@IsUrl` no backend — bate
  com o `refine` de URL no zod do front), `description`, `price` (string
  livre), `privateInformation`, `tags`/`tagIds`; rotas `@Controller('equipment'
  |'materials'|'consumables'|'ammunition')` batem com as URLs usadas nos hooks
  do front-end. `search.service.ts`/`linkable-entity-type.enum.ts` já
  registram os 4 `entityType` (`equipment`, `material`, `consumable`,
  `ammunition`) em minúsculo, coerentes com
  `ENTITY_MENTION_TYPE_LABELS`/`ENTITY_MENTION_DETAIL_URL_BY_TYPE`/
  `ENTITY_MENTION_VIEWABLE_TYPES` (`shared/constants/EntityMentions/index.ts`)
  e `ENTITY_MENTION_VIEW_REGISTRY`
  (`shared/components/EntityMentionViewDispatcher/index.tsx`).
- **Permissão Google**: botão "Novo" oculto (`!isGoogleUser &&`) em cada
  `page.tsx`; ações "Editar"/"Excluir" ocultas dentro do próprio
  `<Entidade>ListItem` via `useIsGoogleUser`, mantendo "Visualizar" sempre
  visível; bloco "Informações Privadas" oculto em cada `<Entidade>View`
  (`{!isGoogleUser && (...)}`) — idêntico ao padrão de
  `RaceView`/`DivinityView`/`OrganizationView`. `<Entidade>CreateForm` não tem
  nenhuma checagem de `isGoogleUser` interna, conforme decisão documentada.
- **Layout do `<Entidade>View`**: imagem quadrada 400x400 à esquerda (não a
  variante retrato de `DivinityView`), nome sem gradiente, tags em `Chip`,
  bloco "Preço" com `FiDollarSign` no padrão `detailInfoField`, blocos
  "Descrição"/"Informações Privadas" no padrão `detailSectionBox`/
  `detailSectionBoxHeader` com `RichTextViewer` — tudo replicado
  corretamente de `OrganizationView`/`RaceView`, sem o bloco "Membros" que não
  se aplica a Itens.
- **Decisão sinalizada pelo `web-dev` sobre o bloco "Preço"**: confirmado que
  a implementação (`{equipment.price || NOT_INFORMED}`, bloco sempre
  renderizado) é coerente com o precedente real do projeto — `EventView`
  (`app-web/src/app/(authorized)/eventos/components/EventView/index.tsx`)
  renderiza "Era"/"Data Início"/"Data Fim" sempre visíveis com
  `?? NOT_INFORMED`, nunca condicionados à presença do dado. A leitura do
  `web-dev` está correta; não é necessário alterar para renderização
  condicional.
- **Formulários**: `react-hook-form` + `zod` em
  `shared/formSchemas/{Equipment,Material,Consumable,Ammunition}FormSchema`,
  schema único (sem variante `*EditFormSchema`, mesma decisão já usada em
  Organizações/Divindades/Raças), `referenceImage` validado com `refine`
  (não `z.union`), `price` como texto livre sem validação, `tagIds`
  opcional. `<Entidade>CreateForm` dentro de `FormModal`, modo criar/editar
  derivado de `useSelected<Entidade>Store` (não de prop manual), mutations de
  `POST`/`PUT` com `invalidateQueryKeys: [['/<entidades>']]` corretos —
  listagem recarrega sozinha, nenhum `refetch()` manual.
  Loading/erro tratados (`CircularProgress`, `showToast`) tanto no form
  quanto no `View`.
- **React Query**: uso exclusivo dos hooks genéricos
  `useGetEntityList`/`useGetEntityById`/`usePostEntity`/`usePutEntity`/
  `useDeleteEntity` de `hooks/Queries`; nenhum `useQuery`/`useMutation`
  bespoke.
- **Ícones**: todos de `react-icons/fi` (`FiSearch`, `FiEye`, `FiEdit2`,
  `FiTrash2`, `FiDollarSign`, `FiFileText`, `FiImage`, `FiLock`, `FiTool`,
  `FiPackage`, `FiCoffee`, `FiCrosshair` na Sidebar) — nenhum ícone do
  `@mui/icons-material`, SVG customizado ou emoji. `IconButton` de
  "Visualizar"/"Editar"/"Excluir" têm `aria-label` em pt-BR.
  Ícones novos da Sidebar não colidem com nenhum já usado no arquivo.
- **Reaproveitamento**: nenhum componente novo criado em
  `shared/components/` (confirmado por busca — só
  `EntityMentionViewDispatcher`, que é edição de arquivo já existente);
  `ImageAvatarPreview`, `ImagePreviewDialog`, `RichTextViewer`, `TagBadge`,
  `FormModal`, `ViewModal`, `ConfirmationModal`, `PageContainer`,
  `FormMultiAutocompleteInput`, `DefaultTextInput` reaproveitados como
  previsto, sem duplicação entre as 4 entidades.
- **Seção de filtros**: `<Entidade>FilterSection` é apresentacional
  (`nameValue`/`onNameChange`/`onSubmit` via props, sem estado ou chamada de
  API própria), nenhum `<form>` inline em `page.tsx`.
- **Sidebar**: seção `'Itens'` inserida em `NAV_SECTIONS`
  (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`) exatamente
  entre `'História'` e `'Gerenciamento'`, com os 4 itens na ordem do pedido
  e `href` via `APP_ROUTES.private.<chave>`.
- **Rotas**: as 4 chaves (`equipment`, `materials`, `consumables`,
  `ammunition`) adicionadas em `MENU_ROUTES`/`APP_ROUTES.private`
  (`app-web/src/shared/routes.ts`) sem colisão com rotas existentes.
- **Interfaces/Stores/Schemas**: `I<Entidade>ListItem`/`I<Entidade>`/
  `I<Entidade>ListFilters` (`shared/interfaces/Entities/<Entidade>/index.ts`),
  `useSelected<Entidade>Store` (`store/PageStore/<Pasta>Store`) e
  `<entidade>FormSchema` (`shared/formSchemas/<Entidade>FormSchema`) seguem
  exatamente o shape/nomenclatura fixados na tabela da task, todos
  exportados corretamente nos respectivos `index.ts` agregadores
  (`Entities/index.ts`, `store/index.ts`, `formSchemas/index.ts`).

Arquivos revisados (lista completa): todos os arquivos listados nos campos
"Componentes" e "Arquivos" da etapa "1. web-dev" acima, incluindo
`app-web/src/app/(authorized)/{equipamentos,materiais,consumiveis,municoes}/page.tsx`
e respectivos `components/`, `shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`shared/interfaces/Entities/{Equipment,Material,Consumable,Ammunition}/index.ts`
+ `Entities/index.ts`,
`store/PageStore/{EquipmentStore,MaterialsStore,ConsumablesStore,AmmunitionStore}/index.ts`
+ `store/index.ts`,
`shared/formSchemas/{EquipmentFormSchema,MaterialFormSchema,ConsumableFormSchema,AmmunitionFormSchema}/index.ts`
+ `shared/formSchemas/index.ts`, `shared/constants/EntityMentions/index.ts`,
`shared/components/EntityMentionViewDispatcher/index.tsx`.
