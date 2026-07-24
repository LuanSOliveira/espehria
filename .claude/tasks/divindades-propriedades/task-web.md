# Task Web: Novos campos de propriedades para Divindade

## Contexto
Não existe `spec.md` para esta demanda; o planejamento usa diretamente a especificação
recebida do agente orquestrador (reprodução do escopo abaixo).

Reestruturar a UI da feature `divindades` (`app-web/src/app/(authorized)/divindades`)
para adicionar um conjunto extenso de novos campos de "propriedades" à entidade
Divindade, no formulário de cadastro/edição (`DivinityCreateForm`) e no modal de
visualização (`DivinityView`), sem remover nenhum campo já existente (Nome, Categoria,
Imagem Referência, Descrição, Tags).

**Dependência**: esta task depende da conclusão da task-api equivalente (mesma
demanda), que deve expor os novos campos na entidade `Divinity` do backend e nos
DTOs de `/divinities` (criação, atualização e resposta), usando exatamente os nomes
em camelCase listados abaixo. O `web-dev` não deve iniciar a implementação antes de
confirmar que a API já retorna/aceita esses campos.

### Campos novos e nomes (camelCase, iguais aos definidos no backend)

Texto comum (input de texto simples):
- `titles` (Títulos)
- `alignment` (Alinhamento)
- `domainSphere` (Esfera de Domínio)
- `primaryElement` (Elemento Primário)
- `sacredSymbol` (Símbolo Sagrado — URL de imagem)
- `sacredAnimal` (Animal Sagrado)
- `sacredColor` (Cor Sagrada)

Texto rico (mesmo padrão hoje usado por `description`):
- `personality` (Personalidade)
- `divineDomains` (Domínios Divinos)
- `powers` (Poderes)
- `worldInfluence` (Influência no Mundo)
- `divineAppearance` (Aparência Divina)
- `avatars` (Avatares)
- `church` (Igreja)
- `cult` (Culto)
- `blessings` (Bênçãos)
- `curses` (Maldições)
- `legends` (Lendas)
- `commandments` (Mandamentos)
- `oaths` (Juramentos)
- `curiosities` (Curiosidades)

Todos os campos novos são opcionais (podem ficar em branco), seguindo o mesmo
tratamento que `description` já recebe hoje no schema (`z.string()` sem `.min(1)`).
`sacredSymbol` segue o mesmo tratamento de `referenceImage`: string vazia permitida
ou URL válida (`z.string().url()`), convertida para `undefined` no payload quando
vazia.

### Estado atual investigado

- `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`:
  formulário com `useForm<DivinityFormData>` + `divinityFormResolver`, grid de 4
  colunas (Nome, Categoria, Imagem Referência, Tags) seguido de um bloco de largura
  total só com `FormRichTextInput` para Descrição. `reset()` no `useEffect` de edição
  mapeia campo a campo de `divinityDetail` para o form.
- `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx`:
  imagem de referência em retrato (300x400, `objectFit: cover`) à esquerda, clicável
  para abrir `ImagePreviewDialog`; à direita, Título (nome), campo Categoria (ícone +
  label + valor, estilo `APP_CONTAINER_STYLES.detailInfoField`), Tags (`Chip[]`) e um
  `DivinitySectionBox` (componente local ao arquivo, não em `shared/components`) para
  Descrição, usando `RichTextViewer`. `DivinitySectionBox` já é genérico o bastante
  (recebe `label`, `icon`, `value`) para ser reaproveitado nas novas seções de texto
  rico.
- `app-web/src/shared/interfaces/Entities/Divinity/index.ts`: `IDivinity` hoje só tem
  `name`, `category`, `referenceImage`, `description`, `tags` (+ campos de `IEntity`).
- `app-web/src/shared/formSchemas/DivinityFormSchema/index.ts`: `divinityFormSchema`
  hoje só valida `name`, `categoryId`, `referenceImage` (URL opcional), `description`,
  `tagIds`.
- Referência de padrão equivalente (múltiplas seções de texto rico lado a lado): a
  feature `locais` (`LocationCreateForm`/`LocationView`) já usa
  `grid grid-cols-1 sm:grid-cols-2` para exibir cards lado a lado e
  `FormRichTextInput`/`RichTextViewer` para descrição — mesmo padrão a replicar aqui
  para os pares de campos de texto rico.
