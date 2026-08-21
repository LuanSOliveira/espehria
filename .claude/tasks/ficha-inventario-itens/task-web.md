# Task Web: Ficha - Inventário (gestão de itens)

## Contexto
Ver `.claude/tasks/ficha-inventario-itens/spec.md` (base factual desta task).

Também relevante, para não retrabalhar o que já está em produção: `.claude/tasks/
ficha-inventario/spec.md` e `.claude/tasks/ficha-inventario/task-web.md` — implementaram
a aba "Inventário" (`app-web/src/app/(authorized)/fichas/[id]/page.tsx`, `activeTab ===
'inventario'`) com os quadros `SheetVolumePanel` e `SheetCoinsPanel`
(`fichas/[id]/components/`). Esta task **não refaz** esses dois quadros — só adiciona a
nova estrutura abaixo deles e ajusta os pontos indicados na seção "Ajustes na aba
Inventário já existente" abaixo.

**Aviso de dependência de contrato**: não existe ainda um `task-api.md` para esta
demanda (`ficha-inventario-itens`) no momento deste planejamento — o backend
(entidade `sheet_inventory_items`, endpoints de adicionar/remover/equipar, coluna
`items_volume`, mudança de tipo de `loaded_volume`) ainda não foi implementado. Este
plano assume um contrato de endpoints razoável a partir da seção "Impacto no
app-api" do `spec.md` (rotas, payloads e nomes de campo abaixo marcados como
"assumido — confirmar contra o DTO real"). Antes de codificar, `web-dev` deve
confirmar esse contrato contra a implementação real do app-api (mesmo cuidado já
registrado em `ficha-inventario/task-web.md` para os nomes de `pc`/`pp`/`po`/`pl`/
`loadedVolume` de `ISheet`) e ajustar nomes/rotas conforme necessário — sem reabrir
nenhuma decisão de escopo/UX já fechada no `spec.md`.

## Etapas

### 1. web-dev

#### Componentes

Todos os componentes abaixo são específicos da página `fichas/[id]`, ficam em
`app-web/src/app/(authorized)/fichas/[id]/components/` (skill `web-componentes`) e
seguem o padrão local já usado por `SheetTrainingsPanel`/`SheetCharacteristicsPanel`:
recebem dados e mutations já prontos via props (dados/mutations vêm de um hook
dedicado chamado em `page.tsx`, ver "Funcionalidade" — os componentes não chamam
`useGetEntityList`/`usePostEntity` diretamente).

##### Mapa das 8 categorias (referência para todo o resto do plano)

| Categoria    | Slug web       | Endpoint catálogo | Interface  | FormSchema               | `<X>CreateForm`         | `<X>View`            | `<X>FilterSection`         | Ganha `volume` nesta task? |
|--------------|-----------------|--------------------|------------|---------------------------|---------------------------|-------------------------|-------------------------------|------------------------------|
| Utilitários  | `utilitarios`  | `/utilities`       | `IUtility`   | `utilityFormSchema`      | `UtilityCreateForm`      | `UtilityView`         | `UtilitiesFilterSection`    | Sim (novo)                  |
| Consumíveis  | `consumiveis`  | `/consumables`     | `IConsumable`| `consumableFormSchema`   | `ConsumableCreateForm`   | `ConsumableView`      | `ConsumablesFilterSection`  | Sim (novo)                  |
| Materiais    | `materiais`    | `/materials`       | `IMaterial`  | `materialFormSchema`     | `MaterialCreateForm`     | `MaterialView`        | `MaterialsFilterSection`    | Sim (novo)                  |
| Munições     | `municoes`     | `/ammunition`      | `IAmmunition`| `ammunitionFormSchema`   | `AmmunitionCreateForm`   | `AmmunitionView`      | `AmmunitionFilterSection`   | Sim (novo)                  |
| Armas        | `armas`        | `/weapons`         | `IWeapon`    | `weaponFormSchema`       | `WeaponCreateForm`       | `WeaponView`          | `WeaponsFilterSection`      | Já tem                      |
| Armaduras    | `armaduras`    | `/armors`          | `IArmor`     | `armorFormSchema`        | `ArmorCreateForm`        | `ArmorView`            | `ArmorsFilterSection`       | Já tem                      |
| Acessórios   | `acessorios`   | `/accessories`     | `IAccessory` | `accessoryFormSchema`    | `AccessoryCreateForm`    | `AccessoryView`       | `AccessoriesFilterSection`  | Sim (novo)                  |
| Escudos      | `escudos`      | `/shields`         | `IShield`    | `shieldFormSchema`       | `ShieldCreateForm`       | `ShieldView`           | `ShieldsFilterSection`      | Já tem                      |

Ordem de exibição em "Carregados": Utilitários, Consumíveis, Materiais, Munições,
Armas, Armaduras, Acessórios, Escudos. Em "Equipados": Armas, Armaduras, Acessórios,
Escudos (só essas 4 têm `equipped`/ações de equipar).

##### 1. `SheetInventoryItemsSection` (orquestrador)

- Local: `fichas/[id]/components/SheetInventoryItemsSection`.
- Renderizado logo abaixo de `SheetVolumePanel`/`SheetCoinsPanel` dentro do bloco
  `activeTab === 'inventario'` de `page.tsx` (fora do grid de 2 colunas dos dois
  quadros — ocupa a largura toda, mesmo padrão de bloco full-width já usado para
  `SheetSkillsPanel`/`SheetKnowledgesPanel` abaixo do grid de CA/Resistências na aba
  Estatísticas).
- Props: `sheetId: string`, `items: ISheetInventoryItem[]` (lista completa, já
  carregada), `isLoadingItems: boolean`, `itemsVolumeTotal: number` e `limitVolume:
  number` (para a validação de volume ao adicionar — ambos calculados/repassados por
  `page.tsx`/pelo hook dedicado), mais as mutations de adicionar/remover/equipar/
  desequipar (ver "Funcionalidade").
- Comportamento:
  - Duas `Tabs` internas (mesmo `SHEET_TABS_SX` já usado no resto da página):
    "Carregados" e "Equipados".
  - Dentro de cada uma, uma segunda `Tabs` (sub-abas) por categoria, na ordem da
    tabela acima (8 em Carregados, 4 em Equipados). Cada `Tab` mostra um contador de
    cards entre parênteses (ex. `Armas (3)`), calculado como:
    - Carregados: `items.filter(i => i.category === categoria).length`.
    - Equipados: `items.filter(i => i.category === categoria && i.equipped).length`.
  - Corpo de cada sub-aba: grid de `SheetInventoryItemCard` (`grid grid-cols-1 gap-4
    sm:grid-cols-2 lg:grid-cols-3`, mesmo espírito de grid responsivo já usado no
    restante da página) filtrando `items` pela categoria ativa (e por `equipped` só
    quando a aba pai é "Equipados"). Estado vazio: `DefaultText` "Nenhum item
    adicionado nesta categoria." (mesma mensagem em pt-BR do padrão de listagem vazia
    da skill `web-tabela-listagem`, adaptada de tabela para grid de cards).
  - Botão "Adicionar" (`PrimaryButton`, ícone `FiPlus`) visível **só na aba
    "Carregados"**, oculto para `useIsGoogleUser()` (skill
    `web-permissao-google-readonly` — ação de criar). Abre `SheetInventoryAddChoiceModal`
    para a categoria da sub-aba ativa.
  - Guarda os estados de qual modal está aberto (escolha, formulário avulso, seletor
    de catálogo, quantidade de adicionar, quantidade de remover + confirmação,
    visualização) e orquestra a sequência descrita em "Funcionalidade".

##### 2. `SheetInventoryItemCard`

- Local: `fichas/[id]/components/SheetInventoryItemCard`.
- Props: `item: ISheetInventoryItem`, `onView: (item) => void`, `onRemove: (item) =>
  void`, `onEquip: (item) => void`, `onUnequip: (item) => void`.
- Comportamento: card (`Card` de `shared/components/Containers`) com:
  - Imagem via `ImageAvatarPreview` (já resolve fallback de "sem imagem" com
    `FiImage` — reaproveitado como está) **ou**, quando quiser um ícone mais
    específico da categoria em vez do genérico `FiImage` de `ImageAvatarPreview`, um
    pequeno mapeamento local `categoria → ícone de react-icons/fi` (ex.: `FiTool`
    para Utilitários, `FiDroplet` para Consumíveis, `FiLayers` para Materiais,
    `FiTarget` para Munições, `FiShield` para Armaduras/Escudos, `FiZap` para Armas,
    `FiStar`/ícone equivalente para Acessórios — escolha final dos ícones a critério
    de `web-dev` dentro do subconjunto `react-icons/fi`, skill `web-icones`) usado
    apenas quando `item.snapshot.referenceImage` está vazio.
  - Nome (`item.snapshot.name`), volume unitário (`item.unitVolume`) e quantidade
    (`item.quantity`), via `Label`/`DefaultText`.
  - Ações (`IconButton` + `Tooltip`, `aria-label` em pt-BR, mesmo padrão de
    `WeaponsListItem`):
    - "Visualizar" (`FiEye`) — sempre visível, chama `onView`.
    - "Remover" (`FiTrash2`) — oculto para `useIsGoogleUser()`, chama `onRemove`.
    - "Equipar" (`FiCheckCircle` ou similar) — só para as 4 categorias
      equipáveis e quando `!item.equipped`; oculto para `useIsGoogleUser()`.
    - "Desequipar" (`FiXCircle` ou similar) — só para as 4 categorias equipáveis e
      quando `item.equipped`; oculto para `useIsGoogleUser()`.
    - "Equipar"/"Desequipar" nunca aparecem juntos (mutuamente exclusivos conforme
      `item.equipped`), e nenhum dos dois aparece para as 4 categorias não
      equipáveis (Utilitários, Consumíveis, Materiais, Munições).

