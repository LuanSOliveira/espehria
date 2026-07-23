import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventTagsTable1784305490000 implements MigrationInterface {
  name = 'CreateEventTagsTable1784305490000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_tags" ("event_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_event_tags" PRIMARY KEY ("event_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_tags_event_id" ON "event_tags" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_tags_tag_id" ON "event_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_event_tags_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tags" ADD CONSTRAINT "FK_event_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_event_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tags" DROP CONSTRAINT "FK_event_tags_event_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_event_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_event_tags_event_id"`);
    await queryRunner.query(`DROP TABLE "event_tags"`);
  }
}
