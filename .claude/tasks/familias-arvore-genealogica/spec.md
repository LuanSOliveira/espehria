# Spec: Famílias e árvore genealógica

## Pedido original

Demanda completa para app-api + app-web:

### 1. Alterar a entidade "personagens" (characters)
- Remover a propriedade/relação de "parentesco" (vínculo personagem-a-personagem) por completo, tanto no backend (entidade, DTOs, controller/service) quanto no frontend (formulário, visualização).
- Adicionar nova propriedade `family`: vínculo ManyToOne de Character para Family (vários personagens podem pertencer à mesma família). Selecionável a partir da listagem de famílias cadastradas, no formulário de cadastro/edição de personagem.

### 2. Criar nova entidade "famílias" (families) — CRUD completo (API + Web)
Nova página "Famílias" no app-web, dentro da seção de navegação "Mundo" (mesma seção de outras entidades de mundo já existentes — replicar o padrão da Sidebar/NAV_SECTIONS atual).

Listagem deve ter: filtro por nome; cada item com ações de visualizar, editar e deletar (padrão já usado em outras entidades, ex. `usuarios`).

Campos da entidade Family (`*` = obrigatório):
- `referenceImage` — Imagem Referência: campo de texto comum (URL da imagem).
- `name`* — Nome: campo de texto comum.
- `classification`* — Classificação: autocomplete com opções fixas: Real, Nobreza, Plebe.
- `tags` — Tags: usar o componente de input de tags já existente e reaproveitado em outros formulários.
- `description` — Descrição: campo de texto com controle de formatação (rich text), igual ao já usado em personagens/divindades/organizações.
- Árvore genealógica (genealogy tree): componente interativo tipo "quadro" (board) onde se posicionam cards de personagens já cadastrados e se criam vínculos de parentesco entre eles.

### 3. Comportamento da árvore genealógica
- No cadastro de nova família, o quadro começa em branco, com apenas um botão para "adicionar membro".
- Ao adicionar um membro, seleciona-se um personagem já cadastrado (autocomplete/busca) e aparece um card com foto + nome do personagem no quadro.
- A partir de cada card deve ser possível criar vínculos de parentesco (pai/mãe, filho, cônjuge) para outros cards já no quadro.
- Ao salvar a família, o sistema percorre os personagens presentes na árvore e atualiza a propriedade de família de cada um deles.
- Fluxo inverso: se um personagem for editado diretamente e receber uma família atribuída (sem estar posicionado na árvore ainda), ele deve aparecer na tela de edição da família como card "solto" (sem vínculo definido), para o usuário posicionar.
- Se um personagem for removido da família (pela edição do próprio personagem ou removendo o card na árvore), seu card deve ser removido/desvinculado da árvore, e a propriedade de família do personagem limpa quando a remoção partir da árvore.
- Todas as edições da árvore só são permitidas na tela de cadastro/edição de família. Nas telas de visualização de família e de visualização de personagem, a árvore aparece em modo somente leitura (view-only), sem interações de edição.

### 4. Modal de visualização de "família"
- Imagem em formato quadrado.
- Ao lado da imagem: nome da família; abaixo do nome, as tags; abaixo das tags, a classificação.
- Abaixo da imagem/nome: quadro com a descrição.
- Abaixo da descrição: o quadro da árvore genealógica em modo apenas visualização.

### 5. Ajustes na visualização (view) do personagem
- Remover a seção que hoje apresenta o "parentesco".
- Ajustar a seção de "organização" para ocupar toda a largura da linha (já que a seção ao lado deixará de existir).
- Abaixo da seção de organizações, adicionar o quadro de árvore genealógica em modo apenas visualização (mostrando a família do personagem, se houver).

### 6. Integração com busca (search.controller)
Registrar a nova entidade "families" na busca genérica, replicando o padrão das entidades existentes (personagens, organizações, divindades), tanto no backend quanto no frontend.

### Observações do usuário
- Seguir rigorosamente os padrões já estabelecidos no projeto (CLAUDE.md e skills disponíveis).
- Textos voltados ao usuário (labels, validações, toasts) em pt-BR; nomes de propriedades/entidades no código em inglês.

## Perguntas e respostas

- P: Qual biblioteca usar para o quadro/árvore interativa, já que não há nenhuma lib de diagramação node-based instalada no app-web? → R: Usar `@xyflow/react` (React Flow). O usuário está ciente de que precisará rodar `npm install @xyflow/react` manualmente no app-web, pois os agentes de execução não têm acesso a terminal/Bash.

