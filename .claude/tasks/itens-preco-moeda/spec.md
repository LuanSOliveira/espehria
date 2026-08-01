# Spec: Itens - Preço numérico e Moeda

## Pedido original
Alteração nas 5 entidades do menu "ITENS" (Equipamentos, Materiais, Consumíveis, Munições, Utilitários), que compartilham a mesma estrutura.

Backend (app-api):
- Alterar a propriedade `price` nas 5 entidades para valor numérico (hoje é `@Column({ type: 'varchar', nullable: true }) price!: string | null;`).
- Adicionar nova propriedade `moeda` nas 5 entidades, referenciando uma nova tabela auxiliar (lookup) via ManyToOne, com os 4 valores fixos seedados.
- Gerar migrations: alteração da coluna price + nova tabela de moedas + colunas de FK nas 5 tabelas + seed dos 4 valores.
- Atualizar DTOs, controllers, services e documentação Swagger das 5 entidades.
- Expor endpoint de listagem de moedas para o autocomplete do front.

Frontend (app-web):
- Nos formulários de cadastro/edição das 5 entidades, adicionar autocomplete de "Moeda" carregando opções da API.
- Ajustar o campo "preço" para input numérico.
- Na visualização/listagem de cada entidade, apresentar a moeda junto ao preço (ex.: "100 PO - Ouro").
- Ajustar o layout do formulário: "Descrição" e "Informações Privadas" ocupam a linha inteira (full width), e "Informações Privadas" fica posicionado ABAIXO de "Descrição".

## Perguntas e respostas
As lacunas identificadas na análise inicial foram esclarecidas diretamente com o usuário antes da formalização deste spec:

- P: Como deve ser modelada a entidade auxiliar de moeda — texto único pronto (ex.: "PO - Ouro") ou campos separados? → R: Campos separados: `abbreviation` (ex.: "PO") e `name` (ex.: "Ouro"). O texto combinado é composto na apresentação (frontend), não armazenado pronto no banco.
- P: É necessário construir uma tela de CRUD de moedas no frontend? → R: Não. Apenas uma migration de seed dos 4 valores fixos (PC - Cobre, PP - Prata, PO - Ouro, PL - Platina) e um endpoint de listagem, seguindo o mesmo padrão já usado pela entidade `attributes` no projeto (lookup somente leitura, sem tela de gestão).
- P: O que fazer com valores já existentes na coluna `price` (varchar) que não sejam numéricos, ao migrar para `integer`? → R: Podem ser descartados, virando `NULL` na migration. É base de desenvolvimento, sem dados de produção a preservar.
- P: O preço deve aceitar casas decimais? → R: Não. Preço é somente valor inteiro — coluna `integer` no banco e input do frontend sem casas decimais.
- P: `price` e a nova `moeda` são obrigatórios? → R: `price` continua opcional (nullable). Quando `price` for informado, `moeda` passa a ser obrigatória (validação condicional no DTO do backend e no schema zod do formulário do frontend). Se `price` não for informado, `moeda` pode ficar vazia.
- P: Como exibir preço e moeda quando apenas um dos dois estiver preenchido? → R: Exibir somente o valor disponível (ex.: só o número, ou só a moeda) — nunca um texto do tipo "Não informado" para o campo ausente nesse cenário combinado.
- P: Os filtros de listagem (`<X>FilterSection`) das 5 entidades devem ganhar filtro por moeda ou faixa de preço? → R: Não. Os `FilterSection` de cada entidade permanecem inalterados nesta demanda.

## Escopo confirmado

### Regra de negócio central
- O campo de preço passa a ser um valor numérico inteiro (sem casas decimais), continuando opcional.
- É criada uma nova entidade de referência (lookup) para moeda, com dois campos textuais: uma abreviação (ex.: "PO") e um nome (ex.: "Ouro"). Essa entidade possui exatamente 4 registros fixos, cadastrados via seed, sem tela de gestão no frontend: PC/Cobre, PP/Prata, PO/Ouro, PL/Platina.
- Cada uma das 5 entidades de item (Equipamentos, Materiais, Consumíveis, Munições, Utilitários) passa a referenciar opcionalmente um registro de moeda.
- Regra de obrigatoriedade condicional: se o preço for informado (não nulo/vazio), a moeda torna-se obrigatória para aquele registro. Se o preço não for informado, a moeda pode ficar em branco. Essa regra deve ser validada tanto na entrada de dados do backend quanto no formulário do frontend.
- Migração de dados: valores atualmente armazenados no campo de preço (texto livre) que não sejam numéricos inteiros válidos são descartados (tornam-se nulos) na migração de esquema, sem necessidade de preservação ou tratamento especial, por se tratar de ambiente de desenvolvimento sem dados de produção.

