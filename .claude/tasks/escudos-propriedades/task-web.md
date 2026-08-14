# Task Web: Propriedades de Escudos

## Contexto
Ver .claude/tasks/escudos-propriedades/spec.md

Não existe `.claude/tasks/escudos-propriedades/task-api.md` no momento deste
planejamento — os nomes de campo usados abaixo são provisórios, escolhidos por analogia
direta com o padrão já adotado em `IArmor`/`ArmorFormSchema` (mesma demanda análoga,
`.claude/tasks/armaduras-propriedades/`) e com convenções já existentes em outras
entidades do projeto:

- Apelido → `nickname: string` (idêntico ao já usado em `IArmor`/`IWeapon`).
- Volume → `volume: number` (idêntico ao já usado em `IArmor`/`IWeapon`).
- Bônus de CA → `armorClassBonus: number` (idêntico ao já usado em `IArmor`, mesmo
  rótulo "Bônus de CA").
- Penalidade de Velocidade (Metros) → `speedPenaltyMeters: number` (idêntico ao já
  usado em `IArmor`).
- Dureza → `hardness: number` (nome novo, sem precedente direto no projeto).
- Pontos de Vida → `hitPoints: number` (já é o nome usado para o campo análogo em
  `IRace`/ficha de personagem — `SheetHitPointsPanel`, ícone `FiHeart` — reaproveitado
  aqui pelo mesmo motivo).
- Limiar de Quebra → `breakThreshold: number` (nome novo; campo somente leitura,
  calculado e persistido pela API).

**Esta é uma dependência explícita, não uma decisão de arquitetura**: se
`task-api.md` desta demanda definir nomes diferentes, o `web-dev` deve usar os nomes
reais do contrato da API, não os propostos aqui.

Investigação de código feita para este plano (ver arquivos citados abaixo):
`app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx`,
`.../ShieldView/index.tsx`, `app-web/src/shared/formSchemas/ShieldFormSchema/index.ts`,
`app-web/src/shared/interfaces/Entities/Shield/index.ts` (estado atual, sem os 7 campos
novos) e o precedente completo já implementado em Armaduras:
`app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx`,
`.../ArmorView/index.tsx`, `app-web/src/shared/formSchemas/ArmorFormSchema/index.ts`,
`app-web/src/shared/interfaces/Entities/Armor/index.ts`.

## Etapas

### 1. web-dev

#### Funcionalidade

**Páginas/rotas**

- Sem rota nova. Alterados (sem mudança de rota):
  `app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx` e
  `.../ShieldView/index.tsx`.
- Sem nenhum componente novo: todos os inputs necessários já existem
  (`FormTextInput`/`FormMultiAutocompleteInput`/`FormAutocompleteInput`/
  `FormRichTextInput` em `shared/components/Inputs/FormInputs`, e `DefaultTextInput` em
  `shared/components/Inputs/DefaultInputs` para o campo somente leitura — ver abaixo).
  `ShieldsListItem`, a tabela de listagem e `ShieldsFilterSection` **não são alterados**
  (fora de escopo, conforme spec).

**Interfaces/schema alterados**

- `shared/interfaces/Entities/Shield/index.ts` — `IShield` ganha os 7 campos novos, todos
  opcionais/nullable (nomes provisórios, ver "Contexto"):
  ```
  nickname?: string | null;
  volume?: number | null;
  armorClassBonus?: number | null;
  speedPenaltyMeters?: number | null;
  hardness?: number | null;
  hitPoints?: number | null;
  breakThreshold?: number | null;
  ```
  `IShieldListItem` e `IShieldListFilters` **não são alterados** — spec confirma que a
  listagem e os filtros permanecem inalterados, e Escudos não tem nenhuma relação nova
  (como `traits` em Armadura) que exigisse ajuste no item de listagem.
