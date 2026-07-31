import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignsTable1784305970000 implements MigrationInterface {
  name = 'CreateCampaignsTable1784305970000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "reference_image_url" character varying, "name" character varying NOT NULL, "description" text, "created_by_id" uuid NOT NULL, CONSTRAINT "PK_campaigns_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_campaigns_name_created_by_id" ON "campaigns" ("name", "created_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaigns_created_by_id" ON "campaigns" ("created_by_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_campaigns_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_campaigns_created_by_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaigns_created_by_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaigns_name_created_by_id"`,
    );
    await queryRunner.query(`DROP TABLE "campaigns"`);
  }
}