### Escopo no backend (app-api)
Aplica-se igualmente às 5 entidades: Equipamentos, Materiais, Consumíveis, Munições e Utilitários (mesma estrutura de campos hoje: nome, imagem de referência, descrição, preço, informações privadas, tags).

- Nova entidade de referência de moeda, seguindo o mesmo padrão estrutural já usado pela entidade de atributos (lookup simples estendendo a entidade base do projeto, sem paginação, sem CRUD de escrita), com os dois campos textuais (abreviação e nome).
- Novo endpoint de listagem somente leitura desta entidade de moeda, para consumo do autocomplete do frontend, seguindo o mesmo padrão de exposição já usado para atributos (rota autenticada, retorno simples em lista, sem paginação).
- Em cada uma das 5 entidades de item:
  - O campo de preço passa de texto livre para valor numérico inteiro, continuando opcional (nulo permitido).
  - É adicionada uma referência opcional (muitos-para-um) para a nova entidade de moeda.
- Migrações de banco de dados cobrindo: alteração do tipo da coluna de preço nas 5 tabelas (com descarte de valores não numéricos existentes), criação da nova tabela de moeda, criação das colunas de referência de moeda nas 5 tabelas, e seed dos 4 valores fixos de moeda.
- Atualização dos objetos de entrada (criação e edição) das 5 entidades para: aceitar preço como número inteiro opcional; aceitar identificador de moeda opcional; aplicar a validação condicional (moeda obrigatória quando preço informado) — tanto na criação quanto na edição.
- Atualização dos objetos de resposta (detalhe e, quando aplicável, item de listagem) das 5 entidades para expor o preço numérico e os dados da moeda associada (abreviação e nome), incluindo os casos em que apenas um dos dois esteja preenchido ou nenhum deles.
- Atualização da documentação Swagger de todos os endpoints afetados (criação, edição, detalhe, listagem) das 5 entidades, refletindo os novos tipos, obrigatoriedade condicional e o novo campo de moeda, além da documentação do novo endpoint de listagem de moedas.

### Escopo no frontend (app-web)
Aplica-se igualmente às 5 páginas de itens (Equipamentos, Materiais, Consumíveis, Munições, Utilitários), cada uma com seu formulário de criação/edição, sua visualização de detalhe e sua listagem.

- Formulário de criação/edição de cada uma das 5 entidades:
  - Campo de preço passa a ser um input numérico, sem casas decimais.
  - Novo campo de autocomplete de "Moeda", com opções carregadas do endpoint de listagem de moedas, seguindo o mesmo padrão já usado para o autocomplete de atributos.
  - Validação condicional no schema do formulário: moeda obrigatória sempre que o preço for informado.
  - Ajuste de layout: os campos "Descrição" e "Informações Privadas" passam a ocupar a linha inteira do formulário (full width), com "Informações Privadas" posicionado abaixo de "Descrição" (hoje ambos ficam lado a lado, na mesma linha).
- Visualização de detalhe de cada uma das 5 entidades: exibição combinada de preço e moeda (ex.: "100 PO - Ouro"), sendo que quando apenas o preço ou apenas a moeda estiver preenchido, exibe-se somente o valor disponível, sem texto de "Não informado" para a parte ausente nesse cenário combinado.
- Listagem de cada uma das 5 entidades: exibição da combinação de preço e moeda, seguindo a mesma regra de exibição parcial acima.
- Os componentes de filtro de listagem de cada uma das 5 entidades permanecem inalterados nesta demanda (sem filtro por moeda ou faixa de preço).

### Fora de escopo
- Qualquer tela de cadastro, edição ou exclusão de moedas (CRUD de moeda) no frontend.
- Alterações nos componentes de filtro (`<X>FilterSection`) das 5 entidades.
- Preservação de valores de preço não numéricos previamente cadastrados.
- Suporte a valores decimais/fracionários de preço.