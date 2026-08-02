# Task Web: Abrir ficha em nova aba no modal de campanha + card de raça na ficha

## Contexto
Não existe `spec.md` para esta demanda — os requisitos completos foram fornecidos
diretamente pelo solicitante e estão detalhados abaixo. Demanda exclusivamente de
frontend (`app-web`), com dois ajustes independentes entre si.

## Etapas

### 1. web-dev

#### Componentes (se necessário)

- Componente: `SheetRaceCard` (novo, em
  `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceCard/index.tsx`).
  - Props: `race: IRaceListItem`, `onView: () => void`, `onEdit: () => void`.
  - Comportamento esperado: card presentacional (sem estado próprio) inspirado
    visualmente em `shared/components/EntityReferenceCard` — `div` com
    `style={APP_CONTAINER_STYLES.detailInfoField}`, `className="flex items-center
    gap-3 px-3 py-2"`. Conteúdo, da esquerda para a direita:
    - Imagem: reaproveitar `ImageAvatarPreview` (`@/shared/components/ImageAvatarPreview`)
      com `imageUrl={race.referenceImageUrl}` e `alt={race.name}` (já trata ausência de
      imagem com placeholder `FiImage` e preview em `ImagePreviewDialog` ao clicar —
      nada a construir aqui).
    - Coluna central (`flex-1 flex flex-col gap-1`): `DefaultText` com `race.name` e,
      abaixo, as tags de `race.tags` como `Chip` do MUI — reaproveitar exatamente o
      padrão já usado em `racas/components/RaceView/index.tsx` (linhas ~185-199):
      `<Chip key={tag.id} label={tag.name} size="small" sx={{ backgroundColor:
      tag.color, color: getContrastTextColor(tag.color) }} />` dentro de um
      `flex flex-wrap gap-2` — usar `getContrastTextColor` de `@/shared/util`. Não usar
      `TagBadge` aqui (esse componente renderiza avatares circulares com iniciais, ideal
      para tabelas compactas; o pedido explicitamente quer chips com o nome da tag,
      como em `RaceView`).
    - Ações à direita: dois `IconButton` com `Tooltip`, no mesmo estilo de
      `EntityReferenceCard`/`RacesListItem` (`sx={{ color: APP_COLORS.textBrownDark }}`):
      - "Visualizar" (`FiEye`), `onClick={onView}`.
      - "Editar" (`FiEdit2`), `onClick={onEdit}`.
  - Este componente é específico da página de ficha (não é genérico o suficiente para
    `shared/components/`, pois sua ação "Editar" tem semântica própria — alternar modo
    de edição do campo, não abrir formulário) — por isso fica em
    `fichas/[id]/components/`.

#### Funcionalidade

