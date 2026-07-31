import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributesTable1784306030000
  implements MigrationInterface
{
  name = 'CreateAttributesTable1784306030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attributes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_attributes_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_attributes_name" ON "attributes" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_attributes_name"`);
    await queryRunner.query(`DROP TABLE "attributes"`);
  }
}
