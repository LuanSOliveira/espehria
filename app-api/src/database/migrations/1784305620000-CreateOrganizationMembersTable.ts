import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationMembersTable1784305620000
  implements MigrationInterface
{
  name = 'CreateOrganizationMembersTable1784305620000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role" character varying NOT NULL, "organization_id" uuid NOT NULL, "character_id" uuid NOT NULL, CONSTRAINT "PK_organization_members_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_organization_members_organization_id_character_id" ON "organization_members" ("organization_id", "character_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_members_organization_id" ON "organization_members" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_members_character_id" ON "organization_members" ("character_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_organization_members_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_organization_members_character_id" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_organization_members_character_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_organization_members_organization_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_organization_members_character_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_organization_members_organization_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_organization_members_organization_id_character_id"`,
    );
    await queryRunner.query(`DROP TABLE "organization_members"`);
  }
}
