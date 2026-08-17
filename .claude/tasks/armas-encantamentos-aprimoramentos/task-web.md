# Task Web: Encantamentos e Aprimoramentos embutidos em Armas

## Contexto
Não existe `.claude/tasks/armas-encantamentos-aprimoramentos/spec.md` para esta
demanda. As decisões abaixo foram passadas diretamente pelo orquestrador (não
reabrir).

Esta task depende, em runtime, da feature irmã já planejada em
`.claude/tasks/encantamentos-aprimoramentos/` (`task-web.md`/`task-api.md`), que cria
os CRUDs completos de **Encantamentos** (`enchantments`, rota `/encantamentos`,
`IEnchantment`/`IEnchantmentListItem`) e **Aprimoramentos** (`enhancements`, rota
`/aprimoramentos`, `IEnhancement`/`IEnhancementListItem`), cada um com `name`, `type`
(`weapon | armor | shield | accessory`, tipado como `EquipmentApplicableType` em
`shared/interfaces/Entities/EquipmentApplicableType`) e `effect` (rich text), e expõe
`GET /enchantments?type=weapon` / `GET /enhancements?type=weapon`. Esta task assume
que essas interfaces (`IEnchantment`, `IEnchantmentListItem`, `IEnhancement`,
`IEnhancementListItem`, `EquipmentApplicableType`) já existem em
`shared/interfaces/Entities/` quando for implementada.

Nada nesta task cria/edita as páginas `/encantamentos` ou `/aprimoramentos` — o escopo
aqui é exclusivamente o formulário e a visualização de **Armas**, que passam a
embutir cópias avulsas de nome+efeito, sem qualquer FK/vínculo com os registros de
Encantamentos/Aprimoramentos.

Investigação de código já feita (padrões a seguir):

- `app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx` — form
  principal de Armas (`react-hook-form` + `weaponFormSchema`), com `useFieldArray`
  já usado indiretamente via `WeaponDamagesField` para `alternativeDamages`/
  `extraDamages`, e mapeamento de `weaponDetail` → valores do form dentro do
  `useEffect`/`reset` em modo edição.
- `app-web/src/app/(authorized)/armas/components/WeaponDamagesField/index.tsx` —
  padrão de "componente reutilizado via prop `name`" para lista de itens dentro de um
  field array: `useFieldArray({ control, name })`, cada item renderizado com inputs
  inline + `IconButton`/`FiTrash2` de remover à direita, botão
  `SecondaryButton`/`append(...)` alinhado à direita **abaixo** da lista. Este é o
  modelo seguido pelo novo componente desta task.
- `app-web/src/app/(authorized)/racas/components/RaceTalentsListField/index.tsx` e
  `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` — padrão de
  `Tabs`/`Tab` do MUI com `sx` de cores (`APP_COLORS.gold`/`goldDark`) já usado em
  duas telas diferentes, e padrão de modal de seleção de registro existente (tabela
  paginada + filtro por nome + `useGetEntityList`). **Decisão**:
  `EntityReferenceSelectionModal` **não é reaproveitado** para o "selecionar
  existente" desta task — ele foi desenhado para o fluxo de referência por
  FK/`IEntityReference` (guarda `id`+`entityType`, exige `tags: ITag[]` no item da
  lista para a coluna "Tags" e integra com `useEntityMentionViewStore`). Aqui não há
  FK nenhuma (só cópia de `name`/`effect`) e `IEnchantmentListItem`/
  `IEnhancementListItem` não têm `tags`. Reaproveitar o componente genérico exigiria
  alterá-lo (afetando `WeaponTraitsField`/`RaceTalentsListField`/outros usos) só para
  acomodar um formato de dado incompatível — por isso esta task cria um modal de
  seleção próprio e mais simples (sem coluna Tags, sem "Visualizar", filtro fixo
  `type=weapon`, ação "Selecionar" copia os campos em vez de guardar referência).
