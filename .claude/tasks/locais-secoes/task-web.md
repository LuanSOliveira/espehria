# Task Web: Seções de Local

## Contexto
Ver .claude/tasks/locais-secoes/spec.md

## Etapas

### 1. web-dev

#### Componentes

- Componente: `LocationSectionsField`
  (novo, em `app-web/src/app/(authorized)/locais/components/LocationSectionsField/`)
  - Props: `control: Control<LocationFormData>` (o `control` do `useForm` de
    `LocationCreateForm`, já com o campo `sections` incluído no schema/valores
    padrão do formulário).
  - Comportamento esperado:
    - Usa internamente `useFieldArray({ control, name: 'sections' })` para gerenciar
      a lista de seções (sem reordenação — apenas `append`/`remove`).
    - Para cada seção do array, renderiza um par de campos: `FormTextInput` para
      `sections.${index}.label` (label "Label", texto simples, obrigatório) em
      cima, e `FormRichTextInput` (componente já existente, reaproveitado — não
      criar rich text novo) para `sections.${index}.descricao` (label "Descrição",
      opcional) abaixo, mais um `IconButton` com ícone de lixeira (`FiTrash2`, sem
      confirmação) para remover aquela seção diretamente (`remove(index)`).
    - Layout em grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`, mesmo padrão já usado
      em `LocationCreateForm`): 2 seções por linha, cada uma ocupando metade da
      largura; a partir da 3ª seção, nova linha.
    - Abaixo da grid de seções, um `SecondaryButton` "Adicionar Seção" alinhado à
      direita (`justify-end`/`text-right`) que executa `append({ label: '',
      descricao: '' })`. As seções já adicionadas aparecem sempre acima deste
      botão (a nova linha só é criada conforme o grid enche, o botão permanece a
      última linha do bloco).
    - Se não houver nenhuma seção, a grid fica vazia e apenas o botão "Adicionar
      Seção" é exibido — sem mensagem de estado vazio (não pedido pelo spec).

- Componente: `LocationSectionCard`
  (novo, em `app-web/src/app/(authorized)/locais/components/LocationSectionCard/`)
  - Props: `section: ILocationSection` (`{ label: string; descricao?: string | null
    }`, mais `id`/`order` conforme vier da API).
  - Comportamento esperado:
    - Renderiza um quadro/card somente leitura reaproveitando o padrão visual já
      usado no bloco "Descrição" de `LocationView` (`APP_CONTAINER_STYLES.
      detailSectionBox` / `detailSectionBoxHeader`): cabeçalho com o `label` da
      seção (`Label`/`DefaultText`) e corpo com a `descricao` renderizada via
      `RichTextViewer` (componente já existente, reaproveitado — não criar viewer
      novo).
    - Não tem nenhuma ação (sem editar/remover) — é usado apenas na visualização.

Ambos os componentes precisam existir antes de serem consumidos por
`LocationCreateForm` e `LocationView`, respectivamente, na funcionalidade abaixo.

#### Funcionalidade

- Tipos/interfaces (`app-web/src/shared/interfaces/Entities/Location/index.ts`):
  - Adicionar `ILocationSection { id: string; label: string; descricao?: string |
    null; order?: number }` (ajustar nomes exatos dos campos conforme o DTO de
    resposta do `app-api`, que deve seguir a modelagem `LocationSection` descrita
    no `spec.md`).
  - Estender `ILocation` com `sections: ILocationSection[]`.

- Schema de formulário (`app-web/src/shared/formSchemas/LocationFormSchema/index.ts`):
  - Adicionar ao `locationFormSchema` o campo `sections: z.array(z.object({ label:
    z.string().min(1, 'Informe o label'), descricao: z.string().optional() }))`
    (sem mínimo/máximo de itens, conforme confirmado no spec).
  - Incluir `sections: []` em `locationFormDefaultValues`.
  - `LocationFormData` (inferido do schema) passa a carregar `sections` e é o tipo
    usado tanto pelo `useForm` quanto pelo `LocationSectionsField`.

- Páginas/rotas: nenhuma rota nova. Alterações dentro das telas já existentes de
  `app-web/src/app/(authorized)/locais/`:
  - `LocationCreateForm` (`components/LocationCreateForm/index.tsx`):
    - Renderizar `<LocationSectionsField control={control} />` logo abaixo do
      `FormRichTextInput` de `description` do Local (antes de
      `LocationPointsOfInterestField`, conforme a ordem pedida no spec: "abaixo do
      input de descrição do Local").
    - No `useEffect` de modo edição, ao dar `reset(...)` com os dados de
      `locationDetail`, incluir `sections: locationDetail.sections?.map((section)
      => ({ label: section.label, descricao: section.descricao ?? '' })) ?? []`.
    - `buildPayload`/`LocationPayload`: incluir `sections` no payload enviado para
      criação/edição (`data.sections`), com `label` e `descricao` (enviando
      `undefined`/omitindo quando `descricao` estiver vazia, no mesmo padrão já
      usado para `referenceImageUrl`). A ordem das seções é a ordem do próprio
      array (posição = ordem de adição), não é necessário enviar um campo `order`
      explícito a menos que o contrato da API exija — **confirmar com a
      implementação do `app-api` o nome exato do campo (`sections`) e se o back
      espera ou não um índice de ordem explícito no payload**, já que o `spec.md`
      não detalha o contrato de request/response desse endpoint.
  - `LocationView` (`components/LocationView/index.tsx`):
    - Abaixo do bloco "Descrição" (`detailSectionBox` com `RichTextViewer` da
      descrição do Local) e antes do grid de "Pontos de Interesse", renderizar o
      bloco de seções: se `location.sections.length > 0`, um grid (`grid
      grid-cols-1 sm:grid-cols-2 gap-4`) com um `LocationSectionCard` por seção,
      2 por linha (mesma lógica de layout do formulário). Se `location.sections`
      estiver vazio, omitir o bloco inteiro (sem título nem mensagem de "nenhuma
      seção").

- Integrações com API:
  - Reaproveita os hooks genéricos já usados por `LocationCreateForm`:
    `useGetEntityById<ILocation>` (`GET /locations/:id`, agora retornando também
    `sections`), `usePostEntity<ILocation, LocationPayload>` (`POST /locations`) e
    `usePutEntity<ILocation, LocationPayload>` (`PUT /locations/:id`), ambos
    passando `sections` dentro do payload. `LocationView` usa o mesmo
    `useGetEntityById<ILocation>` (`GET /locations/:id`) para obter as seções a
    exibir. Nenhum endpoint novo é chamado diretamente pelo frontend — a
    persistência das `LocationSection` acontece via cascade no `app-api`.

- Formulário/validação:
  - Campo `sections`: array de objetos `{ label, descricao }`.
    - `label`: texto simples, obrigatório (`min(1)`, mensagem "Informe o label").
    - `descricao`: rich text (HTML string), opcional, pode ficar vazia.
  - Sem validação de quantidade mínima/máxima de seções.
  - Sem reordenação — apenas adicionar (`append`) e remover (`remove`) via
    `useFieldArray`, sem confirmação para remoção.

Status: concluído
Componentes:
- app-web/src/app/(authorized)/locais/components/LocationSectionsField/index.tsx (novo)
- app-web/src/app/(authorized)/locais/components/LocationSectionCard/index.tsx (novo)
Arquivos:
- app-web/src/shared/interfaces/Entities/Location/index.ts (adicionado ILocationSection e campo sections em ILocation)
- app-web/src/shared/formSchemas/LocationFormSchema/index.ts (adicionado campo sections ao schema/valores default)
- app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx (renderiza LocationSectionsField, reset com sections, payload com sections)
- app-web/src/app/(authorized)/locais/components/LocationView/index.tsx (renderiza grid de LocationSectionCard quando há seções)

Observação: o campo de descrição da seção foi nomeado `description` (não `descricao`
como sugerido no texto da task), para alinhar exatamente com o contrato já
implementado no `app-api` (`LocationSectionInputDto`/`LocationSectionResponseDto`
usam `description`), conforme instrução explícita de alinhamento com a API.

### 2. web-dev-codereviewer
- Revisar tudo acima

Status: concluído

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/app/(authorized)/locais/components/LocationSectionsField/index.tsx
- app-web/src/app/(authorized)/locais/components/LocationSectionCard/index.tsx
- app-web/src/shared/interfaces/Entities/Location/index.ts
- app-web/src/shared/formSchemas/LocationFormSchema/index.ts
- app-web/src/app/(authorized)/locais/components/LocationCreateForm/index.tsx
- app-web/src/app/(authorized)/locais/components/LocationView/index.tsx

Pontos verificados e conformes:
- `LocationSectionsField` usa `useFieldArray({ control, name: 'sections' })`
  corretamente, apenas com `append`/`remove` (sem reordenação), conforme
  `spec.md`. Chave de lista usa `field.id` (estável do RHF), remoção é direta via
  `remove(index)` sem modal de confirmação, e o `IconButton` de lixeira usa
  `FiTrash2` (react-icons) com `aria-label="Remover seção {n}"` em pt-BR, além de
  `Tooltip` — mesmo padrão já usado em `LocationPointOfInterestCard`.
- Reaproveita `FormTextInput` (label) e `FormRichTextInput` (descrição, rich text
  já existente) — nenhum rich text novo foi criado, conforme exigido.
- Layout em grid `grid grid-cols-1 sm:grid-cols-2 gap-4` tanto no formulário
  quanto em `LocationView`, replicando exatamente o padrão de 2 colunas já usado
  em `LocationCreateForm`.
- Quando não há seções, a grid não é renderizada e apenas o botão "Adicionar
  Seção" aparece (`SecondaryButton`, alinhado com `justify-end`), sem mensagem de
  estado vazio — de acordo com o spec.
- `LocationView` omite o bloco de seções por completo quando
  `location.sections.length === 0` (sem título nem mensagem), e `LocationSectionCard`
  reaproveita fielmente o padrão visual de `detailSectionBox`/`detailSectionBoxHeader`
  já usado no bloco "Descrição", com `RichTextViewer` (também reaproveitado, sem
  viewer novo) — sem nenhuma ação de editar/remover, como esperado para um
  componente somente leitura.
- O payload (`buildPayload`/`LocationPayload`) envia `sections` como
  `{ label, description }`, omitindo `description` quando vazio (`|| undefined`),
  no mesmo padrão já usado para `referenceImageUrl`; não envia `order` explícito,
  o que está correto porque `LocationsService.buildSections` no `app-api` calcula o
  `order` a partir do índice do array recebido (`create-location.dto.ts` +
  `locations.service.ts`).
- O campo foi nomeado `description` (em vez de `descricao`) de forma consistente
  em `ILocationSection`, `locationFormSchema`, `LocationSectionsField`,
  `LocationSectionCard` e no `buildPayload` de `LocationCreateForm` — alinhado
  exatamente com `LocationSectionInputDto`/`LocationSectionResponseDto` do
  `app-api` (campo `description`). Não há nenhuma referência residual a
  `descricao` no código do frontend.
- `LocationCreateForm` reaproveita os hooks genéricos `useGetEntityById`,
  `usePostEntity`, `usePutEntity` de `hooks/Queries`, com `invalidateQueryKeys:
  [['/locations']]` já configurado nas mutations existentes (nenhum endpoint novo
  é chamado diretamente, seções persistidas via cascade no back, como esperado).
  `reset(...)` no modo edição mapeia `locationDetail.sections` para
  `{ label, description: description ?? '' }`, compatível com o schema do
  formulário.
- Tipagem consistente: `LocationSectionPayload` e o array `sections` de
  `LocationPayload` batem com `LocationSectionInputDto` do `app-api` (label
  obrigatório, description opcional). `ILocationSection` inclui `id`/`order` como
  não-opcionais, compatível com `LocationSectionResponseDto`. Sem uso de `any`.
- Componentes ficam em
  `app-web/src/app/(authorized)/locais/components/`, consistente com os demais
  componentes específicos da feature de Locais (`LocationPointsOfInterestField`,
  `LocationPointOfInterestCard`), e não duplicam nenhum componente já existente.
- Textos de UI (labels, placeholders, tooltip, aria-label, botão "Adicionar
  Seção") em pt-BR.
