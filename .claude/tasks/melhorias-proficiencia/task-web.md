# Task Web: Melhorias de Proficiência e ajuste do modal Vincular Biografia

## Contexto
Ver .claude/tasks/melhorias-proficiencia/spec.md

As Partes 1 e 2 (novo tipo "Proficiência" + persistência das melhorias não-Atributo
da biografia no snapshot da ficha) são de backend e já devem estar concluídas antes
desta etapa. Esta task cobre apenas a Parte 3 (frontend): nenhuma alteração é
necessária para o novo tipo/propriedades aparecerem nos formulários existentes,
pois `useImprovementDefectTypesQuery`/`useImprovementDefectPropertiesQuery` já
consomem os endpoints dinamicamente.

## Etapas

### 1. web-dev

#### Funcionalidade

- Páginas/rotas alteradas (nenhuma rota nova; ajustes em componentes existentes de
  `app/(authorized)/fichas/[id]/`):
  - `app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`
    — adicionar a nova seção "Demais melhorias da biografia".
  - `app/(authorized)/fichas/[id]/page.tsx` — corrigir um cálculo que ficará
    incorreto quando o snapshot `melhorias.biography` passar a ter mais de uma
    entrada com `id` não nulo (ver detalhe abaixo).

- Integrações com API: nenhuma chamada nova. O modal já busca a biografia completa
  via `useGetEntityById<IBiography>({ url: '/biographies/:id' })`, cujo campo
  `improvements: IImprovementDefectItem[]` já traz todas as melhorias da
  biografia (não só as de tipo Atributo). A nova seção é derivada localmente
  filtrando esse mesmo dado já carregado — não precisa de nenhum endpoint
  adicional nem de mudança no payload `SheetBiographyAssignPayload`.

- Seção nova no `SheetBiographyAssignModal` ("Demais melhorias da biografia"):
  - Calcular a lista a partir do mesmo array já usado para `attributeImprovements`,
    invertendo a condição do filtro existente:
    `const otherImprovements = (biographyDetail?.improvements ?? []).filter(item => item.type.name !== ATTRIBUTE_TYPE_NAME)`.
  - Renderizar somente quando `showSelectionSteps && otherImprovements.length > 0`
    (mesma condição `showSelectionSteps` já usada nas demais seções; oculta a
    seção inteira quando vazia, sem mensagem de estado vazio — diferente do
    comportamento da seção de atributos).
  - Posicionar esse bloco entre o card/autocomplete da Biografia (linhas ~190-262
    do arquivo atual) e a seção "Escolha uma das melhorias de atributos da
    biografia" (que começa em `showSelectionSteps && (...)` logo em seguida).
  - Título da seção: `<DefaultText>Demais melhorias da biografia</DefaultText>`
    (mesmo padrão visual usado no título da seção de atributos, linha 266-268).
  - Cada item renderizado com `ImprovementDefectCard` (import já existente no
    arquivo, `@/shared/components/ImprovementDefectCard`), **sem** o wrapper de
    `Checkbox` e **sem** passar a prop `onRemove` — puramente somente leitura,
    reaproveitando o mesmo componente já usado (sem checkbox) para a seção de
    atributos, apenas sem o `<Checkbox>` ao lado.
  - Não introduzir nenhum estado novo de seleção: a seção não tem
    `useState`/`onChange` associado, é derivada apenas de `biographyDetail`.
  - A seção que já lista as melhorias de Atributo (`attributeImprovements`,
    filtro por `ATTRIBUTE_TYPE_NAME`) permanece inalterada — apenas confirmar
    durante a implementação que o comportamento atual (filtro + mensagem de
    estado vazio) continua correto, sem modificá-la.

- Ajuste necessário em `app/(authorized)/fichas/[id]/page.tsx` (ponto identificado
  na investigação de código, correspondente ao "ponto a validar" registrado no
  spec):
  - No `useMemo` que monta `biographyAssignInitialValue` (por volta das linhas
    216-236), o cálculo de `selectedEntry` hoje é:
    `melhorias.biography.find((entry) => entry.id !== null)`.
    Esse cálculo assume que a única entrada do snapshot da biografia com `id`
    não nulo é a melhoria de Atributo selecionada — o que deixa de ser verdade
    assim que o backend passa a incluir também as melhorias não-Atributo (ex.:
    Proficiência) no snapshot, todas com `id` real preenchido.
  - Corrigir para filtrar também por tipo Atributo, seguindo o mesmo padrão já
    usado mais acima no próprio arquivo (linhas 175-176, 184-185, 207, 210):
    `melhorias.biography.find((entry) => attributeType && entry.type.id === attributeType.id && entry.id !== null)`.
  - Sem essa correção, reabrir o modal para editar uma biografia já vinculada
    (`initialValue`) pode selecionar `selectedImprovementId` errado sempre que
    a biografia tiver pelo menos uma melhoria não-Atributo, quebrando a
    pré-seleção do checkbox de melhoria de atributo no modo de edição.
  - `freeEntry` (`entry.id === null`) não precisa de ajuste — continua único
    por construção (é a única entrada sem `id`).

