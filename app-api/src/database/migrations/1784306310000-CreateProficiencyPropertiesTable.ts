import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProficiencyPropertiesTable1784306310000 implements MigrationInterface {
  name = 'CreateProficiencyPropertiesTable1784306310000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "proficiency_properties" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_proficiency_properties_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_proficiency_properties_name" ON "proficiency_properties" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_proficiency_properties_name"`,
    );
    await queryRunner.query(`DROP TABLE "proficiency_properties"`);
  }
}
