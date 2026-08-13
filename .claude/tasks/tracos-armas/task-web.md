# Task Web: Traços (nova entidade) e alterações em Armas

## Contexto

Não existe `.claude/tasks/tracos-armas/spec.md` — o enunciado recebido diretamente da
orquestração é a fonte de verdade (resumido abaixo) e este plano foi complementado por
leitura de `.claude/tasks/tracos-armas/task-api.md` (etapa de backend já fechada, define o
contrato exato de endpoints/campos/enums) e por inspeção direta do código já existente em
`app-web/src/app/(authorized)/armas/` (referência principal, junto com `usuarios`),
`app-web/src/shared/components/EntityReference{Card,ListField,SelectionModal}` (padrão de
"quadro com lista + botão de adicionar + card com remover" usado para
Aprimorado-de/Requisitos/Habilidades Adicionais), `app-web/src/app/(authorized)/familias/`
(padrão de "Select" de opções fixas via `FormAutocompleteInput` + array estático em
`data/index.ts`), `hooks/Queries/EntityQueries/useCurrenciesQuery`/`useTagOptionsQuery`
(padrão de hook para tabela auxiliar/opções em massa), `shared/constants/EntityMentions` +
`shared/components/EntityMentionViewDispatcher` + `FormRichTextInput`/`RichTextViewer`
(mecanismo de busca dinâmica `@menção`/rich text) e `app/(authorized)/components/Sidebar`.

Resumo do escopo:
- **Parte 1** — nova página de CRUD "Traços" (`Trait`), em `ITENS >>> EQUIPAMENTOS` ao lado
  de "Armas": Nome (obrigatório), Tipo de Traço (Autocomplete de `GET /trait-types`, opções
  "Arma"/"Armadura"), Tags (mesmo mecanismo de Armas), Descrição (rich text).
- **Parte 2** — formulário de Armas ganha 13 campos novos opcionais (nickname, volume,
  sizeGradeId, hands, weaponStyle, traitIds, damageValue, damageDie, damageTypeId,
  magicalDamage, distanceMeters, usesAmmunition, reloadActions), dispostos em 8 linhas
  exatas definidas no enunciado; modal de visualização de Armas passa a exibir tudo isso.
- Transversais: rota nova centralizada, item de menu, "Traço" reconhecido pelo mecanismo de
  busca/menção (`@` no rich text), acesso Google read-only (ocultar criar/editar/excluir).

Nenhuma lacuna de requisito de negócio foi identificada. O item 3 de "Decisões de design"
abaixo registra que o filtro de Traços por tipo "Arma" no modal de seleção é resolvido com
paginação e filtro 100% server-side, já que `FindTraitsQueryDto` (`GET /traits`) passou a
aceitar `traitTypeId` como query param combinável com `name` (ver decisão de design nº 4 e a
seção `GET /traits` da etapa 1 em `task-api.md`) — o backend fechou a lacuna que antes exigia
uma solução client-side.

## Decisões de design

1. **Rich text reaproveitado, nenhuma lib nova.** O projeto já tem um padrão de texto
   formatado consolidado: `shared/components/Inputs/FormInputs/FormRichTextInput`
   (TipTap + `StarterKit`, usado por `WeaponCreateForm.description`/`.privateInformation`
   hoje) para edição e `shared/components/RichTextViewer` para leitura. A "Descrição" de
   Traço usa exatamente os dois, sem introduzir nenhuma biblioteca nova.

2. **"Select" de opções fixas = `FormAutocompleteInput` + array estático, não `<Select>`
   nativo.** Confirmado por busca em todo `app-web/src`: não existe nenhum uso de `Select`
   do MUI no projeto. O padrão já estabelecido para campos de opções fixas pequenas é
   `FormAutocompleteInput<TFormData, TOption>` alimentado por um array local
   `{ value, label }[]` (ver `FAMILY_CLASSIFICATION_OPTIONS` em
   `app-web/src/app/(authorized)/familias/data/index.ts`, consumido em
   `FamilyCreateForm`). Os três campos de Armas pedidos como "Select" seguem esse mesmo
   padrão, com um novo arquivo `app-web/src/app/(authorized)/armas/data/index.ts`:
   - **Mãos** (`hands`): `WEAPON_HANDS_OPTIONS = [{ value: '1', label: '1 Mão' }, { value:
     '2', label: '2 Mãos' }]` — o valor enviado à API é sempre a string crua `'1'`/`'2'`
     (idêntica ao enum `WeaponHands` do backend); o label só existe para leitura humana.
   - **Estilo de Arma** (`weaponStyle`): `WEAPON_STYLE_OPTIONS = [{ value: 'melee', label:
     'Corpo a Corpo' }, { value: 'ranged', label: 'A Distância' }]` — label em pt-BR nunca é
     o valor enviado (`melee`/`ranged`), conforme exigido.
   - **Dado** (`damageDie`): `WEAPON_DAMAGE_DIE_OPTIONS`, 8 opções `{ value: 'd2', label:
     'd2' }` … `{ value: 'd100', label: 'd100' }` (aqui label = value, não há tradução
     necessária).

