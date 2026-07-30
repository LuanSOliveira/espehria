# Spec: Adição da propriedade "tipo" em Tags

## Pedido original
Preciso atualizar a entidade de "tags" adicionando uma propriedade chamada "tipo".
- No app-api: adicionar o campo "tipo" na entidade Tag existente. Deve ser um campo de texto livre (string), com a migration correspondente e ajustes de DTOs/controller/service conforme necessário para suportar esse novo campo (criação, edição, filtro por tipo).
- No app-web: a propriedade "tipo" deve ser exibida como coluna na listagem de tags, e deve ser adicionada a opção de filtrar tags por tipo na seção de filtros da página de tags.

## Perguntas e respostas
- P: Qual deve ser o nome do campo (em português "tipo" ou em inglês "type", consistente com os campos existentes `name`/`color` da entidade)? → R: Nome do campo é `type` (em inglês), aplicado à coluna do banco, propriedade da entidade, DTOs e payload da API. No app-web, o label exibido ao usuário deve ser "Tipo" (pt-BR).
- P: O campo é obrigatório ou opcional? Caso obrigatório, como tratar os registros de tags já existentes (backfill)? → R: Campo opcional (nullable). Não haverá backfill dos registros existentes.
- P: Existe um tamanho máximo esperado para o campo? → R: `varchar(100)`.
- P: Como deve funcionar o filtro por tipo (busca exata ou parcial, case-sensitive ou não)? → R: Busca parcial case-insensitive via ILIKE `%valor%`, exatamente igual ao comportamento já existente do filtro por `name` no service de tags.
- P: O campo deve ser incluído no formulário de criação/edição de tags no app-web? → R: Sim, incluir input de `type` no formulário de criação/edição de tags, funcionando tanto para criação quanto para edição. Campo opcional no formulário (pode ser enviado vazio).
- P: Como exibir o valor na listagem quando o tipo estiver vazio/nulo? → R: Exibir `-` na célula da coluna.

## Escopo confirmado

Afeta ambos os apps (`app-api` e `app-web`).

### Backend (app-api)
- A entidade Tag passa a ter um novo campo `type`, de texto livre, opcional (nullable), com tamanho máximo de 100 caracteres.
- É necessária uma migration de banco de dados para adicionar essa coluna na tabela de tags, sem backfill dos registros existentes (valor permanece nulo para tags já cadastradas).
- O campo `type` deve poder ser informado na criação de uma tag e alterado na edição de uma tag, sendo opcional em ambos os casos (é permitido criar/editar uma tag sem informar `type`).
- O campo `type` deve ser retornado na resposta da API ao consultar tags (individualmente e em listagem).
- A listagem de tags deve suportar filtro por `type`, com busca parcial e case-insensitive (mesma regra hoje aplicada ao filtro por `name`), podendo ser combinado com o filtro existente por `name`.
- Não há novas regras de unicidade, formato específico (além do limite de tamanho) ou validação adicional sobre o conteúdo de `type`.

### Frontend (app-web)
- A listagem de tags passa a exibir uma nova coluna "Tipo".
  - Quando a tag não tiver `type` definido (nulo ou vazio), a célula deve exibir `-`.
- A seção de filtros da página de tags passa a ter um campo para filtrar tags por "Tipo", seguindo o mesmo padrão de interação do filtro por "Nome" já existente (preenchimento do campo e submissão do filtro).
- O formulário de criação/edição de tags passa a ter um campo "Tipo", opcional, disponível tanto no fluxo de criação quanto no de edição de uma tag existente. O campo pode ser deixado em branco.
- Não há mudanças de comportamento em outras áreas da tela de tags (ordenação, paginação, exclusão, mensagens de sucesso/erro além do necessário para refletir o novo campo).

### Fora de escopo
- Qualquer alteração em entidades relacionadas que hoje referenciam tags (ex.: tags de criaturas, locais, raças, eras, eventos, divindades) — o pedido é restrito à entidade Tag em si.
- Definição de uma lista fixa/enum de tipos possíveis — o campo é texto livre, sem lista predefinida de valores.
- Backfill ou migração de dados para tags já existentes.
- Qualquer regra de autorização ou visibilidade adicional além das já existentes para tags.