- `shared/formSchemas/ShieldFormSchema/index.ts` — novos campos sempre opcionais no
  schema, seguindo literalmente os mesmos padrões já usados em `ArmorFormSchema`:
  ```
  nickname: z.string(),
  volume: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe um volume válido (no máximo 1 casa decimal)',
  ),
  armorClassBonus: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um bônus de CA inteiro válido',
  ),
  speedPenaltyMeters: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe uma penalidade de velocidade válida (no máximo 1 casa decimal)',
  ),
  hardness: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um valor de dureza inteiro válido',
  ),
  hitPoints: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um valor de pontos de vida inteiro válido',
  ),
  ```
  `shieldFormDefaultValues` ganha os equivalentes em `''`. **`breakThreshold` NÃO entra
  no zod schema** — não é um campo do formulário (ver "Campo derivado: Limiar de
  Quebra" abaixo). O `superRefine` de preço/moeda já existente permanece inalterado.
- Nenhum hook novo em `hooks/Queries` é necessário — os 7 campos novos não dependem de
  nenhuma tabela auxiliar (diferente de "Categoria" em Armaduras, que exigiu
  `useArmorCategoriesQuery`).

**Integrações com API**

- `GET /shields/:id`, `POST /shields`, `PUT /shields/:id` — endpoints já existentes,
  passam a enviar (create/update) e receber (leitura) os 6 campos escritos pelo usuário
  (`nickname`, `volume`, `armorClassBonus`, `speedPenaltyMeters`, `hardness`,
  `hitPoints`) e a receber (somente leitura) `breakThreshold`. `invalidateQueryKeys`
  inalterado (`[['/shields']]`).
- **`breakThreshold` nunca é enviado no payload de `POST`/`PUT`** — é responsabilidade
  exclusiva do backend calculá-lo e persisti-lo (`floor(hitPoints / 2)`, 0 quando
  `hitPoints` estiver vazio/nulo), conforme "Escopo confirmado" do spec.

**Formulário/validação — `ShieldCreateForm` (novo layout, 6 linhas exatas, campos
existentes preservados sem quebra)**, seguindo a ordem/agrupamento definida no spec:

1. `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Nome (`FormTextInput`, existente,
   obrigatório), Apelido (`FormTextInput`, novo, `name="nickname"`, opcional, texto
   livre), Imagem Referência (`FormTextInput`, existente), Tag
   (`FormMultiAutocompleteInput`, existente, `name="tagIds"`).
2. `grid grid-cols-1 sm:grid-cols-3`: Preço (existente), Moeda (existente), Volume
   (`FormTextInput`, novo, `name="volume"`, `type="number"`,
   `slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}`, opcional, 1
   casa decimal).
3. `grid grid-cols-1 sm:grid-cols-2`: Bônus de CA (`FormTextInput`, novo,
   `name="armorClassBonus"`, `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 1,
   inputMode: 'numeric' } }}`, opcional, inteiro ≥ 0), Penalidade de Velocidade (Metros)
   (`FormTextInput`, novo, `name="speedPenaltyMeters"`, `type="number"`,
   `slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}`, opcional, 1
   casa decimal).
4. `grid grid-cols-1 sm:grid-cols-3`: Dureza (`FormTextInput`, novo, `name="hardness"`,
   `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' }
   }}`, opcional, inteiro ≥ 0), Pontos de Vida (`FormTextInput`, novo,
   `name="hitPoints"`, `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 1,
   inputMode: 'numeric' } }}`, opcional, inteiro ≥ 0), **Limiar de Quebra** (campo
   derivado, ver abaixo).
5. Linha cheia: Descrição (`FormRichTextInput`, existente, inalterado).
6. Linha cheia: Informações Privadas (`FormRichTextInput`, existente, inalterado).

**Campo derivado: Limiar de Quebra (desabilitado, fora do react-hook-form/zod)**

- Renderizado com `DefaultTextInput` (não `FormTextInput` — não é registrado no
  `control` nem no schema, pois não é um dado submetido pelo usuário), `disabled`,
  `type="number"`, label "Limiar de Quebra".
- Valor calculado dinamicamente a partir de `watch('hitPoints')` do `useForm`:
  `const hitPointsValue = watch('hitPoints'); const breakThresholdValue = hitPointsValue
  ? Math.floor(Number(hitPointsValue) / 2) : 0;` — recalcula a cada digitação em Pontos
  de Vida, exibe `0` quando o campo estiver vazio, replicando em tela a mesma fórmula
  que o backend aplica ao salvar (conforme spec).
- Em modo edição, **não é hidratado separadamente** em `reset()` — como é puramente
  derivado de `hitPoints`, assim que `reset()` popula `hitPoints` a partir de
  `shieldDetail.hitPoints`, o `watch` recalcula o valor exibido automaticamente. Não é
  necessário (nem correto) usar `shieldDetail.breakThreshold` para preencher esse campo
  em tela, já que ele deve refletir o que está digitado em Pontos de Vida no momento,
  não o último valor persistido — ambos coincidem em condições normais, mas a fonte de
  verdade em tela é sempre o `watch`.
- `buildPayload` (em `ShieldCreateForm`) **não inclui `breakThreshold`** em nenhuma
  hipótese — nem no payload de criação, nem no de edição. Os outros 6 campos seguem o
  mesmo critério já usado em `ArmorCreateForm` (string vazia → `undefined`/`null`, valor
  preenchido → convertido):
  ```
  nickname: data.nickname || undefined,
  volume: data.volume ? Number(data.volume) : null,
  armorClassBonus: data.armorClassBonus ? Number(data.armorClassBonus) : null,
  speedPenaltyMeters: data.speedPenaltyMeters ? Number(data.speedPenaltyMeters) : null,
  hardness: data.hardness ? Number(data.hardness) : null,
  hitPoints: data.hitPoints ? Number(data.hitPoints) : null,
  ```
- O `useEffect` de hidratação em modo edição ganha os equivalentes de leitura para os 6
  campos escritos (`nickname: shieldDetail.nickname ?? ''`, `volume:
  shieldDetail.volume != null ? String(shieldDetail.volume) : ''`,
  `armorClassBonus`/`speedPenaltyMeters`/`hardness`/`hitPoints` seguindo o mesmo
  padrão) dentro do `reset(...)` já existente.

**`ShieldView` (modal de visualização) — novo conteúdo, mantendo a estrutura visual já
existente (imagem + coluna de info + blocos `detailSectionBox`)**:

- A coluna de info ao lado da imagem, hoje com um único campo "Preço" em layout de
  linha única, passa a usar `grid grid-cols-1 sm:grid-cols-2` (mesmo padrão já usado em
  `ArmorView`), com o bloco "Preço" existente mais os 7 blocos novos, todos no mesmo
  container `detailInfoField`:
  - Apelido (`shield.nickname`, bloco condicional — só aparece se preenchido, idêntico
    ao tratamento de `armor.nickname` em `ArmorView`), ícone `FiTag`.
  - Volume (`shield.volume ?? NOT_INFORMED`), ícone `FiPackage`.
  - Bônus de CA (`shield.armorClassBonus ?? NOT_INFORMED`), ícone `FiPlusCircle`.
  - Penalidade de Velocidade (Metros) (`shield.speedPenaltyMeters ?? NOT_INFORMED`),
    ícone `FiWind`.
  - Dureza (`shield.hardness ?? NOT_INFORMED`), ícone `FiHexagon`.
  - Pontos de Vida (`shield.hitPoints ?? NOT_INFORMED`), ícone `FiHeart` (mesmo ícone já
    usado para "Pontos de Vida" em `RaceView`).
  - Limiar de Quebra (`shield.breakThreshold ?? 0`, **sem** fallback `NOT_INFORMED`,
    pois o backend sempre persiste um inteiro — inclusive `0` quando Pontos de Vida
    está vazio — nunca deixando esse campo como "não informado"), ícone
    `FiAlertTriangle`.
  (Ícones sugeridos, ajustáveis pelo `web-dev`, desde que permaneçam em `react-icons/fi`,
  mesma família já usada no componente.)
- Nenhum bloco `detailSectionBox` novo é necessário (diferente de Armaduras/Traços) —
  Escudos não ganha nenhuma relação com outra entidade nesta demanda.
- Blocos "Descrição" e "Informações Privadas" (este último já oculto para
  `provider: 'google'`) permanecem inalterados, ao final.

**Acesso Google:** ocultar criar/editar/excluir (padrão, sem alteração de
comportamento) — a proteção já existente em `ShieldsPage`/`ShieldsListItem` via
`useIsGoogleUser` continua funcionando sem nenhuma mudança (não alterados nesta
demanda); os campos novos do formulário só são alcançáveis pelo mesmo fluxo já
protegido. Os 7 campos novos em `ShieldView` são somente leitura e ficam visíveis a
todos os usuários, igual aos blocos "Preço"/"Descrição" já existentes (só "Informações
Privadas" permanece oculto para Google).

Status: concluído
Componentes: nenhum (nenhum componente novo — apenas alteração de componentes específicos de página já existentes)
Arquivos: app-web/src/shared/interfaces/Entities/Shield/index.ts, app-web/src/shared/formSchemas/ShieldFormSchema/index.ts, app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx, app-web/src/app/(authorized)/escudos/components/ShieldView/index.tsx

Nomenclatura de campos confirmada contra `task-api.md` (`nickname`, `volume`,
`armorClassBonus`, `speedPenaltyMeters`, `hardness`, `hitPoints`, `breakThreshold`) —
idêntica aos nomes provisórios já usados neste plano, sem nenhuma divergência a
corrigir. `breakThreshold` não é enviado em nenhuma hipótese no payload de
`POST`/`PUT` (fora do `Omit`/interface `ShieldPayload` e do zod schema), é renderizado
via `DefaultTextInput` desabilitado fora do `control`, e recalculado dinamicamente a
partir de `watch('hitPoints')`.

### 2. web-dev-codereviewer
- Revisar tudo acima, com atenção especial a:
  - Nomenclatura de campos usada de fato batendo com `task-api.md` desta demanda **se
    ele existir no momento da implementação** (em especial `nickname`, `volume`,
    `armorClassBonus`, `speedPenaltyMeters`, `hardness`, `hitPoints`,
    `breakThreshold`) — sinalizar qualquer divergência entre os nomes provisórios deste
    plano e o contrato real da API.
  - `breakThreshold` realmente **nunca** aparecer no payload de `POST /shields`/
    `PUT /shields/:id` em `ShieldCreateForm` (nem como `undefined`/`null` explícito nem
    de qualquer outra forma) — é 100% responsabilidade do backend.
  - O campo "Limiar de Quebra" no formulário estar de fato desabilitado
    (`disabled`), fora do `control`/zod (não registrado via `Controller`/`FormTextInput`),
    e recalculando corretamente a partir de `watch('hitPoints')` a cada digitação,
    exibindo `0` quando Pontos de Vida estiver vazio.
  - Validação zod dos campos numéricos (Volume/Penalidade de Velocidade com 1 casa
    decimal e mínimo 0; Bônus de CA/Dureza/Pontos de Vida inteiros com mínimo 0) e
    opcionalidade de todos os 6 campos escritos pelo usuário (string vazia aceita).
  - Layout do `ShieldCreateForm` seguindo exatamente as 6 linhas/agrupamento descritos
    no spec, sem quebrar nenhum campo/comportamento existente (Nome, Imagem Referência,
    Preço, Moeda, Tag, Descrição, Informações Privadas continuam funcionando, incluindo
    o `superRefine` de preço/moeda inalterado).
  - `ShieldView` exibindo todos os 7 campos novos, com `breakThreshold` sem fallback
    "Não informado" (sempre um número, incluindo `0`) e os demais 6 com fallback "Não
    informado" quando ausentes (exceto Apelido, condicional).
  - Nenhuma alteração em `ShieldsList`/`ShieldsListItem`/`ShieldsFilterSection`.
  - Acesso Google inalterado em `escudos/` (criar/editar/excluir ocultos, visualizar
    permitido).
  - Schema zod em `shared/formSchemas/ShieldFormSchema` e interface `IShield` em
    `shared/interfaces/Entities/Shield` mantendo os barrels já existentes registrados,
    todos os textos em pt-BR.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-web/src/shared/interfaces/Entities/Shield/index.ts`,
