# Task Web: Encantamentos e Aprimoramentos

## Contexto
Não existe `.claude/tasks/encantamentos-aprimoramentos/spec.md` para esta demanda. As
decisões abaixo foram passadas diretamente pelo orquestrador (não reabrir):

- Duas features de CRUD completo, irmãs e **independentes** entre si (rotas, stores,
  interfaces, schemas e componentes de página próprios para cada uma — só compartilham o
  enum de "tipo de equipamento aplicável" descrito abaixo):
  - **Encantamentos** — rota `/encantamentos`, entidade API `enchantments`.
  - **Aprimoramentos** — rota `/aprimoramentos`, entidade API `enhancements`.
- **Decisão de nomenclatura registrada**: o nome em inglês de "Aprimoramentos" é
  `enhancements` / `Enhancement` (classes, interfaces, hooks, rotas de API, nomes de
  arquivo — ex. `IEnhancement`, `useSelectedEnhancementStore`, `EnhancementFormSchema`,
  `/enhancements`). Deliberadamente **não** `improvements`, para não colidir/confundir
  com a feature já existente "Melhorias e Defeitos" (`improvement-flaws`,
  `IImprovementDefectItem` etc., ver `.claude/tasks/melhorias-defeitos/`). Qualquer nova
  referência de código para "Aprimoramentos" nesta demanda deve usar `enhancement(s)`,
  nunca `improvement(s)`.
- Campos do formulário, idênticos nas duas features: Nome* (obrigatório), Tipo (select
  não obrigatório, valores fixos `weapon | armor | shield | accessory`), Efeito (rich
  text).
- Sem campo de Tags e sem vínculo com nenhuma entidade auxiliar via API (diferente de
  `tracos`, que tem `traitType`/`tags`) — o campo "Tipo" é um enum estático do frontend,
  não uma entidade buscada via query.

Investigação de código já feita (padrões a seguir):

- `app-web/src/app/(authorized)/tracos/` (referência principal — mais próxima em
  estrutura: nome + tipo + rich text) e `app-web/src/app/(authorized)/acessorios/` —
  ambas seguem o mesmo esqueleto de CRUD completo: `page.tsx` (estado de filtros,
  `FormModal`+`ViewModal`+`ConfirmationModal`, `useIsGoogleUser`), `components/<Entidade>sList`
  (tabela + paginação), `components/<Entidade>sListItem` (linha + ações, oculta
  editar/excluir para Google), `components/<Entidade>CreateForm` (react-hook-form + zod,
  `useGetEntityById` em modo edição, `usePostEntity`/`usePutEntity`), `components/<Entidade>View`
  (`useGetEntityById`, `RichTextViewer`), `components/<Entidade>sFilterSection` (form de
  busca separado, nunca inline em `page.tsx`). Encantamentos/Aprimoramentos replicam
  exatamente esse esqueleto, porém mais simples: sem `tags`/`traitType` (nada de
  `FormMultiAutocompleteInput`/`useTagOptionsQuery`), então a listagem tem só 3 colunas
  (Nome, Tipo, Ações) e o filtro só tem o campo Nome.
- `app-web/src/app/(authorized)/armas/data/index.ts` — padrão de opções estáticas de
  enum traduzido: `WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS` como array `{value,
  label}[]`, consumido por `FormAutocompleteInput<FormData, (typeof OPTIONS)[number]>`
  com `getOptionLabel`/`getOptionValue`. Como o enum `weapon | armor | shield |
  accessory` é compartilhado pelas duas features (não é local de uma única feature como
  os enums de arma), o mapa de opções/labels vai para `shared/constants/` em vez de
  ficar dentro de uma pasta `data/` de feature — único desvio consciente do padrão
  `armas/data`, feito por reuso entre as duas entidades irmãs.
- `app-web/src/shared/constants/EntityMentions/index.ts` +
  `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` — os 4 pontos
  que precisam ganhar entradas `enchantment`/`enhancement` para a busca global (menções
  `@` no rich text) funcionar com as novas entidades: `ENTITY_MENTION_TYPE_LABELS`,
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `ENTITY_MENTION_VIEWABLE_TYPES` e o registry
  `ENTITY_MENTION_VIEW_REGISTRY` do dispatcher (que precisa importar `EnchantmentView`/
  `EnhancementView`). Não há nenhum outro ponto no código com lista hardcoded de tipos de
  entidade (`MentionSuggestionList` já resolve o label de forma genérica via
  `ENTITY_MENTION_TYPE_LABELS[item.entityType] ?? item.entityType`, e o endpoint
  `GET /search` é agnóstico de tipo no frontend).
