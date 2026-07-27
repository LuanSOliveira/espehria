import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacterTagsTable1784305580000
  implements MigrationInterface
{
  name = 'CreateCharacterTagsTable1784305580000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "character_tags" ("character_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_character_tags" PRIMARY KEY ("character_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_character_tags_character_id" ON "character_tags" ("character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_character_tags_tag_id" ON "character_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_tags" ADD CONSTRAINT "FK_character_tags_character_id" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_tags" ADD CONSTRAINT "FK_character_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "character_tags" DROP CONSTRAINT "FK_character_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "character_tags" DROP CONSTRAINT "FK_character_tags_character_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_character_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_character_tags_character_id"`,
    );
    await queryRunner.query(`DROP TABLE "character_tags"`);
  }
}
