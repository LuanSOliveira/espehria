# Task Web: Melhorias e Defeitos em Talentos, Treinamentos e Características

## Contexto
Ver .claude/tasks/melhorias-defeitos/spec.md

Nota: este plano depende do contrato de API definido em
`.claude/tasks/melhorias-defeitos/task-api.md`. No momento deste planejamento esse
arquivo ainda não existe (etapa de backend em andamento em paralelo) — os
endpoints/formatos abaixo são assumidos com base no spec (seção "Requisitos para a
etapa de planejamento do frontend" e nomenclatura confirmada `improvements`/`flaws`/
`value`/`type`/`property`). O `web-dev` DEVE ler `task-api.md` antes de implementar e
ajustar os pontos abaixo sinalizados como "a confirmar" (nomes exatos de URL das
tabelas auxiliares, formato exato do payload de escrita de `type`/`property` — id cru
vs. `typeId`/`propertyId` — e, principalmente, como a API expõe o vínculo Tipo→
Propriedade usado para filtrar o Autocomplete de Propriedade).

Investigação de código já feita (referências de padrão a seguir):

- `.claude/tasks/improved-from-requirements/task-web.md` e o código resultante —
  padrão visual/estrutural de "quadro com lista + botão de adicionar + card com ação
  de remover", já usado para "Aprimorado de"/"Requisitos"/"Habilidades Adicionais" nas
  3 entidades alvo. Este é o padrão estrutural a replicar para "Melhorias"/"Defeitos",
  mas os componentes concretos (`EntityReferenceCard`, `EntityReferenceListField`,
  `EntityReferenceSelectionModal`) são específicos de listas de referência a outra
  entidade (busca paginada em `/trainings`, `/talents`, etc.) e **não devem ser
  reaproveitados diretamente** — Melhoria/Defeito não referencia outra entidade, é um
  registro de 3 campos (valor, tipo, propriedade) preenchido em um formulário próprio.
  Novo conjunto de componentes equivalente, mas específico, é necessário (detalhado
  abaixo).
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/
  index.tsx` e `CharacteristicView/index.tsx` (e os equivalentes em `talentos/` e
  `treinamentos/`) — confirmada a ordem atual dos campos/quadros: Nome/Tags/(Level) →
  Descrição → Habilidades Adicionais → grid 2 colunas (Aprimorado de | Requisitos).
  `improvedFrom`/`requirements`/`additionalAbilities` ficam em `useState` local no
  `*CreateForm` (fora do `react-hook-form`/zod), inicializados a partir do detalhe em
  modo edição (`useEffect` com `reset`), resetados para `[]` em modo criação e após
  submit com sucesso. Mesmo padrão a seguir para `improvements`/`flaws`.
- `app-web/src/hooks/Queries/EntityQueries/useAttributesQuery/index.ts` e
  `useCurrenciesQuery/index.ts` — padrão confirmado de hook dedicado para tabela
  auxiliar de seed: `useQuery` com `queryKey` fixa, `ApiFactory(getAuthToken())`,
  `GET` simples (sem paginação) retornando `TInterface[]`, `staleTime: 5 * 60 * 1000`.
  Mesmo padrão para os dois novos hooks de Tipo e Propriedade.
- `app-web/src/app/(authorized)/pericias/components/SkillCreateForm/index.tsx` —
  exemplo de uso de `FormAutocompleteInput` alimentado por hook de tabela auxiliar
  (`useAttributesQuery` → `keyAttributeId`) dentro de um `react-hook-form` comum.
- `app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts` (campo `level`) e
  `AmmunitionFormSchema/index.ts` (campo `price`) — padrão zod já usado no projeto para
  número inteiro digitado como string: `z.string().refine(/^\d+$/) .refine(Number >=
  min)`. Mesmo padrão para o campo "Valor" (mínimo 1, sem máximo).
- `app-web/src/shared/components/Modals/FormModal/index.tsx` — modal genérico
  (`size="default" | "wide"`) a reaproveitar como casca do novo modal de
  adicionar Melhoria/Defeito (`size="default"`, formulário simples de 3 campos).
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` — exemplo de
  `useEffect` que reseta estado interno do modal (aba, filtro, página) sempre que
  `open` passa a `true`; mesmo mecanismo a seguir para resetar o formulário interno do
  novo modal de adicionar Melhoria/Defeito a cada abertura.
