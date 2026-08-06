# Task Web: Saber

## Contexto
Não existe `.claude/tasks/saberes/spec.md` — as regras de negócio já foram fechadas
diretamente com o usuário. A fonte normativa de nomes de campos e formatos é
`.claude/tasks/saberes/task-api.md` (seção "Contrato de API"), usada literalmente
neste plano:

- Nenhuma rota nova. As 5 entidades donas (`talents`, `trainings`, `characteristics`,
  `biographies`, `races`) passam a aceitar/retornar o campo **`knowledges`** (inglês,
  nome de fio — igual ao par já existente `proficiencies`/`proficiencias`) em
  `POST`/`PUT`/`GET`, com assinatura de rota inalterada.
- `KnowledgeItemInputDto` (envio): `{ title: string; gradation: string /* uuid */ }`.
- `KnowledgeItemResponseDto` (retorno): `{ id: string; title: string; gradation: { id: string; name: string; level: number } }`.
- `SheetResponseDto` ganha o campo **`saberes`** (pt-BR, como `melhorias`/`defeitos`/
  `proficiencias`), do tipo `SheetKnowledgeSnapshotResponseDto`, agrupado pelas 5
  chaves `race`/`biography`/`trainings`/`talents`/`characteristics`. Cada entrada:
  `{ id, title, gradation: { id, name, level }, sourceName }`. `trainings`/`talents`/
  `characteristics` são sempre `[]` por ora.
- **Não existe** `saberesAjustados` nem qualquer mecanismo de ajuste/conflito para
  Saber (regra "maior graduação prevalece, menor é descartada sem compensação").
- Graduação de Saber reaproveita o endpoint **já existente**
  `GET /proficiency-gradations` — mesmo hook `useProficiencyGradationsQuery`
  (`app-web/src/hooks/Queries/EntityQueries/useProficiencyGradationsQuery/index.ts`),
  sem criar hook novo.

**Atenção de nomenclatura (evitar o retrabalho já ocorrido antes)**: o campo enviado/
recebido nas 5 entidades donas é `knowledges` (inglês). O campo `saberes` (pt-BR) só
existe no `SheetResponseDto`. Não trocar esses nomes entre si em nenhum ponto do
código do `app-web` (payloads de criação/edição, interfaces, chaves de estado).

## Etapas

### 1. web-dev

#### Componentes

Espelhar estruturalmente os componentes já existentes de Proficiência
(`app-web/src/shared/components/ProficiencyAddModal`,
`app-web/src/shared/components/ProficiencyCard`,
`app-web/src/shared/components/ProficiencyListField`), adaptando o campo de
propriedade (autocomplete + tabela auxiliar) para um campo de texto livre.

1. **Interfaces novas** (`app-web/src/shared/interfaces/Entities/`, um arquivo por
   interface, seguindo o padrão já usado por `IProficiencyItem`):
   - `IKnowledgeItem` (`KnowledgeItem/index.ts`): `{ id: string; title: string; gradation: IProficiencyGradation }`
     — `id` é local/descartável quando criado no modal antes do submit (uuid via
     `uuid`), exatamente como já documentado em `IProficiencyItem`. Reaproveita
     `IProficiencyGradation` (já existe, não criar `IKnowledgeGradation`).
   - `ISheetKnowledgeSnapshotEntry` (em `Sheet/index.ts`, ao lado dos tipos de
     proficiência): `{ id: string; title: string; gradation: IProficiencyGradation; sourceName: string }`.
   - `ISheetKnowledgeSnapshot` (em `Sheet/index.ts`): `{ race: ISheetKnowledgeSnapshotEntry[]; biography: ISheetKnowledgeSnapshotEntry[]; trainings: ISheetKnowledgeSnapshotEntry[]; talents: ISheetKnowledgeSnapshotEntry[]; characteristics: ISheetKnowledgeSnapshotEntry[] }`.
   - Adicionar `knowledges: IKnowledgeItem[]` às interfaces `ITalent`, `ITraining`,
     `ICharacteristic`, `IBiography`, `IRace` (mesmo ponto onde `proficiencies:
     IProficiencyItem[]` já existe em cada uma).
   - Adicionar `saberes: ISheetKnowledgeSnapshot` à interface `ISheet`, ao lado de
     `proficiencias` (**sem** campo irmão de "ajustados").

