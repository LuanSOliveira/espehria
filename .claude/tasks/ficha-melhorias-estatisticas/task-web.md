# Task Web: Ficha — Level, Raça (nova dinâmica), Biografia, Estatísticas/Melhorias/Defeitos, Raça com melhorias/defeitos próprios

## Contexto
Ver `.claude/tasks/ficha-melhorias-estatisticas/spec.md` (Escopo confirmado, seção "Escopo
app-web") e os wireframes `app-web/public/template-melhorias.png` e
`app-web/public/template-estatisticas.png`. O backend (`sheets`, `improvement-flaws`,
`races`) está sendo planejado em paralelo (task-api própria, ainda não escrita) — os
contratos exatos de request/response dos endpoints novos (`PUT/DELETE /sheets/:id/race`,
`PUT/DELETE /sheets/:id/biography`, campos `biography`/`melhorias`/`defeitos` em
`GET /sheets/:id`) devem ser confirmados/ajustados no momento da integração.

## Etapas

### 1. web-dev
Status: concluído

#### Componentes (novos, específicos da página de ficha — `app-web/src/app/(authorized)/fichas/[id]/components/`)

- Componente: `SheetDashedFieldButton`
  - Props: `label: string` (texto acessível, ex. "Adicionar raça"/"Adicionar biografia"), `onClick: () => void`.
  - Comportamento esperado: retângulo com borda tracejada e ícone `FiPlus` (react-icons/fi)
    centralizado, reaproveitando cores do design system da página (`APP_COLORS.goldDark`/`gold`
    — ver skill `web-cores`, sem hex solto). Usado como estado vazio tanto de Raça quanto de
    Biografia (wireframe `template-melhorias.png`), substituindo a exibição direta do
    Autocomplete quando `value === null` (comportamento atual do `SheetRaceField`).

- Componente: `SheetBiographyCard`
  - Props: `biography` (resumo da biografia vinculada — nome, tags, imagem, análogo a
    `IRaceListItem`/`SheetRaceCard`), `onView: () => void`, `onEdit: () => void`, `onRemove: () => void`.
  - Comportamento esperado: mesmo padrão visual do `SheetRaceCard` (`APP_CONTAINER_STYLES.detailInfoField`,
    `ImageAvatarPreview`, `Chip` de tags), com três ações via `IconButton` + `Tooltip`
    (`FiEye` visualizar, `FiEdit2` editar, `FiTrash2` remover — ver skill `web-icones`).
    "Remover" deve pedir confirmação reaproveitando `ConfirmationModal` (mesmo padrão já
    usado em `fichas/page.tsx` para excluir ficha), pois desvincula a biografia e limpa
    `melhorias.biography`/`defeitos.biography`.

- Componente: `SheetBiographyAssignModal`
  - Props: `open: boolean`, `onClose: () => void`, `initialValue` (opcional, para o modo
    "editar" pré-preenchido: biografia atualmente vinculada + melhoria de atributo
    previamente selecionada + dados da melhoria livre previamente criada), `onConfirm:
    (payload) => void` (payload cobre biografia selecionada + melhoria de atributo
    escolhida + melhoria livre, para acionar `PUT /sheets/:id/biography`).
  - Comportamento esperado (`FormModal`, `size="wide"` por ter várias seções — ver skill
    `web-form-cadastro`):
    1. `DefaultAutocompleteInput` (design system GERAL/`variant="outlined"` — **não** o
       estilo custom gold/`variant="standard"` usado nos campos Raça/Biografia da página)
       para buscar biografia via `useGetEntityList<IBiographyListItem, IBiographyListFilters>({ url: '/biographies' })`.
       Ao selecionar, buscar o detalhe completo via `useGetEntityById<IBiography>({ url: '/biographies/:id' })`
       (a listagem não traz `improvements`) e substituir o autocomplete por um card de
       biografia (mesmo padrão do `SheetBiographyCard`/`SheetRaceCard`, com ações
       visualizar — `ViewModal` + `BiographyView` já existentes — e editar, que volta a
       exibir o autocomplete).
    2. Texto "Escolha uma das melhorias de atributos da biografia" + lista das
       `improvements` da biografia selecionada filtradas por `type.name === 'Atributo'`
       (mesmo tipo padronizado pela task `melhorias-tipo-atributo`), cada uma em um card
       (reaproveitando o layout de `ImprovementDefectCard`, mas sem a ação de remover) com
       um `Checkbox` (MUI) ao lado. Seleção única — marcar um desmarca os demais — e
       obrigatória (não é `FormCheckboxInput` de react-hook-form, é estado local de "id
       selecionado", já que não é um form field padrão 1:1).
    3. Texto "Escolha uma melhoria de atributo livre" + mini-formulário inline (campos
       lado a lado, não empilhados) com os MESMOS três campos do
       `ImprovementDefectAddModal` (`app-web/src/shared/components/ImprovementDefectAddModal/index.tsx`):
       Tipo, Valor e Propriedade — reaproveitando `useImprovementDefectTypesQuery`/
       `useImprovementDefectPropertiesQuery`. Tipo fica travado em "Atributo" (exibido
       como texto/campo desabilitado, sem opção de troca) e Valor travado em `2`
       (também não editável); somente Propriedade é um `FormAutocompleteInput`/
       `DefaultAutocompleteInput` editável, com as opções filtradas às propriedades cujo
       `typeIds` inclui o id do tipo "Atributo" (mesmo filtro já usado dentro do
       `ImprovementDefectAddModal`).
    4. Botão "Adicionar Biografia" (`PrimaryButton`) habilitado somente quando: biografia
       selecionada **e** uma melhoria de atributo marcada **e** propriedade da melhoria
       livre escolhida. Ao confirmar, chama `onConfirm` com os três dados e fecha o modal.
    5. Em modo edição (`initialValue` preenchido), pré-carrega biografia (como card, não
       autocomplete), a melhoria marcada e a propriedade da melhoria livre; deve existir
       ação "Cancelar" que fecha o modal sem chamar `onConfirm` nem alterar o vínculo
       atual da ficha (mesma semântica de cancelar do card de Raça).

- Componente: `SheetBiographyField`
  - Props: `value` (biografia vinculada resolvida a partir de `GET /sheets/:id`, ou
    `null`), `onAssign` (dispara `PUT /sheets/:id/biography`), `onRemove` (dispara
    `DELETE /sheets/:id/biography`).
  - Comportamento esperado: vazio → `SheetDashedFieldButton` que abre
    `SheetBiographyAssignModal` em modo criar; preenchido → `SheetBiographyCard`, cujo
    "editar" abre o mesmo modal pré-preenchido (modo editar) e "remover" aciona
    `onRemove` (com confirmação, ver `SheetBiographyCard`). Ao contrário de
    `SheetRaceField`, NUNCA renderiza um autocomplete inline na página — a seleção
    sempre passa pelo modal.

- Componente: `SheetAttributeCard`
  - Props: `label: string` (nome do atributo), `value: number` (valor final calculado),
    `modifier: number`.
  - Comportamento esperado: card com faixa de título cinza (reaproveitar
    `APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`) exibindo `label`,
    o `value` abaixo, e um círculo sobreposto à direita (Box com `border-radius: 50%`)
    exibindo `modifier` — conforme `template-estatisticas.png`.

- Componente: `SheetAttributesPanel` (conteúdo da aba "Estatísticas")
  - Props: `attributes: { id: string; label: string; value: number; modifier: number }[]`,
    `onOpenDetails: () => void`.
  - Comportamento esperado: quadro com header "ATRIBUTOS" (mesmo padrão
    `detailSectionBox`/`detailSectionBoxHeader`) e um `IconButton` circular com
    `Tooltip` no canto superior direito do header (mesma linha do título) que chama
    `onOpenDetails`; abaixo, grid `grid-cols-2` com os 6 `SheetAttributeCard` (Força,
    Destreza, Constituição, Inteligência, Sabedoria, Carisma).

- Componente: `SheetAttributesDetailModal`
  - Props: `open: boolean`, `onClose: () => void`, `groups` (melhorias e defeitos de tipo
    Atributo, já agrupados por categoria de origem: race/biography/trainings/talents/characteristics).
  - Comportamento esperado: `ViewModal` (ou `FormModal`, sem formulário) somente leitura —
    sem nenhuma ação de remoção — listando, por categoria (label pt-BR: Raça, Biografia,
    Treinamentos, Talentos, Características), os itens de melhoria/defeito tipo Atributo
    via `ImprovementDefectCard` (sem `onRemove`), reaproveitando o padrão visual de seções
    (`detailSectionBox`) usado em `RaceView`/`BiographyView`.

- Componente: `SheetImprovementDefectCategoryAccordions` (conteúdo das abas "Melhorias" e
  "Defeitos" — mesmo componente para as duas, variando os dados recebidos)
  - Props: `items` (estrutura por categoria: `race`/`biography`/`trainings`/`talents`/`characteristics`,
    cada categoria uma lista de itens no formato `IImprovementDefectItem` + nome de quem
    concedeu, quando aplicável), `emptyMessage?: string`.
  - Comportamento esperado: 5 accordions full-width empilhados (MUI `Accordion`/
    `AccordionSummary`/`AccordionDetails`, com `FiChevronDown` como ícone de expandir,
    reaproveitando a mesma lógica visual do `SidebarSectionAccordion` mas usando os
    componentes MUI diretamente já que aqui é conteúdo de página, não navegação), com
    títulos RAÇA/BIOGRAFIA/TREINAMENTOS/TALENTOS/CARACTERÍSTICAS. Ao expandir, um card
    por item (`ImprovementDefectCard`, sem remoção) com uma linha adicional "Concedida
    por: `<nome da raça ou biografia vinculada>`" para as categorias `race`/`biography`
    (nome vindo de `sheet.race?.name`/`sheet.biography?.name`, já carregados na página);
    `trainings`/`talents`/`characteristics` ficam vazios por ora (estrutura pronta, sem
    dado a exibir — exibir `emptyMessage`, ex. "Nenhum item adicionado.").

#### Funcionalidade

- Páginas/rotas alteradas (nenhuma rota nova, mesmas URLs existentes):
  - `app-web/src/app/(authorized)/fichas/[id]/page.tsx`:
    - Renomear label do campo Level de "Nível" para "Level" (`SheetLevelField`) e
      restilizar como card (faixa de título cinza + valor abaixo), reaproveitando
      `APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader` — mantém o
      autosave via `useFieldAutosave` já existente para `level` (só muda visual/label,
      não a integração).
    - Reorganizar o layout para exibir `SheetRaceField` e `SheetBiographyField` lado a
      lado (`grid grid-cols-1 gap-4 sm:grid-cols-2`), abaixo de `SheetCampaignField`,
      conforme `template-melhorias.png`.
    - Adicionar estado local `biography` (hidratado de `sheet.biography` junto com os
      demais campos em `hasHydrated`) e estado local de aba selecionada
      (`'estatisticas' | 'melhorias' | 'defeitos'`, default `'estatisticas'`), sem
      persistência em query param/URL (`useState` simples, sem `useSearchParams`).
    - **Remover `raceId` do fluxo de autosave genérico**: hoje `page.tsx` usa
      `updateRaceMutation = usePutEntity<ISheet, { raceId: string | null }>({ url:
      '/sheets/:id', ... })` + `useFieldAutosave` debounce. Isso deixa de existir —
      Raça e Biografia passam a usar `usePutEntity`/`useDeleteEntity` dedicados,
      chamados de forma explícita nas ações do usuário (selecionar/editar/remover), não
      por debounce:
      - `usePutEntity<ISheet, { raceId: string }>({ url: '/sheets/:id/race', invalidateQueryKeys: [['/sheets']] })`
      - `useDeleteEntity<ISheet>({ url: '/sheets/:id/race', invalidateQueryKeys: [['/sheets']] })`
      - `usePutEntity<ISheet, SheetBiographyAssignPayload>({ url: '/sheets/:id/biography', invalidateQueryKeys: [['/sheets']] })`
      - `useDeleteEntity<ISheet>({ url: '/sheets/:id/biography', invalidateQueryKeys: [['/sheets']] })`
      - Cada mutação trata `onSuccess` (toast de sucesso + atualização do estado local
        `race`/`biography` a partir da resposta) e `onError` (toast com mensagem da API,
        fallback em pt-BR) — ver skill `web-integracao-api`.
    - Renderizar as 3 abas (MUI `Tabs`/`Tab`, mesmo padrão de estilo já usado em
      `EntityReferenceSelectionModal`: `borderBottom`/`Mui-selected`/`MuiTabs-indicator`
      via `APP_COLORS`), na ordem Estatísticas/Melhorias/Defeitos, renderizando
      `SheetAttributesPanel` (+ `SheetAttributesDetailModal`) ou
      `SheetImprovementDefectCategoryAccordions` conforme a aba ativa.
    - Cálculo dos valores/modificadores dos 6 atributos: a partir de `sheet.melhorias`/
      `sheet.defeitos` (todas as categorias), somar melhorias e subtrair defeitos de tipo
      "Atributo" cuja Propriedade corresponda a cada um dos 6 atributos (obtidos via
      `useImprovementDefectPropertiesQuery` filtrando pelo id do tipo "Atributo" retornado
      por `useImprovementDefectTypesQuery`), valor base fixo `10`, modificador
      `Math.floor((valor - 10) / 2)`. **Atenção**: confirmar no momento da integração se o
      `GET /sheets/:id` já devolve os valores computados prontos (nesse caso apenas
      consumir, sem recalcular no frontend) — dependência do contrato final da task-api,
      ainda em planejamento paralelo.
  - `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx` e
    `SheetRaceCard/index.tsx` (modificação de componentes existentes, não criação):
    - Estado vazio passa a exibir `SheetDashedFieldButton` (em vez do Autocomplete
      direto); clicar abre o Autocomplete inline (comportamento atual mantido a partir
      daí).
    - Ação "Editar" continua abrindo o Autocomplete pré-preenchido, mas agora com uma
      ação "Cancelar" (ex.: `SecondaryButton`/`IconButton` com `FiX`) que só reverte
      `isEditing` para `false` sem chamar nenhuma mutation — hoje essa reversão não
      existe.
    - Nova ação "Remover" no `SheetRaceCard` (`FiTrash2`, com `ConfirmationModal`, mesmo
      padrão do `SheetBiographyCard`) que aciona `DELETE /sheets/:id/race`.
    - Seleção de uma nova raça no Autocomplete (`onChange`) passa a chamar diretamente
      `PUT /sheets/:id/race` (via prop `onAssign` vinda de `page.tsx`), em vez de apenas
      atualizar estado local para o autosave debounced pegar depois.
  - `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx` e
    `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx` (modificação de
    componentes existentes): adicionar duas `ImprovementDefectListField` (`category="improvement"`
    e `category="flaw"`, com `otherListValue` cruzado entre as duas, exatamente como em
    `CharacteristicCreateForm`) para melhorias/defeitos PRÓPRIOS da raça, com payload
    `improvements`/`flaws` incluído no `POST`/`PUT /races`, e as duas seções
    correspondentes de exibição em `RaceView` (mesmo padrão de `CharacteristicView`, com
    `FiArrowUpCircle`/`FiArrowDownCircle`). Nenhum componente novo — mesma composição já
    usada em Característica.

- Integrações com API:
  - `GET /sheets/:id` — payload ampliado com `biography` (biografia vinculada + dados de
    pré-preenchimento do modal) e `melhorias`/`defeitos` (estrutura por categoria
    `race`/`biography`/`trainings`/`talents`/`characteristics`); `ISheet` (`shared/interfaces/Entities/Sheet`)
    precisa ganhar esses campos — formato exato a confirmar com o contrato final da
    task-api (dependência cruzada, backend ainda em planejamento).
  - `PUT /sheets/:id/race` / `DELETE /sheets/:id/race` — vincula/desvincula raça
    (endpoints dedicados, fora do autosave genérico de `PUT /sheets/:id`).
  - `PUT /sheets/:id/biography` / `DELETE /sheets/:id/biography` — vincula/desvincula
    biografia, enviando referência à melhoria de atributo selecionada + dados da
    melhoria livre (propriedade escolhida; tipo/valor fixos).
  - `GET /biographies` (`useGetEntityList<IBiographyListItem, IBiographyListFilters>`) —
    opções do autocomplete do modal.
  - `GET /biographies/:id` (`useGetEntityById<IBiography>`) — detalhe completo da
    biografia selecionada, para obter `improvements` filtráveis por tipo "Atributo".
  - `GET /improvement-flaw-types` / `GET /improvement-flaw-properties`
    (`useImprovementDefectTypesQuery`/`useImprovementDefectPropertiesQuery`, já
    existentes e reaproveitados) — fonte do tipo "Atributo" e das 6 propriedades
    (Força/Destreza/Constituição/Inteligência/Sabedoria/Carisma), usadas tanto para
    montar os 6 `SheetAttributeCard` quanto para o campo Propriedade travado da melhoria
    livre no modal de Biografia.
  - `POST /races` / `PUT /races/:id` — payload ampliado com `improvements`/`flaws`
    próprios da raça (mesmo formato já usado por Característica/Treinamento/Talento/Biografia).

- Formulário/validação:
  - `SheetBiographyAssignModal`: não é um `react-hook-form` tradicional de ponta a ponta
    (mistura seleção de entidade + seleção única obrigatória + mini-formulário), mas o
    campo Propriedade da melhoria livre deve reaproveitar a mesma validação de
    obrigatoriedade já usada em `improvementDefectFormSchema` (`propertyId` obrigatório);
    Tipo e Valor não são validáveis pelo usuário por estarem travados. Botão de submit
    (`Adicionar Biografia`) fica desabilitado, não escondido, até as 3 condições serem
    satisfeitas (biografia + melhoria marcada + propriedade escolhida).
  - `RaceCreateForm`: nenhuma mudança de schema (`raceFormSchema` inalterado) — as duas
    novas `ImprovementDefectListField` são estado local (`improvements`/`flaws`) fora do
    react-hook-form, exatamente como já ocorre em `CharacteristicCreateForm`.

- Acesso Google:
  - Página de ficha (`fichas/[id]/page.tsx`): **não se aplica o padrão padrão de ocultar
    ações** da skill `web-permissao-google-readonly`. Investigação confirmou que a
    página de ficha nunca aplicou esse padrão (nenhum uso de `useIsGoogleUser` em
    `app-web/src/app/(authorized)/fichas/**`) — o controle de acesso já existente é por
    posse da ficha (`isRestrictedToOwnSheets` no backend), não por tipo de ação; um
    usuário Google pode editar/remover Raça e Biografia normalmente nas fichas que já
    tem acesso, assim como já pode editar nome/level/campanha hoje. A spec não pede
    mudança nesse ponto, então as novas ações (editar/cancelar/remover de Raça e
    Biografia) seguem o mesmo comportamento — nenhuma fica oculta para Google.
  - Página de raças (`racas/page.tsx`, `RaceCreateForm`, `RaceView`): **ocultar
    criar/editar (padrão)** — já é o comportamento existente (`!isGoogleUser` em
    `racas/page.tsx` e `RacesListItem`), e as duas novas listas de melhorias/defeitos
    próprios da raça ficam automaticamente protegidas por já estarem dentro do mesmo
    `RaceCreateForm` só acessível a usuários não-Google; nenhuma alteração adicional de
    controle de acesso é necessária.

Status: concluído
Componentes:
- app-web/src/app/(authorized)/fichas/[id]/components/SheetDashedFieldButton/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyCard/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyField/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributeCard/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributesPanel/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributesDetailModal/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetImprovementDefectCategoryAccordions/index.tsx (novo)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx (alterado — cancelar/remover, onAssign dedicado)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceCard/index.tsx (alterado — ação remover + ConfirmationModal)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetLevelField/index.tsx (alterado — label "Level" + estilo de card)
- app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx (alterado — ImprovementDefectListField improvements/flaws próprios)
- app-web/src/app/(authorized)/racas/components/RaceView/index.tsx (alterado — seções Melhorias/Defeitos próprios)

Arquivos:
- app-web/src/app/(authorized)/fichas/[id]/page.tsx (reescrito — abas Estatísticas/Melhorias/Defeitos, campos Raça/Biografia lado a lado, endpoints dedicados de vínculo, cálculo de atributos)
- app-web/src/app/(authorized)/fichas/[id]/data/index.ts (novo — ordem canônica dos 6 atributos, categorias de melhorias/defeitos, snapshot vazio)
- app-web/src/shared/interfaces/Entities/Sheet/index.ts (alterado — `biography`, `melhorias`, `defeitos`, `ISheetImprovementDefectSnapshot(Entry)`, `race` agora `IRaceListItem`)
- app-web/src/shared/interfaces/Entities/Race/index.ts (alterado — `improvements`/`flaws` em `IRace`)
- app-web/src/shared/interfaces/Entities/ImprovementDefectItem/index.ts (alterado — `id: string` real e não-opcional, contrato confirmado em `ImprovementFlawItemResponseDto.fromResolved`)
- app-web/src/shared/interfaces/Entities/Sheet/index.ts (alterado — `ISheetImprovementDefectSnapshotEntry` passa a usar `Omit<IImprovementDefectItem, 'id'>` para preservar `id: string | null`, semântica de melhoria livre sem id real)
- app-web/src/shared/components/ImprovementDefectCard/index.tsx (alterado — `item` tipado com `id` opcional/nulável para aceitar tanto `IImprovementDefectItem` quanto snapshot de ficha, sem mudança de comportamento)
- app-web/src/shared/components/ImprovementDefectAddModal/index.tsx (alterado — gera `id` local via `uuid` para o item recém-criado no formulário, antes de ser persistido, seguindo o mesmo padrão de `localId` já usado em `FamilyCreateForm`)
- app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx (alterado — removido guard defensivo de `id`; botão "Adicionar Biografia" segue só as regras de negócio: biografia + melhoria marcada + propriedade livre preenchida)

Pendência de contrato RESOLVIDA: `ImprovementFlawItemResponseDto`/`BiographyResponseDto` agora expõem o
`id` real do registro de `improvement_flaws` em cada melhoria (`fromResolved` preenche `dto.id = item.id`).
`IImprovementDefectItem.id` foi promovido a campo obrigatório (`string`), o guard defensivo que mantinha o
botão "Adicionar Biografia" desabilitado por falta de `id` real foi removido, e `selectedImprovementId`
enviado a `PUT /sheets/:id/biography` agora sempre corresponde ao `id` real da melhoria marcada no
checkbox — tanto no fluxo de criar quanto no de editar (pré-preenchimento via `sheet.melhorias.biography`
contra `biographyDetail.improvements` já usava `item.id`, que agora é garantido pelo contrato). Não há
mais pendência bloqueante nesta etapa.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Revisão cobrindo os componentes/arquivos novos e alterados da etapa "1. web-dev"
(ficha de raça/biografia/estatísticas/melhorias/defeitos), com atenção especial às
mudanças em cascata de tipagem do follow-up (`IImprovementDefectItem.id` obrigatório)
sobre `shared/components/ImprovementDefectCard`, `shared/components/ImprovementDefectAddModal`,
`shared/interfaces/Entities/ImprovementDefectItem` e `shared/interfaces/Entities/Sheet`.

- [CORRIGIDO] **app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx:174-190** —
  O campo de busca de biografia (`DefaultAutocompleteInput id="sheet-biography-assign-search"`)
  não tem label associado programaticamente ao input. O texto "Biografia" é renderizado
  como `<Label component="span">`, que vira um `<span>` solto (sem `htmlFor`), e o
  `DefaultAutocompleteInput` correspondente não recebe a prop `label`. Comparando com o
  campo "Propriedade" da melhoria livre, alguns linhas abaixo (linha ~299), que passa
  corretamente `label="Propriedade"` para o mesmo componente (que internamente usa
  `<Label htmlFor={id}>`), fica claro que este é o padrão correto e esperado — e também é
  o padrão já usado em `SheetRaceField` (`Label htmlFor={isEditing ? 'sheet-race-field' :
  undefined}`) para o campo irmão de Raça. Resultado: usuários de leitor de tela não têm
  o nome acessível "Biografia" anunciado ao focar o combobox de busca.
  - Trecho: `<Label component="span" sx={{ margin: 0 }}>Biografia</Label>` seguido de
    `<DefaultAutocompleteInput<IBiographyListItem> id="sheet-biography-assign-search" ... />`
    sem prop `label`.
  - Sugestão: passar `label="Biografia"` para o `DefaultAutocompleteInput` (removendo o
    `<Label>` manual duplicado ou mantendo-o apenas como texto decorativo de seção, se o
    time preferir manter os dois visualmente) — mesmo padrão já usado no campo
    "Propriedade" do mesmo modal e no `SheetRaceField`.

- [CORRIGIDO] **app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx** —
  Ausência de feedback de carregamento durante a vinculação de uma raça
  (`linkRaceMutation`). O componente recebe apenas `isRemoving` (usado no
  `ConfirmationModal` de remoção via `SheetRaceCard`), mas não recebe nenhuma prop
  equivalente a `isSaving`/`isPending` para o fluxo de seleção no `Autocomplete`. Isso é
  inconsistente com `SheetBiographyField`, que recebe e usa `isSaving={linkBiographyMutation.isPending}`
  para o `PrimaryButton` de `SheetBiographyAssignModal`. Enquanto a mutation `PUT
  /sheets/:id/race` está em andamento, o Autocomplete de raça permanece totalmente
  interativo, sem `disabled` nem indicador visual, podendo o usuário trocar a seleção
  novamente antes da primeira requisição terminar.
  - Trecho: `page.tsx` → `<SheetRaceField value={race} options={raceOptions}
    onAssign={(raceId) => linkRaceMutation.mutate({ raceId })} onRemove={...}
    isRemoving={unlinkRaceMutation.isPending} />` (sem `isSaving`).
  - Sugestão: adicionar prop `isSaving`/`isAssigning` a `SheetRaceFieldProps`, repassar
    `linkRaceMutation.isPending` de `page.tsx`, e usar esse valor para desabilitar o
    `Autocomplete` (ou exibir um spinner) enquanto a vinculação está em andamento — mesmo
    tratamento já aplicado ao fluxo de Biografia.

### Pontos verificados e aprovados

- Cascata de tipagem `IImprovementDefectItem.id: string` (obrigatório): `ImprovementDefectCard`
  aceita corretamente tanto `IImprovementDefectItem` (id real) quanto
  `ISheetImprovementDefectSnapshotEntry` (id nulável) via `Omit<IImprovementDefectItem, 'id'>
  & { id?: string | null }`, sem regressão nas páginas que já consumiam o card
  (`RaceView`, `BiographyView`, `CharacteristicView`, `TrainingView`, `TalentView`,
  `ImprovementDefectListField`).
- `uuidv4()` local adicionado em `ImprovementDefectAddModal` (para o item ainda não
  persistido) não vaza para a API: confirmado que `RaceCreateForm`, `BiographyCreateForm`,
  `CharacteristicCreateForm` e `TrainingCreateForm`/`TalentCreateForm` remontam o payload
  de `improvements`/`flaws` explicitamente como `{ value, type: item.type.id, property:
  item.property.id }` antes de `POST`/`PUT`, descartando o `id` local fabricado.
  `SheetBiographyAssignModal` também usa apenas `item.id` (id real vindo de
  `biographyDetail.improvements`, já resolvido pelo backend) ao montar
  `SheetBiographyAssignPayload`.
- Cálculo dos atributos em `page.tsx` (`attributes` `useMemo`): base fixa `10` + soma de
  melhorias − soma de defeitos de tipo "Atributo" cuja propriedade corresponde a cada um
  dos 6 atributos (obtidos via `useImprovementDefectTypesQuery`/
  `useImprovementDefectPropertiesQuery`), modificador `Math.floor((value - 10) / 2)` —
  confere com a fórmula especificada, incluindo agregação de todas as 5 categorias
  (`race`/`biography`/`trainings`/`talents`/`characteristics`) via `flattenSnapshot`.
- Modal de Biografia (`SheetBiographyAssignModal`) usa os inputs GERAIS do sistema
  (`DefaultAutocompleteInput`/`DefaultTextInput`, `variant="outlined"`), não o estilo
  custom gold/`standard` usado nos campos Raça/Biografia da página — consistente com
  `web-cores` (cores via `APP_COLORS`, sem hex solto) e `web-icones` (todos os ícones via
  `react-icons/fi`: `FiEye`, `FiEdit2`, `FiPlus`, `FiTrash2`, `FiX`, `FiChevronDown`,
  `FiArrowUpCircle`, `FiArrowDownCircle`, `FiList`, `FiAlertTriangle`, `FiArrowLeft`; nenhum
  ícone de `@mui/icons-material` ou emoji).
- `IconButton`s sem texto visível têm `aria-label` em pt-BR em todos os componentes
  revisados (`SheetRaceCard`, `SheetBiographyCard`, `SheetRaceField`,
  `SheetBiographyAssignModal`, `SheetAttributesPanel`).
- Uso consistente dos hooks genéricos de `hooks/Queries` (`useGetEntityById`,
  `useGetEntityList`, `usePutEntity`, `useDeleteEntity`, `useImprovementDefectTypesQuery`,
  `useImprovementDefectPropertiesQuery`, `useSheetCampaignOptionsQuery`) em vez de
  `useQuery`/`useMutation` bespoke; todas as mutações novas (`linkRaceMutation`,
  `unlinkRaceMutation`, `linkBiographyMutation`, `unlinkBiographyMutation`) tratam
  `onSuccess` (toast + atualização de estado local) e `onError` (toast com mensagem da
  API/fallback pt-BR).
- `RaceCreateForm`/`RaceView`: novas seções de melhorias/defeitos próprios seguem
  exatamente a composição já usada em `CharacteristicCreateForm`/`CharacteristicView`
  (`ImprovementDefectListField` com `otherListValue` cruzado, payload
  `improvements`/`flaws` mapeado sem `id`); nenhum componente duplicado. `RaceCreateForm`
  segue o padrão `web-form-cadastro` (modo criar/editar via `useSelectedRaceStore`,
  `invalidateQueryKeys: [['/races']]` nas mutations de criar/editar/excluir).
- Acesso Google: confirmado que `fichas/[id]/**` não usa `useIsGoogleUser` em nenhum
  arquivo (comportamento intencional documentado na task), e `racas/page.tsx`,
  `RaceView`, `RacesListItem` continuam ocultando criar/editar/informações privadas para
  usuários Google, sem alteração necessária.
- `SheetImprovementDefectCategoryAccordions`/`SheetAttributesDetailModal`: reaproveitam
  `ImprovementDefectCard` (sem `onRemove`) e o padrão visual `detailSectionBox`, com
  categorias RAÇA/BIOGRAFIA/TREINAMENTOS/TALENTOS/CARACTERÍSTICAS e `emptyMessage`
  ("Nenhum item adicionado.") consistentes com o wireframe.
- Nenhum path hardcoded fora de `APP_ROUTES` (`router.push(APP_ROUTES.private.sheets)` em
  todos os pontos de navegação de `page.tsx`); textos de UI em pt-BR em todos os arquivos
  revisados.

### Correções aplicadas (pós-revisão)

- `SheetBiographyAssignModal/index.tsx`: campo de busca de biografia agora recebe
  `label="Biografia"` diretamente no `DefaultAutocompleteInput` (label associado via
  `htmlFor={id}` internamente, mesmo padrão do campo "Propriedade" e de
  `SheetRaceField`); o `<Label component="span">Biografia</Label>` solto foi mantido
  apenas no estado "card" (biografia já selecionada), onde não há input a rotular.
- `SheetRaceField/index.tsx`: adicionada prop `isSaving?: boolean`; o `Autocomplete`
  fica `disabled` e exibe um `CircularProgress` no `endAdornment` enquanto
  `linkRaceMutation` está em andamento, e o botão "Cancelar" também fica desabilitado
  nesse período — mesmo tratamento de feedback de carregamento já usado em
  `SheetBiographyField`/`SheetBiographyAssignModal` (`isSaving`). `page.tsx` agora
  passa `isSaving={linkRaceMutation.isPending}` para `SheetRaceField`.
- Ambos os achados da seção "## Revisão" foram corrigidos; nenhuma outra mudança fora
  do escopo dos dois achados foi feita.
