# Task Web: Equipamentos submenu (substituição de Equipamentos por Armas, Armaduras, Acessórios e Escudos)

## Contexto
Ver .claude/tasks/equipamentos-submenu/spec.md

Escopo restrito ao `app-web`. Reaproveitar exatamente o padrão hoje existente na
página `app-web/src/app/(authorized)/equipamentos/` (listagem paginada + filtro de
nome + modal de criar/editar + modal de visualização + confirmação de exclusão,
usando os hooks genéricos de `hooks/Queries`) como referência de implementação
para as quatro novas páginas. Também reaproveitar o padrão de accordion já
implementado em `.claude/tasks/sidebar-secoes-accordion/` (componente
`SidebarSectionAccordion`, `Collapse` do MUI, `FiChevronDown` rotacionado,
`aria-expanded`, estado local de expansão com inicialização "lazy" + `useEffect`
de sincronização por `pathname`) para o novo nível de submenu.

Este plano depende de decisões de nomenclatura definidas no `app-api` (ver
`task-api` da mesma demanda): os valores exatos de `LinkableEntityType` para as
quatro novas entidades. Assume-se o padrão singular em inglês já usado para as
demais entidades mencionáveis (`weapon`, `armor`, `accessory`, `shield`,
equivalente a `material`, `consumable`, `equipment` hoje) — confirmar esses
valores batem com o backend antes de codificar `shared/constants/EntityMentions/`.

## Etapas

### 1. web-dev

#### Componentes

Nenhum componente novo em `shared/components/` é necessário — todos os
primitivos usados hoje pela página de Equipamentos já existem e devem ser
reaproveitados tal como estão: `PageContainer`, `Title`, `PrimaryButton`,
`FormModal`/`ViewModal`/`ConfirmationModal`, `DefaultText`/`Label`,
`DefaultTextInput`, `FormTextInput`/`FormAutocompleteInput`/
`FormMultiAutocompleteInput`/`FormRichTextInput`, `ImageAvatarPreview`,
`ImagePreviewDialog`, `TagBadge`, `RichTextViewer`.

Cada uma das quatro páginas precisa, no entanto, do seu próprio conjunto de
componentes locais (não reutilizáveis entre si, um conjunto por entidade,
seguindo exatamente a estrutura de pastas/nomes hoje usada em
`equipamentos/components/` e replicada em outras entidades análogas como
`materiais/components/`):

- `<Entidade>sList` (ex.: `WeaponsList`) — tabela paginada (`TableContainer` +
  `Table` + `TablePagination`), colunas Imagem/Nome/Tags/Preço/Ações, mesma
  estrutura de `EquipmentList`.
- `<Entidade>sListItem` (ex.: `WeaponsListItem`) — linha da tabela com preview de
  imagem, nome, tags (`TagBadge`), preço formatado (`formatPriceWithCurrency`) e
  ações (visualizar sempre; editar/excluir ocultos para `provider: 'google'` via
  `useIsGoogleUser`), mesma estrutura de `EquipmentListItem`.
- `<Entidade>sFilterSection` (ex.: `WeaponsFilterSection`) — formulário de filtro
  por nome (`DefaultTextInput` com ícone de busca + `PrimaryButton` "Filtrar"),
  mesma estrutura de `EquipmentFilterSection`. Os inputs de filtro não ficam
  inline em `page.tsx`.
- `<Entidade>CreateForm` (ex.: `WeaponCreateForm`) — formulário de criar/editar via
  `react-hook-form` + schema zod da entidade, mesma estrutura de
  `EquipmentCreateForm` (campos Nome, Imagem Referência, Preço, Moeda, Tags,
  Descrição (rich text), Informações Privadas (rich text)).
- `<Entidade>View` (ex.: `WeaponView`) — visualização somente-leitura usada tanto
  pelo modal de "Detalhes" da própria página quanto pelo
  `EntityMentionViewDispatcher`, mesma estrutura de `EquipmentView` (imagem com
  preview ampliável, nome, tags, preço, descrição, bloco de "Informações
  Privadas" oculto para `provider: 'google'`, prop `onNotFound` para fechar o
  modal quando a entidade mencionada foi excluída/404).

Nomenclatura por entidade (pasta em `app-web/src/app/(authorized)/<rota>/components/`):
- Armas (`armas/`): `WeaponsList`, `WeaponsListItem`, `WeaponsFilterSection`,
  `WeaponCreateForm`, `WeaponView`.
