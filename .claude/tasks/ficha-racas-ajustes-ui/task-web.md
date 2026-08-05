# Task Web: Ajustes de UI na ficha de personagem e no formulário de raças

## Contexto
Não existe `spec.md` para esta demanda. O pedido do usuário já veio detalhado
diretamente e está reproduzido/decomposto abaixo, com os pontos de código
confirmados por investigação em `app-web/src/`. São 4 melhorias em
páginas/componentes já existentes — nenhuma feature nova, nenhuma alteração de
`app-api`.

## Etapas

### 1. web-dev
**Status:** concluído
**Componentes:** nenhum componente novo — ajustes em componentes já existentes:
`app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributeCard/index.tsx`
(Melhoria A), `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`
(Melhoria B.2), `app-web/src/app/(authorized)/fichas/[id]/components/SheetImprovementDefectCategoryAccordions/index.tsx`
(Melhoria C), `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
(Melhoria D — reordenação de JSX).
**Arquivos:** `app-web/src/shared/constants/Styles/InputStyles/index.ts`
(Melhoria B.1 — regra de cor/contraste para `.Mui-disabled` em
`APP_INPUT_STYLES.textField`).

#### Funcionalidade

Não há criação de páginas/rotas novas nem de endpoints novos. As 4 melhorias
abaixo alteram apenas componentes já existentes das rotas `/fichas/[id]`
(`APP_ROUTES.private.sheetDetails`) e `/racas` (`APP_ROUTES.private.races`).

---

**A. Melhoria 1 — Círculo do modificador em "Atributos" (visualização de ficha)**

- Arquivo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributeCard/index.tsx`
  (renderizado em grade pelo `app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributesPanel/index.tsx`).
- Estado atual confirmado: o círculo do modificador é um `Box` `position: absolute`
  com `width: 32, height: 32, borderRadius: '50%'`, `display: flex`,
  `alignItems: center`, `justifyContent: center`, contendo um `DefaultText`
  com `fontSize: '0.75rem'`. O valor do atributo acima é um `DefaultText` com
  `fontSize: '1.5rem', fontWeight: 700`.
- Ajustes a fazer:
  - Aumentar o tamanho do círculo (`width`/`height` do `Box`, mantendo
    `borderRadius: '50%'`, `border` e `backgroundColor` atuais) — ex.: de 32px
    para algo na faixa de 42–48px, ajustando também `right`/`bottom` do
    posicionamento absoluto se necessário para o círculo maior continuar bem
    encaixado no canto inferior direito do card.
  - Corrigir a centralização vertical do texto dentro do círculo: o `Box` já
    usa flexbox (`alignItems`/`justifyContent: center`), mas o `line-height`
    padrão do `DefaultText` (`Typography` sem `lineHeight` customizado, ver
    `APP_TEXT_STYLES.default` em `shared/constants/Styles/TextStyles`) deixa o
    glyph visualmente descentralizado dentro da caixa de texto. Definir
    explicitamente `lineHeight: 1` (ou equivalente) no `sx` do `DefaultText`
    do modificador para o texto ficar de fato centralizado verticalmente.
  - Aumentar o `fontSize` do texto do modificador para ficar **um pouco maior
    que o `fontSize` do valor do atributo** — este é o requisito literal do
    pedido do usuário ("O texto do modificador deve ficar um pouco maior que o
    texto do valor do atributo"). Hoje é o oposto (modificador em `0.75rem`,
    valor em `1.5rem`), então este é o ponto de maior atenção da melhoria:
    o `fontSize` do modificador deve passar a ser levemente **superior** ao
    `fontSize` do valor do atributo (ex.: se o valor permanecer em `1.5rem`,
    o modificador deve ficar em algo como `1.6rem`–`1.75rem`). Pode-se manter
    `fontWeight: 700` no modificador para reforçar a diferenciação visual
    pedida ("para diferenciar visualmente"). Não alterar a semântica dos
    dados (`value`/`modifier` continuam vindo de `page.tsx`), só a
    apresentação.
- Nenhum componente novo é necessário — só ajuste de `sx` em componente
  existente.

---

**B. Melhoria 2 — Modal "Vincular Biografia" (visualização de ficha)**

- Arquivo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`.
- Confirmado: o modal **não** usa `react-hook-form`/`zod` — é um componente
  controlado por `useState` local (`biography`, `selectedImprovementKey`,
  `freePropertyId` etc.), com submit feito via `handleConfirm` chamando
  `onConfirm(payload)` (que por sua vez dispara `linkBiographyMutation.mutate`
  em `page.tsx`, `PUT /sheets/:id/biography`). Não existe
  `shared/formSchemas/` para este modal.

**B.1 — Contraste do texto dos inputs "Tipo" e "Valor" (desabilitados)**

- Os campos afetados (linhas ~298–310 do arquivo) são dois `DefaultTextInput`
  (`shared/components/Inputs/DefaultInputs/DefaultTextInput`) com `disabled`,
  usados só na seção "Escolha uma melhoria de atributo livre" (`Tipo` fixo em
  `"Atributo"`, `Valor` fixo em `2`).
- Causa raiz confirmada: `DefaultTextInput` usa o estilo compartilhado
  `APP_INPUT_STYLES.textField` (`app-web/src/shared/constants/Styles/InputStyles/index.ts`),
  que já define `color: APP_COLORS.inputText` para `.MuiOutlinedInput-input`
  em estado normal (bom contraste sobre o fundo escuro
  `APP_COLORS.inputBg`/`inputBgDark`), mas **não define nenhuma cor/opacidade
  para o estado `.Mui-disabled`**. Sem essa regra, o MUI aplica a cor padrão
  de tema (`theme.palette.text.disabled`, um preto semitransparente — ver
  `app-web/src/providers/mui-theme-provider.tsx`, que usa `createTheme()` sem
  customização de paleta), que fica quase ilegível sobre o fundo escuro do
  input. Este componente é usado em ~35 arquivos do projeto, mas hoje `disabled`
  só é passado nestes dois inputs deste modal — ainda assim, a correção deve
  ser feita no estilo compartilhado (`APP_INPUT_STYLES.textField`), e não com
  um `sx` local nos dois inputs, para seguir a convenção do projeto de
  centralizar estilo em `shared/constants/Styles/` e já cobrir qualquer
  outro `DefaultTextInput`/`FormTextInput` desabilitado no futuro.
- Ajuste a fazer em `APP_INPUT_STYLES.textField`:
  - Adicionar uma regra explícita de cor para o estado desabilitado, algo como
    `'& .MuiOutlinedInput-input.Mui-disabled': { color: APP_COLORS.inputText, WebkitTextFillColor: APP_COLORS.inputText, opacity: 0.7 }` —
    o `WebkitTextFillColor` é necessário porque o MUI usa essa propriedade
    (não só `color`) para o texto do input desabilitado em navegadores
    baseados em WebKit/Blink. O valor exato de opacidade/tom fica a critério
    do `web-dev`, desde que garanta contraste adequado sobre
    `APP_COLORS.inputBg`/`inputBgDark` (ex.: manter `APP_COLORS.inputText`
    ou uma variação levemente mais escurecida dele, mas nunca a cor padrão de
    `text.disabled` do MUI).
  - Confirmar que a cor do estado ativo/normal (`'& .MuiOutlinedInput-input'`,
    já `APP_COLORS.inputText`) permanece legível e é reafirmada/mantida
    consistente após a mudança (o pedido menciona explicitamente garantir
    legibilidade "tanto do estado desabilitado quanto do estado ativo").
  - Sobre "respeitar tema claro/escuro do projeto": investigação confirmada —
    hoje `APP_COLORS`/`APP_INPUT_STYLES` são valores fixos (não variam com o
    toggle `useThemeStore`/classe `dark` em `documentElement`; ver
    `app-web/src/app/globals.css`, onde só `--background`/`--foreground` têm
    variação, e mesmo assim via `prefers-color-scheme`, não via classe
    `.dark`). Ou seja, os inputs do sistema usam hoje um único visual
    "pergaminho/madeira" fixo, independente do tema claro/escuro do app. O
    `web-dev` deve implementar a correção de contraste sobre esse único
    background real hoje existente; **não** deve introduzir lógica condicional
    de tema para este ajuste, a menos que, durante a implementação, encontre
    evidência de que `DefaultTextInput` já varia de fato com o tema (o que a
    investigação atual não encontrou) — nesse caso, sinalizar ao revisor antes
    de prosseguir.

**B.2 — Nova regra de validação no submit (bloquear propriedades iguais)**

- Regra pedida: se a `propriedade` (atributo) escolhida em "Escolha uma das
  melhorias de atributos da biografia" for igual à `propriedade` escolhida em
  "Escolha uma melhoria de atributo livre", o submit deve ser bloqueado e um
  toast de erro em pt-BR deve ser exibido. A biografia só deve ser vinculada
  quando as duas propriedades forem diferentes.
- Onde comparar: no estado já existente do componente —
  `selectedImprovement` (item derivado de `attributeImprovements.find(...)`
  a partir de `selectedImprovementKey`, tem `selectedImprovement.property.id`)
  vs. `freePropertyId` (string, id da propriedade livre selecionada no
  `DefaultAutocompleteInput` "Propriedade"). A comparação é
  `selectedImprovement.property.id === freePropertyId`.
- Onde implementar: **dentro do handler `handleConfirm`** deste mesmo
  componente (não em `shared/formSchemas/`, já que o modal não usa
  `react-hook-form`/`zod` — não introduzir esse padrão só para esta validação
  pontual, para não divergir da abordagem já usada no resto do arquivo).
  Adicionar a checagem logo após a guarda existente
  (`if (!biography || !selectedImprovement || !freePropertyId) return;`) e
  antes de chamar `onConfirm(...)`:
  - Se `selectedImprovement.property.id === freePropertyId`, chamar
    `showToast({ message: '<mensagem pt-BR>', type: 'error' })` (mesmo padrão
    de `showToast` já usado em `page.tsx`/`RaceCreateForm`, import de
    `@/shared/util`) e `return` sem chamar `onConfirm`.
  - Mensagem sugerida (pt-BR): `"A propriedade escolhida na melhoria da biografia não pode ser igual à propriedade da melhoria de atributo livre. Selecione propriedades diferentes."`
    O texto exato pode ser ajustado pelo `web-dev`, mas deve deixar claro que
    as duas propriedades não podem coincidir.
  - Importante: **não** desabilitar silenciosamente o botão "Adicionar
    Biografia" por causa dessa regra (`isConfirmEnabled` continua controlando
    apenas os campos obrigatórios já existentes) — o pedido é explícito que o
    bloqueio deve acontecer no submit, com alerta/toast, e não apenas com o
    botão inativo sem explicação.
  - Não é necessário validar esse cenário em nenhum outro lugar (ex.:
    `page.tsx`/backend) — a regra é de UI deste modal específico, sobre dois
    valores que só existem juntos neste formulário.

---

**C. Melhoria 3 — Expandir/recolher todos os Accordions (abas Melhorias/Defeitos)**

- Arquivo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetImprovementDefectCategoryAccordions/index.tsx`,
  usado duas vezes em `app-web/src/app/(authorized)/fichas/[id]/page.tsx`
  (uma instância para a aba "Melhorias" com `items={melhorias}`, outra para
  "Defeitos" com `items={defeitos}` — cada instância deve controlar seu
  próprio estado de expansão, independente uma da outra).
