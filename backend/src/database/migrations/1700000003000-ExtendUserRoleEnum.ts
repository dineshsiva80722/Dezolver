import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendUserRoleEnum1700000003000 implements MigrationInterface {
  name = 'ExtendUserRoleEnum1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing role values to users_role_enum if it exists
    await queryRunner.query(`DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
        BEGIN
          EXECUTE 'ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS ''manager''';
          EXECUTE 'ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS ''super_admin''';
        EXCEPTION WHEN duplicate_object THEN
          -- ignore if already exists
          NULL;
        END;
      END IF;
    END
    $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No safe down migration for removing enum values in PostgreSQL
  }
}