- Armaduras (`armaduras/`): `ArmorsList`, `ArmorsListItem`, `ArmorsFilterSection`,
  `ArmorCreateForm`, `ArmorView`.
- Acessórios (`acessorios/`): `AccessoriesList`, `AccessoriesListItem`,
  `AccessoriesFilterSection`, `AccessoryCreateForm`, `AccessoryView`.
- Escudos (`escudos/`): `ShieldsList`, `ShieldsListItem`, `ShieldsFilterSection`,
  `ShieldCreateForm`, `ShieldView`.

Além disso, a sidebar precisa de um novo componente local para suportar um nível
de submenu dentro de um item de navegação (hoje só existe accordion no nível de
seção):

- Componente: `SidebarNavItemAccordion`
  - Local: `app-web/src/app/(authorized)/components/Sidebar/components/SidebarNavItemAccordion/index.tsx`
    (mesmo padrão de pasta local de `SidebarSectionAccordion`, fortemente
    acoplado ao `Sidebar`; não vai para `shared/components/`).
  - Props sugeridas (espelhando `SidebarSectionAccordion`, um nível mais interno):
    `label: string` (rótulo do item pai, ex.: "EQUIPAMENTOS" em caixa alta,
    seguindo o mesmo padrão do título de seção "JOGO"), `icon: IconType` (ícone
    do item pai), `items: NavItem[]` (os 4 itens filhos), `pathname: string`,
    `iconFontSize: number`.
  - Comportamento esperado: reaproveita exatamente o padrão visual/estado de
    `SidebarSectionAccordion` (cabeçalho clicável com `aria-expanded`, ícone
    `FiChevronDown` que rotaciona 180° com transição, lista de filhos dentro de
    `Collapse` do MUI), mas renderizado como um item all dentro da lista de itens
    de uma seção (mesmo nível visual dos demais `NavItem`s de "Itens"), com os 4
    itens filhos indentados (padding-left adicional em relação ao item pai) e
    usando a mesma marcação de link/ícone/label já usada para os itens simples.
    Estado de expansão é local ao componente (`useState<boolean>`), com
    inicialização lazy `true` se `pathname` corresponder a um dos `items.href`, e
    um `useEffect` com dependência `[pathname]` para resincronizar ao navegar —
    mesmo padrão de inicialização/sincronização usado no estado de seção
    expandida do `Sidebar`, só que sem necessidade de exclusividade entre
    múltiplos itens (há apenas um item com filhos na seção "Itens").

#### Funcionalidade

**Remoção de Equipamentos**
- Remover a pasta `app-web/src/app/(authorized)/equipamentos/` inteira (page +
  todos os componentes: `EquipmentList`, `EquipmentListItem`,
  `EquipmentCreateForm`, `EquipmentFilterSection`, `EquipmentView`).
- Remover `shared/interfaces/Entities/Equipment/` e sua linha em
  `shared/interfaces/Entities/index.ts`.
- Remover `shared/formSchemas/EquipmentFormSchema/` e sua linha em
  `shared/formSchemas/index.ts`.
- Remover `store/PageStore/EquipmentStore/` e sua linha em `store/index.ts`.
- Remover `APP_ROUTES.private.equipment` (e a entrada correspondente em
  `MENU_ROUTES`) de `shared/routes.ts`.
- Remover as entradas `equipment` de `shared/constants/EntityMentions/index.ts`
  (`ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE`,
  `ENTITY_MENTION_VIEWABLE_TYPES`).
- Remover a entrada `equipment` do `ENTITY_MENTION_VIEW_REGISTRY` e o import de
  `EquipmentView` em `shared/components/EntityMentionViewDispatcher/index.tsx`.
- Remover o item "Equipamentos" da seção "Itens" em
  `app/(authorized)/components/Sidebar/data/index.ts` (substituído pelo novo item
  expansível "EQUIPAMENTOS", ver seção Sidebar abaixo — não é uma remoção líquida,
  é uma substituição).

**Novas páginas: Armas, Armaduras, Acessórios, Escudos**

