# Spec: Sidebar com seções em accordion (sidebar-secoes-accordion)

## Pedido original
O menu lateral de navegação (Sidebar) exibe seções fixas (MUNDO, HISTÓRIA,
GERENCIAMENTO), cada uma com suas opções de navegação sempre visíveis abaixo do
título da seção. Preciso que essas seções se tornem um accordion: por padrão as
seções ficam retraídas (mostrando só o título/cabeçalho da seção), e ao clicar em
uma seção ela expande, revelando as opções de navegação daquela seção.

## Perguntas e respostas
- P: Ao expandir uma seção, as demais seções expandidas devem fechar automaticamente
  (accordion exclusivo, no máximo uma aberta por vez), ou é permitido ter várias
  seções abertas simultaneamente?
  → R: Expansão exclusiva. Abrir uma seção fecha automaticamente as demais. No
  máximo uma seção com título expandida por vez.

- P: Ao carregar a página (ou navegar para uma rota), a seção que contém a rota
  ativa deve iniciar/ficar expandida automaticamente, ou o estado de expansão é
  totalmente independente da navegação?
  → R: Sim. A seção que contém a rota atualmente ativa deve iniciar expandida
  automaticamente ao carregar a página e ao navegar entre rotas.

- P: O estado de expansão deve ser persistido (ex.: localStorage, store) entre
  navegações/refresh, ou é apenas estado em memória que reseta ao recarregar a
  página?
  → R: Sem persistência. O estado de expansão é apenas em memória (React state);
  reseta no refresh. Não usar localStorage nem store Zustand para isso.

- P: O item "Home" (seção sem título, primeira do array `NAV_SECTIONS`) participa
  da lógica de accordion (ganha cabeçalho clicável e pode ser retraído) ou permanece
  sempre visível, fora dessa lógica?
  → R: O item "Home" permanece sempre visível, solto no topo, fora da lógica de
  accordion — nunca é retraído nem ganha cabeçalho clicável.

- P: Qual o comportamento visual esperado para o cabeçalho clicável de cada seção
  (indicador de expandido/retraído, animação de abertura/fechamento)?
  → R: Cada cabeçalho de seção com título vira um controle clicável exibindo o
  título e um ícone chevron que rotaciona conforme o estado (expandido/retraído),
  com animação suave de expand/collapse usando o componente `Collapse` do MUI. Este
  será o primeiro padrão de accordion do design system do projeto.

## Escopo confirmado

### Estrutura afetada
- Componente `Sidebar` (`app-web/src/app/(authorized)/components/Sidebar/`), que
  hoje renderiza as seções de `NAV_SECTIONS` com título e itens sempre visíveis
  abaixo do cabeçalho.
- A primeira seção do array (sem `title`, contendo apenas o item "Home") não é
  afetada por esta mudança: continua sempre visível, sem cabeçalho e fora da lógica
  de accordion.
- As demais seções (com `title`: "Mundo", "História", "Gerenciamento") passam a se
  comportar como um accordion.

### Regra de expansão exclusiva
- No máximo uma seção com título pode estar expandida por vez.
- Ao clicar no cabeçalho de uma seção retraída, ela expande e qualquer outra seção
  que estivesse expandida é retraída automaticamente.
- Ao clicar no cabeçalho de uma seção já expandida, ela retrai, podendo resultar em
  nenhuma seção expandida.

### Regra de sincronização com a rota ativa
- A seção que contém a rota atualmente ativa (`pathname === item.href` para algum
  item da seção) deve iniciar expandida automaticamente ao carregar a página.
- Ao navegar para uma rota pertencente a outra seção, a seção da nova rota passa a
  ser a expandida e a seção anteriormente expandida fecha.
- Se a rota atual for "Home" ou não pertencer a nenhuma seção com título, todas as
  seções com título iniciam retraídas.
- Caso o usuário feche manualmente a seção que contém a rota ativa (ficando nenhuma
  seção expandida), ela não deve reabrir sozinha enquanto a rota não mudar — a
  sincronização automática só reage a mudanças de rota, não sobrepõe uma escolha
  manual do usuário na mesma rota.

### Persistência
- O estado de expansão das seções é mantido apenas em memória (estado local de
  componente/React), sem uso de localStorage, cookies ou store Zustand. O estado
  reseta a cada carregamento/refresh de página (sujeito à regra de sincronização
  com a rota ativa acima).

### Comportamento visual e acessibilidade
- Cada seção com título passa a ter um cabeçalho clicável exibindo o título da
  seção e um ícone chevron (reaproveitando o padrão de ícone `Fi`, ex.:
  `FiChevronDown`, já usado na Sidebar) que rotaciona conforme o estado
  (expandido/retraído).
- A transição de expandir/retraír usa o componente `Collapse` do MUI, com animação
  suave.
- O destaque visual do item de navegação ativo (`pathname === item.href`) já
  existente deve ser preservado inalterado.
- O comportamento atual dos `Divider` entre seções e do colapso horizontal da
  sidebar via prop `isOpen` deve ser preservado inalterado.
- O cabeçalho da seção deve ser um elemento focável e operável via teclado, com o
  atributo `aria-expanded` refletindo o estado de expansão da seção.
- Este é o primeiro padrão de accordion do design system do projeto (não há
  componente equivalente reutilizável em `app-web/src/shared/components/` até o
  momento).
