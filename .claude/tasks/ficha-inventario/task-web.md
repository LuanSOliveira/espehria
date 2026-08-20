# Task Web: Ficha - Inventário (aba, Volume e Moedas)

## Contexto
Ver .claude/tasks/ficha-inventario/spec.md

## Etapas

### 1. web-dev

#### Componentes (novos, específicos da página `fichas/[id]`)

Seguem o mesmo padrão dos demais quadros já existentes na tela de ficha
(`SheetHitPointsPanel`, `SheetArmorClassPanel`, `SheetLevelField` —
`app-web/src/app/(authorized)/fichas/[id]/components/`): `div` com
`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`, ícone +
`Label` no cabeçalho, `TextField variant="standard"` com buffer de string
local para inputs numéricos. Não é necessário nenhum componente novo em
`shared/components/` — os inputs numéricos existentes na feature já resolvem
o padrão (não há um input numérico genérico em `DefaultInputs`/`FormInputs`,
e os quadros de ficha sempre usam `TextField` diretamente, então mantém-se
essa mesma convenção local em vez de introduzir um input compartilhado).

- Componente: `SheetVolumePanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetVolumePanel`)
  - Props: `currentVolume: number`, `maxVolume: number`, `limitVolume: number`.
  - Comportamento esperado: quadro com título "Volume" (cabeçalho no mesmo
    estilo dos demais). Exibe `{currentVolume}/{maxVolume}` seguido de
    `{limitVolume}` como valor separado, na mesma linha (mesma disposição
    visual do par PV atual/PV máximo em `SheetHitPointsPanel`, com o Volume
    Limite como um terceiro valor ao lado). Quando `currentVolume > maxVolume`,
    o valor de `currentVolume` recebe destaque visual de alerta (usar
    `APP_COLORS.alertRed`, mesma cor já usada para alertas em
    `SheetAbilityCard`/`SheetAbilitySelectionModal`). Rodapé sempre visível,
    com texto em itálico (mesmo padrão de nota de rodapé usado em
    `SheetHitPointsPanel`/`SheetAbilityCard` etc.):
    `*Se carregar mais do que {maxVolume} Volume(s), você adquire a condição
    sobrecarregado`. É um componente somente de exibição (sem input, sem
    `onChange`) — `currentVolume`, `maxVolume` e `limitVolume` já chegam
    calculados de `page.tsx`.

- Componente: `SheetCoinsPanel`
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetCoinsPanel`)
  - Props: `values: { pc: number; pp: number; po: number; pl: number }`,
    `onChange: (values: { pc: number; pp: number; po: number; pl: number }) => void`.
  - Comportamento esperado: quadro com título "Moedas". 4 inputs de texto
    numérico em linha, nesta ordem: PC (Cobre), PP (Prata), PO (Ouro), PL
    (Platina) — cada um com buffer de string local (mesmo padrão de
    `SheetHitPointsPanel`) que só aceita dígitos e não permite valor negativo
    nem decimal (mesma validação de `SheetLevelField`, adaptada para permitir
    `0`). Entre cada par adjacente (PC↔PP, PP↔PO, PO↔PL), dois `IconButton`
    de seta (uma para cada direção, ex. `FiArrowRight`/`FiArrowLeft` ou
    `FiChevronUp`/`FiChevronDown`, mesmo estilo de `IconButton` com borda
    dourada já usado para os botões de detalhe — ex. em `SheetArmorClassPanel`)
    que, ao clicar, aplicam exatamente um bloco de conversão via `onChange`
    (10 unidades da moeda menor ↔ 1 unidade da moeda maior seguinte: PC↔PP,
    PP↔PO, PO↔PL). Cada seta fica `disabled` sempre que o saldo de origem for
    insuficiente (menos de 10 unidades para conversão "para cima"; menos de 1
    unidade para conversão "para baixo"). Rodapé sempre visível, mesmo padrão
    de texto em itálico:
    `*A cada 1000 moedas 1 volume será adicionado ao inventário`.

#### Funcionalidade

- Páginas/rotas: nenhuma rota nova — altera apenas
  `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (rota já existente
  `/fichas/[id]`).
  - Adicionar `'inventario'` ao union type `SheetDetailTab` (hoje
    `'estatisticas' | 'bonus' | 'habilidades'`).
  - Adicionar `<Tab value="inventario" label="Inventário" />` na `Tabs`
    principal, imediatamente após `<Tab value="habilidades" label="Habilidades" />`.
  - A aba "Inventário" não tem sub-abas: não renderizar nenhuma `Tabs`
    secundária quando `activeTab === 'inventario'` (mesmo comportamento hoje
    já aplicado a `activeTab === 'estatisticas'`, que também não tem
    sub-`Tabs`).
  - Conteúdo da aba: bloco `activeTab === 'inventario'` com
    `<SheetVolumePanel />` e `<SheetCoinsPanel />` lado a lado (grid de 2
    colunas em telas maiores, ex. `grid grid-cols-1 gap-6 lg:grid-cols-2`,
    mesmo padrão já usado para `SheetAttributesPanel`/coluna de Classe de
    Armadura + Resistências na aba Estatísticas).