Cada uma das quatro páginas replica integralmente o comportamento de
`equipamentos/page.tsx`: título da página, botão "Novo" (oculto para
`provider: 'google'`), seção de filtro por nome, listagem paginada
(`APP_DEFAULT_PAGE_SIZE`), modal de criar/editar (`FormModal`, tamanho `wide`),
modal de visualização (`ViewModal`, tamanho `wide`) e modal de confirmação de
exclusão (`ConfirmationModal`), usando `useGetEntityList`, `usePostEntity`,
`usePutEntity`, `useDeleteEntity`, `useGetEntityById` de `hooks/Queries` e
`useCurrenciesQuery`/`useTagOptionsQuery` para os selects de moeda/tags do
formulário.

- Páginas/rotas:
  - `app-web/src/app/(authorized)/armas/page.tsx` — rota `/armas`, nova entrada
    `weapons: '/armas'` em `MENU_ROUTES`/`APP_ROUTES.private`.
  - `app-web/src/app/(authorized)/armaduras/page.tsx` — rota `/armaduras`, nova
    entrada `armors: '/armaduras'` em `MENU_ROUTES`/`APP_ROUTES.private`.
  - `app-web/src/app/(authorized)/acessorios/page.tsx` — rota `/acessorios`, nova
    entrada `accessories: '/acessorios'` em `MENU_ROUTES`/`APP_ROUTES.private`.
  - `app-web/src/app/(authorized)/escudos/page.tsx` — rota `/escudos`, nova
    entrada `shields: '/escudos'` em `MENU_ROUTES`/`APP_ROUTES.private`.

- Integrações com API (CRUD completo por entidade, mesmo padrão de
  `/equipment` hoje):
  - Armas: `GET /weapons` (lista paginada + filtro `name`), `GET /weapons/:id`,
    `POST /weapons`, `PUT /weapons/:id`, `DELETE /weapons/:id`.
  - Armaduras: `GET /armors`, `GET /armors/:id`, `POST /armors`,
    `PUT /armors/:id`, `DELETE /armors/:id`.
  - Acessórios: `GET /accessories`, `GET /accessories/:id`,
    `POST /accessories`, `PUT /accessories/:id`, `DELETE /accessories/:id`.
  - Escudos: `GET /shields`, `GET /shields/:id`, `POST /shields`,
    `PUT /shields/:id`, `DELETE /shields/:id`.
  - `invalidateQueryKeys` de cada mutation aponta para a própria lista (ex.:
    `[['/weapons']]` para as mutations de Armas), mesmo padrão do
    `EquipmentPage` atual.

- Interfaces novas em `shared/interfaces/Entities/` (uma pasta por entidade,
  singular, mesmo padrão de `Equipment`/`Material`), cada uma exportando
  `I<Entidade>ListItem`, `I<Entidade>` e `I<Entidade>ListFilters` com os mesmos
  campos de `IEquipment`/`IEquipmentListItem`/`IEquipmentListFilters`
  (`id`, `referenceImage`, `name`, `price`, `currency`, `tags` na versão de
  lista; adicionando `description`, `privateInformation`, `createdAt`,
  `updatedAt` na versão completa; `name`/`page`/`perPage` nos filtros) —
  `shared/interfaces/Entities/Weapon/`, `.../Armor/`, `.../Accessory/`,
  `.../Shield/`, cada uma exportada em `shared/interfaces/Entities/index.ts`.

- Form schemas novos em `shared/formSchemas/` (uma pasta por entidade, mesmo
  padrão de `EquipmentFormSchema`): `WeaponFormSchema`, `ArmorFormSchema`,
  `AccessoryFormSchema`, `ShieldFormSchema`, cada uma exportada em
  `shared/formSchemas/index.ts`.
  - Campos e regras de validação (idênticos aos de `equipmentFormSchema` para
    as quatro entidades): `name` (string, obrigatório — "Informe o nome"),
    `referenceImage` (string, opcional, mas se preenchida deve ser URL válida),
    `price` (string, opcional, mas se preenchida deve casar com `/^\d+$/` —
    "Informe um preço inteiro válido"), `currencyId` (string, opcional
    isoladamente, mas obrigatório via `superRefine` quando `price !== ''` —
    "Selecione a moeda quando o preço for informado"), `tagIds` (array de
    string, opcional), `description` (string, texto rico, opcional),
    `privateInformation` (string, texto rico, opcional).

- Stores novas em `store/PageStore/` (uma por entidade, pasta plural mesmo
  padrão de `MaterialsStore`, hook/estado singular mesmo padrão de
  `useSelectedMaterialStore`): `WeaponsStore` (`useSelectedWeaponStore`,
  estado `selectedWeapon`), `ArmorsStore` (`useSelectedArmorStore`, estado
  `selectedArmor`), `AccessoriesStore` (`useSelectedAccessoryStore`, estado
  `selectedAccessory`), `ShieldsStore` (`useSelectedShieldStore`, estado
  `selectedShield`), cada uma exportada em `store/index.ts`.

