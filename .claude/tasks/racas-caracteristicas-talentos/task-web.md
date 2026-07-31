# Task Web: Remoção de "Características Físicas" e novos relacionamentos de raças com características e talentos

## Contexto
Não existe `.claude/tasks/racas-caracteristicas-talentos/spec.md`. As decisões abaixo já
estão fechadas pelo solicitante e não devem ser reabertas. Ver também
`.claude/tasks/racas-caracteristicas-talentos/task-api.md` para o contrato exato do
backend desta mesma demanda: `physicalCharacteristics` deixa de existir em `Race`;
`POST /races` e `PUT /races/:id` passam a aceitar `characteristicIds?: string[]` e
`talentIds?: string[]`; `GET /races/:id` passa a retornar `characteristics` e `talents`
como arrays de `{ id, name, level, tags }` (sem `entityType`).

**Fora de escopo**: `app-api` inteiro e a feature `app-web/src/app/(authorized)/criaturas/`
(inclusive `CreatureFormSchema` e a interface `Creature`), que também usam
`physicalCharacteristics` mas pertencem a `Creature`, não a `Race`.

Features de referência já existentes usadas como padrão:
- `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx` — uso
  atual de `EntityReferenceListField` com duas listas cruzadas (`improvedFrom`/
  `requirements`), incluindo `otherListValue`/`currentEntityType`/`currentEntityId`.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` — modal com
  abas por tipo de entidade (`ENTITY_REFERENCE_SELECTION_TABS`), usado por
  `EntityReferenceListField`.
- `app-web/src/shared/components/EntityReferenceCard/index.tsx` — card de item
  selecionado, com `onRemove` opcional (mostra o level no canto superior direito quando
  presente).

## Etapas

### 1. web-dev

Status: concluído
Componentes:
- app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx (generalizado: `EntityReferenceTabConfig` exportado, prop `tabs?`, barra de Tabs oculta quando há 1 aba)
- app-web/src/shared/components/EntityReferenceListField/index.tsx (generalizado: `otherListValue`/`currentEntityType`/`currentEntityId` opcionais, prop `tabs?` repassada ao modal)
- app-web/src/app/(authorized)/racas/components/RaceTalentsListField/index.tsx (novo, específico da feature racas)
Arquivos:
- app-web/src/shared/formSchemas/RaceFormSchema/index.ts (removido `physicalCharacteristics`, adicionados `characteristicIds`/`talentIds`)
- app-web/src/shared/interfaces/Entities/Race/index.ts (removido `physicalCharacteristics` de `IRace`, adicionados `characteristics`/`talents: IEntityReference[]`)
- app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx (campo "Características Físicas" removido, "Descrição" full width, novos campos de Características/Talentos com estado local, payload com `characteristicIds`/`talentIds`)
- app-web/src/app/(authorized)/racas/components/RaceView/index.tsx (seção "Características Físicas" removida, novas seções "Características" e "Talentos" somente-leitura)

Observação: os 5 call sites existentes de `EntityReferenceListField` (talentos, treinamentos, técnicas, magias, características) não foram alterados e continuam funcionando com o mesmo comportamento (props tornadas opcionais, não obrigatórias).

#### Componentes (generalização + novo componente de feature)

**a) Generalizar `EntityReferenceSelectionModal`**
Arquivo: `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`
- Exportar o tipo `EntityReferenceTabConfig` (hoje interno/privado) para que outras
  features possam montar arrays de abas customizados.
- Adicionar prop opcional `tabs?: EntityReferenceTabConfig[]` em
  `EntityReferenceSelectionModalProps`, com default igual ao array atual
  `ENTITY_REFERENCE_SELECTION_TABS` (mantém o comportamento atual quando a prop não é
  informada).
- Quando o array de abas resultante tiver exatamente 1 entrada, NÃO renderizar a barra
  `<Tabs>`/`<Tab>` do MUI (ainda assim usar essa única aba internamente para resolver
  `url`/`entityType`/filtros/exclusão).
- Comportamento e demais props (`open`, `onClose`, `title`, `excludeReferences`,
  `onSelect`, busca por nome, paginação, ação "Visualizar"/"Adicionar") permanecem
  idênticos.

**b) Generalizar `EntityReferenceListField`**
Arquivo: `app-web/src/shared/components/EntityReferenceListField/index.tsx`
- Tornar `otherListValue`, `currentEntityType` e `currentEntityId` opcionais em
  `EntityReferenceListFieldProps`.
- Ajustar `handleSelect`: a validação de autorreferência (`reference.entityType ===
  currentEntityType && reference.id === currentEntityId`) só roda se `currentEntityType`
  estiver definido; a validação de duplicidade na "outra lista" só roda se
  `otherListValue` estiver definido (tratar como `[]` quando ausente).
- Adicionar prop opcional `tabs?: EntityReferenceTabConfig[]` e repassá-la para
  `EntityReferenceSelectionModal` (permite uso com uma única entidade, como
  características de raça).
- **Call sites a verificar (não podem quebrar)**, todos passando atualmente
  `otherListValue`/`currentEntityType`/`currentEntityId` obrigatórios — confirmar que
  continuam funcionando sem alteração de comportamento:
  - `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
  - `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`