`app-web/src/shared/formSchemas/ShieldFormSchema/index.ts`,
`app-web/src/app/(authorized)/escudos/components/ShieldCreateForm/index.tsx`,
`app-web/src/app/(authorized)/escudos/components/ShieldView/index.tsx`.

Pontos conferidos especificamente:

- Nomenclatura de campos (`nickname`, `volume`, `armorClassBonus`, `speedPenaltyMeters`,
  `hardness`, `hitPoints`, `breakThreshold`) bate exatamente com
  `.claude/tasks/escudos-propriedades/task-api.md` — nenhuma divergência.
- `breakThreshold` nunca aparece no payload de `POST /shields`/`PUT /shields/:id`: não
  existe no `shieldFormSchema` (zod), não existe em `ShieldFormData` nem em
  `shieldFormDefaultValues`, e `buildPayload` em `ShieldCreateForm` faz spread de `data`
  (que é `ShieldFormData`, sem esse campo) mais overrides explícitos apenas dos outros 6
  campos — não há nenhum caminho que inclua `breakThreshold` no corpo enviado.
- "Limiar de Quebra" é renderizado com `DefaultTextInput` (fora do `control`/zod,
  não registrado via `Controller`/`FormTextInput`), com `disabled` e `type="number"`,
  valor calculado por `watch('hitPoints')` com `Math.floor(Number(hitPointsValue) / 2)` e
  fallback `0` quando vazio — recalcula a cada digitação, e em modo edição herda o valor
  correto automaticamente assim que `reset()` popula `hitPoints`. Confirmei também que o
  padrão `value` sem `onChange` não gera warning do React nesse caso, pois o campo está
  `disabled` (React só emite esse aviso quando o campo controlado não é `disabled`/
  `readOnly`).
