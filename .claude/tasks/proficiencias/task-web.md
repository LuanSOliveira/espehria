# Task Web: Feature "Proficiências" (entidades + ficha)

## Contexto
Ver .claude/tasks/proficiencias/spec.md — seção "Escopo confirmado" (Partes A, B e C).

Esta task cobre apenas o frontend. A Parte A (reversão do tipo "Proficiência" em
Melhoria/Defeito) **não exige nenhuma alteração de frontend** — o modal
`ImprovementDefectAddModal` já consome `/improvement-flaw-types` e
`/improvement-flaw-properties` dinamicamente, então basta que a migration de reversão do
backend remova os dados. Ação aqui: apenas conferir manualmente, após o backend aplicar a
migration de reversão, que o tipo "Proficiência" e suas 20 propriedades deixaram de
aparecer no modal de Melhorias/Defeitos das 5 entidades — sem escrever código para isso.

O contrato de API para Proficiências (endpoints, nomes de rota, formato exato de resposta)
ainda não estava disponível em `.claude/tasks/proficiencias/task-api.md` no momento deste
planejamento. Os nomes de endpoint usados abaixo são **assumidos por analogia direta** com
o padrão já existente de Melhoria/Defeito (`/improvement-flaw-types`,
`/improvement-flaw-properties`) e devem ser conferidos/ajustados pelo `web-dev` contra
`task-api.md` assim que ele existir, antes ou durante a implementação.

## Etapas

### 1. web-dev

#### Verificação (Parte A — sem implementação)
- Após a migration de reversão do backend estar aplicada em ambiente de desenvolvimento,
  abrir o modal de adicionar Melhoria/Defeito em qualquer uma das 5 entidades (Talento,
  Treinamento, Característica, Biografia, Raça) e confirmar que o tipo "Proficiência" e
  suas propriedades não aparecem mais nos autocompletes de `ImprovementDefectAddModal`
  (`app-web/src/shared/components/ImprovementDefectAddModal/index.tsx`). Nenhum código
  precisa ser alterado para isso.

#### Componentes

**Interfaces novas** (`app-web/src/shared/interfaces/Entities/`), seguindo o padrão de
`ImprovementDefectItem`/`ImprovementDefectProperty`/`ImprovementDefectType`:
- `IProficiencyProperty`: `{ id: string; name: string }` — pasta nova
  `Entities/ProficiencyProperty/`.
- `IProficiencyGrade`: `{ id: string; name: string; order: number }` — pasta nova
  `Entities/ProficiencyGrade/`. `order` é o valor numérico de magnitude (Destreinado = menor
  … Lendário = maior), usado para ordenar o autocomplete de graduação de forma crescente e
  para eventual comparação no frontend.
- `IProficiencyItem`: `{ id: string; property: IProficiencyProperty; grade: IProficiencyGrade }`
  — pasta nova `Entities/ProficiencyItem/`, mesmo espírito de `IImprovementDefectItem`
  (`id` é o identificador real do registro quando vindo do backend; ao ser criado
  localmente no modal antes do submit do formulário, usar um `uuid` local descartável, como
  já é feito em `ImprovementDefectAddModal`).
- Adicionar o campo `proficiencies: IProficiencyItem[]` às interfaces `IRace`, `ITalent`,
  `ITraining`, `ICharacteristic` e `IBiography`
  (`shared/interfaces/Entities/{Race,Talent,Training,Characteristic,Biography}/index.ts`),
  junto aos campos `improvements`/`flaws` já existentes.
- Registrar as 3 novas pastas de interface no barrel `shared/interfaces/Entities/index.ts`
  (ou equivalente já usado pelas interfaces existentes).

**Form schema novo** (`app-web/src/shared/formSchemas/ProficiencyFormSchema/index.ts`),
espelhando `ImprovementDefectFormSchema`, porém sem o campo `value` (proficiência não tem
valor numérico, só propriedade + graduação):
- `proficiencyFormSchema`: `{ propertyId: z.string().min(1, 'Selecione a propriedade'), gradeId: z.string().min(1, 'Selecione a graduação') }`.
- Exportar `ProficiencyFormData`, `proficiencyFormResolver` (zodResolver) e
  `proficiencyFormDefaultValues` (`{ propertyId: '', gradeId: '' }`).
- Registrar no barrel `shared/formSchemas/index.ts`.

