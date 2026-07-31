import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntityLinks1784306060000 implements MigrationInterface {
  name = 'CreateEntityLinks1784306060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."entity_links_link_type_enum" AS ENUM('improved_from', 'requirement')`,
    );
    await queryRunner.query(
      `CREATE TABLE "entity_links" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "link_type" "public"."entity_links_link_type_enum" NOT NULL, "owner_training_id" uuid, "owner_talent_id" uuid, "owner_technique_id" uuid, "owner_spell_id" uuid, "target_training_id" uuid, "target_talent_id" uuid, "target_technique_id" uuid, "target_spell_id" uuid, CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id) = 1), CONSTRAINT "CK_entity_links_target_exclusive" CHECK (num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id) = 1), CONSTRAINT "PK_entity_links_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_training_id" ON "entity_links" ("link_type", "owner_training_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_talent_id" ON "entity_links" ("link_type", "owner_talent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_technique_id" ON "entity_links" ("link_type", "owner_technique_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_spell_id" ON "entity_links" ("link_type", "owner_spell_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_training_id" FOREIGN KEY ("owner_training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_talent_id" FOREIGN KEY ("owner_talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_technique_id" FOREIGN KEY ("owner_technique_id") REFERENCES "techniques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_spell_id" FOREIGN KEY ("owner_spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_training_id" FOREIGN KEY ("target_training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_talent_id" FOREIGN KEY ("target_talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_technique_id" FOREIGN KEY ("target_technique_id") REFERENCES "techniques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_spell_id" FOREIGN KEY ("target_spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_spell_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_technique_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_training_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_spell_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_technique_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_training_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_spell_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_technique_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_talent_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_training_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_unique_combination"`,
    );
    await queryRunner.query(`DROP TABLE "entity_links"`);
    await queryRunner.query(`DROP TYPE "public"."entity_links_link_type_enum"`);
  }
}
