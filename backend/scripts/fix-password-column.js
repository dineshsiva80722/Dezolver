const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixPasswordColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking password column...\n');
    
    // Check what password column exists
    const passwordCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password', 'password_hash')
    `);
    
    console.log('Current password columns:');
    passwordCol.rows.forEach(r => console.log(`  - ${r.column_name}`));
    
    const hasPassword = passwordCol.rows.some(r => r.column_name === 'password');
    const hasPasswordHash = passwordCol.rows.some(r => r.column_name === 'password_hash');
    
    if (hasPassword && !hasPasswordHash) {
      console.log('\n📝 Renaming "password" to "password_hash"...');
      await client.query('ALTER TABLE users RENAME COLUMN password TO password_hash');
      console.log('✅ Column renamed successfully!\n');
    } else if (!hasPassword && !hasPasswordHash) {
      console.log('\n📝 Adding password_hash column...');
      await client.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)');
      console.log('✅ Column added!\n');
    } else {
      console.log('\n✅ password_hash column already exists correctly!\n');
    }
    
    // Ensure admin user exists
    console.log('📝 Ensuring admin user exists...\n');
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
    
    console.log('✅ Admin user ready!\n');
    
    // Verify final state
    const finalCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_hash', 'managed_by', 'added_by')
      ORDER BY column_name
    `);
    
    console.log('✓ Final verification:');
    finalCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin123');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPasswordColumn()
  .then(() => {
    console.log('\n🎉 Database is ready!');
    console.log('\n✅ Restart backend: npm run dev');
    console.log('✅ Then login with admin/Admin123');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error');
    process.exit(1);
  });

