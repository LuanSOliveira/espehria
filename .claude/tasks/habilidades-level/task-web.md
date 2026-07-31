# Task Web: Propriedade `level` em características, talentos, técnicas e magias

## Contexto
Não existe `.claude/tasks/habilidades-level/spec.md` — as decisões já estão fechadas
diretamente na demanda repassada ao agente de planejamento (ver mensagem original).
Resumo do fechado: a API passa a expor `level` (inteiro obrigatório) em característica,
talento, técnica e magia (criação, edição, resposta e item de listagem), e `level:
number | null` no DTO de referência de entidade (`null` para treinamentos, que não têm
level). Nada muda em `app-api` como parte desta task — é só o consumo no `app-web`.

Feature de referência mais próxima: `app-web/src/app/(authorized)/caracteristicas/`
(concluída na task anterior `.claude/tasks/caracteristicas-habilidade/`), espelhada em
`talentos/`, `tecnicas/` e `magias/`. Padrão de campo numérico em formulário já existe
em `EventFormSchema`/`EventCreateForm` (`startYear`/`endYear`: campo string no schema
zod com `refine` de dígitos, `FormTextInput` com `type="number"`, conversão
string↔number feita no componente ao dar `reset`/montar o payload) — reaproveitar esse
padrão para `level`, exceto que aqui o campo é sempre obrigatório (não vazio).

## Etapas

### 1. web-dev
Status: concluído
Componentes: nenhum novo criado; alterados `app-web/src/shared/components/EntityReferenceCard/index.tsx` e `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx` (exibição/repasse de `level`).
Arquivos: `app-web/src/shared/interfaces/Entities/EntityReference/index.ts`, `app-web/src/shared/interfaces/Entities/Characteristic/index.ts`, `app-web/src/shared/interfaces/Entities/Talent/index.ts`, `app-web/src/shared/interfaces/Entities/Technique/index.ts`, `app-web/src/shared/interfaces/Entities/Spell/index.ts`, `app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts`, `app-web/src/shared/formSchemas/TalentFormSchema/index.ts`, `app-web/src/shared/formSchemas/TechniqueFormSchema/index.ts`, `app-web/src/shared/formSchemas/SpellFormSchema/index.ts`, `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`, `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`, `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsList/index.tsx`, `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsListItem/index.tsx`, `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`, `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`, `app-web/src/app/(authorized)/talentos/components/TalentsList/index.tsx`, `app-web/src/app/(authorized)/talentos/components/TalentsListItem/index.tsx`, `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`, `app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx`, `app-web/src/app/(authorized)/tecnicas/components/TechniquesList/index.tsx`, `app-web/src/app/(authorized)/tecnicas/components/TechniquesListItem/index.tsx`, `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`, `app-web/src/app/(authorized)/magias/components/SpellView/index.tsx`, `app-web/src/app/(authorized)/magias/components/SpellsList/index.tsx`, `app-web/src/app/(authorized)/magias/components/SpellsListItem/index.tsx`.

Não é necessário criar nenhum componente pequeno novo em `shared/components/` — todos
os primitivos necessários já existem (`FormTextInput` com `type="number"` cobre o
input numérico; `EntityReferenceCard` e `EntityReferenceSelectionModal` já existem e
só precisam de alteração, não de criação). Por isso a subseção "Componentes" foi
omitida; as alterações em componentes compartilhados existentes estão listadas dentro
de "Funcionalidade" abaixo.

#### Funcionalidade

**Interfaces compartilhadas (`shared/interfaces/Entities/`)**
- `app-web/src/shared/interfaces/Entities/EntityReference/index.ts`: adicionar
  `level?: number | null` em `IEntityReference` (opcional/nulo porque treinamentos não
  têm level).
- `app-web/src/shared/interfaces/Entities/Characteristic/index.ts`: adicionar
  `level: number` em `ICharacteristic` e em `ICharacteristicListItem`.
- `app-web/src/shared/interfaces/Entities/Talent/index.ts`: adicionar `level: number`
  em `ITalent` e em `ITalentListItem`.
- `app-web/src/shared/interfaces/Entities/Technique/index.ts`: adicionar
  `level: number` em `ITechnique` e em `ITechniqueListItem`.
- `app-web/src/shared/interfaces/Entities/Spell/index.ts`: adicionar `level: number`
  em `ISpell` e em `ISpellListItem`.
- `app-web/src/shared/interfaces/Entities/Training/index.ts`: **não alterar** (fora do
  escopo — treinamentos não têm level).

