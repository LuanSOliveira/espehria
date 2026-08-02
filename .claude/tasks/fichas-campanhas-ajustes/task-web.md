# Task Web: Ajustes em Fichas e Campanhas (navegação, layout da ficha e gestão de vínculos da campanha)

## Contexto
Não existe `spec.md` para esta demanda — os requisitos completos foram fornecidos diretamente
pelo solicitante (ver mensagem de origem) e estão detalhados abaixo. O backend correspondente
está sendo planejado em paralelo em `.claude/tasks/fichas-campanhas-ajustes/task-api.md`; na
execução, ler esse arquivo (se já existir) para confirmar as rotas exatas dos endpoints novos
antes de implementar as integrações descritas abaixo. Caso `task-api.md` ainda não exista no
momento da execução, seguir os endpoints assumidos aqui e ajustá-los conforme o contrato real
publicado pelo backend.

## Etapas

### 1. web-dev

#### Componentes (se necessário)

- Componente: `SheetPortraitImage` (`app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage/index.tsx`) — **modificação**, não criação do zero.
  - Props: manter `imageUrl`, `alt`, `onEditClick` como hoje.
  - Comportamento esperado: envolver a imagem (ou o placeholder `FiImage`, se não houver imagem) em um elemento clicável (`role="button"`, `tabIndex`, `aria-label` do tipo `Ampliar imagem de ${alt}`, `cursor: pointer`) que abre um `@/shared/components/ImagePreviewDialog` com `imageUrl`/`alt` — reaproveitar o componente compartilhado tal como está, sem alterá-lo. Seguir o padrão de estado local `isImagePreviewOpen` usado em `personagens/components/CharacterView/index.tsx` (linhas ~40, ~78-114). O `IconButton` de editar (`FiEdit2`) deve continuar funcionando exatamente como hoje; seu `onClick` deve chamar `event.stopPropagation()` antes de `onEditClick()` para não disparar o preview. Se não houver imagem (`imageUrl` vazio), o clique não deve abrir preview (não há imagem para ampliar) — manter só o botão de editar ativo.

- Componente: `SheetCampaignField` (novo, em `app-web/src/app/(authorized)/fichas/[id]/components/SheetCampaignField/index.tsx`).
  - Props: `value: ISheetCampaignOption | null`, `onChange: (value: ISheetCampaignOption | null) => void`, `options: ISheetCampaignOption[]`.
  - Comportamento esperado: `Autocomplete` do MUI (`getOptionLabel` por `name`) com `renderInput` usando `TextField variant="standard"` e os mesmos overrides de `sx` de `SheetNameField` (bordas customizadas com `APP_COLORS.goldDark`/`APP_COLORS.gold`), porém com `fontSize` menor que o nome (que usa `2rem`) e sem `fontWeight: 700` — algo coerente com hierarquia visual (ex.: `1rem`–`1.125rem`), já que este campo representa um dado secundário (campanha), não o nome/level principal. Exibir um `Label` (`@/shared/components/Texts`) "Campanha" acima, no mesmo padrão do `SheetLevelField`. Placeholder "Selecione a campanha".
  - Nota de investigação: `DefaultAutocompleteInput` (`@/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput`) **não** aceita nenhuma prop de variant — ele hardcoda `variant="outlined"` com `APP_INPUT_STYLES.textField`/`APP_INPUT_STYLES.autocompleteField`, usados em várias telas do projeto. Estender esse componente para suportar variant customizaria o visual padrão de formulário em todo o app; por isso, criar componentes dedicados aqui é a opção mais segura, em vez de arriscar efeitos colaterais no componente compartilhado.

