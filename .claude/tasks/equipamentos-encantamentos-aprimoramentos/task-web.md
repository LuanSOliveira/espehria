# Task Web: Encantamentos e Aprimoramentos em Armaduras, Escudos e Acessórios

## Contexto
Não existe `.claude/tasks/equipamentos-encantamentos-aprimoramentos/spec.md` para esta
demanda. As decisões abaixo foram passadas diretamente pelo orquestrador (não
reabrir).

Esta task é uma **extensão/refatoração**, não uma implementação do zero. Estado atual
já implementado e revisado (ver `.claude/tasks/armas-encantamentos-aprimoramentos/task-web.md`,
inclusive a seção "Revisão"/"Correções"/"Correção de lint", e
`.claude/tasks/encantamentos-aprimoramentos/task-web.md`):

- As features `/encantamentos` e `/aprimoramentos` (CRUD completo) já existem, com
  `IEnchantment`/`IEnchantmentListItem`, `IEnhancement`/`IEnhancementListItem`, o tipo
  `EquipmentApplicableType` (`weapon | armor | shield | accessory`,
  `shared/interfaces/Entities/EquipmentApplicableType`) e as constantes
  `EQUIPMENT_APPLICABLE_TYPE_OPTIONS`/`EQUIPMENT_APPLICABLE_TYPE_LABELS`
  (`shared/constants/EquipmentApplicableType`).
- O formulário de Armas (`WeaponCreateForm`) já tem a seção de abas
  Encantamentos/Aprimoramentos, hoje implementada em
  `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/`
  (`index.tsx`, `WeaponEmbeddedEffectsTabPanel.tsx`,
  `WeaponEmbeddedEffectChoiceModal.tsx`, `WeaponEmbeddedEffectPickerModal.tsx`), com o
  hook dedicado `useWeaponEmbeddedEffectDetailMutation`
  (`app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts`,
  registrado no barrel `EntityQueries/index.ts`). O `WeaponView` já exibe os dois
  blocos ("Encantamentos"/"Aprimoramentos") com `RichTextViewer`, ícones `GiMagicSwirl`/
  `GiUpgrade` (`react-icons/gi`).
- O `WeaponEmbeddedEffectPickerModal` **já foi corrigido** (ver seção "Correções" e
  "Correção de lint" da task irmã) para: (a) não adicionar item silenciosamente se o
  modal for fechado enquanto a busca do detalhe está pendente — resolvido reduzindo o
  corpo do modal a um subcomponente (`...ModalBody`) montado apenas quando `open`,
  eliminando `useEffect` de reset; (b) tratar erro da busca de detalhe com toast pt-BR;
  (c) reutilizar `IEnchantmentListItem | IEnhancementListItem` como `TItem` do
  `useGetEntityList` em vez de recriar uma interface local; (d) `IconButton`
  "Selecionar" envolvido em `<span>` dentro do `Tooltip` quando `disabled`; e (e) **zero
  `useEffect` com `setState` dentro** — a busca do detalhe do item selecionado usa um
  hook de `useMutation` dedicado (`useWeaponEmbeddedEffectDetailMutation`), disparado
  imperativamente no clique de "Selecionar", com `onSuccess`/`onError` fazendo o
  trabalho que antes estava em efeitos. **Toda a generalização desta task precisa
  preservar exatamente este design** (nada de reintroduzir `useEffect` com
  `setState`).
- Schemas/interfaces atuais de Armas já têm os campos:
  `weaponEmbeddedEffectItemSchema`/`WeaponEmbeddedEffectItemFormData`/
  `weaponEmbeddedEffectItemDefaultValues` em
  `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`, e
  `IWeaponEmbeddedEffect`/`enchantments`/`enhancements` em `IWeapon`
  (`app-web/src/shared/interfaces/Entities/Weapon/index.ts`).

Investigação de código feita nesta task (padrões e pontos de inserção confirmados):

- **Formulário de Armaduras**
  (`app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx`):
  segue o mesmo esqueleto de Armas (grids de campos + `ArmorTraitsField` + `Descrição`
  + `Informações Privadas`). A última seção "específica" antes de `Descrição` é
  `<ArmorTraitsField value={traits} onChange={setTraits} />` — a nova seção de abas
  entra **imediatamente após ela e antes do bloco `Descrição`**, mesma posição relativa
  usada em Armas (após a última seção de propriedades específicas, antes de
  Descrição).
- **View de Armaduras**
  (`app-web/src/app/(authorized)/armaduras/components/ArmorView/index.tsx`): os
  `detailSectionBox` existentes, em ordem, são "Traços" → "Descrição" →
  "Informações Privadas" (Google oculta a última). Os novos blocos
  "Encantamentos"/"Aprimoramentos" entram **entre "Traços" e "Descrição"**, mesma
  posição relativa do `WeaponView` (após o bloco de traços/dano, antes de Descrição).
- **Formulário de Escudos**
  (`app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx`): não
  tem `TraitsField` nem `WeaponTraitsField`-like. A última seção específica antes de
  `Descrição` é o grid com `Dureza`/`Pontos de Vida`/`Limiar de Quebra` (campo
  calculado via `watch('hitPoints')`, somente leitura). A nova seção de abas entra
  **imediatamente após esse grid e antes do bloco `Descrição`**.
