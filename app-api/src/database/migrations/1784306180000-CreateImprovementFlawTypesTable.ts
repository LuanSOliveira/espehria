import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImprovementFlawTypesTable1784306180000
  implements MigrationInterface
{
  name = 'CreateImprovementFlawTypesTable1784306180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "improvement_flaw_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_improvement_flaw_types_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaw_types_name" ON "improvement_flaw_types" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_types_name"`,
    );
    await queryRunner.query(`DROP TABLE "improvement_flaw_types"`);
  }
}
