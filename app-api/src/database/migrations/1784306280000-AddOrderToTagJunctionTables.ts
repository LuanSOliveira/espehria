import { MigrationInterface, QueryRunner } from 'typeorm';

// As 24 tabelas de junção de tags do sistema, cada uma com sua coluna dona
// (owner) que hoje compõe a PK composta (owner_id, tag_id). Ver
// `.claude/tasks/tags-ordem-insercao/spec.md` e `task-api.md` para o
// levantamento completo.
const TAG_JUNCTION_TABLES: Array<{ table: string; owner: string }> = [
  { table: 'ammunition_tags', owner: 'ammunition_id' },
  { table: 'biography_tags', owner: 'biography_id' },
  { table: 'campaign_tags', owner: 'campaign_id' },
  { table: 'character_tags', owner: 'character_id' },
  { table: 'characteristic_tags', owner: 'characteristic_id' },
  { table: 'condition_tags', owner: 'condition_id' },
  { table: 'consumable_tags', owner: 'consumable_id' },
  { table: 'creature_tags', owner: 'creature_id' },
  { table: 'divinity_tags', owner: 'divinity_id' },
  { table: 'equipment_tags', owner: 'equipment_id' },
  { table: 'era_tags', owner: 'era_id' },
  { table: 'event_tags', owner: 'event_id' },
  { table: 'family_tags', owner: 'family_id' },
  { table: 'location_tags', owner: 'location_id' },
  { table: 'material_tags', owner: 'material_id' },
  { table: 'organization_tags', owner: 'organization_id' },
  { table: 'planned_session_tags', owner: 'planned_session_id' },
  { table: 'race_tags', owner: 'race_id' },
  { table: 'skill_tags', owner: 'skill_id' },
  { table: 'spell_tags', owner: 'spell_id' },
  { table: 'talent_tags', owner: 'talent_id' },
  { table: 'technique_tags', owner: 'technique_id' },
  { table: 'training_tags', owner: 'training_id' },
  { table: 'utility_tags', owner: 'utility_id' },
];

export class AddOrderToTagJunctionTables1784306280000
  implements MigrationInterface
{
  name = 'AddOrderToTagJunctionTables1784306280000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, owner } of TAG_JUNCTION_TABLES) {
      // 1-4. Novas colunas: id/created_at/updated_at (de BaseEntity) e a
      // coluna de ordem, com default 0 para tolerar linhas legadas sem
      // exigir backfill (decisão 2 do spec: nenhuma ordem retroativa).
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "id" uuid NOT NULL DEFAULT gen_random_uuid()`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "order" integer NOT NULL DEFAULT 0`,
      );

      // 5-6. Troca a PK composta (owner_id, tag_id) pela nova PK simples em "id".
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "PK_${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "PK_${table}_id" PRIMARY KEY ("id")`,
      );

      // 7. Repõe a garantia de não-duplicação (owner_id, tag_id) que antes
      // vinha da PK composta, agora como índice único.
      await queryRunner.query(
        `CREATE UNIQUE INDEX "IDX_${table}_${owner}_tag_id" ON "${table}" ("${owner}", "tag_id")`,
      );

      // 8. Os índices não-únicos em owner_id e tag_id já existem desde a
      // criação da tabela (IDX_<table>_<owner> e IDX_<table>_tag_id) e não são
      // afetados pelo drop da PK composta (são objetos de índice
      // independentes) — nada a recriar aqui.
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, owner } of [...TAG_JUNCTION_TABLES].reverse()) {
      await queryRunner.query(
        `DROP INDEX "public"."IDX_${table}_${owner}_tag_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "PK_${table}_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "PK_${table}" PRIMARY KEY ("${owner}", "tag_id")`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "order"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "updated_at"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "created_at"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "id"`);
    }
  }
}