**c) Novo campo de característica em raças (usa o componente generalizado, sem novo componente)**
Uso direto de `EntityReferenceListField` em `RaceCreateForm` com:
- `label="Características"`, `addButtonLabel="Adicionar Características"`;
- `tabs={[{ label: 'Características', entityType: 'characteristic', url: '/characteristics' }]}`
  (array de uma única entrada — a barra de abas do modal não aparece);
- sem `otherListValue`/`currentEntityType`/`currentEntityId` (não há lista cruzada nem
  risco de autorreferência, já que uma raça nunca aparece como candidata nesta lista).

**d) Novo componente `RaceTalentsListField` (específico da feature raças)**
Arquivo novo: `app-web/src/app/(authorized)/racas/components/RaceTalentsListField/index.tsx`
- Props: `value: IEntityReference[]`, `onChange?: (value: IEntityReference[]) => void`,
  `readOnly?: boolean` (default `false`).
- Reutiliza `EntityReferenceSelectionModal` (com `tabs` de uma única entrada:
  `{ label: 'Talentos', entityType: 'talent', url: '/talents' }`, sem abas de entidade)
  e `EntityReferenceCard`, mais primitivos de `shared/components/` (`SecondaryButton`,
  `Label`/`DefaultText`).
- Quando `readOnly` for `false` (modo formulário): exibe o botão **"Adicionar Talentos"**
  que abre o modal; itens adicionados aparecem como `EntityReferenceCard` com
  `onRemove` funcional (mesma lógica de adicionar/remover de `EntityReferenceListField`:
  bloquear duplicidade pelo par `entityType`+`id`).
- Quando `readOnly` for `true` (modo visualização, usado por `RaceView`): oculta o botão
  "Adicionar Talentos" e o modal; os cards são renderizados sem `onRemove` (prop
  omitida, já que `EntityReferenceCard.onRemove` é opcional).
- Barra de abas de agrupamento por level (MUI `Tabs`, mesmo estilo visual das abas de
  `EntityReferenceSelectionModal` — mesmas cores `APP_COLORS.gold`/`goldDark`), com as
  abas fixas, nesta ordem: **"1"**, **"5"**, **"9"**, **"13"**, **"17"**, **"Outros"**.
  - Um item de `value` com `level === 1` aparece somente na aba "1"; `level === 5` só em
    "5"; e assim por diante para 9, 13, 17.
  - Qualquer item cujo `level` não seja exatamente um desses cinco valores (incluindo
    `level` ausente/`null`) aparece na aba "Outros".
  - Dentro de cada aba, listar os itens filtrados como `EntityReferenceCard`s (mesmo
    padrão de "Nenhum item adicionado." quando a aba filtrada estiver vazia).
- Este componente NÃO deve ser generalizado dentro de `EntityReferenceListField`
  compartilhado — a lógica de agrupamento por level é exclusiva desta tela.

#### Funcionalidade