##### 3. `SheetInventoryAddChoiceModal`

- Local: `fichas/[id]/components/SheetInventoryAddChoiceModal`.
- Props: `open: boolean`, `onClose: () => void`, `onChooseStandalone: () => void`,
  `onChooseExisting: () => void`.
- Comportamento: modal simples (reaproveita o `Dialog`/`Card` no mesmo espírito de
  `ConfirmationModal`, mas com duas ações em vez de confirmar/cancelar) perguntando
  "Item avulso (novo)" vs. "Item existente (do catálogo)", cada opção como
  `SecondaryButton`/`PrimaryButton` chamando o respectivo callback.

##### 4. `Sheet<X>StandaloneForm` (8 componentes, um por categoria)

- Local: `fichas/[id]/components/Sheet<X>StandaloneForm` (ex.:
  `SheetWeaponStandaloneForm`, `SheetUtilityStandaloneForm`, etc.).
- Props: `onSubmit: (data: <X>FormData) => void` (não recebe `onSaved` nem chama
  `usePostEntity`/`usePutEntity` — não persiste no catálogo).
- Comportamento: replica **exatamente** o mesmo layout/campos/validação do
  `<X>CreateForm` correspondente (mesmo `<x>FormSchema`/`<x>FormResolver`/
  `<x>FormDefaultValues` de `shared/formSchemas`, mesmos `FormTextInput`/
  `FormAutocompleteInput`/`FormMultiAutocompleteInput`/`FormCheckboxInput`/
  `FormRichTextInput`, mesmas grids `sm:grid-cols-2 lg:grid-cols-4` da skill
  `web-form-cadastro`), **sem** os dois `usePostEntity`/`usePutEntity` do
  `<X>CreateForm` e sem a store `useSelected<X>Store` (aqui não existe modo
  edição — é sempre um item novo). No `handleSubmit(onSubmit)`, `onSubmit` é a prop
  recebida (o componente pai monta o snapshot + segue para a etapa de quantidade),
  em vez de chamar uma mutation.
  - Para Utilitários, Consumíveis, Materiais, Munições e Acessórios: campos iguais
    ao `<X>CreateForm` atual + o novo campo `volume` (mesmo padrão de input já usado
    em `WeaponCreateForm`/`ArmorCreateForm`/`ShieldCreateForm`: `FormTextInput`
    `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode:
    'decimal' } }}`, label "Volume") — ver também a subseção "Volume nas 5
    categorias" abaixo, que cobre o mesmo campo no `<X>CreateForm` do catálogo.
  - Para Armas: mesmos campos de `WeaponCreateForm`, incluindo `WeaponTraitsField`
    e `WeaponDamagesField` (traços, dano principal/alternativo/extra) e
    `EmbeddedEffectsField` (encantamentos/aprimoramentos).
  - Para Armaduras: mesmos campos de `ArmorCreateForm`, incluindo `ArmorTraitsField`
    e `EmbeddedEffectsField`.
  - Para Escudos: mesmos campos de `ShieldCreateForm`, incluindo
    `EmbeddedEffectsField` (sem campo de traços — `ShieldCreateForm` não tem).
  - **Ponto de atenção para `web-dev`**: `WeaponTraitsField`, `WeaponDamagesField` e
    `ArmorTraitsField` hoje vivem em `armas/components/` e `armaduras/components/`
    (específicos da página de catálogo daquela categoria, skill `web-componentes`).
    A partir desta task, dois formulários distintos por categoria (o `<X>CreateForm`
    do catálogo e o novo `Sheet<X>StandaloneForm` da ficha) passam a precisar do
    mesmo campo. Avaliar promover esses 3 campos para `shared/components/` (ou uma
    pasta comum, ex. `shared/components/EquipmentFields/`), generalizando a
    tipagem hoje acoplada a `WeaponFormData`/`ArmorFormData` para um tipo de campo
    de formulário genérico — em vez de duplicar a lógica de "lista de traços"/"lista
    de danos" nos dois lugares. Se a promoção for feita, revisar se `WeaponCreateForm`/
    `ArmorCreateForm` continuam funcionando sem alteração de comportamento
    (mudança é só de local do arquivo).

##### 5. `Sheet<X>CatalogPickerModal` (8 componentes, um por categoria)

- Local: `fichas/[id]/components/Sheet<X>CatalogPickerModal` (ex.:
  `SheetWeaponCatalogPickerModal`).
- Props: `open: boolean`, `onClose: () => void`, `onSelect: (catalogItem: I<X>) =>
  void`.
- Comportamento: modal (`ViewModal`/`Dialog` `size="wide"`) com:
  - `<X>FilterSection` reaproveitado tal qual (mesmos props/estado de filtro que a
    página de catálogo já usa — skill `web-secao-filtros`), com estado de
    filtro/paginação local ao modal (`useState` + `useGetEntityList<I<X>ListItem,
    I<X>ListFilters>({ url: '/<endpoint>', filters })`, mesmo hook/endpoint do
    catálogo da categoria).
  - Listagem dos resultados como uma nova tabela leve específica deste modal (mesma
    estrutura shell + linha da skill `web-tabela-listagem`: `TableContainer`/
    `Table`/`TableHead`/`TableBody`/`TablePagination`), reaproveitando
    `ImageAvatarPreview`/`DefaultText`/`TagBadge` para as células — **não** reaproveita
    `<X>List`/`<X>ListItem` tal qual, porque essas colunas de ação são
    editar/excluir (CRUD do catálogo), enquanto aqui a única ação por linha é
    "Selecionar" (`IconButton`/`PrimaryButton` chamando `onSelect(item)` com o item
    completo — como o formulário/`View` precisam de todos os campos, não só os do
    `<X>ListItem` resumido, `onSelect` deve buscar o detalhe completo via
    `GET /<endpoint>/:id` antes de repassar adiante, ou o componente pai faz esse
    fetch ao receber o `id` selecionado — decisão de implementação de `web-dev`,
    qualquer uma das duas resolve).
  - Ao selecionar, fecha o modal e aciona a etapa de quantidade, com o item do
    catálogo já resolvido.

##### 6. `SheetInventoryQuantityModal`

- Local: `fichas/[id]/components/SheetInventoryQuantityModal`.
- Props: `open: boolean`, `mode: 'add' | 'remove'`, `itemName: string`, `unitVolume:
  number`, `maxQuantity?: number` (obrigatório em `mode="remove"`, = quantidade atual
  do card), `currentLoadedVolume: number`, `limitVolume: number`, `onConfirm:
  (quantity: number) => void`, `onCancel: () => void`, `isLoading?: boolean`.
