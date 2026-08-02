import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSheetsTable1784306160000 implements MigrationInterface {
  name = 'CreateSheetsTable1784306160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sheets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "level" integer NOT NULL DEFAULT 1, "campaign_id" uuid, "race_id" uuid, "created_by_id" uuid NOT NULL, CONSTRAINT "PK_sheets_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sheets_created_by_id" ON "sheets" ("created_by_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sheets_campaign_id" ON "sheets" ("campaign_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_campaign_id" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_race_id" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" ADD CONSTRAINT "FK_sheets_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP CONSTRAINT "FK_sheets_created_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP CONSTRAINT "FK_sheets_race_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sheets" DROP CONSTRAINT "FK_sheets_campaign_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_sheets_campaign_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sheets_created_by_id"`);
    await queryRunner.query(`DROP TABLE "sheets"`);
  }
}
