import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterialTagsTable1784305740000 implements MigrationInterface {
  name = 'CreateMaterialTagsTable1784305740000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "material_tags" ("material_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_material_tags" PRIMARY KEY ("material_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_material_tags_material_id" ON "material_tags" ("material_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_material_tags_tag_id" ON "material_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_tags" ADD CONSTRAINT "FK_material_tags_material_id" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_tags" ADD CONSTRAINT "FK_material_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_tags" DROP CONSTRAINT "FK_material_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_tags" DROP CONSTRAINT "FK_material_tags_material_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_material_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_material_tags_material_id"`,
    );
    await queryRunner.query(`DROP TABLE "material_tags"`);
  }
}
