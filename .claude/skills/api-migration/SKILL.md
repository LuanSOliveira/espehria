---
name: api-migration
description: Use sempre que for necessário criar ou atualizar uma migration TypeORM no app-api, após uma entidade ser criada ou alterada. Define o padrão de nome de arquivo/classe, estilo de up()/down() e como garantir que a migration reflita exatamente os campos e relacionamentos da entidade — nunca usar synchronize automático.
---

# Padrão de migration TypeORM (app-api)

Referência completa no código: `app-api/src/database/migrations/1784305251976-CreateUsersTable.ts`.

## Regra inegociável

`synchronize` é `false` neste projeto (`app.module.ts`, `database.synchronize` do
config) — **toda** alteração de schema precisa de uma migration correspondente e
escrita à mão. Nunca trate `synchronize` como alternativa, nem em ambiente local.

## Nome do arquivo e da classe

`src/database/migrations/<timestamp>-<NomeDescritivo>.ts`, onde `<timestamp>` é
epoch em milissegundos (13 dígitos, ex.: `1784305251976`) e `<NomeDescritivo>` é
PascalCase descrevendo a ação (`CreateUsersTable`, `AddPhoneToUsers`,
`CreateOrdersTable`).

A classe dentro do arquivo repete exatamente esse nome + timestamp, e a propriedade
`name` da classe deve ser uma string idêntica ao nome da classe:

```ts
export class CreateUsersTable1784305251976 implements MigrationInterface {
  name = 'CreateUsersTable1784305251976';

  public async up(queryRunner: QueryRunner): Promise<void> { ... }
  public async down(queryRunner: QueryRunner): Promise<void> { ... }
}
```

## Estilo de `up()`/`down()`

O projeto usa SQL puro via `queryRunner.query(...)`, não o helper `Table`/`TableColumn`
do TypeORM. Siga esse mesmo estilo:

- **Enum novo**: `CREATE TYPE "public"."<tabela>_<coluna>_enum" AS
  ENUM('valor1', 'valor2')` antes de criar a tabela/coluna que o usa.
- **Tabela nova**: um único `CREATE TABLE "<tabela>" (...)` com todas as colunas,
  incluindo sempre `"id" uuid NOT NULL DEFAULT gen_random_uuid()`,
  `"created_at" TIMESTAMP NOT NULL DEFAULT now()`,
  `"updated_at" TIMESTAMP NOT NULL DEFAULT now()` (vêm de `BaseEntity`) antes das
  colunas específicas da entidade, e `CONSTRAINT "PK_<hash>" PRIMARY KEY ("id")` ao
  final.
- **Índice único**: `CREATE UNIQUE INDEX "IDX_<hash>" ON "<tabela>" ("<coluna>")` para
  cada `@Index({ unique: true })` da entidade. Se o índice tiver condição (`@Index({
  unique: true, where: '...' })`), replique a cláusula `WHERE` exata no SQL da
  migration.
- **Coluna nova em tabela existente**: `ALTER TABLE "<tabela>" ADD "<coluna>"
  <tipo> <constraints>`.
- **Foreign key**: `ALTER TABLE "<tabela>" ADD CONSTRAINT "FK_<hash>" FOREIGN KEY
  ("<coluna>") REFERENCES "<tabela_referenciada>"("id") ON DELETE <ação>` — escolha
  `ON DELETE` consistente com o comportamento esperado pela entidade/regra de negócio
  (ex.: `CASCADE` só quando a exclusão do pai deve mesmo excluir os filhos).
- `down()` desfaz exatamente o inverso, na ordem reversa de `up()` (índices e
  constraints antes da tabela, tabela antes do enum que ela usa).

## Checklist de consistência com a entidade

Antes de considerar a migration pronta, confira campo a campo contra o arquivo de
entidade (fonte da verdade):
- Todo `@Column` da entidade tem uma coluna correspondente na migration, com o mesmo
  nome (atenção a `@Column({ name: '...' })` explícito, como `created_at`/`updated_at`
  em `BaseEntity`), tipo compatível e `nullable` correto.
- Todo `@Index({ unique: true })` tem seu `CREATE UNIQUE INDEX` correspondente, com a
  mesma condição `WHERE` quando houver.
- Toda relação (`@ManyToOne`/`@OneToMany`/`@JoinColumn`) tem a foreign key e a coluna
  de referência correspondentes.
- Nenhuma coluna/índice na migration que não exista na entidade (e vice-versa).