- **Páginas/rotas afetadas**: nenhuma rota nova. Arquivos alterados:
  - `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsListItem/index.tsx`
    (Ajuste 1).
  - `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`
    (Ajuste 2, modificação, não recriação do zero).
  - Novo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceCard/index.tsx`
    (Ajuste 2, ver seção Componentes acima).
  - `app-web/src/app/(authorized)/fichas/[id]/page.tsx` e
    `app-web/src/app/(authorized)/campanhas/[id]/page.tsx` **não** precisam de nenhuma
    alteração — ambos já passam exatamente as props necessárias
    (`SheetRaceField` já recebe `value`/`onChange`/`options`; `CampaignSheetsListItem`
    já recebe `sheet`/`onUnassign` via `CampaignSheetsList`).
  - `ICampaignSheetListItem` e `IRaceListItem` (`@/shared/interfaces`) já expõem todos
    os campos necessários — nenhuma alteração de interface.

- **Integrações com API**: nenhuma nova chamada de API nos dois ajustes. Ajuste 1 é
  navegação pura (sem chamada de API). Ajuste 2 reaproveita os dados já carregados por
  `fichas/[id]/page.tsx` (`useGetEntityList<IRaceListItem, IRaceListFilters>({ url:
  '/races', filters: { perPage: 100 } })`, já existente) para exibir imagem/nome/tags
  no card, e o botão "Visualizar" do card abre `RaceView`
  (`racas/components/RaceView`), que já faz sua própria busca via
  `useGetEntityById<IRace>({ url: '/races/{raceId}' })` internamente — nenhum dado
  adicional precisa ser buscado por `SheetRaceField`/`SheetRaceCard`.

- **Formulário/validação**: nenhum formulário novo. Os dois ajustes são puramente de
  UI/interação; o autosave de raça na ficha (`updateRaceMutation`, `usePutEntity` em
  `fichas/[id]/page.tsx`) permanece inalterado.

##### Ajuste 1 — Ação "Abrir ficha" no `CampaignSheetsListItem`

- Arquivo: `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsListItem/index.tsx`.
- Adicionar import de `FiEye` (junto ao já existente `FiTrash2`) de `react-icons/fi`,
  e `APP_ROUTES` de `@/shared/routes`.
- Adicionar, na `TableCell align="right"` de ações, **antes** do bloco condicional de
  "Desvincular", um novo `Tooltip`+`IconButton` "Abrir ficha":
  ```
  <Tooltip title="Abrir ficha">
    <IconButton
      aria-label="Abrir ficha"
      onClick={() =>
        window.open(APP_ROUTES.private.sheetDetails(sheet.id), '_blank', 'noopener,noreferrer')
      }
      sx={{ color: APP_COLORS.textBrownDark }}
    >
      <FiEye />
    </IconButton>
  </Tooltip>
  ```
- **Visibilidade — convenção confirmada no código**: ações de "visualizar/abrir" ficam
  sempre visíveis, independente do tipo de usuário; ações de "editar/excluir" (ou,
  neste caso, "desvincular") ficam restritas a `!isGoogleUser`. Essa convenção foi
  confirmada em `racas/components/RacesListItem/index.tsx` (o `IconButton` "Visualizar"
  fica fora do `{!isGoogleUser && (...)}`, enquanto "Editar"/"Excluir" ficam dentro) e
  reforçada explicitamente em `.claude/tasks/fichas-campanhas-ajustes/task-web.md`
  ("a ação 'Abrir ficha' é de visualização e continua disponível para todos os
  usuários, incluindo Google"). Portanto o novo botão "Abrir ficha" **não** deve ser
  envolvido pelo `{!isGoogleUser && (...)}` que hoje protege apenas "Desvincular" — ele
  fica sempre renderizado, para qualquer `sheet` da lista.
- **Exceção intencional de navegação — NÃO normalizar para `router.push`**: em todo o
  resto do sistema (ex.: `fichas/components/SheetsListItem/index.tsx`), "abrir ficha"
  navega na mesma aba via `useRouter().push(APP_ROUTES.private.sheetDetails(sheet.id))`.
  Neste modal específico (`CampaignSheetsModal` → `CampaignSheetsListItem`), a ação deve
  abrir a ficha em **nova aba** via `window.open(...)`, e não `router.push`. Motivo de
  negócio: o usuário local está navegando fichas de outros jogadores a partir da tela
  de detalhes de uma campanha; se a navegação fosse na mesma aba, ele perderia o
  contexto da campanha (precisaria voltar e reabrir o modal para continuar gerenciando
  vínculos). Esta é uma exceção deliberada e documentada — nem a implementação nem a
  revisão de código devem "corrigir" isso para `router.push`, mesmo que pareça
  inconsistente com o resto do app.
- **Segurança do `window.open`**: usar a assinatura de três argumentos
  `window.open(url, '_blank', 'noopener,noreferrer')` (ou, alternativamente,
  configurar `noopener,noreferrer` via `rel` caso a implementação prefira um link
  `<a target="_blank">` disparado programaticamente — mas o padrão mais simples e
  direto aqui é `window.open` com a string de features contendo `noopener,noreferrer`)
  para evitar que a aba aberta tenha acesso a `window.opener` (mitiga reverse
  tabnabbing). Não é necessário nenhum tratamento de retorno de `window.open` (não há
  fallback de pop-up bloqueado especificado nesta demanda).
- **Ordem dos botões na célula de ações**: "Abrir ficha" antes de "Desvincular",
  consistente com a ordem "Visualizar" → "Editar"/"Excluir" já usada em
  `RacesListItem` e "Abrir ficha" → "Excluir" em `SheetsListItem`.
- Nenhuma outra alteração é necessária em `CampaignSheetsList`/`CampaignSheetsModal` —
  a ação é totalmente local ao item, sem nova prop a repassar.

##### Ajuste 2 — Card de raça selecionada em `SheetRaceField`

- Arquivo: `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`
  (modificação da implementação interna; a assinatura pública de props permanece
  **exatamente** a mesma: `{ value: IRaceListItem | null; onChange: (value:
  IRaceListItem | null) => void; options: IRaceListItem[] }` — nenhuma alteração em
  `fichas/[id]/page.tsx`, que já hidrata `value={selectedRaceOption}` a partir de
  `raceOptions` — lista que já contém `referenceImageUrl`/`category`/`tags`).
- Escopo confirmado: essa dinâmica é exclusiva de `SheetRaceField`
  (`/fichas/[id]`). `fichas/components/SheetCreateForm` não possui campo de raça hoje
  e **não deve ser tocado**.
- Adicionar estado local `isEditing` (`useState<boolean>`, inicial `false`) e
  `isViewModalOpen` (`useState<boolean>`, inicial `false`) dentro de `SheetRaceField`.
- Lógica de modo de exibição: `const showAutocomplete = value === null || isEditing;`
  - `showAutocomplete === true` → renderizar exatamente o `Autocomplete` MUI já
    existente hoje (mesmo `variant="standard"`, mesmos overrides de `sx`, mesmo
    `placeholder="Selecione a raça"`), sem nenhuma mudança de comportamento/estilo.
  - `showAutocomplete === false` (ou seja, há `value` e não está em modo edição) →
    renderizar `<SheetRaceCard race={value} onView={() =>
    setIsViewModalOpen(true)} onEdit={() => setIsEditing(true)} />`.
  - O `Label` "Raça" (`htmlFor="sheet-race-field"`) continua sendo renderizado acima,
    em ambos os modos.
- `onChange` do `Autocomplete` deve ser adaptado para, além de propagar
  `onChange(newValue)` (prop recebida de `fichas/[id]/page.tsx`, inalterada), também
  chamar `setIsEditing(false)` **sempre que `newValue !== null`** — isto é, ao
  selecionar uma raça (nova ou a mesma), o campo volta automaticamente ao modo card.
  Se o usuário limpar o autocomplete (clicar no "x" do MUI, resultando em
  `newValue === null`), apenas propagar `onChange(null)` — **não** forçar
  `isEditing` para `false` nesse caso; como `value` passa a ser `null`,
  `showAutocomplete` já será `true` de qualquer forma (autocomplete permanece visível,
  vazio, pronto para nova busca), preservando o comportamento atual descrito para
  `value === null`.
- Ao clicar em "Editar" no `SheetRaceCard`, `setIsEditing(true)` **não chama
  `onChange`** — o valor atual (`value`) não é limpo nem descartado; o `Autocomplete`
  volta a ser exibido já com `value` preenchido (a raça atual continua selecionada
  internamente no componente MUI), permitindo tanto trocar por outra raça quanto
  limpá-la, sem nunca ter ficado momentaneamente "sem raça" apenas por ter entrado em
  modo de edição.
- Não há um botão explícito de "cancelar edição sem alterar nada" nesta demanda — a
  única forma de sair do modo `isEditing` de volta ao card é selecionar uma raça (a
  mesma ou outra) no autocomplete, conforme definido acima. Isso está coberto pelos
  requisitos fornecidos e não é sinalizado como lacuna.
- `ViewModal` (renderizado dentro do próprio `SheetRaceField`, ao lado do
  `Autocomplete`/`SheetRaceCard`, fora do fluxo de layout do card):
  ```
  <ViewModal
    open={isViewModalOpen}
    onClose={() => setIsViewModalOpen(false)}
    title="Detalhes da Raça"
    size="wide"
  >
    {value && <RaceView raceId={value.id} />}
  </ViewModal>
  ```
  Padrão idêntico ao usado em `racas/page.tsx` (linhas ~159-166): mesmo `title`, mesmo
  `size="wide"`, mesmo componente `RaceView` (`@/app/(authorized)/racas/components/RaceView`,
  ajustar o caminho de import relativo a partir de `fichas/[id]/components/SheetRaceField`)
  recebendo apenas `raceId`. Não usar `onNotFound` aqui (prop opcional de `RaceView`,
  usada apenas pelo dispatcher de menções de entidade — não se aplica a este fluxo).
- Imports novos em `SheetRaceField`: `useState` (`react`), `ViewModal` (`@/shared/components/Modals`),
  `RaceView` (`../../../racas/components/RaceView` ou alias equivalente — confirmar o
  caminho relativo correto na implementação, já que `RaceView` vive fora da árvore de
  `fichas/`), `SheetRaceCard` (`../SheetRaceCard`).
- Acesso Google: nenhuma restrição aplicável — este campo (visualizar/trocar raça na
  própria ficha) não é uma ação de "criar/editar/excluir" de uma listagem
  administrativa, é edição de um campo da própria ficha do usuário; nenhuma mudança de
  comportamento por `provider: 'google'` foi pedida ou é aplicável aqui (fora do
  escopo desta demanda — comportamento pré-existente da página, como já registrado em
  `fichas-campanhas-ajustes/task-web.md`).

- **Acesso Google (visão consolidada dos dois ajustes)**:
  - Ajuste 1 (`CampaignSheetsListItem`): "Abrir ficha" — **sempre visível**, inclusive
    para `provider: 'google'` (ação de visualização; ver justificativa de convenção
    acima). "Desvincular" continua restrita a `!isGoogleUser`, sem alteração nesse
    comportamento pré-existente.
  - Ajuste 2 (`SheetRaceField`/`SheetRaceCard`): não há ações de criar/editar/excluir
    de listagem envolvidas; não se aplica a skill `web-permissao-google-readonly`.

Status: concluído
Componentes: `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceCard/index.tsx` (novo)
Arquivos:
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsListItem/index.tsx` (Ajuste 1 — botão "Abrir ficha" via `window.open(..., '_blank', 'noopener,noreferrer')`, sempre visível, antes do bloco `!isGoogleUser` de "Desvincular")
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx` (Ajuste 2 — alternância `showAutocomplete`/`SheetRaceCard`, `isEditing`, `isViewModalOpen`, `ViewModal` com `RaceView`)

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Arquivos revisados:
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceCard/index.tsx` (novo)
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetRaceField/index.tsx`
- `app-web/src/app/(authorized)/campanhas/[id]/components/CampaignSheetsListItem/index.tsx`

Conferido contra `CLAUDE.md`, o plano da task e os arquivos de referência citados nele
(`EntityReferenceCard`, `RacesListItem`, `RaceView`, `SheetCampaignField`,
`racas/page.tsx`, interfaces `IRaceListItem`/`ICampaignSheetListItem`/`ITag`,
`ImageAvatarPreview`, `ViewModal`). Nota: a exceção deliberada de `window.open(...,
'_blank', 'noopener,noreferrer')` em `CampaignSheetsListItem` (Ajuste 1) foi tratada
como decisão de negócio documentada na seção "##### Ajuste 1" do plano e **não** foi
reportada como inconsistência.

- **[SheetRaceField/index.tsx:37 e 67-75]** — Acessibilidade menor: o `Label
  htmlFor="sheet-race-field"` continua sendo renderizado mesmo quando
  `showAutocomplete === false` (modo card), mas nesse modo nenhum elemento do DOM tem
  `id="sheet-race-field"` (o `id` só existe no `Autocomplete`, que não é renderizado
  nesse momento). O resultado é um `<label for="sheet-race-field">` "órfão" enquanto o
  `SheetRaceCard` está visível — não quebra a funcionalidade, mas a associação
  label/input fica inválida para leitores de tela nesse estado. Esse comportamento
  segue exatamente o que o plano pediu ("O Label 'Raça' continua sendo renderizado
  acima, em ambos os modos"), então não é um desvio da spec, apenas um ponto de
  atenção de acessibilidade que vale registrar.
  - Trecho: `<Label htmlFor="sheet-race-field">Raça</Label>` ... `showAutocomplete ===
    false` → `<SheetRaceCard ... />` (sem nenhum elemento com esse `id`).
  - Sugestão: quando `showAutocomplete` for `false`, considerar renderizar o `Label`
    sem `htmlFor` (ou usar `aria-labelledby`/associar o label a um elemento focável
    dentro do próprio `SheetRaceCard`, por exemplo o container ou o botão
    "Visualizar") para manter a associação semanticamente válida em ambos os modos.

Fora esse ponto, não foram encontrados erros de lógica, tipagem incorreta, imports
quebrados, violação das regras de hooks, ou uso de ícones fora de `react-icons`. A
tipagem de `SheetRaceCardProps`/`SheetRaceFieldProps` é coerente com
`IRaceListItem`/`ITag` (`@/shared/interfaces`), sem `any`. `SheetRaceCard` reaproveita
corretamente `ImageAvatarPreview` e o padrão de `Chip` de tags já usado em
`RaceView` (mesmas props/estilo), evitando duplicar `TagBadge` (que tem semântica
visual diferente, como o plano já esclarece) — sem duplicação de componente. A
alternância `showAutocomplete`/`isEditing`/`onChange` em `SheetRaceField` implementa
exatamente a lógica descrita no plano (volta ao card só quando `newValue !== null`,
"Editar" não dispara `onChange`, `ViewModal` com `RaceView` no mesmo padrão de
`racas/page.tsx`). Não há chamadas de API novas nem mutations neste ajuste, então os
critérios de `invalidateQueryKeys`/hooks genéricos de `hooks/Queries` não se aplicam
aqui (nenhum dado é buscado/alterado além do já existente em `fichas/[id]/page.tsx`).
Em `CampaignSheetsListItem`, o botão "Abrir ficha" está corretamente fora do bloco
`{!isGoogleUser && (...)}` (ação de visualização, sempre visível, inclusive para
usuários Google), na ordem correta antes de "Desvincular", com `aria-label` em pt-BR e
`window.open` com a assinatura de segurança `noopener,noreferrer` pedida pelo plano;
"Desvincular" permanece restrito a `!isGoogleUser`, sem alteração desse comportamento
pré-existente.

**Correção aplicada**: o achado de acessibilidade sobre `<Label htmlFor="sheet-race-field">`
em `SheetRaceField/index.tsx` foi corrigido — `htmlFor` agora só é passado quando
`showAutocomplete === true` (`htmlFor={showAutocomplete ? 'sheet-race-field' : undefined}`),
evitando a associação órfã no modo card. Confirmado que `Label`
(`@/shared/components/Texts/Label`) já declara `htmlFor?: string` como opcional, então
a mudança não exigiu alteração no componente `Label`. Nenhum outro comportamento foi
alterado: o `Label` "Raça" continua exibido em ambos os modos, e a alternância
card/autocomplete, o `ViewModal` e o `onChange` permanecem inalterados.
