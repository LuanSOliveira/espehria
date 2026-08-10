# Task Web: Propriedade `level` em Treinamentos

## Contexto
Não existe `.claude/tasks/treinamentos-level/spec.md` — a demanda já vem fechada
diretamente na mensagem repassada ao agente de planejamento. Resumo do fechado: a
feature `treinamentos` (`app-web/src/app/(authorized)/treinamentos/`) passa a ter a
mesma dinâmica de `level` já implementada em `características`, `talentos`,
`técnicas` e `magias` pela task anterior `.claude/tasks/habilidades-level/`
(ver `task-web.md` e `task-api.md` daquela pasta), que **explicitamente deixou
`treinamentos` de fora** na época. O backend desta mesma demanda (planejado em
paralelo em `.claude/tasks/treinamentos-level/task-api.md`) passa a exigir/retornar
`level` (inteiro obrigatório, mínimo 1) em `POST /trainings`, `PUT /trainings/:id`,
`GET /trainings` e `GET /trainings/:id`.

Feature de referência mais próxima: `app-web/src/app/(authorized)/talentos/` — mesma
estrutura de `treinamentos` (sem `referenceImage`), já com `level` implementado
integralmente (interface, schema, form, view, list, list item). O plano abaixo replica
exatamente esse padrão para `treinamentos`.

Investigação prévia confirmou:
- `app-web/src/shared/interfaces/Entities/Training/index.ts` (`ITraining`,
  `ITrainingListItem`) hoje não tem `level`; `ITalent`/`ITalentListItem` (equivalente)
  já têm `level: number`.
- `app-web/src/shared/formSchemas/TrainingFormSchema/index.ts` hoje só tem `name`,
  `description`, `tagIds`; `TalentFormSchema/index.ts` já tem o campo `level` (string
  no schema, com `refine` de dígitos + `refine` de mínimo 1, mensagens pt-BR) e
  `level: ''` em `talentFormDefaultValues`.
- `TrainingCreateForm/index.tsx` tem a mesma estrutura de `TalentCreateForm/index.tsx`
  (mesmos imports, mesmo grid `sm:grid-cols-2 lg:grid-cols-4` com `name` e `tagIds`,
  mesmo `buildPayload`, mesmas mutations `usePostEntity`/`usePutEntity` com
  `invalidateQueryKeys`), exceto que não tem o campo `level` nem a conversão
  string↔number.
- `TrainingView/index.tsx`, `TrainingsList/index.tsx` e `TrainingsListItem/index.tsx`
  espelham `TalentView`/`TalentsList`/`TalentsListItem` na estrutura, faltando apenas
  a exibição do level.
