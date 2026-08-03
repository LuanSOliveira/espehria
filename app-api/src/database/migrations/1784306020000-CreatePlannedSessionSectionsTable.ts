import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlannedSessionSectionsTable1784306020000 implements MigrationInterface {
  name = 'CreatePlannedSessionSectionsTable1784306020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "planned_session_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "planned_session_id" uuid NOT NULL, CONSTRAINT "PK_planned_session_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_planned_session_sections_planned_session_id" ON "planned_session_sections" ("planned_session_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_session_sections" ADD CONSTRAINT "FK_planned_session_sections_planned_session_id" FOREIGN KEY ("planned_session_id") REFERENCES "planned_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_session_sections" DROP CONSTRAINT "FK_planned_session_sections_planned_session_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_planned_session_sections_planned_session_id"`,
    );
    await queryRunner.query(`DROP TABLE "planned_session_sections"`);
  }
}