- Componente: `SheetRaceField` (novo, em `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`).
  - Props: `value: IRaceListItem | null`, `onChange: (value: IRaceListItem | null) => void`, `options: IRaceListItem[]`.
  - Comportamento esperado: mesmo padrão visual do `SheetCampaignField` (Autocomplete + `TextField variant="standard"`, mesmo tamanho de fonte reduzido), `Label` "Raça", placeholder "Selecione a raça". A lógica de conversão de `IRaceListItem` selecionado para `ICharacterRace` (`{ id, name }`) permanece na página, como hoje.

- Componente: `CampaignAllowedUsersModal` (novo, em `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignAllowedUsersModal/index.tsx`).
  - Props: `open: boolean`, `onClose: () => void`, `campaignId: string`, `allowedUsers: IUser[]`.
  - Comportamento esperado: usar `@/shared/components/Modals` `ViewModal` (título "Usuários Permitidos"), listando `allowedUsers` (já carregados via `campaign.allowedUsers`, sem necessidade de query paginada própria — o dado já vem no `useGetEntityById<ICampaign>` da página). Cada linha mostra nome/e-mail (padrão similar ao já usado em `campanhas/components/CampaignAllowedUsersField`, linhas 78-102) com um ícone de remover (`FiTrash2`, tooltip "Remover"). Ao clicar em remover, abrir um `ConfirmationModal` cujo texto deixe claro que a ação também desvincula, em cascata, as fichas desse usuário nessa campanha (ex.: "Tem certeza que deseja remover '<nome>' dos usuários permitidos desta campanha? As fichas vinculadas a este usuário nesta campanha também serão desvinculadas."). Confirmar dispara `useDeleteEntity` para o endpoint de remoção do usuário permitido (ver seção Integrações abaixo), com `invalidateQueryKeys: [['/campaigns/' + campaignId]]` para o `ViewModal`/página recarregar `allowedUsers` atualizado, e toast de sucesso/erro em pt-BR. Seguindo o padrão de acesso Google (ver subseção "Acesso Google" abaixo), esconder a ação de remover para usuários `provider: 'google'`, mantendo apenas a visualização da lista.

- Componente: `CampaignSheetsModal` (novo, em `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsModal/index.tsx`), seguindo o padrão de organização de `PlannedSessionsSection`.
  - Props: `open: boolean`, `onClose: () => void`, `campaignId: string`.
  - Comportamento esperado: `ViewModal` (título "Fichas Cadastradas") contendo uma listagem paginada das fichas vinculadas à campanha via `useGetEntityList` no endpoint novo do backend (ver Integrações), com colunas Imagem/Nome (reaproveitar visualmente o padrão de `SheetsList`/`SheetsListItem`, mas dentro do modal — pode ser um sub-componente `CampaignSheetsList`/`CampaignSheetsListItem` locais em `campanhas/[id]/components/`, ou renderizado diretamente dentro do modal se a listagem for simples; decidir na execução seguindo o padrão de tabela + `TablePagination` já usado por `PlannedSessionsList`). Cada linha tem uma ação de "Remover" (ícone `FiTrash2`, tooltip "Remover"/"Desvincular") que abre `ConfirmationModal` com texto explícito de que a ficha **não será excluída**, apenas desvinculada desta campanha (ex.: "Tem certeza que deseja desvincular a ficha '<nome>' desta campanha? A ficha não será excluída, apenas deixará de pertencer a esta campanha."). Confirmar dispara `useDeleteEntity` (ou `usePutEntity`, conforme o contrato final do backend) no endpoint de desvínculo, invalidando a lista do modal (query key do endpoint de listagem) e, se o backend também repassar isso via `campaign` embutido em outros lugares, considerar invalidar `['/sheets']`. Toast de sucesso/erro em pt-BR. Aplicar o mesmo padrão de acesso Google: esconder a ação de remover para `provider: 'google'`.

#### Funcionalidade

