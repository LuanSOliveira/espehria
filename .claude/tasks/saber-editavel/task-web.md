# Task Web: Saber editável + notas + ajustes visuais

## Contexto
Não há `spec.md` para esta demanda — as decisões já foram fechadas diretamente com
o usuário (reproduzidas na mensagem de disparo desta tarefa). O contrato de API é
normativo e está documentado em `.claude/tasks/saber-editavel/task-api.md`, seção
"Contrato de API (fonte de verdade para o planejamento web)" — este plano trata
nomes de campos e formatos de payload exatamente como descritos lá, sem inferir
variações.

Resumo do contrato usado como base:
- `editable: boolean` — opcional no input de `knowledges` das 5 entidades donas
  (ausência = `false`), obrigatório no response desses mesmos 5 módulos, e
  obrigatório em cada entrada de `saberes.*` no `SheetResponseDto`.
- Cada entrada de `saberes.race[]` / `saberes.biography[]` / `saberes.trainings[]`
  / `saberes.talents[]` / `saberes.characteristics[]` passa a ser exatamente
  `{ id, title, gradation: { id, name, level }, sourceName, editable, note }`,
  com `note: string | null`.
- Endpoint novo: `PUT /sheets/:id/knowledge-notes/:knowledgeId`, body `{ note: string }`
  (string vazia permitida, máx. 2000 caracteres), resposta = `SheetResponseDto`
  completo (mesmo shape de `PUT /sheets/:id/race` etc.).

A demanda tem 4 partes, todas cobertas nesta única etapa de `web-dev` (mesmo
agente implementa componentes e funcionalidade, sem dependência formal entre
etapas):
1. Checkbox "Editável?" no `KnowledgeAddModal`.
2. Nome da perícia em negrito + caixa alta (CSS) no `SheetSkillCard`.
3. Contraste do botão "ver bônus" (perícia e, por consistência, saber).
4. Card de Saber na ficha ganha modificador (bônus da graduação + Inteligência)
   e input de nota com autosave no blur, visível só quando `editable === true`.

## Etapas

### 1. web-dev

#### Componentes (novos/alterados)