- `app-web/src/shared/interfaces/Entities/Attribute/index.ts` (`{ id, name }`) e
  `EntityReference/index.ts` — formato mínimo já usado para tabelas auxiliares simples;
  base para as novas interfaces `IImprovementDefectType`/`IImprovementDefectProperty`.
- `app-web/src/shared/interfaces/Entities/Characteristic/index.ts`,
  `Talent/index.ts`, `Training/index.ts` — interfaces de detalhe já estendidas com
  `improvedFrom`/`requirements`/`additionalAbilities: IEntityReference[]`; ganham agora
  também `improvements`/`flaws: IImprovementDefectItem[]`.

## Etapas

### 1. web-dev
- Status: concluído
- Contrato de API confirmado em `task-api.md` (leitura direta dos DTOs reais em
  `app-api/src/modules/improvement-flaw-*`): rotas exatas `GET /improvement-flaw-types`
  e `GET /improvement-flaw-properties` (sem filtro `typeId` via query — a propriedade
  já retorna o vínculo `typeId` no próprio item, usado para filtro client-side no
  Autocomplete); payload de escrita `{ value: number, type: string /* uuid */, property:
  string /* uuid */ }` idêntico ao assumido no planejamento; formato de leitura
  `{ value, type: { id, name }, property: { id, name, typeId } }` idêntico ao assumido.
  Nenhum ajuste de nomenclatura foi necessário em relação ao que já estava descrito
  abaixo — as suposições do planejamento bateram exatamente com o contrato real.
- Componentes:
  - `app-web/src/shared/components/ImprovementDefectCard/index.tsx` (novo)
  - `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx` (novo)
  - `app-web/src/shared/components/ImprovementDefectListField/index.tsx` (novo)
- Arquivos:
  - `app-web/src/shared/interfaces/Entities/ImprovementDefectType/index.ts` (novo)
  - `app-web/src/shared/interfaces/Entities/ImprovementDefectProperty/index.ts` (novo)
  - `app-web/src/shared/interfaces/Entities/ImprovementDefectItem/index.ts` (novo)
  - `app-web/src/shared/interfaces/Entities/index.ts` (reexport dos 3 novos)
  - `app-web/src/shared/interfaces/Entities/Talent/index.ts` (campos `improvements`/`flaws`)
  - `app-web/src/shared/interfaces/Entities/Training/index.ts` (campos `improvements`/`flaws`)
  - `app-web/src/shared/interfaces/Entities/Characteristic/index.ts` (campos `improvements`/`flaws`)
  - `app-web/src/hooks/Queries/EntityQueries/useImprovementDefectTypesQuery/index.ts` (novo)
  - `app-web/src/hooks/Queries/EntityQueries/useImprovementDefectPropertiesQuery/index.ts` (novo)
  - `app-web/src/hooks/Queries/EntityQueries/index.ts` (reexport dos 2 novos hooks)
  - `app-web/src/shared/formSchemas/ImprovementDefectFormSchema/index.ts` (novo)
  - `app-web/src/shared/formSchemas/index.ts` (reexport)
  - `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx` (estado
    `improvements`/`flaws`, payload, novo grid de quadros)
  - `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx` (novo grid de
    quadros somente leitura)
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
    (idem)
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx` (idem)
  - `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
    (idem)
  - `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`
    (idem)

#### Componentes

