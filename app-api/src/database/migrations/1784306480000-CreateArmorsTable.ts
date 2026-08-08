import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArmorsTable1784306480000 implements MigrationInterface {
  name = 'CreateArmorsTable1784306480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "armors" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "reference_image" character varying, "description" text, "price" integer, "currency_id" uuid, "private_information" text, CONSTRAINT "PK_armors_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_armors_name" ON "armors" ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "armors" ADD CONSTRAINT "FK_armors_currency_id" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "armors" DROP CONSTRAINT "FK_armors_currency_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_armors_name"`);
    await queryRunner.query(`DROP TABLE "armors"`);
  }
}
