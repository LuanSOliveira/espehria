# Spec: Ficha - Inventário (aba, Volume e Moedas)

## Pedido original

Adicionar uma nova funcionalidade à entidade "Ficha" (personagem) e à sua tela de
visualização (app-api NestJS + app-web Next.js).

### 1. Nova aba "INVENTÁRIO"
Na visualização da ficha, adicionar uma aba chamada "INVENTÁRIO" posicionada logo
APÓS a aba "HABILIDADES".

### 2. Quadro "Volume" (dentro da aba Inventário)
Título do quadro: "Volume". Propriedades:
- **Volume Carregado**: inicia em 0; será incrementado/decrementado futuramente pela
  adição/remoção de itens ao inventário (itens serão trabalhados em demanda futura —
  por ora tratar contribuição de itens como 0), além da regra de moedas abaixo.
- **Volume Máximo**: calculado = 5 + modificador do atributo "Força" da ficha.
- **Volume Limite**: calculado = modificador do atributo "Força" da ficha + 10.

Disposição visual: `{Volume_Carregado}/{Volume_Máximo}    {Volume_Limite}`.

Rodapé do quadro (texto com asterisco):
`*Se carregar mais do que {Volume_Máximo} Volume(s), você adquire a condição
sobrecarregado`.

### 3. Quadro "Moedas" (ao lado do quadro "Volume", mesma aba)
4 inputs numéricos inteiros, nesta ordem: **PC - Cobre**, **PP - Prata**, **PO - Ouro**,
**PL - Platina**.

Entre cada par de inputs adjacentes (PC↔PP, PP↔PO, PO↔PL) há duas setas/botões (uma
para a direita, outra para a esquerda) que fazem conversão:
- Para cima (10 menores → 1 maior): 10 PC = 1 PP; 10 PP = 1 PO; 10 PO = 1 PL.
- Para baixo (1 maior → 10 menores): 1 PP = 10 PC; 1 PO = 10 PP; 1 PL = 10 PO.

Rodapé do quadro (texto com asterisco):
`*A cada 1000 moedas 1 volume será adicionado ao inventário`.

Regra de negócio: Volume Carregado = volume dos itens do inventário (0 por enquanto)
+ floor(total de moedas / 1000).

## Perguntas e respostas

- P: O campo "Volume Carregado" deve ser uma coluna persistida no banco de dados
  (como `currentHitPoints`/`temporaryHitPoints`), ou deve ser um valor puramente
  derivado no client (como Classe de Armadura e PV máximo, que são calculados a
  partir de outros campos e nunca persistidos)? → R: Coluna persistida no banco
  (será incrementada/decrementada futuramente por itens do inventário, e também
  pela regra de moedas). Diferente do padrão de Classe de Armadura/PV máximo, que
  são só derivados no client.

- P: As 4 moedas (PC, PP, PO, PL) devem ser persistidas com o mesmo padrão de
  autosave com debounce já usado para PV atual/temporário (`useFieldAutosave` +
  `PUT /sheets/:id`), tanto para digitação direta quanto para os cliques nas
  setas de conversão? → R: Sim, mesmo autosave com debounce (~2,5s) já usado para
  PV atual/temporário — tanto a digitação nos inputs quanto o clique nas setas de
  conversão seguem esse mesmo padrão de debounce. Não precisa salvar a conversão
  imediatamente fora do debounce.

- P: O que deve acontecer quando o usuário tenta converter moedas mas não há saldo
  suficiente (ex.: clicar na seta PC→PP com menos de 10 PC)? → R: O botão de
  conversão fica desabilitado sempre que o saldo do tipo de origem for menor que o
  necessário (ex.: menos de 10 PC desabilita a seta PC→PP; menos de 1 PP desabilita
  a seta PP→PC). Cada clique converte exatamente o bloco mínimo (10 menores → 1
  maior, ou 1 maior → 10 menores).

- P: A aba "Inventário" deve ter sub-abas (como "Habilidades" tem
  Características/Treinamentos/Talentos), ou é uma aba única com os dois quadros
  lado a lado? → R: Aba única "INVENTÁRIO", sem sub-abas, com os quadros Volume e
  Moedas lado a lado.

- P: Na regra "a cada 1000 moedas, 1 volume é adicionado", o total de moedas é a
  soma bruta das 4 quantidades (PC + PP + PO + PL) ou uma soma ponderada pelo
  valor de cada moeda (ex.: 1 PP vale 10 PC)? → R: Soma bruta das quantidades
  (`PC + PP + PO + PL`), sem converter por valor de moeda. Ex.: 500 PC + 500 PL =
  1000 = 1 volume adicional. Portanto `floor((PC + PP + PO + PL) / 1000)`.

- P: Se o modificador do atributo Força for negativo, Volume Máximo e/ou Volume
  Limite podem ficar negativos, ou devem ter um piso (ex.: 0)? → R: Aplicar piso
  de 0 tanto em Volume Máximo quanto em Volume Limite — nunca exibir valor
  negativo.

- P: [Correção de fórmula levantada durante o esclarecimento] A fórmula original
  do pedido para Volume Limite estava descrita de forma ambígua/incorreta
  ("modificador × 10"). Qual é a fórmula correta? → R: Volume Limite = modificador
  de Força + 10 (não é "modificador × 10"). Volume Máximo continua 5 + modificador
  de Força. Ambos com piso em 0.