**Schemas de formulário (`shared/formSchemas/`)** — seguir o padrão já usado em
`EventFormSchema` para campo numérico (campo `level` como `string` no schema, com
`refine` validando dígitos e valor mínimo; conversão para `number` feita no componente
ao montar o payload, e para `string` ao dar `reset` em modo edição). Diferente de
`startYear`/`endYear`, `level` é **obrigatório** (não pode ficar em branco):
  ```ts
  level: z
    .string()
    .min(1, 'Informe o level')
    .refine((value) => /^\d+$/.test(value), 'Informe um número inteiro')
    .refine((value) => Number(value) >= 1, 'O level deve ser no mínimo 1'),
  ```
  e `level: ''` no `<feature>FormDefaultValues`.
  - `app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts`: adicionar
    `level` ao `characteristicFormSchema` e a `characteristicFormDefaultValues`.
  - `app-web/src/shared/formSchemas/TalentFormSchema/index.ts`: adicionar `level` ao
    `talentFormSchema` e a `talentFormDefaultValues`.
  - `app-web/src/shared/formSchemas/TechniqueFormSchema/index.ts`: adicionar `level`
    ao `techniqueFormSchema` e a `techniqueFormDefaultValues`.
  - `app-web/src/shared/formSchemas/SpellFormSchema/index.ts`: adicionar `level` ao
    `spellFormSchema` e a `spellFormDefaultValues`.
  - Nenhuma dessas 4 features tem hoje uma variante `*EditFormSchema` (regra de
    `level` é a mesma em criar e editar), então não é necessário criar uma — apenas
    estender o schema único existente.

**Componentes compartilhados a alterar (não criar)**
- `app-web/src/shared/components/EntityReferenceCard/index.tsx`: quando
  `reference.level` estiver presente (diferente de `null`/`undefined`), renderizar
  apenas o número do level no canto superior direito do card (ex.: container com
  `position: 'relative'` envolvendo o conteúdo atual do card e um elemento com
  `position: 'absolute', top, right` mostrando `reference.level`); quando ausente
  (treinamentos), não renderizar nada — não alterar o restante do card.
- `app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`: adicionar
  `level?: number | null` à interface local `EntityReferenceCandidate`; no `onClick` do
  botão "Adicionar" (chamada a `onSelect`), incluir `level: item.level` no objeto
  passado, para que o `EntityReferenceCard` já exiba o level imediatamente após a
  seleção. Endpoints consumidos continuam os mesmos (`/trainings`, `/talents`,
  `/characteristics`, `/techniques`, `/spells`); para `/trainings` o campo `level`
  virá ausente/`null` da API e isso é esperado (nenhuma alteração de comportamento
  para treinamentos).

**Características** (`app-web/src/app/(authorized)/caracteristicas/components/`)
- `CharacteristicCreateForm/index.tsx`: adicionar `FormTextInput` numérico (`name=
  "level"`, `type="number"`, `slotProps={{ htmlInput: { min: 1, step: 1, inputMode:
  'numeric' } }}`, label "Level") na mesma grid do campo de tags, logo ao lado dele;
  no `reset` do modo edição, converter `characteristicDetail.level` para string
  (`String(characteristicDetail.level)`); no `buildPayload`, converter `data.level`
  para número (`Number(data.level)`) e incluir no payload enviado a
  `POST /characteristics` e `PUT /characteristics/:id`.
- `CharacteristicView/index.tsx`: exibir, logo abaixo do nome (`Title` com
  `characteristic.name`), um texto formatado `(level ${characteristic.level})`.
- `CharacteristicsList/index.tsx`: adicionar coluna de cabeçalho "Level" **antes** da
  coluna "Tags" (mesma estrutura de `Label` em negrito das demais colunas); ajustar
  `colSpan` da linha de estado vazio de `3` para `4`.
- `CharacteristicsListItem/index.tsx`: adicionar `TableCell` com
  `characteristic.level` **antes** da célula de tags, na mesma ordem definida no
  `CharacteristicsList`.

**Talentos** (`app-web/src/app/(authorized)/talentos/components/`)
- `TalentCreateForm/index.tsx`: mesma alteração que `CharacteristicCreateForm` (campo
  `level` ao lado do campo de tags, conversão string↔number no reset/payload,
  integração com `POST /talents` / `PUT /talents/:id`).
- `TalentView/index.tsx`: exibir `(level ${talent.level})` abaixo do nome.
- `TalentsList/index.tsx`: coluna "Level" antes de "Tags", `colSpan` do estado vazio
  ajustado de `3` para `4`.
- `TalentsListItem/index.tsx`: célula de `talent.level` antes da célula de tags.

**Técnicas** (`app-web/src/app/(authorized)/tecnicas/components/`)
- `TechniqueCreateForm/index.tsx`: adicionar `FormTextInput` de `level` ao lado do
  campo de tags (grid atual já tem `name`, `referenceImage`, `tags` em
  `lg:grid-cols-4` — `level` passa a ser o 4º campo dessa mesma grid); conversão
  string↔number no reset/payload; integração com `POST /techniques` /
  `PUT /techniques/:id`.
- `TechniqueView/index.tsx`: exibir `(level ${technique.level})` abaixo do nome
  (`Title` com `technique.name`).
- `TechniquesList/index.tsx`: coluna "Level" antes de "Tags" (mantendo "Imagem" e
  "Nome" como já estão); `colSpan` do estado vazio ajustado de `4` para `5`.
- `TechniquesListItem/index.tsx`: célula de `technique.level` antes da célula de tags.

**Magias** (`app-web/src/app/(authorized)/magias/components/`)
- `SpellCreateForm/index.tsx`: mesma alteração que `TechniqueCreateForm` (campo
  `level` ao lado do campo de tags na grid de 4 colunas já existente com `name`,
  `referenceImage`, `tags`); conversão string↔number no reset/payload; integração com
  `POST /spells` / `PUT /spells/:id`.
- `SpellView/index.tsx`: exibir `(level ${spell.level})` abaixo do nome.
- `SpellsList/index.tsx`: coluna "Level" antes de "Tags"; `colSpan` do estado vazio
  ajustado de `4` para `5`.
- `SpellsListItem/index.tsx`: célula de `spell.level` antes da célula de tags.

**Treinamentos**: nenhum arquivo em
`app-web/src/app/(authorized)/treinamentos/` deve ser alterado — a única mudança que
os afeta é `IEntityReference.level` passar a ser opcional/nulo, o que não quebra o
uso atual de treinamentos como referência em outras entidades.

#### Formulário/validação
- Campo novo em todos os 4 schemas: `level`, obrigatório, string no schema com
  `refine` garantindo inteiro (`/^\d+$/`) e valor mínimo 1, convertido para `number`
  apenas ao montar o payload de envio (mesmo padrão de `startYear`/`endYear` em
  `EventFormSchema`, mas sem permitir vazio). Mensagens de erro em pt-BR: "Informe o
  level", "Informe um número inteiro", "O level deve ser no mínimo 1".
- Nenhuma variante `*EditFormSchema` nova é necessária — a regra de `level` é idêntica
  em criação e edição.

#### Acesso Google
- Nenhuma mudança de comportamento: as 4 listagens já ocultam editar/excluir para
  `provider: 'google'` via `useIsGoogleUser` em `CharacteristicsListItem`,
  `TalentsListItem`, `TechniquesListItem` e `SpellsListItem` — a nova coluna "Level" é
  apenas informativa e aparece para todos os usuários, sem relação com o padrão de
  ocultar ações de escrita.

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima: as 4 interfaces de entidade, a interface `IEntityReference`, os
  4 schemas zod, os 2 componentes compartilhados (`EntityReferenceCard`,
  `EntityReferenceSelectionModal`) e os 4 conjuntos de arquivos por feature
  (características, talentos, técnicas, magias) — form, view, list e list item.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