- Não existe nenhum componente de "menu de escolha"/action sheet no projeto
  (`shared/components/Buttons`/`Modals` só tem `PrimaryButton`, `SecondaryButton`,
  `FormModal`, `ViewModal`, `ConfirmationModal`). **Decisão de UX** para a escolha
  "criar avulso" vs. "selecionar existente": um modal pequeno construído sobre
  `FormModal` (mesmo padrão visual de `ConfirmationModal`, que também é um dialog
  pequeno com dois botões de ação lado a lado), com um `DefaultText` explicativo e
  dois botões (`SecondaryButton` "Criar avulso" / `PrimaryButton` "Selecionar
  existente") — evita introduzir um padrão novo (menu suspenso) não usado em nenhum
  outro lugar do projeto.
- `app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx` — padrão de
  exibição de "Dano Extra": bloco `detailSectionBox` com header (`FiZap` + `Label`) e
  lista de itens ou `DefaultText` "Nenhum item adicionado." quando vazio. Novo bloco
  de Encantamentos/Aprimoramentos segue o mesmo modelo, usando `RichTextViewer` para
  o campo `effect` de cada item (mesmo padrão do bloco "Descrição").
- `app-web/src/shared/formSchemas/WeaponFormSchema/index.ts` e
  `app-web/src/shared/interfaces/Entities/Weapon/index.ts` — precisam ganhar os novos
  campos `enchantments`/`enhancements`, seguindo exatamente o padrão já usado para
  `alternativeDamages`/`extraDamages` (schema de item próprio + array no schema
  principal + `IWeaponDamage`-like interface).

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/index.tsx, app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectsTabPanel.tsx, app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectChoiceModal.tsx, app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectPickerModal.tsx
Arquivos: app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx (inserção do WeaponEmbeddedEffectsField, payload enchantments/enhancements, mapeamento no reset de edição), app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx (blocos "Encantamentos"/"Aprimoramentos" com GiMagicSwirl/GiUpgrade), app-web/src/shared/formSchemas/WeaponFormSchema/index.ts (weaponEmbeddedEffectItemSchema, defaults, campos enchantments/enhancements), app-web/src/shared/interfaces/Entities/Weapon/index.ts (IWeaponEmbeddedEffect, campos enchantments/enhancements em IWeapon)

#### Componentes (se necessário)

- Componente: `WeaponEmbeddedEffectsField`
  - Local: `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/index.tsx`
  - Props: `{ control: Control<WeaponFormData> }`.
  - Comportamento esperado: é o componente da **seção de abas** em si (inserido uma
    única vez no `WeaponCreateForm`, logo após a seção "Dano Extra"). Renderiza um
    `Tabs`/`Tab` do MUI com duas abas fixas ("Encantamentos", "Aprimoramentos"), no
    mesmo estilo visual (`sx`/cores `APP_COLORS.gold`/`goldDark`) de
    `RaceTalentsListField`/`EntityReferenceSelectionModal`. Internamente, o conteúdo
    de cada aba é implementado por um único código reaproveitado (não duplicado) via
    uma configuração local por aba — `{ fieldName: 'enchantments' | 'enhancements',
    tabLabel, entityLabel: 'Encantamento' | 'Aprimoramento', entityUrl: '/enchantments'
    | '/enhancements', addButtonLabel }` — no mesmo espírito de reuso de
    `WeaponDamagesField` (uma implementação, parametrizada por props, usada para
    ambos os casos). Os dois painéis (Encantamentos/Aprimoramentos) ficam sempre
    montados (cada um com seu próprio `useFieldArray`) e apenas o painel da aba ativa
    fica visível (alternar via `hidden`/`display: none`, não desmontar) — evita que
    trocar de aba perca o estado de um modal aberto ou de um `useFieldArray` em outra
    aba.

- Componente: `WeaponEmbeddedEffectsTabPanel` (subcomponente reutilizado internamente
  pelo `WeaponEmbeddedEffectsField`, um para cada aba)
  - Local: `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectsTabPanel.tsx`
  - Props: `{ control: Control<WeaponFormData>, active: boolean, fieldName:
    'enchantments' | 'enhancements', entityLabel: string, entityUrl: string,
    addButtonLabel: string }`.
  - Comportamento esperado (idêntico para as duas abas, só muda `fieldName`/
    `entityLabel`/`entityUrl`):
    - `useFieldArray({ control, name: fieldName })`.
    - Lista dos itens já adicionados (`fields`), cada um renderizado com
      `FormTextInput` "Nome" (`${fieldName}.${index}.name`) e `FormRichTextInput`
      "Efeito" (`${fieldName}.${index}.effect`), com `IconButton`/`FiTrash2`
      "Remover item" à direita (mesmo layout do item de `WeaponDamagesField`).
      `DefaultText` "Nenhum item adicionado." quando a lista estiver vazia.
    - Botão `SecondaryButton` `addButtonLabel` (ex.: "Adicionar Encantamento")
      alinhado à direita, sempre visível **abaixo** dos itens já adicionados
      (permite adicionar múltiplos).
    - Ao clicar no botão, abre o `WeaponEmbeddedEffectChoiceModal` (ver abaixo) em
      vez de adicionar direto.
    - Só renderiza (visualmente) quando `active` for `true`.

- Componente: `WeaponEmbeddedEffectChoiceModal`
  - Local: co-localizado em
    `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectChoiceModal.tsx`.
  - Props: `{ open: boolean, onClose: () => void, entityLabel: string, onCreateBlank:
    () => void, onSelectExisting: () => void }`.
  - Comportamento esperado: `FormModal` pequeno (`size="default"`), título ex.
    "Adicionar Encantamento" (`Adicionar ${entityLabel}`), com um `DefaultText`
    explicativo ("Como deseja adicionar este encantamento?") e dois botões lado a
    lado: `SecondaryButton` "Criar avulso" (chama `onCreateBlank` e fecha) e
    `PrimaryButton` "Selecionar existente" (chama `onSelectExisting` e fecha — quem
    abre o próximo modal é o `WeaponEmbeddedEffectsTabPanel`, que troca de estado
    para exibir o `WeaponEmbeddedEffectPickerModal`).

- Componente: `WeaponEmbeddedEffectPickerModal`
  - Local: co-localizado em
    `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectPickerModal.tsx`.
  - Props: `{ open: boolean, onClose: () => void, entityLabel: string, entityUrl:
    '/enchantments' | '/enhancements', onSelect: (item: { name: string; effect?:
    string | null }) => void }`.
  - Comportamento esperado: `FormModal` (`size="wide"`) com campo de busca por nome
    (`DefaultTextInput`, ícone `FiSearch`, mesmo padrão do filtro de
    `EntityReferenceSelectionModal`) e tabela paginada (`useGetEntityList` com um
    tipo de filtro local `{ name?: string; type: EquipmentApplicableType; page:
    number; perPage: number }`, **não** reaproveitando `IEnchantmentListFilters`/
    `IEnhancementListFilters` da feature irmã, já que esses tipos não incluem `type`
    — filtro `type: 'weapon'` sempre fixo, não editável pelo usuário) — colunas
    "Nome" e "Ações" (sem coluna Tags, diferente de `EntityReferenceSelectionModal`,
    pois `IEnchantmentListItem`/`IEnhancementListItem` não têm `tags`). Cada linha
    tem um `IconButton`/`FiPlus` "Selecionar". Ao clicar, guarda o `id` selecionado em
    estado local e dispara `useGetEntityById<IEnchantment | IEnhancement>({ url:
    \`${entityUrl}/${selectedId}\`, enabled: !!selectedId })` para buscar o `effect`
    completo (a listagem paginada não retorna `effect`, só `id`/`name`/`type`); via
    `useEffect`, quando os dados chegam, chama `onSelect({ name: data.name, effect:
    data.effect ?? '' })`, reseta o `id` selecionado e fecha o modal. Enquanto a
    busca do detalhe estiver pendente, desabilita as ações da tabela e mostra um
    `CircularProgress` pequeno na linha selecionada. Texto de lista vazia: "Nenhum
    encantamento encontrado." / "Nenhum aprimoramento encontrado." (via
    `entityLabel`). **Sem deduplicação**: como não há vínculo/id persistido, o mesmo
    registro de origem pode ser selecionado mais de uma vez (cada seleção gera uma
    cópia independente e editável) — coerente com o modelo "cópia, não referência".

