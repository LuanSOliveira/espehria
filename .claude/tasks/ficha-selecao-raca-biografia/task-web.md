# Task Web: Seleção de raça e biografia na ficha de personagem

## Contexto
Ver .claude/tasks/ficha-selecao-raca-biografia/spec.md — usar a seção "Escopo confirmado"
(e as 9 perguntas/respostas) como base factual, sem reabrir nenhum ponto ali já fechado.
Demanda 100% `app-web`, sem alteração em `app-api` (`/races` e `/biographies` já suportam
os filtros de nome/tags/categoria e paginação necessários).

Precedentes de código já investigados e usados como referência de padrão:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx`
  e `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` — padrão de
  modal de seleção em tabela: `FormModal size="wide"`, filtros inline dentro do próprio
  modal (não extraídos em `<Entidade>sFilterSection` — nos dois modais de referência os
  filtros já vivem dentro do próprio componente de modal, diferente do padrão de página
  cheia; a nova `SheetRaceSelectionModal` segue esse mesmo precedente local), `Table` +
  `TableHead`/`TableBody` com colunas terminando em "Ações", `TablePagination` com
  `APP_DEFAULT_PAGE_SIZE`, `TagBadge` para tags, `useGetEntityList` com `enabled: open` e
  reset de filtros/página em `useEffect` quando `open` muda.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`,
  `SheetRaceCard`, `SheetDashedFieldButton` — padrão de campo com card preenchido + botão
  dashed quando vazio + `ConfirmationModal` local antes de remover (`SheetRaceCard` já usa
  esse padrão para "Remover"; a troca de raça passa a reaproveitar o mesmo componente
  `ConfirmationModal`, mas disparado por `SheetRaceField`, não por `SheetRaceCard`).
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`,
  `SheetBiographyField`, `SheetBiographyCard` — passo 2 (melhorias/atributo livre) já
  funciona e não é alterado; o botão hoje rotulado "Editar" (`FiEdit2`, dentro do passo 2)
  já volta para o modo de seleção (`setIsSelectingBiography(true)`) — comportamento
  equivalente ao "trocar" pedido no spec, só muda o que é exibido no passo 1 (grid em vez
  de autocomplete) e o rótulo/tooltip do botão.
- `app-web/src/app/(authorized)/racas/components/RacesFilterSection/index.tsx` — padrão de
  filtro nome + categoria (`DefaultAutocompleteInput<IRaceCategory>` via
  `useRaceCategoriesQuery`, `GET /races/categories`) + tags
  (`DefaultMultiAutocompleteInput<ITag>` via `useTagOptionsQuery`), reaproveitado dentro da
  `SheetRaceSelectionModal`.
- `app-web/src/app/(authorized)/biografias/components/BiographiesFilterSection/index.tsx`
  — padrão de filtro nome + tags para biografia, reaproveitado dentro do passo 1 do
  `SheetBiographyAssignModal`.
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (~linhas 251-257 e 822-829) — consulta
  `/races` com `perPage: 100` e prop `options={raceOptions}` passada a `SheetRaceField`;
  ambas removidas nesta demanda, já que a listagem paginada passa a viver dentro da
  `SheetRaceSelectionModal`.
- `.claude/tasks/ficha-melhorias-estatisticas/task-web.md` (linhas ~234-249) e
  `.claude/tasks/ficha-habilidades/task-web.md` (seção "Acesso Google") — precedente já
  estabelecido e documentado de que a página de ficha (`fichas/[id]/**`) nunca aplica o
  padrão de "ocultar criar/editar/excluir para usuários Google" (`useIsGoogleUser`),
  porque o controle de acesso da ficha é por posse (`isRestrictedToOwnSheets`, backend),
  não por tipo de ação — um usuário Google já vincula/edita/remove Raça e Biografia
  normalmente em fichas às quais tem acesso. Esta demanda segue o mesmo comportamento já
  estabelecido nesta página (ver "Acesso Google" abaixo).

## Etapas

### 1. web-dev

#### Componentes

- **Componente novo: `SheetRaceSelectionModal`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceSelectionModal/index.tsx`).
  - Props: `open: boolean`, `onClose: () => void`, `onSelect: (race: IRaceListItem) => void`,
    `isSelecting?: boolean`.
  - Comportamento esperado: `FormModal size="wide"`, título "Selecionar raça". Filtros
    inline no topo do modal (mesmo padrão de `SheetAbilitySelectionModal`): nome
    (`DefaultTextInput` + ícone `FiSearch`), categoria (`DefaultAutocompleteInput<IRaceCategory>`
    alimentado por `useRaceCategoriesQuery`) e tags (`DefaultMultiAutocompleteInput<ITag>`
    alimentado por `useTagOptionsQuery`) — reset de todos os filtros e da página ao abrir
    o modal (`useEffect` em `open`) e reset de página ao mudar qualquer filtro, igual ao
    padrão de `SheetAbilitySelectionModal`. Listagem via `useGetEntityList<IRaceListItem,
    IRaceListFilters>({ url: '/races', filters: { name, categoryId, tagIds, page, perPage:
    APP_DEFAULT_PAGE_SIZE }, enabled: open })`. Tabela com colunas Imagem
    (`ImageAvatarPreview`), Nome, Categoria, Tags (`TagBadge`) e Ações; paginação via
    `TablePagination` (`APP_DEFAULT_PAGE_SIZE`), mesmo padrão visual das duas tabelas de
    referência. Cada linha tem duas ações: "Visualizar" (`FiEye`) abre um `ViewModal`
    aninhado local (estado próprio do modal, ex. `viewingRaceId`) com `RaceView
    raceId={item.id}` — mesmo padrão já usado por `SheetRaceField` para a raça atualmente
    vinculada; e "Selecionar" (ícone de confirmação, ex. `FiCheck`) que chama
    `onSelect(item)`, desabilitado enquanto `isSelecting`. O modal **não** decide sozinho
    se a seleção precisa de confirmação — essa decisão (vincular direto vs. exigir
    confirmação de troca) é responsabilidade exclusiva de quem abre o modal
    (`SheetRaceField`), mantendo a `SheetRaceSelectionModal` como um componente puro de
    "escolher uma raça", reutilizável igualmente nos fluxos de adicionar e editar.

- **Componente novo: `SheetBiographySelectionCard`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographySelectionCard/index.tsx`).
  - Props: `biography: IBiographyListItem`, `onView: () => void`, `onSelect: () => void`.
  - Comportamento esperado: card no mesmo espírito visual de `SheetRaceCard`/
    `SheetBiographyCard` (`ImageAvatarPreview` + nome + `TagBadge` das tags), mas em layout
    de card de grid (não de linha de campo) com dois botões de ação independentes no
    rodapé — "Visualizar" (chama `onView`) e "Selecionar" (chama `onSelect`). O corpo do
    card (imagem/nome/tags) não tem nenhuma ação de clique própria — só os dois botões
    disparam ação, conforme o spec.

- **Alteração: `SheetRaceField`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`).
  - Remove o `Autocomplete` MUI inline, o estado `isEditing` que controlava sua exibição, e
    a prop `options: IRaceListItem[]` (não é mais necessária — a listagem paginada agora
    vive dentro de `SheetRaceSelectionModal`).
  - Novo estado: `isSelectionModalOpen` (abre `SheetRaceSelectionModal`, disparado tanto
    pelo `SheetDashedFieldButton` "Adicionar raça" quando `!value`, quanto pela ação
    "Editar" do `SheetRaceCard` quando `value` já existe — mesmos dois pontos de entrada
    que hoje abrem o Autocomplete via `setIsEditing(true)`) e `pendingRace: IRaceListItem |
    null` + `isChangeConfirmOpen` para o fluxo de troca.
  - `handleSelectRace(race)`: se `!value` (ficha ainda sem raça vinculada), chama
    `onAssign(race.id)` e fecha `SheetRaceSelectionModal` imediatamente, sem confirmação —
    conforme spec. Se `value` já existe (fluxo de editar/trocar), fecha
    `SheetRaceSelectionModal`, guarda `race` em `pendingRace` e abre um `ConfirmationModal`
    com aviso de que a troca de raça impacta características, talentos e pontos de vida da
    ficha; só chama `onAssign(pendingRace.id)` quando o usuário confirma. Cancelar a
    confirmação mantém a raça atual inalterada.
  - Mantém inalteradas as demais props (`value`, `onAssign`, `onRemove`, `isSaving`,
    `isRemoving`) e o `ViewModal`/`RaceView` já usado para visualizar a raça vinculada.

- **Alteração: `SheetBiographyAssignModal`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`).
  - Remove o passo 1 atual baseado em `DefaultAutocompleteInput` (estado `search`, consulta
    `useGetEntityList<IBiographyListItem, IBiographyListFilters>` com `perPage: 20` fixo).
  - Novo passo 1: filtros inline (nome via `DefaultTextInput` + `FiSearch`, tags via
    `DefaultMultiAutocompleteInput<ITag>` + `useTagOptionsQuery`) + grid responsivo de
    `SheetBiographySelectionCard` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` ou
    equivalente) + `TablePagination` (`APP_DEFAULT_PAGE_SIZE`), consultado via
    `useGetEntityList<IBiographyListItem, IBiographyListFilters>({ url: '/biographies',
    filters: { name, tagIds, page, perPage: APP_DEFAULT_PAGE_SIZE }, enabled: open &&
    isSelectingBiography })` — mesmo `reset` de filtros/página ao abrir o modal já existente
    para `search`.
  - Card "Visualizar": como agora existem múltiplos itens na grid (diferente do único botão
    de visualizar existente hoje, ligado à biografia já escolhida), trocar o estado
    booleano `isBiographyViewOpen` por um estado de item, ex. `biographyPendingView:
    IBiographyListItem | null`, setado pelo card clicado e usado para renderizar o
    `ViewModal`/`BiographyView biographyId={biographyPendingView.id}` aninhado — sem
    interferir na seleção em andamento.
  - Card "Selecionar": chama a mesma `handleSelectBiography(item)` já existente, que seta
    `biography`, zera `selectedImprovementKey` e avança para `isSelectingBiography(false)`
    (passo 2) — comportamento do passo 2 permanece 100% inalterado (melhorias/defeitos via
    `ImprovementDefectCard`, melhoria de atributo livre, validação de propriedade repetida
    com `showToast`, botões "Cancelar"/"Adicionar Biografia").
  - Fluxo de edição (`initialValue` presente): continua abrindo direto no passo 2, como
    hoje (`isSelectingBiography(false)` inicial quando `initialValue`). O botão hoje
    rotulado/tooltip "Editar" dentro do passo 2 (`FiEdit2`, que já chama
    `setIsSelectingBiography(true)`) é renomeado para refletir "trocar" (label/tooltip
    "Trocar biografia") — a lógica de voltar ao passo 1 (agora grid, antes autocomplete) já
    é a existente, sem mudança de estado adicional.
  - Título do modal ("Vincular biografia" / "Editar biografia") permanece como está.

#### Funcionalidade

- **Páginas/rotas**: nenhuma rota nova (`APP_ROUTES` inalterado). Toda a mudança ocorre
  dentro de `app-web/src/app/(authorized)/fichas/[id]/page.tsx` e dos componentes da mesma
  feature (`fichas/[id]/components/**`) listados acima.

- **Alterações em `page.tsx`**: remover a consulta `useGetEntityList<IRaceListItem,
  IRaceListFilters>({ url: '/races', filters: { perPage: 100 } })` e a variável derivada
  `raceOptions` (~linhas 251-257), e remover a prop `options={raceOptions}` passada a
  `<SheetRaceField>` (~linha 824) — a listagem de raças passa a ser buscada, paginada, só
  dentro de `SheetRaceSelectionModal`. Remover também o import de `IRaceListFilters`/
  `IRaceListItem` de `page.tsx` caso não sejam usados em mais nenhum outro ponto do arquivo
  (confirmado: hoje só são usados nessa consulta removida — `ISheetRace`, usado em outros
  pontos do arquivo, é um tipo separado e continua sendo importado normalmente).

- **Integrações com API**:
  - `GET /races` — agora consumido com paginação real e filtros `name`/`categoryId`/
    `tagIds` dentro de `SheetRaceSelectionModal`, substituindo o carregamento único com
    `perPage: 100` que hoje ocorre em `page.tsx`.
  - `GET /races/categories` — via `useRaceCategoriesQuery`, para o filtro de categoria da
    `SheetRaceSelectionModal`.
  - `GET /biographies` — agora consumido com paginação real e filtros `name`/`tagIds`
    dentro do passo 1 do `SheetBiographyAssignModal`, substituindo o `perPage: 20` fixo
    atual.
  - Tags: `useTagOptionsQuery`, já usado em outros pontos do projeto, reaproveitado nos
    dois filtros de tags novos.
  - Endpoints de vínculo/desvínculo já existentes e **inalterados** por esta demanda:
    `PUT /sheets/:id/race` (`linkRaceMutation`), `DELETE /sheets/:id/race`
    (`unlinkRaceMutation`), vínculo de biografia via `linkBiographyMutation` (payload
    `{ biographyId, selectedImprovementId, freeImprovementPropertyId }`),
    `unlinkBiographyMutation`. Nenhuma mudança de contrato — só muda como o `raceId`/
    `biographyId` chega até essas mutações (via modal de seleção/grid em vez de
    autocomplete).

- **Formulário/validação**: não há formulário `react-hook-form`/zod novo nesta demanda. As
  únicas entradas são os filtros dos dois modais de seleção (nome livre, categoria/tags
  opcionais), sem validação obrigatória — mesmo padrão não-obrigatório dos filtros de
  listagem já existentes em `RacesFilterSection`/`BiographiesFilterSection`. A única regra
  de validação funcional que já existia e permanece inalterada é a do passo 2 de biografia:
  bloqueio de propriedade repetida entre a melhoria de biografia selecionada e a melhoria
  de atributo livre, com `showToast` de erro (já implementado em
  `SheetBiographyAssignModal.handleConfirm`, não alterado por esta demanda).

- **Acesso Google**: **outro comportamento, não o padrão default** — nenhuma ação de
  adicionar/editar/trocar/remover Raça ou Biografia é ocultada para usuários
  `provider: 'google'` nesta página. Justificativa: `fichas/[id]/**` nunca aplicou o padrão
  `useIsGoogleUser` (skill `web-permissao-google-readonly`), porque o controle de acesso à
  ficha é por posse (`isRestrictedToOwnSheets`, já resolvido no backend), não por tipo de
  usuário — precedente já documentado em `.claude/tasks/ficha-melhorias-estatisticas/
  task-web.md` e reafirmado em `.claude/tasks/ficha-habilidades/task-web.md`. Esta demanda
  não pede nenhuma mudança nesse comportamento; os botões "Adicionar raça"/"Editar"/
  "Remover" (raça) e "Adicionar biografia"/"Editar"/"Remover"/"Trocar" (biografia)
  continuam visíveis e funcionais para qualquer usuário com acesso à ficha, sem checagem
  adicional de `isGoogleUser`. A ação "Visualizar" (nos dois modais de seleção e nos
  campos já vinculados) já é universalmente permitida, consistente com o restante do
  projeto.

Status: concluído
Componentes:
- app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceSelectionModal/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographySelectionCard/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx (alterado)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx (alterado)
Arquivos:
- app-web/src/app/(authorized)/fichas/[id]/page.tsx (removida consulta `/races` com `perPage: 100`, `raceOptions` e a prop `options` de `SheetRaceField`; imports `IRaceListFilters`/`IRaceListItem` removidos)

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Etapa "1. web-dev" está marcada como "Status: concluído"; revisão realizada sobre os
arquivos registrados nela.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceSelectionModal/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographySelectionCard/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx`

Pontos conferidos e sem achados:
- Tipagem: `IRaceListItem`/`IRaceListFilters`/`IBiographyListItem`/`IBiographyListFilters`
  usados corretamente com `useGetEntityList`; `ISheetRace extends IRaceListItem`, então a
  prop `value` de `SheetRaceField` (tipada `IRaceListItem | null`) continua compatível com o
  estado `race: ISheetRace | null` de `page.tsx`. Sem uso de `any`.
- Imports/símbolos: nenhum import quebrado ou não utilizado; `RaceView`/`BiographyView`
  consumidos com as props corretas (`raceId`/`biographyId`); componentes de
  `shared/components` (`FormModal`, `ViewModal`, `ConfirmationModal`, `DefaultTextInput`,
  `DefaultAutocompleteInput`, `DefaultMultiAutocompleteInput`, `TagBadge`,
  `ImageAvatarPreview`, `PrimaryButton`/`SecondaryButton`) usados com as props que os
  componentes de fato aceitam.
- React Query: `useGetEntityList`, `useRaceCategoriesQuery`, `useTagOptionsQuery`,
  `useGetEntityById` (hooks genéricos de `hooks/Queries`) — nenhum `useQuery`/`useMutation`
  bespoke introduzido; nenhuma mutation nova nesta etapa (endpoints de vínculo permanecem
  inalterados, conforme escopo do spec), então não há `invalidateQueryKeys` a verificar.
- Ícones: todos os ícones novos (`FiCheck`, `FiEye`, `FiSearch`, `FiEdit2`) vêm de
  `react-icons/fi`; `IconButton`s sem texto visível (Visualizar/Selecionar na tabela de
  raças, Visualizar/Trocar no resumo da biografia selecionada) têm `aria-label` em pt-BR
  com o nome do item.
- Formulário/filtros: nenhum `react-hook-form`/zod novo, consistente com o spec (filtros
  livres, sem validação obrigatória). Filtros dos dois modais de seleção permanecem
  inline dentro do próprio modal, replicando o precedente já investigado e documentado em
  `SheetAbilitySelectionModal`/`EntityReferenceSelectionModal` — não se aplica o padrão de
  `<Entidade>sFilterSection` de página cheia, conforme decisão já registrada no contexto da
  task.
- Fluxo de raça: `SheetRaceField.handleSelectRace` vincula direto e fecha o modal quando
  `!value`, e abre `ConfirmationModal` (mensagem sobre impacto em características, talentos
  e pontos de vida) apenas no fluxo de troca (`value` já existente) — igual ao especificado
  em `spec.md`.
- Fluxo de biografia: passo 1 (`SheetBiographyAssignModal`) agora é grid de
  `SheetBiographySelectionCard` com filtros nome/tags + `TablePagination`
  (`APP_DEFAULT_PAGE_SIZE`); cada card só dispara ação pelos botões "Visualizar"/
  "Selecionar" (sem clique no corpo); edição abre direto no passo 2 e o botão antes
  "Editar" agora está rotulado/com tooltip "Trocar biografia", voltando ao passo 1; passo 2
  (melhorias/atributo livre, validação de propriedade repetida com `showToast`) permanece
  inalterado, como exigido pelo spec.
- `page.tsx`: consulta `/races` com `perPage: 100`, `raceOptions` e a prop `options` de
  `SheetRaceField` removidas; imports `IRaceListItem`/`IRaceListFilters` removidos e sem uso
  remanescente no arquivo (`ISheetRace`, usado em outros pontos, permanece importado).
- Acesso Google: nenhuma checagem `useIsGoogleUser` introduzida em `fichas/[id]/**`, em
  linha com a exceção documentada no contexto da task para esta página (controle por posse
  da ficha, não por tipo de usuário).
- pt-BR: todos os textos novos (labels, tooltips, mensagens de confirmação, "Nenhuma
  raça/biografia encontrada") estão em português.
