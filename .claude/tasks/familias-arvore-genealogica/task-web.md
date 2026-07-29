# Task Web: Famílias e árvore genealógica

## Contexto
Ver .claude/tasks/familias-arvore-genealogica/spec.md

## Etapas

### 1. web-dev
Status: concluído

> **ATENÇÃO — nova dependência que exige ação manual do usuário**
> Esta task introduz `@xyflow/react` (React Flow), usada para o quadro/árvore
> genealógica interativo. A lib **não** está instalada em `app-web/package.json` e o
> agente `web-dev` **não tem acesso a terminal/Bash** para instalá-la. O `web-dev` deve:
> 1. Adicionar `"@xyflow/react": "^12.3.0"` (ou a versão estável mais recente da linha
>    12.x disponível no momento da implementação) ao objeto `dependencies` de
>    `app-web/package.json`, na mesma ordem alfabética das demais dependências.
> 2. **Não tentar rodar `npm install`** nem qualquer comando de terminal — isso não é
>    possível no ambiente do agente.
> 3. Deixar registrado de forma clara (ex.: no changelog/registro de trabalho da task,
>    ou avisando explicitamente ao final da implementação) que **o usuário precisa
>    rodar `npm install` manualmente dentro de `app-web/`** antes de rodar
>    `npm run dev`/`npm run build`, caso contrário o build falhará por módulo não
>    encontrado.
> 4. Todo componente que importe de `@xyflow/react` deve ser um Client Component
>    (`'use client'` no topo do arquivo) e deve importar o CSS obrigatório da lib,
>    `import '@xyflow/react/dist/style.css';`, no mesmo arquivo onde o `ReactFlow` é
>    renderizado (ver componente `FamilyGenealogyBoard` abaixo) — sem esse import, o
>    quadro renderiza sem nenhum estilo (nós/arestas sobrepostos, sem grid, etc.).

#### Componentes (se necessário)

- Componente: `FamiliesFilterSection`
  - Local: `app-web/src/app/(authorized)/familias/components/FamiliesFilterSection/index.tsx`.
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: mesmo padrão de `OrganizationsFilterSection`/`CharactersFilterSection` — apenas o campo de busca por nome (`DefaultTextInput` com ícone `FiSearch`) e botão "Filtrar" (`PrimaryButton`), sem estado próprio (tudo controlado pela página).

