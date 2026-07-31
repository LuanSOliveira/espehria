import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTalentTagsTable1784305920000
  implements MigrationInterface
{
  name = 'CreateTalentTagsTable1784305920000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "talent_tags" ("talent_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_talent_tags" PRIMARY KEY ("talent_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_talent_tags_talent_id" ON "talent_tags" ("talent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_talent_tags_tag_id" ON "talent_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "talent_tags" ADD CONSTRAINT "FK_talent_tags_talent_id" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "talent_tags" ADD CONSTRAINT "FK_talent_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "talent_tags" DROP CONSTRAINT "FK_talent_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "talent_tags" DROP CONSTRAINT "FK_talent_tags_talent_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_talent_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_talent_tags_talent_id"`,
    );
    await queryRunner.query(`DROP TABLE "talent_tags"`);
  }
}
