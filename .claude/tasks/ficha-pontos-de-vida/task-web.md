# Task Web: Pontos de Vida (Raça e Ficha)

## Contexto
Ver `.claude/tasks/ficha-pontos-de-vida/spec.md` (seção "Escopo confirmado") — fonte
da verdade normativa para este plano. As respostas às perguntas já fechadas ali não
são reabertas aqui.

Investigação de código já feita (não reabrir):

- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts` — schema zod da raça, hoje
  sem nenhum campo numérico.
- `app-web/src/shared/formSchemas/TalentFormSchema/index.ts` (campo `level`) e
  `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
  (uso de `FormTextInput` com `type="number"`, `slotProps={{ htmlInput: { min: 1,
  step: 1, inputMode: 'numeric' } }}`) — este é o padrão já estabelecido no projeto
  para campo numérico inteiro obrigatório em formulário `react-hook-form`/zod: o
  campo é tipado como `z.string()` no schema (`.min(1, ...)`, `.refine(/^\d+$/...)`,
  `.refine(Number(value) >= 1, ...)`), convertido para `Number(data.campo)` só na
  montagem do payload de envio. Não existe `FormNumberInput` dedicado em
  `shared/components/Inputs/` — não é necessário criar um, o padrão acima já resolve
  o caso de `hitPoints` da raça.
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx` — grid de
  4 colunas do topo (`name`, `categoryId`, `referenceImageUrl`, `tagIds`), seguido de
  um `<div className="w-full">` com `FormRichTextInput` de "Descrição" (linhas
  324-332), seguido de `EntityReferenceListField` ("Características", linha 334). O
  `reset(...)` do `useEffect` de hidratação em modo edição (linhas 139-146) e o
  `raceFormDefaultValues` do schema precisam incluir o novo campo.
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx` — `RaceSectionBox`
  (helper local `label/icon/value`, usa `RichTextViewer` internamente) já usado para
  "Descrição" dentro do wrapper `<div className="flex flex-col gap-4 sm:flex-row">`
  (linhas 215-221). `RichTextViewer` aceita `value?: string | null` e renderiza texto
  puro normalmente (não precisa ser HTML rico) — basta passar `String(race.hitPoints)`
  para reaproveitar o mesmo helper sem alterações, sem `emptyLabel` relevante já que
  `hitPoints` é sempre obrigatório/presente.
- `app-web/src/shared/interfaces/Entities/Race/index.ts` — `IRace` (usado por
  `RaceView`/`RaceCreateForm` via `GET /races/:id`) precisa de `hitPoints: number`.
  `IRaceListItem` (usado hoje tanto para as opções do dropdown de raça da ficha
  quanto, incorretamente, como tipo de `ISheet.race`) é um subconjunto mais leve
  (`id`, `referenceImageUrl`, `name`, `category`, `tags`) — **não deve ganhar
  `hitPoints`**, porque corresponde de fato ao DTO mais leve retornado por
  `GET /races` (lista), que continua sem esse campo.
