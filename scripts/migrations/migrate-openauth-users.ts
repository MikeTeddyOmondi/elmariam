/**
 * Migration: register existing MongoDB users in OpenAuth
 *
 * Pre-rewrite users exist in MongoDB with email + password (or no password).
 * The new system uses OpenAuth PasswordProvider for authentication.
 * This script creates OpenAuth subject entries for users who don't yet have one.
 *
 * It does NOT reset passwords — users will need to use the "forgot password" flow
 * (or have a temporary password set via TEMP_PASSWORD) to log in the first time.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... OPENAUTH_ISSUER=http://localhost:3100 TEMP_PASSWORD=Change1234! \
 *     npx ts-node migrate-openauth-users.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elmariam';
const OPENAUTH_ISSUER = process.env.OPENAUTH_ISSUER || 'http://localhost:3100';
const TEMP_PASSWORD = process.env.TEMP_PASSWORD;

if (!TEMP_PASSWORD) {
  console.error('TEMP_PASSWORD env var is required. Set a secure temporary password for migrated users.');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: String,
  userType: String,
  openauth_subject_id: String,
}, { strict: false });

async function registerWithOpenAuth(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${OPENAUTH_ISSUER}/password/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, client_id: 'migration' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAuth registration failed for ${email}: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.subject ?? data.id ?? null;
}

async function run() {
  console.log(`Connecting to ${MONGODB_URI}…`);
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.model('User', UserSchema, 'users');

  const unmigrated = await User.find({
    $or: [
      { openauth_subject_id: { $exists: false } },
      { openauth_subject_id: null },
      { openauth_subject_id: '' },
    ],
  });

  console.log(`Found ${unmigrated.length} user(s) without an OpenAuth subject.`);

  if (unmigrated.length === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let migrated = 0;
  let failed = 0;

  for (const user of unmigrated) {
    const email = user.get('email') as string;
    if (!email) {
      console.warn(`  Skipping user ${user._id} — no email.`);
      continue;
    }

    try {
      const subjectId = await registerWithOpenAuth(email, TEMP_PASSWORD!);
      if (subjectId) {
        await User.updateOne({ _id: user._id }, { $set: { openauth_subject_id: subjectId } });
        console.log(`  ✓ ${email} registered (subject: ${subjectId})`);
      } else {
        console.warn(`  ? ${email} — registration succeeded but no subject ID returned`);
      }
      migrated++;
    } catch (err: any) {
      console.error(`  ✗ ${email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Failed: ${failed}.`);
  if (migrated > 0) {
    console.log(`\nReminder: migrated users must change their temporary password on first login.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
