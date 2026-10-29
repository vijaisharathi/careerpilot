import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user.model';

// Load environment configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai';

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@careerpilot.ai').trim().toLowerCase();
  const name = (args[1] || process.env.ADMIN_NAME || 'Platform Administrator').trim();
  const password = args[2] || process.env.ADMIN_PASSWORD || 'AdminPass123!@#';

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    console.error('Error: Please provide a valid email address.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`Connecting to database at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`User with email "${email}" already exists. Upgrading to admin role and updating status...`);
      existing.role = 'admin';
      existing.status = 'active';
      existing.name = name;
      existing.password = password; // Will be hashed by userSchema.pre('save')
      await existing.save();
      console.log(`Successfully updated administrator account: ${email}`);
    } else {
      const admin = new User({
        name,
        email,
        password,
        role: 'admin',
        status: 'active',
        lastLoginAt: new Date(),
      });

      await admin.save();
      console.log(`Successfully provisioned new administrator account:`);
      console.log(`- ID: ${admin._id.toString()}`);
      console.log(`- Name: ${admin.name}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.role}`);
    }
  } catch (err) {
    console.error('Error provisioning administrator:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

