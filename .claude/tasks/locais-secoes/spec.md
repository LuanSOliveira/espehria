# Spec: Seções de Local (locais-secoes)

## Pedido original
Adicionar a um Local (`Location`) a possibilidade de conter múltiplas "seções", cada
uma composta por um label (título) e uma descrição em rich text, permitindo criá-las
no formulário de cadastro/edição do Local e visualizá-las no modal de detalhes.

## Perguntas e respostas
- P: A seção deve ser modelada como entidade relacionada (nova tabela com FK para
  Location) ou como um campo estruturado (ex.: JSON) na própria entidade Location?
  → R: Entidade relacionada. Nova entidade `LocationSection` com FK para `Location`
  e uma coluna de ordem (`order`/ordering) para preservar a ordem de adição. Relação
  OneToMany a partir de Location com cascade (seções criadas/atualizadas/removidas
  junto com o Local), seguindo o padrão TypeORM do projeto.

- P: Quais campos da seção são obrigatórios? O `label` é texto simples ou também
  rich text? A `descricao` pode ficar em branco?
  → R: Apenas `label` é obrigatório (texto simples). `descricao` é rich text e PODE
  ficar em branco/vazia.

- P: É necessário suportar reordenação das seções (arrastar/subir/descer), ou a
  ordem é fixa pela ordem de criação?
  → R: Sem reordenação. Seções mantêm a ordem em que foram adicionadas. Operações
  suportadas: apenas adicionar e remover.

- P: A remoção de uma seção no formulário precisa de confirmação (modal) ou é
  remoção direta?
  → R: Remoção direta — botão com ícone de lixeira em cada seção, sem modal de
  confirmação.

- P: Existe limite mínimo ou máximo de seções por Local?
  → R: Sem limite mínimo/máximo de número de seções por Local.

- P: Como o modal de visualização (`LocationView`) deve se comportar quando o Local
  não possui nenhuma seção?
  → R: Omitir o bloco de seções por completo (não renderizar título nem mensagem do
  tipo "nenhuma seção").

## Escopo confirmado

### Modelagem
- Nova entidade `LocationSection`, relacionada a `Location` por chave estrangeira,
  com uma coluna de ordem que preserva a sequência em que as seções foram
  adicionadas.
- Relação OneToMany (Location → LocationSection) com cascade, de forma que seções
  sejam criadas, atualizadas e removidas junto com o Local, seguindo o padrão já
  usado no projeto.
- Campos da seção: `label` (texto simples, obrigatório) e `descricao` (rich text,
  opcional, pode ficar vazia).

### Regras de negócio
- Não há reordenação de seções; a ordem exibida é sempre a ordem de adição.
- Não há limite mínimo nem máximo de seções por Local.
- Operações suportadas sobre seções: adicionar e remover. Não há edição de ordem.

### Comportamento no formulário (LocationCreateForm)
- Abaixo do input de descrição do Local, um botão "Adicionar Seção" alinhado à
  direita.
- Ao clicar no botão, uma nova seção é adicionada com dois inputs: `label` (texto
  simples, em cima) e `descricao` (rich text, abaixo).
- As seções adicionadas aparecem na linha acima do botão "Adicionar Seção".
- Layout: 2 seções por linha (cada uma ocupando metade da largura); a partir da 3ª
  seção, inicia-se uma nova linha.
- Cada seção possui um botão de remoção direta (ícone de lixeira), sem modal de
  confirmação.
- O input de rich text da seção reutiliza o componente de rich text existente no
  formulário (`FormRichTextInput`).

### Comportamento no modal de visualização (LocationView)
- Abaixo do campo "Descrição" do Local, as seções são exibidas, cada uma em um
  quadro/card contendo o Label e a Descrição renderizada com formatação (reutilizando
  o componente de visualização de rich text existente, `RichTextViewer`).
- Disposição: 2 seções por linha, mesma lógica de layout do formulário.
- Caso o Local não possua nenhuma seção, o bloco de seções é omitido por completo
  (sem título nem mensagem de estado vazio).