2. **Schema de formulário** `knowledgeFormSchema`
   (`app-web/src/shared/formSchemas/KnowledgeFormSchema/index.ts`), espelhando
   `ProficiencyFormSchema` mas com `title` livre no lugar de `propertyId`:
   ```
   title: z.string().trim().min(1, 'Informe o título'),
   gradationId: z.string().min(1, 'Selecione a graduação'),
   ```
   Exporta `KnowledgeFormData`, `knowledgeFormResolver` (`zodResolver`) e
   `knowledgeFormDefaultValues` (`{ title: '', gradationId: '' }`).

3. **Componente: `KnowledgeAddModal`** (`app-web/src/shared/components/KnowledgeAddModal`)
   - Props: `open: boolean`, `onClose: () => void`, `onAdd: (item: IKnowledgeItem) => void`.
   - Comportamento esperado: mesmo esqueleto de `ProficiencyAddModal` (`FormModal`
     título "Adicionar Saber", `useForm` com `knowledgeFormResolver`/
     `knowledgeFormDefaultValues`, `reset` ao abrir). Campo "Título" usa
     `FormTextInput` (texto livre, **sem** autocomplete e **sem** consultar nenhuma
     tabela auxiliar — diferença central em relação a Proficiência). Campo
     "Graduação" usa `FormAutocompleteInput<KnowledgeFormData, IProficiencyGradation>`
     com `options` de `useProficiencyGradationsQuery()` (mesmo hook já existente,
     `getOptionLabel`/`getOptionValue` iguais aos já usados em `ProficiencyAddModal`).
     No submit, resolve a `gradation` pelo id selecionado e chama
     `onAdd({ id: uuidv4(), title: data.title.trim(), gradation })` — título já
     trimado ao sair do modal, então o restante do fluxo (unicidade, exibição,
     payload) sempre trabalha com o valor sem espaços nas pontas.

4. **Componente: `KnowledgeCard`** (`app-web/src/shared/components/KnowledgeCard`)
   - Props: `item: Omit<IKnowledgeItem, 'id'> & { id?: string | null }` (aceita tanto
     o item local quanto uma entrada de snapshot de ficha, cujo `id` pode ser tratado
     como opcional pelo mesmo motivo documentado em `ProficiencyCardProps`),
     `onRemove?: () => void`.
   - Comportamento esperado: mesmo layout de `ProficiencyCard`
     (`APP_CONTAINER_STYLES.detailInfoField`), exibindo `Título: {item.title}` e
     `Graduação: {item.gradation.name}`; `onRemove` opcional renderiza o mesmo
     `IconButton`/`Tooltip` de remover já usado em `ProficiencyCard`.

5. **Componente: `KnowledgeListField`** (`app-web/src/shared/components/KnowledgeListField`)
   - Props: `label: string`, `addButtonLabel: string`, `value: IKnowledgeItem[]`,
     `onChange: (value: IKnowledgeItem[]) => void` — mesma assinatura de
     `ProficiencyListField`.
   - Comportamento esperado: mesmo esqueleto (`SecondaryButton` para abrir
     `KnowledgeAddModal`, lista de `KnowledgeCard` com botão remover, mensagem
     "Nenhum item adicionado." quando vazio). `handleAdd` implementa a regra de
     **unicidade case-insensitive + trim** pedida: bloquear duplicata comparando
     `existing.title.trim().toLowerCase() === item.title.trim().toLowerCase()`
     (título já chega trimado do modal, mas a comparação deve normalizar caixa e,
     por segurança, re-trimar) e, se houver colisão, disparar `showToast({ type:
     'error', message: 'Este saber já foi adicionado. Cada entidade só pode ter um
     saber por título (a comparação ignora maiúsculas/minúsculas e espaços nas
     pontas).' })` sem adicionar o item — mesmo padrão de
     `ProficiencyListField.handleAdd`, adaptado de `property.id` para título
     normalizado. `handleRemove` filtra por `id` do item local, igual ao já
     existente.