- Inputs reutilizáveis já existentes e a serem usados (nenhum novo input genérico é
  necessário): `FormTextInput`, `FormRichTextInput`
  (`shared/components/Inputs/FormInputs`), `RichTextViewer`
  (`shared/components/RichTextViewer`).

## Etapas

### 1. web-dev
**Status:** concluído
Componentes: app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx, app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx
Arquivos: app-web/src/shared/interfaces/Entities/Divinity/index.ts, app-web/src/shared/formSchemas/DivinityFormSchema/index.ts

#### Funcionalidade

**Interface `IDivinity`** (`shared/interfaces/Entities/Divinity/index.ts`)
- Adicionar todos os 21 campos novos listados acima como `?: string | null`, no
  mesmo padrão de `description?: string | null`, sem remover nenhum campo existente.
- Avaliar se `IDivinityListItem` (usado na listagem) precisa de algum desses campos —
  pela spec, a listagem não foi mencionada, então manter `IDivinityListItem` como
  está, a menos que a API já retorne esses campos no list endpoint e algum uso na
  lista/filtros seja necessário (não é o caso aqui).

**Form schema** (`shared/formSchemas/DivinityFormSchema/index.ts`)
- Adicionar ao `divinityFormSchema` os 20 campos de texto comum/rico (todos
  `z.string()` sem `.min(1)`, opcionais/em branco permitido), seguindo o padrão atual
  de `description`.
- `sacredSymbol`: mesmo padrão de validação de `referenceImage` (string vazia ou
  `z.string().url()` válida).
- Atualizar `DivinityFormData` (inferido automaticamente via `z.infer`).
- Atualizar `divinityFormDefaultValues` incluindo todos os novos campos com `''`.

**`DivinityCreateForm`**
- Estender o `reset()` do `useEffect` de edição para mapear todos os novos campos de
  `divinityDetail` (`?? ''`), sem alterar o comportamento atual dos campos existentes.
- Estender `buildPayload` para tratar `sacredSymbol` como `referenceImage`
  (`data.sacredSymbol || undefined`); os demais campos novos (texto rico) seguem o
  mesmo tratamento que `description` recebe hoje (enviados como estão, string vazia
  permitida).
- Reestruturar o layout do formulário nas seguintes linhas, mantendo os componentes
  `FormTextInput`/`FormAutocompleteInput`/`FormMultiAutocompleteInput` já em uso para
  campos de texto comum/categoria/tags e `FormRichTextInput` para os de texto rico:
  1. Grid 4 colunas: Nome, Títulos, Categoria, Tags
  2. Grid 4 colunas: Imagem Referência, Símbolo Sagrado, Alinhamento, Esfera de
     Domínio
  3. Grid 4 colunas: Elemento Primário, Animal Sagrado, Cor Sagrada, (célula vazia —
     usar `<div />` ou equivalente para preencher o grid sem quebrar o alinhamento)
  4. Descrição (`FormRichTextInput`, largura total)
  5. Personalidade (`FormRichTextInput`, largura total)
  6. Grid 2 colunas (`sm:grid-cols-2`, padrão já usado em `locais`): Domínios Divinos,
     Poderes
  7. Influência no Mundo (largura total)
  8. Grid 2 colunas: Aparência Divina, Avatares
  9. Grid 2 colunas: Igreja, Culto
  10. Grid 2 colunas: Bênçãos, Maldições
  11. Lendas (largura total)
  12. Grid 2 colunas: Mandamentos, Juramentos
  13. Curiosidades (largura total)
- Manter o botão de submit inalterado ao final do formulário.