- `app-web/src/shared/components/EntityReferenceCard/index.tsx` já renderiza
  `reference.level` em `position: absolute, top/right` sempre que
  `reference.level !== null && reference.level !== undefined` — não precisa de
  nenhuma alteração; ao `/trainings` passar a retornar `level`, o card passa a exibi-lo
  automaticamente para treinamentos também.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` já declara
  `EntityReferenceCandidate.level?: number | null` e já inclui `level: item.level` no
  objeto passado a `onSelect` para **todas** as abas, incluindo a de Treinamentos
  (`{ label: 'Treinamentos', entityType: 'training', url: '/trainings' }`) — não há
  nenhum filtro ou omissão específica de `level` para o endpoint `/trainings`. Não
  precisa de alteração.
- `app-web/src/shared/interfaces/Entities/EntityReference/index.ts`
  (`IEntityReference.level?: number | null`) já é opcional/nulo e **deve permanecer
  assim** — `biografia` continua sendo um tipo referenciável sem level, então não é
  possível (nem desejável) tornar `level` obrigatório em `IEntityReference`. Nenhuma
  alteração necessária aqui.

Não é necessário criar nenhum componente novo em `shared/components/` — o primitivo
`FormTextInput` (com `type="number"`) já cobre o input numérico de `level`, seguindo
exatamente o mesmo uso já existente em `TalentCreateForm`. Por isso a subseção
"Componentes" é omitida.

## Etapas

### 1. web-dev
Status: concluído
Componentes: nenhum
Arquivos:
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/formSchemas/TrainingFormSchema/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx

#### Funcionalidade

**Interface (`shared/interfaces/Entities/Training/index.ts`)**
- Adicionar `level: number` em `ITraining` (logo após `tags: ITag[];`, mesma posição
  relativa usada em `ITalent`) e em `ITrainingListItem` (logo após `tags: ITag[];`,
  mesma posição usada em `ITalentListItem`).

**Schema de formulário (`shared/formSchemas/TrainingFormSchema/index.ts`)**
- Adicionar ao `trainingFormSchema`, exatamente no mesmo padrão de
  `talentFormSchema`:
  ```ts
  level: z
    .string()
    .min(1, 'Informe o level')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine((value) => Number(value) >= 1, 'O level deve ser no mínimo 1'),
  ```
- Adicionar `level: ''` em `trainingFormDefaultValues`.
- Não criar nenhuma variante `*EditFormSchema` — `TrainingFormSchema` hoje é um schema
  único para criar/editar (assim como `TalentFormSchema`), e a regra de `level` é a
  mesma em ambos os modos.

**`TrainingCreateForm/index.tsx`**
(`app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`)
- Adicionar `FormTextInput` numérico de `level` na grid atual (`name` + `tagIds`, em
  `sm:grid-cols-2 lg:grid-cols-4`), como 3º campo — mesma posição relativa usada em
  `TalentCreateForm` (ao lado do campo de tags):
  ```tsx
  <FormTextInput
    id="training-form-level"
    name="level"
    control={control}
    label="Level"
    placeholder="Digite o level"
    type="number"
    slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}
  />
  ```
- No `reset` do modo edição (dentro do `useEffect` que popula o formulário a partir de
  `trainingDetail`), incluir `level: String(trainingDetail.level)`.
- Atualizar `TrainingPayload` (`interface TrainingPayload extends
  Omit<TrainingFormData, 'description'>`) para também omitir `level` do spread e
  redeclará-lo como `number`, no mesmo padrão de `TalentPayload`:
  ```ts
  interface TrainingPayload extends Omit<TrainingFormData, 'description' | 'level'> {
    description?: string;
    level: number;
    // ... demais campos inalterados
  }
  ```
- No `buildPayload`, incluir `level: Number(data.level)` no objeto retornado (mesma
  posição relativa usada em `TalentCreateForm`), enviado tanto em
  `POST /trainings` quanto em `PUT /trainings/:id` (mutations `usePostEntity`/
  `usePutEntity` existentes, sem alteração de `invalidateQueryKeys`).

**`TrainingView/index.tsx`**
(`app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`)
- Exibir, logo abaixo do `Title` com `training.name` (mesmo local usado em
  `TalentView`), um `DefaultText` com `(level ${training.level})`.

**`TrainingsList/index.tsx`**
(`app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx`)
- Adicionar coluna de cabeçalho "Level" **antes** da coluna "Tags" (mesmo `Label` em
  negrito das demais colunas, mesma estrutura de `TalentsList`).
- Ajustar `colSpan` da linha de estado vazio de `3` para `4`.

**`TrainingsListItem/index.tsx`**
(`app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx`)
- Adicionar `TableCell` com `<DefaultText>{training.level}</DefaultText>` **antes** da
  célula de tags, na mesma ordem definida em `TrainingsList` (mesma estrutura de
  `TalentsListItem`).

**Componentes compartilhados de referência — confirmado que NÃO mudam**
- `app-web/src/shared/components/EntityReferenceCard/index.tsx`: já exibe
  `reference.level` condicionalmente quando presente/não nulo; nenhuma alteração
  necessária — ao `/trainings` passar a retornar `level`, o card passa a exibi-lo
  automaticamente para treinamentos, sem nenhuma mudança de código.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`: já repassa
  `level: item.level` para todas as abas (incluindo a de Treinamentos) no `onSelect`;
  nenhuma alteração necessária.
- `app-web/src/shared/interfaces/Entities/EntityReference/index.ts`: `level?: number |
  null` permanece opcional/nulo (não vira obrigatório), pois `biografia` continua
  sendo um tipo referenciável sem level; nenhuma alteração necessária.

#### Formulário/validação
- Campo novo no `trainingFormSchema`: `level`, obrigatório, string no schema com
  `refine` garantindo inteiro (`/^\d+$/`) e valor mínimo 1, convertido para `number`
  apenas ao montar o payload de envio (mesmo padrão de `talentFormSchema`). Mensagens
  de erro em pt-BR: "Informe o level", "Informe um número inteiro", "O level deve ser
  no mínimo 1".