- **Páginas/rotas afetadas**:
  - `app-web/src/app/(authorized)/fichas/page.tsx` — indiretamente, via `SheetsListItem`.
  - `app-web/src/app/(authorized)/fichas/[id]/page.tsx` — reestruturação de layout e remoção da exclusão.
  - `app-web/src/app/(authorized)/campanhas/[id]/page.tsx` — nova linha de ações com 2 modais novos.
  - Nenhuma rota nova é criada; todas as navegações usam `APP_ROUTES.private.sheets`, `APP_ROUTES.private.sheetDetails(id)` e `APP_ROUTES.private.campaigns`, já existentes em `@/shared/routes`.

- **1. `fichas/components/SheetsListItem/index.tsx`** — trocar a navegação de nova aba para navegação client-side na mesma aba:
  - Remover `component="a"`, `href`, `target="_blank"`, `rel="noopener noreferrer"` do `IconButton` de "Abrir ficha".
  - Importar `useRouter` de `next/navigation` e adicionar `onClick={() => router.push(APP_ROUTES.private.sheetDetails(sheet.id))}`.
  - Trocar o ícone `FiExternalLink` (que sugere abrir em nova aba/janela) por `FiEye`, consistente com o ícone de "visualizar" já usado em praticamente todas as outras listagens do projeto (`CampaignsListItem`, `CharactersListItem`, etc.) — manter o `aria-label`/`Tooltip` com o texto "Abrir ficha" (não trocar para "Visualizar", para preservar a semântica pedida).
  - Remover o import de `FiExternalLink` se não for mais usado em outro lugar do arquivo.

- **2. `fichas/[id]/page.tsx`** — reestruturação de UI/layout:
  - Remover: o bloco `<div className="flex justify-end">` com o `SecondaryButton` "Excluir ficha", o `ConfirmationModal` de exclusão, o estado `isDeleteModalOpen`, a mutation `deleteSheetMutation` (`useDeleteEntity` para `/sheets/${sheetId}`), e os imports que ficarem órfãos (`FiTrash2`, `useDeleteEntity` — verificar se `SecondaryButton` continua em uso no estado de erro da página, que já o utiliza para "Voltar para Fichas"; se sim, manter o import).
  - Adicionar um botão/ação de "Voltar" no topo da página, no lugar onde ficava o botão de excluir (ou alinhado à esquerda, seguindo o padrão visual do projeto): `SecondaryButton` com ícone `FiArrowLeft`, texto "Voltar", `onClick={() => router.push(APP_ROUTES.private.sheets)}`.
  - Reestruturar o bloco de imagem + campos (linhas ~279-318 hoje): a imagem (`SheetPortraitImage`) fica à esquerda; à direita, uma coluna (`flex flex-col gap-*`) com, em ordem: (1) a linha já existente com `SheetNameField` + `SheetLevelField` lado a lado; (2) `SheetCampaignField`; (3) `SheetRaceField`. A altura da imagem deve acompanhar a altura total dessas 4 informações (usar `sm:items-stretch` no container flex pai, ou equivalente, para a imagem esticar na altura da coluna à direita, mantendo o `aspectRatio` já definido em `SheetPortraitImage` — avaliar na execução se é necessário ajustar `SheetPortraitImage` para aceitar altura flexível via `h-full` quando dentro deste layout). Manter responsividade: empilhar verticalmente em telas pequenas (`flex-col` por padrão, `sm:flex-row` a partir do breakpoint `sm`), como já ocorre hoje.
  - Remover o bloco antigo `<div className="mt-6 flex flex-col gap-4">` com os dois `DefaultAutocompleteInput` (linhas ~296-318), substituindo pelos novos campos posicionados na coluna à direita da imagem, conforme acima. Remover o import de `DefaultAutocompleteInput` se não for mais usado na página.
  - O autosave por campo (`useFieldAutosave`, hook em `fichas/[id]/hooks/useFieldAutosave`) e as mutations `updateCampaignMutation`/`updateRaceMutation` (`usePutEntity`) permanecem inalteradas — apenas os componentes de apresentação dos campos de campanha/raça mudam, os estados (`campaign`, `race`) e os handlers de mudança continuam os mesmos.

