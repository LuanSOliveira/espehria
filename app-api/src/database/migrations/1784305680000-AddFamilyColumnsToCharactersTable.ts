import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFamilyColumnsToCharactersTable1784305680000 implements MigrationInterface {
  name = 'AddFamilyColumnsToCharactersTable1784305680000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "characters" ADD "family_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "characters" ADD "secondary_family_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_characters_family_id" ON "characters" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_characters_secondary_family_id" ON "characters" ("secondary_family_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "characters" ADD CONSTRAINT "FK_characters_family_id" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characters" ADD CONSTRAINT "FK_characters_secondary_family_id" FOREIGN KEY ("secondary_family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "characters" DROP CONSTRAINT "FK_characters_secondary_family_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characters" DROP CONSTRAINT "FK_characters_family_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_characters_secondary_family_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_characters_family_id"`);
    await queryRunner.query(
      `ALTER TABLE "characters" DROP COLUMN "secondary_family_id"`,
    );
    await queryRunner.query(`ALTER TABLE "characters" DROP COLUMN "family_id"`);
  }
}
