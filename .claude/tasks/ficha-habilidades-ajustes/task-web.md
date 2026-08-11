# Task Web: Ajustes na aba Habilidades da Ficha (filtro de requisitos no modal de seleção)

## Contexto
Ver .claude/tasks/ficha-habilidades-ajustes/spec.md — usar a seção "Escopo confirmado" e as
10 "Decisões tomadas por investigação" como base factual, sem reabrir nenhum ponto ali já
fechado. Ver também `.claude/tasks/ficha-habilidades/task-web.md` (implementação atual da
aba Habilidades, já concluída e revisada), referenciado abaixo como "task-web anterior".

**Item 3 do pedido original (regra de tag "Raça" para Talentos) é integralmente
backend-only** (spec, decisão nº 4): `SheetAbilityCard`
(`app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilityCard/index.tsx`) e
`SheetAbilitySelectionModal` já renderizam o alerta de "requisitos pendentes"/"requisitos
não atendidos" genericamente a partir do campo `requirementsMet`, sem conhecer o motivo da
não conformidade. A nova regra de Raça chega automaticamente assim que o backend passar a
incorporá-la em `requirementsMet`. **Verificado nesta investigação e confirmado: nenhuma
alteração de frontend é necessária para o item 3.** Não há etapa de implementação para isso
abaixo.

