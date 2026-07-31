import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlannedSessionsTable1784306000000
  implements MigrationInterface
{
  name = 'CreatePlannedSessionsTable1784306000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "planned_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "introduction" text, "campaign_id" uuid NOT NULL, CONSTRAINT "PK_planned_sessions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_planned_sessions_campaign_id" ON "planned_sessions" ("campaign_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_sessions" ADD CONSTRAINT "FK_planned_sessions_campaign_id" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_sessions" DROP CONSTRAINT "FK_planned_sessions_campaign_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_planned_sessions_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "planned_sessions"`);
  }
}
