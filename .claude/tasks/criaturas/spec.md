# Spec: Criaturas

## Pedido original
Criar a funcionalidade de "Criaturas" no sistema, abrangendo backend (app-api) e
frontend (app-web), com os seguintes pontos solicitados:

- Nova entrada de navegação no Sidebar, dentro de uma seção "MUNDO", levando a uma
  página de listagem de Criaturas, seguindo o mesmo padrão visual e estrutural da
  página de Usuários (listagem paginada, filtros, ação de criar/editar via modal,
  ação de exclusão com confirmação).
- Na listagem, uma coluna "Imagem" que exibe a imagem de referência da criatura em
  um componente genérico de avatar circular clicável; ao clicar, abre um modal
  exibindo a imagem ampliada.
- O endpoint/DTO de listagem deve ser enxuto, retornando apenas os campos
  necessários para a tabela (id, imagem, nome, categoria).
- Reaproveitar (ou criar, caso não exista) um hook genérico `useGetEntityById`
  seguindo o mesmo padrão dos demais hooks genéricos de Queries
  (`useGetEntityList`, `usePostEntity`, `usePutEntity`, `useDeleteEntity`).
- Uma store de feature para a criatura selecionada (edição/exclusão), seguindo o
  mesmo padrão de `useSelectedUserStore`.
- Um formulário de criação/edição em modal (FormModal), usando `react-hook-form` +
  `zod`, contendo todos os campos da entidade Criatura.
- No backend, criação da entidade `Creature` e de uma entidade/tabela auxiliar
  `CreatureCategory`, populada via seed em migration com os 4 valores fixos:
  Animal, Monstro, Espírito, Construto.
- DTOs completos (create/update, response detalhado) e um DTO de resposta enxuto
  para a listagem.
- Controller e service com paginação, filtros e CRUD completo, incluindo um
  endpoint para listar as categorias de criatura disponíveis.
- Documentação completa via Swagger para os novos endpoints.
- Mensagens de erro e validação voltadas ao usuário em português (pt-BR).

Durante o esclarecimento, restavam em aberto: qual biblioteca/formato usar para
campos de texto rico (a entidade possui ~20 campos desse tipo), quais campos são
filtráveis na listagem, qual a ordenação padrão, se o nome da criatura deve ser
único, e como validar o campo de imagem de referência.

## Perguntas e respostas
- P: Qual biblioteca de rich text usar para os ~20 campos de texto rico da
  entidade, e como esse conteúdo deve ser tratado (componente e armazenamento)?
  → R: Tiptap (aceita a recomendação sugerida). O editor de texto rico deve ser um
  componente genérico em `app-web/src/shared/components/`, reutilizável nos ~20
  campos da entidade. O conteúdo é armazenado no backend como string HTML em uma
  coluna do tipo `text`.
- P: Quais campos devem ser filtráveis na listagem de Criaturas?
  → R: Nome (busca parcial) e Categoria (seleção exata via categoria auxiliar).
- P: Qual a ordenação padrão da listagem?
  → R: Alfabética por Nome, ordem crescente (A-Z).
- P: O nome da criatura deve ser único no sistema?
  → R: Sim. Deve ser impedido o cadastro de nomes duplicados, seguindo o mesmo
  padrão já usado para o e-mail em Usuários — retornando erro de conflito (409)
  com mensagem em pt-BR.
- P: O campo "Imagem Referência" é obrigatório? Que validação deve ter?
  → R: É opcional (não obrigatório). Quando preenchido, o valor deve ser
  validado como uma URL válida, rejeitando texto que não seja uma URL válida.

## Escopo confirmado

### Navegação e listagem (app-web)
- Novo item de navegação no Sidebar, agrupado em uma seção "MUNDO", apontando
  para uma página de listagem de Criaturas.
- A página de listagem segue o mesmo padrão estrutural e visual já usado na
  página de Usuários: tabela paginada, filtros, criação/edição via modal de
  formulário, exclusão com confirmação.
- Filtros disponíveis na listagem: Nome (busca parcial/texto) e Categoria
  (seleção exata a partir da lista de categorias de criatura).
