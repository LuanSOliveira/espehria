# Spec: Ficha - Classe de Armadura e Salvamentos

## Pedido original

Na aba ESTATÍSTICAS da ficha, ao lado do quadro de ATRIBUTOS, adicionar dois novos quadros de propriedades. Disposição: Atributos | Classe de Armadura (à direita) e, abaixo de Classe de Armadura, Salvamentos.

### Quadro "Classe de Armadura"
- Um círculo com o valor da Classe de Armadura, visualmente similar ao círculo de modificador usado em Perícias. Valor inicial: 10.
- Ao lado do valor, um botão para exibir os bônus aplicados (mesmo padrão do botão de bônus de Perícias).
- Ao lado do botão de bônus, um input autocomplete com as 6 opções de atributos (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma), representando o "atributo chave" da Classe de Armadura. Deve iniciar com "Destreza" selecionado por padrão.
- O bônus de atributo aplicado à Classe de Armadura é definido pelo atributo chave selecionado (10 + modificador do atributo chave). Por enquanto esse é o único bônus aplicado à CA.
- Ao trocar o atributo chave no autocomplete, a Classe de Armadura deve ser recalculada e a escolha do atributo chave deve persistir no banco de dados.

### Quadro "Salvamentos"
- Similar ao quadro de Perícias: cards com nome, atributo chave, graduação (mesma dinâmica/valores de graduação já usados em Perícias), botão de informativo de bônus, e valor de modificador.
- Apenas 3 cards fixos, com atributos chave fixos (NÃO editáveis pelo usuário, diferente da CA): Fortitude → Constituição; Reflexo → Destreza; Vontade → Sabedoria.
- O modificador de cada salvamento inicia em 0 e deve ser recalculado conforme os bônus forem aplicados à ficha (Melhorias, Defeitos e Proficiências) — mesmo mecanismo de cálculo de bônus já usado em Perícias, adaptado para Salvamentos.

Diretriz explícita do usuário: reaproveitar ao máximo componentes/hooks/estilos existentes do padrão de Perícias e do círculo de modificador, em vez de recriar do zero. É extensão do mesmo padrão visual e de cálculo, não feature nova.

## Perguntas e respostas

- P: O modal de bônus da Classe de Armadura deve exibir uma linha própria "+10 Base" separada da linha do atributo-chave, ou o 10 fica embutido só no total? → R: O valor base +10 fica embutido no total, sem linha própria no modal. Não mostrar "+10 Base" separado — apenas a linha do atributo-chave (ex.: "+2 Destreza").

- P: Com atributo-chave de modificador negativo a CA cai abaixo de 10 (ex.: CA 8). Isso é aceitável, ou deve haver um mínimo? → R: Sem piso. CA = 10 + modificador do atributo-chave, mesmo que o resultado fique abaixo de 10.

- P: O bônus de Salvamentos vem só de (a) modificador do atributo-chave fixo e (b) graduação de proficiência casada pelo nome no snapshot já existente da ficha, exatamente como em Perícias, sem nenhum bônus direto adicional? → R: Confirmado — mesmo mecanismo de Perícias, reaproveitando a lógica de cálculo já existente (modificador do atributo-chave fixo + graduação de proficiência casada por nome). Sem bônus direto adicional fora desse mecanismo.

## Contexto factual apurado no código

- 'Fortitude', 'Reflexo' e 'Vontade' já são catalogados exatamente como as 17 perícias existentes — tanto como propriedades de melhoria/defeito do tipo 'Proficiência' quanto como propriedades de proficiência. Portanto, os Salvamentos não demandam mudança de catálogo/schema de proficiências nem endpoint novo para esse fim; a graduação de cada salvamento já está disponível no snapshot de proficiências da ficha, casada por nome.
- Atualmente não existe, na ficha, nenhum campo relacionado a Classe de Armadura. A escolha do atributo-chave da CA é uma informação nova, que ainda não tem onde ser persistida.
- Na aba Estatísticas, hoje todos os cálculos (atributos, perícias, saberes) são feitos inteiramente no client a partir dos dados carregados da ficha, sem persistir nenhum valor calculado (apenas escolhas/entradas do usuário são persistidas). Este mesmo precedente se aplica à CA e aos Salvamentos: apenas a escolha do atributo-chave da CA é persistida; o valor numérico da CA e os modificadores de Salvamentos são calculados no client.
- Os 3 salvamentos são fixos e seus atributos-chave não são editáveis pelo usuário: Fortitude → Constituição; Reflexo → Destreza; Vontade → Sabedoria.
- A disposição solicitada na aba Estatísticas é: Atributos à esquerda; à direita, Classe de Armadura acima e Salvamentos logo abaixo. Os painéis já existentes de Perícias e Saberes permanecem na aba, sem alteração de comportamento.