**Hooks novos** (`app-web/src/hooks/Queries/EntityQueries/`), espelhando
`useImprovementDefectTypesQuery`/`useImprovementDefectPropertiesQuery` (somente leitura,
`staleTime: 5 * 60 * 1000`, via `ApiFactory(getAuthToken())`):
- `useProficiencyPropertiesQuery` — `GET /proficiency-properties` (nome de rota assumido,
  confirmar contra `task-api.md`), retorna `IProficiencyProperty[]` (as 20 opções fixas).
- `useProficiencyGradesQuery` — `GET /proficiency-grades` (nome de rota assumido, confirmar
  contra `task-api.md`), retorna `IProficiencyGrade[]` (as 5 graduações fixas); ordenar o
  resultado por `order` crescente antes de usar em qualquer autocomplete, para garantir a
  sequência Destreinado < Básico < Avançado < Especialista < Lendário mesmo que a API não
  garanta a ordem.
- Registrar ambos no barrel `hooks/Queries/index.ts`.

**Componente: `ProficiencyAddModal`**
(`app-web/src/shared/components/ProficiencyAddModal/index.tsx`, espelhando
`ImprovementDefectAddModal`)
- Props: `open: boolean`, `onClose: () => void`, `onAdd: (item: IProficiencyItem) => void`.
  Sem prop `category` (proficiência não tem duas categorias como melhoria/defeito).
- Comportamento esperado: `FormModal` com título "Adicionar Proficiência"; formulário
  `react-hook-form` + `proficiencyFormResolver`; dois `FormAutocompleteInput`: "Propriedade"
  (options = `useProficiencyPropertiesQuery`, ordenadas por nome) e "Graduação" (options =
  `useProficiencyGradesQuery`, ordenadas por `order`); botão de submit "Adicionar"
  (`PrimaryButton`). Ao submeter, resolve `property`/`grade` completos a partir dos ids e
  chama `onAdd({ id: uuidv4(), property, grade })`. Reseta o formulário sempre que o modal
  reabre (mesmo `useEffect` reset-on-open do componente espelhado).

**Componente: `ProficiencyCard`**
(`app-web/src/shared/components/ProficiencyCard/index.tsx`, espelhando
`ImprovementDefectCard`)
- Props: `item: Omit<IProficiencyItem, 'id'> & { id?: string | null }`, `onRemove?: () => void`.
- Comportamento esperado: mesmo container visual (`APP_CONTAINER_STYLES.detailInfoField`)
  do card de Melhoria/Defeito, mas exibindo apenas duas linhas de texto:
  `Propriedade: <nome da propriedade>` e `Graduação: <nome da graduação>` — sem linha de
  "Valor" nem de "Tipo" (fora do contexto da ficha o card mostra só propriedade + graduação,
  conforme confirmado no spec). Quando `onRemove` é passado, exibe o `IconButton` de lixeira
  igual ao card espelhado; quando omitido (uso em views e na ficha), não exibe o botão.

**Componente: `ProficiencyListField`**
(`app-web/src/shared/components/ProficiencyListField/index.tsx`, espelhando
`ImprovementDefectListField`)
- Props: `label: string` (usar "Proficiências" nos 5 formulários), `addButtonLabel: string`
  (usar exatamente "Adicionar Proficiências", conforme texto do botão confirmado no spec),
  `value: IProficiencyItem[]`, `onChange: (value: IProficiencyItem[]) => void`. **Sem** prop
  `otherListValue`/`category` — proficiência não tem uma "lista irmã" como
  melhoria/defeito, é uma única lista por entidade.
- Comportamento esperado: `SecondaryButton` "Adicionar Proficiências" abre o
  `ProficiencyAddModal`; lista os itens como `ProficiencyCard` com `onRemove` removendo pelo
  `property.id`; mensagem "Nenhum item adicionado." quando vazio. Regra de unicidade ao
  adicionar (mensagem de erro via `showToast`, mesmo padrão de
  `ImprovementDefectListField`): bloquear se já existir um item na lista com o mesmo
  `property.id`, **independente da graduação** — "Esta propriedade já foi adicionada. Cada
  entidade só pode ter uma graduação por propriedade de proficiência." (a checagem definitiva
  de unicidade continua sendo responsabilidade do backend; esta validação client-side é só
  para UX, mesmo espírito da checagem client-side já existente em
  `ImprovementDefectListField`).

**Componentes específicos da ficha** (não compartilhados — ficam em
`app-web/src/app/(authorized)/fichas/[id]/components/`, mesmo padrão de
`SheetImprovementDefectCategoryAccordions`/`SheetBiographyAssignModal`):

