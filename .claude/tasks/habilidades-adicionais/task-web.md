# Task Web: Habilidades Adicionais (Treinamentos, Talentos, Características)

## Contexto
Ver .claude/tasks/habilidades-adicionais/spec.md

Nota: este plano depende do contrato de API definido em
`.claude/tasks/habilidades-adicionais/task-api.md` (backend implementado antes do
frontend). Assume-se que `POST`/`PUT`/`GET /:id` de `/trainings`, `/talents` e
`/characteristics` passam a aceitar/retornar `additionalAbilities` no mesmo formato já
usado por `improvedFrom`/`requirements`: escrita como array de `{ entityType, id }`,
leitura como array de `{ id, name, entityType }` (`entityType` minúsculo). Se o
`task-api.md` divergir desse formato, o `web-dev` deve ajustar `buildPayload`/tipagem
antes de integrar.

Investigação de código já feita (referências de padrão a seguir):
- `.claude/tasks/improved-from-requirements/task-web.md` — plano de referência já
  implementado e revisado da feature "Aprimorado de"/"Requisitos", da qual esta demanda
  é extensão direta. Mesmos padrões de estado local, payload e views devem ser
  seguidos aqui.
- `app-web/src/shared/components/EntityReferenceListField/index.tsx`,
  `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` e
  `app-web/src/shared/components/EntityReferenceCard/index.tsx` — componentes
  genéricos já existentes que implementam quadro de lista, modal de seleção com abas e
  card de referência, respectivamente. Reutilizados e adaptados (apenas o primeiro
  precisa de ajuste de assinatura — ver seção "Componentes" abaixo).
- `EntityReferenceSelectionModal` já tem, por padrão (`tabs = ENTITY_REFERENCE_SELECTION_TABS`),
  as 5 abas necessárias: Treinamentos (`training`), Talentos (`talent`), Características
  (`characteristic`), Técnicas (`technique`), Magias (`spell`) — não é necessário
  nenhum ajuste nesse componente nem passar prop `tabs` customizada nos novos usos.
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`,
  `.../talentos/components/TalentCreateForm/index.tsx`,
  `.../caracteristicas/components/CharacteristicCreateForm/index.tsx` — os 3
  formulários donos da nova propriedade; hoje cada um mantém `improvedFrom` e
  `requirements` como `useState<IEntityReference[]>` fora do react-hook-form/zod,
  inicializados a partir do detalhe em modo edição, resetados a `[]` em modo criação e
  após submit com sucesso, e mapeados para `{ entityType, id }` em `buildPayload`. Os 3
  usam hoje `EntityReferenceListField` com a prop `otherListValue` (singular).
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx` e
  `.../magias/components/SpellCreateForm/index.tsx` — também consomem
  `EntityReferenceListField` com `otherListValue` (singular) hoje, mas NÃO ganham a
  propriedade `additionalAbilities` nesta demanda; precisam apenas ser ajustados para a
  nova assinatura do componente genérico, sem nenhuma mudança de comportamento.