- Ordenação padrão da listagem: por Nome, ordem alfabética crescente (A-Z).
- A listagem exibe uma coluna "Imagem", renderizada com um componente genérico de
  avatar circular clicável. Ao clicar na imagem, abre-se um modal exibindo a
  imagem ampliada.
- Os dados retornados para a listagem incluem apenas: id, imagem (URL de
  referência), nome e categoria.

### Formulário de criação/edição (app-web)
- Formulário em modal (FormModal), construído com `react-hook-form` e schema de
  validação `zod`, contendo todos os campos da entidade Criatura (incluindo os
  ~20 campos de texto rico e o campo de categoria).
- Os ~20 campos de texto rico usam um componente genérico de editor rich text
  (Tiptap), criado em `app-web/src/shared/components/`, reutilizável para todos
  esses campos.
- O campo "Imagem Referência" é opcional; quando preenchido, deve ser validado
  no formulário como uma URL válida, rejeitando valores que não sejam URLs
  válidas.
- O campo "Nome" é obrigatório e deve ser único; ao tentar salvar um nome já
  existente, o sistema deve exibir a mensagem de erro correspondente retornada
  pela API (em pt-BR).

### Infraestrutura de dados/hooks (app-web)
- Reaproveitamento dos hooks genéricos de Queries existentes
  (`useGetEntityList`, `usePostEntity`, `usePutEntity`, `useDeleteEntity`).
- Criação do hook genérico `useGetEntityById`, seguindo o mesmo padrão dos
  demais hooks de Queries, já que ele ainda não existe na base de código.
- Criação de uma store de feature para a criatura atualmente selecionada
  (edição/exclusão), seguindo o mesmo padrão da store equivalente de Usuários.

### Backend — modelo de dados (app-api)
- Nova entidade `Creature`, seguindo as convenções já usadas nas entidades
  existentes (chave primária UUID, campos de auditoria herdados da entidade
  base).
- Campos da entidade `Creature`:
  - Nome: texto, obrigatório, único (não pode haver duas criaturas com o mesmo
    nome).
  - Categoria: referência à entidade auxiliar `CreatureCategory`.
  - Imagem Referência: texto (URL), opcional; quando informado, deve ser uma
    URL válida.
  - Aproximadamente 20 campos de texto rico, armazenados como string HTML em
    colunas do tipo `text`.
- Nova entidade auxiliar `CreatureCategory`, representando as categorias
  disponíveis para uma criatura.
- Os 4 valores de categoria (Animal, Monstro, Espírito, Construto) são
  populados via seed executado em uma migration, não cadastrados manualmente
  pelo usuário final.

### Backend — API (app-api)
- Endpoints de CRUD completo para Criaturas (criar, listar com paginação e
  filtros, obter por id, atualizar, excluir).
- Endpoint de listagem paginada com suporte aos filtros de Nome (busca parcial)
  e Categoria (correspondência exata), e ordenação padrão por Nome (A-Z).
- Endpoint adicional para listar as categorias de criatura disponíveis
  (para popular o filtro/seleção no frontend).
- Ao tentar criar ou atualizar uma criatura com um nome já existente, a API
  retorna erro de conflito (HTTP 409) com mensagem em português.
- Ao informar um valor inválido no campo Imagem Referência (não sendo uma URL
  válida), a API retorna erro de validação com mensagem em português.
- DTOs de entrada (criação e atualização) contendo todos os campos da entidade,
  com as validações aplicáveis (nome obrigatório, categoria válida, imagem
  opcional e validada como URL quando informada, demais campos de texto rico).
- DTO de resposta completo, com todos os campos da entidade, para as operações
  de detalhe/criação/edição.
- DTO de resposta enxuto para a listagem, contendo apenas id, imagem, nome e
  categoria.
- Documentação Swagger completa para todos os novos endpoints (rotas, DTOs de
  entrada/saída, códigos de resposta, incluindo o cenário de conflito por nome
  duplicado).
- Todas as mensagens de erro e validação voltadas ao usuário são escritas em
  português (pt-BR).
