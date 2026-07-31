#!/usr/bin/env node
/**
 * Inspect and fix user roles.
 *
 * Roles are only ever assigned by an admin — the issuer auto-provisions
 * `customer` and nothing else — so this script is how the first admin account
 * comes into existence, and how you repair accounts that predate the RBAC work.
 *
 *   node scripts/seed-roles.mjs list
 *   node scripts/seed-roles.mjs set <email> <role>
 *   node scripts/seed-roles.mjs activate <email>
 *   node scripts/seed-roles.mjs repair          # fill schema-required fields
 *
 * MONGODB_URL overrides the default localhost connection.
 */
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { ROLES, isRole, ROLE_PERMISSIONS, APP_ACCESS } from '@elmariam/auth';

const URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB = process.env.MONGODB_DB || 'elmariam';

const [command, ...args] = process.argv.slice(2);

const client = new MongoClient(URL);
await client.connect();
const users = client.db(DB).collection('users');

function appsFor(role) {
  return Object.entries(APP_ACCESS)
    .filter(([, roles]) => roles.includes(role))
    .map(([app]) => app);
}

async function list() {
  const docs = await users.find({}).toArray();
  if (!docs.length) return console.log('No users.');

  for (const u of docs) {
    const role = u.userType;
    const problems = [];
    if (!isRole(role)) problems.push(`invalid role "${role}"`);
    if (!u.username) problems.push('missing username');
    if (!u.id_number) problems.push('missing id_number');
    if (u.isActive === false) problems.push('INACTIVE — cannot log in');
    if (u.isActive === undefined) problems.push('isActive unset');

    console.log(`\n${u.email}`);
    console.log(`  role      ${role}`);
    if (isRole(role)) {
      console.log(`  apps      ${appsFor(role).join(', ') || 'none'}`);
      console.log(`  perms     ${ROLE_PERMISSIONS[role].length}`);
    }
    if (problems.length) console.log(`  ⚠ ${problems.join('; ')}`);
  }
  console.log();
}

async function set(email, role) {
  if (!isRole(role)) {
    console.error(`"${role}" is not a role. Valid: ${ROLES.join(', ')}`);
    process.exit(1);
  }
  const res = await users.updateOne(
    { email },
    { $set: { userType: role, updatedAt: new Date() } },
  );
  if (!res.matchedCount) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }
  console.log(`${email} is now ${role} (apps: ${appsFor(role).join(', ')})`);
}

async function activate(email) {
  const res = await users.updateOne(
    { email },
    { $set: { isActive: true, updatedAt: new Date() } },
  );
  if (!res.matchedCount) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }
  console.log(`${email} activated`);
}

/**
 * Backfills fields the mongoose schema requires but the old issuer never wrote.
 * Only touches documents that are actually missing them.
 */
async function repair() {
  let fixed = 0;
  for (const u of await users.find({}).toArray()) {
    const $set = {};
    if (!u.username) $set.username = String(u.email).split('@')[0];
    if (!u.id_number) $set.id_number = `pending-${randomUUID()}`;
    if (u.isActive === undefined) $set.isActive = true;
    if (u.isVerified === undefined) $set.isVerified = false;
    if (u.firstname === undefined) $set.firstname = '';
    if (u.lastname === undefined) $set.lastname = '';

    if (Object.keys($set).length) {
      $set.updatedAt = new Date();
      await users.updateOne({ _id: u._id }, { $set });
      console.log(`repaired ${u.email}: ${Object.keys($set).join(', ')}`);
      fixed++;
    }
  }
  console.log(fixed ? `\n${fixed} user(s) repaired.` : 'Nothing to repair.');
}

try {
  if (command === 'list') await list();
  else if (command === 'set') await set(args[0], args[1]);
  else if (command === 'activate') await activate(args[0]);
  else if (command === 'repair') await repair();
  else {
    console.log('Usage: seed-roles.mjs list | set <email> <role> | activate <email> | repair');
    process.exit(1);
  }
} finally {
  await client.close();
}
