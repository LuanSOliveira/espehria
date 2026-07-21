import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTagsTable1784305370000 implements MigrationInterface {
  name = 'CreateTagsTable1784305370000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "color" character varying NOT NULL, CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tags_name" ON "tags" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tags_name"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
