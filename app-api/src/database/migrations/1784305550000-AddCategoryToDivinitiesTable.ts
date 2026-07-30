import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToDivinitiesTable1784305550000 implements MigrationInterface {
  name = 'AddCategoryToDivinitiesTable1784305550000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "divinities" ADD "category_id" uuid`);
    await queryRunner.query(
      `UPDATE "divinities" SET "category_id" = (SELECT "id" FROM "divinity_categories" WHERE "name" = 'Divindade Maior') WHERE "category_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ALTER COLUMN "category_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" ADD CONSTRAINT "FK_divinities_category_id" FOREIGN KEY ("category_id") REFERENCES "divinity_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP CONSTRAINT "FK_divinities_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinities" DROP COLUMN "category_id"`,
    );
  }
}