- Estado atual confirmado: o componente renderiza um `Accordion` do MUI por
  categoria de `SHEET_IMPROVEMENT_DEFECT_CATEGORIES` (5 categorias: Raça,
  Biografia, Treinamentos, Talentos, Características — ver
  `app-web/src/app/(authorized)/fichas/[id]/data/index.ts`), hoje **não
  controlado** (sem prop `expanded`), ou seja, cada `Accordion` gerencia seu
  próprio estado interno e começa recolhido.
- Ajuste a fazer:
  - Converter os `Accordion` para controlados: manter no próprio componente
    (`useState`) o conjunto de categorias expandidas (ex.:
    `Set<SheetImprovementDefectCategoryKey>` ou
    `Record<SheetImprovementDefectCategoryKey, boolean>`), passar
    `expanded={expandedKeys.has(category.key)}` e `onChange={(_, isExpanded) => ...}`
    para cada `Accordion`, atualizando o estado ao expandir/recolher
    manualmente um item individual (comportamento atual por clique deve
    continuar funcionando).
  - Adicionar, no topo da listagem (acima do primeiro `Accordion`), duas
    ações: "Expandir todos" e "Recolher todos". Usar `SecondaryButton`
    (`shared/components/Buttons`) com `sx={{ width: 'auto', padding: '10px 20px' }}`
    (mesmo padrão já usado para outras ações secundárias na página, ex. botão
    "Voltar" em `page.tsx`), lado a lado (`flex gap`). "Expandir todos" marca
    todas as 5 chaves de `SHEET_IMPROVEMENT_DEFECT_CATEGORIES` como
    expandidas; "Recolher todos" limpa o conjunto.
  - Não é necessário criar um novo componente reutilizável para os botões —
    são específicos deste componente e simples o suficiente para usar
    `SecondaryButton` diretamente.
  - Manter o restante do componente (cabeçalho de cada `Accordion` com
    `AccordionSummary`/ícone `FiChevronDown`, corpo com `ImprovementDefectCard`
    e mensagem de vazio) sem alterações de layout além do necessário para
    acomodar os dois botões novos.

