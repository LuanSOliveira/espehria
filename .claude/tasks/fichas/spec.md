# Spec: Fichas

## Pedido original

O usuário pediu a criação de uma nova funcionalidade "Fichas" (fichas de personagem de RPG,
pertencentes a um usuário, vinculadas opcionalmente a uma campanha e a uma raça), com:

- Uma entidade de ficha com os campos: nome, imagem de referência, nível, campanha e raça.
- Uma listagem de fichas (escopada ao usuário autenticado) com uma tela de cadastro simplificada
  (modal) e uma página de edição completa em `/fichas/[id]`, que abre em nova aba a partir da
  listagem, com autosave por campo.
- Um item de menu "Fichas", visível tanto para usuários locais quanto para usuários autenticados
  via Google — diferente do restante do sistema, onde usuários Google normalmente têm acesso
  bloqueado ou somente leitura.
- Como consequência de fichas serem visíveis/editáveis por usuários Google, uma necessidade de
  usuários Google poderem selecionar, no cadastro/edição da própria ficha, uma campanha da qual
  participam — o que exigiu estender o módulo de Campanhas com uma lista de "Usuários Permitidos"
  (`allowedUsers`), gerenciável pelo dono local da campanha, para autorizar usuários Google
  específicos a enxergar aquela campanha nesse contexto pontual (sem abrir o restante do módulo de
  Campanhas para Google).

A partir desse pedido original, foram levantadas 8 perguntas de esclarecimento (registradas abaixo)
sobre obrigatoriedade de campos, regras de exclusão em cascata, escopo de acesso entre usuários e
nomenclatura. Este documento registra as respostas recebidas e consolida o escopo completo,
incluindo pontos que já haviam sido definidos no pedido original e que não geraram nova pergunta.

## Perguntas e respostas

- P: Quando um usuário Google seleciona uma campanha no autocomplete de ficha, essa nova
  visibilidade deve valer só ali ou deve abrir o restante do módulo de Campanhas (rota
  `/campaigns`, sessões planejadas) para Google? → R: A nova visibilidade vale SOMENTE no
  autocomplete de fichas, via uma consulta/endpoint dedicado. O restante do módulo de campanhas
  continua bloqueado para Google exatamente como hoje — o `@GoogleAccess('blocked')` do
  `CampaignsController` permanece intacto. Não deve ser aberto `/campaigns` nem
  planned-sessions para Google.

- P: Como o dono de uma campanha (usuário local) vai encontrar e selecionar usuários Google para
  incluir em "Usuários Permitidos"? → R: Deve ser criada uma consulta/endpoint nova, retornando
  usuários com `provider = GOOGLE`, buscável por nome/e-mail, paginada, usável por qualquer
  usuário local ao editar sua própria campanha, para popular o autocomplete de "Usuários
  Permitidos".

- P: O campo `campaign` na ficha deve ser obrigatório? → R: Não. Mudança em relação ao pedido
  original: `campaign` passa a ser OPCIONAL na ficha. Consequências:
  - No cadastro de ficha (modal), apenas `name` é obrigatório. `campaign` é opcional, assim como
    `referenceImage`.
  - A referência de campanha na ficha é uma chave estrangeira nullable, sem cascade de exclusão de
    fichas: ao excluir uma campanha vinculada a fichas, a referência na(s) ficha(s) apenas fica
    nula (comportamento `SET NULL`). A exclusão da campanha nunca é impedida por ter fichas
    vinculadas.
  - A regra de filtragem do autocomplete de campanha (Google só vê campanhas em que está em
    `allowedUsers`; local vê todas) permanece igual e vale independentemente de o campo ser
    obrigatório ou opcional.

- P: Um usuário local pode acessar/editar a ficha de outro usuário (local ou Google) através da
  rota `/fichas/[id]`? → R: Sim, sem restrição. Nessa rota específica, um usuário local pode editar
  (autosave) e excluir QUALQUER ficha, inclusive fichas criadas por outros usuários. A listagem de
  fichas continua mostrando apenas as próprias fichas do usuário autenticado — a permissão ampla
  vale só para acesso direto via `/fichas/[id]`.

- P: O que deve acontecer quando um usuário Google tenta acessar, via `/fichas/[id]`, uma ficha que
  não é dele? → R: Seguir o padrão já existente no repositório (idêntico ao usado em Campanhas): a
  API retorna 404 ("não encontrada ou não pertence ao usuário"); o frontend, ao receber 404 nessa
  página, redireciona para a listagem de fichas exibindo um toast de erro.

- P: O campo de imagem da ficha deve se chamar `referenceImage` ou `referenceImageUrl`? → R:
  `referenceImage`, seguindo o mesmo padrão já usado pela entidade de Personagens (`Character`).
  Confirmado que NÃO é `referenceImageUrl` (que é o padrão usado por Campanha).