**Remoção de "Características Físicas" de raças** (Grep por `physicalCharacteristics`
restrito a arquivos de `racas/`, `RaceFormSchema` e interface `Race` — não tocar em
nada de `criaturas/`):
- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts`: remover o campo
  `physicalCharacteristics` do `raceFormSchema`, do tipo `RaceFormData` (inferido) e de
  `raceFormDefaultValues`; adicionar `characteristicIds: z.array(z.string()).optional()`
  e `talentIds: z.array(z.string()).optional()`, com defaults `[]`.
- `app-web/src/shared/interfaces/Entities/Race/index.ts`: remover
  `physicalCharacteristics?: string | null` de `IRace`; adicionar
  `characteristics: IEntityReference[]` e `talents: IEntityReference[]` a `IRace`
  (importar `IEntityReference` de `../EntityReference`). `IRaceListItem` já não expõe
  `physicalCharacteristics` nem precisa expor `characteristics`/`talents` (o backend
  também não os retorna na listagem paginada) — nenhuma alteração necessária aqui.
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`:
  - remover o `FormRichTextInput` de "Características Físicas" e a leitura de
    `raceDetail.physicalCharacteristics` no `reset(...)` de edição;
  - ajustar o grid que continha "Características Físicas" + "Descrição" lado a lado
    para que "Descrição" ocupe a linha inteira (full width — sair do grid de 2 colunas
    para um bloco próprio, ex.: `<div className="w-full">` ou grid de 1 coluna);
  - logo após o campo "Descrição", adicionar o `EntityReferenceListField` de
    características descrito no item (c) acima, com estado local
    `characteristics: IEntityReference[]` (via `useState`, seguindo o mesmo padrão de
    `improvedFrom`/`requirements` em `TalentCreateForm`) inicializado a partir de
    `raceDetail.characteristics` no `reset`/`useEffect` de edição (mapeando cada item da
    API — que vem como `{ id, name, level, tags }` sem `entityType` — para
    `IEntityReference` adicionando `entityType: 'characteristic'`), e resetado para `[]`
    ao sair do modo edição;
  - logo abaixo, adicionar o `RaceTalentsListField` (item d) com estado local
    `talents: IEntityReference[]`, inicializado a partir de `raceDetail.talents` da
    mesma forma (adicionando `entityType: 'talent'` a cada item), e resetado para `[]`
    fora do modo edição;
  - `buildPayload`: incluir `characteristicIds: characteristics.map((c) => c.id)` e
    `talentIds: talents.map((t) => t.id)` no payload enviado a `POST /races` e
    `PUT /races/:id` (remover `physicalCharacteristics` do payload); os estados
    `characteristics`/`talents` devem ser resetados para `[]` também no `onSuccess` da
    criação, espelhando `setImprovedFrom([])`/`setRequirements([])` em
    `TalentCreateForm`.
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`:
  - remover a seção `RaceSectionBox` de "Características Físicas" (e o import do ícone
    `FiUser` se não for mais usado em nenhum outro lugar do arquivo);
  - adicionar uma seção "Características": lista de `race.characteristics` (já mapeados
    com `entityType: 'characteristic'`) renderizada como `EntityReferenceCard`s
    somente-leitura (sem passar `onRemove`), com mensagem "Nenhum item adicionado."
    quando vazia;
  - adicionar uma seção "Talentos": renderizar `RaceTalentsListField` com
    `readOnly={true}` e `value` = `race.talents` (mapeados com `entityType: 'talent'`),
    aplicando as mesmas abas de level ("1", "5", "9", "13", "17", "Outros") do
    formulário;
  - a conversão de `{ id, name, level, tags }` (retorno da API) para `IEntityReference`
    (adicionando `entityType`) deve ocorrer no próprio `RaceView` ao consumir
    `race.characteristics`/`race.talents` (ou centralizada em um pequeno helper local,
    à escolha do `web-dev`, mas sem alterar o contrato de `IEntityReference` em si).

- Verificar que nenhuma coluna de listagem (`RacesListItem`, `RacesFilterSection`,
  `RacesList`) referenciava `physicalCharacteristics` — confirmado por leitura prévia
  do código que `IRaceListItem`/`RacesListItem` não exibem esse campo, então nenhuma
  mudança é esperada nesses arquivos além de uma checagem de confirmação.

- **Integrações com API**: `GET /races/:id` (agora retornando `characteristics`/
  `talents`), `POST /races`, `PUT /races/:id` (agora aceitando `characteristicIds`/
  `talentIds`, sem mais `physicalCharacteristics`), `GET /characteristics` (usado pelo
  modal de seleção de características) e `GET /talents` (usado pelo modal de seleção de
  talentos e por `RaceTalentsListField`). Endpoints de listagem/categoria de raças
  (`GET /races`, `GET /races/categories`) não mudam.

- **Formulário/validação** (`RaceFormSchema`): `name` (obrigatório), `categoryId`
  (obrigatório), `referenceImageUrl` (opcional, URL válida ou vazio), `description`
  (opcional/texto rico), `privateInformation` (opcional/texto rico), `tagIds` (array
  opcional de ids), `characteristicIds` (array opcional de ids, alimentado pela lista de
  características selecionadas), `talentIds` (array opcional de ids, alimentado pela
  lista de talentos selecionados). Campo `physicalCharacteristics` removido do schema.

- **Acesso Google**: ocultar criar/editar/excluir (padrão) — comportamento já existente
  em `RacesListItem` (`useIsGoogleUser`) não precisa de alteração; os novos campos de
  características/talentos só aparecem no formulário de criar/editar, que já é
  inacessível a usuários Google.

### 2. web-dev-codereviewer

Status: concluído

- Revisar tudo acima, com atenção especial a:
  - Confirmar que nenhuma referência a `physicalCharacteristics` restou em
    `app-web/src/shared/formSchemas/RaceFormSchema/`,
    `app-web/src/shared/interfaces/Entities/Race/`,
    `app-web/src/app/(authorized)/racas/**`.
  - Confirmar que `app-web/src/app/(authorized)/criaturas/**`,
    `app-web/src/shared/formSchemas/CreatureFormSchema/` e
    `app-web/src/shared/interfaces/Entities/Creature/` permanecem intocados.
  - Confirmar que os 5 call sites de `EntityReferenceListField` listados acima
    (talentos, treinamentos, técnicas, magias, características) continuam funcionando
    sem alteração de comportamento após a generalização.
  - Confirmar que `EntityReferenceSelectionModal` sem a prop `tabs` mantém o
    comportamento atual (5 abas, tabs visíveis) em todos os usos existentes.
  - Confirmar que a barra de `Tabs` do modal de seleção realmente não é renderizada
    quando há apenas 1 entrada em `tabs`, tanto no fluxo de características quanto no de
    talentos de raças.
  - Confirmar o agrupamento por level em `RaceTalentsListField` ("1", "5", "9", "13",
    "17", "Outros"), incluindo o caso de `level` ausente/nulo caindo em "Outros", e que
    o mesmo componente/comportamento é usado tanto no formulário quanto em `RaceView`
    (modo `readOnly`).
  - Confirmar que a conversão `{ id, name, level, tags }` → `IEntityReference` (com
    `entityType: 'characteristic'`/`'talent'`) é aplicada corretamente tanto ao carregar
    a raça para edição/visualização quanto ao montar `characteristicIds`/`talentIds` no
    payload de criação/edição.
  - Confirmar que "Descrição" ocupa a linha inteira no formulário após a remoção de
    "Características Físicas".
  - Confirmar textos em pt-BR e que o botão de características usa exatamente
    "Adicionar Características" e o de talentos "Adicionar Talentos".

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`
- `app-web/src/shared/components/EntityReferenceListField/index.tsx`
- `app-web/src/app/(authorized)/racas/components/RaceTalentsListField/index.tsx`
- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts`
- `app-web/src/shared/interfaces/Entities/Race/index.ts`
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`
- `app-web/src/app/(authorized)/racas/components/RacesListItem/index.tsx`
- `app-web/src/app/(authorized)/racas/page.tsx`
- `app-web/src/shared/components/EntityReferenceCard/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`

Pontos verificados especificamente:
- **`physicalCharacteristics`**: grep no repositório confirma que nenhuma ocorrência
  restou em `RaceFormSchema`, `IRace`/`IRaceListItem` ou em qualquer arquivo de
  `racas/**`. As únicas ocorrências remanescentes são em
  `CreatureFormSchema/index.ts`, `interfaces/Entities/Creature/index.ts`,
  `criaturas/components/CreatureView/index.tsx` e
  `criaturas/components/CreatureCreateForm/index.tsx` — todos fora de escopo e
  intocados, como esperado. `FiUser` também não aparece mais em nenhum arquivo de
  `racas/**` (import removido corretamente junto com a seção).
- **Generalização de `EntityReferenceSelectionModal`/`EntityReferenceListField`**: os
  5 call sites (`TalentCreateForm`, `TrainingCreateForm`, `TechniqueCreateForm`,
  `SpellCreateForm`, `CharacteristicCreateForm`) continuam passando
  `otherListValue`/`currentEntityType`/`currentEntityId` exatamente como antes e não
  usam a nova prop `tabs`, portanto caem no default `ENTITY_REFERENCE_SELECTION_TABS`
  (5 abas) sem alteração de comportamento. `EntityReferenceTabConfig` foi exportado e
  a barra `<Tabs>` só deixa de renderizar quando `tabs.length === 1`
  (`EntityReferenceSelectionModal/index.tsx:123`), o que só ocorre nos dois novos usos
  de raças (características em `RaceCreateForm` e talentos em
  `RaceTalentsListField`), preservando os 5 usos antigos com abas visíveis. A
  validação de autorreferência e de duplicidade na "outra lista" em
  `EntityReferenceListField.handleSelect` agora é condicional
  (`currentEntityType !== undefined` / `otherListValue ?? []`), sem mudança de
  comportamento quando essas props são informadas.
- **`RaceTalentsListField`**: agrupamento por level implementado via
  `RACE_TALENTS_KNOWN_LEVELS = [1, 5, 9, 13, 17]` e `getTalentLevelTabLabel`, que
  retorna `'Outros'` para qualquer level fora dessa lista, incluindo `null`/
  `undefined`. Abas fixas na ordem correta ("1", "5", "9", "13", "17", "Outros"). O
  mesmo componente é reutilizado tanto em `RaceCreateForm` (modo formulário,
  `readOnly=false`) quanto em `RaceView` (modo `readOnly=true`), com o botão
  "Adicionar Talentos" e o modal ocultos corretamente no modo leitura, e os cards
  renderizados sem `onRemove` (prop omitida, não passada como `undefined`
  explicitamente redundante).
- **Conversão `{ id, name, level, tags }` → `IEntityReference`**: aplicada de forma
  consistente via helper local `toEntityReferences` tanto em `RaceCreateForm`
  (carregamento para edição, no `useEffect` de `reset`) quanto em `RaceView`
  (leitura), adicionando `entityType: 'characteristic'`/`'talent'` a cada item.
  `buildPayload` monta `characteristicIds`/`talentIds` a partir do estado local
  (`characteristics.map((c) => c.id)` / `talents.map((t) => t.id)`), e os estados são
  resetados para `[]` tanto ao sair do modo edição quanto no `onSuccess` da criação,
  espelhando o padrão de `improvedFrom`/`requirements` do `TalentCreateForm`.
- **Layout do formulário**: "Descrição" agora ocupa um bloco `<div className="w-full">`
  próprio, fora do grid de 4 colunas usado por nome/categoria/imagem/tags, confirmando
  full width após a remoção de "Características Físicas".
- **Textos pt-BR**: botões usam exatamente "Adicionar Características" e "Adicionar
  Talentos"; mensagens de toast/erro e labels de seção ("Características",
  "Talentos", "Nenhum item adicionado.") em pt-BR, consistentes com o padrão do
  projeto.
- **Acesso Google**: `RacesListItem` e `page.tsx` de `racas/` permanecem inalterados
  nesse quesito (`useIsGoogleUser` já ocultava editar/excluir/"Novo"), sem regressão.