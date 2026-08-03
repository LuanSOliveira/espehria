# Spec: Melhorias e Defeitos em Talentos, Treinamentos e Características

## Pedido original

Preciso implementar uma nova funcionalidade no monorepo (app-api + app-web) das entidades de Talentos, Treinamentos e Características.

### Requisito
Adicionar duas novas propriedades de listagem a essas três entidades: "Melhorias" e "Defeitos".

#### Comportamento no formulário de cadastro/edição (app-web)
- Abaixo do campo Descrição e acima de "Habilidades Adicionais", adicionar duas colunas: "Melhorias" e "Defeitos" — seguindo o mesmo padrão visual/estrutural já usado para "Aprimorado de" e "Requisitos" (colunas lado a lado com listagem + botão de adicionar).
- Cada coluna tem um botão: "Adicionar Melhoria" / "Adicionar Defeito".
- Ao clicar em qualquer um dos botões, abre um modal (o MESMO modal/formulário é reutilizado tanto para melhoria quanto para defeito — provavelmente diferenciado por um parâmetro de "tipo" passado ao abrir) com os campos:
  - **Valor**: input numérico inteiro, valor mínimo 1.
  - **Tipo**: Autocomplete alimentado por uma tabela auxiliar "tipo melhoria defeito", com as opções fixas via seed: "Ataque" e "Teste de Resistência".
  - **Propriedade**: Autocomplete alimentado por uma tabela auxiliar "propriedade melhoria defeito", com as opções fixas via seed: "Ataque Corpo-a-Corpo", "Ataque a Distância", "Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma".
  - Todos os campos são obrigatórios.
  - Botão "Adicionar" no formulário do modal.
- Ao adicionar, o item entra na lista correspondente (Melhorias ou Defeitos) apresentado como um card com as informações (valor, tipo, propriedade) e uma opção para excluir o item da lista.

#### Comportamento no modal de visualização (app-web)
- As listas de Melhorias e Defeitos devem também ser exibidas (somente leitura) logo abaixo da Descrição no modal de visualização de Talento/Treinamento/Característica.

#### Backend (app-api)
- Duas tabelas auxiliares (seed, não editáveis via CRUD de usuário) para os tipos fixos: "tipo melhoria defeito" (Ataque, Teste de Resistência) e "propriedade melhoria defeito" (Ataque Corpo-a-Corpo, Ataque a Distância, Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma).
- Entidades/tabelas para armazenar os itens de Melhoria e Defeito associados a cada Talento/Treinamento/Característica (valor, referência ao tipo, referência à propriedade, referência à entidade pai e um discriminador se for melhoria ou defeito — avalie a melhor modelagem, ex. uma tabela única "melhoria_defeito" com um campo de categoria, ou duas tabelas separadas, seguindo os padrões já existentes no projeto para listas semelhantes como "Aprimorado de"/"Requisitos" se houver algo comparável).
- Necessário migrations TypeORM (nunca usar synchronize).
- Necessário DTOs, exposição via controller/service dos módulos de Talentos, Treinamentos e Características, e documentação Swagger.

## Perguntas e respostas

