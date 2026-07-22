import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationTagsTable1784305410000 implements MigrationInterface {
  name = 'CreateLocationTagsTable1784305410000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_tags" ("location_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_location_tags" PRIMARY KEY ("location_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_tags_location_id" ON "location_tags" ("location_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_tags_tag_id" ON "location_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_tags" ADD CONSTRAINT "FK_location_tags_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_tags" ADD CONSTRAINT "FK_location_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_tags" DROP CONSTRAINT "FK_location_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_tags" DROP CONSTRAINT "FK_location_tags_location_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_location_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_location_tags_location_id"`,
    );
    await queryRunner.query(`DROP TABLE "location_tags"`);
  }
}
