import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationTagsTable1784305600000
  implements MigrationInterface
{
  name = 'CreateOrganizationTagsTable1784305600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organization_tags" ("organization_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_organization_tags" PRIMARY KEY ("organization_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_tags_organization_id" ON "organization_tags" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_tags_tag_id" ON "organization_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_tags" ADD CONSTRAINT "FK_organization_tags_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_tags" ADD CONSTRAINT "FK_organization_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_tags" DROP CONSTRAINT "FK_organization_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_tags" DROP CONSTRAINT "FK_organization_tags_organization_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_organization_tags_tag_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_organization_tags_organization_id"`,
    );
    await queryRunner.query(`DROP TABLE "organization_tags"`);
  }
}
