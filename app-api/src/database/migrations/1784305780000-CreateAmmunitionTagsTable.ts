import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAmmunitionTagsTable1784305780000
  implements MigrationInterface
{
  name = 'CreateAmmunitionTagsTable1784305780000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ammunition_tags" ("ammunition_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_ammunition_tags" PRIMARY KEY ("ammunition_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ammunition_tags_ammunition_id" ON "ammunition_tags" ("ammunition_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ammunition_tags_tag_id" ON "ammunition_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ammunition_tags" ADD CONSTRAINT "FK_ammunition_tags_ammunition_id" FOREIGN KEY ("ammunition_id") REFERENCES "ammunition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ammunition_tags" ADD CONSTRAINT "FK_ammunition_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ammunition_tags" DROP CONSTRAINT "FK_ammunition_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ammunition_tags" DROP CONSTRAINT "FK_ammunition_tags_ammunition_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ammunition_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ammunition_tags_ammunition_id"`,
    );
    await queryRunner.query(`DROP TABLE "ammunition_tags"`);
  }
}
