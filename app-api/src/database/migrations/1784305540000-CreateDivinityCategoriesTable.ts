import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDivinityCategoriesTable1784305540000
  implements MigrationInterface
{
  name = 'CreateDivinityCategoriesTable1784305540000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "divinity_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_divinity_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_divinity_categories_name" ON "divinity_categories" ("name")`,
    );
    await queryRunner.query(
      `INSERT INTO "divinity_categories" ("name") VALUES ('Divindade Maior'), ('Divindade Menor')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_divinity_categories_name"`,
    );
    await queryRunner.query(`DROP TABLE "divinity_categories"`);
  }
}
