import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEraTagsTable1784305470000 implements MigrationInterface {
  name = 'CreateEraTagsTable1784305470000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "era_tags" ("era_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_era_tags" PRIMARY KEY ("era_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_era_tags_era_id" ON "era_tags" ("era_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_era_tags_tag_id" ON "era_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "era_tags" ADD CONSTRAINT "FK_era_tags_era_id" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "era_tags" ADD CONSTRAINT "FK_era_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "era_tags" DROP CONSTRAINT "FK_era_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "era_tags" DROP CONSTRAINT "FK_era_tags_era_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_era_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_era_tags_era_id"`);
    await queryRunner.query(`DROP TABLE "era_tags"`);
  }
}