- P (resolvido por investigação, sem necessidade de pergunta ao usuário): Onde exatamente as colunas de Melhorias/Defeitos devem ser posicionadas no formulário e na view de Característica, já que essa entidade já tem "Aprimorado de"/"Requisitos"/"Habilidades Adicionais"? → R: Verificado no código (`CharacteristicCreateForm`, `CharacteristicView`) que a ordem atual é Descrição → Habilidades Adicionais → Aprimorado de/Requisitos. O pedido original já define a posição desejada (Descrição → Melhorias/Defeitos → Habilidades Adicionais), portanto não há ambiguidade de posicionamento a esclarecer com o usuário.
- P (resolvido por investigação, sem necessidade de pergunta ao usuário): Existe um padrão já estabelecido no projeto para tabelas auxiliares de seed (não editáveis via CRUD) que deva ser seguido para "tipo melhoria defeito" e "propriedade melhoria defeito"? → R: Sim, confirmado o padrão `Attribute`/`Currency`: entidade simples com `name`, migration de seed via `INSERT`, módulo com `GET` único não paginado protegido por `@GoogleAccess('read-only')`, consumido no frontend por hooks dedicados (`useAttributesQuery`, `useCurrenciesQuery`) alimentando `FormAutocompleteInput`.
- P (resolvido por investigação, sem necessidade de pergunta ao usuário): Existe um padrão já estabelecido no projeto para modelar listas de itens vinculadas a um pai que pode ser Talento, Treinamento ou Característica (pai polimórfico)? → R: Sim, confirmado o módulo `app-api/src/modules/entity-links/` (entidade `EntityLink`, tabela `entity_links`), criado para a demanda anterior "Aprimorado de"/"Requisitos", usando "exclusive arc" (colunas FK anuláveis por tipo de entidade, todas com `ON DELETE CASCADE`, `CHECK num_nonnulls(...) = 1`) e validações de duplicidade/exclusividade em `EntityLinksService.validateLists` com mensagens em pt-BR. A escolha concreta da modelagem de Melhorias/Defeitos fica para a etapa de planejamento do backend, com liberdade (e recomendação) de reaproveitar esse padrão.
- P (A1/A2): É permitido que a mesma combinação de Tipo+Propriedade apareça mais de uma vez na mesma lista (Melhorias ou nos Defeitos) de um mesmo Talento/Treinamento/Característica? E é permitido que o mesmo par Tipo+Propriedade esteja simultaneamente em Melhorias e em Defeitos do mesmo registro? → R: Bloquear totalmente — a mesma combinação Tipo+Propriedade não pode repetir dentro da mesma lista (Melhorias ou Defeitos), e o mesmo par Tipo+Propriedade não pode estar simultaneamente em Melhorias e em Defeitos do mesmo registro. Mesma lógica de exclusividade/validação já existente entre "Aprimorado de" e "Requisitos" (`EntityLinksService.validateLists`) — reaproveitar o padrão de validação e o estilo de mensagens de erro em pt-BR.
- P (A3): Existe um valor máximo para o campo Valor, além do mínimo de 1? → R: Sem máximo — validar apenas mínimo 1 e número inteiro.
- P (A4): É possível editar um item de Melhoria/Defeito já adicionado à lista, ou apenas adicionar/remover? → R: Não há edição. Apenas adicionar e remover; corrigir um item significa removê-lo e adicioná-lo novamente.
- P (A5): As listas de Melhorias e Defeitos são obrigatórias ou é possível salvar o registro sem nenhum item em uma ou ambas? → R: Sim, ambas são opcionais — pode salvar Talento/Treinamento/Característica sem nenhum item, seguindo a convenção de "Aprimorado de"/"Requisitos".
- P (B6): Existe alguma restrição entre o Tipo selecionado e as opções de Propriedade disponíveis, ou todas as 8 propriedades ficam disponíveis independentemente do Tipo escolhido? → R: Há restrição, e o Autocomplete de Propriedade deve filtrar conforme o Tipo selecionado no modal: Tipo "Ataque" → apenas "Ataque Corpo-a-Corpo" e "Ataque a Distância"; Tipo "Teste de Resistência" → apenas os 6 atributos ("Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"). Essa restrição precisa ser validada também no backend, não apenas filtrada visualmente no frontend.
- P (C7): Em que ordem os cards de Melhoria/Defeito devem ser exibidos na lista (ordem de inserção, alfabética, por tipo, etc.)? → R: Ordem de inserção.
- P (C8): Qual o formato/layout exato do card que exibe valor, tipo e propriedade? → R: Não definido pelo usuário — o card deve exibir valor, tipo e propriedade em formato limpo e consistente com os cards já usados em "Aprimorado de"/"Requisitos" (ou padrão equivalente do projeto); o formato exato fica em aberto para a etapa de planejamento do frontend.
- P (D9): Qual nomenclatura deve ser usada na API para as listas e os campos dos itens (nomes em português ou inglês, singular ou plural)? → R: Confirmado — listas `improvements` e `flaws`; campos do item `value`, `type`, `property`.