`app-web/src/shared/interfaces/Entities/EntityReference/index.ts`,
`app-web/src/shared/interfaces/Entities/Characteristic/index.ts`,
`app-web/src/shared/interfaces/Entities/Talent/index.ts`,
`app-web/src/shared/interfaces/Entities/Technique/index.ts`,
`app-web/src/shared/interfaces/Entities/Spell/index.ts`,
`app-web/src/shared/formSchemas/CharacteristicFormSchema/index.ts`,
`app-web/src/shared/formSchemas/TalentFormSchema/index.ts`,
`app-web/src/shared/formSchemas/TechniqueFormSchema/index.ts`,
`app-web/src/shared/formSchemas/SpellFormSchema/index.ts`,
`app-web/src/shared/components/EntityReferenceCard/index.tsx`,
`app-web/src/shared/components/EntityReferenceSelectionModal/index.tsx`,
`app-web/src/shared/components/EntityReferenceListField/index.tsx` (lido como
contexto de integração, não alterado nesta task),
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsList/index.tsx`,
`app-web/src/app/(authorized)/caracteristicas/components/CharacteristicsListItem/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentsList/index.tsx`,
`app-web/src/app/(authorized)/talentos/components/TalentsListItem/index.tsx`,
`app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`,
`app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx`,
`app-web/src/app/(authorized)/tecnicas/components/TechniquesList/index.tsx`,
`app-web/src/app/(authorized)/tecnicas/components/TechniquesListItem/index.tsx`,
`app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`,
`app-web/src/app/(authorized)/magias/components/SpellView/index.tsx`,
`app-web/src/app/(authorized)/magias/components/SpellsList/index.tsx`,
`app-web/src/app/(authorized)/magias/components/SpellsListItem/index.tsx`.

Pontos conferidos e conformes em todos os arquivos:
- As 4 interfaces de entidade (`ICharacteristic`/`ICharacteristicListItem`,
  `ITalent`/`ITalentListItem`, `ITechnique`/`ITechniqueListItem`,
  `ISpell`/`ISpellListItem`) recebem `level: number`; `IEntityReference` recebe
  `level?: number | null`, opcional/nulo conforme exigido para não quebrar
  treinamentos. `Training/index.ts` não foi alterado (fora de escopo, como
  esperado).
- Os 4 schemas zod seguem exatamente o padrão pedido (campo `level` como string,
  `refine` de dígitos + `refine` de valor mínimo 1, mensagens em pt-BR "Informe o
  level" / "Informe um número inteiro" / "O level deve ser no mínimo 1") e têm
  `level: ''` no respectivo `*FormDefaultValues`. Nenhuma variante
  `*EditFormSchema` foi criada, corretamente (regra idêntica em criar/editar).
- `EntityReferenceCard`: renderiza o level em `position: absolute, top/right`
  apenas quando `reference.level !== null && !== undefined`, sem alterar o
  restante do card; não introduz nenhum ícone novo nem quebra a estrutura
  existente (ícones `FiEye`/`FiTrash2` de `react-icons`, `aria-label` em pt-BR já
  presentes).
- `EntityReferenceSelectionModal`: `EntityReferenceCandidate` ganhou
  `level?: number | null`; o `onClick` de "Adicionar" agora inclui
  `level: item.level` no objeto passado a `onSelect`, propagando o level
  imediatamente para `EntityReferenceCard` via `EntityReferenceListField`.
- Nas 4 features (características, talentos, técnicas, magias):
  - `*CreateForm`: `FormTextInput` numérico de `level` adicionado na grid correta,
    ao lado do campo de tags, com `type="number"` e
    `slotProps={{ htmlInput: { min: 1, step: 1, inputMode: 'numeric' } }}`;
    `reset` em modo edição converte `String(<entidade>Detail.level)`;
    `buildPayload`/tipo `*Payload` convertem `level: Number(data.level)` e o
    incluem no payload enviado tanto em `usePostEntity` quanto em `usePutEntity`,
    ambos com `invalidateQueryKeys` apontando para a query de listagem
    correspondente (`/characteristics`, `/talents`, `/techniques`, `/spells`) —
    sem `refetch()` manual. Modo criar/editar continua derivado da store
    `useSelected<Entidade>Store`, dentro de `FormModal` (padrão
    `web-form-cadastro` mantido).
  - `*View`: exibe `(level ${entidade.level})` logo abaixo do `Title` com o nome,
    como especificado.
  - `*List`: coluna de cabeçalho "Level" adicionada na posição correta (antes de
    "Tags", mantendo "Imagem"/"Nome" onde já estavam) e `colSpan` do estado vazio
    ajustado corretamente (característica/talento: 3→4; técnica/magia: 4→5).
  - `*ListItem`: célula com `<entidade>.level` inserida antes da célula de tags,
    na mesma ordem da respectiva `*List`; ações de editar/excluir continuam
    ocultas para `provider: 'google'` via `useIsGoogleUser`, sem alteração de
    comportamento — a nova coluna "Level" é apenas informativa e aparece para
    todos os usuários, conforme indicado na task.
- Ícones seguem `react-icons` em todos os arquivos tocados; nenhum `@mui/icons-material`,
  SVG customizado ou emoji funcional encontrado. `IconButton`s sem texto visível
  mantêm `aria-label` em pt-BR.
- Nenhuma duplicação de UI: o campo de level reaproveita `FormTextInput`
  existente, sem criação de input numérico próprio; nenhuma seção de filtros foi
  alterada nesta task.
- Nenhum erro de tipagem, import quebrado, referência a símbolo inexistente ou
  uso de hook fora das regras do React identificado nos arquivos revisados.