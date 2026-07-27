# Spec: Personagens e Organizações

## Pedido original
Criar as novas páginas "Personagens" e "Organizações", ambas na seção "MUNDO" do menu de navegação.

A página de "Personagens" deve conter listagem com filtro por nome, e cada item da lista deve ter opções de visualizar, editar e deletar.

A entidade "Personagem" deve ter os campos: Imagem Referência (texto/URL), Nome (obrigatório), Tags (input padrão de tags), Morto? (checkbox, padrão desmarcado), Raça (autocomplete carregado da listagem de "raças"), Descrição (campo com controle de formatação de texto) e Parentesco. O campo Parentesco deve usar um Autocomplete que lista os personagens já cadastrados e um input de texto livre para o grau de parentesco, mais um botão de adicionar; ao adicionar, surge um card numa lista com o nome do personagem e o parentesco informado, com opções de excluir, editar e visualizar — excluir remove o parentesco da lista, editar habilita a edição do parentesco, visualizar abre o modal de visualização do personagem selecionado.

Campos com "*" são obrigatórios; propriedades devem ser nomeadas em inglês.

O modal de visualização de Personagem deve mostrar: imagem em formato retrato; ao lado, nome do personagem (com ícone de caveira ao lado se "morto" for true), abaixo tags, abaixo a raça; abaixo da seção de imagem, o quadro de descrição; abaixo, o quadro de parentescos (cada card com opção de visualizar, que abre o modal do personagem referenciado); ao lado do quadro de parentescos, o quadro de organizações (as informações de organização serão descritas a seguir; cada card com opção de visualizar, que abre o modal da organização referenciada).

A entidade "Organização" deve ter os campos: Imagem Referência (texto/URL), Nome (obrigatório), Tags (input padrão de tags), Descrição (campo com controle de formatação de texto) e Membros. O campo Membros deve usar um Autocomplete que lista os personagens já cadastrados e um input de texto livre para a função na organização, mais um botão de adicionar; ao adicionar, surge um card numa lista com o nome do personagem e a função informada, com opções de excluir, editar e visualizar — excluir remove o membro da lista, editar habilita a edição da função, visualizar abre o modal de visualização do personagem selecionado.

Campos com "*" são obrigatórios; propriedades devem ser nomeadas em inglês.

O modal de visualização de Organização deve mostrar: imagem em formato quadrado; ao lado, nome da organização, abaixo dele as tags; abaixo da seção de imagem, o quadro de descrição; abaixo, o quadro de membros (cada card com opção de visualizar, que abre o modal do personagem referenciado).

Deve ser desenvolvido o CRUD completo das duas entidades, e a dinâmica de busca global (`search.controller`, tanto em app-api quanto em app-web) deve ser atualizada para incluir as novas entidades.

## Perguntas e respostas
Todas as ambiguidades identificadas nesta demanda foram esclarecidas previamente com o usuário, fora do fluxo padrão de perguntas deste agente. As decisões abaixo são autoritativas e substituem a etapa de perguntas/respostas:

- P: O parentesco cadastrado em um personagem gera automaticamente o vínculo inverso no personagem referenciado? → R: Não. O parentesco é unidirecional. Cadastrar "B é pai de A" no personagem A não cria vínculo inverso automático em B, pois o rótulo é texto livre e o inverso não é derivável (ex.: "pai" não implica "filho" automaticamente). Se o vínculo nos dois sentidos for desejado, deve ser cadastrado manualmente em cada personagem.
- P: Pode haver duplicidade do mesmo personagem na lista de parentescos de um personagem, ou do mesmo personagem na lista de membros de uma organização? → R: Não. Deve ser bloqueada a duplicidade: um único registro por par (personagem, parente) e um único registro por par (organização, personagem). A validação deve existir tanto no backend quanto ser impedida na UI.
- P: O que ocorre com os vínculos de parentesco e de participação em organizações quando um personagem é excluído? A exclusão deve ser bloqueada se o personagem estiver referenciado? → R: A exclusão de um personagem nunca é bloqueada por estar referenciado. Ao excluir, as linhas de junção que o referenciam são removidas em cascata automaticamente: os parentescos em que ele é o "parente" de terceiros, os parentescos do próprio personagem, e suas participações (membros) em organizações.
- P: Ao clicar em "editar" num card de parentesco ou de membro, o que pode ser alterado — apenas o texto livre ou também o personagem referenciado? → R: Apenas o texto livre (o grau de parentesco ou a função). O personagem referenciado no card permanece fixo; para trocar o personagem, o card deve ser excluído e um novo adicionado.
- P: O nome de Personagem e o nome de Organização devem ser únicos, seguindo o padrão de Race/Divinity/Location? → R: Assimétrico e confirmado explicitamente. `Organization.name` é único (índice único, mesmo padrão de Race/Divinity/Location). `Character.name` não é único — homônimos são legítimos num mundo de RPG.
- P: A exclusão de uma raça em uso por personagens deve ser bloqueada? → R: Não, é permitida. A FK de raça no personagem usa `ON DELETE SET NULL` (a raça é um campo opcional/nullable no personagem), diferentemente do `RESTRICT` usado em `Divinity.category`, que é um campo obrigatório.
- P: A listagem de Organizações segue o mesmo padrão de filtro e ações da listagem de Personagens? → R: Sim. Filtro por nome e ações de visualizar, editar e excluir em cada item, igual à listagem de Personagens.

