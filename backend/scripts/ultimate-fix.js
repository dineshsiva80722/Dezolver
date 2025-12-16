const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function ultimateFix() {
  // Try all possible databases
  const databases = ['techfolks_db', 'techfolks', 'postgres'];
  
  for (const dbName of databases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking database: ${dbName}`);
    console.log('='.repeat(60));
    
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: dbName,
      user: 'postgres',
      password: 'postgres',
    });
    
    try {
      const client = await pool.connect();
      
      // Check if users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`❌ No users table in ${dbName}\n`);
        client.release();
        await pool.end();
        continue;
      }
      
      console.log(`✓ Users table found in ${dbName}`);
      
      // Count users
      const count = await client.query('SELECT COUNT(*) FROM users');
      console.log(`   Users: ${count.rows[0].count}`);
      
      // Check current columns
      const hasManaged = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'managed_by'
        );
      `);
      
      const hasAdded = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'added_by'
        );
      `);
      
      const hasPasswordHash = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password_hash'
        );
      `);
      
      const hasPassword = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password'
        );
      `);
      
      console.log(`   password_hash column: ${hasPasswordHash.rows[0].exists ? 'YES' : 'NO'}`);
      console.log(`   password column: ${hasPassword.rows[0].exists ? 'YES' : 'NO'}`);
      console.log(`   managed_by column: ${hasManaged.rows[0].exists ? 'YES' : 'NO'}`);
      console.log(`   added_by column: ${hasAdded.rows[0].exists ? 'YES' : 'NO'}`);
      
      // Fix this database
      console.log(`\n🔧 Fixing ${dbName}...`);
      
      // Rename password to password_hash if needed
      if (hasPassword.rows[0].exists && !hasPasswordHash.rows[0].exists) {
        console.log('   Renaming password → password_hash...');
        await client.query('ALTER TABLE users RENAME COLUMN password TO password_hash');
      }
      
      // Add managed_by
      if (!hasManaged.rows[0].exists) {
        console.log('   Adding managed_by column...');
        await client.query('ALTER TABLE users ADD COLUMN managed_by UUID');
        try {
          await client.query('ALTER TABLE users ADD CONSTRAINT fk_users_managed_by FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL');
        } catch (e) {
          // Constraint might already exist
        }
      }
      
      // Add added_by
      if (!hasAdded.rows[0].exists) {
        console.log('   Adding added_by column...');
        await client.query("ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self'");
        await client.query("UPDATE users SET added_by = 'self' WHERE added_by IS NULL");
      }
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by)');
      
      // Ensure admin user
      const hashedPassword = await bcrypt.hash('Admin123', 10);
      await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, role, 
          is_verified, is_active, added_by, rating, max_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (username) 
        DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          role = 'admin',
          added_by = 'self',
          is_verified = true,
          is_active = true
      `, [
        'admin', 'admin@techfolks.com', hashedPassword, 'Admin User', 'admin',
        true, true, 'self', 1500, 1500
      ]);
      
      console.log(`\n✅ ${dbName} is now fully fixed!`);
      
      client.release();
      await pool.end();
      
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        console.log(`❌ Error in ${dbName}: ${error.message}`);
      }
      try {
        await pool.end();
      } catch (e) {}
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 All databases checked and fixed!');
  console.log('='.repeat(60));
  console.log('\n📋 Admin Credentials for ALL databases:');
  console.log('   Username: admin');
  console.log('   Password: Admin123');
  console.log('\n✅ NOW restart your backend server!');
}

ultimateFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });

