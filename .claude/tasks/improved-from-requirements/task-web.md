# Task Web: Aprimorado de / Requisitos (Treinamentos, Talentos, Técnicas, Magias)

## Contexto
Ver .claude/tasks/improved-from-requirements/spec.md

Nota: este plano depende do contrato de API definido em
`.claude/tasks/improved-from-requirements/task-api.md`. Se esse arquivo ainda não
existir (ou não tiver sido lido) no momento da implementação, o `web-dev` deve lê-lo
antes de integrar — os endpoints/formatos abaixo são assumidos com base no spec
(seção "Requisitos para a etapa de planejamento do backend") e podem precisar de
ajuste fino (nomes exatos de campos do payload de escrita) conforme o que a etapa de
API efetivamente decidiu.

Investigação de código já feita (referências de padrão a seguir):
- `app-web/src/store/EntityMentionViewStore/index.ts` +
  `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` — mecanismo
  já existente de abertura de view por `entityType` (já registrado para `training`,
  `talent`, `technique`, `spell`, entre outros). O dispatcher já está montado
  globalmente em `app/(authorized)/layout.tsx` — basta chamar
  `useEntityMentionViewStore().openEntityView(entityType, id)` em qualquer lugar; não
  criar nenhum mecanismo novo de abertura de view.
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationMemberCard` e
  `OrganizationMemberField`, e `app-web/src/app/(authorized)/locais/components/
  LocationPointOfInterestCard` e `LocationPointsOfInterestField` — padrão já
  estabelecido para "quadro com lista de referências a outra entidade, card com
  visualizar/remover, adicionado via busca": nesses casos o estado da lista fica em
  `useState` local no `*CreateForm` (fora do `react-hook-form`/zod), inicializado a
  partir do detalhe em modo edição e convertido para o formato de payload apenas no
  submit (`buildPayload`). Mesmo padrão a seguir aqui para `improvedFrom`/
  `requirements`.
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationView` — padrão
  visual dos quadros na tela de visualização (`APP_CONTAINER_STYLES.detailSectionBox`
  / `detailSectionBoxHeader`, ícone + label no cabeçalho, mensagem vazia quando lista
  vazia).
- `app-web/src/app/(authorized)/pericias/components/SkillSectionsField` (e
  equivalentes em condições/regras/locais/campanhas) — é o recurso de "seções" citado
  no pedido original; **não existe hoje em Treinamentos/Talentos/Técnicas/Magias e não
  deve ser criado** (confirmado no spec). Serviu apenas de referência de
  posicionamento visual (quadros lado a lado abaixo dos campos do formulário).
- `app-web/src/app/(authorized)/treinamentos/**` (`TrainingCreateForm`, `TrainingView`,
  `TrainingsList`, `TrainingsListItem`, `TrainingsFilterSection`) e os equivalentes em
  `talentos`, `tecnicas`, `magias` — estrutura de CRUD já existente das 4 entidades
  alvo, com `ITraining`/`ITalent`/`ITechnique`/`ISpell` (+ `*ListItem`, `*ListFilters`)
  em `shared/interfaces/Entities/*` e `trainingFormSchema`/`talentFormSchema`/
  `techniqueFormSchema`/`spellFormSchema` em `shared/formSchemas/*` (cobrindo hoje
  apenas `name`, `description`, `tagIds`).
- `shared/interfaces/Entities/SearchResult` (`{ id, name, entityType }`) — formato já
  usado no endpoint global `/search`; mesmo shape a reaproveitar para o novo tipo
  `IEntityReference` que representa cada item de `improvedFrom`/`requirements`.
- `hooks/Queries` (`useGetEntityList`, `useGetEntityById`, `usePostEntity`,
  `usePutEntity`, `useDeleteEntity`) — hooks genéricos já usados pelas 4 páginas para
  `/trainings`, `/talents`, `/techniques`, `/spells` com filtro `name`/`page`/`perPage`;
  reaproveitar exatamente esses mesmos endpoints/hooks para alimentar as abas do modal
  de seleção (não usar `/search`, que é limitado a 10 resultados sem paginação — fora
  de escopo conforme o spec).

## Etapas

### 1. web-dev
Status: concluído

Decisão do ponto em aberto (linhas 140-146): o modal de seleção
(`EntityReferenceSelectionModal`) permanece aberto após um "adicionar" bem-sucedido,
permitindo adicionar múltiplos itens em sequência; o usuário fecha explicitamente pelo
botão de fechar do `FormModal`.