- `SheetProficienciesGrid`
  - Props: `items: ISheetProficiencySnapshotEntry[]` (ver interface nova descrita abaixo em
    Funcionalidade), `emptyMessage?: string` (default "Nenhuma proficiência vinculada.").
  - Comportamento esperado: grid responsivo de até 3 colunas
    (`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`, mesma convenção de breakpoints
    já usada no restante da página de ficha) renderizando um `ProficiencyCard` (sem
    `onRemove`) por item, com uma `DefaultText` "Concedida por: `<sourceName>`" abaixo de
    cada card — mesmo padrão visual já usado em `SheetImprovementDefectCategoryAccordions`
    para o campo `sourceName` dos snapshots de melhoria/defeito. Somente leitura, sem
    nenhuma ação de adicionar/remover.

- `SheetAdjustedProficienciesSection`
  - Props: `items: ISheetAdjustedProficiencyEntry[]` (ver interface nova abaixo),
    `propertyOptions: IProficiencyProperty[]` (todas as 20 propriedades, já filtradas pelo
    componente pai conforme a regra de ocultação — ver Funcionalidade), `onSelectSubstitute:
    (adjustmentId: string, propertyId: string) => void`, `isSaving?: (adjustmentId: string) =>
    boolean` (ou equivalente para desabilitar o autocomplete do item que está salvando).
  - Comportamento esperado: renderiza a seção "Proficiências Ajustadas" (título + lista, só
    aparece — ou aparece com mensagem de "Nenhum ajuste pendente." — quando `items` existe;
    se a demanda preferir ocultar a seção inteira quando vazia, seguir esse caminho, já que a
    spec não deixa isso explícito — sinalizar ao revisor). Cada item exibe: valor original
    (propriedade + graduação, via `ProficiencyCard` sem `onRemove`, reaproveitando o mesmo
    componente compartilhado), texto "Concedida por: `<sourceName>`", a graduação fixa
    (repetida/deixada clara como não editável — não há input para ela) e um
    `DefaultAutocompleteInput<IProficiencyProperty>` rotulado "Propriedade substituta",
    valor = `item.adjustedProperty` (pode ser `null` quando ainda não resolvido — exibir
    placeholder "Selecione a propriedade substituta"), `options = propertyOptions` (já
    excluindo, por item, a própria propriedade original do item, calculado pelo componente
    pai). Ao selecionar uma opção, chama `onSelectSubstitute(item.id, propertyId)` — não é um
    formulário com botão de salvar, a escolha dispara a mutation imediatamente (mesmo espírito
    de outras interações imediatas da página de ficha, como vincular/desvincular raça).

#### Funcionalidade

**Páginas/rotas** — nenhuma rota nova; alterações em páginas/formulários/views existentes:

- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`,
  `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`,
  `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`,
  `app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`:
  adicionar estado local `proficiencies: IProficiencyItem[]`, hidratado a partir de
  `<entidade>Detail.proficiencies` no `useEffect` de edição (e resetado para `[]` ao sair do
  modo edição/após submit com sucesso, igual a `improvements`/`flaws` hoje), renderizar
  `<ProficiencyListField label="Proficiências" addButtonLabel="Adicionar Proficiências"
  value={proficiencies} onChange={setProficiencies} />` logo abaixo do bloco de
  Melhorias/Defeitos de cada formulário (fora do grid de 2 colunas usado para
  Melhorias/Defeitos, já que Proficiência é uma lista única, não duas), e incluir
  `proficiencies: proficiencies.map((item) => ({ property: item.property.id, grade:
  item.grade.id }))` no payload de criação/edição (formato exato de chave a confirmar contra
  `task-api.md`; usar `property`/`grade` por analogia com `type`/`property` do payload de
  melhoria/defeito).
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`,
  `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`,
  `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`,
  `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`,
  `app-web/src/app/(authorized)/biografias/components/BiographyView/index.tsx`: adicionar um
  novo bloco `detailSectionBox` "Proficiências" (mesmo padrão visual dos blocos
  "Melhorias"/"Defeitos" já existentes, com um ícone de `react-icons/fi` a escolher — ex.:
  `FiZap` ou similar), listando `<ProficiencyItem>` via `ProficiencyCard` sem `onRemove`,
  mensagem "Nenhum item adicionado." quando vazio.