6. **Componente de ficha: `SheetKnowledgesPanel`**
   (`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgesPanel`)
   - Props: `items: ISheetKnowledgeSnapshotEntry[]`.
   - Comportamento esperado: quadro somente leitura, sem nenhuma interação (sem
     adicionar/remover/ajustar), mantendo o mesmo padrão visual de
     `SheetAttributesPanel` (`APP_CONTAINER_STYLES.detailSectionBox` +
     `detailSectionBoxHeader` com `Label` "Saberes" em `APP_COLORS.goldSoft`,
     acompanhada de um ícone `react-icons/fi` coerente com os já usados nas outras
     seções — ex. `FiBookOpen` — **sem** o botão/ícone de "ver detalhes" que
     `SheetAttributesPanel` tem, já que não há modal de detalhamento para Saber).
     O corpo do quadro renderiza um grid responsivo `grid-cols-1 sm:grid-cols-2
     lg:grid-cols-3` (mesmo padrão de `SheetProficienciesGrid`, até 3 cards lado a
     lado), onde cada célula mostra `KnowledgeCard` (sem `onRemove`, pois é somente
     leitura) seguido de uma linha `Concedida por: {item.sourceName}` no mesmo
     estilo (`DefaultText` itálico) já usado em `SheetProficienciesGrid`. Quando
     `items.length === 0`, exibir `DefaultText` "Nenhum saber vinculado." no lugar
     do grid — mesmo padrão de `emptyMessage` de `SheetProficienciesGrid`.

#### Funcionalidade

**Páginas/rotas** (nenhuma rota nova — todas já existem):
- `app/(authorized)/talentos` — `TalentCreateForm` (modal de criar/editar) e
  `TalentView` (visualização).
- `app/(authorized)/treinamentos` — `TrainingCreateForm` e `TrainingView`.
- `app/(authorized)/caracteristicas` — `CharacteristicCreateForm` e
  `CharacteristicView`.
- `app/(authorized)/biografias` — `BiographyCreateForm` e `BiographyView`.
- `app/(authorized)/racas` — `RaceCreateForm` e `RaceView`.
- `app/(authorized)/fichas/[id]` — `page.tsx`, aba "Estatísticas".

**Nas 5 entidades donas — formulário de criação/edição**:
Em cada `*CreateForm`, adicionar um estado local `knowledges` (`useState<IKnowledgeItem[]>([])`)
e renderizar `<KnowledgeListField label="Saber" addButtonLabel="Adicionar Saber"
value={knowledges} onChange={setKnowledges} />` **imediatamente abaixo** do
`<ProficiencyListField .../>` já existente em cada formulário (mesmo ponto exato em
todos os 5 arquivos: `TalentCreateForm`, `TrainingCreateForm`,
`CharacteristicCreateForm`, `BiographyCreateForm`, `RaceCreateForm`). Seguir
literalmente o mesmo ciclo de vida já usado para `proficiencies` em cada um desses
arquivos:
- Resetar `knowledges` para `[]` no `useEffect` de saída do modo edição (ao lado do
  `setProficiencies([])` já existente).
- Popular `knowledges` a partir de `<entidade>Detail.knowledges ?? []` no `useEffect`
  de carregamento em modo edição (ao lado de `setProficiencies(<entidade>Detail.proficiencies ?? [])`).
- Incluir `knowledges` no `buildPayload`/payload de criação e edição, mapeando
  **para o nome de campo `knowledges`** (não `saberes`):
  `knowledges: knowledges.map((item) => ({ title: item.title, gradation: item.gradation.id }))`
  — `item.title` já chega trimado do `KnowledgeAddModal`, então não precisa de
  trim adicional aqui (mas também não há problema em reforçar `.trim()` no
  mapeamento, à critério do `web-dev`).
- Resetar `knowledges` para `[]` também no `onSuccess` de criação (ao lado do
  `setProficiencies([])` do `createTalentMutation`/equivalentes), mantendo o mesmo
  padrão de limpeza pós-cadastro.

**Nas 5 entidades donas — visualização**:
Em cada `*View` (`TalentView`, `TrainingView`, `CharacteristicView`, `BiographyView`,
`RaceView`), adicionar um novo bloco `detailSectionBox`/`detailSectionBoxHeader` com
`Label` "Saber" (mesmo ícone/estilo dourado das demais seções — ex.
`FiBookOpen`/`APP_COLORS.goldSoft`), renderizando `<entidade>.knowledges.map((item) =>
<KnowledgeCard key={item.id} item={item} />)` com a mesma mensagem "Nenhum item
adicionado." quando vazio — **imediatamente abaixo** do bloco "Proficiências" já
existente em cada uma dessas 5 telas (ver `TalentView` como referência literal de
onde encaixar, entre o bloco de Proficiências e o de Habilidades Adicionais).