- Nenhuma variante `TrainingEditFormSchema` nova é necessária — a regra de `level` é
  idêntica em criação e edição.

#### Acesso Google
- Nenhuma mudança de comportamento: `TrainingsListItem` já oculta editar/excluir para
  `provider: 'google'` via `useIsGoogleUser` — a nova coluna "Level" é apenas
  informativa e aparece para todos os usuários, sem relação com o padrão de ocultar
  ações de escrita (padrão `web-permissao-google-readonly`, inalterado).

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima: `app-web/src/shared/interfaces/Entities/Training/index.ts`,
  `app-web/src/shared/formSchemas/TrainingFormSchema/index.ts`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx`.
  Confirmar em especial que nenhuma alteração incidental foi feita em
  `EntityReferenceCard`, `EntityReferenceSelectionModal` ou `IEntityReference` (fora de
  escopo, já corretos como estão) e que `level` segue exatamente o padrão já aprovado
  em `talentos` (mensagens pt-BR, conversão string↔number, posição da coluna/campo).

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/formSchemas/TrainingFormSchema/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingsList/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingsListItem/index.tsx

Todos os arquivos foram comparados linha a linha com os equivalentes já aprovados em
`talentos` (`ITalent`/`ITalentListItem`, `TalentFormSchema`, `TalentCreateForm`,
`TalentView`, `TalentsList`, `TalentsListItem`) e a implementação segue exatamente o
mesmo padrão:
- `ITraining`/`ITrainingListItem` ganharam `level: number` na mesma posição relativa
  usada em `ITalent`/`ITalentListItem` (logo após `tags: ITag[];`).
- `trainingFormSchema` replica `talentFormSchema` byte a byte para o campo `level`
  (string com `refine` de dígitos `/^\d+$/` e `refine` de mínimo 1, mensagens pt-BR
  "Informe o level" / "Informe um número inteiro" / "O level deve ser no mínimo 1"),
  com `level: ''` em `trainingFormDefaultValues` e sem variante `*EditFormSchema`
  (correto, pois a regra é a mesma em criar/editar, como em `talentFormSchema`).
- `TrainingCreateForm` usa `FormTextInput` numérico (`type="number"`,
  `slotProps.htmlInput` com `min: 1, step: 1, inputMode: 'numeric'`) na mesma posição
  (3º campo do grid `sm:grid-cols-2 lg:grid-cols-4`, ao lado de tags); popula
  `level: String(trainingDetail.level)` no `reset` do modo edição; `TrainingPayload`
  omite `level` do spread e o redeclara como `number`; `buildPayload` converte com
  `Number(data.level)`; modo criar/editar é derivado de `useSelectedTrainingStore`
  (não de prop manual); mutations `usePostEntity`/`usePutEntity` mantêm
  `invalidateQueryKeys: [['/trainings']]` inalterado, garantindo que a listagem
  recarregue sozinha após criar/editar; loading e erro de carregamento do detalhe em
  modo edição têm feedback visual (`CircularProgress` + `showToast`).
- `TrainingView` exibe `` `(level ${training.level})` `` logo abaixo do `Title` com
  `training.name`, mesmo local usado em `TalentView`.
- `TrainingsList` tem a coluna "Level" antes de "Tags" e `colSpan` do estado vazio
  ajustado para `4`.
- `TrainingsListItem` tem o `TableCell` com `<DefaultText>{training.level}</DefaultText>`
  antes da célula de tags, na mesma ordem da lista; ações de editar/excluir continuam
  ocultas para `provider: 'google'` via `useIsGoogleUser` (inalterado), e a nova coluna
  "Level" é apenas informativa, visível para todos os usuários.
- Ícones usados nos arquivos tocados (`FiArrowDownCircle`, `FiArrowUpCircle`,
  `FiBookOpen`, `FiCheckSquare`, `FiFileText`, `FiPlusCircle`, `FiTrendingUp`, `FiZap`,
  `FiEdit2`, `FiEye`, `FiTrash2`) vêm todos de `react-icons/fi`, sem `@mui/icons-material`
  nem SVG customizado.
- Confirmado que `app-web/src/shared/components/EntityReferenceCard/index.tsx` e
  `app-web/src/shared/interfaces/Entities/EntityReference/index.ts` permanecem
  exatamente como descrito na task (nenhuma alteração incidental): o card continua
  exibindo `reference.level` condicionalmente e `IEntityReference.level` continua
  `?: number | null`.