Contrato de API confirmado na fonte (`app-api/src/modules/entity-links/dto/`,
`app-api/src/modules/trainings/dto/create-training.dto.ts` e
`training-response.dto.ts`): payload de escrita é `improvedFrom`/`requirements` como
array de `{ entityType, id }`; resposta de detalhe traz `improvedFrom`/`requirements`
como array de `{ id, name, entityType }` (minúsculo) — exatamente como assumido no
plano, sem ajuste necessário.

Componentes:
- `app-web/src/shared/components/EntityReferenceCard/index.tsx` (novo, genérico)
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` (novo, genérico)
- `app-web/src/shared/components/EntityReferenceListField/index.tsx` (novo, genérico)

Arquivos:
- `app-web/src/shared/interfaces/Entities/EntityReference/index.ts` (novo:
  `IEntityReference`)
- `app-web/src/shared/interfaces/Entities/index.ts` (barrel, reexporta
  `EntityReference`)
- `app-web/src/shared/interfaces/Entities/Training/index.ts`,
  `Talent/index.ts`, `Technique/index.ts`, `Spell/index.ts` (interfaces de detalhe
  ganham `improvedFrom`/`requirements: IEntityReference[]`)
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
- `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellView/index.tsx`

Nenhuma rota nova, nenhum schema zod alterado (conforme planejado — `improvedFrom`/
`requirements` ficam fora do react-hook-form, como estado local `useState`).

#### Componentes

- Componente: `IEntityReference` (novo tipo, não é componente visual) —
  `shared/interfaces` (ex.: `Entities/EntityReference`).
  - Formato: `{ id: string; name: string; entityType: string }` (mesmo shape de
    `ISearchResult`; `entityType` sempre em minúsculo — `training`/`talent`/
    `technique`/`spell`, conforme convenção do `EntityMentionViewDispatcher`).
  - Uso: tipar os arrays `improvedFrom`/`requirements` tanto na leitura (retorno dos
    endpoints de detalhe) quanto no estado local dos formulários.
  - Estender `ITraining`, `ITalent`, `ITechnique`, `ISpell` (interfaces de detalhe,
    não as `*ListItem`) com `improvedFrom: IEntityReference[]` e
    `requirements: IEntityReference[]`.

- Componente: `EntityReferenceCard` (novo) — `shared/components/EntityReferenceCard`.
  - Props: `reference: IEntityReference`, `onRemove?: () => void`.
  - Comportamento esperado: exibe o nome do item, uma ação "visualizar" que chama
    `openEntityView(reference.entityType, reference.id)` (`useEntityMentionViewStore`
    já existente — o dispatcher já resolve qual view abrir conforme o `entityType`,
    seja treinamento, talento, técnica ou magia) e, apenas quando `onRemove` for
    passado, uma ação "remover". Reaproveitar visual de `LocationPointOfInterestCard`/
    `OrganizationMemberCard` (`APP_CONTAINER_STYLES.detailInfoField`). Usado tanto nos
    quadros do formulário (com `onRemove`) quanto nos quadros do modal de visualização
    (sem `onRemove`, somente leitura).

- Componente: `EntityReferenceSelectionModal` (novo) — reutilizável entre "Aprimorado
  de" e "Requisitos" e entre as 4 páginas de entidade —
  `shared/components/EntityReferenceSelectionModal`.
  - Props: `open: boolean`, `onClose: () => void`, `title: string`,
    `excludeReferences: { entityType: string; id: string }[]` (itens a ocultar da
    listagem — a lista atual do quadro que abriu o modal), `onSelect: (reference:
    IEntityReference) => void`.
  - Comportamento esperado: modal (reaproveitar `FormModal`, `size="wide"`) com 4 abas
    MUI `Tabs` — "Treinamentos" (`training` → `GET /trainings`), "Talentos" (`talent`
    → `GET /talents`), "Técnicas" (`technique` → `GET /techniques`), "Magias"
    (`spell` → `GET /spells`). Abaixo das abas, um campo de filtro por nome (reset de
    página ao trocar de aba ou de filtro). Abaixo do filtro, listagem paginada da
    entidade da aba ativa usando `useGetEntityList<XListItem, XListFilters>` com
    `filters: { name, page, perPage }` — mesmos hooks/endpoints já usados pelas
    páginas de listagem de cada entidade (uma chamada por aba selecionada, conforme
    spec). Da lista retornada, ocultar client-side os itens cujo `id` conste em
    `excludeReferences` para o `entityType` da aba ativa (nota de implementação: como
    não há parâmetro de exclusão no endpoint e não é escopo criar um, uma página pode
    exibir menos itens que o tamanho padrão de página quando itens dela forem
    ocultados — aceitável). Cada linha da listagem mostra o nome do item e duas ações:
    "visualizar" (`openEntityView(entityType-da-aba, item.id)`) e "adicionar"
    (`onSelect({ id: item.id, name: item.name, entityType: entityType-da-aba })`).

- Componente: `EntityReferenceListField` (novo) — o "quadro" usado 2x por formulário
  (uma vez para "Aprimorado de", outra para "Requisitos") —
  `shared/components/EntityReferenceListField`.
  - Props: `label: string`, `addButtonLabel: string`, `value: IEntityReference[]`,
    `onChange: (value: IEntityReference[]) => void`, `otherListValue:
    IEntityReference[]` (valor atual da lista oposta, para a regra de exclusividade),
    `currentEntityType: string`, `currentEntityId?: string` (ausente/`undefined` em
    modo criação, já que o registro ainda não existe).
  - Comportamento esperado: título do quadro + botão ("Adicionar Aprimorado de" /
    "Adicionar Requisitos") que abre o `EntityReferenceSelectionModal` passando
    `excludeReferences = value`. No `onSelect` do modal, validar localmente antes de
    adicionar (mensagens de erro em pt-BR via `showToast`, sem adicionar em caso de
    violação):
    - autorreferência: `reference.entityType === currentEntityType && reference.id ===
      currentEntityId`;
    - duplicidade na mesma lista: `reference` já presente em `value` (reforço — o
      modal já deveria ter ocultado, mas a validação evita inconsistência);
    - presença simultânea nas duas listas: `reference` já presente em
      `otherListValue`.
    Se válido, adiciona a `value` via `onChange`. Abaixo do botão, lista os itens de
    `value` usando `EntityReferenceCard` com `onRemove` removendo o item localmente do
    array (sem chamada à API — a remoção fica sujeita à confirmação de salvamento do
    formulário como um todo, mesmo padrão já usado para os demais campos de lista do
    projeto, ex. `OrganizationMemberField`).

  Nota: o campo de filtro por nome do modal de seleção vive dentro do próprio
  `EntityReferenceSelectionModal` (componente reutilizável entre as 4 páginas), não
  dentro de `page.tsx` de nenhuma entidade — por isso não se aplica aqui o padrão de
  criar um `<Entidade>sFilterSection` por página; o filtro é uma peça interna do modal
  compartilhado, não da listagem principal de cada entidade.

  Ponto em aberto não fechado pelo spec (sinalizado, não decidido aqui): se o modal de
  seleção deve fechar automaticamente após um "adicionar" bem-sucedido ou permanecer
  aberto para permitir adicionar múltiplos itens em sequência antes de fechar. Ambas
  as leituras são compatíveis com o texto do spec; adotar o comportamento que exigir
  menos cliques (permanecer aberto até o usuário fechar explicitamente) é uma escolha
  de implementação razoável, mas o `web-dev` deve estar ciente de que não é um
  requisito fechado.

#### Funcionalidade

- Páginas/rotas alteradas (nenhuma rota nova; alterações dentro de componentes já
  existentes):
  - `app/(authorized)/treinamentos` — `TrainingCreateForm`, `TrainingView`.
  - `app/(authorized)/talentos` — `TalentCreateForm`, `TalentView`.
  - `app/(authorized)/tecnicas` — `TechniqueCreateForm`, `TechniqueView`.
  - `app/(authorized)/magias` — `SpellCreateForm`, `SpellView`.

- Em cada `*CreateForm`: adicionar, abaixo dos campos já existentes (nome/tags/
  descrição), dois quadros lado a lado (`grid grid-cols-1 sm:grid-cols-2`) usando
  `EntityReferenceListField` — um para "Aprimorado de" (`improvedFrom`) e outro para
  "Requisitos" (`requirements`) — **sem introduzir qualquer recurso de "seções"**
  (confirmado fora de escopo no spec). O estado de `improvedFrom`/`requirements` fica
  em `useState<IEntityReference[]>` local no `*CreateForm` (fora do `react-hook-form`/
  zod — o schema de cada entidade continua cobrindo apenas `name`/`description`/
  `tagIds`, sem alteração), inicializado a partir de
  `trainingDetail.improvedFrom`/`.requirements` (e equivalentes) em modo edição, e
  resetado para `[]` em modo criação/após submit com sucesso — mesmo padrão de
  `OrganizationCreateForm`/`members` e `LocationPointsOfInterestField`. `currentEntityId`
  passado ao `EntityReferenceListField` é `selectedTraining?.id` (indefinido em modo
  criação) e `currentEntityType` é o literal fixo da página (`'training'`/`'talent'`/
  `'technique'`/`'spell'`). No `buildPayload`, converter os dois arrays locais para o
  formato de escrita que a API espera (conferir `task-api.md`; assumir por ora, com
  base no spec, um array por campo com itens `{ entityType, id }`).

- Em cada `*View`: adicionar dois novos quadros, "Aprimorado de" e "Requisitos", no
  mesmo padrão visual dos quadros já existentes (`APP_CONTAINER_STYLES.
  detailSectionBox`/`detailSectionBoxHeader`, como o quadro "Membros" de
  `OrganizationView`), exibindo os itens de `training.improvedFrom`/
  `training.requirements` (e equivalentes nas outras 3 entidades) como cards via
  `EntityReferenceCard` (sem `onRemove` — somente leitura), com mensagem
  "Nenhum item adicionado." quando a lista estiver vazia. A ação "visualizar" de cada
  card abre o modal de visualização já existente da entidade referenciada
  (`training`/`talent`/`technique`/`spell`, conforme o `entityType` do item),
  independentemente de qual das 4 entidades o item pertence.

- Integrações com API (conferir contrato final em
  `.claude/tasks/improved-from-requirements/task-api.md` antes de implementar; abaixo,
  o que é assumido a partir do spec):
  - `GET /trainings`, `/talents`, `/techniques`, `/spells` — reaproveitados sem
    alteração (já suportam `name`/`page`/`perPage`) para alimentar as 4 abas do
    `EntityReferenceSelectionModal`.
  - `GET /trainings/:id`, `/talents/:id`, `/techniques/:id`, `/spells/:id` — passam a
    retornar `improvedFrom` e `requirements` como arrays de `{ id, name, entityType }`
    (`entityType` em minúsculo, mesma convenção do dispatcher de views/`/search`);
    consumidos por `*CreateForm` (modo edição) e por `*View`.
  - `POST`/`PUT /trainings`, `/talents`, `/techniques`, `/spells` — payload passa a
    aceitar `improvedFrom` e `requirements` (formato de escrita a confirmar em
    `task-api.md`; assumido como array de `{ entityType, id }` por item, simétrico ao
    formato de leitura).

- Formulário/validação:
  - Nenhum campo novo no zod (`trainingFormSchema`/`talentFormSchema`/
    `techniqueFormSchema`/`spellFormSchema` permanecem inalterados) — `improvedFrom`/
    `requirements` ficam fora do `react-hook-form`, geridos como estado local
    (justificativa: mesmo padrão já usado para campos de lista de referência a outra
    entidade no projeto, ex. `members` em `OrganizationCreateForm`).
  - Regras de negócio (bloqueio de autorreferência, duplicidade na mesma lista,
    presença simultânea nas duas listas) validadas no cliente dentro de
    `EntityReferenceListField` no momento do "adicionar", com feedback via `showToast`
    em pt-BR, sem chamada à API nesse momento.
  - Erros retornados pela API na submissão do formulário (validação server-side das
    mesmas regras, ex. `409`/`400`) exibidos via `showToast` reaproveitando o padrão já
    usado nos `onError` de `usePostEntity`/`usePutEntity` de cada `*CreateForm`
    (`error.response?.data?.message ?? '<mensagem padrão em pt-BR>'`).

- Acesso Google: ocultar criar/editar/excluir (padrão). Nas 4 páginas, o botão "Novo" e
  a ação "Editar" já são ocultados para `provider: 'google'` (`useIsGoogleUser`) — como
  os dois novos quadros de "Aprimorado de"/"Requisitos" (com ações de adicionar/
  remover) só existem dentro do formulário de criação/edição, eles já ficam
  inacessíveis a esses usuários sem nenhuma mudança adicional de permissão. A ação
  "visualizar" (inclusive dos cards dentro dos quadros de "Aprimorado de"/
  "Requisitos" na tela de visualização) permanece visível a todos os usuários, sem
  alteração de permissão — consistente com "nenhuma regra de visibilidade adicional"
  confirmada no spec.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/interfaces/Entities/EntityReference/index.ts`