- **Componente novo: `SheetKnowledgeCard`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgeCard/`).
  - Justificativa: **não existe** hoje um card dedicado de Saber na ficha —
    `SheetKnowledgesPanel` reaproveita diretamente o `KnowledgeCard` genérico
    (o mesmo usado nos formulários das 5 entidades donas), que só mostra
    título/graduação e não tem — nem deve ganhar — nenhuma noção de bônus,
    modificador ou nota (isso é específico do contexto da ficha). Extrair um
    card dedicado evita contaminar o `KnowledgeCard` genérico com
    responsabilidades que só fazem sentido na ficha, seguindo o mesmo
    precedente de `SheetSkillCard` (que também não reaproveita nenhum card
    genérico de perícia).
  - Props: `title: string`, `gradationName: string`, `sourceName: string`,
    `editable: boolean`, `note: string | null`, `total: number`,
    `onOpenDetail: () => void`, `onSaveNote: (note: string) => void`,
    `isSavingNote?: boolean` (desabilita o input enquanto o autosave daquela
    nota específica está em andamento — mesmo padrão já usado em
    `isSaving`/`variables?.adjustmentId` de `SheetAdjustedProficienciesSection`
    em `page.tsx`).
  - Layout: mesmo padrão visual de `SheetSkillCard` — `Box` com
    `APP_CONTAINER_STYLES.detailSectionBox`, coluna esquerda (`flex-1`) mantém
    exatamente o que já existe hoje (título, graduação, "Concedida por:
    {sourceName}" — hoje esse texto fica fora do card, em
    `SheetKnowledgesPanel`; ao extrair o card, mover esse texto para dentro da
    coluna esquerda do próprio `SheetKnowledgeCard`, mesmo texto/copy já usado).
    Coluna direita em `flex-col` alinhada à direita (`items-end`), com:
    - Linha 1: `IconButton` circular "ver bônus" (`FiHelpCircle`, mesmo ícone
      de `SheetSkillCard`) + círculo com o `total` (sinal explícito via
      `total > 0 ? '+n' : 'n'`, mesmo formato de `SheetSkillCard`), lado a lado,
      exatamente como em `SheetSkillCard`.
    - Linha 2 (abaixo da linha 1, ainda alinhada à direita): `DefaultTextInput`
      **sem `label`**, renderizado **apenas quando `editable === true`**. Valor
      inicial = `note ?? ''`. Aplicar `slotProps={{ htmlInput: { maxLength: 2000 } }}`
      (alinhado ao limite de 2000 caracteres do backend, evita erro 400 por
      excesso de caracteres).
  - Comportamento do input de nota: estado local (`useState(note ?? '')`) +
    `useRef` guardando o último valor salvo (inicializado com `note ?? ''`).
    `onBlur`: se o valor local for diferente do último valor salvo, chama
    `onSaveNote(valorLocal)` e atualiza o ref — evita chamadas repetidas ao
    perder foco sem alteração. Sincronizar estado local e ref via `useEffect`
    quando a prop `note` mudar externamente (ex.: após recompute de
    raça/biografia que pode alterar o snapshot de saberes) — mesmo cuidado que
    outros campos da ficha já têm com re-hidratação de estado local a partir do
    servidor.
  - **Não** exibir `editable` como texto/rótulo em nenhum lugar do card — ele só
    controla a visibilidade condicional do input.

- **Componente alterado/generalizado: `SheetSkillBonusDetailModal` →
  `SheetBonusDetailModal`**
  (renomear a pasta de
  `app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/`
  para `.../SheetBonusDetailModal/`).
  - Motivo: o modal de detalhamento de bônus (fontes do bônus + total) hoje só
    é usado por Perícias, mas a Parte 4 pede exatamente o mesmo tipo de modal
    para Saberes — reaproveitar em vez de duplicar.
  - Trocar a prop `skill: SheetSkillModifierResult | null` por uma prop
    genérica, ex.: `detail: SheetBonusDetail | null`, onde
    `SheetBonusDetail = { name: string; total: number; breakdown: { label: string; value: number }[] }`
    (pode ficar co-localizada no próprio arquivo do modal, ou exportada de um
    módulo pequeno compartilhado entre os dois hooks de modificador — critério
    do web-dev). O corpo do modal (título "Bônus de {name}", lista de
    `breakdown`, "Total: {total}") não muda.
  - Atualizar os dois usos existentes: `page.tsx` (fluxo de Perícias, que hoje
    importa `SheetSkillBonusDetailModal` e passa `skill={skillPendingBonusDetail}`)
    passa a importar `SheetBonusDetailModal` e passar `detail={...}`; e o novo
    fluxo de Saberes (Parte 4, ver Funcionalidade abaixo) usa a mesma instância
    genérica do componente (pode ser uma segunda instância do modal no JSX,
    com seu próprio estado de "item pendente", já que só um modal fica aberto
    por vez em cada fluxo).

- **Alteração em componente existente: `KnowledgeAddModal`**
  (`app-web/src/shared/components/KnowledgeAddModal/index.tsx`).
  - Adicionar `FormCheckboxInput` (já existe em
    `shared/components/Inputs/FormInputs/FormCheckboxInput`) com label
    "Editável?", registrado no campo `editable` do formulário — **desmarcado
    por padrão**.
  - `onSubmit`: incluir `editable: data.editable` no objeto passado a `onAdd`
    (hoje monta `{ id: uuidv4(), title, gradation }` — passa a incluir
    `editable`).
  - Ajustar `KnowledgeFormSchema`
    (`app-web/src/shared/formSchemas/KnowledgeFormSchema/index.ts`): adicionar
    `editable: z.boolean()` ao `knowledgeFormSchema` e `editable: false` a
    `knowledgeFormDefaultValues`.
  - `KnowledgeListField` (`app-web/src/shared/components/KnowledgeListField/`):
    nenhuma mudança estrutural necessária — já repassa o `IKnowledgeItem`
    completo entre `onAdd`/`onChange`; a validação de duplicidade por título
    (`normalizeTitle`) não é afetada pelo novo campo.
  - `KnowledgeCard` (`app-web/src/shared/components/KnowledgeCard/index.tsx`):
    **nenhuma alteração** — ele já não exibe `editable` hoje e não deve passar
    a exibir (requisito explícito da Parte 1). Confirmar apenas que nenhuma
    alteração futura o faça exibir esse campo.

#### Funcionalidade

**Tipos/interfaces a atualizar** (pré-requisito para tudo abaixo):
- `IKnowledgeItem` (`app-web/src/shared/interfaces/Entities/KnowledgeItem/index.ts`):
  adicionar `editable: boolean` (obrigatório — o modal sempre preenche, com
  `false` como padrão quando o usuário não marca o checkbox).
- `ISheetKnowledgeSnapshotEntry`
  (`app-web/src/shared/interfaces/Entities/Sheet/index.ts`): adicionar
  `editable: boolean` e `note: string | null`.

**Parte 1 — checkbox "Editável?" propagado nos 5 formulários donos**:
- Além do `KnowledgeAddModal` (ver Componentes acima), os 5 formulários que
  montam o payload de `knowledges` para a API precisam incluir `editable` no
  item enviado — cada um tem hoje sua própria interface local
  `KnowledgeInputPayload { title: string; gradation: string }` e seu próprio
  `knowledges.map((item) => ({ title: item.title, gradation: item.gradation.id }))`
  dentro de `buildPayload`:
  - `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
  - Em cada um: adicionar `editable?: boolean` à interface local
    `KnowledgeInputPayload` e `editable: item.editable` ao objeto retornado
    pelo `.map(...)`.
  - As telas `RaceView`, `BiographyView`, `TalentView`, `TrainingView`,
    `CharacteristicView` (que exibem `knowledges` em modo leitura via
    `KnowledgeCard`) não precisam de nenhuma alteração — `KnowledgeCard`
    continua não exibindo `editable`.
  - Integrações com API: `POST`/`PUT` de `/races`, `/biographies`, `/talents`,
    `/trainings`, `/characteristics` — mesmo método/path, `knowledges[].editable`
    passa a ser enviado e (nos GETs/responses usados para hidratar o modo
    edição) recebido.

