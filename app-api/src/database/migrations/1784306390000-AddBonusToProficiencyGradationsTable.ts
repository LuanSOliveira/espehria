import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBonusToProficiencyGradationsTable1784306390000 implements MigrationInterface {
  name = 'AddBonusToProficiencyGradationsTable1784306390000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proficiency_gradations" ADD "bonus" integer`,
    );

    await queryRunner.query(
      `UPDATE "proficiency_gradations" SET "bonus" = 0 WHERE "name" = 'Destreinado'`,
    );
    await queryRunner.query(
      `UPDATE "proficiency_gradations" SET "bonus" = 3 WHERE "name" = 'Básico'`,
    );
    await queryRunner.query(
      `UPDATE "proficiency_gradations" SET "bonus" = 5 WHERE "name" = 'Avançado'`,
    );
    await queryRunner.query(
      `UPDATE "proficiency_gradations" SET "bonus" = 7 WHERE "name" = 'Especialista'`,
    );
    await queryRunner.query(
      `UPDATE "proficiency_gradations" SET "bonus" = 9 WHERE "name" = 'Lendário'`,
    );

    await queryRunner.query(
      `ALTER TABLE "proficiency_gradations" ALTER COLUMN "bonus" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proficiency_gradations" DROP COLUMN "bonus"`,
    );
  }
}
