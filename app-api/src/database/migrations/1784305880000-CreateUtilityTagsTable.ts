import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUtilityTagsTable1784305880000 implements MigrationInterface {
  name = 'CreateUtilityTagsTable1784305880000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "utility_tags" ("utility_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_utility_tags" PRIMARY KEY ("utility_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_utility_tags_utility_id" ON "utility_tags" ("utility_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_utility_tags_tag_id" ON "utility_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "utility_tags" ADD CONSTRAINT "FK_utility_tags_utility_id" FOREIGN KEY ("utility_id") REFERENCES "utilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "utility_tags" ADD CONSTRAINT "FK_utility_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "utility_tags" DROP CONSTRAINT "FK_utility_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "utility_tags" DROP CONSTRAINT "FK_utility_tags_utility_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_utility_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_utility_tags_utility_id"`,
    );
    await queryRunner.query(`DROP TABLE "utility_tags"`);
  }
}