## Escopo confirmado

### Regras de negócio gerais
1. Parentesco é unidirecional: um vínculo cadastrado em um personagem não gera automaticamente o vínculo inverso no personagem referenciado.
2. Não é permitida duplicidade: um mesmo personagem não pode aparecer mais de uma vez na lista de parentescos de um mesmo personagem, nem um mesmo personagem pode aparecer mais de uma vez na lista de membros de uma mesma organização. Essa regra deve ser garantida tanto na validação do backend quanto impedida proativamente na interface (ex.: excluindo da lista de opções do autocomplete os personagens já adicionados).
3. Ao excluir um personagem, todos os vínculos de junção que o referenciam são removidos automaticamente (em cascata), incluindo: parentescos em que ele é o parente de outro personagem, parentescos do próprio personagem, e participações dele como membro de organizações. A exclusão de um personagem nunca é bloqueada por ele estar referenciado em outros cadastros.
4. Editar um card de parentesco ou de membro altera apenas o texto livre associado (grau de parentesco ou função). O personagem referenciado é imutável nesse fluxo; para associar outro personagem, o card deve ser removido e um novo adicionado.
5. Nome de Organização é único no cadastro. Nome de Personagem não é único (permite homônimos).
6. Excluir uma raça que esteja associada a personagens é permitido; a referência do personagem para a raça é desfeita (campo de raça do personagem passa a vazio), sem bloquear a exclusão da raça.
7. O quadro "Organizações" exibido no modal de visualização de Personagem é derivado da participação do personagem em organizações (via vínculos de membros) e é somente leitura nesse contexto — o cadastro/formulário de Personagem não possui campo próprio de organizações; o vínculo é sempre criado a partir do cadastro da Organização (campo Membros).

### Entidade Personagem (Character)
Campos do cadastro:
- `referenceImage` — texto (URL), opcional.
- `name` — texto, obrigatório, não único.
- `tags` — associação com Tags (múltipla), opcional.
- `isDead` — booleano, obrigatório com valor padrão `false` (checkbox desmarcado por padrão).
- `race` — associação com Raça (opcional/nullable), selecionada a partir da listagem existente de raças.
- `description` — texto com suporte a formatação (rich text/HTML), opcional.
- `kinships` — lista de vínculos de parentesco (ver "Relacionamento de parentesco" abaixo).

Relacionamento de parentesco:
- Estrutura de junção própria (não é ManyToMany simples), pois carrega um atributo textual livre por vínculo.
- Cada registro de parentesco associa o personagem "dono" do cadastro, um personagem "parente" (referenciado) e um texto livre com o grau/tipo de parentesco.
- Vínculo unidirecional: pertence apenas ao personagem em cujo cadastro foi criado.
- Não pode haver dois registros de parentesco com o mesmo par (personagem dono, personagem parente).
- Ao excluir o personagem dono, os registros de parentesco dele são removidos. Ao excluir o personagem que é referenciado como "parente" em vínculos de terceiros, esses registros também são removidos (cascata em ambos os lados da relação).

Quadro de Organizações do personagem (somente leitura, calculado):
- Lista as organizações das quais o personagem participa como membro, derivada da relação de membros da entidade Organização. Não é um campo do formulário de Personagem.

### Entidade Organização (Organization)
Campos do cadastro:
- `referenceImage` — texto (URL), opcional.
- `name` — texto, obrigatório, único.
- `tags` — associação com Tags (múltipla), opcional.
- `description` — texto com suporte a formatação (rich text/HTML), opcional.
- `members` — lista de vínculos de participação (ver "Relacionamento de membros" abaixo).

Relacionamento de membros:
- Estrutura de junção própria (não é ManyToMany simples), pois carrega um atributo textual livre por vínculo.
- Cada registro de membro associa a organização, um personagem referenciado e um texto livre com a função exercida na organização.
- Não pode haver dois registros de membro com o mesmo par (organização, personagem).
- Ao excluir a organização, os registros de membros dela são removidos. Ao excluir um personagem que é membro de organizações, os registros de participação dele são removidos.

### Comportamento dos modais de visualização

