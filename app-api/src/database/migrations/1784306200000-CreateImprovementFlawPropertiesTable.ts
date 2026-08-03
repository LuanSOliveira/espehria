import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImprovementFlawPropertiesTable1784306200000
  implements MigrationInterface
{
  name = 'CreateImprovementFlawPropertiesTable1784306200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "improvement_flaw_properties" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type_id" uuid NOT NULL, CONSTRAINT "PK_improvement_flaw_properties_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaw_properties_name" ON "improvement_flaw_properties" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaw_properties_type_id" ON "improvement_flaw_properties" ("type_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" ADD CONSTRAINT "FK_improvement_flaw_properties_type_id" FOREIGN KEY ("type_id") REFERENCES "improvement_flaw_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" DROP CONSTRAINT "FK_improvement_flaw_properties_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_properties_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_properties_name"`,
    );
    await queryRunner.query(`DROP TABLE "improvement_flaw_properties"`);
  }
}
