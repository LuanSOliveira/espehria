import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProficiencyGradationsTable1784306330000 implements MigrationInterface {
  name = 'CreateProficiencyGradationsTable1784306330000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "proficiency_gradations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "level" integer NOT NULL, CONSTRAINT "PK_proficiency_gradations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_proficiency_gradations_name" ON "proficiency_gradations" ("name")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_proficiency_gradations_level" ON "proficiency_gradations" ("level")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiency_gradations_level"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiency_gradations_name"`,
    );
    await queryRunner.query(`DROP TABLE "proficiency_gradations"`);
  }
}