- `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` — item de label
  `'EQUIPAMENTOS'` (ícone `FiTool`) já lista Armas/Armaduras/Acessórios/Escudos/Traços
  com ícones de `react-icons/gi`/`react-icons/pi`. Ícones `GiMagicSwirl` e `GiUpgrade`
  (ambos já existem em `react-icons/gi`, confirmados) são coerentes para
  Encantamentos/Aprimoramentos respectivamente.

## Etapas

### 1. web-dev
Status: concluído

Observações sobre os dois pontos que estavam sinalizados como "não confirmados" no
plano original — ambos decididos pelo orquestrador antes da implementação:
- Filtro por Tipo: incluído em `EnchantmentsFilterSection`/`EnhancementsFilterSection`
  (via `DefaultAutocompleteInput` com `EQUIPMENT_APPLICABLE_TYPE_OPTIONS`), com `type`
  adicionado a `IEnchantmentListFilters`/`IEnhancementListFilters` e repassado a
  `useGetEntityList`. Contrato confirmado em `FindEnchantmentsQueryDto`/
  `FindEnhancementsQueryDto` (app-api), que já suportam `type` como filtro de
  igualdade exata.
- Campo "Efeito": mantido opcional (`z.string()` sem `.min(1)` nos dois
  `FormSchema`), payload omite o campo quando vazio (`effect: data.effect ||
  undefined`), igual ao padrão de `Trait.description`. Confirmado contra
  `CreateEnchantmentDto`/`CreateEnhancementDto` (app-api), onde `effect` é
  `@IsOptional()`.

Contrato de API confirmado antes da integração (leitura de
`app-api/src/modules/enchantments/**` e `app-api/src/modules/enhancements/**`):
rotas REST padrão (`GET/POST/PUT/DELETE /enchantments(/:id)` e equivalente para
`enhancements`), resposta paginada `{ data, total, page, perPage, totalPages }`,
`FindXQueryDto` com `name`/`type`/`page`/`perPage`, `CreateXDto` com `name`
obrigatório e `type`/`effect` opcionais — tudo conforme assumido no plano, nenhuma
divergência encontrada.

#### Componentes (se necessário)

