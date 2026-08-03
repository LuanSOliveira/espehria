import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaceCharacteristicsAndTalentsRelations1784306110000 implements MigrationInterface {
  name = 'AddRaceCharacteristicsAndTalentsRelations1784306110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "race_characteristics" ("race_id" uuid NOT NULL, "characteristic_id" uuid NOT NULL, CONSTRAINT "PK_race_characteristics" PRIMARY KEY ("race_id", "characteristic_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_characteristics_race_id" ON "race_characteristics" ("race_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_characteristics_characteristic_id" ON "race_characteristics" ("characteristic_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_characteristics" ADD CONSTRAINT "FK_race_characteristics_race_id" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_characteristics" ADD CONSTRAINT "FK_race_characteristics_characteristic_id" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "race_talents" ("race_id" uuid NOT NULL, "talent_id" uuid NOT NULL, CONSTRAINT "PK_race_talents" PRIMARY KEY ("race_id", "talent_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_talents_race_id" ON "race_talents" ("race_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_race_talents_talent_id" ON "race_talents" ("talent_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_talents" ADD CONSTRAINT "FK_race_talents_race_id" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_talents" ADD CONSTRAINT "FK_race_talents_talent_id" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "races" DROP COLUMN "physical_characteristics"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "races" ADD COLUMN "physical_characteristics" text`,
    );

    await queryRunner.query(
      `ALTER TABLE "race_talents" DROP CONSTRAINT "FK_race_talents_talent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_talents" DROP CONSTRAINT "FK_race_talents_race_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_race_talents_talent_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_race_talents_race_id"`);
    await queryRunner.query(`DROP TABLE "race_talents"`);

    await queryRunner.query(
      `ALTER TABLE "race_characteristics" DROP CONSTRAINT "FK_race_characteristics_characteristic_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "race_characteristics" DROP CONSTRAINT "FK_race_characteristics_race_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_race_characteristics_characteristic_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_race_characteristics_race_id"`,
    );
    await queryRunner.query(`DROP TABLE "race_characteristics"`);
  }
}
