# Spec: Ficha - Inventário (gestão de itens)

## Pedido original

Expandir a aba "INVENTÁRIO" da tela de visualização da ficha (app-web), adicionando
ABAIXO dos quadros já existentes de "Volume" e "Moedas" uma nova dinâmica de
gerenciamento de itens da ficha.

### Estrutura de abas
Dentro de "INVENTÁRIO", abaixo de Volume/Moedas, duas abas: "Carregados" e "Equipados".
- Aba "Carregados": sub-abas por categoria, nesta ordem: Utilitários, Consumíveis,
  Materiais, Munições, Armas, Armaduras, Acessórios, Escudos. Cada sub-aba exibe um
  contador com a quantidade de itens adicionados naquela categoria.
- Aba "Equipados": sub-abas nesta ordem: Armas, Armaduras, Acessórios, Escudos. Lista
  os itens dessas 4 categorias marcados como equipados. Um item equipado NÃO sai da
  lista de "Carregados" — aparece nas duas abas simultaneamente.

### Fluxo de adicionar item (em cada categoria de "Carregados")
1. Botão "Adicionar" abre modal perguntando: item avulso (novo) ou item existente (do
   cadastro do sistema)?
   - Avulso: formulário de cadastro semelhante ao da entidade daquela categoria. Os
     dados NÃO criam registro no catálogo do sistema — servem só para este item do
     inventário da ficha.
   - Existente: modal com listagem dos itens já cadastrados no sistema para aquela
     categoria. Selecionar NÃO cria referência/vínculo permanente entre ficha e item
     cadastrado — apenas copia as informações do item cadastrado para dentro do
     inventário da ficha no momento da adição (snapshot, não FK viva).
2. Em seguida é solicitada a quantidade do item a adicionar.
3. Validação de volume antes de confirmar: calcular (volume unitário × quantidade) e
   somar ao Volume Carregado atual. Se ultrapassar o "Volume Limite" da ficha,
   bloquear a adição e exibir mensagem informando que não é possível adicionar essa
   quantidade pois supera o volume limite que a ficha pode carregar. Se passar,
   adiciona o item e soma o volume ao Volume Carregado da ficha.

### Card do item no inventário
Card resumido com: foto, nome, volume (unitário), quantidade, e ações:
- Visualizar: modal de visualização semelhante ao modal de visualização já existente
  da entidade referente.
- Remover: modal pedindo a quantidade a remover (máximo = quantidade atual), com
  confirmação depois. Ao remover, subtrai (volume unitário × quantidade removida) do
  Volume Carregado. Se a quantidade removida for igual à quantidade total, o card
  desaparece.
- Para Armas, Armaduras, Acessórios e Escudos, duas ações extras: Equipar /
  Desequipar — mutuamente exclusivas conforme o estado atual. Equipar/desequipar não
  altera quantidade nem volume carregado, apenas a flag de estado do item e sua
  presença na aba "Equipados".

## Perguntas e respostas

- P: As 5 categorias que hoje não possuem campo `volume` no cadastro (Utilitários,
  Consumíveis, Materiais, Munições, Acessórios) devem ganhar esse campo, para que a
  validação de volume funcione igualmente em todas as 8 categorias? → R: Sim,
  adicionar coluna `volume` ao cadastro dessas 5 entidades (migration + ajuste dos
  formulários de cadastro web), no mesmo formato decimal já usado em Armas/Armaduras/
  Escudos (`numeric`, via `DecimalTransformer`).

- P: A soma/comparação de volume deve arredondar para inteiro (como o `loaded_volume`
  atual, que é `int`) ou usar o valor decimal exato? → R: Sem arredondamento — usa-se
  o valor decimal exato na soma e na comparação (ex.: limite 11 e valor somado 10.9 →
  permitido, pois 10.9 ≤ 11). Isso exige que `sheets.loaded_volume` deixe de ser `int`
  e passe a ser decimal/numeric, e que toda a lógica de volume existente (incluindo o
  `floor((pc+pp+po+pl)/1000)` das moedas) conviva com esse campo decimal. A
  contribuição das moedas continua sendo sempre um valor inteiro (múltiplos de 1000
  moedas = +1 volume inteiro); é o total que passa a aceitar frações vindas dos
  itens.