- `app-api/src/modules/sheets/dto/sheet-response.dto.ts` (linha 119) — confirmado por
  leitura direta: `dto.race = sheet.race ? RaceResponseDto.fromEntity(sheet.race) :
  null`, ou seja, `ISheet.race` (tanto no `GET /sheets/:id` quanto nas respostas de
  `PUT/DELETE /sheets/:id/race`) usa o DTO **completo** da raça (o mesmo de
  `GET /races/:id`), não o DTO leve da listagem — já incluirá `hitPoints` assim que a
  Parte 1 for implementada no backend. **Resolução da ambiguidade sinalizada no
  spec:** criar uma interface própria para esse shape mais rico (`ISheetRace`, ver
  Funcionalidade) em vez de adicionar `hitPoints` a `IRaceListItem` — evita around
  fingir que o dropdown de troca de raça da ficha (que usa o DTO leve de
  `GET /races`, sem `hitPoints`) tem esse campo.
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — `race` (estado local,
  `IRaceListItem | null`) é hidratado de `sheet.race` (linha 185) e também
  atualizado a partir da resposta de `linkRaceMutation`/`unlinkRaceMutation`
  (`setRace(data.race ?? null)`, linhas 436/458) — ambas usam `ISheet` como tipo de
  resposta, então `data.race` já será do shape rico (`ISheetRace`) quando o tipo for
  ajustado; nenhuma mudança é necessária nesses dois `setRace(...)`. Já existem os
  padrões de referência a replicar 1:1 para o novo quadro: `ARMOR_CLASS_BASE_VALUE`
  (linha 86) + `armorClassAttributeModifier`/`armorClassTotal`/`armorClassBreakdown`
  (linhas 304-308) para o cálculo "base + bônus"; `updateLevelMutation` +
  `useFieldAutosave` sobre `level` (linhas 363-374, 596-600) para persistência
  debounced de campo simples via `PUT /sheets/:id`; o grid
  `grid grid-cols-1 gap-6 lg:grid-cols-2` de Atributos + (Classe de Armadura +
  Salvamentos) (linhas 751-776) — o novo quadro entra **acima** deste grid, dentro do
  mesmo `<div className="flex flex-col gap-6">` da aba Estatísticas; montagem dos
  `SheetBonusDetailModal` (linhas 851-877), incluindo o de Classe de Armadura
  (863-871), como modelo direto para o modal de "Pontos de Vida Máximo".