---

**D. Melhoria 4 — Reordenar "Melhorias"/"Defeitos" antes de "Talentos" (formulário de Raças)**

- Arquivo: `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`.
- Estado atual confirmado (linhas 308–328): a ordem hoje é
  `<RaceTalentsListField ... />` seguido do `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">`
  contendo `<ImprovementDefectListField label="Melhorias" .../>` e
  `<ImprovementDefectListField label="Defeitos" .../>`.
- Ajuste: apenas mover o bloco `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">...</div>`
  (Melhorias + Defeitos) para **antes** de `<RaceTalentsListField value={talents} onChange={setTalents} />`,
  mantendo ambos os blocos exatamente como estão internamente (mesmas props,
  mesma lógica, mesmo layout em grid de 2 colunas) — é puramente uma troca de
  posição no JSX, sem qualquer mudança de comportamento, validação ou payload
  (`buildPayload` já usa `improvements`/`flaws`/`talents` por nome, não por
  ordem de declaração no JSX).
- Nenhum componente novo é necessário.

---

#### Componentes
Nenhum componente novo é necessário nas 4 melhorias. Todos os elementos
usados (`SecondaryButton`, `DefaultTextInput`, `DefaultAutocompleteInput`,
`Accordion`/`AccordionSummary`/`AccordionDetails` do MUI,
`ImprovementDefectListField`, `RaceTalentsListField`) já existem em
`shared/components/` ou nos próprios diretórios de `fichas`/`racas`. As
mudanças são: ajustes de `sx`/estilo em componentes existentes (A, B.1, C),
uma reordenação de JSX (D) e uma regra de validação nova dentro de um handler
já existente (B.2).

#### Integrações com API
Nenhum endpoint novo e nenhuma mudança de contrato com o `app-api`. Os
endpoints já usados continuam os mesmos: `GET/PUT /sheets/:id`,
`PUT/DELETE /sheets/:id/race`, `PUT/DELETE /sheets/:id/biography`,
`GET /biographies`, `GET /biographies/:id` (para o modal de biografia),
`GET/POST/PUT /races` (para o formulário de raças). Nenhuma dessas chamadas
muda de payload por conta desta demanda — a Melhoria 2.b é uma validação
puramente client-side que apenas impede a chamada de `onConfirm`/mutation
quando as duas propriedades coincidem.