- P: Como o Volume Carregado deve ser calculado/recomputado a partir de dois
  componentes (moedas e itens), evitando que o autosave de um apague a contribuição
  do outro? → R: Coluna separada para o volume vindo de itens (ex.: `items_volume`,
  decimal), recalculada como soma direta de todos os itens do inventário (volume
  unitário × quantidade, sem arredondar) a cada adição/remoção. O `loaded_volume` é
  recomputado como `floor(moedas_total/1000) + items_volume` sempre que qualquer um
  dos dois componentes mudar. Nenhum dos dois componentes acumula sobre o valor
  anterior — ambos são sempre recalculados a partir da fonte (moedas atuais e soma
  atual dos itens).

- P: Como persistir os itens do inventário no backend — nova entidade relacional ou
  coluna jsonb em `sheets`? → R: Nova entidade relacional, uma linha por card de item
  no inventário da ficha (ex.: `sheet_inventory_items`), com FK para `sheets`,
  categoria (enum/string), quantidade, flag `equipped` boolean, e os dados do item
  como snapshot (jsonb para os campos variáveis por categoria, já que cada categoria
  tem campos distintos). Seguir o padrão das entidades relacionais já existentes no
  módulo `sheets` (ex.: `sheet-training-slot.entity.ts`). Não usar coluna jsonb solta
  em `sheets`.

- P: O formulário de item avulso deve replicar todos os campos do cadastro da
  categoria (dano, traços, graduação de tamanho, tags, encantamentos etc.), ou uma
  versão simplificada? → R: Completo, replicando todos os campos do formulário de
  cadastro da categoria, porém sem persistir no catálogo do sistema — os dados ficam
  só no snapshot do item da ficha.

- P: Ao selecionar um item existente do catálogo, os campos hoje FK (moeda, tipo de
  dano, graduação de tamanho, traços, tags etc.) devem permanecer como referência
  viva ou virar valor copiado? → R: Viram valor copiado no momento da adição, sem
  relação viva (snapshot). Se o item do catálogo for editado ou excluído depois, o
  snapshot na ficha não muda.

- P: A listagem de itens existentes no modal de seleção deve ser construída do zero
  ou reaproveitar os componentes já existentes de cada categoria? → R: Reaproveitar
  os componentes `*FilterSection` e a listagem paginada já existentes de cada
  categoria (busca/filtro/paginação), seguindo as skills `web-tabela-listagem`/
  `web-secao-filtros` do projeto — não construir do zero.

- P: O que exibir no card quando o item não tiver foto (campo `reference_image`
  vazio)? → R: Ícone genérico da categoria usando `react-icons/fi`, seguindo o padrão
  já usado no projeto. Sem asset novo.

- P: Se um item equipado tiver sua quantidade parcialmente removida, ele deixa de
  estar equipado? → R: Não — continua equipado enquanto restar ao menos 1 unidade; só
  deixa de aparecer em "Equipados" quando a quantidade chega a 0 (e o card é
  removido).

- P: Ao equipar um card com quantidade maior que 1, todas as unidades do stack ficam
  equipadas ou apenas uma unidade individual? → R: Equipa o card inteiro como uma
  unidade (não é por unidade individual dentro do stack). Não há limite automático de
  itens equipados por categoria — fica a critério do jogador.

- P: Itens idênticos adicionados em momentos diferentes (mesmo avulso com dados
  idênticos, ou mesmo item do catálogo) geram cards separados ou empilham num único
  card? → R: Empilham num único card, somando a quantidade, em vez de gerar cards
  separados. Isso vale tanto para itens avulsos com dados idênticos quanto para o
  mesmo item do catálogo selecionado mais de uma vez.

- P: A validação de volume ao adicionar item compara contra o "Volume Máximo" ou o
  "Volume Limite"? E o que acontece se o Volume Carregado atual já estiver acima do
  limite? → R: A comparação é contra o "Volume Limite" (`max(0, mod Força + 10)`),
  não o "Volume Máximo". Se o Volume Carregado atual já estiver acima do limite,
  qualquer nova adição de item permanece bloqueada até o carregado voltar para dentro
  do limite (por remoção de outros itens).