**Parte 2 — nome da perícia em negrito/caixa alta**:
- `SheetSkillCard`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx`):
  o `<Label component="span">{name}</Label>` que exibe o nome da perícia ganha
  `sx={{ fontWeight: 700, textTransform: 'uppercase' }}` (ou equivalente) —
  puramente visual, **não alterar `name`/dado em si**, nem a lógica de
  `keyAttributeName`/`gradationName`/`total`.

**Parte 3 — contraste do botão "ver bônus"**:
- No mesmo `SheetSkillCard`, o `IconButton` "ver bônus" hoje usa
  `color: APP_COLORS.goldSoft` (`#f0d488`, quase mesma luminosidade do fundo
  `APP_CONTAINER_STYLES.detailSectionBox` → `APP_COLORS.parchmentLight`,
  causando o baixo contraste relatado). Trocar para `APP_COLORS.textBrownDark`
  — mesma cor já usada para ícones sobre fundo claro em outro ponto do app
  (`KnowledgeCard`, ícone de remover), preservando a borda `APP_COLORS.gold`
  como está.
- O novo botão "ver bônus" do `SheetKnowledgeCard` (Parte 4) deve nascer já
  usando `APP_COLORS.textBrownDark` (não copiar o valor antigo), garantindo
  consistência visual entre os dois cards desde o início.
- O círculo do modificador (fundo `APP_COLORS.wood`, texto `APP_COLORS.goldSoft`)
  **não muda** em nenhum dos dois cards — esse par já tem contraste adequado
  (texto claro sobre fundo escuro).

**Parte 4 — modificador + input de nota no card de Saber**:
- `SheetKnowledgesPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgesPanel/index.tsx`):
  parar de renderizar `KnowledgeCard` diretamente; passar a renderizar
  `SheetKnowledgeCard` (ver Componentes) para cada item, usando os dados
  calculados pelo novo hook abaixo. Manter o grid/empty-state (`Nenhum saber
  vinculado.`) como está.
