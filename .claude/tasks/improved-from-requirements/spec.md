# Spec: Aprimorado de / Requisitos (Treinamentos, Talentos, Técnicas, Magias)

## Pedido original

Demanda (app-api + app-web), envolvendo as entidades "treinamentos", "talentos", "técnicas" e "magias":

Adicionar duas novas propriedades a essas quatro entidades, com nomes em inglês:
- "improvedFrom" (Aprimorado de)
- "requirements" (Requisitos)

Regras de negócio:
- Nenhuma das duas propriedades é obrigatória.
- Ambas são listagens (relacionamentos many-to-many, provavelmente auto-referenciáveis já que podem apontar para qualquer uma das quatro entidades: treinamentos, talentos, técnicas ou magias) que armazenam referências para itens de qualquer uma dessas 4 entidades (ou seja, um "treinamento" pode ter em "Aprimorado de" ou "Requisitos" referências a outros treinamentos, talentos, técnicas ou magias, e o mesmo vale para as outras 3 entidades). Definir o modelo de dados adequado no backend para suportar referências cruzadas entre essas 4 entidades distintas (isso pode exigir uma tabela de junção polimórfica ou uma entidade de relacionamento dedicada, já que são 4 entidades diferentes podendo referenciar uma a outra nos dois campos).

Comportamento no formulário de cadastro/edição (app-web) das 4 entidades:
- Abaixo do botão "adicionar seção" (já existente no formulário), devem aparecer lado a lado duas novas seções/quadros:
  - Uma para "Aprimorado de", com botão "Adicionar Aprimorado de" e um quadro listando os itens já adicionados.
  - Uma para "Requisitos", com botão "Adicionar Requisitos" e um quadro listando os itens já adicionados.
- Ao clicar em qualquer um dos botões, abre um modal de seleção contendo:
  - 4 abas: "Treinamentos", "Talentos", "Técnicas", "Magias".
  - Abaixo das abas, um campo de filtro por nome.
  - Abaixo do filtro, uma listagem PAGINADA da entidade correspondente à aba selecionada (ex.: aba "Treinamentos" lista a entidade treinamentos, usando os hooks/paginação já padrão do projeto).
  - Cada item da listagem mostra o nome da entidade e dois botões de ação: "visualizar" (abre o modal de visualização já existente daquela entidade) e "adicionar" (adiciona o item à lista correspondente — "Aprimorado de" ou "Requisitos" — do formulário que abriu o modal).
- Após adicionado, o item aparece no quadro da respectiva seção do formulário com: nome, ação de visualizar, e ação de remover da lista.
- Esse mesmo modal de seleção (com as 4 abas) deve ser reutilizável tanto para "Aprimorado de" quanto para "Requisitos" em qualquer uma das 4 páginas de entidade.

Comportamento no modal de visualização (app-web) das 4 entidades:
- Adicionar dois novos quadros: "Aprimorado de" e "Requisitos".
- Cada quadro apresenta os itens da respectiva lista como cards.
- Cada card tem uma ação de "visualizar", que abre o modal de visualização já existente da entidade referenciada naquele card (pode ser de qualquer uma das 4 entidades).

Contexto: NestJS 11 + TypeORM + PostgreSQL no app-api, Next.js 16 + React 19 + MUI no app-web. As entidades já existem. Reaproveitar padrões já estabelecidos.

## Perguntas e respostas

- P: O recurso de "seções" citado no pedido ("abaixo do botão adicionar seção") existe hoje nas 4 entidades, ou deve ser criado como parte desta demanda? → R: As 4 entidades não têm hoje o recurso de seção e não devem ganhar. Implementar apenas os 2 quadros novos ("Aprimorado de" e "Requisitos"), sem adicionar recurso de seções. O botão "Adicionar Seção" citado no pedido original é apenas referência de padrão visual/posicionamento vindo de outras telas, não algo a replicar aqui.
- P: Quais regras de validação de referência devem ser aplicadas (autorreferência, duplicidade na mesma lista, item presente nas duas listas simultaneamente)? → R: Todas bloqueadas — autorreferência bloqueada, duplicidade na mesma lista bloqueada, e o mesmo item não pode estar simultaneamente em "Aprimorado de" e "Requisitos" do mesmo registro.
- P: O que acontece quando um item referenciado em "Aprimorado de"/"Requisitos" de outros registros é excluído? → R: Remover a referência em cascata — a exclusão do item segue normalmente e as referências a ele em outros registros são removidas automaticamente.
- P: O modal de seleção deve ocultar itens já presentes na lista atual do formulário aberto? → R: Sim, ocultar da listagem paginada os itens que já estão na lista atual do formulário aberto (UX mais limpa + reforço da validação de duplicidade).
- P: A relação deve ser bidirecional (refletir "isto é requisito de X" no item referenciado)? → R: Não, relação unidirecional, sem refletir no item referenciado.
- P: Há alguma regra de permissão/visibilidade adicional além do CRUD já existente dessas 4 entidades? → R: Não, aplicar apenas as permissões de CRUD já existentes (usuário Google bloqueado de criar/editar), sem regra de visibilidade adicional.