- Componente: `EnchantmentsFilterSection`
  - Local: `app-web/src/app/(authorized)/encantamentos/components/EnchantmentsFilterSection/index.tsx`
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`,
    `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`, `onClear: () => void`
    (mesmo shape de `TraitsFilterSectionProps`, mas sem os props de tags).
  - Comportamento esperado: réplica de `TraitsFilterSection`
    (`app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx`)
    removendo o `DefaultMultiAutocompleteInput` de tags — só o `DefaultTextInput` "Nome"
    (`icon={<FiSearch />}`) + `PrimaryButton` "Filtrar" + `SecondaryButton` "Limpar
    filtros". **Ponto a sinalizar**: a demanda não pediu explicitamente filtro por
    "Tipo" na listagem; por padrão de menor escopo, o filtro cobre só Nome (assumido a
    partir do que foi decidido). Se for desejado também filtrar por Tipo, isso não foi
    confirmado nesta task — sinalizar ao orquestrador antes de implementar, se achar
    necessário.

- Componente: `EnhancementsFilterSection`
  - Local: `app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsFilterSection/index.tsx`
  - Props e comportamento: idênticos a `EnchantmentsFilterSection` acima, aplicados à
    feature de Aprimoramentos (mesma ressalva sobre filtro por Tipo não ter sido
    pedido).

- Constante compartilhada (não é componente visual, mas precisa existir antes dos dois
  formulários/listagens consumirem): `shared/constants/EquipmentApplicableType/index.ts`
  (novo, reexportado em `shared/constants/index.ts`), no mesmo formato de
  `WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS`:
  - `EquipmentApplicableTypeOption { value: EquipmentApplicableType; label: string }`.
  - `EQUIPMENT_APPLICABLE_TYPE_OPTIONS: EquipmentApplicableTypeOption[]` = `[{ value:
    'weapon', label: 'Arma' }, { value: 'armor', label: 'Armadura' }, { value: 'shield',
    label: 'Escudo' }, { value: 'accessory', label: 'Acessório' }]`.
  - `EQUIPMENT_APPLICABLE_TYPE_LABELS: Record<EquipmentApplicableType, string>` com o
    mesmo mapeamento, para resolver o label na coluna "Tipo" da listagem e no
    `<Entidade>View` sem precisar do array de options.
  - `EquipmentApplicableType` (o type `'weapon' | 'armor' | 'shield' | 'accessory'`) fica
    definido uma única vez em `shared/interfaces/Entities/EquipmentApplicableType/index.ts`
    (novo, reexportado em `shared/interfaces/Entities/index.ts`) e é importado tanto
    pelas interfaces `IEnchantment`/`IEnhancement` quanto por este arquivo de constantes
    — evita duplicar a união de strings em dois lugares, já que o enum é
    deliberadamente compartilhado pelas duas entidades irmãs.

#### Funcionalidade

- Páginas/rotas (novas):
  - `app-web/src/app/(authorized)/encantamentos/page.tsx` — réplica de
    `app-web/src/app/(authorized)/tracos/page.tsx` sem `useTagOptionsQuery`/estado de
    tags: título "Encantamentos", botão "Novo" oculto para Google, `EnchantmentsFilterSection`,
    `EnchantmentsList`, `FormModal` (títulos "Novo encantamento"/"Editar encantamento"),
    `ViewModal` ("Detalhes do Encantamento"), `ConfirmationModal` ("Excluir encantamento",
    mensagem `Tem certeza que deseja excluir o encantamento "${...}"?`).
  - `app-web/src/app/(authorized)/encantamentos/components/EnchantmentsList/index.tsx` —
    réplica de `TraitsList` com colunas Nome / Tipo / Ações (sem coluna Tags); "Tipo"
    resolvido via `EQUIPMENT_APPLICABLE_TYPE_LABELS[item.type] ?? 'Não informado'`.
    Texto de lista vazia: "Nenhum encantamento encontrado."
  - `app-web/src/app/(authorized)/encantamentos/components/EnchantmentsListItem/index.tsx` —
    réplica de `TraitsListItem` sem coluna/badge de tags, com `useIsGoogleUser` ocultando
    editar/excluir (mantém visualizar) — igual ao padrão da skill
    `web-permissao-google-readonly`.
  - `app-web/src/app/(authorized)/encantamentos/components/EnchantmentCreateForm/index.tsx` —
    réplica de `TraitCreateForm` sem tags/`traitTypeId`: campos "Nome" (`FormTextInput`),
    "Tipo de encantamento" (`FormAutocompleteInput<EnchantmentFormData, (typeof
    EQUIPMENT_APPLICABLE_TYPE_OPTIONS)[number]>`, options `EQUIPMENT_APPLICABLE_TYPE_OPTIONS`),
    em um grid `grid grid-cols-1 sm:grid-cols-2`, seguido de `FormRichTextInput` "Efeito"
    (`name="effect"`) abaixo. `useGetEntityById<IEnchantment>` em modo edição,
    `usePostEntity`/`usePutEntity` com `invalidateQueryKeys: [['/enchantments']]`, toasts
    "Encantamento cadastrado/atualizado/os erros com sucesso" em pt-BR, iguais ao padrão
    de `TraitCreateForm`.
  - `app-web/src/app/(authorized)/encantamentos/components/EnchantmentView/index.tsx` —
    réplica de `TraitView` sem bloco de tags: título = nome, um `detailInfoField` "Tipo"
    (label resolvido via `EQUIPMENT_APPLICABLE_TYPE_LABELS`, `NOT_INFORMED` quando
    ausente) e um `detailSectionBox` "Efeito" com `RichTextViewer value={enchantment.effect}`.
  - `app-web/src/app/(authorized)/encantamentos/components/EnchantmentsFilterSection/index.tsx` —
    ver subseção "Componentes" acima.
  - Estrutura espelhada para Aprimoramentos, trocando só nomes/rota/label:
    `app-web/src/app/(authorized)/aprimoramentos/page.tsx` (título "Aprimoramentos",
    mensagens "aprimoramento"), `.../components/EnhancementsList`,
    `.../EnhancementsListItem`, `.../EnhancementCreateForm` (label do campo select =
    "Tipo de aprimoramento"), `.../EnhancementView`, `.../EnhancementsFilterSection`.

- Interfaces novas (`shared/interfaces/Entities/`, reexportadas em
  `shared/interfaces/Entities/index.ts`):
  - `EquipmentApplicableType/index.ts` — `export type EquipmentApplicableType = 'weapon'
    | 'armor' | 'shield' | 'accessory';` (ver subseção "Componentes").
  - `Enchantment/index.ts` — `IEnchantmentListItem { id: string; name: string; type?:
    EquipmentApplicableType | null }`; `IEnchantment extends IEntity { name: string;
    type?: EquipmentApplicableType | null; effect?: string | null; createdAt: string;
    updatedAt: string }`; `IEnchantmentListFilters { name?: string; page?: number;
    perPage?: number }`.
  - `Enhancement/index.ts` — mesmo shape de `Enchantment/index.ts` com prefixo
    `IEnhancement*` (`IEnhancementListItem`, `IEnhancement`, `IEnhancementListFilters`).

- Schemas (`shared/formSchemas/`, reexportados em `shared/formSchemas/index.ts`), no
  mesmo padrão de `TraitFormSchema` (schema único, sem variante `*EditFormSchema` — não
  há campo que muda de comportamento entre criar/editar, igual a Traço):
  - `EnchantmentFormSchema/index.ts`: `enchantmentFormSchema = z.object({ name:
    z.string().min(1, 'Informe o nome'), type: z.string(), effect: z.string() })`;
    `EnchantmentFormData`, `enchantmentFormResolver`, `enchantmentFormDefaultValues = {
    name: '', type: '', effect: '' }`.
  - `EnhancementFormSchema/index.ts`: idêntico, com prefixo `enhancement*`.
  - **Ponto a sinalizar (não decidido pela demanda)**: o campo "Efeito" foi especificado
    apenas como "campo de rich text", sem dizer se é obrigatório. Assumido **opcional**
    (`z.string()` sem `.min(1)`), pelo mesmo padrão já usado nos campos de rich text
    análogos do projeto (`Trait.description`, `Accessory.description`, nenhum deles
    obrigatório). Se o comportamento esperado for "Efeito" obrigatório, isso precisa ser
    confirmado antes de implementar.

- Store (`store/PageStore/`, reexportado em `store/index.ts`), réplica exata de
  `TraitsStore`:
  - `EnchantmentsStore/index.ts` — `useSelectedEnchantmentStore` (`selectedEnchantment:
    IEnchantmentListItem | null`, `setSelectedEnchantment`, `resetSelectedEnchantment`).
  - `EnhancementsStore/index.ts` — `useSelectedEnhancementStore` (mesmo shape com
    `IEnhancementListItem`).

- Rotas (`shared/routes.ts`): adicionar `enchantments: '/encantamentos'` e
  `enhancements: '/aprimoramentos'` em `MENU_ROUTES` e em `APP_ROUTES.private`. Usar
  `APP_ROUTES.private.enchantments`/`APP_ROUTES.private.enhancements` em todo lugar
  (sidebar, `page.tsx` se necessário) — nunca hardcodar `/encantamentos`/`/aprimoramentos`.

- Menu (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`): adicionar 2
  entradas no array `children` do item `label: 'EQUIPAMENTOS'`:
  `{ label: 'Encantamentos', href: APP_ROUTES.private.enchantments, icon: GiMagicSwirl }`
  e `{ label: 'Aprimoramentos', href: APP_ROUTES.private.enhancements, icon: GiUpgrade }`
  (`GiMagicSwirl`/`GiUpgrade` importados de `react-icons/gi`, adicionados ao import já
  existente desse módulo no topo do arquivo — ambos os ícones já existem no pacote,
  confirmado).