- Sistema de menções (rich text), substituindo a entrada `equipment` removida:
  - `shared/constants/EntityMentions/index.ts`: adicionar 4 entradas em
    `ENTITY_MENTION_TYPE_LABELS` (`weapon: 'arma'`, `armor: 'armadura'`,
    `accessory: 'acessório'`, `shield: 'escudo'`), em
    `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (`weapon: (id) => \`/weapons/${id}\``,
    e análogo para `armor`/`/armors`, `accessory`/`/accessories`,
    `shield`/`/shields`) e em `ENTITY_MENTION_VIEWABLE_TYPES`
    (`'weapon'`, `'armor'`, `'accessory'`, `'shield'`). Os valores de chave
    (`weapon`/`armor`/`accessory`/`shield`) devem ser exatamente os mesmos
    strings usados pelo `LinkableEntityType` no backend — confirmar com a
    implementação de `app-api` antes de codificar.
  - `shared/components/EntityMentionViewDispatcher/index.tsx`: adicionar 4
    entradas ao `ENTITY_MENTION_VIEW_REGISTRY` (`weapon` → `WeaponView`,
    `armor` → `ArmorView`, `accessory` → `AccessoryView`, `shield` →
    `ShieldView`), importando cada view de
    `@/app/(authorized)/armas/components/WeaponView`,
    `@/app/(authorized)/armaduras/components/ArmorView`,
    `@/app/(authorized)/acessorios/components/AccessoryView`,
    `@/app/(authorized)/escudos/components/ShieldView`.

- Acesso Google: ocultar criar/editar/excluir (padrão) — reaproveitar
  `useIsGoogleUser` (`hooks/Auth`) em cada `page.tsx` (ocultar botão "Novo") e em
  cada `<Entidade>sListItem` (ocultar ícones de editar/excluir, manter apenas
  visualizar), exatamente como em `EquipmentListItem`/`EquipmentPage` hoje. Cada
  `<Entidade>View` também oculta o bloco "Informações Privadas" para
  `provider: 'google'`, mesmo comportamento de `EquipmentView`.

**Sidebar — submenu "EQUIPAMENTOS"**

- Estender as interfaces em
  `app/(authorized)/components/Sidebar/data/index.ts`:
  - `NavItem` ganha um campo opcional `children?: NavItem[]` (e `href` deixa de
    ser obrigatoriamente navegável quando `children` está presente — o item pai
    "EQUIPAMENTOS" não tem rota própria, apenas abre/fecha o submenu).
  - `NavSection` permanece igual (`title?: string`, `items: NavItem[]`).
- Na seção "Itens" de `NAV_SECTIONS`, substituir o item atual "Equipamentos"
  (que apontava para `APP_ROUTES.private.equipment`) por um item sem `href`,
  rótulo `'EQUIPAMENTOS'` (caixa alta, mesmo padrão do título de seção "JOGO"),
  ícone sugerido `FiTool` (reaproveitando o ícone hoje usado para Equipamentos),
  contendo `children` com os 4 novos itens navegáveis, cada um com ícone da
  família `react-icons/fi` ainda não usada em `NAV_SECTIONS` (sugestão:
  `FiSlash` para Armas, `FiShield` para Armaduras, `FiAward` para Acessórios,
  `FiUmbrella` para Escudos — ajustável pelo `web-dev` se algum ícone não
  parecer adequado, desde que permaneça na família `react-icons/fi` já usada em
  todo o projeto):
  ```
  {
    label: 'EQUIPAMENTOS',
    icon: FiTool,
    children: [
      { label: 'Armas', href: APP_ROUTES.private.weapons, icon: FiSlash },
      { label: 'Armaduras', href: APP_ROUTES.private.armors, icon: FiShield },
      { label: 'Acessórios', href: APP_ROUTES.private.accessories, icon: FiAward },
      { label: 'Escudos', href: APP_ROUTES.private.shields, icon: FiUmbrella },
    ],
  }
  ```
  Os demais itens da seção "Itens" (Materiais, Consumíveis, Munições,
  Utilitários) permanecem itens simples, sem alteração de comportamento.
