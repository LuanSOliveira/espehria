import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkillTagsTable1784305820000 implements MigrationInterface {
  name = 'CreateSkillTagsTable1784305820000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "skill_tags" ("skill_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_skill_tags" PRIMARY KEY ("skill_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skill_tags_skill_id" ON "skill_tags" ("skill_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skill_tags_tag_id" ON "skill_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "skill_tags" ADD CONSTRAINT "FK_skill_tags_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skill_tags" ADD CONSTRAINT "FK_skill_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skill_tags" DROP CONSTRAINT "FK_skill_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skill_tags" DROP CONSTRAINT "FK_skill_tags_skill_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_skill_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_skill_tags_skill_id"`);
    await queryRunner.query(`DROP TABLE "skill_tags"`);
  }
}
