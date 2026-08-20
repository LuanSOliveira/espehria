import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolumeAndCoinsToSheetsTable1784306790000
  implements MigrationInterface
{
  name = 'AddVolumeAndCoinsToSheetsTable1784306790000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "pc" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "pp" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "po" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "pl" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "loaded_volume" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "loaded_volume"`,
    );
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "pl"`);
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "po"`);
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "pp"`);
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "pc"`);
  }
}