## Escopo confirmado

### Escopo geral

As entidades Treinamento (`Training`), Talento (`Talent`), Técnica (`Technique`) e Magia (`Spell`) passam a ter duas novas propriedades, ambas opcionais:
- "Aprimorado de" (`improvedFrom`)
- "Requisitos" (`requirements`)

Cada uma dessas propriedades é uma lista de referências a itens de qualquer uma das 4 entidades acima (um treinamento pode referenciar outros treinamentos, talentos, técnicas ou magias em "Aprimorado de" ou "Requisitos", e o mesmo vale simetricamente para as outras 3 entidades).

### Regras de negócio confirmadas

1. Nenhuma das duas propriedades é obrigatória; um registro pode não ter nenhum item em nenhuma delas.
2. Um item não pode aparecer na própria lista de "Aprimorado de" ou "Requisitos" dele mesmo (autorreferência bloqueada).
3. Um mesmo item não pode aparecer duas vezes na mesma lista ("Aprimorado de" ou "Requisitos") do mesmo registro (duplicidade bloqueada).
4. Um mesmo item não pode estar simultaneamente em "Aprimorado de" e em "Requisitos" do mesmo registro.
5. A relação é unidirecional: adicionar um item X em "Aprimorado de"/"Requisitos" de um registro Y não cria nem exibe automaticamente qualquer relação inversa em X (ex.: X não passa a exibir "é requisito de Y").
6. Quando um item referenciado por outros registros (em "Aprimorado de" ou "Requisitos") é excluído, a exclusão do item ocorre normalmente e todas as referências a ele em outros registros são removidas automaticamente (cascata), sem impedir a exclusão e sem deixar referências quebradas.
7. Não há regra de visibilidade ou permissão adicional além das permissões de CRUD já existentes para as 4 entidades (usuário autenticado via Google já é bloqueado de criar/editar; essa regra já existente permanece a única aplicável — inclusive para as ações de adicionar/remover itens de "Aprimorado de"/"Requisitos", que fazem parte da criação/edição do registro).

### Comportamento no formulário de cadastro/edição (app-web)

Nas telas de cadastro/edição das 4 entidades, devem existir dois novos quadros lado a lado: "Aprimorado de" e "Requisitos" (sem introduzir qualquer recurso de "seções"; a referência a "adicionar seção" no pedido original era apenas indicação de posicionamento visual vindo de outras telas do sistema e não deve ser implementada aqui).

Cada quadro contém:
- Um botão de ação para abrir o modal de seleção ("Adicionar Aprimorado de" / "Adicionar Requisitos").
- A listagem dos itens já adicionados àquela lista, cada um exibindo: nome do item, ação de visualizar (abre o modal de visualização já existente da entidade correspondente) e ação de remover da lista (remoção local, dentro do formulário em edição, sujeita a confirmação de salvamento do formulário como um todo, seguindo o padrão já usado para campos de lista no restante do formulário).

O modal de seleção, reutilizável entre "Aprimorado de" e "Requisitos" e entre as 4 páginas de entidade, contém:
- 4 abas: "Treinamentos", "Talentos", "Técnicas", "Magias".
- Um campo de filtro por nome abaixo das abas.
- Uma listagem paginada da entidade correspondente à aba selecionada, reaproveitando os hooks/endpoints de listagem paginada com filtro por nome já existentes para cada uma das 4 entidades (uma chamada por aba selecionada).
- A listagem paginada deve ocultar os itens que já estão presentes na lista atual (a lista do quadro que originou a abertura do modal: "Aprimorado de" ou "Requisitos" do formulário em edição/criação) — tanto para reforçar visualmente a regra de não duplicidade quanto para evitar tentativas inválidas de adição.
- Cada item da listagem tem: nome, ação de "visualizar" (abre o modal de visualização já existente daquela entidade, reaproveitando o dispatcher de visualização por `entityType` já existente) e ação de "adicionar" (adiciona o item à lista do quadro que abriu o modal, respeitando as regras de bloqueio de autorreferência, duplicidade e exclusividade entre as duas listas).
- Ao tentar adicionar um item que viole alguma das regras de bloqueio (autorreferência, duplicidade, presença simultânea nas duas listas), a ação deve ser impedida com feedback ao usuário em pt-BR.

