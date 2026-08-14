import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArmorCategoriesTable1784306680000
  implements MigrationInterface
{
  name = 'CreateArmorCategoriesTable1784306680000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "armor_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_armor_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_armor_categories_name" ON "armor_categories" ("name")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_armor_categories_order" ON "armor_categories" ("order")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_categories_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_categories_name"`);
    await queryRunner.query(`DROP TABLE "armor_categories"`);
  }
}
