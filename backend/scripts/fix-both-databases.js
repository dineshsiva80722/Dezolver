const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fixDatabase(dbName) {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: dbName,
    user: 'postgres',
    password: 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log(`\n🔧 Fixing database: ${dbName}`);
    console.log('='.repeat(50));
    
    // Add managed_by column
    try {
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
                RAISE NOTICE 'Added managed_by column';
            END IF;
        END $$;
      `);
      console.log('✅ managed_by column ensured');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
    }
    
    // Add added_by column
    try {
      await client.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'added_by'
            ) THEN
                ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self';
                RAISE NOTICE 'Added added_by column';
            END IF;
        END $$;
      `);
      console.log('✅ added_by column ensured');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
    }
    
    // Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by);
    `);
    console.log('✅ Indexes created');
    
    // Update existing users
    await client.query("UPDATE users SET added_by = 'self' WHERE added_by IS NULL");
    console.log('✅ Existing users updated');
    
    // Create/update admin user
    const adminExists = await client.query("SELECT id FROM users WHERE username = 'admin'");
    
    if (adminExists.rows.length === 0) {
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
      console.log('✅ Admin user created');
    } else {
      const hashedPassword = await bcrypt.hash('Admin123', 10);
      await client.query(
        "UPDATE users SET password = $1, role = 'admin', added_by = 'self' WHERE username = 'admin'",
        [hashedPassword]
      );
      console.log('✅ Admin user updated');
    }
    
    // Verify
    const count = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Total users in ${dbName}: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error(`\n❌ Error in ${dbName}:`, error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

async function fixAll() {
  try {
    await fixDatabase('techfolks_db');
    await fixDatabase('techfolks');
    
    console.log('\n🎉 Both databases fixed successfully!');
    console.log('\n📋 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin123');
    console.log('\n✅ Restart your backend server and try logging in!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

fixAll();