- Componente: `FamilyGenealogyBoard` (novo componente **genérico**, em `shared/components/`)
  - Local: `app-web/src/shared/components/FamilyGenealogyBoard/index.tsx` (categoria própria, com seu `index.ts` de barrel se ainda não existir uma para esse tipo de componente).
  - Motivo de ser `shared/components/` e não específico de uma página: este é o único componente da task usado a partir de **duas features diferentes e independentes** — o formulário e a visualização de Família (`familias/`) e a visualização de Personagem (`personagens/`) — todos em modo `editable` ou `readOnly` sobre exatamente o mesmo modelo de dados (cards de personagem + vínculos `PARENT`/`SPOUSE`). Como nenhuma das duas páginas "dona" faz sentido como lar exclusivo de um componente consumido pela outra, ele segue o mesmo raciocínio já aplicado a outras peças que cruzam páginas na aplicação (ex.: `RichTextViewer`, `EntityMentionViewDispatcher`, `ImageAvatarPreview`): fica em `shared/components/`, mesmo conhecendo a forma de `ICharacterSummary` (assim como `ImageAvatarPreview` e `EntityMentionViewDispatcher` já conhecem tipos de entidade específicos hoje).
  - Depende de `@xyflow/react` (`ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, tipos `Node`/`Edge`/`Connection`) — `'use client'` no topo, `import '@xyflow/react/dist/style.css';` neste arquivo.
  - Props propostas:
    - `mode: 'editable' | 'readOnly'`.
    - `members: { character: ICharacterSummary; positionX: number; positionY: number }[]` — um card por membro.
    - `relationships: { id?: string; fromCharacterId: string; toCharacterId: string; type: 'PARENT' | 'SPOUSE' }[]` — `id` presente quando vier de dados já persistidos (modo leitura/edição), ausente para vínculos recém-criados em memória antes do salvar.
    - Props **somente relevantes em `mode="editable"`** (todas opcionais, ausentes/ignoradas em `readOnly`):
      - `characterSearchOptions: ICharacterListItem[]`, `characterSearchText: string`, `onCharacterSearchTextChange: (text: string) => void` — alimentam o autocomplete de "adicionar membro" embutido na toolbar do quadro; a busca em si (`useGetEntityList('/characters', ...)`, filtrando quem já é membro) é responsabilidade de quem consome o componente (`FamilyCreateForm`), não do componente genérico — mantém o `FamilyGenealogyBoard` sem chamadas de API, seguindo a mesma régua de "componente genérico não conhece endpoint" da skill `web-componentes`.
      - `onAddMember: (character: ICharacterListItem) => void` — chamado ao clicar "Adicionar" com um personagem selecionado; o componente pai decide a posição inicial do novo card (ex.: um deslocamento em cascata a partir da origem para não sobrepor cards já existentes).
      - `onRemoveMember: (characterId: string) => void` — chamado pelo botão de remover (ícone de lixeira) exibido em cada card apenas quando `editable`.
      - `onPositionChange: (characterId: string, position: { x: number; y: number }) => void` — chamado no fim do arraste de um card (`onNodeDragStop`).
      - `onCreateRelationship: (relationship: { fromCharacterId: string; toCharacterId: string; type: 'PARENT' | 'SPOUSE' }) => void` — chamado depois que o usuário conecta dois cards (`onConnect` do React Flow) **e** escolhe o tipo do vínculo em um pequeno seletor local (ex.: popover/menu com duas opções — "Pai/Mãe → Filho(a)" e "Cônjuge" — exibido logo após o gesto de conexão); essa escolha de tipo é estado de UI local do próprio componente (não é chamada de API), por isso pode morar dentro do componente genérico sem quebrar a regra de "sem conhecimento de entidade/endpoint".
      - `onRemoveRelationship: (relationshipId: string) => void` — chamado quando o usuário seleciona uma aresta e a remove (usar o comportamento padrão do React Flow de seleção + tecla Delete/Backspace, via `onEdgesDelete`), suficiente para o fluxo descrito no spec sem exigir um botão dedicado por aresta.
  - Comportamento esperado:
    - `mode="editable"`: exibe a toolbar "Adicionar membro" (autocomplete + botão) acima do quadro; cards arrastáveis (`nodesDraggable`); conexões permitidas (`nodesConnectable`); nós/arestas selecionáveis e deletáveis; cada card tem um pequeno botão de remoção.
    - `mode="readOnly"`: **sem** toolbar de adicionar membro, `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, sem botão de remoção nos cards, sem seletor de tipo de vínculo — apenas zoom/pan de visualização (`Controls`/`Background` do React Flow, se desejado, para facilitar a leitura de árvores grandes).
    - Cada card (nó customizado do React Flow) mostra `ImageAvatarPreview` (foto) + `DefaultText` (nome) do personagem, reaproveitando os componentes genéricos já existentes em vez de recriar um avatar/nome do zero.
    - Arestas do tipo `PARENT` e `SPOUSE` devem ser visualmente distinguíveis (ex.: rótulo de texto na aresta — "Filho(a) de" / "Cônjuge" — e/ou estilo de linha diferente), para que a árvore seja legível tanto no modo edição quanto no modo leitura.
    - Internamente deve envolver o conteúdo com `ReactFlowProvider` (exigência da lib para usar os hooks internos do React Flow).

#### Funcionalidade

**Rotas e menu**
- Registrar em `app-web/src/shared/routes.ts`: `MENU_ROUTES.families = '/familias'`, replicado em `APP_ROUTES.private.families`.
- Em `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`, adicionar um item à seção já existente `"Mundo"` (`NAV_SECTIONS`, sem criar seção nova): `{ label: 'Famílias', href: APP_ROUTES.private.families, icon: FiGitBranch }` (`react-icons/fi`, ícone ainda não usado por nenhum outro item do menu — remete à ideia de ramificação/árvore).
- Criar a página `app-web/src/app/(authorized)/familias/page.tsx`.

**Interfaces (`shared/interfaces`)**
- Criar `app-web/src/shared/interfaces/Entities/Family/index.ts` com:
  - `FamilyClassification` — union de string com as 3 opções fixas (nomes exatos a confirmar contra o enum real definido na task de backend; usar como placeholder de trabalho `'REAL' | 'NOBREZA' | 'PLEBE'`).
  - `IFamilySummary { id: string; name: string; referenceImage?: string | null }` — versão enxuta usada em `ICharacter.family`/`ICharacter.secondaryFamily`.
  - `IFamilyMember { id: string; character: ICharacterSummary; positionX: number; positionY: number }`.
  - `IFamilyRelationship { id: string; type: 'PARENT' | 'SPOUSE'; fromCharacter: ICharacterSummary; toCharacter: ICharacterSummary }`.
  - `IFamilyListItem { id: string; referenceImage?: string | null; name: string; classification: FamilyClassification; tags: ITag[] }`.
  - `IFamily extends IEntity { name: string; referenceImage?: string | null; classification: FamilyClassification; tags: ITag[]; description?: string | null; members: IFamilyMember[]; relationships: IFamilyRelationship[]; createdAt: string; updatedAt: string }`.
  - `IFamilyListFilters { name?: string; page?: number; perPage?: number }`.
  - Reexportar em `shared/interfaces/Entities/index.ts` e `shared/interfaces/index.ts`.
- Atualizar `app-web/src/shared/interfaces/Entities/Character/index.ts`:
  - Remover `ICharacterKinship` (interface inteira) e o campo `kinships: ICharacterKinship[]` de `ICharacter`.
  - Adicionar `family?: IFamilySummary | null` e `secondaryFamily?: IFamilySummary | null` a `ICharacter` (importando `IFamilySummary` do novo arquivo de Família).
- ATENÇÃO: os nomes de campo acima (`positionX`/`positionY`, `fromCharacter`/`toCharacter`, `type`) são a proposta de contrato do frontend; devem ser conferidos contra o DTO real implementado pela task de backend equivalente antes/durante a implementação, assim como o valor literal exato de `FamilyClassification`.

**Stores (`store/PageStore`)**
- Criar `store/PageStore/FamiliesStore/index.ts` com `useSelectedFamilyStore` (mesmo padrão de `useSelectedOrganizationStore`: `selectedFamily: IFamilyListItem | null`, `setSelectedFamily`, `resetSelectedFamily`), reexportado em `store/index.ts`.

**Formulários e schemas (`shared/formSchemas`)**
- Criar `shared/formSchemas/FamilyFormSchema/index.ts`: `name` (`z.string().min(1, 'Informe o nome')`), `referenceImage` (string, aceita vazio ou URL válida — mesmo padrão de `organizationFormSchema.referenceImage`), `classification` (`z.string().min(1, 'Informe a classificação')` — o `FormAutocompleteInput` grava o valor selecionado como string), `tagIds` (`z.array(z.string()).optional()`), `description` (`z.string()`). Assim como `members`/`relationships` em Organização/Personagem, `members`/`relationships` da árvore **não** entram no schema Zod — são geridos via `useState` dentro de `FamilyCreateForm` e mesclados ao payload só no submit.
- Atualizar `shared/formSchemas/CharacterFormSchema/index.ts`: adicionar `familyId: z.string().optional()` e `secondaryFamilyId: z.string().optional()`; `characterFormDefaultValues` ganha `familyId: ''`, `secondaryFamilyId: ''`. Nenhum outro campo do schema muda (os vínculos de parentesco nunca estiveram no Zod schema, já eram geridos via `useState` de `kinships` em `CharacterCreateForm` — esse `useState` e o campo correspondente do payload é que somem).
- Reexportar `FamilyFormSchema` em `shared/formSchemas/index.ts`.

**Dados estáticos: opções fixas de classificação**
- Como `classification` é consumido tanto por `FamilyCreateForm` (autocomplete) quanto por `FamilyView`/`FamiliesList` (exibir o rótulo em pt-BR a partir do valor salvo), e todos os três componentes vivem dentro da página `familias`, seguir a skill `web-listagem-dados-estaticos` (regra "usada por mais de um componente da mesma página"): criar `app-web/src/app/(authorized)/familias/data/index.ts` exportando `FAMILY_CLASSIFICATION_OPTIONS: { value: FamilyClassification; label: string }[]` com os três pares (`REAL` → "Real", `NOBREZA` → "Nobreza", `PLEBE` → "Plebe" — ajustando os `value` ao enum real confirmado do backend). Todos os componentes da página importam essa constante via caminho relativo (`../../data`).

**Página "Famílias" (`/familias`)**
- Estrutura de página idêntica ao padrão de `organizacoes/page.tsx`: `nameInput`, `filters` (`page`, `perPage: APP_DEFAULT_PAGE_SIZE`, `name`), `isFormModalOpen`, `familyPendingDelete`, `familyPendingView`, `useSelectedFamilyStore`.
- Listagem: `useGetEntityList<IFamilyListItem, IFamilyListFilters>({ url: '/families', filters })`.
- Exclusão: `useDeleteEntity({ url: '/families/${familyPendingDelete?.id}', invalidateQueryKeys: [['/families']] })` com `ConfirmationModal` (mesmo padrão pt-BR das demais entidades: "Tem certeza que deseja excluir a família \"...\"?").
- Componentes de listagem próprios da página (seguindo `web-tabela-listagem`, mesmo padrão de `OrganizationsList`/`OrganizationsListItem`): `FamiliesList` (colunas Imagem, Nome, Classificação — rótulo via `FAMILY_CLASSIFICATION_OPTIONS` —, Tags, Ações) e `FamiliesListItem` (ações visualizar/editar/excluir com `FiEye`/`FiEdit2`/`FiTrash2`, reaproveitando `ImageAvatarPreview`/`Chip` de tags no mesmo padrão de `OrganizationsListItem`).
- `FormModal` (`size="wide"`, já que o formulário tem rich text e o quadro da árvore) com `FamilyCreateForm` (título "Nova família"/"Editar família" conforme `selectedFamily`) e `ViewModal` (`size="wide"`) com `FamilyView`.

**Formulário de Família (`FamilyCreateForm`)**
- Local: `app-web/src/app/(authorized)/familias/components/FamilyCreateForm/index.tsx`. Segue o padrão de `OrganizationCreateForm`: `useForm<FamilyFormData>` com `familyFormResolver`/`familyFormDefaultValues`; tags via `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: 100 } })`; `useGetEntityById<IFamily>({ url: '/families/${selectedFamily?.id}', enabled: isEditMode })` para hidratar em modo edição.
- Campos de formulário (grid de 4 colunas, mesmo padrão de `OrganizationCreateForm`): `FormTextInput` (nome), `FormTextInput` (imagem referência, URL), `FormAutocompleteInput<FamilyFormData, {value,label}>` (classificação, opções = `FAMILY_CLASSIFICATION_OPTIONS`, `getOptionValue={(o) => o.value}`, `getOptionLabel={(o) => o.label}`), `FormMultiAutocompleteInput` (tags). Em seguida, `FormRichTextInput` (descrição, largura total, conforme `size="wide"`).
- Abaixo dos campos de texto, o quadro da árvore: estado local `members: FamilyMemberDraft[]` (`{ character: ICharacterSummary; positionX: number; positionY: number }`) e `relationships: FamilyRelationshipDraft[]` (`{ fromCharacter: ICharacterSummary; toCharacter: ICharacterSummary; type: 'PARENT' | 'SPOUSE' }`), inicializados vazios na criação e hidratados a partir de `familyDetail.members`/`familyDetail.relationships` na edição (mesmo `useEffect` de `reset`, mas fora do RHF — igual ao tratamento de `members`/`kinships` em Organização/Personagem hoje).
- Busca de personagens para "adicionar membro": `useGetEntityList<ICharacterListItem, ICharacterListFilters>({ url: '/characters', filters: { name: searchText || undefined, perPage: 10 } })` dentro do próprio `FamilyCreateForm`, filtrando quem já é membro (mesmo padrão de exclusão usado em `OrganizationMemberField`/`CharacterKinshipField`) — os resultados e o texto de busca são passados como props (`characterSearchOptions`, `characterSearchText`, `onCharacterSearchTextChange`) ao `FamilyGenealogyBoard` em `mode="editable"`.
- Handlers ligados às props do `FamilyGenealogyBoard`: `onAddMember` (acrescenta a `members` com uma posição inicial em cascata, ex. deslocando 40px por card já existente a partir da origem, evitando sobreposição total), `onRemoveMember` (remove de `members` pelo `character.id`, e também remove qualquer `relationships` que referencie esse personagem), `onPositionChange` (atualiza `positionX`/`positionY` do membro correspondente), `onCreateRelationship` (acrescenta a `relationships`), `onRemoveRelationship` (remove de `relationships` pelo índice/`id`).
- **Fluxo inverso (cards "soltos")**: ao carregar `familyDetail` em modo edição, personagens que já têm `family`/`secondaryFamily` apontando para esta família mas ainda não têm um registro de posição persistido (atribuídos diretamente pela edição do personagem, nunca posicionados no quadro) devem aparecer como membros da família já no `familyDetail.members` retornado pela API (conforme regra de negócio do spec) — o frontend deve aplicar uma posição padrão de fallback (ex., mesma lógica de cascata usada em `onAddMember`) quando o registro vier sem `positionX`/`positionY` definidos, para que o card apareça no quadro pronto para ser arrastado. **Confirmar contra o contrato real da API** se esses membros "soltos" vêm com posição nula/zero ou já vêm com alguma posição padrão definida pelo backend — se o backend já resolver isso, o fallback do frontend não seria necessário.
- Payload de submit (`FamilyPayload`): `{ name, referenceImage: data.referenceImage || undefined, classification: data.classification, tagIds: data.tagIds ?? [], description: data.description || undefined, members: members.map(m => ({ characterId: m.character.id, positionX: m.positionX, positionY: m.positionY })), relationships: relationships.map(r => ({ fromCharacterId: r.fromCharacter.id, toCharacterId: r.toCharacter.id, type: r.type })) }`.
- Mutations: `usePostEntity<IFamily, FamilyPayload>({ url: '/families', invalidateQueryKeys: [['/families']] })` e `usePutEntity<IFamily, FamilyPayload>({ url: '/families/${selectedFamily?.id}', invalidateQueryKeys: [['/families']] })`, com toasts de sucesso/erro em pt-BR seguindo o padrão das demais entidades. **Atenção**: como o salvamento de uma família também reflete em `family`/`secondaryFamily` de personagens (regra de backend), a mutation de família deveria idealmente invalidar também a query de personagens (`['/characters']`) para que qualquer tela de personagem aberta reflita a mudança sem refresh manual — incluir `['/characters']` em `invalidateQueryKeys` de ambas as mutations de família.

**Modal de visualização de Família (`FamilyView`)**
- Local: `.../familias/components/FamilyView/index.tsx`, assinatura `{ familyId: string; onNotFound?: () => void }`, usando `useGetEntityById<IFamily>({ url: '/families/${familyId}' })`, tratamento de 404 (`onNotFound`) e loading idênticos a `OrganizationView`.
- Layout (conforme spec, seção "Modal de visualização de família"):
  - Bloco imagem + identificação lado a lado (`flex flex-col gap-4 sm:flex-row`): imagem em formato **quadrado** (mesmo padrão de `OrganizationView` — `Box` `width: 400`, `height: 400`, fallback `FiImage` sobre `APP_COLORS.wood`, `ImagePreviewDialog` ao clicar); ao lado, nome da família (`Title`), abaixo do nome as tags (`Chip[]`, mesmo padrão de cor/contraste de `OrganizationView`), abaixo das tags a classificação (rótulo mapeado via `FAMILY_CLASSIFICATION_OPTIONS`, em um bloco `detailInfoField` com ícone, mesmo padrão usado para "Raça" em `CharacterView`).
  - Abaixo do bloco imagem/identificação: quadro de Descrição (`detailSectionBox`/`detailSectionBoxHeader` + `RichTextViewer`, mesmo padrão de `OrganizationView`).
  - Abaixo da descrição: `FamilyGenealogyBoard` em `mode="readOnly"`, alimentado por `family.members`/`family.relationships`.

**Alterações em Personagens — remoção de parentesco**
- Remover por completo os arquivos `app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx` e `.../CharacterKinshipCard/index.tsx`.
- Em `CharacterCreateForm`: remover o `useState<CharacterKinshipDraft[]>` de `kinships`, o `<CharacterKinshipField ... />` do JSX, o mapeamento de `kinships` no `reset()` de edição e o campo `kinships` do payload/`CharacterPayload`.
- Em `CharacterView`: remover por completo o bloco "Parentescos" (incluindo o `grid grid-cols-1 sm:grid-cols-2` que hoje divide Parentescos/Organizações) e qualquer import de `CharacterKinshipCard`.

**Alterações em Personagens — `family`/`secondaryFamily` no formulário**
- Em `CharacterCreateForm`: buscar famílias cadastradas via `useGetEntityList<IFamilyListItem, IFamilyListFilters>({ url: '/families', filters: { perPage: 100 } })`; adicionar dois `FormAutocompleteInput<CharacterFormData, IFamilyListItem>` na grid de campos (rótulos "Família" e "Família Secundária", `getOptionLabel={(family) => family.name}`, `getOptionValue={(family) => family.id}`), ligados a `familyId`/`secondaryFamilyId`.
- `reset()` de edição: mapear `characterDetail.family?.id ?? ''` e `characterDetail.secondaryFamily?.id ?? ''`.
- `buildPayload`: `familyId: data.familyId || undefined`, `secondaryFamilyId: data.secondaryFamilyId || undefined`.
- **Ponto de atenção a sinalizar**: o spec não define se `familyId` e `secondaryFamilyId` podem ser iguais (o mesmo personagem escolhendo a mesma família duas vezes) — este plano não adiciona nenhuma validação client-side impedindo isso; confirmar se essa validação é necessária antes de considerar o formulário completo, ou deixar a cargo de uma eventual validação do backend.

**Alterações em Personagens — `CharacterView`: organizações em largura total + árvore genealógica**
- Remover o `grid grid-cols-1 sm:grid-cols-2` que hoje envolve os quadros de Parentescos/Organizações; o quadro "Organizações" passa a ser um bloco de largura total (`detailSectionBox` sozinho na linha, mesmo padrão do quadro de Descrição logo acima).
- Abaixo do quadro de Organizações, adicionar a árvore genealógica em modo leitura. Como o personagem pode ter até duas famílias (`family` e `secondaryFamily`), criar um componente específico da página `CharacterFamilyTreeSection` (`.../personagens/components/CharacterFamilyTreeSection/index.tsx`), props `{ familyId: string; familyName: string }`:
  - Busca o detalhe completo da família via `useGetEntityById<IFamily>({ url: '/families/${familyId}' })` (necessário porque `character.family`/`character.secondaryFamily` só trazem o resumo `IFamilySummary`, sem `members`/`relationships`).
  - Renderiza um `detailSectionBox` com cabeçalho "Árvore genealógica — {familyName}" (ícone `FiGitBranch`) e, dentro, `FamilyGenealogyBoard` em `mode="readOnly"` alimentado pelos `members`/`relationships` da família buscada.
  - Trata loading (`CircularProgress` + texto) e erro (`showToast`) no mesmo padrão das demais views.
- Em `CharacterView`, renderizar `<CharacterFamilyTreeSection familyId={character.family.id} familyName={character.family.name} />` quando `character.family` existir, e `<CharacterFamilyTreeSection familyId={character.secondaryFamily.id} familyName={character.secondaryFamily.name} />` quando `character.secondaryFamily` existir — cada uma em sua própria seção, empilhadas verticalmente. Quando nenhuma das duas existir, nenhuma seção de árvore é renderizada (sem estado vazio dedicado aqui, já que o spec só pede exibição "quando houver").

**Busca global / menções (`EntityMentionViewDispatcher` e `shared/constants/EntityMentions`)**
- Em `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`: importar `FamilyView` e registrar `family: ({ entityId, onNotFound }) => <FamilyView familyId={entityId} onNotFound={onNotFound} />` em `ENTITY_MENTION_VIEW_REGISTRY`.
- Em `app-web/src/shared/constants/EntityMentions/index.ts`: adicionar `family: 'família'` a `ENTITY_MENTION_TYPE_LABELS`; `family: (id) => '/families/${id}'` a `ENTITY_MENTION_DETAIL_URL_BY_TYPE`; e `'family'` a `ENTITY_MENTION_VIEWABLE_TYPES` — isso torna a entidade Família pesquisável e clicável em qualquer campo de texto rico (`FormRichTextInput`) do sistema, replicando exatamente o padrão já usado para `character`/`organization`/etc. (o endpoint genérico `/search` em si é responsabilidade da task de backend; aqui só entra o registro do tipo no lado do frontend).

**Pontos de atenção a sinalizar (não decidir por conta própria)**
- Os nomes de campo propostos para o contrato de Família (`positionX`/`positionY`, `fromCharacter`/`toCharacter`, valores literais de `FamilyClassification`) são uma proposta baseada no padrão de `OrganizationMember` já existente; devem ser conferidos contra o contrato real implementado pela task de backend (`app-api`) antes/durante a implementação, ajustando as interfaces se necessário.
- A forma como a API representa um membro "solto" (sem posição definida ainda) — se com `positionX`/`positionY` nulos, zerados, ou com algum valor padrão já calculado pelo backend — não está definida neste plano; a lógica de fallback de posição em cascata descrita acima assume que o frontend pode precisar resolver isso, mas deve ser simplificada/removida se o backend já entregar uma posição pronta para uso.
- Não há validação client-side impedindo que `familyId` e `secondaryFamilyId` do personagem sejam a mesma família — confirmar se isso é aceitável ou se deve ser bloqueado no formulário.
- A interação de remover um vínculo (aresta) do quadro via seleção + tecla Delete/Backspace (comportamento padrão do React Flow) foi assumida por não haver, no spec, uma definição explícita da UI de remoção de vínculo; validar em revisão se essa interação é suficientemente descobrível para o usuário final, ou se vale a pena complementar com um botão explícito por aresta.

**Registro de execução (web-dev)**

Status: concluído

Ajustes de contrato aplicados em relação ao plano original (backend já implementado, lido diretamente em `app-api/src/modules/families/**` e `app-api/src/modules/characters/**` antes de codar):
- `FamilyClassification` = `'royalty' | 'nobility' | 'commoner'` (minúsculo), com rótulos pt-BR "Real"/"Nobreza"/"Plebe" mapeados só em `FAMILY_CLASSIFICATION_OPTIONS` (`app-web/src/app/(authorized)/familias/data/index.ts`).
- `FamilyRelationshipType` = `'parent' | 'spouse'` (minúsculo).
- Campos de vínculo: `IFamilyRelationship`/props do `FamilyGenealogyBoard` usam `sourceCharacter`/`targetCharacter` (respostas) e `sourceCharacterId`/`targetCharacterId` (payload/props do board), não `fromCharacter`/`toCharacter`.
- `IFamilyMember` usa `positionX`/`positionY`, conforme proposto.
- `IFamily.looseCharacters` modelado como array separado (`ICharacterSummary[]`) fora de `members`, replicando `FamilyResponseDto.looseCharacters` do backend. `FamilyCreateForm` hidrata o quadro em modo edição concatenando `familyDetail.members` (posições reais) com `familyDetail.looseCharacters` convertidos em cards com posição calculada em cascata no front (função local `getCascadePosition`), já que o backend não envia posição para os soltos.

Decisões aplicadas conforme instrução do orquestrador:
- Validação client-side adicionada em `shared/formSchemas/CharacterFormSchema` (`.refine` no schema) bloqueando `familyId === secondaryFamilyId` quando ambos preenchidos, com mensagem pt-BR exibida no campo "Família Secundária".
- Remoção de vínculo (aresta) implementada via seleção + tecla Delete/Backspace (`onEdgesDelete` do React Flow) no `FamilyGenealogyBoard`, com texto de apoio "Selecione um vínculo e pressione Delete para removê-lo." exibido acima do quadro apenas em `mode="editable"`.

Pendências que exigem ação manual do usuário (fora do alcance das ferramentas do agente web-dev):
- `@xyflow/react` foi adicionado a `app-web/package.json` (`dependencies`) mas **não foi instalado** — rode `npm install` dentro de `app-web/` antes de `npm run dev`/`npm run build`, ou o build falhará por módulo não encontrado.
- Exclusão de arquivo não está entre as ferramentas disponíveis ao agente web-dev (só Read/Grep/Glob/Edit/Write/Skill). Os arquivos `app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx` e `.../CharacterKinshipCard/index.tsx` foram **esvaziados** (conteúdo substituído por um comentário de depreciação + `export {}`) e todas as referências a eles foram removidas de `CharacterCreateForm`/`CharacterView` — mas os arquivos em si continuam existindo no disco. Ação pendente: excluir manualmente essas duas pastas do repositório.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Revisão feita lendo a íntegra da seção "1. web-dev" (incluindo o registro de ajustes
de contrato ao final), o `spec.md`, os DTOs/enums reais em
`app-api/src/modules/families/**` e `app-api/src/modules/characters/**`, e todos os
arquivos de frontend listados como tocados (componentes de `familias/`,
`FamilyGenealogyBoard`, alterações em `personagens/`, interfaces, schemas, store,
rotas/Sidebar, `EntityMentionViewDispatcher`/`EntityMentions`, `package.json`).

Confirmado: o contrato do frontend está alinhado com o backend real (enums
minúsculos `royalty|nobility|commoner` e `parent|spouse`, `sourceCharacter`/
`targetCharacter` nas respostas e `sourceCharacterId`/`targetCharacterId` nos
payloads, `positionX`/`positionY`, `looseCharacters` como array separado sem
posição, hidratado no front via `getCascadePosition`). A separação
`editable`/`readOnly` do `FamilyGenealogyBoard` está correta (toolbar, arraste,
conexão, seleção e botão de remover só aparecem em `editable`), `'use client'` e o
import do CSS da lib estão presentes no único arquivo que renderiza `ReactFlow`, e o
componente usa `ReactFlowProvider`. A remoção de parentesco em personagens está
completa (sem imports/referências ativas aos stubs `CharacterKinshipField`/
`CharacterKinshipCard`, que permanecem esvaziados como pendência manual já
conhecida). `CharacterView` tem a seção de organizações em largura total com as
árvores de `family`/`secondaryFamily` em modo leitura abaixo. Hooks genéricos de
`hooks/Queries`, store Zustand, schema zod (incluindo o `.refine` que bloqueia
`familyId === secondaryFamilyId`), reaproveitamento de `shared/components/` e textos
em pt-BR estão de acordo com o padrão. O registro de `family` em
`EntityMentionViewDispatcher` e `shared/constants/EntityMentions` está completo e
consistente com as demais entidades.

Foram encontrados os seguintes problemas:

- **app-web/src/shared/components/FamilyGenealogyBoard/index.tsx:193-212** — Bug de
  "stale closure" no botão de remover membro (ícone de lixeira) de cada card. O
  `useEffect` que reconstrói `nodes` a partir da prop `members` só executa quando
  `memberIdsKey`/`mode` mudam (o `eslint-disable-next-line
  react-hooks/exhaustive-deps` suprime `onRemoveMember` das deps). O callback
  `data.onRemove: () => onRemoveMember?.(member.character.id)` gravado em cada nó
  fica "congelado" com a versão de `onRemoveMember` (isto é, `handleRemoveMember` do
  `FamilyCreateForm`, que fecha sobre os `members`/`relationships` daquele render
  específico) vigente na última vez que o efeito rodou de fato. Como
  `onPositionChange` (arrastar um card) só altera `positionX`/`positionY` sem mudar o
  conjunto de ids, `memberIdsKey` permanece igual e o efeito não roda de novo após um
  arraste. Se o usuário arrastar um card e, em seguida — sem que nenhuma
  adição/remoção de membro tenha "atualizado" o efeito nesse meio-tempo — remover um
  outro card pela lixeira, o clique dispara a versão desatualizada de
  `handleRemoveMember`, que chama `setMembers(members.filter(...))` e
  `setRelationships(relationships.filter(...))` usando o snapshot de
  `members`/`relationships` anterior ao arraste, revertendo silenciosamente a posição
  recém-movida (e podendo também reintroduzir vínculos já removidos ou descartar
  vínculos criados nesse intervalo).
  - Trecho: efeito fechado em `}, [memberIdsKey, mode]);` (linha 212), que grava
    `onRemove: isEditable ? () => onRemoveMember?.(member.character.id) : undefined`
    (linhas 202-204) capturando a prop `onRemoveMember` do render em que o efeito
    rodou por último.
  - Sugestão: manter uma `ref` sempre atualizada para `onRemoveMember` (ex.:
    `const onRemoveMemberRef = useRef(onRemoveMember); useEffect(() => {
    onRemoveMemberRef.current = onRemoveMember; }, [onRemoveMember]);`) e chamar
    `onRemoveMemberRef.current?.(...)` dentro do callback do nó, em vez de capturar a
    prop diretamente dentro do efeito controlado por `memberIdsKey`; alternativamente,
    incluir `onRemoveMember` nas deps do efeito, aceitando reconstruir `nodes` com
    mais frequência.

- **app-web/src/shared/components/FamilyGenealogyBoard/index.tsx:95-119** — (achado
  menor, cosmético) Os `Handle` (pontos de conexão) de cada card continuam sendo
  renderizados mesmo em `mode="readOnly"`, ainda que `nodesConnectable={false}` já
  impeça qualquer conexão nesse modo — não é um bug funcional, mas é um resíduo
  visual desnecessário na leitura da árvore em modo visualização.
  - Trecho: `<Handle type="target" position={Position.Top} .../>` e `<Handle
    type="source" position={Position.Bottom} .../>` renderizados
    incondicionalmente, independente de `mode`.
  - Sugestão: esconder os `Handle`s quando `mode === 'readOnly'` (ex.: via
    `style={{ visibility: mode === 'readOnly' ? 'hidden' : 'visible' }}` ou não
    renderizá-los nesse modo).

Fora esses dois pontos (o primeiro merecendo correção antes de considerar a feature
pronta; o segundo é apenas um polimento visual opcional), os demais arquivos
revisados — `FamiliesFilterSection`, `FamiliesList`/`FamiliesListItem`,
`FamilyCreateForm`, `FamilyView`, `familias/page.tsx`, `familias/data/index.ts`,
`CharacterCreateForm`, `CharacterView`, `CharacterFamilyTreeSection`, interfaces de
`Family`/`Character`, `FamilyFormSchema`, `CharacterFormSchema`, `FamiliesStore`,
rotas/Sidebar, `EntityMentionViewDispatcher` e `EntityMentions` — estão aprovados,
sem problemas encontrados.

## Correções (web-dev)

Status: concluído

- **Stale closure (prioritário)** — corrigido em
  `app-web/src/shared/components/FamilyGenealogyBoard/index.tsx`. Adicionado
  `onRemoveMemberRef` (`useRef(onRemoveMember)`, atualizado em um `useEffect`
  separado com `[onRemoveMember]` nas deps). O `useEffect` que reconstrói `nodes`
  (controlado por `memberIdsKey`/`mode`) agora grava
  `onRemove: () => onRemoveMemberRef.current?.(member.character.id)` em vez de
  capturar a prop `onRemoveMember` diretamente — o callback do card sempre invoca a
  versão mais recente de `handleRemoveMember` (que em `FamilyCreateForm` fecha sobre
  o `members`/`relationships` do render mais atual), então arrastar um card e depois
  remover outro (em qualquer ordem, incluindo com criação de vínculo no meio) não
  reverte mais posições recém-movidas nem descarta/reintroduz vínculos
  indevidamente. `onPositionChange`, `onConnect`/`onCreateRelationship` e
  `onEdgesDelete`/`onRemoveRelationship` não sofriam do mesmo problema (são passados
  diretamente como props do `<ReactFlow>`, recriados via `useCallback` com deps
  corretas a cada render, e não ficam "presos" dentro de `nodes`/`edges`), então não
  precisaram de alteração.

- **Handles em `readOnly` (cosmético)** — corrigido no mesmo arquivo
  (`CharacterCardNode`): os dois `Handle` (`target`/`source`) de cada card agora só
  são renderizados quando `mode === 'editable'`, ficando ausentes do DOM em
  `mode="readOnly"` em vez de aparecerem inertes.

Nenhuma alteração de contrato com o backend (nomes de campo, enums, `sourceCharacterId`/
`targetCharacterId`, `looseCharacters`) foi necessária.

### Re-revisão (web)

Releitura da seção "## Revisão" (achados originais) e "## Correções (web-dev)", com
foco em `app-web/src/shared/components/FamilyGenealogyBoard/index.tsx` (íntegra) e nos
handlers consumidores em `app-web/src/app/(authorized)/familias/components/
FamilyCreateForm/index.tsx` (`handleAddMember`, `handleRemoveMember`,
`handlePositionChange`, `handleCreateRelationship`, `handleRemoveRelationship`),
além dos usos em modo leitura (`FamilyView`, `CharacterFamilyTreeSection`).

**1. Stale closure — CONFIRMADO CORRIGIDO.**
`onRemoveMemberRef` (linhas 197-200) é mantido em dia por um `useEffect` dedicado
(`[onRemoveMember]`), declarado *antes* do efeito que reconstrói `nodes`
(`[memberIdsKey, mode]`, linhas 202-226) — como React executa os efeitos de um
componente na ordem em que foram declarados dentro do mesmo commit, o ref já está
atualizado no momento em que o efeito de reconstrução de `nodes` lê
`onRemoveMemberRef.current` para gravar `onRemove: () =>
onRemoveMemberRef.current?.(member.character.id)`, mesmo quando ambas as deps mudam
no mesmo render. Não restou nenhum outro valor "congelado" dentro de `nodes`/`edges`:
`character`/`mode` gravados em `data` são recomputados diretamente a partir das props
`members`/`mode` a cada execução do próprio efeito (não são callbacks fechando sobre
handlers externos, então não sofrem do mesmo problema); `onPositionChange` e
`onRemoveRelationship` (via `handleNodeDragStop`/`handleEdgesDelete`,
`useCallback` com deps corretas) e `onCreateRelationship` (via
`handleChooseRelationshipType`, que fecha sobre o estado local `pendingConnection`,
não sobre uma prop) são passados diretamente como props do `<ReactFlow>` e recriados
a cada render — nunca ficam presos dentro do array `nodes`/`edges` controlado pelos
efeitos com deps reduzidas. Confirmado também do lado do consumidor
(`FamilyCreateForm`): `handleRemoveMember`/`handleCreateRelationship`/etc. são
funções simples redefinidas a cada render (sem `useCallback`), fechando sobre o
`members`/`relationships` mais atual — combinadas com o `ref` do board, garantem que
o callback disparado sempre veja o estado mais recente.

**2. Interações combinadas em qualquer ordem — CONFIRMADO SEM REGRESSÃO.**
Tracei os fluxos: arrastar (`onNodeDragStop` → `handlePositionChange` → atualiza
`positionX`/`positionY` do membro no estado do form) não altera `memberIdsKey`,
então o efeito de reconstrução de `nodes` não roda de novo nesse passo — a posição
arrastada fica só no estado interno do React Flow até a próxima mudança real de
membros/`mode`, momento em que o efeito reconstrói `nodes` a partir de `members`, que
por sua vez já reflete a posição atualizada (porque `handlePositionChange` já havia
persistido essa posição no estado do `FamilyCreateForm` antes de qualquer
add/remove subsequente). Remover um membro depois de arrastar não reverte mais a
posição (bug original eliminado) nem perde/reintroduz vínculos, já que
`handleRemoveMember` filtra `relationships` pelo `characterId` usando o snapshot mais
recente. Criar vínculo (`onConnect` → popover de tipo → `onCreateRelationship`) e
depois remover outro vínculo/membro também não interfere: `relationshipsKey` muda a
cada criação/remoção e o efeito de `edges` (linhas 239-246) reconstrói do zero a
partir da prop `relationships`, que é sempre a fonte da verdade. Não encontrei
nenhuma combinação de ordem (arrastar → remover, criar vínculo → remover membro,
remover vínculo → arrastar, etc.) que reverta posições ou perca/reintroduza vínculos.

**3. Handles ocultos em `readOnly` — NÃO APROVADO: a correção troca um problema
cosmético por uma regressão funcional provavelmente mais grave.**
A correção aplicada (`CharacterCardNode`, linhas 95-101 e 117-123) envolve os dois
`<Handle>` em `{mode === 'editable' && (...)}`, ou seja, em `mode="readOnly"` nenhum
`<Handle>` é montado no DOM do nó. Isso é diferente — e mais arriscado — do que a
sugestão original de revisão ("via `style={{ visibility: ... }}`"), que mantinha o
`Handle` montado (apenas visualmente oculto). O React Flow (`@xyflow/react`) calcula
o ponto de ancoragem de cada aresta consultando, para o nó de origem/destino, os
`handleBounds` registrados a partir dos elementos `<Handle>` efetivamente renderizados
(medidos via `ResizeObserver` no DOM); quando uma aresta não especifica
`sourceHandle`/`targetHandle` explícito (como é o caso aqui, `buildEdgeFromRelationship`
não define nenhum dos dois), a lib procura o único handle daquele tipo no nó. Se
nenhum `<Handle>` estiver montado (nosso caso em `readOnly`), não há bounds para
consultar, e o comportamento documentado da lib nesse cenário é falhar em calcular a
aresta (tipicamente com o aviso interno "Couldn't create edge for source/target
handle id" e a aresta não sendo desenhada, ou sendo desenhada com coordenadas
degeneradas) — exatamente o oposto do que se quer no modo leitura, que é o modo em
que a árvore genealógica *precisa* mostrar os vínculos (`FamilyView` e
`CharacterFamilyTreeSection` só usam `FamilyGenealogyBoard` em `mode="readOnly"`, ou
seja, são as duas telas de maior exposição do recurso). Não foi possível confirmar
isso executando a aplicação neste ambiente (`@xyflow/react` segue como pendência de
`npm install`, registrada na task), mas é um comportamento conhecido/documentado da
biblioteca — a prática recomendada pela própria documentação do React Flow para
esconder handles é ocultá-los via CSS (`opacity: 0`/`visibility: hidden`/
`pointerEvents: 'none'`) mantendo o elemento montado, e não removê-los
condicionalmente do JSX.
  - Trecho: `{mode === 'editable' && (<Handle type="target" position={Position.Top} .../>)}`
    e `{mode === 'editable' && (<Handle type="source" position={Position.Bottom} .../>)}`
    em `app-web/src/shared/components/FamilyGenealogyBoard/index.tsx:95-101` e
    `:117-123`.
  - Sugestão: reverter para renderização incondicional dos dois `<Handle>` (em
    ambos os modos) e, em vez disso, aplicar apenas estilo visual condicional em
    `readOnly` (ex.: `style={{ background: APP_COLORS.goldDark, opacity: mode ===
    'readOnly' ? 0 : 1, pointerEvents: mode === 'readOnly' ? 'none' : undefined }}`),
    preservando o elemento no DOM para que o cálculo de ancoragem das arestas
    continue funcionando nos dois modos. Antes de fechar esse ponto, validar
    manualmente no navegador (após `npm install`) que as arestas aparecem
    corretamente em `mode="readOnly"` com a correção revertida para o formato
    baseado em CSS.

**4. Regressão de contrato com o backend — CONFIRMADO SEM REGRESSÃO.**
Nenhum dos dois ajustes (stale closure / Handles) toca em nomes de campo, payloads
(`FamilyPayload` em `FamilyCreateForm`), enums ou nas interfaces
`IFamilyMember`/`IFamilyRelationship`/`FamilyGenealogyRelationship`
(`sourceCharacterId`/`targetCharacterId`/`positionX`/`positionY` inalterados).

**Conclusão:** achado 1 (stale closure) está corrigido e validado; achado 2 (não era
um achado formal, mas as interações combinadas foram re-testadas por leitura de
código e estão corretas) confirmado sem regressão; achado 4 confirmado sem
regressão. O achado 2 original da revisão anterior ("Handles visíveis em readOnly")
**não está aprovado** — a correção aplicada troca um problema cosmético por um risco
real de quebra funcional das arestas no modo leitura, que é o modo mais usado da
feature (`FamilyView`, `CharacterFamilyTreeSection`). Recomenda-se nova correção
(ocultar via CSS, não via renderização condicional) antes de considerar a feature
pronta.

### Correção (web-dev) — regressão da re-revisão

Status: concluído

- **Handles em `readOnly` — corrigido definitivamente** em
  `app-web/src/shared/components/FamilyGenealogyBoard/index.tsx` (`CharacterCardNode`).
  Revertida a renderização condicional (`{mode === 'editable' && (<Handle .../>)}`)
  que removia os dois `<Handle>` do DOM em `mode="readOnly"`. Os dois `<Handle>`
  (`target`/`source`) agora são renderizados **incondicionalmente**, em ambos os
  modos; em `mode="readOnly"` apenas o estilo é alterado — `opacity: 0` e
  `pointerEvents: 'none'` — mantendo o elemento montado no DOM com dimensões normais,
  para que o React Flow consiga medir `handleBounds` e ancorar corretamente as
  arestas nas duas telas que usam `mode="readOnly"` (`FamilyView` e
  `CharacterFamilyTreeSection`). Não foi usado `display: none` nem `visibility:
  hidden`, conforme a instrução de correção, justamente para não zerar as dimensões
  medidas pela lib. A interação continua bloqueada em `readOnly` pelas props já
  existentes do `<ReactFlow>` (`nodesConnectable={false}`, `elementsSelectable=
  {false}`), que não foram alteradas.
  Nenhuma outra parte do componente foi tocada — o `onRemoveMemberRef` (correção do
  stale closure aprovada na re-revisão) permanece exatamente como estava.
  Não foi possível validar visualmente no navegador neste ambiente (`@xyflow/react`
  segue como pendência de `npm install`, já registrada na task); a correção segue a
  prática documentada da própria lib para ocultar handles sem afetar a medição de
  `handleBounds`.
  Nenhuma alteração de contrato com o backend foi necessária.