3. **Traços em Armas: filtro/paginação server-side, reaproveitando o
   `EntityReferenceSelectionModal` compartilhado (sem modal novo específico de Armas).** O
   vínculo Arma→Traço é uma referência a uma entidade completa e navegável (id + nome + tags
   + tipo), não um registro de valores compostos como Melhoria/Defeito — por isso o
   precedente estrutural mais próximo continua sendo o já usado para "Aprimorado de"/
   "Requisitos"/"Habilidades Adicionais" (`IEntityReference`, `EntityReferenceCard`,
   `EntityReferenceListField`, `EntityReferenceSelectionModal`), e é esse o "padrão de
   UI/estado" reaproveitado:
   - Os traços vinculados a uma arma são mantidos como `IEntityReference[]`
     (`{ id, name, entityType: 'trait', tags, level: undefined }`) em estado local do
     `WeaponCreateForm` (`useState`, fora do `react-hook-form`/zod — mesmo racional de
     `improvedFrom`/`requirements`/`improvements`/`flaws` já usados em outras entidades:
     hidratado a partir de `weaponDetail.traits` em modo edição, resetado para `[]` em modo
     criação e após submit com sucesso).
   - Cada card renderizado reaproveita **diretamente** `EntityReferenceCard` (sem criar um
     `TraitCard` novo) — já suporta nome + tags + ação "Visualizar" (via
     `useEntityMentionViewStore.openEntityView('trait', id)`, que passa a funcionar assim
     que "Traço" for registrado no `EntityMentionViewDispatcher`, ver item 5) + ação
     "Remover" opcional.
   - **`GET /traits` passou a aceitar `traitTypeId`, resolvendo a lacuna anterior.** O
     contrato de `FindTraitsQueryDto` (`task-api.md`, decisão de design nº 4) ganhou um
     filtro `traitTypeId` opcional, combinável com `name` e com `page`/`perPage` — `total`/
     `totalPages` já refletem o conjunto filtrado. Isso remove a necessidade de qualquer
     solução client-side: o modal de seleção de Traços em Armas passa a paginar e filtrar no
     servidor, exatamente como os demais modais/listagens do projeto.
   - **`EntityReferenceSelectionModal` volta a ser reaproveitado literalmente — não é mais
     criado nenhum `WeaponTraitSelectionModal` específico.** Com o filtro server-side
     disponível, o único obstáculo que antes impedia o reaproveitamento (não haver como
     injetar um filtro adicional por tipo) deixa de existir. A adaptação necessária é
     mínima e não distorce a API do componente compartilhado: `EntityReferenceTabConfig`
     ganha um campo opcional `extraFilters?: Record<string, string | number | boolean |
     undefined>`, mesclado aos filtros já enviados a `useGetEntityList` (`{ name: nameFilter
     || undefined, page, perPage: APP_DEFAULT_PAGE_SIZE, ...activeTab.extraFilters }`).
     `tabs` continua opcional (default de 5 abas existentes) e `excludeReferences` continua
     funcionando sem alteração (já filtra por `entityType`). Como o uso em Armas passa
     apenas **uma** aba (`tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits',
     extraFilters: { traitTypeId: armaTraitTypeId } }]}`), a barra de `Tabs` nem chega a ser
     renderizada (`tabs.length > 1` já é a condição existente no componente).
   - **Resolução do tipo "Arma" — única dependência de nome de seed que permanece, agora
     centralizada em um único lugar.** O front continua sem conhecer o UUID fixo do
     registro de seed `'Arma'` em `trait_types`, então precisa resolvê-lo comparando por
     nome via `useTraitTypesQuery()`. Comparar por nome fixo aqui é aceitável — mesma tabela
     de seed fixa de 2 valores, sem CRUD próprio, mesmo espírito do hardcode já aceito em
     `FAMILY_CLASSIFICATION_OPTIONS` — mas, para não espalhar esse hardcode por componentes,
     ele é isolado em um único hook novo, `useArmaTraitTypeId`
     (`hooks/Queries/EntityQueries/useArmaTraitTypeId`), que envolve `useTraitTypesQuery()`
     e retorna `{ armaTraitTypeId: string | undefined, isLoading }`
     (`traitTypes.find((t) => t.name === 'Arma')?.id`). É o único ponto do código-fonte que
     compara `name === 'Arma'`; `WeaponTraitsField` (item abaixo) é o único consumidor hoje,
     e qualquer consumidor futuro do id do tipo "Arma" deve reusar este hook em vez de
     repetir a comparação.
   - `WeaponTraitsField` (novo, também só em `armas/components/`) é o "quadro" que junta
     label + botão "Adicionar Traço" + lista de `EntityReferenceCard` + abre
     `EntityReferenceSelectionModal` (com o `extraFilters` acima) — mesma estrutura de
     estado de `EntityReferenceListField` (bloqueio de duplicidade ao adicionar, mensagem
     "Nenhum item adicionado." quando vazio), mas sem prop `otherListValues`/`tabs` de
     múltiplos tipos (não se aplica: só existe uma lista, um tipo). O botão "Adicionar
     Traço" fica desabilitado enquanto `useArmaTraitTypeId().isLoading` for `true`, evitando
     abrir o modal com `extraFilters.traitTypeId` indefinido (o que listaria Traços de
     qualquer tipo).

4. **Grau de Tamanho não pode ser reordenado no front.** `useSizeGradesQuery` (novo,
   `GET /size-grades`) devolve os 6 registros já em `order ASC` (Minúsculo → Imenso,
   confirmado em `task-api.md`) — nem o hook nem o `FormAutocompleteInput` que o consome
   podem aplicar `.sort()`/reordenar por nome; a ordem de exibição é exatamente a ordem
   recebida da API.

5. **"Traço" no mecanismo de busca dinâmica (`@` no rich text) não tem — e não precisa ter —
   ícone**, apesar do enunciado pedir "ícone e rota de destino": o mecanismo real hoje
   (`ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE`,
   `ENTITY_MENTION_VIEWABLE_TYPES` em `shared/constants/EntityMentions`, consumidos por
   `MentionSuggestionList`/`EntityMentionNodeView`/`EntityMentionViewDispatcher`) não possui
   nenhum campo de ícone para nenhum dos 27 tipos já cadastrados — a lista de sugestão do `@`
   mostra apenas `nome (rótulo)`. "Traço" segue exatamente o mesmo padrão dos demais tipos
   (label + rota de detalhe + registro de view), sem inventar um campo de ícone que não
   existe hoje nesse mecanismo especificamente. (O item de **menu lateral**, esse sim, tem
   ícone — tratado separadamente na seção "Funcionalidade > Sidebar" abaixo.)

## Etapas

### 1. web-dev

Status: concluído
Componentes: app-web/src/app/(authorized)/tracos/components/TraitsList/index.tsx,
  app-web/src/app/(authorized)/tracos/components/TraitsListItem/index.tsx,
  app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx,
  app-web/src/app/(authorized)/tracos/components/TraitCreateForm/index.tsx,
  app-web/src/app/(authorized)/tracos/components/TraitView/index.tsx,
  app-web/src/app/(authorized)/armas/components/WeaponTraitsField/index.tsx (novo),
  app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx (alterado),
  app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx (alterado),
  app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx (alterado,
  prop extraFilters)