- `app-web/src/app/(authorized)/fichas/[id]/page.tsx`:
  - Adicionar `'proficiencias'` ao union type `SheetDetailTab` (linha 55), imediatamente
    após `'defeitos'`.
  - Adicionar `<Tab value="proficiencias" label="Proficiências" />` na `Tabs` (por volta da
    linha 524), imediatamente após a `<Tab value="defeitos" label="Defeitos" />`.
  - Adicionar estados `proficiencies: ISheetProficiencySnapshotEntry[]` e
    `adjustedProficiencies: ISheetAdjustedProficiencyEntry[]` (ver interfaces novas abaixo),
    hidratados de `sheet.proficiencies`/`sheet.adjustedProficiencies` no mesmo `useEffect` de
    hidratação inicial que já popula `melhorias`/`defeitos`.
  - Atualizar esses dois estados também nos `onSuccess` de `linkRaceMutation`,
    `unlinkRaceMutation`, `linkBiographyMutation` e `unlinkBiographyMutation` (essas mutations
    já retornam o `ISheet` atualizado e já atualizam `melhorias`/`defeitos` a partir da
    resposta — replicar o mesmo padrão para `proficiencies`/`adjustedProficiencies`, já que
    vincular/desvincular Raça ou Biografia é o único gatilho de sincronização hoje).
  - Renderizar, quando `activeTab === 'proficiencias'`, `<SheetProficienciesGrid
    items={proficiencies} />` seguido de `<SheetAdjustedProficienciesSection
    items={adjustedProficiencies} propertyOptions={...} onSelectSubstitute={...} />`. O
    cálculo de `propertyOptions` por item deve excluir: (a) toda propriedade já presente em
    `proficiencies` (aba principal); (b) a propriedade original de qualquer item de
    `adjustedProficiencies` (pendente ou já resolvido); (c) a `adjustedProperty` já escolhida
    em qualquer outro item de `adjustedProficiencies` — isso implementa "esconder qualquer
    propriedade já aplicada na ficha em qualquer graduação" de forma consistente mesmo antes
    da confirmação do backend; a validação autoritativa continua sendo do backend.

**Integrações com API** (nomes de rota/payload assumidos por analogia com
`/improvement-flaw-types`, `/improvement-flaw-properties` e com o payload de
melhoria/defeito das 5 entidades — **confirmar contra `.claude/tasks/proficiencias/task-api.md`
assim que existir**, e ajustar hooks/hooks de mutation/interfaces se os nomes reais forem
diferentes):
- `GET /proficiency-properties` → `IProficiencyProperty[]` (consumido por
  `useProficiencyPropertiesQuery`, pelos formulários das 5 entidades via
  `ProficiencyAddModal`, e pela seção "Proficiências Ajustadas" da ficha).
- `GET /proficiency-grades` → `IProficiencyGrade[]` (consumido por
  `useProficiencyGradesQuery`, usado só em `ProficiencyAddModal`).
- `GET/POST/PUT /races`, `/talents`, `/trainings`, `/characteristics`, `/biographies`
  (detalhe e criação/edição): precisam, respectivamente, retornar `proficiencies:
  IProficiencyItem[]` no corpo de detalhe e aceitar `proficiencies: { property: string;
  grade: string }[]` no payload de criação/edição.
- `GET /sheets/:id`: precisa retornar dois campos novos no `ISheet` — uma lista já
  deduplicada/resolvida para a aba principal (`proficiencies`) e uma lista de conflitos
  (`adjustedProficiencies`). Interfaces novas assumidas, a criar em
  `shared/interfaces/Entities/Sheet/index.ts`:
  ```
  interface ISheetProficiencySnapshotEntry {
    id: string;
    property: IProficiencyProperty;
    grade: IProficiencyGrade;
    sourceName: string;
  }

  interface ISheetAdjustedProficiencyEntry {
    id: string;
    property: IProficiencyProperty;   // valor original vindo da entidade
    grade: IProficiencyGrade;         // fixo, não editável
    sourceName: string;               // entidade de origem
    adjustedProperty: IProficiencyProperty | null; // escolha do usuário, null = pendente
  }
  ```
  Adicionar `proficiencies: ISheetProficiencySnapshotEntry[]` e `adjustedProficiencies:
  ISheetAdjustedProficiencyEntry[]` à interface `ISheet`.
