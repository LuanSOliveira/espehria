import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRuleSectionsTable1784305800000 implements MigrationInterface {
  name = 'CreateRuleSectionsTable1784305800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rule_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "rule_id" uuid NOT NULL, CONSTRAINT "PK_rule_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rule_sections_rule_id" ON "rule_sections" ("rule_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sections" ADD CONSTRAINT "FK_rule_sections_rule_id" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rule_sections" DROP CONSTRAINT "FK_rule_sections_rule_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_rule_sections_rule_id"`);
    await queryRunner.query(`DROP TABLE "rule_sections"`);
  }
}
