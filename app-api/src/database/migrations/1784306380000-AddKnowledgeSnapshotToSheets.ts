import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKnowledgeSnapshotToSheets1784306380000 implements MigrationInterface {
  name = 'AddKnowledgeSnapshotToSheets1784306380000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "saberes" jsonb NOT NULL DEFAULT '{"race":[],"biography":[],"trainings":[],"talents":[],"characteristics":[]}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sheets" DROP COLUMN "saberes"`);
  }
}
