# Spec: Habilidades Adicionais (Treinamentos, Talentos, Características)

## Pedido original

"Preciso agora adicionar uma nova propriedade nas entidades 'treinamentos', 'talentos' e
'características'. A propriedade se chamará 'Habilidades Adicionais' e irá se comportar como as
funcionalidades 'Adicionar Aprimorado de' e 'Adicionar Requisitos'. A propriedade será uma
listagem onde teremos um botão com o texto 'Adicionar Habilidades', ao clicar no botão um modal
similar ao apresentado em 'Adicionar Aprimorado de' e 'Adicionar Requisitos' onde será possível
selecionar a aba desejada e escolher qual habilidade adicionar a lista de 'Habilidades
Adicionais'. No formulário esse campo deve ficar abaixo da descrição e deve ocupar a linha
inteira."

Esta demanda é uma extensão direta da feature já implementada e documentada em
`.claude/tasks/improved-from-requirements/` ("Aprimorado de" / "Requisitos"), que hoje existe nas
5 entidades "Habilidades" (Treinamentos, Talentos, Características, Técnicas e Magias).

## Perguntas e respostas

- P: Quais abas devem aparecer no modal "Adicionar Habilidades"? → R: As mesmas 5 abas já
  existentes no modal de "Aprimorado de"/"Requisitos": Treinamentos, Talentos, Características,
  Técnicas, Magias.
- P: Técnicas e Magias também ganham o campo/botão "Habilidades Adicionais" no próprio
  formulário? → R: Não. Apenas Treinamentos, Talentos e Características exibem o campo/botão
  "Habilidades Adicionais" em seu próprio formulário. Assimetria intencional: as 5 entidades
  continuam tendo "Aprimorado de"/"Requisitos" e as 5 continuam podendo ser selecionadas como
  alvo dentro do modal de "Habilidades Adicionais", mas só as 3 entidades citadas são donas dessa
  nova lista.
- P: A lista "Habilidades Adicionais" é mutuamente exclusiva com "Aprimorado de" e "Requisitos"?
  → R: Sim. A regra hoje aplicada entre "Aprimorado de" e "Requisitos" (um mesmo item não pode
  estar em mais de uma lista do mesmo registro) passa a valer entre as três listas.
- P: Onde o campo "Habilidades Adicionais" deve ficar posicionado no formulário? → R: Entre a
  Descrição e a linha "Aprimorado de"/"Requisitos", ocupando a linha inteira (largura total).

### Pontos decididos por convenção (delegados explicitamente pelo usuário)

O usuário optou por seguir, sem nova consulta, a mesma convenção já usada por
`improvedFrom`/`requirements`, por serem questões de consistência com o padrão existente e não de
escopo novo:

- Autorreferência e duplicidade na lista "Habilidades Adicionais": bloqueadas, igual às outras
  duas listas.
- A nova lista "Habilidades Adicionais" também deve aparecer como um novo quadro nos modais de
  visualização das 3 entidades donas (Treinamentos, Talentos, Características), exibindo os itens
  como cards com ação de visualizar, exatamente como "Aprimorado de"/"Requisitos" fazem hoje.
- Nome técnico da propriedade na API: `additionalAbilities` (camelCase, inglês) e novo valor de
  enum `additional_ability` para o tipo de vínculo (equivalente a `EntityLinkType.ADDITIONAL_ABILITY`).
- Relação unidirecional (sem reflexo automático no item referenciado).
- Exclusão em cascata das referências via chave estrangeira, mesmo padrão já usado.
- Propriedade opcional (não obrigatória).
- Campo presente apenas no endpoint de detalhe (criação, atualização e consulta por id), não nas
  listagens paginadas.
- Acesso de usuário autenticado via Google mantido read-only, sem regra adicional.
- O modal de seleção deve ocultar da listagem os itens já presentes na lista atual do formulário
  aberto.

## Escopo confirmado

### Escopo geral

As entidades Treinamento, Talento e Característica passam a ter uma nova propriedade opcional,
"Habilidades Adicionais" (`additionalAbilities`): uma lista de referências a itens de qualquer uma
das 5 entidades "Habilidades" (Treinamentos, Talentos, Características, Técnicas, Magias).

Técnicas e Magias não ganham essa propriedade em seus próprios registros (não são donas da lista),
mas continuam podendo ser selecionadas como item referenciado dentro da lista "Habilidades
Adicionais" de Treinamentos, Talentos ou Características, do mesmo modo como já podem ser
referenciadas em "Aprimorado de"/"Requisitos".

### Regras de negócio confirmadas

1. A propriedade "Habilidades Adicionais" não é obrigatória; um registro pode não ter nenhum item
   nela.
2. Um item não pode aparecer na própria lista de "Habilidades Adicionais" dele mesmo
   (autorreferência bloqueada) — aplicável apenas quando a entidade dona da lista é uma das 3
   entidades que também podem ser alvo de si mesmas (Treinamentos, Talentos, Características).
