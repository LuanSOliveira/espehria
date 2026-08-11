# Task Web: Aba Habilidades da Ficha (Características, Treinamentos, Talentos)

## Contexto
Ver .claude/tasks/ficha-habilidades/spec.md — usar a seção "Escopo confirmado" e as 13
"Decisões tomadas por investigação" como base factual, sem reabrir nenhum ponto ali já
fechado.

**Dependência crítica de contrato**: no momento deste planejamento, `.claude/tasks/ficha-
habilidades/task-api.md` **ainda não existe**. Todo nome de campo/endpoint citado abaixo
(`abilities`, `requirementsMet`, `sourceName`, `sourceType`, `unlockedAtLevel`, URLs de
mutação, parâmetro `sheetId` no filtro dos endpoints de listagem) é um **placeholder de
contrato**, coerente com os "Requisitos para o planejamento de backend" do spec, mas a
confirmar/ajustar contra o `task-api.md` real antes ou durante a implementação. Nenhuma
dessas suposições deve ser tratada como definitiva.

Precedentes de código já investigados e usados como referência de padrão:
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — página alvo (~990 linhas hoje).
  Padrão de abas de 2 níveis (`SHEET_TABS_SX`, `activeBonusSubTab`), padrão de mutação
  que retorna `ISheet` completo e replica o resultado nos setters locais
  (`linkRaceMutation`/`unlinkRaceMutation`/`linkBiographyMutation`/
  `unlinkBiographyMutation`), padrão de autosave (`useFieldAutosave` +
  `updateLevelMutation`, hoje **sem** `onSuccess` que atualize os snapshots locais).
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetSkillsPanel/index.tsx` —
  padrão de grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` dentro de
  `APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField`,
  `SheetRaceCard`, `SheetDashedFieldButton`, `SheetBiographyField` — padrão de campo com
  card preenchido + botão dashed quando vazio + `ConfirmationModal` antes de remover.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetAdjustedProficienciesSection`
  — padrão de texto "Concedida por: X" (mesma ideia do indicativo "via Raça X").
- `app-web/src/app/(authorized)/fichas/[id]/data/index.ts` — constantes
  `SHEET_EMPTY_*_SNAPSHOT` e `flatten*Snapshot`, mesmo padrão a seguir para o novo
  snapshot de habilidades.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` e
  `app-web/src/shared/components/EntityReferenceCard/index.tsx` — usados hoje por 4
  formulários (`TrainingCreateForm`, `TalentCreateForm`, `CharacteristicCreateForm`, e via
  `EntityReferenceListField` também por `TechniqueCreateForm`/`SpellCreateForm`) para o
  caso de uso "referenciar outra entidade" (`improvedFrom`/`requirements`/
  `additionalAbilities`), com filtro só por `name` e exclusão simples por lista de ids.
  Ver decisão de arquitetura na seção "Componentes" abaixo.
