import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProficienciesSnapshotsToSheets1784306360000 implements MigrationInterface {
  name = 'AddProficienciesSnapshotsToSheets1784306360000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "proficiencias" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "proficiencias_ajustadas" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "proficiencias_ajustadas"`,
    );
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "proficiencias"`);
  }
}
