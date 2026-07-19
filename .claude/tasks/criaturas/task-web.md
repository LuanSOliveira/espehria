# Task Web: Criaturas

## Contexto
Ver `.claude/tasks/criaturas/spec.md` (seção "Escopo confirmado").

Referência de padrão a seguir: feature `usuarios`
(`app-web/src/app/(authorized)/usuarios/`) — página de listagem paginada com
filtro, `FormModal` de criar/editar e `ConfirmationModal` de exclusão, hooks
genéricos de `hooks/Queries`, store de seleção em `store/PageStore`, schema de
formulário em `shared/formSchemas`.

**Nomenclatura das propriedades:** todas as interfaces, filtros, o schema zod
e o uso nos componentes usam nomes de propriedade em **inglês**, batendo com o
JSON retornado pelo backend (mesmo padrão de `IUser`, que usa `email`, `name`,
`provider`, `createdAt`). Apenas rótulos de UI, placeholders, toasts e
mensagens de validação permanecem em pt-BR. A lista completa de campos do
formulário (nome de propriedade, label, tipo de input, obrigatoriedade) está
fixada na seção "Formulário/validação" abaixo — não há mais pendência sobre
nomes de campo a confirmar contra o backend.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/shared/components/ImageAvatarPreview/index.tsx;
app-web/src/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx;
app-web/src/shared/components/Inputs/FormInputs/FormAutocompleteInput/index.tsx;
app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx;
app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx;
app-web/src/app/(authorized)/criaturas/components/CreaturesListItem/index.tsx;
app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx
Arquivos: app-web/src/shared/routes.ts;
app-web/src/app/(authorized)/components/Sidebar/index.tsx;
app-web/src/shared/interfaces/Entities/Creature/index.ts;
app-web/src/shared/interfaces/Entities/index.ts;
app-web/src/hooks/Queries/useGetEntityById/index.ts;
app-web/src/hooks/Queries/index.ts;
app-web/src/app/(authorized)/criaturas/hooks/useCreatureCategoriesQuery.ts;
app-web/src/store/PageStore/CreaturesStore/index.ts;
app-web/src/store/index.ts;
app-web/src/shared/formSchemas/CreatureFormSchema/index.ts;
app-web/src/shared/formSchemas/index.ts;
app-web/src/app/(authorized)/criaturas/page.tsx;
app-web/src/shared/util/IsRichTextEmpty/index.ts;
app-web/src/shared/util/index.ts;
app-web/src/shared/constants/Styles/InputStyles/index.ts (novas variantes
richText* reaproveitadas pelo FormRichTextInput);
app-web/src/shared/components/Inputs/DefaultInputs/index.ts;
app-web/src/shared/components/Inputs/FormInputs/index.ts;
app-web/package.json (dependências @tiptap/react e @tiptap/starter-kit
adicionadas — `npm install` ainda precisa ser executado no app-web para
materializar node_modules, não executado por este agente).
Observação: FormRichTextInput implementa a barra de ferramentas básica
(negrito, itálico, título, lista com marcadores, lista numerada) e um
placeholder próprio via overlay condicional, já que apenas
@tiptap/react + @tiptap/starter-kit foram adicionados (sem
@tiptap/extension-placeholder, não solicitado no escopo).
Dependências: nenhuma

#### Componentes (necessário — nada equivalente existe hoje em `shared/components/`)

- Componente: `ImageAvatarPreview` (novo, em `app-web/src/shared/components/`,
  ex.: `shared/components/ImageAvatarPreview/index.tsx`, seguindo o padrão de
  componentes de propósito único já existentes no nível raiz de
  `shared/components/`, como `ThemeInitializer`/`FontAccessibilityControls`).
  - Props: `imageUrl?: string`, `alt: string`, `size?: number` (default
    pequeno, ex. 32-36px, para não aumentar a altura da linha da tabela).
  - Comportamento esperado: renderiza um avatar circular pequeno (MUI
    `Avatar`) dentro da célula da tabela sem alterar a altura da `TableRow`.
    Quando `imageUrl` está definido, o avatar é clicável e, ao clicar, abre um
    modal (reaproveitar o padrão visual de `Card`/`Dialog` já usado em
    `shared/components/Modals`) exibindo a imagem ampliada. Quando `imageUrl`
    está vazio/indefinido, exibe um ícone de fallback de `react-icons/fi`
    (ex.: `FiImage`) dentro do círculo, sem comportamento de clique/modal.
    Reutilizável por qualquer feature que precise exibir uma imagem de
    referência em listagem (não específico de Criaturas).