Arquivos: app-web/src/app/(authorized)/tracos/page.tsx (novo);
  app-web/src/app/(authorized)/armas/data/index.ts (novo, opções Mãos/Estilo/Dado);
  app-web/src/shared/interfaces/Entities/TraitType/index.ts,
  .../SizeGrade/index.ts, .../DamageType/index.ts, .../Trait/index.ts (novos),
  .../Weapon/index.ts (alterado, 13 campos novos) e .../index.ts (barrel);
  app-web/src/hooks/Queries/EntityQueries/useTraitTypesQuery,
  useSizeGradesQuery, useDamageTypesQuery, useArmaTraitTypeId (novos) e
  hooks/Queries/EntityQueries/index.ts (barrel);
  app-web/src/shared/formSchemas/TraitFormSchema/index.ts (novo),
  shared/formSchemas/WeaponFormSchema/index.ts (alterado, 13 campos novos) e
  shared/formSchemas/index.ts (barrel);
  app-web/src/store/PageStore/TraitsStore/index.ts (novo) e store/index.ts (barrel);
  app-web/src/shared/routes.ts (MENU_ROUTES.traits/APP_ROUTES.private.traits);
  app-web/src/app/(authorized)/components/Sidebar/data/index.ts (item "Traços",
  ícone GiScrollUnfurled);
  app-web/src/shared/constants/EntityMentions/index.ts (trait em
  ENTITY_MENTION_TYPE_LABELS/ENTITY_MENTION_DETAIL_URL_BY_TYPE/
  ENTITY_MENTION_VIEWABLE_TYPES);
  app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx (registro
  de TraitView)

#### Componentes

**Parte 1 — Traços (CRUD novo, estrutura idêntica a `armas/`)**

- Interfaces novas em `shared/interfaces/Entities/` (registradas em
  `shared/interfaces/Entities/index.ts`):
  - `TraitType/index.ts`: `ITraitType { id: string; name: string }`.
  - `SizeGrade/index.ts`: `ISizeGrade { id: string; name: string; order: number }`.
  - `DamageType/index.ts`: `IDamageType { id: string; name: string }`.
  - `Trait/index.ts`:
    ```
    export interface ITraitListItem {
      id: string;
      name: string;
      traitType?: ITraitType | null;
      tags: ITag[];
    }

    export interface ITrait extends IEntity {
      name: string;
      traitType?: ITraitType | null;
      description?: string | null;
      tags: ITag[];
      createdAt: string;
      updatedAt: string;
    }

    export interface ITraitListFilters {
      name?: string;
      page?: number;
      perPage?: number;
    }
    ```
    (campo a campo espelhando `TraitResponseDto`/`TraitListItemResponseDto`/
    `FindTraitsQueryDto` de `task-api.md`).

- Hooks novos em `hooks/Queries/EntityQueries/` (registrados no barrel
  `hooks/Queries/EntityQueries/index.ts`), todos no padrão somente-leitura de
  `useCurrenciesQuery` (`useQuery`, `queryKey` fixa, `ApiFactory(getAuthToken())`,
  `staleTime: 5 * 60 * 1000`):
  - `useTraitTypesQuery` — `GET /trait-types` → `ITraitType[]`.
  - `useSizeGradesQuery` — `GET /size-grades` → `ISizeGrade[]`, **sem** reordenar (ver
    Decisão 4).
  - `useDamageTypesQuery` — `GET /damage-types` → `IDamageType[]`.

- Form schema novo `shared/formSchemas/TraitFormSchema/index.ts` (registrado em
  `shared/formSchemas/index.ts`), mesma estrutura de `weaponFormSchema` (sem os campos de
  preço/moeda):
  ```
  name: z.string().min(1, 'Informe o nome'),
  traitTypeId: z.string(),
  tagIds: z.array(z.string()).optional(),
  description: z.string(),
  ```
  Exporta `TraitFormData`, `traitFormResolver` (zodResolver) e `traitFormDefaultValues`
  (`{ name: '', traitTypeId: '', tagIds: [], description: '' }`).

- Store nova `store/PageStore/TraitsStore/index.ts` (registrada em `store/index.ts`),
  mesmo padrão de `WeaponsStore`: `useSelectedTraitStore` com estado `selectedTrait`.

- Componentes de página, um-para-um com a estrutura de `armas/components/` (pasta nova
  `app/(authorized)/tracos/components/`):
  - `TraitsList` — tabela paginada (`TableContainer`+`Table`+`TablePagination`), colunas
    Nome / Tipo de Traço / Tags / Ações (sem coluna de imagem/preço, que Traço não tem —
    mesmo critério de simplificação já usado em `SkillsList`/`TalentsList`), mesma
    estrutura de `WeaponsList`.
  - `TraitsListItem` — linha da tabela: nome, `trait.traitType?.name ?? 'Não informado'`,
    tags via `TagBadge`, ações (visualizar sempre; editar/excluir ocultos para
    `provider: 'google'` via `useIsGoogleUser`), mesma estrutura de `WeaponsListItem`
    (sem a coluna de imagem/preço).
  - `TraitsFilterSection` — formulário de filtro por nome (`DefaultTextInput` com ícone de
    busca + `PrimaryButton` "Filtrar"), mesma estrutura de `WeaponsFilterSection`. Segue o
    padrão `web-secao-filtros`: os inputs de filtro não ficam inline em `page.tsx`.
  - `TraitCreateForm` — `react-hook-form` + `traitFormSchema`, campos: Nome
    (`FormTextInput`), Tipo de Traço (`FormAutocompleteInput<TraitFormData, ITraitType>`
    alimentado por `useTraitTypesQuery`), Tags (`FormMultiAutocompleteInput<TraitFormData,
    ITag>` alimentado por `useTagOptionsQuery`, mesmo `getOptionLabel`/`getOptionColor` já
    usado em `WeaponCreateForm`), Descrição (`FormRichTextInput`). Layout: uma linha
    `grid grid-cols-1 sm:grid-cols-3` para Nome/Tipo/Tags, Descrição abaixo em linha cheia.
    Usa `useGetEntityById<ITrait>`, `usePostEntity`, `usePutEntity` (`invalidateQueryKeys:
    [['/traits']]`), `useSelectedTraitStore` — mesma estrutura de `WeaponCreateForm`
    (estado de loading/erro ao carregar em modo edição, `showToast` em pt-BR em
    sucesso/erro).
  - `TraitView` — somente leitura: Nome, Tipo de Traço (texto simples ou `Chip`), Tags,
    Descrição (`RichTextViewer`). Sem bloco de "Informações Privadas" (Traço não tem esse
    campo). Prop `onNotFound` para fechar o modal quando a entidade mencionada foi excluída
    (usado pelo `EntityMentionViewDispatcher`), mesma estrutura de `WeaponView` (sem a
    parte de imagem/preço).

**Parte 2 — Armas (extensão de formulário/visualização)**

- `app/(authorized)/armas/data/index.ts` (novo) — `WEAPON_HANDS_OPTIONS`,
  `WEAPON_STYLE_OPTIONS`, `WEAPON_DAMAGE_DIE_OPTIONS` (ver Decisão 2).

