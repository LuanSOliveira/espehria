import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRaceTagsTable1784305450000 implements MigrationInterface {
  name = 'CreateRaceTagsTable1784305450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "race_tags" ("race_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_race_tags" PRIMARY KEY ("race_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_tags_race_id" ON "race_tags" ("race_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_tags_tag_id" ON "race_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_tags" ADD CONSTRAINT "FK_race_tags_race_id" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_tags" ADD CONSTRAINT "FK_race_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "race_tags" DROP CONSTRAINT "FK_race_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_tags" DROP CONSTRAINT "FK_race_tags_race_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_race_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_race_tags_race_id"`);
    await queryRunner.query(`DROP TABLE "race_tags"`);
  }
}
