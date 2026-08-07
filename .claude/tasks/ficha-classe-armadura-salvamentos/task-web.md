# Task Web: Ficha — Classe de Armadura e Salvamentos

## Contexto
Ver `.claude/tasks/ficha-classe-armadura-salvamentos/spec.md` (seção "Escopo
confirmado") — fonte da verdade normativa para este plano.

**Atenção — contrato de API ainda não fechado:** no momento deste planejamento não
existe `.claude/tasks/ficha-classe-armadura-salvamentos/task-api.md`. O spec já
confirma *o que* é persistido (a escolha do atributo-chave da CA, com padrão
"Destreza" para fichas sem escolha própria), mas não define o nome exato do
campo/endpoint. Este plano assume, por convenção com os campos simples já
existentes na ficha (`name`, `level`, `campaignId`, todos via `PUT /sheets/:id`),
que a API expõe um campo relacional `armorClassKeyAttribute` (`IAttribute | null`)
em `GET /sheets/:id` e aceita `armorClassKeyAttributeId: string` no mesmo
`PUT /sheets/:id`. **web-dev deve confirmar esses nomes contra a implementação real
do app-api (ou a task-api correspondente, se existir até lá) antes de codificar essa
integração**, ajustando apenas nomes de campo/payload — a lógica de cálculo e o
layout descritos abaixo não dependem desse detalhe.

Investigação de código já feita (não reabrir):

- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — aba "estatisticas" (bloco
  `activeTab === 'estatisticas'`, hoje um `flex flex-col gap-6` com
  `SheetAttributesPanel` → `SheetSkillsPanel` → `SheetKnowledgesPanel`). O array
  `attributes` (`{ id, label, value, modifier }`) já é calculado ali num `useMemo`
  a partir das propriedades de melhoria/defeito do tipo "Atributo"
  (`ATTRIBUTE_BASE_VALUE + melhorias - defeitos`, `modifier = Math.floor((value -
  10) / 2)`) e é reaproveitado tanto por `useSheetSkillModifiers` quanto por
  `useSheetKnowledgeModifiers`. A CA e os Salvamentos devem casar o atributo-chave
  por **nome** contra esse mesmo array `attributes`, exatamente como perícias e
  saberes já fazem — nenhum novo cálculo de valor/modificador de atributo é
  necessário.
- `.../fichas/[id]/hooks/useSheetSkillModifiers/index.ts` — recebe
  `{ skills: ISkillListItem[]; attributes; proficiencias; proficienciasAjustadas;
  gradations }` e devolve `SheetSkillModifierResult[]` (`{ id, name,
  keyAttributeName, gradationName, total, breakdown }`). Internamente casa cada
  `skill.keyAttribute.name` contra `attributes` (por nome normalizado) e cada
  `skill.name` contra `entry.property.name`/`entry.adjustedProperty.name` do
  snapshot de proficiências, escolhendo a gradação de maior `level` e caindo para
  "Destreinado" quando não há correspondência. **Este hook não precisa de nenhuma
  alteração** — `ISkillListItem` é só `{ id, name, keyAttribute: { id, name } }`,
  então uma lista de 3 "pseudo-perícias" fixas (`Fortitude`/`Constituição`,
  `Reflexo`/`Destreza`, `Vontade`/`Sabedoria`) satisfaz o tipo e produz exatamente o
  cálculo pedido para Salvamentos sem duplicar nenhuma linha de lógica.
- `.../fichas/[id]/components/SheetSkillCard/index.tsx` — card com nome,
  "Atributo-chave: X", "Graduação: Y", `IconButton`+`Tooltip` (`FiHelpCircle`) e o
  círculo de modificador (`Box` 44x44, `borderRadius: '50%'`, fundo
  `APP_COLORS.wood`, borda `APP_COLORS.gold`, texto `APP_COLORS.goldSoft`). Suas
  props (`name`, `keyAttributeName`, `gradationName`, `total`, `onOpenDetail`) já
  batem exatamente com `SheetSkillModifierResult` — é reaproveitável **sem
  nenhuma alteração de contrato** para os 3 cards de Salvamento.
- `.../fichas/[id]/components/SheetKnowledgeCard/index.tsx` — usa o **mesmo** bloco
  `Box` de círculo 44x44 copiado e colado (idêntico ao de `SheetSkillCard`), ou
  seja, esse visual já está duplicado duas vezes hoje. Extrair um componente
  compartilhado `SheetModifierCircle` agora (para o valor da CA) resolve as três
  ocorrências de uma vez, em vez de introduzir uma quarta cópia.
- `.../fichas/[id]/components/SheetBonusDetailModal/index.tsx` — modal genérico
  `{ name, total, breakdown }`, já reaproveitado por Perícias e Saberes (inclusive
  passando o próprio `SheetSkillModifierResult`/objeto equivalente direto como
  `detail`, já que estruturalmente é um superconjunto de `SheetBonusDetail`). Serve
  sem alteração tanto para os Salvamentos (reaproveitando o mesmo
  `SheetSkillModifierResult` retornado pelo hook) quanto para a CA (montando
  manualmente `{ name: 'Classe de Armadura', total, breakdown: [...] }` com uma
  única entrada de breakdown, sem linha "+10 Base" — o 10 fica embutido só no
  `total`, conforme spec).
- `.../fichas/[id]/components/SheetSkillsPanel/index.tsx` e
  `SheetAttributesPanel/index.tsx` — padrão de painel:
  `APP_CONTAINER_STYLES.detailSectionBox` (contêiner) +
  `detailSectionBoxHeader` (faixa de título com ícone `react-icons/fi` +
  `Label`). Base direta para os dois painéis novos.
- `.../fichas/[id]/data/index.ts` — já exporta `SHEET_ATTRIBUTE_PROPERTY_ORDER`
  (ordem canônica dos 6 atributos) e `flattenProficiencySnapshot`/
  `flattenKnowledgeSnapshot`. Local natural para a nova constante fixa dos 3
  Salvamentos e para um comparador reaproveitável de ordenação por atributo (ver
  Funcionalidade).
- `hooks/Queries/EntityQueries/useAttributesQuery/index.ts` — já existe, busca
  `GET /attributes` e devolve `IAttribute[]` (o mesmo catálogo usado em
  `skill.keyAttribute`). Candidato natural para as opções do autocomplete da CA —
  **nenhum hook novo de query é necessário**.
- `.../fichas/[id]/hooks/useFieldAutosave/index.ts` — hook de debounce já usado
  para `name`/`level`/`campaignId` na própria página, disparando o `usePutEntity`
  correspondente. O atributo-chave da CA segue o mesmo padrão de `campaignId`
  (campo simples de escolha única na raiz da ficha).
- `shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx` — já
  existe um autocomplete genérico para estado simples (não react-hook-form),
  genérico em `TOption`, com `options`/`getOptionLabel`/`value`/`onChange`. É
  exatamente o que a CA precisa — **não é necessário criar nenhum autocomplete
  novo em `shared/components/`**, nem replicar o padrão bespoke usado em
  `SheetCampaignField` (que reimplementa `Autocomplete` diretamente).

Status: pendente

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/fichas/[id]/components/SheetModifierCircle/index.tsx (novo, extração); app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx (refatorado para usar SheetModifierCircle); app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgeCard/index.tsx (refatorado para usar SheetModifierCircle); app-web/src/app/(authorized)/fichas/[id]/components/SheetArmorClassPanel/index.tsx (novo); app-web/src/app/(authorized)/fichas/[id]/components/SheetSavingThrowsPanel/index.tsx (novo)
Arquivos: app-web/src/app/(authorized)/fichas/[id]/page.tsx (layout da aba Estatísticas, estado/mutation/autosave de armorClassKeyAttribute, cálculo de CA, wiring de SheetArmorClassPanel/SheetSavingThrowsPanel e seus modais de detalhamento); app-web/src/app/(authorized)/fichas/[id]/data/index.ts (novo sortByAttributeOrder e SHEET_SAVING_THROW_DEFINITIONS); app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSavingThrowModifiers/index.ts (novo, adaptador sobre useSheetSkillModifiers); app-web/src/shared/interfaces/Entities/Sheet/index.ts (campo armorClassKeyAttribute: IAttribute, não opcional/não nulo, conforme contrato confirmado em task-api.md)

Nota: o contrato de API foi confirmado contra `task-api.md` (seção "Contrato de API")
antes da implementação — `armorClassKeyAttribute` na resposta é sempre presente (nunca
nulo), diferente da suposição inicial `IAttribute | null` do Contexto deste plano;
`ISheet.armorClassKeyAttribute` foi tipado como `IAttribute` (obrigatório) para refletir
isso. Nenhum endpoint novo foi usado além dos já previstos (`GET /attributes`,
`PUT /sheets/:id`).

#### Componentes

- Componente: `SheetModifierCircle`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetModifierCircle/index.tsx`,
  novo — extração)
  - Props: `{ value: number }`.
  - Comportamento esperado: exatamente o `Box` 44x44 `borderRadius: '50%'`,
    `backgroundColor: APP_COLORS.wood`, `border: 1px solid APP_COLORS.gold`, com o
    `DefaultText` interno (`fontSize: 1.1rem`, `fontWeight: 700`, `lineHeight: 1`,
    `color: APP_COLORS.goldSoft`) hoje duplicado em `SheetSkillCard` e
    `SheetKnowledgeCard`. O componente formata o sinal internamente (`+2`/`-1`/`0`,
    nunca `+0`... manter a mesma regra hoje usada: `total > 0 ? '+'+total :
    ''+total`). Puramente apresentacional, sem lógica de cálculo.
  - Refatorar `SheetSkillCard` e `SheetKnowledgeCard` para usar
    `SheetModifierCircle` no lugar do `Box` inline (mesmo resultado visual, zero
    mudança de comportamento) — isso é pré-requisito para o item abaixo e para o
    valor da CA reaproveitarem o mesmo círculo, conforme diretriz do usuário.

- Componente: `SheetArmorClassPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetArmorClassPanel/index.tsx`,
  novo)
  - Props: `{ total: number; keyAttribute: IAttribute | null; keyAttributeOptions:
    IAttribute[]; onKeyAttributeChange: (attribute: IAttribute) => void;
    onOpenDetail: () => void }`.
  - Comportamento esperado: mesmo padrão de quadro que `SheetAttributesPanel`
    (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`, título
    "Classe de Armadura", ícone `react-icons/fi` — sugestão não vinculante:
    `FiShield`). Corpo em linha (`flex items-center gap-3 p-4`) com, nesta ordem:
    `SheetModifierCircle` (`value={total}`) → `IconButton`+`Tooltip`
    ("Ver detalhamento do bônus", `FiHelpCircle`, mesmo estilo de borda/cor já
    usado em `SheetSkillCard`) chamando `onOpenDetail` → `DefaultAutocompleteInput<IAttribute>`
    (`options={keyAttributeOptions}`, `getOptionLabel={(o) => o.name}`,
    `value={keyAttribute}`, placeholder "Atributo-chave"). O componente deve
    ignorar seleção de valor vazio (`newValue === null`) no `onChange` — a CA
    sempre precisa de um atributo-chave definido, não deve permitir limpar a
    seleção.

