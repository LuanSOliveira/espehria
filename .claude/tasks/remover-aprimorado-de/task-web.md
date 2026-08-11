# Task Web: Remover propriedade "Aprimorado de" das telas de Habilidades

## Contexto
Não existe `spec.md` para esta demanda. O escopo foi confirmado diretamente pelo
usuário: remover completamente a propriedade "Aprimorado de" (`improvedFrom`) das 5
entidades de Habilidades — Treinamento, Talento, Característica, Técnica e Magia — no
`app-web`. O backend remove o campo dos DTOs e o valor `improved_from` do enum na mesma
demanda (ver `.claude/tasks/remover-aprimorado-de/task-api.md`, se existir).

Investigação de código já confirmada por leitura direta dos arquivos:
- Todas as 5 interfaces de entidade têm `improvedFrom: IEntityReference[]`.
- Todos os 5 modais de visualização (`*View/index.tsx`) renderizam um quadro
  "Aprimorado de" com o ícone `FiTrendingUp` (usado **apenas** para esse quadro em
  cada um desses 5 arquivos — pode ser removido do import junto com o bloco).
- Todos os 5 formulários de criação/edição (`*CreateForm/index.tsx`) têm: tipo do
  payload, `useState`, hidratação em modo edição, parâmetro/mapeamento em
  `buildPayload` e o `<EntityReferenceListField>` de "Aprimorado de".
- `EntityReferenceListField`, `EntityReferenceCard` e `EntityReferenceSelectionModal`
  (`app-web/src/shared/components/`) são reaproveitados por `requirements` e
  `additionalAbilities` nas 5 entidades, e também por `BiographyCreateForm` e
  `RaceCreateForm` — **não devem ser alterados nem removidos**, apenas os usos
  específicos de `improvedFrom` nos 5 formulários/visualizações acima.
- Confirmado por grep: `BiographyCreateForm` e `RaceCreateForm` não referenciam
  `improvedFrom` e não são afetados por esta demanda.

### Mapeamento de `otherListValues` após a remoção

**Treinamento / Talento / Característica** (grupo de 3 listas — `improvedFrom`,
`requirements`, `additionalAbilities`):
- Hoje: `additionalAbilities` → `otherListValues={[improvedFrom, requirements]}`;
  `improvedFrom` → `otherListValues={[requirements, additionalAbilities]}`;
  `requirements` → `otherListValues={[improvedFrom, additionalAbilities]}`.
- Depois: remover o campo `improvedFrom` inteiro; `additionalAbilities` →
  `otherListValues={[requirements]}`; `requirements` →
  `otherListValues={[additionalAbilities]}`.
- Nas 3 telas de visualização e nos 3 formulários, o quadro/campo "Aprimorado de" e o
  de "Requisitos" estão hoje lado a lado dentro de um
  `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">` que contém só esses dois
  itens. Como sobra apenas "Requisitos", remover esse wrapper de grid (deixando o
  quadro/campo "Requisitos" como bloco único, no mesmo padrão de largura total usado
  pelos demais quadros/campos da tela) em vez de deixar um `grid-cols-2` com um único
  item.

**Técnica / Magia** (grupo de 2 listas — `improvedFrom`, `requirements`):
- Hoje: `requirements` → `otherListValues={[improvedFrom]}` (e `improvedFrom` →
  `otherListValues={[requirements]}`).
- Depois: remover o campo `improvedFrom` inteiro; como não sobra nenhuma outra lista
  para validar exclusividade mútua, **omitir a prop `otherListValues` no campo
  `requirements`** (a prop é opcional com default `[]` no componente
  `EntityReferenceListField`) em vez de passar um array vazio explícito ou deixar uma
  referência órfã a `improvedFrom`.
- Da mesma forma, o wrapper `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">`
  que hoje envolve os dois quadros/campos ("Aprimorado de" + "Requisitos") deve ser
  removido, deixando "Requisitos" como bloco único de largura total, tanto na
  visualização quanto no formulário.

### Mensagem de erro em `EntityReferenceListField`

A mensagem atual — "Este item já está presente na outra lista e não pode ser
adicionado aqui." — já funciona corretamente no singular e não depende
gramaticalmente de haver múltiplas listas. Como, após a remoção, nunca mais haverá
mais de uma lista em `otherListValues` (usos remanescentes: `requirements` vs.
`additionalAbilities` nas 3 entidades de 3 listas; `requirements` sozinho, sem
`otherListValues`, nas 2 entidades de 2 listas), a mensagem permanece adequada sem
alteração — não é necessário reescrevê-la. Nenhuma outra tela depende dessa mensagem
(`EntityReferenceListField` é o único ponto onde ela é usada).

## Etapas

