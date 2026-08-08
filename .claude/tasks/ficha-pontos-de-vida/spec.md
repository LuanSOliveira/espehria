# Spec: Pontos de Vida (Raça e Ficha)

## Pedido original

Demanda em monorepo (app-api NestJS + app-web Next.js, ver CLAUDE.md), com duas partes:

### Parte 1 — Entidade "Raça" (app-api + app-web)

Nova propriedade "Pontos de Vida" na entidade Raça:
- Inteiro positivo, posicionado logicamente APÓS o campo "descrição" (entidade, DTOs, formulário e visualização).
- Backend: migration (nova coluna), entidade, DTOs create/update/response, controller/Swagger.
- Frontend: schema zod do formulário, campo no formulário de cadastro/edição (`RaceCreateForm`), exibição na visualização (`RaceView`).

### Parte 2 — Ficha, aba ESTATÍSTICAS: novo quadro "Pontos de Vida"

Posição: ACIMA dos quadros "Atributos" e "Classe de Armadura" (que hoje ficam lado a lado num grid `lg:grid-cols-2` em `app-web/src/app/(authorized)/fichas/[id]/page.tsx`, ~linha 750).

Três propriedades:
- **PV atual**: input numérico inteiro editável, permite negativo, inicia vazio, persiste no banco.
- **PV temporário**: mesma dinâmica.
- **PV máximo**: NÃO editável — calculado por soma de bônus, exatamente como a Classe de Armadura (base 0 + bônus). Único bônus por enquanto: o valor de `hitPoints` da Raça atribuída à ficha (campo da Parte 1). Botão no quadro abre o detalhamento reaproveitando `SheetBonusDetailModal`.

## Perguntas e respostas

- P: Qual convenção de nomenclatura (idioma) usar para os novos campos, tanto na Raça quanto na Ficha? → R: Inglês. Raça: propriedade `hitPoints`, coluna `hit_points`. Ficha: propriedades `currentHitPoints` e `temporaryHitPoints`, colunas `current_hit_points` e `temporary_hit_points`.

- P: O campo "Pontos de Vida" da Raça é obrigatório? Qual validação de valor (mínimo/máximo)? Como tratar as raças já existentes no backfill da migration? → R: Obrigatório no create e no update. Inteiro, mínimo 1, sem teto. Coluna `NOT NULL`. A migration deve aplicar backfill com valor `0` nas raças já existentes (o usuário atualizará manualmente depois). Decisão explícita e consciente: o valor `0` do backfill é inconsistente com a validação `>= 1` do DTO — essa validação vale apenas para novas escritas feitas via API; linhas legadas com `0` são toleradas no banco. Fica registrado que a coluna NÃO deve manter um `DEFAULT` de schema após o backfill (o `DEFAULT` usado durante a migration deve ser removido ao final dela), para evitar que novos inserts feitos diretamente no banco (fora da validação da API) recebam `0` silenciosamente — mesmo padrão já usado na migration `AddArmorClassKeyAttributeToSheetsTable` (adiciona nullable, faz backfill, depois define `NOT NULL` sem deixar `DEFAULT` residual).

- P: PV atual e PV temporário da Ficha têm piso ou teto? O PV atual pode ultrapassar o PV máximo calculado? → R: Sem piso e sem teto — aceitam valores negativos arbitrários. O PV atual pode ultrapassar o PV máximo calculado; não há trava/clamp nenhuma.

- P: Como deve ser tratado o campo "vazio" nos inputs de PV atual/temporário? Persiste `null` ou `0`? As colunas são nullable? Isso exige algum tratamento especial nos DTOs? → R: As colunas `current_hit_points` e `temporary_hit_points` são NULLABLE. Campo vazio persiste `null`, nunca `0` — limpar o input salva `null` e, nesse estado, o input deve exibir vazio. O tratamento de "vazio" pode ficar local aos dois campos novos, seguindo o padrão já usado em `SheetLevelField` — não é necessário extrair um input numérico genérico compartilhado agora. Nos DTOs de update da Ficha isso implica aceitar explicitamente `null` como valor válido, distinto de "campo ausente/omitido" (mesma lógica já aplicada a `referenceImage` e `campaignId` no `UpdateSheetDto`, que usam `@ValidateIf` para permitir `null` explícito mantendo `@IsOptional` para omissão).

