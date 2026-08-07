import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArmorClassKeyAttributeToSheetsTable1784306420000 implements MigrationInterface {
  name = 'AddArmorClassKeyAttributeToSheetsTable1784306420000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "armor_class_key_attribute_id" uuid`,
    );
    await queryRunner.query(
      `UPDATE "sheets" SET "armor_class_key_attribute_id" = (SELECT "id" FROM "attributes" WHERE "name" = 'Destreza') WHERE "armor_class_key_attribute_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ALTER COLUMN "armor_class_key_attribute_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_armor_class_key_attribute_id" FOREIGN KEY ("armor_class_key_attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP CONSTRAINT "FK_sheets_armor_class_key_attribute_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "armor_class_key_attribute_id"`,
    );
  }
}