**`DivinityView`**
- Cabeçalho (ao lado da imagem de referência em retrato, que permanece como está
  hoje): adicionar, na coluna de informações à direita da imagem, na ordem —
  Símbolo Sagrado (renderizado como imagem quadrada menor a partir da URL, com
  fallback visual quando vazio seguindo o mesmo padrão de placeholder usado hoje pela
  imagem de referência quando ausente — ícone `FiImage` sobre fundo
  `APP_COLORS.wood`), Nome (já existente), Títulos, Categoria (já existente), Tags (já
  existente), Elemento Primário, Animal Sagrado, Cor Sagrada. Campos de texto simples
  novos aqui podem reaproveitar o mesmo estilo de `div` com
  `APP_CONTAINER_STYLES.detailInfoField` já usado para Categoria, ou renderização
  simples de rótulo + `DefaultText`, sem necessidade de criar componente novo.
  Observação: a spec não define se o Símbolo Sagrado deve abrir o
  `ImagePreviewDialog` ao ser clicado (como a imagem de referência já faz) — sugerimos
  manter consistência aplicando o mesmo comportamento, mas isso não foi confirmado
  explicitamente e pode ser ajustado no code review se divergir do esperado.
- Abaixo da imagem/coluna de informações, reaproveitar `DivinitySectionBox` (já
  existente no arquivo) para todas as seções de texto rico e simples restantes,
  seguindo o mesmo agrupamento em linhas do formulário (sem os campos que já
  aparecem ao lado da imagem: Títulos, Elemento Primário, Animal Sagrado, Cor Sagrada,
  Símbolo Sagrado não se repetem aqui):
  - Descrição (já existente)
  - Personalidade
  - Grid 2 colunas: Domínios Divinos, Poderes
  - Influência no Mundo
  - Grid 2 colunas: Aparência Divina, Avatares
  - Grid 2 colunas: Igreja, Culto
  - Grid 2 colunas: Bênçãos, Maldições
  - Lendas
  - Grid 2 colunas: Mandamentos, Juramentos
  - Curiosidades
  - Usar `grid grid-cols-1 gap-4 sm:grid-cols-2` para os pares lado a lado, igual ao
    padrão já usado em `LocationView` (`app-web/src/app/(authorized)/locais/components/LocationView/index.tsx`).
  - Cada `DivinitySectionBox` precisa de um ícone (`react-icons/fi` ou equivalente já
    em uso no projeto) coerente com o rótulo da seção; escolher ícones consistentes
    com os já usados na feature (`FiFileText`, `FiTag`, etc.) ou em `react-icons/fi`
    de forma geral.

**Páginas/rotas**
- Nenhuma rota nova; a alteração é inteiramente dentro dos componentes
  `DivinityCreateForm` e `DivinityView`, já usados por `app/(authorized)/divindades/page.tsx`
  (ou modal correspondente) e por qualquer visualização via menção de entidade
  (`EntityMentionViewDispatcher`, se aplicável a divindades).

**Integrações com API**
- `GET /divinities/:id` — passa a retornar os 21 campos novos (via `IDivinity`).
- `POST /divinities` — payload passa a incluir os 21 campos novos.
- `PUT /divinities/:id` — payload passa a incluir os 21 campos novos.
- Nenhum novo endpoint é consumido; nenhuma mudança nos endpoints de listagem
  (`GET /divinities`) ou categorias é necessária para este escopo.

**Formulário/validação**
- Campos de texto comum (`titles`, `alignment`, `domainSphere`, `primaryElement`,
  `sacredAnimal`, `sacredColor`): `z.string()` opcional, sem regra de tamanho mínimo,
  igual ao padrão hoje aplicado a `description`.
- `sacredSymbol`: `z.string()` com o mesmo `refine` de URL opcional usado hoje em
  `referenceImage`.
- Campos de texto rico (`personality`, `divineDomains`, `powers`, `worldInfluence`,
  `divineAppearance`, `avatars`, `church`, `cult`, `blessings`, `curses`, `legends`,
  `commandments`, `oaths`, `curiosities`): `z.string()` opcional, mesmo padrão de
  `description`.
- Nenhum campo novo é obrigatório; `name`, `categoryId` continuam sendo os únicos
  campos obrigatórios do formulário.

