import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnchantmentsTable1784306750000 implements MigrationInterface {
  name = 'CreateEnchantmentsTable1784306750000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."enchantments_type_enum" AS ENUM('weapon', 'armor', 'shield', 'accessory')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enchantments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" "public"."enchantments_type_enum", "effect" text, CONSTRAINT "PK_enchantments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_enchantments_name" ON "enchantments" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_enchantments_name"`);
    await queryRunner.query(`DROP TABLE "enchantments"`);
    await queryRunner.query(`DROP TYPE "public"."enchantments_type_enum"`);
  }
}
