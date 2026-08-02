# Task Web: Fichas

## Contexto
Ver .claude/tasks/fichas/spec.md

Referências de padrão já existentes no `app-web` usadas como base deste plano:
- CRUD completo (listagem + modal de cadastro/edição + exclusão): feature `usuarios`
  (`app/(authorized)/usuarios/`) e `campanhas` (`app/(authorized)/campanhas/`).
- Página de detalhe com tratamento de 404 → toast + redirect:
  `app/(authorized)/campanhas/[id]/page.tsx`.
- Campo "autocomplete + lista com remoção" gerenciado fora do `react-hook-form` (estado local
  sincronizado no `reset`, mesclado no payload em `buildPayload`):
  `app/(authorized)/organizacoes/components/OrganizationMemberField` (usado por
  `OrganizationCreateForm`). `EntityReferenceListField` (`shared/components/`) foi avaliado mas
  não se aplica diretamente — seu modelo de seleção é o `EntityReferenceSelectionModal` sobre o
  tipo genérico `IEntityReference` (entityType/id, com suporte a menções), enquanto
  "Usuários Permitidos" precisa buscar usuários Google reais (`IUser`) por nome/e-mail via query
  paginada — o `OrganizationMemberField` é a referência mais próxima desse padrão de busca ao
  vivo + adicionar + remover individualmente.

**Observação de dependência:** não existe ainda `.claude/tasks/fichas/task-api.md`. Os nomes de
rota assumidos abaixo (`/sheets`, `/campaigns/visible`, `/users/google`) são estimativas
consistentes com a nomenclatura da spec (seção 1, 4 e 5) e devem ser confirmados/ajustados pelo
`web-dev` contra a implementação real da API (Swagger ou `task-api.md`, quando existir) no momento
da implementação — isso é um detalhe técnico de integração, não uma regra de negócio, e não deve
mudar nada do comportamento descrito na spec.

## Etapas

### 1. web-dev
**Status:** concluído

**Nota de correção de rotas aplicada durante a implementação:** o plano abaixo foi
escrito antes do backend e assumia `/campaigns/visible` para a consulta dedicada de
campanhas visíveis. A implementação real usa `GET /sheets/campaign-options` (array
simples, sem paginação, de `{ id, name }`), conforme corrigido pelo orquestrador — é
essa rota que foi efetivamente integrada em `useSheetCampaignOptionsQuery` e usada nos
três lugares (filtro da listagem, `SheetCreateForm`, autocomplete de `/fichas/[id]`).
Todas as demais rotas (`/sheets`, `/sheets/:id`, `/users/google`) foram implementadas
exatamente como corrigido, sem outras pendências.

Componentes: `app-web/src/app/(authorized)/fichas/components/SheetsFilterSection`,
`app-web/src/app/(authorized)/fichas/components/SheetCreateForm`,
`app-web/src/app/(authorized)/fichas/components/SheetsList`,
`app-web/src/app/(authorized)/fichas/components/SheetsListItem`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetImageEditModal`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetNameField`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetLevelField`,
`app-web/src/app/(authorized)/campanhas/components/CampaignAllowedUsersField`
(novo, integrado a `CampaignCreateForm` já existente).

Arquivos: `app-web/src/shared/routes.ts`,
`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts` (novo),
`app-web/src/shared/interfaces/Entities/Campaign/index.ts` (`allowedUsers` em
`ICampaign`), `app-web/src/shared/interfaces/Entities/User/index.ts`
(`IGoogleUserListFilters`), `app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/formSchemas/SheetFormSchema/index.ts` (novo),
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useSheetCampaignOptionsQuery/index.ts`
(novo), `app-web/src/hooks/Queries/EntityQueries/index.ts`,
`app-web/src/app/(authorized)/fichas/page.tsx` (novo),
`app-web/src/app/(authorized)/fichas/[id]/page.tsx` (novo),
`app-web/src/app/(authorized)/fichas/[id]/hooks/useFieldAutosave/index.ts` (novo),
`app-web/src/app/(authorized)/campanhas/components/CampaignCreateForm/index.tsx`
(campo "Usuários Permitidos" integrado).

#### Componentes (se necessário)

- Componente: `SheetsFilterSection`
  (`app/(authorized)/fichas/components/SheetsFilterSection/`)
  - Props: `nameValue: string`, `onNameChange: (value: string) => void`,
    `campaignValue: <opção de campanha> | null`, `onCampaignChange: (value) => void`,
    `campaignOptions: <lista de campanhas visíveis>`, `onSubmit: (event) => void`.
  - Comportamento esperado: segue o padrão `web-secao-filtros` (`CampaignsFilterSection` /
    `RacesFilterSection`) — nunca inputs de filtro soltos em `page.tsx`. Campo "Nome"
    (`DefaultTextInput` com ícone de busca) + campo "Campanha" (`DefaultAutocompleteInput`)
    cujas opções vêm da consulta dedicada de campanhas visíveis (seção 4 da spec), buscada com
    `perPage` alto (ex.: 100), igual ao padrão já usado para preencher dropdowns de filtro
    limitados (`RacesFilterSection`/categorias, `CharacterCreateForm`/raças). Botão "Filtrar".