- **Novo hook `useSheetKnowledgeModifiers`**
  (`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetKnowledgeModifiers/`),
  irmão de `useSheetSkillModifiers` (não generalizar o hook existente — a
  lógica de saber é mais simples e não compartilha a etapa de "achar a
  graduação vencedora entre proficiencias/proficienciasAjustadas": o saber já
  vem com sua própria `gradation` resolvida diretamente no snapshot,
  bastando somar o bônus dessa graduação; forçar as duas lógicas dentro de um
  único hook genérico tornaria a assinatura mais confusa sem ganho real).
  - Params: `entries: ISheetKnowledgeSnapshotEntry[]` (lista já achatada das 5
    categorias — reaproveitar/expor a mesma função `flattenKnowledgeSnapshot`
    já existente em `page.tsx`, movida para `data/index.ts` se ainda não
    estiver lá, para poder ser importada pelo hook também), `attributes:
    SheetSkillModifierAttribute[]` (tipo já exportado por
    `useSheetSkillModifiers`, reaproveitado sem duplicar), `gradations:
    IProficiencyGradation[]` (vindo de `useProficiencyGradationsQuery`, já
    carregado em `page.tsx`).
  - Constante fixa no próprio hook: `const KNOWLEDGE_KEY_ATTRIBUTE_NAME =
    'Inteligência'` — regra fechada, não configurável por item.
  - Cálculo por entrada: `attributeModifier` = `modifier` do item de
    `attributes` cujo `label` normalizado (trim + lowercase, mesmo padrão de
    `useSheetSkillModifiers`) bata com `KNOWLEDGE_KEY_ATTRIBUTE_NAME`
    normalizado (`?? 0` se não encontrado); `gradationBonus` =
    `gradations.find((g) => g.id === entry.gradation.id)?.bonus ?? 0` — **não**
    usar nenhum campo `bonus` embutido em `entry.gradation` (o snapshot da API
    só traz `{ id, name, level }`, sem `bonus`; o valor de bônus só existe na
    lista mestre `/proficiency-gradations`, mesmo padrão já usado por
    `useSheetSkillModifiers`). `total = attributeModifier + gradationBonus`.
  - Retorno: `SheetKnowledgeModifierResult[]`, um item por entrada, já
    incorporando os dados do próprio snapshot (mesmo espírito de
    `SheetSkillModifierResult`, que já embute dados do item de origem junto do
    cálculo): `{ id: entry.id, title: entry.title, gradationName:
    entry.gradation.name, sourceName: entry.sourceName, editable:
    entry.editable, note: entry.note, total, breakdown: [{ label:
    'Inteligência', value: attributeModifier }, { label: \`Graduação
    ${entry.gradation.name}\`, value: gradationBonus }] }` (`breakdown` reaproveita
    o tipo `SheetSkillModifierBreakdownEntry` já exportado por
    `useSheetSkillModifiers`).
- **Novo hook de mutation `useUpdateSheetKnowledgeNoteMutation`**
  (`app-web/src/hooks/Queries/EntityQueries/useUpdateSheetKnowledgeNoteMutation/`),
  irmão direto de `useResolveProficiencyAdjustmentMutation` (mesmo motivo: o
  `knowledgeId` faz parte da URL e varia a cada chamada, então não reaproveita
  `usePutEntity`). Params: `sheetId: string`, `invalidateQueryKeys?:
  QueryKey[]`, `onSuccess?: (data: ISheet, payload: { knowledgeId: string; note:
  string }) => void`, `onError?: (...)`. `mutationFn` chama `PUT
  /sheets/${sheetId}/knowledge-notes/${knowledgeId}` com body `{ note }`,
  retorna `ISheet` (mesmo tipo dos demais mutation hooks de ficha). Exportar
  em `hooks/Queries/EntityQueries/index.ts` (barrel) e reexportar por
  `hooks/Queries` como os demais.
- **Sobre `useFieldAutosave`: avaliado e descartado para este caso.** O hook
  existente implementa autosave por **debounce de valor** (dispara `delay` ms
  depois que o valor para de mudar, via `useEffect` observando `value`) — não
  é um autosave "no blur". O requisito fechado para a nota é explicitamente
  "autosave no blur, sem botão de salvar", então o `SheetKnowledgeCard` deve
  implementar o `onBlur` diretamente no `TextField` (ver Componentes acima:
  estado local + ref do último valor salvo), **sem** usar `useFieldAutosave`.
  Não reaproveitar esse hook aqui evita adaptá-lo para um comportamento que
  ele não foi desenhado para ter.
