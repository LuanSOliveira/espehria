---
name: web-componentes
description: Use sempre que for necessário criar um componente React novo no app-web. Decide se o componente é genérico (reaproveitável em toda a aplicação) e deve ir em shared/components/, ou se é específico de uma página e deve ir na pasta components/ dentro do diretório da própria página — e como estruturá-lo em cada caso. Não use para decidir sobre tabelas de listagem de entidades (essa decisão já é coberta pela skill web-tabela-listagem) nem sobre seção de filtros de listagem (skill web-secao-filtros).
---

# Decisão de local e estrutura de componentes (app-web)

## 1. Genérico ou específico de página?

Antes de criar qualquer componente, pergunte: **este componente faz sentido fora do
contexto da página atual, sem saber nada sobre a entidade/feature específica?**

- **Genérico** (sim) — inputs, botões, containers, modais, textos, qualquer peça de UI
  que só recebe props primitivas/genéricas e não conhece a forma de nenhuma entidade
  de negócio (`User`, etc.). Vai em `app-web/src/shared/components/`.
- **Específico de página** (não) — uma listagem de uma entidade, um formulário de uma
  feature, uma seção de página que só faz sentido ali. Vai em
  `app-web/src/app/(<grupo>)/<pagina>/components/`.

Regra prática: se o componente importa um tipo de `shared/interfaces/Entities` (ex.:
`IUser`) ou conhece uma rota/endpoint específico, ele é específico de página — não
shared, mesmo que pareça "reaproveitável" para outra entidade no futuro. Não generalize
preventivamente.

Antes de criar um componente genérico novo, sempre confira se já não existe um
equivalente em `shared/components/` (Grep/Glob) — reaproveitar é preferível a duplicar.

## 2. Estrutura de um componente genérico (`shared/components/`)

Os componentes genéricos hoje estão organizados por categoria, cada uma com seu
próprio índice de barrel:

```
shared/components/
  Buttons/            (PrimaryButton, SecondaryButton, ...)
  Inputs/
    DefaultInputs/     (estado local simples: DefaultTextInput, DefaultPasswordInput)
    FormInputs/        (registrados via react-hook-form: FormTextInput, FormPasswordInput)
  Containers/         (Card, PageContainer, ...)
  Modals/              (FormModal, ConfirmationModal, ...)
  Texts/                (DefaultText, Label, Title, ...)
```

Ao criar um componente genérico novo:
- Coloque-o em `shared/components/<Categoria>/<NomeDoComponente>/index.tsx` (uma pasta
  por componente). Se a categoria não existir ainda, siga o mesmo padrão de pasta +
  `index.ts` de barrel das categorias existentes.
- Exporte o componente e sua interface de props (`<NomeDoComponente>Props`) do
  `index.tsx`, e reexporte pelo `index.ts` da categoria.
- Se o componente for um input conectado a formulário, siga o padrão `FormInputs`:
  props genéricas por `FieldPath<TFieldValues>`/`Control<TFieldValues>`, envolvendo um
  componente MUI com `Controller` do `react-hook-form` (veja
  `shared/components/Inputs/FormInputs/FormTextInput`). Se for de estado simples
  (sem formulário), siga o padrão `DefaultInputs`.
- Marque `'use client'` no topo quando o componente usa hooks/estado/eventos do
  browser (é o padrão em todos os componentes atuais).

## 3. Estilização de componente genérico — sempre via `constants/Styles`

Componentes genéricos **nunca** devem ter cores ou estilos "soltos" inline. Toda
estilização visual reaproveitável vem de `shared/constants/Styles/`:

- Cada categoria tem seu arquivo de estilos (`ButtonStyles`, `InputStyles`,
  `ContainerStyles`, `TextStyles`), exportando um objeto `Record<string,
  SystemStyleObject<Theme>>` com uma chave por variante (ex.: `APP_BUTTON_STYLES.primary`,
  `.secondary`, `.iconButton`).
- Esses objetos de estilo usam sempre `APP_COLORS` (de `shared/constants/Colors`) para
  cor — nunca um valor hexadecimal direto dentro do componente ou do arquivo de estilo
  de outra categoria.
- No componente, aplique via prop `sx`, mesclando com qualquer `sx` recebido de fora
  (veja o padrão de merge em `FormTextInput`: `sx={[APP_INPUT_STYLES.textField, ...,
  ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}`).
- Se a variante que você precisa não existir ainda no arquivo de estilos da categoria,
  adicione uma nova chave lá — não crie um objeto de estilo local dentro do componente.

## 4. Estrutura de um componente específico de página (`components/` da página)

```
app/(authorized)/<pagina>/
  page.tsx
  components/
    <NomeDoComponente>/
      index.tsx
```

- Mesma convenção de pasta-por-componente e export nomeado do componente + sua
  interface de props.
- Pode importar tipos de entidade (`shared/interfaces/Entities`) e conhecer a forma de
  dados da feature — isso é esperado e correto aqui, ao contrário de um componente
  genérico.
- Componentes específicos de página **compõem** componentes genéricos de
  `shared/components/` (Buttons, Inputs, Texts, Containers, Modals) em vez de recriar
  UI equivalente — ex.: uma linha de tabela usa `DefaultText`/`Label` de `Texts`, não
  um `<span>` estilizado manualmente.
- `page.tsx` importa esses componentes com caminho relativo (`./components/...`), não
  via alias `@/`.
