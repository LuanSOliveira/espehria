import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHitPointsToRacesTable1784306430000 implements MigrationInterface {
  name = 'AddHitPointsToRacesTable1784306430000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "races" ADD "hit_points" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "races" SET "hit_points" = 0 WHERE "hit_points" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" ALTER COLUMN "hit_points" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "races" ALTER COLUMN "hit_points" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "races" DROP COLUMN "hit_points"`);
  }
}