- **Em `page.tsx`**:
  - Chamar `useSheetKnowledgeModifiers` com `flattenKnowledgeSnapshot(saberes)`
    (função já existente no arquivo, mover para `data/index.ts` — ver acima),
    `attributes` (já computado) e `proficiencyGradations ?? []` (já
    carregado via `useProficiencyGradationsQuery`, reaproveitado sem nova
    chamada).
  - Instanciar `useUpdateSheetKnowledgeNoteMutation({ sheetId,
    invalidateQueryKeys: [['/sheets'], [\`/sheets/${sheetId}\`]], onSuccess:
    (data) => { setSaberes(data.saberes); showToast({ message: 'Nota do saber
    salva com sucesso.', type: 'success' }); }, onError: (mutationError) =>
    showToast({ message: mutationError.response?.data?.message ?? 'Não foi
    possível salvar a nota do saber.', type: 'error' }) })` — mesmo padrão de
    reidratação usado em `linkRaceMutation`/`unlinkBiographyMutation`/etc.
  - Novo estado local `knowledgePendingBonusDetail: SheetBonusDetail | null`
    (mesmo espírito de `skillPendingBonusDetail`), setado a partir do item de
    `useSheetKnowledgeModifiers` correspondente quando o usuário clica em "ver
    bônus" de um `SheetKnowledgeCard`; renderizar uma segunda instância de
    `SheetBonusDetailModal` para esse fluxo.
  - Passar para `SheetKnowledgesPanel`: a lista de
    `SheetKnowledgeModifierResult[]`, o callback de abrir detalhamento, e o
    callback `onSaveNote={(knowledgeId, note) =>
    updateKnowledgeNoteMutation.mutate({ knowledgeId, note })}` — propagado
    por `SheetKnowledgesPanel` até cada `SheetKnowledgeCard`. Usar o mesmo
    padrão de `isSaving` de `SheetAdjustedProficienciesSection`
    (`updateKnowledgeNoteMutation.isPending &&
    updateKnowledgeNoteMutation.variables?.knowledgeId === item.id`) para a
    prop `isSavingNote` de cada card.

**Ponto de atenção sinalizado (não é decisão de arquitetura, é lacuna
potencial de requisito)**: o contrato de API (409) valida que o saber é
`editable` no momento do `PUT /sheets/:id/knowledge-notes/:knowledgeId`, mas
não há tratamento de mensagem específica combinado com o usuário para esse
409 no frontend — a mensagem de erro padrão (`error.response?.data?.message`)
já cobre o caso, então nenhuma ação adicional é necessária a menos que o
usuário deseje um tratamento diferenciado.

- **Acesso Google**:
  - Ficha (`fichas/[id]`, Parte 4): **não se aplica** o padrão de ocultar
    criar/editar/excluir da skill `web-permissao-google-readonly`. A ficha é
    dado do próprio usuário — mesmo raciocínio já usado para os demais campos
    editáveis da ficha (nome, nível, campanha, vínculo de raça/biografia,
    ajuste de proficiência), todos com autosave/edição disponível
    independente de `provider`. O input de nota do saber fica visível para
    qualquer usuário com acesso à ficha (controle de posse já resolvido no
    backend via `findAccessibleById`), sem tratamento adicional de UI por
    `provider`.
  - Formulários das 5 entidades donas (Parte 1): **não muda** — esses
    formulários de criação/edição já seguem a regra padrão de
    ocultar/bloquear ações de gerenciamento para usuários `provider: 'google'`
    em funcionalidades anteriores; esta demanda só adiciona um campo dentro do
    formulário já existente, sem alterar quem pode abri-lo.

Status: concluído