- Comportamento: `FormModal`-like simples (ou `Dialog`/`Card` direto) com um
  `DefaultTextInput` numérico inteiro `>= 1` (buffer de string local, mesmo padrão
  de `SheetLevelField`/`SheetCoinsPanel`, sem decimal). Em `mode="remove"`, o input
  tem `max={maxQuantity}` e mensagem de ajuda "Máximo: {maxQuantity}".
  Em `mode="add"`, calcula reativamente `volumeAdicional = unitVolume * quantity` e
  `novoVolumeCarregado = currentLoadedVolume + volumeAdicional` (soma **sem
  arredondamento**, valor decimal exato); se `novoVolumeCarregado > limitVolume`,
  desabilita o botão de confirmar e exibe mensagem inline em pt-BR: "Não é possível
  adicionar essa quantidade: o volume ultrapassaria o Volume Limite da ficha
  ({limitVolume})." — mesma dupla validação já usada em `SheetCoinsPanel` (guarda no
  handler + `disabled` no botão), cobrindo o caso de o botão ainda não estar
  desabilitado por algum motivo. Ao confirmar (`mode="add"`), chama `onConfirm(quantity)`
  diretamente — não há uma segunda confirmação para adicionar (a própria validação de
  volume já é o "gate"). Ao confirmar (`mode="remove"`), **não** chama a mutation
  diretamente: fecha este modal e abre o `ConfirmationModal` genérico
  (`shared/components/Modals`) com a mensagem "Tem certeza que deseja remover
  {quantity} unidade(s) de \"{itemName}\"?", só chamando a mutation de remoção no
  `onConfirm` desse `ConfirmationModal` (fluxo de 2 passos pedido no spec: "quantidade
  → confirmação").

##### 7. Adaptação dos 8 `<X>View` existentes (não são componentes novos — são alterações)

- Local: `<categoria>/components/<X>View/index.tsx` de cada uma das 8 categorias
  (fora de `fichas/[id]/`, mas dentro do escopo desta task por serem reaproveitados
  pelo modal de visualização do inventário).
- Hoje cada `<X>View` recebe só `<x>Id: string` e busca os dados via
  `useGetEntityById<I<X>>({ url: '/<endpoint>/:id' })` (ver `WeaponView`). Isso
  não funciona para um item de inventário, que não tem (nem deve ter) vínculo vivo
  com um registro de catálogo.
- Adaptação: cada `<X>View` passa a aceitar **dois modos mutuamente exclusivos**,
  como uma união de props (ex.: `{ weaponId: string } | { weapon: I<X> }`) — quando o
  modo com o dado já resolvido é usado, o componente **pula** a chamada
  `useGetEntityById` e renderiza direto a partir do objeto recebido. Layout, campos
  exibidos, ícones e textos permanecem idênticos ao modo atual — muda só a origem
  do dado (skill relevante: reaproveitar em vez de duplicar layout).
  - O modo `<x>Id` continua sendo usado exatamente como hoje pela página de catálogo
    da categoria (`<categoria>/page.tsx`) — nenhuma mudança de comportamento lá.
  - O novo modo recebe o **snapshot** do item de inventário (ver
    `ISheetInventoryItem['snapshot']` em "Funcionalidade") — que precisa ter o
    mesmo formato de campos que `I<X>` já expõe hoje (nome, imagem, descrição,
    preço/moeda, tags, informações privadas, volume, e os campos específicos da
    categoria como traços/dano/encantamentos/aprimoramentos/categoria de armadura/
    etc.), só que com toda referência hoje viva (moeda, tipo de dano, grau de
    tamanho, traços, tags) já resolvida como valor copiado em vez de objeto vindo
    de uma query separada — o que já é exatamente a forma como o backend descreve o
    snapshot em `spec.md`.
  - `onNotFound` (usado hoje só no modo `<x>Id`, para menções órfãs) não se aplica
    ao modo snapshot — o item de inventário não pode "não ser encontrado" no
    catálogo, ele é auto-contido.

#### Funcionalidade

##### Ajustes na aba Inventário já existente (Volume/Moedas)

Ponto de atenção sinalizado pelo orquestrador: hoje (`ficha-inventario`,
`page.tsx`) `currentVolume` é um **state local hidratado uma única vez** de
`sheet.loadedVolume` (gate `hasHydrated`) e recalculado só a partir das moedas
(`Math.floor(totalCoins / 1000)`), depois persistido de volta via
`updateVolumeMutation`/`useFieldAutosave` dedicado. Isso deixa de fazer sentido
nesta demanda, porque `loadedVolume` passa a ser recomputado **pelo backend** (
`floor(moedas_total / 1000) + items_volume`, decimal, sem arredondamento) sempre
que moedas OU itens mudam — se o client continuar sendo dono de `currentVolume` e
só reagir a moedas, qualquer alteração feita pelos itens (adicionar/remover) nunca
apareceria no quadro "Volume" sem recarregar a página inteira (o `useEffect` de
hidratação só roda uma vez, antes de `hasHydrated` virar `true`).

Ajuste necessário em `page.tsx`:
- Remover o `useState` de `currentVolume`, a mutation `updateVolumeMutation`, o
  `useEffect` que recalculava `currentVolume` a partir de `totalCoins`, e a
  instância de `useFieldAutosave` que salvava `currentVolume`.
- `SheetVolumePanel` passa a receber `currentVolume={sheet.loadedVolume ?? 0}`
  **direto do resultado de `useGetEntityById<ISheet>`** (a mesma variável `sheet`
  já usada no restante do arquivo), em vez do state local — mesmo espírito de
  `maxHitPoints`/`armorClassTotal`, que já são valores derivados/lidos direto da
  query, nunca hidratados uma única vez.
- Isso funciona porque toda mutation que altera moedas (`updateCoinsMutation`,
  inalterada) ou itens de inventário (novas mutations do
  `useSheetInventoryItems`) já invalida `[\`/sheets/${sheetId}\`]` em
  `invalidateQueryKeys` — o refetch subsequente traz o `loadedVolume` já
  recomputado pelo backend, sem o client precisar calcular ou persistir esse valor
  por conta própria nunca mais.
- `ISheet` (`shared/interfaces/Entities/Sheet/index.ts`) ganha um campo novo
  `itemsVolume?: number` (assumido — confirmar nome exato contra o DTO real do
  app-api) só para completude do contrato; não é consumido diretamente pela UI
  (o quadro "Volume" só usa `loadedVolume`/`maxVolume`/`limitVolume`, como hoje).
- O quadro "Moedas" (`SheetCoinsPanel`) e sua mutation (`updateCoinsMutation`) **não
  mudam** — mesmo autosave/debounce/payload de hoje.

##### Novo hook `useSheetInventoryItems`

- Local: `fichas/[id]/hooks/useSheetInventoryItems`, chamado em `page.tsx` (mesmo
  padrão de `useSheetAbilities`: hook dedicado que concentra query + mutations de
  uma área da ficha e devolve tudo pronto para os componentes de apresentação).
- Query: `GET /sheets/:id/inventory-items` (assumido — confirmar rota exata),
  via `useGetEntityById<ISheetInventoryItem[]>({ url: `/sheets/${sheetId}/inventory-items` })`
  — lista completa e não paginada de todos os itens da ficha, todas as categorias,
  já com `category`/`equipped`/`quantity`/`unitVolume`/`snapshot` — o agrupamento
  por categoria e por `equipped` é feito no client (`.filter`), sem endpoint
  separado por categoria.
- Deriva `itemsVolumeTotal = items.reduce((sum, item) => sum + item.unitVolume *
  item.quantity, 0)` (soma decimal exata, sem arredondar) — usado só para a
  validação client-side no `SheetInventoryQuantityModal` (mode="add"); o valor
  persistido (`items_volume`) continua sendo autoridade do backend.
- Mutations (todas invalidando `[['/sheets'], [\`/sheets/${sheetId}\`],
  [\`/sheets/${sheetId}/inventory-items\`]]`, já que qualquer uma delas altera tanto
  a lista de itens quanto `loadedVolume`/`itemsVolume` da ficha):
  - `addInventoryItemMutation` — `POST /sheets/:id/inventory-items` (assumido).
    Payload único para os dois fluxos (avulso e existente), já que o client monta o
    mesmo formato de snapshot nos dois casos: `{ category: ISheetInventoryItemCategory,
    quantity: number, snapshot: <mesmo formato de I<X> do catálogo, sem id> }`. Ao
    escolher "existente", o snapshot é montado a partir do item de catálogo já
    completo (buscado no `Sheet<X>CatalogPickerModal`), copiando os mesmos campos
    que o formulário avulso enviaria — o client nunca envia um `catalogId`/FK viva,
    reforçando que não existe vínculo permanente. `onError`: toast com a mensagem
    de erro da API (inclui o caso de bloqueio por volume, mesma mensagem do
    backend) ou fallback em pt-BR "Não foi possível adicionar o item ao
    inventário."
  - `removeInventoryItemMutation` — endpoint de remoção parcial/total (assumido:
    `PATCH /sheets/:id/inventory-items/:itemId`, payload `{ quantityToRemove:
    number }`). `onSuccess`: toast "Item removido do inventário com sucesso.".
    `onError`: fallback "Não foi possível remover o item do inventário.".
  - `equipInventoryItemMutation` / `unequipInventoryItemMutation` — endpoints de
    alternância (assumido: `PATCH /sheets/:id/inventory-items/:itemId/equip` e
    `/unequip`, sem payload). `onSuccess`: toast "Item equipado com sucesso."/"Item
    desequipado com sucesso.". `onError`: fallback correspondente em pt-BR.
- Todas as respostas de mutation devolvem a ficha recalculada (`ISheetInventoryItemMutationResult
  { sheet: ISheet; item: ISheetInventoryItem | null }`, item `null` quando a
  remoção zera a quantidade) — não é necessário tratamento especial no client além
  de deixar o `invalidateQueryKeys` acima trazer a lista/ficha atualizadas via
  refetch (mesmo padrão simples já usado por `updateNameMutation` etc. em
  `page.tsx`, sem `setQueryData` manual).

##### Novas interfaces (`shared/interfaces/Entities/SheetInventoryItem/index.ts`)

- `ISheetInventoryItemCategory` — union das 8 categorias (`'utility' |
  'consumable' | 'material' | 'ammunition' | 'weapon' | 'armor' | 'accessory' |
  'shield'`, nomes assumidos — confirmar contra o enum/string real do backend).
- `ISheetInventoryItem` — `{ id: string; category: ISheetInventoryItemCategory;
  quantity: number; equipped: boolean; unitVolume: number; snapshot: I<X> (uma das
  8 interfaces de catálogo já existentes, sem `id`/`createdAt`/`updatedAt`) }` — o
  `snapshot` reaproveita exatamente as interfaces `IWeapon`/`IArmor`/`IUtility`/etc.
  já existentes em vez de criar 8 tipos novos, já que o formato de campos exibidos é
  o mesmo (só a origem dos dados muda, conforme item de adaptação do `<X>View`
  acima).
- `ISheetInventoryItemMutationResult` — `{ sheet: ISheet; item: ISheetInventoryItem
  | null }`.
- Nomes de campos acima (`unitVolume`, `equipped`, `snapshot`, `quantityToRemove`
  etc.) são sugestões consistentes com o padrão em inglês já usado em `ISheet`
  (`currentHitPoints`, `loadedVolume`) — confirmar contra o DTO real do app-api
  antes de codificar, sem alterar o comportamento/UX planejado aqui caso os nomes
  mudem.

##### Volume nas 5 categorias sem esse campo (catálogo)

Fora da ficha, os 5 `<X>CreateForm`/`<x>FormSchema` do catálogo (Utilitários,
Consumíveis, Materiais, Munições, Acessórios) ganham o campo `volume`, no mesmo
padrão decimal já usado em `WeaponCreateForm`/`ArmorCreateForm`/`ShieldCreateForm`:
- Schema (`shared/formSchemas/<X>FormSchema/index.ts`): novo campo `volume: z
  .string().refine((v) => v === '' || /^\d+(\.\d)?$/.test(v), 'Informe um volume
  válido (no máximo 1 casa decimal)')`, com `''` no default values — mesma regra
  exata já usada em `weaponFormSchema`.
- `<X>CreateForm`: novo `FormTextInput` "Volume" (`type="number"`, `slotProps={{
  htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}`), na mesma grid de 4
  colunas dos demais campos "padrão", e inclusão de `volume: data.volume ?
  Number(data.volume) : null` no payload de criar/editar.
- `<X>View`: novo bloco "Volume" (`FiPackage` + `Label`/`DefaultText`, mesmo padrão
  visual já usado em `WeaponView`), exibindo `<x>.volume ?? 'Não informado'`.
- `I<X>`/`I<X>ListItem` (`shared/interfaces/Entities/<X>/index.ts`): novo campo
  `volume?: number | null`.
- Isso vale para as 5 interfaces/schemas/CreateForm/View de Utilitários,
  Consumíveis, Materiais, Munições e Acessórios — Armas/Armaduras/Escudos já têm
  esse campo e não são alterados aqui.

##### Fluxo de adicionar item (por sub-aba de categoria, dentro de "Carregados")

1. `SheetInventoryItemsSection` abre `SheetInventoryAddChoiceModal`.
2. Escolha "Item avulso": abre `Sheet<X>StandaloneForm` (dentro de um `FormModal`
   `size="wide"`, título "Novo item avulso — {Categoria}") para a categoria da
   sub-aba ativa. Ao submeter (validado pelo `<x>FormSchema`), monta o snapshot a
   partir do `<X>FormData` (mesma conversão string→número/undefined já usada nos
   `buildPayload` dos `<X>CreateForm` de catálogo) e segue para o passo 3.
3. Escolha "Item existente": abre `Sheet<X>CatalogPickerModal` da categoria ativa.
   Ao selecionar um item do catálogo, monta o snapshot a partir do item completo
   selecionado (mesmos campos do formulário avulso) e segue para o passo 3.
4. Abre `SheetInventoryQuantityModal` (`mode="add"`), com `unitVolume` = volume do
   snapshot montado, `currentLoadedVolume` = `sheet.loadedVolume ?? 0` e
   `limitVolume` (calculado em `page.tsx`, já existente). Validação de volume
   conforme descrito no componente acima.
5. Ao confirmar (sem bloqueio de volume), chama `addInventoryItemMutation.mutate({
   category, quantity, snapshot })`. Sucesso: toast "Item adicionado ao inventário
   com sucesso.", fecha todos os modais do fluxo, lista/quadro de Volume atualizam
   sozinhos via refetch (`invalidateQueryKeys`). Falha (inclusive rejeição de
   volume pelo backend, caso o estado client estivesse desatualizado): toast com a
   mensagem de erro da API.

##### Fluxo de remover item

1. Card → "Remover" → `SheetInventoryQuantityModal` (`mode="remove"`,
   `maxQuantity=item.quantity`).
2. Ao confirmar a quantidade → `ConfirmationModal` genérico ("Tem certeza que
   deseja remover {quantity} unidade(s) de \"{nome}\"?").
3. Ao confirmar → `removeInventoryItemMutation.mutate({ itemId: item.id,
   quantityToRemove: quantity })`. Sucesso: toast, fecha modais; se a quantidade
   removida igualar a quantidade total, o card desaparece automaticamente (a lista
   vem da mesma query invalidada — o item removido não está mais nela).

##### Fluxo de equipar/desequipar

- Card → "Equipar"/"Desequipar" → chama diretamente
  `equipInventoryItemMutation.mutate({ itemId: item.id })` /
  `unequipInventoryItemMutation.mutate({ itemId: item.id })`, sem modal de
  confirmação (ação reversível e não destrutiva, mesmo padrão de outras ações de
  alternância de estado já existentes na ficha, ex.: preencher/esvaziar slot de
  treinamento em `SheetTrainingsPanel`). Sucesso: toast; o card correspondente
  passa a aparecer/desaparecer da aba "Equipados" automaticamente (mesma lista
  filtrada por `equipped`), permanecendo em "Carregados" o tempo todo.

##### Fluxo de visualizar item

- Card → "Visualizar" → abre `ViewModal` (`size="wide"`, título "Detalhes de
  {Categoria}") renderizando o `<X>View` correspondente à categoria do item, no
  modo snapshot (`<x>={item.snapshot}`, sem `<x>Id`) — mesmo componente/layout já
  usado no catálogo, ver adaptação descrita em "Componentes".

##### Integrações com API (resumo)

- `GET /sheets/:id/inventory-items` (assumido) — lista de itens da ficha.
- `POST /sheets/:id/inventory-items` (assumido) — adicionar (avulso ou existente,
  mesmo payload).
- `PATCH /sheets/:id/inventory-items/:itemId` (assumido) — remover
  parcial/total.
- `PATCH /sheets/:id/inventory-items/:itemId/equip` /
  `/unequip` (assumido) — alternar equipado.
- `GET /<endpoint-da-categoria>/:id` e listagem paginada `GET
  /<endpoint-da-categoria>` (já existentes, 8 endpoints de catálogo) — usados pelo
  `Sheet<X>CatalogPickerModal` (skill `web-integracao-api`, mesmo hook
  `useGetEntityList`/`useGetEntityById` já usado pelas páginas de catálogo).
- `PUT /sheets/:id` (já existente, `updateCoinsMutation`) — inalterado.
- Todos os `POST`/`<X>`/`PUT` de catálogo das 5 categorias que ganham `volume`
  (`/utilities`, `/consumables`, `/materials`, `/ammunition`, `/accessories`) —
  payload passa a incluir `volume`.

##### Formulário/validação

- `Sheet<X>StandaloneForm`: mesmo schema/validação zod do `<X>FormSchema` do
  catálogo correspondente (skill `web-form-schema`, sem alteração nas regras —
  só reaproveitado num componente que não persiste no catálogo).
- Os 5 `<x>FormSchema` do catálogo (Utilitários, Consumíveis, Materiais,
  Munições, Acessórios): novo campo `volume`, mesma regra de
  `weaponFormSchema.volume` (opcional, decimal com até 1 casa).
- `SheetInventoryQuantityModal`: quantidade inteira `>= 1`; em `mode="remove"`,
  adicionalmente `<= maxQuantity`; em `mode="add"`, bloqueio (não é erro de campo,
  é mensagem de bloqueio + botão desabilitado) quando `unitVolume * quantity +
  currentLoadedVolume > limitVolume`.

##### Acesso Google

Listagem de itens com ações de criar/editar/excluir (aqui: adicionar/remover) —
segue o padrão default da skill `web-permissao-google-readonly`:
- Botão "Adicionar" (`SheetInventoryItemsSection`): oculto para `provider:
  'google'`.
- Ação "Remover" (`SheetInventoryItemCard`): oculta para `provider: 'google'`.
- Ações "Equipar"/"Desequipar" (`SheetInventoryItemCard`): tratadas como ações de
  edição de estado do item — ocultas para `provider: 'google'`, mesmo critério das
  demais ações mutáveis (a task não pede nenhum comportamento diferente para
  elas).
- Ação "Visualizar": sempre visível, nunca oculta.
- Isso é adicional às restrições que já existem hoje na tela de ficha: nada muda
  no padrão já aplicado ao restante de `fichas/[id]/page.tsx`.

Status: concluído
Componentes: app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemsSection, SheetInventoryItemCard, SheetInventoryAddChoiceModal, SheetInventoryQuantityModal, Sheet{Utility,Consumable,Material,Ammunition,Weapon,Armor,Accessory,Shield}StandaloneForm (8), Sheet{Utility,Consumable,Material,Ammunition,Weapon,Armor,Accessory,Shield}CatalogPickerModal (8); adaptação (não criação) dos 8 <X>View existentes em app-web/src/app/(authorized)/{utilitarios,consumiveis,materiais,municoes,armas,armaduras,acessorios,escudos}/components/<X>View para aceitar modo snapshot além do modo <x>Id
Arquivos: app-web/src/app/(authorized)/fichas/[id]/page.tsx (currentVolume lido direto de sheet.loadedVolume, sem state/mutation/autosave locais; SheetInventoryItemsSection integrada); app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts; app-web/src/app/(authorized)/fichas/[id]/data/index.ts (SHEET_INVENTORY_CATEGORIES/SHEET_INVENTORY_EQUIPABLE_CATEGORIES); app-web/src/shared/interfaces/Entities/SheetInventoryItem/index.ts; app-web/src/shared/interfaces/Entities/Sheet/index.ts (itemsVolume); app-web/src/hooks/Queries/EntityQueries/{useRemoveSheetInventoryItemMutation,useEquipSheetInventoryItemMutation,useUnequipSheetInventoryItemMutation}/index.ts + barrel; app-web/src/shared/formSchemas/{Utility,Consumable,Material,Ammunition,Accessory}FormSchema (campo volume); app-web/src/app/(authorized)/{utilitarios,consumiveis,materiais,municoes,acessorios}/components/<X>CreateForm (campo volume) e <X>View (bloco Volume); app-web/src/shared/interfaces/Entities/{Utility,Consumable,Material,Ammunition,Accessory}/index.ts (campo volume). Contrato de API auditado e confirmado contra app-api/src/modules/sheets/{dto,entities,enums}/*inventory* e sheets.controller.ts (rotas reais: GET /sheets/:id/inventory-items com {counts,items}, POST /sheets/:id/inventory-items com {category,quantity,catalogItemId|customData}, POST /sheets/:id/inventory-items/:itemId/remove com {quantity}, PUT .../equip e .../unequip; mutações retornam {sheet, inventory}) — toda a implementação em disco já usa esse contrato real, não o "assumido" original do plano. Nenhuma pendência identificada.

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Revisão feita contra `task-web.md`, `spec.md` e o contrato real do backend
(`app-api/src/modules/sheets/{dto,entities,enums}/*inventory*`,
`sheets.controller.ts`). O ponto de maior risco da task — regressão do autosave de
moedas e sincronização do quadro Volume — foi conferido em detalhe em `page.tsx` e
está correto: `currentVolume`/`updateVolumeMutation`/o `useEffect` de moedas→volume e
o `useFieldAutosave` dedicado foram removidos por completo (nenhuma referência
residual encontrada), `SheetVolumePanel` agora lê `sheet.loadedVolume ?? 0` direto da
query, e `updateCoinsMutation`/`coinsValues`/`useFieldAutosave` de moedas permanecem
exatamente como estavam. `loadedVolume`/`itemsVolume` são tratados como decimal em
toda a superfície revisada (nenhum `parseInt`/`Math.round`/`toFixed(0)` encontrado);
`SheetInventoryQuantityModal` soma e compara o volume sem arredondar. Os 8 `<X>View`
foram adaptados corretamente para a união `{ xId } | { x }` (todos os 8 seguem o
mesmo padrão, `enabled: !resolved<X>` evita o `GET` no modo snapshot) e o modo
`xId` usado pelas 8 páginas de catálogo não foi alterado (confirmado via grep — todas
continuam chamando só com `<x>Id`). O campo `volume` foi adicionado de forma
consistente nas 5 categorias (schema zod, defaultValues, `CreateForm`, `View`,
interface `I<X>`/`I<X>ListItem`) e replicado nos 8 `Sheet<X>StandaloneForm`. Barrels
(`shared/interfaces/Entities/index.ts`, `hooks/Queries/EntityQueries/index.ts`) estão
atualizados. Não foram encontrados sinais de truncamento/inconsistência entre as duas
sessões de implementação (imports não usados, componentes duplicados ou tipos
divergentes entre os 8 conjuntos StandaloneForm/CatalogPickerModal/View).

Achados:

- **[Média] `app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts:65-66,155-156` e `page.tsx`** — erro de carregamento do inventário não é exposto ao usuário. O hook expõe `isInventoryError`/`inventoryError` (retorno de `GET /sheets/:id/inventory-items`), mas nem `page.tsx` nem `SheetInventoryItemsSection` os consultam. Se essa query falhar, a UI mostra silenciosamente "Nenhum item adicionado nesta categoria." em todas as sub-abas (0 itens), indistinguível de uma ficha genuinamente vazia — sem toast, sem mensagem de erro.
  - Sugestão: em `page.tsx`, tratar `isInventoryError`/`inventoryError` com o mesmo padrão já usado para `isError`/`error` da própria ficha (toast em pt-BR via `useEffect`), ou repassar essas duas props para `SheetInventoryItemsSection` e renderizar uma mensagem de erro no lugar da grade/tabs.

- **[Média] `app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemsSection/index.tsx:452-467`** — nenhum feedback visual de carregamento. `isLoadingItems` só é usado para suprimir a mensagem de "vazio" (`!isLoadingItems && visibleItems.length === 0`); durante o carregamento inicial a grade de cards aparece simplesmente vazia, sem spinner/skeleton/texto indicando "Carregando...". Outros painéis da mesma página (`SheetCharacteristicsPanel`, `SheetTrainingsPanel`) expõem e usam `isLoading` para mostrar feedback.
  - Sugestão: exibir `CircularProgress`/`DefaultText` de carregamento enquanto `isLoadingItems` for `true`, mesmo padrão dos demais painéis da ficha.

- **[Baixa] `app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts:152`** — `counts` (contadores por categoria já computados pelo backend em `GET /sheets/:id/inventory-items`) é retornado pelo hook mas nunca consumido; `SheetInventoryItemsSection` recalcula os mesmos contadores localmente via `items.filter(...).length` em cada `Tab` (linhas 405-436). Resultado idêntico, mas redundante — desperdiça o cálculo que a API já entrega pronto.
  - Sugestão: usar `inventory.counts`/`counts` para os números exibidos nas abas de categoria em vez de refiltrar `items` no client.

- **[Baixa] `app-web/src/app/(authorized)/fichas/[id]/components/SheetWeaponStandaloneForm/index.tsx:33-34` e `SheetArmorStandaloneForm/index.tsx:21`** — `WeaponTraitsField`/`WeaponDamagesField` (`armas/components/`) e `ArmorTraitsField` (`armaduras/components/`) são importados diretamente de dentro de `fichas/[id]/components/`, cruzando a fronteira de "componente específico da página" (skill `web-componentes`). Funciona sem bug porque `SheetWeaponStandaloneForm`/`SheetArmorStandaloneForm` usam exatamente `WeaponFormData`/`ArmorFormData` (mesmo tipo do formulário de catálogo), mas o próprio `task-web.md` já sinalizava avaliar promover esses 3 campos para `shared/components/` e isso não foi feito nem documentado como decisão consciente.
  - Sugestão: promover `WeaponTraitsField`, `WeaponDamagesField` e `ArmorTraitsField` para `shared/components/` (ex. `EquipmentFields/`), ou registrar explicitamente a decisão de mantê-los onde estão.

- **[Baixa] `Sheet<X>CatalogPickerModal` (8 componentes)** — inconsistência entre os 8: a tabela de resultados exibe coluna "Tags" em `SheetWeaponCatalogPickerModal`, `SheetArmorCatalogPickerModal` e `SheetShieldCatalogPickerModal`, mas não em `SheetUtilityCatalogPickerModal`, `SheetConsumableCatalogPickerModal`, `SheetMaterialCatalogPickerModal`, `SheetAmmunitionCatalogPickerModal` e `SheetAccessoryCatalogPickerModal` — apesar de todas as 8 interfaces `I<X>ListItem` exporem `tags`. Reflexo do alto grau de duplicação entre os 8 componentes (ponto já levantado no plano para avaliação de fatoração).
  - Sugestão: padronizar a coluna "Tags" nos 8 modais (incluí-la ou removê-la de forma consistente); ao fatorar os 8 componentes quase-idênticos em algo mais genérico, esse tipo de divergência acidental deixa de ser possível.

Nenhum achado bloqueante — os pontos acima são de tratamento de erro/loading ausente
(prioridade média) e organização/consistência (prioridade baixa). Recomenda-se
endereçar ao menos os dois primeiros achados (erro/loading do inventário) antes do
fechamento da demanda.

### Nota de correção (pós-revisão)

Corrigidos os 3 achados dos itens 1–3:

- **[Média] Erro silencioso ao carregar o inventário** — corrigido em
  `fichas/[id]/hooks/useSheetInventoryItems/index.ts`: adicionado `useEffect` que
  dispara `showToast` em pt-BR quando `isInventoryError` for `true` (mensagem da API
  ou fallback "Não foi possível carregar os itens do inventário."), mesmo padrão já
  usado em `useSheetAbilities` para `isAbilitiesError`. `isInventoryError`/
  `inventoryError` deixaram de ser expostos no retorno do hook (tratados
  inteiramente dentro dele, mesmo espírito de `useSheetAbilities`).
- **[Média] Sem feedback de carregamento** — corrigido em
  `SheetInventoryItemsSection`: adicionado `return` antecipado com
  `CircularProgress` + `DefaultText` ("Carregando itens do inventário...") quando
  `isLoadingItems` for `true`, reaproveitando a mesma primitiva/mensagem já usada em
  `SheetCharacteristicsPanel`/`SheetTrainingsPanel`. A checagem redundante
  `!isLoadingItems &&` no estado vazio foi removida (já coberta pelo retorno
  antecipado).
- **[Baixa] `counts` do backend não utilizado** — corrigido parcialmente: a aba
  "Carregados" agora usa `counts[category]` (novo prop `counts`, propagado de
  `useSheetInventoryItems` → `page.tsx` → `SheetInventoryItemsSection`) em vez de
  `items.filter(...).length`. A aba "Equipados" continua filtrando `items` no
  client, porque o `counts` devolvido por `GET /sheets/:id/inventory-items`
  (`sheets.service.ts`, `buildInventoryList`) é só por categoria, sem recorte por
  `equipped` — não há hoje contador de "equipados por categoria" vindo do backend
  para reaproveitar sem alterar `app-api`, fora do escopo deste agente.

Deixados como observação, fora do escopo daquela rodada (conforme instrução do
orquestrador): promoção de `WeaponTraitsField`/`WeaponDamagesField`/
`ArmorTraitsField` para `shared/components/`, e a inconsistência da coluna "Tags"
entre os 8 `Sheet<X>CatalogPickerModal`.

### Correção adicional (2ª rodada) — os 2 achados de Baixa severidade

O usuário pediu explicitamente a correção dos 2 achados que haviam ficado como
observação. Ambos foram corrigidos:

- **[Baixa] Campos de equipamento fora da fronteira de página** — `WeaponTraitsField`,
  `WeaponDamagesField` (antes em `armas/components/`) e `ArmorTraitsField` (antes em
  `armaduras/components/`) foram promovidos para
  `app-web/src/shared/components/EquipmentFields/{WeaponTraitsField,WeaponDamagesField,ArmorTraitsField}/index.tsx`,
  com um barrel `shared/components/EquipmentFields/index.ts` (`export * from
  './WeaponTraitsField'` etc.), seguindo a mesma convenção de categoria com barrel já
  usada em `shared/components/Buttons`/`Containers`. Nenhuma mudança de comportamento
  ou de assinatura de props — só local do arquivo e imports. Todos os consumidores
  foram atualizados para importar de `@/shared/components/EquipmentFields`:
  `armas/components/WeaponCreateForm`, `armaduras/components/ArmorCreateForm`,
  `fichas/[id]/components/SheetWeaponStandaloneForm`,
  `fichas/[id]/components/SheetArmorStandaloneForm` (confirmado via grep — eram os
  únicos 4 consumidores). `WeaponDamagesField` manteve sua dependência de
  `WEAPON_DAMAGE_DIE_OPTIONS` (`app-web/src/app/(authorized)/armas/data`), só com o
  caminho de import atualizado para o alias `@/`. Limitação registrada: as
  ferramentas disponíveis para este agente não incluem exclusão de arquivo/diretório;
  os 3 arquivos de origem (`armas/components/WeaponTraitsField`,
  `armas/components/WeaponDamagesField`, `armaduras/components/ArmorTraitsField`)
  foram reduzidos a um `export * from '@/shared/components/EquipmentFields/...'` cada
  (nenhum código duplicado, nenhum consumidor real depende deles), mas continuam
  existindo como arquivos no disco — recomenda-se que um agente com acesso a exclusão
  de arquivo remova essas 3 pastas por completo.
- **[Baixa] Coluna "Tags" inconsistente entre os 8 `Sheet<X>CatalogPickerModal`** —
  adicionada a coluna "Tags" (mesmo cabeçalho, mesma célula com `TagBadge` em
  `flex flex-wrap gap-1`, mesmo `colSpan` do estado vazio ajustado de 4 para 5) nos 5
  modais que não a tinham: `SheetUtilityCatalogPickerModal`,
  `SheetConsumableCatalogPickerModal`, `SheetMaterialCatalogPickerModal`,
  `SheetAmmunitionCatalogPickerModal`, `SheetAccessoryCatalogPickerModal` — replicando
  exatamente a implementação já usada em `SheetWeaponCatalogPickerModal`/
  `SheetArmorCatalogPickerModal`/`SheetShieldCatalogPickerModal`. Os 8 modais agora
  são consistentes.

### Terceira passada — validação das correções de baixa severidade

Passada focada, restrita a validar as duas correções descritas em "Correção
adicional (2ª rodada)". Não repete a revisão completa (já aprovada nas passadas
anteriores).

**1. Promoção de `WeaponTraitsField`/`WeaponDamagesField`/`ArmorTraitsField` para
`shared/components/EquipmentFields/`**

- Comportamento/assinatura de props: conferido campo a campo — os três componentes em
  `shared/components/EquipmentFields/{WeaponTraitsField,WeaponDamagesField,
  ArmorTraitsField}/index.tsx` são cópias exatas do conteúdo que antes vivia em
  `armas/components/WeaponTraitsField`, `armas/components/WeaponDamagesField` e
  `armaduras/components/ArmorTraitsField` (mesmas props `WeaponTraitsFieldProps`/
  `WeaponDamagesFieldProps`/`ArmorTraitsFieldProps`, mesma lógica interna, nenhuma
  mudança de comportamento). Nenhum risco de regressão identificado para os
  formulários de catálogo de Armas/Armaduras.
- Consumidores: confirmado via grep que os 4 consumidores reais —
  `armas/components/WeaponCreateForm` (importa `WeaponTraitsField`/`WeaponDamagesField`
  de `@/shared/components/EquipmentFields`), `armaduras/components/ArmorCreateForm`
  (`ArmorTraitsField` de `@/shared/components/EquipmentFields`),
  `fichas/[id]/components/SheetWeaponStandaloneForm` e
  `fichas/[id]/components/SheetArmorStandaloneForm` — todos apontam para o novo
  caminho. Nenhum import remanescente do caminho antigo (`armas/components/
  WeaponTraitsField`, `armas/components/WeaponDamagesField`, `armaduras/components/
  ArmorTraitsField`) foi encontrado em nenhum consumidor.
- Arquivos de origem (pendentes de exclusão manual, conforme já sinalizado): os 3
  arquivos (`armas/components/WeaponTraitsField/index.tsx`, `armas/components/
  WeaponDamagesField/index.tsx`, `armaduras/components/ArmorTraitsField/index.tsx`)
  contêm hoje só a linha `export * from '@/shared/components/EquipmentFields/...'`
  cada, sem nenhum código duplicado remanescente — confirmado por leitura direta dos
  3 arquivos. Nenhum risco de divergência futura enquanto ficarem assim.
- Barrel `shared/components/EquipmentFields/index.ts`: segue a mesma convenção de
  `export * from './<Componente>'` por linha já usada em `shared/components/Buttons`/
  `Containers`. Consistente com o padrão do projeto.
- Achado novo (Baixa) — `WeaponDamagesField`, agora em `shared/components/`, continua
  importando `WEAPON_DAMAGE_DIE_OPTIONS` de `@/app/(authorized)/armas/data` (linha 19
  de `shared/components/EquipmentFields/WeaponDamagesField/index.tsx`), uma constante
  definida dentro da pasta de uma página específica. A skill `web-componentes` define
  como regra prática que um componente que "conhece uma rota/endpoint específico" (ou,
  por extensão, dados específicos de uma feature) não deveria estar em `shared/`; aqui
  ocorre o inverso — um componente já promovido para `shared/` follow-imports uma
  constante de `armas/data`, o que reintroduz uma dependência de página dentro de
  `shared/components/`. Isso não quebra nada tecnicamente (o alias `@/` resolve
  normalmente e não há import circular), mas é uma inconsistência arquitetural: se
  `SheetWeaponStandaloneForm` (fora de `armas/`) precisar deste componente sem também
  depender de `armas/`, a fronteira está furada.
  - Sugestão: promover `WEAPON_DAMAGE_DIE_OPTIONS` (e seu tipo `WeaponDamageDieOption`)
    para `shared/constants/` (ou para dentro do próprio
    `shared/components/EquipmentFields/WeaponDamagesField`, já que é uma lista fixa de
    dados de dado de dano, não específica da página de catálogo de Armas), deixando
    `armas/data` apenas com `WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS` (esses sim
    seguem sendo consumidos só por `WeaponCreateForm`/`SheetWeaponStandaloneForm`, que já
    importam de `armas/data` diretamente, fora do componente promovido).

**2. Coluna "Tags" nos 8 `Sheet<X>CatalogPickerModal`**

Comparados lado a lado os 8 componentes (`SheetWeaponCatalogPickerModal` como
referência já existente + os 5 recém-alterados: `SheetUtilityCatalogPickerModal`,
`SheetConsumableCatalogPickerModal`, `SheetMaterialCatalogPickerModal`,
`SheetAmmunitionCatalogPickerModal`, `SheetAccessoryCatalogPickerModal`). Em todos os
5 modais alterados:
- O cabeçalho `TableCell`/`Label` "Tags" foi inserido na mesma posição (entre "Nome" e
  "Preço") com o mesmo `sx={{ borderColor: APP_COLORS.gold }}` dos demais cabeçalhos.
- A célula de dados usa exatamente `<div className="flex flex-wrap items-center
  gap-1">{item.tags.map((tag) => <TagBadge key={tag.id} name={tag.name}
  color={tag.color} />)}</div>`, idêntica em estrutura e classes à célula já usada em
  `SheetWeaponCatalogPickerModal`/`SheetArmorCatalogPickerModal`/
  `SheetShieldCatalogPickerModal`. Não há tratamento especial para lista de tags vazia
  em nenhum dos 8 — o `div` simplesmente renderiza vazio, mesmo comportamento em todos,
  portanto consistente (não é uma regressão introduzida agora).
- O `colSpan` da linha de estado vazio/carregando foi corretamente ajustado de 4 para
  5 nos 5 modais alterados (conferido em cada um: `SheetUtilityCatalogPickerModal`
  linha 157, `SheetConsumableCatalogPickerModal` linha 160,
  `SheetMaterialCatalogPickerModal` linha 157, `SheetAmmunitionCatalogPickerModal`
  linha 160, `SheetAccessoryCatalogPickerModal` linha 160) — todos `colSpan={5}`,
  igual à referência. Nenhum desalinhamento de tabela no estado vazio.

Os 8 modais estão de fato consistentes entre si após a correção.

**Conclusão da terceira passada**: nenhum problema bloqueante ou de risco de
regressão encontrado. Um achado novo de severidade Baixa (dependência de
`WeaponDamagesField`, já em `shared/components/`, a `armas/data`) — mesmo nível de
severidade dos dois achados que motivaram esta rodada de correção, registrado acima
com sugestão objetiva. A padronização da coluna "Tags" está totalmente correta nos 8
modais, sem achados.

**Correção do achado de Baixa severidade (rodada seguinte)** — `WEAPON_DAMAGE_DIE_OPTIONS`
(e o tipo `WeaponDamageDieOption`) foi promovido de `armas/data` para
`shared/constants/WeaponDamageDie/index.ts` (novo arquivo, mesma convenção de pasta +
barrel já usada por `shared/constants/EquipmentApplicableType` e reexportado em
`shared/constants/index.ts`), sem alterar valores, ordem ou tipagem — cópia exata dos
8 itens (`d2` a `d100`). `armas/data/index.ts` manteve apenas
`WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS` (e o import de `WeaponDamageDie` foi
removido de lá, já não usado). Confirmado via grep que não há mais nenhum
`WEAPON_DAMAGE_DIE_OPTIONS`/`WeaponDamageDieOption` apontando para `armas/data` em todo
`app-web/src`. Os 4 consumidores reais foram atualizados para importar de
`@/shared/constants`:
- `shared/components/EquipmentFields/WeaponDamagesField/index.tsx`
- `app/(authorized)/fichas/[id]/components/SheetWeaponStandaloneForm/index.tsx` (mantém
  `WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS` vindos de `armas/data`, só
  `WEAPON_DAMAGE_DIE_OPTIONS` migrou)
- `app/(authorized)/armas/components/WeaponView/index.tsx` (idem)
- `app/(authorized)/armas/components/WeaponCreateForm/index.tsx` (idem)

`armas/data` não ficou vazio após a remoção (ainda contém `WEAPON_HANDS_OPTIONS`/
`WEAPON_STYLE_OPTIONS`, genuinamente específicos da página de Armas), portanto não há
novo resíduo de arquivo desta correção.

**Lista consolidada e atualizada de arquivos pendentes de exclusão manual em disco**
(nenhum item novo adicionado por esta correção — apenas os 3 já sinalizados na 2ª
rodada, que continuam existindo só como re-export shims sem consumidores reais):
1. `app-web/src/app/(authorized)/armas/components/WeaponTraitsField/index.tsx`
2. `app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx`
3. `app-web/src/app/(authorized)/armaduras/components/ArmorTraitsField/index.tsx`

---

## Demanda incremental: aumentar quantidade de item existente

Contexto adicional (não reabre nem contradiz nada do que já foi implementado/
revisado acima — este bloco documenta só as etapas novas desta demanda pontual,
mantendo tudo anterior como histórico da task original). O card
`SheetInventoryItemCard`
(`app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemCard/index.tsx`),
que hoje já tem Visualizar, Remover e Equipar/Desequipar, ganha uma nova ação
"Aumentar quantidade" para um item já existente no inventário, sem passar pelo
fluxo completo de "Adicionar" (`SheetInventoryAddChoiceModal` → item avulso/item do
catálogo → reconstrução do item do zero).

Backend disponível (implementado em paralelo a este planejamento — ver aviso de
contrato abaixo): `POST /sheets/:id/inventory-items/:itemId/increase`, corpo
`{ quantity: number }` (inteiro positivo), retornando o mesmo
`SheetInventoryMutationResponseDto` (`{ sheet, inventory }`) dos demais endpoints
de mutação de inventário, bloqueando com 409/Conflict quando a quantidade
solicitada ultrapassa o Volume Limite da ficha.

**Aviso de dependência de contrato**: esse endpoint estava sendo implementado em
paralelo a este planejamento (etapa "4. api-dev" de
`.claude/tasks/ficha-inventario-itens/task-api.md`, incremental à etapa "1. api-dev"
já concluída e revisada do backend). Antes de codificar, `web-dev` deve **conferir
o contrato real** — nome exato da rota, formato do DTO de entrada (nome do campo,
ex. `quantity`) e formato da resposta — diretamente em
`app-api/src/modules/sheets/` (`sheets.controller.ts` e os DTOs `sheet-inventory-*`)
em vez de confiar cegamente na descrição acima, e ajustar nomes/rota/payload
conforme necessário — sem reabrir nenhuma decisão de UX já fechada neste bloco.

### Decisão registrada: reaproveitar `SheetInventoryQuantityModal` com `mode="add"` tal como está, sem criar `mode="increase"`

Investigação do componente já existente
(`fichas/[id]/components/SheetInventoryQuantityModal/index.tsx`, ver íntegra lida
durante este planejamento): em `mode="add"` a única copy fixa é o título
"Quantidade a adicionar" — o nome do item/categoria é sempre recebido via prop
`itemName` e simplesmente renderizado abaixo do título
(`<DefaultText>{itemName}</DefaultText>`), sem nenhum texto adicional do tipo
"Adicionar item"/"Novo item" embutido no modal. No fluxo de adicionar já
existente, `itemName` recebe o rótulo da categoria (`activeCategoryConfig.label`,
ex. "Armas"), porque naquele fluxo ainda não existe um item de inventário
individual; no fluxo novo de aumentar quantidade, basta passar
`itemName={item.data.name}` (nome do item específico, ex. "Espada Longa") em vez
do rótulo da categoria — a frase resultante ("Quantidade a adicionar" + "Espada
Longa") permanece correta e não confusa também para o caso de aumentar a
quantidade de um item já empilhado no card (semanticamente, aumentar a
quantidade de um item existente é "adicionar mais unidades" a ele). A lógica de
volume (`unitVolume × quantity` somado a `currentLoadedVolume`, bloqueio contra
`limitVolume`, sem segunda confirmação ao confirmar) já é idêntica nos dois
casos, sem nenhuma outra divergência de copy entre os dois usos.

Por isso, **não é necessário** introduzir `mode="increase"` nem parametrizar
textos adicionais no modal — `SheetInventoryQuantityModal` é reaproveitado **sem
nenhuma alteração de código nele**, só uma terceira instância dele em
`SheetInventoryItemsSection`, com `mode="add"`, `itemName`/`unitVolume` vindos do
item específico (em vez da categoria) e `onConfirm` acionando a nova mutation de
aumentar em vez de `addInventoryItemMutation`. Mantém-se também o mesmo padrão
já usado em `mode="add"` hoje de "confirma diretamente, sem segunda confirmação"
(ação reversível/não destrutiva, ao contrário do fluxo de remover — nada na
demanda pede uma confirmação adicional aqui).

### 3. web-dev

#### Funcionalidade

**Conferir contrato do backend antes de codificar** — ver aviso de dependência
de contrato acima: confirmar em `app-api/src/modules/sheets/` (controller + DTOs)
o nome exato da rota, do campo do corpo (`quantity`, assumido) e o formato da
resposta (`{ sheet, inventory }`, assumido igual aos demais endpoints de mutação
de inventário) antes de implementar o hook/mutation abaixo.

**Novo hook de mutation** — `useIncreaseSheetInventoryItemQuantityMutation`
(`app-web/src/hooks/Queries/EntityQueries/useIncreaseSheetInventoryItemQuantityMutation/index.ts`),
seguindo exatamente o mesmo padrão já usado por `useRemoveSheetInventoryItemMutation`/
`useEquipSheetInventoryItemMutation` (não reaproveita `usePostEntity` porque o
`itemId` faz parte da URL e varia a cada chamada): payload
`{ itemId: string; quantity: number }`, `mutationFn` chamando `POST
/sheets/${sheetId}/inventory-items/${itemId}/increase` com corpo `{ quantity }`,
tipo de retorno `ISheetInventoryMutationResult` (mesma interface já usada pelas
demais mutations de inventário), `invalidateQueryKeys`/`onSuccess`/`onError`
recebidos por parâmetro, `onSuccess` do `useMutation` chamando
`invalidateQueryKeys?.forEach(...)` antes do callback do consumidor — mesma
estrutura interna de `useRemoveSheetInventoryItemMutation`. Exportar no barrel
`app-web/src/hooks/Queries/EntityQueries/index.ts` (mesma linha de export dos
hooks vizinhos), reexportado por `@/hooks/Queries` como os demais.

**`useSheetInventoryItems`**
(`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts`):
adicionar `increaseInventoryItemMutation`, chamando
`useIncreaseSheetInventoryItemQuantityMutation({ sheetId, invalidateQueryKeys, onSuccess, onError })`
com o mesmo `invalidateQueryKeys` já usado pelas demais mutations de inventário
(`['/sheets']`, `['/sheets/${sheetId}']`, `[inventoryUrl]`) — garante que o
quadro Volume e os contadores das sub-abas atualizem via refetch, reaproveitando
o bundle `{ sheet, inventory }` da resposta, sem `setQueryData` manual, igual às
demais mutations já existentes. `onSuccess`: toast "Quantidade aumentada com
sucesso." `onError`: toast com `error.response?.data?.message` ou fallback em
pt-BR "Não foi possível aumentar a quantidade do item." (mesmo padrão das demais
mutations do hook). Adicionar `increaseInventoryItemMutation` ao objeto
retornado pelo hook.

**`page.tsx`**: repassar `increaseInventoryItemMutation` (vindo de
`useSheetInventoryItems`) como nova prop de `SheetInventoryItemsSection`, mesmo
padrão de repasse das demais mutations já existentes.

**`SheetInventoryItemCard`**
(`fichas/[id]/components/SheetInventoryItemCard/index.tsx`): nova prop
`onIncrease: (item: ISheetInventoryItem) => void`. Nova ação `IconButton` +
`Tooltip`, ícone `FiPlusCircle` (`react-icons/fi`), `aria-label`/tooltip
"Aumentar quantidade", seguindo exatamente o mesmo padrão visual/estrutural das
ações já existentes (`sx={{ color: APP_COLORS.textBrownDark }}`, dentro do mesmo
bloco `{!isGoogleUser && (...)}` — ação mutável, mesma regra de acesso das
demais ações do card). Posição sugerida: logo após "Visualizar" e antes de
"Equipar"/"Desequipar" — mantendo "Visualizar" como única ação sempre visível e
agrupando as ações mutáveis em sequência (Aumentar quantidade → Equipar/
Desequipar, se aplicável → Remover), sem alterar a posição relativa das ações já
existentes entre si.

**`SheetInventoryItemsSection`**
(`fichas/[id]/components/SheetInventoryItemsSection/index.tsx`):
- Nova prop `increaseInventoryItemMutation: ReturnType<typeof useIncreaseSheetInventoryItemQuantityMutation>`.
- Novo estado `itemPendingIncrease: ISheetInventoryItem | null` (mesmo padrão de
  `itemPendingRemove`/`itemPendingView` já existentes no componente).
- Novo handler `handleIncrease = (item) => setItemPendingIncrease(item)`,
  passado como `onIncrease` para `SheetInventoryItemCard`.
- Novo handler `handleConfirmIncrease = (quantity) => { if (!itemPendingIncrease) return;
  increaseInventoryItemMutation.mutate({ itemId: itemPendingIncrease.id, quantity },
  { onSuccess: () => setItemPendingIncrease(null) }); }` — mesmo padrão de
  `handleConfirmRemove`/`handleConfirmAdd` já existentes (fecha o modal só no
  `onSuccess` da mutation, não otimisticamente).
- Terceira instância de `SheetInventoryQuantityModal` (o mesmo componente já
  existente, sem alteração de código nele — ver decisão registrada acima):
  `open={!!itemPendingIncrease}`, `mode="add"`, `itemName={itemPendingIncrease?.data.name ?? ''}`,
  `unitVolume={itemPendingIncrease?.unitVolume ?? 0}`, `currentLoadedVolume`/
  `limitVolume` (mesmas props já recebidas pelo componente, reaproveitadas),
  `onConfirm={handleConfirmIncrease}`, `onCancel={() => setItemPendingIncrease(null)}`,
  `isLoading={increaseInventoryItemMutation.isPending}` — as outras duas instâncias
  já existentes (fluxo de adicionar novo item e fluxo de remover) permanecem sem
  alteração.

**Integração com API**: `POST /sheets/:id/inventory-items/:itemId/increase`
(nome exato a confirmar contra o contrato real do app-api antes de codificar,
ver aviso de dependência de contrato acima), consumido só pelo novo hook de
mutation.

**Formulário/validação**: nenhum formulário novo — reaproveita integralmente a
validação já existente do `SheetInventoryQuantityModal` em `mode="add"`:
quantidade inteira `>= 1`, bloqueio (mensagem inline em pt-BR + botão
desabilitado) quando `unitVolume × quantity + currentLoadedVolume > limitVolume`.
`unitVolume`/`currentLoadedVolume`/`limitVolume` continuam tratados como
decimais de 1 casa, sem arredondamento; `quantity` continua inteira.

**Acesso Google**: ocultar a ação "Aumentar quantidade" para `provider: 'google'`
(padrão — mesma regra já aplicada a "Remover"/"Equipar"/"Desequipar" no mesmo
card, skill `web-permissao-google-readonly`; a ação "Visualizar" segue sendo a
única sempre visível). Nenhum comportamento diferente do padrão foi pedido pela
demanda.

Status: concluído
Componentes: app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemCard/index.tsx (nova prop `onIncrease` e ação "Aumentar quantidade" com `FiPlusCircle`, entre Visualizar e Equipar/Desequipar, oculta para `useIsGoogleUser()`); app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemsSection/index.tsx (nova prop `increaseInventoryItemMutation`, estado `itemPendingIncrease`, handlers `handleIncrease`/`handleConfirmIncrease`, terceira instância de `SheetInventoryQuantityModal` com `mode="add"` reaproveitado sem alteração de código no modal)
Arquivos: app-web/src/hooks/Queries/EntityQueries/useIncreaseSheetInventoryItemQuantityMutation/index.ts (novo hook, mesmo padrão de useRemoveSheetInventoryItemMutation, POST /sheets/:id/inventory-items/:itemId/increase com corpo { quantity }) + barrel app-web/src/hooks/Queries/EntityQueries/index.ts; app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts (increaseInventoryItemMutation adicionada, toast de sucesso/erro em pt-BR, incluída no retorno do hook); app-web/src/app/(authorized)/fichas/[id]/page.tsx (increaseInventoryItemMutation desestruturada de useSheetInventoryItems e repassada para SheetInventoryItemsSection). Contrato de backend conferido diretamente em app-api/src/modules/sheets/sheets.controller.ts (rota POST :id/inventory-items/:itemId/increase confirmada) e app-api/src/modules/sheets/dto/increase-sheet-inventory-item.dto.ts (campo `quantity`, inteiro >= 1) — idêntico ao assumido no plano, nenhum ajuste de nome/rota necessário. Nenhuma pendência identificada.

### 4. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

### Demanda incremental — revisão da ação de aumentar quantidade

Revisão restrita ao que a demanda incremental tocou (nova ação "Aumentar
quantidade" nos cards de inventário) — não repete a revisão da base da feature
(etapas 1-2), já aprovada nas três passadas anteriores registradas em "##
Revisão" acima.

**1. Aderência ao contrato real** — confirmado diretamente em
`app-api/src/modules/sheets/sheets.controller.ts` (rota
`@Post(':id/inventory-items/:itemId/increase')`, retorno
`SheetInventoryMutationResponseDto`), `app-api/src/modules/sheets/dto/increase-sheet-inventory-item.dto.ts`
(`quantity: number`, `@IsInt` + `@Min(1)`) e
`app-api/src/modules/sheets/dto/sheet-inventory-mutation-response.dto.ts`
(`{ sheet, inventory }`). O hook
`useIncreaseSheetInventoryItemQuantityMutation` bate exatamente com o
contrato: `POST /sheets/${sheetId}/inventory-items/${itemId}/increase`, corpo
`{ quantity }`, tipo de retorno `ISheetInventoryMutationResult` (`{ sheet,
inventory }`). Também confirmado em `sheets.service.ts` (linhas ~3099-3178)
que o backend bloqueia com `ConflictException` (409) em pt-BR ("A quantidade
solicitada supera o volume limite que a ficha pode carregar.") quando o
volume projetado excede o limite — coerente com o `onError` do fluxo.

**2. Reuso do `SheetInventoryQuantityModal` com `mode="add"` (3ª instância)** —
conferidas as três instâncias em `SheetInventoryItemsSection/index.tsx`
(linhas 523-557): cada uma é controlada por um estado independente
(`pendingAdd`, `itemPendingRemove`, `itemPendingIncrease`), sem nenhum estado
compartilhado entre elas. `SheetInventoryQuantityModal` reseta
`quantityInput` para `'1'` via `useEffect` toda vez que `open` transiciona
para `true` (linhas 39-43 do componente), então não há estado residual ao
fechar/reabrir — inclusive ao reabrir a mesma instância para itens diferentes
em sequência. Como cada instância é renderizada dentro de um `Dialog`/MUI
modal com backdrop bloqueante, não há caminho de UI para duas instâncias
ficarem abertas simultaneamente. A copy exibida (`itemName={itemPendingIncrease?.data.name ?? ''}`)
usa o nome do item específico em vez do rótulo da categoria, exatamente como
registrado na "Decisão registrada" do plano — frase resultante ("Quantidade a
adicionar" + nome do item) faz sentido para o caso de aumentar quantidade.

**3. Validação de volume — valores do item do card** — confirmado que a
terceira instância usa `unitVolume={itemPendingIncrease?.unitVolume ?? 0}`
(volume unitário do próprio item de inventário, vindo de `item.unitVolume`),
não um valor de categoria ou do fluxo de adicionar (que usa
`pendingAdd?.unitVolume`, derivado do snapshot/catálogo). `currentLoadedVolume`
e `limitVolume` são os mesmos props recebidos pela seção
(`sheet.loadedVolume ?? 0` e `limitVolume`, repassados de `page.tsx`),
reaproveitados de forma idêntica pelas três instâncias — coerente com o
restante da página.

**4. Tratamento decimal / quantidade inteira** — nenhuma mudança de código no
`SheetInventoryQuantityModal` (reaproveitado tal como está, decisão
registrada no plano); a validação de quantidade inteira `>= 1`
(`Number.isInteger(quantity) && quantity >= 1`) e a soma de volume sem
arredondamento (`additionalVolume = unitVolume * quantity`,
`newLoadedVolume = currentLoadedVolume + additionalVolume`, comparação direta
`> limitVolume`) já existiam e continuam corretas para o novo uso. O DTO do
backend (`IncreaseSheetInventoryItemDto`) também valida `@IsInt` + `@Min(1)`
no campo `quantity`.

**5. Atualização de estado / `invalidateQueryKeys`** — `useSheetInventoryItems`
usa o mesmo array `invalidateQueryKeys` (`['/sheets']`,
`['/sheets/${sheetId}']`, `[inventoryUrl]`) para `increaseInventoryItemMutation`
que já é usado por `removeInventoryItemMutation`/`equipInventoryItemMutation`/
`unequipInventoryItemMutation`, sem `setQueryData` manual e sem `refetch()`
manual — o quadro Volume (`sheet.loadedVolume`) e os contadores das sub-abas
(`counts`, vindo de `GET /sheets/:id/inventory-items`) atualizam sozinhos via
refetch disparado pela invalidação, mesmo padrão dos hooks vizinhos.

**6. Erro 409 em pt-BR** — `onError` de `increaseInventoryItemMutation` (em
`useSheetInventoryItems/index.ts`) usa
`error.response?.data?.message ?? 'Não foi possível aumentar a quantidade do item.'`,
mesmo padrão de `addInventoryItemMutation`/`removeInventoryItemMutation`. Como
o backend responde 409 com `message` em pt-BR
("A quantidade solicitada supera o volume limite..."), o toast exibe a
mensagem real da API nesse caso — consistente com o fluxo de adicionar.

**7. Acesso Google** — confirmado em `SheetInventoryItemCard/index.tsx`: a
nova ação "Aumentar quantidade" (`FiPlusCircle`, `aria-label`/`Tooltip`
"Aumentar quantidade") está dentro do mesmo bloco `{!isGoogleUser && (...)}`
que already contém "Equipar"/"Desequipar"/"Remover". "Visualizar" permanece
fora desse bloco, sempre visível.

**8. Regressão nas ações existentes** — comparado o bloco de ações completo:
"Visualizar" continua sempre visível e inalterado; "Equipar"/"Desequipar"
continuam mutuamente exclusivos por `categoryConfig?.equipable` +
`item.equipped`, com a mesma lógica de antes; "Remover" continua chamando
`onRemove(item)` sem alteração de comportamento. A única mudança de ordem
visual é a nova posição de "Remover" (agora depois de "Equipar"/"Desequipar",
em vez de logo após "Visualizar") — isso é exatamente o que o plano pediu
explicitamente ("agrupando as ações mutáveis em sequência: Aumentar
quantidade → Equipar/Desequipar, se aplicável → Remover"), não uma regressão
acidental. `handleEquip`/`handleUnequip` em `SheetInventoryItemsSection`
permanecem `equipInventoryItemMutation.mutate(item.id)`/
`unequipInventoryItemMutation.mutate(item.id)`, sem alteração de assinatura.

**Outras verificações** — hook `useIncreaseSheetInventoryItemQuantityMutation`
segue exatamente a mesma estrutura de `useRemoveSheetInventoryItemMutation`
(mesmo uso de `ApiFactory`/`getAuthToken`, mesmo padrão de
`invalidateQueryKeys`/`onSuccess`/`onError`); exportado corretamente no
barrel `hooks/Queries/EntityQueries/index.ts` (linha 29) e reexportado por
`hooks/Queries/index.ts`. Campo `data` (não `snapshot`) confirmado como nome
real do payload de item em `ISheetInventoryItem`
(`shared/interfaces/Entities/SheetInventoryItem/index.ts`), usado
corretamente (`item.data.name`) tanto no card quanto na terceira instância do
modal. Nenhum ícone fora de `react-icons/fi`, nenhum `any`, nenhum
`useQuery`/`useMutation` bespoke fora dos hooks genéricos/dedicados do
projeto.

**Conclusão**: Aprovado. Nenhum problema encontrado nos arquivos revisados
para esta demanda incremental:
`app-web/src/hooks/Queries/EntityQueries/useIncreaseSheetInventoryItemQuantityMutation/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetInventoryItems/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemCard/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetInventoryItemsSection/index.tsx`.