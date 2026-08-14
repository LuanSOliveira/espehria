# Task Web: Novos campos de propriedades em Armaduras

## Contexto

Não existe `.claude/tasks/armaduras-propriedades/spec.md` nem
`.claude/tasks/armaduras-propriedades/task-api.md` no momento deste planejamento — o
enunciado recebido diretamente da orquestração é a fonte de verdade. Este plano foi
complementado por inspeção direta do código já existente:

- `app-web/src/app/(authorized)/armaduras/` — página atual de Armaduras (`page.tsx`,
  `ArmorsFilterSection`, `ArmorsList`, `ArmorsListItem`, `ArmorCreateForm`, `ArmorView`),
  que hoje só tem Nome, Imagem Referência, Preço, Moeda, Tags, Descrição, Informações
  Privadas.
- `app-web/src/app/(authorized)/armas/` (referência estrutural direta, demanda análoga
  concluída na mesma sessão — ver `.claude/tasks/tracos-armas/task-web.md`, especialmente
  a seção "Decisões de design"): `WeaponCreateForm`, `WeaponView`,
  `WeaponTraitsField`, `data/index.ts` (opções estáticas), `shared/formSchemas/
  WeaponFormSchema`, `shared/interfaces/Entities/Weapon`,
  `hooks/Queries/EntityQueries/useSizeGradesQuery`/`useArmaTraitTypeId`.
- `shared/components/EntityReferenceSelectionModal` (com a prop `extraFilters`, já
  existente, criada na demanda de Traços/Armas) e `shared/components/EntityReferenceCard`.

Resumo do escopo: o formulário de Armaduras (`ArmorCreateForm`) e o modal de visualização
(`ArmorView`) ganham 8 campos novos (Apelido, Volume, Categoria, Bônus de CA, Limite de
modificador de Destreza, Força, Penalidade em teste, Penalidade de Velocidade, mais o
bloco de Traços), dispostos em 7 linhas exatas definidas no enunciado. O vínculo de Traços
reaproveita literalmente o mesmo padrão de UI/estado já usado em Armas
(`EntityReferenceSelectionModal` + `extraFilters.traitTypeId`), filtrando pelo tipo
"Armadura" em vez de "Arma".

**Nenhuma alteração na listagem (`ArmorsList`/`ArmorsListItem`) nem no filtro
(`ArmorsFilterSection`)** — ver Decisão de design nº 5.

## Decisões de design

1. **Nomes de propriedades provisórios, pendentes de `task-api.md`.** Não existe ainda
   `.claude/tasks/armaduras-propriedades/task-api.md`. Os nomes de campo abaixo foram
   escolhidos espelhando o padrão já usado em `IWeapon` (que tem campos análogos
   `nickname`/`volume` com nome idêntico) e a convenção `<campo>Id` (escrita) /
   `<campo>` objeto populado (leitura) já usada em `sizeGradeId`/`sizeGrade`,
   `damageTypeId`/`damageType`:
   - Apelido → `nickname: string` (idêntico ao já existente em `IWeapon`).
   - Volume → `volume: number` (idêntico ao já existente em `IWeapon`).
   - Categoria → `armorCategoryId` (escrita) / `armorCategory: IArmorCategory` (leitura).
   - Bônus de CA → `acBonus: number`.
   - Limite de modificador de Destreza → `dexterityModifierLimit: number`.
   - Força → `strength: number`.
   - Penalidade em teste → `checkPenalty: number`.
   - Penalidade de Velocidade (Metros) → `speedPenaltyMeters: number`.
   - Traços → `traits: ITrait[]` (leitura) / `traitIds: string[]` (escrita), idêntico ao
     padrão já usado em `IWeapon`.
   - Endpoint da tabela auxiliar de Categoria → `GET /armor-categories` (nome provisório,
     por analogia direta com `GET /size-grades`).

   **Esta é uma dependência explícita, não uma decisão de arquitetura**: se
   `task-api.md` desta mesma demanda definir nomes diferentes (de campos ou do
   endpoint), o `web-dev` deve usar os nomes reais do contrato da API, não os propostos
   aqui.

