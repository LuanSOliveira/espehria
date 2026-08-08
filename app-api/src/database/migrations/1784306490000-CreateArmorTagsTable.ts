import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArmorTagsTable1784306490000 implements MigrationInterface {
  name = 'CreateArmorTagsTable1784306490000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "armor_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "armor_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_armor_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_armor_tags_armor_id_tag_id" ON "armor_tags" ("armor_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_armor_tags_armor_id" ON "armor_tags" ("armor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_armor_tags_tag_id" ON "armor_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_tags" ADD CONSTRAINT "FK_armor_tags_armor_id" FOREIGN KEY ("armor_id") REFERENCES "armors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_tags" ADD CONSTRAINT "FK_armor_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armor_tags" DROP CONSTRAINT "FK_armor_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "armor_tags" DROP CONSTRAINT "FK_armor_tags_armor_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_armor_tags_armor_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_armor_tags_armor_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE "armor_tags"`);
  }
}
