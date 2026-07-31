# Spec: Atributo chave em Perícias

## Pedido original
Adicionar a propriedade "atributo chave" à entidade de Perícias (app-api
`src/modules/skills`, entidade `Skill`; app-web `src/app/(authorized)/pericias`),
como relação com uma nova tabela auxiliar genérica de "atributos".

## Perguntas e respostas

- P: Qual o nome da propriedade/entidade e como ela deve ser modelada (exclusiva
  de Perícias ou genérica)?
  → R: Propriedade `keyAttribute` na entidade `Skill` (coluna `key_attribute_id`).
  Nova entidade `Attribute`, em módulo próprio `src/modules/attributes`, tabela
  `attributes`. A entidade é genérica/reaproveitável por outras entidades no
  futuro — não deve ser modelada como algo exclusivo de Perícias; por isso possui
  módulo e endpoint próprios, e não aninhados sob `/skills`.

- P: O `keyAttribute` é obrigatório ou opcional no cadastro/edição de Perícias?
  → R: Obrigatório, seguindo exatamente o padrão de `categoryId` em Raças
  (relação obrigatória no back, validação de preenchimento no schema do front).

- P: Qual o escopo de CRUD para `attributes`?
  → R: Apenas listagem. Endpoint próprio `GET /attributes` retornando a lista de
  atributos. Sem criação, edição ou exclusão via API, e sem tela de
  gerenciamento no front. Os valores são fixos e vêm de uma migration de seed.

- P: Quais valores devem ser semeados na tabela `attributes`?
  → R: "Força", "Destreza", "Constituição", "Inteligência", "Sabedoria" e
  "Carisma", inseridos via migration de dados (mesmo padrão da migration de
  precedente que insere a categoria "Elemental" em `creature_categories`).

- P: Onde o atributo chave deve ser exibido no front?
  → R: Tanto na visualização detalhada da perícia quanto na linha da listagem
  de perícias.

- P: É necessário filtro por atributo chave na listagem de Perícias?
  → R: Sim, seguindo o mesmo padrão já usado para o filtro de categoria em
  Raças (filtro por seleção exata de um valor da lista de atributos).

- P: Onde o campo "atributo chave" deve ficar no formulário de cadastro/edição
  de Perícias?
  → R: Ao lado do campo de tags, na mesma linha/grid do formulário, usando
  componente de seleção única (autocomplete) integrado ao formulário — mesmo
  padrão usado para o campo de categoria no formulário de Raças.

- P: Como o front deve consumir o endpoint `GET /attributes` (hook dedicado,
  seguindo o padrão usado para `/races/categories`, `/creatures/categories` e
  `/divinities/categories`, ou o hook genérico de listagem já usado para
  recursos paginados como `/tags`)?
  → R (definida por análise dos padrões existentes no código): o hook genérico
  de listagem do projeto assume que a resposta da API é sempre paginada (com
  `data`, `total`, `page`, `perPage`), formato que é usado por recursos como
  `/tags` e pelas listagens principais (`/skills`, `/races`, etc.). Já os
  endpoints de listas auxiliares simples e não paginadas — como o já existente
  `GET /races/categories` — são consumidos por hooks dedicados próprios para
  cada recurso. Como `GET /attributes` também deve retornar uma lista simples,
  não paginada (mesmo formato de `GET /races/categories`), seu consumo no front
  deve seguir o padrão de hook dedicado (o mesmo já aplicado para as categorias
  de raças, criaturas e divindades), e não o hook genérico de listagem
  paginada.

## Escopo confirmado

A entidade de Perícias passa a ter uma propriedade de relação obrigatória
`keyAttribute`, apontando para uma nova entidade genérica `Attribute`
(tabela `attributes`), criada em módulo próprio e independente do módulo de
Perícias, para permitir reuso futuro por outras entidades do sistema.

A tabela `attributes` é populada por uma migration de seed com os seis valores
fixos: Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma. Não
há operações de criação, edição ou exclusão de atributos — apenas um endpoint
de listagem simples (`GET /attributes`), sem paginação, sem tela de
gerenciamento dedicada no front.

No cadastro e na edição de Perícias, o atributo chave é obrigatório (mesmo
tratamento de obrigatoriedade hoje aplicado à categoria de Raças, tanto na
validação do backend quanto na validação do formulário do frontend), e seu
campo de seleção fica posicionado ao lado do campo de tags no formulário.

O atributo chave da perícia é exibido tanto na visualização detalhada de uma
perícia quanto na linha correspondente na listagem de perícias.

A listagem de Perícias ganha um filtro adicional por atributo chave, com
comportamento equivalente ao filtro por categoria já existente na listagem de
Raças (seleção de um valor entre os atributos cadastrados, filtrando por
igualdade exata).

No frontend, a lista de atributos disponíveis para seleção (usada no
formulário de Perícias e no filtro da listagem) é obtida a partir de um hook
dedicado a esse recurso — seguindo o mesmo padrão já usado pelos hooks
dedicados de categorias (raças, criaturas, divindades) — e não pelo hook
genérico de listagem paginada, já que o endpoint de atributos retorna uma
lista simples e não paginada.