- `app-web/src/hooks/Queries/DefaultQueries/{useGetEntityList,usePostEntity,usePutEntity,
  useDeleteEntity}` e `useResolveProficiencyAdjustmentMutation` (exemplo de mutação
  específica de ficha que não é CRUD puro). `useDeleteEntity`/`usePostEntity` não aceitam
  id dinâmico por chamada — a URL é fixada na criação do hook, então remoções por item
  (ex.: remover uma Característica extra específica) precisam de uma URL construída a
  partir de um id "pendente de remoção" em estado local, replicando o padrão já usado em
  `app-web/src/app/(authorized)/usuarios/page.tsx`
  (`useDeleteEntity({ url: \`/users/${userPendingDelete?.id}\` })`).
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsFilterSection`
  — padrão de filtro nome/level/tags (`DefaultTextInput` + `DefaultMultiAutocompleteInput`
  + `useTagOptionsQuery`) a reaproveitar dentro do novo modal de seleção desta demanda.
- `.claude/tasks/ficha-melhorias-estatisticas/task-web.md` (linhas ~234-249, já
  implementado) — precedente relevante e já registrado no código: **a página de ficha
  (`fichas/[id]/**`) nunca aplicou o padrão padrão de "ocultar criar/editar/excluir para
  usuários Google"** (`useIsGoogleUser`) porque o controle de acesso da ficha é por posse
  (`isRestrictedToOwnSheets`, backend), não por tipo de ação — um usuário Google já
  edita/remove Raça e Biografia normalmente em fichas às quais tem acesso. Esta demanda
  segue o mesmo comportamento já estabelecido nesta página específica (ver "Acesso
  Google" ao final).
- `.claude/tasks/habilidades-adicionais/task-web.md` — referência de como
  `additionalAbilities`/`IEntityReference` foram modelados nas entidades donas
  (`ICharacteristic`, `ITraining`, `ITalent`, `IBiography`), relevante para os novos tipos
  desta demanda.

## Etapas

### 1. web-dev
Status: concluído

#### Componentes

- **Componente novo: `SheetAbilityCard`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilityCard/index.tsx`).
  - Props: `name: string`, `level: number`, `tags: ITag[]`, `entityType: 'characteristic'
    | 'training' | 'talent'`, `entityId: string`, `requirementsMet: boolean`,
    `sourceLabel?: string` (quando presente, exibe indicativo de origem, ex.: `"via Raça
    Anão"` / `"via Biografia Órfão"` / `"via Treinamento X"` — mesmo padrão textual de
    `"Concedida por: ${sourceName}"` já usado em `SheetAdjustedProficienciesSection`,
    adaptado para "via"), `onRemove?: () => void` (quando ausente, botão de remover não é
    renderizado — usado para cards herdados), `isRemoving?: boolean`.
  - Comportamento esperado: card único reaproveitado nas 3 sub-abas para os 3 tipos de
    exibição (herdado, extra, slot preenchido) — layout no mesmo espírito de
    `APP_CONTAINER_STYLES.detailInfoField` usado por `SheetRaceCard`/`EntityReferenceCard`
    (nome + tags via `TagBadge`, level exibido como badge numérico no canto — mesmo padrão
    de `EntityReferenceCard`). Ação "Visualizar" sempre presente, chamando
    `useEntityMentionViewStore().openEntityView(entityType, entityId)` (reaproveitando o
    dispatcher já existente, decisão de investigação nº 12 do spec — nenhum componente
    novo de view, o dispatcher já resolve a view correta por `entityType`). Quando
    `requirementsMet === false`, exibir um indicativo visual de alerta no card (ícone,
    ex. `FiAlertTriangle` já usado em `page.tsx`, com `Tooltip`/texto curto do tipo
    "Requisitos pendentes"), sem impedir nenhuma ação do card (a permanência do item
    vinculado mesmo com requisito perdido é uma regra confirmada no spec, item 20). Quando
    `onRemove` é passado, exibir ação "Remover" com `ConfirmationModal` antes de efetivar
    (mesmo padrão de confirmação já usado em `SheetRaceCard`), nunca remoção direta sem
    confirmação.

- **Componente novo: `SheetTrainingSlotCell`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingSlotCell/index.tsx`).
  - Props: `unlockedAtLevel: number`, `training: { id: string; name: string; level: number;
    tags: ITag[]; requirementsMet: boolean } | null`, `onFill: () => void` (abre o modal de
    seleção do slot), `onEmpty: () => void`, `isEmptying?: boolean`.
  - Comportamento esperado: composição específica de Treinamentos — renderiza
    `SheetAbilityCard` (sem `sourceLabel`, com `onRemove={onEmpty}`) quando `training` está
    preenchido, ou `SheetDashedFieldButton` (`onClick={onFill}`) quando vazio; em ambos os
    casos, abaixo do card/botão, exibe o indicativo textual "Liberado no level
    `{unlockedAtLevel}`" (`DefaultText`, tamanho reduzido, alinhado ao centro). Mantém a
    lógica "abaixo de cada slot" (vazio ou preenchido) do requisito 12 do spec dentro de um
    único componente, evitando duplicar essa composição no painel de Treinamentos.

- **Componente novo, dedicado: `SheetAbilitySelectionModal`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx`).
  - **Decisão de arquitetura (spec, decisão de investigação nº 9 / requisito de frontend
    nº 4): NÃO estender `EntityReferenceSelectionModal`, criar um modal dedicado à
    ficha.** Justificativa: `EntityReferenceSelectionModal` é hoje um componente genérico
    de "referenciar outra entidade" usado por 4 formulários fora do contexto de ficha
    (`TrainingCreateForm`, `TalentCreateForm`, `CharacteristicCreateForm`, e
    transitivamente `TechniqueCreateForm`/`SpellCreateForm` via
    `EntityReferenceListField`), com contrato simples (filtro só por `name`, exclusão por
    lista plana de `{ entityType, id }`, sempre com 5 abas de tipo). Esta demanda precisa
    de: filtro por `name`+`level`+`tagIds`; um único tipo de entidade por abertura (nunca
    5 abas); dois motivos distintos e mutuamente exclusivos de desabilitar "adicionar"
    (item já presente na ficha vs. requisitos não atendidos), com alerta visual só no
    segundo caso; e reaproveitamento em dois contextos com semânticas de callback
    diferentes (adicionar extra vs. preencher slot). Estender o componente genérico para
    todos esses casos arriscaria regressão nos 4 formulários existentes que não precisam
    de nada disso. Reaproveita-se, sim, o padrão visual (tabela paginada, `FormModal`
    `size="wide"`, ação de visualizar via `openEntityView`) e os filtros já usados em
    `CharacteristicsFilterSection`/`TrainingsFilterSection`/`TalentsFilterSection`
    (`DefaultTextInput` nome/level + `DefaultMultiAutocompleteInput` com
    `useTagOptionsQuery`), mas como componente novo e independente.
  - Props: `open: boolean`, `onClose: () => void`, `title: string`, `entityType:
    'characteristic' | 'training' | 'talent'`, `url: string` (`/characteristics` |
    `/trainings` | `/talents`), `presentIds: string[]` (união de ids do mesmo
    `entityType` já presentes na ficha por qualquer via — herdado, slot ou extra — usada
    para desabilitar "adicionar" por já-presente, regra generalizada pela decisão de
    investigação nº 7), `sheetId: string`, `onSelect: (item: { id: string; name: string })
    => void`, `isSelecting?: boolean`.
  - Filtros internos: nome (`DefaultTextInput` + `FiSearch`), level (`DefaultTextInput`
    numérico), tags (`DefaultMultiAutocompleteInput<ITag>` + `useTagOptionsQuery`) — os
    mesmos 3 filtros já suportados pelos DTOs de listagem
    (`ICharacteristicListFilters`/`ITrainingListFilters`/`ITalentListFilters`, todos com
    `name`/`level`/`tagIds`), consultados via `useGetEntityList` com `url`/filtros/`page`
    (mesmo padrão de paginação de `EntityReferenceSelectionModal`, `APP_DEFAULT_PAGE_SIZE`
    + `TablePagination`). **Ponto de atenção a confirmar contra `task-api.md`**: o item da
    lista precisa trazer, por item, se os requisitos são atendidos *pela ficha atual*
    (`requirementsMet`) — isso exige que o endpoint de listagem (`/characteristics`,
    `/trainings`, `/talents`) aceite um parâmetro adicional (ex. `sheetId`) para calcular
    esse campo escopado à ficha, ou que o frontend cruze a resposta da listagem com uma
    consulta separada de status de requisitos; a forma exata é decisão de backend (spec,
    requisito de backend nº 5) — este componente deve ser implementado assumindo que o
    item retornado já inclui `requirementsMet: boolean`, ajustando a chamada
    (parâmetro extra ou consulta cruzada) conforme o contrato real do `task-api.md`.
  - Comportamento do botão "Adicionar" por item: desabilitado com um estilo/tooltip quando
    `presentIds.includes(item.id)` (ex.: tooltip "Já está na ficha"); desabilitado com
    estilo/tooltip **visualmente distinto** e com um alerta inline no item (mesmo ícone de
    alerta usado em `SheetAbilityCard`) quando `!item.requirementsMet` (tooltip "Requisitos
    não atendidos"); habilitado nos demais casos, chamando `onSelect(item)`. Os dois
    motivos nunca se sobrepõem visualmente (feedback diferenciado exigido pelo requisito
    de frontend nº 4) — usar, por exemplo, ícone de cadeado/"já presente" vs. ícone de
    alerta/triângulo para os dois casos. Ação "Visualizar" sempre habilitada
    (`openEntityView(entityType, item.id)`), independente do estado do botão "Adicionar".
  - Reaproveitado em 3 pontos de uso: extras de Características, extras/slots de
    Treinamentos (dois modos de callback, ver painel de Treinamentos abaixo) e extras de
    Talentos — cada abertura passa `entityType`/`url`/`title`/`presentIds` específicos do
    contexto.

- **Componentes novos, "container" de sub-aba** (extraídos da `page.tsx`, seguindo o
  mesmo padrão de extração já usado para `SheetSkillsPanel`/`SheetKnowledgesPanel`, dado
  que a página já tem ~990 linhas e não deve crescer com todo o markup das 3 sub-abas
  inline):
  - `SheetCharacteristicsPanel`
    (`app-web/src/app/(authorized)/fichas/[id]/components/SheetCharacteristicsPanel/index.tsx`):
    recebe a lista de herdados e extras + handlers de adicionar/remover extra + estado de
    modal; renderiza a seção "Características" (grid de `SheetAbilityCard` herdados,
    `sourceLabel` presente, sem `onRemove`) e a seção "Características Extras" (grid de
    `SheetAbilityCard` extras, sem `sourceLabel`, com `onRemove`, mais uma célula final
    `SheetDashedFieldButton` "Adicionar características extras" que abre
    `SheetAbilitySelectionModal`).
  - `SheetTalentsPanel`
    (`app-web/src/app/(authorized)/fichas/[id]/components/SheetTalentsPanel/index.tsx`):
    mesmo formato de `SheetCharacteristicsPanel`, trocando a entidade para Talento
    ("Talentos" / "Talentos Extras").
  - `SheetTrainingsPanel`
    (`app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingsPanel/index.tsx`):
    3 seções — "Treinamentos" (grid de `SheetTrainingSlotCell`, uma célula por slot, na
    quantidade recebida via prop), "Treinamentos Herdados" (grid de `SheetAbilityCard`
    herdados, mesmo padrão das outras duas sub-abas) e "Treinamentos Extras" (grid de
    `SheetAbilityCard` extras + célula final dashed "Adicionar treinamentos extras").
  - Todos os 3 painéis seguem o padrão visual `APP_CONTAINER_STYLES.detailSectionBox`/
    `detailSectionBoxHeader` com ícone + `Label` no cabeçalho de cada seção (mesmo padrão
    de `SheetSkillsPanel`/`SheetKnowledgesPanel`), grid responsivo `grid-cols-1
    sm:grid-cols-2 lg:grid-cols-4` (decisão de investigação nº 10) e mensagem
    `DefaultText` de lista vazia quando aplicável (herdados vazio: "Nenhuma
    característica/treinamento/talento herdado."; extras vazio: apenas o botão dashed já
    comunica "vazio", sem mensagem redundante).

- **Extensão pequena: `SheetDashedFieldButton`**
  (`app-web/src/app/(authorized)/fichas/[id]/components/SheetDashedFieldButton/index.tsx`).
  - Componente já existe e é usado hoje como campo de largura total (`w-full`, `py-4`).
  - Decisão (spec, decisão de investigação nº 11): reaproveitar diretamente dentro de uma
    célula do grid — como já é `w-full`, ele naturalmente ocupa a largura da célula do
    grid sem alteração de props. Único ajuste sugerido, **opcional e pequeno** (não conta
    como componente novo): aceitar uma prop opcional `sx`/`className` para permitir que o
    caller alinhe sua altura à altura média dos cards vizinhos (que têm mais conteúdo —
    nome, level, tags, ações, e no caso de slot também a legenda de level abaixo). Se o
    `py-4` atual já ficar visualmente aceitável lado a lado com `SheetAbilityCard` no
    grid, esse ajuste pode ser dispensado — confirmar visualmente durante a implementação
    e só adicionar a prop se necessário.

#### Funcionalidade

- **Páginas/rotas**: nenhuma rota nova (`APP_ROUTES` inalterado). Toda a mudança ocorre
  dentro de `app-web/src/app/(authorized)/fichas/[id]/page.tsx` e dos componentes/hooks
  novos listados acima, sob o mesmo diretório de feature.

- **Nova aba de 1º nível e sub-abas de 2º nível** em `page.tsx`:
  - `type SheetDetailTab = 'estatisticas' | 'bonus' | 'habilidades'` (novo valor
    `'habilidades'`). Posicionamento: **após "Bônus"** (`Estatísticas`, `Bônus`,
    `Habilidades`, nessa ordem) — o spec deixa a ordem exata a critério do frontend
    ("entre Estatísticas e Bônus, ou após Bônus"); decide-se por "após Bônus" por ser a
    aba mais nova/complexa e por preservar a posição relativa já conhecida de
    Estatísticas/Bônus sem deslocar a aba já existente "Bônus" para a direita.
  - Novo `type SheetAbilitiesSubTab = 'caracteristicas' | 'treinamentos' | 'talentos'` e
    `const [activeAbilitiesSubTab, setActiveAbilitiesSubTab] =
    useState<SheetAbilitiesSubTab>('caracteristicas')`, replicando exatamente o padrão já
    usado por `activeBonusSubTab`/`SheetBonusSubTab` (`Tabs`/`Tab` com `SHEET_TABS_SX`,
    renderizado condicionalmente quando `activeTab === 'habilidades'`).
  - Dentro do conteúdo de `'habilidades'`, renderizar condicionalmente
    `SheetCharacteristicsPanel` / `SheetTrainingsPanel` / `SheetTalentsPanel` conforme
    `activeAbilitiesSubTab`, no mesmo `<div className="mt-4">` onde hoje vivem os painéis
    de Estatísticas/Bônus.

- **Tipos** (`app-web/src/shared/interfaces/Entities/Sheet/index.ts`):
  - Corrigir `ISheetRace` (spec, decisão de investigação nº 1 / requisito de frontend
    nº 5), hoje `interface ISheetRace extends IRaceListItem { hitPoints: number }`, para
    incluir os dois campos que já vêm populados no payload hoje mas não são declarados:
    `characteristics: IEntityReference[]` e `talents: IEntityReference[]`.
  - Criar `ISheetBiography extends IBiographyListItem { additionalAbilities:
    IEntityReference[] }` e trocar o tipo do campo `ISheet.biography` de
    `IBiographyListItem | null` para `ISheetBiography | null` — alinhado ao requisito de
    backend nº 6 (expor `additionalAbilities` em `sheet.biography`, hoje ausente em
    `BiographyOptionResponseDto`). **Confirmar contra `task-api.md`** se o nome do DTO/
    campo muda; se o backend não conseguir expor esse campo por algum motivo não previsto
    no spec, este tipo (e a herança de Biografia na listagem consolidada) fica bloqueado —
    sinalizar caso o `task-api.md` divirja disso.
  - Novos tipos para as listagens de habilidades, nomeados de forma consistente com o
    restante do arquivo (`ISheet*`); os nomes de campo abaixo são placeholders de
    contrato a confirmar contra `task-api.md`:
    ```ts
    export type ISheetAbilityEntityType = 'characteristic' | 'training' | 'talent';

    export interface ISheetInheritedAbilityItem {
      id: string;
      entityType: ISheetAbilityEntityType;
      name: string;
      level: number;
      tags: ITag[];
      sourceName: string; // ex.: nome da Raça/Biografia/entidade de origem
      sourceType: 'race' | 'biography' | ISheetAbilityEntityType;
      requirementsMet: boolean;
    }

    export interface ISheetExplicitAbilityItem {
      id: string;
      entityType: ISheetAbilityEntityType;
      name: string;
      level: number;
      tags: ITag[];
      requirementsMet: boolean;
    }

    export interface ISheetTrainingSlot {
      slotIndex: number;
      unlockedAtLevel: number;
      training: ISheetExplicitAbilityItem | null;
    }

    export interface ISheetAbilitiesSummary {
      characteristics: {
        inherited: ISheetInheritedAbilityItem[];
        extra: ISheetExplicitAbilityItem[];
      };
      trainings: {
        slots: ISheetTrainingSlot[];
        inherited: ISheetInheritedAbilityItem[];
        extra: ISheetExplicitAbilityItem[];
      };
      talents: {
        inherited: ISheetInheritedAbilityItem[];
        extra: ISheetExplicitAbilityItem[];
      };
    }
    ```
  - Adicionar `abilities: ISheetAbilitiesSummary` a `ISheet` — assume-se, por consistência
    com o padrão já usado para `melhorias`/`defeitos`/`proficiencias`/`saberes` (todos
    trazidos dentro do próprio payload de `ISheet` e recalculados/devolvidos por inteiro a
    cada mutação relevante), que a listagem consolidada de habilidades (requisito de
    backend nº 7) também é exposta como um campo do payload de `GET /sheets/:id` e
    devolvida por inteiro em cada mutação de habilidade — **confirmar contra
    `task-api.md`**; se o backend expuser isso como endpoint(s) separado(s) por sub-aba em
    vez de um campo agregado em `ISheet`, os hooks de fetch/estado abaixo precisam ser
    ajustados de acordo (mudança de URL/hook, mantendo a mesma estrutura geral do plano).
  - Adicionar constante `SHEET_EMPTY_ABILITIES_SUMMARY: ISheetAbilitiesSummary` em
    `app-web/src/app/(authorized)/fichas/[id]/data/index.ts`, mesmo padrão de
    `SHEET_EMPTY_IMPROVEMENT_DEFECT_SNAPSHOT`/`SHEET_EMPTY_PROFICIENCY_SNAPSHOT`/
    `SHEET_EMPTY_KNOWLEDGE_SNAPSHOT`, usada como valor inicial antes da hidratação.

- **Estado e mutações em `page.tsx`** (avaliar extrair para um novo hook dedicado
  `useSheetAbilities`, em
  `app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetAbilities.ts`, mesmo diretório
  dos hooks já existentes — `useFieldAutosave`, `useSheetSkillModifiers`,
  `useSheetKnowledgeModifiers`, `useSheetSavingThrowModifiers` — dado o volume de estado e
  mutações que esta funcionalidade introduz; a extração não é obrigatória mas é fortemente
  recomendada para não inflar ainda mais `page.tsx`; se extraída, o hook recebe `sheetId`
  e os setters `setMelhorias`/`setDefeitos`/`setProficiencias`/`setProficienciasAjustadas`/
  `setSaberes` já existentes em `page.tsx` como parâmetros, e expõe `abilities` + os
  handlers/mutações abaixo, para manter única fonte de verdade dos snapshots
  compartilhados em `page.tsx`):
  - `const [abilities, setAbilities] = useState<ISheetAbilitiesSummary>(
    SHEET_EMPTY_ABILITIES_SUMMARY)`, hidratado no mesmo `useEffect` de hidratação inicial
    (`hasHydrated`) junto de `melhorias`/`defeitos`/etc., a partir de `sheet.abilities`.
  - **Recomendação de DRY**: como toda mutação de habilidade (e agora também a de level,
    ver abaixo) precisa aplicar o mesmo conjunto de 6 setters a partir de um `ISheet`
    retornado (`melhorias`, `defeitos`, `proficiencias`, `proficienciasAjustadas`,
    `saberes`, `abilities`), introduzir uma função local única, ex.
    `applyAbilityMutationResult(data: ISheet)`, que os 8 `onSuccess` abaixo (e o de
    `updateLevelMutation`) chamam, evitando repetir os mesmos 6 `setX(data.x)` oito vezes
    — mesmo espírito do que hoje já se repete em `linkRaceMutation`/`unlinkRaceMutation`/
    `linkBiographyMutation`/`unlinkBiographyMutation`, mas formalizado como helper dado o
    novo volume.
  - 8 mutações, seguindo exatamente o padrão de `linkRaceMutation`/`unlinkRaceMutation`
    (uso de `usePostEntity`/`usePutEntity`/`useDeleteEntity`,
    `invalidateQueryKeys: [['/sheets'], [\`/sheets/${sheetId}\`]]`, `onSuccess` aplicando
    o helper acima + `showToast` de sucesso em pt-BR, `onError` com `showToast` de erro em
    pt-BR usando `mutationError.response?.data?.message` como fallback):
    1. `addCharacteristicMutation` (`usePostEntity<ISheet, { characteristicId: string
       }>`, `url: \`/sheets/${sheetId}/characteristics\``) — adicionar extra.
    2. `removeCharacteristicMutation` (`useDeleteEntity<ISheet>`, `url: \`/sheets/
       ${sheetId}/characteristics/${characteristicPendingRemoveId}\``, com
       `characteristicPendingRemoveId` como estado local setado antes de chamar
       `.mutate()`, mesmo padrão de `userPendingDelete` em `usuarios/page.tsx`) — remover
       extra.
    3. `addTalentMutation` (idem 1, `url: \`/sheets/${sheetId}/talents\``).
    4. `removeTalentMutation` (idem 2, `url: \`/sheets/${sheetId}/talents/
       ${talentPendingRemoveId}\``).
    5. `addTrainingExtraMutation` (idem 1, `url: \`/sheets/${sheetId}/trainings/extras\``
       — path distinto de slot, a confirmar contra `task-api.md`).
    6. `removeTrainingExtraMutation` (idem 2, `url: \`/sheets/${sheetId}/trainings/extras/
       ${trainingExtraPendingRemoveId}\``).
    7. `fillTrainingSlotMutation` (`usePutEntity<ISheet, { trainingId: string }>`, `url:
       \`/sheets/${sheetId}/trainings/slots/${pendingSlotIndex}\`` — `pendingSlotIndex`
       setado ao abrir o modal de seleção a partir do slot clicado).
    8. `emptyTrainingSlotMutation` (`useDeleteEntity<ISheet>`, `url: \`/sheets/${sheetId}/
       trainings/slots/${pendingSlotIndex}\``).
  - Regra transversal de todas as 8 (spec, itens 22-24): nenhuma delas precisa de lógica
    especial de "melhoria escolhida + melhoria livre" (exclusiva de Biografia); o backend
    já devolve os snapshots recalculados prontos — o frontend só precisa aplicar a
    resposta, igual já ocorre hoje para Raça/Biografia.

- **Propagação da redução de level (requisito de frontend nº 9)**: `updateLevelMutation`
  hoje só tem `onError` (autosave via `useFieldAutosave`, sem `onSuccess`). Como reduzir o
  level da ficha pode remover slots de Treinamento e desvincular o Treinamento que
  estivesse neles (spec, item 13, decisão de investigação nº 6), com recálculo de
  melhorias/defeitos/proficiências/saberes, `updateLevelMutation` precisa ganhar um
  `onSuccess` que aplique o mesmo helper de 6 setters descrito acima (`melhorias`,
  `defeitos`, `proficiencias`, `proficienciasAjustadas`, `saberes`, `abilities`) a partir
  do `ISheet` retornado — hoje essa lacuna não existe porque nada dependia do level para
  esses snapshots; a partir desta demanda, passa a existir. **Não** sobrescrever o `level`
  local a partir da resposta (o valor já é a fonte de verdade local via input controlado,
  igual já ocorre hoje — só os 6 campos derivados precisam ser sincronizados).

- **Integrações com API** (nomes de endpoint abaixo são placeholders — confirmar contrato
  exato em `.claude/tasks/ficha-habilidades/task-api.md` antes/durante a implementação):
  - `GET /sheets/:id` — payload de `ISheet` passa a incluir `abilities:
    ISheetAbilitiesSummary` (consolidado herdados + slots + extras, com `requirementsMet`
    por item) e `race`/`biography` com os campos de herança já mencionados nos tipos.
  - `POST /sheets/:id/characteristics` e `DELETE /sheets/:id/characteristics/:id` —
    adicionar/remover Característica extra.
  - `POST /sheets/:id/talents` e `DELETE /sheets/:id/talents/:id` — idem para Talento.
  - `POST /sheets/:id/trainings/extras` e `DELETE /sheets/:id/trainings/extras/:id` —
    adicionar/remover Treinamento extra.
  - `PUT /sheets/:id/trainings/slots/:slotIndex` (payload `{ trainingId }`) e `DELETE
    /sheets/:id/trainings/slots/:slotIndex` — preencher/esvaziar slot de Treinamento.
  - `GET /characteristics`, `/trainings`, `/talents` (listagem paginada já existente,
    filtros `name`/`level`/`tagIds`) — reaproveitados sem endpoint novo dedicado
    (requisito de backend nº 8) para alimentar `SheetAbilitySelectionModal`; possível
    necessidade de parâmetro adicional (ex. `sheetId`) para o campo `requirementsMet`
    escopado à ficha — a confirmar.
  - Todas as mutações retornam `ISheet` completo, replicado localmente (ver acima),
    seguindo exatamente o padrão de `linkRaceMutation` já usado na página.

- **Formulário/validação**: não há formulário `react-hook-form`/zod nesta demanda — as
  únicas interações de "entrada" são os filtros do `SheetAbilitySelectionModal` (nome
  livre, level numérico opcional, tags multi-select opcional; nenhuma validação
  obrigatória, mesmo padrão dos filtros de listagem já existentes em
  `CharacteristicsFilterSection`/`TrainingsFilterSection`/`TalentsFilterSection`, que
  também não são obrigatórios). A única "regra de validação" funcional é o bloqueio de
  adicionar item já presente/com requisitos pendentes, resolvida via desabilitar o botão
  "Adicionar" no modal (client-side, a partir de `presentIds`/`requirementsMet` recebidos
  da API) — sem gate adicional de formulário. Erros de mutação (`409`/`400` eventuais de
  regra de exclusividade server-side) exibidos via `showToast`, mesmo padrão de erro já
  usado em `linkRaceMutation`/`linkBiographyMutation`.

- **Acesso Google**: **não ocultar nenhuma ação de criar/vincular/remover habilidades
  para usuários `provider: 'google'`** — divergência explícita e deliberada do padrão
  default descrito na skill `web-permissao-google-readonly`, já estabelecida e
  documentada para esta mesma página em `.claude/tasks/ficha-melhorias-estatisticas/
  task-web.md` (linhas ~234-243): a página de ficha nunca usou `useIsGoogleUser` porque o
  controle de acesso é por posse da ficha (`isRestrictedToOwnSheets`, backend), não por
  tipo de usuário — um usuário Google já pode hoje vincular/remover Raça e Biografia,
  editar nome/level/campanha, etc. em qualquer ficha à qual tenha acesso. O spec desta
  demanda não pede nenhuma mudança nesse comportamento, então os botões "Adicionar
  extras", "Remover", "Preencher/Esvaziar slot" seguem o mesmo padrão — visíveis e
  funcionais para todos os usuários com acesso à ficha, sem checagem adicional de
  `isGoogleUser`. A ação "Visualizar" (via `openEntityView`) já é universalmente
  permitida, consistente com o restante do projeto.

---

Status: concluído
Componentes:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilityCard/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingSlotCell/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetCharacteristicsPanel/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetTalentsPanel/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingsPanel/index.tsx` (novo)
- `SheetDashedFieldButton` reaproveitado sem alteração (o `py-4` atual ficou visualmente
  aceitável lado a lado com `SheetAbilityCard`/`SheetTrainingSlotCell` no grid — o ajuste
  opcional de `sx`/`className` não foi necessário).

Arquivos:
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts` (alterado: `ISheetRace` com
  `characteristics`/`talents`, `ISheetBiography`, `ISheetAbilityBucketType`,
  `ISheetAbilityOriginEntityType`, `ISheetAbilityOrigin`, `ISheetAbilityCard`,
  `ISheetTrainingSlot`, `ISheetAbilitiesSummary`, `ISheetAbilitiesMutationResult`,
  `ISheetAbilityRequirementCheck`)
- `app-web/src/app/(authorized)/fichas/[id]/data/index.ts` (alterado:
  `SHEET_EMPTY_ABILITIES_SUMMARY`, `SHEET_ABILITY_ORIGIN_LABELS`,
  `formatSheetAbilityOriginLabel`)
- `app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetAbilities/index.ts` (novo) —
  hidrata `abilities` via `GET /sheets/:id/abilities` (`useGetEntityById`), expõe as 8
  mutações (2 via `usePostEntity` genérico para os `POST .../extras`, 6 via hooks
  dedicados para os `DELETE`/`PUT` com id/slotIndex dinâmico na URL) e
  `refetchAbilitiesAfterLevelChange`
- `app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/index.ts`
  (novo) — `POST /sheets/:id/abilities/requirement-checks`
- `app-web/src/hooks/Queries/EntityQueries/useRemoveSheetCharacteristicExtraMutation/index.ts`
  (novo)
- `app-web/src/hooks/Queries/EntityQueries/useRemoveSheetTalentExtraMutation/index.ts` (novo)
- `app-web/src/hooks/Queries/EntityQueries/useRemoveSheetTrainingExtraMutation/index.ts`
  (novo)
- `app-web/src/hooks/Queries/EntityQueries/useFillSheetTrainingSlotMutation/index.ts` (novo)
- `app-web/src/hooks/Queries/EntityQueries/useEmptySheetTrainingSlotMutation/index.ts` (novo)
- `app-web/src/hooks/Queries/EntityQueries/index.ts` (alterado: exporta os 5 hooks acima)
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (alterado nesta retomada): nova aba
  de 1º nível "Habilidades" (após "Bônus") com sub-abas Características/Treinamentos/
  Talentos (`SheetAbilitiesSubTab`); corrigido `biography` (estava tipado como
  `IBiographyListItem`, tipo sequer importado no arquivo — bug pré-existente que impedia
  compilação — agora `ISheetBiography`, consistente com o tipo hidratado de
  `sheet.biography`); novo helper `applySheetSnapshots(data: ISheet)` (5 setters —
  `melhorias`/`defeitos`/`proficiencias`/`proficienciasAjustadas`/`saberes`, sem
  `abilities`, que não faz parte de `ISheet` no contrato real), reaproveitado por
  `linkRace`/`unlinkRace`/`linkBiography`/`unlinkBiography` (que também passaram a
  invalidar a query de `abilities`, pois Raça/Biografia alimentam os buckets herdados) e
  por `updateLevelMutation` (ganhou `onSuccess`: aplica os 5 snapshots e dispara
  `refetchAbilitiesAfterLevelChange`, sem sobrescrever o `level` local); painéis das 3
  sub-abas renderizados condicionalmente e wireados às 8 mutações de `useSheetAbilities`.

Divergências de contrato confirmadas contra o backend real (`task-api.md`), registradas
nos próprios arquivos (comentários) e resumidas aqui:
1. `abilities` **não** é um campo de `ISheet`/`SheetResponseDto` — é exposto por um
   endpoint próprio, `GET /sheets/:id/abilities`, e devolvido recalculado por cada uma
   das 8 mutações de habilidade dentro de `SheetAbilitiesMutationResponseDto { sheet,
   abilities }`. `useSheetAbilities` trata `abilities` como dado de query (via
   `useGetEntityById` + `queryClient.setQueryData` a cada mutação), não como um `useState`
   hidratado uma única vez como os demais snapshots — divergência do desenho original do
   plano (`ISheet.abilities` + `useState<ISheetAbilitiesSummary>`).
2. Cada card herdado carrega `origin: { entityType, id, name } | null` (nulo para
   slot/extra), não os campos separados `sourceName`/`sourceType` do placeholder do plano.
   `entityType` de `origin` inclui `'race'`, que não é um `ReferenceableEntityType` — tipo
   local `ISheetAbilityOriginEntityType` espelhando o mesmo desvio já assumido no backend.
3. As listagens paginadas de catálogo (`GET /characteristics`, `/trainings`, `/talents`)
   **não** retornam `requirementsMet`/presença por item — esse dado vem de um endpoint
   dedicado da ficha, `POST /sheets/:id/abilities/requirement-checks`, consultado em lote
   pelo `SheetAbilitySelectionModal` para os itens da página atual (não um parâmetro
   `sheetId` nos endpoints de listagem, como o plano cogitava).
4. Rotas de mutação seguem exatamente o `task-api.md`, não os placeholders do plano:
   `POST/DELETE /sheets/:id/characteristics/extras[/:characteristicId]`,
   `POST/DELETE /sheets/:id/talents/extras[/:talentId]`,
   `POST/DELETE /sheets/:id/trainings/extras[/:trainingId]`,
   `PUT/DELETE /sheets/:id/trainings/slots/:slotIndex/training` (sufixo `/training`,
   diferente do placeholder `/sheets/:id/trainings/slots/:slotIndex`).
5. `ISheetTrainingSlot.training`/os itens de `inherited`/`extras` usam um único tipo de
   card unificado (`ISheetAbilityCard`), não os dois tipos separados
   `ISheetInheritedAbilityItem`/`ISheetExplicitAbilityItem` do placeholder do plano —
   simplificação natural decorrente do desvio nº 2 (um único DTO
   `SheetAbilityCardResponseDto` com `origin` opcional cobre os dois casos).

Nenhum desvio de escopo/arquitetura além dos já confirmados contra o contrato real da API;
nenhuma pendência bloqueante identificada nesta retomada.

### 2. web-dev-codereviewer
Status: concluído

## Revisão

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetCharacteristicsPanel/index.tsx:52-65`,
  `SheetTrainingsPanel/index.tsx:93-106`, `SheetTalentsPanel/index.tsx:52-65`** — bug de
  `key` duplicada no `.map()` das listas de itens **herdados**, exatamente o cenário do
  spec item 7 ("quando a mesma característica é herdada de duas origens diferentes
  vinculadas à ficha, um card é exibido por origem — não agrupado"). As três chamadas
  usam `key={item.id}`, e `item.id` é o id da própria entidade
  (Característica/Treinamento/Talento), **não** um id por par (item, origem). Isso é
  confirmado pelo backend real: `SheetAbilityCardResponseDto.id` é sempre
  `characteristic.id`/`training.id`/`talent.id` (`app-api/src/modules/sheets/dto/sheet-
  ability-card-response.dto.ts`), e o próprio `sheets.service.ts`
  (`computeSheetAbilities`, comentário na linha ~774: "com duplicata por origem quando o
  mesmo item é herdado de origens diferentes") deliberadamente push duas `RawEntry` com o
  mesmo `item.id` e `origin` distintos quando, por exemplo, a mesma Característica vem de
  Raça e de um Talento vinculado simultaneamente. Com `key` duplicada, o React emite
  warning de "encountered two children with the same key" e pode reconciliar/renderizar
  incorretamente os dois cards (ex.: um card não atualizar o `sourceLabel` ao trocar de
  posição na lista, ou o React reaproveitar o DOM node errado entre eles), quebrando
  justamente o requisito central desse cenário (mostrar os dois cards, um por origem).
  - Trecho: `{inherited.map((item) => (<SheetAbilityCard key={item.id} ... />))}`
  - Sugestão: usar uma key composta e estável que inclua a origem, ex.
    `key={\`${item.id}-${item.origin?.entityType ?? 'none'}-${item.origin?.id ?? 'none'}\`}`
    (ou, se a API vier a expor um id de vínculo/origem dedicado, usar esse). Aplicar a
    mesma correção nos três painéis (`SheetCharacteristicsPanel`, `SheetTrainingsPanel`,
    `SheetTalentsPanel`).
  - **Corrigido**: `key` do `.map()` de `inherited` alterada, nos três painéis, para
    `` key={`${item.id}-${item.origin?.entityType ?? 'none'}-${item.origin?.id ?? 'none'}`} ``,
    exatamente a chave composta sugerida — mantém os dois cards da mesma entidade com
    origens diferentes visíveis e com identidade estável no React.

- **`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetAbilities/index.ts:55-58`** —
  nenhum tratamento de erro para a query de `abilities` (`GET /sheets/:id/abilities`, via
  `useGetEntityById`). Diferente da query principal da ficha (`GET /sheets/:id`, que tem
  `isError`/`useEffect`/`showToast` no `page.tsx`), aqui só `data`/`isLoading` são
  desestruturados — se o endpoint de habilidades falhar, o usuário não recebe nenhum
  feedback (a aba "Habilidades" simplesmente continua mostrando o estado vazio
  `SHEET_EMPTY_ABILITIES_SUMMARY`, indistinguível de "ficha sem nenhuma habilidade").
  Achado de prioridade média — não é um desvio do padrão dominante do arquivo (outras
  queries auxiliares da própria página, como `/skills`/`/races`/tags, também não tratam
  erro explicitamente), mas como esta é a fonte de dados de uma aba inteira (e não um
  detalhe secundário), vale reportar.
  - Trecho: `const { data: abilitiesData, isLoading: isLoadingAbilities } = useGetEntityById<ISheetAbilitiesSummary>({ url: abilitiesUrl });`
  - Sugestão: desestruturar também `isError`/`error` e disparar `showToast` (mesmo padrão
    de erro em pt-BR usado nas mutações do próprio hook) quando a query falhar.
  - **Corrigido**: `useSheetAbilities` agora desestrutura `isError`/`error` da query de
    `abilities` (renomeados `isAbilitiesError`/`abilitiesError`) e dispara, via
    `useEffect`, `showToast` de erro em pt-BR ("Não foi possível carregar as habilidades
    da ficha.", com fallback em `abilitiesError?.response?.data?.message`), mesmo padrão
    de erro já usado nas 8 mutações do hook e na query principal da ficha em `page.tsx`.

- **`app-web/src/app/(authorized)/fichas/[id]/hooks/useSheetAbilities/index.ts` (retorno
  do hook) / `page.tsx` (uso dos painéis de Habilidades)** — `isLoadingAbilities` é
  retornado pelo hook mas nunca consumido em `page.tsx`; nenhum dos 3 painéis
  (`SheetCharacteristicsPanel`/`SheetTrainingsPanel`/`SheetTalentsPanel`) recebe indicação
  de carregamento. Como `abilities` parte de `SHEET_EMPTY_ABILITIES_SUMMARY` antes da
  primeira resposta, ao abrir a aba "Habilidades" pouco depois do carregamento da página
  o usuário pode ver brevemente "Nenhuma característica herdada."/"Nenhum treinamento
  herdado."/"Nenhum talento herdado." mesmo quando a ficha tem itens, até a query
  resolver — mensagem de vazio indistinguível de carregamento. Achado de prioridade
  baixa/média (mesma classe de problema do item anterior, sobre feedback de loading, não
  apenas de erro).
  - Sugestão: usar `isLoadingAbilities` para exibir um `CircularProgress`/estado de
    carregamento nos 3 painéis (ou ao menos na seção de herdados) enquanto a query de
    `abilities` está em voo, mesmo padrão do `CircularProgress` já usado no carregamento
    inicial da página.
  - **Corrigido**: `page.tsx` agora desestrutura `isLoadingAbilities` de
    `useSheetAbilities` e passa `isLoading={isLoadingAbilities}` para os três painéis
    (`SheetCharacteristicsPanel`, `SheetTrainingsPanel`, `SheetTalentsPanel`), que
    ganharam a prop opcional `isLoading` e, quando `true`, renderizam um estado de
    carregamento (`CircularProgress size={28}` + `DefaultText` "Carregando
    características/treinamentos/talentos...") no lugar do conteúdo do painel, mesmo
    padrão visual do carregamento inicial da página.

Nenhum outro problema encontrado. Pontos verificados e aprovados nesta revisão:
- Correção do bug pré-existente de tipagem de `biography` em `page.tsx` (agora
  `ISheetBiography`, consistente com o payload hidratado).
- Ordem das abas (`Estatísticas`, `Bônus`, `Habilidades`) e das sub-abas
  (`Características`, `Treinamentos`, `Talentos`) conforme decidido no plano.
- Cards herdados sem ação de remover e com indicativo "via {origem}"; cards
  extra/slot com ação de remover e sem indicativo de origem — `SheetAbilityCard`
  implementa a distinção corretamente via presença/ausência de `sourceLabel`/`onRemove`.
- `SheetTrainingSlotCell` exibe o indicativo "Liberado no level X" tanto para slot vazio
  quanto preenchido.
- Alerta de "Requisitos pendentes" nos cards, sem bloquear nenhuma ação do card (regra do
  spec item 20 preservada — nenhuma remoção automática por perda de requisito, exceto a
  exceção documentada de redução de level, tratada no backend).
- `SheetAbilitySelectionModal`: bloqueio do botão "Adicionar" pelos dois motivos distintos
  (já presente → ícone de cadeado + tooltip "Já está na ficha"; requisitos não atendidos →
  ícone de alerta inline + tooltip "Requisitos não atendidos"), sem sobreposição visual
  entre os dois casos, ação "Visualizar" sempre habilitada independente do estado do botão
  "Adicionar".
- Propagação de recálculo: as 8 mutações de habilidade (via `useSheetAbilities`) e
  `updateLevelMutation` aplicam corretamente os snapshots derivados
  (`melhorias`/`defeitos`/`proficiencias`/`proficienciasAjustadas`/`saberes`) através do
  helper único `applySheetSnapshots`; `abilities` é atualizado via
  `queryClient.setQueryData` a cada mutação de habilidade (evitando round-trip) e via
  `invalidateQueries`/`refetchAbilitiesAfterLevelChange` para Raça/Biografia/level — todas
  as `invalidateQueryKeys` (`['/sheets']`, `[/sheets/:id]`, e a query key de `abilities`
  quando aplicável) conferem com as chaves reais usadas pelos hooks correspondentes.
- Todas as 8 mutações e a query de checagem de requisitos usam hooks de
  `@/hooks/Queries` (genéricos onde o CRUD é padrão; hooks dedicados, seguindo o precedente
  já estabelecido por `useResolveProficiencyAdjustmentMutation`, apenas onde a URL exige id
  dinâmico por chamada — justificativa coerente com o padrão do projeto).
- Todos os ícones novos vêm de `react-icons/fi`; nenhum `@mui/icons-material`/SVG
  customizado/emoji encontrado. `IconButton`s sem texto visível têm `aria-label` em pt-BR
  (`Visualizar {nome}`, `Remover {nome}`, `Adicionar {nome}`).
- Toasts e textos de UI em pt-BR, com fallback em
  `mutationError.response?.data?.message`, consistente com o restante da página.
- Nenhuma checagem de `useIsGoogleUser`/ocultação de ações para usuários Google — conforme
  divergência já documentada e reafirmada para esta página.
- Tipos (`ISheetAbilityCard`, `ISheetTrainingSlot`, `ISheetAbilitiesSummary`,
  `ISheetAbilitiesMutationResult`, `ISheetAbilityRequirementCheck`, `ISheetRace`,
  `ISheetBiography`) conferem exatamente com os DTOs reais do backend
  (`SheetAbilityCardResponseDto`, `SheetTrainingSlotResponseDto`,
  `SheetCharacteristicsAbilitiesResponseDto`, `SheetTrainingsAbilitiesResponseDto`,
  `AbilityRequirementCheckResponseDto`), incluindo nomes de campo (`extras`, não `extra`)
  e o payload de `POST /sheets/:id/abilities/requirement-checks`.
- Nenhuma duplicação de componente já existente em `shared/components/` — a decisão de
  criar `SheetAbilityCard`/`SheetAbilitySelectionModal` dedicados em vez de estender
  `EntityReferenceCard`/`EntityReferenceSelectionModal` é coerente com as diferenças reais
  de contrato (filtros extras, dois motivos de bloqueio, indicativo de origem/alerta de
  requisito) documentadas no próprio plano.