- P: Os dados existentes da tabela `character_kinships` devem ser migrados para a nova estrutura ou a tabela deve ser dropada? → R: Dropar a tabela na migration. O usuário fará backup/dump manualmente antes de rodar a migration.

- P: Um personagem pertencendo a apenas uma família (ManyToOne) impede representar cônjuge vindo de outra família. Aceitar essa limitação? → R: NÃO aceitar a limitação. Adicionar uma segunda propriedade ao personagem: `secondaryFamily` (Família Secundária), também ManyToOne para Family, além da `family` (família primária). Isso permite que um personagem apareça em até duas árvores genealógicas. Regras de negócio confirmadas:
  - Ao salvar uma família e percorrer os personagens da árvore: se o personagem ainda não tem `family` definida, define `family` = esta família. Se o personagem já tem uma `family` diferente desta (ex.: cônjuge vindo de outra família), define `secondaryFamily` = esta família, sem sobrescrever a `family` primária. Se o personagem já é `family` ou `secondaryFamily` desta família, não faz nada.
  - Ao remover o personagem da árvore desta família, limpar o campo (`family` ou `secondaryFamily`) que apontar para esta família.
  - O formulário de personagem deve permitir definir/editar `family` e `secondaryFamily` diretamente (ambos autocomplete de famílias cadastradas), não só via árvore.
  - Os vínculos de parentesco (pai/filho/cônjuge) continuam sendo por família — pertencem à tabela de relacionamentos daquela família específica. Um personagem em duas árvores tem vínculos independentes em cada uma.

- P: A modelagem das arestas da árvore deve ser em duas tabelas? → R: Sim. Uma tabela de membros da família (family_id, character_id, posição x/y do card no quadro) e uma tabela de relacionamentos (family_id, personagem origem, personagem destino, tipo do vínculo), seguindo o precedente da tabela de membros de organização já existente no projeto.

- P: O tipo de vínculo deve distinguir pai de mãe? → R: Não. Usar um tipo `PARENT` genérico, já que não existe campo de sexo/gênero na entidade Character.

- P: Como armazenar as direções dos vínculos? → R: `PARENT` armazenado apenas na direção pai/mãe → filho, sendo "filho" derivado como inverso (não gravar as duas direções). `SPOUSE` gravado uma única vez, sem duplicar A→B e B→A.

- P: A classificação da família deve ser tabela de categoria (como divindades/raças/criaturas) ou enum fixo? → R: Enum fixo, sem CRUD e sem tabela de categoria. Coluna com as 3 opções fixas (Real, Nobreza, Plebe) e autocomplete no front com essas opções.

## Escopo confirmado

**Personagens (characters) — remoção de parentesco direto e novos vínculos de família**
- A relação de parentesco personagem-a-personagem existente (hoje representada pela tabela `character_kinships`) é removida por completo do backend (entidade, DTOs, controller, service) e do frontend (formulário e visualização). A tabela correspondente no banco é dropada via migration, sem migração de dados — o backup, se desejado, é de responsabilidade do usuário fora deste processo.
- São adicionadas duas novas propriedades ao personagem, ambas relações do tipo muitos-para-um em direção a Família: `family` (família primária) e `secondaryFamily` (família secundária). Ambas são opcionais e permitem que um mesmo personagem esteja associado a até duas famílias distintas (por exemplo, sua família de origem e a família adquirida por casamento).
- O formulário de cadastro/edição de personagem passa a permitir a seleção direta de `family` e de `secondaryFamily`, cada uma via campo de busca/seleção (autocomplete) sobre as famílias já cadastradas, independentemente de qualquer interação com a árvore genealógica.

**Nova entidade: Família (Family) — CRUD completo**
- Nova entidade com os campos:
  - `referenceImage` (opcional): texto livre representando a URL da imagem de referência.
  - `name` (obrigatório): nome da família.
  - `classification` (obrigatório): valor fixo dentre três opções pré-definidas — Real, Nobreza, Plebe — sem suporte a cadastro/edição dessas opções (não há tabela de categorias associada).
  - `tags` (opcional): lista de tags, reaproveitando o componente de tags já usado em outros formulários do sistema.
  - `description` (opcional): texto com formatação rica (rich text), no mesmo padrão já usado em personagens, divindades e organizações.
  - Árvore genealógica: conjunto de personagens (membros) posicionados em um quadro interativo, com vínculos de parentesco entre eles.
- CRUD completo tanto na API quanto no frontend, com página própria "Famílias" inserida na mesma seção de navegação "Mundo" que já reúne as demais entidades desse domínio, seguindo o padrão de estrutura de navegação já existente.
- A listagem de famílias oferece filtro por nome e, para cada item, ações de visualizar, editar e excluir, no mesmo padrão já adotado em outras listagens do sistema (ex.: usuários).