#### Funcionalidade

- Formulário de Armas
  (`app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx`):
  - Inserir `<WeaponEmbeddedEffectsField control={control} />` imediatamente após o
    bloco `<WeaponDamagesField ... name="extraDamages" .../>` e antes da seção
    "Descrição".
  - `buildPayload`: adicionar ao `WeaponPayload` os campos `enchantments:
    WeaponEmbeddedEffectPayload[]` e `enhancements: WeaponEmbeddedEffectPayload[]`
    (`WeaponEmbeddedEffectPayload = { name: string; effect?: string }`), preenchidos
    via um helper `buildEmbeddedEffectPayload(items)` análogo ao
    `buildDamagePayload` já existente: `{ name: item.name, effect: item.effect ||
    undefined }`.
  - `useEffect`/`reset` em modo edição: mapear `weaponDetail.enchantments` e
    `weaponDetail.enhancements` (arrays vindos da API) para o formato do form, mesmo
    padrão do mapeamento de `extraDamages`: `(weaponDetail.enchantments ?? []).map(
    (item) => ({ name: item.name, effect: item.effect ?? '' }))` (idem para
    `enhancements`). Em modo criação, `reset(weaponFormDefaultValues)` já cobre os
    arrays vazios.

- Schema (`app-web/src/shared/formSchemas/WeaponFormSchema/index.ts`):
  - Novo `weaponEmbeddedEffectItemSchema = z.object({ name: z.string().min(1,
    'Informe o nome'), effect: z.string() })`, com `WeaponEmbeddedEffectItemFormData`
    e `weaponEmbeddedEffectItemDefaultValues = { name: '', effect: '' }` (efeito
    **assumido opcional**, mesmo padrão de `description`/`privateInformation` no
    próprio `weaponFormSchema` — nenhum campo de rich text da Arma é obrigatório
    hoje. **Ponto a sinalizar**: a demanda não especificou se "Efeito" é obrigatório
    dentro do item; se o comportamento esperado for diferente, precisa ser
    confirmado antes de implementar).
  - Adicionar ao `weaponFormSchema`: `enchantments:
    z.array(weaponEmbeddedEffectItemSchema)` e `enhancements:
    z.array(weaponEmbeddedEffectItemSchema)`.
  - Adicionar ao `weaponFormDefaultValues`: `enchantments: []` e `enhancements: []`.