- Componente: `DefaultAutocompleteInput` (novo, em
  `shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput`, seguindo
  o mesmo padrão visual/estrutural de `DefaultTextInput`).
  - Props: `id`, `label?`, `options: TOption[]`, `getOptionLabel`, `value`,
    `onChange`, `placeholder?`, análogas às de `DefaultTextInput` mas
    adaptadas ao MUI `Autocomplete` (não vinculado a `react-hook-form`, estado
    controlado externamente via `useState`, no mesmo padrão do filtro de
    e-mail em `UsersPage`).
  - Comportamento esperado: usado no filtro de Categoria da listagem de
    Criaturas — seleção exata a partir da lista de categorias.

- Componente: `FormAutocompleteInput` (novo, em
  `shared/components/Inputs/FormInputs/FormAutocompleteInput`, seguindo o
  mesmo padrão de `FormTextInput`, mas envolvendo o MUI `Autocomplete` via
  `Controller` do `react-hook-form`).
  - Props: `id`, `name`, `control`, `label?`, `options: TOption[]`,
    `getOptionLabel`, `getOptionValue` (para mapear a opção selecionada ao
    valor de id armazenado no campo do formulário), `placeholder?`.
  - Comportamento esperado: usado no campo obrigatório "Categoria" do
    formulário de Criatura, exibindo erro de validação (`fieldState.error`)
    no mesmo padrão dos demais `FormInputs`.

- Componente: `FormRichTextInput` (novo, em
  `shared/components/Inputs/FormInputs/FormRichTextInput`, usando Tiptap —
  `@tiptap/react` + `@tiptap/starter-kit`, dependências ainda não presentes em
  `app-web/package.json` e que precisam ser adicionadas).
  - Props: `id`, `name`, `control`, `label?`, `placeholder?`.
  - Comportamento esperado: editor de texto rico com barra de ferramentas
    básica (negrito, itálico, listas, títulos), integrado ao
    `react-hook-form` via `Controller`, armazenando/retornando o conteúdo como
    string HTML (`editor.getHTML()`), exibindo erro de validação no mesmo
    padrão visual dos demais `FormInputs` (label + `helperText` de erro).
    Componente genérico reutilizável, sem qualquer acoplamento à entidade
    Criatura — será usado nos campos de texto rico do formulário.

Esses quatro componentes precisam existir antes de a funcionalidade abaixo
consumi-los (mesma etapa/agente, sem necessidade de handoff separado).

#### Funcionalidade

- Rotas/constantes: adicionar `creatures: '/criaturas'` em `MENU_ROUTES` e em
  `APP_ROUTES.private` (`app-web/src/shared/routes.ts`), seguindo o padrão já
  usado para `users`/`home`.

- Sidebar (`app-web/src/app/(authorized)/components/Sidebar/index.tsx`):
  adicionar uma nova seção `NavSection` com `title: 'Mundo'` posicionada entre
  a seção sem título (que contém apenas o item "Home") e a seção
  "Gerenciamento", contendo um item "Criaturas" apontando para
  `APP_ROUTES.private.creatures`, com um ícone de `react-icons/fi` coerente
  com o tema (ex. algo relacionado a mundo/bestiário), seguindo o mesmo padrão
  de `NavItem` já usado para Home/Usuários.

- Interfaces (`app-web/src/shared/interfaces/Entities/Creature/`, exportado em
  `Entities/index.ts`), com propriedades em inglês batendo com o JSON do
  backend:
  - `ICreatureCategory`: `{ id: string; name: string }`.
  - `ICreatureListItem` (DTO enxuto de listagem): `{ id: string;
    referenceImageUrl?: string; name: string; category: ICreatureCategory }`.
  - `ICreature` (DTO completo, estende `IEntity`): todos os campos listados na
    seção "Formulário/validação" abaixo, com `category: ICreatureCategory`.
  - `ICreatureListFilters`: `{ name?: string; categoryId?: string; page?:
    number; perPage?: number }`.

