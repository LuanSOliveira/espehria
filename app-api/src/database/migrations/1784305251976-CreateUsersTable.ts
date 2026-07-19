import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1784305251976 implements MigrationInterface {
  name = 'CreateUsersTable1784305251976';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying, "googleId" character varying, "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4c36e26db7a5813eb9ed43881b" ON "users"  ("googleId") WHERE "googleId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c36e26db7a5813eb9ed43881b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
  }
}