### 1. web-dev
Status: concluído
Componentes: nenhum (EntityReferenceListField/EntityReferenceCard/EntityReferenceSelectionModal não foram alterados, conforme instruído)
Arquivos:
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/interfaces/Entities/Talent/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/shared/interfaces/Entities/Technique/index.ts
- app-web/src/shared/interfaces/Entities/Spell/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellView/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx

Sem desvios em relação ao plano. Em Técnica/Magia, a prop `otherListValues` do campo
"Requisitos" foi omitida (não passada), como determinado no Contexto — o componente
`EntityReferenceListField` já trata seu default como `[]`.

#### Funcionalidade

**Interfaces** — remover a propriedade `improvedFrom: IEntityReference[]` de:
- `app-web/src/shared/interfaces/Entities/Training/index.ts` (linha 13)
- `app-web/src/shared/interfaces/Entities/Talent/index.ts` (linha 13)
- `app-web/src/shared/interfaces/Entities/Characteristic/index.ts` (linha 13)
- `app-web/src/shared/interfaces/Entities/Technique/index.ts` (linha 19)
- `app-web/src/shared/interfaces/Entities/Spell/index.ts` (linha 19)

**Modais de visualização** — em cada arquivo abaixo, remover o quadro "Aprimorado de"
inteiro (bloco com header `FiTrendingUp` + label "Aprimorado de" + lista de
`EntityReferenceCard` de `*.improvedFrom`), remover o import de `FiTrendingUp` (não
usado em mais nenhum lugar do arquivo) e ajustar o wrapper de grid conforme descrito
no Contexto (deixar "Requisitos" como bloco único de largura total, sem
`grid-cols-2` para um item só):
- `app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx`
  (~linhas 242-264)
- `app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx`
  (~linhas 239-261)
- `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx`
  (~linhas 244-266)
- `app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx`
  (~linhas 179-204)
- `app-web/src/app/(authorized)/magias/components/SpellView/index.tsx`
  (~linhas 173-198)

**Formulários** — em cada arquivo abaixo, remover completamente o que se refere a
`improvedFrom`:
- o campo `improvedFrom: EntityReferenceInputPayload[]` do tipo do payload;
- o `useState<IEntityReference[]>` (`improvedFrom`/`setImprovedFrom`);
- a hidratação em modo edição (`setImprovedFrom(detail.improvedFrom ?? [])`);
- o parâmetro `improvedFrom` e seu mapeamento dentro de `buildPayload`, e a chamada de
  `buildPayload` (em Técnica/Magia o parâmetro é passado posicionalmente — ajustar a
  assinatura e a chamada);
- a propriedade `improvedFrom` no objeto de payload final;
- o `<EntityReferenceListField>` de "Aprimorado de" em si;
- reajustar `otherListValues` dos campos remanescentes conforme o mapeamento descrito
  no Contexto (Treinamento/Talento/Característica: `additionalAbilities` →
  `[requirements]`, `requirements` → `[additionalAbilities]`; Técnica/Magia:
  `requirements` sem `otherListValues`);
- remover o wrapper `grid grid-cols-1 sm:grid-cols-2` que sobrar com um único campo
  ("Requisitos"), deixando-o como campo único de largura total, no mesmo padrão dos
  demais campos do formulário.

  Arquivos:
  - `app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx`
    (tipo/estado ~linhas 69, 84, 143, 167-263; campos ~linhas 368-398)
  - `app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx`
    (tipo/estado ~linhas 68, 81, 140, 164-260; campos ~linhas 365-395)
  - `app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx`
    (tipo/estado ~linhas 69, 86, 145, 169-271; campos ~linhas 377-407)
  - `app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx`
    (tipo/estado ~linhas 43, 53, 94, 113-175; campos ~linhas 248-267)
  - `app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx`
    (tipo/estado ~linhas 43, 51, 92, 111-173; campos ~linhas 246-261)

**Não alterar**: `app-web/src/shared/components/EntityReferenceListField/index.tsx`,
`EntityReferenceCard`, `EntityReferenceSelectionModal`,
`app-web/src/app/(authorized)/biografias/components/BiographyCreateForm/index.tsx` e
`app-web/src/app/(authorized)/racas/components/RaceCreateForm/index.tsx` — nenhum
desses usa `improvedFrom` e todos continuam servindo `requirements`/
`additionalAbilities`/campos próprios normalmente.

- Páginas/rotas: nenhuma rota nova; alteração é interna às páginas já existentes de
  Treinamentos (`treinamentos`), Talentos (`talentos`), Características
  (`caracteristicas`), Técnicas (`tecnicas`) e Magias (`magias`).
- Integrações com API: nenhuma mudança de endpoint — os mesmos endpoints de
  detalhe/criação/edição dessas 5 entidades continuam sendo consumidos; apenas o
  campo `improvedFrom` deixa de ser lido do payload de resposta e deixa de ser
  enviado no payload de criação/edição (alinhado à remoção do campo nos DTOs da API).
