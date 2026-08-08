import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccessoryTagsTable1784306510000
  implements MigrationInterface
{
  name = 'CreateAccessoryTagsTable1784306510000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accessory_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "accessory_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_accessory_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_accessory_tags_accessory_id_tag_id" ON "accessory_tags" ("accessory_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_accessory_tags_accessory_id" ON "accessory_tags" ("accessory_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_accessory_tags_tag_id" ON "accessory_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessory_tags" ADD CONSTRAINT "FK_accessory_tags_accessory_id" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessory_tags" ADD CONSTRAINT "FK_accessory_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accessory_tags" DROP CONSTRAINT "FK_accessory_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessory_tags" DROP CONSTRAINT "FK_accessory_tags_accessory_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_accessory_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_accessory_tags_accessory_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_accessory_tags_accessory_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE "accessory_tags"`);
  }
}