- P: Onde exatamente os campos devem ser posicionados nas telas de Raça (visualização e formulário)? → R: Em `RaceView` (~linha 215), adicionar uma SEGUNDA `RaceSectionBox` ao lado da Descrição, na mesma linha `flex flex-col gap-4 sm:flex-row`. Ícone `FiHeart`, rótulo "Pontos de Vida". Em `RaceCreateForm`, adicionar em LINHA PRÓPRIA logo APÓS o campo de Descrição (não no grid de campos curtos do topo).

- P: Quais rótulos de UI exatos usar no quadro "Pontos de Vida" da Ficha, e qual o comportamento quando a ficha não tem raça atribuída? → R: Título do quadro: "Pontos de Vida". Rótulos exatos dos três campos: "PV atual", "PV máximo", "PV temporário". Disposição: "{PV atual} / {PV máximo}" como peça central do quadro; o campo de PV temporário é exibido ao lado/abaixo dessa fração, no mesmo quadro, seguindo o padrão visual dos demais quadros da aba Estatísticas. No `SheetBonusDetailModal`, o título/`name` do detalhamento é "Pontos de Vida Máximo" (mesmo padrão usado para "Classe de Armadura", cujo modal exibe "Bônus de Classe de Armadura"). A linha de breakdown do bônus da raça mostra APENAS o nome da raça (ex.: "Elfo"), sem prefixo "Raça:", consistente com o padrão "+2 Destreza" já usado no breakdown de Classe de Armadura. Quando a ficha NÃO tem raça atribuída: o PV máximo é 0 e o breakdown do modal fica vazio — mesmo comportamento degradado já existente no padrão de Classe de Armadura.

## Escopo confirmado

### Parte 1 — Raça

Adicionar à entidade Raça uma nova propriedade de pontos de vida (nome em inglês, `hitPoints`/`hit_points`), posicionada logicamente após o campo "descrição" em todas as camadas (entidade, DTOs de criação/atualização/resposta, formulário de cadastro/edição e tela de visualização).

Regras de valor:
- Tipo inteiro, valor mínimo 1, sem teto.
- Campo obrigatório tanto na criação quanto na atualização da raça.
- Coluna do banco definida como `NOT NULL`.
- Raças já cadastradas no banco antes desta mudança recebem valor `0` via backfill de migration; esse valor é reconhecidamente inconsistente com a regra de mínimo 1 aplicada a novas escritas via API, e essa inconsistência é aceita como decisão consciente — o usuário corrigirá manualmente os registros legados depois. A coluna não deve manter um `DEFAULT` de schema após a migration ser concluída, para que a regra de obrigatoriedade/mínimo não seja contornável por inserts diretos no banco.

Posicionamento na interface:
- Na visualização da raça, o novo dado é exibido em uma caixa de seção própria, ao lado da caixa de "Descrição", na mesma linha horizontal, com ícone de coração e rótulo "Pontos de Vida".
- No formulário de cadastro/edição da raça, o campo é exibido em linha própria, imediatamente após o campo de Descrição (fora do grid de campos curtos do topo do formulário).

### Parte 2 — Ficha (aba Estatísticas)

Adicionar um novo quadro "Pontos de Vida" na aba Estatísticas da ficha, posicionado acima dos quadros de Atributos e Classe de Armadura.

O quadro contém três propriedades:
- **PV atual** (`currentHitPoints`): número inteiro editável pelo usuário, sem piso nem teto (aceita negativos), persistido no banco. Estado inicial vazio (sem valor).
- **PV temporário** (`temporaryHitPoints`): mesma dinâmica de edição, faixa de valores e persistência do PV atual.
- **PV máximo**: valor somente leitura (não editável diretamente pelo usuário), calculado como soma de bônus a partir de uma base 0 — mesmo modelo de cálculo já usado para a Classe de Armadura. Por enquanto o único bônus considerado é o valor de "Pontos de Vida" (`hitPoints`) da raça atualmente vinculada à ficha. Se a ficha não tiver raça vinculada, o PV máximo é 0.