#### Formulário/validação
Único ponto com regra de validação nova: modal `SheetBiographyAssignModal`
(Melhoria 2.b, detalhado acima) — bloquear submit e exibir toast de erro em
pt-BR quando `selectedImprovement.property.id === freePropertyId`. Implementar
no handler `handleConfirm` do próprio componente (não em
`shared/formSchemas/`, pois o modal não usa `react-hook-form`/`zod`). Nenhum
campo novo é adicionado ao formulário; nenhum outro formulário do escopo
(`RaceCreateForm`) tem mudança de campos/validação — a Melhoria 4 é só
reordenação visual.

#### Acesso Google
Não aplicável a nenhuma das 4 melhorias — nenhuma envolve criação de
listagem nova nem adiciona/remove ações de criar/editar/excluir. São ajustes
de estilo (A, B.1, C), uma reordenação de campos já existentes em um form que
já respeita as regras de acesso vigentes (D), e uma validação de submit em um
modal de ação que já existe hoje para todos os usuários com acesso à ficha
(B.2). O comportamento de ocultar ações para `provider: 'google'` já
implementado nessas telas permanece inalterado por esta demanda.

### 2. web-dev-codereviewer
**Status:** Concluído
- Revisar tudo acima, com atenção especial a:
  - Melhoria 1: círculo do modificador maior, texto verticalmente centralizado
    de fato (não só via flexbox, mas conferindo `line-height`), e `fontSize`
    do modificador **maior** que o do valor do atributo (checar se a
    implementação não inverteu/manteve os tamanhos por engano, já que é o
    oposto do estado atual do código).
  - Melhoria 2.a: cor do texto dos inputs desabilitados (`Tipo`/`Valor`) com
    contraste adequado sobre o fundo escuro do input, cobrindo tanto `color`
    quanto `WebkitTextFillColor` no seletor `.Mui-disabled`; cor do estado
    ativo permanece legível; mudança feita no estilo compartilhado
    (`APP_INPUT_STYLES.textField`) sem quebrar nenhum outro consumidor de
    `DefaultTextInput`/`FormTextInput` no restante do app.
  - Melhoria 2.b (atenção especial): a comparação de propriedades
    (`selectedImprovement.property.id` vs. `freePropertyId`) bloqueia
    corretamente o submit e exibe toast de erro em pt-BR antes de qualquer
    chamada a `onConfirm`/mutation; biografia só é de fato vinculada quando as
    duas propriedades são diferentes; nenhuma regressão no fluxo normal
    (propriedades diferentes continuam confirmando normalmente, incluindo o
    fluxo de edição via `initialValue`).
  - Melhoria 3: os dois `Accordion` (aba Melhorias e aba Defeitos) têm estado
    de expansão independente; "Expandir todos"/"Recolher todos" afetam as 5
    categorias corretamente; clique manual em um `Accordion` individual
    continua funcionando após a conversão para componente controlado.
  - Melhoria 4: ordem final é Melhorias/Defeitos antes de Talentos, sem
    nenhuma mudança de comportamento/payload em `RaceCreateForm`
    (`buildPayload` continua correto, `characteristics`/`talents`/
    `improvements`/`flaws` inalterados).

## Revisão

