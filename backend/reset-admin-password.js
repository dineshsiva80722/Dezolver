require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'techfolks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function resetPassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log('❌ Usage: node reset-admin-password.js <username> <new-password>');
    console.log('\nExample:');
    console.log('  node reset-admin-password.js admin Admin@123');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // Check if user exists
    const checkUser = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      [username]
    );

    if (checkUser.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      process.exit(1);
    }

    const user = checkUser.rows[0];
    console.log(`\n🔍 Found user: ${user.username} (${user.role})`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE username = $2',
      [hashedPassword, username]
    );

    console.log(`✅ Password reset successful for '${username}'`);
    console.log('\n📝 New login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();