- P: Os inputs de moeda (PC, PP, PO, PL) têm algum limite máximo de valor, ou
  apenas validação de número inteiro não-negativo? → R: Sem teto máximo; apenas
  validação de inteiro >= 0.

- P: Além do texto de rodapé com asterisco sobre a condição "sobrecarregado", deve
  haver algum destaque visual (cor, ícone) quando o Volume Carregado ultrapassar o
  Volume Máximo? → R: Sim, além do texto de rodapé com asterisco, deve haver
  destaque visual (ex.: cor de warning/erro) no valor de Volume Carregado quando
  ele for maior que o Volume Máximo.

## Escopo confirmado

### Aba "Inventário"
Uma nova aba de nível superior, rotulada "Inventário", é adicionada à navegação da
tela de visualização de ficha, posicionada imediatamente após a aba "Habilidades"
(antes de qualquer aba futura). A aba não possui sub-abas: ao ser selecionada,
exibe diretamente os dois quadros "Volume" e "Moedas" lado a lado.

### Quadro "Volume"
Exibe três valores:
- **Volume Carregado**: valor numérico inteiro, persistido na ficha. Hoje é
  calculado e mantido como `floor((PC + PP + PO + PL) / 1000)`, já que a
  contribuição de itens do inventário ainda não existe (tratada como 0 nesta
  demanda). Nas demandas futuras de itens de inventário, este valor passará a
  somar também o volume dos itens carregados.
- **Volume Máximo**: valor derivado (não persistido), calculado como
  `max(0, 5 + modificador do atributo Força da ficha)`.
- **Volume Limite**: valor derivado (não persistido), calculado como
  `max(0, modificador do atributo Força da ficha + 10)`.

O atributo "Força" e seu modificador são obtidos da mesma forma que os demais
atributos já exibidos na aba Estatísticas da ficha: o valor base do atributo (10 +
soma de melhorias − soma de defeitos do tipo "Atributo"/propriedade "Força") é
usado para calcular o modificador como `Math.floor((valor - 10) / 2)`, seguindo
exatamente a mesma fórmula e fonte de dados já aplicadas a Classe de Armadura e
Pontos de Vida máximo na tela atual.

Disposição visual do quadro: `{Volume Carregado}/{Volume Máximo}` seguido de
`{Volume Limite}` como um valor separado, na mesma linha.

Quando o Volume Carregado for maior que o Volume Máximo, o valor de Volume
Carregado recebe destaque visual de warning/erro (cor de alerta).

Rodapé do quadro, sempre visível, com texto marcado por asterisco:
`*Se carregar mais do que {Volume Máximo} Volume(s), você adquire a condição
sobrecarregado`, onde `{Volume Máximo}` é substituído pelo valor calculado atual.

### Quadro "Moedas"
Exibido ao lado do quadro "Volume", na mesma aba. Contém 4 campos numéricos
inteiros, nesta ordem: PC (Cobre), PP (Prata), PO (Ouro), PL (Platina). Cada
campo aceita apenas números inteiros maiores ou iguais a 0, sem limite máximo.

Entre cada par de campos adjacentes (PC↔PP, PP↔PO, PO↔PL) existem dois controles
de conversão (uma seta para cada direção):
- Conversão "para cima" (10 unidades da moeda menor → 1 unidade da moeda maior
  seguinte): 10 PC → 1 PP; 10 PP → 1 PO; 10 PO → 1 PL.
- Conversão "para baixo" (1 unidade da moeda maior → 10 unidades da moeda menor
  anterior): 1 PP → 10 PC; 1 PO → 10 PP; 1 PL → 10 PO.

Cada clique num controle de conversão executa exatamente um bloco de conversão
(não é possível converter parcialmente ou em lote). O controle de conversão fica
desabilitado sempre que o saldo da moeda de origem for insuficiente para a
conversão (menos de 10 unidades para conversões "para cima"; menos de 1 unidade
para conversões "para baixo").

Rodapé do quadro, sempre visível, com texto marcado por asterisco:
`*A cada 1000 moedas 1 volume será adicionado ao inventário`.

### Persistência e sincronização
- Os 4 valores de moeda (PC, PP, PO, PL) e o Volume Carregado são persistidos como
  colunas da entidade Ficha no backend (app-api), com validação de inteiro maior
  ou igual a 0.
- Alterações nos campos de moeda — tanto por digitação direta quanto por clique
  nos controles de conversão — são salvas seguindo o mesmo padrão de autosave com
  debounce (~2,5s) já utilizado para PV atual/temporário na tela de ficha (mesma
  chamada `PUT /sheets/:id`, sem necessidade de salvamento imediato fora do
  debounce).
- O Volume Carregado é recalculado (`floor((PC + PP + PO + PL) / 1000)`, somado à
  contribuição de itens do inventário, hoje fixa em 0) e persistido seguindo a
  mesma lógica de sincronização.
- Volume Máximo e Volume Limite não são persistidos; são sempre recalculados a
  partir do modificador de Força vigente da ficha.

### Fora de escopo desta demanda
- Cadastro, listagem, adição ou remoção de itens de inventário (ficará para
  demanda futura); a contribuição de itens ao Volume Carregado é tratada como 0
  nesta implementação.
- Qualquer efeito mecânico real da condição "sobrecarregado" além do destaque
  visual e do texto informativo (não há regra de penalidade a ser implementada
  agora).