const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function verifySuperAdmin() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Super Admin user...\n');

    // Check if super admin exists
    const result = await client.query(
      `SELECT id, username, email, role, is_active, is_verified, password_hash
       FROM users
       WHERE username = $1 OR email = $2`,
      ['superadmin', 'superadmin@techfolks.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Super Admin user not found in database!\n');
      return;
    }

    const user = result.rows[0];
    console.log('✅ Super Admin user found!\n');
    console.log('User Details:');
    console.log('=============');
    console.log(`ID:          ${user.id}`);
    console.log(`Username:    ${user.username}`);
    console.log(`Email:       ${user.email}`);
    console.log(`Role:        ${user.role}`);
    console.log(`Active:      ${user.is_active}`);
    console.log(`Verified:    ${user.is_verified}`);
    console.log(`Password Hash Exists: ${!!user.password_hash}\n`);

    // Test password
    const testPassword = 'SuperAdmin123!';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password_hash);

    console.log('Password Verification:');
    console.log('=====================');
    console.log(`Test Password: ${testPassword}`);
    console.log(`Password Valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}\n`);

    if (!isPasswordValid) {
      console.log('⚠️  Password does not match! Let me check what the issue might be...\n');

      // Check if the password is hashed
      console.log(`Password hash length: ${user.password_hash?.length || 0}`);
      console.log(`Expected bcrypt hash length: 60\n`);
    }

    // Check role
    if (user.role !== 'super_admin') {
      console.log(`⚠️  Role is "${user.role}" instead of "super_admin"\n`);
    }

    // Check if user is active and verified
    if (!user.is_active) {
      console.log('⚠️  User is not active!\n');
    }
    if (!user.is_verified) {
      console.log('⚠️  User is not verified!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifySuperAdmin()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
