import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatistics1700000002000 implements MigrationInterface {
  name = 'AddUserStatistics1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('user_statistics');
    if (hasTable) return;
    await queryRunner.query(`
      CREATE TABLE user_statistics (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        problems_solved INTEGER DEFAULT 0,
        problems_attempted INTEGER DEFAULT 0,
        total_submissions INTEGER DEFAULT 0,
        accepted_submissions INTEGER DEFAULT 0,
        contests_participated INTEGER DEFAULT 0,
        best_rank INTEGER,
        contribution_points INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_submission_date DATE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_statistics CASCADE`);
  }
}