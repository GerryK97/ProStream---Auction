import mongoose from 'mongoose';
import { User } from '@/models/User';
import { hashPassword, generateUserId } from '@/lib/auth';

/**
 * Seed script to create initial admin user
 * Run with: npx ts-node src/scripts/seed-admin.ts
 */
async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password (initial password: Admin@123)
    const passwordHash = await hashPassword('Admin@123');

    // Create admin user
    const adminUser = new User({
      _id: generateUserId(),
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'Admin',
      status: 'Active',
    });

    await adminUser.save();
    console.log('✓ Admin user created successfully');
    console.log('  Username: admin');
    console.log('  Email: admin@example.com');
    console.log('  Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
