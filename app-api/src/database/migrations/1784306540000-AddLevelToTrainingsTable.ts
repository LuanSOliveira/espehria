import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelToTrainingsTable1784306540000
  implements MigrationInterface
{
  name = 'AddLevelToTrainingsTable1784306540000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trainings" ADD COLUMN "level" integer`,
    );
    await queryRunner.query(
      `UPDATE "trainings" SET "level" = 1 WHERE "level" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainings" ALTER COLUMN "level" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trainings" DROP COLUMN "level"`);
  }
}