- `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`,
  `.../talentos/components/TalentView/index.tsx`,
  `.../caracteristicas/components/CharacteristicView/index.tsx` — telas de
  visualização das 3 entidades donas, hoje com dois quadros lado a lado ("Aprimorado
  de" com ícone `FiTrendingUp`, "Requisitos" com ícone `FiCheckSquare`) dentro de um
  `grid grid-cols-1 sm:grid-cols-2`, no padrão `APP_CONTAINER_STYLES.detailSectionBox`/
  `detailSectionBoxHeader`, renderizando `EntityReferenceCard` sem `onRemove`.
- `app-web/src/shared/interfaces/Entities/Training/index.ts`, `Talent/index.ts`,
  `Characteristic/index.ts` — interfaces de detalhe (`ITraining`, `ITalent`,
  `ICharacteristic`) já têm `improvedFrom`/`requirements: IEntityReference[]`;
  `app-web/src/shared/interfaces/Entities/Technique/index.ts` e `Spell/index.ts` têm o
  mesmo formato hoje e NÃO devem ganhar `additionalAbilities`.

## Etapas

### 1. web-dev
Status: concluído
Componentes: app-web/src/shared/components/EntityReferenceListField/index.tsx (prop `otherListValue` → `otherListValues: IEntityReference[][]`, default `[]`, validação de exclusividade ajustada em `handleSelect`)
Arquivos:
- app-web/src/shared/interfaces/Entities/Training/index.ts (ITraining ganha `additionalAbilities`)
- app-web/src/shared/interfaces/Entities/Talent/index.ts (ITalent ganha `additionalAbilities`)
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts (ICharacteristic ganha `additionalAbilities`)
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx (estado `additionalAbilities`, `buildPayload`, novo campo "Habilidades Adicionais" entre Descrição e grid Aprimorado de/Requisitos, `otherListValues` nos 3 usos)
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx (novo quadro "Habilidades Adicionais" com ícone `FiPlusCircle`, entre Descrição e grid Aprimorado de/Requisitos)
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx (idem Training)
- app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx (idem Training)
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx (idem Training)
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx (idem Training)
- app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx (ajuste mecânico `otherListValue` → `otherListValues`, sem mudança de comportamento)
- app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx (ajuste mecânico `otherListValue` → `otherListValues`, sem mudança de comportamento)

#### Componentes (adaptação de componente genérico existente)

- Componente: `EntityReferenceListField`
  (`app-web/src/shared/components/EntityReferenceListField/index.tsx`).
  - **Mudança de assinatura (breaking, com atualização obrigatória de todos os call
    sites):** substituir a prop `otherListValue?: IEntityReference[]` (singular) por
    `otherListValues?: IEntityReference[][]` (array de arrays), com valor padrão `[]`
    quando omitida. Cada elemento do array externo representa uma das "outras listas"
    contra as quais a exclusividade mútua deve ser validada — hoje sempre 1 lista
    (Técnicas/Magias, e também Aprimorado de/Requisitos nas 3 entidades donas antes
    desta demanda), a partir desta demanda 2 listas nos 3 formulários donos de
    "Habilidades Adicionais".
  - Ajustar a validação de exclusividade em `handleSelect`: onde hoje se verifica
    `(otherListValue ?? []).some((item) => isSameReference(item, reference))`, passar a
    verificar `otherListValues.some((list) => list.some((item) =>
    isSameReference(item, reference)))` (com `otherListValues` já default `[]` via
    parâmetro). Mantém a mesma mensagem de erro em pt-BR já existente ("Este item já
    está presente na outra lista e não pode ser adicionado aqui."), sem diferenciar
    qual das outras listas continha o item — comportamento equivalente ao já usado.
  - Nenhuma outra prop ou comportamento do componente muda (título, botão, listagem de
    `value` via `EntityReferenceCard`, abertura do `EntityReferenceSelectionModal` com
    `excludeReferences = value`, uso do `tabs` default).

  **Impacto em TODOS os call sites existentes (nenhum pode quebrar):**
  - `TrainingCreateForm`, `TalentCreateForm`, `CharacteristicCreateForm`: os 2 usos
    hoje existentes de `EntityReferenceListField` ("Aprimorado de" e "Requisitos") têm
    a prop `otherListValue={requirements}` / `otherListValue={improvedFrom}`
    substituída por `otherListValues={[requirements, additionalAbilities]}` /
    `otherListValues={[improvedFrom, additionalAbilities]}` (incluindo a nova lista
    como segundo elemento). Um terceiro uso é adicionado para "Habilidades Adicionais"
    com `otherListValues={[improvedFrom, requirements]}` (ver detalhes na subseção
    Funcionalidade abaixo).
  - `TechniqueCreateForm` e `SpellCreateForm`: continuam com apenas 2 listas
    (`improvedFrom`/`requirements`), sem nenhuma lista nova. Único ajuste necessário é
    trocar `otherListValue={requirements}` → `otherListValues={[requirements]}` e
    `otherListValue={improvedFrom}` → `otherListValues={[improvedFrom]}` nos 2 usos
    existentes em cada um — mudança mecânica de assinatura, sem alteração de
    comportamento observável (a validação de exclusividade entre as 2 listas continua
    idêntica).

#### Funcionalidade

- Páginas/rotas alteradas (nenhuma rota nova; alterações dentro de componentes já
  existentes):
  - `app/(authorized)/treinamentos` — `TrainingCreateForm`, `TrainingView`.
  - `app/(authorized)/talentos` — `TalentCreateForm`, `TalentView`.
  - `app/(authorized)/caracteristicas` — `CharacteristicCreateForm`,
    `CharacteristicView`.
  - `app/(authorized)/tecnicas` — `TechniqueCreateForm` (só ajuste de prop, ver acima;
    nenhuma mudança de UI/comportamento).
  - `app/(authorized)/magias` — `SpellCreateForm` (idem).

- **Rótulos exatos:** label do quadro = `"Habilidades Adicionais"`; texto do botão =
  `"Adicionar Habilidades"` (não usar "Adicionar Habilidades Adicionais").

- **Estado local nos 3 `*CreateForm` donos** (`TrainingCreateForm`, `TalentCreateForm`,
  `CharacteristicCreateForm`), seguindo exatamente o padrão já usado por
  `improvedFrom`/`requirements`:
  - Novo `const [additionalAbilities, setAdditionalAbilities] =
    useState<IEntityReference[]>([]);`, fora do `react-hook-form`/zod (nenhum campo
    novo em `trainingFormSchema`/`talentFormSchema`/`characteristicFormSchema`).
  - No `useEffect` de sincronização com `isEditMode`/`*Detail`: quando `!isEditMode`,
    `setAdditionalAbilities([])` junto dos resets já existentes de `improvedFrom`/
    `requirements`; quando `isEditMode` e o detalhe carregou,
    `setAdditionalAbilities(<entidade>Detail.additionalAbilities ?? [])`.
  - No `onSuccess` do `usePostEntity` (cadastro): `setAdditionalAbilities([])` junto do
    reset dos outros dois arrays.
  - `buildPayload`: adicionar parâmetro `additionalAbilities: IEntityReference[]` e
    incluir no payload `additionalAbilities: additionalAbilities.map((reference) => ({
    entityType: reference.entityType, id: reference.id }))`, mesmo mapeamento já usado
    para `improvedFrom`/`requirements`. Atualizar a interface local de payload
    (`TrainingPayload`/`TalentPayload`/`CharacteristicPayload`) para incluir
    `additionalAbilities: EntityReferenceInputPayload[]`.
  - `onSubmit`: passar `additionalAbilities` como novo argumento na chamada de
    `buildPayload`.

- **Posicionamento exato no markup dos 3 `*CreateForm`:** o novo
  `EntityReferenceListField` de "Habilidades Adicionais" é inserido como filho direto
  do `<form className="flex flex-col gap-6">`, IMEDIATAMENTE ENTRE o
  `FormRichTextInput` de Descrição e a `div` `className="grid grid-cols-1 gap-4
  sm:grid-cols-2"` que contém "Aprimorado de"/"Requisitos" — fora desse grid, portanto
  ocupando a largura total da linha (o componente já renderiza sua própria raiz como
  `<div className="flex flex-col gap-3">`, que naturalmente ocupa 100% da largura como
  filho direto do `form` em `flex flex-col`, sem necessidade de wrapper ou classes
  adicionais). Exemplo (TrainingCreateForm; mesmo padrão em Talent/Characteristic):
  ```tsx
  <FormRichTextInput
    id="training-form-description"
    name="description"
    control={control}
    label="Descrição"
    placeholder="Descreva o treinamento"
  />

  <EntityReferenceListField
    label="Habilidades Adicionais"
    addButtonLabel="Adicionar Habilidades"
    value={additionalAbilities}
    onChange={setAdditionalAbilities}
    otherListValues={[improvedFrom, requirements]}
    currentEntityType="training"
    currentEntityId={selectedTraining?.id}
  />

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <EntityReferenceListField
      label="Aprimorado de"
      addButtonLabel="Adicionar Aprimorado de"
      value={improvedFrom}
      onChange={setImprovedFrom}
      otherListValues={[requirements, additionalAbilities]}
      currentEntityType="training"
      currentEntityId={selectedTraining?.id}
    />

    <EntityReferenceListField
      label="Requisitos"
      addButtonLabel="Adicionar Requisitos"
      value={requirements}
      onChange={setRequirements}
      otherListValues={[improvedFrom, additionalAbilities]}
      currentEntityType="training"
      currentEntityId={selectedTraining?.id}
    />
  </div>
  ```
  `currentEntityType` é o literal fixo de cada página (`'training'`/`'talent'`/
  `'characteristic'`) e `currentEntityId` é `selectedTraining?.id`/
  `selectedTalent?.id`/`selectedCharacteristic?.id` (indefinido em modo criação,
  evitando falso positivo de autorreferência) — mesmo padrão já usado pelos outros dois
  campos.

- **Modal de seleção reaproveitado sem alteração:** o `EntityReferenceListField` de
  "Habilidades Adicionais" NÃO passa a prop `tabs` (usa o default de 5 abas do
  `EntityReferenceSelectionModal` — Treinamentos, Talentos, Características, Técnicas,
  Magias). O modal já oculta da listagem os itens presentes em `excludeReferences`
  (= `value`, isto é, os itens já presentes na própria lista "Habilidades Adicionais"
  do formulário aberto), conforme comportamento genérico já existente do componente —
  nenhuma alteração necessária no `EntityReferenceSelectionModal` para esta demanda.

- **Novo quadro "Habilidades Adicionais" nas 3 `*View`** (`TrainingView`, `TalentView`,
  `CharacteristicView`), no mesmo padrão visual/comportamental dos quadros "Aprimorado
  de"/"Requisitos" (`APP_CONTAINER_STYLES.detailSectionBox`/`detailSectionBoxHeader`,
  ícone + `Label` no cabeçalho, `EntityReferenceCard` sem `onRemove` para cada item,
  mensagem "Nenhum item adicionado." quando vazio). Ícone sugerido: `FiPlusCircle` (de
  `react-icons/fi`, ainda não usado nesses arquivos, distinto de `FiTrendingUp`/
  `FiCheckSquare` já usados por "Aprimorado de"/"Requisitos").
  **Posicionamento:** o novo quadro é inserido como bloco de largura total,
  IMEDIATAMENTE ENTRE o quadro de "Descrição" e a `div`
  `className="grid grid-cols-1 gap-4 sm:grid-cols-2"` que contém os quadros
  "Aprimorado de"/"Requisitos" — espelhando exatamente a posição do campo equivalente
  no formulário (entre Descrição e a linha Aprimorado de/Requisitos, largura total). Os
  dois quadros existentes ("Aprimorado de"/"Requisitos") permanecem lado a lado no
  mesmo grid de 2 colunas, sem alteração. Exemplo (CharacteristicView; mesmo padrão em
  Training/Talent):
  ```tsx
  <div style={APP_CONTAINER_STYLES.detailSectionBox}>
    {/* quadro Descrição, inalterado */}
  </div>

  <div style={APP_CONTAINER_STYLES.detailSectionBox}>
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
    >
      <FiPlusCircle style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
      <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
        Habilidades Adicionais
      </Label>
    </div>
    <div className="flex flex-col gap-2 px-3 py-3">
      {characteristic.additionalAbilities.length === 0 && (
        <DefaultText>Nenhum item adicionado.</DefaultText>
      )}
      {characteristic.additionalAbilities.map((reference) => (
        <EntityReferenceCard
          key={`${reference.entityType}-${reference.id}`}
          reference={reference}
        />
      ))}
    </div>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {/* quadros Aprimorado de / Requisitos, inalterados */}
  </div>
  ```

- **Interfaces TypeScript** — atualizar apenas as 3 interfaces de detalhe das
  entidades donas, acrescentando o novo campo logo após `requirements` para manter
  consistência de ordem com o restante do arquivo:
  - `app-web/src/shared/interfaces/Entities/Training/index.ts`: `ITraining` ganha
    `additionalAbilities: IEntityReference[]`.
  - `app-web/src/shared/interfaces/Entities/Talent/index.ts`: `ITalent` ganha
    `additionalAbilities: IEntityReference[]`.
  - `app-web/src/shared/interfaces/Entities/Characteristic/index.ts`: `ICharacteristic`
    ganha `additionalAbilities: IEntityReference[]`.
  - **`ITechnique` (`Technique/index.ts`) e `ISpell` (`Spell/index.ts`) NÃO recebem
    esse campo** — permanecem exatamente como estão hoje, com apenas `improvedFrom`/
    `requirements`. Nenhum arquivo dessas duas entidades é alterado nesta demanda além
    do ajuste mecânico de prop descrito na seção Componentes.
  - `*ListItem`/`*ListFilters` das 5 entidades permanecem inalterados (campo só existe
    no endpoint de detalhe, não em listagens paginadas — confirmado no spec).

- **Integrações com API** (conferir contrato final em
  `.claude/tasks/habilidades-adicionais/task-api.md` antes de implementar):
  - `GET /trainings/:id`, `/talents/:id`, `/characteristics/:id` — passam a retornar
    `additionalAbilities` como array de `{ id, name, entityType }`, consumido por
    `*CreateForm` (modo edição) e por `*View`.
  - `POST`/`PUT /trainings`, `/talents`, `/characteristics` — payload passa a aceitar
    `additionalAbilities` como array de `{ entityType, id }`, simétrico a
    `improvedFrom`/`requirements`.
  - `GET /trainings`, `/talents`, `/characteristics`, `/techniques`, `/spells` (listas
    paginadas) — reaproveitados sem alteração para alimentar as 5 abas do
    `EntityReferenceSelectionModal`, exatamente como já ocorre hoje para "Aprimorado
    de"/"Requisitos".
  - Nenhum endpoint novo; nenhuma alteração em `/search`.

- **Formulário/validação:**
  - Nenhum campo novo no zod (`trainingFormSchema`/`talentFormSchema`/
    `characteristicFormSchema` permanecem inalterados) — `additionalAbilities` fica
    fora do `react-hook-form`, gerido como estado local, mesmo padrão de
    `improvedFrom`/`requirements`.
  - Regras de bloqueio (autorreferência, duplicidade na própria lista, presença
    simultânea em qualquer uma das outras duas listas) continuam validadas
    client-side dentro de `EntityReferenceListField.handleSelect`, agora contra
    `otherListValues` (array de arrays) — ver seção Componentes. Feedback via
    `showToast` em pt-BR, sem chamada à API nesse momento.
  - Erros retornados pela API na submissão (`409`/`400` de validação server-side das
    mesmas regras, agora cobrindo as 3 listas) exibidos via `showToast` reaproveitando
    o padrão já usado nos `onError` de `usePostEntity`/`usePutEntity` de cada
    `*CreateForm`.

- **Acesso Google:** ocultar criar/editar/excluir (padrão). Sem mudança adicional —
  como o novo quadro "Habilidades Adicionais" (com ações de adicionar/remover) só
  existe dentro do formulário de criação/edição das 3 entidades donas, que já é
  inacessível a usuários `provider: 'google'` (`useIsGoogleUser`, botão "Novo" e ação
  "Editar" já ocultos), ele já fica inacessível sem nenhuma alteração de permissão. A
  ação "visualizar" (inclusive nos cards do novo quadro na tela de visualização e no
  modal de seleção) permanece visível a todos os usuários, consistente com "nenhuma
  regra de visibilidade adicional" confirmada no spec.

- **Confirmações explícitas de escopo (nenhuma ação necessária):**
  - Nenhuma rota nova (`APP_ROUTES` inalterado).
  - Nenhuma store nova (`store/PageStore` inalterado; `useSelectedTrainingStore`/
    `useSelectedTalentStore`/`useSelectedCharacteristicStore` já existentes bastam).
  - Nenhum schema zod novo ou alterado (`shared/formSchemas/*` inalterados).
  - Nenhum item novo de Sidebar.
  - `TechniqueCreateForm`/`TechniqueView`, `SpellCreateForm`/`SpellView`: nenhuma
    mudança de UI/comportamento — `TechniqueCreateForm`/`SpellCreateForm` só sofrem o
    ajuste mecânico de prop descrito na seção Componentes; as `*View` de Técnicas e
    Magias não são tocadas.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/shared/components/EntityReferenceListField/index.tsx
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/interfaces/Entities/Talent/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/shared/interfaces/Entities/Technique/index.ts
- app-web/src/shared/interfaces/Entities/Spell/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx

Pontos de atenção verificados especificamente e aprovados:

- **Breaking change `otherListValue` → `otherListValues`**: todos os call sites de
  `EntityReferenceListField` no repositório foram levantados via grep e conferidos um a
  um. Os 8 usos nos 5 formulários "donos de Aprimorado de/Requisitos"
  (`TrainingCreateForm`, `TalentCreateForm`, `CharacteristicCreateForm`,
  `TechniqueCreateForm`, `SpellCreateForm`) usam a nova prop `otherListValues` (array de
  arrays) corretamente. O único outro call site existente no projeto,
  `RaceCreateForm` (campo "Características"), não passa `otherListValue`/
  `otherListValues` em nenhum momento (não precisa de validação de exclusividade contra
  outra lista) — não sofre nenhuma regressão por ser uma prop opcional com default `[]`.
- **Técnicas e Magias sem regressão**: `TechniqueCreateForm` e `SpellCreateForm`
  mantêm exatamente 2 listas (`improvedFrom`/`requirements`), agora com
  `otherListValues={[requirements]}` e `otherListValues={[improvedFrom]}`
  respectivamente — mudança mecânica, comportamento de exclusividade idêntico ao
  anterior. `ITechnique`/`ISpell` continuam sem `additionalAbilities`, e
  `TechniqueView`/`SpellView` não foram tocados (confirmado via grep, sem ocorrência de
  `additionalAbilities`/`FiPlusCircle`).
- **Exclusividade mútua entre as 3 listas**: confirmada nos 3 formulários donos — cada
  um dos 3 `EntityReferenceListField` (Aprimorado de / Requisitos / Habilidades
  Adicionais) recebe as duas outras listas como `otherListValues`, dentro e fora do
  grid, em `TrainingCreateForm`, `TalentCreateForm` e `CharacteristicCreateForm`. A
  validação em `handleSelect` do componente genérico usa `otherListValues.some((list) =>
  list.some(...))`, cobrindo corretamente múltiplas listas de comparação.
- **Posicionamento no markup**: nos 3 `*CreateForm`, o `EntityReferenceListField` de
  "Habilidades Adicionais" é filho direto do `<form className="flex flex-col gap-6">`,
  posicionado imediatamente entre o `FormRichTextInput` de Descrição e a `div
  className="grid grid-cols-1 gap-4 sm:grid-cols-2"` de Aprimorado de/Requisitos —
  ocupando a linha inteira, fora do grid, exatamente como especificado. Nas 3 `*View`,
  o novo quadro "Habilidades Adicionais" (com `APP_CONTAINER_STYLES.detailSectionBox`)
  está posicionado entre o quadro de Descrição e o grid de 2 colunas de "Aprimorado
  de"/"Requisitos", replicando o padrão visual dos quadros existentes.
- **Rótulos exatos**: label do quadro/campo é `"Habilidades Adicionais"` e o texto do
  botão é `"Adicionar Habilidades"` nos 3 formulários (confirmado via grep — nenhuma
  ocorrência de "Adicionar Habilidades Adicionais").
- **Estado local `additionalAbilities`**: inicializado a partir de
  `<entidade>Detail.additionalAbilities ?? []` no `useEffect` de sincronização em modo
  edição, resetado a `[]` tanto ao sair do modo edição quanto no `onSuccess` do
  `usePostEntity` (cadastro), e incluído em `buildPayload` mapeando apenas
  `{ entityType, id }`, com a interface `*Payload` local atualizada — idêntico ao
  padrão já usado por `improvedFrom`/`requirements`, nos 3 formulários donos.
- **Modal de seleção**: nenhum dos 3 usos de "Habilidades Adicionais" passa a prop
  `tabs`, portanto usa o default `ENTITY_REFERENCE_SELECTION_TABS` (5 abas) do
  `EntityReferenceSelectionModal`, componente que não foi alterado nesta demanda.
- **Escopo negativo**: nenhuma rota nova (`shared/routes.ts` sem menções a
  "habilidades"), nenhuma store nova, nenhum schema zod alterado (confirmado grep em
  `TrainingFormSchema`, `TalentFormSchema`, `CharacteristicFormSchema` sem
  `additionalAbilities`/`improvedFrom`/`requirements`), nenhum item novo de Sidebar.
- **Ícones e acessibilidade**: `FiPlusCircle` importado de `react-icons/fi` nas 3
  `*View`, consistente com `FiTrendingUp`/`FiCheckSquare` já usados; `EntityReferenceCard`
  e `EntityReferenceSelectionModal` (reaproveitados sem alteração) já possuem
  `aria-label` em pt-BR nos `IconButton` de visualizar/adicionar/remover.
- **Textos em pt-BR**: todos os textos de UI adicionados (`"Habilidades Adicionais"`,
  `"Adicionar Habilidades"`, `"Não foi possível..."`, mensagens de sucesso) estão em
  pt-BR, consistentes com o restante do projeto.