- `EntityReferenceSelectionModal` (alterado,
  `shared/components/EntityReferenceSelectionModal/index.tsx`) — ver Decisão 3. Nenhum
  modal novo é criado; o componente compartilhado ganha uma única adição não-disruptiva:
  - Prop alterada: `EntityReferenceTabConfig` ganha campo opcional `extraFilters?:
    Record<string, string | number | boolean | undefined>`.
  - Comportamento esperado: ao montar os filtros enviados a `useGetEntityList`, mesclar
    `activeTab.extraFilters` junto de `name`/`page`/`perPage` (`{ name: nameFilter ||
    undefined, page, perPage: APP_DEFAULT_PAGE_SIZE, ...activeTab.extraFilters }`). O tipo
    interno `EntityReferenceCandidateListFilters` ganha um índice (`[key: string]: string |
    number | boolean | undefined`) para aceitar essas chaves extras. Nenhuma outra
    prop/comportamento do componente muda — `tabs` continua opcional com o default de 5
    abas existentes, e `excludeReferences` continua funcionando sem alteração.

- `useArmaTraitTypeId` (novo, `hooks/Queries/EntityQueries/useArmaTraitTypeId/index.ts`,
  registrado no barrel) — ver Decisão 3.
  - Fonte de dados: envolve `useTraitTypesQuery()` (já existente, Parte 1).
  - Retorno: `{ armaTraitTypeId: string | undefined, isLoading: boolean }`, onde
    `armaTraitTypeId = traitTypes.find((t) => t.name === 'Arma')?.id`.
  - Único ponto do código-fonte que compara por nome de seed `'Arma'` — qualquer consumidor
    futuro do id do tipo "Arma" deve reusar este hook em vez de repetir a comparação.

- `WeaponTraitsField` (novo, `armas/components/WeaponTraitsField/index.tsx`) — ver Decisão
  3.
  - Props: `value: IEntityReference[]`, `onChange: (value: IEntityReference[]) => void`.
  - Estado: usa `useArmaTraitTypeId()` para resolver `armaTraitTypeId`; controla localmente
    a visibilidade (`open`/`onClose`) do `EntityReferenceSelectionModal`.
  - Comportamento esperado: label "Traços" + `SecondaryButton` "Adicionar Traço"
    (desabilitado enquanto `useArmaTraitTypeId().isLoading`) que abre
    `EntityReferenceSelectionModal` com `title="Adicionar Traço"`,
    `excludeReferences={value.map((v) => ({ entityType: 'trait', id: v.id }))}`,
    `tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits', extraFilters:
    { traitTypeId: armaTraitTypeId } }]}` (paginação/filtro por nome já server-side,
    herdados do componente compartilhado, `total`/`totalPages` refletindo o conjunto já
    filtrado por tipo — ver Decisão 3); ao selecionar (`onSelect`), bloqueia duplicata
    (mensagem "Este traço já foi adicionado." via `showToast`, mesmo padrão de
    `EntityReferenceListField`) e adiciona (`[...value, reference]`); lista os itens via
    `EntityReferenceCard` (`onRemove` removendo do array local); mensagem "Nenhum item
    adicionado." quando vazio.

- `shared/interfaces/Entities/Weapon/index.ts` — estendido, todos os campos novos
  opcionais/nullable (exceto os dois booleanos com default), campo a campo espelhando
  `WeaponResponseDto`/`WeaponListItemResponseDto` de `task-api.md`:
  ```
  export type WeaponHands = '1' | '2';
  export type WeaponStyle = 'melee' | 'ranged';
  export type WeaponDamageDie =
    | 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

  export interface IWeaponListItem {
    // ...campos existentes inalterados...
    traits: ITrait[];
  }

  export interface IWeapon extends IEntity {
    // ...campos existentes inalterados...
    nickname?: string | null;
    volume?: number | null;
    sizeGrade?: ISizeGrade | null;
    hands?: WeaponHands | null;
    weaponStyle?: WeaponStyle | null;
    traits: ITrait[];
    damageValue?: number | null;
    damageDie?: WeaponDamageDie | null;
    damageType?: IDamageType | null;
    magicalDamage: boolean;
    distanceMeters?: number | null;
    usesAmmunition: boolean;
    reloadActions?: number | null;
  }
  ```
  Observação: `IWeaponListItem` ganha `traits` só para bater com o contrato de leitura da
  API — a tabela de listagem de Armas (`WeaponsList`/`WeaponsListItem`) **não** é alterada
  nesta demanda (o enunciado só pede mudança no formulário e no modal de visualização).

- `shared/formSchemas/WeaponFormSchema/index.ts` — estendido, novos campos sempre
  opcionais (string vazia = "não informado", convertida para `null`/`undefined` no
  `buildPayload` do `WeaponCreateForm`, mesmo critério já usado para `price`/`currencyId`):
  ```
  nickname: z.string(),
  volume: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe um volume válido (no máximo 1 casa decimal)',
  ),
  sizeGradeId: z.string(),
  hands: z.string(),
  weaponStyle: z.string(),
  damageValue: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um valor de dano inteiro válido',
  ),
  damageDie: z.string(),
  damageTypeId: z.string(),
  magicalDamage: z.boolean(),
  distanceMeters: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe uma distância válida (no máximo 1 casa decimal)',
  ),
  usesAmmunition: z.boolean(),
  reloadActions: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um valor de ações de recarga inteiro válido',
  ),
  ```
  `weaponFormDefaultValues` ganha os equivalentes (`''` para os campos de texto/seleção,
  `false` para `magicalDamage`/`usesAmmunition`). **`traitIds`/`traits` não entram no zod**
  — permanecem como estado local `useState<IEntityReference[]>` no `WeaponCreateForm`, ver
  Decisão 3.

#### Funcionalidade

**Páginas/rotas**

- Nova: `app/(authorized)/tracos/page.tsx` — mesma estrutura de `armas/page.tsx`
  (título "Traços", botão "Novo" oculto para Google, `TraitsFilterSection`, `TraitsList`,
  `FormModal` (`TraitCreateForm`), `ViewModal` (`TraitView`), `ConfirmationModal` de
  exclusão), usando `useGetEntityList`, `useDeleteEntity`, `useSelectedTraitStore`.
- Alterada (sem mudança de rota): `app/(authorized)/armas/components/WeaponCreateForm/index.tsx`
  e `.../WeaponView/index.tsx` (ver detalhamento de layout abaixo).