2. **Todos os 8 campos novos são opcionais no formulário — ambiguidade de requisito
   sinalizada.** O enunciado marca explicitamente "Limite de modificador de Destreza" e
   "Penalidade em teste" como "NÃO obrigatório", mas não diz nada sobre
   obrigatoriedade/opcionalidade de Bônus de CA, Volume, Força e Penalidade de
   Velocidade — o que pode ser lido como "os demais são obrigatórios" (por contraste) ou
   simplesmente como um esquecimento de repetir "opcional" em todos. Este plano assume
   que **todos os 8 são opcionais**, pelo mesmo critério já usado nos 13 campos
   análogos adicionados a `WeaponFormSchema` (nenhum deles obrigatório, inclusive campos
   com "mínimo X" como `damageValue`/`reloadActions`) e porque Armadura em si já é um
   item cujo cadastro básico (Nome) é o único campo hoje obrigatório. **Esta lacuna de
   requisito deve ser confirmada** antes da implementação — se algum desses 4 campos
   precisar ser obrigatório, o `web-dev` deve ajustar o `.min()`/refine do zod
   correspondente (removendo o `v === ''` da condição de aceite).

3. **Validação zod segue literalmente os mesmos padrões já usados em
   `WeaponFormSchema`** (nenhum padrão novo introduzido):
   - Decimal com no máximo 1 casa, mínimo 0 (Volume, Penalidade de Velocidade):
     `z.string().refine((v) => v === '' || /^\d+(\.\d)?$/.test(v), 'Informe um valor
     válido (no máximo 1 casa decimal)')`.
   - Inteiro, mínimo 0 (Bônus de CA, Força): `z.string().refine((v) => v === '' ||
     /^\d+$/.test(v), 'Informe um valor inteiro válido')`.
   - Inteiro, **mínimo 1** (Limite de modificador de Destreza, Penalidade em teste) —
     único padrão novo em relação a `WeaponFormSchema` (lá todo inteiro tinha mínimo 0):
     `z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1), 'Informe
     um valor inteiro válido (mínimo 1)')`.
   - Apelido: `z.string()` livre, sem regra adicional (idêntico a `nickname` em
     `WeaponFormSchema`).
   - Categoria: `z.string()` (id do Autocomplete), sem `.min()` (opcional).
   - String vazia (`''`) é sempre o valor de "não informado" nesses campos numéricos, e é
     convertida para `undefined`/`null` no `buildPayload`, mesmo critério já usado para
     `price`/`volume`/`damageValue` em `WeaponCreateForm`.

4. **Traços em Armaduras: mesmo padrão de UI/estado de Armas, com um segundo hook de
   resolução de tipo.** Nenhum modal novo, nenhum card novo:
   - `ArmorTraitsField` (novo, `armaduras/components/ArmorTraitsField/index.tsx`) é uma
     cópia estrutural de `WeaponTraitsField` (mesmas props `value`/`onChange`, mesmo
     bloqueio de duplicata via `showToast('Este traço já foi adicionado.')`, mesmo
     `EntityReferenceCard`/`EntityReferenceSelectionModal`), trocando apenas o hook de
     resolução de tipo e o `title`/label ("Adicionar Traço" continua igual, já é
     genérico).
   - Novo hook `useArmaduraTraitTypeId` (`hooks/Queries/EntityQueries/
     useArmaduraTraitTypeId/index.ts`), cópia estrutural de `useArmaTraitTypeId`,
     trocando apenas a comparação (`traitTypes.find((t) => t.name === 'Armadura')?.id`).
     Reaproveita `useTraitTypesQuery()` já existente (nenhuma mudança nele). Mantém o
     mesmo racional já registrado em `useArmaTraitTypeId`: é o único ponto do código que
     compara por nome de seed `'Armadura'`; qualquer consumidor futuro do id do tipo
     "Armadura" deve reusar este hook.
   - O estado dos traços vinculados a uma armadura é local (`useState<IEntityReference[]>`
     em `ArmorCreateForm`, fora do zod), hidratado de `armorDetail.traits` em modo edição
     e resetado em modo criação/após submit — idêntico a `traits` em `WeaponCreateForm`.
   - `EntityReferenceSelectionModal` **não muda** — a prop `extraFilters` já existe e já
     suporta esse uso (`tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits',
     extraFilters: { traitTypeId: armaduraTraitTypeId } }]}`), sem nenhuma alteração no
     componente compartilhado.

5. **Nenhuma mudança em `ArmorsList`/`ArmorsListItem`/`ArmorsFilterSection`.** O
   enunciado não pede nenhum campo novo na tabela nem no filtro, e o precedente de Armas
   (`WeaponsList`/`WeaponsListItem`/`WeaponsFilterSection`) confirma esse critério: os 13
   campos novos de Armas também ficaram de fora da listagem/filtro, alterando apenas
   formulário e modal de visualização. `IArmorListItem` ganha `traits: ITrait[]` só para
   bater com o contrato de leitura da API (mesmo critério aplicado a
   `IWeaponListItem.traits`), sem uso em `ArmorsListItem`.