3. Um mesmo item não pode aparecer duas vezes na lista "Habilidades Adicionais" do mesmo registro
   (duplicidade bloqueada).
4. Um mesmo item não pode estar simultaneamente em mais de uma das três listas do mesmo registro:
   "Aprimorado de", "Requisitos" e "Habilidades Adicionais" (exclusividade mútua entre as três,
   ampliando a regra já existente entre "Aprimorado de" e "Requisitos").
5. A relação é unidirecional: adicionar um item X em "Habilidades Adicionais" de um registro Y não
   cria nem exibe automaticamente qualquer relação inversa em X.
6. Quando um item referenciado por outros registros em "Habilidades Adicionais" é excluído, a
   exclusão do item ocorre normalmente e todas as referências a ele em outros registros são
   removidas automaticamente (cascata), sem impedir a exclusão e sem deixar referências quebradas.
7. Não há regra de visibilidade ou permissão adicional além das permissões de CRUD já existentes
   para Treinamentos, Talentos e Características (usuário autenticado via Google já é bloqueado de
   criar/editar; essa regra existente permanece a única aplicável, inclusive para adicionar/remover
   itens de "Habilidades Adicionais", que faz parte da criação/edição do registro).
8. Apenas Treinamentos, Talentos e Características possuem e exibem a lista "Habilidades
   Adicionais" em seus próprios registros. Técnicas e Magias não ganham essa propriedade, apenas
   continuam elegíveis como alvo de seleção dentro dela.

### Comportamento no formulário de cadastro/edição (app-web)

