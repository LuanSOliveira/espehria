# Task Web: Personagens e Organizações

## Contexto
Ver .claude/tasks/personagens-organizacoes/spec.md

## Etapas

### 1. web-dev
Status: concluído

#### Componentes (se necessário)

- Componente: `FormCheckboxInput`
  - Local: `app-web/src/shared/components/Inputs/FormInputs/FormCheckboxInput/index.tsx` (exportar em `FormInputs/index.ts`).
  - Motivo: não existe hoje nenhum input de checkbox reutilizável em `shared/components/Inputs` (apenas `DefaultTextInput`/`FormTextInput`, `DefaultPasswordInput`/`FormPasswordInput`, `DefaultAutocompleteInput`/`FormAutocompleteInput`, `FormMultiAutocompleteInput`, `FormRichTextInput`, `FormColorInput`). O campo "Morto?" do Personagem precisa de um checkbox controlado por `react-hook-form`.
  - Props: `id: string`, `name: FieldPath<TFieldValues>`, `control: Control<TFieldValues>`, `label?: string`, `disabled?: boolean` — seguir o mesmo padrão dos demais `FormInputs` (usar `Controller`, `MUI Checkbox` + `FormControlLabel`, respeitando `useAccessibleFontSize`/estilos de `APP_INPUT_STYLES` quando aplicável).
  - Comportamento esperado: `field.value` boolean controla o `checked`; `field.onChange` atualiza o valor; desmarcado por padrão (default value definido no schema/valores padrão do formulário, não no componente).

- Componente: `CharactersFilterSection`
  - Local: `app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`.
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: mesmo padrão visual de `CreaturesFilterSection`/`DivinitiesFilterSection`, mas somente com o campo de busca por nome (`DefaultTextInput` com ícone `FiSearch`) e botão "Filtrar" (`PrimaryButton`), já que a listagem de Personagens só tem filtro por nome (sem filtro de categoria).