- **3. `campanhas/[id]/page.tsx`** — nova linha de ações junto ao título:
  - No bloco atual (linhas ~101-121, `Title` + tags), adicionar uma linha/seção de ações com 3 botões: "Voltar" (ícone `FiArrowLeft`, navega para `APP_ROUTES.private.campaigns`), "Ver Usuários Permitidos" (abre `CampaignAllowedUsersModal`) e "Ver Fichas Cadastradas" (abre `CampaignSheetsModal`). Usar `SecondaryButton` para as 3 ações (consistente com o restante do app), dispostas de forma responsiva (ex.: `flex flex-wrap gap-3`, quebrando para nova linha/abaixo do título em telas pequenas).
  - `ICampaign` (`@/shared/interfaces/Entities/Campaign`) **já** tipa `allowedUsers: IUser[]` — confirmado por leitura direta do arquivo; nenhum ajuste de interface é necessário para os usuários permitidos.
  - Adicionar estado local `isAllowedUsersModalOpen` e `isSheetsModalOpen` (`useState`) para controlar a abertura dos 2 modais novos.
  - Renderizar `<CampaignAllowedUsersModal open={isAllowedUsersModalOpen} onClose={...} campaignId={campaignId} allowedUsers={campaign.allowedUsers} />` e `<CampaignSheetsModal open={isSheetsModalOpen} onClose={...} campaignId={campaignId} />` ao final da página, ao lado dos demais elementos.

- **Integrações com API** (endpoints a confirmar/alinhar com `.claude/tasks/fichas-campanhas-ajustes/task-api.md` durante a execução — descritos aqui pela convenção REST já usada no projeto):
  - Listagem de fichas vinculadas à campanha (visão do dono): assumir `GET /campaigns/{campaignId}/sheets` (paginado, `page`/`perPage`, resposta no formato `{ data, total, page, perPage }` como as demais listagens), consumido via `useGetEntityList` dentro de `CampaignSheetsModal`.
  - Desvínculo de uma ficha da campanha: assumir `DELETE /campaigns/{campaignId}/sheets/{sheetId}` (ação de desvínculo, não exclusão — a ficha deve continuar existindo, apenas com `campaign: null`), consumido via `useDeleteEntity`.
  - Remoção de usuário de `allowedUsers` (com cascata de desvínculo das fichas dele nessa campanha): assumir `DELETE /campaigns/{campaignId}/allowed-users/{userId}`, consumido via `useDeleteEntity`.
  - Se as rotas confirmadas em `task-api.md` divergirem dos caminhos acima, ajustar as chamadas nos hooks/componentes descritos, sem alterar o restante do plano.
  - Nenhuma alteração é necessária nos endpoints já usados por `fichas/[id]/page.tsx` (`GET /sheets/{id}`, `PUT /sheets/{id}` para nome/level/campanha/raça/imagem) — o autosave por campo permanece como está.

- **Formulário/validação**: não há formulários novos nesta demanda — os campos de campanha/raça na ficha continuam sendo seleção via Autocomplete (sem schema `zod`, já que usam autosave direto via `usePutEntity`, como hoje). As ações de remoção (usuário permitido / desvínculo de ficha) não têm formulário, apenas confirmação via `ConfirmationModal`.

- **Acesso Google**:
  - `CampaignAllowedUsersModal`: ocultar a ação de remover usuário permitido para `provider: 'google'` (padrão da skill `web-permissao-google-readonly`), mantendo apenas a visualização da lista — usar `useIsGoogleUser()` (`@/hooks/Auth`), como já feito em `CampaignsListItem`/`PlannedSessionsSection`.
  - `CampaignSheetsModal`: ocultar a ação de desvincular ficha para `provider: 'google'`, mesmo padrão.
  - `SheetsListItem` (troca de navegação): não se aplica — a ação "Abrir ficha" é de visualização e continua disponível para todos os usuários, incluindo Google; nenhuma mudança de permissão aqui.
  - `fichas/[id]/page.tsx`: os campos editáveis (nome, level, campanha, raça, imagem) e o autosave já existentes na página **não** têm hoje nenhuma restrição para usuários Google — isso é um comportamento pré-existente, fora do escopo desta demanda de ajustes, e não deve ser alterado aqui; sinalizado apenas para conhecimento, não é uma decisão a ser tomada nesta tarefa.