**Rotas centralizadas** (`shared/routes.ts`):
- `MENU_ROUTES.traits = '/tracos'` e `APP_ROUTES.private.traits = MENU_ROUTES.traits`.

**Sidebar** (`app/(authorized)/components/Sidebar/data/index.ts`):
- Adicionar "Traços" como 5º item dentro de `children` do item "EQUIPAMENTOS" (seção
  "Itens"), ao lado de Armas/Armaduras/Acessórios/Escudos: `{ label: 'Traços', href:
  APP_ROUTES.private.traits, icon: <ícone> }`. Ícone sugerido: `GiScrollUnfurled` (pacote
  `react-icons/gi`, já usado nesse mesmo submenu para `GiChestArmor`/`GiDiamondRing`/
  `GiCheckedShield`) — representa "propriedade/atributo descritivo"; ajustável pelo
  `web-dev` se não parecer adequado, desde que permaneça em uma família de ícones já usada
  no projeto (`react-icons/fi`/`gi`/`pi`).

**Busca dinâmica / menção (`@` no rich text)** — ver Decisão 5:
- `shared/constants/EntityMentions/index.ts`: adicionar `trait: 'traço'` em
  `ENTITY_MENTION_TYPE_LABELS`, `trait: (id) => \`/traits/${id}\`` em
  `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `'trait'` em `ENTITY_MENTION_VIEWABLE_TYPES`.
- `shared/components/EntityMentionViewDispatcher/index.tsx`: importar `TraitView` de
  `@/app/(authorized)/tracos/components/TraitView` e adicionar entrada `trait: ({
  entityId, onNotFound }) => <TraitView traitId={entityId} onNotFound={onNotFound} />` ao
  `ENTITY_MENTION_VIEW_REGISTRY`.

**Integrações com API** (conforme `task-api.md`, sem divergência de nomenclatura):
- `GET /trait-types` → `useTraitTypesQuery` (Autocomplete "Tipo de Traço" em
  `TraitCreateForm`; também usado internamente por `useArmaTraitTypeId` para resolver o id
  do tipo "Arma", consumido pelo modal de seleção de Traços em Armas via
  `WeaponTraitsField`).
- `GET /size-grades` → `useSizeGradesQuery` (Autocomplete "Grau de Tamanho" em
  `WeaponCreateForm`, ordem preservada).
- `GET /damage-types` → `useDamageTypesQuery` (Autocomplete "Tipo de dano" em
  `WeaponCreateForm`).
- `GET /traits` (paginado, filtros `name`/`traitTypeId` combináveis) → `useGetEntityList`
  em `TraitsList`/`tracos/page.tsx` (filtro só por `name`, paginação real de servidor) e,
  dentro de `EntityReferenceSelectionModal` (via `useGetEntityList` interno do próprio
  componente compartilhado), consumido pelo modal de seleção de Traços em Armas com `name`
  (digitado pelo usuário) + `traitTypeId` (fixo, resolvido por `useArmaTraitTypeId`) —
  ambos combinados, paginação real de servidor, sem baixar o catálogo inteiro (ver
  Decisão 3).
- `GET /traits/:id`, `POST /traits`, `PUT /traits/:id`, `DELETE /traits/:id` — CRUD
  completo em `TraitCreateForm`/`tracos/page.tsx` (`invalidateQueryKeys: [['/traits']]`
  em todas as mutations).
- `GET /weapons/:id`, `POST /weapons`, `PUT /weapons/:id` — passam a enviar/receber os 13
  campos novos (payload conforme "Formulário/validação" abaixo); `invalidateQueryKeys`
  inalterado (`[['/weapons']]`).

**Formulário/validação — `WeaponCreateForm` (novo layout, 8 linhas exatas, campos
existentes preservados sem quebra)**:
1. `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Nome (`FormTextInput`, obrigatório),
   Apelido (`FormTextInput`, `name="nickname"`, opcional, texto livre), Imagem Referência
   (`FormTextInput`, existente), Tag (`FormMultiAutocompleteInput`, existente).
2. `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Preço (existente), Moeda (existente),
   Volume (`FormTextInput`, `name="volume"`, `type="number"`, `slotProps={{ htmlInput: {
   min: 0, step: 0.1, inputMode: 'decimal' } }}`, opcional, 1 casa decimal, mínimo 0), Grau
   de Tamanho (`FormAutocompleteInput<WeaponFormData, ISizeGrade>`, `name="sizeGradeId"`,
   `options=` resultado de `useSizeGradesQuery()` **sem reordenar**, opcional).
3. `grid grid-cols-1 sm:grid-cols-2`: Mãos (`FormAutocompleteInput`, `name="hands"`,
   `options=WEAPON_HANDS_OPTIONS`, opcional — ver Decisão 2), Estilo de Arma
   (`FormAutocompleteInput`, `name="weaponStyle"`, `options=WEAPON_STYLE_OPTIONS`,
   opcional — label pt-BR ≠ valor enviado).
4. Linha cheia: `WeaponTraitsField` (`value=traits`, `onChange=setTraits`) — estado local
   `traits: IEntityReference[]`, fora do zod (ver Decisão 3), hidratado de
   `weaponDetail.traits.map((t) => ({ id: t.id, name: t.name, entityType: 'trait', tags:
   t.tags }))` em modo edição, resetado para `[]` em modo criação e após submit com
   sucesso.
5. "Dano" — `Label` "Dano" + `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Valor
   (`FormTextInput`, `name="damageValue"`, `type="number"`, `slotProps={{ htmlInput: {
   min: 0, step: 1, inputMode: 'numeric' } }}`, opcional, inteiro ≥ 0), Dado
   (`FormAutocompleteInput`, `name="damageDie"`, `options=WEAPON_DAMAGE_DIE_OPTIONS`,
   opcional), Tipo de dano (`FormAutocompleteInput<WeaponFormData, IDamageType>`,
   `name="damageTypeId"`, `options=` resultado de `useDamageTypesQuery()`, opcional), Dano
   mágico (`FormCheckboxInput`, `name="magicalDamage"`, inicia desmarcado/`false`).
6. `grid grid-cols-1 sm:grid-cols-3`: Distância (Metros) (`FormTextInput`,
   `name="distanceMeters"`, `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 0.1,
   inputMode: 'decimal' } }}`, opcional, 1 casa decimal, mínimo 0), Usa Munição?
   (`FormCheckboxInput`, `name="usesAmmunition"`, inicia desmarcado/`false`), Ações de
   Recarga (`FormTextInput`, `name="reloadActions"`, `type="number"`, `slotProps={{
   htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}`, opcional, inteiro ≥ 0).