- Interface (`app-web/src/shared/interfaces/Entities/Weapon/index.ts`):
  - Novo `IWeaponEmbeddedEffect { name: string; effect?: string | null }`.
  - Adicionar a `IWeapon`: `enchantments: IWeaponEmbeddedEffect[]` e `enhancements:
    IWeaponEmbeddedEffect[]` (arrays jsonb vindos da API, conforme decisão do
    orquestrador — sem `id`/FK, só a cópia).
  - `IWeaponListItem` não precisa desses campos (a listagem de armas não exibe
    Encantamentos/Aprimoramentos, só o detalhe/`WeaponView`).

- Visualização
  (`app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx`):
  - Adicionar dois novos blocos `detailSectionBox`, logo após o bloco "Dano Extra" e
    antes do bloco "Descrição", seguindo exatamente o mesmo modelo visual (header
    com ícone + `Label` + corpo com `flex flex-col gap-3 px-3 py-3`):
    - "Encantamentos": itera `weapon.enchantments`, mostrando para cada item um
      `Label` com o `name` e, abaixo, `RichTextViewer value={item.effect}
      emptyLabel={NOT_INFORMED}`; `DefaultText` "Nenhum item adicionado." quando o
      array estiver vazio. Ícone sugerido: `GiMagicSwirl` (`react-icons/gi`), mesmo
      ícone já definido para o item de menu "Encantamentos" na task irmã.
    - "Aprimoramentos": idêntico, iterando `weapon.enhancements`, ícone sugerido
      `GiUpgrade` (`react-icons/gi`), mesmo ícone do item de menu "Aprimoramentos" na
      task irmã.