- `app-web/src/shared/interfaces/Entities/index.ts`
- `app-web/src/shared/interfaces/Entities/Training/index.ts`
- `app-web/src/shared/interfaces/Entities/Talent/index.ts`
- `app-web/src/shared/interfaces/Entities/Technique/index.ts`
- `app-web/src/shared/interfaces/Entities/Spell/index.ts`
- `app-web/src/shared/components/EntityReferenceCard/index.tsx`
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`
- `app-web/src/shared/components/EntityReferenceListField/index.tsx`
- `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
- `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
- `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
- `app-web/src/app/(authorized)/magias/components/SpellView/index.tsx`

Pontos verificados especificamente por esta demanda, todos conformes:

- **Validações locais (autorreferência, duplicidade, exclusividade)**: implementadas em
  `EntityReferenceListField.handleSelect` na ordem correta (autorreferência →
  duplicidade na mesma lista → presença na lista oposta), cada uma com early return e
  mensagem em pt-BR via `showToast` antes de qualquer `onChange`. `currentEntityId`
  vem de `selectedTraining?.id`/`selectedTalent?.id`/`selectedTechnique?.id`/
  `selectedSpell?.id` (indefinido em modo criação, evitando falso positivo de
  autorreferência), e `currentEntityType` é o literal fixo correto em cada uma das 4
  páginas.
