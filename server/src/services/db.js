import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ─── Auto-migrate schema saat server start ────────────────
const SCHEMA = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    avatar_color VARCHAR(7) DEFAULT '#00E5C3',
    created_at  TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    owner_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code  VARCHAR(8) UNIQUE NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS room_members (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(20) DEFAULT 'editor',
    PRIMARY KEY (room_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID REFERENCES rooms(id) ON DELETE CASCADE UNIQUE,
    content      BYTEA,
    content_text TEXT DEFAULT '',
    updated_at   TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS canvas_shapes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    props      JSONB NOT NULL DEFAULT '{}',
    z_index    INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS doc_snapshots (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
    snapshot   BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
  );
`

export async function connectDB() {
  try {
    await pool.query(SCHEMA)
    console.log('✅ PostgreSQL connected & schema migrated')
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message)
    process.exit(1)
  }
}

// Helper query agar lebih ringkas
export const db = {
  query: (text, params) => pool.query(text, params),

  async findOne(text, params) {
    const { rows } = await pool.query(text, params)
    return rows[0] || null
  },

  async findMany(text, params) {
    const { rows } = await pool.query(text, params)
    return rows
  },
}