- `PUT /sheets/:id/race`, `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography`, `DELETE
  /sheets/:id/biography`: as respostas (já usadas para atualizar `melhorias`/`defeitos` no
  frontend) precisam também trazer `proficiencies`/`adjustedProficiencies` recalculados do
  zero a cada vínculo/desvínculo/troca, conforme a regra de conflito da spec.
  - Endpoint novo para resolver um ajuste pendente — assumido como `PUT
    /sheets/:id/proficiencies/adjustments/:adjustmentId` com body `{ propertyId: string }`,
    retornando o `ISheet` atualizado. Implementar como um `usePutEntity<ISheet, { propertyId:
    string }>` adicional na página de ficha (`url` montada com o `adjustmentId` do item
    clicado), invalidando `['/sheets']`/`[/sheets/${sheetId}]` e, no `onSuccess`, atualizando
    os estados `proficiencies`/`adjustedProficiencies` a partir da resposta (mesmo padrão de
    `linkRaceMutation`/`linkBiographyMutation`). **Confirmar o path e o nome do campo do body
    contra `task-api.md`** antes de implementar — se o backend expuser um formato diferente
    (por exemplo, endpoint por índice em vez de id, ou nome de campo distinto de
    `propertyId`), ajustar a chamada e a prop `onSelectSubstitute` de
    `SheetAdjustedProficienciesSection` de acordo.

**Formulário/validação:**
- Modal "Adicionar Proficiência" (`ProficiencyAddModal`): campos "Propriedade" e
  "Graduação", ambos obrigatórios (`proficiencyFormSchema`), sem campo de valor numérico.
- `ProficiencyListField`: bloqueia no client (toast de erro) adicionar uma propriedade já
  presente na lista da mesma entidade, independentemente da graduação — regra "propriedade
  única por entidade" do spec.
- Seção "Proficiências Ajustadas": não há formulário submetido; a escolha da propriedade
  substituta no autocomplete dispara a mutation imediatamente. A graduação do item nunca é
  editável pelo usuário (não existe input para ela, apenas exibição). As opções do
  autocomplete já vêm pré-filtradas pela página de ficha conforme a regra de ocultação
  descrita acima; qualquer inconsistência remanescente deve ser tratada pelo backend
  retornando erro de validação, exibido via `showToast` a partir do `onError` da mutation.

**Acesso Google:**
- Nas 5 entidades (Talento, Treinamento, Característica, Biografia, Raça): comportamento
  padrão já herdado do restante da entidade — o botão "Adicionar Proficiências" só é
  alcançável dentro do formulário de criação/edição, e esse formulário já só é aberto por
  usuários não-Google (`!isGoogleUser`, ver `RacesListItem`/páginas de listagem das 5
  entidades — nenhuma mudança adicional necessária). Nas views, o novo bloco "Proficiências"
  é somente leitura (sem `onRemove`), igual ao comportamento atual dos blocos
  "Melhorias"/"Defeitos".
- Na aba "Proficiências" da ficha: **não aplicável**. A feature de Fichas
  (`app-web/src/app/(authorized)/fichas/**`) não usa `useIsGoogleUser` em nenhum ponto hoje —
  fichas são dados do próprio usuário, não catálogo mestre — então a seleção de propriedade
  substituta em "Proficiências Ajustadas" fica disponível a qualquer usuário autenticado que
  acesse a própria ficha, sem distinção por provedor. Sinalizando para o revisor: a spec não
  trata explicitamente deste ponto; se o usuário confirmar posteriormente que Google deveria
  ser bloqueado aqui também, será necessário revisar esta decisão.