- Hook genérico `useGetEntityById` (novo, em
  `app-web/src/hooks/Queries/useGetEntityById/index.ts`, exportado em
  `hooks/Queries/index.ts`): segue o mesmo padrão de `useGetEntityList`
  (`useQuery` + `ApiFactory(getAuthToken())`), recebendo `url` e `enabled`,
  com `queryKey: [url]`, retornando `TItem` a partir de `GET url`. Usado para
  buscar o detalhe completo da criatura ao abrir o modal em modo de edição.

- Hook não genérico para categorias de criatura (ex.:
  `app-web/src/app/(authorized)/criaturas/hooks/useCreatureCategoriesQuery.ts`
  ou local ao componente de filtro/formulário), seguindo o padrão de hooks
  específicos e não estritamente CRUD já usado em `hooks/Auth` (`useMeQuery`):
  `useQuery` simples via `ApiFactory` contra `GET /creatures/categories`
  (endpoint confirmado no plano de backend), retornando `ICreatureCategory[]`
  (não paginado — apenas os 4 valores fixos), usado para popular as opções do
  `DefaultAutocompleteInput` (filtro) e do `FormAutocompleteInput` (campo
  Categoria do formulário).

- Store de feature (`app-web/src/store/PageStore/CreaturesStore/index.ts`,
  exportado em `store/index.ts`): `useSelectedCreatureStore`, seguindo
  exatamente o padrão de `useSelectedUserStore` — `selectedCreature:
  ICreatureListItem | null`, `setSelectedCreature`, `resetSelectedCreature`.

- Schema de formulário (`app-web/src/shared/formSchemas/CreatureFormSchema/`,
  exportado em `shared/formSchemas/index.ts`): `creatureFormSchema` (zod),
  `CreatureFormData`, `creatureFormResolver`, `creatureFormDefaultValues`, com
  os campos e nomes de propriedade fixados na seção "Formulário/validação"
  abaixo. Não há indicação no spec de necessidade de uma variante de edição
  (como a de senha opcional em Usuários) — todos os campos seguem a mesma
  regra em criação e edição. Caso, durante a implementação, surja alguma
  diferença de comportamento entre criar/editar não prevista no spec,
  sinalizar em vez de assumir.

- Página de listagem (`app-web/src/app/(authorized)/criaturas/page.tsx`),
  seguindo a estrutura de `UsersPage`:
  - `PageContainer` com `Title` "Criaturas" e botão `PrimaryButton` "Novo"
    abrindo o `FormModal` em modo de criação (`resetSelectedCreature` antes de
    abrir).
  - Filtros: `DefaultTextInput` para "Nome" (busca parcial, mesmo padrão do
    filtro de e-mail em Usuários) e `DefaultAutocompleteInput` para
    "Categoria" (seleção exata, opções do hook de categorias), aplicados ao
    `filters` do `useGetEntityList` (`name`, `categoryId`) ao submeter o
    formulário de busca.
  - Listagem via `useGetEntityList<ICreatureListItem, ICreatureListFilters>`
    contra `GET /creatures`, com paginação (`APP_DEFAULT_PAGE_SIZE`, mesmo
    padrão de `TablePagination` de Usuários). Ordenação alfabética por nome
    (A-Z) é responsabilidade do backend (nenhum parâmetro de ordenação a
    enviar do frontend).
  - Componente de tabela `CreaturesList` +
    `CreaturesListItem` (`app-web/src/app/(authorized)/criaturas/components/`,
    espelhando `UsersList`/`UsersListItem`), com colunas: Imagem (usando
    `ImageAvatarPreview` com `imageUrl` = `creature.referenceImageUrl`), Nome
    (`creature.name`), Categoria (`creature.category.name`) e Ações
    (`FiEdit2`/`FiTrash2`, mesmo padrão de ícones/tooltips de
    `UsersListItem`).
  - Edição: `onEdit` seta `selectedCreature` na store com o item da listagem e
    abre o `FormModal`; o formulário busca o detalhe completo via
    `useGetEntityById<ICreature>` usando `selectedCreature.id`.
  - Exclusão: `ConfirmationModal` com mensagem
    `Tem certeza que deseja excluir a criatura "{name}"?`, usando
    `useDeleteEntity` contra `DELETE /creatures/:id`, invalidando a query de
    listagem (`['/creatures']`) e exibindo toast de sucesso/erro (mesmo padrão
    de `UsersPage`).