6. **`IArmorCategory` não é reordenado no front**, mesmo critério já aplicado a
   `ISizeGrade`/`useSizeGradesQuery`: a ordem de exibição no Autocomplete de "Categoria" é
   exatamente a ordem devolvida por `GET /armor-categories` (presumivelmente "Sem
   Armadura" → "Armadura Leve" → "Armadura Média" → "Armadura Pesada", conforme o
   enunciado lista), sem `.sort()` nem reordenação por nome em `useArmorCategoriesQuery`
   nem no componente que o consome.

7. **Ícones sugeridos para os novos blocos de `ArmorView`** (ajustáveis pelo `web-dev`,
   desde que permaneçam em `react-icons/fi`, mesma família já usada no componente): Apelido
   `FiTag`, Volume `FiPackage`, Categoria `FiShield`, Bônus de CA `FiPlusCircle`, Limite de
   modificador de Destreza `FiTrendingUp`, Força `FiActivity`, Penalidade em teste
   `FiMinusCircle`, Penalidade de Velocidade `FiWind`, bloco "Traços" `FiAward` (idêntico
   ao já usado no bloco "Traços" de `WeaponView`).

## Etapas

### 1. web-dev

#### Componentes

- Componente: `ArmorTraitsField`
  (`app-web/src/app/(authorized)/armaduras/components/ArmorTraitsField/index.tsx`, novo)
- Props: `value: IEntityReference[]`, `onChange: (value: IEntityReference[]) => void`
- Comportamento esperado: cópia estrutural de `WeaponTraitsField` (ver Decisão 4) — label
  "Traços" + `SecondaryButton` "Adicionar Traço" (desabilitado enquanto
  `useArmaduraTraitTypeId().isLoading`) que abre `EntityReferenceSelectionModal` com
  `title="Adicionar Traço"`, `excludeReferences={value.map((v) => ({ entityType: 'trait',
  id: v.id }))}`, `tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits',
  extraFilters: { traitTypeId: armaduraTraitTypeId } }]}`; ao selecionar, bloqueia
  duplicata (`showToast('Este traço já foi adicionado.', 'error')`) e adiciona; lista os
  itens via `EntityReferenceCard` (`onRemove` removendo do array local); mensagem "Nenhum
  item adicionado." quando vazio. Nenhum modal novo, nenhum card novo — reaproveita
  `EntityReferenceSelectionModal`/`EntityReferenceCard` já existentes.

Nenhum outro componente novo é necessário: `ArmorsFilterSection` já existe e não precisa
de alteração (ver Decisão 5); todos os inputs de formulário usam `FormTextInput`/
`FormAutocompleteInput` já existentes em `shared/components/Inputs/FormInputs`.

#### Funcionalidade

**Páginas/rotas**

- Sem rota nova. Alterados (sem mudança de rota):
  `app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx` e
  `.../ArmorView/index.tsx`.

**Interfaces/hooks/schemas novos ou alterados**

- `shared/interfaces/Entities/ArmorCategory/index.ts` (novo, registrado no barrel
  `shared/interfaces/Entities/index.ts`): `IArmorCategory { id: string; name: string;
  order?: number }` (nomes provisórios — ver Decisão 1).
- `shared/interfaces/Entities/Armor/index.ts` (alterado) — todos os campos novos
  opcionais/nullable, campo a campo conforme Decisão 1:
  ```
  export interface IArmorListItem {
    // ...campos existentes inalterados...
    traits: ITrait[];
  }

  export interface IArmor extends IEntity {
    // ...campos existentes inalterados...
    nickname?: string | null;
    volume?: number | null;
    armorCategory?: IArmorCategory | null;
    acBonus?: number | null;
    dexterityModifierLimit?: number | null;
    strength?: number | null;
    checkPenalty?: number | null;
    speedPenaltyMeters?: number | null;
    traits: ITrait[];
  }
  ```
- `hooks/Queries/EntityQueries/useArmorCategoriesQuery/index.ts` (novo, registrado no
  barrel) — `GET /armor-categories` → `IArmorCategory[]`, mesmo padrão de
  `useSizeGradesQuery` (`useQuery`, `queryKey` fixa, `ApiFactory(getAuthToken())`,
  `staleTime: 5 * 60 * 1000`, **sem** reordenar — ver Decisão 6).
- `hooks/Queries/EntityQueries/useArmaduraTraitTypeId/index.ts` (novo, registrado no
  barrel) — ver Decisão 4: `{ armaduraTraitTypeId: string | undefined, isLoading:
  boolean }`, `traitTypes.find((t) => t.name === 'Armadura')?.id`.