Todo o trabalho de frontend desta demanda (item 4 do pedido original) está concentrado em um
único arquivo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx`.

**Dependência crítica de contrato — `task-api.md` ainda não existe no momento deste
planejamento** (`.claude/tasks/ficha-habilidades-ajustes/task-api.md`). Todo nome de
rota/parâmetro/campo de resposta citado abaixo para o novo ponto de leitura escopado à ficha
é um **placeholder de contrato**, coerente com os "Requisitos para o planejamento de
backend" do spec (itens 4 e 5), mas a confirmar/ajustar contra o `task-api.md` real antes ou
durante a implementação — a demanda anterior (`ficha-habilidades`) já teve retrabalho
registrado por divergência de contrato (ver "Divergências de contrato confirmadas contra o
backend real" no task-web anterior), então nenhuma suposição de nome abaixo deve ser tratada
como definitiva.

Investigação de código já feita, usada como base deste plano:
- `SheetAbilitySelectionModal/index.tsx` (arquivo completo lido) — hoje faz duas chamadas:
  `useGetEntityList<SheetAbilityCandidate, SheetAbilityCandidateListFilters>` contra a prop
  `url` (`/characteristics` | `/trainings` | `/talents`, filtros `name`/`level`/`tagIds`/
  `page`/`perPage`) e, em seguida, `useCheckSheetAbilityRequirementsQuery({ sheetId,
  entityType, ids: itemIds })` contra `POST /sheets/:id/abilities/requirement-checks`,
  calculando `alreadyPresent`/`requirementsMet` só para os ids da página atual carregada.
  `TablePagination` usa `count={data?.total ?? 0}` vindo da primeira chamada (não filtrado
  por elegibilidade). Filtros de nome/level/tags já ficam nas linhas ~142-176 (dentro de um
  `<div className="flex flex-wrap items-end gap-3">`), usando `DefaultTextInput` (nome,
  ícone `FiSearch`) + `DefaultTextInput` numérico (level) + `DefaultMultiAutocompleteInput<ITag>`
  (tags, via `useTagOptionsQuery`). Reset de página para 1 já ocorre em dois `useEffect`
  (linhas ~94-107): um ao abrir o modal (reseta todos os filtros), outro disparado por
  `[nameFilter, levelFilter, tagsFilter]`.
- `useCheckSheetAbilityRequirementsQuery`
  (`app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/index.ts`)
  — confirmado por grep: **único consumidor no app-web é `SheetAbilitySelectionModal`**
  (nenhum outro arquivo referencia o hook). Exportado em
  `app-web/src/hooks/Queries/EntityQueries/index.ts:16`.
- `ISheetAbilityRequirementCheck` (`app-web/src/shared/interfaces/Entities/Sheet/index.ts:230-235`)
  — confirmado por grep: usado apenas por `SheetAbilitySelectionModal` e pelo próprio hook
  acima. Nenhum outro consumidor.
- `app-web/src/shared/components/Inputs/DefaultInputs/index.ts` — hoje exporta
  `DefaultTextInput`, `DefaultPasswordInput`, `DefaultAutocompleteInput`,
  `DefaultMultiAutocompleteInput`. **Não existe `DefaultCheckboxInput`.**
  `app-web/src/shared/components/Inputs/FormInputs/FormCheckboxInput/index.tsx` existe, mas é
  ligado a `react-hook-form` (`Controller`/`control`/`FieldPath`) — não serve diretamente
  para o estado local (`useState`) usado pelos filtros deste modal. `FormCheckboxInput` usa
  `Checkbox`/`FormControlLabel` do MUI com `sx={APP_INPUT_STYLES.checkbox}` no `Checkbox` e
  `APP_INPUT_STYLES.checkboxLabel` no label, mais `useAccessibleFontSize` para o tamanho de
  fonte acessível do label — mesmas constantes de estilo compartilhadas usadas por
  `DefaultTextInput` (`APP_INPUT_STYLES.textField`, `APP_INPUT_BASE_FONT_SIZE`).

## Etapas

### 1. web-dev
Status: concluído

Contrato real confirmado contra `app-api/src/modules/sheets/sheets.controller.ts`,
`sheets.service.ts` e os 3 DTOs novos — divergências em relação ao placeholder do plano:
- Rota real: `GET /sheets/:id/abilities/candidates` (placeholder usava `:sheetId`; código
  real usa `:id`, igual aos demais endpoints do controller — sem impacto no client, que só
  monta a URL com o valor de `sheetId`).
- Parâmetro de elegibilidade: `onlyEligible` (boolean), exatamente como o placeholder já
  antecipava — nenhum ajuste de nome necessário.
- Campos de resposta por item: `id`, `name`, `level`, `tags`, `alreadyPresent`,
  `requirementsMet` — exatamente como o placeholder previa.
- Decisão sobre a prop `url` do modal (ponto de atenção do plano): removida. O novo
  endpoint resolve o tipo via `entityType` (mesmos valores `'characteristic' | 'training' |
  'talent'` já usados pela prop `entityType`, que batem com o enum `ReferenceableEntityType`
  do backend), tornando `url` redundante — removida da interface `SheetAbilitySelectionModalProps`
  e dos 4 call sites (`SheetTrainingsPanel` x2, `SheetTalentsPanel`, `SheetCharacteristicsPanel`).

Nenhum outro desvio em relação ao pedido: componente novo, checkbox, unificação de chamada,
paginação e remoção de código órfão implementados exatamente como planejado.

Pendência herdada do `task-api.md` (não é responsabilidade do web-dev, apenas registrada
para rastreabilidade): os arquivos `app-api/src/modules/sheets/dto/check-ability-requirements.dto.ts`
e `app-api/src/modules/sheets/dto/ability-requirement-check-response.dto.ts` ficaram órfãos
no backend e não puderam ser fisicamente excluídos pelo agente api-dev — fora do escopo
deste agente (`app-api/` é limite intransponível do web-dev).

Pendência própria do web-dev: o arquivo
`app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/index.ts` não
pôde ser fisicamente excluído (ferramentas disponíveis ao agente são Read/Grep/Glob/Edit/
Write/Skill, sem exclusão de arquivo). Foi neutralizado (conteúdo esvaziado, sem nenhum
export) e removido do barrel `EntityQueries/index.ts` — confirmado por grep que não há mais
nenhuma referência a `useCheckSheetAbilityRequirementsQuery` em nenhum outro arquivo do
app-web. **Ação pendente**: excluir fisicamente a pasta
`useCheckSheetAbilityRequirementsQuery/` (ou via uma etapa com acesso a shell/Bash).

#### Componentes

- **Componente novo, pequeno: `DefaultCheckboxInput`**
  (`app-web/src/shared/components/Inputs/DefaultInputs/DefaultCheckboxInput/index.tsx`),
  exportado em `DefaultInputs/index.ts` (e, por consequência, em `Inputs/index.ts`).
  - **Decisão de arquitetura**: criar este componente em vez de usar `Checkbox`/
    `FormControlLabel` do MUI diretamente inline no modal. Justificativa: o CLAUDE.md
    descreve explicitamente a separação `DefaultInputs` (estado local simples) vs.
    `FormInputs` (`react-hook-form`) para os demais tipos de input do projeto (`DefaultTextInput`/
    `FormTextInput`, `DefaultAutocompleteInput`/`FormAutocompleteInput`, etc.) — já existe
    `FormCheckboxInput` do lado `FormInputs`, mas nenhum equivalente do lado `DefaultInputs`,
    o que é uma lacuna pontual do padrão, não uma ausência intencional. Este modal usa
    filtros com `useState` simples (mesmo padrão de `nameFilter`/`levelFilter`/`tagsFilter`
    já existentes nele), então o par natural é `DefaultCheckboxInput`, espelhando
    exatamente a mesma estilização de `FormCheckboxInput` (`APP_INPUT_STYLES.checkbox`/
    `checkboxLabel`, `useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text)`) para manter
    consistência visual entre os dois. Criar isso como componente reutilizável (em vez de
    inline) também deixa o padrão pronto para qualquer filtro booleano futuro em listagens
    com estado local — mesmo espírito de generalidade já seguido pelos demais `Default*`.
  - Props: `id: string`, `label?: string`, `checked: boolean`, `onChange: (checked:
    boolean) => void`, `disabled?: boolean` — espelha 1:1 as props de `FormCheckboxInput`
    trocando `name`/`control` (RHF) por `checked`/`onChange` (estado controlado simples),
    mesmo padrão de troca já usado entre `DefaultTextInput` (`value`/`onChange` de evento) e
    `FormTextInput`.
  - Comportamento esperado: `Checkbox` MUI com `checked`/`onChange={(event) =>
    onChange(event.target.checked)}`, envolvido em `FormControlLabel` com o `label` recebido,
    usando exatamente os mesmos `sx` (`APP_INPUT_STYLES.checkbox`, `APP_INPUT_STYLES.checkboxLabel`
    no `MuiFormControlLabel-label`) e `fontSize` acessível de `FormCheckboxInput`. Sem lógica
    de validação/erro (não se aplica a um filtro).

#### Funcionalidade

- **Páginas/rotas**: nenhuma rota nova (`APP_ROUTES` inalterado). Toda a mudança ocorre
  dentro de `SheetAbilitySelectionModal/index.tsx`, reaproveitado sem alteração de
  assinatura de props pelos 3 pontos de uso já existentes (extras de Características,
  extras/preenchimento de slot de Treinamentos, extras de Talentos) — a prop `entityType`/
  `url`/`title`/`presentIds`/`sheetId` já resolve a variação por sub-aba, então nenhuma
  mudança é necessária em `SheetCharacteristicsPanel`, `SheetTrainingsPanel`,
  `SheetTalentsPanel` nem em `page.tsx`.

- **Novo checkbox de filtro** "Somente habilidades que cumprem os requisitos" (rótulo
  proposto — mantém a redação usada no pedido original e no spec, ajustada para caber no
  espaço do grupo de filtros; ajustar redação exata durante a implementação se necessário,
  mantendo o sentido), desmarcado por padrão:
  - Novo estado local `const [onlyEligible, setOnlyEligible] = useState(false)`, junto dos
    demais estados de filtro (`nameFilter`/`levelFilter`/`tagsFilter`).
  - Renderizado dentro do mesmo `<div className="flex flex-wrap items-end gap-3">` que já
    contém os 3 filtros existentes (linhas ~142-176), como quarto item, usando o novo
    `DefaultCheckboxInput` (`checked={onlyEligible}`, `onChange={setOnlyEligible}`).
  - Resetado para `false` no `useEffect` de abertura do modal (linhas ~94-103), junto dos
    demais filtros.
  - Incluído na dependência do `useEffect` de reset de página (linhas ~105-107):
    `[nameFilter, levelFilter, tagsFilter, onlyEligible]` — mesmo padrão já usado para os
    demais filtros, sem lógica nova a criar.

- **Mudança arquitetural — unificar as duas chamadas em uma só**: remover a combinação
  atual `useGetEntityList` (contra `/characteristics` | `/trainings` | `/talents`) +
  `useCheckSheetAbilityRequirementsQuery` (contra `POST /sheets/:id/abilities/
  requirement-checks`) e substituir por uma única chamada a um novo ponto de leitura
  escopado à ficha (spec, decisão nº 9 / requisito de backend nº 4), definido em paralelo
  pelo `planejamento-api` em `.claude/tasks/ficha-habilidades-ajustes/task-api.md` — **ler
  esse arquivo antes de implementar; se ainda não existir no momento da implementação,
  tratar rota/nomes de parâmetro/formato de resposta abaixo como placeholders a confirmar
  diretamente contra o código real do backend (`sheets.controller.ts`/`sheets.service.ts`)**:
  - Placeholder de rota: `GET /sheets/:sheetId/abilities/candidates` (nome de rota fica a
    critério do backend — pode divergir).
  - Placeholder de parâmetros de query: `entityType` (`characteristic` | `training` |
    `talent`, mesmo valor hoje usado para escolher `url`), `name`, `level`, `tagIds`, um
    parâmetro booleano de elegibilidade (ex. `onlyEligible` ou `requirementsMet`, ligado ao
    estado do checkbox — só enviado/`true` quando `onlyEligible === true`, omitido/`false`
    quando desmarcado, mesmo padrão hoje usado para os demais filtros opcionais, que só são
    inclusos no objeto de filtros quando têm valor), `page`, `perPage`.
  - Placeholder de item de resposta: cada item já traz `alreadyPresent: boolean` e
    `requirementsMet: boolean` embutidos (substituindo a necessidade de
    `checksById`/`useCheckSheetAbilityRequirementsQuery`), além dos campos já existentes
    (`id`, `name`, `level`, `tags`). Ajustar a interface local `SheetAbilityCandidate`
    (hoje `{ id, name, level, tags }`) para incluir `alreadyPresent`/`requirementsMet`.
  - Implementado via `useGetEntityList<SheetAbilityCandidate, SheetAbilityCandidateListFilters>`
    (mesmo hook genérico já usado hoje, trocando apenas `url` — de `/characteristics` |
    `/trainings` | `/talents` para o novo endpoint escopado à ficha — e os filtros
    enviados), preservando `enabled: open` e `filters` computados a partir dos estados
    locais já existentes mais `sheetId`/`entityType`/`onlyEligible`. Não há necessidade de
    hook dedicado novo: o padrão genérico já cobre o caso.
  - Remover por completo: a chamada `useCheckSheetAbilityRequirementsQuery` dentro do
    modal, a variável `itemIds`/`useMemo` associada (deixa de ser necessária, já que não há
    mais uma segunda consulta por lote de ids), e `checksById`/`useMemo` associado —
    `alreadyPresent`/`requirementsMet` passam a vir diretamente de cada `item` da listagem.
  - `isAddDisabled`/`addTooltip`/renderização do ícone de alerta (linhas ~215-238)
    permanecem com a mesma lógica condicional já existente (`alreadyPresent` → cadeado +
    "Já está na ficha"; `!requirementsMet` → alerta + "Requisitos não atendidos"), apenas
    lendo os dois campos direto de `item` em vez de `checksById.get(item.id)`.

- **Remoção do hook e da interface órfãos** (spec, decisão nº 10 / requisito de frontend
  nº 4 — backend descontinua `POST /sheets/:id/abilities/requirement-checks` em paralelo,
  sem consumidores remanescentes após esta migração):
  - Excluir `app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/`
    (arquivo inteiro) e remover a linha `export * from
    './useCheckSheetAbilityRequirementsQuery';` de
    `app-web/src/hooks/Queries/EntityQueries/index.ts:16`.
  - Excluir a interface `ISheetAbilityRequirementCheck`
    (`app-web/src/shared/interfaces/Entities/Sheet/index.ts:230-235`, incluindo o
    comentário JSDoc que a precede).
  - Confirmado por grep nesta investigação: nenhum dos dois tem consumidor fora de
    `SheetAbilitySelectionModal` e do próprio hook — remoção segura, sem código órfão
    remanescente em outro ponto do app-web.

- **`TablePagination`** (linha ~280): `count` passa a usar o `total` retornado pela nova
  chamada única (mesmo `data?.total ?? 0` de hoje, agora coerente com todos os filtros
  ativos, incluindo `onlyEligible` — spec, item 9 do escopo confirmado). Nenhuma outra
  prop de `TablePagination` muda.

- **Cobertura dos 3 pontos de uso**: como a mudança fica inteiramente dentro de
  `SheetAbilitySelectionModal` e a assinatura de props (`open`, `onClose`, `title`,
  `entityType`, `url`, `sheetId`, `onSelect`, `isSelecting`) não muda, o comportamento novo
  (checkbox + chamada única + paginação correta) passa a valer automaticamente nas 3
  aberturas já existentes do modal: extras de Características, extras de Talentos, e
  extras/preenchimento de slot de Treinamentos (`onFill` em `SheetTrainingSlotCell` →
  mesmo modal, mesma prop `entityType="training"`). **Ponto de atenção para validação
  manual durante a implementação**: como a prop `url` deixa de ser usada para a listagem
  (substituída pelo novo endpoint escopado à ficha, que já resolve o tipo via `entityType`),
  avaliar se a prop `url` do componente ainda é necessária — se o novo endpoint cobrir os 3
  tipos apenas com `entityType`, `url` pode se tornar redundante e ser removida da
  interface `SheetAbilitySelectionModalProps` e dos 3 call sites; se o contrato real
  exigir `url` por outro motivo (ex.: endpoints separados por tipo em vez de um único
  parametrizado), mantê-la. Decisão final depende do `task-api.md`/código real do
  backend — não assumir aqui qual dos dois formatos o backend adotou.

- **Integrações com API**:
  - Placeholder (a confirmar contra `task-api.md`/backend real): novo endpoint `GET`
    escopado à ficha, parametrizado por `entityType`, paginado, com filtros
    `name`/`level`/`tagIds`/elegibilidade, substituindo as 3 listagens genéricas
    (`/characteristics`, `/trainings`, `/talents`) **apenas dentro deste modal** — essas 3
    listagens continuam existindo e sendo usadas normalmente em outros lugares do app-web
    (páginas de catálogo próprias, `EntityReferenceSelectionModal`), fora de escopo desta
    demanda (spec, "Fora de escopo").
  - Removido: `POST /sheets/:id/abilities/requirement-checks` (via remoção do hook
    correspondente, acima).

- **Formulário/validação**: nenhum formulário `react-hook-form`/zod nesta demanda. O
  checkbox novo é um filtro de estado local (`useState`), sem validação — mesmo espírito
  dos filtros de nome/level/tags já existentes no modal, que também não são obrigatórios
  nem validados.

- **Acesso Google**: sem alteração — este modal já é reaproveitado dentro de uma página
  (`fichas/[id]`) que, por decisão já documentada e reafirmada em demandas anteriores
  (`.claude/tasks/ficha-melhorias-estatisticas/task-web.md`,
  `.claude/tasks/ficha-habilidades/task-web.md`), **não** aplica o padrão default de
  ocultar criar/editar/excluir para usuários `provider: 'google'` — o controle de acesso da
  ficha é por posse (`isRestrictedToOwnSheets`, backend), não por tipo de ação/usuário. O
  checkbox de filtro e as demais ações do modal (Adicionar, Visualizar) seguem visíveis e
  funcionais para todos os usuários com acesso à ficha, sem checagem de
  `useIsGoogleUser`. Esta demanda não pede nenhuma mudança nesse comportamento já
  estabelecido.

Status: concluído
Componentes: app-web/src/shared/components/Inputs/DefaultInputs/DefaultCheckboxInput/index.tsx (novo);
app-web/src/shared/components/Inputs/DefaultInputs/index.ts (export adicionado);
app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx (checkbox
"Somente habilidades que cumprem os requisitos" adicionado ao grupo de filtros existente)
Arquivos: app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx
(chamada única a `GET /sheets/:sheetId/abilities/candidates` via `useGetEntityList`, substituindo
`useGetEntityList` genérico + `useCheckSheetAbilityRequirementsQuery`; interfaces locais
`SheetAbilityCandidate`/`SheetAbilityCandidateListFilters` atualizadas; prop `url` removida da
interface `SheetAbilitySelectionModalProps`; `TablePagination` já refletindo `total` da nova
chamada);
app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingsPanel/index.tsx (prop `url`
removida dos 2 usos do modal);
app-web/src/app/(authorized)/fichas/[id]/components/SheetTalentsPanel/index.tsx (prop `url`
removida);
app-web/src/app/(authorized)/fichas/[id]/components/SheetCharacteristicsPanel/index.tsx (prop `url`
removida);
app-web/src/hooks/Queries/EntityQueries/index.ts (linha de export de
`useCheckSheetAbilityRequirementsQuery` removida);
app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/index.ts (neutralizado
— sem export; exclusão física pendente, ver nota acima);
app-web/src/shared/interfaces/Entities/Sheet/index.ts (interface `ISheetAbilityRequirementCheck`
removida, incluindo o comentário JSDoc que a precedia)

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-web/src/app/(authorized)/fichas/[id]/components/SheetAbilitySelectionModal/index.tsx`,
`app-web/src/shared/components/Inputs/DefaultInputs/DefaultCheckboxInput/index.tsx`,
`app-web/src/shared/components/Inputs/DefaultInputs/index.ts`,
`app-web/src/shared/components/Inputs/index.ts`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetTrainingsPanel/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetTalentsPanel/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetCharacteristicsPanel/index.tsx`,
`app-web/src/hooks/Queries/EntityQueries/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useCheckSheetAbilityRequirementsQuery/index.ts`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts`.