- P: O modal de visualização do card deve reutilizar exatamente o `*View` já
  existente da entidade (que espera a entidade completa com relações vivas), ou uma
  versão adaptada? → R: Adaptar (não reusar tal qual) o `*View` de cada categoria
  para aceitar os dados no formato do snapshot do inventário, em vez de exigir a
  entidade completa com relações vivas. Layout e campos exibidos permanecem os
  mesmos; muda apenas a fonte dos dados.

- P: Qual regra de permissão/visibilidade se aplica à leitura e escrita do inventário
  de itens da ficha? → R: A mesma já existente do módulo `sheets`
  (`findAccessibleById(id, currentUser)`) — sem regra nova.

## Escopo confirmado

### Contexto técnico levantado
- app-api possui 8 módulos de categoria em `app-api/src/modules/`: `utilities`
  (Utilitários), `consumables` (Consumíveis), `materials` (Materiais), `ammunition`
  (Munições), `weapons` (Armas), `armors` (Armaduras), `accessories` (Acessórios),
  `shields` (Escudos). Todos com CRUD + listagem paginada; entidades com `name`,
  `reference_image`, `description`, `price` + `currency`, `private_information`,
  tags, e em vários casos `enchantments`/`enhancements` jsonb.
- O campo `volume` hoje existe somente em `weapons`, `armors` e `shields` (coluna
  `numeric(4,1)` nullable, com `transformer: DecimalTransformer`).
- app-web possui, para cada uma das 8 categorias, em
  `app-web/src/app/(authorized)/<slug>/`: `page.tsx`, `components/<X>List`,
  `<X>ListItem`, `<X>FilterSection`, `<X>CreateForm`, `<X>View`. Slugs web:
  `utilitarios`, `consumiveis`, `materiais`, `municoes`, `armas`, `armaduras`,
  `acessorios`, `escudos`.
- `Sheet` (`app-api/src/modules/sheets/entities/sheet.entity.ts`) possui `pc`, `pp`,
  `po`, `pl` (int) e `loaded_volume` (int, default 0). O módulo `sheets` já possui
  entidades relacionais próprias (`sheet-training-slot.entity.ts`,
  `sheet-ability-extra.entity.ts`) e snapshots jsonb (`melhorias`, `defeitos`,
  `proficiencias`, `saberes`). Acesso aos endpoints da ficha segue
  `findAccessibleById(id, currentUser)` — mesma regra usada em todo o módulo.
- Da task anterior (`ficha-inventario`, já em produção): Volume Máximo =
  `max(0, 5 + mod Força)`, Volume Limite = `max(0, mod Força + 10)`, ambos derivados
  no client a partir do atributo Força da ficha; moedas (`pc`, `pp`, `po`, `pl`) e
  `loaded_volume` são salvos via autosave com debounce (~2,5s) no `PUT /sheets/:id`.

### Impacto no app-api

**Volume nas 5 categorias sem esse campo.** Utilitários, Consumíveis, Materiais,
Munições e Acessórios ganham coluna `volume` (numeric, mesmo formato decimal já
usado em Armas/Armaduras/Escudos: `numeric(4,1)`, nullable, `DecimalTransformer`),
via migration, com o respectivo ajuste nos DTOs/entidades dessas 5 entidades.

**Alteração de tipo em `sheets.loaded_volume`.** A coluna deixa de ser `int` e passa
a ser decimal/numeric, via migration de alteração de tipo. A soma e a comparação de
volume usam o valor decimal exato, sem arredondamento (ex.: limite 11 e valor somado
10.9 → permitido).

**Nova coluna `sheets.items_volume`** (decimal), representando exclusivamente a soma
do volume vindo dos itens do inventário da ficha (volume unitário × quantidade de
cada item, somados, sem arredondar). Recalculada a partir da fonte (soma atual dos
itens) a cada adição/remoção de item — nunca por incremento/decremento sobre o valor
anterior.

**Recomputação de `loaded_volume`.** Sempre que `items_volume` ou o total de moedas
(`pc + pp + po + pl`) mudar, `loaded_volume` é recalculado do zero como
`floor(moedas_total / 1000) + items_volume`. A contribuição das moedas permanece
sempre um valor inteiro; é o total que passa a aceitar frações vindas dos itens. Essa
recomputação total evita que o autosave de um dos dois componentes apague a
contribuição do outro.