Regras de valor de PV atual/temporário:
- Sem piso e sem teto — aceitam qualquer valor inteiro, incluindo negativos.
- O PV atual pode ultrapassar o PV máximo calculado sem qualquer bloqueio, trava ou ajuste automático.
- Campo "vazio" é um estado válido e distinto de "0": ao apagar o conteúdo do input, o valor persistido é `null` (não `0`), e o input volta a exibir-se vazio nesse estado. Isso vale tanto para PV atual quanto para PV temporário, cada um de forma independente. Nas rotas de atualização da ficha, o valor `null` explícito precisa ser diferenciado de "campo não enviado/omitido" (omitir mantém o valor atual; enviar `null` explicitamente limpa o campo).

Interface do quadro:
- Título do quadro: "Pontos de Vida".
- Rótulos exatos exibidos: "PV atual", "PV máximo", "PV temporário".
- A fração "{PV atual} / {PV máximo}" é a peça central e mais destacada do quadro; o campo de PV temporário aparece ao lado ou abaixo dessa fração, dentro do mesmo quadro, seguindo o padrão visual já usado nos demais quadros da aba.
- Um botão no quadro abre um modal de detalhamento do PV máximo, reaproveitando o componente de detalhamento de bônus já usado para Classe de Armadura, Perícias e Saberes. Nesse modal, o nome exibido é "Pontos de Vida Máximo". A linha de detalhamento referente à raça mostra apenas o nome da própria raça (ex.: "Elfo"), sem qualquer prefixo como "Raça:". Se a ficha não tiver raça vinculada, esse detalhamento aparece vazio (PV máximo 0, sem linhas de bônus) — mesmo comportamento hoje existente para Classe de Armadura sem fonte de bônus.

## Referências de padrão no código (para os agentes de planejamento)

Estas referências foram levantadas durante a investigação da demanda e apontam para convenções e pontos de código já existentes e relevantes ao escopo acima. Elas não substituem as decisões de arquitetura/implementação, que cabem às etapas de planejamento (`planejamento-api`/`planejamento-web`).

### Backend — Classe de Armadura (padrão de "base + bônus calculado" a replicar para PV máximo)
- `app-api/src/modules/sheets/entities/sheet.entity.ts` — coluna `armorClassKeyAttribute` (relação obrigatória, sem coluna de total persistida; o total é calculado no client a partir de atributo-chave).
- `app-api/src/modules/sheets/dto/update-sheet.dto.ts` — campo `armorClassKeyAttributeId`; também demonstra o padrão de aceitar `null` explícito com `@ValidateIf((_object, value) => value !== null)` combinado a `@IsOptional()` (usado em `referenceImage` e `campaignId`), que é o padrão a seguir para `currentHitPoints`/`temporaryHitPoints` aceitarem `null` explícito.
- `app-api/src/modules/sheets/dto/sheet-response.dto.ts`.
- `app-api/src/database/migrations/1784306420000-AddArmorClassKeyAttributeToSheetsTable.ts` — exemplo do padrão "adicionar coluna nullable → backfill → `SET NOT NULL`, sem manter `DEFAULT`" a ser espelhado (com adaptações, já que os campos de PV da ficha permanecem nullable, diferente deste exemplo).

### Backend — Raça
- `app-api/src/modules/races/entities/race.entity.ts` — campo `description` está definido nas linhas 32-33; `hitPoints`/`hit_points` deve ficar logicamente após ele.
- `app-api/src/modules/races/dto/create-race.dto.ts` — campo `description` nas linhas 41-47 (delimita onde inserir `hitPoints` obrigatório).
- `app-api/src/modules/races/dto/update-race.dto.ts` — hoje é apenas `PartialType(CreateRaceDto)`.
- `app-api/src/modules/races/dto/race-response.dto.ts` — campo `description` nas linhas 38-42.
- `app-api/src/modules/races/races.controller.ts`, `races.service.ts`.

