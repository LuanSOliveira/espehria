import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTable1784305480000 implements MigrationInterface {
  name = 'CreateEventsTable1784305480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image_url" character varying, "start_year" character varying, "end_year" character varying, "description" text, "era_id" uuid, CONSTRAINT "PK_events_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_events_era_id" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_events_era_id"`,
    );
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