Status: concluído
Componentes: app-web/src/shared/components/ProficiencyAddModal/index.tsx,
app-web/src/shared/components/ProficiencyCard/index.tsx,
app-web/src/shared/components/ProficiencyListField/index.tsx,
app-web/src/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx (extensão: prop `disabled`),
app-web/src/app/(authorized)/fichas/[id]/components/SheetProficienciesGrid/index.tsx,
app-web/src/app/(authorized)/fichas/[id]/components/SheetAdjustedProficienciesSection/index.tsx
Arquivos: app-web/src/shared/interfaces/Entities/ProficiencyProperty/index.ts,
app-web/src/shared/interfaces/Entities/ProficiencyGradation/index.ts,
app-web/src/shared/interfaces/Entities/ProficiencyItem/index.ts,
app-web/src/shared/interfaces/Entities/index.ts,
app-web/src/shared/interfaces/Entities/Race/index.ts,
app-web/src/shared/interfaces/Entities/Talent/index.ts,
app-web/src/shared/interfaces/Entities/Training/index.ts,
app-web/src/shared/interfaces/Entities/Characteristic/index.ts,
app-web/src/shared/interfaces/Entities/Biography/index.ts,
app-web/src/shared/interfaces/Entities/Sheet/index.ts,
app-web/src/shared/formSchemas/ProficiencyFormSchema/index.ts,
app-web/src/shared/formSchemas/index.ts,
app-web/src/hooks/Queries/EntityQueries/useProficiencyPropertiesQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useProficiencyGradationsQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useResolveProficiencyAdjustmentMutation/index.ts,
app-web/src/hooks/Queries/EntityQueries/index.ts,
app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx,
app-web/src/app/(authorized)/racas/components/RaceView/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx,
app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx,
app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx,
app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx,
app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx,
app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx,
app-web/src/app/(authorized)/biografias/components/BiographyView/index.tsx,
app-web/src/app/(authorized)/fichas/[id]/page.tsx,
app-web/src/app/(authorized)/fichas/[id]/data/index.ts

**Nota sobre divergência de contrato de API (resolvida antes da implementação):** o
plano acima foi escrito por analogia antes do backend existir, e vários nomes/formatos
assumidos estavam incorretos frente ao contrato real já implementado e aprovado em
review. A implementação seguiu o contrato real, confirmado lendo os DTOs do
`app-api`, e não os nomes assumidos no texto acima. Divergências principais:
- Endpoint de graduações é `GET /proficiency-gradations` (não `/proficiency-grades`);
  a nomenclatura correta em todo o código/dados é "gradation"/"graduação", não
  "grade". A interface ficou `IProficiencyGradation { id; name; level }` (campo
  `level`, não `order`), em vez do `IProficiencyGrade`/`order` assumido no plano.
- `IProficiencyItem` ficou `{ id; property: IProficiencyProperty; gradation:
  IProficiencyGradation }` (campo `gradation`, não `grade`), espelhando
  `ProficiencyItemResponseDto`/`ProficiencyItemInputDto` do backend. O payload das 5
  entidades usa `proficiencies: [{ property, gradation }]` (chaves confirmadas contra
  `ProficiencyItemInputDto`, não assumidas).
- O schema de formulário (`ProficiencyFormSchema`) usa o campo `gradationId` (em vez
  de `gradeId`) para manter a nomenclatura consistente com o restante do código.
- Na ficha, os campos do `SheetResponseDto` são `proficiencias` (snapshot agrupado por
  origem — mesma forma de `melhorias`/`defeitos`, com chaves `race`/`biography`/
  `trainings`/`talents`/`characteristics`, e não um array plano como o plano assumira)
  e `proficienciasAjustadas` (array), não `proficiencies`/`adjustedProficiencies`. A
  interface `ISheet` foi ajustada de acordo, com um helper local `flattenProficiencySnapshot`
  na página da ficha (mesmo padrão do `flattenSnapshot` já existente para
  melhorias/defeitos) para alimentar `SheetProficienciesGrid` com uma lista plana.
- Cada item de `proficienciasAjustadas` segue exatamente
  `SheetProficiencyAdjustmentResponseDto`: `{ id, sourceType, sourceName,
  originalProperty: { id, name }, originalGradation: { id, name, level },
  adjustedProperty: { id, name } | null }`.
- A resolução do ajuste usa `PUT /sheets/:id/proficiency-adjustments/:adjustmentId`
  com body `{ propertyId }`, retornando o `SheetResponseDto` completo — implementado
  como um hook dedicado `useResolveProficiencyAdjustmentMutation`
  (`hooks/Queries/EntityQueries/`) em vez de `usePutEntity`, já que o id do ajuste
  varia por chamada e faz parte da própria URL (`usePutEntity` fixa a `url` na criação
  do hook, o que causaria uma condição de corrida com a URL desatualizada se
  reaproveitado aqui); o mesmo padrão de reidratação de `melhorias`/`defeitos` a partir
  da resposta foi replicado para `proficiencias`/`proficienciasAjustadas`.

