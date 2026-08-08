import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShieldTagsTable1784306530000
  implements MigrationInterface
{
  name = 'CreateShieldTagsTable1784306530000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "shield_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "shield_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_shield_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_shield_tags_shield_id_tag_id" ON "shield_tags" ("shield_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shield_tags_shield_id" ON "shield_tags" ("shield_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shield_tags_tag_id" ON "shield_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "shield_tags" ADD CONSTRAINT "FK_shield_tags_shield_id" FOREIGN KEY ("shield_id") REFERENCES "shields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shield_tags" ADD CONSTRAINT "FK_shield_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shield_tags" DROP CONSTRAINT "FK_shield_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shield_tags" DROP CONSTRAINT "FK_shield_tags_shield_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_shield_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shield_tags_shield_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_shield_tags_shield_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE "shield_tags"`);
  }
}