- Validação zod dos 6 campos escritos pelo usuário confere com o spec: `volume` e
  `speedPenaltyMeters` aceitam até 1 casa decimal e mínimo 0 (regex
  `/^\d+(\.\d)?$/`), `armorClassBonus`/`hardness`/`hitPoints` inteiros mínimo 0 (regex
  `/^\d+$/`), todos aceitando string vazia (opcionais); `nickname` é texto livre sem
  restrição. `shieldFormDefaultValues` tem os 6 equivalentes em `''`.
- Layout do `ShieldCreateForm` reproduz exatamente as 6 linhas/agrupamento do spec:
  (1) `sm:grid-cols-2 lg:grid-cols-4` com Nome/Apelido/Imagem Referência/Tag; (2)
  `sm:grid-cols-3` com Preço/Moeda/Volume; (3) `sm:grid-cols-2` com Bônus de CA/
  Penalidade de Velocidade; (4) `sm:grid-cols-3` com Dureza/Pontos de Vida/Limiar de
  Quebra; (5) e (6) Descrição e Informações Privadas em linha cheia. Todos os campos
  existentes (Nome, Imagem Referência, Preço, Moeda, Tag, Descrição, Informações
  Privadas) e o `superRefine` de preço/moeda permanecem intactos e funcionais.
