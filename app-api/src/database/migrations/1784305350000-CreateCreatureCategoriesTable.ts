import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreatureCategoriesTable1784305350000 implements MigrationInterface {
  name = 'CreateCreatureCategoriesTable1784305350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "creature_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_creature_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_creature_categories_name" ON "creature_categories" ("name")`,
    );
    await queryRunner.query(
      `INSERT INTO "creature_categories" ("name") VALUES ('Animal'), ('Monstro'), ('Espírito'), ('Construto')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_creature_categories_name"`,
    );
    await queryRunner.query(`DROP TABLE "creature_categories"`);
  }
}