- Componente: `SheetCreateForm`
  (`app/(authorized)/fichas/components/SheetCreateForm/`)
  - Props: `onSaved: () => void`.
  - Comportamento esperado: formulário de **cadastro apenas** (não há modo de edição neste
    modal — edição completa acontece só em `/fichas/[id]`, logo este componente é mais simples
    que `CampaignCreateForm`/`CharacterCreateForm`: sem `useSelectedXStore`, sem `isEditMode`,
    sem `useGetEntityById`). Campos: `name` (`FormTextInput`, obrigatório), `campaign`
    (`FormAutocompleteInput`, opcional, opções da consulta dedicada de campanhas visíveis,
    `perPage` alto), `referenceImage` (`FormTextInput`, opcional, URL). Não inclui `race` nem
    `level`. Usa `usePostEntity<ISheet, SheetPayload>({ url: '/sheets', invalidateQueryKeys:
    [['/sheets']] })`; ao enviar, omite `campaignId`/`referenceImage` do payload quando vazios
    (mesmo padrão de `buildPayload` de `CharacterCreateForm`).

- Componente: `SheetImageEditModal`
  (`app/(authorized)/fichas/[id]/components/SheetImageEditModal/`) — **dentro da pasta da
  página dinâmica**, nunca em `shared/components`.
  - Props: `open: boolean`, `onClose: () => void`, `currentImageUrl?: string | null`,
    `onSave: (url: string) => void`, `isSaving?: boolean`.
  - Comportamento esperado: modal simples (base `FormModal` ou estrutura equivalente) com um
    único input de texto (URL da imagem), pré-preenchido com o valor atual, e ação explícita de
    salvar/cancelar — **não é regido pelo debounce de autosave**. Ao confirmar, chama `onSave`
    imediatamente (o chamador dispara a mutação de atualização da ficha só com o campo
    `referenceImage`).

- Componente: `SheetPortraitImage`
  (`app/(authorized)/fichas/[id]/components/SheetPortraitImage/`) — dentro da pasta da página
  dinâmica.
  - Props: `imageUrl?: string | null`, `alt: string`, `onEditClick: () => void`.
  - Comportamento esperado: exibe a imagem de referência em formato retrato (proporção vertical,
    ex. `aspect-ratio` 3:4), diferente do `ImageAvatarPreview` compartilhado (que é circular/avatar
    pequeno) — por isso não é reaproveitável de `shared/components` e vive localmente. Mostra um
    placeholder quando não há imagem. Possui um botão de edição sobreposto que aciona
    `onEditClick` (abre o `SheetImageEditModal`).

- Componente: `SheetNameField`
  (`app/(authorized)/fichas/[id]/components/SheetNameField/`) — dentro da pasta da página
  dinâmica (input "estilizado" de uso exclusivo desta página, nunca em `shared/components`).
  - Props: `value: string`, `onChange: (value: string) => void`.
  - Comportamento esperado: `TextField` MUI `variant="standard"`, sem label, fonte grande e
    negrito (ex. `sx` com `fontSize`/`fontWeight` elevados, sem borda/underline visível fora do
    foco), ocupando a área ao lado da imagem. Delega o autosave ao hook descrito abaixo — este
    componente é só apresentação/controle do valor local, chamado a cada tecla.

- Componente: `SheetLevelField`
  (`app/(authorized)/fichas/[id]/components/SheetLevelField/`) — mesma pasta, mesmo motivo.
  - Props: `value: number`, `onChange: (value: number) => void`.
  - Comportamento esperado: `TextField` MUI `variant="standard"` numérico, com label "Nível"
    acima do campo, posicionado na extremidade oposta da linha do nome. Validação de UI: não
    aceita valores menores que 1 nem não inteiros (bloqueia/normaliza a entrada); valores
    inválidos não disparam o autosave (ver hook abaixo).

