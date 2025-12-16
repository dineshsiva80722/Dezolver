import { AppDataSource } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Initializing database connection...\n');
    
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/add_manager_student_hierarchy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing manager-student hierarchy migration...\n');
    
    // Execute the migration
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      await queryRunner.startTransaction();
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          await queryRunner.query(statement);
        }
      }
      
      await queryRunner.commitTransaction();
      
      console.log('✅ Migration completed successfully!\n');
      console.log('Summary:');
      console.log('  - Added "manager" role to user_role enum');
      console.log('  - Added managed_by column to users table');
      console.log('  - Added added_by column to users table');
      console.log('  - Created indexes for performance');
      console.log('  - Updated existing users with added_by = "self"\n');
      
      // Verify the migration
      const result = await queryRunner.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('managed_by', 'added_by')
        ORDER BY column_name
      `);
      
      console.log('✓ Verification - New columns added:');
      result.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists') || error.message.includes('already added')) {
      console.log('\n⚠️  Note: Some changes may already be applied. This is usually safe to ignore.');
    } else {
      console.error('\nError details:', error);
    }
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n✅ Database connection closed.');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n🎉 All done! You can now restart your backend server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