- Exibição da ficha (aba "Melhorias" / `SheetImprovementDefectCategoryAccordions`):
  investigação confirmou que **não é necessário nenhum ajuste** além do item
  acima. O componente já itera genericamente sobre todas as entradas de
  `melhorias[category.key]` (incluindo `biography`) com `.map`, renderizando
  cada uma com `ImprovementDefectCard` + `sourceName`, sem nenhuma suposição de
  quantidade fixa de itens por categoria — novas entradas de Proficiência
  aparecerão corretamente na lista sem mudança de código. O cálculo de valores
  de atributo (`attributes`, linhas 167-199) e o detalhamento por categoria
  (`attributesDetailGroups`, linhas 201-214) já filtram explicitamente por
  `entry.type.id === attributeType.id`, então também não são afetados pelas
  novas entradas não-Atributo.

- Formulário/validação: nenhum formulário novo. As validações existentes do
  modal (melhoria de Atributo selecionada obrigatória, propriedade livre
  obrigatória, propriedade livre distinta da propriedade da melhoria
  selecionada) permanecem inalteradas — a nova seção não participa de nenhuma
  validação nem do payload de confirmação.

- Acesso Google: não aplicável a este ajuste — o modal `SheetBiographyAssignModal`
  já é usado dentro do fluxo de edição de ficha; nenhuma mudança de
  comportamento por `provider` está no escopo desta demanda (o spec não define
  regras de acesso Google para fichas, e esta task não introduz nenhuma ação de
  criar/editar/excluir nova).

Status: concluído
Componentes: nenhum
Arquivos: app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx, app-web/src/app/(authorized)/fichas/[id]/page.tsx

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`.

Pontos verificados especificamente:

- **Seção "Demais melhorias da biografia"** (`SheetBiographyAssignModal/index.tsx:267-277`):
  - Posicionada corretamente entre o bloco da Biografia selecionada (linhas
    194-265) e a seção "Escolha uma das melhorias de atributos da biografia"
    (linha 279 em diante), conforme pedido.
  - Condição de exibição correta: `showSelectionSteps && otherImprovements.length > 0`
    (linha 267) — fica oculta quando `otherImprovements` está vazio, sem
    mensagem de estado vazio, diferente da seção de atributos (que mostra
    "Esta biografia não possui melhorias de atributo cadastradas." quando
    vazia).
  - `otherImprovements` (linhas 145-147) é derivado apenas de
    `biographyDetail?.improvements`, invertendo corretamente o filtro de
    `attributeImprovements` (`item.type.name !== ATTRIBUTE_TYPE_NAME`); nenhum
    `useState`/`onChange` novo foi introduzido.
  - Cada item é renderizado com `<ImprovementDefectCard key={getImprovementKey(item)} item={item} />`
    sem `Checkbox` e sem `onRemove` (prop opcional em `ImprovementDefectCardProps`,
    confirmado em `shared/components/ImprovementDefectCard/index.tsx:17`), portanto
    somente leitura como esperado.
  - Título usa `<DefaultText>Demais melhorias da biografia</DefaultText>`,
    consistente com o padrão visual do título da seção de atributos.
  - A seção de atributos (`attributeImprovements`, filtro por
    `ATTRIBUTE_TYPE_NAME`, mensagem de estado vazio) permanece inalterada.

- **Cálculo de `selectedEntry` em `biographyAssignInitialValue`**
  (`app/(authorized)/fichas/[id]/page.tsx:222-227,239`):
  - Corrigido para `melhorias.biography.find((entry) => attributeType && entry.type.id === attributeType.id && entry.id !== null)`,
    igual ao padrão já usado no restante do arquivo (linhas 175-176, 184-185,
    207, 210) para filtrar entradas de tipo Atributo.
  - O array de dependências do `useMemo` (linha 239) inclui `attributeType`
    (`[biography, melhorias, attributeType]`), evitando o uso de um valor
    desatualizado da closure quando `attributeType` é resolvido de forma
    assíncrona por `useImprovementDefectTypesQuery`.
  - `freeEntry` (`entry.id === null`) permanece sem alteração, como esperado.

- **Ícones**: apenas `react-icons/fi` (`FiEdit2`, `FiEye`) em ambos os
  arquivos tocados; nenhum ícone de `@mui/icons-material` ou SVG customizado.
  `IconButton`s sem texto visível têm `aria-label` em pt-BR ("Visualizar
  {nome}", "Editar {nome}").

- **React Query / tipagem**: nenhuma chamada `useQuery`/`useMutation` bespoke
  nova; a nova seção reaproveita dados já carregados via
  `useGetEntityById<IBiography>`. Tipos de `otherImprovements` e
  `selectedEntry` são coerentes com `IImprovementDefectItem` /
  `ISheetImprovementDefectSnapshotEntry`, sem uso de `any`.

- **Reaproveitamento**: a nova seção reutiliza `ImprovementDefectCard` e
  `DefaultText` já existentes, sem duplicar UI.