**Nova entidade relacional** para os itens de inventário da ficha (ex.:
`sheet_inventory_items`), seguindo o padrão das entidades relacionais já existentes
no módulo `sheets`. Cada linha representa um card de item e contém, no mínimo:
- FK para `sheets` (`ON DELETE CASCADE`, mesmo padrão das demais entidades
  relacionais do módulo).
- Categoria do item (enum/string, uma das 8 categorias).
- Quantidade (inteiro, ≥ 1).
- Flag `equipped` (boolean), aplicável apenas às categorias Armas, Armaduras,
  Acessórios e Escudos; para as demais categorias permanece sempre `false`/não
  aplicável.
- Dados do item como snapshot em jsonb (campos variáveis conforme a categoria —
  mesmos campos exibidos no formulário de cadastro/visualização daquela categoria,
  incluindo os que hoje são FK no catálogo, como moeda, tipo de dano, graduação de
  tamanho, traços, tags, encantamentos/aprimoramentos), sem relação viva com o
  registro de catálogo de origem (quando aplicável).
- Volume unitário do item, também persistido no snapshot (necessário mesmo que o
  item de catálogo de origem seja depois editado ou excluído).

Não é criada nenhuma FK/vínculo permanente entre o item de inventário da ficha e um
eventual registro de catálogo selecionado como "item existente" — a seleção apenas
copia os dados no momento da adição.

**Empilhamento.** Ao adicionar um item (avulso ou existente), se já existir um item
na mesma ficha, mesma categoria, com dados de snapshot idênticos, a quantidade é
somada ao card existente em vez de criar um novo registro.

**Validação de volume no backend.** Ao processar uma adição de item, o backend
calcula (volume unitário × quantidade a adicionar) e verifica se
`items_volume atual + esse valor` faz o `loaded_volume` recomputado ultrapassar o
Volume Limite da ficha (`max(0, mod Força + 10)`, calculado a partir do atributo
Força vigente da ficha). Se ultrapassar, a adição é rejeitada com mensagem
informando que não é possível adicionar a quantidade solicitada por superar o volume
limite que a ficha pode carregar; nenhuma alteração é persistida. Se o Volume
Carregado atual já estiver acima do limite antes mesmo da tentativa de adição,
qualquer nova adição permanece bloqueada até o carregado voltar a ficar dentro do
limite (via remoção de outros itens).

**Remoção parcial/total de item.** Endpoint que recebe a quantidade a remover
(validando que não excede a quantidade atual do card). Subtrai
(volume unitário × quantidade removida) do total de itens, recomputa
`items_volume`/`loaded_volume`, e reduz a quantidade do registro. Se a quantidade
resultante chegar a 0, o registro do item é removido. A remoção não tem restrição de
volume limite (só a adição é validada contra o limite).

**Equipar/Desequipar.** Endpoint(s) que alternam a flag `equipped` do item
(aplicável somente a Armas, Armaduras, Acessórios e Escudos), sem alterar quantidade
nem `items_volume`/`loaded_volume`. Equipar e desequipar são mutuamente exclusivos
conforme o estado atual do card. Ao equipar um card com quantidade > 1, o card
inteiro (todas as unidades do stack) é tratado como uma única unidade equipada — não
há equipar por unidade individual dentro do stack, e não há limite automático de
quantidade de itens equipados por categoria.

**Permissões.** Todas as operações de leitura e escrita sobre os itens de inventário
da ficha seguem a mesma regra de acesso já usada em todo o módulo `sheets`
(`findAccessibleById(id, currentUser)`), sem regra nova.

### Impacto no app-web

**Estrutura de abas dentro de "Inventário".** Abaixo dos quadros já existentes
"Volume" e "Moedas" (que permanecem como estão, apenas passando a refletir o novo
`loaded_volume`/`items_volume` vindos do backend), são adicionadas duas abas:
- "Carregados": sub-abas por categoria, nesta ordem — Utilitários, Consumíveis,
  Materiais, Munições, Armas, Armaduras, Acessórios, Escudos. Cada sub-aba exibe um
  contador com a quantidade de itens (cards, não soma de unidades) adicionados
  naquela categoria e a listagem de cards da categoria.
- "Equipados": sub-abas nesta ordem — Armas, Armaduras, Acessórios, Escudos. Lista os
  itens dessas 4 categorias com `equipped = true`. Um item equipado continua
  aparecendo normalmente na respectiva sub-aba de "Carregados" simultaneamente.

