import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDivinityTagsTable1784305520000 implements MigrationInterface {
  name = 'CreateDivinityTagsTable1784305520000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "divinity_tags" ("divinity_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_divinity_tags" PRIMARY KEY ("divinity_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_divinity_tags_divinity_id" ON "divinity_tags" ("divinity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_divinity_tags_tag_id" ON "divinity_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinity_tags" ADD CONSTRAINT "FK_divinity_tags_divinity_id" FOREIGN KEY ("divinity_id") REFERENCES "divinities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinity_tags" ADD CONSTRAINT "FK_divinity_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "divinity_tags" DROP CONSTRAINT "FK_divinity_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "divinity_tags" DROP CONSTRAINT "FK_divinity_tags_divinity_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_divinity_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_divinity_tags_divinity_id"`,
    );
    await queryRunner.query(`DROP TABLE "divinity_tags"`);
  }
}