Etapa "1. web-dev" está marcada como "Status: concluído" — revisão realizada
sobre o trabalho como entregue, lendo por completo os 5 arquivos listados nos
campos "Componentes"/"Arquivos" da etapa 1.

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetAttributeCard/index.tsx`
  (Melhoria A) — círculo aumentado de 32px para 44px (dentro da faixa
  42–48px sugerida), mantendo `borderRadius: '50%'`, `border` e
  `backgroundColor`; `right`/`bottom` ajustados para 8px para o círculo maior
  continuar encaixado no card; `DefaultText` do modificador tem
  `lineHeight: 1` explícito no `sx` (resolve a descentralização vertical do
  glyph); `fontSize` do modificador é `1.7rem` (com `fontWeight: 700`),
  corretamente maior que o `fontSize: '1.5rem'` do valor do atributo — não
  houve inversão/manutenção acidental dos tamanhos antigos. Semântica de
  `value`/`modifier` inalterada, só apresentação.
- `app-web/src/shared/constants/Styles/InputStyles/index.ts` (Melhoria B.1) —
  regra nova `'& .MuiOutlinedInput-input.Mui-disabled'` adicionada dentro de
  `APP_INPUT_STYLES.textField`, cobrindo tanto `color: APP_COLORS.inputText`
  quanto `WebkitTextFillColor: APP_COLORS.inputText` (com `opacity: 0.7` para
  diferenciar visualmente do estado ativo), garantindo contraste adequado
  sobre `APP_COLORS.inputBg`/`inputBgDark`. A regra do estado ativo
  (`'& .MuiOutlinedInput-input'`, `color: APP_COLORS.inputText`) permanece
  intocada logo acima, então continua legível. Mudança feita no estilo
  compartilhado (não em `sx` local dos dois inputs do modal), sem lógica
  condicional de tema introduzida — consistente com a investigação da task de
  que `APP_INPUT_STYLES` não varia hoje com tema claro/escuro. É aditiva
  (novo seletor mais específico `.Mui-disabled` não conflita com o seletor
  geral existente), não há indício de quebra para os demais ~35 consumidores
  de `DefaultTextInput`/`FormTextInput`, já que nenhum deles passa `disabled`
  hoje além dos dois inputs deste modal.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBiographyAssignModal/index.tsx`
  (Melhoria B.2) — checagem `selectedImprovement.property.id === freePropertyId`
  implementada dentro de `handleConfirm`, logo após a guarda existente
  (`if (!biography || !selectedImprovement || !freePropertyId) return;`) e
  antes de `onConfirm(...)`; dispara `showToast({ message: '...', type: 'error' })`
  com mensagem clara em pt-BR e faz `return` sem chamar `onConfirm`,
  bloqueando efetivamente o vínculo da biografia quando as propriedades
  coincidem. `isConfirmEnabled` não foi alterado (continua controlando só os
  campos obrigatórios), respeitando a exigência de que o bloqueio aconteça no
  submit com alerta, e não apenas via botão desabilitado. Fluxo normal
  (propriedades diferentes) e fluxo de edição via `initialValue` não sofrem
  regressão — a nova checagem só intercepta o caso de igualdade. Validação
  implementada no próprio componente, sem introduzir `react-hook-form`/`zod`
  para este caso pontual, como pedido.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetImprovementDefectCategoryAccordions/index.tsx`
  (Melhoria C) — `Accordion` convertido para controlado via
  `expandedKeys: Set<SheetImprovementDefectCategoryKey>` em `useState`, com
  `expanded={expandedKeys.has(category.key)}` e
  `onChange={handleAccordionChange(category.key)}` atualizando o `Set`
  imutavelmente (add/delete) por clique manual — comportamento individual
  preservado. Botões "Expandir todos"/"Recolher todos" usam `SecondaryButton`
  com `sx={{ width: 'auto', padding: '10px 20px' }}`, lado a lado via
  `flex gap-3`, acima do primeiro `Accordion`; "Expandir todos" popula o `Set`
  com as 5 chaves de `SHEET_IMPROVEMENT_DEFECT_CATEGORIES` e "Recolher todos"
  limpa o `Set`. Como o componente é usado duas vezes em
  `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (linhas 533 e 537, uma
  para `items={melhorias}` e outra para `items={defeitos}`), cada instância
  possui seu próprio `useState` local, garantindo estado de expansão
  independente entre as abas Melhorias e Defeitos, conforme exigido. Restante
  do layout (cabeçalho com `AccordionSummary`/`FiChevronDown`, corpo com
  `ImprovementDefectCard` e mensagem de vazio) inalterado.
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
  (Melhoria D) — o bloco `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">`
  com `ImprovementDefectListField` ("Melhorias"/"Defeitos") agora precede
  `<RaceTalentsListField value={talents} onChange={setTalents} />` no JSX,
  puramente reordenado; props, lógica interna e layout de cada bloco
  permanecem exatamente como estavam. `buildPayload` continua referenciando
  `characteristics`/`talents`/`improvements`/`flaws` por nome (não por ordem
  de declaração no JSX), então não há mudança de payload/comportamento.