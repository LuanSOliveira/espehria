import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpellTagsTable1784305960000 implements MigrationInterface {
  name = 'CreateSpellTagsTable1784305960000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "spell_tags" ("spell_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_spell_tags" PRIMARY KEY ("spell_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_spell_tags_spell_id" ON "spell_tags" ("spell_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_spell_tags_tag_id" ON "spell_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "spell_tags" ADD CONSTRAINT "FK_spell_tags_spell_id" FOREIGN KEY ("spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "spell_tags" ADD CONSTRAINT "FK_spell_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "spell_tags" DROP CONSTRAINT "FK_spell_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spell_tags" DROP CONSTRAINT "FK_spell_tags_spell_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_spell_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_spell_tags_spell_id"`);
    await queryRunner.query(`DROP TABLE "spell_tags"`);
  }
}
