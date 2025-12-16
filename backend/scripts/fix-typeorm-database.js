const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Use EXACT same config as TypeORM
const dbName = process.env.DB_NAME || 'techfolks_db';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';

console.log('\n🔍 Configuration:');
console.log(`   Database: ${dbName}`);
console.log(`   User: ${dbUser}\n`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: dbName,
  user: dbUser,
  password: dbPassword,
});

async function fixDatabase() {
  const client = await pool.connect();
  
  try {
    // Verify connection
    const dbCheck = await client.query('SELECT current_database(), current_user');
    console.log(`✓ Connected to: ${dbCheck.rows[0].current_database} as ${dbCheck.rows[0].current_user}\n`);
    
    // Check users table
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Current users in database: ${userCount.rows[0].count}\n`);
    
    console.log('🚀 Adding manager-student columns...\n');
    
    // Add both columns in one transaction
    await client.query('BEGIN');
    
    try {
      // Add managed_by if it doesn't exist
      await client.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'managed_by'
            ) THEN
                ALTER TABLE users ADD COLUMN managed_by UUID;
                ALTER TABLE users ADD CONSTRAINT fk_users_managed_by 
                    FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL;
            END IF;
        END $$;
      `);
      
      // Add added_by if it doesn't exist
      await client.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'added_by'
            ) THEN
                ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self';
            END IF;
        END $$;
      `);
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by)');
      
      // Update existing users
      await client.query("UPDATE users SET added_by = 'self' WHERE added_by IS NULL");
      
      await client.query('COMMIT');
      console.log('✅ Columns added successfully!\n');
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
    
    // Ensure admin user exists with correct password
    const adminCheck = await client.query("SELECT id, username, role FROM users WHERE username = 'admin'");
    
    if (adminCheck.rows.length === 0) {
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash('Admin123', 10);
      await client.query(`
        INSERT INTO users (
          username, email, password, full_name, role, 
          is_verified, is_active, added_by, rating, max_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'admin', 'admin@techfolks.com', hashedPassword, 'Admin User', 'admin',
        true, true, 'self', 1500, 1500
      ]);
      console.log('✅ Admin user created\n');
    } else {
      console.log('📝 Updating admin user password and role...');
      const hashedPassword = await bcrypt.hash('Admin123', 10);
      await client.query(`
        UPDATE users 
        SET password = $1, role = 'admin', added_by = 'self', is_verified = true, is_active = true
        WHERE username = 'admin'
      `, [hashedPassword]);
      console.log('✅ Admin user updated\n');
    }
    
    // Final verification
    const verify = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('managed_by', 'added_by', 'password', 'password_hash')
      ORDER BY column_name
    `);
    
    console.log('✓ Column verification:');
    verify.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    const finalCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Total users: ${finalCount.rows[0].count}`);
    
    const admins = await client.query("SELECT username, role FROM users WHERE role = 'admin'");
    console.log(`   Admins: ${admins.rows.length}`);
    if (admins.rows.length > 0) {
      admins.rows.forEach(a => console.log(`     - ${a.username}`));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabase()
  .then(() => {
    console.log('\n🎉 Database fixed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin123');
    console.log('\n✅ Now restart your backend server (Ctrl+C then npm run dev)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error');
    process.exit(1);
  });