- Componente: `SheetSavingThrowsPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetSavingThrowsPanel/index.tsx`,
  novo — cópia estrutural de `SheetSkillsPanel`, reaproveitando `SheetSkillCard`
  sem alteração)
  - Props: `{ items: SheetSkillModifierResult[]; onOpenDetail: (id: string) => void }`
    (mesmo tipo de retorno de `useSheetSkillModifiers`/`useSheetSavingThrowModifiers`,
    ver Funcionalidade).
  - Comportamento esperado: mesmo padrão de quadro (`detailSectionBox`/
    `detailSectionBoxHeader`), título "Salvamentos", ícone `react-icons/fi`
    (sugestão: reaproveitar `FiTarget` ou similar já usado em `SheetSkillsPanel`,
    sem necessidade de ficar idêntico). Corpo com grid `grid-cols-1 sm:grid-cols-3`
    (exatamente 3 itens fixos, não precisa do `lg:grid-cols-4` usado em
    Perícias), renderizando um `SheetSkillCard` por item (`name`,
    `keyAttributeName`, `gradationName`, `total`, `onOpenDetail={() =>
    onOpenDetail(item.id)}`) — nenhuma prop nova, nenhuma variação de
    `SheetSkillCard` para Salvamentos.

Estes componentes (mais a refatoração de `SheetSkillCard`/`SheetKnowledgeCard`)
precisam existir antes de a funcionalidade abaixo os consumir na aba
Estatísticas — implementados pelo mesmo agente (`web-dev`) na mesma etapa.