- Busca global / menções de entidade — atualizar os 4 pontos identificados na
  investigação:
  - `shared/constants/EntityMentions/index.ts`:
    - `ENTITY_MENTION_TYPE_LABELS`: adicionar `enchantment: 'encantamento'` e
      `enhancement: 'aprimoramento'`.
    - `ENTITY_MENTION_DETAIL_URL_BY_TYPE`: adicionar `enchantment: (id) =>
      \`/enchantments/${id}\`` e `enhancement: (id) => \`/enhancements/${id}\``.
    - `ENTITY_MENTION_VIEWABLE_TYPES`: adicionar `'enchantment'` e `'enhancement'`.
  - `shared/components/EntityMentionViewDispatcher/index.tsx`: importar `EnchantmentView`
    (de `@/app/(authorized)/encantamentos/components/EnchantmentView`) e `EnhancementView`
    (de `@/app/(authorized)/aprimoramentos/components/EnhancementView`), e adicionar duas
    entradas ao `ENTITY_MENTION_VIEW_REGISTRY`: `enchantment: ({ entityId, onNotFound })
    => <EnchantmentView enchantmentId={entityId} onNotFound={onNotFound} />` e
    `enhancement: ({ entityId, onNotFound }) => <EnhancementView enhancementId={entityId}
    onNotFound={onNotFound} />` (props `enchantmentId`/`enhancementId` — nomear a prop de
    id do `<Entidade>View` de forma consistente com o restante dos `*View` existentes,
    ex. `traitId` em `TraitView`).