- Interfaces (novo, não são componentes visuais) —
  `shared/interfaces/Entities/ImprovementDefectType/index.ts` e
  `shared/interfaces/Entities/ImprovementDefectProperty/index.ts`, reexportadas em
  `shared/interfaces/Entities/index.ts`:
  - `IImprovementDefectType { id: string; name: string }`.
  - `IImprovementDefectProperty { id: string; name: string; typeId: string }` — o campo
    `typeId` (nome exato a confirmar em `task-api.md`) é o vínculo Propriedade→Tipo
    usado para o filtro dependente do Autocomplete; **não fazer hardcode de nomes**
    ("Ataque"/"Teste de Resistência"/etc.) no frontend para decidir o filtro — filtrar
    sempre a partir desse campo de vínculo retornado pela API. Se `task-api.md`
    modelar o vínculo de forma diferente (ex.: lista de `typeIds` permitidos por
    propriedade, ou endpoint de propriedades filtrado por `typeId` via query param em
    vez de filtro client-side), ajustar a interface e a lógica de filtro do modal
    (item "Componentes > ImprovementDefectAddModal" abaixo) de acordo, mantendo o
    princípio de não hardcodar nomes.
  - `IImprovementDefectItem { value: number; type: IImprovementDefectType; property:
    IImprovementDefectProperty }` — formato de leitura assumido (cada item chega com
    `type`/`property` como objeto completo, não apenas o id, para permitir exibir o
    nome no card sem lookup adicional — mesmo princípio de `keyAttribute` em `ISkill`).
    Confirmar contra o DTO de resposta em `task-api.md` antes de implementar; se a API
    retornar apenas ids, ajustar (resolver o nome localmente a partir dos hooks de
    tipos/propriedades). Reexportada em `shared/interfaces/Entities/index.ts`.

- Componente: `useImprovementDefectTypesQuery` (novo hook) —
  `hooks/Queries/EntityQueries/useImprovementDefectTypesQuery/index.ts`, reexportado em
  `hooks/Queries/EntityQueries/index.ts`.
  - Mesmo padrão de `useAttributesQuery`/`useCurrenciesQuery`: `useQuery<
    IImprovementDefectType[], AxiosError<IAxioDataError>>`, `queryKey` fixa,
    `ApiFactory(getAuthToken())`, `GET` sem paginação, `staleTime: 5 * 60 * 1000`. URL
    exata (ex.: `/improvement-defect-types`) a confirmar em `task-api.md`.

- Componente: `useImprovementDefectPropertiesQuery` (novo hook) —
  `hooks/Queries/EntityQueries/useImprovementDefectPropertiesQuery/index.ts`,
  reexportado em `hooks/Queries/EntityQueries/index.ts`.
  - Mesmo padrão acima, retornando `IImprovementDefectProperty[]`. URL exata (ex.:
    `/improvement-defect-properties`) a confirmar em `task-api.md`. Se `task-api.md`
    definir um endpoint que já aceita filtro por `typeId` via query param (em vez de
    retornar a lista completa para filtro client-side), ajustar a assinatura do hook
    para aceitar `typeId` opcional e repassar como filtro — decisão final de
    implementação cabe ao `web-dev` após ler o contrato real.

- Componente: schema `improvementDefectFormSchema` (novo) —
  `shared/formSchemas/ImprovementDefectFormSchema/index.ts`, reexportado em
  `shared/formSchemas/index.ts`.
  - Campos: `value: z.string().min(1, 'Informe o valor').refine(/^\d+$/, 'Informe um
    número inteiro').refine((v) => Number(v) >= 1, 'O valor deve ser no mínimo 1')`
    (mesmo padrão de `characteristicFormSchema.level`); `typeId: z.string().min(1,
    'Selecione o tipo')`; `propertyId: z.string().min(1, 'Selecione a propriedade')`.
  - `ImprovementDefectFormData`, resolver e `improvementDefectFormDefaultValues` (`{
    value: '', typeId: '', propertyId: '' }`) exportados no mesmo padrão dos demais
    schemas do projeto.

- Componente: `ImprovementDefectCard` (novo) —
  `shared/components/ImprovementDefectCard/index.tsx`.
  - Props: `item: IImprovementDefectItem`, `onRemove?: () => void`.
  - Layout definido (formato final, consistente com `EntityReferenceCard`/
    `APP_CONTAINER_STYLES.detailInfoField`): container `flex items-center gap-3 px-3
    py-2` com o estilo `detailInfoField`; conteúdo à esquerda em duas linhas de
    `DefaultText` — primeira linha `Valor: {item.value}`, segunda linha
    `{item.type.name} · {item.property.name}` (separador " · "); à direita, quando
    `onRemove` for passado, um único `IconButton` (`FiTrash2`, `aria-label` do tipo
    `Remover item de valor ${item.value}`) — **sem ação de "visualizar"**, diferente de
    `EntityReferenceCard`, já que o item não é uma entidade navegável. Usado tanto nos
    quadros do formulário (com `onRemove`) quanto nos quadros do modal de visualização
    (sem `onRemove`, somente leitura).

