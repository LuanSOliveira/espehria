import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBiographyAndSnapshotsToSheets1784306270000 implements MigrationInterface {
  name = 'AddBiographyAndSnapshotsToSheets1784306270000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "biography_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_biography_id" FOREIGN KEY ("biography_id") REFERENCES "biographies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "melhorias" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "defeitos" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "defeitos"`);
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "melhorias"`);
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP CONSTRAINT "FK_sheets_biography_id"`,
    );
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "biography_id"`);
  }
}