Status: concluído
Componentes:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage/index.tsx` (modificado — preview de imagem via `ImagePreviewDialog`)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetCampaignField/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx` (novo)
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignAllowedUsersModal/index.tsx` (novo)
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsModal/index.tsx` (novo)
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsList/index.tsx` (novo, sem paginação — ver nota de rotas abaixo)
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsListItem/index.tsx` (novo)

Arquivos:
- `app-web/src/app/(authorized)/fichas/components/SheetsListItem/index.tsx` (navegação client-side com `useRouter`, ícone `FiEye` no lugar de `FiExternalLink`)
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx` (remoção da exclusão de ficha, botão "Voltar", reestruturação do layout imagem + campos)
- `app-web/src/app/(authorized)/campanhas/[id]/page.tsx` (linha de ações "Voltar"/"Ver Usuários Permitidos"/"Ver Fichas Cadastradas" + 2 modais novos)
- `app-web/src/shared/interfaces/Entities/Campaign/index.ts` (nova interface `ICampaignSheetListItem`)
- `app-web/src/hooks/Queries/EntityQueries/useCampaignSheetsQuery/index.ts` (novo hook, ver nota abaixo)
- `app-web/src/hooks/Queries/EntityQueries/index.ts` (barrel atualizado)

Nota de divergência de rotas confirmada em `task-api.md`: as rotas reais diferem do
assumido originalmente neste documento — `DELETE /campaigns/:id/allowed-users/:userId`
retorna `200 OK` com `CampaignResponseDto` (não `204`); `GET /campaigns/:id/sheets`
retorna **array simples, sem paginação** (não `{ data, total, page, perPage }`); e
`DELETE /campaigns/:id/sheets/:sheetId` retorna `204 No Content`. Por isso
`CampaignSheetsModal`/`CampaignSheetsList` consomem um hook dedicado
(`useCampaignSheetsQuery`, em `hooks/Queries/EntityQueries`) em vez de
`useGetEntityList`, e `CampaignSheetsList` não usa `TablePagination`. Os demais
componentes/integrações seguem exatamente o especificado.

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Arquivos revisados: todos os listados no bloco "Status: concluído" da etapa "1. web-dev"
(componentes e arquivos), mais leitura de apoio dos componentes/hooks referenciados
(`CharacterView`, `SheetNameField`, `SheetLevelField`, `CampaignAllowedUsersField`,
`PlannedSessionsSection`/`PlannedSessionsList`, `ConfirmationModal`, `ViewModal`,
`ImagePreviewDialog`, `ImageAvatarPreview`, `useDeleteEntity`, `useGetEntityById`,
`useIsGoogleUser`, `useSheetCampaignOptionsQuery`) e conferência cruzada com
`task-api.md` para validar o contrato real dos 3 endpoints novos (rotas, formatos de
resposta e `CampaignSheetResponseDto`, que bate exatamente com `ICampaignSheetListItem`).

Não foram encontrados erros de compilação/tipagem, símbolos inexistentes, imports
órfãos, violações das regras de hooks, duplicação de componentes já existentes, uso de
ícones fora de `react-icons`, nem problemas na estrutura de pastas/nomenclatura. A
divergência de rotas registrada na etapa 1 foi conferida em `task-api.md` e está
corretamente refletida no código (`useCampaignSheetsQuery` como hook dedicado,
`CampaignSheetsList` sem `TablePagination`, DTO de resposta `void`/`ICampaign` conforme
o status HTTP real de cada endpoint). Os 3 pontos de ocultação de ações para
`provider: 'google'` (`CampaignAllowedUsersModal`, `CampaignSheetsListItem`) usam
`useIsGoogleUser()` corretamente.

Foram encontrados os seguintes pontos, do mais para o menos relevante:

- **`app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage/index.tsx:28-40`**
  — o wrapper clicável usa `<div role="button" tabIndex={0} onClick={...}>` mas não
  implementa `onKeyDown` para as teclas Enter/Espaço. Diferente de um `<button>` nativo
  (que dispara `click` automaticamente nessas teclas), uma `<div>` com `role="button"`
  não tem esse comportamento embutido — hoje o preview só abre via clique de mouse/touch,
  não por teclado, apesar do elemento ser focável (`tabIndex={0}`) e anunciado como botão
  para leitores de tela. Isso diverge do padrão de referência citado na própria task
  (`CharacterView`, linhas ~80-93), que usa `Box component="button"` (elemento nativo,
  já acessível por teclado) em vez de `role="button"` num `div`. Adicionalmente, o
  `IconButton` de editar (`FiEdit2`) fica aninhado dentro desse `div[role="button"]`,
  o que é um anti-padrão ARIA (controle interativo dentro de outro controle interativo).
    - Trecho: `role={imageUrl ? 'button' : undefined} tabIndex={imageUrl ? 0 : undefined} ... onClick={imageUrl ? () => setIsImagePreviewOpen(true) : undefined}`
    - Sugestão: adicionar um `onKeyDown` que chame `setIsImagePreviewOpen(true)` para as
      teclas `Enter`/`" "` (e `event.preventDefault()` no caso do espaço, para não rolar
      a página), seguindo as WAI-ARIA Authoring Practices para elementos com
      `role="button"` custom.

- **`app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsModal/index.tsx:26-29`**
  — `useCampaignSheetsQuery` retorna `isError`/`error`, mas o componente só desestrutura
  `data`/`isLoading`. Se a listagem falhar (erro de rede, 404/403 etc.), nenhum feedback é
  dado ao usuário: `CampaignSheetsList` recebe `sheets: data ?? []` (array vazio) e exibe
  silenciosamente a mensagem "Nenhuma ficha vinculada a esta campanha.", que é enganosa
  nesse cenário (não é que não há fichas, é que a busca falhou).
    - Trecho: `const { data, isLoading } = useCampaignSheetsQuery({ campaignId, enabled: open });`
    - Sugestão: desestruturar também `isError`/`error` e disparar `showToast` de erro em
      pt-BR (mesmo padrão de `useEffect` usado em `fichas/[id]/page.tsx` e
      `campanhas/[id]/page.tsx` para `isError`), e/ou exibir um estado de erro diferente
      de "lista vazia" dentro do `ViewModal`.

- **`app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsModal/index.tsx:31-34`**
  — `unassignSheetMutation` invalida apenas `[listUrl]` (a query do próprio modal). A
  listagem principal de fichas (`/fichas`, `fichas/page.tsx`) também exibe a campanha de
  cada ficha (`sheet.campaign?.name`) via `useGetEntityList` com `url: '/sheets'`; como
  essa query não é invalidada aqui, se o usuário já tiver a página `/fichas` carregada em
  cache e desvincular uma ficha por este modal, o nome da campanha continuará
  desatualizado na listagem de fichas até um refetch manual. A própria task já sinalizava
  isso como algo a "considerar" — registrando aqui para decisão consciente do time, não
  como bug bloqueante.
    - Trecho: `invalidateQueryKeys: [[listUrl]],`
    - Sugestão: adicionar `['/sheets']` a `invalidateQueryKeys` para manter a listagem de
      fichas sincronizada após o desvínculo.

- **`app-web/src/app/(authorized)/campanhas/[id]/components/CampaignAllowedUsersModal/index.tsx:72-79`**
  — inconsistência visual pequena: o `IconButton` de remover não define `sx={{ color:
  APP_COLORS.textBrownDark }}`, diferente do mesmo ícone em `CampaignSheetsListItem`
  (usado nesta mesma task) e em `CampaignAllowedUsersField` (padrão citado na própria
  task como referência), que aplicam essa cor. Resultado: o ícone de remover neste modal
  herda a cor padrão do MUI em vez de seguir a paleta do app.
    - Trecho: `<IconButton aria-label={...} onClick={() => setUserPendingRemoval(user)}>`
    - Sugestão: adicionar `sx={{ color: APP_COLORS.textBrownDark }}` ao `IconButton`,
      igual aos demais pontos do app que usam esse ícone.

Nenhum dos pontos acima é bloqueante para a funcionalidade central da demanda (navegação,
layout da ficha e gestão de vínculos da campanha funcionam conforme especificado); são
ajustes de acessibilidade, robustez de tratamento de erro e consistência visual.

### Correções aplicadas

Os 4 achados acima foram corrigidos:

1. **`SheetPortraitImage`** — reestruturado seguindo o padrão de `CharacterView`: o
   wrapper `div[role="button"]` foi substituído por `Box component="button"` (elemento
   nativo, acessível por teclado via Enter/Espaço sem necessidade de `onKeyDown`
   customizado), envolvendo somente a imagem. O `IconButton` de editar (`FiEdit2`) deixou
   de ficar aninhado dentro do elemento clicável — agora é irmão do `button`, posicionado
   `absolute` dentro do `div` externo (`position: relative`), eliminando o aninhamento de
   controles interativos. Quando não há `imageUrl`, apenas o placeholder é renderizado,
   sem nenhum botão de preview (mantendo só a edição ativa).

2. **`CampaignSheetsModal`** — passou a desestruturar `isError`/`error` de
   `useCampaignSheetsQuery` e disparar `showToast` de erro em pt-BR via `useEffect`
   (mesmo padrão de `fichas/[id]/page.tsx`/`campanhas/[id]/page.tsx`). `CampaignSheetsList`
   recebeu uma nova prop `isError` e agora exibe "Não foi possível carregar as fichas
   desta campanha." em vez da mensagem de lista vazia quando a busca falha.

3. **`CampaignSheetsModal`** — `unassignSheetMutation` agora invalida também
   `['/sheets']`, além da query de listagem do próprio modal, mantendo a listagem
   principal de fichas (`fichas/page.tsx`) sincronizada após o desvínculo.

4. **`CampaignAllowedUsersModal`** — o `IconButton` de remover usuário permitido recebeu
   `sx={{ color: APP_COLORS.textBrownDark }}`, igual ao mesmo ícone em
   `CampaignSheetsListItem` e `CampaignAllowedUsersField`.

Arquivos alterados nesta correção:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetPortraitImage/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsModal/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsList/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignAllowedUsersModal/index.tsx`