- P: Qual a regra de valor para o campo `level`? → R: Apenas número inteiro positivo, mínimo 1, sem
  valor máximo definido e sem faixa customizada. `level` continua fixado em 1 na criação (sem input
  correspondente no modal de cadastro) e passa a ser editável, com autosave, na página
  `/fichas/[id]`.

- P: O filtro por campanha na listagem de fichas deve mostrar todas as campanhas ou só as que já
  têm fichas cadastradas? → R: Mesma regra do autocomplete de cadastro — todas as campanhas
  visíveis ao usuário conforme a regra Google/local (a mesma consulta dedicada é reaproveitada),
  independentemente de já terem ou não fichas cadastradas.

### Pontos já definidos no pedido original (não gerados por pergunta nova nesta rodada)

Os itens abaixo já faziam parte do pedido original (ou de instruções complementares recebidas
junto com as respostas às 8 perguntas) e não estão em aberto:

- Fichas são escopadas ao dono na LISTAGEM: tanto usuários Google quanto locais só veem, na
  listagem de fichas, as próprias fichas.
- O controller de fichas não usa `@GoogleAccess`: usuários Google podem criar, editar e excluir as
  próprias fichas. Esta é uma exceção consciente ao padrão de somente-leitura/bloqueio aplicado ao
  restante do sistema para usuários Google, justificada por "Fichas" ser uma área pessoal do
  próprio jogador (mesmo autenticado via Google), e não um recurso de mundo/campanha administrado
  pelo mestre.
- `level` é fixado no backend como `1` no momento da criação, ignorando qualquer valor enviado pelo
  cliente nesse momento.
- A nomenclatura do módulo/entidade/rota da API deve ser em inglês e distinta do módulo `characters`
  (Personagens) já existente, para evitar confusão entre os dois conceitos. Nomenclatura adotada:
  entidade e módulo `Sheet`/`sheets`, rota de API `/sheets`. A rota e o item de menu no frontend
  continuam em português (`/fichas`, `/fichas/[id]`), seguindo o mesmo padrão já usado por
  Personagens (rota de API `/characters` em inglês, rota de UI `/personagens` em português).
- `race` é um campo opcional da ficha. Ao excluir uma raça referenciada por fichas, a referência na
  ficha fica nula (`SET NULL`), sem impedir a exclusão da raça e sem cascade de exclusão de fichas —
  mesmo comportamento definido para `campaign`. O campo `race` aparece somente na página
  `/fichas/[id]`; nunca no modal de cadastro.
- Autosave por campo, na página `/fichas/[id]`, com debounce de 2,5 segundos, contado de forma
  independente por campo: a edição em um campo não cancela nem reinicia o timer de outro campo em
  edição simultânea. Exemplo: se o usuário altera o campo Nome e, antes de completar 2,5 segundos,
  também altera o campo Nível, os dois campos são salvos de forma independente — o timer do campo
  Nome continua contando a partir da última alteração feita nele, e o timer do campo Nível conta a
  partir da última alteração feita nele; a atividade em um campo não afeta o timer do outro.
- A página `/fichas/[id]` é aberta em uma NOVA ABA a partir da listagem de fichas.
- Inputs estilizados usados exclusivamente na página de ficha (ex.: campos com `variant="standard"`)
  devem ficar em uma pasta `components/` dentro da pasta da página dinâmica de ficha, nunca em
  `shared/components`.
- Layout da página `/fichas/[id]`: imagem em formato retrato à esquerda, com um botão de edição que
  abre um modal contendo um input de URL; ao lado da imagem, o campo `name` sem label, em fonte
  grande e negrito; na mesma linha, na extremidade oposta, o campo `level` com label acima; abaixo
  dessa linha, o campo `campaign` (autocomplete); abaixo deste, o campo `race` (autocomplete).
- Item de menu "Fichas": posicionado fora de qualquer seção com título, logo abaixo do item
  "Campanhas", visível tanto para usuários Google quanto para usuários locais.
- No formulário de cadastro/edição de campanha (parte 1, pré-requisito desta feature): o campo
  "Usuários Permitidos" (`allowedUsers`) é posicionado logo abaixo do campo "Descrição", com um
  autocomplete para adicionar usuários Google à lista e uma opção para remover usuários já
  adicionados da lista.

## Escopo confirmado

### 1. Nomenclatura

A nova entidade é chamada, em inglês, de `Sheet` (módulo `sheets`, rota de API `/sheets`), para não
ser confundida com o módulo `characters`/Personagens já existente, que representa outro conceito
(personagens de história/mundo, não fichas de jogador). No frontend, a rota e o item de menu
permanecem em português: `/fichas` (listagem) e `/fichas/[id]` (edição).

### 2. Entidade Ficha (Sheet) — campos e regras

A ficha possui os seguintes campos:

- **Nome** (`name`): texto, obrigatório em qualquer operação de criação. Não há regra de
  unicidade (mesmo padrão de Personagens: obrigatório, não único).
- **Imagem de referência** (`referenceImage`): URL opcional, mesmo padrão de campo já usado por
  Personagens (não usa o nome `referenceImageUrl`, usado por Campanha).
- **Nível** (`level`): número inteiro positivo, mínimo 1, sem máximo definido. Na criação, o
  backend sempre grava `1`, ignorando qualquer valor recebido do cliente nesse momento. É editável
  depois, via autosave, exclusivamente na página `/fichas/[id]`.
- **Campanha** (`campaign`): referência opcional a uma campanha. Chave estrangeira nullable. Ao
  excluir a campanha referenciada, a referência na ficha é definida como nula (`SET NULL`); a
  exclusão da campanha nunca é bloqueada por existirem fichas vinculadas a ela, e nenhuma ficha é
  excluída em cascata.
- **Raça** (`race`): referência opcional a uma raça. Mesmo comportamento de `campaign`: chave
  estrangeira nullable, `SET NULL` ao excluir a raça referenciada, sem bloquear a exclusão da raça
  e sem cascade de exclusão de fichas. Não há regra de visibilidade adicional sobre raças: o
  autocomplete de raça na ficha reaproveita o catálogo de raças já existente e visível a qualquer
  usuário autenticado (Google ou local), sem filtragem extra.
- **Dono da ficha**: toda ficha pertence ao usuário que a criou (usado para escopar a listagem e
  para a regra de acesso a `/fichas/[id]`).

### 3. Permissões e visibilidade de fichas

- O controller de fichas não usa `@GoogleAccess`. Usuários autenticados via Google podem criar,
  editar e excluir suas próprias fichas — exceção intencional ao padrão de acesso somente leitura
  ou bloqueado aplicado ao restante do sistema para usuários Google, pois fichas são uma área
  pessoal do jogador, não um recurso de mundo/campanha.
- **Listagem** (`GET` paginado de fichas): sempre escopada ao usuário autenticado. Tanto usuários
  Google quanto locais veem, na listagem, apenas as próprias fichas.