- **Reúso do mecanismo de view**: tanto `EntityReferenceCard` quanto
  `EntityReferenceSelectionModal` chamam exclusivamente
  `useEntityMentionViewStore().openEntityView(entityType, id)` — o mesmo
  `EntityMentionViewDispatcher` já montado em `app/(authorized)/layout.tsx`, que já
  tem entradas registradas para `training`/`talent`/`technique`/`spell`. Nenhum modal
  de visualização novo foi criado.
- **Hooks/endpoints reaproveitados**: `EntityReferenceSelectionModal` usa
  `useGetEntityList` apontando para `/trainings`, `/talents`, `/techniques`, `/spells`
  (os mesmos endpoints das páginas de listagem) com `filters: { name, page, perPage }`
  e reset de página ao trocar de aba/filtro; nenhuma referência a `/search`.
- **Seções**: nenhum componente ou lógica de "seções configuráveis" foi introduzido;
  os dois quadros ficam lado a lado via grid simples, sem replicar
  `SkillSectionsField` ou equivalente.
- **Modal permanece aberto após adicionar**: `handleSelect` em
  `EntityReferenceListField` nunca chama `setIsModalOpen(false)`; o fechamento só
  ocorre pelo botão de fechar do `FormModal` (`onClose`), conforme decisão registrada
  na etapa 1.
