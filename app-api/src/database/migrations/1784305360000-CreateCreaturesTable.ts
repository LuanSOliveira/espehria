import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreaturesTable1784305360000 implements MigrationInterface {
  name = 'CreateCreaturesTable1784305360000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "creatures" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "category_id" uuid NOT NULL, "reference_image_url" character varying, "other_names" character varying, "threat_level" character varying, "average_life_expectancy" character varying, "physical_characteristics" text, "habitat" text, "behavior" text, "diet" text, "life_cycle" text, "life_stage_infant" text, "life_stage_young" text, "life_stage_adult" text, "life_stage_elder" text, "abilities_and_powers" text, "resistances" text, "weaknesses" text, "combat" text, "attack_methods" text, "strategy" text, "danger_degree" text, "obtained_resources" text, "commercial_value" text, "relation_with_civilizations" text, "mythology_and_folklore" text, "encounter_record" text, "scholars_curiosity" text, CONSTRAINT "PK_creatures_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_creatures_name" ON "creatures" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatures" ADD CONSTRAINT "FK_creatures_category_id" FOREIGN KEY ("category_id") REFERENCES "creature_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creatures" DROP CONSTRAINT "FK_creatures_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_creatures_name"`);
    await queryRunner.query(`DROP TABLE "creatures"`);
  }
}
