# Spec: Propriedades de Escudos

## Pedido original
Adicionar 7 propriedades à entidade Escudos (seção ITENS > EQUIPAMENTOS do menu), tanto em app-api quanto em app-web:

- **Apelido**: texto livre.
- **Volume**: numérico, 1 casa decimal, mínimo 0.
- **Bônus de CA**: inteiro, mínimo 0.
- **Penalidade de Velocidade (Metros)**: numérico, 1 casa decimal, mínimo 0.
- **Dureza**: inteiro, mínimo 0.
- **Pontos de Vida**: inteiro, mínimo 0.
- **Limiar de Quebra**: inteiro.

## Perguntas e respostas

- P: O campo Limiar de Quebra é informado livremente pelo usuário ou é calculado a partir de outro campo? Caso seja calculado, onde deve ser calculado (backend ou frontend) e ele deve ser persistido? → R: É persistido no backend. É calculado e validado no backend ao salvar/atualizar como `floor(Pontos de Vida / 2)`, e retornado nas respostas da API. No formulário do frontend, o campo é desabilitado/somente leitura, exibindo o valor calculado dinamicamente a partir de Pontos de Vida durante a edição em tela, e o valor real vindo da API ao carregar um registro existente. O cliente não pode definir esse valor arbitrariamente.

- P: Qual deve ser o comportamento do Limiar de Quebra quando Pontos de Vida está vazio/nulo? → R: Deve exibir/persistir 0, tanto no cálculo do backend ao salvar com Pontos de Vida vazio/nulo quanto na exibição no formulário e no modal de visualização.

- P: Todos os 7 campos novos são obrigatórios ou opcionais? → R: Todos são opcionais/nullable, seguindo exatamente o padrão já adotado em Armaduras.

- P: Os campos numéricos aceitam valores negativos? → R: Não. Mínimo 0 para todos os campos numéricos, incluindo Dureza e Pontos de Vida.

- P: A listagem e os filtros de Escudos devem ser alterados para incluir os novos campos? → R: Não. A listagem (`ShieldsListItem`, tabela de listagem) e a seção de filtros (`ShieldsFilterSection`) não devem ser alteradas. Os campos novos ficam restritos ao formulário de cadastro/edição e ao modal de visualização, mesmo padrão adotado em Armaduras.

- P: Qual a ordem/agrupamento de exibição dos campos no formulário, incluindo os já existentes? → R:
  1. Nome, Apelido, Imagem Referência e Tag
  2. Preço, Moeda, Volume
  3. Bônus de CA, Penalidade de Velocidade (Metros)
  4. Dureza, Pontos de Vida, Limiar de Quebra
  5. Descrição
  6. Informações Privadas

- P: O modal de visualização (view) de Escudos também deve exibir os novos campos? → R: Sim, todas as novas informações devem ser exibidas no modal de visualização.

## Escopo confirmado

A entidade Escudos passa a contar com 7 novas propriedades, todas opcionais:

- **Apelido**: texto livre, sem restrição de formato.
- **Volume**: valor numérico com 1 casa decimal, valor mínimo permitido 0.
- **Bônus de CA**: valor inteiro, valor mínimo permitido 0.
- **Penalidade de Velocidade (Metros)**: valor numérico com 1 casa decimal, valor mínimo permitido 0.
- **Dureza**: valor inteiro, valor mínimo permitido 0.
- **Pontos de Vida**: valor inteiro, valor mínimo permitido 0.
- **Limiar de Quebra**: valor inteiro. Não é preenchido diretamente pelo usuário: é derivado de Pontos de Vida através da fórmula "parte inteira da divisão de Pontos de Vida por 2" (arredondada para baixo). Quando Pontos de Vida estiver vazio ou nulo, o Limiar de Quebra deve valer 0. Esse valor é determinado e mantido como fonte da verdade pela API — o cliente não define esse valor livremente. No formulário de cadastro/edição, o campo aparece desabilitado, mostrando o valor calculado dinamicamente a partir do que estiver preenchido em Pontos de Vida durante a edição em tela, e refletindo o valor vindo da API ao carregar um registro existente para edição.

Todos os 7 campos novos são opcionais em toda a aplicação (cadastro e edição podem ser salvos sem preenchê-los).

O formulário de cadastro/edição de Escudos deve exibir os campos, novos e existentes, na seguinte ordem/agrupamento:

1. Nome, Apelido, Imagem Referência e Tag
2. Preço, Moeda, Volume
3. Bônus de CA, Penalidade de Velocidade (Metros)
4. Dureza, Pontos de Vida, Limiar de Quebra
5. Descrição
6. Informações Privadas

O modal de visualização de um Escudo deve exibir todas as 7 novas informações, além das já existentes.

Fora do escopo desta demanda: qualquer alteração na listagem de Escudos (colunas exibidas na tabela) e na seção de filtros de busca de Escudos — ambas permanecem inalteradas.

O comportamento e os padrões de validação (opcionalidade, formato numérico, casas decimais, valores mínimos) devem seguir o mesmo modelo já adotado anteriormente para a entidade Armaduras, tanto na API quanto na interface web.