- `.../fichas/[id]/components/SheetArmorClassPanel/index.tsx` — estrutura de quadro
  (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader` com ícone +
  `Label`) + corpo com `IconButton`/`Tooltip` (`FiHelpCircle`, "Ver detalhamento do
  bônus") abrindo o modal de detalhamento — modelo direto para o novo quadro.
- `.../fichas/[id]/components/SheetLevelField/index.tsx` — padrão de input numérico
  local controlado (`TextField` `variant="standard"` `type="number"`), mas **não
  serve para copiar literalmente**: ele nunca fica vazio e nunca aceita negativo
  (`rawValue === '' → return` sem chamar `onChange`; guarda `parsedValue < 1`). Os
  campos novos precisam do oposto nos dois pontos (vazio é um estado válido que deve
  chamar `onChange(null)`; negativo é permitido). Ponto de atenção de implementação:
  como o `TextField` é controlado pelo valor numérico vindo do componente pai, um
  guard que simplesmente "não propaga" (`return` sem `onChange`) faz o campo
  "esnapar de volta" ao valor anterior a cada keystroke inválida — isso quebra a
  digitação de um sinal de `-` isolado (estado intermediário inválido antes do
  primeiro dígito), pois o valor controlado nunca chega a refletir o `-` sozinho. Os
  dois inputs novos precisam manter um buffer de string local (`useState<string>`,
  sincronizado a partir do valor numérico do pai apenas quando ele mudar
  externamente) e só chamar o `onChange` do pai quando a string for `''` (→ `null`)
  ou corresponder a um inteiro completo (`/^-?\d+$/`) — estados intermediários como
  `'-'` sozinho ficam só no buffer local, sem notificar o pai, permitindo o usuário
  continuar digitando.
- `.../fichas/[id]/components/SheetBonusDetailModal/index.tsx` — `SheetBonusDetail
  { name, total, breakdown: { label, value }[] }`; título do modal é `` `Bônus de
  ${detail?.name}` ``; cada linha do breakdown renderiza `` `${sinal}${valor}
  ${label}` `` — para "Pontos de Vida Máximo", `name: 'Pontos de Vida Máximo'`
  produz o título "Bônus de Pontos de Vida Máximo" (consistente com o exemplo do
  spec, que já contempla esse título composto) e o `label` da raça deve ser
  **apenas o nome da raça** (`race.name`), sem prefixo.
- `.../fichas/[id]/components/SheetModifierCircle/index.tsx` — círculo de valor
  único (44x44); não serve diretamente para a fração "atual/máximo" do novo quadro
  (não é um valor único), mas o padrão visual geral (texto grande, cor
  `APP_COLORS.goldSoft`, `fontWeight: 700`) deve inspirar a peça central do novo
  quadro.
- `hooks/Queries` (`usePutEntity`) — reaproveitado sem alteração, mesmo padrão já
  usado para `level`/`campaignId`/`armorClassKeyAttributeId` (mutation estreita por
  campo, `invalidateQueryKeys: [['/sheets'], [\`/sheets/${sheetId}\`]]`, `onError`
  com toast pt-BR).

Status: pendente

## Etapas

### 1. web-dev
**Status:** concluído

#### Componentes

- Componente: `SheetHitPointsPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx`,
  novo)
  - Props: `{ currentValue: number | null; onCurrentChange: (value: number | null)
    => void; temporaryValue: number | null; onTemporaryChange: (value: number |
    null) => void; maxValue: number; onOpenDetail: () => void }`.
  - Comportamento esperado: mesmo padrão de quadro dos demais painéis da aba
    (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`, título
    "Pontos de Vida", ícone `react-icons/fi` — sugestão não vinculante: `FiHeart`,
    mesmo ícone usado na Parte 1 da Raça). Corpo do quadro:
    - Peça central destacada: fração "`{PV atual}` / `{PV máximo}`" — o "PV atual" é
      um `TextField` `variant="standard"` `type="number"` editável com estilo
      ampliado (fonte grande/negrito, texto centralizado, borda removida nos
      estados normal/hover — mesmo espírito do `Autocomplete` sem borda já usado em
      `SheetArmorClassPanel`), o separador "/" e o "PV máximo" como texto estático
      não editável (`DefaultText`/`Title`, mesmo peso visual do PV atual). Ao lado
      dessa fração, um `IconButton`+`Tooltip` ("Ver detalhamento do bônus",
      `FiHelpCircle`) chamando `onOpenDetail` — mesmo estilo/posição usado em
      `SheetArmorClassPanel`.
    - Abaixo (ou ao lado, em telas largas) dessa fração: campo "PV temporário",
      rotulado com `Label`, mesmo tipo de `TextField` numérico editável, em destaque
      visual secundário (fonte menor que a fração central).
    - Os dois campos editáveis (PV atual e PV temporário) tratam localmente o
      estado "vazio" seguindo a adaptação de `SheetLevelField` descrita no Contexto
      acima: `value={rawValue}` como buffer de string local, sincronizado a partir
      da prop numérica só quando ela mudar externamente (troca de ficha/hidratação),
      sem `min`/`max` nos `slotProps` (aceitam qualquer inteiro, positivo ou
      negativo), chamando `onCurrentChange`/`onTemporaryChange` com `null` quando o
      campo é limpo e com `Number(rawValue)` quando o valor digitado corresponde a
      um inteiro completo (`/^-?\d+$/`); estados intermediários inválidos (ex.: `-`
      sozinho) permanecem só no buffer local, sem propagar para o pai.
    - Rótulos exatos: "PV atual", "PV máximo", "PV temporário" (label do quadro
      inteiro: "Pontos de Vida").
  - Puramente apresentacional/controlado — nenhuma lógica de cálculo de PV máximo
    nem nenhuma chamada de API dentro deste componente; `page.tsx` é quem calcula
    `maxValue` e persiste `currentValue`/`temporaryValue` via `usePutEntity` +
    `useFieldAutosave`.

Este componente precisa existir antes de a funcionalidade abaixo o consumir na aba
Estatísticas — implementado pelo mesmo agente (`web-dev`) na mesma etapa.

#### Funcionalidade

- Páginas/rotas: nenhuma rota nova.
  - `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`,
    `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`,
    `app-web/src/shared/formSchemas/RaceFormSchema/index.ts`,
    `app-web/src/shared/interfaces/Entities/Race/index.ts` (Parte 1 — Raça).
  - `app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
    `app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx`
    (novo, ver Componentes),
    `app-web/src/shared/interfaces/Entities/Sheet/index.ts` (Parte 2 — Ficha).

- Integrações com API:
  - `POST /races` e `PUT /races/:id` (já usados por `RaceCreateForm`) — payload
    passa a incluir `hitPoints: number` (obrigatório, convertido de
    `Number(data.hitPoints)` no `buildPayload`, mesmo padrão de conversão já usado
    para `level` em `TalentCreateForm`).
  - `GET /races/:id` (já usado por `RaceView`/modo edição de `RaceCreateForm`) —
    resposta passa a incluir `hitPoints`; nenhuma mudança de uso além de ler o novo
    campo.
  - `GET /sheets/:id` (já existente) — resposta de `sheet.race` (quando presente)
    passa a incluir `hitPoints` da raça vinculada (confirmado por leitura direta de
    `sheet-response.dto.ts`, que usa o `RaceResponseDto` completo para `sheet.race`,
    não o DTO leve da listagem). Nenhuma mudança de endpoint, só de shape do campo
    `race` já consumido.
  - `PUT /sheets/:id` (endpoint já usado por `name`/`level`/`campaignId`/
    `armorClassKeyAttributeId`) — duas novas mutations estreitas por campo:
    - `updateCurrentHitPointsMutation = usePutEntity<ISheet, { currentHitPoints:
      number | null }>({ url: \`/sheets/${sheetId}\`, invalidateQueryKeys:
      [['/sheets'], [\`/sheets/${sheetId}\`]], onError: toast padrão pt-BR })`.
    - `updateTemporaryHitPointsMutation` — mesmo padrão para `temporaryHitPoints`.
    - Ambas disparadas via `useFieldAutosave` sobre `currentHitPoints`/
      `temporaryHitPoints` (debounce de 2500ms, `enabled: hasHydrated`, mesmo padrão
      de `level`/`campaignId`), sempre enviando a chave (nunca omitindo) mesmo
      quando o valor é `null` — necessário para o backend distinguir "limpar
      explicitamente" de "campo omitido" (`@ValidateIf` já previsto no `spec.md`
      para o DTO de update da ficha).
  - `PUT /sheets/:id/race` / `DELETE /sheets/:id/race` (já existentes,
    `linkRaceMutation`/`unlinkRaceMutation`) — nenhuma mudança de uso; `data.race`
    das respostas já populará `hitPoints` assim que o tipo `ISheet.race` for
    ajustado (ver Interfaces), o que basta para o PV máximo recalcular
    automaticamente (via `useMemo` dependente do estado `race`) ao vincular/
    desvincular uma raça.

- Estado/hidratação em `page.tsx`:
  - `const [currentHitPoints, setCurrentHitPoints] = useState<number | null>(null);`
    e `const [temporaryHitPoints, setTemporaryHitPoints] = useState<number |
    null>(null);` — hidratados no `useEffect` já existente (`hasHydrated`) via
    `setCurrentHitPoints(sheet.currentHitPoints ?? null)` /
    `setTemporaryHitPoints(sheet.temporaryHitPoints ?? null)`.
  - `const [isHitPointsDetailOpen, setIsHitPointsDetailOpen] = useState(false);`.

- Cálculo do PV máximo (100% client, mesmo modelo "base + bônus" da Classe de
  Armadura — nada numérico de PV máximo é persistido):
  ```ts
  const HIT_POINTS_BASE_VALUE = 0;
  const raceHitPointsBonus = race?.hitPoints ?? 0;
  const maxHitPoints = HIT_POINTS_BASE_VALUE + raceHitPointsBonus;
  const maxHitPointsBreakdown = race
    ? [{ label: race.name, value: race.hitPoints }]
    : [];
  ```
  Diferente do `armorClassBreakdown` (que sempre tem uma entrada, mesmo com
  `armorClassKeyAttribute` nulo, porque a CA sempre exige um atributo-chave), o
  breakdown de PV máximo deve ficar **vazio** (array `[]`, não uma entrada com
  label vazio) quando `race` é `null` — conforme o comportamento degradado exigido
  pelo spec.

- Layout da aba Estatísticas (bloco `activeTab === 'estatisticas'` em `page.tsx`) —
  `SheetHitPointsPanel` entra como primeiro elemento do `<div className="flex
  flex-col gap-6">`, acima do grid já existente de Atributos + (Classe de Armadura +
  Salvamentos):
  ```
  <div className="flex flex-col gap-6">
    <SheetHitPointsPanel
      currentValue={currentHitPoints}
      onCurrentChange={setCurrentHitPoints}
      temporaryValue={temporaryHitPoints}
      onTemporaryChange={setTemporaryHitPoints}
      maxValue={maxHitPoints}
      onOpenDetail={() => setIsHitPointsDetailOpen(true)}
    />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SheetAttributesPanel ... />
      <div className="flex flex-col gap-6">
        <SheetArmorClassPanel ... />
        <SheetSavingThrowsPanel ... />
      </div>
    </div>

    <SheetSkillsPanel ... />
    <SheetKnowledgesPanel ... />
  </div>
  ```
  O quadro ocupa a largura total, acima do grid, em todas as resoluções.

- Modal de detalhamento — novo `SheetBonusDetailModal` (reaproveitado sem
  alteração de componente):
  ```
  <SheetBonusDetailModal
    open={isHitPointsDetailOpen}
    onClose={() => setIsHitPointsDetailOpen(false)}
    detail={{
      name: 'Pontos de Vida Máximo',
      total: maxHitPoints,
      breakdown: maxHitPointsBreakdown,
    }}
  />
  ```

- Interfaces TypeScript a atualizar:
  - `app-web/src/shared/interfaces/Entities/Race/index.ts` — `IRace`: adicionar
    `hitPoints: number;` logo após `description`. `IRaceListItem` permanece
    **inalterada** (não recebe `hitPoints`).
  - `app-web/src/shared/interfaces/Entities/Sheet/index.ts` — adicionar:
    ```ts
    export interface ISheetRace extends IRaceListItem {
      hitPoints: number;
    }
    ```
    e trocar `race?: IRaceListItem | null;` por `race?: ISheetRace | null;` em
    `ISheet`. Adicionar também `currentHitPoints: number | null;` e
    `temporaryHitPoints: number | null;` em `ISheet`. Em `page.tsx`, o `useState`
    local de `race` passa a ser `useState<ISheetRace | null>(null)` — os dois
    `setRace(data.race ?? null)` já existentes (`linkRaceMutation`/
    `unlinkRaceMutation`, tipados via `ISheet`) continuam funcionando sem alteração
    de código, só de tipo. `SheetRaceField` (props `value`/`options:
    IRaceListItem[]`) não precisa de nenhuma alteração — `ISheetRace` é um
    supertipo estrutural de `IRaceListItem`, então continua compatível como
    `value`.

- Formulário/validação:
  - Raça (`RaceFormSchema`): adicionar `hitPoints` ao `raceFormSchema`, logo após
    `description`, seguindo o padrão de `TalentFormSchema.level`:
    ```ts
    hitPoints: z
      .string()
      .min(1, 'Informe os pontos de vida')
      .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
      .refine((value) => Number(value) >= 1, 'Os pontos de vida devem ser no mínimo 1'),
    ```
    Adicionar `hitPoints: ''` em `raceFormDefaultValues`.
  - `RaceCreateForm`: adicionar `FormTextInput` (`id="race-form-hit-points"`,
    `name="hitPoints"`, `label="Pontos de Vida"`, `type="number"`,
    `slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}`) em uma
    linha própria (fora do grid de 4 colunas do topo), imediatamente após o bloco
    `<div className="w-full">` da Descrição e antes de `EntityReferenceListField`.
    No `useEffect` de hidratação (modo edição), incluir `hitPoints:
    String(raceDetail.hitPoints)` no objeto passado a `reset(...)`. No
    `buildPayload`, `RacePayload` passa a ter `hitPoints: number` (via
    `Omit<RaceFormData, ... | 'hitPoints'> & { hitPoints: number }`) preenchido com
    `Number(data.hitPoints)`.
  - `RaceView`: adicionar uma segunda `RaceSectionBox` (`label="Pontos de Vida"`,
    `icon={FiHeart}`, `value={String(race.hitPoints)}`) dentro do mesmo `<div
    className="flex flex-col gap-4 sm:flex-row">` que hoje só contém a de
    "Descrição" (linhas 215-221), ao lado dela. Importar `FiHeart` de
    `react-icons/fi`.
  - Ficha (PV atual/PV temporário): sem `react-hook-form`/`zod` — mesmo padrão
    não-formulário já usado por `level`/`campaignId`/`armorClassKeyAttribute`
    (estado local + `usePutEntity` + `useFieldAutosave`). Única regra: inteiro,
    sem piso/teto, vazio persiste `null` (nunca `0`), conforme detalhado acima em
    "Componentes" e no cálculo de estado/mutations.

- Acesso Google: **não aplicável**. Esta não é uma listagem com ações de
  criar/editar/excluir. `RaceCreateForm`/`RaceView` já seguem o padrão de acesso
  vigente da página de raças (não afetado por esta demanda — apenas um campo novo
  em um formulário/visualização já existentes). Na ficha, nenhum dos campos
  editáveis já existentes (`name`, `level`, `campaign`, `race`,
  `armorClassKeyAttribute`) aplica restrição para `provider: 'google'`
  (confirmado por inspeção — não há nenhuma referência a
  `provider`/`google`/`readonly` em `fichas/[id]/`); os novos campos "PV atual" e
  "PV temporário" seguem esse mesmo precedente já estabelecido na página e
  permanecem editáveis para todos os usuários. "PV máximo" é somente leitura para
  todos os usuários, por regra de cálculo do spec, não por restrição de acesso.

Status: concluído
Componentes:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx` (novo)

Arquivos:
- `app-web/src/shared/interfaces/Entities/Race/index.ts` (`IRace.hitPoints`)
- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts` (campo `hitPoints` +
  default value)
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
  (`FormTextInput` de Pontos de Vida, `RacePayload.hitPoints`, hidratação de edição)
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx` (segunda
  `RaceSectionBox` com `FiHeart`)
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts` (`ISheetRace`,
  `ISheet.race` retipado, `ISheet.currentHitPoints`/`temporaryHitPoints`)
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (estado
  `currentHitPoints`/`temporaryHitPoints`/`isHitPointsDetailOpen`, hidratação,
  cálculo `maxHitPoints`/`maxHitPointsBreakdown`, mutations
  `updateCurrentHitPointsMutation`/`updateTemporaryHitPointsMutation` +
  `useFieldAutosave`, `SheetHitPointsPanel` no layout da aba Estatísticas,
  `SheetBonusDetailModal` de "Pontos de Vida Máximo", `race` tipado como
  `ISheetRace | null`)

Nenhuma pendência identificada — implementação segue integralmente o plano acima.

### 2. web-dev-codereviewer
**Status:** concluído
- Revisar tudo acima, com atenção especial a:
  - Parte 1 (Raça): `hitPoints` posicionado logicamente após `description` em
    schema/formulário/visualização/interface `IRace`; validação mínimo 1/inteiro
    obrigatória tanto no create quanto no update; `IRaceListItem` permanece
    inalterada (sem `hitPoints`).
  - Parte 2 (Ficha): PV atual/temporário aceitam negativo e ficam vazios
    corretamente (persistindo `null`, não `0`) ao serem apagados — checar
    especificamente a digitação de um sinal de `-` isolado antes do primeiro dígito
    (não pode "esnapar" de volta ao valor anterior); PV máximo calculado como
    `0 + hitPoints da raça vinculada` (ou `0`/breakdown vazio sem raça), nunca
    persistido; modal reaproveitado com `name: 'Pontos de Vida Máximo'` e breakdown
    mostrando apenas o nome da raça, sem prefixo; quadro posicionado acima do grid
    de Atributos/Classe de Armadura, ocupando largura total; `ISheet.race` tipado
    como `ISheetRace` (com `hitPoints`), sem vazar esse campo para `IRaceListItem`.

## Revisão

Revisão completa de todos os arquivos listados na etapa "1. web-dev" (componente novo
`SheetHitPointsPanel`, `page.tsx` da ficha, interfaces `Race`/`Sheet`,
`RaceFormSchema`, `RaceCreateForm`, `RaceView`), incluindo verificação ponto a ponto
dos itens sinalizados no Contexto/spec: buffer de string local em
`SheetHitPointsPanel` para digitação de `-` isolado (funciona corretamente — como o
componente é controlado e o React só reatribui `element.value` quando o valor
proposto difere do valor já refletido no DOM, o estado intermediário `-` digitado
pelo usuário nunca é sobrescrito/"esnapado"); `useFieldAutosave` com `enabled:
hasHydrated` não dispara PUT espúrio durante a hidratação (confirmado lendo
`hooks/useFieldAutosave/index.ts` — o primeiro `useEffect` que roda com `enabled ===
true` sempre consome o `isFirstRunRef` sem chamar `onSave`, independentemente de
quantos renders "desabilitados" ocorreram antes); PV máximo `0`/breakdown vazio sem
raça (`race ? [...] : []`, nunca uma entrada com label vazio, diferente do padrão de
Classe de Armadura); tipagem `ISheetRace`/`IRaceListItem`/`IRace` coerente com o
shape real da API (`IRaceListItem` não ganhou `hitPoints`, `ISheetRace` é o supertipo
estrutural usado só em `ISheet.race`, e `SheetRaceField`/`SheetRaceCard` continuam
compatíveis por tipagem estrutural sem nenhuma alteração de código). Não foram
encontrados bugs de lógica, tipagem incompatível, imports quebrados, hooks fora das
regras do React, duplicação de componentes já existentes, nem uso de ícone fora de
`react-icons/fi`. Dois achados de severidade baixa (cosméticos/acessibilidade menor),
sem impacto funcional:

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx:23-27`**
  — o `NO_BORDER_TEXT_FIELD_SX` aplicado ao campo "PV atual" remove a borda também no
  estado `:after` (foco), enquanto o Contexto da task descreve remoção de borda
  apenas nos estados "normal/hover" (mesmo espírito do `Autocomplete` sem borda do
  `SheetArmorClassPanel`/`SheetRaceField`, que preservam a borda de foco). Não é um
  bug funcional, mas remove todo indício visual de foco do único input realmente
  crítico do quadro (o que edita o PV atual), o que é uma regressão leve de
  visibilidade de foco por teclado.
    - Trecho: `'& .MuiInput-root:after': { borderBottom: 'none' }`
    - Sugestão: remover essa regra (ou substituí-la por uma borda de foco visível,
      como `borderBottom: `2px solid ${APP_COLORS.gold}`` usado nos outros campos
      `standard` sem borda da ficha) para manter indicação de foco acessível.

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx:131-143`**
  — o `Label htmlFor="sheet-hit-points-max"` associa um `<label>` a um elemento
  `DefaultText` (`id="sheet-hit-points-max"`, renderizado como `<p>`), que não é um
  controle de formulário. `htmlFor`/`for` só tem semântica válida apontando para
  elementos de formulário (input/select/textarea/etc.); como "PV máximo" é somente
  leitura, essa associação não é reconhecida pela árvore de acessibilidade como um
  rótulo funcional.
    - Trecho: `<Label htmlFor="sheet-hit-points-max">PV máximo</Label>` associado a
      `<DefaultText id="sheet-hit-points-max">{maxValue}</DefaultText>`
    - Sugestão: remover o `htmlFor` desse `Label` específico (mantendo apenas o texto
      "PV máximo" como rótulo visual, sem associação formal), já que o valor ao lado
      não é um campo interativo.

Aprovado, sem bloqueios. Nenhum problema de erro de código, tipagem, formulário,
React Query, ícones ou reaproveitamento de componentes foi encontrado nos arquivos
revisados:

**Correção aplicada (2026-08-08):** os dois achados de severidade baixa acima foram
corrigidos em
`app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx`:
`NO_BORDER_TEXT_FIELD_SX` agora define `'& .MuiInput-root:after': { borderBottom:
\`2px solid ${APP_COLORS.gold}\` }` (preservando indicação de foco, mesmo padrão dos
demais campos "sem borda" da ficha) e o `Label` de "PV máximo" deixou de ter
`htmlFor="sheet-hit-points-max"` (associação `for`/`htmlFor` inválida com um
`DefaultText`, que não é um controle de formulário). Nenhuma mudança de
comportamento funcional — buffer de string local dos inputs de PV atual/temporário e
cálculo/exibição do PV máximo permanecem intactos.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetHitPointsPanel/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx`
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts`
- `app-web/src/shared/interfaces/Entities/Race/index.ts`
- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts`
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`