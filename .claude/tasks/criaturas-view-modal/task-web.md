# Task Web: Modal de visualização de criaturas (ViewModal + destacar em popup)

## Contexto
Ver .claude/tasks/criaturas-view-modal/spec.md (se existir). Não há `spec.md` para
esta demanda — o plano abaixo foi elaborado com base direta no pedido detalhado
recebido do solicitante (agente orquestrador), investigando os padrões já existentes
em `app-web/src/app/(authorized)/criaturas/` e `app-web/src/shared/components/`.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/shared/components/Modals/ViewModal/index.tsx (novo,
genérico, reexportado em app-web/src/shared/components/Modals/index.ts);
app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx (novo,
específico da página); app-web/src/app/(authorized)/criaturas/components/CreaturesListItem/index.tsx
(alterado — nova prop onView + botão FiEye); app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx
(alterado — propagação de onView)
Arquivos: app-web/src/app/(authorized)/criaturas/page.tsx (alterado — estado
creaturePendingView, handleView, renderização de ViewModal + CreatureView);
app-web/src/providers/mui-theme-provider.tsx (alterado — export nomeado do
`theme` para reuso pelo ViewModal ao renderizar dentro da popup);
app-web/src/shared/constants/Styles/InputStyles/index.ts (alterado — nova
variante `richTextViewFrame`, moldura somente-leitura para os campos HTML do
Tiptap exibidos em CreatureView)
Observação (decisão sobre o "Ponto de atenção" do plano, confirmada pelo
solicitante antes da implementação): o `Dialog` principal do MUI é ocultado
(não renderizado) enquanto a popup destacada estiver aberta, evitando conteúdo
duplicado na tela; o fechamento da popup (evento `beforeunload` na nova janela
+ polling de `popupWindow.closed` como fallback) é tratado como equivalente a
chamar `onClose()` do `ViewModal` — exceto quando o fechamento foi consequência
do próprio `onClose()` já ter sido disparado pelo componente pai (`open` já
`false`), para não disparar `onClose()` em duplicidade.
Pendência de infraestrutura (fora do escopo de edição deste agente):
`ViewModal` usa `@emotion/cache` (`createCache`) para isolar, dentro da popup,
os estilos MUI/emotion gerados após a sua abertura. Ele já está disponível em
`app-web/node_modules` como dependência transitiva de `@emotion/react` (mesma
versão instalada, `11.14.0`), então a integração funciona sem alteração de
`package.json`. Como este agente só pode editar `app-web/src/**` e
`.claude/tasks/**`, a promoção de `@emotion/cache` a dependência direta do
`app-web` (sugerida no plano) fica pendente para quem tiver permissão de
editar `app-web/package.json`.
Dependências: nenhuma

#### Componentes

