/**
 * Admin User Seeding Script
 *
 * This script creates an admin user with credentials authentication.
 * Run with: npx tsx scripts/seed-admin.ts
 *
 * You can customize the admin credentials by passing environment variables:
 * ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="YourPassword123" ADMIN_NAME="Admin User" npx tsx scripts/seed-admin.ts
 */

import mongoose from 'mongoose';
import { UserModel } from '../src/models/User';
import { generateId } from '../src/lib/id-generator';
import { hashPassword } from '../src/lib/password';

// Admin credentials (change these or use environment variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@prostream.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'ProStream Admin';

async function seedAdmin() {
  try {
    console.log('🌱 Starting admin user seeding...');

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({
      email: ADMIN_EMAIL.toLowerCase()
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user with email ${ADMIN_EMAIL} already exists`);
      console.log(`   User ID: ${existingAdmin._id}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Auth Method: ${existingAdmin.authMethod}`);

      // Ask if we should update
      console.log('\n🔄 If you want to update the password, please delete the user first or use a different email.');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // Generate user ID
    const userId = generateId('user');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new UserModel({
      _id: userId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      authMethod: 'credentials',
      role: 'admin',
      assignedTournaments: [],
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Keep these credentials secure!');
    console.log('💡 You can now login at: http://localhost:3001/login');

    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the seeding script
seedAdmin();