- Formulário/validação: nenhuma nova regra de validação — a remoção elimina o campo
  e sua lógica de exclusividade mútua associada (`otherListValues`), sem introduzir
  validação nova.
- Acesso Google: sem impacto — nenhuma alteração de comportamento de acesso
  `provider: 'google'` é necessária nesta demanda; o padrão de ocultar
  criar/editar/excluir para esses usuários permanece como já implementado nessas
  telas, sem relação com a remoção de "Aprimorado de".

### 2. web-dev-codereviewer
Status: concluído
- Revisar tudo acima

## Revisão

Aprovado. Nenhum problema encontrado nos arquivos revisados:
- app-web/src/shared/interfaces/Entities/Training/index.ts
- app-web/src/shared/interfaces/Entities/Talent/index.ts
- app-web/src/shared/interfaces/Entities/Characteristic/index.ts
- app-web/src/shared/interfaces/Entities/Technique/index.ts
- app-web/src/shared/interfaces/Entities/Spell/index.ts
- app-web/src/app/(authorized)/treinamentos/components/TrainingView/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentView/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicView/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueView/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellView/index.tsx
- app-web/src/app/(authorized)/treinamentos/components/TrainingCreateForm/index.tsx
- app-web/src/app/(authorized)/talentos/components/TalentCreateForm/index.tsx
- app-web/src/app/(authorized)/caracteristicas/components/CharacteristicCreateForm/index.tsx
- app-web/src/app/(authorized)/tecnicas/components/TechniqueCreateForm/index.tsx
- app-web/src/app/(authorized)/magias/components/SpellCreateForm/index.tsx

Pontos conferidos especificamente para esta demanda de remoção:
- Nenhuma menção a `improvedFrom` restante em `app-web/src` (grep global sem
  resultados), incluindo dentro de `otherListValues` — sem referências órfãs.
- Em Treinamento/Talento/Característica (3 telas de visualização + 3 formulários):
  `additionalAbilities` usa `otherListValues={[requirements]}` e `requirements` usa
  `otherListValues={[additionalAbilities]}`, preservando a validação de exclusividade
  mútua nas duas listas remanescentes.
- Em Técnica/Magia (2 telas de visualização + 2 formulários): a prop
  `otherListValues` do campo/quadro "Requisitos" foi omitida (não passada como array
  vazio), coerente com o default `[]` do componente `EntityReferenceListField`.
- `EntityReferenceListField` (`app-web/src/shared/components/EntityReferenceListField/index.tsx`),
  `EntityReferenceCard` e `EntityReferenceSelectionModal` não foram alterados; grep por
  `improvedFrom` dentro de `shared/components` não retornou nenhuma ocorrência.
  `BiographyCreateForm` e `RaceCreateForm` continuam importando e usando
  `EntityReferenceListField` normalmente, sem relação com esta remoção.
- Import de `FiTrendingUp` removido corretamente nas 5 telas de visualização (não
  aparece mais nesses arquivos); os únicos usos remanescentes no projeto são
  `app-web/src/app/(authorized)/components/Sidebar/data/index.ts` (linhas 27 e 185) e
  `app-web/src/app/(authorized)/divindades/components/DivinityView/index.tsx` (linhas
  24 e 387), ambos legítimos e fora do escopo desta demanda.
- O wrapper `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">` que envolvia
  "Aprimorado de" + "Requisitos" foi removido nas 10 telas/formulários; "Requisitos"
  ficou como bloco/campo único de largura total, no mesmo padrão dos demais
  quadros/campos de cada tela/formulário (sem `grid-cols-2` sobrando com um único
  item, sem div vazia ou aninhamento inútil).
- Nos 5 formulários, a remoção foi consistente em todos os pontos: tipo do payload
  (`*Payload`), `useState`/`setImprovedFrom`, hidratação no modo edição, parâmetro e
  mapeamento em `buildPayload` (em Técnica/Magia a assinatura de `buildPayload` e a
  chamada em `onSubmit` foram ajustadas para `(data, requirements)`, sem parâmetro
  órfão) e o `<EntityReferenceListField>` de "Aprimorado de" em si.
- Padrões do CLAUDE.md preservados: alias `@/*` em todos os imports, componentes MUI
  com `sx`/estilos compartilhados (`APP_CONTAINER_STYLES`, `APP_COLORS`), textos em
  pt-BR, hooks genéricos de `hooks/Queries` (`useGetEntityById`, `usePostEntity`,
  `usePutEntity`) com `invalidateQueryKeys` apontando para a listagem correspondente,
  e modo criar/editar derivado das stores `useSelected<Entidade>Store` (não de prop
  manual).