7. Linha cheia: Descrição (`FormRichTextInput`, existente, inalterado).
8. Linha cheia: Informações Privadas (`FormRichTextInput`, existente, inalterado).

`buildPayload` (em `WeaponCreateForm`) ganha, para os 13 campos (seguindo o critério já
usado para `price`/`referenceImage`: string vazia → `undefined`/`null`, valor preenchido →
convertido):
```
nickname: data.nickname || undefined,
volume: data.volume ? Number(data.volume) : null,
sizeGradeId: data.sizeGradeId || undefined,
hands: data.hands || undefined,
weaponStyle: data.weaponStyle || undefined,
traitIds: traits.map((t) => t.id),
damageValue: data.damageValue ? Number(data.damageValue) : null,
damageDie: data.damageDie || undefined,
damageTypeId: data.damageTypeId || undefined,
magicalDamage: data.magicalDamage,
distanceMeters: data.distanceMeters ? Number(data.distanceMeters) : null,
usesAmmunition: data.usesAmmunition,
reloadActions: data.reloadActions ? Number(data.reloadActions) : null,
```
E o `useEffect` de hidratação em modo edição ganha os equivalentes de leitura (`nickname:
weaponDetail.nickname ?? ''`, `volume: weaponDetail.volume != null ? String(weaponDetail.volume)
: ''`, `sizeGradeId: weaponDetail.sizeGrade?.id ?? ''`, `hands: weaponDetail.hands ?? ''`,
`weaponStyle: weaponDetail.weaponStyle ?? ''`, `damageValue`/`damageDie`/`damageTypeId`/
`magicalDamage`/`distanceMeters`/`usesAmmunition`/`reloadActions` seguindo o mesmo padrão), e
`setTraits(weaponDetail.traits?.map(...) ?? [])` fora do `reset()` do RHF.

**Formulário/validação — `TraitCreateForm`**: Nome (obrigatório), Tipo de Traço (opcional,
Autocomplete), Tags (opcional, multi-autocomplete), Descrição (opcional, rich text). Conflito
de nome duplicado (`409` da API) exibido via `showToast` no `onError` de
`usePostEntity`/`usePutEntity`, mesmo padrão de erro já usado em `WeaponCreateForm`.

**`WeaponView` (modal de visualização) — novo conteúdo, mantendo a estrutura visual já
existente (imagem + coluna de info + blocos `detailSectionBox`)**:
- Coluna de info ao lado da imagem (mesmo container `detailInfoField` já usado para
  "Preço"): adicionar blocos equivalentes para Apelido (se presente), Grau de Tamanho, Mãos
  (exibindo o label pt-BR resolvido via `WEAPON_HANDS_OPTIONS`, não o valor cru), Estilo de
  Arma (idem, via `WEAPON_STYLE_OPTIONS`), Volume, Distância (Metros), Usa Munição
  ("Sim"/"Não"), Ações de Recarga — usando `NOT_INFORMED` ("Não informado") como fallback
  para os opcionais ausentes, mesmo padrão já usado no restante do componente.
- Novo bloco `detailSectionBox` "Traços" (ícone `react-icons/fi` a escolher pelo `web-dev`,
  consistente com o resto do projeto), logo após o bloco de info e antes de "Descrição",
  listando `weapon.traits` via `EntityReferenceCard` (sem `onRemove` — somente leitura),
  mensagem "Nenhum item adicionado." quando vazio (mesmo reaproveitamento de componente da
  Decisão 3).
- Novo bloco `detailSectionBox` "Dano", logo após "Traços": Valor, Dado, Tipo de dano
  (`weapon.damageType?.name`), Dano Mágico ("Sim"/"Não"), todos com fallback
  `NOT_INFORMED` quando ausentes.
- Blocos "Descrição" e "Informações Privadas" (este último já oculto para
  `provider: 'google'`) permanecem inalterados, ao final.

**Acesso Google:**
- **Traços** (novo CRUD): ocultar criar/editar/excluir (padrão) — `useIsGoogleUser` oculta
  o botão "Novo" em `tracos/page.tsx` e as ações de editar/excluir em `TraitsListItem`,
  mantendo apenas "Visualizar", exatamente como em `WeaponsPage`/`WeaponsListItem`.