**Decisão de arquitetura registrada (ambiguidade do próprio plano, resolvida a favor
da regra de negócio):** a seção "Componentes" descreve `propertyOptions` de
`SheetAdjustedProficienciesSection` como uma lista única (`IProficiencyProperty[]`),
mas a seção "Funcionalidade" exige que a exclusão de propriedade seja calculada "por
item" (incluindo excluir a `adjustedProperty` já escolhida em outros itens de
`proficienciasAjustadas`), o que uma lista única compartilhada não consegue expressar
corretamente quando há mais de um ajuste pendente. Resolvido assim: a página de ficha
(`page.tsx`) calcula e passa em `propertyOptions` apenas a exclusão que depende de dado
externo ao componente (propriedades já aplicadas na aba principal "Proficiências"); o
próprio `SheetAdjustedProficienciesSection`, que já recebe `items`, calcula
internamente por item as duas exclusões restantes (propriedade original de qualquer
ajuste; propriedade substituta já escolhida em outro ajuste), via `useMemo`. O
resultado final implementa integralmente a regra "esconder qualquer propriedade já
aplicada na ficha em qualquer graduação, inclusive substitutas de outros ajustes" do
spec, sem exigir do `page.tsx` conhecimento sobre o formato/regra de conflito interna
da seção.

**Extensão de componente genérico:** `DefaultAutocompleteInput`
(`shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput`) ganhou uma prop
`disabled?: boolean` (repassada ao `Autocomplete` do MUI), necessária para desabilitar
o autocomplete de "Propriedade substituta" do item que está salvando em
`SheetAdjustedProficienciesSection`. É uma extensão não-quebradora do componente
existente.

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Revisão feita contra o contrato real da API (`app-api/src/modules/sheets/dto/sheet-response.dto.ts`,
`sheet-proficiency-adjustment-response.dto.ts`, `sheet-proficiency-snapshot-response.dto.ts`,
`proficiency-item-response.dto.ts`, `proficiency-item-input.dto.ts`,
`resolve-proficiency-adjustment.dto.ts`, `proficiency-gradations.controller.ts`,
`sheets.controller.ts`) e contra a spec (`.claude/tasks/proficiencias/spec.md`). Nenhum problema
bloqueante encontrado. Pontos verificados e confirmados corretos:

- **Aderência ao contrato real**: endpoints `GET /proficiency-properties` e
  `GET /proficiency-gradations` (não "grades") usados corretamente em
  `useProficiencyPropertiesQuery`/`useProficiencyGradationsQuery`; campo `IProficiencyItem.gradation`
  (não `grade`) usado de ponta a ponta (interfaces, `ProficiencyFormSchema.gradationId`,
  `ProficiencyAddModal`, `ProficiencyCard`, payload das 5 entidades `{ property, gradation }`,
  igual a `ProficiencyItemInputDto`); `ISheet.proficiencias` (snapshot agrupado por
  `race`/`biography`/`trainings`/`talents`/`characteristics`) e `ISheet.proficienciasAjustadas`
  (array) espelham exatamente `SheetProficiencySnapshotResponseDto`/
  `SheetProficiencyAdjustmentResponseDto`; `PUT /sheets/:id/proficiency-adjustments/:adjustmentId`
  com body `{ propertyId }` implementado em `useResolveProficiencyAdjustmentMutation` e chamado
  corretamente a partir de `fichas/[id]/page.tsx`.
- **Regra do seletor de propriedade substituta**: `adjustedProficienciesPropertyOptions` em
  `page.tsx` exclui as propriedades já presentes na aba principal (`proficiencias` achatada via
  `flattenProficiencySnapshot`); `SheetAdjustedProficienciesSection` (via `useMemo`
  `optionsByAdjustmentId`) exclui adicionalmente, por item, a propriedade original de qualquer
  ajuste (`originalPropertyIds`) e a `adjustedProperty` já escolhida em outro ajuste
  (`otherChosenIds`). A combinação das duas camadas implementa integralmente "esconder qualquer
  propriedade já aplicada na ficha em qualquer graduação, inclusive substitutas de outros
  ajustes" da spec.
- **Aba somente leitura**: `SheetProficienciesGrid` e a parte de exibição de
  `SheetAdjustedProficienciesSection` não expõem nenhuma ação de adicionar/remover; a única
  interação é o autocomplete de propriedade substituta, que dispara
  `onSelectSubstitute`/`resolveProficiencyAdjustmentMutation.mutate` imediatamente, sem botão de
  salvar. Aba "Proficiências" posicionada imediatamente após "Defeitos" tanto no union type
  `SheetDetailTab` quanto nos componentes `<Tab>`. Grid usa
  `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` em ambos os componentes, consistente com
  o restante da página.