**Integrações com API** (nenhum endpoint novo, apenas payload adicional nas rotas
já consumidas por cada tela):
- `POST /talents`, `PUT /talents/:id`, `GET /talents/:id` (via `usePostEntity`/
  `usePutEntity`/`useGetEntityById` já existentes em `TalentCreateForm`/`TalentView`).
- `POST /trainings`, `PUT /trainings/:id`, `GET /trainings/:id`.
- `POST /characteristics`, `PUT /characteristics/:id`, `GET /characteristics/:id`.
- `POST /biographies`, `PUT /biographies/:id`, `GET /biographies/:id`.
- `POST /races`, `PUT /races/:id`, `GET /races/:id`.
- `GET /proficiency-gradations` (via `useProficiencyGradationsQuery`, reaproveitado
  sem alteração, usado dentro de `KnowledgeAddModal`).
- `GET /sheets/:id` (via o `useGetEntityById<ISheet>` já usado em
  `app/(authorized)/fichas/[id]/page.tsx`) — agora também retorna `saberes`.
- `PUT /sheets/:id/race`, `DELETE /sheets/:id/race`, `PUT /sheets/:id/biography`,
  `DELETE /sheets/:id/biography` — já consumidos pelas mutations
  `linkRaceMutation`, `unlinkRaceMutation`, `linkBiographyMutation`,
  `unlinkBiographyMutation` em `page.tsx`; passam a devolver `saberes` recomputado
  também.

**Formulário/validação (modal "Adicionar Saber")**:
- "Título": texto livre, obrigatório (`title.trim().min(1)`), **sem** autocomplete e
  **sem** tabela auxiliar de propriedades (diferente de Proficiência).
- "Graduação": obrigatória, autocomplete alimentado por `useProficiencyGradationsQuery`
  (mesmas opções/ordenação já usadas em Proficiência).
- Unicidade por entidade: título único comparado case-insensitive + trim, bloqueada
  no frontend com toast em `KnowledgeListField.handleAdd` (ver componente acima) —
  mesma camada de proteção que `ProficiencyListField.handleAdd` já faz hoje para
  propriedade repetida (a validação definitiva de banco/serviço já está coberta na
  API, esta é a camada de UX que evita o round-trip de erro do backend).

**Na ficha (`page.tsx`, aba "Estatísticas")**:
- Importar `ISheetKnowledgeSnapshot`/`ISheetKnowledgeSnapshotEntry` de
  `@/shared/interfaces` e o novo componente `SheetKnowledgesPanel`.
- Adicionar `const [saberes, setSaberes] = useState<ISheetKnowledgeSnapshot>(sheet-inicial)`,
  seguindo o mesmo padrão de `proficiencias` (`useState<ISheetProficiencySnapshot>`):
  inicializar com o mesmo shape default vazio (`{ race: [], biography: [], trainings:
  [], talents: [], characteristics: [] }`) e sincronizar com `sheet.saberes` no
  mesmo `useEffect` que já chama `setProficiencias(sheet.proficiencias)` (linha ~150
  do arquivo atual).
- Adicionar `setSaberes(data.saberes)` nos `onSuccess` de **exatamente** as mesmas 4
  mutations que já chamam `setProficiencias(data.proficiencias)`:
  `linkRaceMutation`, `unlinkRaceMutation`, `linkBiographyMutation`,
  `unlinkBiographyMutation` (linhas ~338, ~359, ~383, ~407 do arquivo atual). **Não**
  adicionar em `resolveProficiencyAdjustmentMutation` nem em `updateImageMutation`/
  mutation de campanha, pois `saberes` não é afetado por ajuste de proficiência,
  imagem ou campanha (mesmo escopo de recomputação definido na API).