- Componente: `ViewModal` (genérico e reutilizável — `shared/components/Modals/ViewModal/index.tsx`,
  reexportado em `shared/components/Modals/index.ts` junto com `FormModal`/`ConfirmationModal`)
  - Props: `open: boolean`; `onClose: () => void`; `title: string`; `children: ReactNode`;
    `size?: 'default' | 'wide'` (seguir a mesma convenção de `FormModal` — `wide` usa
    `Card sizeClassName="w-[min(1152px,92vw)]"` ou largura equivalente/maior, já que o
    conteúdo de criaturas é extenso; avaliar se `wide` já é suficiente ou se vale criar
    uma largura própria para este modal).
  - Comportamento esperado:
    - Mesmo esqueleto visual do `FormModal`: `Dialog` (MUI) + `Card` (`shared/components/Containers`)
      + `Title` no topo + botão fechar `FiX` no canto superior direito (mesmo padrão de
      `IconButton`/botão absoluto já usado em `FormModal`).
    - Adicionalmente, na área de ações do cabeçalho, um segundo botão pequeno "destacar em
      popup": `IconButton` + `Tooltip` (pt-BR, ex. "Abrir em nova janela") com um ícone
      `react-icons/fi` escolhido via skill `web-icones` (candidatos: `FiExternalLink` ou
      `FiMaximize2`), ao lado do botão de fechar.
    - Ao clicar em destacar: abrir uma janela popup real do navegador via `window.open`
      com features como `popup=yes,width=...,height=...,resizable=yes,scrollbars=yes`
      (omitir `toolbar`/`menubar`/`location`/`status` — com `popup=yes` a maioria dos
      navegadores já suprime as barras de navegação), guardando a referência da janela em
      estado/ref do componente.
    - Renderizar `children` dentro do `document` da nova janela via `ReactDOM.createPortal`
      (não como HTML estático — o conteúdo React deve continuar reativo dentro da popup).
    - Para os estilos (MUI + Tailwind) funcionarem na nova janela:
      - Copiar para o `<html>` da nova janela as mesmas classes do `<html>` da janela
        principal (variáveis de fonte Geist definidas em `app/(authorized)/layout.tsx` —
        `--font-geist-sans`/`--font-geist-mono` — das quais o tema MUI e o Tailwind dependem).
      - Copiar/clonar para o `<head>` da nova janela as tags `<style>`/`<link rel="stylesheet">`
        existentes no `<head>` do documento principal no momento da abertura (CSS do
        Tailwind/globals.css e estilos já inseridos pelo MUI/emotion até aquele momento).
      - Configurar um cache do `@emotion/cache` (`createCache`) com `container` apontando
        para o `<head>` da nova janela, envolvendo o conteúdo portalado num `CacheProvider`
        do `@emotion/react` (mais o `ThemeProvider` do MUI já usado em `providers/mui-theme-provider.tsx`,
        reaplicado ali) — para que estilos MUI gerados **depois** da abertura da popup sejam
        inseridos diretamente nela, e não na janela principal. `@emotion/cache` não é
        dependência direta hoje (é transitiva via `@emotion/react`) — adicionar como
        dependência direta do `app-web` se necessário.
    - Detectar o fechamento da popup (evento `beforeunload` na nova janela e/ou polling de
      `popupWindow.closed`) para desmontar o portal e limpar a referência; ao desmontar o
      `ViewModal` (`open` vira `false`) ou trocar de conteúdo, fechar a popup programaticamente
      se ainda estiver aberta (`popupWindow.close()`).
    - **Ponto de atenção (lacuna de requisito, não decidir sozinho):** o pedido não deixa
      explícito o que deve acontecer com o `Dialog` principal do MUI enquanto a popup estiver
      aberta (permanecer aberto atrás da popup mostrando o mesmo conteúdo duplicado, ou
      fechar/ocultar o `Dialog` principal enquanto a popup estiver ativa, retornando ao estado
      fechado quando a popup for fechada). Sugestão de implementação, a confirmar: ocultar o
      `Dialog` principal ao destacar (evitando conteúdo duplicado na tela) e tratar o fechamento
      da popup como equivalente a chamar `onClose()`.