### 2. web-dev-codereviewer
**Status:** concluído
- Revisar tudo acima: nomes de campos consistentes entre `IDivinity`,
  `divinityFormSchema` e os payloads enviados à API; nenhum campo existente removido
  ou com comportamento alterado; layout do formulário e do modal de visualização
  seguindo exatamente a ordem de linhas especificada; reaproveitamento de
  `FormTextInput`/`FormRichTextInput`/`RichTextViewer`/`DivinitySectionBox` sem
  duplicação de componentes; tratamento de `sacredSymbol` como URL de imagem
  (validação e renderização) consistente com o tratamento já dado a
  `referenceImage`.

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/shared/interfaces/Entities/Divinity/index.ts`
- `app-web/src/shared/formSchemas/DivinityFormSchema/index.ts`
- `app-web/src/app/(authorized)/divindades/components/DivinityCreateForm/index.tsx`
- `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx`

Pontos conferidos e validados sem divergências:
- Os 21 campos novos (`titles`, `alignment`, `domainSphere`, `primaryElement`,
  `sacredSymbol`, `sacredAnimal`, `sacredColor`, `personality`, `divineDomains`,
  `powers`, `worldInfluence`, `divineAppearance`, `avatars`, `church`, `cult`,
  `blessings`, `curses`, `legends`, `commandments`, `oaths`, `curiosities`) existem de
  forma consistente e com os mesmos nomes em `IDivinity`, `divinityFormSchema`
  (`DivinityFormData`/`divinityFormDefaultValues`), no `reset()` de edição e no
  `buildPayload` de `DivinityCreateForm`, e em `DivinityView`. Nenhum campo existente
  (`name`, `category`, `referenceImage`, `description`, `tags`) foi removido ou teve
  comportamento alterado; `IDivinityListItem` foi mantida como estava, conforme
  previsto na spec.
- `sacredSymbol` recebe exatamente o mesmo tratamento de `referenceImage`: no zod
  schema (`refine` de string vazia ou URL válida), no `buildPayload`
  (`data.sacredSymbol || undefined`) e na renderização de `DivinityView` (imagem
  quadrada 96x96 com fallback `FiImage` sobre `APP_COLORS.wood`, clicável para abrir
  `ImagePreviewDialog`, com `aria-label` em pt-BR).
- O layout de `DivinityCreateForm` segue exatamente a ordem de 13 blocos
  especificada (grids de 4 colunas para Nome/Títulos/Categoria/Tags, Imagem
  Referência/Símbolo Sagrado/Alinhamento/Esfera de Domínio, Elemento
  Primário/Animal Sagrado/Cor Sagrada + `<div />` de preenchimento; blocos de texto
  rico em largura total e em grids de 2 colunas na ordem indicada), reaproveitando
  `FormTextInput`/`FormAutocompleteInput`/`FormMultiAutocompleteInput`/
  `FormRichTextInput` já existentes, sem criação de inputs novos.
- `DivinityView` segue a ordem especificada no cabeçalho (Símbolo Sagrado, Nome,
  Títulos, Categoria, Tags, Elemento Primário, Animal Sagrado, Cor Sagrada) e reusa o
  `DivinitySectionBox` já existente no arquivo para todas as seções de texto
  simples/rico abaixo, com o mesmo agrupamento em grids de 2 colunas
  (`grid grid-cols-1 gap-4 sm:grid-cols-2`) usado em `LocationView` como referência de
  padrão, sem duplicar o componente. Cada seção nova usa um ícone coerente de
  `react-icons/fi` (nenhum ícone de outra lib, SVG customizado ou emoji encontrado).
- Estado de loading/erro tratado em ambos os componentes via
  `useGetEntityById`/`usePostEntity`/`usePutEntity` (hooks genéricos de
  `hooks/Queries`, nenhum `useQuery`/`useMutation` bespoke), com `CircularProgress` +
  texto durante carregamento e `showToast` em pt-BR nos casos de erro;
  `invalidateQueryKeys: [['/divinities']]` presente em ambas as mutations de
  criação/edição, então a listagem se atualiza sozinha sem `refetch()` manual.
  `isEditMode` é derivado de `useSelectedDivinityStore`, não de prop manual, seguindo
  o padrão `web-form-cadastro`.
- Não há campos de filtro/busca tocados por esta task (fora de escopo), então o
  padrão `web-secao-filtros` não se aplica aqui.
- Tipagem sem `any`; imports usados corretamente; nenhum hook usado fora das regras
  do React; nenhum símbolo inexistente referenciado (`FormRichTextInputProps`,
  `RichTextViewerProps` e `APP_CONTAINER_STYLES.detailInfoField`/`detailSectionBox`/
  `detailSectionBoxHeader` conferidos e existentes).