- Componente: `ImprovementDefectAddModal` (novo, reutilizado entre Melhoria e Defeito e
  entre as 3 páginas de entidade) —
  `shared/components/ImprovementDefectAddModal/index.tsx`.
  - Props: `open: boolean`, `onClose: () => void`, `category: 'improvement' |
    'flaw'`, `onAdd: (item: IImprovementDefectItem) => void`.
  - Comportamento esperado: modal (`FormModal`, `size="default"`) cujo título e label
    do botão variam conforme `category` ("Adicionar Melhoria"/"Adicionar Defeito").
    Formulário próprio com `react-hook-form` + `improvementDefectFormResolver`: campo
    "Valor" (`FormTextInput`, `type="number"`, `slotProps={{ htmlInput: { min: 1, step:
    1, inputMode: 'numeric' } }}`, mesmo padrão do campo "Level"), campo "Tipo"
    (`FormAutocompleteInput` alimentado por `useImprovementDefectTypesQuery`), campo
    "Propriedade" (`FormAutocompleteInput` alimentado por
    `useImprovementDefectPropertiesQuery`, com as opções filtradas pelo `typeId`
    atualmente selecionado no formulário — usar `watch('typeId')`; ver nota sobre a
    fonte do vínculo Tipo→Propriedade na interface `IImprovementDefectProperty`
    acima). Ao mudar `typeId`, limpar `propertyId` (`setValue('propertyId', '')`) para
    evitar manter uma propriedade que não pertence mais ao tipo selecionado. Um
    `useEffect` dependente de `open` reseta o formulário
    (`reset(improvementDefectFormDefaultValues)`) toda vez que o modal é reaberto
    (mesmo mecanismo de `EntityReferenceSelectionModal` ao resetar aba/filtro/página em
    `open`). Botão "Adicionar" (`type="submit"`) monta o `IImprovementDefectItem` a
    partir do valor digitado e dos objetos completos de tipo/propriedade selecionados
    (resolvidos a partir das listas dos dois hooks pelo id) e chama `onAdd(item)` — a
    decisão de fechar o modal ou mantê-lo aberto (para permitir corrigir e tentar
    de novo em caso de duplicidade) cabe ao componente pai (`ImprovementDefectListField`
    abaixo), não a este modal.

- Componente: `ImprovementDefectListField` (novo) — o "quadro" usado 2x por formulário
  (uma vez para "Melhorias", outra para "Defeitos") —
  `shared/components/ImprovementDefectListField/index.tsx`.
  - Props: `label: string` ("Melhorias"/"Defeitos"), `addButtonLabel: string`
    ("Adicionar Melhoria"/"Adicionar Defeito"), `category: 'improvement' | 'flaw'`
    (repassado ao `ImprovementDefectAddModal`), `value: IImprovementDefectItem[]`,
    `onChange: (value: IImprovementDefectItem[]) => void`, `otherListValue:
    IImprovementDefectItem[]` (lista oposta — `flaws` quando este campo é "Melhorias" e
    vice-versa — para a regra de exclusividade entre as duas listas).
  - Comportamento esperado: título do quadro + `SecondaryButton` que abre o
    `ImprovementDefectAddModal` (estado local `isModalOpen`, mesmo padrão de
    `EntityReferenceListField`). No `onAdd` do modal, validar antes de adicionar
    (comparando `type.id` + `property.id`; mensagens de erro em pt-BR via `showToast`,
    sem fechar o modal em caso de violação, para permitir corrigir Tipo/Propriedade e
    tentar novamente):
    - duplicidade na mesma lista: já existe item em `value` com o mesmo par
      `type.id`/`property.id` → "Esta combinação de tipo e propriedade já foi
      adicionada a esta lista.";
    - presença simultânea nas duas listas: já existe item em `otherListValue` com o
      mesmo par `type.id`/`property.id` → "Esta combinação de tipo e propriedade já
      está presente na outra lista e não pode ser adicionada aqui.".
    Se válido, adiciona a `value` via `onChange` (ordem de inserção preservada,
    `[...value, item]`) e fecha o modal (`setIsModalOpen(false)`) — diferente do
    `EntityReferenceSelectionModal` (que é um buscador e permanece aberto para
    selecionar múltiplos itens em sequência), aqui o modal é um formulário de
    criação de um único item por vez, então fechar após sucesso é o comportamento
    padrão de "criar e fechar" já usado nos demais modais de criação do projeto.
    Abaixo do botão, lista os itens de `value` (na ordem em que estão no array) usando
    `ImprovementDefectCard` com `onRemove` removendo o item localmente do array (sem
    chamada à API, mesmo padrão de `EntityReferenceListField`/`OrganizationMemberField`
    — a remoção fica sujeita à confirmação de salvamento do formulário como um todo).
    Mensagem "Nenhum item adicionado." quando `value` estiver vazio (mesmo texto usado
    em `EntityReferenceListField`).