- `ShieldView` exibe os 7 campos novos em `grid grid-cols-1 sm:grid-cols-2` dentro do
  mesmo container `detailInfoField` já usado para "Preço": Apelido condicional (só
  renderiza se preenchido), Volume/Bônus de CA/Penalidade de Velocidade/Dureza/Pontos
  de Vida com fallback `NOT_INFORMED`, e Limiar de Quebra com `shield.breakThreshold ??
  0` (sem fallback "Não informado", sempre numérico). Ícones todos de `react-icons/fi`
  (`FiTag`, `FiPackage`, `FiPlusCircle`, `FiWind`, `FiHexagon`, `FiHeart`,
  `FiAlertTriangle`), consistente com a família já usada no componente.
- `ShieldsList`/`ShieldsListItem`/`ShieldsFilterSection` não foram tocados (confirmado
  por não constarem em "Arquivos" e por inspeção direta) — listagem e filtros
  permanecem inalterados, conforme escopo do spec.
- Acesso Google inalterado: `ShieldsPage` (`page.tsx`) continua ocultando o botão
  "Novo" via `useIsGoogleUser`, e `ShieldsListItem` continua ocultando editar/excluir
  pelo mesmo hook — nenhum dos dois foi modificado nesta etapa, e os 7 campos novos só
  são alcançáveis via `ShieldCreateForm`, que já está atrás desse fluxo protegido.
  `ShieldView` exibe os campos novos a todos os usuários (somente leitura), igual ao
  bloco "Preço" já existente; "Informações Privadas" continua oculto para
  `provider: 'google'` via `!isGoogleUser`.
- Barrels (`shared/formSchemas/index.ts`, `shared/interfaces/Entities/index.ts`)
  continuam exportando `ShieldFormSchema` e `Shield` normalmente; todos os textos de
  UI/validação estão em pt-BR; nenhum uso de `any`, nenhum hook fora das regras do
  React, nenhum import quebrado ou não utilizado nos 4 arquivos revisados.
