import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnchantmentsAndEnhancementsToEquipmentTables1784306780000 implements MigrationInterface {
  name = 'AddEnchantmentsAndEnhancementsToEquipmentTables1784306780000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "shields" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessories" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessories" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accessories" DROP COLUMN "enhancements"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessories" DROP COLUMN "enchantments"`,
    );
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "enhancements"`);
    await queryRunner.query(`ALTER TABLE "shields" DROP COLUMN "enchantments"`);
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "enhancements"`);
    await queryRunner.query(`ALTER TABLE "armors" DROP COLUMN "enchantments"`);
  }
}
