import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHitPointsToSheetsTable1784306440000 implements MigrationInterface {
  name = 'AddHitPointsToSheetsTable1784306440000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "current_hit_points" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD "temporary_hit_points" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "temporary_hit_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "current_hit_points"`,
    );
  }
}
