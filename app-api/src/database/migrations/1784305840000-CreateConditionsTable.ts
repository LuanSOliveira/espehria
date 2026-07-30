import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConditionsTable1784305840000 implements MigrationInterface {
  name = 'CreateConditionsTable1784305840000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "conditions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, CONSTRAINT "PK_conditions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_conditions_name" ON "conditions" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_conditions_name"`);
    await queryRunner.query(`DROP TABLE "conditions"`);
  }
}
