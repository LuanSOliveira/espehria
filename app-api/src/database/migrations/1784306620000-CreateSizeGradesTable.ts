import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSizeGradesTable1784306620000 implements MigrationInterface {
  name = 'CreateSizeGradesTable1784306620000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "size_grades" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_size_grades_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_size_grades_name" ON "size_grades" ("name")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_size_grades_order" ON "size_grades" ("order")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_size_grades_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_size_grades_name"`);
    await queryRunner.query(`DROP TABLE "size_grades"`);
  }
}