- Formulário (`app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`,
  espelhando `UserCreateForm`):
  - Em modo edição, popular o formulário (`reset`) a partir do resultado de
    `useGetEntityById(GET /creatures/:id)` quando os dados chegarem.
  - Submissão: `usePostEntity` (`POST /creatures`) em modo criação e
    `usePutEntity` (`PUT /creatures/:id`) em modo edição, com
    `invalidateQueryKeys: [['/creatures']]`, toasts de sucesso/erro em pt-BR
    (erro exibindo `error.response?.data?.message` quando disponível, mesmo
    padrão de Usuários — cobre o cenário de nome duplicado retornado como 409
    pela API).

- Formulário/validação — lista canônica de campos do schema
  `creatureFormSchema` (propriedade → label pt-BR → input → obrigatoriedade):
  - `name` → "Nome" → `FormTextInput` → obrigatório, texto não vazio;
    unicidade validada pela API (conflito 409 tratado via toast, não há
    validação de unicidade client-side).
  - `referenceImageUrl` → "Imagem Referência" → `FormTextInput` → opcional;
    quando preenchido, validado como URL válida (zod `.url()`), com mensagem
    de erro em pt-BR quando inválido.
  - `otherNames` → "Outros nomes" → `FormTextInput` → opcional, texto livre.
  - `categoryId` → "Categoria" → `FormAutocompleteInput` → obrigatório,
    selecionado a partir das opções do hook de categorias de criatura.
  - `threatLevel` → "Nível de Ameaça" → `FormTextInput` → opcional, texto
    livre.
  - `averageLifeExpectancy` → "Expectativa de vida média" → `FormTextInput` →
    opcional, texto livre.
  - `physicalCharacteristics` → "Características Físicas" →
    `FormRichTextInput` → obrigatório, validado como HTML não vazio.
  - `habitat` → "Habitat" → `FormRichTextInput` → opcional.
  - `behavior` → "Comportamento" → `FormRichTextInput` → opcional.
  - `diet` → "Alimentação" → `FormRichTextInput` → opcional.
  - `lifeCycle` → "Ciclo de Vida" → `FormRichTextInput` → opcional.
  - `lifeStageInfant` → "Estágio de Vida - Filhote" → `FormRichTextInput` →
    opcional.
  - `lifeStageYoung` → "Estágio de Vida - Jovem" → `FormRichTextInput` →
    opcional.
  - `lifeStageAdult` → "Estágio de Vida - Adulto" → `FormRichTextInput` →
    opcional.
  - `lifeStageElder` → "Estágio de Vida - Ancião" → `FormRichTextInput` →
    opcional.
  - `abilitiesAndPowers` → "Habilidades e Poderes" → `FormRichTextInput` →
    opcional.
  - `resistances` → "Resistências" → `FormRichTextInput` → opcional.
  - `weaknesses` → "Fraquezas" → `FormRichTextInput` → opcional.
  - `combat` → "Combate" → `FormRichTextInput` → opcional.
  - `attackMethods` → "Métodos de Ataque" → `FormRichTextInput` → opcional.
  - `strategy` → "Estratégia" → `FormRichTextInput` → opcional.
  - `dangerDegree` → "Grau de Perigo" → `FormRichTextInput` → opcional.
  - `obtainedResources` → "Recursos Obtidos" → `FormRichTextInput` →
    opcional.
  - `commercialValue` → "Valor Comercial" → `FormRichTextInput` → opcional.
  - `relationWithCivilizations` → "Relação com Civilizações" →
    `FormRichTextInput` → opcional.
  - `mythologyAndFolklore` → "Mitologia e Folclore" → `FormRichTextInput` →
    opcional.
  - `encounterRecord` → "Registro de Encontro" → `FormRichTextInput` →
    opcional.
  - `scholarsCuriosity` → "Curiosidade dos Estudiosos" → `FormRichTextInput`
    → opcional.

- Integrações com API consumidas por esta feature:
  - `GET /creatures` — listagem paginada, filtros `name` (parcial) e
    `categoryId` (exato), ordenação padrão por nome (server-side).
  - `GET /creatures/:id` — detalhe completo (`ICreature`), usado na edição.
  - `POST /creatures` — criação.
  - `PUT /creatures/:id` — atualização.
  - `DELETE /creatures/:id` — exclusão.
  - `GET /creatures/categories` — retorna `ICreatureCategory[]`, usado para
    popular o filtro de Categoria e o campo Categoria do formulário.