#### Funcionalidade

- Páginas/rotas: nenhuma rota nova. Único arquivo de página afetado:
  `app-web/src/app/(authorized)/fichas/[id]/page.tsx`, aba "Estatísticas".

- Layout da aba Estatísticas (substitui o atual `<div className="flex flex-col
  gap-6">` do bloco `activeTab === 'estatisticas'`):
  ```
  <div className="flex flex-col gap-6">
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
  Ou seja: Atributos e a coluna (Classe de Armadura + Salvamentos) ficam lado a
  lado em telas `lg+` (`grid-cols-2`); em telas menores caem para uma única coluna
  empilhada (`grid-cols-1`), na ordem Atributos → Classe de Armadura → Salvamentos
  → Perícias → Saberes. Perícias e Saberes continuam em largura total, abaixo do
  grid, sem nenhuma alteração de comportamento.

- Integrações com API:
  - `GET /sheets/:id` (já existente) — passa a incluir o campo do atributo-chave
    da CA na resposta (nome assumido `armorClassKeyAttribute`, ver aviso de
    contrato no Contexto). Hidratar um novo estado local
    `armorClassKeyAttribute: IAttribute | null` a partir dele, no mesmo `useEffect`
    de hidratação já existente (`hasHydrated`).
  - `GET /attributes` — novo uso nesta página via `useAttributesQuery()` (hook já
    existente, sem alteração), como opções do autocomplete da CA. Ordenar as
    opções pela mesma ordem canônica dos 6 atributos: extrair em `data/index.ts`
    um comparador reaproveitável (ex.: `sortByAttributeOrder`) a partir da lógica
    de ordenação hoje inline no `useMemo` de `attributeProperties` em `page.tsx`
    (que usa `SHEET_ATTRIBUTE_PROPERTY_ORDER.indexOf(...)`), e reaproveitá-lo tanto
    ali quanto para ordenar as opções de `useAttributesQuery()` — evita duplicar a
    mesma comparação em dois `useMemo`s.
  - `PUT /sheets/:id` (endpoint já usado por `name`/`level`/`campaignId`) — nova
    mutation `updateArmorClassKeyAttributeMutation =
    usePutEntity<ISheet, { armorClassKeyAttributeId: string }>({ url:
    `/sheets/${sheetId}`, invalidateQueryKeys: [['/sheets'], [`/sheets/${sheetId}`]]
    , onError: toast padrão pt-BR })`, disparada via `useFieldAutosave` sobre
    `armorClassKeyAttribute?.id` — mesmo padrão já usado para `campaignId`
    (debounce de 2500ms, `enabled: hasHydrated`). Nenhum endpoint novo é criado
    nem chamado para Salvamentos (cálculo 100% client, nada persistido).

- Cálculo (100% client, mesmo precedente de atributos/perícias/saberes — nada
  numérico é persistido, só a escolha do atributo-chave da CA):
  - Classe de Armadura: `useMemo` em `page.tsx` que localiza em `attributes` (o
    array já calculado na página) o item cujo `label` normalizado bate com
    `armorClassKeyAttribute?.name`; `attributeModifier = matched?.modifier ?? 0`;
    `total = ARMOR_CLASS_BASE_VALUE (10) + attributeModifier`, sem piso mínimo
    (pode dar negativo/abaixo de 10). `breakdown` para o modal:
    `[{ label: armorClassKeyAttribute?.name ?? '', value: attributeModifier }]`
    — uma única linha, sem entrada separada para o `10` base (embutido só no
    `total` exibido no círculo e no rodapé do modal).
  - Salvamentos: nova constante fixa em `data/index.ts`, ex.:
    ```ts
    export const SHEET_SAVING_THROW_DEFINITIONS = [
      { id: 'fortitude', name: 'Fortitude', keyAttributeName: 'Constituição' },
      { id: 'reflexo', name: 'Reflexo', keyAttributeName: 'Destreza' },
      { id: 'vontade', name: 'Vontade', keyAttributeName: 'Sabedoria' },
    ] as const;
    ```
    Novo hook fino `useSheetSavingThrowModifiers`
    (`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSavingThrowModifiers/index.ts`)
    que recebe `{ attributes, proficiencias, proficienciasAjustadas, gradations }`
    (mesmos parâmetros de `useSheetSkillModifiers`, menos `skills`), monta
    internamente uma lista de "pseudo-perícias" (`ISkillListItem`-compatível) a
    partir de `SHEET_SAVING_THROW_DEFINITIONS` (`{ id, name, keyAttribute: { id,
    name: keyAttributeName } }`, usando o próprio `id` fixo como placeholder de
    `keyAttribute.id` — não é usado no cálculo, só `keyAttribute.name`) e delega
    inteiramente para `useSheetSkillModifiers({ skills: pseudoSkills, attributes,
    proficiencias, proficienciasAjustadas, gradations })`, devolvendo o resultado
    sem nenhuma transformação adicional. **Nenhuma lógica de cálculo é duplicada**
    — este hook é só um adaptador de input, a regra continua vivendo
    exclusivamente em `useSheetSkillModifiers` (casamento de atributo por nome +
    casamento de gradação por nome da proficiência + fallback "Destreinado").
  - Em `page.tsx`, chamar `const savingThrowModifiers =
    useSheetSavingThrowModifiers({ attributes, proficiencias,
    proficienciasAjustadas, gradations: proficiencyGradations ?? [] })` ao lado da
    chamada já existente de `useSheetSkillModifiers`.

- Estado/UI adicional em `page.tsx`:
  - `armorClassKeyAttribute: IAttribute | null` (hidratado, ver acima).
  - `armorClassPendingBonusDetail: boolean` (ou reaproveitar o padrão booleano de
    `isAttributesDetailOpen`) para abrir `SheetBonusDetailModal` com
    `detail={{ name: 'Classe de Armadura', total: armorClassTotal, breakdown:
    armorClassBreakdown }}`.
  - `savingThrowPendingBonusDetail: SheetSkillModifierResult | null`, seguindo
    exatamente o mesmo padrão já usado para `skillPendingBonusDetail` (o objeto é
    passado direto como `detail` de um `SheetBonusDetailModal`, sem remapeamento,
    pois `SheetSkillModifierResult` já é um superconjunto de `SheetBonusDetail`).

- Interface: adicionar em `shared/interfaces/Entities/Sheet/index.ts` o campo
  `armorClassKeyAttribute?: IAttribute | null;` em `ISheet` (nome a confirmar
  contra o contrato real da API, ver aviso no Contexto).

- Formulário/validação: não há formulário `react-hook-form`/`zod` nesta demanda.
  A CA usa um autocomplete de estado simples (`DefaultAutocompleteInput`) com
  persistência via `usePutEntity`/`useFieldAutosave`, mesmo padrão não-formulário
  já usado por `name`/`level`/`campaignId` na própria página. Única regra de
  validação: o autocomplete da CA nunca deve ficar com valor vazio (ignorar
  tentativa de limpar seleção). Os 3 cards de Salvamento não têm nenhum campo
  editável.

- Acesso Google: **não aplicável**. Esta não é uma listagem com ações de
  criar/editar/excluir — é a página de detalhe/edição de uma ficha já existente.
  Hoje, nenhum dos demais campos editáveis dessa mesma página (`name`, `level`,
  `campaign`, `race`, `biography`) aplica qualquer restrição para
  `provider: 'google'` (confirmado por inspeção do código — não há nenhuma
  referência a `provider`/`google`/`readonly` em `fichas/[id]/`). O autocomplete
  da CA segue esse mesmo precedente já estabelecido na página e permanece editável
  para todos os usuários. Os 3 cards de Salvamento são somente leitura para todos
  os usuários (não editáveis por ninguém, nem mesmo o autor da ficha — regra do
  spec, não relacionada a `provider`).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Arquivos revisados: `app-web/src/app/(authorized)/fichas/[id]/components/SheetModifierCircle/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillCard/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgeCard/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetArmorClassPanel/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetSavingThrowsPanel/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetSavingThrowModifiers/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/data/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts`.

Verificações confirmadas (sem problema):
- `SheetModifierCircle` extrai fielmente o `Box` 44x44 (`APP_COLORS.wood`/`gold`/`goldSoft`,
  mesma formatação de sinal `total > 0 ? '+'+total : ''+total`) antes duplicado em
  `SheetSkillCard`/`SheetKnowledgeCard`; ambos os cards foram refatorados para usá-lo sem
  nenhuma mudança de markup, texto ou espaçamento ao redor — nenhuma regressão visual em
  Perícias/Saberes.
- `useSheetSavingThrowModifiers` delega 100% para `useSheetSkillModifiers`, apenas montando
  `pseudoSkills` a partir de `SHEET_SAVING_THROW_DEFINITIONS`; nenhuma regra de cálculo
  duplicada. As 3 definições (`Fortitude`/`Constituição`, `Reflexo`/`Destreza`,
  `Vontade`/`Sabedoria`) batem exatamente com o spec.
- CA calculada como `ARMOR_CLASS_BASE_VALUE (10) + attributeModifier`, sem piso (`page.tsx`,
  `armorClassTotal`), e `armorClassBreakdown` tem uma única linha (o atributo-chave), sem
  linha "+10 Base" — `SheetBonusDetailModal` exibe o total já com o 10 embutido. Confirma as
  duas regras do spec.
- `ISheet.armorClassKeyAttribute` tipado como `IAttribute` (obrigatório, não opcional/nulo),
  batendo com o contrato confirmado em `task-api.md` (campo sempre presente). A hidratação em
  `page.tsx` usa `sheet.armorClassKeyAttribute ?? null` para popular o estado local
  `IAttribute | null` (necessário porque o estado começa `null` antes da hidratação) — o
  `?? null` é redundante frente ao tipo não-nulo da API, mas inofensivo.
- Autosave do autocomplete (`updateArmorClassKeyAttributeMutation` + `useFieldAutosave` sobre
  `armorClassKeyAttributeId`) segue exatamente o mesmo padrão de `campaignId`: mesmo
  `usePutEntity` com `invalidateQueryKeys: [['/sheets'], ['/sheets/'+sheetId]]`, mesmo
  `enabled: hasHydrated`, `onError` com toast pt-BR. Não há rollback do estado local em caso de
  erro, mas isso é consistente com o precedente já existente para `name`/`level`/`campaignId`
  (nenhum desses reverte o estado local em `onError`) — não é uma regressão introduzida por
  esta etapa.
- Layout da aba Estatísticas em `page.tsx` reproduz exatamente a estrutura do plano
  (`grid grid-cols-1 lg:grid-cols-2` com Atributos à esquerda e uma coluna
  `flex flex-col gap-6` com CA + Salvamentos à direita; Perícias e Saberes permanecem abaixo,
  largura total, sem alteração). `SheetAttributesPanel`, `SheetSkillsPanel` e
  `SheetKnowledgesPanel` não foram tocados.
- Textos em pt-BR corretos ("Classe de Armadura", "Salvamentos", "Atributo-chave", "Ver
  detalhamento do bônus"); ícones exclusivamente de `react-icons/fi` (`FiShield`, `FiTarget`,
  `FiHelpCircle`); `IconButton`s sem texto visível têm `aria-label` em pt-BR.
- Reaproveitamento correto: `DefaultAutocompleteInput` (não um autocomplete bespoke),
  `useAttributesQuery()` já existente (nenhum hook novo de query), `SheetSkillCard` reutilizado
  sem alteração de contrato para os cards de Salvamento, `sortByAttributeOrder` extraído em
  `data/index.ts` e reaproveitado tanto para `attributeProperties` quanto para
  `armorClassKeyAttributeOptions` (elimina a duplicação de `indexOf` em dois `useMemo`s,
  conforme pedido do plano).
- Acesso Google: corretamente não aplicado (nem ao autocomplete da CA, nem aos cards de
  Salvamento), consistente com o precedente já estabelecido nessa página e com a decisão
  explícita do spec.

Problemas encontrados:
- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetArmorClassPanel/index.tsx:56-69`**
  — o `DefaultAutocompleteInput` do atributo-chave da CA não recebe a prop `label`, ficando sem
  nenhum rótulo acessível associado (nem `<Label htmlFor>` visível, nem `aria-label`), apoiado
  só no `placeholder="Atributo-chave"`. Isso destoa do padrão já usado nos demais campos
  editáveis dessa mesma página (`SheetNameField` usa `slotProps.htmlInput['aria-label']`,
  `SheetCampaignField` usa `<Label htmlFor="sheet-campaign-field">`) e nos demais usos de
  `DefaultAutocompleteInput` no projeto (ex.: `EventsFilterSection` sempre passa `label`).
  - Trecho: `<DefaultAutocompleteInput<IAttribute> id="armor-class-key-attribute" options={keyAttributeOptions} ... placeholder="Atributo-chave" />` (sem prop `label`)
  - Sugestão: passar `label="Atributo-chave"` para `DefaultAutocompleteInput` (mantendo o
    `placeholder` se desejado, ex. um texto auxiliar como "Selecione o atributo"), replicando o
    padrão de acessibilidade já usado pelos demais campos da ficha.

Correção aplicada: `SheetArmorClassPanel` agora passa `label="Atributo-chave"` ao
`DefaultAutocompleteInput` (mantendo o `placeholder` existente), dando ao campo um
`<Label htmlFor="armor-class-key-attribute">` visível/associado, igual ao padrão de
`SheetCampaignField`/`EventsFilterSection`. Para não quebrar o alinhamento da linha
(círculo de CA + botão de detalhamento + autocomplete), a linha do corpo do painel foi
ajustada de `items-center` para `items-end`, replicando o mesmo padrão de alinhamento já
usado em `EventsFilterSection` (linha que mistura inputs rotulados com outro elemento) —
círculo e `IconButton` agora alinham com a base do campo de input, não mais com o rótulo
acima dele.