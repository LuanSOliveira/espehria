import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignAllowedUsersTable1784306170000
  implements MigrationInterface
{
  name = 'CreateCampaignAllowedUsersTable1784306170000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "campaign_allowed_users" ("campaign_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_campaign_allowed_users" PRIMARY KEY ("campaign_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_allowed_users_campaign_id" ON "campaign_allowed_users" ("campaign_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_allowed_users_user_id" ON "campaign_allowed_users" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_allowed_users" ADD CONSTRAINT "FK_campaign_allowed_users_campaign_id" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_allowed_users" ADD CONSTRAINT "FK_campaign_allowed_users_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaign_allowed_users" DROP CONSTRAINT "FK_campaign_allowed_users_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_allowed_users" DROP CONSTRAINT "FK_campaign_allowed_users_campaign_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaign_allowed_users_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_campaign_allowed_users_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_allowed_users"`);
  }
}
