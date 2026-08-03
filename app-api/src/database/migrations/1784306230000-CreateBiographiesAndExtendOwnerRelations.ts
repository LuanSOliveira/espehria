import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBiographiesAndExtendOwnerRelations1784306230000 implements MigrationInterface {
  name = 'CreateBiographiesAndExtendOwnerRelations1784306230000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "biographies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, "image_reference" character varying, CONSTRAINT "PK_biographies_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_biographies_name" ON "biographies" ("name")`,
    );

    await queryRunner.query(
      `CREATE TABLE "biography_tags" ("biography_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_biography_tags" PRIMARY KEY ("biography_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_biography_tags_biography_id" ON "biography_tags" ("biography_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_biography_tags_tag_id" ON "biography_tags" ("tag_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "biography_tags" ADD CONSTRAINT "FK_biography_tags_biography_id" FOREIGN KEY ("biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "biography_tags" ADD CONSTRAINT "FK_biography_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD COLUMN "owner_biography_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "FK_improvement_flaws_owner_biography_id" FOREIGN KEY ("owner_biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_improvement_flaws_owner_biography" ON "improvement_flaws" ("owner_biography_id", "category")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "CK_improvement_flaws_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id, owner_biography_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "owner_biography_id", "type_id", "property_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD COLUMN "owner_biography_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD COLUMN "target_biography_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_biography_id" FOREIGN KEY ("owner_biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_biography_id" FOREIGN KEY ("target_biography_id") REFERENCES "biographies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_biography_id" ON "entity_links" ("link_type", "owner_biography_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id, owner_characteristic_id, owner_biography_id) = 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_target_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_target_exclusive" CHECK (num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id, target_characteristic_id, target_biography_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "owner_characteristic_id", "owner_biography_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id", "target_characteristic_id", "target_biography_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "owner_characteristic_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id", "target_characteristic_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_target_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_target_exclusive" CHECK (num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id, target_characteristic_id) = 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id, owner_characteristic_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP COLUMN "target_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP COLUMN "owner_biography_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_improvement_flaws_unique_combination" ON "improvement_flaws" ("category", "owner_talent_id", "owner_training_id", "owner_characteristic_id", "type_id", "property_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "CK_improvement_flaws_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" ADD CONSTRAINT "CK_improvement_flaws_owner_exclusive" CHECK (num_nonnulls(owner_talent_id, owner_training_id, owner_characteristic_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_improvement_flaws_owner_biography"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP CONSTRAINT "FK_improvement_flaws_owner_biography_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "improvement_flaws" DROP COLUMN "owner_biography_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "biography_tags" DROP CONSTRAINT "FK_biography_tags_tag_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "biography_tags" DROP CONSTRAINT "FK_biography_tags_biography_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_biography_tags_tag_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_biography_tags_biography_id"`,
    );
    await queryRunner.query(`DROP TABLE "biography_tags"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_biographies_name"`);
    await queryRunner.query(`DROP TABLE "biographies"`);
  }
}
