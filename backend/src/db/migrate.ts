import 'dotenv/config';
import { pool } from './pool.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name          TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_orgs_owner ON organizations(owner_id);

      CREATE TABLE IF NOT EXISTS org_profiles (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        source       TEXT NOT NULL CHECK (source IN ('upload', 'onboarding')),
        raw_profile  JSONB,
        ranks        JSONB,
        summary      TEXT,
        created_at   TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_profiles_org ON org_profiles(org_id);
    `);
    console.log('Migration complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