- **Unicidade de propriedade por entidade**: `ProficiencyListField.handleAdd` bloqueia no client
  (via `showToast`) a adição de uma propriedade já presente na lista da mesma entidade,
  independente da graduação, com a mensagem exata do spec.
- **Padrões do CLAUDE.md**: os 5 `CreateForm` e `View` seguem o mesmo padrão dos blocos já
  existentes de Melhorias/Defeitos (estado local hidratado a partir de `<entidade>Detail`,
  resetado ao sair do modo edição/pós-submit, payload `proficiencies: [{ property, gradation }]`);
  hooks novos em `hooks/Queries/EntityQueries` seguem o padrão somente-leitura de
  `useImprovementDefectTypesQuery`/`useImprovementDefectPropertiesQuery`
  (`staleTime: 5 * 60 * 1000`, via `ApiFactory(getAuthToken())`) e estão registrados nos barris
  correspondentes; `ProficiencyFormSchema` usa `zod`/`zodResolver` (não Yup) e está registrado no
  barril de `formSchemas`; ícones usados são todos de `react-icons/fi`
  (`FiTrash2`, `FiZap`, `FiChevronDown` etc.), sem MUI icons/SVG customizado/emoji; o `IconButton`
  de remover em `ProficiencyCard` tem `aria-label` em pt-BR descritivo
  (`Remover proficiência de ${item.property.name}`); nenhum uso de `any` nos arquivos novos;
  reaproveitamento efetivo de `ProficiencyCard`/`ProficiencyListField`/`ProficiencyAddModal` tanto
  nos formulários/views das 5 entidades quanto nos dois componentes novos da ficha, sem duplicação
  de UI equivalente.
- **Extensão de `DefaultAutocompleteInput`**: a prop `disabled?: boolean` é opcional e apenas
  repassada ao `Autocomplete` do MUI (`disabled={disabled}`), sem alterar o comportamento para
  nenhum dos chamadores existentes que não a informam — extensão retrocompatível confirmada.
- **Acesso Google**: comportamento herdado corretamente — os 5 `CreateForm` só são alcançáveis a
  partir de fluxos já protegidos por `!isGoogleUser` (`RacesListItem` e páginas de listagem
  análogas, não alteradas nesta task); as views exibem o bloco "Proficiências" somente leitura sem
  distinção de provider, igual ao comportamento já existente para Melhorias/Defeitos; a feature de
  Fichas de fato não usa `useIsGoogleUser` em nenhum arquivo (confirmado via busca), então a
  ausência de gating na aba "Proficiências"/seção "Proficiências Ajustadas" é consistente com o
  resto da feature, exatamente como sinalizado pelo `web-dev` — nenhuma correção necessária a
  menos que o usuário decida alterar essa premissa.

Nenhum achado de erro de código, tipagem, nomenclatura/estrutura de pastas, formulário, React
Query ou acessibilidade nos arquivos revisados:
`app-web/src/shared/interfaces/Entities/ProficiencyProperty/index.ts`,
`app-web/src/shared/interfaces/Entities/ProficiencyGradation/index.ts`,
`app-web/src/shared/interfaces/Entities/ProficiencyItem/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/interfaces/Entities/Race/index.ts`,
`app-web/src/shared/interfaces/Entities/Talent/index.ts`,
`app-web/src/shared/interfaces/Entities/Training/index.ts`,
`app-web/src/shared/interfaces/Entities/Characteristic/index.ts`,
`app-web/src/shared/interfaces/Entities/Biography/index.ts`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts`,
`app-web/src/shared/formSchemas/ProficiencyFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useProficiencyPropertiesQuery/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useProficiencyGradationsQuery/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/useResolveProficiencyAdjustmentMutation/index.ts`,
`app-web/src/hooks/Queries/EntityQueries/index.ts`,
`app-web/src/shared/components/ProficiencyAddModal/index.tsx`,
`app-web/src/shared/components/ProficiencyCard/index.tsx`,
`app-web/src/shared/components/ProficiencyListField/index.tsx`,
`app-web/src/shared/components/Inputs/DefaultInputs/DefaultAutocompleteInput/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetProficienciesGrid/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetAdjustedProficienciesSection/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/data/index.ts`,
`app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx`,
`app-web/src/app/(authorized)/racas/components/RaceView/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`,
`app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`,
`app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`,
`app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx`,
`app-web/src/app/(authorized)/biografias/components/BiographyView/index.tsx`.