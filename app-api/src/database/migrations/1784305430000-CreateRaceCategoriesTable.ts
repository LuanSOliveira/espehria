import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRaceCategoriesTable1784305430000 implements MigrationInterface {
  name = 'CreateRaceCategoriesTable1784305430000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "race_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_race_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_race_categories_name" ON "race_categories" ("name")`,
    );
    await queryRunner.query(
      `INSERT INTO "race_categories" ("name") VALUES ('Humanoide'), ('Feérico'), ('Celestial'), ('Bestial'), ('Infero'), ('Goblinoide')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_race_categories_name"`);
    await queryRunner.query(`DROP TABLE "race_categories"`);
  }
}