**Modelagem dos dados da árvore genealógica**
- Os membros de uma família (quais personagens fazem parte da árvore e a posição de cada card no quadro) são armazenados em uma estrutura de dados própria, associando família, personagem e coordenadas de posição do card, seguindo o mesmo padrão já adotado para membros de organização.
- Os vínculos de parentesco entre membros de uma mesma família são armazenados em uma estrutura de dados separada, associando a família, o personagem de origem, o personagem de destino e o tipo de vínculo.
- Os tipos de vínculo suportados são: `PARENT` (relação pai/mãe → filho, genérica, sem distinção de sexo/gênero, já que a entidade Character não possui esse atributo) e `SPOUSE` (relação de cônjuge).
- Cada vínculo `PARENT` é armazenado uma única vez, na direção do responsável (pai/mãe) para o dependente (filho); a relação inversa ("é filho de") é obtida a partir do mesmo registro, sem duplicação de dados. Cada vínculo `SPOUSE` também é armazenado uma única vez, sem duplicar o par em ambas as direções.
- Os vínculos de parentesco são sempre específicos de uma família: um personagem presente em duas árvores (via `family` e `secondaryFamily`) possui conjuntos de vínculos totalmente independentes em cada uma delas.

**Comportamento funcional da árvore genealógica (nas telas de família)**
- No cadastro de uma nova família, o quadro da árvore inicia vazio, com uma ação disponível para adicionar um membro.
- Ao adicionar um membro, o usuário busca e seleciona um personagem já cadastrado; o personagem passa a ser exibido no quadro como um card contendo sua foto e nome.
- A partir de cada card é possível criar vínculos de parentesco (`PARENT` ou `SPOUSE`) com outros cards já presentes no mesmo quadro.
- Ao salvar a família, o sistema percorre todos os personagens presentes na árvore e atualiza a propriedade de família de cada um segundo a seguinte regra: se o personagem ainda não possui `family` definida, ela passa a ser esta família; se o personagem já possui uma `family` diferente desta (por exemplo, um cônjuge oriundo de outra família), esta família passa a ser sua `secondaryFamily`, sem alterar a `family` já existente; se o personagem já está associado a esta família em `family` ou `secondaryFamily`, nenhuma alteração é feita nesse campo.
- Fluxo inverso: quando um personagem é editado diretamente e recebe uma `family` ou `secondaryFamily` sem estar posicionado na respectiva árvore, ele passa a aparecer na tela de edição daquela família como um card "solto", sem vínculos de parentesco definidos, cabendo ao usuário posicioná-lo e, se desejar, criar vínculos.
- Quando um personagem deixa de pertencer a uma família — seja por remoção do card diretamente na árvore, seja pela edição do próprio personagem removendo a referência à família — o campo correspondente do personagem (`family` ou `secondaryFamily`, conforme qual apontava para aquela família) é limpo. Quando a remoção parte da árvore, o card do personagem é removido/desvinculado do quadro daquela família.
- Toda edição da árvore (adicionar/remover membros, criar/remover vínculos, reposicionar cards) só é permitida nas telas de cadastro e edição de família. Nas telas de visualização de família e de visualização de personagem, a árvore é exibida em modo somente leitura, sem qualquer interação de edição.

**Modal de visualização de família**
- Exibe a imagem de referência em formato quadrado.
- Ao lado da imagem, exibe o nome da família; abaixo do nome, as tags; abaixo das tags, a classificação.
- Abaixo do bloco imagem/nome/tags/classificação, exibe um quadro com a descrição.
- Abaixo da descrição, exibe a árvore genealógica em modo apenas visualização.

**Ajustes na visualização (view) do personagem**
- A seção que hoje exibe o parentesco do personagem é removida.
- A seção de organizações passa a ocupar toda a largura da linha em que está inserida, já que a seção adjacente deixa de existir.
- Abaixo da seção de organizações, é adicionado o quadro da árvore genealógica em modo apenas visualização, exibindo a família à qual o personagem pertence, quando houver.

**Integração com a busca genérica**
- A entidade Família é registrada na funcionalidade de busca genérica do sistema, tanto no backend quanto no frontend, seguindo o mesmo padrão já utilizado para as entidades de personagens, organizações e divindades.

**Convenções gerais**
- Toda a implementação segue os padrões arquiteturais e de convenção já estabelecidos no repositório para app-api e app-web.
- Textos voltados ao usuário final (rótulos, mensagens de validação, notificações) são escritos em português (pt-BR); nomes de propriedades e entidades no código permanecem em inglês.