## Escopo confirmado

### Comportamento de backend
- A ficha passa a persistir a escolha do atributo-chave da Classe de Armadura (uma entre as 6 opções de atributo: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma), com valor padrão "Destreza" para fichas que ainda não têm essa escolha definida.
- Nenhuma outra informação relacionada a Classe de Armadura ou Salvamentos é persistida: o valor numérico da CA e os modificadores dos 3 salvamentos não são armazenados, apenas calculados a partir de dados já existentes (atributos e snapshot de proficiências da ficha).
- Não há necessidade de novo catálogo de proficiências para os Salvamentos, pois 'Fortitude', 'Reflexo' e 'Vontade' já existem no catálogo de propriedades de Melhoria/Defeito do tipo Proficiência e no catálogo de propriedades de Proficiência, no mesmo padrão das 17 perícias já suportadas.

### Comportamento de frontend
- Na aba Estatísticas da ficha, ao lado do quadro de Atributos, são adicionados dois novos quadros: "Classe de Armadura" (posicionado à direita dos Atributos) e "Salvamentos" (posicionado abaixo de Classe de Armadura, também à direita dos Atributos). Os quadros já existentes de Perícias e Saberes permanecem na aba sem alteração.
- Quadro "Classe de Armadura":
  - Exibe um círculo com o valor numérico da CA, no mesmo padrão visual do círculo de modificador usado em Perícias.
  - Exibe, ao lado do círculo, um botão de bônus no mesmo padrão do botão de bônus de Perícias, que ao ser acionado mostra o detalhamento do bônus aplicado — contendo apenas a linha referente ao atributo-chave selecionado (ex.: "+2 Destreza"), sem linha separada para o valor base. O valor base de 10 fica embutido apenas no total exibido no círculo.
  - Exibe, ao lado do botão de bônus, um autocomplete com as 6 opções de atributo, permitindo ao usuário escolher o atributo-chave da CA; inicia com "Destreza" selecionado quando a ficha não tiver escolha própria.
  - O valor da CA é calculado como 10 + modificador do atributo-chave selecionado, sem piso mínimo — podendo resultar em valor abaixo de 10 quando o modificador for negativo.
  - Ao trocar o atributo-chave no autocomplete, a CA é recalculada imediatamente e a nova escolha é persistida na ficha.
- Quadro "Salvamentos":
  - Segue o mesmo padrão visual e estrutural dos cards de Perícias: nome do salvamento, atributo-chave, graduação (mesma dinâmica e valores de graduação já usados em Perícias), botão de informativo de bônus e valor de modificador.
  - Contém exatamente 3 cards fixos, não removíveis nem configuráveis pelo usuário: Fortitude (atributo-chave Constituição), Reflexo (atributo-chave Destreza) e Vontade (atributo-chave Sabedoria). Os atributos-chave desses 3 cards não são editáveis pelo usuário.
  - O modificador de cada salvamento é calculado com o mesmo mecanismo já usado em Perícias: modificador do atributo-chave fixo somado à graduação de proficiência casada pelo nome do salvamento no snapshot de proficiências da ficha (considerando os bônus já aplicados por Melhorias, Defeitos e Proficiências). Não há nenhum bônus direto adicional fora desse mecanismo.
  - O modificador inicia em 0 quando não houver graduação de proficiência correspondente e nenhum modificador de atributo aplicável.
- Tanto a Classe de Armadura quanto os Salvamentos reaproveitam, na medida do possível, os elementos visuais e de cálculo já existentes do padrão de Perícias e do círculo de modificador, sem introduzir um padrão visual ou de cálculo novo e divergente.