- Componente: `CreatureView` (específico da página — `app/(authorized)/criaturas/components/CreatureView/index.tsx`,
  passado como `children`/conteúdo do `ViewModal` genérico; **não** é um componente de
  `shared/components/`, pois conhece o formato de `ICreature`)
  - Props: `creatureId: string` (id da criatura a exibir).
  - Comportamento esperado:
    - Busca os dados completos via `useGetEntityById<ICreature>({ url: \`/creatures/${creatureId}\` })`
      (mesmo hook já usado em `CreatureCreateForm` para o modo edição — necessário porque
      `ICreatureListItem` da listagem só tem `id`, `referenceImageUrl`, `name`, `category`).
    - Estado de carregamento: `CircularProgress` + `DefaultText` ("Carregando dados da
      criatura...", mesmo padrão visual/texto já usado em `CreatureCreateForm`).
    - Estado de erro: `showToast` com `error.response?.data?.message ?? 'Não foi possível
      carregar os dados da criatura.'` (mesmo padrão de `CreatureCreateForm`).
    - Layout do conteúdo, uma vez carregado:
      - Cabeçalho: nome da criatura (`name`), em destaque (ex. `Title` ou `DefaultText`
        com estilo próprio) — distinto/sem duplicar visualmente o `title` passado ao
        `ViewModal` genérico (ex. o `ViewModal` pode receber um título mais genérico como
        "Detalhes da Criatura", enquanto este cabeçalho interno mostra o nome específico).
      - Logo abaixo, bloco lado a lado: à esquerda, a imagem de `referenceImageUrl` em um
        quadro **sem bordas**, tamanho fixo 300x300 (`objectFit: cover`); à direita, com a
        mesma altura do quadro, uma coluna com rótulo (`Label`) + valor (`DefaultText`) para,
        nesta ordem: "Outros Nomes" (`otherNames`), "Categoria" (`category.name`), "Nível de
        Ameaça" (`threatLevel`), "Expectativa de Vida" (`averageLifeExpectancy`). Campos
        ausentes/nulos exibem um valor padrão (ex. "Não informado").
      - Abaixo desse bloco, todas as demais seções, cada uma ocupando uma linha inteira do
        modal, nesta ordem: Características Físicas (`physicalCharacteristics`), Habitat
        (`habitat`), Comportamento (`behavior`), Alimentação (`diet`), Ciclo de Vida
        (`lifeCycle`), **Estágio de Vida** (exceção — ver abaixo), Habilidades e Poderes
        (`abilitiesAndPowers`), Resistências (`resistances`), Fraquezas (`weaknesses`),
        Combate (`combat`), Métodos de Ataque (`attackMethods`), Estratégia (`strategy`),
        Grau de Perigo (`dangerDegree`), Recursos Obtidos (`obtainedResources`), Valor
        Comercial (`commercialValue`), Relação com Civilizações
        (`relationWithCivilizations`), Mitologia e Folclore (`mythologyAndFolklore`),
        Registro de Encontro (`encounterRecord`), Curiosidade dos Estudiosos
        (`scholarsCuriosity`).
      - Cada seção full-width: um ícone `react-icons/fi` (escolhido via skill `web-icones`
        conforme o significado do título — ex. algo relacionado a características físicas,
        habitat, comportamento etc.) + o título do campo, e abaixo uma moldura com borda
        contendo o valor. Os campos são HTML gerado pelo Tiptap (mesmo editor usado em
        `FormRichTextInput`) — renderizar como HTML (`dangerouslySetInnerHTML`, já que o
        conteúdo é gerado pelo próprio editor da aplicação) reaproveitando a tipografia já
        definida em `APP_INPUT_STYLES.richTextContent` (`shared/constants/Styles/InputStyles`,
        que já estiliza `h1`/`h2`/`h3`/`ul`/`ol` vindos do Tiptap) dentro da moldura. Avaliar
        adicionar uma nova chave em `APP_INPUT_STYLES` (ex. `richTextViewFrame`) para a
        moldura somente-leitura — `richTextField` tem estados de `hover`/`focus-within`
        pensados para edição que não fazem sentido numa área não editável; seguir a regra do
        skill `web-componentes` de acrescentar variante no arquivo de estilos da categoria em
        vez de estilo solto no componente. Campos nulos/vazios exibem a moldura com um texto
        padrão (ex. "Não informado") em vez de HTML vazio.
      - **Exceção "Estágio de Vida"**: seção em 4 colunas, uma por fase — "Filhote"
        (`lifeStageInfant`), "Jovem" (`lifeStageYoung`), "Adulto" (`lifeStageAdult`), "Ancião"
        (`lifeStageElder`). Nesta seção o ícone fica **ao lado** de cada um dos 4 rótulos (não
        acima, diferente do padrão das demais seções), seguido da moldura com o valor em HTML.

#### Funcionalidade
- Páginas/rotas alteradas (nenhuma rota nova criada):
  - `app-web/src/app/(authorized)/criaturas/page.tsx`
  - `app-web/src/app/(authorized)/criaturas/components/CreaturesList/index.tsx`
  - `app-web/src/app/(authorized)/criaturas/components/CreaturesListItem/index.tsx`
- `CreaturesListItem`: nova prop `onView: (creature: ICreatureListItem) => void`; novo
  `IconButton` + `Tooltip` "Visualizar" com ícone `FiEye` (via skill `web-icones`),
  posicionado ao lado das ações Editar/Excluir já existentes, mesmo padrão visual
  (`sx={{ color: APP_COLORS.textBrownDark }}`, `aria-label`).
- `CreaturesList`: propaga `onView` para `CreaturesListItem` (nova prop em
  `CreaturesListProps`, junto de `onEdit`/`onDelete`).
- `page.tsx`: novo estado local `creaturePendingView: ICreatureListItem | null` (mesmo
  padrão já usado para `creaturePendingDelete`). **Decisão de arquitetura**: não reaproveitar
  `useSelectedCreatureStore` para a visualização — essa store está acoplada ao fluxo de
  criação/edição (`CreatureCreateForm` usa `!!selectedCreature` para decidir modo
  edição/criação); usar o mesmo `selectedCreature` para controlar também o `ViewModal`
  criaria acoplamento indevido entre os dois fluxos. Handler `handleView(creature)` seta
  `creaturePendingView`; renderizar `<ViewModal open={!!creaturePendingView} onClose={() =>
  setCreaturePendingView(null)} title="Detalhes da Criatura" size="wide">` contendo
  `<CreatureView creatureId={creaturePendingView.id} />` quando houver criatura selecionada
  para visualização (mesmo padrão de composição já usado com `FormModal`/`ConfirmationModal`
  na página).
- Integrações com API: `GET /creatures/:id` (mesmo endpoint já consumido por
  `CreatureCreateForm` em modo edição, via `useGetEntityById<ICreature>`) para obter os
  dados completos da criatura exibidos em `CreatureView`. Nenhum novo endpoint é necessário.
- Formulário/validação: não aplicável — funcionalidade somente de visualização (leitura),
  sem formulário nem envio de dados ao backend.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

- **app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx:57-60**
  (e replicado em 251-256, no bloco "Estágio de Vida") — O HTML gerado pelo Tiptap é
  injetado via `dangerouslySetInnerHTML` diretamente como filho do `Box` que recebe
  `sx={APP_INPUT_STYLES.richTextContent}`. Só que as regras de tipografia dessa
  variante (`shared/constants/Styles/InputStyles/index.ts:99-127`) são todas
  escopadas como `& .ProseMirror h1`, `& .ProseMirror ul`, etc. — ou seja, dependem de
  um elemento descendente com a classe `ProseMirror` (a raiz `contenteditable` que o
  próprio Tiptap desenha, usada em `FormRichTextInput`/`EditorContent`). Como o HTML
  cru renderizado aqui não tem esse wrapper, os seletores nunca casam: `h1`/`h2`/`h3`
  (tamanho/peso/margem) e `ul`/`ol` (`list-style`/`padding-left`) do conteúdo somente-
  leitura caem no estilo padrão do navegador, divergindo visualmente do que o mesmo
  conteúdo mostra dentro do editor — objetivo explícito do plano
  ("reaproveitando a tipografia já definida em `APP_INPUT_STYLES.richTextContent`
  ... que já estiliza h1/h2/h3/ul/ol vindos do Tiptap").
  - Trecho: `<Box sx={APP_INPUT_STYLES.richTextContent} dangerouslySetInnerHTML={{ __html: value }} />`
  - Sugestão: envolver o HTML renderizado num elemento com `className="ProseMirror"`
    (ex.: `<Box className="ProseMirror" sx={APP_INPUT_STYLES.richTextContent} dangerouslySetInnerHTML={...} />`)
    ou, preferencialmente, criar/ajustar uma variante de estilo dedicada à leitura
    (ex. reescrever os seletores de `richTextContent` para não dependerem de
    `.ProseMirror`, ou duplicar as regras de tipografia numa nova chave em
    `APP_INPUT_STYLES` usada só na exibição somente-leitura).

- **app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx:56 e 252**
  — A verificação de "campo vazio" usa apenas truthiness (`value ? ... : NOT_INFORMED`)
  em vez do utilitário já existente `isRichTextEmpty` (`shared/util/IsRichTextEmpty`),
  que já é usado em `shared/formSchemas/CreatureFormSchema/index.ts` justamente para
  tratar esse caso. O editor Tiptap, quando o usuário digita e depois apaga todo o
  conteúdo de um campo opcional, produz `'<p></p>'` (string truthy, mas
  semanticamente vazia) — como os campos opcionais do schema (`habitat`, `behavior`
  etc.) não têm o `refine` de `physicalCharacteristics`, esse valor é aceito e
  persistido normalmente. Nesse cenário, `CreatureView` renderizaria a moldura com um
  parágrafo HTML vazio em vez do texto padrão "Não informado", divergindo do
  requisito "Campos nulos/vazios exibem a moldura com um texto padrão".
  - Trecho: `{value ? (<Box sx={APP_INPUT_STYLES.richTextContent} dangerouslySetInnerHTML={{ __html: value }} />) : (<DefaultText>{NOT_INFORMED}</DefaultText>)}`
  - Sugestão: trocar a condição por `!isRichTextEmpty(value)` (importando de
    `@/shared/util`), aplicando o mesmo critério de "vazio" já usado na validação do
    formulário de cadastro/edição.

- **app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx:247**
  — No bloco de exceção "Estágio de Vida", os 4 rótulos ("Filhote", "Jovem", "Adulto",
  "Ancião") usam `DefaultText` com `sx={{ fontWeight: 700 }}` em vez do componente
  `Label`, que é o componente usado para todo rótulo de campo no restante da página
  (`Outros Nomes`, `Categoria`, título de cada `CreatureSectionBlock` etc.). Como
  `APP_TEXT_STYLES.label` (`shared/constants/Styles/TextStyles/index.ts:25-32`) aplica
  `textTransform: uppercase`, `letterSpacing` e tamanho de fonte menor (12px) —
  diferente de `APP_TEXT_STYLES.default` (14px, sem uppercase) — os 4 rótulos dessa
  seção ficam visualmente inconsistentes com os demais rótulos da mesma tela.
  - Trecho: `<DefaultText component="span" sx={{ fontWeight: 700 }}>{stage.label}</DefaultText>`
  - Sugestão: usar `<Label component="span" sx={{ margin: 0 }}>{stage.label}</Label>`,
    igual ao padrão já usado em `CreatureSectionBlock` para o título ao lado do ícone.

- **app-web/src/shared/components/Modals/ViewModal/index.tsx:75-77** — Quando
  `window.open` é bloqueado pelo navegador (retorna `null`, ex.: bloqueador de popup
  de extensão, política do navegador, etc.), `handlePopOut` simplesmente retorna sem
  nenhum feedback visual ao usuário; o clique no botão "Abrir em nova janela" não
  produz efeito perceptível nem mensagem de erro.
  - Trecho: `if (!popupWindow) { return; }`
  - Sugestão: disparar um `showToast({ type: 'error', message: 'Não foi possível abrir a janela em destaque. Verifique se o navegador está bloqueando pop-ups.' })` (ou
    equivalente) nesse branch, para dar feedback do padrão já usado em erros de
    mutação/consulta no restante do app.

- **app-web/package.json** (achado de infraestrutura, não bloqueante) — O agente
  web-dev confirmou que `@emotion/cache` (importado diretamente em
  `shared/components/Modals/ViewModal/index.tsx:8`, `import createCache from
  '@emotion/cache'`) hoje só existe em `app-web/node_modules` como dependência
  transitiva de `@emotion/react` (mesma versão instalada, `11.14.0`), e não está
  listada em `dependencies` de `app-web/package.json`. Confirmado: de fato não há
  entrada `@emotion/cache` no `package.json` atual. Importar diretamente um pacote
  que não é dependência declarada é uma "phantom dependency" — funciona hoje porque o
  gerenciador de pacotes atual resolve/hoists o módulo no `node_modules`, mas não há
  garantia disso se a versão/estrutura interna de `@emotion/react` mudar no futuro,
  ou se o projeto passar a usar um gerenciador com resolução mais estrita (ex.:
  pnpm, que isola dependências transitivas por padrão). Como o `web-dev` só pode
  editar `app-web/src/**`, este é um achado real, mas sua correção depende de quem
  tiver permissão para editar `app-web/package.json`.
  - Sugestão: adicionar `"@emotion/cache": "^11.14.0"` em `dependencies` de
    `app-web/package.json` (mesma major/minor já resolvida hoje) e rodar
    `npm install` para gerar a entrada correspondente no lockfile.

### Correções aplicadas

- Achado 1 (tipografia Tiptap não aplicada no HTML somente-leitura) — corrigido em
  `app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`: o `Box`
  que recebe `dangerouslySetInnerHTML` (em `CreatureSectionBlock` e no bloco "Estágio
  de Vida") agora também recebe `className="ProseMirror"`, fazendo os seletores `&
  .ProseMirror h1/h2/h3/ul/ol` de `APP_INPUT_STYLES.richTextContent` casarem também no
  conteúdo somente-leitura, igual ao editor.
- Achado 2 (checagem de vazio por truthiness) — corrigido nos mesmos dois pontos:
  trocada a condição `value ? ... : NOT_INFORMED` por `!isRichTextEmpty(value ??
  undefined) ? ... : NOT_INFORMED`, importando `isRichTextEmpty` de `@/shared/util`
  (mesmo utilitário já usado em `shared/formSchemas/CreatureFormSchema`), tratando
  `'<p></p>'` como vazio.
- Achado 3 (rótulos "Estágio de Vida" com `DefaultText` em vez de `Label`) — corrigido:
  os 4 rótulos ("Filhote", "Jovem", "Adulto", "Ancião") agora usam `<Label
  component="span" sx={{ margin: 0 }}>`, mesmo padrão usado em `CreatureSectionBlock`.
- Achado 4 (`window.open` bloqueado sem feedback) — corrigido em
  `app-web/src/shared/components/Modals/ViewModal/index.tsx`: quando `popupWindow` é
  `null`, agora é disparado `showToast({ type: 'error', message: 'Não foi possível
  abrir a janela em destaque. Verifique se o navegador está bloqueando pop-ups.' })`
  antes do `return`.
- Achado 5 (`@emotion/cache` como phantom dependency em `app-web/package.json`) — NÃO
  aplicado por este agente: `package.json` está fora do escopo de escrita permitido
  (apenas `app-web/src/**` e `.claude/tasks/**`). Fica registrado como pendência para
  encaminhamento manual: adicionar `"@emotion/cache": "^11.14.0"` em `dependencies` de
  `app-web/package.json` e rodar `npm install`.

Demais pontos verificados e aprovados sem ressalvas: estrutura/local dos arquivos
(`ViewModal` em `shared/components/Modals` reexportado no barrel, `CreatureView`
específico da página em `app/(authorized)/criaturas/components`); `ViewModal` segue o
mesmo esqueleto do `FormModal` (`Dialog` + `Card` + `Title` + botão `FiX`) e reaproveita
a mesma variante `wide` de largura; abertura de popup via `window.open` + portal via
`createPortal` para o `document` da nova janela + clonagem de `<style>`/`<link
rel="stylesheet">` + `CacheProvider`/`ThemeProvider` reaplicados com o `theme` exportado
de `providers/mui-theme-provider.tsx`; detecção de fechamento por `beforeunload` +
polling de `popupWindow.closed`, com guarda (`openRef`) contra disparo duplicado de
`onClose()`; `Dialog` principal corretamente ocultado enquanto a popup está aberta;
`CreatureView` busca dados via `useGetEntityById<ICreature>` com estados de loading
(`CircularProgress` + texto) e erro (`showToast`) no mesmo padrão de
`CreatureCreateForm`; layout da imagem 300x300 sem borda + coluna de dados à direita e
seções full-width com ícone + título + moldura seguem a ordem e os campos
especificados; `CreaturesListItem`/`CreaturesList`/`page.tsx` propagam `onView`
corretamente, com `IconButton`/`Tooltip`/`aria-label` "Visualizar" em pt-BR e ícone
`FiEye`; `creaturePendingView` segue o mesmo padrão de estado local já usado para
`creaturePendingDelete`, sem reaproveitar indevidamente `useSelectedCreatureStore`;
todos os ícones vêm de `react-icons/fi`, sem `@mui/icons-material`/SVG customizado/
emoji; nenhuma tipagem `any`, nenhum import quebrado ou não utilizado nos arquivos
revisados.

### Re-revisão das correções

Reavaliados apenas os arquivos alterados pela correção:
`app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`,
`app-web/src/shared/components/Modals/ViewModal/index.tsx` e
`app-web/src/shared/constants/Styles/InputStyles/index.ts` (nova chave
`richTextViewFrame`, adicionada corretamente como variante própria no arquivo de
estilos da categoria, sem estilo solto no componente).

- **Achado 1 — CONTINUA NÃO RESOLVIDO.**
  **app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx:57-61**
  (e replicado em 253-258, no bloco "Estágio de Vida") — A correção aplicada adicionou
  `className="ProseMirror"` **no mesmo elemento** `Box` que já recebe
  `sx={APP_INPUT_STYLES.richTextContent}` e o `dangerouslySetInnerHTML` com o
  HTML do Tiptap. Isso não resolve o problema: as regras de
  `richTextContent` (`shared/constants/Styles/InputStyles/index.ts:99-127`) usam
  seletores descendentes do tipo `& .ProseMirror h1`, que compilam para algo como
  `.css-hash .ProseMirror h1` — ou seja, exigem que `.ProseMirror` seja um elemento
  **descendente** (filho/neto) de `.css-hash`, e não o **mesmo** elemento. Em CSS, o
  combinador de descendência (espaço) nunca casa um elemento consigo mesmo: colocar
  as duas classes (`css-hash`, gerada pelo `sx`, e `ProseMirror`, do `className`) no
  mesmo nó não satisfaz `.css-hash .ProseMirror`, pois isso exigiria um elemento
  `.ProseMirror` que seja descendente de `.css-hash`, e aqui ambos são o mesmo nó.
  Prova disso é o uso correto já existente em
  `shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx:131-132`, onde o
  `Box sx={richTextContent}` é o elemento **externo** e o `EditorContent` (Tiptap)
  renderiza internamente um `<div class="ProseMirror">` como filho — aí sim,
  `.ProseMirror` é descendente de `.css-hash`, e o seletor casa corretamente. Ou seja,
  o problema relatado no achado 1 original persiste: a tipografia `h1`/`h2`/`h3`
  (tamanho/peso/margem) e `ul`/`ol` (`list-style`/`padding-left`) do conteúdo
  somente-leitura continua caindo no estilo padrão do navegador, sem aplicar as
  regras de `richTextContent`.
  - Trecho: `<Box className="ProseMirror" sx={APP_INPUT_STYLES.richTextContent} dangerouslySetInnerHTML={{ __html: value as string }} />`
  - Sugestão: separar em dois elementos aninhados — um `Box` externo com
    `sx={APP_INPUT_STYLES.richTextContent}` (sem `className="ProseMirror"`), e dentro
    dele um elemento filho (ex. `<div className="ProseMirror" dangerouslySetInnerHTML={{ __html: value as string }} />`)
    que carregue apenas a classe `ProseMirror`, reproduzindo a mesma estrutura de
    aninhamento usada em `FormRichTextInput` (`Box` externo com `sx`, `EditorContent`
    interno gerando o `div.ProseMirror`). Aplicar a mesma correção nos dois pontos do
    arquivo (seções padrão e bloco "Estágio de Vida").

- **Achado 2 — resolvido.**
  `!isRichTextEmpty(value ?? undefined)` (linhas 56 e 253) usa corretamente o
  utilitário `isRichTextEmpty` (`shared/util/IsRichTextEmpty`, que trata `'<p></p>'`
  como vazio), importado de `@/shared/util`, mesmo critério já usado em
  `CreatureFormSchema`. Confirmado nos dois pontos (seções padrão e "Estágio de
  Vida"). Nota menor, não bloqueante: a asserção `value as string` dentro do ramo
  verdadeiro (necessária porque o TypeScript não estreita o tipo de `value` a partir
  do retorno de uma função) é um `as` e não `any`, e é segura no fluxo atual — não
  configura regressão de tipagem, mas poderia ser evitada com uma variável
  intermediária tipada `string` atribuída após o `if`/checagem, se preferível.

- **Achado 3 — resolvido.**
  Os 4 rótulos do bloco "Estágio de Vida" ("Filhote", "Jovem", "Adulto", "Ancião",
  linhas 248-250) agora usam `<Label component="span" sx={{ margin: 0 }}>`, idêntico
  ao padrão usado em `CreatureSectionBlock` (linha 51-53) e ao restante da tela.

- **Achado 4 — resolvido.**
  `app-web/src/shared/components/Modals/ViewModal/index.tsx:76-83` — quando
  `window.open` retorna `null`, agora é disparado
  `showToast({ type: 'error', message: 'Não foi possível abrir a janela em destaque.
  Verifique se o navegador está bloqueando pop-ups.' })` (importado de
  `@/shared/util`) antes do `return`, dando feedback visual ao usuário no mesmo
  padrão de erro já usado no restante do app.

- **Regressões**: nenhuma encontrada. Imports de ambos os arquivos revisados
  continuam íntegros e utilizados (`isRichTextEmpty`, `showToast`, `Label` em
  `CreatureView`; `showToast` em `ViewModal`); nenhuma tipagem `any` introduzida;
  nenhuma quebra de padrão de estrutura/nomenclatura. A nova chave
  `richTextViewFrame` em `APP_INPUT_STYLES` segue o mesmo formato das demais
  variantes do arquivo.

**Resultado**: NÃO aprovado sem ressalvas — resta o achado 1 (tipografia Tiptap do
conteúdo somente-leitura), que foi alterado mas continua funcionalmente não
resolvido pelo motivo técnico descrito acima. Achados 2, 3 e 4 estão corretamente
corrigidos.

### Nova correção do achado 1 (pós re-revisão)

- Achado 1 (tipografia Tiptap não aplicada no HTML somente-leitura, seletores
  descendentes) — corrigido de fato em
  `app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`
  (`CreatureSectionBlock` e no bloco "Estágio de Vida"): separada a estrutura em
  dois elementos aninhados, como no `FormRichTextInput`. O `Box` externo mantém
  `sx={APP_INPUT_STYLES.richTextContent}` (sem `className`), e dentro dele agora
  há um `<div className="ProseMirror" dangerouslySetInnerHTML={{ __html: ... }} />`
  como filho — reproduzindo exatamente a relação de descendência esperada pelos
  seletores `& .ProseMirror h1/h2/h3/ul/ol` da variante `richTextContent`
  (`shared/constants/Styles/InputStyles/index.ts`), igual à estrutura já usada em
  `shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx:131-132`
  (`Box` externo com `sx`, elemento `.ProseMirror` interno como filho). A checagem
  de vazio com `isRichTextEmpty` (achado 2) foi preservada sem alterações.

### Re-revisão final

Revisado exclusivamente
`app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx` (nova
correção estrutural do achado 1), com leitura cruzada de
`shared/components/Inputs/FormInputs/FormRichTextInput/index.tsx` (referência de
estrutura) e `shared/constants/Styles/InputStyles/index.ts` (seletores de
`richTextContent`), além de confirmação pontual do achado 4 em
`shared/components/Modals/ViewModal/index.tsx` (arquivo não alterado nesta rodada).

1. **Achado 1 — CONFIRMADO RESOLVIDO.** Nos dois pontos onde o HTML rich text é
   renderizado — `CreatureSectionBlock` (linhas 55-66) e o bloco "Estágio de Vida"
   (linhas 253-266) — a estrutura agora é: `Box` externo com
   `sx={APP_INPUT_STYLES.richTextViewFrame}` (moldura) contendo, quando
   `!isRichTextEmpty(...)`, um `Box` intermediário com
   `sx={APP_INPUT_STYLES.richTextContent}` (sem `className`) e, dentro deste, um
   `<div className="ProseMirror" dangerouslySetInnerHTML={...} />` como filho direto.
   Essa é exatamente a mesma relação de aninhamento de
   `FormRichTextInput/index.tsx:131-132` (`Box sx={richTextContent}` externo >
   `EditorContent` interno, que o Tiptap renderiza como `<div class="ProseMirror">`).
   Como `.ProseMirror` agora é descendente real do elemento que recebe a classe
   `css-hash` gerada pelo `sx`, os seletores `& .ProseMirror h1/h2/h3/ul/ol` de
   `richTextContent` (`shared/constants/Styles/InputStyles/index.ts:99-127`) casam
   corretamente, e a tipografia do Tiptap é aplicada também no conteúdo
   somente-leitura. Confirmado nos dois locais do arquivo.

2. **Achado 2 — confirmado intacto.** `!isRichTextEmpty(value ?? undefined)` (linha
   56) e `!isRichTextEmpty(stage.value ?? undefined)` (linha 254) continuam em uso,
   com `isRichTextEmpty` importado de `@/shared/util` (linha 31), tratando `'<p></p>'`
   como vazio e exibindo `NOT_INFORMED` ("Não informado") nesse caso. Nenhuma
   alteração nessa lógica em relação à re-revisão anterior.

3. **Achado 3 — confirmado intacto.** Os 4 rótulos do bloco "Estágio de Vida"
   ("Filhote", "Jovem", "Adulto", "Ancião", linhas 249-251) continuam usando
   `<Label component="span" sx={{ margin: 0 }}>`, igual ao padrão usado em
   `CreatureSectionBlock` (linhas 51-53).

4. **Achado 4 — confirmado intacto.** `shared/components/Modals/ViewModal/index.tsx`
   não foi alterado nesta rodada; `handlePopOut` continua disparando
   `showToast({ type: 'error', message: 'Não foi possível abrir a janela em
   destaque...' })` quando `popupWindow` é `null` (linhas 76-84), antes do `return`.

5. **Regressões**: nenhuma encontrada em
   `CreatureView/index.tsx`. Todos os imports (`isRichTextEmpty`, `showToast`,
   `Label`, `Title`, `DefaultText`, ícones `react-icons/fi`, `APP_COLORS`,
   `APP_INPUT_STYLES`) continuam íntegros e utilizados; nenhuma tipagem `any`
   introduzida (a asserção `value as string`/`stage.value as string` dentro do ramo
   já validado como não-vazio por `isRichTextEmpty` é um `as`, não `any`, e é segura
   — mesma observação não bloqueante já registrada na re-revisão anterior); estrutura
   de componentes, nomenclatura e localização de arquivo permanecem de acordo com o
   padrão do projeto; a nova estrutura de dois elementos aninhados não introduziu
   nenhum `<div>`/wrapper supérfluo fora do necessário para reproduzir o seletor
   `.ProseMirror`.

**Resultado**: APROVADO sem ressalvas. Os quatro achados da revisão original estão
corrigidos e confirmados — incluindo o achado 1, cuja nova correção estrutural
(elementos `Box`/`div` aninhados, em vez de `className` e `sx` no mesmo nó) resolve
de fato o problema de seletor CSS descendente relatado na re-revisão anterior. Nenhum
achado pendente resta em
`app-web/src/app/(authorized)/criaturas/components/CreatureView/index.tsx`.