- Em `app/(authorized)/components/Sidebar/components/SidebarSectionAccordion/index.tsx`
  (usado pela seção "Itens", que já é uma seção em accordion): ao mapear
  `items`, para cada `item` verificar se `item.children` está presente; se
  estiver, renderizar `SidebarNavItemAccordion` (novo componente, ver
  "Componentes" acima) no lugar do `Link` simples atualmente usado para todo
  item; caso contrário, manter a renderização de `Link` + ícone + `DefaultText`
  exatamente como hoje.
- Nenhuma mudança necessária no bloco de itens sem seção (primeira entrada de
  `NAV_SECTIONS`, sem `title`) nem no comportamento de colapso horizontal da
  sidebar (`isOpen`) ou no `Divider` entre seções — tudo isso permanece
  inalterado.

Status: concluído

Pendência (remoção manual): este agente não tem permissão de deletar arquivos.
Todas as REFERÊNCIAS ativas a Equipamentos foram removidas do código (rotas, index
de interfaces, index de form schemas, index de stores, menções, sidebar) — os
arquivos abaixo ficaram órfãos (nada mais os importa) e precisam ser removidos
manualmente:
- `app-web/src/app/(authorized)/equipamentos/` (pasta inteira: `page.tsx` +
  `components/EquipmentList`, `EquipmentListItem`, `EquipmentCreateForm`,
  `EquipmentFilterSection`, `EquipmentView`)
- `app-web/src/shared/interfaces/Entities/Equipment/`
- `app-web/src/shared/formSchemas/EquipmentFormSchema/`
- `app-web/src/store/PageStore/EquipmentStore/`

Componentes:
- `app-web/src/app/(authorized)/armas/components/{WeaponsList,WeaponsListItem,WeaponsFilterSection,WeaponCreateForm,WeaponView}`
- `app-web/src/app/(authorized)/armaduras/components/{ArmorsList,ArmorsListItem,ArmorsFilterSection,ArmorCreateForm,ArmorView}`
- `app-web/src/app/(authorized)/acessorios/components/{AccessoriesList,AccessoriesListItem,AccessoriesFilterSection,AccessoryCreateForm,AccessoryView}`
- `app-web/src/app/(authorized)/escudos/components/{ShieldsList,ShieldsListItem,ShieldsFilterSection,ShieldCreateForm,ShieldView}`
- `app-web/src/app/(authorized)/components/Sidebar/components/SidebarNavItemAccordion/index.tsx`

Arquivos:
- Páginas: `app-web/src/app/(authorized)/{armas,armaduras,acessorios,escudos}/page.tsx`
- Interfaces: `app-web/src/shared/interfaces/Entities/{Weapon,Armor,Accessory,Shield}/index.ts`
  e `app-web/src/shared/interfaces/Entities/index.ts` (barrel atualizado)
- Form schemas: `app-web/src/shared/formSchemas/{WeaponFormSchema,ArmorFormSchema,AccessoryFormSchema,ShieldFormSchema}/index.ts`
  e `app-web/src/shared/formSchemas/index.ts` (barrel atualizado)
- Stores: `app-web/src/store/PageStore/{WeaponsStore,ArmorsStore,AccessoriesStore,ShieldsStore}/index.ts`
  e `app-web/src/store/index.ts` (barrel atualizado)
- Rotas: `app-web/src/shared/routes.ts` (removida entrada `equipment`, adicionadas
  `weapons`/`armors`/`accessories`/`shields`)
- Menções: `app-web/src/shared/constants/EntityMentions/index.ts` e
  `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` (removida
  entrada `equipment`, adicionadas `weapon`/`armor`/`accessory`/`shield`)
