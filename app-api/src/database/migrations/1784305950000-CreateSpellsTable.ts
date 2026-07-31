import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpellsTable1784305950000 implements MigrationInterface {
  name = 'CreateSpellsTable1784305950000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "spells" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, CONSTRAINT "PK_spells_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_spells_name" ON "spells" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_spells_name"`);
    await queryRunner.query(`DROP TABLE "spells"`);
  }
}