Pontos conferidos:
- **Chamada única confirmada**: `SheetAbilitySelectionModal` faz apenas uma chamada, via
  `useGetEntityList<SheetAbilityCandidate, SheetAbilityCandidateListFilters>` contra
  `GET /sheets/${sheetId}/abilities/candidates`. Não há mais `useCheckSheetAbilityRequirementsQuery`,
  `itemIds`/`useMemo` associado nem `checksById` — `alreadyPresent`/`requirementsMet` são lidos
  diretamente de cada `item` (linhas 212, 225). Confirmado por grep: nenhuma referência restante a
  `checksById`/`itemIds`/`useCheckSheetAbilityRequirementsQuery` em `app-web/src/app/(authorized)/fichas`.
- **Paginação consistente**: `TablePagination` usa `count={data?.total ?? 0}` (linha 277) vindo
  exclusivamente da nova chamada única. Nenhum filtro é reaplicado no cliente sobre `items` — o
  `.map()` (linha 211) itera diretamente sobre `data?.data`, sem `.filter()` intermediário.
  Contrato do backend confirmado contra `app-api/src/modules/sheets/dto/find-sheet-ability-candidates-query.dto.ts`
  e `sheets.controller.ts:393` (`GET /sheets/:id/abilities/candidates`, parâmetro `onlyEligible`) —
  bate exatamente com o que o `task-web.md` registrou como contrato real.