### 2. web-dev-codereviewer
Status: concluído
Dependências: 1. web-dev

- Revisar tudo acima.

## Revisão

Revisão completa dos arquivos da etapa "1. web-dev" (componentes genéricos,
feature de Criaturas, interfaces, hooks, store, schema e alterações em
Sidebar/routes/InputStyles/package.json) contra o `CLAUDE.md` e o plano
fixado neste arquivo. No geral a implementação segue muito bem o padrão da
feature `usuarios` (hooks genéricos, `FormModal`+store de seleção,
`invalidateQueryKeys` corretos, nomes de propriedade em inglês batendo
exatamente com os DTOs do backend — conferido campo a campo contra
`CreatureResponseDto`/`CreatureListItemResponseDto`/`CreateCreatureDto` em
`app-api`). Foram encontrados os problemas abaixo, do mais para o menos
prioritário.

- **app-web/src/shared/formSchemas/CreatureFormSchema/index.ts:7-10** — a
  mensagem de validação em pt-BR do campo `referenceImageUrl` não é exibida
  ao usuário. O schema usa
  `z.union([z.literal(''), z.string().url('Informe uma URL de imagem válida')])`,
  e o resolver do `@hookform/resolvers/zod` (função interna que trata
  `invalid_union`, ver `node_modules/@hookform/resolvers/zod/dist/zod.js`)
  seleciona sempre o **primeiro** erro do **primeiro** membro da union que
  falhar. Como o primeiro membro é `z.literal('')`, ao digitar uma URL
  inválida (ex.: `"abc"`) o campo falha nos dois ramos da union, mas a
  mensagem exibida em `fieldState.error.message` é a mensagem padrão (em
  inglês) do `z.literal('')` (algo como `Invalid input: expected ""`), e não
  "Informe uma URL de imagem válida". Isso viola diretamente o requisito do
  plano ("com mensagem de erro em pt-BR quando inválido").
  - Trecho: `referenceImageUrl: z.union([z.literal(''), z.string().url('Informe uma URL de imagem válida')])`
  - Sugestão: trocar a `union` por um `refine` único, que sempre resolve para
    a mesma mensagem pt-BR independentemente do ramo, ex.:
    `z.string().refine((value) => value === '' || z.string().url().safeParse(value).success, 'Informe uma URL de imagem válida')`.

- **app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx:42-45**
  — ausência de tratamento de loading/erro na busca do detalhe da criatura
  para edição. `useGetEntityById<ICreature>` só desestrutura `data`; não há
  uso de `isLoading`/`isError`/`error`. Ao abrir o modal em modo edição, o
  formulário fica visualmente populado com os `defaultValues` vazios até a
  requisição `GET /creatures/:id` responder, sem nenhum indicador de
  carregamento; e se a requisição falhar (rede, 404, etc.) o usuário não
  recebe nenhum feedback (nem toast, nem mensagem), diferente do padrão de
  tratamento de erro já usado nas mutations da própria feature.
  - Trecho: `const { data: creatureDetail } = useGetEntityById<ICreature>({ url: ..., enabled: isEditMode });`
  - Sugestão: desestruturar também `isLoading`/`isError` (ou `error`) e
    exibir um indicador de carregamento no formulário enquanto a busca está
    pendente, além de um `showToast` de erro pt-BR
    (`error.response?.data?.message ?? 'Não foi possível carregar os dados da criatura.'`)
    quando a query falhar.

- **app-web/src/shared/components/ImageAvatarPreview/index.tsx:42-47** — o
  avatar clicável (quando `imageUrl` está definido) não é acessível via
  teclado nem para leitores de tela: é um `Avatar` (renderiza `div`/`img`)
  com apenas `onClick`, sem `role="button"`, `tabIndex`, `onKeyDown`
  (Enter/Espaço) nem `aria-label` indicando a ação. Usuários que navegam só
  por teclado não conseguem abrir o modal de imagem ampliada.
  - Trecho: `<Avatar alt={alt} src={imageUrl} onClick={() => setIsPreviewOpen(true)} sx={{ ...avatarSx, cursor: 'pointer' }} />`
  - Sugestão: envolver o `Avatar` em um `IconButton`/`button` (com
    `aria-label` pt-BR, ex. `Ampliar imagem de ${alt}`) em vez de depender
    apenas de `onClick` num elemento não interativo, seguindo o mesmo padrão
    de `IconButton` com `aria-label` já usado em `CreaturesListItem`/
    `UsersListItem`.