- `shared/formSchemas/ArmorFormSchema/index.ts` (alterado) — novos campos sempre
  opcionais no schema (ver Decisões 2 e 3):
  ```
  nickname: z.string(),
  volume: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe um volume válido (no máximo 1 casa decimal)',
  ),
  armorCategoryId: z.string(),
  acBonus: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um bônus de CA inteiro válido',
  ),
  dexterityModifierLimit: z.string().refine(
    (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1),
    'Informe um valor inteiro válido (mínimo 1)',
  ),
  strength: z.string().refine(
    (v) => v === '' || /^\d+$/.test(v),
    'Informe um valor de força inteiro válido',
  ),
  checkPenalty: z.string().refine(
    (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1),
    'Informe um valor inteiro válido (mínimo 1)',
  ),
  speedPenaltyMeters: z.string().refine(
    (v) => v === '' || /^\d+(\.\d)?$/.test(v),
    'Informe uma penalidade de velocidade válida (no máximo 1 casa decimal)',
  ),
  ```
  `armorFormDefaultValues` ganha os equivalentes em `''`. **`traitIds`/`traits` não
  entram no zod** — permanecem como estado local `useState<IEntityReference[]>` em
  `ArmorCreateForm`, ver Decisão 4. O `superRefine` de preço/moeda já existente
  permanece inalterado.

**Integrações com API**

- `GET /armor-categories` → `useArmorCategoriesQuery` (Autocomplete "Categoria" em
  `ArmorCreateForm`).
- `GET /trait-types` → reaproveitado via `useTraitTypesQuery` já existente, internamente
  por `useArmaduraTraitTypeId` (resolve o id do tipo "Armadura", consumido por
  `ArmorTraitsField`).
- `GET /traits` (filtros `name`/`traitTypeId` combináveis, já existente) → consumido
  dentro de `EntityReferenceSelectionModal` (via seu `useGetEntityList` interno), a
  partir de `ArmorTraitsField`, com `name` (digitado) + `traitTypeId` (fixo, resolvido
  por `useArmaduraTraitTypeId`) — paginação/filtro 100% server-side, mesmo padrão já
  usado em Armas, nunca listando traços de tipo "Arma".
- `GET /armors/:id`, `POST /armors`, `PUT /armors/:id` — passam a enviar/receber os 8
  campos novos + `traitIds`/`traits` (payload conforme "Formulário/validação" abaixo);
  `invalidateQueryKeys` inalterado (`[['/armors']]`).

**Formulário/validação — `ArmorCreateForm` (novo layout, 7 linhas exatas, campos
existentes preservados sem quebra)**:

1. `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Nome (`FormTextInput`, existente,
   obrigatório), Apelido (`FormTextInput`, novo, `name="nickname"`, opcional, texto
   livre), Imagem Referência (`FormTextInput`, existente), Tag
   (`FormMultiAutocompleteInput`, existente).
2. `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: Preço (existente), Moeda
   (existente), Volume (`FormTextInput`, novo, `name="volume"`, `type="number"`,
   `slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}`, opcional, 1
   casa decimal), Categoria (`FormAutocompleteInput<ArmorFormData, IArmorCategory>`,
   novo, `name="armorCategoryId"`, `options=` resultado de `useArmorCategoriesQuery()`
   **sem reordenar**, opcional).
3. `grid grid-cols-1 sm:grid-cols-2`: Bônus de CA (`FormTextInput`, novo,
   `name="acBonus"`, `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 1,
   inputMode: 'numeric' } }}`, opcional, inteiro ≥ 0), Limite de modificador de
   Destreza (`FormTextInput`, novo, `name="dexterityModifierLimit"`, `type="number"`,
   `slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}`, opcional,
   inteiro ≥ 1).
4. `grid grid-cols-1 sm:grid-cols-3`: Força (`FormTextInput`, novo, `name="strength"`,
   `type="number"`, `slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' }
   }}`, opcional, inteiro ≥ 0), Penalidade em teste (`FormTextInput`, novo,
   `name="checkPenalty"`, `type="number"`, `slotProps={{ htmlInput: { min: 1, step: 1,
   inputMode: 'numeric' } }}`, opcional, inteiro ≥ 1), Penalidade de Velocidade (Metros)
   (`FormTextInput`, novo, `name="speedPenaltyMeters"`, `type="number"`,
   `slotProps={{ htmlInput: { min: 0, step: 0.1, inputMode: 'decimal' } }}`, opcional,
   1 casa decimal).