## Escopo confirmado

### Escopo geral
Adicionar duas novas listas de itens — "Melhorias" (`improvements`) e "Defeitos" (`flaws`) — às entidades de Talentos, Treinamentos e Características, tanto no backend (app-api) quanto no frontend (app-web). Cada item de Melhoria ou Defeito possui um valor numérico, um tipo e uma propriedade, sendo os tipos e propriedades restritos a listas fixas cadastradas via seed no backend.

### Regras de negócio
1. Cada item de Melhoria/Defeito possui três campos, todos obrigatórios: Valor (número inteiro, mínimo 1, sem máximo), Tipo e Propriedade.
2. Tipo é selecionado a partir de uma lista fixa de seed com dois valores: "Ataque" e "Teste de Resistência".
3. Propriedade é selecionada a partir de uma lista fixa de seed com oito valores: "Ataque Corpo-a-Corpo", "Ataque a Distância", "Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma".
4. A Propriedade disponível depende do Tipo selecionado: Tipo "Ataque" restringe a Propriedade a "Ataque Corpo-a-Corpo" ou "Ataque a Distância"; Tipo "Teste de Resistência" restringe a Propriedade aos seis atributos ("Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"). Essa restrição deve ser garantida tanto na interface quanto no backend.
5. A mesma combinação de Tipo+Propriedade não pode se repetir dentro da mesma lista (Melhorias ou Defeitos) de um mesmo registro (Talento, Treinamento ou Característica).
6. O mesmo par Tipo+Propriedade não pode estar simultaneamente presente em Melhorias e em Defeitos do mesmo registro (exclusividade entre as duas listas, mesma lógica já aplicada entre "Aprimorado de" e "Requisitos").
7. Ambas as listas (Melhorias e Defeitos) são opcionais — um Talento, Treinamento ou Característica pode ser salvo sem nenhum item em uma ou em ambas as listas.
8. Não há edição de um item já adicionado à lista; a correção de um item se dá removendo-o e adicionando um novo em seu lugar.
9. A ordem de exibição dos itens dentro de cada lista (Melhorias e Defeitos) é a ordem de inserção.
10. As tabelas auxiliares de Tipo e Propriedade são alimentadas exclusivamente via seed e não são editáveis por meio de CRUD de usuário.

### Comportamento no formulário de cadastro/edição (app-web)
- Nos formulários de cadastro/edição de Talento, Treinamento e Característica, abaixo do campo Descrição e acima de "Habilidades Adicionais", devem ser exibidas duas colunas lado a lado: "Melhorias" e "Defeitos", seguindo o mesmo padrão visual/estrutural já usado para "Aprimorado de" e "Requisitos" (listagem de itens + botão de adicionar).
- Cada coluna possui um botão de ação: "Adicionar Melhoria" na coluna de Melhorias, "Adicionar Defeito" na coluna de Defeitos.
- Ao acionar qualquer um dos botões, é aberto um modal reutilizado entre os dois fluxos (Melhoria e Defeito), diferenciado internamente por um parâmetro indicando qual das duas listas está sendo alimentada.
- O modal contém os campos Valor (numérico inteiro, mínimo 1), Tipo (Autocomplete com as opções de seed) e Propriedade (Autocomplete cujas opções são filtradas conforme o Tipo selecionado), todos obrigatórios, e um botão "Adicionar".
- Ao confirmar a adição, o item passa a ser exibido como um card na lista correspondente (Melhorias ou Defeitos), contendo as informações de valor, tipo e propriedade, com uma opção de exclusão do item da lista.
- As validações de obrigatoriedade dos campos, valor mínimo, filtragem de Propriedade conforme Tipo, e as regras de não duplicidade/exclusividade entre listas (regras de negócio 4, 5 e 6) devem ser aplicadas na interface.