- Integrações com API:
  - `PUT /weapons/:id` e `POST /weapons` passam a enviar `enchantments`/
    `enhancements` no payload (arrays de `{ name, effect? }`, sem `id`) — contrato já
    definido pelo orquestrador, não requer novo endpoint.
  - `GET /weapons/:id` passa a retornar `enchantments`/`enhancements` no detalhe da
    arma — consumido por `WeaponCreateForm` (modo edição) e `WeaponView`.
  - `GET /enchantments?type=weapon&name=...&page=...&perPage=...` e `GET
    /enhancements?type=weapon&name=...&page=...&perPage=...` — usados exclusivamente
    pelo `WeaponEmbeddedEffectPickerModal` para listar candidatos a "selecionar
    existente" (via `useGetEntityList`).
  - `GET /enchantments/:id` e `GET /enhancements/:id` — usados pelo
    `WeaponEmbeddedEffectPickerModal` para buscar o `effect` completo do registro
    escolhido antes de copiar os valores para o item do formulário (via
    `useGetEntityById`).

- Formulário/validação:
  - Cada item de Encantamento/Aprimoramento (criado avulso ou copiado de um
    registro existente) tem exatamente dois campos editáveis: Nome (obrigatório,
    `min(1)`) e Efeito (rich text, opcional — ver ponto sinalizado acima).
  - Nenhum campo de `id`/referência é armazenado ou enviado — tanto na criação
    avulsa quanto na cópia de um registro existente, o item guarda só `{ name,
    effect }`.
  - Itens copiados de um registro existente permanecem livremente editáveis após a
    cópia (não ficam bloqueados/read-only), conforme decisão do orquestrador.

- Acesso Google: o `WeaponCreateForm` (e, portanto, o novo
  `WeaponEmbeddedEffectsField`) só é alcançável a partir de `armas/page.tsx`, que já
  oculta o botão "Novo" para `isGoogleUser` e o `WeaponsListItem` já oculta a ação
  "Editar" para o mesmo grupo (padrão pré-existente, não alterado por esta task).
  Não é necessária nenhuma lógica adicional de ocultação dentro do
  `WeaponEmbeddedEffectsField`/modais desta task, já que usuários Google nunca
  chegam a renderizar esse formulário. A listagem usada pelo
  `WeaponEmbeddedEffectPickerModal` (`GET /enchantments`/`GET /enhancements`) é
  somente leitura por natureza, então não há restrição adicional a aplicar mesmo se
  o formulário fosse acessado.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Arquivos revisados: `WeaponEmbeddedEffectsField/index.tsx`,
`WeaponEmbeddedEffectsField/WeaponEmbeddedEffectsTabPanel.tsx`,
`WeaponEmbeddedEffectsField/WeaponEmbeddedEffectChoiceModal.tsx`,
`WeaponEmbeddedEffectsField/WeaponEmbeddedEffectPickerModal.tsx`,
`WeaponCreateForm/index.tsx`, `WeaponView/index.tsx`,
`shared/formSchemas/WeaponFormSchema/index.ts`,
`shared/interfaces/Entities/Weapon/index.ts`, além dos DTOs reais em
`app-api/src/modules/weapons/dto/` (`create-weapon.dto.ts`,
`weapon-embedded-effect.dto.ts`, `weapon-embedded-effect-response.dto.ts`,
`weapon-response.dto.ts`) e das interfaces `IEnchantment`/`IEnhancement` da feature
irmã, usadas para checar compatibilidade de contrato.