- **Checkbox**: `onlyEligible` inicia em `false` (linha 87), é resetado para `false` no `useEffect`
  de abertura do modal (linha 103) e está incluído na dependência do `useEffect` de reset de página
  (linha 109, junto com `nameFilter`/`levelFilter`/`tagsFilter`). É enviado como `onlyEligible ||
  undefined` (linha 121), omitido quando `false` — mesmo padrão dos demais filtros opcionais. A
  renderização condicional de `alreadyPresent`/`!requirementsMet` (linhas 213-218, 225-233) preserva
  a semântica da decisão nº 8 do spec: itens `alreadyPresent` continuam aparecendo (com botão
  desabilitado + ícone de cadeado), o filtro de elegibilidade é responsabilidade exclusiva do
  backend sobre `requirementsMet`, sem lógica adicional de ocultação no cliente.
- **`DefaultCheckboxInput`**: criado em `shared/components/Inputs/DefaultInputs/DefaultCheckboxInput/index.tsx`,
  exportado em `DefaultInputs/index.ts` e, por consequência, em `Inputs/index.ts` (barrel). Props
  (`id`, `label?`, `checked`, `onChange`, `disabled?`) espelham 1:1 `FormCheckboxInput`, trocando
  `name`/`control` por `checked`/`onChange`. Usa exatamente os mesmos `sx`
  (`APP_INPUT_STYLES.checkbox` no `Checkbox`, `APP_INPUT_STYLES.checkboxLabel` combinado com
  `fontSize` de `useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text)` no label) e a mesma estrutura
  `FormControlLabel`/`Checkbox` de `FormCheckboxInput` — consistência visual confirmada por
  comparação lado a lado dos dois arquivos.
