import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFamilyTagsTable1784305650000 implements MigrationInterface {
  name = 'CreateFamilyTagsTable1784305650000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "family_tags" ("family_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_family_tags" PRIMARY KEY ("family_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_tags_family_id" ON "family_tags" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_tags_tag_id" ON "family_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_tags" ADD CONSTRAINT "FK_family_tags_family_id" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_tags" ADD CONSTRAINT "FK_family_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "family_tags" DROP CONSTRAINT "FK_family_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_tags" DROP CONSTRAINT "FK_family_tags_family_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_family_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_family_tags_family_id"`);
    await queryRunner.query(`DROP TABLE "family_tags"`);
  }
}
