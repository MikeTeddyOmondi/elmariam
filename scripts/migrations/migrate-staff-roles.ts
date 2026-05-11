/**
 * Migration: staff → receptionist/barista/waiter
 *
 * Old schema had userType: "staff" (a catch-all).
 * New schema requires specific roles: receptionist | barista | waiter | management.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... DEFAULT_ROLE=receptionist npx ts-node migrate-staff-roles.ts
 *
 * Set DEFAULT_ROLE to the target role for all existing "staff" users.
 * Alternatively, edit the ROLE_MAP below to assign roles per email.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elmariam';
const DEFAULT_ROLE = (process.env.DEFAULT_ROLE as string) || 'receptionist';

const VALID_ROLES = ['receptionist', 'barista', 'waiter', 'management'] as const;
type StaffRole = (typeof VALID_ROLES)[number];

if (!VALID_ROLES.includes(DEFAULT_ROLE as StaffRole)) {
  console.error(`Invalid DEFAULT_ROLE "${DEFAULT_ROLE}". Must be one of: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

// Optional: map specific emails to specific roles.
// Add entries here before running if you need per-user control.
const ROLE_MAP: Record<string, StaffRole> = {
  // 'alice@example.com': 'barista',
  // 'bob@example.com': 'waiter',
};

const UserSchema = new mongoose.Schema({
  email: String,
  userType: String,
  openauth_subject_id: String,
}, { strict: false });

async function run() {
  console.log(`Connecting to ${MONGODB_URI}…`);
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.model('User', UserSchema, 'users');

  const staffUsers = await User.find({ userType: 'staff' });
  console.log(`Found ${staffUsers.length} user(s) with userType "staff".`);

  if (staffUsers.length === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const user of staffUsers) {
    const email = user.get('email') as string;
    const newRole: StaffRole = ROLE_MAP[email] ?? (DEFAULT_ROLE as StaffRole);
    await User.updateOne({ _id: user._id }, { $set: { userType: newRole } });
    console.log(`  ${email} → ${newRole}`);
    updated++;
  }

  console.log(`\nMigrated ${updated} user(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