### Comportamento no modal de visualização (app-web)
- No modal de visualização (somente leitura) de Talento, Treinamento e Característica, as listas de Melhorias e Defeitos devem ser exibidas logo abaixo da Descrição, na mesma posição relativa definida para o formulário de cadastro/edição.
- A exibição é somente leitura, sem ações de adicionar ou remover itens.

### Requisitos para a etapa de planejamento do backend
- Criar duas tabelas auxiliares de seed (não editáveis via CRUD de usuário), seguindo o padrão já existente no projeto para tabelas auxiliares de seed (ex.: `Attribute`/`Currency`): uma para os tipos fixos ("Ataque", "Teste de Resistência") e outra para as propriedades fixas ("Ataque Corpo-a-Corpo", "Ataque a Distância", "Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"), populadas via migration de seed.
- Modelar e criar a(s) entidade(s)/tabela(s) responsáveis por armazenar os itens de Melhoria e Defeito associados a Talentos, Treinamentos e Características, contemplando: valor, referência ao tipo, referência à propriedade, referência à entidade pai (Talento, Treinamento ou Característica) e a distinção entre Melhoria e Defeito. A decisão de modelagem (tabela única com discriminador de categoria, tabelas separadas, ou reaproveitamento do padrão de pai polimórfico já existente no módulo de vínculos entre entidades usado para "Aprimorado de"/"Requisitos") fica a critério da etapa de planejamento do backend.
- Implementar a validação, também no backend, de que a Propriedade selecionada é compatível com o Tipo selecionado (regra de negócio 4), impedindo o registro de combinações inválidas independentemente da filtragem feita na interface. A forma concreta de implementar essa validação (ex.: vínculo direto entre as tabelas de tipo e propriedade, ou regra na camada de aplicação) fica em aberto para essa etapa decidir.
- Implementar, no backend, as validações de não duplicidade da combinação Tipo+Propriedade dentro da mesma lista e de exclusividade entre Melhorias e Defeitos de um mesmo registro (regras de negócio 5 e 6), reaproveitando o padrão de validação e mensagens de erro em pt-BR já usado para "Aprimorado de"/"Requisitos".
- Expor as listas de Melhorias e Defeitos via controller/service dos módulos de Talentos, Treinamentos e Características, com DTOs e documentação Swagger, usando a nomenclatura confirmada: listas identificadas como `improvements` e `flaws`, e campos de cada item identificados como `value`, `type` e `property`.
- Utilizar migrations TypeORM para todas as alterações de schema; `synchronize` não deve ser usado.

### Requisitos para a etapa de planejamento do frontend
- Posicionar as colunas de Melhorias e Defeitos no formulário de cadastro/edição e no modal de visualização de Talento, Treinamento e Característica, entre Descrição e Habilidades Adicionais, replicando o padrão visual/estrutural já usado para "Aprimorado de"/"Requisitos".
- Implementar um único modal reutilizável para adicionar itens de Melhoria e de Defeito, parametrizado pelo tipo de lista de destino, com campos Valor, Tipo (Autocomplete alimentado pela tabela auxiliar de tipos) e Propriedade (Autocomplete alimentado pela tabela auxiliar de propriedades, filtrado conforme o Tipo selecionado).
- Definir o layout/formato exato do card de exibição de cada item (valor, tipo, propriedade) e da ação de exclusão, mantendo consistência visual com os cards já usados em "Aprimorado de"/"Requisitos" ou padrão equivalente do projeto.
- Consumir a API respeitando o contrato de leitura/escrita definido: listas `improvements` e `flaws`, campos de item `value`, `type`, `property`.
- Exibir mensagens de validação e de erro em pt-BR, consistentes com o restante do projeto.

## Fora de escopo
- Edição de um item de Melhoria/Defeito já adicionado à lista (apenas adicionar e remover são suportados).
- Definição de valor máximo para o campo Valor.
- CRUD de usuário para as tabelas auxiliares de Tipo e Propriedade (essas tabelas são alimentadas exclusivamente via seed).
- Qualquer decisão de modelagem técnica, nomes de arquivos, classes, entidades ou funções — essas decisões pertencem às etapas de planejamento do backend e do frontend, não a este documento.