**Modal de visualização de Personagem:**
- Imagem de referência exibida em formato retrato (proporção vertical), com estado vazio equivalente ao já usado em outras entidades (ex.: Divindade) quando não há imagem.
- Ao lado da imagem: nome do personagem; se `isDead` for `true`, um ícone de caveira é exibido ao lado do nome; abaixo do nome, as tags; abaixo das tags, a raça (quando houver).
- Abaixo da seção de imagem/identificação: quadro da descrição.
- Abaixo da descrição: quadro de parentescos, listando cada vínculo com o nome do personagem parente e o grau de parentesco; cada item possui ação de visualizar, que abre o modal de visualização do personagem parente.
- Ao lado do quadro de parentescos: quadro de organizações (derivado, somente leitura), listando as organizações das quais o personagem é membro; cada item possui ação de visualizar, que abre o modal de visualização da organização correspondente.

**Modal de visualização de Organização:**
- Imagem de referência exibida em formato quadrado, com estado vazio equivalente ao já usado em outras entidades quando não há imagem.
- Ao lado da imagem: nome da organização; abaixo do nome, as tags.
- Abaixo da seção de imagem/identificação: quadro da descrição.
- Abaixo da descrição: quadro de membros, listando cada vínculo com o nome do personagem e a função exercida; cada item possui ação de visualizar, que abre o modal de visualização do personagem correspondente.

### Listagens
- Página "Personagens": listagem paginada com filtro por nome; cada item com ações de visualizar, editar e excluir.
- Página "Organizações": mesmo padrão — listagem paginada com filtro por nome; cada item com ações de visualizar, editar e excluir.
- Ambas as páginas ficam na seção "Mundo" do menu de navegação lateral, junto às páginas já existentes (Criaturas, Divindades, Locais, Raças).

### CRUD completo
- Personagem: criação, listagem paginada com filtro por nome, obtenção por id (para visualização/edição), atualização e exclusão (com cascata nas junções conforme regras acima).
- Organização: criação, listagem paginada com filtro por nome, obtenção por id, atualização e exclusão (com cascata nos membros).
- Nos formulários de criação/edição de Personagem e Organização, o formulário do card de parentesco/membro (autocomplete de personagem + texto livre + botão adicionar) mantém a lista em memória no estado do formulário até o salvamento — a persistência dos vínculos ocorre junto com o salvamento da entidade dona (mesmo padrão hoje usado para seções e pontos de interesse de Local).

### Busca global (Search)
- **app-api**: o enum de tipos de entidade linkável e o serviço de busca (que hoje iteram User, Creature, Tag, Location, Race, Era, Event, Divinity fazendo `name ILIKE`) devem passar a incluir também Character e Organization, seguindo o mesmo padrão de busca por nome e mesmo limite de resultados já aplicado às demais entidades.
- **app-web**: o registro entityType → componente de visualização (usado para abrir o modal de detalhes a partir de um resultado de busca ou de uma menção/card) deve passar a incluir entradas para os novos tipos de entidade (personagem e organização), reaproveitando os mesmos modais de visualização construídos para as páginas de Personagens e Organizações.

### Divisão de escopo entre app-api e app-web
**app-api:**
- Módulos `characters` e `organizations`, cada um com entidade, DTOs de criação/atualização/resposta/listagem paginada, controller e service, seguindo os mesmos padrões já estabelecidos nos módulos existentes (ex.: Divinity, Location).
- Entidades de junção próprias para parentesco (personagem + parente + texto livre) e para membros de organização (organização + personagem + texto livre), com as regras de unicidade de par e comportamento de exclusão em cascata descritos acima.
- Tags associadas via ManyToMany com tabela de junção dedicada para cada entidade, no mesmo padrão já usado pelas demais entidades linkáveis a tags.
- Atualização do módulo de busca (enum de tipos linkáveis e serviço de busca) para contemplar as duas novas entidades.
- Migrations para as novas tabelas e relacionamentos.

**app-web:**
- Páginas "Personagens" e "Organizações" (listagem com filtro por nome e ações de visualizar/editar/excluir), seguindo o padrão de página já usado pelas entidades existentes.
- Formulários de criação/edição de Personagem e Organização, incluindo os campos de tags, imagem, descrição (com editor de texto formatado) e os campos de vínculo (parentesco / membros) com autocomplete de personagem + texto livre + botão de adicionar + lista de cards com ações de editar (apenas o texto livre), excluir e visualizar.
- Modais de visualização de Personagem e de Organização, no leiaute descrito acima.
- Inclusão dos itens "Personagens" e "Organizações" na seção "Mundo" do menu de navegação lateral, e das respectivas rotas centralizadas nos arquivos de rotas do app.
- Atualização do dispatcher de visualização de entidades da busca global para registrar os novos tipos de entidade e seus respectivos componentes de visualização.