### Comportamento no modal de visualização (app-web)

Nas telas de visualização das 4 entidades, devem existir dois novos quadros: "Aprimorado de" e "Requisitos", exibindo os itens da respectiva lista como cards. Cada card exibe o nome do item e uma ação de "visualizar", que abre o modal de visualização já existente da entidade referenciada (reaproveitando o mesmo dispatcher de visualização por `entityType`), independentemente de qual das 4 entidades o item referenciado pertence.

### Requisitos para a etapa de planejamento do backend (app-api) — decisão de modelagem em aberto

O usuário delegou explicitamente a escolha do modelo de dados que sustenta essas referências cruzadas. A etapa de planejamento (`planejamento-api`) deve decidir a modelagem concreta, mas ela precisa satisfazer os seguintes requisitos funcionais, levantados nesta investigação:

1. Suportar referência cruzada entre as 4 entidades distintas (`Training`, `Talent`, `Technique`, `Spell`) em ambos os campos (`improvedFrom` e `requirements`) — ou seja, qualquer uma das 4 entidades pode ter, em qualquer um dos dois campos, itens de qualquer uma das 4 entidades (incluindo a própria, exceto autorreferência ao mesmo registro).
2. Suportar a exclusão em cascata das referências quando o item referenciado é excluído (regra de negócio 6 acima). Ponto de atenção levantado nesta investigação: uma modelagem baseada em coluna polimórfica pura (`targetType` + `targetId` sem chave estrangeira de banco) não permite `ON DELETE CASCADE` no nível do banco, exigindo limpeza manual das referências na camada de aplicação; uma modelagem com colunas de chave estrangeira anuláveis por tipo (uma coluna FK por entidade possível, com `ON DELETE CASCADE`) preserva integridade referencial no próprio banco. Esse trade-off deve ser considerado como critério de decisão pelo planejamento, sem que este spec feche qual das duas (ou outra alternativa) deve ser usada.
3. Suportar, na camada de validação (criação/edição), as regras de negócio 2, 3 e 4 (bloqueio de autorreferência, de duplicidade na mesma lista e de presença simultânea nas duas listas do mesmo registro), retornando mensagens de erro em pt-BR consistentes com o padrão já usado nas 4 entidades (ex.: `ConflictException`/`BadRequestException` com mensagem em português).
4. Ao ler um registro (endpoint de detalhe), a API deve retornar, para cada item das listas `improvedFrom` e `requirements`, ao menos `id`, `name` e `entityType` (usando os mesmos valores em minúsculo já usados pela convenção existente do endpoint `/search` e do dispatcher de views do frontend — ex.: `training`, `talent`, `technique`, `spell`), pois o frontend depende desses três campos para renderizar os cards e abrir a view correta na entidade certa.
5. Definir também, como parte da mesma decisão de modelagem, o formato de escrita usado no create/update dos 4 endpoints (ex.: `improvedFrom` e `requirements` recebidos como arrays de referências compostas por `entityType` + `id`), de forma consistente com o formato de leitura do item 4.
6. Reaproveitar, na medida do possível, os endpoints de listagem paginada com filtro por `name` já existentes para as 4 entidades (usados hoje pelas páginas de listagem) para alimentar o modal de seleção do frontend — não é esperado um novo endpoint de busca dedicado para essa finalidade, a menos que a etapa de planejamento identifique necessidade técnica real.

### Fora de escopo

- Criação de qualquer recurso de "seções" configuráveis nas 4 entidades.
- Qualquer relação bidirecional ou reflexo automático da relação no item referenciado.
- Qualquer regra de permissão/visibilidade além do CRUD já existente das 4 entidades.
- Alterações no endpoint global `/search` (limitado a 10 resultados, sem paginação) — ele não atende ao modal de seleção paginado e não deve ser adaptado para isso.
