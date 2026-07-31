import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlannedSessionTagsTable1784306010000
  implements MigrationInterface
{
  name = 'CreatePlannedSessionTagsTable1784306010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "planned_session_tags" ("planned_session_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_planned_session_tags" PRIMARY KEY ("planned_session_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_planned_session_tags_planned_session_id" ON "planned_session_tags" ("planned_session_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_planned_session_tags_tag_id" ON "planned_session_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_session_tags" ADD CONSTRAINT "FK_planned_session_tags_planned_session_id" FOREIGN KEY ("planned_session_id") REFERENCES "planned_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_session_tags" ADD CONSTRAINT "FK_planned_session_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_session_tags" DROP CONSTRAINT "FK_planned_session_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_session_tags" DROP CONSTRAINT "FK_planned_session_tags_planned_session_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_planned_session_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_planned_session_tags_planned_session_id"`,
    );
    await queryRunner.query(`DROP TABLE "planned_session_tags"`);
  }
}