#### Funcionalidade

- Páginas/rotas alteradas (nenhuma rota nova; alterações dentro de componentes já
  existentes):
  - `app/(authorized)/caracteristicas` — `CharacteristicCreateForm`,
    `CharacteristicView`.
  - `app/(authorized)/talentos` — `TalentCreateForm`, `TalentView`.
  - `app/(authorized)/treinamentos` — `TrainingCreateForm`, `TrainingView`.

- Em cada `*CreateForm`: adicionar, logo abaixo do `FormRichTextInput` de Descrição e
  **acima** do quadro "Habilidades Adicionais" (`EntityReferenceListField`), um novo
  grid de 2 colunas (`grid grid-cols-1 sm:grid-cols-2`, mesmo padrão do grid já usado
  para "Aprimorado de"/"Requisitos") com dois `ImprovementDefectListField`:
  - "Melhorias" (`category="improvement"`, `value=improvements`,
    `onChange=setImprovements`, `otherListValue=flaws`).
  - "Defeitos" (`category="flaw"`, `value=flaws`, `onChange=setFlaws`,
    `otherListValue=improvements`).
  O estado de `improvements`/`flaws` fica em `useState<IImprovementDefectItem[]>` local
  no `*CreateForm` (fora do `react-hook-form`/zod, mesmo padrão de `improvedFrom`/
  `requirements`/`additionalAbilities`): inicializado a partir de
  `<entidade>Detail.improvements`/`.flaws` em modo edição, resetado para `[]` em modo
  criação e após submit com sucesso (mesmos `useEffect`/`onSuccess` já existentes,
  apenas incluindo os dois novos `setImprovements([])`/`setFlaws([])`). No
  `buildPayload`, converter os dois arrays locais para o formato de escrita que a API
  espera — **conferir `task-api.md` antes de implementar**; assumir por ora, com base
  no spec (nomenclatura confirmada `improvements`/`flaws`, item com `value`/`type`/
  `property`), um payload por item como `{ value: number, type: string /* id */,
  property: string /* id */ }` (`type`/`property` carregando o id, análogo a como
  `keyAttributeId` é enviado como id simples em `Skill`) — ajustar para `typeId`/
  `propertyId` ou outro formato se for isso que `task-api.md` definir.

- Em cada `*View`: adicionar um novo bloco (`APP_CONTAINER_STYLES.detailSectionBox` x2
  dentro de um grid `grid grid-cols-1 sm:grid-cols-2`, mesmo padrão visual do bloco
  "Aprimorado de"/"Requisitos") logo abaixo do quadro "Descrição" e **acima** do quadro
  "Habilidades Adicionais", com os títulos "Melhorias" e "Defeitos" (ícone de
  `react-icons/fi` a escolher pelo `web-dev`, consistente com os já usados no cabeçalho
  dos demais quadros — ex. `FiArrowUpCircle`/`FiArrowDownCircle` ou equivalente
  disponível no pacote), exibindo os itens de `<entidade>.improvements`/`.flaws` como
  cards via `ImprovementDefectCard` (sem `onRemove` — somente leitura), com mensagem
  "Nenhum item adicionado." quando a lista estiver vazia (mesmo padrão dos demais
  quadros de `*View`).