- **Hook de autosave por campo (ponto de maior risco técnico da demanda)**
  (`app/(authorized)/fichas/[id]/hooks/useFieldAutosave/` — local à página, não é
  compartilhado/genérico o suficiente para `shared/`, já que a lógica de "qual payload parcial
  enviar" é específica de cada campo da ficha).
  - Abordagem recomendada: **uma instância do hook por campo**, e não um único debounce
    compartilhado com um mapa de timers por chave. Como cada campo (`name`, `level`,
    `campaignId`, `raceId`) chama sua própria instância de `useFieldAutosave(...)`, cada
    instância mantém seu próprio `useRef<ReturnType<typeof setTimeout>>` isolado — o React já
    garante que estado/refs de chamadas de hook diferentes (uma por campo) não se cruzam. Isso
    satisfaz diretamente a regra "alterar um campo não cancela nem reinicia o timer de outro
    campo com alteração pendente" sem precisar de um registro/map manual por string de campo
    (uma implementação com map é uma alternativa aceitável, mas mais arriscada de acertar — a
    instância por campo é mais simples e à prova de erro).
  - Dentro de uma mesma instância (mesmo campo), o comportamento é o de um debounce comum:
    a cada mudança do valor daquele campo, cancela **apenas o timer daquele mesmo campo** (se
    houver) e agenda um novo para 2500ms à frente; ao disparar, chama a função de salvar
    daquele campo com o valor mais recente.
  - Deve pular o disparo inicial de sincronização (quando o valor local é setado a partir dos
    dados carregados via `GET /sheets/:id` no primeiro render) — só deve agendar o timer quando o
    valor muda por interação do usuário após a hidratação inicial, evitando um PUT desnecessário
    ao simplesmente abrir a página.
  - Cada instância dispara `usePutEntity` com um payload parcial contendo **apenas o campo que
    mudou** (ex.: `{ name: novoNome }`, `{ level: novoNivel }`, `{ campaignId: novoIdOuNull }`,
    `{ raceId: novoIdOuNull }`) contra `PUT /sheets/:id` — assume-se que a API aceita atualização
    parcial nesse endpoint (a confirmar com a implementação real da API).
  - Importante: o sucesso de cada autosave **não deve invalidar/refazer o `GET /sheets/:id`**
    da página atual (isso re-hidrataria todos os campos e poderia sobrescrever a digitação em
    outro campo que ainda tenha um timer pendente). Deve, no máximo, invalidar a query da
    listagem (`['/sheets']`) para que a listagem mostre dados atualizados quando revisitada; o
    estado local de cada campo já é a fonte da verdade durante a edição na página.
  - Exemplo do comportamento esperado (igual ao da spec): usuário altera "Nome" e, antes de
    2,5s, altera "Nível" — os dois salvam de forma independente, cada um 2,5s após sua própria
    última alteração; alterar "Nível" não adia nem cancela o salvamento pendente de "Nome".

#### Funcionalidade

**Rotas (`shared/routes.ts`)**
- Adicionar `sheets: '/fichas'` em `MENU_ROUTES` e em `APP_ROUTES.private`, e
  `sheetDetails: (id: string) => \`${MENU_ROUTES.sheets}/${id}\`` em `APP_ROUTES.private`
  (mesmo padrão de `campaigns`/`campaignDetails`). Nunca hardcodar o path `/fichas` em
  componentes — sempre importar de `APP_ROUTES`.

**Menu (`app/(authorized)/components/Sidebar`)**
- Em `data/index.ts`, adicionar o item `{ label: 'Fichas', href: APP_ROUTES.private.sheets, icon:
  FiFileText }` na primeira seção `NAV_SECTIONS` (a que não tem `title`), imediatamente depois do
  item "Campanhas".
- Em `index.tsx`, **não** adicionar `APP_ROUTES.private.sheets` a `GOOGLE_BLOCKED_ROUTES` — o
  item deve continuar visível tanto para usuários Google quanto locais.

**Interfaces (`shared/interfaces/Entities`)**
- Criar `Sheet/index.ts`:
  - `ISheetListItem`: `id`, `referenceImage?: string | null`, `name`, `campaign?: { id: string;
    name: string } | null` (dados suficientes para a listagem).
  - `ISheet extends IEntity`: `name`, `referenceImage?: string | null`, `level: number`,
    `campaign?: { id: string; name: string } | null`, `race?: ICharacterRace | null` (reaproveitar
    o formato já usado em `ICharacterRace` de `Entities/Character`), `createdBy: IUser`,
    `createdAt`, `updatedAt`.
  - `ISheetListFilters`: `name?`, `campaignId?`, `page?`, `perPage?`.
- Atualizar `Entities/Campaign/index.ts`: adicionar `allowedUsers: IUser[]` em `ICampaign`.
- Criar (ou reaproveitar `ICampaignListItem`) um tipo para os itens da consulta dedicada de
  campanhas visíveis — usar o mesmo formato de `ICampaignListItem` (`id`, `name`,
  `referenceImageUrl?`) é suficiente para os três usos (filtro da listagem, modal de cadastro de
  ficha, autocomplete de campanha em `/fichas/[id]`).
- Criar filtro para a consulta dedicada de usuários Google, ex. `IGoogleUserListFilters { search?:
  string; page?: number; perPage?: number }`, reaproveitando o tipo `IUser` já existente (já tem
  `provider`) como item de resposta.

**Listagem `/fichas` (`app/(authorized)/fichas/page.tsx`)**
- `useGetEntityList<ISheetListItem, ISheetListFilters>({ url: '/sheets', filters })` — a
  listagem já vem escopada ao usuário autenticado pelo backend (seção 3 da spec); o frontend não
  aplica filtro adicional de dono.
- Filtro por nome e por campanha via `SheetsFilterSection`, com o campo de campanha alimentado
  pela consulta dedicada assumida `GET /campaigns/visible` (a confirmar nome exato com a API).
- Botão "Novo" sempre visível (para Google e local) abrindo `FormModal` com `SheetCreateForm`.
- Tabela (`SheetsList` + `SheetsListItem`, seguindo `CampaignsList`/`CampaignsListItem`) com
  colunas Imagem/Nome/Campanha e ações por linha:
  - "Abrir ficha": link/botão que abre `APP_ROUTES.private.sheetDetails(sheet.id)` em **nova
    aba** (`target="_blank" rel="noopener noreferrer"`, não navegação na mesma aba).
  - "Excluir": abre `ConfirmationModal` + `useDeleteEntity({ url: '/sheets/:id',
    invalidateQueryKeys: [['/sheets']] })`, mesmo padrão de `CampaignsPage`.
  - Não há ação de "editar" nem modal de visualização nesta listagem — apenas as duas ações
    acima, ambas sempre visíveis (sem checagem de `isGoogleUser`, ver seção "Acesso Google"
    abaixo).
- Não é necessário um Zustand store (`store/PageStore/SheetsStore`) para esta feature: como não
  há edição via modal (só criação), o único estado local necessário é o item pendente de exclusão
  (`useState`), igual ao padrão já usado para o item pendente de exclusão em `CampaignsPage` —
  isso não é uma omissão, é consequência direta de a spec não prever edição por modal para
  fichas.

**Página dinâmica `/fichas/[id]` (`app/(authorized)/fichas/[id]/page.tsx`)**
- `useGetEntityById<ISheet>({ url: '/sheets/${id}' })`. Tratamento de erro idêntico ao de
  `campanhas/[id]/page.tsx`: enquanto carrega, spinner; se `error.response?.status === 404`,
  `showToast({ type: 'error', ... })` e `router.push(APP_ROUTES.private.sheets)`; se erro
  diferente de 404, tela de erro com botão "Voltar para Fichas"; se sucesso, renderiza o layout.
- Layout (grid/flex responsivo):
  - Linha principal: `SheetPortraitImage` à esquerda (com `SheetImageEditModal` acoplado); ao
    lado, `SheetNameField` (sem label, fonte grande/negrito) ocupando o espaço central; na
    extremidade oposta da mesma linha, `SheetLevelField` (com label "Nível" acima).
  - Abaixo da linha: campo `campaign` — `DefaultAutocompleteInput` (não `Form*`, já que esta
    página não usa `react-hook-form`/submit único, e sim autosave por campo) com opções da
    consulta dedicada de campanhas visíveis.
  - Abaixo do campo `campaign`: campo `race` — `DefaultAutocompleteInput` com opções de
    `GET /races` (catálogo completo já existente, sem filtragem adicional por usuário/provider,
    igual ao autocomplete de raça de `CharacterCreateForm`).
- Autosave: `name`, `level`, `campaignId` e `raceId` usam cada um sua própria instância de
  `useFieldAutosave` (ver seção de Componentes acima) com debounce de 2500ms independente por
  campo.
- A imagem (`referenceImage`) é salva via `SheetImageEditModal`, com ação explícita de
  salvar/cancelar, disparando uma chamada `PUT /sheets/:id` imediata com `{ referenceImage }` —
  não passa pelo debounce de autosave.
- Ação de excluir a ficha: botão na página (ex. próximo ao topo) que abre `ConfirmationModal` +
  `useDeleteEntity({ url: '/sheets/:id' })`; ao concluir, `router.push(APP_ROUTES.private.sheets)`
  (na mesma aba, diferente da listagem, pois aqui é uma navegação de saída após a exclusão, não
  uma abertura de novo contexto) com toast de sucesso.
- Acesso: local pode visualizar/editar/excluir qualquer ficha por esta rota; Google só acessa a
  própria (backend responde 404 para as demais, já coberto pelo tratamento de erro acima). Não é
  necessária nenhuma checagem adicional de `isGoogleUser` no frontend desta página — quem chegar
  até aqui sem erro 404 já tem permissão de acesso total (visualizar, editar por autosave e
  excluir), independentemente do provedor.

**Formulário de campanha — "Usuários Permitidos" (`CampaignCreateForm`)**
- Novo componente `CampaignAllowedUsersField`
  (`app/(authorized)/campanhas/components/CampaignAllowedUsersField/`), modelado sobre
  `OrganizationMemberField`: busca (texto local + `useGetEntityList<IUser, IGoogleUserListFilters>
  ({ url: '/users/google', filters: { search: searchText, perPage: 10 } })`, endpoint assumido —
  consulta dedicada da seção 5 da spec) + `DefaultAutocompleteInput` para selecionar um usuário
  Google + botão "Adicionar" (mesmo padrão de confirmação explícita de
  `OrganizationMemberField`, já que não há campo secundário como "função" aqui — apenas o próprio
  usuário) + lista dos usuários já adicionados, cada um com botão de remoção individual. Filtra
  das opções os usuários já presentes na lista atual (evita duplicidade), igual ao filtro de
  `selectedIds` em `OrganizationMemberField`.
- Em `CampaignCreateForm`: `allowedUsers` é gerenciado como estado local (`useState<IUser[]>`),
  fora do `react-hook-form` — mesmo padrão de `members` em `OrganizationCreateForm`. Sincronizado
  no mesmo `useEffect` de `reset` (a partir de `campaignDetail.allowedUsers`) e resetado para `[]`
  ao sair do modo edição. Posicionado logo abaixo de `FormRichTextInput` "Descrição" (antes de
  `CampaignSectionsField`). No `buildPayload`, adiciona `allowedUserIds: allowedUsers.map(u =>
  u.id)` ao payload enviado em `POST/PUT /campaigns`.
- Este campo só aparece para quem já tem acesso a `CampaignCreateForm` — como o módulo de
  Campanhas continua bloqueado para Google (`GOOGLE_BLOCKED_ROUTES` já inclui
  `APP_ROUTES.private.campaigns`, sem alteração aqui), nenhuma checagem adicional de
  `isGoogleUser` é necessária dentro deste formulário especificamente para este campo.

**Formulário/validação — resumo**
- `SheetFormSchema` (`shared/formSchemas/SheetFormSchema/index.ts`): schema único, sem variante
  de edição (não há reuso deste schema para editar — edição é por autosave em outra página).
  - `name: z.string().min(1, 'Informe o nome')`.
  - `campaignId: z.string().optional()` (ou `z.string()` com default `''`, seguindo o padrão de
    `raceId`/`familyId` de `CharacterFormSchema`, enviado como `undefined` quando vazio).
  - `referenceImage: z.string().refine(value => value === '' || z.string().url().safeParse(value)
    .success, 'Informe uma URL de imagem válida')` — mesmo padrão de `referenceImage` de
    `CharacterFormSchema`/`OrganizationFormSchema`.
  - Valores padrão: `{ name: '', campaignId: '', referenceImage: '' }`.
  - Não inclui `race` nem `level` (fora do escopo deste modal).
- Validação de `level` (só relevante na página `/fichas/[id]`, fora de qualquer schema zod, já
  que não há formulário de submit único nessa página): inteiro, mínimo 1, aplicada localmente no
  `SheetLevelField`/antes de agendar o autosave.

**Acesso Google — resumo por área**
- Listagem `/fichas` e página `/fichas/[id]`: **outro comportamento, não o padrão** — usuários
  Google têm acesso total de criar, editar (autosave) e excluir as próprias fichas, sem nenhuma
  ação oculta. Isso é uma exceção intencional e explícita já definida na spec (seção 3): fichas
  são uma área pessoal do jogador, não um recurso de mundo/campanha. Nenhum botão/ação de
  criar/editar/excluir é ocultado para Google nesta feature.
- Formulário de Campanha / campo "Usuários Permitidos": **padrão inalterado** — usuários Google
  continuam sem qualquer acesso ao módulo de Campanhas (bloqueio já existente via
  `GOOGLE_BLOCKED_ROUTES`/backend `@GoogleAccess('blocked')`), então este campo nunca chega a ser
  renderizado para eles.

### 2. web-dev-codereviewer
**Status:** concluído
- Revisar tudo acima

## Revisão

- **`app-web/src/app/(authorized)/fichas/[id]/page.tsx:158-179,277-281,317-323`** —
  Bug funcional: a imagem de referência (`referenceImage`) não é espelhada em estado
  local (diferente de `name`/`level`/`campaign`/`race`, que vivem em `useState` e são
  exibidos a partir desse estado). `SheetPortraitImage` e `SheetImageEditModal` recebem
  `imageUrl`/`currentImageUrl` direto de `sheet.referenceImage` (dado em cache do
  `useGetEntityById`). Como o `updateImageMutation` só tem
  `invalidateQueryKeys: [['/sheets']]` (a listagem) — corretamente sem invalidar
  `['/sheets/${sheetId}']`, para não conflitar com o autosave dos outros campos — e não
  há nenhum `queryClient.setQueryData` no `onSuccess`, o retrato exibido continua
  mostrando a imagem antiga mesmo depois de um salvamento bem-sucedido pelo modal, até
  que a página seja recarregada manualmente (ou até um refetch em segundo plano
  acontecer por outro motivo, ex. refoco de janela).
  - Trecho: `onSuccess: () => { showToast(...); setIsImageModalOpen(false); }` (sem
    atualizar `sheet.referenceImage`) e `<SheetPortraitImage imageUrl={sheet.referenceImage} ... />`.
  - Sugestão: manter um estado local `referenceImage` hidratado junto com
    `name`/`level`/`campaign`/`race` (mesmo padrão) e atualizá-lo em
    `handleImageSave`/`onSuccess`, ou então, no `onSuccess` de `updateImageMutation`,
    chamar `queryClient.setQueryData(['/sheets/${sheetId}'], (old) => old && { ...old, referenceImage: url })`
    para refletir a imagem imediatamente sem precisar invalidar/refazer o GET.

- **`app-web/src/hooks/Queries/EntityQueries/useSheetCampaignOptionsQuery/index.ts:9-19`**
  — Tipagem incoerente com o DTO real: a resposta de `GET /sheets/campaign-options` é
  tipada como `ICampaignListItem[]`, que exige `tags: ITag[]` obrigatório, mas a nota de
  correção de rotas registrada na etapa 1 desta mesma task deixa explícito que esse
  endpoint retorna "array simples, sem paginação, de `{ id, name }`" (sem `tags`, sem
  `referenceImageUrl`). O plano original também previa reaproveitar apenas o formato
  "`id`, `name`, `referenceImageUrl?`", não a interface inteira com `tags`.
  - Trecho: `import { IAxioDataError, ICampaignListItem } from '@/shared/interfaces';`
    e `useQuery<ICampaignListItem[], ...>`.
  - Sugestão: criar uma interface enxuta específica (ex.
    `ISheetCampaignOption { id: string; name: string; referenceImageUrl?: string | null }`)
    e usá-la nos três consumidores (`SheetsFilterSection`, `SheetCreateForm`,
    `/fichas/[id]`) em vez de `ICampaignListItem`.

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetNameField/index.tsx`** —
  Acessibilidade: o campo não tem `label` visível (por design, conforme spec) nem
  `aria-label`/`aria-labelledby`; depende apenas do `placeholder` ("Nome da ficha"),
  que não é um substituto confiável de nome acessível para leitores de tela (some
  quando o campo é preenchido e não é tratado como accessible name por todas as
  tecnologias assistivas).
  - Trecho: `<TextField id="sheet-name-field" variant="standard" ... placeholder="Nome da ficha" ... />`
    sem `aria-label`.
  - Sugestão: adicionar `slotProps={{ htmlInput: { 'aria-label': 'Nome da ficha' } }}`
    (ou `aria-label` equivalente) ao `TextField` para manter o nome acessível mesmo com
    o campo preenchido.

- **`app-web/src/app/(authorized)/fichas/[id]/hooks/useFieldAutosave/index.ts:55-59`**
  — Observação (severidade baixa): o `useEffect` limpa o timer pendente também no
  cleanup de desmontagem do componente, então uma alteração feita a menos de 2,5s antes
  de o usuário fechar a aba/navegar para outra página é descartada silenciosamente, sem
  nunca ser enviada à API (nenhum "flush" no unmount). Não é um problema introduzido
  pela regra de independência por campo (que está corretamente implementada — ver
  abaixo), mas é um ponto de possível perda de edição que vale considerar.
  - Sugestão: avaliar disparar `onSaveRef.current(value)` de forma síncrona no cleanup
    do efeito ao desmontar (ou documentar explicitamente que esse é um trade-off aceito
    do autosave).

**Pontos de maior risco técnico validados (sem problemas encontrados):**
- `useFieldAutosave`: cada campo (`name`, `level`, `campaignId`, `raceId`) usa sua
  própria instância do hook com seu próprio `useRef` de timer — alterar um campo não
  cancela nem reinicia o timer de outro campo com alteração pendente (confirmado por
  inspeção: refs/estado de instâncias de hooks diferentes nunca se cruzam em React).
- Hidratação inicial: a combinação do flag `enabled` (ligado a um `hasHydrated`
  compartilhado, que só vira `true` depois que os 4 campos são sincronizados a partir
  do `GET /sheets/:id` num único efeito) com o `isFirstRunRef` por instância garante
  que a primeira execução "real" do efeito (already `enabled`) nunca agenda um timer —
  não há PUT espúrio ao simplesmente abrir a página. Como os campos só ficam
  interativos depois que `sheet` carrega (a página retorna `null`/spinner antes disso),
  não há brecha para o usuário interagir antes da hidratação.
  Como os `useFieldAutosave` das 4 mutações usam `invalidateQueryKeys: [['/sheets']]`
  (nunca `['/sheets/${sheetId}']`), e o TanStack Query faz *partial match* por posição
  no array da query key, a invalidação da listagem nunca alcança a query de detalhe da
  própria página — o `GET /sheets/:id` não é refeito pelo autosave e não sobrescreve
  edições pendentes em outros campos. Além disso, como a sincronização de estado local
  a partir de `sheet` é guardada por `hasHydrated` (só roda uma vez), mesmo um refetch
  em segundo plano do detalhe (ex. refoco de janela) não sobrescreveria os estados
  locais de `name`/`level`/`campaign`/`race` já hidratados.

**Correções aplicadas (achados 1, 2 e 3):**
- Achado 1 (bug funcional): adicionado estado local `referenceImage` em
  `app-web/src/app/(authorized)/fichas/[id]/page.tsx`, hidratado no mesmo efeito de
  `name`/`level`/`campaign`/`race` a partir de `sheet.referenceImage`. `SheetPortraitImage`
  e `SheetImageEditModal` agora recebem `imageUrl`/`currentImageUrl` desse estado local em
  vez de `sheet.referenceImage`. O `onSuccess` de `updateImageMutation` agora recebe
  `(_data, payload)` e chama `setReferenceImage(payload.referenceImage)`, atualizando o
  retrato imediatamente após salvar. `invalidateQueryKeys: [['/sheets']]` foi mantido
  inalterado (sem invalidar `['/sheets/${sheetId}']`), preservando o isolamento do
  autosave dos demais campos.
- Achado 2 (tipagem incoerente): criada a interface enxuta `ISheetCampaignOption { id:
  string; name: string }` em `app-web/src/shared/interfaces/Entities/Sheet/index.ts`.
  `useSheetCampaignOptionsQuery` agora tipa a resposta de `GET /sheets/campaign-options`
  como `ISheetCampaignOption[]`. Os três consumidores (`SheetsFilterSection`,
  `SheetCreateForm`, `fichas/page.tsx` e `fichas/[id]/page.tsx`) foram atualizados para usar
  `ISheetCampaignOption` em vez de `ICampaignListItem`.
- Achado 3 (acessibilidade): adicionado `slotProps={{ htmlInput: { 'aria-label': 'Nome da
  ficha' } }}` ao `TextField` de `SheetNameField`, garantindo nome acessível mesmo com o
  campo preenchido (placeholder deixa de ser o único mecanismo).
- Achado 4 (observação de severidade baixa sobre flush no unmount de `useFieldAutosave`)
  não foi alterado por não ter sido incluído no escopo desta correção; permanece como
  trade-off aceito registrado na revisão original.

**Demais itens do escopo (sem problemas encontrados):** estrutura de pastas (inputs
estilizados de uso exclusivo da página dinâmica corretamente em
`app-web/src/app/(authorized)/fichas/[id]/components/`, nunca em `shared/components`),
rotas centralizadas em `shared/routes.ts`, item de menu "Fichas" fora de
`GOOGLE_BLOCKED_ROUTES`, hooks genéricos de `hooks/Queries` usados em vez de
`useQuery`/`useMutation` bespoke, `SheetFormSchema` com `zod` (não Yup) e mensagens em
pt-BR, `SheetsFilterSection` apresentacional (sem estado/API própria) seguindo o padrão
`web-secao-filtros`, `SheetCreateForm` mais simples (sem `isEditMode`/store, conforme
esperado por não haver edição via modal), botão "Abrir ficha" em nova aba
(`target="_blank" rel="noopener noreferrer"`), exclusão da listagem via
`ConfirmationModal` + `useDeleteEntity` com `invalidateQueryKeys` corretos,
`CampaignAllowedUsersField` modelado corretamente sobre `OrganizationMemberField` e
integrado a `CampaignCreateForm` (estado local fora do `react-hook-form`, sincronizado
no `reset`/saída do modo edição, incluído em `buildPayload` como `allowedUserIds`),
ícones exclusivamente de `react-icons` com `aria-label` em pt-BR nos `IconButton` sem
texto visível, nenhuma ação Google oculta em `/fichas` e `/fichas/[id]` (conforme
exceção explícita da spec), nenhuma checagem adicional de Google no campo "Usuários
Permitidos" (módulo de Campanhas continua bloqueado para Google).

## Re-revisão (pós-correção)

Escopo desta rodada: validar especificamente as correções aplicadas aos achados 1
(imagem não atualizava na tela), 2 (tipagem `ICampaignListItem[]` → `ISheetCampaignOption`)
e 3 (aria-label em `SheetNameField`), com atenção crítica a não ter quebrado o
isolamento do autosave por campo. Arquivos relidos por inteiro:
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetImageEditModal/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetNameField/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/hooks/useFieldAutosave/index.ts`,
`app-web/src/app/(authorized)/fichas/page.tsx`,
`app-web/src/app/(authorized)/fichas/components/SheetCreateForm/index.tsx`,
`app-web/src/app/(authorized)/fichas/components/SheetsFilterSection/index.tsx`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useSheetCampaignOptionsQuery/index.ts`,
`app-web/src/hooks/Queries/DefaultQueries/usePutEntity/index.ts`,
`app-web/src/hooks/Queries/DefaultQueries/useGetEntityById/index.ts`,
`app-web/src/hooks/Queries/DefaultQueries/useGetEntityList/index.ts`.

Aprovado. Nenhum problema encontrado nas correções aplicadas.

1. **Achado 1 (imagem não atualizava) — corrigido corretamente.** Foi adicionado
   `const [referenceImage, setReferenceImage] = useState<string | null>(null)`
   (`page.tsx:75`), hidratado no mesmo `useEffect` guardado por `hasHydrated` que já
   sincroniza `name`/`level`/`campaign`/`race` (`page.tsx:79-90`,
   `setReferenceImage(sheet.referenceImage ?? null)`). `SheetPortraitImage` passou a
   receber `imageUrl={referenceImage}` (`page.tsx:281`) e `SheetImageEditModal` passou a
   receber `currentImageUrl={referenceImage}` (`page.tsx:323`), em vez de
   `sheet.referenceImage` direto do cache do `useGetEntityById`. O
   `onSuccess: (_data, payload) => { setReferenceImage(payload.referenceImage); ... }`
   de `updateImageMutation` (`page.tsx:166-167`) confere com a assinatura real de
   `usePutEntity` (`onSuccess?: (data: TResponse, payload: TPayload) => void`, ver
   `usePutEntity/index.ts:12,30`), então `payload.referenceImage` (`string | null`) é
   corretamente atribuído ao estado local — o retrato e o campo do modal agora refletem
   a nova URL imediatamente após salvar, sem depender de refetch/reload. Também
   confirmado que `SheetImageEditModal` já re-hidrata seu próprio input a partir de
   `currentImageUrl` sempre que reaberto (`useEffect` em `SheetImageEditModal/index.tsx:25-29`
   dependente de `open`/`currentImageUrl`), então reabrir o modal depois de salvar mostra
   a URL correta.

2. **Isolamento do autosave por campo — não foi quebrado.** Confirmado que
   `invalidateQueryKeys: [['/sheets']]` permanece inalterado em todas as 5 mutações de
   `page.tsx` (`name`, `level`, `campaignId`, `raceId` e a nova de imagem), e que **não**
   foi introduzida nenhuma invalidação de `['/sheets/${sheetId}']`. Verificado também na
   origem por que isso é seguro e não é apenas uma convenção informal: `useGetEntityById`
   usa `queryKey: [url]`, ou seja a query de detalhe da ficha atual é
   `['/sheets/${sheetId}']` (string única já interpolada com o id) — o TanStack Query
   faz correspondência parcial por igualdade posicional de cada elemento do array, não
   por prefixo de string, então o elemento `'/sheets'` da chave de invalidação nunca é
   igual a `'/sheets/${sheetId}'` e a invalidação da listagem (`useGetEntityList`, que usa
   `queryKey: [url, filters]` = `['/sheets', filters]`) nunca alcança a query de detalhe.
   A correção do achado 1 não mexeu em nenhum `invalidateQueryKeys` — apenas adicionou
   `setReferenceImage` local no `onSuccess`, então essa garantia permanece intacta. Cada
   um dos 4 campos com autosave (`name`, `level`, `campaignId`, `raceId`) continua usando
   sua própria instância de `useFieldAutosave` com seu próprio `useRef<...>` de timer
   isolado (`useFieldAutosave/index.ts` inalterado desde a revisão original) — inspeção
   confirma que alterar um campo não cancela nem reinicia o timer de outro.

3. **Nenhum re-render/loop ou autosave espúrio introduzido pela hidratação de
   `referenceImage`.** O novo `setReferenceImage` foi inserido dentro do mesmo `useEffect`
   já existente, guardado pelo mesmo `hasHydrated` (que só permite a execução do corpo
   uma única vez) e com a mesma lista de dependências `[sheet, hasHydrated]` — não foi
   criado nenhum efeito novo nem alterada nenhuma dependência que pudesse causar
   reexecução adicional. Como `referenceImage` não é lido por nenhuma instância de
   `useFieldAutosave` (a imagem é salva só via `SheetImageEditModal`/`handleImageSave`,
   fora do debounce, conforme a spec), a nova hidratação não tem como disparar autosave
   em `name`/`level`/`campaign`/`race`. O `onSuccess` de `updateImageMutation` também não
   provoca invalidação/refetch do `GET /sheets/:id` (ver ponto 2), então não há
   re-hidratação em cascata que pudesse reabrir a janela do `isFirstRunRef` dos outros
   campos.

4. **`ISheetCampaignOption` aplicada de forma consistente em todos os consumidores.**
   A interface `{ id: string; name: string }` foi definida em
   `shared/interfaces/Entities/Sheet/index.ts:30-33` e é usada de ponta a ponta:
   `useSheetCampaignOptionsQuery` tipa tanto o `useQuery<ISheetCampaignOption[], ...>`
   quanto o `api.get<ISheetCampaignOption[]>('/sheets/campaign-options')`;
   `fichas/page.tsx` (estado `campaignInput`), `fichas/[id]/page.tsx` (estado `campaign`
   e o `DefaultAutocompleteInput<ISheetCampaignOption>`), `SheetsFilterSection`
   (`campaignValue`/`onCampaignChange`/`campaignOptions`) e `SheetCreateForm`
   (`FormAutocompleteInput<SheetFormData, ISheetCampaignOption>`) usam todos o mesmo
   tipo. Não restou nenhuma referência a `ICampaignListItem` em código relacionado a
   fichas (a única ocorrência remanescente de `ICampaignListItem` no projeto é o uso
   legítimo e não relacionado em `app/(authorized)/campanhas/**`).

Achado 3 (aria-label em `SheetNameField`) e o registro do achado de severidade baixa
sobre flush no unmount de `useFieldAutosave` (não corrigido, trade-off aceito) não foram
reexaminados em profundidade nesta rodada por estarem fora do escopo desta re-revisão
focada (que pediu validação específica dos achados 1, 2 e do isolamento do autosave),
mas uma checagem rápida confirma que `slotProps={{ htmlInput: { 'aria-label': 'Nome da
ficha' } }}` está presente em `SheetNameField/index.tsx`, consistente com o que foi
reportado como corrigido.
