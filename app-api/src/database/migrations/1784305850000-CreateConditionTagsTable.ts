import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConditionTagsTable1784305850000 implements MigrationInterface {
  name = 'CreateConditionTagsTable1784305850000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "condition_tags" ("condition_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_condition_tags" PRIMARY KEY ("condition_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_condition_tags_condition_id" ON "condition_tags" ("condition_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_condition_tags_tag_id" ON "condition_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "condition_tags" ADD CONSTRAINT "FK_condition_tags_condition_id" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "condition_tags" ADD CONSTRAINT "FK_condition_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "condition_tags" DROP CONSTRAINT "FK_condition_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "condition_tags" DROP CONSTRAINT "FK_condition_tags_condition_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_condition_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_condition_tags_condition_id"`,
    );
    await queryRunner.query(`DROP TABLE "condition_tags"`);
  }
}