- **Reset de estado entre criação/edição/pós-submit**: em cada `*CreateForm`, o
  `useEffect` com dependências `[isEditMode, <entidade>Detail, reset]` zera
  `improvedFrom`/`requirements` para `[]` quando `isEditMode` é falso e os
  inicializa a partir do detalhe carregado quando verdadeiro; o `onSuccess` do
  `usePostEntity` também zera os dois arrays após cadastro bem-sucedido. Como o
  `FormModal` (via `Dialog` do MUI, sem `keepMounted`) desmonta o `*CreateForm` ao
  fechar, cada abertura subsequente também parte de estado limpo — não há caminho
  identificado em que `improvedFrom`/`requirements` de um registro vazem para outro.
- **Contrato de API**: conferido contra `app-api/src/modules/entity-links/dto/
  entity-reference-{input,response}.dto.ts` e `app-api/src/modules/trainings/dto/
  {create,update,training-response}.dto.ts` — payload de escrita
  (`{ entityType, id }`) e formato de leitura (`{ id, name, entityType }`, minúsculo,
  via `ReferenceableEntityType`) batem exatamente com `IEntityReference` e com o
  `buildPayload` de cada `*CreateForm`.
- **Ícones e acessibilidade**: todos de `react-icons/fi` (`FiEye`, `FiTrash2`,
  `FiPlus`, `FiSearch`, `FiTrendingUp`, `FiCheckSquare`); todo `IconButton` sem texto
  visível tem `aria-label` em pt-BR (`Visualizar {nome}`, `Remover {nome}`,
  `Adicionar {nome}`).
- **Acesso Google**: nenhuma página/`ListItem` teve a gate de `useIsGoogleUser`
  alterada; como as ações de adicionar/remover só existem dentro do formulário de
  criação/edição (já bloqueado para usuários Google), a regra permanece coerente sem
  mudança adicional.