Status da revisão: achados corrigidos.

### Reconferência das correções aplicadas

Arquivos revisados nesta reconferência (os 4 tocados pela correção, listados em
"Arquivos alterados nesta correção" acima): `SheetPortraitImage/index.tsx`,
`CampaignSheetsModal/index.tsx`, `CampaignSheetsList/index.tsx`,
`CampaignAllowedUsersModal/index.tsx` — incluindo leitura de apoio de
`CampaignSheetsListItem/index.tsx` para confirmar a consistência de cor do ícone de
remover citada no achado 4.

Os 4 achados foram, de fato, corrigidos, sem regressão:

1. **`SheetPortraitImage`** — confirmado. A `<div>` externa (`relative`, com
   `aspectRatio`, `border` e `backgroundColor` preservados exatamente como antes) deixou
   de ter `role="button"`/`tabIndex`/`onClick` próprios. Quando há `imageUrl`, a imagem
   fica envolvida por um `Box component="button" type="button"` com
   `aria-label={"Ampliar imagem de " + alt}`, `sx={{ width: '100%', height: '100%' }}` e
   classes utilitárias que zeram o chrome padrão do botão (`border-0 bg-transparent
   p-0 cursor-pointer`) — como é um `<button>` HTML nativo, Enter/Espaço já disparam o
   `click` automaticamente pelo próprio navegador, sem necessidade de `onKeyDown`
   customizado (resolve o problema de acessibilidade por teclado do achado original). O
   `Box component="img"` interno mantém `objectFit: 'cover'`, `width/height: 100%`,
   preservando a imagem cobrindo o container. O `IconButton` de editar (`FiEdit2`) agora é
   irmão desse `button` (ambos filhos diretos da `div` externa `position: relative`),
   posicionado com `position: absolute, top: 8, right: 8` — não há mais nenhum botão
   aninhado dentro de outro botão. Cliques no `IconButton` de editar não borbulham para
   nenhum handler de preview (não há mais handler de clique no elemento pai), então o
   preview não é mais disparado por engano — o `event.stopPropagation()` em
   `handleEditClick` ficou redundante (não há mais overlay de clique acima dele para
   interceptar), mas é inofensivo e não constitui regressão. Quando não há `imageUrl`,
   apenas o placeholder (`FiImage`) e o `IconButton` de editar são renderizados — nenhum
   botão de preview é criado nesse ramo, confirmando que o clique não abre o preview sem
   imagem, com a edição permanecendo ativa. Layout e posicionamento (aspect-ratio 3/4,
   borda `goldDark`, fundo `parchmentLight`, imagem cobrindo o container via
   `objectFit: cover`, placeholder centralizado quando sem imagem) foram integralmente
   preservados em relação ao comportamento anterior.