- Componente: `OrganizationsFilterSection`
  - Local: `app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`.
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`, `onSubmit: (event: SubmitEvent<HTMLFormElement>) => void`.
  - Comportamento esperado: idêntico ao `CharactersFilterSection` (somente filtro por nome), aplicado à listagem de Organizações.

#### Funcionalidade

**Rotas e menu**
- Registrar em `app-web/src/shared/routes.ts`: `MENU_ROUTES.characters = '/personagens'` e `MENU_ROUTES.organizations = '/organizacoes'`; replicar as chaves em `APP_ROUTES.private.characters` e `APP_ROUTES.private.organizations`.
- Em `app-web/src/app/(authorized)/components/Sidebar/data/index.ts`, acrescentar dois itens à seção existente `"Mundo"` (`NAV_SECTIONS`, sem criar seção nova): `{ label: 'Personagens', href: APP_ROUTES.private.characters, icon: FiUser }` e `{ label: 'Organizações', href: APP_ROUTES.private.organizations, icon: FiBriefcase }` (ambos de `react-icons/fi`, evitando reutilizar ícones já usados em outros itens do menu).
- Criar as páginas `app-web/src/app/(authorized)/personagens/page.tsx` e `app-web/src/app/(authorized)/organizacoes/page.tsx`.

**Interfaces (`shared/interfaces`)**
- Criar `shared/interfaces/Entities/Character/index.ts` com: `ICharacterSummary { id; name; referenceImage?: string | null }`; `ICharacterKinship { id: string; relatedCharacter: ICharacterSummary; degree: string }`; `ICharacterListItem { id; name; referenceImage?: string | null; isDead: boolean; race?: { id; name } | null; tags: ITag[] }`; `ICharacter extends IEntity { name; referenceImage?: string | null; isDead: boolean; race?: { id; name } | null; description?: string | null; tags: ITag[]; kinships: ICharacterKinship[]; organizations: IOrganizationSummary[] /* derivado, somente leitura */; createdAt; updatedAt }`; `ICharacterListFilters { name?; page?; perPage? }`.
- Criar `shared/interfaces/Entities/Organization/index.ts` com: `IOrganizationSummary { id; name; referenceImage?: string | null }`; `IOrganizationMember { id: string; character: ICharacterSummary; role: string }`; `IOrganizationListItem { id; name; referenceImage?: string | null; tags: ITag[] }`; `IOrganization extends IEntity { name; referenceImage?: string | null; description?: string | null; tags: ITag[]; members: IOrganizationMember[]; createdAt; updatedAt }`; `IOrganizationListFilters { name?; page?; perPage? }`.
- Reexportar ambos em `shared/interfaces/Entities/index.ts` e `shared/interfaces/index.ts`.
- ATENÇÃO: os nomes de campo acima (`referenceImage`, `degree`, `role`, `organizations` derivado) são a proposta de contrato para o frontend, alinhada ao padrão mais recente (`referenceImage` sem sufixo `Url`, como em `Divinity`) e às regras do spec. Ao implementar, confirme contra o retorno real dos endpoints `/characters` e `/organizations` (criados na task de backend) e ajuste os nomes caso o DTO real do `app-api` divirja.

**Stores (`store/PageStore`)**
- Criar `store/PageStore/CharactersStore/index.ts` com `useSelectedCharacterStore` (mesmo padrão de `useSelectedDivinityStore`: `selectedCharacter: ICharacterListItem | null`, `setSelectedCharacter`, `resetSelectedCharacter`).
- Criar `store/PageStore/OrganizationsStore/index.ts` com `useSelectedOrganizationStore` análogo, usando `IOrganizationListItem`.
- Reexportar ambos em `store/index.ts`.

**Formulários e schemas (`shared/formSchemas`)**
- Criar `shared/formSchemas/CharacterFormSchema/index.ts`: `name` (`z.string().min(1, 'Informe o nome')`), `referenceImage` (string, aceita vazio ou URL válida — mesmo padrão de `divinityFormSchema.referenceImage`), `tagIds` (`z.array(z.string()).optional()`), `isDead` (`z.boolean()`, default `false`), `raceId` (`z.string().optional()`, representando ausência de raça como string vazia/undefined), `description` (`z.string()`). Os vínculos de parentesco (`kinships`) **não** entram no schema Zod — assim como `pointsOfInterest` em `LocationFormSchema`, são geridos via `useState` no próprio `CharacterCreateForm` e mesclados ao payload apenas no submit.
- Criar `shared/formSchemas/OrganizationFormSchema/index.ts`: `name` (obrigatório), `referenceImage` (mesmo padrão de URL), `tagIds` (opcional), `description`. Os `members` também ficam fora do schema Zod, geridos via `useState` no `OrganizationCreateForm`.
- Ambos exportam `*FormData`, `*FormDefaultValues` e `*FormResolver`, e devem ser reexportados em `shared/formSchemas/index.ts`.

**Página "Personagens" (`/personagens`)**
- Estrutura de página idêntica ao padrão de `divindades/page.tsx`/`racas/page.tsx`: estado de `nameInput`, `filters` (`page`, `perPage: APP_DEFAULT_PAGE_SIZE`, `name`), `isFormModalOpen`, `characterPendingDelete`, `characterPendingView`; `useSelectedCharacterStore` para edição.
- Listagem: `useGetEntityList<ICharacterListItem, ICharacterListFilters>({ url: '/characters', filters })`.
- Exclusão: `useDeleteEntity({ url: '/characters/${characterPendingDelete?.id}', invalidateQueryKeys: [['/characters']] })`, com `ConfirmationModal` (mesma mensagem/padrão pt-BR das demais entidades).
- Componentes de listagem próprios da página (seguindo o padrão de `DivinitiesList`/`DivinitiesListItem`): `CharactersList` (tabela com colunas Imagem, Nome, Raça, Tags, Ações — reaproveitando `ImageAvatarPreview` e `TagBadge`) e `CharactersListItem` (ações visualizar/editar/excluir com `FiEye`/`FiEdit2`/`FiTrash2`); exibir também um indicador visual de "morto" na listagem (ex.: ícone ao lado do nome) para consistência com o modal de visualização.
- `FormModal` com `CharacterCreateForm` (título "Nova personagem"/"Editar personagem" conforme modo) e `ViewModal` com `CharacterView`.

**Formulário de Personagem (`CharacterCreateForm`)**
- Segue o padrão de `DivinityCreateForm`/`LocationCreateForm`: `useForm<CharacterFormData>` com `characterFormResolver`/`characterFormDefaultValues`; busca de tags via `useGetEntityList<ITag, ITagListFilters>({ url: '/tags', filters: { perPage: 100 } })`; busca de raças via `useGetEntityList<IRaceListItem, IRaceListFilters>({ url: '/races', filters: { perPage: 100 } })` para popular o `FormAutocompleteInput` de raça (campo opcional — ao limpar a seleção, `raceId` deve virar `undefined`/`null` no payload, não string vazia); `useGetEntityById<ICharacter>({ url: '/characters/${selectedCharacter?.id}', enabled: isEditMode })` para hidratar o formulário em modo edição, incluindo os `kinships` existentes no estado local.
- Campos: `FormTextInput` (nome), `FormTextInput` (imagem referência, URL), `FormMultiAutocompleteInput` (tags), `FormCheckboxInput` (morto?, default desmarcado), `FormAutocompleteInput` (raça, opcional), `FormRichTextInput` (descrição).
- Campo de Parentescos — componente `CharacterKinshipField` (`app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx`), com estado local `kinships: { relatedCharacter: ICharacterSummary; degree: string }[]` gerido no `CharacterCreateForm` (fora do RHF), mesclado ao payload no submit:
  - Autocomplete (`DefaultAutocompleteInput<ICharacterListItem>`) buscando em `useGetEntityList({ url: '/characters', filters: { name: searchText || undefined, perPage: 10 } })`, com as opções filtrando: (a) personagens já adicionados à lista de parentescos (bloqueia duplicidade na UI, mesmo padrão de `LocationPointsOfInterestField`) e (b) o próprio personagem em edição (`excludeCharacterId={selectedCharacter?.id}`, evitando parentesco consigo mesmo).
  - Input de texto livre (`DefaultTextInput`) para o grau de parentesco.
  - Botão "Adicionar" (`SecondaryButton`), desabilitado até haver personagem selecionado e texto preenchido; ao clicar, adiciona `{ relatedCharacter, degree }` à lista e limpa os campos.
  - Lista de cards (`CharacterKinshipCard`, em `.../personagens/components/CharacterKinshipCard/index.tsx`): mostra avatar (`ImageAvatarPreview`) + nome do personagem parente + grau; ações opcionais `onView` (sempre presente, chama `useEntityMentionViewStore().openEntityView('character', relatedCharacter.id)` para abrir o modal do personagem parente), `onEdit` (alterna o card para um modo de edição inline do campo de texto livre — apenas `degree`, nunca troca `relatedCharacter` — com confirmar/cancelar) e `onRemove` (remove o item da lista). No contexto do formulário, todas as três ações são passadas; no contexto do `CharacterView` (somente leitura), apenas `onView` é passada.
- Payload de submit (`CharacterPayload`): `{ name, referenceImage: data.referenceImage || undefined, tagIds: data.tagIds ?? [], isDead: data.isDead, raceId: data.raceId || undefined, description: data.description || undefined, kinships: kinships.map(k => ({ relatedCharacterId: k.relatedCharacter.id, degree: k.degree })) }`.
- Mutations: `usePostEntity<ICharacter, CharacterPayload>({ url: '/characters', invalidateQueryKeys: [['/characters']] })` e `usePutEntity<ICharacter, CharacterPayload>({ url: '/characters/${selectedCharacter?.id}', invalidateQueryKeys: [['/characters']] })`, com toasts de sucesso/erro em pt-BR seguindo o padrão das demais entidades (mensagens de erro usando `error.response?.data?.message` com fallback fixo).

**Modal de visualização de Personagem (`CharacterView`)**
- Local: `.../personagens/components/CharacterView/index.tsx`, mesma assinatura de `DivinityView`/`CreatureView`: `{ characterId: string; onNotFound?: () => void }`, usando `useGetEntityById<ICharacter>({ url: '/characters/${characterId}' })`, tratamento de 404 (`onNotFound`) e loading idênticos aos existentes.
- Layout:
  - Bloco imagem + identificação lado a lado (`flex flex-col gap-4 sm:flex-row`): imagem em formato **retrato** (reutilizar o padrão inline já usado em `DivinityView` — `Box` com `width: 300`, `minWidth: 300`, `minHeight: 400`, borda dourada, fallback `FiImage` quando sem `referenceImage`, e `ImagePreviewDialog` ao clicar); ao lado, nome do personagem (`Title`) com um ícone de caveira (ex.: `GiDeathSkull` de `react-icons/gi`) exibido ao lado do nome quando `character.isDead === true`; abaixo do nome, as tags (`Chip` por tag, mesmo padrão de cor/contraste de `DivinityView`); abaixo das tags, a raça (quando houver — campo estilo `detailInfoField` com ícone, igual ao padrão usado para "Categoria" em `DivinityView`).
  - Abaixo do bloco de imagem/identificação: quadro de Descrição (mesmo padrão `detailSectionBox`/`detailSectionBoxHeader` + `RichTextViewer` usado em `DivinitySectionBox`/`CreatureSectionBox`).
  - Abaixo da descrição, um `grid grid-cols-1 sm:grid-cols-2` com dois quadros lado a lado:
    - Quadro "Parentescos": lista `character.kinships` usando `CharacterKinshipCard` apenas com `onView` (sem `onEdit`/`onRemove`); estado vazio com `DefaultText` ("Nenhum parentesco cadastrado.").
    - Quadro "Organizações": lista `character.organizations` (derivado, somente leitura) usando um novo card `CharacterOrganizationCard` (`.../personagens/components/CharacterOrganizationCard/index.tsx`, mesmo padrão de `LocationPointOfInterestCard`: avatar + nome da organização + ação `onView` que chama `openEntityView('organization', organization.id)`; sem ação de remover); estado vazio com `DefaultText` ("Nenhuma organização cadastrada.").

**Página "Organizações" (`/organizacoes`)**
- Mesma estrutura de página que Personagens: `filters` (nome, paginação), `useSelectedOrganizationStore`, `useGetEntityList<IOrganizationListItem, IOrganizationListFilters>({ url: '/organizations', filters })`, `useDeleteEntity` para `/organizations/:id` invalidando `['/organizations']`, `ConfirmationModal`, `FormModal` com `OrganizationCreateForm`, `ViewModal` com `OrganizationView`.
- `OrganizationsList`/`OrganizationsListItem` seguindo o padrão de `DivinitiesList`/`DivinitiesListItem` (colunas Imagem, Nome, Tags, Ações — sem coluna de categoria, já que Organização não tem categoria).

**Formulário de Organização (`OrganizationCreateForm`)**
- Mesmo padrão de `LocationCreateForm`: `useForm<OrganizationFormData>`, tags via `/tags`, `useGetEntityById<IOrganization>({ url: '/organizations/${selectedOrganization?.id}', enabled: isEditMode })`.
- Campos: `FormTextInput` (nome, obrigatório — **atenção**: `Organization.name` é único, então o backend deve retornar erro de conflito a ser exibido via toast com a mensagem de `error.response?.data?.message`, sem validação client-side de unicidade), `FormTextInput` (imagem referência), `FormMultiAutocompleteInput` (tags), `FormRichTextInput` (descrição).
- Campo de Membros — componente `OrganizationMemberField` (`.../organizacoes/components/OrganizationMemberField/index.tsx`), mesma mecânica do `CharacterKinshipField`: estado local `members: { character: ICharacterSummary; role: string }[]`, autocomplete de personagens (`/characters`, filtrando os já adicionados como membro — sem necessidade de excluir "a si mesma", pois é uma organização selecionando personagens, entidades diferentes), input de texto livre para a função, botão adicionar, e lista de `OrganizationMemberCard` (`.../organizacoes/components/OrganizationMemberCard/index.tsx`) com `onView` (abre `CharacterView` via `openEntityView('character', character.id)`), `onEdit` (edição inline apenas do campo `role`) e `onRemove`.
- Payload (`OrganizationPayload`): `{ name, referenceImage: data.referenceImage || undefined, tagIds: data.tagIds ?? [], description: data.description || undefined, members: members.map(m => ({ characterId: m.character.id, role: m.role })) }`.
- Mutations `usePostEntity`/`usePutEntity` para `/organizations`, mesmo padrão de toasts.

**Modal de visualização de Organização (`OrganizationView`)**
- Local: `.../organizacoes/components/OrganizationView/index.tsx`, mesma assinatura `{ organizationId: string; onNotFound?: () => void }`.
- Layout: imagem em formato **quadrado** (reutilizar o padrão inline já usado em `CreatureView` — `Box` `width: 400`, `height: 400`, fallback `FiImage`, `ImagePreviewDialog`); ao lado, nome da organização (`Title`) e, abaixo, as tags (`Chip`s).
- Abaixo do bloco de imagem/identificação: quadro de Descrição (mesmo padrão `detailSectionBox`).
- Abaixo da descrição: quadro "Membros", listando `organization.members` com `OrganizationMemberCard` apenas com `onView` (sem `onEdit`/`onRemove`); estado vazio com `DefaultText` ("Nenhum membro cadastrado.").

**Busca global / menções (`EntityMentionViewDispatcher` e constantes de `shared/constants/EntityMentions`)**
- Em `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx`: importar `CharacterView` e `OrganizationView` e registrar no `ENTITY_MENTION_VIEW_REGISTRY`: `character: ({ entityId, onNotFound }) => <CharacterView characterId={entityId} onNotFound={onNotFound} />` e `organization: ({ entityId, onNotFound }) => <OrganizationView organizationId={entityId} onNotFound={onNotFound} />`.
- Em `app-web/src/shared/constants/EntityMentions/index.ts`, atualizar também as três constantes irmãs que sustentam a menção/busca dentro do editor de texto rico (`FormRichTextInput`/`MentionSuggestionList`/`EntityMentionNodeView`), para que menções a Personagens/Organizações fiquem pesquisáveis e clicáveis nas descrições: `ENTITY_MENTION_TYPE_LABELS` (`character: 'personagem'`, `organization: 'organização'`), `ENTITY_MENTION_DETAIL_URL_BY_TYPE` (`character: (id) => '/characters/${id}'`, `organization: (id) => '/organizations/${id}'`) e `ENTITY_MENTION_VIEWABLE_TYPES` (adicionar `'character'` e `'organization'`).

**Pontos de atenção a sinalizar (não decidir por conta própria)**
- Não foi explicitado se o quadro "Organizações" no `CharacterView` deve exibir também a função (`role`) do personagem em cada organização, ou apenas o nome da organização (o spec só menciona "nome" e ação de visualizar). O plano acima assume exibição apenas do nome/avatar da organização, sem a função — confirmar se esse é o comportamento desejado antes de finalizar o layout.
- Não foi explicitado se um personagem pode ter um vínculo de parentesco consigo mesmo (auto-referência). O plano acima assume que não (exclui o próprio personagem das opções do autocomplete de parentesco em modo edição, análogo ao `excludeLocationId` de `LocationPointsOfInterestField`) — confirmar se essa regra está correta.
- Os nomes de campo dos DTOs de resposta (`referenceImage`, `degree`, `role`, `race`, `organizations`) são uma proposta baseada nos padrões existentes; devem ser conferidos contra o contrato real implementado pela task de backend (`app-api`) antes/durante a implementação, ajustando as interfaces se necessário.

Status: concluído
Componentes:
- `app-web/src/shared/components/Inputs/FormInputs/FormCheckboxInput/index.tsx` (novo, reexportado em `FormInputs/index.ts`)
- `app-web/src/app/(authorized)/personagens/components/CharactersFilterSection/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharactersList/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharactersListItem/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharacterKinshipCard/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharacterOrganizationCard/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharacterCreateForm/index.tsx`
- `app-web/src/app/(authorized)/personagens/components/CharacterView/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationsFilterSection/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationsList/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationsListItem/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationMemberField/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationMemberCard/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationCreateForm/index.tsx`
- `app-web/src/app/(authorized)/organizacoes/components/OrganizationView/index.tsx`

Arquivos:
- `app-web/src/app/(authorized)/personagens/page.tsx` (nova página + rota)
- `app-web/src/app/(authorized)/organizacoes/page.tsx` (nova página + rota)
- `app-web/src/shared/routes.ts` (rotas `characters`/`organizations`)
- `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` (itens "Personagens"/"Organizações" na seção "Mundo", ícones `FiUser`/`FiBriefcase`)
- `app-web/src/shared/interfaces/Entities/Character/index.ts` (novo)
- `app-web/src/shared/interfaces/Entities/Organization/index.ts` (novo)
- `app-web/src/shared/interfaces/Entities/index.ts` (reexport)
- `app-web/src/store/PageStore/CharactersStore/index.ts` (novo)
- `app-web/src/store/PageStore/OrganizationsStore/index.ts` (novo)
- `app-web/src/store/index.ts` (reexport)
- `app-web/src/shared/formSchemas/CharacterFormSchema/index.ts` (novo)
- `app-web/src/shared/formSchemas/OrganizationFormSchema/index.ts` (novo)
- `app-web/src/shared/formSchemas/index.ts` (reexport)
- `app-web/src/shared/components/EntityMentionViewDispatcher/index.tsx` (registro de `character`/`organization`)
- `app-web/src/shared/constants/EntityMentions/index.ts` (`ENTITY_MENTION_TYPE_LABELS`, `ENTITY_MENTION_DETAIL_URL_BY_TYPE`, `ENTITY_MENTION_VIEWABLE_TYPES`)

Decisões tomadas a partir do contrato real do `app-api` (divergente do nomes hipotéticos do plano):
- Parentesco: campo de texto livre chama-se `kinship` (não `degree`); o personagem referenciado chama-se `relative` (não `relatedCharacter`) — `ICharacterKinship { id; kinship; relative: ICharacterSummary }`, payload de submit usa `{ relativeId, kinship }` (nomes do `CharacterKinshipInputDto` real).
- Membros de organização usam `role` (confirmado) e `character: ICharacterSummary` — payload `{ characterId, role }` (nomes do `OrganizationMemberInputDto` real).
- `ICharacterSummary`/`IOrganizationSummary` seguem o formato enxuto realmente devolvido nos DTOs "shallow" (`id`, `name`, `referenceImage`).
- Auto-parentesco: implementado o bloqueio na UI (autocomplete de `CharacterKinshipField` exclui `excludeCharacterId={selectedCharacter?.id}` em modo edição), alinhado à validação do backend (`assertNoSelfKinship`, 400).
- Duplicidade: bloqueada na UI tanto em `CharacterKinshipField` (exclui parentes já adicionados das opções) quanto em `OrganizationMemberField` (exclui personagens já membros), alinhado às validações do backend (`assertNoDuplicateRelatives`, `Unique(['organization','character'])`).

Pendência sinalizada (não decidida por conta própria):
- O quadro "Organizações" do `CharacterView` (decisão do orquestrador: exibir nome E função/role de cada organização) **não pôde ser implementado com o campo role**, porque o contrato real do backend não o suporta: `CharacterResponseDto.organizations` é `OrganizationShallowResponseDto[]` (`{ id, name, referenceImage }`), sem `role` — o campo é montado por `CharactersService.findOrganizationsForCharacter`, que retorna apenas as `Organization`s vinculadas, sem carregar/expor o `OrganizationMember.role` correspondente a cada vínculo. Implementado exibindo apenas nome/avatar da organização (com ação de visualizar), igual ao quadro de Parentescos. Para exibir a função também seria necessário alterar o DTO/serviço do backend (`app-api`, fora do escopo deste agente) para incluir o `role` de cada membership do personagem.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Revisão realizada sobre todos os arquivos listados como entregues na etapa "1.
web-dev" (componentes de `personagens/` e `organizacoes/`, interfaces, stores,
schemas, rotas, sidebar, `EntityMentionViewDispatcher` e constantes de
`EntityMentions`), comparados ao padrão do CLAUDE.md, ao `spec.md` e ao contrato
real dos DTOs de `app-api/src/modules/characters` e
`app-api/src/modules/organizations`.

De forma geral, a implementação está muito aderente aos padrões do projeto:
usa os hooks genéricos de `hooks/Queries` com `invalidateQueryKeys` corretos em
todas as mutations (`/characters`, `/organizations`), não há `useQuery`/
`useMutation` avulsos; rotas centralizadas em `shared/routes.ts` sem paths
hardcoded; os dois itens novos foram corretamente adicionados à seção "Mundo"
já existente do Sidebar (nenhuma seção nova criada), com ícones `FiUser`/
`FiBriefcase` de `react-icons/fi` não reaproveitados de outros itens do menu;
formulários com `react-hook-form` + `zod` em `shared/formSchemas/`, stores por
feature em `store/PageStore/`, reaproveitamento de `DefaultInputs`/
`FormInputs`/`Modals`/`Texts`/`ImageAvatarPreview`/`TagBadge`/
`ImagePreviewDialog`/`RichTextViewer` em vez de componentes one-off; modo
criar/editar sempre derivado das stores `useSelectedCharacterStore`/
`useSelectedOrganizationStore` (nunca de prop manual); layouts de
`CharacterView` (imagem retrato, caveira condicional ao `isDead`, tags, raça,
quadro de descrição, e o grid com quadro de Parentescos ao lado do quadro de
Organizações) e `OrganizationView` (imagem quadrada, nome, tags, descrição,
quadro de Membros) batendo com o pedido do spec e com o padrão inline já usado
em `DivinityView`/`CreatureView`; nomes de campo (`isDead`, `referenceImage`,
`kinship`/`relative`, `role`/`character`) ajustados corretamente ao contrato
real do backend (divergente da proposta hipotética original do plano);
bloqueio de auto-parentesco e de duplicidade implementados nos autocompletes;
edição de card alterando apenas o texto livre (`kinship`/`role`), nunca o
personagem referenciado; `EntityMentionViewDispatcher` e as três constantes
irmãs de `shared/constants/EntityMentions` atualizadas de forma consistente
entre si; textos em pt-BR; nenhum uso de `process.env` ou path hardcoded nos
arquivos novos; nenhum ícone fora de `react-icons` (`FiX`/`GiDeathSkull`/
`MdOutlineFace` inclusos).

Achados:

- **[app-web/src/shared/interfaces/Entities/Character/index.ts:5-9] — Severidade: baixa/média** — `ICharacterSummary` não inclui o campo `isDead`, que existe de fato no DTO real retornado pelo backend (`CharacterShallowResponseDto`, em `app-api/src/modules/characters/dto/character-shallow-response.dto.ts`, tem `id`, `name`, `referenceImage` **e** `isDead`). A nota de "Decisões tomadas a partir do contrato real" registrada ao final da etapa 1 afirma que `ICharacterSummary`/`IOrganizationSummary` "seguem o formato enxuto realmente devolvido nos DTOs shallow (id, name, referenceImage)", o que é impreciso para `CharacterShallowResponseDto` (tem 4 campos, não 3). Consequência prática: `CharacterKinshipCard` e `OrganizationMemberCard` (que recebem `relative`/`character: ICharacterSummary`) não conseguem exibir o indicador de "morto" (ícone de caveira) ao lado do nome do parente/membro, mesmo quando o backend já entrega essa informação — ficando inconsistente com o indicador equivalente já usado em `CharactersListItem`/`CharacterView`.
  - Trecho: `export interface ICharacterSummary { id: string; name: string; referenceImage?: string | null; }`
  - Sugestão: adicionar `isDead: boolean;` à interface `ICharacterSummary`, mapeando o campo já retornado pela API; opcionalmente, reaproveitar essa informação para exibir o ícone de caveira também nos cards de parentesco/membro.

- **[app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx e app-web/src/app/(authorized)/organizacoes/components/OrganizationMemberField/index.tsx] — Severidade: baixa** — Os campos de busca de personagem (`DefaultAutocompleteInput`) e de texto livre (grau de parentesco / função, `DefaultTextInput`) são renderizados sem a prop `label`, dependendo apenas do `placeholder` como única pista textual; o mesmo ocorre no modo de edição inline de `CharacterKinshipCard`/`OrganizationMemberCard` (o `DefaultTextInput` de edição também não tem `label`). Diferente de campos equivalentes no resto do app (ex.: `LocationPointsOfInterestField`, que passa `label="Pontos de Interesse"` ao autocomplete, e todas as seções de filtro, que sempre passam `label="Nome"`), aqui não há um `<label>`/`aria-label` formalmente associado a esses inputs — apenas o rótulo de grupo "Parentescos"/"Membros" acima da linha inteira, que não é `htmlFor`-vinculado a nenhum dos dois inputs.
  - Trecho: `<DefaultAutocompleteInput<ICharacterListItem> id="character-kinship-search" options={options} ... placeholder="Buscar personagem por nome" />` (sem `label`)
  - Sugestão: passar `label` (ex.: "Personagem" / "Grau de parentesco" / "Função na organização") a cada input desses campos, ou ao menos um `aria-label` equivalente, para que tenham nome acessível formal e não dependam só do `placeholder`.

- **[app-web/src/app/(authorized)/personagens/components/CharacterKinshipField/index.tsx:4 e app-web/src/app/(authorized)/organizacoes/components/OrganizationMemberField/index.tsx:4] — Severidade: baixa (estilo)** — A linha de import `import { DefaultAutocompleteInput, DefaultTextInput } from '@/shared/components/Inputs';` ultrapassa o `printWidth: 80` configurado em `app-web/.prettierrc.json` (assim como algumas outras linhas pontuais nesses mesmos arquivos). Não bloqueia lint/build (não há plugin de prettier no `eslint.config.mjs`), mas diverge da formatação já aplicada no restante do código.
  - Trecho: `import { DefaultAutocompleteInput, DefaultTextInput } from '@/shared/components/Inputs';`
  - Sugestão: rodar `npm run format` para quebrar o import em múltiplas linhas, no padrão já usado nos demais arquivos do projeto.

Nenhum dos achados acima é bloqueante: são todos de severidade baixa ou
baixa/média, sem bugs de compilação/execução, sem violação de convenção
estrutural (pastas, hooks genéricos, `invalidateQueryKeys`, formulários,
stores) e sem duplicação de componentes já existentes.
