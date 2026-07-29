# Task Web: Sidebar com seções em accordion

## Contexto
Ver .claude/tasks/sidebar-secoes-accordion/spec.md

Demanda restrita ao `app-web`, sem alterações de backend. A navegação continua
estática, vinda de `NAV_SECTIONS`
(`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`); apenas o
comportamento visual/interativo do `Sidebar`
(`app-web/src/app/(authorized)/components/Sidebar/index.tsx`) muda.

## Etapas

### 1. web-dev

#### Componentes

- Componente: `SidebarSectionAccordion`
  - Local: `app-web/src/app/(authorized)/components/Sidebar/components/SidebarSectionAccordion/index.tsx`
    (component-specific, não vai para `shared/components/` — é o primeiro padrão
    de accordion do projeto, mas está fortemente acoplado ao `NavSection`/
    `NavItem` e ao comportamento de rota ativa do Sidebar; não há outro consumidor
    previsto no momento). Seguir o padrão de pasta local já usado para
    subcomponentes de página (ex.: `<Feature>/components/<Componente>/index.tsx`,
    como nas `*FilterSection`).
  - Props sugeridas:
    - `title: string` — título da seção (ex.: "Mundo", "História",
      "Gerenciamento").
    - `items: NavItem[]` — itens de navegação da seção (tipo já existente em
      `Sidebar/data/index.ts`).
    - `isExpanded: boolean` — estado de expansão controlado pelo `Sidebar` pai.
    - `onToggle: () => void` — callback disparado ao clicar/ativar o cabeçalho.
    - `iconFontSize: number` — tamanho de ícone acessível, já calculado no
      `Sidebar` via `useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon)`, para
      manter consistência com o ícone do item "Home" e evitar chamar o hook
      duplicado.
    - `pathname: string` — pathname atual (de `usePathname()`), para calcular
      `isActive` de cada item exatamente como hoje (`pathname === item.href`).
  - Comportamento esperado:
    - Renderiza um cabeçalho clicável (usar elemento `<button type="button">` ou
      `div role="button" tabIndex={0}` com `onKeyDown` para Enter/Space — preferir
      `button` nativo para foco/teclado automáticos) exibindo `title` (reaproveitar
      `Label`, mesmo estilo/cor `APP_COLORS.gold` já usado hoje no título da
      seção) e um ícone `FiChevronDown` (de `react-icons/fi`, mesma família `Fi`
      já usada nos ícones de item) à direita.
    - `aria-expanded={isExpanded}` no elemento clicável.
    - O ícone chevron rotaciona 180° quando `isExpanded` é `true`, com transição
      suave (`transition: transform 200ms ease-in-out` ou similar via `sx`).
    - Abaixo do cabeçalho, envolve a lista de `items` em `Collapse` (MUI,
      `import { Collapse } from '@mui/material'`) com `in={isExpanded}` para a
      animação de expandir/retrair.
    - Dentro do `Collapse`, reaproveita exatamente a marcação de item já existente
      no `Sidebar` hoje (mapeia `items`, calcula `isActive = pathname ===
      item.href`, renderiza `Link` + ícone (`item.icon`) + `DefaultText`,
      preservando classes/estilos atuais de destaque do item ativo
      (`border-gold bg-gold/25` vs `border-transparent bg-transparent`, hover
      `hover:bg-gold/15`), sem nenhuma mudança visual nos itens em si.

#### Funcionalidade

- Páginas/rotas: nenhuma rota nova ou alterada. O componente `Sidebar` é usado em
  todo o `AuthorizedShell`, então o efeito é visível em todas as páginas
  autenticadas, mas nenhuma página em si muda.
- Integrações com API: nenhuma. Navegação continua 100% estática a partir de
  `NAV_SECTIONS` (`app-web/src/app/(authorized)/components/Sidebar/data/index.ts`),
  sem nenhum novo fetch/hook de `hooks/Queries`.
- Formulário/validação: não se aplica.
- Alterações em `app-web/src/app/(authorized)/components/Sidebar/index.tsx`:
  - Manter a primeira seção do array `NAV_SECTIONS` (sem `title`, item "Home")
    renderizada exatamente como hoje: sempre visível, sem cabeçalho, fora da
    lógica de accordion.
  - Para as demais seções (`section.title` definido), substituir o bloco atual
    (título fixo + lista de itens sempre visível) pelo uso do novo componente
    `SidebarSectionAccordion`, passando `title`, `items`, `pathname`,
    `iconFontSize` e o par `isExpanded`/`onToggle` derivados do novo estado local
    descrito abaixo. O `Divider` entre seções continua sendo renderizado no
    `Sidebar` (fora do componente de accordion), exatamente como hoje — não
    alterar essa lógica.
  - Novo estado local (sem Zustand, sem localStorage): `useState<string | null>`
    guardando o identificador da seção atualmente expandida (usar `section.title`
    como identificador, mesmo valor já usado como `key` no `map` atual — títulos
    são únicos em `NAV_SECTIONS`).
    - Inicialização: calcular de forma "lazy" (função passada ao `useState`) a
      seção cujo `items` contenha `item.href === pathname` no momento da primeira
      renderização, entre as seções com `title` definido; se nenhuma bater (ex.:
      rota é "Home" ou não pertence a seção com título), iniciar como `null`
      (nenhuma seção expandida).
    - Sincronização com navegação: `useEffect` com dependência `[pathname]` que
      recalcula a mesma lógica acima (seção com título cujo `items` contenha a
      rota ativa, ou `null` se nenhuma) e chama o setter do estado. Como o efeito
      só reexecuta quando `pathname` muda, um fechamento manual do usuário na
      seção ativa (clique no cabeçalho já expandido) não é revertido pelo efeito
      enquanto a rota não mudar — consistente com a regra do spec.
    - Handler de toggle (passado como `onToggle` a cada `SidebarSectionAccordion`):
      se a seção clicada já é a expandida, define o estado como `null`; caso
      contrário, define o estado como o identificador da seção clicada
      (substituindo qualquer seção previamente expandida — expansão exclusiva já
      é garantida por só existir um valor no estado).
  - Preservar inalterado: o colapso horizontal da sidebar via prop `isOpen`
    (largura/`overflow-hidden` no `<aside>`), o destaque do item ativo, e o
    `Divider` entre seções.

Status: concluído
Componentes: app-web/src/app/(authorized)/components/Sidebar/components/SidebarSectionAccordion/index.tsx (novo)
Arquivos: app-web/src/app/(authorized)/components/Sidebar/index.tsx (alterado)

### 2. web-dev-codereviewer
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- `app-web/src/app/(authorized)/components/Sidebar/components/SidebarSectionAccordion/index.tsx`
- `app-web/src/app/(authorized)/components/Sidebar/index.tsx`

Pontos verificados e conformes:
- Etapa "1. web-dev" está marcada como "Status: concluído", com os caminhos de
  arquivo condizentes com o que foi de fato criado/alterado.
- `SidebarSectionAccordion` foi criado no local correto
  (`Sidebar/components/SidebarSectionAccordion/index.tsx`), seguindo o padrão de
  subcomponente local de página (como as `*FilterSection`), sem ser promovido
  indevidamente a `shared/components/` — coerente com a justificativa do spec de que
  é fortemente acoplado ao `Sidebar` e não há outro consumidor previsto. Confirmado
  também que não existe nenhum componente `Accordion` prévio em `shared/components/`
  que estivesse sendo duplicado.
- Props (`title`, `items: NavItem[]`, `isExpanded`, `onToggle`, `iconFontSize`,
  `pathname`) batem exatamente com o sugerido no spec/task, com tipagem correta
  (`NavItem` importado de `../../data`, caminho relativo resolve corretamente para
  `Sidebar/data`). `iconFontSize` é calculado uma única vez no `Sidebar` via
  `useAccessibleFontSize` e passado por prop, evitando chamada duplicada do hook.
- Cabeçalho da seção usa `<button type="button">` nativo (foco e operação via
  teclado automáticos), com `aria-expanded={isExpanded}`, título via `Label`
  (`component="span"`, cor `APP_COLORS.gold`) e ícone `FiChevronDown` de
  `react-icons/fi` — mesma família já usada nos itens, sem uso de
  `@mui/icons-material` ou ícones customizados. Rotação do chevron
  (`rotate(180deg)`/`rotate(0deg)`) com `transition: transform 200ms ease-in-out`
  conforme especificado.
- Lista de itens da seção envolvida em `Collapse` (`in={isExpanded}`) do MUI, com a
  marcação de item (link, ícone, destaque `border-gold bg-gold/25` vs
  `border-transparent bg-transparent`, hover `hover:bg-gold/15`) preservada
  idêntica à usada para o item "Home", sem alteração visual.
- `Sidebar/index.tsx`: a primeira seção (sem `title`, item "Home") continua fora da
  lógica de accordion, sempre visível, sem cabeçalho — inalterada. O `Divider` entre
  seções continua renderizado no `Sidebar` (fora do componente de accordion), com a
  mesma condição (`sectionIndex > 0`) de antes.
- Estado local `useState<string | null>` (sem Zustand, sem localStorage) com
  inicialização lazy via `getSectionForPathname(pathname)`, que procura a seção com
  `title` definido cujo `items` contenha `item.href === pathname`, retornando `null`
  se nenhuma bater — exatamente a regra do spec para o carregamento inicial (inclui
  o caso "Home"/rota fora de seção com título).
- `useEffect` com dependência `[pathname]` recalcula a mesma lógica e sincroniza o
  estado a cada navegação, sem reagir a nada além da mudança de rota — isso preserva
  corretamente a regra de que um fechamento manual do usuário na seção ativa não é
  revertido enquanto a rota não mudar.
- `handleToggleSection` implementa expansão exclusiva corretamente: fecha (`null`)
  se a seção clicada já está expandida, senão substitui o valor único do estado pela
  seção clicada — no máximo uma seção expandida por vez, sem necessidade de lógica
  adicional dado o uso de um único valor de estado.
- Colapso horizontal da sidebar via prop `isOpen` (largura/`overflow-hidden` no
  `<aside>`) permanece inalterado.
- Nenhum import quebrado/não utilizado, nenhum uso de hook fora das regras do React
  (todos incondicionais, no topo do componente), nenhum `any`, tipos coerentes em
  toda a cadeia de props.