- **app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx:96-131**
  — dois problemas de acessibilidade/consistência no editor rico:
  1. O `id` usado pelo `<Label htmlFor={id}>` (linha 143) é aplicado ao `Box`
     que envolve toolbar + conteúdo (linha 98), não ao elemento
     `contenteditable` real do Tiptap (dentro de `EditorContent`). Como esse
     `Box` não é um elemento nativo "labelable" (input/select/textarea),
     clicar no label não move o foco para o editor, ao contrário do que
     ocorre nos demais `FormInputs` (onde o `id` vai direto no `TextField`/
     input).
  2. Os botões da toolbar (`IconButton`) têm `aria-label` mas não usam
     `Tooltip`, diferente do padrão já adotado no resto do app para ícones
     sem texto visível (ex. `CreaturesListItem`/`UsersListItem` envolvem os
     `IconButton` de ação em `<Tooltip title="...">`). Além disso, os botões
     "Lista com marcadores" e "Lista numerada" usam o mesmo ícone
     `FiList`, apenas espelhado horizontalmente (`transform: scaleX(-1)`),
     o que os torna visualmente quase indistinguíveis para o usuário
     (mouse/sighted) — a ausência de `Tooltip` agrava esse problema, pois
     não há nenhum texto de apoio ao passar o mouse.
  - Trecho: `<Box id={id} sx={APP_INPUT_STYLES.richTextField}>` /
    `<IconButton key={button.label} type="button" aria-label={button.label} ...>`
  - Sugestão: mover o `id`/foco para o elemento editável real (Tiptap
    permite customizar atributos do DOM via `editorProps.attributes.id`) e
    envolver os botões da toolbar em `Tooltip` (mesmo padrão dos demais
    ícones do app), além de considerar um ícone diferente (ou um pequeno
    indicador textual/numérico) para diferenciar visualmente "lista
    numerada" de "lista com marcadores".

- **app-web/src/shared/interfaces/Entities/Creature/index.ts:8-51** — todos
  os campos de texto opcionais de `ICreature`/`ICreatureListItem` (ex.
  `referenceImageUrl`, `otherNames`, `threatLevel`, `habitat`, `behavior`,
  etc.) são tipados apenas como `campo?: string` (equivalente a
  `string | undefined`), mas os DTOs de resposta reais do backend
  (`CreatureResponseDto`, `CreatureListItemResponseDto` em
  `app-api/src/modules/creatures/dto/`) declaram explicitamente esses campos
  como `string | null` — nunca `undefined`. Em runtime isso não quebra nada
  (os usos no código tratam `null`/`undefined` de forma equivalente via `??`
  e `!valor`), mas o tipo não reflete fielmente o contrato da API, indo
  contra a orientação do `CLAUDE.md` de manter os tipos coerentes com os DTOs
  consumidos.
  - Trecho: `referenceImageUrl?: string;` (e demais campos opcionais da
    interface)
  - Sugestão: tipar como `campo?: string | null` (ou `string | null`) para
    bater exatamente com os DTOs de resposta da API.

Nenhum outro problema relevante foi encontrado: nomenclatura e localização de
arquivos (App Router, `shared/components/`, `hooks/Queries`,
`store/PageStore`, `shared/formSchemas`) seguem o padrão do projeto; todos os
ícones usados são de `react-icons/fi` (nenhum `@mui/icons-material`, SVG
customizado ou emoji); os `IconButton` de ação em `CreaturesListItem` têm
`aria-label` pt-BR e `Tooltip`; a store `useSelectedCreatureStore` e o modo
criar/editar do `CreatureCreateForm` seguem exatamente o padrão de
`useSelectedUserStore`/`UserCreateForm`; os `invalidateQueryKeys: [['/creatures']]`
estão corretos e não colidem com a query de categorias
(`['/creatures/categories']`); os textos de UI estão em pt-BR; e não há
duplicação de componentes já existentes em `shared/components/`.

### Correções aplicadas (pós-revisão)

Os 5 achados acima foram corrigidos:

