const { Pool } = require('pg');
const { execSync } = require('child_process');

// Connect to techfolks_db
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'techfolks_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initAndMigrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if users table exists...\n');
    
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('⚠️  Users table does not exist. Database needs initialization.\n');
      console.log('📝 Creating tables with TypeORM...\n');
      
      // Run TypeORM synchronize temporarily
      console.log('💡 Tip: Starting backend server will create tables automatically.\n');
      console.log('   Or you can run: npm run typeorm schema:sync\n');
      
      // For now, let's create just the essential structure
      console.log('📦 Creating minimal schema...\n');
      
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          phone_number VARCHAR(20),
          avatar_url VARCHAR(500),
          bio TEXT,
          country VARCHAR(100),
          institution VARCHAR(255),
          github_username VARCHAR(100),
          linkedin_url VARCHAR(500),
          website_url VARCHAR(500),
          rating INTEGER DEFAULT 1200,
          max_rating INTEGER DEFAULT 1200,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          is_banned BOOLEAN DEFAULT false,
          verification_token VARCHAR(255),
          reset_password_token VARCHAR(255),
          reset_password_expires TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          problems_solved INTEGER DEFAULT 0,
          contests_participated_count INTEGER DEFAULT 0,
          contribution_points INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
      `);
      
      console.log('✅ Basic users table created!\n');
    } else {
      console.log('✅ Users table already exists\n');
    }
    
    // Now add manager-student columns
    console.log('🚀 Adding manager-student hierarchy columns...\n');
    
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
          ELSE
              RAISE NOTICE 'managed_by column already exists';
          END IF;
      END $$;
      
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'added_by'
          ) THEN
              ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self';
              RAISE NOTICE 'Added added_by column';
          ELSE
              RAISE NOTICE 'added_by column already exists';
          END IF;
      END $$;
      
      CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by);
      
      UPDATE users SET added_by = 'self' WHERE added_by IS NULL;
    `);
    
    console.log('✅ Manager-student hierarchy added successfully!\n');
    console.log('Summary:');
    console.log('  ✓ managed_by column (links students to managers)');
    console.log('  ✓ added_by column (tracks how user was added)');
    console.log('  ✓ Indexes created for performance');
    console.log('  ✓ role column supports: user, manager, admin, etc.\n');
    
    // Verify
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('managed_by', 'added_by', 'role')
      ORDER BY column_name
    `);
    
    console.log('✓ Verification:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initAndMigrate()
  .then(() => {
    console.log('\n🎉 Database initialized and migrated successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start backend: npm run dev');
    console.log('  2. Admin can create managers: POST /api/admin/managers');
    console.log('  3. Managers can add students: POST /api/managers/students\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

