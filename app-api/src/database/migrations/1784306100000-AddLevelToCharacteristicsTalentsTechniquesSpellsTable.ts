import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelToCharacteristicsTalentsTechniquesSpellsTable1784306100000 implements MigrationInterface {
  name = 'AddLevelToCharacteristicsTalentsTechniquesSpellsTable1784306100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "characteristics" ADD COLUMN "level" integer`,
    );
    await queryRunner.query(
      `UPDATE "characteristics" SET "level" = 1 WHERE "level" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristics" ALTER COLUMN "level" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "talents" ADD COLUMN "level" integer`);
    await queryRunner.query(
      `UPDATE "talents" SET "level" = 1 WHERE "level" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "talents" ALTER COLUMN "level" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "techniques" ADD COLUMN "level" integer`,
    );
    await queryRunner.query(
      `UPDATE "techniques" SET "level" = 1 WHERE "level" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "techniques" ALTER COLUMN "level" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "spells" ADD COLUMN "level" integer`);
    await queryRunner.query(
      `UPDATE "spells" SET "level" = 1 WHERE "level" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "spells" ALTER COLUMN "level" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "spells" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "techniques" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "level"`);
    await queryRunner.query(
      `ALTER TABLE "characteristics" DROP COLUMN "level"`,
    );
  }
}