- Estado e cálculo em `page.tsx`:
  - Novos states hidratados a partir de `sheet` no mesmo `useEffect` que já
    hidrata `currentHitPoints`/`temporaryHitPoints` (gate por `hasHydrated`):
    `pcCoins`, `ppCoins`, `poCoins`, `plCoins` (todos `number`, default `0`)
    e `currentVolume` (`number`, default `0`, hidratado de
    `sheet.currentVolume`).
  - `forçaAttribute` (ou nome similar): obtido de `attributes` (o array já
    calculado em `page.tsx` a partir de `melhorias`/`defeitos` do tipo
    "Atributo") via `attributes.find(a => a.label.trim().toLowerCase() ===
    'força')`, mesma técnica já usada para casar `armorClassKeyAttribute` e
    o atributo-chave de PV (`hitPointsMatchedAttribute`). O modificador de
    Força (`forçaModifier`) é `attribute.modifier ?? 0` — já vem calculado
    como `Math.floor((valor - 10) / 2)` dentro do próprio `attributes`.
  - `maxVolume = Math.max(0, 5 + forçaModifier)`.
  - `limitVolume = Math.max(0, forçaModifier + 10)`.
  - `totalCoins = pcCoins + ppCoins + poCoins + plCoins`.
  - Recalcular `currentVolume` reativamente (ex. `useEffect` que atualiza o
    state sempre que `pcCoins`/`ppCoins`/`poCoins`/`plCoins` mudam) como
    `Math.floor(totalCoins / 1000)` — a contribuição de itens do inventário
    é tratada como `0` nesta demanda (comentário no código deixando claro que
    uma futura demanda de itens somará aqui). Esse `currentVolume` recalculado
    é o mesmo state que alimenta o autosave de persistência abaixo.
  - Handler de conversão de moedas (passado como `onChange` do
    `SheetCoinsPanel`, ou 6 handlers dedicados por seta): atualiza os dois
    pares de state envolvidos na mesma operação (ex. seta PC→PP: `setPcCoins(v
    => v - 10); setPpCoins(v => v + 1)`), sempre validando saldo suficiente
    antes de aplicar (mesma validação que também desabilita o botão no
    componente, para não depender só do `disabled` da UI).

