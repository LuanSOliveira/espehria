import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTraitTagsTable1784306610000 implements MigrationInterface {
  name = 'CreateTraitTagsTable1784306610000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trait_tags" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT 0, "trait_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_trait_tags_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_trait_tags_trait_id_tag_id" ON "trait_tags" ("trait_id", "tag_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_trait_tags_trait_id" ON "trait_tags" ("trait_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_trait_tags_tag_id" ON "trait_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "trait_tags" ADD CONSTRAINT "FK_trait_tags_trait_id" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trait_tags" ADD CONSTRAINT "FK_trait_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trait_tags" DROP CONSTRAINT "FK_trait_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trait_tags" DROP CONSTRAINT "FK_trait_tags_trait_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_trait_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_trait_tags_trait_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_trait_tags_trait_id_tag_id"`,
    );
    await queryRunner.query(`DROP TABLE "trait_tags"`);
  }
}