- **Armas**: acesso inalterado — os campos novos do formulário seguem a mesma proteção já
  existente (formulário só é alcançável por usuários não-Google, via ocultação do botão
  "Novo"/ação "Editar" já implementada em `WeaponsPage`/`WeaponsListItem`; nenhuma mudança
  necessária). O novo bloco "Traços"/"Dano" no `WeaponView` é somente leitura e fica visível
  a todos os usuários, igual aos blocos "Preço"/"Descrição" já existentes (só "Informações
  Privadas" é oculto para Google, comportamento inalterado).

### 2. web-dev-codereviewer

Status: concluído

- Revisar tudo acima, com atenção especial a:
  - Nenhum campo/nome divergente de `task-api.md` (em especial `sizeGradeId`/`sizeGrade`,
    `weaponStyle`, `damageTypeId`/`damageType`, `traitIds`/`traits`, `hands` como string
    `'1'`/`'2'`).
  - `useSizeGradesQuery` e o Autocomplete de "Grau de Tamanho" realmente não reordenando o
    array retornado pela API.
  - O modal de seleção de Traços em Armas usa filtro e paginação **server-side**
    (`EntityReferenceSelectionModal` + `extraFilters.traitTypeId`, via `useGetEntityList`) —
    não baixa a lista inteira de `/traits` para filtrar/paginar no cliente — e filtra
    corretamente por `traitType` "Arma" (id resolvido uma única vez por
    `useArmaTraitTypeId`, não hardcode de UUID), nunca listando traços de tipo "Armadura".
  - A adição da prop `extraFilters` em `EntityReferenceTabConfig` não altera o
    comportamento das 5 abas padrão já usadas por Aprimorado de/Requisitos/Habilidades
    Adicionais (nenhuma delas passa `extraFilters`).
  - Nenhum componente novo de card para Traço — `EntityReferenceCard` reaproveitado tanto em
    `WeaponTraitsField` quanto no bloco "Traços" de `WeaponView`.
  - Nenhum `<Select>` nativo do MUI introduzido — Mãos/Estilo de Arma/Dado usando
    `FormAutocompleteInput` + opções estáticas, com label pt-BR sempre distinto do valor
    para Estilo de Arma.
  - Layout do `WeaponCreateForm` seguindo exatamente as 8 linhas descritas no enunciado, sem
    quebrar nenhum campo/comportamento existente (Nome, Imagem Referência, Preço, Moeda,
    Tags, Descrição, Informações Privadas continuam funcionando).
  - `WeaponView` exibindo todos os 13 campos novos com fallback "Não informado" quando
    ausentes.
  - Rota `/tracos` centralizada em `APP_ROUTES.private.traits`, sem hardcode em nenhum
    componente.
  - Item "Traços" presente no submenu "EQUIPAMENTOS" da Sidebar, com ícone de uma família já
    usada no projeto.
  - `trait` presente em `ENTITY_MENTION_TYPE_LABELS`/`ENTITY_MENTION_DETAIL_URL_BY_TYPE`/
    `ENTITY_MENTION_VIEWABLE_TYPES`/`EntityMentionViewDispatcher`, e a busca `@traço` no rich
    text de qualquer entidade retornando/abrindo corretamente um Traço.
  - Acesso Google: criar/editar/excluir ocultos em `tracos/`; nenhuma alteração indevida de
    acesso em `armas/`.
  - Hooks genéricos de `hooks/Queries` (não bespoke `useQuery`/`useMutation`), schemas zod em
    `shared/formSchemas/` com barrel atualizado, store Zustand em `store/PageStore/` com
    barrel atualizado, todos os textos em pt-BR.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Cobertura da revisão: todos os arquivos listados na etapa "1. web-dev" (interfaces,
hooks de query, form schemas, store, página e componentes de `tracos/`,
componentes/dados de `armas/` alterados/novos, `EntityReferenceSelectionModal`,
`routes.ts`, Sidebar e as constantes de menção/busca), comparados campo a campo com o
contrato de `task-api.md` e com os pontos de atenção listados acima.

Pontos verificados e confirmados corretos:

- **Nomenclatura de campos idêntica a `task-api.md`**: `ITrait`/`ITraitListItem`/
  `ITraitListFilters` (`shared/interfaces/Entities/Trait/index.ts`) espelham
  `TraitResponseDto`/`TraitListItemResponseDto`/`FindTraitsQueryDto` campo a campo.
  `IWeapon`/`IWeaponListItem` (`shared/interfaces/Entities/Weapon/index.ts`) usam
  exatamente `sizeGrade`/`sizeGradeId` (leitura vs. escrita), `weaponStyle`,
  `damageType`/`damageTypeId`, `traits`/`traitIds`, `hands: WeaponHands` (`'1' | '2'`)
  — sem nenhuma divergência de nome.
- **`useSizeGradesQuery`** (`hooks/Queries/EntityQueries/useSizeGradesQuery/index.ts`)
  não reordena o array retornado pela API (nenhum `.sort()`), e o Autocomplete de "Grau
  de Tamanho" em `WeaponCreateForm` usa `options={sizeGradeOptions}` diretamente, na
  ordem recebida — consistente com a Decisão 4.
- **Modal de seleção de Traços em Armas 100% server-side**: `WeaponTraitsField`
  (`armas/components/WeaponTraitsField/index.tsx`) passa
  `tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits', extraFilters: {
  traitTypeId: armaTraitTypeId } }]}` ao `EntityReferenceSelectionModal`, que mescla
  `activeTab.extraFilters` aos filtros enviados a `useGetEntityList` (`{ name, page,
  perPage, ...activeTab.extraFilters }`) — nenhuma paginação/filtro client-side. O id do
  tipo "Arma" é resolvido uma única vez por `useArmaTraitTypeId`
  (`traitTypes.find((t) => t.name === 'Arma')?.id`), sem hardcode de UUID, e o botão
  "Adicionar Traço" fica `disabled` enquanto `isLoading`, evitando abrir o modal com
  `traitTypeId` indefinido.
- **`extraFilters` não altera as 5 abas padrão existentes**
  (`shared/components/EntityReferenceSelectionModal/index.tsx`): `tabs` continua
  opcional com o mesmo array `ENTITY_REFERENCE_SELECTION_TABS` de 5 entradas, nenhuma
  delas define `extraFilters`, e o spread de `undefined` em `{ ...activeTab.extraFilters
  }` é um no-op — comportamento das abas de Treinamentos/Talentos/Características/
  Técnicas/Magias inalterado. `excludeReferences` continua funcionando sem alteração
  (filtra por `entityType` como antes).
- **Nenhum componente novo de card para Traço**: tanto `WeaponTraitsField` quanto o
  bloco "Traços" de `WeaponView` reaproveitam `EntityReferenceCard` diretamente (sem
  `TraitCard`), com `onRemove` presente só no formulário e ausente (somente leitura) na
  view.
- **Nenhum `<Select>` nativo do MUI**: Mãos/Estilo de Arma/Dado usam
  `FormAutocompleteInput` alimentado pelos arrays estáticos de
  `armas/data/index.ts` (`WEAPON_HANDS_OPTIONS`, `WEAPON_STYLE_OPTIONS`,
  `WEAPON_DAMAGE_DIE_OPTIONS`), com label pt-BR sempre distinto do valor cru em Estilo
  de Arma (`melee` → "Corpo a Corpo", `ranged` → "A Distância") e em Mãos (`'1'` → "1
  Mão", `'2'` → "2 Mãos"); em Dado, label = valor (`'d2'` → "d2"), conforme decisão de
  design nº 2.
- **Layout do `WeaponCreateForm`**: as 8 linhas descritas no enunciado batem
  exatamente com o JSX (linha 1: Nome/Apelido/Imagem Referência/Tags; linha 2:
  Preço/Moeda/Volume/Grau de Tamanho; linha 3: Mãos/Estilo de Arma; linha 4:
  `WeaponTraitsField` em linha cheia; linha 5: bloco "Dano" com
  Valor/Dado/Tipo de dano/Dano mágico; linha 6: Distância/Usa Munição/Ações de Recarga;
  linha 7: Descrição; linha 8: Informações Privadas), sem quebrar nenhum campo
  pré-existente (Nome, Imagem Referência, Preço, Moeda, Tags, Descrição, Informações
  Privadas continuam presentes e funcionais, incluindo o `superRefine` de
  preço/moeda).
- **`WeaponView`** exibe todos os 13 campos novos (Apelido condicional, Grau de
  Tamanho, Mãos/Estilo de Arma com labels pt-BR resolvidos via
  `WEAPON_HANDS_OPTIONS`/`WEAPON_STYLE_OPTIONS`, Volume, Distância, Usa Munição,
  Ações de Recarga, bloco "Traços" via `EntityReferenceCard`, bloco "Dano"
  completo), todos com fallback `NOT_INFORMED` ("Não informado") quando ausentes, na
  ordem Traços → Dano → Descrição → Informações Privadas (este último ainda oculto
  para `provider: 'google'` via `useIsGoogleUser`, comportamento inalterado); os
  blocos novos ficam visíveis a todos os usuários, como especificado.
- **Rota `/tracos` centralizada**: `MENU_ROUTES.traits`/`APP_ROUTES.private.traits`
  em `shared/routes.ts`, sem nenhum hardcode de `/tracos` em `tracos/page.tsx` ou em
  qualquer componente revisado.
- **Sidebar**: item "Traços" presente como 5º filho de "EQUIPAMENTOS" (após
  Armas/Armaduras/Acessórios/Escudos), usando `APP_ROUTES.private.traits` e o ícone
  `GiScrollUnfurled` de `react-icons/gi` (família já usada nesse mesmo submenu).
- **Mecanismo de menção/busca**: `trait` presente em `ENTITY_MENTION_TYPE_LABELS`
  (`'traço'`), `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (`/traits/${id}`) e
  `ENTITY_MENTION_VIEWABLE_TYPES`; `EntityMentionViewDispatcher` importa `TraitView` de
  `@/app/(authorized)/tracos/components/TraitView` e registra `trait` no
  `ENTITY_MENTION_VIEW_REGISTRY` com `traitId`/`onNotFound`, mesmo padrão dos demais 26
  tipos já cadastrados.
- **Acesso Google**: `tracos/page.tsx` oculta o botão "Novo" e `TraitsListItem` oculta
  "Editar"/"Excluir" (mantendo "Visualizar") via `useIsGoogleUser`, idêntico a
  `WeaponsPage`/`WeaponsListItem`. Em `armas/`, nenhuma proteção de acesso foi alterada
  — os campos novos do formulário só são alcançáveis pelo fluxo já protegido existente,
  e os blocos novos do `WeaponView` são somente leitura e visíveis a todos.
- **Hooks/schemas/store**: `useTraitTypesQuery`/`useSizeGradesQuery`/
  `useDamageTypesQuery`/`useArmaTraitTypeId` seguem o padrão exato de
  `useCurrenciesQuery` (`useQuery`, `queryKey` fixa, `ApiFactory(getAuthToken())`,
  `staleTime: 5 * 60 * 1000`) e estão registrados no barrel
  `hooks/Queries/EntityQueries/index.ts`; `traitFormSchema`/`weaponFormSchema`
  (`zod` + `zodResolver`, não Yup) registrados em `shared/formSchemas/index.ts`;
  `useSelectedTraitStore` (Zustand) segue literalmente a mesma estrutura de
  `useSelectedWeaponStore` e está registrado em `store/index.ts`. Todos os textos de
  UI/toast/validação revisados estão em pt-BR. Ícones em todos os arquivos revisados
  vêm de `react-icons/fi`/`gi`, nenhum `@mui/icons-material`/SVG customizado/emoji, e
  os `IconButton` sem texto visível (`TraitsListItem`, `EntityReferenceCard`,
  `EntityReferenceSelectionModal`) têm `aria-label` em pt-BR.

Arquivos revisados: app-web/src/shared/interfaces/Entities/TraitType/index.ts,
app-web/src/shared/interfaces/Entities/SizeGrade/index.ts,
app-web/src/shared/interfaces/Entities/DamageType/index.ts,
app-web/src/shared/interfaces/Entities/Trait/index.ts,
app-web/src/shared/interfaces/Entities/Weapon/index.ts,
app-web/src/shared/interfaces/Entities/index.ts,
app-web/src/shared/interfaces/Entities/EntityReference/index.ts,
app-web/src/hooks/Queries/EntityQueries/useTraitTypesQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useSizeGradesQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useDamageTypesQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useArmaTraitTypeId/index.ts,
app-web/src/hooks/Queries/EntityQueries/index.ts,
app-web/src/hooks/Queries/DefaultQueries/useGetEntityList/index.ts,
app-web/src/shared/formSchemas/TraitFormSchema/index.ts,
app-web/src/shared/formSchemas/WeaponFormSchema/index.ts,
app-web/src/shared/formSchemas/index.ts,
app-web/src/store/PageStore/TraitsStore/index.ts,
app-web/src/store/PageStore/WeaponsStore/index.ts, app-web/src/store/index.ts,
app-web/src/shared/routes.ts,
app-web/src/app/(authorized)/tracos/page.tsx,
app-web/src/app/(authorized)/tracos/components/TraitsList/index.tsx,
app-web/src/app/(authorized)/tracos/components/TraitsListItem/index.tsx,
app-web/src/app/(authorized)/tracos/components/TraitsFilterSection/index.tsx,
app-web/src/app/(authorized)/tracos/components/TraitCreateForm/index.tsx,
app-web/src/app/(authorized)/tracos/components/TraitView/index.tsx,
app-web/src/app/(authorized)/armas/page.tsx,
app-web/src/app/(authorized)/armas/data/index.ts,
app-web/src/app/(authorized)/armas/components/WeaponsList/index.tsx,
app-web/src/app/(authorized)/armas/components/WeaponsListItem/index.tsx,
app-web/src/app/(authorized)/armas/components/WeaponsFilterSection/index.tsx,
app-web/src/app/(authorized)/armas/components/WeaponTraitsField/index.tsx,
app-web/src/app/(authorized)/armas/components/WeaponCreateForm/index.tsx,
app-web/src/app/(authorized)/armas/components/WeaponView/index.tsx,
app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx,
app-web/src/shared/components/EntityReferenceCard/index.tsx,
app-web/src/shared/components/EntityReferenceListField/index.tsx,
app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx,
app-web/src/shared/constants/EntityMentions/index.ts,
app-web/src/store/EntityMentionViewStore/index.ts,
app-web/src/app/(authorized)/components/Sidebar/data/index.ts,
app-web/src/shared/components/Inputs/FormInputs/FormAutocompleteInput/index.tsx,
app-web/src/shared/components/Inputs/FormInputs/FormCheckboxInput/index.tsx,
app-web/src/shared/components/Inputs/FormInputs/index.ts,
.claude/tasks/tracos-armas/task-api.md (referência de contrato de campos/endpoints).