- **Acesso a uma ficha específica** (`GET`/`PUT`/`DELETE` em `/sheets/:id`), usado pela página
  `/fichas/[id]`:
  - Se o usuário autenticado é **local**: acesso total a QUALQUER ficha, independentemente de quem
    a criou. Pode visualizar, editar (autosave) e excluir qualquer ficha por esta rota.
  - Se o usuário autenticado é **Google**: acesso restrito às próprias fichas. Ao tentar acessar,
    editar ou excluir uma ficha que não é sua, a API responde com 404 ("ficha não encontrada ou não
    pertence ao usuário"), seguindo o mesmo padrão já usado em Campanhas.
- No frontend, ao receber 404 na página `/fichas/[id]`, o usuário é redirecionado para a listagem
  de fichas com um toast de erro, seguindo o mesmo padrão já usado na página de detalhes de
  Campanha.

### 4. Visibilidade de campanhas para fichas (consulta dedicada)

É criada uma consulta/endpoint dedicada (distinta da listagem padrão de `/campaigns`, que continua
bloqueada para Google) que retorna as campanhas visíveis ao usuário autenticado para uso em dois
lugares do frontend: o autocomplete de campanha do cadastro/edição de ficha, e o filtro por
campanha da listagem de fichas. Regra de visibilidade dessa consulta:

- Usuário **Google**: vê apenas campanhas em cuja lista de "Usuários Permitidos" (`allowedUsers`)
  ele está incluído.
- Usuário **local**: vê todas as campanhas, independentemente de quem as criou.

Essa regra vale igualmente para o filtro por campanha da listagem de fichas: todas as campanhas
visíveis ao usuário conforme a regra acima aparecem como opção de filtro, mesmo que ainda não
tenham nenhuma ficha cadastrada.

Esta consulta é a única forma de um usuário Google enxergar qualquer dado de campanha. Nenhuma
outra rota do módulo de campanhas (listagem, detalhe, sessões planejadas) é aberta para Google.

### 5. Campanha — Usuários Permitidos (`allowedUsers`)

O módulo de Campanhas ganha uma nova lista, `allowedUsers`, associando à campanha zero ou mais
usuários autenticados via Google. Regras:

- Apenas usuários com `provider = GOOGLE` podem ser adicionados a `allowedUsers`.
- Gerenciar essa lista (adicionar/remover usuários) é uma operação de edição da campanha, portanto
  permanece restrita ao usuário local dono da campanha — usuários Google continuam sem qualquer
  acesso de escrita ao módulo de Campanhas, inclusive à própria lista `allowedUsers` da campanha em
  que estão incluídos.
- Se um usuário Google presente em `allowedUsers` de uma ou mais campanhas for excluído do sistema,
  ele é simplesmente removido da(s) lista(s); a exclusão do usuário não é bloqueada e não afeta a
  campanha além dessa remoção.
- `allowedUsers` não concede nenhum acesso adicional às demais rotas do módulo de campanhas — seu
  único efeito é tornar a campanha visível ao usuário Google listado através da consulta dedicada
  descrita na seção 4 (autocomplete/filtro de campanha em fichas).

Para viabilizar a seleção de usuários Google ao editar essa lista, é criada uma consulta/endpoint
dedicada retornando usuários com `provider = GOOGLE`, buscável por nome ou e-mail, paginada,
acessível a qualquer usuário local (não é restrita ao dono de uma campanha específica, apenas exige
autenticação local).

### 6. Frontend — Menu

O item de menu "Fichas" é adicionado fora de qualquer seção com título (na primeira lista de itens,
sem cabeçalho de seção), imediatamente abaixo do item "Campanhas". É visível tanto para usuários
Google quanto para usuários locais (não deve ser incluído na lista de rotas bloqueadas para Google
usada hoje pelo componente de menu).

### 7. Frontend — Listagem de fichas (`/fichas`)

- Lista, com paginação, apenas as fichas do usuário autenticado (Google ou local).
- Possui filtro por campanha, usando a consulta dedicada descrita na seção 4 (todas as campanhas
  visíveis ao usuário, conforme a regra Google/local, independentemente de já terem fichas
  cadastradas).
- Cada ficha da listagem, ao ser aberta, abre a página `/fichas/[id]` em uma NOVA ABA (não navega na
  mesma aba).
- Possui um cadastro simplificado via modal, com os seguintes campos:
  - `name`: obrigatório.
  - `campaign`: opcional (autocomplete, usando a mesma consulta dedicada da seção 4).
  - `referenceImage`: opcional (URL).
  - `race` e `level` NÃO aparecem neste modal. `level` é sempre fixado em 1 pelo backend na
    criação; `race` só pode ser definida depois, na página `/fichas/[id]`.

### 8. Frontend — Página de edição (`/fichas/[id]`)

- Layout: à esquerda, uma imagem em formato retrato (preview da `referenceImage`) com um botão de
  edição que abre um modal contendo um input de URL para atualizar a imagem; a confirmação desse
  modal salva a imagem imediatamente (segue o padrão já existente de modais com ação explícita de
  salvar/cancelar usado no restante do sistema — não é regida pelo debounce de autosave descrito
  abaixo, que se aplica aos campos editados diretamente na página).
- Ao lado da imagem, na mesma linha: o campo `name`, sem label, em fonte grande e negrito; na
  extremidade oposta da mesma linha, o campo `level`, com label acima do campo.
- Abaixo dessa linha: o campo `campaign` (autocomplete, usando a mesma consulta dedicada da seção
  4, respeitando a regra Google/local de visibilidade de campanhas).
- Abaixo do campo `campaign`: o campo `race` (autocomplete, reaproveitando o catálogo de raças já
  existente, sem filtragem adicional por usuário/provider).
- Autosave: os campos `name`, `level`, `campaign` e `race` salvam automaticamente após uma pausa de
  2,5 segundos sem novas alterações naquele campo específico. Cada campo tem seu próprio timer de
  debounce, independente dos demais — uma alteração em um campo não cancela nem reinicia o timer de
  outro campo que esteja com uma alteração pendente. Exemplo: ao alterar `name` e, menos de 2,5
  segundos depois, alterar também `level`, ambos os campos são salvos de forma independente, cada
  um 2,5 segundos após a última alteração feita nele mesmo — a edição em `level` não adia nem
  cancela o salvamento pendente de `name`.
- Acesso: usuários locais podem visualizar, editar (autosave) e excluir qualquer ficha por esta
  rota, inclusive de outros usuários. Usuários Google só podem acessar a própria ficha; ao tentar
  acessar uma ficha de outro usuário, recebem 404 da API e são redirecionados para a listagem de
  fichas com um toast de erro.
- Inputs estilizados usados exclusivamente nesta página (ex.: campos com `variant="standard"`)
  ficam em uma pasta `components/` dentro da pasta da página dinâmica de ficha, nunca em
  `shared/components`.

### 9. Frontend — Formulário de campanha (Usuários Permitidos)

No formulário de cadastro/edição de campanha, é adicionado o campo "Usuários Permitidos"
(`allowedUsers`), posicionado logo abaixo do campo "Descrição". O campo é um autocomplete que busca
usuários Google (via a consulta dedicada da seção 5) para adicionar à lista, e cada usuário já
adicionado à lista pode ser removido individualmente. Esse campo só é exibido/editável para o
usuário local dono da campanha (usuários Google continuam sem qualquer acesso ao módulo de
Campanhas, incluindo este formulário).
