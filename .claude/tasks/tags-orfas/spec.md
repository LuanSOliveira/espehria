# Spec: Tags órfãs (perda silenciosa de tagIds fora da paginação)

## Pedido original
Nos formulários de criação/edição das entidades que possuem campo de tags, o
`FormMultiAutocompleteInput` busca as opções de tag limitando a busca a
`perPage: 100`. Tags atribuídas a uma entidade que estejam fora desse recorte
de 100 registros ficam sem opção correspondente carregada no componente. Como
o `value` exibido pelo Autocomplete é derivado apenas das opções carregadas, e
o `onChange` sobrescreve o array inteiro do campo do formulário, qualquer
edição de chips (adicionar ou remover uma tag) acaba apagando silenciosamente
esses ids do estado do formulário — truncando o `tagIds` efetivamente enviado
à API na atualização/criação da entidade. É uma perda silenciosa de dados.

Pedido: corrigir esse comportamento.

## Perguntas e respostas
- P: Qual abordagem deve ser adotada para corrigir o problema — aumentar/
  remover o limite de paginação da busca de opções de tag, preservar no
  estado do formulário os ids de tags já atribuídas mesmo que não estejam
  entre as opções carregadas, ou implementar busca incremental (server-side
  search) por texto no autocomplete? → R: Aumentar a busca. Parar de limitar
  a `perPage: 100` na busca de opções de tag usada pelo
  `FormMultiAutocompleteInput` — buscar todas as tags existentes de uma vez.
  Não implementar preservação de ids órfãos no estado do formulário. Não
  implementar busca incremental por texto (server-side search). Apenas
  aumentar/remover o limite de paginação da busca de opções de tag.
- P: A correção deve valer apenas para o uso atual do
  `FormMultiAutocompleteInput` com tags (nos formulários das entidades
  afetadas), ou o componente deve ser generalizado para lidar com esse
  cenário em qualquer uso futuro (outros tipos de opção paginada)? → R:
  Confirmado que a correção vale apenas para o uso atual com tags, nos
  formulários das entidades afetadas. Não é necessário generalizar o
  `FormMultiAutocompleteInput` para outros casos de uso.
- P: É necessário algum feedback visual (loading, aviso) enquanto as opções
  de tag são carregadas, considerando que a lista completa pode ser maior do
  que antes? → R: Não se aplica. Como a abordagem escolhida é aumentar a
  busca (não preservar ids órfãos), não haverá nenhuma UI extra para tratar
  ids órfãos.
- P: Caso uma tag atribuída a uma entidade tenha sido de fato excluída do
  banco (não é apenas um problema de paginação, a tag não existe mais), qual
  deve ser o comportamento? Preservar o id mesmo sem opção correspondente,
  ou descartá-lo do estado do formulário? → R: Descartar. Não preservar nem
  reenviar ids de tags que não existem mais. Esse é um caso raro residual
  (já que a busca ampliada trará todas as tags existentes) e o comportamento
  atual do componente — que já não inclui esses ids no `value` exibido — é
  aceitável para esse cenário.

## Escopo confirmado

### Comportamento esperado
A busca de opções de tag usada pelo `FormMultiAutocompleteInput` nos
formulários de criação/edição das entidades afetadas deve trazer todas as
tags existentes no sistema, sem o limite de paginação de `perPage: 100`
atualmente aplicado. Com isso, qualquer tag já atribuída a uma entidade
sempre terá uma opção correspondente carregada no componente, eliminando o
cenário em que uma edição de chips sobrescreve o campo do formulário e
descarta silenciosamente ids de tags válidas que estavam fora do recorte de
100 registros.

Não faz parte do escopo:
- Preservar no estado do formulário ids de tags que não estejam entre as
  opções carregadas (ids órfãos).
- Implementar busca incremental por texto (server-side search) no
  autocomplete de tags.
- Qualquer feedback visual adicional (loading, aviso) relacionado a esse
  ajuste.
- Generalizar o `FormMultiAutocompleteInput` para outros casos de uso além
  de tags.

Caso uma tag atribuída a uma entidade tenha sido efetivamente excluída do
banco (não exista mais), o comportamento atual do componente é mantido: o id
dessa tag não aparece no `value` exibido e não é reenviado à API. Esse
comportamento é aceito como residual e não requer tratamento adicional.

### Abrangência
A correção deve ser aplicada em todos os pontos do app-web onde a busca de
opções de tag para o `FormMultiAutocompleteInput` está limitada por
paginação, incluindo os formulários de criação/edição das entidades com
campo de tags e o filtro de tags na tela de fichas.

### Fora de escopo
- app-api: nenhuma alteração no backend é necessária para esta demanda.
- Persistência ou ordenação de tags: não faz parte desta demanda (tratado em
  demanda anterior, `tags-ordem-insercao`).