- Adicionar uma função local `flattenKnowledgeSnapshot(snapshot: ISheetKnowledgeSnapshot)`
  ao lado das já existentes `flattenSnapshot`/`flattenProficiencySnapshot` (mesmo
  arquivo, mesmo padrão: `[...snapshot.race, ...snapshot.biography,
  ...snapshot.trainings, ...snapshot.talents, ...snapshot.characteristics]`).
- No conteúdo da aba `estatisticas` (dentro do `{activeTab === 'estatisticas' && (...)}`),
  renderizar `<SheetKnowledgesPanel items={flattenKnowledgeSnapshot(saberes)} />`
  **imediatamente abaixo** de `<SheetAttributesPanel .../>` já existente (mesmo bloco
  JSX, linhas ~602-607 do arquivo atual) — **não** na aba "Proficiências".
- A listagem é **somente leitura**: nenhum modal, nenhuma ação de adicionar/remover/
  ajustar é exposta na ficha para Saber, coerente com "não existe endpoint de
  ajuste" confirmado no contrato da API.

**Acesso Google**: **ocultar criar/editar/excluir (padrão)** — os 5 controllers das
entidades donas (`talents`, `trainings`, `characteristics`, `biographies`, `races`)
já são `@GoogleAccess('read-only')` hoje e o frontend já oculta as ações de criar/
editar/excluir para `provider: 'google'` nessas 5 telas; a adição da seção "Saber"
nos formulários e nos cards de visualização não muda esse comportamento — usuários
Google continuam vendo apenas a visualização (incluindo os cards de Saber), sem
acesso aos botões "Adicionar Saber"/"Salvar"/"Cadastrar". Na ficha, a nova listagem
de Saberes é somente leitura para **todos** os usuários (não há ação de
criar/editar/excluir/ajustar ali para ninguém), então não há tratamento
diferenciado adicional a fazer para Google nessa tela.

Status: concluído
Componentes:
- app-web/src/shared/components/KnowledgeAddModal/index.tsx
- app-web/src/shared/components/KnowledgeCard/index.tsx
- app-web/src/shared/components/KnowledgeListField/index.tsx
- app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgesPanel/index.tsx
Arquivos:
- app-web/src/shared/interfaces/Entities/KnowledgeItem/index.ts (novo)
- app-web/src/shared/interfaces/Entities/index.ts (barrel)
- app-web/src/shared/interfaces/Entities/Sheet/index.ts (ISheetKnowledgeSnapshotEntry, ISheetKnowledgeSnapshot, ISheet.saberes)
- app-web/src/shared/interfaces/Entities/Talent/index.ts, Training/index.ts, Characteristic/index.ts, Biography/index.ts, Race/index.ts (campo knowledges)
- app-web/src/shared/formSchemas/KnowledgeFormSchema/index.ts (novo)
- app-web/src/shared/formSchemas/index.ts (barrel)
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx e TalentView/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx e TrainingView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx e CharacteristicView/index.tsx
- app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx e BiographyView/index.tsx
- app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx e RaceView/index.tsx
- app-web/src/app/(authorized)/fichas/[id]/page.tsx (estado saberes, flattenKnowledgeSnapshot, setSaberes nas 4 mutations de raça/biografia, painel na aba Estatísticas)
- app-web/src/app/(authorized)/fichas/[id]/data/index.ts (SHEET_EMPTY_KNOWLEDGE_SNAPSHOT)

### 2. web-dev-codereviewer
- Revisar tudo acima, com atenção especial a: (a) o payload de criação/edição das 5
  entidades donas usar exatamente o nome de campo `knowledges` (nunca `saberes`);
  (b) o `SheetResponseDto`/`ISheet` do frontend usar exatamente `saberes` (nunca
  `knowledges`) e **não** ter nenhum campo de "ajustados" para Saber; (c) a regra de
  unicidade em `KnowledgeListField.handleAdd` comparar título normalizado
  (`trim().toLowerCase()`) e não apenas o título bruto; (d) o novo quadro de Saberes
  na ficha aparecer na aba "Estatísticas" logo abaixo de `SheetAttributesPanel`, e
  não na aba "Proficiências"; (e) a listagem de Saberes na ficha permanecer
  inteiramente somente leitura (sem nenhuma ação de adicionar/remover/ajustar).

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Verificações realizadas, todas conformes:

- **Contrato de API — nomenclatura** (ponto de maior risco): confirmado nos DTOs reais
  (`app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts`,
  `knowledge-item-response.dto.ts`, `app-api/src/modules/sheets/dto/
  sheet-knowledge-snapshot-entry-response.dto.ts`, `sheet-knowledge-snapshot-response.dto.ts`,
  `sheet-response.dto.ts`) que o campo `knowledges` (`{ title, gradation }` no
  envio / `{ id, title, gradation: { id, name, level } }` no retorno) é usado nas 5
  entidades donas, e `saberes` (`{ race, biography, trainings, talents,
  characteristics }`, entradas `{ id, title, gradation, sourceName }`) é usado
  exclusivamente no `SheetResponseDto`. No frontend, os 5 `buildPayload`
  (`TalentCreateForm`, `TrainingCreateForm`, `CharacteristicCreateForm`,
  `BiographyCreateForm`, `RaceCreateForm`) mapeiam
  `knowledges: knowledges.map((item) => ({ title: item.title, gradation: item.gradation.id }))`
  — nome de campo correto, nunca `saberes`. `ISheet.saberes` (`Sheet/index.ts`) usa
  `saberes: ISheetKnowledgeSnapshot`, sem nenhum campo irmão de "ajustados"
  (confirmado via busca por `saberesAjustad`/`KnowledgeAdjustment`, sem ocorrências
  no app-web). `IKnowledgeItem`/`ISheetKnowledgeSnapshotEntry`/`ISheetKnowledgeSnapshot`
  batem exatamente com o contrato (`task-api.md` linhas 41-42 e 61-74).
- **Unicidade case-insensitive + trim**: `KnowledgeListField.handleAdd`
  (`app-web/src/shared/components/KnowledgeListField/index.tsx`) usa
  `normalizeTitle = (title) => title.trim().toLowerCase()` e compara
  `normalizeTitle(existing.title) === normalizeTitle(item.title)`, disparando
  `showToast({ type: 'error', ... })` com a mensagem exata pedida e sem adicionar o
  item em caso de colisão — espelha fielmente `ProficiencyListField.handleAdd`,
  apenas trocando a chave de comparação de `property.id` para título normalizado.
- **Posicionamento**: nos 5 `*CreateForm`, `<KnowledgeListField label="Saber" .../>`
  está imediatamente abaixo de `<ProficiencyListField .../>` (confirmado em
  `TalentCreateForm`, `TrainingCreateForm`, `CharacteristicCreateForm`,
  `BiographyCreateForm`, `RaceCreateForm`). Nas 5 `*View`, o bloco "Saber" (`FiBookOpen`,
  `APP_COLORS.goldSoft`) está imediatamente abaixo do bloco "Proficiências" e acima de
  "Habilidades Adicionais" (`TalentView` confirmado literalmente como referência; os
  outros 4 seguem o mesmo ponto). Na ficha, `<SheetKnowledgesPanel
  items={flattenKnowledgeSnapshot(saberes)} />` está dentro de
  `{activeTab === 'estatisticas' && (...)}`, logo abaixo de `<SheetAttributesPanel
  .../>` e não na aba "Proficiências" (`page.tsx` linhas 621-632).
  `SheetKnowledgesPanel` usa grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (mesmo
  padrão de `SheetProficienciesGrid`), cada célula com `KnowledgeCard` (sem
  `onRemove`) seguido de `Concedida por: {item.sourceName}` em `DefaultText` itálico,
  e mensagem "Nenhum saber vinculado." quando vazio — idêntico ao padrão de
  `SheetProficienciesGrid`/`emptyMessage`. O header do painel segue
  `SheetAttributesPanel` (`detailSectionBox`/`detailSectionBoxHeader`, `Label`
  "Saberes" em `goldSoft`, ícone `FiBookOpen` de `react-icons/fi`), sem o
  `IconButton`/`Tooltip` de "ver detalhes" que `SheetAttributesPanel` tem, conforme
  pedido (não há modal de detalhamento para Saber).
- **Somente leitura na ficha**: `SheetKnowledgesPanel` não recebe `onRemove` nem
  qualquer callback de mutação; `KnowledgeCard` renderizado sem `onRemove` na ficha,
  e nenhuma mutation de "ajuste" de saber existe em `page.tsx` (apenas
  `resolveProficiencyAdjustmentMutation`, que é exclusiva de Proficiência e não foi
  tocada para Saber).