Nota do web-dev: implementado exatamente como planejado, com uma ressalva de
ferramental — as ferramentas disponíveis nesta etapa (Read/Grep/Glob/Edit/
Write) não incluem exclusão de arquivo/pasta, então o "renomear a pasta"
`SheetSkillBonusDetailModal` → `SheetBonusDetailModal` foi feito criando o
componente generalizado na pasta nova e reduzindo a pasta antiga a um
re-export (`export * from '../SheetBonusDetailModal';`) para não quebrar
nenhuma referência remanescente. Nenhum código do app importa mais o caminho
antigo (confirmado via grep) — recomenda-se excluir fisicamente
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/`
em uma limpeza posterior com acesso a shell.

Componentes:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgeCard/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBonusDetailModal/index.tsx` (novo, generalizado a partir de `SheetSkillBonusDetailModal`)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/index.tsx` (reduzido a re-export, ver nota acima)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx` (nome em negrito/uppercase + contraste do botão "ver bônus")
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgesPanel/index.tsx` (passa a renderizar `SheetKnowledgeCard`)
- `app-web/src/shared/components/KnowledgeAddModal/index.tsx` (checkbox "Editável?")

Arquivos:
- `app-web/src/shared/interfaces/Entities/KnowledgeItem/index.ts` (`editable: boolean`)
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts` (`editable`/`note` em `ISheetKnowledgeSnapshotEntry`)
- `app-web/src/shared/formSchemas/KnowledgeFormSchema/index.ts` (`editable`)
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
- `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
  (`editable` no `KnowledgeInputPayload`/`buildPayload` dos 5 formulários)
- `app-web/src/app/(authorized)/fichas/[id]/data/index.ts` (`flattenKnowledgeSnapshot` movida para cá)
- `app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetKnowledgeModifiers/index.ts` (novo)
- `app-web/src/hooks/Queries/EntityQueries/useUpdateSheetKnowledgeNoteMutation/index.ts` (novo)
- `app-web/src/hooks/Queries/EntityQueries/index.ts` (barrel, novo hook reexportado)
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (wiring completo da Parte 4: modificador de saber, mutation de nota, dois modais de detalhamento de bônus)

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgeCard/index.tsx:107-115`**
  — o `aria-label` passado diretamente para `DefaultTextInput` (que envolve o
  `TextField` do MUI) não chega ao elemento `<input>` real. No MUI v7,
  `TextField` só repassa `slots`/`slotProps` ao slot `input`
  (`externalForwardedProps = { slots, slotProps }` em
  `node_modules/@mui/material/TextField/TextField.js`); qualquer outro prop
  "solto" (`...other`, onde cai `aria-label`) só é aplicado ao `RootSlot`
  (o `FormControl`/`div` externo), nunca ao `<input>` propriamente dito. Como
  este campo de nota é renderizado **sem** `label` visível (decisão explícita
  do plano), o resultado é um `<input>` sem nome acessível para leitores de
  tela — o `aria-label` fica "perdido" no `div` wrapper.
  - Trecho: `aria-label={\`Anotação do saber ${title}\`}` passado direto ao
    `DefaultTextInput`.
  - Sugestão: mover o `aria-label` para dentro de `slotProps.htmlInput`, ex.:
    `slotProps={{ htmlInput: { maxLength: 2000, 'aria-label': `Anotação do saber ${title}` } }}`,
    que é a forma correta de endereçar o `<input>` real nesse padrão de MUI
    `TextField`.
  - **Corrigido**: confirmado que `DefaultTextInput` não tem mecanismo próprio
    para atributos do input nativo além de repassar `slotProps` recebido via
    `...rest`/merge com o slot `input` (usado hoje só para o ícone via
    `startAdornment`) — não havia nada a reaproveitar além do próprio
    `slotProps`. `aria-label` movido para `slotProps.htmlInput` junto do
    `maxLength: 2000` existente, removido o `aria-label` solto na raiz do
    componente.

- **Pendência de limpeza sinalizada pelo `web-dev` (confirmada)**: a pasta
  `app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillBonusDetailModal/`
  ficou reduzida a um re-export morto
  (`export * from '../SheetBonusDetailModal';`). Confirmei via grep
  (`SheetSkillBonusDetailModal`) que nenhum arquivo do app-web importa mais
  esse caminho — nenhum consumidor remanescente. Fica registrado como
  pendência de limpeza manual (exclusão física da pasta) para quem tiver
  acesso a operações de shell/exclusão de arquivo, já que as ferramentas desta
  revisão (Read/Grep/Glob/Edit) também não permitem apagar arquivos.

Fora esses dois pontos, a implementação está de acordo com o planejado e com
os padrões do `CLAUDE.md`:
- `useSheetKnowledgeModifiers` calcula `total = attributeModifier + gradationBonus`
  corretamente: `attributeModifier` vem do atributo "Inteligência" (match
  normalizado trim+lowercase) em `attributes` já computado (sem recalcular), e
  `gradationBonus` vem de `gradations.find(g => g.id === entry.gradation.id)?.bonus`
  — nunca de um campo embutido em `entry.gradation` nem hardcoded; os valores
  0/3/5/7/9 só existem na resposta de `/proficiency-gradations`
  (`useProficiencyGradationsQuery`). `level` e `bonus` não são confundidos em
  nenhum ponto (campos distintos em `IProficiencyGradation`, e o hook só lê
  `bonus`).