- Integrações com API (conferir contrato final em
  `.claude/tasks/melhorias-defeitos/task-api.md` antes de implementar; abaixo, o que é
  assumido a partir do spec):
  - `GET /improvement-defect-types` (URL a confirmar) — alimenta
    `useImprovementDefectTypesQuery`, consumido pelo Autocomplete "Tipo" do
    `ImprovementDefectAddModal`.
  - `GET /improvement-defect-properties` (URL a confirmar; pode aceitar filtro por
    `typeId` conforme o contrato definido em `task-api.md`) — alimenta
    `useImprovementDefectPropertiesQuery`, consumido pelo Autocomplete "Propriedade" do
    `ImprovementDefectAddModal`, com filtro dependente do Tipo selecionado baseado no
    campo de vínculo retornado pela API (não hardcodar nomes de tipo/propriedade no
    frontend para decidir o filtro).
  - `GET /characteristics/:id`, `/talents/:id`, `/trainings/:id` — passam a retornar
    `improvements` e `flaws` como arrays de `{ value, type: { id, name }, property: {
    id, name, ... } }` (formato assumido — confirmar DTO de resposta em
    `task-api.md`); consumidos por `*CreateForm` (modo edição) e por `*View`.
  - `POST`/`PUT /characteristics`, `/talents`, `/trainings` — payload passa a aceitar
    `improvements` e `flaws` (formato de escrita a confirmar em `task-api.md`; assumido
    como array de `{ value, type, property }` por item, com `type`/`property`
    carregando o id).

- Formulário/validação:
  - Modal `ImprovementDefectAddModal`: formulário próprio (`react-hook-form` +
    `improvementDefectFormSchema`), fora do `react-hook-form` principal de cada
    `*CreateForm` (mesmo racional de isolamento já usado para o modal de seleção de
    "Aprimorado de"/"Requisitos"). Campos: Valor (obrigatório, inteiro, mínimo 1, sem
    máximo), Tipo (obrigatório, Autocomplete), Propriedade (obrigatório, Autocomplete,
    opções filtradas pelo Tipo selecionado).
  - Regras de negócio de duplicidade/exclusividade entre listas validadas no cliente
    dentro de `ImprovementDefectListField` no momento do "adicionar" (após o
    `ImprovementDefectAddModal` já ter validado obrigatoriedade/mínimo dos campos),
    com feedback via `showToast` em pt-BR, sem chamada à API nesse momento.
  - `improvements`/`flaws` permanecem fora do zod de cada `*FormSchema`
    (`characteristicFormSchema`/`talentFormSchema`/`trainingFormSchema` — nenhuma
    alteração nesses arquivos), geridos como estado local nos `*CreateForm`.
  - Erros retornados pela API na submissão do formulário (validação server-side das
    mesmas regras — ex. `409`/`400`, incluindo a validação de compatibilidade Tipo↔
    Propriedade) exibidos via `showToast`, reaproveitando o padrão já usado nos
    `onError` de `usePostEntity`/`usePutEntity` de cada `*CreateForm`
    (`error.response?.data?.message ?? '<mensagem padrão em pt-BR>'`).

- Acesso Google: ocultar criar/editar/excluir (padrão). Assim como "Aprimorado de"/
  "Requisitos"/"Habilidades Adicionais", os dois novos quadros de "Melhorias"/
  "Defeitos" (com ações de adicionar/remover) só existem dentro do formulário de
  criação/edição de cada entidade — como o botão "Novo" e a ação "Editar" já são
  ocultados para `provider: 'google'` (`useIsGoogleUser`) nas 3 páginas, esses quadros
  já ficam inacessíveis a esses usuários sem nenhuma mudança adicional de permissão. A
  exibição somente leitura de "Melhorias"/"Defeitos" no modal de visualização permanece
  visível a todos os usuários, sem alteração de permissão.

### 2. web-dev-codereviewer
- Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados. Verificação detalhada por
ponto de atenção solicitado:

- **Filtro dependente Tipo → Propriedade sem hardcode**: confirmado — nenhuma ocorrência
  de nomes de tipo/propriedade ("Ataque", "Teste de Resistência", "Ataque
  Corpo-a-Corpo", "Força", "Destreza", "Constituição", "Inteligência", "Sabedoria",
  "Carisma") em nenhum arquivo de `app-web/src`. O filtro em
  `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx` usa exclusivamente
  o campo `typeId` retornado pela API (`property.typeId === selectedTypeId`), consumido
  via `useImprovementDefectPropertiesQuery`/`useImprovementDefectTypesQuery`
  (`app-web/src/hooks/Queries/EntityQueries/useImprovementDefect{Types,Properties}Query/index.ts`),
  que seguem fielmente o padrão de `useAttributesQuery`. Ao trocar `typeId`, `propertyId`
  é limpo via `setValue('propertyId', '')`.
- **Bloqueio de duplicidade na mesma lista e exclusividade entre listas**: confirmado em
  `app-web/src/shared/components/ImprovementDefectListField/index.tsx`
  (`handleAdd`/`isSameCombination` comparando `type.id`+`property.id`), com as duas
  mensagens em pt-BR exatas do spec ("Esta combinação de tipo e propriedade já foi
  adicionada a esta lista." / "...já está presente na outra lista e não pode ser
  adicionada aqui.") via `showToast({ type: 'error' })`, sem fechar o modal em caso de
  violação (só fecha em `onChange([...value, item]); setIsModalOpen(false);` no caminho
  de sucesso).
- **Validação do campo Valor**: `app-web/src/shared/formSchemas/ImprovementDefectFormSchema/index.ts`
  segue exatamente o padrão de `CharacteristicFormSchema.level`
  (`.refine(/^\d+$/)` + `.refine(Number >= 1)`, sem máximo) e `typeId`/`propertyId`
  obrigatórios via `.min(1, ...)`. O campo "Valor" no modal usa `type="number"` com
  `slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}`, mesmo padrão do
  campo "Level".
- **Posicionamento**: confirmado nos 3 pares `*CreateForm`/`*View`
  (`caracteristicas`, `talentos`, `treinamentos`) — no formulário, o grid
  `ImprovementDefectListField` (Melhorias/Defeitos) fica logo após o
  `FormRichTextInput` de Descrição e antes do `EntityReferenceListField` de "Habilidades
  Adicionais"; na view, o bloco `detailSectionBox` de Melhorias/Defeitos fica logo após o
  bloco "Descrição" e antes do bloco "Habilidades Adicionais", replicando exatamente o
  padrão visual (grid 2 colunas) já usado para "Aprimorado de"/"Requisitos".
- **Ordem de inserção**: preservada — `ImprovementDefectListField.handleAdd` usa
  `[...value, item]` (append no fim, nunca reordena), e a leitura em modo edição apenas
  atribui os arrays vindos da API (`setImprovements(characteristicDetail.improvements ?? [])`
  etc.) sem reordenar; a ordenação em si (`sortOrder ASC`) já foi confirmada no lado
  backend na revisão de `task-api.md`.
- **Modal de adição reutilizado e resetado ao reabrir**: um único
  `app-web/src/shared/components/ImprovementDefectAddModal/index.tsx` é usado nas 6
  ocorrências (Melhorias/Defeitos × Característica/Talento/Treinamento), parametrizado
  por `category: 'improvement' | 'flaw'` (título e chamador variam por esse parâmetro).
  `useEffect` dependente de `open` chama `reset(improvementDefectFormDefaultValues)` a
  cada reabertura, mesmo mecanismo documentado para
  `EntityReferenceSelectionModal`.
- **Reaproveitamento de primitivos e pt-BR**: `FormModal`, `FormTextInput`,
  `FormAutocompleteInput`, `PrimaryButton`, `SecondaryButton`, `DefaultText`, `Label`,
  `IconButton`+`Tooltip` do MUI e `APP_CONTAINER_STYLES.detailInfoField`/
  `detailSectionBox` (constantes já existentes) são reaproveitados sem recriação de UI
  equivalente; nenhum componente novo além dos 3 explicitamente planejados
  (`ImprovementDefectCard`, `ImprovementDefectAddModal`, `ImprovementDefectListField`).
  Ícone usado é `FiTrash2` (remover) e `FiArrowUpCircle`/`FiArrowDownCircle` (cabeçalhos
  de Melhorias/Defeitos na view), todos de `react-icons/fi`, consistente com o resto do
  projeto — nenhum `@mui/icons-material`, SVG customizado ou emoji encontrado nos
  arquivos revisados. O `IconButton` de remoção tem `aria-label` em pt-BR
  (`` `Remover item de valor ${item.value}` ``).
- **Tipagem/erros de código**: interfaces (`IImprovementDefectType`,
  `IImprovementDefectProperty`, `IImprovementDefectItem`) batem com o formato de leitura
  confirmado em `task-api.md` (`type`/`property` como objetos completos, `typeId` em
  `IImprovementDefectProperty`); reexports em `shared/interfaces/Entities/index.ts`,
  `hooks/Queries/EntityQueries/index.ts` e `shared/formSchemas/index.ts` presentes e
  corretos; nenhum `any`, nenhum import quebrado ou não utilizado, nenhum hook usado
  condicionalmente/fora das regras do React nos arquivos revisados. `buildPayload` dos 3
  `*CreateForm` converte `improvements`/`flaws` para `{ value, type: item.type.id,
  property: item.property.id }`, batendo com o contrato de escrita confirmado em
  `task-api.md`.
- **Formulário/React Query**: `ImprovementDefectAddModal` usa `react-hook-form` + zod
  (não Yup) isolado do formulário principal de cada `*CreateForm`, mesmo racional já
  usado para o modal de seleção de referências. `improvements`/`flaws` permanecem fora
  do zod de `characteristicFormSchema`/`talentFormSchema`/`trainingFormSchema` (nenhuma
  alteração nesses arquivos), geridos como estado local, replicando literalmente o
  padrão já usado para `improvedFrom`/`requirements`/`additionalAbilities`
  (inicialização em modo edição, reset para `[]` em modo criação e após submit com
  sucesso). Os hooks `useImprovementDefectTypesQuery`/`useImprovementDefectPropertiesQuery`
  seguem `hooks/Queries` genéricos (`useQuery` no padrão de tabela auxiliar de seed, sem
  bespoke), e `usePostEntity`/`usePutEntity` com `invalidateQueryKeys: [['/characteristics']]`
  (e equivalentes) inalterados e corretos. Estado de loading/erro do carregamento do
  registro em modo edição já tratado (`CircularProgress` + `showToast` em `onError`),
  sem alteração necessária para os dois novos quadros.
- **Acesso Google**: nenhuma alteração necessária ou feita — os quadros de
  Melhorias/Defeitos só existem dentro do formulário de criação/edição, já inacessível a
  usuários `provider: 'google'` porque o botão "Novo"/ação "Editar" das 3 páginas
  (`caracteristicas`, `talentos`, `treinamentos`) já são ocultados via `useIsGoogleUser`
  fora do escopo desta etapa; a exibição somente leitura na view permanece visível a
  todos, sem alteração de permissão — confirmado que nenhum dos arquivos alterados desta
  etapa mexeu nessa lógica.
- **Seção de filtros**: não aplicável — esta demanda não adiciona nenhum campo de
  filtro/busca de listagem, apenas os quadros de Melhorias/Defeitos dentro do
  formulário/view de detalhe.

Arquivos revisados: `app-web/src/shared/interfaces/Entities/{ImprovementDefectType,
ImprovementDefectProperty,ImprovementDefectItem}/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/interfaces/Entities/{Talent,Training,Characteristic}/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useImprovementDefect{Types,Properties}Query/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/index.ts`,
`app-web/src/shared/formSchemas/ImprovementDefectFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/shared/components/ImprovementDefectCard/index.tsx`,
`app-web/src/shared/components/ImprovementDefectAddModal/index.tsx`,
`app-web/src/shared/components/ImprovementDefectListField/index.tsx`,
`app-web/src/app/(authorized)/{caracteristicas,talentos,treinamentos}/components/
{Characteristic,Talent,Training}{CreateForm,View}/index.tsx`.