### Frontend — ficha (`app-web/src/app/(authorized)/fichas/[id]/page.tsx`)
- Cálculo de total/breakdown de Classe de Armadura: `ARMOR_CLASS_BASE_VALUE` (linha 86), `armorClassAttributeModifier`/`armorClassTotal`/`armorClassBreakdown` (linhas 304-308) — modelo de cálculo a replicar para PV máximo, usando `hitPoints` da raça vinculada em vez de modificador de atributo.
- Mutations `usePutEntity` + `useFieldAutosave` para campos simples da ficha (linhas 363-374 e 596-600 para `level`, por exemplo) — padrão de autosave a considerar para PV atual/temporário.
- Layout da aba Estatísticas, grid `lg:grid-cols-2` de Atributos + Classe de Armadura (linhas 751-776) — novo quadro de Pontos de Vida entra acima deste grid.
- Montagem dos `SheetBonusDetailModal` (linhas 851-877), incluindo o de Classe de Armadura (linhas 863-871) — modelo para o modal de "Pontos de Vida Máximo".

### Componentes de referência no frontend
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetArmorClassPanel/index.tsx` — estrutura visual de quadro com `SheetModifierCircle` + botão de detalhamento.
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetLevelField/index.tsx` — padrão de input numérico controlado localmente (`value`/`onChange`), inclusive tratamento de string vazia no `onChange`; é o padrão indicado para o tratamento local de "vazio" em PV atual/temporário (adaptado para permitir negativos e persistir `null`, diferente do `level`, que é positivo e não aceita vazio).
- `app-web/src/app/(authorized)/fichas/[id]/components/SheetBonusDetailModal/index.tsx` — interface `SheetBonusDetail { name, total, breakdown: { label, value }[] }`; título do modal é montado como `` `Bônus de ${detail?.name}` ``, e cada linha do breakdown é renderizada como `` `${sinal}${valor} ${label}` `` (ex.: "+2 Destreza") — confirma que, para a raça, `label` deve ser apenas o nome da raça.

### Frontend — Raça
- `app-web/src/app/(authorized)/racas/components/RaceView/index.tsx` — bloco da `RaceSectionBox` de "Descrição" nas linhas 215-221 (`flex flex-col gap-4 sm:flex-row`); novo bloco de Pontos de Vida entra nesta mesma linha.
- `app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx` — campo `FormRichTextInput` de "Descrição" nas linhas 324-332; novo campo entra logo após, antes de `EntityReferenceListField` (linha 334).
- `app-web/src/shared/formSchemas/RaceFormSchema/index.ts` — schema zod e valores padrão do formulário de raça; hoje sem campo numérico (todos os campos existentes são string/array).

### Interfaces TypeScript a atualizar
- `app-web/src/shared/interfaces/Entities/Race/index.ts` — `IRace` precisa do novo campo `hitPoints`. Atenção: `IRaceListItem` (usado como tipo de `ISheet.race`) hoje é um subconjunto de campos da raça (id, referenceImageUrl, name, category, tags) e NÃO inclui `hitPoints`; como o PV máximo da ficha depende do `hitPoints` da raça vinculada, esse dado precisa estar acessível a partir de `ISheet.race` no frontend — os planejadores devem decidir como isso é resolvido no shape usado pela ficha.
- `app-web/src/shared/interfaces/Entities/Sheet/index.ts` — `ISheet` precisa dos novos campos `currentHitPoints`/`temporaryHitPoints` (ambos `number | null`).

### Backend — resposta da Ficha e propagação do `hitPoints` da raça
- `app-api/src/modules/sheets/dto/sheet-response.dto.ts` usa `RaceResponseDto.fromEntity(sheet.race)` (completo, já incluiria `hitPoints` uma vez adicionado à Parte 1) — ou seja, no backend o dado já chega inteiro ao client; o ajuste necessário identificado acima é apenas no tipo TypeScript do frontend (`IRaceListItem`/`ISheet.race`), não no backend.