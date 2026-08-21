import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSheetInventoryItemsTable1784306820000 implements MigrationInterface {
  name = 'CreateSheetInventoryItemsTable1784306820000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sheet_inventory_items_category_enum" AS ENUM('utility', 'consumable', 'material', 'ammunition', 'weapon', 'armor', 'accessory', 'shield')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sheet_inventory_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "category" "public"."sheet_inventory_items_category_enum" NOT NULL, "quantity" integer NOT NULL, "equipped" boolean NOT NULL DEFAULT false, "unit_volume" numeric(4,1) NOT NULL DEFAULT 0, "data" jsonb NOT NULL, "sheet_id" uuid NOT NULL, CONSTRAINT "PK_sheet_inventory_items_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheet_inventory_items" ADD CONSTRAINT "FK_sheet_inventory_items_sheet_id" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheet_inventory_items" DROP CONSTRAINT "FK_sheet_inventory_items_sheet_id"`,
    );
    await queryRunner.query(`DROP TABLE "sheet_inventory_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."sheet_inventory_items_category_enum"`,
    );
  }
}