- Integrações com API:
  - `GET /sheets/:id` (já usado via `useGetEntityById<ISheet>`) — a `ISheet`
    (`app-web/src/shared/interfaces/Entities/Sheet/index.ts`) precisa
    declarar os novos campos persistidos retornados pelo backend:
    `currentVolume: number`, mais os 4 campos de moeda. Nomes sugeridos,
    seguindo o padrão em inglês já usado em `ISheet`
    (`currentHitPoints`/`temporaryHitPoints`): `pcCoins`, `ppCoins`,
    `poCoins`, `plCoins` — **confirmar contra o contrato real implementado
    pela demanda de backend (`task-api.md` / `SheetResponseDto`) antes de
    codificar**, já que os nomes exatos dos campos não estão fixados pelo
    spec e precisam bater com o DTO do app-api.
  - `PUT /sheets/:id` (via `usePutEntity`, mesmo endpoint já reusado para
    nome/level/campanha/PV) — duas novas mutations, mesmo padrão de
    `updateCurrentHitPointsMutation`/`updateTemporaryHitPointsMutation`:
    - `updateCoinsMutation`: payload com os 4 campos de moeda (podem ser
      enviados juntos num único payload, já que qualquer alteração de moeda —
      digitação ou clique de conversão — sempre mexe em pelo menos um par).
    - `updateVolumeMutation`: payload `{ currentVolume: number }`.
    - Cada uma com seu próprio `onError` mostrando toast de erro em pt-BR,
      mesmo padrão das mutations de PV.
  - Persistência via `useFieldAutosave` (delay padrão ~2,5s, o mesmo hook já
    usado para PV atual/temporário — nenhuma alteração no hook em si):
    - Uma instância de `useFieldAutosave` observando um valor composto das 4
      moedas (ex. `{ pc: pcCoins, pp: ppCoins, po: poCoins, pl: plCoins }`,
      novo objeto a cada mudança) chamando `updateCoinsMutation.mutate(...)`
      no `onSave` — cobre tanto digitação direta quanto cliques nas setas de
      conversão, já que ambos alteram os states `pcCoins`/`ppCoins`/`poCoins`/`plCoins`.
    - Uma instância separada observando `currentVolume`, chamando
      `updateVolumeMutation.mutate({ currentVolume })` — dispara em conjunto
      com o autosave de moedas (mesmo trigger de mudança), mas como
      instância independente, no mesmo espírito do comentário já existente
      em `useFieldAutosave` ("alterar um campo nunca cancela ou reinicia o
      timer de outro campo").
    - Todas as instâncias usam `enabled: hasHydrated`, igual às demais.

- Formulário/validação: não é um formulário `react-hook-form`/`zod` — segue o
  mesmo padrão inline dos demais campos numéricos da ficha (`SheetLevelField`,
  `SheetHitPointsPanel`), sem schema em `shared/formSchemas/`. Regras de
  validação client-side:
  - PC, PP, PO, PL: inteiro `>= 0`, sem teto máximo; entrada inválida
    (negativo, decimal, não numérico) é ignorada no `onChange` do buffer
    (mesma técnica de `SheetLevelField`, adaptada para aceitar `0`).
  - Conversões: cada clique move exatamente um bloco (10↔1); botão
    desabilitado (e clique ignorado como segunda camada de proteção) quando o
    saldo de origem é insuficiente.
  - `currentVolume`, `maxVolume`, `limitVolume`: nunca editados diretamente
    pelo usuário — `maxVolume`/`limitVolume` são só leitura (derivados, com
    `Math.max(0, ...)`), `currentVolume` é recalculado automaticamente a
    partir das moedas.

- Acesso Google: não aplicável — a tela de ficha não é uma listagem com
  ações de criar/editar/excluir, e nenhum campo hoje editável na ficha
  (nome, level, PV atual/temporário, atributo-chave de Classe de Armadura
  etc.) aplica qualquer restrição de somente-leitura para usuários
  `provider: 'google'`. Os novos campos de Volume/Moedas seguem o mesmo
  padrão já existente na página, sem nenhuma restrição adicional de acesso.

Status: concluído
Componentes:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetVolumePanel/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetCoinsPanel/index.tsx` (novo)
Arquivos:
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (aba "Inventário", states
  `pcCoins`/`ppCoins`/`poCoins`/`plCoins`/`currentVolume`, cálculo de
  `forçaAttribute`/`maxVolume`/`limitVolume`/`totalCoins`, `updateCoinsMutation`/
  `updateVolumeMutation`, duas novas instâncias de `useFieldAutosave`)
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts` (`ISheet` com `pc`, `pp`,
  `po`, `pl`, `loadedVolume` — nomes confirmados contra `SheetResponseDto`/
  `UpdateSheetDto` reais do app-api, divergindo dos nomes hipotéticos sugeridos
  originalmente no plano, `pcCoins`/`ppCoins`/etc.)

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Revisão feita lendo diretamente os arquivos abaixo e conferindo contra `spec.md`,
`task-web.md` (etapa "1. web-dev") e o contrato real do backend
(`app-api/src/modules/sheets/{entities/sheet.entity.ts,dto/sheet-response.dto.ts,dto/update-sheet.dto.ts}`):
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetVolumePanel/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetCoinsPanel/index.tsx`
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx`
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts`
- `app-web/src/app/(authorized)/fichas/[id]/hooks/useFieldAutosave/index.ts` (lido só
  para contexto, não alterado nesta etapa)

Conferido e correto:
- Fórmulas: `maxVolume = Math.max(0, 5 + forçaModifier)` e
  `limitVolume = Math.max(0, forçaModifier + 10)` (page.tsx:382-383), ambas com piso
  0, batendo exatamente com o spec (inclusive a correção de "modificador × 10" →
  "modificador + 10"). `currentVolume` recalculado como
  `Math.floor(totalCoins / 1000)` com `totalCoins = pcCoins + ppCoins + poCoins +
  plCoins` (page.tsx:384, 792-800), com comentário explícito sobre a contribuição de
  itens (0 nesta demanda) ficar para demanda futura.
- Setas de conversão (`SheetCoinsPanel`): cada clique converte exatamente um bloco
  (10↔1) via `handleConvertUp`/`handleConvertDown`, com dupla validação de saldo
  (guarda no handler + `disabled` no `IconButton`) e o mapeamento de `disabled`
  bate exatamente com a validação do handler (seta para cima desabilita com
  `values[origem] < 10`; seta para baixo desabilita com `values[destino] < 1`).
- `useFieldAutosave`: duas instâncias novas e independentes (moedas e volume),
  ambas com `enabled: hasHydrated`, mesmo padrão de debounce (~2,5s) das
  demais instâncias de PV/nome/nível, chamando `PUT /sheets/:id` via
  `usePutEntity<ISheet, ...>` com `invalidateQueryKeys` e `onError` com toast em
  pt-BR — consistente com o restante do arquivo.
- Contrato da API: `ISheet` usa `pc`/`pp`/`po`/`pl`/`loadedVolume`, conferido
  campo a campo contra `Sheet` entity, `SheetResponseDto` e `UpdateSheetDto` reais
  do `app-api` — nomes batem exatamente (inclusive o desvio já documentado na
  etapa 1, divergindo dos nomes hipotéticos `pcCoins`/etc. do plano original).
- Padrões do CLAUDE.md: componentes seguem a convenção local de `TextField
  variant="standard"` com buffer de string (mesmo padrão de `SheetHitPointsPanel`)
  em vez de introduzir input genérico novo; ícones via `react-icons/fi`
  (`FiPackage`, `FiDollarSign`, `FiArrowLeft`, `FiArrowRight`), sem
  `@mui/icons-material`; `IconButton` das setas tem `aria-label` em pt-BR
  descritivo (ex. "Converter 10 PC (Cobre) em 1 PP (Prata)"); `Label`
  associado a cada input de moeda via `htmlFor`/`id`; cores usadas
  (`APP_COLORS.alertRed`, `goldSoft`, `textBrownDark`, `gold`) existem em
  `shared/constants/Colors`; grid `grid-cols-1 gap-6 lg:grid-cols-2` reaproveita o
  mesmo padrão já usado na aba Estatísticas; aba "Inventário" inserida
  imediatamente após "Habilidades" e sem sub-`Tabs`, mesmo tratamento já dado a
  "estatisticas". Textos 100% em pt-BR. Nenhum uso de `any`; tipos de payload das
  mutations batem com os DTOs do backend.
- Não há campos de filtro/listagem nem ações de criar/editar/excluir nesta aba, então
  as skills `web-secao-filtros`/`web-permissao-google-readonly` não se aplicam
  (mesma conclusão já registrada na etapa 1).

Achados (não bloqueantes, apenas sugestões de baixa prioridade):
- **`app-web/src/app/(authorized)/fichas/[id]/page.tsx:374-381`** — Os identificadores
  `forçaAttribute`/`forçaModifier` usam caractere acentuado (`ç`), diferente de todo o
  resto do arquivo, que usa nomes em português sem acento para identificadores
  (`melhorias`, `defeitos`, `proficiencias`, `armorClassKeyAttribute`,
  `hitPointsMatchedAttribute` etc. — só os literais de string/label usam acento).
  Compila e funciona normalmente (não é erro), mas é uma inconsistência de convenção
  de nomenclatura em relação ao restante do arquivo.
  - Trecho: `const forçaAttribute = useMemo(...)` / `const forçaModifier = forçaAttribute?.modifier ?? 0;`
  - Sugestão: renomear para `forcaAttribute`/`forcaModifier` (sem acento), mantendo o
    mesmo padrão ASCII já usado em todos os outros identificadores do arquivo.
- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetVolumePanel/index.tsx`**
  — O par `{currentVolume}/{maxVolume}` não tem nenhum `Label` visível acima dele
  (diferente de `SheetHitPointsPanel`, que rotula "PV atual"/"PV máximo" acima dos
  valores equivalentes); só "Volume Limite" tem rótulo. Não é uma divergência do
  spec/task (que não exige rótulo aqui) nem um erro, mas fica levemente menos
  autoexplicativo para quem não conhece a convenção "carregado/máximo" à primeira
  vista.
  - Sugestão (opcional): considerar um rótulo discreto acima do par
    `currentVolume/maxVolume` (ex. "Volume Carregado / Máximo"), só por
    consistência visual com o quadro de PV — não bloqueante.

Nenhum problema de compilação, tipagem, regra de negócio, autosave, acessibilidade ou
reaproveitamento de componente foi encontrado. Aprovado.