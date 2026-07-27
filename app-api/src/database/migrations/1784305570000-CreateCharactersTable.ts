import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharactersTable1784305570000
  implements MigrationInterface
{
  name = 'CreateCharactersTable1784305570000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "characters" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "is_dead" boolean NOT NULL DEFAULT false, "race_id" uuid, CONSTRAINT "PK_characters_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_characters_race_id" ON "characters" ("race_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "characters" ADD CONSTRAINT "FK_characters_race_id" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "characters" DROP CONSTRAINT "FK_characters_race_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_characters_race_id"`);
    await queryRunner.query(`DROP TABLE "characters"`);
  }
}