**Ajuste dos formulários de cadastro das 5 categorias sem `volume`.** Utilitários,
Consumíveis, Materiais, Munições e Acessórios passam a ter campo `volume` no
`*CreateForm` (e exibição correspondente no `*View`), no mesmo padrão decimal já
usado em Armas/Armaduras/Escudos.

**Fluxo de adicionar item, por sub-aba de categoria em "Carregados":**
1. Botão "Adicionar" abre modal de escolha: item avulso (novo) ou item existente (do
   catálogo do sistema).
   - Avulso: formulário completo, replicando todos os campos do `*CreateForm` da
     categoria correspondente (incluindo campos hoje FK, como moeda, tipo de dano,
     graduação de tamanho, traços, tags, encantamentos/aprimoramentos quando
     aplicável). Não persiste no catálogo — os dados vão direto como snapshot do
     item de inventário.
   - Existente: modal reaproveitando os componentes `*FilterSection` e a listagem
     paginada já existentes daquela categoria (busca/filtro/paginação), seguindo as
     skills `web-tabela-listagem`/`web-secao-filtros` do projeto, para selecionar um
     registro do catálogo.
2. Em seguida, é solicitada a quantidade a adicionar (inteiro ≥ 1).
3. Antes de confirmar, o volume total a adicionar (volume unitário × quantidade) é
   validado contra o Volume Limite da ficha. Se ultrapassar, a adição é bloqueada com
   mensagem informando que a quantidade solicitada supera o volume limite que a
   ficha pode carregar; se estiver dentro do limite, o item é adicionado e o Volume
   Carregado é atualizado.

**Card do item.** Exibe foto (ou ícone genérico da categoria via `react-icons/fi`
quando `reference_image` estiver vazio, seguindo o padrão já usado no projeto), nome,
volume unitário, quantidade, e ações:
- Visualizar: modal adaptado a partir do `*View` já existente da categoria, capaz de
  renderizar os dados a partir do formato de snapshot do item de inventário (mesmo
  layout/campos, fonte de dados diferente), em vez de exigir a entidade completa do
  catálogo com relações vivas.
- Remover: modal solicitando a quantidade a remover (máximo = quantidade atual do
  card), seguido de confirmação. Ao confirmar, subtrai o volume correspondente do
  Volume Carregado; se a quantidade removida igualar a quantidade total do card, o
  card desaparece da listagem.
- Para Armas, Armaduras, Acessórios e Escudos: ações extras Equipar / Desequipar,
  mutuamente exclusivas conforme o estado atual do card, sem alterar quantidade nem
  Volume Carregado — apenas a flag de estado e a presença do card na aba "Equipados".

**Empilhamento no client.** Itens idênticos (mesma categoria + mesmos dados de
snapshot, seja avulso com dados idênticos ou o mesmo item do catálogo selecionado
novamente) resultam em um único card com quantidade somada, refletindo o
comportamento de empilhamento do backend — não são exibidos como cards separados.

### Fora de escopo
- Refazer os quadros "Volume" e "Moedas" já existentes e em produção (task
  `ficha-inventario`): o layout, os campos e as regras de conversão de moedas
  permanecem exatamente como estão. A única mudança que os afeta é indireta —
  `loaded_volume` muda de tipo (de `int` para decimal/numeric) e passa a incorporar
  a nova coluna `items_volume`, mas a fórmula de contribuição das moedas
  (`floor(moedas_total / 1000)`), os controles de conversão e o autosave de moedas
  permanecem inalterados.
- Qualquer efeito mecânico real da condição "sobrecarregado" além do que já foi
  definido na task anterior (destaque visual e texto informativo) — não há regra de
  penalidade nova a implementar.
- Equipar por unidade individual dentro de um stack, ou qualquer limite automático de
  quantidade de itens equipados por categoria.
- Qualquer alteração no catálogo do sistema (CRUD das 8 entidades) além da adição do
  campo `volume` nas 5 categorias que não o possuíam; os formulários e telas de
  cadastro/listagem/visualização do catálogo continuam existindo e funcionando como
  hoje, fora do contexto da ficha.
- Sincronização retroativa entre um item de inventário da ficha (snapshot) e edições
  ou exclusões futuras do registro de catálogo que lhe deu origem — o snapshot nunca
  reflete mudanças posteriores no catálogo.