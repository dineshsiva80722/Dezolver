const { Pool } = require('pg');

// Use the same config as the app
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function verifyAndFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database and columns...\n');
    
    // Check which database we're connected to
    const dbCheck = await client.query('SELECT current_database()');
    console.log(`✓ Connected to database: ${dbCheck.rows[0].current_database}\n`);
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist!');
      console.log('   Please start the backend server first to create tables.\n');
      process.exit(1);
    }
    
    console.log('✓ Users table exists\n');
    
    // Check for managed_by column
    const managedByCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'managed_by'
      );
    `);
    
    if (!managedByCheck.rows[0].exists) {
      console.log('📝 Adding managed_by column...');
      await client.query('ALTER TABLE users ADD COLUMN managed_by UUID');
      await client.query('ALTER TABLE users ADD CONSTRAINT fk_users_managed_by FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL');
      console.log('✅ managed_by column added\n');
    } else {
      console.log('✓ managed_by column already exists\n');
    }
    
    // Check for added_by column
    const addedByCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'added_by'
      );
    `);
    
    if (!addedByCheck.rows[0].exists) {
      console.log('📝 Adding added_by column...');
      await client.query("ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self'");
      await client.query("UPDATE users SET added_by = 'self' WHERE added_by IS NULL");
      console.log('✅ added_by column added\n');
    } else {
      console.log('✓ added_by column already exists\n');
    }
    
    // Create indexes if they don't exist
    console.log('📝 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by)');
    console.log('✅ Indexes created\n');
    
    // Show final verification
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('managed_by', 'added_by', 'role')
      ORDER BY column_name
    `);
    
    console.log('✅ Final Verification:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🎉 Database is ready!');
    console.log('\n📋 Next: Restart your backend server (npm run dev)');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAndFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