5. Linha cheia: `ArmorTraitsField` (`value=traits`, `onChange=setTraits`) — estado local
   `traits: IEntityReference[]`, fora do zod (ver Decisão 4), hidratado de
   `armorDetail.traits.map((t) => ({ id: t.id, name: t.name, entityType: 'trait', tags:
   t.tags }))` em modo edição, resetado para `[]` em modo criação e após submit com
   sucesso.
6. Linha cheia: Descrição (`FormRichTextInput`, existente, inalterado).
7. Linha cheia: Informações Privadas (`FormRichTextInput`, existente, inalterado).

`buildPayload` (em `ArmorCreateForm`) ganha, para os 8 campos + traços (mesmo critério já
usado para `price`/`referenceImage`: string vazia → `undefined`/`null`, valor preenchido
→ convertido):
```
nickname: data.nickname || undefined,
volume: data.volume ? Number(data.volume) : null,
armorCategoryId: data.armorCategoryId || undefined,
acBonus: data.acBonus ? Number(data.acBonus) : null,
dexterityModifierLimit: data.dexterityModifierLimit
  ? Number(data.dexterityModifierLimit)
  : null,
strength: data.strength ? Number(data.strength) : null,
checkPenalty: data.checkPenalty ? Number(data.checkPenalty) : null,
speedPenaltyMeters: data.speedPenaltyMeters ? Number(data.speedPenaltyMeters) : null,
traitIds: traits.map((t) => t.id),
```
E o `useEffect` de hidratação em modo edição ganha os equivalentes de leitura
(`nickname: armorDetail.nickname ?? ''`, `volume: armorDetail.volume != null ?
String(armorDetail.volume) : ''`, `armorCategoryId: armorDetail.armorCategory?.id ??
''`, `acBonus`/`dexterityModifierLimit`/`strength`/`checkPenalty`/
`speedPenaltyMeters` seguindo o mesmo padrão), e `setTraits(armorDetail.traits?.map(...)
?? [])` fora do `reset()` do RHF.

**`ArmorView` (modal de visualização) — novo conteúdo, mantendo a estrutura visual já
existente (imagem + coluna de info + blocos `detailSectionBox`)**:

