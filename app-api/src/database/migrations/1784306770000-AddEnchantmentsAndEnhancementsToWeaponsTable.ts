import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnchantmentsAndEnhancementsToWeaponsTable1784306770000 implements MigrationInterface {
  name = 'AddEnchantmentsAndEnhancementsToWeaponsTable1784306770000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "enchantments" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "weapons" ADD "enhancements" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "enhancements"`);
    await queryRunner.query(`ALTER TABLE "weapons" DROP COLUMN "enchantments"`);
  }
}