Nas telas de cadastro/edição de Treinamentos, Talentos e Características, deve existir um novo
campo "Habilidades Adicionais", posicionado entre o campo de Descrição e a linha existente que
contém "Aprimorado de"/"Requisitos", ocupando a largura total da linha (diferente de "Aprimorado
de"/"Requisitos", que ficam lado a lado ocupando cada um metade da linha).

O campo contém:
- Um botão de ação com o texto "Adicionar Habilidades", que abre o modal de seleção.
- A listagem dos itens já adicionados, cada um exibindo: nome do item, ação de visualizar (abre o
  modal de visualização já existente da entidade correspondente) e ação de remover da lista
  (remoção local, sujeita à confirmação de salvamento do formulário como um todo, seguindo o
  padrão já usado para campos de lista no restante do formulário).

O modal de seleção aberto a partir de "Adicionar Habilidades" segue exatamente o mesmo padrão já
usado pelos modais de "Aprimorado de"/"Requisitos":
- 5 abas: "Treinamentos", "Talentos", "Características", "Técnicas", "Magias".
- Um campo de filtro por nome abaixo das abas.
- Uma listagem paginada da entidade correspondente à aba selecionada, reaproveitando os hooks e
  endpoints de listagem paginada com filtro por nome já existentes para cada uma das 5 entidades.
- A listagem paginada deve ocultar os itens que já estão presentes na lista "Habilidades
  Adicionais" atual do formulário em edição/criação.
- Cada item da listagem tem: nome, ação de "visualizar" e ação de "adicionar" (adiciona o item à
  lista "Habilidades Adicionais", respeitando as regras de bloqueio de autorreferência,
  duplicidade e exclusividade entre as três listas).
- Ao tentar adicionar um item que viole alguma regra de bloqueio, a ação deve ser impedida com
  feedback ao usuário em pt-BR.

### Comportamento no modal de visualização (app-web)

Nas telas de visualização de Treinamentos, Talentos e Características, deve existir um novo
quadro "Habilidades Adicionais", exibindo os itens da lista como cards, cada um com ação de
"visualizar" que abre o modal de visualização já existente da entidade referenciada
(independentemente de qual das 5 entidades o item pertence), seguindo exatamente o mesmo padrão
já usado pelos quadros "Aprimorado de"/"Requisitos".

Técnicas e Magias não ganham esse novo quadro em suas próprias telas de visualização (não são
donas da lista), mas continuam podendo aparecer como item referenciado dentro do quadro
"Habilidades Adicionais" de Treinamentos, Talentos ou Características.

### Requisitos para a etapa de planejamento do backend (app-api)

1. Suportar uma terceira lista de referências, "Habilidades Adicionais" (`additionalAbilities`),
   com o mesmo formato de leitura/escrita já usado por `improvedFrom`/`requirements` (referência
   composta por `entityType` + `id`, com `entityType` cobrindo as 5 entidades "Habilidades" já
   suportadas pelo `ReferenceableEntityType` existente).
2. `additionalAbilities` só existe como propriedade de escrita/leitura nas entidades Treinamento,
   Talento e Característica. Técnicas e Magias não recebem essa propriedade em seus DTOs/endpoints
   (nem de escrita nem de leitura), apenas seguem podendo ser referenciadas como alvo dentro das
   listas `additionalAbilities` das 3 entidades donas — do mesmo modo como já podem ser
   referenciadas como alvo em `improvedFrom`/`requirements`.
3. Suportar exclusão em cascata das referências de "Habilidades Adicionais" quando o item
   referenciado é excluído, com o mesmo mecanismo de integridade referencial já usado para
   `improvedFrom`/`requirements`.
4. Ampliar a validação de exclusividade entre listas (hoje aplicada só entre `improvedFrom` e
   `requirements`) para cobrir as três listas mutuamente exclusivas do mesmo registro
   (`improvedFrom`, `requirements`, `additionalAbilities`) nas 3 entidades donas, incluindo o
   tratamento correto de atualização parcial (quando apenas uma ou duas das três listas são
   enviadas num `PUT`), preservando a mesma lógica de "par/conjunto efetivo" já usada hoje para
   duas listas.
5. Aplicar bloqueio de autorreferência e de duplicidade na lista `additionalAbilities`, com
   mensagens de erro em pt-BR consistentes com as já usadas para `improvedFrom`/`requirements`.
6. `additionalAbilities` deve estar disponível apenas no endpoint de detalhe (criação, atualização
   e consulta por id) das 3 entidades donas, não nas listagens paginadas — mesma restrição já
   aplicada a `improvedFrom`/`requirements`.
7. Reaproveitar, na medida do possível, a estrutura de dados e o serviço compartilhado já
   existentes para `improvedFrom`/`requirements` (mesma tabela de junção genérica, mesmo enum de
   tipo de entidade), adicionando apenas o necessário para suportar o novo tipo de vínculo
   "Habilidade Adicional" (nome técnico `additionalAbilities`, valor de enum
   `additional_ability`) — não é esperado um modelo de dados paralelo/duplicado.
8. Não há regra de permissão/visibilidade adicional além do CRUD já existente das 3 entidades
   donas (usuário Google permanece read-only).

### Requisitos para a etapa de planejamento do frontend (app-web)

1. Adicionar, nos formulários de cadastro/edição de Treinamentos, Talentos e Características, um
   novo campo "Habilidades Adicionais" (botão "Adicionar Habilidades") posicionado entre a
   Descrição e a linha "Aprimorado de"/"Requisitos", ocupando a linha inteira.
2. Adicionar, nos modais de visualização das mesmas 3 entidades, um novo quadro "Habilidades
   Adicionais" seguindo o mesmo padrão visual e de comportamento dos quadros "Aprimorado de"/
   "Requisitos".
3. Reaproveitar o modal de seleção já existente (5 abas, filtro por nome, listagem paginada, ações
   visualizar/adicionar) para a nova lista.
4. **Ponto de atenção identificado nesta investigação, a ser resolvido pelo planejamento web:** o
   componente genérico `EntityReferenceListField`
   (`app-web/src/shared/components/EntityReferenceListField/index.tsx`) hoje recebe uma única prop
   `otherListValue?: IEntityReference[]` (no singular), usada para validar a exclusividade contra
   apenas *uma* outra lista (o par "Aprimorado de" x "Requisitos"). Com a introdução de
   "Habilidades Adicionais", cada uma das três listas passa a precisar validar exclusividade contra
   as *outras duas* listas simultaneamente, o que a assinatura atual (uma única lista de
   comparação) não comporta. A etapa de planejamento do frontend deve decidir e detalhar como essa
   validação de exclusividade contra múltiplas outras listas será feita (por exemplo, ajustando a
   prop para aceitar mais de uma lista de comparação, ou outra abordagem equivalente), mantendo o
   mesmo comportamento de bloqueio com feedback em pt-BR já existente.
5. Nas 3 entidades donas, ao editar/enviar o formulário, garantir que as três listas
   ("Aprimorado de", "Requisitos", "Habilidades Adicionais") sejam enviadas de forma consistente
   com o contrato definido pelo planejamento de backend (inclusive em cenários de atualização
   parcial, se aplicável ao formato de envio do frontend).
6. Técnicas e Magias não recebem nenhuma alteração de tela nesta demanda (nem campo no formulário,
   nem quadro na visualização) — continuam aparecendo apenas como abas selecionáveis dentro do
   modal de "Habilidades Adicionais" das 3 entidades donas.

## Fora de escopo

- Adicionar o campo/botão "Habilidades Adicionais" aos formulários de Técnicas e Magias.
- Adicionar o quadro "Habilidades Adicionais" aos modais de visualização de Técnicas e Magias.
- Qualquer relação bidirecional ou reflexo automático da relação no item referenciado.
- Qualquer regra de permissão/visibilidade além do CRUD já existente das 3 entidades donas.
- Criação de qualquer endpoint novo de busca dedicado — o modal de seleção continua reaproveitando
  as listagens paginadas já existentes das 5 entidades.
- Alterações no endpoint global `/search`.