- Coluna de info ao lado da imagem (mesmo container `detailInfoField` já usado para
  "Preço", agora em `grid grid-cols-1 sm:grid-cols-2` como em `WeaponView`): adicionar
  blocos equivalentes para Apelido (se presente), Volume, Categoria
  (`armor.armorCategory?.name`), Bônus de CA, Limite de modificador de Destreza, Força,
  Penalidade em teste, Penalidade de Velocidade — usando `NOT_INFORMED` ("Não
  informado") como fallback para os opcionais ausentes, mesmo padrão já usado no
  restante do componente e em `WeaponView`.
- Novo bloco `detailSectionBox` "Traços" (ícone `FiAward`, ver Decisão 7), logo após o
  bloco de info e antes de "Descrição", listando `armor.traits` via
  `EntityReferenceCard` (sem `onRemove` — somente leitura), mensagem "Nenhum item
  adicionado." quando vazio — idêntico ao bloco "Traços" de `WeaponView`. Sem bloco
  "Dano" (não se aplica a Armadura).
- Blocos "Descrição" e "Informações Privadas" (este último já oculto para
  `provider: 'google'`) permanecem inalterados, ao final.

**Acesso Google:** ocultar criar/editar/excluir (padrão, sem alteração de
comportamento) — a proteção já existente em `ArmorsPage`/`ArmorsListItem` via
`useIsGoogleUser` (botão "Novo" e ações "Editar"/"Excluir" ocultos, mantendo apenas
"Visualizar") continua funcionando sem nenhuma mudança; os campos novos do formulário só
são alcançáveis pelo mesmo fluxo já protegido. O novo bloco "Traços" e os demais campos
novos em `ArmorView` são somente leitura e ficam visíveis a todos os usuários, igual aos
blocos "Preço"/"Descrição" já existentes (só "Informações Privadas" permanece oculto
para Google).

Status: concluído
Componentes: app-web/src/app/(authorized)/armaduras/components/ArmorTraitsField/index.tsx
  (novo, cópia estrutural de WeaponTraitsField),
  app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx (alterado,
  novo layout de 7 linhas + traits), app-web/src/app/(authorized)/armaduras/components/
  ArmorView/index.tsx (alterado, 8 campos novos + bloco "Traços")
Arquivos: app-web/src/shared/interfaces/Entities/ArmorCategory/index.ts (novo),
  .../Armor/index.ts (alterado: nickname, volume, armorCategory, armorClassBonus,
  dexterityModifierLimit, strength, checkPenalty, speedPenaltyMeters, traits) e
  .../index.ts (barrel); app-web/src/hooks/Queries/EntityQueries/
  useArmorCategoriesQuery/index.ts (novo, GET /armor-categories, sem reordenar),
  useArmaduraTraitTypeId/index.ts (novo, resolve id do tipo 'Armadura' via
  useTraitTypesQuery) e .../index.ts (barrel); app-web/src/shared/formSchemas/
  ArmorFormSchema/index.ts (alterado, 8 campos novos opcionais).

Nota de nomenclatura: o campo real do contrato da API (confirmado em
`app-api/src/modules/armors/dto/create-armor.dto.ts`/`armor-response.dto.ts`) é
`armorClassBonus`, não `acBonus` como estava provisoriamente proposto na Decisão de
design nº 1 deste plano — a implementação usa `armorClassBonus` em todo o front
(interface, schema, payload, ArmorCreateForm, ArmorView). Os demais nomes provisórios
(`nickname`, `volume`, `armorCategoryId`/`armorCategory`, `dexterityModifierLimit`,
`strength`, `checkPenalty`, `speedPenaltyMeters`, `traitIds`/`traits`,
`GET /armor-categories`) bateram exatamente com o contrato real.

### 2. web-dev-codereviewer

Status: concluído

- Revisar tudo acima, com atenção especial a:
  - Nomenclatura de campos usada de fato batendo com `task-api.md` desta demanda **se
    ele existir no momento da implementação** (em especial `armorCategoryId`/
    `armorCategory`, `acBonus`, `dexterityModifierLimit`, `strength`, `checkPenalty`,
    `speedPenaltyMeters`, `nickname`, `volume`, `traitIds`/`traits`) — sinalizar qualquer
    divergência entre os nomes provisórios deste plano e o contrato real da API.
  - `useArmorCategoriesQuery` e o Autocomplete de "Categoria" realmente não reordenando
    o array retornado pela API.
  - O modal de seleção de Traços em Armaduras usa filtro e paginação **server-side**
    (`EntityReferenceSelectionModal` + `extraFilters.traitTypeId`) e filtra corretamente
    pelo tipo "Armadura" (id resolvido uma única vez por `useArmaduraTraitTypeId`, não
    hardcode de UUID), nunca listando traços de tipo "Arma".
  - Nenhum componente novo de card/modal para Traço em Armaduras — `EntityReferenceCard`/
    `EntityReferenceSelectionModal` reaproveitados tanto em `ArmorTraitsField` quanto no
    bloco "Traços" de `ArmorView`.
  - Validação zod dos campos com mínimo 1 (Limite de modificador de Destreza, Penalidade
    em teste) realmente rejeitando `0`, e dos campos com mínimo 0 aceitando `0`.
  - Layout do `ArmorCreateForm` seguindo exatamente as 7 linhas descritas no enunciado,
    sem quebrar nenhum campo/comportamento existente (Nome, Imagem Referência, Preço,
    Moeda, Tags, Descrição, Informações Privadas continuam funcionando, incluindo o
    `superRefine` de preço/moeda).
  - `ArmorView` exibindo todos os 8 campos novos + bloco "Traços" com fallback "Não
    informado" quando ausentes.
  - Nenhuma alteração em `ArmorsList`/`ArmorsListItem`/`ArmorsFilterSection`.
  - Acesso Google inalterado em `armaduras/` (criar/editar/excluir ocultos, visualizar
    permitido).
  - Hooks genéricos de `hooks/Queries` (não bespoke `useQuery`/`useMutation`), schema
    zod em `shared/formSchemas/ArmorFormSchema` com barrel já registrado, interfaces
    novas registradas no barrel de `shared/interfaces/Entities/`, todos os textos em
    pt-BR.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados.

Cobertura da revisão: todos os arquivos listados na etapa "1. web-dev" (interfaces,
hooks de query, form schema, componentes de `armaduras/` novos/alterados), comparados
campo a campo com o contrato real de `.claude/tasks/armaduras-propriedades/task-api.md`
(já `Status: concluído`, revisado e aprovado) e com os pontos de atenção listados acima.

Pontos verificados e confirmados corretos:

- **Nomenclatura de campos idêntica ao contrato real da API**: `IArmor`
  (`shared/interfaces/Entities/Armor/index.ts`) usa exatamente `nickname`, `volume`,
  `armorCategory`/`armorCategoryId`, `armorClassBonus`, `dexterityModifierLimit`,
  `strength`, `checkPenalty`, `speedPenaltyMeters`, `traits`/`traitIds` — nenhuma
  ocorrência de `acBonus` (nome provisório da Decisão 1) em nenhum arquivo do projeto
  (busca textual por `acBonus` em todo `app-web/src` não retornou nenhum resultado). A
  nota de nomenclatura registrada ao final da etapa "1. web-dev" (divergência
  `acBonus`→`armorClassBonus` corrigida durante a implementação) está consistente com o
  código final: `ArmorFormSchema`, `ArmorCreateForm` (payload de criação/edição e
  hidratação em modo edição) e `ArmorView` usam `armorClassBonus` de ponta a ponta.
  `IArmorCategory` (`shared/interfaces/Entities/ArmorCategory/index.ts`) bate campo a
  campo com `ArmorCategoryResponseDto` (`id`, `name`, `order`).
- **Todos os 8 campos novos opcionais no formulário**: confirmado que essa é a premissa
  assumida e validada com o usuário (não é reportada como problema) — todos os
  `z.string().refine((v) => v === '' || ...)` em `ArmorFormSchema` aceitam string vazia,
  incluindo Bônus de CA, Categoria, Volume, Força e Penalidade de Velocidade.
- **`useArmorCategoriesQuery`** (`hooks/Queries/EntityQueries/useArmorCategoriesQuery/index.ts`)
  não reordena o array retornado pela API (nenhum `.sort()`), e o
  `FormAutocompleteInput<ArmorFormData, IArmorCategory>` de "Categoria" em
  `ArmorCreateForm` usa `options={armorCategoryOptions}` diretamente, na ordem recebida
  — consistente com a Decisão 6 e com a ordenação `order ASC` já confirmada no lado da
  API.
- **Modal de seleção de Traços em Armaduras 100% server-side**: `ArmorTraitsField`
  (`armaduras/components/ArmorTraitsField/index.tsx`) passa
  `tabs={[{ label: 'Traços', entityType: 'trait', url: '/traits', extraFilters: {
  traitTypeId: armaduraTraitTypeId } }]}` ao `EntityReferenceSelectionModal`
  (componente compartilhado, inalterado nesta demanda), que já mescla
  `activeTab.extraFilters` aos filtros enviados a `useGetEntityList` — nenhuma
  paginação/filtro client-side. O id do tipo "Armadura" é resolvido uma única vez por
  `useArmaduraTraitTypeId` (`traitTypes.find((t) => t.name === 'Armadura')?.id`, cópia
  estrutural fiel de `useArmaTraitTypeId`), sem hardcode de UUID, e o botão "Adicionar
  Traço" fica `disabled` enquanto `isLoading`, evitando abrir o modal com
  `traitTypeId` indefinido (o que listaria traços de qualquer tipo, inclusive "Arma").
- **Nenhum componente novo de card/modal para Traço em Armaduras**: tanto
  `ArmorTraitsField` quanto o bloco "Traços" de `ArmorView` reaproveitam
  `EntityReferenceCard`/`EntityReferenceSelectionModal` diretamente, com `onRemove`
  presente só no formulário e ausente (somente leitura) na view.
- **Validação zod dos campos com mínimo**: `dexterityModifierLimit` e `checkPenalty`
  usam `/^\d+$/.test(v) && Number(v) >= 1`, rejeitando `0` (regex aceita o dígito, mas o
  `Number(v) >= 1` barra); `armorClassBonus` e `strength` usam apenas `/^\d+$/.test(v)`
  (sem checagem de mínimo adicional), aceitando `0` normalmente — consistente com "mínimo
  0" desses dois campos.
- **Layout do `ArmorCreateForm`**: as 7 linhas descritas no enunciado batem exatamente
  com o JSX (linha 1: Nome/Apelido/Imagem Referência/Tag; linha 2: Preço/Moeda/Volume/
  Categoria; linha 3: Bônus de CA/Limite de modificador de Destreza; linha 4:
  Força/Penalidade em teste/Penalidade de Velocidade; linha 5: `ArmorTraitsField` em
  linha cheia; linha 6: Descrição; linha 7: Informações Privadas), sem quebrar nenhum
  campo pré-existente (Nome, Imagem Referência, Preço, Moeda, Tags, Descrição,
  Informações Privadas continuam presentes e funcionais, incluindo o `superRefine` de
  preço/moeda inalterado).
- **`ArmorView`** exibe todos os 8 campos novos (Apelido condicional, Volume,
  Categoria via `armor.armorCategory?.name`, Bônus de CA, Limite de modificador de
  Destreza, Força, Penalidade em teste, Penalidade de Velocidade) com fallback
  `NOT_INFORMED` ("Não informado") quando ausentes, mais o bloco "Traços" (ícone
  `FiAward`, conforme Decisão 7) logo após a coluna de info e antes de "Descrição",
  listando `armor.traits` via `EntityReferenceCard` somente leitura. Blocos "Descrição"
  e "Informações Privadas" (este último ainda oculto para `provider: 'google'` via
  `useIsGoogleUser`) permanecem inalterados ao final. Todos os ícones novos vêm de
  `react-icons/fi` (`FiTag`, `FiPackage`, `FiShield`, `FiPlusCircle`, `FiTrendingUp`,
  `FiActivity`, `FiMinusCircle`, `FiWind`, `FiAward`), mesma família já usada no
  componente — nenhum `@mui/icons-material`/SVG customizado/emoji.
- **Nenhuma alteração em `ArmorsList`/`ArmorsListItem`/`ArmorsFilterSection`**: busca
  textual pelos 8 nomes de campo novos (`nickname`, `volume`, `armorCategory`,
  `armorClassBonus`, `dexterityModifierLimit`, `strength`, `checkPenalty`,
  `speedPenaltyMeters`, `traits`) nesses três arquivos não retornou nenhum resultado —
  seção de filtros (`ArmorsFilterSection`) permanece um componente apresentacional só
  com filtro por nome, sem alteração.
- **Acesso Google inalterado**: `ArmorsPage` (`armaduras/page.tsx`) oculta o botão
  "Novo" via `useIsGoogleUser`, e `ArmorsListItem` mantém a mesma proteção nas ações de
  editar/excluir (confirmado por leitura direta), preservando "Visualizar" para todos.
  Os 8 campos novos do formulário só são alcançáveis pelo mesmo fluxo já protegido, e o
  bloco "Traços"/demais campos novos em `ArmorView` são somente leitura e visíveis a
  todos, exatamente como especificado.
- **Hooks/schema/reaproveitamento**: `useArmorCategoriesQuery`/`useArmaduraTraitTypeId`
  seguem o padrão exato de `useSizeGradesQuery`/`useArmaTraitTypeId` (`useQuery`,
  `queryKey` fixa, `ApiFactory(getAuthToken())`, `staleTime: 5 * 60 * 1000`) e estão
  registrados no barrel `hooks/Queries/EntityQueries/index.ts`; `armorFormSchema`
  (`zod` + `zodResolver`, não Yup) segue a estrutura base +
  `armorFormDefaultValues`/`armorFormResolver` e está registrado em
  `shared/formSchemas/index.ts`; `IArmorCategory`/`IArmor` estão registrados no barrel
  `shared/interfaces/Entities/index.ts`. `ArmorCreateForm` deriva o modo criar/editar de
  `useSelectedArmorStore` (não de prop manual), é renderizado dentro de `FormModal`
  (`armaduras/page.tsx`), e as mutations de criação/edição (`usePostEntity`/
  `usePutEntity`) usam `invalidateQueryKeys: [['/armors']]`, garantindo que a listagem
  recarregue sozinha sem `refetch()` manual. Todos os textos de UI/toast/validação
  revisados estão em pt-BR.

Arquivos revisados:
app-web/src/app/(authorized)/armaduras/components/ArmorTraitsField/index.tsx,
app-web/src/app/(authorized)/armaduras/components/ArmorCreateForm/index.tsx,
app-web/src/app/(authorized)/armaduras/components/ArmorView/index.tsx,
app-web/src/app/(authorized)/armaduras/components/ArmorsList/index.tsx,
app-web/src/app/(authorized)/armaduras/components/ArmorsListItem/index.tsx,
app-web/src/app/(authorized)/armaduras/components/ArmorsFilterSection/index.tsx,
app-web/src/app/(authorized)/armaduras/page.tsx,
app-web/src/app/(authorized)/armas/components/WeaponTraitsField/index.tsx (referência),
app-web/src/shared/interfaces/Entities/ArmorCategory/index.ts,
app-web/src/shared/interfaces/Entities/Armor/index.ts,
app-web/src/shared/interfaces/Entities/index.ts,
app-web/src/hooks/Queries/EntityQueries/useArmorCategoriesQuery/index.ts,
app-web/src/hooks/Queries/EntityQueries/useArmaduraTraitTypeId/index.ts,
app-web/src/hooks/Queries/EntityQueries/useArmaTraitTypeId/index.ts (referência),
app-web/src/hooks/Queries/EntityQueries/useSizeGradesQuery/index.ts (referência),
app-web/src/hooks/Queries/EntityQueries/index.ts,
app-web/src/shared/formSchemas/ArmorFormSchema/index.ts,
.claude/tasks/armaduras-propriedades/task-api.md (referência de contrato de
campos/endpoints, `Status: concluído`).
