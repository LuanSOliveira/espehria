import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConditionSectionsTable1784305860000 implements MigrationInterface {
  name = 'CreateConditionSectionsTable1784305860000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "condition_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "condition_id" uuid NOT NULL, CONSTRAINT "PK_condition_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_condition_sections_condition_id" ON "condition_sections" ("condition_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "condition_sections" ADD CONSTRAINT "FK_condition_sections_condition_id" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "condition_sections" DROP CONSTRAINT "FK_condition_sections_condition_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_condition_sections_condition_id"`,
    );
    await queryRunner.query(`DROP TABLE "condition_sections"`);
  }
}
