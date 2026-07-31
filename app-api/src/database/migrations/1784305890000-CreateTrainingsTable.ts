import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainingsTable1784305890000 implements MigrationInterface {
  name = 'CreateTrainingsTable1784305890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trainings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, CONSTRAINT "PK_trainings_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_trainings_name" ON "trainings" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_trainings_name"`);
    await queryRunner.query(`DROP TABLE "trainings"`);
  }
}
