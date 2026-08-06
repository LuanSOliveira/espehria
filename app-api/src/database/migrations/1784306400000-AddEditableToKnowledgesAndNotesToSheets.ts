import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditableToKnowledgesAndNotesToSheets1784306400000
  implements MigrationInterface
{
  name = 'AddEditableToKnowledgesAndNotesToSheets1784306400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledges" ADD "editable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD COLUMN "saberes_anotacoes" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP COLUMN "saberes_anotacoes"`,
    );
    await queryRunner.query(`ALTER TABLE "knowledges" DROP COLUMN "editable"`);
  }
}