- Sidebar: `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`
  (`NavItem.children`, item "EQUIPAMENTOS" substituindo "Equipamentos"),
  `app-web/src/app/(authorized)/components/Sidebar/components/SidebarSectionAccordion/index.tsx`
  (delega para `SidebarNavItemAccordion` quando `item.children` presente),
  `app-web/src/app/(authorized)/components/Sidebar/index.tsx` (ajustes de tipagem
  para `NavItem.href` opcional e resolução de seção ativa considerando `children`)

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Comparei linha a linha as quatro páginas novas (`/armas`, `/armaduras`,
`/acessorios`, `/escudos`) entre si e contra a página de referência
`equipamentos/page.tsx` (ainda presente no disco como órfã), incluindo todos os
componentes locais (`<Entidade>sList`, `<Entidade>sListItem`,
`<Entidade>sFilterSection`, `<Entidade>CreateForm`, `<Entidade>View`), as
interfaces (`shared/interfaces/Entities/{Weapon,Armor,Accessory,Shield}`), os
form schemas (`shared/formSchemas/{Weapon,Armor,Accessory,Shield}FormSchema`),
as stores (`store/PageStore/{Weapons,Armors,Accessories,Shields}Store`), as
integrações de menção (`shared/constants/EntityMentions`,
`shared/components/EntityMentionViewDispatcher`) e as mudanças de sidebar
(`Sidebar/data`, `Sidebar/index.tsx`, `SidebarSectionAccordion`,
`SidebarNavItemAccordion`). Não encontrei nenhum resquício de copy/paste entre
as quatro entidades (URLs de API, `invalidateQueryKeys`, stores importadas e
tipos usados por cada página/formulário/store correspondem sempre à própria
entidade — `/weapons`, `/armors`, `/accessories`, `/shields` respectivamente),
nenhum uso de ícone fora de `react-icons/fi`, nenhum `useQuery`/`useMutation`
bespoke (todos os hooks genéricos de `hooks/Queries` são reaproveitados), e o
padrão `web-form-cadastro` é seguido em todos os 4 `CreateForm` (modo
criar/editar derivado da store `selected<Entidade>`, dentro de `FormModal`,
mutations de sucesso com `invalidateQueryKeys` apontando para a própria lista).
As mensagens de validação zod e os textos de UI estão em pt-BR e consistentes
entre as quatro entidades. O acesso Google (`useIsGoogleUser`) está corretamente
replicado ocultando o botão "Novo", as ações de editar/excluir em cada
`ListItem` e o bloco "Informações Privadas" em cada `View`. Os valores de menção
(`weapon`/`armor`/`accessory`/`shield`) batem exatamente com o
`LinkableEntityType` do `app-api` (`app-api/src/modules/search/enums/linkable-entity-type.enum.ts`).
A sidebar mantém os itens simples de "Itens" (Materiais, Consumíveis, Munições,
Utilitários) inalterados, o novo item "EQUIPAMENTOS" com `children` funciona
tanto para o estado de seção expandida (`getSectionForPathname`/`isItemActive`
em `Sidebar/index.tsx`, que já considera `children` recursivamente) quanto para
o estado de expansão local do próprio `SidebarNavItemAccordion` (inicialização
lazy + `useEffect` por `pathname`, mesmo padrão do `SidebarSectionAccordion`).

Não há nenhuma referência ativa a `equipment`/`Equipment`/"Equipamentos" fora
das pastas órfãs (confirmado por busca em todo `app-web/src`).

**Pendência de limpeza manual (não é erro de implementação da etapa 1):** as
pastas abaixo continuam fisicamente no disco por limitação de ferramentas dos
agentes de execução (sem permissão de deletar arquivos) e precisam ser removidas
manualmente antes de considerar a demanda finalizada:
- `app-web/src/app/(authorized)/equipamentos/` (pasta inteira: `page.tsx` +
  `components/{EquipmentList,EquipmentListItem,EquipmentCreateForm,EquipmentFilterSection,EquipmentView}`)
- `app-web/src/shared/interfaces/Entities/Equipment/`
- `app-web/src/shared/formSchemas/EquipmentFormSchema/`
- `app-web/src/store/PageStore/EquipmentStore/`

Arquivos revisados: `app-web/src/shared/routes.ts`,
`app-web/src/shared/constants/EntityMentions/index.ts`,
`app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`,
`app-web/src/shared/interfaces/Entities/index.ts` e
`.../Entities/{Weapon,Armor,Accessory,Shield}/index.ts`,
`app-web/src/shared/formSchemas/index.ts` e
`.../formSchemas/{Weapon,Armor,Accessory,Shield}FormSchema/index.ts`,
`app-web/src/store/index.ts` e
`.../store/PageStore/{Weapons,Armors,Accessories,Shields}Store/index.ts`,
`app-web/src/app/(authorized)/{armas,armaduras,acessorios,escudos}/page.tsx` e
todos os componentes em
`.../{armas,armaduras,acessorios,escudos}/components/*`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`.../Sidebar/index.tsx`, `.../Sidebar/components/SidebarSectionAccordion/index.tsx`,
`.../Sidebar/components/SidebarNavItemAccordion/index.tsx`.