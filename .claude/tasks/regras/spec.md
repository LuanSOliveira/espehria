# Spec: Regras

## Pedido original
Criar entidade e página "Regras" (Rule) full-stack (app-api + app-web), com os campos `name` (string, obrigatório) e `description` (rich text, opcional), além de seções extras dinâmicas ("Adicionar Seção") replicando fielmente o padrão já existente em "Locais" (`LocationSection`: `label` obrigatório + `description` rich text opcional + `order`, relação OneToMany com cascade, sem reordenação, sem limite de quantidade). CRUD completo (criar, listar com paginação e filtro por nome, visualizar, editar, deletar), com permissão de acesso somente leitura para usuários Google (seguindo o padrão `api-permissao-google-readonly` / `web-permissao-google-readonly`). Textos de interface e mensagens de erro em pt-BR; nomes de propriedades em inglês. A página deveria ficar em uma seção "JOGO" do menu lateral, antes do item "Mundo", e "Regras" deveria ser incluída na busca global.

## Perguntas e respostas
- P: A demanda pede a página na seção "JOGO" do menu lateral, antes do item "Mundo", mas essa seção não existe hoje e "Mundo" é título de seção, não item. Qual a intenção? → R: Criar uma nova seção de menu com título "JOGO" contendo apenas o item "Regras", posicionada imediatamente acima da seção "Mundo" existente (referência de convenção: `NAV_SECTIONS` do Sidebar do app-web). A rota deve ser centralizada na constante de rotas privadas do projeto, sem hardcode de path.
- P: "Incluir Regras na busca global" significa incluir `rule` no fluxo de menções `@` do rich text no app-web? → R: Não. Nada do consumo de busca no app-web deve ser alterado — não alterar o autocomplete de menções `@`, a lista de sugestões, a visualização/dispatcher de menções de entidade, os rótulos de tipos de menção, as URLs de detalhe por tipo de menção, nem os tipos de menção visualizáveis. O escopo de busca fica restrito ao backend: registrar "Regras" no agregador/serviço de busca da API (e nos artefatos correspondentes de enum/módulo/DTO), apenas para manter a consistência do agregador de busca da API.
- P: O campo `name` deve ser único? → R: Sim. Constraint de unicidade no banco de dados, seguindo a mesma convenção já usada em Locais/Raças/Eras/Organizações/Tags, retornando erro de conflito (409) com mensagem em pt-BR ao tentar cadastrar/editar para um nome duplicado.

## Escopo confirmado

### Modelagem
- Nova entidade `Rule` com campo `name` (string, obrigatório, único) e `description` (rich text, opcional).
- Nova entidade de seção associada (`RuleSection`), espelhando fielmente a estrutura de `LocationSection`: `label` (obrigatório), `description` (rich text, opcional) e `order`, em relação OneToMany com `Rule` com cascade, sem funcionalidade de reordenação e sem limite de quantidade de seções.

### Escopo de backend (app-api)
- CRUD completo de Regras (rota equivalente a `/rules`): criação, listagem paginada com filtro por nome, busca por id, atualização e exclusão.
- Migrations correspondentes à nova entidade e sua tabela de seções, incluindo a constraint de unicidade em `name`.
- Erro de conflito (409) com mensagem em pt-BR ao violar a unicidade de `name`.
- Registro de "Regras" no agregador/serviço de busca da API (search service/controller e artefatos correlatos de enum/módulo/DTO), sem qualquer alteração no consumo de busca do app-web.
- Aplicação da permissão de acesso somente leitura para usuários Google no módulo de Regras, seguindo o mesmo padrão de permissão já usado nos demais módulos (equivalente a `api-permissao-google-readonly`).

### Escopo de frontend (app-web)
- Nova seção de menu lateral intitulada "JOGO", contendo apenas o item "Regras", posicionada imediatamente acima da seção "Mundo" já existente.
- Rota de Regras centralizada na constante de rotas privadas do projeto (sem path hardcoded em componentes).
- Página de listagem paginada de Regras com filtro por nome e ações de visualizar, editar e excluir.
- Formulário de criação/edição com os campos `name`, `description` (rich text) e seções dinâmicas ("Adicionar Seção"), seguindo o mesmo padrão visual e de comportamento já usado no formulário de Locais.
- Modal de visualização de Regra com: nome centralizado no topo, descrição ocupando toda a largura do modal, e seções exibidas abaixo seguindo o padrão visual já usado em Locais; seções vazias (sem seções cadastradas) devem ser omitidas da visualização.
- Ações de criar, editar e excluir devem ficar ocultas para usuários autenticados via Google (permissão somente leitura), seguindo o mesmo padrão de verificação já usado em outras telas (equivalente ao hook `useIsGoogleUser`).
- Textos de interface e mensagens de erro em português (pt-BR); nomes de propriedades/campos em inglês.

### Fora de escopo (explicitamente excluído)
- Nenhuma alteração no fluxo de menções `@` do rich text do app-web: não alterar autocomplete de sugestões de menção, a visualização/dispatcher de menções de entidade, os rótulos de tipos de menção, o mapeamento de URLs de detalhe por tipo de menção, nem a lista de tipos de menção visualizáveis. A inclusão de Regras na busca fica restrita ao backend (agregador de busca da API).