De modo geral a implementação segue fielmente o plano: a seção de abas
(`WeaponEmbeddedEffectsField`) está posicionada corretamente após "Dano Extra" e
antes de "Descrição" em `WeaponCreateForm`; um único `WeaponEmbeddedEffectsTabPanel`
é reaproveitado (parametrizado por `fieldName`/`entityLabel`/`entityUrl`/
`addButtonLabel`) para as duas abas, no espírito de `WeaponDamagesField`, sem
duplicação; ambos os painéis ficam sempre montados e apenas o ativo é exibido via
`display: none`; o botão "Adicionar..." permanece visível abaixo dos itens, com
suporte a múltiplos itens e remoção individual; o fluxo "criar avulso" vs.
"selecionar existente" está correto — o `WeaponEmbeddedEffectPickerModal` filtra por
`type: 'weapon'` fixo e, ao selecionar, copia apenas `name`/`effect` para o item do
form (nenhum `id` é armazenado ou enviado no payload); `FormRichTextInput`/
`RichTextViewer` são reaproveitados sem introduzir lib nova; o mapeamento de
`weaponDetail.enchantments`/`enhancements` no `reset` de edição segue exatamente o
padrão de `extraDamages`; e o payload/tipos batem com `CreateWeaponDto`/
`WeaponResponseDto`/`WeaponEmbeddedEffectDto` do `app-api`.

Foram encontrados os seguintes pontos:

- **`WeaponEmbeddedEffectPickerModal.tsx` (linhas 56-97)** — Fechar o modal (botão
  "X"/clique fora) enquanto a busca do detalhe do item selecionado
  (`useGetEntityById`) ainda está pendente não cancela a seleção. O estado local
  `selectedId` só é resetado quando o modal é **reaberto** (`open: false -> true`,
  efeito das linhas 56-64), não quando é fechado. Como `enabled: !!selectedId` no
  `useGetEntityById` não depende de `open`, a requisição continua em andamento e,
  quando o detalhe chegar (já com o modal fechado), o `useEffect` das linhas 89-97
  dispara mesmo assim, chamando `onSelect(...)` e adicionando o item ao formulário
  silenciosamente — mesmo que o usuário tenha fechado o modal com a intenção de
  cancelar a seleção.
  - Trecho: `enabled: !!selectedId` (linha 86) e `useEffect(() => { if
    (!selectedDetail) return; onSelect(...); setSelectedId(null); onClose(); },
    [selectedDetail, onSelect, onClose])` (linhas 89-97), sem checagem de `open`.
  - Sugestão: usar `enabled: open && !!selectedId`, e/ou resetar `selectedId` também
    ao fechar (ex.: criar um `handleClose` que chama `setSelectedId(null)` antes de
    `onClose()` e usá-lo tanto no botão de fechar do `FormModal` quanto checar `open`
    dentro do `useEffect` antes de disparar `onSelect`.

- **`WeaponEmbeddedEffectPickerModal.tsx` (linha 84-87)** — A busca do detalhe do
  item selecionado (`useGetEntityById<IEnchantment | IEnhancement>`) não trata
  `isError`/`error`. Se a requisição falhar (registro excluído entre a listagem e o
  clique, erro de rede, etc.), `selectedId` permanece preenchido indefinidamente, a
  linha fica travada exibindo `CircularProgress` para sempre e as demais ações da
  tabela ficam desabilitadas (`isSelecting`), sem nenhum toast informando o erro ao
  usuário nem forma de recuperação além de fechar/reabrir o modal manualmente.
  - Trecho: `const { data: selectedDetail } = useGetEntityById<IEnchantment |
    IEnhancement>({ url: \`${entityUrl}/${selectedId}\`, enabled: !!selectedId });`
  - Sugestão: seguir o mesmo padrão já usado em `WeaponCreateForm`
    (`isWeaponDetailError` + `showToast`) — capturar `isError`/`error`, exibir um
    toast de erro e resetar `selectedId` para desbloquear a tabela.

- **`WeaponEmbeddedEffectPickerModal.tsx` (linhas 24-27, 70-73)** — A interface local
  `WeaponEmbeddedEffectCandidate { id: string; name: string }` duplica os tipos já
  existentes `IEnchantmentListItem`/`IEnhancementListItem` de
  `shared/interfaces/Entities`.
  - Sugestão: usar `IEnchantmentListItem | IEnhancementListItem` como `TItem`
    genérico do `useGetEntityList` em vez de recriar uma interface equivalente.

- **`WeaponEmbeddedEffectPickerModal.tsx` (linhas 155-164)** — O `IconButton`
  "Selecionar" recebe `disabled={isSelecting}` diretamente dentro de um `Tooltip`.
  Por padrão do MUI, elementos `disabled` não disparam eventos de mouse, então o
  tooltip não é exibido enquanto o botão estiver desabilitado (impacto visual baixo,
  já que o botão está mesmo desabilitado nesse estado).
  - Sugestão: envolver o `IconButton` num `<span>` quando `disabled` for `true`, caso
    se queira manter o tooltip funcional nesse estado (opcional, baixa prioridade).

Nenhum problema bloqueante de compilação, tipagem, nomenclatura/estrutura de pastas,
formulário (`react-hook-form`+`zod`), reaproveitamento de componentes de UI, ícones
(`react-icons`), acessibilidade básica ou acesso Google foi encontrado além dos itens
acima.

## Correções

Status: concluído

Arquivo alterado:
`app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectPickerModal.tsx`

Correções aplicadas para os 4 achados da seção "Revisão":

1. Fechar o modal com a busca do detalhe pendente não adiciona mais o item
   silenciosamente: `useGetEntityById` passou a usar `enabled: open &&
   !!selectedId`; o `useEffect` que dispara `onSelect(...)` passou a checar `open`
   antes de agir; e o `useEffect` que reseta `nameFilter`/`page` ao abrir agora
   também reseta `selectedId` sempre que `open` muda (inclusive ao fechar), o que
   também troca a query key (`${entityUrl}/${selectedId}`) para uma que não dispara
   `onSelect`.
2. Adicionado tratamento de erro na busca do detalhe (`isError`/`error` de
   `useGetEntityById`) seguindo o mesmo padrão de `WeaponCreateForm`
   (`isWeaponDetailError`/`showToast`): em caso de falha, exibe um toast de erro em
   pt-BR (`Não foi possível carregar os dados do encantamento/aprimoramento
   selecionado.`, com fallback para a mensagem da API) e reseta `selectedId`,
   destravando a linha da tabela.
3. Removida a interface local `WeaponEmbeddedEffectCandidate`; `useGetEntityList`
   agora usa `IEnchantmentListItem | IEnhancementListItem` (de
   `shared/interfaces/Entities`) como `TItem`.
4. `IconButton` "Selecionar" (dentro do `Tooltip`) agora é envolvido por um `<span>`
   quando pode ficar `disabled`, para o tooltip continuar funcionando nesse estado.

Não houve alteração de comportamento além do descrito nos 4 achados.

Lint/build do `app-web` não foram executados por este agente (toolset restrito a
Read/Grep/Glob/Edit/Write/Skill, sem acesso a shell) — pendente de execução pelo
orquestrador ou por um agente com acesso a Bash antes do merge.

## Correção de lint (react-hooks/set-state-in-effect)

Status: concluído (verificação por leitura — sem acesso a Bash/`npm run lint` neste
agente)

`npm run lint` apontou 4 erros reais de `react-hooks/set-state-in-effect` em
`WeaponEmbeddedEffectPickerModal.tsx` (chamadas de `setState` diretamente dentro de
`useEffect`, nas linhas ~60, 68, 100 e 115 da versão anterior). O arquivo foi
reestruturado para eliminar os 3 `useEffect` do componente, preservando
integralmente o comportamento já validado na seção "Revisão"/"Correções" acima:

- O componente foi dividido em `WeaponEmbeddedEffectPickerModal` (wrapper que só
  passa `open`/`onClose` ao `FormModal`) e um novo componente interno
  `WeaponEmbeddedEffectPickerModalBody`, renderizado apenas quando `open` é `true`
  (`{open && <WeaponEmbeddedEffectPickerModalBody ... />}`). Isso substitui o
  `useEffect` que resetava `nameFilter`/`page`/`selectedId` ao abrir o modal: como o
  corpo é desmontado por completo quando `open` vira `false` e remontado do zero na
  próxima abertura, o estado local já nasce limpo — sem precisar de efeito. Esse
  desmonte também é o que garante o requisito 1 (fechar o modal durante o
  carregamento do detalhe cancela a seleção): ao desmontar, a mutation em voo perde
  seu observer e o `onSuccess` correspondente nunca chega a rodar.
- O reset de `page` ao trocar `nameFilter` (antes um `useEffect` observando
  `nameFilter`) passou a acontecer dentro do próprio `onChange` do campo de busca
  (`handleNameFilterChange`), que chama `setNameFilter` e `setPage(1)` em sequência —
  ambos dentro de um event handler, não de um efeito.
- A busca do detalhe do item selecionado (antes `useGetEntityById`, um `useQuery`
  reativo sem `onSuccess`/`onError`, combinada com 2 `useEffect` para reagir a
  sucesso/erro e resetar `selectedId`) foi trocada por um novo hook de mutação
  dedicado, `useWeaponEmbeddedEffectDetailMutation`
  (`app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts`,
  registrado no barrel `EntityQueries/index.ts`), disparado imperativamente pelo
  clique em "Selecionar" (`detailMutation.mutate(item.id)`). O `onSuccess` do hook
  chama `onSelect(...)`+`onClose()`; o `onError` exibe o mesmo toast de erro em
  pt-BR de antes. Como são callbacks de `useMutation` (não um `useEffect`), não há
  `setState` dentro de efeito — e como o próprio estado de carregamento/seleção
  (`isSelecting`/`selectingId`) passou a ser derivado de `detailMutation.isPending`/
  `detailMutation.variables`, o `useState<string | null>` de `selectedId` foi
  eliminado (não é mais necessário resetá-lo manualmente em nenhum caminho).
- Segue filtrando por `type=weapon` fixo (`useGetEntityList`) e copiando apenas
  `name`/`effect` no `onSelect` (nenhum `id` vai para o payload da arma) —
  comportamento inalterado.
- O `<span>` envolvendo o `IconButton` "Selecionar" dentro do `Tooltip` (correção
  anterior) foi mantido.

Verificação: por leitura cuidadosa do arquivo final, não restou nenhum `useEffect`
nem chamada de `setState` fora de handlers de evento/callbacks de
`useMutation`/`onChange`/`onPageChange` em `WeaponEmbeddedEffectPickerModal.tsx`. Não
foi possível rodar `npm run lint` (toolset deste agente não inclui Bash) — pendente
de confirmação pelo orquestrador ou por um agente com acesso a shell antes do merge.

Arquivos alterados:
- `app-web/src/app/(authorized)/armas/components/WeaponEmbeddedEffectsField/WeaponEmbeddedEffectPickerModal.tsx`
  (reestruturado, sem `useEffect`)
- `app-web/src/hooks/Queries/EntityQueries/useWeaponEmbeddedEffectDetailMutation/index.ts`
  (novo hook)
- `app-web/src/hooks/Queries/EntityQueries/index.ts` (export do novo hook)
