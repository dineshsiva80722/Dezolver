import 'dotenv/config';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/models/User.entity';
import { UserRole } from '../src/types/enums';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin2' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    
    const adminUser = userRepository.create({
      username: 'admin2',
      email: 'admin2@techfolks.com',
      password: hashedPassword,
      full_name: 'System Administrator 2',
      role: UserRole.ADMIN,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: Admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();