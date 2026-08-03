import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignSectionsTable1784305990000 implements MigrationInterface {
  name = 'CreateCampaignSectionsTable1784305990000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "campaign_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "campaign_id" uuid NOT NULL, CONSTRAINT "PK_campaign_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_sections_campaign_id" ON "campaign_sections" ("campaign_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_sections" ADD CONSTRAINT "FK_campaign_sections_campaign_id" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaign_sections" DROP CONSTRAINT "FK_campaign_sections_campaign_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaign_sections_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_sections"`);
  }
}