- **3 sub-abas**: `SheetTrainingsPanel` (2 usos — preenchimento de slot e extra), `SheetTalentsPanel`
  e `SheetCharacteristicsPanel` passam `entityType` correto (`"training"`, `"talent"`,
  `"characteristic"` respectivamente) e nenhum ainda passa `url` — prop removida da interface
  `SheetAbilitySelectionModalProps` e dos 4 call sites, sem quebra de assinatura. Fluxo de
  preenchimento de slot (`slotIndexPendingFill`/`onFillSlot`) intacto.
- **Código órfão**: `useCheckSheetAbilityRequirementsQuery/index.ts` está esvaziado (apenas
  comentário, sem exports) e removido do barrel `EntityQueries/index.ts`; `ISheetAbilityRequirementCheck`
  não existe mais em `shared/interfaces/Entities/Sheet/index.ts`. Grep em todo `app-web/src` confirma
  zero referências vivas a ambos fora do próprio arquivo neutralizado — não quebra build/imports.
  Exclusão física do arquivo/pasta é pendência conhecida (fora do escopo desta revisão, já
  documentada para remoção manual).
- **Ícones**: todos de `react-icons/fi` (`FiAlertTriangle`, `FiEye`, `FiLock`, `FiPlus`, `FiSearch`);
  nenhum `@mui/icons-material` encontrado. `IconButton`s de "Visualizar"/"Adicionar" têm
  `aria-label` em pt-BR (`Visualizar {item.name}`, `Adicionar {item.name}`).
- **Cores**: nenhuma cor nova — `APP_COLORS.alertRed` reaproveitada no ícone de alerta (linha 229),
  igual ao já usado em `SheetAbilityCard`.
- **Acesso Google**: sem checagem de `useIsGoogleUser` no modal — consistente com a decisão já
  documentada e reafirmada para a página de fichas (controle de acesso por posse, não por tipo de
  usuário).
- **React Query**: uso do hook genérico `useGetEntityList` de `@/hooks/Queries`, sem `useQuery`
  bespoke; `enabled: open` preservado.