- Autosave da nota implementado no `onBlur` (estado local + `useRef` do último
  valor salvo + `useEffect` de resincronização quando `note` muda
  externamente), sem debounce e sem `useFieldAutosave` — conforme decisão
  registrada na task. `PUT /sheets/:id/knowledge-notes/:knowledgeId` chamado
  com `{ note }` via `useUpdateSheetKnowledgeNoteMutation`, e `onSuccess`
  reidrata `saberes` a partir do `ISheet` retornado. Input só renderiza quando
  `editable === true`, valor inicial `note ?? ''`, `maxLength: 2000` aplicado.
- `editable` propagado corretamente: checkbox desmarcado por padrão no
  `KnowledgeAddModal`/`KnowledgeFormSchema`; incluído na interface local
  `KnowledgeInputPayload` e no `.map()` de `buildPayload` dos 5 formulários
  (`RaceCreateForm`, `BiographyCreateForm`, `TalentCreateForm`,
  `TrainingCreateForm`, `CharacteristicCreateForm`); `KnowledgeCard` não foi
  alterado e continua sem exibir `editable`.
- Nome da perícia em negrito/uppercase via `sx` no `SheetSkillCard` (dado
  `name` intocado); botão "ver bônus" trocado para `APP_COLORS.textBrownDark`
  em `SheetSkillCard` e já nascendo com essa cor em `SheetKnowledgeCard`
  (nenhuma cor hardcoded, ambas via `shared/constants/Colors`), consistente
  entre os dois cards.
- `SheetBonusDetailModal` generalizado (`detail: SheetBonusDetail | null`)
  funciona para os dois fluxos em `page.tsx` (perícia e saber), cada um com seu
  próprio estado de "item pendente" e sua própria instância do modal.
- Hooks genéricos de `hooks/Queries` reaproveitados onde cabia
  (`usePutEntity`/`useDeleteEntity`/`useGetEntityList`/`useGetEntityById`); o
  novo `useUpdateSheetKnowledgeNoteMutation` segue o mesmo padrão de
  `useResolveProficiencyAdjustmentMutation` (id na URL, não reaproveita
  `usePutEntity`), exportado corretamente pelo barrel
  `hooks/Queries/EntityQueries/index.ts` e reexportado por `hooks/Queries`.
  `flattenKnowledgeSnapshot` movida para `data/index.ts` sem quebrar nenhum
  consumidor (único uso remanescente é o próprio `page.tsx`, confirmado via
  grep).
- Ícones novos vêm de `react-icons/fi` (`FiHelpCircle`), sem
  `@mui/icons-material`/SVG customizado/emoji; `IconButton` "ver bônus" tem
  `aria-label` em pt-BR. Nenhum `any` introduzido; tipos de payload/DTO
  coerentes com os hooks/`IProficiencyGradation`. Textos em pt-BR. Alias
  `@/*` usado em todos os imports novos.
- Acesso Google: nenhuma alteração necessária/feita no fluxo de ficha (regra
  explícita da task) nem nos 5 formulários (campo novo dentro de fluxo já
  protegido).

Arquivos revisados: `useSheetKnowledgeModifiers/index.ts`,
`useUpdateSheetKnowledgeNoteMutation/index.ts`,
`hooks/Queries/EntityQueries/index.ts`, `SheetKnowledgeCard/index.tsx`,
`SheetKnowledgesPanel/index.tsx`, `SheetBonusDetailModal/index.tsx`,
`SheetSkillBonusDetailModal/index.tsx`, `SheetSkillCard/index.tsx`,
`KnowledgeAddModal/index.tsx`, `KnowledgeFormSchema/index.ts`,
`KnowledgeCard/index.tsx`, `KnowledgeListField/index.tsx`,
`KnowledgeItem/index.ts`, `Sheet/index.ts`, `data/index.ts`, `page.tsx`,
`RaceCreateForm/index.tsx`, `BiographyCreateForm/index.tsx`,
`TalentCreateForm/index.tsx`, `TrainingCreateForm/index.tsx`,
`CharacteristicCreateForm/index.tsx`.

Status: concluído