2. **`CampaignSheetsModal`** — confirmado. `isError`/`error` agora são desestruturados de
   `useCampaignSheetsQuery` e um `useEffect` dispara `showToast` de erro em pt-BR
   (`"Não foi possível carregar as fichas desta campanha."` como fallback, ou a mensagem
   vinda de `error.response?.data?.message`). `CampaignSheetsList` recebe a nova prop
   `isError` e, em `!isLoading && isError`, renderiza uma linha com essa mesma mensagem em
   vez da mensagem de lista vazia; a lista de fichas (`sheets.map`) só é renderizada
   quando `!isError`, evitando exibir dados stale/vazios junto com o estado de erro.

3. **`CampaignSheetsModal`** — confirmado. `unassignSheetMutation.invalidateQueryKeys`
   agora é `[[listUrl], ['/sheets']]`, mantendo tanto a query do próprio modal quanto a
   listagem principal de fichas sincronizadas após o desvínculo.

4. **`CampaignAllowedUsersModal`** — confirmado. O `IconButton` de remover usuário
   permitido agora tem `sx={{ color: APP_COLORS.textBrownDark }}`, idêntico ao usado em
   `CampaignSheetsListItem` (conferido diretamente nesta reconferência).

Nenhuma regressão foi introduzida pelas correções: imports seguem todos em uso (`Box`,
`IconButton`, `Tooltip`, `FiEdit2`, `FiImage`, `ImagePreviewDialog`, `APP_COLORS` em
`SheetPortraitImage`; nenhum símbolo órfão nos demais três arquivos), a ocultação de
ações para `provider: 'google'` via `useIsGoogleUser()` permanece intacta em
`CampaignAllowedUsersModal`/`CampaignSheetsListItem`, e o padrão de ícones
`react-icons` (`FiEdit2`, `FiImage`, `FiTrash2`) foi mantido em todos os componentes.

Status da reconferência: aprovado, todos os 4 achados confirmados como corrigidos.
