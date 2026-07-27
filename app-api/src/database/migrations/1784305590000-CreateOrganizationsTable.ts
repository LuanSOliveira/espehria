import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationsTable1784305590000
  implements MigrationInterface
{
  name = 'CreateOrganizationsTable1784305590000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_organizations_name" ON "organizations" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_organizations_name"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
