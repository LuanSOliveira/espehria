import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkillSectionsTable1784305830000 implements MigrationInterface {
  name = 'CreateSkillSectionsTable1784305830000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "skill_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "label" character varying NOT NULL, "description" text, "order" integer NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_skill_sections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skill_sections_skill_id" ON "skill_sections" ("skill_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "skill_sections" ADD CONSTRAINT "FK_skill_sections_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "skill_sections" DROP CONSTRAINT "FK_skill_sections_skill_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_skill_sections_skill_id"`,
    );
    await queryRunner.query(`DROP TABLE "skill_sections"`);
  }
}