- **View de Escudos**
  (`app-web/src/app/(authorized)/escudos/components/ShieldView/index.tsx`): não tem
  nenhum `detailSectionBox` de propriedades específicas — vai direto do grid de
  informações (dentro do cabeçalho) para "Descrição" → "Informações Privadas". Os
  novos blocos "Encantamentos"/"Aprimoramentos" entram **antes do bloco "Descrição"**
  (primeiros `detailSectionBox`s da tela).
- **Formulário de Acessórios**
  (`app-web/src/app/(authorized)/acessorios/components/AccessoryCreateForm/index.tsx`):
  o mais simples dos quatro — nenhuma seção específica além do grid inicial (Nome,
  Imagem, Preço, Moeda, Tags). A nova seção de abas entra **imediatamente após esse
  grid e antes do bloco `Descrição`** (mesmo padrão de Escudos).
- **View de Acessórios**
  (`app-web/src/app/(authorized)/acessorios/components/AccessoryView/index.tsx`):
  mesmo caso de Escudos — só tem "Descrição" → "Informações Privadas". Os novos blocos
  entram **antes do bloco "Descrição"**.
- **`WeaponDamagesField`
  (`app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx`)** não
  é genérico — usa `Control<WeaponFormData>` fixo, porque é uma feature exclusiva de
  Armas. Como o novo componente compartilhado precisa funcionar com 4 `FormData`
  diferentes (`WeaponFormData`, `ArmorFormData`, `ShieldFormData`,
  `AccessoryFormData`), ele **precisa de generics de verdade** (diferente de
  `WeaponDamagesField`): um parâmetro de tipo `TFieldValues` restrito a um shape
  mínimo `{ enchantments: EmbeddedEffectItemFormData[]; enhancements:
  EmbeddedEffectItemFormData[] }` (via `extends FieldValues`), usado em
  `Control<TFieldValues>` e nos `useFieldArray<TFieldValues, 'enchantments' |
  'enhancements'>`. Como os 4 schemas usam exatamente os nomes de campo
  `enchantments`/`enhancements` (decisão já tomada, não há variação de nome entre
  entidades), não é necessário parametrizar o nome do campo — só o tipo de
  `FormData` e o `EquipmentApplicableType` usado no filtro do catálogo.
- **Contrato de API real hoje** (`app-api/src/modules/{armors,shields,accessories}/dto/`):
  nenhum dos três módulos tem `enchantments`/`enhancements` em
  `CreateXDto`/`XResponseDto` no momento desta investigação — os campos ainda não
  existem no backend para essas 3 entidades (só em `weapons`, via
  `WeaponEmbeddedEffectDto`/`WeaponEmbeddedEffectResponseDto`,
  `app-api/src/modules/weapons/dto/`). Também não existe ainda
  `app-api/src/modules/common/` (destino planejado, segundo o orquestrador, para os
  DTOs generalizados `EmbeddedEffectDto`/`EmbeddedEffectResponseDto`). **Isso confirma
  que a etapa de backend desta demanda ainda não foi implementada** — o `web-dev`
  **deve reconferir os DTOs reais em `app-api/src/modules/{armors,shields,accessories}/dto/`
  (e o eventual `app-api/src/modules/common/`) antes de codar o payload/tipos**, já
  que este plano assume, por ora, o mesmo contrato já validado em Armas: request
  `{ name: string (obrigatório), effect?: string }`, resposta `{ name: string, effect:
  string | null }`, arrays `enchantments`/`enhancements` em `Create*Dto`/`*ResponseDto`
  de cada entidade, sem `id`/FK.

## Etapas

### 1. web-dev
Status: concluído

Contrato de API reconferido antes de codar: `app-api/src/modules/{armors,shields,accessories}/dto/create-*.dto.ts` e `*-response.dto.ts` já tinham `enchantments`/`enhancements: EmbeddedEffectDto[]/EmbeddedEffectResponseDto[]` (via `app-api/src/common/dto/embedded-effect{,-response}.dto.ts`), exatamente no formato assumido pelo plano (`{ name: string; effect?: string }` no request, `{ name: string; effect: string | null }` na resposta) — nenhum ajuste de payload/tipos foi necessário além do já planejado.

Pendência de ferramental: este agente tem apenas Read/Grep/Glob/Edit/Write/Skill (sem Bash), portanto não conseguiu excluir fisicamente a pasta antiga `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/` nem o arquivo antigo `app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts` (a etapa "1. web-dev" pedia removê-los). Os 5 arquivos foram esvaziados para um `export {}` com comentário apontando o novo local e nenhum import restante os referencia (confirmado por Grep) — mas a remoção física da pasta/arquivo ainda precisa ser feita manualmente (pelo orquestrador ou por um agente com Bash) antes do merge. Verificação de lint também não pôde ser executada por falta de Bash; toda a validação foi feita por leitura cuidadosa dos arquivos finais (imports, barrels, tipos e JSX conferidos manualmente contra o padrão já usado em `usuarios`/`armas`).

#### Componentes