- Integrações com API (assumidas por convenção REST do projeto — todas as demais
  features seguem `GET /<entidade>` paginado, `GET /<entidade>/:id`, `POST/PUT/DELETE
  /<entidade>/:id`; não há `task-api.md` nesta pasta para confirmar contrato exato,
  então **confirmar nomes de campo/formato de resposta reais antes de codar** se algum
  `task-api.md` for criado em paralelo ou se os DTOs reais em `app-api/src/modules/`
  divergirem do assumido aqui):
  - `GET /enchantments` (via `useGetEntityList<IEnchantmentListItem,
    IEnchantmentListFilters>`, filtro `name`), `GET /enchantments/:id` (via
    `useGetEntityById<IEnchantment>`), `POST /enchantments`, `PUT /enchantments/:id`,
    `DELETE /enchantments/:id` — payload de escrita `{ name: string, type?:
    EquipmentApplicableType, effect?: string }` (`type`/`effect` omitidos quando vazios,
    mesmo padrão de `buildPayload` em `TraitCreateForm`).
  - `GET /enhancements`, `GET /enhancements/:id`, `POST /enhancements`, `PUT
    /enhancements/:id`, `DELETE /enhancements/:id` — mesmo formato de payload acima.

- Formulário/validação: ver detalhamento em "Componentes" (constante de opções) e nesta
  subseção "Schemas" acima — Nome obrigatório (`min(1)`), Tipo opcional (`Autocomplete`
  com as 4 opções fixas, sem validação adicional), Efeito assumido opcional (ver ponto
  sinalizado sobre não ter sido confirmado como obrigatório).

- Acesso Google: ocultar criar/editar/excluir (padrão), mantendo só visualizar — em
  ambas as páginas (`EnchantmentsPage`/`EnhancementsPage`, escondendo o botão "Novo" via
  `useIsGoogleUser`) e nos respectivos `*ListItem` (escondendo os `IconButton`s de
  editar/excluir, mantendo o de visualizar), exatamente como em `tracos/page.tsx` e
  `tracos/components/TraitsListItem`.