- **Sincronização**: `setSaberes(data.saberes)` está presente exatamente nos 4
  `onSuccess` de `linkRaceMutation`, `unlinkRaceMutation`, `linkBiographyMutation` e
  `unlinkBiographyMutation` (`page.tsx` linhas 353-355, 375-377, 400-402, 425-427),
  ao lado de `setProficiencias`/`setProficienciasAjustadas` já existentes, sem
  alterar a lógica pré-existente desses blocos. `resolveProficiencyAdjustmentMutation`
  (linha ~443-449) não ganhou `setSaberes`, coerentemente com "saberes não é afetado
  por ajuste de proficiência". `flattenKnowledgeSnapshot` (linha 88) segue o mesmo
  padrão de `flattenSnapshot`/`flattenProficiencySnapshot`. `SHEET_EMPTY_KNOWLEDGE_SNAPSHOT`
  (`data/index.ts`) tem o mesmo shape vazio das 5 chaves.
- **Padrões do CLAUDE.md**: `KnowledgeAddModal`/`KnowledgeCard`/`KnowledgeListField`
  reaproveitam `FormModal`, `FormTextInput`, `FormAutocompleteInput`, `SecondaryButton`,
  `PrimaryButton`, `DefaultText`/`Label`, `APP_CONTAINER_STYLES`/`APP_COLORS` já
  existentes — nenhum componente duplicado. `useProficiencyGradationsQuery` é
  reaproveitado sem alteração dentro de `KnowledgeAddModal` (nenhum hook novo de
  graduação foi criado, confirmado por busca em `hooks/Queries`). `knowledgeFormSchema`
  segue a mesma estrutura de `proficiencyFormSchema` (zod + `zodResolver`, sem Yup).
  Ícone usado é `FiBookOpen`/`FiTrash2` de `react-icons/fi` em todos os pontos, sem
  `@mui/icons-material` nem SVG customizado. `IconButton` de remover em `KnowledgeCard`
  tem `aria-label` em pt-BR (`Remover saber ${item.title}`). Nenhum `any` foi
  introduzido nos arquivos novos/alterados. Todas as interfaces/campos usam o alias
  `@/*`. Textos de UI (labels, toasts, mensagens de erro) em pt-BR. Ciclo de vida de
  `knowledges` nos 5 `*CreateForm` (reset ao sair da edição, população em modo
  edição, inclusão no payload, reset no `onSuccess` de criação) espelha
  fielmente o já existente para `proficiencies` em cada arquivo.

Arquivos revisados: `app-web/src/shared/components/KnowledgeAddModal/index.tsx`,
`app-web/src/shared/components/KnowledgeCard/index.tsx`,
`app-web/src/shared/components/KnowledgeListField/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/components/SheetKnowledgesPanel/index.tsx`,
`app-web/src/shared/interfaces/Entities/KnowledgeItem/index.ts`,
`app-web/src/shared/interfaces/Entities/index.ts`,
`app-web/src/shared/interfaces/Entities/Sheet/index.ts`,
`app-web/src/shared/interfaces/Entities/{Talent,Training,Characteristic,Biography,Race}/index.ts`,
`app-web/src/shared/formSchemas/KnowledgeFormSchema/index.ts`,
`app-web/src/shared/formSchemas/index.ts`,
`app-web/src/app/(authorized)/talentos/components/{TalentCreateForm,TalentView}/index.tsx`,
`app-web/src/app/(authorized)/treinamentos/components/{TrainingCreateForm,TrainingView}/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/{CharacteristicCreateForm,CharacteristicView}/index.tsx`,
`app-web/src/app/(authorized)/biografias/components/{BiographyCreateForm,BiographyView}/index.tsx`,
`app-web/src/app/(authorized)/racas/components/{RaceCreateForm,RaceView}/index.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/page.tsx`,
`app-web/src/app/(authorized)/fichas/[id]/data/index.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-input.dto.ts`,
`app-api/src/modules/knowledges/dto/knowledge-item-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-entry-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-knowledge-snapshot-response.dto.ts`,
`app-api/src/modules/sheets/dto/sheet-response.dto.ts` (referência do contrato, não
alterados por esta etapa).