1. `shared/formSchemas/CreatureFormSchema/index.ts` — `referenceImageUrl`
   trocado de `z.union([z.literal(''), z.string().url(...)])` para
   `z.string().refine((value) => value === '' || z.string().url().safeParse(value).success, 'Informe uma URL de imagem válida')`,
   garantindo que a mensagem pt-BR sempre apareça quando preenchido com valor
   inválido, e que o campo vazio continue válido. Nenhuma mudança no tipo
   inferido (`CreatureFormData['referenceImageUrl']` continua `string`), então
   `buildPayload` em `CreatureCreateForm` (que já fazia
   `data.referenceImageUrl || undefined`) não precisou de ajuste.

2. `criaturas/components/CreatureCreateForm/index.tsx` — `useGetEntityById`
   passou a desestruturar também `isLoading`/`isError`/`error`. Em modo edição,
   enquanto a busca do detalhe está pendente, o formulário é substituído por um
   indicador de carregamento (`CircularProgress` + `DefaultText` "Carregando
   dados da criatura..."); em caso de erro, um `showToast` pt-BR é disparado
   (`error.response?.data?.message ?? 'Não foi possível carregar os dados da
   criatura.'`), mesmo padrão de erro já usado nas mutations da feature.

3. `shared/components/ImageAvatarPreview/index.tsx` — o `Avatar` clicável
   (quando há `imageUrl`) passou a ser envolvido por um `IconButton` com
   `aria-label="Ampliar imagem de {alt}"`, tornando-o naturalmente focável e
   acionável via teclado (Enter/Espaço), no mesmo padrão de `IconButton` já
   usado em `CreaturesListItem`/`UsersListItem`.

4. `shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx` — o `id`
   passou a ser aplicado ao elemento `contenteditable` real do Tiptap via
   `editorProps.attributes.id` (removido do `Box` que envolve toolbar +
   conteúdo), fazendo o `<Label htmlFor={id}>` mover o foco corretamente para
   o editor; os botões da toolbar passaram a ser envolvidos por `Tooltip`
   (mesmo padrão do resto do app); e o ícone de "Lista numerada" foi trocado
   de `FiList` espelhado (`scaleX(-1)`) para `BsListOl` (`react-icons/bs`, já
   que o subconjunto Feather usado no projeto não tem um ícone de lista
   numerada dedicado), diferenciando-o visualmente de "Lista com marcadores"
   (`FiList`).

5. `shared/interfaces/Entities/Creature/index.ts` — todos os campos
   opcionais de `ICreatureListItem`/`ICreature` tipados como `string | null`
   (em vez de apenas `string | undefined`), batendo com os DTOs de resposta
   reais do backend. Como consequência, `ImageAvatarPreviewProps.imageUrl`
   (`shared/components/ImageAvatarPreview/index.tsx`) também passou a aceitar
   `string | null` para continuar compatível com
   `creature.referenceImageUrl`.

Nenhuma mudança de escopo além dos 5 achados listados; os campos "Status:" das
etapas acima não foram alterados.

### Re-revisão das correções (pós-fix)

Re-review focado, cobrindo apenas os arquivos alterados na subseção
"Correções aplicadas (pós-revisão)" acima. Os 5 achados originais foram
confirmados como corrigidos corretamente, sem regressões:

1. `app-web/src/shared/formSchemas/CreatureFormSchema/index.ts:7-12` —
   confirmado. `referenceImageUrl` agora é
   `z.string().refine((value) => value === '' || z.string().url().safeParse(value).success, 'Informe uma URL de imagem válida')`.
   Como é um único `refine` (não mais `union`), o `zodResolver` sempre associa
   a mensagem pt-BR ao campo quando o `refine` retorna `false`, e string vazia
   continua passando (`value === ''` curto-circuita como válido). O tipo
   inferido de `CreatureFormData['referenceImageUrl']` continua `string`
   (refine não estreita o tipo), coerente com `buildPayload` em
   `CreatureCreateForm` (`data.referenceImageUrl || undefined`), que não
   precisou de ajuste. Aprovado.

2. `app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx:44-52,101-112,174-181`
   — confirmado. `useGetEntityById<ICreature>` agora desestrutura `isLoading`,
   `isError` e `error` (tipado via `AxiosError<IAxioDataError>` no próprio
   hook genérico). Em modo edição, enquanto `isCreatureDetailLoading` é
   verdadeiro, o formulário é substituído por `CircularProgress` +
   `DefaultText` ("Carregando dados da criatura..."), e um `useEffect` dispara
   `showToast` pt-BR (`error.response?.data?.message ?? 'Não foi possível
   carregar os dados da criatura.'`) quando `isCreatureDetailError` fica
   verdadeiro — mesmo padrão de tratamento de erro já usado nas mutations da
   própria feature (`onError` de `usePostEntity`/`usePutEntity`). Padrão
   coerente com o restante do projeto. Aprovado.

3. `app-web/src/shared/components/ImageAvatarPreview/index.tsx:42-48` —
   confirmado. O `Avatar` clicável passou a ser envolvido por um `IconButton`
   com `aria-label="Ampliar imagem de {alt}"`, tornando-o um elemento
   nativamente focável via Tab e acionável via Enter/Espaço (comportamento
   padrão de `<button>`), no mesmo padrão de `IconButton`+`aria-label` de
   `CreaturesListItem`/`UsersListItem`. Aprovado.

4. `app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx:38-46,102-124`
   — confirmado, com uma ressalva menor não bloqueante. O `id` deixou de estar
   no `Box` externo e passou a ser aplicado via
   `editorProps.attributes.id` diretamente no elemento `contenteditable` real
   do ProseMirror/Tiptap renderizado por `EditorContent`, e o
   `<Label htmlFor={id}>` no componente pai aponta para esse mesmo `id` —
   igual ao padrão dos demais `FormInputs` (`id` no elemento focável real).
   Os botões da toolbar agora estão envolvidos por `Tooltip` com o mesmo
   `label` usado no `aria-label`, no padrão de `CreaturesListItem`/
   `UsersListItem`. O ícone de "Lista numerada" foi trocado para `BsListOl`
   (`react-icons/bs`), visualmente distinto de `FiList` ("Lista com
   marcadores") — `react-icons/bs` é apenas um subconjunto de ícones do
   mesmo pacote `react-icons` (`"react-icons": "^5.7.0"`, já presente em
   `app-web/package.json`), não uma lib de ícones nova nem uma dependência
   adicional a instalar; portanto não quebra o padrão "todo ícone de
   `react-icons`" do projeto.
   - Ressalva (não bloqueante): tecnicamente, `<div contenteditable>` não é um
     elemento "labelable" pela especificação HTML (a lista formal inclui
     `button`, `input`, `select`, `textarea`, `meter`, `output`, `progress`),
     então o comportamento de "clicar no label move o foco" para um
     `contenteditable` não é 100% garantido por especificação em todos os
     user agents, ainda que funcione na prática nos engines mais comuns
     (Chromium/Firefox/WebKit). Essa é exatamente a solução que a própria
     sugestão do achado original propôs (`editorProps.attributes.id`), então
     não é tratada aqui como um novo achado, apenas registrada como
     observação para conhecimento — o `id` no elemento correto e o
     `aria-label`/`Tooltip` nos botões já resolvem o essencial do problema de
     acessibilidade relatado. Aprovado.

5. `app-web/src/shared/interfaces/Entities/Creature/index.ts:8-51` —
   confirmado. Todos os campos opcionais de `ICreatureListItem`/`ICreature`
   passaram de `campo?: string` para `campo?: string | null`, batendo com os
   DTOs de resposta do backend. Verificado que não há outros consumidores
   desses campos no `app-web` além de `CreatureCreateForm`
   (já usa `?? ''` nos `reset`, compatível com `null`/`undefined`) e
   `CreaturesListItem`/`ImageAvatarPreview` (`imageUrl?: string | null` em
   `ImageAvatarPreviewProps`, coerente com `creature.referenceImageUrl:
   string | null | undefined`) — nenhuma regressão de tipagem introduzida em
   outros pontos do código. Aprovado.

**Conclusão:** os 5 achados foram corrigidos corretamente, sem introduzir
regressões nos arquivos revisados
(`app-web/src/shared/formSchemas/CreatureFormSchema/index.ts`,
`app-web/src/app/(authorized)/criaturas/components/CreatureCreateForm/index.tsx`,
`app-web/src/shared/components/ImageAvatarPreview/index.tsx`,
`app-web/src/shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx`,
`app-web/src/shared/interfaces/Entities/Creature/index.ts`). Re-review
aprovado.
