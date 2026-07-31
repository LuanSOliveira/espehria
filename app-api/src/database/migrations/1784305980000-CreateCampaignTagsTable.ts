import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignTagsTable1784305980000
  implements MigrationInterface
{
  name = 'CreateCampaignTagsTable1784305980000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "campaign_tags" ("campaign_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_campaign_tags" PRIMARY KEY ("campaign_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_tags_campaign_id" ON "campaign_tags" ("campaign_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_tags_tag_id" ON "campaign_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_tags" ADD CONSTRAINT "FK_campaign_tags_campaign_id" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_tags" ADD CONSTRAINT "FK_campaign_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaign_tags" DROP CONSTRAINT "FK_campaign_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_tags" DROP CONSTRAINT "FK_campaign_tags_campaign_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_campaign_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaign_tags_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_tags"`);
  }
}
