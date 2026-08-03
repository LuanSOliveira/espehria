import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeImprovementFlawPropertiesTypeToManyToMany1784306240000 implements MigrationInterface {
  name = 'ChangeImprovementFlawPropertiesTypeToManyToMany1784306240000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "improvement_flaw_property_types" ("property_id" uuid NOT NULL, "type_id" uuid NOT NULL, CONSTRAINT "PK_improvement_flaw_property_types" PRIMARY KEY ("property_id", "type_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaw_property_types_property_id" ON "improvement_flaw_property_types" ("property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaw_property_types_type_id" ON "improvement_flaw_property_types" ("type_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_property_types" ADD CONSTRAINT "FK_improvement_flaw_property_types_property_id" FOREIGN KEY ("property_id") REFERENCES "improvement_flaw_properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_property_types" ADD CONSTRAINT "FK_improvement_flaw_property_types_type_id" FOREIGN KEY ("type_id") REFERENCES "improvement_flaw_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `INSERT INTO "improvement_flaw_property_types" ("property_id", "type_id") SELECT "id", "type_id" FROM "improvement_flaw_properties"`,
    );

    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" DROP CONSTRAINT "FK_improvement_flaw_properties_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_properties_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" DROP COLUMN "type_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" ADD COLUMN "type_id" uuid`,
    );

    await queryRunner.query(
      `UPDATE "improvement_flaw_properties" p SET "type_id" = (SELECT "type_id" FROM "improvement_flaw_property_types" WHERE "property_id" = p."id" LIMIT 1)`,
    );

    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" ALTER COLUMN "type_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaw_properties_type_id" ON "improvement_flaw_properties" ("type_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_properties" ADD CONSTRAINT "FK_improvement_flaw_properties_type_id" FOREIGN KEY ("type_id") REFERENCES "improvement_flaw_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_property_types" DROP CONSTRAINT "FK_improvement_flaw_property_types_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaw_property_types" DROP CONSTRAINT "FK_improvement_flaw_property_types_property_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_property_types_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaw_property_types_property_id"`,
    );
    await queryRunner.query(`DROP TABLE "improvement_flaw_property_types"`);
  }
}