- Componente: `EmbeddedEffectsField` (generalização de `WeaponEmbeddedEffectsField`)
  - Novo local: `app-web/src/shared/components/EmbeddedEffectsField/index.tsx`.
  - Props: `{ control: Control<TFieldValues>; applicableType: EquipmentApplicableType }`,
    com `TFieldValues extends FieldValues` restrito ao shape `{ enchantments:
    EmbeddedEffectItemFormData[]; enhancements: EmbeddedEffectItemFormData[] }` (ver
    tipo compartilhado abaixo). Remove o prefixo "Weapon" do nome do componente e de
    todas as props/textos que hoje mencionam arma especificamente (não havia nenhum —
    os textos "Encantamentos"/"Aprimoramentos"/"Adicionar Encantamento"/"Adicionar
    Aprimoramento" já eram genéricos).
  - Comportamento esperado: idêntico ao `WeaponEmbeddedEffectsField` atual — `Tabs`/
    `Tab` do MUI com as mesmas duas abas fixas, mesmo `sx` de cores
    (`APP_COLORS.gold`/`goldDark`), os dois painéis sempre montados e só o ativo
    visível (`display: none` no inativo). A única diferença de comportamento é que
    `applicableType` passa a ser recebido via prop (em vez de `'weapon'` fixo) e é
    repassado até o picker modal como filtro do catálogo.

- Componente: `EmbeddedEffectsTabPanel` (generalização de
  `WeaponEmbeddedEffectsTabPanel`)
  - Novo local:
    `app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectsTabPanel.tsx`.
  - Props: `{ control: Control<TFieldValues>; active: boolean; fieldName:
    'enchantments' | 'enhancements'; entityLabel: string; entityUrl: '/enchantments' |
    '/enhancements'; addButtonLabel: string; applicableType: EquipmentApplicableType }`
    (mesmo `TFieldValues` genérico do componente pai).
  - Comportamento esperado: idêntico ao atual (`useFieldArray`, lista de itens com
    `FormTextInput`/`FormRichTextInput`, botão "Adicionar..." abaixo, abre
    `EmbeddedEffectChoiceModal`/`EmbeddedEffectPickerModal`). Único ajuste: repassa
    `applicableType` ao `EmbeddedEffectPickerModal`.

- Componente: `EmbeddedEffectChoiceModal` (generalização de
  `WeaponEmbeddedEffectChoiceModal`)
  - Novo local:
    `app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectChoiceModal.tsx`.
  - Props e comportamento: idênticos ao atual (não depende de `FormData`/`control`,
    portanto não precisa de generics) — apenas movido de pasta e renomeado.

- Componente: `EmbeddedEffectPickerModal` (generalização de
  `WeaponEmbeddedEffectPickerModal`)
  - Novo local:
    `app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectPickerModal.tsx`.
  - Props: `{ open: boolean; onClose: () => void; entityLabel: string; entityUrl:
    '/enchantments' | '/enhancements'; applicableType: EquipmentApplicableType;
    onSelect: (item: { name: string; effect?: string | null }) => void }`.
  - Comportamento esperado: **preservar exatamente** o design já corrigido na task
    irmã (`WeaponEmbeddedEffectPickerModal` + `...ModalBody` interno montado só quando
    `open`, `useWeaponEmbeddedEffectDetailMutation` disparado no clique de
    "Selecionar", `onSuccess`/`onError` sem `useEffect`, `<span>` ao redor do
    `IconButton` desabilitado). A única mudança funcional é o filtro do catálogo:
    `filters: { name: nameFilter || undefined, type: applicableType, page, perPage:
    APP_DEFAULT_PAGE_SIZE }` em vez de `type: 'weapon'` fixo. **Não reintroduzir
    nenhum `useEffect` com `setState`** — se algo no design atual parecer tentador de
    "simplificar" com um efeito, manter a estrutura de subcomponente
    montado/desmontado por `open` como está.

- Tipo compartilhado (não é componente visual, mas precisa existir antes dos 4
  formulários consumirem o campo): mover
  `weaponEmbeddedEffectItemSchema`/`WeaponEmbeddedEffectItemFormData`/
  `weaponEmbeddedEffectItemDefaultValues` de `WeaponFormSchema` para um novo arquivo
  compartilhado `app-web/src/shared/formSchemas/EmbeddedEffectFormSchema/index.ts`
  (reexportado em `shared/formSchemas/index.ts`), renomeando para
  `embeddedEffectItemSchema`/`EmbeddedEffectItemFormData`/
  `embeddedEffectItemDefaultValues` (sem prefixo "weapon"). `WeaponFormSchema` passa a
  importar esses símbolos do novo local em vez de declará-los localmente (mantém
  `enchantments: z.array(embeddedEffectItemSchema)`/`enhancements:
  z.array(embeddedEffectItemSchema)` no `weaponFormSchema`, sem mudança de
  comportamento). `ArmorFormSchema`, `ShieldFormSchema` e `AccessoryFormSchema`
  importam o mesmo `embeddedEffectItemSchema` para seus novos campos
  `enchantments`/`enhancements` (ver "Formulário/validação" abaixo).

- Hook: renomear `useWeaponEmbeddedEffectDetailMutation` para
  `useEmbeddedEffectDetailMutation`, movendo de
  `app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts`
  para `app-web/src/hooks/Queries/EntityQueries/useEmbeddedEffectDetailMutation/index.ts`
  (mesmo conteúdo/assinatura — já não tem nada específico de arma, só
  `entityUrl`/`onSuccess`/`onError` sobre `IEnchantment | IEnhancement`), atualizando o
  export no barrel `EntityQueries/index.ts`.

- Componente: `EmbeddedEffectsSectionView` (novo — extração para eliminar duplicação
  nas 4 telas de visualização)
  - Local: `app-web/src/shared/components/EmbeddedEffectsSectionView/index.tsx`.
  - **Decisão e justificativa**: os blocos "Encantamentos"/"Aprimoramentos" no
    `WeaponView` já hoje são dois `detailSectionBox` estruturalmente idênticos (mesmo
    header com ícone+`Label`, mesmo corpo iterando itens com `Label`
    (nome)+`RichTextViewer` (efeito), mesmo `DefaultText` de lista vazia), só variando
    ícone/label/array de itens. Replicar esse bloco inline 8 vezes (2 blocos × 4
    telas) duplicaria ~35 linhas de JSX idênticas por ocorrência sem necessidade —
    extrair um componente compartilhado é coerente com a mesma decisão já tomada para
    o campo de formulário, e não introduz nenhum padrão visual novo. Por isso este
    plano **inclui a refatoração do `WeaponView`** para também consumir este
    componente (elimina a duplicação já existente ali, em vez de deixá-la como está
    e ainda replicá-la 3x a mais).
  - Props: `{ icon: IconType; label: string; items: IEmbeddedEffect[] }` (`IconType`
    de `react-icons`).
  - Comportamento esperado: exatamente o bloco `detailSectionBox` já usado no
    `WeaponView` para Encantamentos/Aprimoramentos — header com o ícone recebido +
    `Label` com `label`, corpo `flex flex-col gap-3 px-3 py-3` iterando `items`
    (`Label` com `item.name` + `RichTextViewer value={item.effect}
    emptyLabel={NOT_INFORMED}`, chave `${item.name}-${index}`), `DefaultText` "Nenhum
    item adicionado." quando `items.length === 0`. `NOT_INFORMED` (`'Não informado'`)
    passa a ser uma constante exportada por este componente (ou recebida via prop com
    default `'Não informado'`) para não obrigar cada `*View` a redeclarar a string —
    decisão do `web-dev`: escolher entre exportar a constante ou receber `emptyLabel`
    como prop opcional com esse default, mantendo o texto pt-BR igual ao já usado.

- Tipo/interface compartilhada: mover `IWeaponEmbeddedEffect` para um novo arquivo
  `app-web/src/shared/interfaces/Entities/EmbeddedEffect/index.ts` (reexportado em
  `shared/interfaces/Entities/index.ts`), renomeando para `IEmbeddedEffect { name:
  string; effect?: string | null }` (mesmo shape, sem prefixo "Weapon"). `IWeapon`
  passa a usar `enchantments: IEmbeddedEffect[]; enhancements: IEmbeddedEffect[]` em
  vez de `IWeaponEmbeddedEffect[]` (remover a interface local duplicada de
  `shared/interfaces/Entities/Weapon/index.ts`). `IArmor`, `IShield` e `IAccessory`
  usam o mesmo `IEmbeddedEffect` para seus novos campos.

#### Funcionalidade

- **Refatoração do formulário de Armas** (não pode regredir nenhum comportamento já
  validado):
  - `app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx`: trocar
    o import de `WeaponEmbeddedEffectsField` (local) por `EmbeddedEffectsField` de
    `@/shared/components/EmbeddedEffectsField`, mantendo a mesma posição de inserção
    (após `<WeaponDamagesField ... name="extraDamages" .../>`, antes de "Descrição") e
    passando `applicableType="weapon"`. Sem mudança em `buildEmbeddedEffectPayload`
    nem no mapeamento de `enchantments`/`enhancements` no `reset` de edição — ambos
    continuam iguais, só o tipo do item (`EmbeddedEffectItemFormData` em vez de
    `WeaponEmbeddedEffectItemFormData`) muda de import.
  - Remover a pasta inteira
    `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/` (4
    arquivos) após confirmar que nada mais a referencia.
  - `app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx`: trocar os
    dois blocos inline de "Encantamentos"/"Aprimoramentos" por
    `<EmbeddedEffectsSectionView icon={GiMagicSwirl} label="Encantamentos"
    items={weapon.enchantments} />` e `<EmbeddedEffectsSectionView icon={GiUpgrade}
    label="Aprimoramentos" items={weapon.enhancements} />`, na mesma posição atual
    (entre "Dano Extra" e "Descrição"). Remover os imports de `GiMagicSwirl`/`GiUpgrade`
    do `WeaponView` **apenas se** eles passarem a ser usados só dentro do
    `EmbeddedEffectsSectionView` — como o ícone é passado via prop, `WeaponView`
    continua precisando importar `GiMagicSwirl`/`GiUpgrade` de `react-icons/gi` para
    repassá-los.
  - `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`: remover a declaração
    local de `weaponEmbeddedEffectItemSchema`/`WeaponEmbeddedEffectItemFormData`/
    `weaponEmbeddedEffectItemDefaultValues`, importar `embeddedEffectItemSchema`
    (e, se usado em algum outro ponto do arquivo, `embeddedEffectItemDefaultValues`)
    de `../EmbeddedEffectFormSchema`. `weaponFormSchema.enchantments`/`.enhancements`
    continuam `z.array(embeddedEffectItemSchema)`.
  - `app-web/src/shared/interfaces/Entities/Weapon/index.ts`: remover a interface
    local `IWeaponEmbeddedEffect`, importar `IEmbeddedEffect` de
    `../EmbeddedEffect` e usá-la em `enchantments`/`enhancements` de `IWeapon`.
  - `app-web/src/hooks/Queries/EntityQueries/index.ts`: trocar o export de
    `useWeaponEmbeddedEffectDetailMutation` pelo novo
    `useEmbeddedEffectDetailMutation` (novo local em
    `hooks/Queries/EntityQueries/useEmbeddedEffectDetailMutation/`).

- **Armaduras**:
  - `app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx`:
    inserir `<EmbeddedEffectsField control={control} applicableType="armor" />`
    imediatamente após `<ArmorTraitsField value={traits} onChange={setTraits} />` e
    antes do grid de "Descrição". `ArmorPayload`: adicionar `enchantments:
    EmbeddedEffectPayload[]` e `enhancements: EmbeddedEffectPayload[]` ao `Omit<...>`
    (excluindo esses dois nomes de campo do `ArmorFormData` original) + tipados
    explicitamente, preenchidos por um helper local `buildEmbeddedEffectPayload`
    (mesmo padrão do `WeaponCreateForm`: `{ name: item.name, effect: item.effect ||
    undefined }`). `useEffect`/`reset` em modo edição: mapear
    `armorDetail.enchantments`/`armorDetail.enhancements` para o formato do form
    (`{ name, effect: item.effect ?? '' }`), mesmo padrão do `WeaponCreateForm`.
  - `app-web/src/app/(authorized)/armaduras/components/ArmorView/index.tsx`: inserir
    os dois `EmbeddedEffectsSectionView` (Encantamentos/Aprimoramentos, ícones
    `GiMagicSwirl`/`GiUpgrade` de `react-icons/gi`, novo import) entre o bloco
    `detailSectionBox` "Traços" e o bloco "Descrição".
  - `app-web/src/shared/formSchemas/ArmorFormSchema/index.ts`: adicionar
    `enchantments: z.array(embeddedEffectItemSchema)` e `enhancements:
    z.array(embeddedEffectItemSchema)` ao `armorFormSchema` (import de
    `../EmbeddedEffectFormSchema`), e `enchantments: []`/`enhancements: []` a
    `armorFormDefaultValues`.
  - `app-web/src/shared/interfaces/Entities/Armor/index.ts`: adicionar a `IArmor`
    `enchantments: IEmbeddedEffect[]` e `enhancements: IEmbeddedEffect[]` (import de
    `../EmbeddedEffect`). `IArmorListItem` não precisa desses campos (a listagem não
    exibe Encantamentos/Aprimoramentos).

- **Escudos**:
  - `app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx`:
    inserir `<EmbeddedEffectsField control={control} applicableType="shield" />`
    imediatamente após o grid com "Dureza"/"Pontos de Vida"/"Limiar de Quebra" e antes
    do grid de "Descrição". `ShieldPayload`: mesmo tratamento de Armaduras
    (`enchantments`/`enhancements: EmbeddedEffectPayload[]` via `buildEmbeddedEffectPayload`
    local). `useEffect`/`reset` em modo edição: mapear
    `shieldDetail.enchantments`/`shieldDetail.enhancements`, mesmo padrão.
  - `app-web/src/app/(authorized)/escudos/components/ShieldView/index.tsx`: inserir os
    dois `EmbeddedEffectsSectionView` **antes** do bloco `detailSectionBox`
    "Descrição" (primeiros blocos de seção da tela, já que Escudos não tem bloco de
    Traços/Dano).
  - `app-web/src/shared/formSchemas/ShieldFormSchema/index.ts`: adicionar
    `enchantments`/`enhancements` (`z.array(embeddedEffectItemSchema)`) ao
    `shieldFormSchema` e `[]`/`[]` a `shieldFormDefaultValues`.
  - `app-web/src/shared/interfaces/Entities/Shield/index.ts`: adicionar a `IShield`
    `enchantments: IEmbeddedEffect[]` e `enhancements: IEmbeddedEffect[]`.
    `IShieldListItem` não precisa desses campos.

- **Acessórios**:
  - `app-web/src/app/(authorized)/acessorios/components/AccessoryCreateForm/index.tsx`:
    inserir `<EmbeddedEffectsField control={control} applicableType="accessory" />`
    imediatamente após o grid inicial (Nome/Imagem/Preço/Moeda/Tags) e antes do grid
    de "Descrição". `AccessoryPayload`: mesmo tratamento das demais entidades
    (`enchantments`/`enhancements: EmbeddedEffectPayload[]` via
    `buildEmbeddedEffectPayload` local). `useEffect`/`reset` em modo edição: mapear
    `accessoryDetail.enchantments`/`accessoryDetail.enhancements`, mesmo padrão.
  - `app-web/src/app/(authorized)/acessorios/components/AccessoryView/index.tsx`:
    inserir os dois `EmbeddedEffectsSectionView` antes do bloco `detailSectionBox`
    "Descrição" (mesmo caso de Escudos).
  - `app-web/src/shared/formSchemas/AccessoryFormSchema/index.ts`: adicionar
    `enchantments`/`enhancements` (`z.array(embeddedEffectItemSchema)`) ao
    `accessoryFormSchema` e `[]`/`[]` a `accessoryFormDefaultValues`.
  - `app-web/src/shared/interfaces/Entities/Accessory/index.ts`: adicionar a
    `IAccessory` `enchantments: IEmbeddedEffect[]` e `enhancements:
    IEmbeddedEffect[]`. `IAccessoryListItem` não precisa desses campos.

- Integrações com API:
  - `POST/PUT /armors(/:id)`, `POST/PUT /shields(/:id)` e `POST/PUT
    /accessories(/:id)` passam a enviar `enchantments`/`enhancements` no payload
    (arrays de `{ name, effect? }`, sem `id`) — **reconferir contrato real nos DTOs
    de `app-api/src/modules/{armors,shields,accessories}/dto/` antes de codar**, já
    que no momento desta investigação esses campos ainda não existiam ali (ver
    "Contexto" acima); assume-se o mesmo formato já usado em `weapons`.
  - `GET /armors/:id`, `GET /shields/:id`, `GET /accessories/:id` passam a retornar
    `enchantments`/`enhancements` no detalhe — consumidos pelo respectivo
    `*CreateForm` (modo edição) e `*View`.
  - `GET /enchantments?type=armor|shield|accessory&name=...&page=...&perPage=...` e
    equivalente `GET /enhancements?type=...` — usados pelo `EmbeddedEffectPickerModal`
    de cada formulário (endpoints já existentes, só muda o valor de `type` filtrado).
  - `GET /enchantments/:id` e `GET /enhancements/:id` — usados pelo
    `useEmbeddedEffectDetailMutation` para buscar o `effect` completo do registro
    escolhido antes de copiar os valores para o item do formulário (endpoints já
    existentes, sem mudança).

- Formulário/validação: idêntico, nas 3 novas entidades, ao já validado em Armas —
  cada item de Encantamento/Aprimoramento tem exatamente dois campos editáveis: Nome
  (obrigatório, `min(1)`) e Efeito (rich text, opcional). Nenhum campo de `id`/
  referência é armazenado ou enviado, tanto na criação avulsa quanto na cópia de um
  registro existente. Itens copiados permanecem livremente editáveis após a cópia.

- Acesso Google: **ocultar criar/editar/excluir (padrão)**, mantendo só visualizar —
  já garantido sem nenhuma alteração adicional nesta task, pois `armaduras/page.tsx`,
  `escudos/page.tsx` e `acessorios/page.tsx` já ocultam o botão "Novo" via
  `useIsGoogleUser`, e `ArmorsListItem`/`ShieldsListItem`/`AccessoriesListItem` já
  ocultam editar/excluir (mantendo visualizar) para o mesmo grupo — os novos
  `*CreateForm` (e, portanto, o `EmbeddedEffectsField` embutido) só são alcançáveis a
  partir desses formulários já protegidos. `ArmorView`/`ShieldView`/`AccessoryView`
  já ocultam "Informações Privadas" para Google; os novos blocos
  `EmbeddedEffectsSectionView` (Encantamentos/Aprimoramentos) **não** são ocultados
  para Google, mesmo critério já usado no `WeaponView` (só "Informações Privadas" é
  restrita, o restante do detalhe é visível a todos os usuários autenticados).

Status: concluído
Componentes:
- app-web/src/shared/components/EmbeddedEffectsField/index.tsx (novo, genérico via TFieldValues)
- app-web/src/shared/components/EmbeddedEffectsField/types.ts (novo, EmbeddedEffectsFormShape)
- app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectsTabPanel.tsx (novo)
- app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectChoiceModal.tsx (novo)
- app-web/src/shared/components/EmbeddedEffectsField/EmbeddedEffectPickerModal.tsx (novo)
- app-web/src/shared/components/EmbeddedEffectsSectionView/index.tsx (novo)
- app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/{index.tsx,WeaponEmbeddedEffectsTabPanel.tsx,WeaponEmbeddedEffectChoiceModal.tsx,WeaponEmbeddedEffectPickerModal.tsx} (deveriam ter sido excluídos; esvaziados para `export {}` com comentário apontando o novo local — remoção física pendente, ver nota de "Pendência de ferramental" no início desta seção)

Arquivos:
- app-web/src/shared/formSchemas/EmbeddedEffectFormSchema/index.ts (novo: embeddedEffectItemSchema/EmbeddedEffectItemFormData/embeddedEffectItemDefaultValues)
- app-web/src/shared/formSchemas/index.ts (barrel: export do EmbeddedEffectFormSchema)
- app-web/src/shared/formSchemas/WeaponFormSchema/index.ts (removida declaração local, passa a importar embeddedEffectItemSchema)
- app-web/src/shared/formSchemas/ArmorFormSchema/index.ts (campos enchantments/enhancements + defaults)
- app-web/src/shared/formSchemas/ShieldFormSchema/index.ts (campos enchantments/enhancements + defaults)
- app-web/src/shared/formSchemas/AccessoryFormSchema/index.ts (campos enchantments/enhancements + defaults)
- app-web/src/shared/interfaces/Entities/EmbeddedEffect/index.ts (novo: IEmbeddedEffect)
- app-web/src/shared/interfaces/Entities/index.ts (barrel: export do EmbeddedEffect)
- app-web/src/shared/interfaces/Entities/Weapon/index.ts (removida IWeaponEmbeddedEffect local, usa IEmbeddedEffect)
- app-web/src/shared/interfaces/Entities/Armor/index.ts (enchantments/enhancements em IArmor)
- app-web/src/shared/interfaces/Entities/Shield/index.ts (enchantments/enhancements em IShield)
- app-web/src/shared/interfaces/Entities/Accessory/index.ts (enchantments/enhancements em IAccessory)
- app-web/src/hooks/Queries/EntityQueries/useEmbeddedEffectDetailMutation/index.ts (novo, renomeado de useWeaponEmbeddedEffectDetailMutation)
- app-web/src/hooks/Queries/EntityQueries/index.ts (barrel: export do hook renomeado)
- app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts (deveria ter sido excluído; esvaziado para `export {}` — remoção física pendente)
- app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx (usa EmbeddedEffectsField compartilhado com applicableType="weapon")
- app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx (usa EmbeddedEffectsSectionView)
- app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx (EmbeddedEffectsField applicableType="armor", payload, mapeamento de edição)
- app-web/src/app/(authorized)/armaduras/components/ArmorView/index.tsx (blocos EmbeddedEffectsSectionView entre Traços e Descrição)
- app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx (EmbeddedEffectsField applicableType="shield", payload, mapeamento de edição)
- app-web/src/app/(authorized)/escudos/components/ShieldView/index.tsx (blocos EmbeddedEffectsSectionView antes de Descrição)
- app-web/src/app/(authorized)/acessorios/components/AccessoryCreateForm/index.tsx (EmbeddedEffectsField applicableType="accessory", payload, mapeamento de edição)
- app-web/src/app/(authorized)/acessorios/components/AccessoryView/index.tsx (blocos EmbeddedEffectsSectionView antes de Descrição)

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Observação não bloqueante: a "Pendência de ferramental" descrita na etapa "1. web-dev"
(pastas/arquivo legados esvaziados para `export {}` em vez de fisicamente removidos)
já não se aplica — na verificação desta revisão, `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/`
e `app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/`
**não existem mais no repositório** (confirmado via Glob) e não há nenhuma referência
remanescente a `WeaponEmbeddedEffectsField`/`WeaponEmbeddedEffectsTabPanel`/
`WeaponEmbeddedEffectChoiceModal`/`WeaponEmbeddedEffectPickerModal`/
`useWeaponEmbeddedEffectDetailMutation` em imports, barrels ou exports (confirmado via
Grep em `app-web/src`). A remoção física, portanto, já foi concluída — apenas o texto
da nota na etapa 1 ficou desatualizado.

### Parte A — generalização

- `app-web/src/shared/components/EmbeddedEffectsField/index.tsx`,
  `EmbeddedEffectsTabPanel.tsx`, `EmbeddedEffectChoiceModal.tsx`,
  `EmbeddedEffectPickerModal.tsx` e `types.ts`: parametrização via
  `TFieldValues extends FieldValues & EmbeddedEffectsFormShape` coerente e usada de
  forma consistente em `Control<TFieldValues>`/`useFieldArray<TFieldValues,
  'enchantments' | 'enhancements'>`/`FieldPath<TFieldValues>`; nenhum `any`. Testado
  contra os 4 `FormData` (`WeaponFormData`, `ArmorFormData`, `ShieldFormData`,
  `AccessoryFormData`), todos com `enchantments`/`enhancements:
  EmbeddedEffectItemFormData[]`, satisfazendo o shape mínimo exigido.
- `applicableType` passa a ser recebido via prop em todos os 4 `*CreateForm` (`weapon`,
  `armor`, `shield`, `accessory` respectivamente) e repassado corretamente até o
  `EmbeddedEffectPickerModal`, que o usa no filtro `type` de
  `useGetEntityList<... , EmbeddedEffectCandidateListFilters>`.
- Nenhuma referência órfã aos caminhos legados (`armas/components/WeaponEmbeddedEffectsField/`,
  `hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/`) — confirmado
  que os diretórios não existem mais e não há import/export remanescente (Glob + Grep
  em `app-web/src`, incluindo os barrels `hooks/Queries/EntityQueries/index.ts` e
  `shared/formSchemas/index.ts`/`shared/interfaces/Entities/index.ts`).
- Regressões da task irmã, todas confirmadas preservadas na versão generalizada:
  1. Fechar o modal enquanto o detalhe carrega não adiciona item: `EmbeddedEffectPickerModalBody`
     só é montado enquanto `open` é `true` (`{open && <EmbeddedEffectPickerModalBody .../>}`
     em `EmbeddedEffectPickerModal`), e ao fechar o `useMutation` interno é desmontado
     junto, sem `useEffect` de reset.
  2. Erro na busca do detalhe: `onError` de `useEmbeddedEffectDetailMutation` dispara
     `showToast` em pt-BR (`Não foi possível carregar os dados do ${entityLabel.toLowerCase()}
     selecionado.` com fallback para `error.response?.data?.message`), e o estado de
     carregamento (`detailMutation.isPending`) é automaticamente encerrado pelo
     TanStack Query ao resolver a mutation com erro — nada preso em `CircularProgress`.
  3. `onSelect` só copia `name`/`effect` (`onSelect({ name: detail.name, effect:
     detail.effect ?? '' })` em `EmbeddedEffectPickerModalBody`, e
     `append({ name: item.name, effect: item.effect ?? '' })` em
     `EmbeddedEffectsTabPanel`) — nenhum `id` é armazenado/enviado.
  4. Nenhum `useEffect` com `setState` em nenhum dos 4 componentes compartilhados —
     confirmado por leitura completa de todos os arquivos.

### Parte B — extensão (Armaduras, Escudos, Acessórios)

- Ponto de inserção de `<EmbeddedEffectsField .../>` coerente com o plano nos 3
  formulários: após `<ArmorTraitsField .../>` em `ArmorCreateForm`, após o grid
  Dureza/Pontos de Vida/Limiar de Quebra em `ShieldCreateForm`, após o grid inicial em
  `AccessoryCreateForm` — sempre imediatamente antes do bloco "Descrição".
- Filtro do catálogo correto: `applicableType="armor"`/`"shield"`/`"accessory"` nos 3
  formulários, e `"weapon"` mantido em `WeaponCreateForm`.
- `ArmorView`, `ShieldView` e `AccessoryView` usam `EmbeddedEffectsSectionView` com
  `icon={GiMagicSwirl}`/`{GiUpgrade}` de `react-icons/gi` e `items={<entidade>.enchantments}`/
  `{<entidade>.enhancements}`, na posição relativa descrita no plano (entre "Traços" e
  "Descrição" em `ArmorView`; antes de "Descrição" em `ShieldView`/`AccessoryView`, que
  não têm bloco de propriedades específicas).
- Repopulamento em modo edição correto nos 3 formulários: `reset({ ...,
  enchantments: (xDetail.enchantments ?? []).map((item) => ({ name: item.name, effect:
  item.effect ?? '' })), enhancements: (...) })`, mesmo padrão já validado em
  `WeaponCreateForm`.
- Consistência de tipos/payload com os DTOs reais conferida em
  `app-api/src/modules/{armors,shields,accessories}/dto/create-*.dto.ts` e
  `*-response.dto.ts`, e `app-api/src/common/dto/embedded-effect{,-response}.dto.ts`:
  os 3 `Create*Dto` têm `enchantments?`/`enhancements?: EmbeddedEffectDto[]`
  (`{ name: string (obrigatório), effect?: string }`) e os 3 `*ResponseDto` têm
  `enchantments`/`enhancements: EmbeddedEffectResponseDto[]`
  (`{ name: string, effect: string | null }`), exatamente como assumido pelos payloads
  (`buildEmbeddedEffectPayload` local em cada `*CreateForm`, `{ name: item.name,
  effect: item.effect || undefined }`) e pelas interfaces (`IArmor`/`IShield`/
  `IAccessory` com `enchantments`/`enhancements: IEmbeddedEffect[]`) dos 3
  `*CreateForm`/`*View`. As 3 entidades também têm as colunas `enchantments`/
  `enhancements: EmbeddedEffect[]` nas entidades TypeORM correspondentes.
- Textos de UI (labels de campo, mensagens de erro/sucesso, "Nenhum item adicionado.",
  "Não informado") em pt-BR em todos os arquivos revisados.

Arquivos revisados: `app-web/src/shared/components/EmbeddedEffectsField/{index.tsx,types.ts,EmbeddedEffectsTabPanel.tsx,EmbeddedEffectChoiceModal.tsx,EmbeddedEffectPickerModal.tsx}`,
`app-web/src/shared/components/EmbeddedEffectsSectionView/index.tsx`,
`app-web/src/shared/formSchemas/EmbeddedEffectFormSchema/index.ts`,
`app-web/src/shared/formSchemas/{WeaponFormSchema,ArmorFormSchema,ShieldFormSchema,AccessoryFormSchema,index}.ts`,
`app-web/src/shared/interfaces/Entities/{EmbeddedEffect,Weapon,Armor,Shield,Accessory,index}.ts`,
`app-web/src/hooks/Queries/EntityQueries/{useEmbeddedEffectDetailMutation/index.ts,index.ts}`,
`app-web/src/app/(authorized)/armas/components/{WeaponCreateForm,WeaponView}/index.tsx`,
`app-web/src/app/(authorized)/armaduras/components/{ArmorCreateForm,ArmorView}/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/{ShieldCreateForm,ShieldView}/index.tsx`,
`app-web/src/app/(authorized)/acessorios/components/{AccessoryCreateForm,AccessoryView}/index.tsx`,
e os DTOs/entidades correspondentes em `app-api/src/modules/{armors,shields,accessories}/`
e `app-api/src/common/dto/`.
