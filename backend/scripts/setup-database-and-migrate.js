const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// First connect to default 'postgres' database to create our database
const defaultPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function setupDatabase() {
  const client = await defaultPool.connect();
  
  try {
    console.log('🔍 Checking if database exists...\n');
    
    // Check if database exists
    const checkDb = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'techfolks_db'
    `);
    
    if (checkDb.rows.length === 0) {
      console.log('📦 Creating techfolks_db database...');
      await client.query('CREATE DATABASE techfolks_db');
      console.log('✅ Database created successfully!\n');
    } else {
      console.log('✅ Database techfolks_db already exists\n');
    }
    
  } catch (error) {
    console.error('❌ Error checking/creating database:', error.message);
    throw error;
  } finally {
    client.release();
    await defaultPool.end();
  }
}

async function runMigration() {
  // Now connect to the actual techfolks_db
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'techfolks_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting manager-student hierarchy migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/add_manager_simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration as a single statement
    console.log('📝 Executing migration SQL...');
    
    try {
      await client.query(migrationSQL);
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message.includes('already exists') && !err.message.includes('already added') && !err.message.includes('duplicate')) {
        throw err;
      } else {
        console.log('  ⚠️  Some changes were already applied (this is safe)');
      }
    }
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  - Added "manager" role to user_role enum');
    console.log('  - Added managed_by column to users table');
    console.log('  - Added added_by column to users table');
    console.log('  - Created indexes for performance');
    console.log('  - Updated existing users with added_by = "self"\n');
    
    // Verify the migration
    try {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('managed_by', 'added_by')
        ORDER BY column_name
      `);
      
      if (result.rows.length > 0) {
        console.log('✓ Verification - New columns added:');
        result.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
      }
    } catch (err) {
      console.log('⚠️  Could not verify columns (table may not exist yet)');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    if (!error.message.includes('does not exist')) {
      console.error('\nError details:', error);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup and migration
(async () => {
  try {
    await setupDatabase();
    await runMigration();
    console.log('\n🎉 All done! You can now start your backend server.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
})();

