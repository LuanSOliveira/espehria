import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTechniqueTagsTable1784305940000 implements MigrationInterface {
  name = 'CreateTechniqueTagsTable1784305940000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "technique_tags" ("technique_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_technique_tags" PRIMARY KEY ("technique_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_technique_tags_technique_id" ON "technique_tags" ("technique_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_technique_tags_tag_id" ON "technique_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "technique_tags" ADD CONSTRAINT "FK_technique_tags_technique_id" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "technique_tags" ADD CONSTRAINT "FK_technique_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "technique_tags" DROP CONSTRAINT "FK_technique_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technique_tags" DROP CONSTRAINT "FK_technique_tags_technique_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_technique_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_technique_tags_technique_id"`,
    );
    await queryRunner.query(`DROP TABLE "technique_tags"`);
  }
}
