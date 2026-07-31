import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharacteristicToEntityLinksTable1784306090000
  implements MigrationInterface
{
  name = 'AddCharacteristicToEntityLinksTable1784306090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD COLUMN "owner_characteristic_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD COLUMN "target_characteristic_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_owner_characteristic_id" FOREIGN KEY ("owner_characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "FK_entity_links_target_characteristic_id" FOREIGN KEY ("target_characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_links_link_type_owner_characteristic_id" ON "entity_links" ("link_type", "owner_characteristic_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id, owner_characteristic_id) = 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_target_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_target_exclusive" CHECK (num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id, target_characteristic_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "owner_characteristic_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id", "target_characteristic_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_unique_combination"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_entity_links_unique_combination" ON "entity_links" ("link_type", "owner_training_id", "owner_talent_id", "owner_technique_id", "owner_spell_id", "target_training_id", "target_talent_id", "target_technique_id", "target_spell_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_target_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_target_exclusive" CHECK (num_nonnulls(target_training_id, target_talent_id, target_technique_id, target_spell_id) = 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "CK_entity_links_owner_exclusive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" ADD CONSTRAINT "CK_entity_links_owner_exclusive" CHECK (num_nonnulls(owner_training_id, owner_talent_id, owner_technique_id, owner_spell_id) = 1)`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_entity_links_link_type_owner_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_target_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP CONSTRAINT "FK_entity_links_owner_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP COLUMN "target_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_links" DROP COLUMN "owner_characteristic_id"`,
    );
  }
}