Status: concluído
Componentes: app-web/src/app/(authorized)/encantamentos/components/EnchantmentsFilterSection/index.tsx, app-web/src/app/(authorized)/encantamentos/components/EnchantmentsList/index.tsx, app-web/src/app/(authorized)/encantamentos/components/EnchantmentsListItem/index.tsx, app-web/src/app/(authorized)/encantamentos/components/EnchantmentCreateForm/index.tsx, app-web/src/app/(authorized)/encantamentos/components/EnchantmentView/index.tsx, app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsFilterSection/index.tsx, app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsList/index.tsx, app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsListItem/index.tsx, app-web/src/app/(authorized)/aprimoramentos/components/EnhancementCreateForm/index.tsx, app-web/src/app/(authorized)/aprimoramentos/components/EnhancementView/index.tsx
Arquivos: app-web/src/app/(authorized)/encantamentos/page.tsx, app-web/src/app/(authorized)/aprimoramentos/page.tsx, app-web/src/shared/interfaces/Entities/EquipmentApplicableType/index.ts, app-web/src/shared/interfaces/Entities/Enchantment/index.ts, app-web/src/shared/interfaces/Entities/Enhancement/index.ts, app-web/src/shared/interfaces/Entities/index.ts, app-web/src/shared/constants/EquipmentApplicableType/index.ts, app-web/src/shared/constants/index.ts, app-web/src/shared/formSchemas/EnchantmentFormSchema/index.ts, app-web/src/shared/formSchemas/EnhancementFormSchema/index.ts, app-web/src/shared/formSchemas/index.ts, app-web/src/store/PageStore/EnchantmentsStore/index.ts, app-web/src/store/PageStore/EnhancementsStore/index.ts, app-web/src/store/index.ts, app-web/src/shared/routes.ts, app-web/src/app/(authorized)/components/Sidebar/data/index.ts, app-web/src/shared/constants/EntityMentions/index.ts, app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. A implementação replica
fielmente o esqueleto de referência `tracos` (page + List + ListItem + CreateForm +
View + FilterSection), usa corretamente os hooks genéricos de `hooks/Queries`
(`useGetEntityList`, `useGetEntityById`, `usePostEntity`, `usePutEntity`,
`useDeleteEntity`) com `invalidateQueryKeys: [['/enchantments']]` /
`[['/enhancements']]` nas mutações de criar/editar/excluir, rotas centralizadas em
`APP_ROUTES.private.enchantments`/`.enhancements` (nada hardcoded), entradas
corretas no submenu ITENS > EQUIPAMENTOS do Sidebar (`GiMagicSwirl`/`GiUpgrade`),
restrição de usuário Google via `useIsGoogleUser` ocultando "Novo"
(`EnchantmentsPage`/`EnhancementsPage`) e editar/excluir
(`EnchantmentsListItem`/`EnhancementsListItem`, mantendo visualizar) em ambas as
features, uso de `FormRichTextInput`/`RichTextViewer` para o campo "Efeito" sem
nenhuma biblioteca de editor nova, e os 4 pontos de menção/busca global
(`ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE`,
`ENTITY_MENTION_VIEWABLE_TYPES` e o registry do `EntityMentionViewDispatcher`)
atualizados com `enchantment`/`enhancement`, incluindo o import e uso corretos de
`EnchantmentView`/`EnhancementView` com as props `enchantmentId`/`enhancementId`
(consistentes com o padrão `traitId` de `TraitView`). Os ícones usados
(`FiSearch`, `FiEye`, `FiEdit2`, `FiTrash2`, `FiTag`, `FiFileText`) vêm todos de
`react-icons`, com `aria-label` em pt-BR nos `IconButton`s sem texto visível. Os
contratos de payload/filtros (`name`, `type`, `effect` opcionais; enum
`weapon | armor | shield | accessory`) conferem exatamente com
`CreateEnchantmentDto`/`FindEnchantmentsQueryDto`/`EnchantmentResponseDto` e os
equivalentes de `enhancements` em `app-api/src/modules/enchantments/**` e
`app-api/src/modules/enhancements/**`. Todos os textos de UI (títulos, toasts,
labels, mensagens de confirmação/erro) estão em pt-BR. Nenhuma referência
incorreta a `improvement(s)` foi introduzida para a feature de Aprimoramentos.

Arquivos revisados: `app-web/src/app/(authorized)/encantamentos/page.tsx`,
`app-web/src/app/(authorized)/encantamentos/components/EnchantmentsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/encantamentos/components/EnchantmentsList/index.tsx`,
`app-web/src/app/(authorized)/encantamentos/components/EnchantmentsListItem/index.tsx`,
`app-web/src/app/(authorized)/encantamentos/components/EnchantmentCreateForm/index.tsx`,
`app-web/src/app/(authorized)/encantamentos/components/EnchantmentView/index.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/page.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsFilterSection/index.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsList/index.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/components/EnhancementsListItem/index.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/components/EnhancementCreateForm/index.tsx`,
`app-web/src/app/(authorized)/aprimoramentos/components/EnhancementView/index.tsx`,
`app-web/src/shared/interfaces/Entities/EquipmentApplicableType/index.ts`,
`app-web/src/shared/interfaces/Entities/Enchantment/index.ts`,
`app-web/src/shared/interfaces/Entities/Enhancement/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/constants/EquipmentApplicableType/index.ts`,
`app-web/src/shared/constants/index.ts`,
`app-web/src/shared/formSchemas/EnchantmentFormSchema/index.ts`,
`app-web/src/shared/formSchemas/EnhancementFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/store/PageStore/EnchantmentsStore/index.ts`,
`app-web/src/store/PageStore/EnhancementsStore/index.ts`, `app-web/src/store/index.ts`,
`app-web/src/shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`app-web/src/shared/constants/EntityMentions/index.ts`,
`app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` — comparados
contra as referências `app-web/src/app/(authorized)/tracos/**` e os contratos reais
em `app-api/src/modules/enchantments/**`/`app-api/src/modules/enhancements/**`.
